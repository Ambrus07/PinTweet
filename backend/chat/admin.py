from django.contrib import admin

from .models import Conversation, Message


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "user1",
        "user2",
        "created_at",
        "updated_at",
    ]

    search_fields = [
        "user1__username",
        "user2__username",
    ]


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "conversation",
        "sender",
        "content",
        "created_at",
        "read_at",
    ]

    search_fields = [
        "sender__username",
        "content",
    ]

    list_filter = [
        "created_at",
        "read_at",
    ]