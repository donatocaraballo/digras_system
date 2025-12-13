// frontend/src/pages/RegistroAcciones.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../AuthContext";
import toast from 'react-hot-toast';

// --- ICONOS SVG ---
const IconHistory = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
const IconSearch = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const IconRefresh = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>;
const IconFilter = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>;

// --- ESTILOS PREMIUM DIGRAS ---
const styles = {
  page: {
    paddingTop: "40px",
    paddingBottom: "40px",
    fontFamily: "'Segoe UI', 'Roboto', sans-serif",
    maxWidth: "1400px",
    margin: "0 auto",
  },
  
  // Header Flotante
  headerRow: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "25px",
    paddingLeft: "10px",
  },
  iconCircle: {
    width: '56px', height: '56px', borderRadius: '14px', 
    backgroundColor: '#e0f2fe', color: '#0284c7', 
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  },
  title: {
    fontSize: "1.8rem",
    fontWeight: "800",
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: "1rem",
    color: "#64748b",
    marginTop: "4px",
  },

  // Tarjeta Principal
  card: {
    background: "#ffffff",
    borderRadius: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
    padding: "30px",
    border: "1px solid #f0f0f0",
  },

  // Toolbar de Filtros
  toolbar: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "15px",
    marginBottom: "25px",
    background: "#f8fafc",
    padding: "20px",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    alignItems: 'end'
  },
  label: {
    fontSize: "0.75rem",
    fontWeight: "700",
    color: "#475569",
    marginBottom: "6px",
    textTransform: "uppercase",
    display: 'block'
  },
  input: {
    height: "40px",
    width: "100%",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    padding: "0 12px",
    fontSize: "0.9rem",
    outline: "none",
    color: "#334155",
    backgroundColor: "#fff",
    boxSizing: 'border-box'
  },
  select: {
    height: "40px",
    width: "100%",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    padding: "0 12px",
    fontSize: "0.9rem",
    outline: "none",
    color: "#334155",
    backgroundColor: "#fff",
    boxSizing: 'border-box'
  },

  // Botones Toolbar
  actionsContainer: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    height: '40px'
  },
  buttonPrimary: {
    border: "none",
    borderRadius: "10px",
    padding: "0 20px",
    height: "100%",
    background: "#0f172a", // Azul Sólido
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.2)",
    transition: "transform 0.1s",
  },
  buttonGhost: {
    borderRadius: "10px",
    padding: "0 15px",
    height: "100%",
    background: "transparent",
    border: "1px solid #cbd5e1",
    color: "#64748b",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "600",
    display: 'flex', alignItems:'center', gap:'6px'
  },

  // Tabla
  tableWrapper: {
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
    boxShadow: "0 2px 5px rgba(0,0,0,0.02)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.85rem",
  },
  th: {
    background: "#f8fafc",
    textAlign: "left",
    padding: "15px",
    borderBottom: "1px solid #e2e8f0",
    color: "#475569",
    fontWeight: "700",
    textTransform: "uppercase",
    fontSize: "0.75rem",
  },
  td: {
    padding: "14px 15px",
    borderBottom: "1px solid #f1f5f9",
    color: "#334155",
    verticalAlign: "middle",
  },
  rowAlt: {
    background: "#f8fafc",
  },
  
  // Estilos de Celdas Específicos
  userCell: { fontWeight: '700', color: '#0f172a' },
  moduleBadge: { 
    display: 'inline-block', padding: '3px 10px', borderRadius: '12px', 
    fontSize: '0.7rem', fontWeight: '700', background: '#e0f2fe', color: '#0369a1', border:'1px solid #bae6fd',
    textTransform: 'uppercase'
  },
  actionText: { fontWeight: '600', color: '#1e293b' },
  dateText: { fontFamily: 'monospace', color: '#64748b', fontSize: '0.8rem' },
  
  // Mensajes
  emptyState: { padding: '40px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' },
  errorText: { padding: '15px', background: '#fee2e2', color: '#991b1b', borderRadius: '10px', marginBottom: '20px', border:'1px solid #fecaca', textAlign:'center' },
};

