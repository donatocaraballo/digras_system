from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    UsuarioViewSet, RegistroAccionViewSet, CategoriaViewSet, MarcaViewSet,
    ProductoViewSet, ExistenciaViewSet, LoteViewSet, ClienteViewSet,
    UnidadViewSet, EnvioViewSet, OrdenViewSet, DetalleOrdenViewSet,
    ProveedorViewSet, CompraViewSet, DetalleCompraViewSet
)

router = DefaultRouter()

router.register('usuarios', UsuarioViewSet)
router.register('registros', RegistroAccionViewSet)
router.register('categorias', CategoriaViewSet)
router.register('marcas', MarcaViewSet)
router.register('productos', ProductoViewSet)
router.register('existencias', ExistenciaViewSet)
router.register('lotes', LoteViewSet)
router.register('clientes', ClienteViewSet)
router.register('unidades', UnidadViewSet)
router.register('envios', EnvioViewSet)
router.register('ordenes', OrdenViewSet)
router.register('detalle-ordenes', DetalleOrdenViewSet)
router.register('proveedores', ProveedorViewSet)
router.register('compras', CompraViewSet)
router.register('detalle-compras', DetalleCompraViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
]
