// frontend/src/pages/InventoryDashboard.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import CreateProductForm from '../components/CreateProductForm'; // Importamos el nuevo modal multi-tab
import AdvancedSearchBar from '../components/AdvancedSearchBar';
import TableSkeleton from '../components/TableSkeleton';
import { useAuth } from '../AuthContext'; 

// --- ICONOS SVG ---
const IconBox = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>;
const IconSettings = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const IconEye = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>;

const PRODUCTOS_URL = '/api/inventario/productos/';
const EXISTENCIAS_URL = '/api/inventario/existencias/';

function InventoryDashboard({ refreshTrigger, onUpdate }) {
    const { user } = useAuth(); 
    
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ minPrice: '', maxPrice: '', status: '' });
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [stockResponse, productResponse] = await Promise.all([
                    axios.get(EXISTENCIAS_URL),
                    axios.get(PRODUCTOS_URL)
                ]);

                const stockMap = new Map(stockResponse.data.map(s => [s.id_producto, s]));

                const consolidatedData = productResponse.data.map(p => {
                    const stock = stockMap.get(p.id_producto);
                    return {
                        ...p,
                        current_stock: stock ? stock.cantidad : 0,
                        stock_status: stock ? stock.estado : 'AGOTADO',
                        marca: p.id_marca_nombre || p.marca_nombre || '-', 
                        categoria: p.id_categoria_nombre || p.categoria_nombre || '-'
                    };
                });
                
                setProducts(consolidatedData);
            } catch (err) {
                setError(`Error de conexión: ${err.message}.`);
                console.error("Fallo inventario:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [refreshTrigger]);

    const handleFilterChange = (key, value) => {
        if (key === 'CLEAR') {
            setSearchTerm('');
            setFilters({ minPrice: '', maxPrice: '', status: '' });
        } else {
            setFilters(prev => ({ ...prev, [key]: value }));
        }
    };

    const filteredProducts = products.filter(p => {
        const matchText = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchTerm.toLowerCase());
        const price = parseFloat(p.precio_venta);
        const matchMin = filters.minPrice ? price >= parseFloat(filters.minPrice) : true;
        const matchMax = filters.maxPrice ? price <= parseFloat(filters.maxPrice) : true;
        const matchStatus = filters.status ? p.stock_status === filters.status : true;
        return matchText && matchMin && matchMax && matchStatus;
    });

    // KPIs
    const totalStock = products.reduce((acc, p) => acc + p.current_stock, 0);
    const valorInventario = products.reduce((acc, p) => acc + (p.current_stock * parseFloat(p.precio_venta)), 0);
    const agotadosCount = products.filter(p => p.stock_status === 'AGOTADO').length;

    // Verificar Rol
    const puedeGestionar = user?.tipo === 'ADMINISTRADOR' || user?.tipo === 'GERENTE';

    if (loading) return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={styles.titleGroup}>
                    <div style={styles.iconCircle}><IconBox /></div>
                    <div><h2 style={styles.title}>Inventario General</h2><p style={styles.subtitle}>Cargando datos...</p></div>
                </div>
            </div>
            <TableSkeleton rows={8} columns={7} />
        </div>
    );

    if (error) return <div style={{padding:40, textAlign:'center', color:'#ef4444'}}>🛑 {error}</div>;

    return (
        <div style={styles.container}>
            
            {/* 1. HEADER & KPIs */}
            <div style={styles.topSection}>
                <div style={styles.header}>
                    <div style={styles.titleGroup}>
                        <div style={styles.iconCircle}><IconBox /></div>
                        <div>
                            <h2 style={styles.title}>Inventario General</h2>
                            <p style={styles.subtitle}>Vista consolidada de existencias y precios</p>
                        </div>
                    </div>
                    
                    {/* BOTÓN UNIFICADO: GESTIÓN DE PRODUCTOS */}
                    {puedeGestionar && (
                        <button onClick={() => setIsCreateModalOpen(true)} style={styles.createBtn}>
                            <IconSettings /> Gestión de Productos
                        </button>
                    )}
                </div>

                <div style={styles.kpiGrid}>
                    <div style={styles.kpiCard}>
                        <span style={styles.kpiLabel}>Total Productos</span>
                        <span style={styles.kpiValue}>{products.length}</span>
                    </div>
                    <div style={styles.kpiCard}>
                        <span style={styles.kpiLabel}>Unidades en Stock</span>
                        <span style={{...styles.kpiValue, color: '#0ea5e9'}}>{totalStock}</span>
                    </div>
                    <div style={styles.kpiCard}>
                        <span style={styles.kpiLabel}>Valor Estimado</span>
                        <span style={{...styles.kpiValue, color: '#10b981'}}>${valorInventario.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div style={styles.kpiCard}>
                        <span style={styles.kpiLabel}>Agotados</span>
                        <span style={{...styles.kpiValue, color: agotadosCount > 0 ? '#ef4444' : '#64748b'}}>{agotadosCount}</span>
                    </div>
                </div>
            </div>

            {/* 2. FILTROS & TABLA */}
            <div style={styles.content}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                    <AdvancedSearchBar 
                        searchTerm={searchTerm} onSearchChange={setSearchTerm}
                        filters={filters} onFilterChange={handleFilterChange}
                        config={{
                            searchPlaceholder: "🔍 Buscar por Nombre o SKU...", showPriceRange: true,
                            statusOptions: [
                                { value: 'DISPONIBLE', label: '🟢 Disponible' },
                                { value: 'AGOTADO', label: '🔴 Agotado' },
                                { value: 'BAJA_EXISTENCIA', label: '🟠 Baja existencia' }
                            ]
                        }}
                    />
                </div>

                <div style={{overflowX: 'auto'}}>
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.theadRow}>
                                <th style={styles.th}>Producto</th>
                                <th style={styles.th}>Marca</th>
                                <th style={styles.th}>Categoría</th>
                                <th style={styles.thRight}>Precio Venta</th>
                                <th style={styles.thRight}>Stock</th>
                                <th style={styles.th}>Estado</th>
                                <th style={styles.thAction}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map(p => (
                                <tr key={p.id_producto} style={styles.tr}>
                                    <td style={styles.td}>
                                        <div style={styles.prodName}>{p.nombre}</div>
                                        <div style={styles.prodSku}>SKU: {p.sku}</div>
                                    </td>
                                    
                                    <td style={styles.td}>
                                        <div style={styles.brandText}>{p.marca}</div>
                                    </td>

                                    <td style={styles.td}>
                                        <span style={styles.categoryBadge}>{p.categoria}</span>
                                    </td>

                                    <td style={styles.tdRight}>${p.precio_venta}</td>
                                    <td style={{ ...styles.tdRight, fontWeight: '700', color: p.current_stock > 0 ? '#0f172a' : '#94a3b8' }}>
                                        {p.current_stock}
                                    </td>
                                    <td style={styles.td}>
                                        <span style={getStatusStyle(p.stock_status)}>
                                            {p.stock_status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td style={styles.tdAction}>
                                        <Link to={`/inventario/lotes/${p.id_producto}`} style={styles.linkBtn}>
                                            <IconEye /> Ver Lotes
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {filteredProducts.length === 0 && (
                                <tr><td colSpan="7" style={styles.empty}>No se encontraron productos.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL GESTIÓN DE PRODUCTOS (MULTI-TAB) */}
            <CreateProductForm 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onUpdate={onUpdate}
            /> 
        </div>
    );
}

const getStatusStyle = (status) => {
    const base = { padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', display: 'inline-block' };
    if (status === 'DISPONIBLE') return { ...base, backgroundColor: '#dcfce7', color: '#166534' };
    if (status === 'AGOTADO') return { ...base, backgroundColor: '#fee2e2', color: '#991b1b' };
    if (status === 'BAJA_EXISTENCIA') return { ...base, backgroundColor: '#ffedd5', color: '#9a3412' };
    return { ...base, backgroundColor: '#f1f5f9', color: '#475569' };
};

const styles = {
    container: { padding: '24px 32px', maxWidth: '1400px', margin: '0 auto', fontFamily: "'Inter', sans-serif" },
    topSection: { marginBottom: '32px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    titleGroup: { display: 'flex', alignItems: 'center', gap: '16px' },
    iconCircle: { width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#f0f9ff', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    title: { margin: 0, fontSize: '1.5rem', color: '#0f172a', fontWeight: '700' },
    subtitle: { margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' },
    createBtn: {
        backgroundColor: '#0f172a', color: 'white', border: 'none',
        padding: '10px 20px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '600',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        transition: 'transform 0.1s ease'
    },
    kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' },
    kpiCard: { backgroundColor: '#fff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
    kpiLabel: { display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' },
    kpiValue: { fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', lineHeight: 1 },
    content: { backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden', border: '1px solid #e2e8f0' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' },
    theadRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
    th: { padding: '16px 24px', textAlign: 'left', fontWeight: '600', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
    thRight: { padding: '16px 24px', textAlign: 'right', fontWeight: '600', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
    thAction: { padding: '16px 24px', textAlign: 'center', fontWeight: '600', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' },
    tr: { borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' },
    td: { padding: '16px 24px', verticalAlign: 'middle', color: '#334155' },
    tdRight: { padding: '16px 24px', verticalAlign: 'middle', textAlign: 'right', color: '#334155', fontFamily: 'monospace', fontSize: '0.95rem' },
    tdAction: { padding: '16px 24px', verticalAlign: 'middle', textAlign: 'center' },
    prodName: { fontWeight: '600', color: '#0f172a', marginBottom: '2px' },
    prodSku: { fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' },
    categoryBadge: { display: 'inline-block', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', color: '#475569', fontWeight: '600' },
    brandText: { fontSize: '0.85rem', color: '#475569', fontWeight: '500' },
    linkBtn: { 
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        color: '#3b82f6', textDecoration: 'none', fontWeight: '600', fontSize: '0.85rem',
        padding: '6px 12px', borderRadius: '6px', backgroundColor: '#eff6ff',
        transition: 'background 0.2s'
    },
    empty: { padding: '40px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }
};

export default InventoryDashboard;