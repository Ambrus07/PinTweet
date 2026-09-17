from rest_framework import viewsets
from rest_framework.permissions import (
    IsAuthenticatedOrReadOnly
)

from .models import Board
from .serializers import BoardSerializer


class BoardViewSet(viewsets.ModelViewSet):
    serializer_class = BoardSerializer
    permission_classes = [
        IsAuthenticatedOrReadOnly
    ]

    def get_queryset(self):
        return Board.objects.all().order_by(
            "-created_at"
        )

    def perform_create(self, serializer):
        serializer.save(
            owner=self.request.user
        )