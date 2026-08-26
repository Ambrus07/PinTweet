from rest_framework import serializers

from .models import (
    Post,
    Comment
)

class PostSerializer(serializers.ModelSerializer):
    author = serializers.IntegerField(source="author.id", read_only=True)

    author_username = serializers.CharField(
        source="author.username",
        read_only=True
    )

    class Meta:
        model = Post
        fields = [
            "id",
            "title",
            "description",
            "image",
            "author",
            "author_username",
            "likes_count",
            "comments_count",
            "is_adult",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "author",
            "likes_count",
            "comments_count",
            "created_at",
            "updated_at",
        ]


class CommentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        source="user.username",
        read_only=True
    )

    class Meta:
        model = Comment

        fields = "__all__"