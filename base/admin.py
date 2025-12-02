from django.contrib import admin
from .models import (
    Unidad, Envio, Usuario, RegistroAccion
)

# ============================================================
#                CONFIGURACIÓN DEL PANEL ADMIN
# ============================================================

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
