// frontend/src/pages/Home.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../AuthContext'; 
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from 'recharts';

// URLs de API
const API_ORDENES = '/api/ordenes/';
const API_PRODUCTOS = '/api/inventario/productos/';
const API_EXISTENCIAS = '/api/inventario/existencias/';
const API_CLIENTES = '/api/base/clientes/';
const API_ENVIOS = '/api/base/envios/'; 
const API_COMPRAS = '/api/compras/compras/'; 
const API_LOTES = '/api/inventario/lotes/'; // 🚨 AGREGADO

// --- ICONOS SVG ---
const IconExcel = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
const IconPrint = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>;

function Home() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    
    // Datos crudos (Raw Data) - 🚨 SE AGREGA 'lotes'
    const [rawData, setRawData] = useState({ ordenes: [], compras: [], envios: [], clientes: [], productos: [], existencias: [], lotes: [] });

    // Estado del Filtro de Tiempo
    const [timeRange, setTimeRange] = useState('7d'); // '7d', '30d', 'month', 'year'

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

    // --- 1. CARGA INICIAL DE DATOS ---
    useEffect(() => {
        const fetchInitialData = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const token = localStorage.getItem('auth_token');
                const config = { headers: { Authorization: `Token ${token}` } };
                
                // ?page_size=1000 para traer TODO
                // 🚨 AGREGADO: resLotes en la promesa
                const [resOrdenes, resCompras, resEnvios, resClientes, resProd, resExist, resLotes] = await Promise.all([
                    axios.get(`http://127.0.0.1:8000${API_ORDENES}?page_size=1000`, config).catch(() => ({ data: [] })),
                    (user.tipo === 'GERENTE' || user.tipo === 'ALMACENISTA' || user.tipo === 'ADMINISTRADOR') ? axios.get(`http://127.0.0.1:8000${API_COMPRAS}?page_size=1000`, config).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
                    (user.tipo === 'TRANSPORTISTA' || user.tipo === 'ALMACENISTA') ? axios.get(`http://127.0.0.1:8000${API_ENVIOS}?page_size=1000`, config).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
                    (user.tipo === 'VENDEDOR') ? axios.get(`http://127.0.0.1:8000${API_CLIENTES}?page_size=1000`, config).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
                    (user.tipo === 'GERENTE' || user.tipo === 'ALMACENISTA' || user.tipo === 'ADMINISTRADOR') ? axios.get(`http://127.0.0.1:8000${API_PRODUCTOS}?page_size=1000`, config).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
                    (user.tipo === 'GERENTE' || user.tipo === 'ALMACENISTA' || user.tipo === 'ADMINISTRADOR') ? axios.get(`http://127.0.0.1:8000${API_EXISTENCIAS}?page_size=1000`, config).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
                    // 🚨 Nueva llamada para lotes
                    (user.tipo === 'GERENTE' || user.tipo === 'ALMACENISTA' || user.tipo === 'ADMINISTRADOR') ? axios.get(`http://127.0.0.1:8000${API_LOTES}?page_size=1000`, config).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
                ]);

                setRawData({
                    ordenes: Array.isArray(resOrdenes.data) ? resOrdenes.data : resOrdenes.data.results || [],
                    compras: Array.isArray(resCompras.data) ? resCompras.data : resCompras.data.results || [],
                    envios: Array.isArray(resEnvios.data) ? resEnvios.data : resEnvios.data.results || [],
                    clientes: Array.isArray(resClientes.data) ? resClientes.data : resClientes.data.results || [],
                    productos: Array.isArray(resProd.data) ? resProd.data : resProd.data.results || [],
                    existencias: Array.isArray(resExist.data) ? resExist.data : resExist.data.results || [],
                    lotes: Array.isArray(resLotes.data) ? resLotes.data : resLotes.data.results || [], // 🚨 SE GUARDA
                });

                setLoading(false);
            } catch (error) {
                console.error("Error cargando datos iniciales:", error);
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [user]);

    // --- 2. PROCESAMIENTO DE DATOS ---
    useEffect(() => {
        if (loading) return;
        
        const filterByDate = (items, dateField) => {
            if (!items.length) return [];
            const now = new Date();
            const limit = new Date();

            if (timeRange === '7d') limit.setDate(now.getDate() - 7);
            else if (timeRange === '30d') limit.setDate(now.getDate() - 30);
            else if (timeRange === 'month') limit.setDate(1); 
            else if (timeRange === 'year') limit.setMonth(0, 1); 
            
            return items.filter(item => {
                if (!item[dateField]) return false;
                const d = new Date(item[dateField]);
                return d >= limit && d <= now;
            });
        };

        const calcularStockCritico = (productos, existencias) => {
            const existenciasMap = {};
            existencias.forEach(e => {
                const pid = typeof e.id_producto === 'object' ? e.id_producto.id_producto : e.id_producto;
                existenciasMap[pid] = e;
            });

            let contadorCriticos = 0;
            productos.forEach(prod => {
                const ex = existenciasMap[prod.id_producto];
                const cantidad = ex ? Number(ex.cantidad || 0) : 0;
                const estado = ex ? (ex.estado || "").toUpperCase().trim() : 'AGOTADO';

                if (cantidad < 10 || estado === 'AGOTADO') {
                    contadorCriticos++;
                }
            });
            return contadorCriticos;
        };

        // 🚨 FUNCIÓN PARA CALCULAR POR VENCER (30 DÍAS)
        const calcularPorVencer = (lotes) => {
            if (!lotes || !lotes.length) return 0;
            const hoy = new Date();
            const limite = new Date();
            limite.setDate(hoy.getDate() + 30); 

            return lotes.filter(l => {
                if (!l.fecha_vencimiento || parseFloat(l.cantidad) <= 0) return false;
                const d = new Date(l.fecha_vencimiento);
                return d >= hoy && d <= limite;
            }).length;
        };


        // --- LÓGICA POR ROL ---
        if (user.tipo === 'VENDEDOR') {
            const misOrdenes = rawData.ordenes.filter(o => o.id_usuario === (user.id_usuario || user.id));
            const ordenesFiltradas = filterByDate(misOrdenes, 'fecha_orden');

            const totalVentasPeriodo = ordenesFiltradas
                .filter(o => ['APROBADA', 'PREPARADA', 'DESPACHADA', 'ENTREGADA'].includes(o.estado_de_envio))
                .reduce((acc, curr) => acc + parseFloat(curr.precio_final || 0), 0);

            const pendientes = misOrdenes.filter(o => o.estado_de_envio === 'PENDIENTE POR APROBACIÓN').length;
            const ticketPromedio = misOrdenes.length ? (misOrdenes.reduce((a,b)=>a+parseFloat(b.precio_final||0),0) / misOrdenes.length) : 0;

            setMetrics({
                card1: { title: `Ventas (${timeRange.toUpperCase()})`, value: `$${totalVentasPeriodo.toLocaleString()}`, icon: "💰", color: "#2e7d32" },
                card2: { title: "Mis Clientes", value: rawData.clientes.length, icon: "👥", color: "#0277bd" },
                card3: { title: "Por Aprobar", value: pendientes, icon: "⏳", color: "#f57c00", isAlert: pendientes > 0 },
                card4: { title: "Ticket Promedio", value: `$${ticketPromedio.toFixed(0)}`, icon: "🏷️", color: "#64748b" }
            });

            const ventasMap = {};
            ordenesFiltradas.forEach(o => {
                const f = o.fecha_orden ? o.fecha_orden.substring(5, 10) : 'N/A';
                ventasMap[f] = (ventasMap[f] || 0) + parseFloat(o.precio_final || 0);
            });
            const grafico = Object.keys(ventasMap).map(k => ({ name: k, valor: ventasMap[k] })).sort((a,b) => a.name.localeCompare(b.name));
            setChartData(grafico.length ? grafico : [{name:'Sin datos', valor:0}]);
            setChartTitle(`Ventas: ${timeRange === '7d' ? 'Últimos 7 días' : timeRange === '30d' ? 'Últimos 30 días' : 'Este Periodo'}`);
        
        } else if (user.tipo === 'ALMACENISTA') {
            const porPreparar = rawData.ordenes.filter(o => o.estado_de_envio === 'APROBADA').length;
            const porRecibir = rawData.compras.filter(c => (c.estado_de_envio || "").toUpperCase() === 'APROBADA').length;
            
            const criticos = calcularStockCritico(rawData.productos, rawData.existencias);
            const porVencer = calcularPorVencer(rawData.lotes); // 🚨
            const listos = rawData.ordenes.filter(o => o.estado_de_envio === 'PREPARADA').length;

            setMetrics({
                card1: { title: "Por Preparar", value: porPreparar, icon: "📦", color: "#f57c00", isAlert: porPreparar > 0 },
                card2: { title: "Por Recibir", value: porRecibir, icon: "🚛", color: "#0288d1", isAlert: porRecibir > 0 },
                // 🚨 CARD 3: STOCK CRITICO Y POR VENCER UNIFICADOS VISUALMENTE
                card3: { 
                    title: "Alertas Stock", 
                    value: criticos + porVencer, 
                    icon: "🚨", 
                    color: "#c62828", 
                    isAlert: (criticos + porVencer) > 0,
                    details: { critico: criticos, venc: porVencer } // Muestra desglose pequeño
                },
                card4: { title: "Listos Entrega", value: listos, icon: "✅", color: "#2e7d32" }
            });

            setChartData([
                {name: 'Preparar', valor: porPreparar}, 
                {name: 'Recibir', valor: porRecibir}, 
                {name: 'Listos', valor: listos},
                {name: 'Críticos', valor: criticos}
            ]);
            setChartTitle("Carga de Trabajo Actual");

        } else if (user.tipo === 'TRANSPORTISTA') {
            const activos = rawData.envios.filter(e => e.estado === 'EN CURSO' || e.estado === 'LISTO PARA SALIR').length;
            const entregadosFiltrados = filterByDate(rawData.envios, 'fecha_llegada').filter(e => e.estado === 'TERMINADO');

            setMetrics({
                card1: { title: "En Ruta Ahora", value: activos, icon: "🚚", color: "#0288d1", isAlert: activos > 0 },
                card2: { title: `Entregas (${timeRange})`, value: entregadosFiltrados.length, icon: "🏁", color: "#2e7d32" },
                card3: { title: "Rutas Asignadas", value: rawData.envios.length, icon: "🗺️", color: "#64748b" },
                card4: { title: "Incidencias", value: "0", icon: "⚠️", color: "#f57c00" }
            });
            
            setChartData([{name:'Activos', valor: activos}, {name:`Entregados`, valor: entregadosFiltrados.length}]);
            setChartTitle("Productividad de Transporte");

        } else {
            // ADMIN / GERENTE
            const ordenesFiltradas = filterByDate(rawData.ordenes, 'fecha_orden');
            
            const ventasPeriodo = ordenesFiltradas
                .filter(o => ['APROBADA', 'PREPARADA', 'DESPACHADA', 'ENTREGADA'].includes(o.estado_de_envio))
                .reduce((acc, curr) => acc + parseFloat(curr.precio_final || 0), 0);

            const criticos = calcularStockCritico(rawData.productos, rawData.existencias);
            const porVencer = calcularPorVencer(rawData.lotes); // 🚨

            let valorInv = 0;
            const stockMap = {};
            rawData.existencias.forEach(e => {
                const pid = typeof e.id_producto === 'object' ? e.id_producto.id_producto : e.id_producto;
                stockMap[pid] = Number(e.cantidad || 0);
            });
            
            rawData.productos.forEach(p => {
                const qty = stockMap[p.id_producto] || 0;
                valorInv += parseFloat(p.precio_venta || 0) * qty;
            });

            // Lógica roles
            const ventasPend = rawData.ordenes.filter(o => o.estado_de_envio === 'PENDIENTE POR APROBACIÓN').length;
            const comprasPend = rawData.compras.filter(c => c.estado_de_envio === 'PENDIENTE_APROBACION').length;
            const totalPend = ventasPend + comprasPend;

            setMetrics({
                card1: { title: `Ventas (${timeRange.toUpperCase()})`, value: `$${ventasPeriodo.toLocaleString()}`, icon: "📈", color: "#2e7d32" },
                card2: { title: "Valor Inventario", value: `$${valorInv.toLocaleString()}`, icon: "💎", color: "#0277bd" },
                card3: { 
                    title: "Total Pendientes", 
                    value: totalPend, 
                    icon: "🔔", 
                    color: "#f57c00", 
                    isAlert: totalPend > 0,
                    details: { compras: comprasPend, ventas: ventasPend }
                },
                // 🚨 CARD 4: MUESTRA SUMA DE RIESGOS CON DESGLOSE VISUAL
                card4: { 
                    title: "Riesgos Stock", 
                    value: criticos + porVencer, 
                    icon: "🚨", 
                    color: "#c62828", 
                    isAlert: (criticos + porVencer) > 0,
                    details: { critico: criticos, venc: porVencer } // Se usa el estilo de badge existente
                }
            });

            const ventasMap = {};
            ordenesFiltradas.forEach(o => {
                const f = o.fecha_orden ? o.fecha_orden.substring(5, 10) : 'N/A';
                ventasMap[f] = (ventasMap[f] || 0) + parseFloat(o.precio_final || 0);
            });
            const grafico = Object.keys(ventasMap).map(k => ({ name: k, valor: ventasMap[k] })).sort((a,b) => a.name.localeCompare(b.name));
            setChartData(grafico.length ? grafico : [{name:'Sin datos', valor:0}]);
            setChartTitle(`Ingresos: ${timeRange === '7d' ? 'Última Semana' : timeRange === '30d' ? 'Último Mes' : 'Año en curso'}`);
        }

    }, [rawData, timeRange, user]);

    // --- ACCIONES ADICIONALES ---
    const downloadCSV = () => {
        const rows = [
            ["Fecha", "Concepto", "Monto", "ID"],
            ...chartData.map(item => [item.name, "Ingreso Ventas", item.valor, "-"])
        ];
        
        let csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `reporte_ventas_${timeRange}.csv`);
        document.body.appendChild(link);
        link.click();
    };

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
            {/* ---------------------------------------------------- */}
            {/* SECCIÓN OCULTA SOLO PARA IMPRESIÓN (Reporte Formal) */}
            {/* ---------------------------------------------------- */}
            <div className="only-print" style={{display: 'none'}}>
                <div style={{textAlign:'center', marginBottom: 40, borderBottom: '2px solid #0f172a', paddingBottom: 20}}>
                    <h1 style={{margin:0, color: '#0f172a'}}>DIGRAS - REPORTE EJECUTIVO</h1>
                    <p style={{margin:0, color: '#64748b'}}>Generado el: {new Date().toLocaleString()}</p>
                    <p style={{margin:0, color: '#64748b'}}>Generado por: {user.username} ({user.tipo})</p>
                </div>
                
                <h3 style={{marginTop: 30}}>Resumen de KPIs ({timeRange.toUpperCase()})</h3>
                <table style={{width:'100%', borderCollapse:'collapse', marginBottom: 40}}>
                    <thead>
                        <tr style={{background: '#f1f5f9'}}>
                            <th style={styles.printTh}>{metrics.card1.title}</th>
                            <th style={styles.printTh}>{metrics.card2.title}</th>
                            <th style={styles.printTh}>{metrics.card3.title}</th>
                            <th style={styles.printTh}>{metrics.card4.title}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={styles.printTd}>{metrics.card1.value}</td>
                            <td style={styles.printTd}>{metrics.card2.value}</td>
                            <td style={styles.printTd}>{metrics.card3.value}</td>
                            <td style={styles.printTd}>{metrics.card4.value}</td>
                        </tr>
                    </tbody>
                </table>

                <h3>Detalle de Movimientos del Gráfico</h3>
                <table style={{width:'100%', borderCollapse:'collapse', fontSize: '0.8rem'}}>
                    <thead>
                        <tr style={{background: '#f1f5f9'}}>
                            <th style={styles.printTh}>Fecha / Concepto</th>
                            <th style={styles.printTh}>Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {chartData.map((d, i) => (
                            <tr key={i} style={{borderBottom: '1px solid #e2e8f0'}}>
                                <td style={styles.printTd}>{d.name}</td>
                                <td style={styles.printTd}>
                                    {typeof d.valor === 'number' ? `$${d.valor.toLocaleString()}` : d.valor}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div style={{marginTop: 50, textAlign:'center', fontSize:'0.8rem', color:'#94a3b8'}}>
                    Documento confidencial de uso interno - DIGRAS C.A.
                </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* INTERFAZ VISUAL EN PANTALLA */}
            {/* ---------------------------------------------------- */}
            <div className="no-print">
                {/* HEADER */}
                <div style={styles.header} className="responsive-header">
                    <div>
                        <h1 style={styles.titleBig} className="responsive-title">
                            {getGreetingTime()}, {getFormattedName()}.
                        </h1>
                        <p style={styles.subtitle}>
                            {user.tipo === 'VENDEDOR' ? "Aquí tienes el rendimiento de tus ventas hoy." : 
                            user.tipo === 'ALMACENISTA' ? "Resumen operativo del almacén." :
                            user.tipo === 'TRANSPORTISTA' ? "Tu hoja de ruta y entregas." :
                            "Visión global del negocio y alertas."}
                        </p>
                    </div>
                    <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:10}}>
                        <div style={styles.dateBadge} className="responsive-badge">
                            📅 {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </div>
                        
                        {(user.tipo === 'GERENTE' || user.tipo === 'ADMINISTRADOR' || user.tipo === 'VENDEDOR') && (
                            <div style={styles.timeFilterContainer}>
                                <button onClick={() => setTimeRange('7d')} style={timeRange==='7d'?styles.timeBtnActive:styles.timeBtn}>7 Días</button>
                                <button onClick={() => setTimeRange('30d')} style={timeRange==='30d'?styles.timeBtnActive:styles.timeBtn}>30 Días</button>
                                <button onClick={() => setTimeRange('month')} style={timeRange==='month'?styles.timeBtnActive:styles.timeBtn}>Mes</button>
                                <button onClick={() => setTimeRange('year')} style={timeRange==='year'?styles.timeBtnActive:styles.timeBtn}>Año</button>
                            </div>
                        )}
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
                        if(user.tipo==='GERENTE') navigate('/aprobaciones');
                        else if(user.tipo==='VENDEDOR') navigate('/ordenes');
                        else if(user.tipo==='ALMACENISTA') navigate('/inventario');
                        else if(user.tipo==='ADMINISTRADOR') navigate('/compras'); // Corrección admin
                    }} />
                    
                    <KpiCard {...metrics.card4} onClick={() => {
                        if(user.tipo==='ALMACENISTA') navigate('/inventario');
                        if(user.tipo==='GERENTE' || user.tipo==='ADMINISTRADOR' || user.is_superuser) navigate('/inventario');
                    }} />
                </div>

                {/* SECCIÓN 2: GRÁFICOS Y ACCIONES */}
                <div style={styles.chartsGrid} className="responsive-chart-grid">
                    {/* Gráfico */}
                    <div style={styles.chartCard} className="responsive-card">
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 20}}>
                            <h3 style={{...styles.cardTitle, margin:0}}>{chartTitle}</h3>
                            <button onClick={downloadCSV} style={styles.csvBtn} title="Descargar datos en Excel/CSV">
                                <IconExcel /> Exportar CSV
                            </button>
                        </div>
                        
                        <div style={{ width: '100%', height: 320 }} className="responsive-chart-height">
                            <ResponsiveContainer>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} dy={10} />
                                    <YAxis tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} />
                                    <RechartsTooltip 
                                        contentStyle={{backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)', color: '#fff'}}
                                        itemStyle={{color: '#fff'}}
                                        cursor={{fill: '#f1f5f9'}}
                                        labelStyle={{color: '#94a3b8', marginBottom: 5}}
                                    />
                                    <Bar dataKey="valor" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40}>
                                        {
                                            chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#2563eb'} />
                                            ))
                                        }
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Acciones Rápidas */}
                    <div style={styles.actionsCard} className="responsive-card">
                        <h3 style={styles.cardTitle}>Acciones Rápidas</h3>
                        <div style={styles.actionButtonsGrid} className="responsive-actions-grid">
                            
                            {user.tipo === 'VENDEDOR' && (
                                <>
                                    <ActionButton icon="🧾" label="Nueva Venta" onClick={() => navigate('/crear-orden')} color="#3b82f6" />
                                    <ActionButton icon="👥" label="Mis Clientes" onClick={() => navigate('/clientes')} color="#10b981" />
                                </>
                            )}

                            {user.tipo === 'ALMACENISTA' && (
                                <>
                                    <ActionButton icon="📦" label="Preparación" onClick={() => navigate('/preparacion')} color="#f59e0b" />
                                    <ActionButton icon="📥" label="Recepción" onClick={() => navigate('/recepcion')} color="#8b5cf6" />
                                    <ActionButton icon="📊" label="Inventario" onClick={() => navigate('/inventario')} color="#64748b" />
                                </>
                            )}

                            {user.tipo === 'TRANSPORTISTA' && (
                                <>
                                    <ActionButton icon="🚚" label="Mi Ruta" onClick={() => navigate('/transporte')} color="#0288d1" />
                                </>
                            )}

                            {(user.tipo === 'GERENTE' || user.tipo === 'ADMINISTRADOR' || user.is_superuser) && (
                                <>
                                    <ActionButton icon="📊" label="Ventas" onClick={() => navigate('/ordenes')} color="#3b82f6" />
                                    <ActionButton icon="🛒" label="Compras" onClick={() => navigate('/compras')} color="#f59e0b" />
                                    {(user.tipo === 'GERENTE' || user.is_superuser) && (
                                        <ActionButton icon="👥" label="Usuarios" onClick={() => navigate('/usuarios')} color="#64748b" />
                                    )}
                                </>
                            )}
                            
                            <ActionButton icon={<IconPrint />} label="Imprimir" onClick={handlePrint} color="#8b5cf6" bg="#f5f3ff" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- SUBCOMPONENTES ---
