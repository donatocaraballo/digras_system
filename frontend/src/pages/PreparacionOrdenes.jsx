// frontend/src/pages/PreparacionOrdenes.jsx

import React, { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import api from "../api/api";
import { toast } from "react-hot-toast";

// --- ICONOS SVG ---
const IconBox = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>;
const IconCheck = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const IconSearch = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;

// --- ESTILOS PREMIUM DIGRAS ---
const styles = {
  // Layout Principal
  page: {
    paddingTop: "40px",
    paddingBottom: "40px",
    fontFamily: "'Segoe UI', 'Roboto', sans-serif",
    maxWidth: "1400px",
    margin: "0 auto",
  },
  
  // Header Flotante
  headerRow: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "25px",
    paddingLeft: "10px",
  },
  iconCircle: {
    width: '56px', height: '56px', borderRadius: '14px', 
    backgroundColor: '#e0f2fe', color: '#0284c7', 
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  },
  title: {
    fontSize: "1.8rem",
    fontWeight: "800",
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: "1rem",
    color: "#64748b",
    marginTop: "4px",
  },

  // Tarjeta Principal
  card: {
    background: "#ffffff",
    borderRadius: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
    padding: "30px",
    border: "1px solid #f0f0f0",
  },

  // Secciones
  sectionTitle: {
    fontSize: "1.1rem",
    fontWeight: "700",
    color: "#334155",
    marginBottom: "15px",
    marginTop: "30px",
    paddingLeft: "8px",
    borderLeft: "4px solid #0d47a1",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  sectionSubtitle: {
    fontSize: "0.9rem",
    color: "#64748b",
    marginBottom: "20px",
    lineHeight: "1.4",
  },

  // Tabla
  tableWrapper: {
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
    boxShadow: "0 2px 5px rgba(0,0,0,0.02)",
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

  // Botones
  buttonPrimary: {
    border: "none",
    borderRadius: "10px",
    padding: "0 16px",
    height: "36px",
    background: "#0f172a", // Azul Sólido
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.2)",
    transition: "transform 0.1s",
    whiteSpace: "nowrap"
  },
  buttonSecondary: {
    borderRadius: "10px",
    padding: "0 12px",
    height: "36px",
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    color: "#64748b",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: "600",
    transition: "background 0.2s",
  },

  // Badges
  badgeEstado: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: "20px",
    fontSize: "0.7rem",
    fontWeight: "700",
    background: "#e0f2fe",
    color: "#0369a1",
    border: "1px solid #bae6fd",
    textTransform: 'uppercase'
  },

  // Mensajes
  statusTextOk: { padding: '12px', background: '#dcfce7', color: '#166534', borderRadius: '10px', marginBottom: '20px', border: '1px solid #bbf7d0', fontSize: '0.9rem' },
  statusTextError: { padding: '12px', background: '#fee2e2', color: '#991b1b', borderRadius: '10px', marginBottom: '20px', border: '1px solid #fecaca', fontSize: '0.9rem' },
  resumenResultados: { fontSize: "0.85rem", color: "#64748b", marginTop: "10px", textAlign: "right", fontStyle: "italic" },

  // --- MODALES (AJUSTADO PARA CENTRADO PERFECTO) ---
  modalOverlay: {
    position: "fixed", 
    inset: 0, 
    background: "rgba(15, 23, 42, 0.6)", // Fondo oscuro semitransparente
    backdropFilter: "blur(4px)", // Efecto borroso elegante
    display: "flex", 
    justifyContent: "center", 
    alignItems: "center", 
    zIndex: 10000, // 🚨 Z-INDEX ALTO para estar sobre el Navbar
    padding: "40px", // 🚨 PADDING para evitar que toque los bordes
  },
  modalCard: {
    width: "100%", 
    maxWidth: "700px", 
    maxHeight: "90vh", // Altura máxima segura
    background: "#ffffff", 
    borderRadius: "16px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", 
    padding: "30px", 
    boxSizing: "border-box", 
    overflowY: "auto", // Scroll interno si es muy larga
    animation: "scaleUp 0.2s ease-out",
    position: "relative", // Para contexto de apilamiento
  },
  
  // Estilos internos del modal
  modalHeaderRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' },
  modalTitle: { fontSize: "1.3rem", fontWeight: "700", color: "#0f172a", margin: 0 },
  modalCloseButton: { border: "none", background: "transparent", cursor: "pointer", fontSize: "1.2rem", color: "#94a3b8" },
  
  modalSectionTitle: { fontSize: "0.85rem", fontWeight: "700", color: "#0f172a", marginTop: "20px", marginBottom: "10px", textTransform: "uppercase", borderBottom: '2px solid #e0f2fe', paddingBottom: '5px', display: 'inline-block' },
  modalLine: { fontSize: "0.9rem", marginBottom: "8px", color: "#334155", display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #f1f5f9', paddingBottom: '4px' },
  
  modalDetalleTable: { width: "100%", borderCollapse: "collapse", marginTop: "10px", fontSize: "0.85rem", border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' },
  modalDetalleTh: { background: "#f8fafc", padding: "10px", borderBottom: "1px solid #e2e8f0", textAlign: "left", fontWeight: "700", color: "#475569", textTransform: "uppercase", fontSize: '0.75rem' },
  modalDetalleTd: { padding: "10px", borderBottom: "1px solid #f1f5f9", color: "#334155" },
  
  modalActionsRow: { marginTop: "25px", display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: '1px solid #f1f5f9', paddingTop: '20px' },
};

// Inyección de animación
const styleSheet = document.createElement("style");
styleSheet.innerText = `@keyframes scaleUp { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }`;
document.head.appendChild(styleSheet);

export default function PreparacionOrdenes() {
  const { user } = useAuth();

  // ============================
  // Estado para ÓRDENES
  // ============================
  const [ordenes, setOrdenes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [vendedores, setVendedores] = useState([]);

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [ordenDetalle, setOrdenDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState("");
  const [accionLoading, setAccionLoading] = useState(false);

  // ============================
  // Estado para ENVÍOS
  // ============================
  const [envios, setEnvios] = useState([]);
  const [loadingEnvios, setLoadingEnvios] = useState(false);
  const [errorEnvios, setErrorEnvios] = useState("");

  const [modalEnvioAbierto, setModalEnvioAbierto] = useState(false);
  const [envioDetalle, setEnvioDetalle] = useState(null);
  const [loadingEnvioDetalle, setLoadingEnvioDetalle] = useState(false);
  const [errorEnvioDetalle, setErrorEnvioDetalle] = useState("");
  const [envioAccionLoading, setEnvioAccionLoading] = useState(false);

  // ============================
  // Helpers para nombres
  // ============================
  const nombreCliente = (idCliente) => {
    const c = clientes.find((c) => c.id_cliente === idCliente);
    return c ? c.nombre : `Cliente #${idCliente}`;
  };

  const nombreVendedor = (idUsuario) => {
    if (!idUsuario) return "";
    const v = vendedores.find(
      (u) => u.id_usuario === idUsuario || u.id === idUsuario
    );
    return v ? v.username : `Vendedor #${idUsuario}`;
  };

  const nombreUnidad = (envio) => {
    if (envio.unidad_codigo) return envio.unidad_codigo;
    if (envio.unidad_placa) return envio.unidad_placa;
    if (envio.id_unidad) return `Unidad #${envio.id_unidad}`;
    return "Unidad no especificada";
  };

  // ============================
  // Cargas iniciales
  // ============================
  const cargarClientes = async () => {
    try {
      const res = await api.get("/base/clientes/");
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setClientes(data);
    } catch (err) {
      console.error("Error cargando clientes:", err);
    }
  };

  const cargarVendedores = async () => {
    try {
      const res = await api.get("/base/usuarios/");
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setVendedores(data);
    } catch (err) {
      console.error("Error cargando vendedores:", err);
    }
  };

  const cargarOrdenes = async () => {
    setLoading(true);
    setError("");
    setMensaje("");
    try {
      const res = await api.get("/ordenes/para_preparar/");
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setOrdenes(data);
      setMensaje(
        `Se encontraron ${data.length} orden(es) pendientes por preparación.`
      );
    } catch (err) {
      console.error("Error cargando órdenes para preparar:", err);
      if (err.response?.status === 403) {
        setError("No tienes permiso para acceder a este módulo.");
      } else {
        const backendMsg = err.response?.data?.error || err.response?.data?.detail;
        setError(backendMsg || "No se pudieron cargar las órdenes.");
      }
    } finally {
      setLoading(false);
    }
  };

  const cargarEnvios = async () => {
    setLoadingEnvios(true);
    setErrorEnvios("");
    try {
      const res = await api.get("/base/envios/para_verificar/");
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setEnvios(data);
    } catch (err) {
      console.error("Error cargando envíos:", err);
      if (err.response?.status === 403) {
        setErrorEnvios("No tienes permiso para ver los envíos.");
      } else {
        const backendMsg = err.response?.data?.error || err.response?.data?.detail;
        setErrorEnvios(backendMsg || "No se pudieron cargar los envíos.");
      }
    } finally {
      setLoadingEnvios(false);
    }
  };

  useEffect(() => {
    cargarClientes();
    cargarVendedores();
    cargarOrdenes();
    cargarEnvios();
  }, []);

  // ============================
  // Ver/abrir detalle ORDEN
  // ============================
  const abrirDetalleOrden = async (ordenId) => {
    setModalAbierto(true);
    setOrdenDetalle(null);
    setErrorDetalle("");
    setLoadingDetalle(true);

    try {
      const res = await api.get(`/ordenes/${ordenId}/ver_para_preparar/`);
      setOrdenDetalle(res.data);
    } catch (err) {
      console.error("Error cargando detalle de orden:", err);
      setErrorDetalle("No se pudieron cargar los detalles.");
    } finally {
      setLoadingDetalle(false);
    }
  };

  const cerrarModalOrden = () => {
    setModalAbierto(false);
    setOrdenDetalle(null);
    setErrorDetalle("");
  };

  // ============================
  // Acciones ORDEN
  // ============================
  const marcarComoPreparada = async () => {
    if (!ordenDetalle) return;
    const id = ordenDetalle.orden?.id_orden;

    setAccionLoading(true);
    try {
      const res = await api.post(`/ordenes/${id}/preparar/`);
      const msg = res.data?.mensaje || "Orden marcada como PREPARADA.";
      toast.success(msg);

      setOrdenes((prev) => prev.filter((o) => o.id_orden !== id));

      if (res.data?.orden) {
        setOrdenDetalle((prev) => ({
          ...prev,
          orden: res.data.orden,
        }));
      }
    } catch (err) {
      console.error("Error al preparar orden:", err);
      toast.error("No se pudo marcar la orden como PREPARADA.");
    } finally {
      setAccionLoading(false);
    }
  };

  const notificarPreparacion = async () => {
    if (!ordenDetalle) return;
    const id = ordenDetalle.orden?.id_orden;

    setAccionLoading(true);
    try {
      const res = await api.post(`/ordenes/${id}/notificar_preparacion/`);
      const msg = res.data?.mensaje || "Se notificó que la orden está lista.";
      toast.success(msg);
    } catch (err) {
      console.error("Error al notificar preparación:", err);
      toast.error("No se pudo notificar que la orden está lista.");
    } finally {
      setAccionLoading(false);
    }
  };

  // ============================
  // Ver/abrir detalle ENVÍO
  // ============================
  const abrirDetalleEnvio = async (idEnvio) => {
    setModalEnvioAbierto(true);
    setEnvioDetalle(null);
    setErrorEnvioDetalle("");
    setLoadingEnvioDetalle(true);

    try {
      const res = await api.get(`/base/envios/${idEnvio}/detalle_verificacion/`);
      setEnvioDetalle(res.data);
    } catch (err) {
      console.error("Error cargando detalle de envío:", err);
      setErrorEnvioDetalle("No se pudieron cargar los detalles.");
    } finally {
      setLoadingEnvioDetalle(false);
    }
  };

  const cerrarModalEnvio = () => {
    setModalEnvioAbierto(false);
    setEnvioDetalle(null);
    setErrorEnvioDetalle("");
  };

  // ============================
  // Acciones ENVÍO
  // ============================
  const marcarEnvioListo = async () => {
    if (!envioDetalle?.envio) return;
    const id = envioDetalle.envio.id_envio;

    setEnvioAccionLoading(true);
    try {
      const res = await api.post(`/base/envios/${id}/marcar_listo_salida/`);
      const msg = res.data?.mensaje || "Envío marcado como listo para salir.";
      toast.success(msg);
      setEnvios((prev) => prev.filter((e) => e.id_envio !== id));
      cerrarModalEnvio();
    } catch (err) {
      console.error("Error al marcar envío:", err);
      toast.error("No se pudo marcar el envío como listo.");
    } finally {
      setEnvioAccionLoading(false);
    }
  };

  // ============================
  // Si no hay usuario
  // ============================
  if (!user) {
    return (
      <div style={styles.page}>
        <div style={styles.headerRow}>
           <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
              <div style={styles.iconCircle}><IconBox /></div>
              <div>
                  <h2 style={styles.title}>Preparación de Órdenes</h2>
                  <p style={styles.subtitle}>Cargando datos de usuario...</p>
              </div>
           </div>
        </div>
      </div>
    );
  }

  const tipoUsuarioActual = user.tipo || (user.user && user.user.tipo) || "No especificado";

  // ============================
  // Render principal
  // ============================
  return (
    <div style={styles.page}>
      
      {/* 1. HEADER FLOTANTE */}
      <div style={styles.headerRow}>
         <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
            <div style={styles.iconCircle}><IconBox /></div>
            <div>
                <h2 style={styles.title}>Preparación de Órdenes</h2>
                <p style={styles.subtitle}>
                   Módulo de Almacén · Rol actual: <strong>{tipoUsuarioActual}</strong>
                </p>
            </div>
         </div>
      </div>

      {mensaje && <div style={styles.statusTextOk}>{mensaje}</div>}
      {error && <div style={styles.statusTextError}>{error}</div>}

      <div style={styles.card}>
        
        {/* SECCIÓN ÓRDENES */}
        {(!error || !error.includes("Solo los usuarios de tipo ALMACENISTA")) && (
        <>
            <div style={{...styles.sectionTitle, marginTop:'0'}}>Órdenes Pendientes</div>
            <div style={styles.tableWrapper}>
                <table style={styles.table}>
                <thead>
                    <tr>
                    <th style={styles.th}># Orden</th>
                    <th style={styles.th}>Cliente</th>
                    <th style={styles.th}>Vendedor</th>
                    <th style={styles.th}>Fecha</th>
                    <th style={styles.th}>Total (Bs)</th>
                    <th style={styles.th}>Estado</th>
                    <th style={{...styles.th, textAlign:'center'}}>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    {ordenes.length === 0 && !loading && (
                    <tr>
                        <td style={{...styles.td, textAlign:'center', color:'#94a3b8', padding:'30px'}} colSpan={7}>
                        No hay órdenes pendientes.
                        </td>
                    </tr>
                    )}

                    {ordenes.map((o, idx) => {
                    const rowBase = idx % 2 === 1 ? styles.rowAlt : {};
                    return (
                        <tr key={o.id_orden} style={rowBase}>
                        <td style={{...styles.td, fontWeight:'700', color:'#0d47a1'}}>#{o.id_orden}</td>
                        <td style={styles.td}>{nombreCliente(o.id_cliente)}</td>
                        <td style={styles.td}>{nombreVendedor(o.id_usuario)}</td>
                        <td style={styles.td}>{o.fecha_orden}</td>
                        <td style={styles.td}>{Number(o.precio_final || 0).toFixed(2)}</td>
                        <td style={styles.td}>
                            <span style={styles.badgeEstado}>{o.estado_de_envio}</span>
                        </td>
                        <td style={{...styles.td, textAlign:'center'}}>
                            <button type="button" style={styles.buttonPrimary} onClick={() => abrirDetalleOrden(o.id_orden)}>
                            <IconSearch /> Revisar
                            </button>
                        </td>
                        </tr>
                    );
                    })}
                    {loading && <tr><td style={{...styles.td, textAlign:'center'}} colSpan={7}>Cargando...</td></tr>}
                </tbody>
                </table>
            </div>

            {ordenes.length > 0 && (
                <div style={styles.resumenResultados}>
                Mostrando {ordenes.length} orden(es) para preparar.
                </div>
            )}

            {/* SECCIÓN ENVÍOS */}
            <div style={styles.sectionTitle}>Verificación de Envíos</div>
            <p style={styles.sectionSubtitle}>
                Verifica los envíos armados por gerencia y márcalos como listos para salir.
            </p>

            {errorEnvios && <div style={styles.statusTextError}>{errorEnvios}</div>}

            <div style={styles.tableWrapper}>
                <table style={styles.table}>
                <thead>
                    <tr>
                    <th style={styles.th}># Envío</th>
                    <th style={styles.th}>Código</th>
                    <th style={styles.th}>Unidad</th>
                    <th style={styles.th}>Órdenes (Tuyas/Total)</th>
                    <th style={styles.th}>Peso (kg)</th>
                    <th style={styles.th}>Estado</th>
                    <th style={{...styles.th, textAlign:'center'}}>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    {envios.length === 0 && !loadingEnvios && (
                    <tr>
                        <td style={{...styles.td, textAlign:'center', color:'#94a3b8', padding:'30px'}} colSpan={7}>
                        No hay envíos pendientes.
                        </td>
                    </tr>
                    )}

                    {envios.map((e, idx) => {
                    const rowBase = idx % 2 === 1 ? styles.rowAlt : {};
                    const cantTotal = e.cantidad_ordenes_total ?? "-";
                    const cantAlmacenista = e.cantidad_ordenes_almacenista ?? "-";

                    return (
                        <tr key={e.id_envio} style={rowBase}>
                        <td style={{...styles.td, fontWeight:'700', color:'#0d47a1'}}>#{e.id_envio}</td>
                        <td style={styles.td}>{e.codigo_envio || "-"}</td>
                        <td style={styles.td}>{nombreUnidad(e)}</td>
                        <td style={styles.td}>{cantAlmacenista} / {cantTotal}</td>
                        <td style={styles.td}>{e.peso_total != null ? Number(e.peso_total).toFixed(2) : "-"}</td>
                        <td style={styles.td}>
                            <span style={styles.badgeEstado}>{e.estado || "SIN ESTADO"}</span>
                        </td>
                        <td style={{...styles.td, textAlign:'center'}}>
                            <button type="button" style={styles.buttonPrimary} onClick={() => abrirDetalleEnvio(e.id_envio)}>
                             <IconCheck /> Revisar
                            </button>
                        </td>
                        </tr>
                    );
                    })}
                </tbody>
                </table>
            </div>

            {envios.length > 0 && (
                <div style={styles.resumenResultados}>
                Mostrando {envios.length} envío(s) pendientes.
                </div>
            )}
        </>
        )}
      </div>

      {/* MODAL DETALLE ORDEN */}
      {modalAbierto && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeaderRow}>
              <h3 style={styles.modalTitle}>
                Detalles Orden {ordenDetalle?.orden ? `#${ordenDetalle.orden.id_orden}` : ""}
              </h3>
              <button type="button" style={styles.modalCloseButton} onClick={cerrarModalOrden}>✕</button>
            </div>

            {loadingDetalle && <div style={styles.modalLine}>Cargando...</div>}
            {errorDetalle && <div style={{...styles.modalLine, color:'#b91c1c'}}>{errorDetalle}</div>}

            {ordenDetalle && !loadingDetalle && !errorDetalle && (
              <>
                <div style={styles.modalSectionTitle}>Información General</div>
                <div style={styles.modalLine}><strong>Cliente:</strong> {nombreCliente(ordenDetalle.orden.id_cliente)}</div>
                <div style={styles.modalLine}><strong>Vendedor:</strong> {nombreVendedor(ordenDetalle.orden.id_usuario)}</div>
                <div style={styles.modalLine}><strong>Pago:</strong> {ordenDetalle.orden.metodo_pago}</div>
                <div style={styles.modalLine}><strong>Fecha:</strong> {ordenDetalle.orden.fecha_orden}</div>
                <div style={styles.modalLine}><strong>Estado Envío:</strong> {ordenDetalle.orden.estado_de_envio}</div>
                <div style={styles.modalLine}><strong>Total (Bs):</strong> {Number(ordenDetalle.orden.precio_final || 0).toFixed(2)}</div>

                <div style={styles.modalSectionTitle}>Productos a Preparar</div>
                {(!ordenDetalle.detalles || ordenDetalle.detalles.length === 0) && (
                  <div style={styles.modalLine}>No hay productos.</div>
                )}

                {ordenDetalle.detalles && ordenDetalle.detalles.length > 0 && (
                  <table style={styles.modalDetalleTable}>
                    <thead>
                      <tr>
                        <th style={styles.modalDetalleTh}>Producto</th>
                        <th style={styles.modalDetalleTh}>Cant.</th>
                        <th style={styles.modalDetalleTh}>Peso</th>
                        <th style={styles.modalDetalleTh}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordenDetalle.detalles.map((d, idx) => (
                        <tr key={idx}>
                          <td style={styles.modalDetalleTd}>{d.producto}</td>
                          <td style={styles.modalDetalleTd}>{d.cantidad}</td>
                          <td style={styles.modalDetalleTd}>{d.peso}</td>
                          <td style={styles.modalDetalleTd}>{d.subtotal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <div style={styles.modalActionsRow}>
                  <button type="button" style={styles.buttonSecondary} onClick={cerrarModalOrden} disabled={accionLoading}>Cerrar</button>
                  <button type="button" style={styles.buttonSecondary} onClick={notificarPreparacion} disabled={accionLoading}>
                    {accionLoading ? "..." : "Notificar"}
                  </button>
                  <button type="button" style={styles.buttonPrimary} onClick={marcarComoPreparada} disabled={accionLoading}>
                    {accionLoading ? "Procesando..." : "Marcar PREPARADA"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL DETALLE ENVÍO */}
      {modalEnvioAbierto && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeaderRow}>
              <h3 style={styles.modalTitle}>
                Detalles Envío {envioDetalle?.envio ? `#${envioDetalle.envio.id_envio}` : ""}
              </h3>
              <button type="button" style={styles.modalCloseButton} onClick={cerrarModalEnvio}>✕</button>
            </div>

            {loadingEnvioDetalle && <div style={styles.modalLine}>Cargando...</div>}
            {errorEnvioDetalle && <div style={{...styles.modalLine, color:'#b91c1c'}}>{errorEnvioDetalle}</div>}

            {envioDetalle && !loadingEnvioDetalle && !errorEnvioDetalle && (
              <>
                <div style={styles.modalSectionTitle}>Datos del Envío</div>
                <div style={styles.modalLine}><strong>Código:</strong> {envioDetalle.envio.codigo_envio || "-"}</div>
                <div style={styles.modalLine}><strong>Unidad:</strong> {nombreUnidad(envioDetalle.envio)}</div>
                <div style={styles.modalLine}><strong>Peso Total:</strong> {envioDetalle.envio.peso_total != null ? Number(envioDetalle.envio.peso_total).toFixed(2) : "-"} kg</div>
                <div style={styles.modalLine}><strong>Estado:</strong> {envioDetalle.envio.estado}</div>
                <div style={styles.modalLine}><strong>Salida:</strong> {envioDetalle.envio.fecha_salida || "-"}</div>

                <div style={styles.modalSectionTitle}>Órdenes Incluidas</div>
                {(!envioDetalle.ordenes || envioDetalle.ordenes.length === 0) && (
                  <div style={styles.modalLine}>No hay órdenes asociadas.</div>
                )}

                {envioDetalle.ordenes && envioDetalle.ordenes.length > 0 && (
                  <table style={styles.modalDetalleTable}>
                    <thead>
                      <tr>
                        <th style={styles.modalDetalleTh}># Orden</th>
                        <th style={styles.modalDetalleTh}>Cliente</th>
                        <th style={styles.modalDetalleTh}>Total</th>
                        <th style={styles.modalDetalleTh}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {envioDetalle.ordenes.map((o, idx) => (
                        <tr key={idx}>
                          <td style={styles.modalDetalleTd}>{o.id_orden}</td>
                          <td style={styles.modalDetalleTd}>{o.cliente_nombre || "-"}</td>
                          <td style={styles.modalDetalleTd}>{o.precio_final != null ? Number(o.precio_final).toFixed(2) : "-"}</td>
                          <td style={styles.modalDetalleTd}>{o.estado_de_envio || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <div style={styles.modalActionsRow}>
                  <button type="button" style={styles.buttonSecondary} onClick={cerrarModalEnvio} disabled={envioAccionLoading}>Cerrar</button>
                  <button type="button" style={styles.buttonPrimary} onClick={marcarEnvioListo} disabled={envioAccionLoading}>
                    {envioAccionLoading ? "Procesando..." : "Marcar LISTO PARA SALIR"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}