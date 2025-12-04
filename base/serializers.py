from rest_framework import serializers
from .models import (
    Usuario, RegistroAccion, Categoria, Marca, Producto,
    Existencia, Lote, Cliente, Unidad, Envio,
    Orden, DetalleOrden, Proveedor, Compra, DetalleCompra
)

# =======================
#   USUARIO
# =======================
class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = "__all__"
        extra_kwargs = {
            "password": {"write_only": True}
        }

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = Usuario(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user


# =======================
#   REGISTRO ACCIÓN
# =======================
class RegistroAccionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegistroAccion
        fields = "__all__"


# =======================
#   CATÁLOGO PRODUCTO
# =======================
class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = "__all__"


class MarcaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Marca
        fields = "__all__"


class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = "__all__"


class ExistenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Existencia
        fields = "__all__"


class LoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lote
        fields = "__all__"


# =======================
#   CLIENTE
# =======================
class ClienteSerializer(serializers.ModelSerializer):
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


# =======================
#   LOGÍSTICA (UNIDAD / ENVÍO)
# =======================
class UnidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unidad
        fields = "__all__"


class EnvioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Envio
        fields = "__all__"


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


# =======================
#   PROVEEDORES / COMPRAS
# =======================
class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = "__all__"


class CompraSerializer(serializers.ModelSerializer):
    # Nombre del proveedor para usar en el front
    id_proveedor_nombre = serializers.ReadOnlyField(source="id_proveedor.nombre")
    id_usuario_username = serializers.ReadOnlyField(source="id_usuario.username", default=None)

    class Meta:
        model = Compra
        fields = "__all__"


class DetalleCompraSerializer(serializers.ModelSerializer):
    # Nombre del producto en el detalle de compras
    id_producto_nombre = serializers.ReadOnlyField(source="id_producto.nombre")

    class Meta:
        model = DetalleCompra
        fields = "__all__"