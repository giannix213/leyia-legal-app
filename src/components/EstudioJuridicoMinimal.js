import React, { useMemo } from 'react';
import { getColorPorTipo, getImagenPorTipo } from '../utils/casosUtils';
import { useCasos } from '../hooks/useCasos';

// Componente estilo Netflix con carrusel usando el diseño de CasoCard - Compatible con sidebar
const EstudioJuridicoMinimal = ({ onVolver, onAbrirExpediente, onIrATramites }) => {
  // Hook para obtener casos reales
  const { casos, cargando } = useCasos();

  // Procesar casos reales para el carrusel - solo casos activos, limitados a 8
  const expedientesParaCarrusel = useMemo(() => {
    if (!casos || casos.length === 0) return [];
    
    return casos
      .filter(caso => caso.archivado !== true && caso.estado?.toLowerCase() !== 'archivado')
      .slice(0, 8) // Limitar a 8 casos para el carrusel
      .map(caso => ({
        id: caso.id,
        numero: caso.numero || 'SIN-NUMERO',
        cliente: caso.cliente || caso.demandante || 'Cliente no especificado',
        demandante: caso.demandante || caso.cliente || 'Demandante no especificado',
        demandado: caso.demandado || 'Demandado no especificado',
        abogado: caso.abogado || 'Dr. Abogado Responsable',
        tipo: caso.tipo || 'general',
        prioridad: caso.prioridad || 'media',
        estado: caso.estado || 'Activo',
        progreso: Math.floor(Math.random() * 40) + 40, // Progreso simulado entre 40-80%
        descripcion: caso.descripcion || 'Sin descripción disponible',
        ultimaActualizacion: caso.ultimoActuado || caso.observaciones || 'Sin actualizaciones recientes',
        organoJurisdiccional: caso.organoJurisdiccional || 'Órgano Jurisdiccional',
        fechaAudiencia: caso.fechaAudiencia,
        horaAudiencia: caso.horaAudiencia
      }));
  }, [casos]);

  // Estadísticas reales basadas en los casos
  const estadisticasCasos = useMemo(() => {
    if (!casos || casos.length === 0) {
      return {
        prioridad: 0,
        normales: 0,
        proceso: 0
      };
    }

    const casosActivos = casos.filter(caso => caso.archivado !== true && caso.estado?.toLowerCase() !== 'archivado');
    
    return {
      prioridad: casosActivos.filter(caso => caso.prioridad === 'alta' || caso.urgente === true).length,
      normales: casosActivos.filter(caso => caso.prioridad !== 'alta' && caso.urgente !== true).length,
      proceso: casosActivos.filter(caso => caso.estado?.toLowerCase().includes('proceso') || caso.estado?.toLowerCase().includes('tramite')).length
    };
  }, [casos]);

  // Calendario semanal dinámico con fechas reales
  const diasSemanaReales = useMemo(() => {
    const hoy = new Date();
    const diasSemana = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
    const dias = [];
    
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);
      dias.push({
        numero: fecha.getDate(),
        esHoy: i === 0,
        nombreDia: diasSemana[fecha.getDay()],
        fecha: fecha
      });
    }
    
    return dias;
  }, []);

  // Tareas generadas basadas en casos reales
  const tareasReales = useMemo(() => {
    if (!casos || casos.length === 0) {
      return [
        { id: '1', titulo: 'Revisar casilla electrónica', tiempo: '15min', categoria: 'Comunicación', tipoCaso: 'general' },
        { id: '2', titulo: 'Revisar notificaciones judiciales', tiempo: '30min', categoria: 'Comunicación', tipoCaso: 'general' }
      ];
    }

    const casosActivos = casos.filter(caso => caso.archivado !== true && caso.estado?.toLowerCase() !== 'archivado');
    const tareas = [];

    // Tareas generales siempre presentes
    tareas.push(
      { id: 'gen-1', titulo: 'Revisar casilla electrónica', tiempo: '15min', categoria: 'Comunicación', tipoCaso: 'general' },
      { id: 'gen-2', titulo: 'Revisar notificaciones judiciales', tiempo: '30min', categoria: 'Comunicación', tipoCaso: 'general' }
    );

    // Tareas basadas en casos con audiencias próximas
    const casosConAudiencias = casosActivos.filter(caso => caso.fechaAudiencia);
    if (casosConAudiencias.length > 0) {
      tareas.push({
        id: 'aud-1',
        titulo: `Preparar audiencias (${casosConAudiencias.length} casos)`,
        tiempo: `${casosConAudiencias.length * 30}min`,
        categoria: 'Audiencias',
        tipoCaso: casosConAudiencias[0]?.tipo || 'general'
      });
    }

    // Tareas basadas en casos de alta prioridad
    const casosUrgentes = casosActivos.filter(caso => caso.prioridad === 'alta' || caso.urgente === true);
    if (casosUrgentes.length > 0) {
      tareas.push({
        id: 'urg-1',
        titulo: `Revisar casos urgentes (${casosUrgentes.length})`,
        tiempo: `${casosUrgentes.length * 20}min`,
        categoria: 'Urgente',
        tipoCaso: casosUrgentes[0]?.tipo || 'general'
      });
    }

    // Tareas basadas en casos que necesitan actualización
    const casosSinActualizar = casosActivos.filter(caso => 
      !caso.ultimoActuado || !caso.observaciones || 
      caso.ultimoActuado.trim() === '' || caso.observaciones.trim() === ''
    );
    if (casosSinActualizar.length > 0) {
      tareas.push({
        id: 'act-1',
        titulo: `Actualizar estado de expedientes (${casosSinActualizar.length})`,
        tiempo: `${Math.min(casosSinActualizar.length * 10, 60)}min`,
        categoria: 'Actualización',
        tipoCaso: casosSinActualizar[0]?.tipo || 'general'
      });
    }

    // Tareas basadas en tipos de casos específicos
    const casosPenales = casosActivos.filter(caso => caso.tipo?.toLowerCase() === 'penal');
    if (casosPenales.length > 0) {
      tareas.push({
        id: 'pen-1',
        titulo: `Revisar casos penales (${casosPenales.length})`,
        tiempo: `${casosPenales.length * 25}min`,
        categoria: 'Penal',
        tipoCaso: 'penal'
      });
    }

    const casosCiviles = casosActivos.filter(caso => caso.tipo?.toLowerCase() === 'civil');
    if (casosCiviles.length > 0) {
      tareas.push({
        id: 'civ-1',
        titulo: `Revisar casos civiles (${casosCiviles.length})`,
        tiempo: `${casosCiviles.length * 20}min`,
        categoria: 'Civil',
        tipoCaso: 'civil'
      });
    }

    // Limitar a máximo 6 tareas para que no se vea sobrecargado
    return tareas.slice(0, 6);
  }, [casos]);

  // Componente CasoCard adaptado para el carrusel
  const CasoCardCarrusel = ({ caso }) => {
    const imagenFondo = getImagenPorTipo(caso.tipo);
    
    return (
      <div style={{
        position: 'relative',
        overflow: 'visible',
        backgroundColor: '#1a1a1a',
        minHeight: '320px',
        width: '100%',
        height: '100%',
        borderRadius: '14px',
        border: '2px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(1px)'
      }}>
        {/* Imagen de fondo */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${imagenFondo})`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.4,
          zIndex: 1,
          filter: 'brightness(1.3) contrast(1.2)'
        }} />
        
        {/* Imagen adicional en el centro */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80px',
          height: '80px',
          backgroundImage: `url(${imagenFondo})`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.2,
          zIndex: 1,
          filter: 'brightness(1.5) contrast(1.3)'
        }} />
        
        {/* Contenido de la tarjeta */}
        <div style={{
          position: 'relative',
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0.35) 50%, rgba(0, 0, 0, 0.55) 100%)',
          color: 'white',
          height: '100%',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backdropFilter: 'blur(2px)',
          minHeight: '320px',
          borderRadius: '14px',
          zIndex: 2
        }}>
          
          {/* Número de expediente y tipo */}
          <div style={{flex: '0 0 auto', marginTop: '20px', position: 'relative', zIndex: 3}}>
            <div style={{
              color: 'white', 
              fontSize: '22px',
              fontWeight: '800',
              textShadow: '3px 3px 6px rgba(0,0,0,0.9)',
              marginBottom: '8px',
              letterSpacing: '0.5px'
            }}>
              {caso.numero}
            </div>
            <div style={{
              color: getColorPorTipo(caso.tipo), 
              fontSize: '12px',
              fontWeight: '700',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              background: 'rgba(0,0,0,0.4)',
              padding: '3px 8px',
              borderRadius: '16px',
              display: 'inline-block',
              border: `1px solid ${getColorPorTipo(caso.tipo)}40`,
              backdropFilter: 'blur(10px)'
            }}>
              {caso.tipo}
            </div>
          </div>
          
          {/* Información del caso */}
          <div style={{
            flex: '1 1 auto', 
            display: 'flex', 
            flexDirection: 'column',
            gap: '6px',
            padding: '8px 0',
            position: 'relative',
            zIndex: 3
          }}>
            <div style={{
              color: 'white', 
              fontSize: '13px',
              lineHeight: '1.3',
              textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
              textAlign: 'center',
              fontWeight: '500',
              background: 'rgba(0,0,0,0.3)',
              padding: '6px 8px',
              borderRadius: '8px',
              backdropFilter: 'blur(5px)',
              marginBottom: '4px'
            }}>
              {caso.descripcion || 'Sin materia especificada'}
            </div>
            
            {/* Información adicional compacta en grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '3px',
              fontSize: '9px',
              color: '#e5e7eb'
            }}>
              {/* Estado del caso */}
              <div style={{
                background: 'rgba(0,0,0,0.4)',
                padding: '3px 6px',
                borderRadius: '4px',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '8px'
              }}>
                <span style={{fontSize: '10px'}}>
                  {caso.estado === 'postulatoria' ? '📝' : 
                   caso.estado === 'en_tramite' ? '⚖️' : 
                   caso.estado === 'sentencia' ? '📋' : 
                   caso.estado === 'archivado' ? '📁' : '📄'}
                </span>
                <span style={{fontWeight: '600', textTransform: 'capitalize'}}>
                  {(caso.estado || 'Sin estado').replace('_', ' ')}
                </span>
              </div>

              {/* Prioridad */}
              {caso.prioridad && (
                <div style={{
                  background: caso.prioridad === 'alta' ? 'rgba(239, 68, 68, 0.3)' : 
                             caso.prioridad === 'media' ? 'rgba(245, 158, 11, 0.3)' : 
                             'rgba(34, 197, 94, 0.3)',
                  padding: '3px 6px',
                  borderRadius: '4px',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '8px',
                  border: `1px solid ${caso.prioridad === 'alta' ? '#ef4444' : 
                                      caso.prioridad === 'media' ? '#f59e0b' : 
                                      '#22c55e'}40`
                }}>
                  <span style={{fontSize: '10px'}}>
                    {caso.prioridad === 'alta' ? '🔴' : 
                     caso.prioridad === 'media' ? '🟡' : '🟢'}
                  </span>
                  <span style={{fontWeight: '600', textTransform: 'capitalize'}}>
                    {caso.prioridad}
                  </span>
                </div>
              )}

              {/* Órgano jurisdiccional */}
              {caso.organoJurisdiccional && (
                <div style={{
                  background: 'rgba(0,0,0,0.4)',
                  padding: '3px 6px',
                  borderRadius: '4px',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '8px',
                  gridColumn: '1 / -1'
                }}>
                  <span style={{fontSize: '10px'}}>🏛️</span>
                  <span style={{fontWeight: '600'}}>
                    {caso.organoJurisdiccional.length > 30 ? 
                      caso.organoJurisdiccional.substring(0, 30) + '...' : 
                      caso.organoJurisdiccional}
                  </span>
                </div>
              )}

              {/* Demandado */}
              {caso.demandado && (
                <div style={{
                  background: 'rgba(0,0,0,0.4)',
                  padding: '3px 6px',
                  borderRadius: '4px',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '8px',
                  gridColumn: '1 / -1'
                }}>
                  <span style={{fontSize: '10px'}}>⚖️</span>
                  <span style={{fontWeight: '600'}}>
                    vs. {caso.demandado.length > 25 ? 
                      caso.demandado.substring(0, 25) + '...' : 
                      caso.demandado}
                  </span>
                </div>
              )}

              {/* Fecha de audiencia */}
              {caso.fechaAudiencia && (
                <div style={{
                  background: 'rgba(59, 130, 246, 0.3)',
                  padding: '3px 6px',
                  borderRadius: '4px',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '8px',
                  gridColumn: '1 / -1',
                  border: '1px solid rgba(59, 130, 246, 0.4)'
                }}>
                  <span style={{fontSize: '10px'}}>📅</span>
                  <span style={{fontWeight: '600'}}>
                    {new Date(caso.fechaAudiencia).toLocaleDateString('es-PE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit'
                    })}
                    {caso.horaAudiencia && ` ${caso.horaAudiencia}`}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Información del cliente y abogado */}
          <div style={{flex: '0 0 auto', position: 'relative', zIndex: 3}}>
            <div style={{
              color: '#f3f4f6', 
              fontSize: '11px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
              borderTop: '1px solid rgba(255,255,255,0.2)',
              paddingTop: '8px',
              background: 'rgba(0,0,0,0.5)',
              margin: '-4px -6px -6px -6px',
              padding: '8px',
              borderRadius: '0 0 10px 10px',
              backdropFilter: 'blur(10px)'
            }}>
              {/* Cliente */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginBottom: '4px'
              }}>
                <span style={{
                  fontSize: '12px',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
                }}>👤</span>
                <span style={{fontWeight: '600', fontSize: '10px'}}>
                  {(caso.cliente || caso.demandante || 'Cliente no especificado').length > 22 ? 
                    (caso.cliente || caso.demandante || 'Cliente no especificado').substring(0, 22) + '...' : 
                    (caso.cliente || caso.demandante || 'Cliente no especificado')}
                </span>
              </div>

              {/* Abogado responsable */}
              {caso.abogado && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '9px',
                  color: '#d1d5db'
                }}>
                  <span style={{
                    fontSize: '10px',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
                  }}>👨‍💼</span>
                  <span style={{fontWeight: '500'}}>
                    {caso.abogado.length > 20 ? 
                      caso.abogado.substring(0, 20) + '...' : 
                      caso.abogado}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Indicador de prioridad alta */}
          {caso.prioridad === 'alta' && (
            <div style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              fontSize: '20px',
              zIndex: 10,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
            }}>🔥</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      backgroundColor: '#141414',
      color: '#ffffff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'auto',
      display: 'flex',
      flexDirection: 'column'
    }}>
      
      {/* Netflix Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 40px',
        background: 'rgba(20, 20, 20, 0.9)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h1 
            onClick={onVolver}
            style={{
              color: '#E50914',
              fontSize: '24px',
              fontWeight: 'bold',
              margin: '0',
              marginRight: '40px',
              cursor: 'pointer',
              letterSpacing: '1px'
            }}
          >
            ESTUDIO JURÍDICO
          </h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => console.log('Vista general')}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            →
          </button>
        </div>
      </header>

      {/* Netflix Carousel Section */}
      <section style={{
        padding: '40px 40px 0 40px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ height: '20px' }}></div>

        {/* Carousel Container */}
        <div style={{
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '40px'
        }}>
          {cargando ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '320px',
              color: 'white',
              fontSize: '18px'
            }}>
              <div>
                <div style={{ marginBottom: '10px' }}>🔄 Cargando casos...</div>
                <div style={{ fontSize: '14px', opacity: 0.7 }}>Conectando con la base de datos</div>
              </div>
            </div>
          ) : expedientesParaCarrusel.length === 0 ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '320px',
              color: 'white',
              fontSize: '18px'
            }}>
              <div>
                <div style={{ marginBottom: '10px' }}>📋 No hay casos activos</div>
                <div style={{ fontSize: '14px', opacity: 0.7 }}>Crea tu primer expediente para comenzar</div>
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              gap: '16px',
              width: '100%',
              paddingBottom: '20px',
              overflowX: 'auto',
              scrollbarWidth: 'thin',
              scrollbarColor: '#666 #333'
            }}>
              {expedientesParaCarrusel.map(exp => (
                <div key={exp.id} style={{
                  minWidth: 'calc(25% - 12px)',
                  maxWidth: 'calc(25% - 12px)',
                  cursor: 'pointer',
                  position: 'relative',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  flexShrink: 0
                }}
                onClick={() => onAbrirExpediente && onAbrirExpediente(exp)}
                >
                  <CasoCardCarrusel caso={exp} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Netflix Footer Panel */}
      <footer style={{
        display: 'flex',
        gap: '30px',
        padding: '40px 40px',
        background: '#1a1a1a',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        boxSizing: 'border-box',
        width: '100%'
      }}>
        
        {/* Mini Calendar */}
        <div style={{ flex: 1 }}>
          <h3 style={{
            fontSize: '16px',
            marginBottom: '20px',
            fontWeight: '700',
            color: '#ffffff',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Calendario Semanal
          </h3>
          
          <div style={{
            display: 'flex',
            gap: '6px',
            marginTop: '15px',
            position: 'relative',
            padding: '10px 0'
          }}>
            {diasSemanaReales.map(dia => (
              <div key={dia.numero} style={{
                background: dia.esHoy ? '#E50914' : '#333',
                padding: '10px 6px',
                borderRadius: '6px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: '40px',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'visible',
                boxShadow: dia.esHoy ? '0 4px 12px rgba(229, 9, 20, 0.4)' : 'none'
              }}>
                <span style={{
                  fontSize: '9px',
                  opacity: '0.8',
                  marginBottom: '4px',
                  color: 'white'
                }}>
                  {dia.esHoy ? 'HOY' : dia.nombreDia}
                </span>
                <span style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: 'white'
                }}>
                  {dia.numero}
                </span>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: '20px',
            padding: '16px 0',
            borderTop: '1px solid #333'
          }}>
            <h4 style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#ffffff',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              HOY TENEMOS:
            </h4>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                borderRadius: '4px',
                background: 'rgba(229, 9, 20, 0.1)'
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#E50914',
                  boxShadow: '0 0 6px rgba(229, 9, 20, 0.6)',
                  flexShrink: 0
                }}></div>
                <span style={{
                  fontSize: '11px',
                  color: '#dc2626',
                  lineHeight: '1.3'
                }}>
                  {estadisticasCasos.prioridad} expedientes de prioridad
                </span>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                borderRadius: '4px',
                background: 'rgba(255, 167, 38, 0.1)'
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#ffa726',
                  boxShadow: '0 0 6px rgba(255, 167, 38, 0.6)',
                  flexShrink: 0
                }}></div>
                <span style={{
                  fontSize: '11px',
                  color: '#d97706',
                  lineHeight: '1.3'
                }}>
                  {estadisticasCasos.normales} expedientes que pueden esperar
                </span>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                borderRadius: '4px',
                background: 'rgba(66, 165, 245, 0.1)'
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#42a5f5',
                  boxShadow: '0 0 6px rgba(66, 165, 245, 0.6)',
                  flexShrink: 0
                }}></div>
                <span style={{
                  fontSize: '11px',
                  color: '#2563eb',
                  lineHeight: '1.3'
                }}>
                  {estadisticasCasos.proceso} expediente{estadisticasCasos.proceso !== 1 ? 's' : ''} en proceso
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Netflix Tasks */}
        <div style={{ flex: 2 }}>
          <h3 
            onClick={onIrATramites}
            style={{
              fontSize: '16px',
              marginBottom: '20px',
              fontWeight: '700',
              color: '#ffffff',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              cursor: 'pointer'
            }}
          >
            Tareas de Hoy →
          </h3>

          <div style={{
            height: '240px',
            overflowY: 'auto',
            paddingRight: '8px'
          }}>
            {tareasReales.map(tarea => {
              const colorTipoCaso = getColorPorTipo(tarea.tipoCaso);

              return (
                <div 
                  key={tarea.id} 
                  onClick={onIrATramites}
                  style={{
                    background: colorTipoCaso,
                    border: '2px solid #000000',
                    borderRadius: '8px',
                    padding: '10px',
                    margin: '0 0 10px 0',
                    cursor: 'pointer',
                    color: 'white',
                    minHeight: '50px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%'
                  }}>
                    <div style={{
                      background: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '700',
                      minWidth: '45px',
                      textAlign: 'center'
                    }}>
                      {tarea.tiempo}
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flex: 1
                    }}>
                      <span style={{ fontSize: '16px' }}>
                        {tarea.categoria === 'Audiencias' ? '⚖️' :
                         tarea.categoria === 'Urgente' ? '🔥' :
                         tarea.categoria === 'Actualización' ? '📝' :
                         tarea.categoria === 'Penal' ? '🏛️' :
                         tarea.categoria === 'Civil' ? '📋' :
                         '📋'}
                      </span>
                      <div>
                        <div style={{
                          color: 'white',
                          fontWeight: '700',
                          fontSize: '12px',
                          marginBottom: '2px'
                        }}>
                          {tarea.categoria}
                        </div>
                        <div style={{
                          color: 'rgba(255,255,255,0.9)',
                          fontSize: '11px',
                          fontWeight: '500'
                        }}>
                          {tarea.titulo}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </footer>

      {/* Status indicator */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        fontSize: '12px',
        opacity: '0.7',
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '8px 12px',
        borderRadius: '6px',
        color: '#4ade80'
      }}>
        Netflix + Sidebar ✅
      </div>
    </div>
  );
};

export default EstudioJuridicoMinimal;