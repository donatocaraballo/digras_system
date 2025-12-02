// frontend/src/components/EditCompraModal.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const COMPRAS_URL = '/api/compras/compras/';

function EditCompraModal({ compra, onClose, onSave }) {
    // 1. Estados iniciales (para la Compra Cabecera)
    const [metodoPago, setMetodoPago] = useState(compra.metodo_pago);
    const [fechaPedido, setFechaPedido] = useState(compra.fecha_pedido);
    
    // 2. Estado para manejar los detalles anidados, inicializado vacío
    const [detalles, setDetalles] = useState([]); 
    const [loadingDetails, setLoadingDetails] = useState(true);
    
    const [status, setStatus] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 🚨 RESTRICCIÓN EN FRONTEND: Determinada por el estado de la compra padre
    const isReceived = compra.estado_de_envio === 'RECIBIDA_COMPLETA' || compra.estado_de_envio === 'RECIBIDA_PARCIAL'; 

    // --- EFECTO PARA CARGAR DETALLES COMPLETOS DE MANERA ASÍNCRONA ---
    useEffect(() => {
        const fetchFullDetails = async () => {
            try {
                // Hacemos un GET al endpoint de detalle para obtener la Compra COMPLETA 
                // con todos los campos anidados (detalles)
                const response = await axios.get(`${COMPRAS_URL}${compra.id_compra}/`);
                
                // Usamos los detalles completos para el estado
                setDetalles(response.data.detalles || []); 
                
            } catch (err) {
                console.error("Fallo al obtener detalles completos para edición:", err);
                setStatus('❌ Error al cargar detalles. Revisa la consola.');
            } finally {
                setLoadingDetails(false);
            }
        };

        // Solo cargamos los detalles si la compra se puede editar
        if (!isReceived) {
            fetchFullDetails();
        } else {
             setLoadingDetails(false);
        }

    }, [compra.id_compra, isReceived]);
    
    // Manejadores para DetalleCompra
    const handleDetailChange = (index, field, value) => {
        const newDetalles = [...detalles];
        // Aseguramos que los valores numéricos se mantengan como números
        newDetalles[index][field] = (field === 'cantidad' || field === 'precio_unitario') ? parseFloat(value) : value;
        setDetalles(newDetalles);
    };

    const handleRemoveDetail = (index) => {
        const newDetalles = [...detalles];
        newDetalles.splice(index, 1); // Elimina el detalle del índice
        setDetalles(newDetalles);
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus('Actualizando Compra y Detalles...');
        
        // La validación de estado ya está arriba (isReceived), pero la duplicamos aquí para seguridad
        if (isReceived) {
            setStatus('❌ Error: Compra recibida, no se puede actualizar.');
            setIsSubmitting(false);
            return;
        }

        try {
            // Preparamos los datos anidados para el PATCH (solo campos editables)
            const updateData = {
                metodo_pago: metodoPago,
                fecha_pedido: fechaPedido,
                // Mapeamos y enviamos los detalles anidados:
                detalles: detalles.map(d => ({
                    id_detallec: d.id_detallec,  
                    id_producto: d.id_producto,
                    cantidad: d.cantidad,
                    precio_unitario: d.precio_unitario,
                    subtotal: d.subtotal,
                    devolucion: d.devolucion,
                    cantidad_devolvida: d.cantidad_devolvida,
                    nota: d.nota
                })),
            };
            
            await axios.patch(`${COMPRAS_URL}${compra.id_compra}/`, updateData);
            
            setStatus('✅ Compra y Detalles actualizados.');
            onSave(); 
            setTimeout(onClose, 1000);
            
        } catch (error) {
            const errMsg = error.response ? JSON.stringify(error.response.data) : error.message;
            setStatus('❌ Error al actualizar: ' + errMsg);
            console.error("Error PATCH:", error);
            setIsSubmitting(false);
        }
    };

    if (loadingDetails) return <p style={{ padding: '30px' }}>Cargando detalles para edición...</p>;

    return (
        <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
                <h3>Editar Compra N°{compra.id_compra}</h3>
                <p>Proveedor: **{compra.id_proveedor_nombre}**</p>

                {isReceived && (
                    <p style={{ color: 'red', fontWeight: 'bold', marginBottom: '15px' }}>
                        🚨 Advertencia: Esta compra ya fue Recibida. No se permite su edición.
                    </p>
                )}
                
                <form onSubmit={handleSubmit}>
                    {/* CABECERA DE COMPRA */}
                    <label style={labelStyle}>Método de Pago:</label>
                    <input type="text" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} required style={inputStyle} disabled={isReceived} />
                    
                    <label style={labelStyle}>Fecha del Pedido:</label>
                    <input type="date" value={fechaPedido} onChange={(e) => setFechaPedido(e.target.value)} required style={inputStyle} disabled={isReceived} />
                    
                    <hr style={{margin: '20px 0'}} />
                    
                    <h4>Detalles de la Compra (Líneas)</h4>
                    {detalles && detalles.length > 0 ? (
                        detalles.map((detalle, index) => (
                            <div key={detalle.id_detallec || index} style={detailGroupStyle}>
                                <p style={{ fontWeight: 'bold' }}>Producto: {detalle.id_producto_nombre} (ID: {detalle.id_producto})</p>
                                
                                <label>Cantidad:</label>
                                <input 
                                    type="number" 
                                    value={detalle.cantidad} 
                                    onChange={(e) => handleDetailChange(index, 'cantidad', e.target.value)} 
                                    required 
                                    min="1"
                                    style={detailInputStyle} 
                                    disabled={isReceived}
                                />

                                <label>Precio Unitario:</label>
                                <input 
                                    type="number" 
                                    value={detalle.precio_unitario} 
                                    onChange={(e) => handleDetailChange(index, 'precio_unitario', e.target.value)} 
                                    required 
                                    step="0.01"
                                    style={detailInputStyle} 
                                    disabled={isReceived}
                                />
                                
                                <button type="button" onClick={() => handleRemoveDetail(index)} style={removeButtonStyle} disabled={isReceived || detalles.length === 1}>
                                    Quitar Detalle
                                </button>
                            </div>
                        ))
                    ) : (
                         <p style={{ color: 'red' }}>No se encontraron líneas de detalle para esta compra.</p>
                    )}

                    <p style={{ marginTop: '10px', fontSize: 'small', color: '#f44336' }}>
                        *Advertencia: No se puede cambiar la Cantidad de una compra ya recibida.
                    </p>
                    
                    <div style={buttonGroupStyle}>
                        <button type="submit" style={saveButtonStyle} disabled={isSubmitting || isReceived}>Guardar Cambios</button>
                        <button type="button" onClick={onClose} style={cancelButtonStyle} disabled={isSubmitting}>Cancelar</button>
                    </div>
                    {status && <p style={{marginTop: '10px'}}>{status}</p>}
                </form>
            </div>
        </div>
    );
}

// Estilos
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 };
const modalContentStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '500px', maxHeight: '90vh', overflowY: 'auto' };
const labelStyle = { display: 'block', fontWeight: 'bold', marginTop: '10px' };
const inputStyle = { width: '100%', padding: '8px', margin: '5px 0 15px', boxSizing: 'border-box', border: '1px solid #ccc' };
const detailInputStyle = { width: '48%', padding: '8px', margin: '5px 5px 10px 0', boxSizing: 'border-box', border: '1px solid #ccc' };
const detailGroupStyle = { border: '1px dashed #ccc', padding: '15px', marginBottom: '15px' };
const removeButtonStyle = { padding: '5px 10px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', float: 'right' };
const buttonGroupStyle = { marginTop: '20px', display: 'flex', justifyContent: 'flex-end' };
const saveButtonStyle = { padding: '10px 15px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' };
const cancelButtonStyle = { padding: '10px 15px', backgroundColor: '#9e9e9e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' };


export default EditCompraModal;