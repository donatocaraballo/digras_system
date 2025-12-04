// frontend/src/pages/Clientes.jsx
import React, { useEffect, useState } from "react";
import api from "../api/api";

const styles = {
  page: {
    minHeight: "100vh",
    margin: 0,
    padding: "24px",
    background: "#f4f5fb",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    display: "flex",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    maxWidth: "1100px",
    background: "#ffffff",
    borderRadius: "14px",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.12)",
    padding: "20px 24px 24px",
    boxSizing: "border-box",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
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
  buttonPrimary: {
    border: "none",
    borderRadius: "999px",
    padding: "0 16px",
    height: "36px",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  buttonGhost: {
    borderRadius: "999px",
    padding: "0 14px",
    height: "32px",
    background: "#ffffff",
    border: "1px solid #d1d5db",
    color: "#374151",
    cursor: "pointer",
    fontSize: "12px",
  },
  statusTextOk: {
    fontSize: "12px",
    color: "#15803d",
    marginBottom: "6px",
  },
  statusTextError: {
    fontSize: "12px",
    color: "#b91c1c",
    marginBottom: "6px",
  },
  searchRow: {
    display: "flex",
    gap: "10px",
    marginBottom: "12px",
  },
  searchInput: {
    flex: 1,
    height: "36px",
    borderRadius: "999px",
    border: "1px solid #d1d5db",
    padding: "0 14px",
    fontSize: "13px",
    outline: "none",
  },
  tableWrapper: {
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    overflow: "hidden",
    background: "#f9fafb",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "12px",
  },
  th: {
    background: "#f3f4f6",
    textAlign: "left",
    padding: "8px 10px",
    borderBottom: "1px solid #e5e7eb",
    color: "#4b5563",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  td: {
    padding: "8px 10px",
    borderBottom: "1px solid #e5e7eb",
    color: "#111827",
    verticalAlign: "top",
  },
  rowAlt: {
    background: "#f9fafb",
  },
  badgeActivo: (activo) => ({
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: 600,
    background: activo ? "#dcfce7" : "#fee2e2",
    color: activo ? "#166534" : "#b91c1c",
  }),
  resumenResultados: {
    fontSize: "11px",
    color: "#6b7280",
    marginTop: "8px",
  },
  detalleCard: {
    marginTop: "18px",
    padding: "14px 16px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    fontSize: "12px",
  },
  detalleTitle: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#111827",
    marginBottom: "6px",
  },
  detalleLine: {
    marginBottom: "4px",
  },
  detalleActionsRow: {
    marginTop: "10px",
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  pillSmall: {
    fontSize: "11px",
    padding: "2px 8px",
    borderRadius: "999px",
    background: "#e5e7eb",
    color: "#374151",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.35)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 40,
  },
  modal: {
    width: "100%",
    maxWidth: "480px",
    background: "#ffffff",
    borderRadius: "14px",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.2)",
    padding: "18px 20px 20px",
    boxSizing: "border-box",
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#0f172a",
    marginBottom: "4px",
  },
  modalSubtitle: {
    fontSize: "12px",
    color: "#6b7280",
    marginBottom: "12px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "8px",
    marginTop: "8px",
  },
  label: {
    fontSize: "11px",
    fontWeight: 500,
    color: "#4b5563",
    marginBottom: "3px",
  },
  input: {
    height: "34px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    padding: "0 8px",
    fontSize: "12px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  textarea: {
    minHeight: "60px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    padding: "6px 8px",
    fontSize: "12px",
    outline: "none",
    width: "100%",
    resize: "vertical",
    boxSizing: "border-box",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
    marginTop: "14px",
  },
  buttonDanger: {
    borderRadius: "999px",
    padding: "0 14px",
    height: "32px",
    background: "#ef4444",
    border: "none",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 500,
  },
};

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState("crear"); // "crear" | "editar"
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    correo: "",
    direccion: "",
  });

  const cargarClientes = async () => {
    setLoading(true);
    setError("");
    setMensaje("");

    try {
      const res = await api.get("/clientes/");
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setClientes(data);
      setMensaje(`Se encontraron ${data.length} cliente(s).`);
    } catch (err) {
      console.error("Error cargando clientes:", err);
      const backendMsg =
        err.response?.data?.error || err.response?.data?.detail;
      setError(
        backendMsg || "No se pudieron cargar los clientes. Revisa el token o el servidor."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  const filtrados = clientes.filter((c) => {
    const texto = (search || "").toLowerCase();
    if (!texto) return true;
    const nombre = (c.nombre || "").toLowerCase();
    const correo = (c.correo || "").toLowerCase();
    const telefono = (c.telefono || "").toLowerCase();
    return (
      nombre.includes(texto) ||
      correo.includes(texto) ||
      telefono.includes(texto)
    );
  });

  const abrirCrear = () => {
    setFormMode("crear");
    setFormData({
      nombre: "",
      telefono: "",
      correo: "",
      direccion: "",
    });
    setFormError("");
    setShowFormModal(true);
  };

  const abrirEditar = (cliente) => {
    setFormMode("editar");
    setFormData({
      nombre: cliente.nombre || "",
      telefono: cliente.telefono || "",
      correo: cliente.correo || "",
      direccion: cliente.direccion || "",
    });
    setFormError("");
    setShowFormModal(true);
  };

  const handleFormChange = (campo, valor) => {
    setFormData((prev) => ({ ...prev, [campo]: valor }));
  };

  const guardarCliente = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);

    try {
      if (!formData.nombre) {
        setFormError("El nombre es obligatorio.");
        setFormLoading(false);
        return;
      }

      if (formMode === "crear") {
        await api.post("/clientes/", formData);
      } else if (formMode === "editar" && clienteSeleccionado) {
        await api.patch(`/clientes/${clienteSeleccionado.id_cliente}/`, formData);
      }

      setShowFormModal(false);
      setClienteSeleccionado(null);
      await cargarClientes();
    } catch (err) {
      console.error("Error guardando cliente:", err);
      const backendMsg =
        err.response?.data?.error || err.response?.data?.detail;
      setFormError(
        backendMsg || "No se pudo guardar el cliente. Revisa los datos."
      );
    } finally {
      setFormLoading(false);
    }
  };

  const eliminarCliente = async () => {
    if (!clienteSeleccionado) return;
    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar al cliente "${clienteSeleccionado.nombre}"?`
    );
    if (!confirmar) return;

    try {
      await api.delete(`/clientes/${clienteSeleccionado.id_cliente}/`);
      setClienteSeleccionado(null);
      await cargarClientes();
    } catch (err) {
      console.error("Error eliminando cliente:", err);
      const backendMsg =
        err.response?.data?.error || err.response?.data?.detail;
      alert(
        backendMsg ||
          "No se pudo eliminar el cliente. Es posible que tenga órdenes asociadas."
      );
    }
  };

  const cambiarEstadoCliente = async (activo) => {
    if (!clienteSeleccionado) return;
    try {
      await api.patch(`/clientes/${clienteSeleccionado.id_cliente}/`, {
        activo: !!activo,
      });
      await cargarClientes();
      // Limpiamos la selección para evitar mostrar datos desactualizados
      setClienteSeleccionado(null);
    } catch (err) {
      console.error("Error cambiando estado de cliente:", err);
      const backendMsg =
        err.response?.data?.error || err.response?.data?.detail;
      alert(
        backendMsg || "No se pudo cambiar el estado del cliente."
      );
    }
  };

  const badgeActivo = (cli) => {
    // Asumimos campo "activo" o, si no existe, lo tratamos como siempre activo.
    const activo =
      cli.activo !== undefined && cli.activo !== null ? cli.activo : true;
    return (
      <span style={styles.badgeActivo(activo)}>
        {activo ? "ACTIVO" : "INACTIVO"}
      </span>
    );
  };

  const estadoClienteTexto = (cli) => {
    const activo =
      cli.activo !== undefined && cli.activo !== null ? cli.activo : true;
    return activo ? "Activo" : "Inactivo";
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.headerRow}>
          <div>
            <h2 style={styles.title}>Clientes</h2>
            <p style={styles.subtitle}>
              Consulta, crea, edita y administra los clientes de la distribuidora.
            </p>
          </div>
          <button type="button" style={styles.buttonPrimary} onClick={abrirCrear}>
            <span>+ Nuevo cliente</span>
          </button>
        </div>

        {mensaje && <div style={styles.statusTextOk}>{mensaje}</div>}
        {error && <div style={styles.statusTextError}>{error}</div>}

        {/* BUSCADOR */}
        <div style={styles.searchRow}>
          <input
            type="text"
            style={styles.searchInput}
            placeholder="Buscar por nombre, teléfono o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="button"
            style={styles.buttonGhost}
            onClick={() => setSearch("")}
          >
            Limpiar
          </button>
        </div>

        {/* TABLA DE CLIENTES */}
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Teléfono</th>
                <th style={styles.th}>Correo</th>
                <th style={styles.th}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 && !loading && (
                <tr>
                  <td style={styles.td} colSpan={6}>
                    No hay clientes que coincidan con la búsqueda.
                  </td>
                </tr>
              )}

              {filtrados.map((c, idx) => {
                const rowBase =
                  idx % 2 === 1
                    ? { ...styles.td, ...styles.rowAlt }
                    : styles.td;

                const seleccionado =
                  clienteSeleccionado &&
                  clienteSeleccionado.id_cliente === c.id_cliente;

                return (
                  <tr
                    key={c.id_cliente}
                    onClick={() => setClienteSeleccionado(c)}
                    style={{
                      cursor: "pointer",
                      backgroundColor: seleccionado ? "#e0f2fe" : undefined,
                    }}
                  >
                    <td style={rowBase}>{c.id_cliente}</td>
                    <td style={rowBase}>{c.nombre}</td>
                    <td style={rowBase}>{c.telefono || "-"}</td>
                    <td style={rowBase}>{c.correo || "-"}</td>
                    <td style={rowBase}>{badgeActivo(c)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtrados.length > 0 && (
          <div style={styles.resumenResultados}>
            Mostrando {filtrados.length} cliente(s). Haz clic en una fila para ver
            el detalle y opciones.
          </div>
        )}

        {/* DETALLE DE CLIENTE SELECCIONADO */}
        {clienteSeleccionado && (
          <div style={styles.detalleCard}>
            <div style={styles.detalleTitle}>
              Cliente #{clienteSeleccionado.id_cliente} · {clienteSeleccionado.nombre}
            </div>

            <div style={styles.detalleLine}>
              <strong>Teléfono: </strong> {clienteSeleccionado.telefono || "No registrado"}
            </div>
            <div style={styles.detalleLine}>
              <strong>Correo: </strong> {clienteSeleccionado.correo || "No registrado"}
            </div>
            <div style={styles.detalleLine}>
              <strong>Dirección: </strong>{" "}
              {clienteSeleccionado.direccion || "No registrada"}
            </div>
            <div style={styles.detalleLine}>
              <strong>Estado: </strong> {estadoClienteTexto(clienteSeleccionado)}{" "}
              {badgeActivo(clienteSeleccionado)}
            </div>

            {/* Aquí en el futuro puedes agregar datos derivados:
                - Total de órdenes del cliente
                - Última compra, etc. */}

            <div style={styles.detalleActionsRow}>
              {/* IMPORTANTE: 
                  Las validaciones de que solo el vendedor asociado pueda hacer esto
                  deben reforzarse en el backend.
                  Aquí simplemente mostramos los botones. */}
              <button
                type="button"
                style={styles.buttonGhost}
                onClick={() => abrirEditar(clienteSeleccionado)}
              >
                Editar datos
              </button>

              <button
                type="button"
                style={styles.buttonGhost}
                onClick={() => cambiarEstadoCliente(false)}
              >
                Desactivar
              </button>

              <button
                type="button"
                style={styles.buttonGhost}
                onClick={() => cambiarEstadoCliente(true)}
              >
                Activar
              </button>

              <button
                type="button"
                style={styles.buttonDanger}
                onClick={eliminarCliente}
              >
                Eliminar cliente
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div style={{ marginTop: "8px", fontSize: "12px", color: "#6b7280" }}>
            Cargando clientes...
          </div>
        )}
      </div>

      {/* MODAL CREAR / EDITAR CLIENTE */}
      {showFormModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalTitle}>
              {formMode === "crear" ? "Nuevo cliente" : "Editar cliente"}
            </div>
            <div style={styles.modalSubtitle}>
              Completa los datos del cliente. Los campos marcados con * son obligatorios.
            </div>

            <form onSubmit={guardarCliente}>
              <div style={styles.formGrid}>
                <div>
                  <div style={styles.label}>Nombre *</div>
                  <input
                    style={styles.input}
                    value={formData.nombre}
                    onChange={(e) => handleFormChange("nombre", e.target.value)}
                    placeholder="Nombre del cliente"
                  />
                </div>

                <div>
                  <div style={styles.label}>Teléfono</div>
                  <input
                    style={styles.input}
                    value={formData.telefono}
                    onChange={(e) =>
                      handleFormChange("telefono", e.target.value)
                    }
                    placeholder="0414-0000000"
                  />
                </div>

                <div>
                  <div style={styles.label}>Correo</div>
                  <input
                    type="email"
                    style={styles.input}
                    value={formData.correo}
                    onChange={(e) =>
                      handleFormChange("correo", e.target.value)
                    }
                    placeholder="cliente@correo.com"
                  />
                </div>

                <div>
                  <div style={styles.label}>Dirección</div>
                  <textarea
                    style={styles.textarea}
                    value={formData.direccion}
                    onChange={(e) =>
                      handleFormChange("direccion", e.target.value)
                    }
                    placeholder="Dirección fiscal y de entrega"
                  />
                </div>
              </div>

              {formError && (
                <div
                  style={{
                    marginTop: "8px",
                    fontSize: "12px",
                    color: "#b91c1c",
                  }}
                >
                  {formError}
                </div>
              )}

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.buttonGhost}
                  onClick={() => setShowFormModal(false)}
                  disabled={formLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={styles.buttonPrimary}
                  disabled={formLoading}
                >
                  {formLoading
                    ? "Guardando..."
                    : formMode === "crear"
                    ? "Crear cliente"
                    : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}