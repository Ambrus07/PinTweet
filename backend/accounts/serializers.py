from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User

        fields = [
            "id",
            "username",
            "email",
            "avatar",
            "cover_image",
            "bio",
            "website",
            "is_adult",
            "followers_count",
            "following_count",
            "created_at",
        ]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=6
    )

    class Meta:
        model = User

        fields = [
            "username",
            "email",
            "password",
        ]

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User

        fields = [
            "avatar",
            "cover_image",
            "bio",
            "website",
            "is_adult",
        ]