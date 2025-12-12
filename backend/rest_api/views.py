from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_api.models import User, Offer, UserProfile, TimeBank, OfferImage, Exchange, ExchangeRating, TimeBankTransaction, Comment, Report, Notification, Chat, Message
from datetime import datetime, date, time
from django.conf import settings
from django.db import transaction, models
from django.db.models import Q, Avg
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


def send_notification(user, content):
    """Create notification and send via WebSocket"""
    notification = Notification.objects.create(
        user=user,
        content=content
    )
    
    # Send via WebSocket
    try:
        channel_layer = get_channel_layer()
        room_group_name = f'notifications_{user.id}'
        
        async_to_sync(channel_layer.group_send)(
            room_group_name,
            {
                'type': 'notification_message',
                'notification': {
                    'id': notification.id,
                    'content': notification.content,
                    'is_read': notification.is_read,
                    'created_at': notification.created_at.isoformat(),
                }
            }
        )
    except Exception as e:
        print(f"Error sending notification via WebSocket: {e}")


class HomeView(APIView):
    def get(self, request):
        return Response({"message": "Home page"})


class UserView(APIView):
    def get(self, request):
        user = request.user
        return Response({
            "message": "User retrieved",
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "is_active": user.is_active,
                "created_at": user.created_at,
                "updated_at": user.updated_at,
            },
        })
class UserProfileView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    
    def get(self, request):
        user = request.user
        
        user_profile, _ = UserProfile.objects.get_or_create(
            user=user,
            defaults={
                'bio': '',
                'location': '',
                'skills': [],
                'rating': 0.0,
            }
        )

        timebank, _ = TimeBank.objects.get_or_create(
            user=user,
            defaults={
                'amount': 1,
                'blocked_amount': 0,
                'available_amount': 1,
                'total_amount': 1,
            }
        )
        
        return Response({
            "message": "User profile retrieved",
            "user_profile": {
                "id": user_profile.id,
                "bio": user_profile.bio,
                "location": user_profile.location,
                "skills": user_profile.skills,
                "rating": user_profile.rating,
                "phone_number": user_profile.phone_number,
                "badges": user_profile.badges,
                "achievements": user_profile.achievements,
                "time_credits": user_profile.time_credits,
                "avatar": request.build_absolute_uri(user_profile.avatar.url) if user_profile.avatar else None,
            },
            "timebank": {
                "id": timebank.id,
                "amount": timebank.amount,
                "blocked_amount": timebank.blocked_amount,
                "available_amount": timebank.available_amount,
                "total_amount": timebank.total_amount,
            },
        })
    
    def put(self, request):
        """Update user profile"""
        user = request.user
        
        user_profile, _ = UserProfile.objects.get_or_create(
            user=user,
            defaults={
                'bio': '',
                'location': '',
                'skills': [],
                'rating': 0.0,
            }
        )
        
        # Update User fields (first_name, last_name)
        if 'first_name' in request.data:
            user.first_name = request.data['first_name']
        if 'last_name' in request.data:
            user.last_name = request.data['last_name']
        user.save()
        
        # Update UserProfile fields
        if 'bio' in request.data:
            user_profile.bio = request.data['bio']
        if 'location' in request.data:
            user_profile.location = request.data['location']
        if 'skills' in request.data:
            skills = request.data.get('skills', [])
            if isinstance(skills, str):
                import json
                try:
                    skills = json.loads(skills)
                except:
                    skills = [s.strip() for s in skills.split(',') if s.strip()]
            user_profile.skills = skills
        if 'phone_number' in request.data:
            user_profile.phone_number = request.data['phone_number']
        
        # Handle avatar upload
        if 'avatar' in request.FILES:
            user_profile.avatar = request.FILES['avatar']
        
        user_profile.save()
        
        timebank, _ = TimeBank.objects.get_or_create(
            user=user,
            defaults={
                'amount': 1,
                'blocked_amount': 0,
                'available_amount': 1,
                'total_amount': 1,
            }
        )
        
        return Response({
            "message": "Profile updated successfully",
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
            },
            "user_profile": {
                "id": user_profile.id,
                "bio": user_profile.bio,
                "location": user_profile.location,
                "skills": user_profile.skills,
                "rating": user_profile.rating,
                "phone_number": user_profile.phone_number,
                "badges": user_profile.badges,
                "achievements": user_profile.achievements,
                "time_credits": user_profile.time_credits,
                "avatar": request.build_absolute_uri(user_profile.avatar.url) if user_profile.avatar else None,
            },
            "timebank": {
                "id": timebank.id,
                "amount": timebank.amount,
                "blocked_amount": timebank.blocked_amount,
                "available_amount": timebank.available_amount,
                "total_amount": timebank.total_amount,
            },
        })
class OffersView(APIView):
    def get(self, request):
        from datetime import date
        
        offers = Offer.objects.select_related('user', 'user__profile').prefetch_related('exchange_set').all()
        
        # Filter out offers that have accepted exchanges with future proposed_date
        available_offers = []
        today = date.today()
        
        for offer in offers:
            # Check if offer has accepted exchange with future proposed_date
            has_future_accepted_exchange = Exchange.objects.filter(
                offer=offer,
                status='ACCEPTED',
                proposed_date__gt=today
            ).exists()
            
            # Only include offers that don't have future accepted exchanges
            if not has_future_accepted_exchange:
                available_offers.append(offer)
        
        return Response([
            {
                "id": offer.id,
                "user_id": offer.user_id,
                "user": {
                    "id": offer.user.id,
                    "email": offer.user.email,
                    "first_name": offer.user.first_name,
                    "last_name": offer.user.last_name,
                    "profile": {
                        "time_credits": offer.user.profile.time_credits if hasattr(offer.user, 'profile') else 0,
                        "rating": offer.user.profile.rating if hasattr(offer.user, 'profile') else 0.0,
                        "avatar": request.build_absolute_uri(offer.user.profile.avatar.url) if hasattr(offer.user, 'profile') and offer.user.profile.avatar else None,
                    } if hasattr(offer.user, 'profile') else None
                },
                "type": offer.type,
                "title": offer.title,
                "description": offer.description,
                "time_required": offer.time_required,
                "location": offer.location,
                "geo_location": offer.geo_location,
                "status": offer.status,
                "activity_type": offer.activity_type,
                "offer_type": offer.offer_type,
                "person_count": offer.person_count,
                "location_type": offer.location_type,
                "tags": offer.tags,
                "images": [
                    {
                        "id": img.id,
                        "url": request.build_absolute_uri(img.image.url) if img.image else None,
                        "caption": img.caption,
                        "is_primary": img.is_primary,
                    }
                    for img in offer.offer_images.all()
                ],
                "date": offer.date,
                "time": offer.time,
                "from_date": offer.from_date,
                "to_date": offer.to_date,
                "created_at": offer.created_at,
                "updated_at": offer.updated_at,
            }
            for offer in available_offers
        ])


