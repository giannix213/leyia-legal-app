// src/components/Casos.jsx
import { useState, useEffect } from 'react';
import { useCasos } from '../hooks/useCasos';
import { useOrganizacionContext } from '../contexts/OrganizacionContext';
import { getColorPorTipo, getImagenPorTipo, getEmojiPorTipo, getColorEstadoPorTipo } from '../utils/casosUtils';
import ExpedienteModal from './ExpedienteModal';
import ExpedienteForm from './ExpedienteForm';
import ContextMenu from './ContextMenu';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import './CasosScrollEffect.css';
import './CasosAgrupacion.css';
import VistaGeneralExpedientes from './VistaGeneralExpedientes';

function Casos({ 
  busqueda = '', 
  onBusquedaChange = () => {}, 
  vistaActiva = 'activos', 
  onVistaActivaChange = () => {}, 
  showModal = false, 
  onShowModalChange = () => {},
  onMostrarPerfil = () => {}
}) {
  console.log('🎬 [CASOS COMPONENT] Renderizando componente Casos');
  console.log('📥 [CASOS COMPONENT] Props recibidas:', { busqueda, vistaActiva, showModal });
  
  const { casos, cargando, eliminarCaso, agregarCaso, actualizarCaso, cargarCasos } = useCasos();
  const { organizacionActual } = useOrganizacionContext();
  
  console.log('🔗 [CASOS COMPONENT] Hook useCasos:', { 
    casosLength: casos.length, 
    cargando,
    organizacionId: organizacionActual?.id 
  });
  
  // Debug temporal - mostrar información de la organización
  console.log('🏢 [CASOS COMPONENT] Organización actual:', organizacionActual);
  
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [casosOrdenados, setCasosOrdenados] = useState([]);
  const [selectedExpediente, setSelectedExpediente] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estados para agrupación y observaciones
  const [vistaAgrupada, setVistaAgrupada] = useState(false);
  const [observacionesEditando, setObservacionesEditando] = useState({});
  const [observacionesTemp, setObservacionesTemp] = useState({});
  
  // Estados para el menú contextual
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    expediente: null
  });
  
  // Esta función es la que conectará los botones con Firebase
