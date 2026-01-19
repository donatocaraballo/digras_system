// frontend/src/pages/GerenteAprobaciones.jsx

import React, { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import { toast } from "react-hot-toast";

// --- ICONOS SVG ---
const IconShield = () => (
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
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
);
const IconCheck = () => (
  <svg
    width="20"
    height="20"
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
const IconX = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);
const IconInfo = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);
const IconSearch = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="7"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);
const IconSort = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 18h6"></path>
    <path d="M3 6h12"></path>
    <path d="M3 12h9"></path>
    <path d="M18 9l3 3-3 3"></path>
  </svg>
);

// --- ESTILOS PREMIUM DIGRAS ---
const styles = {
  page: {
    paddingTop: "40px",
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

  // LAYOUT DE COLUMNAS
  columns: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.8fr) minmax(0, 1.2fr)",
    gap: "30px",
    alignItems: "flex-start",
  },

  // TARJETA BLANCA IZQUIERDA
  listsCard: {
    background: "#ffffff",
    borderRadius: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
    padding: "30px",
    border: "1px solid #f0f0f0",
  },

  // Barra de resumen
  summaryBar: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#f0f9ff",
    border: "1px solid #bae6fd",
    color: "#0369a1",
    padding: "10px 15px",
    borderRadius: "10px",
    fontSize: "0.9rem",
    fontWeight: "600",
    marginBottom: "25px",
  },

  // Títulos de sección
  sectionHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  sectionTitle: {
    fontSize: "0.95rem",
    fontWeight: "700",
    color: "#334155",
    paddingLeft: "8px",
    borderLeft: "4px solid #0d47a1",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  sectionTitleGreen: {
    fontSize: "0.95rem",
    fontWeight: "700",
    color: "#334155",
    paddingLeft: "8px",
    borderLeft: "4px solid #16a34a",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  sectionCounter: {
    fontSize: "0.78rem",
    color: "#64748b",
    fontWeight: "600",
  },

  // MINI TOOLBAR POR TABLA
  tableToolbar: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1.2fr) minmax(0, 0.8fr) minmax(0, 0.8fr) minmax(0, 0.8fr)",
    gap: "10px",
    marginBottom: "10px",
    alignItems: "center",
  },
  rangeToolbar: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
    gap: "10px",
    marginBottom: "12px",
    alignItems: "center",
  },
  inputGroup: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  inputSmall: {
    height: "34px",
    width: "100%",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    padding: "0 30px 0 12px",
    fontSize: "0.8rem",
    outline: "none",
    color: "#334155",
    backgroundColor: "#fff",
    boxSizing: "border-box",
  },
  inputNumber: {
    height: "34px",
    width: "100%",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    padding: "0 12px",
    fontSize: "0.8rem",
    outline: "none",
    color: "#334155",
    backgroundColor: "#fff",
    boxSizing: "border-box",
  },
  inputIconRight: {
    position: "absolute",
    right: 10,
    color: "#94a3b8",
  },
  selectSmall: {
    height: "34px",
    width: "100%",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    padding: "0 10px",
    fontSize: "0.8rem",
    outline: "none",
    color: "#334155",
    backgroundColor: "#fff",
    boxSizing: "border-box",
  },
  selectWithIcon: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  selectIconLeft: {
    position: "absolute",
    left: 10,
    color: "#94a3b8",
    pointerEvents: "none",
  },
  selectPadded: {
    height: "34px",
    width: "100%",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    padding: "0 10px 0 36px",
    fontSize: "0.8rem",
    outline: "none",
    color: "#334155",
    backgroundColor: "#fff",
    boxSizing: "border-box",
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
  cellSubtext: {
    display: "block",
    marginTop: "3px",
    fontSize: "0.72rem",
    color: "#94a3b8",
    fontWeight: "600",
    lineHeight: 1.15,
  },

  // Botón pequeño
  btnSmall: {
    padding: "6px 12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    background: "transparent",
    color: "#64748b",
    fontSize: "0.75rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },

  // DETALLE (DERECHA)
  detailWrapper: {
    position: "sticky",
    top: "20px",
  },
  detailCard: {
    background: "#eff6ff",
    borderRadius: "20px",
    padding: "25px",
    border: "1px solid #bfdbfe",
    boxShadow: "0 10px 25px rgba(37, 99, 235, 0.05)",
  },
  detailHeader: {
    marginBottom: "10px",
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
    gap: "10px",
  },
  detailLabel: {
    fontWeight: "600",
    color: "#64748b",
    flex: "0 0 auto",
  },
  detailValue: {
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "right",
    wordBreak: "break-word",
  },
  detailValueLink: {
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "right",
    wordBreak: "break-word",
    cursor: "pointer",
    textDecoration: "underline",
    textUnderlineOffset: "3px",
  },
  detailHintClick: {
    marginTop: "6px",
    fontSize: "0.78rem",
    color: "#94a3b8",
    fontWeight: "600",
  },
  modalCloseIconBtn: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    color: "#64748b",
  },

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

  // Botones acciones
  actionsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "15px",
    marginTop: "20px",
  },
  btnApprove: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
    color: "#fff",
    fontWeight: "700",
    fontSize: "0.9rem",
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(22, 163, 74, 0.3)",
  },
  btnReject: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #fecaca",
    background: "#fff1f2",
    color: "#ef4444",
    fontWeight: "700",
    fontSize: "0.9rem",
    cursor: "pointer",
  },
  btnDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
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

  // Badges y mensajes
  pillEstado: (bg, color) => ({
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: "20px",
    fontSize: "0.7rem",
    fontWeight: "700",
    background: bg,
    color: color,
    border: `1px solid ${bg}`,
    whiteSpace: "nowrap",
  }),
  statusTextError: {
    padding: "12px",
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: "10px",
    marginBottom: "20px",
    border: "1px solid #fecaca",
    fontSize: "0.9rem",
  },
  emptyState: {
    padding: "30px",
    textAlign: "center",
    color: "#94a3b8",
    fontStyle: "italic",
  },
  emptyDetail: {
    padding: "40px",
    textAlign: "center",
    color: "#94a3b8",
    fontStyle: "italic",
    border: "2px dashed #cbd5e1",
    borderRadius: "16px",
    background: "#f8fafc",
  },

  // Spinner
  spinner: {
    width: "16px",
    height: "16px",
    borderRadius: "999px",
    border: "2px solid rgba(255,255,255,0.55)",
    borderTopColor: "rgba(255,255,255,1)",
    animation: "spin 0.8s linear infinite",
  },

  // Modal
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 60,
  },
  modalCard: {
    width: "min(560px, 100%)",
    background: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
    overflow: "hidden",
  },
  modalHeader: {
    padding: "16px 18px",
    borderBottom: "1px solid #f1f5f9",
    background: "#f8fafc",
  },
  modalTitle: {
    margin: 0,
    fontSize: "1rem",
    fontWeight: 800,
    color: "#0f172a",
  },
  modalBody: {
    padding: "18px",
    color: "#334155",
    fontSize: "0.92rem",
    lineHeight: 1.45,
  },
  modalFooter: {
    padding: "16px 18px",
    borderTop: "1px solid #f1f5f9",
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    background: "#ffffff",
  },
  modalBtn: {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#334155",
    fontWeight: 700,
    cursor: "pointer",
  },
  modalBtnApprove: {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "none",
    background: "#16a34a",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },
  modalBtnReject: {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "none",
    background: "#ef4444",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },
};

