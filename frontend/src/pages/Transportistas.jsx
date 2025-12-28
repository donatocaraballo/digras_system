// frontend/src/pages/Transportistas.jsx

import React, { useEffect, useState } from "react";
import api from "../api/api";

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
    <rect x="1" y="3" width="15" height="13" rx="2" ry="2" />
    <path d="M16 8h4l3 3v5h-7z" />
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
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
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
    <polyline points="23 4 23 10 17 10"></polyline>
    <polyline points="1 20 1 14 7 14"></polyline>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
  </svg>
);

export default function TransporteEnvio() {
  const [envio, setEnvio] = useState(null);
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAccion, setLoadingAccion] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  // filtros
  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  // orden seleccionada
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);

  // modal nota (no entrega / devolución)
  const [modalNotaVisible, setModalNotaVisible] = useState(false);
  const [tipoAccionNota, setTipoAccionNota] = useState(null); // "NO_ENTREGADA" | "DEVUELTA"
  const [nota, setNota] = useState("");
  const [modalError, setModalError] = useState("");

  const cargarOrdenes = async () => {
    try {
      const params = {};
      if (filtroTexto) params.q = filtroTexto;
      if (filtroEstado) params.estado = filtroEstado;

      const res = await api.get("base/transporte/mi-envio/ordenes/", { params });
      setOrdenes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las órdenes del envío.");
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

        // 👇 SOLO cargamos órdenes si el envío ya está EN CURSO
        if (res.data.estado === "EN CURSO") {
          await cargarOrdenes();
        } else {
          setOrdenes([]);
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
      // ya se maneja en cargarOrdenes
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltroTexto("");
    setFiltroEstado("");
    setMensaje("");
    setError("");
    cargarOrdenes();
  };

  const iniciarViaje = async () => {
    if (!envio) return;
    setLoadingAccion(true);
    setError("");
    setMensaje("");
    try {
      const res = await api.post("base/transporte/mi-envio/iniciar-viaje/");
      setMensaje(res.data?.mensaje || "Viaje iniciado.");
      // 👇 Volvemos a cargar envío; ahora debería estar EN CURSO y se cargarán las órdenes
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
    if (
      !window.confirm(
        "¿Seguro que deseas marcar el envío como TERMINADO? Esto requiere que todas las órdenes estén ENTREGADAS, DEVUELTAS o NO ENTREGADAS."
      )
    ) {
      return;
    }
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

  const abrirModalNota = (orden, tipoAccion) => {
    setOrdenSeleccionada(orden);
    setTipoAccionNota(tipoAccion); // "NO_ENTREGADA" o "DEVUELTA"
    setNota("");
    setModalError("");
    setModalNotaVisible(true);
  };

  const cerrarModalNota = () => {
    setModalNotaVisible(false);
    setOrdenSeleccionada(null);
    setTipoAccionNota(null);
    setNota("");
    setModalError("");
  };

  const confirmarAccionConNota = async () => {
    if (!ordenSeleccionada || !tipoAccionNota) return;
    if (!nota.trim()) {
      setModalError("Debes escribir una nota explicando la situación.");
      return;
    }

    setLoadingAccion(true);
    setModalError("");
    setError("");
    setMensaje("");

    let endpoint = "";
    if (tipoAccionNota === "NO_ENTREGADA") {
      endpoint = `base/transporte/${ordenSeleccionada.id_orden}/marcar-no-entregada/`;
    } else if (tipoAccionNota === "DEVUELTA") {
      endpoint = `base/transporte/${ordenSeleccionada.id_orden}/marcar-devuelta/`;
    }

    try {
      const res = await api.post(endpoint, { nota });
      setMensaje(res.data?.mensaje || "Acción aplicada correctamente.");
      cerrarModalNota();
      await cargarOrdenes();
    } catch (err) {
      console.error(err);
      const backendMsg =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        "No se pudo aplicar la acción.";
      setModalError(backendMsg);
    } finally {
      setLoadingAccion(false);
    }
  };

  const getBadgeColor = (estado) => {
    if (!estado) return { bg: "#f1f5f9", text: "#64748b" };
    const s = estado.toUpperCase();
    if (s.includes("PREPARADA")) return { bg: "#dbeafe", text: "#1d4ed8" };
    if (s.includes("ENTREGADA")) return { bg: "#dcfce7", text: "#15803d" };
    if (s.includes("DEVUELTA")) return { bg: "#fee2e2", text: "#b91c1c" };
    if (s.includes("NO ENTREGADA"))
      return { bg: "#fef9c3", text: "#854d0e" };
    return { bg: "#e2e8f0", text: "#475569" };
  };

  // Helper for mostrar botón "Iniciar viaje"
  const puedeIniciarViaje = envio && envio.estado !== "EN CURSO" && envio.estado !== "TERMINADO";
  console.log("[Transportistas] Estado del envío:", envio?.estado);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
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
            <div style={styles.envioInfo}>
              <div>
                <h3 style={{ margin: 0, color: "#0f172a" }}>
                  Envío #{envio.id_envio}
                </h3>
                <p style={{ margin: "4px 0", color: "#64748b" }}>
                  Unidad asignada:{" "}
                  <strong>{envio.unidad || "Sin placa registrada"}</strong>
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

              <div style={{ display: "flex", gap: 10 }}>
                {puedeIniciarViaje && (
                  <button
                    style={styles.btnPrimary}
                    disabled={loadingAccion}
                    onClick={iniciarViaje}
                  >
                    {loadingAccion ? "Procesando..." : "Iniciar viaje"}
                  </button>
                )}

                {envio.estado === "EN CURSO" && (
                  <button
                    style={{
                      ...styles.btnPrimary,
                      backgroundColor: "#0f172a",
                    }}
                    disabled={loadingAccion}
                    onClick={finalizarEnvio}
                  >
                    {loadingAccion ? "Procesando..." : "Finalizar envío"}
                  </button>
                )}
              </div>
            </div>

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
                pulsar <strong>"Iniciar viaje"</strong>.
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
                      <label style={styles.label}>Estado de la orden</label>
                      <select
                        style={styles.select}
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                      >
                        <option value="">Todos</option>
                        <option value="PREPARADA">Preparada</option>
                        <option value="ENTREGADA">Entregada</option>
                        <option value="NO ENTREGADA">No entregada</option>
                        <option value="DEVUELTA">Devuelta</option>
                      </select>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: "10px",
                      marginTop: "15px",
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
                <div style={styles.content}>
                  {ordenes.length === 0 ? (
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
                    <div style={{ display: "grid", gap: 12, padding: 16 }}>
                      {ordenes.map((o) => {
                        const badge = getBadgeColor(o.estado_de_envio);
                        const isSelected =
                          ordenSeleccionada &&
                          ordenSeleccionada.id_orden === o.id_orden;
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
                                marginBottom: 6,
                              }}
                            >
                              <div>
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
                                  }}
                                >
                                  {o.cliente}
                                </div>
                              </div>
                              <div
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: 999,
                                  backgroundColor: badge.bg,
                                  color: badge.text,
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                }}
                              >
                                {o.estado_de_envio}
                              </div>
                            </div>

                            <div
                              style={{
                                fontSize: "0.85rem",
                                color: "#64748b",
                                marginBottom: 8,
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
                                marginBottom: 8,
                              }}
                            >
                              Monto total:{" "}
                              <strong style={{ color: "#0f172a" }}>
                                Bs {Number(o.precio_final || 0).toFixed(2)}
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
                                  abrirModalNota(o, "NO_ENTREGADA");
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
                                  abrirModalNota(o, "DEVUELTA");
                                }}
                              >
                                Devolución
                              </button>
                            </div>

                            {/* Detalles productos si está seleccionada */}
                            {isSelected &&
                              o.detalles &&
                              o.detalles.length > 0 && (
                                <div
                                  style={{
                                    marginTop: 10,
                                    paddingTop: 10,
                                    borderTop: "1px dashed #e2e8f0",
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: "0.8rem",
                                      color: "#64748b",
                                      marginBottom: 4,
                                    }}
                                  >
                                    Productos en esta orden:
                                  </div>
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
                                          borderBottom:
                                            "1px solid #e2e8f0",
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
                                            Bs{" "}
                                            {Number(
                                              d.subtotal || 0
                                            ).toFixed(2)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
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

            {/* MODAL NOTA */}
            {modalNotaVisible && ordenSeleccionada && (
              <div style={styles.modalOverlay}>
                <div style={styles.modal}>
                  <h3 style={{ marginTop: 0, marginBottom: 10 }}>
                    {tipoAccionNota === "NO_ENTREGADA"
                      ? `Marcar orden #${ordenSeleccionada.id_orden} como NO ENTREGADA`
                      : `Marcar orden #${ordenSeleccionada.id_orden} como DEVUELTA`}
                  </h3>
                  <p
                    style={{
                      fontSize: "0.9rem",
                      color: "#64748b",
                      marginBottom: 12,
                    }}
                  >
                    Escribe una nota explicando la situación. Esta información
                    quedará registrada en el sistema.
                  </p>

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
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    placeholder="Ejemplo: Cliente no se encontraba en la dirección..."
                  />

                  {modalError && (
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
                      {modalError}
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 8,
                      marginTop: 16,
                    }}
                  >
                    <button
                      style={styles.btnGhost}
                      onClick={cerrarModalNota}
                      disabled={loadingAccion}
                    >
                      Cancelar
                    </button>
                    <button
                      style={styles.btnPrimary}
                      onClick={confirmarAccionConNota}
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
    zIndex: 50,
  },
  modal: {
    width: "100%",
    maxWidth: "460px",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "20px 24px 18px",
    boxShadow: "0 20px 40px rgba(15, 23, 42, 0.3)",
    border: "1px solid #e2e8f0",
  },
};