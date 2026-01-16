// ExpedienteVirtual.js - Componente para navegación y previsualización de expediente virtual
// Interfaz moderna tipo explorador de archivos con previsualización

import React, { useState, useEffect, useRef } from 'react';
import ExpedienteVirtualService from '../services/ExpedienteVirtualService';
import './ExpedienteVirtual.css';

const ExpedienteVirtual = ({ 
  documentos = [], 
  onDocumentoSeleccionado,
  onEliminarDocumento,
  onDescargarDocumento,
  onRenombrarDocumento,
  cargando = false 
}) => {
  // ===== ESTADOS =====
  const [vistaActual, setVistaActual] = useState('categoria'); // 'categoria', 'fecha', 'lista'
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarPreview, setMostrarPreview] = useState(true);
  const [categoriaExpandida, setCategoriaExpandida] = useState({});
  const [modoNavegacion, setModoNavegacion] = useState('explorador'); // 'explorador', 'indice'
  
  // Referencias
  const previewRef = useRef(null);
  
  // ===== DATOS PROCESADOS =====
  const documentosFiltrados = ExpedienteVirtualService.buscarEnDocumentos(documentos, busqueda);
  const documentosOrganizados = ExpedienteVirtualService.organizarDocumentosPorCategoria(documentosFiltrados);
  const documentosPorFecha = ExpedienteVirtualService.organizarDocumentosPorFecha(documentosFiltrados);
  const indiceExpediente = ExpedienteVirtualService.crearIndiceExpediente(documentos);
  const estadisticas = ExpedienteVirtualService.obtenerEstadisticasExpediente(documentos);

  // ===== EFECTOS =====
  useEffect(() => {
    // Expandir todas las categorías por defecto
    const todasExpandidas = {};
    Object.keys(documentosOrganizados).forEach(categoria => {
      if (documentosOrganizados[categoria].length > 0) {
        todasExpandidas[categoria] = true;
      }
    });
    setCategoriaExpandida(todasExpandidas);
  }, [documentos]);

  // ===== HANDLERS =====
  const handleSeleccionarDocumento = (documento) => {
    setDocumentoSeleccionado(documento);
    if (onDocumentoSeleccionado) {
      onDocumentoSeleccionado(documento);
    }
  };

  const toggleCategoria = (categoria) => {
    setCategoriaExpandida(prev => ({
      ...prev,
      [categoria]: !prev[categoria]
    }));
  };

  const handleAccionDocumento = (accion, documento) => {
    switch (accion) {
      case 'eliminar':
        if (onEliminarDocumento) onEliminarDocumento(documento);
        break;
      case 'descargar':
        if (onDescargarDocumento) onDescargarDocumento(documento);
        break;
      case 'renombrar':
        if (onRenombrarDocumento) onRenombrarDocumento(documento);
        break;
      default:
        break;
    }
  };

  // ===== COMPONENTES INTERNOS =====
  const DocumentoCard = ({ documento, compacto = false }) => (
    <div 
      className={`documento-card-virtual ${documentoSeleccionado?.id === documento.id ? 'seleccionado' : ''} ${compacto ? 'compacto' : ''}`}
      onClick={() => handleSeleccionarDocumento(documento)}
    >
      <div className="documento-icono-container">
        <div 
          className="documento-icono-tipo"
          style={{ backgroundColor: documento.color }}
        >
          {documento.icono}
        </div>
        <div className="documento-icono-extension">
          {documento.iconoExtension}
        </div>
      </div>
      
      <div className="documento-info-virtual">
        <div className="documento-nombre-virtual" title={documento.nombre}>
          {documento.nombre}
        </div>
        <div className="documento-meta-virtual">
          <span className="documento-tipo-virtual">{documento.tipoDetectado}</span>
          {documento.tamaño && (
            <span className="documento-tamaño-virtual">{documento.tamaño}</span>
          )}
          <span className="documento-fecha-virtual">
            {new Date(documento.fechaSubida || documento.createdAt).toLocaleDateString('es-ES')}
          </span>
        </div>
      </div>
      
      <div className="documento-acciones-virtual">
        <button 
          className="btn-accion-virtual"
          onClick={(e) => {
            e.stopPropagation();
            handleAccionDocumento('descargar', documento);
          }}
          title="Descargar"
        >
          ⬇️
        </button>
        <button 
          className="btn-accion-virtual"
          onClick={(e) => {
            e.stopPropagation();
            handleAccionDocumento('renombrar', documento);
          }}
          title="Renombrar"
        >
          ✏️
        </button>
        <button 
          className="btn-accion-virtual"
          onClick={(e) => {
            e.stopPropagation();
            handleAccionDocumento('eliminar', documento);
          }}
          title="Eliminar"
        >
          🗑️
        </button>
      </div>
    </div>
  );

  const PreviewPanel = () => {
    if (!documentoSeleccionado) {
      return (
        <div className="preview-vacio">
          <div className="preview-icono">📄</div>
          <h3>Selecciona un documento</h3>
          <p>Haz clic en cualquier documento para ver su previsualización</p>
        </div>
      );
    }

    const tipoPreview = ExpedienteVirtualService.obtenerTipoPrevisualización(documentoSeleccionado.extension);
    
    return (
      <div className="preview-container">
        <div className="preview-header">
          <div className="preview-titulo">
            <div 
              className="preview-icono-tipo"
              style={{ backgroundColor: documentoSeleccionado.color }}
            >
              {documentoSeleccionado.icono}
            </div>
            <div>
              <h3>{documentoSeleccionado.nombre}</h3>
              <div className="preview-meta">
                <span>{documentoSeleccionado.tipoDetectado}</span>
                {documentoSeleccionado.tamaño && <span>{documentoSeleccionado.tamaño}</span>}
                <span>{new Date(documentoSeleccionado.fechaSubida || documentoSeleccionado.createdAt).toLocaleDateString('es-ES')}</span>
              </div>
            </div>
          </div>
          <div className="preview-acciones">
            <button 
              className="btn-preview-accion"
              onClick={() => handleAccionDocumento('descargar', documentoSeleccionado)}
            >
              ⬇️ Descargar
            </button>
            <button 
              className="btn-preview-accion"
              onClick={() => setMostrarPreview(false)}
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="preview-contenido" ref={previewRef}>
          {tipoPreview === 'pdf' && (
            <div className="preview-pdf">
              <iframe
                src={documentoSeleccionado.url}
                width="100%"
                height="100%"
                title={documentoSeleccionado.nombre}
              />
            </div>
          )}
          
          {tipoPreview === 'imagen' && (
            <div className="preview-imagen">
              <img 
                src={documentoSeleccionado.url} 
                alt={documentoSeleccionado.nombre}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            </div>
          )}
          
          {tipoPreview === 'texto' && (
            <div className="preview-texto">
              <p>Previsualización de texto no disponible. Descarga el archivo para verlo.</p>
            </div>
          )}
          
          {!ExpedienteVirtualService.puedePrevisualizar(documentoSeleccionado.extension) && (
            <div className="preview-no-disponible">
              <div className="preview-icono-grande">
                {documentoSeleccionado.iconoExtension}
              </div>
              <h4>Previsualización no disponible</h4>
              <p>Este tipo de archivo no se puede previsualizar en el navegador.</p>
              <button 
                className="btn-descargar-preview"
                onClick={() => handleAccionDocumento('descargar', documentoSeleccionado)}
              >
                ⬇️ Descargar para ver
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const IndiceExpediente = () => (
    <div className="indice-expediente">
      <div className="indice-header">
        <h3>📑 Índice del Expediente</h3>
        <div className="indice-stats">
          <span>{estadisticas.total} documentos</span>
        </div>
      </div>
      
      {indiceExpediente.map((seccion, index) => (
        <div key={seccion.categoria} className="indice-seccion">
          <div className="indice-categoria-header">
            <h4>{seccion.categoria}</h4>
            <span className="indice-cantidad">{seccion.cantidad}</span>
          </div>
          <div className="indice-documentos">
            {seccion.documentos.map((doc, docIndex) => (
              <div 
                key={doc.id}
                className={`indice-documento ${documentoSeleccionado?.id === doc.id ? 'seleccionado' : ''}`}
                onClick={() => {
                  const docCompleto = documentos.find(d => d.id === doc.id);
                  if (docCompleto) handleSeleccionarDocumento(docCompleto);
                }}
              >
                <div className="indice-numero">{docIndex + 1}</div>
                <div 
                  className="indice-icono"
                  style={{ backgroundColor: doc.color }}
                >
                  {doc.icono}
                </div>
                <div className="indice-nombre">{doc.nombre}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  // ===== RENDER PRINCIPAL =====
  return (
    <div className="expediente-virtual">
      {/* Header con controles */}
      <div className="expediente-virtual-header">
        <div className="expediente-titulo">
          <h2>📁 Expediente Virtual</h2>
          <div className="expediente-stats">
            <span>{estadisticas.total} documentos</span>
            {estadisticas.tamaño > 0 && (
              <span>{ExpedienteVirtualService.formatearTamaño(estadisticas.tamaño)}</span>
            )}
          </div>
        </div>
        
        <div className="expediente-controles">
          {/* Búsqueda */}
          <div className="search-expediente">
            <input
              type="text"
              placeholder="Buscar documentos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="search-input-virtual"
            />
            <span className="search-icon-virtual">🔍</span>
          </div>
          
          {/* Selector de vista */}
          <div className="vista-selector-virtual">
            <button
              className={`btn-vista-virtual ${vistaActual === 'categoria' ? 'active' : ''}`}
              onClick={() => setVistaActual('categoria')}
              title="Vista por categoría"
            >
              📂
            </button>
            <button
              className={`btn-vista-virtual ${vistaActual === 'fecha' ? 'active' : ''}`}
              onClick={() => setVistaActual('fecha')}
              title="Vista por fecha"
            >
              📅
            </button>
            <button
              className={`btn-vista-virtual ${vistaActual === 'lista' ? 'active' : ''}`}
              onClick={() => setVistaActual('lista')}
              title="Vista de lista"
            >
              📋
            </button>
          </div>
          
          {/* Modo de navegación */}
          <div className="modo-navegacion">
            <button
              className={`btn-modo ${modoNavegacion === 'explorador' ? 'active' : ''}`}
              onClick={() => setModoNavegacion('explorador')}
              title="Modo explorador"
            >
              🗂️
            </button>
            <button
              className={`btn-modo ${modoNavegacion === 'indice' ? 'active' : ''}`}
              onClick={() => setModoNavegacion('indice')}
              title="Índice del expediente"
            >
              📑
            </button>
          </div>
          
          {/* Toggle preview */}
          <button
            className={`btn-toggle-preview ${mostrarPreview ? 'active' : ''}`}
            onClick={() => setMostrarPreview(!mostrarPreview)}
            title="Mostrar/ocultar previsualización"
          >
            👁️
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className={`expediente-contenido ${mostrarPreview ? 'con-preview' : 'sin-preview'}`}>
        {/* Panel de navegación */}
        <div className="panel-navegacion">
          {modoNavegacion === 'indice' ? (
            <IndiceExpediente />
          ) : (
            <div className="explorador-documentos">
              {cargando ? (
                <div className="loading-expediente">
                  <div className="spinner"></div>
                  <span>Cargando documentos...</span>
                </div>
              ) : documentosFiltrados.length === 0 ? (
                <div className="no-documentos-virtual">
                  <div className="no-docs-icon">📁</div>
                  <h3>No hay documentos</h3>
                  <p>
                    {documentos.length === 0 
                      ? 'Aún no se han subido documentos a este expediente'
                      : `No se encontraron documentos que coincidan con "${busqueda}"`
                    }
                  </p>
                </div>
              ) : (
                <>
                  {/* Vista por categoría */}
                  {vistaActual === 'categoria' && (
                    <div className="vista-categoria">
                      {Object.entries(documentosOrganizados).map(([categoria, docs]) => (
                        docs.length > 0 && (
                          <div key={categoria} className="categoria-seccion">
                            <div 
                              className="categoria-header"
                              onClick={() => toggleCategoria(categoria)}
                            >
                              <div className="categoria-info">
                                <span className={`categoria-toggle ${categoriaExpandida[categoria] ? 'expandida' : ''}`}>
                                  ▶️
                                </span>
                                <h3>{categoria}</h3>
                                <span className="categoria-contador">({docs.length})</span>
                              </div>
                            </div>
                            
                            {categoriaExpandida[categoria] && (
                              <div className="categoria-documentos">
                                {docs.map(doc => (
                                  <DocumentoCard key={doc.id} documento={doc} />
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      ))}
                    </div>
                  )}
                  
                  {/* Vista por fecha */}
                  {vistaActual === 'fecha' && (
                    <div className="vista-fecha">
                      {documentosPorFecha.map(grupo => (
                        <div key={grupo.key} className="fecha-grupo">
                          <div className="fecha-header">
                            <h3>{grupo.fecha}</h3>
                            <span className="fecha-contador">({grupo.documentos.length})</span>
                          </div>
                          <div className="fecha-documentos">
                            {grupo.documentos.map(doc => (
                              <DocumentoCard key={doc.id} documento={doc} compacto />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Vista de lista */}
                  {vistaActual === 'lista' && (
                    <div className="vista-lista">
                      {documentosFiltrados.map(doc => {
                        const tipo = ExpedienteVirtualService.obtenerTipoDocumento(doc.nombre, doc.extension);
                        const docEnriquecido = {
                          ...doc,
                          tipoDetectado: tipo,
                          color: ExpedienteVirtualService.obtenerColorDocumento(tipo),
                          icono: ExpedienteVirtualService.obtenerIconoDocumento(tipo),
                          iconoExtension: ExpedienteVirtualService.obtenerIconoExtension(doc.extension)
                        };
                        return (
                          <DocumentoCard key={doc.id} documento={docEnriquecido} compacto />
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Panel de previsualización */}
        {mostrarPreview && (
          <div className="panel-preview">
            <PreviewPanel />
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpedienteVirtual;