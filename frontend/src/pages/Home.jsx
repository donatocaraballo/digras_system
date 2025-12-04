// frontend/src/pages/Home.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
    AreaChart, Area, BarChart, Bar, Legend
} from 'recharts';

// URLs de tus APIs
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

    // Estado para Gráficos
    const [salesData, setSalesData] = useState([]);
    const [topProducts, setTopProducts] = useState([]);

    // --- CÁLCULO DE DATOS EN TIEMPO REAL ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Obtenemos token para evitar el 401
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

                // 1. KPI: Total Ventas (Solo aprobadas/pagadas)
                const ventas = ordenes
                    .filter(o => o.estado_de_envio === 'APROBADA' || o.estado_de_envio === 'PREPARADA' || o.estado_de_envio === 'DESPACHADA')
                    .reduce((acc, curr) => acc + parseFloat(curr.precio_final), 0);

                // 2. KPI: Pendientes
                const pendientes = ordenes.filter(o => o.estado_de_envio === 'PENDIENTE POR APROBACIÓN').length;

                // 3. KPI: Valor Inventario y Críticos
                let valorInv = 0;
                let criticos = 0;
                
                // Mapa de stock
                const stockMap = {};
                existencias.forEach(e => {
                    const pid = typeof e.id_producto === 'object' ? e.id_producto.id_producto : e.id_producto;
                    stockMap[pid] = e.cantidad;
                    if(e.cantidad < 10) criticos++;
                });

                productos.forEach(p => {
                    const qty = stockMap[p.id_producto] || 0;
                    valorInv += parseFloat(p.precio_venta) * qty;
                });

                setMetrics({
                    totalVentas: ventas,
                    ordenesPendientes: pendientes,
                    productosCriticos: criticos,
                    valorInventario: valorInv
                });

                // 4. DATOS GRÁFICO: Ventas por Fecha (Simulado agrupando órdenes)
                // Agrupamos las órdenes por fecha para el gráfico
                const ventasPorFecha = {};
                ordenes.forEach(o => {
                    const fecha = o.fecha_orden.substring(5, 10); // MM-DD
                    if (!ventasPorFecha[fecha]) ventasPorFecha[fecha] = 0;
                    ventasPorFecha[fecha] += parseFloat(o.precio_final);
                });
                
                // Convertir a array para Recharts
                const chartData = Object.keys(ventasPorFecha).map(key => ({
                    name: key,
                    ventas: ventasPorFecha[key]
                })).sort((a, b) => a.name.localeCompare(b.name)).slice(-7); // Últimos 7 días

                setSalesData(chartData.length > 0 ? chartData : [{name: 'Hoy', ventas: 0}]);

                setLoading(false);

            } catch (error) {
                console.error("Error cargando dashboard:", error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div style={styles.container}>
            {/* HEADER */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Panel de Control</h1>
                    <p style={styles.subtitle}>Resumen de operaciones en tiempo real.</p>
                </div>
                <div style={styles.dateBadge}>
                    📅 {new Date().toLocaleDateString()}
                </div>
            </div>

            {/* SECCIÓN 1: KPIs (Tarjetas Superiores) */}
            <div style={styles.kpiGrid}>
                <KpiCard 
                    title="Ventas Totales" 
                    value={`$${metrics.totalVentas.toLocaleString('en-US', {minimumFractionDigits: 2})}`} 
                    icon="💰" 
                    color="#2e7d32" // Verde
                    trend="+12% vs mes anterior"
                />
                <KpiCard 
                    title="Valor Inventario" 
                    value={`$${metrics.valorInventario.toLocaleString('en-US', {minimumFractionDigits: 2})}`} 
                    icon="💎" 
                    color="#0277bd" // Azul
                    trend="Activos valorizados"
                />
                <KpiCard 
                    title="Órdenes Pendientes" 
                    value={metrics.ordenesPendientes} 
                    icon="🔔" 
                    color="#f57c00" // Naranja
                    isAlert={metrics.ordenesPendientes > 0}
                    onClick={() => navigate('/ordenes')}
                />
                <KpiCard 
                    title="Stock Crítico" 
                    value={metrics.productosCriticos} 
                    icon="🚨" 
                    color="#c62828" // Rojo
                    isAlert={metrics.productosCriticos > 0}
                    trend="Productos < 10 unid."
                    onClick={() => navigate('/inventario')}
                />
            </div>

            {/* SECCIÓN 2: GRÁFICOS (Área Central) */}
            <div style={styles.chartsGrid}>
                
                {/* GRÁFICO PRINCIPAL: TENDENCIA DE VENTAS */}
                <div style={styles.chartCard}>
                    <h3 style={styles.chartTitle}>Tendencia de Ingresos (Últimos días)</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <AreaChart data={salesData}>
                                <defs>
                                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0d47a1" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#0d47a1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                <XAxis dataKey="name" tick={{fill: '#666'}} axisLine={false} tickLine={false} />
                                <YAxis tick={{fill: '#666'}} axisLine={false} tickLine={false} prefix="$" />
                                <RechartsTooltip 
                                    contentStyle={{borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)'}}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="ventas" 
                                    stroke="#0d47a1" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorVentas)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* ACCESOS RÁPIDOS (Lateral) */}
                <div style={styles.actionsCard}>
                    <h3 style={styles.chartTitle}>Acciones Rápidas</h3>
                    <div style={styles.actionButtonsGrid}>
                        <button style={styles.actionBtn} onClick={() => navigate('/crear-orden-simple')}>
                            <span style={styles.actionIcon}>🧾</span> Nueva Venta
                        </button>
                        <button style={styles.actionBtn} onClick={() => navigate('/recepcion')}>
                            <span style={styles.actionIcon}>📦</span> Recibir Mercancía
                        </button>
                        <button style={styles.actionBtn} onClick={() => navigate('/proveedores')}>
                            <span style={styles.actionIcon}>🚚</span> Proveedores
                        </button>
                        <button style={{...styles.actionBtn, background: '#e3f2fd', color: '#0d47a1'}} onClick={() => window.print()}>
                            <span style={styles.actionIcon}>🖨️</span> Reporte PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- COMPONENTE KPI CARD ---
const KpiCard = ({ title, value, icon, color, trend, isAlert, onClick }) => (
    <div 
        style={{...styles.kpiCard, cursor: onClick ? 'pointer' : 'default', borderLeft: `5px solid ${color}`}}
        onClick={onClick}
        className="kpi-hover"
    >
        <div style={styles.kpiHeader}>
            <span style={{...styles.kpiIcon, backgroundColor: `${color}20`, color: color}}>{icon}</span>
            {isAlert && <span style={styles.pulseDot}></span>}
        </div>
        <div style={styles.kpiValue}>{value}</div>
        <div style={styles.kpiTitle}>{title}</div>
        {trend && <div style={styles.kpiTrend}>{trend}</div>}
    </div>
);

// --- ESTILOS ---
const styles = {
    container: {
        animation: 'fadeIn 0.8s ease',
        paddingBottom: '40px',
    },
    header: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'
    },
    title: {
        fontSize: '2.2rem', fontWeight: '800', color: '#2d3436', margin: 0
    },
    subtitle: {
        color: '#636e72', fontSize: '1.1rem', marginTop: '5px'
    },
    dateBadge: {
        padding: '8px 16px', backgroundColor: 'white', borderRadius: '20px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)', fontWeight: 'bold', color: '#555'
    },
    
    // Grid de KPIs
    kpiGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '25px',
        marginBottom: '30px'
    },
    kpiCard: {
        backgroundColor: 'white', padding: '25px', borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)', position: 'relative',
        transition: 'transform 0.2s, box-shadow 0.2s',
    },
    kpiHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' },
    kpiIcon: { fontSize: '1.5rem', padding: '12px', borderRadius: '12px' },
    kpiValue: { fontSize: '2rem', fontWeight: '800', color: '#2d3436', marginBottom: '5px' },
    kpiTitle: { color: '#b2bec3', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' },
    kpiTrend: { marginTop: '10px', fontSize: '0.8rem', color: '#00b894', fontWeight: '600' },
    
    pulseDot: {
        width: '10px', height: '10px', backgroundColor: '#ff7675', borderRadius: '50%',
        boxShadow: '0 0 0 0 rgba(255, 118, 117, 0.7)',
        animation: 'pulse 2s infinite'
    },

    // Gráficos y Acciones
    chartsGrid: {
        display: 'grid',
        gridTemplateColumns: '2fr 1fr', // 2/3 para gráfica, 1/3 para acciones
        gap: '25px',
        alignItems: 'start'
    },
    chartCard: {
        backgroundColor: 'white', padding: '30px', borderRadius: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
    },
    actionsCard: {
        backgroundColor: 'white', padding: '30px', borderRadius: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)', height: '100%'
    },
    chartTitle: { margin: '0 0 25px 0', color: '#2d3436', fontSize: '1.2rem' },
    
    actionButtonsGrid: { display: 'flex', flexDirection: 'column', gap: '15px' },
    actionBtn: {
        display: 'flex', alignItems: 'center', gap: '15px',
        padding: '15px', borderRadius: '12px', border: '1px solid #f1f2f6',
        backgroundColor: 'white', fontSize: '1rem', fontWeight: '600', color: '#636e72',
        cursor: 'pointer', transition: 'all 0.2s',
        textAlign: 'left',
        boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
    },
    actionIcon: { fontSize: '1.4rem' }
};

// Inyección de Keyframes
const styleSheet = document.createElement("style");
styleSheet.innerText = `
    @keyframes pulse {
        0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 118, 117, 0.7); }
        70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(255, 118, 117, 0); }
        100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 118, 117, 0); }
    }
    .kpi-hover:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(0,0,0,0.08) !important; }
    .recharts-cartesian-grid-horizontal line, .recharts-cartesian-grid-vertical line { stroke-opacity: 0.5; }
`;
document.head.appendChild(styleSheet);

export default Home;