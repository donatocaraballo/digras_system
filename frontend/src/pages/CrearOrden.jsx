// frontend/src/pages/CrearOrden.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

// --- ICONOS SVG (Estilo Unificado) ---
const IconClipboard = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
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
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const IconTrash = () => (
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
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

// --- CONST: Métodos de pago predefinidos ---
const METODOS_PAGO = [
  "Efectivo",
  "Pago móvil",
  "Transferencia internacional",
  "Transferencia nacional",
];

// --- Helper para extraer mensajes de error del backend ---
const getErrorMessageFromResponse = (err, defaultMsg) => {
  const data = err?.response?.data;
  if (!data) return defaultMsg;

  if (typeof data === "string") return data;

  if (data.detail) return data.detail;
  if (data.error) return data.error;
  if (data.mensaje) return data.mensaje;

  if (Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0) {
    return data.non_field_errors.join(" ");
  }

  if (typeof data === "object") {
    const keys = Object.keys(data);
    if (keys.length > 0) {
      const firstKey = keys[0];
      const val = data[firstKey];
      if (Array.isArray(val) && val.length > 0) return val[0];
      if (typeof val === "string") return val;
    }
  }

  return defaultMsg;
};

// --- ESTILOS PREMIUM DIGRAS ---
const styles = {
  // Contenedor y Card Principal
  container: {
    padding: "24px 32px",
    maxWidth: "1400px",
    margin: "0 auto",
    fontFamily: "'Inter', sans-serif",
  },
  content: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
    overflow: "hidden",
    border: "1px solid #f1f5f9",
    padding: "30px",
  },

  // Header
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
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

  // Inputs y Selects
  label: {
    display: "block",
    fontSize: "0.75rem",
    fontWeight: "700",
    color: "#475569",
    marginBottom: "6px",
    textTransform: "uppercase",
  },
  input: {
    width: "100%",
    height: "42px",
    padding: "0 12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "0.9rem",
    outline: "none",
    backgroundColor: "#fff",
    boxSizing: "border-box",
    transition: "border 0.2s",
  },
  inputSmall: {
    width: "100%",
    height: "36px",
    padding: "0 10px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "0.8rem",
    outline: "none",
    backgroundColor: "#fff",
    boxSizing: "border-box",
    marginBottom: "8px",
  },
  select: {
    width: "100%",
    height: "42px",
    padding: "0 12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "0.9rem",
    outline: "none",
    backgroundColor: "#fff",
    boxSizing: "border-box",
  },

  // Grid de Formulario
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "24px",
    marginBottom: "30px",
  },
  section: {
    backgroundColor: "#f8fafc",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
  },
  sectionTitle: {
    margin: "0 0 15px 0",
    fontSize: "0.85rem",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
  },

  // Botones
  btnPrimary: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "12px 24px",
    backgroundColor: "#0f172a",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "0.95rem",
    transition: "transform 0.1s, opacity 0.1s",
  },
  btnGhost: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    backgroundColor: "transparent",
    color: "#64748b",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  btnSecondary: {
    background: "#eff6ff",
    color: "#2563eb",
    border: "none",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "0.85rem",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  },
  btnIcon: {
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #fecaca",
    backgroundColor: "#fef2f2",
    color: "#ef4444",
    borderRadius: "8px",
    cursor: "pointer",
  },

  // Productos
  productsSection: {
    marginTop: "20px",
    borderTop: "1px solid #e2e8f0",
    paddingTop: "20px",
  },
  productsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "20px",
  },

  productRow: {
    display: "grid",
    gridTemplateColumns: "3fr 1fr 50px",
    gap: "15px",
    alignItems: "flex-start",
    marginBottom: "15px",
    padding: "15px",
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #f1f5f9",
  },

  // Info extra
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.85rem",
    color: "#64748b",
    marginTop: "8px",
    paddingLeft: "4px",
  },
  infoRowWarning: {
    display: "flex",
    justifyContent: "flex-start",
    fontSize: "0.78rem",
    color: "#b91c1c",
    marginTop: "6px",
    paddingLeft: "4px",
  },
  totalRow: {
    marginTop: "30px",
    padding: "20px",
    backgroundColor: "#f0f9ff",
    borderRadius: "12px",
    fontSize: "1rem",
    fontWeight: "700",
    color: "#0369a1",
    border: "1px solid #bae6fd",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
  },

  // Mensajes y Badges
  statusOk: {
    padding: "12px",
    background: "#dcfce7",
    color: "#166534",
    borderRadius: "8px",
    marginBottom: "20px",
    border: "1px solid #bbf7d0",
    fontSize: "0.9rem",
  },
  statusError: {
    padding: "12px",
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: "8px",
    marginBottom: "20px",
    border: "1px solid #fecaca",
    fontSize: "0.9rem",
  },
  statusInfo: {
    padding: "10px 12px",
    background: "#e0f2fe",
    color: "#0369a1",
    borderRadius: "8px",
    marginBottom: "20px",
    border: "1px solid #bae6fd",
    fontSize: "0.85rem",
  },

  // Modal Interno (Nuevo Cliente)
  nestedCard: {
    marginTop: "15px",
    padding: "20px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    border: "1px dashed #cbd5e1",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
  },

  // Resumen Final
  resumenCard: {
    marginTop: "30px",
    padding: "30px",
    backgroundColor: "#f8fafc",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
  },
  resumenTitle: {
    fontSize: "1.1rem",
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "20px",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: "10px",
  },
  resumenLine: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "10px",
    fontSize: "0.95rem",
    color: "#334155",
  },
};

