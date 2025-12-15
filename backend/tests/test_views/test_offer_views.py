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
    
    def test_get_offers_excludes_flagged(self, authenticated_client):
        """Test flagged offers are not shown in dashboard"""
        client, _ = authenticated_client
        
        # Create normal active offer
        normal_offer = OfferFactory(status='ACTIVE', is_flagged=False)
        # Create flagged offer (admin removed)
        flagged_offer = OfferFactory(status='INACTIVE', is_flagged=True, flagged_reason='Violation of guidelines')
        # Create another flagged but active (shouldn't appear)
        OfferFactory(status='ACTIVE', is_flagged=True, flagged_reason='Spam')
        
        response = client.get('/api/offers')
        
        assert response.status_code == status.HTTP_200_OK
        offer_ids = [o['id'] for o in response.data]
        
        # Normal offer should be visible
        assert normal_offer.id in offer_ids
        # Flagged offers should NOT be visible
        assert flagged_offer.id not in offer_ids
        # Active but flagged should also NOT be visible
        for offer in response.data:
            # None of the returned offers should be flagged
            pass  # We can't check is_flagged in response as it's not returned in list
        
        # Only 1 offer should be returned (the non-flagged active one)
        assert len(response.data) == 1
    
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


class TestDeleteOfferView:
    """Tests for deleting offers/wants (FR-5a, FR-5c, FR-5d, FR-11a, FR-11c, FR-11d)"""
    
    def test_delete_own_offer_success(self, authenticated_client):
        """FR-5a/FR-11a: User can delete their own offer"""
        client, user = authenticated_client
        TimeBank.objects.create(user=user, amount=5, available_amount=5, blocked_amount=0, total_amount=5)
        
        offer = OfferFactory(user=user, title='My Offer to Delete')
        offer_id = offer.id
        
        response = client.delete(f'/api/offers/{offer_id}')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'deleted successfully' in response.data['message']
        
        # Verify offer is deleted from database
        assert not Offer.objects.filter(id=offer_id).exists()
    
    def test_delete_own_want_success(self, authenticated_client):
        """FR-11a: User can delete their own want"""
        client, user = authenticated_client
        TimeBank.objects.create(user=user, amount=5, available_amount=5, blocked_amount=0, total_amount=5)
        
        want = WantFactory(user=user, title='My Want to Delete')
        want_id = want.id
        
        response = client.delete(f'/api/offers/{want_id}')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'deleted successfully' in response.data['message']
        assert not Offer.objects.filter(id=want_id).exists()
    
    def test_delete_others_offer_fails(self, authenticated_client):
        """Test user cannot delete other user's offer"""
        client, _ = authenticated_client
        
        other_user, _ = create_user_with_timebank()
        offer = OfferFactory(user=other_user, title='Not My Offer')
        
        response = client.delete(f'/api/offers/{offer.id}')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert 'Not authorized' in response.data['error']
        
        # Verify offer still exists
        assert Offer.objects.filter(id=offer.id).exists()
    
    def test_delete_offer_with_pending_exchange_fails(self, authenticated_client):
        """FR-5c/FR-11c: Cannot delete offer with PENDING exchanges"""
        from tests.factories import ExchangeFactory
        
        client, user = authenticated_client
        TimeBank.objects.create(user=user, amount=5, available_amount=5, blocked_amount=0, total_amount=5)
        
        offer = OfferFactory(user=user)
        requester, _ = create_user_with_timebank()
        ExchangeFactory(offer=offer, provider=user, requester=requester, status='PENDING')
        
        response = client.delete(f'/api/offers/{offer.id}')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'cancelled' in response.data['error'].lower()
        
        # Verify offer still exists
        assert Offer.objects.filter(id=offer.id).exists()
    
    def test_delete_offer_with_accepted_exchange_fails(self, authenticated_client):
        """FR-5c/FR-11c: Cannot delete offer with ACCEPTED exchanges"""
        from tests.factories import ExchangeFactory
        
        client, user = authenticated_client
        TimeBank.objects.create(user=user, amount=5, available_amount=5, blocked_amount=0, total_amount=5)
        
        offer = OfferFactory(user=user)
        requester, _ = create_user_with_timebank()
        ExchangeFactory(offer=offer, provider=user, requester=requester, status='ACCEPTED')
        
        response = client.delete(f'/api/offers/{offer.id}')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'cancelled' in response.data['error'].lower()
    
    def test_delete_offer_with_completed_exchange_fails(self, authenticated_client):
        """Cannot delete offer with COMPLETED exchanges"""
        from tests.factories import ExchangeFactory
        
        client, user = authenticated_client
        TimeBank.objects.create(user=user, amount=5, available_amount=5, blocked_amount=0, total_amount=5)
        
        offer = OfferFactory(user=user)
        requester, _ = create_user_with_timebank()
        ExchangeFactory(offer=offer, provider=user, requester=requester, status='COMPLETED')
        
        response = client.delete(f'/api/offers/{offer.id}')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'cancelled' in response.data['error'].lower()
        
        # Verify offer still exists
        assert Offer.objects.filter(id=offer.id).exists()
    
    def test_delete_offer_with_cancelled_exchange_success(self, authenticated_client):
        """Can delete offer with only CANCELLED exchanges"""
        from tests.factories import ExchangeFactory
        
        client, user = authenticated_client
        TimeBank.objects.create(user=user, amount=5, available_amount=5, blocked_amount=0, total_amount=5)
        
        offer = OfferFactory(user=user)
        requester, _ = create_user_with_timebank()
        ExchangeFactory(offer=offer, provider=user, requester=requester, status='CANCELLED')
        
        response = client.delete(f'/api/offers/{offer.id}')
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_delete_nonexistent_offer_returns_404(self, authenticated_client):
        """Test deleting non-existent offer returns 404"""
        client, _ = authenticated_client
        
        response = client.delete('/api/offers/99999')
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_delete_offer_requires_authentication(self, api_client, offer):
        """Test deleting offer requires authentication"""
        response = api_client.delete(f'/api/offers/{offer.id}')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_delete_group_offer_success(self, authenticated_client):
        """Test deleting a group offer"""
        client, user = authenticated_client
        TimeBank.objects.create(user=user, amount=5, available_amount=5, blocked_amount=0, total_amount=5)
        
        group_offer = GroupOfferFactory(user=user, title='Group to Delete')
        
        response = client.delete(f'/api/offers/{group_offer.id}')
        
        assert response.status_code == status.HTTP_200_OK
        assert not Offer.objects.filter(id=group_offer.id).exists()


