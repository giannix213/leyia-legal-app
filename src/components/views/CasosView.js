// CasosView.js - Vista pura del componente Casos
// Separación completa de lógica y presentación

import React from 'react';
import { getEtapasProcesales } from '../../utils/casosUtils';
import '../CasosAgrupacion.css';

// Componentes de vista pura
const CasosHeader = ({ 
  busqueda, 
  onBusquedaChange, 
  vistaActiva, 
  onVistaChange, 
  onNuevoCaso,
  totalCasos 
}) => (
  <div className="casos-header">
    <div className="casos-title">
      <h2>📋 Casos ({totalCasos})</h2>
      <button className="btn-nuevo-caso" onClick={onNuevoCaso}>
        + Nuevo Caso
      </button>
    </div>
    
    <div className="casos-controls">
      <div className="search-container">
        <input
          type="text"
          placeholder="Buscar casos..."
          value={busqueda}
          onChange={(e) => onBusquedaChange(e.target.value)}
          className="search-input"
        />
        <span className="search-icon">🔍</span>
      </div>
      
      <div className="view-tabs">
        {['activos', 'archivados', 'todos'].map(vista => (
          <button
            key={vista}
            className={`tab ${vistaActiva === vista ? 'active' : ''}`}
            onClick={() => onVistaChange(vista)}
          >
            {vista.charAt(0).toUpperCase() + vista.slice(1)}
          </button>
        ))}
      </div>
    </div>
  </div>
);

