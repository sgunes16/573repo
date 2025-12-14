"""
Unit tests for Exchange views
"""
import pytest
from unittest.mock import patch, MagicMock
from rest_framework import status

from rest_api.views import (
    CreateExchangeView, ExchangeDetailView, MyExchangesView,
    AcceptExchangeView, RejectExchangeView, CancelExchangeView,
    ConfirmCompletionView, SubmitRatingView, ProposeDateTimeView
)
from rest_api.models import Exchange, TimeBank, TimeBankTransaction
from tests.factories import (
    UserFactory, OfferFactory, ExchangeFactory, 
    AcceptedExchangeFactory, CompletedExchangeFactory,
    create_user_with_timebank
)
from rest_api.auth.views import password_hash


class TestCreateExchangeView:
    """Tests for CreateExchangeView"""
    
    def test_create_exchange_success(self, authenticated_client):
        """Test successful exchange creation"""
        client, user = authenticated_client
        
        # Create provider with timebank
        provider, provider_tb = create_user_with_timebank()
        offer = OfferFactory(user=provider, time_required=1)
        
        # Create timebank for requester
        TimeBank.objects.create(
            user=user, amount=5, available_amount=5, 
            blocked_amount=0, total_amount=5
        )
        
        response = client.post('/api/exchanges', {'offer_id': offer.id})
        
        assert response.status_code == status.HTTP_201_CREATED
        assert 'exchange_id' in response.data
        assert 'time_frozen' in response.data
        assert response.data['time_frozen'] == offer.time_required
    
    def test_create_exchange_requires_offer_id(self, authenticated_client):
        """Test that offer_id is required"""
        client, _ = authenticated_client
        
        response = client.post('/api/exchanges', {})
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'offer_id' in response.data.get('error', '').lower()
    
    def test_create_exchange_own_offer_fails(self, authenticated_client):
        """Test that user cannot create exchange for own offer"""
        client, user = authenticated_client
        
        # Create timebank for user
        TimeBank.objects.create(
            user=user, amount=5, available_amount=5,
            blocked_amount=0, total_amount=5
        )
        
        offer = OfferFactory(user=user)
        
        response = client.post('/api/exchanges', {'offer_id': offer.id})
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'own' in response.data.get('error', '').lower()
    
    def test_create_exchange_insufficient_credits(self, authenticated_client):
        """Test exchange creation fails with insufficient credits"""
        client, user = authenticated_client
        
        # Create timebank with insufficient credits
        TimeBank.objects.create(
            user=user, amount=0, available_amount=0,
            blocked_amount=0, total_amount=0
        )
        
        provider, _ = create_user_with_timebank()
        offer = OfferFactory(user=provider, time_required=5)
        
        response = client.post('/api/exchanges', {'offer_id': offer.id})
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'insufficient' in response.data.get('error', '').lower()
    
    def test_create_exchange_blocks_requester_credits(self, authenticated_client):
        """Test that creating exchange blocks requester's credits"""
        client, user = authenticated_client
        
        # Create timebank for requester
        timebank = TimeBank.objects.create(
            user=user, amount=5, available_amount=5,
            blocked_amount=0, total_amount=5
        )
        
        provider, _ = create_user_with_timebank()
        offer = OfferFactory(user=provider, time_required=2)
        
        client.post('/api/exchanges', {'offer_id': offer.id})
        
        timebank.refresh_from_db()
        assert timebank.blocked_amount == 2
        assert timebank.available_amount == 3
    
    def test_create_exchange_duplicate_fails(self, authenticated_client):
        """Test that duplicate exchange request fails"""
        client, user = authenticated_client
        
        TimeBank.objects.create(
            user=user, amount=10, available_amount=10,
            blocked_amount=0, total_amount=10
        )
        
        provider, _ = create_user_with_timebank()
        offer = OfferFactory(user=provider, time_required=1)
        
        # First request
        response1 = client.post('/api/exchanges', {'offer_id': offer.id})
        assert response1.status_code == status.HTTP_201_CREATED
        
        # Duplicate request
        response2 = client.post('/api/exchanges', {'offer_id': offer.id})
        assert response2.status_code == status.HTTP_400_BAD_REQUEST
        assert 'already' in response2.data.get('error', '').lower()


