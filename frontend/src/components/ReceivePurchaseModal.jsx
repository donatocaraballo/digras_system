// frontend/src/components/ReceivePurchaseModal.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const COMPRAS_URL = '/compras/compras/';

const modalStyles = {
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 20000 },
  container: { backgroundColor: 'white', padding: '30px', borderRadius: '20px', width: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" },
  scroll: { overflowY: 'auto', flexGrow: 1, margin: '20px 0', paddingRight: '10px' },
  itemRow: { background: '#f8fafc', borderRadius: '12px', padding: '15px', marginBottom: '10px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.2fr 1.5fr', gap: '15px', alignItems: 'end' },
  label: { fontSize: '0.7rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '5px' },
  input: { width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' },
  btnConfirm: { padding: '12px 24px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' },
  btnCancel: { padding: '12px 24px', backgroundColor: 'transparent', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '10px', cursor: 'pointer' }
};

export default function ReceivePurchaseModal({ compra, onClose, onSuccess }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const response = await axios.get(`${COMPRAS_URL}${compra.id_compra}/`);
                
                // 🚨 CORRECCIÓN: Si response.data.detalles no existe, usamos un array vacío para evitar el crash
                const detallesApi = response.data.detalles || [];
                
                const initialItems = detallesApi.map(d => ({
                    ...d,
                    cantidad_recibida: d.cantidad,
                    nota: '',
                    fecha_vencimiento: ''
                }));
                setItems(initialItems);
            } catch (error) {
                toast.error("Error cargando detalles de la compra.");
            } finally { setLoading(false); }
        };
        fetchDetails();
    }, [compra]);

    const handleChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
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
            toast.error("Error al procesar la recepción.");
        } finally { setIsSubmitting(false); }
    };

    if (loading) return <div style={modalStyles.overlay}><div style={{color:'white'}}>Cargando detalles...</div></div>;

    return (
        <div style={modalStyles.overlay}>
            <div style={modalStyles.container}>
                <h2 style={{ margin: 0, color: "#0f172a" }}>Recepción de Compra #{compra.id_compra}</h2>
                <p style={{ color: "#64748b", margin: "5px 0 20px 0" }}>Proveedor: <strong>{compra.id_proveedor_nombre}</strong></p>
                
                <div style={modalStyles.scroll}>
                    {items.length === 0 ? (
                        <p style={{textAlign:'center', color:'#94a3b8', padding:'20px'}}>No hay productos asociados a esta orden.</p>
                    ) : (
                        items.map((item, index) => {
                            const faltante = item.cantidad - item.cantidad_recibida;
                            return (
                                <div key={item.id_detallec} style={modalStyles.itemRow}>
                                    <div>
                                        <span style={modalStyles.label}>Producto</span>
                                        <div style={{fontWeight:'700', fontSize:'0.9rem'}}>{item.id_producto_nombre}</div>
                                        <div style={{fontSize:'0.8rem', color:'#64748b'}}>Pedido: {item.cantidad}</div>
                                    </div>
                                    <div>
                                        <span style={modalStyles.label}>Recibido</span>
                                        <input type="number" value={item.cantidad_recibida} onChange={(e) => handleChange(index, 'cantidad_recibida', e.target.value)} style={{...modalStyles.input, borderColor: faltante > 0 ? '#f59e0b' : '#cbd5e1'}} />
                                    </div>
                                    <div>
                                        <span style={modalStyles.label}>Vencimiento</span>
                                        <input type="date" value={item.fecha_vencimiento} onChange={(e) => handleChange(index, 'fecha_vencimiento', e.target.value)} style={modalStyles.input} required />
                                    </div>
                                    <div>
                                        <span style={modalStyles.label}>Observaciones</span>
                                        <input type="text" value={item.nota} onChange={(e) => handleChange(index, 'nota', e.target.value)} style={modalStyles.input} placeholder="Opcional" />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div style={modalStyles.footer}>
                    <button onClick={onClose} style={modalStyles.btnCancel}>Cancelar</button>
                    <button onClick={handleSubmit} style={modalStyles.btnConfirm} disabled={isSubmitting}>
                        {isSubmitting ? 'Procesando...' : 'Confirmar Entrada'}
                    </button>
                </div>
            </div>
        </div>
    );
}