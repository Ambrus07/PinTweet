from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

from chat.middleware import JWTAuthMiddleware
from chat.routing import websocket_urlpatterns


django_asgi_application = get_asgi_application()


application = ProtocolTypeRouter(
    {
        "http": django_asgi_application,

        "websocket": JWTAuthMiddleware(
            URLRouter(websocket_urlpatterns)
        ),
    }
)