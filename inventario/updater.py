# inventario/updater.py

from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from django.core.management import call_command

def job_verificar_vencimientos():
    # Esta función llama a tu comando existente automáticamente
    print(f"\n[AUTOMÁTICO] Ejecutando revisión de vencimientos... {datetime.now()}")
    try:
        call_command('check_vencimientos')
    except Exception as e:
        print(f"Error en tarea automática: {e}")

def start():
    scheduler = BackgroundScheduler()
    
    # Configuración de la tarea:
    # Para la DEMOSTRACIÓN de la Tesis: Ejecutar cada 1 minuto ('minutes=1')
    # Para PRODUCCIÓN real: Ejecutar cada 24 horas ('hours=24')
    
    scheduler.add_job(job_verificar_vencimientos, 'interval', days=1)
    
    scheduler.start()