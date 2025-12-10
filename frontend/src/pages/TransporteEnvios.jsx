// frontend/src/pages/TransporteEnvios.jsx
import React, { useEffect, useState } from "react";
import api from "../api/api";

const ESTADO_CREACION_ENVIO = "PENDIENTE POR APROBACION";

const styles = {
  page: {
    minHeight: "100vh",
    margin: 0,
    padding: "24px",
    background: "#f4f5fb",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    display: "flex",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    maxWidth: "1200px",
    background: "#ffffff",
    borderRadius: "14px",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.12)",
    padding: "20px 24px 24px",
    boxSizing: "border-box",
  },
  title: {
    fontSize: "22px",
    fontWeight: 600,
    color: "#0f172a",
    margin: 0,
  },
  subtitle: {
    fontSize: "13px",
    color: "#6b7280",
    margin: "4px 0 18px 0",
  },
  colLayout: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  sectionCard: {
    flex: 1,
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    padding: "14px 16px",
    background: "#f9fafb",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#111827",
    margin: 0,
  },
  smallText: {
    fontSize: "11px",
    color: "#6b7280",
  },
  buttonPrimary: {
    border: "none",
    borderRadius: "999px",
    padding: "0 14px",
    height: "32px",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  buttonGhost: {
    borderRadius: "999px",
    padding: "0 14px",
    height: "30px",
    background: "#ffffff",
    border: "1px solid #d1d5db",
    color: "#374151",
    cursor: "pointer",
    fontSize: "12px",
  },
  buttonDanger: {
    borderRadius: "999px",
    padding: "0 14px",
    height: "30px",
    background: "#ef4444",
    border: "none",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 500,
  },
  tableWrapper: {
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    overflow: "hidden",
    background: "#ffffff",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "11.5px",
  },
  th: {
    background: "#f3f4f6",
    textAlign: "left",
    padding: "6px 8px",
    borderBottom: "1px solid #e5e7eb",
    color: "#4b5563",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  td: {
    padding: "6px 8px",
    borderBottom: "1px solid #e5e7eb",
    color: "#111827",
    verticalAlign: "top",
  },
  rowAlt: {
    background: "#f9fafb",
  },
  badgeEstadoUnidad: (estado) => {
    const norm = (estado || "").toUpperCase();
    const activo = norm === "ACTIVA" || norm === "DISPONIBLE";
    return {
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: "999px",
      fontSize: "10px",
      fontWeight: 600,
      background: activo ? "#dcfce7" : "#fee2e2",
      color: activo ? "#166534" : "#b91c1c",
    };
  },
  badgeEstadoEnvio: (estado) => {
    const norm = (estado || "").toUpperCase();
    let bg = "#e5e7eb";
    let color = "#374151";

    if (norm.includes("LISTO") || norm.includes("APROB")) {
      bg = "#dcfce7";
      color = "#166534";
    } else if (norm.includes("RUTA") || norm.includes("TRANSITO")) {
      bg = "#dbeafe";
      color = "#1d4ed8";
    } else if (norm.includes("CANCEL")) {
      bg = "#fee2e2";
      color = "#b91c1c";
    }

    return {
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: "999px",
      fontSize: "10px",
      fontWeight: 600,
      background: bg,
      color,
    };
  },
  searchInput: {
    height: "32px",
    borderRadius: "999px",
    border: "1px solid #d1d5db",
    padding: "0 10px",
    fontSize: "12px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  searchRow: {
    display: "flex",
    gap: "8px",
    marginBottom: "8px",
  },
  pillSmall: {
    fontSize: "11px",
    padding: "2px 8px",
    borderRadius: "999px",
    background: "#e5e7eb",
    color: "#374151",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.35)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 40,
  },
  modal: {
    width: "100%",
    maxWidth: "520px",
    background: "#ffffff",
    borderRadius: "14px",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.2)",
    padding: "18px 20px 20px",
    boxSizing: "border-box",
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#0f172a",
    marginBottom: "4px",
  },
  modalSubtitle: {
    fontSize: "12px",
    color: "#6b7280",
    marginBottom: "12px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "8px",
    marginTop: "8px",
  },
  label: {
    fontSize: "11px",
    fontWeight: 500,
    color: "#4b5563",
    marginBottom: "3px",
  },
  input: {
    height: "34px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    padding: "0 8px",
    fontSize: "12px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  textarea: {
    minHeight: "60px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    padding: "6px 8px",
    fontSize: "12px",
    outline: "none",
    width: "100%",
    resize: "vertical",
    boxSizing: "border-box",
  },
  select: {
    height: "34px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    padding: "0 8px",
    fontSize: "12px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    backgroundColor: "#fff",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
    marginTop: "14px",
  },
  errorText: {
    marginTop: "6px",
    fontSize: "12px",
    color: "#b91c1c",
  },
  okText: {
    marginTop: "6px",
    fontSize: "12px",
    color: "#15803d",
  },
  chipOrd: {
    display: "inline-block",
    fontSize: "10px",
    padding: "2px 6px",
    borderRadius: "999px",
    background: "#eff6ff",
    color: "#1d4ed8",
    marginRight: "4px",
    marginBottom: "2px",
  },
};

