
from django.db import models

# ============================================================
#                     MODELOS PRINCIPALES
# ============================================================

# ---------------------------
#   CATEGORÍA Y MARCA
# ---------------------------
class Categoria(models.Model):
    id_categoria = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nombre


class Marca(models.Model):
    id_marca = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nombre


# ---------------------------
#   PRODUCTO
# ---------------------------
class Producto(models.Model):
    id_producto = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True, null=True)
    fecha_creacion = models.DateField(auto_now_add=True)
    id_marca = models.ForeignKey(Marca, on_delete=models.PROTECT)
    id_categoria = models.ForeignKey(Categoria, on_delete=models.PROTECT)
    sku = models.CharField(max_length=50, unique=True)
    precio_venta = models.DecimalField(max_digits=10, decimal_places=2)
    peso_unidad = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.nombre} ({self.sku})"


# ---------------------------
#   CLIENTE
# ---------------------------
class Cliente(models.Model):
    id_cliente = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=150)
    direccion = models.TextField(blank=True, null=True)
    correo = models.EmailField(blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return self.nombre


# ---------------------------
#   PROVEEDOR
# ---------------------------
class Proveedor(models.Model):
    id_proveedor = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=150)
    direccion = models.TextField(blank=True, null=True)
    correo = models.EmailField(blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return self.nombre


# ---------------------------
#   COMPRA Y DETALLE COMPRA
# ---------------------------
class Compra(models.Model):
    id_compra = models.AutoField(primary_key=True)
    metodo_pago = models.CharField(max_length=50)
    id_proveedor = models.ForeignKey(Proveedor, on_delete=models.PROTECT)
    fecha_pedido = models.DateField()
    estado = models.CharField(max_length=50)
    precio_final = models.DecimalField(max_digits=12, decimal_places=2)
    peso_total = models.DecimalField(max_digits=12, decimal_places=2)
    cancelacion = models.BooleanField(default=False)

    def __str__(self):
        return f"Compra #{self.id_compra} - {self.id_proveedor.nombre}"


class DetalleCompra(models.Model):
    id_detallec = models.AutoField(primary_key=True)
    id_compra = models.ForeignKey(Compra, on_delete=models.CASCADE)
    id_producto = models.ForeignKey(Producto, on_delete=models.PROTECT)
    cantidad = models.IntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    peso_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    peso_subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    devolucion = models.BooleanField(default=False)
    cantidad_devuelta = models.IntegerField(default=0)

    def __str__(self):
        return f"Detalle Compra #{self.id_compra.id_compra} - {self.id_producto.nombre}"


# ---------------------------
#   ORDEN Y DETALLE ORDEN
# ---------------------------
class Orden(models.Model):
    id_orden = models.AutoField(primary_key=True)
    metodo_pago = models.CharField(max_length=50)
    id_cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT)
    fecha_orden = models.DateField()
    estado = models.CharField(max_length=50)
    precio_final = models.DecimalField(max_digits=12, decimal_places=2)
    peso_total = models.DecimalField(max_digits=12, decimal_places=2)
    cancelacion = models.BooleanField(default=False)

    def __str__(self):
        return f"Orden #{self.id_orden} - {self.id_cliente.nombre}"


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
    cantidad_devuelta = models.IntegerField(default=0)

    def __str__(self):
        return f"Detalle Orden #{self.id_orden.id_orden} - {self.id_producto.nombre}"


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
#   INVENTARIO Y LOTE
# ---------------------------
class Lote(models.Model):
    id_lote = models.AutoField(primary_key=True)
    id_producto = models.ForeignKey(Producto, on_delete=models.PROTECT)
    numero_lote = models.CharField(max_length=50, unique=True)
    fecha_pedido = models.DateField()
    fecha_vencimiento = models.DateField()
    cantidad = models.IntegerField()

    def __str__(self):
        return f"Lote {self.numero_lote} - {self.id_producto.nombre}"


class Existencia(models.Model):
    id_existencia = models.AutoField(primary_key=True)
    id_producto = models.ForeignKey(Producto, on_delete=models.PROTECT)
    cantidad = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.id_producto.nombre} - {self.cantidad} unidades"


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
