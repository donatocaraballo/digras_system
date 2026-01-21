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
      min-width: 320px;
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

    /* =========================================
       5. SISTEMA RESPONSIVO (NUEVO)
       ========================================= */

    /* A. Contenedores */
    .page-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px 32px;
      width: 100%;
      box-sizing: border-box;
    }

    /* B. Grillas Inteligentes */
    .grid-responsive {
      display: grid;
      gap: 24px;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    }

    .form-grid-responsive {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    /* C. Tablas Responsivas (Scroll Horizontal) */
    .table-responsive-wrapper {
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      background: white;
    }
    
    .table-responsive {
      width: 100%;
      border-collapse: collapse;
      white-space: nowrap;
    }

    /* D. Modales Adaptables */
    .modal-content-responsive {
      width: 100%;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      padding: 30px;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
      display: flex;
      flex-direction: column;
    }

    /* E. Toolbar (Buscador + Botones) */
    .toolbar-responsive {
      display: flex;
      gap: 15px;
      margin-bottom: 25px;
    }

    /* =========================================
       6. MEDIA QUERIES (MÓVIL Y TABLET)
       ========================================= */

    /* Tablet (Menos de 1024px) */
    @media (max-width: 1024px) {
      .page-container {
        padding: 20px;
      }
    }

    /* Celular (Menos de 768px) */
    @media (max-width: 768px) {
      /* Layout */
      .page-container {
        padding: 16px 12px;
      }

      /* Formularios a 1 columna */
      .form-grid-responsive {
        grid-template-columns: 1fr !important;
        gap: 15px;
      }

      /* Toolbars verticales */
      .toolbar-responsive {
        flex-direction: column;
        align-items: stretch !important;
        gap: 12px;
      }
      .toolbar-responsive > div, 
      .toolbar-responsive > button,
      .toolbar-responsive input {
        width: 100% !important;
      }

      /* Modales Full Width */
      .modal-content-responsive {
        padding: 20px !important;
        max-width: 95vw !important;
        width: 95vw !important;
      }

      /* Ajuste de textos */
      h1 { font-size: 1.75rem !important; }
      h2 { font-size: 1.5rem !important; }
      h3 { font-size: 1.25rem !important; }
      
      .hide-on-mobile {
        display: none !important;
      }
    }
  `}</style>
);

export default GlobalStyles;