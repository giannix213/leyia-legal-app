import { useState, useEffect } from 'react';
import { useOrganizacionContext } from '../contexts/OrganizacionContext';
import { useEstudioDatos } from '../hooks/useEstudioDatos';
import { useCasos } from '../hooks/useCasos';
import VistaGeneralExpedientes from './VistaGeneralExpedientes';
import './EstudioJuridico.css';

function EstudioJuridico() {
  const { organizacionActual } = useOrganizacionContext();
  
  // Hook de datos (Firebase + Cache inteligente)
  const { 
    expedientes, 
    loading, 
    error,
    recargarDesdeRemoto,
    isDownloading,
    downloadProgress,
    lastSync
  } = useEstudioDatos(organizacionActual?.id || organizacionActual?.organizationId);

  // Hook para actualizar casos
  const { actualizarCaso } = useCasos();

  const [clientesAgrupados, setClientesAgrupados] = useState({});
  const [clientesExpandidos, setClientesExpandidos] = useState({});
  const [vistaActual, setVistaActual] = useState('clientes'); 

  // --- MEJORA: Agrupación por cliente automática ---
  useEffect(() => {
    if (expedientes.length > 0) {
      const agrupados = expedientes.reduce((acc, exp) => {
        const cliente = exp.cliente || 'Sin Cliente';
        if (!acc[cliente]) acc[cliente] = [];
        acc[cliente].push(exp);
        return acc;
      }, {});
      setClientesAgrupados(agrupados);
    }
  }, [expedientes]);

  const toggleCliente = (cliente) => {
    setClientesExpandidos(prev => ({ ...prev, [cliente]: !prev[cliente] }));
  };

  if (loading) return <div className="loading-fullscreen"><h2>Cargando Estudio...</h2></div>;

  // --- VISTA 1: TABLERO TÁCTICO (VISTA GENERAL) ---
  if (vistaActual === 'expedientes') {
    return (
      <VistaGeneralExpedientes
        expedientesOrdenados={expedientes} // Usamos datos reales sin filtros locales
        onVolver={() => setVistaActual('clientes')}
        onRecargar={recargarDesdeRemoto}
        onActualizarExpediente={actualizarCaso}
      />
    );
  }

  // --- VISTA 2: LISTADO POR CLIENTES (ESTILO NETFLIX) ---
  return (
    <div className="estudio-container">
      <header className="estudio-nav">
        <div className="nav-info">
          <h1>{organizacionActual?.nombre || 'Mi Estudio Jurídico'}</h1>
          <span className="sync-tag">Sincronizado: {new Date(lastSync).toLocaleTimeString()}</span>
        </div>
        <button className="btn-sync" onClick={recargarDesdeRemoto}>
          {isDownloading ? `Cargando ${downloadProgress}%` : '🔄 Actualizar'}
        </button>
      </header>

      <div className="clientes-grid">
        {Object.entries(clientesAgrupados).map(([cliente, casos]) => (
          <section key={cliente} className={`cliente-seccion ${clientesExpandidos[cliente] ? 'open' : ''}`}>
            <div className="cliente-row" onClick={() => toggleCliente(cliente)}>
              <div className="info">
                <h3>{cliente}</h3>
                <p>{casos.length} Expedientes</p>
              </div>
              <span className="arrow">{clientesExpandidos[cliente] ? '▲' : '▼'}</span>
            </div>
            
            <div className="casos-drawer">
              {casos.map(caso => (
                <div key={caso.id} className="caso-mini-card">
                  <span className="numero">#{caso.numero}</span>
                  <p>{caso.descripcion}</p>
                  <span className={`tag ${caso.prioridad}`}>{caso.prioridad}</span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <button className="fab-button" onClick={() => setVistaActual('expedientes')}>
        📋 VER TABLERO GENERAL
      </button>
    </div>
  );
}

export default EstudioJuridico;