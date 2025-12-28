// frontend/src/pages/TransporteEnvios.jsx

import React, { useEffect, useState } from "react";
import api from "../api/api";

const ESTADO_CREACION_ENVIO = "PENDIENTE POR ASIGNACION";

// --- ICONOS SVG ---
const IconTruck = () => (
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
    <rect x="1" y="3" width="15" height="13" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const IconSearch = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconRefresh = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const IconPlus = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconTrash = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6l-1 14H6L5 6" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

// --- ESTILOS ---
const styles = {
  // Layout Principal
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
    marginBottom: "20px",
    paddingLeft: "10px",
  },
  titleGroup: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
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

  // Mensajes de estado
  statusOk: {
    marginBottom: "10px",
    padding: "10px 14px",
    borderRadius: "10px",
    background: "#dcfce7",
    color: "#166534",
    fontSize: "0.85rem",
    fontWeight: "600",
    border: "1px solid #bbf7d0",
  },
  statusError: {
    marginBottom: "10px",
    padding: "10px 14px",
    borderRadius: "10px",
    background: "#fee2e2",
    color: "#b91c1c",
    fontSize: "0.85rem",
    fontWeight: "600",
    border: "1px solid #fecaca",
  },

  // Tarjeta principal
  card: {
    background: "#ffffff",
    borderRadius: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
    padding: "24px 30px 30px",
    border: "1px solid #f0f0f0",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  // Layout columnas
  colLayout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr)",
    gap: "24px",
    alignItems: "flex-start",
  },

  // Tarjetas de sección
  sectionCard: {
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    padding: "18px 18px 20px",
    background: "#f8fafc",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    minHeight: 0,
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "10px",
  },
  sectionTitle: {
    fontSize: "1.1rem",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 4px 0",
  },
  smallText: {
    fontSize: "0.85rem",
    color: "#64748b",
    lineHeight: "1.4",
  },

  // Botones
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
    display: "flex",
    alignItems: "center",
    gap: "6px",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.2)",
    transition: "transform 0.1s",
    whiteSpace: "nowrap",
  },
  buttonGhost: {
    borderRadius: "10px",
    padding: "0 12px",
    height: "32px",
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    color: "#64748b",
    cursor: "pointer",
    fontSize: "0.8rem",
    fontWeight: "600",
    transition: "background 0.2s",
    whiteSpace: "nowrap",
  },
  buttonDanger: {
    borderRadius: "10px",
    padding: "0 12px",
    height: "32px",
    background: "#fee2e2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    cursor: "pointer",
    fontSize: "0.8rem",
    fontWeight: "600",
    whiteSpace: "nowrap",
  },

  // Buscador
  searchRow: {
    display: "flex",
    gap: "10px",
    marginBottom: "10px",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    height: "36px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    padding: "0 12px",
    fontSize: "0.9rem",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    backgroundColor: "#fff",
  },

  // Tabla
  tableWrapper: {
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
    background: "#ffffff",
    boxShadow: "0 2px 5px rgba(0,0,0,0.02)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.85rem",
  },
  th: {
    background: "#f1f5f9",
    textAlign: "left",
    padding: "8px 10px",
    borderBottom: "1px solid #e2e8f0",
    color: "#475569",
    fontWeight: "700",
    whiteSpace: "nowrap",
    textTransform: "uppercase",
    fontSize: "0.75rem",
  },
  td: {
    padding: "8px 10px",
    borderBottom: "1px solid #f1f5f9",
    color: "#334155",
    verticalAlign: "middle",
  },
  rowAlt: {
    background: "#f8fafc",
  },

  // Badges
  badgeEstadoUnidad: (estado) => {
    const norm = (estado || "").toUpperCase();
    const activo = norm === "ACTIVA" || norm === "DISPONIBLE";
    return {
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: "20px",
      fontSize: "0.7rem",
      fontWeight: "700",
      background: activo ? "#dcfce7" : "#fee2e2",
      color: activo ? "#166534" : "#991b1b",
      border: `1px solid ${activo ? "#bbf7d0" : "#fecaca"}`,
    };
  },
  badgeEstadoEnvio: (estado) => {
    const norm = (estado || "").toUpperCase();
    let bg = "#f1f5f9",
      color = "#475569",
      border = "#e2e8f0";

    if (norm.includes("LISTO") || norm.includes("APROB")) {
      bg = "#dcfce7";
      color = "#166534";
      border = "#bbf7d0";
    } else if (
      norm.includes("RUTA") ||
      norm.includes("TRANSITO") ||
      norm.includes("PENDIENTE")
    ) {
      bg = "#ffedd5";
      color = "#9a3412";
      border = "#fed7aa";
    } else if (norm.includes("CANCEL")) {
      bg = "#fee2e2";
      color = "#991b1b";
      border = "#fecaca";
    }

    return {
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: "20px",
      fontSize: "0.7rem",
      fontWeight: "700",
      background: bg,
      color: color,
      border: `1px solid ${border}`,
    };
  },
  pillSmall: {
    fontSize: "0.75rem",
    padding: "2px 8px",
    borderRadius: "6px",
    background: "#e0f2fe",
    color: "#0369a1",
    fontWeight: "600",
  },

  // Modal
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(4px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 4000,
  },
  modal: {
    width: "100%",
    maxWidth: "520px",
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    padding: "30px",
    boxSizing: "border-box",
    animation: "scaleUp 0.2s ease-out",
  },
  modalTitle: {
    fontSize: "1.3rem",
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "5px",
  },
  modalSubtitle: {
    fontSize: "0.9rem",
    color: "#64748b",
    marginBottom: "20px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "15px",
    marginTop: "10px",
  },
  label: {
    fontSize: "0.8rem",
    fontWeight: "700",
    color: "#475569",
    marginBottom: "5px",
    textTransform: "uppercase",
  },
  input: {
    height: "40px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    padding: "0 12px",
    fontSize: "0.9rem",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  select: {
    height: "40px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    padding: "0 12px",
    fontSize: "0.9rem",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    backgroundColor: "#fff",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "25px",
    borderTop: "1px solid #f1f5f9",
    paddingTop: "20px",
  },
  errorText: {
    marginTop: "10px",
    fontSize: "0.85rem",
    color: "#b91c1c",
    fontWeight: "600",
    padding: "8px",
    background: "#fee2e2",
    borderRadius: "6px",
  },
  okText: {
    marginTop: "10px",
    fontSize: "0.85rem",
    color: "#166534",
    fontWeight: "600",
    padding: "8px",
    background: "#dcfce7",
    borderRadius: "6px",
  },
  chipOrd: {
    display: "inline-block",
    fontSize: "0.75rem",
    padding: "2px 8px",
    borderRadius: "12px",
    background: "#f1f5f9",
    color: "#334155",
    border: "1px solid #e2e8f0",
    marginRight: "4px",
    marginBottom: "4px",
  },

  resumenResultados: {
    fontSize: "0.78rem",
    color: "#64748b",
    marginTop: "8px",
  },
  detalleCard: {
    marginTop: "12px",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    fontSize: "0.85rem",
  },
  detalleTitle: {
    fontSize: "0.95rem",
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "6px",
  },
  detalleLine: {
    marginBottom: "4px",
    color: "#475569",
  },
  detalleLabel: {
    fontWeight: "600",
  },
};

