// frontend/src/pages/ProviderDashboard.jsx

import React, { useState } from 'react';
import ProviderTable from '../components/ProviderTable';
// Reutilizamos el modal de crear que ya tenías para el flujo de compras
import CreateProveedorModal from '../components/CreateProveedorModal'; 
import EditProviderModal from '../components/EditProviderModal';

function ProviderDashboard() {
    const [refreshKey, setRefreshKey] = useState(0);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [providerToEdit, setProviderToEdit] = useState(null);

    const handleRefresh = () => setRefreshKey(prev => prev + 1);

    // Este handler es llamado por el CreateModal cuando termina
    const handleCreateSuccess = () => {
        handleRefresh();
        setIsCreateModalOpen(false); // El modal se cierra solo, pero aseguramos estado
    };

    return (
        <div>
            <h2>📇 Gestión de Proveedores</h2>
            <p>Administración de la base de datos de proveedores.</p>

            <button onClick={() => setIsCreateModalOpen(true)} style={createBtnStyle}>
                + Registrar Nuevo Proveedor
            </button>

            {/* Tabla de Proveedores */}
            <ProviderTable 
                refreshTrigger={refreshKey} 
                onEditClick={(prov) => setProviderToEdit(prov)}
            />

            {/* Modal de Creación */}
            <CreateProveedorModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onProveedorCreated={handleCreateSuccess} 
            />

            {/* Modal de Edición */}
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

const createBtnStyle = { 
    padding: '10px 20px', 
    backgroundColor: '#673AB7', 
    color: 'white', 
    border: 'none', 
    borderRadius: '5px', 
    cursor: 'pointer', 
    fontWeight: 'bold',
    fontSize: '1em'
};

export default ProviderDashboard;