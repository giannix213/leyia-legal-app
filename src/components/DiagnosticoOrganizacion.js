import React, { useState, useEffect } from 'react';
import { useOrganizacionContext } from '../contexts/OrganizacionContext';
import { useCasos } from '../hooks/useCasos';

const DiagnosticoOrganizacion = ({ onClose }) => {
  const { organizacionActual, usuario } = useOrganizacionContext();
  const { diagnosticarOrganizacion, migrarCasosOrfanos, migrarCasosDeOtraOrganizacion } = useCasos();
  const [diagnostico, setDiagnostico] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [migrando, setMigrando] = useState(false);

  useEffect(() => {
    if (organizacionActual?.id) {
      realizarDiagnostico();
    }
  }, [organizacionActual]);

  const realizarDiagnostico = async () => {
    setCargando(true);
    try {
      const resultado = await diagnosticarOrganizacion();
      setDiagnostico(resultado);
    } catch (error) {
      console.error('Error en diagnóstico:', error);
    } finally {
      setCargando(false);
    }
  };

  const handleMigrarCasosDeOtraOrg = async (organizacionOrigen) => {
    const casosEnOtraOrg = diagnostico?.totalCasos - diagnostico?.casosConOrganizacion - diagnostico?.casosSinOrganizacion;
    
    if (!window.confirm(`¿Estás seguro de migrar ${casosEnOtraOrg} casos de la organización "${organizacionOrigen}" a tu organización actual?`)) {
      return;
    }

    setMigrando(true);
    try {
      const migrados = await migrarCasosDeOtraOrganizacion(organizacionOrigen);
      alert(`Se migraron ${migrados} casos exitosamente`);
      await realizarDiagnostico(); // Actualizar diagnóstico
    } catch (error) {
      console.error('Error migrando casos de otra organización:', error);
      alert('Error al migrar casos de otra organización');
    } finally {
      setMigrando(false);
    }
  };
  const handleMigrarCasos = async () => {
    if (!window.confirm('¿Estás seguro de migrar todos los casos sin organizacionId a la organización actual?')) {
      return;
    }

    setMigrando(true);
    try {
      const migrados = await migrarCasosOrfanos();
      alert(`Se migraron ${migrados} casos exitosamente`);
      await realizarDiagnostico(); // Actualizar diagnóstico
    } catch (error) {
      console.error('Error migrando casos:', error);
      alert('Error al migrar casos');
    } finally {
      setMigrando(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: 0, color: '#1f2937' }}>🔍 Diagnóstico de Organización</h2>
          <button 
            onClick={onClose}
            style={{
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 12px',
              cursor: 'pointer'
            }}
          >
            Cerrar
          </button>
        </div>

        {/* Información del contexto */}
        <div style={{
          background: '#f3f4f6',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#374151' }}>📋 Estado del Contexto</h3>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            <p><strong>Organización ID:</strong> {organizacionActual?.id || 'No definido'}</p>
            <p><strong>Nombre:</strong> {organizacionActual?.nombre || 'No definido'}</p>
            <p><strong>Tipo:</strong> {organizacionActual?.tipo || 'No definido'}</p>
            <p><strong>Usuario:</strong> {usuario?.email || 'No autenticado'}</p>
          </div>
        </div>

        {/* Información de localStorage */}
        <div style={{
          background: '#fef3c7',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#92400e' }}>💾 LocalStorage</h3>
          <div style={{ fontSize: '14px', color: '#92400e' }}>
            <p><strong>Organización guardada:</strong> {localStorage.getItem('organizacionActual') ? 'Sí' : 'No'}</p>
            <p><strong>Usuario guardado:</strong> {localStorage.getItem('usuarioActual') ? 'Sí' : 'No'}</p>
          </div>
        </div>

        {/* Diagnóstico de Firebase */}
        {cargando ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div>🔄 Analizando base de datos...</div>
          </div>
        ) : diagnostico ? (
          <div style={{
            background: diagnostico.casosConOrganizacion > 0 ? '#d1fae5' : '#fee2e2',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3 style={{ 
              margin: '0 0 10px 0', 
              color: diagnostico.casosConOrganizacion > 0 ? '#065f46' : '#991b1b' 
            }}>
              🔥 Diagnóstico de Firebase
            </h3>
            <div style={{ 
              fontSize: '14px', 
              color: diagnostico.casosConOrganizacion > 0 ? '#065f46' : '#991b1b' 
            }}>
              <p><strong>Casos con tu organización:</strong> {diagnostico.casosConOrganizacion}</p>
              <p><strong>Total de casos en BD:</strong> {diagnostico.totalCasos}</p>
              <p><strong>Casos sin organizacionId:</strong> {diagnostico.casosSinOrganizacion}</p>
              <p><strong>Organizaciones encontradas:</strong> {diagnostico.organizacionesEncontradas.length}</p>
              
              {diagnostico.organizacionesEncontradas.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <strong>IDs de organizaciones:</strong>
                  <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                    {diagnostico.organizacionesEncontradas.map(orgId => (
                      <li key={orgId} style={{
                        color: orgId === organizacionActual?.id ? '#059669' : '#6b7280',
                        fontWeight: orgId === organizacionActual?.id ? 'bold' : 'normal'
                      }}>
                        {orgId} {orgId === organizacionActual?.id && '← Tu organización'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Acciones */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={realizarDiagnostico}
            disabled={cargando}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 16px',
              cursor: cargando ? 'not-allowed' : 'pointer',
              opacity: cargando ? 0.6 : 1
            }}
          >
            🔄 Actualizar Diagnóstico
          </button>

          {diagnostico?.casosSinOrganizacion > 0 && (
            <button
              onClick={handleMigrarCasos}
              disabled={migrando}
              style={{
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 16px',
                cursor: migrando ? 'not-allowed' : 'pointer',
                opacity: migrando ? 0.6 : 1
              }}
            >
              {migrando ? '🔄 Migrando...' : `📦 Migrar ${diagnostico.casosSinOrganizacion} casos`}
            </button>
          )}

          {/* Botón para migrar casos de otra organización */}
          {diagnostico && diagnostico.organizacionesEncontradas.length > 1 && (
            diagnostico.organizacionesEncontradas
              .filter(orgId => orgId !== organizacionActual?.id)
              .map(orgId => {
                const casosEnEstaOrg = diagnostico.totalCasos - diagnostico.casosConOrganizacion - diagnostico.casosSinOrganizacion;
                return (
                  <button
                    key={orgId}
                    onClick={() => handleMigrarCasosDeOtraOrg(orgId)}
                    disabled={migrando}
                    style={{
                      background: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '10px 16px',
                      cursor: migrando ? 'not-allowed' : 'pointer',
                      opacity: migrando ? 0.6 : 1,
                      fontSize: '14px'
                    }}
                  >
                    {migrando ? '🔄 Migrando...' : `🔄 Migrar casos de ${orgId.substring(0, 12)}...`}
                  </button>
                );
              })
          )}

          <button
            onClick={() => {
              console.log('🔍 Ejecutando diagnóstico en consola...');
              console.log('Organización actual:', organizacionActual);
              console.log('Usuario actual:', usuario);
              console.log('LocalStorage organizacion:', localStorage.getItem('organizacionActual'));
              console.log('LocalStorage usuario:', localStorage.getItem('usuarioActual'));
            }}
            style={{
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 16px',
              cursor: 'pointer'
            }}
          >
            📝 Log en Consola
          </button>
        </div>

        {/* Instrucciones */}
        <div style={{
          background: '#eff6ff',
          padding: '15px',
          borderRadius: '8px',
          marginTop: '20px',
          fontSize: '14px',
          color: '#1e40af'
        }}>
          <h4 style={{ margin: '0 0 10px 0' }}>💡 Instrucciones</h4>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>Si "Casos con tu organización" es 0, pero hay casos en BD, necesitas migrar</li>
            <li>Si hay "Casos sin organizacionId", usa el botón amarillo para migrarlos</li>
            <li>Si hay casos en otra organización, usa el botón rojo para migrarlos a tu organización</li>
            <li>Si no hay casos en total, crea algunos casos nuevos</li>
            <li>Revisa la consola del navegador para logs detallados</li>
            <li><strong>IMPORTANTE:</strong> La migración es permanente, asegúrate antes de proceder</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticoOrganizacion;