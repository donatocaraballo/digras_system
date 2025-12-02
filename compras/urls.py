from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProveedorViewSet, CompraViewSet, DetalleCompraViewSet

router = DefaultRouter()
router.register(r'proveedores', ProveedorViewSet)
router.register(r'compras', CompraViewSet)
router.register(r'detalle-compras', DetalleCompraViewSet)

urlpatterns = [
    path('', include(router.urls)),
]