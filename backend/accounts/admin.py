from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User, Follow


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = (
        "id",
        "email",
        "username",
        "is_staff",
        "created_at",
    )

    search_fields = (
        "email",
        "username",
    )

    ordering = (
        "id",
    )


@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "follower",
        "following",
        "created_at",
    )

    search_fields = (
        "follower__username",
        "following__username",
    )