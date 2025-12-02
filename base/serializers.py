from rest_framework import serializers
from .models import (
    Usuario, RegistroAccion, Categoria, Marca, Producto,
    Existencia, Lote, Cliente, Unidad, Envio,
    Orden, DetalleOrden, Proveedor, Compra, DetalleCompra
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


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'


class MarcaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Marca
        fields = '__all__'


class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = '__all__'


class ExistenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Existencia
        fields = '__all__'


class LoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lote
        fields = '__all__'


class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = '__all__'


class UnidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unidad
        fields = '__all__'


class EnvioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Envio
        fields = '__all__'


from rest_framework import serializers
from .models import (
    Usuario, RegistroAccion, Categoria, Marca, Producto,
    Existencia, Lote, Cliente, Unidad, Envio,
    Orden, DetalleOrden, Proveedor, Compra, DetalleCompra
)

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = '__all__'


class RegistroAccionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegistroAccion
        fields = '__all__'


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'


class MarcaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Marca
        fields = '__all__'


class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = '__all__'


class ExistenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Existencia
        fields = '__all__'


class LoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lote
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


class OrdenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Orden
        fields = '__all__'
        read_only_fields = ('id_orden', 'fecha_orden')


class DetalleOrdenSerializer(serializers.ModelSerializer):
    # id_producto se envía como PK (id del producto)
    class Meta:
        model = DetalleOrden
        fields = [
            'id_detalleo', 'id_producto', 'cantidad',
            'precio_unitario', 'subtotal',
            'peso_unitario', 'peso_subtotal',
            'devolucion', 'cantidad_devolvida', 'nota'
        ]
        read_only_fields = ('id_detalleo', 'subtotal', 'peso_subtotal')


class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = '__all__'


class CompraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Compra
        fields = '__all__'


class DetalleCompraSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetalleCompra
        fields = '__all__'


class DetalleOrdenSerializer(serializers.ModelSerializer):
    # id_producto se envía como PK (id del producto)
    class Meta:
        model = DetalleOrden
        fields = [
            'id_detalleo', 'id_producto', 'cantidad',
            'precio_unitario', 'subtotal',
            'peso_unitario', 'peso_subtotal',
            'devolucion', 'cantidad_devolvida', 'nota'
        ]
        read_only_fields = ('id_detalleo', 'subtotal', 'peso_subtotal')


class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = '__all__'


class CompraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Compra
        fields = '__all__'


class DetalleCompraSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetalleCompra
        fields = '__all__'

