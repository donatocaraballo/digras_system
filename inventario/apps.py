# inventario/apps.py

from django.apps import AppConfig

class InventarioConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'inventario'

    def ready(self):
        # Importamos las señales (si tienes)
        import inventario.signals 
        
        # 🚨 INICIAR EL AUTOMATIZADOR AQUÍ 🚨
        # Usamos una verificación para evitar que se ejecute dos veces 
        # (Django runserver tiene un recargador automático que duplica procesos)
        import os
        if os.environ.get('RUN_MAIN', None) != 'true':
            from . import updater
            updater.start()