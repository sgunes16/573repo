"""
Unit tests for models
"""
import pytest
from django.db import models as django_models
from rest_api.models import User, UserProfile, TimeBank, Offer, Exchange


class TestUserModel:
    """Tests for User model"""
    
    def test_user_is_authenticated_property(self, user):
        """Test that is_authenticated returns True"""
        assert user.is_authenticated is True
    
    def test_user_is_anonymous_property(self, user):
        """Test that is_anonymous returns False"""
        assert user.is_anonymous is False
    
    def test_user_str_returns_email(self, user):
        """Test that __str__ returns email"""
        assert str(user) == user.email
    
    def test_user_default_values(self, user):
        """Test default values for user fields"""
        assert user.is_active is True
        assert user.is_verified is False
        assert user.is_admin is False
        assert user.is_superuser is False
        assert user.is_deleted is False
        assert user.is_blocked is False
        assert user.is_banned is False
        assert user.is_suspended is False
        assert user.warning_count == 0


class TestUserProfileModel:
    """Tests for UserProfile model"""
    
    def test_time_credits_returns_timebank_amount(self, full_user):
        """Test that time_credits property returns timebank amount"""
        user, profile, timebank = full_user
        assert profile.time_credits == timebank.amount
    
    def test_time_credits_returns_zero_without_timebank(self, user):
        """Test that time_credits returns 0 when no timebank exists"""
        profile = UserProfile.objects.create(user=user)
        assert profile.time_credits == 0
    
    def test_profile_str_with_name(self, full_user):
        """Test __str__ returns full name when available"""
        user, profile, _ = full_user
        user.first_name = 'John'
        user.last_name = 'Doe'
        user.save()
        assert str(profile) == 'John Doe'
    
    def test_profile_str_without_name(self, user):
        """Test __str__ returns email when no name"""
        user.first_name = ''
        user.save()
        profile = UserProfile.objects.create(user=user)
        assert str(profile) == user.email


