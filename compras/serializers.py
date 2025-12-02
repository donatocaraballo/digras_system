# compras/serializers.py (VERSIÓN FINAL - CÁLCULO FORZADO DE SUBTOTAL)

from django.db import transaction
from django.db.models import Sum, F
from rest_framework import serializers
from .models import Compra, DetalleCompra, Proveedor 
from base.models import Usuario
from inventario.models import Producto

# 1. Serializador de Proveedor
class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = '__all__'

# --- 1. Detalle Compra Serializer ---
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

# --- 2. Compra Serializer (Lógica Maestra) ---
class CompraSerializer(serializers.ModelSerializer):
    id_proveedor_nombre = serializers.ReadOnlyField(source='id_proveedor.nombre')
    detalles = DetalleCompraSerializer(source='detallecompra_set', many=True, required=True, read_only=False) 

    class Meta:
        model = Compra
        fields = (
            'id_compra', 'metodo_pago', 'id_proveedor', 'fecha_pedido', 
            'estado_de_envio', 'estado_de_pago', 'precio_final', 'cancelacion', 'id_usuario', 
            'id_proveedor_nombre', 'detalles'
        )
        read_only_fields = (
            'id_compra', 
            'precio_final', 
            #'estado_de_envio', 
            'estado_de_pago',
        )
    
    @transaction.atomic
    def create(self, validated_data):
        detalles_data = validated_data.pop('detallecompra_set')
        
        validated_data.pop('precio_final', None)
        validated_data.pop('peso_total', None) 

        compra = Compra.objects.create(**validated_data)
        
        for detalle_data in detalles_data:
            # Limpieza de campos de peso
            detalle_data.pop('peso_unitario', None) 
            detalle_data.pop('peso_subtotal', None)
            
            # 🚨 CÁLCULO FORZADO: Backend Authority 🚨
            # Calculamos el subtotal aquí mismo para asegurar que se guarde
            cant = detalle_data.get('cantidad', 0)
            precio = detalle_data.get('precio_unitario', 0)
            detalle_data['subtotal'] = cant * precio

            DetalleCompra.objects.create(id_compra=compra, **detalle_data)
            
        # Recálculo final de la cabecera
        total_price = DetalleCompra.objects.filter(id_compra=compra).aggregate(total=Sum('subtotal'))['total'] or 0
        compra.precio_final = total_price
        compra.save(update_fields=['precio_final'])
        
        return compra
    
    @transaction.atomic
    def update(self, instance, validated_data):
        detalles_data = validated_data.pop('detallecompra_set', None)

        validated_data.pop('precio_final', None)
        validated_data.pop('peso_total', None) 
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if detalles_data is not None:
            existing_details = {detalle.id_detallec: detalle for detalle in instance.detallecompra_set.all()}
            incoming_detail_ids = set()
            
            for detalle_data in detalles_data:
                id_detallec = detalle_data.get('id_detallec', None)
                
                detalle_data.pop('peso_unitario', None)
                detalle_data.pop('peso_subtotal', None)
                detalle_data.pop('id_compra', None) 
                
                # 🚨 CÁLCULO FORZADO EN ACTUALIZACIÓN 🚨
                cant = detalle_data.get('cantidad', 0)
                precio = detalle_data.get('precio_unitario', 0)
                # Si son valores parciales (no enviados), buscamos en la instancia existente, 
                # pero para simplificar asumimos que el form envía todo.
                detalle_data['subtotal'] = cant * precio
                
                if id_detallec in existing_details:
                    # UPDATE
                    incoming_detail_ids.add(id_detallec)
                    detalle_instance = existing_details[id_detallec]
                    for attr, value in detalle_data.items():
                        setattr(detalle_instance, attr, value)
                    detalle_instance.save()
                
                elif id_detallec is None:
                    # CREATE (Nueva línea en edición)
                    DetalleCompra.objects.create(id_compra=instance, **detalle_data)
                    
            # DELETE
            details_to_delete = existing_details.keys() - incoming_detail_ids
            DetalleCompra.objects.filter(id_detallec__in=details_to_delete).delete()

        # 🚨 RECÁLCULO FORZADO DE LA CABECERA 🚨
        # Suma todos los subtotales que acabamos de guardar/calcular
        new_total = DetalleCompra.objects.filter(id_compra=instance).aggregate(total=Sum('subtotal'))['total'] or 0
        
        instance.precio_final = new_total
        instance.save(update_fields=['precio_final'])

        return instance