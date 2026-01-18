// frontend/src/pages/PurchaseDashboard.jsx

import React, { useState, useEffect, useRef } from 'react';
import api from '../api/api'; 
import { useAuth } from '../AuthContext'; 
import CreatePurchaseModal from '../components/CreatePurchaseModal';
import PurchaseHistoryTable from '../components/PurchaseHistoryTable';
import EditCompraModal from '../components/EditCompraModal';
import RegisterPaymentModal from '../components/RegisterPaymentModal';
import toast, { Toaster } from 'react-hot-toast'; // 🚨 IMPORTANTE: Importar Toaster

// --- ICONOS SVG ---
const IconCart = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>;
const IconPlus = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const IconDownload = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>;
const IconWallet = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>;
const IconX = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const IconBuilding = () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="9" y1="22" x2="9" y2="22.01"></line><line x1="15" y1="22" x2="15" y2="22.01"></line><line x1="12" y1="22" x2="12" y2="22.01"></line><line x1="12" y1="2" x2="12" y2="6"></line><line x1="9" y1="10" x2="9" y2="10.01"></line><line x1="15" y1="10" x2="15" y2="10.01"></line><line x1="9" y1="14" x2="9" y2="14.01"></line><line x1="15" y1="14" x2="15" y2="14.01"></line><line x1="9" y1="18" x2="9" y2="18.01"></line><line x1="15" y1="18" x2="15" y2="18.01"></line></svg>;

