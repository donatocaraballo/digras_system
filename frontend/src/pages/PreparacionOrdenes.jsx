// frontend/src/pages/PreparacionOrdenes.jsx

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../AuthContext";
import api from "../api/api";
import { toast } from "react-hot-toast";

// --- ICONOS SVG ---
const IconBox = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
    <line x1="12" y1="22.08" x2="12" y2="12"></line>
  </svg>
);

const IconCheck = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const IconSearch = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

// --- ESTILOS ---
const styles = {
  page: {
    paddingTop: "40px",
    paddingBottom: "40px",
    fontFamily: "'Segoe UI', 'Roboto', sans-serif",
    maxWidth: "1400px",
    margin: "0 auto",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "25px",
    paddingLeft: "10px",
  },
  iconCircle: {
    width: "56px",
    height: "56px",
    borderRadius: "14px",
    backgroundColor: "#e0f2fe",
    color: "#0284c7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
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
  card: {
    background: "#ffffff",
    borderRadius: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
    padding: "30px",
    border: "1px solid #f0f0f0",
  },
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
  controlsRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "8px",
    flexWrap: "wrap",
  },
  searchWrap: {
    flex: "1 1 320px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  searchInput: {
    width: "100%",
    height: "38px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    padding: "0 14px",
    outline: "none",
    fontSize: "0.9rem",
    color: "#0f172a",
    background: "#ffffff",
  },
  sortWrap: {
    flex: "0 0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "10px",
  },
  sortLabel: {
    fontSize: "0.85rem",
    color: "#64748b",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },
  selectWrapper: {
    position: "relative",
    width: "100%",
    maxWidth: "200px",
  },
  select: {
    width: "100%",
    height: "38px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    padding: "0 44px 0 14px",
    outline: "none",
    fontSize: "0.9rem",
    color: "#0f172a",
    background: "#ffffff",
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
    cursor: "pointer",
  },
  selectArrow: {
    position: "absolute",
    right: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#64748b",
    fontSize: "0.85rem",
    pointerEvents: "none",
  },
  tableWrapper: {
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
    boxShadow: "0 2px 5px rgba(0,0,0,0.02)",
    marginBottom: "20px",
    marginTop: "6px",
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
  buttonPrimary: {
    border: "none",
    borderRadius: "10px",
    padding: "0 16px",
    height: "36px",
    background: "#0f172a",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: "600",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.2)",
    whiteSpace: "nowrap",
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
    whiteSpace: "nowrap",
  },
  buttonPrimaryDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
    boxShadow: "none",
  },
  badgeEstado: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: "20px",
    fontSize: "0.7rem",
    fontWeight: "700",
    background: "#e0f2fe",
    color: "#0369a1",
    border: "1px solid #bae6fd",
    textTransform: "uppercase",
  },
  statusTextOk: {
    padding: "12px",
    background: "#dcfce7",
    color: "#166534",
    borderRadius: "10px",
    marginBottom: "20px",
    border: "1px solid #bbf7d0",
    fontSize: "0.9rem",
  },
  statusTextError: {
    padding: "12px",
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: "10px",
    marginBottom: "20px",
    border: "1px solid #fecaca",
    fontSize: "0.9rem",
  },
  resumenResultados: {
    fontSize: "0.85rem",
    color: "#64748b",
    marginTop: "4px",
    marginBottom: "4px",
    textAlign: "right",
    fontStyle: "italic",
  },
  clickable: {
    color: "#0d47a1",
    fontWeight: "700",
    cursor: "pointer",
    textDecoration: "underline",
    textUnderlineOffset: "3px",
  },
  hintMini: {
    marginTop: "4px",
    fontSize: "0.72rem",
    color: "#94a3b8",
    fontStyle: "italic",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(4px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10000,
    padding: "40px",
  },
  modalCard: {
    width: "100%",
    maxWidth: "780px",
    maxHeight: "90vh",
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    padding: "30px",
    boxSizing: "border-box",
    overflowY: "auto",
    position: "relative",
  },
  modalHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    borderBottom: "1px solid #f1f5f9",
    paddingBottom: "15px",
  },
  modalTitle: {
    fontSize: "1.3rem",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
  },
  modalCloseButton: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "1.2rem",
    color: "#94a3b8",
  },
  modalSectionTitle: {
    fontSize: "0.85rem",
    fontWeight: "700",
    color: "#0f172a",
    marginTop: "20px",
    marginBottom: "10px",
    textTransform: "uppercase",
    borderBottom: "2px solid #e0f2fe",
    paddingBottom: "5px",
    display: "inline-block",
  },
  modalLine: {
    fontSize: "0.9rem",
    marginBottom: "8px",
    color: "#334155",
    display: "flex",
    justifyContent: "space-between",
    borderBottom: "1px dashed #f1f5f9",
    paddingBottom: "4px",
    gap: "10px",
  },
  modalDetalleTable: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px",
    fontSize: "0.85rem",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    overflow: "hidden",
  },
  modalDetalleTh: {
    background: "#f8fafc",
    padding: "10px",
    borderBottom: "1px solid #e2e8f0",
    textAlign: "left",
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
    fontSize: "0.75rem",
  },
  modalDetalleTd: {
    padding: "10px",
    borderBottom: "1px solid #f1f5f9",
    color: "#334155",
  },
  modalActionsRow: {
    marginTop: "25px",
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    borderTop: "1px solid #f1f5f9",
    paddingTop: "20px",
  },
};

// ----------------------------
// Utilidades
// ----------------------------
const normalizeText = (value) => {
  if (value == null) return "";
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const toTime = (dateLike) => {
  if (!dateLike) return 0;
  const t = new Date(dateLike).getTime();
  return Number.isFinite(t) ? t : 0;
};

const fmt2 = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
};

