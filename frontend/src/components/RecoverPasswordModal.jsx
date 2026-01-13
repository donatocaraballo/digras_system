// frontend/src/components/RecoverPasswordModal.jsx

import React, { useState } from 'react';
import api from '../api/api'; // O axios directo si no requiere auth

const IconLock = () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;
const IconMail = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>;
const IconKey = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>;

export default function RecoverPasswordModal({ isOpen, onClose }) {
    const [step, setStep] = useState(1); // 1: Email, 2: Código + Nueva Pass
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    if (!isOpen) return null;

    // Paso 1: Enviar Código
    const handleSendCode = async (e) => {
        e.preventDefault();
        setLoading(true); setError(''); setSuccess('');
        try {
            // Nota: Este endpoint debe ser público (sin token) en el backend si axios/api tiene interceptores
            await api.post('/base/usuarios/solicitar-reset/', { email });
            setSuccess("Hemos enviado un código a tu correo.");
            setTimeout(() => {
                setSuccess('');
                setStep(2);
            }, 1500);
        } catch (err) {
            setError("No se pudo enviar el código. Verifica el correo.");
        } finally {
            setLoading(false);
        }
    };

    // Paso 2: Confirmar Cambio
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true); setError(''); setSuccess('');
        try {
            await api.post('/base/usuarios/confirmar-reset/', {
                email,
                codigo: code,
                nueva_password: newPassword
            });
            setSuccess("¡Contraseña actualizada! Redirigiendo...");
            setTimeout(() => {
                onClose();
                setStep(1); // Resetear modal
                setEmail(''); setCode(''); setNewPassword('');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || "Código incorrecto o error al cambiar.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <div style={styles.iconContainer}>
                        <IconLock />
                    </div>
                    <h2 style={styles.title}>Recuperar Contraseña</h2>
                    <p style={styles.subtitle}>
                        {step === 1 ? "Ingresa tu correo para recibir un código." : "Ingresa el código y tu nueva contraseña."}
                    </p>
                </div>

                {step === 1 ? (
                    <form onSubmit={handleSendCode} style={styles.form}>
                        <div style={styles.inputGroup}>
                            <IconMail />
                            <input 
                                type="email" 
                                placeholder="correo@ejemplo.com" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={styles.input} 
                                required
                                autoFocus
                            />
                        </div>
                        {error && <div style={styles.error}>{error}</div>}
                        {success && <div style={styles.success}>{success}</div>}
                        
                        <button type="submit" style={styles.btnPrimary} disabled={loading}>
                            {loading ? "Enviando..." : "Enviar Código"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword} style={styles.form}>
                        <div style={styles.inputGroup}>
                            <span style={{fontSize:'1.2rem'}}>🔢</span>
                            <input 
                                type="text" 
                                placeholder="Código de 6 dígitos" 
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                style={styles.input} 
                                required
                                maxLength={6}
                            />
                        </div>
                        <div style={styles.inputGroup}>
                            <IconKey />
                            <input 
                                type="password" 
                                placeholder="Nueva Contraseña" 
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                style={styles.input} 
                                required
                                minLength={4}
                            />
                        </div>

                        {error && <div style={styles.error}>{error}</div>}
                        {success && <div style={styles.success}>{success}</div>}

                        <button type="submit" style={styles.btnPrimary} disabled={loading}>
                            {loading ? "Procesando..." : "Cambiar Contraseña"}
                        </button>
                        <button type="button" onClick={() => setStep(1)} style={styles.btnLink}>
                            Volver / Reenviar
                        </button>
                    </form>
                )}

                <button onClick={onClose} style={styles.closeBtn}>Cancelar</button>
            </div>
        </div>
    );
}

// ESTILOS (Mismo lenguaje visual que el Login)
const styles = {
    overlay: {
        position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000
    },
    modal: {
        backgroundColor: '#fff', width: '90%', maxWidth: '400px',
        borderRadius: '24px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        textAlign: 'center', position: 'relative'
    },
    header: { marginBottom: '24px' },
    iconContainer: {
        width: '64px', height: '64px', backgroundColor: '#e2e8f0',
        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px auto'
    },
    title: { margin: '0 0 8px 0', color: '#0f172a', fontSize: '1.5rem', fontWeight: '800' },
    subtitle: { margin: 0, color: '#64748b', fontSize: '0.9rem' },
    form: { display: 'flex', flexDirection: 'column', gap: '16px' },
    inputGroup: {
        display: 'flex', alignItems: 'center', gap: '12px',
        backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '12px',
        border: '1px solid #e2e8f0', color: '#64748b'
    },
    input: {
        border: 'none', background: 'transparent', outline: 'none', width: '100%',
        fontSize: '1rem', color: '#0f172a', fontWeight: '500'
    },
    btnPrimary: {
        background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
        color: '#fff', padding: '14px', borderRadius: '12px', border: 'none',
        fontSize: '1rem', fontWeight: '700', cursor: 'pointer', marginTop: '8px',
        transition: 'transform 0.1s'
    },
    btnLink: {
        background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.85rem',
        cursor: 'pointer', fontWeight: '600', textDecoration: 'underline'
    },
    closeBtn: {
        position: 'absolute', top: '16px', right: '16px', background: 'none',
        border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600'
    },
    error: {
        backgroundColor: '#fee2e2', color: '#991b1b', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600'
    },
    success: {
        backgroundColor: '#dcfce7', color: '#166534', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600'
    }
};