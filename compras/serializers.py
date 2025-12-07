# compras/serializers.py

from django.db import transaction
from django.db.models import Sum
from rest_framework import serializers
from .models import Compra, DetalleCompra, Proveedor, PagoCompra
from base.utils import registrar_accion
from base.models import Usuario
from inventario.models import Producto

# --- Serializadores Auxiliares ---

class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = '__all__'

class PagoCompraSerializer(serializers.ModelSerializer):
    class Meta:
        model = PagoCompra
        fields = '__all__'

# --- Detalle Compra ---

class DetalleCompraSerializer(serializers.ModelSerializer):
    id_producto_nombre = serializers.ReadOnlyField(source='id_producto.nombre') 

    class Meta:
        model = DetalleCompra
        fields = (
            'id_detallec', 'id_compra', 'id_producto', 
            'id_producto_nombre', 'cantidad', 'precio_unitario', 'subtotal'
        ) 
        read_only_fields = ('id_detallec', 'id_producto_nombre',) 
        
    def get_fields(self):
        fields = super().get_fields()
        if 'id_compra' in fields:
            fields['id_compra'].required = False
        return fields

# --- Compra Serializer (Maestro) ---

class CompraSerializer(serializers.ModelSerializer):
    id_proveedor_nombre = serializers.ReadOnlyField(source='id_proveedor.nombre')
    detalles = DetalleCompraSerializer(source='detallecompra_set', many=True, required=True, read_only=False)
    
    pagos = PagoCompraSerializer(many=True, read_only=True)
    saldo_pendiente = serializers.SerializerMethodField()

    class Meta:
        model = Compra
        fields = (
            'id_compra', 'metodo_pago', 'id_proveedor', 'fecha_pedido', 
            'estado_de_envio', 'estado_de_pago', 'precio_final', 'cancelacion', 'id_usuario', 
            'id_proveedor_nombre', 'detalles', 'pagos', 'saldo_pendiente'
        )
        read_only_fields = (
            'id_compra', 'precio_final', 'estado_de_envio', 'estado_de_pago', 'saldo_pendiente', 'pagos'
        )
    
    def get_saldo_pendiente(self, obj):
        return obj.saldo_pendiente()

    # 🚨 NUEVO: VALIDACIÓN PARA IMPEDIR EDICIÓN SI YA PROCESÓ 🚨
    def validate(self, data):
        # Si es una actualización (self.instance existe)
        if self.instance:
            # 1. Validar Recepción
            if self.instance.estado_de_envio in ['RECIBIDA_COMPLETA', 'RECIBIDA_PARCIAL']:
                raise serializers.ValidationError(
                    {"error": "No se puede editar una compra que ya ha recibido mercancía (Parcial o Completa)."}
                )
            
            # 2. Validar Pagos (Verificamos si existen pagos registrados en la BD)
            # Usamos self.instance.pagos.exists() que es más seguro que mirar solo el estado
            if self.instance.pagos.exists():
                raise serializers.ValidationError(
                    {"error": "No se puede editar una compra que tiene pagos registrados. Debe anular los pagos primero."}
                )

        return data

    @transaction.atomic
    def create(self, validated_data):
        detalles_data = validated_data.pop('detallecompra_set')
        
        validated_data.pop('precio_final', None)
        validated_data.pop('peso_total', None) 

        compra = Compra.objects.create(**validated_data)
        
        for detalle_data in detalles_data:
            detalle_data.pop('peso_unitario', None) 
            detalle_data.pop('peso_subtotal', None)
            
            cant = detalle_data.get('cantidad', 0)
            precio = detalle_data.get('precio_unitario', 0)
            detalle_data['subtotal'] = cant * precio

            DetalleCompra.objects.create(id_compra=compra, **detalle_data)
            
        total_price = DetalleCompra.objects.filter(id_compra=compra).aggregate(total=Sum('subtotal'))['total'] or 0
        compra.precio_final = total_price
        compra.save(update_fields=['precio_final'])

        # Contexto seguro
        user = self.context.get('request').user if self.context.get('request') else None
        
        registrar_accion(
            user, "Compras", "Crear Compra",
            f"Se creó la compra #{compra.id_compra} al proveedor {compra.id_proveedor.nombre}.",
            id_referencia=compra.id_compra
        )
        
        return compra
    
    @transaction.atomic
    def update(self, instance, validated_data):
        # Nota: La validación 'validate()' ya corrió arriba, así que aquí es seguro editar.
        
        detalles_data = validated_data.pop('detallecompra_set', None)

        validated_data.pop('precio_final', None)
        validated_data.pop('peso_total', None) 
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if detalles_data is not None:
            existing_details = {d.id_detallec: d for d in instance.detallecompra_set.all()}
            incoming_ids = set()
            
            for d_data in detalles_data:
                did = d_data.get('id_detallec')
                
                d_data.pop('peso_unitario', None)
                d_data.pop('peso_subtotal', None)
                d_data.pop('id_compra', None) 
                
                cant = d_data.get('cantidad', 0)
                precio = d_data.get('precio_unitario', 0)
                d_data['subtotal'] = cant * precio
                
                if did in existing_details:
                    incoming_ids.add(did)
                    d_inst = existing_details[did]
                    for k, v in d_data.items(): setattr(d_inst, k, v)
                    d_inst.save()
                elif did is None:
                    DetalleCompra.objects.create(id_compra=instance, **d_data)
            
            to_delete = existing_details.keys() - incoming_ids
            DetalleCompra.objects.filter(id_detallec__in=to_delete).delete()

        total = DetalleCompra.objects.filter(id_compra=instance).aggregate(total=Sum('subtotal'))['total'] or 0
        instance.precio_final = total
        instance.save(update_fields=['precio_final'])

        user = self.context.get('request').user if self.context.get('request') else None

        registrar_accion(
            user, "Compras", "Editar Compra",
            f"Se modificaron datos de la compra #{instance.id_compra}.",
            id_referencia=instance.id_compra
        )

        return instance