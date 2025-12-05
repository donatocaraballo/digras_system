// frontend/src/components/ReceivePurchaseModal.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from "react-hot-toast";

const COMPRAS_URL = '/api/compras/compras/';

function ReceivePurchaseModal({ compra, onClose, onSuccess }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Cargar los detalles originales de la compra
    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const response = await axios.get(`${COMPRAS_URL}${compra.id_compra}/`);
                // Inicializamos el estado de recepción con la cantidad total por defecto
                const initialItems = response.data.detalles.map(d => ({
                    ...d,
                    cantidad_recibida: d.cantidad, // Por defecto asumimos que llega todo
                    nota: '',
                    fecha_vencimiento: ''
                }));
                setItems(initialItems);
            } catch (error) {
                console.error("Error cargando detalles:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [compra]);

    // Manejar cambios en los inputs
    const handleChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleSubmit = async () => {
        if (!window.confirm("¿Confirmar la recepción de mercancía e ingresar al inventario?")) return;
        
        setIsSubmitting(true);
        try {
            // Enviar solo los datos necesarios para la recepción
            const payload = {
                detalles: items.map(item => ({
                    id_detallec: item.id_detallec,
                    cantidad_recibida: parseInt(item.cantidad_recibida),
                    nota: item.nota,
                    fecha_vencimiento: item.fecha_vencimiento
                }))
            };

            await axios.post(`${COMPRAS_URL}${compra.id_compra}/recibir_mercancia/`, payload);
            toast.success("📦 Mercancía recibida e inventario actualizado.");
            onSuccess();
            onClose();
        } catch (error) {
            const msg = error.response?.data?.error || error.message;
            toast.error(`Error en la recepción: ${msg}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div style={modalStyle}>Cargando detalles...</div>;

    return (
        <div style={overlayStyle}>
            <div style={contentStyle}>
                <h2>📦 Recepción de Compra #{compra.id_compra}</h2>
                <p>Proveedor: <b>{compra.id_proveedor_nombre}</b></p>
                <p style={{fontSize: '0.9em', color: '#666'}}>Verifique la cantidad física que llegó. Si es menor a la ordenada, agregue una nota.</p>
                
                <div style={scrollContainerStyle}>
                    {items.map((item, index) => {
                        const faltante = item.cantidad - item.cantidad_recibida;
                        return (
                            <div key={item.id_detallec} style={rowStyle}>
                                <div style={{flex: 2}}>
                                    <strong>{item.id_producto_nombre}</strong><br/>
                                    <span style={{fontSize:'0.85em'}}>Ordenado: {item.cantidad}</span>
                                </div>
                                
                                <div style={{flex: 1, padding: '0 5px'}}>
                                    <label style={labelStyle}>Recibido:</label>
                                    <input 
                                        type="number" 
                                        min="0" 
                                        max={item.cantidad}
                                        value={item.cantidad_recibida}
                                        onChange={(e) => handleChange(index, 'cantidad_recibida', e.target.value)}
                                        style={{...inputStyle, borderColor: faltante > 0 ? 'orange' : '#ccc'}}
                                    />
                                </div>

                                {/* 🚨 NUEVO INPUT: FECHA DE VENCIMIENTO 🚨 */}
                                <div style={{flex: 2, padding: '0 5px'}}>
                                    <label style={labelStyle}>Vencimiento:</label>
                                    <input 
                                        type="date" 
                                        value={item.fecha_vencimiento}
                                        onChange={(e) => handleChange(index, 'fecha_vencimiento', e.target.value)}
                                        style={inputStyle}
                                        required
                                    />
                                </div>

                                <div style={{flex: 2}}>
                                    <label style={labelStyle}>Nota / Motivo:</label>
                                    <input 
                                        type="text" 
                                        placeholder={faltante > 0 ? "Ej: 2 dañados..." : "Opcional"}
                                        value={item.nota}
                                        onChange={(e) => handleChange(index, 'nota', e.target.value)}
                                        style={inputStyle}
                                        disabled={faltante === 0} // Solo activar nota si hay diferencia
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div style={footerStyle}>
                    <button onClick={onClose} style={cancelBtnStyle}>Cancelar</button>
                    <button onClick={handleSubmit} style={confirmBtnStyle} disabled={isSubmitting}>
                        {isSubmitting ? 'Procesando...' : 'Confirmar Entrada a Almacén'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Estilos básicos
const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 5000 };
const contentStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '8px', width: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' };
const scrollContainerStyle = { overflowY: 'auto', flexGrow: 1, margin: '20px 0', border: '1px solid #eee', padding: '10px' };
const rowStyle = { display: 'flex', alignItems: 'center', borderBottom: '1px solid #f0f0f0', padding: '10px 0' };
const inputStyle = { width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #ccc' };
const labelStyle = { fontSize: '0.75em', color: '#555', display: 'block', marginBottom: '3px' };
const footerStyle = { display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '15px', borderTop: '1px solid #ddd' };
const confirmBtnStyle = { padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' };
const cancelBtnStyle = { padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' };
const modalStyle = { padding: '20px', background: 'white' };

export default ReceivePurchaseModal;