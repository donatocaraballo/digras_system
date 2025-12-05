// frontend/src/pages/ReceptionDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import ReceivePurchaseModal from "../components/ReceivePurchaseModal";
import toast from "react-hot-toast";

const COMPRAS_URL = "/api/compras/compras/";

function ReceptionDashboard() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrdenes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(COMPRAS_URL);
      // Solo compras que el almacenista puede recibir
      const pendientes = response.data.filter(
        (c) => c.estado_de_envio === "APROBADA"
      );
      setOrdenes(pendientes);
    } catch (error) {
      console.error("Error cargando órdenes:", error);
      toast.error("No se pudieron cargar las compras pendientes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrdenes();
  }, [fetchOrdenes]);

  const handleOpenModal = (orden) => {
    setSelectedOrder(orden);
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
  };

  const handleReceptionSuccess = () => {
    // 1) Cerrar el modal
    setSelectedOrder(null);
    // 2) Refrescar la lista
    fetchOrdenes();
    // 3) Notificar al usuario
    toast.success("Compra recibida y stock actualizado correctamente.");
  };

  return (
    <div>
      <h2
        style={{
          borderBottom: "4px solid #ffc107",
          paddingBottom: "10px",
          marginBottom: "8px",
        }}
      >
        📦 Dashboard de Recepción (Almacén)
      </h2>
      <p style={{ marginTop: 0 }}>
        Solo se muestran órdenes de compra <strong>APROBADAS</strong> esperando
        ingreso a inventario.
      </p>

      {loading ? (
        <p>Cargando compras pendientes...</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "20px",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#333", color: "white" }}>
              <th style={thStyle}>Orden #</th>
              <th style={thStyle}>Proveedor</th>
              <th style={thStyle}>Fecha pedido</th>
              <th style={thStyle}>Estado</th>
              <th style={thStyle}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {ordenes.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  style={{ textAlign: "center", padding: "20px" }}
                >
                  No hay mercancía pendiente de recepción.
                </td>
              </tr>
            ) : (
              ordenes.map((orden) => (
                <tr
                  key={orden.id_compra}
                  style={{ borderBottom: "1px solid #ddd" }}
                >
                  <td style={tdStyle}>{orden.id_compra}</td>
                  <td style={tdStyle}>{orden.id_proveedor_nombre}</td>
                  <td style={tdStyle}>{orden.fecha_pedido}</td>
                  <td style={tdStyle}>
                    <span style={badgeStyle}>
                      {orden.estado_de_envio.replace("_", " ")}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => handleOpenModal(orden)}
                      style={btnReceiveStyle}
                    >
                      📥 Recibir compra
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {/* MODAL DE RECEPCIÓN */}
      {selectedOrder && (
        <ReceivePurchaseModal
          compra={selectedOrder}
          onClose={handleCloseModal}
          onSuccess={handleReceptionSuccess} // Recargar lista y cerrar modal
        />
      )}
    </div>
  );
}

// Estilos
const thStyle = { padding: "12px", textAlign: "left" };
const tdStyle = { padding: "12px" };
const badgeStyle = {
  backgroundColor: "#e0f7fa",
  color: "#006064",
  padding: "4px 8px",
  borderRadius: "4px",
  fontSize: "0.85em",
  fontWeight: "bold",
};
const btnReceiveStyle = {
  backgroundColor: "#ffc107",
  border: "none",
  padding: "8px 15px",
  borderRadius: "4px",
  cursor: "pointer",
  fontWeight: "bold",
  color: "#333",
};

export default ReceptionDashboard;