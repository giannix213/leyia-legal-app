import React, { useState, useEffect } from 'react';
import './QuickNavigator.css';

const QuickNavigator = ({ currentView, onNavigate, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredViews, setFilteredViews] = useState([]);

  const allViews = [
    // Navegación Central
    { id: 'estudio', name: 'Dashboard', category: 'Navegación', icon: '🏠', description: 'Vista general del estudio' },
    { id: 'casos', name: 'Expedientes', category: 'Navegación', icon: '📁', description: 'Gestión de casos y expedientes' },
    { id: 'calendario', name: 'Calendario', category: 'Navegación', icon: '📅', description: 'Calendario jurídico' },
    { id: 'equipo', name: 'Equipo', category: 'Navegación', icon: '👥', description: 'Gestión del equipo' },
    
    // Herramientas IA
    { id: 'jurisprudencia', name: 'Jurisprudencia', category: 'IA', icon: '⚖️', description: 'Búsqueda de jurisprudencia' },
    { id: 'transcripcion', name: 'Transcripción y Redactor IA', category: 'IA', icon: '🎤', description: 'Transcripción y generación de documentos' },
    
    // Administración
    { id: 'contactos', name: 'Contactos', category: 'Admin', icon: '👤', description: 'Gestión de contactos' },
    { id: 'caja', name: 'Finanzas', category: 'Admin', icon: '💰', description: 'Caja chica y finanzas' },
    { id: 'estadisticas', name: 'Estadísticas', category: 'Admin', icon: '📊', description: 'Estadísticas del estudio' },
    
    // Efectos Visuales (Desarrollo)
    { id: 'diamond-fragmentation', name: 'Diamond Effects', category: 'Efectos', icon: '💎', description: 'Efectos de fragmentación' },
    { id: 'image-fragmentation', name: 'Image Effects', category: 'Efectos', icon: '🖼️', description: 'Efectos de imagen' },
    { id: 'parallax-superposition', name: 'Parallax Super', category: 'Efectos', icon: '🌌', description: 'Efectos parallax avanzados' },
    { id: 'parallax-demo', name: 'Parallax Demo', category: 'Efectos', icon: '✨', description: 'Demo de efectos parallax' }
  ];

  useEffect(() => {
    const filtered = allViews.filter(view => 
      view.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      view.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      view.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredViews(filtered);
  }, [searchTerm]);

  useEffect(() => {
    setFilteredViews(allViews);
  }, []);

  const handleNavigate = (viewId) => {
    onNavigate(viewId);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const groupedViews = filteredViews.reduce((groups, view) => {
    const category = view.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(view);
    return groups;
  }, {});

  return (
    <div className="quick-navigator-overlay" onClick={onClose}>
      <div className="quick-navigator-modal" onClick={e => e.stopPropagation()}>
        <div className="navigator-header">
          <h2>🚀 Navegación Rápida</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="navigator-search">
          <input
            type="text"
            placeholder="Buscar vista... (Esc para cerrar)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className="search-input"
          />
        </div>

        <div className="navigator-content">
          {Object.entries(groupedViews).map(([category, views]) => (
            <div key={category} className="view-category">
              <h3 className="category-title">{category}</h3>
              <div className="views-grid">
                {views.map(view => (
                  <div
                    key={view.id}
                    className={`view-card ${currentView === view.id ? 'active' : ''}`}
                    onClick={() => handleNavigate(view.id)}
                  >
                    <div className="view-icon">{view.icon}</div>
                    <div className="view-info">
                      <div className="view-name">{view.name}</div>
                      <div className="view-description">{view.description}</div>
                    </div>
                    {currentView === view.id && (
                      <div className="current-indicator">●</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="navigator-footer">
          <div className="shortcuts-info">
            <span>💡 Tip: Usa Ctrl+K para abrir navegación rápida</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickNavigator;