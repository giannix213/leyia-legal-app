import React, { useState } from 'react';
import './Jurisprudencia.css';

const Jurisprudencia = () => {
  const [activeTab, setActiveTab] = useState('jurisprudencia');
  const [selectedDoc, setSelectedDoc] = useState(0);

  const documentos = [
    {
      id: 1,
      titulo: 'Exp. Civil 004-2025',
      relevancia: 85,
      color: '#00f2ff',
      contenido: {
        intro: '...vistos los autos y considerando que la parte recurrente no ha cumplido con los requisitos de procedibilidad establecidos en el código adjetivo vigente, se procede al análisis de fondo sobre la vulneración del debido proceso...',
        ratio: 'La notificación electrónica no solo exige el depósito del archivo, sino que el sistema garantice la disponibilidad técnica del mismo para el usuario, so pena de nulidad absoluta.',
        conclusion: '...por tales razones, se resuelve declarar la nulidad de la resolución número catorce, ordenando que se emita un nuevo pronunciamiento ajustado a derecho, garantizando que el sistema de casillas electrónicas sea verificado por el área técnica del Poder Judicial...'
      }
    },
    {
      id: 2,
      titulo: 'Sentencia 082-2024-TC',
      relevancia: 62,
      color: '#bc13fe',
      contenido: {
        intro: '...en el presente caso, se analiza la vulneración del derecho al debido proceso en su manifestación del derecho de defensa...',
        ratio: 'El derecho de defensa implica no solo la posibilidad de ser oído, sino también contar con el tiempo y los medios adecuados para preparar la defensa.',
        conclusion: '...se declara fundada la demanda de amparo y se ordena la reposición del proceso al estado anterior a la vulneración del derecho fundamental...'
      }
    }
  ];

  const switchTab = (tab) => {
    setActiveTab(tab);
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
        <button className="btn-new">+ CARGAR RECURSOS</button>
      </header>

      <div className="main-layout">
        <aside className="sidebar">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input type="text" placeholder="Buscar por concepto..." />
          </div>

          {documentos.map((doc, index) => (
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
          ))}
        </aside>

        <main className="viewer">
          <div className="document-body">
            <p>{documentos[selectedDoc].contenido.intro}</p>

            <div className="highlight-box">
              <div className="highlight-content">
                <div className="label-ai">
                  <div className="pulse-dot"></div>
                  Ratio Decidendi Identificada
                </div>
                <p className="text-focus">
                  "{documentos[selectedDoc].contenido.ratio}"
                </p>
                <div className="action-bar">
                  <button className="btn-action btn-copy">Copiar Cita</button>
                  <button className="btn-action btn-use">Usar en Modelo</button>
                </div>
              </div>
            </div>

            <p>{documentos[selectedDoc].contenido.conclusion}</p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Jurisprudencia;
