// frontend/src/pages/LotDetailView.jsx

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import AdvancedSearchBar from '../components/AdvancedSearchBar'; 
import QrLabelModal from '../components/QrLabelModal';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast, { Toaster } from 'react-hot-toast';

// --- ICONOS SVG ---
const IconBox = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>;
const IconArrowLeft = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>;
const IconQr = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
const IconPrint = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>;
const IconAlert = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;

const LOTES_URL = '/api/inventario/lotes/';

function LotDetailView() {
    const { productId } = useParams(); 
    const navigate = useNavigate();
    
    const [lotes, setLotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [productName, setProductName] = useState(`Producto ID ${productId}`);
    const [selectedLoteForQr, setSelectedLoteForQr] = useState(null);
    
    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ startDate: '', endDate: '', status: '' });

    useEffect(() => {
        const fetchLotes = async () => {
            try {
                const response = await axios.get(`${LOTES_URL}?id_producto=${productId}`);
                // Ordenar: Vencidos primero, luego por fecha vencimiento más próxima
                const sortedData = response.data.sort((a, b) => {
                    if (a.estado === 'VENCIDO' && b.estado !== 'VENCIDO') return -1;
                    if (b.estado === 'VENCIDO' && a.estado !== 'VENCIDO') return 1;
                    return new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento);
                });
                
                setLotes(sortedData);
                if (response.data.length > 0) setProductName(response.data[0].id_producto_nombre);
            } catch (err) {
                toast.error(`Error cargando lotes: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };
        fetchLotes();
    }, [productId]);

    // --- FILTRADO ---
    const handleFilterChange = (key, value) => {
        if (key === 'CLEAR') {
            setSearchTerm('');
            setFilters({ startDate: '', endDate: '', status: '' });
        } else {
            setFilters(prev => ({ ...prev, [key]: value }));
        }
    };

    const filteredLotes = useMemo(() => {
        return lotes.filter(lote => {
            const matchText = lote.numero_lote.toLowerCase().includes(searchTerm.toLowerCase());
            const matchStatus = filters.status ? lote.estado === filters.status : true;
            
            const expDate = lote.fecha_vencimiento ? new Date(lote.fecha_vencimiento) : null;
            const start = filters.startDate ? new Date(filters.startDate) : null;
            const end = filters.endDate ? new Date(filters.endDate) : null;
            
            let matchDate = true;
            if (start || end) {
                if (!expDate) return false; 
                matchDate = (!start || expDate >= start) && (!end || expDate <= end);
            }
            return matchText && matchStatus && matchDate;
        });
    }, [lotes, searchTerm, filters]);

    // --- PDF EXPORT ---
    const exportarTrazabilidadPDF = () => {
        if (filteredLotes.length === 0) return toast.error("No hay lotes para exportar.");
        
        const doc = new jsPDF();
        
        // Encabezado
        doc.setFillColor(15, 23, 42); // Azul oscuro
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.text("Reporte de Trazabilidad", 14, 25);
        doc.setFontSize(12);
        doc.text(productName, 14, 32);
        
        doc.setFontSize(10);
        doc.text("DIGRAS C.A.", 195, 25, { align: "right" });
        doc.text(`Generado: ${new Date().toLocaleDateString()}`, 195, 32, { align: "right" });

        const headers = ["N° Lote", "Cantidad", "Fecha Pedido", "Vencimiento", "Estado"];
        const rows = filteredLotes.map(l => [
            l.numero_lote,
            l.cantidad,
            l.fecha_pedido,
            l.fecha_vencimiento || 'N/A',
            l.estado
        ]);

        autoTable(doc, {
            head: [headers],
            body: rows,
            startY: 50,
            styles: { fontSize: 9 },
            headStyles: { fillColor: [15, 23, 42] },
            alternateRowStyles: { fillColor: [248, 250, 252] }
        });

        doc.save(`trazabilidad_${productId}.pdf`);
    };

    // --- HELPERS VISUALES ---
    const badgeEstado = (estado) => {
        let bg = "#f1f5f9", color = "#475569", border = "#cbd5e1";
        if (estado === 'ACTIVO') { bg = "#dcfce7"; color = "#166534"; border = "#bbf7d0"; }
        if (estado === 'VENCIDO') { bg = "#fee2e2"; color = "#991b1b"; border = "#fecaca"; }
        if (estado === 'AGOTADO') { bg = "#f3f4f6"; color = "#6b7280"; border = "#e5e7eb"; }

        return (
            <span style={{
                display: "inline-flex", alignItems: 'center', gap: '4px',
                padding: "3px 10px", borderRadius: "20px",
                fontSize: "0.7rem", fontWeight: "700",
                background: bg, color: color, border: `1px solid ${border}`
            }}>
                {estado === 'VENCIDO' && <IconAlert />}
                {estado}
            </span>
        );
    };

    const totalStock = filteredLotes.reduce((acc, curr) => acc + (curr.estado === 'ACTIVO' ? curr.cantidad : 0), 0);

    return (
        <div style={styles.container}>
            <Toaster position="top-center" />
            
            {/* HEADER */}
            <div style={styles.header}>
                <div style={styles.titleGroup}>
                    <button onClick={() => navigate('/inventario')} style={styles.backBtn} title="Volver a Inventario">
                        <IconArrowLeft />
                    </button>
                    <div style={styles.iconCircle}>
                        <IconBox />
                    </div>
                    <div>
                        <h2 style={styles.title}>Trazabilidad de Lotes</h2>
                        <p style={styles.subtitle}>{productName}</p>
                    </div>
                </div>

                <div style={styles.statsBox}>
                    <div style={styles.statLabel}>Stock Disponible (Lotes Activos)</div>
                    <div style={styles.statValue}>{totalStock} <span style={{fontSize:'0.9rem', fontWeight:400, color:'#64748b'}}>unidades</span></div>
                </div>
            </div>

            <div style={styles.card}>
                {/* TOOLBAR SUPERIOR */}
                <div style={styles.toolbar}>
                    <div style={{flex: 1}}>
                        {/* Componente de búsqueda existente, envuelto en estilo */}
                        <AdvancedSearchBar 
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            config={{
                                searchPlaceholder: "Buscar lote...",
                                showDateRange: true,
                                statusOptions: [
                                    { value: 'ACTIVO', label: 'Activo' },
                                    { value: 'VENCIDO', label: 'Vencido' },
                                    { value: 'AGOTADO', label: 'Agotado' }
                                ]
                            }}
                        />
                    </div>
                    <div>
                        <button onClick={exportarTrazabilidadPDF} style={styles.btnGhost}>
                            <IconPrint /> Exportar PDF
                        </button>
                    </div>
                </div>

                {/* TABLA */}
                <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>N° Lote</th>
                                <th style={styles.th}>Cantidad</th>
                                <th style={styles.th}>Fecha Ingreso</th>
                                <th style={styles.th}>Vencimiento</th>
                                <th style={styles.th}>Estado</th>
                                <th style={{...styles.th, textAlign:'center'}}>Etiqueta</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && <tr><td colSpan={6} style={styles.loadingTd}>Cargando lotes...</td></tr>}
                            {!loading && filteredLotes.length === 0 && (
                                <tr><td colSpan={6} style={styles.emptyState}>No se encontraron lotes para este producto.</td></tr>
                            )}
                            
                            {filteredLotes.map((lote, idx) => (
                                <tr key={lote.id_lote} style={idx % 2 === 0 ? styles.tr : styles.rowAlt}>
                                    <td style={{...styles.td, fontWeight: '700', fontFamily: 'monospace', color: '#0f172a'}}>
                                        {lote.numero_lote}
                                    </td>
                                    <td style={styles.td}>{lote.cantidad}</td>
                                    <td style={styles.td}>{lote.fecha_pedido}</td>
                                    <td style={{...styles.td, color: lote.estado === 'VENCIDO' ? '#dc2626' : '#334155'}}>
                                        {lote.fecha_vencimiento || <span style={{color:'#94a3b8', fontStyle:'italic'}}>No aplica</span>}
                                    </td>
                                    <td style={styles.td}>
                                        {badgeEstado(lote.estado)}
                                    </td>
                                    <td style={{...styles.td, textAlign:'center'}}>
                                        <button 
                                            onClick={() => setSelectedLoteForQr(lote)}
                                            style={styles.btnIcon}
                                            title="Generar QR"
                                        >
                                            <IconQr />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL QR */}
            {selectedLoteForQr && (
                <QrLabelModal 
                    lote={selectedLoteForQr} 
                    productName={productName}
                    onClose={() => setSelectedLoteForQr(null)} 
                />
            )}
        </div>
    );
}

// --- ESTILOS PREMIUM ---
const styles = {
    container: { padding: "24px 32px", maxWidth: "1400px", margin: "0 auto", fontFamily: "'Inter', sans-serif" },
    
    header: { marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: 'wrap', gap: '20px' },
    titleGroup: { display: "flex", alignItems: "center", gap: "16px" },
    iconCircle: { width: "52px", height: "52px", borderRadius: "14px", backgroundColor: "#e0f2fe", color: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
    title: { margin: 0, fontSize: "1.8rem", color: "#0f172a", fontWeight: "800", letterSpacing: "-0.5px" },
    subtitle: { margin: "4px 0 0", color: "#64748b", fontSize: "0.95rem" },
    backBtn: { width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', ':hover': {transform: 'translateX(-2px)'} },

    statsBox: { padding: '15px 25px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 5px rgba(0,0,0,0.03)', textAlign: 'right' },
    statLabel: { fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', marginBottom: '4px' },
    statValue: { fontSize: '1.5rem', fontWeight: '800', color: '#166534' },

    card: { backgroundColor: "#ffffff", borderRadius: "20px", boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.05)", border: "1px solid #f1f5f9", overflow: "hidden", padding: '30px' },
    
    toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '25px', gap: '20px', flexWrap: 'wrap' },

    tableWrapper: { borderRadius: "12px", border: "1px solid #e2e8f0", overflowX: "auto" },
    table: { width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" },
    th: { padding: "16px 24px", textAlign: "left", color: "#475569", fontWeight: "700", borderBottom: "1px solid #e2e8f0", backgroundColor: "#f8fafc", textTransform: "uppercase", fontSize: "0.75rem" },
    td: { padding: "16px 24px", borderBottom: "1px solid #f1f5f9", color: "#334155", verticalAlign: "middle" },
    tr: { backgroundColor: '#fff' },
    rowAlt: { backgroundColor: "#f8fafc" },
    
    btnGhost: { display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", backgroundColor: "transparent", color: "#64748b", border: "1px solid #cbd5e1", borderRadius: "10px", fontWeight: "600", cursor: "pointer", fontSize: '0.9rem', height: '42px' },
    btnIcon: { width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0", backgroundColor: "#fff", color: "#0f172a", borderRadius: "8px", cursor: "pointer", transition: 'background 0.2s', ':hover': {background: '#f1f5f9'} },

    emptyState: { padding: "50px", textAlign: "center", color: "#94a3b8", fontStyle: "italic" },
    loadingTd: { padding: "30px", textAlign: "center", color: "#64748b" }
};

export default LotDetailView;