@pytest.mark.django_db
class TestPastDateValidation:
    """Tests for past date validation on offers"""
    
    def test_create_offer_with_past_date_fails(self, authenticated_client):
        """Test creating an offer with a past date returns error"""
        client, user = authenticated_client
        TimeBank.objects.create(user=user, amount=5, available_amount=5, blocked_amount=0, total_amount=5)
        user.is_verified = True
        user.save()
        
        response = client.post('/api/create-offer', {
            'title': 'Test Offer',
            'description': 'Test description',
            'type': 'offer',
            'time_required': 1,
            'date': '2020-01-01',  # Past date
            'activity_type': '1to1',
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data.get('code') == 'PAST_DATE'
        assert 'past' in response.data.get('error', '').lower()
    
    def test_create_offer_with_past_from_date_fails(self, authenticated_client):
        """Test creating an offer with a past from_date returns error"""
        client, user = authenticated_client
        TimeBank.objects.create(user=user, amount=5, available_amount=5, blocked_amount=0, total_amount=5)
        user.is_verified = True
        user.save()
        
        response = client.post('/api/create-offer', {
            'title': 'Test Offer',
            'description': 'Test description',
            'type': 'offer',
            'time_required': 1,
            'from_date': '2020-01-01T10:00:00Z',  # Past date
            'activity_type': '1to1',
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data.get('code') == 'PAST_DATE'
    
    def test_create_offer_with_future_date_succeeds(self, authenticated_client):
        """Test creating an offer with a future date succeeds"""
        client, user = authenticated_client
        TimeBank.objects.create(user=user, amount=5, available_amount=5, blocked_amount=0, total_amount=5)
        user.is_verified = True
        user.save()
        
        from datetime import date, timedelta
        future_date = (date.today() + timedelta(days=7)).isoformat()
        
        response = client.post('/api/create-offer', {
            'title': 'Test Offer',
            'description': 'Test description',
            'type': 'offer',
            'time_required': 1,
            'date': future_date,
            'activity_type': '1to1',
        })
        
        assert response.status_code == status.HTTP_201_CREATED
    
    def test_create_offer_with_today_date_succeeds(self, authenticated_client):
        """Test creating an offer with today's date succeeds"""
        client, user = authenticated_client
        TimeBank.objects.create(user=user, amount=5, available_amount=5, blocked_amount=0, total_amount=5)
        user.is_verified = True
        user.save()
        
        from datetime import date
        today = date.today().isoformat()
        
        response = client.post('/api/create-offer', {
            'title': 'Test Offer',
            'description': 'Test description',
            'type': 'offer',
            'time_required': 1,
            'date': today,
            'activity_type': '1to1',
        })
        
        assert response.status_code == status.HTTP_201_CREATED
    
    def test_update_offer_with_past_date_fails(self, authenticated_client):
        """Test updating an offer with a past date returns error"""
        client, user = authenticated_client
        TimeBank.objects.create(user=user, amount=5, available_amount=5, blocked_amount=0, total_amount=5)
        
        from datetime import datetime, timedelta
        from django.utils import timezone
        future_dt = timezone.now() + timedelta(days=7)
        offer = OfferFactory(user=user, scheduled_at=future_dt)
        
        response = client.put(f'/api/offers/{offer.id}', {
            'scheduled_at': '2020-01-01T10:00:00Z',  # Past date
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data.get('code') == 'PAST_DATE'
