from django.shortcuts import render
from rest_framework import viewsets
from .models import (
    Categoria, Marca, Producto, Cliente, Proveedor,
    Compra, DetalleCompra, Orden, DetalleOrden,
    Unidad, Envio, Lote, Existencia, Usuario, RegistroAccion
)
from .serializers import (
    CategoriaSerializer, MarcaSerializer, ProductoSerializer,
    ClienteSerializer, ProveedorSerializer, CompraSerializer,
    DetalleCompraSerializer, OrdenSerializer, DetalleOrdenSerializer,
    UnidadSerializer, EnvioSerializer, LoteSerializer,
    ExistenciaSerializer, UsuarioSerializer, RegistroAccionSerializer
)

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer


class MarcaViewSet(viewsets.ModelViewSet):
    queryset = Marca.objects.all()
    serializer_class = MarcaSerializer


class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer


class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer


class ProveedorViewSet(viewsets.ModelViewSet):
    queryset = Proveedor.objects.all()
    serializer_class = ProveedorSerializer


class CompraViewSet(viewsets.ModelViewSet):
    queryset = Compra.objects.all()
    serializer_class = CompraSerializer


class DetalleCompraViewSet(viewsets.ModelViewSet):
    queryset = DetalleCompra.objects.all()
    serializer_class = DetalleCompraSerializer


class OrdenViewSet(viewsets.ModelViewSet):
    queryset = Orden.objects.all()
    serializer_class = OrdenSerializer


class DetalleOrdenViewSet(viewsets.ModelViewSet):
    queryset = DetalleOrden.objects.all()
    serializer_class = DetalleOrdenSerializer


class UnidadViewSet(viewsets.ModelViewSet):
    queryset = Unidad.objects.all()
    serializer_class = UnidadSerializer


class EnvioViewSet(viewsets.ModelViewSet):
    queryset = Envio.objects.all()
    serializer_class = EnvioSerializer


class LoteViewSet(viewsets.ModelViewSet):
    queryset = Lote.objects.all()
    serializer_class = LoteSerializer


class ExistenciaViewSet(viewsets.ModelViewSet):
    queryset = Existencia.objects.all()
    serializer_class = ExistenciaSerializer


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer


class RegistroAccionViewSet(viewsets.ModelViewSet):
    queryset = RegistroAccion.objects.all().order_by('-fecha_hora')
    serializer_class = RegistroAccionSerializer