// frontend/src/components/CreateProveedorModal.jsx

import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const PROVEEDORES_URL = '/api/compras/proveedores/';

const IconBuilding = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="9" y1="22" x2="9" y2="22.01"></line><line x1="15" y1="22" x2="15" y2="22.01"></line><line x1="12" y1="22" x2="12" y2="22.01"></line><line x1="12" y1="2" x2="12" y2="6"></line><line x1="9" y1="10" x2="9" y2="10.01"></line><line x1="15" y1="10" x2="15" y2="10.01"></line><line x1="9" y1="14" x2="9" y2="14.01"></line><line x1="15" y1="14" x2="15" y2="14.01"></line><line x1="9" y1="18" x2="9" y2="18.01"></line><line x1="15" y1="18" x2="15" y2="18.01"></line></svg>;
const IconClose = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

function CreateProveedorModal({ isOpen, onClose, onProveedorCreated }) {
    const [formData, setFormData] = useState({
        nombre: '',
        rif: '',
        direccion: '',
        correo: '',
        telefono: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.nombre || !formData.rif) {
            return toast.error("El nombre y el RIF son obligatorios.");
        }

        setIsSubmitting(true);
        const loadingToast = toast.loading("Registrando proveedor...");

        try {
            const response = await axios.post(PROVEEDORES_URL, formData);
            
            toast.dismiss(loadingToast);
            toast.success(`Proveedor "${formData.nombre}" creado exitosamente.`);
            
            // Callback
            if (onProveedorCreated) onProveedorCreated(response.data.id_proveedor);
            
            // Limpieza
            setFormData({ nombre: '', rif: '', direccion: '', correo: '', telefono: '' });
            onClose();
            
        } catch (error) {
            toast.dismiss(loadingToast);
            const errMsg = error.response ? JSON.stringify(error.response.data) : error.message;
            toast.error('Error: ' + errMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                
                {/* Header */}
                <div style={styles.header}>
                    <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                        <div style={styles.iconBox}><IconBuilding /></div>
                        <div>
                            <h3 style={styles.title}>Nuevo Proveedor</h3>
                            <p style={styles.subtitle}>Registre un nuevo socio comercial.</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={styles.closeBtn}><IconClose /></button>
                </div>

                <form onSubmit={handleSubmit} style={styles.formContent}>
                    <div style={styles.formGrid}>
                        <div style={{gridColumn: 'span 2'}}>
                            <label style={styles.label}>Razón Social / Nombre <span style={{color:'red'}}>*</span></label>
                            <input 
                                name="nombre" 
                                value={formData.nombre} 
                                onChange={handleChange} 
                                style={styles.input} 
                                placeholder="Ej: Distribuidora Los Andes C.A."
                                required 
                            />
                        </div>

                        <div>
                            <label style={styles.label}>RIF / Cédula <span style={{color:'red'}}>*</span></label>
                            <input 
                                name="rif" 
                                value={formData.rif} 
                                onChange={handleChange} 
                                style={styles.input} 
                                placeholder="J-12345678-9"
                                required 
                            />
                        </div>

                        <div>
                            <label style={styles.label}>Teléfono</label>
                            <input 
                                name="telefono" 
                                value={formData.telefono} 
                                onChange={handleChange} 
                                style={styles.input} 
                                placeholder="0414-1234567"
                            />
                        </div>

                        <div style={{gridColumn: 'span 2'}}>
                            <label style={styles.label}>Correo Electrónico</label>
                            <input 
                                name="correo" 
                                type="email"
                                value={formData.correo} 
                                onChange={handleChange} 
                                style={styles.input} 
                                placeholder="contacto@proveedor.com"
                            />
                        </div>

                        <div style={{gridColumn: 'span 2'}}>
                            <label style={styles.label}>Dirección Fiscal</label>
                            <textarea 
                                name="direccion" 
                                value={formData.direccion} 
                                onChange={handleChange} 
                                style={{...styles.input, resize: 'vertical', minHeight: '80px'}} 
                                placeholder="Av. Principal, Edificio Central..."
                            />
                        </div>
                    </div>

                    <div style={styles.footer}>
                        <button type="button" onClick={onClose} style={styles.btnCancel} disabled={isSubmitting}>Cancelar</button>
                        <button type="submit" style={styles.btnSubmit} disabled={isSubmitting}>
                            {isSubmitting ? 'Guardando...' : 'Crear Proveedor'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// --- ESTILOS PREMIUM ---
const styles = {
    overlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000,
        animation: 'fadeIn 0.2s ease-out'
    },
    modal: {
        backgroundColor: '#ffffff', width: '600px', maxHeight: '90vh',
        borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        border: '1px solid #f1f5f9'
    },
    header: {
        padding: '24px', borderBottom: '1px solid #e2e8f0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        backgroundColor: '#f8fafc'
    },
    iconBox: {
        width: '40px', height: '40px', borderRadius: '10px', background: '#e0f2fe',
        color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center'
    },
    title: { margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' },
    subtitle: { margin: '4px 0 0', fontSize: '0.875rem', color: '#64748b' },
    closeBtn: {
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: '#94a3b8', padding: '4px', borderRadius: '50%',
        transition: 'all 0.2s', display: 'flex', alignItems: 'center'
    },
    formContent: { padding: '24px', overflowY: 'auto' },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
    
    label: { display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '6px' },
    input: {
        width: '100%', padding: '12px', borderRadius: '10px',
        border: '1px solid #cbd5e1', fontSize: '0.95rem', color: '#1e293b',
        outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
        boxSizing: 'border-box'
    },
    
    footer: {
        padding: '20px 24px', backgroundColor: '#fff', borderTop: '1px solid #e2e8f0',
        display: 'flex', justifyContent: 'flex-end', gap: '12px'
    },
    btnCancel: {
        padding: '12px 24px', border: 'none', backgroundColor: '#f1f5f9',
        color: '#475569', borderRadius: '10px', cursor: 'pointer', fontWeight: '600'
    },
    btnSubmit: {
        padding: '12px 24px', border: 'none', backgroundColor: '#0f172a',
        color: '#fff', borderRadius: '10px', cursor: 'pointer', fontWeight: '600',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }
};

const styleSheet = document.createElement("style");
styleSheet.innerText = `
    @keyframes fadeIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
    input:focus, textarea:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important; }
`;
document.head.appendChild(styleSheet);

export default CreateProveedorModal;