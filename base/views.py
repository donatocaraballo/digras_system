# base/views.py

import random
import string
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import F, Sum
from django.db import transaction
from rest_framework import status, permissions, viewsets
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
#   CONSTANTES
# ============================================================

ESTADO_CREACION_ENVIO = "PENDIENTE POR APROBACION"
ESTADO_ORDEN_ASIGNADA_ENVIO = "ASIGNADA_A_ENVIO"


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

    # ------------------------------------------------------------------
    # 1. SOLICITAR CÓDIGO (Recuperación de Contraseña)
    # 🚨 FIX: permission_classes=[permissions.AllowAny] para acceso público
    # ------------------------------------------------------------------
    @action(detail=False, methods=['post'], url_path='solicitar-reset', permission_classes=[permissions.AllowAny])
    def solicitar_reset(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"error": "Debes proporcionar un correo electrónico."}, status=400)

        usuario = Usuario.objects.filter(email=email).first()
        
        # Por seguridad, si el usuario no existe, simulamos éxito para no revelar correos.
        if not usuario:
            return Response({"mensaje": "Si el correo existe, se ha enviado un código."}, status=200)

        # Generar código de 6 dígitos
        codigo = ''.join(random.choices(string.digits, k=6))
        usuario.codigo_recuperacion = codigo
        usuario.fecha_recuperacion = timezone.now()
        usuario.save()

        # Enviar correo (O imprimir en consola si no tienes SMTP configurado)
        print(f"========================================")
        print(f"🔐 CÓDIGO DE RECUPERACIÓN PARA {email}: {codigo}")
        print(f"========================================")
        
        # Descomentar esto cuando tengas el SMTP real en settings.py
        # try:
        #     send_mail(
        #         'Código de recuperación - DIGRAS',
        #         f'Tu código de seguridad es: {codigo}',
        #         settings.EMAIL_HOST_USER,
        #         [email],
        #         fail_silently=False,
        #     )
        # except Exception as e:
        #     print(f"Error SMTP: {e}")

        return Response({"mensaje": "Código enviado a tu correo."}, status=200)

    # ------------------------------------------------------------------
    # 2. CONFIRMAR CAMBIO (Recuperación de Contraseña)
    # 🚨 FIX: permission_classes=[permissions.AllowAny] para acceso público
    # ------------------------------------------------------------------
    @action(detail=False, methods=['post'], url_path='confirmar-reset', permission_classes=[permissions.AllowAny])
    def confirmar_reset(self, request):
        email = request.data.get('email')
        codigo = request.data.get('codigo')
        nueva_password = request.data.get('nueva_password')

        if not email or not codigo or not nueva_password:
            return Response({"error": "Faltan datos requeridos."}, status=400)

        usuario = Usuario.objects.filter(email=email).first()

        if not usuario:
            return Response({"error": "Usuario no encontrado."}, status=404)

        if usuario.codigo_recuperacion != codigo:
            return Response({"error": "El código es incorrecto."}, status=400)

        # Cambiar la contraseña y limpiar el código
        usuario.set_password(nueva_password)
        usuario.codigo_recuperacion = None
        usuario.save()

        return Response({"mensaje": "Contraseña actualizada correctamente. Ya puedes iniciar sesión."}, status=200)


# ============================================================
#   REGISTRO DE ACCIONES
# ============================================================

class RegistroAccionViewSet(BaseViewSet):
    """
    Vista para revisar las acciones registradas en el sistema.
    """

    queryset = RegistroAccion.objects.all().order_by("-fecha_y_hora")
    serializer_class = RegistroAccionSerializer
    search_fields = ["modulo", "accion", "descripcion"]
    ordering_fields = ["fecha_y_hora", "id_registro"]


# ============================================================
#   CLIENTES (LÓGICA ESPECIAL)
# ============================================================

