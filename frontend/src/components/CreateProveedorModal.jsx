// frontend/src/components/CreateProveedorModal.jsx

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom'; // 🚨 IMPORTANTE
import axios from 'axios';
import toast from 'react-hot-toast';

const PROVEEDORES_URL = '/api/compras/proveedores/';

const IconBuilding = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="9" y1="22" x2="9" y2="22.01"></line><line x1="15" y1="22" x2="15" y2="22.01"></line><line x1="12" y1="22" x2="12" y2="22.01"></line><line x1="12" y1="2" x2="12" y2="6"></line><line x1="9" y1="10" x2="9" y2="10.01"></line><line x1="15" y1="10" x2="15" y2="10.01"></line><line x1="9" y1="14" x2="9" y2="14.01"></line><line x1="15" y1="14" x2="15" y2="14.01"></line><line x1="9" y1="18" x2="9" y2="18.01"></line><line x1="15" y1="18" x2="15" y2="18.01"></line></svg>;
const IconClose = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

function CreateProveedorModal({ isOpen, onClose, onProveedorCreated }) {
    const [tipoDoc, setTipoDoc] = useState('J'); 
    const [numDoc, setNumDoc] = useState('');
    const [ciudad, setCiudad] = useState('');
    const [dirDetalle, setDirDetalle] = useState('');
    const [formData, setFormData] = useState({ nombre: '', correo: '', telefono: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setFormData({ nombre: '', correo: '', telefono: '' });
            setTipoDoc('J'); setNumDoc(''); setCiudad(''); setDirDetalle('');
        }
    }, [isOpen]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleNumInput = (e, setter, maxChars) => {
        const val = e.target.value.replace(/[^0-9-]/g, ''); 
        if (val.length <= maxChars) setter(val);
    };

    const handlePhoneInput = (e) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        if (val.length <= 11) setFormData({ ...formData, telefono: val });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.nombre.trim()) return toast.error("El nombre es obligatorio.");
        
        const docClean = numDoc.replace(/-/g, '');
        if (docClean.length < 6) return toast.error(`El número de documento es muy corto.`);
        if (!ciudad.trim() || !dirDetalle.trim()) return toast.error("Complete la ciudad y la dirección.");

        if (formData.telefono.length > 0 && formData.telefono.length !== 11) {
            return toast.error("El teléfono debe tener 11 dígitos.");
        }
        if (formData.correo.length > 0) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.correo)) return toast.error("Correo electrónico no válido.");
        }

        const rifFinal = `${tipoDoc}-${numDoc}`;
        const direccionFinal = `${ciudad.trim()}, ${dirDetalle.trim()}`;

        setIsSubmitting(true);
        const loadingToast = toast.loading("Registrando proveedor...");

        try {
            const payload = {
                nombre: formData.nombre,
                rif_cedula: rifFinal,
                telefono: formData.telefono,
                correo: formData.correo,
                direccion: direccionFinal
            };

            const response = await axios.post(PROVEEDORES_URL, payload);
            
            toast.dismiss(loadingToast);
            toast.success(`Proveedor creado exitosamente.`);
            
            if (onProveedorCreated) onProveedorCreated(response.data.id_proveedor);
            onClose();
            
        } catch (error) {
            toast.dismiss(loadingToast);
            let errMsg = "Error desconocido";
            if (error.response?.data) {
                if (error.response.data.rif) errMsg = "El documento (RIF/Cédula) ya existe.";
                else errMsg = JSON.stringify(error.response.data);
            } else {
                errMsg = error.message;
            }
            toast.error(errMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    // 🚨 RENDERIZADO VIA PORTAL RESPONSIVO
    return ReactDOM.createPortal(
        <div style={styles.overlay}>
            {/* 🚨 CLASE RESPONSIVA APLICADA AQUÍ */}
            <div className="modal-content-responsive" style={{maxWidth: '650px'}}>
                
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
                    {/* 🚨 GRILLA RESPONSIVA PARA FORMULARIO */}
                    <div className="form-grid-responsive">
                        <div style={{gridColumn: '1 / -1'}}>
                            <label style={styles.label}>Razón Social / Nombre <span style={{color:'red'}}>*</span></label>
                            <input name="nombre" value={formData.nombre} onChange={handleChange} style={styles.input} placeholder="Ej: Inversiones Globales C.A." autoFocus />
                        </div>

                        <div style={{gridColumn: '1 / -1'}}>
                            <label style={styles.label}>Documento de Identidad <span style={{color:'red'}}>*</span></label>
                            <div style={{display: 'flex', gap: '10px'}}>
                                <div style={{width: '70px'}}>
                                    <select value={tipoDoc} onChange={(e) => setTipoDoc(e.target.value)} style={styles.selectPrefix}>
                                        <option value="J">J</option><option value="V">V</option><option value="E">E</option><option value="G">G</option><option value="P">P</option>
                                    </select>
                                </div>
                                <div style={{flex: 1}}>
                                    <input value={numDoc} onChange={(e) => handleNumInput(e, setNumDoc, 10)} style={styles.input} placeholder={['J','G'].includes(tipoDoc) ? '12345678-9' : '12345678'} />
                                </div>
                            </div>
                            <p style={styles.helperText}>Registrando: <strong>{tipoDoc}-{numDoc || '...'}</strong></p>
                        </div>

                        <div>
                            <label style={styles.label}>Teléfono</label>
                            <input name="telefono" value={formData.telefono} onChange={handlePhoneInput} style={styles.input} placeholder="04141234567 (Opcional)" type="tel" />
                        </div>

                        <div>
                            <label style={styles.label}>Correo Electrónico</label>
                            <input name="correo" type="email" value={formData.correo} onChange={handleChange} style={styles.input} placeholder="Opcional" />
                        </div>

                        <div style={{gridColumn: '1 / -1', borderTop:'1px solid #e2e8f0', paddingTop:'15px', marginTop:'5px'}}>
                            <label style={{...styles.label, color:'#0f172a', fontSize:'0.9rem'}}>Ubicación Fiscal</label>
                        </div>

                        <div>
                            <label style={styles.label}>Ciudad / Estado <span style={{color:'red'}}>*</span></label>
                            <input value={ciudad} onChange={(e) => setCiudad(e.target.value)} style={styles.input} placeholder="Ej: Caracas, Dtto. Capital" />
                        </div>

                        <div>
                            <label style={styles.label}>Calle / Edificio / Oficina <span style={{color:'red'}}>*</span></label>
                            <input value={dirDetalle} onChange={(e) => setDirDetalle(e.target.value)} style={styles.input} placeholder="Av. Bolívar, Torre A..." />
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
        </div>,
        document.body
    );
}

const styles = {
    overlay: {
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(10px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999999,
        animation: 'fadeIn 0.2s ease-out'
    },
    // El modal principal se controla por clase CSS .modal-content-responsive
    
    header: {
        padding: '24px', borderBottom: '1px solid #e2e8f0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        backgroundColor: '#f8fafc'
    },
    iconBox: {
        width: '42px', height: '42px', borderRadius: '12px', background: '#e0f2fe',
        color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center'
    },
    title: { margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' },
    subtitle: { margin: '4px 0 0', fontSize: '0.875rem', color: '#64748b' },
    closeBtn: {
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: '#94a3b8', padding: '6px', borderRadius: '50%',
        transition: 'all 0.2s', display: 'flex', alignItems: 'center'
    },
    formContent: { padding: '30px', overflowY: 'auto' },
    
    label: { display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '6px' },
    input: {
        width: '100%', padding: '12px', borderRadius: '10px',
        border: '1px solid #cbd5e1', fontSize: '0.95rem', color: '#1e293b',
        outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box'
    },
    selectPrefix: {
        width: '100%', padding: '12px', borderRadius: '10px',
        border: '1px solid #cbd5e1', fontSize: '0.95rem', color: '#0f172a', fontWeight: 'bold',
        outline: 'none', backgroundColor: '#f8fafc', cursor: 'pointer', textAlign: 'center'
    },
    helperText: { fontSize: '0.75rem', color: '#64748b', marginTop: '4px', margin: '4px 0 0 0' },
    footer: {
        padding: '24px', backgroundColor: '#fff', borderTop: '1px solid #e2e8f0',
        display: 'flex', justifyContent: 'flex-end', gap: '15px'
    },
    btnCancel: {
        padding: '12px 24px', border: 'none', backgroundColor: '#f1f5f9',
        color: '#475569', borderRadius: '12px', cursor: 'pointer', fontWeight: '600'
    },
    btnSubmit: {
        padding: '12px 24px', border: 'none', backgroundColor: '#0f172a',
        color: '#fff', borderRadius: '12px', cursor: 'pointer', fontWeight: '600',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
    }
};

const styleSheet = document.createElement("style");
styleSheet.innerText = `
    @keyframes fadeIn { from { opacity:0; transform:scale(0.98); } to { opacity:1; transform:scale(1); } }
    input:focus, textarea:focus, select:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1) !important; }
`;
document.head.appendChild(styleSheet);

export default CreateProveedorModal;