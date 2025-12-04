from django.db import transaction
from django.db.models import F
from rest_framework import viewsets, filters, status, permissions
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError

from .utils import registrar_accion
from base.viewsets import BaseViewSet

from .models import (
    Usuario, RegistroAccion, Categoria, Marca, Producto,
    Lote, Existencia, Cliente, Orden, DetalleOrden,
    Proveedor, Compra, DetalleCompra, Envio, Unidad,
)

from .serializers import (
    UsuarioSerializer, RegistroAccionSerializer, CategoriaSerializer,
    MarcaSerializer, ProductoSerializer, LoteSerializer, ExistenciaSerializer,
    ClienteSerializer, OrdenSerializer, DetalleOrdenSerializer,
    ProveedorSerializer, CompraSerializer, DetalleCompraSerializer,
    EnvioSerializer, UnidadSerializer,
)

# ============================================================
#   USUARIOS
# ============================================================

class UsuarioViewSet(BaseViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    search_fields = ["username", "first_name", "last_name", "tipo"]
    ordering_fields = ["id_usuario", "username"]


# ============================================================
#   REGISTRO DE ACCIONES
# ============================================================

class RegistroAccionViewSet(BaseViewSet):
    queryset = RegistroAccion.objects.all()
    serializer_class = RegistroAccionSerializer
    search_fields = ["modulo", "accion"]
    ordering_fields = ["fecha_y_hora"]


# ============================================================
#   CATÁLOGOS BÁSICOS: CATEGORÍA / MARCA / PRODUCTO
# ============================================================

class CategoriaViewSet(BaseViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    search_fields = ["nombre"]
    ordering_fields = ["nombre"]


class MarcaViewSet(BaseViewSet):
    queryset = Marca.objects.all()
    serializer_class = MarcaSerializer
    search_fields = ["nombre"]


class ProductoViewSet(BaseViewSet):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer
    search_fields = ["nombre", "sku"]
    ordering_fields = ["precio_venta", "fecha_creacion"]


# ============================================================
#   INVENTARIO: LOTES / EXISTENCIAS
# ============================================================

class LoteViewSet(BaseViewSet):
    queryset = Lote.objects.all()
    serializer_class = LoteSerializer
    search_fields = ["numero_lote"]
    ordering_fields = ["fecha_pedido", "fecha_vencimiento"]


class ExistenciaViewSet(BaseViewSet):
    queryset = Existencia.objects.all()
    serializer_class = ExistenciaSerializer
    search_fields = ["id_producto__nombre"]
    ordering_fields = ["cantidad"]


# ============================================================
#   CLIENTES (LÓGICA ESPECIAL)
# ============================================================

class ClienteViewSet(BaseViewSet):
    """
    Gestión de clientes.

    Reglas de negocio:
    - Listar:
        * VENDEDOR: solo ve sus propios clientes.
        * Otros roles: no ven clientes.
    - Crear:
        * Solo VENDEDOR.
        * Se asocia automáticamente id_usuario = request.user.
        * Cliente activo por defecto (activo=True).
    - Editar (PUT / PATCH):
        * Solo VENDEDOR y además debe ser el vendedor asociado al cliente.
    - Activar / Desactivar:
        * Se hace cambiando el campo 'activo' vía PATCH.
        * Solo VENDEDOR asociado.
        * Desactivar solo si TODAS las órdenes están cerradas:
          ENTREGADA / CANCELADA / DEVUELTA (y sin órdenes abiertas).
    - Eliminar:
        * Solo VENDEDOR asociado.
        * Solo si NO tiene órdenes asociadas.
    - Registro de acciones:
        * Crear cliente
        * Editar cliente
        * Activar cliente
        * Desactivar cliente
        * Eliminar cliente
    """

    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ["nombre", "correo", "telefono"]
    ordering_fields = ["nombre", "id_cliente"]

    # ---------------------------
    #   Helpers internos
    # ---------------------------
    def _asegurar_vendedor_propietario(self, cliente: Cliente):
        """
        Verifica que:
        - el usuario autenticado sea VENDEDOR
        - y que sea el vendedor asociado al cliente.
        """
        usuario = self.request.user

        # 1. Solo vendedores
        if getattr(usuario, "tipo", None) != "VENDEDOR":
            raise PermissionDenied("Solo los vendedores pueden gestionar clientes.")

        # 2. Solo el vendedor asociado
        if cliente.id_usuario_id != usuario.pk:
            raise PermissionDenied(
                "Solo el vendedor asociado a este cliente puede gestionarlo."
            )

    def _todas_ordenes_cerradas(self, cliente: Cliente) -> bool:
        """
        Devuelve True si TODAS las órdenes del cliente están en estado
        'cerrado' para poder desactivar al cliente.

        Consideramos cerradas:
        - ENTREGADA
        - CANCELADA
        - DEVUELTA

        Y además no debe haber órdenes con cancelacion=False
        en estados intermedios.
        """
        estados_cerrados = [
            "ENTREGADA",
            "CANCELADA",
            "DEVUELTA",
        ]

        qs = Orden.objects.filter(id_cliente=cliente)

        # Órdenes que aún NO están cerradas:
        abiertas = qs.exclude(estado_de_envio__in=estados_cerrados).exclude(
            cancelacion=True
        )

        return not abiertas.exists()

    # ---------------------------
    #   Queryset según rol
    # ---------------------------
    def get_queryset(self):
        usuario = self.request.user

        if not usuario.is_authenticated:
            return Cliente.objects.none()

        # VENDEDOR: solo sus clientes (activos e inactivos, para poder reactivar)
        if getattr(usuario, "tipo", None) == "VENDEDOR":
            return Cliente.objects.filter(id_usuario=usuario)

        # Otros roles (GERENTE, ADMIN, ALMACENISTA, TRANSPORTISTA) no ven clientes
        return Cliente.objects.none()

    # ---------------------------
    #   Crear cliente (POST)
    # ---------------------------
    def perform_create(self, serializer):
        usuario = self.request.user

        # Solo vendedores pueden crear clientes
        if getattr(usuario, "tipo", None) != "VENDEDOR":
            raise PermissionDenied("Solo los vendedores pueden crear clientes.")

        # Cliente activo por defecto y asociado al vendedor autenticado
        cliente = serializer.save(
            id_usuario=usuario,
            activo=True,
        )

        # Registro de acción: CREAR
        registrar_accion(
            usuario,
            "Clientes",
            "Crear cliente",
            f"Creación del cliente {cliente.nombre}",
            id_referencia=cliente.id_cliente,
        )

    # ---------------------------
    #   Actualizar (PUT / PATCH)
    # ---------------------------
    def perform_update(self, serializer):
        """
        Centraliza la lógica de:
        - Edición de datos del cliente.
        - Activación / Desactivación (cambio de 'activo').

        Aquí se registra SOLO UNA VEZ la acción correspondiente
        (Editar / Activar / Desactivar cliente).
        """
        usuario = self.request.user
        cliente: Cliente = serializer.instance

        # Solo el vendedor propietario puede editar/activar/desactivar
        self._asegurar_vendedor_propietario(cliente)

        old_activo = getattr(cliente, "activo", True)
        new_activo = serializer.validated_data.get("activo", old_activo)

        # Si va a DESACTIVAR (True -> False), validamos las órdenes
        if old_activo and not new_activo:
            if not self._todas_ordenes_cerradas(cliente):
                raise ValidationError({
                    "detail": (
                        "No puedes desactivar este cliente porque tiene órdenes aún en proceso. "
                        "Solo se permite desactivar cuando todas las órdenes estén entregadas, canceladas o devueltas."
                    )
                })

        # Guardamos cambios
        cliente_actualizado = serializer.save()

        # Detectar tipo de acción para el log
        if old_activo and not new_activo:
            accion = "Desactivar cliente"
        elif not old_activo and new_activo:
            accion = "Activar cliente"
        else:
            accion = "Editar cliente"

        registrar_accion(
            usuario,
            "Clientes",
            accion,
            f"{accion} {cliente_actualizado.nombre}",
            id_referencia=cliente_actualizado.id_cliente,
        )

    def update(self, request, *args, **kwargs):
        """
        PUT /clientes/<id>/

        - Verifica que sea el vendedor propietario.
        - Impide cambiar el vendedor asociado desde el front.
        - Llama a perform_update (donde se registra la acción).
        """
        cliente = self.get_object()
        self._asegurar_vendedor_propietario(cliente)

        data = request.data.copy()
        # Evitamos que el front cambie el vendedor asociado
        data.pop("id_usuario", None)

        serializer = self.get_serializer(cliente, data=data, partial=False)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data, status=status.HTTP_200_OK)

    def partial_update(self, request, *args, **kwargs):
        """
        PATCH /clientes/<id>/

        Usado para:
        - Ediciones parciales de datos.
        - Cambios de 'activo' (activar / desactivar).
        """
        cliente = self.get_object()
        self._asegurar_vendedor_propietario(cliente)

        data = request.data.copy()
        data.pop("id_usuario", None)

        serializer = self.get_serializer(cliente, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data, status=status.HTTP_200_OK)

    # ---------------------------
    #   Eliminar cliente (DELETE)
    # ---------------------------
    def destroy(self, request, *args, **kwargs):
        usuario = request.user
        cliente = self.get_object()

        # Solo vendedor asociado puede eliminar
        self._asegurar_vendedor_propietario(cliente)

        # Verificar si tiene órdenes asociadas
        if Orden.objects.filter(id_cliente=cliente).exists():
            raise ValidationError(
                "No puedes eliminar este cliente porque tiene órdenes asociadas. "
                "En su lugar, debes desactivarlo."
            )

        nombre = cliente.nombre
        id_cli = cliente.id_cliente

        response = super().destroy(request, *args, **kwargs)

        # Registro de acción: ELIMINAR
        registrar_accion(
            usuario,
            "Clientes",
            "Eliminar cliente",
            f"Cliente eliminado: {nombre}",
            id_referencia=id_cli,
        )

        return response


# ============================================================
#   DETALLE ÓRDENES
# ============================================================

class DetalleOrdenViewSet(BaseViewSet):
    queryset = DetalleOrden.objects.all()
    serializer_class = DetalleOrdenSerializer
    search_fields = ["id_orden__id_orden", "id_producto__nombre"]


# ============================================================
#   PROVEEDORES / COMPRAS
# ============================================================

class ProveedorViewSet(BaseViewSet):
    queryset = Proveedor.objects.all()
    serializer_class = ProveedorSerializer
    search_fields = ["nombre"]


class CompraViewSet(BaseViewSet):
    queryset = Compra.objects.all()
    serializer_class = CompraSerializer
    search_fields = ["id_proveedor__nombre"]
    ordering_fields = ["fecha_pedido", "estado_de_envio"]


class DetalleCompraViewSet(BaseViewSet):
    queryset = DetalleCompra.objects.all()
    serializer_class = DetalleCompraSerializer
    search_fields = ["id_compra__id_compra", "id_producto__nombre"]


# ============================================================
#   ENVÍOS / UNIDADES
# ============================================================

class EnvioViewSet(BaseViewSet):
    queryset = Envio.objects.all()
    serializer_class = EnvioSerializer
    search_fields = ["codigo_envio"]
    ordering_fields = ["fecha_salida", "fecha_llegada"]


class UnidadViewSet(BaseViewSet):
    queryset = Unidad.objects.all()
    serializer_class = UnidadSerializer
    search_fields = ["codigo_unidad", "placa"]
    ordering_fields = ["estado"]