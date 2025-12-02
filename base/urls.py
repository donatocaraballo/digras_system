# base/urls.py (CORREGIDO)
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token


from .views import (
    UsuarioViewSet, RegistroAccionViewSet, CategoriaViewSet, MarcaViewSet,
    ProductoViewSet, ExistenciaViewSet, LoteViewSet, ClienteViewSet,
    UnidadViewSet, EnvioViewSet, DetalleOrdenViewSet,
    ProveedorViewSet, CompraViewSet, DetalleCompraViewSet
)
from ordenes.views import OrdenViewSet 

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
#router.register('detalle-ordenes', DetalleOrdenViewSet) #revisar o borrar
router.register('proveedores', ProveedorViewSet)
router.register('compras', CompraViewSet)
router.register('detalle-compras', DetalleCompraViewSet)

# 👇 AQUÍ EL CAMBIO: sin 'api/' aquí
urlpatterns = [
    path("", include(router.urls)),
    path("api/", include(router.urls)),
    path("login/", obtain_auth_token),
]
# (también podría ser simplemente: urlpatterns = router.urls)