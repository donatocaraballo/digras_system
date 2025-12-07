// frontend/src/pages/Home.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';

// URLs
const API_ORDENES = '/api/ordenes/';
const API_PRODUCTOS = '/api/inventario/productos/';
const API_EXISTENCIAS = '/api/inventario/existencias/';

function Home() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    
    // Estado de Métricas
    const [metrics, setMetrics] = useState({
        totalVentas: 0,
        ordenesPendientes: 0,
        productosCriticos: 0,
        valorInventario: 0
    });

    const [salesData, setSalesData] = useState([]);

    // --- CÁLCULO DE DATOS ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                const config = { headers: { Authorization: `Token ${token}` } };

                const [resOrdenes, resProd, resExist] = await Promise.all([
                    axios.get(`http://127.0.0.1:8000${API_ORDENES}`, config),
                    axios.get(`http://127.0.0.1:8000${API_PRODUCTOS}`, config),
                    axios.get(`http://127.0.0.1:8000${API_EXISTENCIAS}`, config),
                ]);

                const ordenes = resOrdenes.data;
                const productos = resProd.data;
                const existencias = resExist.data;

                // KPI: Ventas
                const ventas = ordenes
                    .filter(o => ['APROBADA', 'PREPARADA', 'DESPACHADA', 'ENTREGADA'].includes(o.estado_de_envio))
                    .reduce((acc, curr) => acc + parseFloat(curr.precio_final || 0), 0);

                // KPI: Pendientes
                const pendientes = ordenes.filter(o => o.estado_de_envio === 'PENDIENTE POR APROBACIÓN').length;

                // KPI: Inventario
                let valorInv = 0;
                let criticos = 0;
                const stockMap = {};
                existencias.forEach(e => {
                    const pid = typeof e.id_producto === 'object' ? e.id_producto.id_producto : e.id_producto;
                    stockMap[pid] = e.cantidad;
                    if(e.cantidad < 10) criticos++;
                });
                productos.forEach(p => {
                    const qty = stockMap[p.id_producto] || 0;
                    valorInv += parseFloat(p.precio_venta || 0) * qty;
                });

                setMetrics({
                    totalVentas: ventas,
                    ordenesPendientes: pendientes,
                    productosCriticos: criticos,
                    valorInventario: valorInv
                });

                // Gráfico
                const ventasPorFecha = {};
                ordenes.forEach(o => {
                    if (!o.fecha_orden) return;
                    const fecha = o.fecha_orden.substring(5, 10);
                    if (!ventasPorFecha[fecha]) ventasPorFecha[fecha] = 0;
                    ventasPorFecha[fecha] += parseFloat(o.precio_final || 0);
                });
                
                const chartData = Object.keys(ventasPorFecha).map(key => ({
                    name: key,
                    ventas: ventasPorFecha[key]
                })).sort((a, b) => a.name.localeCompare(b.name)).slice(-7);

                setSalesData(chartData.length > 0 ? chartData : [{name: 'Hoy', ventas: 0}]);
                setLoading(false);

            } catch (error) {
                console.error("Error Dashboard:", error);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handlePrint = () => window.print();

    // Saludo Dinámico
    const getGreeting = () => {
        const h = new Date().getHours();
        if (h < 12) return "Buenos días";
        if (h < 18) return "Buenas tardes";
        return "Buenas noches";
    };

    if (loading) return <div style={{padding: 40, textAlign:'center', color:'#64748b'}}>Cargando Sistema...</div>;

    return (
        <div style={styles.container} className="print-container">
            {/* HEADER CON DEGRADADO */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.gradientTitle}>
                        {getGreeting()}, Gerente.
                    </h1>
                    <p style={styles.subtitle}>Aquí tienes el resumen de operaciones de hoy.</p>
                </div>
                <div style={styles.dateBadge} className="no-print">
                    📅 {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
            </div>

            {/* SECCIÓN 1: KPIs */}
            <div style={styles.kpiGrid}>
                <KpiCard title="Ventas Totales" value={`$${metrics.totalVentas.toLocaleString()}`} icon="💰" color="#2e7d32" trend="+12% vs mes anterior" />
                <KpiCard title="Valor Inventario" value={`$${metrics.valorInventario.toLocaleString()}`} icon="💎" color="#0277bd" trend="Activos valorizados" />
                <KpiCard title="Órdenes Pendientes" value={metrics.ordenesPendientes} icon="🔔" color="#f57c00" isAlert={metrics.ordenesPendientes > 0} onClick={() => navigate('/ordenes')} />
                <KpiCard title="Stock Crítico" value={metrics.productosCriticos} icon="🚨" color="#c62828" isAlert={metrics.productosCriticos > 0} trend="Productos < 10 unid." onClick={() => navigate('/inventario')} />
            </div>

            {/* SECCIÓN 2: GRÁFICOS Y ACCIONES */}
            <div style={styles.chartsGrid}>
                {/* Gráfico */}
                <div style={styles.chartCard}>
                    <h3 style={styles.cardTitle}>Tendencia de Ingresos</h3>
                    <div style={{ width: '100%', height: 320 }}>
                        <ResponsiveContainer>
                            <AreaChart data={salesData}>
                                <defs>
                                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} dy={10} />
                                <YAxis tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} prefix="$" />
                                <RechartsTooltip 
                                    contentStyle={{backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)', color: '#fff'}}
                                    itemStyle={{color: '#fff'}}
                                    labelStyle={{color: '#94a3b8', marginBottom: 5}}
                                />
                                <Area type="monotone" dataKey="ventas" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorVentas)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Acciones Rápidas (Glassmorphism) */}
                <div style={styles.actionsCard} className="no-print">
                    <h3 style={styles.cardTitle}>Acciones Rápidas</h3>
                    <div style={styles.actionButtonsGrid}>
                        <ActionButton icon="🧾" label="Nueva Venta" onClick={() => navigate('/crear-orden-simple')} color="#3b82f6" />
                        <ActionButton icon="📦" label="Recibir Mercancía" onClick={() => navigate('/recepcion')} color="#f59e0b" />
                        <ActionButton icon="🚚" label="Proveedores" onClick={() => navigate('/proveedores')} color="#64748b" />
                        <ActionButton icon="🖨️" label="Imprimir Reporte" onClick={handlePrint} color="#8b5cf6" bg="#f5f3ff" />
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- SUBCOMPONENTES ---
const KpiCard = ({ title, value, icon, color, trend, isAlert, onClick }) => (
    <div 
        style={{...styles.kpiCard, cursor: onClick ? 'pointer' : 'default', borderLeft: `4px solid ${color}`}}
        onClick={onClick}
        className="kpi-hover"
    >
        <div style={styles.kpiHeader}>
            <span style={{...styles.kpiIcon, backgroundColor: `${color}15`, color: color}}>{icon}</span>
            {isAlert && <span style={styles.pulseDot}></span>}
        </div>
        <div style={styles.kpiValue}>{value}</div>
        <div style={styles.kpiTitle}>{title}</div>
        {trend && <div style={styles.kpiTrend}>{trend}</div>}
    </div>
);

