// frontend/src/App.jsx

import React, { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './pages/Login';

import { Toaster } from 'react-hot-toast';

// --- TUS MÓDULOS ---
import Navbar from './components/NavBar';
import InventoryDashboard from './pages/InventoryDashboard';
import PurchaseDashboard from './pages/PurchaseDashboard';
import LotDetailView from './pages/LotDetailView';
import ReceptionDashboard from './pages/ReceptionDashboard';
import ProviderDashboard from './pages/ProviderDashboard';
import Clientes from './pages/Clientes';
import GerenteAprobaciones from './pages/GerenteAprobaciones';

// --- MÓDULOS DE VENTAS (Tu Compañero) ---
import Home from './pages/Home';
import CrearOrden from './pages/CrearOrden';     
import ListadoOrdenes from './pages/ListadoOrdenes'; 

const TEST_IDS = { productId: 1, userId: 1, providerId: 1 };

// --- LAYOUT FULL SCREEN ---
const RutasProtegidas = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Cargando...</div>;
  if (!user) return <Navigate to="/login" />;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f6f8', display: 'flex', flexDirection: 'column' }}>
      <Navbar /> 
      
      {/* 🚨 FIX: ELIMINADO maxWidth PARA QUE OCUPE TODA LA PANTALLA */}
      <div style={{ 
          flex: 1,
          width: '100%', 
          padding: '20px 40px', // Márgenes laterales para que no se pegue al borde
          boxSizing: 'border-box' 
      }}>
        {children}
      </div>
    </div>
  );
};

function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const handleUpdate = useCallback(() => setRefreshKey(p => p + 1), []);

  return (
    <AuthProvider>
      <BrowserRouter>

        <Toaster 
            position="top-center" 
            reverseOrder={false} 
            toastOptions={{
                style: {
                    borderRadius: '10px',
                    background: '#f1f1f1',
                    color: '#fff',
                    fontSize: '14px',
                },
                success: {
                    style: { background: '#edf7ed', color: '#1e4620', border: '1px solid #c3e6cb' },
                    iconTheme: { primary: '#4caf50', secondary: '#fff' },
                },
                error: {
                    style: { background: '#fdeded', color: '#5f2120', border: '1px solid #f5c6cb' },
                    iconTheme: { primary: '#f44336', secondary: '#fff' },
                },
            }}
        />
        
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* HOME DASHBOARD */}
          <Route path="/" element={<RutasProtegidas><Home /></RutasProtegidas>} />

          {/* MÓDULOS DE VENTAS (Restaurados a rutas principales) */}
          <Route path="/ordenes" element={<RutasProtegidas><ListadoOrdenes /></RutasProtegidas>} />
          <Route path="/crear-orden" element={<RutasProtegidas><CrearOrden /></RutasProtegidas>} />

          {/* TUS MÓDULOS DE GESTIÓN */}
          <Route path="/inventario" element={<RutasProtegidas><InventoryDashboard refreshTrigger={refreshKey} onUpdate={handleUpdate} testIds={TEST_IDS} /></RutasProtegidas>} />
          <Route path="/inventario/lotes/:productId" element={<RutasProtegidas><LotDetailView /></RutasProtegidas>} />
          <Route path="/compras" element={<RutasProtegidas><PurchaseDashboard refreshTrigger={refreshKey} onUpdate={handleUpdate} testIds={TEST_IDS} /></RutasProtegidas>} />
          <Route path="/recepcion" element={<RutasProtegidas><ReceptionDashboard /></RutasProtegidas>} />
          <Route path="/proveedores" element={<RutasProtegidas><ProviderDashboard /></RutasProtegidas>} />
          <Route path="/clientes" element={<RutasProtegidas><Clientes /></RutasProtegidas>} />
          <Route path="/aprobaciones" element={<RutasProtegidas><GerenteAprobaciones /></RutasProtegidas>} />

          <Route path="*" element={<h2>Página no encontrada</h2>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;