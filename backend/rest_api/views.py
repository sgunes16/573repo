from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_api.models import Offer, UserProfile, TimeBank
from datetime import datetime

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
                "images": offer.images,
                "date": offer.date,
                "time": offer.time,
                "from_date": offer.from_date,
                "to_date": offer.to_date,
                "created_at": offer.created_at,
                "updated_at": offer.updated_at,
            }
            for offer in offers
        ])
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
