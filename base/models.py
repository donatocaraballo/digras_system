
from django.db import models

# ============================================================
#                     MODELOS PRINCIPALES
# ============================================================


# ---------------------------
#   UNIDAD Y ENVÍO
# ---------------------------
class Unidad(models.Model):
    id_unidad = models.AutoField(primary_key=True)
    capacidad_carga = models.DecimalField(max_digits=10, decimal_places=2)
    transportista = models.CharField(max_length=150)
    codigo_unidad = models.CharField(max_length=50, unique=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    estado = models.CharField(max_length=50)

    def __str__(self):
        return f"Unidad {self.codigo_unidad} ({self.transportista})"


class Envio(models.Model):
    id_envio = models.AutoField(primary_key=True)
    codigo_envio = models.CharField(max_length=50, unique=True)
    id_unidad = models.ForeignKey(Unidad, on_delete=models.PROTECT)
    estado = models.CharField(max_length=50)
    fecha_salida = models.DateField()
    fecha_llegada = models.DateField(blank=True, null=True)
    peso_total = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"Envío {self.codigo_envio}"


# ---------------------------
#   USUARIO DEL SISTEMA
# ---------------------------
class Usuario(models.Model):
    id_usuario = models.AutoField(primary_key=True)
    user = models.CharField(max_length=50, unique=True)
    clave = models.CharField(max_length=128)
    nombre = models.CharField(max_length=150)
    tipo = models.CharField(max_length=50)

    def __str__(self):
        return self.user


# ---------------------------
#   REGISTRO DE ACCIONES
# ---------------------------
class RegistroAccion(models.Model):
    id_registro = models.AutoField(primary_key=True)
    id_user = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    fecha_hora = models.DateTimeField(auto_now_add=True)
    modulo = models.CharField(max_length=100)
    accion = models.CharField(max_length=50)
    descripcion = models.TextField()
    id_referencia = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"{self.id_user.user} - {self.accion} ({self.modulo})"
