// frontend/src/pages/Usuarios.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../AuthContext";
import toast from 'react-hot-toast';

// --- ICONOS SVG ---
const IconUsers = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
const IconSearch = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const IconPlus = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const IconEdit = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const IconLock = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;
const IconUnlock = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>;
const IconRefresh = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>;
const IconAlert = () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;

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

  // Toolbar
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
    gap: "20px",
    flexWrap: "wrap",
    background: "#f8fafc",
    padding: "20px",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
  },
  searchContainer: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    maxWidth: "500px",
    gap: '10px'
  },
  searchInput: {
    flex: 1,
    height: "40px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    padding: "0 12px",
    fontSize: "0.9rem",
    outline: "none",
    color: "#334155",
    backgroundColor: "#fff",
  },

  // Botones
  buttonPrimary: {
    border: "none",
    borderRadius: "10px",
    padding: "0 20px",
    height: "42px",
    background: "#0f172a",
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
    height: "40px",
    background: "transparent",
    border: "1px solid #cbd5e1",
    color: "#64748b",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "600",
    display: 'flex', alignItems:'center', gap:'6px'
  },
  buttonDanger: {
    borderRadius: "8px",
    padding: "6px 12px",
    background: "#fee2e2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    cursor: "pointer",
    fontSize: "0.8rem",
    fontWeight: "600",
    display: 'flex', alignItems:'center', gap:'6px'
  },
  buttonSuccess: {
    borderRadius: "8px",
    padding: "6px 12px",
    background: "#dcfce7",
    border: "1px solid #bbf7d0",
    color: "#166534",
    cursor: "pointer",
    fontSize: "0.8rem",
    fontWeight: "600",
    display: 'flex', alignItems:'center', gap:'6px'
  },
  buttonDisabled: {
    borderRadius: "8px",
    padding: "6px 12px",
    background: "#f3f4f6",
    border: "1px solid #e5e7eb",
    color: "#9ca3af",
    cursor: "not-allowed",
    fontSize: "0.8rem",
    fontWeight: "600",
    display: 'flex', alignItems:'center', gap:'6px',
    opacity: 0.7
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
    padding: "15px",
    borderBottom: "1px solid #f1f5f9",
    color: "#334155",
    verticalAlign: "middle",
  },
  rowAlt: {
    background: "#f8fafc",
  },

  // Badges
  roleBadge: (role) => {
    const r = (role || "").toUpperCase();
    let bg = "#f1f5f9", color = "#475569", border = "#e2e8f0";
    
    if(r === "GERENTE") { bg = "#dcfce7"; color = "#166534"; border="#bbf7d0"; }
    if(r === "ADMINISTRADOR") { bg = "#e0f2fe"; color = "#0369a1"; border="#bae6fd"; }
    if(r === "VENDEDOR") { bg = "#ffedd5"; color = "#9a3412"; border="#fed7aa"; }
    if(r === "ALMACENISTA") { bg = "#fef9c3"; color = "#854d0e"; border="#fde047"; }
    if(r === "TRANSPORTISTA") { bg = "#f3e8ff"; color = "#6b21a8"; border="#d8b4fe"; }

    return {
        display: "inline-block", padding: "3px 10px", borderRadius: "20px",
        fontSize: "0.7rem", fontWeight: "700", background: bg, color: color,
        border: `1px solid ${border}`, textTransform: 'uppercase'
    };
  },
  statusBadge: (isActive) => ({
    display: "inline-block", padding: "3px 10px", borderRadius: "20px",
    fontSize: "0.7rem", fontWeight: "700",
    background: isActive ? "#f0fdf4" : "#fef2f2",
    color: isActive ? "#15803d" : "#b91c1c",
    border: `1px solid ${isActive ? "#bbf7d0" : "#fecaca"}`,
  }),

  // --- MODALES ---
  modalOverlay: {
    position: "fixed", 
    inset: 0, 
    background: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(4px)", 
    display: "flex", 
    justifyContent: "center", 
    alignItems: "center", 
    zIndex: 20000, 
  },
  // Modal de Formulario (Grande)
  modal: {
    width: "100%", maxWidth: "600px", background: "#ffffff", borderRadius: "16px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", padding: "30px", boxSizing: "border-box",
    animation: "scaleUp 0.2s ease-out", position: 'relative'
  },
  // Modal de Confirmación (Pequeño)
  confirmModal: {
    width: "100%", maxWidth: "400px", background: "#ffffff", borderRadius: "16px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", padding: "25px", boxSizing: "border-box",
    animation: "scaleUp 0.2s ease-out", textAlign: 'center', position: 'relative'
  },
  modalTitle: { fontSize: "1.3rem", fontWeight: "700", color: "#0f172a", marginBottom: "5px" },
  modalSubtitle: { fontSize: "0.9rem", color: "#64748b", marginBottom: "20px" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" },
  label: { fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "5px", textTransform: "uppercase" },
  input: { height: "40px", borderRadius: "8px", border: "1px solid #cbd5e1", padding: "0 12px", fontSize: "0.9rem", outline: "none", width: "100%", boxSizing: "border-box" },
  select: { height: "40px", borderRadius: "8px", border: "1px solid #cbd5e1", padding: "0 12px", fontSize: "0.9rem", outline: "none", width: "100%", boxSizing: "border-box", backgroundColor: "#fff" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "25px", borderTop: "1px solid #f1f5f9", paddingTop: "20px" },
  
  errorText: { marginTop: "10px", padding: "10px", background: "#fee2e2", color: "#b91c1c", borderRadius: "8px", fontSize: "0.85rem", fontWeight: '600' },
  emptyState: { padding: '40px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' },
};

