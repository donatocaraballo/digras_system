// frontend/src/components/EditProviderModal.jsx

import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const PROVEEDORES_URL = '/api/compras/proveedores/';

const IconEdit = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const IconClose = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

function EditProviderModal({ provider, onClose, onSave }) {
    const [formData, setFormData] = useState({
        nombre: provider.nombre || '',
        rif: provider.rif || '',
        direccion: provider.direccion || '',
        correo: provider.correo || '',
        telefono: provider.telefono || ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const loadingToast = toast.loading('Guardando cambios...');

        try {
            await axios.patch(`${PROVEEDORES_URL}${provider.id_proveedor}/`, formData);
            
            toast.dismiss(loadingToast);
            // El mensaje de éxito se maneja en el padre (onSave) para evitar doble toast, 
            // pero si prefieres aquí: toast.success('Proveedor actualizado');
            
            onSave(); // Refrescar tabla
            
        } catch (error) {
            toast.dismiss(loadingToast);
            const msg = error.response ? JSON.stringify(error.response.data) : error.message;
            toast.error('Error al actualizar: ' + msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={styles.overlay}>
            {/* 🚨 CLASE RESPONSIVA */}
            <div className="modal-content-responsive" style={{maxWidth: '600px'}}>
                
                {/* Header */}
                <div style={styles.header}>
                    <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                        <div style={styles.iconBox}><IconEdit /></div>
                        <div>
                            <h3 style={styles.title}>Editar Proveedor</h3>
                            <p style={styles.subtitle}>Modifique los datos del socio comercial.</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={styles.closeBtn}><IconClose /></button>
                </div>

                <form onSubmit={handleSubmit} style={styles.formContent}>
                    {/* 🚨 GRILLA RESPONSIVA PARA FORMULARIO */}
                    <div className="form-grid-responsive">
                        <div style={{gridColumn: '1 / -1'}}>
                            <label style={styles.label}>Razón Social / Nombre <span style={{color:'red'}}>*</span></label>
                            <input 
                                name="nombre" 
                                value={formData.nombre} 
                                onChange={handleChange} 
                                style={styles.input} 
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
                            />
                        </div>

                        <div style={{gridColumn: '1 / -1'}}>
                            <label style={styles.label}>Correo Electrónico</label>
                            <input 
                                name="correo" 
                                type="email" // Añadido type email para validación navegador
                                value={formData.correo} 
                                onChange={handleChange} 
                                style={styles.input} 
                            />
                        </div>

                        <div style={{gridColumn: '1 / -1'}}>
                            <label style={styles.label}>Dirección Fiscal</label>
                            <textarea 
                                name="direccion" 
                                value={formData.direccion} 
                                onChange={handleChange} 
                                style={{...styles.input, resize: 'vertical', minHeight: '80px', fontFamily: 'inherit'}} 
                            />
                        </div>
                    </div>

                    <div style={styles.footer}>
                        <button type="button" onClick={onClose} style={styles.btnCancel} disabled={isSubmitting}>Cancelar</button>
                        <button type="submit" style={styles.btnSubmit} disabled={isSubmitting}>
                            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const styles = {
    overlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000,
        animation: 'fadeIn 0.2s ease-out'
    },
    // El modal principal se controla por clase CSS .modal-content-responsive
    
    header: {
        paddingBottom: '20px', borderBottom: '1px solid #e2e8f0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: '20px'
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
    formContent: { 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '20px',
        overflowY: 'auto' // Permite scroll si el contenido es muy largo en móvil
    },
    
    label: { display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '6px' },
    input: {
        width: '100%', padding: '12px', borderRadius: '10px',
        border: '1px solid #cbd5e1', fontSize: '0.95rem', color: '#1e293b',
        outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
        boxSizing: 'border-box'
    },
    
    footer: {
        display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '10px'
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

export default EditProviderModal;