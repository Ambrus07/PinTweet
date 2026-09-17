from django.urls import path

from .views import (
    ConversationListView,
    ConversationMessagesView,
    MessageReadView,
)


urlpatterns = [
    path(
        "conversations/",
        ConversationListView.as_view(),
        name="conversation-list",
    ),
    path(
        "conversations/<int:conversation_id>/messages/",
        ConversationMessagesView.as_view(),
        name="conversation-messages",
    ),
    path(
        "messages/<int:message_id>/read/",
        MessageReadView.as_view(),
        name="message-read",
    ),
]