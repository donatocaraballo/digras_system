from rest_framework import serializers
from .models import (
    Unidad, Envio, Usuario, RegistroAccion
)

class UnidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unidad
        fields = '__all__'

class EnvioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Envio
        fields = '__all__'

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = '__all__'

class RegistroAccionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegistroAccion
        fields = '__all__'
