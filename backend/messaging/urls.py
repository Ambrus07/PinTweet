from django.urls import path

from .views import (
    conversations,
    create_conversation,
    conversation_messages,
    send_message,
)

urlpatterns = [
    path(
        "",
        conversations
    ),

    path(
        "create/<int:user_id>/",
        create_conversation
    ),

    path(
        "<int:conversation_id>/",
        conversation_messages
    ),

    path(
        "<int:conversation_id>/send/",
        send_message
    ),
]