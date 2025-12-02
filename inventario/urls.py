from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoriaViewSet, MarcaViewSet, ProductoViewSet, 
    ExistenciaViewSet, LoteViewSet
)

router = DefaultRouter()
router.register(r'categorias', CategoriaViewSet)
router.register(r'marcas', MarcaViewSet)
router.register(r'productos', ProductoViewSet)
router.register(r'existencias', ExistenciaViewSet)
router.register(r'lotes', LoteViewSet, basename='lote')

urlpatterns = [
    path('', include(router.urls)),
]