class OfferDetailView(APIView):
    """Get details of a single offer/want"""
    
    def get_permissions(self):
        """GET is public, PUT requires authentication"""
        if self.request.method == 'PUT':
            return [IsAuthenticated()]
        return []
    
    def get(self, request, offer_id):
        try:
            offer = Offer.objects.select_related('user', 'user__profile').prefetch_related('offer_images').get(id=offer_id)
        except Offer.DoesNotExist:
            return Response({"error": "Offer not found"}, status=404)
        
        # Check if offer can be edited (no active or completed exchanges)
        has_blocking_exchange = Exchange.objects.filter(
            offer=offer,
            status__in=['PENDING', 'ACCEPTED', 'COMPLETED']
        ).exists()
        can_edit = not has_blocking_exchange
        
        return Response({
            "id": offer.id,
            "user_id": offer.user_id,
            "user": {
                "id": offer.user.id,
                "email": offer.user.email,
                "first_name": offer.user.first_name,
                "last_name": offer.user.last_name,
                "profile": {
                    "time_credits": offer.user.profile.time_credits if hasattr(offer.user, 'profile') else 0,
                    "rating": offer.user.profile.rating if hasattr(offer.user, 'profile') else 0.0,
                    "avatar": request.build_absolute_uri(offer.user.profile.avatar.url) if hasattr(offer.user, 'profile') and offer.user.profile.avatar else None,
                } if hasattr(offer.user, 'profile') else None
            },
            "type": offer.type,
            "title": offer.title,
            "description": offer.description,
            "time_required": offer.time_required,
            "location": offer.location,
            "geo_location": offer.geo_location,
            "status": offer.status,
            "activity_type": offer.activity_type,
            "offer_type": offer.offer_type,
            "person_count": offer.person_count,
            "location_type": offer.location_type,
            "tags": offer.tags,
            "images": [
                {
                    "id": img.id,
                    "url": request.build_absolute_uri(img.image.url) if img.image else None,
                    "caption": img.caption,
                    "is_primary": img.is_primary,
                }
                for img in offer.offer_images.all()
            ],
            "date": offer.date,
            "time": str(offer.time) if offer.time else None,
            "from_date": offer.from_date,
            "to_date": offer.to_date,
            "created_at": offer.created_at,
            "updated_at": offer.updated_at,
            "can_edit": can_edit,
        })
    
    def put(self, request, offer_id):
        """Update an existing offer"""
        try:
            offer = Offer.objects.get(id=offer_id)
            
            # Only owner can update
            if offer.user != request.user:
                return Response({"error": "Not authorized to update this offer"}, status=403)
            
            # Check if offer has active or completed exchanges
            has_blocking_exchange = Exchange.objects.filter(
                offer=offer,
                status__in=['PENDING', 'ACCEPTED', 'COMPLETED']
            ).exists()
            
            if has_blocking_exchange:
                return Response({
                    "error": "Cannot edit this offer. There are active or completed exchanges associated with it."
                }, status=400)
            
            # Update fields
            if 'title' in request.data:
                offer.title = request.data['title']
            if 'description' in request.data:
                offer.description = request.data['description']
            if 'tags' in request.data:
                offer.tags = request.data['tags']
            if 'time_required' in request.data:
                offer.time_required = request.data['time_required']
            if 'activity_type' in request.data:
                offer.activity_type = request.data['activity_type']
            if 'person_count' in request.data:
                offer.person_count = request.data['person_count']
            if 'location_type' in request.data:
                offer.location_type = request.data['location_type']
            if 'status' in request.data:
                offer.status = request.data['status']
            
            # Handle location data
            location_data = request.data.get('location', {})
            if isinstance(location_data, dict):
                if 'address' in location_data:
                    offer.location = location_data.get('address', '')
                if 'latitude' in location_data and 'longitude' in location_data:
                    offer.geo_location = [location_data.get('latitude', 0), location_data.get('longitude', 0)]
            
            # Handle date/time
            if 'date' in request.data:
                date_str = request.data['date']
                if date_str:
                    try:
                        offer.date = date.fromisoformat(date_str)
                    except:
                        pass
                else:
                    offer.date = None
                    
            if 'time' in request.data:
                time_str = request.data['time']
                if time_str:
                    try:
                        offer.time = time.fromisoformat(time_str)
                    except:
                        pass
                else:
                    offer.time = None
            
            offer.save()
            
            return Response({
                "message": "Offer updated successfully",
                "offer_id": offer.id
            })
            
        except Offer.DoesNotExist:
            return Response({"error": "Offer not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class CreateOfferView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            from_date_str = request.data.get('from_date')
            to_date_str = request.data.get('to_date')
            date_str = request.data.get('date')
            time_str = request.data.get('time')
            
            from_date = None
            to_date = None
            date_obj = None
            time_obj = None
            
            if from_date_str:
                try:
                    from_date = datetime.fromisoformat(from_date_str.replace('Z', '+00:00'))
                except:
                    from_date = None
            
            if to_date_str:
                try:
                    to_date = datetime.fromisoformat(to_date_str.replace('Z', '+00:00'))
                except:
                    to_date = None
            
            if date_str:
                try:
                    date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00')).date()
                except:
                    date_obj = None
            
            if time_str:
                try:
                    time_obj = datetime.strptime(time_str, '%H:%M').time()
                except:
                    try:
                        time_obj = datetime.strptime(time_str, '%H:%M:%S').time()
                    except:
                        time_obj = None
            
            location_data = request.data.get('location', {})
            
            offer = Offer.objects.create(
                user=request.user,
                type=request.data.get('type', 'offer'),
                title=request.data.get('title', ''),
                description=request.data.get('description', ''),
                tags=request.data.get('tags', []),
                time_required=request.data.get('time_required', 1),
                location=location_data.get('address', '') if isinstance(location_data, dict) else str(location_data),
                geo_location=[location_data.get('latitude', 0), location_data.get('longitude', 0)] if isinstance(location_data, dict) else [],
                offer_type=request.data.get('offer_type', '1time'),
                activity_type=request.data.get('activity_type', '1to1'),
                person_count=int(request.data.get('person_count', 1)),
                location_type=request.data.get('location_type', 'myLocation'),
                status=request.data.get('status', 'ACTIVE'),
                date=date_obj,
                time=time_obj,
                from_date=from_date,
                to_date=to_date,
            )
            
            return Response({
                "message": "Offer created successfully", 
                "offer_id": str(offer.id)
            })
        except Exception as e:
            return Response({
                "message": "Failed to create offer",
                "error": str(e)
            }, status=400)


class UploadOfferImageView(APIView):
    """Upload images for an offer or want"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, offer_id):
        try:
            offer = Offer.objects.get(id=offer_id, user=request.user)
        except Offer.DoesNotExist:
            return Response({
                "message": "Offer not found or you don't have permission"
            }, status=404)

        images = request.FILES.getlist('images')
        if not images:
            return Response({
                "message": "No images provided"
            }, status=400)

        # Check max images (limit to 5)
        existing_count = offer.offer_images.count()
        if existing_count + len(images) > 5:
            return Response({
                "message": f"Maximum 5 images allowed. You have {existing_count}, trying to add {len(images)}"
            }, status=400)

        created_images = []
        for i, image in enumerate(images):
            # Validate file type
            if not image.content_type.startswith('image/'):
                continue
            
            # Validate file size (max 5MB)
            if image.size > 5 * 1024 * 1024:
                continue

            # First image is primary if no existing primary
            is_primary = (i == 0 and not offer.offer_images.filter(is_primary=True).exists())
            
            offer_image = OfferImage.objects.create(
                offer=offer,
                image=image,
                caption=request.data.get('caption', ''),
                is_primary=is_primary
            )
            created_images.append({
                "id": offer_image.id,
                "url": request.build_absolute_uri(offer_image.image.url),
                "caption": offer_image.caption,
                "is_primary": offer_image.is_primary,
            })

        return Response({
            "message": f"{len(created_images)} image(s) uploaded successfully",
            "images": created_images
        })


class DeleteOfferImageView(APIView):
    """Delete an image from an offer"""
    permission_classes = [IsAuthenticated]

    def delete(self, request, offer_id, image_id):
        try:
            offer = Offer.objects.get(id=offer_id, user=request.user)
            image = OfferImage.objects.get(id=image_id, offer=offer)
        except (Offer.DoesNotExist, OfferImage.DoesNotExist):
            return Response({
                "message": "Image not found or you don't have permission"
            }, status=404)

        was_primary = image.is_primary
        image.delete()

        # If deleted image was primary, set another as primary
        if was_primary:
            next_image = offer.offer_images.first()
            if next_image:
                next_image.is_primary = True
                next_image.save()

        return Response({"message": "Image deleted successfully"})


class SetPrimaryImageView(APIView):
    """Set an image as primary for an offer"""
    permission_classes = [IsAuthenticated]

    def post(self, request, offer_id, image_id):
        try:
            offer = Offer.objects.get(id=offer_id, user=request.user)
            image = OfferImage.objects.get(id=image_id, offer=offer)
        except (Offer.DoesNotExist, OfferImage.DoesNotExist):
            return Response({
                "message": "Image not found or you don't have permission"
            }, status=404)

        # Remove primary from other images
        offer.offer_images.update(is_primary=False)
        
        # Set this image as primary
        image.is_primary = True
        image.save()

        return Response({"message": "Primary image updated successfully"})


class CreateExchangeView(APIView):
    """Create an exchange request and freeze 1H time"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            offer_id = request.data.get('offer_id')
            if not offer_id:
                return Response({"error": "offer_id is required"}, status=400)

            offer = Offer.objects.select_related('user', 'user__timebank').get(id=offer_id)
            
            # Check if user is requesting their own offer
            if offer.user == request.user:
                return Response({"error": "Cannot request your own offer"}, status=400)

            # Check if exchange already exists
            existing = Exchange.objects.filter(
                offer=offer,
                requester=request.user,
                status__in=['PENDING', 'ACCEPTED']
            ).first()
            if existing:
                return Response({"error": "Exchange request already exists"}, status=400)

            # Freeze time from requester (based on offer time_required)
            time_to_block = offer.time_required
            requester_timebank, _ = TimeBank.objects.get_or_create(
                user=request.user,
                defaults={'amount': 1, 'blocked_amount': 0, 'available_amount': 1, 'total_amount': 1}
            )
            
            if not requester_timebank.block_credit(time_to_block):
                return Response({
                    "error": f"Insufficient time credits. You need at least {time_to_block}H available."
                }, status=400)

            # Create exchange
            exchange = Exchange.objects.create(
                offer=offer,
                provider=offer.user,
                requester=request.user,
                status='PENDING',
                time_spent=offer.time_required
            )

            # Send notification to provider (offer owner)
            send_notification(
                offer.user,
                f"You have received a new handshake request for '{offer.title}' from {request.user.first_name} {request.user.last_name}"
            )

            return Response({
                "message": "Exchange request created successfully",
                "exchange_id": exchange.id,
                "time_frozen": time_to_block
            }, status=201)

        except Offer.DoesNotExist:
            return Response({"error": "Offer not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class ExchangeDetailView(APIView):
    """Get exchange details"""
    permission_classes = [IsAuthenticated]

    def get(self, request, exchange_id):
        try:
            exchange = Exchange.objects.select_related(
                'offer', 'provider', 'requester',
                'offer__user', 'offer__user__profile'
            ).prefetch_related('ratings').get(id=exchange_id)

            # Check if user is part of this exchange
            if exchange.provider != request.user and exchange.requester != request.user:
                return Response({"error": "Not authorized"}, status=403)

            ratings_data = []
            for rating in exchange.ratings.all():
                ratings_data.append({
                    "rater_id": rating.rater.id,
                    "ratee_id": rating.ratee.id,
                    "communication": rating.communication,
                    "punctuality": rating.punctuality,
                    "would_recommend": rating.would_recommend,
                    "comment": rating.comment,
                    "created_at": rating.created_at,
                })

            return Response({
                "id": exchange.id,
                "offer": {
                    "id": exchange.offer.id,
                    "title": exchange.offer.title,
                    "description": exchange.offer.description,
                    "time_required": exchange.offer.time_required,
                    "type": exchange.offer.type,
                    "location": exchange.offer.location,
                    "geo_location": exchange.offer.geo_location,
                    "date": exchange.offer.date,
                    "time": str(exchange.offer.time) if exchange.offer.time else None,
                    "activity_type": exchange.offer.activity_type,
                    "person_count": exchange.offer.person_count,
                    "location_type": exchange.offer.location_type,
                    "tags": exchange.offer.tags,
                },
                "provider": {
                    "id": exchange.provider.id,
                    "email": exchange.provider.email,
                    "first_name": exchange.provider.first_name,
                    "last_name": exchange.provider.last_name,
                    "profile": {
                        "rating": exchange.provider.profile.rating if hasattr(exchange.provider, 'profile') else 0.0,
                        "time_credits": exchange.provider.profile.time_credits if hasattr(exchange.provider, 'profile') else 0,
                        "avatar": request.build_absolute_uri(exchange.provider.profile.avatar.url) if hasattr(exchange.provider, 'profile') and exchange.provider.profile.avatar else None,
                    } if hasattr(exchange.provider, 'profile') else None
                },
                "requester": {
                    "id": exchange.requester.id,
                    "email": exchange.requester.email,
                    "first_name": exchange.requester.first_name,
                    "last_name": exchange.requester.last_name,
                    "profile": {
                        "rating": exchange.requester.profile.rating if hasattr(exchange.requester, 'profile') else 0.0,
                        "time_credits": exchange.requester.profile.time_credits if hasattr(exchange.requester, 'profile') else 0,
                        "avatar": request.build_absolute_uri(exchange.requester.profile.avatar.url) if hasattr(exchange.requester, 'profile') and exchange.requester.profile.avatar else None,
                    } if hasattr(exchange.requester, 'profile') else None
                },
                "status": exchange.status,
                "time_spent": exchange.time_spent,
                "proposed_date": exchange.proposed_date,
                "proposed_time": str(exchange.proposed_time) if exchange.proposed_time else None,
                "requester_confirmed": exchange.requester_confirmed,
                "provider_confirmed": exchange.provider_confirmed,
                "created_at": exchange.created_at,
                "completed_at": exchange.completed_at,
                "ratings": ratings_data,
            })

        except Exchange.DoesNotExist:
            return Response({"error": "Exchange not found"}, status=404)


class MyExchangesView(APIView):
    """Get user's exchanges"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        exchanges = Exchange.objects.filter(
            Q(provider=request.user) | Q(requester=request.user)
        ).select_related('offer', 'provider', 'requester').order_by('-created_at')

        exchanges_data = []
        for exchange in exchanges:
            exchanges_data.append({
                "id": exchange.id,
                "offer": {
                    "id": exchange.offer.id,
                    "title": exchange.offer.title,
                    "type": exchange.offer.type,
                },
                "provider": {
                    "id": exchange.provider.id,
                    "first_name": exchange.provider.first_name,
                    "last_name": exchange.provider.last_name,
                },
                "requester": {
                    "id": exchange.requester.id,
                    "first_name": exchange.requester.first_name,
                    "last_name": exchange.requester.last_name,
                },
                "status": exchange.status,
                "proposed_date": exchange.proposed_date,
                "proposed_time": str(exchange.proposed_time) if exchange.proposed_time else None,
                "created_at": exchange.created_at,
            })

        return Response(exchanges_data)


class ExchangesByOfferView(APIView):
    """Get all exchanges for an offer"""
    permission_classes = [IsAuthenticated]

    def get(self, request, offer_id):
        try:
            offer = Offer.objects.get(id=offer_id)
            
            # Only offer owner can see all exchanges
            if offer.user != request.user:
                return Response({"error": "Not authorized"}, status=403)

            exchanges = Exchange.objects.filter(
                offer_id=offer_id
            ).select_related(
                'provider', 'requester'
            ).order_by('-created_at')

            exchanges_data = []
            for exchange in exchanges:
                exchanges_data.append({
                    "id": exchange.id,
                    "requester": {
                        "id": exchange.requester.id,
                        "first_name": exchange.requester.first_name,
                        "last_name": exchange.requester.last_name,
                        "profile": {
                            "avatar": request.build_absolute_uri(exchange.requester.profile.avatar.url) if hasattr(exchange.requester, 'profile') and exchange.requester.profile.avatar else None,
                            "rating": exchange.requester.profile.rating if hasattr(exchange.requester, 'profile') else 0.0,
                        } if hasattr(exchange.requester, 'profile') else None
                    },
                    "status": exchange.status,
                    "proposed_date": exchange.proposed_date,
                    "proposed_time": str(exchange.proposed_time) if exchange.proposed_time else None,
                    "created_at": exchange.created_at,
                })

            return Response(exchanges_data)

        except Offer.DoesNotExist:
            return Response({"error": "Offer not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class ExchangeByOfferView(APIView):
    """Get exchange by offer_id (for requester)"""
    permission_classes = [IsAuthenticated]

    def get(self, request, offer_id):
        try:
            exchange = Exchange.objects.filter(
                offer_id=offer_id
            ).filter(
                Q(provider=request.user) | Q(requester=request.user)
            ).select_related(
                'offer', 'provider', 'requester',
                'offer__user', 'offer__user__profile'
            ).prefetch_related('ratings').first()

            if not exchange:
                return Response({"error": "Exchange not found"}, status=404)

            ratings_data = []
            for rating in exchange.ratings.all():
                ratings_data.append({
                    "rater_id": rating.rater.id,
                    "ratee_id": rating.ratee.id,
                    "communication": rating.communication,
                    "punctuality": rating.punctuality,
                    "would_recommend": rating.would_recommend,
                    "comment": rating.comment,
                    "created_at": rating.created_at,
                })

            return Response({
                "id": exchange.id,
                "offer": {
                    "id": exchange.offer.id,
                    "title": exchange.offer.title,
                    "description": exchange.offer.description,
                    "time_required": exchange.offer.time_required,
                    "type": exchange.offer.type,
                    "location": exchange.offer.location,
                    "geo_location": exchange.offer.geo_location,
                    "date": exchange.offer.date,
                    "time": str(exchange.offer.time) if exchange.offer.time else None,
                    "activity_type": exchange.offer.activity_type,
                    "person_count": exchange.offer.person_count,
                    "location_type": exchange.offer.location_type,
                    "tags": exchange.offer.tags,
                },
                "provider": {
                    "id": exchange.provider.id,
                    "email": exchange.provider.email,
                    "first_name": exchange.provider.first_name,
                    "last_name": exchange.provider.last_name,
                    "profile": {
                        "rating": exchange.provider.profile.rating if hasattr(exchange.provider, 'profile') else 0.0,
                        "time_credits": exchange.provider.profile.time_credits if hasattr(exchange.provider, 'profile') else 0,
                        "avatar": request.build_absolute_uri(exchange.provider.profile.avatar.url) if hasattr(exchange.provider, 'profile') and exchange.provider.profile.avatar else None,
                    } if hasattr(exchange.provider, 'profile') else None
                },
                "requester": {
                    "id": exchange.requester.id,
                    "email": exchange.requester.email,
                    "first_name": exchange.requester.first_name,
                    "last_name": exchange.requester.last_name,
                    "profile": {
                        "rating": exchange.requester.profile.rating if hasattr(exchange.requester, 'profile') else 0.0,
                        "time_credits": exchange.requester.profile.time_credits if hasattr(exchange.requester, 'profile') else 0,
                        "avatar": request.build_absolute_uri(exchange.requester.profile.avatar.url) if hasattr(exchange.requester, 'profile') and exchange.requester.profile.avatar else None,
                    } if hasattr(exchange.requester, 'profile') else None
                },
                "status": exchange.status,
                "time_spent": exchange.time_spent,
                "proposed_date": exchange.proposed_date,
                "proposed_time": str(exchange.proposed_time) if exchange.proposed_time else None,
                "requester_confirmed": exchange.requester_confirmed,
                "provider_confirmed": exchange.provider_confirmed,
                "created_at": exchange.created_at,
                "completed_at": exchange.completed_at,
                "ratings": ratings_data,
            })

        except Exception as e:
            return Response({"error": str(e)}, status=400)


class ProposeDateTimeView(APIView):
    """Propose date and time for exchange"""
    permission_classes = [IsAuthenticated]

    def post(self, request, exchange_id):
        try:
            exchange = Exchange.objects.get(id=exchange_id)
            
            # Only requester can propose
            if exchange.requester != request.user:
                return Response({"error": "Only requester can propose date/time"}, status=403)

            if exchange.status != 'PENDING':
                return Response({"error": "Can only propose date/time for pending exchanges"}, status=400)

            date_str = request.data.get('date')
            time_str = request.data.get('time')

            if not date_str:
                return Response({"error": "date is required"}, status=400)

            try:
                proposed_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except:
                return Response({"error": "Invalid date format. Use YYYY-MM-DD"}, status=400)

            proposed_time = None
            if time_str:
                try:
                    proposed_time = datetime.strptime(time_str, '%H:%M').time()
                except:
                    try:
                        proposed_time = datetime.strptime(time_str, '%H:%M:%S').time()
                    except:
                        return Response({"error": "Invalid time format. Use HH:MM"}, status=400)

            exchange.proposed_date = proposed_date
            exchange.proposed_time = proposed_time
            exchange.save()
            
            # Send notification to provider
            send_notification(
                exchange.provider,
                f"{exchange.requester.first_name} {exchange.requester.last_name} proposed a date/time for '{exchange.offer.title}': {proposed_date} {proposed_time or ''}"
            )
            
            # Send websocket update
            self.send_exchange_update(exchange)

            return Response({
                "message": "Date and time proposed successfully",
                "proposed_date": exchange.proposed_date,
                "proposed_time": str(exchange.proposed_time) if exchange.proposed_time else None,
            })

        except Exchange.DoesNotExist:
            return Response({"error": "Exchange not found"}, status=404)
    
    def send_exchange_update(self, exchange):
        """Send exchange update via websocket"""
        try:
            channel_layer = get_channel_layer()
            room_group_name = f'exchange_{exchange.id}'
            
            exchange_data = {
                'id': str(exchange.id),
                'status': exchange.status,
                'proposed_date': exchange.proposed_date.isoformat() if exchange.proposed_date else None,
                'proposed_time': str(exchange.proposed_time) if exchange.proposed_time else None,
                'requester_confirmed': exchange.requester_confirmed,
                'provider_confirmed': exchange.provider_confirmed,
                'completed_at': exchange.completed_at.isoformat() if exchange.completed_at else None,
            }
            
            async_to_sync(channel_layer.group_send)(
                room_group_name,
                {
                    'type': 'exchange_update',
                    'exchange': exchange_data
                }
            )
        except Exception as e:
            print(f"Error sending websocket update: {e}")


class AcceptExchangeView(APIView):
    """Provider accepts the exchange"""
    permission_classes = [IsAuthenticated]

    def post(self, request, exchange_id):
        try:
            exchange = Exchange.objects.get(id=exchange_id)
            
            # Only provider can accept
            if exchange.provider != request.user:
                return Response({"error": "Only provider can accept exchange"}, status=403)

            if exchange.status != 'PENDING':
                return Response({"error": "Exchange is not in pending status"}, status=400)

            exchange.status = 'ACCEPTED'
            exchange.save()
            
            # Send notification to requester
            send_notification(
                exchange.requester,
                f"Your handshake request for '{exchange.offer.title}' has been accepted!"
            )
            
            # Send websocket update
            self.send_exchange_update(exchange)

            return Response({
                "message": "Exchange accepted successfully",
                "status": exchange.status,
            })

        except Exchange.DoesNotExist:
            return Response({"error": "Exchange not found"}, status=404)


class RejectExchangeView(APIView):
    """Provider rejects the exchange and unfreeze time"""
    permission_classes = [IsAuthenticated]

    def post(self, request, exchange_id):
        try:
            exchange = Exchange.objects.get(id=exchange_id)
            
            # Only provider can reject
            if exchange.provider != request.user:
                return Response({"error": "Only provider can reject exchange"}, status=403)

            if exchange.status != 'PENDING':
                return Response({"error": "Exchange is not in pending status"}, status=400)

            # Unfreeze requester's time
            requester_timebank = exchange.requester.timebank
            requester_timebank.unblock_credit(exchange.time_spent)

            exchange.status = 'CANCELLED'
            exchange.save()

            # Send notification to requester
            send_notification(
                exchange.requester,
                f"Your handshake request for '{exchange.offer.title}' has been rejected. Your time credits have been unfrozen."
            )

            return Response({
                "message": "Exchange rejected and time unfrozen",
                "status": exchange.status,
            })

        except Exchange.DoesNotExist:
            return Response({"error": "Exchange not found"}, status=404)


class CancelExchangeView(APIView):
    """Requester cancels their own exchange request"""
    permission_classes = [IsAuthenticated]

    def post(self, request, exchange_id):
        try:
            exchange = Exchange.objects.get(id=exchange_id)
            
            # Only requester can cancel their own request
            if exchange.requester != request.user:
                return Response({"error": "Only requester can cancel their own request"}, status=403)

            if exchange.status not in ['PENDING', 'ACCEPTED']:
                return Response({"error": "Exchange cannot be cancelled in current status"}, status=400)

            # Unfreeze requester's time
            try:
                requester_timebank = exchange.requester.timebank
                requester_timebank.unblock_credit(exchange.time_spent)
            except Exception:
                pass

            exchange.status = 'CANCELLED'
            exchange.save()

            # Send notification to provider
            send_notification(
                exchange.provider,
                f"Handshake request for '{exchange.offer.title}' has been cancelled by {exchange.requester.first_name}."
            )

            return Response({
                "message": "Exchange cancelled and time unfrozen",
                "status": exchange.status,
            })

        except Exchange.DoesNotExist:
            return Response({"error": "Exchange not found"}, status=404)


class ConfirmCompletionView(APIView):
    """Confirm completion of exchange"""
    permission_classes = [IsAuthenticated]

    def post(self, request, exchange_id):
        try:
            # Use select_for_update to prevent race conditions
            with transaction.atomic():
                exchange = Exchange.objects.select_for_update().get(id=exchange_id)
                
                # Check if user is part of exchange
                if exchange.provider != request.user and exchange.requester != request.user:
                    return Response({"error": "Not authorized"}, status=403)

                if exchange.status == 'COMPLETED':
                    return Response({"error": "Exchange is already completed"}, status=400)

                if exchange.status != 'ACCEPTED':
                    return Response({"error": "Exchange must be accepted first"}, status=400)

                # Mark confirmation
                if request.user == exchange.requester:
                    if exchange.requester_confirmed:
                        return Response({"error": "You have already confirmed"}, status=400)
                    exchange.requester_confirmed = True
                    # Notify provider that requester confirmed
                    send_notification(
                        exchange.provider,
                        f"{exchange.requester.first_name} {exchange.requester.last_name} confirmed completion of '{exchange.offer.title}'"
                    )
                elif request.user == exchange.provider:
                    if exchange.provider_confirmed:
                        return Response({"error": "You have already confirmed"}, status=400)
                    exchange.provider_confirmed = True
                    # Notify requester that provider confirmed
                    send_notification(
                        exchange.requester,
                        f"{exchange.provider.first_name} {exchange.provider.last_name} confirmed completion of '{exchange.offer.title}'"
                    )

                # If both confirmed, mark as completed and transfer time
                if exchange.requester_confirmed and exchange.provider_confirmed:
                    exchange.status = 'COMPLETED'
                    exchange.completed_at = datetime.now()
                    
                    # Unblock and transfer time immediately when completed
                    requester_timebank = TimeBank.objects.select_for_update().get(user=exchange.requester)
                    provider_timebank, _ = TimeBank.objects.select_for_update().get_or_create(
                        user=exchange.provider,
                        defaults={'amount': 0, 'blocked_amount': 0, 'available_amount': 0, 'total_amount': 0}
                    )
                    
                    # Unfreeze requester's time first
                    requester_timebank.unblock_credit(exchange.time_spent)
                    
                    # Transfer time - check available_amount after unblocking
                    if requester_timebank.available_amount >= exchange.time_spent:
                        requester_timebank.spend_credit(exchange.time_spent)
                        provider_timebank.add_credit(exchange.time_spent)
                        
                        # Create transaction record if it doesn't exist
                        if not TimeBankTransaction.objects.filter(exchange=exchange).exists():
                            TimeBankTransaction.objects.create(
                                from_user=exchange.requester,
                                to_user=exchange.provider,
                                exchange=exchange,
                                time_amount=exchange.time_spent,
                                transaction_type='SPEND',
                                description=f'Exchange completed: {exchange.offer.title}'
                            )
                        
                        # Send completion notifications
                        send_notification(
                            exchange.requester,
                            f"Exchange '{exchange.offer.title}' has been completed! {exchange.time_spent}H time credits have been transferred."
                        )
                        send_notification(
                            exchange.provider,
                            f"Exchange '{exchange.offer.title}' has been completed! You received {exchange.time_spent}H time credits."
                        )

                exchange.save()
            
            # Send websocket update (outside transaction)
            self.send_exchange_update(exchange)

            return Response({
                "message": "Completion confirmed",
                "requester_confirmed": exchange.requester_confirmed,
                "provider_confirmed": exchange.provider_confirmed,
                "status": exchange.status,
            })

        except Exchange.DoesNotExist:
            return Response({"error": "Exchange not found"}, status=404)
    
    def send_exchange_update(self, exchange):
        """Send exchange update via websocket"""
        try:
            channel_layer = get_channel_layer()
            room_group_name = f'exchange_{exchange.id}'
            
            exchange_data = {
                'id': str(exchange.id),
                'status': exchange.status,
                'proposed_date': exchange.proposed_date.isoformat() if exchange.proposed_date else None,
                'proposed_time': str(exchange.proposed_time) if exchange.proposed_time else None,
                'requester_confirmed': exchange.requester_confirmed,
                'provider_confirmed': exchange.provider_confirmed,
                'completed_at': exchange.completed_at.isoformat() if exchange.completed_at else None,
            }
            
            async_to_sync(channel_layer.group_send)(
                room_group_name,
                {
                    'type': 'exchange_update',
                    'exchange': exchange_data
                }
            )
        except Exception as e:
            print(f"Error sending websocket update: {e}")


class SubmitRatingView(APIView):
    """Submit rating for exchange"""
    permission_classes = [IsAuthenticated]

    def post(self, request, exchange_id):
        try:
            exchange = Exchange.objects.select_related('provider', 'requester').get(id=exchange_id)
            
            # Check if user is part of exchange
            if exchange.provider != request.user and exchange.requester != request.user:
                return Response({"error": "Not authorized"}, status=403)

            if exchange.status != 'COMPLETED':
                return Response({"error": "Exchange must be completed first"}, status=400)

            # Determine who is rating whom
            rater = request.user
            ratee = exchange.provider if rater == exchange.requester else exchange.requester

            # Check if already rated
            existing = ExchangeRating.objects.filter(
                exchange=exchange,
                rater=rater,
                ratee=ratee
            ).first()
            if existing:
                return Response({"error": "You have already rated this exchange"}, status=400)

            communication = request.data.get('communication')
            punctuality = request.data.get('punctuality')
            would_recommend = request.data.get('would_recommend')
            comment = request.data.get('comment', '')

            if not all([communication, punctuality, would_recommend is not None]):
                return Response({
                    "error": "communication, punctuality, and would_recommend are required"
                }, status=400)

            if not (1 <= communication <= 5) or not (1 <= punctuality <= 5):
                return Response({
                    "error": "communication and punctuality must be between 1 and 5"
                }, status=400)

            # Create rating
            rating = ExchangeRating.objects.create(
                exchange=exchange,
                rater=rater,
                ratee=ratee,
                communication=communication,
                punctuality=punctuality,
                would_recommend=bool(would_recommend),
                comment=comment
            )

            # Update ratee's average rating
            if hasattr(ratee, 'profile'):
                all_ratings = ExchangeRating.objects.filter(ratee=ratee)
                if all_ratings.exists():
                    avg_comm = all_ratings.aggregate(Avg('communication'))['communication__avg'] or 0
                    avg_punc = all_ratings.aggregate(Avg('punctuality'))['punctuality__avg'] or 0
                    ratee.profile.rating = (avg_comm + avg_punc) / 2
                    ratee.profile.save()

            # Note: Time transfer is handled when exchange is completed, not when rating is submitted
            # Rating is optional and can be submitted anytime after completion

            return Response({
                "message": "Rating submitted successfully",
                "rating": {
                    "id": rating.id,
                    "communication": rating.communication,
                    "punctuality": rating.punctuality,
                    "would_recommend": rating.would_recommend,
                    "comment": rating.comment,
                }
            })

        except Exchange.DoesNotExist:
            return Response({"error": "Exchange not found"}, status=404)


class TransactionsView(APIView):
    """Get user's transactions"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        transactions = TimeBankTransaction.objects.filter(
            Q(from_user=request.user) | Q(to_user=request.user)
        ).select_related(
            'from_user', 'to_user', 'exchange', 'exchange__offer'
        ).prefetch_related(
            'exchange__ratings'
        ).order_by('-created_at')

        # Group transactions by exchange to avoid duplicates
        seen_exchanges = set()
        transactions_data = []
        for tx in transactions:
            # Skip if we've already seen this exchange
            if tx.exchange and tx.exchange.id in seen_exchanges:
                continue
            if tx.exchange:
                seen_exchanges.add(tx.exchange.id)
            # Get related ratings/comments if exchange exists
            ratings_data = []
            comments_data = []
            if tx.exchange:
                ratings = tx.exchange.ratings.all()
                for rating in ratings:
                    ratings_data.append({
                        "rater_id": rating.rater.id,
                        "ratee_id": rating.ratee.id,
                        "communication": rating.communication,
                        "punctuality": rating.punctuality,
                        "would_recommend": rating.would_recommend,
                        "comment": rating.comment,
                        "created_at": rating.created_at,
                    })
                
                comments = Comment.objects.filter(exchange=tx.exchange)
                for comment in comments:
                    comments_data.append({
                        "id": comment.id,
                        "user": {
                            "id": comment.user.id,
                            "first_name": comment.user.first_name,
                            "last_name": comment.user.last_name,
                        },
                        "content": comment.content,
                        "rating": comment.rating,
                        "created_at": comment.created_at,
                    })

            # Determine transaction type from user's perspective
            # If user is the requester (from_user), it's a SPEND
            # If user is the provider (to_user), it's an EARN
            if tx.exchange:
                if tx.exchange.requester.id == request.user.id:
                    user_transaction_type = 'SPEND'
                elif tx.exchange.provider.id == request.user.id:
                    user_transaction_type = 'EARN'
                else:
                    user_transaction_type = tx.transaction_type
            else:
                user_transaction_type = tx.transaction_type

            # Get avatar URLs
            from_user_profile = None
            to_user_profile = None
            try:
                from_user_profile = tx.from_user.profile
            except:
                pass
            try:
                to_user_profile = tx.to_user.profile
            except:
                pass

            transactions_data.append({
                "id": tx.id,
                "from_user": {
                    "id": tx.from_user.id,
                    "first_name": tx.from_user.first_name,
                    "last_name": tx.from_user.last_name,
                    "email": tx.from_user.email,
                    "profile": {
                        "avatar": request.build_absolute_uri(from_user_profile.avatar.url) if from_user_profile and from_user_profile.avatar else None,
                    } if from_user_profile else None,
                },
                "to_user": {
                    "id": tx.to_user.id,
                    "first_name": tx.to_user.first_name,
                    "last_name": tx.to_user.last_name,
                    "email": tx.to_user.email,
                    "profile": {
                        "avatar": request.build_absolute_uri(to_user_profile.avatar.url) if to_user_profile and to_user_profile.avatar else None,
                    } if to_user_profile else None,
                },
                "exchange": {
                    "id": tx.exchange.id,
                    "offer": {
                        "id": tx.exchange.offer.id,
                        "title": tx.exchange.offer.title,
                    },
                } if tx.exchange else None,
                "time_amount": tx.time_amount,
                "transaction_type": user_transaction_type,
                "description": tx.description,
                "created_at": tx.created_at,
                "ratings": ratings_data,
                "comments": comments_data,
            })

        return Response(transactions_data)


class LatestTransactionsView(APIView):
    """Get latest N transactions for dashboard"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        limit = int(request.query_params.get('limit', 10))
        
        transactions = TimeBankTransaction.objects.filter(
            Q(from_user=request.user) | Q(to_user=request.user)
        ).select_related(
            'from_user', 'to_user', 'exchange', 'exchange__offer'
        ).order_by('-created_at')

        # Group transactions by exchange to avoid duplicates
        seen_exchanges = set()
        transactions_data = []
        for tx in transactions:
            # Skip if we've already seen this exchange
            if tx.exchange and tx.exchange.id in seen_exchanges:
                continue
            if tx.exchange:
                seen_exchanges.add(tx.exchange.id)
            
            # Stop if we've reached the limit
            if len(transactions_data) >= limit:
                break

            # Determine transaction type from user's perspective
            if tx.exchange:
                if tx.exchange.requester.id == request.user.id:
                    user_transaction_type = 'SPEND'
                elif tx.exchange.provider.id == request.user.id:
                    user_transaction_type = 'EARN'
                else:
                    user_transaction_type = tx.transaction_type
            else:
                user_transaction_type = tx.transaction_type

            # Get avatar URLs
            from_user_profile = None
            to_user_profile = None
            try:
                from_user_profile = tx.from_user.profile
            except:
                pass
            try:
                to_user_profile = tx.to_user.profile
            except:
                pass

            transactions_data.append({
                "id": tx.id,
                "from_user": {
                    "id": tx.from_user.id,
                    "first_name": tx.from_user.first_name,
                    "last_name": tx.from_user.last_name,
                    "profile": {
                        "avatar": request.build_absolute_uri(from_user_profile.avatar.url) if from_user_profile and from_user_profile.avatar else None,
                    } if from_user_profile else None,
                },
                "to_user": {
                    "id": tx.to_user.id,
                    "first_name": tx.to_user.first_name,
                    "last_name": tx.to_user.last_name,
                    "profile": {
                        "avatar": request.build_absolute_uri(to_user_profile.avatar.url) if to_user_profile and to_user_profile.avatar else None,
                    } if to_user_profile else None,
                },
                "exchange": {
                    "id": tx.exchange.id,
                    "offer": {
                        "id": tx.exchange.offer.id,
                        "title": tx.exchange.offer.title,
                    },
                } if tx.exchange else None,
                "time_amount": tx.time_amount,
                "transaction_type": user_transaction_type,
                "description": tx.description,
                "created_at": tx.created_at,
            })

        return Response(transactions_data)


class UserProfileDetailView(APIView):
    """Get another user's profile details"""
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        # Get user profile
        try:
            user_profile = target_user.profile
        except:
            user_profile = None

        # Get user's recent offers (all, not limited)
        recent_offers = Offer.objects.filter(
            user=target_user,
            type='offer'
        ).prefetch_related('exchange_set').order_by('-created_at')

        # Get user's recent wants (all, not limited)
        recent_wants = Offer.objects.filter(
            user=target_user,
            type='want'
        ).prefetch_related('exchange_set').order_by('-created_at')

        # Get user's recent transactions (last 5)
        recent_transactions = TimeBankTransaction.objects.filter(
            Q(from_user=target_user) | Q(to_user=target_user)
        ).select_related(
            'from_user', 'to_user', 'exchange', 'exchange__offer'
        ).order_by('-created_at')

        # Get comments about this user
        user_comments = Comment.objects.filter(
            target_type='user',
            target_id=str(target_user.id)
        ).select_related('user').order_by('-created_at')

        # Get average ratings for this user
        user_ratings = ExchangeRating.objects.filter(ratee=target_user)
        avg_communication = user_ratings.aggregate(Avg('communication'))['communication__avg'] or 0
        avg_punctuality = user_ratings.aggregate(Avg('punctuality'))['punctuality__avg'] or 0
        total_ratings_count = user_ratings.count()
        would_recommend_count = user_ratings.filter(would_recommend=True).count()
        would_recommend_percentage = (would_recommend_count / total_ratings_count * 100) if total_ratings_count > 0 else 0

        # Group transactions by exchange to avoid duplicates
        seen_exchanges = set()
        transactions_data = []
        for tx in recent_transactions:
            if tx.exchange and tx.exchange.id in seen_exchanges:
                continue
            if tx.exchange:
                seen_exchanges.add(tx.exchange.id)
            
            if len(transactions_data) >= 5:
                break

            # Determine transaction type from viewer's perspective
            if tx.exchange:
                if tx.exchange.requester.id == target_user.id:
                    user_transaction_type = 'SPEND'
                elif tx.exchange.provider.id == target_user.id:
                    user_transaction_type = 'EARN'
                else:
                    user_transaction_type = tx.transaction_type
            else:
                user_transaction_type = tx.transaction_type

            transactions_data.append({
                "id": tx.id,
                "from_user": {
                    "id": tx.from_user.id,
                    "first_name": tx.from_user.first_name,
                    "last_name": tx.from_user.last_name,
                },
                "to_user": {
                    "id": tx.to_user.id,
                    "first_name": tx.to_user.first_name,
                    "last_name": tx.to_user.last_name,
                },
                "exchange": {
                    "id": tx.exchange.id,
                    "offer": {
                        "id": tx.exchange.offer.id,
                        "title": tx.exchange.offer.title,
                    },
                } if tx.exchange else None,
                "time_amount": tx.time_amount,
                "transaction_type": user_transaction_type,
                "description": tx.description,
                "created_at": tx.created_at,
            })

        # Format offers with status
        from datetime import date
        today = date.today()
        
        offers_data = []
        for offer in recent_offers:
            # Determine offer status based on exchanges
            has_completed = Exchange.objects.filter(
                offer=offer,
                status='COMPLETED'
            ).exists()
            
            has_future_accepted = Exchange.objects.filter(
                offer=offer,
                status='ACCEPTED',
                proposed_date__gt=today
            ).exists()
            
            has_in_progress = Exchange.objects.filter(
                offer=offer,
                status='ACCEPTED',
                proposed_date__gte=today
            ).exists()
            
            if has_completed:
                offer_status = 'completed'
            elif has_in_progress or has_future_accepted:
                offer_status = 'in_progress'
            else:
                offer_status = 'active'
            
            offers_data.append({
                "id": offer.id,
                "title": offer.title,
                "description": offer.description,
                "time_required": offer.time_required,
                "location": offer.location,
                "created_at": offer.created_at,
                "type": offer.type,
                "status": offer_status,
            })

        # Format wants with status
        wants_data = []
        for want in recent_wants:
            # Determine want status based on exchanges
            has_completed = Exchange.objects.filter(
                offer=want,
                status='COMPLETED'
            ).exists()
            
            has_future_accepted = Exchange.objects.filter(
                offer=want,
                status='ACCEPTED',
                proposed_date__gt=today
            ).exists()
            
            has_in_progress = Exchange.objects.filter(
                offer=want,
                status='ACCEPTED',
                proposed_date__gte=today
            ).exists()
            
            if has_completed:
                want_status = 'completed'
            elif has_in_progress or has_future_accepted:
                want_status = 'in_progress'
            else:
                want_status = 'active'
            
            wants_data.append({
                "id": want.id,
                "title": want.title,
                "description": want.description,
                "time_required": want.time_required,
                "location": want.location,
                "created_at": want.created_at,
                "type": want.type,
                "status": want_status,
            })

        # Format comments
        comments_data = []
        for comment in user_comments:
            user_profile = None
            try:
                user_profile = comment.user.profile
            except:
                pass
            
            comments_data.append({
                "id": comment.id,
                "user": {
                    "id": comment.user.id,
                    "first_name": comment.user.first_name,
                    "last_name": comment.user.last_name,
                    "email": comment.user.email,
                    "profile": {
                        "avatar": request.build_absolute_uri(user_profile.avatar.url) if user_profile and user_profile.avatar else None,
                    } if user_profile else None,
                },
                "content": comment.content,
                "rating": comment.rating,
                "created_at": comment.created_at,
            })

        # Format average ratings
        ratings_summary = {
            "avg_communication": round(avg_communication, 1),
            "avg_punctuality": round(avg_punctuality, 1),
            "total_count": total_ratings_count,
            "would_recommend_percentage": round(would_recommend_percentage, 1),
        }

        return Response({
            "user": {
                "id": target_user.id,
                "email": target_user.email,
                "first_name": target_user.first_name,
                "last_name": target_user.last_name,
                "warning_count": target_user.warning_count or 0,
            },
            "profile": {
                "id": user_profile.id if user_profile else None,
                "bio": user_profile.bio if user_profile else "",
                "location": user_profile.location if user_profile else "",
                "skills": user_profile.skills if user_profile else [],
                "interests": user_profile.skills if user_profile else [],  # Using skills as interests
                "rating": user_profile.rating if user_profile else 0.0,
                "avatar": request.build_absolute_uri(user_profile.avatar.url) if user_profile and user_profile.avatar else None,
                "badges": user_profile.badges if user_profile else [],
                "achievements": user_profile.achievements if user_profile else [],
            } if user_profile else None,
            "recent_offers": offers_data,
            "recent_wants": wants_data,
            "recent_transactions": transactions_data,
            "comments": comments_data,
            "ratings_summary": ratings_summary,
        })


class CreateReportView(APIView):
    """Create a report (for users)"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            target_type = request.data.get('target_type')
            target_id = request.data.get('target_id')
            reason = request.data.get('reason')
            description = request.data.get('description', '')

            if not all([target_type, target_id, reason]):
                return Response({
                    "error": "target_type, target_id, and reason are required"
                }, status=400)

            # Validate target_type
            valid_target_types = ['offer', 'want', 'exchange', 'user']
            if target_type not in valid_target_types:
                return Response({
                    "error": f"target_type must be one of: {', '.join(valid_target_types)}"
                }, status=400)

            # Validate reason
            valid_reasons = ['SPAM', 'INAPPROPRIATE', 'FAKE_PROFILE', 'HARASSMENT', 'FRAUD', 'OTHER']
            if reason not in valid_reasons:
                return Response({
                    "error": f"reason must be one of: {', '.join(valid_reasons)}"
                }, status=400)

            # Check if target exists and determine reported user
            target_id_int = int(target_id)
            reported_user = None
            
            if target_type in ['offer', 'want']:
                try:
                    offer = Offer.objects.get(id=target_id_int)
                    # Prevent user from reporting their own offer/want
                    if offer.user == request.user:
                        return Response({
                            "error": "You cannot report your own offer/want"
                        }, status=400)
                    reported_user = offer.user
                except Offer.DoesNotExist:
                    return Response({"error": f"{target_type.capitalize()} not found"}, status=404)
            elif target_type == 'exchange':
                try:
                    exchange = Exchange.objects.get(id=target_id_int)
                    # User can report their own exchange (to report the other party)
                    # Determine which user is being reported
                    if exchange.provider == request.user:
                        reported_user = exchange.requester
                    elif exchange.requester == request.user:
                        reported_user = exchange.provider
                    else:
                        # If user is not part of exchange, they can't report it
                        return Response({
                            "error": "You can only report exchanges you are part of"
                        }, status=400)
                except Exchange.DoesNotExist:
                    return Response({"error": "Exchange not found"}, status=404)
            elif target_type == 'user':
                try:
                    target_user = User.objects.get(id=target_id_int)
                    # Prevent user from reporting themselves
                    if target_user == request.user:
                        return Response({
                            "error": "You cannot report yourself"
                        }, status=400)
                    reported_user = target_user
                except User.DoesNotExist:
                    return Response({"error": "User not found"}, status=404)

            # Check if user already reported this target
            existing_report = Report.objects.filter(
                reporter=request.user,
                target_type=target_type,
                target_id=target_id_int,
                status='PENDING'
            ).first()

            if existing_report:
                return Response({
                    "error": "You have already reported this item"
                }, status=400)

            # Create report
            report = Report.objects.create(
                reporter=request.user,
                reported_user=reported_user,
                target_type=target_type,
                target_id=target_id_int,
                reason=reason,
                description=description,
                status='PENDING'
            )

            return Response({
                "message": "Report submitted successfully",
                "report_id": report.id
            }, status=201)

        except ValueError:
            return Response({"error": "Invalid target_id"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class AdminReportsListView(APIView):
    """List all reports (admin only)"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_admin:
            return Response({"error": "Admin access required"}, status=403)

        reports = Report.objects.select_related('reporter', 'reported_user', 'resolved_by').all().order_by('-created_at')

        reports_data = []
        for report in reports:
            # Get target info
            target_info = None
            try:
                if report.target_type in ['offer', 'want']:
                    target = Offer.objects.get(id=report.target_id)
                    target_info = {
                        "id": target.id,
                        "title": target.title,
                        "type": target.type,
                    }
                elif report.target_type == 'exchange':
                    target = Exchange.objects.get(id=report.target_id)
                    target_info = {
                        "id": target.id,
                        "offer_title": target.offer.title if target.offer else None,
                    }
                elif report.target_type == 'user':
                    target = User.objects.get(id=report.target_id)
                    target_info = {
                        "id": target.id,
                        "email": target.email,
                        "first_name": target.first_name,
                        "last_name": target.last_name,
                    }
            except:
                target_info = {"id": report.target_id, "deleted": True}

            reports_data.append({
                "id": report.id,
                "reporter": {
                    "id": report.reporter.id,
                    "email": report.reporter.email,
                    "first_name": report.reporter.first_name,
                    "last_name": report.reporter.last_name,
                },
                "reported_user": {
                    "id": report.reported_user.id,
                    "email": report.reported_user.email,
                    "first_name": report.reported_user.first_name,
                    "last_name": report.reported_user.last_name,
                } if report.reported_user else None,
                "target_type": report.target_type,
                "target_id": report.target_id,
                "target_info": target_info,
                "reason": report.reason,
                "description": report.description,
                "status": report.status,
                "admin_notes": report.admin_notes,
                "resolved_by": {
                    "id": report.resolved_by.id,
                    "email": report.resolved_by.email,
                } if report.resolved_by else None,
                "created_at": report.created_at,
                "updated_at": report.updated_at,
            })

        return Response(reports_data)


class AdminReportUpdateView(APIView):
    """Update report status (admin only)"""
    permission_classes = [IsAuthenticated]

    def patch(self, request, report_id):
        if not request.user.is_admin:
            return Response({"error": "Admin access required"}, status=403)

        try:
            report = Report.objects.get(id=report_id)
        except Report.DoesNotExist:
            return Response({"error": "Report not found"}, status=404)

        status = request.data.get('status')
        admin_notes = request.data.get('admin_notes', '')

        if status:
            valid_statuses = ['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED']
            if status not in valid_statuses:
                return Response({
                    "error": f"status must be one of: {', '.join(valid_statuses)}"
                }, status=400)
            report.status = status

        if admin_notes:
            report.admin_notes = admin_notes

        if status in ['RESOLVED', 'DISMISSED']:
            report.resolved_by = request.user

        report.save()

        return Response({
            "message": "Report updated successfully",
            "report": {
                "id": report.id,
                "status": report.status,
                "admin_notes": report.admin_notes,
            }
        })


class AdminReportResolveView(APIView):
    """Resolve report and take action (admin only)"""
    permission_classes = [IsAuthenticated]

    def post(self, request, report_id):
        if not request.user.is_admin:
            return Response({"error": "Admin access required"}, status=403)

        try:
            report = Report.objects.get(id=report_id)
        except Report.DoesNotExist:
            return Response({"error": "Report not found"}, status=404)

        action = request.data.get('action')  # 'remove_content', 'ban_user', 'warn_user', 'dismiss'
        admin_notes = request.data.get('admin_notes', '')

        if not action:
            return Response({"error": "action is required"}, status=400)

        try:
            if action == 'remove_content':
                # Remove the reported content
                if report.target_type in ['offer', 'want']:
                    try:
                        offer = Offer.objects.get(id=report.target_id)
                        offer.status = 'CANCELLED'
                        offer.save()
                        # Notify content owner
                        send_notification(
                            offer.user,
                            f"Your {report.target_type} '{offer.title}' has been removed due to a report. Reason: {admin_notes or 'Violation of community guidelines'}"
                        )
                    except Offer.DoesNotExist:
                        pass
                elif report.target_type == 'exchange':
                    try:
                        exchange = Exchange.objects.get(id=report.target_id)
                        # Return frozen time to requester before cancelling
                        if exchange.status in ['PENDING', 'ACCEPTED'] and exchange.requester:
                            try:
                                requester_timebank = exchange.requester.timebank
                                requester_timebank.unblock_credit(exchange.time_spent)
                            except Exception:
                                pass
                        exchange.status = 'CANCELLED'
                        exchange.save()
                        # Notify both participants
                        if exchange.provider:
                            send_notification(
                                exchange.provider,
                                f"Exchange #{exchange.id} has been cancelled due to a report. Reason: {admin_notes or 'Violation of community guidelines'}"
                            )
                        if exchange.requester:
                            send_notification(
                                exchange.requester,
                                f"Exchange #{exchange.id} has been cancelled due to a report. Your frozen time credits have been returned. Reason: {admin_notes or 'Violation of community guidelines'}"
                            )
                    except Exchange.DoesNotExist:
                        pass

                # Send notification to reporter
                send_notification(
                    report.reporter,
                    f"Action has been taken on your report #{report.id}. The reported content has been removed."
                )

                report.status = 'RESOLVED'
                report.resolved_by = request.user
                report.admin_notes = admin_notes or "Content removed"
                report.save()

            elif action == 'ban_user':
                # Ban the reported user
                banned_user = None
                if report.reported_user:
                    report.reported_user.is_banned = True
                    report.reported_user.save()
                    banned_user = report.reported_user
                elif report.target_type == 'user':
                    try:
                        target_user = User.objects.get(id=report.target_id)
                        target_user.is_banned = True
                        target_user.save()
                        banned_user = target_user
                    except User.DoesNotExist:
                        pass
                else:
                    # Get user from target (fallback)
                    if report.target_type in ['offer', 'want']:
                        try:
                            offer = Offer.objects.get(id=report.target_id)
                            offer.user.is_banned = True
                            offer.user.save()
                            banned_user = offer.user
                        except Offer.DoesNotExist:
                            pass

                # Send notification to banned user
                if banned_user:
                    send_notification(
                        banned_user,
                        f"Your account has been banned. Reason: {admin_notes or 'Violation of community guidelines'}"
                    )

                # Send notification to reporter
                send_notification(
                    report.reporter,
                    f"Action has been taken on your report #{report.id}. The reported user has been banned."
                )

                report.status = 'RESOLVED'
                report.resolved_by = request.user
                report.admin_notes = admin_notes or "User banned"
                report.save()

            elif action == 'warn_user':
                # Send warning to reported user
                warned_user = None
                if report.reported_user:
                    warned_user = report.reported_user
                    # Increment warning count
                    if not hasattr(warned_user, 'warning_count'):
                        warned_user.warning_count = 0
                    warned_user.warning_count = (warned_user.warning_count or 0) + 1
                    warned_user.save()
                    
                    send_notification(
                        warned_user,
                        f"Admin Warning: {admin_notes or 'You have been warned due to a report.'}"
                    )
                report.status = 'RESOLVED'
                report.resolved_by = request.user
                report.admin_notes = admin_notes or "User warned"
                report.save()

                # Send notification to reporter
                send_notification(
                    report.reporter,
                    f"Action has been taken on your report #{report.id}. The reported user has been warned."
                )

            elif action == 'dismiss':
                # Dismiss the report
                report.status = 'DISMISSED'
                report.resolved_by = request.user
                report.admin_notes = admin_notes or "Report dismissed"
                report.save()

                # Send notification to reporter
                send_notification(
                    report.reporter,
                    f"Your report #{report.id} has been reviewed and dismissed. {admin_notes or 'Thank you for your report.'}"
                )

            else:
                return Response({"error": "Invalid action"}, status=400)

            return Response({
                "message": f"Report {action} completed successfully",
                "report_id": report.id,
                "status": report.status,
            })

        except Exception as e:
            return Response({"error": str(e)}, status=400)


class AdminKPIView(APIView):
    """Get KPI data for admin dashboard"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_admin:
            return Response({"error": "Admin access required"}, status=403)

        from django.db.models import Count, Sum

        # Total users
        total_users = User.objects.filter(is_deleted=False).count()

        # Active offers
        active_offers = Offer.objects.filter(
            status='ACTIVE',
            type='offer'
        ).count()

        # Active wants
        active_wants = Offer.objects.filter(
            status='ACTIVE',
            type='want'
        ).count()

        # Completed exchanges
        completed_exchanges = Exchange.objects.filter(
            status='COMPLETED'
        ).count()

        # Pending reports
        pending_reports = Report.objects.filter(
            status='PENDING'
        ).count()

        # Total time credits (sum of all transactions)
        total_time_credits = TimeBankTransaction.objects.aggregate(
            total=Sum('time_amount')
        )['total'] or 0

        # Recent reports (last 10)
        recent_reports = Report.objects.select_related(
            'reporter', 'reported_user'
        ).order_by('-created_at')[:10]

        recent_reports_data = []
        for report in recent_reports:
            recent_reports_data.append({
                "id": report.id,
                "reporter": {
                    "id": report.reporter.id,
                    "email": report.reporter.email,
                    "first_name": report.reporter.first_name,
                    "last_name": report.reporter.last_name,
                },
                "reported_user": {
                    "id": report.reported_user.id,
                    "email": report.reported_user.email,
                    "first_name": report.reported_user.first_name,
                    "last_name": report.reported_user.last_name,
                } if report.reported_user else None,
                "target_type": report.target_type,
                "target_id": report.target_id,
                "reason": report.reason,
                "status": report.status,
                "created_at": report.created_at,
            })

        return Response({
            "total_users": total_users,
            "active_offers": active_offers,
            "active_wants": active_wants,
            "completed_exchanges": completed_exchanges,
            "pending_reports": pending_reports,
            "total_time_credits": total_time_credits,
            "recent_reports": recent_reports_data,
        })


class AdminBanUserView(APIView):
    """Ban a user (admin only)"""
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        if not request.user.is_admin:
            return Response({"error": "Admin access required"}, status=403)

        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        reason = request.data.get('reason', '')
        duration_days = request.data.get('duration_days', None)  # None = permanent

        target_user.is_banned = True
        target_user.save()

        return Response({
            "message": f"User {target_user.email} has been banned",
            "user": {
                "id": target_user.id,
                "email": target_user.email,
                "is_banned": target_user.is_banned,
            },
            "reason": reason,
            "duration_days": duration_days,
        })


class AdminWarnUserView(APIView):
    """Send warning to a user (admin only)"""
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        if not request.user.is_admin:
            return Response({"error": "Admin access required"}, status=403)

        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        message = request.data.get('message', '')
        if not message:
            return Response({"error": "message is required"}, status=400)

        # Increment warning count
        target_user.warning_count = (target_user.warning_count or 0) + 1
        target_user.save()

        # Create a notification for the user
        send_notification(
            target_user,
            f"Admin Warning: {message}"
        )

        return Response({
            "message": f"Warning sent to {target_user.email}",
            "user": {
                "id": target_user.id,
                "email": target_user.email,
                "warning_count": target_user.warning_count,
            },
        })


class AdminDeleteOfferView(APIView):
    """Delete/remove an offer or want (admin only)"""
    permission_classes = [IsAuthenticated]

    def delete(self, request, offer_id):
        if not request.user.is_admin:
            return Response({"error": "Admin access required"}, status=403)

        try:
            offer = Offer.objects.get(id=offer_id)
        except Offer.DoesNotExist:
            return Response({"error": "Offer not found"}, status=404)

        # Cancel the offer instead of deleting (to preserve data)
        offer.status = 'CANCELLED'
        offer.save()

        return Response({
            "message": f"{offer.type.capitalize()} has been removed",
            "offer": {
                "id": offer.id,
                "title": offer.title,
                "status": offer.status,
            },
        })


class AdminExchangeDetailView(APIView):
    """Get exchange details with messages for admin"""
    permission_classes = [IsAuthenticated]

    def get(self, request, exchange_id):
        if not request.user.is_admin:
            return Response({"error": "Admin access required"}, status=403)

        try:
            exchange = Exchange.objects.select_related(
                'offer', 'provider', 'requester',
                'offer__user', 'offer__user__profile'
            ).prefetch_related('ratings').get(id=exchange_id)

            # Get messages
            try:
                chat = Chat.objects.filter(exchange=exchange).first()
                messages = []
                if chat:
                    messages_queryset = Message.objects.filter(chat=chat).select_related('user', 'user__profile').order_by('created_at')
                    for msg in messages_queryset:
                        avatar_url = None
                        try:
                            if hasattr(msg.user, 'profile') and msg.user.profile and msg.user.profile.avatar:
                                avatar_url = request.build_absolute_uri(msg.user.profile.avatar.url)
                        except Exception:
                            pass
                        
                        messages.append({
                            'id': msg.id,
                            'user_id': msg.user.id,
                            'user': {
                                'id': msg.user.id,
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
            except Exception as e:
                messages = []

            ratings_data = []
            for rating in exchange.ratings.all():
                ratings_data.append({
                    "rater_id": rating.rater.id,
                    "ratee_id": rating.ratee.id,
                    "communication": rating.communication,
                    "punctuality": rating.punctuality,
                    "would_recommend": rating.would_recommend,
                    "comment": rating.comment,
                    "created_at": rating.created_at,
                })

            return Response({
                "id": exchange.id,
                "offer": {
                    "id": exchange.offer.id if exchange.offer else None,
                    "title": exchange.offer.title if exchange.offer else None,
                    "description": exchange.offer.description if exchange.offer else None,
                    "time_required": exchange.offer.time_required if exchange.offer else None,
                    "type": exchange.offer.type if exchange.offer else None,
                    "location": exchange.offer.location if exchange.offer else None,
                    "geo_location": exchange.offer.geo_location if exchange.offer else None,
                    "date": exchange.offer.date if exchange.offer else None,
                    "time": str(exchange.offer.time) if exchange.offer and exchange.offer.time else None,
                    "activity_type": exchange.offer.activity_type if exchange.offer else None,
                    "person_count": exchange.offer.person_count if exchange.offer else None,
                    "location_type": exchange.offer.location_type if exchange.offer else None,
                    "tags": exchange.offer.tags if exchange.offer else None,
                    "user": {
                        "id": exchange.offer.user.id if exchange.offer else None,
                        "email": exchange.offer.user.email if exchange.offer else None,
                        "first_name": exchange.offer.user.first_name if exchange.offer else None,
                        "last_name": exchange.offer.user.last_name if exchange.offer else None,
                    } if exchange.offer else None,
                },
                "provider": {
                    "id": exchange.provider.id if exchange.provider else None,
                    "email": exchange.provider.email if exchange.provider else None,
                    "first_name": exchange.provider.first_name if exchange.provider else None,
                    "last_name": exchange.provider.last_name if exchange.provider else None,
                    "profile": {
                        "rating": exchange.provider.profile.rating if exchange.provider and hasattr(exchange.provider, 'profile') else 0.0,
                        "time_credits": exchange.provider.profile.time_credits if exchange.provider and hasattr(exchange.provider, 'profile') else 0,
                        "avatar": request.build_absolute_uri(exchange.provider.profile.avatar.url) if exchange.provider and hasattr(exchange.provider, 'profile') and exchange.provider.profile.avatar else None,
                    } if exchange.provider and hasattr(exchange.provider, 'profile') else None
                } if exchange.provider else None,
                "requester": {
                    "id": exchange.requester.id if exchange.requester else None,
                    "email": exchange.requester.email if exchange.requester else None,
                    "first_name": exchange.requester.first_name if exchange.requester else None,
                    "last_name": exchange.requester.last_name if exchange.requester else None,
                    "profile": {
                        "rating": exchange.requester.profile.rating if exchange.requester and hasattr(exchange.requester, 'profile') else 0.0,
                        "time_credits": exchange.requester.profile.time_credits if exchange.requester and hasattr(exchange.requester, 'profile') else 0,
                        "avatar": request.build_absolute_uri(exchange.requester.profile.avatar.url) if exchange.requester and hasattr(exchange.requester, 'profile') and exchange.requester.profile.avatar else None,
                    } if exchange.requester and hasattr(exchange.requester, 'profile') else None
                } if exchange.requester else None,
                "status": exchange.status,
                "time_spent": exchange.time_spent,
                "proposed_date": exchange.proposed_date.isoformat() if exchange.proposed_date else None,
                "proposed_time": str(exchange.proposed_time) if exchange.proposed_time else None,
                "requester_confirmed": exchange.requester_confirmed,
                "provider_confirmed": exchange.provider_confirmed,
                "created_at": exchange.created_at.isoformat(),
                "completed_at": exchange.completed_at.isoformat() if exchange.completed_at else None,
                "ratings": ratings_data,
                "messages": messages,
            })

        except Exchange.DoesNotExist:
            return Response({"error": "Exchange not found"}, status=404)


class NotificationsView(APIView):
    """Get user's notifications"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Filter by read status if query param provided
        is_read = request.query_params.get('is_read')
        
        notifications = Notification.objects.filter(user=request.user)
        
        if is_read is not None:
            notifications = notifications.filter(is_read=is_read.lower() == 'true')
        
        notifications = notifications.order_by('-created_at')
        
        notifications_data = []
        for notification in notifications:
            notifications_data.append({
                "id": notification.id,
                "content": notification.content,
                "is_read": notification.is_read,
                "created_at": notification.created_at.isoformat(),
            })
        
        return Response(notifications_data)


class MarkNotificationReadView(APIView):
    """Mark notification as read or delete it"""
    permission_classes = [IsAuthenticated]

    def patch(self, request, notification_id):
        """Mark notification as read/unread"""
        try:
            notification = Notification.objects.get(id=notification_id, user=request.user)
            # Toggle or set is_read based on request data
            is_read = request.data.get('is_read', True)
            notification.is_read = is_read
            notification.save()
            return Response({
                "id": notification.id,
                "content": notification.content,
                "is_read": notification.is_read,
                "created_at": notification.created_at.isoformat(),
            })
        except Notification.DoesNotExist:
            return Response({"error": "Notification not found"}, status=404)

    def delete(self, request, notification_id):
        try:
            notification = Notification.objects.get(id=notification_id, user=request.user)
            notification.delete()
            return Response({"message": "Notification deleted"})
        except Notification.DoesNotExist:
            return Response({"error": "Notification not found"}, status=404)


class MarkAllNotificationsReadView(APIView):
    """Mark all notifications as read"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"message": "All notifications marked as read"})
