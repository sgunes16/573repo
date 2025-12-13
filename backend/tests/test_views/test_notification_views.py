"""
Notification Views Tests
Tests for FR-70 to FR-75 (Notification System)
"""

import pytest
from rest_framework.test import APIClient
from rest_framework import status
from rest_api.models import Notification
from tests.factories import UserFactory, TimeBankFactory, NotificationFactory


@pytest.mark.django_db
class TestNotificationsView:
    """Tests for NotificationsView (FR-71, FR-74, FR-75)"""

    def test_get_notifications_success(self, authenticated_client):
        """FR-71: User can view all notifications"""
        client, user = authenticated_client
        NotificationFactory(user=user, content='Notification 1')
        NotificationFactory(user=user, content='Notification 2')
        NotificationFactory(user=user, content='Notification 3')
        
        url = '/api/notifications'
        response = client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3
        
    def test_get_notifications_ordered_by_date(self, authenticated_client):
        """Notifications are ordered by creation date (newest first)"""
        client, user = authenticated_client
        from django.utils import timezone
        from datetime import timedelta
        
        old_notification = NotificationFactory(user=user, content='Old')
        new_notification = NotificationFactory(user=user, content='New')
        
        url = '/api/notifications'
        response = client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data[0]['content'] == 'New'
        
    def test_get_notifications_only_own(self, authenticated_client):
        """User can only see their own notifications"""
        client, user = authenticated_client
        other_user = UserFactory()
        NotificationFactory(user=user, content='My notification')
        NotificationFactory(user=other_user, content='Other notification')
        
        url = '/api/notifications'
        response = client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['content'] == 'My notification'
        
    def test_filter_notifications_by_read_status(self, authenticated_client):
        """FR-75: Filter notifications by read/unread"""
        client, user = authenticated_client
        NotificationFactory(user=user, content='Read', is_read=True)
        NotificationFactory(user=user, content='Unread', is_read=False)
        
        # Filter unread only
        url = '/api/notifications?is_read=false'
        response = client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['content'] == 'Unread'
        
    def test_filter_notifications_read_only(self, authenticated_client):
        """FR-75: Filter to show only read notifications"""
        client, user = authenticated_client
        NotificationFactory(user=user, content='Read', is_read=True)
        NotificationFactory(user=user, content='Unread', is_read=False)
        
        url = '/api/notifications?is_read=true'
        response = client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['content'] == 'Read'
        
    def test_notifications_includes_required_fields(self, authenticated_client):
        """Notifications include all required fields"""
        client, user = authenticated_client
        NotificationFactory(user=user, content='Test notification')
        
        url = '/api/notifications'
        response = client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'id' in response.data[0]
        assert 'content' in response.data[0]
        assert 'is_read' in response.data[0]
        assert 'created_at' in response.data[0]
        
    def test_notifications_requires_authentication(self):
        """Unauthenticated users cannot view notifications"""
        client = APIClient()
        url = '/api/notifications'
        response = client.get(url)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestMarkNotificationReadView:
    """Tests for MarkNotificationReadView (FR-72)"""

    def test_mark_notification_as_read(self, authenticated_client):
        """FR-72: Mark notification as read"""
        client, user = authenticated_client
        notification = NotificationFactory(user=user, is_read=False)
        
        url = f'/api/notifications/{notification.id}'
        response = client.patch(url, {'is_read': True})
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['is_read'] in [True, 'True']
        
        # Verify in database
        notification.refresh_from_db()
        assert notification.is_read is True
        
    def test_mark_notification_as_unread(self, authenticated_client):
        """FR-72: Mark notification as unread"""
        client, user = authenticated_client
        notification = NotificationFactory(user=user, is_read=True)
        
        url = f'/api/notifications/{notification.id}'
        response = client.patch(url, {'is_read': False})
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['is_read'] in [False, 'False']
        
    def test_cannot_mark_others_notification(self, authenticated_client):
        """User cannot mark others' notifications as read"""
        client, user = authenticated_client
        other_user = UserFactory()
        notification = NotificationFactory(user=other_user)
        
        url = f'/api/notifications/{notification.id}'
        response = client.patch(url, {'is_read': True})
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        
    def test_mark_nonexistent_notification(self, authenticated_client):
        """Return 404 for non-existent notification"""
        client, user = authenticated_client
        url = '/api/notifications/99999'
        response = client.patch(url, {'is_read': True})
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        
    def test_delete_notification(self, authenticated_client):
        """User can delete notification"""
        client, user = authenticated_client
        notification = NotificationFactory(user=user)
        
        url = f'/api/notifications/{notification.id}'
        response = client.delete(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert not Notification.objects.filter(id=notification.id).exists()
        
    def test_cannot_delete_others_notification(self, authenticated_client):
        """User cannot delete others' notifications"""
        client, user = authenticated_client
        other_user = UserFactory()
        notification = NotificationFactory(user=other_user)
        
        url = f'/api/notifications/{notification.id}'
        response = client.delete(url)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestMarkAllNotificationsReadView:
    """Tests for MarkAllNotificationsReadView (FR-73)"""

    def test_mark_all_as_read(self, authenticated_client):
        """FR-73: Mark all notifications as read"""
        client, user = authenticated_client
        NotificationFactory(user=user, is_read=False)
        NotificationFactory(user=user, is_read=False)
        NotificationFactory(user=user, is_read=False)
        
        url = '/api/notifications/mark-all-read'
        response = client.post(url)
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify all are read
        unread_count = Notification.objects.filter(user=user, is_read=False).count()
        assert unread_count == 0
        
    def test_mark_all_only_affects_own_notifications(self, authenticated_client):
        """Mark all only affects own notifications"""
        client, user = authenticated_client
        other_user = UserFactory()
        NotificationFactory(user=user, is_read=False)
        NotificationFactory(user=other_user, is_read=False)
        
        url = '/api/notifications/mark-all-read'
        response = client.post(url)
        
        assert response.status_code == status.HTTP_200_OK
        
        # Own notification should be read
        assert Notification.objects.filter(user=user, is_read=False).count() == 0
        
        # Other user's notification should still be unread
        assert Notification.objects.filter(user=other_user, is_read=False).count() == 1
        
    def test_mark_all_with_no_unread(self, authenticated_client):
        """Works even if no unread notifications"""
        client, user = authenticated_client
        NotificationFactory(user=user, is_read=True)
        
        url = '/api/notifications/mark-all-read'
        response = client.post(url)
        
        assert response.status_code == status.HTTP_200_OK
        
    def test_mark_all_requires_authentication(self):
        """Unauthenticated users cannot mark all as read"""
        client = APIClient()
        url = '/api/notifications/mark-all-read'
        response = client.post(url)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestNotificationCreation:
    """Tests for notification creation (FR-70)"""

    def test_notification_created_on_event(self, user):
        """FR-70: System sends notifications on events"""
        # Create notification directly (simulating event)
        notification = Notification.objects.create(
            user=user,
            content='New exchange request received'
        )
        
        assert notification.id is not None
        assert notification.is_read is False
        
    def test_notification_count_in_navbar(self, authenticated_client):
        """FR-74: Display unread notification count"""
        client, user = authenticated_client
        NotificationFactory(user=user, is_read=False)
        NotificationFactory(user=user, is_read=False)
        NotificationFactory(user=user, is_read=True)
        
        url = '/api/notifications?is_read=false'
        response = client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        # 2 unread notifications
        assert len(response.data) == 2

