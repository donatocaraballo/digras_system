from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import PermissionDenied
from django.db import transaction
from django.db.models import Sum
from decimal import Decimal, InvalidOperation

# Importa los modelos necesarios:
from .models import Compra, DetalleCompra, Proveedor, PagoCompra
from inventario.models import Lote, Existencia 
from .serializers import CompraSerializer, DetalleCompraSerializer, ProveedorSerializer
from base.utils import registrar_accion

# Clase CompraViewSet
class CompraViewSet(viewsets.ModelViewSet):
    queryset = Compra.objects.all().order_by('-id_compra') # Ordenar descendente por defecto
    serializer_class = CompraSerializer
    permission_classes = [AllowAny]

    @action(detail=True, methods=['get'], url_path='detalles')
    def detalles(self, request, pk=None):
        """
        Devuelve los productos (detalles) de una compra específica.
        Ruta: /api/compras/compras/{id}/detalles/
        """
        compra = self.get_object()
        detalles = DetalleCompra.objects.filter(id_compra=compra)
        serializer = DetalleCompraSerializer(detalles, many=True)
        return Response(serializer.data)

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

            # 2. Validación Pagos
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
    
    # 🚨 ACCIÓN: Recibir Mercancía (CORREGIDO) 🚨
    @action(detail=True, methods=['post'])
    @transaction.atomic
    def recibir_mercancia(self, request, pk=None):
        """
        1. Recibe mercancía y genera lotes.
        2. Actualiza cantidades y subtotales en el detalle.
        3. Marca items no recibidos como devueltos.
        4. RECALCULA EL TOTAL DE LA COMPRA.
        """
        compra = self.get_object()
        
        # Validar estado previo
        if compra.estado_de_envio != 'APROBADA':
             return Response(
                {'error': f'Acción denegada. La compra está en estado {compra.estado_de_envio} y ya fue procesada anteriormente.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        datos_recepcion = request.data.get('detalles', [])
        
        if not datos_recepcion:
            return Response({"error": "No se enviaron detalles para procesar."}, status=400)

        # Contadores para determinar el estado final
        total_unidades_pedidas = 0
        total_unidades_recibidas = 0

        try:
            with transaction.atomic():
                # 1. Procesar cada línea de detalle
                for item in datos_recepcion:
                    detalle_id = item.get('id_detallec')
                    cantidad_recibida = int(item.get('cantidad_recibida', 0))
                    nota = item.get('nota', '')
                    fecha_vencimiento = item.get('fecha_vencimiento')
                    
                    try:
                        detalle = DetalleCompra.objects.get(id_detallec=detalle_id, id_compra=compra)
                    except DetalleCompra.DoesNotExist:
                        continue 
                    
                    # Calcular devoluciones / faltantes basado en lo que se pidió originalmente
                    cantidad_original = detalle.cantidad
                    cantidad_rechazada = cantidad_original - cantidad_recibida
                    
                    # --- CORRECCIÓN AQUÍ ---
                    # 1. Actualizamos la cantidad "oficial" del detalle para que coincida con lo recibido
                    detalle.cantidad = cantidad_recibida 
                    
                    # 2. Guardamos registro de lo recibido y notas
                    detalle.cantidad_recibida = cantidad_recibida
                    detalle.nota = nota
                    
                    # Logica de devolución (meramente informativa ahora que actualizamos la cantidad)
                    if cantidad_rechazada > 0:
                        detalle.devolucion = True
                        detalle.cantidad_devolvida = cantidad_rechazada
                    else:
                        detalle.devolucion = False
                        detalle.cantidad_devolvida = 0
                    
                    # 3. Ajustamos el subtotal de la línea para mantener consistencia (Cant * Precio = Subtotal)
                    detalle.subtotal = detalle.precio_unitario * cantidad_recibida
                    detalle.save()
                    
                    # Acumuladores para el estado del pedido
                    total_unidades_pedidas += cantidad_original
                    total_unidades_recibidas += cantidad_recibida
                    
                    # 2. Crear el Lote (SOLO SI SE RECIBIÓ ALGO)
                    if cantidad_recibida > 0:
                        Lote.objects.create(
                            id_producto=detalle.id_producto,
                            numero_lote=f"CMP{compra.id_compra}-{detalle.id_producto.id_producto}", 
                            fecha_pedido=compra.fecha_pedido,
                            fecha_vencimiento=fecha_vencimiento,
                            cantidad=cantidad_recibida, 
                            estado="ACTIVO",
                        )

                # 3. 🚨 RECALCULAR EL PRECIO FINAL DE LA COMPRA 🚨
                nuevo_total = DetalleCompra.objects.filter(id_compra=compra).aggregate(
                    total=Sum('subtotal')
                )['total'] or 0
                
                compra.precio_final = nuevo_total

                # 4. DETERMINAR ESTADO FINAL DE LA COMPRA
                if total_unidades_recibidas == 0:
                    compra.estado_de_envio = 'DEVUELTA'
                elif total_unidades_recibidas < total_unidades_pedidas:
                    compra.estado_de_envio = 'RECIBIDA_PARCIAL'
                else:
                    compra.estado_de_envio = 'RECIBIDA_COMPLETA'
                
                compra.save()

                # 🚨 LOG DE RECEPCIÓN
                registrar_accion(
                    request.user,
                    "Almacén",
                    "Recepción Mercancía",
                    f"Se procesó la compra #{compra.id_compra}. Total ajustado: {nuevo_total}. Estado: {compra.estado_de_envio}.",
                    id_referencia=compra.id_compra
                )

            return Response({
                'status': f'Recepción procesada. Total ajustado: {compra.precio_final}',
                'estado': compra.estado_de_envio
            })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 
        
    # 🚨 ACCIÓN: Registrar Pago 🚨
    @action(detail=True, methods=['post'])
    @transaction.atomic 
    def registrar_pago(self, request, pk=None):
        compra = self.get_object()
        
        # 1. VALIDACIÓN ESTRICTA DE ESTADO
        estados_pagables = ['RECIBIDA_COMPLETA', 'RECIBIDA_PARCIAL']
        if compra.estado_de_envio not in estados_pagables:
            return Response({
                'error': f'No se pueden registrar pagos. La compra debe estar RECIBIDA (Total o Parcial). Estado actual: {compra.estado_de_envio}.'
            }, status=400)

        data_pagos = request.data.get('pagos', [])
        if not data_pagos:
             data_pagos = [request.data]

        total_monto_usd = Decimal('0.00')

        # Validación preliminar del total
        for p_data in data_pagos:
             monto_local = Decimal(str(p_data.get('monto_local', 0)))
             tasa = Decimal(str(p_data.get('tasa_cambio', 1)))
             if tasa <= 0: return Response({'error': 'La tasa debe ser mayor a 0'}, status=400)
             
             moneda = p_data.get('moneda', 'USD')
             if moneda == 'VES':
                 monto_usd = monto_local / tasa
             else:
                 monto_usd = monto_local
            
             total_monto_usd += monto_usd

        # Verificar Saldo
        saldo = compra.saldo_pendiente()
        if total_monto_usd > (saldo + Decimal('0.05')):
             return Response({
                 'error': f'El total a pagar (${total_monto_usd:.2f}) supera la deuda (${saldo:.2f}).'
             }, status=400)

        # Crear los Pagos
        try:
            for p_data in data_pagos:
                moneda = p_data.get('moneda', 'USD')
                monto_local = Decimal(str(p_data.get('monto_local', 0)))
                tasa = Decimal(str(p_data.get('tasa_cambio', 1)))
                
                if moneda == 'VES':
                    monto_contable = monto_local / tasa
                else:
                    monto_contable = monto_local
                    tasa = 1.00 

                PagoCompra.objects.create(
                    id_compra=compra,
                    metodo_pago=p_data.get('metodo_pago'),
                    referencia=p_data.get('referencia', ''),
                    monto=monto_contable,        
                    monto_local=monto_local,     
                    tasa_cambio=tasa,            
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