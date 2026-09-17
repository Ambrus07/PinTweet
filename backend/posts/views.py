from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response

from .models import Post, Like
from .serializers import PostSerializer, CommentSerializer
from .permissions import IsOwner


class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all().order_by("-created_at")

    serializer_class = PostSerializer

    permission_classes = [
        IsAuthenticatedOrReadOnly,
        IsOwner,
    ]

    parser_classes = [
        MultiPartParser,
        FormParser
    ]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        post = self.get_object()

        like, created = Like.objects.get_or_create(
            user=request.user,
            post=post,
        )

        if created:
            post.likes_count += 1
            post.save(update_fields=["likes_count"])
            liked = True
        else:
            like.delete()
            post.likes_count = max(0, post.likes_count - 1)
            post.save(update_fields=["likes_count"])
            liked = False

        return Response({
            "liked": liked,
            "likes_count": post.likes_count,
        })

    @action(
        detail=True,
        methods=["get", "post"],
        permission_classes=[IsAuthenticatedOrReadOnly],
    )
    def comments(self, request, pk=None):
        post = self.get_object()

        if request.method == "GET":
            comments = post.comments.order_by("-created_at")
            serializer = CommentSerializer(comments, many=True)
            return Response(serializer.data)

        serializer = CommentSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(user=request.user, post=post)

            post.comments_count += 1
            post.save(update_fields=["comments_count"])

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)