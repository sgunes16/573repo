from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_api.models import Offer, UserProfile, TimeBank, OfferImage, Exchange, ExchangeRating, TimeBankTransaction, Comment
from datetime import datetime, date, time
from django.conf import settings
from django.db import transaction, models
from django.db.models import Q, Avg

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
        offers = Offer.objects.select_related('user', 'user__profile').all()
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
            for offer in offers
        ])


class OfferDetailView(APIView):
    """Get details of a single offer/want"""
    
    def get(self, request, offer_id):
        try:
            offer = Offer.objects.select_related('user', 'user__profile').prefetch_related('offer_images').get(id=offer_id)
        except Offer.DoesNotExist:
            return Response({"error": "Offer not found"}, status=404)
        
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
        })


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
                status__in=['PENDING', 'ACCEPTED', 'IN_PROGRESS']
            ).first()
            if existing:
                return Response({"error": "Exchange request already exists"}, status=400)

            # Freeze 1H time from requester
            requester_timebank, _ = TimeBank.objects.get_or_create(
                user=request.user,
                defaults={'amount': 1, 'blocked_amount': 0, 'available_amount': 1, 'total_amount': 1}
            )
            
            if not requester_timebank.block_credit(1):
                return Response({
                    "error": "Insufficient time credits. You need at least 1H available."
                }, status=400)

            # Create exchange
            exchange = Exchange.objects.create(
                offer=offer,
                provider=offer.user,
                requester=request.user,
                status='PENDING',
                time_spent=offer.time_required
            )

            return Response({
                "message": "Exchange request created successfully",
                "exchange_id": exchange.id,
                "time_frozen": 1
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

            return Response({
                "message": "Date and time proposed successfully",
                "proposed_date": exchange.proposed_date,
                "proposed_time": str(exchange.proposed_time) if exchange.proposed_time else None,
            })

        except Exchange.DoesNotExist:
            return Response({"error": "Exchange not found"}, status=404)


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
            requester_timebank.unblock_credit(1)

            exchange.status = 'CANCELLED'
            exchange.save()

            return Response({
                "message": "Exchange rejected and time unfrozen",
                "status": exchange.status,
            })

        except Exchange.DoesNotExist:
            return Response({"error": "Exchange not found"}, status=404)


class ConfirmCompletionView(APIView):
    """Confirm completion of exchange"""
    permission_classes = [IsAuthenticated]

    def post(self, request, exchange_id):
        try:
            exchange = Exchange.objects.get(id=exchange_id)
            
            # Check if user is part of exchange
            if exchange.provider != request.user and exchange.requester != request.user:
                return Response({"error": "Not authorized"}, status=403)

            if exchange.status != 'ACCEPTED':
                return Response({"error": "Exchange must be accepted first"}, status=400)

            # Mark confirmation
            if request.user == exchange.requester:
                exchange.requester_confirmed = True
            elif request.user == exchange.provider:
                exchange.provider_confirmed = True

            # If both confirmed, mark as completed
            if exchange.requester_confirmed and exchange.provider_confirmed:
                exchange.status = 'COMPLETED'
                exchange.completed_at = datetime.now()

            exchange.save()

            return Response({
                "message": "Completion confirmed",
                "requester_confirmed": exchange.requester_confirmed,
                "provider_confirmed": exchange.provider_confirmed,
                "status": exchange.status,
            })

        except Exchange.DoesNotExist:
            return Response({"error": "Exchange not found"}, status=404)


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

            # If both parties rated, transfer time
            provider_rated = ExchangeRating.objects.filter(
                exchange=exchange,
                rater=exchange.provider
            ).exists()
            requester_rated = ExchangeRating.objects.filter(
                exchange=exchange,
                rater=exchange.requester
            ).exists()

            if provider_rated and requester_rated:
                # Transfer time from requester to provider
                requester_timebank = exchange.requester.timebank
                provider_timebank, _ = TimeBank.objects.get_or_create(
                    user=exchange.provider,
                    defaults={'amount': 0, 'blocked_amount': 0, 'available_amount': 0, 'total_amount': 0}
                )

                # Unfreeze requester's time
                requester_timebank.unblock_credit(exchange.time_spent)
                
                # Transfer time
                if requester_timebank.amount >= exchange.time_spent:
                    requester_timebank.spend_credit(exchange.time_spent)
                    provider_timebank.add_credit(exchange.time_spent)

                    # Create single transaction record for the exchange
                    TimeBankTransaction.objects.create(
                        from_user=exchange.requester,
                        to_user=exchange.provider,
                        exchange=exchange,
                        time_amount=exchange.time_spent,
                        transaction_type='SPEND',
                        description=f'Exchange completed: {exchange.offer.title}'
                    )

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

            transactions_data.append({
                "id": tx.id,
                "from_user": {
                    "id": tx.from_user.id,
                    "first_name": tx.from_user.first_name,
                    "last_name": tx.from_user.last_name,
                    "email": tx.from_user.email,
                },
                "to_user": {
                    "id": tx.to_user.id,
                    "first_name": tx.to_user.first_name,
                    "last_name": tx.to_user.last_name,
                    "email": tx.to_user.email,
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

        return Response(transactions_data)
