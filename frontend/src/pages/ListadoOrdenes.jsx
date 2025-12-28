// frontend/src/pages/ListadoOrdenes.jsx

import React, { useEffect, useState } from "react";
import api from "../api/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// --- CONST: MÉTODOS DE PAGO PERMITIDOS ---
const METODOS_PAGO = [
  "EFECTIVO",
  "PAGO MOVIL",
  "TRANSFERENCIA NACIONAL",
  "TRANSFERENCIA INTERNACIONAL",
];

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

export default function ListadoOrdenes() {
  const [ordenes, setOrdenes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [productos, setProductos] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [detallesOrdenSeleccionada, setDetallesOrdenSeleccionada] = useState(
    []
  );
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

  // Usuario actual
  const [usuarioActual, setUsuarioActual] = useState(null);

  // búsqueda en selector de clientes
  const [clienteBusqueda, setClienteBusqueda] = useState("");

  // loading para cambio de pago
  const [idOrdenPagoLoading, setIdOrdenPagoLoading] = useState(null);

  // paginación front
  const [paginaActual, setPaginaActual] = useState(1);
  const pageSize = 10;

  // modal de pago
  const [modalPagoVisible, setModalPagoVisible] = useState(false);
  const [ordenParaPago, setOrdenParaPago] = useState(null);
  const [modalPagoError, setModalPagoError] = useState("");

  // modal de edición
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [ordenParaEditar, setOrdenParaEditar] = useState(null);
  const [formEditar, setFormEditar] = useState({
    metodo_pago: "",
  });
  const [detallesEditar, setDetallesEditar] = useState([]);
  const [editarLoading, setEditarLoading] = useState(false);
  const [editarError, setEditarError] = useState("");

  // --- OBTENER USUARIO ACTUAL DESDE LOCALSTORAGE ---
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

  // --- HELPERS DE COLOR (Estados) ---
  const getEnvioStyle = (status) => {
    if (!status) return { bg: "#f1f5f9", text: "#64748b" };
    const s = status.toUpperCase();
    if (s.includes("PENDIENTE")) return { bg: "#fff7ed", text: "#c2410c" };
    if (s.includes("APROBADA")) return { bg: "#dcfce7", text: "#15803d" };
    if (s.includes("ENTREGADA")) return { bg: "#bbf7d0", text: "#14532d" };
    if (s.includes("CANCELADA")) return { bg: "#fee2e2", text: "#991b1b" };
    if (s.includes("RECHAZADA")) return { bg: "#fee2e2", text: "#b91c1c" };
    return { bg: "#e0f2fe", text: "#0284c7" };
  };

  const getPagoStyle = (status) => {
    if (!status) return { bg: "#f1f5f9", text: "#64748b" };
    const s = status.toUpperCase();
    if (s.includes("PAGADA")) return { bg: "#dcfce7", text: "#15803d" };
    return { bg: "#fff7ed", text: "#c2410c" };
  };

  // --- LÓGICA DE DATOS ---
  const nombreCliente = (idCliente) => {
    const c = clientes.find((c) => c.id_cliente === idCliente);
    return c ? c.nombre : `#${idCliente}`;
  };

  const nombreVendedor = (idUsuario) => {
    if (!idUsuario) return "";
    const v = vendedores.find(
      (u) => u.id_usuario === idUsuario || u.id === idUsuario
    );
    return v ? v.username : `#${idUsuario}`;
  };

  // Helper para obtener id desde posible objeto anidado
  const extraerIdUsuario = (valor) => {
    if (!valor) return null;
    if (typeof valor === "object") {
      return valor.id_usuario ?? valor.id ?? null;
    }
    return valor;
  };

  // ¿El usuario actual es el vendedor que creó la orden?
  const esVendedorPropietario = (orden) => {
    if (!usuarioActual || usuarioActual.tipo !== "VENDEDOR") return false;

    const vendedorActualId =
      usuarioActual.id_usuario ?? usuarioActual.id ?? null;

    const ordenVendedorRaw = orden.id_usuario ?? orden.id_vendedor ?? null;
    const ordenVendedorId = extraerIdUsuario(ordenVendedorRaw);

    if (!vendedorActualId || !ordenVendedorId) return false;

    return Number(vendedorActualId) === Number(ordenVendedorId);
  };

  // ¿Se puede editar esta orden?
  const puedeEditarOrden = (orden) => {
    if (!esVendedorPropietario(orden)) return false;

    // Normalizar estado de envío
    const raw = (orden.estado_de_envio || "")
      .toString()
      .toUpperCase()
      .replace(/_/g, " ")
      .trim();

    // Permitimos ambas formas:
    // "PENDIENTE POR APROBACION" y "PENDIENTE POR APROBACIÓN"
    if (
      raw === "PENDIENTE POR APROBACION" ||
      raw === "PENDIENTE POR APROBACIÓN"
    ) {
      return true;
    }

    return false;
  };

  // --- MODAL EDICIÓN: abrir / cerrar ---
  const abrirModalEditar = async (orden) => {
    if (!puedeEditarOrden(orden)) {
      setError(
        "Solo el vendedor que creó la orden puede editarla y únicamente si la orden está PENDIENTE POR APROBACIÓN."
      );
      return;
    }

    try {
      setEditarError("");
      setMensaje("");
      setError("");

      // Cargar detalles de la orden para poder editar productos
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
      setFormEditar({
        metodo_pago: orden.metodo_pago || "",
      });
      setDetallesEditar(detallesMapeados);
      setModalEditarVisible(true);
    } catch (err) {
      console.error("Error al cargar detalles para editar:", err);
      setError(
        "No se pudieron cargar los productos de la orden para editar. Intenta nuevamente."
      );
    }
  };

  const cerrarModalEditar = () => {
    setModalEditarVisible(false);
    setOrdenParaEditar(null);
    setEditarError("");
    setFormEditar({ metodo_pago: "" });
    setDetallesEditar([]);
  };

  const handleChangeEditar = (campo, valor) => {
    setFormEditar((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleChangeCantidadProducto = (idFila, valor) => {
    let nuevaCantidad = parseInt(valor, 10);
    if (isNaN(nuevaCantidad) || nuevaCantidad < 1) {
      nuevaCantidad = 1;
    }
    setDetallesEditar((prev) =>
      prev.map((d) =>
        d.id === idFila ? { ...d, cantidad: nuevaCantidad } : d
      )
    );
  };

  // --- GUARDAR EDICIÓN DE ORDEN (PATCH al endpoint de tu ViewSet) ---
  const guardarEdicionOrden = async () => {
    if (!ordenParaEditar) return;

    // Reforzamos validaciones por si el estado cambió mientras tanto
    if (!puedeEditarOrden(ordenParaEditar)) {
      setEditarError(
        "La orden ya no cumple las condiciones para ser editada (vendedor y estado)."
      );
      return;
    }

    if (!formEditar.metodo_pago) {
      setEditarError("Debes seleccionar un método de pago.");
      return;
    }

    if (!detallesEditar.length) {
      setEditarError("La orden debe tener al menos un producto.");
      return;
    }

    const detallesPayload = detallesEditar
      .filter((d) => d.cantidad && d.cantidad > 0)
      .map((d) => ({
        id_producto: d.id_producto,
        cantidad: d.cantidad,
      }));

    if (!detallesPayload.length) {
      setEditarError("Todas las cantidades son inválidas. Verifica los productos.");
      return;
    }

    try {
      setEditarLoading(true);
      setEditarError("");
      setError("");
      setMensaje("");

      const payload = {
        metodo_pago: formEditar.metodo_pago,
        detalles: detallesPayload,
      };

      // PATCH → usa tu _editar_orden (partial_update)
      const res = await api.patch(
        `/ordenes/${ordenParaEditar.id_orden}/`,
        payload
      );

      const ordenActualizada = res.data || {
        ...ordenParaEditar,
        ...payload,
      };

      // Actualizar listado
      setOrdenes((prev) =>
        prev.map((o) =>
          o.id_orden === ordenParaEditar.id_orden ? ordenActualizada : o
        )
      );

      // Actualizar detalle si está abierta esa misma orden
      setOrdenSeleccionada((prev) =>
        prev && prev.id_orden === ordenParaEditar.id_orden
          ? { ...prev, ...ordenActualizada }
          : prev
      );

      setMensaje("La orden se ha actualizado correctamente.");
      cerrarModalEditar();
    } catch (err) {
      console.error("Error al editar orden:", err);
      const backendMsg =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        err.response?.data?.metodo_pago ||
        err.response?.data?.detalles ||
        "No se pudo actualizar la orden.";
      if (Array.isArray(backendMsg)) {
        setEditarError(backendMsg.join(" "));
      } else if (typeof backendMsg === "string") {
        setEditarError(backendMsg);
      } else {
        setEditarError("No se pudo actualizar la orden.");
      }
    } finally {
      setEditarLoading(false);
    }
  };

  // Carga de datos maestros (clientes, usuarios, productos)
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

      // Si es VENDEDOR, solo ve SUS clientes
      if (usuario && usuario.tipo === "VENDEDOR") {
        const vendedorId = usuario.id_usuario ?? usuario.id;
        listaClientes = listaClientes.filter(
          (c) => c.id_usuario === vendedorId || c.id === vendedorId
        );
      }
      // GERENTE / ADMINISTRADOR: ven todos
      setClientes(listaClientes);

      const usuariosData = Array.isArray(resUsuarios.data)
        ? resUsuarios.data
        : resUsuarios.data.results || [];
      setVendedores(usuariosData.filter((u) => u.tipo === "VENDEDOR"));

      setProductos(resProductos.data);
    } catch (err) {
      console.error("Error maestros:", err);
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
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setOrdenes(data);
      setPaginaActual(1);

      if (conMensaje) setMensaje(`Se encontraron ${data.length} orden(es).`);
    } catch (err) {
      const status = err.response?.status;
      const backendMsg =
        err.response?.data?.error || err.response?.data?.detail;
      if (status === 403 && backendMsg) setError(backendMsg);
      else setError("No se pudieron cargar las órdenes.");
    } finally {
      setLoading(false);
    }
  };

  const verDetallesOrden = async (idOrden) => {
    // Toggle: si ya está abierta, la cerramos
    if (ordenSeleccionada && ordenSeleccionada.id_orden === idOrden) {
      setOrdenSeleccionada(null);
      setDetallesOrdenSeleccionada([]);
      return;
    }

    setLoadingDetalle(true);
    setErrorDetalle("");
    setOrdenSeleccionada(null);
    setDetallesOrdenSeleccionada([]);
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

      setTimeout(() => {
        document
          .getElementById("detalle-card")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    } catch (err) {
      setErrorDetalle("Error al cargar detalles.");
    } finally {
      setLoadingDetalle(false);
    }
  };

  // --- MODAL: ABRIR CONFIRMACIÓN DE PAGO ---
  const abrirModalPago = (orden) => {
    if (!usuarioActual || usuarioActual.tipo !== "VENDEDOR") {
      setError("Solo un usuario de tipo VENDEDOR puede registrar pagos.");
      return;
    }

    const estadoEnvioActual = orden.estado_de_envio || "";
    if (
      estadoEnvioActual.toUpperCase().includes("PENDIENTE") &&
      estadoEnvioActual.toUpperCase().includes("APROBACION")
    ) {
      setError(
        "No puedes registrar pagos para órdenes que están PENDIENTE POR APROBACION."
      );
      return;
    }

    setOrdenParaPago(orden);
    setModalPagoVisible(true);
    setModalPagoError("");
  };

  const cerrarModalPago = () => {
    setModalPagoVisible(false);
    setOrdenParaPago(null);
    setModalPagoError("");
  };

  // --- CONFIRMAR CAMBIO DE ESTADO DE PAGO (desde el modal) ---
  const confirmarCambioPago = async () => {
    if (!ordenParaPago) return;

    if (!usuarioActual || usuarioActual.tipo !== "VENDEDOR") {
      setModalPagoError(
        "Solo un usuario de tipo VENDEDOR puede registrar pagos."
      );
      return;
    }

    const estadoActual = ordenParaPago.estado_de_pago || "";
    const esPagada = estadoActual.toUpperCase().includes("PAGADA");
    const nuevoEstado = esPagada ? "PENDIENTE POR PAGO" : "PAGADA";

    // No permitir cambiar pago si el envío está PENDIENTE POR APROBACION
    const estadoEnvioActual = ordenParaPago.estado_de_envio || "";
    if (
      estadoEnvioActual.toUpperCase().includes("PENDIENTE") &&
      estadoEnvioActual.toUpperCase().includes("APROBACION")
    ) {
      setModalPagoError(
        "No puedes cambiar el estado de pago de una orden que está PENDIENTE POR APROBACION."
      );
      return;
    }

    try {
      setIdOrdenPagoLoading(ordenParaPago.id_orden);
      setError("");
      setMensaje("");
      setModalPagoError("");

      const res = await api.post(
        `/ordenes/${ordenParaPago.id_orden}/cambiar_estado_pago/`,
        {
          nuevo_estado: nuevoEstado,
        }
      );

      const ordenActualizada = res.data || {
        ...ordenParaPago,
        estado_de_pago: nuevoEstado,
      };

      setOrdenes((prev) =>
        prev.map((o) =>
          o.id_orden === ordenParaPago.id_orden ? ordenActualizada : o
        )
      );

      setOrdenSeleccionada((prev) =>
        prev && prev.id_orden === ordenParaPago.id_orden
          ? { ...prev, estado_de_pago: ordenActualizada.estado_de_pago }
          : prev
      );

      setMensaje(
        esPagada
          ? "La orden se marcó nuevamente como pendiente por pago."
          : "La orden se marcó como PAGADA correctamente."
      );

      cerrarModalPago();
    } catch (err) {
      console.error("Error al cambiar estado de pago:", err);
      const backendMsg =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        "No se pudo cambiar el estado de pago.";
      setModalPagoError(backendMsg);
    } finally {
      setIdOrdenPagoLoading(null);
    }
  };

  useEffect(() => {
    const usuario = obtenerUsuarioActual();
    setUsuarioActual(usuario);
    cargarDatosMaestros(usuario);
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
    setClienteBusqueda("");
    setPaginaActual(1);
    setTimeout(() => cargarOrdenes(false), 100);
  };

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

  // Clientes filtrados según el texto de búsqueda
  const clientesFiltrados = clientes.filter((c) =>
    c.nombre.toLowerCase().includes(clienteBusqueda.toLowerCase())
  );

  // --- ORDENAMIENTO & PAGINACIÓN (FRONT) ---
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
        return av.localeCompare(bv);
      }
      if (av > bv) return 1;
      if (av < bv) return -1;
      return 0;
    });

    return desc ? sorted.reverse() : sorted;
  };

  const ordenesOrdenadas = sortOrdenes(ordenes, filtros.ordering);
  const totalRegistros = ordenesOrdenadas.length;
  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / pageSize));
  const pagina = Math.min(paginaActual, totalPaginas);
  const inicio = (pagina - 1) * pageSize;
  const fin = inicio + pageSize;
  const ordenesPagina = ordenesOrdenadas.slice(inicio, fin);

  // --- EXPORTAR PDF: RESULTADOS DE BÚSQUEDA ---
  const exportarBusquedaPDF = () => {
    if (!ordenesOrdenadas.length) {
      alert("No hay resultados para exportar.");
      return;
    }

    try {
      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.text("Historial de Ventas - Resultados de Búsqueda", 14, 18);

      doc.setFontSize(10);
      const filtrosActivos = [];
      if (filtros.id) filtrosActivos.push(`ID: ${filtros.id}`);
      if (filtros.cliente) filtrosActivos.push(`Cliente: ${filtros.cliente}`);
      if (filtros.estadoEnvio)
        filtrosActivos.push(`Envio: ${filtros.estadoEnvio}`);
      if (filtros.estadoPago)
        filtrosActivos.push(`Pago: ${filtros.estadoPago}`);
      if (filtros.desde) filtrosActivos.push(`Desde: ${filtros.desde}`);
      if (filtros.hasta) filtrosActivos.push(`Hasta: ${filtros.hasta}`);

      if (filtrosActivos.length) {
        doc.text("Filtros: " + filtrosActivos.join(" | "), 14, 24);
      }

      const rows = ordenesOrdenadas.map((o) => [
        o.id_orden,
        nombreCliente(o.id_cliente),
        o.fecha_orden ? String(o.fecha_orden).slice(0, 16) : "",
        o.metodo_pago || "",
        (o.estado_de_envio || "").replace(/_/g, " "),
        (o.estado_de_pago || "").replace(/_/g, " "),
        Number(o.precio_final || 0).toFixed(2),
      ]);

      autoTable(doc, {
        head: [
          ["ID", "Cliente", "Fecha", "Método", "Envío", "Pago", "Total (Bs)"],
        ],
        body: rows,
        startY: 30,
        styles: { fontSize: 8 },
      });

      doc.save("ordenes_busqueda.pdf");
    } catch (e) {
      console.error("Error al exportar PDF de búsqueda:", e);
      alert("Ocurrió un error al generar el PDF de resultados.");
    }
  };

  // --- EXPORTAR PDF: ORDEN SELECCIONADA ---
  const exportarOrdenSeleccionadaPDF = () => {
    if (!ordenSeleccionada) {
      alert("Debes seleccionar una orden para exportar.");
      return;
    }

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
      doc.text(
        `Fecha: ${
          ordenSeleccionada.fecha_orden
            ? String(ordenSeleccionada.fecha_orden).slice(0, 16)
            : ""
        }`,
        14,
        y
      );
      y += 6;
      doc.text(
        `Método de pago: ${ordenSeleccionada.metodo_pago || ""}`,
        14,
        y
      );
      y += 6;
      doc.text(
        `Estado envío: ${
          (ordenSeleccionada.estado_de_envio || "").replace(/_/g, " ") ||
          "N/A"
        }`,
        14,
        y
      );
      y += 6;
      doc.text(
        `Estado pago: ${
          (ordenSeleccionada.estado_de_pago || "").replace(/_/g, " ") ||
          "N/A"
        }`,
        14,
        y
      );
      y += 6;

      const total =
        ordenSeleccionada.precio_final || totalOrdenDesdeDetalles() || 0;
      doc.text(`Total: Bs ${Number(total).toFixed(2)}`, 14, y);
      y += 8;

      if (detallesOrdenSeleccionada.length) {
        const rows = detallesOrdenSeleccionada.map((d) => {
          const prodId = d.id_producto?.id_producto || d.id_producto;
          const prod = productos.find((p) => p.id_producto === prodId);
          const nombre =
            prod?.nombre || d.id_producto?.nombre || `#${prodId}`;
          const precio = d.precio_unitario ?? prod?.precio_venta ?? 0;
          const sub = d.subtotal ?? precio * (d.cantidad ?? 0);

          return [
            nombre,
            d.cantidad ?? 0,
            Number(precio).toFixed(2),
            Number(sub).toFixed(2),
          ];
        });

        autoTable(doc, {
          head: [["Producto", "Cant.", "Precio U.", "Subtotal"]],
          body: rows,
          startY: y,
          styles: { fontSize: 8 },
        });
      }

      doc.save(`orden_${ordenSeleccionada.id_orden}.pdf`);
    } catch (e) {
      console.error("Error al exportar PDF de la orden:", e);
      alert("Ocurrió un error al generar el PDF de la orden.");
    }
  };

  const puedeCobrar =
    usuarioActual && usuarioActual.tipo && usuarioActual.tipo === "VENDEDOR";

  // --- RENDER ---
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
                Consulta y gestión de órdenes emitidas
              </p>
            </div>
          </div>
          <button
            style={styles.btnGhost}
            onClick={exportarBusquedaPDF}
            disabled={ordenesOrdenadas.length === 0}
            title={
              ordenesOrdenadas.length === 0
                ? "No hay resultados para exportar."
                : "Exportar resultados actuales a PDF"
            }
          >
            <IconDownload />
            Exportar resultados (PDF)
          </button>
        </div>

        {mensaje && (
          <div
            style={{
              padding: "12px",
              background: "#dcfce7",
              color: "#166534",
              borderRadius: "8px",
              marginBottom: "20px",
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
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        {/* FILTROS */}
        <div style={styles.filtersWrapper}>
          <div style={styles.filtersGrid}>
            <div>
              <label style={styles.label}>ID Orden</label>
              <input
                type="number"
                style={styles.input}
                placeholder="#"
                value={filtros.id}
                onChange={(e) => onChangeFiltro("id", e.target.value)}
              />
            </div>

            {/* CLIENTE: SELECTOR CON BÚSQUEDA */}
            <div>
              <label style={styles.label}>Cliente</label>
              <input
                type="text"
                style={{ ...styles.input, marginBottom: "6px" }}
                placeholder="Buscar por nombre..."
                value={clienteBusqueda}
                onChange={(e) => setClienteBusqueda(e.target.value)}
              />
              <select
                style={styles.select}
                value={filtros.cliente}
                onChange={(e) => onChangeFiltro("cliente", e.target.value)}
                disabled={clientesFiltrados.length === 0}
              >
                <option value="">Todos</option>
                {clientesFiltrados.map((c) => (
                  <option key={c.id_cliente} value={c.nombre}>
                    {c.nombre}
                  </option>
                ))}
              </select>
              {usuarioActual &&
                (usuarioActual.tipo === "GERENTE" ||
                  usuarioActual.tipo === "ADMINISTRADOR") && (
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: "0.7rem",
                      color: "#64748b",
                    }}
                  >
                    * Como {usuarioActual.tipo.toLowerCase()}, ves todos los
                    clientes.
                  </p>
                )}
            </div>

            <div>
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
                <option value="RECHAZADA">Rechazada</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>

            <div>
              <label style={styles.label}>Estado Pago</label>
              <select
                style={styles.select}
                value={filtros.estadoPago}
                onChange={(e) =>
                  onChangeFiltro("estadoPago", e.target.value)
                }
              >
                <option value="">Todos</option>
                <option value="PENDIENTE POR PAGO">Pendiente</option>
                <option value="PAGADA">Pagada</option>
              </select>
            </div>

            <div>
              <label style={styles.label}>Desde</label>
              <input
                type="date"
                style={styles.input}
                value={filtros.desde}
                onChange={(e) => onChangeFiltro("desde", e.target.value)}
              />
            </div>

            <div>
              <label style={styles.label}>Hasta</label>
              <input
                type="date"
                style={styles.input}
                value={filtros.hasta}
                onChange={(e) => onChangeFiltro("hasta", e.target.value)}
              />
            </div>

            {/* ORDENAMIENTO */}
            <div>
              <label style={styles.label}>Ordenar por</label>
              <select
                style={styles.select}
                value={filtros.ordering}
                onChange={(e) => {
                  onChangeFiltro("ordering", e.target.value);
                  setPaginaActual(1);
                }}
              >
                <option value="-fecha_orden">Fecha (más recientes)</option>
                <option value="fecha_orden">Fecha (más antiguas)</option>
                <option value="-id_orden">ID (mayor a menor)</option>
                <option value="id_orden">ID (menor a mayor)</option>
                <option value="-precio_final">Total (mayor a menor)</option>
                <option value="precio_final">Total (menor a mayor)</option>
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
              onClick={() => cargarOrdenes(true)}
              disabled={loading}
            >
              <IconSearch /> {loading ? "Buscando..." : "Buscar"}
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
                  <th style={styles.th}>Método</th>
                  <th style={styles.th}>Fecha</th>
                  <th style={styles.th}>Envío</th>
                  <th style={styles.th}>Pago</th>
                  <th style={styles.th}>Cobro</th>
                  <th style={styles.th}>Total</th>
                  <th style={styles.thAction}>Editar</th>
                  <th style={styles.thAction}>Ver</th>
                </tr>
              </thead>
              <tbody>
                {ordenesPagina.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={10}
                      style={{
                        padding: 40,
                        textAlign: "center",
                        color: "#94a3b8",
                      }}
                    >
                      No hay órdenes registradas.
                    </td>
                  </tr>
                )}

                {ordenesPagina.map((o, idx) => {
                  const isSelected =
                    ordenSeleccionada?.id_orden === o.id_orden;
                  const envioStyle = getEnvioStyle(o.estado_de_envio);
                  const pagoStyle = getPagoStyle(o.estado_de_pago);
                  const esPagada =
                    (o.estado_de_pago || "").toUpperCase().includes("PAGADA");
                  const envioPendienteAprobacion =
                    (o.estado_de_envio || "")
                      .toUpperCase()
                      .includes("PENDIENTE") &&
                    (o.estado_de_envio || "")
                      .toUpperCase()
                      .includes("APROBACION");
                  const puedeEditar = puedeEditarOrden(o);

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
                        transition: "background 0.2s",
                        borderLeft: isSelected
                          ? "4px solid #2563eb"
                          : "4px solid transparent",
                        cursor: "pointer",
                      }}
                      onClick={() => verDetallesOrden(o.id_orden)}
                    >
                      <td style={styles.tdBold}>#{o.id_orden}</td>
                      <td style={styles.td}>{nombreCliente(o.id_cliente)}</td>
                      <td style={styles.td}>{o.metodo_pago}</td>
                      <td style={styles.td}>{o.fecha_orden}</td>
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
                      {/* BOTÓN DE COBRO */}
                      <td style={styles.tdAction}>
                        <button
                          style={{
                            ...styles.btnSmall,
                            backgroundColor: esPagada
                              ? "#fef9c3"
                              : "#ecfdf5",
                            color: esPagada ? "#854d0e" : "#166534",
                            borderColor: esPagada ? "#facc15" : "#22c55e",
                            opacity:
                              idOrdenPagoLoading === o.id_orden ||
                              !puedeCobrar ||
                              envioPendienteAprobacion
                                ? 0.7
                                : 1,
                            cursor:
                              !puedeCobrar ||
                              idOrdenPagoLoading === o.id_orden ||
                              envioPendienteAprobacion
                                ? "not-allowed"
                                : "pointer",
                          }}
                          disabled={
                            idOrdenPagoLoading === o.id_orden ||
                            !puedeCobrar ||
                            envioPendienteAprobacion
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirModalPago(o);
                          }}
                          title={
                            !puedeCobrar
                              ? "Solo un VENDEDOR puede registrar pagos."
                              : envioPendienteAprobacion
                              ? "No puedes cambiar el pago de una orden pendiente por aprobación."
                              : esPagada
                              ? "Marcar nuevamente como pendiente por pago"
                              : "Marcar como pagada"
                          }
                        >
                          {idOrdenPagoLoading === o.id_orden
                            ? "Procesando..."
                            : esPagada
                            ? "Marcar pendiente"
                            : "Marcar pagada"}
                        </button>
                      </td>
                      <td style={styles.tdAmount}>
                        Bs {Number(o.precio_final || 0).toFixed(2)}
                      </td>
                      {/* BOTÓN EDITAR */}
                      <td style={styles.tdAction}>
                        <button
                          style={{
                            ...styles.iconBtn,
                            color: puedeEditar ? "#0f766e" : "#cbd5e1",
                            borderRadius: "999px",
                            border: "1px solid transparent",
                            padding: "6px 10px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            backgroundColor: puedeEditar
                              ? "#ecfdf5"
                              : "#f8fafc",
                            cursor: puedeEditar ? "pointer" : "not-allowed",
                          }}
                          disabled={!puedeEditar}
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirModalEditar(o);
                          }}
                          title={
                            puedeEditar
                              ? "Editar esta orden"
                              : "Solo el vendedor creador puede editar órdenes PENDIENTE POR APROBACIÓN."
                          }
                        >
                          <IconEdit /> Editar
                        </button>
                      </td>
                      {/* BOTÓN VER */}
                      <td style={styles.tdAction}>
                        <button
                          style={{
                            ...styles.iconBtn,
                            color: isSelected ? "#2563eb" : "#64748b",
                          }}
                          title="Ver Detalles"
                          onClick={(e) => {
                            e.stopPropagation();
                            verDetallesOrden(o.id_orden);
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

          {/* PAGINADOR */}
          <div style={styles.paginationWrapper}>
            <div style={styles.paginationInfo}>
              {totalRegistros === 0 ? (
                "Mostrando 0 registros."
              ) : (
                <>
                  Mostrando{" "}
                  <strong>
                    {inicio + 1}-{Math.min(fin, totalRegistros)}
                  </strong>{" "}
                  de <strong>{totalRegistros}</strong> orden(es)
                </>
              )}
            </div>
            <div style={styles.paginationControls}>
              <button
                style={styles.btnPage}
                disabled={pagina <= 1 || totalRegistros === 0}
                onClick={() =>
                  setPaginaActual((prev) => Math.max(1, prev - 1))
                }
              >
                ◀ Anterior
              </button>
              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                Página {pagina} de {totalPaginas}
              </span>
              <button
                style={styles.btnPage}
                disabled={
                  pagina >= totalPaginas || totalRegistros === 0
                }
                onClick={() =>
                  setPaginaActual((prev) =>
                    Math.min(totalPaginas, prev + 1)
                  )
                }
              >
                Siguiente ▶
              </button>
            </div>
          </div>
        </div>

        {/* DETALLE DESPLEGABLE */}
        {(ordenSeleccionada || loadingDetalle || errorDetalle) && (
          <div id="detalle-card" style={styles.detailWrapper}>
            {loadingDetalle && (
              <div
                style={{ textAlign: "center", padding: 20, color: "#64748b" }}
              >
                Cargando detalles...
              </div>
            )}
            {errorDetalle && (
              <div
                style={{ textAlign: "center", padding: 20, color: "#ef4444" }}
              >
                {errorDetalle}
              </div>
            )}

            {ordenSeleccionada && !loadingDetalle && !errorDetalle && (
              <div style={styles.detailCard}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: "1px solid #e2e8f0",
                    paddingBottom: 15,
                    marginBottom: 20,
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      color: "#0f172a",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    📋 Detalle de Orden #{ordenSeleccionada.id_orden}
                    <span
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 400,
                        color: "#64748b",
                        backgroundColor: "#f1f5f9",
                        padding: "2px 8px",
                        borderRadius: 4,
                      }}
                    >
                      {ordenSeleccionada.fecha_orden}
                    </span>
                  </h3>
                  <button
                    style={styles.btnGhost}
                    onClick={exportarOrdenSeleccionadaPDF}
                  >
                    <IconDownload /> Exportar PDF
                  </button>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 30,
                    marginBottom: 30,
                  }}
                >
                  <div style={styles.infoBox}>
                    <h4 style={styles.sectionTitle}>Información General</h4>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Cliente:</span>
                      <span>{nombreCliente(ordenSeleccionada.id_cliente)}</span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Vendedor:</span>
                      <span>{nombreVendedor(ordenSeleccionada.id_usuario)}</span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Método Pago:</span>
                      <span>{ordenSeleccionada.metodo_pago}</span>
                    </div>
                  </div>

                  <div style={styles.infoBox}>
                    <h4 style={styles.sectionTitle}>Estado de la Orden</h4>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Envío:</span>
                      <span
                        style={{
                          ...styles.badge,
                          ...getEnvioStyle(ordenSeleccionada.estado_de_envio),
                        }}
                      >
                        {ordenSeleccionada.estado_de_envio}
                      </span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Pago:</span>
                      <span
                        style={{
                          ...styles.badge,
                          ...getPagoStyle(ordenSeleccionada.estado_de_pago),
                        }}
                      >
                        {ordenSeleccionada.estado_de_pago}
                      </span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Estatus:</span>
                      <span
                        style={{
                          fontWeight: "bold",
                          color: ordenSeleccionada.cancelacion
                            ? "#ef4444"
                            : "#10b981",
                        }}
                      >
                        {ordenSeleccionada.cancelacion ? "CANCELADA" : "ACTIVA"}
                      </span>
                    </div>
                  </div>
                </div>

                <h4 style={styles.sectionTitle}>Productos Incluidos</h4>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "0.9rem",
                    marginBottom: 20,
                  }}
                >
                  <thead
                    style={{
                      backgroundColor: "#f8fafc",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    <tr>
                      <th
                        style={{
                          padding: 10,
                          textAlign: "left",
                          color: "#475569",
                        }}
                      >
                        Producto
                      </th>
                      <th
                        style={{
                          padding: 10,
                          textAlign: "center",
                          color: "#475569",
                        }}
                      >
                        Cant.
                      </th>
                      <th
                        style={{
                          padding: 10,
                          textAlign: "right",
                          color: "#475569",
                        }}
                      >
                        Precio U.
                      </th>
                      <th
                        style={{
                          padding: 10,
                          textAlign: "right",
                          color: "#475569",
                        }}
                      >
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {detallesOrdenSeleccionada.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          style={{
                            padding: 20,
                            textAlign: "center",
                            color: "#94a3b8",
                          }}
                        >
                          Sin productos.
                        </td>
                      </tr>
                    ) : (
                      detallesOrdenSeleccionada.map((d, i) => {
                        const prodId =
                          d.id_producto?.id_producto || d.id_producto;
                        const prod = productos.find(
                          (p) => p.id_producto === prodId
                        );
                        const nombre =
                          prod?.nombre ||
                          d.id_producto?.nombre ||
                          `#${prodId}`;
                        const precio =
                          d.precio_unitario ?? prod?.precio_venta ?? 0;
                        const sub =
                          d.subtotal ?? precio * (d.cantidad ?? 0);
                        return (
                          <tr
                            key={i}
                            style={{ borderBottom: "1px solid #f1f5f9" }}
                          >
                            <td style={{ padding: 10, color: "#334155" }}>
                              {nombre}
                            </td>
                            <td
                              style={{
                                padding: 10,
                                textAlign: "center",
                                color: "#334155",
                              }}
                            >
                              {d.cantidad}
                            </td>
                            <td
                              style={{
                                padding: 10,
                                textAlign: "right",
                                color: "#334155",
                              }}
                            >
                              Bs {Number(precio).toFixed(2)}
                            </td>
                            <td
                              style={{
                                padding: 10,
                                textAlign: "right",
                                fontWeight: "600",
                                color: "#0f172a",
                              }}
                            >
                              Bs {Number(sub).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>

                <div
                  style={{
                    textAlign: "right",
                    fontSize: "1.2rem",
                    fontWeight: "bold",
                    color: "#0f172a",
                    borderTop: "2px solid #e2e8f0",
                    paddingTop: 15,
                  }}
                >
                  Total: Bs {totalOrdenDesdeDetalles().toFixed(2)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODAL DE CONFIRMACIÓN DE PAGO */}
        {modalPagoVisible && ordenParaPago && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h3 style={{ marginTop: 0, marginBottom: 10 }}>
                {ordenParaPago.estado_de_pago &&
                ordenParaPago.estado_de_pago
                  .toUpperCase()
                  .includes("PAGADA")
                  ? "Revertir pago de orden"
                  : "Confirmar pago de orden"}
              </h3>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "#64748b",
                  marginBottom: 16,
                }}
              >
                Revisa la información antes de confirmar el cambio de estado
                de pago de esta orden.
              </p>

              <div style={styles.modalInfoRow}>
                <span style={styles.modalLabel}>Orden:</span>
                <span>#{ordenParaPago.id_orden}</span>
              </div>
              <div style={styles.modalInfoRow}>
                <span style={styles.modalLabel}>Cliente:</span>
                <span>{nombreCliente(ordenParaPago.id_cliente)}</span>
              </div>
              <div style={styles.modalInfoRow}>
                <span style={styles.modalLabel}>Método de pago:</span>
                <span>{ordenParaPago.metodo_pago || "N/A"}</span>
              </div>
              <div style={styles.modalInfoRow}>
                <span style={styles.modalLabel}>Total:</span>
                <span>
                  Bs {Number(ordenParaPago.precio_final || 0).toFixed(2)}
                </span>
              </div>
              <div style={styles.modalInfoRow}>
                <span style={styles.modalLabel}>Estado actual:</span>
                <span>
                  {ordenParaPago.estado_de_pago || "PENDIENTE POR PAGO"}
                </span>
              </div>

              {modalPagoError && (
                <div
                  style={{
                    marginTop: 10,
                    marginBottom: 5,
                    padding: 8,
                    backgroundColor: "#fee2e2",
                    color: "#991b1b",
                    borderRadius: 6,
                    fontSize: "0.8rem",
                  }}
                >
                  {modalPagoError}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  marginTop: 20,
                }}
              >
                <button style={styles.btnGhost} onClick={cerrarModalPago}>
                  Cancelar
                </button>
                <button
                  style={styles.btnPrimary}
                  onClick={confirmarCambioPago}
                  disabled={idOrdenPagoLoading === ordenParaPago.id_orden}
                >
                  {idOrdenPagoLoading === ordenParaPago.id_orden
                    ? "Procesando..."
                    : ordenParaPago.estado_de_pago &&
                      ordenParaPago.estado_de_pago
                        .toUpperCase()
                        .includes("PAGADA")
                    ? "Marcar pendiente"
                    : "Confirmar pago"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE EDICIÓN DE ORDEN */}
        {modalEditarVisible && ordenParaEditar && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h3 style={{ marginTop: 0, marginBottom: 10 }}>
                Editar Orden #{ordenParaEditar.id_orden}
              </h3>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "#64748b",
                  marginBottom: 16,
                }}
              >
                Solo puedes editar órdenes que estén{" "}
                <strong>PENDIENTE POR APROBACIÓN</strong> y que hayas creado
                tú como vendedor. El inventario se ajustará automáticamente
                si cambias las cantidades de los productos.
              </p>

              <div style={styles.modalInfoRow}>
                <span style={styles.modalLabel}>Cliente:</span>
                <span>{nombreCliente(ordenParaEditar.id_cliente)}</span>
              </div>

              <div style={styles.modalInfoRow}>
                <span style={styles.modalLabel}>Estado envío:</span>
                <span>
                  {ordenParaEditar.estado_de_envio?.replace(/_/g, " ")}
                </span>
              </div>

              {/* MÉTODO DE PAGO: SOLO SELECT, SIN ESCRIBIR */}
              <div style={{ marginTop: 14, marginBottom: 8 }}>
                <label
                  style={{
                    ...styles.modalLabel,
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Método de pago
                </label>
                <select
                  style={{ ...styles.input, width: "100%" }}
                  value={formEditar.metodo_pago}
                  onChange={(e) =>
                    handleChangeEditar("metodo_pago", e.target.value)
                  }
                >
                  <option value="">Selecciona método de pago</option>
                  {METODOS_PAGO.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                  {/* Si el valor actual no está en la lista, lo mostramos igual */}
                  {formEditar.metodo_pago &&
                    !METODOS_PAGO.includes(formEditar.metodo_pago) && (
                      <option value={formEditar.metodo_pago}>
                        {formEditar.metodo_pago}
                      </option>
                    )}
                </select>
              </div>

              {/* EDICIÓN DE PRODUCTOS */}
              <div style={{ marginTop: 16 }}>
                <label
                  style={{
                    ...styles.modalLabel,
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Productos de la orden
                </label>
                <div
                  style={{
                    maxHeight: "220px",
                    overflowY: "auto",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    padding: 8,
                    backgroundColor: "#f8fafc",
                  }}
                >
                  {detallesEditar.length === 0 ? (
                    <p
                      style={{
                        fontSize: "0.85rem",
                        color: "#94a3b8",
                        margin: 0,
                      }}
                    >
                      La orden no tiene productos para editar.
                    </p>
                  ) : (
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: "0.85rem",
                      }}
                    >
                      <thead>
                        <tr>
                          <th
                            style={{
                              textAlign: "left",
                              padding: "6px",
                              color: "#64748b",
                            }}
                          >
                            Producto
                          </th>
                          <th
                            style={{
                              textAlign: "center",
                              padding: "6px",
                              color: "#64748b",
                            }}
                          >
                            Cantidad
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {detallesEditar.map((d) => (
                          <tr key={d.id}>
                            <td
                              style={{
                                padding: "6px",
                                color: "#0f172a",
                                verticalAlign: "middle",
                              }}
                            >
                              {d.nombre}
                            </td>
                            <td
                              style={{
                                padding: "6px",
                                textAlign: "center",
                                verticalAlign: "middle",
                              }}
                            >
                              <input
                                type="number"
                                min={1}
                                style={{
                                  width: "80px",
                                  padding: "4px 6px",
                                  borderRadius: 6,
                                  border: "1px solid #cbd5e1",
                                  fontSize: "0.8rem",
                                  textAlign: "center",
                                }}
                                value={d.cantidad}
                                onChange={(e) =>
                                  handleChangeCantidadProducto(
                                    d.id,
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {editarError && (
                <div
                  style={{
                    marginTop: 10,
                    marginBottom: 5,
                    padding: 8,
                    backgroundColor: "#fee2e2",
                    color: "#991b1b",
                    borderRadius: 6,
                    fontSize: "0.8rem",
                  }}
                >
                  {editarError}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  marginTop: 20,
                }}
              >
                <button style={styles.btnGhost} onClick={cerrarModalEditar}>
                  Cancelar
                </button>
                <button
                  style={styles.btnPrimary}
                  onClick={guardarEdicionOrden}
                  disabled={editarLoading}
                >
                  {editarLoading ? "Guardando..." : "Guardar cambios"}
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

  filtersWrapper: {
    backgroundColor: "#f8fafc",
    padding: "20px",
    borderRadius: "16px",
    marginBottom: "24px",
    border: "1px solid #e2e8f0",
  },
  filtersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
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
  theadRow: { backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" },
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
  td: {
    padding: "14px 16px",
    color: "#334155",
    verticalAlign: "middle",
  },
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

  detailWrapper: { marginTop: "24px", animation: "fadeIn 0.3s ease-out" },
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

  paginationWrapper: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderTop: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
  },
  paginationInfo: {
    fontSize: "0.8rem",
    color: "#64748b",
  },
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
    maxWidth: "520px",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "20px 24px 18px",
    boxShadow: "0 20px 40px rgba(15, 23, 42, 0.3)",
    border: "1px solid #e2e8f0",
  },
  modalInfoRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 6,
    fontSize: "0.9rem",
    color: "#334155",
  },
  modalLabel: {
    fontWeight: 600,
    color: "#475569",
  },
};

// Inyectar animación
const styleSheet = document.createElement("style");
styleSheet.innerText =
  "@keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }";
document.head.appendChild(styleSheet);