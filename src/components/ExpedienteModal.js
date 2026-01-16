// ExpedienteModalComplete.js - Modal completo con análisis, gráficos y ExpedienteVirtual
import React, { useState } from 'react';
import './ExpedienteModal.css';
import { useCasos } from '../hooks/useCasos';
import { useDocumentos } from '../hooks/useDocumentos';
import ExpedienteVirtual from './ExpedienteVirtual';

const ExpedienteModal = ({ expediente, isOpen, onClose }) => {
  const [activeAnalysisTab, setActiveAnalysisTab] = useState('timeline');
  const [acciones, setAcciones] = useState([
    { id: 1, tipo: 'Diligencia', descripcion: 'Solicitar copias certificadas', fecha: '2024-01-15', completada: false },
    { id: 2, tipo: 'Escrito', descripcion: 'Presentar alegatos finales', fecha: '2024-01-20', completada: true },
    { id: 3, tipo: 'Coordinacion', descripcion: 'Reunion con cliente', fecha: '2024-01-25', completada: false }
  ]);
  
  // Estado para edicion de datos
  const [datosExpediente, setDatosExpediente] = useState({});
  const [mostrarFormularioAccion, setMostrarFormularioAccion] = useState(null);
  const [nuevaAccion, setNuevaAccion] = useState({ descripcion: '', fecha: '' });

  // Estados para el manejo de documentos
  const {
    documentos,
    cargando: cargandoDocumentos,
    subiendo,
    cargarDocumentos,
    subirArchivo,
    eliminarDocumento,
    descargarDocumento,
    abrirExploradorArchivos
  } = useDocumentos(expediente?.id);

  // Hook para actualizar casos en Firebase
  const { actualizarCaso } = useCasos();

  // Estado para modo compacto
  const [modoCompacto, setModoCompacto] = useState(false);

  // Estado para cancelar subida
  const [cancelarSubida, setCancelarSubida] = useState(null);

  // Estado para indicar guardado automático
  const [guardando, setGuardando] = useState(false);
  const [ultimoGuardado, setUltimoGuardado] = useState(null);
  const [timeoutGuardado, setTimeoutGuardado] = useState(null);

  // Estados para renombrar documentos
  const [documentoEditando, setDocumentoEditando] = useState(null);
  const [nuevoNombreDocumento, setNuevoNombreDocumento] = useState('');

  // Detectar si necesitamos modo compacto basado en la altura de la ventana
  React.useEffect(() => {
    const detectarModoCompacto = () => {
      const alturaVentana = window.innerHeight;
      setModoCompacto(alturaVentana < 900);
    };

    detectarModoCompacto();
    window.addEventListener('resize', detectarModoCompacto);

    return () => {
      window.removeEventListener('resize', detectarModoCompacto);
    };
  }, []);

  // Auto-rotate analysis tabs every 10 seconds
  React.useEffect(() => {
    const tabs = ['timeline', 'etapas', 'estadisticas'];
    const interval = setInterval(() => {
      setActiveAnalysisTab(current => {
        const currentIndex = tabs.indexOf(current);
        const nextIndex = (currentIndex + 1) % tabs.length;
        return tabs[nextIndex];
      });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Inicializar datos del expediente y cargar documentos
  React.useEffect(() => {
    if (expediente) {
      setDatosExpediente({
        numero: expediente.numero || '',
        descripcion: expediente.descripcion || '',
        tipo: expediente.tipo || '',
        estado: expediente.estado || '',
        cliente: expediente.cliente || expediente.demandante || '',
        demandante: expediente.demandante || '',
        demandado: expediente.demandado || '',
        inicioProceso: expediente.inicioProceso || '',
        distritoJudicial: expediente.distritoJudicial || '',
        organoJurisdiccional: expediente.organoJurisdiccional || '',
        abogado: expediente.abogado || '',
        juez: expediente.juez || '',
        especialista: expediente.especialistaLegal || expediente.especialista || '',
        fechaAudiencia: expediente.fechaAudiencia || '',
        ultimoActuado: expediente.ultimoActuado || '',
        observaciones: expediente.observaciones || ''
      });
      
      // Cargar documentos cuando se abre el modal
      if (isOpen && expediente.id) {
        cargarDocumentos();
      }
    }
  }, [expediente, isOpen, cargarDocumentos]);

  // Prevenir scroll del body cuando el modal esta abierto
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Atajos de teclado para documentos
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+U para agregar documentos
      if (e.ctrlKey && e.key === 'u' && isOpen) {
        e.preventDefault();
        if (!subiendo) {
          handleAgregarDocumentos();
        }
      }
      
      // Escape para cancelar edición de nombre
      if (e.key === 'Escape' && documentoEditando) {
        cancelarEdicionNombre();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, subiendo, documentoEditando]);

  if (!isOpen || !expediente) return null;

  // ===== DATOS DE EJEMPLO PARA ANÁLISIS =====
  
  const timelineData = [
    { mes: 'Ene 2024', actividad: 'Inscripción', nivel: 8 },
    { mes: 'Feb 2024', actividad: 'Demanda', nivel: 6 },
    { mes: 'Mar 2024', actividad: 'Contestación', nivel: 7 },
    { mes: 'Abr 2024', actividad: 'Probatoria', nivel: 9 },
    { mes: 'May 2024', actividad: 'Alegatos', nivel: 5 },
    { mes: 'Jun 2024', actividad: 'Sentencia', nivel: 10 }
  ];

  const etapasData = [
    { etapa: 'Postulatoria', completada: true, fecha: '15/01/2024' },
    { etapa: 'Probatoria', completada: true, fecha: '20/03/2024' },
    { etapa: 'Decisoria', completada: false, fecha: 'Pendiente' },
    { etapa: 'Impugnatoria', completada: false, fecha: 'Pendiente' },
    { etapa: 'Ejecutoria', completada: false, fecha: 'Pendiente' }
  ];

  // ===== FUNCIONES DE MANEJO =====
  
  const handleInputChange = (campo, valor) => {
    setDatosExpediente(prev => ({
      ...prev,
      [campo]: valor
    }));

    // Limpiar timeout anterior
    if (timeoutGuardado) {
      clearTimeout(timeoutGuardado);
    }

    // Configurar nuevo timeout para guardado automático
    const nuevoTimeout = setTimeout(async () => {
      try {
        setGuardando(true);
        await actualizarCaso(expediente.id, { [campo]: valor });
        setUltimoGuardado(new Date());
      } catch (error) {
        console.error('Error guardando cambio:', error);
      } finally {
        setGuardando(false);
      }
    }, 1000);

    setTimeoutGuardado(nuevoTimeout);
  };

  const agregarAccion = () => {
    if (nuevaAccion.descripcion && nuevaAccion.fecha) {
      const nuevaAccionCompleta = {
        id: Date.now(),
        tipo: mostrarFormularioAccion,
        descripcion: nuevaAccion.descripcion,
        fecha: nuevaAccion.fecha,
        completada: false
      };
      
      setAcciones(prev => [...prev, nuevaAccionCompleta]);
      setNuevaAccion({ descripcion: '', fecha: '' });
      setMostrarFormularioAccion(null);
    }
  };

  const toggleAccionCompletada = (id) => {
    setAcciones(prev => prev.map(accion => 
      accion.id === id ? { ...accion, completada: !accion.completada } : accion
    ));
  };

  const eliminarAccion = (id) => {
    setAcciones(prev => prev.filter(accion => accion.id !== id));
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Sin fecha';
    
    try {
      const fechaObj = fecha.toDate ? fecha.toDate() : new Date(fecha);
      return fechaObj.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  // Funciones para manejo de documentos
  const handleAgregarDocumentos = async () => {
    try {
      const archivos = await abrirExploradorArchivos();
      
      for (const archivo of archivos) {
        await subirArchivo(archivo, (cancelFn) => {
          setCancelarSubida(() => cancelFn);
        });
      }
      
      setCancelarSubida(null);
    } catch (error) {
      console.error("Error agregando documentos:", error);
      alert("Error al subir los documentos: " + error.message);
      setCancelarSubida(null);
    }
  };

  const handleEliminarDocumento = async (documento) => {
    if (window.confirm(`¿Estás seguro de eliminar "${documento.nombre}"?`)) {
      try {
        await eliminarDocumento(documento.id, documento.nombreArchivo);
        await cargarDocumentos();
      } catch (error) {
        console.error("Error eliminando documento:", error);
        alert("Error al eliminar el documento: " + error.message);
      }
    }
  };

  const iniciarEdicionNombre = (documento) => {
    setDocumentoEditando(documento.id);
    setNuevoNombreDocumento(documento.nombre);
  };

  const cancelarEdicionNombre = () => {
    setDocumentoEditando(null);
    setNuevoNombreDocumento('');
  };

  const guardarNuevoNombre = async (documento) => {
    if (nuevoNombreDocumento.trim() && nuevoNombreDocumento !== documento.nombre) {
      try {
        // Aquí iría la lógica para renombrar en Firebase
        console.log('Renombrando documento:', documento.id, 'a:', nuevoNombreDocumento);
        
        // Simular delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Recargar documentos
        await cargarDocumentos();
        
        cancelarEdicionNombre();
      } catch (error) {
        console.error("Error renombrando documento:", error);
        alert("Error al renombrar el documento: " + error.message);
      }
    } else {
      cancelarEdicionNombre();
    }
  };

  // Funciones para marcar/desmarcar observaciones como tareas
  const marcarComoTarea = async (tipoTarea) => {
    try {
      setGuardando(true);
      
      const datosActualizados = {
        ...datosExpediente,
        esTarea: true,
        tipoTarea: tipoTarea,
        fechaMarcadoTarea: new Date().toISOString()
      };
      
      await actualizarCaso(expediente.id, datosActualizados);
      
      // Actualizar estado local
      setDatosExpediente(datosActualizados);
      
      // Mostrar notificación
      const notification = document.createElement('div');
      notification.textContent = `✅ Observación marcada como ${tipoTarea}`;
      notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
        z-index: 10000;
        font-weight: 600;
        animation: slideIn 0.3s ease-out;
      `;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
      }, 3000);
      
    } catch (error) {
      console.error('Error marcando como tarea:', error);
      alert('Error al marcar como tarea');
    } finally {
      setGuardando(false);
    }
  };

  const desmarcarTarea = async () => {
    try {
      setGuardando(true);
      
      const datosActualizados = {
        ...datosExpediente,
        esTarea: false,
        tipoTarea: null,
        fechaMarcadoTarea: null
      };
      
      await actualizarCaso(expediente.id, datosActualizados);
      
      // Actualizar estado local
      setDatosExpediente(datosActualizados);
      
      // Mostrar notificación
      const notification = document.createElement('div');
      notification.textContent = '✅ Tarea desmarcada';
      notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(239, 68, 68, 0.4);
        z-index: 10000;
        font-weight: 600;
        animation: slideIn 0.3s ease-out;
      `;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
      }, 3000);
      
    } catch (error) {
      console.error('Error desmarcando tarea:', error);
      alert('Error al desmarcar tarea');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="expediente-modal-overlay" onClick={onClose}>
      <div className={`expediente-modal-container ${modoCompacto ? 'compacto' : ''}`} onClick={e => e.stopPropagation()}>
        
        {/* Header del modal */}
        <div className="modal-header-holographic">
          <div className="header-content">
            <div className="expediente-info">
              <div className="expediente-numero">
                <span className="numero-label">EXPEDIENTE</span>
                <span className="numero-valor">{expediente.numero}</span>
              </div>
              <div className="expediente-meta">
                <span className={`estado-badge ${expediente.estado?.toLowerCase()}`}>
                  {expediente.estado || 'ACTIVO'}
                </span>
                <span className="tipo-badge">
                  {expediente.tipo?.toUpperCase() || 'CIVIL'}
                </span>
              </div>
            </div>
            
            <div className="header-actions">
              {guardando && (
                <div className="saving-indicator">
                  <div className="pulse-dot"></div>
                  <span>Guardando...</span>
                </div>
              )}
              {ultimoGuardado && (
                <div className="last-saved">
                  Guardado {ultimoGuardado.toLocaleTimeString()}
                </div>
              )}
              <button className="btn-close-holographic" onClick={onClose}>
                <span>×</span>
              </button>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="modal-body-holographic">
          
          {/* Panel Izquierdo - Información y Análisis */}
          <div className="left-panel">
            
            {/* Información del expediente */}
            <div className="expediente-info-section">
              <h3 className="section-title">
                <span className="title-icon">📋</span>
                Información del Expediente
              </h3>
              
              <div className="info-grid">
                <div className="info-group">
                  <label>Descripción</label>
                  <textarea
                    value={datosExpediente.descripcion}
                    onChange={(e) => handleInputChange('descripcion', e.target.value)}
                    placeholder="Descripción del caso"
                    rows="3"
                    className="input-holographic"
                  />
                </div>

                <div className="info-row">
                  <div className="info-group">
                    <label>Tipo</label>
                    <select
                      value={datosExpediente.tipo}
                      onChange={(e) => handleInputChange('tipo', e.target.value)}
                      className="select-holographic"
                    >
                      <option value="">Seleccionar tipo</option>
                      <option value="civil">Civil</option>
                      <option value="penal">Penal</option>
                      <option value="laboral">Laboral</option>
                      <option value="familia">Familia</option>
                      <option value="comercial">Comercial</option>
                      <option value="contencioso">Contencioso</option>
                    </select>
                  </div>
                  
                  <div className="info-group">
                    <label>Estado</label>
                    <select
                      value={datosExpediente.estado}
                      onChange={(e) => handleInputChange('estado', e.target.value)}
                      className="select-holographic"
                    >
                      <option value="">Seleccionar estado</option>
                      <option value="activo">Activo</option>
                      <option value="postulatoria">Postulatoria</option>
                      <option value="probatoria">Probatoria</option>
                      <option value="contestacion">Contestación</option>
                      <option value="archivado">Archivado</option>
                    </select>
                  </div>
                </div>

                <div className="info-row">
                  <div className="info-group">
                    <label>Cliente</label>
                    <input
                      type="text"
                      value={datosExpediente.cliente}
                      onChange={(e) => handleInputChange('cliente', e.target.value)}
                      placeholder="Nombre del cliente"
                      className="input-holographic"
                    />
                  </div>
                  
                  <div className="info-group">
                    <label>Demandante</label>
                    <input
                      type="text"
                      value={datosExpediente.demandante}
                      onChange={(e) => handleInputChange('demandante', e.target.value)}
                      placeholder="Nombre del demandante"
                      className="input-holographic"
                    />
                  </div>
                </div>

                <div className="info-row">
                  <div className="info-group">
                    <label>Demandado</label>
                    <input
                      type="text"
                      value={datosExpediente.demandado}
                      onChange={(e) => handleInputChange('demandado', e.target.value)}
                      placeholder="Nombre del demandado"
                      className="input-holographic"
                    />
                  </div>
                  
                  <div className="info-group">
                    <label>Inicio del Proceso</label>
                    <input
                      type="date"
                      value={datosExpediente.inicioProceso}
                      onChange={(e) => handleInputChange('inicioProceso', e.target.value)}
                      className="input-holographic"
                    />
                  </div>
                </div>

                <div className="info-group">
                  <label>Distrito Judicial</label>
                  <input
                    type="text"
                    value={datosExpediente.distritoJudicial}
                    onChange={(e) => handleInputChange('distritoJudicial', e.target.value)}
                    placeholder="Ej: Lima, Arequipa, Cusco..."
                    className="input-holographic"
                  />
                </div>

                <div className="info-group">
                  <label>Órgano Jurisdiccional</label>
                  <input
                    type="text"
                    value={datosExpediente.organoJurisdiccional}
                    onChange={(e) => handleInputChange('organoJurisdiccional', e.target.value)}
                    placeholder="Juzgado o tribunal"
                    className="input-holographic"
                  />
                </div>

                <div className="info-row">
                  <div className="info-group">
                    <label>Abogado</label>
                    <input
                      type="text"
                      value={datosExpediente.abogado}
                      onChange={(e) => handleInputChange('abogado', e.target.value)}
                      placeholder="Abogado responsable"
                      className="input-holographic"
                    />
                  </div>
                  
                  <div className="info-group">
                    <label>Juez</label>
                    <input
                      type="text"
                      value={datosExpediente.juez}
                      onChange={(e) => handleInputChange('juez', e.target.value)}
                      placeholder="Juez asignado"
                      className="input-holographic"
                    />
                  </div>
                </div>

                <div className="info-group">
                  <label>Observaciones</label>
                  <textarea
                    value={datosExpediente.observaciones}
                    onChange={(e) => handleInputChange('observaciones', e.target.value)}
                    placeholder="Observaciones adicionales"
                    rows="4"
                    className="input-holographic"
                  />
                  
                  {/* Botones para marcar observaciones como tareas */}
                  {datosExpediente.observaciones && datosExpediente.observaciones.trim() !== '' && (
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      marginTop: '8px',
                      flexWrap: 'wrap'
                    }}>
                      <button
                        onClick={() => marcarComoTarea('tarea')}
                        style={{
                          background: expediente?.esTarea && expediente?.tipoTarea === 'tarea' ? 
                            'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 
                            'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.3) 100%)',
                          border: '1px solid #10b981',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          color: expediente?.esTarea && expediente?.tipoTarea === 'tarea' ? 'white' : '#10b981',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="Marcar observación como tarea general"
                      >
                        <span>📝</span>
                        <span>Marcar como Tarea</span>
                        {expediente?.esTarea && expediente?.tipoTarea === 'tarea' && <span>✓</span>}
                      </button>
                      
                      <button
                        onClick={() => marcarComoTarea('coordinacion')}
                        style={{
                          background: expediente?.esTarea && expediente?.tipoTarea === 'coordinacion' ? 
                            'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 
                            'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.3) 100%)',
                          border: '1px solid #f59e0b',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          color: expediente?.esTarea && expediente?.tipoTarea === 'coordinacion' ? 'white' : '#f59e0b',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="Marcar observación como coordinación"
                      >
                        <span>📞</span>
                        <span>Marcar como Coordinación</span>
                        {expediente?.esTarea && expediente?.tipoTarea === 'coordinacion' && <span>✓</span>}
                      </button>
                      
                      <button
                        onClick={() => marcarComoTarea('diligencia')}
                        style={{
                          background: expediente?.esTarea && expediente?.tipoTarea === 'diligencia' ? 
                            'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' : 
                            'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(124, 58, 237, 0.3) 100%)',
                          border: '1px solid #8b5cf6',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          color: expediente?.esTarea && expediente?.tipoTarea === 'diligencia' ? 'white' : '#8b5cf6',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="Marcar observación como diligencia"
                      >
                        <span>🏃‍♂️</span>
                        <span>Marcar como Diligencia</span>
                        {expediente?.esTarea && expediente?.tipoTarea === 'diligencia' && <span>✓</span>}
                      </button>
                      
                      {expediente?.esTarea && (
                        <button
                          onClick={() => desmarcarTarea()}
                          style={{
                            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.3) 100%)',
                            border: '1px solid #ef4444',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            color: '#ef4444',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Quitar marca de tarea"
                        >
                          <span>❌</span>
                          <span>Desmarcar</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Análisis del expediente */}
            <div className="analysis-section">
              <h3 className="section-title">
                <span className="title-icon">📊</span>
                Análisis del Proceso
              </h3>
              
              {/* Tabs para diferentes análisis */}
              <div className="analysis-tabs">
                <button 
                  className={`tab ${activeAnalysisTab === 'timeline' ? 'active' : ''}`}
                  onClick={() => setActiveAnalysisTab('timeline')}
                >
                  📈 Timeline
                </button>
                <button 
                  className={`tab ${activeAnalysisTab === 'etapas' ? 'active' : ''}`}
                  onClick={() => setActiveAnalysisTab('etapas')}
                >
                  🔄 Etapas
                </button>
                <button 
                  className={`tab ${activeAnalysisTab === 'estadisticas' ? 'active' : ''}`}
                  onClick={() => setActiveAnalysisTab('estadisticas')}
                >
                  📊 Stats
                </button>
              </div>

              {/* Contenido del análisis */}
              <div className="analysis-content">
                {activeAnalysisTab === 'timeline' && (
                  <div className="timeline-chart">
                    <h4>Actividad por Meses</h4>
                    <div className="chart-container">
                      {timelineData.map((item, index) => (
                        <div key={index} className="timeline-item">
                          <div 
                            className="timeline-bar" 
                            style={{ 
                              height: `${item.nivel * 10}%`,
                              animationDelay: `${index * 0.1}s`
                            }}
                          >
                            <div className="timeline-tooltip">
                              <strong>{item.mes}</strong><br/>
                              {item.actividad}
                            </div>
                          </div>
                          <span className="timeline-label">{item.mes.split(' ')[0]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeAnalysisTab === 'etapas' && (
                  <div className="etapas-proceso">
                    <h4>Estructura del Proceso</h4>
                    <div className="etapas-container">
                      {etapasData.map((etapa, index) => (
                        <div key={index} className={`etapa-item ${etapa.completada ? 'completada' : 'pendiente'}`}>
                          <div className="etapa-indicator">
                            {etapa.completada ? '✅' : '⏳'}
                          </div>
                          <div className="etapa-info">
                            <div className="etapa-nombre">{etapa.etapa}</div>
                            <div className="etapa-fecha">{etapa.fecha}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeAnalysisTab === 'estadisticas' && (
                  <div className="estadisticas">
                    <h4>Estadísticas del Caso</h4>
                    <div className="stats-grid">
                      <div className="stat-item" style={{ animationDelay: '0s' }}>
                        <span className="stat-number">8</span>
                        <span className="stat-label">Meses activo</span>
                      </div>
                      <div className="stat-item" style={{ animationDelay: '0.1s' }}>
                        <span className="stat-number">{documentos.length}</span>
                        <span className="stat-label">Documentos</span>
                      </div>
                      <div className="stat-item" style={{ animationDelay: '0.2s' }}>
                        <span className="stat-number">3</span>
                        <span className="stat-label">Audiencias</span>
                      </div>
                      <div className="stat-item" style={{ animationDelay: '0.3s' }}>
                        <span className="stat-number">85%</span>
                        <span className="stat-label">Progreso</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Panel Derecho - Expediente Virtual */}
          <div className="right-panel">
            <ExpedienteVirtual
              documentos={documentos}
              onDocumentoSeleccionado={(documento) => {
                console.log('Documento seleccionado:', documento);
              }}
              onEliminarDocumento={handleEliminarDocumento}
              onDescargarDocumento={(documento) => {
                descargarDocumento(documento.id, documento.nombreArchivo);
              }}
              onRenombrarDocumento={(documento) => {
                iniciarEdicionNombre(documento);
              }}
              cargando={cargandoDocumentos}
            />
            
            {/* Botón flotante para agregar documentos */}
            <div className="floating-add-button">
              <button 
                className="btn-add-floating"
                onClick={handleAgregarDocumentos}
                disabled={subiendo}
                title="Agregar documentos (Ctrl+U)"
              >
                <span className="btn-icon">📎</span>
                <span className="btn-text">
                  {subiendo ? 'Subiendo...' : 'Agregar Documentos'}
                </span>
                <span className="btn-shortcut">Ctrl+U</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpedienteModal;