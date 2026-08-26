from django.urls import path

from .views import (
    register,
    profile,
    update_profile,
    user_profile,
    follow_user,
    unfollow_user,
)

urlpatterns = [
    path(
        "register/",
        register,
        name="register",
    ),

    path(
        "profile/",
        profile,
        name="profile",
    ),

    path(
        "profile/update/",
        update_profile,
        name="update-profile",
    ),

    path(
        "user/<int:user_id>/",
        user_profile,
        name="user-profile",
    ),

    path(
        "follow/<int:user_id>/",
        follow_user,
        name="follow-user",
    ),

    path(
        "unfollow/<int:user_id>/",
        unfollow_user,
        name="unfollow-user",
    ),
]