# ordenes/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrdenViewSet

router = DefaultRouter()

# 🚨 CORRECCIÓN CRÍTICA: 
# Usamos r'' (cadena vacía) en lugar de r'ordenes'.
# Esto le dice a Django: "Usa la ruta base que ya definimos en el proyecto principal".
router.register(r'', OrdenViewSet, basename='orden')

urlpatterns = [
    path('', include(router.urls)),
]