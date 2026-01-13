// frontend/src/pages/Home.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../AuthContext'; 
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';

// URLs de API
const API_ORDENES = '/api/ordenes/';
const API_PRODUCTOS = '/api/inventario/productos/';
const API_EXISTENCIAS = '/api/inventario/existencias/';
const API_CLIENTES = '/api/base/clientes/';
const API_ENVIOS = '/api/base/envios/'; 
const API_COMPRAS = '/api/compras/compras/'; 

function Home() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    
    // Estado de Métricas (KPIs)
    const [metrics, setMetrics] = useState({
        card1: { title: "Cargando...", value: "-", icon: "⌛", color: "#ccc" },
        card2: { title: "Cargando...", value: "-", icon: "⌛", color: "#ccc" },
        card3: { title: "Cargando...", value: "-", icon: "⌛", color: "#ccc" },
        card4: { title: "Cargando...", value: "-", icon: "⌛", color: "#ccc" },
    });

    const [chartData, setChartData] = useState([]);
    const [chartTitle, setChartTitle] = useState("Resumen de Actividad");

    const getFormattedName = () => {
        if (!user) return "Usuario";
        const rawName = user.first_name || user.username || "Usuario";
        return rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
    };

    // --- CÁLCULO DE DATOS SEGÚN ROL ---
    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            setLoading(true);

            try {
                const token = localStorage.getItem('auth_token');
                const config = { headers: { Authorization: `Token ${token}` } };
                
                // 1. ROL VENDEDOR
                if (user.tipo === 'VENDEDOR') {
                    const [resOrdenes, resClientes] = await Promise.all([
                        axios.get(`http://127.0.0.1:8000${API_ORDENES}`, config),
                        axios.get(`http://127.0.0.1:8000${API_CLIENTES}`, config)
                    ]);
                    
                    const dataOrdenes = Array.isArray(resOrdenes.data) ? resOrdenes.data : resOrdenes.data.results || [];
                    const dataClientes = Array.isArray(resClientes.data) ? resClientes.data : resClientes.data.results || [];

                    const misOrdenes = dataOrdenes.filter(o => o.id_usuario === (user.id_usuario || user.id));
                    
                    const misVentasTotal = misOrdenes
                        .filter(o => ['APROBADA', 'PREPARADA', 'DESPACHADA', 'ENTREGADA'].includes(o.estado_de_envio))
                        .reduce((acc, curr) => acc + parseFloat(curr.precio_final || 0), 0);
                    
                    const misPendientes = misOrdenes.filter(o => o.estado_de_envio === 'PENDIENTE POR APROBACIÓN').length;
                    
                    const ventasPorFecha = {};
                    misOrdenes.forEach(o => {
                        if (!o.fecha_orden || ['RECHAZADA', 'CANCELADA'].includes(o.estado_de_envio)) return;
                        const fecha = o.fecha_orden.substring(5, 10);
                        ventasPorFecha[fecha] = (ventasPorFecha[fecha] || 0) + parseFloat(o.precio_final || 0);
                    });
                    const dataGrafico = Object.keys(ventasPorFecha)
                        .map(k => ({ name: k, valor: ventasPorFecha[k] }))
                        .sort((a,b) => a.name.localeCompare(b.name))
                        .slice(-7);

                    setMetrics({
                        card1: { title: "Mis Ventas", value: `$${misVentasTotal.toLocaleString()}`, icon: "💰", color: "#2e7d32" },
                        card2: { title: "Mis Clientes", value: dataClientes.length, icon: "👥", color: "#0277bd" },
                        card3: { title: "Por Aprobar", value: misPendientes, icon: "⏳", color: "#f57c00", isAlert: misPendientes > 0 },
                        card4: { title: "Ticket Promedio", value: `$${(misOrdenes.length ? (misVentasTotal/misOrdenes.length) : 0).toFixed(0)}`, icon: "🏷️", color: "#64748b" }
                    });
                    setChartData(dataGrafico.length ? dataGrafico : [{name:'Hoy', valor:0}]);
                    setChartTitle("Tendencia de Mis Ventas");
                
                // 2. ROL ALMACENISTA
                } else if (user.tipo === 'ALMACENISTA') {
                    const [resOrdenes, resExistencias, resCompras] = await Promise.all([
                        axios.get(`http://127.0.0.1:8000${API_ORDENES}`, config),
                        axios.get(`http://127.0.0.1:8000${API_EXISTENCIAS}`, config),
                        axios.get(`http://127.0.0.1:8000${API_COMPRAS}`, config) 
                    ]);

                    const ordenes = Array.isArray(resOrdenes.data) ? resOrdenes.data : resOrdenes.data.results || [];
                    const existencias = Array.isArray(resExistencias.data) ? resExistencias.data : resExistencias.data.results || [];
                    const compras = Array.isArray(resCompras.data) ? resCompras.data : resCompras.data.results || [];

                    const porPreparar = ordenes.filter(o => o.estado_de_envio === 'APROBADA').length;
                    const porRecibir = compras.filter(c => ['APROBADA', 'RECIBIDA_PARCIAL'].includes((c.estado_de_envio || c.estado || "").toUpperCase())).length;
                    
                    let criticos = 0;
                    existencias.forEach(e => { if(e.cantidad < 10) criticos++; });

                    const listasParaEntrega = ordenes.filter(o => o.estado_de_envio === 'PREPARADA').length;

                    setMetrics({
                        card1: { title: "Por Preparar", value: porPreparar, icon: "📦", color: "#f57c00", isAlert: porPreparar > 0 },
                        card2: { title: "Por Recibir", value: porRecibir, icon: "🚛", color: "#0288d1", isAlert: porRecibir > 0 },
                        card3: { title: "Stock Crítico", value: criticos, icon: "🚨", color: "#c62828", isAlert: criticos > 0 },
                        card4: { title: "Listos Entrega", value: listasParaEntrega, icon: "✅", color: "#2e7d32" }
                    });

                    setChartData([
                        {name: 'Preparar', valor: porPreparar}, 
                        {name: 'Recibir', valor: porRecibir}, 
                        {name: 'Listos', valor: listasParaEntrega},
                        {name: 'Críticos', valor: criticos}
                    ]); 
                    setChartTitle("Carga de Trabajo en Almacén");

                // 3. ROL TRANSPORTISTA
                } else if (user.tipo === 'TRANSPORTISTA') {
                    const resEnvios = await axios.get(`http://127.0.0.1:8000${API_ENVIOS}`, config);
                    const misEnvios = Array.isArray(resEnvios.data) ? resEnvios.data : resEnvios.data.results || [];
                    
                    const enviosActivos = misEnvios.filter(e => e.estado === 'EN CURSO' || e.estado === 'LISTO PARA SALIR').length;
                    const entregadosHoy = misEnvios.filter(e => e.estado === 'TERMINADO').length;

                    setMetrics({
                        card1: { title: "En Ruta Ahora", value: enviosActivos, icon: "🚚", color: "#0288d1", isAlert: enviosActivos > 0 },
                        card2: { title: "Entregados Hoy", value: entregadosHoy, icon: "🏁", color: "#2e7d32" },
                        card3: { title: "Rutas Asignadas", value: misEnvios.length, icon: "🗺️", color: "#64748b" },
                        card4: { title: "Incidencias", value: "0", icon: "⚠️", color: "#f57c00" }
                    });

                    setChartData([{name:'Activos', valor: enviosActivos}, {name:'Fin', valor: entregadosHoy}]);
                    setChartTitle("Estado de Mis Envíos");

                // 4. ROL GERENTE / ADMIN (GLOBAL)
                } else {
                    const [resOrdenes, resProd, resExist] = await Promise.all([
                        axios.get(`http://127.0.0.1:8000${API_ORDENES}`, config),
                        axios.get(`http://127.0.0.1:8000${API_PRODUCTOS}`, config),
                        axios.get(`http://127.0.0.1:8000${API_EXISTENCIAS}`, config),
                    ]);

                    const ordenesTotal = Array.isArray(resOrdenes.data) ? resOrdenes.data : resOrdenes.data.results || [];
                    const productosTotal = Array.isArray(resProd.data) ? resProd.data : resProd.data.results || [];
                    const existenciasTotal = Array.isArray(resExist.data) ? resExist.data : resExist.data.results || [];

                    const ventasGlobales = ordenesTotal
                        .filter(o => ['APROBADA', 'PREPARADA', 'DESPACHADA', 'ENTREGADA'].includes(o.estado_de_envio))
                        .reduce((acc, curr) => acc + parseFloat(curr.precio_final || 0), 0);

                    const pendientesGlobal = ordenesTotal.filter(o => o.estado_de_envio === 'PENDIENTE POR APROBACIÓN').length;

                    let valorInv = 0;
                    let criticos = 0;
                    const stockMap = {};
                    existenciasTotal.forEach(e => {
                        const pid = typeof e.id_producto === 'object' ? e.id_producto.id_producto : e.id_producto;
                        stockMap[pid] = e.cantidad;
                        if(e.cantidad < 10) criticos++;
                    });
                    productosTotal.forEach(p => {
                        const qty = stockMap[p.id_producto] || 0;
                        valorInv += parseFloat(p.precio_venta || 0) * qty;
                    });

                    const ventasPorFecha = {};
                    ordenesTotal.forEach(o => {
                        if (!o.fecha_orden || ['RECHAZADA', 'CANCELADA'].includes(o.estado_de_envio)) return;
                        const fecha = o.fecha_orden.substring(5, 10);
                        ventasPorFecha[fecha] = (ventasPorFecha[fecha] || 0) + parseFloat(o.precio_final || 0);
                    });
                    const dataGrafico = Object.keys(ventasPorFecha)
                        .map(k => ({ name: k, valor: ventasPorFecha[k] }))
                        .sort((a,b) => a.name.localeCompare(b.name))
                        .slice(-7);

                    setMetrics({
                        card1: { title: "Ventas Globales", value: `$${ventasGlobales.toLocaleString()}`, icon: "📈", color: "#2e7d32" },
                        card2: { title: "Valor Inventario", value: `$${valorInv.toLocaleString()}`, icon: "💎", color: "#0277bd" },
                        card3: { title: "Pendientes Aprobar", value: pendientesGlobal, icon: "🔔", color: "#f57c00", isAlert: pendientesGlobal > 0 },
                        card4: { title: "Stock Crítico", value: criticos, icon: "🚨", color: "#c62828", isAlert: criticos > 0 }
                    });
                    setChartData(dataGrafico.length ? dataGrafico : [{name:'Hoy', valor:0}]);
                    setChartTitle("Ingresos Globales (Últimos 7 días)");
                }

                setLoading(false);
            } catch (error) {
                console.error("Error Dashboard:", error);
                setLoading(false);
            }
        };

        if (user) fetchData();
    }, [user]);

    const handlePrint = () => window.print();

    const getGreetingTime = () => {
        const h = new Date().getHours();
        if (h < 12) return "Buenos días";
        if (h < 18) return "Buenas tardes";
        return "Buenas noches";
    };

    if (loading) return <div style={{padding: 40, textAlign:'center', color:'#64748b'}}>Cargando Dashboard...</div>;

    return (
        <div style={styles.container} className="print-container responsive-container">
            {/* HEADER */}
            <div style={styles.header} className="responsive-header">
                <div>
                    <h1 style={styles.gradientTitle} className="responsive-title">
                        {getGreetingTime()}, {getFormattedName()}.
                    </h1>
                    <p style={styles.subtitle}>
                        {user.tipo === 'VENDEDOR' ? "Aquí tienes el rendimiento de tus ventas hoy." : 
                         user.tipo === 'ALMACENISTA' ? "Resumen operativo del almacén." :
                         user.tipo === 'TRANSPORTISTA' ? "Tu hoja de ruta y entregas." :
                         "Visión global del negocio y alertas."}
                    </p>
                </div>
                <div style={styles.dateBadge} className="no-print responsive-badge">
                    📅 {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
            </div>

            {/* SECCIÓN 1: KPIs DINÁMICOS */}
            <div style={styles.kpiGrid} className="responsive-grid">
                <KpiCard {...metrics.card1} onClick={() => {
                    if(user.tipo==='ALMACENISTA') navigate('/preparacion');
                    if(user.tipo==='TRANSPORTISTA') navigate('/transporte');
                }} />
                
                <KpiCard {...metrics.card2} onClick={() => {
                    if(user.tipo==='ALMACENISTA') navigate('/recepcion');
                    if(user.tipo==='VENDEDOR') navigate('/clientes');
                    if(user.tipo==='GERENTE') navigate('/inventario');
                }} />
                
                <KpiCard {...metrics.card3} onClick={() => {
                    if(user.tipo==='GERENTE' || user.tipo==='VENDEDOR') navigate('/ordenes');
                    if(user.tipo==='ALMACENISTA') navigate('/inventario');
                }} />
                
                <KpiCard {...metrics.card4} onClick={() => {
                    if(user.tipo==='ALMACENISTA') navigate('/envios');
                }} />
            </div>

            {/* SECCIÓN 2: GRÁFICOS Y ACCIONES */}
            <div style={styles.chartsGrid} className="responsive-chart-grid">
                {/* Gráfico */}
                <div style={styles.chartCard} className="responsive-card">
                    <h3 style={styles.cardTitle}>{chartTitle}</h3>
                    <div style={{ width: '100%', height: 320 }} className="responsive-chart-height">
                        <ResponsiveContainer>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} dy={10} />
                                <YAxis tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} />
                                <RechartsTooltip 
                                    contentStyle={{backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)', color: '#fff'}}
                                    itemStyle={{color: '#fff'}}
                                    labelStyle={{color: '#94a3b8', marginBottom: 5}}
                                />
                                <Area type="monotone" dataKey="valor" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorVentas)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Acciones Rápidas */}
                <div style={styles.actionsCard} className="no-print responsive-card">
                    <h3 style={styles.cardTitle}>Acciones Rápidas</h3>
                    <div style={styles.actionButtonsGrid} className="responsive-actions-grid">
                        
                        {/* VENDEDOR */}
                        {user.tipo === 'VENDEDOR' && (
                            <>
                                <ActionButton icon="🧾" label="Nueva Venta" onClick={() => navigate('/crear-orden')} color="#3b82f6" />
                                <ActionButton icon="👥" label="Mis Clientes" onClick={() => navigate('/clientes')} color="#10b981" />
                            </>
                        )}

                        {/* ALMACENISTA */}
                        {user.tipo === 'ALMACENISTA' && (
                            <>
                                <ActionButton icon="📦" label="Preparación" onClick={() => navigate('/preparacion')} color="#f59e0b" />
                                <ActionButton icon="📥" label="Recepción" onClick={() => navigate('/recepcion')} color="#8b5cf6" />
                                <ActionButton icon="📊" label="Inventario" onClick={() => navigate('/inventario')} color="#64748b" />
                            </>
                        )}

                        {/* TRANSPORTISTA */}
                        {user.tipo === 'TRANSPORTISTA' && (
                            <>
                                <ActionButton icon="🚚" label="Mi Ruta" onClick={() => navigate('/transporte')} color="#0288d1" />
                            </>
                        )}

                        {/* GERENTE / ADMIN */}
                        {(user.tipo === 'GERENTE' || user.tipo === 'ADMINISTRADOR' || user.is_superuser) && (
                            <>
                                <ActionButton icon="📊" label="Reportes" onClick={() => navigate('/ordenes')} color="#3b82f6" />
                                <ActionButton icon="🛒" label="Compras" onClick={() => navigate('/compras')} color="#f59e0b" />
                                <ActionButton icon="👥" label="Usuarios" onClick={() => navigate('/usuarios')} color="#64748b" />
                            </>
                        )}
                        
                        <ActionButton icon="🖨️" label="Imprimir" onClick={handlePrint} color="#8b5cf6" bg="#f5f3ff" />
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- SUBCOMPONENTES ---
const KpiCard = ({ title, value, icon, color, isAlert, onClick }) => (
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
    container: { animation: 'fadeIn 0.8s ease', paddingBottom: '40px', maxWidth: '1400px', margin: '0 auto', padding: '24px 32px' },
    
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
    pulseDot: { width: '12px', height: '12px', backgroundColor: '#ef4444', borderRadius: '50%', boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.7)', animation: 'pulse 2s infinite' },

    chartsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', alignItems: 'start' },
    chartCard: { 
        backgroundColor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
        padding: '32px', borderRadius: '24px', 
        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.05)', border: '1px solid rgba(255,255,255,0.6)',
        gridColumn: 'span 2' 
    },
    actionsCard: { 
        backgroundColor: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(20px)',
        padding: '32px', borderRadius: '24px', 
        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.05)', border: '1px solid rgba(255,255,255,0.4)',
        display: 'flex', flexDirection: 'column'
    },
    cardTitle: { margin: '0 0 24px 0', color: '#334155', fontSize: '1.25rem', fontWeight: '700' },
    
    actionButtonsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' },
    actionBtn: {
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px',
        padding: '20px', borderRadius: '16px', 
        border: '1px solid rgba(255,255,255,0.6)',
        fontSize: '0.9rem', cursor: 'pointer', textAlign: 'center',
        boxShadow: '0 4px 6px rgba(0,0,0,0.02)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }
};

