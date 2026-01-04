// frontend/src/pages/Login.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

// Importa tus assets
import bgImage from '../assets/bg-login.jpg'; 
import logoImg from '../assets/logo.png'; 

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [focusedInput, setFocusedInput] = useState(null);
    
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(username, password);
            navigate('/'); // Redirige al inicio
        } catch (err) {
            console.error("Login Error:", err);
            
            // 🚨 LÓGICA DE ERRORES ACTUALIZADA 🚨
            if (err.response) {
                const data = err.response.data;
                const status = err.response.status;

                // 1. Caso Específico: Cuenta Desactivada (Viene del backend modificado)
                if (data.detail === "CUENTA_DESACTIVADA") {
                    setError('⛔ Tu cuenta está desactivada. Por favor, contacta al gerente.');
                }
                // 2. Caso Credenciales Incorrectas (Django devuelve "Unable to log in...")
                else if (status === 400 || (data.non_field_errors && data.non_field_errors.length > 0)) {
                    setError('Credenciales incorrectas. Verifica tu usuario y contraseña.');
                }
                // 3. Otros errores
                else {
                    setError('Ocurrió un error al conectar con el servidor.');
                }
            } else {
                setError('No se pudo conectar al servidor. Revisa tu internet.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <style>
                {`
                    @keyframes float {
                        0% { transform: translateY(0px); }
                        50% { transform: translateY(-15px); }
                        100% { transform: translateY(0px); }
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    input::placeholder { color: #aaa; }
                `}
            </style>

            <div style={styles.overlay}></div>

            <div style={styles.contentWrapper}>
                
                {/* LOGO FLOTANTE */}
                <div style={styles.logoWrapper}>
                    <img src={logoImg} alt="Logo DIGRAS" style={styles.logo} />
                </div>

                {/* TARJETA DE VIDRIO BLANCO */}
                <div style={styles.glassCard}>
                    <div style={styles.header}>
                        <h2 style={styles.welcomeTitle}>Bienvenido</h2>
                        <p style={styles.welcomeText}>Ingresa a tu cuenta para gestionar el sistema.</p>
                    </div>

                    <form onSubmit={handleSubmit} style={styles.form}>
                        {/* Usuario */}
                        <div style={focusedInput === 'user' ? {...styles.inputGroup, ...styles.inputGroupFocus} : styles.inputGroup}>
                            <span style={styles.icon}>👤</span>
                            <input 
                                type="text" 
                                placeholder="Usuario"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onFocus={() => setFocusedInput('user')}
                                onBlur={() => setFocusedInput(null)}
                                style={styles.input}
                                required
                            />
                        </div>
                        
                        {/* Contraseña */}
                        <div style={focusedInput === 'pass' ? {...styles.inputGroup, ...styles.inputGroupFocus} : styles.inputGroup}>
                            <span style={styles.icon}>🔒</span>
                            <input 
                                type="password" 
                                placeholder="Contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setFocusedInput('pass')}
                                onBlur={() => setFocusedInput(null)}
                                style={styles.input}
                                required
                            />
                        </div>

                        {error && <div style={styles.errorBox}>{error}</div>}

                        <button 
                            type="submit" 
                            style={loading ? styles.buttonDisabled : styles.button}
                            disabled={loading}
                        >
                            {loading ? 'ACCEDIENDO...' : 'INICIAR SESIÓN'}
                        </button>
                    </form>

                    <div style={styles.footer}>
                        <p style={styles.footerText}>© 2026 DIGRAS System</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- ESTILOS ---
const styles = {
    container: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: "'Segoe UI', 'Roboto', sans-serif",
        zIndex: 9999,
    },
    overlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)', 
        backdropFilter: 'blur(8px)', 
    },
    contentWrapper: {
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        animation: 'fadeIn 0.8s ease-out',
    },
    logoWrapper: {
        marginBottom: '20px',
        animation: 'float 4s ease-in-out infinite',
        filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.3))',
    },
    logo: {
        width: '140px',
        height: 'auto',
        objectFit: 'contain',
    },
    glassCard: {
        width: '380px',
        padding: '40px',
        borderRadius: '24px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)', 
        backdropFilter: 'blur(20px)', 
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
    },
    header: {
        marginBottom: '30px',
    },
    welcomeTitle: {
        fontSize: '1.8rem',
        color: '#0d47a1', 
        margin: '0 0 5px 0',
        fontWeight: '800',
        letterSpacing: '-0.5px',
    },
    welcomeText: {
        color: '#666',
        fontSize: '0.95rem',
        margin: 0,
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
    },
    inputGroup: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '5px 15px',
        border: '2px solid transparent',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        transition: 'all 0.3s ease',
    },
    inputGroupFocus: {
        borderColor: '#0d47a1', 
        boxShadow: '0 4px 15px rgba(13, 71, 161, 0.2)', 
        transform: 'translateY(-2px)',
    },
    icon: {
        fontSize: '1.2rem',
        marginRight: '10px',
        opacity: 0.5,
        color: '#0d47a1',
    },
    input: {
        width: '100%',
        padding: '12px 0',
        border: 'none',
        outline: 'none',
        fontSize: '1rem',
        color: '#333',
        fontWeight: '500',
        background: 'transparent',
    },
    errorBox: {
        backgroundColor: '#ffebee',
        color: '#c62828', 
        padding: '12px',
        borderRadius: '8px',
        fontSize: '0.9rem',
        fontWeight: '600',
        borderLeft: '4px solid #c62828',
        textAlign: 'left',
        lineHeight: '1.4',
    },
    button: {
        marginTop: '10px',
        padding: '15px',
        borderRadius: '12px',
        border: 'none',
        background: 'linear-gradient(135deg, #0d47a1 0%, #d32f2f 100%)',
        color: 'white',
        fontSize: '1.1rem',
        fontWeight: 'bold',
        letterSpacing: '1px',
        cursor: 'pointer',
        boxShadow: '0 6px 20px rgba(13, 71, 161, 0.4)', 
        transition: 'transform 0.2s, box-shadow 0.2s',
        textTransform: 'uppercase',
    },
    buttonDisabled: {
        marginTop: '10px',
        padding: '15px',
        borderRadius: '12px',
        border: 'none',
        background: '#bdc3c7',
        color: 'white',
        cursor: 'not-allowed',
        fontWeight: 'bold',
    },
    footer: {
        marginTop: '30px',
        borderTop: '1px solid rgba(0,0,0,0.1)',
        paddingTop: '20px',
        width: '100%',
    },
    footerText: {
        color: '#999',
        fontSize: '0.8rem',
        margin: 0,
    }
};

export default Login;