// frontend/src/components/AdvancedSearchBar.jsx

import React from 'react';

function AdvancedSearchBar({ 
    searchTerm, 
    onSearchChange, 
    filters = {}, // Objeto con los valores actuales de los filtros
    onFilterChange, // Función para actualizar filtros
    config = {} // Configuración de qué mostrar (showDate, showStatus, etc.)
}) {
    return (
        <div style={containerStyle}>
            {/* 1. BÚSQUEDA DE TEXTO GENERAL */}
            <div style={searchGroupStyle}>
                <span style={{fontSize: '1.2em'}}>🔍</span>
                <input 
                    type="text" 
                    placeholder={config.searchPlaceholder || "Buscar..."} 
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    style={mainInputStyle}
                />
            </div>

            {/* 2. FILTROS DINÁMICOS (Se muestran según la config) */}
            <div style={filtersContainerStyle}>
                
                {/* Rango de Fechas */}
                {config.showDateRange && (
                    <div style={filterItemStyle}>
                        <label style={labelStyle}>Desde:</label>
                        <input 
                            type="date" 
                            value={filters.startDate || ''} 
                            onChange={(e) => onFilterChange('startDate', e.target.value)}
                            style={inputStyle}
                        />
                        <label style={labelStyle}>Hasta:</label>
                        <input 
                            type="date" 
                            value={filters.endDate || ''} 
                            onChange={(e) => onFilterChange('endDate', e.target.value)}
                            style={inputStyle}
                        />
                    </div>
                )}

                {/* Rango de Precios */}
                {config.showPriceRange && (
                    <div style={filterItemStyle}>
                        <input 
                            type="number" 
                            placeholder="Min $" 
                            value={filters.minPrice || ''} 
                            onChange={(e) => onFilterChange('minPrice', e.target.value)}
                            style={shortInputStyle}
                        />
                        <span>-</span>
                        <input 
                            type="number" 
                            placeholder="Max $" 
                            value={filters.maxPrice || ''} 
                            onChange={(e) => onFilterChange('maxPrice', e.target.value)}
                            style={shortInputStyle}
                        />
                    </div>
                )}

                {/* Estado (Dropdown Genérico) */}
                {config.statusOptions && (
                    <div style={filterItemStyle}>
                        <select 
                            value={filters.status || ''} 
                            onChange={(e) => onFilterChange('status', e.target.value)}
                            style={selectStyle}
                        >
                            <option value="">-- Todos los Estados --</option>
                            {config.statusOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Categoría / Método Pago (Dropdown Secundario) */}
                {config.secondaryOptions && (
                    <div style={filterItemStyle}>
                        <select 
                            value={filters.secondary || ''} 
                            onChange={(e) => onFilterChange('secondary', e.target.value)}
                            style={selectStyle}
                        >
                            <option value="">-- {config.secondaryLabel || "Filtrar"} --</option>
                            {config.secondaryOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                )}
                
                {/* Botón Limpiar */}
                <button onClick={() => onFilterChange('CLEAR', null)} style={clearButtonStyle}>
                    Limpiar Filtros
                </button>
            </div>
        </div>
    );
}

// Estilos
const containerStyle = { backgroundColor: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px', border: '1px solid #eee' };
const searchGroupStyle = { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' };
const mainInputStyle = { width: '100%', padding: '10px', fontSize: '1em', borderRadius: '5px', border: '1px solid #ccc' };
const filtersContainerStyle = { display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end' };
const filterItemStyle = { display: 'flex', alignItems: 'center', gap: '5px' };
const labelStyle = { fontSize: '0.85em', color: '#666', fontWeight: 'bold' };
const inputStyle = { padding: '6px', borderRadius: '4px', border: '1px solid #ccc' };
const shortInputStyle = { width: '80px', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' };
const selectStyle = { padding: '7px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '150px' };
const clearButtonStyle = { padding: '7px 15px', backgroundColor: '#607d8b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9em', marginLeft: 'auto' };

export default AdvancedSearchBar;