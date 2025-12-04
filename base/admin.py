from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    Usuario, RegistroAccion, Cliente, Orden, DetalleOrden, Envio, Unidad
)
from inventario.models import Categoria, Marca, Producto, Existencia, Lote
from compras.models import Proveedor, Compra, DetalleCompra

@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    model = Usuario

    # Columnas en la tabla de usuarios
    list_display = ("username", "email", "first_name", "last_name", "tipo", "is_staff", "is_active")
    list_filter = ("tipo", "is_staff", "is_superuser", "is_active")

    # Formulario de edición
    fieldsets = (
        (None, {"fields": ("username", "password")}),
        ("Información personal", {
            "fields": ("first_name", "last_name", "email", "telefono", "direccion")
        }),
        ("Rol y permisos", {
            "fields": ("tipo", "is_active", "is_staff", "is_superuser", "groups", "user_permissions")
        }),
        ("Fechas importantes", {
            "fields": ("last_login", "date_joined")
        }),
    )

    # Formulario de creación (Add User)
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": (
                "username",
                "password1",
                "password2",
                "first_name",
                "last_name",
                "email",
                "tipo",
                "telefono",
                "direccion",
                "is_staff",
                "is_superuser",
                "is_active",
                "groups",
            ),
        }),
    )

    search_fields = ("username", "email", "first_name", "last_name")
    ordering = ("username",)

# --------------------------
# REGISTRO ACCIÓN
# --------------------------
@admin.register(RegistroAccion)
class RegistroAccionAdmin(admin.ModelAdmin):
    list_display = ('id_registro', 'id_usuario', 'modulo', 'accion', 'fecha_y_hora')
    search_fields = ('id_usuario__username', 'modulo', 'accion')
    ordering = ('-fecha_y_hora',)


# --------------------------
# CLIENTE
# --------------------------
@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ('id_cliente', 'nombre', 'correo', 'telefono', 'get_vendedor')

    def get_vendedor(self, obj):
        return obj.id_usuario.username
    get_vendedor.short_description = "Vendedor"


# --------------------------
# ORDEN
# --------------------------
@admin.register(Orden)
class OrdenAdmin(admin.ModelAdmin):
    list_display = (
        'id_orden', 'get_cliente', 'fecha_orden', 'estado_de_envio',
        'precio_final', 'peso_total', 'cancelacion', 'estado_de_pago'
    )
    list_filter = ('estado_de_envio', 'estado_de_pago', 'cancelacion')

    def get_cliente(self, obj):
        return obj.id_cliente.nombre
    get_cliente.short_description = "Cliente"


# --------------------------
# DETALLE ORDEN
# --------------------------
@admin.register(DetalleOrden)
class DetalleOrdenAdmin(admin.ModelAdmin):
    list_display = ('id_detalleo', 'get_orden', 'get_producto', 'cantidad', 'precio_unitario', 'subtotal')

    def get_orden(self, obj):
        return obj.id_orden.id_orden
    get_orden.short_description = "Orden"

    def get_producto(self, obj):
        return obj.id_producto.nombre
    get_producto.short_description = "Producto"


# --------------------------
# ENVÍO
# --------------------------
@admin.register(Envio)
class EnvioAdmin(admin.ModelAdmin):
    list_display = (
        'id_envio', 'codigo_envio', 'get_unidad', 'estado',
        'fecha_salida', 'fecha_llegada', 'peso_total'
    )

    def get_unidad(self, obj):
        return obj.id_unidad.codigo_unidad
    get_unidad.short_description = "Unidad"


# --------------------------
# UNIDAD
# --------------------------
@admin.register(Unidad)
class UnidadAdmin(admin.ModelAdmin):
    list_display = ('id_unidad', 'codigo_unidad', 'placa', 'capacidad_carga', 'get_transportista', 'estado')

    def get_transportista(self, obj):
        return obj.id_usuario.username
    get_transportista.short_description = "Transportista"
