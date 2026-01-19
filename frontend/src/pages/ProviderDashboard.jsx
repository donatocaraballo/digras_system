// frontend/src/pages/ProviderDashboard.jsx

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import CreateProveedorModal from '../components/CreateProveedorModal'; 
import EditProviderModal from '../components/EditProviderModal';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast, { Toaster } from 'react-hot-toast';

// --- ICONOS SVG ---
const IconTruck = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>;
const IconPlus = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const IconSearch = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const IconEdit = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const IconTrash = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const IconChevronDown = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>;
const IconChevronUp = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>;
const IconDownload = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;
const IconPrint = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>;
const IconAlert = () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;
// ➕ Icono Filtro
const IconFilter = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>;
const IconXSmall = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

const PROVEEDORES_URL = '/api/compras/proveedores/';

function ProviderDashboard() {
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    
    // --- ESTADOS DE FILTRADO ---
    const [searchTerm, setSearchTerm] = useState(''); // Búsqueda General (Nombre, RIF, ID)
    const [showFilters, setShowFilters] = useState(false); // Toggle panel
    const [filters, setFilters] = useState({
        telefono: '',
        correo: '',
        direccion: ''
    });

    // Modales
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [providerToEdit, setProviderToEdit] = useState(null);
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [expandedId, setExpandedId] = useState(null);

    const handleRefresh = () => setRefreshKey(prev => prev + 1);

    useEffect(() => {
        const fetchProviders = async () => {
            setLoading(true);
            try {
                const res = await axios.get(PROVEEDORES_URL);
                setProviders(Array.isArray(res.data) ? res.data : res.data.results || []);
            } catch (error) {
                console.error(error);
                toast.error("Error al cargar proveedores");
            } finally {
                setLoading(false);
            }
        };
        fetchProviders();
    }, [refreshKey]);

    const handleCreateSuccess = () => {
        handleRefresh();
        setIsCreateModalOpen(false); 
        toast.success("Proveedor creado correctamente");
    };

    const confirmDelete = async () => {
        if(!deleteTargetId) return;
        setIsDeleting(true);
        try {
            await axios.delete(`${PROVEEDORES_URL}${deleteTargetId}/`);
            toast.success("Proveedor eliminado");
            setDeleteTargetId(null);
            handleRefresh();
        } catch (error) {
            const msg = error.response?.data?.error || "No se pudo eliminar (puede tener compras asociadas).";
            toast.error(msg);
        } finally {
            setIsDeleting(false);
        }
    };

    const toggleRow = (id) => {
        if (expandedId === id) setExpandedId(null);
        else setExpandedId(id);
    };

    // 🚨 LÓGICA DE FILTRADO AVANZADO
    const filteredProviders = useMemo(() => {
        return providers.filter(p => {
            // 1. Filtro General (Search Bar) - Busca en Nombre, RIF o ID
            const term = searchTerm.toLowerCase();
            const matchGeneral = 
                p.nombre.toLowerCase().includes(term) ||
                (p.rif || "").toLowerCase().includes(term) ||
                p.id_proveedor.toString().includes(term);

            // 2. Filtros Específicos (Panel Avanzado)
            const matchTel = filters.telefono ? (p.telefono || "").includes(filters.telefono) : true;
            const matchCorreo = filters.correo ? (p.correo || "").toLowerCase().includes(filters.correo.toLowerCase()) : true;
            const matchDir = filters.direccion ? (p.direccion || "").toLowerCase().includes(filters.direccion.toLowerCase()) : true;

            return matchGeneral && matchTel && matchCorreo && matchDir;
        });
    }, [providers, searchTerm, filters]);

    const clearFilters = () => {
        setSearchTerm('');
        setFilters({ telefono: '', correo: '', direccion: '' });
    };

    // --- PDF Functions ---
    const exportarPDFLista = () => {
        const doc = new jsPDF();
        doc.setFontSize(14);
        doc.text("Listado de Proveedores", 14, 15);
        doc.setFontSize(10);
        doc.text(`Generado: ${new Date().toLocaleDateString()}`, 14, 22);
        
        const rows = filteredProviders.map(p => [
            p.id_proveedor,
            p.nombre,
            p.rif || "N/A",
            p.telefono || "-",
            p.correo || "-",
            p.direccion || "-"
        ]);

        autoTable(doc, {
            head: [["ID", "Nombre", "RIF", "Teléfono", "Correo", "Dirección"]],
            body: rows,
            startY: 30,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [30, 41, 59] }
        });
        doc.save("proveedores_filtrados.pdf");
    };

    const exportarFicha = (p) => {
        const doc = new jsPDF();
        doc.setFillColor(240, 240, 240);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setFontSize(16);
        doc.setTextColor(30, 30, 30);
        doc.text("Ficha de Proveedor", 14, 25);
        doc.setFontSize(10);
        doc.text("DIGRAS C.A.", 195, 25, { align: "right" });

        const bodyData = [
            ["ID Proveedor", `#${p.id_proveedor}`],
            ["Razón Social", p.nombre],
            ["RIF / Cédula", p.rif || "No registrado"],
            ["Teléfono", p.telefono || "No registrado"],
            ["Correo", p.correo || "No registrado"],
            ["Dirección", p.direccion || "No registrada"],
        ];

        autoTable(doc, {
            startY: 50,
            head: [['Campo', 'Valor']],
            body: bodyData,
            theme: 'grid',
            headStyles: { fillColor: [50, 50, 50] },
            columnStyles: { 0: { fontStyle: 'bold', width: 50 } }
        });
        doc.save(`proveedor_${p.id_proveedor}.pdf`);
    };

    return (
        <div style={styles.container}>
            <Toaster position="top-right" />
            
            {/* HEADER */}
            <div style={styles.header}>
                <div style={styles.titleGroup}>
                    <div style={styles.iconCircle}>
                        <IconTruck />
                    </div>
                    <div>
                        <h2 style={styles.title}>Gestión de Proveedores</h2>
                        <p style={styles.subtitle}>Directorio de socios comerciales y logística.</p>
                    </div>
                </div>

                <div style={{display:'flex', gap:'10px'}}>
                    <button onClick={exportarPDFLista} style={styles.btnSecondary} title="Descargar Lista PDF">
                        <IconPrint /> PDF Lista
                    </button>
                    {/* 🚨 BOTÓN ACTUALIZADO A NEGRO */}
                    <button onClick={() => setIsCreateModalOpen(true)} style={styles.createBtn}>
                        <IconPlus /> Nuevo Proveedor
                    </button>
                </div>
            </div>

            {/* CONTENIDO */}
            <div style={styles.content}>
                
                {/* TOOLBAR MEJORADO */}
                <div style={styles.toolbarContainer}>
                    <div style={styles.toolbarTop}>
                        <div style={styles.searchBox}>
                            <IconSearch />
                            <input 
                                type="text" 
                                placeholder="Buscar por Nombre, RIF o ID..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={styles.searchInput}
                            />
                        </div>
                        
                        <button 
                            onClick={() => setShowFilters(!showFilters)} 
                            style={{
                                ...styles.btnFilter,
                                backgroundColor: showFilters ? '#e0f2fe' : 'transparent',
                                borderColor: showFilters ? '#0284c7' : '#ddd',
                                color: showFilters ? '#0284c7' : '#64748b'
                            }}
                        >
                            <IconFilter /> Filtros Avanzados
                        </button>

                        {(searchTerm || filters.telefono || filters.correo || filters.direccion) && (
                            <button onClick={clearFilters} style={styles.btnClear}>
                                Limpiar <IconXSmall />
                            </button>
                        )}
                    </div>

                    {/* PANEL DE FILTROS AVANZADOS */}
                    {showFilters && (
                        <div style={styles.filterPanel}>
                            <div style={styles.filterGrid}>
                                <div>
                                    <label style={styles.filterLabel}>Teléfono</label>
                                    <input 
                                        style={styles.filterInput} 
                                        placeholder="Ej: 0414..." 
                                        value={filters.telefono}
                                        onChange={e => setFilters({...filters, telefono: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label style={styles.filterLabel}>Correo Electrónico</label>
                                    <input 
                                        style={styles.filterInput} 
                                        placeholder="Ej: gmail.com" 
                                        value={filters.correo}
                                        onChange={e => setFilters({...filters, correo: e.target.value})}
                                    />
                                </div>
                                <div style={{gridColumn: 'span 2'}}>
                                    <label style={styles.filterLabel}>Dirección</label>
                                    <input 
                                        style={styles.filterInput} 
                                        placeholder="Ej: Caracas, Zona Industrial..." 
                                        value={filters.direccion}
                                        onChange={e => setFilters({...filters, direccion: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}></th>
                                <th style={styles.th}>Nombre</th>
                                <th style={styles.th}>RIF</th>
                                <th style={styles.th}>Teléfono</th>
                                <th style={styles.th}>Correo</th>
                                <th style={styles.thAction}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" style={{padding:20, textAlign:'center'}}>Cargando...</td></tr>
                            ) : (
                                filteredProviders.map(prov => {
                                    const isExpanded = expandedId === prov.id_proveedor;
                                    return (
                                        <React.Fragment key={prov.id_proveedor}>
                                            <tr style={{...styles.tr, backgroundColor: isExpanded ? '#f8fafc' : 'transparent'}}>
                                                <td style={{...styles.td, cursor:'pointer', textAlign:'center', color:'#64748b'}} onClick={() => toggleRow(prov.id_proveedor)}>
                                                    {isExpanded ? <IconChevronUp /> : <IconChevronDown />}
                                                </td>
                                                <td style={{...styles.td, fontWeight:'600'}}>{prov.nombre}</td>
                                                <td style={styles.td}>{prov.rif || '-'}</td>
                                                <td style={styles.td}>{prov.telefono || '-'}</td>
                                                <td style={styles.td}>{prov.correo || '-'}</td>
                                                <td style={styles.tdAction}>
                                                    <button onClick={() => setProviderToEdit(prov)} style={styles.iconBtn} title="Editar">
                                                        <IconEdit />
                                                    </button>
                                                    <button onClick={() => setDeleteTargetId(prov.id_proveedor)} style={{...styles.iconBtn, color:'#dc2626'}} title="Eliminar">
                                                        <IconTrash />
                                                    </button>
                                                </td>
                                            </tr>
                                            
                                            {isExpanded && (
                                                <tr style={{backgroundColor: '#f8fafc'}}>
                                                    <td colSpan="6" style={{padding: '0 20px 20px 20px', borderBottom: '1px solid #e2e8f0'}}>
                                                        <div style={styles.detailBox}>
                                                            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}>
                                                                <h4 style={{margin:0, color:'#334155'}}>Detalles Adicionales</h4>
                                                                <button onClick={() => exportarFicha(prov)} style={styles.btnSmall}>
                                                                    <IconDownload /> Descargar Ficha PDF
                                                                </button>
                                                            </div>
                                                            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
                                                                <div>
                                                                    <strong style={{color:'#64748b', fontSize:'0.8rem'}}>Dirección:</strong>
                                                                    <p style={{margin:'4px 0', color:'#334155'}}>{prov.direccion || "No registrada"}</p>
                                                                </div>
                                                                <div>
                                                                    <strong style={{color:'#64748b', fontSize:'0.8rem'}}>ID Sistema:</strong>
                                                                    <p style={{margin:'4px 0', color:'#334155'}}>#{prov.id_proveedor}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    )
                                })
                            )}
                            {filteredProviders.length === 0 && !loading && (
                                <tr><td colSpan="6" style={{padding:20, textAlign:'center', color:'#888'}}>No se encontraron datos coincidentes.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODALES */}
            <div style={{ position: 'relative', zIndex: 20000 }}>
                <CreateProveedorModal 
                    isOpen={isCreateModalOpen} 
                    onClose={() => setIsCreateModalOpen(false)} 
                    onProveedorCreated={handleCreateSuccess} 
                />

                {providerToEdit && (
                    <EditProviderModal 
                        provider={providerToEdit}
                        onClose={() => setProviderToEdit(null)}
                        onSave={() => {
                            setProviderToEdit(null);
                            handleRefresh();
                            toast.success("Proveedor actualizado");
                        }}
                    />
                )}

                {deleteTargetId && (
                    <div style={styles.modalOverlay}>
                        <div style={styles.confirmModal}>
                            <div style={{marginBottom: 15, display:'flex', flexDirection:'column', alignItems:'center'}}>
                                <div style={{background:'#fee2e2', padding:10, borderRadius:'50%', marginBottom:10}}>
                                    <IconAlert />
                                </div>
                                <h3 style={{margin:0, color:'#1e293b'}}>¿Eliminar Proveedor?</h3>
                            </div>
                            <p style={{textAlign:'center', color:'#64748b', fontSize:'0.9rem', marginBottom:20}}>
                                Esta acción eliminará al proveedor <strong>#{deleteTargetId}</strong> permanentemente.
                            </p>
                            <div style={{display:'flex', gap:10, justifyContent:'center'}}>
                                <button onClick={() => setDeleteTargetId(null)} style={styles.btnCancel} disabled={isDeleting}>Cancelar</button>
                                <button onClick={confirmDelete} style={styles.btnDelete} disabled={isDeleting}>
                                    {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- ESTILOS ---
const styles = {
    container: { padding: '20px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    titleGroup: { display: 'flex', alignItems: 'center', gap: '15px' },
    iconCircle: { width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    title: { margin: 0, fontSize: '1.5rem', color: '#333' },
    subtitle: { margin: 0, color: '#666', fontSize: '0.9rem' },
    
    // 🚨 ESTILO BOTÓN NUEVO (NEGRO PARA UNIFICAR)
    createBtn: { 
        backgroundColor: '#0f172a', // Negro/Slate oscuro
        color: 'white', 
        border: 'none', 
        padding: '10px 20px', 
        borderRadius: '10px', 
        cursor: 'pointer', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        fontSize: '0.9rem',
        fontWeight: '600',
        transition: 'background 0.2s',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    },
    btnSecondary: { backgroundColor: '#fff', color: '#333', border: '1px solid #ddd', padding: '10px 20px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },

    content: { backgroundColor: 'white', borderRadius: '8px', padding: '0', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', overflow:'hidden' },
    
    // Toolbar Mejorado
    toolbarContainer: { padding: '20px', borderBottom: '1px solid #eee' },
    toolbarTop: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap:'wrap' },
    searchBox: { display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '8px', padding: '8px 12px', width: '320px', gap:'10px', color:'#888' },
    searchInput: { border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem' },
    
    btnFilter: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight:'500' },
    btnClear: { display: 'flex', alignItems: 'center', gap: '4px', padding: '8px', background:'none', border:'none', color:'#dc2626', cursor:'pointer', fontSize:'0.85rem', marginLeft:'auto' },

    // Panel Avanzado
    filterPanel: { marginTop: '15px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', animation: 'slideDown 0.2s ease-out' },
    filterGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '15px' },
    filterLabel: { display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '5px', textTransform: 'uppercase' },
    filterInput: { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' },

    tableWrapper: { overflowX: 'auto', padding: '0 20px 20px 20px' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' },
    th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #eee', color: '#555', fontWeight: '600' },
    thAction: { textAlign: 'center', padding: '12px', borderBottom: '2px solid #eee', color: '#555', fontWeight: '600' },
    tr: { borderBottom: '1px solid #f1f5f9' },
    td: { padding: '12px', verticalAlign: 'middle', color: '#333' },
    tdAction: { padding: '12px', textAlign: 'center', display: 'flex', gap: '10px', justifyContent: 'center' },
    
    iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#666' },

    detailBox: { backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '20px' },
    btnSmall: { display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', fontSize: '0.8rem', border: '1px solid #ddd', background: '#f9f9f9', borderRadius: '4px', cursor: 'pointer', color: '#333' },

    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 30000 },
    confirmModal: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' },
    btnDelete: { padding: '10px 20px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight:'600' },
    btnCancel: { padding: '10px 20px', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontWeight:'600' }
};

// Inyectar animación slideDown
const styleSheet = document.createElement("style");
styleSheet.innerText = `
    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
`;
document.head.appendChild(styleSheet);

export default ProviderDashboard;