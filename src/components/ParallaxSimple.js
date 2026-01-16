// ParallaxSimple.js - Componente de parallax simple
// Componente stub para evitar errores de importación

import React from 'react';

const ParallaxSimple = ({ children, className = '' }) => {
  return (
    <div className={`parallax-simple ${className}`} style={{ position: 'relative' }}>
      {children}
    </div>
  );
};

export default ParallaxSimple;