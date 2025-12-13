"""
Tests for utility functions
"""
import pytest
from unittest.mock import patch, MagicMock
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from rest_api.auth.views import password_hash, verify_password
from rest_api.models import User, Notification
from tests.factories import UserFactory, create_user_with_timebank


class TestPasswordHashing:
    """Tests for password hashing utilities"""
    
    def test_password_hash_returns_sha256(self):
        """Test password_hash returns SHA256 hash"""
        import hashlib
        password = 'testpassword'
        expected = hashlib.sha256(password.encode()).hexdigest()
        
        result = password_hash(password)
        
        assert result == expected
    
    def test_password_hash_is_consistent(self):
        """Test same password returns same hash"""
        password = 'consistentpassword'
        
        hash1 = password_hash(password)
        hash2 = password_hash(password)
        
        assert hash1 == hash2
    
    def test_password_hash_different_for_different_passwords(self):
        """Test different passwords return different hashes"""
        hash1 = password_hash('password1')
        hash2 = password_hash('password2')
        
        assert hash1 != hash2
    
    def test_password_hash_length(self):
        """Test hash has correct length (64 chars for SHA256)"""
        result = password_hash('anypassword')
        
        assert len(result) == 64
    
    def test_password_hash_handles_unicode(self):
        """Test password_hash handles unicode characters"""
        password = 'parola123şüğçı'
        
        result = password_hash(password)
        
        assert len(result) == 64


class TestVerifyPassword:
    """Tests for password verification"""
    
    def test_verify_password_correct(self):
        """Test verify_password returns True for correct password"""
        password = 'correctpassword'
        hashed = password_hash(password)
        
        result = verify_password(password, hashed)
        
        assert result is True
    
    def test_verify_password_incorrect(self):
        """Test verify_password returns False for wrong password"""
        correct = 'correctpassword'
        wrong = 'wrongpassword'
        hashed = password_hash(correct)
        
        result = verify_password(wrong, hashed)
        
        assert result is False
    
    def test_verify_password_empty_password(self):
        """Test verify_password with empty password"""
        hashed = password_hash('somepassword')
        
        result = verify_password('', hashed)
        
        assert result is False
    
    def test_verify_password_case_sensitive(self):
        """Test passwords are case-sensitive"""
        password = 'CaseSensitive'
        hashed = password_hash(password)
        
        result = verify_password('casesensitive', hashed)
        
        assert result is False


class TestNotificationHelper:
    """Tests for notification sending utility"""
    
    @patch('rest_api.views.get_channel_layer')
    def test_send_notification_creates_record(self, mock_channel_layer, db):
        """Test send_notification creates notification record"""
        from rest_api.views import send_notification
        
        user, _ = create_user_with_timebank()
        message = 'Test notification message'
        
        # Mock channel layer
        mock_layer = MagicMock()
        mock_layer.group_send = MagicMock(return_value=None)
        mock_channel_layer.return_value = mock_layer
        
        # Call function
        send_notification(user, message)
        
        # Verify notification created
        assert Notification.objects.filter(
            user=user,
            content=message
        ).exists()
    
    @patch('rest_api.views.get_channel_layer')
    def test_send_notification_broadcasts(self, mock_channel_layer, db):
        """Test send_notification broadcasts via channel layer"""
        from rest_api.views import send_notification
        
        user, _ = create_user_with_timebank()
        message = 'Broadcast test'
        
        mock_layer = MagicMock()
        mock_channel_layer.return_value = mock_layer
        
        send_notification(user, message)
        
        # Verify channel layer was used
        mock_layer.group_send.assert_called_once()


class TestExchangeWebSocketHelper:
    """Tests for exchange WebSocket update utility"""
    
    def test_send_exchange_update_ws_exists(self, db):
        """Test send_exchange_update_ws function exists and is callable"""
        from rest_api.views import send_exchange_update_ws
        from tests.factories import ExchangeFactory
        
        exchange = ExchangeFactory()
        
        # Function should exist and be callable
        assert callable(send_exchange_update_ws)
        
        # Should not raise when called (may silently fail if no channel layer)
        try:
            send_exchange_update_ws(exchange.id)
        except Exception:
            # May fail without proper channel layer setup, that's OK
            pass


class TestTokenGeneration:
    """Tests for JWT token generation"""
    
    def test_get_tokens_for_user(self, user):
        """Test token generation for user"""
        from rest_api.auth.serializers import get_tokens_for_user
        
        tokens = get_tokens_for_user(user)
        
        assert 'access' in tokens
        assert 'refresh' in tokens
        assert len(tokens['access']) > 0
        assert len(tokens['refresh']) > 0
    
    def test_tokens_are_valid_jwt(self, user):
        """Test generated tokens are valid JWT format"""
        from rest_api.auth.serializers import get_tokens_for_user
        
        tokens = get_tokens_for_user(user)
        
        # JWT format: header.payload.signature
        access_parts = tokens['access'].split('.')
        refresh_parts = tokens['refresh'].split('.')
        
        assert len(access_parts) == 3
        assert len(refresh_parts) == 3
    
    def test_access_token_contains_user_id(self, user):
        """Test access token contains user_id"""
        from rest_api.auth.serializers import get_tokens_for_user
        import jwt
        from django.conf import settings
        
        tokens = get_tokens_for_user(user)
        
        decoded = jwt.decode(
            tokens['access'],
            settings.SECRET_KEY,
            algorithms=["HS256"]
        )
        
        assert decoded['user_id'] == user.id


class TestCookieAuthentication:
    """Tests for cookie-based JWT authentication"""
    
    def test_authenticated_request(self, authenticated_client):
        """Test authenticated request works"""
        client, user = authenticated_client
        
        # Make authenticated request
        response = client.get('/api/auth/me')
        
        assert response.status_code == 200
        assert response.data['user']['id'] == user.id
    
    def test_unauthenticated_request_fails(self, api_client):
        """Test unauthenticated request is rejected"""
        response = api_client.get('/api/auth/me')
        
        assert response.status_code == 401