function TransporteEnvios() {
  // -----------------------------
  // ESTADO GENERAL
  // -----------------------------
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

  const [unidadSeleccionada, setUnidadSeleccionada] = useState(null);
  const [envioSeleccionado, setEnvioSeleccionado] = useState(null);

  // Modales unidad
  const [showUnidadModal, setShowUnidadModal] = useState(false);
  const [unidadMode, setUnidadMode] = useState("crear"); // "crear" | "editar"
  const [unidadForm, setUnidadForm] = useState({
    codigo_unidad: "",
    id_usuario: "",
    capacidad_carga: "",
    telefono: "",
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

  // -----------------------------
  // CARGA DE DATOS
  // -----------------------------
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
      // No mostramos error global aquí
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

  // -----------------------------
  // HELPERS
  // -----------------------------
  const unidadesFiltradas = unidades.filter((u) => {
    const t = (searchUnidad || "").toLowerCase();
    if (!t) return true;
    return (
      (u.codigo_unidad || "").toLowerCase().includes(t) ||
      (u.placa || "").toLowerCase().includes(t)
    );
  });

  const enviosFiltrados = envios.filter((e) => {
    const t = (searchEnvio || "").toLowerCase();
    if (!t) return true;
    return (
      (e.codigo_envio || "").toLowerCase().includes(t) ||
      (e.estado || "").toLowerCase().includes(t)
    );
  });

  const getUnidadLabel = (unidadId) => {
    const u = unidades.find((x) => String(x.id_unidad) === String(unidadId));
    if (!u) return "Sin unidad";
    return `${u.codigo_unidad} · ${u.placa || ""}`.trim();
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

  // -----------------------------
  // GESTIÓN DE UNIDADES
  // -----------------------------
  const abrirCrearUnidad = () => {
    setUnidadMode("crear");
    setUnidadForm({
      codigo_unidad: "",
      id_usuario: "",
      capacidad_carga: "",
      telefono: "",
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
      telefono: unidad.telefono || "",
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

      const payload = {
        codigo_unidad: unidadForm.codigo_unidad,
        id_usuario: unidadForm.id_usuario,
        telefono: unidadForm.telefono,
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
        await api.patch(
          `/base/unidades/${unidadSeleccionada.id_unidad}/`,
          payload
        );
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
    } catch (err) {
      console.error("Error eliminando unidad:", err);
      const msg = err.response?.data?.detail || err.response?.data?.error;
      alert(
        msg ||
          "No se pudo eliminar la unidad. Es posible que tenga envíos asociados."
      );
    }
  };

  // -----------------------------
  // NUEVO TRANSPORTISTA
  // -----------------------------
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

  // -----------------------------
  // GESTIÓN DE ENVÍOS
  // -----------------------------
  const abrirCrearEnvio = () => {
    const timestamp = String(Date.now());
    const nuevoCodigo = `ENV-${timestamp}`;

    setEnvioMode("crear");
    setEnvioSeleccionado(null);
    setEnvioForm({
      codigo_envio: nuevoCodigo,
      id_unidad: "",
      fecha_salida: "",
    });
    setEnvioFormError("");
    setShowEnvioModal(true);
  };

  const abrirEditarEnvio = (envio) => {
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

      const payload = {
        codigo_envio: envioForm.codigo_envio,
        id_unidad: envioForm.id_unidad,
        estado: ESTADO_CREACION_ENVIO,
        fecha_salida: `${envioForm.fecha_salida}T00:00:00`,
      };

      if (envioMode === "crear") {
        const res = await api.post("/base/envios/", payload);
        const creado = res.data;

        setMensaje(
          "Envío creado correctamente en estado 'pendiente por aprobación'. Ahora selecciona las órdenes que deseas incluir."
        );
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
        estado: "PENDIENTE_PREPARACION",
      });
      setMensaje(
        `Envío ${envio.codigo_envio} cerrado y enviado a preparación de almacén.`
      );
      await cargarEnvios();
    } catch (err) {
      console.error("Error cerrando envío:", err);
      const msg = err.response?.data?.detail || err.response?.data?.error;
      alert(
        msg || "No se pudo cerrar el envío. Verifica los estados o tus permisos."
      );
    }
  };

  // -----------------------------
  // ASIGNACIÓN DE ÓRDENES
  // -----------------------------
  const abrirAsignarOrdenes = async (envio) => {
    // Guardamos qué envío estamos trabajando
    setEnvioSeleccionado(envio);
    setShowAsignarModal(true);
    setAsignarError("");
    setOrdenesSeleccionadas([]);
    setAsignarLoading(true);

    try {
      // Traemos todas las órdenes desde el backend normal
      const res = await api.get("/ordenes/");
      const raw = Array.isArray(res.data) ? res.data : res.data.results || [];

      // Filtramos aquí en el front: solo
      // - estados APROBADA / POR_PREPARACION / PREPARADA
      // - sin envío asignado (id_envio nulo)
      const ESTADOS_PERMITIDOS = [
        "APROBADA",
        "POR_PREPARACION",
        "PREPARADA",
      ];

      const filtradas = raw.filter((o) => {
        const estado = (o.estado_de_envio || "").toUpperCase();
        const sinEnvio = !o.id_envio; // null, undefined o 0 -> false
        return ESTADOS_PERMITIDOS.includes(estado) && sinEnvio;
      });

      setOrdenesDisponibles(filtradas);
    } catch (err) {
      console.error("Error cargando órdenes para asignar:", err);
      const msg = err.response?.data?.detail || err.response?.data?.error;
      setAsignarError(
        msg ||
          "No se pudieron cargar las órdenes disponibles para envío. Verifica permisos."
      );
    } finally {
      setAsignarLoading(false);
    }
  };

  const toggleOrdenSeleccionada = (id_orden) => {
    setOrdenesSeleccionadas((prev) =>
      prev.includes(id_orden)
        ? prev.filter((id) => id !== id_orden)
        : [...prev, id_orden]
    );
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
      await api.post(`/base/envios/${envioSeleccionado.id_envio}/asignar_ordenes/`, {
        ordenes: ordenesSeleccionadas,
      });
      setMensaje(
        `Órdenes asignadas correctamente al envío ${envioSeleccionado.codigo_envio}.`
      );
      setShowAsignarModal(false);
      setEnvioSeleccionado(null);
      await cargarEnvios();
    } catch (err) {
      console.error("Error asignando órdenes:", err);
      const msg = err.response?.data?.detail || err.response?.data?.error;
      setAsignarError(
        msg ||
          "No se pudieron asignar las órdenes. Verifica estados o permisos."
      );
    } finally {
      setAsignarLoading(false);
    }
  };

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Gestión de transporte y envíos</h2>
        <p style={styles.subtitle}>
          Define las unidades de transporte, registra transportistas, crea envíos
          y asigna órdenes aprobadas / por preparar / preparadas a cada unidad.
        </p>

        {mensaje && <div style={styles.okText}>{mensaje}</div>}
        {error && <div style={styles.errorText}>{error}</div>}

        <div style={styles.colLayout}>
          {/* UNIDADES */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <div>
                <h3 style={styles.sectionTitle}>Unidades de transporte</h3>
                <div style={styles.smallText}>
                  Crea, edita, asigna transportistas, activa / desactiva y
                  elimina unidades. Solo se puede modificar una unidad si cumple
                  las reglas de negocio del backend.
                </div>
              </div>
              <button
                type="button"
                style={styles.buttonPrimary}
                onClick={abrirCrearUnidad}
              >
                + Nueva unidad
              </button>
            </div>

            <div style={styles.searchRow}>
              <input
                style={styles.searchInput}
                placeholder="Buscar por código o placa..."
                value={searchUnidad}
                onChange={(e) => setSearchUnidad(e.target.value)}
              />
              <button
                type="button"
                style={styles.buttonGhost}
                onClick={() => setSearchUnidad("")}
              >
                Limpiar
              </button>
            </div>

            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Código</th>
                    <th style={styles.th}>Placa</th>
                    <th style={styles.th}>Transportista</th>
                    <th style={styles.th}>Capacidad</th>
                    <th style={styles.th}>Estado</th>
                    <th style={styles.th}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {unidadesFiltradas.length === 0 && !loadingUnidades && (
                    <tr>
                      <td style={styles.td} colSpan={6}>
                        No hay unidades registradas o que coincidan con la
                        búsqueda.
                      </td>
                    </tr>
                  )}

                  {unidadesFiltradas.map((u, idx) => {
                    const rowBase =
                      idx % 2 === 1
                        ? { ...styles.td, ...styles.rowAlt }
                        : styles.td;
                    const esActiva =
                      (u.estado || "").toUpperCase() === "ACTIVA" ||
                      (u.estado || "").toUpperCase() === "DISPONIBLE";

                    return (
                      <tr key={u.id_unidad}>
                        <td style={rowBase}>{u.codigo_unidad}</td>
                        <td style={rowBase}>{u.placa || "-"}</td>
                        <td style={rowBase}>
                          {getTransportistaLabel(u.id_usuario)}
                        </td>
                        <td style={rowBase}>{u.capacidad_carga || "-"}</td>
                        <td style={rowBase}>
                          <span style={styles.badgeEstadoUnidad(u.estado)}>
                            {u.estado || "N/A"}
                          </span>
                        </td>
                        <td style={rowBase}>
                          <div style={{ display: "flex", gap: "4px" }}>
                            <button
                              type="button"
                              style={styles.buttonGhost}
                              onClick={() => abrirEditarUnidad(u)}
                            >
                              Editar
                            </button>
                            {esActiva ? (
                              <button
                                type="button"
                                style={styles.buttonGhost}
                                onClick={() => desactivarUnidad(u)}
                              >
                                Desactivar
                              </button>
                            ) : (
                              <button
                                type="button"
                                style={styles.buttonGhost}
                                onClick={() => activarUnidad(u)}
                              >
                                Activar
                              </button>
                            )}
                            <button
                              type="button"
                              style={styles.buttonDanger}
                              onClick={() => eliminarUnidad(u)}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {loadingUnidades && (
              <div style={styles.smallText}>Cargando unidades...</div>
            )}
          </div>

          {/* ENVÍOS */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <div>
                <h3 style={styles.sectionTitle}>Envíos y asignación de órdenes</h3>
                <div style={styles.smallText}>
                  Crea envíos, asígnalos a una unidad disponible y agrega órdenes
                  aprobadas / por preparar / preparadas. Cuando tengas todas las
                  órdenes deseadas, cierra el envío para enviarlo a preparación de
                  almacén.
                </div>
              </div>
              <button
                type="button"
                style={styles.buttonPrimary}
                onClick={abrirCrearEnvio}
              >
                + Nuevo envío
              </button>
            </div>

            <div style={styles.searchRow}>
              <input
                style={styles.searchInput}
                placeholder="Buscar por código de envío o estado..."
                value={searchEnvio}
                onChange={(e) => setSearchEnvio(e.target.value)}
              />
              <button
                type="button"
                style={styles.buttonGhost}
                onClick={() => setSearchEnvio("")}
              >
                Limpiar
              </button>
            </div>

            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Código</th>
                    <th style={styles.th}>Unidad</th>
                    <th style={styles.th}>Estado</th>
                    <th style={styles.th}>Fecha salida</th>
                    <th style={styles.th}>Órdenes</th>
                    <th style={styles.th}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {enviosFiltrados.length === 0 && !loadingEnvios && (
                    <tr>
                      <td style={styles.td} colSpan={6}>
                        No hay envíos registrados o que coincidan con la
                        búsqueda.
                      </td>
                    </tr>
                  )}

                  {enviosFiltrados.map((e, idx) => {
                    const rowBase =
                      idx % 2 === 1
                        ? { ...styles.td, ...styles.rowAlt }
                        : styles.td;

                    const ordenesResumen =
                      e.ordenes_resumen || e.ordenes || e.ordenes_ids || [];

                    const estadoUpper = (e.estado || "").toUpperCase();
                    const puedeCerrar =
                      estadoUpper === "PENDIENTE" ||
                      estadoUpper === "ASIGNADO" ||
                      estadoUpper === "PENDIENTE POR APROBACION";

                    return (
                      <tr key={e.id_envio}>
                        <td style={rowBase}>{e.codigo_envio}</td>
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
                        <td style={rowBase}>{e.fecha_salida || "-"}</td>
                        <td style={rowBase}>
                          {Array.isArray(ordenesResumen) &&
                          ordenesResumen.length > 0 ? (
                            ordenesResumen.map((o) => {
                              const texto =
                                typeof o === "object"
                                  ? `#${o.id_orden} · ${
                                      o.cliente_nombre || ""
                                    }`
                                  : `#${o}`;
                              const key =
                                typeof o === "object" ? o.id_orden : o;
                              return (
                                <span key={key} style={styles.chipOrd}>
                                  {texto}
                                </span>
                              );
                            })
                          ) : (
                            <span style={styles.smallText}>
                              Sin órdenes asignadas
                            </span>
                          )}
                        </td>
                        <td style={rowBase}>
                          <div style={{ display: "flex", gap: "4px" }}>
                            <button
                              type="button"
                              style={styles.buttonGhost}
                              onClick={() => abrirEditarEnvio(e)}
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              style={styles.buttonGhost}
                              onClick={() => abrirAsignarOrdenes(e)}
                            >
                              Asignar órdenes
                            </button>

                            {puedeCerrar && (
                              <button
                                type="button"
                                style={styles.buttonGhost}
                                onClick={() => cerrarEnvio(e)}
                              >
                                Cerrar envío
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

            {loadingEnvios && (
              <div style={styles.smallText}>Cargando envíos...</div>
            )}
          </div>
        </div>

        {/* MODAL UNIDAD */}
        {showUnidadModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <div style={styles.modalTitle}>
                {unidadMode === "crear"
                  ? "Registrar nueva unidad"
                  : "Editar unidad de transporte"}
              </div>
              <div style={styles.modalSubtitle}>
                Completa los datos de la unidad y selecciona un transportista.
                Solo el gerente / administrador puede gestionar estas unidades.
              </div>

              <form onSubmit={guardarUnidad}>
                <div style={styles.formGrid}>
                  <div>
                    <div style={styles.label}>Código de unidad *</div>
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
                        {loadingTransportistas
                          ? "Cargando transportistas..."
                          : "Selecciona un transportista"}
                      </option>
                      {transportistas.map((t) => {
                        const id = t.id_usuario ?? t.id;
                        return (
                          <option key={id} value={id}>
                            {getTransportistaLabel(id)}
                          </option>
                        );
                      })}
                    </select>
                    <div style={{ marginTop: "4px" }}>
                      <button
                        type="button"
                        style={styles.buttonGhost}
                        onClick={abrirNuevoTransportista}
                      >
                        + Registrar nuevo transportista
                      </button>
                    </div>
                  </div>

                  <div>
                    <div style={styles.label}>Teléfono</div>
                    <input
                      style={styles.input}
                      value={unidadForm.telefono}
                      onChange={(e) =>
                        handleUnidadChange("telefono", e.target.value)
                      }
                      placeholder="0414-0000000"
                    />
                  </div>

                  <div>
                    <div style={styles.label}>Capacidad de carga (Kg)</div>
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
                    {unidadFormLoading
                      ? "Guardando..."
                      : unidadMode === "crear"
                      ? "Crear unidad"
                      : "Guardar cambios"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL NUEVO TRANSPORTISTA */}
        {showTransportistaModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <div style={styles.modalTitle}>Registrar nuevo transportista</div>
              <div style={styles.modalSubtitle}>
                Crea un usuario con rol TRANSPORTISTA para asignarlo a una
                unidad de transporte.
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
                      placeholder="Usuario de inicio de sesión"
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
                      placeholder="Nombre"
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
                      placeholder="Apellido"
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
                      placeholder="0414-0000000"
                    />
                  </div>

                  <div>
                    <div style={styles.label}>Contraseña (opcional)</div>
                    <input
                      type="password"
                      style={styles.input}
                      value={transportistaForm.password}
                      onChange={(e) =>
                        handleTransportistaChange("password", e.target.value)
                      }
                      placeholder="Si la dejas en blanco se usará 123456"
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
                    {transportistaFormLoading ? "Creando..." : "Crear transportista"}
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
                {envioMode === "crear" ? "Crear nuevo envío" : "Editar envío"}
              </div>
              <div style={styles.modalSubtitle}>
                El código de envío se genera automáticamente. Selecciona una
                unidad de transporte disponible y, opcionalmente, una fecha de
                salida. Luego podrás asignar las órdenes.
              </div>

              <form onSubmit={guardarEnvio}>
                <div style={styles.formGrid}>
                  <div>
                    <div style={styles.label}>Código de envío</div>
                    <input
                      style={styles.input}
                      value={envioForm.codigo_envio}
                      readOnly
                    />
                  </div>

                  <div>
                    <div style={styles.label}>Unidad asignada *</div>
                    <select
                      style={styles.select}
                      value={envioForm.id_unidad}
                      onChange={(e) =>
                        handleEnvioChange("id_unidad", e.target.value)
                      }
                    >
                      <option value="">Selecciona una unidad</option>
                      {unidades
                        .filter(
                          (u) =>
                            (u.estado || "").toUpperCase() === "ACTIVA" ||
                            (u.estado || "").toUpperCase() === "DISPONIBLE"
                        )
                        .map((u) => (
                          <option key={u.id_unidad} value={u.id_unidad}>
                            {u.codigo_unidad} · {u.placa || ""}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <div style={styles.label}>Fecha de salida (opcional)</div>
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
                    {envioFormLoading
                      ? "Guardando..."
                      : envioMode === "crear"
                      ? "Crear envío"
                      : "Guardar cambios"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL ASIGNAR ÓRDENES */}
        {(() => {
          // Filtrado de órdenes para el buscador
          const ordenesFiltradas = ordenesDisponibles.filter((o) => {
            const texto = (searchOrden || "").toLowerCase();
            if (!texto) return true;
            const idText = String(o.id_orden || "");
            const cliente = (o.cliente_nombre || "").toLowerCase();
            const estado = (o.estado_de_envio || "").toLowerCase();
            return (
              idText.includes(texto) ||
              cliente.includes(texto) ||
              estado.includes(texto)
            );
          });
          return (
            showAsignarModal && (
              <div style={styles.modalOverlay}>
                <div style={styles.modal}>
                  <div style={styles.modalTitle}>
                    Asignar órdenes al envío {envioSeleccionado?.codigo_envio || ""}
                  </div>
                  <div style={styles.modalSubtitle}>
                    Se muestran únicamente las órdenes aprobadas / por preparar /
                    preparadas que aún no tienen envío asignado.
                  </div>

                  {asignarLoading ? (
                    <div style={styles.smallText}>Cargando órdenes...</div>
                  ) : (
                    <>
                      <div style={{ marginBottom: "8px" }}>
                        <input
                          style={styles.searchInput}
                          placeholder="Buscar orden por #, cliente o estado..."
                          value={searchOrden}
                          onChange={(e) => setSearchOrden(e.target.value)}
                        />
                      </div>
                      <div
                        style={{
                          maxHeight: "260px",
                          overflowY: "auto",
                          border: "1px solid #e5e7eb",
                          borderRadius: "10px",
                          padding: "6px 8px",
                          background: "#f9fafb",
                        }}
                      >
                        {ordenesFiltradas.length === 0 ? (
                          <div style={styles.smallText}>
                            No hay órdenes disponibles para asignar.
                          </div>
                        ) : (
                          ordenesFiltradas.map((o) => (
                            <label
                              key={o.id_orden}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "4px 2px",
                                fontSize: "12px",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={ordenesSeleccionadas.includes(o.id_orden)}
                                onChange={() => toggleOrdenSeleccionada(o.id_orden)}
                              />
                              <span>
                                <strong>#{o.id_orden}</strong> ·{" "}
                                {o.cliente_nombre || "Sin cliente"} ·{" "}
                                {o.estado_de_envio} · Peso: {o.peso_total || 0} Kg
                              </span>
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
                          {asignarLoading
                            ? "Asignando..."
                            : "Confirmar asignación"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          );
        })()}
      </div>
    </div>
  );
}

export default TransporteEnvios;