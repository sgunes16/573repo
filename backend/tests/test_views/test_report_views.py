"""
Report Views Tests
Tests for FR-76 to FR-79 (User Report System)
"""

import pytest
from rest_framework.test import APIClient
from rest_framework import status
from rest_api.models import Report
from tests.factories import (
    UserFactory, UserProfileFactory, TimeBankFactory, 
    OfferFactory, ExchangeFactory, ReportFactory
)


@pytest.mark.django_db
class TestCreateReportView:
    """Tests for CreateReportView (FR-76 to FR-79)"""

    def test_report_user_success(self, authenticated_client):
        """FR-76: User can report another user"""
        client, user = authenticated_client
        target_user = UserFactory()
        
        url = '/api/reports'
        response = client.post(url, {
            'target_type': 'user',
            'target_id': target_user.id,
            'reason': 'HARASSMENT',
            'description': 'Harassing messages'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        assert 'report_id' in response.data
        
    def test_report_offer_success(self, authenticated_client):
        """FR-76: User can report an offer"""
        client, user = authenticated_client
        other_user = UserFactory()
        offer = OfferFactory(user=other_user, type='offer')
        
        url = '/api/reports'
        response = client.post(url, {
            'target_type': 'offer',
            'target_id': offer.id,
            'reason': 'SPAM'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        
    def test_report_want_success(self, authenticated_client):
        """FR-76: User can report a want"""
        client, user = authenticated_client
        other_user = UserFactory()
        want = OfferFactory(user=other_user, type='want')
        
        url = '/api/reports'
        response = client.post(url, {
            'target_type': 'want',
            'target_id': want.id,
            'reason': 'INAPPROPRIATE'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        
    def test_report_exchange_success(self, authenticated_client):
        """FR-76: User can report an exchange they're part of"""
        client, user = authenticated_client
        other_user = UserFactory()
        TimeBankFactory(user=user)
        TimeBankFactory(user=other_user)
        offer = OfferFactory(user=other_user)
        exchange = ExchangeFactory(
            offer=offer,
            provider=other_user,
            requester=user
        )
        
        url = '/api/reports'
        response = client.post(url, {
            'target_type': 'exchange',
            'target_id': exchange.id,
            'reason': 'FRAUD'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        
    def test_report_reason_spam(self, authenticated_client):
        """FR-77: User can select SPAM reason"""
        client, user = authenticated_client
        target_user = UserFactory()
        
        url = '/api/reports'
        response = client.post(url, {
            'target_type': 'user',
            'target_id': target_user.id,
            'reason': 'SPAM'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        
    def test_report_reason_inappropriate(self, authenticated_client):
        """FR-77: User can select INAPPROPRIATE reason"""
        client, user = authenticated_client
        target_user = UserFactory()
        
        url = '/api/reports'
        response = client.post(url, {
            'target_type': 'user',
            'target_id': target_user.id,
            'reason': 'INAPPROPRIATE'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        
    def test_report_reason_harassment(self, authenticated_client):
        """FR-77: User can select HARASSMENT reason"""
        client, user = authenticated_client
        target_user = UserFactory()
        
        url = '/api/reports'
        response = client.post(url, {
            'target_type': 'user',
            'target_id': target_user.id,
            'reason': 'HARASSMENT'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        
    def test_report_reason_fraud(self, authenticated_client):
        """FR-77: User can select FRAUD reason"""
        client, user = authenticated_client
        target_user = UserFactory()
        
        url = '/api/reports'
        response = client.post(url, {
            'target_type': 'user',
            'target_id': target_user.id,
            'reason': 'FRAUD'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        
    def test_report_reason_fake_profile(self, authenticated_client):
        """FR-77: User can select FAKE_PROFILE reason"""
        client, user = authenticated_client
        target_user = UserFactory()
        
        url = '/api/reports'
        response = client.post(url, {
            'target_type': 'user',
            'target_id': target_user.id,
            'reason': 'FAKE_PROFILE'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        
    def test_report_reason_other(self, authenticated_client):
        """FR-77: User can select OTHER reason"""
        client, user = authenticated_client
        target_user = UserFactory()
        
        url = '/api/reports'
        response = client.post(url, {
            'target_type': 'user',
            'target_id': target_user.id,
            'reason': 'OTHER'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        
    def test_report_with_description(self, authenticated_client):
        """FR-78: User can add description to report"""
        client, user = authenticated_client
        target_user = UserFactory()
        
        url = '/api/reports'
        response = client.post(url, {
            'target_type': 'user',
            'target_id': target_user.id,
            'reason': 'OTHER',
            'description': 'Detailed description of the issue...'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        
        # Verify description is saved
        report = Report.objects.get(id=response.data['report_id'])
        assert report.description == 'Detailed description of the issue...'
        
    def test_report_duplicate_prevented(self, authenticated_client):
        """FR-79: Prevent duplicate reports from same user"""
        client, user = authenticated_client
        target_user = UserFactory()
        
        # First report
        url = '/api/reports'
        response1 = client.post(url, {
            'target_type': 'user',
            'target_id': target_user.id,
            'reason': 'SPAM'
        })
        assert response1.status_code == status.HTTP_201_CREATED
        
        # Duplicate report
        response2 = client.post(url, {
            'target_type': 'user',
            'target_id': target_user.id,
            'reason': 'HARASSMENT'
        })
        assert response2.status_code == status.HTTP_400_BAD_REQUEST
        assert 'already reported' in response2.data['error'].lower()
        
    def test_report_invalid_reason(self, authenticated_client):
        """Reject invalid reason category"""
        client, user = authenticated_client
        target_user = UserFactory()
        
        url = '/api/reports'
        response = client.post(url, {
            'target_type': 'user',
            'target_id': target_user.id,
            'reason': 'INVALID_REASON'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
    def test_report_invalid_target_type(self, authenticated_client):
        """Reject invalid target type"""
        client, user = authenticated_client
        url = '/api/reports'
        response = client.post(url, {
            'target_type': 'invalid_type',
            'target_id': 1,
            'reason': 'SPAM'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
    def test_report_missing_required_fields(self, authenticated_client):
        """Require target_type, target_id, and reason"""
        client, user = authenticated_client
        url = '/api/reports'
        
        # Missing reason
        response = client.post(url, {
            'target_type': 'user',
            'target_id': 1
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
    def test_report_nonexistent_user(self, authenticated_client):
        """Return 404 for non-existent target user"""
        client, user = authenticated_client
        url = '/api/reports'
        response = client.post(url, {
            'target_type': 'user',
            'target_id': 99999,
            'reason': 'SPAM'
        })
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        
    def test_report_nonexistent_offer(self, authenticated_client):
        """Return 404 for non-existent offer"""
        client, user = authenticated_client
        url = '/api/reports'
        response = client.post(url, {
            'target_type': 'offer',
            'target_id': 99999,
            'reason': 'SPAM'
        })
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        
    def test_cannot_report_own_offer(self, authenticated_client):
        """User cannot report their own offer"""
        client, user = authenticated_client
        offer = OfferFactory(user=user)
        
        url = '/api/reports'
        response = client.post(url, {
            'target_type': 'offer',
            'target_id': offer.id,
            'reason': 'SPAM'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'cannot report your own' in response.data['error'].lower()
        
    def test_cannot_report_self(self, authenticated_client):
        """User cannot report themselves"""
        client, user = authenticated_client
        url = '/api/reports'
        response = client.post(url, {
            'target_type': 'user',
            'target_id': user.id,
            'reason': 'SPAM'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'cannot report yourself' in response.data['error'].lower()
        
    def test_cannot_report_exchange_not_part_of(self, authenticated_client):
        """User cannot report exchange they're not part of"""
        client, user = authenticated_client
        user1 = UserFactory()
        user2 = UserFactory()
        TimeBankFactory(user=user1)
        TimeBankFactory(user=user2)
        offer = OfferFactory(user=user1)
        exchange = ExchangeFactory(
            offer=offer,
            provider=user1,
            requester=user2
        )
        
        url = '/api/reports'
        response = client.post(url, {
            'target_type': 'exchange',
            'target_id': exchange.id,
            'reason': 'FRAUD'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
    def test_report_requires_authentication(self):
        """Unauthenticated users cannot create reports"""
        client = APIClient()
        url = '/api/reports'
        response = client.post(url, {
            'target_type': 'user',
            'target_id': 1,
            'reason': 'SPAM'
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