const KpiCard = ({ title, value, icon, color, isAlert, onClick, details }) => (
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

        {details && (
            <div style={styles.kpiDetails}>
                {details.compras !== undefined && <span style={styles.detailBadge}>🛒 <b>{details.compras}</b> Comp.</span>}
                {details.ventas !== undefined && <span style={styles.detailBadge}>🧾 <b>{details.ventas}</b> Vent.</span>}
                {/* 🚨 MODIFICADO PARA SOPORTAR NUEVOS DETALLES SIN ROMPER ESTILO */}
                {details.critico !== undefined && <span style={styles.detailBadge}>🔴 <b>{details.critico}</b> Crít.</span>}
                {details.venc !== undefined && <span style={styles.detailBadge}>⚠️ <b>{details.venc}</b> Venc.</span>}
            </div>
        )}

        <div style={styles.kpiTitle}>{title}</div>
    </div>
);

const ActionButton = ({ icon, label, onClick, color, bg }) => (
    <button 
        style={{...styles.actionBtn, color: color, backgroundColor: bg || 'rgba(255,255,255,0.7)'}} 
        onClick={onClick}
        className="action-hover"
    >
        <span style={{fontSize: '1.5rem', display:'flex'}}>{icon}</span>
        <span style={{fontWeight: 600}}>{label}</span>
    </button>
);

