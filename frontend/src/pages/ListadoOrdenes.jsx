// frontend/src/pages/ListadoOrdenes.jsx
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
    maxWidth: "1100px",
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
    marginBottom: "18px",
  },
  filtersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "10px",
    marginBottom: "12px",
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
  select: {
    height: "34px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    padding: "0 8px",
    fontSize: "12px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    background: "#ffffff",
  },
  filtersActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
    marginBottom: "14px",
  },
  buttonPrimary: {
    border: "none",
    borderRadius: "999px",
    padding: "0 14px",
    height: "34px",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 500,
  },
  buttonGhost: {
    borderRadius: "999px",
    padding: "0 12px",
    height: "34px",
    background: "#ffffff",
    border: "1px solid #d1d5db",
    color: "#374151",
    cursor: "pointer",
    fontSize: "12px",
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
  tableWrapper: {
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    overflow: "hidden",
    background: "#f9fafb",
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
  pillEstado: (colorBg, colorText) => ({
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: 600,
    background: colorBg,
    color: colorText,
  }),
  pillCancelada: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: 600,
    background: "#fee2e2",
    color: "#b91c1c",
  },
  resumenResultados: {
    fontSize: "11px",
    color: "#6b7280",
    marginTop: "8px",
  },
  detalleCard: {
    marginTop: "18px",
    padding: "14px 16px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    fontSize: "12px",
  },
  detalleTitle: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#111827",
    marginBottom: "6px",
  },
  detalleSectionTitle: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#4b5563",
    marginTop: "8px",
    marginBottom: "4px",
  },
  detalleLine: {
    marginBottom: "2px",
  },
  detalleTable: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "4px",
    fontSize: "12px",
  },
  detalleTh: {
    background: "#e5e7eb",
    padding: "6px 8px",
    borderBottom: "1px solid #d1d5db",
    textAlign: "left",
    fontWeight: 600,
  },
  detalleTd: {
    padding: "6px 8px",
    borderBottom: "1px solid #e5e7eb",
  },
};