export default function RegistroAcciones() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [acciones, setAcciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Filtros
  const [search, setSearch] = useState("");
  const [filterModulo, setFilterModulo] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

  const [checkingPermission, setCheckingPermission] = useState(true);

  // 1. Verificar Permisos (Solo Gerente)
  useEffect(() => {
    if (currentUser) {
        const role = (currentUser.tipo || "").toUpperCase();
        if (role !== 'GERENTE' && !currentUser.is_superuser) {
            toast.error("Acceso denegado: Módulo exclusivo para Gerencia.");
            navigate("/"); // Redirigir al inicio
        } else {
            setCheckingPermission(false);
            cargarAcciones();
        }
    }
  }, [currentUser, navigate]);

  // 2. Cargar Datos
  const cargarAcciones = async () => {
    setLoading(true); setError("");
    try {
        // Asumiendo que existe este endpoint en base/urls.py mapeado al ViewSet
        const res = await api.get("/base/registros"); 
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setAcciones(data);
    } catch (err) {
        console.error("Error cargando auditoría:", err);
        setError("No se pudo cargar el historial de acciones.");
    } finally {
        setLoading(false);
    }
  };

  // 3. Lógica de Filtrado Local
  const accionesFiltradas = acciones.filter(a => {
      const term = search.toLowerCase();
      
      // Coincidencia de texto (Usuario, Acción, Descripción)
      // Nota: id_usuario puede venir como objeto o ID, ajusta según tu serializer
      const userName = typeof a.id_usuario === 'object' ? a.id_usuario.username : `User#${a.id_usuario}`;
      const textMatch = 
          (userName || "").toLowerCase().includes(term) ||
          (a.accion || "").toLowerCase().includes(term) ||
          (a.descripcion || "").toLowerCase().includes(term);

      // Coincidencia de Módulo
      const moduleMatch = filterModulo ? a.modulo === filterModulo : true;

      // Coincidencia de Fecha
      let dateMatch = true;
      if (a.fecha_y_hora) {
          const fechaAccion = new Date(a.fecha_y_hora).toISOString().split('T')[0];
          if (dateStart && fechaAccion < dateStart) dateMatch = false;
          if (dateEnd && fechaAccion > dateEnd) dateMatch = false;
      }

      return textMatch && moduleMatch && dateMatch;
  });

  // Obtener lista única de módulos para el select
  const modulosUnicos = [...new Set(acciones.map(a => a.modulo))];

  const limpiarFiltros = () => {
      setSearch("");
      setFilterModulo("");
      setDateStart("");
      setDateEnd("");
  };

  if (checkingPermission) return null; // No renderizar hasta verificar

  return (
    <div style={styles.page}>
      
      {/* 1. HEADER */}
      <div style={styles.headerRow}>
         <div style={styles.iconCircle}><IconHistory /></div>
         <div>
            <h2 style={styles.title}>Auditoría de Acciones</h2>
            <p style={styles.subtitle}>Registro histórico de operaciones realizadas por los usuarios.</p>
         </div>
      </div>

      {error && <div style={styles.errorText}>{error}</div>}

      {/* 2. TARJETA PRINCIPAL */}
      <div style={styles.card}>
        
        {/* BARRA DE FILTROS */}
        <div style={styles.toolbar}>
            {/* Buscador Texto */}
            <div style={{gridColumn: 'span 2'}}> 
                <label style={styles.label}>Buscar (Usuario / Acción)</label>
                <div style={{display:'flex', alignItems:'center', position:'relative'}}>
                    <input 
                        style={styles.input} 
                        placeholder="Ej: crear orden, juan..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <div style={{position:'absolute', right:12, color:'#94a3b8'}}><IconSearch /></div>
                </div>
            </div>

            {/* Filtro Módulo */}
            <div>
                <label style={styles.label}>Módulo</label>
                <select 
                    style={styles.select} 
                    value={filterModulo} 
                    onChange={(e) => setFilterModulo(e.target.value)}
                >
                    <option value="">Todos</option>
                    {modulosUnicos.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
            </div>

            {/* Fechas */}
            <div>
                <label style={styles.label}>Desde</label>
                <input type="date" style={styles.input} value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
            </div>
            <div>
                <label style={styles.label}>Hasta</label>
                <input type="date" style={styles.input} value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
            </div>

            {/* Botones */}
            <div style={styles.actionsContainer}>
                <button style={styles.buttonGhost} onClick={limpiarFiltros} title="Limpiar filtros">
                    <IconRefresh />
                </button>
                <button style={styles.buttonPrimary} onClick={cargarAcciones} disabled={loading}>
                    {loading ? "Cargando..." : "Actualizar"}
                </button>
            </div>
        </div>

        {/* TABLA DE RESULTADOS */}
        <div style={styles.tableWrapper}>
            <table style={styles.table}>
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
                        const rowStyle = idx % 2 === 1 ? styles.rowAlt : {};
                        const fecha = new Date(accion.fecha_y_hora).toLocaleString();
                        const userName = typeof accion.id_usuario === 'object' ? accion.id_usuario.username : (accion.id_usuario || "Sistema");

                        return (
                            <tr key={accion.id_registro} style={rowStyle}>
                                <td style={{...styles.td, ...styles.dateText}}>{fecha}</td>
                                <td style={{...styles.td, ...styles.userCell}}>@{userName}</td>
                                <td style={styles.td}>
                                    <span style={styles.moduleBadge}>{accion.modulo}</span>
                                </td>
                                <td style={{...styles.td, ...styles.actionText}}>{accion.accion}</td>
                                <td style={{...styles.td, color:'#475569', maxWidth:'300px'}}>{accion.descripcion}</td>
                                <td style={{...styles.td, fontFamily:'monospace'}}>
                                    {accion.id_referencia ? `#${accion.id_referencia}` : '-'}
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
        
        {loading && <div style={{textAlign:'center', padding:'30px', color:'#64748b'}}>Cargando historial...</div>}
      </div>
    </div>
  );
}