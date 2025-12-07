// frontend/src/components/ProviderTable.jsx

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import AdvancedSearchBar from './AdvancedSearchBar';

const PROVEEDORES_URL = '/api/compras/proveedores/';

// --- ICONOS SVG ---
const IconEdit = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const IconTrash = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const IconBuilding = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="9" y1="22" x2="9" y2="22.01"></line><line x1="15" y1="22" x2="15" y2="22.01"></line><line x1="12" y1="22" x2="12" y2="22.01"></line><line x1="12" y1="2" x2="12" y2="6"></line><line x1="9" y1="10" x2="9" y2="10.01"></line><line x1="15" y1="10" x2="15" y2="10.01"></line><line x1="9" y1="14" x2="9" y2="14.01"></line><line x1="15" y1="14" x2="15" y2="14.01"></line><line x1="9" y1="18" x2="9" y2="18.01"></line><line x1="15" y1="18" x2="15" y2="18.01"></line></svg>;

function ProviderTable({ refreshTrigger, onEditClick, filterText }) {
    const [proveedores, setProveedores] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Estado interno para búsqueda (si no se usa filterText desde el padre)
    const [internalSearch, setInternalSearch] = useState('');

    const fetchProveedores = useCallback(async () => {
        try {
            const response = await axios.get(PROVEEDORES_URL);
            // Ordenar por ID descendente (más nuevos primero)
            setProveedores(response.data.sort((a, b) => b.id_proveedor - a.id_proveedor));
        } catch (err) {
            console.error("Error cargando proveedores:", err);
            toast.error("Error de conexión al cargar proveedores");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProveedores();
    }, [fetchProveedores, refreshTrigger]);

    const handleDelete = (id, nombre) => {
        toast((t) => (
            <div style={{textAlign:'center'}}>
                <p>¿Eliminar al proveedor <b>{nombre}</b>?</p>
                <div style={{display:'flex', gap:'10px', justifyContent:'center'}}>
                    <button onClick={() => toast.dismiss(t.id)} style={styles.toastBtnCancel}>Cancelar</button>
                    <button onClick={() => { toast.dismiss(t.id); executeDelete(id); }} style={styles.toastBtnConfirm}>Eliminar</button>
                </div>
            </div>
        ));
    };

    const executeDelete = async (id) => {
        const loadingToast = toast.loading("Eliminando...");
        try {
            await axios.delete(`${PROVEEDORES_URL}${id}/`);
            toast.dismiss(loadingToast);
            toast.success("Proveedor eliminado");
            fetchProveedores(); 
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error("No se puede eliminar: Tiene historial de compras.", { duration: 4000 });
        }
    };

    // Determinar qué término de búsqueda usar (prop del padre o estado local)
    const activeSearchTerm = filterText !== undefined ? filterText : internalSearch;

    const filteredProviders = proveedores.filter(p => {
        const term = activeSearchTerm.toLowerCase();
        return p.nombre.toLowerCase().includes(term) ||
               (p.correo && p.correo.toLowerCase().includes(term)) ||
               (p.telefono && p.telefono.includes(term));
    });

    if (loading) return <div style={{padding:40, textAlign:'center', color:'#94a3b8'}}>Cargando directorio...</div>;

    return (
        <div style={styles.card}>
            
            {/* 🚨 INTEGRACIÓN: AdvancedSearchBar */}
            {/* Solo mostramos la barra interna si el padre NO está controlando el filtro */}
            {filterText === undefined && (
                <div style={styles.searchContainer}>
                    <AdvancedSearchBar 
                        searchTerm={internalSearch}
                        onSearchChange={setInternalSearch}
                        filters={{}}
                        onFilterChange={(key, value) => { if(key === 'CLEAR') setInternalSearch('') }}
                        config={{
                            searchPlaceholder: "🔍 Buscar por Nombre, RIF o Contacto...",
                            // Desactivamos filtros complejos, solo texto
                            showDateRange: false, 
                            showPriceRange: false,
                            statusOptions: null
                        }}
                    />
                </div>
            )}

            <div style={{overflowX: 'auto'}}>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.theadRow}>
                            <th style={styles.th}>Proveedor</th>
                            <th style={styles.th}>Contacto</th>
                            <th style={styles.th}>Dirección</th>
                            <th style={styles.thAction}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProviders.map((prov) => (
                            <tr key={prov.id_proveedor} style={styles.tr}>
                                <td style={styles.td}>
                                    <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                                        <div style={styles.avatar}>
                                            <IconBuilding />
                                        </div>
                                        <div>
                                            <div style={styles.nameText}>{prov.nombre}</div>
                                            <div style={styles.idText}>ID: {prov.id_proveedor}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={styles.td}>
                                    {prov.correo && <div style={styles.contactItem}>📧 {prov.correo}</div>}
                                    {prov.telefono && <div style={styles.contactItem}>📞 {prov.telefono}</div>}
                                    {!prov.correo && !prov.telefono && <span style={{color:'#cbd5e1'}}>-</span>}
                                </td>
                                <td style={styles.td}>
                                    <span style={styles.addressText}>{prov.direccion || 'Sin dirección registrada'}</span>
                                </td>
                                <td style={styles.tdAction}>
                                    <div style={styles.actionGroup}>
                                        <button onClick={() => onEditClick(prov)} style={styles.iconBtnEdit} title="Editar">
                                            <IconEdit />
                                        </button>
                                        <button onClick={() => handleDelete(prov.id_proveedor, prov.nombre)} style={styles.iconBtnDelete} title="Eliminar">
                                            <IconTrash />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredProviders.length === 0 && (
                            <tr><td colSpan="4" style={styles.empty}>No se encontraron proveedores.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// --- ESTILOS PREMIUM ---
const styles = {
    card: {
        backgroundColor: '#ffffff', borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        overflow: 'hidden', border: '1px solid #f1f5f9'
    },
    searchContainer: { padding: '20px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' },
    
    // Tabla
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' },
    theadRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
    th: { padding: '16px 24px', textAlign: 'left', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' },
    thAction: { padding: '16px 24px', textAlign: 'center', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' },
    
    tr: { borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' },
    td: { padding: '16px 24px', verticalAlign: 'middle', color: '#334155' },
    tdAction: { padding: '16px 24px', verticalAlign: 'middle', textAlign: 'center' },

    // Elementos Visuales
    avatar: {
        width: '40px', height: '40px', borderRadius: '10px',
        backgroundColor: '#f3e8ff', color: '#9333ea', // Violeta suave
        display: 'flex', alignItems: 'center', justifyContent: 'center'
    },
    nameText: { fontWeight: '600', color: '#1e293b', fontSize: '0.95rem' },
    idText: { fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' },
    
    contactItem: { fontSize: '0.85rem', color: '#475569', marginBottom: '2px' },
    addressText: { fontSize: '0.85rem', color: '#64748b', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },

    // Botones Acción
    actionGroup: { display: 'flex', justifyContent: 'center', gap: '8px' },
    iconBtnEdit: { 
        background: '#eff6ff', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', 
        color: '#3b82f6', transition: 'background 0.2s' 
    },
    iconBtnDelete: { 
        background: '#fef2f2', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', 
        color: '#ef4444', transition: 'background 0.2s' 
    },
    
    empty: { padding: '40px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' },

    // Toast Buttons
    toastBtnConfirm: { background: '#ef4444', color:'white', border:'none', padding:'6px 12px', borderRadius:'6px', cursor:'pointer', fontWeight: 600 },
    toastBtnCancel: { background: '#e2e8f0', color:'#333', border:'none', padding:'6px 12px', borderRadius:'6px', cursor:'pointer' }
};

export default ProviderTable;