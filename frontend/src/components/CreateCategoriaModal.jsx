// frontend/src/components/CreateCategoriaModal.jsx

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const CATEGORIAS_URL = '/api/inventario/categorias/';

// Iconos
const IconCategory = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
const IconClose = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

function CreateCategoriaModal({ isOpen, onClose, onCategoriaCreated }) {
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!nombre.trim()) return toast.error("El nombre es obligatorio");

        setIsSubmitting(true);
        const loadingToast = toast.loading('Creando categoría...');

        try {
            const data = { nombre, descripcion };
            const response = await axios.post(CATEGORIAS_URL, data);
            
            toast.dismiss(loadingToast);
            toast.success(`Categoría creada: ${nombre}`);
            
            onCategoriaCreated(response.data.id_categoria); 
            
            setNombre('');
            setDescripcion('');
            onClose(); 
            
        } catch (error) {
            toast.dismiss(loadingToast);
            const msg = error.response?.data?.nombre 
                ? `Error: ${error.response.data.nombre[0]}`
                : 'Error al crear categoría';
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div style={styles.overlay}>
            {/* 🚨 CLASE RESPONSIVA AQUÍ - Reemplaza el style fijo */}
            <div className="modal-content-responsive" style={{maxWidth: '450px'}}>
                <div style={styles.header}>
                    <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                        <div style={styles.iconBox}><IconCategory /></div>
                        <div>
                            <h3 style={styles.title}>Nueva Categoría</h3>
                            <p style={styles.subtitle}>Organiza tus productos.</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} style={styles.closeBtn}><IconClose /></button>
                </div>

                <form onSubmit={handleSubmit} style={styles.formContent}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Nombre de Categoría</label>
                        <input 
                            type="text" 
                            value={nombre} 
                            onChange={(e) => setNombre(e.target.value)} 
                            required 
                            autoFocus
                            placeholder="Ej: Víveres, Limpieza..."
                            style={styles.input} 
                        />
                    </div>
                    
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Descripción (Opcional)</label>
                        <textarea 
                            value={descripcion} 
                            onChange={(e) => setDescripcion(e.target.value)} 
                            style={{...styles.input, minHeight: '80px', resize:'vertical'}}
                            placeholder="Descripción breve..."
                        ></textarea>
                    </div>

                    <div style={styles.footer}>
                        <button type="button" onClick={onClose} style={styles.btnCancel} disabled={isSubmitting}>Cancelar</button>
                        <button type="submit" style={styles.btnSubmit} disabled={isSubmitting}>
                            {isSubmitting ? 'Guardando...' : 'Crear Categoría'}
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
        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999999,
        animation: 'fadeIn 0.2s ease-out'
    },
    // El modal principal se controla por clase CSS .modal-content-responsive en index.css
    
    header: {
        paddingBottom: '20px', borderBottom: '1px solid #e2e8f0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: '20px'
    },
    iconBox: {
        width: '40px', height: '40px', borderRadius: '10px', background: '#fef3c7',
        color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center'
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
    btnSubmit: { padding: '10px 16px', border: 'none', backgroundColor: '#d97706', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }
};

export default CreateCategoriaModal;