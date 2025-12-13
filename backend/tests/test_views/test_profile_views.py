"""
Profile Views Tests
Tests for FR-18 to FR-22, FR-42 to FR-51 (Profile CRUD operations)
"""

import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from tests.factories import (
    UserFactory, UserProfileFactory, TimeBankFactory, 
    OfferFactory, ExchangeFactory, ExchangeRatingFactory
)


@pytest.mark.django_db
class TestUserProfileView:
    """Tests for UserProfileView (own profile - FR-42 to FR-45)"""

    def test_get_own_profile_success(self, authenticated_client):
        """FR-42: User can view their profile with offers/wants/timebank"""
        client, user = authenticated_client
        url = '/api/user-profile'
        response = client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'user_profile' in response.data
        assert 'timebank' in response.data
        
    def test_get_own_profile_creates_defaults(self, authenticated_client):
        """Profile and TimeBank are created if not exist"""
        client, user = authenticated_client
        url = '/api/user-profile'
        response = client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['user_profile']['bio'] == ''
        assert response.data['timebank']['amount'] >= 0
        
    def test_get_profile_requires_authentication(self):
        """FR-22: Prevent unauthorized profile access"""
        client = APIClient()
        url = '/api/user-profile'
        response = client.get(url)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
    def test_update_profile_bio(self, authenticated_client):
        """FR-20: User can edit their profile - bio"""
        client, user = authenticated_client
        url = '/api/user-profile'
        response = client.put(url, {
            'bio': 'Test bio content'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['user_profile']['bio'] == 'Test bio content'
        
    def test_update_profile_location(self, authenticated_client):
        """FR-20: User can edit their profile - location"""
        client, user = authenticated_client
        url = '/api/user-profile'
        response = client.put(url, {
            'location': 'Istanbul, Turkey'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['user_profile']['location'] == 'Istanbul, Turkey'
        
    def test_update_profile_skills(self, authenticated_client):
        """FR-20: User can edit their profile - skills"""
        client, user = authenticated_client
        url = '/api/user-profile'
        response = client.put(url, {
            'skills': '["Python", "Django", "React"]'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert 'Python' in response.data['user_profile']['skills']
        
    def test_update_profile_phone_number(self, authenticated_client):
        """FR-20: User can edit their profile - phone number"""
        client, user = authenticated_client
        url = '/api/user-profile'
        response = client.put(url, {
            'phone_number': '5551234567'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['user_profile']['phone_number'] == '5551234567'
        
    def test_update_user_names(self, authenticated_client):
        """FR-20: User can edit their profile - first/last name"""
        client, user = authenticated_client
        url = '/api/user-profile'
        response = client.put(url, {
            'first_name': 'Updated',
            'last_name': 'Name'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['user']['first_name'] == 'Updated'
        assert response.data['user']['last_name'] == 'Name'
        
    def test_update_profile_multiple_fields(self, authenticated_client):
        """FR-20: User can update multiple fields at once"""
        client, user = authenticated_client
        url = '/api/user-profile'
        response = client.put(url, {
            'bio': 'Full stack developer',
            'location': 'Ankara',
            'phone_number': '5559876543',
            'skills': 'JavaScript,TypeScript,Node.js'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['user_profile']['bio'] == 'Full stack developer'
        assert response.data['user_profile']['location'] == 'Ankara'
        
    def test_update_profile_requires_authentication(self):
        """FR-22: Prevent unauthorized profile edit"""
        client = APIClient()
        url = '/api/user-profile'
        response = client.put(url, {'bio': 'Hacked'})
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestUserProfileDetailView:
    """Tests for UserProfileDetailView (other users' profiles - FR-47 to FR-51)"""

    def test_get_other_user_profile(self, authenticated_client):
        """FR-47: User can view other users' profiles"""
        client, user = authenticated_client
        other_user = UserFactory()
        UserProfileFactory(user=other_user, bio='Other user bio')
        
        url = f'/api/user-profile/{other_user.id}'
        response = client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['user']['id'] == other_user.id
        assert response.data['profile']['bio'] == 'Other user bio'
        
    def test_get_other_user_offers(self, authenticated_client):
        """FR-48: User can view other users' offers"""
        client, user = authenticated_client
        other_user = UserFactory()
        UserProfileFactory(user=other_user)
        OfferFactory(user=other_user, type='offer', title='Other User Offer')
        
        url = f'/api/user-profile/{other_user.id}'
        response = client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['recent_offers']) > 0
        assert response.data['recent_offers'][0]['title'] == 'Other User Offer'
        
    def test_get_other_user_wants(self, authenticated_client):
        """FR-49: User can view other users' wants"""
        client, user = authenticated_client
        other_user = UserFactory()
        UserProfileFactory(user=other_user)
        OfferFactory(user=other_user, type='want', title='Other User Want')
        
        url = f'/api/user-profile/{other_user.id}'
        response = client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['recent_wants']) > 0
        assert response.data['recent_wants'][0]['title'] == 'Other User Want'
        
    def test_get_other_user_ratings(self, authenticated_client):
        """FR-50: User can view other users' ratings"""
        client, user = authenticated_client
        other_user = UserFactory()
        UserProfileFactory(user=other_user)
        
        # Create a rating for the other user
        rater = UserFactory()
        TimeBankFactory(user=other_user)
        TimeBankFactory(user=rater)
        offer = OfferFactory(user=other_user)
        exchange = ExchangeFactory(
            offer=offer, 
            provider=other_user, 
            requester=rater,
            status='COMPLETED'
        )
        ExchangeRatingFactory(
            exchange=exchange,
            rater=rater,
            ratee=other_user,
            communication=5,
            punctuality=4
        )
        
        url = f'/api/user-profile/{other_user.id}'
        response = client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'ratings_summary' in response.data
        assert response.data['ratings_summary']['total_count'] > 0
        
    def test_get_other_user_not_found(self, authenticated_client):
        """Return 404 for non-existent user"""
        client, user = authenticated_client
        url = '/api/user-profile/99999'
        response = client.get(url)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        
    def test_get_other_user_requires_authentication(self):
        """FR-22: Prevent unauthorized access to other profiles"""
        other_user = UserFactory()
        client = APIClient()
        url = f'/api/user-profile/{other_user.id}'
        response = client.get(url)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
    def test_get_other_user_with_transactions(self, authenticated_client):
        """FR-47: View recent transactions for other user"""
        client, user = authenticated_client
        other_user = UserFactory()
        UserProfileFactory(user=other_user)
        TimeBankFactory(user=other_user)
        
        url = f'/api/user-profile/{other_user.id}'
        response = client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'recent_transactions' in response.data
        
    def test_get_other_user_with_comments(self, authenticated_client):
        """FR-51: User can view comments about other users"""
        client, user = authenticated_client
        other_user = UserFactory()
        UserProfileFactory(user=other_user)
        
        url = f'/api/user-profile/{other_user.id}'
        response = client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'comments' in response.data

