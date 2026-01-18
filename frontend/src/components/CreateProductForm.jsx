// frontend/src/components/CreateProductForm.jsx

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const API_BASE = '/api/inventario';

// --- ICONOS ---
const IconClose = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const IconBox = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>;
const IconTag = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>;
const IconGrid = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
const IconSearch = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const IconPlus = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const IconArrowLeft = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>;
const IconSave = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>;
const IconEdit = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const IconPower = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>;
const IconWarning = () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;

export default function CreateProductForm({ isOpen, onClose, onUpdate }) {
    const [activeTab, setActiveTab] = useState('productos'); 
    const [viewMode, setViewMode] = useState('list'); 
    
    const [listData, setListData] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [marcasList, setMarcasList] = useState([]);
    const [categoriasList, setCategoriasList] = useState([]);
    const [formData, setFormData] = useState({});
    const [skuPreview, setSkuPreview] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null); 
    const [confirmData, setConfirmData] = useState(null); 

    const fetchAuxiliaries = useCallback(async () => {
        try {
            const [mRes, cRes] = await Promise.all([
                axios.get(`${API_BASE}/marcas/`),
                axios.get(`${API_BASE}/categorias/`)
            ]);
            setMarcasList(Array.isArray(mRes.data) ? mRes.data : mRes.data.results || []);
            setCategoriasList(Array.isArray(cRes.data) ? cRes.data : cRes.data.results || []);
        } catch (error) { console.error(error); }
    }, []);

    const fetchListData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/${activeTab}/`);
            setListData(Array.isArray(res.data) ? res.data : res.data.results || []);
        } catch (error) {
            toast.error("Error cargando datos.");
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        if (isOpen) {
            setViewMode('list');
            setSearch('');
            setEditingId(null);
            fetchListData();
            if (activeTab === 'productos') fetchAuxiliaries();
        }
    }, [isOpen, activeTab, fetchListData, fetchAuxiliaries]);

    useEffect(() => {
        if (activeTab === 'productos' && !editingId && formData.nombre) {
            const clean = formData.nombre.trim().replace(/\s+/g, '').toUpperCase();
            const initials = clean.substring(0, 2) || 'XX';
            setSkuPreview(`PRD-####-${initials}`);
        } else if (!editingId) {
            setSkuPreview('');
        }
    }, [formData.nombre, activeTab, editingId]);

    const handleSwitchToCreate = () => {
        setEditingId(null);
        // 🚨 Inicializamos peso_unidad
        setFormData(activeTab === 'productos' ? { precio_venta: 1.00, peso_unidad: 1.00, activo: true } : {});
        if (activeTab === 'productos' && marcasList.length === 0) fetchAuxiliaries();
        setViewMode('form');
    };

    const handleSwitchToEdit = (item) => {
        setEditingId(item.id_producto || item.id_marca || item.id_categoria || item.id);
        setFormData({ ...item });
        if (activeTab === 'productos') {
            setSkuPreview(item.sku);
            if (marcasList.length === 0) fetchAuxiliaries();
        }
        setViewMode('form');
    };

    const requestToggleActive = (item) => {
        if (activeTab !== 'productos') return;
        const nuevoEstado = !item.activo;
        setConfirmData({
            item: item,
            newState: nuevoEstado,
            action: nuevoEstado ? "activar" : "desactivar"
        });
        setViewMode('confirm'); 
    };

    const executeToggleActive = async () => {
        if (!confirmData) return;
        const { item, newState, action } = confirmData;
        setIsSubmitting(true);
        try {
            await axios.patch(`${API_BASE}/productos/${item.id_producto}/`, { activo: newState });
            toast.success(`Producto ${action === 'activar' ? 'activado' : 'desactivado'} correctamente`);
            fetchListData();
            onUpdate();
            setViewMode('list'); 
            setConfirmData(null);
        } catch (error) {
            const msg = error.response?.data?.error || `Error al ${action} el producto`;
            toast.error(msg); 
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            let endpoint = `${API_BASE}/${activeTab}/`;
            let payload = { ...formData };

            if (activeTab === 'productos' && (!payload.id_marca || !payload.id_categoria)) {
                toast.error("Marca y Categoría son obligatorias");
                setIsSubmitting(false);
                return;
            }

            if (editingId) {
                await axios.put(`${endpoint}${editingId}/`, payload);
                toast.success("Registro actualizado exitosamente");
            } else {
                await axios.post(endpoint, payload);
                toast.success("Registro creado exitosamente");
            }
            
            await fetchListData(); 
            if (activeTab === 'productos') onUpdate(); 
            if (activeTab !== 'productos') await fetchAuxiliaries();
            setViewMode('list');

        } catch (error) {
            const msg = error.response?.data ? JSON.stringify(error.response.data) : "Error al guardar";
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helpers
    const getMarcaName = (item) => {
        if (item.marca_nombre) return item.marca_nombre;
        const found = marcasList.find(m => m.id_marca === item.id_marca);
        return found ? found.nombre : '-';
    };
    const getCategoriaName = (item) => {
        if (item.categoria_nombre) return item.categoria_nombre;
        const found = categoriasList.find(c => c.id_categoria === item.id_categoria);
        return found ? found.nombre : '-';
    };

    const filteredList = listData.filter(item => {
        const term = search.toLowerCase();
        return (item.nombre || '').toLowerCase().includes(term) ||
               (item.sku || '').toLowerCase().includes(term) ||
               (item.descripcion || '').toLowerCase().includes(term);
    });

    if (!isOpen) return null;

    return (
        <div style={styles.overlay}>
            <Toaster position="top-center" containerStyle={{ zIndex: 99999 }} />
            <div style={styles.modal}>
                
                <div style={styles.header}>
                    <div style={styles.headerTop}>
                        <div style={styles.titleContainer}>
                            {(viewMode === 'form' || viewMode === 'confirm') && (
                                <button onClick={() => setViewMode('list')} style={styles.backBtn} title="Volver">
                                    <IconArrowLeft />
                                </button>
                            )}
                            <div>
                                <h3 style={styles.title}>
                                    {viewMode === 'list' ? 'Gestor de Catálogo' : 
                                     viewMode === 'confirm' ? 'Confirmación' :
                                     (editingId ? `Editar ${activeTab.slice(0,-1)}` : `Crear ${activeTab.slice(0,-1)}`)}
                                </h3>
                                <p style={styles.subtitle}>Administre sus productos y clasificaciones</p>
                            </div>
                        </div>
                        <button onClick={onClose} style={styles.closeBtn}><IconClose /></button>
                    </div>

                    {viewMode === 'list' && (
                        <div style={styles.tabContainer}>
                            <button onClick={() => setActiveTab('productos')} style={activeTab === 'productos' ? styles.tabActive : styles.tab}>
                                <IconBox /> Productos
                            </button>
                            <button onClick={() => setActiveTab('marcas')} style={activeTab === 'marcas' ? styles.tabActive : styles.tab}>
                                <IconTag /> Marcas
                            </button>
                            <button onClick={() => setActiveTab('categorias')} style={activeTab === 'categorias' ? styles.tabActive : styles.tab}>
                                <IconGrid /> Categorías
                            </button>
                        </div>
                    )}
                </div>

                <div style={styles.content}>
                    {viewMode === 'list' && (
                        <div style={styles.fadeIn}>
                            <div style={styles.toolbar}>
                                <div style={styles.searchWrapper}>
                                    <IconSearch />
                                    <input 
                                        style={styles.searchInput} 
                                        placeholder={`Buscar en ${activeTab}...`} 
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                    />
                                </div>
                                <button onClick={handleSwitchToCreate} style={styles.btnPrimary}>
                                    <IconPlus /> Crear Nuevo
                                </button>
                            </div>

                            <div style={styles.tableContainer}>
                                {loading ? (
                                    <div style={styles.loadingState}>Cargando datos...</div>
                                ) : filteredList.length === 0 ? (
                                    <div style={styles.emptyState}>No hay registros para mostrar.</div>
                                ) : (
                                    <table style={styles.table}>
                                        <thead>
                                            <tr>
                                                {activeTab === 'productos' ? (
                                                    <>
                                                        <th style={styles.th}>Producto / SKU</th>
                                                        <th style={styles.th}>Marca</th>
                                                        <th style={styles.th}>Categoría</th>
                                                        <th style={{...styles.th, textAlign:'right'}}>Precio</th>
                                                        <th style={{...styles.th, textAlign:'right'}}>Peso (Kg)</th> {/* 🚨 COLUMNA PESO */}
                                                        <th style={{...styles.th, textAlign:'center'}}>Estado</th>
                                                        <th style={{...styles.th, textAlign:'center'}}>Acciones</th>
                                                    </>
                                                ) : (
                                                    <>
                                                        <th style={styles.th}>ID</th>
                                                        <th style={styles.th}>Nombre</th>
                                                        <th style={styles.th}>Descripción</th>
                                                        <th style={{...styles.th, textAlign:'center'}}>Acciones</th>
                                                    </>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredList.map((item, i) => {
                                                const isActive = item.activo !== false; 
                                                const rowOpacity = isActive ? 1 : 0.5;

                                                return (
                                                    <tr key={i} style={{...styles.tr, opacity: rowOpacity}}>
                                                        {activeTab === 'productos' ? (
                                                            <>
                                                                <td style={styles.td}>
                                                                    <div style={styles.textBold}>{item.nombre}</div>
                                                                    <div style={styles.textSub}>{item.sku || 'S/N'}</div>
                                                                </td>
                                                                <td style={styles.td}><span style={styles.badge}>{getMarcaName(item)}</span></td>
                                                                <td style={styles.td}><span style={styles.badge}>{getCategoriaName(item)}</span></td>
                                                                <td style={{...styles.td, textAlign:'right', fontFamily:'monospace', fontWeight:'700'}}>${item.precio_venta}</td>
                                                                <td style={{...styles.td, textAlign:'right'}}>{item.peso_unidad}</td> {/* 🚨 DATO PESO */}
                                                                <td style={{...styles.td, textAlign:'center'}}>
                                                                    <span style={{
                                                                        fontSize:'0.7rem', fontWeight:'700', borderRadius:'10px', padding:'2px 8px',
                                                                        backgroundColor: isActive ? '#dcfce7' : '#fee2e2',
                                                                        color: isActive ? '#166534' : '#991b1b'
                                                                    }}>
                                                                        {isActive ? 'ACTIVO' : 'INACTIVO'}
                                                                    </span>
                                                                </td>
                                                                <td style={styles.tdAction}>
                                                                    <div style={{display:'flex', gap:'8px', justifyContent:'center'}}>
                                                                        <button onClick={() => handleSwitchToEdit(item)} style={styles.iconBtn} title="Editar">
                                                                            <IconEdit />
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => requestToggleActive(item)} 
                                                                            style={{...styles.iconBtn, color: isActive ? '#ef4444' : '#10b981'}} 
                                                                            title={isActive ? "Desactivar" : "Activar"}
                                                                        >
                                                                            <IconPower />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <td style={{...styles.td, color:'#94a3b8'}}>#{item.id_marca || item.id_categoria}</td>
                                                                <td style={{...styles.td, fontWeight:'600'}}>{item.nombre}</td>
                                                                <td style={styles.td}>{item.descripcion || <span style={{fontStyle:'italic', color:'#cbd5e1'}}>Sin descripción</span>}</td>
                                                                <td style={styles.tdAction}>
                                                                    <div style={{display:'flex', gap:'8px', justifyContent:'center'}}>
                                                                        <button onClick={() => handleSwitchToEdit(item)} style={styles.iconBtn} title="Editar">
                                                                            <IconEdit />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </>
                                                        )}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}

                    {viewMode === 'form' && (
                        <form onSubmit={handleSave} style={styles.fadeIn}>
                            <div style={styles.formContainer}>
                                {activeTab === 'productos' && (
                                    <>
                                        <div style={styles.formSectionTitle}>Información Básica</div>
                                        <div style={styles.grid}>
                                            <div style={{gridColumn:'span 2'}}>
                                                <label style={styles.label}>Nombre del Producto</label>
                                                <input style={styles.input} required value={formData.nombre || ''} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej: Harina Pan" />
                                            </div>
                                            <div>
                                                <label style={styles.label}>SKU (Automático)</label>
                                                <input style={{...styles.input, background:'#f8fafc', color:'#64748b'}} value={editingId ? formData.sku : skuPreview} disabled />
                                            </div>
                                            <div>
                                                <label style={styles.label}>Precio Venta ($)</label>
                                                <input type="number" step="0.01" style={styles.input} required value={formData.precio_venta || ''} onChange={e => setFormData({...formData, precio_venta: e.target.value})} />
                                            </div>
                                            
                                            {/* 🚨 INPUT PESO UNITARIO */}
                                            <div>
                                                <label style={styles.label}>Peso Unidad (Kg)</label>
                                                <input type="number" step="0.01" style={styles.input} required value={formData.peso_unidad || ''} onChange={e => setFormData({...formData, peso_unidad: e.target.value})} placeholder="Ej: 1.00" />
                                            </div>
                                        </div>

                                        <div style={styles.formSectionTitle}>Clasificación</div>
                                        <div style={styles.grid}>
                                            <div>
                                                <label style={styles.label}>Marca</label>
                                                <select style={styles.select} value={formData.id_marca || ''} onChange={e => setFormData({...formData, id_marca: e.target.value})} required>
                                                    <option value="">Seleccione Marca...</option>
                                                    {marcasList.map(m => <option key={m.id_marca} value={m.id_marca}>{m.nombre}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label style={styles.label}>Categoría</label>
                                                <select style={styles.select} value={formData.id_categoria || ''} onChange={e => setFormData({...formData, id_categoria: e.target.value})} required>
                                                    <option value="">Seleccione Categoría...</option>
                                                    {categoriasList.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {(activeTab === 'marcas' || activeTab === 'categorias') && (
                                    <div style={styles.grid}>
                                        <div style={{gridColumn:'span 2'}}>
                                            <label style={styles.label}>Nombre {activeTab.slice(0,-1)}</label>
                                            <input style={styles.input} required value={formData.nombre || ''} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                                        </div>
                                        <div style={{gridColumn:'span 2'}}>
                                            <label style={styles.label}>Descripción</label>
                                            <textarea 
                                                style={styles.textarea} 
                                                value={formData.descripcion || ''} 
                                                onChange={e => setFormData({...formData, descripcion: e.target.value})} 
                                                placeholder={`Detalles...`} 
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={styles.footer}>
                                <button type="button" onClick={() => setViewMode('list')} style={styles.btnGhost}>Cancelar</button>
                                <button type="submit" style={styles.btnPrimary} disabled={isSubmitting}>
                                    <IconSave /> {isSubmitting ? 'Guardando...' : (editingId ? 'Actualizar' : 'Guardar')}
                                </button>
                            </div>
                        </form>
                    )}

                    {viewMode === 'confirm' && confirmData && (
                        <div style={styles.confirmContainer}>
                            <div style={styles.confirmIcon}><IconWarning /></div>
                            <h3 style={styles.confirmTitle}>
                                ¿Estás seguro de {confirmData.action} este producto?
                            </h3>
                            <p style={styles.confirmText}>
                                Producto: <strong>{confirmData.item.nombre}</strong>
                                <br/>
                                {confirmData.action === 'desactivar' 
                                    ? "No podrá ser utilizado en nuevas compras ni ventas hasta que sea reactivado."
                                    : "El producto volverá a estar disponible para operaciones."}
                            </p>
                            
                            <div style={styles.confirmActions}>
                                <button onClick={() => { setViewMode('list'); setConfirmData(null); }} style={styles.btnGhost}>
                                    Cancelar
                                </button>
                                <button 
                                    onClick={executeToggleActive} 
                                    style={{
                                        ...styles.btnPrimary, 
                                        backgroundColor: confirmData.action === 'desactivar' ? '#ef4444' : '#10b981',
                                        boxShadow: 'none'
                                    }}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Procesando...' : `Sí, ${confirmData.action.toUpperCase()}`}
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

// --- ESTILOS PREMIUM ---
const styles = {
    overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 20000 },
    modal: { backgroundColor: '#ffffff', width: '1000px', maxWidth: '95vw', height: '85vh', borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.1)' },
    
    header: { backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '0' },
    headerTop: { padding: '24px 30px 10px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'start' },
    titleContainer: { display: 'flex', alignItems: 'center', gap: '15px' },
    title: { margin: 0, fontSize: '1.5rem', color: '#0f172a', fontWeight: '800', letterSpacing: '-0.5px' },
    subtitle: { margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' },
    closeBtn: { background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#64748b', padding:'8px', borderRadius:'50%', transition: 'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center' },
    backBtn: { background: '#e2e8f0', border: 'none', cursor: 'pointer', color: '#475569', borderRadius:'50%', padding:'8px', display:'flex', marginRight:'10px', transition: 'all 0.2s' },

    tabContainer: { display: 'flex', gap: '30px', padding: '0 30px', marginTop:'10px' },
    tab: { padding: '15px 0', border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', borderBottom: '3px solid transparent', display: 'flex', alignItems: 'center', gap: '8px', fontSize:'0.95rem', fontWeight:'600', transition: 'all 0.2s' },
    tabActive: { padding: '15px 0', border: 'none', background: 'transparent', cursor: 'pointer', color: '#0f172a', borderBottom: '3px solid #0f172a', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', fontSize:'0.95rem' },

    content: { flex: 1, backgroundColor: '#f8fafc', padding: '30px', overflowY: 'auto' },
    fadeIn: { animation: 'fadeIn 0.3s ease-out' },

    toolbar: { display: 'flex', gap: '15px', marginBottom: '25px' },
    searchWrapper: { flex: 1, position: 'relative', display: 'flex', alignItems: 'center', color:'#94a3b8', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
    searchInput: { width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', border: 'none', fontSize: '0.95rem', outline: 'none', background:'transparent' },
    btnPrimary: { padding: '12px 24px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', boxShadow: '0 4px 10px rgba(15, 23, 42, 0.2)', transition: 'transform 0.1s' },
    
    listContainer: { backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' },
    th: { textAlign: 'left', padding: '16px 20px', background: '#f8fafc', color: '#475569', fontWeight: '700', borderBottom: '1px solid #e2e8f0', fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:'0.05em' },
    td: { padding: '16px 20px', borderBottom: '1px solid #f1f5f9', color: '#334155', verticalAlign: 'middle' },
    tdAction: { padding: '16px 20px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle', textAlign:'center' },
    tr: { transition: 'background 0.1s', cursor: 'default', ':hover': { backgroundColor: '#f8fafc' } },
    
    textBold: { fontWeight: '700', color: '#0f172a', marginBottom: '2px' },
    textSub: { fontSize: '0.8rem', color: '#64748b', fontFamily: 'monospace' },
    badge: { display: 'inline-block', backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', color: '#475569', fontWeight: '600', border: '1px solid #e2e8f0' },
    iconBtn: { border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', padding: '6px', borderRadius: '6px', transition: 'background 0.2s', ':hover': { backgroundColor: '#e2e8f0' } },

    formContainer: { backgroundColor: '#fff', padding: '30px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', maxWidth: '700px', margin: '0 auto' },
    formSectionTitle: { fontSize: '0.85rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '15px', marginTop: '10px' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' },
    label: { display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '8px' },
    input: { width: '100%', height: '45px', padding: '0 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', transition: 'border 0.2s', ':focus': { borderColor: '#0f172a' } },
    select: { width: '100%', height: '45px', padding: '0 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', backgroundColor:'white', boxSizing: 'border-box' },
    textarea: { width: '100%', height: '100px', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' },

    footer: { marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '15px', maxWidth: '700px', margin: '30px auto 0 auto' },
    btnGhost: { padding: '12px 24px', backgroundColor: 'transparent', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem' },

    // Confirm UI
    confirmContainer: { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', animation: 'fadeIn 0.3s ease-out' },
    confirmIcon: { marginBottom:'20px', padding:'20px', borderRadius:'50%', background:'#fffbeb' },
    confirmTitle: { fontSize: '1.3rem', fontWeight:'800', color: '#0f172a', marginBottom:'10px' },
    confirmText: { color:'#64748b', maxWidth:'400px', textAlign:'center', lineHeight:'1.5', marginBottom:'30px' },
    confirmActions: { display:'flex', gap:'15px' },

    loadingState: { padding: '60px', textAlign: 'center', color: '#64748b', fontSize: '1.1rem' },
    emptyState: { padding: '60px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }
};

const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
`;
document.head.appendChild(styleSheet);