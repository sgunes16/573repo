"""
Integration tests for complete exchange flow
"""
import pytest
from unittest.mock import patch
from rest_framework import status

from rest_api.models import (
    Offer, Exchange, TimeBank, TimeBankTransaction, 
    ExchangeRating, Notification
)
from tests.factories import (
    UserFactory, OfferFactory, create_user_with_timebank, create_full_user
)
from rest_api.auth.views import password_hash
from rest_api.auth.serializers import get_tokens_for_user


class TestCompleteExchangeFlow:
    """
    Integration test for complete exchange flow:
    Create Offer → Create Exchange → Accept → Propose DateTime → Confirm (both) → Rate
    """
    
    @patch('rest_api.views.send_notification')
    def test_complete_1to1_exchange_flow(self, mock_notify, api_client, db):
        """Test complete 1-to-1 exchange flow from start to finish"""
        
        # === Setup: Create Provider and Requester ===
        provider, provider_tb = create_user_with_timebank(initial_credits=0)
        requester, requester_tb = create_user_with_timebank(initial_credits=5)
        
        # Record initial balances
        provider_initial = provider_tb.amount
        requester_initial = requester_tb.amount
        
        # === Step 1: Provider creates an offer ===
        provider_tokens = get_tokens_for_user(provider)
        api_client.cookies['access_token'] = provider_tokens['access']
        
        response = api_client.post('/api/create-offer', {
            'title': 'Python Tutoring',
            'description': 'Learn Python basics',
            'type': 'offer',
            'time_required': 2,
            'activity_type': '1to1',
            'location': 'Istanbul'
        }, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        offer_id = response.data['offer_id']
        
        offer = Offer.objects.get(id=offer_id)
        assert offer.user == provider
        assert offer.time_required == 2
        
        # === Step 2: Requester creates exchange request ===
        requester_tokens = get_tokens_for_user(requester)
        api_client.cookies['access_token'] = requester_tokens['access']
        
        response = api_client.post('/api/exchanges', {'offer_id': offer_id})
        
        assert response.status_code == status.HTTP_201_CREATED
        exchange_id = response.data['exchange_id']
        
        # Verify credits blocked
        requester_tb.refresh_from_db()
        assert requester_tb.blocked_amount == 2
        assert requester_tb.available_amount == requester_initial - 2
        
        exchange = Exchange.objects.get(id=exchange_id)
        assert exchange.status == 'PENDING'
        assert exchange.requester == requester
        assert exchange.provider == provider
        
        # === Step 3: Requester proposes date/time ===
        from datetime import date, timedelta
        future_date = (date.today() + timedelta(days=30)).isoformat()
        
        response = api_client.post(
            f'/api/exchanges/{exchange_id}/propose-datetime',
            {'date': future_date, 'time': '14:00'}
        )
        
        assert response.status_code == status.HTTP_200_OK
        # API returns date object
        assert str(response.data['proposed_date']) == future_date
        
        # === Step 4: Provider accepts the exchange ===
        api_client.cookies['access_token'] = provider_tokens['access']
        
        response = api_client.post(f'/api/exchanges/{exchange_id}/accept')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'ACCEPTED'
        
        exchange.refresh_from_db()
        assert exchange.status == 'ACCEPTED'
        
        # === Step 5: Requester confirms completion ===
        api_client.cookies['access_token'] = requester_tokens['access']
        
        response = api_client.post(f'/api/exchanges/{exchange_id}/confirm-completion')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['requester_confirmed'] is True
        assert response.data['provider_confirmed'] is False
        assert response.data['status'] == 'ACCEPTED'  # Not completed yet
        
        # === Step 6: Provider confirms completion ===
        api_client.cookies['access_token'] = provider_tokens['access']
        
        response = api_client.post(f'/api/exchanges/{exchange_id}/confirm-completion')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['requester_confirmed'] is True
        assert response.data['provider_confirmed'] is True
        assert response.data['status'] == 'COMPLETED'
        
        # Verify time transfer occurred
        provider_tb.refresh_from_db()
        requester_tb.refresh_from_db()
        
        # Provider receives 2 hours
        assert provider_tb.amount == provider_initial + 2
        
        # Requester spent 2 hours (blocked becomes spent)
        assert requester_tb.amount == requester_initial - 2
        assert requester_tb.blocked_amount == 0
        
        # Verify transaction record created
        assert TimeBankTransaction.objects.filter(
            exchange_id=exchange_id
        ).exists()
        
        # === Step 7: Requester rates the provider ===
        api_client.cookies['access_token'] = requester_tokens['access']
        
        response = api_client.post(
            f'/api/exchanges/{exchange_id}/rate',
            {
                'communication': 5,
                'punctuality': 4,
                'would_recommend': True,
                'comment': 'Great teacher!'
            },
            format='json'
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify rating created
        assert ExchangeRating.objects.filter(
            exchange_id=exchange_id,
            rater=requester,
            ratee=provider
        ).exists()
        
        # === Step 8: Provider rates the requester ===
        api_client.cookies['access_token'] = provider_tokens['access']
        
        response = api_client.post(
            f'/api/exchanges/{exchange_id}/rate',
            {
                'communication': 5,
                'punctuality': 5,
                'would_recommend': True,
                'comment': 'Excellent student!'
            },
            format='json'
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify both ratings exist
        assert ExchangeRating.objects.filter(exchange_id=exchange_id).count() == 2


class TestExchangeCancellationFlow:
    """Integration tests for exchange cancellation scenarios"""
    
    def test_requester_cancels_pending_exchange(self, api_client, db):
        """Test requester cancelling a pending exchange"""
        
        provider, _ = create_user_with_timebank()
        requester, requester_tb = create_user_with_timebank(initial_credits=5)
        
        initial_available = requester_tb.available_amount
        
        # Create offer
        offer = OfferFactory(user=provider, time_required=2)
        
        # Create exchange
        requester_tokens = get_tokens_for_user(requester)
        api_client.cookies['access_token'] = requester_tokens['access']
        
        response = api_client.post('/api/exchanges', {'offer_id': offer.id})
        exchange_id = response.data['exchange_id']
        
        # Verify credits blocked
        requester_tb.refresh_from_db()
        assert requester_tb.blocked_amount == 2
        
        # Cancel exchange
        response = api_client.post(f'/api/exchanges/{exchange_id}/cancel')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'CANCELLED'
        
        # Verify credits returned
        requester_tb.refresh_from_db()
        assert requester_tb.blocked_amount == 0
        assert requester_tb.available_amount == initial_available
    
    def test_provider_rejects_pending_exchange(self, api_client, db):
        """Test provider rejecting a pending exchange"""
        
        provider, _ = create_user_with_timebank()
        requester, requester_tb = create_user_with_timebank(initial_credits=5)
        
        offer = OfferFactory(user=provider, time_required=2)
        
        # Create exchange as requester
        requester_tokens = get_tokens_for_user(requester)
        api_client.cookies['access_token'] = requester_tokens['access']
        
        response = api_client.post('/api/exchanges', {'offer_id': offer.id})
        exchange_id = response.data['exchange_id']
        
        # Reject as provider
        provider_tokens = get_tokens_for_user(provider)
        api_client.cookies['access_token'] = provider_tokens['access']
        
        response = api_client.post(f'/api/exchanges/{exchange_id}/reject')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'CANCELLED'
        
        # Verify requester's credits returned
        requester_tb.refresh_from_db()
        assert requester_tb.blocked_amount == 0


class TestTimeBankFlow:
    """Integration tests for TimeBank operations"""
    
    def test_timebank_balance_after_multiple_exchanges(self, api_client, db):
        """Test timebank balance after multiple completed exchanges"""
        
        # User A starts with 5 credits
        user_a, tb_a = create_user_with_timebank(initial_credits=5)
        # User B starts with 3 credits
        user_b, tb_b = create_user_with_timebank(initial_credits=3)
        
        # User A provides service to User B (1 hour)
        offer_a = OfferFactory(user=user_a, time_required=1)
        
        # User B requests service
        tokens_b = get_tokens_for_user(user_b)
        api_client.cookies['access_token'] = tokens_b['access']
        
        response = api_client.post('/api/exchanges', {'offer_id': offer_a.id})
        exchange_id = response.data['exchange_id']
        
        # User A accepts
        tokens_a = get_tokens_for_user(user_a)
        api_client.cookies['access_token'] = tokens_a['access']
        api_client.post(f'/api/exchanges/{exchange_id}/accept')
        
        # Both confirm
        with patch('rest_api.views.send_notification'):
            api_client.cookies['access_token'] = tokens_b['access']
            api_client.post(f'/api/exchanges/{exchange_id}/confirm-completion')
            
            api_client.cookies['access_token'] = tokens_a['access']
            api_client.post(f'/api/exchanges/{exchange_id}/confirm-completion')
        
        # Check final balances
        tb_a.refresh_from_db()
        tb_b.refresh_from_db()
        
        # User A should have 6 (5 + 1)
        assert tb_a.amount == 6
        
        # User B should have 2 (3 - 1)
        assert tb_b.amount == 2


class TestGroupOfferFlow:
    """Integration tests for group offer scenarios"""
    
    @patch('rest_api.views.send_notification')
    def test_group_offer_multiple_participants(self, mock_notify, api_client, db):
        """Test group offer with multiple participants"""
        
        # Provider creates group offer for 3 people
        provider, provider_tb = create_user_with_timebank(initial_credits=0)
        
        requester1, tb1 = create_user_with_timebank(initial_credits=5)
        requester2, tb2 = create_user_with_timebank(initial_credits=5)
        requester3, tb3 = create_user_with_timebank(initial_credits=5)
        
        # Create group offer
        tokens_provider = get_tokens_for_user(provider)
        api_client.cookies['access_token'] = tokens_provider['access']
        
        response = api_client.post('/api/create-offer', {
            'title': 'Group Workshop',
            'description': 'Learn together',
            'type': 'offer',
            'time_required': 1,
            'activity_type': 'group',
            'person_count': 3
        }, format='json')
        
        offer_id = response.data['offer_id']
        offer = Offer.objects.get(id=offer_id)
        assert offer.activity_type == 'group'
        assert offer.person_count == 3
        
        # All three requesters join
        for i, (requester, tokens_getter) in enumerate([
            (requester1, get_tokens_for_user(requester1)),
            (requester2, get_tokens_for_user(requester2)),
            (requester3, get_tokens_for_user(requester3))
        ]):
            api_client.cookies['access_token'] = tokens_getter['access']
            response = api_client.post('/api/exchanges', {'offer_id': offer_id})
            assert response.status_code == status.HTTP_201_CREATED
        
        # Verify 3 exchanges created
        exchanges = Exchange.objects.filter(offer_id=offer_id)
        assert exchanges.count() == 3


class TestWantFlow:
    """Integration tests for want (request) scenarios
    
    Want Flow:
    - Want creator (provider): posts want, pays for service (credits blocked on creation)
    - Helper (requester): responds to want, receives payment on completion
    
    Roles are consistent with Offer:
    - Provider = offer/want owner
    - Requester = handshake initiator
    
    Payment is different:
    - Offer: requester pays -> provider receives
    - Want: provider pays -> requester receives
    """
    
    @patch('rest_api.views.send_notification')
    def test_want_creation_blocks_credits(self, mock_notify, api_client, db):
        """Test want creation blocks credits upfront"""
        
        # User creates a want (looking for help)
        want_creator, creator_tb = create_user_with_timebank(initial_credits=5)
        
        # Record initial balance
        initial_available = creator_tb.available_amount
        
        # Create want
        tokens_creator = get_tokens_for_user(want_creator)
        api_client.cookies['access_token'] = tokens_creator['access']
        
        response = api_client.post('/api/create-offer', {
            'title': 'Need Python Help',
            'description': 'Looking for Python tutor',
            'type': 'want',
            'time_required': 2
        }, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert 'offer_id' in response.data
        
        # Verify want was created correctly
        from rest_api.models import Offer
        want = Offer.objects.get(id=response.data['offer_id'])
        assert want.type == 'want'
        assert want.title == 'Need Python Help'
        
        # Verify credits were blocked on creation
        creator_tb.refresh_from_db()
        assert creator_tb.blocked_amount == 2, "Credits should be blocked when want is created"
        assert creator_tb.available_amount == initial_available - 2

    @patch('rest_api.views.send_notification')
    def test_want_creation_insufficient_credits_fails(self, mock_notify, api_client, db):
        """Test that want creation fails if user has insufficient credits"""
        
        # User has 0 credits - can't create want
        want_creator, creator_tb = create_user_with_timebank(initial_credits=0)
        
        tokens_creator = get_tokens_for_user(want_creator)
        api_client.cookies['access_token'] = tokens_creator['access']
        
        response = api_client.post('/api/create-offer', {
            'title': 'Need Python Help',
            'description': 'Looking for Python tutor',
            'type': 'want',
            'time_required': 2
        }, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'credit' in response.data.get('error', '').lower()

    @patch('rest_api.views.send_notification')
    def test_want_exchange_payment_flow(self, mock_notify, api_client, db):
        """
        Test complete Want payment flow:
        - Want creator (provider) PAYS
        - Helper (requester) RECEIVES payment
        """
        
        # === Setup ===
        # Want creator has 5 credits and will PAY for the service
        want_creator, creator_tb = create_user_with_timebank(initial_credits=5)
        # Helper has 0 credits and will RECEIVE payment
        helper, helper_tb = create_user_with_timebank(initial_credits=0)
        
        # Record initial balances
        creator_initial = creator_tb.amount
        helper_initial = helper_tb.amount
        
        # === Step 1: User creates a Want (credits blocked here) ===
        tokens_creator = get_tokens_for_user(want_creator)
        api_client.cookies['access_token'] = tokens_creator['access']
        
        response = api_client.post('/api/create-offer', {
            'title': 'Need Python Help',
            'description': 'Looking for Python tutor',
            'type': 'want',
            'time_required': 2
        }, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        want_id = response.data['offer_id']
        
        # Verify credits blocked on want creation
        creator_tb.refresh_from_db()
        assert creator_tb.blocked_amount == 2, "Want creator's credits should be blocked on creation"
        
        # === Step 2: Helper responds to the want (no credit blocking) ===
        tokens_helper = get_tokens_for_user(helper)
        api_client.cookies['access_token'] = tokens_helper['access']
        
        response = api_client.post('/api/exchanges', {'offer_id': want_id})
        
        assert response.status_code == status.HTTP_201_CREATED
        exchange_id = response.data['exchange_id']
        # For want, no additional blocking happens
        assert response.data['time_frozen'] == 0
        
        # Verify exchange roles
        exchange = Exchange.objects.get(id=exchange_id)
        assert exchange.provider == want_creator, "Want creator should be provider"
        assert exchange.requester == helper, "Helper should be requester"
        
        # === Step 3: Want creator (provider) accepts the exchange ===
        api_client.cookies['access_token'] = tokens_creator['access']
        response = api_client.post(f'/api/exchanges/{exchange_id}/accept')
        assert response.status_code == status.HTTP_200_OK
        
        # === Step 4: Both confirm completion ===
        # Helper (requester) confirms
        api_client.cookies['access_token'] = tokens_helper['access']
        response = api_client.post(f'/api/exchanges/{exchange_id}/confirm-completion')
        assert response.status_code == status.HTTP_200_OK
        
        # Want creator (provider) confirms
        api_client.cookies['access_token'] = tokens_creator['access']
        response = api_client.post(f'/api/exchanges/{exchange_id}/confirm-completion')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'COMPLETED'
        
        # === Verify final balances ===
        creator_tb.refresh_from_db()
        helper_tb.refresh_from_db()
        
        # Want creator (provider) should have PAID (5 - 2 = 3)
        assert creator_tb.amount == creator_initial - 2, \
            f"Want creator should pay. Expected {creator_initial - 2}, got {creator_tb.amount}"
        assert creator_tb.blocked_amount == 0
        
        # Helper (requester) should have RECEIVED payment (0 + 2 = 2)
        assert helper_tb.amount == helper_initial + 2, \
            f"Helper should receive payment. Expected {helper_initial + 2}, got {helper_tb.amount}"

    @patch('rest_api.views.send_notification')
    def test_want_owner_can_reject_exchange(self, mock_notify, api_client, db):
        """Test that want owner (provider) can reject exchange requests
        
        For WANT: credits stay blocked because they're tied to the listing, not the exchange
        """
        
        want_creator, creator_tb = create_user_with_timebank(initial_credits=5)
        helper, helper_tb = create_user_with_timebank(initial_credits=0)
        
        # Create want (credits blocked)
        tokens_creator = get_tokens_for_user(want_creator)
        api_client.cookies['access_token'] = tokens_creator['access']
        
        response = api_client.post('/api/create-offer', {
            'title': 'Need Python Help',
            'description': 'Looking for Python tutor',
            'type': 'want',
            'time_required': 2
        }, format='json')
        
        want_id = response.data['offer_id']
        
        # Verify credits blocked
        creator_tb.refresh_from_db()
        assert creator_tb.blocked_amount == 2
        
        # Helper responds to want
        tokens_helper = get_tokens_for_user(helper)
        api_client.cookies['access_token'] = tokens_helper['access']
        
        response = api_client.post('/api/exchanges', {'offer_id': want_id})
        exchange_id = response.data['exchange_id']
        
        # Want owner (provider) rejects
        api_client.cookies['access_token'] = tokens_creator['access']
        response = api_client.post(f'/api/exchanges/{exchange_id}/reject')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'CANCELLED'
        
        # For WANT: credits stay blocked (tied to listing, not exchange)
        creator_tb.refresh_from_db()
        assert creator_tb.blocked_amount == 2, "Want credits stay blocked until listing is deleted"

    @patch('rest_api.views.send_notification')
    def test_want_helper_can_cancel_exchange(self, mock_notify, api_client, db):
        """Test that helper (requester) can cancel their exchange request
        
        For WANT: credits stay blocked because they're tied to the listing, not the exchange
        """
        
        want_creator, creator_tb = create_user_with_timebank(initial_credits=5)
        helper, helper_tb = create_user_with_timebank(initial_credits=0)
        
        # Create want (credits blocked)
        tokens_creator = get_tokens_for_user(want_creator)
        api_client.cookies['access_token'] = tokens_creator['access']
        
        response = api_client.post('/api/create-offer', {
            'title': 'Need Python Help',
            'description': 'Looking for Python tutor',
            'type': 'want',
            'time_required': 2
        }, format='json')
        
        want_id = response.data['offer_id']
        
        # Helper responds to want
        tokens_helper = get_tokens_for_user(helper)
        api_client.cookies['access_token'] = tokens_helper['access']
        
        response = api_client.post('/api/exchanges', {'offer_id': want_id})
        exchange_id = response.data['exchange_id']
        
        # Helper (requester) cancels their request
        response = api_client.post(f'/api/exchanges/{exchange_id}/cancel')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'CANCELLED'
        
        # For WANT: credits stay blocked (tied to listing, not exchange)
        creator_tb.refresh_from_db()
        assert creator_tb.blocked_amount == 2, "Want credits stay blocked until listing is deleted"

    @patch('rest_api.views.send_notification')
    def test_want_delete_unblocks_credits(self, mock_notify, api_client, db):
        """Test that deleting a want unblocks the creator's credits"""
        
        want_creator, creator_tb = create_user_with_timebank(initial_credits=5)
        
        # Create want (credits blocked)
        tokens_creator = get_tokens_for_user(want_creator)
        api_client.cookies['access_token'] = tokens_creator['access']
        
        response = api_client.post('/api/create-offer', {
            'title': 'Need Python Help',
            'description': 'Looking for Python tutor',
            'type': 'want',
            'time_required': 2
        }, format='json')
        
        want_id = response.data['offer_id']
        
        # Verify credits blocked
        creator_tb.refresh_from_db()
        assert creator_tb.blocked_amount == 2
        assert creator_tb.available_amount == 3
        
        # Delete the want
        response = api_client.delete(f'/api/offers/{want_id}')
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify credits are unblocked
        creator_tb.refresh_from_db()
        assert creator_tb.blocked_amount == 0
        assert creator_tb.available_amount == 5

    @patch('rest_api.views.send_notification')
    def test_want_edit_time_required_adjusts_credits(self, mock_notify, api_client, db):
        """Test that editing want time_required adjusts blocked credits"""
        
        want_creator, creator_tb = create_user_with_timebank(initial_credits=5)
        
        # Create want with 2H (credits blocked)
        tokens_creator = get_tokens_for_user(want_creator)
        api_client.cookies['access_token'] = tokens_creator['access']
        
        response = api_client.post('/api/create-offer', {
            'title': 'Need Python Help',
            'description': 'Looking for Python tutor',
            'type': 'want',
            'time_required': 2
        }, format='json')
        
        want_id = response.data['offer_id']
        
        # Verify 2H blocked
        creator_tb.refresh_from_db()
        assert creator_tb.blocked_amount == 2
        assert creator_tb.available_amount == 3
        
        # Edit to increase to 4H
        response = api_client.put(f'/api/offers/{want_id}', {
            'time_required': 4
        }, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify 4H now blocked
        creator_tb.refresh_from_db()
        assert creator_tb.blocked_amount == 4
        assert creator_tb.available_amount == 1
        
        # Edit to decrease to 1H
        response = api_client.put(f'/api/offers/{want_id}', {
            'time_required': 1
        }, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify 1H now blocked
        creator_tb.refresh_from_db()
        assert creator_tb.blocked_amount == 1
        assert creator_tb.available_amount == 4

    @patch('rest_api.views.send_notification')
    def test_want_edit_insufficient_credits_fails(self, mock_notify, api_client, db):
        """Test that editing want to increase time_required fails if insufficient credits"""
        
        want_creator, creator_tb = create_user_with_timebank(initial_credits=3)
        
        # Create want with 2H (1H available after)
        tokens_creator = get_tokens_for_user(want_creator)
        api_client.cookies['access_token'] = tokens_creator['access']
        
        response = api_client.post('/api/create-offer', {
            'title': 'Need Python Help',
            'description': 'Looking for Python tutor',
            'type': 'want',
            'time_required': 2
        }, format='json')
        
        want_id = response.data['offer_id']
        
        # Verify 2H blocked, 1H available
        creator_tb.refresh_from_db()
        assert creator_tb.blocked_amount == 2
        assert creator_tb.available_amount == 1
        
        # Try to edit to 5H (need 3 more, only have 1)
        response = api_client.put(f'/api/offers/{want_id}', {
            'time_required': 5
        }, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'credit' in response.data.get('error', '').lower()
        
        # Verify credits unchanged
        creator_tb.refresh_from_db()
        assert creator_tb.blocked_amount == 2


class TestOfferEditFlow:
    """Integration tests for offer/want edit scenarios"""
    
    @patch('rest_api.views.send_notification')
    def test_edit_offer_success(self, mock_notify, api_client, db):
        """Test that offer owner can edit their offer"""
        
        user, user_tb = create_user_with_timebank(initial_credits=5)
        
        # Create offer
        tokens = get_tokens_for_user(user)
        api_client.cookies['access_token'] = tokens['access']
        
        response = api_client.post('/api/create-offer', {
            'title': 'Original Title',
            'description': 'Original Description',
            'type': 'offer',
            'time_required': 2
        }, format='json')
        
        offer_id = response.data['offer_id']
        
        # Edit offer
        response = api_client.put(f'/api/offers/{offer_id}', {
            'title': 'Updated Title',
            'description': 'Updated Description',
            'time_required': 3
        }, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify changes
        offer = Offer.objects.get(id=offer_id)
        assert offer.title == 'Updated Title'
        assert offer.description == 'Updated Description'
        assert offer.time_required == 3
    
    @patch('rest_api.views.send_notification')
    def test_edit_offer_with_pending_exchange_fails(self, mock_notify, api_client, db):
        """Test that offer with pending exchange cannot be edited"""
        
        provider, provider_tb = create_user_with_timebank(initial_credits=5)
        requester, requester_tb = create_user_with_timebank(initial_credits=5)
        
        # Create offer
        tokens_provider = get_tokens_for_user(provider)
        api_client.cookies['access_token'] = tokens_provider['access']
        
        response = api_client.post('/api/create-offer', {
            'title': 'My Offer',
            'description': 'Description',
            'type': 'offer',
            'time_required': 2
        }, format='json')
        
        offer_id = response.data['offer_id']
        
        # Create pending exchange
        tokens_requester = get_tokens_for_user(requester)
        api_client.cookies['access_token'] = tokens_requester['access']
        
        api_client.post('/api/exchanges', {'offer_id': offer_id})
        
        # Try to edit offer
        api_client.cookies['access_token'] = tokens_provider['access']
        
        response = api_client.put(f'/api/offers/{offer_id}', {
            'title': 'Updated Title'
        }, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'cannot edit' in response.data.get('error', '').lower()
    
    @patch('rest_api.views.send_notification')
    def test_edit_offer_with_cancelled_exchange_success(self, mock_notify, api_client, db):
        """Test that offer with only cancelled exchanges can be edited"""
        
        provider, provider_tb = create_user_with_timebank(initial_credits=5)
        requester, requester_tb = create_user_with_timebank(initial_credits=5)
        
        # Create offer
        tokens_provider = get_tokens_for_user(provider)
        api_client.cookies['access_token'] = tokens_provider['access']
        
        response = api_client.post('/api/create-offer', {
            'title': 'My Offer',
            'description': 'Description',
            'type': 'offer',
            'time_required': 2
        }, format='json')
        
        offer_id = response.data['offer_id']
        
        # Create and cancel exchange
        tokens_requester = get_tokens_for_user(requester)
        api_client.cookies['access_token'] = tokens_requester['access']
        
        response = api_client.post('/api/exchanges', {'offer_id': offer_id})
        exchange_id = response.data['exchange_id']
        
        # Cancel exchange
        api_client.post(f'/api/exchanges/{exchange_id}/cancel')
        
        # Edit offer should work now
        api_client.cookies['access_token'] = tokens_provider['access']
        
        response = api_client.put(f'/api/offers/{offer_id}', {
            'title': 'Updated Title'
        }, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify changes
        offer = Offer.objects.get(id=offer_id)
        assert offer.title == 'Updated Title'
    
    @patch('rest_api.views.send_notification')
    def test_edit_others_offer_fails(self, mock_notify, api_client, db):
        """Test that user cannot edit others' offers"""
        
        owner, _ = create_user_with_timebank(initial_credits=5)
        other_user, _ = create_user_with_timebank(initial_credits=5)
        
        # Create offer as owner
        tokens_owner = get_tokens_for_user(owner)
        api_client.cookies['access_token'] = tokens_owner['access']
        
        response = api_client.post('/api/create-offer', {
            'title': 'My Offer',
            'description': 'Description',
            'type': 'offer',
            'time_required': 2
        }, format='json')
        
        offer_id = response.data['offer_id']
        
        # Try to edit as other user
        tokens_other = get_tokens_for_user(other_user)
        api_client.cookies['access_token'] = tokens_other['access']
        
        response = api_client.put(f'/api/offers/{offer_id}', {
            'title': 'Hacked Title'
        }, format='json')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestOfferDeleteFlow:
    """Integration tests for offer/want delete scenarios"""
    
    @patch('rest_api.views.send_notification')
    def test_delete_offer_success(self, mock_notify, api_client, db):
        """Test that offer owner can delete their offer"""
        
        user, user_tb = create_user_with_timebank(initial_credits=5)
        
        # Create offer
        tokens = get_tokens_for_user(user)
        api_client.cookies['access_token'] = tokens['access']
        
        response = api_client.post('/api/create-offer', {
            'title': 'My Offer',
            'description': 'Description',
            'type': 'offer',
            'time_required': 2
        }, format='json')
        
        offer_id = response.data['offer_id']
        
        # Delete offer
        response = api_client.delete(f'/api/offers/{offer_id}')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'deleted' in response.data.get('message', '').lower()
        
        # Verify deleted
        assert not Offer.objects.filter(id=offer_id).exists()
    
    @patch('rest_api.views.send_notification')
    def test_delete_offer_with_pending_exchange_fails(self, mock_notify, api_client, db):
        """Test that offer with pending exchange cannot be deleted"""
        
        provider, provider_tb = create_user_with_timebank(initial_credits=5)
        requester, requester_tb = create_user_with_timebank(initial_credits=5)
        
        # Create offer
        tokens_provider = get_tokens_for_user(provider)
        api_client.cookies['access_token'] = tokens_provider['access']
        
        response = api_client.post('/api/create-offer', {
            'title': 'My Offer',
            'description': 'Description',
            'type': 'offer',
            'time_required': 2
        }, format='json')
        
        offer_id = response.data['offer_id']
        
        # Create pending exchange
        tokens_requester = get_tokens_for_user(requester)
        api_client.cookies['access_token'] = tokens_requester['access']
        
        api_client.post('/api/exchanges', {'offer_id': offer_id})
        
        # Try to delete offer
        api_client.cookies['access_token'] = tokens_provider['access']
        
        response = api_client.delete(f'/api/offers/{offer_id}')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'cannot delete' in response.data.get('error', '').lower()
        
        # Verify not deleted
        assert Offer.objects.filter(id=offer_id).exists()
    
    @patch('rest_api.views.send_notification')
    def test_delete_offer_with_cancelled_exchange_success(self, mock_notify, api_client, db):
        """Test that offer with only cancelled exchanges can be deleted"""
        
        provider, provider_tb = create_user_with_timebank(initial_credits=5)
        requester, requester_tb = create_user_with_timebank(initial_credits=5)
        
        # Create offer
        tokens_provider = get_tokens_for_user(provider)
        api_client.cookies['access_token'] = tokens_provider['access']
        
        response = api_client.post('/api/create-offer', {
            'title': 'My Offer',
            'description': 'Description',
            'type': 'offer',
            'time_required': 2
        }, format='json')
        
        offer_id = response.data['offer_id']
        
        # Create and cancel exchange
        tokens_requester = get_tokens_for_user(requester)
        api_client.cookies['access_token'] = tokens_requester['access']
        
        response = api_client.post('/api/exchanges', {'offer_id': offer_id})
        exchange_id = response.data['exchange_id']
        
        # Cancel exchange
        api_client.post(f'/api/exchanges/{exchange_id}/cancel')
        
        # Delete offer should work now
        api_client.cookies['access_token'] = tokens_provider['access']
        
        response = api_client.delete(f'/api/offers/{offer_id}')
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify deleted
        assert not Offer.objects.filter(id=offer_id).exists()
    
    @patch('rest_api.views.send_notification')
    def test_delete_others_offer_fails(self, mock_notify, api_client, db):
        """Test that user cannot delete others' offers"""
        
        owner, _ = create_user_with_timebank(initial_credits=5)
        other_user, _ = create_user_with_timebank(initial_credits=5)
        
        # Create offer as owner
        tokens_owner = get_tokens_for_user(owner)
        api_client.cookies['access_token'] = tokens_owner['access']
        
        response = api_client.post('/api/create-offer', {
            'title': 'My Offer',
            'description': 'Description',
            'type': 'offer',
            'time_required': 2
        }, format='json')
        
        offer_id = response.data['offer_id']
        
        # Try to delete as other user
        tokens_other = get_tokens_for_user(other_user)
        api_client.cookies['access_token'] = tokens_other['access']
        
        response = api_client.delete(f'/api/offers/{offer_id}')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        
        # Verify not deleted
        assert Offer.objects.filter(id=offer_id).exists()
    
    @patch('rest_api.views.send_notification')
    def test_delete_want_unblocks_credits(self, mock_notify, api_client, db):
        """Test that deleting a want unblocks the creator's credits"""
        
        want_creator, creator_tb = create_user_with_timebank(initial_credits=5)
        
        # Create want (credits blocked)
        tokens = get_tokens_for_user(want_creator)
        api_client.cookies['access_token'] = tokens['access']
        
        response = api_client.post('/api/create-offer', {
            'title': 'Need Help',
            'description': 'Looking for help',
            'type': 'want',
            'time_required': 2
        }, format='json')
        
        want_id = response.data['offer_id']
        
        # Verify credits blocked
        creator_tb.refresh_from_db()
        assert creator_tb.blocked_amount == 2
        assert creator_tb.available_amount == 3
        
        # Delete want
        response = api_client.delete(f'/api/offers/{want_id}')
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify credits unblocked
        creator_tb.refresh_from_db()
        assert creator_tb.blocked_amount == 0
        assert creator_tb.available_amount == 5

