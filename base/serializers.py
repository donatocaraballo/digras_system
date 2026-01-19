# base/serializers.py

from decimal import Decimal
from django.db.models import Sum
from django.db.utils import ProgrammingError, OperationalError
from rest_framework import serializers
from .models import (
    Usuario,
    RegistroAccion,
    Cliente,
    Unidad,
    Envio,
    Orden,
    DetalleOrden,
    PagoVenta,
)

ESTADO_CREACION_ENVIO = "PENDIENTE POR APROBACION"


# ============================================================
#   USUARIO
# ============================================================

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = "__all__"
        extra_kwargs = {
            "password": {"write_only": True},
        }

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = Usuario(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_password(Usuario.objects.make_random_password())
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance


class RegistroAccionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegistroAccion
        fields = "__all__"


class ClienteSerializer(serializers.ModelSerializer):
    total_ordenes = serializers.IntegerField(read_only=True)
    ordenes_activas = serializers.IntegerField(read_only=True)

    class Meta:
        model = Cliente
        fields = [
            "id_cliente",
            "nombre",
            "direccion",
            "correo",
            "telefono",
            "activo",
            "id_usuario",
            "total_ordenes",
            "ordenes_activas",
        ]
        read_only_fields = [
            "id_cliente",
            "id_usuario",
            "total_ordenes",
            "ordenes_activas",
        ]


class UnidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unidad
        fields = [
            "id_unidad",
            "capacidad_carga",
            "codigo_unidad",
            "telefono",
            "estado",
            "placa",
            "id_usuario",
        ]
        read_only_fields = ["id_unidad"]


class EnvioSerializer(serializers.ModelSerializer):
    codigo_envio = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=60,
    )
    fecha_salida = serializers.DateTimeField(
        required=False,
        allow_null=True,
    )
    ordenes_detalle = serializers.SerializerMethodField()

    class Meta:
        model = Envio
        fields = [
            "id_envio",
            "codigo_envio",
            "id_unidad",
            "estado",
            "fecha_salida",
            "fecha_llegada",
            "peso_total",
            "ordenes_detalle",
        ]
        read_only_fields = ["id_envio", "peso_total", "ordenes_detalle"]

    def _generar_codigo_envio(self) -> str:
        last_envio = Envio.objects.order_by("-id_envio").first()
        next_id = (last_envio.id_envio if last_envio else 0) + 1
        return f"ENV-{next_id:05d}"

    def create(self, validated_data):
        from django.utils import timezone

        if not validated_data.get("codigo_envio"):
            validated_data["codigo_envio"] = self._generar_codigo_envio()

        if not validated_data.get("estado"):
            validated_data["estado"] = ESTADO_CREACION_ENVIO

        if not validated_data.get("fecha_salida"):
            validated_data["fecha_salida"] = timezone.now()

        if "peso_total" not in validated_data or validated_data["peso_total"] is None:
            validated_data["peso_total"] = 0

        return super().create(validated_data)

    def get_ordenes_detalle(self, obj):
        qs = Orden.objects.filter(id_envio=obj).select_related("id_cliente")
        resultado = []
        for o in qs:
            cliente_nombre = getattr(o.id_cliente, "nombre", None)
            resultado.append(
                {
                    "id_orden": o.id_orden,
                    "id_cliente": o.id_cliente_id,
                    "cliente_nombre": cliente_nombre,
                    "estado_de_envio": o.estado_de_envio,
                    "peso_total": o.peso_total,
                    "precio_final": o.precio_final,
                }
            )
        return resultado


# ============================================================
#   ÓRDENES
# ============================================================

class OrdenSerializer(serializers.ModelSerializer):
    """
    Serializador base para Orden.
    Incluye:
    - id_usuario_username: username del usuario que creó la orden
    - id_cliente_nombre: nombre del cliente
    - vendedor_detalle: datos completos del vendedor (UsuarioSerializer)
    - total_pagado / saldo_pendiente calculados a partir de PagoVenta
    """

    id_usuario_username = serializers.CharField(
        source="id_usuario.username",
        read_only=True
    )
    id_cliente_nombre = serializers.CharField(
        source="id_cliente.nombre",
        read_only=True
    )

    vendedor_detalle = UsuarioSerializer(
        source="id_usuario",
        read_only=True
    )

    # Dejamos claro que estos campos vienen del modelo, pero los marcamos solo lectura
    peso_total = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True,
        coerce_to_string=False,
    )
    precio_final = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True,
        coerce_to_string=False,
    )

    total_pagado = serializers.SerializerMethodField()
    saldo_pendiente = serializers.SerializerMethodField()

    class Meta:
        model = Orden
        fields = "__all__"
        read_only_fields = ("id_orden", "fecha_orden")

    def get_total_pagado(self, obj):
        """
        Suma todos los pagos asociados a la orden.
        Si la tabla aún no existe (migración pendiente) o hay un error de BD,
        devolvemos 0 para no romper el serializer.
        """
        try:
            total = obj.pagos_venta.aggregate(total=Sum("monto_usd"))["total"] or 0
            return total
        except (OperationalError, ProgrammingError):
            # Tabla de PagoVenta no creada, o error de esquema.
            return 0

    def get_saldo_pendiente(self, obj):
        total_pagado = self.get_total_pagado(obj)
        precio = obj.precio_final or 0
        try:
            return precio - total_pagado
        except TypeError:
            # En caso rarísimo de mezclar tipos incompatibles, devolvemos solo el precio
            return precio


# ============================================================
#   DETALLE DE ÓRDENES
# ============================================================

class DetalleOrdenSerializer(serializers.ModelSerializer):
    id_producto_nombre = serializers.CharField(
        source="id_producto.nombre", read_only=True
    )
    producto = serializers.CharField(
        source="id_producto.nombre", read_only=True
    )

    class Meta:
        model = DetalleOrden
        fields = [
            "id_detalleo",
            "id_orden",
            "id_producto",
            "id_producto_nombre",
            "producto",
            "cantidad",
            "precio_unitario",
            "subtotal",
            "peso_unitario",
            "peso_subtotal",
            "devolucion",
            "cantidad_devolvida",
            "nota",
        ]
        read_only_fields = (
            "id_detalleo",
            "subtotal",
            "peso_subtotal",
            "id_producto_nombre",
            "producto",
        )


# ============================================================
#   PAGO VENTA
# ============================================================

class PagoVentaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PagoVenta
        fields = "__all__"
        read_only_fields = (
            "id_pagoventa",
            "fecha_pago",
            "monto_usd",
            "id_usuario",
        )