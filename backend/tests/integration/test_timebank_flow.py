"""
Integration tests for TimeBank credit management
"""
import pytest
from unittest.mock import patch

from rest_api.models import TimeBank, TimeBankTransaction, Exchange
from tests.factories import (
    UserFactory, OfferFactory, ExchangeFactory,
    create_user_with_timebank
)
from rest_api.auth.serializers import get_tokens_for_user


class TestTimeBankCreditOperations:
    """Integration tests for TimeBank credit operations"""
    
    def test_initial_credit_allocation(self, db):
        """Test new user gets initial credits"""
        user, timebank = create_user_with_timebank(initial_credits=1)
        
        assert timebank.amount == 1
        assert timebank.available_amount == 1
        assert timebank.blocked_amount == 0
        assert timebank.total_amount == 1
    
    def test_credit_blocking_on_exchange_request(self, api_client, db):
        """Test credits are blocked when creating exchange"""
        provider, _ = create_user_with_timebank()
        requester, requester_tb = create_user_with_timebank(initial_credits=10)
        
        offer = OfferFactory(user=provider, time_required=3)
        
        tokens = get_tokens_for_user(requester)
        api_client.cookies['access_token'] = tokens['access']
        
        # Before exchange
        assert requester_tb.available_amount == 10
        assert requester_tb.blocked_amount == 0
        
        # Create exchange
        api_client.post('/api/exchanges', {'offer_id': offer.id})
        
        # After exchange
        requester_tb.refresh_from_db()
        assert requester_tb.available_amount == 7
        assert requester_tb.blocked_amount == 3
        assert requester_tb.amount == 10  # Total unchanged
    
    def test_credit_unblocking_on_cancellation(self, api_client, db):
        """Test credits are unblocked when exchange is cancelled"""
        provider, _ = create_user_with_timebank()
        requester, requester_tb = create_user_with_timebank(initial_credits=10)
        
        offer = OfferFactory(user=provider, time_required=3)
        
        tokens = get_tokens_for_user(requester)
        api_client.cookies['access_token'] = tokens['access']
        
        # Create exchange
        response = api_client.post('/api/exchanges', {'offer_id': offer.id})
        exchange_id = response.data['exchange_id']
        
        # Cancel exchange
        api_client.post(f'/api/exchanges/{exchange_id}/cancel')
        
        # Verify credits restored
        requester_tb.refresh_from_db()
        assert requester_tb.available_amount == 10
        assert requester_tb.blocked_amount == 0
    
    @patch('rest_api.views.send_notification')
    def test_credit_transfer_on_completion(self, mock_notify, api_client, db):
        """Test credits transfer from requester to provider on completion"""
        provider, provider_tb = create_user_with_timebank(initial_credits=5)
        requester, requester_tb = create_user_with_timebank(initial_credits=10)
        
        offer = OfferFactory(user=provider, time_required=2)
        
        # Create exchange
        tokens_req = get_tokens_for_user(requester)
        api_client.cookies['access_token'] = tokens_req['access']
        response = api_client.post('/api/exchanges', {'offer_id': offer.id})
        exchange_id = response.data['exchange_id']
        
        # Provider accepts
        tokens_prov = get_tokens_for_user(provider)
        api_client.cookies['access_token'] = tokens_prov['access']
        api_client.post(f'/api/exchanges/{exchange_id}/accept')
        
        # Both confirm
        api_client.cookies['access_token'] = tokens_req['access']
        api_client.post(f'/api/exchanges/{exchange_id}/confirm-completion')
        
        api_client.cookies['access_token'] = tokens_prov['access']
        api_client.post(f'/api/exchanges/{exchange_id}/confirm-completion')
        
        # Verify transfer
        provider_tb.refresh_from_db()
        requester_tb.refresh_from_db()
        
        assert provider_tb.amount == 7  # 5 + 2
        assert requester_tb.amount == 8  # 10 - 2
        assert requester_tb.blocked_amount == 0
    
    def test_insufficient_credits_blocks_exchange(self, api_client, db):
        """Test exchange creation fails with insufficient credits"""
        provider, _ = create_user_with_timebank()
        requester, requester_tb = create_user_with_timebank(initial_credits=1)
        
        offer = OfferFactory(user=provider, time_required=5)  # Requires 5 hours
        
        tokens = get_tokens_for_user(requester)
        api_client.cookies['access_token'] = tokens['access']
        
        # Should fail - not enough credits
        response = api_client.post('/api/exchanges', {'offer_id': offer.id})
        
        assert response.status_code == 400
        assert 'insufficient' in response.data.get('error', '').lower()
        
        # Credits unchanged
        requester_tb.refresh_from_db()
        assert requester_tb.available_amount == 1
        assert requester_tb.blocked_amount == 0
    
    def test_partially_blocked_credits(self, api_client, db):
        """Test handling when credits are partially blocked"""
        provider1, _ = create_user_with_timebank()
        provider2, _ = create_user_with_timebank()
        requester, requester_tb = create_user_with_timebank(initial_credits=5)
        
        offer1 = OfferFactory(user=provider1, time_required=3)
        offer2 = OfferFactory(user=provider2, time_required=3)
        
        tokens = get_tokens_for_user(requester)
        api_client.cookies['access_token'] = tokens['access']
        
        # First exchange - blocks 3
        response1 = api_client.post('/api/exchanges', {'offer_id': offer1.id})
        assert response1.status_code == 201
        
        requester_tb.refresh_from_db()
        assert requester_tb.available_amount == 2
        assert requester_tb.blocked_amount == 3
        
        # Second exchange - should fail (only 2 available, needs 3)
        response2 = api_client.post('/api/exchanges', {'offer_id': offer2.id})
        assert response2.status_code == 400


