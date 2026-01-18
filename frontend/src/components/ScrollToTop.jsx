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
    bottom: '40px',
    right: '40px',
    width: '50px',
    height: '50px',
    backgroundColor: '#0f172a', // Tu color oscuro principal
    color: '#ffffff',
    borderRadius: '50%',
    border: '1px solid #1e293b',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)', // Sombra elegante
    zIndex: 9999, // Por encima de casi todo
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: 0,
    transform: 'translateY(20px) scale(0.8)',
    pointerEvents: 'none', // No clickeable si está invisible
  },
  visible: {
    opacity: 1,
    transform: 'translateY(0) scale(1)',
    pointerEvents: 'auto',
  },
  hover: {
    backgroundColor: '#2563eb', // Azul brillante al pasar mouse
    transform: 'translateY(-3px) scale(1.05)',
    boxShadow: '0 15px 30px rgba(37, 99, 235, 0.3)',
  }
};

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // 1. Detectar scroll
  const toggleVisibility = () => {
    if (window.pageYOffset > 300) { // Aparece después de bajar 300px
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
    <button 
      type="button"
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
  );
}