// --- ESTILOS ---
const styles = {
    container: { animation: 'fadeIn 0.8s ease', paddingBottom: '40px', maxWidth: '1400px', margin: '0 auto', padding: '24px 32px' },
    
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' },
    titleBig: { 
        fontSize: '2.5rem', fontWeight: '900', margin: 0, letterSpacing: '-1px',
        color: '#0f172a' // Sólido
    },
    subtitle: { color: '#64748b', fontSize: '1.1rem', marginTop: '8px', fontWeight: 500 },
    
    dateBadge: { 
        padding: '10px 20px', backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)',
        borderRadius: '50px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', 
        fontWeight: '700', color: '#475569', border: '1px solid #fff', fontSize: '0.9rem', textTransform: 'capitalize'
    },
    
    // Filtros de tiempo
    timeFilterContainer: { display: 'flex', gap: '5px', background: '#e2e8f0', padding: '4px', borderRadius: '12px' },
    timeBtn: { border: 'none', background: 'transparent', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600', color: '#64748b', cursor: 'pointer', transition: 'all 0.2s' },
    timeBtnActive: { border: 'none', background: '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', color: '#0f172a', cursor: 'default', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },

    kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' },
    kpiCard: { 
        backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)',
        padding: '24px', borderRadius: '20px', 
        boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05)', position: 'relative',
        border: '1px solid rgba(255,255,255,0.5)'
    },
    kpiHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px' },
    kpiIcon: { fontSize: '1.5rem', padding: '12px', borderRadius: '14px', display:'flex', alignItems:'center', justifyContent:'center' },
    kpiValue: { fontSize: '2.2rem', fontWeight: '800', color: '#1e293b', marginBottom: '4px', letterSpacing: '-1px', lineHeight: 1 },
    kpiTitle: { color: '#94a3b8', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' },
    pulseDot: { width: '12px', height: '12px', backgroundColor: '#ef4444', borderRadius: '50%', boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.7)', animation: 'pulse 2s infinite' },

    kpiDetails: { display: 'flex', gap: '8px', marginBottom: '12px', marginTop: '6px', flexWrap: 'wrap' },
    detailBadge: { fontSize: '0.75rem', color: '#475569', backgroundColor: '#f1f5f9', padding: '3px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' },

    chartsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', alignItems: 'start' },
    chartCard: { 
        backgroundColor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
        padding: '32px', borderRadius: '24px', 
        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.05)', border: '1px solid rgba(255,255,255,0.6)',
        gridColumn: 'span 2' 
    },
    csvBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.8rem', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#475569' },
    
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
    },

    // Estilos de Impresión
    printTh: { padding: '10px', borderBottom: '2px solid #000', textAlign: 'left' },
    printTd: { padding: '10px', borderBottom: '1px solid #ddd' }
};

