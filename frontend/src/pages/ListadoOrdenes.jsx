// frontend/src/pages/ListadoOrdenes.jsx

import React, { useEffect, useState, useRef, useMemo } from "react";
import api from "../api/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// --- CONST: MÉTODOS DE PAGO PERMITIDOS (ORDEN BASE) ---
const METODOS_PAGO = [
  "EFECTIVO",
  "PAGO MOVIL",
  "TRANSFERENCIA NACIONAL",
  "TRANSFERENCIA INTERNACIONAL",
];

// --- CONST: MÉTODOS DE PAGO PARA PAGOS DE VENTA ---
const METODOS_PAGO_VENTA = [
  { value: "EFECTIVO", label: "Efectivo ($)", currency: "USD" },
  { value: "PAGO MOVIL", label: "Pago Móvil (Bs)", currency: "VES" },
  { value: "TRANSFERENCIA NACIONAL", label: "Transferencia Nacional (Bs)", currency: "VES" },
  { value: "TRANSFERENCIA INTERNACIONAL", label: "Transferencia Internacional ($)", currency: "USD" },
];

const API_TASA_LOCAL = "/base/tasa-dolar/";

// --- ICONOS SVG ---
const IconClipboard = () => (
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
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
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
const IconDownload = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const IconEdit = () => (
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
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
  </svg>
);
const IconEye = () => (
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
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

export default function ListadoOrdenes() {
  const [ordenes, setOrdenes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [productos, setProductos] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [detallesOrdenSeleccionada, setDetallesOrdenSeleccionada] = useState([]);
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
    ordering: "-id_orden",
  });

  const [usuarioActual, setUsuarioActual] = useState(null);
  const [clienteBusqueda, setClienteBusqueda] = useState("");
  const [vendedorBusqueda, setVendedorBusqueda] = useState("");
  const [idOrdenPagoLoading, setIdOrdenPagoLoading] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);

  // Para ver monto en Bs en la tarjeta de detalle
  const [tasaBCV, setTasaBCV] = useState(null);
  const [loadingTasa, setLoadingTasa] = useState(false);
  const [montoBsDetalle, setMontoBsDetalle] = useState(null);
  const [errorTasa, setErrorTasa] = useState("");

  const pageSize = 10;

  // --- ESTADO PARA MODAL DE GESTIÓN DE PAGOS (VENTAS) ---
  const [modalPagoVisible, setModalPagoVisible] = useState(false);
  const [ordenParaPago, setOrdenParaPago] = useState(null);
  const [modalPagoError, setModalPagoError] = useState("");
  const [pagosVentaLoading, setPagosVentaLoading] = useState(false);

  const [historialPagosVenta, setHistorialPagosVenta] = useState([]);
  const [saldoOriginalUSD, setSaldoOriginalUSD] = useState(0);
  const [totalPagadoUSD, setTotalPagadoUSD] = useState(0);
  const [saldoPendienteUSD, setSaldoPendienteUSD] = useState(0);

  const [metodoPagoVenta, setMetodoPagoVenta] = useState(
    METODOS_PAGO_VENTA[0].value
  );
  const [montoPagoInput, setMontoPagoInput] = useState("");
  const [tasaPagoInput, setTasaPagoInput] = useState("");
  const [referenciaPagoInput, setReferenciaPagoInput] = useState("");

  const [tasaBCVVenta, setTasaBCVVenta] = useState(null);
  const [loadingTasaVenta, setLoadingTasaVenta] = useState(false);
  const [errorTasaVenta, setErrorTasaVenta] = useState("");

  // Modales de detalle de Cliente y Vendedor
  const [modalClienteVisible, setModalClienteVisible] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [modalVendedorVisible, setModalVendedorVisible] = useState(false);
  const [vendedorSeleccionado, setVendedorSeleccionado] = useState(null);

  // Modal editar orden
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [ordenParaEditar, setOrdenParaEditar] = useState(null);
  const [formEditar, setFormEditar] = useState({ metodo_pago: "" });
  const [detallesEditar, setDetallesEditar] = useState([]);
  const [editarLoading, setEditarLoading] = useState(false);
  const [editarError, setEditarError] = useState("");

  // Modal eliminar orden
  const [modalEliminarVisible, setModalEliminarVisible] = useState(false);
  const [ordenParaEliminar, setOrdenParaEliminar] = useState(null);
  const [eliminarLoading, setEliminarLoading] = useState(false);
  const [eliminarError, setEliminarError] = useState("");

  // Referencia para el scroll suave al detalle
  const detailRef = useRef(null);

  // --- OBTENER USUARIO ACTUAL ---
  const obtenerUsuarioActual = () => {
    const posiblesClaves = ["user_data", "user", "usuario"];
    for (let clave of posiblesClaves) {
      const val = localStorage.getItem(clave);
      if (val) {
        try {
          const parsed = JSON.parse(val);
          if (parsed && typeof parsed === "object") return parsed;
        } catch (e) {
          continue;
        }
      }
    }
    return null;
  };

  // --- HELPERS ROL ---
  const esGerencia =
    usuarioActual &&
    (usuarioActual.tipo === "GERENTE" ||
      usuarioActual.tipo === "ADMINISTRADOR" ||
      usuarioActual.is_superuser);

  // --- HELPERS ESTILOS ---
  const getEnvioStyle = (status) => {
    if (!status) return { bg: "#f1f5f9", text: "#64748b" };
    const s = status.toUpperCase();
    if (s.includes("PENDIENTE")) return { bg: "#fff7ed", text: "#c2410c" };
    if (s.includes("APROBADA")) return { bg: "#dcfce7", text: "#15803d" };
    if (s.includes("ENTREGADA")) return { bg: "#bbf7d0", text: "#14532d" };
    if (s.includes("CANCELADA")) return { bg: "#fee2e2", text: "#991b1b" };
    if (s.includes("RECHAZADA")) return { bg: "#fee2e2", text: "#b91c1c" };
    if (s.includes("DEVUELTA")) return { bg: "#fee2e2", text: "#b91c1c" };
    return { bg: "#e0f2fe", text: "#0284c7" };
  };

  const getPagoStyle = (status) => {
    if (!status) return { bg: "#f1f5f9", text: "#64748b" };
    const s = status.toUpperCase();
    if (s.includes("PAGADA")) return { bg: "#dcfce7", text: "#15803d" };
    if (s.includes("PAGO EN CURSO"))
      return { bg: "#fef9c3", text: "#854d0e" };
    return { bg: "#fff7ed", text: "#c2410c" };
  };

  // --- LÓGICA DE DATOS ---
  const nombreCliente = (idCliente) => {
    const c = clientes.find((c) => c.id_cliente === idCliente);
    return c ? c.nombre : `#${idCliente}`;
  };

  const nombreVendedor = (idUsuario) => {
    if (!idUsuario) return "-";
    if (typeof idUsuario === "object") return idUsuario.username || "-";
    const v = vendedores.find(
      (u) => u.id_usuario === idUsuario || u.id === idUsuario
    );
    return v ? v.username : `#${idUsuario}`;
  };

  const extraerIdUsuario = (valor) => {
    if (!valor) return null;
    if (typeof valor === "object") return valor.id_usuario ?? valor.id ?? null;
    return valor;
  };

  const esVendedorPropietario = (orden) => {
    if (!usuarioActual || usuarioActual.tipo !== "VENDEDOR") return false;
    const vendedorActualId = usuarioActual.id_usuario ?? usuarioActual.id ?? null;
    const ordenVendedorRaw = orden.id_usuario ?? orden.id_vendedor ?? null;
    const ordenVendedorId = extraerIdUsuario(ordenVendedorRaw);
    if (!vendedorActualId || !ordenVendedorId) return false;
    return Number(vendedorActualId) === Number(ordenVendedorId);
  };

  const puedeEditarOrden = (orden) => {
    if (!esVendedorPropietario(orden)) return false;
    const raw = (orden.estado_de_envio || "")
      .toString()
      .toUpperCase()
      .replace(/_/g, " ")
      .trim();
    if (
      raw === "PENDIENTE POR APROBACION" ||
      raw === "PENDIENTE POR APROBACIÓN"
    )
      return true;
    return false;
  };

  // --- MODALES DE CLIENTE Y VENDEDOR ---
  const abrirModalCliente = (idClienteRaw) => {
    let id = idClienteRaw;
    if (id && typeof id === "object") {
      id = id.id_cliente ?? id.id;
    }
    const cliente = clientes.find((c) => c.id_cliente === id);
    if (!cliente) {
      setError("No se encontró la información del cliente.");
      return;
    }
    setClienteSeleccionado(cliente);
    setModalClienteVisible(true);
  };

  const cerrarModalCliente = () => {
    setModalClienteVisible(false);
    setClienteSeleccionado(null);
  };

  const abrirModalVendedor = async (usuarioOrId) => {
    if (!usuarioOrId) {
      setError("No se encontró la información del vendedor.");
      return;
    }

    if (typeof usuarioOrId === "object" && usuarioOrId.username) {
      setVendedorSeleccionado(usuarioOrId);
      setModalVendedorVisible(true);
      return;
    }

    let id = usuarioOrId;
    if (id && typeof id === "object") {
      id = id.id_usuario ?? id.id;
    }

    if (!id) {
      setError("No se encontró la información del vendedor.");
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const config = token
        ? { headers: { Authorization: `Token ${token}` } }
        : {};

      const res = await api.get(`/base/usuarios/${id}/`, config);
      const vendedorCompleto = res.data;

      if (!vendedorCompleto || typeof vendedorCompleto !== "object") {
        throw new Error("Respuesta inválida de la API de usuarios");
      }

      setVendedorSeleccionado(vendedorCompleto);
      setModalVendedorVisible(true);
    } catch (err) {
      console.error("Error al cargar info completa del vendedor:", err);
      const vendedor = vendedores.find(
        (v) => v.id_usuario === id || v.id === id
      );
      if (!vendedor) {
        setError("No se encontró la información del vendedor.");
        return;
      }
      setVendedorSeleccionado(vendedor);
      setModalVendedorVisible(true);
    }
  };

  const cerrarModalVendedor = () => {
    setModalVendedorVisible(false);
    setVendedorSeleccionado(null);
  };

  // --- ELIMINAR ORDEN (CANCELAR) ---
  const abrirModalEliminar = (orden) => {
    if (!puedeEditarOrden(orden)) {
      setError(
        "Solo el vendedor que creó la orden puede eliminarla y únicamente si está PENDIENTE POR APROBACIÓN."
      );
      return;
    }
    setOrdenParaEliminar(orden);
    setEliminarError("");
    setModalEliminarVisible(true);
  };

  const cerrarModalEliminar = () => {
    setModalEliminarVisible(false);
    setOrdenParaEliminar(null);
    setEliminarError("");
  };

  const confirmarEliminarOrden = async () => {
    if (!ordenParaEliminar) return;
    try {
      setEliminarLoading(true);
      setEliminarError("");
      await api.post(`/ordenes/${ordenParaEliminar.id_orden}/cancelar/`);
      setMensaje("Orden eliminada/cancelada correctamente.");
      cerrarModalEliminar();
      cargarOrdenes(false);
    } catch (err) {
      console.error(err);
      setEliminarError("Error al eliminar la orden.");
    } finally {
      setEliminarLoading(false);
    }
  };

  // --- MODAL EDICIÓN ---
  const abrirModalEditar = async (orden) => {
    if (!puedeEditarOrden(orden)) {
      setError(
        "Solo el vendedor que creó la orden puede editarla y únicamente si está PENDIENTE POR APROBACIÓN."
      );
      return;
    }
    try {
      setEditarError("");
      setMensaje("");
      setError("");
      const res = await api.get(`/ordenes/${orden.id_orden}/detalles/`);
      const detallesRaw = Array.isArray(res.data)
        ? res.data
        : res.data.results || [];
      const detallesMapeados = detallesRaw.map((d) => {
        const prodId = d.id_producto?.id_producto || d.id_producto;
        const prod = productos.find((p) => p.id_producto === prodId);
        return {
          id: d.id_detalle || d.id || `${orden.id_orden}-${prodId}`,
          id_producto: prodId,
          nombre: prod?.nombre || d.id_producto?.nombre || `#${prodId}`,
          cantidad: d.cantidad ?? 0,
        };
      });
      setOrdenParaEditar(orden);
      setFormEditar({ metodo_pago: orden.metodo_pago || "" });
      setDetallesEditar(detallesMapeados);
      setModalEditarVisible(true);
    } catch (err) {
      setError("Error cargando detalles para editar.");
    }
  };

  const cerrarModalEditar = () => {
    setModalEditarVisible(false);
    setOrdenParaEditar(null);
    setEditarError("");
    setFormEditar({ metodo_pago: "" });
    setDetallesEditar([]);
  };

  const handleChangeEditar = (campo, valor) =>
    setFormEditar((prev) => ({ ...prev, [campo]: valor }));

  const handleChangeCantidadProducto = (idFila, valor) => {
    let nuevaCantidad = parseInt(valor, 10);
    if (isNaN(nuevaCantidad) || nuevaCantidad < 1) nuevaCantidad = 1;
    setDetallesEditar((prev) =>
      prev.map((d) => (d.id === idFila ? { ...d, cantidad: nuevaCantidad } : d))
    );
  };

  const guardarEdicionOrden = async () => {
    if (!ordenParaEditar) return;
    if (!puedeEditarOrden(ordenParaEditar)) {
      setEditarError("La orden ya no se puede editar.");
      return;
    }
    if (!formEditar.metodo_pago) {
      setEditarError("Selecciona método de pago.");
      return;
    }

    const detallesPayload = detallesEditar
      .filter((d) => d.cantidad > 0)
      .map((d) => ({ id_producto: d.id_producto, cantidad: d.cantidad }));

    if (!detallesPayload.length) {
      setEditarError("Cantidades inválidas.");
      return;
    }

    try {
      setEditarLoading(true);
      setEditarError("");
      const payload = {
        metodo_pago: formEditar.metodo_pago,
        detalles: detallesPayload,
      };
      const res = await api.patch(
        `/ordenes/${ordenParaEditar.id_orden}/`,
        payload
      );
      const ordenActualizada = res.data || { ...ordenParaEditar, ...payload };

      setOrdenes((prev) =>
        prev.map((o) =>
          o.id_orden === ordenParaEditar.id_orden ? ordenActualizada : o
        )
      );
      if (ordenSeleccionada?.id_orden === ordenParaEditar.id_orden) {
        setOrdenSeleccionada((prev) => ({ ...prev, ...ordenActualizada }));
      }
      setMensaje("Orden actualizada correctamente.");
      cerrarModalEditar();
    } catch (err) {
      setEditarError("Error al actualizar la orden.");
    } finally {
      setEditarLoading(false);
    }
  };

  // --- CERRAR DETALLE ORDEN ---
  const cerrarDetalleOrden = () => {
    setOrdenSeleccionada(null);
    setDetallesOrdenSeleccionada([]);
    setTasaBCV(null);
    setMontoBsDetalle(null);
    setErrorTasa("");
  };

  // --- CARGA DE DATOS ---
  const cargarDatosMaestros = async (usuario = null) => {
    try {
      const token = localStorage.getItem("auth_token");
      const config = { headers: { Authorization: `Token ${token}` } };
      const [resClientes, resUsuarios, resProductos] = await Promise.all([
        api.get("/base/clientes/", config),
        api.get("/base/usuarios/", config),
        api.get("/inventario/productos/", config),
      ]);

      let listaClientes = resClientes.data;
      if (usuario && usuario.tipo === "VENDEDOR") {
        const vendedorId = usuario.id_usuario ?? usuario.id;
        listaClientes = listaClientes.filter(
          (c) => c.id_usuario === vendedorId || c.id === vendedorId
        );
      }
      setClientes(listaClientes);
      const usuariosData = Array.isArray(resUsuarios.data)
        ? resUsuarios.data
        : resUsuarios.data.results || [];
      setVendedores(usuariosData);
      setProductos(resProductos.data);
    } catch (err) {
      console.error("Error maestros:", err);
    }
  };

  const cargarOrdenes = async (conMensaje = false, overrideParams = null) => {
    // Al aplicar búsqueda/filtros se cierra el detalle si estaba abierto
    cerrarDetalleOrden();

    setLoading(true);
    setError("");
    if (conMensaje) setMensaje("");
    try {
      let params = {};

      if (overrideParams) {
        params = overrideParams;
      } else {
        if (filtros.id) params.id = filtros.id;
        if (filtros.estadoEnvio) params.estado_envio = filtros.estadoEnvio;
        if (filtros.estadoPago) params.estado_pago = filtros.estadoPago;
        if (filtros.cliente) params.cliente = filtros.cliente;
        if (filtros.vendedor) {
          params.vendedor = filtros.vendedor;
          params.id_usuario = filtros.vendedor;
        }
        if (filtros.desde) params.desde = filtros.desde;
        if (filtros.hasta) params.hasta = filtros.hasta;
        if (filtros.ordering) params.ordering = filtros.ordering;
      }

      const res = await api.get("/ordenes/", { params });
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setOrdenes(data);
      setPaginaActual(1);
      if (conMensaje)
        setMensaje(
          `Se encontraron ${data.length} orden(es) con las características seleccionadas.`
        );
    } catch (err) {
      setError("No se pudieron cargar las órdenes.");
    } finally {
      setLoading(false);
    }
  };

  const verDetallesOrden = async (idOrden) => {
    if (ordenSeleccionada && ordenSeleccionada.id_orden === idOrden) {
      cerrarDetalleOrden();
      return;
    }
    setTasaBCV(null);
    setMontoBsDetalle(null);
    setErrorTasa("");
    setLoadingDetalle(true);
    setErrorDetalle("");
    setOrdenSeleccionada(null);
    try {
      const [resOrden, resDetalles] = await Promise.all([
        api.get(`/ordenes/${idOrden}/`),
        api.get(`/ordenes/${idOrden}/detalles/`),
      ]);
      setOrdenSeleccionada(resOrden.data);
      setDetallesOrdenSeleccionada(
        Array.isArray(resDetalles.data)
          ? resDetalles.data
          : resDetalles.data.results || []
      );
    } catch (err) {
      setErrorDetalle("Error al cargar detalles.");
    } finally {
      setLoadingDetalle(false);
    }
  };

  // --- MINI DASHBOARD ---
  const dashboardStats = useMemo(() => {
    if (!ordenes || !ordenes.length) {
      return {
        total: 0,
        totalEntregadas: 0,
        totalNoEntregadas: 0,
        pendientesPago: 0,
        ventasUltimoMes: 0,
        clienteTopNombre: "-",
        clienteTopCount: 0,
        vendedorTopNombre: "-",
        vendedorTopCount: 0,
      };
    }

    const ahora = new Date();
    const hace30 = new Date();
    hace30.setDate(ahora.getDate() - 30);

    let total = ordenes.length;
    let totalEntregadas = 0;
    let totalNoEntregadas = 0;
    let pendientesPago = 0;
    let ventasUltimoMes = 0;

    const conteoClientes = {};
    const conteoVendedores = {};

    const normalizarEstadoEnvio = (s) =>
      (s || "")
        .toString()
        .toUpperCase()
        .replace(/_/g, " ")
        .trim();

    ordenes.forEach((o) => {
      const estadoEnvioNorm = normalizarEstadoEnvio(o.estado_de_envio);
      if (estadoEnvioNorm === "ENTREGADA") totalEntregadas += 1;
      if (
        !["ENTREGADA", "CANCELADA", "RECHAZADA", "DEVUELTA"].includes(
          estadoEnvioNorm
        )
      ) {
        totalNoEntregadas += 1;
      }

      const estadoPagoNorm = (o.estado_de_pago || "")
        .toString()
        .toUpperCase();
      if (estadoPagoNorm.includes("PENDIENTE")) pendientesPago += 1;

      if (o.fecha_orden) {
        const fecha = new Date(o.fecha_orden);
        if (!isNaN(fecha) && fecha >= hace30 && fecha <= ahora) {
          ventasUltimoMes += Number(o.precio_final || 0);
        }
      }

      let idCliente = o.id_cliente;
      if (idCliente && typeof idCliente === "object") {
        idCliente = idCliente.id_cliente ?? idCliente.id;
      }
      if (idCliente != null) {
        conteoClientes[idCliente] = (conteoClientes[idCliente] || 0) + 1;
      }

      let idUsuario = o.id_usuario;
      if (idUsuario && typeof idUsuario === "object") {
        idUsuario = idUsuario.id_usuario ?? idUsuario.id;
      }
      if (idUsuario != null) {
        conteoVendedores[idUsuario] = (conteoVendedores[idUsuario] || 0) + 1;
      }
    });

    let clienteTopId = null;
    let clienteTopCount = 0;
    Object.entries(conteoClientes).forEach(([id, count]) => {
      if (count > clienteTopCount) {
        clienteTopCount = count;
        clienteTopId = Number(id);
      }
    });
    const clienteTopNombre =
      clienteTopId != null ? nombreCliente(clienteTopId) : "-";

    let vendedorTopId = null;
    let vendedorTopCount = 0;
    Object.entries(conteoVendedores).forEach(([id, count]) => {
      if (count > vendedorTopCount) {
        vendedorTopCount = count;
        vendedorTopId = Number(id);
      }
    });
    const vendedorTopNombre =
      vendedorTopId != null ? nombreVendedor(vendedorTopId) : "-";

    return {
      total,
      totalEntregadas,
      totalNoEntregadas,
      pendientesPago,
      ventasUltimoMes,
      clienteTopNombre,
      clienteTopCount,
      vendedorTopNombre,
      vendedorTopCount,
    };
  }, [ordenes, clientes, vendedores]);

  // Efecto de scroll suave
  useEffect(() => {
    if (ordenSeleccionada && detailRef.current) {
      setTimeout(() => {
        detailRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }
  }, [ordenSeleccionada]);

  // --- LÓGICA DE GESTIÓN DE PAGOS (VENTA) ---

  const currentMetodoInfoVenta = METODOS_PAGO_VENTA.find(
    (m) => m.value === metodoPagoVenta
  );
  const isBolivaresVenta = currentMetodoInfoVenta?.currency === "VES";

  const getValorEnUSDVenta = (montoLocal, tasa) => {
    const monto = parseFloat(montoLocal);
    if (!monto || monto <= 0) return 0;
    if (!isBolivaresVenta) return monto;
    const tasaFinal = parseFloat(tasa);
    if (!tasaFinal || tasaFinal <= 0) return 0;
    return monto / tasaFinal;
  };

  const fetchTasaBCVVenta = async () => {
    try {
      setLoadingTasaVenta(true);
      setErrorTasaVenta("");
      const response = await api.get(
        `http://127.0.0.1:8000/api${API_TASA_LOCAL}`
      );
      const tasa = response.data.promedio || response.data.price;
      if (tasa) {
        setTasaBCVVenta(tasa);
        setTasaPagoInput(String(tasa));
      }
    } catch (e) {
      console.error("Error obteniendo tasa BCV para pagos de venta:", e);
      setErrorTasaVenta(
        "No se pudo obtener la tasa BCV automáticamente. Puedes ingresarla manualmente."
      );
    } finally {
      setLoadingTasaVenta(false);
    }
  };

  const cargarPagosVenta = async (idOrden) => {
    try {
      setPagosVentaLoading(true);
      setModalPagoError("");
      const res = await api.get(`/ordenes/${idOrden}/pagos-venta/`);
      const data = res.data || {};
      const historial = data.pagos || [];

      const totalPagado = parseFloat(data.total_pagado || 0);
      const saldoPendiente =
        data.saldo_pendiente != null
          ? parseFloat(data.saldo_pendiente)
          : parseFloat(data.precio_final || 0) - totalPagado;

      setHistorialPagosVenta(historial);
      setSaldoOriginalUSD(parseFloat(data.precio_final || 0));
      setTotalPagadoUSD(totalPagado);
      setSaldoPendienteUSD(saldoPendiente);

      // Actualizar la fila de la tabla y el detalle si está abierto
      setOrdenes((prev) =>
        prev.map((o) =>
          o.id_orden === data.orden_id
            ? {
                ...o,
                estado_de_pago: data.estado_de_pago,
                metodo_pago: data.metodo_pago,
              }
            : o
        )
      );
      if (ordenSeleccionada && ordenSeleccionada.id_orden === data.orden_id) {
        setOrdenSeleccionada((prev) => ({
          ...prev,
          estado_de_pago: data.estado_de_pago,
          metodo_pago: data.metodo_pago,
        }));
      }
    } catch (err) {
      console.error("Error cargando pagos de venta:", err);
      setModalPagoError("Error al cargar los pagos de esta orden.");
    } finally {
      setPagosVentaLoading(false);
    }
  };

  const abrirModalPago = async (orden) => {
    if (!usuarioActual || usuarioActual.tipo !== "VENDEDOR") {
      setError("Solo un usuario de tipo VENDEDOR puede gestionar pagos.");
      return;
    }
  
    const estadoEnvioNorm = (orden.estado_de_envio || "")
      .toString()
      .toUpperCase()
      .replace(/_/g, " ")
      .trim();
  
    const esPendientePorAprobacion =
      estadoEnvioNorm === "PENDIENTE POR APROBACION" ||
      estadoEnvioNorm === "PENDIENTE POR APROBACIÓN";
  
    const esRechazada =
      estadoEnvioNorm.includes("RECHAZADA") ||
      estadoEnvioNorm.includes("RECHAZADO");
  
    if (esPendientePorAprobacion) {
      setError(
        "No puedes registrar pagos en órdenes pendientes por aprobación."
      );
      return;
    }
  
    if (esRechazada) {
      setError("No puedes registrar pagos en órdenes rechazadas.");
      return;
    }
  
    setOrdenParaPago(orden);
    setModalPagoVisible(true);
    setModalPagoError("");
  
    // Reset de estados del modal
    setHistorialPagosVenta([]);
    setSaldoOriginalUSD(Number(orden.precio_final || 0));
    setTotalPagadoUSD(0);
    setSaldoPendienteUSD(Number(orden.precio_final || 0));
    setMontoPagoInput("");
    setReferenciaPagoInput("");
  
    // Método de pago por defecto = el de la orden (si coincide con nuestros métodos)
    const metodoDefault =
      METODOS_PAGO_VENTA.find((m) => m.value === orden.metodo_pago)?.value ||
      METODOS_PAGO_VENTA[0].value;
    setMetodoPagoVenta(metodoDefault);
  
    // Cargar información de pagos existentes + tasa BCV
    await Promise.all([cargarPagosVenta(orden.id_orden), fetchTasaBCVVenta()]);
  };

  const cerrarModalPago = () => {
    setModalPagoVisible(false);
    setOrdenParaPago(null);
    setModalPagoError("");
    setHistorialPagosVenta([]);
    setTotalPagadoUSD(0);
    setSaldoPendienteUSD(0);
    setMontoPagoInput("");
    setReferenciaPagoInput("");
  };

  const saldoRestanteUSD = saldoPendienteUSD;
  const saldoRestanteLocal =
    isBolivaresVenta && tasaPagoInput && parseFloat(tasaPagoInput) > 0
      ? saldoRestanteUSD * parseFloat(tasaPagoInput)
      : saldoRestanteUSD;

  const handlePagarTodoVenta = () => {
    if (saldoRestanteUSD <= 0) return;
    if (isBolivaresVenta) {
      if (!tasaPagoInput || parseFloat(tasaPagoInput) <= 0) {
        setModalPagoError("Debe indicar una tasa válida para pagar en Bs.");
        return;
      }
      const montoLocal = saldoRestanteUSD * parseFloat(tasaPagoInput);
      setMontoPagoInput(montoLocal.toFixed(2));
    } else {
      setMontoPagoInput(saldoRestanteUSD.toFixed(2));
    }
  };

  const registrarPagoVenta = async () => {
    if (!ordenParaPago) return;

    const montoVal = parseFloat(montoPagoInput);
    if (!montoVal || montoVal <= 0) {
      setModalPagoError("Ingrese un monto válido.");
      return;
    }

    let tasaVal = null;
    if (isBolivaresVenta) {
      tasaVal = parseFloat(tasaPagoInput);
      if (!tasaVal || tasaVal <= 0) {
        setModalPagoError("Ingrese una tasa BCV válida para pagos en Bs.");
        return;
      }
    }

    const montoUSD = getValorEnUSDVenta(montoPagoInput, tasaPagoInput);
    if (montoUSD > saldoRestanteUSD + 0.05) {
      setModalPagoError(
        `El pago excede el saldo pendiente ($${saldoRestanteUSD.toFixed(2)}).`
      );
      return;
    }

    try {
      setIdOrdenPagoLoading(ordenParaPago.id_orden);
      setModalPagoError("");

      const payload = {
        metodo_pago: metodoPagoVenta,
        monto_local: montoVal,
        moneda: isBolivaresVenta ? "VES" : "USD",
        tasa_cambio: isBolivaresVenta ? tasaVal : null,
        referencia: referenciaPagoInput,
      };

      const res = await api.post(
        `/ordenes/${ordenParaPago.id_orden}/pagos-venta/`,
        payload
      );
      const data = res.data || {};
      const historial = data.pagos || [];

      const totalPagado = parseFloat(data.total_pagado || 0);
      const saldoPendiente = parseFloat(data.saldo_pendiente || 0);

      setHistorialPagosVenta(historial);
      setSaldoOriginalUSD(parseFloat(data.precio_final || saldoOriginalUSD));
      setTotalPagadoUSD(totalPagado);
      setSaldoPendienteUSD(saldoPendiente);

      // Actualizar lista de órdenes y detalle
      setOrdenes((prev) =>
        prev.map((o) =>
          o.id_orden === data.orden_id
            ? {
                ...o,
                estado_de_pago: data.estado_de_pago,
                metodo_pago: data.metodo_pago,
              }
            : o
        )
      );
      if (ordenSeleccionada && ordenSeleccionada.id_orden === data.orden_id) {
        setOrdenSeleccionada((prev) => ({
          ...prev,
          estado_de_pago: data.estado_de_pago,
          metodo_pago: data.metodo_pago,
        }));
      }

      // Limpiar inputs de este pago
      setMontoPagoInput("");
      setReferenciaPagoInput("");
    } catch (err) {
      console.error("Error registrando pago de venta:", err);
      const data = err.response?.data || {};
      const msg =
        data.detail ||
        data.monto_local ||
        data.tasa_cambio ||
        data.metodo_pago ||
        "Error al registrar el pago.";
      setModalPagoError(
        typeof msg === "string" ? msg : "Error al registrar el pago."
      );
    } finally {
      setIdOrdenPagoLoading(null);
    }
  };

  // --- VER MONTO EN BS EN EL DETALLE (MISMO COMPORTAMIENTO ANTERIOR) ---
  const totalOrdenDesdeDetalles = () => {
    if (!detallesOrdenSeleccionada.length) return 0;
    return detallesOrdenSeleccionada.reduce((acc, d) => {
      const prodId = d.id_producto?.id_producto || d.id_producto;
      const producto = productos.find((p) => p.id_producto === prodId);
      const precio = d.precio_unitario ?? producto?.precio_venta ?? 0;
      const subtotal = d.subtotal ?? precio * (d.cantidad ?? 0);
      return acc + Number(subtotal);
    }, 0);
  };

  // --- RESUMEN DEVOLUCIÓN (DETALLE ORDEN) ---
  const infoDevolucion = useMemo(() => {
    if (!ordenSeleccionada) return null;

    const estado = (ordenSeleccionada.estado_de_envio || "")
      .toString()
      .toUpperCase();

    const esDevueltaTotal = estado.includes("DEVUELTA");
    const esDevolucionParcial =
      estado.includes("DEVOLUCION") || estado.includes("DEVOLUCIÓN");

    // Solo mostramos el bloque especial si es devuelta total o devolución parcial
    if (!esDevueltaTotal && !esDevolucionParcial) return null;

    if (!detallesOrdenSeleccionada || !detallesOrdenSeleccionada.length) {
      return null;
    }

    let totalDevueltos = 0;
    let totalEntregados = 0;
    let montoDevuelto = 0;
    const notasSet = new Set();

    detallesOrdenSeleccionada.forEach((d) => {
      const cantidad = Number(d.cantidad || 0);
      const cantidadDevueltaRaw =
        d.cantidad_devolvida ?? d.cantidad_devuelta ?? (d.devolucion ? d.cantidad : 0);
      const cantidadDevuelta = Math.min(
        Math.max(Number(cantidadDevueltaRaw || 0), 0),
        cantidad
      );

      // Determinar precio unitario
      let precioUnitario = Number(d.precio_unitario || 0);
      if (!precioUnitario) {
        const prodId = d.id_producto?.id_producto || d.id_producto;
        const prod = productos.find((p) => p.id_producto === prodId);
        if (prod && prod.precio_venta) {
          precioUnitario = Number(prod.precio_venta || 0);
        }
      }

      totalDevueltos += cantidadDevuelta;
      totalEntregados += Math.max(cantidad - cantidadDevuelta, 0);

      if (cantidadDevuelta > 0 && precioUnitario) {
        montoDevuelto += precioUnitario * cantidadDevuelta;
      }

      if (d.nota) {
        notasSet.add(String(d.nota));
      }
    });

    const montoFinal = Number(
      ordenSeleccionada.precio_final ?? totalOrdenDesdeDetalles()
    );
    const montoOriginalEstimado = montoFinal + montoDevuelto;

    return {
      totalDevueltos,
      totalEntregados,
      montoDevuelto,
      montoFinal,
      montoOriginalEstimado,
      notas: Array.from(notasSet),
      tipo: esDevueltaTotal ? "total" : "parcial",
    };
  }, [ordenSeleccionada, detallesOrdenSeleccionada, productos]);

  const calcularMontoBsDetalle = async () => {
    if (!ordenSeleccionada) return;

    const totalUSD = Number(
      ordenSeleccionada.precio_final ?? totalOrdenDesdeDetalles()
    );

    if (!totalUSD || isNaN(totalUSD)) {
      setErrorTasa("No se pudo determinar el total de la orden.");
      return;
    }

    try {
      setLoadingTasa(true);
      setErrorTasa("");
      setMontoBsDetalle(null);
      setTasaBCV(null);

      const res = await api.get(
        `http://127.0.0.1:8000/api${API_TASA_LOCAL}`
      );
      const data = res.data || {};
      const tasa = data.promedio ?? data.price;
      const tasaNum = Number(tasa);

      if (!tasaNum || isNaN(tasaNum)) {
        setErrorTasa("Tasa BCV inválida.");
        return;
      }

      setTasaBCV(tasaNum);
      setMontoBsDetalle(totalUSD * tasaNum);
    } catch (err) {
      console.error("Error obteniendo tasa BCV:", err);
      setErrorTasa("Error al consultar la tasa BCV.");
    } finally {
      setLoadingTasa(false);
    }
  };

  // --- FILTROS AUX ---
  const clientesFiltrados = clientes.filter((c) => {
    const term = clienteBusqueda.toLowerCase();
    const nombre = (c.nombre || "").toLowerCase();
    const correo = (c.correo || "").toLowerCase();
    const telefono = (c.telefono || "").toLowerCase();
    const rif = (c.rif_cedula || "").toLowerCase();
    return (
      nombre.includes(term) ||
      correo.includes(term) ||
      telefono.includes(term) ||
      rif.includes(term)
    );
  });

  const vendedoresSolo = vendedores.filter((v) => v.tipo === "VENDEDOR");

  const vendedoresFiltrados = vendedoresSolo.filter((v) => {
    const term = vendedorBusqueda.toLowerCase();
    const username = (v.username || "").toLowerCase();
    const nombre = (v.first_name || "").toLowerCase();
    const apellido = (v.last_name || "").toLowerCase();
    const correo = (v.email || "").toLowerCase();
    return (
      username.includes(term) ||
      nombre.includes(term) ||
      apellido.includes(term) ||
      correo.includes(term)
    );
  });

  const manejarEnterClienteBusqueda = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (clientesFiltrados.length > 0) {
        onChangeFiltro("cliente", clientesFiltrados[0].nombre);
      }
    }
  };

  const manejarEnterVendedorBusqueda = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (vendedoresFiltrados.length > 0) {
        const first = vendedoresFiltrados[0];
        const id = first.id_usuario ?? first.id;
        onChangeFiltro("vendedor", id);
      }
    }
  };

  const sortOrdenes = (lista, ordering) => {
    if (!ordering) return lista;
    const desc = ordering.startsWith("-");
    const field = desc ? ordering.slice(1) : ordering;
    const sorted = [...lista].sort((a, b) => {
      const av = a[field];
      const bv = b[field];

      if (av === undefined || av === null) return 1;
      if (bv === undefined || bv === null) return -1;

      if (typeof av === "string" && typeof bv === "string") {
        const cmp = av.localeCompare(bv);
        return desc ? -cmp : cmp;
      }

      const numA = Number(av);
      const numB = Number(bv);

      if (!isNaN(numA) && !isNaN(numB)) {
        if (numA === numB) return 0;
        return desc ? (numB - numA) : (numA - numB);
      }

      // Fallback for other types
      if (av === bv) return 0;
      return desc ? (av > bv ? -1 : 1) : (av > bv ? 1 : -1);
    });

    return sorted;
  };

  const ordenesOrdenadas = sortOrdenes(ordenes, filtros.ordering);
  const totalRegistros = ordenesOrdenadas.length;
  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / pageSize));
  const pagina = Math.min(paginaActual, totalPaginas);
  const inicio = (pagina - 1) * pageSize;
  const fin = inicio + pageSize;
  const ordenesPagina = ordenesOrdenadas.slice(inicio, fin);

  // --- PDF BUSQUEDA ---
  const exportarBusquedaPDF = () => {
    if (!ordenesOrdenadas.length) {
      alert("No hay resultados.");
      return;
    }
    try {
      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.text("Historial de Ventas - DIGRAS", 14, 18);

      const headers = ["ID", "Cliente"];
      if (esGerencia) headers.push("Vendedor");
      headers.push("Fecha", "Estado", "Pago", "Total ($)");

      const rows = ordenesOrdenadas.map((o) => {
        const row = [o.id_orden, nombreCliente(o.id_cliente)];
        if (esGerencia) row.push(nombreVendedor(o.id_usuario));
        row.push(
          o.fecha_orden ? String(o.fecha_orden).slice(0, 10) : "",
          (o.estado_de_envio || "").replace(/_/g, " "),
          (o.estado_de_pago || "").replace(/_/g, " "),
          Number(o.precio_final || 0).toFixed(2)
        );
        return row;
      });

      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 30,
        styles: { fontSize: 8 },
      });
      doc.save("ordenes_busqueda.pdf");
    } catch (e) {
      alert("Error al generar PDF.");
    }
  };

  const exportarOrdenSeleccionadaPDF = () => {
    if (!ordenSeleccionada) return;
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(`Orden #${ordenSeleccionada.id_orden}`, 14, 18);
      doc.setFontSize(10);
      let y = 26;
      doc.text(
        `Cliente: ${nombreCliente(ordenSeleccionada.id_cliente)}`,
        14,
        y
      );
      y += 6;
      doc.text(
        `Vendedor: ${nombreVendedor(ordenSeleccionada.id_usuario)}`,
        14,
        y
      );
      y += 6;
      doc.text(`Fecha: ${ordenSeleccionada.fecha_orden || ""}`, 14, y);
      y += 6;
      doc.text(
        `Estado: ${ordenSeleccionada.estado_de_envio || ""}`,
        14,
        y
      );
      y += 8;

      if (detallesOrdenSeleccionada.length) {
        const rows = detallesOrdenSeleccionada.map((d) => {
          const prodId = d.id_producto?.id_producto || d.id_producto;
          const prod = productos.find((p) => p.id_producto === prodId);
          const nombre =
            prod?.nombre || d.id_producto?.nombre || `#${prodId}`;
          const precio = d.precio_unitario ?? prod?.precio_venta ?? 0;
          const sub = d.subtotal ?? precio * d.cantidad;
          return [
            nombre,
            d.cantidad,
            Number(precio).toFixed(2),
            Number(sub).toFixed(2),
          ];
        });
        autoTable(doc, {
          head: [["Producto", "Cant.", "Precio", "Subtotal"]],
          body: rows,
          startY: y,
        });
      }
      doc.save(`orden_${ordenSeleccionada.id_orden}.pdf`);
    } catch (e) {
      alert("Error al exportar.");
    }
  };

  const onChangeFiltro = (campo, valor) =>
    setFiltros((prev) => ({ ...prev, [campo]: valor }));

  const limpiarFiltros = () => {
    setFiltros({
      id: "",
      estadoEnvio: "",
      estadoPago: "",
      cliente: "",
      vendedor: "",
      desde: "",
      hasta: "",
      ordering: "-id_orden",
    });
    setClienteBusqueda("");
    setVendedorBusqueda("");
    setPaginaActual(1);
    cerrarDetalleOrden();
    cargarOrdenes(false, {});
  };

  useEffect(() => {
    const usuario = obtenerUsuarioActual();
    setUsuarioActual(usuario);
    cargarDatosMaestros(usuario);
    cargarOrdenes(false);
  }, []);

  const puedeCobrar = usuarioActual && usuarioActual.tipo === "VENDEDOR";

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* HEADER */}
        <div style={styles.header}>
          <div style={styles.titleGroup}>
            <div style={styles.iconCircle}>
              <IconClipboard />
            </div>
            <div>
              <h2 style={styles.title}>Historial de Ventas</h2>
              <p style={styles.subtitle}>
                {esGerencia
                  ? "Supervisión general de todas las órdenes del sistema."
                  : "Consulta y gestión de tus órdenes emitidas."}
              </p>
            </div>
          </div>
          <button
            style={styles.btnGhost}
            onClick={exportarBusquedaPDF}
            disabled={!ordenesOrdenadas.length}
          >
            <IconDownload /> Exportar PDF
          </button>
        </div>

        {/* MINI DASHBOARD */}
        <div style={styles.dashboardBar}>
          <div style={styles.dashboardItem}>
            <span style={styles.dashboardLabel}>Pendientes por pago</span>
            <span style={styles.dashboardValue}>
              {dashboardStats.pendientesPago}
            </span>
          </div>
          <div style={styles.dashboardItem}>
            <span style={styles.dashboardLabel}>Ventas últimos 30 días</span>
            <span style={styles.dashboardValue}>
              $ {dashboardStats.ventasUltimoMes.toFixed(2)}
            </span>
          </div>
          <div style={styles.dashboardItem}>
            <span style={styles.dashboardLabel}>Cliente con más compras</span>
            <span style={styles.dashboardValueSmall}>
              {dashboardStats.clienteTopNombre}
              {dashboardStats.clienteTopNombre !== "-" && (
                <span style={styles.dashboardSub}>
                  {" "}
                  ({dashboardStats.clienteTopCount})
                </span>
              )}
            </span>
          </div>
          <div style={styles.dashboardItem}>
            <span style={styles.dashboardLabel}>Vendedor con más ventas</span>
            <span style={styles.dashboardValueSmall}>
              {dashboardStats.vendedorTopNombre}
              {dashboardStats.vendedorTopNombre !== "-" && (
                <span style={styles.dashboardSub}>
                  {" "}
                  ({dashboardStats.vendedorTopCount})
                </span>
              )}
            </span>
          </div>
          <div style={styles.dashboardItem}>
            <span style={styles.dashboardLabel}>Órdenes totales</span>
            <span style={styles.dashboardValue}>{dashboardStats.total}</span>
          </div>
          <div style={styles.dashboardItem}>
            <span style={styles.dashboardLabel}>Órdenes entregadas</span>
            <span style={styles.dashboardValue}>
              {dashboardStats.totalEntregadas}
            </span>
          </div>
          <div style={styles.dashboardItem}>
            <span style={styles.dashboardLabel}>Aún sin entregar</span>
            <span style={styles.dashboardValue}>
              {dashboardStats.totalNoEntregadas}
            </span>
          </div>
        </div>

        {mensaje && (
          <div
            style={{
              padding: 12,
              background: "#dcfce7",
              color: "#166534",
              borderRadius: 8,
              marginBottom: 20,
            }}
          >
            {mensaje}
          </div>
        )}
        {error && (
          <div
            style={{
              padding: 12,
              background: "#fee2e2",
              color: "#991b1b",
              borderRadius: 8,
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        )}

        {/* FILTROS */}
        <div style={styles.filtersWrapper}>
          <div style={styles.filtersGrid}>
            <div style={{ minWidth: 180, flex: "1 1 180px" }}>
              <label style={styles.label}>ID Orden</label>
              <input
                type="number"
                style={styles.input}
                placeholder="#"
                value={filtros.id}
                onChange={(e) => onChangeFiltro("id", e.target.value)}
              />
            </div>

            {esGerencia && (
              <div style={{ minWidth: 220, flex: "1 1 220px" }}>
                <label style={styles.label}>Vendedor</label>
                <input
                  type="text"
                  style={{ ...styles.input, marginBottom: 6 }}
                  placeholder="Buscar vendedor..."
                  value={vendedorBusqueda}
                  onChange={(e) => setVendedorBusqueda(e.target.value)}
                  onKeyDown={manejarEnterVendedorBusqueda}
                />
                <select
                  style={styles.select}
                  value={filtros.vendedor}
                  onChange={(e) =>
                    onChangeFiltro("vendedor", e.target.value)
                  }
                >
                  <option value="">Todos</option>
                  {vendedoresFiltrados.map((v) => (
                    <option
                      key={v.id_usuario ?? v.id}
                      value={v.id_usuario ?? v.id}
                    >
                      {v.username}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ minWidth: 220, flex: "1 1 220px" }}>
              <label style={styles.label}>Cliente</label>
              <input
                type="text"
                style={{ ...styles.input, marginBottom: 6 }}
                placeholder="Buscar..."
                value={clienteBusqueda}
                onChange={(e) => setClienteBusqueda(e.target.value)}
                onKeyDown={manejarEnterClienteBusqueda}
              />
              <select
                style={styles.select}
                value={filtros.cliente}
                onChange={(e) =>
                  onChangeFiltro("cliente", e.target.value)
                }
              >
                <option value="">Todos</option>
                {clientesFiltrados.map((c) => (
                  <option key={c.id_cliente} value={c.nombre}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ minWidth: 200, flex: "1 1 200px" }}>
              <label style={styles.label}>Estado Envío</label>
              <select
                style={styles.select}
                value={filtros.estadoEnvio}
                onChange={(e) =>
                  onChangeFiltro("estadoEnvio", e.target.value)
                }
              >
                <option value="">Todos</option>
                <option value="PENDIENTE POR APROBACIÓN">
                  Pendiente por aprobación
                </option>
                <option value="APROBADA">Aprobada</option>
                <option value="PREPARADA">Preparada</option>
                <option value="ASIGNADA A ENVÍO">Asignada a envío</option>
                <option value="EN CURSO">En curso</option>
                <option value="ENTREGADA">Entregada</option>
                <option value="CANCELADA">Cancelada</option>
                <option value="DEVUELTA">Devuelta</option>
                <option value="DEVOLUCION PARCIAL">Devolución parcial</option>
              </select>
            </div>

            <div style={{ minWidth: 200, flex: "1 1 200px" }}>
              <label style={styles.label}>Estado Pago</label>
              <select
                style={styles.select}
                value={filtros.estadoPago}
                onChange={(e) =>
                  onChangeFiltro("estadoPago", e.target.value)
                }
              >
                <option value="">Todos</option>
                <option value="PAGADA">Pagada</option>
                <option value="PENDIENTE POR PAGO">
                  Pendiente por pago
                </option>
                <option value="PAGO EN CURSO">Pago en curso</option>
              </select>
            </div>
            <div style={{ minWidth: 200, flex: "1 1 200px" }}>
              <label style={styles.label}>Ordenar por</label>
              <select
                style={styles.select}
                value={filtros.ordering}
                onChange={(e) => onChangeFiltro("ordering", e.target.value)}
              >
                <option value="-id_orden">Más reciente</option>
                <option value="id_orden">Más antigua</option>
                <option value="-precio_final">Mayor precio</option>
                <option value="precio_final">Menor precio</option>
                <option value="-peso_total">Mayor peso</option>
                <option value="peso_total">Menor peso</option>
              </select>
            </div>

            <div
              style={{
                minWidth: 180,
                flex: "1 1 180px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div>
                <label style={styles.label}>Desde</label>
                <input
                  type="date"
                  style={styles.input}
                  value={filtros.desde}
                  onChange={(e) =>
                    onChangeFiltro("desde", e.target.value)
                  }
                />
              </div>
              <div>
                <label style={styles.label}>Hasta</label>
                <input
                  type="date"
                  style={styles.input}
                  value={filtros.hasta}
                  onChange={(e) =>
                    onChangeFiltro("hasta", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              marginTop: 15,
            }}
          >
            <button style={styles.btnGhost} onClick={limpiarFiltros}>
              <IconRefresh /> Limpiar
            </button>
            <button
              style={styles.btnPrimary}
              onClick={() => cargarOrdenes(true)}
              disabled={loading}
            >
              <IconSearch /> {loading ? "..." : "Buscar"}
            </button>
          </div>
        </div>

        {/* TABLA PRINCIPAL */}
        <div style={styles.content}>
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.theadRow}>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Cliente</th>
                  {esGerencia && <th style={styles.th}>Vendedor</th>}
                  <th style={styles.th}>Método</th>
                  <th style={styles.th}>Fecha</th>
                  <th style={styles.th}>Total</th>
                  <th style={styles.th}>Envío</th>
                  <th style={styles.th}>Pago</th>
                  <th style={styles.thAction}>Gestión</th>
                  <th style={styles.thAction}>Editar</th>
                  <th style={styles.thAction}>Eliminar</th>
                  <th style={styles.thAction}>Ver</th>
                </tr>
              </thead>
              <tbody>
                {!loading && ordenesPagina.length === 0 && (
                  <tr>
                    <td
                      colSpan={esGerencia ? 12 : 11}
                      style={{
                        padding: 40,
                        textAlign: "center",
                        color: "#94a3b8",
                      }}
                    >
                      No hay órdenes.
                    </td>
                  </tr>
                )}
                  {ordenesPagina.map((o, idx) => {
                    const isSelected =
                      ordenSeleccionada?.id_orden === o.id_orden;
                    const envioStyle = getEnvioStyle(o.estado_de_envio);
                    const pagoStyle = getPagoStyle(o.estado_de_pago);
                    const puedeEditar = puedeEditarOrden(o);

                    const deleteButtonStyle = {
                      ...styles.btnDangerSmall,
                      ...(puedeEditar
                        ? {}
                        : {
                            backgroundColor: "#f8fafc",
                            borderColor: "#e2e8f0",
                            color: "#cbd5e1",
                            cursor: "not-allowed",
                          }),
                    };

                    // 🔍 Normalizamos el estado de envío para validar pago
                    const estadoEnvioNorm = (o.estado_de_envio || "")
                      .toString()
                      .toUpperCase()
                      .replace(/_/g, " ")
                      .trim();

                    const esPendientePorAprobacionFila =
                      estadoEnvioNorm === "PENDIENTE POR APROBACION" ||
                      estadoEnvioNorm === "PENDIENTE POR APROBACIÓN";

                    const esRechazadaFila =
                      estadoEnvioNorm.includes("RECHAZADA") ||
                      estadoEnvioNorm.includes("RECHAZADO");

                    // ✅ Solo se puede gestionar pago si:
                    //   - el usuario es VENDEDOR (puedeCobrar === true)
                    //   - la orden NO está pendiente por aprobación
                    //   - la orden NO está rechazada
                    const puedeGestionarPago =
                      puedeCobrar && !esPendientePorAprobacionFila && !esRechazadaFila;

                    return (
                      <tr
                        key={o.id_orden}
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                          backgroundColor: isSelected
                            ? "#eff6ff"
                            : idx % 2 === 0
                            ? "#ffffff"
                            : "#fafafa",
                          borderLeft: isSelected
                            ? "4px solid #2563eb"
                            : "4px solid transparent",
                          cursor: "pointer",
                          transition: "background 0.1s",
                        }}
                        onClick={() => verDetallesOrden(o.id_orden)}
                      >
                        <td style={styles.tdBold}>#{o.id_orden}</td>

                        <td style={styles.td}>
                          <button
                            style={styles.linkButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              abrirModalCliente(o.id_cliente);
                            }}
                          >
                            {nombreCliente(o.id_cliente)}
                          </button>
                          <div style={styles.helperText}>
                            Click para ver info
                          </div>
                        </td>

                        {esGerencia && (
                          <td style={styles.td}>
                            <button
                              style={styles.linkButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirModalVendedor(
                                  o.vendedor_detalle || o.id_usuario
                                );
                              }}
                            >
                              {nombreVendedor(o.id_usuario)}
                            </button>
                            <div style={styles.helperText}>
                              Click para ver info
                            </div>
                          </td>
                        )}

                        <td style={styles.td}>{o.metodo_pago}</td>
                        <td style={styles.td}>
                          {o.fecha_orden ? String(o.fecha_orden).slice(0, 10) : ""}
                        </td>
                        <td style={styles.tdAmount}>
                          $ {Number(o.precio_final || 0).toFixed(2)}
                        </td>

                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.badge,
                              backgroundColor: envioStyle.bg,
                              color: envioStyle.text,
                            }}
                          >
                            {o.estado_de_envio?.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.badge,
                              backgroundColor: pagoStyle.bg,
                              color: pagoStyle.text,
                            }}
                          >
                            {o.estado_de_pago?.replace(/_/g, " ")}
                          </span>
                        </td>

                        <td style={styles.tdAction}>
                          <button
                            style={{
                              ...styles.btnSmall,
                              backgroundColor: "#ecfdf5",
                              color: "#166534",
                              cursor: puedeGestionarPago ? "pointer" : "not-allowed",
                              opacity: puedeGestionarPago ? 1 : 0.6,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!puedeGestionarPago) return;
                              abrirModalPago(o);
                            }}
                            disabled={!puedeGestionarPago}
                          >
                            Gestionar pago
                          </button>
                        </td>

                        <td style={styles.tdAction}>
                          <button
                            style={{
                              ...styles.iconBtn,
                              color: puedeEditar ? "#0f766e" : "#cbd5e1",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              abrirModalEditar(o);
                            }}
                            disabled={!puedeEditar}
                          >
                            <IconEdit />
                          </button>
                        </td>

                        <td style={styles.tdAction}>
                          <button
                            style={deleteButtonStyle}
                            onClick={(e) => {
                              e.stopPropagation();
                              abrirModalEliminar(o);
                            }}
                            disabled={!puedeEditar}
                          >
                            Eliminar
                          </button>
                        </td>

                        <td style={styles.tdAction}>
                          <button
                            style={{
                              ...styles.iconBtn,
                              color: isSelected ? "#2563eb" : "#64748b",
                            }}
                          >
                            <IconEye />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div style={styles.paginationWrapper}>
            <div style={styles.paginationInfo}>
              Mostrando {totalRegistros === 0 ? 0 : inicio + 1}-
              {Math.min(fin, totalRegistros)} de {totalRegistros}
            </div>
            <div style={styles.paginationControls}>
              <button
                style={styles.btnPage}
                disabled={pagina <= 1}
                onClick={() => setPaginaActual((p) => p - 1)}
              >
                ◀ Ant
              </button>
              <button
                style={styles.btnPage}
                disabled={pagina >= totalPaginas}
                onClick={() => setPaginaActual((p) => p + 1)}
              >
                Sig ▶
              </button>
            </div>
          </div>
        </div>

        {/* DETALLES (Card Desplegable) */}
        {(ordenSeleccionada || loadingDetalle) && (
          <div ref={detailRef} id="detalle-card" style={styles.detailWrapper}>
            {loadingDetalle ? (
              <div
                style={{
                  textAlign: "center",
                  padding: 20,
                  color: "#64748b",
                }}
              >
                Cargando detalles...
              </div>
            ) : (
              <div style={styles.detailCard}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid #e2e8f0",
                    paddingBottom: 15,
                    marginBottom: 20,
                  }}
                >
                  <h3 style={{ margin: 0, color: "#0f172a" }}>
                    📋 Orden #{ordenSeleccionada.id_orden}
                  </h3>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      style={styles.btnGhost}
                      onClick={exportarOrdenSeleccionadaPDF}
                    >
                      <IconDownload /> PDF
                    </button>
                    <button
                      style={styles.btnGhost}
                      onClick={cerrarDetalleOrden}
                    >
                      Cerrar
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 30,
                    marginBottom: 20,
                  }}
                >
                  <div style={styles.infoBox}>
                    <h4 style={styles.sectionTitle}>General</h4>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Cliente:</span>
                      <div style={{ textAlign: "right" }}>
                        <button
                          style={styles.linkButton}
                          onClick={() =>
                            abrirModalCliente(ordenSeleccionada.id_cliente)
                          }
                        >
                          {nombreCliente(ordenSeleccionada.id_cliente)}
                        </button>
                        <div style={styles.helperTextRight}>
                          Click para ver info
                        </div>
                      </div>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Vendedor:</span>
                      <div style={{ textAlign: "right" }}>
                        <button
                          style={styles.linkButton}
                          onClick={() =>
                            abrirModalVendedor(
                              ordenSeleccionada.vendedor_detalle ||
                                ordenSeleccionada.id_usuario
                            )
                          }
                        >
                          {nombreVendedor(ordenSeleccionada.id_usuario)}
                        </button>
                        <div style={styles.helperTextRight}>
                          Click para ver info
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={styles.infoBox}>
                    <h4 style={styles.sectionTitle}>Estado</h4>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Envío:</span>{" "}
                      <strong>{ordenSeleccionada.estado_de_envio}</strong>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Pago:</span>{" "}
                      <strong>{ordenSeleccionada.estado_de_pago}</strong>
                    </div>
                  </div>
                </div>

                <h4 style={styles.sectionTitle}>Productos</h4>
                {infoDevolucion ? (
                  <table
                    style={{
                      width: "100%",
                      fontSize: "0.9rem",
                      borderCollapse: "collapse",
                      marginBottom: 20,
                    }}
                  >
                    <thead
                      style={{
                        background: "#f8fafc",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      <tr>
                        <th style={styles.thDetalle}>Producto</th>
                        <th
                          style={{
                            ...styles.thDetalle,
                            textAlign: "center",
                          }}
                        >
                          Cant. original
                        </th>
                        <th
                          style={{
                            ...styles.thDetalle,
                            textAlign: "center",
                          }}
                        >
                          Devueltos
                        </th>
                        <th
                          style={{
                            ...styles.thDetalle,
                            textAlign: "center",
                          }}
                        >
                          Entregados
                        </th>
                        <th
                          style={{
                            ...styles.thDetalle,
                            textAlign: "right",
                          }}
                        >
                          Subtotal
                        </th>
                        <th
                          style={{
                            ...styles.thDetalle,
                            textAlign: "right",
                          }}
                        >
                          Monto devuelto
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {detallesOrdenSeleccionada.map((d, i) => {
                        const cantidad = Number(d.cantidad || 0);
                        const cantidadDevueltaRaw =
                          d.cantidad_devolvida ?? d.cantidad_devuelta ?? (d.devolucion ? d.cantidad : 0);
                        const cantidadDevuelta = Math.min(
                          Math.max(Number(cantidadDevueltaRaw || 0), 0),
                          cantidad
                        );
                        const cantidadEntregada = Math.max(
                          cantidad - cantidadDevuelta,
                          0
                        );

                        const prodId = d.id_producto?.id_producto || d.id_producto;
                        const prod = productos.find((p) => p.id_producto === prodId);
                        const nombreProducto =
                          prod?.nombre || d.id_producto?.nombre || d.producto || "-";
                        const skuProducto = prod?.sku || d.id_producto?.sku || "s/SKU";

                        let precioUnitario = Number(d.precio_unitario || 0);
                        if (!precioUnitario) {
                          if (prod && prod.precio_venta) {
                            precioUnitario = Number(prod.precio_venta || 0);
                          }
                        }

                        const subtotal =
                          typeof d.subtotal !== "undefined" && d.subtotal !== null
                            ? Number(d.subtotal)
                            : precioUnitario * cantidad;
                        const subtotalDevuelto = precioUnitario * cantidadDevuelta;

                        let pesoUnitario = Number(d.peso_unitario || 0);
                        if (!pesoUnitario) {
                          if (prod && prod.peso_unidad) {
                            pesoUnitario = Number(prod.peso_unidad || 0);
                          }
                        }
                        const pesoSubtotal = pesoUnitario * cantidad;

                        const esDevuelto = cantidadDevuelta > 0;

                        return (
                          <tr
                            key={i}
                            style={{
                              borderBottom: "1px solid #f1f5f9",
                              backgroundColor: esDevuelto ? "#fef2f2" : "transparent",
                            }}
                          >
                            <td style={styles.tdDetalle}>
                              <div style={{ fontWeight: 600, color: "#0f172a" }}>
                                {nombreProducto}
                              </div>
                              <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 2 }}>
                                SKU: <strong>{skuProducto}</strong>
                                {" · "}
                                Peso unidad: <strong>{pesoUnitario.toFixed(2)} kg</strong>
                                {" · "}
                                Peso subtotal: <strong>{pesoSubtotal.toFixed(2)} kg</strong>
                              </div>
                            </td>
                            <td
                              style={{
                                ...styles.tdDetalle,
                                textAlign: "center",
                              }}
                            >
                              {cantidad}
                            </td>
                            <td
                              style={{
                                ...styles.tdDetalle,
                                textAlign: "center",
                                color: esDevuelto ? "#b91c1c" : "#0f172a",
                                fontWeight: esDevuelto ? 600 : 400,
                              }}
                            >
                              {cantidadDevuelta}
                            </td>
                            <td
                              style={{
                                ...styles.tdDetalle,
                                textAlign: "center",
                                color: cantidadEntregada > 0 ? "#15803d" : "#64748b",
                                fontWeight: cantidadEntregada > 0 ? 600 : 400,
                              }}
                            >
                              {cantidadEntregada}
                            </td>
                            <td
                              style={{
                                ...styles.tdDetalle,
                                textAlign: "right",
                                fontWeight: 600,
                                color: "#0f172a",
                              }}
                            >
                              $ {subtotal.toFixed(2)}
                            </td>
                            <td
                              style={{
                                ...styles.tdDetalle,
                                textAlign: "right",
                                fontWeight: esDevuelto ? 600 : 400,
                                color: esDevuelto ? "#b91c1c" : "#64748b",
                              }}
                            >
                              $ {subtotalDevuelto.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <table
                    style={{
                      width: "100%",
                      fontSize: "0.9rem",
                      borderCollapse: "collapse",
                      marginBottom: 20,
                    }}
                  >
                    <thead
                      style={{
                        background: "#f8fafc",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      <tr>
                        <th style={styles.thDetalle}>Producto</th>
                        <th
                          style={{
                            ...styles.thDetalle,
                            textAlign: "center",
                          }}
                        >
                          Cant.
                        </th>
                        <th
                          style={{
                            ...styles.thDetalle,
                            textAlign: "right",
                          }}
                        >
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {detallesOrdenSeleccionada.map((d, i) => {
                        const cantidad = Number(d.cantidad || 0);
                        const prodId = d.id_producto?.id_producto || d.id_producto;
                        const prod = productos.find((p) => p.id_producto === prodId);
                        const nombreProducto =
                          prod?.nombre || d.id_producto?.nombre || d.producto || "-";
                        const skuProducto = prod?.sku || d.id_producto?.sku || "s/SKU";

                        let pesoUnitario = Number(d.peso_unitario || 0);
                        if (!pesoUnitario) {
                          if (prod && prod.peso_unidad) {
                            pesoUnitario = Number(prod.peso_unidad || 0);
                          }
                        }
                        const pesoSubtotal = pesoUnitario * cantidad;

                        return (
                          <tr
                            key={i}
                            style={{ borderBottom: "1px solid #f1f5f9" }}
                          >
                            <td style={styles.tdDetalle}>
                              <div style={{ fontWeight: 600, color: "#0f172a" }}>
                                {nombreProducto}
                              </div>
                              <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 2 }}>
                                SKU: <strong>{skuProducto}</strong>
                                {" · "}
                                Peso unidad: <strong>{pesoUnitario.toFixed(2)} kg</strong>
                                {" · "}
                                Peso subtotal: <strong>{pesoSubtotal.toFixed(2)} kg</strong>
                              </div>
                            </td>
                            <td
                              style={{
                                ...styles.tdDetalle,
                                textAlign: "center",
                              }}
                            >
                              {d.cantidad}
                            </td>
                            <td
                              style={{
                                ...styles.tdDetalle,
                                textAlign: "right",
                                fontWeight: 600,
                                color: "#0f172a",
                              }}
                            >
                              $ {Number(d.subtotal).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
                <div
                  style={{
                    textAlign: "right",
                    borderTop: "2px solid #e2e8f0",
                    paddingTop: 15,
                  }}
                >
                  {infoDevolucion && (
                    <div
                      style={{
                        textAlign: "right",
                        marginBottom: 12,
                        paddingBottom: 12,
                        borderBottom: "1px dashed #e2e8f0",
                        fontSize: "0.9rem",
                      }}
                    >
                      <div style={{ fontWeight: 600, color: "#0f172a" }}>
                        Resumen de devolución
                      </div>
                      <div style={{ color: "#64748b", marginTop: 2 }}>
                        Productos devueltos:{" "}
                        <strong>{infoDevolucion.totalDevueltos}</strong>
                      </div>
                      <div style={{ color: "#64748b" }}>
                        Productos entregados:{" "}
                        <strong>{infoDevolucion.totalEntregados}</strong>
                      </div>
                      <div style={{ color: "#b91c1c", marginTop: 4 }}>
                        Monto restado por devolución:{" "}
                        <strong>
                          $ {infoDevolucion.montoDevuelto.toFixed(2)}
                        </strong>
                      </div>
                      <div style={{ color: "#0f172a", marginTop: 2 }}>
                        Monto final de la orden:{" "}
                        <strong>
                          $ {infoDevolucion.montoFinal.toFixed(2)}
                        </strong>
                      </div>
                      <div
                        style={{ color: "#94a3b8", marginTop: 2, fontSize: "0.8rem" }}
                      >
                        Monto estimado antes de la devolución:{" "}
                        <strong>
                          $ {infoDevolucion.montoOriginalEstimado.toFixed(2)}
                        </strong>
                      </div>
                    </div>
                  )}
                  {/* Peso total de la orden */}
                  <div
                    style={{
                      fontSize: "0.95rem",
                      color: "#64748b",
                      marginBottom: 4,
                    }}
                  >
                    Peso total:{" "}
                    <strong>
                      {Number(ordenSeleccionada.peso_total || 0).toFixed(2)} kg
                    </strong>
                  </div>

                  {/* Total monetario */}
                  <div
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: "bold",
                      color: "#0f172a",
                    }}
                  >
                    Total: ${" "}
                    {Number(
                      ordenSeleccionada.precio_final ??
                        totalOrdenDesdeDetalles()
                    ).toFixed(2)}
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <button
                      style={styles.btnGhostSmall}
                      onClick={calcularMontoBsDetalle}
                      disabled={loadingTasa}
                    >
                      {loadingTasa
                        ? "Calculando..."
                        : "Ver monto en Bs (tasa BCV)"}
                    </button>

                    {montoBsDetalle != null && tasaBCV != null && (
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: "0.9rem",
                          color: "#0f172a",
                        }}
                      >
                        ≈ Bs {montoBsDetalle.toFixed(2)}
                        <span
                          style={{
                            marginLeft: 6,
                            fontSize: "0.8rem",
                            color: "#64748b",
                          }}
                        >
                          (Tasa BCV: Bs {tasaBCV.toFixed(2)})
                        </span>
                      </div>
                    )}

                    {errorTasa && (
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: "0.8rem",
                          color: "#b91c1c",
                        }}
                      >
                        {errorTasa}
                      </div>
                    )}
                  </div>
                  {infoDevolucion && infoDevolucion.notas.length > 0 && (
                    <div
                      style={{
                        marginTop: 12,
                        paddingTop: 10,
                        borderTop: "1px dashed #e2e8f0",
                        textAlign: "left",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          color: "#0f172a",
                          marginBottom: 4,
                        }}
                      >
                        Notas de la devolución
                      </div>
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: 18,
                          fontSize: "0.85rem",
                          color: "#475569",
                        }}
                      >
                        {infoDevolucion.notas.map((n, idx) => (
                          <li key={idx}>{n}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODAL CLIENTE */}
        {modalClienteVisible && clienteSeleccionado && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h3>Cliente: {clienteSeleccionado.nombre}</h3>
              <p style={{ color: "#64748b", marginTop: 8 }}>
                Información general del cliente.
              </p>
              <div
                style={{
                  marginTop: 12,
                  fontSize: "0.9rem",
                  color: "#0f172a",
                }}
              >
                <div>
                  <strong>Dirección:</strong>{" "}
                  {clienteSeleccionado.direccion || "-"}
                </div>
                <div>
                  <strong>Correo:</strong>{" "}
                  {clienteSeleccionado.correo || "-"}
                </div>
                <div>
                  <strong>Teléfono:</strong>{" "}
                  {clienteSeleccionado.telefono || "-"}
                </div>
                <div>
                  <strong>RIF / Cédula:</strong>{" "}
                  <span style={{ fontFamily: "monospace" }}>
                    {clienteSeleccionado.rif_cedula || "No registrado"}
                  </span>
                </div>
                {typeof clienteSeleccionado.total_ordenes !==
                  "undefined" && (
                  <div>
                    <strong>Total órdenes:</strong>{" "}
                    {clienteSeleccionado.total_ordenes}
                  </div>
                )}
                {typeof clienteSeleccionado.ordenes_activas !==
                  "undefined" && (
                  <div>
                    <strong>Órdenes activas:</strong>{" "}
                    {clienteSeleccionado.ordenes_activas}
                  </div>
                )}
                {typeof clienteSeleccionado.ordenes_pendientes_pago !== "undefined" && (
                  <div>
                    <strong>Órdenes pendientes por pagar:</strong>{" "}
                    {clienteSeleccionado.ordenes_pendientes_pago}
                  </div>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 18,
                }}
              >
                <button
                  style={styles.btnPrimary}
                  onClick={cerrarModalCliente}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL VENDEDOR */}
        {modalVendedorVisible && vendedorSeleccionado && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h3>Vendedor: {vendedorSeleccionado.username}</h3>
              <p style={{ color: "#64748b", marginTop: 8 }}>
                Información general del vendedor.
              </p>
              <div
                style={{
                  marginTop: 12,
                  fontSize: "0.9rem",
                  color: "#0f172a",
                }}
              >
                <div>
                  <strong>Nombre:</strong>{" "}
                  {vendedorSeleccionado.first_name || ""}{" "}
                  {vendedorSeleccionado.last_name || ""}
                </div>
                <div>
                  <strong>Correo:</strong>{" "}
                  {vendedorSeleccionado.email || "-"}
                </div>
                <div>
                  <strong>Tipo usuario:</strong>{" "}
                  {vendedorSeleccionado.tipo || "-"}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 18,
                }}
              >
                <button
                  style={styles.btnPrimary}
                  onClick={cerrarModalVendedor}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL ELIMINAR ORDEN */}
        {modalEliminarVisible && ordenParaEliminar && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h3>Eliminar Orden #{ordenParaEliminar.id_orden}</h3>
              <p style={{ color: "#64748b", marginTop: 8 }}>
                ¿Seguro que deseas eliminar (cancelar) esta orden? Esta
                acción reintegra el stock según la lógica del sistema.
              </p>
              {eliminarError && (
                <div
                  style={{
                    color: "#b91c1c",
                    marginBottom: 8,
                  }}
                >
                  {eliminarError}
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  marginTop: 16,
                }}
              >
                <button
                  style={styles.btnGhost}
                  onClick={cerrarModalEliminar}
                >
                  Cancelar
                </button>
                <button
                  style={styles.btnPrimary}
                  onClick={confirmarEliminarOrden}
                  disabled={eliminarLoading}
                >
                  {eliminarLoading ? "Eliminando..." : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL GESTIONAR PAGO VENTA */}
        {modalPagoVisible && ordenParaPago && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h3>
                Gestionar pago • Orden #{ordenParaPago.id_orden}
              </h3>
              <p style={{ color: "#64748b", marginTop: 6 }}>
                Registra pagos fraccionados o totales para esta orden.
              </p>

              {modalPagoError && (
                <div
                  style={{
                    background: "#fee2e2",
                    color: "#991b1b",
                    padding: "8px 10px",
                    borderRadius: 8,
                    marginTop: 10,
                  }}
                >
                  {modalPagoError}
                </div>
              )}

              {pagosVentaLoading ? (
                <div
                  style={{
                    marginTop: 20,
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  Cargando información de pagos...
                </div>
              ) : (
                <>
                  {/* Cards resumen */}
                  <div style={styles.pagoCardsRow}>
                    <div style={styles.pagoCard}>
                      <div style={styles.pagoLabel}>Total Orden</div>
                      <div style={styles.pagoValue}>
                        ${saldoOriginalUSD.toFixed(2)}
                      </div>
                    </div>
                    <div style={styles.pagoCard}>
                      <div style={styles.pagoLabel}>Pagado</div>
                      <div style={{ ...styles.pagoValue, color: "#16a34a" }}>
                        ${totalPagadoUSD.toFixed(2)}
                      </div>
                    </div>
                    <div style={styles.pagoCard}>
                      <div style={styles.pagoLabel}>Pendiente</div>
                      <div style={{ ...styles.pagoValue, color: "#b91c1c" }}>
                        ${saldoPendienteUSD.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Tasa BCV */}
                  <div style={styles.tasaBarPago}>
                    <span>
                      🏦 <strong>Tasa BCV (ventas):</strong>{" "}
                      {loadingTasaVenta
                        ? "..."
                        : tasaBCVVenta
                        ? `Bs. ${Number(tasaBCVVenta).toFixed(2)}`
                        : "Manual"}
                    </span>
                    {errorTasaVenta && (
                      <div
                        style={{
                          fontSize: "0.75rem",
                          marginTop: 4,
                          color: "#b91c1c",
                        }}
                      >
                        {errorTasaVenta}
                      </div>
                    )}
                  </div>

                  {/* Formulario pago */}
                  <div style={styles.pagoFormBox}>
                    <div style={styles.pagoFormRow}>
                      <div style={{ flex: 2 }}>
                        <label style={styles.label}>Método de pago</label>
                        <select
                          style={styles.pagoSelect}
                          value={metodoPagoVenta}
                          onChange={(e) =>
                            setMetodoPagoVenta(e.target.value)
                          }
                        >
                          {METODOS_PAGO_VENTA.map((m) => (
                            <option key={m.value} value={m.value}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      {isBolivaresVenta && (
                        <div style={{ flex: 1 }}>
                          <label style={styles.label}>Tasa BCV</label>
                          <input
                            type="number"
                            step="0.01"
                            style={styles.pagoInput}
                            value={tasaPagoInput}
                            onChange={(e) =>
                              setTasaPagoInput(e.target.value)
                            }
                            placeholder="0.00"
                          />
                        </div>
                      )}
                    </div>

                    <div style={styles.pagoFormRow}>
                      <div style={{ flex: 1 }}>
                        <label style={styles.label}>
                          Monto ({isBolivaresVenta ? "Bs" : "$"})
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          style={styles.pagoInput}
                          value={montoPagoInput}
                          onChange={(e) =>
                            setMontoPagoInput(e.target.value)
                          }
                          placeholder="0.00"
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={styles.label}>Referencia</label>
                        <input
                          type="text"
                          style={styles.pagoInput}
                          value={referenciaPagoInput}
                          onChange={(e) =>
                            setReferenciaPagoInput(e.target.value)
                          }
                          placeholder={
                            metodoPagoVenta === "EFECTIVO"
                              ? "Opcional"
                              : "Código / Ref."
                          }
                        />
                      </div>
                    </div>

                    <div style={styles.pagoHelperRow}>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "#64748b",
                        }}
                      >
                        {isBolivaresVenta &&
                        (!tasaPagoInput ||
                          parseFloat(tasaPagoInput) <= 0) ? (
                          <span style={{ color: "#f59e0b" }}>
                            ⚠️ Ingrese tasa BCV para calcular
                          </span>
                        ) : (
                          <>
                            Equivale a:{" "}
                            <strong>
                              $
                              {getValorEnUSDVenta(
                                montoPagoInput,
                                tasaPagoInput
                              ).toFixed(2)}
                            </strong>
                          </>
                        )}
                      </span>
                      <div style={{ display: "flex", gap: 10 }}>
                        <button
                          type="button"
                          style={styles.pagoBtnLink}
                          onClick={handlePagarTodoVenta}
                          disabled={saldoRestanteUSD <= 0}
                        >
                          Pagar todo
                        </button>
                        <button
                          style={styles.pagoBtnPrimary}
                          onClick={registrarPagoVenta}
                          disabled={
                            saldoRestanteUSD <= 0 ||
                            !!idOrdenPagoLoading
                          }
                        >
                          {idOrdenPagoLoading === ordenParaPago.id_orden
                            ? "Registrando..."
                            : "Registrar pago"}
                        </button>
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: "0.8rem",
                        marginTop: 4,
                        color: "#64748b",
                      }}
                    >
                      Estado actual:{" "}
                      <strong>
                        {ordenParaPago.estado_de_pago?.replace(
                          /_/g,
                          " "
                        ) || "-"}
                      </strong>
                      . Cada pago afecta el estado de la orden:{" "}
                      <strong>PENDIENTE POR PAGO</strong>,{" "}
                      <strong>PAGO EN CURSO</strong> o{" "}
                      <strong>PAGADA</strong>, y define si el
                      método general es único o <strong>MIXTO</strong>.
                    </div>
                  </div>

                  {/* Historial de pagos */}
                  <h4 style={{ ...styles.sectionTitle, marginTop: 16 }}>
                    Historial de pagos
                  </h4>
                  <div style={styles.pagoTableContainer}>
                    <table style={styles.pagoTable}>
                      <thead>
                        <tr>
                          <th style={styles.pagoTh}>Fecha</th>
                          <th style={styles.pagoTh}>Método</th>
                          <th style={styles.pagoThRight}>Monto local</th>
                          <th style={styles.pagoThRight}>USD</th>
                          <th style={styles.pagoTh}>Referencia</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historialPagosVenta.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              style={{
                                padding: 12,
                                textAlign: "center",
                                color: "#94a3b8",
                              }}
                            >
                              Sin pagos registrados aún.
                            </td>
                          </tr>
                        ) : (
                          historialPagosVenta.map((p) => (
                            <tr key={p.id_pagoventa}>
                              <td style={styles.pagoTd}>
                                {p.fecha_pago
                                  ? String(p.fecha_pago).replace(
                                      "T",
                                      " "
                                    ).slice(0, 16)
                                  : "-"}
                              </td>
                              <td style={styles.pagoTd}>
                                {p.metodo_pago?.replace(/_/g, " ") ||
                                  "-"}
                              </td>
                              <td style={styles.pagoTdRight}>
                                {p.moneda === "VES"
                                  ? `Bs ${Number(
                                      p.monto_local || 0
                                    ).toFixed(2)}`
                                  : `$ ${Number(
                                      p.monto_local || 0
                                    ).toFixed(2)}`}
                              </td>
                              <td style={styles.pagoTdRight}>
                                ${Number(p.monto_usd || 0).toFixed(2)}
                              </td>
                              <td style={styles.pagoTd}>
                                {p.referencia || "-"}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 18,
                }}
              >
                <button
                  style={styles.btnPrimary}
                  onClick={cerrarModalPago}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL EDITAR ORDEN */}
        {modalEditarVisible && ordenParaEditar && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h3>Editar Orden #{ordenParaEditar.id_orden}</h3>
              <div style={{ margin: "15px 0" }}>
                <label style={styles.label}>Método de Pago</label>
                <select
                  style={styles.select}
                  value={formEditar.metodo_pago}
                  onChange={(e) =>
                    handleChangeEditar("metodo_pago", e.target.value)
                  }
                >
                  {METODOS_PAGO.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <label style={styles.label}>
                Productos (Editar Cantidad)
              </label>
              <div
                style={{
                  maxHeight: 200,
                  overflowY: "auto",
                  border: "1px solid #eee",
                  padding: 10,
                  borderRadius: 8,
                }}
              >
                {detallesEditar.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 8,
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: "0.9rem" }}>{d.nombre}</span>
                    <input
                      type="number"
                      min="1"
                      style={{ width: 60, padding: 4 }}
                      value={d.cantidad}
                      onChange={(e) =>
                        handleChangeCantidadProducto(d.id, e.target.value)
                      }
                    />
                  </div>
                ))}
              </div>

              {editarError && (
                <div style={{ color: "red", marginTop: 10 }}>
                  {editarError}
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  marginTop: 20,
                }}
              >
                <button
                  style={styles.btnGhost}
                  onClick={cerrarModalEditar}
                >
                  Cancelar
                </button>
                <button
                  style={styles.btnPrimary}
                  onClick={guardarEdicionOrden}
                  disabled={editarLoading}
                >
                  {editarLoading ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- ESTILOS CSS-IN-JS ---
const styles = {
  container: {
    padding: "24px 32px",
    maxWidth: "1400px",
    margin: "0 auto",
    fontFamily: "'Inter', sans-serif",
  },
  card: {},
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
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
  title: { margin: 0, fontSize: "1.5rem", color: "#0f172a", fontWeight: "700" },
  subtitle: { margin: "4px 0 0", color: "#64748b", fontSize: "0.9rem" },
  filtersWrapper: {
    backgroundColor: "#f8fafc",
    padding: "20px",
    borderRadius: "16px",
    marginBottom: "24px",
    border: "1px solid #e2e8f0",
  },
  filtersGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
  },
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
    backgroundColor: "#0f172a",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  btnGhost: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    backgroundColor: "transparent",
    color: "#64748b",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  content: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
    overflow: "hidden",
    border: "1px solid #f1f5f9",
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" },
  theadRow: {
    backgroundColor: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
  },
  th: {
    padding: "12px 16px",
    textAlign: "left",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    fontSize: "0.75rem",
    letterSpacing: "0.05em",
  },
  thAction: {
    padding: "12px 16px",
    textAlign: "center",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    fontSize: "0.75rem",
  },
  td: { padding: "14px 16px", color: "#334155", verticalAlign: "middle" },
  tdBold: {
    padding: "14px 16px",
    color: "#0f172a",
    fontWeight: "600",
    verticalAlign: "middle",
  },
  tdAmount: {
    padding: "14px 16px",
    color: "#0f172a",
    fontWeight: "700",
    fontFamily: "monospace",
    verticalAlign: "middle",
  },
  tdAction: {
    padding: "14px 16px",
    textAlign: "center",
    verticalAlign: "middle",
  },
  badge: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "0.7rem",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },
  iconBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "8px",
    borderRadius: "8px",
    transition: "background 0.2s",
  },
  btnSmall: {
    padding: "6px 10px",
    borderRadius: "999px",
    border: "1px solid transparent",
    fontSize: "0.75rem",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  btnGhostSmall: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    backgroundColor: "transparent",
    color: "#1e40af",
    border: "1px solid #bfdbfe",
    borderRadius: "999px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "0.8rem",
  },

  // Dashboard compacto
  dashboardBar: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
    padding: "10px 12px",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
  },
  dashboardItem: {
    flex: "1 1 140px",
    minWidth: 140,
    padding: "6px 10px",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  dashboardLabel: {
    fontSize: "0.7rem",
    textTransform: "uppercase",
    color: "#94a3b8",
    fontWeight: 600,
  },
  dashboardValue: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "#0f172a",
  },
  dashboardValueSmall: {
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#0f172a",
  },
  dashboardSub: {
    fontSize: "0.75rem",
    color: "#64748b",
    marginLeft: 4,
  },

  // Botón tipo enlace para nombres clicables
  linkButton: {
    background: "none",
    border: "none",
    padding: 0,
    margin: 0,
    color: "#0f172a",
    cursor: "pointer",
    fontSize: "0.9rem",
    textDecoration: "none",
    fontWeight: 600,
  },

  // Texto de ayuda
  helperText: {
    fontSize: "0.7rem",
    color: "#94a3b8",
    marginTop: 2,
  },
  helperTextRight: {
    fontSize: "0.7rem",
    color: "#94a3b8",
    marginTop: 2,
    textAlign: "right",
  },

  // Botón peligro pequeño
  btnDangerSmall: {
    padding: "6px 10px",
    borderRadius: "999px",
    border: "1px solid #fecaca",
    fontSize: "0.75rem",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap",
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
  },

  // Estilos del detalle (Card)
  detailWrapper: {
    marginTop: "24px",
    animation: "fadeIn 0.4s ease-out",
  },
  detailCard: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "30px",
    boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.1)",
    border: "1px solid #e2e8f0",
  },
  infoBox: {
    backgroundColor: "#f8fafc",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid #f1f5f9",
  },
  sectionTitle: {
    margin: "0 0 15px 0",
    fontSize: "0.85rem",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "8px",
    fontSize: "0.95rem",
    color: "#334155",
  },
  infoLabel: { fontWeight: "600", color: "#475569" },
  thDetalle: {
    padding: "10px",
    textAlign: "left",
    color: "#475569",
    fontWeight: 600,
    fontSize: "0.85rem",
  },
  tdDetalle: {
    padding: "10px",
    color: "#334155",
    verticalAlign: "middle",
  },

  paginationWrapper: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderTop: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
  },
  paginationInfo: { fontSize: "0.8rem", color: "#64748b" },
  paginationControls: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  btnPage: {
    padding: "6px 10px",
    borderRadius: "999px",
    border: "1px solid #cbd5e1",
    fontSize: "0.75rem",
    fontWeight: "500",
    cursor: "pointer",
    backgroundColor: "#ffffff",
    color: "#475569",
  },

  // Modal Z-Index corregido
  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(4px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20000,
  },
  modal: {
    width: "100%",
    maxWidth: "600px",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "20px 24px 18px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    border: "1px solid #e2e8f0",
    maxHeight: "90vh",
    overflowY: "auto",
  },

  // Estilos específicos para el modal de pagos
  pagoCardsRow: {
    display: "flex",
    gap: 10,
    marginTop: 14,
    marginBottom: 10,
  },
  pagoCard: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
  },
  pagoLabel: {
    fontSize: "0.7rem",
    textTransform: "uppercase",
    color: "#94a3b8",
    marginBottom: 4,
    fontWeight: 600,
  },
  pagoValue: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "#0f172a",
  },
  tasaBarPago: {
    marginTop: 6,
    marginBottom: 10,
    padding: "8px 10px",
    borderRadius: 8,
    background: "#eff6ff",
    color: "#1e40af",
    border: "1px solid #bfdbfe",
    fontSize: "0.8rem",
  },
  pagoFormBox: {
    marginTop: 4,
    padding: 12,
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
  },
  pagoFormRow: {
    display: "flex",
    gap: 10,
    marginBottom: 10,
  },
  pagoInput: {
    width: "100%",
    height: "36px",
    padding: "0 10px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    fontSize: "0.9rem",
    outline: "none",
    boxSizing: "border-box",
  },
  pagoSelect: {
    width: "100%",
    height: "36px",
    padding: "0 10px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    fontSize: "0.9rem",
    outline: "none",
    background: "#fff",
    boxSizing: "border-box",
  },
  pagoHelperRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  pagoBtnLink: {
    background: "none",
    border: "none",
    color: "#3b82f6",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "0.8rem",
  },
  pagoBtnPrimary: {
    background: "#0f172a",
    color: "#ffffff",
    border: "none",
    padding: "8px 14px",
    borderRadius: 999,
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  pagoTableContainer: {
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    maxHeight: 220,
    overflowY: "auto",
    background: "#ffffff",
  },
  pagoTable: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.8rem",
  },
  pagoTh: {
    padding: "8px 10px",
    textAlign: "left",
    color: "#64748b",
    fontWeight: 600,
    borderBottom: "1px solid #e5e7eb",
    background: "#f8fafc",
  },
  pagoThRight: {
    padding: "8px 10px",
    textAlign: "right",
    color: "#64748b",
    fontWeight: 600,
    borderBottom: "1px solid #e5e7eb",
    background: "#f8fafc",
  },
  pagoTd: {
    padding: "8px 10px",
    color: "#334155",
    borderBottom: "1px solid #f1f5f9",
  },
  pagoTdRight: {
    padding: "8px 10px",
    textAlign: "right",
    color: "#334155",
    borderBottom: "1px solid #f1f5f9",
  },
};

// Inyectar animación
const styleSheet = document.createElement("style");
styleSheet.innerText =
  "@keyframes fadeIn { from { opacity:0; transform:translateY(15px); } to { opacity:1; transform:translateY(0); } }";
document.head.appendChild(styleSheet);