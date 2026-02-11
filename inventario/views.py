# inventario/views.py

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db.models import Sum
from django.utils import timezone  # <--- Importante para la fecha actual
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
    queryset = Producto.objects.all() 
    serializer_class = ProductoSerializer
    permission_classes = [AllowAny]

    # FILTRO DINÁMICO: ?activo=true
    def get_queryset(self):
        queryset = Producto.objects.all().order_by('nombre')
        activo_param = self.request.query_params.get('activo')
        if activo_param is not None:
            es_activo = activo_param.lower() == 'true'
            queryset = queryset.filter(activo=es_activo)
        return queryset

    # VALIDACIÓN AL ACTUALIZAR (Lógica de Desactivación Inteligente)
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        # Verificamos si están intentando cambiar el estado 'activo'
        if 'activo' in request.data:
            nuevo_estado = str(request.data['activo']).lower() == 'true'
            
            # Si se intenta desactivar (False) y actualmente está activo (True)
            if not nuevo_estado and instance.activo:
                
                # 1. Calculamos la fecha de hoy
                hoy = timezone.now().date()

                # 2. Calculamos el stock VIGENTE (ignorando lotes vencidos)
                stock_vigente = Lote.objects.filter(
                    id_producto=instance,
                    cantidad__gt=0,
                    estado='ACTIVO',
                    fecha_vencimiento__gte=hoy  # <--- CLAVE: Ignora lo vencido
                ).aggregate(total=Sum('cantidad'))['total'] or 0
                
                # 3. Solo bloqueamos si hay stock SANO
                if stock_vigente > 0:
                    return Response(
                        {
                            "error": (
                                f"No se puede desactivar '{instance.nombre}' porque tiene {stock_vigente} "
                                "unidades VIGENTES en inventario. (El stock vencido no impide la desactivación)."
                            )
                        },
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