import React from 'react';
import CalendarService from '../../services/CalendarService';
import DayTooltip from '../common/DayTooltip';
import './CalendarioView.css';

// Componente principal de vista futurista
const CalendarioView = ({
  // Estados de datos
  eventos,
  fechaActual,
  
  // Optimización de UI
  mapaEventos, // Nuevo: mapa para efecto de brillo
  
  // Estados de UI
  vistaActual,
  diaSeleccionado,
  eventoSeleccionado,
  mostrarModalNuevo,
  mostrarModalEditar,
  mostrarModalEliminar,
  eventoEditando,
  eventoAEliminar,
  cargando,
  
  // Handlers
  onMesAnterior,
  onMesSiguiente,
  onHoy,
  onCambiarVista,
  onDiaClick,
  onDiaHover,
  onDiaDoubleClick,
  onEventoClick,
  onNuevoEvento,
  onCerrarModal,
  onGuardarEvento,
  onEditarEvento,
  onEliminarEvento,
  onActualizarEvento,
  onConfirmarEliminar,
  
  // Función de navegación
  onNavigateTo
}) => {
  // Debug: Log eventos recibidos
  React.useEffect(() => {
    console.log('📊 CalendarioView - Eventos recibidos:', eventos?.length || 0, eventos);
    console.log('🗺️ CalendarioView - Mapa eventos:', mapaEventos);
  }, [eventos, mapaEventos]);
  const [menuContextual, setMenuContextual] = React.useState({
    visible: false,
    x: 0,
    y: 0,
    fecha: null,
    eventos: []
  });

  // Manejar clic derecho en días
  const handleContextMenu = (e, fecha, eventosDelDia) => {
    e.preventDefault();
    setMenuContextual({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      fecha: fecha,
      eventos: eventosDelDia
    });
  };

  // Cerrar menú contextual
  const cerrarMenuContextual = () => {
    setMenuContextual({ ...menuContextual, visible: false });
  };

  // Manejar acciones del menú contextual
  const handleAccionContextual = (accion, evento = null) => {
    switch (accion) {
      case 'nuevo':
        onDiaClick(menuContextual.fecha);
        onNuevoEvento();
        break;
      case 'editar':
        if (evento) onEditarEvento(evento);
        break;
      case 'eliminar':
        if (evento) onEliminarEvento(evento);
        break;
      default:
        break;
    }
    cerrarMenuContextual();
  };

  // Cerrar menú al hacer clic fuera
  React.useEffect(() => {
    const handleClickOutside = () => {
      if (menuContextual.visible) {
        cerrarMenuContextual();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuContextual.visible]);

  // Atajos de teclado
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      // Solo procesar si no hay modales abiertos
      if (mostrarModalNuevo || mostrarModalEditar || mostrarModalEliminar) return;
      
      switch (e.key) {
        case 'n':
        case 'N':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onNuevoEvento();
          }
          break;
        case 'Escape':
          if (menuContextual.visible) {
            cerrarMenuContextual();
          }
          break;
        case 'ArrowLeft':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onMesAnterior();
          }
          break;
        case 'ArrowRight':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onMesSiguiente();
          }
          break;
        case 'h':
        case 'H':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onHoy();
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [menuContextual.visible, mostrarModalNuevo, mostrarModalEditar, mostrarModalEliminar, onNuevoEvento, onMesAnterior, onMesSiguiente, onHoy]);
  // Obtener datos del mes actual
  const nombreMes = fechaActual.toLocaleDateString('es-ES', { month: 'long' });
  const año = fechaActual.getFullYear();
  
  // Generar días del calendario
  const generarDiasCalendario = () => {
    const primerDiaMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
    const ultimoDiaMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);
    
    // Calcular el primer lunes del calendario
    const primerDiaCalendario = new Date(primerDiaMes);
    const diaSemanaPrimerDia = primerDiaMes.getDay();
    const diasHastaLunes = diaSemanaPrimerDia === 0 ? 1 : 1 - diaSemanaPrimerDia;
    primerDiaCalendario.setDate(primerDiaMes.getDate() + diasHastaLunes);
    
    const dias = [];
    const fechaIteracion = new Date(primerDiaCalendario);
    
    // Generar 5 semanas de 7 días (35 días total)
    for (let i = 0; i < 35; i++) {
      dias.push(new Date(fechaIteracion));
      fechaIteracion.setDate(fechaIteracion.getDate() + 1);
    }
    
    return dias;
  };

  // Generar días de la semana actual
  const generarDiasSemana = () => {
    const inicioSemana = new Date(fechaActual);
    const diaActual = inicioSemana.getDay();
    const diasHastaLunes = diaActual === 0 ? 6 : diaActual - 1;
    inicioSemana.setDate(inicioSemana.getDate() - diasHastaLunes);
    inicioSemana.setHours(0, 0, 0, 0);
    
    const diasSemana = [];
    for (let i = 0; i < 7; i++) {
      const dia = new Date(inicioSemana);
      dia.setDate(inicioSemana.getDate() + i);
      diasSemana.push(dia);
    }
    
    return diasSemana;
  };

  const dias = vistaActual === 'semana' ? generarDiasSemana() : generarDiasCalendario();
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const obtenerEventosDelDia = (fecha) => {
    const fechaStr = fecha.toDateString();
    const eventosDelDia = eventos.filter(evento => {
      const fechaEvento = new Date(evento.fecha);
      return fechaEvento.toDateString() === fechaStr;
    });
    
    // Debug: Log eventos del día
    if (eventosDelDia.length > 0) {
      console.log(`📅 Eventos para ${fechaStr}:`, eventosDelDia);
    }
    
    return eventosDelDia;
  };

  // Función optimizada para verificar si un día tiene eventos usando el mapa
  const tieneEventosOptimizado = (fecha) => {
    const fechaISO = fecha.toISOString().split('T')[0]; // YYYY-MM-DD
    return mapaEventos && mapaEventos[fechaISO] > 0;
  };

  // Función para obtener el número de eventos de un día
  const contarEventosDelDia = (fecha) => {
    const fechaISO = fecha.toISOString().split('T')[0];
    return mapaEventos ? (mapaEventos[fechaISO] || 0) : 0;
  };

  const esMesActual = (fecha) => fecha.getMonth() === fechaActual.getMonth();
  const esHoy = (fecha) => fecha.toDateString() === hoy.toDateString();

  // Función para obtener el rango de fechas mostrado
  const obtenerRangoFechas = () => {
    if (vistaActual === 'semana') {
      const diasSemana = generarDiasSemana();
      const inicio = diasSemana[0];
      const fin = diasSemana[6];
      return `${inicio.getDate()} - ${fin.getDate()} ${fin.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;
    } else {
      return `${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)} ${año}`;
    }
  };

  return (
    <>
      <div className="calendario-futurista">
        {/* Efecto de rejilla de fondo */}
        <div className="grid-background"></div>
        
        {/* Contenedor principal del calendario */}
        <div className="calendar-container">
          {/* Línea de escaneo holográfico */}
          <div className="scanline"></div>
          
          {/* Decoraciones del sistema */}
          <div className="decoration top-right">COORD_REF: 54.89 // SECTOR_7G</div>
          
          {/* Header del calendario */}
          <div className="header">
            <div className="header-left">
              <small>ESTABLECIENDO CONEXIÓN...</small>
              <h1>{obtenerRangoFechas()}</h1>
            </div>
            <div className="system-status">
              SISTEMA: OPERATIVO<br/>
              VISTA: {vistaActual.toUpperCase()}<br/>
              DATAPAD V.4.0
            </div>
          </div>

          {/* Controles de navegación */}
          <div className="calendar-controls">
            <div className="nav-controls">
              <button className="nav-btn" onClick={onMesAnterior} title="Mes Anterior">
                ◀
              </button>
              <button className="nav-btn today-btn" onClick={onHoy} title="Ir a Hoy">
                HOY
              </button>
              <button className="nav-btn" onClick={onMesSiguiente} title="Mes Siguiente">
                ▶
              </button>
            </div>
            
            <div className="view-controls">
              <button 
                className={`view-btn ${vistaActual === 'mes' ? 'active' : ''}`}
                onClick={() => onCambiarVista('mes')}
                title="Vista Mensual"
              >
                📅 MES
              </button>
              <button 
                className={`view-btn ${vistaActual === 'semana' ? 'active' : ''}`}
                onClick={() => onCambiarVista('semana')}
                title="Vista Semanal"
              >
                📊 SEMANA
              </button>
            </div>
            
            <div className="action-controls">
              <button className="nav-btn new-event-btn" onClick={onNuevoEvento} title="Nuevo Evento">
                + EVENTO
              </button>
            </div>
          </div>
          
          {/* Tabla del calendario */}
          {vistaActual === 'mes' ? (
            // Vista Mensual
            <table className="calendar-table">
              <thead>
                <tr>
                  <th>Lun</th>
                  <th>Mar</th>
                  <th>Mié</th>
                  <th>Jue</th>
                  <th>Vie</th>
                  <th>Sáb</th>
                  <th>Dom</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }, (_, semana) => (
                  <tr key={semana}>
                    {Array.from({ length: 7 }, (_, dia) => {
                      const indiceDia = semana * 7 + dia;
                      const fecha = dias[indiceDia];
                      const eventosDelDia = obtenerEventosDelDia(fecha);
                      const tieneEventos = tieneEventosOptimizado(fecha);
                      const numeroEventos = contarEventosDelDia(fecha);
                      
                      let clasesDia = '';
                      if (!esMesActual(fecha)) clasesDia += ' other-month';
                      if (esHoy(fecha)) clasesDia += ' today';
                      if (tieneEventos) clasesDia += ' has-events glow-effect';
                      
                      return (
                        <td 
                          key={indiceDia}
                          className={clasesDia}
                          onClick={() => onDiaClick(fecha)}
                          onMouseEnter={() => onDiaHover && onDiaHover(fecha)}
                          onDoubleClick={() => onDiaDoubleClick && onDiaDoubleClick(fecha)}
                          onContextMenu={(e) => handleContextMenu(e, fecha, eventosDelDia)}
                          data-eventos={numeroEventos}
                        >
                          <DayTooltip 
                            fecha={fecha}
                            eventos={eventosDelDia}
                            onEditarEvento={onEditarEvento}
                            onEliminarEvento={onEliminarEvento}
                            onNuevoEvento={() => {
                              onDiaClick(fecha);
                              onNuevoEvento();
                            }}
                          >
                            <div className="dia-numero" style={{ color: 'white', fontWeight: 'bold' }}>
                              {fecha.getDate()}
                            </div>
                            {tieneEventos && (
                              <div className="eventos-indicator">
                                {eventosDelDia.slice(0, 3).map((evento, idx) => (
                                  <div 
                                    key={`${evento.id}-${idx}`}
                                    className={`evento-dot ${evento.esTareaEquipo ? 'tarea-dot' : 'audiencia-dot'}`}
                                    style={{ 
                                      backgroundColor: evento.esTareaEquipo 
                                        ? CalendarService.getColorPrioridad(evento.prioridad)
                                        : CalendarService.getColorTipo(evento.tipo)
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEventoClick(evento);
                                    }}
                                    title={`${evento.hora} - ${evento.titulo}${evento.caso ? ` (${evento.caso})` : ''}`}
                                  />
                                ))}
                                {numeroEventos > 3 && (
                                  <div className="mas-eventos" title={`${numeroEventos - 3} eventos más`}>
                                    +{numeroEventos - 3}
                                  </div>
                                )}
                              </div>
                            )}
                          </DayTooltip>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            // Vista Semanal
            <div className="week-view">
              <div className="week-header">
                <div className="time-column">Hora</div>
                {dias.map((fecha, index) => (
                  <div key={index} className={`day-column ${esHoy(fecha) ? 'today' : ''}`}>
                    <div className="day-name">
                      {fecha.toLocaleDateString('es-ES', { weekday: 'short' })}
                    </div>
                    <div className="day-number">
                      {fecha.getDate()}
                    </div>
                    <div className="day-events-count">
                      {contarEventosDelDia(fecha)} eventos
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="week-body">
                {Array.from({ length: 24 }, (_, hora) => (
                  <div key={hora} className="time-row">
                    <div className="time-label">
                      {hora.toString().padStart(2, '0')}:00
                    </div>
                    {dias.map((fecha, diaIndex) => {
                      const eventosDelDia = obtenerEventosDelDia(fecha);
                      const eventosHora = eventosDelDia.filter(evento => {
                        const horaEvento = parseInt(evento.hora?.split(':')[0] || '0');
                        return horaEvento === hora;
                      });
                      
                      return (
                        <div 
                          key={diaIndex} 
                          className={`time-cell ${esHoy(fecha) ? 'today' : ''}`}
                          onClick={() => {
                            onDiaClick(fecha);
                            onNuevoEvento();
                          }}
                          onContextMenu={(e) => handleContextMenu(e, fecha, eventosDelDia)}
                        >
                          {eventosHora.map(evento => (
                            <div 
                              key={evento.id}
                              className={`week-event ${evento.esTareaEquipo ? 'tarea-event' : 'audiencia-event'}`}
                              style={{ 
                                borderLeftColor: evento.esTareaEquipo 
                                  ? CalendarService.getColorPrioridad(evento.prioridad)
                                  : CalendarService.getColorTipo(evento.tipo)
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onEventoClick(evento);
                              }}
                              title={`${evento.hora} - ${evento.titulo}`}
                            >
                              <div className="event-time">{evento.hora}</div>
                              <div className="event-title">{evento.titulo}</div>
                              {evento.caso && (
                                <div className="event-case">📁 {evento.caso}</div>
                              )}
                              <div className="event-actions-week">
                                <button 
                                  className="event-action-btn edit"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditarEvento(evento);
                                  }}
                                  title="Editar"
                                >
                                  ✏️
                                </button>
                                <button 
                                  className="event-action-btn delete"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEliminarEvento(evento);
                                  }}
                                  title="Eliminar"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Decoración inferior */}
          <div className="decoration bottom-left">
            ATAJOS: CTRL+N=NUEVO | CTRL+←/→=MES | CTRL+H=HOY | CLIC DERECHO=MENÚ
          </div>
        </div>

        {/* Modales */}
        <ModalEvento
          evento={eventoSeleccionado}
          onCerrar={() => onCerrarModal('evento')}
          onEditar={onEditarEvento}
          onEliminar={onEliminarEvento}
        />
        
        <ModalNuevoEvento
          mostrar={mostrarModalNuevo}
          onCerrar={() => onCerrarModal('nuevo')}
          onGuardar={onGuardarEvento}
          fechaSeleccionada={diaSeleccionado}
          cargando={cargando}
        />
        
        <ModalEditarEvento
          mostrar={mostrarModalEditar}
          onCerrar={() => onCerrarModal('editar')}
          onActualizar={onActualizarEvento}
          evento={eventoEditando}
          cargando={cargando}
        />
        
        <ModalEliminarEvento
          mostrar={mostrarModalEliminar}
          onCerrar={() => onCerrarModal('eliminar')}
          onConfirmar={onConfirmarEliminar}
          evento={eventoAEliminar}
          cargando={cargando}
        />
        
        {/* Menú contextual */}
        {menuContextual.visible && (
          <div 
            className="context-menu"
            style={{
              position: 'fixed',
              left: menuContextual.x,
              top: menuContextual.y,
              zIndex: 10001
            }}
          >
            <div className="context-menu-header">
              {CalendarService.formatearFechaEvento(menuContextual.fecha, true)}
            </div>
            
            <button 
              className="context-menu-item"
              onClick={() => handleAccionContextual('nuevo')}
            >
              ➕ Nuevo Evento
            </button>
            
            {menuContextual.eventos.length > 0 && (
              <>
                <div className="context-menu-separator"></div>
                <div className="context-menu-subtitle">
                  Eventos del día:
                </div>
                {menuContextual.eventos.slice(0, 3).map(evento => (
                  <div key={evento.id} className="context-menu-event">
                    <div className="context-menu-event-info">
                      <span className="context-menu-event-time">{evento.hora}</span>
                      <span className="context-menu-event-title">{evento.titulo}</span>
                    </div>
                    <div className="context-menu-event-actions">
                      <button 
                        className="context-menu-action edit"
                        onClick={() => handleAccionContextual('editar', evento)}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button 
                        className="context-menu-action delete"
                        onClick={() => handleAccionContextual('eliminar', evento)}
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
                {menuContextual.eventos.length > 3 && (
                  <div className="context-menu-more">
                    +{menuContextual.eventos.length - 3} más...
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};

// Modal para mostrar detalles del evento
const ModalEvento = ({ evento, onCerrar, onEditar, onEliminar }) => {
  if (!evento) return null;

  return (
    <div className="modal-overlay futurista" onClick={onCerrar}>
      <div className="modal-evento futurista" onClick={e => e.stopPropagation()}>
        <div className="scanline"></div>
        
        <div className="modal-header">
          <h2>{evento.titulo}</h2>
          <button className="btn-cerrar" onClick={onCerrar}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="evento-info">
            <div className="info-item">
              <span className="info-label">FECHA:</span>
              <span className="info-value">{CalendarService.formatearFechaEvento(evento.fecha, true)}</span>
            </div>
            
            <div className="info-item">
              <span className="info-label">HORA:</span>
              <span className="info-value">{evento.hora}</span>
            </div>
            
            <div className="info-item">
              <span className="info-label">TIPO:</span>
              <span className="info-value">{evento.tipo.toUpperCase()}</span>
            </div>
            
            {evento.esTareaEquipo && evento.prioridad && (
              <div className="info-item">
                <span className="info-label">PRIORIDAD:</span>
                <span className={`info-value priority-badge priority-${evento.prioridad}`}>
                  {evento.prioridad.toUpperCase()}
                </span>
              </div>
            )}
            
            {evento.caso && (
              <div className="info-item">
                <span className="info-label">CASO:</span>
                <span className="info-value">{evento.caso}</span>
              </div>
            )}
            
            {evento.cliente && (
              <div className="info-item">
                <span className="info-label">CLIENTE:</span>
                <span className="info-value">{evento.cliente}</span>
              </div>
            )}
            
            {evento.lugar && (
              <div className="info-item">
                <span className="info-label">LUGAR:</span>
                <span className="info-value">{evento.lugar}</span>
              </div>
            )}
            
            {evento.juez && (
              <div className="info-item">
                <span className="info-label">JUEZ:</span>
                <span className="info-value">{evento.juez}</span>
              </div>
            )}
            
            {evento.abogado && (
              <div className="info-item">
                <span className="info-label">ABOGADO:</span>
                <span className="info-value">{evento.abogado}</span>
              </div>
            )}
            
            {evento.asignadoA && (
              <div className="info-item">
                <span className="info-label">ASIGNADO A:</span>
                <span className="info-value">{evento.asignadoA}</span>
              </div>
            )}
            
            {evento.notas && (
              <div className="info-item full-width">
                <span className="info-label">NOTAS:</span>
                <span className="info-value">{evento.notas}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn-modal editar" onClick={() => onEditar(evento)}>
            EDITAR
          </button>
          <button className="btn-modal eliminar" onClick={() => onEliminar(evento)}>
            ELIMINAR
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal para crear nuevo evento
const ModalNuevoEvento = ({ mostrar, onCerrar, onGuardar, fechaSeleccionada, cargando }) => {
  const [formData, setFormData] = React.useState({
    titulo: '',
    tipo: 'audiencia',
    fecha: fechaSeleccionada ? fechaSeleccionada.toISOString().split('T')[0] : '',
    hora: '09:00',
    caso: '',
    lugar: '',
    juez: '',
    abogado: '',
    notas: ''
  });

  React.useEffect(() => {
    if (fechaSeleccionada) {
      setFormData(prev => ({
        ...prev,
        fecha: fechaSeleccionada.toISOString().split('T')[0]
      }));
    }
  }, [fechaSeleccionada]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onGuardar(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!mostrar) return null;

  return (
    <div className="modal-overlay futurista" onClick={onCerrar}>
      <div className="modal-nuevo-evento futurista" onClick={e => e.stopPropagation()}>
        <div className="scanline"></div>
        
        <div className="modal-header">
          <h2>NUEVO EVENTO</h2>
          <button className="btn-cerrar" onClick={onCerrar}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-grid">
            <div className="form-group">
              <label>TÍTULO</label>
              <input
                type="text"
                value={formData.titulo}
                onChange={(e) => handleChange('titulo', e.target.value)}
                placeholder="Título del evento"
                required
              />
            </div>
            
            <div className="form-group">
              <label>TIPO</label>
              <select
                value={formData.tipo}
                onChange={(e) => handleChange('tipo', e.target.value)}
              >
                <option value="audiencia">AUDIENCIA</option>
                <option value="reunion">REUNIÓN</option>
                <option value="vencimiento">VENCIMIENTO</option>
                <option value="cita">CITA</option>
                <option value="recordatorio">RECORDATORIO</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>FECHA</label>
              <input
                type="date"
                value={formData.fecha}
                onChange={(e) => handleChange('fecha', e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>HORA</label>
              <input
                type="time"
                value={formData.hora}
                onChange={(e) => handleChange('hora', e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>CASO</label>
              <input
                type="text"
                value={formData.caso}
                onChange={(e) => handleChange('caso', e.target.value)}
                placeholder="Número o nombre del caso"
              />
            </div>
            
            <div className="form-group">
              <label>LUGAR</label>
              <input
                type="text"
                value={formData.lugar}
                onChange={(e) => handleChange('lugar', e.target.value)}
                placeholder="Ubicación del evento"
              />
            </div>
            
            <div className="form-group">
              <label>JUEZ</label>
              <input
                type="text"
                value={formData.juez}
                onChange={(e) => handleChange('juez', e.target.value)}
                placeholder="Nombre del juez"
              />
            </div>
            
            <div className="form-group">
              <label>ABOGADO</label>
              <input
                type="text"
                value={formData.abogado}
                onChange={(e) => handleChange('abogado', e.target.value)}
                placeholder="Abogado responsable"
              />
            </div>
            
            <div className="form-group full-width">
              <label>NOTAS</label>
              <textarea
                value={formData.notas}
                onChange={(e) => handleChange('notas', e.target.value)}
                placeholder="Notas adicionales"
                rows="3"
              />
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" onClick={onCerrar} className="btn-modal cancelar">
              CANCELAR
            </button>
            <button type="submit" disabled={cargando} className="btn-modal guardar">
              {cargando ? 'GUARDANDO...' : 'GUARDAR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal para editar evento
const ModalEditarEvento = ({ mostrar, onCerrar, onActualizar, evento, cargando }) => {
  const [formData, setFormData] = React.useState({
    titulo: '',
    tipo: 'audiencia',
    fecha: '',
    hora: '09:00',
    caso: '',
    lugar: '',
    juez: '',
    abogado: '',
    notas: ''
  });

  React.useEffect(() => {
    if (evento) {
      setFormData({
        titulo: evento.titulo || '',
        tipo: evento.tipo || 'audiencia',
        fecha: evento.fecha || '',
        hora: evento.hora || '09:00',
        caso: evento.caso || '',
        lugar: evento.lugar || '',
        juez: evento.juez || '',
        abogado: evento.abogado || '',
        notas: evento.notas || ''
      });
    }
  }, [evento]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onActualizar(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!mostrar || !evento) return null;

  return (
    <div className="modal-overlay futurista" onClick={onCerrar}>
      <div className="modal-editar-evento futurista" onClick={e => e.stopPropagation()}>
        <div className="scanline"></div>
        
        <div className="modal-header">
          <h2>EDITAR EVENTO</h2>
          <button className="btn-cerrar" onClick={onCerrar}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-grid">
            <div className="form-group">
              <label>TÍTULO</label>
              <input
                type="text"
                value={formData.titulo}
                onChange={(e) => handleChange('titulo', e.target.value)}
                placeholder="Título del evento"
                required
              />
            </div>
            
            <div className="form-group">
              <label>TIPO</label>
              <select
                value={formData.tipo}
                onChange={(e) => handleChange('tipo', e.target.value)}
              >
                <option value="audiencia">AUDIENCIA</option>
                <option value="reunion">REUNIÓN</option>
                <option value="vencimiento">VENCIMIENTO</option>
                <option value="cita">CITA</option>
                <option value="recordatorio">RECORDATORIO</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>FECHA</label>
              <input
                type="date"
                value={formData.fecha}
                onChange={(e) => handleChange('fecha', e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>HORA</label>
              <input
                type="time"
                value={formData.hora}
                onChange={(e) => handleChange('hora', e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>CASO</label>
              <input
                type="text"
                value={formData.caso}
                onChange={(e) => handleChange('caso', e.target.value)}
                placeholder="Número o nombre del caso"
              />
            </div>
            
            <div className="form-group">
              <label>LUGAR</label>
              <input
                type="text"
                value={formData.lugar}
                onChange={(e) => handleChange('lugar', e.target.value)}
                placeholder="Ubicación del evento"
              />
            </div>
            
            <div className="form-group">
              <label>JUEZ</label>
              <input
                type="text"
                value={formData.juez}
                onChange={(e) => handleChange('juez', e.target.value)}
                placeholder="Nombre del juez"
              />
            </div>
            
            <div className="form-group">
              <label>ABOGADO</label>
              <input
                type="text"
                value={formData.abogado}
                onChange={(e) => handleChange('abogado', e.target.value)}
                placeholder="Abogado responsable"
              />
            </div>
            
            <div className="form-group full-width">
              <label>NOTAS</label>
              <textarea
                value={formData.notas}
                onChange={(e) => handleChange('notas', e.target.value)}
                placeholder="Notas adicionales"
                rows="3"
              />
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" onClick={onCerrar} className="btn-modal cancelar">
              CANCELAR
            </button>
            <button type="submit" disabled={cargando} className="btn-modal actualizar">
              {cargando ? 'ACTUALIZANDO...' : 'ACTUALIZAR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal para eliminar evento
const ModalEliminarEvento = ({ mostrar, onCerrar, onConfirmar, evento, cargando }) => {
  if (!mostrar || !evento) return null;

  return (
    <div className="modal-overlay futurista" onClick={onCerrar}>
      <div className="modal-eliminar-evento futurista" onClick={e => e.stopPropagation()}>
        <div className="scanline"></div>
        
        <div className="modal-header eliminar">
          <h2>ELIMINAR EVENTO</h2>
          <button className="btn-cerrar" onClick={onCerrar}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="warning-message">
            ⚠️ ADVERTENCIA: ESTA ACCIÓN NO SE PUEDE DESHACER
          </div>
          
          <div className="evento-preview">
            <div className="preview-item">
              <span className="preview-label">EVENTO:</span>
              <span className="preview-value">{evento.titulo}</span>
            </div>
            
            <div className="preview-item">
              <span className="preview-label">FECHA:</span>
              <span className="preview-value">{CalendarService.formatearFechaHoraCompleta(evento.fecha, evento.hora)}</span>
            </div>
            
            {evento.caso && (
              <div className="preview-item">
                <span className="preview-label">CASO:</span>
                <span className="preview-value">{evento.caso}</span>
              </div>
            )}
          </div>
          
          <div className="confirmation-message">
            ¿CONFIRMAS LA ELIMINACIÓN DE ESTE EVENTO?
          </div>
        </div>
        
        <div className="modal-footer">
          <button onClick={onCerrar} className="btn-modal cancelar">
            CANCELAR
          </button>
          <button 
            onClick={() => onConfirmar(evento)} 
            disabled={cargando} 
            className="btn-modal eliminar-confirmar"
          >
            {cargando ? 'ELIMINANDO...' : 'CONFIRMAR ELIMINACIÓN'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalendarioView;