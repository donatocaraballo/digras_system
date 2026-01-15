# base/views.py

import random
import string
from decimal import Decimal

from django.utils import timezone
from django.db.models import Sum, Count, Q
from django.db import transaction

from rest_framework import status, permissions
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token

from base.viewsets import BaseViewSet
from .utils import registrar_accion

from .models import (
    Usuario,
    RegistroAccion,
    Cliente,
    Orden,
    DetalleOrden,
    Envio,
    Unidad,
)

from .serializers import (
    UsuarioSerializer,
    RegistroAccionSerializer,
    ClienteSerializer,
    OrdenSerializer,
    DetalleOrdenSerializer,
    EnvioSerializer,
    UnidadSerializer,
)

# ============================================================
#   CONSTANTES (SINGLE SOURCE OF TRUTH)
# ============================================================

# ✅ Estado correcto de creación de ENVÍO (no confundir con aprobación de órdenes)
ESTADO_CREACION_ENVIO = "PENDIENTE POR ASIGNACION"

# Estado de orden cuando se asigna a un envío
ESTADO_ORDEN_ASIGNADA_ENVIO = "ASIGNADA_A_ENVIO"

# Estado de orden disponible para asignación (tu UI usa PREPARADA)
ESTADO_ORDEN_DISPONIBLE_PARA_ENVIO = "PREPARADA"

# Estados finalizados de envío
ESTADOS_ENVIO_FINALIZADOS = {"TERMINADO", "FINALIZADO", "CERRADO", "ENTREGADO"}

# Estados de unidad
UNIDAD_ACTIVA = "ACTIVA"
UNIDAD_DISPONIBLE = "DISPONIBLE"
UNIDAD_RESERVADA = "RESERVADA"
UNIDAD_EN_TRANSITO = "EN TRANSITO"
UNIDAD_INACTIVA = "INACTIVA"


def _norm_estado(value: str) -> str:
    return (value or "").strip().replace("_", " ").upper()


# ============================================================
#   USUARIOS
# ============================================================

class UsuarioViewSet(BaseViewSet):
    """
    CRUD de usuarios del sistema.
    Usado típicamente por Gerente / Administrador.
    Incluye lógica de recuperación de contraseña PÚBLICA.
    """

    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    search_fields = ["username", "first_name", "last_name", "tipo"]
    ordering_fields = ["id_usuario", "username"]

    @action(
        detail=False,
        methods=["post"],
        url_path="solicitar-reset",
        permission_classes=[permissions.AllowAny],
    )
    def solicitar_reset(self, request):
        email = request.data.get("email")
        if not email:
            return Response({"error": "Debes proporcionar un correo electrónico."}, status=400)

        usuario = Usuario.objects.filter(email=email).first()

        # Por seguridad: si no existe, simulamos éxito
        if not usuario:
            return Response({"mensaje": "Si el correo existe, se ha enviado un código."}, status=200)

        codigo = "".join(random.choices(string.digits, k=6))
        usuario.codigo_recuperacion = codigo
        usuario.fecha_recuperacion = timezone.now()
        usuario.save()

        print("========================================")
        print(f"🔐 CÓDIGO DE RECUPERACIÓN PARA {email}: {codigo}")
        print("========================================")

        return Response({"mensaje": "Código enviado a tu correo."}, status=200)

    @action(
        detail=False,
        methods=["post"],
        url_path="confirmar-reset",
        permission_classes=[permissions.AllowAny],
    )
    def confirmar_reset(self, request):
        email = request.data.get("email")
        codigo = request.data.get("codigo")
        nueva_password = request.data.get("nueva_password")

        if not email or not codigo or not nueva_password:
            return Response({"error": "Faltan datos requeridos."}, status=400)

        usuario = Usuario.objects.filter(email=email).first()
        if not usuario:
            return Response({"error": "Usuario no encontrado."}, status=404)

        if usuario.codigo_recuperacion != codigo:
            return Response({"error": "El código es incorrecto."}, status=400)

        usuario.set_password(nueva_password)
        usuario.codigo_recuperacion = None
        usuario.save()

        return Response({"mensaje": "Contraseña actualizada correctamente. Ya puedes iniciar sesión."}, status=200)


# ============================================================
#   REGISTRO DE ACCIONES
# ============================================================

