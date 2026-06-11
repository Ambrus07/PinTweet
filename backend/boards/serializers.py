from rest_framework import serializers

from .models import Board


class BoardSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(
        source="owner.username",
        read_only=True
    )

    class Meta:
        model = Board
        fields = "__all__"
        read_only_fields = (
            "owner",
            "created_at",
        )