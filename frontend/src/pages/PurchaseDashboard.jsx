// frontend/src/pages/PurchaseDashboard.jsx

import React, { useState, useEffect, useRef } from 'react';
import api from '../api/api'; 
import CreatePurchaseModal from '../components/CreatePurchaseModal';
import PurchaseHistoryTable from '../components/PurchaseHistoryTable';
import EditCompraModal from '../components/EditCompraModal';

const IconCart = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>;
const IconPlus = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const IconDownload = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>;

function PurchaseDashboard({ refreshTrigger, onUpdate, testIds }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [compraToEdit, setCompraToEdit] = useState(null); 
    const [compraSeleccionada, setCompraSeleccionada] = useState(null);
    const [detallesCompra, setDetallesCompra] = useState([]);
    const [loadingDetalles, setLoadingDetalles] = useState(false);
    const detailsRef = useRef(null);

    const handleEditClick = (compra) => setCompraToEdit(compra);
    const handleModalSave = () => { setCompraToEdit(null); onUpdate(); };

    useEffect(() => {
        if (compraSeleccionada && detailsRef.current) {
            setTimeout(() => {
                detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }, [compraSeleccionada]);

    const handleRowClick = async (compra) => {
        if (compraSeleccionada && compraSeleccionada.id_compra === compra.id_compra) {
            setCompraSeleccionada(null); setDetallesCompra([]); return;
        }
        setLoadingDetalles(true); setCompraSeleccionada(compra); setDetallesCompra([]); 
        try {
            const res = await api.get(`/compras/compras/${compra.id_compra}/detalles/`);
            setDetallesCompra(Array.isArray(res.data) ? res.data : res.data.results || []);
        } catch (error) { console.error("Error cargando detalles:", error); } 
        finally { setLoadingDetalles(false); }
    };

    const formatCurrency = (amount) => `Bs ${Number(amount || 0).toFixed(2)}`;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={styles.titleGroup}>
                    <div style={styles.iconCircle}><IconCart /></div>
                    <div><h2 style={styles.title}>Gestión de Compras</h2><p style={styles.subtitle}>Control de abastecimiento y proveedores</p></div>
                </div>
                <button onClick={() => setIsModalOpen(true)} style={styles.createBtn}><IconPlus /> Nueva Orden</button>
            </div>
            <div style={styles.content}>
                <PurchaseHistoryTable refreshTrigger={refreshTrigger} onUpdate={onUpdate} onEditClick={handleEditClick} onRowClick={handleRowClick} selectedId={compraSeleccionada?.id_compra} />
            </div>
            {(compraSeleccionada || loadingDetalles) && (
                <div ref={detailsRef} id="detalle-compra" style={styles.detailWrapper}>
                    {loadingDetalles ? <div style={{textAlign:'center', padding:20, color:'#64748b'}}>Cargando detalles de compra...</div> : (
                        <div style={styles.detailCard}>
                            <div style={{display:'flex', justifyContent:'space-between', borderBottom:'1px solid #e2e8f0', paddingBottom:15, marginBottom:20}}>
                                <h3 style={{margin:0, color:'#0f172a', display:'flex', alignItems:'center', gap:'10px'}}>
                                    📋 Orden de Compra #{compraSeleccionada.id_compra}
                                    <span style={{fontSize:'0.8rem', fontWeight:400, color:'#64748b', backgroundColor:'#f1f5f9', padding:'2px 8px', borderRadius:4}}>{compraSeleccionada.fecha_compra ? String(compraSeleccionada.fecha_compra).slice(0,10) : ''}</span>
                                </h3>
                                <button style={styles.btnGhost}><IconDownload /> PDF</button>
                            </div>
                            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:30, marginBottom:30}}>
                                <div style={styles.infoBox}>
                                    <h4 style={styles.sectionTitle}>Información General</h4>
                                    <div style={styles.infoRow}><span style={styles.infoLabel}>Proveedor:</span> <span>{compraSeleccionada.id_proveedor_nombre || "Desconocido"}</span></div>
                                    <div style={styles.infoRow}><span style={styles.infoLabel}>Método Pago:</span> <span>{compraSeleccionada.metodo_pago || "-"}</span></div>
                                    <div style={styles.infoRow}><span style={styles.infoLabel}>Comprobante:</span> <span>{compraSeleccionada.numero_comprobante || "N/A"}</span></div>
                                </div>
                                <div style={styles.infoBox}>
                                    <h4 style={styles.sectionTitle}>Estado</h4>
                                    <div style={styles.infoRow}><span style={styles.infoLabel}>Envío:</span> <strong>{compraSeleccionada.estado_de_envio?.replace('_', ' ')}</strong></div>
                                    <div style={styles.infoRow}><span style={styles.infoLabel}>Pago:</span> <strong>{compraSeleccionada.estado_de_pago}</strong></div>
                                </div>
                            </div>
                            <h4 style={styles.sectionTitle}>Productos Adquiridos</h4>
                            <table style={{width:'100%', fontSize:'0.9rem', borderCollapse:'collapse', marginBottom: 20}}>
                                <thead style={{background:'#f8fafc', borderBottom:'1px solid #e2e8f0'}}>
                                    <tr><th style={styles.thDetalle}>Producto</th><th style={{...styles.thDetalle, textAlign:'center'}}>Cant.</th><th style={{...styles.thDetalle, textAlign:'right'}}>Costo U.</th><th style={{...styles.thDetalle, textAlign:'right'}}>Subtotal</th></tr>
                                </thead>
                                <tbody>
                                    {detallesCompra.length === 0 ? (<tr><td colSpan={4} style={{padding:20, textAlign:'center', color:'#94a3b8'}}>No se encontraron detalles.</td></tr>) : (detallesCompra.map((d, i) => (<tr key={i} style={{borderBottom:'1px solid #f1f5f9'}}><td style={styles.tdDetalle}>{d.producto_nombre || d.id_producto?.nombre || "Producto"}</td><td style={{...styles.tdDetalle, textAlign:'center'}}>{d.cantidad}</td><td style={{...styles.tdDetalle, textAlign:'right'}}>{formatCurrency(d.precio_unitario)}</td><td style={{...styles.tdDetalle, textAlign:'right', fontWeight:600, color:'#0f172a'}}>{formatCurrency(d.subtotal || (d.cantidad * d.precio_unitario))}</td></tr>)))}
                                </tbody>
                            </table>
                            <div style={{textAlign:'right', fontSize:'1.2rem', fontWeight:'bold', color:'#0f172a', borderTop:'2px solid #e2e8f0', paddingTop:15}}>Total Compra: {formatCurrency(compraSeleccionada.total_compra || compraSeleccionada.precio_final)}</div>
                        </div>
                    )}
                </div>
            )}
            <CreatePurchaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onUpdate={onUpdate} userId={testIds?.userId} />
            {compraToEdit && (<EditCompraModal compra={compraToEdit} onClose={() => setCompraToEdit(null)} onSave={handleModalSave} />)}
        </div>
    );
}

