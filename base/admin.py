from django.contrib import admin
from .models import (
    Categoria, Marca, Producto, Cliente, Proveedor,
    Compra, DetalleCompra, Orden, DetalleOrden,
    Unidad, Envio, Lote, Existencia, Usuario, RegistroAccion
)

# ============================================================
#                CONFIGURACIÓN DEL PANEL ADMIN
# ============================================================

@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ('id_categoria', 'nombre', 'descripcion')
    search_fields = ('nombre',)
    ordering = ('id_categoria',)


@admin.register(Marca)
class MarcaAdmin(admin.ModelAdmin):
    list_display = ('id_marca', 'nombre', 'descripcion')
    search_fields = ('nombre',)
    ordering = ('id_marca',)


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ('id_producto', 'nombre', 'sku', 'precio_venta', 'id_marca', 'id_categoria', 'fecha_creacion')
    search_fields = ('nombre', 'sku')
    list_filter = ('id_marca', 'id_categoria')
    ordering = ('nombre',)


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ('id_cliente', 'nombre', 'correo', 'telefono')
    search_fields = ('nombre', 'correo', 'telefono')


@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display = ('id_proveedor', 'nombre', 'correo', 'telefono')
    search_fields = ('nombre', 'correo', 'telefono')


@admin.register(Compra)
class CompraAdmin(admin.ModelAdmin):
    list_display = ('id_compra', 'id_proveedor', 'fecha_pedido', 'metodo_pago', 'estado', 'precio_final', 'peso_total')
    search_fields = ('id_proveedor__nombre', 'estado', 'metodo_pago')
    list_filter = ('estado', 'metodo_pago')
    ordering = ('-fecha_pedido',)


@admin.register(DetalleCompra)
class DetalleCompraAdmin(admin.ModelAdmin):
    list_display = ('id_detallec', 'id_compra', 'id_producto', 'cantidad', 'subtotal', 'devolucion')
    list_filter = ('devolucion',)
    search_fields = ('id_producto__nombre',)


@admin.register(Orden)
class OrdenAdmin(admin.ModelAdmin):
    list_display = ('id_orden', 'id_cliente', 'fecha_orden', 'metodo_pago', 'estado', 'precio_final')
    list_filter = ('estado', 'metodo_pago')
    search_fields = ('id_cliente__nombre',)
    ordering = ('-fecha_orden',)


@admin.register(DetalleOrden)
class DetalleOrdenAdmin(admin.ModelAdmin):
    list_display = ('id_detalleo', 'id_orden', 'id_producto', 'cantidad', 'subtotal', 'devolucion')
    list_filter = ('devolucion',)
    search_fields = ('id_producto__nombre',)


@admin.register(Unidad)
class UnidadAdmin(admin.ModelAdmin):
    list_display = ('id_unidad', 'codigo_unidad', 'transportista', 'capacidad_carga', 'estado')
    search_fields = ('codigo_unidad', 'transportista')
    list_filter = ('estado',)


@admin.register(Envio)
class EnvioAdmin(admin.ModelAdmin):
    list_display = ('id_envio', 'codigo_envio', 'id_unidad', 'estado', 'fecha_salida', 'fecha_llegada', 'peso_total')
    list_filter = ('estado',)
    search_fields = ('codigo_envio',)
    ordering = ('-fecha_salida',)


@admin.register(Lote)
class LoteAdmin(admin.ModelAdmin):
    list_display = ('id_lote', 'numero_lote', 'id_producto', 'fecha_pedido', 'fecha_vencimiento', 'cantidad')
    list_filter = ('fecha_vencimiento',)
    search_fields = ('numero_lote', 'id_producto__nombre')
    ordering = ('fecha_vencimiento',)


@admin.register(Existencia)
class ExistenciaAdmin(admin.ModelAdmin):
    list_display = ('id_existencia', 'id_producto', 'cantidad')
    search_fields = ('id_producto__nombre',)


@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ('id_usuario', 'user', 'nombre', 'tipo')
    search_fields = ('user', 'nombre', 'tipo')
    list_filter = ('tipo',)


@admin.register(RegistroAccion)
class RegistroAccionAdmin(admin.ModelAdmin):
    list_display = ('id_registro', 'id_user', 'modulo', 'accion', 'fecha_hora', 'id_referencia')
    search_fields = ('id_user__user', 'modulo', 'accion', 'descripcion')
    list_filter = ('modulo', 'accion')
    ordering = ('-fecha_hora',)
