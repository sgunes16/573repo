from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token['email'] = user.email
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name

        return token


def get_tokens_for_user(user):
    """Generate JWT tokens for a user"""
    refresh = RefreshToken.for_user(user)

    refresh['email'] = user.email
    refresh['first_name'] = user.first_name
    refresh['last_name'] = user.last_name

    access = refresh.access_token

    access['email'] = user.email
    access['first_name'] = user.first_name
    access['last_name'] = user.last_name

    return {
        'refresh': str(refresh),
        'access': str(access),
    }
