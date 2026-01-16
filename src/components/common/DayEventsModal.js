// src/components/common/DayEventsModal.js
import React from 'react';
import './DayEventsModal.css';

const DayEventsModal = ({ 
  isOpen, 
  fecha, 
  eventos = [], 
  onClose, 
  onEditarEvento, 
  onEliminarEvento,
  onNuevoEvento 
}) => {
  console.log('🎭 DayEventsModal render:', { isOpen, fecha, eventosLength: eventos?.length });
  
  if (!isOpen || !fecha) return null;

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatearHora = (hora) => {
    if (!hora) return 'Sin hora';
    return hora;
  };

  const getPrioridadColor = (prioridad) => {
    const colores = {
      'alta': '#ef4444',
      'media': '#f59e0b',
      'baja': '#10b981'
    };
    return colores[prioridad] || '#6b7280';
  };

  const getTipoIcon = (tipo) => {
    const iconos = {
      'audiencia': '⚖️',
      'tarea': '📋',
      'reunion': '👥',
      'vencimiento': '⏰',
      'otro': '📌'
    };
    return iconos[tipo] || '📅';
  };

  return (
    <div className="day-events-modal-overlay" onClick={onClose}>
      <div className="day-events-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="day-events-modal-header">
          <div className="header-content">
            <h2>📅 Eventos del día</h2>
            <p className="fecha-completa">{formatearFecha(fecha)}</p>
          </div>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="day-events-modal-body">
          {eventos.length === 0 ? (
            <div className="no-eventos">
              <div className="no-eventos-icon">📭</div>
              <p>No hay eventos programados para este día</p>
              <button className="btn-nuevo-evento" onClick={() => {
                onNuevoEvento();
                onClose();
              }}>
                + Crear Evento
              </button>
            </div>
          ) : (
            <div className="eventos-lista">
              {eventos.map((evento, index) => (
                <div 
                  key={evento.id || index} 
                  className="evento-card"
                  style={{ borderLeft: `4px solid ${getPrioridadColor(evento.prioridad)}` }}
                >
                  {/* Evento Header */}
                  <div className="evento-header">
                    <div className="evento-tipo">
                      <span className="tipo-icon">{getTipoIcon(evento.tipo)}</span>
                      <span className="tipo-text">{evento.tipo || 'Evento'}</span>
                    </div>
                    <div className="evento-actions">
                      <button 
                        className="btn-action btn-edit"
                        onClick={() => {
                          onEditarEvento(evento);
                          onClose();
                        }}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn-action btn-delete"
                        onClick={() => {
                          onEliminarEvento(evento);
                          onClose();
                        }}
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Evento Content */}
                  <div className="evento-content">
                    <h3 className="evento-titulo">{evento.titulo}</h3>
                    
                    {evento.descripcion && (
                      <p className="evento-descripcion">{evento.descripcion}</p>
                    )}

                    <div className="evento-meta">
                      {evento.hora && (
                        <div className="meta-item">
                          <span className="meta-icon">🕐</span>
                          <span className="meta-text">{formatearHora(evento.hora)}</span>
                        </div>
                      )}

                      {evento.prioridad && (
                        <div className="meta-item">
                          <span 
                            className="prioridad-badge"
                            style={{ backgroundColor: getPrioridadColor(evento.prioridad) }}
                          >
                            {evento.prioridad.toUpperCase()}
                          </span>
                        </div>
                      )}

                      {evento.caso && (
                        <div className="meta-item">
                          <span className="meta-icon">📁</span>
                          <span className="meta-text">{evento.caso}</span>
                        </div>
                      )}

                      {evento.cliente && (
                        <div className="meta-item">
                          <span className="meta-icon">👤</span>
                          <span className="meta-text">{evento.cliente}</span>
                        </div>
                      )}
                    </div>

                    {evento.observaciones && (
                      <div className="evento-observaciones">
                        <span className="obs-icon">📝</span>
                        <span className="obs-text">{evento.observaciones}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="day-events-modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cerrar
          </button>
          <button className="btn-primary" onClick={() => {
            onNuevoEvento();
            onClose();
          }}>
            + Nuevo Evento
          </button>
        </div>
      </div>
    </div>
  );
};

export default DayEventsModal;
