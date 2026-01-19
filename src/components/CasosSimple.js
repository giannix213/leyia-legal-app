// Componente simplificado para debuggear el problema
import React, { useState, useEffect } from 'react';
import { useCasos } from '../hooks/useCasos';
import { useOrganizacionContext } from '../contexts/OrganizacionContext';
import './CasosScrollEffect.css';
import './CasosAgrupacion.css';

function CasosSimple() {
  const { casos, cargando } = useCasos();
  const { organizacionActual } = useOrganizacionContext();
  const [casosOrdenados, setCasosOrdenados] = useState([]);

  useEffect(() => {
    console.log('🔍 [CASOS SIMPLE] casos:', casos);
    console.log('🔍 [CASOS SIMPLE] casos.length:', casos.length);
    setCasosOrdenados(casos);
  }, [casos]);

  console.log('🎨 [CASOS SIMPLE] Renderizando componente...');
  console.log('📊 [CASOS SIMPLE] casosOrdenados:', casosOrdenados);

  if (cargando) {
    return (
      <div className="galactic-mainframe">
        <h1>Cargando casos...</h1>
      </div>
    );
  }

  return (
    <div className="galactic-mainframe">
      <div className="galactic-header">
        <div className="title-area">
          <h1>CASOS SIMPLE DEBUG</h1>
          <div className="subtitle">TOTAL: {casosOrdenados.length}</div>
        </div>
      </div>

      <div className="casos-grid-card">
        {casosOrdenados.length === 0 ? (
          <div style={{ color: 'white', padding: '20px' }}>
            No hay casos para mostrar
          </div>
        ) : (
          casosOrdenados.map((caso, index) => {
            console.log(`🎴 [CASOS SIMPLE] Renderizando caso ${index}:`, caso.numero);
            
            return (
              <div 
                key={caso.id || index} 
                className="caso-card-game"
                style={{
                  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                  border: '2px solid #00ccff',
                  borderRadius: '12px',
                  padding: '20px',
                  color: 'white',
                  minHeight: '200px',
                  margin: '10px'
                }}
              >
                <div className="card-content">
                  <div className="card-header">
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
                      {caso.numero || 'Sin número'}
                    </h3>
                  </div>
                  
                  <div className="materia-principal" style={{ marginBottom: '10px' }}>
                    <strong>Descripción:</strong><br />
                    {caso.descripcion || 'Sin descripción'}
                  </div>
                  
                  <div className="cliente-info" style={{ fontSize: '12px', opacity: 0.8 }}>
                    <strong>Cliente:</strong> {caso.cliente || 'Sin cliente'}
                  </div>
                  
                  <div className="tipo-info" style={{ fontSize: '12px', opacity: 0.8, marginTop: '5px' }}>
                    <strong>Tipo:</strong> {caso.tipo || 'Sin tipo'}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default CasosSimple;