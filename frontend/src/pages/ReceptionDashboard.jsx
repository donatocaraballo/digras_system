// frontend/src/pages/ReceptionDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import ReceivePurchaseModal from "../components/ReceivePurchaseModal";
import toast from "react-hot-toast";

const COMPRAS_URL = "/api/compras/compras/";

// --- ICONOS ---
const IconWarehouse = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8"></path><path d="M16 3H8l-5 5h18l-5-5z"></path><path d="M12 12v10"></path></svg>;
const IconBox = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path></svg>;

// --- ESTILOS PREMIUM ---
const styles = {
    // page: manejado por page-container
    
    headerRow: { display: "flex", alignItems: "center", gap: "15px", marginBottom: "25px", paddingLeft: "10px" },
    iconCircle: { width: '56px', height: '56px', borderRadius: '14px', backgroundColor: '#fff7ed', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
    title: { fontSize: "1.8rem", fontWeight: "800", color: "#0f172a", margin: 0, letterSpacing: "-0.5px" },
    subtitle: { fontSize: "1rem", color: "#64748b", marginTop: "4px" },
    
    // card: manejado por card-responsive
    
    // tableWrapper: manejado por table-responsive-wrapper
    table: { width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", minWidth: "800px" },
    th: { background: "#f8fafc", textAlign: "left", padding: "15px", borderBottom: "2px solid #e2e8f0", color: "#475569", fontWeight: "700", textTransform: "uppercase", fontSize: "0.75rem" },
    td: { padding: "15px", borderBottom: "1px solid #f1f5f9", color: "#334155" },
    badge: { display: "inline-block", padding: "4px 10px", borderRadius: "20px", fontSize: "0.7rem", fontWeight: "700", background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" },
    buttonAction: { border: "none", borderRadius: "10px", padding: "0 15px", height: "38px", background: "#f59e0b", color: "#fff", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 10px rgba(245, 158, 11, 0.2)" }
};

export default function ReceptionDashboard() {
    const [ordenes, setOrdenes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const fetchOrdenes = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(COMPRAS_URL);
            const pendientes = response.data.filter((c) => c.estado_de_envio === "APROBADA");
            setOrdenes(pendientes);
        } catch (error) {
            toast.error("No se pudieron cargar las compras pendientes.");
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchOrdenes(); }, [fetchOrdenes]);

    const handleOpenModal = (orden) => setSelectedOrder(orden);
    const handleCloseModal = () => setSelectedOrder(null);

    const handleReceptionSuccess = () => {
        setSelectedOrder(null);
        fetchOrdenes();
        toast.success("Stock actualizado correctamente.");
    };

    return (
        <div className="page-container">
            <div style={styles.headerRow}>
                <div style={styles.iconCircle}><IconWarehouse /></div>
                <div>
                    <h2 style={styles.title}>Recepción de Mercancía</h2>
                    <p style={styles.subtitle}>Gestión de ingresos físicos a inventario y control de calidad.</p>
                </div>
            </div>

            <div className="card-responsive">
                <p style={{ margin: "0 0 20px 0", color: "#64748b", fontSize: "0.9rem" }}>
                    Solo se muestran órdenes <strong>APROBADAS</strong> esperando ingreso.
                </p>

                {/* 🚨 WRAPPER DE TABLA RESPONSIVA */}
                <div className="table-responsive-wrapper">
                    <table className="table-responsive" style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Orden #</th>
                                <th style={styles.th}>Proveedor</th>
                                <th style={styles.th}>Fecha Pedido</th>
                                <th style={styles.th}>Estado</th>
                                <th style={{ ...styles.th, textAlign: 'center' }}>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ textAlign: "center", padding: "30px" }}>Cargando...</td></tr>
                            ) : ordenes.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>No hay mercancía pendiente.</td></tr>
                            ) : (
                                ordenes.map((orden) => (
                                    <tr key={orden.id_compra}>
                                        <td style={{ ...styles.td, fontWeight: '700' }}>#{orden.id_compra}</td>
                                        <td style={styles.td}>{orden.id_proveedor_nombre}</td>
                                        <td style={styles.td}>{orden.fecha_pedido}</td>
                                        <td style={styles.td}>
                                            <span style={styles.badge}>{orden.estado_de_envio.replace("_", " ")}</span>
                                        </td>
                                        <td style={{ ...styles.td, display: 'flex', justifyContent: 'center' }}>
                                            <button onClick={() => handleOpenModal(orden)} style={styles.buttonAction}>
                                                <IconBox /> Recibir
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedOrder && (
                <ReceivePurchaseModal
                    compra={selectedOrder}
                    onClose={handleCloseModal}
                    onSuccess={handleReceptionSuccess}
                />
            )}
        </div>
    );
}