// frontend/src/pages/ProviderDashboard.jsx

import React, { useState } from 'react';
import ProviderTable from '../components/ProviderTable';
import CreateProveedorModal from '../components/CreateProveedorModal'; 
import EditProviderModal from '../components/EditProviderModal';

// --- ICONOS SVG ---
const IconTruck = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>;
const IconPlus = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;

function ProviderDashboard() {
    const [refreshKey, setRefreshKey] = useState(0);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [providerToEdit, setProviderToEdit] = useState(null);

    const handleRefresh = () => setRefreshKey(prev => prev + 1);

    const handleCreateSuccess = () => {
        handleRefresh();
        setIsCreateModalOpen(false); 
    };

    return (
        <div style={styles.container}>
            
            {/* HEADER DASHBOARD */}
            <div style={styles.header}>
                <div style={styles.titleGroup}>
                    <div style={styles.iconCircle}>
                        <IconTruck />
                    </div>
                    <div>
                        <h2 style={styles.title}>Gestión de Proveedores</h2>
                        <p style={styles.subtitle}>Directorio de socios comerciales y logística.</p>
                    </div>
                </div>

                <button 
                    onClick={() => setIsCreateModalOpen(true)} 
                    style={styles.createBtn}
                >
                    <IconPlus /> Nuevo Proveedor
                </button>
            </div>

            {/* AREA DE CONTENIDO (Tabla) */}
            <div style={styles.content}>
                <ProviderTable 
                    refreshTrigger={refreshKey} 
                    onEditClick={(prov) => setProviderToEdit(prov)}
                />
            </div>

            {/* MODALES */}
            <CreateProveedorModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onProveedorCreated={handleCreateSuccess} 
            />

            {providerToEdit && (
                <EditProviderModal 
                    provider={providerToEdit}
                    onClose={() => setProviderToEdit(null)}
                    onSave={() => {
                        setProviderToEdit(null);
                        handleRefresh();
                    }}
                />
            )}
        </div>
    );
}

// --- ESTILOS MODERNOS (Premium UI) ---
const styles = {
    container: { 
        padding: '24px 32px', 
        maxWidth: '1400px', 
        margin: '0 auto', 
        fontFamily: "'Inter', sans-serif",
        animation: 'fadeIn 0.6s ease-out'
    },
    
    // Header Section
    header: { 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '32px' 
    },
    titleGroup: { 
        display: 'flex', 
        alignItems: 'center', 
        gap: '16px' 
    },
    iconCircle: { 
        width: '52px', 
        height: '52px', 
        borderRadius: '14px', 
        backgroundColor: '#f3e8ff', // Lila suave
        color: '#7e22ce', // Púrpura fuerte
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        boxShadow: '0 4px 10px rgba(126, 34, 206, 0.15)'
    },
    title: { 
        margin: 0, 
        fontSize: '1.75rem', 
        color: '#0f172a', 
        fontWeight: '800',
        letterSpacing: '-0.5px'
    },
    subtitle: { 
        margin: '4px 0 0', 
        color: '#64748b', 
        fontSize: '0.95rem',
        fontWeight: '500'
    },
    
    // Botón de Acción
    createBtn: {
        backgroundColor: '#7e22ce', // Púrpura vibrante
        color: 'white', 
        border: 'none',
        padding: '12px 24px', 
        borderRadius: '12px', 
        fontSize: '0.95rem', 
        fontWeight: '700',
        cursor: 'pointer', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        boxShadow: '0 4px 12px rgba(126, 34, 206, 0.25)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    },

    // Contenedor Blanco (Card)
    content: { 
        backgroundColor: '#ffffff', 
        borderRadius: '20px', 
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)', 
        overflow: 'hidden', 
        border: '1px solid #f1f5f9',
        padding: '24px' // Espacio interno para la tabla
    }
};

// Inyectamos animación simple para suavidad
const styleSheet = document.createElement("style");
styleSheet.innerText = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    button:active { transform: scale(0.98); }
`;
document.head.appendChild(styleSheet);

export default ProviderDashboard;