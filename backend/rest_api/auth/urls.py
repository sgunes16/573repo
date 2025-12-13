from django.urls import path
from .views import (
    LoginView, RegisterView, LogoutView, RefreshTokenView, MeView,
    SendVerificationEmailView, VerifyEmailView, ResendVerificationEmailView
)

urlpatterns = [
    path("login", LoginView.as_view(), name="login"),
    path("register", RegisterView.as_view(), name="register"),
    path("logout", LogoutView.as_view(), name="logout"),
    path("token/refresh", RefreshTokenView.as_view(), name="token-refresh"),
    path("me", MeView.as_view(), name="me"),
    path("send-verification", SendVerificationEmailView.as_view(), name="send-verification"),
    path("verify-email", VerifyEmailView.as_view(), name="verify-email"),
    path("resend-verification", ResendVerificationEmailView.as_view(), name="resend-verification"),
]
