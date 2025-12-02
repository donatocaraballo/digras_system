# inventario/signals.py
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Lote, Existencia
from django.db.models import Sum

@receiver(post_save, sender=Lote)
def actualizar_existencia_por_lote(sender, instance, created, **kwargs):
    """
    Se ejecuta cada vez que se crea o modifica un Lote.
    Recalcula el stock total sumando solo los lotes ACTIVOS.
    """
    producto = instance.id_producto
    
    # Sumar solo cantidad de lotes ACTIVOS
    total_stock = Lote.objects.filter(
        id_producto=producto, 
        estado='ACTIVO'
    ).aggregate(total=Sum('cantidad'))['total'] or 0

    # Actualizar o crear la existencia
    existencia, _ = Existencia.objects.get_or_create(id_producto=producto)
    existencia.cantidad = total_stock
    
    # Determinar estado general
    if total_stock == 0:
        existencia.estado = 'AGOTADO'
    elif total_stock < 10: # Umbral de ejemplo
        existencia.estado = 'BAJA_EXISTENCIA'
    else:
        existencia.estado = 'DISPONIBLE'
        
    existencia.save()