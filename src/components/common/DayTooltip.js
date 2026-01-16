// DayTooltip.js - Ventana emergente avanzada con datos detallados del día
// Muestra información completa al pasar el cursor por cualquier día

import React, { useState, useRef, useEffect } from 'react';
import CalendarService from '../../services/CalendarService';
import './DayTooltip.css';

const DayTooltip = ({ 
  children, 
  fecha, 
  eventos = [],
  disabled = false,
  delay = 300,
  onEditarEvento,
  onEliminarEvento,
  onNuevoEvento
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef(null);
  const tooltipRef = useRef(null);
  const triggerRef = useRef(null);

  const showTooltip = (event) => {
    if (disabled) return;

    clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      // Validar que el elemento existe antes de obtener getBoundingClientRect
      if (!event.currentTarget) return;
      
      const rect = event.currentTarget.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      setPosition({
        x: rect.left + scrollLeft + rect.width / 2,
        y: rect.top + scrollTop - 10
      });
      
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  const handleMouseEnter = (event) => {
    // Validar que el evento y el target existen
    if (!event || !event.currentTarget) return;
    showTooltip(event);
  };

  const handleMouseLeave = () => {
    hideTooltip();
  };

  // Ajustar posición si el tooltip se sale de la pantalla
  useEffect(() => {
    if (isVisible && tooltipRef.current) {
      const tooltip = tooltipRef.current;
      
      // Validar que el tooltip existe antes de obtener getBoundingClientRect
      if (!tooltip) return;
      
      const rect = tooltip.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let newX = position.x;
      let newY = position.y;
      
      // Ajustar horizontalmente
      if (rect.right > viewportWidth) {
        newX = position.x - (rect.right - viewportWidth) - 20;
      }
      if (rect.left < 0) {
        newX = position.x - rect.left + 20;
      }
      
      // Ajustar verticalmente
      if (rect.top < 0) {
        newY = position.y + Math.abs(rect.top) + 20;
      }
      
      if (newX !== position.x || newY !== position.y) {
        setPosition({ x: newX, y: newY });
      }
    }
  }, [isVisible, position]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Funciones de utilidad
  const formatearFecha = (fecha) => {
    if (!fecha || !(fecha instanceof Date) || isNaN(fecha.getTime())) {
      return 'Fecha inválida';
    }
    return CalendarService.formatearFechaEvento(fecha, true);
  };

  const obtenerIconoTipo = (evento) => {
    if (!evento) return '📅';
    
    if (evento.esTareaEquipo) {
      return '📋';
    }
    return CalendarService.getIconoTipo(evento.tipo);
  };

  const obtenerColorEvento = (evento) => {
    if (!evento) return '#6b7280';
    
    if (evento.esTareaEquipo) {
      return CalendarService.getColorPrioridad(evento.prioridad);
    }
    return CalendarService.getColorTipo(evento.tipo);
  };

  const esHoy = (fecha) => {
    if (!fecha || !(fecha instanceof Date) || isNaN(fecha.getTime())) {
      return false;
    }
    const hoy = new Date();
    return fecha.toDateString() === hoy.toDateString();
  };

  const esPasado = (fecha) => {
    if (!fecha || !(fecha instanceof Date) || isNaN(fecha.getTime())) {
      return false;
    }
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return fecha < hoy;
  };

  const esFuturo = (fecha) => {
    if (!fecha || !(fecha instanceof Date) || isNaN(fecha.getTime())) {
      return false;
    }
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);
    return fecha > hoy;
  };

  const obtenerEstadisticasDia = () => {
    if (!eventos || !Array.isArray(eventos)) {
      return {
        totalEventos: 0,
        audiencias: 0,
        tareas: 0,
        tareasAlta: 0,
        tareasMedia: 0,
        tareasBaja: 0
      };
    }

    const audiencias = eventos.filter(e => e && !e.esTareaEquipo);
    const tareas = eventos.filter(e => e && e.esTareaEquipo);
    const tareasAlta = tareas.filter(t => t && t.prioridad === 'alta');
    const tareasMedia = tareas.filter(t => t && t.prioridad === 'media');
    const tareasBaja = tareas.filter(t => t && t.prioridad === 'baja');

    return {
      totalEventos: eventos.length,
      audiencias: audiencias.length,
      tareas: tareas.length,
      tareasAlta: tareasAlta.length,
      tareasMedia: tareasMedia.length,
      tareasBaja: tareasBaja.length
    };
  };

  const handleAccionEvento = (accion, evento, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    switch (accion) {
      case 'editar':
        if (onEditarEvento) onEditarEvento(evento);
        break;
      case 'eliminar':
        if (onEliminarEvento) onEliminarEvento(evento);
        break;
      default:
        break;
    }
    setIsVisible(false);
  };

  const handleNuevoEvento = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    if (onNuevoEvento) onNuevoEvento();
    setIsVisible(false);
  };

  const estadisticas = obtenerEstadisticasDia();

  // Validar que tenemos una fecha válida antes de renderizar
  if (!fecha || !(fecha instanceof Date) || isNaN(fecha.getTime())) {
    return (
      <div className="day-tooltip-container">
        <div className="day-tooltip-trigger">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="day-tooltip-container">
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="day-tooltip-trigger"
      >
        {children}
      </div>
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className="day-tooltip"
          style={{
            left: position.x,
            top: position.y,
          }}
          onMouseEnter={(e) => {
            // Solo ejecutar si tenemos una fecha válida
            if (fecha && fecha instanceof Date && !isNaN(fecha.getTime())) {
              setIsVisible(true);
            }
          }}
          onMouseLeave={hideTooltip}
        >
          <div className="day-tooltip-arrow"></div>
          
          {/* Header con fecha y estado */}
          <div className="day-tooltip-header">
            <div className="day-tooltip-date">
              <span className="date-text">{formatearFecha(fecha)}</span>
              <div className="date-badges">
                {esHoy(fecha) && <span className="date-badge today">HOY</span>}
                {esPasado(fecha) && !esHoy(fecha) && <span className="date-badge past">PASADO</span>}
                {esFuturo(fecha) && <span className="date-badge future">FUTURO</span>}
              </div>
            </div>
            <div className="day-tooltip-stats">
              <span className="stat-item">
                <span className="stat-number">{estadisticas.totalEventos}</span>
                <span className="stat-label">Total</span>
              </span>
            </div>
          </div>

          {/* Estadísticas detalladas */}
          {estadisticas.totalEventos > 0 && (
            <div className="day-tooltip-summary">
              <div className="summary-grid">
                {estadisticas.audiencias > 0 && (
                  <div className="summary-item audiencias">
                    <span className="summary-icon">⚖️</span>
                    <span className="summary-count">{estadisticas.audiencias}</span>
                    <span className="summary-label">Audiencias</span>
                  </div>
                )}
                {estadisticas.tareas > 0 && (
                  <div className="summary-item tareas">
                    <span className="summary-icon">📋</span>
                    <span className="summary-count">{estadisticas.tareas}</span>
                    <span className="summary-label">Tareas</span>
                  </div>
                )}
              </div>
              
              {/* Desglose de prioridades de tareas */}
              {estadisticas.tareas > 0 && (
                <div className="priority-breakdown">
                  {estadisticas.tareasAlta > 0 && (
                    <span className="priority-item alta">{estadisticas.tareasAlta} Alta</span>
                  )}
                  {estadisticas.tareasMedia > 0 && (
                    <span className="priority-item media">{estadisticas.tareasMedia} Media</span>
                  )}
                  {estadisticas.tareasBaja > 0 && (
                    <span className="priority-item baja">{estadisticas.tareasBaja} Baja</span>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Lista de eventos */}
          <div className="day-tooltip-content">
            {eventos && eventos.length === 0 ? (
              <div className="no-events">
                <span className="no-events-icon">📅</span>
                <span className="no-events-text">Sin eventos programados</span>
                <button 
                  className="quick-add-btn"
                  onClick={handleNuevoEvento}
                >
                  ➕ Agregar Evento
                </button>
              </div>
            ) : (
              <>
                {eventos && eventos.slice(0, 4).map((evento, index) => (
                  <div 
                    key={evento.id} 
                    className="day-tooltip-event"
                    style={{ borderLeftColor: obtenerColorEvento(evento) }}
                  >
                    <div className="event-header">
                      <div className="event-main-info">
                        <span className="event-icon">
                          {obtenerIconoTipo(evento)}
                        </span>
                        <span className="event-time">
                          {evento.hora || '09:00'}
                        </span>
                        {evento.esTareaEquipo && (
                          <span className={`event-priority priority-${evento.prioridad}`}>
                            {evento.prioridad?.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      
                      <div className="event-actions">
                        <button 
                          className="event-action-btn edit"
                          onClick={(e) => handleAccionEvento('editar', evento, e)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button 
                          className="event-action-btn delete"
                          onClick={(e) => handleAccionEvento('eliminar', evento, e)}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    
                    <div className="event-title">
                      {evento.titulo}
                    </div>
                    
                    <div className="event-details">
                      {evento.caso && (
                        <span className="event-detail caso">📁 {evento.caso}</span>
                      )}
                      {evento.cliente && (
                        <span className="event-detail cliente">👤 {evento.cliente}</span>
                      )}
                      {evento.lugar && (
                        <span className="event-detail lugar">📍 {evento.lugar}</span>
                      )}
                      {evento.asignadoA && (
                        <span className="event-detail asignado">👨‍💼 {evento.asignadoA}</span>
                      )}
                    </div>
                  </div>
                ))}
                
                {eventos && eventos.length > 4 && (
                  <div className="day-tooltip-more">
                    <span>+{eventos.length - 4} evento{eventos.length - 4 !== 1 ? 's' : ''} más...</span>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Footer con acciones rápidas */}
          <div className="day-tooltip-footer">
            <button 
              className="footer-action primary"
              onClick={handleNuevoEvento}
            >
              ➕ Nuevo Evento
            </button>
            <div className="footer-hint">
              Doble clic para crear • Clic derecho para menú
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DayTooltip;