// frontend/src/components/EditCompraModal.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const COMPRAS_URL = '/api/compras/compras/';
const IconClose = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const IconTrash = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;

function EditCompraModal({ compra, onClose, onSave }) {
    // Si compra es null (por renderizado rápido), no hacemos nada
    if (!compra) return null;

    const [fechaPedido, setFechaPedido] = useState(compra.fecha_pedido || '');
    const [detalles, setDetalles] = useState([]); 
    const [loadingDetails, setLoadingDetails] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 🚨 CORRECCIÓN: Validación segura de propiedades (evita crash si es undefined)
    const isLocked = 
        (compra.estado_de_envio && ['RECIBIDA_COMPLETA', 'RECIBIDA_PARCIAL'].includes(compra.estado_de_envio)) ||
        (compra.estado_de_pago && ['PAGADO', 'PAGADO_PARCIAL'].includes(compra.estado_de_pago));

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                // Solo pedimos detalles si tenemos ID
                if (!compra.id_compra) return;
                
                const response = await axios.get(`${COMPRAS_URL}${compra.id_compra}/`);
                setDetalles(response.data.detalles || []); 
            } catch (err) {
                console.error("Error cargando detalles:", err);
                toast.error("Error al cargar detalles");
            } finally {
                setLoadingDetails(false);
            }
        };

        // Si está bloqueada, no necesitamos cargar detalles para editar (solo mostrar mensaje)
        // Pero si quieres mostrarlos en modo lectura, quita el 'if (!isLocked)'
        if (!isLocked) {
            fetchDetails();
        } else {
            setLoadingDetails(false);
        }
    }, [compra.id_compra, isLocked]);
    
    const handleDetailChange = (index, field, value) => {
        const newDetalles = [...detalles];
        newDetalles[index][field] = (field === 'cantidad' || field === 'precio_unitario') ? parseFloat(value) : value;
        setDetalles(newDetalles);
    };

    const handleRemoveDetail = (index) => {
        const newDetalles = [...detalles];
        newDetalles.splice(index, 1);
        setDetalles(newDetalles);
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const loadingToast = toast.loading("Actualizando...");

        try {
            const updateData = {
                fecha_pedido: fechaPedido,
                detalles: detalles.map(d => ({
                    id_detallec: d.id_detallec,  
                    id_producto: d.id_producto,
                    cantidad: d.cantidad,
                    precio_unitario: d.precio_unitario,
                    subtotal: d.cantidad * d.precio_unitario,
                })),
            };
            
            await axios.patch(`${COMPRAS_URL}${compra.id_compra}/`, updateData);
            toast.dismiss(loadingToast);
            toast.success("Compra Actualizada");
            onSave();
        } catch (error) {
            toast.dismiss(loadingToast);
            const msg = error.response?.data?.error || "Error al actualizar";
            toast.error(msg);
            setIsSubmitting(false);
        }
    };

    if (loadingDetails) return null;

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <div>
                        <h3 style={styles.title}>Editar Compra #{compra.id_compra}</h3>
                        <p style={styles.subtitle}>Proveedor: {compra.id_proveedor_nombre}</p>
                    </div>
                    <button onClick={onClose} style={styles.closeBtn}><IconClose /></button>
                </div>

                {isLocked ? (
                    <div style={{padding:40, textAlign:'center', color:'#ef4444'}}>
                        <p style={{fontSize: '1.2em', marginBottom: '10px'}}>🛑 Acción No Permitida</p>
                        Esta compra ya fue <b>Recibida</b> o tiene <b>Pagos Registrados</b>.<br/>
                        No se puede editar para mantener la integridad contable.
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={styles.formContent}>
                        <div style={styles.sectionCard}>
                            <label style={styles.label}>Fecha Pedido</label>
                            <input type="date" value={fechaPedido} onChange={(e) => setFechaPedido(e.target.value)} required style={styles.input} />
                        </div>

                        <div style={styles.detailsContainer}>
                            {detalles.map((detalle, index) => (
                                <div key={detalle.id_detallec || index} style={styles.detailRow}>
                                    <div style={{flex:3}}>
                                        <label style={styles.miniLabel}>Producto</label>
                                        <div style={{fontWeight:'600', fontSize:'0.9rem'}}>{detalle.id_producto_nombre}</div>
                                    </div>
                                    <div style={{flex:1}}>
                                        <label style={styles.miniLabel}>Cant.</label>
                                        <input type="number" min="1" value={detalle.cantidad} onChange={(e) => handleDetailChange(index, 'cantidad', e.target.value)} style={styles.input} />
                                    </div>
                                    <div style={{flex:1}}>
                                        <label style={styles.miniLabel}>Precio</label>
                                        <input type="number" step="0.01" value={detalle.precio_unitario} onChange={(e) => handleDetailChange(index, 'precio_unitario', e.target.value)} style={styles.input} />
                                    </div>
                                    <button type="button" onClick={() => handleRemoveDetail(index)} style={styles.removeBtn}><IconTrash /></button>
                                </div>
                            ))}
                        </div>

                        <div style={styles.footer}>
                            <button type="button" onClick={onClose} style={styles.btnCancel}>Cancelar</button>
                            <button type="submit" style={styles.btnSubmit} disabled={isSubmitting}>Guardar Cambios</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

const styles = {
    overlay: { position: 'fixed', inset:0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 },
    modal: { background: '#fff', width: '600px', maxHeight: '90vh', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    header: { padding: '20px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display:'flex', justifyContent:'space-between' },
    title: { margin: 0, fontSize: '1.2rem', color: '#0f172a' },
    subtitle: { margin: 0, color: '#64748b', fontSize: '0.9rem' },
    closeBtn: { background:'none', border:'none', cursor:'pointer', color:'#94a3b8' },
    formContent: { display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 },
    sectionCard: { padding: '20px 24px' },
    detailsContainer: { flex: 1, overflowY: 'auto', padding: '0 24px 20px', background:'#f8fafc', borderTop:'1px solid #e2e8f0' },
    detailRow: { background:'#fff', padding:12, borderRadius:8, marginBottom:8, display:'flex', gap:10, alignItems:'center', border:'1px solid #e2e8f0' },
    label: { display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' },
    miniLabel: { fontSize: '0.65rem', color: '#94a3b8', display: 'block', marginBottom:2 },
    input: { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing:'border-box' },
    removeBtn: { background:'none', border:'none', color:'#ef4444', cursor:'pointer', padding:8 },
    footer: { padding: '20px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 10 },
    btnCancel: { padding: '10px 20px', border: 'none', background: '#f1f5f9', color: '#475569', borderRadius: '8px', cursor: 'pointer', fontWeight:'600' },
    btnSubmit: { padding: '10px 24px', border: 'none', background: '#0f172a', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight:'600' }
};

export default EditCompraModal;