const handleMarcarTipo = async (id, tipo) => {
  try {
    // 'tipo' será 'tarea', 'coordinacion' o 'diligencia'
    await actualizarCaso(id, { tipoTarea: tipo });
    
    // Actualizamos el estado local para que la Vista General se entere al instante
    setCasosOrdenados(prev => 
      prev.map(c => c.id === id ? { ...c, tipoTarea: tipo } : c)
    );
  } catch (error) {
    console.error("Error al marcar el tipo:", error);
  }
};
  // Estados para el modal de confirmación
  const [confirmDelete, setConfirmDelete] = useState({
    isOpen: false,
    expediente: null,
    isDeleting: false
  });

  // Agrega esto debajo de tus otros estados
  const [mostrarVistaGeneral, setMostrarVistaGeneral] = useState(false);

  // Actualizar casos ordenados cuando cambien los casos originales
  useEffect(() => {
    console.log('🔄 [CASOS COMPONENT] Casos recibidos:', casos.length);
    console.log('🔍 [CASOS COMPONENT] Organización:', organizacionActual?.id);
    console.log('🔍 [CASOS COMPONENT] Vista activa:', vistaActiva);
    console.log('🔍 [CASOS COMPONENT] Búsqueda:', busqueda);
    console.log('📋 [CASOS COMPONENT] Casos completos:', casos);
    
    let casosFiltrados = [...casos]; // Crear copia para evitar mutaciones
    console.log('📦 [CASOS COMPONENT] Casos antes de filtros:', casosFiltrados.length);
    
    // Filtrar por búsqueda si existe
    if (busqueda && busqueda.trim() !== '') {
      const terminoBusqueda = busqueda.toLowerCase();
      casosFiltrados = casosFiltrados.filter(caso => 
        caso.numero?.toLowerCase().includes(terminoBusqueda) ||
        caso.cliente?.toLowerCase().includes(terminoBusqueda) ||
        caso.demandado?.toLowerCase().includes(terminoBusqueda) ||
        caso.descripcion?.toLowerCase().includes(terminoBusqueda) ||
        caso.tipo?.toLowerCase().includes(terminoBusqueda)
      );
      console.log('🔍 [CASOS COMPONENT] Después de filtro de búsqueda:', casosFiltrados.length);
    }
    
    // Filtrar por vista activa (activos/archivados)
    if (vistaActiva === 'archivados') {
      casosFiltrados = casosFiltrados.filter(caso => caso.archivado === true);
      console.log('📁 [CASOS COMPONENT] Mostrando archivados:', casosFiltrados.length);
    } else {
      casosFiltrados = casosFiltrados.filter(caso => caso.archivado !== true);
      console.log('✅ [CASOS COMPONENT] Mostrando activos:', casosFiltrados.length);
    }
    
    console.log('📊 [CASOS COMPONENT] Casos FINALES después de filtros:', casosFiltrados.length);
    console.log('📋 [CASOS COMPONENT] Casos filtrados detalle:', casosFiltrados);
    console.log('🎯 [CASOS COMPONENT] Actualizando casosOrdenados con', casosFiltrados.length, 'casos');
    
    setCasosOrdenados(casosFiltrados);
  }, [casos, busqueda, vistaActiva, organizacionActual?.id]);

  // Funciones para edición de observaciones
  const iniciarEdicionObservaciones = (casoId, observacionesActuales) => {
    setObservacionesEditando(prev => ({ ...prev, [casoId]: true }));
    setObservacionesTemp(prev => ({ ...prev, [casoId]: observacionesActuales || '' }));
  };

  const cancelarEdicionObservaciones = (casoId) => {
    setObservacionesEditando(prev => {
      const nuevo = { ...prev };
      delete nuevo[casoId];
      return nuevo;
    });
    setObservacionesTemp(prev => {
      const nuevo = { ...prev };
      delete nuevo[casoId];
      return nuevo;
    });
  };

  const guardarObservaciones = async (casoId) => {
    try {
      const nuevasObservaciones = observacionesTemp[casoId] || '';
      await actualizarCaso(casoId, { observaciones: nuevasObservaciones });
      
      // Limpiar estados de edición
      cancelarEdicionObservaciones(casoId);
      
    } catch (error) {
      console.error('Error guardando observaciones:', error);
      alert('Error al guardar las observaciones');
    }
  };

  // Función para agrupar casos por tipo
  const agruparCasosPorTipo = (casos) => {
    const grupos = {};
    
    casos.forEach(caso => {
      const tipo = caso.tipo || 'Sin Tipo';
      if (!grupos[tipo]) {
        grupos[tipo] = [];
      }
      grupos[tipo].push(caso);
    });
    
    return grupos;
  };

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedItem === null || draggedItem === dropIndex) {
      setDraggedItem(null);
      setDragOverIndex(null);
      return;
    }

    const newCasos = [...casosOrdenados];
    const draggedCase = newCasos[draggedItem];
    
    // Remover el elemento arrastrado
    newCasos.splice(draggedItem, 1);
    
    // Insertar en la nueva posición
    newCasos.splice(dropIndex, 0, draggedCase);
    
    setCasosOrdenados(newCasos);
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  // Función para abrir el modal del expediente
  const handleExpedienteClick = (caso) => {
    setSelectedExpediente(caso);
    setIsModalOpen(true);
  };

  // Función para cerrar el modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedExpediente(null);
    // Ya no necesitamos recargar manualmente, el listener en tiempo real lo hace automáticamente
  };

  // Función para cerrar el modal de nuevo expediente
  const handleCloseNewExpedienteModal = () => {
    if (onShowModalChange) {
      onShowModalChange(false);
    }
  };

  // Función para manejar el éxito al crear un nuevo expediente
  const handleNewExpedienteSuccess = () => {
    handleCloseNewExpedienteModal();
    // Los casos se recargarán automáticamente por el hook useCasos
  };

  // Función para manejar clic derecho
  const handleRightClick = (e, caso) => {
    e.preventDefault();
    e.stopPropagation();
    
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      expediente: caso
    });
  };

  // Función para cerrar el menú contextual
  const handleCloseContextMenu = () => {
    setContextMenu({
      visible: false,
      x: 0,
      y: 0,
      expediente: null
    });
  };

  // Función para manejar la eliminación desde el menú contextual
  const handleDeleteFromContext = (expediente) => {
    setConfirmDelete({
      isOpen: true,
      expediente: expediente,
      isDeleting: false
    });
  };

  // Función para cerrar el modal de confirmación
  const handleCloseConfirmDelete = () => {
    setConfirmDelete({
      isOpen: false,
      expediente: null,
      isDeleting: false
    });
  };

  // Función para confirmar la eliminación
  const handleConfirmDelete = async () => {
    if (!confirmDelete.expediente) return;

    setConfirmDelete(prev => ({ ...prev, isDeleting: true }));

    try {
      await eliminarCaso(confirmDelete.expediente.id);
      
      // Cerrar modal de confirmación
      handleCloseConfirmDelete();
      
    } catch (error) {
      console.error('Error al eliminar expediente:', error);
      // Aquí podrías mostrar un mensaje de error al usuario
      setConfirmDelete(prev => ({ ...prev, isDeleting: false }));
    }
  };

  // Cerrar menú contextual al hacer clic fuera o scroll
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        handleCloseContextMenu();
      }
    };

    const handleScroll = () => {
      if (contextMenu.visible) {
        handleCloseContextMenu();
      }
    };

    if (contextMenu.visible) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('scroll', handleScroll, true);
      
      return () => {
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [contextMenu.visible]);

  if (cargando) {
    return (
      <div className="galactic-mainframe">
        <div className="casos-grid-view">
          <div className="casos-container-modern">
            <div className="loading-state">
              <div className="loading-icon">⚖️</div>
              <div className="loading-text">Cargando expedientes...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (casosOrdenados.length === 0) {
    console.log('⚠️ [CASOS COMPONENT] Mostrando estado vacío');
    console.log('📊 [CASOS COMPONENT] casos.length:', casos.length);
    console.log('📊 [CASOS COMPONENT] casosOrdenados.length:', casosOrdenados.length);
    console.log('📊 [CASOS COMPONENT] vistaActiva:', vistaActiva);
    console.log('📊 [CASOS COMPONENT] busqueda:', busqueda);
    
    return (
      <div className="galactic-mainframe">
        <div className="casos-grid-view">
          <div className="casos-container-modern">
            <div className="empty-state">
              <div className="empty-icon">⚖️</div>
              <div className="empty-text">
                {casos.length === 0 
                  ? 'No hay casos registrados en la base de datos' 
                  : `No hay casos ${vistaActiva === 'archivados' ? 'archivados' : 'activos'}${busqueda ? ` que coincidan con "${busqueda}"` : ''}`
                }
              </div>
              <div style={{ 
                marginTop: '20px', 
                fontSize: '14px', 
                color: '#fff',
                background: 'rgba(59, 130, 246, 0.2)',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}>
                <p style={{ margin: '5px 0', fontWeight: 'bold' }}>🔍 DIAGNÓSTICO:</p>
                <p style={{ margin: '5px 0' }}>Total de casos en BD: <strong>{casos.length}</strong></p>
                <p style={{ margin: '5px 0' }}>Casos después de filtros: <strong>{casosOrdenados.length}</strong></p>
                <p style={{ margin: '5px 0' }}>Vista actual: <strong>{vistaActiva}</strong></p>
                {busqueda && <p style={{ margin: '5px 0' }}>Búsqueda: <strong>"{busqueda}"</strong></p>}
                <p style={{ margin: '5px 0' }}>Organización: <strong>{organizacionActual?.id || 'No definida'}</strong></p>
                <p style={{ margin: '10px 0 5px 0', fontSize: '12px', color: '#fbbf24' }}>
                  💡 Si ves casos en BD pero no se muestran, presiona <strong>Ctrl+Shift+R</strong> para refrescar
                </p>
              </div>
              {casos.length === 0 && (
                <button 
                  onClick={() => onShowModalChange(true)}
                  style={{
                    marginTop: '20px',
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  + Crear Primer Expediente
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista General de Expedientes
  if (mostrarVistaGeneral) {
    return (
      <VistaGeneralExpedientes
        expedientesOrdenados={casosOrdenados} 
        onVolver={() => setMostrarVistaGeneral(false)}
        onRecargar={cargarCasos}
        onActualizarExpediente={actualizarCaso}
      />
    );
  }

  return (
    <div className="galactic-mainframe">
      {/* Galactic Header - Solo para vista de casos */}
      <div className="galactic-header">
        <div className="title-area">
          <h1>CASOS ACTIVOS</h1>
          <div className="subtitle">SECTOR_JUDICIAL_076</div>
        </div>
        <div className="search-bar">
          <span style={{marginRight: '10px', color: 'var(--accent-cyan)'}}>🔍</span>
          <input
            type="text"
            placeholder="BUSCAR EXPEDIENTE..."
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
          />
        </div>
        <div className="top-nav-buttons">
          {/* Botón para Vista General */}
          <div 
            className="nav-btn"
            onClick={() => setMostrarVistaGeneral(true)}
            title="Vista General de Tareas"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              boxShadow: '0 0 15px rgba(59, 130, 246, 0.5)'
            }}
          >
            📋
          </div>
          <div 
            className="nav-btn"
            onClick={() => {
              onVistaActivaChange(vistaActiva === 'activos' ? 'archivados' : 'activos');
            }}
            title={vistaActiva === 'archivados' ? 'Ver Casos Activos' : 'Ver Archivados'}
          >
            📁
          </div>
          <div 
            className="nav-btn btn-plus"
            onClick={() => onShowModalChange(true)}
            title="Nuevo Expediente"
          >
            +
          </div>
          <div 
            className="user-profile"
            onClick={() => onMostrarPerfil && onMostrarPerfil()}
          >
            <div className="status-light"></div>
            <span>PERFIL</span>
          </div>
        </div>
      </div>
      


      {/* Contenido directo sin contenedores limitantes */}
      {/* Contenido según la vista seleccionada */}
      {vistaAgrupada ? (
          /* Vista Agrupada por Tipo */
          <div className="casos-vista-agrupada">
            {(() => {
              const grupos = agruparCasosPorTipo(casosOrdenados);
              return Object.keys(grupos).sort().map(tipo => (
                <div key={tipo} className="casos-grupo-tipo" style={{ marginBottom: '32px' }}>
                  {/* Header del Grupo */}
                  <div 
                    className="casos-grupo-header"
                    style={{
                      borderLeft: `4px solid ${getColorPorTipo(tipo)}`,
                      background: `linear-gradient(to right, ${getColorPorTipo(tipo)}15, transparent)`,
                      padding: '12px 15px',
                      borderRadius: '12px',
                      marginBottom: '12px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${getColorPorTipo(tipo)} 0%, ${getColorPorTipo(tipo)}CC 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        boxShadow: `0 4px 12px ${getColorPorTipo(tipo)}40`
                      }}>
                        {getEmojiPorTipo(tipo)}
                      </div>
                      <div>
                        <h3 style={{
                          margin: 0,
                          color: '#0f172a',
                          fontSize: '18px',
                          fontWeight: '700',
                          fontFamily: '"Montserrat", sans-serif'
                        }}>
                          {tipo.toUpperCase()}
                        </h3>
                        <p style={{
                          margin: 0,
                          color: '#64748b',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}>
                          {grupos[tipo].length} expediente{grupos[tipo].length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Grid de casos del grupo */}
                  <div className="casos-grid-card">
                    {grupos[tipo].map((caso, index) => {
                      const imagenFondo = getImagenPorTipo(caso.tipo);
                      const colorTipo = getColorPorTipo(caso.tipo);
                      const emojiTipo = getEmojiPorTipo(caso.tipo);
                      const colorEstado = getColorEstadoPorTipo(caso.tipo);
                      
                      return (
                        <div 
                          key={caso.id} 
                          className="caso-card-game"
                          onClick={() => handleExpedienteClick(caso)}
                          onContextMenu={(e) => handleRightClick(e, caso)}
                        >
                          {/* Imagen de fondo */}
                          <div 
                            className="card-background"
                            style={{
                              backgroundImage: `url(${imagenFondo})`,
                            }}
                          />
                          
                          {/* Overlay con gradiente del color del tipo */}
                          <div 
                            className="card-overlay"
                            style={{
                              background: `linear-gradient(135deg, ${colorTipo}E6 0%, ${colorTipo}B3 50%, ${colorTipo}CC 100%)`
                            }}
                          />

                          {/* Contenido de la tarjeta */}
                          <div className="card-content">
                            {/* Header con número y tipo */}
                            <div className="card-header">
                              <div className="numero-container">
                                <div 
                                  className="numero-badge-circle"
                                  style={{ backgroundColor: colorTipo }}
                                >
                                  {emojiTipo}
                                </div>
                                <span className="numero-text">{caso.numero}</span>
                              </div>
                              <div 
                                className="tipo-badge"
                                style={{ backgroundColor: colorTipo }}
                              >
                                {(caso.tipo || 'Sin tipo').toUpperCase()}
                              </div>
                            </div>

                            {/* Materia principal con estado al lado */}
                            <div className="materia-estado-container">
                              <div className="materia-principal">
                                {caso.descripcion || 'SIN MATERIA ESPECIFICADA'}
                              </div>
                              <div className="estado-badge-lateral">
                                <span className="badge-icon">📋</span>
                                <span className="badge-text">
                                  {(caso.estado || 'Sin estado').replace('_', ' ')}
                                </span>
                              </div>
                            </div>

                            {/* Información adicional en grid */}
                            <div className="info-grid">
                              {/* Primera fila - Observaciones editables */}
                              <div className="info-row">
                                <div className="info-badge observaciones" style={{ width: '100%' }}>
                                  <span className="badge-icon">📝</span>
                                  {observacionesEditando[caso.id] ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
                                      <input
                                        type="text"
                                        value={observacionesTemp[caso.id] || ''}
                                        onChange={(e) => setObservacionesTemp(prev => ({ 
                                          ...prev, 
                                          [caso.id]: e.target.value 
                                        }))}
                                        onKeyPress={(e) => {
                                          if (e.key === 'Enter') {
                                            e.stopPropagation();
                                            guardarObservaciones(caso.id);
                                          } else if (e.key === 'Escape') {
                                            e.stopPropagation();
                                            cancelarEdicionObservaciones(caso.id);
                                          }
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                          background: 'rgba(0, 0, 0, 0.3)',
                                          border: '1px solid #00ccff',
                                          borderRadius: '4px',
                                          padding: '2px 6px',
                                          color: 'white',
                                          fontSize: '10px',
                                          flex: 1,
                                          minWidth: '100px'
                                        }}
                                        placeholder="Escribir observaciones..."
                                        autoFocus
                                      />
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          guardarObservaciones(caso.id);
                                        }}
                                        style={{
                                          background: '#10b981',
                                          border: 'none',
                                          borderRadius: '3px',
                                          color: 'white',
                                          padding: '2px 4px',
                                          fontSize: '8px',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        ✓
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          cancelarEdicionObservaciones(caso.id);
                                        }}
                                        style={{
                                          background: '#ef4444',
                                          border: 'none',
                                          borderRadius: '3px',
                                          color: 'white',
                                          padding: '2px 4px',
                                          fontSize: '8px',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ) : (
                                    <span 
                                      className="badge-text"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        iniciarEdicionObservaciones(caso.id, caso.observaciones);
                                      }}
                                      style={{ 
                                        cursor: 'pointer',
                                        flex: 1,
                                        textAlign: 'left',
                                        minHeight: '16px',
                                        display: 'flex',
                                        alignItems: 'center'
                                      }}
                                      title="Clic para editar observaciones"
                                    >
                                      {(caso.observaciones && caso.observaciones.trim() !== '') ? 
                                        (caso.observaciones.length > 25 ? 
                                          caso.observaciones.substring(0, 25) + '...' : 
                                          caso.observaciones) : 
                                        'Clic para agregar observaciones...'}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Segunda fila - Último actuado */}
                              <div className="info-row">
                                <div 
                                  className="info-badge ultimo-actuado"
                                  style={{ backgroundColor: colorEstado }}
                                >
                                  <span className="badge-icon">⚡</span>
                                  <span className="badge-text">
                                    {(caso.ultimoActuado && caso.ultimoActuado.trim() !== '') ? 
                                      (caso.ultimoActuado.length > 25 ? 
                                        caso.ultimoActuado.substring(0, 25) + '...' : 
                                        caso.ultimoActuado) : 
                                      'En trámite'}
                                  </span>
                                </div>
                              </div>

                              {/* Tercera fila - Órgano y Demandado */}
                              <div className="info-row">
                                {caso.organoJurisdiccional && (
                                  <div className="info-badge juzgado">
                                    <span className="badge-icon">🏛️</span>
                                    <span className="badge-text">
                                      {caso.organoJurisdiccional.length > 20 ? 
                                        caso.organoJurisdiccional.substring(0, 20) + '...' : 
                                        caso.organoJurisdiccional}
                                    </span>
                                  </div>
                                )}

                                {caso.demandado && (
                                  <div className="info-badge demandado">
                                    <span className="badge-icon">⚖️</span>
                                    <span className="badge-text">
                                      Vs. {caso.demandado.length > 15 ? 
                                        caso.demandado.substring(0, 15) + '...' : 
                                        caso.demandado}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Cuarta fila - Audiencia */}
                              {caso.fechaAudiencia && (
                                <div className="info-row">
                                  <div className="info-badge audiencia">
                                    <span className="badge-icon">📅</span>
                                    <span className="badge-text">
                                      {new Date(caso.fechaAudiencia).toLocaleDateString('es-PE', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: '2-digit'
                                      })}
                                      {caso.horaAudiencia && ` ${caso.horaAudiencia}`}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Footer con cliente */}
                            <div className="card-footer">
                              <div className="cliente-badge">
                                <span className="cliente-icon">👤</span>
                                <span className="cliente-text">
                                  {(caso.cliente || caso.demandante || 'Por definir').toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ));
            })()}
          </div>
        ) : (
          /* Vista Normal - Grid directo de todas las tarjetas */
          <div className="casos-grid-card">
          {casosOrdenados.map((caso, index) => {
            const imagenFondo = getImagenPorTipo(caso.tipo);
            const colorTipo = getColorPorTipo(caso.tipo);
            const emojiTipo = getEmojiPorTipo(caso.tipo);
            const colorEstado = getColorEstadoPorTipo(caso.tipo); // Nuevo: color para el estado
            
            return (
              <div 
                key={caso.id} 
                className={`caso-card-game ${draggedItem === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => handleExpedienteClick(caso)}
                onContextMenu={(e) => handleRightClick(e, caso)}
              >
                {/* Imagen de fondo */}
                <div 
                  className="card-background"
                  style={{
                    backgroundImage: `url(${imagenFondo})`,
                  }}
                />
                
                {/* Overlay con gradiente del color del tipo */}
                <div 
                  className="card-overlay"
                  style={{
                    background: `linear-gradient(135deg, ${colorTipo}E6 0%, ${colorTipo}B3 50%, ${colorTipo}CC 100%)`
                  }}
                />

                {/* Contenido de la tarjeta */}
                <div className="card-content">
                  {/* Header con número y tipo */}
                  <div className="card-header">
                    <div className="numero-container">
                      <div 
                        className="numero-badge-circle"
                        style={{ backgroundColor: colorTipo }}
                      >
                        {emojiTipo}
                      </div>
                      <span className="numero-text">{caso.numero}</span>
                    </div>
                    <div 
                      className="tipo-badge"
                      style={{ backgroundColor: colorTipo }}
                    >
                      {(caso.tipo || 'Sin tipo').toUpperCase()}
                    </div>
                  </div>

                  {/* Materia principal con estado al lado */}
                  <div className="materia-estado-container">
                    <div className="materia-principal">
                      {caso.descripcion || 'SIN MATERIA ESPECIFICADA'}
                    </div>
                    <div className="estado-badge-lateral">
                      <span className="badge-icon">📋</span>
                      <span className="badge-text">
                        {(caso.estado || 'Sin estado').replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Información adicional en grid */}
                  <div className="info-grid">
                    {/* Primera fila - Observaciones */}
                    <div className="info-row">
                      {/* Observaciones editables */}
                      <div className="info-badge observaciones" style={{ width: '100%' }}>
                        <span className="badge-icon">📝</span>
                        {observacionesEditando[caso.id] ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
                            <input
                              type="text"
                              value={observacionesTemp[caso.id] || ''}
                              onChange={(e) => setObservacionesTemp(prev => ({ 
                                ...prev, 
                                [caso.id]: e.target.value 
                              }))}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.stopPropagation();
                                  guardarObservaciones(caso.id);
                                } else if (e.key === 'Escape') {
                                  e.stopPropagation();
                                  cancelarEdicionObservaciones(caso.id);
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                background: 'rgba(0, 0, 0, 0.3)',
                                border: '1px solid #00ccff',
                                borderRadius: '4px',
                                padding: '2px 6px',
                                color: 'white',
                                fontSize: '10px',
                                flex: 1,
                                minWidth: '100px'
                              }}
                              placeholder="Escribir observaciones..."
                              autoFocus
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                guardarObservaciones(caso.id);
                              }}
                              style={{
                                background: '#10b981',
                                border: 'none',
                                borderRadius: '3px',
                                color: 'white',
                                padding: '2px 4px',
                                fontSize: '8px',
                                cursor: 'pointer'
                              }}
                            >
                              ✓
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                cancelarEdicionObservaciones(caso.id);
                              }}
                              style={{
                                background: '#ef4444',
                                border: 'none',
                                borderRadius: '3px',
                                color: 'white',
                                padding: '2px 4px',
                                fontSize: '8px',
                                cursor: 'pointer'
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <span 
                            className="badge-text"
                            onClick={(e) => {
                              e.stopPropagation();
                              iniciarEdicionObservaciones(caso.id, caso.observaciones);
                            }}
                            style={{ 
                              cursor: 'pointer',
                              flex: 1,
                              textAlign: 'left',
                              minHeight: '16px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Clic para editar observaciones"
                          >
                            {(caso.observaciones && caso.observaciones.trim() !== '') ? 
                              (caso.observaciones.length > 25 ? 
                                caso.observaciones.substring(0, 25) + '...' : 
                                caso.observaciones) : 
                              'Clic para agregar observaciones...'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Segunda fila - Último actuado */}
                    <div className="info-row">
                      <div 
                        className="info-badge ultimo-actuado"
                        style={{ backgroundColor: colorEstado }}
                      >
                        <span className="badge-icon">⚡</span>
                        <span className="badge-text">
                          {(caso.ultimoActuado && caso.ultimoActuado.trim() !== '') ? 
                            (caso.ultimoActuado.length > 25 ? 
                              caso.ultimoActuado.substring(0, 25) + '...' : 
                              caso.ultimoActuado) : 
                            'En trámite'}
                        </span>
                      </div>
                    </div>

                    {/* Tercera fila - Órgano y Demandado */}
                    <div className="info-row">
                      {caso.organoJurisdiccional && (
                        <div className="info-badge juzgado">
                          <span className="badge-icon">🏛️</span>
                          <span className="badge-text">
                            {caso.organoJurisdiccional.length > 20 ? 
                              caso.organoJurisdiccional.substring(0, 20) + '...' : 
                              caso.organoJurisdiccional}
                          </span>
                        </div>
                      )}

                      {caso.demandado && (
                        <div className="info-badge demandado">
                          <span className="badge-icon">⚖️</span>
                          <span className="badge-text">
                            Vs. {caso.demandado.length > 15 ? 
                              caso.demandado.substring(0, 15) + '...' : 
                              caso.demandado}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Cuarta fila - Audiencia */}
                    {caso.fechaAudiencia && (
                      <div className="info-row">
                        <div className="info-badge audiencia">
                          <span className="badge-icon">📅</span>
                          <span className="badge-text">
                            {new Date(caso.fechaAudiencia).toLocaleDateString('es-PE', {
                              day: '2-digit',
                              month: '2-digit',
                              year: '2-digit'
                            })}
                            {caso.horaAudiencia && ` ${caso.horaAudiencia}`}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer con cliente */}
                  <div className="card-footer">
                    <div className="cliente-badge">
                      <span className="cliente-icon">👤</span>
                      <span className="cliente-text">
                        {(caso.cliente || caso.demandante || 'Por definir').toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}

      {/* Modal del Expediente - Renderizado fuera del contenedor principal */}
      <ExpedienteModal 
        expediente={selectedExpediente}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onMarcarTipo={handleMarcarTipo}
      />

      {/* Modal de Nuevo Expediente */}
      <ExpedienteForm
        isOpen={showModal}
        onClose={handleCloseNewExpedienteModal}
        onSuccess={handleNewExpedienteSuccess}
        onAgregarCaso={agregarCaso}
      />

      {/* Menú Contextual */}
      <ContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={handleCloseContextMenu}
        onDelete={handleDeleteFromContext}
        expediente={contextMenu.expediente}
      />

      {/* Modal de Confirmación de Eliminación */}
      <ConfirmDeleteModal
        isOpen={confirmDelete.isOpen}
        onClose={handleCloseConfirmDelete}
        onConfirm={handleConfirmDelete}
        expediente={confirmDelete.expediente}
        isDeleting={confirmDelete.isDeleting}
      />
    </div>
  );
}

export default Casos;