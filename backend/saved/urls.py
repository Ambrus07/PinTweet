from django.urls import path

from .views import (
    saved_posts,
    save_post,
    unsave_post,
)

urlpatterns = [
    path(
        "",
        saved_posts
    ),

    path(
        "save/<int:post_id>/",
        save_post
    ),

    path(
        "remove/<int:post_id>/",
        unsave_post
    ),
]