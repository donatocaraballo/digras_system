// frontend/src/components/CreateMarcaModal.jsx

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const MARCAS_URL = '/api/inventario/marcas/';

// Iconos
const IconTag = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>;
const IconClose = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

function CreateMarcaModal({ isOpen, onClose, onMarcaCreated }) {
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!nombre.trim()) return toast.error("El nombre es obligatorio");

        setIsSubmitting(true);
        const loadingToast = toast.loading('Creando marca...');

        try {
            const data = { 
                nombre, 
                descripcion: descripcion || "" 
            };
            const response = await axios.post(MARCAS_URL, data);
            
            toast.dismiss(loadingToast);
            toast.success(`Marca creada: ${nombre}`);
            
            onMarcaCreated(response.data.id_marca); 
            
            setNombre('');
            setDescripcion('');
            onClose(); // Cierre inmediato tras éxito
            
        } catch (error) {
            toast.dismiss(loadingToast);
            let errorMessage = "Error desconocido.";
            if (error.response) {
                errorMessage = error.response.data.nombre 
                    ? `Error: ${error.response.data.nombre[0]}` 
                    : `Error API: ${JSON.stringify(error.response.data)}`;
            } else {
                errorMessage = `Error de conexión: ${error.message}`;
            }
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div style={styles.overlay}>
            {/* 🚨 CLASE RESPONSIVA AQUÍ */}
            <div className="modal-content-responsive" style={{maxWidth: '450px'}}>
                <div style={styles.header}>
                    <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                        <div style={styles.iconBox}><IconTag /></div>
                        <div>
                            <h3 style={styles.title}>Nueva Marca</h3>
                            <p style={styles.subtitle}>Define un fabricante o marca.</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} style={styles.closeBtn}><IconClose /></button>
                </div>

                <form onSubmit={handleSubmit} style={styles.formContent}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Nombre de la Marca</label>
                        <input 
                            type="text" 
                            value={nombre} 
                            onChange={(e) => setNombre(e.target.value)} 
                            required 
                            autoFocus
                            placeholder="Ej: Polar, Nestlé..."
                            style={styles.input} 
                        />
                    </div>
                    
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Descripción (Opcional)</label>
                        <textarea 
                            value={descripcion} 
                            onChange={(e) => setDescripcion(e.target.value)} 
                            style={{...styles.input, minHeight: '80px', resize:'vertical'}}
                            placeholder="Detalles adicionales..."
                        ></textarea>
                    </div>

                    <div style={styles.footer}>
                        <button type="button" onClick={onClose} style={styles.btnCancel} disabled={isSubmitting}>Cancelar</button>
                        <button type="submit" style={styles.btnSubmit} disabled={isSubmitting}>
                            {isSubmitting ? 'Guardando...' : 'Crear Marca'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}

const styles = {
    overlay: {
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999999, // Muy alto para estar sobre el otro modal
        animation: 'fadeIn 0.2s ease-out'
    },
    // El modal principal se controla por clase CSS .modal-content-responsive
    
    header: {
        paddingBottom: '20px', borderBottom: '1px solid #e2e8f0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: '20px'
    },
    iconBox: {
        width: '40px', height: '40px', borderRadius: '10px', background: '#dcfce7',
        color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center'
    },
    title: { margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' },
    subtitle: { margin: '2px 0 0', fontSize: '0.85rem', color: '#64748b' },
    closeBtn: {
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: '#94a3b8', padding: '4px', borderRadius: '50%',
        transition: 'all 0.2s', display: 'flex', alignItems: 'center'
    },
    formContent: { display: 'flex', flexDirection: 'column', gap: '15px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '0.8rem', fontWeight: '700', color: '#334155', textTransform:'uppercase' },
    input: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' },
    footer: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' },
    btnCancel: { padding: '10px 16px', border: 'none', backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
    btnSubmit: { padding: '10px 16px', border: 'none', backgroundColor: '#16a34a', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }
};

export default CreateMarcaModal;