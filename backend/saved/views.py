from rest_framework import status
from rest_framework.decorators import (
    api_view,
    permission_classes,
)
from rest_framework.permissions import (
    IsAuthenticated,
)
from rest_framework.response import Response

from posts.models import Post

from .models import SavedPost
from .serializers import (
    SavedPostSerializer,
)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def saved_posts(request):
    saved = SavedPost.objects.filter(
        user=request.user
    ).order_by("-created_at")

    serializer = SavedPostSerializer(
        saved,
        many=True
    )

    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def save_post(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return Response(
            {"error": "Post not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    SavedPost.objects.get_or_create(
        user=request.user,
        post=post
    )

    return Response(
        {"message": "Post saved"}
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def unsave_post(request, post_id):
    SavedPost.objects.filter(
        user=request.user,
        post_id=post_id
    ).delete()

    return Response(
        {"message": "Post removed"}
    )