function PurchaseDashboard({ refreshTrigger, onUpdate, testIds }) {
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [compraToEdit, setCompraToEdit] = useState(null); 
    const [compraSeleccionada, setCompraSeleccionada] = useState(null);
    const [detallesCompra, setDetallesCompra] = useState([]);
    const [loadingDetalles, setLoadingDetalles] = useState(false);
    
    // Estados para nuevas funcionalidades
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showProviderModal, setShowProviderModal] = useState(false);
    const [providerData, setProviderData] = useState(null);

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
        } catch (error) { 
            console.error("Error cargando detalles:", error);
            toast.error("No se pudieron cargar los detalles.");
        } finally { 
            setLoadingDetalles(false); 
        }
    };

    const handleProviderClick = async () => {
        if (!compraSeleccionada?.id_proveedor) return;
        
        const toastId = toast.loading("Cargando proveedor...");
        try {
            const res = await api.get(`/compras/proveedores/${compraSeleccionada.id_proveedor}/`);
            setProviderData(res.data);
            setShowProviderModal(true);
            toast.dismiss(toastId);
        } catch (error) {
            toast.dismiss(toastId);
            toast.error("No se pudo cargar la información del proveedor.");
        }
    };

    const formatUSD = (amount) => {
        const num = parseFloat(amount);
        return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
    };

    const esAdmin = user?.tipo === 'ADMINISTRADOR';

    return (
        <div style={styles.container}>
            {/* 🚨 TOASTER CENTRALIZADO AQUÍ PARA QUE FUNCIONE SIEMPRE */}
            <Toaster position="top-right" />

            <div style={styles.header}>
                <div style={styles.titleGroup}>
                    <div style={styles.iconCircle}><IconCart /></div>
                    <div><h2 style={styles.title}>Gestión de Compras</h2><p style={styles.subtitle}>Control de abastecimiento y proveedores</p></div>
                </div>
                
                {esAdmin && (
                    <button onClick={() => setIsModalOpen(true)} style={styles.createBtn}>
                        <IconPlus /> Nueva Orden
                    </button>
                )}
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
                                    
                                    <div style={styles.infoRow}>
                                        <span style={styles.infoLabel}>Proveedor:</span> 
                                        <span 
                                            style={styles.linkText} 
                                            onClick={handleProviderClick}
                                            title="Ver detalles del proveedor"
                                        >
                                            {compraSeleccionada.id_proveedor_nombre || compraSeleccionada.proveedor_nombre || "Desconocido"} ↗
                                        </span>
                                    </div>
                                    
                                    <div style={styles.infoRow}><span style={styles.infoLabel}>Comprobante:</span> <span>{compraSeleccionada.numero_comprobante || "N/A"}</span></div>
                                </div>

                                <div style={styles.infoBox}>
                                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 15}}>
                                        <h4 style={{...styles.sectionTitle, margin:0}}>Gestión Financiera</h4>
                                        
                                        {(() => {
                                            const isPayable = ['RECIBIDA_COMPLETA', 'RECIBIDA_PARCIAL'].includes(compraSeleccionada.estado_de_envio);
                                            
                                            return (
                                                <button 
                                                    onClick={() => {
                                                        if (isPayable) setShowPaymentModal(true);
                                                        else toast.error("Debe recibir la mercancía antes de registrar pagos.");
                                                    }} 
                                                    style={{
                                                        ...styles.btnPayment,
                                                        opacity: isPayable ? 1 : 0.6,
                                                        cursor: isPayable ? 'pointer' : 'not-allowed',
                                                        backgroundColor: isPayable ? '#fff' : '#f1f5f9',
                                                        color: isPayable ? '#0f172a' : '#94a3b8'
                                                    }}
                                                    title={isPayable ? "Gestionar Pagos" : "Bloqueado: Debe recibir mercancía primero"}
                                                >
                                                    <IconWallet /> Gestionar Pagos
                                                </button>
                                            );
                                        })()}
                                    </div>
                                    
                                    <div style={styles.infoRow}><span style={styles.infoLabel}>Envío:</span> <strong>{compraSeleccionada.estado_de_envio?.replace('_', ' ')}</strong></div>
                                    <div style={styles.infoRow}><span style={styles.infoLabel}>Pago:</span> 
                                        <span style={{
                                            color: compraSeleccionada.estado_de_pago === 'PAGADO' ? '#166534' : 
                                                    compraSeleccionada.estado_de_pago === 'PENDIENTE' ? '#b91c1c' : '#854d0e',
                                            fontWeight: 'bold'
                                        }}>
                                            {compraSeleccionada.estado_de_pago}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <h4 style={styles.sectionTitle}>Productos Adquiridos</h4>
                            <table style={{width:'100%', fontSize:'0.9rem', borderCollapse:'collapse', marginBottom: 20}}>
                                <thead style={{background:'#f8fafc', borderBottom:'1px solid #e2e8f0'}}>
                                    <tr>
                                        <th style={styles.thDetalle}>Producto</th>
                                        <th style={{...styles.thDetalle, textAlign:'center'}}>Cant.</th>
                                        <th style={{...styles.thDetalle, textAlign:'right'}}>Costo U. ($)</th>
                                        <th style={{...styles.thDetalle, textAlign:'right'}}>Subtotal ($)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detallesCompra.length === 0 ? (
                                        <tr><td colSpan={4} style={{padding:20, textAlign:'center', color:'#94a3b8'}}>
                                            No se encontraron detalles.
                                        </td></tr>
                                    ) : (
                                        detallesCompra.map((d, i) => {
                                            const nombreProducto = 
                                                d.id_producto_nombre || 
                                                d.producto_nombre || 
                                                d.id_producto?.nombre || 
                                                "Producto desconocido";
                                            
                                            const sku = d.producto_sku || d.id_producto?.sku || "";

                                            const cantidad = d.cantidad || 0;
                                            const precioU = parseFloat(d.precio_unitario || 0);
                                            const subtotal = parseFloat(d.subtotal || (cantidad * precioU));

                                            return (
                                                <tr key={i} style={{borderBottom:'1px solid #f1f5f9'}}>
                                                    <td style={styles.tdDetalle}>
                                                        <div style={{fontWeight: 600, color: '#0f172a'}}>
                                                            {nombreProducto}
                                                        </div>
                                                        {sku && (
                                                            <div style={{fontSize: '0.75rem', color: '#64748b', marginTop: '2px', fontWeight: 500}}>
                                                                SKU: {sku}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td style={{...styles.tdDetalle, textAlign:'center'}}>{cantidad}</td>
                                                    <td style={{...styles.tdDetalle, textAlign:'right'}}>{formatUSD(precioU)}</td>
                                                    <td style={{...styles.tdDetalle, textAlign:'right', fontWeight:600, color:'#0f172a'}}>
                                                        {formatUSD(subtotal)}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>

                            <div style={{textAlign:'right', fontSize:'1.3rem', fontWeight:'800', color:'#0f172a', borderTop:'2px solid #e2e8f0', paddingTop:15}}>
                                Total Compra: {formatUSD(compraSeleccionada.total_compra || compraSeleccionada.precio_final)}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <CreatePurchaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onUpdate={onUpdate} userId={testIds?.userId} />
            {compraToEdit && (<EditCompraModal compra={compraToEdit} onClose={() => setCompraToEdit(null)} onSave={handleModalSave} />)}
            
            {showPaymentModal && compraSeleccionada && (
                <RegisterPaymentModal 
                    compra={compraSeleccionada} 
                    onClose={() => setShowPaymentModal(false)} 
                    onSuccess={() => { 
                        onUpdate(); 
                    }} 
                />
            )}

            {showProviderModal && providerData && (
                <div style={styles.modalOverlay} onClick={() => setShowProviderModal(false)}>
                    <div style={styles.providerModal} onClick={e => e.stopPropagation()}>
                        <div style={styles.providerHeader}>
                            <h3 style={{margin:0, color:'#0f172a'}}>Información del Proveedor</h3>
                            <button onClick={() => setShowProviderModal(false)} style={styles.closeBtn}><IconX /></button>
                        </div>
                        <div style={{padding: '30px', textAlign:'center'}}>
                            <div style={{margin:'0 auto 20px', width:'80px', height:'80px', borderRadius:'50%', background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center'}}>
                                <IconBuilding />
                            </div>
                            <h2 style={{margin:'0 0 5px', fontSize:'1.5rem', color:'#0f172a'}}>{providerData.nombre}</h2>
                            <p style={{color:'#64748b', fontSize:'0.9rem', margin:0}}>Rif/ID: {providerData.rif || providerData.id_proveedor}</p>
                            
                            <div style={{marginTop:'25px', display:'grid', gap:'15px', textAlign:'left'}}>
                                <div style={styles.pInfoRow}><span>📧 Correo:</span> <span>{providerData.correo || "No registrado"}</span></div>
                                <div style={styles.pInfoRow}><span>📞 Teléfono:</span> <span>{providerData.telefono || "No registrado"}</span></div>
                                <div style={styles.pInfoRow}><span>📍 Dirección:</span> <span>{providerData.direccion || "No registrada"}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
    
    // Detalle Styles
    detailWrapper: { marginTop: "24px", animation: "fadeIn 0.4s ease-out" },
    detailCard: { backgroundColor: "#ffffff", borderRadius: "16px", padding: "30px", boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.1)", border: "1px solid #e2e8f0" },
    infoBox: { backgroundColor: "#f8fafc", padding: "20px", borderRadius: "12px", border: "1px solid #f1f5f9" },
    sectionTitle: { margin: "0 0 15px 0", fontSize: "0.85rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" },
    infoRow: { display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.95rem", color: "#334155", alignItems: 'center' },
    infoLabel: { fontWeight: "600", color: "#475569" },
    
    // Links y Botones nuevos
    linkText: { color: '#2563eb', cursor: 'pointer', fontWeight: '600', textDecoration: 'none', borderBottom: '1px dotted #2563eb' },
    btnPayment: { backgroundColor: '#fff', border: '1px solid #cbd5e1', color: '#0f172a', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', display: 'flex', gap: '6px', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
    
    thDetalle: { padding: "10px", textAlign: "left", color: "#475569", fontWeight: 600, fontSize:'0.85rem' },
    tdDetalle: { padding: "10px", color: "#334155", verticalAlign: "middle" },
    btnGhost: { display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", backgroundColor: "transparent", color: "#64748b", border: "1px solid #cbd5e1", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "0.85rem" },

    // Modal Proveedor
    modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 },
    providerModal: { backgroundColor: '#fff', width: '400px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', animation: 'fadeIn 0.2s ease-out' },
    providerHeader: { padding: '15px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' },
    closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' },
    pInfoRow: { display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f8fafc', borderRadius: '8px', fontSize: '0.9rem', color: '#334155' }
};

const styleSheet = document.createElement("style");
styleSheet.innerText = "@keyframes fadeIn { from { opacity:0; transform:translateY(15px); } to { opacity:1; transform:translateY(0); } }";
document.head.appendChild(styleSheet);

export default PurchaseDashboard;