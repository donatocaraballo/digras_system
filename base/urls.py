# base/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token # <--- Token Auth Nativo
from .utils import obtener_tasa_dolar

from .views import (
    UsuarioViewSet, 
    RegistroAccionViewSet,
    UnidadViewSet, 
    EnvioViewSet,
    ClienteViewSet,
)
# Eliminamos OrdenViewSet de aquí porque ya tiene su propia app

router = DefaultRouter()
router.register('usuarios', UsuarioViewSet)
router.register('registros', RegistroAccionViewSet)
router.register('unidades', UnidadViewSet)
router.register('envios', EnvioViewSet) 
router.register('clientes', ClienteViewSet)

urlpatterns = [
    # Rutas del router (usuarios/, etc.)
    path('', include(router.urls)),
    
    # 🚨 RUTA DE LOGIN POR TOKEN 🚨
    # La URL final será: http://127.0.0.1:8000/api/base/login/
    path('login/', obtain_auth_token, name='api_token_auth'),
    path('tasa-dolar/', obtener_tasa_dolar, name='tasa_dolar'),
]