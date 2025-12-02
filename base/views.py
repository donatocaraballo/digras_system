from django.shortcuts import render
from rest_framework import viewsets
from .models import (
    Unidad, Envio, Usuario, RegistroAccion
)
from .serializers import (
    UnidadSerializer, EnvioSerializer, UsuarioSerializer, RegistroAccionSerializer
)

class UnidadViewSet(viewsets.ModelViewSet):
    queryset = Unidad.objects.all()
    serializer_class = UnidadSerializer


class EnvioViewSet(viewsets.ModelViewSet):
    queryset = Envio.objects.all()
    serializer_class = EnvioSerializer

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer


class RegistroAccionViewSet(viewsets.ModelViewSet):
    queryset = RegistroAccion.objects.all().order_by('-fecha_hora')
    serializer_class = RegistroAccionSerializer