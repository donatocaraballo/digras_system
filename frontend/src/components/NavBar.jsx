// frontend/src/components/Navbar.jsx

import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
    return (
        <nav style={navStyle}>
            <span style={titleStyle}>
                DIGRAS Tesis
            </span>
            <div style={{ display: 'flex', gap: '10px' }}>
                <Link to="/inventario" style={linkStyle}>📊 Inventario</Link>
                <Link to="/compras" style={linkStyle}>🛒 Compras</Link>
                <Link to="/proveedores" style={linkStyle}>📇 Proveedores</Link>
                {/* 🚨 NUEVO ENLACE: Módulo del Almacenista 🚨 */}
                <Link to="/recepcion" style={recepcionLinkStyle}>📦 Recepción (Almacén)</Link>
            </div>
        </nav>
    );
}

const navStyle = { 
    backgroundColor: '#2c3e50', 
    padding: '15px 20px', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: '20px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
};
const titleStyle = { color: '#ecf0f1', fontWeight: 'bold', fontSize: '1.5em' };

const linkStyle = {
    color: '#ecf0f1',
    textDecoration: 'none',
    padding: '8px 12px',
    borderRadius: '4px',
    backgroundColor: '#34495e',
    transition: 'background 0.3s'
};

// Estilo destacado para Recepción
const recepcionLinkStyle = {
    ...linkStyle,
    backgroundColor: '#f39c12', // Un color naranja/amarillo para resaltar
    color: '#2c3e50',
    fontWeight: 'bold'
};

export default Navbar;