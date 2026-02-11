// frontend/src/pages/Transportistas.jsx

import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import api from "../api/api";
import { toast } from "react-hot-toast";
import { useAuth } from "../AuthContext";

const ESTADO_CREACION_ENVIO = "PENDIENTE POR ASIGNACION";

// -----------------------------
// ICONOS
// -----------------------------
const IconTruck = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="2" ry="2" />
    <path d="M16 8h4l3 3v5h-7z" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const IconRefresh = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"></polyline>
    <polyline points="1 20 1 14 7 14"></polyline>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
  </svg>
);

const IconMap = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
    <path d="M1 6l7-3 7 3 8-3v15l-8 3-7-3-7 3z"></path>
    <path d="M8 3v15"></path>
    <path d="M15 6v15"></path>
  </svg>
);

const formatDateOnly = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d)) return "-";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function TransporteEnvio() {
  const [envio, setEnvio] = useState(null);
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAccion, setLoadingAccion] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [filtroTexto, setFiltroTexto] = useState("");
  const [ordenSort, setOrdenSort] = useState("");
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);

  const [modalDevolucionVisible, setModalDevolucionVisible] = useState(false);
  const [ordenDevolucion, setOrdenDevolucion] = useState(null);
  const [lineasDevolucion, setLineasDevolucion] = useState([]);
  const [notaDevolucion, setNotaDevolucion] = useState("");
  const [errorDevolucion, setErrorDevolucion] = useState("");

  const [confirmConfig, setConfirmConfig] = useState(null);

  const cargarOrdenes = async (ignorarErrores = false) => {
    try {
      const params = {};
      if (filtroTexto) params.q = filtroTexto;

      const res = await api.get("base/transporte/mi-envio/ordenes/", { params });
      setOrdenes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error cargando órdenes:", err);
      if (!ignorarErrores) {
        setError("No se pudieron cargar las órdenes del envío.");
      }
    }
  };

  const cargarEnvio = async () => {
    setLoading(true);
    setError("");
    setMensaje("");
    setOrdenSeleccionada(null);
    try {
      const res = await api.get("base/transporte/mi-envio/");
      if (res.data && res.data.id_envio) {
        setEnvio(res.data);
        
        // Cargar órdenes (priorizando las que vienen en el envío si existen, sino recargando)
        if (Array.isArray(res.data.ordenes) && res.data.ordenes.length > 0) {
           setOrdenes(res.data.ordenes);
        } else {
           // Si no vienen o están vacías, forzamos la carga (tolerante a fallos)
           await cargarOrdenes(true);
        }
      } else {
        setEnvio(null);
        setOrdenes([]);
        setMensaje(res.data?.mensaje || "No tienes envío asignado.");
      }
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar la información del envío.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEnvio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aplicarFiltros = async () => {
    setLoading(true);
    setError("");
    try {
      await cargarOrdenes();
      setMensaje("Filtros aplicados.");
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltroTexto("");
    setOrdenSort("");
    setMensaje("");
    setError("");
    cargarOrdenes();
  };

  // --- CONFIRMACIONES ---

  const abrirConfirmacionIniciarViaje = () => {
    if (!envio) return;
    const estadoActual = (envio.estado || "").toUpperCase();
    if (estadoActual !== "LISTO_PARA_SALIR") {
      setError(
        "El almacenista aún no ha preparado el envío. Solo puedes iniciar el viaje cuando el envío esté marcado como LISTO_PARA_SALIR."
      );
      setMensaje("");
      return;
    }
    setConfirmConfig({
      tipo: "INICIAR",
      titulo: "Iniciar viaje",
      mensaje:
        "¿Seguro que deseas iniciar el viaje para este envío? Una vez iniciado, podrás gestionar el estado de cada orden (Entregada, No entregada, Devolución).",
    });
  };

  const abrirConfirmacionFinalizarEnvio = () => {
    if (!envio) return;
    setConfirmConfig({
      tipo: "FINALIZAR",
      titulo: "Finalizar envío",
      mensaje:
        "¿Deseas marcar este envío como TERMINADO? Asegúrate de que todas las órdenes estén ENTREGADAS, NO ENTREGADAS o DEVUELTAS antes de continuar.",
    });
  };

  const cerrarConfirmacion = () => {
    setConfirmConfig(null);
  };

  const ejecutarConfirmacion = async () => {
    if (!confirmConfig) return;
    if (confirmConfig.tipo === "INICIAR") {
      await iniciarViaje();
    } else if (confirmConfig.tipo === "FINALIZAR") {
      await finalizarEnvio();
    }
    setConfirmConfig(null);
  };

  const iniciarViaje = async () => {
    if (!envio) return;

    setLoadingAccion(true);
    setError("");
    setMensaje("");
    try {
      const res = await api.post("base/transporte/mi-envio/iniciar-viaje/");
      setMensaje(res.data?.mensaje || "Viaje iniciado.");
      await cargarEnvio();
    } catch (err) {
      console.error(err);
      const backendMsg =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        "No se pudo iniciar el viaje.";
      setError(backendMsg);
    } finally {
      setLoadingAccion(false);
    }
  };

  const finalizarEnvio = async () => {
    if (!envio) return;

    setLoadingAccion(true);
    setError("");
    setMensaje("");
    try {
      const res = await api.post("base/transporte/mi-envio/finalizar/");
      setMensaje(res.data?.mensaje || "Envío finalizado.");
      await cargarEnvio();
    } catch (err) {
      console.error(err);
      const backendMsg =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        "No se pudo finalizar el envío.";
      setError(backendMsg);
    } finally {
      setLoadingAccion(false);
    }
  };

  const marcarEntregada = async (orden) => {
    if (!orden) return;
    setLoadingAccion(true);
    setError("");
    setMensaje("");
    try {
      const res = await api.post(
        `base/transporte/${orden.id_orden}/marcar-entregada/`
      );
      setMensaje(res.data?.mensaje || "Orden marcada como ENTREGADA.");
      await cargarOrdenes();
    } catch (err) {
      console.error(err);
      const backendMsg =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        "No se pudo marcar la orden como ENTREGADA.";
      setError(backendMsg);
    } finally {
      setLoadingAccion(false);
    }
  };

  const marcarNoEntregada = async (orden) => {
    if (!orden) return;
    const confirmar = window.confirm(
      `¿Marcar la orden #${orden.id_orden} como NO ENTREGADA? La orden volverá a estado pendiente para ser reprogramada.`
    );
    if (!confirmar) return;

    setLoadingAccion(true);
    setError("");
    setMensaje("");

    try {
      const res = await api.post(
        `base/transporte/${orden.id_orden}/marcar-no-entregada/`,
        {}
      );
      setMensaje(
        res.data?.mensaje ||
          "Orden marcada como NO ENTREGADA y devuelta a estado pendiente."
      );
      await cargarOrdenes();
    } catch (err) {
      console.error(err);
      const backendMsg =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        "No se pudo marcar la orden como NO ENTREGADA.";
      setError(backendMsg);
    } finally {
      setLoadingAccion(false);
    }
  };

  // ---------- MODAL DEVOLUCIÓN (CORREGIDO) ----------
  const abrirModalDevolucion = (orden) => {
    if (!orden) return;

    // 🚨 Aseguramos que 'detalles' exista y sea un array
    const detalles = Array.isArray(orden.detalles) ? orden.detalles : [];

    const lineas = detalles.map((d) => {
      const cantidadOriginal = Number(d.cantidad || 0);
      const cantidadDevueltaBackend = Number(d.cantidad_devolvida || 0);
      const hayDevolucion = !!d.devolucion && cantidadDevueltaBackend > 0;

      return {
        id_detalleo: d.id_detalleo,
        producto: d.producto || d.id_producto_nombre || "Producto",
        cantidadOriginal,
        cantidadDevuelta: hayDevolucion ? cantidadDevueltaBackend : 0,
        selected: hayDevolucion,
      };
    });

    setOrdenDevolucion(orden);
    setLineasDevolucion(lineas);
    setNotaDevolucion("");
    setErrorDevolucion("");
    setModalDevolucionVisible(true);
  };

  const cerrarModalDevolucion = () => {
    setModalDevolucionVisible(false);
    setOrdenDevolucion(null);
    setLineasDevolucion([]);
    setNotaDevolucion("");
    setErrorDevolucion("");
  };

  const confirmarDevolucion = async () => {
    if (!ordenDevolucion) return;

    const seleccionadas = lineasDevolucion.filter(
      (l) => l.selected && l.cantidadDevuelta > 0
    );

    if (!seleccionadas.length) {
      setErrorDevolucion(
        "Selecciona al menos un producto y una cantidad devuelta mayor a 0."
      );
      return;
    }

    for (const l of seleccionadas) {
      if (l.cantidadDevuelta > l.cantidadOriginal) {
        setErrorDevolucion(
          "La cantidad devuelta no puede ser mayor a la cantidad original."
        );
        return;
      }
    }

    const seleccionadasValidas = seleccionadas.filter(
      (l) =>
        l.id_detalleo !== null &&
        l.id_detalleo !== undefined &&
        l.id_detalleo !== ""
    );

    if (seleccionadasValidas.length !== seleccionadas.length) {
      setErrorDevolucion(
        "Hay productos seleccionados sin identificador interno de detalle. Vuelve a cargar la página e inténtalo de nuevo."
      );
      return;
    }

    const devolucionTotal =
      lineasDevolucion.length > 0 &&
      lineasDevolucion.every(
        (l) =>
          l.selected &&
          l.cantidadDevuelta > 0 &&
          l.cantidadDevuelta === l.cantidadOriginal
      );
    const tipoDevolucion = devolucionTotal ? "TOTAL" : "PARCIAL";

    if (!notaDevolucion.trim()) {
      setErrorDevolucion("Escribe una nota explicando la devolución.");
      return;
    }

    const payload = {
      devoluciones: seleccionadasValidas.map((l) => ({
        id_detalleo: l.id_detalleo,
        cantidad_devolvida: l.cantidadDevuelta,
      })),
      nota: notaDevolucion.trim(),
      tipo_devolucion: tipoDevolucion,
    };

    setLoadingAccion(true);
    setErrorDevolucion("");
    setError("");
    setMensaje("");

    try {
      const res = await api.post(
        `base/transporte/${ordenDevolucion.id_orden}/marcar-devuelta/`,
        payload
      );
      setMensaje(
        res.data?.mensaje || "Devolución registrada correctamente en la orden."
      );
      cerrarModalDevolucion();
      await cargarEnvio();
    } catch (err) {
      console.error(err);
      const backendMsg =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        "No se pudo registrar la devolución.";
      setErrorDevolucion(backendMsg);
    } finally {
      setLoadingAccion(false);
    }
  };

  const getBadgeColor = (estado) => {
    if (!estado) return { bg: "#f1f5f9", text: "#64748b" };
    const s = estado.toUpperCase();
    if (s.includes("PREPARADA")) return { bg: "#dbeafe", text: "#1d4ed8" };
    if (s.includes("ENTREGADA")) return { bg: "#dcfce7", text: "#15803d" };
    if (s.includes("DEVUELTA") || s.includes("DEVOLUCION")) {
      return { bg: "#fee2e2", text: "#b91c1c" };
    }
    if (s.includes("NO ENTREGADA"))
      return { bg: "#fef9c3", text: "#854d0e" };
    return { bg: "#e2e8f0", text: "#475569" };
  };

  const estadoEnvio = (envio?.estado || "").toUpperCase();

  // Helper para mostrar botón "Iniciar viaje"
  const puedeIniciarViaje = estadoEnvio === "LISTO_PARA_SALIR";
  const envioAsignadoNoListo = estadoEnvio === "ASIGNADO";

  // 🚨 CORRECCIÓN: Usamos ordenes.length si existen, sino los datos del objeto envio
  const totalOrdenesAsignadas = ordenes.length > 0 
    ? ordenes.length 
    : (envio ? (envio.cantidad_ordenes ?? envio.total_ordenes ?? envio.cantidad_ordenes_total ?? 0) : 0);

  // Capacidad máxima, peso total y porcentaje de capacidad utilizada
  const capacidadMaxima =
    envio && envio.unidad_capacidad != null
      ? Number(envio.unidad_capacidad)
      : null;
  const pesoEnvio =
    envio && envio.peso_total != null ? Number(envio.peso_total) : 0;
  const porcentajeCapacidad =
    capacidadMaxima && capacidadMaxima > 0
      ? Math.min(100, (pesoEnvio / capacidadMaxima) * 100)
      : null;

  // Ordenar por peso y por precio
  const ordenesOrdenadas = useMemo(() => {
    const copia = [...ordenes];
    if (ordenSort === "PESADAS") {
      copia.sort(
        (a, b) => Number(b.peso_total || 0) - Number(a.peso_total || 0)
      );
    } else if (ordenSort === "LIVIANAS") {
      copia.sort(
        (a, b) => Number(a.peso_total || 0) - Number(b.peso_total || 0)
      );
    } else if (ordenSort === "PRECIO_MAYOR") {
      copia.sort(
        (a, b) => Number(b.precio_final || 0) - Number(a.precio_final || 0)
      );
    } else if (ordenSort === "PRECIO_MENOR") {
      copia.sort(
        (a, b) => Number(a.precio_final || 0) - Number(b.precio_final || 0)
      );
    }
    return copia;
  }, [ordenes, ordenSort]);

  // Detectar cuando todas las órdenes están en estado final
  const todasEntregasCompletas = useMemo(() => {
    if (!ordenes || ordenes.length === 0) return false;
    return ordenes.every((o) => {
      const s = (o.estado_de_envio || "").toUpperCase();
      if (s === "ENTREGADA" || s === "NO ENTREGADA") return true;
      if (s.includes("DEVUELTA")) return true;
      if (s.includes("DEVOLUCION")) return true;
      return false;
    });
  }, [ordenes]);

  // --- Abrir Maps con la dirección de la orden ---
  const abrirMapsOrden = (orden) => {
    const direccion =
      orden.direccion || orden.direccion_cliente || orden.cliente_direccion || "";

    if (!direccion.trim()) {
      setError(
        "La orden seleccionada no tiene una dirección válida para abrir en Google Maps."
      );
      setMensaje("");
      return;
    }

    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      direccion
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      style={styles.container}
      className="transportista-container"
    >
      <div style={styles.card} className="transportista-card">
        {/* HEADER */}
        <div style={styles.header}>
          <div style={styles.titleGroup}>
            <div style={styles.iconCircle}>
              <IconTruck />
            </div>
            <div>
              <h2 style={styles.title}>Módulo del Transportista</h2>
              <p style={styles.subtitle}>
                Gestiona tu envío asignado y el estado de cada orden.
              </p>
            </div>
          </div>
        </div>

        {mensaje && (
          <div
            style={{
              padding: "12px",
              background: "#dcfce7",
              color: "#166534",
              borderRadius: "8px",
              marginBottom: "16px",
            }}
          >
            {mensaje}
          </div>
        )}
        {error && (
          <div
            style={{
              padding: "12px",
              background: "#fee2e2",
              color: "#991b1b",
              borderRadius: "8px",
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}

        {loading && (
          <div style={{ padding: 20, textAlign: "center", color: "#64748b" }}>
            Cargando información...
          </div>
        )}

        {!loading && !envio && (
          <div
            style={{
              padding: 24,
              borderRadius: 16,
              backgroundColor: "#f8fafc",
              border: "1px dashed #cbd5e1",
              textAlign: "center",
              color: "#64748b",
            }}
          >
            No tienes un envío asignado actualmente.
          </div>
        )}

        {!loading && envio && (
          <>
            {/* INFO ENVÍO + BOTONES */}
            <div
              style={styles.envioInfo}
              className="transportista-envio-info"
            >
              <div>
                <h3 style={{ margin: 0, color: "#0f172a" }}>
                  Envío #{envio.id_envio}
                </h3>
                <p style={{ margin: "4px 0", color: "#64748b" }}>
                  Unidad asignada:{" "}
                  <strong>
                    {envio.unidad_codigo || envio.unidad || "Sin unidad asignada"}
                  </strong>
                </p>
                <p style={{ margin: "2px 0", color: "#64748b" }}>
                  Placa:{" "}
                  <strong>{envio.unidad || "Sin placa registrada"}</strong>
                </p>
                <p style={{ margin: "2px 0", color: "#64748b" }}>
                  Capacidad máxima:{" "}
                  <strong>
                    {capacidadMaxima !== null
                      ? `${capacidadMaxima.toFixed(2)} kg`
                      : "-"}
                  </strong>
                </p>
                <p style={{ margin: "2px 0", color: "#64748b" }}>
                  Peso total del envío:{" "}
                  <strong>{pesoEnvio.toFixed(2)} kg</strong>
                </p>
                {porcentajeCapacidad !== null && (
                  <div style={{ margin: "4px 0 6px" }}>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#64748b",
                        marginBottom: 2,
                      }}
                    >
                      Uso de capacidad:{" "}
                      <strong>{porcentajeCapacidad.toFixed(1)}%</strong>
                    </div>
                    <div
                      style={{
                        width: "200px",
                        maxWidth: "100%",
                        height: "6px",
                        borderRadius: "999px",
                        backgroundColor: "#e2e8f0",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${porcentajeCapacidad}%`,
                          height: "100%",
                          backgroundColor: "#16a34a",
                        }}
                      ></div>
                    </div>
                  </div>
                )}
                <p style={{ margin: "2px 0", color: "#64748b" }}>
                  Fecha del envío:{" "}
                  <strong>
                    {formatDateOnly(
                      envio.fecha_salida || envio.fecha || envio.fecha_envio
                    )}
                  </strong>
                </p>
                <p style={{ margin: "2px 0", color: "#64748b" }}>
                  Órdenes asignadas:{" "}
                  <strong>{totalOrdenesAsignadas}</strong>
                </p>
                <p style={{ margin: "2px 0", color: "#64748b" }}>
                  Estado actual:{" "}
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 999,
                      backgroundColor: "#e0f2fe",
                      color: "#0369a1",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                  >
                    {envio.estado}
                  </span>
                </p>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {estadoEnvio !== "EN CURSO" && estadoEnvio !== "TERMINADO" && (
                  <button
                    style={{
                      ...styles.btnPrimary,
                      opacity:
                        !puedeIniciarViaje || loadingAccion ? 0.6 : 1,
                      cursor:
                        !puedeIniciarViaje || loadingAccion
                          ? "not-allowed"
                          : "pointer",
                    }}
                    disabled={!puedeIniciarViaje || loadingAccion}
                    onClick={abrirConfirmacionIniciarViaje}
                  >
                    {loadingAccion && confirmConfig?.tipo === "INICIAR"
                      ? "Procesando..."
                      : "Iniciar viaje"}
                  </button>
                )}

                {envio.estado === "EN CURSO" && (
                  <button
                    style={{
                      ...styles.btnPrimary,
                      backgroundColor: "#0f172a",
                    }}
                    disabled={loadingAccion}
                    onClick={abrirConfirmacionFinalizarEnvio}
                  >
                    {loadingAccion && confirmConfig?.tipo === "FINALIZAR"
                      ? "Procesando..."
                      : "Finalizar envío"}
                  </button>
                )}
              </div>
            </div>

            {/* Mensaje específico cuando el envío está ASIGNADO pero aún no LISTO_PARA_SALIR */}
            {envioAsignadoNoListo && (
              <div
                style={{
                  padding: 14,
                  borderRadius: 10,
                  backgroundColor: "#fffbeb",
                  border: "1px solid #facc15",
                  color: "#854d0e",
                  fontSize: "0.9rem",
                  marginBottom: 12,
                }}
              >
                El envío está asignado, pero el almacenista aún no lo ha
                preparado. Podrás iniciar el viaje cuando el envío esté marcado
                como <strong>LISTO_PARA_SALIR</strong>.
              </div>
            )}

            {/* MENSAJE BLOQUEO SI AÚN NO HA INICIADO */}
            {envio.estado !== "EN CURSO" && (
              <div
                style={{
                  padding: 20,
                  borderRadius: 12,
                  border: "1px dashed #cbd5e1",
                  backgroundColor: "#f1f5f9",
                  color: "#475569",
                  fontSize: "0.9rem",
                }}
              >
                Para ver y gestionar las órdenes de este envío, primero debes
                pulsar <strong>"Iniciar viaje"</strong> (cuando el envío esté
                listo para salir).
              </div>
            )}

            {/* MENSAJE CUANDO TODAS LAS ENTREGAS ESTÁN COMPLETAS */}
            {envio.estado === "EN CURSO" &&
              ordenes.length > 0 &&
              todasEntregasCompletas && (
                <div
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    backgroundColor: "#ecfdf5",
                    border: "1px solid #bbf7d0",
                    color: "#166534",
                    fontSize: "0.9rem",
                    marginBottom: 12,
                  }}
                >
                  Ya completaste todas tus entregas de este viaje, puedes
                  finalizar el envío.
                </div>
              )}

            {/* FILTROS + ÓRDENES SOLO CUANDO ESTÁ EN CURSO */}
            {envio.estado === "EN CURSO" && (
              <>
                {/* FILTROS */}
                <div style={styles.filtersWrapper}>
                  <div style={styles.filtersGrid}>
                    <div>
                      <label style={styles.label}>Buscar</label>
                      <input
                        type="text"
                        style={styles.input}
                        placeholder="Cliente o dirección..."
                        value={filtroTexto}
                        onChange={(e) => setFiltroTexto(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={styles.label}>Ordenar por</label>
                      <select
                        style={styles.select}
                        value={ordenSort}
                        onChange={(e) => setOrdenSort(e.target.value)}
                      >
                        <option value="">Sin orden especial</option>
                        <option value="PESADAS">Más pesadas primero</option>
                        <option value="LIVIANAS">Más livianas primero</option>
                        <option value="PRECIO_MAYOR">
                          Mayor precio primero
                        </option>
                        <option value="PRECIO_MENOR">
                          Menor precio primero
                        </option>
                      </select>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: "10px",
                      marginTop: "15px",
                      flexWrap: "wrap",
                    }}
                  >
                    <button style={styles.btnGhost} onClick={limpiarFiltros}>
                      <IconRefresh /> Limpiar
                    </button>
                    <button
                      style={styles.btnPrimary}
                      onClick={aplicarFiltros}
                      disabled={loading}
                    >
                      <IconSearch /> {loading ? "Buscando..." : "Aplicar"}
                    </button>
                  </div>
                </div>

                {/* LISTADO ÓRDENES */}
                <div
                  style={styles.content}
                  className="transportista-orders"
                >
                  {ordenesOrdenadas.length === 0 ? (
                    <div
                      style={{
                        padding: 32,
                        textAlign: "center",
                        color: "#94a3b8",
                      }}
                    >
                      No hay órdenes en este envío con los filtros actuales.
                    </div>
                  ) : (
                    <div
                      style={{ display: "grid", gap: 12, padding: 16 }}
                      className="transportista-orders-grid"
                    >
                      {ordenesOrdenadas.map((o) => {
                        const badge = getBadgeColor(o.estado_de_envio);
                        const isSelected =
                          ordenSeleccionada &&
                          ordenSeleccionada.id_orden === o.id_orden;
                        const telefonoCliente =
                          o.telefono_cliente ||
                          o.telefono ||
                          o.cliente_telefono ||
                          "Sin teléfono registrado";
                        const rifCliente =
                          o.rif_cedula ||
                          o.cliente_rif_cedula ||
                          o.id_cliente_rif_cedula ||
                          o.rif ||
                          "Sin RIF / Cédula";

                        return (
                          <div
                            key={o.id_orden}
                            style={{
                              borderRadius: 12,
                              border: "1px solid #e2e8f0",
                              padding: 14,
                              backgroundColor: isSelected
                                ? "#eff6ff"
                                : "#ffffff",
                              cursor: "pointer",
                              transition: "background 0.2s, box-shadow 0.2s",
                              boxShadow: isSelected
                                ? "0 6px 18px rgba(37,99,235,0.15)"
                                : "0 1px 3px rgba(15,23,42,0.08)",
                            }}
                            onClick={() =>
                              setOrdenSeleccionada(isSelected ? null : o)
                            }
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 8,
                                marginBottom: 6,
                              }}
                            >
                              <div style={{ minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: "0.8rem",
                                    color: "#64748b",
                                  }}
                                >
                                  Orden #{o.id_orden}
                                </div>
                                <div
                                  style={{
                                    fontSize: "1rem",
                                    fontWeight: 600,
                                    color: "#0f172a",
                                    wordBreak: "break-word",
                                  }}
                                >
                                  {o.cliente}
                                </div>
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "flex-end",
                                  gap: 6,
                                }}
                              >
                                <div
                                  style={{
                                    padding: "4px 10px",
                                    borderRadius: 999,
                                    backgroundColor: badge.bg,
                                    color: badge.text,
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                    textTransform: "uppercase",
                                    textAlign: "right",
                                  }}
                                >
                                  {o.estado_de_envio}
                                </div>
                                {/* Botón Maps */}
                                <button
                                  type="button"
                                  style={{
                                    ...styles.btnSmall,
                                    backgroundColor: "#eff6ff",
                                    borderColor: "#3b82f6",
                                    color: "#1d4ed8",
                                    display: "inline-flex",
                                    alignItems: "center",
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    abrirMapsOrden(o);
                                  }}
                                >
                                  <IconMap />
                                  Ver en Maps
                                </button>
                              </div>
                            </div>

                            <div
                              style={{
                                fontSize: "0.85rem",
                                color: "#64748b",
                                marginBottom: 4,
                              }}
                            >
                              Dirección:{" "}
                              <span style={{ color: "#0f172a" }}>
                                {o.direccion || "Sin dirección registrada"}
                              </span>
                            </div>

                            <div
                              style={{
                                fontSize: "0.85rem",
                                color: "#64748b",
                                marginBottom: 4,
                              }}
                            >
                              Monto total:{" "}
                              <strong style={{ color: "#0f172a" }}>
                                $ {Number(o.precio_final || 0).toFixed(2)}
                              </strong>{" "}
                              · Peso:{" "}
                              <strong style={{ color: "#0f172a" }}>
                                {Number(o.peso_total || 0).toFixed(2)} kg
                              </strong>
                            </div>

                            {/* ACCIONES */}
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 8,
                                marginTop: 8,
                              }}
                            >
                              <button
                                style={{
                                  ...styles.btnSmall,
                                  backgroundColor: "#ecfdf5",
                                  borderColor: "#22c55e",
                                  color: "#166534",
                                }}
                                disabled={loadingAccion}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  marcarEntregada(o);
                                }}
                              >
                                Marcar entregada
                              </button>
                              <button
                                style={{
                                  ...styles.btnSmall,
                                  backgroundColor: "#fef9c3",
                                  borderColor: "#facc15",
                                  color: "#854d0e",
                                }}
                                disabled={loadingAccion}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  marcarNoEntregada(o);
                                }}
                              >
                                No entregada
                              </button>
                              <button
                                style={{
                                  ...styles.btnSmall,
                                  backgroundColor: "#fee2e2",
                                  borderColor: "#ef4444",
                                  color: "#b91c1c",
                                }}
                                disabled={loadingAccion}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  abrirModalDevolucion(o);
                                }}
                              >
                                Devolución
                              </button>
                            </div>

                            {/* Bloque expandido: info cliente + productos */}
                            {isSelected && (
                              <div
                                style={{
                                  marginTop: 10,
                                  paddingTop: 10,
                                  borderTop: "1px dashed #e2e8f0",
                                }}
                              >
                                {/* Info cliente */}
                                <div
                                  style={{
                                    fontSize: "0.8rem",
                                    color: "#64748b",
                                    marginBottom: 6,
                                  }}
                                >
                                  Información del cliente:
                                </div>
                                <div
                                  style={{
                                    fontSize: "0.82rem",
                                    color: "#0f172a",
                                    marginBottom: 2,
                                  }}
                                >
                                  <strong>Nombre:</strong> {o.cliente}
                                </div>
                                <div
                                  style={{
                                    fontSize: "0.82rem",
                                    color: "#0f172a",
                                    marginBottom: 2,
                                  }}
                                >
                                  <strong>RIF / Cédula:</strong> {rifCliente}
                                </div>
                                <div
                                  style={{
                                    fontSize: "0.82rem",
                                    color: "#0f172a",
                                    marginBottom: 2,
                                  }}
                                >
                                  <strong>Dirección:</strong>{" "}
                                  {o.direccion || "Sin dirección registrada"}
                                </div>
                                <div
                                  style={{
                                    fontSize: "0.82rem",
                                    color: "#0f172a",
                                    marginBottom: 8,
                                  }}
                                >
                                  <strong>Teléfono:</strong> {telefonoCliente}
                                </div>

                                {/* Detalle de productos */}
                                <div
                                  style={{
                                    fontSize: "0.8rem",
                                    color: "#64748b",
                                    marginBottom: 4,
                                  }}
                                >
                                  Productos en esta orden:
                                </div>

                                {o.detalles && o.detalles.length > 0 ? (
                                  <table
                                    style={{
                                      width: "100%",
                                      borderCollapse: "collapse",
                                      fontSize: "0.8rem",
                                    }}
                                  >
                                    <thead>
                                      <tr
                                        style={{
                                          borderBottom: "1px solid #e2e8f0",
                                        }}
                                      >
                                        <th
                                          style={{
                                            textAlign: "left",
                                            paddingBottom: 4,
                                            color: "#475569",
                                          }}
                                        >
                                          Producto
                                        </th>
                                        {/* ✅ NUEVA COLUMNA DATOS (MARCA/SKU) */}
                                        <th
                                          style={{
                                            textAlign: "left",
                                            paddingBottom: 4,
                                            color: "#475569",
                                          }}
                                        >
                                          Datos
                                        </th>
                                        <th
                                          style={{
                                            textAlign: "center",
                                            paddingBottom: 4,
                                            color: "#475569",
                                          }}
                                        >
                                          Cant.
                                        </th>
                                        <th
                                          style={{
                                            textAlign: "right",
                                            paddingBottom: 4,
                                            color: "#475569",
                                          }}
                                        >
                                          Peso
                                        </th>
                                        <th
                                          style={{
                                            textAlign: "right",
                                            paddingBottom: 4,
                                            color: "#475569",
                                          }}
                                        >
                                          Subtotal
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {o.detalles.map((d, idx) => (
                                        <tr key={idx}>
                                          <td
                                            style={{
                                              padding: "4px 0",
                                              color: "#0f172a",
                                            }}
                                          >
                                            {d.producto}
                                          </td>
                                          {/* ✅ NUEVA CELDA CON MARCA Y SKU */}
                                          <td
                                            style={{
                                              padding: "4px 0",
                                              fontSize: "0.75rem",
                                              color: "#64748b",
                                            }}
                                          >
                                            {d.marca_nombre && (
                                              <div>Marca: {d.marca_nombre}</div>
                                            )}
                                            {d.sku && (
                                              <div style={{ fontFamily: "monospace" }}>
                                                SKU: {d.sku}
                                              </div>
                                            )}
                                          </td>
                                          <td
                                            style={{
                                              padding: "4px 0",
                                              textAlign: "center",
                                              color: "#0f172a",
                                            }}
                                          >
                                            {d.cantidad}
                                          </td>
                                          <td
                                            style={{
                                              padding: "4px 0",
                                              textAlign: "right",
                                              color: "#0f172a",
                                            }}
                                          >
                                            {Number(d.peso || 0).toFixed(2)} kg
                                          </td>
                                          <td
                                            style={{
                                              padding: "4px 0",
                                              textAlign: "right",
                                              color: "#0f172a",
                                            }}
                                          >
                                            ${" "}
                                            {Number(
                                              d.subtotal || 0
                                            ).toFixed(2)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                ) : (
                                  <div
                                    style={{
                                      fontSize: "0.8rem",
                                      color: "#94a3b8",
                                      marginTop: 4,
                                    }}
                                  >
                                    No hay productos para mostrar.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* MODAL DEVOLUCIÓN */}
            {modalDevolucionVisible && ordenDevolucion && (
              <div style={styles.modalOverlay}>
                <div style={styles.modal}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 10,
                      paddingBottom: 8,
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    <div>
                      <h3 style={{ marginTop: 0, marginBottom: 4 }}>
                        Registrar devolución · Orden #{ordenDevolucion.id_orden}
                      </h3>
                      <p
                        style={{
                          fontSize: "0.85rem",
                          color: "#64748b",
                          margin: 0,
                        }}
                      >
                        Marca los productos devueltos, indica la cantidad
                        devuelta de cada uno y escribe una nota explicativa.
                      </p>
                    </div>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        padding: "4px 10px",
                        borderRadius: 999,
                        backgroundColor: "#eff6ff",
                        color: "#1d4ed8",
                        fontWeight: 600,
                      }}
                    >
                      Monto actual: $
                      {Number(ordenDevolucion.precio_final || 0).toFixed(2)}
                    </span>
                  </div>

                  <div
                    style={{
                      marginBottom: 10,
                      padding: "8px 10px",
                      borderRadius: 10,
                      backgroundColor: "#f9fafb",
                      border: "1px solid #e5e7eb",
                      fontSize: "0.8rem",
                      color: "#475569",
                    }}
                  >
                    Las cantidades devueltas se restarán del monto de la orden y
                    los productos volverán automáticamente al inventario,
                    respetando sus lotes.
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.75rem",
                      color: "#64748b",
                      textTransform: "uppercase",
                      marginBottom: 4,
                    }}
                  >
                    <span>Producto</span>
                    <span style={{ marginRight: 4 }}>Cant. devuelta</span>
                  </div>

                  <div
                    style={{
                      maxHeight: "260px",
                      overflowY: "auto",
                      marginBottom: 12,
                      paddingRight: 4,
                      borderRadius: 10,
                      border: "1px solid #e5e7eb",
                      backgroundColor: "#ffffff",
                    }}
                  >
                    {lineasDevolucion.length === 0 && (
                      <div
                        style={{
                          fontSize: "0.85rem",
                          color: "#94a3b8",
                          padding: 12,
                        }}
                      >
                        Esta orden no tiene productos para devolución.
                      </div>
                    )}

                    {lineasDevolucion.map((l, idx) => (
                      <div
                        key={l.id_detalleo || idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 10,
                          padding: "8px 10px",
                          borderBottom:
                            idx === lineasDevolucion.length - 1
                              ? "none"
                              : "1px solid #e5e7eb",
                          backgroundColor: l.selected
                            ? "#fef2f2"
                            : "transparent",
                        }}
                      >
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flex: 1,
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            color: "#0f172a",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={l.selected}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setLineasDevolucion((prev) =>
                                prev.map((x, i) =>
                                  i === idx
                                    ? {
                                        ...x,
                                        selected: checked,
                                        cantidadDevuelta:
                                          checked &&
                                          x.cantidadDevuelta === 0
                                            ? x.cantidadOriginal
                                            : x.cantidadDevuelta,
                                      }
                                    : x
                                )
                              );
                            }}
                          />
                          <span>
                            {l.producto}{" "}
                            <span
                              style={{
                                fontSize: "0.78rem",
                                color: "#64748b",
                                marginLeft: 4,
                              }}
                            >
                              (Cant. original: {l.cantidadOriginal})
                            </span>
                          </span>
                        </label>

                        <input
                          type="number"
                          min={0}
                          max={l.cantidadOriginal}
                          value={l.cantidadDevuelta}
                          disabled={!l.selected}
                          onChange={(e) => {
                            let value = Number(e.target.value || 0);
                            if (value < 0) value = 0;
                            if (value > l.cantidadOriginal) {
                              value = l.cantidadOriginal;
                            }
                            setLineasDevolucion((prev) =>
                              prev.map((x, i) =>
                                i === idx
                                  ? { ...x, cantidadDevuelta: value }
                                  : x
                              )
                            );
                          }}
                          style={{
                            width: "90px",
                            height: "32px",
                            borderRadius: 8,
                            border: "1px solid #cbd5e1",
                            fontSize: "0.85rem",
                            padding: "0 8px",
                            textAlign: "right",
                            backgroundColor: l.selected
                              ? "#ffffff"
                              : "#f1f5f9",
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 10,
                      fontSize: "0.8rem",
                      color: "#64748b",
                    }}
                  >
                    <button
                      type="button"
                      style={{
                        ...styles.btnGhost,
                        padding: "6px 12px",
                        fontSize: "0.78rem",
                      }}
                      onClick={() =>
                        setLineasDevolucion((prev) =>
                          prev.map((l) => ({
                            ...l,
                            selected: true,
                            cantidadDevuelta: l.cantidadOriginal,
                          }))
                        )
                      }
                      disabled={loadingAccion || lineasDevolucion.length === 0}
                    >
                      Marcar toda la orden como devuelta
                    </button>

                    <div>
                      Unidades devueltas seleccionadas:{" "}
                      <strong>
                        {lineasDevolucion.reduce(
                          (acc, l) =>
                            acc +
                            (l.selected && l.cantidadDevuelta
                              ? l.cantidadDevuelta
                              : 0),
                          0
                        )}
                      </strong>
                    </div>
                  </div>

                  <label
                    style={{
                      ...styles.label,
                      marginTop: 4,
                      marginBottom: 4,
                    }}
                  >
                    Nota de devolución
                  </label>
                  <textarea
                    style={{
                      width: "100%",
                      minHeight: "80px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      padding: 10,
                      fontSize: "0.9rem",
                      resize: "vertical",
                      outline: "none",
                    }}
                    value={notaDevolucion}
                    onChange={(e) => setNotaDevolucion(e.target.value)}
                    placeholder="Ejemplo: Cliente devolvió parcialmente la mercancía por producto defectuoso..."
                  />

                  {errorDevolucion && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: 8,
                        backgroundColor: "#fee2e2",
                        color: "#991b1b",
                        borderRadius: 6,
                        fontSize: "0.8rem",
                      }}
                    >
                      {errorDevolucion}
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 8,
                      marginTop: 16,
                      paddingTop: 10,
                      borderTop: "1px solid #e5e7eb",
                    }}
                  >
                    <button
                      style={styles.btnGhost}
                      onClick={cerrarModalDevolucion}
                      disabled={loadingAccion}
                    >
                      Cancelar
                    </button>
                    <button
                      style={styles.btnPrimary}
                      onClick={confirmarDevolucion}
                      disabled={loadingAccion}
                    >
                      {loadingAccion ? "Procesando..." : "Confirmar devolución"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL CONFIRMACIÓN INICIAR / FINALIZAR */}
            {confirmConfig && (
              <div style={styles.modalOverlay}>
                <div style={styles.confirmModal}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 12,
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "1.05rem",
                          color: "#0f172a",
                        }}
                      >
                        {confirmConfig.titulo}
                      </h3>
                      <p
                        style={{
                          margin: "6px 0 0",
                          fontSize: "0.9rem",
                          color: "#475569",
                        }}
                      >
                        {confirmConfig.mensaje}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={cerrarConfirmacion}
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: "1rem",
                        color: "#94a3b8",
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 8,
                      marginTop: 18,
                    }}
                  >
                    <button
                      type="button"
                      style={{
                        ...styles.btnGhost,
                        padding: "8px 16px",
                      }}
                      onClick={cerrarConfirmacion}
                      disabled={loadingAccion}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      style={{
                        ...styles.btnPrimary,
                        padding: "8px 18px",
                      }}
                      onClick={ejecutarConfirmacion}
                      disabled={loadingAccion}
                    >
                      {loadingAccion ? "Procesando..." : "Confirmar"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "24px 32px",
    maxWidth: "1200px",
    margin: "0 auto",
    fontFamily: "'Inter', sans-serif",
  },
  card: {},
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  titleGroup: { display: "flex", alignItems: "center", gap: "16px" },
  iconCircle: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    backgroundColor: "#e0f2fe",
    color: "#0284c7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    margin: 0,
    fontSize: "1.5rem",
    color: "#0f172a",
    fontWeight: "700",
  },
  subtitle: { margin: "4px 0 0", color: "#64748b", fontSize: "0.9rem" },

  filtersWrapper: {
    backgroundColor: "#f8fafc",
    padding: "16px",
    borderRadius: "16px",
    marginBottom: "18px",
    border: "1px solid #e2e8f0",
  },
  filtersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
  },
  label: {
    display: "block",
    fontSize: "0.75rem",
    fontWeight: "700",
    color: "#475569",
    marginBottom: "4px",
    textTransform: "uppercase",
  },
  input: {
    width: "100%",
    height: "40px",
    padding: "0 12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "0.9rem",
    outline: "none",
    backgroundColor: "#fff",
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    height: "40px",
    padding: "0 12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "0.9rem",
    outline: "none",
    backgroundColor: "#fff",
    boxSizing: "border-box",
  },

  btnPrimary: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    backgroundColor: "#16a34a",
    color: "white",
    border: "none",
    borderRadius: "999px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  btnGhost: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    backgroundColor: "white",
    color: "#64748b",
    border: "1px solid #cbd5e1",
    borderRadius: "999px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  content: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    marginTop: "12px",
    marginBottom: "20px",
  },
  envioInfo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    padding: 16,
    borderRadius: 16,
    border: "1px solid #e2e8f0",
    backgroundColor: "#f9fafb",
    marginBottom: 16,
  },
  btnSmall: {
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "0.75rem",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "transparent",
  },

  // MODAL
  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 12000,
    padding: "16px",
  },
  modal: {
    width: "100%",
    maxWidth: "520px",
    maxHeight: "80vh",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "20px 24px 18px",
    boxShadow: "0 20px 40px rgba(15, 23, 42, 0.3)",
    border: "1px solid #e2e8f0",
    overflowY: "auto",
  },
  confirmModal: {
    width: "100%",
    maxWidth: "420px",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "18px 22px 16px",
    boxShadow: "0 20px 40px rgba(15, 23, 42, 0.3)",
    border: "1px solid #e2e8f0",
  },
};

// --- Estilos responsive (móvil / tablet / desktop) ---
if (
  typeof document !== "undefined" &&
  !document.getElementById("transportista-responsive-styles")
) {
  const styleTag = document.createElement("style");
  styleTag.id = "transportista-responsive-styles";
  styleTag.innerHTML = `
    @media (max-width: 768px) {
      .transportista-container {
        padding: 16px 12px;
      }
      .transportista-envio-info {
        flex-direction: column;
        align-items: flex-start;
      }
      .transportista-envio-info > div:last-child {
        width: 100%;
        display: flex;
        justify-content: flex-start;
        margin-top: 12px;
      }
      .transportista-envio-info button {
        flex: 1 1 auto;
        justify-content: center;
      }
      .transportista-orders {
        margin-top: 16px;
      }
      .transportista-orders-grid {
        padding: 10px;
      }
    }

    @media (min-width: 769px) and (max-width: 1024px) {
      .transportista-container {
        padding: 20px 20px;
      }
    }
  `;
  document.head.appendChild(styleTag);
}