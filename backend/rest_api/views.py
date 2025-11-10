from rest_framework.views import APIView
from rest_framework.response import Response
from rest_api.models import Offer
import json

class HomeView(APIView):
    def get(self, request):
        return Response({"message": "Home page"})


class UserView(APIView):
    def get(self, request):
        user = request.user
        return Response({
            "message": "User retrieved",
            "user": json.loads(user),
        })
class OfferView(APIView):
    def get(self, request):
        offers = Offer.objects.all()
        return Response({
            "message": "Offers retrieved",
            "offers": json.loads(offers),
        })