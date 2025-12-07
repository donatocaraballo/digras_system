# inventario/models.py

from django.db import models
from django.conf import settings
# 🚨 BORRAMOS: from base.utils import registrar_accion (Esto rompía el servidor)

# --- 1. Tablas Maestras (Catálogo) ---

class Categoria(models.Model):
    id_categoria = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=80, unique=True)
    descripcion = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nombre

class Marca(models.Model):
    id_marca = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=80, unique=True)
    descripcion = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nombre

class Producto(models.Model):
    id_producto = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    fecha_creacion = models.DateField(auto_now_add=True)
    
    # Llaves Foráneas (FK)
    id_marca = models.ForeignKey(Marca, on_delete=models.PROTECT)
    id_categoria = models.ForeignKey(Categoria, on_delete=models.PROTECT)
    
    # Atributos específicos
    sku = models.CharField(max_length=20, unique=True, blank=True)
    precio_venta = models.DecimalField(max_digits=10, decimal_places=2)
    peso_unidad = models.DecimalField(max_digits=10, decimal_places=2)

    def save(self, *args, **kwargs):
        # 🚨 Eliminamos la lógica de 'request' y 'registrar_accion' de aquí.
        # Solo dejamos la generación de SKU automática.

        if not self.sku:
            # 1. Obtener el último ID
            ultimo_producto = Producto.objects.all().order_by('id_producto').last()
            if ultimo_producto:
                nuevo_id = ultimo_producto.id_producto + 1
            else:
                nuevo_id = 1

            # 2. Iniciales
            clean_name = self.nombre.strip().replace(" ", "").upper()
            iniciales = clean_name[:2] if len(clean_name) >= 2 else clean_name.ljust(2, 'X')
            
            # 3. Generar SKU
            self.sku = f"PRD-{str(nuevo_id).zfill(4)}-{iniciales}"

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.nombre} ({self.sku})"

# --- 2. Tablas de Inventario ---

class Existencia(models.Model):
    id_existencia = models.AutoField(primary_key=True)
    id_producto = models.OneToOneField(Producto, on_delete=models.CASCADE, related_name='existencia')
    cantidad = models.IntegerField(default=0)
    estado = models.CharField(max_length=30, default="AGOTADO") 

    class Meta:
        verbose_name_plural = "Existencias"

    def __str__(self):
        return f"Existencia de {self.id_producto.nombre}: {self.cantidad}"

class Lote(models.Model):
    id_lote = models.AutoField(primary_key=True)
    id_producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    numero_lote = models.CharField(max_length=60)
    fecha_pedido = models.DateField()
    fecha_vencimiento = models.DateField(blank=True, null=True)
    cantidad = models.IntegerField()
    id_existencia = models.ForeignKey(Existencia, on_delete=models.CASCADE, null=True, blank=True)
    estado = models.CharField(max_length=30, default="ACTIVO")

    def __str__(self):
        return f"Lote {self.numero_lote} de {self.id_producto.nombre}"