class ClienteViewSet(BaseViewSet):
    """
    Gestión de clientes.

    Reglas de negocio:
    - Listar:
        * VENDEDOR: solo ve sus propios clientes.
        * Otros roles: no ven clientes.
    - Crear:
        * Solo VENDEDOR.
        * Se asocia automáticamente id_usuario = request.user.
        * Cliente activo por defecto (activo=True).
    - Editar (PUT / PATCH):
        * Solo VENDEDOR y además debe ser el vendedor asociado al cliente.
    - Activar / Desactivar:
        * Se hace cambiando el campo 'activo' vía PATCH.
        * Solo VENDEDOR asociado.
        * Desactivar solo si TODAS las órdenes están cerradas:
          ENTREGADA / CANCELADA / DEVUELTA.
          (Si no tiene ninguna orden, también se permite desactivar).
    - Eliminar:
        * Solo VENDEDOR asociado.
        * Solo si NO tiene órdenes asociadas.
    - Registro de acciones:
        * Crear cliente
        * Editar cliente
        * Activar cliente
        * Desactivar cliente
        * Eliminar cliente
    """

    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ["nombre", "correo", "telefono"]
    ordering_fields = ["nombre", "id_cliente"]

    # ---------------------------
    #   Helpers internos
    # ---------------------------
    def _asegurar_vendedor_propietario(self, cliente: Cliente):
        """
        Verifica que:
        - el usuario autenticado sea VENDEDOR
        - y que sea el vendedor asociado al cliente.
        """
        usuario = self.request.user

        if getattr(usuario, "tipo", None) != "VENDEDOR":
            raise PermissionDenied("Solo los vendedores pueden gestionar clientes.")

        if cliente.id_usuario_id != usuario.pk:
            raise PermissionDenied(
                "Solo el vendedor asociado a este cliente puede gestionarlo."
            )

    def _todas_ordenes_cerradas(self, cliente: Cliente) -> bool:
        """
        Devuelve True si TODAS las órdenes del cliente están en estado
        'cerrado' para poder desactivar al cliente.

        Consideramos cerradas:
        - ENTREGADA
        - CANCELADA
        - DEVUELTA

        Y además no debe haber órdenes con cancelacion=False
        en estados intermedios.

        Si el cliente no tiene órdenes, también devuelve True.
        """
        estados_cerrados = [
            "ENTREGADA",
            "CANCELADA",
            "DEVUELTA",
        ]

        qs = Orden.objects.filter(id_cliente=cliente)

        abiertas = qs.exclude(estado_de_envio__in=estados_cerrados).exclude(
            cancelacion=True
        )

        return not abiertas.exists()

    # ---------------------------
    #   Queryset según rol
    # ---------------------------
    def get_queryset(self):
        usuario = self.request.user

        if not usuario.is_authenticated:
            return Cliente.objects.none()

        tipo = getattr(usuario, "tipo", None)

        # Vendedor: solo sus clientes
        if tipo == "VENDEDOR":
            return Cliente.objects.filter(id_usuario=usuario)

        # Gerente o Administrador: todos los clientes
        if tipo in ["GERENTE", "ADMINISTRADOR"]:
            return Cliente.objects.all()

        # Otros roles: nada
        return Cliente.objects.none()

    # ---------------------------
    #   Crear cliente (POST)
    # ---------------------------
    def perform_create(self, serializer):
        usuario = self.request.user

        if getattr(usuario, "tipo", None) != "VENDEDOR":
            raise PermissionDenied("Solo los vendedores pueden crear clientes.")

        cliente = serializer.save(
            id_usuario=usuario,
            activo=True,
        )

        registrar_accion(
            usuario,
            "Clientes",
            "Crear cliente",
            f"Creación del cliente {cliente.nombre}",
            id_referencia=cliente.id_cliente,
        )

    # ---------------------------
    #   Actualizar (PUT / PATCH)
    # ---------------------------
    def perform_update(self, serializer):
        """
        Centraliza la lógica de edición / activar / desactivar.
        """
        usuario = self.request.user
        cliente: Cliente = serializer.instance

        if getattr(usuario, "tipo", None) == "VENDEDOR" and cliente.id_usuario != usuario:
             raise PermissionDenied("No puedes editar un cliente que no te pertenece.")

        self._asegurar_vendedor_propietario(cliente)

        old_activo = getattr(cliente, "activo", True)
        new_activo = serializer.validated_data.get("activo", old_activo)

        # Validar DESACTIVACIÓN
        if old_activo and not new_activo:
            if not self._todas_ordenes_cerradas(cliente):
                raise ValidationError(
                    {
                        "detail": (
                            "No puedes desactivar este cliente porque tiene órdenes aún en proceso. "
                            "Solo se permite desactivar cuando todas las órdenes estén entregadas, "
                            "canceladas o devueltas."
                        )
                    }
                )

        cliente_actualizado = serializer.save()

        if old_activo and not new_activo:
            accion = "Desactivar cliente"
        elif not old_activo and new_activo:
            accion = "Activar cliente"
        else:
            accion = "Editar cliente"

        registrar_accion(
            usuario,
            "Clientes",
            accion,
            f"{accion} {cliente_actualizado.nombre}",
            id_referencia=cliente_actualizado.id_cliente,
        )

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

    # ---------------------------
    #   Eliminar cliente (DELETE)
    # ---------------------------
    def destroy(self, request, *args, **kwargs):
        usuario = request.user
        cliente = self.get_object()

        self._asegurar_vendedor_propietario(cliente)

        if Orden.objects.filter(id_cliente=cliente).exists():
            raise ValidationError(
                "No puedes eliminar este cliente porque tiene órdenes asociadas. "
                "En su lugar, debes desactivarlo."
            )

        nombre = cliente.nombre
        id_cli = cliente.id_cliente

        response = super().destroy(request, *args, **kwargs)

        registrar_accion(
            usuario,
            "Clientes",
            "Eliminar cliente",
            f"Cliente eliminado: {nombre}",
            id_referencia=id_cli,
        )

        return response


