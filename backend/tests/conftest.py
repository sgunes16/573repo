"""
Pytest configuration and fixtures for backend tests
"""
import pytest
from rest_framework.test import APIClient
from django.test import Client

from tests.factories import (
    UserFactory, AdminUserFactory, UserProfileFactory, TimeBankFactory,
    OfferFactory, WantFactory, GroupOfferFactory,
    ExchangeFactory, AcceptedExchangeFactory, CompletedExchangeFactory,
    ExchangeRatingFactory, NotificationFactory, ChatFactory, MessageFactory,
    TimeBankTransactionFactory, ReportFactory, ForumPostFactory, ForumCommentFactory,
    create_user_with_timebank, create_full_user
)
from rest_api.auth.views import password_hash
from rest_api.auth.serializers import get_tokens_for_user


# Database access for all tests
@pytest.fixture(autouse=True)
def enable_db_access_for_all_tests(db):
    """Enable database access for all tests"""
    pass


# Client fixtures
@pytest.fixture
def api_client():
    """Return an API client for testing"""
    return APIClient()


@pytest.fixture
def django_client():
    """Return a Django test client"""
    return Client()


# User fixtures
@pytest.fixture
def user():
    """Create a basic user"""
    return UserFactory()


@pytest.fixture
def user_with_password():
    """Create a user with known password"""
    return UserFactory(password=password_hash('testpassword123'))


@pytest.fixture
def admin_user():
    """Create an admin user"""
    return AdminUserFactory()


@pytest.fixture
def user_with_timebank():
    """Create a user with timebank"""
    user, timebank = create_user_with_timebank()
    return user, timebank


@pytest.fixture
def full_user():
    """Create a user with profile and timebank"""
    user, profile, timebank = create_full_user()
    return user, profile, timebank


# Authenticated client fixtures
@pytest.fixture
def authenticated_client(api_client, user_with_password):
    """Return an authenticated API client"""
    tokens = get_tokens_for_user(user_with_password)
    api_client.cookies['access_token'] = tokens['access']
    api_client.cookies['refresh_token'] = tokens['refresh']
    return api_client, user_with_password


@pytest.fixture
def authenticated_admin_client(api_client):
    """Return an authenticated admin API client"""
    admin = AdminUserFactory(password=password_hash('adminpassword123'))
    tokens = get_tokens_for_user(admin)
    api_client.cookies['access_token'] = tokens['access']
    api_client.cookies['refresh_token'] = tokens['refresh']
    return api_client, admin


# Offer fixtures
@pytest.fixture
def offer():
    """Create an offer"""
    return OfferFactory()


@pytest.fixture
def offer_with_owner():
    """Create an offer with accessible owner"""
    user, timebank = create_user_with_timebank()
    offer = OfferFactory(user=user)
    return offer, user, timebank


@pytest.fixture
def want():
    """Create a want"""
    return WantFactory()


@pytest.fixture
def group_offer():
    """Create a group offer"""
    return GroupOfferFactory()


# Exchange fixtures
@pytest.fixture
def exchange():
    """Create an exchange"""
    return ExchangeFactory()


@pytest.fixture
def accepted_exchange():
    """Create an accepted exchange"""
    return AcceptedExchangeFactory()


@pytest.fixture
def completed_exchange():
    """Create a completed exchange"""
    return CompletedExchangeFactory()


@pytest.fixture
def exchange_with_users():
    """Create an exchange with provider and requester with timebanks"""
    provider, provider_tb = create_user_with_timebank(initial_credits=5)
    requester, requester_tb = create_user_with_timebank(initial_credits=5)
    
    offer = OfferFactory(user=provider)
    exchange = ExchangeFactory(
        offer=offer,
        provider=provider,
        requester=requester,
        time_spent=offer.time_required
    )
    
    return {
        'exchange': exchange,
        'offer': offer,
        'provider': provider,
        'provider_timebank': provider_tb,
        'requester': requester,
        'requester_timebank': requester_tb,
    }


# Rating fixtures
@pytest.fixture
def exchange_rating():
    """Create an exchange rating"""
    return ExchangeRatingFactory()


# Notification fixtures
@pytest.fixture
def notification():
    """Create a notification"""
    return NotificationFactory()


# Chat fixtures
@pytest.fixture
def chat():
    """Create a chat"""
    return ChatFactory()


@pytest.fixture
def message():
    """Create a message"""
    return MessageFactory()


# Transaction fixtures
@pytest.fixture
def transaction():
    """Create a transaction"""
    return TimeBankTransactionFactory()


# Report fixtures
@pytest.fixture
def report():
    """Create a report"""
    return ReportFactory()


# Forum fixtures
@pytest.fixture
def forum_post():
    """Create a forum post"""
    return ForumPostFactory()


@pytest.fixture
def forum_comment():
    """Create a forum comment"""
    return ForumCommentFactory()


# Utility fixtures
@pytest.fixture
def password():
    """Return test password"""
    return 'testpassword123'


@pytest.fixture
def hashed_password(password):
    """Return hashed test password"""
    return password_hash(password)