// Helper de Estado
function pillEstadoEnvio(estado) {
  if (!estado) return styles.pillEstado("#e5e7eb", "#374151");
  const t = String(estado).toUpperCase();
  if (t.includes("PENDIENTE")) return styles.pillEstado("#fef3c7", "#a16207");
  if (t.includes("APROBADA") || t.includes("APROBADO"))
    return styles.pillEstado("#dcfce7", "#166534");
  if (t.includes("RECHAZADA") || t.includes("RECHAZADO"))
    return styles.pillEstado("#fee2e2", "#b91c1c");
  return styles.pillEstado("#e5e7eb", "#374151");
}

function normalize(val) {
  return (val ?? "").toString().trim().toLowerCase();
}

function parseNumber(val) {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(val) {
  const n = parseNumber(val);
  try {
    return new Intl.NumberFormat("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return n.toFixed(2);
  }
}

function formatDate(val) {
  if (!val) return "—";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return String(val);
  try {
    return d.toLocaleDateString("es-VE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return String(val);
  }
}

function getBackendMessage(err) {
  const data = err?.response?.data;
  if (!data) return "Error inesperado.";
  if (typeof data === "string") return data;
  if (data.detail) return String(data.detail);
  if (data.error) return String(data.error);
  if (data.message) return String(data.message);
  try {
    const keys = Object.keys(data);
    if (keys.length === 1) {
      const k = keys[0];
      const v = data[k];
      if (Array.isArray(v)) return `${k}: ${v.join(", ")}`;
      return `${k}: ${String(v)}`;
    }
    return JSON.stringify(data);
  } catch {
    return "Error inesperado.";
  }
}

function ConfirmModal({
  open,
  title,
  children,
  confirmText,
  confirmStyle,
  onClose,
  onConfirm,
  busy,
}) {
  if (!open) return null;

  return (
    <div style={styles.modalOverlay} onMouseDown={onClose}>
      <div style={styles.modalCard} onMouseDown={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h4 style={styles.modalTitle}>{title}</h4>
        </div>
        <div style={styles.modalBody}>{children}</div>
        <div style={styles.modalFooter}>
          <button
            style={{ ...styles.modalBtn, ...(busy ? styles.btnDisabled : {}) }}
            onClick={onClose}
            disabled={busy}
            type="button"
          >
            Cancelar
          </button>
          <button
            style={{
              ...(confirmStyle || styles.modalBtnApprove),
              ...(busy ? styles.btnDisabled : {}),
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
            onClick={onConfirm}
            disabled={busy}
            type="button"
          >
            {busy ? (
              <span
                style={{
                  ...styles.spinner,
                  borderColor: "rgba(255,255,255,0.35)",
                  borderTopColor: "rgba(255,255,255,1)",
                }}
              />
            ) : null}
            {busy ? "Procesando..." : confirmText}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
      `}</style>
    </div>
  );
}

export default function GerenteAprobaciones() {
  const [ordenesPendientes, setOrdenesPendientes] = useState([]);
  const [comprasPendientes, setComprasPendientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [seleccion, setSeleccion] = useState(null);

  // Filtros / ordenamiento ÓRDENES
  const [searchOrden, setSearchOrden] = useState("");
  const [filterUsuarioOrden, setFilterUsuarioOrden] = useState("");
  const [filterClienteOrden, setFilterClienteOrden] = useState("");
  const [sortOrden, setSortOrden] = useState("recientes"); // "recientes" | "antiguas"
  const [minOrden, setMinOrden] = useState("");
  const [maxOrden, setMaxOrden] = useState("");

  // Filtros / ordenamiento COMPRAS
  const [searchCompra, setSearchCompra] = useState("");
  const [filterUsuarioCompra, setFilterUsuarioCompra] = useState("");
  const [filterProveedorCompra, setFilterProveedorCompra] = useState("");
  const [sortCompra, setSortCompra] = useState("recientes");
  const [minCompra, setMinCompra] = useState("");
  const [maxCompra, setMaxCompra] = useState("");

  // Estado de acción (aprobar/rechazar)
  const [actionBusy, setActionBusy] = useState(false);
  const [actionType, setActionType] = useState(null); // "approve" | "reject" | null

  // Modal confirmación
  const [confirm, setConfirm] = useState({ open: false, action: null });

  // Modal info Cliente / Proveedor
  const [infoEntidad, setInfoEntidad] = useState({
    open: false,
    tipo: null, // "cliente" | "proveedor"
    id: null,
    data: null,
    loading: false,
    error: "",
  });

  const closeInfoEntidad = () => {
    setInfoEntidad({ open: false, tipo: null, id: null, data: null, loading: false, error: "" });
  };

  const fetchProveedor = async (id) => {
    // Intentos comunes (ajusta a tu ruta real si es distinta)
    const tries = [
      `/compras/proveedores/${id}/`,
      `/compras/proveedor/${id}/`,
      `/proveedores/${id}/`,
      `/base/proveedores/${id}/`,
    ];
    let lastErr = null;
    for (const url of tries) {
      try {
        const r = await api.get(url);
        return r.data;
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error("No se pudo obtener el proveedor");
  };

  const openInfoEntidad = async (sel) => {
    if (!sel) return;

    const isOrden = sel.tipo === "orden";
    const tipo = isOrden ? "cliente" : "proveedor";
    const id = isOrden ? sel.item.id_cliente : sel.item.id_proveedor;

    if (!id) {
      toast.error(`No se encontró el ID del ${tipo}.`);
      return;
    }

    setInfoEntidad({ open: true, tipo, id, data: null, loading: true, error: "" });

    try {
      let data;
      if (tipo === "cliente") {
        const r = await api.get(`/base/clientes/${id}/`);
        data = r.data;
      } else {
        data = await fetchProveedor(id);
      }
      setInfoEntidad((prev) => (prev.open ? { ...prev, data, loading: false } : prev));
    } catch (err) {
      const msg = getBackendMessage(err);
      setInfoEntidad((prev) => (prev.open ? { ...prev, loading: false, error: msg || `Error al cargar ${tipo}.` } : prev));
    }
  };

  const cargarPendientes = async () => {
    setLoading(true);
    setError("");
    setMensaje("");
    try {
      const resOrdenes = await api.get("/ordenes/", {
        params: { estado_envio: "PENDIENTE POR APROBACIÓN" },
      });
      const dataOrdenes = Array.isArray(resOrdenes.data)
        ? resOrdenes.data
        : resOrdenes.data.results || [];

      const resCompras = await api.get("/compras/compras/");
      const dataComprasRaw = Array.isArray(resCompras.data)
        ? resCompras.data
        : resCompras.data.results || [];
      const dataCompras = dataComprasRaw.filter((c) => {
        if (!c.estado_de_envio) return false;
        const norm = String(c.estado_de_envio).replace("_", " ").toUpperCase();
        return norm.includes("PENDIENTE") && norm.includes("APROB");
      });

      setOrdenesPendientes(dataOrdenes);
      setComprasPendientes(dataCompras);
      setMensaje(
        `Órdenes pendientes: ${dataOrdenes.length} | Compras pendientes: ${dataCompras.length}`
      );
    } catch (err) {
      setError("No se pudieron cargar los datos pendientes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPendientes();
  }, []);

  const verOrden = async (orden) => {
    setSeleccion({
      tipo: "orden",
      item: orden,
      detalles: [],
      loading: true,
      error: "",
    });
    try {
      const res = await api.get(`/ordenes/${orden.id_orden}/detalles/`);
      const detalles = Array.isArray(res.data)
        ? res.data
        : res.data.results || [];
      setSeleccion((prev) =>
        prev && prev.tipo === "orden" && prev.item.id_orden === orden.id_orden
          ? { ...prev, detalles, loading: false }
          : prev
      );
    } catch (err) {
      setSeleccion((prev) =>
        prev
          ? { ...prev, loading: false, error: "Error al cargar detalles." }
          : prev
      );
    }
  };

  const verCompra = async (compra) => {
    setSeleccion({
      tipo: "compra",
      item: compra,
      detalles: [],
      loading: true,
      error: "",
    });
    try {
      const res = await api.get("/compras/detalle-compras/", {
        params: { id_compra: compra.id_compra },
      });
      const raw = Array.isArray(res.data) ? res.data : res.data.results || [];
      const detalles = raw.filter((d) => {
        const val =
          d.id_compra_id ??
          d.id_compra ??
          (typeof d.id_compra === "object" ? d.id_compra.id_compra : null);
        return Number(val) === Number(compra.id_compra);
      });
      setSeleccion((prev) =>
        prev && prev.tipo === "compra" && prev.item.id_compra === compra.id_compra
          ? { ...prev, detalles, loading: false }
          : prev
      );
    } catch (err) {
      setSeleccion((prev) =>
        prev
          ? { ...prev, loading: false, error: "Error al cargar detalles." }
          : prev
      );
    }
  };

  const totalDetallesSeleccion = () => {
    if (!seleccion || !seleccion.detalles) return 0;
    return seleccion.detalles.reduce(
      (acc, d) => acc + parseNumber(d.subtotal ?? 0),
      0
    );
  };

  const currencySymbol = seleccion?.tipo === "orden" ? "$" : "$";

  const getEntidad = (sel) => {
    if (!sel) return "—";
    if (sel.tipo === "orden")
      return sel.item.id_cliente_nombre || `Cli #${sel.item.id_cliente}`;
    return sel.item.id_proveedor_nombre || `Prov #${sel.item.id_proveedor}`;
  };

  const getFechaSel = (sel) => {
    if (!sel) return "—";
    return sel.tipo === "orden"
      ? formatDate(sel.item.fecha_orden)
      : formatDate(sel.item.fecha_pedido);
  };

  const openConfirm = (action) => {
    if (!seleccion) return;
    setConfirm({ open: true, action });
  };

  const closeConfirm = () => {
    if (actionBusy) return;
    setConfirm({ open: false, action: null });
  };

  const ejecutarAccion = async (action) => {
    if (!seleccion) return;

    setActionBusy(true);
    setActionType(action);

    const isOrden = seleccion.tipo === "orden";
    const id = isOrden ? seleccion.item.id_orden : seleccion.item.id_compra;

    try {
      if (action === "approve") {
        if (isOrden) {
          await api.post(`/ordenes/${id}/aprobar/`);
          toast.success(`Orden #${id} aprobada correctamente.`);
        } else {
          await api.post(`/compras/compras/${id}/aprobar/`);
          toast.success(`Compra #${id} aprobada correctamente.`);
        }
      } else {
        if (isOrden) {
          await api.post(`/ordenes/${id}/rechazar/`);
          toast.success(`Orden #${id} rechazada correctamente.`);
        } else {
          await api.post(`/compras/compras/${id}/rechazar/`);
          toast.success(`Compra #${id} rechazada correctamente.`);
        }
      }

      setSeleccion(null);
      setConfirm({ open: false, action: null });
      await cargarPendientes();
    } catch (err) {
      const msg = getBackendMessage(err);
      const label = isOrden ? `orden #${id}` : `compra #${id}`;
      toast.error(
        `Error al ${action === "approve" ? "aprobar" : "rechazar"} la ${label}: ${msg}`
      );
    } finally {
      setActionBusy(false);
      setActionType(null);
    }
  };

  // Lista de usuarios únicos (creador) por cada tipo
  const usuariosOrdenes = useMemo(() => {
    return Array.from(
      new Set(
        ordenesPendientes.map((o) => o.id_usuario_username).filter((u) => !!u)
      )
    );
  }, [ordenesPendientes]);

  const usuariosCompras = useMemo(() => {
    return Array.from(
      new Set(
        comprasPendientes.map((c) => c.id_usuario_username).filter((u) => !!u)
      )
    );
  }, [comprasPendientes]);

  const clientesOrdenes = useMemo(() => {
    const map = new Map();
    for (const o of ordenesPendientes) {
      const id = o.id_cliente;
      const nombre = o.id_cliente_nombre || `Cli #${id}`;
      if (id !== undefined && id !== null && !map.has(String(id))) {
        map.set(String(id), nombre);
      }
    }
    return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [ordenesPendientes]);

  const proveedoresCompras = useMemo(() => {
    const map = new Map();
    for (const c of comprasPendientes) {
      const id = c.id_proveedor;
      const nombre = c.id_proveedor_nombre || `Prov #${id}`;
      if (id !== undefined && id !== null && !map.has(String(id))) {
        map.set(String(id), nombre);
      }
    }
    return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [comprasPendientes]);

  // ÓRDENES filtradas + ordenadas
  const ordenesFiltradas = useMemo(() => {
    const min = minOrden !== "" ? parseNumber(minOrden) : null;
    const max = maxOrden !== "" ? parseNumber(maxOrden) : null;

    return ordenesPendientes
      .filter((o) => {
        const term = normalize(searchOrden);
        if (term) {
          const texto = `${o.id_orden} ${o.id_cliente_nombre || ""} ${
            o.id_usuario_username || ""
          } ${o.metodo_pago || ""}`;
          if (!normalize(texto).includes(term)) return false;
        }
        if (filterUsuarioOrden) {
          if (o.id_usuario_username !== filterUsuarioOrden) return false;
        }
        if (filterClienteOrden) {
          if (String(o.id_cliente) !== String(filterClienteOrden)) return false;
        }
        const total = parseNumber(o.precio_final ?? 0);
        if (min !== null && total < min) return false;
        if (max !== null && total > max) return false;
        return true;
      })
      .slice()
      .sort((a, b) => {
        const da = a.fecha_orden ? new Date(a.fecha_orden) : new Date(0);
        const db = b.fecha_orden ? new Date(b.fecha_orden) : new Date(0);
        if (sortOrden === "antiguas") return da - db;
        return db - da;
      });
  }, [
    ordenesPendientes,
    searchOrden,
    filterUsuarioOrden,
    filterClienteOrden,
    sortOrden,
    minOrden,
    maxOrden,
  ]);

  // COMPRAS filtradas + ordenadas
  const comprasFiltradas = useMemo(() => {
    const min = minCompra !== "" ? parseNumber(minCompra) : null;
    const max = maxCompra !== "" ? parseNumber(maxCompra) : null;

    function cFecha(c) {
      return c.fecha_pedido ? new Date(c.fecha_pedido) : new Date(0);
    }

    return comprasPendientes
      .filter((c) => {
        const term = normalize(searchCompra);
        if (term) {
          const texto = `${c.id_compra} ${c.id_proveedor_nombre || ""} ${
            c.id_usuario_username || ""
          } ${c.metodo_pago || ""}`;
          if (!normalize(texto).includes(term)) return false;
        }
        if (filterUsuarioCompra) {
          if (c.id_usuario_username !== filterUsuarioCompra) return false;
        }
        if (filterProveedorCompra) {
          if (String(c.id_proveedor) !== String(filterProveedorCompra)) return false;
        }
        const total = parseNumber(c.precio_final ?? 0);
        if (min !== null && total < min) return false;
        if (max !== null && total > max) return false;
        return true;
      })
      .slice()
      .sort((a, b) => {
        const da = cFecha(a);
        const db = cFecha(b);
        if (sortCompra === "antiguas") return da - db;
        return db - da;
      });
  }, [
    comprasPendientes,
    searchCompra,
    filterUsuarioCompra,
    filterProveedorCompra,
    sortCompra,
    minCompra,
    maxCompra,
  ]);

  const actionLabel = confirm.action === "approve" ? "Aprobar" : "Rechazar";
  const isReject = confirm.action === "reject";

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.headerRow}>
        <div style={styles.iconCircle}>
          <IconShield />
        </div>
        <div>
          <h2 style={styles.title}>Aprobaciones Gerenciales</h2>
          <p style={styles.subtitle}>
            Gestión de solicitudes pendientes de Ventas y Compras
          </p>
        </div>
      </div>

      {error && <div style={styles.statusTextError}>{error}</div>}

      <div style={styles.columns}>
        {/* IZQUIERDA: LISTAS */}
        <div style={styles.listsCard}>
          {/* Mensaje resumen */}
          {mensaje && (
            <div style={styles.summaryBar}>
              <IconInfo />
              <span>{mensaje}</span>
            </div>
          )}

          {/* ÓRDENES DE VENTA */}
          <div style={styles.sectionHeaderRow}>
            <div style={styles.sectionTitle}>
              Órdenes de Venta ({ordenesPendientes.length})
            </div>
            <div style={styles.sectionCounter}>
              Mostrando {ordenesFiltradas.length} resultado(s)
            </div>
          </div>

          {/* Filtros tabla ÓRDENES */}
          <div style={styles.tableToolbar}>
            {/* BUSCADOR */}
            <div style={styles.inputGroup}>
              <input
                style={styles.inputSmall}
                placeholder="Buscar por cliente, ID, usuario o método de pago..."
                value={searchOrden}
                onChange={(e) => setSearchOrden(e.target.value)}
              />
              <div style={styles.inputIconRight}>
                <IconSearch />
              </div>
            </div>

            {/* FILTRO USUARIO */}
            <select
              style={styles.selectSmall}
              value={filterUsuarioOrden}
              onChange={(e) => setFilterUsuarioOrden(e.target.value)}
            >
              <option value="">Usuario creador</option>
              {usuariosOrdenes.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>

            {/* FILTRO CLIENTE */}
            <select
              style={styles.selectSmall}
              value={filterClienteOrden}
              onChange={(e) => setFilterClienteOrden(e.target.value)}
            >
              <option value="">Cliente</option>
              {clientesOrdenes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>

            {/* ORDENAMIENTO */}
            <div style={styles.selectWithIcon}>
              <div style={styles.selectIconLeft}>
                <IconSort />
              </div>
              <select
                style={styles.selectPadded}
                value={sortOrden}
                onChange={(e) => setSortOrden(e.target.value)}
              >
                <option value="recientes">Más recientes primero</option>
                <option value="antiguas">Más antiguas primero</option>
              </select>
            </div>
          </div>

          {/* Filtro por rango total */}
          <div style={styles.rangeToolbar}>
            <input
              style={styles.inputNumber}
              type="number"
              min="0"
              step="0.01"
              placeholder="Total mínimo ($)"
              value={minOrden}
              onChange={(e) => setMinOrden(e.target.value)}
            />
            <input
              style={styles.inputNumber}
              type="number"
              min="0"
              step="0.01"
              placeholder="Total máximo ($)"
              value={maxOrden}
              onChange={(e) => setMaxOrden(e.target.value)}
            />
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Cliente</th>
                  <th style={styles.th}>Usuario</th>
                  <th style={styles.th}>Fecha</th>
                  <th style={styles.th}>Total</th>
                  <th style={styles.th}>Estado</th>
                  <th style={{ ...styles.th, textAlign: "center" }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {ordenesFiltradas.length === 0 && (
                  <tr>
                    <td colSpan={7} style={styles.emptyState}>
                      No hay órdenes que coincidan con los filtros.
                    </td>
                  </tr>
                )}
                {ordenesFiltradas.map((o, idx) => {
                  const isSelected =
                    seleccion &&
                    seleccion.tipo === "orden" &&
                    seleccion.item.id_orden === o.id_orden;
                  const baseRow = idx % 2 === 1 ? styles.rowAlt : {};
                  const bg = isSelected
                    ? "#eff6ff"
                    : idx % 2 === 1
                    ? "#f8fafc"
                    : "#fff";
                  const rowStyle = {
                    ...styles.td,
                    ...baseRow,
                    background: bg,
                    borderLeft: isSelected ? "4px solid #2563eb" : "none",
                  };

                  return (
                    <tr
                      key={o.id_orden}
                      style={{ cursor: "pointer" }}
                      onClick={() => verOrden(o)}
                    >
                      <td
                        style={{
                          ...rowStyle,
                          fontWeight: "bold",
                          color: "#2563eb",
                        }}
                      >
                        #{o.id_orden}
                      </td>
                      <td style={rowStyle}>
                        {o.id_cliente_nombre || `Cli #${o.id_cliente}`}
                        {o.metodo_pago ? (
                          <span style={styles.cellSubtext}>
                            Método: {o.metodo_pago}
                          </span>
                        ) : null}
                      </td>
                      <td style={rowStyle}>{o.id_usuario_username || "—"}</td>
                      <td style={rowStyle}>{formatDate(o.fecha_orden)}</td>
                      <td style={rowStyle}>
                        $ {formatMoney(o.precio_final || 0)}
                      </td>
                      <td style={rowStyle}>
                        <span style={pillEstadoEnvio(o.estado_de_envio)}>
                          {String(o.estado_de_envio || "").replace(/_/g, " ")}
                        </span>
                      </td>
                      <td style={{ ...rowStyle, textAlign: "center" }}>
                        <button style={styles.btnSmall} type="button">
                          Ver
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ÓRDENES DE COMPRA */}
          <div style={{ ...styles.sectionHeaderRow, marginTop: "30px" }}>
            <div style={styles.sectionTitleGreen}>
              Órdenes de Compra ({comprasPendientes.length})
            </div>
            <div style={styles.sectionCounter}>
              Mostrando {comprasFiltradas.length} resultado(s)
            </div>
          </div>

          {/* Filtros tabla COMPRAS */}
          <div style={styles.tableToolbar}>
            {/* BUSCADOR */}
            <div style={styles.inputGroup}>
              <input
                style={styles.inputSmall}
                placeholder="Buscar por proveedor, ID, usuario o método de pago..."
                value={searchCompra}
                onChange={(e) => setSearchCompra(e.target.value)}
              />
              <div style={styles.inputIconRight}>
                <IconSearch />
              </div>
            </div>

            {/* FILTRO USUARIO */}
            <select
              style={styles.selectSmall}
              value={filterUsuarioCompra}
              onChange={(e) => setFilterUsuarioCompra(e.target.value)}
            >
              <option value="">Usuario creador</option>
              {usuariosCompras.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>

            {/* FILTRO PROVEEDOR */}
            <select
              style={styles.selectSmall}
              value={filterProveedorCompra}
              onChange={(e) => setFilterProveedorCompra(e.target.value)}
            >
              <option value="">Proveedor</option>
              {proveedoresCompras.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>

            {/* ORDENAMIENTO */}
            <div style={styles.selectWithIcon}>
              <div style={styles.selectIconLeft}>
                <IconSort />
              </div>
              <select
                style={styles.selectPadded}
                value={sortCompra}
                onChange={(e) => setSortCompra(e.target.value)}
              >
                <option value="recientes">Más recientes primero</option>
                <option value="antiguas">Más antiguas primero</option>
              </select>
            </div>
          </div>

          {/* Filtro por rango total */}
          <div style={styles.rangeToolbar}>
            <input
              style={styles.inputNumber}
              type="number"
              min="0"
              step="0.01"
              placeholder="Total mínimo ($)"
              value={minCompra}
              onChange={(e) => setMinCompra(e.target.value)}
            />
            <input
              style={styles.inputNumber}
              type="number"
              min="0"
              step="0.01"
              placeholder="Total máximo ($)"
              value={maxCompra}
              onChange={(e) => setMaxCompra(e.target.value)}
            />
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Proveedor</th>
                  <th style={styles.th}>Usuario</th>
                  <th style={styles.th}>Fecha</th>
                  <th style={styles.th}>Total</th>
                  <th style={styles.th}>Estado</th>
                  <th style={{ ...styles.th, textAlign: "center" }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {comprasFiltradas.length === 0 && (
                  <tr>
                    <td colSpan={7} style={styles.emptyState}>
                      No hay compras que coincidan con los filtros.
                    </td>
                  </tr>
                )}
                {comprasFiltradas.map((c, idx) => {
                  const isSelected =
                    seleccion &&
                    seleccion.tipo === "compra" &&
                    seleccion.item.id_compra === c.id_compra;
                  const baseRow = idx % 2 === 1 ? styles.rowAlt : {};
                  const bg = isSelected
                    ? "#eff6ff"
                    : idx % 2 === 1
                    ? "#f8fafc"
                    : "#fff";
                  const rowStyle = {
                    ...styles.td,
                    ...baseRow,
                    background: bg,
                    borderLeft: isSelected ? "4px solid #16a34a" : "none",
                  };

                  // Nota / comentario (si existe en el backend)
                  const nota =
                    c.nota ??
                    c.notas ??
                    c.comentario ??
                    c.comentarios ??
                    c.observacion ??
                    c.observaciones;

                  return (
                    <tr
                      key={c.id_compra}
                      style={{ cursor: "pointer" }}
                      onClick={() => verCompra(c)}
                    >
                      <td
                        style={{
                          ...rowStyle,
                          fontWeight: "bold",
                          color: "#16a34a",
                        }}
                      >
                        #{c.id_compra}
                      </td>
                      <td style={rowStyle}>
                        {c.id_proveedor_nombre || `Prov #${c.id_proveedor}`}
                        {c.metodo_pago ? (
                          <span style={styles.cellSubtext}>
                            Método: {c.metodo_pago}
                          </span>
                        ) : null}
                        {nota ? (
                          <span style={styles.cellSubtext}>
                            Nota: {String(nota).slice(0, 60)}
                            {String(nota).length > 60 ? "…" : ""}
                          </span>
                        ) : null}
                      </td>
                      <td style={rowStyle}>{c.id_usuario_username || "—"}</td>
                      <td style={rowStyle}>{formatDate(c.fecha_pedido)}</td>
                      <td style={rowStyle}>
                        $ {formatMoney(c.precio_final || 0)}
                      </td>
                      <td style={rowStyle}>
                        <span style={pillEstadoEnvio(c.estado_de_envio)}>
                          {String(c.estado_de_envio || "").replace(/_/g, " ")}
                        </span>
                      </td>
                      <td style={{ ...rowStyle, textAlign: "center" }}>
                        <button style={styles.btnSmall} type="button">
                          Ver
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* DERECHA: DETALLE */}
        <div style={styles.detailWrapper}>
          {!seleccion ? (
            <div style={styles.emptyDetail}>
              Selecciona un ítem de la lista para ver sus detalles y gestionar su
              aprobación.
            </div>
          ) : (
            <div style={styles.detailCard}>
              <div style={styles.detailHeader}>
                <h3 style={styles.detailTitle}>
                  {seleccion.tipo === "orden"
                    ? "📦 Orden de Venta"
                    : "🛒 Orden de Compra"}
                </h3>
                <div style={styles.detailSubtitle}>
                  ID: #{seleccion.item.id_orden || seleccion.item.id_compra}
                </div>
              </div>

              {seleccion.error ? (
                <div style={styles.statusTextError}>{seleccion.error}</div>
              ) : null}

              {/* INFO GENERAL */}
              <div style={styles.detailLine}>
                <span style={styles.detailLabel}>Solicitante:</span>
                <span style={styles.detailValue}>
                  {seleccion.item.id_usuario_username || "Sistema"}
                </span>
              </div>
              <div style={styles.detailLine}>
                <span style={styles.detailLabel}>
                  {seleccion.tipo === "orden" ? "Cliente:" : "Proveedor:"}
                </span>
                <span
                  style={styles.detailValueLink}
                  onClick={() => openInfoEntidad(seleccion)}
                  role="button"
                  title="Ver información"
                >
                  {getEntidad(seleccion)}
                </span>
              </div>
              <div style={styles.detailHintClick}>
                Tip: haz click en el {seleccion.tipo === "orden" ? "cliente" : "proveedor"} para ver su información.
              </div>
              <div style={styles.detailLine}>
                <span style={styles.detailLabel}>Fecha:</span>
                <span style={styles.detailValue}>{getFechaSel(seleccion)}</span>
              </div>
              <div style={styles.detailLine}>
                <span style={styles.detailLabel}>Método Pago:</span>
                <span style={styles.detailValue}>
                  {seleccion.item.metodo_pago || "—"}
                </span>
              </div>
              <div style={styles.detailLine}>
                <span style={styles.detailLabel}>Estado:</span>
                <span style={pillEstadoEnvio(seleccion.item.estado_de_envio)}>
                  {String(seleccion.item.estado_de_envio || "").replace(
                    /_/g,
                    " "
                  )}
                </span>
              </div>

              {/* ITEMS */}
              <div
                style={{
                  marginTop: "20px",
                  fontWeight: "700",
                  color: "#1e40af",
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                }}
              >
                Items
              </div>

              {seleccion.loading ? (
                <div style={{ padding: 20, textAlign: "center", color: "#64748b" }}>
                  Cargando items...
                </div>
              ) : (
                <table style={styles.detailTable}>
                  <thead>
                    <tr>
                      <th style={styles.detailTh}>Producto</th>
                      <th style={styles.detailTh}>Cant.</th>
                      <th style={{ ...styles.detailTh, textAlign: "right" }}>
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {seleccion.detalles.map((d, i) => (
                      <tr key={i}>
                        <td style={styles.detailTd}>
                          {d.id_producto_nombre || d.id_producto?.nombre || "Item"}
                        </td>
                        <td style={styles.detailTd}>{d.cantidad}</td>
                        <td
                          style={{
                            ...styles.detailTd,
                            textAlign: "right",
                            fontWeight: "bold",
                          }}
                        >
                          {formatMoney(d.subtotal)}
                        </td>
                      </tr>
                    ))}
                    {seleccion.detalles.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          style={{
                            ...styles.detailTd,
                            color: "#94a3b8",
                            fontStyle: "italic",
                          }}
                        >
                          No hay items para mostrar.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              )}

              <div
                style={{
                  textAlign: "right",
                  fontSize: "1.2rem",
                  fontWeight: "800",
                  color: "#0d47a1",
                  marginBottom: "20px",
                }}
              >
                Total: {currencySymbol} {formatMoney(totalDetallesSeleccion())}
              </div>

              {/* ACCIONES */}
              <div style={styles.actionsGrid}>
                <button
                  style={{
                    ...styles.btnApprove,
                    ...(actionBusy ? styles.btnDisabled : {}),
                  }}
                  onClick={() => openConfirm("approve")}
                  disabled={seleccion.loading || actionBusy}
                  type="button"
                >
                  {actionBusy && actionType === "approve" ? (
                    <span style={styles.spinner} />
                  ) : (
                    <IconCheck />
                  )}
                  {actionBusy && actionType === "approve"
                    ? "Aprobando..."
                    : "Aprobar"}
                </button>

                <button
                  style={{
                    ...styles.btnReject,
                    ...(actionBusy ? styles.btnDisabled : {}),
                  }}
                  onClick={() => openConfirm("reject")}
                  disabled={seleccion.loading || actionBusy}
                  type="button"
                >
                  {actionBusy && actionType === "reject" ? (
                    <span
                      style={{
                        ...styles.spinner,
                        borderColor: "rgba(239,68,68,0.35)",
                        borderTopColor: "rgba(239,68,68,1)",
                      }}
                    />
                  ) : (
                    <IconX />
                  )}
                  {actionBusy && actionType === "reject"
                    ? "Rechazando..."
                    : "Rechazar"}
                </button>

                <button
                  style={styles.btnClear}
                  onClick={() => (actionBusy ? null : setSeleccion(null))}
                  type="button"
                >
                  Cancelar selección
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL CONFIRMACIÓN */}
      <ConfirmModal
        open={confirm.open}
        title={`${actionLabel} ${seleccion?.tipo === "orden" ? "Orden" : "Compra"}`}
        confirmText={actionLabel}
        confirmStyle={isReject ? styles.modalBtnReject : styles.modalBtnApprove}
        onClose={closeConfirm}
        onConfirm={() => ejecutarAccion(confirm.action)}
        busy={actionBusy}
      >
        {seleccion ? (
          <div>
            <div style={{ marginBottom: "10px" }}>
              ¿Confirmar <b>{actionLabel.toUpperCase()}</b> de la{" "}
              {seleccion.tipo === "orden" ? "orden" : "compra"}{" "}
              <b>#{seleccion.item.id_orden || seleccion.item.id_compra}</b>?
            </div>

            <div
              style={{
                padding: "12px",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                display: "grid",
                gap: "6px",
              }}
            >
              <div>
                <b>{seleccion.tipo === "orden" ? "Cliente" : "Proveedor"}:</b> {getEntidad(seleccion)}
              </div>
              <div>
                <b>Solicitante:</b>{" "}
                {seleccion.item.id_usuario_username || "Sistema"}
              </div>
              <div>
                <b>Fecha:</b> {getFechaSel(seleccion)}
              </div>
              <div>
                <b>Total:</b> {currencySymbol}{" "}
                {formatMoney(totalDetallesSeleccion())}
              </div>
              {seleccion.item.metodo_pago ? (
                <div>
                  <b>Método de pago:</b> {seleccion.item.metodo_pago}
                </div>
              ) : null}
            </div>

            {isReject ? (
              <div style={{ marginTop: "12px", color: "#991b1b", fontWeight: 700 }}>
                Esta acción marcará la solicitud como rechazada.
              </div>
            ) : (
              <div style={{ marginTop: "12px", color: "#166534", fontWeight: 700 }}>
                Esta acción marcará la solicitud como aprobada.
              </div>
            )}
          </div>
        ) : null}
      </ConfirmModal>
    {/* MODAL INFO CLIENTE / PROVEEDOR */}
    {infoEntidad.open ? (
      <div style={styles.modalOverlay} onMouseDown={closeInfoEntidad}>
        <div style={styles.modalCard} onMouseDown={(e) => e.stopPropagation()}>
          <div style={{ ...styles.modalHeader, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            <h4 style={styles.modalTitle}>
              {infoEntidad.tipo === "cliente" ? "Información del cliente" : "Información del proveedor"}
            </h4>
            <button type="button" style={styles.modalCloseIconBtn} onClick={closeInfoEntidad} aria-label="Cerrar">
              <IconX />
            </button>
          </div>
          <div style={styles.modalBody}>
            {infoEntidad.loading ? (
              <div style={{ color: "#64748b" }}>Cargando información...</div>
            ) : infoEntidad.error ? (
              <div style={{ color: "#991b1b", fontWeight: 700 }}>{infoEntidad.error}</div>
            ) : infoEntidad.data ? (
              <div style={{ display: "grid", gap: "8px" }}>
                {infoEntidad.tipo === "cliente" ? (
                  <>
                    <div><b>Nombre:</b> {infoEntidad.data.nombre || "—"}</div>
                    <div><b>Teléfono:</b> {infoEntidad.data.telefono || "—"}</div>
                    <div><b>Correo:</b> {infoEntidad.data.correo || "—"}</div>
                    <div><b>Dirección:</b> {infoEntidad.data.direccion || "—"}</div>
                    {typeof infoEntidad.data.activo === "boolean" ? (
                      <div><b>Activo:</b> {infoEntidad.data.activo ? "Sí" : "No"}</div>
                    ) : null}
                  </>
                ) : (
                  <>
                    <div><b>Nombre:</b> {infoEntidad.data.nombre || infoEntidad.data.razon_social || "—"}</div>
                    <div><b>RIF:</b> {infoEntidad.data.rif || infoEntidad.data.identificacion || "—"}</div>
                    <div><b>Teléfono:</b> {infoEntidad.data.telefono || "—"}</div>
                    <div><b>Correo:</b> {infoEntidad.data.correo || "—"}</div>
                    <div><b>Dirección:</b> {infoEntidad.data.direccion || "—"}</div>
                    {infoEntidad.data.contacto ? (
                      <div><b>Contacto:</b> {String(infoEntidad.data.contacto)}</div>
                    ) : null}
                  </>
                )}
              </div>
            ) : (
              <div style={{ color: "#64748b" }}>No hay información para mostrar.</div>
            )}
          </div>
          <div style={styles.modalFooter}>
            <button type="button" style={styles.modalBtn} onClick={closeInfoEntidad}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    ) : null}
  </div>
  );
}