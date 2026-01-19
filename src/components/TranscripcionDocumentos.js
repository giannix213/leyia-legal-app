import React, { useState, useRef } from 'react';
import './TranscripcionDocumentos.css';
import { useOrganizacionContext } from '../contexts/OrganizacionContext';
import { useTranscripcion } from '../hooks/useTranscripcion';
import { usePrompts } from '../hooks/usePrompts';

const TranscripcionDocumentos = () => {
  // Estados locales para UI
  const [selectedTemplate, setSelectedTemplate] = useState('resolucion');
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [variables, setVariables] = useState({
    numeroResolucion: '001-2024',
    tipoTramite: 'TIPO DE TRÁMITE',
    nombreSolicitante: 'NOMBRE DEL SOLICITANTE',
    fechaActual: new Date().toLocaleDateString('es-ES')
  });
  const [documentoGenerado, setDocumentoGenerado] = useState(null);

  // Referencias
  const videoInputRef = useRef(null);
  const modelInputRef = useRef(null);

  // Contextos y hooks
  const { organizacionActual } = useOrganizacionContext();
  
  // Hook de transcripción
  const {
    transcripcion,
    isProcessing: isTranscribing,
    error: transcripcionError,
    progress,
    procesarArchivo,
    descargarTranscripcion,
    tieneTranscripcion
  } = useTranscripcion();

  // Hook de prompts
  const {
    prompts,
    promptSeleccionado,
    isLoading: isLoadingPrompts,
    error: promptsError,
    isGenerating,
    seleccionarPrompt,
    generarDocumento,
    descargarDocumento,
    instalarPromptsDefault,
    tienePrompts,
    promptsPorTipo
  } = usePrompts(organizacionActual?.id);

  /**
   * Maneja la subida de video - ARQUITECTURA LIMPIA
   */
  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadedVideo(file);
    
    try {
      const exito = await procesarArchivo(file, {
        language: 'es',
        model: 'whisper-1'
      });

      if (exito) {
        console.log('✅ Transcripción completada exitosamente');
      }
    } catch (error) {
      console.error('❌ Error en transcripción:', error);
      alert(`Error al procesar el video: ${error.message}`);
    }
  };

  /**
   * Maneja la subida de modelos/prompts
   */
  const handleModelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      alert(`Modelo "${file.name}" cargado. Esta funcionalidad se completará con el backend.`);
    } catch (error) {
      console.error('Error subiendo modelo:', error);
      alert('Error al subir el modelo');
    }
  };

  /**
   * Genera documento usando IA - ARQUITECTURA LIMPIA
   */
  const handleGenerarDocumento = async () => {
    if (!tieneTranscripcion) {
      alert('Primero debe procesar un video para obtener la transcripción');
      return;
    }

    if (!promptSeleccionado) {
      alert('Debe seleccionar un prompt para generar el documento');
      return;
    }

    try {
      const resultado = await generarDocumento(transcripcion, variables, selectedTemplate);
      
      if (resultado.success) {
        setDocumentoGenerado(resultado);
        console.log('✅ Documento generado exitosamente');
      }
    } catch (error) {
      console.error('❌ Error generando documento:', error);
      alert(`Error al generar documento: ${error.message}`);
    }
  };

  /**
   * Descarga el documento generado
   */
  const handleDownloadDocument = () => {
    if (!documentoGenerado) {
      alert('Primero debe generar un documento');
      return;
    }

    try {
      const nombreArchivo = `${selectedTemplate}_${variables.numeroResolucion || 'documento'}.txt`;
      descargarDocumento(documentoGenerado.content, nombreArchivo, variables);
    } catch (error) {
      alert(`Error al descargar: ${error.message}`);
    }
  };

  /**
   * Instala prompts predeterminados si no existen
   */
  const handleInstalarPrompts = async () => {
    if (!organizacionActual?.id) {
      alert('Error: No se pudo identificar la organización');
      return;
    }

    try {
      await instalarPromptsDefault();
      alert('✅ Prompts predeterminados instalados correctamente');
    } catch (error) {
      console.error('Error instalando prompts:', error);
      alert(`❌ Error instalando prompts: ${error.message}`);
    }
  };

  return (
    <div className="transcripcion-container">
      {/* Header */}
      <div className="transcripcion-header">
        <h1>Transcripción y Generación de Documentos</h1>
        <div className="header-status">
          {/* Indicador de estado de Gemini */}
          <div className={`api-status ${process.env.REACT_APP_GEMINI_API_KEY ? 'configured' : 'not-configured'}`}>
            {process.env.REACT_APP_GEMINI_API_KEY ? (
              <span>🤖 Gemini API: Configurada</span>
            ) : (
              <span>⚠️ Gemini API: No configurada (modo simulación)</span>
            )}
          </div>
          
          {isTranscribing && (
            <div className="status-indicator processing">
              <span>Procesando... {progress}%</span>
            </div>
          )}
          {isGenerating && (
            <div className="status-indicator generating">
              <span>Generando documento...</span>
            </div>
          )}
        </div>
      </div>

      <div className="transcripcion-content">
        {/* Sección 1: Procesamiento de Video */}
        <section className="section-card">
          <h2 className="section-title">
            <span className="section-number">1</span>
            Procesamiento de Video
          </h2>
          
          {/* Mostrar errores */}
          {transcripcionError && (
            <div className="error-message">
              ❌ {transcripcionError}
            </div>
          )}

          <div className="grid-4">
            <div 
              className={`action-card upload-card ${isTranscribing ? 'processing' : ''}`}
              onClick={() => !isTranscribing && videoInputRef.current?.click()}
            >
              <i className={isTranscribing ? "fas fa-spinner fa-spin" : "fas fa-cloud-upload-alt"}></i>
              <span>{isTranscribing ? `Procesando ${progress}%` : 'Subir Video'}</span>
              <input 
                ref={videoInputRef}
                type="file" 
                accept="video/*,audio/*"
                style={{ display: 'none' }}
                onChange={handleVideoUpload}
                disabled={isTranscribing}
              />
            </div>
            
            <div 
              className={`action-card ${!tieneTranscripcion ? 'disabled' : ''}`}
              onClick={tieneTranscripcion ? () => descargarTranscripcion() : null}
            >
              <i className="fas fa-file-alt"></i>
              <span>Descargar Transcripción</span>
            </div>
            
            <div className="action-card" onClick={() => modelInputRef.current?.click()}>
              <i className="fas fa-magic"></i>
              <span>Agregar Prompt / Modelo</span>
              <input 
                ref={modelInputRef}
                type="file" 
                accept=".txt,.docx,.pdf"
                style={{ display: 'none' }}
                onChange={handleModelUpload}
              />
            </div>
            
            <div 
              className={`action-card ${!documentoGenerado ? 'disabled' : ''}`}
              onClick={documentoGenerado ? handleDownloadDocument : null}
            >
              <i className="fas fa-file-word"></i>
              <span>Descargar Documento</span>
            </div>
          </div>

          {/* Mostrar transcripción si existe */}
          {tieneTranscripcion && (
            <div className="transcripcion-preview">
              <h3>Transcripción Obtenida:</h3>
              <div className="transcripcion-text">
                {transcripcion.substring(0, 300)}
                {transcripcion.length > 300 && '...'}
              </div>
            </div>
          )}
        </section>

        <hr className="divider" />

        {/* Sección 2: Gestión de Prompts */}
        <section className="section-card">
          <h2 className="section-title">
            <span className="section-number">2</span>
            Gestión de Prompts y Plantillas
          </h2>

          {/* Mostrar errores de prompts */}
          {promptsError && (
            <div className="error-message">
              ❌ {promptsError}
            </div>
          )}

          <div className="prompts-section">
            <div className="prompts-header">
              <div className="prompts-info">
                <span>Prompts disponibles: {prompts.length}</span>
                {organizacionActual?.id && (
                  <span style={{fontSize: '11px', color: '#64748b'}}>
                    Org: {organizacionActual.id.substring(0, 8)}...
                  </span>
                )}
                {!tienePrompts && (
                  <button className="btn-install-prompts" onClick={handleInstalarPrompts}>
                    Instalar Prompts Predeterminados
                  </button>
                )}
              </div>
            </div>

            {tienePrompts && (
              <div className="prompts-grid">
                <div className="prompts-selector">
                  <label>Seleccionar Prompt:</label>
                  <select 
                    value={promptSeleccionado?.id || ''}
                    onChange={(e) => {
                      const prompt = prompts.find(p => p.id === e.target.value);
                      seleccionarPrompt(prompt);
                    }}
                  >
                    <option value="">Seleccione un prompt...</option>
                    {Object.entries(promptsPorTipo).map(([tipo, promptsTipo]) => (
                      <optgroup key={tipo} label={tipo.toUpperCase()}>
                        {promptsTipo.map(prompt => (
                          <option key={prompt.id} value={prompt.id}>
                            {prompt.nombre}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {promptSeleccionado && (
                  <div className="prompt-preview">
                    <h4>{promptSeleccionado.nombre}</h4>
                    <p className="prompt-description">{promptSeleccionado.descripcion}</p>
                    <div className="prompt-content">
                      {promptSeleccionado.contenido.substring(0, 200)}...
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="generation-controls">
              <button 
                className={`btn-generate ${(!tieneTranscripcion || !promptSeleccionado || isGenerating) ? 'disabled' : ''}`}
                onClick={handleGenerarDocumento}
                disabled={!tieneTranscripcion || !promptSeleccionado || isGenerating}
              >
                {isGenerating ? 'Generando...' : 'Generar Documento con IA'}
              </button>
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* Sección 3: Gestión de Variables y Vista Previa */}
        <section className="section-card">
          <h2 className="section-title">
            <span className="section-number">3</span>
            Variables y Vista Previa
          </h2>
          
          <div className="variables-grid">
            <div className="variables-left">
              <label className="upload-label">Configurar Variables del Documento</label>
              <div className="variables-form">
                {Object.entries(variables).map(([key, value]) => (
                  <div key={key} className="variable-item">
                    <label>{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => setVariables({...variables, [key]: e.target.value})}
                      className="variable-input"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="variables-right">
              <div className="preview-header">
                <span className="preview-title">Vista Previa del Documento</span>
                <div className="template-selector">
                  <select 
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                  >
                    <option value="resolucion">Resolución</option>
                    <option value="acta">Acta</option>
                    <option value="informe">Informe</option>
                  </select>
                </div>
              </div>
              
              <div className="preview-document">
                {documentoGenerado ? (
                  <div className="generated-content">
                    <h4>Documento Generado:</h4>
                    <pre className="document-content">
                      {documentoGenerado.content.substring(0, 500)}
                      {documentoGenerado.content.length > 500 && '...'}
                    </pre>
                  </div>
                ) : (
                  <div className="preview-placeholder">
                    <p>El documento generado aparecerá aquí...</p>
                    <p className="preview-hint">
                      1. Suba un video para obtener transcripción<br/>
                      2. Seleccione un prompt<br/>
                      3. Configure las variables<br/>
                      4. Genere el documento
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="transcripcion-footer">
        <div className="footer-info">
          Sistema de IA para procesamiento de documentos v2.0 - Arquitectura Limpia
        </div>
        <div className="footer-status">
          {uploadedVideo && <span>📹 Video: {uploadedVideo.name}</span>}
          {tieneTranscripcion && <span>📝 Transcripción lista</span>}
          {promptSeleccionado && <span>🤖 Prompt: {promptSeleccionado.nombre}</span>}
        </div>
      </div>
    </div>
  );
};

export default TranscripcionDocumentos;