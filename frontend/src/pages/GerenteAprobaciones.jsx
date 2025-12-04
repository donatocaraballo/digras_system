// frontend/src/pages/GerenteAprobaciones.jsx
import React, { useEffect, useState } from "react";
import api from "../api/api";

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
    maxWidth: "1180px",
    background: "#ffffff",
    borderRadius: "14px",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.12)",
    padding: "20px 24px 24px",
    boxSizing: "border-box",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: "10px",
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
    marginBottom: "16px",
  },
  sectionTitle: {
    fontSize: "15px",
    fontWeight: 600,
    color: "#111827",
    margin: "16px 0 6px",
  },
  statusTextOk: {
    fontSize: "12px",
    color: "#15803d",
    marginBottom: "6px",
  },
  statusTextError: {
    fontSize: "12px",
    color: "#b91c1c",
    marginBottom: "6px",
  },
  columns: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1.3fr)",
    gap: "16px",
    alignItems: "flex-start",
    marginTop: "8px",
  },
  tableWrapper: {
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    overflow: "hidden",
    background: "#f9fafb",
    marginBottom: "14px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "12px",
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
  buttonGhost: {
    borderRadius: "999px",
    padding: "0 12px",
    height: "28px",
    background: "#ffffff",
    border: "1px solid #d1d5db",
    color: "#374151",
    cursor: "pointer",
    fontSize: "11px",
  },
  buttonPrimary: {
    border: "none",
    borderRadius: "999px",
    padding: "0 16px",
    height: "32px",
    background: "linear-gradient(135deg, #16a34a, #15803d)",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 500,
  },
  buttonDanger: {
    border: "none",
    borderRadius: "999px",
    padding: "0 16px",
    height: "32px",
    background: "#ef4444",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 500,
  },
  detailCard: {
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    padding: "14px 16px",
    fontSize: "12px",
  },
  detailTitle: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#111827",
    marginBottom: "6px",
  },
  detailLine: {
    marginBottom: "3px",
  },
  detailSectionTitle: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#4b5563",
    marginTop: "8px",
    marginBottom: "4px",
  },
  detailTable: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "4px",
    fontSize: "12px",
  },
  detailTh: {
    background: "#e5e7eb",
    padding: "6px 8px",
    borderBottom: "1px solid #d1d5db",
    textAlign: "left",
    fontWeight: 600,
  },
  detailTd: {
    padding: "6px 8px",
    borderBottom: "1px solid #e5e7eb",
  },
  detailActionsRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "10px",
  },
  pillEstado: (bg, color) => ({
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: 600,
    background: bg,
    color,
  }),
};

function pillEstadoEnvio(estado) {
  if (!estado) return styles.pillEstado("#e5e7eb", "#374151");
  const t = estado.toUpperCase();
  if (t.includes("PENDIENTE")) return styles.pillEstado("#fef3c7", "#92400e");
  if (t.includes("APROBADA")) return styles.pillEstado("#dcfce7", "#166534");
  if (t.includes("RECHAZADA")) return styles.pillEstado("#fee2e2", "#b91c1c");
  return styles.pillEstado("#e5e7eb", "#374151");
}

