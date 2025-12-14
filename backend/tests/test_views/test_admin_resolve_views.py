"""
Tests for Admin Report Resolution Views

This module tests the AdminReportResolveView functionality including:
- Remove Content action (offer/want/exchange deletion with credit refunds)
- Ban User action (account suspension with exchange cancellation)
- Warn User action (warning notification and count increment)
- Combined actions (Remove Content + Ban/Warn)
"""

import pytest
from unittest.mock import patch
from django.db.models import Q
from rest_framework import status
from rest_framework.test import APIClient

from rest_api.models import User, Offer, Exchange, TimeBank, Report, Notification
from tests.factories import UserFactory, OfferFactory, ExchangeFactory, WantFactory


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    user = UserFactory(is_admin=True)
    TimeBank.objects.get_or_create(
        user=user,
        defaults={'amount': 10, 'blocked_amount': 0, 'available_amount': 10, 'total_amount': 10}
    )
    return user


@pytest.fixture
def regular_user(db):
    user = UserFactory()
    TimeBank.objects.get_or_create(
        user=user,
        defaults={'amount': 10, 'blocked_amount': 0, 'available_amount': 10, 'total_amount': 10}
    )
    return user


@pytest.fixture
def reporter_user(db):
    user = UserFactory()
    TimeBank.objects.get_or_create(
        user=user,
        defaults={'amount': 10, 'blocked_amount': 0, 'available_amount': 10, 'total_amount': 10}
    )
    return user


