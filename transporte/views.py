# transporte/views.py

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.db.models import F
from decimal import Decimal

from base.models import Orden, Usuario, Envio, Unidad
from inventario.models import Existencia, Lote
from base.utils import registrar_accion


class TransporteViewSet(viewsets.GenericViewSet):
    """
    Módulo del TRANSPORTISTA.

    Reglas clave:
    - Cada transportista es un Usuario (tipo='TRANSPORTISTA').
    - La relación con el envío es: Usuario -> Unidad (id_usuario) -> Envio (id_unidad).
    - Solo puede haber (lógicamente) un envío activo por transportista.
    - Solo se pueden ver y modificar órdenes si el envío está EN CURSO.
    """

    # Necesario para que el router DRF pueda generar basename por defecto si hiciera falta
    queryset = Orden.objects.all()

    # ------------------------------------------------------------------
    # Helpers internos
    # ------------------------------------------------------------------

    def _require_transportista(self, request) -> Usuario:
        usuario = request.user
        if not usuario.is_authenticated:
            raise PermissionDenied("Debes estar autenticado.")
        if getattr(usuario, "tipo", None) != "TRANSPORTISTA":
            raise PermissionDenied("Solo los transportistas pueden acceder a este módulo.")
        return usuario

    def _get_envio_asignado(self, transportista: Usuario):
        """
        Retorna el envío asignado al transportista o None.

        Relación utilizada:
        Envio.id_unidad -> Unidad.id_unidad
        Unidad.id_usuario -> Usuario (transportista)
        """
        return (
            Envio.objects
            .select_related("id_unidad")
            .filter(id_unidad__id_usuario=transportista)
            .exclude(estado__in=["CERRADO", "TERMINADO"])
            .first()
        )

    def _check_orden_pertenece_a_transportista(self, orden: Orden, usuario: Usuario):
        """
        Verifica que la orden pertenezca a un envío cuya unidad está asignada
        al transportista (Usuario).
        """
        if not orden.id_envio:
            raise PermissionDenied("La orden no está asociada a ningún envío.")

        unidad = orden.id_envio.id_unidad
        if not unidad or unidad.id_usuario != usuario:
            raise PermissionDenied("No puedes modificar una orden que no pertenece a tu envío.")

    def _check_envio_en_curso(self, envio: Envio):
        """
        Asegura que el envío esté EN CURSO para poder ver/modificar órdenes.
        """
        if envio.estado != "EN CURSO":
            raise ValidationError(
                {"detail": f"Solo se pueden gestionar órdenes de un envío EN CURSO. Estado actual: {envio.estado}."}
            )

    def _es_asignada_a_envio(self, estado: str) -> bool:
        """Devuelve True si el estado corresponde a ASIGNADA_A_ENVIO (admitiendo variantes)."""
        if not estado:
            return False
        normalizado = (
            estado.strip()
            .upper()
            .replace("_", " ")
            .replace("-", " ")
        )
        return normalizado == "ASIGNADA A ENVIO"

    # ------------------------------------------------------------------
    #   GET /api/base/transporte/mi-envio/
    # ------------------------------------------------------------------
    @action(detail=False, methods=["get"], url_path="mi-envio")
    def mi_envio(self, request):
        """
        Devuelve el envío asignado al transportista autenticado (si existe),
        junto con un resumen de las órdenes.
        """
        usuario = self._require_transportista(request)

        envio = self._get_envio_asignado(usuario)
        if not envio:
            return Response(
                {"mensaje": "No tienes ningún envío asignado actualmente."},
                status=status.HTTP_200_OK,
            )

        ordenes = (
            Orden.objects
            .filter(id_envio=envio)
            .select_related("id_cliente")
        )

        # 👇 Ahora incluimos teléfono del cliente y peso_total de la orden
        ordenes_data = [
            {
                "id_orden": o.id_orden,
                "cliente": o.id_cliente.nombre,
                "direccion": getattr(o.id_cliente, "direccion", ""),
                "telefono_cliente": getattr(o.id_cliente, "telefono", ""),
                "estado_de_envio": o.estado_de_envio,
                "estado_de_pago": o.estado_de_pago,
                "precio_final": o.precio_final,
                "peso_total": o.peso_total,
            }
            for o in ordenes
        ]

        unidad = envio.id_unidad

        # 👇 Exponemos placa, código de unidad, capacidad, fecha del envío y peso total del envío
        data = {
            "id_envio": envio.id_envio,
            "codigo": getattr(envio, "codigo_envio", f"ENV-{envio.id_envio}"),
            "estado": envio.estado,
            # La placa sigue yendo en `unidad` para no romper el front,
            # pero también enviamos el código y la capacidad.
            "unidad": getattr(unidad, "placa", None),
            "unidad_codigo": getattr(unidad, "codigo_unidad", None),
            "unidad_capacidad": getattr(unidad, "capacidad_carga", None),
            "fecha_salida": envio.fecha_salida,
            "peso_total": envio.peso_total,
            "ordenes": ordenes_data,
        }
        return Response(data, status=status.HTTP_200_OK)

    # ------------------------------------------------------------------
    #   POST /api/base/transporte/mi-envio/iniciar-viaje/
    # ------------------------------------------------------------------
    @action(detail=False, methods=["post"], url_path="mi-envio/iniciar-viaje")
    @transaction.atomic
    def iniciar_viaje(self, request):
        """
        Marca el envío asignado al transportista como EN CURSO
        y la unidad de transporte como EN TRÁNSITO.

        Solo se permite iniciar si el envío está en estado LISTO PARA SALIR
        (admitiendo variantes como LISTO_PARA_SALIR, listo para salir, etc.).
        """
        usuario = self._require_transportista(request)

        envio = self._get_envio_asignado(usuario)
        if not envio:
            raise ValidationError({"detail": "No tienes un envío asignado para iniciar."})

        estado_raw = envio.estado or ""
        estado_normalizado = (
            estado_raw.strip()
            .upper()
            .replace("_", " ")
            .replace("-", " ")
        )

        if estado_normalizado != "LISTO PARA SALIR":
            raise ValidationError(
                {
                    "detail": (
                        "Solo puedes iniciar un envío en estado LISTO PARA SALIR. "
                        f"Estado actual: {envio.estado}."
                    )
                }
            )

        # Al iniciar el viaje, todas las órdenes asociadas pasan a EN CURSO
        ordenes_envio = (
            Orden.objects
            .select_for_update()
            .filter(id_envio=envio)
        )
        for o in ordenes_envio:
            # Solo movemos a EN CURSO las órdenes que estén asignadas al envío
            estado_o = (o.estado_de_envio or "").strip().upper().replace("_", " ").replace("-", " ")
            if estado_o == "ASIGNADA A ENVIO":
                o.estado_de_envio = "EN CURSO"
                o.save(update_fields=["estado_de_envio"])

        envio.estado = "EN CURSO"
        envio.save(update_fields=["estado"])

        unidad = envio.id_unidad
        if unidad:
            unidad.estado = "EN TRÁNSITO"
            unidad.save(update_fields=["estado"])

        registrar_accion(
            usuario,
            "Transporte",
            "Iniciar viaje",
            f"El transportista inició el envío {envio.id_envio}",
            id_referencia=envio.id_envio,
        )

        return Response({"mensaje": "Viaje iniciado correctamente."}, status=status.HTTP_200_OK)

    # ------------------------------------------------------------------
    #   GET /api/base/transporte/mi-envio/ordenes/
    # ------------------------------------------------------------------
    @action(detail=False, methods=["get"], url_path="mi-envio/ordenes")
    def ordenes_envio(self, request):
        """
        Lista las órdenes del envío del transportista.

        Solo se permite si el envío está EN CURSO.

        Filtros:
        - ?q=texto (cliente, dirección)
        - ?estado=PREPARADA/ENTREGADA/DEVUELTA/NO ENTREGADA
        """
        usuario = self._require_transportista(request)
        envio = self._get_envio_asignado(usuario)
        if not envio:
            return Response([], status=status.HTTP_200_OK)

        self._check_envio_en_curso(envio)

        q = request.GET.get("q", "").strip()
        estado = request.GET.get("estado", "").strip().upper()

        qs = (
            Orden.objects.filter(id_envio=envio)
            .select_related("id_cliente")
            .prefetch_related("detalleorden_set__id_producto")
        )

        if q:
            qs = qs.filter(id_cliente__nombre__icontains=q) | qs.filter(
                id_cliente__direccion__icontains=q
            )

        if estado:
            qs = qs.filter(estado_de_envio__iexact=estado)

        data = []
        for o in qs:
            detalles = [
                {
                    "id_detalleo": d.id_detalleo,
                    "producto": d.id_producto.nombre,
                    "cantidad": d.cantidad,
                    "peso": str(d.peso_subtotal),
                    "subtotal": str(d.subtotal),
                    "devolucion": getattr(d, "devolucion", False),
                    "cantidad_devolvida": getattr(d, "cantidad_devolvida", 0),
                    "nota": getattr(d, "nota", ""),
                }
                for d in o.detalleorden_set.all()
            ]

            data.append(
                {
                    "id_orden": o.id_orden,
                    "cliente": o.id_cliente.nombre,
                    "direccion": getattr(o.id_cliente, "direccion", ""),
                    "telefono_cliente": getattr(o.id_cliente, "telefono", ""),
                    "estado_de_envio": o.estado_de_envio,
                    "estado_de_pago": o.estado_de_pago,
                    "precio_final": o.precio_final,
                    "peso_total": o.peso_total,
                    "nota": getattr(o, "nota", ""),
                    "detalles": detalles,
                }
            )

        return Response(data, status=status.HTTP_200_OK)

    # ==========================================================
    #   POST /api/base/transporte/<id>/marcar-entregada/
    # ==========================================================
    @action(detail=True, methods=["post"], url_path="marcar-entregada")
    @transaction.atomic
    def marcar_entregada(self, request, pk=None):
        usuario = self._require_transportista(request)

        try:
            orden = (
                Orden.objects
                .select_for_update()
                .get(pk=pk)
            )
        except Orden.DoesNotExist:
            raise ValidationError({"detail": "Orden no encontrada."})

        # ✅ Usamos el helper correcto
        self._check_orden_pertenece_a_transportista(orden, usuario)

        estado_normalizado = (orden.estado_de_envio or "").upper().replace(" ", "_")
        if estado_normalizado != "EN_CURSO":
            raise ValidationError(
                {
                    "detail": (
                        f"No puedes marcar como ENTREGADA una orden en estado "
                        f"{orden.estado_de_envio}."
                    )
                }
            )

        orden.estado_de_envio = "ENTREGADA"
        orden.save(update_fields=["estado_de_envio"])

        registrar_accion(
            usuario,
            "Transporte",
            "Orden entregada",
            f"Orden {orden.id_orden} marcada como ENTREGADA en el envío {orden.id_envio_id}",
            id_referencia=orden.id_orden,
        )

        return Response({"mensaje": "Orden marcada como ENTREGADA."}, status=status.HTTP_200_OK)

    # ==========================================================
    #   POST /api/base/transporte/<id>/marcar-no-entregada/
    # ==========================================================
    @action(detail=True, methods=["post"], url_path="marcar-no-entregada")
    @transaction.atomic
    def marcar_no_entregada(self, request, pk=None):
        usuario = self._require_transportista(request)

        try:
            orden = (
                Orden.objects
                .select_for_update()
                .get(pk=pk)
            )
        except Orden.DoesNotExist:
            raise ValidationError({"detail": "Orden no encontrada."})

        # ✅ Usamos el helper correcto
        self._check_orden_pertenece_a_transportista(orden, usuario)

        estado_normalizado = (orden.estado_de_envio or "").upper().replace(" ", "_")
        if estado_normalizado != "EN_CURSO":
            raise ValidationError(
                {
                    "detail": (
                        f"No puedes marcar como NO ENTREGADA una orden en estado "
                        f"{orden.estado_de_envio}."
                    )
                }
            )

        orden.estado_de_envio = "NO ENTREGADA"
        orden.save(update_fields=["estado_de_envio"])

        registrar_accion(
            usuario,
            "Transporte",
            "Orden no entregada",
            f"Orden {orden.id_orden} marcada como NO ENTREGADA.",
            id_referencia=orden.id_orden,
        )

        return Response({"mensaje": "Orden marcada como NO ENTREGADA."}, status=status.HTTP_200_OK)
    
    # ==========================================================
    #   POST /api/base/transporte/<id>/marcar-devuelta/
    # ==========================================================
    @action(detail=True, methods=["post"], url_path="marcar-devuelta")
    @transaction.atomic
    def marcar_devuelta(self, request, pk=None):
        usuario = self._require_transportista(request)
        nota = request.data.get("nota", "").strip()
        devoluciones = request.data.get("devoluciones", [])
        tipo_devolucion_raw = (request.data.get("tipo_devolucion", "") or "").strip().upper()

        if not nota:
            raise ValidationError({"detail": "Debes indicar una nota explicando por qué la orden fue devuelta."})

        if not isinstance(devoluciones, list) or not devoluciones:
            raise ValidationError({"detail": "Debes indicar al menos un producto devuelto."})

        try:
            orden = (
                Orden.objects
                .select_for_update()
                .get(pk=pk)
            )
        except Orden.DoesNotExist:
            raise ValidationError({"detail": "Orden no encontrada."})

        # Verificamos que la orden le pertenezca al transportista
        self._check_orden_pertenece_a_transportista(orden, usuario)

        # Solo se permite devolución si la orden está en EN CURSO (viaje iniciado)
        estado_normalizado = (orden.estado_de_envio or "").upper().replace(" ", "_")
        if estado_normalizado != "EN_CURSO":
            raise ValidationError(
                {
                    "detail": (
                        f"No puedes marcar como DEVUELTA una orden en estado "
                        f"{orden.estado_de_envio}."
                    )
                }
            )

        # Mapeamos devoluciones por id_detalleo (aceptamos también id_detalle / id_detallec por compatibilidad)
        mapa_devoluciones = {}
        for item in devoluciones:
            raw_det_id = (
                item.get("id_detalleo")
                or item.get("id_detalle")
                or item.get("id_detallec")
            )

            try:
                det_id = int(raw_det_id)
            except (TypeError, ValueError):
                raise ValidationError(
                    {
                        "detail": (
                            "Cada devolución debe incluir un id_detalleo válido "
                            "(o un id_detalle / id_detallec equivalente)."
                        )
                    }
                )

            try:
                cant_dev = int(item.get("cantidad_devolvida", 0))
            except (TypeError, ValueError):
                raise ValidationError({"detail": "La cantidad devuelta debe ser un número entero."})

            if cant_dev < 0:
                raise ValidationError({"detail": "La cantidad devuelta no puede ser negativa."})

            # Nos quedamos con la última cantidad indicada para ese detalle
            mapa_devoluciones[det_id] = cant_dev

        if not any(cant > 0 for cant in mapa_devoluciones.values()):
            raise ValidationError({"detail": "Debes devolver al menos una unidad de algún producto."})

        detalles = (
            orden.detalleorden_set
            .select_for_update()
            .select_related("id_producto")
            .all()
        )

        if not detalles:
            raise ValidationError({"detail": "La orden no tiene detalles asociados."})

        total_subtotal_entregado = Decimal("0")
        total_peso_entregado = Decimal("0")
        total_monto_devuelto = Decimal("0")

        # Recorremos los detalles y aplicamos devoluciones
        for det in detalles:
            original = det.cantidad
            previa_dev = getattr(det, "cantidad_devolvida", 0) or 0
            cant_dev_solicitada = mapa_devoluciones.get(det.id_detalleo, previa_dev)

            if cant_dev_solicitada < previa_dev:
                raise ValidationError(
                    {
                        "detail": (
                            f"No se puede reducir la cantidad devuelta en el detalle {det.id_detalleo}. "
                            f"Actual: {previa_dev}, nueva: {cant_dev_solicitada}."
                        )
                    }
                )

            if cant_dev_solicitada > original:
                raise ValidationError(
                    {
                        "detail": (
                            f"La cantidad devuelta del detalle {det.id_detalleo} ({cant_dev_solicitada}) "
                            f"no puede ser mayor que la cantidad original ({original})."
                        )
                    }
                )

            nueva_dev = cant_dev_solicitada
            delta_devuelta = nueva_dev - previa_dev

            # Reintegramos al inventario solo el delta nuevo
            if delta_devuelta > 0:
                existencia = (
                    Existencia.objects.select_for_update()
                    .filter(id_producto=det.id_producto)
                    .first()
                )

                if existencia is None:
                    existencia = Existencia.objects.create(
                        id_producto=det.id_producto,
                        cantidad=0,
                        estado="DISPONIBLE",
                    )

                Existencia.objects.filter(pk=existencia.pk).update(
                    cantidad=F("cantidad") + delta_devuelta
                )

                # Ajuste de lotes: devolvemos al lote más reciente (mejor esfuerzo)
                lotes = (
                    Lote.objects.select_for_update()
                    .filter(id_producto=det.id_producto)
                    .order_by("-fecha_pedido", "-id_lote")
                )
                primer_lote = lotes.first()
                if primer_lote:
                    Lote.objects.filter(pk=primer_lote.pk).update(
                        cantidad=F("cantidad") + delta_devuelta,
                        estado="ACTIVO",
                    )

            # Actualizamos campos de devolución en el detalle
            det.cantidad_devolvida = nueva_dev
            det.devolucion = nueva_dev > 0
            if nueva_dev > 0:
                det.nota = nota

            # Recalculamos subtotal y peso solo para la parte entregada
            cant_entregada = original - nueva_dev
            precio_unitario = det.precio_unitario or Decimal("0")
            peso_unitario = det.peso_unitario or Decimal("0")

            subtotal_entregado = precio_unitario * Decimal(cant_entregada)
            peso_entregado = peso_unitario * Decimal(cant_entregada)

            det.subtotal = subtotal_entregado
            det.peso_subtotal = peso_entregado
            det.save(update_fields=[
                "cantidad_devolvida",
                "devolucion",
                "nota",
                "subtotal",
                "peso_subtotal",
            ])

            total_subtotal_entregado += subtotal_entregado
            total_peso_entregado += peso_entregado
            total_monto_devuelto += precio_unitario * Decimal(delta_devuelta)

        # Determinamos si la devolución fue total o parcial, en caso de que no venga bien del front
        todas_devuelta = all(
            (getattr(d, "cantidad_devolvida", 0) or 0) == d.cantidad and d.cantidad > 0
            for d in detalles
        )

        if tipo_devolucion_raw not in {"TOTAL", "PARCIAL"}:
            tipo_devolucion = "TOTAL" if todas_devuelta else "PARCIAL"
        else:
            tipo_devolucion = tipo_devolucion_raw

        if tipo_devolucion == "TOTAL" and not todas_devuelta:
            # Coherencia: si se envió TOTAL pero no todas las líneas quedaron devueltas, lo tratamos como parcial
            tipo_devolucion = "PARCIAL"

        # Actualizamos totales de la orden
        orden.precio_final = total_subtotal_entregado
        orden.peso_total = total_peso_entregado

        if hasattr(orden, "nota"):
            orden.nota = nota
            update_fields = ["estado_de_envio", "nota", "precio_final", "peso_total"]
        else:
            update_fields = ["estado_de_envio", "precio_final", "peso_total"]

        if tipo_devolucion == "TOTAL":
            orden.estado_de_envio = "DEVUELTA"
        else:
            orden.estado_de_envio = "DEVOLUCION PARCIAL"

        orden.save(update_fields=update_fields)

        registrar_accion(
            usuario,
            "Transporte",
            "Orden devuelta",
            f"Orden {orden.id_orden} marcada como {orden.estado_de_envio}. Monto devuelto: {total_monto_devuelto}.",
            id_referencia=orden.id_orden,
        )

        return Response(
            {
                "mensaje": "Orden actualizada con devolución.",
                "estado": orden.estado_de_envio,
                "monto_final": str(orden.precio_final),
                "monto_devuelto": str(total_monto_devuelto),
            },
            status=status.HTTP_200_OK,
        )

    # ------------------------------------------------------------------
    #   POST /api/base/transporte/mi-envio/finalizar/
    # ------------------------------------------------------------------
    @action(detail=False, methods=["post"], url_path="mi-envio/finalizar")
    @transaction.atomic
    def finalizar_envio(self, request):
        """
        Marca el envío como TERMINADO.
        Solo si TODAS las órdenes del envío están en:
        - ENTREGADA
        - NO ENTREGADA
        - DEVUELTA
        """
        usuario = self._require_transportista(request)

        envio = self._get_envio_asignado(usuario)
        if not envio:
            raise ValidationError({"detail": "No tienes un envío asignado para finalizar."})

        self._check_envio_en_curso(envio)

        ordenes = Orden.objects.filter(id_envio=envio)
        if not ordenes.exists():
            raise ValidationError({"detail": "El envío no tiene órdenes asociadas."})

        estados_validos = ["ENTREGADA", "NO ENTREGADA", "DEVUELTA", "DEVOLUCION PARCIAL"]

        for o in ordenes:
            if o.estado_de_envio not in estados_validos:
                raise ValidationError(
                    {
                        "detail": (
                            f"No se puede finalizar el envío porque la orden {o.id_orden} "
                            f"está en estado {o.estado_de_envio}."
                        )
                    }
                )

        envio.estado = "TERMINADO"
        envio.save(update_fields=["estado"])

        unidad = envio.id_unidad
        if unidad:
            unidad.estado = "DISPONIBLE"
            unidad.save(update_fields=["estado"])

        registrar_accion(
            usuario,
            "Transporte",
            "Finalizar envío",
            f"El transportista marcó como TERMINADO el envío {envio.id_envio}.",
            id_referencia=envio.id_envio,
        )

        return Response({"mensaje": "Envío finalizado correctamente."}, status=status.HTTP_200_OK)