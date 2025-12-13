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
        response = api_client.post(
            f'/api/exchanges/{exchange_id}/propose-datetime',
            {'date': '2025-02-15', 'time': '14:00'}
        )
        
        assert response.status_code == status.HTTP_200_OK
        # API returns date object
        assert str(response.data['proposed_date']) == '2025-02-15'
        
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
    """Integration tests for want (request) scenarios"""
    
    @patch('rest_api.views.send_notification')
    def test_want_creation(self, mock_notify, api_client, db):
        """Test want creation"""
        
        # User creates a want (looking for help)
        want_creator, creator_tb = create_user_with_timebank(initial_credits=5)
        
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

