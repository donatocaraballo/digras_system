// frontend/src/components/CreateProductForm.jsx

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import CreateMarcaModal from './CreateMarcaModal';
import CreateCategoriaModal from './CreateCategoriaModal';

const PRODUCTOS_URL = '/api/inventario/productos/';
const MARCAS_URL = '/api/inventario/marcas/';
const CATEGORIAS_URL = '/api/inventario/categorias/';

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
            // Mostramos #### para indicar que el sistema pondrá el número (ej: 0001)
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
                // NO enviamos SKU, el backend pone el contador (0001, 0002...)
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
        <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
                <button type="button" onClick={onClose} style={closeButtonStyle}>X</button>

                <form onSubmit={handleSubmit}>
                    <h3 style={{ marginTop: 0 }}>⭐ Nuevo Producto (Admin)</h3>
                    
                    <label style={labelStyle}>Nombre:</label>
                    <input type="text" placeholder="Ej: Jamón Planchado" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
                    
                    <div style={{display: 'flex', gap: '10px'}}>
                        <div style={{flex: 1}}>
                            <label style={labelStyle}>SKU (Automático):</label>
                            <input 
                                type="text" 
                                value={sku} 
                                readOnly 
                                disabled
                                placeholder="Se genera al guardar..."
                                style={{...inputStyle, backgroundColor: '#e9ecef', color: '#555', fontWeight: 'bold', cursor: 'not-allowed'}} 
                            />
                        </div>
                        <div style={{flex: 1}}>
                            <label style={labelStyle}>Precio Venta:</label>
                            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required min="0.01" step="0.01" style={inputStyle} />
                        </div>
                    </div>

                    <div style={selectGroupStyle}>
                        <select value={marcaId} onChange={(e) => setMarcaId(parseInt(e.target.value))} required style={selectStyle}>
                            {marcas.map(m => (<option key={m.id_marca} value={m.id_marca}>{m.nombre}</option>))}
                        </select>
                        <button type="button" onClick={() => setIsMarcaModalOpen(true)} style={createButtonStyle}>+ Marca</button>
                    </div>
                    
                    <div style={selectGroupStyle}>
                        <select value={categoriaId} onChange={(e) => setCategoriaId(parseInt(e.target.value))} required style={selectStyle}>
                            {categorias.map(c => (<option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>))}
                        </select>
                        <button type="button" onClick={() => setIsCategoriaModalOpen(true)} style={createButtonStyle}>+ Categ</button>
                    </div>

                    <button type="submit" style={submitButtonStyle} disabled={marcas.length === 0 || categorias.length === 0}>
                        Crear Producto
                    </button>
                    
                    {status && <p style={{ marginTop: '10px', color: status.includes('❌') ? 'red' : 'green', fontWeight: 'bold' }}>{status}</p>}
                </form>
            </div>

            <CreateMarcaModal isOpen={isMarcaModalOpen} onClose={() => setIsMarcaModalOpen(false)} onMarcaCreated={handleMarcaCreated} />
            <CreateCategoriaModal isOpen={isCategoriaModalOpen} onClose={() => setIsCategoriaModalOpen(false)} onCategoriaCreated={handleCategoriaCreated} />
        </div>
    );
}

// Estilos
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContentStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '500px', position: 'relative', maxHeight: '90vh', overflowY: 'auto', border: '1px solid #ccc', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' };
const closeButtonStyle = { position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', fontSize: '1.2em', cursor: 'pointer', color: '#333', fontWeight: 'bold' };
const inputStyle = { width: '100%', padding: '10px', margin: '5px 0 15px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' };
const labelStyle = { display: 'block', fontSize: '0.85em', fontWeight: 'bold', color: '#555', marginBottom: '3px' };
const selectGroupStyle = { display: 'flex', alignItems: 'center', marginBottom: '15px' };
const selectStyle = { padding: '10px', flexGrow: 1, marginRight: '10px', border: '1px solid #ccc', borderRadius: '4px' };
const createButtonStyle = { padding: '10px 15px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' };
const submitButtonStyle = { padding: '12px 15px', backgroundColor: '#009688', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%', marginTop: '10px', fontWeight: 'bold', fontSize: '1.05em' };

export default CreateProductForm;