// frontend/src/pages/CrearOrden.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

// --- ICONOS SVG (Estilo Unificado) ---
const IconClipboard = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>;
const IconPlus = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const IconTrash = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;

// --- ESTILOS PREMIUM DIGRAS ---
const styles = {
  // Contenedor y Card Principal
  container: { padding: '24px 32px', maxWidth: '1400px', margin: '0 auto', fontFamily: "'Inter', sans-serif" },
  content: { backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', overflow: 'hidden', border: '1px solid #f1f5f9', padding: '30px' },
  
  // Header
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  titleGroup: { display: 'flex', alignItems: 'center', gap: '16px' },
  iconCircle: { width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  title: { margin: 0, fontSize: '1.5rem', color: '#0f172a', fontWeight: '700' },
  subtitle: { margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' },

  // Inputs y Selects
  label: { display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' },
  input: { width: '100%', height: '42px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', backgroundColor: '#fff', boxSizing:'border-box', transition: 'border 0.2s' },
  select: { width: '100%', height: '42px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', backgroundColor: '#fff', boxSizing:'border-box' },
  
  // Grid de Formulario
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '30px' },
  section: { backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' },
  sectionTitle: { margin: '0 0 15px 0', fontSize: '0.85rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' },

  // Botones
  btnPrimary: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 24px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize:'0.95rem', transition: 'transform 0.1s' },
  btnGhost: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: 'transparent', color: '#64748b', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize:'0.9rem' },
  btnSecondary: { background: '#eff6ff', color: '#2563eb', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' },
  btnIcon: { width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '8px', cursor: 'pointer' },

  // Productos
  productsSection: { marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' },
  productsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  productRow: { display: 'grid', gridTemplateColumns: '3fr 1fr 50px', gap: '15px', alignItems: 'flex-start', marginBottom: '15px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' },
  
  // Info extra
  infoRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b', marginTop: '8px', paddingLeft: '4px' },
  totalRow: { marginTop: '30px', padding: '20px', backgroundColor: '#f0f9ff', borderRadius: '12px', textAlign: 'right', fontSize: '1.25rem', fontWeight: '800', color: '#0369a1', border: '1px solid #bae6fd' },

  // Mensajes y Badges
  statusOk: { padding: '12px', background: '#dcfce7', color: '#166534', borderRadius: '8px', marginBottom: '20px', border: '1px solid #bbf7d0', fontSize: '0.9rem' },
  statusError: { padding: '12px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '20px', border: '1px solid #fecaca', fontSize: '0.9rem' },
  badge: { display: 'inline-block', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '700', backgroundColor: '#fff7ed', color: '#c2410c' },

  // Modal Interno (Nuevo Cliente)
  nestedCard: { marginTop: '15px', padding: '20px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px dashed #cbd5e1', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },

  // Resumen Final
  resumenCard: { marginTop: '30px', padding: '30px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' },
  resumenTitle: { fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' },
  resumenLine: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.95rem', color: '#334155' }
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
        const token = localStorage.getItem('auth_token');
        const config = { headers: { Authorization: `Token ${token}` } };

        const [resClientes, resProductos, resExistencias] = await Promise.all([
          api.get("/base/clientes/", config),
          api.get("/inventario/productos/", config),
          api.get("/inventario/existencias/", config),
        ]);

        setClientes(resClientes.data);
        setProductos(resProductos.data);

        const mapaExistencias = {};
        resExistencias.data.forEach((ex) => {
          const prodId = ex.id_producto && typeof ex.id_producto === "object"
              ? ex.id_producto.id_producto
              : ex.id_producto;
          if (prodId != null) {
            mapaExistencias[prodId] = ex.cantidad;
          }
        });
        setExistencias(mapaExistencias);
      } catch (err) {
        console.error("Error cargando datos:", err);
        const msg = err.response?.status === 404 
            ? "Error 404: Endpoint no encontrado." 
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

    if (!nuevoClienteNombre || !nuevoClienteDireccion || !nuevoClienteCorreo || !nuevoClienteTelefono) {
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

      setClientes((prev) => [...prev, nuevo]);
      setClienteSeleccionado(nuevo.id_cliente);

      setMostrarNuevoCliente(false);
      setNuevoClienteMensaje("Cliente creado correctamente.");
      setNuevoClienteNombre("");
      setNuevoClienteDireccion("");
      setNuevoClienteCorreo("");
      setNuevoClienteTelefono("");
    } catch (err) {
      const data = err.response?.data;
      let backendMsg = data?.detail || data?.error;
      if (!backendMsg && data && typeof data === "object") {
        const firstKey = Object.keys(data)[0];
        const firstVal = data[firstKey];
        if (Array.isArray(firstVal) && firstVal.length > 0) backendMsg = firstVal[0];
      }
      setNuevoClienteError(backendMsg || "Error al crear cliente.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");
    setResumenOrden(null);

    for (const d of detalles) {
      const prodIdNumber = d.producto_id ? Number(d.producto_id) : null;
      const existenciaActual = prodIdNumber != null ? existencias[prodIdNumber] : null;
      const cantidad = Number(d.cantidad || 0);

      if (prodIdNumber != null && existenciaActual != null && cantidad > existenciaActual) {
        const prod = obtenerProducto(d.producto_id);
        const nombreProd = prod ? prod.nombre : "producto seleccionado";
        setError(`La cantidad para ${nombreProd} (${cantidad}) supera la existencia disponible (${existenciaActual}).`);
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

      const res = await api.post("/ordenes/", payload);

      const clienteObj = clientes.find((c) => c.id_cliente === Number(clienteSeleccionado));
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
      const totalResumen = lineasResumen.reduce((acc, l) => acc + l.subtotal, 0);

      setResumenOrden({
        id_orden: res.data.id_orden,
        cliente: clienteObj ? clienteObj.nombre : "",
        metodo_pago: metodoPago,
        lineas: lineasResumen,
        total: totalResumen,
      });

      setMensaje(`Orden creada correctamente. ID: ${res.data.id_orden}`);
      setDetalles([{ producto_id: "", cantidad: 1 }]);
    } catch (err) {
      console.error("Error creando orden:", err);
      const status = err.response?.status;
      const backendMsg = err.response?.data?.error;
      if (status === 403 && backendMsg) setError(backendMsg);
      else setError("No se pudo crear la orden.");
    }
  };

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.titleGroup}>
            <div style={styles.iconCircle}><IconClipboard /></div>
            <div>
                <h2 style={styles.title}>Nueva Venta</h2>
                <p style={styles.subtitle}>Generar orden de salida de productos</p>
            </div>
        </div>
      </div>

      <div style={styles.content}>
        
        {mensaje && <div style={styles.statusOk}>{mensaje}</div>}
        {error && <div style={styles.statusError}>{error}</div>}

        <form onSubmit={handleSubmit}>
          
          {/* GRID: CLIENTE Y PAGO */}
          <div style={styles.formGrid}>
            
            {/* SECCION 1: CLIENTE */}
            <div style={styles.section}>
                <div style={styles.sectionTitle}>1. Datos del Cliente</div>
                
                <div style={{marginBottom:'15px'}}>
                    <label style={styles.label}>Seleccionar Cliente</label>
                    <select
                        style={styles.select}
                        value={clienteSeleccionado}
                        onChange={(e) => setClienteSeleccionado(e.target.value)}
                        required
                    >
                        <option value="">-- Buscar Cliente --</option>
                        {clientes.map((c) => (
                            <option key={c.id_cliente} value={c.id_cliente}>{c.nombre}</option>
                        ))}
                    </select>
                </div>

                <button
                    type="button"
                    onClick={() => setMostrarNuevoCliente((v) => !v)}
                    style={{...styles.btnGhost, padding:0, fontSize:'0.8rem', color:'#2563eb'}}
                >
                    {mostrarNuevoCliente ? "Cancelar registro" : "+ Registrar nuevo cliente"}
                </button>

                {/* FORMULARIO NUEVO CLIENTE (ANIDADO) */}
                {mostrarNuevoCliente && (
                    <div style={styles.nestedCard}>
                        <div style={{...styles.sectionTitle, borderBottom:'none'}}>Nuevo Cliente</div>
                        <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                            <input style={styles.input} placeholder="Nombre completo" value={nuevoClienteNombre} onChange={(e) => setNuevoClienteNombre(e.target.value)} />
                            <input style={styles.input} placeholder="Dirección" value={nuevoClienteDireccion} onChange={(e) => setNuevoClienteDireccion(e.target.value)} />
                            <input style={styles.input} placeholder="Correo" value={nuevoClienteCorreo} onChange={(e) => setNuevoClienteCorreo(e.target.value)} />
                            <input style={styles.input} placeholder="Teléfono" value={nuevoClienteTelefono} onChange={(e) => setNuevoClienteTelefono(e.target.value)} />

                            {nuevoClienteError && <div style={{color:'#ef4444', fontSize:'0.8rem'}}>{nuevoClienteError}</div>}
                            {nuevoClienteMensaje && <div style={{color:'#10b981', fontSize:'0.8rem'}}>{nuevoClienteMensaje}</div>}

                            <button type="button" onClick={crearNuevoCliente} style={{...styles.btnPrimary, padding:'8px 16px', fontSize:'0.85rem', alignSelf:'flex-end'}}>
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
                <input
                  style={styles.input}
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  placeholder="Ej: Transferencia, Efectivo..."
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: PRODUCTOS */}
          <div style={styles.productsSection}>
            <div style={styles.productsHeader}>
              <h3 style={{...styles.title, fontSize:'1.1rem', margin:0}}>3. Productos</h3>
              <button type="button" style={styles.btnSecondary} onClick={agregarLinea}>
                <IconPlus /> Agregar Línea
              </button>
            </div>

            {detalles.map((det, idx) => {
              const prodIdNumber = det.producto_id ? Number(det.producto_id) : null;
              const existenciaActual = prodIdNumber != null ? existencias[prodIdNumber] : null;
              const prod = obtenerProducto(det.producto_id);
              const precioUnitario = prod ? Number(prod.precio_venta || 0) : 0;
              const subtotal = calcularSubtotal(det);

              let stockColor = '#64748b';
              if (det.producto_id && existenciaActual != null) {
                if (existenciaActual === 0) stockColor = '#ef4444';
                else if (existenciaActual < 5) stockColor = '#f59e0b';
              }

              return (
                <div key={idx} style={styles.productRow}>
                  <div>
                    <label style={styles.label}>Producto</label>
                    <select
                      style={styles.select}
                      value={det.producto_id}
                      onChange={(e) => handleChangeDetalle(idx, "producto_id", e.target.value)}
                      required
                    >
                      <option value="">Buscar producto...</option>
                      {productos.map((p) => (
                        <option key={p.id_producto} value={p.id_producto}>{p.nombre}</option>
                      ))}
                    </select>
                    
                    {/* Info Stock y Precio */}
                    <div style={styles.infoRow}>
                        <span style={{color: stockColor, fontWeight:'600'}}>
                            {det.producto_id ? (existenciaActual != null ? `Stock: ${existenciaActual}` : 'Sin datos') : ''}
                        </span>
                        {prod && <span>Precio: <strong>Bs {precioUnitario.toFixed(2)}</strong></span>}
                    </div>
                  </div>

                  <div>
                    <label style={styles.label}>Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      max={existenciaActual != null ? existenciaActual : undefined}
                      style={styles.input}
                      value={det.cantidad}
                      onChange={(e) => handleChangeDetalle(idx, "cantidad", e.target.value)}
                      required
                    />
                    <div style={{...styles.infoRow, justifyContent:'flex-end', color:'#0f172a', fontWeight:'700'}}>
                        Bs {subtotal.toFixed(2)}
                    </div>
                  </div>

                  {detalles.length > 1 && (
                    <div style={{display:'flex', alignItems:'flex-end', height:'100%', paddingBottom:'22px'}}>
                        <button type="button" style={styles.btnIcon} onClick={() => quitarLinea(idx)}>
                          <IconTrash />
                        </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Total acumulado */}
            <div style={styles.totalRow}>
              Total a Pagar: Bs {totalOrden.toFixed(2)}
            </div>
          </div>

          {/* BOTONES FINALES */}
          <div style={{display:'flex', justifyContent:'flex-end', gap:'15px', marginTop:'30px'}}>
            <button 
                type="button" 
                onClick={() => navigate('/')}
                style={styles.btnGhost}
            >
                Cancelar
            </button>
            <button type="submit" style={styles.btnPrimary}>
              CONFIRMAR ORDEN
            </button>
          </div>
        </form>

        {/* RESUMEN DE ÉXITO */}
        {resumenOrden && (
          <div style={styles.resumenCard}>
            <div style={styles.resumenTitle}>✅ Orden #{resumenOrden.id_orden} Creada</div>
            
            <div style={styles.resumenLine}><span>Cliente:</span> <strong>{resumenOrden.cliente}</strong></div>
            <div style={styles.resumenLine}><span>Pago:</span> <strong>{resumenOrden.metodo_pago}</strong></div>
            
            <div style={{margin:'20px 0', borderTop:'1px dashed #cbd5e1'}}></div>
            
            {resumenOrden.lineas.map((l, idx) => (
              <div key={idx} style={styles.resumenLine}>
                <span>{l.cantidad} x {l.nombre}</span>
                <span>Bs {l.subtotal.toFixed(2)}</span>
              </div>
            ))}
            
            <div style={{margin:'20px 0', borderTop:'2px solid #e2e8f0'}}></div>
            
            <div style={{...styles.resumenLine, fontSize:'1.2rem', fontWeight:'800', color:'#0f172a'}}>
              <span>TOTAL</span>
              <span>Bs {resumenOrden.total.toFixed(2)}</span>
            </div>

            <div style={{textAlign:'right', marginTop:'20px'}}>
                <button type="button" onClick={() => navigate("/")} style={styles.btnPrimary}>
                    Volver al Inicio
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}