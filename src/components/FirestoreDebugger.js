// FirestoreDebugger.js - Debugger de Firestore
// Componente stub para evitar errores de importación

import React from 'react';

const FirestoreDebugger = ({ isVisible = false }) => {
  if (!isVisible) return null;

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '20px', 
      right: '20px', 
      background: '#333', 
      color: 'white', 
      padding: '10px', 
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      <h4>Firestore Debug</h4>
      <p>Debug panel en desarrollo...</p>
    </div>
  );
};

export default FirestoreDebugger;