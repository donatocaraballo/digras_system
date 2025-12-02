# compras/signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Compra, DetalleCompra 

@receiver(post_save, sender=DetalleCompra)
def update_compra_totals(sender, instance, **kwargs):
    # El Serializer ya creó el DetalleCompra, obtenemos la Compra padre
    compra = instance.id_compra
    
    # Obtenemos todos los detalles relacionados con esta Compra
    all_details = DetalleCompra.objects.filter(id_compra=compra)

    # 🚨 FIX CRÍTICO: Usamos 'or 0' para manejar valores NULL (NoneType) y evitar el TypeError 🚨
    # Si detail.subtotal es None, se usa 0.
    total_price = sum(detail.subtotal or 0 for detail in all_details)
    
    # Hacemos lo mismo para el peso (que causaba el crash directo)
    total_weight = sum(detail.peso_subtotal or 0 for detail in all_details) 
    
    # 3. Actualiza y guarda la Compra.
    Compra.objects.filter(id_compra=compra.id_compra).update(
        precio_final=total_price, 
        peso_total=total_weight
    )