// frontend/src/components/AdvancedSearchBar.jsx

import React, { useState } from 'react';

// --- ICONOS SVG (Estilo Minimalista) ---
const IconSearch = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:'#94a3b8'}}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const IconCalendar = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:'#64748b'}}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const IconDollar = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:'#64748b'}}><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
const IconFilter = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:'#64748b'}}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>;
const IconX = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

function AdvancedSearchBar({ 
    searchTerm, 
    onSearchChange, 
    filters = {}, 
    onFilterChange, 
    config = {} 
}) {
    const [isFocused, setIsFocused] = useState(false);

    // Detectar si hay filtros activos para resaltar el botón de limpiar
    const hasActiveFilters = filters.startDate || filters.endDate || filters.minPrice || filters.maxPrice || filters.status || filters.secondary;

    return (
        <div style={styles.container}>
            
            {/* 1. BARRA PRINCIPAL DE BÚSQUEDA */}
            <div style={{...styles.searchWrapper, ...(isFocused ? styles.searchWrapperFocus : {})}}>
                <div style={styles.iconContainer}><IconSearch /></div>
                <input 
                    type="text" 
                    placeholder={config.searchPlaceholder || "Buscar..."} 
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    style={styles.mainInput}
                />
                {searchTerm && (
                    <button onClick={() => onSearchChange('')} style={styles.clearTextBtn} title="Borrar texto">
                        <IconX />
                    </button>
                )}
            </div>

            {/* 2. AREA DE FILTROS (Grid Responsive) */}
            <div style={styles.filtersGrid}>
                
                {/* Rango de Fechas */}
                {config.showDateRange && (
                    <div style={styles.filterGroup}>
                        <div style={styles.labelGroup}><IconCalendar /><span style={styles.labelText}>Fecha</span></div>
                        <div style={styles.row}>
                            <input 
                                type="date" 
                                value={filters.startDate || ''} 
                                onChange={(e) => onFilterChange('startDate', e.target.value)}
                                style={styles.input}
                                title="Desde"
                            />
                            <span style={{color:'#cbd5e1'}}>-</span>
                            <input 
                                type="date" 
                                value={filters.endDate || ''} 
                                onChange={(e) => onFilterChange('endDate', e.target.value)}
                                style={styles.input}
                                title="Hasta"
                            />
                        </div>
                    </div>
                )}

                {/* Rango de Precios */}
                {config.showPriceRange && (
                    <div style={styles.filterGroup}>
                        <div style={styles.labelGroup}><IconDollar /><span style={styles.labelText}>Rango Precio</span></div>
                        <div style={styles.row}>
                            <input 
                                type="number" 
                                placeholder="Min" 
                                value={filters.minPrice || ''} 
                                onChange={(e) => onFilterChange('minPrice', e.target.value)}
                                style={styles.inputSmall}
                            />
                            <span style={{color:'#cbd5e1'}}>-</span>
                            <input 
                                type="number" 
                                placeholder="Max" 
                                value={filters.maxPrice || ''} 
                                onChange={(e) => onFilterChange('maxPrice', e.target.value)}
                                style={styles.inputSmall}
                            />
                        </div>
                    </div>
                )}

                {/* Dropdowns (Estado / Secundario) */}
                {(config.statusOptions || config.secondaryOptions) && (
                    <div style={styles.filterGroup}>
                        <div style={styles.labelGroup}><IconFilter /><span style={styles.labelText}>Filtros</span></div>
                        <div style={styles.row}>
                            {config.statusOptions && (
                                <select 
                                    value={filters.status || ''} 
                                    onChange={(e) => onFilterChange('status', e.target.value)}
                                    style={styles.select}
                                >
                                    <option value="">Estado: Todos</option>
                                    {config.statusOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            )}

                            {config.secondaryOptions && (
                                <select 
                                    value={filters.secondary || ''} 
                                    onChange={(e) => onFilterChange('secondary', e.target.value)}
                                    style={styles.select}
                                >
                                    <option value="">{config.secondaryLabel || "Otros"}: Todos</option>
                                    {config.secondaryOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>
                )}

                {/* Botón de Limpiar Global */}
                <div style={{...styles.filterGroup, justifyContent: 'flex-end', flex: 1}}>
                    {hasActiveFilters && (
                        <button onClick={() => onFilterChange('CLEAR', null)} style={styles.resetBtn}>
                            <IconX /> Limpiar Filtros
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- ESTILOS MODERNOS (CSS-in-JS) ---
const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
    },
    
    // Barra de Búsqueda Principal (Estilo Cápsula/Floating)
    searchWrapper: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '6px 16px',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        transition: 'all 0.2s ease',
        maxWidth: '100%'
    },
    searchWrapperFocus: {
        borderColor: '#3b82f6',
        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
    },
    iconContainer: {
        display: 'flex',
        alignItems: 'center',
        paddingRight: '12px'
    },
    mainInput: {
        flex: 1,
        border: 'none',
        outline: 'none',
        fontSize: '1rem',
        color: '#1e293b',
        padding: '10px 0',
        backgroundColor: 'transparent'
    },
    clearTextBtn: {
        background: '#f1f5f9',
        border: 'none',
        borderRadius: '50%',
        width: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: '#64748b',
        marginLeft: '10px'
    },

    // Grid de Filtros
    filtersGrid: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '24px',
        alignItems: 'flex-end',
        paddingTop: '10px'
    },
    filterGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    labelGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
    },
    labelText: {
        fontSize: '0.75rem',
        fontWeight: '700',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
    },
    row: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    },

    // Inputs de Filtros (Estilo Filled Moderno)
    input: {
        backgroundColor: '#f8fafc',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        padding: '8px 12px',
        fontSize: '0.9rem',
        color: '#334155',
        outline: 'none',
        transition: 'all 0.2s',
        cursor: 'pointer'
    },
    inputSmall: {
        width: '80px',
        backgroundColor: '#f8fafc',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        padding: '8px 10px',
        fontSize: '0.9rem',
        outline: 'none',
        textAlign: 'center'
    },
    select: {
        backgroundColor: '#f8fafc',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        padding: '8px 12px',
        fontSize: '0.9rem',
        color: '#334155',
        outline: 'none',
        minWidth: '160px',
        cursor: 'pointer',
        appearance: 'none', // Quita el estilo nativo feo
        backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right .7em top 50%',
        backgroundSize: '.65em auto',
        paddingRight: '2em'
    },

    // Botón Reset
    resetBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: '#fff1f2',
        color: '#e11d48',
        border: '1px solid #fecdd3',
        borderRadius: '8px',
        padding: '8px 16px',
        fontSize: '0.85rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s',
        height: '38px' // Para alinear con inputs
    }
};

export default AdvancedSearchBar;