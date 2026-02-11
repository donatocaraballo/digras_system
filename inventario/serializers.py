from rest_framework import serializers
from django.db.models import Sum
from django.utils import timezone  # <--- Importante para comparar fechas
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
    
    # 👇 CAMBIO CRÍTICO: Sobreescribimos 'cantidad' para que sea calculado
    # En lugar de leer el número fijo de la tabla, sumamos solo lotes VIGENTES.
    cantidad = serializers.SerializerMethodField()

    class Meta:
        model = Existencia
        fields = '__all__' 

    def get_cantidad(self, obj):
        """
        Calcula el stock 'vendible'.
        Suma lotes que:
        1. Tienen cantidad > 0
        2. Están marcados como ACTIVO
        3. NO están vencidos (Fecha vencimiento >= Hoy)
        """
        hoy = timezone.now().date()
        
        total_vigente = Lote.objects.filter(
            id_producto=obj.id_producto,
            cantidad__gt=0,
            estado='ACTIVO',
            fecha_vencimiento__gte=hoy  # <--- EL FILTRO DE SANIDAD
        ).aggregate(total=Sum('cantidad'))['total']

        # Si no hay lotes vigentes, retornamos 0 (aunque físicamente existan vencidos)
        return total_vigente or 0

# --- Serializador de Producto (incluye la Existencia para la vista principal) ---
class ProductoSerializer(serializers.ModelSerializer):
    id_marca_nombre = serializers.ReadOnlyField(source='id_marca.nombre')
    id_categoria_nombre = serializers.ReadOnlyField(source='id_categoria.nombre')
    
    # Campo para obtener la existencia total del producto (lectura)
    existencia_total = serializers.SerializerMethodField()

    def get_existencia_total(self, obj):
        """
        Misma lógica que en Existencia: Solo mostramos al vendedor lo que PUEDE vender.
        """
        hoy = timezone.now().date()
        
        total_vigente = Lote.objects.filter(
            id_producto=obj, # Aquí 'obj' es la instancia de Producto
            cantidad__gt=0,
            estado='ACTIVO',
            fecha_vencimiento__gte=hoy
        ).aggregate(total=Sum('cantidad'))['total']

        return total_vigente or 0
            
    class Meta:
        model = Producto
        # Incluye todos los campos de Producto, más los campos calculados para el frontend
        fields = (
            'id_producto', 'nombre', 'descripcion', 'fecha_creacion', 'id_marca', 
            'id_categoria', 'sku', 'precio_venta', 'peso_unidad', 
            'id_marca_nombre', 'id_categoria_nombre', 'existencia_total', 'activo'
        )

# --- Serializador de Lote ---
class LoteSerializer(serializers.ModelSerializer):
    id_producto_nombre = serializers.ReadOnlyField(source='id_producto.nombre')
    
    class Meta:
        model = Lote
        fields = '__all__'