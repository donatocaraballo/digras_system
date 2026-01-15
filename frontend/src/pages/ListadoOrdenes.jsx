// frontend/src/pages/ListadoOrdenes.jsx

import React, { useEffect, useState, useRef } from "react";
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
const IconClipboard = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>;
const IconSearch = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const IconRefresh = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>;
const IconEye = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const IconDownload = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>;
const IconEdit = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>;

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
    id: "", estadoEnvio: "", estadoPago: "", cliente: "", vendedor: "", desde: "", hasta: "", ordering: "-fecha_orden",
  });

  const [usuarioActual, setUsuarioActual] = useState(null);
  const [clienteBusqueda, setClienteBusqueda] = useState("");
  const [vendedorBusqueda, setVendedorBusqueda] = useState("");
  const [idOrdenPagoLoading, setIdOrdenPagoLoading] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const pageSize = 10;

  // Modales
  const [modalPagoVisible, setModalPagoVisible] = useState(false);
  const [ordenParaPago, setOrdenParaPago] = useState(null);
  const [modalPagoError, setModalPagoError] = useState("");

  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [ordenParaEditar, setOrdenParaEditar] = useState(null);
  const [formEditar, setFormEditar] = useState({ metodo_pago: "" });
  const [detallesEditar, setDetallesEditar] = useState([]);
  const [editarLoading, setEditarLoading] = useState(false);
  const [editarError, setEditarError] = useState("");

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
        } catch (e) { continue; }
      }
    }
    return null;
  };

  // --- HELPERS ROL ---
  const esGerencia = usuarioActual && (usuarioActual.tipo === "GERENTE" || usuarioActual.tipo === "ADMINISTRADOR" || usuarioActual.is_superuser);

  // --- HELPERS ESTILOS ---
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
    if (!idUsuario) return "-";
    if (typeof idUsuario === 'object') return idUsuario.username || "-";
    const v = vendedores.find((u) => u.id_usuario === idUsuario || u.id === idUsuario);
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
    const raw = (orden.estado_de_envio || "").toString().toUpperCase().replace(/_/g, " ").trim();
    if (raw === "PENDIENTE POR APROBACION" || raw === "PENDIENTE POR APROBACIÓN") return true;
    return false;
  };

  // --- MODAL EDICIÓN ---
  const abrirModalEditar = async (orden) => {
    if (!puedeEditarOrden(orden)) {
      setError("Solo el vendedor que creó la orden puede editarla y únicamente si está PENDIENTE POR APROBACIÓN.");
      return;
    }
    try {
      setEditarError(""); setMensaje(""); setError("");
      const res = await api.get(`/ordenes/${orden.id_orden}/detalles/`);
      const detallesRaw = Array.isArray(res.data) ? res.data : res.data.results || [];
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

  const handleChangeEditar = (campo, valor) => setFormEditar((prev) => ({ ...prev, [campo]: valor }));

  const handleChangeCantidadProducto = (idFila, valor) => {
    let nuevaCantidad = parseInt(valor, 10);
    if (isNaN(nuevaCantidad) || nuevaCantidad < 1) nuevaCantidad = 1;
    setDetallesEditar((prev) => prev.map((d) => d.id === idFila ? { ...d, cantidad: nuevaCantidad } : d));
  };

  const guardarEdicionOrden = async () => {
    if (!ordenParaEditar) return;
    if (!puedeEditarOrden(ordenParaEditar)) {
      setEditarError("La orden ya no se puede editar.");
      return;
    }
    if (!formEditar.metodo_pago) { setEditarError("Selecciona método de pago."); return; }
    
    const detallesPayload = detallesEditar
      .filter((d) => d.cantidad > 0)
      .map((d) => ({ id_producto: d.id_producto, cantidad: d.cantidad }));

    if (!detallesPayload.length) { setEditarError("Cantidades inválidas."); return; }

    try {
      setEditarLoading(true); setEditarError("");
      const payload = { metodo_pago: formEditar.metodo_pago, detalles: detallesPayload };
      const res = await api.patch(`/ordenes/${ordenParaEditar.id_orden}/`, payload);
      const ordenActualizada = res.data || { ...ordenParaEditar, ...payload };
      
      setOrdenes((prev) => prev.map((o) => o.id_orden === ordenParaEditar.id_orden ? ordenActualizada : o));
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
        listaClientes = listaClientes.filter((c) => c.id_usuario === vendedorId || c.id === vendedorId);
      }
      setClientes(listaClientes);
      const usuariosData = Array.isArray(resUsuarios.data) ? resUsuarios.data : resUsuarios.data.results || [];
      setVendedores(usuariosData); 
      setProductos(resProductos.data);
    } catch (err) { console.error("Error maestros:", err); }
  };

  const cargarOrdenes = async (conMensaje = false) => {
    setLoading(true); setError(""); if (conMensaje) setMensaje("");
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
      setError("No se pudieron cargar las órdenes.");
    } finally { setLoading(false); }
  };

  const verDetallesOrden = async (idOrden) => {
    // Toggle: Si ya está seleccionada, cerrar
    if (ordenSeleccionada && ordenSeleccionada.id_orden === idOrden) {
      setOrdenSeleccionada(null); setDetallesOrdenSeleccionada([]); return;
    }
    setLoadingDetalle(true); setErrorDetalle(""); setOrdenSeleccionada(null);
    try {
      const [resOrden, resDetalles] = await Promise.all([
        api.get(`/ordenes/${idOrden}/`),
        api.get(`/ordenes/${idOrden}/detalles/`),
      ]);
      setOrdenSeleccionada(resOrden.data);
      setDetallesOrdenSeleccionada(Array.isArray(resDetalles.data) ? resDetalles.data : resDetalles.data.results || []);
    } catch (err) { setErrorDetalle("Error al cargar detalles."); }
    finally { setLoadingDetalle(false); }
  };

  // Efecto de scroll suave
  useEffect(() => {
    if (ordenSeleccionada && detailRef.current) {
        setTimeout(() => {
            detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    }
  }, [ordenSeleccionada]);

  const abrirModalPago = (orden) => {
    if (!usuarioActual || usuarioActual.tipo !== "VENDEDOR") {
      setError("Solo un usuario de tipo VENDEDOR puede registrar pagos.");
      return;
    }
    const estadoEnvio = (orden.estado_de_envio || "").toUpperCase();
    if (estadoEnvio.includes("PENDIENTE") && estadoEnvio.includes("APROBACION")) {
        setError("No puedes registrar pagos en órdenes pendientes por aprobación.");
        return;
    }
    setOrdenParaPago(orden); setModalPagoVisible(true); setModalPagoError("");
  };

  const cerrarModalPago = () => { setModalPagoVisible(false); setOrdenParaPago(null); setModalPagoError(""); };

  const confirmarCambioPago = async () => {
    if (!ordenParaPago) return;
    const esPagada = (ordenParaPago.estado_de_pago || "").toUpperCase().includes("PAGADA");
    const nuevoEstado = esPagada ? "PENDIENTE POR PAGO" : "PAGADA";
    
    try {
      setIdOrdenPagoLoading(ordenParaPago.id_orden); setModalPagoError("");
      const res = await api.post(`/ordenes/${ordenParaPago.id_orden}/cambiar_estado_pago/`, { nuevo_estado: nuevoEstado });
      const ordenActualizada = res.data || { ...ordenParaPago, estado_de_pago: nuevoEstado };
      
      setOrdenes((prev) => prev.map((o) => o.id_orden === ordenParaPago.id_orden ? ordenActualizada : o));
      if (ordenSeleccionada?.id_orden === ordenParaPago.id_orden) {
        setOrdenSeleccionada((prev) => ({ ...prev, estado_de_pago: ordenActualizada.estado_de_pago }));
      }
      setMensaje(esPagada ? "Orden marcada como pendiente." : "Orden marcada como PAGADA.");
      cerrarModalPago();
    } catch (err) { setModalPagoError("Error al cambiar pago."); }
    finally { setIdOrdenPagoLoading(null); }
  };

  useEffect(() => {
    const usuario = obtenerUsuarioActual();
    setUsuarioActual(usuario);
    cargarDatosMaestros(usuario);
    cargarOrdenes(false);
  }, []);

  const onChangeFiltro = (campo, valor) => setFiltros((prev) => ({ ...prev, [campo]: valor }));
  const limpiarFiltros = () => {
    setFiltros({ id: "", estadoEnvio: "", estadoPago: "", cliente: "", vendedor: "", desde: "", hasta: "", ordering: "-fecha_orden" });
    setClienteBusqueda(""); setPaginaActual(1);
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

  const clientesFiltrados = clientes.filter((c) => {
    const term = clienteBusqueda.toLowerCase();
    const nombre = (c.nombre || "").toLowerCase();
    const correo = (c.correo || "").toLowerCase();
    const telefono = (c.telefono || "").toLowerCase();
    return (
      nombre.includes(term) ||
      correo.includes(term) ||
      telefono.includes(term)
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
        onChangeFiltro("vendedor", vendedoresFiltrados[0].id_usuario);
      }
    }
  };

  const sortOrdenes = (lista, ordering) => {
    if (!ordering) return lista;
    const desc = ordering.startsWith("-");
    const field = desc ? ordering.slice(1) : ordering;
    const sorted = [...lista].sort((a, b) => {
      const av = a[field], bv = b[field];
      if (av === undefined || av === null) return 1;
      if (bv === undefined || bv === null) return -1;
      if (typeof av === "string") return av.localeCompare(bv);
      return av > bv ? 1 : -1;
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

  // --- PDF ---
  const exportarBusquedaPDF = () => {
    if (!ordenesOrdenadas.length) { alert("No hay resultados."); return; }
    try {
      const doc = new jsPDF();
      doc.setFontSize(14); doc.text("Historial de Ventas - DIGRAS", 14, 18);
      
      const headers = ["ID", "Cliente"];
      if (esGerencia) headers.push("Vendedor");
      headers.push("Fecha", "Estado", "Pago", "Total (Bs)");

      const rows = ordenesOrdenadas.map((o) => {
        const row = [
          o.id_orden,
          nombreCliente(o.id_cliente),
        ];
        if (esGerencia) row.push(nombreVendedor(o.id_usuario));
        row.push(
          o.fecha_orden ? String(o.fecha_orden).slice(0, 10) : "",
          (o.estado_de_envio || "").replace(/_/g, " "),
          (o.estado_de_pago || "").replace(/_/g, " "),
          Number(o.precio_final || 0).toFixed(2)
        );
        return row;
      });

      autoTable(doc, { head: [headers], body: rows, startY: 30, styles: { fontSize: 8 } });
      doc.save("ordenes_busqueda.pdf");
    } catch (e) { alert("Error al generar PDF."); }
  };

  const exportarOrdenSeleccionadaPDF = () => {
    if (!ordenSeleccionada) return;
    try {
      const doc = new jsPDF();
      doc.setFontSize(16); doc.text(`Orden #${ordenSeleccionada.id_orden}`, 14, 18);
      doc.setFontSize(10);
      let y = 26;
      doc.text(`Cliente: ${nombreCliente(ordenSeleccionada.id_cliente)}`, 14, y); y+=6;
      doc.text(`Vendedor: ${nombreVendedor(ordenSeleccionada.id_usuario)}`, 14, y); y+=6;
      doc.text(`Fecha: ${ordenSeleccionada.fecha_orden || ""}`, 14, y); y+=6;
      doc.text(`Estado: ${ordenSeleccionada.estado_de_envio || ""}`, 14, y); y+=8;
      
      if (detallesOrdenSeleccionada.length) {
        const rows = detallesOrdenSeleccionada.map(d => {
            const prodId = d.id_producto?.id_producto || d.id_producto;
            const prod = productos.find(p => p.id_producto === prodId);
            const nombre = prod?.nombre || d.id_producto?.nombre || `#${prodId}`;
            const precio = d.precio_unitario ?? prod?.precio_venta ?? 0;
            const sub = d.subtotal ?? precio * d.cantidad;
            return [nombre, d.cantidad, Number(precio).toFixed(2), Number(sub).toFixed(2)];
        });
        autoTable(doc, { head: [["Producto", "Cant.", "Precio", "Subtotal"]], body: rows, startY: y });
      }
      doc.save(`orden_${ordenSeleccionada.id_orden}.pdf`);
    } catch (e) { alert("Error al exportar."); }
  };

  const puedeCobrar = usuarioActual && usuarioActual.tipo === "VENDEDOR";

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* HEADER */}
        <div style={styles.header}>
          <div style={styles.titleGroup}>
            <div style={styles.iconCircle}><IconClipboard /></div>
            <div>
              <h2 style={styles.title}>Historial de Ventas</h2>
              <p style={styles.subtitle}>
                {esGerencia 
                  ? "Supervisión general de todas las órdenes del sistema." 
                  : "Consulta y gestión de tus órdenes emitidas."}
              </p>
            </div>
          </div>
          <button style={styles.btnGhost} onClick={exportarBusquedaPDF} disabled={!ordenesOrdenadas.length}>
            <IconDownload /> Exportar PDF
          </button>
        </div>

        {mensaje && <div style={{padding:12, background:"#dcfce7", color:"#166534", borderRadius:8, marginBottom:20}}>{mensaje}</div>}
        {error && <div style={{padding:12, background:"#fee2e2", color:"#991b1b", borderRadius:8, marginBottom:20}}>{error}</div>}

        {/* FILTROS */}
        <div style={styles.filtersWrapper}>
          <div style={styles.filtersGrid}>
            <div>
              <label style={styles.label}>ID Orden</label>
              <input type="number" style={styles.input} placeholder="#" value={filtros.id} onChange={(e) => onChangeFiltro("id", e.target.value)} />
            </div>
            
            {esGerencia && (
              <div>
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
                  onChange={(e) => onChangeFiltro("vendedor", e.target.value)}
                >
                  <option value="">Todos</option>
                  {vendedoresFiltrados.map((v) => (
                    <option key={v.id_usuario} value={v.id_usuario}>
                      {v.username}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label style={styles.label}>Cliente</label>
              <input
                type="text"
                style={{ ...styles.input, marginBottom: 6 }}
                placeholder="Buscar..."
                value={clienteBusqueda}
                onChange={(e) => setClienteBusqueda(e.target.value)}
                onKeyDown={manejarEnterClienteBusqueda}
              />
              <select style={styles.select} value={filtros.cliente} onChange={(e) => onChangeFiltro("cliente", e.target.value)}>
                <option value="">Todos</option>
                {clientesFiltrados.map((c) => <option key={c.id_cliente} value={c.nombre}>{c.nombre}</option>)}
              </select>
            </div>

            <div>
              <label style={styles.label}>Estado Envío</label>
              <select
                style={styles.select}
                value={filtros.estadoEnvio}
                onChange={(e) => onChangeFiltro("estadoEnvio", e.target.value)}
              >
                <option value="">Todos</option>
                <option value="PENDIENTE POR APROBACIÓN">Pendiente por aprobación</option>
                <option value="APROBADA">Aprobada</option>
                <option value="PREPARADA">Preparada</option>
                <option value="ASIGNADA A ENVÍO">Asignada a envío</option>
                <option value="EN CURSO">En curso</option>
                <option value="ENTREGADA">Entregada</option>
                <option value="CANCELADA">Cancelada</option>
                <option value="DEVUELTA">Devuelta</option>
              </select>
            </div>
            <div>
                <label style={styles.label}>Desde</label>
                <input type="date" style={styles.input} value={filtros.desde} onChange={(e) => onChangeFiltro("desde", e.target.value)} />
            </div>
            <div>
                <label style={styles.label}>Hasta</label>
                <input type="date" style={styles.input} value={filtros.hasta} onChange={(e) => onChangeFiltro("hasta", e.target.value)} />
            </div>
          </div>
          <div style={{display:"flex", justifyContent:"flex-end", gap:10, marginTop:15}}>
            <button style={styles.btnGhost} onClick={limpiarFiltros}><IconRefresh /> Limpiar</button>
            <button style={styles.btnPrimary} onClick={() => cargarOrdenes(true)} disabled={loading}><IconSearch /> {loading ? "..." : "Buscar"}</button>
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
                  <th style={styles.thAction}>Cobro</th>
                  <th style={styles.thAction}>Editar</th>
                  <th style={styles.thAction}>Ver</th>
                </tr>
              </thead>
              <tbody>
                {!loading && ordenesPagina.length === 0 && (
                    <tr><td colSpan={esGerencia ? 11 : 10} style={{padding:40, textAlign:"center", color:"#94a3b8"}}>No hay órdenes.</td></tr>
                )}
                {ordenesPagina.map((o, idx) => {
                  const isSelected = ordenSeleccionada?.id_orden === o.id_orden;
                  const envioStyle = getEnvioStyle(o.estado_de_envio);
                  const pagoStyle = getPagoStyle(o.estado_de_pago);
                  const esPagada = (o.estado_de_pago || "").toUpperCase().includes("PAGADA");
                  const puedeEditar = puedeEditarOrden(o);

                  return (
                    <tr key={o.id_orden} style={{
                        borderBottom: "1px solid #f1f5f9",
                        backgroundColor: isSelected ? "#eff6ff" : idx % 2 === 0 ? "#ffffff" : "#fafafa",
                        borderLeft: isSelected ? "4px solid #2563eb" : "4px solid transparent",
                        cursor: "pointer",
                        transition: "background 0.1s"
                    }} onClick={() => verDetallesOrden(o.id_orden)}>
                      
                      <td style={styles.tdBold}>#{o.id_orden}</td>
                      <td style={styles.td}>{nombreCliente(o.id_cliente)}</td>
                      {esGerencia && <td style={styles.td}><strong>{nombreVendedor(o.id_usuario)}</strong></td>}
                      <td style={styles.td}>{o.metodo_pago}</td>
                      <td style={styles.td}>{o.fecha_orden ? String(o.fecha_orden).slice(0,10) : ''}</td>
                      <td style={styles.tdAmount}>Bs {Number(o.precio_final || 0).toFixed(2)}</td>

                      <td style={styles.td}>
                        <span style={{...styles.badge, backgroundColor: envioStyle.bg, color: envioStyle.text}}>
                            {o.estado_de_envio?.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{...styles.badge, backgroundColor: pagoStyle.bg, color: pagoStyle.text}}>
                            {o.estado_de_pago?.replace(/_/g, " ")}
                        </span>
                      </td>
                      
                      <td style={styles.tdAction}>
                        <button style={{...styles.btnSmall, 
                            backgroundColor: esPagada ? "#fef9c3" : "#ecfdf5", 
                            color: esPagada ? "#854d0e" : "#166534",
                            cursor: puedeCobrar ? 'pointer' : 'not-allowed', opacity: puedeCobrar ? 1 : 0.5
                        }}
                        onClick={(e) => { e.stopPropagation(); abrirModalPago(o); }}
                        disabled={!puedeCobrar}
                        >
                            {esPagada ? "Marcar Pendiente" : "Cobrar"}
                        </button>
                      </td>
                      <td style={styles.tdAction}>
                        <button style={{...styles.iconBtn, color: puedeEditar ? "#0f766e" : "#cbd5e1"}}
                            onClick={(e) => { e.stopPropagation(); abrirModalEditar(o); }} disabled={!puedeEditar}
                        >
                            <IconEdit />
                        </button>
                      </td>
                      <td style={styles.tdAction}>
                        <button style={{...styles.iconBtn, color: isSelected ? "#2563eb" : "#64748b"}}>
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
            <div style={styles.paginationInfo}>Mostrando {inicio+1}-{Math.min(fin, totalRegistros)} de {totalRegistros}</div>
            <div style={styles.paginationControls}>
                <button style={styles.btnPage} disabled={pagina <= 1} onClick={() => setPaginaActual(p => p - 1)}>◀ Ant</button>
                <button style={styles.btnPage} disabled={pagina >= totalPaginas} onClick={() => setPaginaActual(p => p + 1)}>Sig ▶</button>
            </div>
          </div>
        </div>

        {/* DETALLES (Card Desplegable) */}
        {(ordenSeleccionada || loadingDetalle) && (
            <div ref={detailRef} id="detalle-card" style={styles.detailWrapper}>
                {loadingDetalle ? <div style={{textAlign:'center', padding:20, color:'#64748b'}}>Cargando detalles...</div> : (
                    <div style={styles.detailCard}>
                        <div style={{display:'flex', justifyContent:'space-between', borderBottom:'1px solid #e2e8f0', paddingBottom:15, marginBottom:20}}>
                            <h3 style={{margin:0, color:'#0f172a'}}>📋 Orden #{ordenSeleccionada.id_orden}</h3>
                            <button style={styles.btnGhost} onClick={exportarOrdenSeleccionadaPDF}><IconDownload /> PDF</button>
                        </div>
                        
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:30, marginBottom:20}}>
                            <div style={styles.infoBox}>
                                <h4 style={styles.sectionTitle}>General</h4>
                                <div style={styles.infoRow}><span style={styles.infoLabel}>Cliente:</span> {nombreCliente(ordenSeleccionada.id_cliente)}</div>
                                <div style={styles.infoRow}><span style={styles.infoLabel}>Vendedor:</span> {nombreVendedor(ordenSeleccionada.id_usuario)}</div>
                            </div>
                            <div style={styles.infoBox}>
                                <h4 style={styles.sectionTitle}>Estado</h4>
                                <div style={styles.infoRow}><span style={styles.infoLabel}>Envío:</span> <strong>{ordenSeleccionada.estado_de_envio}</strong></div>
                                <div style={styles.infoRow}><span style={styles.infoLabel}>Pago:</span> <strong>{ordenSeleccionada.estado_de_pago}</strong></div>
                            </div>
                        </div>

                        <h4 style={styles.sectionTitle}>Productos</h4>
                        <table style={{width:'100%', fontSize:'0.9rem', borderCollapse:'collapse', marginBottom: 20}}>
                            <thead style={{background:'#f8fafc', borderBottom:'1px solid #e2e8f0'}}>
                                <tr>
                                    <th style={styles.thDetalle}>Producto</th>
                                    <th style={{...styles.thDetalle, textAlign:'center'}}>Cant.</th>
                                    <th style={{...styles.thDetalle, textAlign:'right'}}>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {detallesOrdenSeleccionada.map((d, i) => (
                                    <tr key={i} style={{borderBottom:'1px solid #f1f5f9'}}>
                                        <td style={styles.tdDetalle}>{d.id_producto?.nombre || d.producto || '-'}</td>
                                        <td style={{...styles.tdDetalle, textAlign:'center'}}>{d.cantidad}</td>
                                        <td style={{...styles.tdDetalle, textAlign:'right', fontWeight:600, color:'#0f172a'}}>Bs {Number(d.subtotal).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{textAlign:'right', fontSize:'1.2rem', fontWeight:'bold', color:'#0f172a', borderTop:'2px solid #e2e8f0', paddingTop:15}}>
                            Total: Bs {Number(ordenSeleccionada.precio_final).toFixed(2)}
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* MODAL PAGO */}
        {modalPagoVisible && ordenParaPago && (
            <div style={styles.modalOverlay}>
                <div style={styles.modal}>
                    <h3>Confirmar Pago Orden #{ordenParaPago.id_orden}</h3>
                    <p style={{color:'#64748b'}}>¿Deseas cambiar el estado de pago de esta orden?</p>
                    {modalPagoError && <div style={{color:'red', marginBottom:10}}>{modalPagoError}</div>}
                    <div style={{display:'flex', justifyContent:'flex-end', gap:10}}>
                        <button style={styles.btnGhost} onClick={cerrarModalPago}>Cancelar</button>
                        <button style={styles.btnPrimary} onClick={confirmarCambioPago}>Confirmar</button>
                    </div>
                </div>
            </div>
        )}

        {/* MODAL EDITAR */}
        {modalEditarVisible && ordenParaEditar && (
            <div style={styles.modalOverlay}>
                <div style={styles.modal}>
                    <h3>Editar Orden #{ordenParaEditar.id_orden}</h3>
                    <div style={{margin:'15px 0'}}>
                        <label style={styles.label}>Método de Pago</label>
                        <select style={styles.select} value={formEditar.metodo_pago} onChange={e => handleChangeEditar("metodo_pago", e.target.value)}>
                            {METODOS_PAGO.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    
                    <label style={styles.label}>Productos (Editar Cantidad)</label>
                    <div style={{maxHeight:200, overflowY:'auto', border:'1px solid #eee', padding:10, borderRadius:8}}>
                        {detallesEditar.map(d => (
                            <div key={d.id} style={{display:'flex', justifyContent:'space-between', marginBottom:8, alignItems:'center'}}>
                                <span style={{fontSize:'0.9rem'}}>{d.nombre}</span>
                                <input type="number" min="1" style={{width:60, padding:4}} value={d.cantidad} onChange={e => handleChangeCantidadProducto(d.id, e.target.value)} />
                            </div>
                        ))}
                    </div>

                    {editarError && <div style={{color:'red', marginTop:10}}>{editarError}</div>}
                    <div style={{display:'flex', justifyContent:'flex-end', gap:10, marginTop:20}}>
                        <button style={styles.btnGhost} onClick={cerrarModalEditar}>Cancelar</button>
                        <button style={styles.btnPrimary} onClick={guardarEdicionOrden} disabled={editarLoading}>
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

// --- ESTILOS CSS-IN-JS (Unificados) ---
const styles = {
  container: { padding: "24px 32px", maxWidth: "1400px", margin: "0 auto", fontFamily: "'Inter', sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" },
  titleGroup: { display: "flex", alignItems: "center", gap: "16px" },
  iconCircle: { width: "48px", height: "48px", borderRadius: "12px", backgroundColor: "#e0f2fe", color: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center" },
  title: { margin: 0, fontSize: "1.5rem", color: "#0f172a", fontWeight: "700" },
  subtitle: { margin: "4px 0 0", color: "#64748b", fontSize: "0.9rem" },
  filtersWrapper: { backgroundColor: "#f8fafc", padding: "20px", borderRadius: "16px", marginBottom: "24px", border: "1px solid #e2e8f0" },
  filtersGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" },
  label: { display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#475569", marginBottom: "6px", textTransform: "uppercase" },
  input: { width: "100%", height: "40px", padding: "0 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", outline: "none", backgroundColor: "#fff", boxSizing: "border-box" },
  select: { width: "100%", height: "40px", padding: "0 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", outline: "none", backgroundColor: "#fff", boxSizing: "border-box" },
  btnPrimary: { display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", backgroundColor: "#0f172a", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "0.9rem" },
  btnGhost: { display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", backgroundColor: "transparent", color: "#64748b", border: "1px solid #cbd5e1", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "0.9rem" },
  content: { backgroundColor: "#ffffff", borderRadius: "16px", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)", overflow: "hidden", border: "1px solid #f1f5f9" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" },
  theadRow: { backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" },
  th: { padding: "12px 16px", textAlign: "left", fontWeight: "600", color: "#64748b", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.05em" },
  thAction: { padding: "12px 16px", textAlign: "center", fontWeight: "600", color: "#64748b", textTransform: "uppercase", fontSize: "0.75rem" },
  td: { padding: "14px 16px", color: "#334155", verticalAlign: "middle" },
  tdBold: { padding: "14px 16px", color: "#0f172a", fontWeight: "600", verticalAlign: "middle" },
  tdAmount: { padding: "14px 16px", color: "#0f172a", fontWeight: "700", fontFamily: "monospace", verticalAlign: "middle" },
  tdAction: { padding: "14px 16px", textAlign: "center", verticalAlign: "middle" },
  badge: { display: "inline-block", padding: "4px 10px", borderRadius: "20px", fontSize: "0.7rem", fontWeight: "700", whiteSpace: "nowrap" },
  iconBtn: { background: "none", border: "none", cursor: "pointer", padding: "8px", borderRadius: "8px", transition: "background 0.2s" },
  btnSmall: { padding: "6px 10px", borderRadius: "999px", border: "1px solid transparent", fontSize: "0.75rem", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap" },
  
  // Estilos del detalle (Card)
  detailWrapper: { marginTop: "24px", animation: "fadeIn 0.4s ease-out" },
  detailCard: { backgroundColor: "#ffffff", borderRadius: "16px", padding: "30px", boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.1)", border: "1px solid #e2e8f0" },
  infoBox: { backgroundColor: "#f8fafc", padding: "20px", borderRadius: "12px", border: "1px solid #f1f5f9" },
  sectionTitle: { margin: "0 0 15px 0", fontSize: "0.85rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" },
  infoRow: { display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.95rem", color: "#334155" },
  infoLabel: { fontWeight: "600", color: "#475569" },
  thDetalle: { padding: "10px", textAlign: "left", color: "#475569", fontWeight: 600, fontSize:'0.85rem' },
  tdDetalle: { padding: "10px", color: "#334155", verticalAlign: "middle" },

  paginationWrapper: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: "1px solid #e2e8f0", backgroundColor: "#f8fafc" },
  paginationInfo: { fontSize: "0.8rem", color: "#64748b" },
  paginationControls: { display: "flex", alignItems: "center", gap: "8px" },
  btnPage: { padding: "6px 10px", borderRadius: "999px", border: "1px solid #cbd5e1", fontSize: "0.75rem", fontWeight: "500", cursor: "pointer", backgroundColor: "#ffffff", color: "#475569" },
  
  // Modal Z-Index corregido
  modalOverlay: { position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20000 },
  modal: { width: "100%", maxWidth: "520px", backgroundColor: "#ffffff", borderRadius: "16px", padding: "20px 24px 18px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", border: "1px solid #e2e8f0" },
};

// Inyectar animación
const styleSheet = document.createElement("style");
styleSheet.innerText = "@keyframes fadeIn { from { opacity:0; transform:translateY(15px); } to { opacity:1; transform:translateY(0); } }";
document.head.appendChild(styleSheet);