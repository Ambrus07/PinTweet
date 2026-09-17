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

    is_liked = serializers.SerializerMethodField()

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
            "is_liked",
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

    def get_is_liked(self, obj):
        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            return False

        return obj.likes.filter(user=request.user).exists()


class CommentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        source="user.username",
        read_only=True
    )

    user = serializers.IntegerField(
        source="user.id",
        read_only=True
    )

    class Meta:
        model = Comment

        fields = [
            "id",
            "post",
            "user",
            "username",
            "content",
            "created_at",
        ]

        read_only_fields = [
            "post",
            "user",
            "created_at",
        ]