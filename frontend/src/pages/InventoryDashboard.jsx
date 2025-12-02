// frontend/src/pages/InventoryDashboard.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import CreateProductForm from '../components/CreateProductForm'; // El componente ahora es un Modal
import AdvancedSearchBar from '../components/AdvancedSearchBar';

const PRODUCTOS_URL = '/api/inventario/productos/';
const EXISTENCIAS_URL = '/api/inventario/existencias/';

function InventoryDashboard({ refreshTrigger, onUpdate }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- ESTADOS DE FILTRO ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ minPrice: '', maxPrice: '', status: '' });
    
    // Estado para controlar el modal
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Obtener la lista de existencias (stock, estado)
                const stockResponse = await axios.get(EXISTENCIAS_URL);
                const stockMap = new Map(stockResponse.data.map(s => [s.id_producto, s]));

                // 2. Obtener la lista de productos (nombre, precio, marca, etc)
                const productResponse = await axios.get(PRODUCTOS_URL);
                
                // 3. Consolidar los datos
                const consolidatedData = productResponse.data.map(p => {
                    const stock = stockMap.get(p.id_producto);
                    return {
                        ...p,
                        current_stock: stock ? stock.cantidad : 0,
                        stock_status: stock ? stock.estado : 'AGOTADO',
                        // Acceso a datos anidados (manejo de nulos seguro)
                        marca: p.id_marca_nombre || '-', 
                        categoria: p.id_categoria_nombre || '-'
                    };
                });
                
                setProducts(consolidatedData);
            } catch (err) {
                setError(`Error de conexión al Inventario: ${err.message}.`);
                console.error("Fallo al cargar Inventario:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [refreshTrigger]);

    const handleFilterChange = (key, value) => {
        if (key === 'CLEAR') {
            setSearchTerm('');
            setFilters({ minPrice: '', maxPrice: '', status: '' });
        } else {
            setFilters(prev => ({ ...prev, [key]: value }));
        }
    };

    const filteredProducts = products.filter(p => {
        // 1. Texto (Nombre o SKU)
        const matchText = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchTerm.toLowerCase());
        
        // 2. Precio Min/Max
        const price = parseFloat(p.precio_venta);
        const matchMin = filters.minPrice ? price >= parseFloat(filters.minPrice) : true;
        const matchMax = filters.maxPrice ? price <= parseFloat(filters.maxPrice) : true;

        // 3. Estado (Disponible/Agotado)
        const matchStatus = filters.status ? p.stock_status === filters.status : true;

        return matchText && matchMin && matchMax && matchStatus;
    });

    if (loading) return <h3>Cargando Dashboard de Inventario...</h3>;
    if (error) return <p style={{ color: 'red', fontWeight: 'bold' }}>🛑 Error: {error}</p>;

    return (
        <div style={{ padding: '20px' }}>
            {/* ENCABEZADO CON BOTÓN DE ACCIÓN */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h2>📊 Inventario General (Vista Consolidada)</h2>
                    <p style={{ color: '#666', margin: '5px 0 0 0' }}>
                        Listado de productos y existencia actual en el sistema.
                    </p>
                </div>
                
                {/* BOTÓN PARA ABRIR EL MODAL */}
                <button 
                    onClick={() => setIsCreateModalOpen(true)} 
                    style={createBtnStyle}
                >
                    + Nuevo Producto
                </button>
            </div>

            {/* BARRA DE BÚSQUEDA */}
            <AdvancedSearchBar 
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filters={filters}
                onFilterChange={handleFilterChange}
                config={{
                    searchPlaceholder: "Buscar por Nombre o SKU...",
                    showPriceRange: true,
                    statusOptions: [
                        { value: 'DISPONIBLE', label: 'Disponible' },
                        { value: 'AGOTADO', label: 'Agotado' }
                    ]
                }}
            />
            
            {/* EL FORMULARIO AHORA ES UN MODAL (Controlado por isCreateModalOpen) */}
            <CreateProductForm 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onUpdate={onUpdate}
            /> 

            {/* TABLA DE PRODUCTOS */}
            <table style={tableStyle}>
                <thead>
                    <tr style={headerStyle}>
                        <th style={thStyle}>Producto</th>
                        <th style={thStyle}>Marca / Categoría</th>
                        <th style={thStyle}>Precio Venta</th>
                        <th style={thStyle}>Stock Actual</th>
                        <th style={thStyle}>Estado</th>
                        <th style={thStyle}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredProducts.map(p => (
                        <tr key={p.id_producto} style={rowStyle}>
                            <td style={tdStyle}>
                                <strong>{p.nombre}</strong>
                                <br/>
                                <span style={{fontSize: '0.85em', color: '#777'}}>SKU: {p.sku}</span>
                            </td>
                            <td style={tdStyle}>
                                {p.marca} / {p.categoria}
                            </td>
                            <td style={tdStyle}>${p.precio_venta}</td>
                            <td style={{ ...tdStyle, color: p.current_stock > 0 ? 'green' : 'orange', fontWeight: 'bold', textAlign: 'right' }}>
                                {p.current_stock}
                            </td>
                            <td style={tdStyle}>
                                <span style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    backgroundColor: p.stock_status === 'DISPONIBLE' ? '#e8f5e9' : '#ffebee',
                                    color: p.stock_status === 'DISPONIBLE' ? '#2e7d32' : '#c62828',
                                    fontSize: '0.85em',
                                    fontWeight: 'bold'
                                }}>
                                    {p.stock_status}
                                </span>
                            </td>
                            <td style={tdStyle}>
                                <Link 
                                    to={`/inventario/lotes/${p.id_producto}`}
                                    style={{ textDecoration: 'none', color: '#2196f3', fontWeight: 'bold' }}
                                >
                                    Ver Trazabilidad
                                </Link>
                            </td>
                        </tr>
                    ))}
                    {filteredProducts.length === 0 && (
                        <tr><td colSpan="6" style={{textAlign:'center', padding:'20px'}}>No se encontraron resultados.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

// ----------------------------------------------------
// DEFINICIÓN DE ESTILOS (AQUÍ ESTABA EL ERROR)
// ----------------------------------------------------

const createBtnStyle = {
    padding: '10px 20px',
    backgroundColor: '#009688', // Color "Teal"
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1em',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
};

const tableStyle = { width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' };
const headerStyle = { backgroundColor: '#f4f4f4', borderBottom: '2px solid #ddd' };
const rowStyle = { borderBottom: '1px solid #eee' };
const thStyle = { padding: '12px', textAlign: 'left', color: '#555', borderBottom: '2px solid #ddd' };
const tdStyle = { padding: '10px', borderBottom: '1px solid #eee' };

export default InventoryDashboard;