// frontend/src/components/CreateMarcaModal.jsx

import React, { useState } from 'react';
import axios from 'axios';

const MARCAS_URL = '/api/inventario/marcas/';

function CreateMarcaModal({ isOpen, onClose, onMarcaCreated }) {
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [status, setStatus] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('Creando marca...');
        try {
            const data = { 
                nombre, 
                // Aseguramos que se envía una cadena vacía si la descripción es opcional
                descripcion: descripcion || "" 
            };
            const response = await axios.post(MARCAS_URL, data);
            
            setStatus(`✅ Marca "${nombre}" creada. ID: ${response.data.id_marca}`);
            
            // LA LÓGICA CLAVE: Informa al padre que se creó una nueva marca, forzando la recarga
            onMarcaCreated(response.data.id_marca); 
            
            // Limpia y cierra el modal
            setNombre('');
            setDescripcion('');
            // Usamos un pequeño timeout para que el usuario vea el mensaje de éxito
            setTimeout(() => onClose(), 1500); 
            
        } catch (error) {
            // MANEJO DE ERRORES DETALLADO DE DRF
            let errorMessage = "Error desconocido.";
            if (error.response) {
                const errorDetails = error.response.data;
                if (errorDetails.nombre) {
                    errorMessage = `❌ Error de Validación: ${errorDetails.nombre[0]}`;
                } else {
                     errorMessage = `❌ Error de API (${error.response.status}): ${JSON.stringify(errorDetails)}`;
                }
            } else {
                errorMessage = `❌ Error de Conexión: ${error.message}`;
            }

            setStatus(errorMessage);
            console.error("Fallo de POST de Marca:", error); 
        }
    };

    if (!isOpen) return null;

    // ... (Estructura visual del modal)
    return (
        <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
                <h3>Crear Nueva Marca</h3>
                <form onSubmit={handleSubmit}>
                    <label>Nombre:</label>
                    <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required style={inputStyle} />
                    
                    <label>Descripción (Opcional):</label>
                    <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} style={inputStyle}></textarea>
                    
                    <button type="submit" style={buttonStyle}>Crear Marca</button>
                    <button type="button" onClick={onClose} style={{...buttonStyle, backgroundColor: '#f44336'}}>Cancelar</button>
                    {status && <p style={{marginTop: '10px', color: status.startsWith('❌') ? 'red' : 'green'}}>{status}</p>}
                </form>
            </div>
        </div>
    );
}
// Estilos
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContentStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '400px' };
const inputStyle = { width: '100%', padding: '8px', margin: '5px 0 15px', boxSizing: 'border-box', border: '1px solid #ccc' };
const buttonStyle = { padding: '10px 15px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' };

export default CreateMarcaModal;