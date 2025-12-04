from rest_framework import serializers
from .models import (
    Usuario, RegistroAccion, Cliente, Unidad, Envio,
    Orden, DetalleOrden
)

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = '__all__'
        extra_kwargs = {
            "password": {"write_only": True}
        }

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = Usuario(**validated_data)
        user.set_password(password)
        user.save()
        return user

class RegistroAccionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegistroAccion
        fields = '__all__'


class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = [
            "id_cliente",
            "nombre",
            "direccion",
            "correo",
            "telefono",
            "id_usuario",
        ]
        read_only_fields = ["id_cliente", "id_usuario"]


class UnidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unidad
        fields = '__all__'


class EnvioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Envio
        fields = '__all__'


# =======================
#   ÓRDENES DE VENTA
# =======================
class OrdenSerializer(serializers.ModelSerializer):
    # Campos de conveniencia para mostrar nombres en el front
    id_cliente_nombre = serializers.ReadOnlyField(source="id_cliente.nombre")
    id_usuario_username = serializers.ReadOnlyField(source="id_usuario.username")

    class Meta:
        model = Orden
        fields = "__all__"
        read_only_fields = ("id_orden", "fecha_orden")


class DetalleOrdenSerializer(serializers.ModelSerializer):
    # Nombre del producto (lo que necesita GerenteAprobaciones)
    id_producto_nombre = serializers.ReadOnlyField(source="id_producto.nombre")

    class Meta:
        model = DetalleOrden
        fields = [
            "id_detalleo",
            "id_orden",
            "id_producto",
            "id_producto_nombre",
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

