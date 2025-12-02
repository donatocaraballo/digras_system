from rest_framework import viewsets, filters, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import F
from .utils import registrar_accion 
from base.viewsets import BaseViewSet
from rest_framework.exceptions import PermissionDenied
from rest_framework import viewsets, permissions

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
# VIEWSETS
# ------------------------------------------------------------

class UsuarioViewSet(BaseViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    search_fields = ['username', 'first_name', 'last_name', 'tipo']
    ordering_fields = ['id_usuario', 'username']


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
    search_fields = ['id_producto__nombre']
    ordering_fields = ['cantidad']

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        usuario = self.request.user

        # (Opcional) Solo permitir que VENDEDORES creen clientes:
        if usuario.tipo not in ["VENDEDOR", "GERENTE", "ADMINISTRADOR"]:
            raise PermissionDenied("Solo vendedores o gerentes pueden crear clientes.")

        cliente = serializer.save(id_usuario=usuario)

        # Registrar acción (si estás usando el log)
        registrar_accion(
            usuario,
            "Clientes",
            "Crear cliente",
            f"Creación del cliente {cliente.nombre}",
            id_referencia=cliente.id_cliente,
        )

class DetalleOrdenViewSet(BaseViewSet):
    queryset = DetalleOrden.objects.all()
    serializer_class = DetalleOrdenSerializer
    search_fields = ['id_orden__id_orden', 'id_producto__nombre']


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

