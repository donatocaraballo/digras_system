// frontend/src/pages/PreparacionOrdenes.jsx

import React, { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import api from "../api/api";
import { toast } from "react-hot-toast";

const styles = {
  pageTitle: {
    fontSize: "22px",
    fontWeight: 600,
    marginBottom: "4px",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: "13px",
    color: "#6b7280",
    marginBottom: "16px",
  },
  statusTextError: {
    fontSize: "13px",
    color: "#b91c1c",
    marginBottom: "8px",
  },
  statusTextOk: {
    fontSize: "13px",
    color: "#15803d",
    marginBottom: "8px",
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
    fontSize: "13px",
  },
  th: {
    background: "#f3f4f6",
    textAlign: "left",
    padding: "8px 10px",
    borderBottom: "1px solid #e5e7eb",
    color: "#4b5563",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  td: {
    padding: "8px 10px",
    borderBottom: "1px solid #e5e7eb",
    color: "#111827",
    verticalAlign: "top",
  },
  rowAlt: {
    background: "#f9fafb",
  },
  buttonPrimary: {
    border: "none",
    borderRadius: "999px",
    padding: "6px 14px",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 500,
  },
  buttonSecondary: {
    borderRadius: "999px",
    padding: "6px 12px",
    background: "#ffffff",
    border: "1px solid #d1d5db",
    color: "#374151",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 500,
  },
  badgeEstado: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 600,
    background: "#e0f2fe",
    color: "#0369a1",
  },
  resumenResultados: {
    fontSize: "12px",
    color: "#6b7280",
    marginTop: "8px",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: 600,
    marginTop: "24px",
    marginBottom: "4px",
    color: "#111827",
  },
  sectionSubtitle: {
    fontSize: "13px",
    color: "#6b7280",
    marginBottom: "10px",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(15,23,42,0.45)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 50,
  },
  modalCard: {
    width: "100%",
    maxWidth: "700px",
    maxHeight: "80vh",
    background: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 20px 50px rgba(15,23,42,0.25)",
    padding: "18px 20px 20px",
    boxSizing: "border-box",
    overflowY: "auto",
  },
  modalHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px",
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#111827",
  },
  modalCloseButton: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "16px",
    color: "#6b7280",
  },
  modalSectionTitle: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#4b5563",
    marginTop: "10px",
    marginBottom: "4px",
  },
  modalLine: {
    fontSize: "13px",
    marginBottom: "2px",
  },
  modalDetalleTable: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "4px",
    fontSize: "13px",
  },
  modalDetalleTh: {
    background: "#e5e7eb",
    padding: "6px 8px",
    borderBottom: "1px solid #d1d5db",
    textAlign: "left",
    fontWeight: 600,
  },
  modalDetalleTd: {
    padding: "6px 8px",
    borderBottom: "1px solid #e5e7eb",
  },
  modalActionsRow: {
    marginTop: "12px",
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
  },
};

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
    // backend sugerido: campo unidad_codigo
    if (envio.unidad_codigo) return envio.unidad_codigo;
    if (envio.unidad_placa) return envio.unidad_placa;
    if (envio.id_unidad) return `Unidad #${envio.id_unidad}`;
    return "Unidad no especificada";
  };

  // ============================
  // Cargas iniciales (clientes, vendedores, órdenes, envíos)
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
        setError(
          "No tienes permiso para acceder a este módulo. Solo los usuarios de tipo ALMACENISTA pueden preparar órdenes."
        );
      } else {
        const backendMsg =
          err.response?.data?.error || err.response?.data?.detail;
        setError(
          backendMsg || "No se pudieron cargar las órdenes para preparar."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const cargarEnvios = async () => {
    setLoadingEnvios(true);
    setErrorEnvios("");
    try {
      // Endpoint sugerido en backend: @action(detail=False, url_path="para_verificar")
      const res = await api.get("/base/envios/para_verificar/");
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setEnvios(data);
    } catch (err) {
      console.error("Error cargando envíos para verificar:", err);
      if (err.response?.status === 403) {
        setErrorEnvios(
          "No tienes permiso para ver los envíos para verificar."
        );
      } else {
        const backendMsg =
          err.response?.data?.error || err.response?.data?.detail;
        setErrorEnvios(
          backendMsg || "No se pudieron cargar los envíos para verificar."
        );
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
      const backendMsg =
        err.response?.data?.error || err.response?.data?.detail;
      setErrorDetalle(
        backendMsg || "No se pudieron cargar los detalles de esta orden."
      );
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
  // Acciones ORDEN: marcar PREPARADA
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
      const backendMsg =
        err.response?.data?.error || err.response?.data?.detail;
      toast.error(
        backendMsg || "No se pudo marcar la orden como PREPARADA."
      );
    } finally {
      setAccionLoading(false);
    }
  };

  // ============================
  // Acciones ORDEN: notificar preparación
  // ============================
  const notificarPreparacion = async () => {
    if (!ordenDetalle) return;
    const id = ordenDetalle.orden?.id_orden;

    setAccionLoading(true);
    try {
      const res = await api.post(`/ordenes/${id}/notificar_preparacion/`);
      const msg =
        res.data?.mensaje ||
        "Se notificó que la orden está lista para retiro/despacho.";
      toast.success(msg);
    } catch (err) {
      console.error("Error al notificar preparación:", err);
      const backendMsg =
        err.response?.data?.error || err.response?.data?.detail;
      toast.error(
        backendMsg || "No se pudo notificar que la orden está lista."
      );
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
      // Endpoint sugerido: /base/envios/<id>/detalle_verificacion/
      const res = await api.get(
        `/base/envios/${idEnvio}/detalle_verificacion/`
      );
      setEnvioDetalle(res.data);
    } catch (err) {
      console.error("Error cargando detalle de envío:", err);
      const backendMsg =
        err.response?.data?.error || err.response?.data?.detail;
      setErrorEnvioDetalle(
        backendMsg || "No se pudieron cargar los detalles de este envío."
      );
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
  // Acciones ENVÍO: marcar listo para salir
  // ============================
  const marcarEnvioListo = async () => {
    if (!envioDetalle?.envio) return;
    const id = envioDetalle.envio.id_envio;

    setEnvioAccionLoading(true);
    try {
      // Endpoint sugerido: /base/envios/<id>/marcar_listo_salida/
      const res = await api.post(
        `/base/envios/${id}/marcar_listo_salida/`
      );
      const msg =
        res.data?.mensaje || "Envío marcado como listo para salir.";
      toast.success(msg);

      // Quitamos el envío del listado
      setEnvios((prev) => prev.filter((e) => e.id_envio !== id));
      cerrarModalEnvio();
    } catch (err) {
      console.error("Error al marcar envío listo para salir:", err);
      const backendMsg =
        err.response?.data?.error || err.response?.data?.detail;
      toast.error(
        backendMsg || "No se pudo marcar el envío como listo para salir."
      );
    } finally {
      setEnvioAccionLoading(false);
    }
  };

  // ============================
  // Si aún no sabemos quién es el usuario
  // ============================
  if (!user) {
    return (
      <div>
        <h2 style={styles.pageTitle}>Preparación de órdenes</h2>
        <p style={styles.subtitle}>Cargando datos de usuario...</p>
      </div>
    );
  }

  const tipoUsuarioActual =
    user.tipo || (user.user && user.user.tipo) || "No especificado";

  // ============================
  // Render principal
  // ============================
  return (
    <div>
      <h2 style={styles.pageTitle}>Preparación de órdenes</h2>
      <p style={styles.subtitle}>
        Módulo disponible para el rol de <strong>ALMACENISTA</strong>. Tu tipo
        de usuario actual es: <strong>{tipoUsuarioActual}</strong>
      </p>

      {mensaje && <div style={styles.statusTextOk}>{mensaje}</div>}
      {error && <div style={styles.statusTextError}>{error}</div>}

      {/* Si el backend dijo 403, no mostramos las tablas */}
      {error && error.includes("Solo los usuarios de tipo ALMACENISTA") ? null : (
        <>
          {/* =======================
              SECCIÓN ÓRDENES
          ======================== */}
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}># Orden</th>
                  <th style={styles.th}>Cliente</th>
                  <th style={styles.th}>Vendedor</th>
                  <th style={styles.th}>Fecha</th>
                  <th style={styles.th}>Total (Bs)</th>
                  <th style={styles.th}>Estado envío</th>
                  <th style={styles.th}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {ordenes.length === 0 && !loading && (
                  <tr>
                    <td style={styles.td} colSpan={7}>
                      No hay órdenes pendientes por preparación.
                    </td>
                  </tr>
                )}

                {ordenes.map((o, idx) => {
                  const baseTd =
                    idx % 2 === 1
                      ? { ...styles.td, ...styles.rowAlt }
                      : styles.td;

                  return (
                    <tr key={o.id_orden}>
                      <td style={baseTd}>{o.id_orden}</td>
                      <td style={baseTd}>{nombreCliente(o.id_cliente)}</td>
                      <td style={baseTd}>{nombreVendedor(o.id_usuario)}</td>
                      <td style={baseTd}>{o.fecha_orden}</td>
                      <td style={baseTd}>
                        {Number(o.precio_final || 0).toFixed(2)}
                      </td>
                      <td style={baseTd}>
                        <span style={styles.badgeEstado}>
                          {o.estado_de_envio}
                        </span>
                      </td>
                      <td style={baseTd}>
                        <button
                          type="button"
                          style={styles.buttonPrimary}
                          onClick={() => abrirDetalleOrden(o.id_orden)}
                        >
                          Revisar y preparar
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {loading && (
                  <tr>
                    <td style={styles.td} colSpan={7}>
                      Cargando órdenes...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {ordenes.length > 0 && (
            <div style={styles.resumenResultados}>
              Mostrando {ordenes.length} orden(es) aprobadas para preparar.
            </div>
          )}

          {/* =======================
              SECCIÓN ENVÍOS
          ======================== */}
          <h3 style={styles.sectionTitle}>Verificación de envíos</h3>
          <p style={styles.sectionSubtitle}>
            Aquí se listan los envíos que ya fueron armados por el gerente y
            contienen órdenes asignadas a tu almacén. Verifica el contenido y
            marca el envío como <strong>listo para salir</strong>.
          </p>

          {errorEnvios && (
            <div style={styles.statusTextError}>{errorEnvios}</div>
          )}

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}># Envío</th>
                  <th style={styles.th}>Código</th>
                  <th style={styles.th}>Unidad</th>
                  <th style={styles.th}>Órdenes (tuyas / total)</th>
                  <th style={styles.th}>Peso total (kg)</th>
                  <th style={styles.th}>Estado</th>
                  <th style={styles.th}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {envios.length === 0 && !loadingEnvios && (
                  <tr>
                    <td style={styles.td} colSpan={7}>
                      No hay envíos pendientes de verificación.
                    </td>
                  </tr>
                )}

                {envios.map((e, idx) => {
                  const baseTd =
                    idx % 2 === 1
                      ? { ...styles.td, ...styles.rowAlt }
                      : styles.td;

                  const cantTotal =
                    e.cantidad_ordenes_total != null
                      ? e.cantidad_ordenes_total
                      : "-";
                  const cantAlmacenista =
                    e.cantidad_ordenes_almacenista != null
                      ? e.cantidad_ordenes_almacenista
                      : "-";

                  return (
                    <tr key={e.id_envio}>
                      <td style={baseTd}>{e.id_envio}</td>
                      <td style={baseTd}>{e.codigo_envio || "-"}</td>
                      <td style={baseTd}>{nombreUnidad(e)}</td>
                      <td style={baseTd}>
                        {cantAlmacenista} / {cantTotal}
                      </td>
                      <td style={baseTd}>
                        {e.peso_total != null
                          ? Number(e.peso_total).toFixed(2)
                          : "-"}
                      </td>
                      <td style={baseTd}>
                        <span style={styles.badgeEstado}>
                          {e.estado || "SIN ESTADO"}
                        </span>
                      </td>
                      <td style={baseTd}>
                        <button
                          type="button"
                          style={styles.buttonPrimary}
                          onClick={() => abrirDetalleEnvio(e.id_envio)}
                        >
                          Revisar envío
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {loadingEnvios && (
                  <tr>
                    <td style={styles.td} colSpan={7}>
                      Cargando envíos...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {envios.length > 0 && (
            <div style={styles.resumenResultados}>
              Mostrando {envios.length} envío(s) pendientes de verificación.
            </div>
          )}
        </>
      )}

      {/* ============================
          MODAL DETALLE ORDEN
      ============================ */}
      {modalAbierto && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeaderRow}>
              <h3 style={styles.modalTitle}>
                Detalles de la orden{" "}
                {ordenDetalle?.orden
                  ? `#${ordenDetalle.orden.id_orden}`
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

            {loadingDetalle && (
              <div style={styles.modalLine}>
                Cargando detalles de la orden...
              </div>
            )}

            {errorDetalle && (
              <div
                style={{
                  ...styles.modalLine,
                  color: "#b91c1c",
                  marginBottom: "6px",
                }}
              >
                {errorDetalle}
              </div>
            )}

            {ordenDetalle && !loadingDetalle && !errorDetalle && (
              <>
                <div style={styles.modalSectionTitle}>
                  Información general
                </div>
                <div style={styles.modalLine}>
                  <strong>Cliente:</strong>{" "}
                  {nombreCliente(ordenDetalle.orden.id_cliente)}
                </div>
                <div style={styles.modalLine}>
                  <strong>Vendedor:</strong>{" "}
                  {nombreVendedor(ordenDetalle.orden.id_usuario)}
                </div>
                <div style={styles.modalLine}>
                  <strong>Método de pago:</strong>{" "}
                  {ordenDetalle.orden.metodo_pago}
                </div>
                <div style={styles.modalLine}>
                  <strong>Fecha de orden:</strong>{" "}
                  {ordenDetalle.orden.fecha_orden}
                </div>
                <div style={styles.modalLine}>
                  <strong>Estado de envío:</strong>{" "}
                  {ordenDetalle.orden.estado_de_envio}
                </div>
                <div style={styles.modalLine}>
                  <strong>Estado de pago:</strong>{" "}
                  {ordenDetalle.orden.estado_de_pago}
                </div>
                <div style={styles.modalLine}>
                  <strong>Total (Bs):</strong>{" "}
                  {Number(ordenDetalle.orden.precio_final || 0).toFixed(2)}
                </div>

                <div style={styles.modalSectionTitle}>
                  Productos de la orden
                </div>
                {(!ordenDetalle.detalles ||
                  ordenDetalle.detalles.length === 0) && (
                  <div style={styles.modalLine}>
                    No se encontraron detalles de productos para esta orden.
                  </div>
                )}

                {ordenDetalle.detalles &&
                  ordenDetalle.detalles.length > 0 && (
                    <table style={styles.modalDetalleTable}>
                      <thead>
                        <tr>
                          <th style={styles.modalDetalleTh}>Producto</th>
                          <th style={styles.modalDetalleTh}>Cantidad</th>
                          <th style={styles.modalDetalleTh}>
                            Peso subtotal
                          </th>
                          <th style={styles.modalDetalleTh}>
                            Subtotal (Bs)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {ordenDetalle.detalles.map((d, idx) => (
                          <tr key={idx}>
                            <td style={styles.modalDetalleTd}>
                              {d.producto}
                            </td>
                            <td style={styles.modalDetalleTd}>
                              {d.cantidad}
                            </td>
                            <td style={styles.modalDetalleTd}>
                              {d.peso}
                            </td>
                            <td style={styles.modalDetalleTd}>
                              {d.subtotal}
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
                    onClick={cerrarModalOrden}
                    disabled={accionLoading}
                  >
                    Cerrar
                  </button>

                  <button
                    type="button"
                    style={styles.buttonSecondary}
                    onClick={notificarPreparacion}
                    disabled={accionLoading}
                  >
                    {accionLoading
                      ? "Procesando..."
                      : "Notificar preparación"}
                  </button>

                  <button
                    type="button"
                    style={styles.buttonPrimary}
                    onClick={marcarComoPreparada}
                    disabled={accionLoading}
                  >
                    {accionLoading
                      ? "Procesando..."
                      : "Marcar como PREPARADA"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ============================
          MODAL DETALLE ENVÍO
      ============================ */}
      {modalEnvioAbierto && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeaderRow}>
              <h3 style={styles.modalTitle}>
                Detalles del envío{" "}
                {envioDetalle?.envio
                  ? `#${envioDetalle.envio.id_envio} · ${envioDetalle.envio.codigo_envio || ""
                  }`
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
              <div style={styles.modalLine}>
                Cargando detalles del envío...
              </div>
            )}

            {errorEnvioDetalle && (
              <div
                style={{
                  ...styles.modalLine,
                  color: "#b91c1c",
                  marginBottom: "6px",
                }}
              >
                {errorEnvioDetalle}
              </div>
            )}

            {envioDetalle && !loadingEnvioDetalle && !errorEnvioDetalle && (
              <>
                <div style={styles.modalSectionTitle}>
                  Información del envío
                </div>
                <div style={styles.modalLine}>
                  <strong>Código:</strong>{" "}
                  {envioDetalle.envio.codigo_envio || "-"}
                </div>
                <div style={styles.modalLine}>
                  <strong>Unidad:</strong>{" "}
                  {nombreUnidad(envioDetalle.envio)}
                </div>
                <div style={styles.modalLine}>
                  <strong>Peso total (kg):</strong>{" "}
                  {envioDetalle.envio.peso_total != null
                    ? Number(envioDetalle.envio.peso_total).toFixed(2)
                    : "-"}
                </div>
                <div style={styles.modalLine}>
                  <strong>Estado:</strong>{" "}
                  {envioDetalle.envio.estado || "SIN ESTADO"}
                </div>
                <div style={styles.modalLine}>
                  <strong>Fecha salida:</strong>{" "}
                  {envioDetalle.envio.fecha_salida || "No registrada"}
                </div>

                <div style={styles.modalSectionTitle}>
                  Órdenes incluidas en el envío
                </div>
                {(!envioDetalle.ordenes ||
                  envioDetalle.ordenes.length === 0) && (
                  <div style={styles.modalLine}>
                    No se encontraron órdenes asociadas a este envío.
                  </div>
                )}

                {envioDetalle.ordenes &&
                  envioDetalle.ordenes.length > 0 && (
                    <table style={styles.modalDetalleTable}>
                      <thead>
                        <tr>
                          <th style={styles.modalDetalleTh}># Orden</th>
                          <th style={styles.modalDetalleTh}>Cliente</th>
                          <th style={styles.modalDetalleTh}>Total (Bs)</th>
                          <th style={styles.modalDetalleTh}>
                            Estado envío
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {envioDetalle.ordenes.map((o, idx) => (
                          <tr key={idx}>
                            <td style={styles.modalDetalleTd}>
                              {o.id_orden}
                            </td>
                            <td style={styles.modalDetalleTd}>
                              {o.cliente_nombre || "-"}
                            </td>
                            <td style={styles.modalDetalleTd}>
                              {o.precio_final != null
                                ? Number(o.precio_final).toFixed(2)
                                : "-"}
                            </td>
                            <td style={styles.modalDetalleTd}>
                              {o.estado_de_envio || "-"}
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
                    onClick={cerrarModalEnvio}
                    disabled={envioAccionLoading}
                  >
                    Cerrar
                  </button>

                  <button
                    type="button"
                    style={styles.buttonPrimary}
                    onClick={marcarEnvioListo}
                    disabled={envioAccionLoading}
                  >
                    {envioAccionLoading
                      ? "Procesando..."
                      : "Marcar envío listo para salir"}
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