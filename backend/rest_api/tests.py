"""
Unit tests for LoginView

These tests mock the database queries to test LoginView logic directly.
"""
from django.test import TestCase
from unittest.mock import MagicMock, patch
from rest_framework import status
import hashlib

from rest_api.auth.views import LoginView, password_hash, check_password


class PasswordHashTests(TestCase):
    """Tests for password hashing functions"""
    
    def test_password_hash_returns_sha256(self):
        """Test that password_hash returns SHA256 hash"""
        password = 'testpassword'
        expected = hashlib.sha256(password.encode()).hexdigest()
        result = password_hash(password)
        self.assertEqual(result, expected)
    
    def test_password_hash_is_consistent(self):
        """Test that same password always returns same hash"""
        password = 'mypassword123'
        hash1 = password_hash(password)
        hash2 = password_hash(password)
        self.assertEqual(hash1, hash2)
    
    def test_password_hash_different_for_different_passwords(self):
        """Test that different passwords return different hashes"""
        hash1 = password_hash('password1')
        hash2 = password_hash('password2')
        self.assertNotEqual(hash1, hash2)


class CheckPasswordTests(TestCase):
    """Tests for check_password function"""
    
    def test_check_password_returns_true_for_correct_password(self):
        """Test check_password returns True when password matches"""
        password = 'correctpassword'
        hashed = password_hash(password)
        result = check_password(password, hashed)
        self.assertTrue(result)
    
    def test_check_password_returns_false_for_wrong_password(self):
        """Test check_password returns False when password doesn't match"""
        correct_password = 'correctpassword'
        wrong_password = 'wrongpassword'
        hashed = password_hash(correct_password)
        result = check_password(wrong_password, hashed)
        self.assertFalse(result)


class LoginViewTests(TestCase):
    """Unit tests for LoginView.post method using mocks"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.view = LoginView()
        self.test_email = 'test@example.com'
        self.test_password = 'testpassword123'
        self.hashed_password = password_hash(self.test_password)
        
        # Create a mock user object
        self.mock_user = MagicMock()
        self.mock_user.id = 1
        self.mock_user.email = self.test_email
        self.mock_user.password = self.hashed_password
        self.mock_user.first_name = 'Test'
        self.mock_user.last_name = 'User'
    
    def _create_mock_request(self, data):
        """Helper to create a mock request object"""
        request = MagicMock()
        request.data = data
        return request
    
    def test_login_missing_email_returns_400(self):
        """Test that missing email returns 400"""
        request = self._create_mock_request({'password': 'somepassword'})
        response = self.view.post(request)
        
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['message'], 'Email and password are required.')
    
    def test_login_missing_password_returns_400(self):
        """Test that missing password returns 400"""
        request = self._create_mock_request({'email': 'test@example.com'})
        response = self.view.post(request)
        
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['message'], 'Email and password are required.')
    
    def test_login_empty_email_returns_400(self):
        """Test that empty email returns 400"""
        request = self._create_mock_request({'email': '', 'password': 'somepassword'})
        response = self.view.post(request)
        
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['message'], 'Email and password are required.')
    
    def test_login_empty_password_returns_400(self):
        """Test that empty password returns 400"""
        request = self._create_mock_request({'email': 'test@example.com', 'password': ''})
        response = self.view.post(request)
        
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['message'], 'Email and password are required.')
    
    @patch('rest_api.auth.views.User.objects.get')
    def test_login_nonexistent_user_returns_401(self, mock_get):
        """Test that login with non-existent email returns 401"""
        from rest_api.models import User
        mock_get.side_effect = User.DoesNotExist
        
        request = self._create_mock_request({
            'email': 'nonexistent@example.com',
            'password': 'somepassword'
        })
        response = self.view.post(request)
        
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.data['message'], 'Invalid credentials')
    
    @patch('rest_api.auth.views.User.objects.get')
    def test_login_wrong_password_returns_401(self, mock_get):
        """Test that login with wrong password returns 401"""
        mock_get.return_value = self.mock_user
        
        request = self._create_mock_request({
            'email': self.test_email,
            'password': 'wrongpassword'
        })
        response = self.view.post(request)
        
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.data['message'], 'Invalid credentials')
    
    @patch('rest_api.auth.views.get_tokens_for_user')
    @patch('rest_api.auth.views.User.objects.get')
    def test_login_success_returns_200(self, mock_get, mock_tokens):
        """Test that login with correct credentials returns 200"""
        mock_get.return_value = self.mock_user
        mock_tokens.return_value = {
            'access': 'fake.access.token',
            'refresh': 'fake.refresh.token'
        }
        
        request = self._create_mock_request({
            'email': self.test_email,
            'password': self.test_password
        })
        response = self.view.post(request)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['message'], 'Login successful')
    
    @patch('rest_api.auth.views.get_tokens_for_user')
    @patch('rest_api.auth.views.User.objects.get')
    def test_login_success_returns_user_data(self, mock_get, mock_tokens):
        """Test that successful login returns user data"""
        mock_get.return_value = self.mock_user
        mock_tokens.return_value = {
            'access': 'fake.access.token',
            'refresh': 'fake.refresh.token'
        }
        
        request = self._create_mock_request({
            'email': self.test_email,
            'password': self.test_password
        })
        response = self.view.post(request)
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['email'], self.test_email)
        self.assertEqual(response.data['user']['first_name'], 'Test')
        self.assertEqual(response.data['user']['last_name'], 'User')
        self.assertEqual(response.data['user']['id'], 1)
    
    @patch('rest_api.auth.views.get_tokens_for_user')
    @patch('rest_api.auth.views.User.objects.get')
    def test_login_success_returns_tokens(self, mock_get, mock_tokens):
        """Test that successful login returns access and refresh tokens"""
        mock_get.return_value = self.mock_user
        mock_tokens.return_value = {
            'access': 'fake.access.token',
            'refresh': 'fake.refresh.token'
        }
        
        request = self._create_mock_request({
            'email': self.test_email,
            'password': self.test_password
        })
        response = self.view.post(request)
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('access_token', response.data)
        self.assertIn('refresh_token', response.data)
    
    @patch('rest_api.auth.views.get_tokens_for_user')
    @patch('rest_api.auth.views.User.objects.get')
    def test_login_tokens_are_returned_correctly(self, mock_get, mock_tokens):
        """Test that returned tokens match what get_tokens_for_user returns"""
        mock_get.return_value = self.mock_user
        mock_tokens.return_value = {
            'access': 'test.access.token',
            'refresh': 'test.refresh.token'
        }
        
        request = self._create_mock_request({
            'email': self.test_email,
            'password': self.test_password
        })
        response = self.view.post(request)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['access_token'], 'test.access.token')
        self.assertEqual(response.data['refresh_token'], 'test.refresh.token')
    
    @patch('rest_api.auth.views.get_tokens_for_user')
    @patch('rest_api.auth.views.User.objects.get')
    def test_login_success_sets_cookies(self, mock_get, mock_tokens):
        """Test that successful login sets cookies on the response"""
        mock_get.return_value = self.mock_user
        mock_tokens.return_value = {
            'access': 'fake.access.token',
            'refresh': 'fake.refresh.token'
        }
        
        request = self._create_mock_request({
            'email': self.test_email,
            'password': self.test_password
        })
        response = self.view.post(request)
        
        self.assertEqual(response.status_code, 200)
        # Check cookies were set (response.cookies is a dict-like object)
        self.assertIn('access_token', response.cookies)
        self.assertIn('refresh_token', response.cookies)
