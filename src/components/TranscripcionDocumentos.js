import React, { useState } from 'react';
import './TranscripcionDocumentos.css';

const TranscripcionDocumentos = () => {
  const [selectedTemplate, setSelectedTemplate] = useState('acta');
  const [variables, setVariables] = useState({
    numeroResolucion: '001-2024',
    tipoTramite: 'TIPO DE TRÁMITE',
    nombreSolicitante: 'NOMBRE DEL SOLICITANTE',
    fechaActual: new Date().toLocaleDateString('es-ES')
  });

  const handleVariableClick = (varName) => {
    const newValue = prompt(`Ingrese el nuevo valor para ${varName}:`, variables[varName]);
    if (newValue !== null) {
      setVariables({ ...variables, [varName]: newValue });
    }
  };

  const handleDownload = () => {
    alert('Descargando documento...');
  };

  return (
    <div className="transcripcion-container">
      {/* Header */}
      <div className="transcripcion-header">
        <h1>Transcripción y Generación de Documentos</h1>
      </div>

      <div className="transcripcion-content">
        {/* Sección 1: Procesamiento de Video */}
        <section className="section-card">
          <h2 className="section-title">
            <span className="section-number">1</span>
            Procesamiento de Video
          </h2>
          <div className="grid-4">
            <div className="action-card upload-card">
              <i className="fas fa-cloud-upload-alt"></i>
              <span>Subir Video</span>
            </div>
            <div className="action-card disabled">
              <i className="fas fa-file-alt"></i>
              <span>Descargar Transcripción</span>
            </div>
            <div className="action-card">
              <i className="fas fa-magic"></i>
              <span>Agregar Prompt / Modelo</span>
            </div>
            <div className="action-card disabled">
              <i className="fas fa-file-word"></i>
              <span>Descargar Documento</span>
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* Sección 2: Generación por Dictado */}
        <section className="section-card">
          <h2 className="section-title">
            <span className="section-number">2</span>
            Generación por Dictado y Plantillas
          </h2>
          <div className="grid-2">
            <div className="left-panel">
              <label className="input-label">Agregar Modelos (Plantillas)</label>
              <select 
                className="select-input"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
              >
                <option value="acta">Acta de Reunión</option>
                <option value="resumen">Resumen de Archivo</option>
                <option value="informe">Informe Técnico</option>
              </select>
              <button className="btn-secondary">Cargar Datos Adicionales</button>
            </div>
            <div className="right-panel">
              <div className="mic-container">
                <button className="mic-button">
                  <i className="fas fa-microphone"></i>
                </button>
                <p className="mic-label">Dictado por Voz</p>
              </div>
              <div className="download-link">
                <button className="btn-link">
                  <i className="fas fa-download"></i>
                  <span>Descargar Doc Final</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="transcripcion-footer">
        Sistema de Inteligencia Artificial para procesamiento de documentos v1.0
      </div>

      {/* Sección 3: Gestión de Modelos */}
      <section className="models-section">
        <h2 className="models-title">
          <span className="models-badge">3</span>
          Gestión de Modelos y Resoluciones
        </h2>
        <div className="models-grid">
          {/* Panel Izquierdo */}
          <div className="models-left">
            <div className="upload-section">
              <label className="upload-label">1. Subir Modelo (Resolución, Admisorio, etc.)</label>
              <div className="upload-zone">
                <div className="upload-content">
                  <i className="fas fa-file-upload"></i>
                  <p>Subir archivo .docx o .pdf</p>
                </div>
                <input type="file" className="file-input" />
              </div>
            </div>
            <div className="data-section">
              <label className="upload-label">2. Completar Información</label>
              <button className="btn-add-data">
                <i className="fas fa-plus-circle"></i>
                Agregar Datos del Caso
              </button>
              <p className="help-text">* Aquí ingresas los nombres, fechas o datos que cambian.</p>
            </div>
          </div>

          {/* Panel Derecho - Vista Previa */}
          <div className="models-right">
            <div className="preview-header">
              <span className="preview-title">Vista Previa del Modelo</span>
              <div className="legend">
                <span className="legend-item variable">SUBRAYAR VARIABLE</span>
                <span className="legend-item fixed">TEXTO FIJO</span>
              </div>
            </div>
            <div className="preview-document">
              <p className="doc-title">
                RESOLUCIÓN NÚMERO{' '}
                <span 
                  className="variable-field"
                  onClick={() => handleVariableClick('numeroResolucion')}
                  title="Haga clic para cambiar"
                >
                  [{variables.numeroResolucion}]
                </span>
              </p>
              <p className="doc-paragraph">
                Visto el proceso de{' '}
                <span 
                  className="variable-field"
                  onClick={() => handleVariableClick('tipoTramite')}
                >
                  [{variables.tipoTramite}]
                </span>
                {' '}presentado por el ciudadano{' '}
                <span 
                  className="variable-field"
                  onClick={() => handleVariableClick('nombreSolicitante')}
                >
                  [{variables.nombreSolicitante}]
                </span>
                ...
              </p>
              <p className="doc-paragraph">
                Se resuelve: <strong>ADMITIR</strong> a trámite la solicitud de referencia bajo los términos legales vigentes en la fecha{' '}
                <span 
                  className="variable-field"
                  onClick={() => handleVariableClick('fechaActual')}
                >
                  [{variables.fechaActual}]
                </span>.
              </p>
              <div className="doc-signature">
                [Firma de la Autoridad]
              </div>
            </div>
            <div className="preview-actions">
              <button className="btn-download" onClick={handleDownload}>
                <i className="fas fa-file-download"></i>
                Descargar Documento Final
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TranscripcionDocumentos;