const styles = {
    container: { padding: '24px 32px', maxWidth: '1400px', margin: '0 auto', fontFamily: "'Inter', sans-serif" },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
    titleGroup: { display: 'flex', alignItems: 'center', gap: '16px' },
    iconCircle: { width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    title: { margin: 0, fontSize: '1.5rem', color: '#0f172a', fontWeight: '700' },
    subtitle: { margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' },
    createBtn: { backgroundColor: '#0f172a', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '10px', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', transition: 'transform 0.1s ease' },
    content: { backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', overflow: 'hidden', border: '1px solid #f1f5f9' },
    detailWrapper: { marginTop: "24px", animation: "fadeIn 0.4s ease-out" },
    detailCard: { backgroundColor: "#ffffff", borderRadius: "16px", padding: "30px", boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.1)", border: "1px solid #e2e8f0" },
    infoBox: { backgroundColor: "#f8fafc", padding: "20px", borderRadius: "12px", border: "1px solid #f1f5f9" },
    sectionTitle: { margin: "0 0 15px 0", fontSize: "0.85rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" },
    infoRow: { display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.95rem", color: "#334155" },
    infoLabel: { fontWeight: "600", color: "#475569" },
    thDetalle: { padding: "10px", textAlign: "left", color: "#475569", fontWeight: 600, fontSize:'0.85rem' },
    tdDetalle: { padding: "10px", color: "#334155", verticalAlign: "middle" },
    btnGhost: { display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", backgroundColor: "transparent", color: "#64748b", border: "1px solid #cbd5e1", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "0.85rem" },
};
const styleSheet = document.createElement("style");
styleSheet.innerText = "@keyframes fadeIn { from { opacity:0; transform:translateY(15px); } to { opacity:1; transform:translateY(0); } }";
document.head.appendChild(styleSheet);
export default PurchaseDashboard;