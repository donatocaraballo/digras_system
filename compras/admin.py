# compras/admin.py

from django.contrib import admin
from .models import Proveedor, Compra, DetalleCompra

class DetalleCompraInline(admin.TabularInline):
    model = DetalleCompra
    extra = 0 # No muestra filas vacías extra
    # Aquí no definimos list_display porque es un Inline

@admin.register(Compra)
class CompraAdmin(admin.ModelAdmin):
    # Usamos los nombres reales de tus modelos
    list_display = ('id_compra', 'id_proveedor', 'fecha_pedido', 'precio_final', 'estado_de_envio')
    list_filter = ('estado_de_envio', 'fecha_pedido')
    inlines = [DetalleCompraInline] # Esto permite ver los detalles dentro de la compra

@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display = ('id_proveedor', 'nombre', 'telefono', 'correo')

# Si quieres registrar el detalle por separado (opcional):
@admin.register(DetalleCompra)
class DetalleCompraAdmin(admin.ModelAdmin):
    # 🚨 CORRECCIÓN DEL ERROR: Usamos 'id_detallec', no 'id_detalleg'
    list_display = ('id_detallec', 'id_compra', 'id_producto', 'cantidad', 'subtotal')