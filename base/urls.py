# base/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token # <--- Token Auth Nativo
from .utils import obtener_tasa_dolar
from transporte.views import TransporteViewSet

from .views import (
    UsuarioViewSet, 
    RegistroAccionViewSet,
    UnidadViewSet, 
    EnvioViewSet,
    ClienteViewSet,
    CustomLogin
)
# Eliminamos OrdenViewSet de aquí porque ya tiene su propia app

router = DefaultRouter()
router.register('usuarios', UsuarioViewSet)
router.register('registros', RegistroAccionViewSet)
router.register('unidades', UnidadViewSet)
router.register('envios', EnvioViewSet)
router.register('clientes', ClienteViewSet)
router.register('transporte', TransporteViewSet, basename="transporte")

urlpatterns = [
    # Rutas del router (usuarios/, etc.)
    path('', include(router.urls)),
    
    # 🚨 RUTA DE LOGIN POR TOKEN 🚨
    # La URL final será: http://127.0.0.1:8000/api/base/login/
    path('login/', CustomLogin.as_view(), name='api_login'),
    path('tasa-dolar/', obtener_tasa_dolar, name='tasa_dolar'),
]