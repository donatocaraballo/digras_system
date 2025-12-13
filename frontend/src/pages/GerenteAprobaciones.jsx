// frontend/src/pages/GerenteAprobaciones.jsx

import React, { useEffect, useState } from "react";
import api from "../api/api";

// --- ICONOS SVG ---
const IconShield = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>;
const IconCheck = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const IconX = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const IconInfo = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>;

// --- ESTILOS PREMIUM DIGRAS ---
const styles = {
  page: {
    paddingTop: "40px", // 🚨 AJUSTE: Separación del Navbar
    paddingBottom: "40px",
    fontFamily: "'Segoe UI', 'Roboto', sans-serif",
    maxWidth: "1400px",
    margin: "0 auto",
  },
  
  // HEADER FLOTANTE
  headerRow: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "25px",
    paddingLeft: "10px",
  },
  iconCircle: {
    width: '56px', height: '56px', borderRadius: '14px', 
    backgroundColor: '#e0f2fe', color: '#0284c7', // Azul suave
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  },
  title: {
    fontSize: "1.8rem",
    fontWeight: "800",
    color: "#0f172a", // Azul oscuro
    margin: 0,
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: "1rem",
    color: "#64748b",
    marginTop: "4px",
  },

  // LAYOUT DE COLUMNAS
  columns: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.8fr) minmax(0, 1.2fr)", 
    gap: "30px",
    alignItems: "flex-start",
  },

  // --- TARJETA BLANCA PARA TABLAS (IZQUIERDA) ---
  listsCard: {
    background: "#ffffff",
    borderRadius: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
    padding: "30px",
    border: "1px solid #f0f0f0",
  },

  // Barra de Resumen (Mensaje) dentro de la tabla
  summaryBar: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#f0f9ff", // Azul muy claro
    border: "1px solid #bae6fd",
    color: "#0369a1",
    padding: "10px 15px",
    borderRadius: "10px",
    fontSize: "0.9rem",
    fontWeight: "600",
    marginBottom: "25px",
  },

  // Secciones dentro de la tarjeta
  sectionTitle: {
    fontSize: "0.95rem",
    fontWeight: "700",
    color: "#334155",
    marginBottom: "15px",
    paddingLeft: "8px",
    borderLeft: "4px solid #0d47a1", // Línea acento azul
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },

  // Tabla
  tableWrapper: {
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
    boxShadow: "0 2px 5px rgba(0,0,0,0.03)",
    marginBottom: "30px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.85rem",
  },
  th: {
    background: "#f8fafc",
    textAlign: "left",
    padding: "12px 15px",
    borderBottom: "1px solid #e2e8f0",
    color: "#475569",
    fontWeight: "700",
    textTransform: "uppercase",
    fontSize: "0.75rem",
  },
  td: {
    padding: "12px 15px",
    borderBottom: "1px solid #f1f5f9",
    color: "#334155",
    verticalAlign: "middle",
  },
  rowAlt: {
    background: "#f8fafc",
  },
  
  // Botones Pequeños
  btnSmall: {
    padding: "6px 12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    background: "transparent",
    color: "#64748b",
    fontSize: "0.75rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s"
  },

  // --- DETALLE (DERECHA) ---
  detailWrapper: {
    position: "sticky",
    top: "20px", // Flota al hacer scroll
  },
  detailCard: {
    background: "#eff6ff", // Azul muy claro
    borderRadius: "20px",
    padding: "25px",
    border: "1px solid #bfdbfe",
    boxShadow: "0 10px 25px rgba(37, 99, 235, 0.05)",
  },
  detailTitle: {
    fontSize: "1.3rem",
    fontWeight: "800",
    color: "#1e3a8a",
    marginBottom: "5px",
  },
  detailSubtitle: {
    fontSize: "0.85rem",
    fontWeight: "600",
    color: "#60a5fa",
    marginBottom: "20px",
    borderBottom: "2px solid #bfdbfe",
    paddingBottom: "10px",
  },
  detailLine: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "10px",
    fontSize: "0.9rem",
    color: "#1e293b",
    borderBottom: "1px dotted #bfdbfe",
    paddingBottom: "5px",
  },
  detailLabel: {
    fontWeight: "600",
    color: "#64748b",
  },

  // Tabla Interna Detalle
  detailTable: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "15px",
    marginBottom: "15px",
    backgroundColor: "#fff",
    borderRadius: "8px",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
    fontSize: "0.85rem",
  },
  detailTh: {
    background: "#dbeafe",
    padding: "8px 10px",
    textAlign: "left",
    fontWeight: "700",
    color: "#1e40af",
    fontSize: "0.75rem",
  },
  detailTd: {
    padding: "8px 10px",
    borderBottom: "1px solid #f1f5f9",
    color: "#334155",
  },

  // Botones Grandes de Acción
  actionsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "15px",
    marginTop: "20px",
  },
  btnApprove: {
    display: "flex", justifyContent: "center", alignItems: "center", gap: "6px",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)", // Verde vibrante
    color: "#fff",
    fontWeight: "700",
    fontSize: "0.9rem",
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(22, 163, 74, 0.3)",
  },
  btnReject: {
    display: "flex", justifyContent: "center", alignItems: "center", gap: "6px",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #fecaca",
    background: "#fff1f2",
    color: "#ef4444",
    fontWeight: "700",
    fontSize: "0.9rem",
    cursor: "pointer",
  },
  btnClear: {
    gridColumn: "1 / -1",
    padding: "10px",
    background: "transparent",
    border: "none",
    color: "#64748b",
    fontSize: "0.85rem",
    cursor: "pointer",
    textDecoration: "underline",
    textAlign: "center",
  },

  // Badges y Mensajes
  pillEstado: (bg, color) => ({
    display: "inline-block", padding: "3px 10px", borderRadius: "20px",
    fontSize: "0.7rem", fontWeight: "700", background: bg, color: color,
    border: `1px solid ${bg}`, whiteSpace: 'nowrap'
  }),
  statusTextError: { padding: '12px', background: '#fee2e2', color: '#991b1b', borderRadius: '10px', marginBottom: '20px', border: '1px solid #fecaca', fontSize: '0.9rem' },
  emptyState: { padding: '30px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' },
  emptyDetail: { padding: '40px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', border: '2px dashed #cbd5e1', borderRadius: '16px', background:'#f8fafc' }
};

