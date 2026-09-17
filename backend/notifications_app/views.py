from rest_framework.decorators import (
    api_view,
    permission_classes,
)

from rest_framework.permissions import (
    IsAuthenticated,
)

from rest_framework.response import Response

from .models import Notification
from .serializers import (
    NotificationSerializer,
)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def notifications(request):
    items = Notification.objects.filter(
        user=request.user
    ).order_by("-created_at")

    serializer = NotificationSerializer(
        items,
        many=True
    )

    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_as_read(
    request,
    notification_id
):
    try:
        notification = Notification.objects.get(
            id=notification_id,
            user=request.user
        )
    except Notification.DoesNotExist:
        return Response(
            {
                "error":
                "Notification not found"
            },
            status=404
        )

    notification.is_read = True
    notification.save()

    return Response(
        {
            "message":
            "Notification marked as read"
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_all_as_read(request):
    Notification.objects.filter(
        user=request.user,
        is_read=False
    ).update(
        is_read=True
    )

    return Response(
        {
            "message":
            "All notifications marked as read"
        }
    )