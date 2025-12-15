import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from channels.layers import get_channel_layer
from asgiref.sync import sync_to_async
from rest_api.models import User, Exchange, Message, Chat, Notification


class AuthenticatedWebsocketConsumer(AsyncWebsocketConsumer):
    """Base consumer with JWT authentication from query params or cookies"""
    
    async def authenticate_user(self):
        """Authenticate user from query params or cookies"""
        try:
            access_token = None
            
            # Try to get token from query string first
            query_string = self.scope.get('query_string', b'').decode('utf-8')
            print(f"[WS Auth] Query string: {query_string[:100] if query_string else 'empty'}...")
            
            if query_string:
                from urllib.parse import parse_qs
                params = parse_qs(query_string)
                token_list = params.get('token', [])
                if token_list:
                    access_token = token_list[0]
                    print(f"[WS Auth] Found token in query params, length: {len(access_token)}")
            
            # Fallback to cookies
            if not access_token:
                cookies = self.scope.get('cookies', {})
                print(f"[WS Auth] Available cookies: {list(cookies.keys())}")
                access_token = cookies.get('access_token')
                if access_token:
                    print(f"[WS Auth] Found token in cookies, length: {len(access_token)}")
            
            if not access_token:
                print("[WS Auth] ERROR: No access token found in query params or cookies")
                return None
            
            # Authenticate using JWT
            user = await self.get_user_from_token(access_token)
            if user:
                print(f"[WS Auth] SUCCESS: Authenticated user: {user.email}")
            else:
                print("[WS Auth] ERROR: Token validation failed")
            return user
        except Exception as e:
            print(f"[WS Auth] ERROR: Authentication error: {e}")
            return None
    
    @database_sync_to_async
    def get_user_from_token(self, token):
        """Get user from JWT token"""
        try:
            from rest_framework_simplejwt.tokens import UntypedToken
            from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
            from django.conf import settings
            import jwt
            
            try:
                UntypedToken(token)
            except (InvalidToken, TokenError) as e:
                print(f"[WS Auth] Token validation error: {e}")
                return None
            
            decoded_data = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = decoded_data.get('user_id')
            
            if not user_id:
                print("[WS Auth] No user_id in token")
                return None
            
            try:
                user = User.objects.get(id=user_id)
                return user
            except User.DoesNotExist:
                print(f"[WS Auth] User not found: {user_id}")
                return None
        except Exception as e:
            print(f"[WS Auth] Token decode error: {e}")
            return None


