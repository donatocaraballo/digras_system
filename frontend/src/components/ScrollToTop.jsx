// frontend/src/components/ScrollToTop.jsx

import React, { useState, useEffect } from 'react';

// Icono de Flecha hacia arriba
const IconArrowUp = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 15l-6-6-6 6"/>
  </svg>
);

const styles = {
  button: {
    position: 'fixed',
    // 🚨 Bottom y Right movidos al CSS para control responsive
    width: '50px',
    height: '50px',
    backgroundColor: '#0f172a', 
    color: '#ffffff',
    borderRadius: '50%',
    border: '1px solid #1e293b',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)', 
    zIndex: 9999, 
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: 0,
    transform: 'translateY(20px) scale(0.8)',
    pointerEvents: 'none', 
  },
  visible: {
    opacity: 1,
    transform: 'translateY(0) scale(1)',
    pointerEvents: 'auto',
  },
  hover: {
    backgroundColor: '#2563eb', 
    transform: 'translateY(-3px) scale(1.05)',
    boxShadow: '0 15px 30px rgba(37, 99, 235, 0.3)',
  }
};

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // 1. Detectar scroll
  const toggleVisibility = () => {
    if (window.pageYOffset > 300) { 
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // 2. Función para subir suavemente
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  return (
    <>
        <button 
          type="button"
          className="scroll-btn-responsive" // 🚨 Clase añadida
          onClick={scrollToTop}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            ...styles.button, 
            ...(isVisible ? styles.visible : {}),
            ...(isVisible && isHovered ? styles.hover : {})
          }}
          title="Volver arriba"
          aria-label="Volver arriba"
        >
          <IconArrowUp />
        </button>

        {/* 🚨 Estilos Responsivos Inyectados */}
        <style>{`
            .scroll-btn-responsive {
                bottom: 40px;
                right: 40px;
            }
            @media (max-width: 768px) {
                .scroll-btn-responsive {
                    bottom: 20px !important;
                    right: 20px !important;
                    width: 45px !important; /* Un poco más pequeño en móvil */
                    height: 45px !important;
                }
            }
        `}</style>
    </>
  );
}