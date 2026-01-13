
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from inventario.models import Producto

class Usuario(AbstractUser):
    id_usuario = models.AutoField(primary_key=True)

    TIPO_USUARIO = [
        ('GERENTE', 'Gerente'),
        ('ADMINISTRADOR', 'Administrador'),
        ('VENDEDOR', 'Vendedor'),
        ('ALMACENISTA', 'Almacenista'),
        ('TRANSPORTISTA', 'Transportista'),
    ]
    tipo = models.CharField(max_length=20, choices=TIPO_USUARIO, default='VENDEDOR')

    telefono = models.CharField(max_length=20, blank=True, null=True)
    direccion = models.CharField(max_length=255, blank=True, null=True)

    codigo_recuperacion = models.CharField(max_length=6, blank=True, null=True)
    fecha_recuperacion = models.DateTimeField(blank=True, null=True)

    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to.',
        related_name="usuario_base_set", # Nombre único para evitar choque
        related_query_name="usuario",
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name="usuario_base_set", # Nombre único para evitar choque
        related_query_name="usuario",
    )

    def __str__(self):
        return f"{self.username} ({self.tipo})"

# ---------------------------
#   REGISTRO DE ACCIONES
# ---------------------------
class RegistroAccion(models.Model):
    id_registro = models.AutoField(primary_key=True)
    id_usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,  # porque en utils podrías pasar None si es anónimo
        blank=True
    )
    modulo = models.CharField(max_length=100)
    accion = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    fecha_y_hora = models.DateTimeField(auto_now_add=True)
    id_referencia = models.IntegerField(null=True, blank=True)

# ---------------------------
#   CLIENTE
# ---------------------------
class Cliente(models.Model):
    id_cliente = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)

    direccion = models.TextField(blank=True)
    correo = models.CharField(max_length=120, blank=True)
    telefono = models.CharField(max_length=20, blank=True)

    # 👇 Nuevo campo: activo por defecto
    activo = models.BooleanField(default=True)

    # Vendedor asociado al cliente
    id_usuario = models.ForeignKey(Usuario, on_delete=models.PROTECT)

    def __str__(self):
        return self.nombre


# ---------------------------
#   UNIDAD (VEHÍCULOS)
# ---------------------------
class Unidad(models.Model):
    id_unidad = models.AutoField(primary_key=True)
    capacidad_carga = models.DecimalField(max_digits=12, decimal_places=2)
    id_usuario = models.ForeignKey(Usuario, on_delete=models.PROTECT)
    codigo_unidad = models.CharField(max_length=50)
    telefono = models.CharField(max_length=20)
    estado = models.CharField(max_length=40)
    placa = models.CharField(max_length=15)

    def __str__(self):
        return self.codigo_unidad


# ---------------------------
#   ENVÍO
# ---------------------------
class Envio(models.Model):
    id_envio = models.AutoField(primary_key=True)
    codigo_envio = models.CharField(max_length=60)
    id_unidad = models.ForeignKey(Unidad, on_delete=models.PROTECT)
    estado = models.CharField(max_length=40)
    fecha_salida = models.DateTimeField()
    fecha_llegada = models.DateTimeField(null=True, blank=True)
    peso_total = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return self.codigo_envio


# ---------------------------
#   ÓRDENES
# ---------------------------
class Orden(models.Model):
    id_orden = models.AutoField(primary_key=True)
    metodo_pago = models.CharField(max_length=50)
    id_cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT)
    fecha_orden = models.DateField(auto_now_add=True)
    estado_de_envio = models.CharField(max_length=40, default="PENDIENTE POR APROBACIÓN")
    estado_de_pago = models.CharField(max_length=30, default="PENDIENTE POR PAGO")
    precio_final = models.DecimalField(max_digits=12, decimal_places=2)
    peso_total = models.DecimalField(max_digits=12, decimal_places=2)
    cancelacion = models.BooleanField(default=False)
    id_envio = models.ForeignKey(Envio, null=True, blank=True, on_delete=models.SET_NULL)
    id_usuario = models.ForeignKey(Usuario, on_delete=models.PROTECT)

    def __str__(self):
        return f"Orden {self.id_orden}"


# ---------------------------
#   DETALLE ÓRDENES
# ---------------------------
class DetalleOrden(models.Model):
    id_detalleo = models.AutoField(primary_key=True)
    id_orden = models.ForeignKey(Orden, on_delete=models.CASCADE)
    id_producto = models.ForeignKey(Producto, on_delete=models.PROTECT)
    cantidad = models.IntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    peso_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    peso_subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    devolucion = models.BooleanField(default=False)
    cantidad_devolvida = models.IntegerField(default=0)
    nota = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"Detalle Orden {self.id_detalleo}"
