// frontend/src/components/CreateProductModal.jsx

import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import CreateMarcaModal from './CreateMarcaModal';
import CreateCategoriaModal from './CreateCategoriaModal';

const PRODUCTOS_URL = '/api/inventario/productos/';
const MARCAS_URL = '/api/inventario/marcas/';
const CATEGORIAS_URL = '/api/inventario/categorias/';

// Iconos
const IconBox = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>;
const IconClose = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const IconPlus = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;

function CreateProductModal({ isOpen, onClose, onProductCreated, existingProducts = [] }) {
    const [name, setName] = useState('');
    const [sku, setSku] = useState('');
    const [price, setPrice] = useState('');
    const [weight, setWeight] = useState(''); 
    const [marcaId, setMarcaId] = useState('');
    const [categoriaId, setCategoriaId] = useState('');
    
    const [marcas, setMarcas] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [isMarcaModalOpen, setIsMarcaModalOpen] = useState(false);
    const [isCategoriaModalOpen, setIsCategoriaModalOpen] = useState(false);
    const [optionsKey, setOptionsKey] = useState(0);

    useEffect(() => {
        if (name) {
            const cleanName = name.trim().replace(/\s+/g, '').toUpperCase();
            const initials = cleanName.substring(0, 2) || 'XX';
            setSku(`PRD-####-${initials}`);
        } else {
            setSku('');
        }
    }, [name]);

    const fetchOptions = useCallback(async () => {
        if (!isOpen) return;
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
            console.error("Error options:", error);
            toast.error("Error cargando catálogos");
        }
    }, [isOpen, optionsKey, marcaId, categoriaId]);

    useEffect(() => {
        if (isOpen) {
            setName(''); setPrice(''); setWeight(''); setSku('');
            fetchOptions();
        }
    }, [isOpen, fetchOptions]);

    const handleMarcaCreated = (newId) => { setOptionsKey(p => p+1); setMarcaId(newId); setIsMarcaModalOpen(false); };
    const handleCategoriaCreated = (newId) => { setOptionsKey(p => p+1); setCategoriaId(newId); setIsCategoriaModalOpen(false); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!name || !marcaId || !categoriaId || !price || !weight) {
            return toast.error("Todos los campos son obligatorios.");
        }

        // VALIDACIÓN DUPLICADOS
        const nombreInput = name.trim().toLowerCase();
        const marcaInput = parseInt(marcaId);
        const pesoInput = parseFloat(weight).toFixed(2);

        const duplicado = existingProducts.some(p => {
            const nombreExistente = p.nombre.toLowerCase();
            const idMarcaExistente = typeof p.id_marca === 'object' ? p.id_marca.id_marca : p.id_marca;
            const pesoExistente = parseFloat(p.peso_unidad || 0).toFixed(2);

            return (nombreExistente === nombreInput) && 
                   (Number(idMarcaExistente) === marcaInput) && 
                   (pesoExistente === pesoInput);
        });

        if (duplicado) {
            const marcaNombre = marcas.find(m => m.id_marca === marcaInput)?.nombre || "seleccionada";
            return toast.error(`Producto duplicado: "${name}" (${marcaNombre}, ${weight}kg).`);
        }

        setIsSubmitting(true);
        const loadingToast = toast.loading('Guardando producto...');

        try {
            const productData = {
                nombre: name,
                precio_venta: parseFloat(price),
                peso_unidad: parseFloat(weight),
                id_marca: parseInt(marcaId),
                id_categoria: parseInt(categoriaId),
                activo: true
            };
            
            const response = await axios.post(PRODUCTOS_URL, productData);
            
            toast.dismiss(loadingToast);
            toast.success(`Producto creado: ${response.data.sku}`);
            onProductCreated(response.data.id_producto); 
            setName(''); setSku(''); setPrice(''); setWeight('');
            setTimeout(onClose, 1000);

        } catch (error) {
            toast.dismiss(loadingToast);
            const msg = error.response ? JSON.stringify(error.response.data) : error.message;
            toast.error('Error: ' + msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                        <div style={styles.iconBox}><IconBox /></div>
                        <div>
                            <h3 style={styles.title}>Nuevo Producto</h3>
                            <p style={styles.subtitle}>Añadir ítem al catálogo.</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} style={styles.closeBtn}><IconClose /></button>
                </div>

                <form onSubmit={handleSubmit} style={styles.formContent}>
                    <div style={styles.formGrid}>
                        <div style={{gridColumn: 'span 2'}}>
                            <label style={styles.label}>Nombre del Producto</label>
                            <input 
                                type="text" 
                                placeholder="Ej: Arroz Mary Tradicional" 
                                value={name} 
                                onChange={e => setName(e.target.value)} 
                                required 
                                style={styles.input} 
                                autoFocus
                            />
                        </div>
                        <div>
                            <label style={styles.label}>SKU (Auto)</label>
                            <input 
                                type="text" 
                                value={sku} 
                                readOnly 
                                disabled 
                                style={{...styles.input, backgroundColor: '#f8fafc', color: '#64748b', fontWeight:'bold'}} 
                            />
                        </div>
                        <div>
                            <label style={styles.label}>Precio Venta ($)</label>
                            <input 
                                type="number" 
                                value={price} 
                                onChange={e => setPrice(e.target.value)} 
                                required 
                                step="0.01" 
                                style={styles.input} 
                                placeholder="0.00"
                            />
                        </div>
                        <div style={{gridColumn: 'span 2'}}>
                            <label style={styles.label}>Peso Unidad (Kg) <span style={{color:'red'}}>*</span></label>
                            <input 
                                type="number" 
                                step="0.01" 
                                style={styles.input} 
                                required 
                                value={weight} 
                                onChange={e => setWeight(e.target.value)} 
                                placeholder="Ej: 1.00" 
                            />
                            <p style={{fontSize:'0.7rem', color:'#64748b', margin:'2px 0 0'}}>Esencial para diferenciar presentaciones.</p>
                        </div>
                        <div>
                            <label style={styles.label}>Marca</label>
                            <div style={{display:'flex', gap:'8px'}}>
                                <select value={marcaId} onChange={e => setMarcaId(e.target.value)} style={styles.select}>
                                    {marcas.map(m => <option key={m.id_marca} value={m.id_marca}>{m.nombre}</option>)}
                                </select>
                                <button type="button" onClick={() => setIsMarcaModalOpen(true)} style={styles.btnSmall} title="Nueva Marca"><IconPlus /></button>
                            </div>
                        </div>
                        <div>
                            <label style={styles.label}>Categoría</label>
                            <div style={{display:'flex', gap:'8px'}}>
                                <select value={categoriaId} onChange={e => setCategoriaId(e.target.value)} style={styles.select}>
                                    {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
                                </select>
                                <button type="button" onClick={() => setIsCategoriaModalOpen(true)} style={styles.btnSmall} title="Nueva Categoría"><IconPlus /></button>
                            </div>
                        </div>
                    </div>

                    <div style={styles.footer}>
                        <button type="button" onClick={onClose} style={styles.btnCancel} disabled={isSubmitting}>Cancelar</button>
                        <button type="submit" style={styles.btnSubmit} disabled={isSubmitting}>
                            {isSubmitting ? 'Guardando...' : 'Crear Producto'}
                        </button>
                    </div>
                </form>
            </div>
            <CreateMarcaModal isOpen={isMarcaModalOpen} onClose={() => setIsMarcaModalOpen(false)} onMarcaCreated={handleMarcaCreated} />
            <CreateCategoriaModal isOpen={isCategoriaModalOpen} onClose={() => setIsCategoriaModalOpen(false)} onCategoriaCreated={handleCategoriaCreated} />
        </div>,
        document.body
    );
}

