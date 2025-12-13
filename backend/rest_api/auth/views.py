from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_api.models import User, EmailVerificationToken
from rest_api.auth.serializers import get_tokens_for_user
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from datetime import timedelta
import hashlib
import re
import secrets


def password_hash(password):
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password, hashed_password):
    return password_hash(password) == hashed_password


def validate_password(password):
    """
    Password validation rules:
    - Minimum 8 characters
    - At least 1 uppercase letter
    - At least 1 lowercase letter
    - At least 1 digit
    
    Returns list of error messages (empty if valid)
    """
    errors = []
    if len(password) < 8:
        errors.append("Password must be at least 8 characters")
    if not re.search(r'[A-Z]', password):
        errors.append("Password must contain at least one uppercase letter")
    if not re.search(r'[a-z]', password):
        errors.append("Password must contain at least one lowercase letter")
    if not re.search(r'[0-9]', password):
        errors.append("Password must contain at least one digit")
    return errors


def generate_verification_token():
    """Generate a secure random token"""
    return secrets.token_urlsafe(32)


def send_verification_email(user, token):
    """Send verification email to user"""
    verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    
    subject = "Verify your email - The Hive"
    message = f"""
Hello {user.first_name},

Welcome to The Hive! Please verify your email address by clicking the link below:

{verification_url}

This link will expire in 24 hours.

If you didn't create an account, please ignore this email.

Best regards,
The Hive Team
"""
    
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Failed to send verification email: {e}")
        return False


def get_cookie_settings(httponly=True):
    """Returns cookie settings based on DEPLOY_TYPE environment variable"""
    is_production = settings.IS_PRODUCTION
    return {
        'httponly': httponly,
        'secure': is_production,  # True in prod (HTTPS), False in dev (HTTP)
        'samesite': 'Strict' if is_production else 'Lax',  # Strict in prod, Lax in dev
        'path': '/',  # Ensure cookie is available for all paths including WebSocket
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
                "is_active": user.is_active,
                "is_verified": user.is_verified,
                "is_admin": user.is_admin,
                "is_superuser": user.is_superuser,
            },
            "access_token": tokens['access'],
            "refresh_token": tokens['refresh'],
        }

        response = Response(data)
        
        # Set cookies - will override any existing cookies with same name
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

        # Validate password strength
        password_errors = validate_password(password)
        if password_errors:
            return Response({
                "message": "Password does not meet requirements",
                "errors": password_errors
            }, status=400)

        if User.objects.filter(email=email).exists():
            return Response({"message": "User with this email already exists."}, status=400)

        user = User.objects.create(
            email=email,
            password=password_hash(password),
            first_name=first_name,
            last_name=last_name,
            is_verified=False  # User needs to verify email
        )

        # Generate verification token and send email
        token = generate_verification_token()
        EmailVerificationToken.objects.create(
            user=user,
            token=token,
            expires_at=timezone.now() + timedelta(hours=24)
        )
        send_verification_email(user, token)

        tokens = get_tokens_for_user(user)
        data = {
            "message": "Registration successful. Please check your email to verify your account.",
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "is_active": user.is_active,
                "is_verified": user.is_verified,
                "is_admin": user.is_admin,
                "is_superuser": user.is_superuser,
            },
            "access_token": tokens['access'],
            "refresh_token": tokens['refresh'],
        }
        response = Response(data, status=201)
        
        # Set cookies
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
            
            # Set new cookies
            response.set_cookie("refresh_token", new_tokens['refresh'], **get_cookie_settings(httponly=True))
            response.set_cookie("access_token", new_tokens['access'], **get_cookie_settings(httponly=False))
            
            return response

        except Exception as e:
            return Response({"message": "Invalid refresh token"}, status=401)


class SendVerificationEmailView(APIView):
    """Send or resend verification email to authenticated user"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        if user.is_verified:
            return Response({"message": "Email already verified"}, status=400)

        # Invalidate existing tokens
        EmailVerificationToken.objects.filter(user=user, is_used=False).update(is_used=True)

        # Generate new token
        token = generate_verification_token()
        EmailVerificationToken.objects.create(
            user=user,
            token=token,
            expires_at=timezone.now() + timedelta(hours=24)
        )

        if send_verification_email(user, token):
            return Response({"message": "Verification email sent successfully"})
        else:
            return Response({"message": "Failed to send verification email"}, status=500)


class VerifyEmailView(APIView):
    """Verify email with token"""
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get("token")

        if not token:
            return Response({"message": "Token is required"}, status=400)

        try:
            verification_token = EmailVerificationToken.objects.get(
                token=token,
                is_used=False
            )
        except EmailVerificationToken.DoesNotExist:
            return Response({"message": "Invalid or expired token"}, status=400)

        if verification_token.is_expired:
            return Response({"message": "Token has expired"}, status=400)

        # Mark token as used
        verification_token.is_used = True
        verification_token.save()

        # Verify user
        user = verification_token.user
        user.is_verified = True
        user.save()

        return Response({
            "message": "Email verified successfully",
            "user": {
                "id": user.id,
                "email": user.email,
                "is_verified": user.is_verified,
            }
        })


class ResendVerificationEmailView(APIView):
    """Resend verification email (public endpoint with email)"""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")

        if not email:
            return Response({"message": "Email is required"}, status=400)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Don't reveal if user exists
            return Response({"message": "If the email exists, a verification email will be sent"})

        if user.is_verified:
            return Response({"message": "If the email exists, a verification email will be sent"})

        # Invalidate existing tokens
        EmailVerificationToken.objects.filter(user=user, is_used=False).update(is_used=True)

        # Generate new token
        token = generate_verification_token()
        EmailVerificationToken.objects.create(
            user=user,
            token=token,
            expires_at=timezone.now() + timedelta(hours=24)
        )

        send_verification_email(user, token)

        return Response({"message": "If the email exists, a verification email will be sent"})
