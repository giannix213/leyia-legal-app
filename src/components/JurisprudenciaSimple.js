import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import JurisprudenciaProcessor from '../services/JurisprudenciaProcessor';

function JurisprudenciaSimple() {
  const [jurisprudencias, setJurisprudencias] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showChatLeyia, setShowChatLeyia] = useState(false);
  const [editingJurisprudencia, setEditingJurisprudencia] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroMateria, setFiltroMateria] = useState('todos');
  const [procesadorJurisprudencia] = useState(() => new JurisprudenciaProcessor());
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'casacion',
    materia: 'civil',
    numeroSentencia: '',
    fecha: '',
    tribunal: '',
    sumilla: '',
    criterioJurisprudencial: '',
    palabrasClave: '',
    enlaceWeb: '',
    observaciones: ''
  });

  useEffect(() => {
    cargarJurisprudencias();
  }, []);

  const cargarJurisprudencias = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'jurisprudencias'));
      const jurisprudenciasData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setJurisprudencias(jurisprudenciasData.sort((a, b) => {
        return new Date(b.fecha || '1900-01-01') - new Date(a.fecha || '1900-01-01');
      }));
    } catch (error) {
      console.error('Error al cargar jurisprudencias:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSave = {
        ...formData,
        palabrasClave: formData.palabrasClave.split(',').map(p => p.trim()).filter(p => p),
        updatedAt: serverTimestamp()
      };

      if (editingJurisprudencia) {
        await updateDoc(doc(db, 'jurisprudencias', editingJurisprudencia.id), dataToSave);
      } else {
        dataToSave.createdAt = serverTimestamp();
        await addDoc(collection(db, 'jurisprudencias'), dataToSave);
      }
      
      setShowModal(false);
      resetForm();
      cargarJurisprudencias();
    } catch (error) {
      console.error('Error al guardar jurisprudencia:', error);
    }
  };

  const handleEdit = (jurisprudencia) => {
    setEditingJurisprudencia(jurisprudencia);
    setFormData({
      titulo: jurisprudencia.titulo || '',
      tipo: jurisprudencia.tipo || 'casacion',
      materia: jurisprudencia.materia || 'civil',
      numeroSentencia: jurisprudencia.numeroSentencia || '',
      fecha: jurisprudencia.fecha || '',
      tribunal: jurisprudencia.tribunal || '',
      sumilla: jurisprudencia.sumilla || '',
      criterioJurisprudencial: jurisprudencia.criterioJurisprudencial || '',
      palabrasClave: Array.isArray(jurisprudencia.palabrasClave) 
        ? jurisprudencia.palabrasClave.join(', ') 
        : jurisprudencia.palabrasClave || '',
      enlaceWeb: jurisprudencia.enlaceWeb || '',
      observaciones: jurisprudencia.observaciones || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta jurisprudencia?')) {
      try {
        await deleteDoc(doc(db, 'jurisprudencias', id));
        cargarJurisprudencias();
      } catch (error) {
        console.error('Error al eliminar jurisprudencia:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      tipo: 'casacion',
      materia: 'civil',
      numeroSentencia: '',
      fecha: '',
      tribunal: '',
      sumilla: '',
      criterioJurisprudencial: '',
      palabrasClave: '',
      enlaceWeb: '',
      observaciones: ''
    });
    setEditingJurisprudencia(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const jurisprudenciasFiltradas = jurisprudencias.filter(j => {
    const cumpleBusqueda = !busqueda || 
      j.titulo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      j.sumilla?.toLowerCase().includes(busqueda.toLowerCase()) ||
      j.criterioJurisprudencial?.toLowerCase().includes(busqueda.toLowerCase()) ||
      j.numeroSentencia?.toLowerCase().includes(busqueda.toLowerCase()) ||
      (Array.isArray(j.palabrasClave) && j.palabrasClave.some(p => 
        p.toLowerCase().includes(busqueda.toLowerCase())
      ));
    
    const cumpleTipo = filtroTipo === 'todos' || j.tipo === filtroTipo;
    const cumpleMateria = filtroMateria === 'todos' || j.materia === filtroMateria;
    
    return cumpleBusqueda && cumpleTipo && cumpleMateria;
  });

  // Función para procesar jurisprudencia con Leyia
  const procesarJurisprudenciaConLeyia = async (slots) => {
    try {
      console.log('📚 Procesando jurisprudencia con Leyia:', slots);
      
      if (slots.archivo_contenido) {
        const datos = await procesadorJurisprudencia.procesarJurisprudencia(
          slots.archivo_contenido, 
          slots.nombre_archivo || 'documento.txt'
        );
        
        const dataToSave = {
          ...datos,
          palabrasClave: datos.palabrasClave || [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        await addDoc(collection(db, 'jurisprudencias'), dataToSave);
        await cargarJurisprudencias();
        
        return {
          success: true,
          message: `✅ **Jurisprudencia procesada exitosamente**\n\n📄 **${datos.titulo}**\n• Tipo: ${datos.tipo}\n• Materia: ${datos.materia}\n${datos.numeroSentencia ? `• Sentencia: ${datos.numeroSentencia}\n` : ''}${datos.tribunal ? `• Tribunal: ${datos.tribunal}\n` : ''}\n🎯 **Guardada en tu base de jurisprudencia**`
        };
      }
      
      return {
        success: true,
        message: '📚 **Para procesar jurisprudencia:**\n\n1. Sube un archivo de texto con la sentencia\n2. Yo extraeré automáticamente:\n   • Título y tipo\n   • Materia jurídica\n   • Número de sentencia\n   • Tribunal\n   • Criterio jurisprudencial\n   • Palabras clave\n\n📎 **Arrastra el archivo aquí o pégalo como texto**'
      };
    } catch (error) {
      console.error('Error procesando jurisprudencia:', error);
      return {
        success: false,
        message: '❌ Error procesando la jurisprudencia. Verifica el formato del documento.'
      };
    }
  };

  // Función para verificar conexión con Gemini
  const verificarConexionGemini = async () => {
    try {
      const resultado = await procesadorJurisprudencia.verificarConexion();
      
      if (resultado.available) {
        alert(`✅ Conexión exitosa con Gemini\n\nMétodo: ${resultado.method}\nRespuesta: ${resultado.response}`);
      } else {
        alert(`❌ Error de conexión con Gemini\n\nError: ${resultado.error}`);
      }
    } catch (error) {
      alert(`❌ Error verificando conexión: ${error.message}`);
    }
  };

  const handleVolver = () => {
    window.dispatchEvent(new CustomEvent('navigateToView', { 
      detail: { view: 'casos' } 
    }));
  };

  return (
    <div className="imperial-law-terminal">
      <div className="imperial-terminal">
        {/* Header Imperial */}
        <header>
          <div className="sys-title">IMPERIAL LAW DATABASE v2.5</div>
          <div className="header-actions">
            <button 
              className="nav-back-btn"
              onClick={handleVolver}
              title="Volver a Casos"
            >
              ← CASOS
            </button>
            <div style={{fontSize: '0.8rem'}}>
              <span style={{color: 'var(--hologram-cyan)'}}>ID: 74-OPR</span> | 
              <span style={{color: 'var(--imperial-red)', cursor: 'pointer'}} onClick={handleVolver}>[ LOGOUT ]</span>
            </div>
          </div>
        </header>

        {/* Banner Negro Central */}
        <div className="black-banner">
          <div className="banner-text">
            <h2>JURISPRUDENCIA<br/>Y CRITERIOS</h2>
          </div>
          <div className="action-container">
            <div className="action-card" onClick={() => setBusqueda('')}>
              <div style={{fontSize: '1.5rem'}}>🔍</div>
              <span>BÚSQUEDA POR CONTENIDO</span>
            </div>
            <div className="action-card" onClick={() => setShowChatLeyia(true)}>
              <div style={{fontSize: '1.5rem'}}>🤖</div>
              <span>PROCESAR CON LEYIA</span>
            </div>
            <div className="action-card" onClick={() => setShowModal(true)}>
              <div style={{fontSize: '1.5rem'}}>✒️</div>
              <span>MANUAL</span>
            </div>
            <div className="action-card" onClick={verificarConexionGemini}>
              <div style={{fontSize: '1.5rem'}}>🛠️</div>
              <span>TEST GEMINI</span>
            </div>
          </div>
        </div>

        {/* Sección de Búsqueda */}
        <div className="search-grid">
          <div className="input-field">
            <label>🔎 Búsqueda General</label>
            <input
              type="text"
              placeholder="BUSCAR POR TITULO, SUMILLA, CRITERIO..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div className="input-field">
            <label>Tipo</label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
            >
              <option value="todos">TODOS LOS TIPOS</option>
              <option value="casacion">CASACIÓN</option>
              <option value="pleno">PLENO JURISDICCIONAL</option>
              <option value="acuerdo">ACUERDO PLENARIO</option>
              <option value="precedente">PRECEDENTE</option>
              <option value="vinculante">PRECEDENTE VINCULANTE</option>
              <option value="constitucional">CONSTITUCIONAL</option>
              <option value="otro">OTRO</option>
            </select>
          </div>
          <div className="input-field">
            <label>Materia</label>
            <select
              value={filtroMateria}
              onChange={(e) => setFiltroMateria(e.target.value)}
            >
              <option value="todos">TODAS LAS MATERIAS</option>
              <option value="civil">CIVIL</option>
              <option value="penal">PENAL</option>
              <option value="laboral">LABORAL</option>
              <option value="comercial">COMERCIAL</option>
              <option value="familia">FAMILIA</option>
              <option value="contencioso">CONTENCIOSO ADMINISTRATIVO</option>
              <option value="constitucional">CONSTITUCIONAL</option>
              <option value="tributario">TRIBUTARIO</option>
            </select>
          </div>
        </div>

        {/* Contadores de Datos */}
        <div className="data-stats">
          <div className="stat-pill stat-blue">
            <span className="stat-value">{jurisprudenciasFiltradas.length}</span>
            <span className="stat-label">Jurisprudencias Encontradas</span>
          </div>
          <div className="stat-pill stat-green">
            <span className="stat-value">{jurisprudencias.length}</span>
            <span className="stat-label">Total en Base de Datos</span>
          </div>
        </div>

        {/* Área de Resultados */}
        {jurisprudenciasFiltradas.length === 0 ? (
          <div className="empty-results">
            <div className="scale-icon">⚖️</div>
            <p style={{color: '#444', letterSpacing: '2px'}}>
              {jurisprudencias.length === 0 
                ? 'No hay jurisprudencias registradas en este sector'
                : 'No se encontraron jurisprudencias con los filtros aplicados'
              }
            </p>
          </div>
        ) : (
          <div className="results-area">
            {jurisprudenciasFiltradas.map(jurisprudencia => (
              <div key={jurisprudencia.id} className="jurisprudencia-card">
                <div className="card-header-imperial">
                  <div className="card-title-imperial">
                    <span className="tipo-badge-imperial" data-tipo={jurisprudencia.tipo}>
                      {jurisprudencia.tipo?.toUpperCase() || 'OTRO'}
                    </span>
                    <h3>{jurisprudencia.titulo}</h3>
                  </div>
                  <div className="card-meta-imperial">
                    {jurisprudencia.numeroSentencia && (
                      <span>📄 {jurisprudencia.numeroSentencia}</span>
                    )}
                    {jurisprudencia.fecha && (
                      <span>📅 {new Date(jurisprudencia.fecha).toLocaleDateString('es-PE')}</span>
                    )}
                    <span className="materia-badge">{jurisprudencia.materia?.toUpperCase()}</span>
                  </div>
                </div>
                
                <div className="card-content-imperial">
                  {jurisprudencia.sumilla && (
                    <div className="sumilla-section">
                      <strong>SUMILLA:</strong>
                      <p>{jurisprudencia.sumilla}</p>
                    </div>
                  )}
                  
                  {jurisprudencia.criterioJurisprudencial && (
                    <div className="criterio-section">
                      <strong>CRITERIO JURISPRUDENCIAL:</strong>
                      <p>{jurisprudencia.criterioJurisprudencial}</p>
                    </div>
                  )}
                  
                  {jurisprudencia.palabrasClave && jurisprudencia.palabrasClave.length > 0 && (
                    <div className="palabras-clave-section">
                      <strong>PALABRAS CLAVE:</strong>
                      <div className="tags-container">
                        {(Array.isArray(jurisprudencia.palabrasClave) 
                          ? jurisprudencia.palabrasClave 
                          : jurisprudencia.palabrasClave.split(',')
                        ).map((palabra, index) => (
                          <span key={index} className="tag-imperial">
                            {palabra.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="card-actions-imperial">
                  <button className="action-btn-imperial" onClick={() => handleEdit(jurisprudencia)}>
                    EDITAR
                  </button>
                  <button className="action-btn-imperial delete" onClick={() => handleDelete(jurisprudencia.id)}>
                    ELIMINAR
                  </button>
                  {jurisprudencia.enlaceWeb && (
                    <button 
                      className="action-btn-imperial"
                      onClick={() => window.open(jurisprudencia.enlaceWeb, '_blank')}
                    >
                      VER ONLINE
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para agregar/editar jurisprudencia */}
      {showModal && (
        <div className="modal-overlay-imperial">
          <div className="modal-imperial">
            <div className="modal-header-imperial">
              <h3>{editingJurisprudencia ? 'EDITAR JURISPRUDENCIA' : 'NUEVA JURISPRUDENCIA'}</h3>
              <button className="close-btn-imperial" onClick={handleCloseModal}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="form-imperial">
              <div className="form-grid-imperial">
                <div className="form-group-imperial">
                  <label>TÍTULO *</label>
                  <input
                    type="text"
                    placeholder="Ej: Casación sobre responsabilidad civil extracontractual"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group-imperial">
                  <label>NÚMERO DE SENTENCIA</label>
                  <input
                    type="text"
                    placeholder="Ej: Cas. N° 1234-2023"
                    value={formData.numeroSentencia}
                    onChange={(e) => setFormData({ ...formData, numeroSentencia: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-grid-imperial">
                <div className="form-group-imperial">
                  <label>TIPO *</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    required
                  >
                    <option value="casacion">CASACIÓN</option>
                    <option value="pleno">PLENO JURISDICCIONAL</option>
                    <option value="acuerdo">ACUERDO PLENARIO</option>
                    <option value="precedente">PRECEDENTE</option>
                    <option value="vinculante">PRECEDENTE VINCULANTE</option>
                    <option value="constitucional">CONSTITUCIONAL</option>
                    <option value="otro">OTRO</option>
                  </select>
                </div>
                <div className="form-group-imperial">
                  <label>MATERIA *</label>
                  <select
                    value={formData.materia}
                    onChange={(e) => setFormData({ ...formData, materia: e.target.value })}
                    required
                  >
                    <option value="civil">CIVIL</option>
                    <option value="penal">PENAL</option>
                    <option value="laboral">LABORAL</option>
                    <option value="comercial">COMERCIAL</option>
                    <option value="familia">FAMILIA</option>
                    <option value="contencioso">CONTENCIOSO ADMINISTRATIVO</option>
                    <option value="constitucional">CONSTITUCIONAL</option>
                    <option value="tributario">TRIBUTARIO</option>
                  </select>
                </div>
                <div className="form-group-imperial">
                  <label>FECHA</label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group-imperial">
                <label>TRIBUNAL</label>
                <input
                  type="text"
                  placeholder="Ej: Corte Suprema de Justicia - Sala Civil Permanente"
                  value={formData.tribunal}
                  onChange={(e) => setFormData({ ...formData, tribunal: e.target.value })}
                />
              </div>

              <div className="form-group-imperial">
                <label>SUMILLA</label>
                <textarea
                  placeholder="Resumen breve del caso y la decisión..."
                  value={formData.sumilla}
                  onChange={(e) => setFormData({ ...formData, sumilla: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="form-group-imperial">
                <label>CRITERIO JURISPRUDENCIAL *</label>
                <textarea
                  placeholder="Criterio o doctrina jurisprudencial establecida en la sentencia..."
                  value={formData.criterioJurisprudencial}
                  onChange={(e) => setFormData({ ...formData, criterioJurisprudencial: e.target.value })}
                  rows="4"
                  required
                />
              </div>

              <div className="form-group-imperial">
                <label>PALABRAS CLAVE</label>
                <input
                  type="text"
                  placeholder="Separar con comas: responsabilidad civil, daño moral, nexo causal"
                  value={formData.palabrasClave}
                  onChange={(e) => setFormData({ ...formData, palabrasClave: e.target.value })}
                />
              </div>

              <div className="form-group-imperial">
                <label>ENLACE WEB</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.enlaceWeb}
                  onChange={(e) => setFormData({ ...formData, enlaceWeb: e.target.value })}
                />
              </div>

              <div className="form-group-imperial">
                <label>OBSERVACIONES</label>
                <textarea
                  placeholder="Notas adicionales, comentarios, aplicabilidad..."
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  rows="2"
                />
              </div>

              <div className="form-actions-imperial">
                <button type="button" className="btn-cancel-imperial" onClick={handleCloseModal}>
                  CANCELAR
                </button>
                <button type="submit" className="btn-save-imperial">
                  {editingJurisprudencia ? 'ACTUALIZAR' : 'GUARDAR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chat LeyIA para procesamiento de jurisprudencia */}
      {showChatLeyia && (
        <ChatLeyiaJurisprudencia 
          visible={showChatLeyia}
          onClose={() => setShowChatLeyia(false)}
          onProcesarJurisprudencia={procesarJurisprudenciaConLeyia}
        />
      )}
    </div>
  );
}

// Componente especializado de ChatLeyia para jurisprudencia
const ChatLeyiaJurisprudencia = ({ visible, onClose, onProcesarJurisprudencia }) => {
  const [mensajes, setMensajes] = useState([]);
  const [inputMensaje, setInputMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (visible && mensajes.length === 0) {
      const mensajeBienvenida = {
        tipo: 'ia',
        texto: '🤖 **¡Hola! Soy LeyIA, especialista en jurisprudencia.**\n\n📚 **Puedo procesar automáticamente:**\n• Sentencias de casación\n• Acuerdos plenarios\n• Precedentes vinculantes\n• Resoluciones constitucionales\n\n📎 **Sube un archivo o pega el texto de la jurisprudencia**\n\nExtraeré automáticamente: título, tipo, materia, criterio jurisprudencial, palabras clave y más.',
        timestamp: new Date()
      };
      setMensajes([mensajeBienvenida]);
    }
  }, [visible, mensajes.length]);

  const manejarArchivo = (archivo) => {
    const mensajeArchivo = {
      tipo: 'usuario',
      texto: `📎 Archivo seleccionado: ${archivo.name}`,
      timestamp: new Date()
    };
    setMensajes(prev => [...prev, mensajeArchivo]);
    procesarArchivo(archivo);
  };

  const procesarArchivo = async (archivo) => {
    setCargando(true);
    
    try {
      const contenido = await leerArchivo(archivo);
      
      const resultado = await onProcesarJurisprudencia({
        archivo_contenido: contenido,
        nombre_archivo: archivo.name
      });
      
      const mensajeRespuesta = {
        tipo: 'ia',
        texto: resultado.message,
        timestamp: new Date()
      };
      
      setMensajes(prev => [...prev, mensajeRespuesta]);
    } catch (error) {
      const mensajeError = {
        tipo: 'ia',
        texto: '❌ Error procesando el archivo. Verifica que sea un documento de texto válido.',
        timestamp: new Date()
      };
      setMensajes(prev => [...prev, mensajeError]);
    } finally {
      setCargando(false);
    }
  };

  const leerArchivo = (archivo) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Error leyendo archivo'));
      reader.readAsText(archivo);
    });
  };

  const enviarMensaje = async () => {
    if (!inputMensaje.trim()) return;

    const mensajeUsuario = {
      tipo: 'usuario',
      texto: inputMensaje,
      timestamp: new Date()
    };
    
    setMensajes(prev => [...prev, mensajeUsuario]);
    setInputMensaje('');
    setCargando(true);

    try {
      if (inputMensaje.length > 200) {
        const resultado = await onProcesarJurisprudencia({
          archivo_contenido: inputMensaje,
          nombre_archivo: 'texto_pegado.txt'
        });
        
        const mensajeRespuesta = {
          tipo: 'ia',
          texto: resultado.message,
          timestamp: new Date()
        };
        
        setMensajes(prev => [...prev, mensajeRespuesta]);
      } else {
        const mensajeRespuesta = {
          tipo: 'ia',
          texto: '📚 Para procesar jurisprudencia, necesito el texto completo del documento.\n\n**Opciones:**\n• Sube un archivo de texto\n• Pega el contenido completo de la sentencia\n• Arrastra el archivo aquí\n\n💡 **Tip:** El texto debe contener la información completa de la jurisprudencia para una extracción precisa.',
          timestamp: new Date()
        };
        
        setMensajes(prev => [...prev, mensajeRespuesta]);
      }
    } catch (error) {
      const mensajeError = {
        tipo: 'ia',
        texto: '❌ Error procesando tu mensaje. Intenta nuevamente.',
        timestamp: new Date()
      };
      setMensajes(prev => [...prev, mensajeError]);
    } finally {
      setCargando(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const archivos = Array.from(e.dataTransfer.files);
    if (archivos.length > 0) {
      manejarArchivo(archivos[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  if (!visible) return null;

  return (
    <div className="chat-leyia-overlay">
      <div className="chat-leyia-container" onDrop={handleDrop} onDragOver={handleDragOver}>
        <div className="chat-leyia-header">
          <div className="header-info">
            <div className="header-title">
              📚 LeyIA - Procesador de Jurisprudencia
            </div>
            <div className="header-status">
              <div className="status-indicator conectado"></div>
              <span>Especialista en jurisprudencia</span>
            </div>
          </div>
          <button className="chat-leyia-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="chat-leyia-mensajes">
          {mensajes.map((mensaje, index) => (
            <div key={index} className={`mensaje ${mensaje.tipo}`}>
              {mensaje.tipo === 'ia' && (
                <span className="mensaje-avatar">
                  <img src="./leyia.png" alt="LeyIA" className="avatar-leyia" />
                </span>
              )}
              <div className="mensaje-contenido">
                <div 
                  className="mensaje-texto"
                  dangerouslySetInnerHTML={{ 
                    __html: mensaje.texto.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>') 
                  }}
                />
                <div className="mensaje-hora">
                  {mensaje.timestamp.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {mensaje.tipo === 'usuario' && <span className="mensaje-avatar">👤</span>}
            </div>
          ))}
          
          {cargando && (
            <div className="mensaje ia">
              <span className="mensaje-avatar">
                <img src="./leyia.png" alt="LeyIA" className="avatar-leyia" />
              </span>
              <div className="mensaje-contenido">
                <div className="mensaje-typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="chat-leyia-input-container">
          <div style={{ 
            border: '2px dashed #d1d5db', 
            borderRadius: '8px', 
            padding: '12px', 
            marginBottom: '12px',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '14px'
          }}>
            📎 Arrastra archivos aquí o 
            <input 
              type="file" 
              accept=".txt,.doc,.docx,.pdf" 
              onChange={(e) => e.target.files[0] && manejarArchivo(e.target.files[0])}
              style={{ marginLeft: '8px' }}
            />
          </div>
          
          <textarea
            className="chat-leyia-input"
            placeholder="Pega el texto de la jurisprudencia aquí o sube un archivo..."
            value={inputMensaje}
            onChange={(e) => setInputMensaje(e.target.value)}
            onKeyPress={handleKeyPress}
            rows="3"
            disabled={cargando}
          />
          
          <button 
            className="chat-leyia-send-btn"
            onClick={enviarMensaje}
            disabled={!inputMensaje.trim() || cargando}
            title="Procesar jurisprudencia"
          >
            🚀
          </button>
        </div>
      </div>
    </div>
  );
};

export default JurisprudenciaSimple;