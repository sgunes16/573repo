"""
Factory Boy factories for creating test data
"""
import factory
from factory.django import DjangoModelFactory
from rest_api.models import (
    User, UserProfile, TimeBank, Offer, Exchange, 
    ExchangeRating, Notification, Chat, Message,
    TimeBankTransaction, Report
)
from rest_api.auth.views import password_hash


class UserFactory(DjangoModelFactory):
    """Factory for creating User instances"""
    class Meta:
        model = User
    
    email = factory.Sequence(lambda n: f'user{n}@test.com')
    password = factory.LazyAttribute(lambda obj: password_hash('testpassword123'))
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    is_active = True
    is_verified = False
    is_admin = False


class AdminUserFactory(UserFactory):
    """Factory for creating admin User instances"""
    is_admin = True
    email = factory.Sequence(lambda n: f'admin{n}@test.com')


class UserProfileFactory(DjangoModelFactory):
    """Factory for creating UserProfile instances"""
    class Meta:
        model = UserProfile
    
    user = factory.SubFactory(UserFactory)
    bio = factory.Faker('text', max_nb_chars=200)
    location = factory.Faker('city')
    skills = factory.LazyFunction(lambda: ['Python', 'Django'])
    rating = 0.0
    phone_number = factory.LazyFunction(lambda: '555-123-4567')
    badges = factory.LazyFunction(list)


class TimeBankFactory(DjangoModelFactory):
    """Factory for creating TimeBank instances"""
    class Meta:
        model = TimeBank
    
    user = factory.SubFactory(UserFactory)
    amount = 5
    blocked_amount = 0
    available_amount = 5
    total_amount = 5


class OfferFactory(DjangoModelFactory):
    """Factory for creating Offer instances"""
    class Meta:
        model = Offer
    
    user = factory.SubFactory(UserFactory)
    type = 'offer'
    title = factory.Faker('sentence', nb_words=4)
    description = factory.Faker('text', max_nb_chars=200)
    time_required = 1
    location = factory.Faker('city')
    geo_location = factory.LazyFunction(lambda: [41.0082, 28.9784])
    status = 'ACTIVE'
    activity_type = '1to1'
    offer_type = '1time'
    person_count = 1
    location_type = 'myLocation'
    tags = factory.LazyFunction(lambda: ['help', 'service'])


class WantFactory(OfferFactory):
    """Factory for creating Want instances (type='want')"""
    type = 'want'


class GroupOfferFactory(OfferFactory):
    """Factory for creating group Offer instances"""
    activity_type = 'group'
    person_count = 3


class ExchangeFactory(DjangoModelFactory):
    """Factory for creating Exchange instances"""
    class Meta:
        model = Exchange
    
    offer = factory.SubFactory(OfferFactory)
    provider = factory.LazyAttribute(lambda obj: obj.offer.user)
    requester = factory.SubFactory(UserFactory)
    status = 'PENDING'
    time_spent = factory.LazyAttribute(lambda obj: obj.offer.time_required)


class AcceptedExchangeFactory(ExchangeFactory):
    """Factory for creating accepted Exchange instances"""
    status = 'ACCEPTED'


class CompletedExchangeFactory(ExchangeFactory):
    """Factory for creating completed Exchange instances"""
    status = 'COMPLETED'
    requester_confirmed = True
    provider_confirmed = True


class ExchangeRatingFactory(DjangoModelFactory):
    """Factory for creating ExchangeRating instances"""
    class Meta:
        model = ExchangeRating
    
    exchange = factory.SubFactory(CompletedExchangeFactory)
    rater = factory.LazyAttribute(lambda obj: obj.exchange.requester)
    ratee = factory.LazyAttribute(lambda obj: obj.exchange.provider)
    communication = 4
    punctuality = 5
    would_recommend = True
    comment = factory.Faker('text', max_nb_chars=100)


class NotificationFactory(DjangoModelFactory):
    """Factory for creating Notification instances"""
    class Meta:
        model = Notification
    
    user = factory.SubFactory(UserFactory)
    content = factory.Faker('sentence')
    is_read = False


class ChatFactory(DjangoModelFactory):
    """Factory for creating Chat instances"""
    class Meta:
        model = Chat
    
    exchange = factory.SubFactory(ExchangeFactory)
    user = factory.LazyAttribute(lambda obj: obj.exchange.provider)
    content = ''


class MessageFactory(DjangoModelFactory):
    """Factory for creating Message instances"""
    class Meta:
        model = Message
    
    chat = factory.SubFactory(ChatFactory)
    user = factory.LazyAttribute(lambda obj: obj.chat.user)
    content = factory.Faker('text', max_nb_chars=200)


class TimeBankTransactionFactory(DjangoModelFactory):
    """Factory for creating TimeBankTransaction instances"""
    class Meta:
        model = TimeBankTransaction
    
    from_user = factory.SubFactory(UserFactory)
    to_user = factory.SubFactory(UserFactory)
    exchange = factory.SubFactory(ExchangeFactory)
    time_amount = 1
    transaction_type = 'SPEND'
    description = 'Test transaction'


class ReportFactory(DjangoModelFactory):
    """Factory for creating Report instances"""
    class Meta:
        model = Report
    
    reporter = factory.SubFactory(UserFactory)
    reported_user = factory.SubFactory(UserFactory)
    target_type = 'user'
    target_id = factory.LazyAttribute(lambda obj: obj.reported_user.id)
    reason = 'SPAM'
    description = factory.Faker('text', max_nb_chars=100)
    status = 'PENDING'


def create_user_with_timebank(email=None, password='testpassword123', initial_credits=5):
    """Helper to create a user with associated TimeBank"""
    user = UserFactory(
        email=email or f'user_{factory.Faker("uuid4").evaluate(None, None, {"locale": None})}@test.com',
        password=password_hash(password)
    )
    timebank = TimeBankFactory(
        user=user,
        amount=initial_credits,
        available_amount=initial_credits,
        total_amount=initial_credits
    )
    return user, timebank


def create_full_user(email=None, password='testpassword123', initial_credits=5):
    """Helper to create a user with profile and timebank"""
    user, timebank = create_user_with_timebank(email, password, initial_credits)
    profile = UserProfileFactory(user=user)
    return user, profile, timebank

