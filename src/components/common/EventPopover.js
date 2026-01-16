// EventPopover.js - Componente de popover mejorado para mostrar detalles de eventos
// Reemplaza el tooltip nativo con una ventana emergente más rica

import React, { useState, useRef, useEffect } from 'react';
import CalendarService from '../../services/CalendarService';
import './EventPopover.css';

const EventPopover = ({ 
  children, 
  eventos, 
  fecha, 
  disabled = false,
  delay = 500,
  onEditarEvento,
  onEliminarEvento 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef(null);
  const popoverRef = useRef(null);
  const triggerRef = useRef(null);

  const showPopover = (event) => {
    if (disabled || !eventos || eventos.length === 0) return;

    clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
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

  const hidePopover = () => {
    clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  const handleMouseEnter = (event) => {
    showPopover(event);
  };

  const handleMouseLeave = () => {
    hidePopover();
  };

  // Ajustar posición si el popover se sale de la pantalla
  useEffect(() => {
    if (isVisible && popoverRef.current) {
      const popover = popoverRef.current;
      const rect = popover.getBoundingClientRect();
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
      clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleEditarEvento = (evento, e) => {
    e.stopPropagation();
    if (onEditarEvento) {
      onEditarEvento(evento);
    }
    setIsVisible(false);
  };

  const handleEliminarEvento = (evento, e) => {
    e.stopPropagation();
    if (onEliminarEvento) {
      onEliminarEvento(evento);
    }
    setIsVisible(false);
  };

  const formatearFecha = (fecha) => {
    return CalendarService.formatearFechaEvento(fecha, true);
  };

  const obtenerIconoTipo = (evento) => {
    if (evento.esTareaEquipo) {
      return '📋';
    }
    return CalendarService.getIconoTipo(evento.tipo);
  };

  const obtenerColorEvento = (evento) => {
    if (evento.esTareaEquipo) {
      return CalendarService.getColorPrioridad(evento.prioridad);
    }
    return CalendarService.getColorTipo(evento.tipo);
  };

  return (
    <div className="event-popover-container">
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="event-popover-trigger"
      >
        {children}
      </div>
      
      {isVisible && eventos && eventos.length > 0 && (
        <div
          ref={popoverRef}
          className="event-popover"
          style={{
            left: position.x,
            top: position.y,
          }}
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={hidePopover}
        >
          <div className="event-popover-arrow"></div>
          
          <div className="event-popover-header">
            <div className="event-popover-date">
              {formatearFecha(fecha)}
            </div>
            <div className="event-popover-count">
              {eventos.length} evento{eventos.length !== 1 ? 's' : ''}
            </div>
          </div>
          
          <div className="event-popover-content">
            {eventos.slice(0, 5).map((evento, index) => (
              <div 
                key={evento.id} 
                className="event-popover-item"
                style={{ borderLeftColor: obtenerColorEvento(evento) }}
              >
                <div className="event-item-header">
                  <div className="event-item-info">
                    <span className="event-item-icon">
                      {obtenerIconoTipo(evento)}
                    </span>
                    <span className="event-item-time">
                      {evento.hora || '09:00'}
                    </span>
                    {evento.esTareaEquipo && (
                      <span className={`event-item-priority priority-${evento.prioridad}`}>
                        {evento.prioridad?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  <div className="event-item-actions">
                    <button 
                      className="event-action-btn edit-btn"
                      onClick={(e) => handleEditarEvento(evento, e)}
                      title="Editar evento"
                    >
                      ✏️
                    </button>
                    <button 
                      className="event-action-btn delete-btn"
                      onClick={(e) => handleEliminarEvento(evento, e)}
                      title="Eliminar evento"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                <div className="event-item-title">
                  {evento.titulo}
                </div>
                
                {evento.caso && (
                  <div className="event-item-case">
                    Caso: {evento.caso}
                  </div>
                )}
                
                {evento.cliente && (
                  <div className="event-item-client">
                    Cliente: {evento.cliente}
                  </div>
                )}
                
                {evento.lugar && (
                  <div className="event-item-location">
                    📍 {evento.lugar}
                  </div>
                )}
                
                {evento.juez && (
                  <div className="event-item-judge">
                    ⚖️ {evento.juez}
                  </div>
                )}
              </div>
            ))}
            
            {eventos.length > 5 && (
              <div className="event-popover-more">
                +{eventos.length - 5} evento{eventos.length - 5 !== 1 ? 's' : ''} más...
              </div>
            )}
          </div>
          
          <div className="event-popover-footer">
            <small>Doble clic para agregar evento</small>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventPopover;