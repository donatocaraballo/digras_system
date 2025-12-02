from django.db import models
from django.conf import settings

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
    fecha_creacion = models.DateField(auto_now_add=True) # [cite: 1819]
    
    # Llaves Foráneas (FK)
    id_marca = models.ForeignKey(Marca, on_delete=models.PROTECT) # [cite: 1820]
    id_categoria = models.ForeignKey(Categoria, on_delete=models.PROTECT) # [cite: 1821]
    
    # Atributos específicos del producto
    sku = models.CharField(max_length=20, unique=True, blank=True)
    precio_venta = models.DecimalField(max_digits=10, decimal_places=2) # [cite: 1822]
    peso_unidad = models.DecimalField(max_digits=10, decimal_places=2) # [cite: 1823]

    def save(self, *args, **kwargs):
        if not self.sku:
            # 1. Obtener el último ID para calcular el consecutivo
            ultimo_producto = Producto.objects.all().order_by('id_producto').last()
            if ultimo_producto:
                nuevo_id = ultimo_producto.id_producto + 1
            else:
                nuevo_id = 1 # Empieza en 1 (0001)

            # 2. Iniciales del nombre
            clean_name = self.nombre.strip().replace(" ", "").upper()
            iniciales = clean_name[:2] if len(clean_name) >= 2 else clean_name.ljust(2, 'X')
            
            # 3. Generar SKU con 4 DÍGITOS: PRD-0001-JA
            self.sku = f"PRD-{str(nuevo_id).zfill(4)}-{iniciales}"

        super().save(*args, **kwargs)

    def generar_sku_estandar(self):
        """
        Genera un SKU con formato: 'PRD-{ID}-{INICIALES}'
        Ejemplo: Para 'Jamón Ahumado' -> 'PRD-001-JA'
        """
        # 1. Obtener iniciales (Dos primeras letras del nombre, en mayúsculas)
        if self.nombre:
            # Limpiamos espacios y tomamos las 2 primeras letras
            clean_name = self.nombre.replace(" ", "").upper()
            sufijo = clean_name[:2] 
        else:
            sufijo = "XX"

        # 2. Obtener un consecutivo. 
        # Como el ID no existe antes de guardar por primera vez, usamos un conteo o un random seguro.
        # Para tesis, usaremos un random de 4 dígitos para evitar colisiones simples antes del ID.
        # O mejor, consultamos el último ID.
        ultimo_prod = Producto.objects.all().order_by('id_producto').last()
        if ultimo_prod:
            nuevo_id = ultimo_prod.id_producto + 1
        else:
            nuevo_id = 1
            
        consecutivo = str(nuevo_id).zfill(3) # Rellena con ceros: 1 -> 001

        # 3. Formato Final: PRD-001-JA
        return f"PRD-{consecutivo}-{sufijo}"

    def __str__(self):
        return f"{self.nombre} ({self.sku})"

# --- 2. Tablas de Inventario ---

class Existencia(models.Model):
    # Consolida la cantidad total disponible de cada producto. [cite: 1833]
    id_existencia = models.AutoField(primary_key=True) # [cite: 1834]
    # OneToOneField: Un producto tiene un solo registro de existencia.
    id_producto = models.OneToOneField(Producto, on_delete=models.CASCADE, related_name='existencia') # [cite: 1834]
    cantidad = models.IntegerField(default=0) # [cite: 1835]
    # Estado: disponible, bajo, agotado [cite: 1836]
    estado = models.CharField(max_length=30, default="AGOTADO") 

    class Meta:
        verbose_name_plural = "Existencias"

    def __str__(self):
        return f"Existencia de {self.id_producto.nombre}: {self.cantidad}"

class Lote(models.Model):
    # Controla la llegada de productos, caducidad y cantidad por lote. [cite: 1824]
    id_lote = models.AutoField(primary_key=True) # [cite: 1825]
    id_producto = models.ForeignKey(Producto, on_delete=models.CASCADE) # [cite: 1826]
    numero_lote = models.CharField(max_length=60) # [cite: 1827]
    fecha_pedido = models.DateField() # [cite: 1828]
    fecha_vencimiento = models.DateField(blank=True, null=True) # [cite: 1829]
    cantidad = models.IntegerField() # [cite: 1830]
    # Vinculado para referencia, la Existencia consolidada es la fuente principal.
    id_existencia = models.ForeignKey(Existencia, on_delete=models.CASCADE, null=True, blank=True) # [cite: 1831]
    estado = models.CharField(max_length=30, default="ACTIVO") # [cite: 1832]

    def __str__(self):
        return f"Lote {self.numero_lote} de {self.id_producto.nombre}"