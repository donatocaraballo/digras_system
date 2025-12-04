from .models import RegistroAccion
from django.db import transaction
from django.db.models import F
from inventario.models import Lote, Existencia
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
import requests

def registrar_accion(usuario, modulo, accion, descripcion="", id_referencia=None):
    """
    Registra automáticamente una acción realizada por un usuario.
    Este método será reutilizado en los viewsets.
    """

    # Manejo correcto del usuario (por si llega como anónimo)
    if usuario.is_anonymous:
        user_obj = None
    else:
        user_obj = usuario

    # Crear el registro de acción
    RegistroAccion.objects.create(
        id_usuario=user_obj,  # 👈 AQUÍ EL CAMBIO
        modulo=modulo,
        accion=accion,
        descripcion=descripcion,
        id_referencia=id_referencia
    )

@transaction.atomic
def consumir_inventario_fifo(producto_id, cantidad_requerida):
    """
    Consume inventario FIFO:
    - Resta cantidad de Existencia
    - Resta cantidad de Lotes (comenzando por los más antiguos)
    - Devuelve True si fue exitoso, False si no hay lotes suficientes
    """

    # Bloquear existencia
    existencia = (
        Existencia.objects.select_for_update()
        .filter(id_producto_id=producto_id)
        .first()
    )

    if existencia is None or existencia.cantidad < cantidad_requerida:
        return False  # no hay inventario suficiente global

    # Restar existencia global
    existencia.cantidad = F("cantidad") - cantidad_requerida
    existencia.save()

    # Consumir lotes FIFO
    lotes = (
        Lote.objects.select_for_update()
        .filter(id_producto_id=producto_id)
        .order_by("fecha_pedido", "id_lote")
    )

    restante = cantidad_requerida

    for lote in lotes:
        if restante <= 0:
            break

        if lote.cantidad >= restante:
            lote.cantidad = F("cantidad") - restante
            lote.save()
            restante = 0
        else:
            restante -= lote.cantidad
            lote.cantidad = 0
            lote.save()

    # Si quedan faltantes → error lógico
    if restante > 0:
        raise Exception(
            f"ERROR FIFO: Existencia total suficiente pero "
            f"los lotes no reflejan cantidades coherentes."
        )

    return True

@api_view(['GET'])
@permission_classes([AllowAny]) # Permitimos que cualquiera consulte la tasa
def obtener_tasa_dolar(request):
    try:
        # Django hace la petición servidor-a-servidor (Sin CORS)
        url = 'https://ve.dolarapi.com/v1/dolares/oficial'
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            return Response(response.json()) # Devolvemos el JSON tal cual
        else:
            return Response({'promedio': None, 'error': 'API externa falló'}, status=502)
            
    except Exception as e:
        return Response({'promedio': None, 'error': str(e)}, status=500)