export default function GerenteAprobaciones() {
  const [ordenesPendientes, setOrdenesPendientes] = useState([]);
  const [comprasPendientes, setComprasPendientes] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [seleccion, setSeleccion] = useState(null); // { tipo: 'orden' | 'compra', item, detalles, loading, error }

  const cargarPendientes = async () => {
    setLoading(true);
    setError("");
    setMensaje("");

    try {
      // ÓRDENES: intentamos filtrar por estado_envio en el backend
      const resOrdenes = await api.get("/ordenes/", {
        params: { estado_envio: "PENDIENTE POR APROBACIÓN" },
      });
      const dataOrdenes = Array.isArray(resOrdenes.data)
        ? resOrdenes.data
        : resOrdenes.data.results || [];

      // Compras: traemos todas y filtramos aquí por "pendiente"
      const resCompras = await api.get("/compras/");
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
        `Órdenes pendientes: ${dataOrdenes.length} · Compras pendientes: ${dataCompras.length}`
      );
    } catch (err) {
      console.error("Error cargando pendientes:", err);
      const backendMsg =
        err.response?.data?.error || err.response?.data?.detail;
      setError(
        backendMsg ||
          "No se pudieron cargar las órdenes y compras pendientes. Revisa el token o el servidor."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPendientes();
  }, []);

  // ==========================
  //   VER DETALLE ORDEN
  // ==========================
  const verOrden = async (orden) => {
    setSeleccion({
      tipo: "orden",
      item: orden,
      detalles: [],
      loading: true,
      error: "",
    });

    try {
      // Usamos el endpoint específico de la orden:
      // GET /api/ordenes/<id>/detalles/
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
      console.error("Error cargando detalles de orden:", err);
      const backendMsg =
        err.response?.data?.error || err.response?.data?.detail;
      setSeleccion((prev) =>
        prev && prev.tipo === "orden" && prev.item.id_orden === orden.id_orden
          ? {
              ...prev,
              loading: false,
              error:
                backendMsg ||
                "No se pudieron cargar los detalles de la orden seleccionada.",
            }
          : prev
      );
    }
  };

  // ==========================
  //   VER DETALLE COMPRA
  // ==========================
  const verCompra = async (compra) => {
    setSeleccion({
      tipo: "compra",
      item: compra,
      detalles: [],
      loading: true,
      error: "",
    });

    try {
      const res = await api.get("/detalle-compras/", {
        params: { id_compra: compra.id_compra },
      });

      const raw = Array.isArray(res.data) ? res.data : res.data.results || [];

      // Filtro defensivo por si el backend no filtra por query param
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
      console.error("Error cargando detalles de compra:", err);
      const backendMsg =
        err.response?.data?.error || err.response?.data?.detail;
      setSeleccion((prev) =>
        prev && prev.tipo === "compra" && prev.item.id_compra === compra.id_compra
          ? {
              ...prev,
              loading: false,
              error:
                backendMsg ||
                "No se pudieron cargar los detalles de la compra seleccionada.",
            }
          : prev
      );
    }
  };

  // ==========================
  //   APROBAR / RECHAZAR
  // ==========================
  const aprobarSeleccion = async () => {
    if (!seleccion) return;
    try {
      if (seleccion.tipo === "orden") {
        await api.post(`/ordenes/${seleccion.item.id_orden}/aprobar/`);
      } else {
        // Compras: acción personalizada en el backend
        await api.post(`/compras/${seleccion.item.id_compra}/aprobar/`);
      }

      setSeleccion(null);
      await cargarPendientes();
      alert("Acción realizada: aprobado correctamente.");
    } catch (err) {
      console.error("Error al aprobar:", err);
      const backendMsg =
        err.response?.data?.error || err.response?.data?.detail;
      alert(
        backendMsg ||
          "No se pudo aprobar. Verifica que seas GERENTE o el estado actual."
      );
    }
  };

  const rechazarSeleccion = async () => {
    if (!seleccion) return;
    const confirmar = window.confirm(
      `¿Seguro que deseas RECHAZAR esta ${
        seleccion.tipo === "orden" ? "orden" : "compra"
      }?`
    );
    if (!confirmar) return;

    try {
      if (seleccion.tipo === "orden") {
        await api.post(`/ordenes/${seleccion.item.id_orden}/rechazar/`);
      } else {
        await api.post(`/compras/${seleccion.item.id_compra}/rechazar/`);
      }

      setSeleccion(null);
      await cargarPendientes();
      alert("Acción realizada: rechazada correctamente.");
    } catch (err) {
      console.error("Error al rechazar:", err);
      const backendMsg =
        err.response?.data?.error || err.response?.data?.detail;
      alert(
        backendMsg ||
          "No se pudo rechazar. Verifica que seas GERENTE o el estado actual."
      );
    }
  };

  const totalDetallesSeleccion = () => {
    if (!seleccion || !seleccion.detalles) return 0;
    return seleccion.detalles.reduce((acc, d) => {
      const sub = d.subtotal ?? 0;
      return acc + Number(sub);
    }, 0);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.headerRow}>
          <div>
            <h2 style={styles.title}>Panel de aprobaciones (Gerente)</h2>
            <p style={styles.subtitle}>
              Revisa y aprueba/rechaza órdenes de venta y órdenes de compra que
              están en estado <strong>"PENDIENTE POR APROBACIÓN"</strong>.
            </p>
          </div>
        </div>

        {mensaje && <div style={styles.statusTextOk}>{mensaje}</div>}
        {error && <div style={styles.statusTextError}>{error}</div>}
        {loading && (
          <div style={{ fontSize: "12px", color: "#6b7280" }}>
            Cargando pendientes...
          </div>
        )}

        <div style={styles.columns}>
          {/* COLUMNA IZQUIERDA: LISTAS */}
          <div>
            {/* ÓRDENES */}
            <div>
              <div style={styles.sectionTitle}>Órdenes de venta pendientes</div>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>#</th>
                      <th style={styles.th}>Cliente</th>
                      <th style={styles.th}>Vendedor</th>
                      <th style={styles.th}>Fecha</th>
                      <th style={styles.th}>Total (Bs)</th>
                      <th style={styles.th}>Estado</th>
                      <th style={styles.th}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordenesPendientes.length === 0 && !loading && (
                      <tr>
                        <td style={styles.td} colSpan={7}>
                          No hay órdenes pendientes por aprobación.
                        </td>
                      </tr>
                    )}

                    {ordenesPendientes.map((o, idx) => {
                      const rowBase =
                        idx % 2 === 1
                          ? { ...styles.td, ...styles.rowAlt }
                          : styles.td;

                      const seleccionada =
                        seleccion &&
                        seleccion.tipo === "orden" &&
                        seleccion.item.id_orden === o.id_orden;

                      return (
                        <tr
                          key={o.id_orden}
                          style={{
                            backgroundColor: seleccionada
                              ? "#e0f2fe"
                              : undefined,
                          }}
                        >
                          <td style={rowBase}>{o.id_orden}</td>
                          <td style={rowBase}>
                            {o.id_cliente_nombre || `Cliente #${o.id_cliente}`}
                          </td>
                          <td style={rowBase}>
                            {o.id_usuario_username || `Usuario #${o.id_usuario}`}
                          </td>
                          <td style={rowBase}>{o.fecha_orden}</td>
                          <td style={rowBase}>
                            {Number(o.precio_final || 0).toFixed(2)}
                          </td>
                          <td style={rowBase}>
                            <span style={pillEstadoEnvio(o.estado_de_envio)}>
                              {o.estado_de_envio}
                            </span>
                          </td>
                          <td style={rowBase}>
                            <button
                              type="button"
                              style={styles.buttonGhost}
                              onClick={() => verOrden(o)}
                            >
                              Verificar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* COMPRAS */}
            <div>
              <div style={styles.sectionTitle}>Órdenes de compra pendientes</div>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>#</th>
                      <th style={styles.th}>Proveedor</th>
                      <th style={styles.th}>Fecha</th>
                      <th style={styles.th}>Total (Bs)</th>
                      <th style={styles.th}>Estado</th>
                      <th style={styles.th}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comprasPendientes.length === 0 && !loading && (
                      <tr>
                        <td style={styles.td} colSpan={6}>
                          No hay compras pendientes por aprobación.
                        </td>
                      </tr>
                    )}

                    {comprasPendientes.map((c, idx) => {
                      const rowBase =
                        idx % 2 === 1
                          ? { ...styles.td, ...styles.rowAlt }
                          : styles.td;

                      const seleccionada =
                        seleccion &&
                        seleccion.tipo === "compra" &&
                        seleccion.item.id_compra === c.id_compra;

                      return (
                        <tr
                          key={c.id_compra}
                          style={{
                            backgroundColor: seleccionada
                              ? "#e0f2fe"
                              : undefined,
                          }}
                        >
                          <td style={rowBase}>{c.id_compra}</td>
                          <td style={rowBase}>
                            {c.id_proveedor_nombre ||
                              `Proveedor #${c.id_proveedor}`}
                          </td>
                          <td style={rowBase}>{c.fecha_pedido}</td>
                          <td style={rowBase}>
                            {Number(c.precio_final || 0).toFixed(2)}
                          </td>
                          <td style={rowBase}>
                            <span style={pillEstadoEnvio(c.estado_de_envio)}>
                              {c.estado_de_envio}
                            </span>
                          </td>
                          <td style={rowBase}>
                            <button
                              type="button"
                              style={styles.buttonGhost}
                              onClick={() => verCompra(c)}
                            >
                              Verificar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: DETALLE SELECCIONADO */}
          <div>
            <div style={styles.sectionTitle}>Detalle seleccionado</div>
            {!seleccion && (
              <div
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  marginTop: "4px",
                }}
              >
                Selecciona una orden de venta o una compra para ver su resumen y
                aprobar/rechazar.
              </div>
            )}

            {seleccion && (
              <div style={styles.detailCard}>
                <div style={styles.detailTitle}>
                  {seleccion.tipo === "orden"
                    ? `Orden #${seleccion.item.id_orden}`
                    : `Compra #${seleccion.item.id_compra}`}
                </div>

                {/* INFO GENERAL */}
                <div style={styles.detailSectionTitle}>
                  Información general
                </div>
                {seleccion.tipo === "orden" ? (
                  <>
                    <div style={styles.detailLine}>
                      <strong>Cliente: </strong>
                      {seleccion.item.id_cliente_nombre ||
                        `Cliente #${seleccion.item.id_cliente}`}
                    </div>
                    <div style={styles.detailLine}>
                      <strong>Vendedor: </strong>
                      {seleccion.item.id_usuario_username ||
                        `Usuario #${seleccion.item.id_usuario}`}
                    </div>
                    <div style={styles.detailLine}>
                      <strong>Fecha: </strong> {seleccion.item.fecha_orden}
                    </div>
                    <div style={styles.detailLine}>
                      <strong>Método de pago: </strong>
                      {seleccion.item.metodo_pago}
                    </div>
                    <div style={styles.detailLine}>
                      <strong>Estado de envío: </strong>
                      <span
                        style={pillEstadoEnvio(seleccion.item.estado_de_envio)}
                      >
                        {seleccion.item.estado_de_envio}
                      </span>
                    </div>
                    <div style={styles.detailLine}>
                      <strong>Estado de pago: </strong>
                      {seleccion.item.estado_de_pago}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={styles.detailLine}>
                      <strong>Proveedor: </strong>
                      {seleccion.item.id_proveedor_nombre ||
                        `Proveedor #${seleccion.item.id_proveedor}`}
                    </div>
                    <div style={styles.detailLine}>
                      <strong>Fecha pedido: </strong>
                      {seleccion.item.fecha_pedido}
                    </div>
                    <div style={styles.detailLine}>
                      <strong>Método de pago: </strong>
                      {seleccion.item.metodo_pago}
                    </div>
                    <div style={styles.detailLine}>
                      <strong>Estado de envío: </strong>
                      <span
                        style={pillEstadoEnvio(seleccion.item.estado_de_envio)}
                      >
                        {seleccion.item.estado_de_envio}
                      </span>
                    </div>
                    <div style={styles.detailLine}>
                      <strong>Estado de pago: </strong>
                      {seleccion.item.estado_de_pago}
                    </div>
                  </>
                )}

                {/* DETALLES */}
                <div style={styles.detailSectionTitle}>Detalle de ítems</div>
                {seleccion.loading && (
                  <div style={styles.detailLine}>
                    Cargando detalle de productos...
                  </div>
                )}
                {seleccion.error && (
                  <div
                    style={{
                      ...styles.detailLine,
                      color: "#b91c1c",
                    }}
                  >
                    {seleccion.error}
                  </div>
                )}
                {!seleccion.loading &&
                  !seleccion.error &&
                  (!seleccion.detalles ||
                    seleccion.detalles.length === 0) && (
                    <div style={styles.detailLine}>
                      No se encontraron detalles para esta{" "}
                      {seleccion.tipo === "orden" ? "orden" : "compra"}.
                    </div>
                  )}

                {!seleccion.loading &&
                  !seleccion.error &&
                  seleccion.detalles &&
                  seleccion.detalles.length > 0 && (
                    <table style={styles.detailTable}>
                      <thead>
                        <tr>
                          <th style={styles.detailTh}>Producto</th>
                          <th style={styles.detailTh}>Cantidad</th>
                          <th style={styles.detailTh}>Precio unit.</th>
                          <th style={styles.detailTh}>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {seleccion.detalles.map((d) => {
                          const nombreProd =
                            d.id_producto_nombre ||
                            (typeof d.id_producto === "object"
                              ? d.id_producto.nombre
                              : `#${d.id_producto}`);
                          return (
                            <tr key={d.id_detalleo || d.id_detallec}>
                              <td style={styles.detailTd}>{nombreProd}</td>
                              <td style={styles.detailTd}>
                                {d.cantidad ?? "-"}
                              </td>
                              <td style={styles.detailTd}>
                                {Number(d.precio_unitario || 0).toFixed(2)}
                              </td>
                              <td style={styles.detailTd}>
                                {Number(d.subtotal || 0).toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}

                {/* TOTAL */}
                {!seleccion.loading && !seleccion.error && (
                  <div
                    style={{
                      ...styles.detailLine,
                      marginTop: "6px",
                      fontWeight: 600,
                    }}
                  >
                    Total calculado: Bs {totalDetallesSeleccion().toFixed(2)}
                  </div>
                )}

                {/* BOTONES APROBAR / RECHAZAR */}
                <div style={styles.detailActionsRow}>
                  <button
                    type="button"
                    style={styles.buttonPrimary}
                    onClick={aprobarSeleccion}
                    disabled={seleccion.loading}
                  >
                    Aprobar
                  </button>
                  <button
                    type="button"
                    style={styles.buttonDanger}
                    onClick={rechazarSeleccion}
                    disabled={seleccion.loading}
                  >
                    Rechazar
                  </button>
                  <button
                    type="button"
                    style={styles.buttonGhost}
                    onClick={() => setSeleccion(null)}
                    disabled={seleccion.loading}
                  >
                    Limpiar selección
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}