export default function CrearOrden() {
  const navigate = useNavigate();

  // Usuario autenticado
  const [usuario] = useState(() => {
    try {
      const raw =
        localStorage.getItem("user_data") ||
        localStorage.getItem("auth_user") ||
        localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.error("Error parseando usuario desde localStorage:", err);
      return null;
    }
  });

  const esVendedor = usuario && usuario.tipo === "VENDEDOR";
  const [permisoError, setPermisoError] = useState("");

  // Datos base
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [existencias, setExistencias] = useState({});

  const [loadingDatos, setLoadingDatos] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // Formulario orden
  const [clienteSeleccionado, setClienteSeleccionado] = useState("");
  const [metodoPago, setMetodoPago] = useState(METODOS_PAGO[0]);
  const [detalles, setDetalles] = useState([
    { producto_id: "", cantidad: 1, filtro: "" },
  ]);

  // 🔎 Buscador de clientes
  const [filtroCliente, setFiltroCliente] = useState("");

  // Mensajes
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [resumenOrden, setResumenOrden] = useState(null);

  // Nuevo cliente
  const [mostrarNuevoCliente, setMostrarNuevoCliente] = useState(false);
  const [nuevoClienteNombre, setNuevoClienteNombre] = useState("");
  const [nuevoClienteDireccion, setNuevoClienteDireccion] = useState("");
  const [nuevoClienteCorreo, setNuevoClienteCorreo] = useState("");
  const [nuevoClienteTelefono, setNuevoClienteTelefono] = useState("");
  const [nuevoClienteMensaje, setNuevoClienteMensaje] = useState("");
  const [nuevoClienteError, setNuevoClienteError] = useState("");

  // Control de cambios sin guardar
  const [tieneCambios, setTieneCambios] = useState(false);
  const marcarCambio = () => {
    if (!tieneCambios) setTieneCambios(true);
  };

  // Verificación de permisos (refuerzo frontend)
  useEffect(() => {
    if (!usuario) {
      setPermisoError(
        "No se encontró información del usuario. Inicia sesión nuevamente."
      );
      return;
    }
    if (!esVendedor) {
      setPermisoError(
        "Solo los usuarios de tipo VENDEDOR pueden crear órdenes de venta."
      );
    }
  }, [usuario, esVendedor]);

  // Aviso al recargar/cerrar si hay cambios sin guardar
  useEffect(() => {
    const handler = (event) => {
      if (!tieneCambios || resumenOrden) return;
      event.preventDefault();
      event.returnValue =
        "Tienes cambios sin guardar en la orden. ¿Seguro que quieres salir?";
      return event.returnValue;
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [tieneCambios, resumenOrden]);

  // Cargar clientes, productos y existencias solo si es VENDEDOR
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoadingDatos(true);
        setError("");
        const token = localStorage.getItem("auth_token");
        if (!token) {
          setError(
            "No se encontró token de autenticación. Inicia sesión nuevamente."
          );
          setLoadingDatos(false);
          return;
        }

        const config = { headers: { Authorization: `Token ${token}` } };

        const [resClientes, resProductos, resExistencias] = await Promise.all([
          api.get("/base/clientes/", config),
          // 🚨 MODIFICADO: AÑADIDO ?activo=true PARA SOLO TRAER PRODUCTOS ACTIVOS
          api.get("/inventario/productos/?activo=true", config),
          api.get("/inventario/existencias/", config),
        ]);

        setClientes(resClientes.data || []);
        setProductos(resProductos.data || []);

        const mapaExistencias = {};
        (resExistencias.data || []).forEach((ex) => {
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
        const msg = getErrorMessageFromResponse(
          err,
          "No se pudieron cargar los datos necesarios para crear la orden."
        );
        setError(msg);
      } finally {
        setLoadingDatos(false);
      }
    };

    if (esVendedor) {
      cargarDatos();
    }
  }, [esVendedor]);

  // Helpers productos
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
    if (Number.isNaN(precio) || Number.isNaN(cant)) return 0;
    return precio * cant;
  };

  const totalOrden = detalles.reduce(
    (acc, det) => acc + calcularSubtotal(det),
    0
  );

  const totalItems = detalles.reduce(
    (acc, det) => acc + (Number(det.cantidad) || 0),
    0
  );

  const handleChangeDetalle = (index, field, value) => {
    marcarCambio();
    setDetalles((prev) => {
      const copia = [...prev];
      copia[index] = { ...copia[index], [field]: value };
      return copia;
    });
  };

  const agregarLinea = () => {
    marcarCambio();
    setDetalles((prev) => [
      ...prev,
      { producto_id: "", cantidad: 1, filtro: "" },
    ]);
  };

  const quitarLinea = (index) => {
    marcarCambio();
    setDetalles((prev) => {
      const copia = [...prev];
      copia.splice(index, 1);
      return copia.length > 0
        ? copia
        : [{ producto_id: "", cantidad: 1, filtro: "" }];
    });
  };

  // Crear nuevo cliente
  const crearNuevoCliente = async () => {
    setNuevoClienteMensaje("");
    setNuevoClienteError("");
    marcarCambio();

    if (
      !nuevoClienteNombre ||
      !nuevoClienteDireccion ||
      !nuevoClienteCorreo ||
      !nuevoClienteTelefono
    ) {
      setNuevoClienteError("Completa todos los datos del nuevo cliente.");
      return;
    }

    // Validación sencilla de correo
    const emailRegex = /.+@.+\..+/;
    if (!emailRegex.test(nuevoClienteCorreo)) {
      setNuevoClienteError("Ingresa un correo electrónico válido.");
      return;
    }

    try {
      const payload = {
        nombre: nuevoClienteNombre,
        direccion: nuevoClienteDireccion,
        correo: nuevoClienteCorreo,
        telefono: nuevoClienteTelefono,
      };

      const token = localStorage.getItem("auth_token");
      const config = token
        ? { headers: { Authorization: `Token ${token}` } }
        : undefined;

      const res = await api.post("/base/clientes/", payload, config);
      const nuevo = res.data;

      setClientes((prev) => [...prev, nuevo]);
      setClienteSeleccionado(String(nuevo.id_cliente));

      setMostrarNuevoCliente(false);
      setNuevoClienteMensaje("Cliente creado correctamente.");
      setNuevoClienteNombre("");
      setNuevoClienteDireccion("");
      setNuevoClienteCorreo("");
      setNuevoClienteTelefono("");
    } catch (err) {
      console.error("Error al crear cliente:", err);
      const backendMsg = getErrorMessageFromResponse(
        err,
        "Error al crear el cliente."
      );
      setNuevoClienteError(backendMsg);
    }
  };

  // Crear orden
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");
    setResumenOrden(null);

    if (!esVendedor) {
      setError(
        "No tienes permisos para crear órdenes. Solo los vendedores pueden realizar esta acción."
      );
      return;
    }

    if (!clienteSeleccionado) {
      setError("Debes seleccionar un cliente para la orden.");
      return;
    }

    const clienteValido = clientes.some(
      (c) => c.id_cliente === Number(clienteSeleccionado)
    );
    if (!clienteValido) {
      setError("El cliente seleccionado no es válido.");
      return;
    }

    // Validar que haya al menos una línea con producto seleccionado
    const lineasValidas = detalles.filter((d) => {
      const cantidadNum = Number(d.cantidad);
      return d.producto_id && cantidadNum > 0 && !Number.isNaN(cantidadNum);
    });

    if (lineasValidas.length === 0) {
      setError(
        "Agrega al menos un producto con cantidad mayor que cero para crear la orden."
      );
      return;
    }

    // Validar duplicados de producto
    const idsProductos = lineasValidas.map((d) => Number(d.producto_id));
    const setIds = new Set();
    for (const id of idsProductos) {
      if (setIds.has(id)) {
        setError(
          "Tienes productos repetidos en la orden. Ajusta las cantidades en una sola línea por producto."
        );
        return;
      }
      setIds.add(id);
    }

    // Validar stock para cada línea
    for (const d of lineasValidas) {
      const prodIdNumber = d.producto_id ? Number(d.producto_id) : null;
      const existenciaActual =
        prodIdNumber != null ? existencias[prodIdNumber] : null;
      const cantidad = Number(d.cantidad || 0);

      if (Number.isNaN(cantidad) || cantidad <= 0) {
        setError("Todas las cantidades deben ser números mayores a cero.");
        return;
      }

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

    // Validar monto mínimo de la orden (equivalente a 20$)
    if (totalOrden < 20) {
      setError("El monto mínimo de la orden es 20$.");
      return;
    }

    try {
      setLoadingSubmit(true);

      const payload = {
        metodo_pago: metodoPago,
        id_cliente: Number(clienteSeleccionado),
        detalles: lineasValidas.map((d) => ({
          id_producto: Number(d.producto_id),
          cantidad: Number(d.cantidad),
        })),
      };

      const res = await api.post("/ordenes/", payload);

      const clienteObj = clientes.find(
        (c) => c.id_cliente === Number(clienteSeleccionado)
      );
      const lineasResumen = lineasValidas.map((d) => {
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
      setDetalles([{ producto_id: "", cantidad: 1, filtro: "" }]);
      setTieneCambios(false);
    } catch (err) {
      console.error("Error creando orden:", err);
      const msg = getErrorMessageFromResponse(
        err,
        "No se pudo crear la orden. Revisa los datos e inténtalo nuevamente."
      );
      setError(msg);
    } finally {
      setLoadingSubmit(false);
    }
  };

  const limpiarFormulario = () => {
    if (tieneCambios && !resumenOrden) {
      const confirmar = window.confirm(
        "Esto limpiará todos los campos de la orden actual. ¿Deseas continuar?"
      );
      if (!confirmar) return;
    }
    setClienteSeleccionado("");
    setMetodoPago(METODOS_PAGO[0]);
    setDetalles([{ producto_id: "", cantidad: 1, filtro: "" }]);
    setError("");
    setMensaje("");
    setResumenOrden(null);
    setMostrarNuevoCliente(false);
    setNuevoClienteNombre("");
    setNuevoClienteDireccion("");
    setNuevoClienteCorreo("");
    setNuevoClienteTelefono("");
    setNuevoClienteMensaje("");
    setNuevoClienteError("");
    setFiltroCliente("");
    setTieneCambios(false);
  };

  const manejarCancelar = () => {
    if (tieneCambios && !resumenOrden) {
      const confirmar = window.confirm(
        "Tienes cambios sin guardar en la orden. ¿Seguro que quieres salir?"
      );
      if (!confirmar) return;
    }
    navigate("/");
  };

  const clienteObj =
    clienteSeleccionado &&
    clientes.find((c) => c.id_cliente === Number(clienteSeleccionado));

  const formularioDeshabilitado =
    !esVendedor || !!permisoError || loadingDatos || loadingSubmit;

  // 🔎 Lógica de filtrado de clientes
  const clientesFiltrados = filtroCliente
    ? clientes.filter((c) => {
        const term = filtroCliente.toLowerCase();
        const nombre = (c.nombre || "").toLowerCase();
        const correo = (c.correo || "").toLowerCase();
        const telefono = (c.telefono || "").toLowerCase();
        return (
          nombre.includes(term) ||
          correo.includes(term) ||
          telefono.includes(term)
        );
      })
    : clientes;

  const manejarEnterBuscarCliente = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (clientesFiltrados.length > 0) {
        const primero = clientesFiltrados[0];
        marcarCambio();
        setClienteSeleccionado(String(primero.id_cliente));
      }
    }
  };

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.titleGroup}>
          <div style={styles.iconCircle}>
            <IconClipboard />
          </div>
          <div>
            <h2 style={styles.title}>Nueva Venta</h2>
            <p style={styles.subtitle}>Generar orden de salida de productos</p>
          </div>
        </div>
      </div>

      <div style={styles.content}>
        {permisoError && <div style={styles.statusError}>{permisoError}</div>}
        {mensaje && <div style={styles.statusOk}>{mensaje}</div>}
        {error && <div style={styles.statusError}>{error}</div>}
        {loadingDatos && (
          <div style={styles.statusInfo}>
            Cargando clientes, productos y existencias...
          </div>
        )}

        {!esVendedor ? (
          <div style={{ marginTop: "10px" }}>
            <button
              type="button"
              style={styles.btnPrimary}
              onClick={() => navigate("/")}
            >
              Volver al Inicio
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* GRID: CLIENTE Y PAGO */}
            <div style={styles.formGrid}>
              {/* SECCION 1: CLIENTE */}
              <div style={styles.section}>
                <div style={styles.sectionTitle}>1. Datos del Cliente</div>

                <div style={{ marginBottom: "15px" }}>
                  {/* 🔎 Buscador de cliente */}
                  <label style={styles.label}>Buscar Cliente</label>
                  <input
                    style={styles.inputSmall}
                    placeholder="Buscar por nombre, correo o teléfono..."
                    value={filtroCliente}
                    onChange={(e) => setFiltroCliente(e.target.value)}
                    onKeyDown={manejarEnterBuscarCliente}
                    disabled={loadingDatos}
                  />

                  <label style={{ ...styles.label, marginTop: "8px" }}>
                    Seleccionar Cliente
                  </label>
                  <select
                    style={styles.select}
                    value={clienteSeleccionado}
                    onChange={(e) => {
                      marcarCambio();
                      setClienteSeleccionado(e.target.value);
                    }}
                    required
                    disabled={loadingDatos}
                  >
                    <option value="">-- Selecciona un Cliente --</option>
                    {clientesFiltrados.map((c) => (
                      <option key={c.id_cliente} value={c.id_cliente}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                  {clienteObj && (
                    <div
                      style={{
                        marginTop: "8px",
                        fontSize: "0.8rem",
                        color: "#64748b",
                      }}
                    >
                      <strong>Contacto:</strong>{" "}
                      {clienteObj.telefono || "Sin teléfono"}{" "}
                      {clienteObj.correo
                        ? `· ${clienteObj.correo}`
                        : "· Sin correo"}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    marcarCambio();
                    setMostrarNuevoCliente((v) => !v);
                  }}
                  style={{
                    ...styles.btnGhost,
                    padding: 0,
                    fontSize: "0.8rem",
                    color: "#2563eb",
                  }}
                  disabled={loadingDatos || loadingSubmit}
                >
                  {mostrarNuevoCliente
                    ? "Cancelar registro"
                    : "+ Registrar nuevo cliente"}
                </button>

                {/* FORMULARIO NUEVO CLIENTE (ANIDADO) */}
                {mostrarNuevoCliente && (
                  <div style={styles.nestedCard}>
                    <div
                      style={{ ...styles.sectionTitle, borderBottom: "none" }}
                    >
                      Nuevo Cliente
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      <input
                        style={styles.input}
                        placeholder="Nombre completo"
                        value={nuevoClienteNombre}
                        onChange={(e) => {
                          marcarCambio();
                          setNuevoClienteNombre(e.target.value);
                        }}
                      />
                      <input
                        style={styles.input}
                        placeholder="Dirección"
                        value={nuevoClienteDireccion}
                        onChange={(e) => {
                          marcarCambio();
                          setNuevoClienteDireccion(e.target.value);
                        }}
                      />
                      <input
                        style={styles.input}
                        placeholder="Correo"
                        value={nuevoClienteCorreo}
                        onChange={(e) => {
                          marcarCambio();
                          setNuevoClienteCorreo(e.target.value);
                        }}
                      />
                      <input
                        style={styles.input}
                        placeholder="Teléfono"
                        value={nuevoClienteTelefono}
                        onChange={(e) => {
                          marcarCambio();
                          setNuevoClienteTelefono(e.target.value);
                        }}
                      />

                      {nuevoClienteError && (
                        <div style={{ color: "#ef4444", fontSize: "0.8rem" }}>
                          {nuevoClienteError}
                        </div>
                      )}
                      {nuevoClienteMensaje && (
                        <div style={{ color: "#10b981", fontSize: "0.8rem" }}>
                          {nuevoClienteMensaje}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={crearNuevoCliente}
                        style={{
                          ...styles.btnPrimary,
                          padding: "8px 16px",
                          fontSize: "0.85rem",
                          alignSelf: "flex-end",
                        }}
                        disabled={loadingDatos || loadingSubmit}
                      >
                        Guardar Cliente
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* SECCION 2: PAGO */}
              <div style={styles.section}>
                <div style={styles.sectionTitle}>2. Método de Pago</div>
                <div>
                  <label style={styles.label}>Forma de pago</label>
                  <select
                    style={styles.select}
                    value={metodoPago}
                    onChange={(e) => {
                      marcarCambio();
                      setMetodoPago(e.target.value);
                    }}
                    required
                    disabled={loadingDatos}
                  >
                    {METODOS_PAGO.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: PRODUCTOS */}
            <div style={styles.productsSection}>
              <div style={styles.productsHeader}>
                <h3
                  style={{
                    ...styles.title,
                    fontSize: "1.1rem",
                    margin: 0,
                  }}
                >
                  3. Productos
                </h3>

                <div>
                  <button
                    type="button"
                    style={styles.btnSecondary}
                    onClick={agregarLinea}
                    disabled={loadingDatos || loadingSubmit}
                  >
                    <IconPlus /> Agregar Línea
                  </button>
                </div>
              </div>

              {detalles.map((det, idx) => {
                const prodIdNumber = det.producto_id
                  ? Number(det.producto_id)
                  : null;
                const existenciaActual =
                  prodIdNumber != null ? existencias[prodIdNumber] : null;
                const prod = obtenerProducto(det.producto_id);
                const precioUnitario = prod
                  ? Number(prod.precio_venta || 0)
                  : 0;
                const subtotal = calcularSubtotal(det);

                let stockColor = "#64748b";
                if (det.producto_id && existenciaActual != null) {
                  if (existenciaActual === 0) stockColor = "#ef4444";
                  else if (existenciaActual < 5) stockColor = "#f59e0b";
                }

                const cantidadNum = Number(det.cantidad || 0);
                const showCantidadWarning =
                  det.producto_id &&
                  existenciaActual != null &&
                  cantidadNum > existenciaActual;

                const filtroTexto = det.filtro || "";
                let productosFiltrados = filtroTexto
                  ? productos.filter((p) => {
                      const nombre = (p.nombre || "").toLowerCase();
                      const codigo = String(p.id_producto || "");
                      const f = filtroTexto.toLowerCase();
                      return nombre.includes(f) || codigo.includes(f);
                    })
                  : productos;

                // Asegurar que el producto ya seleccionado siempre aparezca en la lista
                if (det.producto_id) {
                  const seleccionado = obtenerProducto(det.producto_id);
                  if (
                    seleccionado &&
                    !productosFiltrados.some(
                      (p) => p.id_producto === seleccionado.id_producto
                    )
                  ) {
                    productosFiltrados = [
                      seleccionado,
                      ...productosFiltrados,
                    ];
                  }
                }

                // Handler: Enter en el buscador => seleccionar automáticamente el primer match
                const manejarEnterFiltro = (e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (productosFiltrados.length > 0) {
                      const primero = productosFiltrados[0];
                      handleChangeDetalle(
                        idx,
                        "producto_id",
                        String(primero.id_producto)
                      );
                    }
                  }
                };

                return (
                  <div key={idx} style={styles.productRow}>
                    <div>
                      <label style={styles.label}>Producto</label>

                      {/* Buscador simple dentro de la línea */}
                      <input
                        style={styles.inputSmall}
                        placeholder="Buscar por nombre o código..."
                        value={det.filtro || ""}
                        onChange={(e) =>
                          handleChangeDetalle(idx, "filtro", e.target.value)
                        }
                        onKeyDown={manejarEnterFiltro}
                        disabled={loadingDatos}
                      />

                      <select
                        style={styles.select}
                        value={det.producto_id || ""}
                        onChange={(e) =>
                          handleChangeDetalle(
                            idx,
                            "producto_id",
                            e.target.value
                          )
                        }
                        required
                        disabled={loadingDatos}
                      >
                        <option value="">Seleccionar producto...</option>
                        {productosFiltrados.map((p) => (
                          <option key={p.id_producto} value={p.id_producto}>
                            {p.nombre}
                          </option>
                        ))}
                      </select>

                      {/* Info Stock y Precio */}
                      <div style={styles.infoRow}>
                        <span style={{ color: stockColor, fontWeight: "600" }}>
                          {det.producto_id
                            ? existenciaActual != null
                              ? `Stock: ${existenciaActual}`
                              : "Sin datos"
                            : ""}
                        </span>
                        {prod && (
                          <span>
                            Precio:{" "}
                            <strong>Bs {precioUnitario.toFixed(2)}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label style={styles.label}>Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        max={
                          existenciaActual != null ? existenciaActual : undefined
                        }
                        style={styles.input}
                        value={det.cantidad}
                        onChange={(e) =>
                          handleChangeDetalle(idx, "cantidad", e.target.value)
                        }
                        required
                        disabled={loadingDatos}
                      />
                      <div
                        style={{
                          ...styles.infoRow,
                          justifyContent: "flex-end",
                          color: "#0f172a",
                          fontWeight: "700",
                        }}
                      >
                        Bs {subtotal.toFixed(2)}
                      </div>

                      {showCantidadWarning && (
                        <div style={styles.infoRowWarning}>
                          La cantidad supera el stock disponible.
                        </div>
                      )}
                    </div>

                    {detalles.length > 1 && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-end",
                          height: "100%",
                          paddingBottom: "22px",
                        }}
                      >
                        <button
                          type="button"
                          style={styles.btnIcon}
                          onClick={() => quitarLinea(idx)}
                          disabled={loadingDatos}
                        >
                          <IconTrash />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Total acumulado + total ítems */}
              <div style={styles.totalRow}>
                <div>
                  <div>Total a Pagar: Bs {totalOrden.toFixed(2)}</div>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "#0f172a",
                      marginTop: "4px",
                    }}
                  >
                    Ítems totales:{" "}
                    <strong>{Number.isNaN(totalItems) ? 0 : totalItems}</strong>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#64748b",
                    textAlign: "right",
                  }}
                >
                  Verifica cantidades y existencias antes de confirmar la orden.
                </div>
              </div>
            </div>

            {/* BOTONES FINALES */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "15px",
                marginTop: "30px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={limpiarFormulario}
                  style={styles.btnGhost}
                  disabled={formularioDeshabilitado}
                >
                  Limpiar formulario
                </button>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={manejarCancelar}
                  style={styles.btnGhost}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    ...styles.btnPrimary,
                    opacity: loadingSubmit ? 0.7 : 1,
                    cursor: loadingSubmit ? "not-allowed" : "pointer",
                  }}
                  disabled={formularioDeshabilitado}
                >
                  {loadingSubmit ? "Creando orden..." : "CONFIRMAR ORDEN"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* RESUMEN DE ÉXITO */}
        {resumenOrden && (
          <div style={styles.resumenCard}>
            <div style={styles.resumenTitle}>
              ✅ Orden #{resumenOrden.id_orden} Creada
            </div>

            <div style={styles.resumenLine}>
              <span>Cliente:</span> <strong>{resumenOrden.cliente}</strong>
            </div>
            <div style={styles.resumenLine}>
              <span>Pago:</span> <strong>{resumenOrden.metodo_pago}</strong>
            </div>

            <div
              style={{
                margin: "20px 0",
                borderTop: "1px dashed #cbd5e1",
              }}
            ></div>

            {resumenOrden.lineas.map((l, idx) => (
              <div key={idx} style={styles.resumenLine}>
                <span>
                  {l.cantidad} x {l.nombre}
                </span>
                <span>Bs {l.subtotal.toFixed(2)}</span>
              </div>
            ))}

            <div
              style={{
                margin: "20px 0",
                borderTop: "2px solid #e2e8f0",
              }}
            ></div>

            <div
              style={{
                ...styles.resumenLine,
                fontSize: "1.2rem",
                fontWeight: "800",
                color: "#0f172a",
              }}
            >
              <span>TOTAL</span>
              <span>Bs {resumenOrden.total.toFixed(2)}</span>
            </div>

            <div style={{ textAlign: "right", marginTop: "20px" }}>
              <button
                type="button"
                onClick={() => navigate("/")}
                style={styles.btnPrimary}
              >
                Volver al Inicio
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}