# compras/signals.py

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Sum
from decimal import Decimal # Importar Decimal para manejo seguro
from .models import Compra, DetalleCompra, PagoCompra

# Señal 1: Actualizar totales de la compra (Precios y Pesos)
@receiver(post_save, sender=DetalleCompra)
def update_compra_totals(sender, instance, **kwargs):
    compra = instance.id_compra
    all_details = DetalleCompra.objects.filter(id_compra=compra)

    # Usamos (val or 0) para proteger contra None
    total_price = sum(detail.subtotal or 0 for detail in all_details)
    total_weight = sum(detail.peso_subtotal or 0 for detail in all_details)
    
    Compra.objects.filter(id_compra=compra.id_compra).update(
        precio_final=total_price, 
        peso_total=total_weight
    )

# Señal 2: Actualizar estado de pago
@receiver([post_save, post_delete], sender=PagoCompra)
def actualizar_estado_pago(sender, instance, **kwargs):
    compra = instance.id_compra
    
    # 1. Sumar pagos existentes (Manejo de None)
    resultado = PagoCompra.objects.filter(id_compra=compra).aggregate(total=Sum('monto'))
    total_pagado = resultado['total'] or Decimal('0.00')
    
    # 2. Obtener precio total (Manejo de None)
    precio_total = compra.precio_final or Decimal('0.00')

    # 3. Comparación segura
    if precio_total > 0 and total_pagado >= precio_total:
        compra.estado_de_pago = 'PAGADO' # O 'COMPLETO' según tu modelo
    elif total_pagado > 0:
        compra.estado_de_pago = 'PAGADO_PARCIAL' # Ajusta esto a tus choices reales (ej: PARCIAL)
    else:
        compra.estado_de_pago = 'PENDIENTE'
        
    compra.save(update_fields=['estado_de_pago'])