class RegistroAccionViewSet(BaseViewSet):
    queryset = RegistroAccion.objects.all().order_by("-fecha_y_hora")
    serializer_class = RegistroAccionSerializer
    search_fields = ["modulo", "accion", "descripcion"]
    ordering_fields = ["fecha_y_hora", "id_registro"]


# ============================================================
#   CLIENTES (LÓGICA ESPECIAL)
# ============================================================

class ClienteViewSet(BaseViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ["nombre", "correo", "telefono"]
    ordering_fields = ["nombre", "id_cliente"]

    def _asegurar_vendedor_propietario(self, cliente: Cliente):
        usuario = self.request.user

        if getattr(usuario, "tipo", None) != "VENDEDOR":
            raise PermissionDenied("Solo los vendedores pueden gestionar clientes.")

        if cliente.id_usuario_id != usuario.pk:
            raise PermissionDenied("Solo el vendedor asociado a este cliente puede gestionarlo.")

    def _todas_ordenes_cerradas(self, cliente: Cliente) -> bool:
        estados_cerrados = ["ENTREGADA", "CANCELADA", "DEVUELTA"]
        qs = Orden.objects.filter(id_cliente=cliente)
        abiertas = qs.exclude(estado_de_envio__in=estados_cerrados).exclude(cancelacion=True)
        return not abiertas.exists()

    def get_queryset(self):
        usuario = self.request.user
        if not usuario.is_authenticated:
            return Cliente.objects.none()

        tipo = getattr(usuario, "tipo", None)

        if tipo == "VENDEDOR":
            base_qs = Cliente.objects.filter(id_usuario=usuario)
        elif tipo in ["GERENTE", "ADMINISTRADOR"]:
            base_qs = Cliente.objects.all()
        else:
            return Cliente.objects.none()

        estados_activos = [
            "PENDIENTE POR APROBACION",
            "PENDIENTE POR APROBACIÓN",
            "APROBADA",
            "PREPARADA",
            ESTADO_ORDEN_ASIGNADA_ENVIO,
            "EN_CURSO",
        ]

        return base_qs.annotate(
            total_ordenes=Count("orden", distinct=True),
            ordenes_activas=Count(
                "orden",
                filter=Q(orden__estado_de_envio__in=estados_activos, orden__cancelacion=False),
                distinct=True,
            ),
        )

    def perform_create(self, serializer):
        usuario = self.request.user
        if getattr(usuario, "tipo", None) != "VENDEDOR":
            raise PermissionDenied("Solo los vendedores pueden crear clientes.")

        cliente = serializer.save(id_usuario=usuario, activo=True)
        registrar_accion(usuario, "Clientes", "Crear cliente", f"Creación del cliente {cliente.nombre}", id_referencia=cliente.id_cliente)

    def perform_update(self, serializer):
        usuario = self.request.user
        cliente: Cliente = serializer.instance

        if getattr(usuario, "tipo", None) == "VENDEDOR" and cliente.id_usuario != usuario:
            raise PermissionDenied("No puedes editar un cliente que no te pertenece.")

        self._asegurar_vendedor_propietario(cliente)

        old_activo = getattr(cliente, "activo", True)
        new_activo = serializer.validated_data.get("activo", old_activo)

        if old_activo and not new_activo:
            if not self._todas_ordenes_cerradas(cliente):
                raise ValidationError({"detail": "No puedes desactivar este cliente porque tiene órdenes aún en proceso."})

        cliente_actualizado = serializer.save()

        if old_activo and not new_activo:
            accion = "Desactivar cliente"
        elif not old_activo and new_activo:
            accion = "Activar cliente"
        else:
            accion = "Editar cliente"

        registrar_accion(usuario, "Clientes", accion, f"{accion} {cliente_actualizado.nombre}", id_referencia=cliente_actualizado.id_cliente)

    def update(self, request, *args, **kwargs):
        cliente = self.get_object()
        self._asegurar_vendedor_propietario(cliente)
        data = request.data.copy()
        data.pop("id_usuario", None)
        serializer = self.get_serializer(cliente, data=data, partial=False)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def partial_update(self, request, *args, **kwargs):
        cliente = self.get_object()
        self._asegurar_vendedor_propietario(cliente)
        data = request.data.copy()
        data.pop("id_usuario", None)
        serializer = self.get_serializer(cliente, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        usuario = request.user
        cliente = self.get_object()
        self._asegurar_vendedor_propietario(cliente)

        if Orden.objects.filter(id_cliente=cliente).exists():
            raise ValidationError("No puedes eliminar este cliente porque tiene órdenes asociadas. En su lugar, desactívalo.")

        nombre = cliente.nombre
        id_cli = cliente.id_cliente
        response = super().destroy(request, *args, **kwargs)

        registrar_accion(usuario, "Clientes", "Eliminar cliente", f"Cliente eliminado: {nombre}", id_referencia=id_cli)
        return response


# ============================================================
#   ENVÍOS (SINGLE SOURCE OF TRUTH + REMOVER ORDEN)
# ============================================================

class EnvioViewSet(BaseViewSet):
    queryset = Envio.objects.all().select_related("id_unidad")
    serializer_class = EnvioSerializer
    search_fields = ["codigo_envio"]
    ordering_fields = ["fecha_salida", "fecha_llegada", "id_envio"]

    # ---------------------------
    #   Helpers de rol
    # ---------------------------
    def _es_gerente_o_admin(self, usuario) -> bool:
        return getattr(usuario, "tipo", None) in ["GERENTE", "ADMINISTRADOR"]

    def _es_almacenista(self, usuario) -> bool:
        return getattr(usuario, "tipo", None) == "ALMACENISTA"

    def _es_transportista(self, usuario) -> bool:
        return getattr(usuario, "tipo", None) == "TRANSPORTISTA"

    # ---------------------------
    #   Helpers (single source of truth)
    # ---------------------------
    def _recalcular_peso_envio(self, envio: Envio) -> Decimal:
        total = Orden.objects.filter(id_envio=envio).aggregate(total=Sum("peso_total")).get("total")
        return total or Decimal("0")

    def _validar_capacidad(self, unidad: Unidad, peso_total: Decimal):
        cap = unidad.capacidad_carga or Decimal("0")
        if cap > 0 and peso_total >= cap:
            raise ValidationError({"detail": f"No permitido: peso total ({peso_total}) >= capacidad ({cap})."})

    def _validar_envio_editable(self, envio: Envio):
        if _norm_estado(envio.estado) != _norm_estado(ESTADO_CREACION_ENVIO):
            raise ValidationError({"detail": "Solo puedes modificar envíos en PENDIENTE POR ASIGNACION."})

    def _validar_unidad_disponible(self, unidad: Unidad, envio_actual: Envio = None):
        # Si está inactiva, reservada o en tránsito, no se puede seleccionar
        if _norm_estado(unidad.estado) in {_norm_estado(UNIDAD_INACTIVA), _norm_estado(UNIDAD_RESERVADA), _norm_estado(UNIDAD_EN_TRANSITO)}:
            raise ValidationError({"detail": "La unidad no está disponible (INACTIVA/RESERVADA/EN TRANSITO)."})

        qs = Envio.objects.filter(id_unidad=unidad).exclude(estado__in=list(ESTADOS_ENVIO_FINALIZADOS))
        if envio_actual:
            qs = qs.exclude(pk=envio_actual.pk)
        if qs.exists():
            raise ValidationError({"detail": "La unidad seleccionada ya tiene un envío activo."})

    def _sync_unidad_estado_por_envio(self, envio: Envio):
        """
        Backend manda la verdad:
          - crear/pendiente => RESERVADA
          - asignado/listo/en curso => EN TRANSITO
          - terminado => ACTIVA
        """
        unidad = envio.id_unidad
        if _norm_estado(unidad.estado) == _norm_estado(UNIDAD_INACTIVA):
            return  # no tocar

        est = _norm_estado(envio.estado)
        if est == _norm_estado(ESTADO_CREACION_ENVIO):
            target = UNIDAD_RESERVADA
        elif est in {_norm_estado(x) for x in ESTADOS_ENVIO_FINALIZADOS}:
            target = UNIDAD_ACTIVA
        else:
            target = UNIDAD_EN_TRANSITO

        if _norm_estado(unidad.estado) != _norm_estado(target):
            unidad.estado = target
            unidad.save(update_fields=["estado"])

    # ---------------------------
    #   CREATE / UPDATE
    # ---------------------------
    def perform_create(self, serializer):
        usuario = self.request.user
        if not self._es_gerente_o_admin(usuario):
            raise PermissionDenied("Solo el gerente o el administrador pueden crear envíos.")

        with transaction.atomic():
            unidad = serializer.validated_data.get("id_unidad")
            if not unidad:
                raise ValidationError({"id_unidad": "Debes seleccionar una unidad."})

            self._validar_unidad_disponible(unidad)

            envio = serializer.save(
                estado=serializer.validated_data.get("estado") or ESTADO_CREACION_ENVIO,
                fecha_salida=serializer.validated_data.get("fecha_salida") or timezone.now(),
                peso_total=Decimal("0"),
            )

            registrar_accion(usuario, "Envíos", "Crear envío", f"Creación del envío {envio.codigo_envio}", id_referencia=envio.id_envio)

            # single source: unidad reservada
            self._sync_unidad_estado_por_envio(envio)

    def perform_update(self, serializer):
        usuario = self.request.user
        if not self._es_gerente_o_admin(usuario):
            raise PermissionDenied("Solo el gerente o el administrador pueden modificar envíos.")

        envio = serializer.instance
        self._validar_envio_editable(envio)

        old_unidad = envio.id_unidad

        with transaction.atomic():
            envio = serializer.save()

            # Si cambió unidad, validar disponibilidad + capacidad con peso actual
            if envio.id_unidad_id != old_unidad.id_unidad:
                self._validar_unidad_disponible(envio.id_unidad, envio_actual=envio)

                peso_actual = self._recalcular_peso_envio(envio)
                self._validar_capacidad(envio.id_unidad, peso_actual)

            # recalcular peso
            envio.peso_total = self._recalcular_peso_envio(envio)
            envio.save(update_fields=["peso_total"])

        registrar_accion(usuario, "Envíos", "Editar envío", f"Edición del envío {envio.codigo_envio}", id_referencia=envio.id_envio)

        # sync estados unidad
        self._sync_unidad_estado_por_envio(envio)

        # unidad vieja puede quedar activa si ya no tiene envíos
        try:
            ultimo = Envio.objects.filter(id_unidad=old_unidad).exclude(estado__in=list(ESTADOS_ENVIO_FINALIZADOS)).first()
            if not ultimo:
                old_unidad.estado = UNIDAD_ACTIVA
                old_unidad.save(update_fields=["estado"])
        except Exception:
            pass

    # ---------------------------
    #   Asignar órdenes
    # ---------------------------
    @action(detail=True, methods=["post"], url_path="asignar_ordenes")
    def asignar_ordenes(self, request, pk=None):
        usuario = request.user
        if not self._es_gerente_o_admin(usuario):
            raise PermissionDenied("Solo el gerente o el administrador pueden asignar órdenes a un envío.")

        envio = self.get_object()
        self._validar_envio_editable(envio)

        ids_ordenes = request.data.get("ordenes", [])
        if not isinstance(ids_ordenes, list) or not ids_ordenes:
            raise ValidationError({"ordenes": "Debes enviar una lista de IDs de órdenes a asignar."})

        estados_permitidos = ["APROBADA", "POR_PREPARACION", ESTADO_ORDEN_DISPONIBLE_PARA_ENVIO]

        with transaction.atomic():
            ordenes = Orden.objects.select_for_update().filter(id_orden__in=ids_ordenes)
            if ordenes.count() != len(ids_ordenes):
                raise ValidationError({"detail": "Alguna de las órdenes indicadas no existe."})

            for o in ordenes:
                if o.estado_de_envio not in estados_permitidos:
                    raise ValidationError({"detail": f"La orden {o.id_orden} no está en un estado permitido para asignarse."})
                if o.id_envio and o.id_envio_id != envio.id_envio:
                    raise ValidationError({"detail": f"La orden {o.id_orden} ya está asignada a otro envío."})

            peso_actual = self._recalcular_peso_envio(envio)
            peso_nuevo = ordenes.aggregate(total=Sum("peso_total")).get("total") or Decimal("0")
            self._validar_capacidad(envio.id_unidad, peso_actual + peso_nuevo)

            ordenes.update(id_envio=envio, estado_de_envio=ESTADO_ORDEN_ASIGNADA_ENVIO)

            envio.peso_total = self._recalcular_peso_envio(envio)
            envio.save(update_fields=["peso_total"])

        registrar_accion(usuario, "Envíos", "Asignar órdenes", f"Se asignaron órdenes {ids_ordenes} al envío {envio.codigo_envio}.", id_referencia=envio.id_envio)

        # unidad sigue reservada
        self._sync_unidad_estado_por_envio(envio)

        serializer = self.get_serializer(envio)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # ---------------------------
    #   ✅ Remover órdenes (el “patch” correcto)
    # ---------------------------
    @action(detail=True, methods=["post"], url_path="remover_ordenes")
    def remover_ordenes(self, request, pk=None):
        """
        FRONT debe usar:
          POST /base/envios/<id_envio>/remover_ordenes/
          {"ordenes":[12, 13]}
        """
        usuario = request.user
        if not self._es_gerente_o_admin(usuario):
            raise PermissionDenied("Solo el gerente o el administrador pueden remover órdenes de un envío.")

        envio = self.get_object()
        self._validar_envio_editable(envio)

        ids_ordenes = request.data.get("ordenes", [])
        if not isinstance(ids_ordenes, list) or not ids_ordenes:
            raise ValidationError({"ordenes": "Debes enviar una lista de IDs de órdenes a remover."})

        with transaction.atomic():
            ordenes = Orden.objects.select_for_update().filter(id_orden__in=ids_ordenes, id_envio=envio)
            if ordenes.count() != len(ids_ordenes):
                raise ValidationError({"detail": "Alguna de las órdenes indicadas no pertenece a este envío."})

            ordenes.update(id_envio=None, estado_de_envio=ESTADO_ORDEN_DISPONIBLE_PARA_ENVIO)

            envio.peso_total = self._recalcular_peso_envio(envio)
            envio.save(update_fields=["peso_total"])

        registrar_accion(usuario, "Envíos", "Remover órdenes", f"Se removieron órdenes {ids_ordenes} del envío {envio.codigo_envio}.", id_referencia=envio.id_envio)

        # unidad se mantiene reservada
        self._sync_unidad_estado_por_envio(envio)

        serializer = self.get_serializer(envio)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="remover_orden")
    def remover_orden(self, request, pk=None):
        """
        Shortcut:
          POST /base/envios/<id_envio>/remover_orden/
          {"id_orden": 12}
        """
        orden_id = request.data.get("id_orden")
        if not orden_id:
            raise ValidationError({"id_orden": "Debes enviar id_orden."})

        request.data["ordenes"] = [orden_id]
        return self.remover_ordenes(request, pk=pk)

    # ---------------------------
    #   Cerrar envío (GERENTE / ADMIN)
    # ---------------------------
    @action(detail=True, methods=["post"], url_path="cerrar")
    def cerrar(self, request, pk=None):
        usuario = request.user
        if not self._es_gerente_o_admin(usuario):
            raise PermissionDenied("Solo el gerente o el administrador pueden cerrar envíos.")

        envio = self.get_object()
        self._validar_envio_editable(envio)

        with transaction.atomic():
            envio.peso_total = self._recalcular_peso_envio(envio)
            envio.save(update_fields=["peso_total"])

            self._validar_capacidad(envio.id_unidad, envio.peso_total)

            if not Orden.objects.filter(id_envio=envio).exists():
                raise ValidationError({"detail": "No puedes cerrar un envío sin órdenes."})

            envio.estado = "ASIGNADO"
            envio.save(update_fields=["estado"])

        registrar_accion(usuario, "Envíos", "Cerrar envío", f"Envío {envio.codigo_envio} marcado como ASIGNADO.", id_referencia=envio.id_envio)

        # unidad => en tránsito
        self._sync_unidad_estado_por_envio(envio)

        serializer = self.get_serializer(envio)
        return Response({"mensaje": "Envío cerrado.", "envio": serializer.data}, status=status.HTTP_200_OK)

    # ---------------------------
    #   Marcar listo para salir (ALMACENISTA)
    # ---------------------------
    @action(detail=True, methods=["post"], url_path="marcar_listo_salida")
    def marcar_listo_salida(self, request, pk=None):
        usuario = request.user

        if not usuario.is_authenticated:
            raise PermissionDenied("Debes iniciar sesión.")
        if not self._es_almacenista(usuario):
            raise PermissionDenied("Solo el almacenista puede marcar un envío como listo para salir.")

        envio = self.get_object()

        if _norm_estado(envio.estado) != "ASIGNADO":
            raise ValidationError({"detail": "Solo puedes marcar LISTO PARA SALIR un envío en estado ASIGNADO."})

        if not Orden.objects.filter(id_envio=envio).exists():
            raise ValidationError({"detail": "Este envío no tiene órdenes asociadas."})

        envio.estado = "LISTO_PARA_SALIR"
        envio.save(update_fields=["estado"])

        registrar_accion(usuario, "Envíos", "Marcar listo para salir", f"Envío {envio.codigo_envio} marcado como LISTO PARA SALIR.", id_referencia=envio.id_envio)

        # unidad => en tránsito
        self._sync_unidad_estado_por_envio(envio)

        serializer = self.get_serializer(envio)
        return Response({"mensaje": "Envío marcado como LISTO PARA SALIR.", "envio": serializer.data}, status=status.HTTP_200_OK)

    # ---------------------------
    #   Marcar TERMINADO (TRANSPORTISTA)
    # ---------------------------
    @action(detail=True, methods=["post"], url_path="marcar_terminado")
    def marcar_terminado(self, request, pk=None):
        usuario = request.user

        if not usuario.is_authenticated:
            raise PermissionDenied("Debes iniciar sesión.")
        if not self._es_transportista(usuario):
            raise PermissionDenied("Solo el transportista puede marcar el envío como terminado.")

        envio = self.get_object()

        # Validar que el transportista sea el asignado a la unidad
        if envio.id_unidad.id_usuario_id != usuario.pk:
            raise PermissionDenied("No puedes terminar un envío de otra unidad.")

        with transaction.atomic():
            envio.estado = "TERMINADO"
            envio.fecha_llegada = timezone.now()
            envio.save(update_fields=["estado", "fecha_llegada"])

        registrar_accion(usuario, "Envíos", "Marcar terminado", f"Envío {envio.codigo_envio} marcado como TERMINADO.", id_referencia=envio.id_envio)

        # unidad => activa
        self._sync_unidad_estado_por_envio(envio)

        serializer = self.get_serializer(envio)
        return Response({"mensaje": "Envío terminado.", "envio": serializer.data}, status=status.HTTP_200_OK)

    # ---------------------------
    #   Envíos para verificar (ALMACENISTA) - mantengo tu estructura
    # ---------------------------
    @action(detail=False, methods=["get"], url_path="para_verificar")
    def para_verificar(self, request, *args, **kwargs):
        usuario = request.user

        if not usuario.is_authenticated:
            raise PermissionDenied("Debes iniciar sesión.")
        if not self._es_almacenista(usuario):
            raise PermissionDenied("Solo el almacenista puede ver los envíos para preparar.")

        envios_qs = Envio.objects.filter(estado="ASIGNADO").select_related("id_unidad")

        data = []
        for envio in envios_qs:
            ordenes_qs = Orden.objects.filter(id_envio=envio)
            total_ordenes = ordenes_qs.count()
            ordenes_preparadas = ordenes_qs.filter(estado_de_envio=ESTADO_ORDEN_DISPONIBLE_PARA_ENVIO).count()

            data.append(
                {
                    "id_envio": envio.id_envio,
                    "codigo_envio": envio.codigo_envio,
                    "estado": envio.estado,
                    "peso_total": envio.peso_total,
                    "id_unidad": envio.id_unidad_id,
                    "unidad_codigo": getattr(envio.id_unidad, "codigo_unidad", None),
                    "unidad_placa": getattr(envio.id_unidad, "placa", None),
                    "cantidad_ordenes_total": total_ordenes,
                    "cantidad_ordenes_almacenista": ordenes_preparadas,
                }
            )

        return Response(data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"], url_path="detalle_verificacion")
    def detalle_verificacion(self, request, pk=None):
        usuario = request.user

        if not usuario.is_authenticated:
            raise PermissionDenied("Debes iniciar sesión.")
        if not self._es_almacenista(usuario):
            raise PermissionDenied("Solo el almacenista puede ver el detalle de envío para verificación.")

        envio = self.get_object()
        ordenes_qs = Orden.objects.filter(id_envio=envio).select_related("id_cliente")

        ordenes_data = []
        for o in ordenes_qs:
            ordenes_data.append(
                {
                    "id_orden": o.id_orden,
                    "cliente_nombre": getattr(o.id_cliente, "nombre", None),
                    "precio_final": getattr(o, "precio_final", None),
                    "peso_total": getattr(o, "peso_total", None),
                    "estado_de_envio": o.estado_de_envio,
                }
            )

        envio_data = {
            "id_envio": envio.id_envio,
            "codigo_envio": envio.codigo_envio,
            "estado": envio.estado,
            "peso_total": envio.peso_total,
            "id_unidad": envio.id_unidad_id,
            "unidad_codigo": getattr(envio.id_unidad, "codigo_unidad", None),
            "unidad_placa": getattr(envio.id_unidad, "placa", None),
            "fecha_salida": envio.fecha_salida,
        }

        return Response({"envio": envio_data, "ordenes": ordenes_data}, status=status.HTTP_200_OK)


# ============================================================
#   DETALLE DE ÓRDENES
# ============================================================

class DetalleOrdenViewSet(BaseViewSet):
    queryset = DetalleOrden.objects.all()
    serializer_class = DetalleOrdenSerializer
    search_fields = ["id_orden__id_orden", "id_producto__nombre"]


# ============================================================
#   UNIDADES
# ============================================================

class UnidadViewSet(BaseViewSet):
    queryset = Unidad.objects.all()
    serializer_class = UnidadSerializer
    search_fields = ["codigo_unidad", "placa"]
    ordering_fields = ["estado"]

    def _es_gerente_o_admin(self, usuario):
        return getattr(usuario, "tipo", None) in ["GERENTE", "ADMINISTRADOR"]

    def perform_create(self, serializer):
        usuario = self.request.user
        if not self._es_gerente_o_admin(usuario):
            raise PermissionDenied("Solo el gerente o el administrador pueden crear unidades de transporte.")

        if "id_usuario" not in serializer.validated_data:
            raise ValidationError({"id_usuario": "Debes seleccionar un transportista para la unidad."})

        # Evita 2 unidades para el mismo transportista (consistencia)
        id_usuario = serializer.validated_data["id_usuario"].id_usuario
        if Unidad.objects.filter(id_usuario_id=id_usuario).exists():
            raise ValidationError({"detail": "Este transportista ya tiene una unidad asignada."})

        unidad = serializer.save()

        registrar_accion(usuario, "Unidades", "Crear unidad", f"Creación de la unidad {unidad.codigo_unidad}", id_referencia=unidad.id_unidad)

    def perform_update(self, serializer):
        usuario = self.request.user
        if not self._es_gerente_o_admin(usuario):
            raise PermissionDenied("Solo el gerente o el administrador pueden editar unidades de transporte.")

        unidad = serializer.instance
        new_user = serializer.validated_data.get("id_usuario", unidad.id_usuario)
        if Unidad.objects.filter(id_usuario=new_user).exclude(pk=unidad.pk).exists():
            raise ValidationError({"detail": "Este transportista ya tiene una unidad asignada."})

        unidad = serializer.save()
        registrar_accion(usuario, "Unidades", "Editar unidad", f"Edición de la unidad {unidad.codigo_unidad}", id_referencia=unidad.id_unidad)

    def destroy(self, request, *args, **kwargs):
        usuario = request.user
        unidad = self.get_object()

        if not self._es_gerente_o_admin(usuario):
            raise PermissionDenied("Solo el gerente o el administrador pueden eliminar unidades de transporte.")

        # Solo si NO tiene envíos activos
        if Envio.objects.filter(id_unidad=unidad).exclude(estado__in=list(ESTADOS_ENVIO_FINALIZADOS)).exists():
            raise ValidationError("No puedes eliminar esta unidad porque tiene envíos activos.")

        response = super().destroy(request, *args, **kwargs)
        registrar_accion(usuario, "Unidades", "Eliminar unidad", f"Unidad eliminada: {unidad.codigo_unidad}", id_referencia=unidad.id_unidad)
        return response


# ============================================================
#   LOGIN PERSONALIZADO
# ============================================================

class CustomLogin(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        username = request.data.get("username")
        user_obj = Usuario.objects.filter(username=username).first()

        if user_obj is not None and not user_obj.is_active:
            return Response({"detail": "CUENTA_DESACTIVADA"}, status=status.HTTP_403_FORBIDDEN)

        serializer = self.serializer_class(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        token, created = Token.objects.get_or_create(user=user)
        user_data = UsuarioSerializer(user).data

        return Response({"token": token.key, "user": user_data})