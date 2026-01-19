# ordenes/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter

# Este es el ViewSet que sigue manejando /api/ordenes/ y /api/ordenes/<id>/
from .views import OrdenViewSet

# 👇 Importamos SOLO para la acción pagos_venta el OrdenViewSet de base.views
from base.views import OrdenViewSet as OrdenPagosViewSet

router = DefaultRouter()
router.register(r'', OrdenViewSet, basename='orden')

# Vista específica para /api/ordenes/<pk>/pagos-venta/
pago_venta_view = OrdenPagosViewSet.as_view({
    'get': 'pagos_venta',
    'post': 'pagos_venta',
})

urlpatterns = [
    # 👇 Esta ruta atiende EXACTAMENTE /api/ordenes/<pk>/pagos-venta/
    path('<int:pk>/pagos-venta/', pago_venta_view, name='orden-pagos-venta'),

    # 👇 Y todo lo demás lo maneja el router de siempre
    path('', include(router.urls)),
]