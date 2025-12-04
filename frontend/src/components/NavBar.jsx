// frontend/src/components/Navbar.jsx

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

function Navbar() {
    const { logout, user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const modules = [
        { path: '/', name: 'Inicio', icon: '🏠', color: '#6c5ce7' },
        
        // Módulos de Venta (Tu compañero) - Ahora integrados como principales
        { path: '/crear-orden', name: 'Nueva Venta', icon: '🧾', color: '#0984e3' },
        { path: '/ordenes', name: 'Historial Ventas', icon: '📋', color: '#74b9ff' },

        // Tus Módulos de Gestión
        { path: '/inventario', name: 'Inventario', icon: '🍖', color: '#e17055' },
        { path: '/compras', name: 'Compras', icon: '🛒', color: '#00b894' },
        { path: '/recepcion', name: 'Recepción', icon: '📦', color: '#fdcb6e' },
        { path: '/proveedores', name: 'Proveedores', icon: '🚚', color: '#636e72' },
        { path: '/clientes', name: 'Clientes', icon: '🚚', color: '#636e72' },
        { path: '/aprobaciones', name: 'Aprobaciones', icon: '🚚', color: '#636e72' },
    ];

    return (
        <div style={styles.navContainer}>
            <nav style={styles.island}>
                <div style={styles.brandSection} onClick={() => navigate('/')}>
                    <span style={styles.logoText}>DIGRAS</span>
                </div>

                <div style={styles.menuItems}>
                    {modules.map((mod) => {
                        const isActive = location.pathname === mod.path;
                        
                        return (
                            <Link key={mod.name} to={mod.path} style={{ textDecoration: 'none' }}>
                                <div 
                                    style={{
                                        ...styles.navItem,
                                        backgroundColor: isActive ? mod.color : 'transparent',
                                        width: isActive ? 'auto' : '45px',
                                        color: isActive ? 'white' : '#b2bec3'
                                    }}
                                    className="nav-item-hover"
                                >
                                    <span style={styles.icon}>{mod.icon}</span>
                                    <span style={{
                                        ...styles.label,
                                        maxWidth: isActive ? '100px' : '0px',
                                        opacity: isActive ? 1 : 0,
                                    }} className="nav-label">
                                        {mod.name}
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                <div style={styles.profileSection}>
                    <div style={styles.avatarCircle}>
                        {user?.username?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <button onClick={logout} style={styles.logoutBtn} title="Salir">⏻</button>
                </div>
            </nav>

            <style>{`
                .nav-item-hover { transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1); }
                .nav-item-hover:hover { background-color: rgba(255, 255, 255, 0.1) !important; width: 140px !important; color: white !important; }
                .nav-item-hover:hover .nav-label { max-width: 100px !important; opacity: 1 !important; margin-left: 8px; }
            `}</style>
        </div>
    );
}

// Estilos del Navbar (Mismos que el anterior, pero asegurando el ancho)
const styles = {
    navContainer: { position: 'sticky', top: '20px', zIndex: 1000, display: 'flex', justifyContent: 'center', marginBottom: '30px', padding: '0 20px', width: '100%', boxSizing: 'border-box' },
    island: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#2d3436', padding: '8px 15px', borderRadius: '50px', boxShadow: '0 10px 30px rgba(0,0,0,0.25)', width: '100%', maxWidth: '950px', backdropFilter: 'blur(10px)' },
    brandSection: { cursor: 'pointer', paddingRight: '20px', borderRight: '1px solid rgba(255,255,255,0.1)', marginRight: '10px' },
    logoText: { fontWeight: '900', color: '#fff', fontSize: '1.2rem', letterSpacing: '2px' },
    menuItems: { display: 'flex', gap: '8px', alignItems: 'center' },
    navItem: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40px', borderRadius: '25px', padding: '0 10px', cursor: 'pointer', overflow: 'hidden', whiteSpace: 'nowrap' },
    icon: { fontSize: '1.2rem', lineHeight: '1' },
    label: { fontSize: '0.9rem', fontWeight: '600', marginLeft: '8px', transition: 'all 0.3s ease' },
    profileSection: { display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '20px', borderLeft: '1px solid rgba(255,255,255,0.1)', marginLeft: '10px' },
    avatarCircle: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#636e72', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '0.9rem' },
    logoutBtn: { background: 'none', border: 'none', color: '#d63031', fontSize: '1.2rem', cursor: 'pointer', padding: '5px' },
};

export default Navbar;