# compras/serializers.py

from django.db import transaction
from django.db.models import Sum
from rest_framework import serializers

from .models import Compra, DetalleCompra, Proveedor, PagoCompra
from base.utils import registrar_accion
from base.models import Usuario
from inventario.models import Producto


# ============================================================
#   PROVEEDOR
# ============================================================

class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = '__all__'


# ============================================================
#   PAGOS DE COMPRA
# ============================================================

class PagoCompraSerializer(serializers.ModelSerializer):
    class Meta:
        model = PagoCompra
        fields = '__all__'


# ============================================================
#   DETALLE DE COMPRA
# ============================================================

class DetalleCompraSerializer(serializers.ModelSerializer):
    """
    Detalle de una compra.
    - id_producto_nombre: nombre del producto (solo lectura).
    - id_compra: se vuelve opcional en creación anidada (lo setea el maestro).
    """

    id_producto_nombre = serializers.ReadOnlyField(source='id_producto.nombre')

    class Meta:
        model = DetalleCompra
        fields = (
            'id_detallec',
            'id_compra',
            'id_producto',
            'id_producto_nombre',
            'cantidad',
            'precio_unitario',
            'subtotal',
        )
        read_only_fields = ('id_detallec', 'id_producto_nombre')

    def get_fields(self):
        """
        Permitimos que en creación desde CompraSerializer
        no sea obligatorio mandar id_compra en cada detalle.
        """
        fields = super().get_fields()
        if 'id_compra' in fields:
            fields['id_compra'].required = False
        return fields


# ============================================================
#   COMPRA (MAESTRO)
# ============================================================

