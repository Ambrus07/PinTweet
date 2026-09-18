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
        many=True,
        context={"request": request},
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

    if other_user == request.user:
        return Response(
            {"error": "You cannot message yourself"},
            status=status.HTTP_400_BAD_REQUEST
        )

    existing = (
        Conversation.objects.filter(
            conversationparticipant__user=request.user
        ).filter(
            conversationparticipant__user=other_user
        ).first()
    )

    if existing:
        serializer = ConversationSerializer(existing, context={"request": request})
        return Response(serializer.data)

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
        conversation,
        context={"request": request},
    )

    return Response(serializer.data)


def _ensure_participant(request, conversation_id):
    return ConversationParticipant.objects.filter(
        conversation_id=conversation_id,
        user=request.user,
    ).exists()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def conversation_messages(
    request,
    conversation_id
):
    if not _ensure_participant(request, conversation_id):
        return Response(
            {"error": "Not a participant of this conversation"},
            status=status.HTTP_403_FORBIDDEN
        )

    messages = Message.objects.filter(
        conversation_id=conversation_id
    ).order_by("created_at")

    messages.exclude(sender=request.user).update(is_read=True)

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
    if not _ensure_participant(request, conversation_id):
        return Response(
            {"error": "Not a participant of this conversation"},
            status=status.HTTP_403_FORBIDDEN
        )

    text = request.data.get(
        "content",
        ""
    ).strip()

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