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
import PreparacionOrdenes from './pages/PreparacionOrdenes';
import TransporteEnvios from './pages/TransporteEnvios';
import Usuarios from './pages/Usuarios';
import RegistroAcciones from './pages/RegistroAcciones';

// 🚨 COMPONENTE DE ESTILOS FUTURISTAS (El que creamos antes)
import GlobalStyles from './components/GlobalStyles';

// --- MÓDULOS DE VENTAS ---
import Home from './pages/Home';
import CrearOrden from './pages/CrearOrden'; 
import ListadoOrdenes from './pages/ListadoOrdenes'; 

const TEST_IDS = { productId: 1, userId: 1, providerId: 1 };

// --- LAYOUT FULL SCREEN ---
const RutasProtegidas = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Cargando Sistema...</div>;
  if (!user) return <Navigate to="/login" />;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar /> 
      
      {/* CONTENEDOR PRINCIPAL */}
      <div style={{ 
          flex: 1,
          width: '100%', 
          padding: '0 40px 40px 40px', // Padding inferior para respirar
          maxWidth: '1600px', // Límite para monitores ultrawide
          margin: '0 auto',   // Centrado
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
        
        {/* 🚨 INYECCIÓN DE MAGIA VISUAL */}
        <GlobalStyles /> 

        <Toaster 
            position="top-center" 
            reverseOrder={false} 
            toastOptions={{
                style: {
                    borderRadius: '12px',
                    background: '#333',
                    color: '#fff',
                    fontSize: '14px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                },
                success: {
                    style: { background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' },
                    iconTheme: { primary: '#10b981', secondary: '#fff' },
                },
                error: {
                    style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' },
                    iconTheme: { primary: '#ef4444', secondary: '#fff' },
                },
            }}
        />
        
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* HOME DASHBOARD */}
          <Route path="/" element={<RutasProtegidas><Home /></RutasProtegidas>} />

          {/* MÓDULOS DE VENTAS */}
          <Route path="/ordenes" element={<RutasProtegidas><ListadoOrdenes /></RutasProtegidas>} />
          <Route path="/crear-orden" element={<RutasProtegidas><CrearOrden /></RutasProtegidas>} />

          {/* TUS MÓDULOS DE GESTIÓN */}
          <Route path="/inventario" element={<RutasProtegidas><InventoryDashboard refreshTrigger={refreshKey} onUpdate={handleUpdate} /></RutasProtegidas>} />
          <Route path="/inventario/lotes/:productId" element={<RutasProtegidas><LotDetailView /></RutasProtegidas>} />
          <Route path="/compras" element={<RutasProtegidas><PurchaseDashboard refreshTrigger={refreshKey} onUpdate={handleUpdate} testIds={TEST_IDS} /></RutasProtegidas>} />
          <Route path="/recepcion" element={<RutasProtegidas><ReceptionDashboard /></RutasProtegidas>} />
          <Route path="/proveedores" element={<RutasProtegidas><ProviderDashboard /></RutasProtegidas>} />
          <Route path="/clientes" element={<RutasProtegidas><Clientes /></RutasProtegidas>} />
          <Route path="/aprobaciones" element={<RutasProtegidas><GerenteAprobaciones /></RutasProtegidas>} />
          <Route path="/preparacion" element={<RutasProtegidas><PreparacionOrdenes /></RutasProtegidas>} />
          <Route path="/envios" element={<RutasProtegidas><TransporteEnvios /></RutasProtegidas>} />
          <Route path="/usuarios" element={<RutasProtegidas><Usuarios /></RutasProtegidas>} />
          <Route path="/registros" element={<RutasProtegidas><RegistroAcciones /></RutasProtegidas>} />

          <Route path="*" element={<h2 style={{textAlign:'center', marginTop: 100, color:'#64748b'}}>404 | Página no encontrada</h2>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;