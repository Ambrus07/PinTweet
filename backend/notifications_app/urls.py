from django.urls import path

from .views import (
    notifications,
    mark_as_read,
    mark_all_as_read,
)

urlpatterns = [
    path(
        "",
        notifications
    ),

    path(
        "read/<int:notification_id>/",
        mark_as_read
    ),

    path(
        "read-all/",
        mark_all_as_read
    ),
]