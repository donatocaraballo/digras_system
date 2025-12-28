# base/serializers.py
from rest_framework import serializers
from .models import (
    Usuario,
    RegistroAccion,
    Cliente,
    Unidad,
    Envio,
    Orden,
    DetalleOrden,
)

ESTADO_CREACION_ENVIO = "PENDIENTE POR APROBACION"


# ============================================================
#   USUARIO
# ============================================================

class UsuarioSerializer(serializers.ModelSerializer):
    """
    Serializador del modelo Usuario (subclase de AbstractUser).

    - La contraseña se marca como write_only.
    - En create/update se usa set_password para que quede hasheada.
    """

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


# ============================================================
#   REGISTRO DE ACCIONES
# ============================================================

class RegistroAccionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegistroAccion
        fields = "__all__"


# ============================================================
#   CLIENTE
# ============================================================

class ClienteSerializer(serializers.ModelSerializer):
    """
    Cliente asociado a un vendedor (id_usuario).

    - id_usuario se maneja en el backend según el usuario autenticado.
    """

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
        ]
        read_only_fields = ["id_cliente", "id_usuario"]


# ============================================================
#   UNIDAD (VEHÍCULO)
# ============================================================

class UnidadSerializer(serializers.ModelSerializer):
    """
    Unidad de transporte.

    - id_unidad es solo lectura.
    - id_usuario se escribe como PK (transportista asignado).
    """

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


# ============================================================
#   ENVÍO
# ============================================================

class EnvioSerializer(serializers.ModelSerializer):
    """
    Serializador de Envío.

    - id_envio es solo lectura.
    - codigo_envio se genera automáticamente si no viene.
    - fecha_salida se pone por defecto a "ahora" si no viene.
    - estado se inicializa a "PENDIENTE POR APROBACION" si no viene.
    - peso_total se deja en 0 al crear y luego se recalcula cuando se asignan órdenes.
    - ordenes_detalle muestra un resumen de las órdenes asignadas al envío.
    """

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
        """
        Genera un código de envío sencillo del tipo ENV-00001, ENV-00002, etc.
        """
        last_envio = Envio.objects.order_by("-id_envio").first()
        next_id = (last_envio.id_envio if last_envio else 0) + 1
        return f"ENV-{next_id:05d}"

    def create(self, validated_data):
        # Código automático si no viene
        if not validated_data.get("codigo_envio"):
            validated_data["codigo_envio"] = self._generar_codigo_envio()

        # Estado por defecto
        if not validated_data.get("estado"):
            validated_data["estado"] = ESTADO_CREACION_ENVIO

        # Fecha de salida por defecto: ahora mismo si no viene
        from django.utils import timezone
        if not validated_data.get("fecha_salida"):
            validated_data["fecha_salida"] = timezone.now()

        # Peso total por defecto: 0 (luego se recalcula cuando se asignan órdenes)
        if "peso_total" not in validated_data or validated_data["peso_total"] is None:
            validated_data["peso_total"] = 0

        return super().create(validated_data)

    def get_ordenes_detalle(self, obj):
        """
        Devuelve un listado de órdenes asociadas al envío con:
        - id_orden
        - cliente_nombre
        - estado_de_envio
        """
        qs = Orden.objects.filter(id_envio=obj).select_related("id_cliente")
        resultado = []
        for o in qs:
            cliente_nombre = getattr(o.id_cliente, "nombre", None)
            resultado.append(
                {
                    "id_orden": o.id_orden,
                    "cliente_nombre": cliente_nombre,
                    "estado_de_envio": o.estado_de_envio,
                }
            )
        return resultado


# ============================================================
#   ÓRDENES
# ============================================================

class OrdenSerializer(serializers.ModelSerializer):
    """
    Serializador base para Orden.
    """

    class Meta:
        model = Orden
        fields = "__all__"
        read_only_fields = ("id_orden", "fecha_orden")


# ============================================================
#   DETALLE DE ÓRDENES
# ============================================================

class DetalleOrdenSerializer(serializers.ModelSerializer):
    """
    Detalle de una orden. Usado para consultas puntuales desde base.
    """

    class Meta:
        model = DetalleOrden
        fields = [
            "id_detalleo",
            "id_orden",
            "id_producto",
            "cantidad",
            "precio_unitario",
            "subtotal",
            "peso_unitario",
            "peso_subtotal",
            "devolucion",
            "cantidad_devolvida",
            "nota",
        ]
        read_only_fields = ("id_detalleo", "subtotal", "peso_subtotal")