from rest_framework.routers import DefaultRouter

from .views import BoardViewSet

router = DefaultRouter()

router.register(
    "",
    BoardViewSet,
    basename="boards"
)

urlpatterns = router.urls