// frontend/src/components/CreateProveedorModal.jsx

import React, { useState } from 'react';
import axios from 'axios';

const PROVEEDORES_URL = '/api/compras/proveedores/';

function CreateProveedorModal({ isOpen, onClose, onProveedorCreated }) {
    const [nombre, setNombre] = useState('');
    const [direccion, setDireccion] = useState('');
    const [correo, setCorreo] = useState('');
    const [telefono, setTelefono] = useState('');
    const [status, setStatus] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('Creando proveedor...');
        try {
            const data = { nombre, direccion, correo, telefono };
            const response = await axios.post(PROVEEDORES_URL, data);
            
            setStatus(`✅ Proveedor "${nombre}" creado.`);
            
            // 1. Llama a la función de callback con el ID creado
            onProveedorCreated(response.data.id_proveedor); 
            
            // 2. Limpia y cierra el modal
            setNombre(''); setDireccion(''); setCorreo(''); setTelefono('');
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
                <h3>Crear Nuevo Proveedor</h3>
                <form onSubmit={handleSubmit}>
                    <label style={labelStyle}>Nombre:</label>
                    <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required style={inputStyle} />
                    
                    <label style={labelStyle}>Dirección:</label>
                    <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} required style={inputStyle} />
                    
                    <label style={labelStyle}>Correo:</label>
                    <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required style={inputStyle} />
                    
                    <label style={labelStyle}>Teléfono:</label>
                    <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} required style={inputStyle} />

                    <button type="submit" style={saveButtonStyle}>Crear Proveedor</button>
                    <button type="button" onClick={onClose} style={cancelButtonStyle}>Cancelar</button>
                    {status && <p style={{marginTop: '10px', color: status.startsWith('❌') ? 'red' : 'green'}}>{status}</p>}
                </form>
            </div>
        </div>
    );
}

// Estilos del modal (reutilizados de otros modales)
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 };
const modalContentStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '450px', maxHeight: '90vh', overflowY: 'auto' };
const labelStyle = { display: 'block', fontWeight: 'bold', marginTop: '10px' };
const inputStyle = { width: '100%', padding: '8px', margin: '5px 0 15px', boxSizing: 'border-box', border: '1px solid #ccc' };
const saveButtonStyle = { padding: '10px 15px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' };
const cancelButtonStyle = { padding: '10px 15px', backgroundColor: '#9e9e9e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' };

export default CreateProveedorModal;