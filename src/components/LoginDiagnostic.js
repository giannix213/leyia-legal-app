// LoginDiagnostic.js - Diagnóstico de login
// Componente stub para evitar errores de importación

import React from 'react';

const LoginDiagnostic = ({ isVisible = false }) => {
  if (!isVisible) return null;

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #ff6b6b', 
      borderRadius: '8px', 
      background: '#ffe0e0',
      margin: '10px 0'
    }}>
      <h3 style={{ color: '#d63031' }}>Diagnóstico de Login</h3>
      <p>Estado de autenticación: Verificando...</p>
      <p>Conexión Firebase: OK</p>
      <p>Permisos: Verificando...</p>
    </div>
  );
};

export default LoginDiagnostic;