class TestTimeBankTransactionRecords:
    """Integration tests for transaction history"""
    
    @patch('rest_api.views.send_notification')
    def test_transaction_created_on_completion(self, mock_notify, api_client, db):
        """Test transaction record created when exchange completes"""
        provider, provider_tb = create_user_with_timebank(initial_credits=0)
        requester, requester_tb = create_user_with_timebank(initial_credits=5)
        
        offer = OfferFactory(user=provider, time_required=2)
        
        # Create and complete exchange
        tokens_req = get_tokens_for_user(requester)
        api_client.cookies['access_token'] = tokens_req['access']
        response = api_client.post('/api/exchanges', {'offer_id': offer.id})
        exchange_id = response.data['exchange_id']
        
        tokens_prov = get_tokens_for_user(provider)
        api_client.cookies['access_token'] = tokens_prov['access']
        api_client.post(f'/api/exchanges/{exchange_id}/accept')
        
        api_client.cookies['access_token'] = tokens_req['access']
        api_client.post(f'/api/exchanges/{exchange_id}/confirm-completion')
        
        api_client.cookies['access_token'] = tokens_prov['access']
        api_client.post(f'/api/exchanges/{exchange_id}/confirm-completion')
        
        # Verify transaction record
        transaction = TimeBankTransaction.objects.filter(exchange_id=exchange_id).first()
        assert transaction is not None
        assert transaction.time_amount == 2
        assert transaction.from_user == requester
        assert transaction.to_user == provider
    
    def test_get_user_transactions(self, api_client, db):
        """Test fetching user's transaction history"""
        user, _ = create_user_with_timebank(initial_credits=5)
        
        tokens = get_tokens_for_user(user)
        api_client.cookies['access_token'] = tokens['access']
        
        response = api_client.get('/api/transactions')
        
        assert response.status_code == 200
        assert isinstance(response.data, list)


class TestTimeBankEdgeCases:
    """Edge case tests for TimeBank"""
    
    def test_zero_time_exchange(self, api_client, db):
        """Test handling of zero-time exchange (edge case)"""
        provider, _ = create_user_with_timebank()
        requester, requester_tb = create_user_with_timebank(initial_credits=5)
        
        # Create offer with 0 time (if allowed)
        offer = OfferFactory(user=provider, time_required=0)
        
        tokens = get_tokens_for_user(requester)
        api_client.cookies['access_token'] = tokens['access']
        
        response = api_client.post('/api/exchanges', {'offer_id': offer.id})
        
        # System should handle this gracefully
        assert response.status_code in [201, 400]
    
    def test_concurrent_exchange_requests(self, api_client, db):
        """Test handling concurrent exchange requests"""
        provider, _ = create_user_with_timebank()
        requester, requester_tb = create_user_with_timebank(initial_credits=5)
        
        offer = OfferFactory(user=provider, time_required=3)
        
        tokens = get_tokens_for_user(requester)
        api_client.cookies['access_token'] = tokens['access']
        
        # First request
        response1 = api_client.post('/api/exchanges', {'offer_id': offer.id})
        assert response1.status_code == 201
        
        # Second request to same offer (duplicate)
        response2 = api_client.post('/api/exchanges', {'offer_id': offer.id})
        assert response2.status_code == 400  # Should be rejected