const formatDateOnly = (dateLike) => {
  if (!dateLike) return "-";
  try {
    const d = new Date(dateLike);
    if (!Number.isFinite(d.getTime())) return String(dateLike).slice(0, 10);
    return d.toLocaleDateString("es-VE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return String(dateLike).slice(0, 10);
  }
};

const isObject = (v) => v && typeof v === "object" && !Array.isArray(v);

export default function PreparacionOrdenes() {
  const { user } = useAuth();

  // ----------------------------
  // DATA
  // ----------------------------
  const [ordenes, setOrdenes] = useState([]);
  const [vendedores, setVendedores] = useState([]);

  // cache opcional
  const [clientesCache, setClientesCache] = useState({}); // { [id_cliente]: cliente }
  const [unidadesCache, setUnidadesCache] = useState({}); // { [id_unidad]: unidad }

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [envios, setEnvios] = useState([]);
  const [loadingEnvios, setLoadingEnvios] = useState(false);
  const [errorEnvios, setErrorEnvios] = useState("");

  // ----------------------------
  // BUSCAR / ORDENAR / FILTRAR
  // ----------------------------
  const [ordenesQuery, setOrdenesQuery] = useState("");
  const [ordenesSort, setOrdenesSort] = useState("recientes");

  const [enviosQuery, setEnviosQuery] = useState("");
  const [enviosSort, setEnviosSort] = useState("recientes");

  // ----------------------------
  // MODAL ORDEN (PREPARAR)
  // ----------------------------
  const [modalOrdenAbierto, setModalOrdenAbierto] = useState(false);
  const [ordenDetalle, setOrdenDetalle] = useState(null);
  const [loadingOrdenDetalle, setLoadingOrdenDetalle] = useState(false);
  const [errorOrdenDetalle, setErrorOrdenDetalle] = useState("");
  const [accionOrdenLoading, setAccionOrdenLoading] = useState(false);

  // ----------------------------
  // MODAL ENVÍO (VERIFICAR)
  // ----------------------------
  const [modalEnvioAbierto, setModalEnvioAbierto] = useState(false);
  const [envioDetalle, setEnvioDetalle] = useState(null);
  const [loadingEnvioDetalle, setLoadingEnvioDetalle] = useState(false);
  const [errorEnvioDetalle, setErrorEnvioDetalle] = useState("");
  const [accionEnvioLoading, setAccionEnvioLoading] = useState(false);

  // ----------------------------
  // MODAL CLIENTE
  // ----------------------------
  const [modalClienteAbierto, setModalClienteAbierto] = useState(false);
  const [clienteData, setClienteData] = useState(null);
  const [loadingCliente, setLoadingCliente] = useState(false);
  const [errorCliente, setErrorCliente] = useState("");

  // ----------------------------
  // MODAL UNIDAD
  // ----------------------------
  const [modalUnidadAbierto, setModalUnidadAbierto] = useState(false);
  const [unidadData, setUnidadData] = useState(null);
  const [loadingUnidad, setLoadingUnidad] = useState(false);
  const [errorUnidad, setErrorUnidad] = useState("");

  // ----------------------------
  // MODAL ORDEN DESDE ENVÍO
  // ----------------------------
  const [modalOrdenEnvioAbierto, setModalOrdenEnvioAbierto] = useState(false);
  const [ordenEnvioDetalle, setOrdenEnvioDetalle] = useState(null);
  const [loadingOrdenEnvioDetalle, setLoadingOrdenEnvioDetalle] = useState(false);
  const [errorOrdenEnvioDetalle, setErrorOrdenEnvioDetalle] = useState("");

  // ----------------------------
  // HELPERS (compatibles con tus modelos/serializers)
  // ----------------------------
  const getClienteIdFromOrden = (orden) => {
    if (!orden) return null;
    const v = orden.id_cliente;
    if (v == null) return null;
    if (isObject(v)) return v.id_cliente ?? v.id ?? null;
    return v;
  };

  const getClienteNombreFromOrden = (orden) => {
    if (!orden) return "";
    return (
      orden.id_cliente_nombre ||
      (isObject(orden.id_cliente) ? orden.id_cliente.nombre : "") ||
      ""
    );
  };

  const getVendedorUsernameFromOrden = (orden) => {
    if (!orden) return "";
    return (
      orden.id_usuario_username ||
      (isObject(orden.id_usuario) ? orden.id_usuario.username : "") ||
      ""
    );
  };

  const nombreVendedor = (idUsuario) => {
    if (!idUsuario) return "";
    const id = isObject(idUsuario) ? idUsuario.id_usuario ?? idUsuario.id : idUsuario;
    const v = vendedores.find((u) => (u.id_usuario ?? u.id) === id);
    return v?.username || `Usuario #${id}`;
  };

  const clienteLabelOrden = (orden) => {
    const id = getClienteIdFromOrden(orden);
    const nombre = getClienteNombreFromOrden(orden);
    if (nombre) return nombre;
    const cached = id != null ? clientesCache[id] : null;
    if (cached?.nombre) return cached.nombre;
    return id != null ? `Cliente #${id}` : "Cliente";
  };

  const vendedorLabelOrden = (orden) => {
    const username = getVendedorUsernameFromOrden(orden);
    if (username) return username;
    return nombreVendedor(orden?.id_usuario);
  };

  const getUnidadIdFromEnvio = (envio) => {
    if (!envio) return null;
    const v = envio.id_unidad;
    if (v == null) return null;
    if (isObject(v)) return v.id_unidad ?? v.id ?? null;
    return v;
  };

  const unidadLabel = (envio) => {
    const id = getUnidadIdFromEnvio(envio);
    if (isObject(envio?.id_unidad) && envio.id_unidad.codigo_unidad) {
      return envio.id_unidad.codigo_unidad;
    }
    const cached = id != null ? unidadesCache[id] : null;
    if (cached?.codigo_unidad) return cached.codigo_unidad;
    return id != null ? `Unidad #${id}` : "Unidad";
  };

  const getOrdenFecha = (o) => toTime(o?.fecha_orden);
  const getOrdenPrecio = (o) => toNumber(o?.precio_final);
  const getOrdenPeso = (o) => toNumber(o?.peso_total);

  const getEnvioFecha = (e) => toTime(e?.fecha_salida) || toNumber(e?.id_envio);
  const getEnvioPeso = (e) => toNumber(e?.peso_total);

  const getEnvioPrecio = (e) => {
    const det = e?.ordenes_detalle;
    if (Array.isArray(det) && det.length > 0) {
      return det.reduce((acc, x) => acc + toNumber(x?.precio_final), 0);
    }
    return 0;
  };

  const getEnvioOrdenesDetalle = (payload) => {
    if (!payload) return [];
    if (Array.isArray(payload.ordenes)) return payload.ordenes;
    if (Array.isArray(payload.ordenes_detalle)) return payload.ordenes_detalle;
    if (Array.isArray(payload.envio?.ordenes_detalle)) return payload.envio.ordenes_detalle;
    return [];
  };

  const countPreparadas = (ordenesDet) => {
    if (!Array.isArray(ordenesDet)) return 0;
    return ordenesDet.filter((o) =>
      normalizeText(o?.estado_de_envio).includes("preparad")
    ).length;
  };

  // ----------------------------
  // CARGAS
  // ----------------------------
  const cargarVendedores = async () => {
    try {
      const res = await api.get("/base/usuarios/");
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setVendedores(data);
    } catch (err) {
      console.error("Error cargando usuarios:", err);
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
      setMensaje(`Se encontraron ${data.length} orden(es) pendientes por preparación.`);
    } catch (err) {
      console.error("Error cargando órdenes para preparar:", err);
      const backendMsg = err.response?.data?.error || err.response?.data?.detail;
      setError(backendMsg || "No se pudieron cargar las órdenes.");
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
      const backendMsg = err.response?.data?.error || err.response?.data?.detail;
      setErrorEnvios(backendMsg || "No se pudieron cargar los envíos.");
    } finally {
      setLoadingEnvios(false);
    }
  };

  useEffect(() => {
    cargarVendedores();
    cargarOrdenes();
    cargarEnvios();
  }, []);

  // ----------------------------
  // LISTAS FILTRADAS
  // ----------------------------
  const ordenesFiltradas = useMemo(() => {
    const q = normalizeText(ordenesQuery);
    let list = Array.isArray(ordenes) ? [...ordenes] : [];

    if (q) {
      list = list.filter((o) => {
        const haystack = normalizeText(
          [
            o?.id_orden,
            clienteLabelOrden(o),
            vendedorLabelOrden(o),
            o?.fecha_orden,
            o?.estado_de_envio,
            o?.estado_de_pago,
            o?.metodo_pago,
          ].join(" ")
        );
        return haystack.includes(q);
      });
    }

    list.sort((a, b) => {
      if (ordenesSort === "recientes") return getOrdenFecha(b) - getOrdenFecha(a);
      if (ordenesSort === "antiguas") return getOrdenFecha(a) - getOrdenFecha(b);
      if (ordenesSort === "mayor_peso") return getOrdenPeso(b) - getOrdenPeso(a);
      if (ordenesSort === "menor_peso") return getOrdenPeso(a) - getOrdenPeso(b);
      if (ordenesSort === "mayor_precio") return getOrdenPrecio(b) - getOrdenPrecio(a);
      if (ordenesSort === "menor_precio") return getOrdenPrecio(a) - getOrdenPrecio(b);
      return toNumber(b?.id_orden) - toNumber(a?.id_orden);
    });

    return list;
  }, [ordenes, ordenesQuery, ordenesSort, clientesCache, vendedores]);

  const enviosFiltrados = useMemo(() => {
    const q = normalizeText(enviosQuery);
    let list = Array.isArray(envios) ? [...envios] : [];

    if (q) {
      list = list.filter((e) => {
        const det = Array.isArray(e?.ordenes_detalle) ? e.ordenes_detalle : [];
        const totalOrdenes = e?.cantidad_ordenes_total ?? det.length;
        const preparados = e?.cantidad_ordenes_almacenista ?? countPreparadas(det);

        const haystack = normalizeText(
          [
            e?.id_envio,
            e?.codigo_envio,
            unidadLabel(e),
            e?.estado,
            e?.peso_total,
            totalOrdenes,
            preparados,
          ].join(" ")
        );
        return haystack.includes(q);
      });
    }

    list.sort((a, b) => {
      if (enviosSort === "recientes") return getEnvioFecha(b) - getEnvioFecha(a);
      if (enviosSort === "antiguas") return getEnvioFecha(a) - getEnvioFecha(b);
      if (enviosSort === "mayor_peso") return getEnvioPeso(b) - getEnvioPeso(a);
      if (enviosSort === "menor_peso") return getEnvioPeso(a) - getEnvioPeso(b);
      if (enviosSort === "mayor_precio") return getEnvioPrecio(b) - getEnvioPrecio(a);
      if (enviosSort === "menor_precio") return getEnvioPrecio(a) - getEnvioPrecio(b);
      return toNumber(b?.id_envio) - toNumber(a?.id_envio);
    });

    return list;
  }, [envios, enviosQuery, enviosSort, unidadesCache]);

  // ----------------------------
  // MODAL ORDEN: ABRIR/CERRAR
  // ----------------------------
  const abrirDetalleOrden = async (idOrden) => {
    setModalOrdenAbierto(true);
    setOrdenDetalle(null);
    setErrorOrdenDetalle("");
    setLoadingOrdenDetalle(true);

    try {
      const res = await api.get(`/ordenes/${idOrden}/ver_para_preparar/`);
      const payload = res.data || {};
      setOrdenDetalle(payload);

      const ord = payload?.orden;
      const idCliente = getClienteIdFromOrden(ord);
      const nombreCliente = getClienteNombreFromOrden(ord);
      if (idCliente != null && nombreCliente) {
        setClientesCache((prev) => ({
          ...prev,
          [idCliente]: { id_cliente: idCliente, nombre: nombreCliente },
        }));
      }
    } catch (err) {
      console.error("Error cargando detalle de orden:", err);
      const backendMsg = err.response?.data?.detail || err.response?.data?.error;
      setErrorOrdenDetalle(
        backendMsg || "No se pudieron cargar los detalles de la orden."
      );
    } finally {
      setLoadingOrdenDetalle(false);
    }
  };

  const cerrarModalOrden = () => {
    setModalOrdenAbierto(false);
    setOrdenDetalle(null);
    setErrorOrdenDetalle("");
  };

  // ----------------------------
  // ORDEN: ACCIÓN PREPARAR
  // ----------------------------
  const marcarComoPreparada = async () => {
    const id = ordenDetalle?.orden?.id_orden;
    if (!id) return;

    setAccionOrdenLoading(true);
    try {
      const res = await api.post(`/ordenes/${id}/preparar/`);
      toast.success(res.data?.mensaje || "Orden marcada como PREPARADA.");

      setOrdenes((prev) => prev.filter((o) => o.id_orden !== id));
      cerrarModalOrden();
      cargarEnvios();
    } catch (err) {
      console.error("Error al preparar orden:", err);
      const backendMsg =
        err.response?.data?.detail ||
        err.response?.data?.mensaje ||
        err.response?.data?.error;
      toast.error(backendMsg || "No se pudo marcar la orden como PREPARADA.");
    } finally {
      setAccionOrdenLoading(false);
    }
  };

  // ----------------------------
  // MODAL ENVÍO: ABRIR/CERRAR
  // ----------------------------
  const abrirDetalleEnvio = async (idEnvio) => {
    setModalEnvioAbierto(true);
    setEnvioDetalle(null);
    setErrorEnvioDetalle("");
    setLoadingEnvioDetalle(true);

    try {
      const res = await api.get(`/base/envios/${idEnvio}/detalle_verificacion/`);
      setEnvioDetalle(res.data);

      const envioObj = res.data?.envio;
      const idUnidad = getUnidadIdFromEnvio(envioObj);
      if (
        idUnidad != null &&
        isObject(envioObj?.id_unidad) &&
        envioObj.id_unidad.codigo_unidad
      ) {
        setUnidadesCache((prev) => ({
          ...prev,
          [idUnidad]: { ...envioObj.id_unidad },
        }));
      }
    } catch (err) {
      try {
        const res2 = await api.get(`/base/envios/${idEnvio}/`);
        setEnvioDetalle({
          envio: res2.data,
          ordenes_detalle: res2.data?.ordenes_detalle || [],
        });
      } catch (err2) {
        console.error("Error cargando detalle de envío:", err2);
        const backendMsg = err2.response?.data?.detail || err2.response?.data?.error;
        setErrorEnvioDetalle(
          backendMsg || "No se pudieron cargar los detalles del envío."
        );
      }
    } finally {
      setLoadingEnvioDetalle(false);
    }
  };

  const cerrarModalEnvio = () => {
    setModalEnvioAbierto(false);
    setEnvioDetalle(null);
    setErrorEnvioDetalle("");
  };

  // ----------------------------
  // ENVÍO: ACCIÓN LISTO PARA SALIR
  // ----------------------------
  const marcarEnvioListo = async () => {
    const id = envioDetalle?.envio?.id_envio;
    if (!id) return;

    setAccionEnvioLoading(true);
    try {
      const res = await api.post(`/base/envios/${id}/marcar_listo_salida/`);
      toast.success(
        res.data?.mensaje || "Envío marcado como LISTO PARA SALIR."
      );

      setEnvios((prev) => prev.filter((e) => e.id_envio !== id));
      cerrarModalEnvio();
    } catch (err) {
      console.error("Error al marcar envío:", err);
      const backendMsg =
        err.response?.data?.detail ||
        err.response?.data?.mensaje ||
        err.response?.data?.error;
      toast.error(
        backendMsg || "No se pudo marcar el envío como LISTO PARA SALIR."
      );
    } finally {
      setAccionEnvioLoading(false);
    }
  };

  // ----------------------------
  // MODAL CLIENTE
  // ----------------------------
  const cerrarModalCliente = () => {
    setModalClienteAbierto(false);
    setClienteData(null);
    setErrorCliente("");
  };

  const abrirModalCliente = async (idCliente, nombreFallback = "") => {
    if (!idCliente) return;

    setModalClienteAbierto(true);
    setClienteData(null);
    setErrorCliente("");
    setLoadingCliente(true);

    if (clientesCache[idCliente]) {
      setClienteData(clientesCache[idCliente]);
      setLoadingCliente(false);
      return;
    }

    try {
      const res = await api.get(`/base/clientes/${idCliente}/`);
      setClienteData(res.data);
      setClientesCache((prev) => ({ ...prev, [idCliente]: res.data }));
    } catch (err) {
      const backendMsg = err.response?.data?.detail || err.response?.data?.error;
      setErrorCliente(
        backendMsg ||
          "No se pudo cargar el detalle del cliente (posible restricción por permisos)."
      );
      const fallback = {
        id_cliente: idCliente,
        nombre: nombreFallback || `Cliente #${idCliente}`,
      };
      setClienteData(fallback);
      setClientesCache((prev) => ({ ...prev, [idCliente]: fallback }));
    } finally {
      setLoadingCliente(false);
    }
  };

  // ----------------------------
  // MODAL UNIDAD
  // ----------------------------
  const cerrarModalUnidad = () => {
    setModalUnidadAbierto(false);
    setUnidadData(null);
    setErrorUnidad("");
  };

  const abrirModalUnidad = async (envioLike) => {
    const idUnidad = getUnidadIdFromEnvio(envioLike);
    if (!idUnidad) {
      setModalUnidadAbierto(true);
      setUnidadData({ id_unidad: null, codigo_unidad: "Unidad no especificada" });
      setErrorUnidad("");
      setLoadingUnidad(false);
      return;
    }

    setModalUnidadAbierto(true);
    setUnidadData(null);
    setErrorUnidad("");
    setLoadingUnidad(true);

    if (unidadesCache[idUnidad]) {
      setUnidadData(unidadesCache[idUnidad]);
      setLoadingUnidad(false);
      return;
    }

    try {
      const res = await api.get(`/base/unidades/${idUnidad}/`);
      setUnidadData(res.data);
      setUnidadesCache((prev) => ({ ...prev, [idUnidad]: res.data }));
    } catch (err) {
      const backendMsg = err.response?.data?.detail || err.response?.data?.error;
      setErrorUnidad(backendMsg || "No se pudo cargar el detalle de la unidad.");
      const fallback = { id_unidad: idUnidad, codigo_unidad: `Unidad #${idUnidad}` };
      setUnidadData(fallback);
      setUnidadesCache((prev) => ({ ...prev, [idUnidad]: fallback }));
    } finally {
      setLoadingUnidad(false);
    }
  };

  // ----------------------------
  // MODAL ORDEN DESDE ENVÍO
  // ----------------------------
  const cerrarModalOrdenEnvio = () => {
    setModalOrdenEnvioAbierto(false);
    setOrdenEnvioDetalle(null);
    setErrorOrdenEnvioDetalle("");
  };

  const abrirModalOrdenEnvio = async (idOrden) => {
    if (!idOrden) return;

    setModalOrdenEnvioAbierto(true);
    setOrdenEnvioDetalle(null);
    setErrorOrdenEnvioDetalle("");
    setLoadingOrdenEnvioDetalle(true);

    try {
      const [resOrden, resDetalles] = await Promise.all([
        api.get(`/ordenes/${idOrden}/`),
        api.get(`/ordenes/${idOrden}/detalles/`),
      ]);

      const detallesArray = Array.isArray(resDetalles.data)
        ? resDetalles.data
        : resDetalles.data?.results || [];

      const payload = {
        orden: resOrden.data,
        detalles: detallesArray,
      };

      setOrdenEnvioDetalle(payload);

      const idCliente = getClienteIdFromOrden(payload.orden);
      const nombreCliente = getClienteNombreFromOrden(payload.orden);
      if (idCliente != null && nombreCliente) {
        setClientesCache((prev) => ({
          ...prev,
          [idCliente]: {
            ...(prev[idCliente] || {}),
            id_cliente: idCliente,
            nombre: nombreCliente,
          },
        }));
      }
    } catch (err) {
      console.error("Error cargando detalle de orden (desde envío):", err);
      const backendMsg = err.response?.data?.detail || err.response?.data?.error;
      setErrorOrdenEnvioDetalle(
        backendMsg || "No se pudo cargar el detalle de la orden."
      );
    } finally {
      setLoadingOrdenEnvioDetalle(false);
    }
  };

  // ----------------------------
  // RENDER
  // ----------------------------
  if (!user) {
    return (
      <div style={styles.page}>
        <div style={styles.headerRow}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <div style={styles.iconCircle}>
              <IconBox />
            </div>
            <div>
              <h2 style={styles.title}>Preparación de Órdenes</h2>
              <p style={styles.subtitle}>Cargando datos de usuario...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tipoUsuarioActual =
    user.tipo || (user.user && user.user.tipo) || "No especificado";

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.headerRow}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div style={styles.iconCircle}>
            <IconBox />
          </div>
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
        {/* ÓRDENES */}
        <div style={{ ...styles.sectionTitle, marginTop: 0 }}>
          Órdenes Pendientes
        </div>
        <div style={styles.hintMini}>
          Tip: haz click en el <strong>nombre del cliente</strong> para ver su ficha.
        </div>

        <div style={styles.controlsRow}>
          <div style={styles.searchWrap}>
            <input
              type="text"
              value={ordenesQuery}
              onChange={(e) => setOrdenesQuery(e.target.value)}
              placeholder="Buscar en órdenes (cliente, vendedor, # orden, fecha, estado...)"
              style={styles.searchInput}
            />
          </div>

          <div style={styles.sortWrap}>
            <span style={styles.sortLabel}>Ordenar por:</span>
            <div style={styles.selectWrapper}>
              <select
                value={ordenesSort}
                onChange={(e) => setOrdenesSort(e.target.value)}
                style={styles.select}
              >
                <option value="recientes">Más recientes</option>
                <option value="antiguas">Más antiguas</option>
                <option value="mayor_peso">Mayor peso</option>
                <option value="menor_peso">Menor peso</option>
                <option value="mayor_precio">Mayor precio</option>
                <option value="menor_precio">Menor precio</option>
              </select>
              <span style={styles.selectArrow}>▼</span>
            </div>
          </div>
        </div>

        <div style={styles.resumenResultados}>
          Mostrando {ordenesFiltradas.length} orden(es) (de {ordenes.length}).
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}># Orden</th>
                <th style={styles.th}>Cliente</th>
                <th style={styles.th}>Vendedor</th>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}>Peso (kg)</th>
                <th style={styles.th}>Total (Bs)</th>
                <th style={styles.th}>Estado</th>
                <th style={{ ...styles.th, textAlign: "center" }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {ordenesFiltradas.length === 0 && !loading && (
                <tr>
                  <td
                    style={{
                      ...styles.td,
                      textAlign: "center",
                      color: "#94a3b8",
                      padding: "30px",
                    }}
                    colSpan={8}
                  >
                    {ordenes.length === 0
                      ? "Por ahora no hay órdenes pendientes por preparación."
                      : "No hay órdenes que coincidan con la búsqueda/filtros."}
                  </td>
                </tr>
              )}

              {ordenesFiltradas.map((o, idx) => {
                const rowBase = idx % 2 === 1 ? styles.rowAlt : {};
                const idCliente = getClienteIdFromOrden(o);
                return (
                  <tr key={o.id_orden} style={rowBase}>
                    <td style={{ ...styles.td, fontWeight: 700, color: "#0d47a1" }}>
                      #{o.id_orden}
                    </td>
                    <td style={styles.td}>
                      <span
                        style={styles.clickable}
                        onClick={() =>
                          abrirModalCliente(idCliente, clienteLabelOrden(o))
                        }
                        title="Ver ficha del cliente"
                      >
                        {clienteLabelOrden(o)}
                      </span>
                      <div style={styles.hintMini}>
                        Click para ver info del cliente
                      </div>
                    </td>
                    <td style={styles.td}>{vendedorLabelOrden(o)}</td>
                    <td style={styles.td}>{formatDateOnly(o.fecha_orden)}</td>
                    <td style={styles.td}>{fmt2(o.peso_total)}</td>
                    <td style={styles.td}>{fmt2(o.precio_final)}</td>
                    <td style={styles.td}>
                      <span style={styles.badgeEstado}>{o.estado_de_envio}</span>
                    </td>
                    <td style={{ ...styles.td, textAlign: "center" }}>
                      <button
                        type="button"
                        style={styles.buttonPrimary}
                        onClick={() => abrirDetalleOrden(o.id_orden)}
                      >
                        <IconSearch /> Revisar
                      </button>
                    </td>
                  </tr>
                );
              })}

              {loading && (
                <tr>
                  <td style={{ ...styles.td, textAlign: "center" }} colSpan={8}>
                    Cargando...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ENVÍOS */}
        <div style={styles.sectionTitle}>Verificación de Envíos</div>
        <p style={styles.sectionSubtitle}>
          Verifica los envíos y márcalos como listos para salir.
        </p>

        <div style={styles.hintMini}>
          Tip: haz click en la <strong>unidad</strong> para ver su ficha.
        </div>

        {errorEnvios && <div style={styles.statusTextError}>{errorEnvios}</div>}

        <div style={styles.controlsRow}>
          <div style={styles.searchWrap}>
            <input
              type="text"
              value={enviosQuery}
              onChange={(e) => setEnviosQuery(e.target.value)}
              placeholder="Buscar en envíos (# envío, código, unidad, estado, peso...)"
              style={styles.searchInput}
            />
          </div>

          <div style={styles.sortWrap}>
            <span style={styles.sortLabel}>Ordenar por:</span>
            <div style={styles.selectWrapper}>
              <select
                value={enviosSort}
                onChange={(e) => setEnviosSort(e.target.value)}
                style={styles.select}
              >
                <option value="recientes">Más recientes</option>
                <option value="antiguas">Más antiguas</option>
                <option value="mayor_peso">Mayor peso</option>
                <option value="menor_peso">Menor peso</option>
                <option value="mayor_precio">Mayor precio</option>
                <option value="menor_precio">Menor precio</option>
              </select>
              <span style={styles.selectArrow}>▼</span>
            </div>
          </div>
        </div>

        <div style={styles.resumenResultados}>
          Mostrando {enviosFiltrados.length} envío(s) (de {envios.length}).
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}># Envío</th>
                <th style={styles.th}>Código</th>
                <th style={styles.th}>Unidad</th>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}>Órdenes (Prep./Total)</th>
                <th style={styles.th}>Peso (kg)</th>
                <th style={styles.th}>Estado</th>
                <th style={{ ...styles.th, textAlign: "center" }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {enviosFiltrados.length === 0 && !loadingEnvios && (
                <tr>
                  <td
                    style={{
                      ...styles.td,
                      textAlign: "center",
                      color: "#94a3b8",
                      padding: "30px",
                    }}
                    colSpan={8}
                  >
                    {envios.length === 0
                      ? "Por ahora no hay envíos pendientes por verificación."
                      : "No hay envíos que coincidan con la búsqueda/filtros."}
                  </td>
                </tr>
              )}

              {enviosFiltrados.map((e, idx) => {
                const rowBase = idx % 2 === 1 ? styles.rowAlt : {};
                const det = Array.isArray(e?.ordenes_detalle) ? e.ordenes_detalle : [];
                const total = e?.cantidad_ordenes_total ?? det.length ?? "-";
                const prep = e?.cantidad_ordenes_almacenista ?? countPreparadas(det);
                return (
                  <tr key={e.id_envio} style={rowBase}>
                    <td style={{ ...styles.td, fontWeight: 700, color: "#0d47a1" }}>
                      #{e.id_envio}
                    </td>
                    <td style={styles.td}>{e.codigo_envio || "-"}</td>
                    <td style={styles.td}>
                      <span
                        style={styles.clickable}
                        onClick={() => abrirModalUnidad(e)}
                        title="Ver ficha de la unidad"
                      >
                        {unidadLabel(e)}
                      </span>
                      <div style={styles.hintMini}>
                        Click para ver info de la unidad
                      </div>
                    </td>
                    <td style={styles.td}>{formatDateOnly(e.fecha_salida)}</td>
                    <td style={styles.td}>
                      {prep} / {total}
                    </td>
                    <td style={styles.td}>{fmt2(e.peso_total)}</td>
                    <td style={styles.td}>
                      <span style={styles.badgeEstado}>{e.estado || "SIN ESTADO"}</span>
                    </td>
                    <td style={{ ...styles.td, textAlign: "center" }}>
                      <button
                        type="button"
                        style={styles.buttonPrimary}
                        onClick={() => abrirDetalleEnvio(e.id_envio)}
                      >
                        <IconCheck /> Revisar
                      </button>
                    </td>
                  </tr>
                );
              })}

              {loadingEnvios && (
                <tr>
                  <td style={{ ...styles.td, textAlign: "center" }} colSpan={8}>
                    Cargando...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL ORDEN */}
      {modalOrdenAbierto && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeaderRow}>
              <h3 style={styles.modalTitle}>
                Detalles Orden
                {ordenDetalle?.orden?.id_orden
                  ? ` #${ordenDetalle.orden.id_orden}`
                  : ""}
              </h3>
              <button
                type="button"
                style={styles.modalCloseButton}
                onClick={cerrarModalOrden}
              >
                ✕
              </button>
            </div>

            {loadingOrdenDetalle && (
              <div style={styles.modalLine}>Cargando...</div>
            )}
            {errorOrdenDetalle && (
              <div style={{ ...styles.modalLine, color: "#b91c1c" }}>
                {errorOrdenDetalle}
              </div>
            )}

            {ordenDetalle && !loadingOrdenDetalle && !errorOrdenDetalle && (
              <>
                <div style={styles.modalSectionTitle}>Información General</div>

                <div style={styles.modalLine}>
                  <strong>Cliente:</strong>
                  <span
                    style={styles.clickable}
                    onClick={() =>
                      abrirModalCliente(
                        getClienteIdFromOrden(ordenDetalle.orden),
                        clienteLabelOrden(ordenDetalle.orden)
                      )
                    }
                    title="Ver ficha del cliente"
                  >
                    {clienteLabelOrden(ordenDetalle.orden)}
                  </span>
                </div>
                <div style={styles.hintMini}>
                  Click en el nombre del cliente para ver información.
                </div>

                <div style={styles.modalLine}>
                  <strong>Vendedor:</strong>{" "}
                  {vendedorLabelOrden(ordenDetalle.orden)}
                </div>
                <div style={styles.modalLine}>
                  <strong>Método de pago:</strong>{" "}
                  {ordenDetalle.orden.metodo_pago || "-"}
                </div>
                <div style={styles.modalLine}>
                  <strong>Fecha:</strong>{" "}
                  {formatDateOnly(ordenDetalle.orden.fecha_orden)}
                </div>
                <div style={styles.modalLine}>
                  <strong>Estado envío:</strong>{" "}
                  {ordenDetalle.orden.estado_de_envio || "-"}
                </div>
                <div style={styles.modalLine}>
                  <strong>Peso total:</strong> {fmt2(ordenDetalle.orden.peso_total)} kg
                </div>
                <div style={styles.modalLine}>
                  <strong>Total (Bs):</strong>{" "}
                  {fmt2(ordenDetalle.orden.precio_final)}
                </div>

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
                        <th style={styles.modalDetalleTh}>Peso unit.</th>
                        <th style={styles.modalDetalleTh}>Peso subtotal</th>
                        <th style={styles.modalDetalleTh}>Subtotal (Bs)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordenDetalle.detalles.map((d) => (
                        <tr key={d.id_detalleo}>
                          <td style={styles.modalDetalleTd}>
                            {d.producto || d.id_producto_nombre || "-"}
                          </td>
                          <td style={styles.modalDetalleTd}>{d.cantidad ?? "-"}</td>
                          <td style={styles.modalDetalleTd}>
                            {fmt2(d.peso_unitario)} kg
                          </td>
                          <td style={styles.modalDetalleTd}>
                            {fmt2(d.peso_subtotal)} kg
                          </td>
                          <td style={styles.modalDetalleTd}>{fmt2(d.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <div style={styles.modalActionsRow}>
                  <button
                    type="button"
                    style={styles.buttonSecondary}
                    onClick={cerrarModalOrden}
                    disabled={accionOrdenLoading}
                  >
                    Cerrar
                  </button>
                  <button
                    type="button"
                    style={{
                      ...styles.buttonPrimary,
                      ...(accionOrdenLoading ? styles.buttonPrimaryDisabled : {}),
                    }}
                    onClick={marcarComoPreparada}
                    disabled={accionOrdenLoading}
                  >
                    {accionOrdenLoading ? "Procesando..." : "Marcar PREPARADA"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL ENVÍO */}
      {modalEnvioAbierto && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeaderRow}>
              <h3 style={styles.modalTitle}>
                Detalles Envío
                {envioDetalle?.envio?.id_envio
                  ? ` #${envioDetalle.envio.id_envio}`
                  : ""}
              </h3>
              <button
                type="button"
                style={styles.modalCloseButton}
                onClick={cerrarModalEnvio}
              >
                ✕
              </button>
            </div>

            {loadingEnvioDetalle && (
              <div style={styles.modalLine}>Cargando...</div>
            )}
            {errorEnvioDetalle && (
              <div style={{ ...styles.modalLine, color: "#b91c1c" }}>
                {errorEnvioDetalle}
              </div>
            )}

            {envioDetalle && !loadingEnvioDetalle && !errorEnvioDetalle && (
              <>
                <div style={styles.modalSectionTitle}>Datos del Envío</div>

                <div style={styles.modalLine}>
                  <strong>Código:</strong> {envioDetalle.envio?.codigo_envio || "-"}
                </div>

                <div style={styles.modalLine}>
                  <strong>Unidad:</strong>
                  <span
                    style={styles.clickable}
                    onClick={() => abrirModalUnidad(envioDetalle.envio)}
                    title="Ver ficha de la unidad"
                  >
                    {unidadLabel(envioDetalle.envio)}
                  </span>
                </div>
                <div style={styles.hintMini}>
                  Click en la unidad para ver información.
                </div>

                <div style={styles.modalLine}>
                  <strong>Fecha:</strong>{" "}
                  {formatDateOnly(envioDetalle.envio?.fecha_salida)}
                </div>
                <div style={styles.modalLine}>
                  <strong>Peso total:</strong>{" "}
                  {fmt2(envioDetalle.envio?.peso_total)} kg
                </div>
                <div style={styles.modalLine}>
                  <strong>Estado:</strong> {envioDetalle.envio?.estado || "-"}
                </div>

                <div style={styles.modalSectionTitle}>Órdenes Incluidas</div>
                <div style={styles.hintMini}>
                  Tip: puedes hacer click en una <strong>orden</strong> para ver
                  productos y cliente.
                </div>

                {(() => {
                  const ordenesDet = getEnvioOrdenesDetalle(envioDetalle);
                  if (!ordenesDet || ordenesDet.length === 0) {
                    return (
                      <div style={styles.modalLine}>No hay órdenes asociadas.</div>
                    );
                  }

                  return (
                    <table style={styles.modalDetalleTable}>
                      <thead>
                        <tr>
                          <th style={styles.modalDetalleTh}># Orden</th>
                          <th style={styles.modalDetalleTh}>Cliente</th>
                          <th style={styles.modalDetalleTh}>Peso</th>
                          <th style={styles.modalDetalleTh}>Total (Bs)</th>
                          <th style={styles.modalDetalleTh}>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ordenesDet.map((o) => (
                          <tr key={o.id_orden}>
                            <td style={styles.modalDetalleTd}>
                              <span
                                style={styles.clickable}
                                onClick={() => abrirModalOrdenEnvio(o.id_orden)}
                                title="Ver detalle de la orden"
                              >
                                #{o.id_orden}
                              </span>
                            </td>
                            <td style={styles.modalDetalleTd}>
                              <span
                                style={styles.clickable}
                                onClick={() =>
                                  abrirModalCliente(
                                    o?.id_cliente,
                                    o?.cliente_nombre ||
                                      (o?.id_cliente
                                        ? `Cliente #${o.id_cliente}`
                                        : "Cliente")
                                  )
                                }
                                title="Ver ficha del cliente"
                              >
                                {o.cliente_nombre ||
                                  (o?.id_cliente ? `Cliente #${o.id_cliente}` : "-")}
                              </span>
                            </td>
                            <td style={styles.modalDetalleTd}>
                              {fmt2(o.peso_total)} kg
                            </td>
                            <td style={styles.modalDetalleTd}>
                              {fmt2(o.precio_final)}
                            </td>
                            <td style={styles.modalDetalleTd}>
                              {o.estado_de_envio || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}

                <div style={styles.modalActionsRow}>
                  <button
                    type="button"
                    style={styles.buttonSecondary}
                    onClick={cerrarModalEnvio}
                    disabled={accionEnvioLoading}
                  >
                    Cerrar
                  </button>
                  <button
                    type="button"
                    style={{
                      ...styles.buttonPrimary,
                      ...(accionEnvioLoading ? styles.buttonPrimaryDisabled : {}),
                    }}
                    onClick={marcarEnvioListo}
                    disabled={accionEnvioLoading}
                  >
                    {accionEnvioLoading
                      ? "Procesando..."
                      : "Marcar LISTO PARA SALIR"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL CLIENTE */}
      {modalClienteAbierto && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeaderRow}>
              <h3 style={styles.modalTitle}>Ficha del Cliente</h3>
              <button
                type="button"
                style={styles.modalCloseButton}
                onClick={cerrarModalCliente}
              >
                ✕
              </button>
            </div>

            {loadingCliente && (
              <div style={styles.modalLine}>Cargando...</div>
            )}
            {errorCliente && (
              <div style={{ ...styles.modalLine, color: "#b91c1c" }}>
                {errorCliente}
              </div>
            )}

            {clienteData && !loadingCliente && (
              <>
                <div style={styles.modalSectionTitle}>Información General</div>
                <div style={styles.modalLine}>
                  <strong>ID:</strong>{" "}
                  {clienteData.id_cliente ?? clienteData.id ?? "-"}
                </div>
                <div style={styles.modalLine}>
                  <strong>Nombre:</strong> {clienteData.nombre || "-"}
                </div>
                <div style={styles.modalLine}>
                  <strong>Teléfono:</strong> {clienteData.telefono || "-"}
                </div>
                <div style={styles.modalLine}>
                  <strong>Correo:</strong> {clienteData.correo || "-"}
                </div>
                <div style={styles.modalLine}>
                  <strong>Dirección:</strong> {clienteData.direccion || "-"}
                </div>
                <div style={styles.modalLine}>
                  <strong>Activo:</strong>{" "}
                  {clienteData.activo === false ? "NO" : "SÍ"}
                </div>
                <div style={styles.modalLine}>
                  <strong>Vendedor (id_usuario):</strong>{" "}
                  {isObject(clienteData.id_usuario)
                    ? clienteData.id_usuario.id_usuario ?? clienteData.id_usuario.id
                    : clienteData.id_usuario ?? "-"}
                </div>

                <div style={styles.modalActionsRow}>
                  <button
                    type="button"
                    style={styles.buttonSecondary}
                    onClick={cerrarModalCliente}
                  >
                    Cerrar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL UNIDAD */}
      {modalUnidadAbierto && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeaderRow}>
              <h3 style={styles.modalTitle}>Ficha de la Unidad</h3>
              <button
                type="button"
                style={styles.modalCloseButton}
                onClick={cerrarModalUnidad}
              >
                ✕
              </button>
            </div>

            {loadingUnidad && <div style={styles.modalLine}>Cargando...</div>}
            {errorUnidad && (
              <div style={{ ...styles.modalLine, color: "#b91c1c" }}>
                {errorUnidad}
              </div>
            )}

            {unidadData && !loadingUnidad && (
              <>
                <div style={styles.modalSectionTitle}>Información General</div>
                <div style={styles.modalLine}>
                  <strong>ID:</strong>{" "}
                  {unidadData.id_unidad ?? unidadData.id ?? "-"}
                </div>
                <div style={styles.modalLine}>
                  <strong>Código unidad:</strong> {unidadData.codigo_unidad || "-"}
                </div>
                <div style={styles.modalLine}>
                  <strong>Placa:</strong> {unidadData.placa || "-"}
                </div>
                <div style={styles.modalLine}>
                  <strong>Teléfono:</strong> {unidadData.telefono || "-"}
                </div>
                <div style={styles.modalLine}>
                  <strong>Estado:</strong> {unidadData.estado || "-"}
                </div>
                <div style={styles.modalLine}>
                  <strong>Capacidad de carga:</strong>{" "}
                  {fmt2(unidadData.capacidad_carga)}
                </div>
                <div style={styles.modalLine}>
                  <strong>Transportista (id_usuario):</strong>{" "}
                  {isObject(unidadData.id_usuario)
                    ? unidadData.id_usuario.id_usuario ?? unidadData.id_usuario.id
                    : unidadData.id_usuario ?? "-"}
                </div>

                <div style={styles.modalActionsRow}>
                  <button
                    type="button"
                    style={styles.buttonSecondary}
                    onClick={cerrarModalUnidad}
                  >
                    Cerrar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL ORDEN (desde envío) */}
      {modalOrdenEnvioAbierto && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeaderRow}>
              <h3 style={styles.modalTitle}>
                Detalle Orden
                {ordenEnvioDetalle?.orden?.id_orden
                  ? ` #${ordenEnvioDetalle.orden.id_orden}`
                  : ""}
              </h3>
              <button
                type="button"
                style={styles.modalCloseButton}
                onClick={cerrarModalOrdenEnvio}
              >
                ✕
              </button>
            </div>

            {loadingOrdenEnvioDetalle && (
              <div style={styles.modalLine}>Cargando...</div>
            )}
            {errorOrdenEnvioDetalle && (
              <div style={{ ...styles.modalLine, color: "#b91c1c" }}>
                {errorOrdenEnvioDetalle}
              </div>
            )}

            {ordenEnvioDetalle &&
              !loadingOrdenEnvioDetalle &&
              !errorOrdenEnvioDetalle && (
                <>
                  <div style={styles.modalSectionTitle}>Información General</div>
                  <div style={styles.modalLine}>
                    <strong>Cliente:</strong>
                    <span
                      style={styles.clickable}
                      onClick={() =>
                        abrirModalCliente(
                          getClienteIdFromOrden(ordenEnvioDetalle.orden),
                          clienteLabelOrden(ordenEnvioDetalle.orden)
                        )
                      }
                      title="Ver ficha del cliente"
                    >
                      {clienteLabelOrden(ordenEnvioDetalle.orden)}
                    </span>
                  </div>
                  <div style={styles.hintMini}>
                    Click en el nombre del cliente para ver su ficha completa.
                  </div>
                  <div style={styles.modalLine}>
                    <strong>Fecha:</strong>{" "}
                    {formatDateOnly(ordenEnvioDetalle.orden?.fecha_orden)}
                  </div>
                  <div style={styles.modalLine}>
                    <strong>Peso total:</strong>{" "}
                    {fmt2(ordenEnvioDetalle.orden?.peso_total)} kg
                  </div>
                  <div style={styles.modalLine}>
                    <strong>Total (Bs):</strong>{" "}
                    {fmt2(ordenEnvioDetalle.orden?.precio_final)}
                  </div>
                  <div style={styles.modalLine}>
                    <strong>Estado envío:</strong>{" "}
                    {ordenEnvioDetalle.orden?.estado_de_envio || "-"}
                  </div>

                  <div style={styles.modalSectionTitle}>Productos</div>
                  {(!ordenEnvioDetalle.detalles ||
                    ordenEnvioDetalle.detalles.length === 0) && (
                    <div style={styles.modalLine}>No hay productos.</div>
                  )}

                  {ordenEnvioDetalle.detalles &&
                    ordenEnvioDetalle.detalles.length > 0 && (
                      <table style={styles.modalDetalleTable}>
                        <thead>
                          <tr>
                            <th style={styles.modalDetalleTh}>Producto</th>
                            <th style={styles.modalDetalleTh}>Cant.</th>
                            <th style={styles.modalDetalleTh}>Peso unit.</th>
                            <th style={styles.modalDetalleTh}>Peso subtotal</th>
                            <th style={styles.modalDetalleTh}>Subtotal (Bs)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ordenEnvioDetalle.detalles.map((d) => (
                            <tr key={d.id_detalleo}>
                              <td style={styles.modalDetalleTd}>
                                {d.producto || d.id_producto_nombre || "-"}
                              </td>
                              <td style={styles.modalDetalleTd}>
                                {d.cantidad ?? "-"}
                              </td>
                              <td style={styles.modalDetalleTd}>
                                {fmt2(d.peso_unitario)} kg
                              </td>
                              <td style={styles.modalDetalleTd}>
                                {fmt2(d.peso_subtotal)} kg
                              </td>
                              <td style={styles.modalDetalleTd}>
                                {fmt2(d.subtotal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                  <div style={styles.modalActionsRow}>
                    <button
                      type="button"
                      style={styles.buttonSecondary}
                      onClick={cerrarModalOrdenEnvio}
                    >
                      Cerrar
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