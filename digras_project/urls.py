# digras_project/urls.py

from django.contrib import admin
from django.urls import path, include
# No importamos obtain_auth_token aquí para mantener el orden

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # 1. Rutas de la App BASE (Usuarios y Autenticación)
    # La barra final '/' es CRÍTICA.
    path('api/base/', include('base.urls')), 
    
    # 2. Rutas de TUS Apps (Negocio)
    path('api/inventario/', include('inventario.urls')),
    path('api/compras/', include('compras.urls')),
    
    # 3. Rutas de la App ORDENES (De tu compañero)
    path('api/ordenes/', include('ordenes.urls')),
]