export default function ListadoOrdenes() {
  const [ordenes, setOrdenes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [productos, setProductos] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [detallesOrdenSeleccionada, setDetallesOrdenSeleccionada] =
    useState([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState("");

  const [filtros, setFiltros] = useState({
    id: "",
    estadoEnvio: "",
    estadoPago: "",
    cliente: "",
    vendedor: "",
    desde: "",
    hasta: "",
    ordering: "-fecha_orden",
  });

  // Mapear id_cliente -> nombre
  const nombreCliente = (idCliente) => {
    const c = clientes.find((c) => c.id_cliente === idCliente);
    return c ? c.nombre : `#${idCliente}`;
  };

  // Mapear id_usuario -> username (para detalles)
  const nombreVendedor = (idUsuario) => {
    if (!idUsuario) return "";
    const v = vendedores.find(
      (u) => u.id_usuario === idUsuario || u.id === idUsuario
    );
    return v ? v.username : `#${idUsuario}`;
  };

  const cargarClientes = async () => {
    try {
      const res = await api.get("/base/clientes/");
      setClientes(res.data);
    } catch (err) {
      console.error("Error cargando clientes:", err);
    }
  };

  const cargarVendedores = async () => {
    try {
      const res = await api.get("/usuarios/");
      const data = Array.isArray(res.data)
        ? res.data
        : res.data.results || [];
      const soloVendedores = data.filter((u) => u.tipo === "VENDEDOR");
      setVendedores(soloVendedores);
    } catch (err) {
      console.error("Error cargando vendedores:", err);
    }
  };

  const cargarProductos = async () => {
    try {
      const res = await api.get("/productos/");
      setProductos(res.data);
    } catch (err) {
      console.error("Error cargando productos:", err);
    }
  };

  const cargarOrdenes = async (conMensaje = false) => {
    setLoading(true);
    setError("");
    if (conMensaje) setMensaje("");

    try {
      const params = {};

      if (filtros.id) params.id = filtros.id;
      if (filtros.estadoEnvio) params.estado_envio = filtros.estadoEnvio;
      if (filtros.estadoPago) params.estado_pago = filtros.estadoPago;
      if (filtros.cliente) params.cliente = filtros.cliente;
      if (filtros.vendedor) params.vendedor = filtros.vendedor;
      if (filtros.desde) params.desde = filtros.desde;
      if (filtros.hasta) params.hasta = filtros.hasta;
      if (filtros.ordering) params.ordering = filtros.ordering;

      const res = await api.get("/ordenes/", { params });

      const data = Array.isArray(res.data)
        ? res.data
        : res.data.results || [];

      setOrdenes(data);
      if (conMensaje) {
        setMensaje(`Se encontraron ${data.length} orden(es).`);
      }
    } catch (err) {
      console.error("Error cargando órdenes:", err);
      const status = err.response?.status;
      const backendMsg =
        err.response?.data?.error || err.response?.data?.detail;
      if (status === 403 && backendMsg) {
        setError(backendMsg);
      } else {
        setError("No se pudieron cargar las órdenes.");
      }
    } finally {
      setLoading(false);
    }
  };

  const verDetallesOrden = async (idOrden) => {
    setLoadingDetalle(true);
    setErrorDetalle("");
    setOrdenSeleccionada(null);
    setDetallesOrdenSeleccionada([]);

    try {
      const [resOrden, resDetalles] = await Promise.all([
        api.get(`/ordenes/${idOrden}/`),             // Orden específica
        api.get(`/ordenes/${idOrden}/detalles/`),    // SOLO detalles de esa orden
      ]);

      const ordenData = resOrden.data;
      const detallesData = Array.isArray(resDetalles.data)
        ? resDetalles.data
        : resDetalles.data.results || [];

      setOrdenSeleccionada(ordenData);
      setDetallesOrdenSeleccionada(detallesData);
    } catch (err) {
      console.error("Error cargando detalles de orden:", err);
      const backendMsg =
        err.response?.data?.error || err.response?.data?.detail;
      setErrorDetalle(
        backendMsg || "No se pudieron cargar los detalles de la orden."
      );
    } finally {
      setLoadingDetalle(false);
    }
  };

  useEffect(() => {
    cargarClientes();
    cargarVendedores();
    cargarProductos();
    cargarOrdenes(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChangeFiltro = (campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      id: "",
      estadoEnvio: "",
      estadoPago: "",
      cliente: "",
      vendedor: "",
      desde: "",
      hasta: "",
      ordering: "-fecha_orden",
    });
  };

  const pillEstadoEnvio = (estado) => {
    if (!estado) return styles.pillEstado("#e5e7eb", "#374151");

    const texto = estado.toUpperCase();
    if (texto.includes("PENDIENTE")) {
      return styles.pillEstado("#fef3c7", "#92400e");
    }
    if (texto.includes("APROBADA")) {
      return styles.pillEstado("#dcfce7", "#166534");
    }
    if (texto.includes("PREPARADA")) {
      return styles.pillEstado("#e0f2fe", "#0369a1");
    }
    if (
      texto.includes("ASIGNADA") ||
      texto.includes("EN ENVÍO") ||
      texto.includes("EN CURSO")
    ) {
      return styles.pillEstado("#dbeafe", "#1d4ed8");
    }
    if (texto.includes("ENTREGADA")) {
      return styles.pillEstado("#bbf7d0", "#166534");
    }
    if (texto.includes("CANCELADA")) {
      return styles.pillEstado("#fee2e2", "#b91c1c");
    }
    return styles.pillEstado("#e5e7eb", "#374151");
  };

  const pillEstadoPago = (estado) => {
    if (!estado) return styles.pillEstado("#e5e7eb", "#374151");

    const texto = estado.toUpperCase();
    if (texto.includes("PENDIENTE")) {
      return styles.pillEstado("#fef3c7", "#92400e");
    }
    if (texto.includes("PAGADA")) {
      return styles.pillEstado("#dcfce7", "#166534");
    }
    return styles.pillEstado("#e5e7eb", "#374151");
  };

  const totalOrdenDesdeDetalles = () => {
    if (!detallesOrdenSeleccionada || detallesOrdenSeleccionada.length === 0)
      return 0;

    return detallesOrdenSeleccionada.reduce((acc, d) => {
      const prodId =
        d.id_producto && typeof d.id_producto === "object"
          ? d.id_producto.id_producto
          : d.id_producto;
      const producto = productos.find((p) => p.id_producto === prodId);

      const precioUnitario = d.precio_unitario ?? producto?.precio_venta ?? 0;
      const cantidad = d.cantidad ?? 0;
      const subtotal = d.subtotal ?? precioUnitario * cantidad;
      return acc + Number(subtotal);
    }, 0);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.headerRow}>
          <h2 style={styles.title}>Listado de órdenes</h2>
        </div>
        <p style={styles.subtitle}>
          Busca y filtra las órdenes por ID, estado, cliente, vendedor y rango
          de fechas. Haz clic en una fila para ver los detalles completos.
        </p>

        {mensaje && <div style={styles.statusTextOk}>{mensaje}</div>}
        {error && <div style={styles.statusTextError}>{error}</div>}

        {/* FILTROS */}
        <div style={styles.filtersGrid}>
          <div>
            <div style={styles.label}>ID de orden</div>
            <input
              type="number"
              style={styles.input}
              placeholder="Ej: 10"
              value={filtros.id}
              onChange={(e) => onChangeFiltro("id", e.target.value)}
            />
          </div>

          <div>
            <div style={styles.label}>Estado de envío</div>
            <select
              style={styles.select}
              value={filtros.estadoEnvio}
              onChange={(e) => onChangeFiltro("estadoEnvio", e.target.value)}
            >
              <option value="">Todos</option>
              <option value="PENDIENTE POR APROBACIÓN">
                Pendiente por aprobación
              </option>
              <option value="APROBADA">Aprobada</option>
              <option value="PREPARADA">Preparada</option>
              <option value="ASIGNADA A ENVÍO">Asignada a envío</option>
              <option value="EN ENVÍO">En envío</option>
              <option value="EN CURSO">En curso</option>
              <option value="ENTREGADA">Entregada</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </div>

          <div>
            <div style={styles.label}>Estado de pago</div>
            <select
              style={styles.select}
              value={filtros.estadoPago}
              onChange={(e) => onChangeFiltro("estadoPago", e.target.value)}
            >
              <option value="">Todos</option>
              <option value="PENDIENTE POR PAGO">Pendiente por pago</option>
              <option value="PAGADA">Pagada</option>
            </select>
          </div>

          <div>
            <div style={styles.label}>Cliente</div>
            <select
              style={styles.select}
              value={filtros.cliente}
              onChange={(e) => onChangeFiltro("cliente", e.target.value)}
            >
              <option value="">Todos</option>
              {clientes.map((c) => (
                <option key={c.id_cliente} value={c.nombre}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={styles.label}>Vendedor</div>
            <select
              style={styles.select}
              value={filtros.vendedor}
              onChange={(e) => onChangeFiltro("vendedor", e.target.value)}
            >
              <option value="">Todos</option>
              {vendedores.map((v) => (
                <option key={v.id_usuario || v.id} value={v.username}>
                  {v.username}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={styles.label}>Desde (fecha orden)</div>
            <input
              type="date"
              style={styles.input}
              value={filtros.desde}
              onChange={(e) => onChangeFiltro("desde", e.target.value)}
            />
          </div>

          <div>
            <div style={styles.label}>Hasta (fecha orden)</div>
            <input
              type="date"
              style={styles.input}
              value={filtros.hasta}
              onChange={(e) => onChangeFiltro("hasta", e.target.value)}
            />
          </div>

          <div>
            <div style={styles.label}>Ordenar por</div>
            <select
              style={styles.select}
              value={filtros.ordering}
              onChange={(e) => onChangeFiltro("ordering", e.target.value)}
            >
              <option value="-fecha_orden">Más recientes primero</option>
              <option value="fecha_orden">Más antiguas primero</option>
              <option value="-precio_final">Total mayor primero</option>
              <option value="precio_final">Total menor primero</option>
            </select>
          </div>

          <div>
            <div style={styles.label}> </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                type="button"
                style={styles.buttonGhost}
                onClick={limpiarFiltros}
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>

        <div style={styles.filtersActions}>
          <button
            type="button"
            style={styles.buttonPrimary}
            onClick={() => cargarOrdenes(true)}
            disabled={loading}
          >
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </div>

        {/* TABLA */}
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Cliente</th>
                <th style={styles.th}>Método pago</th>
                <th style={styles.th}>Fecha orden</th>
                <th style={styles.th}>Estado envío</th>
                <th style={styles.th}>Estado pago</th>
                <th style={styles.th}>Total (Bs)</th>
                <th style={styles.th}>Cancelada</th>
              </tr>
            </thead>
            <tbody>
              {ordenes.length === 0 && !loading && (
                <tr>
                  <td style={styles.td} colSpan={8}>
                    No hay órdenes que coincidan con los filtros.
                  </td>
                </tr>
              )}

              {ordenes.map((o, idx) => {
                const rowStyle =
                  idx % 2 === 1
                    ? { ...styles.td, ...styles.rowAlt }
                    : styles.td;

                return (
                  <tr
                    key={o.id_orden}
                    onClick={() => verDetallesOrden(o.id_orden)}
                    style={{ cursor: "pointer" }}
                  >
                    <td style={rowStyle}>{o.id_orden}</td>
                    <td style={rowStyle}>{nombreCliente(o.id_cliente)}</td>
                    <td style={rowStyle}>{o.metodo_pago}</td>
                    <td style={rowStyle}>{o.fecha_orden}</td>
                    <td style={rowStyle}>
                      <span style={pillEstadoEnvio(o.estado_de_envio)}>
                        {o.estado_de_envio}
                      </span>
                    </td>
                    <td style={rowStyle}>
                      <span style={pillEstadoPago(o.estado_de_pago)}>
                        {o.estado_de_pago}
                      </span>
                    </td>
                    <td style={rowStyle}>
                      {Number(o.precio_final || 0).toFixed(2)}
                    </td>
                    <td style={rowStyle}>
                      {o.cancelacion ? (
                        <span style={styles.pillCancelada}>Sí</span>
                      ) : (
                        "No"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {ordenes.length > 0 && (
          <div style={styles.resumenResultados}>
            Mostrando {ordenes.length} orden(es). Haz clic en una fila para ver
            el detalle.
          </div>
        )}

        {(ordenSeleccionada || loadingDetalle || errorDetalle) && (
          <div style={styles.detalleCard}>
            {loadingDetalle && (
              <div style={styles.detalleLine}>
                Cargando detalles de la orden...
              </div>
            )}

            {errorDetalle && (
              <div style={{ ...styles.detalleLine, color: "#b91c1c" }}>
                {errorDetalle}
              </div>
            )}

            {ordenSeleccionada && !loadingDetalle && !errorDetalle && (
              <>
                <div style={styles.detalleTitle}>
                  Detalles de la orden #{ordenSeleccionada.id_orden}
                </div>

                <div style={styles.detalleSectionTitle}>
                  Información general
                </div>
                <div style={styles.detalleLine}>
                  <strong>Cliente:</strong>{" "}
                  {nombreCliente(ordenSeleccionada.id_cliente)}
                </div>
                <div style={styles.detalleLine}>
                  <strong>Vendedor:</strong>{" "}
                  {nombreVendedor(ordenSeleccionada.id_usuario)}
                </div>
                <div style={styles.detalleLine}>
                  <strong>Método de pago:</strong>{" "}
                  {ordenSeleccionada.metodo_pago}
                </div>
                <div style={styles.detalleLine}>
                  <strong>Fecha de orden:</strong>{" "}
                  {ordenSeleccionada.fecha_orden}
                </div>
                <div style={styles.detalleLine}>
                  <strong>Estado de envío:</strong>{" "}
                  <span style={pillEstadoEnvio(ordenSeleccionada.estado_de_envio)}>
                    {ordenSeleccionada.estado_de_envio}
                  </span>
                </div>
                <div style={styles.detalleLine}>
                  <strong>Estado de pago:</strong>{" "}
                  <span style={pillEstadoPago(ordenSeleccionada.estado_de_pago)}>
                    {ordenSeleccionada.estado_de_pago}
                  </span>
                </div>
                <div style={styles.detalleLine}>
                  <strong>Cancelada:</strong>{" "}
                  {ordenSeleccionada.cancelacion ? "Sí" : "No"}
                </div>

                <div style={styles.detalleSectionTitle}>
                  Productos de la orden
                </div>
                {detallesOrdenSeleccionada.length === 0 ? (
                  <div style={styles.detalleLine}>
                    No se encontraron detalles de productos para esta orden.
                  </div>
                ) : (
                  <table style={styles.detalleTable}>
                    <thead>
                      <tr>
                        <th style={styles.detalleTh}>Producto</th>
                        <th style={styles.detalleTh}>Cantidad</th>
                        <th style={styles.detalleTh}>Precio unitario (Bs)</th>
                        <th style={styles.detalleTh}>Subtotal (Bs)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detallesOrdenSeleccionada.map((d) => {
                        const prodId =
                          d.id_producto && typeof d.id_producto === "object"
                            ? d.id_producto.id_producto
                            : d.id_producto;
                        const producto = productos.find(
                          (p) => p.id_producto === prodId
                        );

                        const nombreProd =
                          producto?.nombre ||
                          (d.id_producto && typeof d.id_producto === "object"
                            ? d.id_producto.nombre
                            : `#${prodId}`);

                        const cantidad = d.cantidad ?? 0;
                        const precioUnitario =
                          d.precio_unitario ?? producto?.precio_venta ?? 0;
                        const subtotal =
                          d.subtotal ?? precioUnitario * cantidad;

                        return (
                          <tr
                            key={d.id_detalleo || `${prodId}-${cantidad}`}
                          >
                            <td style={styles.detalleTd}>{nombreProd}</td>
                            <td style={styles.detalleTd}>{cantidad}</td>
                            <td style={styles.detalleTd}>
                              {Number(precioUnitario).toFixed(2)}
                            </td>
                            <td style={styles.detalleTd}>
                              {Number(subtotal).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}

                <div
                  style={{
                    ...styles.detalleLine,
                    marginTop: "6px",
                    fontWeight: 600,
                  }}
                >
                  Total de la orden: Bs{" "}
                  {totalOrdenDesdeDetalles().toFixed(2)}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}