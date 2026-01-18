// frontend/src/components/PurchaseHistoryTable.jsx

import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/api'; 
import AdvancedSearchBar from './AdvancedSearchBar';
import RegisterPaymentModal from './RegisterPaymentModal';
import toast from 'react-hot-toast'; 

const COMPRAS_URL = '/compras/compras/'; 

// ICONOS
const IconEdit = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const IconTrash = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const IconDollar = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
const IconAlert = () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;

function PurchaseHistoryTable({ refreshTrigger, onUpdate, onEditClick, onRowClick, selectedId }) {
    const [compras, setCompras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Estado para el modal de pago
    const [paymentOrder, setPaymentOrder] = useState(null);
    
    // Estado para el modal de eliminación (CENTRADO)
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ startDate: '', endDate: '', status: '', secondary: '' });

    const fetchCompras = useCallback(async () => {
        try {
            const response = await api.get('/compras/compras/'); 
            const data = Array.isArray(response.data) ? response.data : response.data.results || [];
            const sortedData = data.sort((a, b) => b.id_compra - a.id_compra);
            setCompras(sortedData);
        } catch (err) {
            setError(`Error al cargar historial: ${err.message}.`);
        } finally {
            setLoading(false);
        }
    }, [refreshTrigger]);

    useEffect(() => { fetchCompras(); }, [fetchCompras]);

    const getStatusStyle = (estado) => {
        const map = {
            'RECIBIDA_COMPLETA': { bg: '#dcfce7', text: '#166534' }, 
            'PAGADO': { bg: '#dcfce7', text: '#166534' },
            'APROBADA': { bg: '#dbeafe', text: '#1e40af' }, 
            'PENDIENTE': { bg: '#ffedd5', text: '#9a3412' }, 
            'PENDIENTE_APROBACION': { bg: '#ffedd5', text: '#9a3412' },
            'PAGADO_PARCIAL': { bg: '#ccfbf1', text: '#115e59' }, 
            'RECIBIDA_PARCIAL': { bg: '#ccfbf1', text: '#115e59' },
            'CANCELADA': { bg: '#fee2e2', text: '#991b1b' }, 
            'DEVUELTA': { bg: '#fee2e2', text: '#991b1b' }, 
        };
        return map[estado] || { bg: '#f1f5f9', text: '#475569' };
    };

    const handleFilterChange = (key, value) => {
        if (key === 'CLEAR') {
            setSearchTerm('');
            setFilters({ startDate: '', endDate: '', status: '', secondary: '' });
        } else {
            setFilters(prev => ({ ...prev, [key]: value }));
        }
    };

    const filteredCompras = compras.filter(c => {
        const matchText = c.id_compra.toString().includes(searchTerm) || (c.id_proveedor_nombre || "").toLowerCase().includes(searchTerm.toLowerCase());
        const date = new Date(c.fecha_pedido || c.fecha_compra);
        const start = filters.startDate ? new Date(filters.startDate) : null;
        const end = filters.endDate ? new Date(filters.endDate) : null;
        const matchDate = (!start || date >= start) && (!end || date <= end);
        const matchStatus = filters.status ? c.estado_de_envio === filters.status : true;
        const matchPay = filters.secondary ? c.metodo_pago === filters.secondary : true;
        return matchText && matchDate && matchStatus && matchPay;
    });

    // --- LÓGICA DE ELIMINACIÓN ---
    const handleDeleteClick = (compraId) => {
        setDeleteTargetId(compraId); // Abre el modal centrado
    };

    const confirmDelete = async () => {
        if (!deleteTargetId) return;
        setIsDeleting(true);
        try {
            await api.delete(`${COMPRAS_URL}${deleteTargetId}/`);
            toast.success(`Compra #${deleteTargetId} eliminada`);
            onUpdate();
            fetchCompras();
            setDeleteTargetId(null); // Cierra modal
        } catch (error) {
            const msg = error.response?.data?.error || "Error al eliminar.";
            toast.error(msg);
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) return <div style={{padding:40, textAlign:'center', color:'#64748b'}}>Cargando datos...</div>;
    if (error) return <div style={{padding:20, color:'#ef4444'}}>{error}</div>;

    return (
        <div style={{ padding: '0' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', backgroundColor:'#f8fafc' }}>
                <AdvancedSearchBar 
                    searchTerm={searchTerm} onSearchChange={setSearchTerm}
                    filters={filters} onFilterChange={handleFilterChange}
                    config={{
                        searchPlaceholder: "🔍 Buscar ID o Proveedor...", showDateRange: true,
                        statusOptions: [
                            { value: 'PENDIENTE_APROBACION', label: '🟡 Pendiente' },
                            { value: 'APROBADA', label: '🔵 Aprobada' },
                            { value: 'RECIBIDA_COMPLETA', label: '🟢 Recibida' },
                            { value: 'RECIBIDA_PARCIAL', label: '🟠 Recibida Parcial' },
                            { value: 'CANCELADA', label: '🔴 Cancelada' },
                            { value: 'DEVUELTA', label: '🔴 Devuelta' }
                        ]
                    }}
                />
            </div>

            <div style={{overflowX: 'auto'}}>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.theadRow}>
                            <th style={styles.th}>ID</th>
                            <th style={styles.th}>Proveedor</th>
                            <th style={styles.th}>Fecha</th>
                            <th style={styles.th}>Total</th>
                            <th style={styles.th}>Estado Envío</th>
                            <th style={styles.th}>Estado Pago</th>
                            <th style={styles.thAction}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCompras.map((compra, idx) => {
                            const envioStyle = getStatusStyle(compra.estado_de_envio);
                            const pagoStyle = getStatusStyle(compra.estado_de_pago);
                            
                            const isLocked = !['PENDIENTE_APROBACION', 'PENDIENTE'].includes(compra.estado_de_envio) || 
                                             ['PAGADO', 'PAGADO_PARCIAL'].includes(compra.estado_de_pago);
                            const isPayable = ['RECIBIDA_COMPLETA', 'RECIBIDA_PARCIAL'].includes(compra.estado_de_envio);
                            const isSelected = selectedId === compra.id_compra;

                            return (
                                <tr 
                                    key={compra.id_compra} 
                                    style={{
                                        ...styles.tr,
                                        backgroundColor: isSelected ? '#eff6ff' : (idx % 2 === 0 ? '#ffffff' : '#fafafa'),
                                        borderLeft: isSelected ? '4px solid #2563eb' : '4px solid transparent'
                                    }}
                                    onClick={() => onRowClick && onRowClick(compra)} 
                                >
                                    <td style={styles.tdBold}>#{compra.id_compra}</td>
                                    <td style={styles.td}>{compra.id_proveedor_nombre || compra.proveedor_nombre}</td>
                                    <td style={styles.td}>{compra.fecha_pedido || compra.fecha_compra}</td>
                                    <td style={styles.tdAmount}>${Number(compra.precio_final || compra.total_compra).toFixed(2)}</td>
                                    
                                    <td style={styles.td}>
                                        <span style={{...styles.badge, backgroundColor: envioStyle.bg, color: envioStyle.text}}>
                                            {compra.estado_de_envio?.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td style={styles.td}>
                                        <span style={{...styles.badge, backgroundColor: pagoStyle.bg, color: pagoStyle.text}}>
                                            {compra.estado_de_pago}
                                        </span>
                                    </td>
                                    
                                    <td style={styles.tdAction}>
                                        <div style={styles.actionGroup}>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onEditClick(compra); }} 
                                                disabled={isLocked} 
                                                title={isLocked ? "No editable (Procesada/Pagada)" : "Editar"} 
                                                style={{...styles.iconBtn, color: isLocked ? '#cbd5e1' : '#3b82f6', cursor: isLocked ? 'not-allowed' : 'pointer'}}
                                            >
                                                <IconEdit />
                                            </button>
                                            
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); if(isPayable) setPaymentOrder(compra); }} 
                                                disabled={!isPayable}
                                                title={!isPayable ? "Debe recibir la mercancía para pagar" : "Registrar Pago"} 
                                                style={{...styles.iconBtn, color: !isPayable ? '#cbd5e1' : '#f59e0b', cursor: !isPayable ? 'not-allowed' : 'pointer'}}
                                            >
                                                <IconDollar />
                                            </button>
                                            
                                            {/* BOTÓN ELIMINAR */}
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleDeleteClick(compra.id_compra); }} 
                                                disabled={isLocked} 
                                                title={isLocked ? "No eliminable (Procesada/Pagada)" : "Eliminar"} 
                                                style={{...styles.iconBtn, color: isLocked ? '#cbd5e1' : '#ef4444', cursor: isLocked ? 'not-allowed' : 'pointer'}}
                                            >
                                                <IconTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filteredCompras.length === 0 && <div style={styles.empty}>No se encontraron registros</div>}
            </div>

            {/* MODAL DE PAGOS */}
            {paymentOrder && (
                <RegisterPaymentModal 
                    compra={paymentOrder} 
                    onClose={() => setPaymentOrder(null)} 
                    onSuccess={() => { setPaymentOrder(null); onUpdate(); fetchCompras(); }} 
                />
            )}

            {/* 🚨 NUEVO MODAL DE CONFIRMACIÓN DE ELIMINACIÓN (CENTRADO) */}
            {deleteTargetId && (
                <div style={styles.modalOverlay}>
                    <div style={styles.confirmModal}>
                        <div style={{marginBottom: 15, display:'flex', flexDirection:'column', alignItems:'center'}}>
                            <div style={{background:'#fee2e2', padding:10, borderRadius:'50%', marginBottom:10}}>
                                <IconAlert />
                            </div>
                            <h3 style={{margin:0, color:'#1e293b'}}>¿Eliminar Compra #{deleteTargetId}?</h3>
                        </div>
                        <p style={{textAlign:'center', color:'#64748b', fontSize:'0.9rem', marginBottom:20}}>
                            Esta acción no se puede deshacer. Se eliminará el registro permanentemente.
                        </p>
                        <div style={{display:'flex', gap:10, justifyContent:'center'}}>
                            <button 
                                onClick={() => setDeleteTargetId(null)} 
                                style={styles.toastBtnCancel}
                                disabled={isDeleting}
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={confirmDelete} 
                                style={styles.toastBtnConfirm}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' },
    theadRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
    th: { padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' },
    thAction: { padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' },
    
    tr: { borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s', cursor: 'pointer' },
    
    td: { padding: '14px 16px', color: '#334155', verticalAlign: 'middle' },
    tdBold: { padding: '14px 16px', color: '#0f172a', fontWeight: '600', verticalAlign: 'middle' },
    tdAmount: { padding: '14px 16px', color: '#0f172a', fontWeight: '700', fontFamily: 'monospace', verticalAlign: 'middle' },
    tdAction: { padding: '14px 16px', textAlign: 'right', verticalAlign: 'middle' },
    
    badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', whiteSpace: 'nowrap' },
    actionGroup: { display: 'flex', justifyContent: 'flex-end', gap: '8px' },
    iconBtn: { background: 'none', border: 'none', padding: '6px', borderRadius: '6px', transition: 'background 0.2s' },
    empty: { padding: '40px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' },
    
    // Estilos del Modal Centrado
    modalOverlay: {
        position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999 // Z-Index muy alto
    },
    confirmModal: {
        backgroundColor: '#fff', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '400px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        animation: 'scaleUp 0.2s ease-out'
    },
    
    toastBtnConfirm: { background: '#ef4444', color:'white', border:'none', padding:'10px 20px', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'0.9rem' },
    toastBtnCancel: { background: '#f1f5f9', color:'#334155', border:'1px solid #e2e8f0', padding:'10px 20px', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'0.9rem' }
};

// Inyectar animación
const styleSheet = document.createElement("style");
styleSheet.innerText = `@keyframes scaleUp { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }`;
document.head.appendChild(styleSheet);

export default PurchaseHistoryTable;