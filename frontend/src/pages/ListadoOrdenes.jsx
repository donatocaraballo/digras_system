// frontend/src/pages/ListadoOrdenes.jsx

import React, { useEffect, useState } from "react";
import api from "../api/api";

// --- ICONOS SVG ---
const IconClipboard = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>;
const IconSearch = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const IconRefresh = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>;
const IconEye = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>;

export default function ListadoOrdenes() {
  const [ordenes, setOrdenes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [productos, setProductos] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [detallesOrdenSeleccionada, setDetallesOrdenSeleccionada] = useState([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState("");

  const [filtros, setFiltros] = useState({
    id: "",
    estadoEnvio: "",
    estadoPago: "",
    cliente: "",
    vendedor: "",
    desde: "",
    hasta: "",
    ordering: "-fecha_orden",
  });

  // --- HELPERS DE COLOR (Estados) ---
  const getEnvioStyle = (status) => {
    if (!status) return { bg: '#f1f5f9', text: '#64748b' };
    const s = status.toUpperCase();
    if (s.includes('PENDIENTE')) return { bg: '#fff7ed', text: '#c2410c' }; // Naranja suave
    if (s.includes('APROBADA')) return { bg: '#dcfce7', text: '#15803d' }; // Verde
    if (s.includes('ENTREGADA')) return { bg: '#bbf7d0', text: '#14532d' }; // Verde fuerte
    if (s.includes('CANCELADA')) return { bg: '#fee2e2', text: '#991b1b' }; // Rojo
    return { bg: '#e0f2fe', text: '#0284c7' }; // Azul (En proceso)
  };

  const getPagoStyle = (status) => {
    if (!status) return { bg: '#f1f5f9', text: '#64748b' };
    const s = status.toUpperCase();
    if (s.includes('PAGADA')) return { bg: '#dcfce7', text: '#15803d' }; // Verde
    return { bg: '#fff7ed', text: '#c2410c' }; // Naranja (Pendiente)
  };

  // --- LÓGICA DE DATOS ---
  const nombreCliente = (idCliente) => {
    const c = clientes.find((c) => c.id_cliente === idCliente);
    return c ? c.nombre : `#${idCliente}`;
  };

  const nombreVendedor = (idUsuario) => {
    if (!idUsuario) return "";
    const v = vendedores.find((u) => u.id_usuario === idUsuario || u.id === idUsuario);
    return v ? v.username : `#${idUsuario}`;
  };

  const cargarDatosMaestros = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const config = { headers: { Authorization: `Token ${token}` } };
      const [resClientes, resUsuarios, resProductos] = await Promise.all([
        api.get("/base/clientes/", config),
        api.get("/base/usuarios/", config),
        api.get("/inventario/productos/", config)
      ]);
      setClientes(resClientes.data);
      const usuariosData = Array.isArray(resUsuarios.data) ? resUsuarios.data : resUsuarios.data.results || [];
      setVendedores(usuariosData.filter((u) => u.tipo === "VENDEDOR"));
      setProductos(resProductos.data);
    } catch (err) { console.error("Error maestros:", err); }
  };

  const cargarOrdenes = async (conMensaje = false) => {
    setLoading(true);
    setError("");
    if (conMensaje) setMensaje("");
    try {
      const params = {};
      if (filtros.id) params.id = filtros.id;
      if (filtros.estadoEnvio) params.estado_envio = filtros.estadoEnvio;
      if (filtros.estadoPago) params.estado_pago = filtros.estadoPago;
      if (filtros.cliente) params.cliente = filtros.cliente;
      if (filtros.vendedor) params.vendedor = filtros.vendedor;
      if (filtros.desde) params.desde = filtros.desde;
      if (filtros.hasta) params.hasta = filtros.hasta;
      if (filtros.ordering) params.ordering = filtros.ordering;

      const res = await api.get("/ordenes/", { params });
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setOrdenes(data);
      if (conMensaje) setMensaje(`Se encontraron ${data.length} orden(es).`);
    } catch (err) {
      const status = err.response?.status;
      const backendMsg = err.response?.data?.error || err.response?.data?.detail;
      if (status === 403 && backendMsg) setError(backendMsg);
      else setError("No se pudieron cargar las órdenes.");
    } finally { setLoading(false); }
  };

  const verDetallesOrden = async (idOrden) => {
    // Toggle: Si ya está abierta, la cerramos
    if (ordenSeleccionada && ordenSeleccionada.id_orden === idOrden) {
        setOrdenSeleccionada(null);
        return;
    }

    setLoadingDetalle(true);
    setErrorDetalle("");
    setOrdenSeleccionada(null);
    setDetallesOrdenSeleccionada([]);
    try {
      const [resOrden, resDetalles] = await Promise.all([
        api.get(`/ordenes/${idOrden}/`),
        api.get(`/ordenes/${idOrden}/detalles/`),
      ]);
      setOrdenSeleccionada(resOrden.data);
      setDetallesOrdenSeleccionada(Array.isArray(resDetalles.data) ? resDetalles.data : resDetalles.data.results || []);
      
      // Scroll suave hacia el detalle
      setTimeout(() => document.getElementById('detalle-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    } catch (err) { setErrorDetalle("Error al cargar detalles."); } finally { setLoadingDetalle(false); }
  };

  useEffect(() => {
    cargarDatosMaestros();
    cargarOrdenes(false);
    // eslint-disable-next-line
  }, []);

  const onChangeFiltro = (campo, valor) => setFiltros((prev) => ({ ...prev, [campo]: valor }));
  const limpiarFiltros = () => {
    setFiltros({ id: "", estadoEnvio: "", estadoPago: "", cliente: "", vendedor: "", desde: "", hasta: "", ordering: "-fecha_orden" });
    setTimeout(() => cargarOrdenes(false), 100);
  };

  const totalOrdenDesdeDetalles = () => {
    if (!detallesOrdenSeleccionada.length) return 0;
    return detallesOrdenSeleccionada.reduce((acc, d) => {
      const prodId = d.id_producto?.id_producto || d.id_producto;
      const producto = productos.find((p) => p.id_producto === prodId);
      const precio = d.precio_unitario ?? producto?.precio_venta ?? 0;
      const subtotal = d.subtotal ?? precio * (d.cantidad ?? 0);
      return acc + Number(subtotal);
    }, 0);
  };

  // --- RENDERIZADO ---
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        
        {/* HEADER CON ICONO */}
        <div style={styles.header}>
            <div style={styles.titleGroup}>
                <div style={styles.iconCircle}><IconClipboard /></div>
                <div>
                    <h2 style={styles.title}>Historial de Ventas</h2>
                    <p style={styles.subtitle}>Consulta y gestión de órdenes emitidas</p>
                </div>
            </div>
        </div>

        {mensaje && <div style={{padding: '12px', background: '#dcfce7', color: '#166534', borderRadius: '8px', marginBottom: '20px'}}> {mensaje} </div>}
        {error && <div style={{padding: '12px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '20px'}}> {error} </div>}

        {/* FILTROS (Estilo Unificado) */}
        <div style={styles.filtersWrapper}>
            <div style={styles.filtersGrid}>
                <div>
                    <label style={styles.label}>ID Orden</label>
                    <input type="number" style={styles.input} placeholder="#" value={filtros.id} onChange={(e) => onChangeFiltro("id", e.target.value)} />
                </div>
                <div>
                    <label style={styles.label}>Cliente</label>
                    <select style={styles.select} value={filtros.cliente} onChange={(e) => onChangeFiltro("cliente", e.target.value)}>
                        <option value="">Todos</option>
                        {clientes.map((c) => <option key={c.id_cliente} value={c.nombre}>{c.nombre}</option>)}
                    </select>
                </div>
                <div>
                    <label style={styles.label}>Estado Envío</label>
                    <select style={styles.select} value={filtros.estadoEnvio} onChange={(e) => onChangeFiltro("estadoEnvio", e.target.value)}>
                        <option value="">Todos</option>
                        <option value="PENDIENTE POR APROBACIÓN">Pendiente</option>
                        <option value="APROBADA">Aprobada</option>
                        <option value="ENTREGADA">Entregada</option>
                        <option value="CANCELADA">Cancelada</option>
                    </select>
                </div>
                <div>
                    <label style={styles.label}>Estado Pago</label>
                    <select style={styles.select} value={filtros.estadoPago} onChange={(e) => onChangeFiltro("estadoPago", e.target.value)}>
                        <option value="">Todos</option>
                        <option value="PENDIENTE POR PAGO">Pendiente</option>
                        <option value="PAGADA">Pagada</option>
                    </select>
                </div>
                <div>
                    <label style={styles.label}>Desde</label>
                    <input type="date" style={styles.input} value={filtros.desde} onChange={(e) => onChangeFiltro("desde", e.target.value)} />
                </div>
                <div>
                    <label style={styles.label}>Hasta</label>
                    <input type="date" style={styles.input} value={filtros.hasta} onChange={(e) => onChangeFiltro("hasta", e.target.value)} />
                </div>
            </div>
            <div style={{display:'flex', justifyContent:'flex-end', gap:'10px', marginTop:'15px'}}>
                <button style={styles.btnGhost} onClick={limpiarFiltros}>
                    <IconRefresh /> Limpiar
                </button>
                <button style={styles.btnPrimary} onClick={() => cargarOrdenes(true)} disabled={loading}>
                    <IconSearch /> {loading ? "Buscando..." : "Buscar"}
                </button>
            </div>
        </div>

        {/* TABLA PRINCIPAL */}
        <div style={styles.content}>
            <div style={{overflowX: 'auto'}}>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.theadRow}>
                            <th style={styles.th}>ID</th>
                            <th style={styles.th}>Cliente</th>
                            <th style={styles.th}>Método</th>
                            <th style={styles.th}>Fecha</th>
                            <th style={styles.th}>Envío</th>
                            <th style={styles.th}>Pago</th>
                            <th style={styles.th}>Total</th>
                            <th style={styles.thAction}>Ver</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ordenes.length === 0 && !loading && (
                            <tr><td colSpan={8} style={{padding:40, textAlign:'center', color:'#94a3b8'}}>No hay órdenes registradas.</td></tr>
                        )}
                        {ordenes.map((o, idx) => {
                            const isSelected = ordenSeleccionada?.id_orden === o.id_orden;
                            const envioStyle = getEnvioStyle(o.estado_de_envio);
                            const pagoStyle = getPagoStyle(o.estado_de_pago);
                            
                            return (
                                <tr 
                                    key={o.id_orden} 
                                    style={{
                                        borderBottom: '1px solid #f1f5f9',
                                        backgroundColor: isSelected ? '#eff6ff' : (idx % 2 === 0 ? '#ffffff' : '#fafafa'),
                                        transition: 'background 0.2s',
                                        borderLeft: isSelected ? '4px solid #2563eb' : '4px solid transparent',
                                        cursor: 'pointer' // 👈 Cursor de mano en toda la fila
                                    }}
                                    onClick={() => verDetallesOrden(o.id_orden)} // 👈 Clic en toda la fila
                                >
                                    <td style={styles.tdBold}>#{o.id_orden}</td>
                                    <td style={styles.td}>{nombreCliente(o.id_cliente)}</td>
                                    <td style={styles.td}>{o.metodo_pago}</td>
                                    <td style={styles.td}>{o.fecha_orden}</td>
                                    <td style={styles.td}>
                                        <span style={{...styles.badge, backgroundColor: envioStyle.bg, color: envioStyle.text}}>
                                            {o.estado_de_envio?.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td style={styles.td}>
                                        <span style={{...styles.badge, backgroundColor: pagoStyle.bg, color: pagoStyle.text}}>
                                            {o.estado_de_pago?.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td style={styles.tdAmount}>Bs {Number(o.precio_final || 0).toFixed(2)}</td>
                                    <td style={styles.tdAction}>
                                        <button 
                                            // No necesitamos onClick aquí porque está en el <tr>, 
                                            // pero lo dejamos por accesibilidad o estilo.
                                            style={{...styles.iconBtn, color: isSelected ? '#2563eb' : '#64748b'}}
                                            title="Ver Detalles"
                                        >
                                            <IconEye />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>

        {/* DETALLE DESPLEGABLE (Premium Card) */}
        {(ordenSeleccionada || loadingDetalle || errorDetalle) && (
            <div id="detalle-card" style={styles.detailWrapper}>
                {loadingDetalle && <div style={{textAlign:'center', padding:20, color:'#64748b'}}>Cargando detalles...</div>}
                {errorDetalle && <div style={{textAlign:'center', padding:20, color:'#ef4444'}}>{errorDetalle}</div>}

                {ordenSeleccionada && !loadingDetalle && !errorDetalle && (
                    <div style={styles.detailCard}>
                        {/* Header del Detalle */}
                        <div style={{display:'flex', justifyContent:'space-between', borderBottom:'1px solid #e2e8f0', paddingBottom:15, marginBottom:20}}>
                            <h3 style={{margin:0, color:'#0f172a', display:'flex', alignItems:'center', gap:10}}>
                                📋 Detalle de Orden #{ordenSeleccionada.id_orden}
                                <span style={{fontSize:'0.8rem', fontWeight:400, color:'#64748b', backgroundColor:'#f1f5f9', padding:'2px 8px', borderRadius:4}}>
                                    {ordenSeleccionada.fecha_orden}
                                </span>
                            </h3>
                        </div>

                        {/* Grid de Información General y Estados */}
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:30, marginBottom:30}}>
                            
                            {/* Columna 1: Info */}
                            <div style={styles.infoBox}>
                                <h4 style={styles.sectionTitle}>Información General</h4>
                                <div style={styles.infoRow}><span style={styles.infoLabel}>Cliente:</span> <span>{nombreCliente(ordenSeleccionada.id_cliente)}</span></div>
                                <div style={styles.infoRow}><span style={styles.infoLabel}>Vendedor:</span> <span>{nombreVendedor(ordenSeleccionada.id_usuario)}</span></div>
                                <div style={styles.infoRow}><span style={styles.infoLabel}>Método Pago:</span> <span>{ordenSeleccionada.metodo_pago}</span></div>
                            </div>

                            {/* Columna 2: Estados */}
                            <div style={styles.infoBox}>
                                <h4 style={styles.sectionTitle}>Estado de la Orden</h4>
                                <div style={styles.infoRow}>
                                    <span style={styles.infoLabel}>Envío:</span> 
                                    <span style={{...styles.badge, ...getEnvioStyle(ordenSeleccionada.estado_de_envio)}}>
                                        {ordenSeleccionada.estado_de_envio}
                                    </span>
                                </div>
                                <div style={styles.infoRow}>
                                    <span style={styles.infoLabel}>Pago:</span> 
                                    <span style={{...styles.badge, ...getPagoStyle(ordenSeleccionada.estado_de_pago)}}>
                                        {ordenSeleccionada.estado_de_pago}
                                    </span>
                                </div>
                                <div style={styles.infoRow}>
                                    <span style={styles.infoLabel}>Estatus:</span> 
                                    <span style={{fontWeight:'bold', color: ordenSeleccionada.cancelacion ? '#ef4444' : '#10b981'}}>
                                        {ordenSeleccionada.cancelacion ? 'CANCELADA' : 'ACTIVA'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Tabla de Productos Interna */}
                        <h4 style={styles.sectionTitle}>Productos Incluidos</h4>
                        <table style={{width:'100%', borderCollapse:'collapse', fontSize:'0.9rem', marginBottom:20}}>
                            <thead style={{backgroundColor:'#f8fafc', borderBottom:'1px solid #e2e8f0'}}>
                                <tr>
                                    <th style={{padding:10, textAlign:'left', color:'#475569'}}>Producto</th>
                                    <th style={{padding:10, textAlign:'center', color:'#475569'}}>Cant.</th>
                                    <th style={{padding:10, textAlign:'right', color:'#475569'}}>Precio U.</th>
                                    <th style={{padding:10, textAlign:'right', color:'#475569'}}>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {detallesOrdenSeleccionada.length === 0 ? (
                                    <tr><td colSpan={4} style={{padding:20, textAlign:'center', color:'#94a3b8'}}>Sin productos.</td></tr>
                                ) : detallesOrdenSeleccionada.map((d, i) => {
                                    const prodId = d.id_producto?.id_producto || d.id_producto;
                                    const prod = productos.find(p => p.id_producto === prodId);
                                    const nombre = prod?.nombre || d.id_producto?.nombre || `#${prodId}`;
                                    const precio = d.precio_unitario ?? prod?.precio_venta ?? 0;
                                    const sub = d.subtotal ?? precio * (d.cantidad ?? 0);
                                    return (
                                        <tr key={i} style={{borderBottom:'1px solid #f1f5f9'}}>
                                            <td style={{padding:10, color:'#334155'}}>{nombre}</td>
                                            <td style={{padding:10, textAlign:'center', color:'#334155'}}>{d.cantidad}</td>
                                            <td style={{padding:10, textAlign:'right', color:'#334155'}}>Bs {Number(precio).toFixed(2)}</td>
                                            <td style={{padding:10, textAlign:'right', fontWeight:'600', color:'#0f172a'}}>Bs {Number(sub).toFixed(2)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        <div style={{textAlign:'right', fontSize:'1.2rem', fontWeight:'bold', color:'#0f172a', borderTop:'2px solid #e2e8f0', paddingTop:15}}>
                            Total: Bs {totalOrdenDesdeDetalles().toFixed(2)}
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
}

// --- ESTILOS CSS-IN-JS (Premium) ---
const styles = {
    container: { padding: '24px 32px', maxWidth: '1400px', margin: '0 auto', fontFamily: "'Inter', sans-serif" },
    
    // Header
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
    titleGroup: { display: 'flex', alignItems: 'center', gap: '16px' },
    iconCircle: { width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    title: { margin: 0, fontSize: '1.5rem', color: '#0f172a', fontWeight: '700' },
    subtitle: { margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' },
    
    // Filtros
    filtersWrapper: { backgroundColor: '#f8fafc', padding: '20px', borderRadius: '16px', marginBottom: '24px', border: '1px solid #e2e8f0' },
    filtersGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' },
    label: { display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' },
    input: { width: '100%', height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', backgroundColor: '#fff', boxSizing:'border-box' },
    select: { width: '100%', height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', backgroundColor: '#fff', boxSizing:'border-box' },
    btnPrimary: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize:'0.9rem' },
    btnGhost: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: 'transparent', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize:'0.9rem' },

    // Tabla Content
    content: { backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', overflow: 'hidden', border: '1px solid #f1f5f9' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' },
    theadRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
    th: { padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' },
    thAction: { padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' },
    td: { padding: '14px 16px', color: '#334155', verticalAlign: 'middle' },
    tdBold: { padding: '14px 16px', color: '#0f172a', fontWeight: '600', verticalAlign: 'middle' },
    tdAmount: { padding: '14px 16px', color: '#0f172a', fontWeight: '700', fontFamily: 'monospace', verticalAlign: 'middle' },
    tdAction: { padding: '14px 16px', textAlign: 'center', verticalAlign: 'middle' },
    badge: { display: 'inline-block', padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '700', whiteSpace: 'nowrap' },
    iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'background 0.2s' },

    // Detalle Card
    detailWrapper: { marginTop: '24px', animation: 'fadeIn 0.3s ease-out' },
    detailCard: { backgroundColor: '#ffffff', borderRadius: '16px', padding: '30px', boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0' },
    infoBox: { backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #f1f5f9' },
    sectionTitle: { margin: '0 0 15px 0', fontSize: '0.85rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' },
    infoRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.95rem', color: '#334155' },
    infoLabel: { fontWeight: '600', color: '#475569' }
};

// Inyectar animación
const styleSheet = document.createElement("style");
styleSheet.innerText = `@keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`;
document.head.appendChild(styleSheet);