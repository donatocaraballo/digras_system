# inventario/views.py

from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from base.utils import registrar_accion # 🚨 AQUÍ SÍ ES SEGURO IMPORTARLO

from .models import Categoria, Marca, Producto, Existencia, Lote
from .serializers import (
    CategoriaSerializer, MarcaSerializer, ProductoSerializer, 
    ExistenciaSerializer, LoteSerializer
)

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [AllowAny]

class MarcaViewSet(viewsets.ModelViewSet):
    queryset = Marca.objects.all()
    serializer_class = MarcaSerializer
    permission_classes = [AllowAny]

class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer
    permission_classes = [AllowAny]

    # 🚨 AQUÍ IMPLEMENTAMOS EL LOG AL CREAR PRODUCTO 🚨
    def perform_create(self, serializer):
        producto = serializer.save()
        
        # Intentamos registrar la acción (blindado con try/except)
        try:
            registrar_accion(
                self.request.user,
                "Inventario",
                "Crear Producto",
                f"Se creó el producto '{producto.nombre}' (ID: {producto.id_producto}).",
                id_referencia=producto.id_producto
            )
        except Exception as e:
            print(f"⚠️ Error logueando creación de producto: {e}")

class ExistenciaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Existencia.objects.all()
    serializer_class = ExistenciaSerializer
    permission_classes = [AllowAny]
    
class LoteViewSet(viewsets.ModelViewSet):
    queryset = Lote.objects.all() 
    serializer_class = LoteSerializer 
    
    def get_queryset(self):
        queryset = self.queryset
        id_producto = self.request.query_params.get('id_producto')
        if id_producto is not None:
            queryset = queryset.filter(id_producto=id_producto)
        
        return queryset.order_by('-id_lote')