from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db import transaction
# Importa los modelos necesarios:
from .models import Compra, DetalleCompra, Proveedor
from inventario.models import Lote, Existencia 
from .serializers import CompraSerializer, DetalleCompraSerializer, ProveedorSerializer
# from base.models import Usuario # Asumiendo que ya está importado si lo usas en el admin.

# Clase CompraViewSet
class CompraViewSet(viewsets.ModelViewSet):
    # ... (código existente del queryset y serializer_class)
    queryset = Compra.objects.all()
    serializer_class = CompraSerializer
    permission_classes = [AllowAny]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        if instance.estado_de_envio == 'RECIBIDA_COMPLETA':
            return Response(
                {"detail": "No se puede eliminar una compra que ya ha sido recibida completamente."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def recibir_mercancia(self, request, pk=None):
        """
        Recibe la mercancía, procesa devoluciones/notas y genera lotes.
        Determina si la recepción es PARCIAL o COMPLETA.
        """
        compra = self.get_object()
        
        if compra.estado_de_envio != 'APROBADA':
             return Response(
                {'error': f'Acción denegada. La compra está en estado {compra.estado_de_envio} y ya fue procesada anteriormente.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Datos enviados desde el Modal de React
        datos_recepcion = request.data.get('detalles', [])
        
        es_parcial = False

        try:
            with transaction.atomic():
                # 1. Procesar cada línea de detalle
                for item in datos_recepcion:
                    detalle_id = item.get('id_detallec')
                    cantidad_recibida = int(item.get('cantidad_recibida', 0))
                    nota = item.get('nota', '')
                    fecha_vencimiento = item.get('fecha_vencimiento')
                    
                    # Buscar el detalle original en la BD
                    detalle = DetalleCompra.objects.get(id_detallec=detalle_id, id_compra=compra)
                    
                    # Calcular devoluciones
                    cantidad_ordenada = detalle.cantidad
                    cantidad_rechazada = cantidad_ordenada - cantidad_recibida
                    
                    if cantidad_rechazada > 0:
                        es_parcial = True # Si falta algo, la orden es parcial
                        detalle.devolucion = True
                        detalle.cantidad_devolvida = cantidad_rechazada
                        detalle.nota = nota # Razón del rechazo
                        detalle.save()
                    
                    # 2. Crear el Lote (SOLO con lo recibido)
                    if cantidad_recibida > 0:
                        Lote.objects.create(
                            id_producto=detalle.id_producto,
                            numero_lote=f"CMP{compra.id_compra}-{detalle.id_producto.id_producto}", # Nomenclatura simple
                            fecha_pedido=compra.fecha_pedido,
                            fecha_vencimiento=fecha_vencimiento,
                            cantidad=cantidad_recibida, # <-- IMPORTANTE: Entra al stock lo recibido
                            estado="ACTIVO",
                            # id_existencia se maneja por la señal del modelo Lote automáticamente
                        )

                # 3. Actualizar Estado de la Compra
                if es_parcial:
                    compra.estado_de_envio = 'RECIBIDA_PARCIAL'
                else:
                    compra.estado_de_envio = 'RECIBIDA_COMPLETA'
                
                compra.save()

            return Response({'status': f'Recepción procesada. Estado: {compra.estado_de_envio}'})

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    @action(detail=True, methods=['post'])
    def simular_aprobacion(self, request, pk=None):
        """
        [SOLO PARA PRUEBAS] Cambia el estado de la compra a APROBADA
        para saltar la validación del Gerente.
        """
        compra = self.get_object()
        if compra.estado_de_envio == 'PENDIENTE_APROBACION':
            compra.estado_de_envio = 'APROBADA'
            compra.save()
            return Response({'status': f'Compra {pk} aprobada y lista para recibir.'})
        else:
            return Response({'error': f'La compra {pk} ya no está pendiente de aprobación.'}, status=status.HTTP_400_BAD_REQUEST)    

class DetalleCompraViewSet(viewsets.ModelViewSet):
    # CRUD para DetalleCompra (Generalmente gestionado al crear/editar la Compra)
    queryset = DetalleCompra.objects.all()
    serializer_class = DetalleCompraSerializer
    permission_classes = [AllowAny]

    # Vistas de Tablas Maestras
class ProveedorViewSet(viewsets.ModelViewSet):
    # CRUD para Proveedores (Gerente y Administrador)
    queryset = Proveedor.objects.all()
    serializer_class = ProveedorSerializer
    permission_classes = [AllowAny]