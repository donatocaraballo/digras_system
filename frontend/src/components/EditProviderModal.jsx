// frontend/src/components/EditProviderModal.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PROVEEDORES_URL = '/api/compras/proveedores/';

function EditProviderModal({ provider, onClose, onSave }) {
    const [nombre, setNombre] = useState(provider.nombre);
    const [direccion, setDireccion] = useState(provider.direccion);
    const [correo, setCorreo] = useState(provider.correo);
    const [telefono, setTelefono] = useState(provider.telefono);
    const [status, setStatus] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('Guardando cambios...');
        try {
            const updateData = { nombre, direccion, correo, telefono };
            // PATCH: /api/compras/proveedores/{id}/
            await axios.patch(`${PROVEEDORES_URL}${provider.id_proveedor}/`, updateData);
            
            setStatus('✅ Proveedor actualizado.');
            onSave(); // Recargar lista
            setTimeout(onClose, 1000);
            
        } catch (error) {
            const msg = error.response ? JSON.stringify(error.response.data) : error.message;
            setStatus('❌ Error: ' + msg);
        }
    };

    return (
        <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
                <h3>Editar Proveedor: {provider.nombre}</h3>
                <form onSubmit={handleSubmit}>
                    <label style={labelStyle}>Nombre:</label>
                    <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required style={inputStyle} />
                    
                    <label style={labelStyle}>Dirección:</label>
                    <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} style={inputStyle} />
                    
                    <label style={labelStyle}>Correo:</label>
                    <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} style={inputStyle} />
                    
                    <label style={labelStyle}>Teléfono:</label>
                    <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} style={inputStyle} />

                    <div style={{textAlign: 'right', marginTop: '20px'}}>
                        <button type="submit" style={saveButtonStyle}>Guardar</button>
                        <button type="button" onClick={onClose} style={cancelButtonStyle}>Cancelar</button>
                    </div>
                    {status && <p style={{marginTop: '10px'}}>{status}</p>}
                </form>
            </div>
        </div>
    );
}

// Estilos (Consistentes con tu diseño)
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 };
const modalContentStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '400px' };
const labelStyle = { display: 'block', fontWeight: 'bold', marginTop: '10px' };
const inputStyle = { width: '100%', padding: '8px', margin: '5px 0', boxSizing: 'border-box', border: '1px solid #ccc' };
const saveButtonStyle = { padding: '8px 15px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' };
const cancelButtonStyle = { padding: '8px 15px', backgroundColor: '#9e9e9e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' };

export default EditProviderModal;