// Helper de Estado
function pillEstadoEnvio(estado) {
  if (!estado) return styles.pillEstado("#e5e7eb", "#374151");
  const t = estado.toUpperCase();
  if (t.includes("PENDIENTE")) return styles.pillEstado("#fef3c7", "#a16207"); // Naranja
  if (t.includes("APROBADA")) return styles.pillEstado("#dcfce7", "#166534"); // Verde
  if (t.includes("RECHAZADA")) return styles.pillEstado("#fee2e2", "#b91c1c"); // Rojo
  return styles.pillEstado("#e5e7eb", "#374151");
}

export default function GerenteAprobaciones() {
  const [ordenesPendientes, setOrdenesPendientes] = useState([]);
  const [comprasPendientes, setComprasPendientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [seleccion, setSeleccion] = useState(null);

  const cargarPendientes = async () => {
    setLoading(true); setError(""); setMensaje("");
    try {
      const resOrdenes = await api.get("/ordenes/", { params: { estado_envio: "PENDIENTE POR APROBACIÓN" } });
      const dataOrdenes = Array.isArray(resOrdenes.data) ? resOrdenes.data : resOrdenes.data.results || [];

      const resCompras = await api.get("/compras/compras/");
      const dataComprasRaw = Array.isArray(resCompras.data) ? resCompras.data : resCompras.data.results || [];
      const dataCompras = dataComprasRaw.filter((c) => {
        if (!c.estado_de_envio) return false;
        const norm = String(c.estado_de_envio).replace("_", " ").toUpperCase();
        return norm.includes("PENDIENTE") && norm.includes("APROB");
      });

      setOrdenesPendientes(dataOrdenes);
      setComprasPendientes(dataCompras);
      setMensaje(`Órdenes pendientes: ${dataOrdenes.length} | Compras pendientes: ${dataCompras.length}`);
    } catch (err) {
      setError("No se pudieron cargar los datos pendientes.");
    } finally { setLoading(false); }
  };

  useEffect(() => { cargarPendientes(); }, []);

  const verOrden = async (orden) => {
    setSeleccion({ tipo: "orden", item: orden, detalles: [], loading: true, error: "" });
    try {
      const res = await api.get(`/ordenes/${orden.id_orden}/detalles/`);
      const detalles = Array.isArray(res.data) ? res.data : res.data.results || [];
      setSeleccion((prev) => (prev && prev.tipo === "orden" && prev.item.id_orden === orden.id_orden ? { ...prev, detalles, loading: false } : prev));
    } catch (err) {
      setSeleccion((prev) => (prev ? { ...prev, loading: false, error: "Error al cargar detalles." } : prev));
    }
  };

  const verCompra = async (compra) => {
    setSeleccion({ tipo: "compra", item: compra, detalles: [], loading: true, error: "" });
    try {
      const res = await api.get("/compras/detalle-compras/", { params: { id_compra: compra.id_compra } });
      const raw = Array.isArray(res.data) ? res.data : res.data.results || [];
      const detalles = raw.filter((d) => {
        const val = d.id_compra_id ?? d.id_compra ?? (typeof d.id_compra === "object" ? d.id_compra.id_compra : null);
        return Number(val) === Number(compra.id_compra);
      });
      setSeleccion((prev) => (prev && prev.tipo === "compra" && prev.item.id_compra === compra.id_compra ? { ...prev, detalles, loading: false } : prev));
    } catch (err) {
      setSeleccion((prev) => (prev ? { ...prev, loading: false, error: "Error al cargar detalles." } : prev));
    }
  };

  const aprobarSeleccion = async () => {
    if (!seleccion) return;
    try {
      if (seleccion.tipo === "orden") await api.post(`/ordenes/${seleccion.item.id_orden}/aprobar/`);
      else await api.post(`/compras/compras/${seleccion.item.id_compra}/aprobar/`);
      setSeleccion(null); await cargarPendientes(); alert("Aprobado correctamente.");
    } catch (err) { alert("No se pudo aprobar. Verifica permisos."); }
  };

  const rechazarSeleccion = async () => {
    if (!seleccion) return;
    if (!window.confirm("¿Seguro que deseas RECHAZAR esta solicitud?")) return;
    try {
      if (seleccion.tipo === "orden") await api.post(`/ordenes/${seleccion.item.id_orden}/rechazar/`);
      else await api.post(`/compras/compras/${seleccion.item.id_compra}/rechazar/`);
      setSeleccion(null); await cargarPendientes(); alert("Rechazado correctamente.");
    } catch (err) { alert("No se pudo rechazar."); }
  };

  const totalDetallesSeleccion = () => {
    if (!seleccion || !seleccion.detalles) return 0;
    return seleccion.detalles.reduce((acc, d) => acc + Number(d.subtotal ?? 0), 0);
  };

  return (
    <div style={styles.page}>
      
      {/* 1. HEADER FLOTANTE (FUERA DE LA TARJETA) */}
      <div style={styles.headerRow}>
         <div style={styles.iconCircle}><IconShield /></div>
         <div>
            <h2 style={styles.title}>Aprobaciones Gerenciales</h2>
            <p style={styles.subtitle}>Gestión de solicitudes pendientes de Ventas y Compras</p>
         </div>
      </div>

      {error && <div style={styles.statusTextError}>{error}</div>}

      <div style={styles.columns}>
        
        {/* COLUMNA IZQUIERDA: LISTAS (TARJETA BLANCA) */}
        <div style={styles.listsCard}>
          
          {/* 🚨 AQUÍ ESTÁ EL MENSAJE DE RESUMEN (DENTRO DE LA TARJETA) */}
          {mensaje && (
              <div style={styles.summaryBar}>
                  <IconInfo />
                  <span>{mensaje}</span>
              </div>
          )}

          {/* ÓRDENES DE VENTA */}
          <div style={styles.sectionTitle}>Órdenes de Venta ({ordenesPendientes.length})</div>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Cliente</th>
                  <th style={styles.th}>Fecha</th>
                  <th style={styles.th}>Total</th>
                  <th style={styles.th}>Estado</th>
                  <th style={{...styles.th, textAlign:'center'}}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {ordenesPendientes.length === 0 && (
                  <tr><td colSpan={6} style={styles.emptyState}>No hay órdenes pendientes.</td></tr>
                )}
                {ordenesPendientes.map((o, idx) => {
                  const isSelected = seleccion && seleccion.tipo === 'orden' && seleccion.item.id_orden === o.id_orden;
                  const rowStyle = {
                      ...styles.td,
                      ...(idx % 2 === 1 ? styles.rowAlt : {}),
                      background: isSelected ? '#eff6ff' : (idx % 2 === 1 ? '#f8fafc' : '#fff'),
                      borderLeft: isSelected ? '4px solid #2563eb' : 'none'
                  };
                  return (
                    <tr key={o.id_orden} style={{cursor:'pointer'}} onClick={() => verOrden(o)}>
                      <td style={{...rowStyle, fontWeight:'bold', color:'#2563eb'}}>#{o.id_orden}</td>
                      <td style={rowStyle}>{o.id_cliente_nombre || `Cli #${o.id_cliente}`}</td>
                      <td style={rowStyle}>{o.fecha_orden}</td>
                      <td style={rowStyle}>Bs {Number(o.precio_final || 0).toFixed(2)}</td>
                      <td style={rowStyle}><span style={pillEstadoEnvio(o.estado_de_envio)}>{o.estado_de_envio.replace(/_/g, " ")}</span></td>
                      <td style={{...rowStyle, textAlign:'center'}}><button style={styles.btnSmall}>Ver</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ÓRDENES DE COMPRA */}
          <div style={{...styles.sectionTitle, borderLeftColor:'#16a34a', marginTop:'40px'}}>Órdenes de Compra ({comprasPendientes.length})</div>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Proveedor</th>
                  <th style={styles.th}>Fecha</th>
                  <th style={styles.th}>Total</th>
                  <th style={styles.th}>Estado</th>
                  <th style={{...styles.th, textAlign:'center'}}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {comprasPendientes.length === 0 && (
                  <tr><td colSpan={6} style={styles.emptyState}>No hay compras pendientes.</td></tr>
                )}
                {comprasPendientes.map((c, idx) => {
                  const isSelected = seleccion && seleccion.tipo === 'compra' && seleccion.item.id_compra === c.id_compra;
                  const rowStyle = {
                      ...styles.td,
                      ...(idx % 2 === 1 ? styles.rowAlt : {}),
                      background: isSelected ? '#eff6ff' : (idx % 2 === 1 ? '#f8fafc' : '#fff'),
                      borderLeft: isSelected ? '4px solid #16a34a' : 'none'
                  };
                  return (
                    <tr key={c.id_compra} style={{cursor:'pointer'}} onClick={() => verCompra(c)}>
                      <td style={{...rowStyle, fontWeight:'bold', color:'#16a34a'}}>#{c.id_compra}</td>
                      <td style={rowStyle}>{c.id_proveedor_nombre || `Prov #${c.id_proveedor}`}</td>
                      <td style={rowStyle}>{c.fecha_pedido}</td>
                      <td style={rowStyle}>$ {Number(c.precio_final || 0).toFixed(2)}</td>
                      <td style={rowStyle}><span style={pillEstadoEnvio(c.estado_de_envio)}>{c.estado_de_envio.replace(/_/g, " ")}</span></td>
                      <td style={{...rowStyle, textAlign:'center'}}><button style={styles.btnSmall}>Ver</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* COLUMNA DERECHA: DETALLE (STICKY) */}
        <div style={styles.detailWrapper}>
          {!seleccion ? (
              <div style={styles.emptyDetail}>
                  Selecciona un ítem de la lista para ver sus detalles y gestionar su aprobación.
              </div>
          ) : (
              <div style={styles.detailCard}>
                  <div style={styles.detailHeader}>
                      <h3 style={styles.detailTitle}>
                          {seleccion.tipo === "orden" ? "📦 Orden de Venta" : "🛒 Orden de Compra"}
                      </h3>
                      <div style={styles.detailSubtitle}>ID: #{seleccion.item.id_orden || seleccion.item.id_compra}</div>
                  </div>

                  {/* INFO GENERAL */}
                  <div style={styles.detailLine}>
                      <span style={styles.detailLabel}>Solicitante:</span>
                      <span>{seleccion.item.id_usuario_username || "Sistema"}</span>
                  </div>
                  <div style={styles.detailLine}>
                      <span style={styles.detailLabel}>Entidad:</span>
                      <span>{seleccion.item.id_cliente_nombre || seleccion.item.id_proveedor_nombre || "Desconocido"}</span>
                  </div>
                  <div style={styles.detailLine}>
                      <span style={styles.detailLabel}>Método Pago:</span>
                      <span>{seleccion.item.metodo_pago}</span>
                  </div>
                  <div style={styles.detailLine}>
                      <span style={styles.detailLabel}>Estado:</span>
                      <span style={pillEstadoEnvio(seleccion.item.estado_de_envio)}>{seleccion.item.estado_de_envio}</span>
                  </div>

                  {/* Tabla interna de productos */}
                  <div style={{marginTop: '20px', fontWeight:'700', color:'#1e40af', fontSize:'0.8rem', textTransform:'uppercase'}}>Items</div>
                  {seleccion.loading ? (
                      <div style={{padding:20, textAlign:'center', color:'#64748b'}}>Cargando items...</div>
                  ) : (
                      <table style={styles.detailTable}>
                          <thead>
                              <tr>
                                  <th style={styles.detailTh}>Producto</th>
                                  <th style={styles.detailTh}>Cant.</th>
                                  <th style={styles.detailTh}>Total</th>
                              </tr>
                          </thead>
                          <tbody>
                              {seleccion.detalles.map((d, i) => (
                                  <tr key={i}>
                                      <td style={styles.detailTd}>
                                          {d.id_producto_nombre || (d.id_producto?.nombre) || "Item"}
                                      </td>
                                      <td style={styles.detailTd}>{d.cantidad}</td>
                                      <td style={{...styles.detailTd, textAlign:'right', fontWeight:'bold'}}>
                                          {Number(d.subtotal).toFixed(2)}
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  )}

                  <div style={{textAlign:'right', fontSize:'1.2rem', fontWeight:'800', color:'#0d47a1', marginBottom:'20px'}}>
                      Total: {seleccion.tipo === 'orden' ? 'Bs' : '$'} {totalDetallesSeleccion().toFixed(2)}
                  </div>

                  {/* ACCIONES */}
                  <div style={styles.actionsGrid}>
                      <button style={styles.btnApprove} onClick={aprobarSeleccion} disabled={seleccion.loading}>
                          <IconCheck /> Aprobar
                      </button>
                      <button style={styles.btnReject} onClick={rechazarSeleccion} disabled={seleccion.loading}>
                          <IconX /> Rechazar
                      </button>
                      <button style={styles.btnClear} onClick={() => setSeleccion(null)}>
                          Cancelar selección
                      </button>
                  </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
}