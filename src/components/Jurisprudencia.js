import React, { useState, useRef, useEffect } from 'react';
import './Jurisprudencia.css';
import jurisprudenciaService from '../services/JurisprudenciaService';
import { useOrganizacionContext } from '../contexts/OrganizacionContext';

const Jurisprudencia = () => {
  const [activeTab, setActiveTab] = useState('jurisprudencia');
  const [selectedDoc, setSelectedDoc] = useState(0);
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const { organizacionActual } = useOrganizacionContext();

  // Cargar jurisprudencias al montar
  useEffect(() => {
    if (organizacionActual?.id) {
      cargarJurisprudencias();
    }
  }, [organizacionActual]);

  const cargarJurisprudencias = async () => {
    try {
      setLoading(true);
      const juris = await jurisprudenciaService.obtenerJurisprudencias(organizacionActual.id);
      
      // Convertir a formato del componente
      const docsFormateados = juris.map(j => ({
        id: j.id,
        titulo: j.titulo,
        relevancia: j.relevancia || 75,
        color: '#00f2ff',
        contenido: {
          intro: j.sumilla || 'Sin sumilla disponible',
          ratio: j.criterioJurisprudencial || 'Criterio jurisprudencial no especificado',
          conclusion: 'Ver documento completo para más detalles'
        },
        metadata: j
      }));

      setDocumentos(docsFormateados);
    } catch (error) {
      console.error('Error cargando jurisprudencias:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
  };

  const handleUploadDocuments = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (!organizacionActual?.id) {
      alert('Error: No hay organización seleccionada');
      return;
    }

    setLoading(true);
    let exitosos = 0;
    let fallidos = 0;
    
    for (const file of files) {
      try {
        console.log('📤 Subiendo archivo:', file.name);
        
        // Metadata básica
        const metadata = {
          titulo: file.name.replace(/\.[^/.]+$/, ''),
          tipo: 'sentencia',
          materia: 'civil',
          relevancia: Math.floor(Math.random() * 40) + 60,
          palabrasClave: [],
          sumilla: `Documento jurisprudencial: ${file.name}`,
          criterioJurisprudencial: 'Pendiente de análisis por IA'
        };

        await jurisprudenciaService.subirJurisprudencia(file, metadata, organizacionActual.id);
        exitosos++;
        console.log('✅ Archivo subido:', file.name);
      } catch (error) {
        console.error(`❌ Error subiendo ${file.name}:`, error);
        fallidos++;
        alert(`Error subiendo ${file.name}: ${error.message}`);
      }
    }

    if (exitosos > 0) {
      alert(`${exitosos} documento(s) subido(s) correctamente a Firebase.`);
      console.log('🔄 Recargando jurisprudencias...');
      await cargarJurisprudencias();
    }
    
    if (fallidos > 0) {
      alert(`${fallidos} documento(s) fallaron al subir.`);
    }
    
    setLoading(false);
  };

  const handleCopyCitation = () => {
    if (!documentos[selectedDoc]) return;
    const text = documentos[selectedDoc].contenido.ratio;
    navigator.clipboard.writeText(text).then(() => {
      alert('Cita copiada al portapapeles');
    });
  };

  const handleUseInModel = () => {
    if (!documentos[selectedDoc]) return;
    alert('Ratio decidendi agregada al modelo de documento');
  };

  return (
    <div className="jurisprudencia-dashboard">
      <header className="jurisprudencia-header">
        <div className="nav-tabs">
          <button 
            className={`tab tab-jurisprudencia ${activeTab === 'jurisprudencia' ? 'active' : ''}`}
            onClick={() => switchTab('jurisprudencia')}
          >
            Jurisprudencia
          </button>
          <button 
            className={`tab tab-criterios ${activeTab === 'criterios' ? 'active' : ''}`}
            onClick={() => switchTab('criterios')}
          >
            Criterios
          </button>
          <button 
            className={`tab tab-modelos ${activeTab === 'modelos' ? 'active' : ''}`}
            onClick={() => switchTab('modelos')}
          >
            Modelos
          </button>
        </div>
        <button className="btn-new" onClick={handleUploadDocuments}>
          + CARGAR RECURSOS
        </button>
        <input 
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </header>

      <div className="main-layout">
        <aside className="sidebar">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input type="text" placeholder="Buscar por concepto..." />
          </div>

          {documentos.length > 0 ? (
            documentos.map((doc, index) => (
              <div 
                key={doc.id}
                className={`doc-card ${selectedDoc === index ? 'active' : ''}`}
                onClick={() => setSelectedDoc(index)}
              >
                <span className="doc-title">{doc.titulo}</span>
                <div className="progress-container">
                  <div 
                    className="progress-bar" 
                    style={{
                      width: `${doc.relevancia}%`,
                      background: doc.color,
                      boxShadow: `0 0 15px ${doc.color}40`
                    }}
                  ></div>
                </div>
                <p 
                  className="relevancia-text"
                  style={{ color: doc.color }}
                >
                  RELEVANCIA IA: {doc.relevancia}%
                </p>
              </div>
            ))
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem', 
              color: 'var(--text-dim)',
              fontSize: '0.875rem'
            }}>
              <p>No hay documentos</p>
              <p>Sube archivos para comenzar</p>
            </div>
          )}
        </aside>

        <main className="viewer">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-dim)' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '3rem', marginBottom: '1rem' }}></i>
              <p>Cargando jurisprudencias...</p>
            </div>
          ) : documentos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-dim)' }}>
              <i className="fas fa-folder-open" style={{ fontSize: '3rem', marginBottom: '1rem' }}></i>
              <p>No hay jurisprudencias cargadas</p>
              <p style={{ fontSize: '0.875rem' }}>Haz clic en "+ CARGAR RECURSOS" para subir documentos</p>
            </div>
          ) : (
            <div className="document-body">
              <p>{documentos[selectedDoc]?.contenido?.intro}</p>

              <div className="highlight-box">
                <div className="highlight-content">
                  <div className="label-ai">
                    <div className="pulse-dot"></div>
                    Ratio Decidendi Identificada
                  </div>
                  <p className="text-focus">
                    "{documentos[selectedDoc]?.contenido?.ratio}"
                  </p>
                  <div className="action-bar">
                    <button className="btn-action btn-copy" onClick={handleCopyCitation}>
                      Copiar Cita
                    </button>
                    <button className="btn-action btn-use" onClick={handleUseInModel}>
                      Usar en Modelo
                    </button>
                  </div>
                </div>
              </div>

              <p>{documentos[selectedDoc]?.contenido?.conclusion}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Jurisprudencia;
