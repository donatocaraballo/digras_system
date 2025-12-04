from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from django.db.models import F

from base.viewsets import BaseViewSet
from base.models import Orden, DetalleOrden, Usuario
from inventario.models import Lote, Existencia, Producto
from base.serializers import OrdenSerializer, DetalleOrdenSerializer
from .serializers import OrdenCreateSerializer
from base.utils import registrar_accion


"""
Vista principal para gestionar órdenes: creación, edición, cancelación, aprobación,
rechazo, filtros, reportes, preparación y consumo FIFO de lotes.
"""
class OrdenViewSet(BaseViewSet):
    queryset = Orden.objects.all()
    # Búsqueda básica
    search_fields = [
        'id_cliente__nombre',
        'id_usuario__username',
        'estado_de_envio',
        'estado_de_pago',
        'metodo_pago',
    ]
    # Ordenamiento permitido por DRF (además del manual con ?ordering=)
    ordering_fields = ['fecha_orden', 'precio_final', 'peso_total']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return OrdenCreateSerializer
        return OrdenSerializer

    # ==========================================================
    #   HELPERS PRIVADOS PARA FIFO DE LOTES
    # ==========================================================

    def _consumir_lotes_fifo(self, producto_id: int, cantidad_total: int):
        if cantidad_total <= 0:
            return

        lotes = (
            Lote.objects.select_for_update()
            .filter(id_producto_id=producto_id, cantidad__gt=0, estado='ACTIVO')
            .order_by('fecha_pedido', 'id_lote')
        )

        restante = cantidad_total

        for lote in lotes:
            if restante <= 0:
                break

            disponible_lote = lote.cantidad

            if disponible_lote >= restante:
                # El lote cubre lo que falta
                nueva_cantidad = disponible_lote - restante
                
                # Actualizamos cantidad y estado si llega a 0
                update_kwargs = {'cantidad': nueva_cantidad}
                if nueva_cantidad == 0:
                    update_kwargs['estado'] = 'AGOTADO'
                
                Lote.objects.filter(pk=lote.pk).update(**update_kwargs)
                restante = 0
            else:
                # Consumimos todo el lote
                Lote.objects.filter(pk=lote.pk).update(cantidad=0, estado='AGOTADO')
                restante -= disponible_lote

        if restante > 0:
            raise ValueError(f"Inconsistencia: Faltan {restante} unidades en lotes para el producto {producto_id}.")

    def _devolver_a_lotes_fifo(self, producto_id: int, cantidad_total: int):
        # (Este método se mantiene igual, o puedes agregar lógica para reactivar lotes agotados si es necesario)
        if cantidad_total <= 0:
            return

        # Buscamos lotes recientes (incluso agotados) para devolver stock
        lotes = (
            Lote.objects.select_for_update()
            .filter(id_producto_id=producto_id)
            .order_by('-fecha_pedido', '-id_lote')
        )

        primer_lote = lotes.first()
        if primer_lote:
            # Si estaba agotado, lo reactivamos
            Lote.objects.filter(pk=primer_lote.pk).update(
                cantidad=F('cantidad') + cantidad_total,
                estado='ACTIVO' 
            )

    # ==========================================================
    #   CREAR ORDEN
    # ==========================================================
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # Validación de Vendedor
        if request.user.tipo != "VENDEDOR":
            return Response({"error": "Solo los vendedores pueden crear órdenes."}, status=403)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        datos = serializer.validated_data
        detalles_data = datos.pop('detalles', [])
        usuario = request.user

        # 1. Reunir cantidades
        required = {}
        for item in detalles_data:
            # Ajuste: item["id_producto"] puede ser un objeto o un ID dependiendo del serializer
            producto = item["id_producto"]
            pid = producto.pk if hasattr(producto, 'pk') else producto
            qty = int(item["cantidad"])
            required.setdefault(pid, 0)
            required[pid] += qty

        # 2. Bloquear existencias
        existencias = Existencia.objects.select_for_update().filter(id_producto_id__in=required.keys())
        exist_map = {e.id_producto_id: e for e in existencias}

        # Validar Stock
        for pid, qty_needed in required.items():
            ex = exist_map.get(pid)
            if ex is None:
                return Response({"detail": f"No existe existencia para el producto {pid}."}, status=400)
            if ex.cantidad < qty_needed:
                return Response({"detail": f"Stock insuficiente para producto {pid}. Disponible: {ex.cantidad}"}, status=400)

        # 3. Descontar inventario y ACTUALIZAR ESTADO (FIX)
        for pid, qty_needed in required.items():
            ex = exist_map[pid]
            
            # Cálculo de nueva cantidad
            nueva_cantidad = ex.cantidad - qty_needed
            
            # Determinación del nuevo estado
            nuevo_estado = 'DISPONIBLE'
            if nueva_cantidad <= 0:
                nuevo_estado = 'AGOTADO'
            elif nueva_cantidad < 10:
                nuevo_estado = 'BAJA_EXISTENCIA'
            
            # Actualizamos DIRECTAMENTE en la BD (Atomico y Estado)
            # Usamos update para velocidad, pero seteamos el estado explícitamente
            Existencia.objects.filter(pk=ex.pk).update(
                cantidad=nueva_cantidad,
                estado=nuevo_estado
            )

        # 3.1 Consumir lotes
        try:
            for pid, qty_needed in required.items():
                self._consumir_lotes_fifo(pid, qty_needed)
        except ValueError as e:
            return Response({"detail": str(e)}, status=500)

        # 4. Crear orden
        # (Nota: Asegúrate de usar los nombres de campo correctos de tu modelo Orden)
        precio_final = 0
        peso_total = 0
        
        # Mapeo de id_cliente (asegúrate de que tu Serializer espera 'id_cliente')
        cliente_id = datos.get("id_cliente") 
        
        orden = Orden.objects.create(
            metodo_pago=datos.get("metodo_pago", "EFECTIVO"),
            id_cliente_id=cliente_id, # Ajusta si tu modelo usa FK directa
            estado_de_envio="PENDIENTE POR APROBACIÓN",
            estado_de_pago="PENDIENTE POR PAGO",
            precio_final=0,
            peso_total=0,
            cancelacion=False,
            id_usuario=usuario,
        )

        # 5. Crear detalles
        for item in detalles_data:
            prod = item["id_producto"]
            cantidad = item["cantidad"]
            
            # Acceso seguro a propiedades del producto
            p_obj = prod if hasattr(prod, 'precio_venta') else Producto.objects.get(pk=prod)
            
            precio_unitario = p_obj.precio_venta
            peso_unitario = p_obj.peso_unidad

            subtotal = float(precio_unitario) * cantidad
            peso_subtotal = float(peso_unitario) * cantidad

            precio_final += subtotal
            peso_total += peso_subtotal

            DetalleOrden.objects.create(
                id_orden=orden,
                id_producto=p_obj,
                cantidad=cantidad,
                precio_unitario=precio_unitario,
                subtotal=subtotal,
                peso_unitario=peso_unitario,
                peso_subtotal=peso_subtotal,
            )

        # 6. Guardar totales
        orden.precio_final = precio_final
        orden.peso_total = peso_total
        orden.save()

        # 7. Registrar acción
        registrar_accion(
            usuario, "Órdenes", "Crear orden", 
            f"Orden creada. Total: {precio_final}", id_referencia=orden.id_orden
        )

        return Response(OrdenSerializer(orden).data, status=201)

    # ==========================================================
    #   EDITAR ORDEN (PUT / PATCH)
    # ==========================================================
    @transaction.atomic
    def update(self, request, *args, **kwargs):
        # PUT /ordenes/{id}/
        return self._editar_orden(request, pk=kwargs.get('pk'), partial=False)

    @transaction.atomic
    def partial_update(self, request, *args, **kwargs):
        # PATCH /ordenes/{id}/
        return self._editar_orden(request, pk=kwargs.get('pk'), partial=True)

    # Permite editar una orden pendiente. Rehabilita inventario previo,
    # aplica nuevos cambios, ajusta Existencia y lotes, recalcula totales,
    # registra acción.
    def _editar_orden(self, request, pk=None, partial=False):
        usuario = request.user

        # 1) Verificar que la orden exista
        try:
            orden = Orden.objects.select_for_update().get(pk=pk)
        except Orden.DoesNotExist:
            return Response({"error": "Orden no encontrada."}, status=404)

        # 2) Solo el vendedor creador puede editarla
        if usuario.tipo != "VENDEDOR":
            return Response(
                {"error": "Solo los vendedores pueden editar órdenes."},
                status=status.HTTP_403_FORBIDDEN
            )

        if orden.id_usuario != usuario:
            return Response(
                {"error": "No puedes editar una orden creada por otro vendedor."},
                status=status.HTTP_403_FORBIDDEN
            )

        # 3) Validar estado permitido
        if orden.estado_de_envio != "PENDIENTE POR APROBACIÓN":
            return Response(
                {"error": "Solo se pueden editar órdenes en estado 'PENDIENTE POR APROBACIÓN'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if orden.cancelacion:
            return Response(
                {"error": "No se puede editar una orden cancelada."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 4) Validar data entrante
        serializer = self.get_serializer(orden, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        datos = serializer.validated_data

        detalles_enviados = datos.pop('detalles', None)

        # 5) Actualizar campos simples
        if 'metodo_pago' in datos:
            orden.metodo_pago = datos['metodo_pago']

        if 'id_cliente' in datos:
            orden.id_cliente_id = datos['id_cliente']

        # 6) Si vienen detalles, re-sync inventario, lotes y detalles
        if detalles_enviados is not None:
            detalles_previos_qs = DetalleOrden.objects.filter(id_orden=orden)

            # 6.1) Cantidades previamente reservadas por esta orden
            prev_required = {}
            for det in detalles_previos_qs:
                pid = det.id_producto_id
                prev_required.setdefault(pid, 0)
                prev_required[pid] += int(det.cantidad)

            # 6.2) Cantidades nuevas requeridas
            required = {}
            for item in detalles_enviados:
                producto = item['id_producto']
                pid = producto.pk
                qty = int(item['cantidad'])
                required.setdefault(pid, 0)
                required[pid] += qty

            all_pids = set(prev_required.keys()) | set(required.keys())

            # 6.3) Bloquear existencias para todos los productos afectados
            existencias = (
                Existencia.objects.select_for_update()
                .filter(id_producto_id__in=all_pids)
            )
            exist_map = {e.id_producto_id: e for e in existencias}

            # 6.4) Validar stock disponible considerando que se liberan cantidades previas
            for pid in all_pids:
                prev_qty = prev_required.get(pid, 0)
                new_qty = required.get(pid, 0)
                ex = exist_map.get(pid)
                disponible = (ex.cantidad if ex else 0) + prev_qty

                if disponible < new_qty:
                    return Response(
                        {
                            "detail": (
                                f"Stock insuficiente para el producto {pid}. "
                                f"Disponible: {disponible}, requerido: {new_qty}"
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # 6.5) Aplicar deltas al inventario y lotes
            try:
                for pid in all_pids:
                    prev_qty = prev_required.get(pid, 0)
                    new_qty = required.get(pid, 0)
                    delta = new_qty - prev_qty
                    ex = exist_map.get(pid)

                    if delta > 0:
                        # Necesitamos consumir más unidades
                        if ex is None:
                            return Response(
                                {"detail": f"No existe existencia para el producto {pid}."},
                                status=status.HTTP_400_BAD_REQUEST
                            )
                        Existencia.objects.filter(pk=ex.pk).update(
                            cantidad=F('cantidad') - delta
                        )
                        # Consumir lotes FIFO
                        self._consumir_lotes_fifo(pid, delta)

                    elif delta < 0:
                        # Devolvemos unidades al inventario
                        devolver = -delta
                        if ex is None:
                            # Creamos existencia si no existía
                            ex = Existencia.objects.create(
                                id_producto_id=pid,
                                cantidad=0,
                                estado="DISPONIBLE"
                            )
                        Existencia.objects.filter(pk=ex.pk).update(
                            cantidad=F('cantidad') + devolver
                        )
                        # Intentar devolver también a los lotes
                        self._devolver_a_lotes_fifo(pid, devolver)

            except ValueError as e:
                return Response(
                    {"detail": str(e)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # 6.6) Reemplazar detalles
            detalles_previos_qs.delete()

            precio_final = 0
            peso_total = 0

            for item in detalles_enviados:
                prod = item['id_producto']
                cantidad = item['cantidad']
                precio_unitario = prod.precio_venta
                peso_unitario = prod.peso_unidad

                subtotal = float(precio_unitario) * cantidad
                peso_subtotal = float(peso_unitario) * cantidad

                precio_final += subtotal
                peso_total += peso_subtotal

                DetalleOrden.objects.create(
                    id_orden=orden,
                    id_producto=prod,
                    cantidad=cantidad,
                    precio_unitario=precio_unitario,
                    subtotal=subtotal,
                    peso_unitario=peso_unitario,
                    peso_subtotal=peso_subtotal,
                )

            orden.precio_final = precio_final
            orden.peso_total = peso_total

        # 7) Guardar y registrar acción
        orden.save()

        registrar_accion(
            usuario,
            "Órdenes",
            "Editar orden",
            f"Orden editada. Total: {orden.precio_final}",
            id_referencia=orden.id_orden
        )

        return Response(OrdenSerializer(orden).data, status=status.HTTP_200_OK)

    # ==========================================================
    #   CANCELAR ORDEN (solo VENDEDOR que la creó)
    # ==========================================================
    # Cancela una orden si fue creada por el vendedor y está pendiente/aprobada.
    # Reintegra Existencia y lotes, marca cancelación y registra acción.
    @action(detail=True, methods=['post'])
    @transaction.atomic
    def cancelar(self, request, pk=None):

        usuario = request.user

        # 1) Verificar que la orden exista
        try:
            orden = Orden.objects.select_for_update().get(pk=pk)
        except Orden.DoesNotExist:
            return Response({"error": "Orden no encontrada."}, status=404)

        # 2) Solo el vendedor creador puede cancelarla
        if usuario.tipo != "VENDEDOR":
            return Response(
                {"error": "Solo los vendedores pueden cancelar órdenes."},
                status=403
            )

        if orden.id_usuario != usuario:
            return Response(
                {"error": "No puedes cancelar una orden creada por otro vendedor."},
                status=403
            )

        # 3) Validar estados permitidos
        estados_validos = ["PENDIENTE POR APROBACIÓN", "APROBADA"]

        if orden.estado_de_envio not in estados_validos:
            return Response(
                {"error": "Solo se pueden cancelar órdenes en estado 'PENDIENTE POR APROBACIÓN' o 'APROBADA'."},
                status=400
            )

        # 4) Verificar si ya está cancelada
        if orden.cancelacion:
            return Response({"error": "La orden ya está cancelada."}, status=400)

        # 5) Si tiene envío asignado NO se puede cancelar
        if orden.id_envio is not None:
            return Response(
                {"error": "No se puede cancelar una orden con envío asignado."},
                status=400
            )

        # 6) Reintegrar productos al inventario (Existencia + Lotes)
        detalles = DetalleOrden.objects.filter(id_orden=orden)

        for det in detalles:
            # EXISTENCIA
            existencia = (
                Existencia.objects.select_for_update()
                .filter(id_producto=det.id_producto)
                .first()
            )

            if existencia is None:
                existencia = Existencia.objects.create(
                    id_producto=det.id_producto,
                    cantidad=0,
                    estado="DISPONIBLE"
                )

            Existencia.objects.filter(pk=existencia.pk).update(
                cantidad=F('cantidad') + det.cantidad
            )

            # LOTES (devolvemos al lote más reciente)
            self._devolver_a_lotes_fifo(det.id_producto_id, det.cantidad)

        # 7) Marcar la orden como cancelada
        orden.cancelacion = True
        orden.estado_de_envio = "CANCELADA"
        orden.save()

        # 8) Registrar acción
        registrar_accion(
            usuario,
            "Órdenes",
            "Cancelar orden",
            f"Cancelación de orden {orden.id_orden}",
            id_referencia=orden.id_orden
        )

        return Response({"mensaje": "Orden cancelada exitosamente."}, status=200)

    # ==========================================================
    #   APROBAR ORDEN  (solo GERENTE)
    # ==========================================================
    # Aprueba una orden (solo GERENTE). Cambia estado y registra acción.
    @action(detail=True, methods=['post'])
    @transaction.atomic
    def aprobar(self, request, pk=None):

        usuario = request.user

        if usuario.tipo != "GERENTE":
            return Response(
                {"error": "Solo el gerente puede aprobar órdenes."},
                status=403
            )

        try:
            orden = Orden.objects.select_for_update().get(pk=pk)
        except Orden.DoesNotExist:
            return Response({"error": "Orden no encontrada."}, status=404)

        # Solo puede aprobarse si está pendiente
        if orden.estado_de_envio != "PENDIENTE POR APROBACIÓN":
            return Response(
                {"error": "Solo se pueden aprobar órdenes en estado 'PENDIENTE POR APROBACIÓN'."},
                status=400
            )

        if orden.cancelacion:
            return Response({"error": "No se puede aprobar una orden cancelada."}, status=400)

        # Cambiar estado
        orden.estado_de_envio = "APROBADA"
        orden.save()

        registrar_accion(
            usuario,
            "Órdenes",
            "Aprobar orden",
            f"Orden aprobada {orden.id_orden}",
            id_referencia=orden.id_orden
        )

        return Response({"mensaje": "Orden aprobada exitosamente."}, status=200)

    # ==========================================================
    #   RECHAZAR ORDEN  (solo GERENTE)
    # ==========================================================
    # Rechaza una orden (solo GERENTE). Reintegra inventario y marca cancelación.
    @action(detail=True, methods=['post'])
    @transaction.atomic
    def rechazar(self, request, pk=None):

        usuario = request.user

        if usuario.tipo != "GERENTE":
            return Response(
                {"error": "Solo el gerente puede rechazar órdenes."},
                status=403
            )

        try:
            orden = Orden.objects.select_for_update().get(pk=pk)
        except Orden.DoesNotExist:
            return Response({"error": "Orden no encontrada."}, status=404)

        if orden.estado_de_envio != "PENDIENTE POR APROBACIÓN":
            return Response(
                {"error": "Solo se pueden rechazar órdenes en estado 'PENDIENTE POR APROBACIÓN'."},
                status=400
            )

        if orden.cancelacion:
            return Response({"error": "La orden ya está cancelada/rechazada."}, status=400)

        # Reintegrar inventario (Existencia + Lotes)
        detalles = DetalleOrden.objects.filter(id_orden=orden)
        for det in detalles:
            existencia = (
                Existencia.objects.select_for_update()
                .filter(id_producto=det.id_producto)
                .first()
            )

            if existencia is None:
                existencia = Existencia.objects.create(
                    id_producto=det.id_producto,
                    cantidad=0,
                    estado="DISPONIBLE"
                )

            Existencia.objects.filter(pk=existencia.pk).update(
                cantidad=F("cantidad") + det.cantidad
            )

            # LOTES: devolvemos las unidades al lote más reciente
            self._devolver_a_lotes_fifo(det.id_producto_id, det.cantidad)

        # Marcar como rechazada
        orden.cancelacion = True
        orden.estado_de_envio = "RECHAZADA"
        orden.save()

        registrar_accion(
            usuario,
            "Órdenes",
            "Rechazar orden",
            f"Rechazo de orden {orden.id_orden}",
            id_referencia=orden.id_orden
        )

        return Response({"mensaje": "Orden rechazada exitosamente."}, status=200)

    # ============================================================
    #   LISTAR ÓRDENES APROBADAS PARA PREPARACIÓN (solo almacenista)
    # ============================================================
    @action(detail=False, methods=['get'])
    def para_preparar(self, request):
        """
        Devuelve todas las órdenes que están APROBADAS para que 
        puedan ser preparadas por un ALMACENISTA.
        """
        usuario = request.user

        # Solo almacenista puede ver esta lista
        if usuario.tipo != "ALMACENISTA":
            return Response(
                {"error": "Solo los almacenistas pueden acceder a las órdenes por preparar."},
                status=403
            )

        aprobadas = Orden.objects.filter(
            estado_de_envio="APROBADA",
            cancelacion=False
        )

        serializer = OrdenSerializer(aprobadas, many=True)
        return Response(serializer.data, status=200)

    # ==========================================================
    #   VER ORDEN ANTES DE PREPARAR (solo ALMACENISTA)
    # ==========================================================
    @action(detail=True, methods=['get'])
    def ver_para_preparar(self, request, pk=None):
        """
        Permite al almacenista ver una orden aprobada antes de prepararla.
        Notifica al gerente y al vendedor que la orden está siendo revisada.
        """
        usuario = request.user

        if usuario.tipo != "ALMACENISTA":
            return Response({"error": "Solo el almacenista puede revisar órdenes para preparar."}, status=403)

        try:
            orden = Orden.objects.prefetch_related("detalleorden_set").get(pk=pk)
        except Orden.DoesNotExist:
            return Response({"error": "Orden no encontrada."}, status=404)

        if orden.estado_de_envio != "APROBADA":
            return Response(
                {"error": "Solo se pueden ver órdenes APROBADAS para preparación."},
                status=400
            )

        # Notificar al almacenista (acción propia), gerente y vendedor
        registrar_accion(
            usuario,
            "Órdenes",
            "Revisión para preparar",
            f"El almacenista revisa la orden {orden.id_orden}",
            id_referencia=orden.id_orden
        )

        registrar_accion(
            orden.id_usuario,
            "Órdenes",
            "Orden en revisión por almacenista",
            f"El almacenista está revisando la orden {orden.id_orden}",
            id_referencia=orden.id_orden
        )

        gerentes = Usuario.objects.filter(tipo="GERENTE")
        for g in gerentes:
            registrar_accion(
                g,
                "Órdenes",
                "Orden en revisión por almacenista",
                f"La orden {orden.id_orden} está siendo revisada para preparación.",
                id_referencia=orden.id_orden
            )

        # Puedes devolver la orden + detalles si quieres mostrar todo
        detalles = DetalleOrden.objects.filter(id_orden=orden)
        detalles_serializados = [
            {
                "producto": d.id_producto.nombre,
                "cantidad": d.cantidad,
                "peso": str(d.peso_subtotal),
                "subtotal": str(d.subtotal),
            }
            for d in detalles
        ]

        return Response(
            {
                "orden": OrdenSerializer(orden).data,
                "detalles": detalles_serializados,
            },
            status=200
        )

    # ============================================================
    #   PREPARAR UNA ORDEN (solo almacenista)
    # ============================================================
    @action(detail=True, methods=['post'])
    @transaction.atomic
    def preparar(self, request, pk=None):
        """
        Marca una orden como PREPARADA.
        Solo el almacenista puede ejecutar esta acción.
        Notifica al vendedor y al gerente.
        """
        usuario = request.user

        # 1. Validación de rol
        if usuario.tipo != "ALMACENISTA":
            return Response(
                {"error": "Solo los almacenistas pueden preparar órdenes."},
                status=403
            )

        # 2. Validación de existencia
        try:
            orden = Orden.objects.select_for_update().get(pk=pk)
        except Orden.DoesNotExist:
            return Response({"error": "Orden no encontrada."}, status=404)

        # 3. Solo se pueden preparar órdenes aprobadas
        if orden.estado_de_envio != "APROBADA":
            return Response(
                {"error": "Solo se pueden preparar órdenes con estado APROBADA."},
                status=400
            )

        # 4. No preparar órdenes canceladas
        if orden.cancelacion:
            return Response(
                {"error": "No se puede preparar una orden cancelada."},
                status=400
            )

        # 5. Obtenemos los detalles (para devolverlos en la respuesta)
        detalles = DetalleOrden.objects.filter(id_orden=orden)
        detalles_serializados = [
            {
                "producto": d.id_producto.nombre,
                "cantidad": d.cantidad,
                "peso": str(d.peso_subtotal),
                "subtotal": str(d.subtotal)
            }
            for d in detalles
        ]

        # 6. Marcamos como PREPARADA
        orden.estado_de_envio = "PREPARADA"
        orden.save()

        # 7. Registrar acción (almacenista)
        registrar_accion(
            usuario,
            "Órdenes",
            "Preparar orden",
            f"La orden {orden.id_orden} fue marcada como PREPARADA.",
            id_referencia=orden.id_orden
        )

        # 8. Notificar vendedor
        registrar_accion(
            orden.id_usuario,
            "Órdenes",
            "Orden preparada",
            f"La orden {orden.id_orden} ha sido preparada por el almacenista",
            id_referencia=orden.id_orden
        )

        # 9. Notificar gerentes
        gerentes = Usuario.objects.filter(tipo="GERENTE")
        for g in gerentes:
            registrar_accion(
                g,
                "Órdenes",
                "Orden preparada",
                f"La orden {orden.id_orden} ya está PREPARADA.",
                id_referencia=orden.id_orden
            )

        return Response({
            "mensaje": "Orden marcada como PREPARADA exitosamente.",
            "orden": OrdenSerializer(orden).data,
            "detalles": detalles_serializados
        }, status=200)

    # ==========================================================
    #   NOTIFICAR PREPARACION (solo ALMACENISTA)
    # ==========================================================
    @action(detail=True, methods=['post'])
    def notificar_preparacion(self, request, pk=None):
        """
        Notifica al gerente y al vendedor que la orden está lista para ser retirada o despachada.
        Solo el almacenista puede ejecutar esta acción.
        """
        usuario = request.user

        if usuario.tipo != "ALMACENISTA":
            return Response({"error": "Solo el almacenista puede notificar preparación."}, status=403)

        try:
            orden = Orden.objects.get(pk=pk)
        except Orden.DoesNotExist:
            return Response({"error": "Orden no encontrada."}, status=404)

        if orden.estado_de_envio != "PREPARADA":
            return Response(
                {"error": "Solo se pueden notificar órdenes en estado PREPARADA."},
                status=400
            )

        # Notificaciones
        registrar_accion(
            usuario,
            "Órdenes",
            "Notificar preparación",
            f"El almacenista notifica que la orden {orden.id_orden} está lista para retiro/despacho.",
            id_referencia=orden.id_orden
        )

        registrar_accion(
            orden.id_usuario,
            "Órdenes",
            "Orden lista para retiro/despacho",
            f"La orden {orden.id_orden} está lista para ser retirada o despachada.",
            id_referencia=orden.id_orden
        )

        gerentes = Usuario.objects.filter(tipo="GERENTE")
        for g in gerentes:
            registrar_accion(
                g,
                "Órdenes",
                "Orden lista para retiro/despacho",
                f"La orden {orden.id_orden} está lista para ser retirada o despachada.",
                id_referencia=orden.id_orden
            )

        return Response({"mensaje": "Notificación de preparación enviada."}, status=200)

    # ==========================================================
    #   LISTA CON FILTROS AVANZADOS + ORDENAMIENTO
    # ==========================================================
    """
    Devuelve la lista de órdenes con filtros avanzados y ordenamiento.
    Compatible con el modelo actual de Orden.
    """
    def list(self, request, *args, **kwargs):
        usuario = request.user

        # 1) Transportista NO puede ver todas las órdenes
        if usuario.tipo == "TRANSPORTISTA":
            return Response(
                {"error": "Los transportistas no pueden ver todas las órdenes."},
                status=403
            )

        queryset = self.get_queryset()

        # ==========================
        # Filtros disponibles
        # ==========================

        # Estados
        estado_envio = request.GET.get("estado_envio")
        estado_pago = request.GET.get("estado_pago")

        # Entidades relacionadas
        cliente = request.GET.get("cliente")      # nombre del cliente
        vendedor = request.GET.get("vendedor")    # username del usuario
        envio = request.GET.get("envio")          # id_envio
        producto = request.GET.get("producto")    # nombre del producto

        # Campos directos
        metodo_pago = request.GET.get("metodo_pago")
        id_orden = request.GET.get("id")

        # Rango de fechas
        fecha_desde = request.GET.get("desde")
        fecha_hasta = request.GET.get("hasta")

        # Rangos numéricos
        precio_min = request.GET.get("precio_min")
        precio_max = request.GET.get("precio_max")
        peso_min = request.GET.get("peso_min")
        peso_max = request.GET.get("peso_max")

        # Cancelación
        cancelada = request.GET.get("cancelada")

        # ==========================
        # Aplicación de filtros
        # ==========================

        if estado_envio:
            queryset = queryset.filter(estado_de_envio__icontains=estado_envio)

        if estado_pago:
            queryset = queryset.filter(estado_de_pago__icontains=estado_pago)

        if cliente:
            queryset = queryset.filter(id_cliente__nombre__icontains=cliente)

        if vendedor:
            queryset = queryset.filter(id_usuario__username__icontains=vendedor)

        if envio:
            queryset = queryset.filter(id_envio_id=envio)

        if metodo_pago:
            queryset = queryset.filter(metodo_pago__icontains=metodo_pago)

        if id_orden:
            queryset = queryset.filter(id_orden=id_orden)

        # Fecha orden
        if fecha_desde:
            queryset = queryset.filter(fecha_orden__gte=fecha_desde)

        if fecha_hasta:
            queryset = queryset.filter(fecha_orden__lte=fecha_hasta)

        # Rango precio
        if precio_min:
            queryset = queryset.filter(precio_final__gte=precio_min)

        if precio_max:
            queryset = queryset.filter(precio_final__lte=precio_max)

        # Rango peso
        if peso_min:
            queryset = queryset.filter(peso_total__gte=peso_min)

        if peso_max:
            queryset = queryset.filter(peso_total__lte=peso_max)

        # Cancelación
        if cancelada is not None and cancelada != "":
            val = cancelada.lower()
            if val in ["true", "1", "yes", "si"]:
                queryset = queryset.filter(cancelacion=True)
            elif val in ["false", "0", "no"]:
                queryset = queryset.filter(cancelacion=False)

        # Filtrar por producto involucrado
        if producto:
            queryset = queryset.filter(
                detalleorden__id_producto__nombre__icontains=producto
            ).distinct()

        # ==========================
        # Ordenamiento avanzado (?ordering=campo o -campo)
        # ==========================
        ordering = request.GET.get("ordering")
        if ordering:
            queryset = queryset.order_by(ordering)

        # ==========================
        # Paginación
        # ==========================
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = OrdenSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        return Response(OrdenSerializer(queryset, many=True).data)

    # ==========================================================
    #   MIS ÓRDENES (solo vendedor)
    # ==========================================================
    """
    Devuelve únicamente las órdenes creadas por el vendedor autenticado.
    """
    @action(detail=False, methods=['get'])
    def mis_ordenes(self, request):
        """
        Devuelve únicamente las órdenes creadas por el vendedor autenticado.
        """
        usuario = request.user
        if usuario.tipo != "VENDEDOR":
            return Response(
                {"error": "Solo los vendedores pueden ver sus propias órdenes."},
                status=403
            )
        queryset = Orden.objects.filter(id_usuario=usuario)
        serializer = OrdenSerializer(queryset, many=True)
        return Response(serializer.data)

        # ==========================================================
    #   REPORTE RESUMIDO DE ÓRDENES
    # ==========================================================
    """
    Reporte estadístico resumido de órdenes.
    Incluye: total_ordenes, aprobadas, pendientes, canceladas, monto_total.
    """
    @action(detail=False, methods=['get'])
    def reporte(self, request):
        """
        Reporte estadístico resumido de órdenes.
        Incluye:
        - total_ordenes
        - aprobadas
        - pendientes
        - canceladas
        - monto_total
        """
        queryset = Orden.objects.all()
        total = queryset.count()
        aprobadas = queryset.filter(estado_de_envio="APROBADA").count()
        pendientes = queryset.filter(estado_de_envio="PENDIENTE POR APROBACIÓN").count()
        canceladas = queryset.filter(cancelacion=True).count()
        monto_total = sum(o.precio_final for o in queryset)

        return Response({
            "total_ordenes": total,
            "aprobadas": aprobadas,
            "pendientes": pendientes,
            "canceladas": canceladas,
            "monto_total": monto_total
        })

    # ==========================================================
    #   DETALLES DE UNA ORDEN (endpoint dedicado)
    # ==========================================================
    @action(detail=True, methods=['get'])
    def detalles(self, request, pk=None):
        """
        Devuelve todos los DetalleOrden asociados a esta orden.

        URL: GET /api/ordenes/<id>/detalles/
        """
        detalles = DetalleOrden.objects.filter(id_orden_id=pk)
        serializer = DetalleOrdenSerializer(detalles, many=True)
        return Response(serializer.data)


# ==========================================================
#   DETALLE ORDENES: VIEWSET PARA /detalle-ordenes/
# ==========================================================
class DetalleOrdenViewSet(BaseViewSet):
    """
    ViewSet para los detalles de orden.

    Permite filtrar por id_orden usando:
    GET /api/detalle-ordenes/?id_orden=7
    """
    queryset = DetalleOrden.objects.all()
    serializer_class = DetalleOrdenSerializer

    def get_queryset(self):
        qs = super().get_queryset()

        id_orden = self.request.query_params.get("id_orden")
        if not id_orden:
            return qs  # sin filtro → todos

        # Asegurar que sea entero; si no, no devolvemos nada
        try:
            id_orden_int = int(id_orden)
        except ValueError:
            return qs.none()

        return qs.filter(id_orden_id=id_orden_int)