from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Conversation, Message


User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username"]


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = [
            "id",
            "conversation",
            "sender",
            "content",
            "created_at",
            "read_at",
        ]
        read_only_fields = [
            "id",
            "sender",
            "created_at",
            "read_at",
        ]


class ConversationSerializer(serializers.ModelSerializer):
    user1 = UserSerializer(read_only=True)
    user2 = UserSerializer(read_only=True)

    class Meta:
        model = Conversation
        fields = [
            "id",
            "user1",
            "user2",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "user1",
            "user2",
            "created_at",
            "updated_at",
        ]


class CreateConversationSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()

    def validate_user_id(self, value):
        try:
            User.objects.get(id=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("A felhasználó nem létezik.")

        return value


class CreateMessageSerializer(serializers.Serializer):
    content = serializers.CharField(
        required=True,
        allow_blank=False,
        max_length=5000,
    )