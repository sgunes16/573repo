"""
Admin Views Tests
Tests for FR-53 to FR-62h (Admin Panel operations)
"""

import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from rest_api.models import Notification, Report
from tests.factories import (
    UserFactory, UserProfileFactory, TimeBankFactory, 
    OfferFactory, ExchangeFactory, ReportFactory
)


@pytest.mark.django_db
class TestAdminKPIView:
    """Tests for AdminKPIView (FR-62a)"""

    def test_get_kpi_success(self, authenticated_admin_client):
        """FR-62a: Admin can view KPI dashboard"""
        admin_client, admin_user = authenticated_admin_client
        # Create some data
        user1 = UserFactory()
        user2 = UserFactory()
        OfferFactory(type='offer', status='ACTIVE')
        OfferFactory(type='want', status='ACTIVE')
        
        url = '/api/admin/kpi'
        response = admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'total_users' in response.data
        assert 'active_offers' in response.data
        assert 'active_wants' in response.data
        assert 'completed_exchanges' in response.data
        assert 'pending_reports' in response.data
        
    def test_get_kpi_counts_correctly(self, authenticated_admin_client):
        """FR-62a: KPI shows correct counts"""
        admin_client, admin_user = authenticated_admin_client
        # Create offers and wants
        OfferFactory(type='offer', status='ACTIVE')
        OfferFactory(type='offer', status='ACTIVE')
        OfferFactory(type='want', status='ACTIVE')
        
        url = '/api/admin/kpi'
        response = admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['active_offers'] >= 2
        assert response.data['active_wants'] >= 1
        
    def test_get_kpi_requires_admin(self, authenticated_client):
        """Non-admin users cannot access KPI"""
        client, user = authenticated_client
        url = '/api/admin/kpi'
        response = client.get(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        
    def test_get_kpi_requires_authentication(self):
        """Unauthenticated users cannot access KPI"""
        client = APIClient()
        url = '/api/admin/kpi'
        response = client.get(url)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
    def test_get_kpi_includes_recent_reports(self, authenticated_admin_client):
        """FR-62a: KPI includes recent reports list"""
        admin_client, admin_user = authenticated_admin_client
        reporter = UserFactory()
        reported = UserFactory()
        ReportFactory(reporter=reporter, reported_user=reported)
        
        url = '/api/admin/kpi'
        response = admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'recent_reports' in response.data


@pytest.mark.django_db
class TestAdminBanUserView:
    """Tests for AdminBanUserView (FR-62c, FR-62e)"""

    def test_ban_user_success(self, authenticated_admin_client):
        """FR-62c: Admin can ban users"""
        admin_client, admin_user = authenticated_admin_client
        target_user = UserFactory()
        
        url = f'/api/admin/users/{target_user.id}/ban'
        response = admin_client.post(url, {
            'reason': 'Violation of community guidelines'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['user']['is_banned'] is True
        
        # Verify user is actually banned
        target_user.refresh_from_db()
        assert target_user.is_banned is True
        
    def test_ban_user_with_duration(self, authenticated_admin_client):
        """FR-62c: Admin can set ban duration"""
        admin_client, admin_user = authenticated_admin_client
        target_user = UserFactory()
        
        url = f'/api/admin/users/{target_user.id}/ban'
        response = admin_client.post(url, {
            'reason': 'Temporary ban',
            'duration_days': 7
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert int(response.data['duration_days']) == 7
        
    def test_ban_user_not_found(self, authenticated_admin_client):
        """Return 404 for non-existent user"""
        admin_client, admin_user = authenticated_admin_client
        url = '/api/admin/users/99999/ban'
        response = admin_client.post(url, {
            'reason': 'Test'
        })
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        
    def test_ban_user_requires_admin(self, authenticated_client):
        """FR-62c: Only admin can ban users"""
        client, user = authenticated_client
        target_user = UserFactory()
        
        url = f'/api/admin/users/{target_user.id}/ban'
        response = client.post(url, {
            'reason': 'Test'
        })
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestAdminWarnUserView:
    """Tests for AdminWarnUserView (FR-62b, FR-62d)"""

    def test_warn_user_success(self, authenticated_admin_client):
        """FR-62b: Admin can issue warnings to users"""
        admin_client, admin_user = authenticated_admin_client
        target_user = UserFactory(warning_count=0)
        
        url = f'/api/admin/users/{target_user.id}/warn'
        response = admin_client.post(url, {
            'message': 'Please follow community guidelines'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['user']['warning_count'] == 1
        
    def test_warn_user_increments_count(self, authenticated_admin_client):
        """FR-62d: System tracks warning count"""
        admin_client, admin_user = authenticated_admin_client
        target_user = UserFactory(warning_count=2)
        
        url = f'/api/admin/users/{target_user.id}/warn'
        response = admin_client.post(url, {
            'message': 'Third warning'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['user']['warning_count'] == 3
        
    def test_warn_user_creates_notification(self, authenticated_admin_client):
        """FR-62h: Notify user when warned"""
        admin_client, admin_user = authenticated_admin_client
        target_user = UserFactory()
        
        url = f'/api/admin/users/{target_user.id}/warn'
        response = admin_client.post(url, {
            'message': 'Warning notification test'
        })
        
        assert response.status_code == status.HTTP_200_OK
        
        # Check notification was created
        notification = Notification.objects.filter(user=target_user).first()
        assert notification is not None
        assert 'Warning' in notification.content
        
    def test_warn_user_requires_message(self, authenticated_admin_client):
        """Warning requires a message"""
        admin_client, admin_user = authenticated_admin_client
        target_user = UserFactory()
        
        url = f'/api/admin/users/{target_user.id}/warn'
        response = admin_client.post(url, {})
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
    def test_warn_user_not_found(self, authenticated_admin_client):
        """Return 404 for non-existent user"""
        admin_client, admin_user = authenticated_admin_client
        url = '/api/admin/users/99999/warn'
        response = admin_client.post(url, {
            'message': 'Test'
        })
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        
    def test_warn_user_requires_admin(self, authenticated_client):
        """Only admin can warn users"""
        client, user = authenticated_client
        target_user = UserFactory()
        
        url = f'/api/admin/users/{target_user.id}/warn'
        response = client.post(url, {
            'message': 'Test'
        })
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestAdminDeleteOfferView:
    """Tests for AdminDeleteOfferView (FR-62f)"""

    def test_delete_offer_success(self, authenticated_admin_client):
        """FR-62f: Admin can delete offers"""
        admin_client, admin_user = authenticated_admin_client
        offer = OfferFactory(type='offer')
        
        url = f'/api/admin/offers/{offer.id}'
        response = admin_client.delete(url)
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify offer is cancelled (not deleted)
        offer.refresh_from_db()
        assert offer.status == 'CANCELLED'
        
    def test_delete_want_success(self, authenticated_admin_client):
        """FR-62f: Admin can delete wants"""
        admin_client, admin_user = authenticated_admin_client
        want = OfferFactory(type='want')
        
        url = f'/api/admin/offers/{want.id}'
        response = admin_client.delete(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'Want' in response.data['message']
        
    def test_delete_offer_not_found(self, authenticated_admin_client):
        """Return 404 for non-existent offer"""
        admin_client, admin_user = authenticated_admin_client
        url = '/api/admin/offers/99999'
        response = admin_client.delete(url)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        
    def test_delete_offer_requires_admin(self, authenticated_client):
        """Only admin can delete offers"""
        client, user = authenticated_client
        offer = OfferFactory()
        
        url = f'/api/admin/offers/{offer.id}'
        response = client.delete(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestAdminReportsListView:
    """Tests for AdminReportsListView (FR-64)"""

    def test_list_reports_success(self, authenticated_admin_client):
        """FR-64: Admin can view reports list"""
        admin_client, admin_user = authenticated_admin_client
        reporter = UserFactory()
        reported = UserFactory()
        ReportFactory(reporter=reporter, reported_user=reported)
        ReportFactory(reporter=reporter, reported_user=reported)
        
        url = '/api/admin/reports'
        response = admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 2
        
    def test_list_reports_includes_details(self, authenticated_admin_client):
        """FR-65: Reports include full details"""
        admin_client, admin_user = authenticated_admin_client
        reporter = UserFactory()
        reported = UserFactory()
        ReportFactory(
            reporter=reporter, 
            reported_user=reported,
            reason='SPAM',
            description='Test description'
        )
        
        url = '/api/admin/reports'
        response = admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data[0]['reason'] == 'SPAM'
        assert response.data[0]['description'] == 'Test description'
        
    def test_list_reports_requires_admin(self, authenticated_client):
        """Only admin can view reports"""
        client, user = authenticated_client
        url = '/api/admin/reports'
        response = client.get(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestAdminExchangeDetailView:
    """Tests for AdminExchangeDetailView (FR-62)"""

    def test_get_exchange_detail_success(self, authenticated_admin_client):
        """FR-62: Admin can view exchange details"""
        admin_client, admin_user = authenticated_admin_client
        provider = UserFactory()
        requester = UserFactory()
        TimeBankFactory(user=provider)
        TimeBankFactory(user=requester)
        offer = OfferFactory(user=provider)
        exchange = ExchangeFactory(
            offer=offer,
            provider=provider,
            requester=requester
        )
        
        url = f'/api/admin/exchanges/{exchange.id}'
        response = admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == exchange.id
        assert 'offer' in response.data
        assert 'provider' in response.data
        assert 'requester' in response.data
        
    def test_get_exchange_with_messages(self, authenticated_admin_client):
        """FR-62: Admin can view exchange messages"""
        admin_client, admin_user = authenticated_admin_client
        provider = UserFactory()
        requester = UserFactory()
        TimeBankFactory(user=provider)
        TimeBankFactory(user=requester)
        offer = OfferFactory(user=provider)
        exchange = ExchangeFactory(
            offer=offer,
            provider=provider,
            requester=requester
        )
        
        url = f'/api/admin/exchanges/{exchange.id}'
        response = admin_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'messages' in response.data
        
    def test_get_exchange_requires_admin(self, authenticated_client):
        """Only admin can view exchange details via admin endpoint"""
        client, user = authenticated_client
        provider = UserFactory()
        requester = UserFactory()
        TimeBankFactory(user=provider)
        TimeBankFactory(user=requester)
        offer = OfferFactory(user=provider)
        exchange = ExchangeFactory(
            offer=offer,
            provider=provider,
            requester=requester
        )
        
        url = f'/api/admin/exchanges/{exchange.id}'
        response = client.get(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