class TestTimeBankModel:
    """Tests for TimeBank model"""
    
    def test_timebank_initial_values(self, user_with_timebank):
        """Test initial values after creation"""
        user, timebank = user_with_timebank
        assert timebank.amount == 5
        assert timebank.blocked_amount == 0
        assert timebank.available_amount == 5
        assert timebank.total_amount == 5
    
    def test_add_credit_increases_amounts(self, user_with_timebank):
        """Test add_credit increases amount, available_amount, and total_amount"""
        _, timebank = user_with_timebank
        initial_amount = timebank.amount
        initial_available = timebank.available_amount
        initial_total = timebank.total_amount
        
        timebank.add_credit(2)
        
        assert timebank.amount == initial_amount + 2
        assert timebank.available_amount == initial_available + 2
        assert timebank.total_amount == initial_total + 2
    
    def test_add_credit_with_default_value(self, user_with_timebank):
        """Test add_credit with default value of 1"""
        _, timebank = user_with_timebank
        initial_amount = timebank.amount
        
        timebank.add_credit()
        
        assert timebank.amount == initial_amount + 1
    
    def test_spend_credit_decreases_amounts(self, user_with_timebank):
        """Test spend_credit decreases amount and available_amount"""
        _, timebank = user_with_timebank
        initial_amount = timebank.amount
        initial_available = timebank.available_amount
        initial_total = timebank.total_amount
        
        result = timebank.spend_credit(2)
        
        assert result is True
        assert timebank.amount == initial_amount - 2
        assert timebank.available_amount == initial_available - 2
        assert timebank.total_amount == initial_total  # total_amount should not change
    
    def test_spend_credit_returns_false_when_insufficient(self, user_with_timebank):
        """Test spend_credit returns False when insufficient credits"""
        _, timebank = user_with_timebank
        initial_amount = timebank.amount
        initial_available = timebank.available_amount
        
        result = timebank.spend_credit(100)  # More than available
        
        assert result is False
        assert timebank.amount == initial_amount  # Amount unchanged
        assert timebank.available_amount == initial_available
    
    def test_block_credit_moves_to_blocked(self, user_with_timebank):
        """Test block_credit moves credits from available to blocked"""
        _, timebank = user_with_timebank
        initial_available = timebank.available_amount
        initial_blocked = timebank.blocked_amount
        
        result = timebank.block_credit(2)
        
        assert result is True
        assert timebank.available_amount == initial_available - 2
        assert timebank.blocked_amount == initial_blocked + 2
        assert timebank.amount == 5  # Total amount unchanged
    
    def test_block_credit_returns_false_when_insufficient(self, user_with_timebank):
        """Test block_credit returns False when insufficient available credits"""
        _, timebank = user_with_timebank
        initial_available = timebank.available_amount
        initial_blocked = timebank.blocked_amount
        
        result = timebank.block_credit(100)  # More than available
        
        assert result is False
        assert timebank.available_amount == initial_available
        assert timebank.blocked_amount == initial_blocked
    
    def test_unblock_credit_moves_to_available(self, user_with_timebank):
        """Test unblock_credit moves credits from blocked to available"""
        _, timebank = user_with_timebank
        
        # First block some credits
        timebank.block_credit(3)
        blocked_after_block = timebank.blocked_amount
        available_after_block = timebank.available_amount
        
        # Then unblock
        result = timebank.unblock_credit(2)
        
        assert result is True
        assert timebank.blocked_amount == blocked_after_block - 2
        assert timebank.available_amount == available_after_block + 2
    
    def test_unblock_credit_partial_when_less_blocked(self, user_with_timebank):
        """Test unblock_credit unblocks what's available when less than requested"""
        _, timebank = user_with_timebank
        
        # Block 2 credits
        timebank.block_credit(2)
        
        # Try to unblock 5 (more than blocked)
        result = timebank.unblock_credit(5)
        
        assert result is True
        assert timebank.blocked_amount == 0
        assert timebank.available_amount == 5  # All credits now available
    
    def test_unblock_credit_returns_false_when_nothing_blocked(self, user_with_timebank):
        """Test unblock_credit returns False when nothing is blocked"""
        _, timebank = user_with_timebank
        assert timebank.blocked_amount == 0
        
        result = timebank.unblock_credit(1)
        
        assert result is False
    
    def test_timebank_str(self, user_with_timebank):
        """Test __str__ returns formatted string"""
        user, timebank = user_with_timebank
        assert str(timebank) == f"{user.email} - {timebank.amount}h"
    
    def test_block_then_spend_flow(self, user_with_timebank):
        """Test typical flow: block credits, then spend blocked credits"""
        _, timebank = user_with_timebank
        
        # Block 2 credits
        timebank.block_credit(2)
        assert timebank.available_amount == 3
        assert timebank.blocked_amount == 2
        
        # Unblock and spend
        timebank.unblock_credit(2)
        timebank.spend_credit(2)
        
        assert timebank.amount == 3
        assert timebank.available_amount == 3
        assert timebank.blocked_amount == 0


class TestOfferModel:
    """Tests for Offer model"""
    
    def test_offer_default_values(self, offer):
        """Test default values for offer fields"""
        assert offer.status == 'ACTIVE'
        assert offer.type == 'offer'
        assert offer.activity_type == '1to1'
        assert offer.offer_type == '1time'
        assert offer.person_count == 1
        assert offer.provider_paid is False
    
    def test_offer_str_returns_title(self, offer):
        """Test __str__ returns title"""
        assert str(offer) == offer.title
    
    def test_block_time_blocks_user_credits(self, offer_with_owner):
        """Test block_time blocks credits in user's timebank"""
        offer, user, timebank = offer_with_owner
        initial_available = timebank.available_amount
        
        result = offer.block_time()
        timebank.refresh_from_db()
        
        assert result is True
        assert timebank.available_amount == initial_available - offer.time_required
        assert timebank.blocked_amount == offer.time_required
    
    def test_release_time_unblocks_credits(self, offer_with_owner):
        """Test release_time unblocks credits"""
        offer, user, timebank = offer_with_owner
        
        # First block
        offer.block_time()
        timebank.refresh_from_db()
        blocked_amount = timebank.blocked_amount
        
        # Then release
        offer.release_time()
        timebank.refresh_from_db()
        
        assert timebank.blocked_amount == blocked_amount - offer.time_required


