// frontend/src/components/CreatePurchaseModal.jsx

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import CreateProveedorModal from './CreateProveedorModal'; 
import CreateProductModal from './CreateProductModal';

// Rutas de la API
const COMPRAS_URL = '/api/compras/compras/';
const PRODUCTOS_URL = '/api/inventario/productos/';
const PROVEEDORES_URL = '/api/compras/proveedores/';

// Opciones de Pago (coinciden con compras/models.py)
const METODOS_PAGO_CHOICES = [
    { value: 'TRANSFERENCIA_BS', label: 'Transferencia (Bs)' },
    { value: 'PAGO_MOVIL', label: 'Pago Móvil (Bs)' },
    { value: 'TRANSFERENCIA_USD', label: 'Transferencia en Dólares' },
    { value: 'EFECTIVO_USD', label: 'Efectivo Divisas' },
];

function CreatePurchaseModal({ isOpen, onClose, onUpdate, userId }) {
    // --- Estados de la Compra ---
    const [metodoPago, setMetodoPago] = useState(METODOS_PAGO_CHOICES[0].value);
    const [fechaPedido, setFechaPedido] = useState(new Date().toISOString().split('T')[0]);
    const [selectedProviderId, setSelectedProviderId] = useState(''); 
    
    // --- Estados de Catálogo y Control ---
    const [productsList, setProductsList] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [detalles, setDetalles] = useState([]);
    
    const [statusMessage, setStatusMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [isProveedorModalOpen, setIsProveedorModalOpen] = useState(false);
    const [optionsKey, setOptionsKey] = useState(0); 

    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [activeDetailIndex, setActiveDetailIndex] = useState(null);

    // --- Carga Inicial de Datos (Productos y Proveedores) ---
    const fetchCatalogData = useCallback(async () => {
        try {
            const [productsRes, providersRes] = await Promise.all([
                axios.get(PRODUCTOS_URL),
                axios.get(PROVEEDORES_URL)
            ]);
            
            setProductsList(productsRes.data);
            setProveedores(providersRes.data);
            
            // Seleccionar proveedor por defecto
            if (providersRes.data.length > 0) {
                // Asegura que el ID sea numérico
                setSelectedProviderId(parseInt(providersRes.data[0].id_proveedor)); 
            }
            
        } catch (error) {
            console.error("Error al cargar datos del catálogo y proveedores:", error);
            const errMsg = error.response ? JSON.stringify(error.response.data) : error.message;
            setError(`❌ Error al cargar opciones principales: ${errMsg}. Revisa tu Django log.`);
        }
    }, [optionsKey]);

    useEffect(() => {
        if (isOpen) {
            fetchCatalogData();
            setError(null);
            setStatusMessage('');
            // Aseguramos que si se cierra y vuelve a abrir, los detalles se reseteen
            if (detalles.length === 0 && productsList.length > 0) {
                 handleAddDetail();
            }
        }
    }, [isOpen, fetchCatalogData]);

    const handleProductCreated = (newId) => {
        // 1. Forzar recarga del catálogo
        setOptionsKey(prev => prev + 1); 
        
        // 2. Asignar el nuevo producto a la línea activa
        if (activeDetailIndex !== null) {
            handleDetailChange(activeDetailIndex, 'id_producto', newId);
        }
        
        setIsProductModalOpen(false);
    };


    // Handler para nueva creación de Proveedor: Forzar Recarga de Proveedores
    const handleProveedorCreated = (newId) => {
        setOptionsKey(prev => prev + 1); // Forzar re-fetch de proveedores
        setSelectedProviderId(newId); // Seleccionar el nuevo proveedor
        setIsProveedorModalOpen(false); // Cerrar modal
    };

    // --- Lógica de Manejo de Detalles (Recálculo y CRUD) ---
    const handleDetailChange = (index, field, value) => {
        const newDetalles = [...detalles];
        newDetalles[index][field] = value;
        
        const detalle = newDetalles[index];

        // Recalcular el Subtotal de la línea
        const cantidad = parseFloat(detalle.cantidad || 0);
        const precio = parseFloat(detalle.precio_unitario || 0);

        detalle.subtotal = cantidad * precio; 
        
        // El peso se excluyó del cálculo, por lo que no es necesario aquí.
        
        setDetalles(newDetalles);
    };

    const handleAddDetail = () => {
        if (productsList.length === 0) {
            alert("No hay productos en el catálogo para añadir.");
            return;
        }

        const defaultProduct = productsList[0];
        
        setDetalles([...detalles, {
            id_producto: defaultProduct.id_producto,
            id_producto_nombre: defaultProduct.nombre,
            cantidad: 1,
            precio_unitario: defaultProduct.precio_venta,
            subtotal: defaultProduct.precio_venta * 1,
            // Campos de peso se envían como nulo si no se gestionan
        }]);
    };

    const handleRemoveDetail = (index) => {
        const newDetalles = [...detalles];
        newDetalles.splice(index, 1);
        setDetalles(newDetalles);
    };
    
    // --- Lógica de Envío (POST) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (detalles.length === 0 || !selectedProviderId) {
             alert("Debe seleccionar un proveedor y añadir al menos un producto.");
             return;
        }
        
        setIsSubmitting(true);
        setStatusMessage('Creando Compra y Detalles...');
        setError(null);

        const finalPrice = detalles.reduce((sum, d) => sum + d.subtotal, 0);

        try {
            const purchaseData = {
                id_proveedor: parseInt(selectedProviderId),
                fecha_pedido: fechaPedido,
                metodo_pago: metodoPago,
                id_usuario: userId, 
                precio_final: finalPrice, 
                // Se excluye peso_total (se asume null/0 en Django)
                
                // Detalles anidados (Solo los campos de valor y cantidad)
                detalles: detalles.map(d => ({
                    id_producto: d.id_producto,
                    cantidad: d.cantidad,
                    precio_unitario: d.precio_unitario,
                    subtotal: d.subtotal,
                    // Se omiten los campos de peso para evitar errores de validación de 12 dígitos.
                })),
            };

            await axios.post(COMPRAS_URL, purchaseData);
            
            setStatusMessage(`✅ Orden de Compra creada exitosamente. Pendiente de Aprobación.`);
            
            // Limpiamos y cerramos
            setDetalles([]); 
            setMetodoPago(METODOS_PAGO_CHOICES[0].value);
            onUpdate();
            setTimeout(onClose, 1500); 
            
        } catch (error) {
            const errMsg = error.response ? JSON.stringify(error.response.data) : error.message;
            setError('❌ Error al crear la Compra: ' + errMsg);
            console.error("Error POST Compra:", error);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (!isOpen) return null;

    const finalPrice = detalles.reduce((sum, d) => sum + (d.subtotal || 0), 0);
    const hasProducts = productsList.length > 0;

    return (
        <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
                <h2>Nueva Orden de Compra</h2>
                <button type="button" onClick={onClose} style={closeButtonStyle}>X</button>

                <form onSubmit={handleSubmit}>
                    {/* SELECTOR DE PROVEEDOR Y BOTÓN CREAR NUEVO */}
                    <label style={labelStyle}>Proveedor:</label>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                        <select 
                            value={selectedProviderId} 
                            onChange={(e) => setSelectedProviderId(parseInt(e.target.value))} 
                            required 
                            style={{ ...inputStyle, width: '70%', marginBottom: '0' }}
                        >
                             {proveedores.map(p => (
                                <option key={p.id_proveedor} value={p.id_proveedor}>{p.nombre}</option>
                            ))}
                        </select>
                        <button type="button" onClick={() => setIsProveedorModalOpen(true)} style={createButtonStyle}>
                            + Nuevo
                        </button>
                    </div>
                    
                    {/* FECHA Y MÉTODO DE PAGO */}
                    <div style={inputGroupStyle}>
                        <div style={{ marginBottom: '10px' }}>
                            <label style={labelStyle}>Método de Pago:</label>
                            <select 
                                value={metodoPago} 
                                onChange={(e) => setMetodoPago(e.target.value)} 
                                required 
                                style={{ ...inputStyle, margin: '5px 0' }}
                            >
                                {METODOS_PAGO_CHOICES.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <label style={labelStyle}>Fecha del Pedido:</label>
                        <input type="date" value={fechaPedido} onChange={(e) => setFechaPedido(e.target.value)} required style={inputStyle} />
                    </div>

                    <hr style={{ margin: '20px 0' }} />

                    {/* DETALLES DE PRODUCTO (LÍNEAS) */}
                    <h4>Productos a Comprar ({detalles.length} líneas)</h4>
                    
                    {detalles.map((detalle, index) => (
                        <div key={index} style={detailGroupStyle}>
                            <h5 style={{marginBottom: '10px'}}>Línea {index + 1}</h5>
                            
                            <label style={labelStyle}>Producto:</label>
                            <select 
                                value={detalle.id_producto} 
                                onChange={(e) => handleDetailChange(index, 'id_producto', parseInt(e.target.value))} 
                                required 
                                style={inputStyle}
                            >
                                {productsList.map(p => (
                                    <option key={p.id_producto} value={p.id_producto}>{p.nombre} (SKU: {p.sku})</option>
                                ))}
                            </select>

                            <button 
                                    type="button" 
                                    onClick={() => {
                                        setActiveDetailIndex(index);
                                        setIsProductModalOpen(true);
                                    }} 
                                    style={createButtonStyle}
                                    title="Crear nuevo producto si no existe"
                                >
                                    + P
                            </button>

                            <label style={labelStyle}>Cantidad:</label>
                            <input 
                                type="number" 
                                value={detalle.cantidad} 
                                onChange={(e) => handleDetailChange(index, 'cantidad', e.target.value)} 
                                required min="1"
                                style={detailInputStyle} 
                            />

                            <label style={labelStyle}>Precio Unitario:</label>
                            <input 
                                type="number" 
                                value={detalle.precio_unitario} 
                                onChange={(e) => handleDetailChange(index, 'precio_unitario', e.target.value)} 
                                required 
                                step="0.01"
                                style={detailInputStyle} 
                            />
                            
                            <p style={{marginTop: '10px', fontWeight: 'bold'}}>Subtotal Línea: **${detalle.subtotal ? detalle.subtotal.toFixed(2) : '0.00'}**</p>

                            <button type="button" onClick={() => handleRemoveDetail(index)} style={removeButtonStyle}>
                                Quitar Línea
                            </button>
                        </div>
                    ))}
                    
                    <button type="button" onClick={handleAddDetail} style={addDetailButtonStyle} disabled={productsList.length === 0}>
                        + Añadir Línea de Producto
                    </button>
                    
                    <hr style={{ margin: '20px 0' }} />

                    {/* TOTALES FINALES */}
                    <h4 style={{textAlign: 'right', color: '#009688'}}>
                        TOTAL COMPRA: **${finalPrice.toFixed(2)}**
                    </h4>

                    <div style={buttonGroupStyle}>
                        <button type="submit" style={submitButtonStyle} disabled={isSubmitting || detalles.length === 0 || !selectedProviderId}>
                            {isSubmitting ? 'Procesando...' : 'CREAR ORDEN'}
                        </button>
                        <button type="button" onClick={onClose} style={cancelButtonStyle} disabled={isSubmitting}>Cancelar</button>
                    </div>
                    
                    {statusMessage && <p style={{ marginTop: '15px', color: 'green', fontWeight: 'bold' }}>{statusMessage}</p>}
                    {error && <p style={{ marginTop: '15px', color: 'red', fontWeight: 'bold' }}>{error}</p>}
                </form>
            </div>
            {/* Modal de Creación de Proveedor */}
            <CreateProveedorModal
                isOpen={isProveedorModalOpen}
                onClose={() => setIsProveedorModalOpen(false)}
                onProveedorCreated={handleProveedorCreated}
            />

            {/* NUEVO MODAL DE PRODUCTO */}
            <CreateProductModal 
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                onProductCreated={handleProductCreated}
            />
        </div>
    );
}

// Estilos
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 };
const modalContentStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '600px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' };
const inputGroupStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' };
const inputStyle = { width: '100%', padding: '10px', margin: '5px 0 10px', boxSizing: 'border-box', border: '1px solid #ccc' };
const detailGroupStyle = { border: '1px solid #ddd', padding: '15px', marginBottom: '15px', backgroundColor: 'white' };
const detailInputStyle = { width: '48%', padding: '8px', margin: '5px 5px 10px 0', boxSizing: 'border-box', border: '1px solid #ccc' };
const labelStyle = { display: 'block', fontWeight: 'bold' };
const createButtonStyle = { padding: '10px 15px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginLeft: '10px' };
const addDetailButtonStyle = { padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'block', width: '100%', marginBottom: '15px' };
const removeButtonStyle = { padding: '5px 10px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', float: 'right' };
const submitButtonStyle = { padding: '15px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', width: '100%', fontWeight: 'bold' };
const buttonGroupStyle = { marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' };
const cancelButtonStyle = { padding: '10px 15px', backgroundColor: '#9e9e9e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' };
const closeButtonStyle = { position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', fontSize: '1.2em', cursor: 'pointer', color: '#333' };

export default CreatePurchaseModal;