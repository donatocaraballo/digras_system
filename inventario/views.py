from rest_framework import viewsets
from rest_framework.permissions import AllowAny
# Importa tus modelos y serializadores
from .models import Categoria, Marca, Producto, Existencia, Lote
from .serializers import (
    CategoriaSerializer, MarcaSerializer, ProductoSerializer, 
    ExistenciaSerializer, LoteSerializer
)

# Nota: El permiso IsAuthenticated asume que el usuario está logueado. 
# En el futuro, deberás implementar permisos basados en roles (Gerente, Almacenista, etc.) [cite: 437]

class CategoriaViewSet(viewsets.ModelViewSet):
    # CRUD para Categoría
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [AllowAny]

class MarcaViewSet(viewsets.ModelViewSet):
    # CRUD para Marca
    queryset = Marca.objects.all()
    serializer_class = MarcaSerializer
    permission_classes = [AllowAny]

class ProductoViewSet(viewsets.ModelViewSet):
    # CRUD para Producto (Dispara la señal de creación de Existencia)
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer
    permission_classes = [AllowAny]

class ExistenciaViewSet(viewsets.ReadOnlyModelViewSet):
    # Solo Consulta de Stock (GET). Cubre el Caso de Uso "Consultar disponibilidad de inventario" [cite: 1415]
    # No se permite POST, PUT, DELETE.
    queryset = Existencia.objects.all()
    serializer_class = ExistenciaSerializer
    permission_classes = [AllowAny]
    
class LoteViewSet(viewsets.ModelViewSet):
    # FIX CRÍTICO: RE-AÑADE ESTA LÍNEA
    queryset = Lote.objects.all() 
    serializer_class = LoteSerializer 
    
    def get_queryset(self):
        """
        La lógica de filtrado permanece aquí.
        """
        queryset = self.queryset
        # ... (Tu lógica de filtrado por id_producto)
        id_producto = self.request.query_params.get('id_producto')
        if id_producto is not None:
            queryset = queryset.filter(id_producto=id_producto)
        
        return queryset.order_by('-id_lote')