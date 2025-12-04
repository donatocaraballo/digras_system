from django.db import models
from django.conf import settings # Para referenciar el modelo de Usuario
from inventario.models import Producto # Para relacionar la compra con el producto
from base.models import Usuario

METODOS_PAGO_CHOICES = [
    ('TRANSFERENCIA_BS', 'Transferencia (Bs)'),
    ('PAGO_MOVIL', 'Pago Móvil (Bs)'),
    ('TRANSFERENCIA_USD', 'Transferencia en Dólares'),
    ('EFECTIVO_USD', 'Efectivo Divisas'),
]

# --- 1. Tabla Maestra: Proveedor ---

class Proveedor(models.Model):
    # Entidad 11 en tu Diagrama Entidad-Relación
    id_proveedor = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=120)
    direccion = models.TextField(blank=True, null=True)
    correo = models.CharField(max_length=120, blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return self.nombre

# --- 2. Tabla de Cabecera: Compra ---

class Compra(models.Model):
    # Entidad 12 en tu Diagrama Entidad-Relación
    id_compra = models.AutoField(primary_key=True)
    
    # Campos de Transacción
    metodo_pago = models.CharField(
        max_length=50, 
        choices=METODOS_PAGO_CHOICES, 
        default='TRANSFERENCIA_BS'
    )
    fecha_pedido = models.DateField()
    precio_final = models.DecimalField(max_digits=12, decimal_places=2, default=0.00) 
    peso_total = models.DecimalField(max_digits=20, decimal_places=2, default=0.00, null=True, blank=True)
    cancelacion = models.BooleanField(default=False)
    
    # Llaves Foráneas (FK)
    id_proveedor = models.ForeignKey(Proveedor, on_delete=models.PROTECT) # FK a Proveedor [cite: 1865]
    id_usuario = models.ForeignKey(Usuario, on_delete=models.PROTECT) # FK a Usuario que creó la compra [cite: 1866]

    # Estados de la Compra
    ESTADO_ENVIO_CHOICES = [
        ('PENDIENTE_APROBACION', 'Pendiente de Aprobación'), # Creada por Admin, esperando Gerente
        ('APROBADA', 'Aprobada, Pendiente de Recepción'), # Aprobada por Gerente, esperando Almacenista
        ('RECIBIDA_PARCIAL', 'Recibida Parcialmente'), 
        ('RECIBIDA_COMPLETA', 'Recibida Completamente'), # Mercancía en inventario
        ('CANCELADA', 'Cancelada'),
    ]
    estado_de_envio = models.CharField(max_length=40, choices=ESTADO_ENVIO_CHOICES, default='PENDIENTE_APROBACION', null=True, blank=True) # [cite: 1867]
    estado_de_pago = models.CharField(max_length=30, default='PENDIENTE', null=True, blank=True) # [cite: 1871]

    def saldo_pendiente(self):
        # Evitar error si la tabla no existe o precio es None
        try:
            total_pagado = sum(p.monto for p in self.pagos.all())
        except Exception:
            total_pagado = 0
            
        precio = self.precio_final or 0
        return precio - total_pagado

    def __str__(self):
        return f"Compra N°{self.id_compra} a {self.id_proveedor.nombre}"

# --- 3. Tabla de Detalle: DetalleCompra ---

class DetalleCompra(models.Model):
    # Entidad 13 en tu Diagrama Entidad-Relación
    id_detallec = models.AutoField(primary_key=True)
    
    # FKs
    id_compra = models.ForeignKey(Compra, on_delete=models.CASCADE) # FK a Compra [cite: 1873]
    id_producto = models.ForeignKey(Producto, on_delete=models.PROTECT) # FK a Producto [cite: 1874]
    
    # Campos de Cantidad/Precios
    cantidad = models.IntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    peso_unitario = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    peso_subtotal = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    # Devoluciones
    devolucion = models.BooleanField(default=False)
    cantidad_devolvida = models.IntegerField(default=0)
    nota = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Detalle de Compra {self.id_compra.id_compra}: {self.cantidad} x {self.id_producto.nombre}"
    
class PagoCompra(models.Model):
    id_pago = models.AutoField(primary_key=True)
    id_compra = models.ForeignKey(Compra, related_name='pagos', on_delete=models.CASCADE)
    
    METODO_PAGO_CHOICES = [
        ('TRANSFERENCIA_BS', 'Transferencia (Bs)'),
        ('PAGO_MOVIL', 'Pago Móvil (Bs)'),
        ('EFECTIVO_BS', 'Efectivo (Bs)'),
        ('TRANSFERENCIA_USD', 'Transferencia ($)'),
        ('EFECTIVO_USD', 'Efectivo ($)'),
        ('ZELLE', 'Zelle ($)'),
    ]
    metodo_pago = models.CharField(max_length=50, choices=METODO_PAGO_CHOICES)
    
    # 🚨 CAMPOS NUEVOS PARA MULTIMONEDA 🚨
    # 'monto': Siempre será el valor convertido a DÓLARES (para restar la deuda)
    monto = models.DecimalField(max_digits=12, decimal_places=2) 
    
    # 'monto_local': Lo que el usuario pagó realmente en su moneda (ej: 1500 Bs)
    monto_local = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    
    # 'tasa_cambio': La tasa usada en el momento (ej: 36.50)
    tasa_cambio = models.DecimalField(max_digits=10, decimal_places=2, default=1.00)
    
    # 'moneda': Para saber qué símbolo mostrar
    moneda = models.CharField(max_length=3, default='USD', choices=[('USD', 'USD'), ('VES', 'VES')])
    
    referencia = models.CharField(max_length=100, blank=True, null=True)
    fecha_pago = models.DateField(auto_now_add=True)
    
    def __str__(self):
        return f"Pago {self.id_pago}: {self.monto} USD ({self.monto_local} {self.moneda})"