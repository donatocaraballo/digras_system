// frontend/src/components/ReceivePurchaseModal.jsx

import React, { useState, useEffect } from 'react';
import api from '../api/api'; 
import toast, { Toaster } from 'react-hot-toast';

const COMPRAS_URL = '/compras/compras/';

// ICONOS
const IconBan = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>;
const IconAlertBig = () => <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;

export default function ReceivePurchaseModal({ compra, onClose, onSuccess }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [showConfirmView, setShowConfirmView] = useState(false);

    // 🚨 Obtener fecha actual en formato YYYY-MM-DD para el atributo min
    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        const fetchDetails = async () => {
            if (!compra?.id_compra) return;
            try {
                const response = await api.get(`${COMPRAS_URL}${compra.id_compra}/detalles/`);
                const detallesApi = Array.isArray(response.data) ? response.data : (response.data.results || []);
                
                const initialItems = detallesApi.map(d => {
                    const nombre = d.id_producto_nombre || d.producto_nombre || d.producto?.nombre || "Producto desconocido";
                    const sku = d.producto_sku || d.id_producto?.sku || "";
                    // Intentamos obtener la marca de varias formas posibles
                    const marca = d.producto_marca || d.id_producto?.marca?.nombre || d.id_producto_marca || ""; 

                    return {
                        ...d,
                        display_nombre: nombre,
                        display_sku: sku,
                        display_marca: marca, // Guardamos la marca
                        cantidad_recibida: d.cantidad, 
                        devolver: false, 
                        nota: '',
                        fecha_vencimiento: '' 
                    };
                });
                setItems(initialItems);
            } catch (error) {
                toast.error("Error cargando detalles.");
            } finally { setLoading(false); }
        };
        fetchDetails();
    }, [compra]);

    const handleChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const toggleDevolucion = (index) => {
        const newItems = [...items];
        const item = newItems[index];
        
        if (!item.devolver) {
            item.devolver = true;
            item.cantidad_recibida = 0; 
            if (!item.nota.includes("[RECHAZADO]")) item.nota = `[RECHAZADO] ${item.nota}`;
        } else {
            item.devolver = false;
            item.cantidad_recibida = item.cantidad; 
            item.nota = item.nota.replace("[RECHAZADO] ", "").replace("[RECHAZADO]", "");
        }
        setItems(newItems);
    };

    const isFullReturn = items.length > 0 && items.every(i => i.devolver || parseInt(i.cantidad_recibida) === 0);

    const handlePreSubmit = () => {
        const invalidItems = items.filter(i => !i.devolver && (i.cantidad_recibida <= 0 || isNaN(i.cantidad_recibida)));
        if (invalidItems.length > 0) {
            toast.error(`Error: "${invalidItems[0].display_nombre}" tiene cantidad 0. Márcalo como "Rechazar" si no llegó.`);
            return;
        }

        // 🚨 VALIDACIÓN: Exigir fecha de vencimiento si se recibe algo
        const missingDate = items.find(i => !i.devolver && !i.fecha_vencimiento);
        if (missingDate) {
            toast.error(`Falta la fecha de caducidad para: "${missingDate.display_nombre}". Es obligatoria.`);
            return;
        }

        // 🚨 VALIDACIÓN EXTRA: Asegurar que la fecha no sea anterior a hoy
        const invalidDateItem = items.find(i => !i.devolver && i.fecha_vencimiento && i.fecha_vencimiento < today);
        if (invalidDateItem) {
            toast.error(`Error en "${invalidDateItem.display_nombre}": La fecha de vencimiento no puede ser anterior a hoy.`);
            return;
        }

        if (isFullReturn) {
            setShowConfirmView(true);
        } else {
            submitData();
        }
    };

    const submitData = async () => {
        setIsSubmitting(true);
        try {
            const payload = {
                detalles: items.map(item => ({
                    id_detallec: item.id_detallec,
                    cantidad_recibida: item.devolver ? 0 : parseInt(item.cantidad_recibida), 
                    nota: item.nota,
                    fecha_vencimiento: item.devolver ? null : (item.fecha_vencimiento || null)
                }))
            };
            
            await api.post(`${COMPRAS_URL}${compra.id_compra}/recibir_mercancia/`, payload);
            
            if (isFullReturn) toast("Compra marcada como DEVUELTA", { icon: '↩️' });
            else toast.success("Entrada procesada y stock actualizado.");
            
            onSuccess();
            onClose();
        } catch (error) {
            const msg = error.response?.data?.error || "Error al procesar.";
            toast.error(msg);
        } finally { setIsSubmitting(false); }
    };

    if (loading) return <div style={styles.overlay}><div style={{color:'white'}}>Cargando...</div></div>;

    return (
        <div style={styles.overlay}>
            <Toaster position="top-center" containerStyle={{ zIndex: 999999 }} />

            {/* 🚨 CLASE RESPONSIVA */}
            <div className="modal-content-responsive" style={{width: '950px', maxWidth: '95vw', padding:0, display:'flex', flexDirection:'column', overflow:'hidden'}}>
                
                {!showConfirmView ? (
                    <>
                        <div style={{padding: '24px', borderBottom: '1px solid #e2e8f0', background:'#fff'}}>
                            <h2 style={{ margin: 0, color: "#0f172a", fontSize: '1.25rem' }}>Recepción de Compra #{compra.id_compra}</h2>
                            <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize:'0.9rem' }}>Proveedor: <strong>{compra.id_proveedor_nombre}</strong></p>
                        </div>
                        
                        <div style={{flex: 1, overflowY: 'auto', padding: '20px', background: '#f8fafc'}}>
                            {items.map((item, index) => {
                                const cantidadNum = parseInt(item.cantidad_recibida) || 0;
                                const faltante = item.cantidad - cantidadNum;
                                const isReturned = item.devolver;

                                return (
                                    <div key={item.id_detallec || index} style={{
                                        ...styles.itemRow,
                                        background: isReturned ? '#fef2f2' : '#ffffff',
                                        borderColor: isReturned ? '#fecaca' : '#e2e8f0',
                                        opacity: isReturned ? 0.85 : 1
                                    }}>
                                        {/* PRODUCTO INFO (Full width en móvil) */}
                                        <div style={{flex: '1 1 100%', minWidth: '200px', marginBottom: '10px'}}>
                                            <span style={styles.label}>Producto</span>
                                            <div style={{fontWeight:'700', fontSize:'0.9rem', color: isReturned ? '#991b1b' : '#0f172a', textDecoration: isReturned ? 'line-through' : 'none'}}>
                                                {item.display_nombre}
                                            </div>
                                            
                                            {/* ✅ AÑADIDO: MOSTRAR SKU Y MARCA */}
                                            <div style={{display:'flex', gap:'10px', fontSize:'0.75rem', color:'#64748b', marginTop:'4px'}}>
                                                {item.display_marca && <span>Marca: <strong>{item.display_marca}</strong></span>}
                                                {item.display_sku && <span>SKU: <span style={{fontFamily:'monospace'}}>{item.display_sku}</span></span>}
                                            </div>
                                        </div>

                                        {/* INPUTS RESPONSIVOS */}
                                        <div style={{flex: '1 1 80px'}}>
                                            <span style={styles.label}>Recibido</span>
                                            <input 
                                                type="number" min="0" max={item.cantidad}
                                                value={item.cantidad_recibida} 
                                                onChange={(e) => handleChange(index, 'cantidad_recibida', e.target.value)} 
                                                disabled={isReturned} 
                                                style={{
                                                    ...styles.input, 
                                                    borderColor: isReturned ? '#fecaca' : (faltante > 0 ? '#f59e0b' : '#16a34a'),
                                                    backgroundColor: isReturned ? '#fee2e2' : '#fff',
                                                    color: isReturned ? '#991b1b' : '#0f172a', fontWeight:'bold'
                                                }} 
                                            />
                                        </div>

                                        <div style={{flex: '1 1 120px'}}>
                                            <span style={styles.label}>Vencimiento <span style={{color:'#ef4444'}}>*</span></span>
                                            <input 
                                                type="date" 
                                                min={today} // 🚨 RESTRICCIÓN DE FECHA MÍNIMA (HOY)
                                                value={item.fecha_vencimiento} 
                                                onChange={(e) => handleChange(index, 'fecha_vencimiento', e.target.value)} 
                                                style={{
                                                    ...styles.input,
                                                    borderColor: (!isReturned && !item.fecha_vencimiento) ? '#ef4444' : '#cbd5e1'
                                                }} 
                                                disabled={isReturned} 
                                                required 
                                            />
                                        </div>

                                        <div style={{flex: '1 1 150px'}}>
                                            <span style={styles.label}>Observaciones</span>
                                            <input type="text" value={item.nota} onChange={(e) => handleChange(index, 'nota', e.target.value)} style={{...styles.input, fontStyle: isReturned?'italic':'normal'}} placeholder={isReturned ? "Motivo..." : "Ej: Dañado"} />
                                        </div>

                                        <div style={{flex: '0 0 50px', textAlign:'center'}}>
                                            <span style={styles.label}>Acción</span>
                                            <button onClick={() => toggleDevolucion(index)} style={{
                                                ...styles.btnToggle,
                                                backgroundColor: '#fff',
                                                borderColor: isReturned ? '#991b1b' : '#cbd5e1',
                                                color: isReturned ? '#991b1b' : '#64748b'
                                            }} title={isReturned ? "Cancelar rechazo" : "Rechazar producto"}>
                                                {isReturned ? 'Reponer' : <IconBan />}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div style={styles.footer}>
                            <button onClick={onClose} style={styles.btnCancel}>Cancelar</button>
                            <button 
                                onClick={handlePreSubmit} 
                                style={isFullReturn ? styles.btnRejectAll : styles.btnConfirm} 
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Procesando...' : (isFullReturn ? 'Confirmar Devolución Total' : 'Confirmar Entrada')}
                            </button>
                        </div>
                    </>
                ) : (
                    <div style={styles.confirmView}>
                        <div style={{animation: 'scaleUp 0.3s ease-out'}}>
                            <IconAlertBig />
                        </div>
                        <h3 style={styles.confirmTitle}>¿Devolver toda la mercancía?</h3>
                        <p style={styles.confirmText}>
                            Has marcado <strong>todos los productos</strong> como rechazados o con cantidad 0. 
                            <br/><br/>
                            Esta acción cambiará el estado de la compra a <strong>DEVUELTA</strong> y no entrará inventario al almacén.
                        </p>
                        
                        <div style={{display:'flex', gap:'15px', marginTop:'10px', flexWrap:'wrap', justifyContent:'center'}}>
                            <button 
                                onClick={() => setShowConfirmView(false)} 
                                style={{...styles.btnCancel, padding: '12px 30px', fontWeight: 'bold'}}
                            >
                                <span style={{marginRight: 8}}>↩</span> Volver y Revisar
                            </button>
                            <button 
                                onClick={submitData} 
                                style={{...styles.btnRejectAll, padding: '12px 30px', fontSize: '1rem'}}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Procesando...' : 'Sí, Devolver Compra'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 20000 },
    
    // RESPONSIVE FLEX LAYOUT PARA LAS FILAS
    itemRow: { 
        borderRadius: '12px', padding: '15px', marginBottom: '12px', 
        border: '1px solid #e2e8f0', 
        display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end',
        transition: 'all 0.2s',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    },
    
    label: { fontSize: '0.7rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '5px', display: 'flex', gap: '4px' },
    input: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' },
    
    footer: { display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '20px 24px', borderTop: '1px solid #e2e8f0', background: '#fff' },
    
    btnConfirm: { padding: '12px 24px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', transition: 'background 0.2s' },
    btnRejectAll: { padding: '12px 24px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', display: 'flex', gap: '8px', alignItems: 'center' },
    btnCancel: { padding: '12px 24px', backgroundColor: 'transparent', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' },
    btnToggle: { width: '100%', height: '38px', borderRadius: '8px', border: '1px solid', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '0.8rem', gap: '6px' },

    confirmView: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px 20px', textAlign: 'center' },
    confirmTitle: { fontSize: '1.5rem', color: '#b91c1c', margin: '20px 0 10px 0', fontWeight: '800' },
    confirmText: { color: '#64748b', fontSize: '1rem', maxWidth: '500px', marginBottom: '30px', lineHeight: '1.5' }
};

// Inyección de estilos de animación
const styleSheet = document.createElement("style");
styleSheet.innerText = "@keyframes scaleUp { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }";
document.head.appendChild(styleSheet);