class CompraSerializer(serializers.ModelSerializer):
    """
    Serializador maestro de Compra, con:
    - detalles de compra anidados.
    - pagos asociados (solo lectura).
    - nombre del proveedor.
    - username del usuario que registró la compra.
    - saldo pendiente calculado.
    """

    id_proveedor_nombre = serializers.ReadOnlyField(source='id_proveedor.nombre')

    # username del usuario que creó la compra (para filtros y display en frontend)
    id_usuario_username = serializers.CharField(
        source='id_usuario.username',
        read_only=True
    )

    # Detalles anidados
    detalles = DetalleCompraSerializer(
        source='detallecompra_set',
        many=True,
        required=True,
        read_only=False,
    )

    # Pagos asociados (asumiendo related_name="pagos" en PagoCompra)
    pagos = PagoCompraSerializer(many=True, read_only=True)

    # Saldo pendiente (método en el modelo Compra)
    saldo_pendiente = serializers.SerializerMethodField()

    class Meta:
        model = Compra
        fields = (
            'id_compra',
            'metodo_pago',
            'id_proveedor',
            'fecha_pedido',
            'estado_de_envio',
            'estado_de_pago',
            'precio_final',
            'cancelacion',
            'id_usuario',
            'id_proveedor_nombre',
            'id_usuario_username',
            'detalles',
            'pagos',
            'saldo_pendiente',
        )
        read_only_fields = (
            'id_compra',
            'precio_final',
            'estado_de_envio',
            'estado_de_pago',
            'saldo_pendiente',
            'pagos',
        )

    # ---------------------------
    #   Helpers
    # ---------------------------

    def get_saldo_pendiente(self, obj):
        """
        Devuelve el saldo pendiente calculado en el modelo Compra.
        """
        return obj.saldo_pendiente()

    # ---------------------------
    #   VALIDACIÓN
    # ---------------------------

    def validate(self, data):
        """
        Validación para impedir edición de compras ya procesadas.

        Reglas:
        - Si ya tiene recepción (RECIBIDA_COMPLETA o RECIBIDA_PARCIAL), no se puede editar.
        - Si ya tiene pagos asociados, no se puede editar.
        """
        if self.instance:
            # 1. Validar recepción
            if self.instance.estado_de_envio in ['RECIBIDA_COMPLETA', 'RECIBIDA_PARCIAL']:
                raise serializers.ValidationError(
                    {
                        "error": (
                            "No se puede editar una compra que ya ha recibido mercancía "
                            "(Parcial o Completa)."
                        )
                    }
                )

            # 2. Validar pagos registrados
            if self.instance.pagos.exists():
                raise serializers.ValidationError(
                    {
                        "error": (
                            "No se puede editar una compra que tiene pagos registrados. "
                            "Debe anular los pagos primero."
                        )
                    }
                )

        return data

    # ---------------------------
    #   CREATE
    # ---------------------------

    @transaction.atomic
    def create(self, validated_data):
        """
        Crea la compra + sus detalles asociados.
        - Recalcula subtotal de cada detalle.
        - Recalcula precio_final de la compra.
        - Registra la acción en el módulo de auditoría.
        """
        detalles_data = validated_data.pop('detallecompra_set')

        # Forzamos a que el total se calcule, ignorando campos enviados desde el front
        validated_data.pop('precio_final', None)
        validated_data.pop('peso_total', None)

        compra = Compra.objects.create(**validated_data)

        # Crear detalles
        for detalle_data in detalles_data:
            # Ignorar campos de peso si llegan
            detalle_data.pop('peso_unitario', None)
            detalle_data.pop('peso_subtotal', None)

            cant = detalle_data.get('cantidad', 0)
            precio = detalle_data.get('precio_unitario', 0)
            detalle_data['subtotal'] = cant * precio

            DetalleCompra.objects.create(id_compra=compra, **detalle_data)

        # Recalcular total de la compra
        total_price = (
            DetalleCompra.objects
            .filter(id_compra=compra)
            .aggregate(total=Sum('subtotal'))['total']
            or 0
        )
        compra.precio_final = total_price
        compra.save(update_fields=['precio_final'])

        # Contexto seguro
        user = self.context.get('request').user if self.context.get('request') else None

        registrar_accion(
            user,
            "Compras",
            "Crear Compra",
            f"Se creó la compra #{compra.id_compra} al proveedor {compra.id_proveedor.nombre}.",
            id_referencia=compra.id_compra,
        )

        return compra

    # ---------------------------
    #   UPDATE
    # ---------------------------

    @transaction.atomic
    def update(self, instance, validated_data):
        """
        Actualiza la compra y sincroniza los detalles:
        - Actualiza campos simples de la compra.
        - Actualiza / crea / elimina detalles según el payload.
        - Recalcula el precio_final.
        - Registra la acción.
        La validación de bloqueo ya corrió en validate().
        """
        detalles_data = validated_data.pop('detallecompra_set', None)

        # No permitir sobrescribir estos campos desde el request
        validated_data.pop('precio_final', None)
        validated_data.pop('peso_total', None)

        # Actualizar campos simples
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Si vienen detalles, sincronizamos
        if detalles_data is not None:
            existing_details = {
                d.id_detallec: d for d in instance.detallecompra_set.all()
            }
            incoming_ids = set()

            for d_data in detalles_data:
                did = d_data.get('id_detallec')

                # Limpiar campos que no deben venir o se calculan
                d_data.pop('peso_unitario', None)
                d_data.pop('peso_subtotal', None)
                d_data.pop('id_compra', None)

                cant = d_data.get('cantidad', 0)
                precio = d_data.get('precio_unitario', 0)
                d_data['subtotal'] = cant * precio

                if did in existing_details:
                    # Actualizar detalle existente
                    incoming_ids.add(did)
                    d_inst = existing_details[did]
                    for k, v in d_data.items():
                        setattr(d_inst, k, v)
                    d_inst.save()
                elif did is None:
                    # Crear nuevo detalle
                    DetalleCompra.objects.create(id_compra=instance, **d_data)

            # Eliminar detalles que ya no vienen
            to_delete = existing_details.keys() - incoming_ids
            if to_delete:
                DetalleCompra.objects.filter(id_detallec__in=to_delete).delete()

        # Recalcular el total de la compra
        total = (
            DetalleCompra.objects
            .filter(id_compra=instance)
            .aggregate(total=Sum('subtotal'))['total']
            or 0
        )
        instance.precio_final = total
        instance.save(update_fields=['precio_final'])

        user = self.context.get('request').user if self.context.get('request') else None

        registrar_accion(
            user,
            "Compras",
            "Editar Compra",
            f"Se modificaron datos de la compra #{instance.id_compra}.",
            id_referencia=instance.id_compra,
        )

        return instance