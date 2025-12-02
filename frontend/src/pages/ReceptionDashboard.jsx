// frontend/src/pages/ReceptionDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReceivePurchaseModal from '../components/ReceivePurchaseModal';

const COMPRAS_URL = '/api/compras/compras/';

function ReceptionDashboard() {
    const [ordenes, setOrdenes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null); // Para el modal

    const fetchOrdenes = async () => {
        setLoading(true);
        try {
            const response = await axios.get(COMPRAS_URL);
            // FILTRO DE NEGOCIO: Solo mostrar las que el Almacenista puede recibir
            const pendientes = response.data.filter(
                c => c.estado_de_envio === 'APROBADA'
            );
            setOrdenes(pendientes);
        } catch (error) {
            console.error("Error cargando órdenes:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrdenes();
    }, []);

    return (
        <div>
            <h2 style={{ borderBottom: '4px solid #ffc107', paddingBottom: '10px' }}>📦 Dashboard de Recepción (Almacén)</h2>
            <p>Solo se muestran órdenes Aprobadas esperando ingreso.</p>

            {loading ? <p>Cargando...</p> : (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#333', color: 'white' }}>
                            <th style={thStyle}>Orden #</th>
                            <th style={thStyle}>Proveedor</th>
                            <th style={thStyle}>Fecha Llegada (Pedido)</th>
                            <th style={thStyle}>Estado</th>
                            <th style={thStyle}>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ordenes.length === 0 ? (
                            <tr><td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>No hay mercancía pendiente de recepción.</td></tr>
                        ) : (
                            ordenes.map(orden => (
                                <tr key={orden.id_compra} style={{ borderBottom: '1px solid #ddd' }}>
                                    <td style={tdStyle}>{orden.id_compra}</td>
                                    <td style={tdStyle}>{orden.id_proveedor_nombre}</td>
                                    <td style={tdStyle}>{orden.fecha_pedido}</td>
                                    <td style={tdStyle}>
                                        <span style={badgeStyle}>{orden.estado_de_envio.replace('_', ' ')}</span>
                                    </td>
                                    <td style={tdStyle}>
                                        <button 
                                            onClick={() => setSelectedOrder(orden)}
                                            style={btnReceiveStyle}
                                        >
                                            📥 Recibir Compra
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
                    onClose={() => setSelectedOrder(null)}
                    onSuccess={fetchOrdenes} // Recargar la lista al terminar
                />
            )}
        </div>
    );
}

// Estilos
const thStyle = { padding: '12px', textAlign: 'left' };
const tdStyle = { padding: '12px' };
const badgeStyle = { backgroundColor: '#e0f7fa', color: '#006064', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85em', fontWeight: 'bold' };
const btnReceiveStyle = { backgroundColor: '#ffc107', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', color: '#333' };

export default ReceptionDashboard;