class ChatConsumer(AuthenticatedWebsocketConsumer):
    async def connect(self):
        self.exchange_id = self.scope['url_route']['kwargs']['exchange_id']
        self.room_group_name = f'chat_{self.exchange_id}'
        
        print(f"[ChatConsumer] Connecting to chat for exchange {self.exchange_id}")
        
        # Authenticate user
        user = await self.authenticate_user()
        if not user:
            print(f"[ChatConsumer] Authentication failed, closing connection")
            await self.close()
            return
        
        self.user = user
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        print(f"[ChatConsumer] Connection accepted for {user.email}")
        
        # Send existing messages
        await self.send_existing_messages()
    
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Receive message from WebSocket"""
        try:
            data = json.loads(text_data)
            message_content = data.get('message', '').strip()
            
            if not message_content:
                return
            
            # Check if user is part of exchange
            exchange = await self.get_exchange()
            if not exchange or not await self.is_user_in_exchange(exchange):
                await self.send(text_data=json.dumps({
                    'error': 'You are not authorized to send messages in this exchange'
                }))
                return
            
            # Save message to database and create notification
            result = await self.save_message_and_notify(exchange, message_content)
            message = result['message']
            notification_data = result.get('notification_data')
            
            # Send notification via WebSocket if created
            if notification_data:
                await self.send_notification_websocket(notification_data)
            
            # Get user avatar
            user_avatar = await self.get_user_avatar(message.user)
            
            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': {
                        'id': str(message.id),
                        'user_id': str(message.user.id),
                        'user': {
                            'id': str(message.user.id),
                            'first_name': message.user.first_name,
                            'last_name': message.user.last_name,
                            'email': message.user.email,
                            'profile': {
                                'avatar': user_avatar,
                            }
                        },
                        'content': message.content,
                        'created_at': message.created_at.isoformat(),
                    }
                }
            )
        except Exception as e:
            print(f"Error receiving message: {e}")
            await self.send(text_data=json.dumps({
                'error': 'Failed to send message'
            }))
    
    async def chat_message(self, event):
        """Receive message from room group"""
        message = event['message']
        
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'message',
            'data': message
        }))
    
    @database_sync_to_async
    def get_exchange(self):
        """Get exchange from database"""
        try:
            return Exchange.objects.get(id=self.exchange_id)
        except Exchange.DoesNotExist:
            return None
    
    @database_sync_to_async
    def is_user_in_exchange(self, exchange):
        """Check if user is part of exchange"""
        return exchange.provider == self.user or exchange.requester == self.user
    
    @database_sync_to_async
    def save_message_and_notify(self, exchange, content):
        """Save message to database and create notification"""
        # Get or create chat for this exchange
        chat, created = Chat.objects.get_or_create(
            exchange=exchange,
            defaults={'user': self.user, 'content': ''}
        )
        
        # Create message
        message = Message.objects.create(
            chat=chat,
            user=self.user,
            content=content
        )
        
        # Determine the other user and create notification
        notification_data = None
        other_user = exchange.requester if exchange.provider == self.user else exchange.provider
        if other_user:
            # Get offer title safely
            offer_title = exchange.offer.title if exchange.offer else 'Exchange'
            notification_content = f"New message from {self.user.first_name} {self.user.last_name} in '{offer_title}': {content[:50]}{'...' if len(content) > 50 else ''}"
            
            notification = Notification.objects.create(
                user=other_user,
                content=notification_content
            )
            
            # Return data needed for WebSocket (primitive types only)
            notification_data = {
                'user_id': other_user.id,
                'id': notification.id,
                'content': notification.content,
                'created_at': notification.created_at.isoformat(),
            }
        
        return {
            'message': message,
            'notification_data': notification_data,
        }
    
    async def send_notification_websocket(self, notification_data):
        """Send notification via WebSocket"""
        try:
            room_group_name = f'notifications_{notification_data["user_id"]}'
            
            await self.channel_layer.group_send(
                room_group_name,
                {
                    'type': 'notification_message',
                    'notification': {
                        'id': notification_data['id'],
                        'content': notification_data['content'],
                        'created_at': notification_data['created_at'],
                    }
                }
            )
        except Exception as e:
            print(f"Error sending chat notification via WebSocket: {e}")
    
    async def send_existing_messages(self):
        """Send existing messages to client"""
        messages = await self.get_messages()
        
        await self.send(text_data=json.dumps({
            'type': 'messages',
            'data': messages
        }))
    
    @database_sync_to_async
    def get_user_avatar(self, user):
        """Get user avatar URL"""
        try:
            if hasattr(user, 'profile') and user.profile and user.profile.avatar:
                return user.profile.avatar.url
            return None
        except Exception:
            return None
    
    @database_sync_to_async
    def get_messages(self):
        """Get all messages for this exchange"""
        try:
            exchange = Exchange.objects.get(id=self.exchange_id)
            chat = Chat.objects.filter(exchange=exchange).first()
            
            if not chat:
                return []
            
            messages = Message.objects.filter(chat=chat).select_related('user', 'user__profile').order_by('created_at')
            
            result = []
            for msg in messages:
                avatar_url = None
                try:
                    if hasattr(msg.user, 'profile') and msg.user.profile and msg.user.profile.avatar:
                        avatar_url = msg.user.profile.avatar.url
                except Exception:
                    pass
                
                result.append({
                    'id': str(msg.id),
                    'user_id': str(msg.user.id),
                    'user': {
                        'id': str(msg.user.id),
                        'first_name': msg.user.first_name,
                        'last_name': msg.user.last_name,
                        'email': msg.user.email,
                        'profile': {
                            'avatar': avatar_url,
                        }
                    },
                    'content': msg.content,
                    'created_at': msg.created_at.isoformat(),
                })
            
            return result
        except Exception as e:
            print(f"Error getting messages: {e}")
            return []


class ExchangeConsumer(AuthenticatedWebsocketConsumer):
    """Consumer for exchange state updates"""
    
    async def connect(self):
        self.exchange_id = self.scope['url_route']['kwargs']['exchange_id']
        self.room_group_name = f'exchange_{self.exchange_id}'
        
        print(f"[ExchangeConsumer] Connecting to exchange {self.exchange_id}")
        
        # Authenticate user
        user = await self.authenticate_user()
        if not user:
            print(f"[ExchangeConsumer] Authentication failed, closing connection")
            await self.close()
            return
        
        self.user = user
        
        # Check if user is part of exchange
        exchange = await self.get_exchange()
        if not exchange or not await self.is_user_in_exchange(exchange):
            print(f"[ExchangeConsumer] User not in exchange, closing connection")
            await self.close()
            return
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        print(f"[ExchangeConsumer] Connection accepted for {user.email}")
        
        # Send current exchange state
        await self.send_exchange_state()
    
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Receive message from WebSocket"""
        # Exchange consumer is read-only, only sends updates
        pass
    
    async def exchange_update(self, event):
        """Receive exchange update from room group"""
        exchange_data = event['exchange']
        
        # Send update to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'exchange_update',
            'data': exchange_data
        }))
    
    async def send_exchange_state(self):
        """Send current exchange state to client"""
        exchange_data = await self.get_exchange_data()
        
        await self.send(text_data=json.dumps({
            'type': 'exchange_state',
            'data': exchange_data
        }))
    
    @database_sync_to_async
    def get_exchange(self):
        """Get exchange from database"""
        try:
            return Exchange.objects.select_related('provider', 'requester', 'offer').get(id=self.exchange_id)
        except Exchange.DoesNotExist:
            return None
    
    @database_sync_to_async
    def is_user_in_exchange(self, exchange):
        """Check if user is part of exchange"""
        return exchange.provider == self.user or exchange.requester == self.user
    
    @database_sync_to_async
    def get_exchange_data(self):
        """Get exchange data for sending"""
        try:
            exchange = Exchange.objects.select_related('provider', 'requester', 'offer').get(id=self.exchange_id)
            
            return {
                'id': str(exchange.id),
                'status': exchange.status,
                'proposed_at': exchange.proposed_at.isoformat() if exchange.proposed_at else None,
                'requester_confirmed': exchange.requester_confirmed,
                'provider_confirmed': exchange.provider_confirmed,
                'completed_at': exchange.completed_at.isoformat() if exchange.completed_at else None,
            }
        except Exception as e:
            print(f"Error getting exchange data: {e}")
            return None


class NotificationConsumer(AuthenticatedWebsocketConsumer):
    """Consumer for real-time notifications"""
    
    async def connect(self):
        # User-specific room group
        self.user_id = None
        user = await self.authenticate_user()
        if not user:
            await self.close()
            return
        
        self.user = user
        self.user_id = str(user.id)
        self.room_group_name = f'notifications_{self.user_id}'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        print(f"[NotificationConsumer] Connected for user {user.email}")
    
    async def disconnect(self, close_code):
        # Leave room group
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
    
    async def receive(self, text_data):
        """Receive message from WebSocket"""
        # Notification consumer is read-only, only sends updates
        pass
    
    async def notification_message(self, event):
        """Receive notification from room group"""
        notification = event['notification']
        
        # Send notification to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'data': notification
        }))
