from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrdenViewSet, DetalleOrdenViewSet

router = DefaultRouter()
router.register(r'ordenes', OrdenViewSet, basename='orden')
router.register(r'detalle-ordenes', DetalleOrdenViewSet, basename='detalle-orden')

urlpatterns = [
    path('api/', include(router.urls)),
]