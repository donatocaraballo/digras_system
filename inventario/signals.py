# inventario/signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Lote, Existencia
from django.db.models import Sum

@receiver(post_save, sender=Lote)
def actualizar_existencia_por_lote(sender, instance, created, **kwargs):
    producto = instance.id_producto
    
    # 1. Calcular la suma bruta
    resultado_agregado = Lote.objects.filter(
        id_producto=producto, 
        estado='ACTIVO'
    ).aggregate(total=Sum('cantidad'))
    
    # 2. Limpieza de Tipos (A PRUEBA DE BALAS)
    # Si es None, es 0. Si es Decimal, lo convertimos a float/int para comparar fácil.
    total_stock = resultado_agregado['total'] or 0
    total_stock = int(total_stock) # Forzamos a entero

    # 3. Actualizar Existencia
    existencia, _ = Existencia.objects.get_or_create(id_producto=producto)
    existencia.cantidad = total_stock
    
    # 🚨 LÓGICA CORREGIDA Y ROBUSTA 🚨
    # Usamos <= 0 para atrapar 0 y cualquier negativo accidental
    if total_stock <= 0:
        existencia.estado = 'AGOTADO'
    elif total_stock < 10: 
        existencia.estado = 'BAJA_EXISTENCIA'
    else:
        existencia.estado = 'DISPONIBLE'
        
    existencia.save()
    
    # PRINT DE DEPURACIÓN (Verás esto en tu terminal negra al guardar)
    print(f"--- SEÑAL EJECUTADA: Producto {producto.nombre} | Stock: {total_stock} | Estado: {existencia.estado} ---")