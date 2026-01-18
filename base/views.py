# base/views.py

import random
import string
from decimal import Decimal
from django.core.mail import send_mail
from django.conf import settings

from django.utils import timezone
from django.db.models import Sum, Count, Q
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

from inventario.models import Producto, Existencia

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
#  CONSTANTES (SINGLE SOURCE OF TRUTH)
# ============================================================

ESTADO_CREACION_ENVIO = "PENDIENTE POR ASIGNACION"
ESTADO_ORDEN_ASIGNADA_ENVIO = "ASIGNADA_A_ENVIO"
ESTADO_ORDEN_DISPONIBLE_PARA_ENVIO = "PREPARADA"
ESTADOS_ENVIO_FINALIZADOS = {"TERMINADO", "FINALIZADO", "CERRADO", "ENTREGADO"}

UNIDAD_ACTIVA = "ACTIVA"
UNIDAD_DISPONIBLE = "DISPONIBLE"
UNIDAD_RESERVADA = "RESERVADA"
UNIDAD_EN_TRANSITO = "EN TRANSITO"
UNIDAD_INACTIVA = "INACTIVA"


def _norm_estado(value: str) -> str:
    return (value or "").strip().replace("_", " ").upper()


# ============================================================
#  USUARIOS
# ============================================================

class UsuarioViewSet(BaseViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    search_fields = ["username", "first_name", "last_name", "tipo"]
    ordering_fields = ["id_usuario", "username"]

    @action(
        detail=False, 
        methods=['post'], 
        url_path='solicitar-reset', 
        permission_classes=[permissions.AllowAny]
    )
    def solicitar_reset(self, request):
        email = request.data.get("email")
        
        if not email:
            return Response({"error": "Debes proporcionar un correo electrónico."}, status=400)

        usuario = Usuario.objects.filter(email=email).first()

        if not usuario:
            return Response({"mensaje": "Si el correo existe, se ha enviado un código."}, status=200)

        codigo = "".join(random.choices(string.digits, k=6))
        
        usuario.codigo_recuperacion = codigo
        usuario.fecha_recuperacion = timezone.now()
        usuario.save()

        print("========================================")
        print(f"🔐 CÓDIGO DE RECUPERACIÓN PARA {email}: {codigo}")
        print("========================================")

        try:
            send_mail(
                subject='Código de Recuperación - DIGRAS',
                message=f'''
                Hola {usuario.username},

                Tu código de seguridad para restablecer la contraseña es: 

                {codigo}

                Este código es válido por tiempo limitado.
                ''',
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[email],
                fail_silently=False, 
            )
        except Exception as e:
            print(f"❌ Error enviando correo: {e}")

        return Response({"mensaje": "Código enviado a tu correo."}, status=200)

    @action(
        detail=False, 
        methods=['post'], 
        url_path='confirmar-reset', 
        permission_classes=[permissions.AllowAny]
    )
    def confirmar_reset(self, request):
        email = request.data.get("email")
        codigo = request.data.get("codigo")
        nueva_password = request.data.get("nueva_password")

        if not email or not codigo or not nueva_password:
            return Response({"error": "Faltan datos (email, código o contraseña)."}, status=400)

        usuario = Usuario.objects.filter(email=email).first()

        if not usuario:
            return Response({"error": "Usuario no encontrado."}, status=404)

        if usuario.codigo_recuperacion != codigo:
            return Response({"error": "El código es incorrecto."}, status=400)

        usuario.set_password(nueva_password)
        usuario.codigo_recuperacion = None
        usuario.save()

        return Response({"mensaje": "Contraseña actualizada correctamente."}, status=200)


# ============================================================
#  REGISTRO DE ACCIONES
# ============================================================

class RegistroAccionViewSet(BaseViewSet):
    queryset = RegistroAccion.objects.all().order_by("-fecha_y_hora")
    serializer_class = RegistroAccionSerializer
    search_fields = ["modulo", "accion", "descripcion"]
    ordering_fields = ["fecha_y_hora", "id_registro"]


# ============================================================
#  CLIENTES
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
        elif tipo == "ALMACENISTA":
            base_qs = Cliente.objects.filter(
                orden__cancelacion=False,
                orden__estado_de_envio__in=[
                    "APROBADA",
                    "PREPARADA",
                    ESTADO_ORDEN_ASIGNADA_ENVIO,
                    "EN_CURSO",
                ],
            ).distinct()
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
        
        accion = "Editar cliente"
        if old_activo and not new_activo: accion = "Desactivar cliente"
        elif not old_activo and new_activo: accion = "Activar cliente"

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
#  ÓRDENES (Lógica de Peso y Creación)
# ============================================================

class OrdenViewSet(BaseViewSet):
    queryset = Orden.objects.all().order_by('-id_orden')
    serializer_class = OrdenSerializer
    permission_classes = [permissions.IsAuthenticated] # O AllowAny según config
    
    # Filtros
    search_fields = ["id_orden", "id_cliente__nombre", "id_usuario__username"]

    def create(self, request, *args, **kwargs):
        """
        Creación de orden personalizada:
        1. Valida stock.
        2. Obtiene el precio y PESO de cada producto desde el inventario.
        3. Calcula totales (precio y peso).
        4. Crea los detalles y actualiza la orden.
        """
        datos = request.data
        detalles_raw = datos.get('detalles', [])
        usuario = request.user
        
        if not detalles_raw:
            return Response({"error": "La orden debe tener al menos un producto."}, status=400)

        # Validamos estructura básica con el serializer
        # Nota: 'detalles' no es un campo del modelo Orden, se maneja manual
        serializer_orden = self.get_serializer(data=datos)
        serializer_orden.is_valid(raise_exception=True)

        try:
            with transaction.atomic():
                # 1. Crear la Orden (Cabecera) - sin totales aún
                orden = Orden(
                    id_cliente=serializer_orden.validated_data['id_cliente'],
                    metodo_pago=serializer_orden.validated_data.get('metodo_pago', 'EFECTIVO'),
                    id_usuario=usuario, # Asigna el usuario logueado (Vendedor)
                    precio_final=0,
                    peso_total=0
                )
                orden.save()

                total_precio = Decimal(0)
                total_peso = Decimal(0)

                # 2. Procesar Detalles
                for item in detalles_raw:
                    prod_id = item.get('id_producto')
                    cantidad = int(item.get('cantidad', 1))
                    
                    producto = Producto.objects.select_related().get(pk=prod_id)
                    
                    # Validar Existencia
                    try:
                        existencia = Existencia.objects.get(id_producto=producto)
                        if existencia.cantidad < cantidad:
                            raise ValidationError(f"Stock insuficiente para {producto.nombre}. Disponible: {existencia.cantidad}")
                        
                        # Descontar Stock
                        existencia.cantidad -= cantidad
                        if existencia.cantidad == 0: existencia.estado = "AGOTADO"
                        existencia.save()

                    except Existencia.DoesNotExist:
                         raise ValidationError(f"No hay inventario registrado para {producto.nombre}")

                    # Cálculos
                    precio_u = producto.precio_venta
                    peso_u = producto.peso_unidad # 🚨 Obtenemos el peso configurado
                    
                    subtotal = precio_u * cantidad
                    peso_subtotal = peso_u * cantidad # Peso total de esta línea

                    # Crear Detalle
                    DetalleOrden.objects.create(
                        id_orden=orden,
                        id_producto=producto,
                        cantidad=cantidad,
                        precio_unitario=precio_u,
                        subtotal=subtotal,
                        peso_unitario=peso_u,     
                        peso_subtotal=peso_subtotal
                    )

                    total_precio += subtotal
                    total_peso += peso_subtotal

                # 3. Actualizar Totales en Cabecera
                orden.precio_final = total_precio
                orden.peso_total = total_peso # 🚨 Guardamos peso total para el camión
                orden.save()
                
                # Log
                registrar_accion(usuario, "Ventas", "Crear Orden", f"Orden #{orden.id_orden} creada. Peso: {total_peso}kg", id_referencia=orden.id_orden)

                # Retornar la orden completa serializada
                return Response(OrdenSerializer(orden).data, status=status.HTTP_201_CREATED)

        except Producto.DoesNotExist:
            return Response({"error": "Uno de los productos no existe."}, status=400)
        except ValidationError as e:
            return Response({"error": e.detail}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    @action(detail=True, methods=['get'])
    def detalles(self, request, pk=None):
        orden = self.get_object()
        items = DetalleOrden.objects.filter(id_orden=orden)
        return Response(DetalleOrdenSerializer(items, many=True).data)

    @action(detail=False, methods=['get'])
    def para_preparar(self, request):
        # Retorna órdenes para el Almacenista
        qs = Orden.objects.filter(estado_de_envio__in=['PENDIENTE POR APROBACIÓN', 'APROBADA']).order_by('fecha_orden')
        return Response(OrdenSerializer(qs, many=True).data)
    
    @action(detail=True, methods=['get'])
    def ver_para_preparar(self, request, pk=None):
        orden = self.get_object()
        detalles = DetalleOrden.objects.filter(id_orden=orden)
        return Response({
            "orden": OrdenSerializer(orden).data,
            "detalles": DetalleOrdenSerializer(detalles, many=True).data
        })

    @action(detail=True, methods=['post'])
    def preparar(self, request, pk=None):
        orden = self.get_object()
        # Aquí podrías validar permisos de almacenista
        orden.estado_de_envio = ESTADO_ORDEN_DISPONIBLE_PARA_ENVIO # "PREPARADA"
        orden.save()
        return Response({'mensaje': 'Orden marcada como PREPARADA'})

    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        orden = self.get_object()
        if orden.estado_de_envio != "PENDIENTE POR APROBACIÓN":
             return Response({"error": "Solo se pueden cancelar órdenes pendientes."}, status=400)
        
        with transaction.atomic():
            # Devolver stock
            detalles = DetalleOrden.objects.filter(id_orden=orden)
            for d in detalles:
                existencia = Existencia.objects.get(id_producto=d.id_producto)
                existencia.cantidad += d.cantidad
                existencia.estado = "DISPONIBLE"
                existencia.save()
            
            orden.cancelacion = True
            orden.estado_de_envio = "CANCELADA"
            orden.save()
            
        return Response({'mensaje': 'Orden cancelada y stock devuelto.'})


# ============================================================
#  ENVÍOS (SINGLE SOURCE OF TRUTH + PESO)
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
        """
        🚨 Lógica Crítica: Valida que el peso no supere la capacidad del camión
        """
        cap = unidad.capacidad_carga or Decimal("0")
        if cap > 0 and peso_total > cap: # Estricto mayor
            raise ValidationError({"detail": f"⛔ EXCESO DE CARGA: El peso total ({peso_total}kg) supera la capacidad de la unidad ({cap}kg)."})

    def _validar_envio_editable(self, envio: Envio):
        if _norm_estado(envio.estado) != _norm_estado(ESTADO_CREACION_ENVIO):
            raise ValidationError({"detail": "Solo puedes modificar envíos en PENDIENTE POR ASIGNACION."})

    def _validar_unidad_disponible(self, unidad: Unidad, envio_actual: Envio = None):
        if _norm_estado(unidad.estado) in {_norm_estado(UNIDAD_INACTIVA), _norm_estado(UNIDAD_RESERVADA), _norm_estado(UNIDAD_EN_TRANSITO)}:
            # Permitir si es la misma unidad del envío actual
            if not envio_actual or envio_actual.id_unidad != unidad:
                 raise ValidationError({"detail": "La unidad no está disponible (INACTIVA/RESERVADA/EN TRANSITO)."})

        qs = Envio.objects.filter(id_unidad=unidad).exclude(estado__in=list(ESTADOS_ENVIO_FINALIZADOS))
        if envio_actual:
            qs = qs.exclude(pk=envio_actual.pk)
        if qs.exists():
            raise ValidationError({"detail": "La unidad seleccionada ya tiene un envío activo."})

    def _sync_unidad_estado_por_envio(self, envio: Envio):
        unidad = envio.id_unidad
        if _norm_estado(unidad.estado) == _norm_estado(UNIDAD_INACTIVA):
            return 

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

            if envio.id_unidad_id != old_unidad.id_unidad:
                self._validar_unidad_disponible(envio.id_unidad, envio_actual=envio)
                peso_actual = self._recalcular_peso_envio(envio)
                self._validar_capacidad(envio.id_unidad, peso_actual)

            envio.peso_total = self._recalcular_peso_envio(envio)
            envio.save(update_fields=["peso_total"])

        registrar_accion(usuario, "Envíos", "Editar envío", f"Edición del envío {envio.codigo_envio}", id_referencia=envio.id_envio)
        self._sync_unidad_estado_por_envio(envio)

        # Liberar unidad vieja si aplica
        if old_unidad != envio.id_unidad:
             # Lógica simplificada: si no tiene otros envíos activos, activarla
             if not Envio.objects.filter(id_unidad=old_unidad).exclude(estado__in=list(ESTADOS_ENVIO_FINALIZADOS)).exists():
                 old_unidad.estado = UNIDAD_ACTIVA
                 old_unidad.save()


    # ---------------------------
    #   Asignar órdenes (CON VALIDACIÓN DE PESO)
    # ---------------------------
    @action(detail=True, methods=["post"], url_path="asignar_ordenes")
    def asignar_ordenes(self, request, pk=None):
        usuario = request.user
        if not self._es_gerente_o_admin(usuario):
            raise PermissionDenied("Solo el gerente o el administrador pueden asignar órdenes.")

        envio = self.get_object()
        self._validar_envio_editable(envio)

        ids_ordenes = request.data.get("ordenes", [])
        if not isinstance(ids_ordenes, list) or not ids_ordenes:
            raise ValidationError({"ordenes": "Debes enviar una lista de IDs de órdenes."})

        # Estados permitidos para asignar (Tu UI usa PREPARADA)
        estados_permitidos = ["APROBADA", ESTADO_ORDEN_DISPONIBLE_PARA_ENVIO]

        with transaction.atomic():
            ordenes = Orden.objects.select_for_update().filter(id_orden__in=ids_ordenes)
            if ordenes.count() != len(ids_ordenes):
                raise ValidationError({"detail": "Alguna de las órdenes indicadas no existe."})

            for o in ordenes:
                if o.estado_de_envio not in estados_permitidos:
                    raise ValidationError({"detail": f"La orden {o.id_orden} no está en estado PREPARADA."})
                if o.id_envio and o.id_envio_id != envio.id_envio:
                    raise ValidationError({"detail": f"La orden {o.id_orden} ya está asignada a otro envío."})

            # 🚨 CÁLCULO DE PESO
            peso_actual = self._recalcular_peso_envio(envio)
            peso_nuevo = ordenes.aggregate(total=Sum("peso_total")).get("total") or Decimal("0")
            
            # 🚨 VALIDAR CAPACIDAD
            self._validar_capacidad(envio.id_unidad, peso_actual + peso_nuevo)

            # Asignar
            ordenes.update(id_envio=envio, estado_de_envio=ESTADO_ORDEN_ASIGNADA_ENVIO)

            envio.peso_total = self._recalcular_peso_envio(envio)
            envio.save(update_fields=["peso_total"])

        registrar_accion(usuario, "Envíos", "Asignar órdenes", f"Se asignaron órdenes {ids_ordenes} al envío {envio.codigo_envio}.", id_referencia=envio.id_envio)
        self._sync_unidad_estado_por_envio(envio)

        serializer = self.get_serializer(envio)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="remover_ordenes")
    def remover_ordenes(self, request, pk=None):
        usuario = request.user
        if not self._es_gerente_o_admin(usuario):
            raise PermissionDenied("Solo el gerente o admin pueden remover órdenes.")

        envio = self.get_object()
        self._validar_envio_editable(envio)

        ids_ordenes = request.data.get("ordenes", [])
        
        with transaction.atomic():
            ordenes = Orden.objects.select_for_update().filter(id_orden__in=ids_ordenes, id_envio=envio)
            if ordenes.count() != len(ids_ordenes):
                 raise ValidationError({"detail": "Alguna orden no pertenece a este envío."})

            ordenes.update(id_envio=None, estado_de_envio=ESTADO_ORDEN_DISPONIBLE_PARA_ENVIO)

            envio.peso_total = self._recalcular_peso_envio(envio)
            envio.save(update_fields=["peso_total"])

        registrar_accion(usuario, "Envíos", "Remover órdenes", f"Se removieron órdenes del envío {envio.codigo_envio}.", id_referencia=envio.id_envio)
        self._sync_unidad_estado_por_envio(envio)

        serializer = self.get_serializer(envio)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="cerrar")
    def cerrar(self, request, pk=None):
        usuario = request.user
        if not self._es_gerente_o_admin(usuario):
            raise PermissionDenied("Solo el gerente o el administrador pueden cerrar envíos.")

        envio = self.get_object()
        self._validar_envio_editable(envio)

        with transaction.atomic():
            envio.peso_total = self._recalcular_peso_envio(envio)
            self._validar_capacidad(envio.id_unidad, envio.peso_total) # Revalidar por seguridad

            if not Orden.objects.filter(id_envio=envio).exists():
                raise ValidationError({"detail": "No puedes cerrar un envío sin órdenes."})

            envio.estado = "ASIGNADO"
            envio.save(update_fields=["estado", "peso_total"])

        registrar_accion(usuario, "Envíos", "Cerrar envío", f"Envío {envio.codigo_envio} marcado como ASIGNADO.", id_referencia=envio.id_envio)
        self._sync_unidad_estado_por_envio(envio)
        
        return Response({"mensaje": "Envío cerrado."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="marcar_listo_salida")
    def marcar_listo_salida(self, request, pk=None):
        usuario = request.user
        if not self._es_almacenista(usuario):
            raise PermissionDenied("Solo el almacenista puede marcar listo para salir.")

        envio = self.get_object()
        if _norm_estado(envio.estado) != "ASIGNADO":
            raise ValidationError({"detail": "Solo puedes marcar LISTO un envío en estado ASIGNADO."})

        envio.estado = "LISTO_PARA_SALIR"
        envio.save(update_fields=["estado"])
        self._sync_unidad_estado_por_envio(envio)
        
        return Response({"mensaje": "Envío marcado como LISTO."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="marcar_terminado")
    def marcar_terminado(self, request, pk=None):
        usuario = request.user
        if not self._es_transportista(usuario):
            raise PermissionDenied("Solo el transportista puede terminar el envío.")

        envio = self.get_object()
        if envio.id_unidad.id_usuario_id != usuario.pk:
            raise PermissionDenied("No puedes terminar un envío de otra unidad.")

        with transaction.atomic():
            envio.estado = "TERMINADO"
            envio.fecha_llegada = timezone.now()
            envio.save(update_fields=["estado", "fecha_llegada"])
            
            # Marcar órdenes como ENTREGADA
            Orden.objects.filter(id_envio=envio).update(estado_de_envio="ENTREGADA")

        self._sync_unidad_estado_por_envio(envio)
        return Response({"mensaje": "Envío terminado."}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="para_verificar")
    def para_verificar(self, request):
        if not self._es_almacenista(request.user):
             raise PermissionDenied("Acceso denegado.")
        
        qs = Envio.objects.filter(estado="ASIGNADO").select_related("id_unidad")
        return Response(EnvioSerializer(qs, many=True).data)

    @action(detail=True, methods=["get"], url_path="detalle_verificacion")
    def detalle_verificacion(self, request, pk=None):
        if not self._es_almacenista(request.user):
             raise PermissionDenied("Acceso denegado.")
        
        envio = self.get_object()
        ordenes = Orden.objects.filter(id_envio=envio)
        return Response({
            "envio": EnvioSerializer(envio).data,
            "ordenes": OrdenSerializer(ordenes, many=True).data
        })


# ============================================================
#  DETALLE DE ÓRDENES
# ============================================================

class DetalleOrdenViewSet(BaseViewSet):
    queryset = DetalleOrden.objects.all()
    serializer_class = DetalleOrdenSerializer
    search_fields = ["id_orden__id_orden", "id_producto__nombre"]


# ============================================================
#  UNIDADES
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
            raise PermissionDenied("Solo gerente/admin.")

        if "id_usuario" not in serializer.validated_data:
            raise ValidationError({"id_usuario": "Debes seleccionar un transportista."})

        id_usuario = serializer.validated_data["id_usuario"].id_usuario
        if Unidad.objects.filter(id_usuario_id=id_usuario).exists():
            raise ValidationError({"detail": "Este transportista ya tiene unidad."})

        unidad = serializer.save()
        registrar_accion(usuario, "Unidades", "Crear unidad", f"Unidad {unidad.codigo_unidad}", id_referencia=unidad.id_unidad)

    def perform_update(self, serializer):
        usuario = self.request.user
        if not self._es_gerente_o_admin(usuario):
            raise PermissionDenied("Solo gerente/admin.")
        
        unidad = serializer.instance
        new_user = serializer.validated_data.get("id_usuario", unidad.id_usuario)
        if Unidad.objects.filter(id_usuario=new_user).exclude(pk=unidad.pk).exists():
            raise ValidationError({"detail": "Transportista ya asignado."})

        unidad = serializer.save()
        registrar_accion(usuario, "Unidades", "Editar unidad", f"Unidad {unidad.codigo_unidad}", id_referencia=unidad.id_unidad)

    def destroy(self, request, *args, **kwargs):
        usuario = request.user
        if not self._es_gerente_o_admin(usuario):
            raise PermissionDenied("Solo gerente/admin.")
            
        unidad = self.get_object()
        if Envio.objects.filter(id_unidad=unidad).exclude(estado__in=list(ESTADOS_ENVIO_FINALIZADOS)).exists():
            raise ValidationError("Unidad con envíos activos no puede eliminarse.")

        response = super().destroy(request, *args, **kwargs)
        registrar_accion(usuario, "Unidades", "Eliminar unidad", f"Unidad eliminada: {unidad.codigo_unidad}", id_referencia=unidad.id_unidad)
        return response


# ============================================================
#  LOGIN
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