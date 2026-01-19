import React, { useState, useEffect, useCallback } from 'react';
import { useOrganizacionContext } from '../contexts/OrganizacionContext';
import { useEstudioDatos } from '../hooks/useEstudioDatos';
import { useCasos } from '../hooks/useCasos';
import VistaGeneralExpedientes from './VistaGeneralExpedientes';
import './EstudioJuridico.css';

function EstudioJuridico({ onVolver, onAbrirExpediente, onIrATramites }) {
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

  // Estados del dashboard - SIMPLIFICADOS
  const [expedienteSeleccionado, setExpedienteSeleccionado] = useState(null);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [vistaActual, setVistaActual] = useState('dashboard');
  const [diasSemanaActual, setDiasSemanaActual] = useState([]);
  const [diaAnimado, setDiaAnimado] = useState(null);

  // Configuración Estilo Netflix
  const FICHAS_POR_VISTA = 5;
  const INTERVALO_AUTO_PLAY = 8000;

  // Función para obtener los días de la semana actual - MEMOIZADA
  const obtenerDiasSemanaActual = useCallback(() => {
    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    const diaActual = hoy.getDay();
    const diasHastaLunes = diaActual === 0 ? -6 : 1 - diaActual;
    inicioSemana.setDate(hoy.getDate() + diasHastaLunes);

    const diasSemana = [];
    for (let i = 0; i < 7; i++) {
      const dia = new Date(inicioSemana);
      dia.setDate(inicioSemana.getDate() + i);
      diasSemana.push({
        numero: dia.getDate(),
        fecha: dia,
        esHoy: dia.toDateString() === hoy.toDateString(),
        nombreDia: dia.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase(),
        mes: dia.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()
      });
    }
    return diasSemana;
  }, []);

  // Funciones auxiliares MEMOIZADAS
  const calcularProgreso = useCallback((caso) => {
    const estado = (caso.estado || '').toLowerCase();
    if (estado.includes('archivado') || estado.includes('concluido')) return 100;
    if (estado.includes('sentencia') || estado.includes('resolucion')) return 90;
    if (estado.includes('probatoria') || estado.includes('alegatos')) return 70;
    if (estado.includes('contestacion') || estado.includes('traslado')) return 50;
    if (estado.includes('postulatoria') || estado.includes('admision')) return 30;
    return 20;
  }, []);

  const formatearUltimaActualizacion = useCallback((caso) => {
    if (caso.observaciones && caso.observaciones.trim() !== '') {
      return caso.observaciones.trim();
    }
    if (caso.fechaAudiencia) {
      return `Audiencia programada para ${caso.fechaAudiencia}`;
    }
    if (caso.updatedAt) {
      try {
        const fecha = caso.updatedAt.toDate ? caso.updatedAt.toDate() : new Date(caso.updatedAt);
        const hoy = new Date();
        const diferenciaDias = Math.floor((hoy - fecha) / (1000 * 60 * 60 * 24));
        return diferenciaDias <= 7 ? 'REVISADO' : 'NO REVISADO';
      } catch (error) {
        return 'NO REVISADO';
      }
    }
    return 'NO REVISADO';
  }, []);

  // Procesar expedientes MEMOIZADO
  const expedientesProcesados = useCallback(() => {
    if (!expedientes || expedientes.length === 0) return [];
    
    return expedientes.map(caso => ({
      id: caso.id,
      numero: caso.numero || 'Sin número',
      cliente: caso.cliente || 'Cliente no especificado',
      tipo: caso.tipo || 'civil',
      prioridad: caso.prioridad || 'media',
      estado: caso.estado || 'Activo',
      progreso: calcularProgreso(caso),
      descripcion: caso.descripcion || 'Sin descripción',
      ultimaActualizacion: formatearUltimaActualizacion(caso),
      demandante: caso.demandante || caso.cliente,
      demandado: caso.demandado || 'No especificado',
      abogado: caso.abogado || 'No asignado',
      fechaAudiencia: caso.fechaAudiencia,
      observaciones: caso.observaciones
    })).sort((a, b) => {
      const fechaA = new Date(a.ultimaActualizacion || 0);
      const fechaB = new Date(b.ultimaActualizacion || 0);
      return fechaB - fechaA;
    });
  }, [expedientes, calcularProgreso, formatearUltimaActualizacion]);

  // Tareas simplificadas MEMOIZADAS
  const tareasSimplificadas = useCallback(() => {
    return [
      { id: 'gen-casilla', titulo: 'Revisar casilla electrónica', tiempo: '15min', tipo: 'normal', categoria: 'Comunicación', tipoCaso: 'general' },
      { id: 'gen-notificaciones', titulo: 'Revisar notificaciones judiciales', tiempo: '30min', tipo: 'normal', categoria: 'Comunicación', tipoCaso: 'general' },
      { id: 'gen-agenda', titulo: 'Planificar agenda de la semana', tiempo: '20min', tipo: 'normal', categoria: 'Actualización', tipoCaso: 'general' },
      { id: 'gen-expedientes', titulo: 'Actualizar estado de expedientes', tiempo: '45min', tipo: 'normal', categoria: 'Actualización', tipoCaso: 'general' }
    ];
  }, []);

  // EFECTO ÚNICO PARA INICIALIZACIÓN
  useEffect(() => {
    const diasSemana = obtenerDiasSemanaActual();
    setDiasSemanaActual(diasSemana);
  }, [obtenerDiasSemanaActual]);

  // Lógica de Carrusel Automático
  useEffect(() => {
    const expedientesProcesadosData = expedientesProcesados();
    if (!isAutoPlay || expedientesProcesadosData.length === 0) return;

    const timer = setInterval(() => {
      setCarouselIndex((prevIndex) => {
        const nextIndex = prevIndex + FICHAS_POR_VISTA;
        return nextIndex >= expedientesProcesadosData.length ? 0 : nextIndex;
      });
    }, INTERVALO_AUTO_PLAY);

    return () => clearInterval(timer);
  }, [isAutoPlay, expedientesProcesados]);

  // Animación del calendario SIMPLIFICADA
  useEffect(() => {
    if (diasSemanaActual.length === 0) return;

    const iniciarAnimacionCalendario = () => {
      let diaActual = 0;
      
      const animarDia = () => {
        if (diaActual < diasSemanaActual.length) {
          const diaNumero = diasSemanaActual[diaActual].numero;
          setDiaAnimado(diaNumero);
          
          setTimeout(() => {
            setDiaAnimado(null);
            diaActual++;
            setTimeout(() => {
              animarDia();
            }, 200);
          }, 800);
        } else {
          setDiaAnimado(null);
          setTimeout(() => {
            iniciarAnimacionCalendario();
          }, 8000);
        }
      };

      animarDia();
    };

    const timeoutInicial = setTimeout(() => {
      iniciarAnimacionCalendario();
    }, 3000);

    return () => {
      clearTimeout(timeoutInicial);
    };
  }, [diasSemanaActual]);

  // Navegación manual del carousel
  const moverCarousel = useCallback((direccion) => {
    const expedientesProcesadosData = expedientesProcesados();
    setIsAutoPlay(false);
    setCarouselIndex((prevIndex) => {
      if (direccion === 'prev') {
        return prevIndex <= 0 ? Math.max(0, expedientesProcesadosData.length - FICHAS_POR_VISTA) : prevIndex - FICHAS_POR_VISTA;
      } else {
        const nextIndex = prevIndex + FICHAS_POR_VISTA;
        return nextIndex >= expedientesProcesadosData.length ? 0 : nextIndex;
      }
    });
    setTimeout(() => setIsAutoPlay(true), 5000);
  }, [expedientesProcesados]);

  const abrirExpediente = useCallback((expediente) => {
    if (onAbrirExpediente) {
      onAbrirExpediente(expediente);
    } else {
      setExpedienteSeleccionado(expediente);
    }
  }, [onAbrirExpediente]);

  const cerrarModal = useCallback(() => {
    setExpedienteSeleccionado(null);
  }, []);

  // Obtener color por tipo de caso
  const getColorPorTipo = useCallback((tipo) => {
    const tipoLower = (tipo || '').toLowerCase();
    if (tipoLower.includes('civil')) return '#fbbf24';
    if (tipoLower.includes('penal')) return '#3b82f6';
    if (tipoLower.includes('familia')) return '#fb923c';
    if (tipoLower.includes('comercial')) return '#8b5cf6';
    if (tipoLower.includes('contencioso administrativo')) return '#ef4444';
    if (tipoLower.includes('no contencioso')) return '#06b6d4';
    if (tipoLower.includes('ejecucion') || tipoLower.includes('ejecutivo')) return '#14b8a6';
    if (tipoLower.includes('laboral')) return '#10b981';
    if (tipoLower.includes('constitucional')) return '#ec4899';
    if (tipoLower.includes('tributario')) return '#f97316';
    return '#64748b';
  }, []);

  if (loading) return <div className="loading-fullscreen"><h2>Cargando Estudio...</h2></div>;

  // Vista General de Expedientes
  if (vistaActual === 'expedientes') {
    return (
      <VistaGeneralExpedientes
        expedientesOrdenados={expedientesProcesados()}
        onVolver={() => setVistaActual('dashboard')}
        onRecargar={recargarDesdeRemoto}
        onActualizarExpediente={actualizarCaso}
      />
    );
  }

  const expedientesData = expedientesProcesados();
  const tareasData = tareasSimplificadas();

  // Dashboard Principal
  return (
    <div className="netflix-container">
      {/* Header */}
      <header className="netflix-header">
        <div className="netflix-left">
          <h1 className="netflix-logo" onClick={onVolver}>ESTUDIO JURÍDICO</h1>
        </div>
        <div className="netflix-right">
          <button
            className="btn-circle-nav"
            onClick={() => setVistaActual('expedientes')}
            title="Vista General de Expedientes"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
              fontSize: '14px',
              marginRight: '12px'
            }}
          >
            →
          </button>
          <div className="window-controls">
            <button className="window-control minimize" onClick={() => window.electronAPI?.minimizeWindow()}>−</button>
            <button className="window-control maximize" onClick={() => window.electronAPI?.maximizeWindow()}>□</button>
            <button className="window-control close" onClick={() => window.electronAPI?.closeWindow()}>×</button>
          </div>
        </div>
      </header>

      {/* Carousel de Expedientes */}
      <section className="netflix-row">
        <div className="carousel-indicators">
          {Array.from({ length: Math.ceil(expedientesData.length / FICHAS_POR_VISTA) }, (_, i) => (
            <span 
              key={i} 
              className={`indicator ${Math.floor(carouselIndex / FICHAS_POR_VISTA) === i ? 'active' : ''}`}
              onClick={() => {
                setCarouselIndex(i * FICHAS_POR_VISTA);
                setIsAutoPlay(false);
                setTimeout(() => setIsAutoPlay(true), 5000);
              }}
            />
          ))}
        </div>

        <div style={{ height: '20px' }}></div>

        <div className="netflix-slider">
          <div className="slider-content"
            style={{ 
              transform: `translateX(-${(carouselIndex / FICHAS_POR_VISTA) * 100}%)`,
              transition: 'transform 0.8s cubic-bezier(0.5, 0, 0.1, 1)' 
            }}
          >
            {expedientesData.map(exp => (
              <div key={exp.id} className="netflix-card-detailed" data-tipo={exp.tipo}
                data-prioridad={exp.prioridad}
                onClick={() => abrirExpediente(exp)}
              >
                <div className="card-content-wrapper">
                  <div className="card-header-detailed">
                    <span className="card-number">{exp.numero}</span>
                    <div className="card-badges">
                      <span className="estado-badge-card">{exp.estado}</span>
                      <span className={`tipo-badge-card ${exp.tipo}`}>{exp.tipo.toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="card-description">
                    <p>{exp.descripcion}</p>
                  </div>

                  <div className="card-status-update">
                    <span className="status-icon">📋</span>
                    <span className={`status-text ${
                      exp.ultimaActualizacion !== 'REVISADO' && 
                      exp.ultimaActualizacion !== 'NO REVISADO' && 
                      !exp.ultimaActualizacion.includes('Audiencia') ? 'observacion-text' : ''
                    }`}>
                      {exp.ultimaActualizacion}
                    </span>
                  </div>
                </div>

                <div className="card-footer-detailed">
                  <div style={{ 
                    padding: '40px 60px !important', 
                    width: '100%', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-end', 
                    boxSizing: 'border-box' 
                  }}>
                    <div className="client-info">
                      <h3 className="client-name">{exp.cliente}</h3>
                      <div className="progress-info">
                        <span className="progress-text">{exp.progreso}% Progreso</span>
                        <span className="tipo-label">{exp.tipo}</span>
                      </div>
                      <div className="progress-bar-detailed">
                        <div className="progress-fill-detailed" style={{ width: `${exp.progreso}%` }}></div>
                      </div>
                    </div>
                    {exp.prioridad === 'alta' && <span className="fire-icon-detailed">🔥</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Espaciadores */}
      <div style={{ height: '20px', backgroundColor: '#000000' }}></div>
      <div style={{ height: '20px', backgroundColor: '#ffffff' }}></div>

      {/* Footer Panel */}
      <footer className="netflix-footer-panel">
        <div className="mini-calendar-netflix">
          <h3>Calendario Semanal</h3>
          <div className="calendar-strip">
            {diasSemanaActual.map(dia => (
              <div key={dia.numero} className={`strip-day ${dia.esHoy ? 'today' : ''} ${
                diaAnimado === dia.numero ? 'animating' : ''
              }`}>
                <span className="day-name">{dia.esHoy ? 'HOY' : dia.nombreDia}</span>
                <span className="day-num">{dia.numero}</span>
              </div>
            ))}
          </div>

          <div className="hoy-tenemos">
            <h4>HOY TENEMOS:</h4>
            <div className="resumen-items-netflix">
              <div className="resumen-item-netflix critica">
                <span className="resumen-dot-netflix"></span>
                <span className="resumen-texto-netflix">3 expedientes de prioridad</span>
              </div>
              <div className="resumen-item-netflix importante">
                <span className="resumen-dot-netflix"></span>
                <span className="resumen-texto-netflix">5 expedientes que pueden esperar</span>
              </div>
              <div className="resumen-item-netflix avance">
                <span className="resumen-dot-netflix"></span>
                <span className="resumen-texto-netflix">8 expedientes en proceso</span>
              </div>
            </div>
          </div>
        </div>

        <div className="netflix-tasks">
          <h3 onClick={() => onIrATramites && onIrATramites()}
            style={{ 
              cursor: 'pointer',
              transition: 'color 0.2s ease',
              userSelect: 'none',
              marginBottom: '16px'
            }}
            title="Clic para ir a Trámites"
          >
            Tareas de Hoy →
          </h3>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{
              flex: 1,
              height: '280px',
              overflowY: 'scroll',
              overflowX: 'hidden',
              paddingRight: '8px'
            }}>
              {tareasData.map(tarea => {
                const colorTipoCaso = getColorPorTipo(tarea.tipoCaso || 'civil');

                return (
                  <div key={tarea.id} className="modern-task-card"
                    onClick={() => onIrATramites && onIrATramites()}
                    style={{
                      background: colorTipoCaso,
                      border: '2px solid #000000',
                      borderRadius: '8px',
                      padding: '8px',
                      margin: '0 0 8px 0',
                      cursor: 'pointer',
                      transition: 'box-shadow 0.3s ease, filter 0.3s ease',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      color: 'white',
                      height: '48px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Clic para ir a Trámites"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                      <div style={{
                        background: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '700',
                        minWidth: 'fit-content',
                        textAlign: 'center',
                        border: '1px solid rgba(255,255,255,0.3)'
                      }}>
                        {tarea.tiempo}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <span style={{ fontSize: '16px' }}>📋</span>
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
                            lineHeight: '1.3',
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
        </div>
      </footer>

      {/* Modal de Expediente */}
      {expedienteSeleccionado && (
        <div className="netflix-modal-overlay" onClick={cerrarModal}>
          <div className="netflix-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={cerrarModal}>×</button>
            <div className="modal-header">
              <h2>Expediente {expedienteSeleccionado.numero}</h2>
              <span className="modal-badge" style={{ backgroundColor: getDarkColor(expedienteSeleccionado.tipo) }}>
                {expedienteSeleccionado.tipo}
              </span>
            </div>
            <div className="modal-content">
              <div className="modal-info">
                <div className="info-item">
                  <label>Cliente:</label>
                  <span>{expedienteSeleccionado.cliente}</span>
                </div>
                <div className="info-item">
                  <label>Estado:</label>
                  <span className="estado-badge">{expedienteSeleccionado.estado}</span>
                </div>
                <div className="info-item">
                  <label>Prioridad:</label>
                  <span className={`prioridad-badge ${expedienteSeleccionado.prioridad}`}>
                    {expedienteSeleccionado.prioridad}{expedienteSeleccionado.prioridad === 'alta' && ' 🔥'}
                  </span>
                </div>
                <div className="info-item">
                  <label>Progreso:</label>
                  <div className="modal-progress">
                    <div className="modal-progress-bar">
                      <div className="modal-progress-fill" style={{ width: `${expedienteSeleccionado.progreso}%` }}></div>
                    </div>
                    <span className="progress-text">{expedienteSeleccionado.progreso}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper para colores oscuros estilo Netflix
function getDarkColor(tipo) {
  const colors = { 
    familia: '#1a3a5a', 
    laboral: '#1a4a3a', 
    penal: '#4a1a1a', 
    civil: '#2a2a2a' 
  };
  return colors[tipo] || '#333';
}

export default EstudioJuridico;