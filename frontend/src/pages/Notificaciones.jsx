// frontend/src/pages/Notificaciones.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api/api';

// Iconos SVG
const IconBell = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>;
const IconCheck = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const IconAlert = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;
const IconInfo = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>;
const IconArrowLeft = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>;

export default function Notificaciones() {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const userRole = currentUser?.tipo || (currentUser?.is_superuser ? 'GERENTE' : 'INVITADO');

    // Misma lógica de filtrado del Navbar
    const filterLogsByRole = (logs, role) => {
        return logs.filter(log => {
            const mod = (log.modulo || "").toUpperCase();
            const action = (log.accion || "").toUpperCase();
            
            if (role === 'VENDEDOR') {
                if (mod === 'VENTAS' && (action.includes('APROB') || action.includes('DESPACH') || action.includes('ENTREGA'))) return true;
                if (mod === 'TRANSPORTE' && action.includes('INCIDENCIA')) return true;
                return false;
            }
            if (role === 'ALMACENISTA') {
                if (mod === 'VENTAS' && action.includes('APROB')) return true;
                if (mod === 'COMPRAS' && action.includes('APROB')) return true;
                if (mod === 'TRANSPORTE' && action.includes('ASIGNAR')) return true;
                return false;
            }
            if (role === 'TRANSPORTISTA') {
                if (mod === 'TRANSPORTE' && (action.includes('ASIGNAR') || action.includes('LISTO'))) return true;
                return false;
            }
            if (role === 'GERENTE' || role === 'ADMINISTRADOR') {
                if (action.includes('CREAR') || action.includes('ELIMINAR') || action.includes('AJUSTE')) return true;
                if (action.includes('INCIDENCIA') || action.includes('DEVUELTA')) return true;
                return true; 
            }
            return false;
        }).map(log => ({
            id: log.id_registro,
            title: `${log.modulo} - ${log.accion}`,
            msg: log.descripcion,
            date: new Date(log.fecha_y_hora).toLocaleString(),
            type: determineNotifType(log.accion),
            link: determineLink(log.modulo)
        }));
    };

    const determineNotifType = (action) => {
        const a = action.toUpperCase();
        if (a.includes('CREAR') || a.includes('PENDIENTE')) return 'warning';
        if (a.includes('APROB') || a.includes('ENTREGA') || a.includes('LISTO')) return 'success';
        if (a.includes('ELIMINAR') || a.includes('INCIDENCIA') || a.includes('DEVUELTA')) return 'danger';
        return 'info';
    };

    const determineLink = (modulo) => {
        const m = (modulo || "").toUpperCase();
        if (m === 'VENTAS' || m === 'ORDENES') return '/ordenes';
        if (m === 'COMPRAS') return '/compras';
        if (m === 'TRANSPORTE' || m === 'ENVIOS') return '/envios';
        if (m === 'INVENTARIO') return '/inventario';
        return '/registros';
    };

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                // Traemos los últimos 100 registros para tener un historial decente
                const res = await api.get(`/base/registros/?page_size=100`); 
                const logs = Array.isArray(res.data) ? res.data : res.data.results || [];
                const filtered = filterLogsByRole(logs, userRole);
                setNotifications(filtered);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (currentUser) fetchAll();
    }, [currentUser, userRole]);

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <button onClick={() => navigate(-1)} style={styles.backBtn}><IconArrowLeft /></button>
                <div style={styles.iconCircle}><IconBell /></div>
                <div>
                    <h2 style={styles.title}>Centro de Notificaciones</h2>
                    <p style={styles.subtitle}>Historial de alertas y actividad reciente del sistema.</p>
                </div>
            </div>

            <div style={styles.card}>
                {loading ? (
                    <div style={styles.empty}>Cargando historial de notificaciones...</div>
                ) : notifications.length === 0 ? (
                    <div style={styles.empty}>
                        <div style={{fontSize:'3rem', marginBottom:10}}>🎉</div>
                        No tienes notificaciones recientes. ¡Estás al día!
                    </div>
                ) : (
                    <div style={styles.list}>
                        {notifications.map((n, i) => (
                            <div key={i} style={styles.item} onClick={() => n.link && navigate(n.link)}>
                                <div style={styles.iconBox}>
                                    {n.type === 'success' ? <IconCheck /> : n.type === 'warning' ? <IconAlert /> : <IconInfo />}
                                </div>
                                <div style={{flex:1}}>
                                    <div style={styles.itemTitle}>{n.title}</div>
                                    <div style={styles.itemMsg}>{n.msg}</div>
                                </div>
                                <div style={styles.itemDate}>{n.date}</div>
                                {n.link && <button style={styles.actionBtn}>Ver</button>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    page: { padding: '40px', maxWidth: '1000px', margin: '0 auto', fontFamily: "'Inter', sans-serif" },
    header: { display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '30px' },
    iconCircle: { width: '56px', height: '56px', borderRadius: '16px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    title: { margin: 0, fontSize: '1.8rem', color: '#0f172a', fontWeight: '800' },
    subtitle: { margin: '4px 0 0', color: '#64748b' },
    backBtn: { background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: '8px', borderRadius: '50%', transition: 'background 0.2s' },
    
    card: { backgroundColor: '#fff', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #e2e8f0', minHeight: '400px' },
    
    list: { display: 'flex', flexDirection: 'column' },
    item: { padding: '20px 25px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', transition: 'background 0.2s', ':hover': { backgroundColor: '#f8fafc' } },
    
    iconBox: { padding: '10px', borderRadius: '50%', background: '#f8fafc', border: '1px solid #e2e8f0' },
    itemTitle: { fontWeight: '700', color: '#0f172a', marginBottom: '4px' },
    itemMsg: { color: '#475569', fontSize: '0.95rem' },
    itemDate: { fontSize: '0.8rem', color: '#94a3b8', marginLeft: 'auto', whiteSpace:'nowrap' },
    
    actionBtn: { padding: '6px 12px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', border: 'none', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer' },
    
    empty: { padding: '60px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }
};