const CasoCard = ({ 
  caso, 
  onClick, 
  onToggleFavorito, 
  onCambiarEstado,
  onEliminar 
}) => {
  const getColorForType = (tipo) => {
    const colores = {
      'civil': '#3b82f6',
      'penal': '#ef4444', 
      'laboral': '#10b981',
      'familia': '#f59e0b',
      'comercial': '#8b5cf6',
      'contencioso': '#06b6d4'
    };
    return colores[tipo?.toLowerCase()] || '#6b7280';
  };

  const getPrioridadColor = (prioridad) => {
    const colores = {
      'alta': '#ef4444',
      'media': '#f59e0b', 
      'baja': '#10b981'
    };
    return colores[prioridad] || '#6b7280';
  };

  return (
    <div 
      className="caso-card"
      onClick={() => onClick(caso)}
      style={{ borderLeft: `4px solid ${getColorForType(caso.tipo)}` }}
    >
      <div className="caso-header">
        <div className="caso-numero">
          <span className="numero">{caso.numero}</span>
          <span 
            className="prioridad-badge"
            style={{ backgroundColor: getPrioridadColor(caso.prioridad) }}
          >
            {caso.prioridad}
          </span>
        </div>
        
        <div className="caso-actions">
          <button
            className={`btn-favorito ${caso.favorito ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorito(caso.id);
            }}
          >
            {caso.favorito ? '⭐' : '☆'}
          </button>
          
          <button
            className="btn-menu"
            onClick={(e) => {
              e.stopPropagation();
              // Mostrar menú contextual
            }}
          >
            ⋮
          </button>
        </div>
      </div>
      
      <div className="caso-content">
        <h3 className="caso-cliente">{caso.cliente}</h3>
        <p className="caso-descripcion">{caso.descripcion}</p>
        
        <div className="caso-meta">
          <span className="tipo-badge" style={{ color: getColorForType(caso.tipo) }}>
            {caso.tipo?.toUpperCase()}
          </span>
          <span className="estado-badge">{caso.estado}</span>
        </div>
        
        {caso.fechaAudiencia && (
          <div className="caso-audiencia">
            📅 Audiencia: {new Date(caso.fechaAudiencia).toLocaleDateString()}
          </div>
        )}
        
        {caso.observaciones && (
          <div className="caso-observaciones">
            📝 {caso.observaciones.substring(0, 100)}...
          </div>
        )}
      </div>
      
      <div className="caso-footer">
        <div className="caso-fechas">
          <span>Creado: {new Date(caso.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString()}</span>
          {caso.updatedAt && (
            <span>Actualizado: {new Date(caso.updatedAt?.seconds * 1000).toLocaleDateString()}</span>
          )}
        </div>
        
        <div className="caso-progreso">
          <div className="progreso-bar">
            <div 
              className="progreso-fill"
              style={{ width: `${caso.progreso || 0}%` }}
            ></div>
          </div>
          <span>{caso.progreso || 0}%</span>
        </div>
      </div>
    </div>
  );
};

const CasosGrid = ({ casos, onCasoClick, onToggleFavorito, onCambiarEstado, onEliminar }) => {
  if (casos.length === 0) {
    return (
      <div className="casos-empty">
        <div className="empty-icon">📋</div>
        <h3>No hay casos</h3>
        <p>Crea tu primer caso para comenzar</p>
      </div>
    );
  }

  return (
    <div className="casos-grid">
      {casos.map(caso => (
        <CasoCard
          key={caso.id}
          caso={caso}
          onClick={onCasoClick}
          onToggleFavorito={onToggleFavorito}
          onCambiarEstado={onCambiarEstado}
          onEliminar={onEliminar}
        />
      ))}
    </div>
  );
};

const ModalNuevoCaso = ({ mostrar, onCerrar, onGuardar, cargando }) => {
  const [formData, setFormData] = React.useState({
    numero: '',
    cliente: '',
    tipo: 'civil',
    descripcion: '',
    prioridad: 'media',
    estado: 'postulatoria'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onGuardar(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!mostrar) return null;

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Nuevo Caso</h3>
          <button className="btn-cerrar" onClick={onCerrar}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Número de Expediente</label>
            <input
              type="text"
              value={formData.numero}
              onChange={(e) => handleChange('numero', e.target.value)}
              placeholder="Ej: 12345-2024-0-1234-JM-CI-01"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Cliente</label>
            <input
              type="text"
              value={formData.cliente}
              onChange={(e) => handleChange('cliente', e.target.value)}
              placeholder="Nombre del cliente"
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Tipo</label>
              <select
                value={formData.tipo}
                onChange={(e) => handleChange('tipo', e.target.value)}
              >
                <option value="civil">Civil</option>
                <option value="penal">Penal</option>
                <option value="laboral">Laboral</option>
                <option value="familia">Familia</option>
                <option value="comercial">Comercial</option>
                <option value="contencioso">Contencioso</option>
                <option value="constitucional">Constitucional</option>
                <option value="tributario">Tributario</option>
                <option value="ejecucion">Ejecución</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Prioridad</label>
              <select
                value={formData.prioridad}
                onChange={(e) => handleChange('prioridad', e.target.value)}
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </div>
          </div>

          {/* Campo de Estado - Solo se muestra si se ha seleccionado un tipo */}
          {formData.tipo && (
            <div className="form-group">
              <label>Estado Procesal</label>
              <select
                value={formData.estado}
                onChange={(e) => handleChange('estado', e.target.value)}
              >
                <option value="">Seleccionar estado</option>
                {getEtapasProcesales(formData.tipo).map(etapa => (
                  <option key={etapa.value} value={etapa.value}>
                    {etapa.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="form-group">
            <label>Descripción</label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              placeholder="Descripción del caso"
              rows="3"
            />
          </div>
          
          <div className="modal-footer">
            <button type="button" onClick={onCerrar} className="btn-cancelar">
              Cancelar
            </button>
            <button type="submit" disabled={cargando} className="btn-guardar">
              {cargando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CasosStats = ({ stats }) => (
  <div className="casos-stats">
    <div className="stat-item">
      <span className="stat-number">{stats.total}</span>
      <span className="stat-label">Total</span>
    </div>
    <div className="stat-item">
      <span className="stat-number">{stats.activos}</span>
      <span className="stat-label">Activos</span>
    </div>
    <div className="stat-item">
      <span className="stat-number">{stats.prioritarios}</span>
      <span className="stat-label">Prioritarios</span>
    </div>
    <div className="stat-item">
      <span className="stat-number">{stats.audienciasProximas}</span>
      <span className="stat-label">Audiencias</span>
    </div>
  </div>
);

// Componente principal de vista
const CasosView = ({
  // Estados de datos
  casos,
  casosFiltrados,
  stats,
  
  // Estados de UI
  busqueda,
  vistaActiva,
  mostrarModalNuevoCaso,
  cargando,
  
  // Handlers
  onBusquedaChange,
  onVistaChange,
  onCasoClick,
  onNuevoCaso,
  onCerrarModal,
  onGuardarCaso,
  onToggleFavorito,
  onCambiarEstado,
  onEliminar
}) => {
  return (
    <div className="casos-container">
      <CasosHeader
        busqueda={busqueda}
        onBusquedaChange={onBusquedaChange}
        vistaActiva={vistaActiva}
        onVistaChange={onVistaChange}
        onNuevoCaso={onNuevoCaso}
        totalCasos={casos.length}
      />
      
      <CasosStats stats={stats} />
      
      <CasosGrid
        casos={casosFiltrados}
        onCasoClick={onCasoClick}
        onToggleFavorito={onToggleFavorito}
        onCambiarEstado={onCambiarEstado}
        onEliminar={onEliminar}
      />
      
      <ModalNuevoCaso
        mostrar={mostrarModalNuevoCaso}
        onCerrar={onCerrarModal}
        onGuardar={onGuardarCaso}
        cargando={cargando}
      />
    </div>
  );
};

export default CasosView;