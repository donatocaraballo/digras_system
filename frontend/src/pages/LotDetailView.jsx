// frontend/src/pages/LotDetailView.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import AdvancedSearchBar from '../components/AdvancedSearchBar'; // Importar Buscador
import QrLabelModal from '../components/QrLabelModal';

const LOTES_URL = '/api/inventario/lotes/';

function LotDetailView() {
    const { productId } = useParams(); 
    const [lotes, setLotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [productName, setProductName] = useState(`Producto ID ${productId}`);
    const [selectedLoteForQr, setSelectedLoteForQr] = useState(null);
    
    // Estados de filtro
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ startDate: '', endDate: '', status: '' });

    useEffect(() => {
        const fetchLotes = async () => {
            try {
                const response = await axios.get(`${LOTES_URL}?id_producto=${productId}`);
                setLotes(response.data.sort((a, b) => b.id_lote - a.id_lote));
                if (response.data.length > 0) setProductName(response.data[0].id_producto_nombre);
            } catch (err) {
                setError(`Error: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };
        fetchLotes();
    }, [productId]);

    // --- LÓGICA DE FILTRADO LOCAL ---
    const handleFilterChange = (key, value) => {
        if (key === 'CLEAR') {
            setSearchTerm('');
            setFilters({ startDate: '', endDate: '', status: '' });
        } else {
            setFilters(prev => ({ ...prev, [key]: value }));
        }
    };

    const filteredLotes = lotes.filter(lote => {
        // 1. Texto (N° Lote)
        const matchText = lote.numero_lote.toLowerCase().includes(searchTerm.toLowerCase());
        
        // 2. Estado
        const matchStatus = filters.status ? lote.estado === filters.status : true;
        
        // 3. Fecha Vencimiento
        const expDate = lote.fecha_vencimiento ? new Date(lote.fecha_vencimiento) : null;
        const start = filters.startDate ? new Date(filters.startDate) : null;
        const end = filters.endDate ? new Date(filters.endDate) : null;
        
        // Si filtra por fecha, solo mostrar los que tienen fecha
        let matchDate = true;
        if (start || end) {
            if (!expDate) return false; 
            matchDate = (!start || expDate >= start) && (!end || expDate <= end);
        }

        return matchText && matchStatus && matchDate;
    });

    if (loading) return <h3>Cargando...</h3>;
    if (error) return <p style={{ color: 'red' }}>🛑 {error}</p>;

    return (
        <div style={{ padding: '20px' }}>
            <h2>🔢 Trazabilidad de Lotes: {productName}</h2>
            
            {/* BARRA DE BÚSQUEDA */}
            <AdvancedSearchBar 
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filters={filters}
                onFilterChange={handleFilterChange}
                config={{
                    searchPlaceholder: "Buscar por N° Lote...",
                    showDateRange: true, // Para filtrar por vencimiento
                    statusOptions: [
                        { value: 'ACTIVO', label: 'Activo' },
                        { value: 'VENCIDO', label: 'Vencido' },
                        { value: 'AGOTADO', label: 'Agotado' }
                    ]
                }}
            />

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f9f9f9' }}>
                        <th style={thStyle}>N° Lote</th>
                        <th style={thStyle}>Cant. Actual</th>
                        <th style={thStyle}>Ingreso</th>
                        <th style={thStyle}>Vencimiento</th>
                        <th style={thStyle}>Estado</th>
                        <th style={thStyle}>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredLotes.map((lote) => (
                        <tr key={lote.id_lote} style={{ borderBottom: '1px solid #eee', backgroundColor: lote.estado === 'VENCIDO' ? '#ffebee' : 'white' }}>
                            <td style={tdStyle}>{lote.numero_lote}</td>
                            <td style={{ ...tdStyle, fontWeight: 'bold' }}>{lote.cantidad}</td>
                            <td style={tdStyle}>{lote.fecha_pedido}</td>
                            <td style={{ ...tdStyle, color: lote.fecha_vencimiento ? 'black' : '#999' }}>
                                {lote.fecha_vencimiento || 'N/A'}
                            </td>
                            <td style={{ ...tdStyle, fontWeight: 'bold', color: lote.estado === 'ACTIVO' ? 'green' : 'red' }}>
                                {lote.estado}
                            </td>
                            <td style={tdStyle}>
                                <button 
                                    onClick={() => setSelectedLoteForQr(lote)}
                                    style={{
                                        padding: '5px 10px', border: '1px solid #333', 
                                        background: 'white', borderRadius: '4px', cursor: 'pointer'
                                    }}
                                    title="Generar Etiqueta QR"
                                >
                                    🏷️ QR
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {/* MODAL DE ETIQUETA */}
            {selectedLoteForQr && (
                <QrLabelModal 
                    lote={selectedLoteForQr} 
                    productName={productName}
                    onClose={() => setSelectedLoteForQr(null)} 
                />
            )}
            <Link to="/inventario" style={{ display: 'block', marginTop: '20px' }}>← Volver</Link>
        </div>
    );
}

const thStyle = { border: '1px solid #ddd', padding: '8px', textAlign: 'left' };
const tdStyle = { border: '1px solid #ddd', padding: '8px' };

export default LotDetailView;