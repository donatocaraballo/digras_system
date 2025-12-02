# compras/apps.py

from django.apps import AppConfig

class ComprasConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'compras'

    def ready(self):
        # Importa las señales aquí para que Django las cargue
        import compras.signals