class TestExchangeModel:
    """Tests for Exchange model"""
    
    def test_exchange_default_status(self, exchange):
        """Test exchange default status is PENDING"""
        assert exchange.status == 'PENDING'
    
    def test_exchange_default_confirmations(self, exchange):
        """Test exchange default confirmations are False"""
        assert exchange.requester_confirmed is False
        assert exchange.provider_confirmed is False
    
    def test_exchange_str(self, exchange):
        """Test __str__ returns formatted string"""
        assert str(exchange) == f"Exchange {exchange.id} - {exchange.status}"
    
    def test_exchange_status_choices(self, exchange):
        """Test all status choices are valid"""
        valid_statuses = ['PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED']
        
        for status in valid_statuses:
            exchange.status = status
            exchange.save()
            exchange.refresh_from_db()
            assert exchange.status == status
    
    def test_accepted_exchange_fixture(self, accepted_exchange):
        """Test accepted exchange fixture"""
        assert accepted_exchange.status == 'ACCEPTED'
    
    def test_completed_exchange_fixture(self, completed_exchange):
        """Test completed exchange fixture"""
        assert completed_exchange.status == 'COMPLETED'
        assert completed_exchange.requester_confirmed is True
        assert completed_exchange.provider_confirmed is True
    
    def test_exchange_with_users_fixture(self, exchange_with_users):
        """Test exchange_with_users fixture has all components"""
        assert 'exchange' in exchange_with_users
        assert 'offer' in exchange_with_users
        assert 'provider' in exchange_with_users
        assert 'provider_timebank' in exchange_with_users
        assert 'requester' in exchange_with_users
        assert 'requester_timebank' in exchange_with_users
        
        # Verify relationships
        assert exchange_with_users['exchange'].provider == exchange_with_users['provider']
        assert exchange_with_users['exchange'].requester == exchange_with_users['requester']
        assert exchange_with_users['offer'].user == exchange_with_users['provider']


class TestExchangeRatingModel:
    """Tests for ExchangeRating model"""
    
    def test_rating_constraints(self, exchange_rating):
        """Test rating has required fields"""
        assert 1 <= exchange_rating.communication <= 5
        assert 1 <= exchange_rating.punctuality <= 5
        assert isinstance(exchange_rating.would_recommend, bool)
    
    def test_rating_unique_together(self, completed_exchange):
        """Test that same rater can't rate same ratee twice for same exchange"""
        from rest_api.models import ExchangeRating
        from django.db import IntegrityError
        
        # Create first rating
        ExchangeRating.objects.create(
            exchange=completed_exchange,
            rater=completed_exchange.requester,
            ratee=completed_exchange.provider,
            communication=4,
            punctuality=5,
            would_recommend=True
        )
        
        # Try to create duplicate
        with pytest.raises(IntegrityError):
            ExchangeRating.objects.create(
                exchange=completed_exchange,
                rater=completed_exchange.requester,
                ratee=completed_exchange.provider,
                communication=3,
                punctuality=3,
                would_recommend=False
            )


class TestNotificationModel:
    """Tests for Notification model"""
    
    def test_notification_default_is_read(self, notification):
        """Test notification default is_read is False"""
        assert notification.is_read is False
    
    def test_notification_str(self, notification):
        """Test __str__ returns user email"""
        assert str(notification) == notification.user.email

