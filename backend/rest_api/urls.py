from django.urls import path, include

from .views import (
    HomeView, UserView, OffersView, OfferDetailView, UserProfileView, CreateOfferView,
    UploadOfferImageView, DeleteOfferImageView, SetPrimaryImageView,
    CreateExchangeView, ExchangeDetailView, MyExchangesView, ExchangeByOfferView, ExchangesByOfferView, ProposeDateTimeView,
    AcceptExchangeView, RejectExchangeView, ConfirmCompletionView, SubmitRatingView
)
from .auth.views import LoginView, RegisterView, LogoutView

urlpatterns = [
    path("", HomeView.as_view(), name="home"),
    path("auth/", include("rest_api.auth.urls")),
    path("user/", UserView.as_view(), name="user"),
    path("offers/", OffersView.as_view(), name="offers"),
    path("offers/<int:offer_id>/", OfferDetailView.as_view(), name="offer-detail"),
    path("user-profile/", UserProfileView.as_view(), name="user-profile"),
    path("create-offer", CreateOfferView.as_view(), name="create-offer"),
    
    # Image upload endpoints (works for both offers and wants)
    path("offers/<int:offer_id>/images/", UploadOfferImageView.as_view(), name="upload-offer-image"),
    path("offers/<int:offer_id>/images/<int:image_id>/", DeleteOfferImageView.as_view(), name="delete-offer-image"),
    path("offers/<int:offer_id>/images/<int:image_id>/primary/", SetPrimaryImageView.as_view(), name="set-primary-image"),
    
    # Exchange endpoints
    path("exchanges/", CreateExchangeView.as_view(), name="create-exchange"),
    path("exchanges/<int:exchange_id>/", ExchangeDetailView.as_view(), name="exchange-detail"),
    path("exchanges/by-offer/<int:offer_id>/", ExchangeByOfferView.as_view(), name="exchange-by-offer"),
    path("exchanges/for-offer/<int:offer_id>/", ExchangesByOfferView.as_view(), name="exchanges-for-offer"),
    path("my-exchanges/", MyExchangesView.as_view(), name="my-exchanges"),
    path("exchanges/<int:exchange_id>/propose-datetime/", ProposeDateTimeView.as_view(), name="propose-datetime"),
    path("exchanges/<int:exchange_id>/accept/", AcceptExchangeView.as_view(), name="accept-exchange"),
    path("exchanges/<int:exchange_id>/reject/", RejectExchangeView.as_view(), name="reject-exchange"),
    path("exchanges/<int:exchange_id>/confirm-completion/", ConfirmCompletionView.as_view(), name="confirm-completion"),
    path("exchanges/<int:exchange_id>/rate/", SubmitRatingView.as_view(), name="submit-rating"),
]