// --- ESTILOS INYECTADOS ---
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
        .responsive-container { padding: 16px !important; }
        .responsive-header { 
            flex-direction: column; align-items: flex-start; gap: 15px; margin-bottom: 25px !important; 
        }
        .responsive-title { font-size: 1.8rem !important; }
        .responsive-badge { align-self: flex-start; margin-top: 5px; }
        .responsive-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
        .responsive-chart-grid { grid-template-columns: 1fr !important; gap: 20px !important; }
        .responsive-actions-grid { grid-template-columns: 1fr 1fr !important; } 
        .responsive-card { padding: 20px !important; grid-column: span 1 !important; }
        .responsive-chart-height { height: 250px !important; }
    }

    /* --- ESTILOS DE IMPRESIÓN (Professional Report) --- */
    @media print {
        @page { margin: 2cm; size: A4; }
        body * { visibility: hidden; }
        
        /* Hacemos visible solo el contenedor de impresión y sus hijos */
        .print-container, .print-container .only-print, .print-container .only-print * { visibility: visible; }
        
        /* Posicionamos el contenedor de impresión sobre todo lo demás */
        .print-container { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            margin: 0; 
            padding: 0; 
            background: white;
        }
        
        /* Forzamos la visualización del bloque only-print */
        .only-print { display: block !important; }
        
        /* Ocultamos explícitamente lo que no queremos */
        .no-print { display: none !important; }
        
        nav { display: none !important; }
    }
`;
document.head.appendChild(styleSheet);

export default Home;