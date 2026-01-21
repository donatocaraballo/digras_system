// frontend/src/pages/RegistroAcciones.jsx

import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../AuthContext";
import toast from 'react-hot-toast';

// --- ICONOS SVG ---
const IconHistory = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
const IconSearch = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const IconRefresh = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>;
const IconUser = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const IconInfo = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>;

// --- ESTILOS PREMIUM DIGRAS (Responsive) ---
const styles = {
  // Los contenedores principales ahora se manejan con clases CSS globales
  
  headerRow: { display: "flex", alignItems: "center", gap: "15px", marginBottom: "25px", paddingLeft: "10px" },
  iconCircle: { width: '56px', height: '56px', borderRadius: '14px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
  title: { fontSize: "1.8rem", fontWeight: "800", color: "#0f172a", margin: 0, letterSpacing: "-0.5px" },
  subtitle: { fontSize: "1rem", color: "#64748b", marginTop: "4px" },
  
  // Toolbar adaptado a clases globales pero mantenemos estilos específicos
  toolbarContainer: { marginBottom: "25px", background: "#f8fafc", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0" },
  
  label: { fontSize: "0.75rem", fontWeight: "700", color: "#475569", marginBottom: "6px", textTransform: "uppercase", display: 'block' },
  input: { height: "40px", width: "100%", borderRadius: "10px", border: "1px solid #cbd5e1", padding: "0 12px", fontSize: "0.9rem", outline: "none", color: "#334155", backgroundColor: "#fff", boxSizing: 'border-box' },
  select: { height: "40px", width: "100%", borderRadius: "10px", border: "1px solid #cbd5e1", padding: "0 12px", fontSize: "0.9rem", outline: "none", color: "#334155", backgroundColor: "#fff", boxSizing: 'border-box' },
  
  actionsContainer: { display: 'flex', gap: '10px', height: '40px', marginTop: 'auto' }, // marginTop auto para alinear con inputs
  buttonPrimary: { border: "none", borderRadius: "10px", padding: "0 20px", height: "100%", background: "#0f172a", color: "#ffffff", cursor: "pointer", fontSize: "0.9rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 12px rgba(15, 23, 42, 0.2)", transition: "transform 0.1s" },
  buttonGhost: { borderRadius: "10px", padding: "0 15px", height: "100%", background: "transparent", border: "1px solid #cbd5e1", color: "#64748b", cursor: "pointer", fontSize: "0.9rem", fontWeight: "600", display: 'flex', alignItems:'center', gap:'6px' },
  
  // Tabla ahora usa table-responsive-wrapper
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", minWidth: "800px" },
  th: { background: "#f8fafc", textAlign: "left", padding: "15px", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: "700", textTransform: "uppercase", fontSize: "0.75rem" },
  td: { padding: "14px 15px", borderBottom: "1px solid #f1f5f9", color: "#334155", verticalAlign: "middle" },
  
  userCell: { fontWeight: '700', color: '#0f172a' },
  moduleBadge: { display: 'inline-block', padding: '3px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '700', background: '#e0f2fe', color: '#0369a1', border:'1px solid #bae6fd', textTransform: 'uppercase' },
  actionText: { fontWeight: '600', color: '#1e293b' },
  dateText: { fontFamily: 'monospace', color: '#64748b', fontSize: '0.8rem' },
  
  emptyState: { padding: '40px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' },
  errorText: { padding: '15px', background: '#fee2e2', color: '#991b1b', borderRadius: '10px', marginBottom: '20px', border:'1px solid #fecaca', textAlign:'center' },

  // --- ESTILOS DEL DETALLE ---
  detailWrapper: { marginTop: "30px", animation: "fadeIn 0.4s ease-out" },
  detailCard: { backgroundColor: "#ffffff", borderRadius: "20px", padding: "30px", boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.1)", border: "1px solid #e2e8f0" },
  detailHeader: { display:'flex', justifyContent:'space-between', borderBottom:'1px solid #e2e8f0', paddingBottom:15, marginBottom:25, flexWrap: 'wrap', gap: '10px' },
  detailTitle: { margin:0, color:'#0f172a', display:'flex', alignItems:'center', gap:'10px', fontSize: '1.4rem' },
  
  // gridDetail reemplazado por form-grid-responsive
  
  infoBox: { backgroundColor: "#f8fafc", padding: "25px", borderRadius: "16px", border: "1px solid #f1f5f9", display:'flex', flexDirection:'column', gap:'12px', height: '100%' },
  sectionTitle: { margin: "0 0 10px 0", fontSize: "0.9rem", fontWeight: "800", color: "#64748b", textTransform: "uppercase", display:'flex', alignItems:'center', gap:'8px' },
  
  detailRow: { display: "flex", justifyContent: "space-between", fontSize: "0.95rem", color: "#334155", borderBottom: '1px dashed #e2e8f0', paddingBottom: '8px' },
  detailLabel: { fontWeight: "600", color: "#475569" },
  detailValue: { fontWeight: "500", color: "#0f172a" },

  userAvatar: { width: '60px', height: '60px', borderRadius: '50%', background: '#cbd5e1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', fontWeight:'bold', color:'#fff', marginBottom:'10px' },
  
  descBox: { marginTop: '20px', padding: '15px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#334155', lineHeight: '1.6', fontSize: '0.95rem' }
};

// Keyframes
const styleSheet = document.createElement("style");
styleSheet.innerText = "@keyframes fadeIn { from { opacity:0; transform:translateY(15px); } to { opacity:1; transform:translateY(0); } }";
document.head.appendChild(styleSheet);

export default function RegistroAcciones() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [acciones, setAcciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Estado para el detalle
  const [accionSeleccionada, setAccionSeleccionada] = useState(null);
  const [usuarioDetalle, setUsuarioDetalle] = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const detailsRef = useRef(null);

  // Filtros
  const [search, setSearch] = useState("");
  const [filterModulo, setFilterModulo] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

  const [checkingPermission, setCheckingPermission] = useState(true);

  // 1. Verificar Permisos
  useEffect(() => {
    if (currentUser) {
        const role = (currentUser.tipo || "").toUpperCase();
        if (role !== 'GERENTE' && !currentUser.is_superuser) {
            toast.error("Acceso denegado: Módulo exclusivo para Gerencia.");
            navigate("/");
        } else {
            setCheckingPermission(false);
            cargarAcciones();
        }
    }
  }, [currentUser, navigate]);

  // Scroll automático al detalle
  useEffect(() => {
    if (accionSeleccionada && detailsRef.current) {
        setTimeout(() => {
            detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    }
  }, [accionSeleccionada]);

  // 2. Cargar Lista de Acciones
  const cargarAcciones = async () => {
    setLoading(true); setError("");
    try {
        const res = await api.get("/base/registros/"); 
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setAcciones(data);
    } catch (err) {
        console.error(err);
        setError("No se pudo cargar el historial de acciones.");
    } finally {
        setLoading(false);
    }
  };

  // Helper seguro para nombre de usuario en tabla
  const getSafeUserName = (userObj) => {
      if (!userObj) return "Sistema";
      if (typeof userObj === 'object') return userObj.username || "Desconocido";
      return `User#${userObj}`;
  };

  // 3. Manejo de Click en Fila (Cargar Detalle Completo)
  const handleRowClick = async (accion) => {
      // Toggle si es la misma
      if (accionSeleccionada && accionSeleccionada.id_registro === accion.id_registro) {
          setAccionSeleccionada(null);
          setUsuarioDetalle(null);
          return;
      }

      setAccionSeleccionada(accion);
      setUsuarioDetalle(null); // Reset previo

      // Si hay un usuario asociado, buscamos su info completa
      let userId = null;
      if (typeof accion.id_usuario === 'object' && accion.id_usuario) userId = accion.id_usuario.id || accion.id_usuario.id_usuario;
      else if (accion.id_usuario) userId = accion.id_usuario;

      if (userId) {
          setLoadingUser(true);
          try {
              // Asumiendo endpoint estandar de usuarios
              const res = await api.get(`/base/usuarios/${userId}/`);
              setUsuarioDetalle(res.data);
          } catch (error) {
              console.error("No se pudo cargar detalle de usuario", error);
              // No mostramos error UI, solo se quedará sin detalle extra
          } finally {
              setLoadingUser(false);
          }
      }
  };

  // 4. Filtrado
  const accionesFiltradas = acciones.filter(a => {
      const term = search.toLowerCase();
      const userName = getSafeUserName(a.id_usuario);
      
      const textMatch = 
          (userName || "").toLowerCase().includes(term) ||
          (a.accion || "").toLowerCase().includes(term) ||
          (a.descripcion || "").toLowerCase().includes(term);

      const moduleMatch = filterModulo ? a.modulo === filterModulo : true;

      let dateMatch = true;
      if (a.fecha_y_hora) {
          const fechaAccion = new Date(a.fecha_y_hora).toISOString().split('T')[0];
          if (dateStart && fechaAccion < dateStart) dateMatch = false;
          if (dateEnd && fechaAccion > dateEnd) dateMatch = false;
      }

      return textMatch && moduleMatch && dateMatch;
  });

  const modulosUnicos = [...new Set(acciones.map(a => a.modulo))];

  const limpiarFiltros = () => {
      setSearch("");
      setFilterModulo("");
      setDateStart("");
      setDateEnd("");
  };

  if (checkingPermission) return null; 

  return (
    // 🚨 CLASE GLOBAL RESPONSIVA
    <div className="page-container">
      
      {/* HEADER */}
      <div style={styles.headerRow}>
         <div style={styles.iconCircle}><IconHistory /></div>
         <div>
            <h2 style={styles.title}>Auditoría de Acciones</h2>
            <p style={styles.subtitle}>Registro histórico de operaciones realizadas por los usuarios.</p>
         </div>
      </div>

      {error && <div style={styles.errorText}>{error}</div>}

      {/* TARJETA PRINCIPAL RESPONSIVA */}
      <div className="card-responsive">
        
        {/* FILTROS (GRID RESPONSIVO) */}
        <div style={styles.toolbarContainer}>
            <div className="form-grid-responsive" style={{gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr'}}>
                {/* Override de grid para pantallas grandes, en móvil será 1 columna */}
                <div style={{gridColumn: 'span 2'}}> 
                    <label style={styles.label}>Buscar (Usuario / Acción)</label>
                    <div style={{display:'flex', alignItems:'center', position:'relative'}}>
                        <input style={styles.input} placeholder="Ej: crear orden..." value={search} onChange={(e) => setSearch(e.target.value)} />
                        <div style={{position:'absolute', right:12, color:'#94a3b8'}}><IconSearch /></div>
                    </div>
                </div>

                <div>
                    <label style={styles.label}>Módulo</label>
                    <select style={styles.select} value={filterModulo} onChange={(e) => setFilterModulo(e.target.value)}>
                        <option value="">Todos</option>
                        {modulosUnicos.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>

                <div>
                    <label style={styles.label}>Desde</label>
                    <input type="date" style={styles.input} value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
                </div>
                <div>
                    <label style={styles.label}>Hasta</label>
                    <input type="date" style={styles.input} value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
                </div>

                <div style={styles.actionsContainer}>
                    <button style={styles.buttonGhost} onClick={limpiarFiltros} title="Limpiar filtros"><IconRefresh /></button>
                    <button style={styles.buttonPrimary} onClick={cargarAcciones} disabled={loading}>{loading ? "..." : "Actualizar"}</button>
                </div>
            </div>
            
            {/* Hack para hacer que el grid sea responsive en el componente inline */}
            <style>{`
                @media (max-width: 1024px) {
                    .form-grid-responsive { grid-template-columns: 1fr 1fr !important; }
                    .form-grid-responsive > div:first-child { grid-column: span 2 !important; }
                }
                @media (max-width: 768px) {
                    .form-grid-responsive { grid-template-columns: 1fr !important; }
                    .form-grid-responsive > div { grid-column: span 1 !important; }
                    .actionsContainer { width: 100%; justify-content: space-between; }
                }
            `}</style>
        </div>

        {/* TABLA CON SCROLL RESPONSIVO */}
        <div className="table-responsive-wrapper">
            <table className="table-responsive" style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>Fecha y Hora</th>
                        <th style={styles.th}>Usuario</th>
                        <th style={styles.th}>Módulo</th>
                        <th style={styles.th}>Acción</th>
                        <th style={styles.th}>Descripción</th>
                        <th style={styles.th}>Ref. ID</th>
                    </tr>
                </thead>
                <tbody>
                    {accionesFiltradas.length === 0 && !loading && (
                        <tr><td colSpan={6} style={styles.emptyState}>No se encontraron registros.</td></tr>
                    )}
                    
                    {accionesFiltradas.map((accion, idx) => {
                        const isSelected = accionSeleccionada?.id_registro === accion.id_registro;
                        const rowStyle = {
                            cursor: 'pointer',
                            backgroundColor: isSelected ? '#eff6ff' : (idx % 2 === 1 ? '#f8fafc' : '#fff'),
                            borderLeft: isSelected ? '4px solid #2563eb' : '4px solid transparent',
                            transition: 'background 0.2s'
                        };
                        const fecha = new Date(accion.fecha_y_hora).toLocaleString();
                        const userName = getSafeUserName(accion.id_usuario);

                        return (
                            <tr key={accion.id_registro} style={rowStyle} onClick={() => handleRowClick(accion)}>
                                <td style={{...styles.td, ...styles.dateText}}>{fecha}</td>
                                <td style={{...styles.td, ...styles.userCell}}>@{userName}</td>
                                <td style={styles.td}><span style={styles.moduleBadge}>{accion.modulo}</span></td>
                                <td style={{...styles.td, ...styles.actionText}}>{accion.accion}</td>
                                <td style={{...styles.td, color:'#475569', maxWidth:'300px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                                    {accion.descripcion}
                                </td>
                                <td style={{...styles.td, fontFamily:'monospace'}}>{accion.id_referencia ? `#${accion.id_referencia}` : '-'}</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
        {loading && <div style={{textAlign:'center', padding:'30px', color:'#64748b'}}>Cargando historial...</div>}
      </div>

      {/* DETALLE EXPANDIBLE (MASTER-DETAIL) */}
      {accionSeleccionada && (
          <div ref={detailsRef} style={styles.detailWrapper}>
              <div style={styles.detailCard}>
                  
                  {/* Encabezado del Detalle */}
                  <div style={styles.detailHeader}>
                      <h3 style={styles.detailTitle}>
                          🔍 Detalle de la Acción #{accionSeleccionada.id_registro}
                      </h3>
                      <div style={styles.moduleBadge}>{accionSeleccionada.modulo}</div>
                  </div>

                  {/* 🚨 GRID RESPONSIVO PARA DETALLES */}
                  <div className="form-grid-responsive">
                      
                      {/* CAJA 1: INFORMACIÓN DEL ACTOR (USUARIO) */}
                      <div style={styles.infoBox}>
                          <div style={styles.sectionTitle}><IconUser /> Actor Responsable</div>
                          
                          {loadingUser ? (
                              <div style={{color:'#64748b', fontStyle:'italic'}}>Cargando info del usuario...</div>
                          ) : usuarioDetalle ? (
                              <>
                                  <div style={{display:'flex', alignItems:'center', gap:'15px', marginBottom:'15px'}}>
                                      <div style={styles.userAvatar}>
                                          {usuarioDetalle.first_name ? usuarioDetalle.first_name[0].toUpperCase() : (usuarioDetalle.username ? usuarioDetalle.username[0].toUpperCase() : '?')}
                                      </div>
                                      <div>
                                          <div style={{fontWeight:'800', fontSize:'1.1rem', color:'#0f172a'}}>
                                              {usuarioDetalle.first_name} {usuarioDetalle.last_name}
                                          </div>
                                          <div style={{color:'#64748b', fontSize:'0.9rem'}}>@{usuarioDetalle.username}</div>
                                      </div>
                                  </div>
                                  
                                  <div style={styles.detailRow}><span>Rol:</span> <span style={styles.detailValue}>{usuarioDetalle.tipo || "Usuario"}</span></div>
                                  <div style={styles.detailRow}><span>Email:</span> <span style={styles.detailValue}>{usuarioDetalle.email || "-"}</span></div>
                                  <div style={styles.detailRow}><span>Teléfono:</span> <span style={styles.detailValue}>{usuarioDetalle.telefono || "-"}</span></div>
                              </>
                          ) : (
                              <div style={{color:'#94a3b8'}}>
                                  No hay información detallada del usuario (Usuario del Sistema o eliminado).
                                  <br/>ID Registrado: {typeof accionSeleccionada.id_usuario === 'object' ? accionSeleccionada.id_usuario?.id : accionSeleccionada.id_usuario}
                              </div>
                          )}
                      </div>

                      {/* CAJA 2: CONTEXTO TÉCNICO */}
                      <div style={styles.infoBox}>
                          <div style={styles.sectionTitle}><IconInfo /> Contexto de la Acción</div>
                          
                          <div style={styles.detailRow}>
                              <span style={styles.detailLabel}>Acción Ejecutada:</span> 
                              <span style={{...styles.detailValue, color:'#0369a1'}}>{accionSeleccionada.accion}</span>
                          </div>
                          
                          <div style={styles.detailRow}>
                              <span style={styles.detailLabel}>Módulo Afectado:</span> 
                              <span style={styles.detailValue}>{accionSeleccionada.modulo}</span>
                          </div>

                          <div style={styles.detailRow}>
                              <span style={styles.detailLabel}>ID Referencia:</span> 
                              <span style={{...styles.detailValue, fontFamily:'monospace'}}>
                                  {accionSeleccionada.id_referencia ? `#${accionSeleccionada.id_referencia}` : 'N/A'}
                              </span>
                          </div>

                          <div style={styles.detailRow}>
                              <span style={styles.detailLabel}>Fecha Exacta:</span> 
                              <span style={styles.detailValue}>
                                  {new Date(accionSeleccionada.fecha_y_hora).toLocaleString()}
                              </span>
                          </div>

                          <div style={{marginTop:'15px'}}>
                              <span style={styles.detailLabel}>Descripción Completa:</span>
                              <div style={styles.descBox}>
                                  {accionSeleccionada.descripcion}
                              </div>
                          </div>
                      </div>

                  </div>
              </div>
          </div>
      )}

    </div>
  );
}