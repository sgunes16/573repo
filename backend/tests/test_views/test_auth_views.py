"""
Auth Views Tests
Tests for FR-80 to FR-83 (Password Validation and Email Verification)
"""

import pytest
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from rest_framework import status
from rest_api.models import User, EmailVerificationToken
from rest_api.auth.views import validate_password, password_hash
from tests.factories import UserFactory


@pytest.mark.django_db
class TestPasswordValidation:
    """Tests for password validation (FR-80)"""

    def test_validate_password_too_short(self):
        """FR-80: Password must be at least 8 characters"""
        errors = validate_password("Short1A")
        assert "Password must be at least 8 characters" in errors

    def test_validate_password_no_uppercase(self):
        """FR-80: Password must contain uppercase letter"""
        errors = validate_password("password123")
        assert "Password must contain at least one uppercase letter" in errors

    def test_validate_password_no_lowercase(self):
        """FR-80: Password must contain lowercase letter"""
        errors = validate_password("PASSWORD123")
        assert "Password must contain at least one lowercase letter" in errors

    def test_validate_password_no_digit(self):
        """FR-80: Password must contain digit"""
        errors = validate_password("PasswordABC")
        assert "Password must contain at least one digit" in errors

    def test_validate_password_valid(self):
        """FR-80: Valid password passes all checks"""
        errors = validate_password("ValidPass123")
        assert errors == []

    def test_validate_password_multiple_errors(self):
        """FR-80: Returns all validation errors"""
        errors = validate_password("short")
        assert len(errors) >= 2


