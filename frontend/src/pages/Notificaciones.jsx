// frontend/src/pages/Notificaciones.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api/api';

// --- ICONOS ---
const IconBell = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>;
const IconCheck = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const IconAlert = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;
const IconInfo = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>;
const IconWarning = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;
const IconArrowLeft = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>;

export default function Notificaciones() {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    
    // Data States
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Contexto de IDs propios (Igual que en Navbar para consistencia)
    const [myRelevantIds, setMyRelevantIds] = useState(new Set());

    const userRole = currentUser?.tipo || (currentUser?.is_superuser ? 'GERENTE' : 'INVITADO');

    // ---------------------------------------------------------
    // PASO 1: CARGAR CONTEXTO (Ids Propios)
    // ---------------------------------------------------------
    useEffect(() => {
        const fetchContext = async () => {
            if (!currentUser) return;
            // Solo Vendedor y Transportista requieren filtro por ID
            if (userRole !== 'VENDEDOR' && userRole !== 'TRANSPORTISTA') return;

            const newIds = new Set();
            const userId = Number(currentUser.id_usuario || currentUser.id);

            try {
                if (userRole === 'VENDEDOR') {
                    // Doble fetch para asegurar rutas (Blindaje)
                    const [res1, res2] = await Promise.allSettled([
                        api.get(`base/ordenes/?page_size=300`), // Traemos más historial aquí
                        api.get(`ordenes/?page_size=300`)
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
                console.error("Error cargando contexto en página notificaciones:", error);
            }
            setMyRelevantIds(newIds);
        };

        fetchContext();
    }, [userRole, currentUser]);

    // ---------------------------------------------------------
    // PASO 2: CARGAR HISTORIAL DE NOTIFICACIONES
    // ---------------------------------------------------------
    useEffect(() => {
        const fetchAll = async () => {
            // Esperamos un poco si es vendedor para que cargue el contexto primero
            if ((userRole === 'VENDEDOR' || userRole === 'TRANSPORTISTA') && myRelevantIds.size === 0) {
                // Pequeño hack: Si aún no ha cargado IDs y debería tener, esperamos el siguiente ciclo
                // (Opcional, pero ayuda a que no salga vacío al inicio)
            }

            setLoading(true);
            try {
                // Traemos un historial más largo (ej. 100 eventos)
                const res = await api.get(`base/registros/?page_size=100`); 
                const logs = Array.isArray(res.data) ? res.data : res.data.results || [];
                
                const filtered = logs.filter(log => {
                    const mod = (log.modulo || "").toUpperCase();
                    const action = (log.accion || "").toUpperCase();
                    const refId = Number(log.id_referencia);
                    
                    // --- VENDEDOR ---
                    if (userRole === 'VENDEDOR') {
                        if ((mod === 'VENTAS' || mod === 'ORDENES') && myRelevantIds.has(refId)) {
                            const keywords = ['APROB', 'DESPACH', 'ENTREG', 'PREPARADA', 'CANCEL', 'RECHAZ', 'CAMINO', 'LISTO'];
                            if (keywords.some(k => action.includes(k))) return true;
                        }
                        if ((mod.includes('TRANSP') || mod.includes('ENVI')) && myRelevantIds.has(refId) && action.includes('INCIDENCIA')) {
                             return true;
                        }
                        return false;
                    }

                    // --- TRANSPORTISTA ---
                    if (userRole === 'TRANSPORTISTA') {
                        if ((mod.includes('ENVI') || mod.includes('TRANSP')) && myRelevantIds.has(refId)) {
                            const keywords = ['ASIGNAR', 'LISTO', 'SALIDA', 'TERMIN'];
                            if (keywords.some(k => action.includes(k))) return true;
                        }
                        return false;
                    }

                    // --- ALMACENISTA ---
                    if (userRole === 'ALMACENISTA') {
                        if ((mod === 'VENTAS' || mod === 'ORDENES') && action.includes('APROB')) return true; 
                        if (mod === 'COMPRAS' && action.includes('APROB')) return true; 
                        if (mod.includes('ENVI') && action.includes('ASIGNAR')) return true; 
                        return false;
                    }

                    // --- GERENTE ---
                    if (userRole === 'GERENTE' || userRole === 'ADMINISTRADOR') {
                        if (action.includes('LOGIN')) return false; 
                        return true;
                    }

                    return false;

                }).map(log => ({
                    id: log.id_registro,
                    title: log.accion,
                    msg: log.descripcion,
                    // Fecha completa para el historial
                    date: new Date(log.fecha_y_hora).toLocaleString([], {
                        day: '2-digit', month: '2-digit', year: 'numeric', 
                        hour: '2-digit', minute:'2-digit'
                    }),
                    type: determineNotifType(log.accion),
                }));
                
                setNotifications(filtered);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (currentUser) fetchAll();
    }, [currentUser, userRole, myRelevantIds]); // Dependencia clave: myRelevantIds

    const determineNotifType = (action) => {
        const a = action.toUpperCase();
        if (a.includes('CREAR') || a.includes('PENDIENTE')) return 'warning';
        if (a.includes('APROB') || a.includes('ENTREG') || a.includes('LISTO')) return 'success';
        if (a.includes('ELIMINAR') || a.includes('INCIDENCIA') || a.includes('DEVUELTA') || a.includes('CANCEL')) return 'danger';
        return 'info';
    };

    return (
        <div className="page-container" style={{maxWidth: '900px'}}>
            <div style={styles.header}>
                <button onClick={() => navigate(-1)} style={styles.backBtn} title="Volver">
                    <IconArrowLeft />
                </button>
                <div style={styles.headerContent}>
                    <div style={styles.iconCircle}><IconBell /></div>
                    <div>
                        <h2 style={styles.title}>Centro de Actividad</h2>
                        <p style={styles.subtitle}>Historial de eventos y notificaciones recientes.</p>
                    </div>
                </div>
            </div>

            <div className="card-responsive" style={{minHeight:'400px'}}>
                {loading ? (
                    <div style={styles.empty}>
                        <div style={{marginBottom: 10, fontSize: '1.2rem'}}>⏳</div>
                        Cargando historial...
                    </div>
                ) : notifications.length === 0 ? (
                    <div style={styles.empty}>
                        <div style={{fontSize:'3rem', marginBottom:10}}>🎉</div>
                        <div style={{color: '#0f172a', fontWeight: 600}}>Todo está tranquilo</div>
                        <div style={{fontSize: '0.9rem'}}>No tienes nuevas notificaciones ni eventos recientes.</div>
                    </div>
                ) : (
                    <div style={styles.list}>
                        {notifications.map((n, i) => (
                            <div key={i} style={styles.item}>
                                <div style={styles.iconBox}>
                                    {n.type === 'success' ? <IconCheck /> : 
                                     n.type === 'warning' ? <IconWarning /> : 
                                     n.type === 'danger' ? <IconAlert /> : <IconInfo />}
                                </div>
                                <div style={{flex:1, minWidth:0}}> {/* minWidth:0 previene desbordamiento de texto en flex */}
                                    <div style={styles.itemHeader}>
                                        <span style={styles.itemTitle}>{n.title}</span>
                                        {/* Fecha visible en móvil */}
                                        <span className="mobile-date" style={styles.itemDateMobile}>{n.date}</span>
                                    </div>
                                    <div style={styles.itemMsg}>{n.msg}</div>
                                </div>
                                {/* Fecha visible en desktop */}
                                <div className="desktop-date" style={styles.itemDate}>{n.date}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Estilos adicionales para manejo de fecha responsiva */}
            <style>{`
                @media (max-width: 600px) {
                    .desktop-date { display: none !important; }
                    .mobile-date { display: block !important; margin-left: auto; font-size: 0.75rem; color: #94a3b8; }
                }
                @media (min-width: 601px) {
                    .mobile-date { display: none !important; }
                }
            `}</style>
        </div>
    );
}

const styles = {
    // page-container controla el layout principal
    
    header: { 
        display: 'flex', 
        gap: '20px', 
        alignItems: 'center', 
        marginBottom: '30px' 
    },
    headerContent: {
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
    },
    backBtn: {
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: '#64748b',
        transition: 'all 0.2s',
        boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
    },
    iconCircle: { 
        width: '56px', 
        height: '56px', 
        borderRadius: '16px', 
        background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)', 
        color: '#0284c7', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(2, 132, 199, 0.15)'
    },
    title: { 
        margin: 0, 
        fontSize: '1.8rem', 
        color: '#0f172a', 
        fontWeight: '800', 
        letterSpacing: '-0.5px' 
    },
    subtitle: { 
        margin: '4px 0 0', 
        color: '#64748b', 
        fontSize: '0.95rem' 
    },
    
    // card-responsive controla el contenedor de la lista
    
    list: { 
        display: 'flex', 
        flexDirection: 'column' 
    },
    item: { 
        padding: '24px', 
        borderBottom: '1px solid #f1f5f9', 
        display: 'flex', 
        alignItems: 'flex-start', 
        gap: '20px', 
        transition: 'background 0.2s',
        cursor: 'default'
    },
    
    iconBox: { 
        padding: '12px', 
        borderRadius: '14px', 
        background: '#f8fafc', 
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
    },
    itemHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '6px',
        flexWrap: 'wrap'
    },
    itemTitle: { 
        fontWeight: '700', 
        color: '#0f172a', 
        fontSize: '1rem',
        marginRight: '10px'
    },
    itemMsg: { 
        color: '#475569', 
        fontSize: '0.95rem', 
        lineHeight: '1.5',
        wordBreak: 'break-word' // Evita desbordamiento de textos largos
    },
    itemDate: { 
        fontSize: '0.8rem', 
        color: '#94a3b8', 
        whiteSpace: 'nowrap',
        marginTop: '4px',
        fontWeight: '500'
    },
    
    empty: { 
        padding: '80px 20px', 
        textAlign: 'center', 
        color: '#94a3b8', 
        fontStyle: 'italic',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    }
};