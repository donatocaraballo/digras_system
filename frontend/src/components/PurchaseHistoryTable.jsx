// frontend/src/components/PurchaseHistoryTable.jsx

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdvancedSearchBar from './AdvancedSearchBar';

const COMPRAS_URL = '/api/compras/compras/';

function PurchaseHistoryTable({ refreshTrigger, onUpdate, onEditClick }) {
    const [compras, setCompras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- ESTADOS DE FILTRO ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ startDate: '', endDate: '', status: '', secondary: '' });

    const fetchCompras = useCallback(async () => {
        try {
            const response = await axios.get(COMPRAS_URL);
            // Ordena por el ID de compra más reciente
            const sortedData = response.data.sort((a, b) => b.id_compra - a.id_compra);
            setCompras(sortedData);
        } catch (err) {
            setError(`Error al cargar el historial de compras: ${err.message}.`);
            console.error("Fallo al obtener historial de compras:", err);
        } finally {
            setLoading(false);
        }
    }, [refreshTrigger]);

    useEffect(() => {
        fetchCompras();
    }, [fetchCompras]);

    const getStatusColor = (estado) => {
        switch (estado) {
            case 'RECIBIDA_COMPLETA':
                return 'green';
            case 'APROBADA':
                return 'blue';
            case 'PENDIENTE':
            case 'PENDIENTE_APROBACION':
                return 'orange';
            default:
                return 'grey';
        }
    };

    // --- LÓGICA DE FILTRADO ---
    const handleFilterChange = (key, value) => {
        if (key === 'CLEAR') {
            setSearchTerm('');
            setFilters({ startDate: '', endDate: '', status: '', secondary: '' });
        } else {
            setFilters(prev => ({ ...prev, [key]: value }));
        }
    };

    const filteredCompras = compras.filter(c => {
        // 1. Texto (ID o Proveedor)
        const matchText = c.id_compra.toString().includes(searchTerm) || 
                          c.id_proveedor_nombre.toLowerCase().includes(searchTerm.toLowerCase());
        
        // 2. Fechas
        const date = new Date(c.fecha_pedido);
        const start = filters.startDate ? new Date(filters.startDate) : null;
        const end = filters.endDate ? new Date(filters.endDate) : null;
        const matchDate = (!start || date >= start) && (!end || date <= end);

        // 3. Estado Envío
        const matchStatus = filters.status ? c.estado_de_envio === filters.status : true;
        
        // 4. Método Pago
        const matchPay = filters.secondary ? c.metodo_pago === filters.secondary : true;

        return matchText && matchDate && matchStatus && matchPay;
    });
    
    // Función D (DELETE): Eliminar una compra
    const handleDelete = async (compraId) => {
        if (window.confirm(`¿Estás seguro de eliminar la Compra N°${compraId}? Esta acción NO se puede deshacer y puede afectar el stock si no hay lógica de egreso de lotes.`)) {
            try {
                // DELETE: /api/compras/compras/ID/
                await axios.delete(`${COMPRAS_URL}${compraId}/`);
                
                // Si llega aquí, la eliminación fue exitosa
                alert(`✅ Compra N°${compraId} eliminada exitosamente.`);
                
                onUpdate(); // Refresca la lista
            } catch (error) {
                // 🚨 CORRECCIÓN DE UX: Capturar el error y mostrar el mensaje específico
                let errorMessage = "Error al eliminar compra. Revisa la consola.";
                
                if (error.response) {
                    const status = error.response.status;
                    const detail = error.response.data.detail || JSON.stringify(error.response.data);

                    if (status === 403) {
                        // Captura el mensaje de restricción de Django (Recibida, no editable)
                        errorMessage = detail;
                        alert(`❌ RESTRICCIÓN DE NEGOCIO (403 Forbidden):\n\n${errorMessage}`);
                    } else {
                        errorMessage = `Error ${status}: ${detail}`;
                        alert(`❌ Error del servidor:\n${errorMessage}`);
                    }
                }
                
                console.error("Error DELETE:", error.response || error);
            }
        }
    };
    
    // Función U (UPDATE): Iniciar la edición
    const handleEdit = (compra) => {
         // Llama a la función que abre el modal en PurchaseDashboard.jsx
         onEditClick(compra);
    };

    if (loading) return <p>Cargando Historial de Compras...</p>;
    if (error) return <p style={{ color: 'red' }}>🛑 Error: {error}</p>;

    const isReceived = compras.estado_de_envio === 'RECIBIDA_COMPLETA' || compras.estado_de_pago === 'RECIBIDA_PARCIAL';

    return (
        <div style={{ padding: '20px', margin: '20px', border: '1px solid #000' }}>
            <h2>📋 Historial de Órdenes de Compra</h2>

            {/* BARRA DE BÚSQUEDA */}
            <AdvancedSearchBar 
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filters={filters}
                onFilterChange={handleFilterChange}
                config={{
                    searchPlaceholder: "Buscar por ID o Proveedor...",
                    showDateRange: true,
                    statusOptions: [
                        { value: 'PENDIENTE_APROBACION', label: 'Pendiente Aprobación' },
                        { value: 'APROBADA', label: 'Aprobada' },
                        { value: 'RECIBIDA_COMPLETA', label: 'Recibida completa' },
                        { value: 'RECIBIDA_PARCIAL', label: 'Recibida parcial' },
                        { value: 'CANCELADA', label: 'Cancelada' }
                    ],
                    secondaryLabel: "Método Pago",
                    secondaryOptions: [
                        { value: 'TRANSFERENCIA_BS', label: 'Transf. Bs' },
                        { value: 'PAGO_MOVIL', label: 'Pago Móvil' },
                        { value: 'TRANSFERENCIA_USD', label: 'Transf. USD' },
                        { value: 'EFECTIVO_USD', label: 'Efectivo USD' }
                    ]
                }}
            />

            <p style={{ marginBottom: '15px' }}>Resultados: **{filteredCompras.length}**</p>

            <p style={{ marginBottom: '15px' }}>Total de Órdenes procesadas: **{compras.length}**</p>
            <table style={tableStyle}>
                <thead>
                    <tr style={headerStyle}>
                        <th style={tableHeaderStyle}>ID Compra</th><th style={tableHeaderStyle}>Proveedor</th><th style={tableHeaderStyle}>Fecha Pedido</th><th style={tableHeaderStyle}>Precio Final</th><th style={tableHeaderStyle}>Estado Envío</th><th style={tableHeaderStyle}>Estado Pago</th><th style={tableHeaderStyle}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredCompras.map((compra) => (
                        <tr key={compra.id_compra}>
                            <td style={tableCellStyle}>{compra.id_compra}</td>
                            <td style={tableCellStyle}>{compra.id_proveedor_nombre}</td>
                            <td style={tableCellStyle}>{compra.fecha_pedido}</td>
                            <td style={tableCellStyle}>${compra.precio_final}</td>
                            <td style={{ ...tableCellStyle, color: getStatusColor(compra.estado_de_envio), fontWeight: 'bold' }}>
                                {compra.estado_de_envio.replace('_', ' ')}
                            </td>
                            <td style={{ ...tableCellStyle, color: getStatusColor(compra.estado_de_pago), fontWeight: 'bold' }}>
                                {compra.estado_de_pago}
                            </td>
                            <td style={tableCellStyle}>
                                <button onClick={() => handleEdit(compra)} style={editButtonStyle} disabled={isReceived}>Editar</button>
                                <button onClick={() => handleDelete(compra.id_compra)} style={deleteButtonStyle} disabled={isReceived}>Eliminar</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ----------------------------------------------------
// DEFINICIÓN DE ESTILOS (RESUELVE EL REFERENCE ERROR)
// ----------------------------------------------------

const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const tableHeaderStyle = { border: '1px solid #ddd', padding: '8px', textAlign: 'left' };
const headerStyle = { backgroundColor: '#f2f2f2' };
const tableCellStyle = { border: '1px solid #ddd', padding: '8px' };

const editButtonStyle = { 
    padding: '5px 10px', 
    backgroundColor: '#2196f3', 
    color: 'white', 
    border: 'none', 
    cursor: 'pointer', 
    marginRight: '5px',
    borderRadius: '3px',
    fontSize: '0.9em'
};
const deleteButtonStyle = { 
    padding: '5px 10px', 
    backgroundColor: '#f44336', 
    color: 'white', 
    border: 'none', 
    cursor: 'pointer',
    borderRadius: '3px',
    fontSize: '0.9em'
};

export default PurchaseHistoryTable;