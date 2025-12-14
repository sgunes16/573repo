"""
Unit tests for Offer views
"""
import pytest
from rest_framework import status

from rest_api.models import Offer, TimeBank
from tests.factories import (
    UserFactory, OfferFactory, WantFactory, GroupOfferFactory,
    create_user_with_timebank
)


class TestOffersView:
    """Tests for OffersView (list offers)"""
    
    def test_get_offers_success(self, authenticated_client):
        """Test getting list of offers"""
        client, _ = authenticated_client
        
        # Create some offers
        OfferFactory.create_batch(3)
        
        response = client.get('/api/offers')
        
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
    
    def test_get_offers_only_active(self, authenticated_client):
        """Test only active offers are returned"""
        client, _ = authenticated_client
        
        # Create active and inactive offers
        OfferFactory(status='ACTIVE')
        OfferFactory(status='INACTIVE')
        OfferFactory(status='COMPLETED')
        
        response = client.get('/api/offers')
        
        assert response.status_code == status.HTTP_200_OK
        for offer in response.data:
            assert offer['status'] == 'ACTIVE'
    
    def test_get_offers_returns_offer_data(self, authenticated_client):
        """Test offers contain expected fields"""
        client, _ = authenticated_client
        
        OfferFactory()
        
        response = client.get('/api/offers')
        
        assert response.status_code == status.HTTP_200_OK
        if response.data:
            offer = response.data[0]
            assert 'id' in offer
            assert 'title' in offer
            assert 'type' in offer
            assert 'status' in offer
    
    def test_get_offers_with_location_filter(self, authenticated_client):
        """Test filtering offers by location (always uses 20km radius)"""
        client, _ = authenticated_client
        
        # Istanbul coordinates
        istanbul_lat, istanbul_lng = 41.0082, 28.9784
        
        # Create offer in Istanbul (within 20km)
        OfferFactory(
            title='Istanbul Offer',
            geo_location=[istanbul_lat, istanbul_lng],
            location_type='myLocation'
        )
        
        # Create offer far away (Ankara - ~350km from Istanbul)
        OfferFactory(
            title='Ankara Offer',
            geo_location=[39.9334, 32.8597],
            location_type='myLocation'
        )
        
        # Create remote offer (should always be included)
        OfferFactory(
            title='Remote Offer',
            location_type='remote',
            geo_location=[0, 0]
        )
        
        # Filter by Istanbul location (backend uses fixed 20km radius)
        response = client.get(f'/api/offers?lat={istanbul_lat}&lng={istanbul_lng}')
        
        assert response.status_code == status.HTTP_200_OK
        titles = [o['title'] for o in response.data]
        
        # Istanbul offer and Remote offer should be included
        assert 'Istanbul Offer' in titles
        assert 'Remote Offer' in titles
        # Ankara offer should be excluded (too far - beyond 20km)
        assert 'Ankara Offer' not in titles
    
    def test_get_offers_nearby_within_20km(self, authenticated_client):
        """Test offers within 20km are included"""
        client, _ = authenticated_client
        
        istanbul_lat, istanbul_lng = 41.0082, 28.9784
        
        # Create offer ~15km away (within 20km)
        OfferFactory(
            title='Nearby Offer',
            geo_location=[41.1, 29.1],  # Approximately 15km from Istanbul center
            location_type='myLocation'
        )
        
        response = client.get(f'/api/offers?lat={istanbul_lat}&lng={istanbul_lng}')
        titles = [o['title'] for o in response.data]
        
        assert 'Nearby Offer' in titles
    
    def test_get_offers_without_location_returns_all(self, authenticated_client):
        """Test that without location params, all offers are returned"""
        client, _ = authenticated_client
        
        OfferFactory(title='Offer 1', geo_location=[41.0, 29.0], location_type='myLocation')
        OfferFactory(title='Offer 2', geo_location=[39.0, 32.0], location_type='myLocation')
        OfferFactory(title='Remote', location_type='remote', geo_location=[0, 0])
        
        response = client.get('/api/offers')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3
    
    def test_get_offers_remote_always_included(self, authenticated_client):
        """Test that remote offers are always included"""
        client, _ = authenticated_client
        
        OfferFactory(title='Remote Work', location_type='remote', geo_location=[0, 0])
        
        response = client.get('/api/offers?lat=41.0&lng=29.0')
        
        assert response.status_code == status.HTTP_200_OK
        titles = [o['title'] for o in response.data]
        assert 'Remote Work' in titles


