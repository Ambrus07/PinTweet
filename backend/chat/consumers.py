import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.db.models import Q
from django.utils import timezone

from .models import Conversation, Message


class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.user = self.scope["user"]

        if self.user.is_anonymous:
            await self.close()
            return

        self.conversation_id = self.scope["url_route"]["kwargs"][
            "conversation_id"
        ]

        if not await self.user_has_access():
            await self.close()
            return

        self.room_group_name = f"chat_{self.conversation_id}"

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name,
        )

        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "room_group_name"):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name,
            )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        message_type = data.get("type")

        if message_type == "message":
            content = data.get("content", "").strip()

            if not content or len(content) > 5000:
                return

            message = await self.create_message(content)

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message",
                    **message,
                },
            )

        elif message_type == "typing":
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "typing",
                    "user_id": self.user.id,
                    "username": self.user.username,
                },
            )

        elif message_type == "read":
            message_id = data.get("message_id")

            if message_id:
                await self.mark_message_as_read(message_id)

    async def chat_message(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "message",
                    "id": event["id"],
                    "content": event["content"],
                    "sender_id": event["sender_id"],
                    "sender_username": event["sender_username"],
                    "created_at": event["created_at"],
                }
            )
        )

    async def typing(self, event):
        if event["user_id"] == self.user.id:
            return

        await self.send(
            text_data=json.dumps(
                {
                    "type": "typing",
                    "user_id": event["user_id"],
                    "username": event["username"],
                }
            )
        )

    @database_sync_to_async
    def user_has_access(self):
        return Conversation.objects.filter(
            Q(id=self.conversation_id)
            & (
                Q(user1=self.user)
                | Q(user2=self.user)
            )
        ).exists()

    @database_sync_to_async
    def create_message(self, content):
        conversation = Conversation.objects.get(
            id=self.conversation_id
        )

        message = Message.objects.create(
            conversation=conversation,
            sender=self.user,
            content=content,
        )

        conversation.save(update_fields=["updated_at"])

        return {
            "id": message.id,
            "content": message.content,
            "sender_id": message.sender.id,
            "sender_username": message.sender.username,
            "created_at": message.created_at.isoformat(),
        }

    @database_sync_to_async
    def mark_message_as_read(self, message_id):
        try:
            message = Message.objects.get(
                id=message_id,
                conversation_id=self.conversation_id,
            )
        except Message.DoesNotExist:
            return

        if message.sender_id != self.user.id:
            message.read_at = timezone.now()
            message.save(update_fields=["read_at"])