from datetime import date
from rest_framework import serializers
from base.models import Orden, DetalleOrden, Producto

class DetalleOrdenCreateSerializer(serializers.Serializer):
    id_producto = serializers.PrimaryKeyRelatedField(queryset=Producto.objects.all())
    cantidad = serializers.IntegerField(min_value=1)

class OrdenCreateSerializer(serializers.Serializer):
    id_cliente = serializers.IntegerField()
    metodo_pago = serializers.CharField()
    detalles = DetalleOrdenCreateSerializer(many=True)

    # Campos que NO enviará el usuario, sino que se calculan:
    estado_de_envio = serializers.HiddenField(default="PENDIENTE POR APROBACIÓN")
    estado_de_pago = serializers.HiddenField(default="PENDIENTE POR PAGO")
    cancelacion = serializers.HiddenField(default=False)