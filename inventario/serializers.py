from rest_framework import serializers
from .models import Categoria, Marca, Producto, Existencia, Lote

# --- Serializadores de Tablas Maestras ---

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'

class MarcaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Marca
        fields = '__all__'

# --- Serializador de Existencia (Consulta de Stock) ---
class ExistenciaSerializer(serializers.ModelSerializer):
    # Campos adicionales para la vista de consulta
    id_producto_nombre = serializers.ReadOnlyField(source='id_producto.nombre')
    id_producto_sku = serializers.ReadOnlyField(source='id_producto.sku')
    
    class Meta:
        model = Existencia
        fields = '__all__' # Nota: __all__ incluye los campos ReadOnlyField si no se definen explícitamente

# --- Serializador de Producto (incluye la Existencia para la vista principal) ---
class ProductoSerializer(serializers.ModelSerializer):
    id_marca_nombre = serializers.ReadOnlyField(source='id_marca.nombre')
    id_categoria_nombre = serializers.ReadOnlyField(source='id_categoria.nombre')
    
    # Campo para obtener la existencia total del producto (lectura)
    existencia_total = serializers.SerializerMethodField()

    def get_existencia_total(self, obj):
        try:
            return obj.existencia.cantidad 
        except Existencia.DoesNotExist:
            return 0
            
    class Meta:
        model = Producto
        # Incluye todos los campos de Producto, más los campos calculados para el frontend
        fields = (
            'id_producto', 'nombre', 'descripcion', 'fecha_creacion', 'id_marca', 
            'id_categoria', 'sku', 'precio_venta', 'peso_unidad', 
            'id_marca_nombre', 'id_categoria_nombre', 'existencia_total'
        )

# --- Serializador de Lote ---
class LoteSerializer(serializers.ModelSerializer):
    id_producto_nombre = serializers.ReadOnlyField(source='id_producto.nombre')
    
    class Meta:
        model = Lote
        fields = '__all__'