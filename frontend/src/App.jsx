// frontend/src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";

import { AuthProvider, useAuth } from "./AuthContext";

// Páginas
import Login from "./pages/Login";
import Home from "./pages/Home";
import CrearOrden from "./pages/CrearOrden";
import ListadoOrdenes from "./pages/ListadoOrdenes";

function RutasProtegidas({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Barra de navegación superior */}
        <nav
          style={{
            display: "flex",
            gap: "20px",
            padding: "16px 24px",
            borderBottom: "1px solid #e5e7eb",
            backgroundColor: "#f9fafb",
            fontFamily:
              "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
        >
          <Link to="/" style={{ textDecoration: "none", color: "#111827" }}>
            Inicio
          </Link>
          <Link
            to="/crear-orden"
            style={{ textDecoration: "none", color: "#111827" }}
          >
            Crear Orden
          </Link>
          <Link
            to="/ordenes"
            style={{ textDecoration: "none", color: "#111827" }}
          >
            Órdenes
          </Link>
        </nav>

        <Routes>
          {/* Login (sin protección) */}
          <Route path="/login" element={<Login />} />

          {/* Home */}
          <Route
            path="/"
            element={
              <RutasProtegidas>
                <Home />
              </RutasProtegidas>
            }
          />

          {/* Crear Orden */}
          <Route
            path="/crear-orden"
            element={
              <RutasProtegidas>
                <CrearOrden />
              </RutasProtegidas>
            }
          />

          {/* Listado / Búsqueda de Órdenes */}
          <Route
            path="/ordenes"
            element={
              <RutasProtegidas>
                <ListadoOrdenes />
              </RutasProtegidas>
            }
          />

          {/* Ruta por defecto: redirige al inicio */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}