// Inyección de animación
const styleSheet = document.createElement("style");
styleSheet.innerText = `@keyframes scaleUp { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }`;
document.head.appendChild(styleSheet);

export default function Usuarios() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [hasPermission, setHasPermission] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(true);

  // Estados
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Modal Crear/Editar
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("crear");
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Modal Confirmación
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', type: 'danger', onConfirm: null });

  // Formulario
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    email: "",
    tipo: "VENDEDOR",
    telefono: "",
    direccion: ""
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // 1. VERIFICACIÓN DE SEGURIDAD (CRÍTICA)
  useEffect(() => {
    if (currentUser !== null) { 
        const role = (currentUser.tipo || "").toUpperCase();
        if (role === 'GERENTE' || role === 'ADMINISTRADOR' || currentUser.is_superuser) {
            setHasPermission(true);
            setCheckingPermission(false);
            cargarUsuarios();
        } else {
            toast.error("Acceso denegado: Solo Gerentes pueden gestionar usuarios.");
            navigate("/");
        }
    }
  }, [currentUser, navigate]);

  // 2. Cargar Usuarios
  const cargarUsuarios = async () => {
    setLoading(true); 
    try {
        const res = await api.get("/base/usuarios/");
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        const sorted = data.sort((a, b) => b.is_active - a.is_active || a.id_usuario - b.id_usuario);
        setUsuarios(sorted);
    } catch (err) {
        toast.error("Error al cargar la lista de usuarios.");
    } finally {
        setLoading(false);
    }
  };

  // 3. Filtrado
  const usuariosFiltrados = usuarios.filter(u => {
      const term = search.toLowerCase();
      const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
      return (
          u.username.toLowerCase().includes(term) ||
          fullName.includes(term) ||
          (u.email || "").toLowerCase().includes(term) ||
          (u.tipo || "").toLowerCase().includes(term)
      );
  });

  // 4. Gestión del Modal
  const abrirCrear = () => {
      setModalMode("crear");
      setSelectedUser(null);
      setFormData({
          username: "", password: "", first_name: "", last_name: "",
          email: "", tipo: "VENDEDOR", telefono: "", direccion: ""
      });
      setFormError("");
      setModalOpen(true);
  };

  const abrirEditar = (user) => {
      setModalMode("editar");
      setSelectedUser(user);
      setFormData({
          username: user.username,
          password: "",
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          email: user.email || "",
          tipo: user.tipo || "VENDEDOR",
          telefono: user.telefono || "",
          direccion: user.direccion || ""
      });
      setFormError("");
      setModalOpen(true);
  };

  const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 5. Submit Formulario (VALIDACIONES ESTRICTAS & DUPLICADOS)
  const handleSubmit = async (e) => {
      e.preventDefault();
      setFormLoading(true); setFormError("");
      const loadingToast = toast.loading("Guardando...");

      try {
          // --- VALIDACIONES DE CAMPOS OBLIGATORIOS ---
          if (!formData.username.trim()) throw new Error("El nombre de usuario es obligatorio.");
          if (formData.username.includes(" ")) throw new Error("El usuario no puede contener espacios.");
          
          if (modalMode === "crear" && (!formData.password || formData.password.length < 6)) {
              throw new Error("La contraseña es obligatoria y debe tener al menos 6 caracteres.");
          }
          
          if (!formData.first_name.trim()) throw new Error("El nombre es obligatorio.");
          if (!formData.last_name.trim()) throw new Error("El apellido es obligatorio.");

          if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
              throw new Error("El correo electrónico es obligatorio y debe ser válido.");
          }

          const cleanPhone = formData.telefono.replace(/\D/g, ''); 
          if (!formData.telefono) throw new Error("El teléfono es obligatorio.");
          if (cleanPhone.length !== 11 || !cleanPhone.startsWith('0')) {
              throw new Error("El teléfono debe tener 11 dígitos y comenzar con 0 (Ej: 04141234567).");
          }

          // --- 🚨 VALIDACIÓN DE UNICIDAD (FRONTEND) ---
          // Verifica si el correo ya existe en la lista cargada (excepto si es el mismo usuario editándose)
          const duplicateEmail = usuarios.find(u => 
              u.email && 
              u.email.trim().toLowerCase() === formData.email.trim().toLowerCase() &&
              (modalMode === 'crear' ? true : u.id_usuario !== selectedUser?.id_usuario)
          );

          if (duplicateEmail) {
              throw new Error(`El correo ${formData.email} ya está en uso por el usuario @${duplicateEmail.username}.`);
          }

          // --- LIMPIEZA DE DATOS ---
          const payload = { ...formData };

          if (modalMode === "editar" && !payload.password) delete payload.password;
          if (!payload.direccion || payload.direccion.trim() === "") delete payload.direccion;

          // --- LLAMADA A LA API ---
          if (modalMode === "crear") {
              await api.post("/base/usuarios/", payload);
              toast.success("Usuario creado.", { id: loadingToast });
          } else {
              await api.patch(`/base/usuarios/${selectedUser.id_usuario}/`, payload);
              toast.success("Usuario actualizado.", { id: loadingToast });
          }

          setModalOpen(false);
          cargarUsuarios();

      } catch (err) {
          console.error("Error guardando usuario:", err);
          
          let msg = "Error al guardar.";
          if (err.response && err.response.data) {
              const data = err.response.data;
              const firstKey = Object.keys(data)[0];
              if (firstKey) {
                  const errorContent = Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey];
                  msg = `${firstKey.toUpperCase()}: ${errorContent}`;
              } else if (data.detail) {
                  msg = data.detail;
              }
          } else if (err.message) {
              msg = err.message;
          }

          setFormError(msg);
          toast.error(msg, { id: loadingToast });
      } finally {
          setFormLoading(false);
      }
  };

  // 6. Confirmación y Acciones
  const triggerToggleActive = (user) => {
      const currentId = currentUser.id_usuario || currentUser.id;
      const targetId = user.id_usuario || user.id;

      if (currentId === targetId) {
          toast.error("No puedes desactivar tu propia cuenta.");
          return;
      }

      const isTargetGerente = (user.tipo || "").toUpperCase() === "GERENTE";
      const amIGerente = (currentUser.tipo || "").toUpperCase() === "GERENTE";

      if (amIGerente && isTargetGerente) {
          toast.error("Un Gerente no puede desactivar a otro Gerente.");
          return;
      }

      const action = user.is_active ? "desactivar" : "activar";
      const type = user.is_active ? 'danger' : 'success';
      
      setConfirmConfig({
          title: user.is_active ? 'Desactivar Cuenta' : 'Reactivar Cuenta',
          message: `¿Estás seguro que deseas ${action} el acceso para @${user.username}?`,
          type: type,
          onConfirm: async () => {
              const loadingToast = toast.loading("Actualizando...");
              try {
                  await api.patch(`/base/usuarios/${user.id_usuario}/`, { is_active: !user.is_active });
                  toast.success(`Usuario ${action === 'activar' ? 'activado' : 'desactivado'}.`, { id: loadingToast });
                  setConfirmOpen(false);
                  cargarUsuarios();
              } catch (err) {
                  toast.error("Error al cambiar estado.", { id: loadingToast });
              }
          }
      });
      setConfirmOpen(true);
  };

  if (checkingPermission || !hasPermission) {
      return null; 
  }

  return (
    <div style={styles.page}>
      
      <div style={styles.headerRow}>
         <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
            <div style={styles.iconCircle}><IconUsers /></div>
            <div>
                <h2 style={styles.title}>Gestión de Usuarios</h2>
                <p style={styles.subtitle}>Administración de cuentas, roles y accesos del sistema.</p>
            </div>
         </div>
      </div>

      <div style={styles.card}>
        <div style={styles.toolbar}>
            <div style={styles.searchContainer}>
                <IconSearch />
                <input 
                    style={styles.searchInput} 
                    placeholder="Buscar por nombre, usuario o rol..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            
            <div style={{display:'flex', gap:'10px'}}>
                <button style={styles.buttonGhost} onClick={() => setSearch('')}>
                    <IconRefresh /> Limpiar
                </button>
                <button style={styles.buttonPrimary} onClick={abrirCrear}>
                    <IconPlus /> Nuevo Usuario
                </button>
            </div>
        </div>

        <div style={styles.tableWrapper}>
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>Usuario</th>
                        <th style={styles.th}>Nombre Completo</th>
                        <th style={styles.th}>Rol</th>
                        <th style={styles.th}>Teléfono</th>
                        <th style={styles.th}>Estado</th>
                        <th style={{...styles.th, textAlign:'center'}}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {usuariosFiltrados.length === 0 && !loading && (
                        <tr><td colSpan={6} style={styles.emptyState}>No se encontraron usuarios.</td></tr>
                    )}
                    
                    {usuariosFiltrados.map((u, idx) => {
                        const rowStyle = idx % 2 === 1 ? styles.rowAlt : {};
                        const currentId = currentUser.id_usuario || currentUser.id;
                        const targetId = u.id_usuario || u.id;
                        const isSelf = currentId === targetId;
                        const isTargetGerente = (u.tipo || "").toUpperCase() === "GERENTE";
                        const amIGerente = (currentUser.tipo || "").toUpperCase() === "GERENTE";
                        const isActionDisabled = isSelf || (amIGerente && isTargetGerente);
                        
                        let tooltip = "";
                        if (isSelf) tooltip = "No puedes desactivar tu propia cuenta.";
                        else if (amIGerente && isTargetGerente) tooltip = "No puedes desactivar a otro Gerente.";

                        return (
                            <tr key={u.id_usuario} style={rowStyle}>
                                <td style={{...styles.td, fontWeight:'700', color:'#0f172a'}}>@{u.username}</td>
                                <td style={styles.td}>
                                    {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}` : <span style={{color:'#94a3b8', fontStyle:'italic'}}>Sin nombre</span>}
                                    <div style={{fontSize:'0.75rem', color:'#64748b'}}>{u.email}</div>
                                </td>
                                <td style={styles.td}>
                                    <span style={styles.roleBadge(u.tipo)}>{u.tipo}</span>
                                </td>
                                <td style={styles.td}>{u.telefono || '-'}</td>
                                <td style={styles.td}>
                                    <span style={styles.statusBadge(u.is_active)}>
                                        {u.is_active ? 'ACTIVO' : 'INACTIVO'}
                                    </span>
                                </td>
                                <td style={{...styles.td, textAlign:'center'}}>
                                    <div style={{display:'flex', gap:'8px', justifyContent:'center'}}>
                                        <button onClick={() => abrirEditar(u)} style={styles.buttonGhost} title="Editar">
                                            <IconEdit /> Editar
                                        </button>
                                        
                                        <button 
                                            onClick={() => !isActionDisabled && triggerToggleActive(u)} 
                                            style={isActionDisabled 
                                                ? styles.buttonDisabled 
                                                : (u.is_active ? styles.buttonDanger : styles.buttonSuccess)
                                            }
                                            disabled={isActionDisabled}
                                            title={tooltip}
                                        >
                                            {u.is_active ? <><IconLock /> Desactivar</> : <><IconUnlock /> Activar</>}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
        {loading && <div style={{textAlign:'center', padding:20, color:'#64748b'}}>Cargando usuarios...</div>}
      </div>

      {modalOpen && (
          <div style={styles.modalOverlay}>
              <div style={styles.modal}>
                  <div style={styles.modalTitle}>
                      {modalMode === 'crear' ? 'Registrar Nuevo Usuario' : `Editar @${selectedUser?.username}`}
                  </div>
                  <div style={styles.modalSubtitle}>
                      {modalMode === 'crear' 
                        ? 'Completa los datos para dar de alta un nuevo acceso al sistema.' 
                        : 'Modifica los datos. Deja la contraseña en blanco para mantener la actual.'}
                  </div>

                  <form onSubmit={handleSubmit}>
                      <div style={styles.formGrid}>
                          <div>
                              <div style={styles.label}>Usuario *</div>
                              <input style={styles.input} name="username" value={formData.username} onChange={handleChange} placeholder="Ej: jlopez" disabled={modalMode === 'editar'} />
                          </div>
                          <div>
                              <div style={styles.label}>Rol *</div>
                              <select style={styles.select} name="tipo" value={formData.tipo} onChange={handleChange}>
                                  <option value="VENDEDOR">Vendedor</option>
                                  <option value="ALMACENISTA">Almacenista</option>
                                  <option value="TRANSPORTISTA">Transportista</option>
                                  <option value="GERENTE">Gerente</option>
                                  <option value="ADMINISTRADOR">Administrador</option>
                              </select>
                          </div>
                          <div>
                              <div style={styles.label}>Nombre *</div>
                              <input style={styles.input} name="first_name" value={formData.first_name} onChange={handleChange} />
                          </div>
                          <div>
                              <div style={styles.label}>Apellido *</div>
                              <input style={styles.input} name="last_name" value={formData.last_name} onChange={handleChange} />
                          </div>
                          <div>
                              <div style={styles.label}>Contraseña</div>
                              <input type="password" style={styles.input} name="password" value={formData.password} onChange={handleChange} placeholder={modalMode==='crear'?'Requerida (min 6)':'Opcional'} />
                          </div>
                          <div>
                              <div style={styles.label}>Teléfono *</div>
                              <input style={styles.input} name="telefono" value={formData.telefono} onChange={handleChange} placeholder="0414..." />
                          </div>
                          <div style={{gridColumn:'1/-1'}}>
                              <div style={styles.label}>Email *</div>
                              <input type="email" style={styles.input} name="email" value={formData.email} onChange={handleChange} placeholder="usuario@digras.com" />
                          </div>
                          <div style={{gridColumn:'1/-1'}}>
                              <div style={styles.label}>Dirección (Opcional)</div>
                              <input style={styles.input} name="direccion" value={formData.direccion} onChange={handleChange} placeholder="Domicilio" />
                          </div>
                      </div>

                      {formError && <div style={styles.errorText}>⚠️ {formError}</div>}

                      <div style={styles.modalActions}>
                          <button type="button" style={styles.buttonGhost} onClick={() => setModalOpen(false)} disabled={formLoading}>Cancelar</button>
                          <button type="submit" style={styles.buttonPrimary} disabled={formLoading}>{formLoading ? "Guardando..." : "Guardar Usuario"}</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {confirmOpen && (
          <div style={styles.modalOverlay}>
              <div style={styles.confirmModal}>
                  <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:10, marginBottom:20}}>
                      <IconAlert />
                      <div style={{fontSize:'1.2rem', fontWeight:'700', color:'#0f172a'}}>{confirmConfig.title}</div>
                  </div>
                  <div style={{fontSize:'0.95rem', color:'#475569', marginBottom:30, lineHeight:1.5}}>
                      {confirmConfig.message}
                  </div>
                  <div style={{display:'flex', gap:10, justifyContent:'center'}}>
                      <button style={{...styles.buttonGhost, border:'1px solid #cbd5e1'}} onClick={() => setConfirmOpen(false)}>Cancelar</button>
                      <button 
                        style={confirmConfig.type === 'danger' ? styles.buttonDanger : styles.buttonSuccess} 
                        onClick={confirmConfig.onConfirm}
                      >
                        {confirmConfig.type === 'danger' ? 'Sí, Desactivar' : 'Sí, Activar'}
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}