# ============================================================
#   ENVÍOS
# ============================================================

class EnvioViewSet(BaseViewSet):
    """
    Gestión de envíos (contenedores de órdenes asignadas a una unidad).

    Reglas:
    - Solo GERENTE y ADMINISTRADOR pueden crear / editar envíos y asignar órdenes.
    - Solo ALMACENISTA puede:
        * Ver los envíos para verificar/preparar (para_verificar)
        * Ver el detalle de un envío (detalle_verificacion)
        * Marcar un envío como listo para salir (marcar_listo_salida)
    - Flujo de estados del envío:
        * Al crear desde gerencia: "PENDIENTE POR APROBACION"
        * Al cerrar desde gerencia: "ASIGNADO"
        * Cuando el ALMACENISTA marca listo:
              -> "LISTO_PARA_SALIR"
    """

    queryset = Envio.objects.all()
    serializer_class = EnvioSerializer
    search_fields = ["codigo_envio"]
    ordering_fields = ["fecha_salida", "fecha_llegada"]

    # ---------------------------
    #   Helpers
    # ---------------------------
    def _es_gerente_o_admin(self, usuario):
        return getattr(usuario, "tipo", None) in ["GERENTE", "ADMINISTRADOR"]

    def _es_almacenista(self, usuario):
        return getattr(usuario, "tipo", None) == "ALMACENISTA"

    # ---------------------------
    #   CREATE / UPDATE
    # ---------------------------
    def perform_create(self, serializer):
        """
        Crear envíos: Solo GERENTE o ADMIN.

        Además de crear el envío, si en el body viene una lista "ordenes"
        (por ejemplo: {"id_unidad": 1, "ordenes": [1, 2, 3]}),
        se asignan esas órdenes al envío recién creado,
        se marcan como ASIGNADA_A_ENVIO y se recalcula el peso_total.
        """
        usuario = self.request.user
        if not self._es_gerente_o_admin(usuario):
            raise PermissionDenied(
                "Solo el gerente o el administrador pueden crear envíos."
            )

        with transaction.atomic():
            # Forzamos estado de creación si no viene
            estado_creacion = serializer.validated_data.get(
                "estado",
                ESTADO_CREACION_ENVIO,
            )
            envio = serializer.save(estado=estado_creacion)

            # Lista opcional de IDs de órdenes que el front quiere asignar de una vez
            ids_ordenes = self.request.data.get("ordenes", [])

            # Permitimos que no se envíen órdenes (crear envío vacío)
            if isinstance(ids_ordenes, list) and ids_ordenes:
                estados_permitidos = [
                    "APROBADA",
                    "POR_PREPARACION",
                    "PREPARADA",
                ]

                ordenes = Orden.objects.select_for_update().filter(
                    id_orden__in=ids_ordenes
                )

                if ordenes.count() != len(ids_ordenes):
                    raise ValidationError(
                        {"detail": "Alguna de las órdenes indicadas no existe."}
                    )

                for o in ordenes:
                    if o.estado_de_envio not in estados_permitidos:
                        raise ValidationError(
                            {
                                "detail": (
                                    f"La orden {o.id_orden} no está en un estado permitido "
                                    "para ser asignada a un envío."
                                )
                            }
                        )
                    if o.id_envio and o.id_envio != envio:
                        raise ValidationError(
                            {
                                "detail": (
                                    f"La orden {o.id_orden} ya está asignada a otro envío."
                                )
                            }
                        )

                # Asignar las órdenes al envío y marcar estado ASIGNADA_A_ENVIO
                ordenes.update(
                    id_envio=envio,
                    estado_de_envio=ESTADO_ORDEN_ASIGNADA_ENVIO,
                )

                # Recalcular peso_total del envío
                total_peso = (
                    Orden.objects.filter(id_envio=envio)
                    .aggregate(total=Sum("peso_total"))
                    .get("total")
                )
                if total_peso is not None:
                    envio.peso_total = total_peso
                    envio.save(update_fields=["peso_total"])

                registrar_accion(
                    usuario,
                    "Envíos",
                    "Crear envío y asignar órdenes",
                    f"Se creó el envío {envio.codigo_envio} y se asignaron las órdenes {ids_ordenes}.",
                    id_referencia=envio.id_envio,
                )
            else:
                registrar_accion(
                    usuario,
                    "Envíos",
                    "Crear envío",
                    f"Creación del envío {envio.codigo_envio}",
                    id_referencia=envio.id_envio,
                )

    def perform_update(self, serializer):
        """
        Actualizar envío: Solo GERENTE o ADMIN,
        excepto en las acciones especiales del almacenista.
        """
        usuario = self.request.user
        if not self._es_gerente_o_admin(usuario):
            raise PermissionDenied(
                "Solo el gerente o el administrador pueden modificar envíos."
            )

        envio = serializer.save()
        registrar_accion(
            usuario,
            "Envíos",
            "Editar envío",
            f"Edición del envío {envio.codigo_envio}",
            id_referencia=envio.id_envio,
        )

    # ---------------------------
    #   Asignar órdenes a un envío (GERENTE / ADMIN)
    # ---------------------------
    @action(detail=True, methods=["post"], url_path="asignar_ordenes")
    def asignar_ordenes(self, request, pk=None):
        """
        POST /api/base/envios/<id>/asignar_ordenes/
        Body: {"ordenes": [1,2,3]}

        Asigna órdenes a un envío. Solo GERENTE / ADMIN.
        Cambia el estado de la orden a ASIGNADA_A_ENVIO
        y recalcula el peso_total del envío.
        """
        usuario = request.user
        if not self._es_gerente_o_admin(usuario):
            raise PermissionDenied(
                "Solo el gerente o el administrador pueden asignar órdenes a un envío."
            )

        envio = self.get_object()
        ids_ordenes = request.data.get("ordenes", [])

        if not isinstance(ids_ordenes, list) or not ids_ordenes:
            raise ValidationError(
                {"ordenes": "Debes enviar una lista de IDs de órdenes a asignar."}
            )

        estados_permitidos = [
            "APROBADA",
            "POR_PREPARACION",
            "PREPARADA",
        ]

        with transaction.atomic():
            ordenes = Orden.objects.select_for_update().filter(
                id_orden__in=ids_ordenes
            )

            if ordenes.count() != len(ids_ordenes):
                raise ValidationError(
                    {"detail": "Alguna de las órdenes no existe."}
                )

            for o in ordenes:
                if o.estado_de_envio not in estados_permitidos:
                    raise ValidationError(
                        {
                            "detail": f"La orden {o.id_orden} no está en un estado permitido para ser asignada."
                        }
                    )
                if o.id_envio and o.id_envio != envio:
                    raise ValidationError(
                        {
                            "detail": f"La orden {o.id_orden} ya está asignada a otro envío."
                        }
                    )

            ordenes.update(
                id_envio=envio,
                estado_de_envio=ESTADO_ORDEN_ASIGNADA_ENVIO,
            )

            total_peso = (
                Orden.objects.filter(id_envio=envio)
                .aggregate(total=Sum("peso_total"))
                .get("total")
            )
            if total_peso is not None:
                envio.peso_total = total_peso
                envio.save(update_fields=["peso_total"])

        registrar_accion(
            usuario,
            "Envíos",
            "Asignar órdenes a envío",
            f"Se asignaron las órdenes {ids_ordenes} al envío {envio.codigo_envio}.",
            id_referencia=envio.id_envio,
        )

        serializer = self.get_serializer(envio)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # ---------------------------
    #   Remover órdenes de un envío (GERENTE / ADMIN)
    # ---------------------------
    @action(detail=True, methods=["post"], url_path="remover_ordenes")
    def remover_ordenes(self, request, pk=None):
        """
        POST /api/base/envios/<id>/remover_ordenes/
        Body: {"ordenes": [1,2,3]}

        Desasigna órdenes de este envío. Solo GERENTE / ADMIN.
        """
        usuario = request.user
        if not self._es_gerente_o_admin(usuario):
            raise PermissionDenied(
                "Solo el gerente o el administrador pueden remover órdenes de un envío."
            )

        envio = self.get_object()
        ids_ordenes = request.data.get("ordenes", [])

        if not isinstance(ids_ordenes, list) or not ids_ordenes:
            raise ValidationError(
                {"ordenes": "Debes enviar una lista de IDs de órdenes a remover."}
            )

        with transaction.atomic():
            ordenes = Orden.objects.select_for_update().filter(
                id_orden__in=ids_ordenes,
                id_envio=envio,
            )

            if not ordenes.exists():
                raise ValidationError(
                    {"detail": "Ninguna de las órdenes indicadas pertenece a este envío."}
                )

            ordenes.update(id_envio=None)

            total_peso = (
                Orden.objects.filter(id_envio=envio)
                .aggregate(total=Sum("peso_total"))
                .get("total")
            )
            envio.peso_total = total_peso or 0
            envio.save(update_fields=["peso_total"])

        registrar_accion(
            usuario,
            "Envíos",
            "Remover órdenes de envío",
            f"Se removieron las órdenes {ids_ordenes} del envío {envio.codigo_envio}.",
            id_referencia=envio.id_envio,
        )

        serializer = self.get_serializer(envio)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # ---------------------------
    #   Envíos para verificar (ALMACENISTA)
    # ---------------------------
    @action(detail=False, methods=["get"], url_path="para_verificar")
    def para_verificar(self, request, *args, **kwargs):
        """
        GET /api/base/envios/para_verificar/

        Devuelve los envíos que el ALMACENISTA debe verificar/preparar.

        Reglas:
        - Solo usuarios tipo ALMACENISTA.
        - Solo envíos en estado "ASIGNADO".
        - Devuelve, por cada envío:
            * Datos básicos del envío
            * Unidad (código, placa)
            * cantidad_ordenes_total
            * cantidad_ordenes_almacenista: cantidad de órdenes PREPARADAS
              (útil para mostrar "Preparadas / Total" en el front).
        """
        usuario = request.user

        if not usuario.is_authenticated:
            raise PermissionDenied("Debes iniciar sesión.")

        if not self._es_almacenista(usuario):
            raise PermissionDenied(
                "Solo el almacenista puede ver los envíos para preparar."
            )

        envios_qs = Envio.objects.filter(estado="ASIGNADO").select_related("id_unidad")

        data = []
        for envio in envios_qs:
            ordenes_qs = Orden.objects.filter(id_envio=envio)
            total_ordenes = ordenes_qs.count()
            ordenes_preparadas = ordenes_qs.filter(
                estado_de_envio="PREPARADA"
            ).count()

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

    # ---------------------------
    #   Detalle de envío para verificación (ALMACENISTA)
    # ---------------------------
    @action(detail=True, methods=["get"], url_path="detalle_verificacion")
    def detalle_verificacion(self, request, pk=None):
        """
        GET /api/base/envios/<id>/detalle_verificacion/

        Devuelve:
        {
          "envio": {...},
          "ordenes": [
             {id_orden, cliente_nombre, precio_final, estado_de_envio},
             ...
          ]
        }
        Solo ALMACENISTA.
        """
        usuario = request.user

        if not usuario.is_authenticated:
            raise PermissionDenied("Debes iniciar sesión.")

        if not self._es_almacenista(usuario):
            raise PermissionDenied(
                "Solo el almacenista puede ver el detalle de envío para verificación."
            )

        envio = self.get_object()

        ordenes_qs = Orden.objects.filter(id_envio=envio).select_related("id_cliente")

        ordenes_data = []
        for o in ordenes_qs:
            ordenes_data.append(
                {
                    "id_orden": o.id_orden,
                    "cliente_nombre": getattr(o.id_cliente, "nombre", None),
                    "precio_final": getattr(o, "precio_final", None),
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

        return Response(
            {
                "envio": envio_data,
                "ordenes": ordenes_data,
            },
            status=status.HTTP_200_OK,
        )

    # ---------------------------
    #   Marcar envío como LISTO PARA SALIR (ALMACENISTA)
    # ---------------------------
    @action(detail=True, methods=["post"], url_path="marcar_listo_salida")
    def marcar_listo_salida(self, request, pk=None):
        """
        POST /api/base/envios/<id>/marcar_listo_salida/

        Acción del ALMACENISTA para indicar que un envío ya está
        preparado y listo para salir.

        Reglas:
        - Solo ALMACENISTA.
        - El envío debe estar en estado "ASIGNADO".
        - Debe tener al menos una orden asociada.
        (Ya NO se valida el estado individual de cada orden aquí.)
        """
        usuario = request.user

        if not usuario.is_authenticated:
            raise PermissionDenied("Debes iniciar sesión.")

        if not self._es_almacenista(usuario):
            raise PermissionDenied(
                "Solo el almacenista puede marcar un envío como listo para salir."
            )

        envio = self.get_object()

        if envio.estado != "ASIGNADO":
            raise ValidationError(
                {
                    "detail": (
                        "Solo puedes marcar como LISTO PARA SALIR un envío que esté en estado ASIGNADO."
                    )
                }
            )

        ordenes_qs = Orden.objects.filter(id_envio=envio)

        if not ordenes_qs.exists():
            raise ValidationError(
                {"detail": "Este envío no tiene órdenes asociadas."}
            )

        # Ya no chequeamos el estado de cada orden.
        envio.estado = "LISTO_PARA_SALIR"
        envio.save(update_fields=["estado"])

        registrar_accion(
            usuario,
            "Envíos",
            "Marcar envío listo para salir",
            f"Envío {envio.codigo_envio} marcado como LISTO PARA SALIR.",
            id_referencia=envio.id_envio,
        )

        serializer = self.get_serializer(envio)
        return Response(
            {
                "mensaje": "Envío marcado como LISTO PARA SALIR.",
                "envio": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
#   DETALLE DE ÓRDENES
# ============================================================

class DetalleOrdenViewSet(BaseViewSet):
    """
    Vista para consultar detalles de órdenes (si la necesitas desde base).
    Normalmente las operaciones fuertes sobre órdenes se hacen en la app
    `ordenes`, pero aquí tienes un acceso básico.
    """

    queryset = DetalleOrden.objects.all()
    serializer_class = DetalleOrdenSerializer
    search_fields = ["id_orden__id_orden", "id_producto__nombre"]


# ============================================================
#   UNIDADES
# ============================================================

class UnidadViewSet(BaseViewSet):
    """
    Unidades de transporte (vehículos).

    Reglas de negocio:
    - Crear / Editar / Eliminar:
        * Solo GERENTE o ADMINISTRADOR.
    - Eliminar:
        * Solo si la unidad no tiene envíos asociados.
    - Registro de acciones:
        * Crear unidad
        * Editar unidad
        * Eliminar unidad
    """

    queryset = Unidad.objects.all()
    serializer_class = UnidadSerializer
    search_fields = ["codigo_unidad", "placa"]
    ordering_fields = ["estado"]

    def _es_gerente_o_admin(self, usuario):
        return getattr(usuario, "tipo", None) in ["GERENTE", "ADMINISTRADOR"]

    def perform_create(self, serializer):
        usuario = self.request.user
        if not self._es_gerente_o_admin(usuario):
            raise PermissionDenied(
                "Solo el gerente o el administrador pueden crear unidades de transporte."
            )

        # Si no mandan id_usuario en el body, podrías forzar que lo hagan:
        if "id_usuario" not in serializer.validated_data:
            raise ValidationError(
                {"id_usuario": "Debes seleccionar un transportista para la unidad."}
            )

        unidad = serializer.save()

        registrar_accion(
            usuario,
            "Unidades",
            "Crear unidad",
            f"Creación de la unidad {unidad.codigo_unidad}",
            id_referencia=unidad.id_unidad,
        )

    def perform_update(self, serializer):
        usuario = self.request.user
        if not self._es_gerente_o_admin(usuario):
            raise PermissionDenied(
                "Solo el gerente o el administrador pueden editar unidades de transporte."
            )

        unidad = serializer.save()

        registrar_accion(
            usuario,
            "Unidades",
            "Editar unidad",
            f"Edición de la unidad {unidad.codigo_unidad}",
            id_referencia=unidad.id_unidad,
        )

    def destroy(self, request, *args, **kwargs):
        usuario = request.user
        unidad = self.get_object()

        if not self._es_gerente_o_admin(usuario):
            raise PermissionDenied(
                "Solo el gerente o el administrador pueden eliminar unidades de transporte."
            )

        # Verificar que no tenga envíos asociados
        if Envio.objects.filter(id_unidad=unidad).exists():
            raise ValidationError(
                "No puedes eliminar esta unidad porque tiene envíos asociados."
            )

        codigo = unidad.codigo_unidad
        id_unidad = unidad.id_unidad

        response = super().destroy(request, *args, **kwargs)

        registrar_accion(
            usuario,
            "Unidades",
            "Eliminar unidad",
            f"Unidad eliminada: {codigo}",
            id_referencia=id_unidad,
        )

        return response


# ============================================================
#   LOGIN PERSONALIZADO (MODIFICADO)
# ============================================================

class CustomLogin(ObtainAuthToken):
    """
    Vista de Login modificada para detectar usuarios inactivos
    antes de validar la contraseña.
    """

    def post(self, request, *args, **kwargs):
        # 1. VERIFICACIÓN MANUAL DE ESTADO
        # Obtenemos el username sin validar password todavía
        username = request.data.get('username')
        
        # Buscamos si existe ese usuario en la BD
        user_obj = Usuario.objects.filter(username=username).first()
        
        # Si existe y está desactivado (is_active = False)
        if user_obj is not None and not user_obj.is_active:
            # Devolvemos el error específico que espera el Frontend
            return Response(
                {"detail": "CUENTA_DESACTIVADA"}, 
                status=status.HTTP_403_FORBIDDEN
            )

        # 2. VALIDACIÓN ESTÁNDAR (Si está activo o no existe el user)
        # Aquí Django valida si la contraseña es correcta
        serializer = self.serializer_class(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        # 3. GENERACIÓN DE RESPUESTA EXITOSA
        token, created = Token.objects.get_or_create(user=user)
        user_data = UsuarioSerializer(user).data

        return Response(
            {
                "token": token.key,
                "user": user_data,
            }
        )