// --- ESTILOS INYECTADOS (Animaciones + Media Queries) ---
const styleSheet = document.createElement("style");
styleSheet.innerText = `
    @keyframes pulse {
        0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
        70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
        100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }
    .action-hover:hover { transform: translateY(-5px); background-color: #fff !important; box-shadow: 0 10px 20px rgba(0,0,0,0.05) !important; }
    .kpi-hover:hover { transform: translateY(-5px); transition: transform 0.3s ease; }
    
    @media (max-width: 1024px) {
        .chartCard { grid-column: span 1; }
    }

    /* --- ESTILOS RESPONSIVE (MÓVIL) --- */
    @media (max-width: 768px) {
        /* Container: Reducir padding */
        .responsive-container { padding: 16px !important; }

        /* Header: Vertical y alineado */
        .responsive-header { 
            flex-direction: column; 
            align-items: flex-start; 
            gap: 15px; 
            margin-bottom: 25px !important; 
        }
        .responsive-title { font-size: 1.8rem !important; }
        .responsive-badge { align-self: flex-start; margin-top: 5px; }

        /* Grillas: 1 columna en móvil */
        .responsive-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
        .responsive-chart-grid { grid-template-columns: 1fr !important; gap: 20px !important; }
        .responsive-actions-grid { grid-template-columns: 1fr 1fr !important; } /* Botones 2 col en móvil */

        /* Tarjetas */
        .responsive-card { 
            padding: 20px !important; 
            grid-column: span 1 !important; 
        }
        
        /* Gráfico altura */
        .responsive-chart-height { height: 250px !important; }
    }

    @media print {
        body * { visibility: hidden; }
        .print-container, .print-container * { visibility: visible; }
        .print-container { position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0; }
        nav, .no-print, button, .recharts-wrapper { display: none !important; }
        .kpiCard, .chartCard { border: 1px solid #ddd !important; box-shadow: none !important; break-inside: avoid; }
    }
`;
document.head.appendChild(styleSheet);

export default Home;