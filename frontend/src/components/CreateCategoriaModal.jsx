// frontend/src/components/CreateCategoriaModal.jsx

import React, { useState } from 'react';
import axios from 'axios';

const CATEGORIAS_URL = '/api/inventario/categorias/';

function CreateCategoriaModal({ isOpen, onClose, onCategoriaCreated }) {
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [status, setStatus] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('Creando categoría...');
        try {
            const data = { nombre, descripcion };
            const response = await axios.post(CATEGORIAS_URL, data);
            
            setStatus(`✅ Categoría "${nombre}" creada.`);
            setNombre('');
            setDescripcion('');
            
            // Llama a la función de callback para actualizar la lista de categorías en el componente padre
            onCategoriaCreated(response.data.id_categoria); 
            
            setTimeout(onClose, 1500);
            
        } catch (error) {
            setStatus('❌ Error: ' + JSON.stringify(error.response?.data || error.message));
        }
    };

    if (!isOpen) return null;

    return (
        <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
                <h3>Crear Nueva Categoría</h3>
                <form onSubmit={handleSubmit}>
                    <label>Nombre:</label>
                    <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required style={inputStyle} />
                    
                    <label>Descripción:</label>
                    <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} style={inputStyle}></textarea>
                    
                    <button type="submit" style={buttonStyle}>Crear Categoría</button>
                    <button type="button" onClick={onClose} style={{...buttonStyle, backgroundColor: '#f44336'}}>Cancelar</button>
                    {status && <p style={{marginTop: '10px', color: status.startsWith('❌') ? 'red' : 'green'}}>{status}</p>}
                </form>
            </div>
        </div>
    );
}

// Estilos heredados del modal de marca para simplicidad
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContentStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '400px' };
const inputStyle = { width: '100%', padding: '8px', margin: '5px 0 15px', boxSizing: 'border-box', border: '1px solid #ccc' };
const buttonStyle = { padding: '10px 15px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' };

export default CreateCategoriaModal;