from django.urls import path, include

from .views import HomeView, UserView
from .auth.views import LoginView, RegisterView, LogoutView

urlpatterns = [
    path("", HomeView.as_view(), name="home"),
    path("auth/", include("rest_api.auth.urls")),
    path("user/", UserView.as_view(), name="user"),
]