class TestOfferDetailView:
    """Tests for OfferDetailView"""
    
    def test_get_offer_detail_success(self, authenticated_client, offer):
        """Test getting offer details"""
        client, _ = authenticated_client
        
        response = client.get(f'/api/offers/{offer.id}')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == offer.id
        assert response.data['title'] == offer.title
    
    def test_get_offer_detail_not_found(self, authenticated_client):
        """Test getting non-existent offer"""
        client, _ = authenticated_client
        
        response = client.get('/api/offers/99999')
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_update_own_offer(self, authenticated_client):
        """Test user can update own offer"""
        client, user = authenticated_client
        TimeBank.objects.create(user=user, amount=5, available_amount=5, blocked_amount=0, total_amount=5)
        
        offer = OfferFactory(user=user)
        
        response = client.put(
            f'/api/offers/{offer.id}',
            {'title': 'Updated Title', 'description': 'Updated description'},
            format='json'
        )
        
        assert response.status_code == status.HTTP_200_OK
        offer.refresh_from_db()
        assert offer.title == 'Updated Title'
    
    def test_update_others_offer_fails(self, authenticated_client):
        """Test user cannot update other's offer"""
        client, _ = authenticated_client
        
        other_user, _ = create_user_with_timebank()
        offer = OfferFactory(user=other_user)
        
        response = client.put(
            f'/api/offers/{offer.id}',
            {'title': 'Hacked Title'},
            format='json'
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestCreateOfferView:
    """Tests for CreateOfferView"""
    
    def test_create_offer_success(self, authenticated_client):
        """Test creating a new offer"""
        client, user = authenticated_client
        TimeBank.objects.create(user=user, amount=5, available_amount=5, blocked_amount=0, total_amount=5)
        
        response = client.post('/api/create-offer', {
            'title': 'Test Offer',
            'description': 'Test description',
            'type': 'offer',
            'time_required': 2,
            'location': 'Istanbul',
            'activity_type': '1to1',
            'offer_type': '1time',
            'location_type': 'myLocation'
        }, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert 'offer_id' in response.data
        
        offer = Offer.objects.get(id=response.data['offer_id'])
        assert offer.title == 'Test Offer'
        assert offer.user == user
    
    def test_create_want_success(self, authenticated_client):
        """Test creating a want"""
        client, user = authenticated_client
        TimeBank.objects.create(user=user, amount=5, available_amount=5, blocked_amount=0, total_amount=5)
        
        response = client.post('/api/create-offer', {
            'title': 'Need Help',
            'description': 'Looking for help',
            'type': 'want',
            'time_required': 1
        }, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        
        offer = Offer.objects.get(id=response.data['offer_id'])
        assert offer.type == 'want'
    
    def test_create_group_offer_success(self, authenticated_client):
        """Test creating a group offer"""
        client, user = authenticated_client
        TimeBank.objects.create(user=user, amount=5, available_amount=5, blocked_amount=0, total_amount=5)
        
        response = client.post('/api/create-offer', {
            'title': 'Group Workshop',
            'description': 'Learning together',
            'type': 'offer',
            'activity_type': 'group',
            'person_count': 5,
            'time_required': 2
        }, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        
        offer = Offer.objects.get(id=response.data['offer_id'])
        assert offer.activity_type == 'group'
        assert offer.person_count == 5
    
    def test_create_offer_with_tags(self, authenticated_client):
        """Test creating offer with tags"""
        client, user = authenticated_client
        TimeBank.objects.create(user=user, amount=5, available_amount=5, blocked_amount=0, total_amount=5)
        
        response = client.post('/api/create-offer', {
            'title': 'Tagged Offer',
            'description': 'Has tags',
            'type': 'offer',
            'time_required': 1,
            'tags': ['python', 'django', 'web']
        }, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        
        offer = Offer.objects.get(id=response.data['offer_id'])
        assert 'python' in offer.tags


class TestUploadOfferImageView:
    """Tests for UploadOfferImageView"""
    
    def test_upload_image_requires_authentication(self, api_client, offer):
        """Test image upload requires authentication"""
        response = api_client.post(f'/api/offers/{offer.id}/images')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestDeleteOfferImageView:
    """Tests for DeleteOfferImageView"""
    
    def test_delete_image_requires_authentication(self, api_client, offer):
        """Test image deletion requires authentication"""
        response = api_client.delete(f'/api/offers/{offer.id}/images/1')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestSetPrimaryImageView:
    """Tests for SetPrimaryImageView"""
    
    def test_set_primary_requires_authentication(self, api_client, offer):
        """Test setting primary image requires authentication"""
        response = api_client.post(f'/api/offers/{offer.id}/images/1/primary')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
