from django.contrib.auth import get_user_model

from rest_framework import status
from rest_framework.decorators import (
    api_view,
    permission_classes,
)
from rest_framework.permissions import (
    IsAuthenticated,
)
from rest_framework.response import Response

from .models import (
    Conversation,
    ConversationParticipant,
    Message,
)

from .serializers import (
    ConversationSerializer,
    MessageSerializer,
)

User = get_user_model()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def conversations(request):
    conversation_ids = (
        ConversationParticipant.objects.filter(
            user=request.user
        ).values_list(
            "conversation_id",
            flat=True
        )
    )

    chats = Conversation.objects.filter(
        id__in=conversation_ids
    )

    serializer = ConversationSerializer(
        chats,
        many=True
    )

    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_conversation(
    request,
    user_id
):
    try:
        other_user = User.objects.get(
            id=user_id
        )
    except User.DoesNotExist:
        return Response(
            {"error": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    conversation = Conversation.objects.create()

    ConversationParticipant.objects.create(
        conversation=conversation,
        user=request.user
    )

    ConversationParticipant.objects.create(
        conversation=conversation,
        user=other_user
    )

    serializer = ConversationSerializer(
        conversation
    )

    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def conversation_messages(
    request,
    conversation_id
):
    messages = Message.objects.filter(
        conversation_id=conversation_id
    ).order_by("created_at")

    serializer = MessageSerializer(
        messages,
        many=True
    )

    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_message(
    request,
    conversation_id
):
    text = request.data.get(
        "content",
        ""
    )

    if not text:
        return Response(
            {"error": "Message required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    message = Message.objects.create(
        conversation_id=conversation_id,
        sender=request.user,
        content=text,
    )

    serializer = MessageSerializer(
        message
    )

    return Response(serializer.data)