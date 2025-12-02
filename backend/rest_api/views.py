from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_api.models import Offer, UserProfile, TimeBank, OfferImage
from datetime import datetime
from django.conf import settings

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
