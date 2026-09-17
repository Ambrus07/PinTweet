from django.contrib import admin

from .models import SavedPost


@admin.register(SavedPost)
class SavedPostAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "post",
        "created_at",
    )