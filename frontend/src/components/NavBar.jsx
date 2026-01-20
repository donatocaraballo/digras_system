// frontend/src/components/Navbar.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api/api'; 
import logoImg from '../assets/logo.png'; 

// --- ICONOS ---
const IconMenu = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>;
const IconClose = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const IconBell = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>;
const IconInfo = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>;
const IconWarning = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;
const IconCheck = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>;

function Navbar() {
    const { logout, user: authUser } = useAuth(); 
    const [userData, setUserData] = useState(null); 
    const location = useLocation();
    const navigate = useNavigate();
    
    // UI States
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showNotifMenu, setShowNotifMenu] = useState(false);

    // Data States
    const [notifications, setNotifications] = useState([]);
    const [loadingNotif, setLoadingNotif] = useState(false);
    
    // 🚨 ESTADO NUEVO: Última vez que se leyó la campanita (Persistente)
    const [lastReadTime, setLastReadTime] = useState(() => {
        return localStorage.getItem('notifLastRead') || null;
    });

    // Contexto (Ids que me pertenecen)
    const [myRelevantIds, setMyRelevantIds] = useState(new Set()); 

    const profileRef = useRef(null);
    const mobileMenuRef = useRef(null);
    const notifRef = useRef(null);

    // 1. Cargar Usuario
    useEffect(() => {
        const fetchUserData = async () => {
            const idToFetch = authUser?.id_usuario || authUser?.id || authUser?.user?.id;
            if (idToFetch) {
                try {
                    const response = await api.get(`base/usuarios/${idToFetch}/`);
                    setUserData(response.data);
                } catch (error) {
                    setUserData(authUser);
                }
            }
        };
        if (authUser) fetchUserData();
    }, [authUser]);

    const currentUser = userData || authUser;
    
    const getUserRole = () => {
        if (!currentUser) return 'INVITADO';
        if (currentUser.tipo) return currentUser.tipo;
        if (currentUser.is_superuser) return 'GERENTE'; 
        return 'SIN ROL';
    };
    const userRole = getUserRole();

    // ---------------------------------------------------------
    // PASO 1: CONTEXTO
    // ---------------------------------------------------------
    useEffect(() => {
        const fetchContext = async () => {
            if (!currentUser) return;
            if (userRole !== 'VENDEDOR' && userRole !== 'TRANSPORTISTA') return;

            const newIds = new Set();
            const userId = Number(currentUser.id_usuario || currentUser.id);

            try {
                if (userRole === 'VENDEDOR') {
                    const [res1, res2] = await Promise.allSettled([
                        api.get(`base/ordenes/?page_size=200`),
                        api.get(`ordenes/?page_size=200`)
                    ]);

                    let ordenes = [];
                    if (res1.status === 'fulfilled') ordenes = [...ordenes, ...res1.value.data.results || res1.value.data];
                    if (res2.status === 'fulfilled') ordenes = [...ordenes, ...res2.value.data.results || res2.value.data];

                    ordenes.forEach(o => {
                        let oUserId = o.id_usuario; 
                        if (typeof o.id_usuario === 'object' && o.id_usuario !== null) {
                            oUserId = o.id_usuario.id_usuario || o.id_usuario.id;
                        }
                        if (Number(oUserId) === userId) {
                            newIds.add(Number(o.id_orden));
                        }
                    });
                } 
                else if (userRole === 'TRANSPORTISTA') {
                    const res = await api.get(`base/transporte/mi-envio/`);
                    if (res.data && res.data.id_envio) {
                        newIds.add(Number(res.data.id_envio));
                    }
                }
            } catch (error) {
                console.error("Error cargando contexto:", error);
            }
            setMyRelevantIds(newIds);
        };

        fetchContext();
        const interval = setInterval(fetchContext, 30000); 
        return () => clearInterval(interval);

    }, [userRole, currentUser]);


    // ---------------------------------------------------------
    // PASO 2: BUSCAR LOGS
    // ---------------------------------------------------------
    const fetchNotifications = async () => {
        if (!currentUser) return;
        setLoadingNotif(true);
        try {
            const res = await api.get(`base/registros/?page_size=50`); 
            const logs = Array.isArray(res.data) ? res.data : res.data.results || [];
            
            const filtered = logs.filter(log => {
                const mod = (log.modulo || "").toUpperCase();
                const action = (log.accion || "").toUpperCase();
                const refId = Number(log.id_referencia);
                
                // VENDEDOR
                if (userRole === 'VENDEDOR') {
                    if ((mod === 'VENTAS' || mod === 'ORDENES') && myRelevantIds.has(refId)) {
                        const keywords = ['APROB', 'DESPACH', 'ENTREG', 'PREPARADA', 'CANCEL', 'RECHAZ', 'CAMINO', 'LISTO'];
                        if (keywords.some(k => action.includes(k))) return true;
                    }
                    if ((mod.includes('TRANSP') || mod.includes('ENVI')) && myRelevantIds.has(refId) && action.includes('INCIDENCIA')) return true;
                    return false;
                }

                // TRANSPORTISTA
                if (userRole === 'TRANSPORTISTA') {
                    if ((mod.includes('ENVI') || mod.includes('TRANSP')) && myRelevantIds.has(refId)) {
                        const keywords = ['ASIGNAR', 'LISTO', 'SALIDA', 'TERMIN'];
                        if (keywords.some(k => action.includes(k))) return true;
                    }
                    return false;
                }

                // ALMACENISTA
                if (userRole === 'ALMACENISTA') {
                    if ((mod === 'VENTAS' || mod === 'ORDENES') && action.includes('APROB')) return true; 
                    if (mod === 'COMPRAS' && action.includes('APROB')) return true; 
                    if (mod.includes('ENVI') && action.includes('ASIGNAR')) return true; 
                    return false;
                }

                // GERENTE
                if (userRole === 'GERENTE' || userRole === 'ADMINISTRADOR') {
                    if (action.includes('LOGIN')) return false; 
                    return true;
                }
                return false;

            }).map(log => ({
                id: log.id_registro,
                title: log.accion, 
                msg: log.descripcion, 
                date: new Date(log.fecha_y_hora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                rawDate: log.fecha_y_hora, // 🚨 Guardamos fecha cruda para comparar
                type: determineNotifType(log.accion),
                link: determineLink(log.modulo)
            }));

            setNotifications(filtered);

        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setLoadingNotif(false);
        }
    };

    const determineNotifType = (action) => {
        const a = action.toUpperCase();
        if (a.includes('CREAR') || a.includes('PENDIENTE')) return 'warning';
        if (a.includes('APROB') || a.includes('ENTREG') || a.includes('LISTO')) return 'success';
        if (a.includes('ELIMINAR') || a.includes('INCIDENCIA') || a.includes('DEVUELTA') || a.includes('CANCEL')) return 'danger';
        return 'info';
    };

    const determineLink = (modulo) => {
        return null; 
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000); 
        return () => clearInterval(interval);
    }, [userRole, currentUser, myRelevantIds]); 

    
    // 🚨 CÁLCULO DE NO LEÍDAS:
    // Solo contamos las que tengan fecha posterior a lastReadTime
    const unreadCount = notifications.filter(n => {
        if (!lastReadTime) return true; // Si nunca ha abierto, todas son nuevas
        return new Date(n.rawDate) > new Date(lastReadTime);
    }).length;

    // 🚨 MANEJADOR DEL CLIC EN CAMPANA
    const handleBellClick = () => {
        if (!showNotifMenu) {
            // Al abrir, marcamos como leído (actualizamos timestamp)
            const now = new Date().toISOString();
            setLastReadTime(now);
            localStorage.setItem('notifLastRead', now);
        }
        setShowNotifMenu(!showNotifMenu);
    };


    // --- CLICK OUTSIDE ---
    useEffect(() => {
        function handleClickOutside(event) {
            if (profileRef.current && !profileRef.current.contains(event.target)) setShowProfileMenu(false);
            if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotifMenu(false);
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && showMobileMenu) {}
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [profileRef, notifRef, showMobileMenu]);

    useEffect(() => { setShowMobileMenu(false); setShowNotifMenu(false); setShowProfileMenu(false); }, [location]);

    const allModules = [
        { path: '/', name: 'Inicio', icon: '🏠', color: '#818cf8', allowedRoles: ['GERENTE', 'VENDEDOR', 'ADMINISTRADOR', 'ALMACENISTA', 'TRANSPORTISTA'] },
        { path: '/crear-orden', name: 'Vender', icon: '⚡', color: '#38bdf8', allowedRoles: ['VENDEDOR'] },
        { path: '/ordenes', name: 'Historial', icon: '📋', color: '#60a5fa', allowedRoles: ['GERENTE', 'VENDEDOR', 'ADMINISTRADOR'] },
        { path: '/clientes', name: 'Clientes', icon: '👥', color: '#2dd4bf', allowedRoles: ['GERENTE', 'VENDEDOR'] },
        { path: '/inventario', name: 'Stock', icon: '📦', color: '#fb923c', allowedRoles: ['GERENTE', 'VENDEDOR', 'ADMINISTRADOR', 'ALMACENISTA'] },
        { path: '/compras', name: 'Compras', icon: '🛒', color: '#34d399', allowedRoles: ['GERENTE', 'ADMINISTRADOR'] },
        { path: '/recepcion', name: 'Almacén', icon: '📥', color: '#facc15', allowedRoles: ['ALMACENISTA'] },
        { path: '/preparacion', name: 'Preparación', icon: '📦', color: '#94a3b8', allowedRoles: ['ALMACENISTA'] },
        { path: '/aprobaciones', name: 'Aprobar', icon: '✅', color: '#a3e635', allowedRoles: ['GERENTE'] },
        { path: '/proveedores', name: 'Proveedores', icon: '🏭', color: '#94a3b8', allowedRoles: ['GERENTE', 'ADMINISTRADOR'] },
        { path: '/envios', name: 'Envíos', icon: '🚛', color: '#a78bfa', allowedRoles: ['GERENTE', 'ADMINISTRADOR'] },
        { path: '/transporte', name: 'Mi Ruta', icon: '🚚', color: '#ec4899', allowedRoles: ['TRANSPORTISTA'] },
        { path: '/usuarios', name: 'Usuarios', icon: '👤', color: '#6366f1', allowedRoles: ['GERENTE'] },
        { path: '/registros', name: 'Acciones', icon: '🛡️', color: '#f43f5e', allowedRoles: ['GERENTE'] },
    ];
    const visibleModules = allModules.filter(mod => mod.allowedRoles.includes(userRole));

    const getFullName = () => {
        if (currentUser?.first_name) return `${currentUser.first_name} ${currentUser.last_name || ''}`.trim();
        return currentUser?.username ? currentUser.username.charAt(0).toUpperCase() + currentUser.username.slice(1) : 'Usuario';
    };

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
                <div style={{display:'flex', alignItems:'center', gap:10}}>
                    <button className="mobile-only" style={styles.hamburgerBtn} onClick={() => setShowMobileMenu(true)}>
                        <IconMenu />
                    </button>
                    <div style={styles.brandSection} onClick={() => navigate('/')}>
                        <div style={styles.logoContainer}>
                            <img src={logoImg} alt="DIGRAS" style={styles.logoImage} onError={(e) => {e.target.style.display='none'; e.target.nextSibling.style.display='block'}} />
                            <span style={styles.fallbackLogoText}>DIGRAS</span>
                        </div>
                    </div>
                </div>

                <div className="desktop-menu" style={styles.menuItems}>
                    {visibleModules.map((mod) => {
                        const isActive = location.pathname === mod.path;
                        return (
                            <Link key={mod.name} to={mod.path} style={{ textDecoration: 'none' }}>
                                <div className="nav-pill" style={{
                                    ...styles.navItem,
                                    backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                                    color: isActive ? mod.color : '#94a3b8',
                                    border: isActive ? `1px solid ${mod.color}` : '1px solid transparent',
                                    boxShadow: isActive ? `0 0 10px ${mod.color}` : 'none',
                                }}>
                                    <span style={{fontSize: '1.2rem', lineHeight: 1}}>{mod.icon}</span>
                                    <div className="nav-label-container" style={{maxWidth: isActive ? '100px' : '0px', opacity: isActive ? 1 : 0}}>
                                        <span style={{...styles.label, color: isActive ? '#fff' : '#cbd5e1'}}>{mod.name}</span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                <div style={styles.rightSection}>
                    <div style={{position: 'relative'}} ref={notifRef}>
                        {/* 🚨 CLICK MANEJADO CON handleBellClick PARA BORRAR BADGE */}
                        <button onClick={handleBellClick} style={styles.notifBtn}>
                            <IconBell />
                            {/* 🚨 SOLO MOSTRAMOS EL BADGE SI unreadCount > 0 */}
                            {unreadCount > 0 && <span style={styles.notifBadge}>{unreadCount}</span>}
                        </button>
                        
                        {showNotifMenu && (
                            <div style={styles.notifDropdown}>
                                <div style={styles.notifHeader}>
                                    <span style={{fontWeight:'800', color:'#0f172a'}}>Actividad</span>
                                    <button onClick={fetchNotifications} style={{background:'none', border:'none', cursor:'pointer', color:'#3b82f6', fontSize:'0.75rem'}}>⟳</button>
                                </div>
                                <div style={styles.notifList}>
                                    {loadingNotif ? <div style={{padding:20, textAlign:'center', color:'#94a3b8'}}>Cargando...</div> : 
                                    notifications.length === 0 ? <div style={{padding:20, textAlign:'center', color:'#94a3b8', fontSize:'0.9rem'}}>Sin novedades.</div> : 
                                    (
                                        // Mostramos las últimas 8, leídas o no leídas (historial)
                                        notifications.slice(0, 8).map((notif, idx) => (
                                            <div key={idx} style={styles.notifItem}>
                                                <div style={{marginTop:'3px'}}>
                                                    {notif.type === 'warning' ? <IconWarning /> : notif.type === 'success' ? <IconCheck /> : notif.type === 'danger' ? <IconWarning /> : <IconInfo />}
                                                </div>
                                                <div style={{flex:1}}>
                                                    <div style={{fontWeight:'700', fontSize:'0.8rem', color:'#1e293b'}}>{notif.title}</div>
                                                    <div style={{fontSize:'0.75rem', color:'#64748b', lineHeight:'1.3', margin:'2px 0'}}>{notif.msg}</div>
                                                    <div style={{fontSize:'0.65rem', color:'#94a3b8', textAlign:'right'}}>{notif.date}</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div style={styles.notifFooter}>
                                    <button style={styles.viewAllBtn} onClick={() => { setShowNotifMenu(false); navigate('/notificaciones'); }}>
                                        Ver todas
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={styles.profileSection} ref={profileRef}>
                        <div style={styles.userInfo} onClick={() => setShowProfileMenu(!showProfileMenu)}>
                            <div style={styles.avatarCircle}>{currentUser?.username?.charAt(0).toUpperCase() || "U"}</div>
                            <div className="user-meta-visible" style={styles.userMetaVisible}>
                                <span style={styles.visibleName}>{getFullName()}</span>
                                <div style={styles.subMetaRow}><span style={{...styles.visibleRole, color: roleStyle.color}}>{userRole}</span></div>
                            </div>
                            <span style={{fontSize:'0.7rem', color:'#94a3b8', marginLeft: '8px'}}>▼</span>
                        </div>
                        {showProfileMenu && (
                            <div style={styles.profileDropdown}>
                                <div style={styles.dropdownHeader}>
                                    <div style={styles.largeAvatar}>{currentUser?.username?.charAt(0).toUpperCase() || "U"}</div>
                                    <div style={styles.dropdownMeta}>
                                        <div style={styles.ddFullname}>{getFullName()}</div>
                                        <div style={styles.ddUsername}>@{currentUser?.username}</div>
                                        <div style={{...styles.roleBadge, backgroundColor: roleStyle.bg, color: roleStyle.color, borderColor: roleStyle.border}}>{userRole}</div>
                                    </div>
                                </div>
                                <div style={styles.dropdownDivider}></div>
                                <button onClick={logout} style={styles.dropdownLogoutBtn}>Cerrar Sesión</button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {showMobileMenu && (
                <div style={styles.mobileOverlay} onClick={() => setShowMobileMenu(false)}>
                    <div style={styles.mobileDrawer} onClick={e => e.stopPropagation()} ref={mobileMenuRef}>
                        <div style={styles.mobileDrawerHeader}>
                            <span style={{fontWeight:'800', color:'#0f172a', fontSize:'1.2rem'}}>Menú</span>
                            <button onClick={() => setShowMobileMenu(false)} style={styles.closeDrawerBtn}><IconClose /></button>
                        </div>
                        <div style={styles.mobileDrawerContent}>
                            {visibleModules.map((mod) => {
                                const isActive = location.pathname === mod.path;
                                return (
                                    <Link key={mod.name} to={mod.path} style={{ textDecoration: 'none' }} onClick={() => setShowMobileMenu(false)}>
                                        <div style={{...styles.mobileNavItem, backgroundColor: isActive ? `${mod.color}15` : 'transparent', color: isActive ? mod.color : '#64748b', borderLeft: isActive ? `4px solid ${mod.color}` : '4px solid transparent'}}>
                                            <span style={{fontSize: '1.4rem', marginRight: 15}}>{mod.icon}</span>
                                            <span style={{fontWeight: isActive ? 700 : 500, fontSize:'1rem'}}>{mod.name}</span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
            <style>{`
                .nav-pill { display: flex; align-items: center; justify-content: center; height: 42px; padding: 0 12px; border-radius: 12px; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); overflow: hidden; position: relative; }
                .nav-label-container { overflow: hidden; white-space: nowrap; transition: all 0.3s ease; margin-left: 0; }
                .nav-pill:hover { background-color: rgba(255, 255, 255, 0.08) !important; padding-right: 16px; }
                .nav-pill:hover .nav-label-container { max-width: 100px !important; opacity: 1 !important; margin-left: 8px; }
                .desktop-menu { display: flex; }
                .mobile-only { display: none; }
                .user-meta-visible { display: flex; }
                @media (max-width: 1024px) { .user-meta-visible { display: none !important; } }
                @media (max-width: 768px) { .desktop-menu { display: none !important; } .mobile-only { display: flex !important; } .user-meta-visible { display: none !important; } }
            `}</style>
        </div>
    );
}

const styles = {
    navWrapper: { position: 'sticky', top: '20px', zIndex: 9999, display: 'flex', justifyContent: 'center', width: '100%', padding: '0 10px', boxSizing: 'border-box', marginBottom: '30px' },
    island: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '24px', padding: '8px 16px', width: '100%', maxWidth: '1200px', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.5)' },
    brandSection: { display: 'flex', alignItems: 'center', paddingRight: '15px', cursor: 'pointer' },
    logoContainer: { display: 'flex', alignItems: 'center', height: '40px' },
    logoImage: { height: '32px', width: 'auto', objectFit: 'contain' },
    fallbackLogoText: { display: 'none', color: '#fff', fontWeight: '900' },
    hamburgerBtn: { background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer', padding: '5px', display: 'flex', alignItems: 'center' },
    menuItems: { gap: '6px', alignItems: 'center', overflowX: 'auto', padding: '0 10px', flex: 1, justifyContent: 'center', scrollbarWidth: 'none' },
    label: { fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'nowrap' },
    rightSection: { display: 'flex', alignItems: 'center', gap: '15px' },
    notifBtn: { background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8', cursor: 'pointer', position: 'relative', display: 'flex', padding: '10px', borderRadius: '50%', transition: 'all 0.2s', ':hover': { backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' } },
    notifBadge: { position: 'absolute', top: 2, right: 2, background: '#ef4444', color: 'white', fontSize: '0.65rem', fontWeight: 'bold', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0f172a' },
    notifDropdown: { position: 'absolute', top: '55px', right: '-80px', width: '320px', backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 20px 50px -10px rgba(0,0,0,0.3)', overflow: 'hidden', border: '1px solid #e2e8f0', zIndex: 10001, animation: 'fadeIn 0.2s ease-out' },
    notifHeader: { padding: '12px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' },
    notifList: { maxHeight: '350px', overflowY: 'auto' },
    notifItem: { padding: '12px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '12px', alignItems: 'start', cursor: 'default', transition: 'background 0.1s', ':hover': { backgroundColor: '#f8fafc' } },
    notifFooter: { padding: '10px', textAlign: 'center', borderTop: '1px solid #e2e8f0', backgroundColor:'#f8fafc' },
    viewAllBtn: { background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', padding:'5px 10px' },
    profileSection: { position: 'relative', paddingLeft: '15px', borderLeft: '1px solid rgba(255,255,255,0.1)' },
    userInfo: { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '4px', borderRadius: '30px', transition: 'background 0.2s', ':hover': { backgroundColor: 'rgba(255,255,255,0.05)' } },
    avatarCircle: { width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '0.9rem' },
    userMetaVisible: { flexDirection: 'column', justifyContent: 'center', lineHeight: '1.2', textAlign: 'left' },
    visibleName: { color: '#f1f5f9', fontSize: '0.85rem', fontWeight: '700', whiteSpace: 'nowrap' },
    subMetaRow: { display: 'flex', alignItems: 'center', gap: '6px' },
    visibleRole: { fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' },
    profileDropdown: { position: 'absolute', top: '60px', right: '0', width: '260px', backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', padding: '20px', zIndex: 10000, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' },
    dropdownHeader: { display: 'flex', gap: '12px', alignItems: 'center' },
    largeAvatar: { width: '50px', height: '50px', borderRadius: '50%', background: 'linear-gradient(135deg, #0f172a, #334155)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '1.4rem' },
    dropdownMeta: { display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    ddFullname: { fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' },
    ddUsername: { fontSize: '0.8rem', fontWeight: '500', color: '#64748b', marginBottom: '4px' },
    roleBadge: { display: 'inline-block', padding: '2px 8px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: '700', border: '1px solid', alignSelf: 'flex-start', textTransform: 'uppercase' },
    dropdownDivider: { height: '1px', backgroundColor: '#f1f5f9', width: '100%' },
    dropdownLogoutBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', width: '100%', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' },
    mobileOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(5px)', zIndex: 20000, display: 'flex', justifyContent: 'flex-start' },
    mobileDrawer: { width: '80%', maxWidth: '300px', height: '100%', backgroundColor: '#ffffff', boxShadow: '10px 0 30px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', animation: 'slideIn 0.3s ease-out' },
    mobileDrawerHeader: { padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' },
    closeDrawerBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' },
    mobileDrawerContent: { padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' },
    mobileNavItem: { display: 'flex', alignItems: 'center', padding: '12px 16px', borderRadius: '12px', cursor: 'pointer', transition: 'background 0.2s' }
};

const styleSheet = document.createElement("style");
styleSheet.innerText = `
    @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
`;
document.head.appendChild(styleSheet);

export default Navbar;