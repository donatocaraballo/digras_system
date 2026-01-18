# inventario/views.py

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db.models import Sum
from base.utils import registrar_accion 

from .models import Categoria, Marca, Producto, Existencia, Lote
from .serializers import (
    CategoriaSerializer, MarcaSerializer, ProductoSerializer, 
    ExistenciaSerializer, LoteSerializer
)

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all().order_by('nombre')
    serializer_class = CategoriaSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        obj = serializer.save()
        try:
            registrar_accion(self.request.user, "Inventario", "Crear Categoría", f"Se creó la categoría '{obj.nombre}'.")
        except: pass

class MarcaViewSet(viewsets.ModelViewSet):
    queryset = Marca.objects.all().order_by('nombre')
    serializer_class = MarcaSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        obj = serializer.save()
        try:
            registrar_accion(self.request.user, "Inventario", "Crear Marca", f"Se creó la marca '{obj.nombre}'.")
        except: pass

class ProductoViewSet(viewsets.ModelViewSet):
    # 🚨 CORRECCIÓN: Agregamos esto para que el router sepa el modelo base y no de error al iniciar
    queryset = Producto.objects.all() 
    
    serializer_class = ProductoSerializer
    permission_classes = [AllowAny]

    # FILTRO DINÁMICO: ?activo=true
    def get_queryset(self):
        # Empezamos con todos
        queryset = Producto.objects.all().order_by('nombre')
        
        # Filtramos si viene el parámetro
        activo_param = self.request.query_params.get('activo')
        if activo_param is not None:
            # Convertimos 'true'/'false' string a booleano real
            es_activo = activo_param.lower() == 'true'
            queryset = queryset.filter(activo=es_activo)
            
        return queryset

    # VALIDACIÓN AL ACTUALIZAR (Lógica de Desactivación)
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        # Verificamos si están intentando cambiar el estado 'activo'
        if 'activo' in request.data:
            # Convertimos a booleano seguro
            nuevo_estado = str(request.data['activo']).lower() == 'true'
            
            # Si se intenta desactivar (False) y actualmente está activo (True)
            if not nuevo_estado and instance.activo:
                # Verificar stock total en Existencia
                total_stock = Existencia.objects.filter(id_producto=instance).aggregate(total=Sum('cantidad'))['total'] or 0
                
                if total_stock > 0:
                    return Response(
                        {"error": f"No se puede desactivar '{instance.nombre}' porque tiene {total_stock} unidades en existencia. Debe vaciar el stock primero."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

        # Si pasa la validación, procedemos con la actualización normal
        return super().update(request, partial=partial, *args, **kwargs)

    # LOGS DE AUDITORÍA
    def perform_create(self, serializer):
        producto = serializer.save()
        try:
            registrar_accion(
                self.request.user, "Inventario", "Crear Producto",
                f"Se creó el producto '{producto.nombre}' (ID: {producto.id_producto}).",
                id_referencia=producto.id_producto
            )
        except Exception as e:
            print(f"⚠️ Error logueando creación de producto: {e}")

    def perform_update(self, serializer):
        producto = serializer.save()
        try:
            registrar_accion(
                self.request.user, "Inventario", "Editar Producto",
                f"Se modificó el producto '{producto.nombre}' (ID: {producto.id_producto}).",
                id_referencia=producto.id_producto
            )
        except Exception: pass

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