class TestAcceptExchangeView:
    """Tests for AcceptExchangeView"""
    
    def test_accept_exchange_success(self, api_client):
        """Test provider can accept pending exchange"""
        # Create exchange with proper setup
        provider, provider_tb = create_user_with_timebank()
        requester, requester_tb = create_user_with_timebank()
        
        offer = OfferFactory(user=provider)
        exchange = ExchangeFactory(
            offer=offer, provider=provider, requester=requester,
            status='PENDING'
        )
        
        # Authenticate as provider
        from rest_api.auth.serializers import get_tokens_for_user
        tokens = get_tokens_for_user(provider)
        api_client.cookies['access_token'] = tokens['access']
        
        response = api_client.post(f'/api/exchanges/{exchange.id}/accept')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'ACCEPTED'
        
        exchange.refresh_from_db()
        assert exchange.status == 'ACCEPTED'
    
    def test_accept_exchange_non_provider_fails(self, api_client):
        """Test non-provider cannot accept exchange"""
        provider, _ = create_user_with_timebank()
        requester, _ = create_user_with_timebank()
        other_user, _ = create_user_with_timebank()
        
        offer = OfferFactory(user=provider)
        exchange = ExchangeFactory(
            offer=offer, provider=provider, requester=requester
        )
        
        # Authenticate as other user (not provider)
        from rest_api.auth.serializers import get_tokens_for_user
        tokens = get_tokens_for_user(other_user)
        api_client.cookies['access_token'] = tokens['access']
        
        response = api_client.post(f'/api/exchanges/{exchange.id}/accept')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_accept_non_pending_fails(self, api_client):
        """Test accepting non-pending exchange fails"""
        provider, _ = create_user_with_timebank()
        requester, _ = create_user_with_timebank()
        
        offer = OfferFactory(user=provider)
        exchange = ExchangeFactory(
            offer=offer, provider=provider, requester=requester,
            status='CANCELLED'
        )
        
        from rest_api.auth.serializers import get_tokens_for_user
        tokens = get_tokens_for_user(provider)
        api_client.cookies['access_token'] = tokens['access']
        
        response = api_client.post(f'/api/exchanges/{exchange.id}/accept')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestRejectExchangeView:
    """Tests for RejectExchangeView"""
    
    def test_reject_exchange_success(self, api_client):
        """Test provider can reject pending exchange"""
        provider, _ = create_user_with_timebank()
        requester, requester_tb = create_user_with_timebank()
        
        # Block some credits for the exchange
        requester_tb.block_credit(1)
        
        offer = OfferFactory(user=provider, time_required=1)
        exchange = ExchangeFactory(
            offer=offer, provider=provider, requester=requester,
            status='PENDING', time_spent=1
        )
        
        from rest_api.auth.serializers import get_tokens_for_user
        tokens = get_tokens_for_user(provider)
        api_client.cookies['access_token'] = tokens['access']
        
        response = api_client.post(f'/api/exchanges/{exchange.id}/reject')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'CANCELLED'
        
        # Verify credits unblocked
        requester_tb.refresh_from_db()
        assert requester_tb.blocked_amount == 0
    
    def test_reject_non_provider_fails(self, api_client):
        """Test non-provider cannot reject exchange"""
        provider, _ = create_user_with_timebank()
        requester, _ = create_user_with_timebank()
        
        offer = OfferFactory(user=provider)
        exchange = ExchangeFactory(
            offer=offer, provider=provider, requester=requester
        )
        
        # Authenticate as requester (not provider)
        from rest_api.auth.serializers import get_tokens_for_user
        tokens = get_tokens_for_user(requester)
        api_client.cookies['access_token'] = tokens['access']
        
        response = api_client.post(f'/api/exchanges/{exchange.id}/reject')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestCancelExchangeView:
    """Tests for CancelExchangeView"""
    
    def test_cancel_exchange_success(self, api_client):
        """Test requester can cancel their exchange"""
        provider, _ = create_user_with_timebank()
        requester, requester_tb = create_user_with_timebank()
        
        requester_tb.block_credit(1)
        
        offer = OfferFactory(user=provider, time_required=1)
        exchange = ExchangeFactory(
            offer=offer, provider=provider, requester=requester,
            status='PENDING', time_spent=1
        )
        
        from rest_api.auth.serializers import get_tokens_for_user
        tokens = get_tokens_for_user(requester)
        api_client.cookies['access_token'] = tokens['access']
        
        response = api_client.post(f'/api/exchanges/{exchange.id}/cancel')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'CANCELLED'
        
        requester_tb.refresh_from_db()
        assert requester_tb.blocked_amount == 0
    
    def test_cancel_accepted_exchange_success(self, api_client):
        """Test requester can cancel accepted exchange"""
        provider, _ = create_user_with_timebank()
        requester, requester_tb = create_user_with_timebank()
        
        requester_tb.block_credit(1)
        
        offer = OfferFactory(user=provider, time_required=1)
        exchange = ExchangeFactory(
            offer=offer, provider=provider, requester=requester,
            status='ACCEPTED', time_spent=1
        )
        
        from rest_api.auth.serializers import get_tokens_for_user
        tokens = get_tokens_for_user(requester)
        api_client.cookies['access_token'] = tokens['access']
        
        response = api_client.post(f'/api/exchanges/{exchange.id}/cancel')
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_cancel_non_requester_fails(self, api_client):
        """Test non-requester cannot cancel exchange"""
        provider, _ = create_user_with_timebank()
        requester, _ = create_user_with_timebank()
        
        offer = OfferFactory(user=provider)
        exchange = ExchangeFactory(
            offer=offer, provider=provider, requester=requester
        )
        
        # Authenticate as provider (not requester)
        from rest_api.auth.serializers import get_tokens_for_user
        tokens = get_tokens_for_user(provider)
        api_client.cookies['access_token'] = tokens['access']
        
        response = api_client.post(f'/api/exchanges/{exchange.id}/cancel')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_cancel_with_provider_confirmed_fails(self, api_client):
        """Test cannot cancel when provider has confirmed"""
        provider, _ = create_user_with_timebank()
        requester, requester_tb = create_user_with_timebank()
        
        offer = OfferFactory(user=provider)
        exchange = ExchangeFactory(
            offer=offer, provider=provider, requester=requester,
            status='ACCEPTED', provider_confirmed=True
        )
        
        from rest_api.auth.serializers import get_tokens_for_user
        tokens = get_tokens_for_user(requester)
        api_client.cookies['access_token'] = tokens['access']
        
        response = api_client.post(f'/api/exchanges/{exchange.id}/cancel')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestConfirmCompletionView:
    """Tests for ConfirmCompletionView"""
    
    def test_requester_confirm_success(self, api_client):
        """Test requester can confirm completion"""
        provider, provider_tb = create_user_with_timebank()
        requester, requester_tb = create_user_with_timebank()
        
        offer = OfferFactory(user=provider, time_required=1)
        exchange = AcceptedExchangeFactory(
            offer=offer, provider=provider, requester=requester,
            time_spent=1
        )
        
        from rest_api.auth.serializers import get_tokens_for_user
        tokens = get_tokens_for_user(requester)
        api_client.cookies['access_token'] = tokens['access']
        
        response = api_client.post(f'/api/exchanges/{exchange.id}/confirm-completion')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['requester_confirmed'] is True
        assert response.data['provider_confirmed'] is False
        assert response.data['status'] == 'ACCEPTED'  # Not completed yet
    
    def test_provider_confirm_success(self, api_client):
        """Test provider can confirm completion"""
        provider, provider_tb = create_user_with_timebank()
        requester, requester_tb = create_user_with_timebank()
        
        offer = OfferFactory(user=provider, time_required=1)
        exchange = AcceptedExchangeFactory(
            offer=offer, provider=provider, requester=requester,
            time_spent=1
        )
        
        from rest_api.auth.serializers import get_tokens_for_user
        tokens = get_tokens_for_user(provider)
        api_client.cookies['access_token'] = tokens['access']
        
        response = api_client.post(f'/api/exchanges/{exchange.id}/confirm-completion')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['provider_confirmed'] is True
    
    @patch('rest_api.views.send_notification')
    def test_both_confirm_completes_exchange(self, mock_notify, api_client):
        """Test exchange completes when both parties confirm"""
        provider, provider_tb = create_user_with_timebank(initial_credits=0)
        requester, requester_tb = create_user_with_timebank(initial_credits=5)
        
        # Block credits for the exchange
        requester_tb.block_credit(1)
        
        offer = OfferFactory(user=provider, time_required=1)
        exchange = AcceptedExchangeFactory(
            offer=offer, provider=provider, requester=requester,
            time_spent=1, requester_confirmed=True  # Requester already confirmed
        )
        
        from rest_api.auth.serializers import get_tokens_for_user
        tokens = get_tokens_for_user(provider)
        api_client.cookies['access_token'] = tokens['access']
        
        # Provider confirms
        response = api_client.post(f'/api/exchanges/{exchange.id}/confirm-completion')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'COMPLETED'
        
        # Verify time transfer
        provider_tb.refresh_from_db()
        requester_tb.refresh_from_db()
        
        # Provider should receive credits
        assert provider_tb.amount >= 1
    
    def test_confirm_pending_fails(self, api_client):
        """Test cannot confirm pending exchange"""
        provider, _ = create_user_with_timebank()
        requester, _ = create_user_with_timebank()
        
        offer = OfferFactory(user=provider)
        exchange = ExchangeFactory(
            offer=offer, provider=provider, requester=requester,
            status='PENDING'
        )
        
        from rest_api.auth.serializers import get_tokens_for_user
        tokens = get_tokens_for_user(requester)
        api_client.cookies['access_token'] = tokens['access']
        
        response = api_client.post(f'/api/exchanges/{exchange.id}/confirm-completion')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_double_confirm_fails(self, api_client):
        """Test user cannot confirm twice"""
        provider, _ = create_user_with_timebank()
        requester, _ = create_user_with_timebank()
        
        offer = OfferFactory(user=provider)
        exchange = AcceptedExchangeFactory(
            offer=offer, provider=provider, requester=requester,
            requester_confirmed=True  # Already confirmed
        )
        
        from rest_api.auth.serializers import get_tokens_for_user
        tokens = get_tokens_for_user(requester)
        api_client.cookies['access_token'] = tokens['access']
        
        response = api_client.post(f'/api/exchanges/{exchange.id}/confirm-completion')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestProposeDateTimeView:
    """Tests for ProposeDateTimeView"""
    
    def test_propose_datetime_success(self, api_client):
        """Test requester can propose date/time"""
        provider, _ = create_user_with_timebank()
        requester, _ = create_user_with_timebank()
        
        offer = OfferFactory(user=provider)
        exchange = ExchangeFactory(
            offer=offer, provider=provider, requester=requester,
            status='PENDING'
        )
        
        from rest_api.auth.serializers import get_tokens_for_user
        from datetime import date, timedelta
        tokens = get_tokens_for_user(requester)
        api_client.cookies['access_token'] = tokens['access']
        
        future_date = (date.today() + timedelta(days=7)).isoformat()
        
        response = api_client.post(
            f'/api/exchanges/{exchange.id}/propose-datetime',
            {'date': future_date, 'time': '14:00'}
        )
        
        assert response.status_code == status.HTTP_200_OK
        # API returns date object, convert to string for comparison
        proposed_date = response.data['proposed_date']
        assert str(proposed_date) == future_date
    
    def test_propose_datetime_non_requester_fails(self, api_client):
        """Test non-requester cannot propose date/time"""
        provider, _ = create_user_with_timebank()
        requester, _ = create_user_with_timebank()
        
        offer = OfferFactory(user=provider)
        exchange = ExchangeFactory(
            offer=offer, provider=provider, requester=requester
        )
        
        from rest_api.auth.serializers import get_tokens_for_user
        from datetime import date, timedelta
        tokens = get_tokens_for_user(provider)  # Provider, not requester
        api_client.cookies['access_token'] = tokens['access']
        
        future_date = (date.today() + timedelta(days=7)).isoformat()
        
        response = api_client.post(
            f'/api/exchanges/{exchange.id}/propose-datetime',
            {'date': future_date}
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_propose_datetime_requires_date(self, api_client):
        """Test date is required"""
        provider, _ = create_user_with_timebank()
        requester, _ = create_user_with_timebank()
        
        offer = OfferFactory(user=provider)
        exchange = ExchangeFactory(
            offer=offer, provider=provider, requester=requester
        )
        
        from rest_api.auth.serializers import get_tokens_for_user
        tokens = get_tokens_for_user(requester)
        api_client.cookies['access_token'] = tokens['access']
        
        response = api_client.post(
            f'/api/exchanges/{exchange.id}/propose-datetime',
            {'time': '14:00'}  # No date
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_propose_datetime_past_date_fails(self, api_client):
        """Test proposing a past date returns error"""
        provider, _ = create_user_with_timebank()
        requester, _ = create_user_with_timebank()
        
        offer = OfferFactory(user=provider)
        exchange = ExchangeFactory(
            offer=offer, provider=provider, requester=requester,
            status='PENDING'
        )
        
        from rest_api.auth.serializers import get_tokens_for_user
        tokens = get_tokens_for_user(requester)
        api_client.cookies['access_token'] = tokens['access']
        
        response = api_client.post(
            f'/api/exchanges/{exchange.id}/propose-datetime',
            {'date': '2020-01-01', 'time': '14:00'}  # Past date
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data.get('code') == 'PAST_DATE'
        assert 'past' in response.data.get('error', '').lower()
    
    def test_propose_datetime_today_succeeds(self, api_client):
        """Test proposing today's date succeeds"""
        provider, _ = create_user_with_timebank()
        requester, _ = create_user_with_timebank()
        
        offer = OfferFactory(user=provider)
        exchange = ExchangeFactory(
            offer=offer, provider=provider, requester=requester,
            status='PENDING'
        )
        
        from rest_api.auth.serializers import get_tokens_for_user
        from datetime import date
        tokens = get_tokens_for_user(requester)
        api_client.cookies['access_token'] = tokens['access']
        
        today = date.today().isoformat()
        
        response = api_client.post(
            f'/api/exchanges/{exchange.id}/propose-datetime',
            {'date': today, 'time': '14:00'}
        )
        
        assert response.status_code == status.HTTP_200_OK


class TestSubmitRatingView:
    """Tests for SubmitRatingView"""
    
    def test_submit_rating_success(self, api_client):
        """Test user can submit rating for completed exchange"""
        provider, _ = create_user_with_timebank()
        requester, _ = create_user_with_timebank()
        
        offer = OfferFactory(user=provider)
        exchange = CompletedExchangeFactory(
            offer=offer, provider=provider, requester=requester
        )
        
        from rest_api.auth.serializers import get_tokens_for_user
        tokens = get_tokens_for_user(requester)
        api_client.cookies['access_token'] = tokens['access']
        
        response = api_client.post(
            f'/api/exchanges/{exchange.id}/rate',
            {
                'communication': 5,
                'punctuality': 4,
                'would_recommend': True,
                'comment': 'Great experience!'
            },
            format='json'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert 'rating' in response.data
    
    def test_submit_rating_non_completed_fails(self, api_client):
        """Test cannot rate non-completed exchange"""
        provider, _ = create_user_with_timebank()
        requester, _ = create_user_with_timebank()
        
        offer = OfferFactory(user=provider)
        exchange = AcceptedExchangeFactory(
            offer=offer, provider=provider, requester=requester
        )
        
        from rest_api.auth.serializers import get_tokens_for_user
        tokens = get_tokens_for_user(requester)
        api_client.cookies['access_token'] = tokens['access']
        
        response = api_client.post(
            f'/api/exchanges/{exchange.id}/rate',
            {'communication': 5, 'punctuality': 4, 'would_recommend': True}
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_submit_rating_missing_fields(self, api_client):
        """Test rating requires all fields"""
        provider, _ = create_user_with_timebank()
        requester, _ = create_user_with_timebank()
        
        offer = OfferFactory(user=provider)
        exchange = CompletedExchangeFactory(
            offer=offer, provider=provider, requester=requester
        )
        
        from rest_api.auth.serializers import get_tokens_for_user
        tokens = get_tokens_for_user(requester)
        api_client.cookies['access_token'] = tokens['access']
        
        # Missing punctuality
        response = api_client.post(
            f'/api/exchanges/{exchange.id}/rate',
            {'communication': 5, 'would_recommend': True}
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestMyExchangesView:
    """Tests for MyExchangesView"""
    
    def test_get_my_exchanges(self, api_client):
        """Test user can get their exchanges"""
        user, _ = create_user_with_timebank()
        other_user, _ = create_user_with_timebank()
        
        # Create exchanges where user is provider
        offer1 = OfferFactory(user=user)
        exchange1 = ExchangeFactory(offer=offer1, provider=user, requester=other_user)
        
        # Create exchanges where user is requester
        offer2 = OfferFactory(user=other_user)
        exchange2 = ExchangeFactory(offer=offer2, provider=other_user, requester=user)
        
        from rest_api.auth.serializers import get_tokens_for_user
        tokens = get_tokens_for_user(user)
        api_client.cookies['access_token'] = tokens['access']
        
        response = api_client.get('/api/my-exchanges')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2


class TestExchangeDetailView:
    """Tests for ExchangeDetailView"""
    
    def test_get_exchange_detail(self, api_client):
        """Test user can get exchange details"""
        provider, _ = create_user_with_timebank()
        requester, _ = create_user_with_timebank()
        
        offer = OfferFactory(user=provider)
        exchange = ExchangeFactory(
            offer=offer, provider=provider, requester=requester
        )
        
        from rest_api.auth.serializers import get_tokens_for_user
        tokens = get_tokens_for_user(requester)
        api_client.cookies['access_token'] = tokens['access']
        
        response = api_client.get(f'/api/exchanges/{exchange.id}')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == exchange.id
    
    def test_get_exchange_detail_non_participant_fails(self, api_client):
        """Test non-participant cannot get exchange details"""
        provider, _ = create_user_with_timebank()
        requester, _ = create_user_with_timebank()
        other_user, _ = create_user_with_timebank()
        
        offer = OfferFactory(user=provider)
        exchange = ExchangeFactory(
            offer=offer, provider=provider, requester=requester
        )
        
        from rest_api.auth.serializers import get_tokens_for_user
        tokens = get_tokens_for_user(other_user)
        api_client.cookies['access_token'] = tokens['access']
        
        response = api_client.get(f'/api/exchanges/{exchange.id}')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

