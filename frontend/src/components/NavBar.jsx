// frontend/src/components/Navbar.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api/api'; 

// Importa tu logo
import logoImg from '../assets/logo.png'; 

function Navbar() {
    const { logout, user: authUser } = useAuth(); 
    const [userData, setUserData] = useState(null); 
    const location = useLocation();
    const navigate = useNavigate();
    
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const profileRef = useRef(null);

    // 1. RECUPERACIÓN DE DATOS
    useEffect(() => {
        const fetchUserData = async () => {
            const idToFetch = authUser?.id_usuario || authUser?.id || authUser?.user?.id;

            if (idToFetch) {
                try {
                    const response = await api.get(`/base/usuarios/${idToFetch}/`);
                    setUserData(response.data);
                } catch (error) {
                    console.error("Error actualizando perfil:", error);
                    setUserData(authUser);
                }
            }
        };

        if (authUser) {
            fetchUserData();
        }
    }, [authUser]);

    // Cerrar menú al hacer clic fuera
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

    // --- DETERMINAR ROL ---
    const currentUser = userData || authUser;

    const getUserRole = () => {
        if (!currentUser) return 'INVITADO';
        // 1. Si tiene rol explícito, lo usamos
        if (currentUser.tipo) return currentUser.tipo;
        
        // 2. Si es superuser y no tiene rol asignado, asumimos que es GERENTE por defecto
        if (currentUser.is_superuser) return 'GERENTE'; 
        
        return 'SIN ROL';
    };

    const userRole = getUserRole(); 

    // --- CONFIGURACIÓN DE MÓDULOS ---
    const allModules = [
        // COMÚN
        { 
            path: '/', name: 'Inicio', icon: '🏠', color: '#818cf8', glow: '0 0 10px #818cf8',
            allowedRoles: ['GERENTE', 'VENDEDOR', 'ADMINISTRADOR', 'ALMACENISTA', 'TRANSPORTISTA']
        },
        
        // VENTAS (Solo Vendedor)
        { 
            path: '/crear-orden', name: 'Vender', icon: '⚡', color: '#38bdf8', glow: '0 0 10px #38bdf8',
            allowedRoles: ['VENDEDOR']
        },
        // Historial y Clientes (Vendedor opera, Gerente supervisa)
        { 
            path: '/ordenes', name: 'Historial', icon: '📋', color: '#60a5fa', glow: '0 0 10px #60a5fa',
            allowedRoles: ['GERENTE', 'VENDEDOR', 'ADMINISTRADOR']
        },
        { 
            path: '/clientes', name: 'Clientes', icon: '👥', color: '#2dd4bf', glow: '0 0 10px #2dd4bf',
            allowedRoles: ['GERENTE', 'VENDEDOR']
        },

        // GESTIÓN
        { 
            path: '/inventario', name: 'Stock', icon: '📦', color: '#fb923c', glow: '0 0 10px #fb923c',
            allowedRoles: ['GERENTE', 'VENDEDOR', 'ADMINISTRADOR', 'ALMACENISTA']
        },
        { 
            path: '/compras', name: 'Compras', icon: '🛒', color: '#34d399', glow: '0 0 10px #34d399',
            allowedRoles: ['GERENTE', 'ADMINISTRADOR']
        },
        
        // ALMACÉN (Operativo: Solo Almacenista)
        { 
            path: '/recepcion', name: 'Almacén', icon: '📥', color: '#facc15', glow: '0 0 10px #facc15',
            allowedRoles: ['ALMACENISTA']
        },
        { 
            path: '/preparacion', name: 'Preparación', icon: '📦', color: '#94a3b8', glow: '0 0 10px #94a3b8',
            allowedRoles: ['ALMACENISTA']
        },
        
        // ADMIN / LOGÍSTICA
        { 
            path: '/aprobaciones', name: 'Aprobar', icon: '✅', color: '#a3e635', glow: '0 0 10px #a3e635',
            allowedRoles: ['GERENTE']
        },
        { 
            path: '/proveedores', name: 'Proveedores', icon: '🏭', color: '#94a3b8', glow: '0 0 10px #94a3b8',
            allowedRoles: ['GERENTE', 'ADMINISTRADOR']
        },

        // TRANSPORTE
        { 
            path: '/envios', name: 'Envíos', icon: '🚛', color: '#a78bfa', glow: '0 0 10px #a78bfa',
            allowedRoles: ['GERENTE']
        },
        { 
            path: '/transporte', name: 'Mi Ruta', icon: '🚚', color: '#ec4899', glow: '0 0 10px #ec4899',
            allowedRoles: ['TRANSPORTISTA']
        },

        // SISTEMA (Solo Gerente)
        { 
            path: '/usuarios', name: 'Usuarios', icon: '👤', color: '#6366f1', glow: '0 0 10px #6366f1',
            allowedRoles: ['GERENTE']
        },
        { 
            path: '/registros', name: 'Acciones', icon: '🛡️', color: '#f43f5e', glow: '0 0 10px #f43f5e',
            allowedRoles: ['GERENTE']
        },
    ];

    // 🚨 FILTRADO ESTRICTO (Sin excepciones de superusuario)
    const visibleModules = allModules.filter(mod => {
        return mod.allowedRoles.includes(userRole);
    });

    // Helper nombre
    const getFullName = () => {
        if (currentUser?.first_name || currentUser?.last_name) {
            return `${currentUser.first_name} ${currentUser.last_name}`.trim();
        }
        return currentUser?.username ? currentUser.username.charAt(0).toUpperCase() + currentUser.username.slice(1) : 'Usuario';
    };

    // Estilos Badge
    const getRoleBadgeStyle = (role) => {
        const r = (role || '').toUpperCase();
        if (r === 'GERENTE') return { bg: '#dcfce7', color: '#166534', border: '#bbf7d0' }; 
        if (r === 'ADMINISTRADOR') return { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' }; 
        if (r === 'VENDEDOR') return { bg: '#ffedd5', color: '#9a3412', border: '#fed7aa' }; 
        if (r === 'ALMACENISTA') return { bg: '#fef9c3', color: '#854d0e', border: '#fde047' }; 
        if (r === 'TRANSPORTISTA') return { bg: '#f3e8ff', color: '#6b21a8', border: '#d8b4fe' }; 
        return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' }; 
    };

    const roleStyle = getRoleBadgeStyle(userRole);

    return (
        <div style={styles.navWrapper}>
            <nav style={styles.island}>
                
                {/* LOGO */}
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

                {/* MENÚ */}
                <div style={styles.menuItems}>
                    {visibleModules.map((mod) => {
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

                {/* PERFIL */}
                <div style={styles.profileSection} ref={profileRef}>
                    <div 
                        style={styles.userInfo} 
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                    >
                        <div style={styles.avatarCircle}>
                            {currentUser?.username?.charAt(0).toUpperCase() || "U"}
                        </div>
                        
                        <div className="user-meta-visible" style={styles.userMetaVisible}>
                            <span style={styles.visibleName}>{getFullName()}</span>
                            <div style={styles.subMetaRow}>
                                <span style={styles.visibleUsername}>@{currentUser?.username}</span>
                                <span style={styles.bulletPoint}>•</span>
                                <span style={{...styles.visibleRole, color: roleStyle.color}}>
                                    {userRole}
                                </span>
                            </div>
                        </div>

                        <span style={{fontSize:'0.7rem', color:'#94a3b8', marginLeft: '8px'}}>▼</span>
                    </div>

                    {/* DROPDOWN */}
                    {showProfileMenu && (
                        <div style={styles.profileDropdown}>
                            <div style={styles.dropdownHeader}>
                                <div style={styles.largeAvatar}>
                                    {currentUser?.username?.charAt(0).toUpperCase() || "U"}
                                </div>
                                <div style={styles.dropdownMeta}>
                                    <div style={styles.ddFullname}>{getFullName()}</div>
                                    <div style={styles.ddUsername}>@{currentUser?.username}</div>
                                    <div style={{
                                        ...styles.roleBadge, 
                                        backgroundColor: roleStyle.bg, 
                                        color: roleStyle.color,
                                        borderColor: roleStyle.border
                                    }}>
                                        {userRole}
                                    </div>
                                </div>
                            </div>

                            <div style={styles.dropdownDivider}></div>

                            <button onClick={logout} style={styles.dropdownLogoutBtn}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                                Cerrar Sesión
                            </button>
                        </div>
                    )}
                </div>
            </nav>

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
                .user-meta-visible { display: none; }
                @media (min-width: 1024px) {
                    .user-meta-visible { display: flex !important; }
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
        backgroundColor: 'rgba(15, 23, 42, 0.9)', 
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

    // Menú
    menuItems: { display: 'flex', gap: '6px', alignItems: 'center', overflowX: 'auto', padding: '0 10px', flex: 1, justifyContent: 'center', scrollbarWidth: 'none' },
    label: { fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'nowrap' },
    navItem: {}, 

    // Perfil
    profileSection: { 
        position: 'relative', 
        paddingLeft: '20px', 
        borderLeft: '1px solid rgba(255,255,255,0.1)' 
    },
    userInfo: { 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        cursor: 'pointer', 
        padding: '4px 8px', 
        borderRadius: '30px', 
        transition: 'background 0.2s',
        ':hover': { backgroundColor: 'rgba(255,255,255,0.05)' }
    },
    avatarCircle: {
        width: '40px', height: '40px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
        color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center',
        fontWeight: 'bold', fontSize: '1rem', boxShadow: '0 0 10px rgba(168, 85, 247, 0.4)',
    },
    
    // Texto Visible
    userMetaVisible: {
        flexDirection: 'column',
        justifyContent: 'center',
        lineHeight: '1.2',
        textAlign: 'left'
    },
    visibleName: {
        color: '#f1f5f9',
        fontSize: '0.85rem',
        fontWeight: '700',
        whiteSpace: 'nowrap'
    },
    subMetaRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
    },
    visibleUsername: {
        color: '#94a3b8', 
        fontSize: '0.75rem',
        fontWeight: '500'
    },
    bulletPoint: {
        color: '#475569',
        fontSize: '0.6rem'
    },
    visibleRole: {
        fontSize: '0.65rem',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    },
    
    // Dropdown
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

export default Navbar;