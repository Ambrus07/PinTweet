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

    class Meta:
        model = Conversation
        fields = [
            "id",
            "created_at",
            "participants",
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