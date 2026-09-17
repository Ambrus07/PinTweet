from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Conversation, Message
from .serializers import (
    ConversationSerializer,
    CreateConversationSerializer,
    CreateMessageSerializer,
    MessageSerializer,
)


User = get_user_model()


class ConversationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        conversations = Conversation.objects.filter(
            Q(user1=request.user) | Q(user2=request.user)
        ).select_related("user1", "user2")

        serializer = ConversationSerializer(conversations, many=True)

        return Response(serializer.data)

    def post(self, request):
        serializer = CreateConversationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        other_user_id = serializer.validated_data["user_id"]

        if other_user_id == request.user.id:
            return Response(
                {"detail": "Nem indíthatsz beszélgetést saját magaddal."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        other_user = User.objects.get(id=other_user_id)

        user1, user2 = sorted(
            [request.user, other_user],
            key=lambda user: user.id,
        )

        conversation, created = Conversation.objects.get_or_create(
            user1=user1,
            user2=user2,
        )

        return Response(
            ConversationSerializer(conversation).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class ConversationMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get_conversation(self, request, conversation_id):
        try:
            return Conversation.objects.get(
                Q(id=conversation_id)
                & (Q(user1=request.user) | Q(user2=request.user))
            )
        except Conversation.DoesNotExist:
            return None

    def get(self, request, conversation_id):
        conversation = self.get_conversation(
            request,
            conversation_id,
        )

        if conversation is None:
            return Response(
                {"detail": "A beszélgetés nem található."},
                status=status.HTTP_404_NOT_FOUND,
            )

        messages = conversation.messages.select_related("sender")

        serializer = MessageSerializer(messages, many=True)

        return Response(serializer.data)

    def post(self, request, conversation_id):
        conversation = self.get_conversation(
            request,
            conversation_id,
        )

        if conversation is None:
            return Response(
                {"detail": "A beszélgetés nem található."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CreateMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content=serializer.validated_data["content"],
        )

        conversation.save(update_fields=["updated_at"])

        return Response(
            MessageSerializer(message).data,
            status=status.HTTP_201_CREATED,
        )


class MessageReadView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, message_id):
        try:
            message = Message.objects.select_related(
                "conversation"
            ).get(
                id=message_id,
                conversation__user1=request.user,
            )
        except Message.DoesNotExist:
            try:
                message = Message.objects.select_related(
                    "conversation"
                ).get(
                    id=message_id,
                    conversation__user2=request.user,
                )
            except Message.DoesNotExist:
                return Response(
                    {"detail": "Az üzenet nem található."},
                    status=status.HTTP_404_NOT_FOUND,
                )

        if message.sender != request.user:
            from django.utils import timezone

            message.read_at = timezone.now()
            message.save(update_fields=["read_at"])

        return Response(MessageSerializer(message).data)