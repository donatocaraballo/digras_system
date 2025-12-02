from django.urls import path, include
from rest_framework import routers
from . import views

router = routers.DefaultRouter()
router.register(r'unidades', views.UnidadViewSet)
router.register(r'envios', views.EnvioViewSet)
router.register(r'usuarios', views.UsuarioViewSet)
router.register(r'registroacciones', views.RegistroAccionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
