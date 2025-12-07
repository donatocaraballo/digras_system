// frontend/src/components/Navbar.jsx

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

// 🚨 Asegúrate de que la ruta sea correcta. 
// Si tu archivo está en src/assets/logo.png, esto funciona:
import logoImg from '../assets/logo.png'; 

function Navbar() {
    const { logout, user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const modules = [
        { path: '/', name: 'Inicio', icon: '🏠', color: '#818cf8', glow: '0 0 10px #818cf8' }, // Indigo Neon
        
        // Ventas
        { path: '/crear-orden', name: 'Vender', icon: '⚡', color: '#38bdf8', glow: '0 0 10px #38bdf8' }, // Sky Blue
        { path: '/ordenes', name: 'Historial', icon: '📋', color: '#60a5fa', glow: '0 0 10px #60a5fa' }, // Blue
        { path: '/clientes', name: 'Clientes', icon: '👥', color: '#2dd4bf', glow: '0 0 10px #2dd4bf' }, // Teal

        // Gestión
        { path: '/inventario', name: 'Stock', icon: '📦', color: '#fb923c', glow: '0 0 10px #fb923c' }, // Orange
        { path: '/compras', name: 'Compras', icon: '🛒', color: '#34d399', glow: '0 0 10px #34d399' }, // Emerald
        { path: '/recepcion', name: 'Almacén', icon: '📥', color: '#facc15', glow: '0 0 10px #facc15' }, // Yellow
        
        // Admin
        { path: '/aprobaciones', name: 'Aprobar', icon: '✅', color: '#a3e635', glow: '0 0 10px #a3e635' }, // Lime
        { path: '/proveedores', name: 'Proveedores', icon: '🚚', color: '#94a3b8', glow: '0 0 10px #94a3b8' }, // Slate
    ];

    return (
        <div style={styles.navWrapper}>
            <nav style={styles.island}>
                
                {/* 1. SECCIÓN DE MARCA (LOGO) */}
                <div style={styles.brandSection} onClick={() => navigate('/')}>
                    <div style={styles.logoContainer}>
                        {/* Si el logo falla, muestra texto de respaldo */}
                        <img 
                            src={logoImg} 
                            alt="DIGRAS" 
                            style={styles.logoImage} 
                            onError={(e) => {e.target.style.display='none'; e.target.nextSibling.style.display='block'}}
                        />
                        <span style={styles.fallbackLogoText}>DIGRAS</span>
                    </div>
                </div>

                {/* 2. MENÚ DE MÓDULOS (Scrollable si es necesario) */}
                <div style={styles.menuItems}>
                    {modules.map((mod) => {
                        const isActive = location.pathname === mod.path;
                        
                        return (
                            <Link key={mod.name} to={mod.path} style={{ textDecoration: 'none' }}>
                                <div 
                                    className="nav-pill"
                                    style={{
                                        ...styles.navItem,
                                        backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                                        color: isActive ? mod.color : '#94a3b8',
                                        border: isActive ? `1px solid ${mod.color}` : '1px solid transparent',
                                        boxShadow: isActive ? mod.glow : 'none',
                                    }}
                                >
                                    <span style={{fontSize: '1.2rem', lineHeight: 1, filter: isActive ? 'drop-shadow(0 0 2px rgba(255,255,255,0.5))' : 'none'}}>{mod.icon}</span>
                                    
                                    <div className="nav-label-container" style={{
                                        maxWidth: isActive ? '100px' : '0px',
                                        opacity: isActive ? 1 : 0,
                                    }}>
                                        <span style={{...styles.label, color: isActive ? '#fff' : '#cbd5e1'}}>{mod.name}</span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* 3. PERFIL DE USUARIO */}
                <div style={styles.profileSection}>
                    <div style={styles.userInfo}>
                        <div style={styles.avatarCircle}>
                            {user?.username?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <span style={styles.userName}>{user?.username || 'Usuario'}</span>
                    </div>
                    <button onClick={logout} style={styles.logoutBtn} title="Cerrar Sesión">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    </button>
                </div>
            </nav>

            {/* ESTILOS DINÁMICOS CSS (Para animaciones fluidas) */}
            <style>{`
                .nav-pill {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 42px;
                    padding: 0 12px;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); /* Efecto rebote suave */
                    overflow: hidden;
                    position: relative;
                }

                .nav-label-container {
                    overflow: hidden;
                    white-space: nowrap;
                    transition: all 0.4s ease;
                    margin-left: 0;
                }

                /* Hover Effect: Expande y muestra texto */
                .nav-pill:hover {
                    background-color: rgba(255, 255, 255, 0.08) !important;
                    padding-right: 16px;
                }
                
                .nav-pill:hover .nav-label-container {
                    max-width: 100px !important;
                    opacity: 1 !important;
                    margin-left: 8px;
                }

                /* Mobile Scrollbar Hide */
                ::-webkit-scrollbar { height: 0px; background: transparent; }
            `}</style>
        </div>
    );
}

// --- JSS STYLES (Futuristas) ---
const styles = {
    navWrapper: {
        position: 'sticky',
        top: '20px',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        padding: '0 20px',
        boxSizing: 'border-box',
        marginBottom: '40px',
    },
    island: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        // Glassmorphism effect
        backgroundColor: 'rgba(15, 23, 42, 0.85)', // Dark Slate semi-transparent
        backdropFilter: 'blur(16px)', // Efecto borroso detrás
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)', // Borde sutil brillante
        borderRadius: '24px',
        padding: '8px 12px',
        width: '100%',
        maxWidth: '1200px', // Más ancho para que quepan todos los módulos
        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5), 0 0 15px rgba(255,255,255,0.05) inset', // Sombra profunda + Brillo interno
    },
    
    // Logo
    brandSection: {
        display: 'flex',
        alignItems: 'center',
        paddingRight: '20px',
        borderRight: '1px solid rgba(255,255,255,0.1)',
        cursor: 'pointer',
    },
    logoContainer: {
        display: 'flex',
        alignItems: 'center',
        height: '40px',
    },
    logoImage: {
        height: '38px', // Ajusta según tu imagen
        width: 'auto',
        objectFit: 'contain',
        filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.3))', // Resplandor sutil al logo
        transition: 'transform 0.3s ease',
    },
    fallbackLogoText: {
        display: 'none', // Se muestra solo si falla la imagen
        color: '#fff',
        fontWeight: '900',
        letterSpacing: '2px',
        fontSize: '1.2rem',
    },

    // Menú Central
    menuItems: {
        display: 'flex',
        gap: '6px',
        alignItems: 'center',
        overflowX: 'auto', // Permite scroll horizontal en pantallas pequeñas
        padding: '0 10px',
        flex: 1, // Toma el espacio disponible
        justifyContent: 'center', // Centrado
        scrollbarWidth: 'none', // Oculta scrollbar en Firefox
    },
    navItem: {
        // Estilos base manejados en CSS class .nav-pill
    },
    label: {
        fontSize: '0.85rem',
        fontWeight: '600',
        whiteSpace: 'nowrap',
    },

    // Perfil Derecha
    profileSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        paddingLeft: '20px',
        borderLeft: '1px solid rgba(255,255,255,0.1)',
    },
    userInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    avatarCircle: {
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #6366f1, #a855f7)', // Gradiente futurista
        color: 'white',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontWeight: 'bold',
        fontSize: '0.9rem',
        boxShadow: '0 0 10px rgba(168, 85, 247, 0.4)',
    },
    userName: {
        color: '#e2e8f0',
        fontSize: '0.85rem',
        fontWeight: '500',
        display: 'none', // Oculto en pantallas muy pequeñas, visible en media query si quisieras
        '@media (min-width: 1024px)': { display: 'block' } 
    },
    logoutBtn: {
        background: 'rgba(255,255,255,0.05)',
        border: 'none',
        borderRadius: '8px',
        padding: '6px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        transition: 'background 0.2s',
    }
};

export default Navbar;