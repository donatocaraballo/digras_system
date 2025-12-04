import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

// Estilos simples en JS (sin CSS externo)
const styles = {
  page: {
    minHeight: "100vh",
    margin: 0,
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f4f5fb",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "960px",
    background: "#ffffff",
    borderRadius: "14px",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.12)",
    padding: "24px 28px 28px",
    boxSizing: "border-box",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "4px",
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
  formGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)",
    gap: "18px",
    marginBottom: "16px",
  },
  section: {
    background: "#f9fafb",
    borderRadius: "12px",
    padding: "14px 16px 12px",
    boxSizing: "border-box",
    border: "1px solid #e5e7eb",
  },
  sectionTitle: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#374151",
    marginBottom: "10px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "12px",
    fontWeight: 500,
    color: "#4b5563",
  },
  select: {
    height: "38px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    padding: "0 10px",
    fontSize: "13px",
    outline: "none",
    backgroundColor: "#ffffff",
  },
  input: {
    height: "38px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    padding: "0 10px",
    fontSize: "13px",
    outline: "none",
  },
  productsSection: {
    marginTop: "6px",
    background: "#f9fafb",
    borderRadius: "12px",
    padding: "14px 16px 14px",
    border: "1px solid #e5e7eb",
  },
  productsHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  productsTitle: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#374151",
  },
  addButtonGhost: {
    border: "none",
    background: "transparent",
    color: "#2563eb",
    fontSize: "12px",
    fontWeight: 500,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
  },
  productRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 2.2fr) 90px 72px",
    gap: "8px",
    alignItems: "center",
    marginBottom: "4px",
  },
  smallButton: {
    height: "32px",
    borderRadius: "999px",
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    fontSize: "12px",
    cursor: "pointer",
  },
  footerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "18px",
  },
  statusText: {
    fontSize: "13px",
  },
  statusOk: {
    color: "#15803d",
  },
  statusError: {
    color: "#b91c1c",
  },
  primaryButton: {
    border: "none",
    borderRadius: "999px",
    padding: "0 18px",
    height: "38px",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 500,
    boxShadow: "0 10px 25px rgba(37, 99, 235, 0.35)",
  },
  existenciaLine: {
    fontSize: "11px",
    marginTop: "2px",
    paddingLeft: "2px",
  },
  lowStockBadge: {
    display: "inline-block",
    marginLeft: "6px",
    padding: "2px 8px",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: 600,
    background: "#f97316",
    color: "#fff7ed",
  },
  priceLine: {
    fontSize: "11px",
    color: "#4b5563",
    marginTop: "2px",
    paddingLeft: "2px",
  },
  totalRow: {
    marginTop: "12px",
    display: "flex",
    justifyContent: "flex-end",
    fontSize: "13px",
    fontWeight: 600,
    color: "#111827",
  },
  resumenCard: {
    marginTop: "20px",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#f9fafb",
    fontSize: "12px",
    color: "#111827",
  },
  resumenTitle: {
    fontSize: "13px",
    fontWeight: 600,
    marginBottom: "8px",
  },
  resumenLine: {
    marginBottom: "2px",
  },
};

