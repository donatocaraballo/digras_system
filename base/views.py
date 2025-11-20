from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated

from .models import (
    Usuario, RegistroAccion, Categoria, Marca, Producto,
    Lote, Existencia, Cliente, Orden, DetalleOrden,
    Proveedor, Compra, DetalleCompra, Envio, Unidad
)

from .serializers import (
    UsuarioSerializer, RegistroAccionSerializer, CategoriaSerializer,
    MarcaSerializer, ProductoSerializer, LoteSerializer, ExistenciaSerializer,
    ClienteSerializer, OrdenSerializer, DetalleOrdenSerializer,
    ProveedorSerializer, CompraSerializer, DetalleCompraSerializer,
    EnvioSerializer, UnidadSerializer
)

# ------------------------------------------------------------
# BASE CLASS FOR COMMON FEATURES
# ------------------------------------------------------------

class BaseViewSet(viewsets.ModelViewSet):
    """
    Base para todos los ViewSets.
    Incluye filtros, búsquedas y permisos por defecto.
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]


# ------------------------------------------------------------
# VIEWSETS
# ------------------------------------------------------------

class UsuarioViewSet(BaseViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    search_fields = ['user', 'nombre', 'apellido', 'tipo']
    ordering_fields = ['id_usuario', 'user']


class RegistroAccionViewSet(BaseViewSet):
    queryset = RegistroAccion.objects.all()
    serializer_class = RegistroAccionSerializer
    search_fields = ['modulo', 'accion']
    ordering_fields = ['fecha_y_hora']


class CategoriaViewSet(BaseViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    search_fields = ['nombre']
    ordering_fields = ['nombre']


class MarcaViewSet(BaseViewSet):
    queryset = Marca.objects.all()
    serializer_class = MarcaSerializer
    search_fields = ['nombre']


class ProductoViewSet(BaseViewSet):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer
    search_fields = ['nombre', 'sku']
    ordering_fields = ['precio_venta', 'fecha_creacion']


class LoteViewSet(BaseViewSet):
    queryset = Lote.objects.all()
    serializer_class = LoteSerializer
    search_fields = ['numero_lote']
    ordering_fields = ['fecha_pedido', 'fecha_vencimiento']


class ExistenciaViewSet(BaseViewSet):
    queryset = Existencia.objects.all()
    serializer_class = ExistenciaSerializer
    search_fields = ['producto__nombre']
    ordering_fields = ['cantidad']


class ClienteViewSet(BaseViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    search_fields = ['nombre', 'correo', 'telefono']


class OrdenViewSet(BaseViewSet):
    queryset = Orden.objects.all()
    serializer_class = OrdenSerializer
    search_fields = ['cliente__nombre']
    ordering_fields = ['fecha_orden', 'estado_de_envio']


class DetalleOrdenViewSet(BaseViewSet):
    queryset = DetalleOrden.objects.all()
    serializer_class = DetalleOrdenSerializer
    search_fields = ['orden__id_orden', 'producto__nombre']


class ProveedorViewSet(BaseViewSet):
    queryset = Proveedor.objects.all()
    serializer_class = ProveedorSerializer
    search_fields = ['nombre']


class CompraViewSet(BaseViewSet):
    queryset = Compra.objects.all()
    serializer_class = CompraSerializer
    search_fields = ['proveedor__nombre']
    ordering_fields = ['fecha_pedido', 'estado_de_envio']


class DetalleCompraViewSet(BaseViewSet):
    queryset = DetalleCompra.objects.all()
    serializer_class = DetalleCompraSerializer
    search_fields = ['compra__id_compra', 'producto__nombre']


class EnvioViewSet(BaseViewSet):
    queryset = Envio.objects.all()
    serializer_class = EnvioSerializer
    search_fields = ['codigo_envio']
    ordering_fields = ['fecha_salida', 'fecha_llegada']


class UnidadViewSet(BaseViewSet):
    queryset = Unidad.objects.all()
    serializer_class = UnidadSerializer
    search_fields = ['codigo_unidad', 'placa']
    ordering_fields = ['estado']
