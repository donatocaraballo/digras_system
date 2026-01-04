// frontend/src/components/CreateProductForm.jsx

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import CreateMarcaModal from './CreateMarcaModal';
import CreateCategoriaModal from './CreateCategoriaModal';

const PRODUCTOS_URL = '/api/inventario/productos/';
const MARCAS_URL = '/api/inventario/marcas/';
const CATEGORIAS_URL = '/api/inventario/categorias/';

// --- ICONOS SVG ---
const IconClose = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const IconPlus = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;

function CreateProductForm({ isOpen, onClose, onUpdate }) {
    // Estados
    const [name, setName] = useState('');
    const [sku, setSku] = useState(''); // Solo visual
    const [price, setPrice] = useState(1.00);
    const [marcaId, setMarcaId] = useState('');
    const [categoriaId, setCategoriaId] = useState('');
    
    // Control
    const [marcas, setMarcas] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [status, setStatus] = useState('');
    const [isMarcaModalOpen, setIsMarcaModalOpen] = useState(false);
    const [isCategoriaModalOpen, setIsCategoriaModalOpen] = useState(false);
    const [isLoadingOptions, setIsLoadingOptions] = useState(true);
    const [optionsKey, setOptionsKey] = useState(0);

    // --- LÓGICA VISUAL: SKU PREVIEW (PRD-####-XX) ---
    useEffect(() => {
        if (name) {
            const cleanName = name.trim().replace(/\s+/g, '').toUpperCase();
            const initials = cleanName.substring(0, 2) || 'XX';
            setSku(`PRD-####-${initials}`);
        } else {
            setSku('');
        }
    }, [name]);

    // --- Carga de Opciones ---
    const fetchOptions = useCallback(async () => {
        if (!isOpen) return;
        setIsLoadingOptions(true);
        try {
            const [marcasRes, categoriasRes] = await Promise.all([
                axios.get(MARCAS_URL),
                axios.get(CATEGORIAS_URL)
            ]);
            setMarcas(marcasRes.data);
            setCategorias(categoriasRes.data);

            if (marcasRes.data.length > 0 && !marcaId) setMarcaId(marcasRes.data[0].id_marca);
            if (categoriasRes.data.length > 0 && !categoriaId) setCategoriaId(categoriasRes.data[0].id_categoria);
        } catch (error) {
            setStatus('❌ Error cargando datos.');
        } finally {
            setIsLoadingOptions(false);
        }
    }, [isOpen, optionsKey, marcaId, categoriaId]);

    useEffect(() => {
        fetchOptions();
    }, [fetchOptions]);

    // Handlers
    const handleMarcaCreated = (newId) => {
        setOptionsKey(prev => prev + 1);
        setMarcaId(newId);
        setIsMarcaModalOpen(false);
    };
    const handleCategoriaCreated = (newId) => {
        setOptionsKey(prev => prev + 1);
        setCategoriaId(newId);
        setIsCategoriaModalOpen(false);
    };

    // --- Submit ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('Guardando...');
        try {
            const productData = {
                nombre: name,
                precio_venta: parseFloat(price),
                peso_unidad: 0.10,
                id_marca: parseInt(marcaId), 
                id_categoria: parseInt(categoriaId) 
            };
            
            const response = await axios.post(PRODUCTOS_URL, productData);
            
            setStatus(`✅ Creado: ${response.data.sku}`);
            
            setName(''); setSku(''); setPrice(1.00);
            onUpdate(); 
            setTimeout(onClose, 1500);
            
        } catch (error) {
            const errMsg = error.response ? JSON.stringify(error.response.data) : error.message;
            setStatus('❌ Error: ' + errMsg);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={styles.modalOverlay}>
            <div style={styles.modal}>
                
                {/* Header */}
                <div style={styles.header}>
                    <div>
                        <h3 style={styles.title}>Nuevo Producto</h3>
                        <p style={styles.subtitle}>Complete la información del inventario.</p>
                    </div>
                    <button onClick={onClose} style={styles.closeBtn}><IconClose /></button>
                </div>

                <form onSubmit={handleSubmit} style={styles.formContent}>
                    
                    {/* Nombre */}
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Nombre del Producto</label>
                        <input 
                            type="text" 
                            placeholder="Ej: Jamón Planchado" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            required 
                            style={styles.input} 
                        />
                    </div>
                    
                    {/* Grid SKU y Precio */}
                    <div style={styles.row}>
                        <div style={{flex: 1}}>
                            <label style={styles.label}>SKU (Automático)</label>
                            <input 
                                type="text" 
                                value={sku} 
                                readOnly 
                                disabled
                                placeholder="Generado..."
                                style={{...styles.input, backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'not-allowed'}} 
                            />
                        </div>
                        <div style={{flex: 1}}>
                            <label style={styles.label}>Precio Venta ($)</label>
                            <input 
                                type="number" 
                                value={price} 
                                onChange={(e) => setPrice(e.target.value)} 
                                required 
                                min="0.01" 
                                step="0.01" 
                                style={styles.input} 
                            />
                        </div>
                    </div>

                    {/* Marca con botón añadir */}
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Marca</label>
                        <div style={styles.inputWithAction}>
                            <select value={marcaId} onChange={(e) => setMarcaId(parseInt(e.target.value))} required style={styles.select}>
                                {marcas.map(m => (<option key={m.id_marca} value={m.id_marca}>{m.nombre}</option>))}
                            </select>
                            <button type="button" onClick={() => setIsMarcaModalOpen(true)} style={styles.btnSmallAction} title="Nueva Marca">
                                <IconPlus />
                            </button>
                        </div>
                    </div>
                    
                    {/* Categoria con botón añadir */}
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Categoría</label>
                        <div style={styles.inputWithAction}>
                            <select value={categoriaId} onChange={(e) => setCategoriaId(parseInt(e.target.value))} required style={styles.select}>
                                {categorias.map(c => (<option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>))}
                            </select>
                            <button type="button" onClick={() => setIsCategoriaModalOpen(true)} style={styles.btnSmallAction} title="Nueva Categoría">
                                <IconPlus />
                            </button>
                        </div>
                    </div>

                    {/* Status Message */}
                    {status && (
                        <div style={{
                            marginTop: '10px', 
                            padding: '10px', 
                            borderRadius: '8px', 
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            backgroundColor: status.includes('❌') ? '#fee2e2' : '#dcfce7',
                            color: status.includes('❌') ? '#991b1b' : '#166534'
                        }}>
                            {status}
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div style={styles.footer}>
                        <button type="button" onClick={onClose} style={styles.btnGhost}>Cancelar</button>
                        <button type="submit" style={styles.btnPrimary} disabled={marcas.length === 0 || categorias.length === 0}>
                            Crear Producto
                        </button>
                    </div>
                </form>
            </div>

            <CreateMarcaModal isOpen={isMarcaModalOpen} onClose={() => setIsMarcaModalOpen(false)} onMarcaCreated={handleMarcaCreated} />
            <CreateCategoriaModal isOpen={isCategoriaModalOpen} onClose={() => setIsCategoriaModalOpen(false)} onCategoriaCreated={handleCategoriaCreated} />
        </div>
    );
}

// --- ESTILOS PREMIUM UNIFICADOS ---
const styles = {
    modalOverlay: { 
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
        backgroundColor: 'rgba(15, 23, 42, 0.45)', 
        backdropFilter: 'blur(4px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center', 
        zIndex: 20000 // Z-Index alto como solicitaste
    },
    modal: { 
        backgroundColor: '#ffffff', 
        width: '100%', maxWidth: '500px', 
        borderRadius: '16px', 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', 
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid #e2e8f0'
    },
    header: { 
        padding: '20px 24px', 
        backgroundColor: '#f8fafc', 
        borderBottom: '1px solid #e2e8f0', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' 
    },
    title: { margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' },
    subtitle: { margin: '4px 0 0', fontSize: '0.875rem', color: '#64748b' },
    closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' },
    
    formContent: { padding: '24px' },
    formGroup: { marginBottom: '16px' },
    row: { display: 'flex', gap: '16px', marginBottom: '16px' },
    
    label: { display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' },
    input: { width: '100%', height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', backgroundColor: '#fff', boxSizing: 'border-box' },
    select: { width: '100%', height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', backgroundColor: '#fff', boxSizing: 'border-box' },
    
    inputWithAction: { display: 'flex', gap: '8px' },
    btnSmallAction: { 
        width: '40px', height: '40px', 
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', 
        borderRadius: '8px', cursor: 'pointer' 
    },
    
    footer: { 
        marginTop: '24px', 
        paddingTop: '20px', 
        borderTop: '1px solid #f1f5f9', 
        display: 'flex', justifyContent: 'flex-end', gap: '12px' 
    },
    
    btnPrimary: { 
        padding: '10px 20px', backgroundColor: '#0f172a', color: 'white', 
        border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' 
    },
    btnGhost: { 
        padding: '10px 20px', backgroundColor: 'transparent', color: '#64748b', 
        border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' 
    }
};

export default CreateProductForm;