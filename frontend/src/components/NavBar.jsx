// frontend/src/components/Navbar.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

// Importa tu logo
import logoImg from '../assets/logo.png'; 

function Navbar() {
    const { logout, user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    
    // Estado para el menú desplegable del perfil
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const profileRef = useRef(null);

    // Cerrar el menú si se hace clic fuera
    useEffect(() => {
        function handleClickOutside(event) {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [profileRef]);

    const modules = [
        { path: '/', name: 'Inicio', icon: '🏠', color: '#818cf8', glow: '0 0 10px #818cf8' },
        
        // Ventas
        { path: '/crear-orden', name: 'Vender', icon: '⚡', color: '#38bdf8', glow: '0 0 10px #38bdf8' },
        { path: '/ordenes', name: 'Historial', icon: '📋', color: '#60a5fa', glow: '0 0 10px #60a5fa' },
        { path: '/clientes', name: 'Clientes', icon: '👥', color: '#2dd4bf', glow: '0 0 10px #2dd4bf' },

        // Gestión
        { path: '/inventario', name: 'Stock', icon: '📦', color: '#fb923c', glow: '0 0 10px #fb923c' },
        { path: '/compras', name: 'Compras', icon: '🛒', color: '#34d399', glow: '0 0 10px #34d399' },
        { path: '/recepcion', name: 'Almacén', icon: '📥', color: '#facc15', glow: '0 0 10px #facc15' },
        
        // Admin / Logística
        { path: '/aprobaciones', name: 'Aprobar', icon: '✅', color: '#a3e635', glow: '0 0 10px #a3e635' },
        { path: '/proveedores', name: 'Proveedores', icon: '🚚', color: '#94a3b8', glow: '0 0 10px #94a3b8' },
        { path: '/preparacion', name: 'Preparacion', icon: '🚚', color: '#94a3b8', glow: '0 0 10px #94a3b8' }, // Slate

        // Transporte
        { path: '/envios', name: 'Envios', icon: '🚚', color: '#94a3b8', glow: '0 0 10px #94a3b8' }, // Slate

        // U
        { path: '/usuarios', name: 'Usuarios', icon: '👤', color: '#6366f1', glow: '0 0 10px #6366f1' }, // Indigo

        { path: '/registros', name: 'Acciones', icon: '👤', color: '#6366f1', glow: '0 0 10px #6366f1' },
    ];

    // Helper para obtener color según el rol
    const getRoleBadgeStyle = (role) => {
        const r = (role || '').toUpperCase();
        if (r === 'GERENTE') return { bg: '#dcfce7', color: '#166534', border: '#bbf7d0' }; // Verde
        if (r === 'ADMINISTRADOR') return { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' }; // Azul
        if (r === 'VENDEDOR') return { bg: '#ffedd5', color: '#9a3412', border: '#fed7aa' }; // Naranja
        if (r === 'ALMACENISTA') return { bg: '#fef9c3', color: '#854d0e', border: '#fde047' }; // Amarillo
        if (r === 'TRANSPORTISTA') return { bg: '#f3e8ff', color: '#6b21a8', border: '#d8b4fe' }; // Morado
        return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' }; // Gris
    };

    const roleStyle = getRoleBadgeStyle(user?.tipo);

    // Helper para nombre completo
    const getFullName = () => {
        if (user?.first_name || user?.last_name) {
            return `${user.first_name} ${user.last_name}`.trim();
        }
        return user?.username || 'Usuario';
    };

    return (
        <div style={styles.navWrapper}>
            <nav style={styles.island}>
                
                {/* 1. SECCIÓN DE MARCA (LOGO) */}
                <div style={styles.brandSection} onClick={() => navigate('/')}>
                    <div style={styles.logoContainer}>
                        <img 
                            src={logoImg} 
                            alt="DIGRAS" 
                            style={styles.logoImage} 
                            onError={(e) => {e.target.style.display='none'; e.target.nextSibling.style.display='block'}}
                        />
                        <span style={styles.fallbackLogoText}>DIGRAS</span>
                    </div>
                </div>

                {/* 2. MENÚ DE MÓDULOS */}
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

                {/* 3. PERFIL DE USUARIO (VISUALIZACIÓN DIRECTA) */}
                <div style={styles.profileSection} ref={profileRef}>
                    <div 
                        style={styles.userInfo} 
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                    >
                        {/* Avatar */}
                        <div style={styles.avatarCircle}>
                            {user?.username?.charAt(0).toUpperCase() || "U"}
                        </div>
                        
                        {/* Info Texto (Visible siempre) */}
                        <div style={styles.userMetaVisible}>
                            <span style={styles.visibleName}>{getFullName()}</span>
                            <span style={{...styles.visibleRole, color: roleStyle.color}}>
                                {user?.tipo || 'INVITADO'}
                            </span>
                        </div>

                        <span style={{fontSize:'0.7rem', color:'#94a3b8', marginLeft: '5px'}}>▼</span>
                    </div>

                    {/* MENÚ FLOTANTE (DROPDOWN) */}
                    {showProfileMenu && (
                        <div style={styles.profileDropdown}>
                            {/* Cabecera del Dropdown */}
                            <div style={styles.dropdownHeader}>
                                <div style={styles.largeAvatar}>
                                    {user?.username?.charAt(0).toUpperCase() || "U"}
                                </div>
                                <div style={styles.dropdownMeta}>
                                    <div style={styles.ddFullname}>{getFullName()}</div>
                                    <div style={styles.ddUsername}>@{user?.username}</div>
                                    <div style={{
                                        ...styles.roleBadge, 
                                        backgroundColor: roleStyle.bg, 
                                        color: roleStyle.color,
                                        borderColor: roleStyle.border
                                    }}>
                                        {user?.tipo || 'Sin Rol'}
                                    </div>
                                </div>
                            </div>

                            <div style={styles.dropdownDivider}></div>

                            {/* Acciones */}
                            <button onClick={logout} style={styles.dropdownLogoutBtn}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                                Cerrar Sesión
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            {/* ESTILOS DINÁMICOS CSS */}
            <style>{`
                .nav-pill {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 42px;
                    padding: 0 12px;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    overflow: hidden;
                    position: relative;
                }
                .nav-label-container {
                    overflow: hidden;
                    white-space: nowrap;
                    transition: all 0.4s ease;
                    margin-left: 0;
                }
                .nav-pill:hover {
                    background-color: rgba(255, 255, 255, 0.08) !important;
                    padding-right: 16px;
                }
                .nav-pill:hover .nav-label-container {
                    max-width: 100px !important;
                    opacity: 1 !important;
                    margin-left: 8px;
                }
                ::-webkit-scrollbar { height: 0px; background: transparent; }
            `}</style>
        </div>
    );
}

// --- JSS STYLES ---
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
        backgroundColor: 'rgba(15, 23, 42, 0.9)', // Fondo oscuro
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        padding: '8px 16px',
        width: '100%',
        maxWidth: '1200px',
        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5), 0 0 15px rgba(255,255,255,0.05) inset', 
    },
    
    // Logo
    brandSection: { display: 'flex', alignItems: 'center', paddingRight: '20px', borderRight: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' },
    logoContainer: { display: 'flex', alignItems: 'center', height: '40px' },
    logoImage: { height: '38px', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.3))' },
    fallbackLogoText: { display: 'none', color: '#fff', fontWeight: '900', letterSpacing: '2px', fontSize: '1.2rem' },

    // Menú Central
    menuItems: { display: 'flex', gap: '6px', alignItems: 'center', overflowX: 'auto', padding: '0 10px', flex: 1, justifyContent: 'center', scrollbarWidth: 'none' },
    label: { fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'nowrap' },

    // --- PERFIL DE USUARIO ---
    profileSection: { 
        position: 'relative', 
        paddingLeft: '20px', 
        borderLeft: '1px solid rgba(255,255,255,0.1)' 
    },
    userInfo: { 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px', 
        cursor: 'pointer', 
        padding: '4px 8px', 
        borderRadius: '30px', 
        transition: 'background 0.2s',
        ':hover': { backgroundColor: 'rgba(255,255,255,0.05)' }
    },
    avatarCircle: {
        width: '38px', height: '38px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
        color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center',
        fontWeight: 'bold', fontSize: '0.9rem', boxShadow: '0 0 10px rgba(168, 85, 247, 0.4)',
    },
    userMetaVisible: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        lineHeight: '1.2',
        display: 'none', 
        '@media (min-width: 768px)': { display: 'flex' } // Ocultar en móvil si falta espacio
    },
    visibleName: {
        color: '#f1f5f9',
        fontSize: '0.85rem',
        fontWeight: '600',
        whiteSpace: 'nowrap'
    },
    visibleRole: {
        fontSize: '0.65rem',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    },
    
    // --- DROPDOWN DEL PERFIL ---
    profileDropdown: {
        position: 'absolute',
        top: '65px',
        right: '0',
        width: '280px',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        padding: '24px',
        zIndex: 10000,
        border: '1px solid #e2e8f0',
        animation: 'fadeIn 0.2s ease-out',
        display: 'flex', flexDirection: 'column', gap: '16px'
    },
    dropdownHeader: { display: 'flex', gap: '15px', alignItems: 'center' },
    largeAvatar: {
        width: '60px', height: '60px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #0f172a, #334155)',
        color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center',
        fontWeight: 'bold', fontSize: '1.6rem',
        boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
    },
    dropdownMeta: { display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    ddFullname: { fontSize: '1rem', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    ddUsername: { fontSize: '0.85rem', fontWeight: '500', color: '#64748b', marginBottom: '6px' },
    roleBadge: {
        display: 'inline-block',
        padding: '3px 10px', borderRadius: '12px',
        fontSize: '0.7rem', fontWeight: '700', border: '1px solid',
        alignSelf: 'flex-start', textTransform: 'uppercase'
    },
    dropdownDivider: { height: '1px', backgroundColor: '#f1f5f9', width: '100%' },
    dropdownLogoutBtn: {
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        padding: '12px', width: '100%',
        backgroundColor: '#fee2e2', color: '#991b1b',
        border: 'none', borderRadius: '10px',
        fontWeight: '700', fontSize: '0.9rem',
        cursor: 'pointer', transition: 'background 0.2s'
    }
};

// Estilos globales para media queries (ya que los estilos en línea de JS no soportan @media directos bien sin librerías)
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes fadeIn { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
  .nav-pill:hover { background-color: rgba(255,255,255,0.08) !important; }
  
  /* Media query manual para mostrar/ocultar info de usuario en navbar */
  @media (min-width: 1024px) {
      .user-meta-visible { display: flex !important; }
  }
`;
document.head.appendChild(styleSheet);

// Pequeño hack para aplicar la clase en el render sin CSS externo
styles.userMetaVisible = {
    ...styles.userMetaVisible,
    display: 'none', // Por defecto oculto en movil
    // La clase .user-meta-visible del style tag lo activará en desktop
};

// Asignamos la clase en el JSX: className="user-meta-visible"

export default Navbar;