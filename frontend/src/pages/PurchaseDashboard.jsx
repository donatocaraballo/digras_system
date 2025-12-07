// frontend/src/pages/PurchaseDashboard.jsx

import React, { useState } from 'react';
import CreatePurchaseModal from '../components/CreatePurchaseModal';
import PurchaseHistoryTable from '../components/PurchaseHistoryTable';
import EditCompraModal from '../components/EditCompraModal';

// --- ICONOS SVG ---
const IconCart = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>;
const IconPlus = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;

function PurchaseDashboard({ refreshTrigger, onUpdate, testIds }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [compraToEdit, setCompraToEdit] = useState(null); 

    const handleEditClick = (compra) => setCompraToEdit(compra);

    const handleModalSave = () => {
        setCompraToEdit(null); 
        onUpdate(); 
    };

    return (
        <div style={styles.container}>
            {/* HEADER DASHBOARD */}
            <div style={styles.header}>
                <div style={styles.titleGroup}>
                    <div style={styles.iconCircle}><IconCart /></div>
                    <div>
                        <h2 style={styles.title}>Gestión de Compras</h2>
                        <p style={styles.subtitle}>Control de abastecimiento y proveedores</p>
                    </div>
                </div>
                
                <button 
                    onClick={() => setIsModalOpen(true)}
                    style={styles.createBtn}
                >
                    <IconPlus /> Nueva Orden
                </button>
            </div>

            {/* AREA DE CONTENIDO */}
            <div style={styles.content}>
                <PurchaseHistoryTable 
                    refreshTrigger={refreshTrigger} 
                    onUpdate={onUpdate} 
                    onEditClick={handleEditClick}
                />
            </div>

            {/* MODALES */}
            <CreatePurchaseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onUpdate={onUpdate}
                userId={testIds.userId}
            />

            {compraToEdit && (
                <EditCompraModal 
                    compra={compraToEdit} 
                    onClose={() => setCompraToEdit(null)} 
                    onSave={handleModalSave} 
                />
            )}
        </div>
    );
}

// ESTILOS MODERNOS
const styles = {
    container: { padding: '24px 32px', maxWidth: '1400px', margin: '0 auto', fontFamily: "'Inter', sans-serif" },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
    titleGroup: { display: 'flex', alignItems: 'center', gap: '16px' },
    iconCircle: { width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    title: { margin: 0, fontSize: '1.5rem', color: '#0f172a', fontWeight: '700' },
    subtitle: { margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' },
    createBtn: {
        backgroundColor: '#0f172a', color: 'white', border: 'none',
        padding: '12px 20px', borderRadius: '10px', fontSize: '0.95rem', fontWeight: '600',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        transition: 'transform 0.1s ease'
    },
    content: { backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', overflow: 'hidden', border: '1px solid #f1f5f9' }
};

export default PurchaseDashboard;