// Inyectar animación keyframes
const styleSheet = document.createElement("style");
styleSheet.innerText =
  "@keyframes scaleUp { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }";
document.head.appendChild(styleSheet);

export default function TransporteEnvios() {
  // ESTADO GENERAL
  const [unidades, setUnidades] = useState([]);
  const [envios, setEnvios] = useState([]);
  const [transportistas, setTransportistas] = useState([]);

  const [loadingUnidades, setLoadingUnidades] = useState(false);
  const [loadingEnvios, setLoadingEnvios] = useState(false);
  const [loadingTransportistas, setLoadingTransportistas] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [searchUnidad, setSearchUnidad] = useState("");
  const [searchEnvio, setSearchEnvio] = useState("");
  const [filtroEstadoUnidad, setFiltroEstadoUnidad] = useState("TODOS");
  const [filtroEstadoEnvio, setFiltroEstadoEnvio] = useState("TODOS");

  const [unidadSeleccionada, setUnidadSeleccionada] = useState(null);
  const [envioSeleccionado, setEnvioSeleccionado] = useState(null);

  // Modales unidad
  const [showUnidadModal, setShowUnidadModal] = useState(false);
  const [unidadMode, setUnidadMode] = useState("crear"); // "crear" | "editar"
  const [unidadForm, setUnidadForm] = useState({
    codigo_unidad: "",
    id_usuario: "",
    capacidad_carga: "",
    placa: "",
    estado: "ACTIVA",
  });
  const [unidadFormError, setUnidadFormError] = useState("");
  const [unidadFormLoading, setUnidadFormLoading] = useState(false);

  // Modal nuevo transportista
  const [showTransportistaModal, setShowTransportistaModal] = useState(false);
  const [transportistaForm, setTransportistaForm] = useState({
    username: "",
    first_name: "",
    last_name: "",
    telefono: "",
    password: "",
  });
  const [transportistaFormError, setTransportistaFormError] = useState("");
  const [transportistaFormLoading, setTransportistaFormLoading] =
    useState(false);

  // Modales envío
  const [showEnvioModal, setShowEnvioModal] = useState(false);
  const [envioMode, setEnvioMode] = useState("crear"); // "crear" | "editar"
  const [envioForm, setEnvioForm] = useState({
    codigo_envio: "",
    id_unidad: "",
    fecha_salida: "",
  });
  const [envioFormError, setEnvioFormError] = useState("");
  const [envioFormLoading, setEnvioFormLoading] = useState(false);

  // Modal asignar órdenes
  const [showAsignarModal, setShowAsignarModal] = useState(false);
  const [ordenesDisponibles, setOrdenesDisponibles] = useState([]);
  const [ordenesSeleccionadas, setOrdenesSeleccionadas] = useState([]);
  const [asignarError, setAsignarError] = useState("");
  const [asignarLoading, setAsignarLoading] = useState(false);
  const [searchOrden, setSearchOrden] = useState("");

  // CARGA DE DATOS
  const cargarUnidades = async () => {
    setLoadingUnidades(true);
    try {
      const res = await api.get("/base/unidades/");
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setUnidades(data);
    } catch (err) {
      console.error("Error cargando unidades:", err);
      const msg = err.response?.data?.detail || err.response?.data?.error;
      setError(
        msg || "No se pudieron cargar las unidades. Verifique permisos o servidor."
      );
    } finally {
      setLoadingUnidades(false);
    }
  };

  const cargarEnvios = async () => {
    setLoadingEnvios(true);
    try {
      const res = await api.get("/base/envios/");
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setEnvios(data);
    } catch (err) {
      console.error("Error cargando envíos:", err);
      const msg = err.response?.data?.detail || err.response?.data?.error;
      setError(
        msg || "No se pudieron cargar los envíos. Verifique permisos o servidor."
      );
    } finally {
      setLoadingEnvios(false);
    }
  };

  const cargarTransportistas = async () => {
    setLoadingTransportistas(true);
    try {
      const res = await api.get("/base/usuarios/");
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      const soloTransportistas = data.filter(
        (u) => (u.tipo || "").toUpperCase() === "TRANSPORTISTA"
      );
      setTransportistas(soloTransportistas);
    } catch (err) {
      console.error("Error cargando transportistas:", err);
    } finally {
      setLoadingTransportistas(false);
    }
  };

  useEffect(() => {
    setMensaje("");
    setError("");
    cargarUnidades();
    cargarEnvios();
    cargarTransportistas();
  }, []);

  // HELPERS
  const formatFechaCorta = (iso) => {
    if (!iso) return "-";
    if (typeof iso !== "string") return String(iso);
    return iso.slice(0, 10);
  };

  const getUnidadLabel = (unidadId) => {
    const u = unidades.find((x) => String(x.id_unidad) === String(unidadId));
    if (!u) return "Sin unidad";
    const placa = u.placa ? ` · ${u.placa}` : "";
    return `${u.codigo_unidad}${placa}`;
  };

  const getTransportistaLabel = (userId) => {
    if (!userId) return "-";
    const match = transportistas.find(
      (t) => String(t.id_usuario ?? t.id) === String(userId)
    );
    if (!match) return "-";
    const nombre = `${match.first_name || ""} ${match.last_name || ""}`.trim();
    return nombre || match.username || "-";
  };

  const getTransportistaTelefono = (userId) => {
    if (!userId) return "";
    const match = transportistas.find(
      (t) => String(t.id_usuario ?? t.id) === String(userId)
    );
    return match?.telefono || "";
  };

  const getOrdenesResumen = (envio) => {
    if (!envio) return [];
    if (Array.isArray(envio.ordenes_resumen)) return envio.ordenes_resumen;
    if (Array.isArray(envio.ordenes)) return envio.ordenes;
    if (Array.isArray(envio.ordenes_ids)) return envio.ordenes_ids;
    if (Array.isArray(envio.ordenes_detalle)) return envio.ordenes_detalle;
    return [];
  };

  // Helper: ¿El estado de envío está considerado activo?
  const envioEstaActivo = (estado) => {
    const s = (estado || "").toUpperCase().trim();
    // Estados que NO bloquean la unidad (históricos / cerrados)
    const estadosFinalizados = ["TERMINADO", "CERRADO", "ENTREGADO", "CANCELADO"];
    // Retorna true solo si el envío sigue activo
    return !estadosFinalizados.includes(s);
  };

  // ¿Unidad tiene envío activo?
  const unidadTieneEnvioActivo = (unidadId, ignoreEnvioId = null) => {
    return envios.some((e) => {
      if (String(e.id_unidad) !== String(unidadId)) return false;
      if (ignoreEnvioId && e.id_envio === ignoreEnvioId) return false;
      // Activo solo si el estado NO está en la lista de finalizados
      return envioEstaActivo(e.estado);
    });
  };

  // Para desactivar: ¿tiene envíos activos?
  const unidadTieneEnvioAsignadoActivo = (unidadId) => {
    return envios.some((e) => {
      if (String(e.id_unidad) !== String(unidadId)) return false;
      // Activo solo si el estado del envío no está finalizado/cerrado
      return envioEstaActivo(e.estado);
    });
  };

  // ¿Transportista ya está ocupado en otra unidad?
  const transportistaOcupadoEnOtraUnidad = (userId, currentUnidadId = null) => {
    if (!userId) return false;
    return unidades.some((u) => {
      if (String(u.id_usuario) !== String(userId)) return false;
      if (currentUnidadId && u.id_unidad === currentUnidadId) return false;
      return true;
    });
  };

  // Listas filtradas
  const unidadesFiltradas = unidades.filter((u) => {
    const t = (searchUnidad || "").toLowerCase();
    const matchTexto =
      !t ||
      (u.codigo_unidad || "").toLowerCase().includes(t) ||
      (u.placa || "").toLowerCase().includes(t);

    const matchEstado =
      filtroEstadoUnidad === "TODOS" ||
      (u.estado || "").toUpperCase() === filtroEstadoUnidad;

    return matchTexto && matchEstado;
  });

  const enviosFiltrados = envios.filter((e) => {
    const t = (searchEnvio || "").toLowerCase();
    const matchTexto =
      !t ||
      (e.codigo_envio || "").toLowerCase().includes(t) ||
      (e.estado || "").toLowerCase().includes(t);

    const estadoUpper = (e.estado || "").toUpperCase();
    const matchEstado =
      filtroEstadoEnvio === "TODOS" || estadoUpper === filtroEstadoEnvio;

    return matchTexto && matchEstado;
  });

  const estadosEnvioDisponibles = Array.from(
    new Set(envios.map((e) => e.estado).filter(Boolean))
  );

  // GESTIÓN UNIDADES
  const abrirCrearUnidad = () => {
    setUnidadMode("crear");
    setUnidadForm({
      codigo_unidad: "",
      id_usuario: "",
      capacidad_carga: "",
      placa: "",
      estado: "ACTIVA",
    });
    setUnidadFormError("");
    setUnidadSeleccionada(null);
    setShowUnidadModal(true);
  };

  const abrirEditarUnidad = (unidad) => {
    setUnidadMode("editar");
    setUnidadSeleccionada(unidad);
    setUnidadForm({
      codigo_unidad: unidad.codigo_unidad || "",
      id_usuario: unidad.id_usuario || "",
      capacidad_carga: unidad.capacidad_carga || "",
      placa: unidad.placa || "",
      estado: unidad.estado || "ACTIVA",
    });
    setUnidadFormError("");
    setShowUnidadModal(true);
  };

  const handleUnidadChange = (campo, valor) => {
    setUnidadForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const guardarUnidad = async (e) => {
    e.preventDefault();
    setUnidadFormError("");
    setUnidadFormLoading(true);
    setMensaje("");

    try {
      if (!unidadForm.codigo_unidad) {
        setUnidadFormError("El código de unidad es obligatorio.");
        return;
      }
      if (!unidadForm.id_usuario) {
        setUnidadFormError("Debes seleccionar un transportista.");
        return;
      }

      // Validar que el transportista no esté ya asignado a otra unidad
      const yaAsignado = transportistaOcupadoEnOtraUnidad(
        unidadForm.id_usuario,
        unidadMode === "editar" && unidadSeleccionada
          ? unidadSeleccionada.id_unidad
          : null
      );
      if (yaAsignado) {
        setUnidadFormError(
          "Este transportista ya está asignado a otra unidad. Selecciona un chofer diferente."
        );
        return;
      }

      // El teléfono de la unidad será siempre el teléfono del transportista
      const telefonoAsociado = getTransportistaTelefono(unidadForm.id_usuario);

      const payload = {
        codigo_unidad: unidadForm.codigo_unidad,
        id_usuario: unidadForm.id_usuario,
        telefono: telefonoAsociado,
        placa: unidadForm.placa,
        estado: unidadForm.estado,
        capacidad_carga:
          unidadForm.capacidad_carga === "" ||
          unidadForm.capacidad_carga === null
            ? 0
            : Number(unidadForm.capacidad_carga),
      };

      if (unidadMode === "crear") {
        await api.post("/base/unidades/", payload);
        setMensaje("Unidad creada correctamente.");
      } else if (unidadMode === "editar" && unidadSeleccionada) {
        await api.patch(`/base/unidades/${unidadSeleccionada.id_unidad}/`, payload);
        setMensaje("Unidad actualizada correctamente.");
      }

      setShowUnidadModal(false);
      setUnidadSeleccionada(null);
      await cargarUnidades();
    } catch (err) {
      console.error("Error guardando unidad:", err);
      const msg = err.response?.data?.detail || err.response?.data?.error;
      setUnidadFormError(
        msg || "No se pudo guardar la unidad. Verifica los datos o permisos."
      );
    } finally {
      setUnidadFormLoading(false);
    }
  };

  const desactivarUnidad = async (unidad) => {
    if (!unidad) return;
    const confirmar = window.confirm(
      `¿Desactivar la unidad "${unidad.codigo_unidad}"?`
    );
    if (!confirmar) return;

    if (unidadTieneEnvioAsignadoActivo(unidad.id_unidad)) {
      alert(
        "No puedes desactivar esta unidad porque tiene envíos asignados activos."
      );
      return;
    }

    try {
      await api.patch(`/base/unidades/${unidad.id_unidad}/`, {
        estado: "INACTIVA",
      });
      setMensaje(`Unidad ${unidad.codigo_unidad} desactivada.`);
      await cargarUnidades();
    } catch (err) {
      console.error("Error desactivando unidad:", err);
      const msg = err.response?.data?.detail || err.response?.data?.error;
      alert(
        msg ||
          "No se pudo desactivar la unidad. Es posible que tenga envíos asociados."
      );
    }
  };

  const activarUnidad = async (unidad) => {
    if (!unidad) return;

    try {
      await api.patch(`/base/unidades/${unidad.id_unidad}/`, {
        estado: "ACTIVA",
      });
      setMensaje(`Unidad ${unidad.codigo_unidad} activada.`);
      await cargarUnidades();
    } catch (err) {
      console.error("Error activando unidad:", err);
      const msg = err.response?.data?.detail || err.response?.data?.error;
      alert(msg || "No se pudo activar la unidad.");
    }
  };

  const eliminarUnidad = async (unidad) => {
    if (!unidad) return;
    const confirmar = window.confirm(
      `¿Eliminar la unidad "${unidad.codigo_unidad}"?`
    );
    if (!confirmar) return;

    try {
      await api.delete(`/base/unidades/${unidad.id_unidad}/`);
      setMensaje(`Unidad ${unidad.codigo_unidad} eliminada.`);
      await cargarUnidades();
      setUnidadSeleccionada(null);
    } catch (err) {
      console.error("Error eliminando unidad:", err);
      const msg = err.response?.data?.detail || err.response?.data?.error;
      alert(
        msg ||
          "No se pudo eliminar la unidad. Es posible que tenga envíos asociados."
      );
    }
  };

  // NUEVO TRANSPORTISTA
  const abrirNuevoTransportista = () => {
    setTransportistaForm({
      username: "",
      first_name: "",
      last_name: "",
      telefono: "",
      password: "",
    });
    setTransportistaFormError("");
    setShowTransportistaModal(true);
  };

  const handleTransportistaChange = (campo, valor) => {
    setTransportistaForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const guardarTransportista = async (e) => {
    e.preventDefault();
    setTransportistaFormError("");
    setTransportistaFormLoading(true);

    try {
      if (!transportistaForm.username) {
        setTransportistaFormError("El usuario es obligatorio.");
        return;
      }

      const payload = {
        username: transportistaForm.username,
        first_name: transportistaForm.first_name,
        last_name: transportistaForm.last_name,
        telefono: transportistaForm.telefono,
        password: transportistaForm.password || "123456",
        tipo: "TRANSPORTISTA",
      };

      const res = await api.post("/base/usuarios/", payload);
      const nuevo = res.data;

      await cargarTransportistas();

      const idNuevo = nuevo.id_usuario ?? nuevo.id;
      if (idNuevo) {
        setUnidadForm((prev) => ({ ...prev, id_usuario: idNuevo }));
      }

      setShowTransportistaModal(false);
    } catch (err) {
      console.error("Error creando transportista:", err);
      const msg = err.response?.data?.detail || err.response?.data?.error;
      setTransportistaFormError(
        msg || "No se pudo crear el transportista. Revisa datos o permisos."
      );
    } finally {
      setTransportistaFormLoading(false);
    }
  };

  // GESTIÓN ENVÍOS
  const abrirCrearEnvio = () => {
    setEnvioMode("crear");
    setEnvioSeleccionado(null);
    setEnvioForm({
      codigo_envio: "Se generará automáticamente",
      id_unidad: "",
      fecha_salida: "",
    });
    setEnvioFormError("");
    setShowEnvioModal(true);
  };

  const abrirEditarEnvio = (envio) => {
    const estadoUpper = (envio.estado || "").toUpperCase();
    if (estadoUpper.includes("LISTO_PARA_SALIR")) {
      alert(
        "Este envío ya fue marcado como LISTO PARA SALIR y no puede ser editado."
      );
      return;
    }

    setEnvioMode("editar");
    setEnvioSeleccionado(envio);
    setEnvioForm({
      codigo_envio: envio.codigo_envio || "",
      id_unidad: envio.id_unidad || "",
      fecha_salida: envio.fecha_salida ? envio.fecha_salida.slice(0, 10) : "",
    });
    setEnvioFormError("");
    setShowEnvioModal(true);
  };

  const handleEnvioChange = (campo, valor) => {
    setEnvioForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const guardarEnvio = async (e) => {
    e.preventDefault();
    setEnvioFormError("");
    setEnvioFormLoading(true);
    setMensaje("");

    try {
      if (!envioForm.id_unidad) {
        setEnvioFormError("Debes seleccionar una unidad de transporte.");
        return;
      }

      if (!envioForm.fecha_salida) {
        setEnvioFormError("La fecha de salida es obligatoria.");
        return;
      }

      const ignoreEnvioId =
        envioMode === "editar" && envioSeleccionado
          ? envioSeleccionado.id_envio
          : null;

      if (unidadTieneEnvioActivo(envioForm.id_unidad, ignoreEnvioId)) {
        setEnvioFormError(
          "Esta unidad ya tiene un envío activo asignado. Selecciona otra unidad."
        );
        return;
      }

      const payload = {
        id_unidad: envioForm.id_unidad,
        estado: ESTADO_CREACION_ENVIO,
        fecha_salida: `${envioForm.fecha_salida}T00:00:00`,
      };

      if (envioMode === "crear") {
        const res = await api.post("/base/envios/", payload);
        const creado = res.data;

        setMensaje("Envío creado correctamente. Ahora asigna las órdenes.");
        setShowEnvioModal(false);
        await cargarEnvios();
        await abrirAsignarOrdenes(creado);
      } else if (envioMode === "editar" && envioSeleccionado) {
        await api.patch(`/base/envios/${envioSeleccionado.id_envio}/`, payload);
        setMensaje("Envío actualizado correctamente.");
        setShowEnvioModal(false);
        setEnvioSeleccionado(null);
        await cargarEnvios();
      }
    } catch (err) {
      console.error("Error guardando envío:", err);
      const msg = err.response?.data?.detail || err.response?.data?.error;
      setEnvioFormError(
        msg || "No se pudo guardar el envío. Verifica datos o permisos."
      );
    } finally {
      setEnvioFormLoading(false);
    }
  };

  const cerrarEnvio = async (envio) => {
    if (!envio) return;
    const confirmar = window.confirm(
      `Al cerrar el envío "${envio.codigo_envio}" ya no podrás agregar más órdenes. ¿Confirmas?`
    );
    if (!confirmar) return;

    try {
      await api.patch(`/base/envios/${envio.id_envio}/`, {
        estado: "ASIGNADO",
      });
      setMensaje(
        `Envío ${envio.codigo_envio} cerrado y marcado como ASIGNADO.`
      );
      await cargarEnvios();
    } catch (err) {
      console.error("Error cerrando envío:", err);
      const msg = err.response?.data?.detail || err.response?.data?.error;
      alert(msg || "No se pudo cerrar el envío.");
    }
  };

  // ASIGNACIÓN DE ÓRDENES
  const abrirAsignarOrdenes = async (envio) => {
    const estadoUpper = (envio.estado || "").toUpperCase();
    if (estadoUpper !== ESTADO_CREACION_ENVIO.toUpperCase()) {
      alert(
        "Solo puedes asignar órdenes a envíos en estado PENDIENTE POR ASIGNACION."
      );
      return;
    }

    setEnvioSeleccionado(envio);
    setShowAsignarModal(true);
    setAsignarError("");
    setOrdenesSeleccionadas([]);
    setAsignarLoading(true);

    try {
      const res = await api.get("/ordenes/");
      const raw = Array.isArray(res.data) ? res.data : res.data.results || [];

      const ESTADOS_PERMITIDOS = ["PREPARADA"]; // Solo órdenes PREPARADA

      const filtradas = raw.filter((o) => {
        const estado = (o.estado_de_envio || "").toUpperCase();
        const sinEnvio = !o.id_envio;
        return ESTADOS_PERMITIDOS.includes(estado) && sinEnvio;
      });

      setOrdenesDisponibles(filtradas);
    } catch (err) {
      console.error("Error cargando órdenes para asignar:", err);
      const msg = err.response?.data?.detail || err.response?.data?.error;
      setAsignarError(
        msg || "No se pudieron cargar las órdenes disponibles."
      );
    } finally {
      setAsignarLoading(false);
    }
  };

  const confirmarAsignacion = async () => {
    if (!envioSeleccionado) return;
    if (ordenesSeleccionadas.length === 0) {
      setAsignarError("Selecciona al menos una orden para asignar.");
      return;
    }

    setAsignarError("");
    setAsignarLoading(true);

    try {
      await api.post(
        `/base/envios/${envioSeleccionado.id_envio}/asignar_ordenes/`,
        {
          ordenes: ordenesSeleccionadas,
        }
      );
      setMensaje(
        `Órdenes asignadas correctamente al envío ${envioSeleccionado.codigo_envio}.`
      );
      setShowAsignarModal(false);
      setEnvioSeleccionado(null);
      await cargarEnvios();
    } catch (err) {
      console.error("Error asignando órdenes:", err);
      const msg = err.response?.data?.detail || err.response?.data?.error;
      setAsignarError(msg || "No se pudieron asignar las órdenes.");
    } finally {
      setAsignarLoading(false);
    }
  };

  // RENDER
  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.headerRow}>
        <div style={styles.titleGroup}>
          <div style={styles.iconCircle}>
            <IconTruck />
          </div>
          <div>
            <h2 style={styles.title}>Transporte y Envíos</h2>
            <p style={styles.subtitle}>
              Gestión de flota, asignación de órdenes y seguimiento.
            </p>
          </div>
        </div>
      </div>

      {/* TARJETA PRINCIPAL */}
      <div style={styles.card}>
        {mensaje && <div style={styles.statusOk}>{mensaje}</div>}
        {error && <div style={styles.statusError}>{error}</div>}

        <div style={styles.colLayout}>
          {/* COLUMNA 1: UNIDADES */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <div>
                <h3 style={styles.sectionTitle}>Unidades de Transporte</h3>
                <div style={styles.smallText}>
                  Gestiona camiones, choferes y capacidad de carga.
                </div>
              </div>
              <button
                type="button"
                style={styles.buttonPrimary}
                onClick={abrirCrearUnidad}
              >
                <IconPlus /> Nueva Unidad
              </button>
            </div>

            <div style={styles.searchRow}>
              <div
                style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}
              >
                <IconSearch />
                <input
                  style={styles.searchInput}
                  placeholder="Buscar por código o placa..."
                  value={searchUnidad}
                  onChange={(e) => setSearchUnidad(e.target.value)}
                />
              </div>
              <select
                style={{ ...styles.select, maxWidth: "150px", height: "36px" }}
                value={filtroEstadoUnidad}
                onChange={(e) => setFiltroEstadoUnidad(e.target.value)}
              >
                <option value="TODOS">Todas</option>
                <option value="ACTIVA">Activa</option>
                <option value="INACTIVA">Inactiva</option>
              </select>
              <button
                type="button"
                style={styles.buttonGhost}
                onClick={() => {
                  setSearchUnidad("");
                  setFiltroEstadoUnidad("TODOS");
                }}
              >
                <IconRefresh /> Limpiar
              </button>
            </div>

            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Unidad</th>
                    <th style={styles.th}>Transportista</th>
                    <th style={styles.th}>Cap. (Kg)</th>
                    <th style={styles.th}>Estado</th>
                    <th style={{ ...styles.th, textAlign: "center" }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {unidadesFiltradas.length === 0 && !loadingUnidades && (
                    <tr>
                      <td
                        style={{
                          ...styles.td,
                          textAlign: "center",
                          color: "#94a3b8",
                          padding: "20px",
                        }}
                        colSpan={5}
                      >
                        No hay unidades registradas.
                      </td>
                    </tr>
                  )}

                  {unidadesFiltradas.map((u, idx) => {
                    const seleccionado =
                      unidadSeleccionada &&
                      unidadSeleccionada.id_unidad === u.id_unidad;
                    const rowBase = {
                      ...styles.td,
                      ...(idx % 2 === 1 ? styles.rowAlt : {}),
                      backgroundColor: seleccionado ? "#e0f2fe" : undefined,
                    };
                    const estadoNorm = (u.estado || "").toUpperCase();
                    const esActiva =
                      estadoNorm === "ACTIVA" || estadoNorm === "DISPONIBLE";

                    return (
                      <tr
                        key={u.id_unidad}
                        style={{ cursor: "pointer" }}
                        onClick={() => setUnidadSeleccionada(u)}
                      >
                        <td style={rowBase}>
                          <div
                            style={{
                              fontWeight: "600",
                              color: "#0d47a1",
                              marginBottom: "2px",
                            }}
                          >
                            {u.codigo_unidad}
                          </div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#64748b",
                            }}
                          >
                            Placa: {u.placa || "-"}
                          </div>
                        </td>
                        <td style={rowBase}>
                          <div
                            style={{
                              fontWeight: "500",
                              marginBottom: "2px",
                            }}
                          >
                            {getTransportistaLabel(u.id_usuario)}
                          </div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#94a3b8",
                            }}
                          >
                            ID usuario: {u.id_usuario || "-"}
                          </div>
                        </td>
                        <td style={rowBase}>
                          {u.capacidad_carga || "-"}
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#94a3b8",
                              marginTop: "2px",
                            }}
                          >
                            Kg de carga máxima
                          </div>
                        </td>
                        <td style={rowBase}>
                          <span style={styles.badgeEstadoUnidad(u.estado)}>
                            {u.estado || "N/A"}
                          </span>
                        </td>
                        <td style={{ ...rowBase, textAlign: "center" }}>
                          <div
                            style={{
                              display: "flex",
                              gap: "6px",
                              justifyContent: "center",
                              flexWrap: "wrap",
                            }}
                          >
                            <button
                              type="button"
                              style={styles.buttonGhost}
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirEditarUnidad(u);
                              }}
                            >
                              Editar
                            </button>
                            {esActiva ? (
                              <button
                                type="button"
                                style={styles.buttonGhost}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  desactivarUnidad(u);
                                }}
                              >
                                Desactivar
                              </button>
                            ) : (
                              <button
                                type="button"
                                style={styles.buttonGhost}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  activarUnidad(u);
                                }}
                              >
                                Activar
                              </button>
                            )}
                            <button
                              type="button"
                              style={styles.buttonDanger}
                              onClick={(e) => {
                                e.stopPropagation();
                                eliminarUnidad(u);
                              }}
                            >
                              <IconTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {unidadesFiltradas.length > 0 && (
              <div style={styles.resumenResultados}>
                Mostrando {unidadesFiltradas.length} unidad(es). Haz clic en una
                fila para ver más detalles.
              </div>
            )}

            {unidadSeleccionada && (
              <div style={styles.detalleCard}>
                <div style={styles.detalleTitle}>
                  Unidad {unidadSeleccionada.codigo_unidad} ·{" "}
                  {unidadSeleccionada.placa || "-"}
                </div>
                <div style={styles.detalleLine}>
                  <span style={styles.detalleLabel}>Transportista: </span>
                  {getTransportistaLabel(unidadSeleccionada.id_usuario)}
                </div>
                <div style={styles.detalleLine}>
                  <span style={styles.detalleLabel}>Teléfono: </span>
                  {unidadSeleccionada.telefono || "No registrado"}
                </div>
                <div style={styles.detalleLine}>
                  <span style={styles.detalleLabel}>Capacidad: </span>
                  {unidadSeleccionada.capacidad_carga || "-"} Kg
                </div>
                <div style={styles.detalleLine}>
                  <span style={styles.detalleLabel}>Estado: </span>
                  <span style={styles.badgeEstadoUnidad(unidadSeleccionada.estado)}>
                    {unidadSeleccionada.estado || "N/A"}
                  </span>
                </div>
              </div>
            )}

            {loadingUnidades && (
              <div
                style={{
                  textAlign: "center",
                  fontSize: "0.8rem",
                  color: "#64748b",
                  marginTop: "8px",
                }}
              >
                Cargando unidades...
              </div>
            )}
          </div>

          {/* COLUMNA 2: ENVÍOS */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <div>
                <h3 style={styles.sectionTitle}>Envíos Activos</h3>
                <div style={styles.smallText}>
                  Crea envíos, asigna órdenes y envíalos a preparación.
                </div>
              </div>
              <button
                type="button"
                style={styles.buttonPrimary}
                onClick={abrirCrearEnvio}
              >
                <IconPlus /> Nuevo Envío
              </button>
            </div>

            <div style={styles.searchRow}>
              <div
                style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}
              >
                <IconSearch />
                <input
                  style={styles.searchInput}
                  placeholder="Buscar por código o estado..."
                  value={searchEnvio}
                  onChange={(e) => setSearchEnvio(e.target.value)}
                />
              </div>
              <select
                style={{ ...styles.select, maxWidth: "180px", height: "36px" }}
                value={filtroEstadoEnvio}
                onChange={(e) => setFiltroEstadoEnvio(e.target.value)}
              >
                <option value="TODOS">Todos los estados</option>
                {estadosEnvioDisponibles.map((estado) => (
                  <option key={estado} value={estado.toUpperCase()}>
                    {estado}
                  </option>
                ))}
              </select>
              <button
                type="button"
                style={styles.buttonGhost}
                onClick={() => {
                  setSearchEnvio("");
                  setFiltroEstadoEnvio("TODOS");
                }}
              >
                <IconRefresh /> Limpiar
              </button>
            </div>

            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Envío</th>
                    <th style={styles.th}>Unidad</th>
                    <th style={styles.th}>Estado</th>
                    <th style={styles.th}>Salida</th>
                    <th style={styles.th}>Órdenes</th>
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
                          padding: "20px",
                        }}
                        colSpan={6}
                      >
                        No hay envíos registrados.
                      </td>
                    </tr>
                  )}

                  {enviosFiltrados.map((e, idx) => {
                    const seleccionado =
                      envioSeleccionado &&
                      envioSeleccionado.id_envio === e.id_envio;
                    const rowBase = {
                      ...styles.td,
                      ...(idx % 2 === 1 ? styles.rowAlt : {}),
                      backgroundColor: seleccionado ? "#e0f2fe" : undefined,
                    };
                    const ordenesResumen = getOrdenesResumen(e);
                    const estadoUpper = (e.estado || "").toUpperCase();
                    const puedeCerrar =
                      estadoUpper === ESTADO_CREACION_ENVIO.toUpperCase();
                    const puedeAsignar =
                      estadoUpper === ESTADO_CREACION_ENVIO.toUpperCase();
                    const puedeEditar = !estadoUpper.includes("LISTO_PARA_SALIR");

                    return (
                      <tr
                        key={e.id_envio}
                        style={{ cursor: "pointer" }}
                        onClick={() => setEnvioSeleccionado(e)}
                      >
                        <td style={rowBase}>
                          <div
                            style={{
                              fontWeight: "600",
                              color: "#0d47a1",
                              marginBottom: "2px",
                            }}
                          >
                            {e.codigo_envio}
                          </div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#94a3b8",
                            }}
                          >
                            ID: {e.id_envio}
                          </div>
                        </td>
                        <td style={rowBase}>
                          <span style={styles.pillSmall}>
                            {getUnidadLabel(e.id_unidad)}
                          </span>
                        </td>
                        <td style={rowBase}>
                          <span style={styles.badgeEstadoEnvio(e.estado)}>
                            {e.estado || "N/A"}
                          </span>
                        </td>
                        <td style={rowBase}>
                          <div>{formatFechaCorta(e.fecha_salida)}</div>
                          {e.fecha_llegada && (
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "#94a3b8",
                                marginTop: "2px",
                              }}
                            >
                              Llegada: {formatFechaCorta(e.fecha_llegada)}
                            </div>
                          )}
                        </td>
                        <td style={rowBase}>
                          {Array.isArray(ordenesResumen) &&
                          ordenesResumen.length > 0 ? (
                            <>
                              <div
                                style={{
                                  marginBottom: "4px",
                                  fontSize: "0.75rem",
                                  color: "#64748b",
                                }}
                              >
                                {ordenesResumen.length} orden(es)
                              </div>
                              {ordenesResumen.map((o) => {
                                const id =
                                  typeof o === "object" ? o.id_orden : o;
                                const texto =
                                  typeof o === "object"
                                    ? `#${o.id_orden}`
                                    : `#${o}`;
                                return (
                                  <span
                                    key={id}
                                    style={{
                                      ...styles.chipOrd,
                                      fontSize: "0.7rem",
                                    }}
                                  >
                                    {texto}
                                  </span>
                                );
                              })}
                            </>
                          ) : (
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: "#94a3b8",
                              }}
                            >
                              Sin órdenes asignadas
                            </span>
                          )}
                        </td>
                        <td style={{ ...rowBase, textAlign: "center" }}>
                          <div
                            style={{
                              display: "flex",
                              gap: "6px",
                              justifyContent: "center",
                              flexWrap: "wrap",
                            }}
                          >
                            {puedeEditar && (
                              <button
                                type="button"
                                style={styles.buttonGhost}
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  abrirEditarEnvio(e);
                                }}
                              >
                                Editar
                              </button>
                            )}
                            {puedeAsignar && (
                              <button
                                type="button"
                                style={styles.buttonGhost}
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  abrirAsignarOrdenes(e);
                                }}
                              >
                                Asignar
                              </button>
                            )}
                            {puedeCerrar && (
                              <button
                                type="button"
                                style={{
                                  ...styles.buttonGhost,
                                  borderColor: "#0d47a1",
                                  color: "#0d47a1",
                                }}
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  cerrarEnvio(e);
                                }}
                              >
                                Cerrar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {enviosFiltrados.length > 0 && (
              <div style={styles.resumenResultados}>
                Mostrando {enviosFiltrados.length} envío(s). Haz clic en una fila
                para ver el detalle completo y sus órdenes.
              </div>
            )}

            {envioSeleccionado && (
              <div style={styles.detalleCard}>
                <div style={styles.detalleTitle}>
                  Envío {envioSeleccionado.codigo_envio}
                </div>
                <div style={styles.detalleLine}>
                  <span style={styles.detalleLabel}>ID envío: </span>
                  {envioSeleccionado.id_envio}
                </div>
                <div style={styles.detalleLine}>
                  <span style={styles.detalleLabel}>Unidad: </span>
                  {getUnidadLabel(envioSeleccionado.id_unidad)}
                </div>
                <div style={styles.detalleLine}>
                  <span style={styles.detalleLabel}>Estado: </span>
                  <span style={styles.badgeEstadoEnvio(envioSeleccionado.estado)}>
                    {envioSeleccionado.estado || "N/A"}
                  </span>
                </div>
                <div style={styles.detalleLine}>
                  <span style={styles.detalleLabel}>Fecha salida: </span>
                  {formatFechaCorta(envioSeleccionado.fecha_salida)}
                </div>
                <div style={styles.detalleLine}>
                  <span style={styles.detalleLabel}>Fecha llegada: </span>
                  {formatFechaCorta(envioSeleccionado.fecha_llegada)}
                </div>
                {typeof envioSeleccionado.peso_total !== "undefined" && (
                  <div style={styles.detalleLine}>
                    <span style={styles.detalleLabel}>Peso total: </span>
                    {envioSeleccionado.peso_total || 0} Kg
                  </div>
                )}
                <div
                  style={{
                    ...styles.detalleLine,
                    marginTop: "6px",
                  }}
                >
                  <span style={styles.detalleLabel}>Órdenes asignadas: </span>
                </div>
                <div style={{ marginTop: "4px" }}>
                  {(() => {
                    const listado = getOrdenesResumen(envioSeleccionado);
                    if (!Array.isArray(listado) || listado.length === 0) {
                      return (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "#94a3b8",
                          }}
                        >
                          Este envío aún no tiene órdenes asignadas.
                        </span>
                      );
                    }
                    return listado.map((o) => {
                      const id = typeof o === "object" ? o.id_orden : o;
                      const textoPrincipal =
                        typeof o === "object"
                          ? `#${o.id_orden} · ${o.cliente_nombre || "Cliente"}`
                          : `#${o}`;
                      const sub =
                        typeof o === "object" && o.estado_de_envio
                          ? `Estado: ${o.estado_de_envio}`
                          : "";

                      return (
                        <div
                          key={id}
                          style={{
                            marginBottom: "4px",
                            padding: "4px 6px",
                            borderRadius: "8px",
                            border: "1px solid #e2e8f0",
                            background: "#f8fafc",
                            fontSize: "0.78rem",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: "600",
                              color: "#0d47a1",
                            }}
                          >
                            {textoPrincipal}
                          </div>
                          {sub && (
                            <div
                              style={{
                                fontSize: "0.72rem",
                                color: "#64748b",
                              }}
                            >
                              {sub}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {loadingEnvios && (
              <div
                style={{
                  textAlign: "center",
                  fontSize: "0.8rem",
                  color: "#64748b",
                  marginTop: "8px",
                }}
              >
                Cargando envíos...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL UNIDAD */}
      {showUnidadModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalTitle}>
              {unidadMode === "crear" ? "Registrar Unidad" : "Editar Unidad"}
            </div>
            <div style={styles.modalSubtitle}>
              Completa los datos de la unidad y asigna un transportista.
            </div>

            <form onSubmit={guardarUnidad}>
              <div style={styles.formGrid}>
                <div>
                  <div style={styles.label}>Código *</div>
                  <input
                    style={styles.input}
                    value={unidadForm.codigo_unidad}
                    onChange={(e) =>
                      handleUnidadChange("codigo_unidad", e.target.value)
                    }
                    placeholder="Ej: CAMIÓN-01"
                  />
                </div>

                <div>
                  <div style={styles.label}>Placa</div>
                  <input
                    style={styles.input}
                    value={unidadForm.placa}
                    onChange={(e) =>
                      handleUnidadChange("placa", e.target.value)
                    }
                    placeholder="ABC-123"
                  />
                </div>

                <div>
                  <div style={styles.label}>Transportista *</div>
                  <select
                    style={styles.select}
                    value={unidadForm.id_usuario}
                    onChange={(e) =>
                      handleUnidadChange("id_usuario", e.target.value)
                    }
                  >
                    <option value="">
                      {loadingTransportistas ? "Cargando..." : "Selecciona..."}
                    </option>
                    {transportistas.map((t) => {
                      const id = t.id_usuario ?? t.id;
                      const ocupado = transportistaOcupadoEnOtraUnidad(
                        id,
                        unidadMode === "editar" && unidadSeleccionada
                          ? unidadSeleccionada.id_unidad
                          : null
                      );
                      return (
                        <option key={id} value={id} disabled={ocupado}>
                          {getTransportistaLabel(id)}
                          {ocupado ? " (ya asignado)" : ""}
                        </option>
                      );
                    })}
                  </select>
                  {unidadForm.id_usuario && (
                    <div
                      style={{
                        marginTop: "6px",
                        fontSize: "0.8rem",
                        color: "#64748b",
                      }}
                    >
                      Teléfono del transportista:{" "}
                      <strong>
                        {getTransportistaTelefono(unidadForm.id_usuario) ||
                          "No registrado"}
                      </strong>
                    </div>
                  )}
                  <div style={{ marginTop: "8px" }}>
                    <button
                      type="button"
                      style={{
                        ...styles.buttonGhost,
                        width: "100%",
                        justifyContent: "center",
                      }}
                      onClick={abrirNuevoTransportista}
                    >
                      + Nuevo Transportista
                    </button>
                  </div>
                </div>

                <div>
                  <div style={styles.label}>Capacidad (Kg)</div>
                  <input
                    type="number"
                    style={styles.input}
                    value={unidadForm.capacidad_carga}
                    onChange={(e) =>
                      handleUnidadChange("capacidad_carga", e.target.value)
                    }
                    placeholder="Ej: 5000"
                  />
                </div>

                <div>
                  <div style={styles.label}>Estado</div>
                  <select
                    style={styles.select}
                    value={unidadForm.estado}
                    onChange={(e) =>
                      handleUnidadChange("estado", e.target.value)
                    }
                  >
                    <option value="ACTIVA">ACTIVA</option>
                    <option value="INACTIVA">INACTIVA</option>
                  </select>
                </div>
              </div>

              {unidadFormError && (
                <div style={styles.errorText}>{unidadFormError}</div>
              )}

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.buttonGhost}
                  onClick={() => setShowUnidadModal(false)}
                  disabled={unidadFormLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={styles.buttonPrimary}
                  disabled={unidadFormLoading}
                >
                  {unidadFormLoading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TRANSPORTISTA */}
      {showTransportistaModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalTitle}>Nuevo Transportista</div>
            <div style={styles.modalSubtitle}>
              Crea un usuario para asignar a la unidad.
            </div>

            <form onSubmit={guardarTransportista}>
              <div style={styles.formGrid}>
                <div>
                  <div style={styles.label}>Usuario *</div>
                  <input
                    style={styles.input}
                    value={transportistaForm.username}
                    onChange={(e) =>
                      handleTransportistaChange("username", e.target.value)
                    }
                    placeholder="Usuario login"
                  />
                </div>
                <div>
                  <div style={styles.label}>Nombre</div>
                  <input
                    style={styles.input}
                    value={transportistaForm.first_name}
                    onChange={(e) =>
                      handleTransportistaChange("first_name", e.target.value)
                    }
                  />
                </div>
                <div>
                  <div style={styles.label}>Apellido</div>
                  <input
                    style={styles.input}
                    value={transportistaForm.last_name}
                    onChange={(e) =>
                      handleTransportistaChange("last_name", e.target.value)
                    }
                  />
                </div>
                <div>
                  <div style={styles.label}>Teléfono</div>
                  <input
                    style={styles.input}
                    value={transportistaForm.telefono}
                    onChange={(e) =>
                      handleTransportistaChange("telefono", e.target.value)
                    }
                  />
                </div>
                <div>
                  <div style={styles.label}>Contraseña</div>
                  <input
                    type="password"
                    style={styles.input}
                    value={transportistaForm.password}
                    onChange={(e) =>
                      handleTransportistaChange("password", e.target.value)
                    }
                    placeholder="Opcional (Default: 123456)"
                  />
                </div>
              </div>

              {transportistaFormError && (
                <div style={styles.errorText}>{transportistaFormError}</div>
              )}

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.buttonGhost}
                  onClick={() => setShowTransportistaModal(false)}
                  disabled={transportistaFormLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={styles.buttonPrimary}
                  disabled={transportistaFormLoading}
                >
                  {transportistaFormLoading ? "Creando..." : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ENVÍO */}
      {showEnvioModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalTitle}>
              {envioMode === "crear" ? "Nuevo Envío" : "Editar Envío"}
            </div>
            <div style={styles.modalSubtitle}>
              Configura los datos del envío.
            </div>

            <form onSubmit={guardarEnvio}>
              <div style={styles.formGrid}>
                <div>
                  <div style={styles.label}>Código</div>
                  <input
                    style={{
                      ...styles.input,
                      backgroundColor: "#f1f5f9",
                    }}
                    value={envioForm.codigo_envio}
                    readOnly
                  />
                </div>

                <div>
                  <div style={styles.label}>Unidad Asignada *</div>
                  <select
                    style={styles.select}
                    value={envioForm.id_unidad}
                    onChange={(e) =>
                      handleEnvioChange("id_unidad", e.target.value)
                    }
                  >
                    <option value="">Selecciona unidad...</option>
                    {unidades
                      .filter((u) => {
                        const estado = (u.estado || "").toUpperCase();
                        const esActiva =
                          estado === "ACTIVA" || estado === "DISPONIBLE";
                        const ignoreEnvioId =
                          envioMode === "editar" && envioSeleccionado
                            ? envioSeleccionado.id_envio
                            : null;
                        const tieneActivo = unidadTieneEnvioActivo(
                          u.id_unidad,
                          ignoreEnvioId
                        );
                        return esActiva && !tieneActivo;
                      })
                      .map((u) => (
                        <option key={u.id_unidad} value={u.id_unidad}>
                          {u.codigo_unidad} · {u.placa || ""}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <div style={styles.label}>Fecha Salida *</div>
                  <input
                    type="date"
                    style={styles.input}
                    value={envioForm.fecha_salida}
                    onChange={(e) =>
                      handleEnvioChange("fecha_salida", e.target.value)
                    }
                  />
                </div>
              </div>

              {envioFormError && (
                <div style={styles.errorText}>{envioFormError}</div>
              )}

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.buttonGhost}
                  onClick={() => setShowEnvioModal(false)}
                  disabled={envioFormLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={styles.buttonPrimary}
                  disabled={envioFormLoading}
                >
                  {envioFormLoading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ASIGNAR ÓRDENES */}
      {showAsignarModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalTitle}>Asignar Órdenes</div>
            <div style={styles.modalSubtitle}>
              Envío: <strong>{envioSeleccionado?.codigo_envio}</strong>
            </div>

            {asignarLoading ? (
              <div
                style={{
                  textAlign: "center",
                  padding: 20,
                  color: "#64748b",
                }}
              >
                Cargando órdenes...
              </div>
            ) : (
              <>
                <div style={{ marginBottom: "10px" }}>
                  <input
                    style={styles.searchInput}
                    placeholder="Filtrar orden por ID o cliente..."
                    value={searchOrden}
                    onChange={(e) => setSearchOrden(e.target.value)}
                  />
                </div>

                <div
                  style={{
                    maxHeight: "300px",
                    overflowY: "auto",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "10px",
                  }}
                >
                  {ordenesDisponibles.filter(
                    (o) =>
                      String(o.id_orden).includes(searchOrden) ||
                      (o.cliente_nombre || "")
                        .toLowerCase()
                        .includes((searchOrden || "").toLowerCase())
                  ).length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        color: "#94a3b8",
                        fontSize: "0.8rem",
                      }}
                    >
                      No hay órdenes disponibles.
                    </div>
                  ) : (
                    ordenesDisponibles
                      .filter(
                        (o) =>
                          String(o.id_orden).includes(searchOrden) ||
                          (o.cliente_nombre || "")
                            .toLowerCase()
                            .includes((searchOrden || "").toLowerCase())
                      )
                      .map((o) => (
                        <label
                          key={o.id_orden}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "8px",
                            borderBottom: "1px solid #f1f5f9",
                            fontSize: "0.85rem",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={ordenesSeleccionadas.includes(o.id_orden)}
                            onChange={() =>
                              setOrdenesSeleccionadas((prev) =>
                                prev.includes(o.id_orden)
                                  ? prev.filter((id) => id !== o.id_orden)
                                  : [...prev, o.id_orden]
                              )
                            }
                          />
                          <div>
                            <div
                              style={{
                                fontWeight: "bold",
                                color: "#0d47a1",
                              }}
                            >
                              #{o.id_orden}
                            </div>
                            <div
                              style={{
                                color: "#64748b",
                                fontSize: "0.75rem",
                              }}
                            >
                              {o.cliente_nombre || "Cliente"} ·{" "}
                              {o.estado_de_envio}
                            </div>
                          </div>
                        </label>
                      ))
                  )}
                </div>

                {asignarError && (
                  <div style={styles.errorText}>{asignarError}</div>
                )}

                <div style={styles.modalActions}>
                  <button
                    type="button"
                    style={styles.buttonGhost}
                    onClick={() => setShowAsignarModal(false)}
                    disabled={asignarLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    style={styles.buttonPrimary}
                    onClick={confirmarAsignacion}
                    disabled={asignarLoading}
                  >
                    {asignarLoading ? "Asignando..." : "Confirmar"}
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