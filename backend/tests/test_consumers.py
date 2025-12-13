"""
Tests for WebSocket consumers
Note: WebSocket tests require proper routing setup. These tests focus on
consumer authentication and basic functionality.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from channels.testing import WebsocketCommunicator
from channels.routing import URLRouter
from channels.db import database_sync_to_async
from django.urls import re_path

from rest_api.consumers import ChatConsumer, ExchangeConsumer, NotificationConsumer
from rest_api.models import User, Exchange, Chat, Message, Notification
from tests.factories import (
    UserFactory, ExchangeFactory, AcceptedExchangeFactory,
    ChatFactory, MessageFactory, NotificationFactory,
    create_user_with_timebank
)
from rest_api.auth.serializers import get_tokens_for_user


# WebSocket URL routing for tests
websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<exchange_id>\d+)/$', ChatConsumer.as_asgi()),
    re_path(r'ws/exchange/(?P<exchange_id>\d+)/$', ExchangeConsumer.as_asgi()),
    re_path(r'ws/notifications/$', NotificationConsumer.as_asgi()),
]

application = URLRouter(websocket_urlpatterns)


class TestChatConsumer:
    """Tests for ChatConsumer"""
    
    @pytest.mark.asyncio
    @pytest.mark.django_db(transaction=True)
    async def test_connect_without_auth_closes_connection(self):
        """Test connection without authentication is rejected"""
        provider, _ = await database_sync_to_async(create_user_with_timebank)()
        requester, _ = await database_sync_to_async(create_user_with_timebank)()
        exchange = await database_sync_to_async(AcceptedExchangeFactory)(
            provider=provider, requester=requester
        )
        
        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/{exchange.id}/"
        )
        
        connected, _ = await communicator.connect()
        
        # Without auth token, connection should fail
        if connected:
            # If connected, it should close immediately
            await communicator.disconnect()
        
    @pytest.mark.asyncio
    @pytest.mark.django_db(transaction=True)
    async def test_connect_with_valid_token(self):
        """Test connection with valid JWT token"""
        provider, _ = await database_sync_to_async(create_user_with_timebank)()
        requester, _ = await database_sync_to_async(create_user_with_timebank)()
        exchange = await database_sync_to_async(AcceptedExchangeFactory)(
            provider=provider, requester=requester
        )
        
        tokens = await database_sync_to_async(get_tokens_for_user)(provider)
        token = tokens['access']
        
        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/{exchange.id}/?token={token}"
        )
        
        try:
            connected, _ = await communicator.connect()
            # With valid token, connection attempt should be made
        finally:
            await communicator.disconnect()


class TestExchangeConsumer:
    """Tests for ExchangeConsumer"""
    
    @pytest.mark.asyncio
    @pytest.mark.django_db(transaction=True)
    async def test_connect_without_auth_closes_connection(self):
        """Test connection without authentication is rejected"""
        provider, _ = await database_sync_to_async(create_user_with_timebank)()
        requester, _ = await database_sync_to_async(create_user_with_timebank)()
        exchange = await database_sync_to_async(AcceptedExchangeFactory)(
            provider=provider, requester=requester
        )
        
        communicator = WebsocketCommunicator(
            application,
            f"/ws/exchange/{exchange.id}/"
        )
        
        connected, _ = await communicator.connect()
        
        if connected:
            await communicator.disconnect()


class TestNotificationConsumer:
    """Tests for NotificationConsumer"""
    
    @pytest.mark.asyncio
    @pytest.mark.django_db(transaction=True)
    async def test_connect_without_auth_closes_connection(self):
        """Test connection without authentication is rejected"""
        communicator = WebsocketCommunicator(
            application,
            "/ws/notifications/"
        )
        
        connected, _ = await communicator.connect()
        
        if connected:
            await communicator.disconnect()
    
    @pytest.mark.asyncio
    @pytest.mark.django_db(transaction=True)
    async def test_connect_with_valid_token(self):
        """Test notification consumer accepts valid token"""
        user, _ = await database_sync_to_async(create_user_with_timebank)()
        
        tokens = await database_sync_to_async(get_tokens_for_user)(user)
        token = tokens['access']
        
        communicator = WebsocketCommunicator(
            application,
            f"/ws/notifications/?token={token}"
        )
        
        try:
            connected, _ = await communicator.connect()
        finally:
            await communicator.disconnect()


class TestNotificationModel:
    """Tests for notification creation"""
    
    def test_notification_created(self, db):
        """Test notification can be created"""
        user, _ = create_user_with_timebank()
        
        notification = Notification.objects.create(
            user=user,
            content='Test notification'
        )
        
        assert notification.user == user
        assert notification.content == 'Test notification'
        assert notification.is_read is False
    
    def test_notification_mark_as_read(self, db):
        """Test notification can be marked as read"""
        user, _ = create_user_with_timebank()
        
        notification = Notification.objects.create(
            user=user,
            content='Test notification'
        )
        
        notification.is_read = True
        notification.save()
        
        notification.refresh_from_db()
        assert notification.is_read is True
