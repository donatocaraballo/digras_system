// frontend/src/components/GlobalStyles.jsx

import React from 'react';

const GlobalStyles = () => (
  <style>{`
    /* 1. FUENTE MODERNA (Inter) */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

    /* 2. FONDO ANIMADO FUTURISTA (Efecto Aurora) */
    body {
      margin: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: linear-gradient(-45deg, #f8fafc, #e2e8f0, #cbd5e1, #f1f5f9);
      background-size: 400% 400%;
      animation: gradientBG 15s ease infinite;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden; /* Evita scroll horizontal */
    }

    @keyframes gradientBG {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    /* 3. SCROLLBARS MODERNOS (Estilo Mac/Mobile) */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    ::-webkit-scrollbar-track {
      background: transparent; 
    }
    ::-webkit-scrollbar-thumb {
      background: #cbd5e1; 
      border-radius: 10px;
      border: 2px solid transparent;
      background-clip: content-box;
    }
    ::-webkit-scrollbar-thumb:hover {
      background-color: #94a3b8; 
    }

    /* 4. MICRO-INTERACCIONES (Magia visual) */
    
    /* Efecto Elevación en Tarjetas */
    .kpi-hover {
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .kpi-hover:hover {
      transform: translateY(-8px) scale(1.02);
      box-shadow: 0 20px 40px -10px rgba(59, 130, 246, 0.15) !important;
      border-color: #bfdbfe !important;
    }

    /* Inputs que respiran */
    input:focus, select:focus, textarea:focus {
      border-color: #3b82f6 !important;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1) !important;
      transform: scale(1.005);
      transition: all 0.2s ease;
    }

    /* Botones con Click Effect */
    button:active {
      transform: scale(0.95) !important;
    }

    /* Selección de texto */
    ::selection {
      background: #3b82f6;
      color: white;
    }
  `}</style>
);

export default GlobalStyles;