@pytest.mark.django_db
class TestRemoveContentAction:
    """Tests for remove_content action in resolve report"""

    @patch('rest_api.views.send_notification')
    def test_remove_offer_deletes_offer_and_cancels_exchanges(self, mock_notify, api_client, admin_user, regular_user, reporter_user):
        """Remove content should delete offer and cancel all related exchanges"""
        api_client.force_authenticate(user=admin_user)
        
        # Create offer with pending exchange
        offer = OfferFactory(user=regular_user, type='offer')
        requester = UserFactory()
        requester_tb = TimeBank.objects.create(
            user=requester, amount=10, blocked_amount=2, available_amount=8, total_amount=10
        )
        exchange = Exchange.objects.create(
            offer=offer,
            provider=regular_user,
            requester=requester,
            status='PENDING',
            time_spent=2
        )
        exchange_id = exchange.id
        
        # Create report
        report = Report.objects.create(
            reporter=reporter_user,
            reported_user=regular_user,
            target_type='offer',
            target_id=offer.id,
            reason='SPAM'
        )
        
        # Resolve with remove_content
        response = api_client.post(f'/api/admin/reports/{report.id}/resolve', {
            'remove_content': True,
            'admin_notes': 'Content removed due to spam'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert 'content_removed' in response.data['actions_taken']
        
        # Offer should be soft deleted (INACTIVE + flagged)
        offer.refresh_from_db()
        assert offer.status == 'INACTIVE'
        assert offer.is_flagged is True
        assert offer.flagged_reason != ''
        
        # Exchange should be cancelled
        exchange.refresh_from_db()
        assert exchange.status == 'CANCELLED'
        
        # Requester's credits should be unblocked
        requester_tb.refresh_from_db()
        assert requester_tb.blocked_amount == 0
        assert requester_tb.available_amount == 10
        
        # Report should be resolved
        report.refresh_from_db()
        assert report.status == 'RESOLVED'

    @patch('rest_api.views.send_notification')
    def test_remove_want_unblocks_owner_credits(self, mock_notify, api_client, admin_user, regular_user, reporter_user):
        """Remove want should unblock owner's credits"""
        api_client.force_authenticate(user=admin_user)
        
        # Create want with blocked credits
        user_tb = regular_user.timebank
        user_tb.blocked_amount = 3
        user_tb.available_amount = 7
        user_tb.save()
        
        want = OfferFactory(user=regular_user, type='want', time_required=3)
        
        # Create report
        report = Report.objects.create(
            reporter=reporter_user,
            reported_user=regular_user,
            target_type='want',
            target_id=want.id,
            reason='INAPPROPRIATE'
        )
        
        # Resolve with remove_content
        response = api_client.post(f'/api/admin/reports/{report.id}/resolve', {
            'remove_content': True,
            'admin_notes': 'Inappropriate content'
        })
        
        assert response.status_code == status.HTTP_200_OK
        
        # Want should be soft deleted (INACTIVE + flagged)
        want.refresh_from_db()
        assert want.status == 'INACTIVE'
        assert want.is_flagged is True
        
        # Owner's credits should be unblocked
        user_tb.refresh_from_db()
        assert user_tb.blocked_amount == 0
        assert user_tb.available_amount == 10

    @patch('rest_api.views.send_notification')
    def test_remove_exchange_cancels_and_flags_offer(self, mock_notify, api_client, admin_user, regular_user, reporter_user):
        """Remove exchange should cancel it, refund credits, AND flag the related offer"""
        api_client.force_authenticate(user=admin_user)
        
        # Create offer and exchange
        provider = regular_user
        requester = UserFactory()
        requester_tb = TimeBank.objects.create(
            user=requester, amount=10, blocked_amount=2, available_amount=8, total_amount=10
        )
        
        offer = OfferFactory(user=provider, type='offer', time_required=2)
        exchange = Exchange.objects.create(
            offer=offer,
            provider=provider,
            requester=requester,
            status='ACCEPTED',
            time_spent=2
        )
        
        # Create report
        report = Report.objects.create(
            reporter=reporter_user,
            target_type='exchange',
            target_id=exchange.id,
            reason='FRAUD'
        )
        
        # Resolve with remove_content
        response = api_client.post(f'/api/admin/reports/{report.id}/resolve', {
            'remove_content': True,
            'admin_notes': 'Fraudulent activity'
        })
        
        assert response.status_code == status.HTTP_200_OK
        
        # Exchange should be cancelled
        exchange.refresh_from_db()
        assert exchange.status == 'CANCELLED'
        
        # Credits should be refunded
        requester_tb.refresh_from_db()
        assert requester_tb.blocked_amount == 0
        
        # Offer should also be flagged (soft deleted)
        offer.refresh_from_db()
        assert offer.status == 'INACTIVE'
        assert offer.is_flagged is True
        assert offer.flagged_reason == 'Fraudulent activity'


@pytest.mark.django_db
class TestBanUserAction:
    """Tests for ban_user action in resolve report"""

    @patch('rest_api.views.send_notification')
    def test_ban_user_sets_is_banned_flag(self, mock_notify, api_client, admin_user, regular_user, reporter_user):
        """Ban user should set is_banned to True"""
        api_client.force_authenticate(user=admin_user)
        
        offer = OfferFactory(user=regular_user)
        report = Report.objects.create(
            reporter=reporter_user,
            reported_user=regular_user,
            target_type='offer',
            target_id=offer.id,
            reason='HARASSMENT'
        )
        
        response = api_client.post(f'/api/admin/reports/{report.id}/resolve', {
            'user_action': 'ban_user',
            'admin_notes': 'Harassment'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert 'user_banned' in response.data['actions_taken']
        
        regular_user.refresh_from_db()
        assert regular_user.is_banned is True
        
        report.refresh_from_db()
        assert report.status == 'RESOLVED'

    @patch('rest_api.views.send_notification')
    def test_ban_user_cancels_all_active_exchanges(self, mock_notify, api_client, admin_user, regular_user, reporter_user):
        """Ban user should cancel all their active exchanges"""
        api_client.force_authenticate(user=admin_user)
        
        # Create multiple exchanges
        other_user = UserFactory()
        TimeBank.objects.create(
            user=other_user, amount=10, blocked_amount=5, available_amount=5, total_amount=10
        )
        
        offer1 = OfferFactory(user=regular_user, type='offer')
        offer2 = OfferFactory(user=other_user, type='offer')
        
        exchange1 = Exchange.objects.create(
            offer=offer1, provider=regular_user, requester=other_user,
            status='PENDING', time_spent=2
        )
        exchange2 = Exchange.objects.create(
            offer=offer2, provider=other_user, requester=regular_user,
            status='ACCEPTED', time_spent=3
        )
        
        report = Report.objects.create(
            reporter=reporter_user,
            reported_user=regular_user,
            target_type='user',
            target_id=regular_user.id,
            reason='FRAUD'
        )
        
        response = api_client.post(f'/api/admin/reports/{report.id}/resolve', {
            'user_action': 'ban_user',
            'admin_notes': 'Fraud detected'
        })
        
        assert response.status_code == status.HTTP_200_OK
        
        # Both exchanges should be cancelled
        exchange1.refresh_from_db()
        exchange2.refresh_from_db()
        assert exchange1.status == 'CANCELLED'
        assert exchange2.status == 'CANCELLED'

    @patch('rest_api.views.send_notification')
    def test_ban_user_unblocks_credits_correctly(self, mock_notify, api_client, admin_user, regular_user, reporter_user):
        """Ban user should unblock credits for all cancelled exchanges"""
        api_client.force_authenticate(user=admin_user)
        
        # Create want exchange (provider has blocked credits)
        want = WantFactory(user=regular_user)
        helper = UserFactory()
        TimeBank.objects.create(
            user=helper, amount=10, blocked_amount=0, available_amount=10, total_amount=10
        )
        
        # Block credits for want owner
        user_tb = regular_user.timebank
        user_tb.blocked_amount = 2
        user_tb.available_amount = 8
        user_tb.save()
        
        exchange = Exchange.objects.create(
            offer=want, provider=regular_user, requester=helper,
            status='ACCEPTED', time_spent=2
        )
        
        report = Report.objects.create(
            reporter=reporter_user,
            reported_user=regular_user,
            target_type='user',
            target_id=regular_user.id,
            reason='FAKE_PROFILE'
        )
        
        response = api_client.post(f'/api/admin/reports/{report.id}/resolve', {
            'user_action': 'ban_user',
            'admin_notes': 'Fake profile'
        })
        
        assert response.status_code == status.HTTP_200_OK
        
        # Provider's credits should be unblocked (want type)
        user_tb.refresh_from_db()
        assert user_tb.blocked_amount == 0
        assert user_tb.available_amount == 10

    @patch('rest_api.views.send_notification')
    def test_ban_user_cancels_group_offer_with_multiple_slots(self, mock_notify, api_client, admin_user, regular_user, reporter_user):
        """Ban user should cancel all exchanges in a group offer with 3 filled slots"""
        api_client.force_authenticate(user=admin_user)
        
        # Create group offer with 3 slots
        group_offer = Offer.objects.create(
            user=regular_user,
            type='offer',
            title='Group Cooking Class',
            description='Learn to cook together',
            time_required=2,
            activity_type='group',
            person_count=3,
            status='ACTIVE'
        )
        
        # Create 3 requesters with blocked credits
        requester1 = UserFactory()
        requester2 = UserFactory()
        requester3 = UserFactory()
        
        tb1 = TimeBank.objects.create(
            user=requester1, amount=10, blocked_amount=2, available_amount=8, total_amount=10
        )
        tb2 = TimeBank.objects.create(
            user=requester2, amount=10, blocked_amount=2, available_amount=8, total_amount=10
        )
        tb3 = TimeBank.objects.create(
            user=requester3, amount=10, blocked_amount=2, available_amount=8, total_amount=10
        )
        
        # Create 3 exchanges (all slots filled)
        exchange1 = Exchange.objects.create(
            offer=group_offer,
            provider=regular_user,
            requester=requester1,
            status='ACCEPTED',
            time_spent=2
        )
        exchange2 = Exchange.objects.create(
            offer=group_offer,
            provider=regular_user,
            requester=requester2,
            status='ACCEPTED',
            time_spent=2
        )
        exchange3 = Exchange.objects.create(
            offer=group_offer,
            provider=regular_user,
            requester=requester3,
            status='PENDING',
            time_spent=2
        )
        
        # Create report against the provider
        report = Report.objects.create(
            reporter=reporter_user,
            reported_user=regular_user,
            target_type='user',
            target_id=regular_user.id,
            reason='FRAUD'
        )
        
        # Ban the provider
        response = api_client.post(f'/api/admin/reports/{report.id}/resolve', {
            'user_action': 'ban_user',
            'admin_notes': 'Fraud detected in group offer'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert 'user_banned' in response.data['actions_taken']
        
        # Provider should be banned
        regular_user.refresh_from_db()
        assert regular_user.is_banned is True
        
        # All 3 exchanges should be cancelled
        exchange1.refresh_from_db()
        exchange2.refresh_from_db()
        exchange3.refresh_from_db()
        assert exchange1.status == 'CANCELLED'
        assert exchange2.status == 'CANCELLED'
        assert exchange3.status == 'CANCELLED'
        
        # All 3 requesters should have their credits unblocked
        tb1.refresh_from_db()
        tb2.refresh_from_db()
        tb3.refresh_from_db()
        assert tb1.blocked_amount == 0
        assert tb1.available_amount == 10
        assert tb2.blocked_amount == 0
        assert tb2.available_amount == 10
        assert tb3.blocked_amount == 0
        assert tb3.available_amount == 10
        
        # Report should be resolved
        report.refresh_from_db()
        assert report.status == 'RESOLVED'

    @patch('rest_api.views.send_notification')
    def test_ban_user_as_requester_in_group_offer(self, mock_notify, api_client, admin_user, regular_user, reporter_user):
        """Ban a user who is requester in a group offer - only their exchange should be cancelled"""
        api_client.force_authenticate(user=admin_user)
        
        # Create group offer by another user
        provider = UserFactory()
        TimeBank.objects.create(
            user=provider, amount=10, blocked_amount=0, available_amount=10, total_amount=10
        )
        
        group_offer = Offer.objects.create(
            user=provider,
            type='offer',
            title='Group Yoga Class',
            description='Yoga for beginners',
            time_required=1,
            activity_type='group',
            person_count=3,
            status='ACTIVE'
        )
        
        # Create another requester
        other_requester = UserFactory()
        other_tb = TimeBank.objects.create(
            user=other_requester, amount=10, blocked_amount=1, available_amount=9, total_amount=10
        )
        
        # regular_user has blocked credits
        user_tb = regular_user.timebank
        user_tb.blocked_amount = 1
        user_tb.available_amount = 9
        user_tb.save()
        
        # Create exchanges - regular_user and other_requester both joined
        exchange1 = Exchange.objects.create(
            offer=group_offer,
            provider=provider,
            requester=regular_user,
            status='ACCEPTED',
            time_spent=1
        )
        exchange2 = Exchange.objects.create(
            offer=group_offer,
            provider=provider,
            requester=other_requester,
            status='ACCEPTED',
            time_spent=1
        )
        
        # Create report against regular_user (a requester)
        report = Report.objects.create(
            reporter=reporter_user,
            reported_user=regular_user,
            target_type='user',
            target_id=regular_user.id,
            reason='HARASSMENT'
        )
        
        # Ban the requester
        response = api_client.post(f'/api/admin/reports/{report.id}/resolve', {
            'user_action': 'ban_user',
            'admin_notes': 'Harassment in group activity'
        })
        
        assert response.status_code == status.HTTP_200_OK
        
        # regular_user's exchange should be cancelled
        exchange1.refresh_from_db()
        assert exchange1.status == 'CANCELLED'
        
        # regular_user's credits should be unblocked
        user_tb.refresh_from_db()
        assert user_tb.blocked_amount == 0
        assert user_tb.available_amount == 10
        
        # other_requester's exchange should remain ACCEPTED
        exchange2.refresh_from_db()
        assert exchange2.status == 'ACCEPTED'
        
        # other_requester's credits should remain blocked
        other_tb.refresh_from_db()
        assert other_tb.blocked_amount == 1


@pytest.mark.django_db
class TestWarnUserAction:
    """Tests for warn_user action in resolve report"""

    @patch('rest_api.views.send_notification')
    def test_warn_user_increments_warning_count(self, mock_notify, api_client, admin_user, regular_user, reporter_user):
        """Warn user should increment warning count"""
        api_client.force_authenticate(user=admin_user)
        
        initial_count = regular_user.warning_count or 0
        
        offer = OfferFactory(user=regular_user)
        report = Report.objects.create(
            reporter=reporter_user,
            reported_user=regular_user,
            target_type='offer',
            target_id=offer.id,
            reason='SPAM'
        )
        
        response = api_client.post(f'/api/admin/reports/{report.id}/resolve', {
            'user_action': 'warn_user',
            'admin_notes': 'First warning for spam'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert 'user_warned' in response.data['actions_taken']
        
        regular_user.refresh_from_db()
        assert regular_user.warning_count == initial_count + 1
        
        report.refresh_from_db()
        assert report.status == 'RESOLVED'

    @patch('rest_api.views.send_notification')
    def test_warn_user_sends_notification(self, mock_notify, api_client, admin_user, regular_user, reporter_user):
        """Warn user should send notification to the user"""
        api_client.force_authenticate(user=admin_user)
        
        offer = OfferFactory(user=regular_user)
        report = Report.objects.create(
            reporter=reporter_user,
            reported_user=regular_user,
            target_type='offer',
            target_id=offer.id,
            reason='OTHER'
        )
        
        response = api_client.post(f'/api/admin/reports/{report.id}/resolve', {
            'user_action': 'warn_user',
            'admin_notes': 'Please follow community guidelines'
        })
        
        assert response.status_code == status.HTTP_200_OK
        
        # Check notification was sent to warned user
        calls = [call for call in mock_notify.call_args_list if call[0][0] == regular_user]
        assert len(calls) > 0
        assert 'Warning' in str(calls[0])


@pytest.mark.django_db
class TestCombinedActions:
    """Tests for combined actions (Remove Content + Ban/Warn)"""

    @patch('rest_api.views.send_notification')
    def test_remove_content_and_ban_user(self, mock_notify, api_client, admin_user, regular_user, reporter_user):
        """Remove content and ban user should both execute"""
        api_client.force_authenticate(user=admin_user)
        
        offer = OfferFactory(user=regular_user, type='offer')
        report = Report.objects.create(
            reporter=reporter_user,
            reported_user=regular_user,
            target_type='offer',
            target_id=offer.id,
            reason='FRAUD'
        )
        
        response = api_client.post(f'/api/admin/reports/{report.id}/resolve', {
            'remove_content': True,
            'user_action': 'ban_user',
            'admin_notes': 'Serious fraud - content removed and user banned'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert 'content_removed' in response.data['actions_taken']
        assert 'user_banned' in response.data['actions_taken']
        
        # Offer should be soft deleted (INACTIVE + flagged)
        offer.refresh_from_db()
        assert offer.status == 'INACTIVE'
        assert offer.is_flagged is True
        
        # User should be banned
        regular_user.refresh_from_db()
        assert regular_user.is_banned is True

    @patch('rest_api.views.send_notification')
    def test_remove_content_and_warn_user(self, mock_notify, api_client, admin_user, regular_user, reporter_user):
        """Remove content and warn user should both execute"""
        api_client.force_authenticate(user=admin_user)
        
        initial_count = regular_user.warning_count or 0
        
        offer = OfferFactory(user=regular_user, type='want')
        report = Report.objects.create(
            reporter=reporter_user,
            reported_user=regular_user,
            target_type='want',
            target_id=offer.id,
            reason='INAPPROPRIATE'
        )
        
        response = api_client.post(f'/api/admin/reports/{report.id}/resolve', {
            'remove_content': True,
            'user_action': 'warn_user',
            'admin_notes': 'Inappropriate content - removed with warning'
        })
        
        assert response.status_code == status.HTTP_200_OK
        assert 'content_removed' in response.data['actions_taken']
        assert 'user_warned' in response.data['actions_taken']
        
        # Offer should be soft deleted (INACTIVE + flagged)
        offer.refresh_from_db()
        assert offer.status == 'INACTIVE'
        assert offer.is_flagged is True
        
        # User should be warned
        regular_user.refresh_from_db()
        assert regular_user.warning_count == initial_count + 1


@pytest.mark.django_db
class TestDismissAction:
    """Tests for dismiss action"""

    @patch('rest_api.views.send_notification')
    def test_dismiss_report(self, mock_notify, api_client, admin_user, regular_user, reporter_user):
        """Dismiss should mark report as dismissed"""
        api_client.force_authenticate(user=admin_user)
        
        offer = OfferFactory(user=regular_user)
        report = Report.objects.create(
            reporter=reporter_user,
            reported_user=regular_user,
            target_type='offer',
            target_id=offer.id,
            reason='OTHER'
        )
        
        response = api_client.post(f'/api/admin/reports/{report.id}/resolve', {
            'action': 'dismiss',  # Legacy format
            'admin_notes': 'No violation found'
        })
        
        assert response.status_code == status.HTTP_200_OK
        
        report.refresh_from_db()
        assert report.status == 'DISMISSED'
        
        # Offer should still exist
        assert Offer.objects.filter(id=offer.id).exists()
        
        # User should not be affected
        regular_user.refresh_from_db()
        assert regular_user.is_banned is False


@pytest.mark.django_db
class TestValidation:
    """Tests for validation and error handling"""

    def test_requires_admin(self, api_client, regular_user, reporter_user):
        """Non-admin users should not be able to resolve reports"""
        api_client.force_authenticate(user=regular_user)
        
        offer = OfferFactory(user=regular_user)
        report = Report.objects.create(
            reporter=reporter_user,
            target_type='offer',
            target_id=offer.id,
            reason='SPAM'
        )
        
        response = api_client.post(f'/api/admin/reports/{report.id}/resolve', {
            'remove_content': True
        })
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_requires_at_least_one_action(self, api_client, admin_user, regular_user, reporter_user):
        """At least one action must be specified (when not using legacy format)"""
        api_client.force_authenticate(user=admin_user)
        
        offer = OfferFactory(user=regular_user)
        report = Report.objects.create(
            reporter=reporter_user,
            target_type='offer',
            target_id=offer.id,
            reason='SPAM'
        )
        
        # Empty request should fail
        response = api_client.post(f'/api/admin/reports/{report.id}/resolve', {
            'admin_notes': 'No action'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_invalid_user_action(self, api_client, admin_user, regular_user, reporter_user):
        """Invalid user_action should return error"""
        api_client.force_authenticate(user=admin_user)
        
        offer = OfferFactory(user=regular_user)
        report = Report.objects.create(
            reporter=reporter_user,
            target_type='offer',
            target_id=offer.id,
            reason='SPAM'
        )
        
        response = api_client.post(f'/api/admin/reports/{report.id}/resolve', {
            'user_action': 'invalid_action'
        })
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_report_not_found(self, api_client, admin_user):
        """Non-existent report should return 404"""
        api_client.force_authenticate(user=admin_user)
        
        response = api_client.post('/api/admin/reports/99999/resolve', {
            'remove_content': True
        })
        
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestAdminBanUserViewWithReport:
    """Tests for AdminBanUserView with report_id parameter"""

    @patch('rest_api.views.send_notification')
    def test_ban_user_updates_report_status(self, mock_notify, api_client, admin_user, regular_user, reporter_user):
        """Ban user with report_id should update report status"""
        api_client.force_authenticate(user=admin_user)
        
        offer = OfferFactory(user=regular_user)
        report = Report.objects.create(
            reporter=reporter_user,
            reported_user=regular_user,
            target_type='offer',
            target_id=offer.id,
            reason='HARASSMENT',
            status='PENDING'
        )
        
        response = api_client.post(f'/api/admin/users/{regular_user.id}/ban', {
            'reason': 'Harassment',
            'report_id': report.id
        })
        
        assert response.status_code == status.HTTP_200_OK
        
        # User should be banned
        regular_user.refresh_from_db()
        assert regular_user.is_banned is True
        
        # Report should be resolved
        report.refresh_from_db()
        assert report.status == 'RESOLVED'


@pytest.mark.django_db
class TestAdminWarnUserViewWithReport:
    """Tests for AdminWarnUserView with report_id parameter"""

    @patch('rest_api.views.send_notification')
    def test_warn_user_updates_report_status(self, mock_notify, api_client, admin_user, regular_user, reporter_user):
        """Warn user with report_id should update report status"""
        api_client.force_authenticate(user=admin_user)
        
        offer = OfferFactory(user=regular_user)
        report = Report.objects.create(
            reporter=reporter_user,
            reported_user=regular_user,
            target_type='offer',
            target_id=offer.id,
            reason='SPAM',
            status='PENDING'
        )
        
        response = api_client.post(f'/api/admin/users/{regular_user.id}/warn', {
            'message': 'Please follow community guidelines',
            'report_id': report.id
        })
        
        assert response.status_code == status.HTTP_200_OK
        
        # User should have warning count incremented
        regular_user.refresh_from_db()
        assert regular_user.warning_count >= 1
        
        # Report should be resolved
        report.refresh_from_db()
        assert report.status == 'RESOLVED'

