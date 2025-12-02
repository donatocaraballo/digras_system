// frontend/src/components/CreateProductModal.jsx

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import CreateMarcaModal from './CreateMarcaModal';
import CreateCategoriaModal from './CreateCategoriaModal';

const PRODUCTOS_URL = '/api/inventario/productos/';
const MARCAS_URL = '/api/inventario/marcas/';
const CATEGORIAS_URL = '/api/inventario/categorias/';

function CreateProductModal({ isOpen, onClose, onProductCreated }) {
    const [name, setName] = useState('');
    const [sku, setSku] = useState('');
    const [price, setPrice] = useState(1.00);
    const [marcaId, setMarcaId] = useState('');
    const [categoriaId, setCategoriaId] = useState('');
    
    const [marcas, setMarcas] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [status, setStatus] = useState('');
    
    const [isMarcaModalOpen, setIsMarcaModalOpen] = useState(false);
    const [isCategoriaModalOpen, setIsCategoriaModalOpen] = useState(false);
    const [optionsKey, setOptionsKey] = useState(0);

    // --- SKU PREVIEW ---
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
        }
    }, [isOpen, optionsKey, marcaId, categoriaId]);

    useEffect(() => {
        fetchOptions();
    }, [fetchOptions]);

    // Handlers
    const handleMarcaCreated = (newId) => { setOptionsKey(p => p+1); setMarcaId(newId); setIsMarcaModalOpen(false); };
    const handleCategoriaCreated = (newId) => { setOptionsKey(p => p+1); setCategoriaId(newId); setIsCategoriaModalOpen(false); };

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
            onProductCreated(response.data.id_producto); 
            
            setName(''); setSku(''); setPrice(1.00);
            setTimeout(onClose, 1500);
        } catch (error) {
            const msg = error.response ? JSON.stringify(error.response.data) : error.message;
            setStatus('❌ Error: ' + msg);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={overlayStyle}>
            <div style={contentStyle}>
                <button type="button" onClick={onClose} style={closeButtonStyle}>X</button>
                <h3 style={{marginTop: 0}}>Nuevo Producto</h3>

                <form onSubmit={handleSubmit}>
                    <label style={labelStyle}>Nombre:</label>
                    <input type="text" placeholder="Nombre" value={name} onChange={e => setName(e.target.value)} required style={inputStyle} />
                    
                    <div style={{display: 'flex', gap: '10px'}}>
                        <div style={{flex: 1}}>
                            <label style={labelStyle}>SKU:</label>
                            <input 
                                type="text" 
                                value={sku} 
                                readOnly 
                                disabled 
                                style={{...inputStyle, backgroundColor: '#e9ecef', color: '#555', fontWeight: 'bold', cursor: 'not-allowed'}} 
                            />
                        </div>
                        <div style={{flex: 1}}>
                            <label style={labelStyle}>Precio:</label>
                            <input type="number" value={price} onChange={e => setPrice(e.target.value)} required step="0.01" style={inputStyle} />
                        </div>
                    </div>

                    <div style={rowStyle}>
                        <div style={{flexGrow: 1}}>
                            <select value={marcaId} onChange={e => setMarcaId(e.target.value)} style={selectStyle}>
                                {marcas.map(m => <option key={m.id_marca} value={m.id_marca}>{m.nombre}</option>)}
                            </select>
                        </div>
                        <button type="button" onClick={() => setIsMarcaModalOpen(true)} style={btnSmallStyle}>+</button>
                    </div>

                    <div style={rowStyle}>
                        <div style={{flexGrow: 1}}>
                            <select value={categoriaId} onChange={e => setCategoriaId(e.target.value)} style={selectStyle}>
                                {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
                            </select>
                        </div>
                        <button type="button" onClick={() => setIsCategoriaModalOpen(true)} style={btnSmallStyle}>+</button>
                    </div>

                    <div style={{marginTop: '20px', textAlign: 'right'}}>
                        <button type="submit" style={btnSaveStyle}>Guardar</button>
                        <button type="button" onClick={onClose} style={btnCancelStyle}>Cancelar</button>
                    </div>
                    {status && <p style={{fontSize: '0.8em', marginTop: '5px', color: status.includes('❌') ? 'red' : 'green'}}>{status}</p>}
                </form>
            </div>

            <CreateMarcaModal isOpen={isMarcaModalOpen} onClose={() => setIsMarcaModalOpen(false)} onMarcaCreated={handleMarcaCreated} />
            <CreateCategoriaModal isOpen={isCategoriaModalOpen} onClose={() => setIsCategoriaModalOpen(false)} onCategoriaCreated={handleCategoriaCreated} />
        </div>
    );
}

// Estilos
const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 4000 };
const contentStyle = { backgroundColor: '#fff', padding: '25px', borderRadius: '8px', width: '450px', border: '2px solid #2196f3', boxShadow: '0 4px 8px rgba(0,0,0,0.2)', position: 'relative' };
const closeButtonStyle = { position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', fontSize: '1.2em', cursor: 'pointer', color: '#333', fontWeight: 'bold' };
const inputStyle = { width: '100%', padding: '8px', margin: '5px 0 15px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' };
const labelStyle = { display: 'block', fontSize: '0.85em', fontWeight: 'bold', color: '#555', marginBottom: '3px' };
const rowStyle = { display: 'flex', alignItems: 'center', margin: '5px 0', gap: '5px' };
const selectStyle = { width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' };
const btnSmallStyle = { padding: '8px 12px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '15px' };
const btnSaveStyle = { padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', marginRight: '10px', cursor: 'pointer', fontWeight: 'bold' };
const btnCancelStyle = { padding: '10px 20px', backgroundColor: '#999', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' };

export default CreateProductModal;