const styles = {
    overlay: {
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(10px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999,
        animation: 'fadeIn 0.2s ease-out'
    },
    modal: {
        backgroundColor: '#ffffff', width: '550px', maxHeight: '90vh',
        borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)', position: 'relative'
    },
    header: {
        padding: '24px 30px', borderBottom: '1px solid #e2e8f0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        backgroundColor: '#f8fafc'
    },
    iconBox: {
        width: '42px', height: '42px', borderRadius: '12px', background: '#e0f2fe',
        color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center'
    },
    title: { margin: 0, fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px' },
    subtitle: { margin: '4px 0 0', fontSize: '0.9rem', color: '#64748b' },
    closeBtn: {
        background: '#fff', border: '1px solid #e2e8f0', cursor: 'pointer',
        color: '#64748b', padding: '6px', borderRadius: '50%',
        transition: 'all 0.2s', display: 'flex', alignItems: 'center',
        boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
    },
    formContent: { padding: '30px', overflowY: 'auto' },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
    label: { display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px', textTransform:'uppercase', letterSpacing:'0.5px' },
    input: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem', color: '#1e293b', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box', backgroundColor: '#fff' },
    select: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem', color: '#1e293b', outline: 'none', backgroundColor:'#fff', cursor:'pointer', boxSizing: 'border-box' },
    btnSmall: { padding: '0 14px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' },
    footer: { padding: '24px 30px', backgroundColor: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '15px' },
    btnCancel: { padding: '12px 24px', border: 'none', backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', transition: 'background 0.2s' },
    btnSubmit: { padding: '12px 24px', border: 'none', backgroundColor: '#0f172a', color: '#fff', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.3)', transition: 'transform 0.1s' }
};

const styleSheet = document.createElement("style");
styleSheet.innerText = `
    @keyframes fadeIn { from { opacity:0; transform:scale(0.98); } to { opacity:1; transform:scale(1); } }
    input:focus, select:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1) !important; }
    button:active { transform: scale(0.98); }
`;
document.head.appendChild(styleSheet);

export default CreateProductModal;