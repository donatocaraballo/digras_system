// frontend/src/components/PurchaseHistoryTable.jsx

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdvancedSearchBar from './AdvancedSearchBar';
import RegisterPaymentModal from './RegisterPaymentModal';
import toast from 'react-hot-toast';

const COMPRAS_URL = '/api/compras/compras/';

// ICONOS
const IconEdit = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const IconTrash = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const IconDollar = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;

function PurchaseHistoryTable({ refreshTrigger, onUpdate, onEditClick }) {
    const [compras, setCompras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [paymentOrder, setPaymentOrder] = useState(null);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ startDate: '', endDate: '', status: '', secondary: '' });

    const fetchCompras = useCallback(async () => {
        try {
            const response = await axios.get(COMPRAS_URL);
            const sortedData = response.data.sort((a, b) => b.id_compra - a.id_compra);
            setCompras(sortedData);
        } catch (err) {
            setError(`Error al cargar historial: ${err.message}.`);
        } finally {
            setLoading(false);
        }
    }, [refreshTrigger]);

    useEffect(() => { fetchCompras(); }, [fetchCompras]);

    // MAPEO DE COLORES DE ESTADO (Diseño Moderno)
    const getStatusStyle = (estado) => {
        const map = {
            'RECIBIDA_COMPLETA': { bg: '#dcfce7', text: '#166534' }, // Verde
            'PAGADO': { bg: '#dcfce7', text: '#166534' },
            'APROBADA': { bg: '#dbeafe', text: '#1e40af' }, // Azul
            'PENDIENTE': { bg: '#ffedd5', text: '#9a3412' }, // Naranja
            'PENDIENTE_APROBACION': { bg: '#ffedd5', text: '#9a3412' },
            'PAGADO_PARCIAL': { bg: '#ccfbf1', text: '#115e59' }, // Teal
            'RECIBIDA_PARCIAL': { bg: '#ccfbf1', text: '#115e59' },
            'CANCELADA': { bg: '#fee2e2', text: '#991b1b' }, // Rojo
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
        const matchText = c.id_compra.toString().includes(searchTerm) || c.id_proveedor_nombre.toLowerCase().includes(searchTerm.toLowerCase());
        const date = new Date(c.fecha_pedido);
        const start = filters.startDate ? new Date(filters.startDate) : null;
        const end = filters.endDate ? new Date(filters.endDate) : null;
        const matchDate = (!start || date >= start) && (!end || date <= end);
        const matchStatus = filters.status ? c.estado_de_envio === filters.status : true;
        const matchPay = filters.secondary ? c.metodo_pago === filters.secondary : true;
        return matchText && matchDate && matchStatus && matchPay;
    });

    const handleDelete = (compraId) => {
        toast((t) => (
            <div style={{textAlign:'center'}}>
                <p>¿Eliminar Compra <b>#{compraId}</b>?</p>
                <div style={{display:'flex', gap:'10px', justifyContent:'center'}}>
                    <button onClick={() => toast.dismiss(t.id)} style={styles.toastBtnCancel}>Cancelar</button>
                    <button onClick={() => { toast.dismiss(t.id); executeDelete(compraId); }} style={styles.toastBtnConfirm}>Sí, eliminar</button>
                </div>
            </div>
        ));
    };

    const executeDelete = async (compraId) => {
        try {
            await axios.delete(`${COMPRAS_URL}${compraId}/`);
            toast.success(`Compra #${compraId} eliminada`);
            onUpdate();
        } catch (error) {
            toast.error("Error al eliminar. Verifique permisos.");
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
                            { value: 'CANCELADA', label: '🔴 Cancelada' }
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
                        {filteredCompras.map((compra) => {
                            const envioStyle = getStatusStyle(compra.estado_de_envio);
                            const pagoStyle = getStatusStyle(compra.estado_de_pago);
                            const isShipped = compra.estado_de_envio.includes('RECIBIDA');
                            const isPaid = ['PAGADO', 'PAGADO_PARCIAL'].includes(compra.estado_de_pago);
                            const isLocked = compra.estado_de_envio === 'RECIBIDA_COMPLETA' || compra.estado_de_envio === 'RECIBIDA_PARCIAL' || isShipped || isPaid;

                            return (
                                <tr key={compra.id_compra} style={styles.tr}>
                                    <td style={styles.tdBold}>#{compra.id_compra}</td>
                                    <td style={styles.td}>{compra.id_proveedor_nombre}</td>
                                    <td style={styles.td}>{compra.fecha_pedido}</td>
                                    <td style={styles.tdAmount}>${Number(compra.precio_final).toFixed(2)}</td>
                                    
                                    <td style={styles.td}>
                                        <span style={{...styles.badge, backgroundColor: envioStyle.bg, color: envioStyle.text}}>
                                            {compra.estado_de_envio.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td style={styles.td}>
                                        <span style={{...styles.badge, backgroundColor: pagoStyle.bg, color: pagoStyle.text}}>
                                            {compra.estado_de_pago}
                                        </span>
                                    </td>
                                    
                                    <td style={styles.tdAction}>
                                        <div style={styles.actionGroup}>
                                            <button onClick={() => onEditClick(compra)} disabled={isLocked} title="Editar" style={{...styles.iconBtn, color: isLocked ? '#cbd5e1' : '#3b82f6'}}>
                                                <IconEdit />
                                            </button>
                                            <button onClick={() => setPaymentOrder(compra)} title="Pagar" style={{...styles.iconBtn, color: '#f59e0b'}}>
                                                <IconDollar />
                                            </button>
                                            <button onClick={() => handleDelete(compra.id_compra)} disabled={isLocked} title="Eliminar" style={{...styles.iconBtn, color: isLocked ? '#cbd5e1' : '#ef4444'}}>
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

            {paymentOrder && (
                <RegisterPaymentModal 
                    compra={paymentOrder} 
                    onClose={() => setPaymentOrder(null)} 
                    onSuccess={() => { setPaymentOrder(null); onUpdate(); }} 
                />
            )}
        </div>
    );
}

const styles = {
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' },
    theadRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
    th: { padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' },
    thAction: { padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' },
    tr: { borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' },
    td: { padding: '14px 16px', color: '#334155' },
    tdBold: { padding: '14px 16px', color: '#0f172a', fontWeight: '600' },
    tdAmount: { padding: '14px 16px', color: '#0f172a', fontWeight: '700', fontFamily: 'monospace' },
    tdAction: { padding: '14px 16px', textAlign: 'right' },
    
    badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', whiteSpace: 'nowrap' },
    actionGroup: { display: 'flex', justifyContent: 'flex-end', gap: '8px' },
    iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', transition: 'background 0.2s' },
    empty: { padding: '40px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' },
    
    toastBtnConfirm: { background: '#ef4444', color:'white', border:'none', padding:'6px 12px', borderRadius:'4px', cursor:'pointer' },
    toastBtnCancel: { background: '#e2e8f0', color:'#333', border:'none', padding:'6px 12px', borderRadius:'4px', cursor:'pointer' }
};

export default PurchaseHistoryTable;