export default function CrearOrden() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [existencias, setExistencias] = useState({});

  const [clienteSeleccionado, setClienteSeleccionado] = useState("");
  const [metodoPago, setMetodoPago] = useState("Transferencia");
  const [detalles, setDetalles] = useState([{ producto_id: "", cantidad: 1 }]);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [resumenOrden, setResumenOrden] = useState(null);

  const [mostrarNuevoCliente, setMostrarNuevoCliente] = useState(false);
  const [nuevoClienteNombre, setNuevoClienteNombre] = useState("");
  const [nuevoClienteDireccion, setNuevoClienteDireccion] = useState("");
  const [nuevoClienteCorreo, setNuevoClienteCorreo] = useState("");
  const [nuevoClienteTelefono, setNuevoClienteTelefono] = useState("");
  const [nuevoClienteMensaje, setNuevoClienteMensaje] = useState("");
  const [nuevoClienteError, setNuevoClienteError] = useState("");

  // Cargar clientes, productos y existencias al montar
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // 1. Obtener el token para la autenticación (Evita el error 401)
        const token = localStorage.getItem('auth_token');
        const config = {
            headers: { Authorization: `Token ${token}` }
        };

        // 2. Peticiones con las URLs CORRECTAS y el Token
        const [resClientes, resProductos, resExistencias] = await Promise.all([
          api.get("/base/clientes/", config),        // 🚨 CORREGIDO: Antes era /clientes/
          api.get("/inventario/productos/", config), // 🚨 CORREGIDO: URL completa
          api.get("/inventario/existencias/", config),
        ]);

        setClientes(resClientes.data);
        setProductos(resProductos.data);

        // Construir un mapa producto -> cantidad de existencia
        const mapaExistencias = {};
        resExistencias.data.forEach((ex) => {
          // id_producto puede venir como entero o como objeto anidado según el serializer
          const prodId =
            ex.id_producto && typeof ex.id_producto === "object"
              ? ex.id_producto.id_producto
              : ex.id_producto;
          if (prodId != null) {
            mapaExistencias[prodId] = ex.cantidad;
          }
        });
        setExistencias(mapaExistencias);
      } catch (err) {
        console.error("Error cargando datos:", err);
        // Manejo mejorado del error para saber qué pasó
        const msg = err.response?.status === 404 
            ? "Error 404: No se encontró el endpoint (Verifica URLs)" 
            : "No se pudieron cargar los datos.";
        setError(msg);
      }
    };

    cargarDatos();
  }, []);

  const handleChangeDetalle = (index, field, value) => {
    const copia = [...detalles];
    copia[index][field] = value;
    setDetalles(copia);
  };

  const agregarLinea = () => {
    setDetalles([...detalles, { producto_id: "", cantidad: 1 }]);
  };

  const quitarLinea = (index) => {
    const copia = [...detalles];
    copia.splice(index, 1);
    setDetalles(copia);
  };

  const obtenerProducto = (productoId) => {
    if (!productoId) return null;
    const idNum = Number(productoId);
    return productos.find((p) => p.id_producto === idNum) || null;
  };

  const calcularSubtotal = (det) => {
    const prod = obtenerProducto(det.producto_id);
    if (!prod) return 0;
    const precio = Number(prod.precio_venta || 0);
    const cant = Number(det.cantidad || 0);
    return precio * cant;
  };

  const totalOrden = detalles.reduce((acc, det) => acc + calcularSubtotal(det), 0);

  const crearNuevoCliente = async () => {
    setNuevoClienteMensaje("");
    setNuevoClienteError("");

    if (
      !nuevoClienteNombre ||
      !nuevoClienteDireccion ||
      !nuevoClienteCorreo ||
      !nuevoClienteTelefono
    ) {
      setNuevoClienteError("Completa todos los datos del nuevo cliente.");
      return;
    }

    try {
      const payload = {
        nombre: nuevoClienteNombre,
        direccion: nuevoClienteDireccion,
        correo: nuevoClienteCorreo,
        telefono: nuevoClienteTelefono,
      };

      const res = await api.post("/base/clientes/", payload);
      const nuevo = res.data;

      // Agregar a la lista de clientes y seleccionarlo
      setClientes((prev) => [...prev, nuevo]);
      setClienteSeleccionado(nuevo.id_cliente);

      setMostrarNuevoCliente(false);
      setNuevoClienteMensaje("Cliente creado correctamente.");
      setNuevoClienteNombre("");
      setNuevoClienteDireccion("");
      setNuevoClienteCorreo("");
      setNuevoClienteTelefono("");
    } catch (err) {
      console.error("Error creando cliente:", err);
      const data = err.response?.data;
      let backendMsg =
        data?.detail || data?.error;
      
      if (!backendMsg && data && typeof data === "object") {
        const firstKey = Object.keys(data)[0];
        const firstVal = data[firstKey];
        if (Array.isArray(firstVal) && firstVal.length > 0) {
          backendMsg = firstVal[0];
        }
      }
      
      setNuevoClienteError(
        backendMsg || "No se pudo crear el cliente. Revisa los datos."
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");
    setResumenOrden(null);

    // Validación: no permitir cantidades mayores a la existencia
    for (const d of detalles) {
      const prodIdNumber = d.producto_id ? Number(d.producto_id) : null;
      const existenciaActual =
        prodIdNumber != null ? existencias[prodIdNumber] : null;
      const cantidad = Number(d.cantidad || 0);

      if (
        prodIdNumber != null &&
        existenciaActual != null &&
        cantidad > existenciaActual
      ) {
        const prod = obtenerProducto(d.producto_id);
        const nombreProd = prod ? prod.nombre : "producto seleccionado";
        setError(
          `La cantidad para ${nombreProd} (${cantidad}) supera la existencia disponible (${existenciaActual}).`
        );
        return;
      }
    }

    try {
      const payload = {
        metodo_pago: metodoPago,
        id_cliente: Number(clienteSeleccionado),
        detalles: detalles.map((d) => ({
          id_producto: Number(d.producto_id),
          cantidad: Number(d.cantidad),
        })),
      };
      // ... resto de tu handleSubmit igual

      const res = await api.post("/ordenes/", payload);

      // Construir resumen local basado en los datos del formulario
      const clienteObj = clientes.find(
        (c) => c.id_cliente === Number(clienteSeleccionado)
      );
      const lineasResumen = detalles.map((d) => {
        const prod = obtenerProducto(d.producto_id);
        const precio = prod ? Number(prod.precio_venta || 0) : 0;
        const cant = Number(d.cantidad || 0);
        const subtotal = precio * cant;
        return {
          nombre: prod ? prod.nombre : "(Producto desconocido)",
          cantidad: cant,
          precio,
          subtotal,
        };
      });
      const totalResumen = lineasResumen.reduce(
        (acc, l) => acc + l.subtotal,
        0
      );

      setResumenOrden({
        id_orden: res.data.id_orden,
        cliente: clienteObj ? clienteObj.nombre : "",
        metodo_pago: metodoPago,
        lineas: lineasResumen,
        total: totalResumen,
      });

      setMensaje(`Orden creada correctamente. ID: ${res.data.id_orden}`);
      // opcional: resetear formulario ligero (dejamos cliente y método para agilizar)
      setDetalles([{ producto_id: "", cantidad: 1 }]);
    } catch (err) {
      console.error("Error creando orden:", err);

      // Si el backend responde 403 con un mensaje específico
      const status = err.response?.status;
      const backendMsg = err.response?.data?.error;
      if (status === 403 && backendMsg) {
        setError(backendMsg);
      } else {
        setError("No se pudo crear la orden. Revisa los datos o el token.");
      }
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.headerRow}>
          <h2 style={styles.title}>Crear orden</h2>
        </div>
        <p style={styles.subtitle}>
          Registra una nueva orden seleccionando el cliente, el método de pago y los
          productos con sus cantidades.
        </p>

        {mensaje && (
          <p style={{ ...styles.statusText, ...styles.statusOk }}>{mensaje}</p>
        )}
        {error && (
          <p style={{ ...styles.statusText, ...styles.statusError }}>{error}</p>
        )}

        <form onSubmit={handleSubmit}>
          {/* Sección superior: Cliente y Pago */}
          <div style={styles.formGrid}>
          <div style={styles.fieldGroup}>
                <label style={styles.label}>Cliente</label>
                <select
                  style={styles.select}
                  value={clienteSeleccionado}
                  onChange={(e) => setClienteSeleccionado(e.target.value)}
                  required
                >
                  <option value="">Selecciona un cliente</option>
                  {clientes.map((c) => (
                    <option key={c.id_cliente} value={c.id_cliente}>
                      {c.nombre}
                    </option>
                  ))}
                </select>

                <div
                  style={{
                    marginTop: "6px",
                    fontSize: "11px",
                    color: "#6b7280",
                  }}
                >
                  ¿El cliente no existe?
                  <button
                    type="button"
                    onClick={() => setMostrarNuevoCliente((v) => !v)}
                    style={{
                      marginLeft: "6px",
                      border: "none",
                      background: "transparent",
                      color: "#2563eb",
                      cursor: "pointer",
                      fontSize: "11px",
                      textDecoration: "underline",
                      padding: 0,
                    }}
                  >
                    {mostrarNuevoCliente ? "Cancelar" : "Agregar nuevo cliente"}
                  </button>
                </div>

                {mostrarNuevoCliente && (
                  <div
                    style={{
                      marginTop: "8px",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      background: "#eef2ff",
                      border: "1px solid #c7d2fe",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#3730a3",
                      }}
                    >
                      Nuevo cliente rápido
                    </div>
                    <input
                      style={styles.input}
                      placeholder="Nombre del cliente"
                      value={nuevoClienteNombre}
                      onChange={(e) => setNuevoClienteNombre(e.target.value)}
                    />
                    <input
                      style={styles.input}
                      placeholder="Dirección"
                      value={nuevoClienteDireccion}
                      onChange={(e) =>
                        setNuevoClienteDireccion(e.target.value)
                      }
                    />
                    <input
                      style={styles.input}
                      placeholder="Correo"
                      value={nuevoClienteCorreo}
                      onChange={(e) => setNuevoClienteCorreo(e.target.value)}
                    />
                    <input
                      style={styles.input}
                      placeholder="Teléfono"
                      value={nuevoClienteTelefono}
                      onChange={(e) => setNuevoClienteTelefono(e.target.value)}
                    />

                    {nuevoClienteError && (
                      <div
                        style={{ fontSize: "11px", color: "#b91c1c" }}
                      >
                        {nuevoClienteError}
                      </div>
                    )}
                    {nuevoClienteMensaje && (
                      <div
                        style={{ fontSize: "11px", color: "#15803d" }}
                      >
                        {nuevoClienteMensaje}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={crearNuevoCliente}
                      style={{
                        alignSelf: "flex-start",
                        marginTop: "4px",
                        padding: "4px 12px",
                        borderRadius: "999px",
                        border: "none",
                        background: "#4f46e5",
                        color: "#ffffff",
                        fontSize: "11px",
                        cursor: "pointer",
                      }}
                    >
                      Guardar cliente
                    </button>
                  </div>
                )}
              </div>

            <div style={styles.section}>
              <div style={styles.sectionTitle}>Datos de pago</div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Método de pago</label>
                <input
                  style={styles.input}
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  placeholder="Transferencia, Pago móvil, Efectivo..."
                />
              </div>
            </div>
          </div>

          {/* Sección productos */}
          <div style={styles.productsSection}>
            <div style={styles.productsHeaderRow}>
              <span style={styles.productsTitle}>Productos de la orden</span>
              <button
                type="button"
                style={styles.addButtonGhost}
                onClick={agregarLinea}
              >
                <span>＋</span>
                <span>Agregar producto</span>
              </button>
            </div>

            {detalles.map((det, idx) => {
              const prodIdNumber = det.producto_id
                ? Number(det.producto_id)
                : null;
              const existenciaActual =
                prodIdNumber != null ? existencias[prodIdNumber] : null;
              const prod = obtenerProducto(det.producto_id);
              const precioUnitario = prod ? Number(prod.precio_venta || 0) : 0;
              const subtotal = calcularSubtotal(det);

              // Estilo dinámico para existencia
              let existenciaStyle = { ...styles.existenciaLine, color: "#6b7280" };
              if (det.producto_id && existenciaActual != null) {
                if (existenciaActual === 0) {
                  existenciaStyle.color = "#b91c1c"; // rojo
                } else if (existenciaActual < 5) {
                  existenciaStyle.color = "#b45309"; // ámbar
                }
              }

              return (
                <div key={idx} style={{ marginBottom: "10px" }}>
                  <div style={styles.productRow}>
                    <select
                      style={styles.select}
                      value={det.producto_id}
                      onChange={(e) =>
                        handleChangeDetalle(idx, "producto_id", e.target.value)
                      }
                      required
                    >
                      <option value="">Selecciona un producto</option>
                      {productos.map((p) => (
                        <option key={p.id_producto} value={p.id_producto}>
                          {p.nombre}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      max={existenciaActual != null ? existenciaActual : undefined}
                      style={styles.input}
                      value={det.cantidad}
                      onChange={(e) =>
                        handleChangeDetalle(idx, "cantidad", e.target.value)
                      }
                      required
                    />

                    {detalles.length > 1 && (
                      <button
                        type="button"
                        style={styles.smallButton}
                        onClick={() => quitarLinea(idx)}
                      >
                        Quitar
                      </button>
                    )}
                  </div>

                  {/* Línea de existencia */}
                  <div style={existenciaStyle}>
                    {det.producto_id ? (
                      existenciaActual != null ? (
                        <>
                          Existencia actual: {existenciaActual} unidades
                          {existenciaActual > 0 && existenciaActual < 5 && (
                            <span style={styles.lowStockBadge}>Stock bajo</span>
                          )}
                        </>
                      ) : (
                        <>Sin dato de existencia para este producto.</>
                      )
                    ) : (
                      <>Selecciona un producto para ver su existencia.</>
                    )}
                  </div>

                  {/* Línea de precios */}
                  <div style={styles.priceLine}>
                    {prod ? (
                      <>
                        Precio unitario: Bs {precioUnitario.toFixed(2)} · Subtotal: Bs {" "}
                        {subtotal.toFixed(2)}
                      </>
                    ) : (
                      <>Selecciona un producto para ver su precio.</>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Total acumulado de la orden */}
            <div style={styles.totalRow}>
              Total estimado de la orden: Bs {totalOrden.toFixed(2)}
            </div>
          </div>

          <div style={styles.footerRow}>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              Revisa bien el cliente, método de pago y productos antes de
              registrar la orden.
            </div>
            <button type="submit" style={styles.primaryButton}>
              Crear orden
            </button>
          </div>
        </form>

        {/* Resumen de la orden creada */}
        {resumenOrden && (
          <div style={styles.resumenCard}>
            <div style={styles.resumenTitle}>
              Resumen de la orden #{resumenOrden.id_orden}
            </div>
            <div style={styles.resumenLine}>
              <strong>Cliente:</strong> {resumenOrden.cliente || "(sin nombre)"}
            </div>
            <div style={styles.resumenLine}>
              <strong>Método de pago:</strong> {resumenOrden.metodo_pago}
            </div>
            <div style={{ ...styles.resumenLine, marginTop: "6px" }}>
              <strong>Productos:</strong>
            </div>
            {resumenOrden.lineas.map((l, idx) => (
              <div key={idx} style={styles.resumenLine}>
                • {l.nombre} — {l.cantidad} x Bs {l.precio.toFixed(2)} = Bs{" "}
                {l.subtotal.toFixed(2)}
              </div>
            ))}
            <div
              style={{ ...styles.resumenLine, marginTop: "6px", fontWeight: 600 }}
            >
              Total: Bs {resumenOrden.total.toFixed(2)}
            </div>

            <button
              type="button"
              onClick={() => navigate("/")}
              style={{
                marginTop: "10px",
                padding: "6px 14px",
                borderRadius: "999px",
                border: "1px solid #d1d5db",
                background: "#ffffff",
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              Volver al inicio
            </button>
          </div>
        )}
      </div>
    </div>
  );
}