const ActionButton = ({ icon, label, onClick, color, bg }) => (
    <button 
        style={{...styles.actionBtn, color: color, backgroundColor: bg || 'rgba(255,255,255,0.7)'}} 
        onClick={onClick}
        className="action-hover"
    >
        <span style={{fontSize: '1.5rem'}}>{icon}</span>
        <span style={{fontWeight: 600}}>{label}</span>
    </button>
);

// --- ESTILOS ---
const styles = {
    container: { animation: 'fadeIn 0.8s ease', paddingBottom: '40px' },
    
    // Header
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' },
    gradientTitle: { 
        fontSize: '2.5rem', fontWeight: '900', margin: 0, letterSpacing: '-1px',
        background: 'linear-gradient(to right, #0f172a, #3b82f6)', 
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' 
    },
    subtitle: { color: '#64748b', fontSize: '1.1rem', marginTop: '8px', fontWeight: 500 },
    dateBadge: { 
        padding: '10px 20px', backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)',
        borderRadius: '50px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', 
        fontWeight: '700', color: '#475569', border: '1px solid #fff', fontSize: '0.9rem', textTransform: 'capitalize'
    },
    
    // KPIs
    kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' },
    kpiCard: { 
        backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)',
        padding: '24px', borderRadius: '20px', 
        boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05)', position: 'relative',
        border: '1px solid rgba(255,255,255,0.5)'
    },
    kpiHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '16px' },
    kpiIcon: { fontSize: '1.5rem', padding: '12px', borderRadius: '14px' },
    kpiValue: { fontSize: '2.2rem', fontWeight: '800', color: '#1e293b', marginBottom: '4px', letterSpacing: '-1px' },
    kpiTitle: { color: '#94a3b8', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' },
    kpiTrend: { marginTop: '12px', fontSize: '0.85rem', color: '#10b981', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' },
    pulseDot: { width: '12px', height: '12px', backgroundColor: '#ef4444', borderRadius: '50%', boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.7)', animation: 'pulse 2s infinite' },

    // Gráficos
    chartsGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'stretch' },
    chartCard: { 
        backgroundColor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
        padding: '32px', borderRadius: '24px', 
        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.05)', border: '1px solid rgba(255,255,255,0.6)'
    },
    actionsCard: { 
        backgroundColor: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(20px)', // Efecto Glassmorphism fuerte
        padding: '32px', borderRadius: '24px', 
        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.05)', border: '1px solid rgba(255,255,255,0.4)',
        display: 'flex', flexDirection: 'column'
    },
    cardTitle: { margin: '0 0 24px 0', color: '#334155', fontSize: '1.25rem', fontWeight: '700' },
    
    // Botones
    actionButtonsGrid: { display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 },
    actionBtn: {
        display: 'flex', alignItems: 'center', gap: '16px',
        padding: '18px 24px', borderRadius: '16px', 
        border: '1px solid rgba(255,255,255,0.6)',
        fontSize: '1rem', cursor: 'pointer', textAlign: 'left',
        boxShadow: '0 4px 6px rgba(0,0,0,0.02)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }
};

// --- ESTILOS DE IMPRESIÓN ---
const styleSheet = document.createElement("style");
styleSheet.innerText = `
    @keyframes pulse {
        0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
        70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
        100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }
    .action-hover:hover { transform: translateX(8px); background-color: #fff !important; box-shadow: 0 10px 20px rgba(0,0,0,0.05) !important; }
    
    @media print {
        body * { visibility: hidden; }
        .print-container, .print-container * { visibility: visible; }
        .print-container { position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0; }
        nav, .no-print, button, .recharts-wrapper { display: none !important; }
        .kpiCard, .chartCard { border: 1px solid #ddd !important; box-shadow: none !important; break-inside: avoid; }
        .chartsGrid { display: block !important; }
        .chartCard { margin-bottom: 20px; page-break-inside: avoid; }
    }
`;
document.head.appendChild(styleSheet);

export default Home;