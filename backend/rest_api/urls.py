from django.urls import path, include

from .views import (
    HomeView, UserView, OffersView, UserProfileView, CreateOfferView,
    UploadOfferImageView, DeleteOfferImageView, SetPrimaryImageView
)
from .auth.views import LoginView, RegisterView, LogoutView

urlpatterns = [
    path("", HomeView.as_view(), name="home"),
    path("auth/", include("rest_api.auth.urls")),
    path("user/", UserView.as_view(), name="user"),
    path("offers/", OffersView.as_view(), name="offers"),
    path("user-profile/", UserProfileView.as_view(), name="user-profile"),
    path("create-offer", CreateOfferView.as_view(), name="create-offer"),
    
    # Image upload endpoints (works for both offers and wants)
    path("offers/<int:offer_id>/images/", UploadOfferImageView.as_view(), name="upload-offer-image"),
    path("offers/<int:offer_id>/images/<int:image_id>/", DeleteOfferImageView.as_view(), name="delete-offer-image"),
    path("offers/<int:offer_id>/images/<int:image_id>/primary/", SetPrimaryImageView.as_view(), name="set-primary-image"),
]
