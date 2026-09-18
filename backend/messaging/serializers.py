from rest_framework import serializers

from .models import (
    Conversation,
    ConversationParticipant,
    Message,
)


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(
        source="sender.username",
        read_only=True
    )

    class Meta:
        model = Message
        fields = "__all__"


class ConversationParticipantSerializer(
    serializers.ModelSerializer
):
    username = serializers.CharField(
        source="user.username",
        read_only=True
    )

    class Meta:
        model = ConversationParticipant
        fields = "__all__"


class ConversationSerializer(
    serializers.ModelSerializer
):
    participants = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id",
            "created_at",
            "participants",
            "last_message",
            "unread_count",
        ]

    def get_participants(self, obj):
        participants = (
            ConversationParticipant.objects.filter(
                conversation=obj
            )
        )

        return ConversationParticipantSerializer(
            participants,
            many=True
        ).data

    def get_last_message(self, obj):
        last = obj.messages.order_by("-created_at").first()

        if not last:
            return None

        return MessageSerializer(last).data

    def get_unread_count(self, obj):
        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            return 0

        return obj.messages.filter(
            is_read=False
        ).exclude(
            sender=request.user
        ).count()