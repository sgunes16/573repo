from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_api.models import User
from rest_api.auth.serializers import get_tokens_for_user
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
import hashlib


def password_hash(password):
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password, hashed_password):
    return password_hash(password) == hashed_password


def get_cookie_settings(httponly=True):
    """Returns cookie settings based on DEPLOY_TYPE environment variable"""
    is_production = settings.IS_PRODUCTION
    return {
        'httponly': httponly,
        'secure': is_production,  # True in prod (HTTPS), False in dev (HTTP)
        'samesite': 'Strict' if is_production else 'Lax',  # Strict in prod, Lax in dev
    }


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"message": "Me", "user": {
            "id": request.user.id,
            "email": request.user.email,
            "first_name": request.user.first_name,
            "last_name": request.user.last_name,
            "created_at": request.user.created_at,
            "updated_at": request.user.updated_at,
            "is_active": request.user.is_active,
            "is_verified": request.user.is_verified,
            "is_admin": request.user.is_admin,
            "is_superuser": request.user.is_superuser,
            "is_deleted": request.user.is_deleted,
            "is_blocked": request.user.is_blocked,
            "is_banned": request.user.is_banned,
            "is_suspended": request.user.is_suspended,
        }})


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

        if not verify_password(password, user.password):
            return Response({"message": "Invalid credentials"}, status=401)

        tokens = get_tokens_for_user(user)
        data = {
            "message": "Login successful",
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
            },
            "access_token": tokens['access'],
            "refresh_token": tokens['refresh'],
        }

        response = Response(data)
        
        # refresh_token stays httpOnly for security, access_token readable by JS for WebSocket auth
        response.set_cookie("refresh_token", tokens['refresh'], **get_cookie_settings(httponly=True))
        response.set_cookie("access_token", tokens['access'], **get_cookie_settings(httponly=False))
        return response


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        confirm_password = request.data.get("check_password")
        first_name = request.data.get("first_name")
        last_name = request.data.get("last_name")

        if not email or not password or not confirm_password or not first_name or not last_name:
            return Response({"message": "Email, password, check_password, first and last name are required."}, status=400)

        if password != confirm_password:
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
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
            },
            "access_token": tokens['access'],
            "refresh_token": tokens['refresh'],
        }
        response = Response(data, status=201)
        
        # refresh_token stays httpOnly for security, access_token readable by JS for WebSocket auth
        response.set_cookie("refresh_token", tokens['refresh'], **get_cookie_settings(httponly=True))
        response.set_cookie("access_token", tokens['access'], **get_cookie_settings(httponly=False))
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
        cookie_settings = get_cookie_settings()
        
        response.delete_cookie("refresh_token", path="/", samesite=cookie_settings['samesite'])
        response.delete_cookie("access_token", path="/", samesite=cookie_settings['samesite'])
        return response


class RefreshTokenView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get("refresh_token")

        if not refresh_token:
            return Response({"message": "Refresh token not found"}, status=401)

        try:
            refresh = RefreshToken(refresh_token)

            user_id = refresh.get('user_id')
            user = User.objects.get(id=user_id)

            new_tokens = get_tokens_for_user(user)

            data = {
                "message": "Token refreshed successfully",
                "access_token": new_tokens['access'],
                "refresh_token": new_tokens['refresh'],
            }

            response = Response(data)
            
            # refresh_token stays httpOnly for security, access_token readable by JS for WebSocket auth
            response.set_cookie("refresh_token", new_tokens['refresh'], **get_cookie_settings(httponly=True))
            response.set_cookie("access_token", new_tokens['access'], **get_cookie_settings(httponly=False))
            
            return response

        except Exception as e:
            return Response({"message": "Invalid refresh token"}, status=401)
