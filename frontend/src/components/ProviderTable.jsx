// frontend/src/components/ProviderTable.jsx

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdvancedSearchBar from './AdvancedSearchBar';

const PROVEEDORES_URL = '/api/compras/proveedores/';

function ProviderTable({ refreshTrigger, onEditClick }) {
    const [proveedores, setProveedores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchProveedores = useCallback(async () => {
        try {
            const response = await axios.get(PROVEEDORES_URL);
            // Ordenar por ID descendente
            setProveedores(response.data.sort((a, b) => b.id_proveedor - a.id_proveedor));
        } catch (err) {
            console.error("Error cargando proveedores:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProveedores();
    }, [fetchProveedores, refreshTrigger]);

    const handleDelete = async (id, nombre) => {
    if (window.confirm(`¿Estás seguro de eliminar al proveedor "${nombre}"?`)) {
        const loadingToast = toast.loading("Eliminando...");
        
        try {
            await axios.delete(`${PROVEEDORES_URL}${id}/`);
            
            toast.dismiss(loadingToast);
            toast.success("Proveedor eliminado correctamente.");
            fetchProveedores(); // Recargar tabla
            
        } catch (error) {
            toast.dismiss(loadingToast);
            // Mensaje más amigable para integridad referencial
            toast.error("No se puede eliminar: Este proveedor tiene compras registradas.", { duration: 4000 });
        }
    }
};

    const filteredProviders = proveedores.filter(p => {
        const term = searchTerm.toLowerCase();
        return p.nombre.toLowerCase().includes(term) ||
               (p.correo && p.correo.toLowerCase().includes(term)) ||
               (p.telefono && p.telefono.includes(term));
    });

    if (loading) return <p>Cargando proveedores...</p>;

    return (
        <div>
            <AdvancedSearchBar 
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onFilterChange={(k, v) => setSearchTerm('')} // Solo limpiar
                config={{
                    searchPlaceholder: "Nombre, Correo o Teléfono...",
                    // Sin filtros extra, solo texto
                }}
            />

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f2f2f2' }}>
                        <th style={thStyle}>ID</th>
                        <th style={thStyle}>Nombre</th>
                        <th style={thStyle}>Dirección</th>
                        <th style={thStyle}>Correo</th>
                        <th style={thStyle}>Teléfono</th>
                        <th style={thStyle}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredProviders.map((prov) => (
                        <tr key={prov.id_proveedor} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={tdStyle}>{prov.id_proveedor}</td>
                            <td style={tdStyle}>**{prov.nombre}**</td>
                            <td style={tdStyle}>{prov.direccion || '-'}</td>
                            <td style={tdStyle}>{prov.correo || '-'}</td>
                            <td style={tdStyle}>{prov.telefono || '-'}</td>
                            <td style={tdStyle}>
                                <button onClick={() => onEditClick(prov)} style={editBtnStyle}>Editar</button>
                                <button onClick={() => handleDelete(prov.id_proveedor, prov.nombre)} style={deleteBtnStyle}>Eliminar</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Estilos
const thStyle = { border: '1px solid #ddd', padding: '10px', textAlign: 'left' };
const tdStyle = { border: '1px solid #ddd', padding: '8px' };
const editBtnStyle = { padding: '5px 10px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '5px' };
const deleteBtnStyle = { padding: '5px 10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' };

export default ProviderTable;