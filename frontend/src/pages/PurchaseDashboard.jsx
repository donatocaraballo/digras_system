// frontend/src/pages/PurchaseDashboard.jsx

import React, { useState } from 'react';
// Importamos el nuevo Modal y el componente de la tabla de historial
import CreatePurchaseModal from '../components/CreatePurchaseModal';
import PurchaseHistoryTable from '../components/PurchaseHistoryTable';
import EditCompraModal from '../components/EditCompraModal';

function PurchaseDashboard({ refreshTrigger, onUpdate, testIds }) {
    const [isModalOpen, setIsModalOpen] = useState(false); // Estado para abrir/cerrar el modal
    const [compraToEdit, setCompraToEdit] = useState(null); 

    // Función para manejar el clic en 'Editar' en la tabla
    const handleEditClick = (compra) => {
        setCompraToEdit(compra);
    };

    // Función para cerrar el modal y recargar la lista
    const handleModalSave = () => {
        setCompraToEdit(null); // Cierra el modal de edición
        onUpdate(); // Recarga la lista de compras y el dashboard
    };

    return (
        <div>
            <h2>🛒 Gestión de Órdenes de Compra</h2>
            
            {/* 🚨 EL BOTÓN DE CREACIÓN QUE ABRE EL MODAL 🚨 */}
            <button 
                onClick={() => setIsModalOpen(true)}
                style={createButtonStyle}
            >
                + Crear Nueva Orden de Compra
            </button>
            
            {/* Modal de Creación Condicional */}
            <CreatePurchaseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onUpdate={onUpdate}
                userId={testIds.userId}
                providerId={testIds.providerId}
            />

            {compraToEdit && (
                <EditCompraModal 
                    compra={compraToEdit} 
                    onClose={() => setCompraToEdit(null)} 
                    onSave={handleModalSave} 
                />
            )}

            <hr style={{margin: '40px 0'}} />

            <PurchaseHistoryTable 
                refreshTrigger={refreshTrigger} 
                onUpdate={onUpdate} 
                onEditClick={handleEditClick}
            />
        </div>
    );
}

const createButtonStyle = { 
    padding: '15px 25px', 
    backgroundColor: '#007bff', 
    color: 'white', 
    border: 'none', 
    borderRadius: '5px', 
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1.1em',
    marginBottom: '20px'
};

export default PurchaseDashboard;