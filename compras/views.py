from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import PermissionDenied
from django.db import transaction
from django.db.models import Sum
from decimal import Decimal, InvalidOperation
from base.utils import registrar_accion
# Importa los modelos necesarios:
from .models import Compra, DetalleCompra, Proveedor, PagoCompra
from inventario.models import Lote, Existencia 
from .serializers import CompraSerializer, DetalleCompraSerializer, ProveedorSerializer
# from base.models import Usuario # Asumiendo que ya está importado si lo usas en el admin.

# Clase CompraViewSet
class CompraViewSet(viewsets.ModelViewSet):
    # ... (código existente del queryset y serializer_class)
    queryset = Compra.objects.all()
    serializer_class = CompraSerializer
    permission_classes = [AllowAny]

    # 2. BLOQUEO DE ELIMINACIÓN (DESTROY)
    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            
            # 1. Validación Recepción
            if instance.estado_de_envio in ['RECIBIDA_COMPLETA', 'RECIBIDA_PARCIAL']:
                return Response(
                    {"error": f"No se puede eliminar la compra #{instance.id_compra} porque ya fue recibida. Afectaría el stock."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 2. Validación Pagos 🚨 (NUEVA)
            # Verificamos si tiene pagos asociados
            if instance.pagos.exists():
                return Response(
                    {"error": f"No se puede eliminar la compra #{instance.id_compra} porque tiene pagos registrados."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # --- Proceso de borrado seguro ---
            id_backup = instance.id_compra
            prov_backup = "Proveedor Desconocido"
            try:
                if instance.id_proveedor: prov_backup = instance.id_proveedor.nombre
            except: pass

            self.perform_destroy(instance)

            try:
                registrar_accion(
                    request.user, "Compras", "Eliminar Compra",
                    f"Se eliminó la compra #{id_backup} del proveedor {prov_backup}.",
                    id_referencia=id_backup
                )
            except Exception: pass

            return Response(status=status.HTTP_204_NO_CONTENT)

        except Exception as e:
            return Response(
                {"error": f"No se pudo eliminar: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    # 🚨 ACCIÓN: Recibir Mercancía 🚨
    @action(detail=True, methods=['post'])
    @transaction.atomic
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

                # 🚨 LOG DE RECEPCIÓN
                registrar_accion(
                    request.user,
                    "Almacén",  # Módulo distinto para diferenciar
                    "Recepción Mercancía",
                    f"Se recibió mercancía de la compra #{compra.id_compra}. Nuevo estado: {compra.estado_de_envio}.",
                    id_referencia=compra.id_compra
                )

            return Response({'status': f'Recepción procesada. Estado: {compra.estado_de_envio}'})

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 
        
    # 🚨 ACCIÓN: Registrar Pago 🚨
    @action(detail=True, methods=['post'])
    @transaction.atomic # Asegura que si un pago falla, no se guarde ninguno
    def registrar_pago(self, request, pk=None):
        compra = self.get_object()
        
        # Aceptamos una lista de pagos o un solo objeto (por compatibilidad)
        data_pagos = request.data.get('pagos', [])
        if not data_pagos:
             # Soporte legacy si el frontend mandara un solo objeto plano
             data_pagos = [request.data]

        total_monto_usd = Decimal('0.00')

        # 1. Validación preliminar del total
        for p_data in data_pagos:
             monto_local = Decimal(str(p_data.get('monto_local', 0)))
             tasa = Decimal(str(p_data.get('tasa_cambio', 1)))
             if tasa <= 0: return Response({'error': 'La tasa debe ser mayor a 0'}, status=400)
             
             # Calculamos el valor en USD
             moneda = p_data.get('moneda', 'USD')
             if moneda == 'VES':
                 monto_usd = monto_local / tasa
             else:
                 monto_usd = monto_local
            
             total_monto_usd += monto_usd

        # 2. Verificar Saldo
        saldo = compra.saldo_pendiente()
        # Tolerancia de 0.05 centavos para errores de redondeo de tasa
        if total_monto_usd > (saldo + Decimal('0.05')):
             return Response({
                 'error': f'El total a pagar (${total_monto_usd:.2f}) supera la deuda (${saldo:.2f}).'
             }, status=400)

        # 3. Crear los Pagos
        try:
            for p_data in data_pagos:
                moneda = p_data.get('moneda', 'USD')
                monto_local = Decimal(str(p_data.get('monto_local', 0)))
                tasa = Decimal(str(p_data.get('tasa_cambio', 1)))
                
                # Determinamos el monto final en USD para la contabilidad
                if moneda == 'VES':
                    monto_contable = monto_local / tasa
                else:
                    monto_contable = monto_local
                    tasa = 1.00 # Si es USD, la tasa es 1

                PagoCompra.objects.create(
                    id_compra=compra,
                    metodo_pago=p_data.get('metodo_pago'),
                    referencia=p_data.get('referencia', ''),
                    
                    monto=monto_contable,        # Valor real en USD (para restar deuda)
                    monto_local=monto_local,     # Valor en billetes (para recibo)
                    tasa_cambio=tasa,            # Tasa usada
                    moneda=moneda
                )
            
            data_pagos = request.data.get('pagos', [])
            if not data_pagos: data_pagos = [request.data]
            total_log = sum(Decimal(str(p.get('monto_local', 0))) for p in data_pagos)
            moneda_log = data_pagos[0].get('moneda', 'USD') if data_pagos else 'USD'

            registrar_accion(
                request.user,
                "Compras",
                "Registrar Pago",
                f"Se registró un pago de {moneda_log} {total_log} a la compra #{compra.id_compra}.",
                id_referencia=compra.id_compra
            )

            return Response({'status': 'Pagos registrados exitosamente.'}, status=200)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def aprobar(self, request, pk=None):
        """
        Solo GERENTE puede aprobar compras.
        Cambia estado_de_envio a 'APROBADA'.
        No toca inventario (eso se hace luego en recepción).
        """
        usuario = request.user

        if getattr(usuario, "tipo", None) != "GERENTE":
            raise PermissionDenied("Solo el gerente puede aprobar compras.")

        try:
            compra = self.get_object()
        except Compra.DoesNotExist:
            return Response({"error": "Compra no encontrada."}, status=404)

        if compra.estado_de_envio != "PENDIENTE_APROBACION":
            return Response(
                {
                    "error": "Solo se pueden aprobar compras en estado 'PENDIENTE POR APROBACIÓN'."
                },
                status=400,
            )

        compra.estado_de_envio = "APROBADA"
        compra.save()

        # Registro de acción
        registrar_accion(
            usuario,
            "Compras",
            "Aprobar compra",
            f"Compra {compra.id_compra} aprobada por el gerente.",
            id_referencia=compra.id_compra,
        )

        return Response(
            {"mensaje": "Compra aprobada exitosamente."}, status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def rechazar(self, request, pk=None):
        """
        Solo GERENTE puede rechazar compras.
        Cambia estado_de_envio a 'RECHAZADA'.
        NO mueve inventario (porque la mercancía nunca entró).
        """
        usuario = request.user

        if getattr(usuario, "tipo", None) != "GERENTE":
            raise PermissionDenied("Solo el gerente puede rechazar compras.")

        try:
            compra = self.get_object()
        except Compra.DoesNotExist:
            return Response({"error": "Compra no encontrada."}, status=404)

        if compra.estado_de_envio != "PENDIENTE_APROBACION":
            return Response(
                {
                    "error": "Solo se pueden rechazar compras en estado 'PENDIENTE POR APROBACIÓN'."
                },
                status=400,
            )

        compra.estado_de_envio = "RECHAZADA"
        compra.save()

        registrar_accion(
            usuario,
            "Compras",
            "Rechazar compra",
            f"Compra {compra.id_compra} rechazada por el gerente.",
            id_referencia=compra.id_compra,
        )

        return Response(
            {"mensaje": "Compra rechazada exitosamente."}, status=status.HTTP_200_OK
        )
    
class DetalleCompraViewSet(viewsets.ModelViewSet):
    queryset = DetalleCompra.objects.all()
    serializer_class = DetalleCompraSerializer
    search_fields = ['id_compra_id_compra', 'id_producto_nombre']

    def get_queryset(self):
        qs = super().get_queryset()
        id_compra = self.request.query_params.get("id_compra")

        if id_compra:
            try:
                id_int = int(id_compra)
            except ValueError:
                return qs.none()
            return qs.filter(id_compra_id=id_int)

        return qs

    # Vistas de Tablas Maestras
class ProveedorViewSet(viewsets.ModelViewSet):
    # CRUD para Proveedores (Gerente y Administrador)
    queryset = Proveedor.objects.all()
    serializer_class = ProveedorSerializer
    permission_classes = [AllowAny]

