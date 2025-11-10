from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_api.models import User
from rest_api.auth.serializers import get_tokens_for_user
from rest_framework_simplejwt.tokens import RefreshToken
import hashlib


def password_hash(password):
    return hashlib.sha256(password.encode()).hexdigest()


def check_password(password, hashed_password):
    return password_hash(password) == hashed_password


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        if not email or not password:
            return Response({"message": "Email and password are required."}, status=400)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"message": "Invalid credentials"}, status=401)

        if not check_password(password, user.password):
            return Response({"message": "Invalid credentials"}, status=401)

        tokens = get_tokens_for_user(user)
        data = {
            "message": "Login successful",
            "user": user.id,
            "access_token": tokens['access'],
            "refresh_token": tokens['refresh'],
        }

        response = Response(data)
        response.set_cookie(
            "refresh_token",
            tokens['refresh'],
            httponly=True,
            secure=True,
            samesite="Strict"
        )
        response.set_cookie(
            "access_token",
            tokens['access'],
            httponly=True,
            secure=True,
            samesite="Strict"
        )
        return response


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        check_password = request.data.get("check_password")
        first_name = request.data.get("first_name")
        last_name = request.data.get("last_name")

        if not email or not password or not check_password or not first_name or not last_name:
            return Response({"message": "Email, password, check_password, first and last name are required."}, status=400)

        if password != check_password:
            return Response({"message": "Passwords do not match."}, status=400)

        if User.objects.filter(email=email).exists():
            return Response({"message": "User with this email already exists."}, status=400)

        user = User.objects.create(
            email=email,
            password=password_hash(password),
            first_name=first_name,
            last_name=last_name
        )

        tokens = get_tokens_for_user(user)
        data = {
            "message": "Registration successful",
            "user": user.id,
            "access_token": tokens['access'],
            "refresh_token": tokens['refresh'],
        }
        response = Response(data)
        response.set_cookie(
            "refresh_token",
            tokens['refresh'],
            httponly=True,
            secure=True,
            samesite="Strict"
        )
        response.set_cookie(
            "access_token",
            tokens['access'],
            httponly=True,
            secure=True,
            samesite="Strict"
        )
        return response


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.COOKIES.get("refresh_token")

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass

        response = Response({"message": "Logout successful"})
        response.delete_cookie(
            "refresh_token",
            path="/",
            samesite="Strict"
        )
        response.delete_cookie(
            "access_token",
            path="/",
            samesite="Strict"
        )
        return response
