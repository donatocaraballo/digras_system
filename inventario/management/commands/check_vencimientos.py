# inventario/management/commands/check_vencimientos.py

from django.core.management.base import BaseCommand
from django.utils import timezone
from inventario.models import Lote

class Command(BaseCommand):
    help = 'Revisa lotes vencidos y actualiza su estado a VENCIDO'

    def handle(self, *args, **options):
        hoy = timezone.now().date()
        
        # Buscar lotes activos cuya fecha de vencimiento sea hoy o antes
        lotes_vencidos = Lote.objects.filter(
            estado='ACTIVO',
            fecha_vencimiento__lte=hoy
        )
        
        count = 0
        for lote in lotes_vencidos:
            lote.estado = 'VENCIDO'
            lote.save() 
            count += 1
            self.stdout.write(self.style.WARNING(f'Lote {lote.numero_lote} ha vencido.'))

        self.stdout.write(self.style.SUCCESS(f'Proceso completado. {count} lotes vencidos procesados.'))