from django.urls import path, include
from rest_framework import routers
from . import views

router = routers.DefaultRouter()
router.register(r'categorias', views.CategoriaViewSet)
router.register(r'marcas', views.MarcaViewSet)
router.register(r'productos', views.ProductoViewSet)
router.register(r'clientes', views.ClienteViewSet)
router.register(r'proveedores', views.ProveedorViewSet)
router.register(r'compras', views.CompraViewSet)
router.register(r'detallecompras', views.DetalleCompraViewSet)
router.register(r'ordenes', views.OrdenViewSet)
router.register(r'detalleordenes', views.DetalleOrdenViewSet)
router.register(r'unidades', views.UnidadViewSet)
router.register(r'envios', views.EnvioViewSet)
router.register(r'lotes', views.LoteViewSet)
router.register(r'existencias', views.ExistenciaViewSet)
router.register(r'usuarios', views.UsuarioViewSet)
router.register(r'registroacciones', views.RegistroAccionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
