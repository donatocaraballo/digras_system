// frontend/src/App.jsx
import React, { useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/NavBar';
import ReceptionDashboard from './pages/ReceptionDashboard';
import ProviderDashboard from './pages/ProviderDashboard';

// Importamos las Páginas/Dashboards que crearemos
import InventoryDashboard from './pages/InventoryDashboard';
import PurchaseDashboard from './pages/PurchaseDashboard';
import LotDetailView from './pages/LotDetailView';

// IDs fijos para pruebas
const TEST_IDS = {
    productId: 1, 
    userId: 1, 
    providerId: 1
};

function App() {
    const [refreshKey, setRefreshKey] = useState(0);

    const handleUpdate = useCallback(() => {
        setRefreshKey(prevKey => prevKey + 1);
    }, []);

    return (
        <Router>
            <Navbar />
            <main style={{ padding: '0 20px' }}>
                <Routes>
                    <Route path="/" element={<Navigate to="/inventario" />} />

                    {/* PUNTO 1 & 3 (Admin Product Creation) */}
                    <Route 
                        path="/inventario" 
                        element={<InventoryDashboard 
                            refreshTrigger={refreshKey} 
                            onUpdate={handleUpdate}
                            testIds={TEST_IDS}
                        />} 
                    />

                    {/* PUNTO 2 (Trazabilidad) */}
                    <Route 
                        path="/inventario/lotes/:productId" 
                        element={<LotDetailView />} 
                    />

                    {/* PUNTO 3 (Compras y Workflow) */}
                    <Route 
                        path="/compras" 
                        element={<PurchaseDashboard 
                            refreshTrigger={refreshKey} 
                            onUpdate={handleUpdate} 
                            testIds={TEST_IDS}
                        />} 
                    />

                    <Route 
                        path="/recepcion" 
                        element={<ReceptionDashboard />} 
                    />

                    <Route 
                        path="/proveedores" 
                        element={<ProviderDashboard />} 
                    />

                    <Route path="*" element={<h2>404 Página no encontrada</h2>} />
                </Routes>
            </main>
        </Router>
    );
}

export default App;