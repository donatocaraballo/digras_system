// frontend/src/pages/Clientes.jsx

import React, { useEffect, useState } from "react";
import api from "../api/api";
import { useAuth } from "../AuthContext"; // Importamos AuthContext

// --- ICONOS SVG ---
const IconUser = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const IconSearch = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const IconPlus = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const IconTrash = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const IconEdit = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const IconRefresh = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>;

// --- ESTILOS PREMIUM DIGRAS ---
const styles = {
  container: { padding: '24px 32px', maxWidth: '1400px', margin: '0 auto', fontFamily: "'Inter', sans-serif" },
  content: { backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', overflow: 'hidden', border: '1px solid #f1f5f9', padding: '30px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  titleGroup: { display: 'flex', alignItems: 'center', gap: '16px' },
  iconCircle: { width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  title: { margin: 0, fontSize: '1.5rem', color: '#0f172a', fontWeight: '700' },
  subtitle: { margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' },
  label: { display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' },
  input: { width: '100%', height: '42px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', backgroundColor: '#fff', boxSizing:'border-box', transition: 'border 0.2s' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginBottom: '30px' },
  btnPrimary: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 24px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize:'0.95rem', transition: 'transform 0.1s' },
  btnGhost: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: 'transparent', color: '#64748b', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize:'0.9rem' },
  btnSecondary: { background: '#eff6ff', color: '#2563eb', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' },
  btnIcon: { width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '8px', cursor: 'pointer' },
  tableWrapper: { borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" },
  th: { background: "#f8fafc", textAlign: "left", padding: "15px 20px", borderBottom: "1px solid #e2e8f0", color: "#0f172a", fontWeight: "700", whiteSpace: "nowrap", textTransform: "uppercase", fontSize: '0.8rem' },
  td: { padding: "15px 20px", borderBottom: "1px solid #f1f5f9", color: "#334155", verticalAlign: "middle" },
  rowAlt: { background: "#f8fafc" },
  searchSection: { backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '25px', display: 'flex', gap: '15px', alignItems: 'center' },
  statusOk: { padding: '12px', background: '#dcfce7', color: '#166534', borderRadius: '8px', marginBottom: '20px', border: '1px solid #bbf7d0', fontSize: '0.9rem' },
  statusError: { padding: '12px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '20px', border: '1px solid #fecaca', fontSize: '0.9rem' },
  badge: { display: 'inline-block', padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '700', border: '1px solid' },
  resumenCard: { marginTop: '30px', padding: '30px', backgroundColor: '#eff6ff', borderRadius: '16px', border: '1px solid #bfdbfe', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.05)' },
  resumenTitle: { fontSize: '1.2rem', fontWeight: '800', marginBottom: '15px', textTransform: 'uppercase', color: '#1e40af', borderBottom: '2px solid #bfdbfe', paddingBottom: '10px' },
  resumenLine: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.95rem', color: '#334155', borderBottom: '1px dotted #bfdbfe', paddingBottom: '5px' },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 4000 },
  modal: { width: "100%", maxWidth: "500px", background: "#ffffff", borderRadius: "20px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", padding: "35px", boxSizing: "border-box" },
  modalTitle: { fontSize: "1.4rem", fontWeight: "700", color: "#0f172a", marginBottom: "5px" },
};

export default function Clientes() {
  const { user } = useAuth();
  
  const [clientes, setClientes] = useState([]);
  const [usuarios, setUsuarios] = useState([]); // Para mapear ID vendedor -> Nombre
  
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState("crear"); 
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const [formData, setFormData] = useState({ nombre: "", telefono: "", correo: "", direccion: "" });

  // Determinar si es Gerencia (para mostrar columna vendedor)
  const esGerencia = user && (user.tipo === 'GERENTE' || user.tipo === 'ADMINISTRADOR' || user.is_superuser);

  const cargarDatos = async () => {
    setLoading(true); setError(""); setMensaje("");
    try {
      const promises = [api.get("/base/clientes/")];
      
      // Si es gerencia, cargamos usuarios para mostrar nombres de vendedores
      if (esGerencia) {
          promises.push(api.get("/base/usuarios/"));
      }

      const [resClientes, resUsuarios] = await Promise.all(promises);
      
      const dataClientes = Array.isArray(resClientes.data) ? resClientes.data : resClientes.data.results || [];
      setClientes(dataClientes);

      if (resUsuarios) {
          const dataUsuarios = Array.isArray(resUsuarios.data) ? resUsuarios.data : resUsuarios.data.results || [];
          setUsuarios(dataUsuarios);
      }

      setMensaje(`Se encontraron ${dataClientes.length} cliente(s).`);
    } catch (err) {
      console.error("Error cargando datos:", err);
      setError("No se pudieron cargar los datos.");
    } finally { setLoading(false); }
  };

  useEffect(() => { cargarDatos(); }, [user]); // Recargar si cambia el usuario

  // Helper para nombre de vendedor
  const getNombreVendedor = (id) => {
      if (!id) return "-";
      const u = usuarios.find(user => user.id_usuario === id || user.id === id);
      return u ? `@${u.username}` : `ID: ${id}`;
  };

  const filtrados = clientes.filter((c) => {
    const texto = (search || "").toLowerCase();
    if (!texto) return true;
    
    // Búsqueda extendida: incluye nombre de vendedor si es gerencia
    let matchVendedor = false;
    if (esGerencia && c.id_usuario) {
        const nombreVend = getNombreVendedor(c.id_usuario).toLowerCase();
        matchVendedor = nombreVend.includes(texto);
    }

    return (
        (c.nombre || "").toLowerCase().includes(texto) || 
        (c.correo || "").toLowerCase().includes(texto) || 
        (c.telefono || "").toLowerCase().includes(texto) ||
        matchVendedor
    );
  });

  const abrirCrear = () => {
    setFormMode("crear");
    setFormData({ nombre: "", telefono: "", correo: "", direccion: "" });
    setFormError(""); setShowFormModal(true);
  };

  const abrirEditar = (cliente) => {
    setFormMode("editar");
    setFormData({ nombre: cliente.nombre || "", telefono: cliente.telefono || "", correo: cliente.correo || "", direccion: cliente.direccion || "" });
    setFormError(""); setShowFormModal(true);
  };

  const handleFormChange = (campo, valor) => setFormData((prev) => ({ ...prev, [campo]: valor }));

  const guardarCliente = async (e) => {
    e.preventDefault();
    setFormError(""); setFormLoading(true);
    try {
      if (!formData.nombre) { setFormError("El nombre es obligatorio."); setFormLoading(false); return; }
      if (formMode === "crear") await api.post("/base/clientes/", formData);
      else if (formMode === "editar" && clienteSeleccionado) await api.patch(`/base/clientes/${clienteSeleccionado.id_cliente}/`, formData);

      setShowFormModal(false); setClienteSeleccionado(null); await cargarDatos();
    } catch (err) {
      setFormError("No se pudo guardar el cliente.");
    } finally { setFormLoading(false); }
  };

  const eliminarCliente = async () => {
    if (!clienteSeleccionado) return;
    if (!window.confirm(`¿Seguro que deseas eliminar al cliente "${clienteSeleccionado.nombre}"?`)) return;
    try {
      await api.delete(`/base/clientes/${clienteSeleccionado.id_cliente}/`);
      setClienteSeleccionado(null); await cargarDatos();
    } catch (err) { alert("No se pudo eliminar el cliente (puede tener órdenes asociadas)."); }
  };

  const cambiarEstadoCliente = async (activo) => {
    if (!clienteSeleccionado) return;
    try {
      await api.patch(`/base/clientes/${clienteSeleccionado.id_cliente}/`, { activo: !!activo });
      await cargarDatos(); setClienteSeleccionado(null);
    } catch (err) { alert("No se pudo cambiar el estado."); }
  };

  const badgeActivo = (cli) => {
    const activo = cli.activo !== undefined && cli.activo !== null ? cli.activo : true;
    return (
      <span style={{ ...styles.badge, background: activo ? "#dcfce7" : "#fee2e2", color: activo ? "#166534" : "#991b1b", borderColor: activo ? "#bbf7d0" : "#fecaca" }}>
        {activo ? "ACTIVO" : "INACTIVO"}
      </span>
    );
  };

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.titleGroup}>
            <div style={styles.iconCircle}><IconUser /></div>
            <div>
                <h2 style={styles.title}>Clientes</h2>
                <p style={styles.subtitle}>
                    {esGerencia ? "Gestión global de cartera de clientes." : "Gestiona tu cartera de clientes."}
                </p>
            </div>
        </div>
      </div>

      <div style={styles.content}>
        
        {mensaje && <div style={styles.statusOk}>{mensaje}</div>}
        {error && <div style={styles.statusError}>{error}</div>}

        {/* BUSCADOR */}
        <div style={styles.searchSection}>
            <div style={{flex: 1, display:'flex', alignItems:'center'}}>
                <input
                    type="text"
                    style={styles.input}
                    placeholder={esGerencia ? "Buscar por nombre, correo o vendedor..." : "Buscar por nombre o correo..."}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <button type="button" style={styles.btnGhost} onClick={() => setSearch("")}>
                <IconRefresh /> Limpiar
            </button>
            <button type="button" style={styles.btnPrimary} onClick={abrirCrear}>
                <IconPlus /> Nuevo Cliente
            </button>
        </div>

        {/* TABLA */}
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Nombre</th>
                
                {/* 🚨 COLUMNA VENDEDOR (SOLO GERENCIA) */}
                {esGerencia && <th style={styles.th}>Vendedor</th>}
                
                <th style={styles.th}>Teléfono</th>
                <th style={styles.th}>Correo</th>
                <th style={{...styles.th, textAlign:'center'}}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 && !loading && (
                <tr>
                  <td style={{...styles.td, textAlign:'center', color:'#94a3b8', padding: '30px'}} colSpan={esGerencia ? 6 : 5}>
                    No hay clientes que coincidan con la búsqueda.
                  </td>
                </tr>
              )}

              {filtrados.map((c, idx) => {
                const isSelected = clienteSeleccionado?.id_cliente === c.id_cliente;
                const rowBase = {
                    ...styles.td,
                    ...(idx % 2 === 1 ? styles.rowAlt : {}),
                    backgroundColor: isSelected ? "#eff6ff" : (idx % 2 === 1 ? "#f8fafc" : "#fff"),
                    borderLeft: isSelected ? "4px solid #2563eb" : "4px solid transparent",
                    fontWeight: isSelected ? '600' : 'normal'
                };

                return (
                  <tr
                    key={c.id_cliente}
                    onClick={() => {
                        setClienteSeleccionado(c);
                        setTimeout(() => document.getElementById('detalle-cliente')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
                    }}
                    style={{ cursor: "pointer", transition: 'all 0.2s' }}
                  >
                    <td style={{...rowBase, color: isSelected ? '#0d47a1' : '#334155'}}>#{c.id_cliente}</td>
                    <td style={rowBase}>{c.nombre}</td>
                    
                    {/* 🚨 CELDA VENDEDOR (SOLO GERENCIA) */}
                    {esGerencia && (
                        <td style={{...rowBase, fontWeight:'700', color:'#475569'}}>
                            {getNombreVendedor(c.id_usuario)}
                        </td>
                    )}

                    <td style={rowBase}>{c.telefono || "-"}</td>
                    <td style={rowBase}>{c.correo || "-"}</td>
                    <td style={{...rowBase, textAlign:'center'}}>{badgeActivo(c)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* DETALLE DE CLIENTE */}
        {clienteSeleccionado && (
          <div id="detalle-cliente" style={styles.resumenCard}>
            <div style={styles.resumenTitle}>
              👤 {clienteSeleccionado.nombre} <span style={{fontSize:'0.9rem', color:'#64748b', fontWeight:'400'}}>#{clienteSeleccionado.id_cliente}</span>
            </div>

            <div style={{display:'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap:'30px'}}>
                <div>
                    {esGerencia && (
                        <div style={styles.resumenLine}>
                            <span style={{fontWeight:'600', color:'#64748b'}}>Vendedor Asignado</span> 
                            <span style={{fontWeight:'bold'}}>{getNombreVendedor(clienteSeleccionado.id_usuario)}</span>
                        </div>
                    )}
                    <div style={styles.resumenLine}>
                        <span style={{fontWeight:'600', color:'#64748b'}}>Teléfono</span> 
                        <span>{clienteSeleccionado.telefono || "No registrado"}</span>
                    </div>
                    <div style={styles.resumenLine}>
                        <span style={{fontWeight:'600', color:'#64748b'}}>Correo</span> 
                        <span>{clienteSeleccionado.correo || "No registrado"}</span>
                    </div>
                </div>
                <div>
                    <div style={styles.resumenLine}>
                        <span style={{fontWeight:'600', color:'#64748b'}}>Dirección</span> 
                        <span style={{maxWidth:'60%', textAlign:'right'}}>{clienteSeleccionado.direccion || "No registrada"}</span>
                    </div>
                    <div style={styles.resumenLine}>
                        <span style={{fontWeight:'600', color:'#64748b'}}>Estado</span> 
                        <span>{clienteSeleccionado.activo ? "Activo" : "Inactivo"}</span>
                    </div>
                </div>
            </div>

            <div style={{display:'flex', gap:'10px', marginTop:'20px', justifyContent:'flex-end'}}>
              <button type="button" style={styles.btnSecondary} onClick={() => abrirEditar(clienteSeleccionado)}>
                <IconEdit /> Editar
              </button>

              <button type="button" style={styles.btnGhost} onClick={() => cambiarEstadoCliente(!clienteSeleccionado.activo)}>
                {clienteSeleccionado.activo === false ? "Activar" : "Desactivar"}
              </button>

              <button type="button" style={styles.btnIcon} onClick={eliminarCliente}>
                <IconTrash />
              </button>
            </div>
          </div>
        )}

        {loading && <div style={{ marginTop: "20px", fontSize: "14px", color: "#64748b", textAlign:'center' }}>Cargando datos...</div>}
      </div>

      {/* MODAL */}
      {showFormModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalTitle}>
              {formMode === "crear" ? "Nuevo Cliente" : "Editar Cliente"}
            </div>
            <div style={styles.subtitle}>Completa los datos del cliente.</div>

            <form onSubmit={guardarCliente}>
              <div style={styles.formGrid}>
                <div>
                  <label style={styles.label}>Nombre *</label>
                  <input style={styles.input} value={formData.nombre} onChange={(e) => handleFormChange("nombre", e.target.value)} placeholder="Nombre del cliente" />
                </div>
                <div>
                  <label style={styles.label}>Teléfono</label>
                  <input style={styles.input} value={formData.telefono} onChange={(e) => handleFormChange("telefono", e.target.value)} placeholder="0414-0000000" />
                </div>
                <div>
                  <label style={styles.label}>Correo</label>
                  <input type="email" style={styles.input} value={formData.correo} onChange={(e) => handleFormChange("correo", e.target.value)} placeholder="cliente@correo.com" />
                </div>
                <div>
                  <label style={styles.label}>Dirección</label>
                  <textarea 
                    style={{...styles.input, height:'80px', paddingTop:'10px', resize:'vertical', fontFamily:'inherit'}} 
                    value={formData.direccion} 
                    onChange={(e) => handleFormChange("direccion", e.target.value)} 
                    placeholder="Dirección fiscal" 
                  />
                </div>
              </div>

              {formError && <div style={{ marginTop: "15px", fontSize: "13px", color: "#b91c1c", fontWeight: '600', padding:'10px', background:'#fee2e2', borderRadius:'8px' }}>⚠️ {formError}</div>}

              <div style={{display:'flex', justifyContent:'flex-end', gap:'10px', marginTop:'25px', borderTop:'1px solid #f1f5f9', paddingTop:'20px'}}>
                <button type="button" style={styles.btnGhost} onClick={() => setShowFormModal(false)} disabled={formLoading}>Cancelar</button>
                <button type="submit" style={styles.btnPrimary} disabled={formLoading}>
                  {formLoading ? "Guardando..." : formMode === "crear" ? "Crear Cliente" : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}