@pytest.mark.django_db
class TestRegisterWithPasswordValidation:
    """Tests for registration with password validation"""

    def test_register_password_too_short_rejected(self):
        """FR-80: Registration rejected for short password"""
        client = APIClient()
        response = client.post('/api/auth/register', {
            'email': 'test@example.com',
            'password': 'Short1',
            'check_password': 'Short1',
            'first_name': 'Test',
            'last_name': 'User'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'errors' in response.data
        assert any('8 characters' in err for err in response.data['errors'])

    def test_register_password_no_uppercase_rejected(self):
        """FR-80: Registration rejected for password without uppercase"""
        client = APIClient()
        response = client.post('/api/auth/register', {
            'email': 'test@example.com',
            'password': 'password123',
            'check_password': 'password123',
            'first_name': 'Test',
            'last_name': 'User'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'errors' in response.data

    def test_register_valid_password_succeeds(self):
        """FR-80: Registration succeeds with valid password"""
        client = APIClient()
        response = client.post('/api/auth/register', {
            'email': 'validuser@example.com',
            'password': 'ValidPass123',
            'check_password': 'ValidPass123',
            'first_name': 'Valid',
            'last_name': 'User'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        assert User.objects.filter(email='validuser@example.com').exists()

    def test_register_with_first_last_name(self):
        """Registration stores first_name and last_name separately"""
        client = APIClient()
        response = client.post('/api/auth/register', {
            'email': 'names@example.com',
            'password': 'ValidPass123',
            'check_password': 'ValidPass123',
            'first_name': 'John',
            'last_name': 'Doe'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        user = User.objects.get(email='names@example.com')
        assert user.first_name == 'John'
        assert user.last_name == 'Doe'

    def test_register_creates_unverified_user(self):
        """Registration creates user with is_verified=False"""
        client = APIClient()
        response = client.post('/api/auth/register', {
            'email': 'unverified@example.com',
            'password': 'ValidPass123',
            'check_password': 'ValidPass123',
            'first_name': 'Test',
            'last_name': 'User'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        user = User.objects.get(email='unverified@example.com')
        assert user.is_verified is False

    def test_register_creates_verification_token(self):
        """FR-81: Registration creates verification token"""
        client = APIClient()
        response = client.post('/api/auth/register', {
            'email': 'tokenuser@example.com',
            'password': 'ValidPass123',
            'check_password': 'ValidPass123',
            'first_name': 'Token',
            'last_name': 'User'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        user = User.objects.get(email='tokenuser@example.com')
        assert EmailVerificationToken.objects.filter(user=user).exists()


@pytest.mark.django_db
class TestVerifyEmail:
    """Tests for email verification (FR-81, FR-82)"""

    def test_verify_email_success(self):
        """FR-81: Valid token verifies email"""
        user = UserFactory(is_verified=False)
        token = EmailVerificationToken.objects.create(
            user=user,
            token='valid-token-123',
            expires_at=timezone.now() + timedelta(hours=24)
        )
        
        client = APIClient()
        response = client.post('/api/auth/verify-email', {
            'token': 'valid-token-123'
        })
        
        assert response.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert user.is_verified is True

    def test_verify_email_invalid_token(self):
        """FR-81: Invalid token rejected"""
        client = APIClient()
        response = client.post('/api/auth/verify-email', {
            'token': 'invalid-token-xyz'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'Invalid' in response.data['message']

    def test_verify_email_expired_token(self):
        """FR-81: Expired token rejected"""
        user = UserFactory(is_verified=False)
        token = EmailVerificationToken.objects.create(
            user=user,
            token='expired-token-123',
            expires_at=timezone.now() - timedelta(hours=1)  # Already expired
        )
        
        client = APIClient()
        response = client.post('/api/auth/verify-email', {
            'token': 'expired-token-123'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'expired' in response.data['message'].lower()

    def test_verify_email_used_token(self):
        """FR-81: Used token rejected"""
        user = UserFactory(is_verified=False)
        token = EmailVerificationToken.objects.create(
            user=user,
            token='used-token-123',
            expires_at=timezone.now() + timedelta(hours=24),
            is_used=True
        )
        
        client = APIClient()
        response = client.post('/api/auth/verify-email', {
            'token': 'used-token-123'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_verify_email_marks_token_as_used(self):
        """Token is marked as used after verification"""
        user = UserFactory(is_verified=False)
        token = EmailVerificationToken.objects.create(
            user=user,
            token='mark-used-token',
            expires_at=timezone.now() + timedelta(hours=24)
        )
        
        client = APIClient()
        response = client.post('/api/auth/verify-email', {
            'token': 'mark-used-token'
        })
        
        assert response.status_code == status.HTTP_200_OK
        token.refresh_from_db()
        assert token.is_used is True


@pytest.mark.django_db
class TestResendVerification:
    """Tests for resending verification email (FR-83)"""

    def test_resend_verification_success(self):
        """FR-83: Resend verification creates new token"""
        user = UserFactory(is_verified=False)
        
        client = APIClient()
        response = client.post('/api/auth/resend-verification', {
            'email': user.email
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert EmailVerificationToken.objects.filter(user=user, is_used=False).exists()

    def test_resend_verification_invalidates_old_tokens(self):
        """FR-83: Old tokens are invalidated"""
        user = UserFactory(is_verified=False)
        old_token = EmailVerificationToken.objects.create(
            user=user,
            token='old-token-123',
            expires_at=timezone.now() + timedelta(hours=24)
        )
        
        client = APIClient()
        response = client.post('/api/auth/resend-verification', {
            'email': user.email
        })
        
        assert response.status_code == status.HTTP_200_OK
        old_token.refresh_from_db()
        assert old_token.is_used is True

    def test_resend_verification_nonexistent_email(self):
        """FR-83: Non-existent email doesn't reveal info"""
        client = APIClient()
        response = client.post('/api/auth/resend-verification', {
            'email': 'nonexistent@example.com'
        })
        
        # Should not reveal if email exists
        assert response.status_code == status.HTTP_200_OK

    def test_resend_verification_already_verified(self):
        """FR-83: Already verified user doesn't get new token"""
        user = UserFactory(is_verified=True)
        
        client = APIClient()
        response = client.post('/api/auth/resend-verification', {
            'email': user.email
        })
        
        assert response.status_code == status.HTTP_200_OK
        # Should not create new token for verified user
        assert not EmailVerificationToken.objects.filter(
            user=user, 
            is_used=False,
            created_at__gte=timezone.now() - timedelta(minutes=1)
        ).exists()


@pytest.mark.django_db
class TestUnverifiedUserRestrictions:
    """Tests for unverified user access restrictions (FR-82)"""

    def test_unverified_user_cannot_create_offer(self, authenticated_client):
        """FR-82: Unverified user cannot create offers"""
        client, user = authenticated_client
        user.is_verified = False
        user.save()
        
        response = client.post('/api/create-offer', {
            'title': 'Test Offer',
            'description': 'Test Description',
            'time_required': 1,
            'type': 'offer'
        })
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert response.data['code'] == 'EMAIL_NOT_VERIFIED'

    def test_unverified_user_cannot_create_exchange(self, authenticated_client):
        """FR-82: Unverified user cannot create exchanges"""
        client, user = authenticated_client
        user.is_verified = False
        user.save()
        
        # Create an offer by another user
        other_user = UserFactory(is_verified=True)
        from tests.factories import OfferFactory, TimeBankFactory
        TimeBankFactory(user=other_user)
        offer = OfferFactory(user=other_user)
        
        response = client.post('/api/exchanges', {
            'offer_id': offer.id
        })
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert response.data['code'] == 'EMAIL_NOT_VERIFIED'

    def test_verified_user_can_create_offer(self, authenticated_client):
        """FR-82: Verified user can create offers"""
        client, user = authenticated_client
        user.is_verified = True
        user.save()
        
        response = client.post('/api/create-offer', {
            'title': 'Test Offer',
            'description': 'Test Description',
            'time_required': 1,
            'type': 'offer',
            'activity_type': '1to1',
            'location_type': 'myLocation'
        })
        
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]


@pytest.mark.django_db
class TestSendVerificationEmail:
    """Tests for authenticated send verification endpoint"""

    def test_send_verification_authenticated(self, authenticated_client):
        """Authenticated user can request verification email"""
        client, user = authenticated_client
        user.is_verified = False
        user.save()
        
        response = client.post('/api/auth/send-verification')
        
        assert response.status_code == status.HTTP_200_OK
        assert EmailVerificationToken.objects.filter(user=user, is_used=False).exists()

    def test_send_verification_already_verified(self, authenticated_client):
        """Already verified user gets error"""
        client, user = authenticated_client
        user.is_verified = True
        user.save()
        
        response = client.post('/api/auth/send-verification')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'already verified' in response.data['message'].lower()

    def test_send_verification_requires_auth(self):
        """Send verification requires authentication"""
        client = APIClient()
        response = client.post('/api/auth/send-verification')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

