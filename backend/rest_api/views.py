from rest_framework.views import APIView
from rest_framework.response import Response
from rest_api.models import Offer, UserProfile, TimeBank

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
        offers = Offer.objects.all()
        # Offer has no to_dict method; instead, serialize manually:
        return Response([
            {
                "id": offer.id,
                "user_id": offer.user_id,
                "title": offer.title,
                "description": offer.description,
                "category": offer.category,
                "time_required": offer.time_required,
                "location": offer.location,
                "geo_location": offer.geo_location,
                "status": offer.status,
                "tags": offer.tags,
                "images": offer.images,
                "videos": offer.videos,
                "audio": offer.audio,
                "documents": offer.documents,
                "created_at": offer.created_at,
                "updated_at": offer.updated_at,
            }
            for offer in offers
        ])