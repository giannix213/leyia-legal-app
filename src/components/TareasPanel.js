// src/components/TareasPanel.js
// Componente de ejemplo para mostrar y gestionar tareas de un caso
import React, { useState } from 'react';
import { useTareas } from '../hooks/useTareas';

function TareasPanel({ casoId, casoNumero }) {
  const {
    tareas,
    cargando,
    error,
    agregarTarea,
    actualizarTarea,
    eliminarTarea,
    toggleCompletada,
    getTareasPorTipo,
    tareasPendientes,
    tareasCompletadas
  } = useTareas(casoId);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nuevaTarea, setNuevaTarea] = useState({
    descripcion: '',
    tipo: 'tarea',
    prioridad: 'media',
    fechaLimite: ''
  });

  const handleAgregarTarea = async (e) => {
    e.preventDefault();
    
    if (!nuevaTarea.descripcion.trim()) {
      alert('La descripción es requerida');
      return;
    }

    try {
      await agregarTarea(nuevaTarea);
      
      // Limpiar formulario
      setNuevaTarea({
        descripcion: '',
        tipo: 'tarea',
        prioridad: 'media',
        fechaLimite: ''
      });
      setMostrarFormulario(false);
      
      console.log('✅ Tarea agregada exitosamente');
    } catch (err) {
      console.error('Error agregando tarea:', err);
      alert('Error al agregar la tarea');
    }
  };

  const handleToggleCompletada = async (tareaId, completada) => {
    try {
      await toggleCompletada(tareaId, !completada);
      console.log('✅ Tarea actualizada');
    } catch (err) {
      console.error('Error actualizando tarea:', err);
      alert('Error al actualizar la tarea');
    }
  };

  const handleEliminarTarea = async (tareaId) => {
    if (!window.confirm('¿Estás seguro de eliminar esta tarea?')) {
      return;
    }

    try {
      await eliminarTarea(tareaId);
      console.log('✅ Tarea eliminada');
    } catch (err) {
      console.error('Error eliminando tarea:', err);
      alert('Error al eliminar la tarea');
    }
  };

  const getIconoPorTipo = (tipo) => {
    switch (tipo) {
      case 'tarea': return '📝';
      case 'coordinacion': return '📞';
      case 'diligencia': return '🏃‍♂️';
      default: return '📋';
    }
  };

  const getColorPorPrioridad = (prioridad) => {
    switch (prioridad) {
      case 'alta': return '#ef4444';
      case 'media': return '#f59e0b';
      case 'baja': return '#10b981';
      default: return '#6b7280';
    }
  };

  if (cargando) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Cargando tareas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: '#ef4444' }}>
        <div>Error: {error}</div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '2px solid #e5e7eb'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>
            Tareas del Caso {casoNumero}
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
            {tareasPendientes} pendientes • {tareasCompletadas} completadas
          </p>
        </div>
        
        <button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          style={{
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          {mostrarFormulario ? 'Cancelar' : '+ Nueva Tarea'}
        </button>
      </div>

      {/* Formulario de nueva tarea */}
      {mostrarFormulario && (
        <form onSubmit={handleAgregarTarea} style={{
          background: '#f9fafb',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
              Descripción
            </label>
            <textarea
              value={nuevaTarea.descripcion}
              onChange={(e) => setNuevaTarea({ ...nuevaTarea, descripcion: e.target.value })}
              placeholder="Describe la tarea..."
              rows="3"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit'
              }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
                Tipo
              </label>
              <select
                value={nuevaTarea.tipo}
                onChange={(e) => setNuevaTarea({ ...nuevaTarea, tipo: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="tarea">📝 Tarea</option>
                <option value="coordinacion">📞 Coordinación</option>
                <option value="diligencia">🏃‍♂️ Diligencia</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
                Prioridad
              </label>
              <select
                value={nuevaTarea.prioridad}
                onChange={(e) => setNuevaTarea({ ...nuevaTarea, prioridad: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
                Fecha Límite
              </label>
              <input
                type="date"
                value={nuevaTarea.fechaLimite}
                onChange={(e) => setNuevaTarea({ ...nuevaTarea, fechaLimite: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              width: '100%'
            }}
          >
            Agregar Tarea
          </button>
        </form>
      )}

      {/* Lista de tareas */}
      {tareas.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: '#6b7280'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>📝</div>
          <div>No hay tareas para este caso</div>
          <div style={{ fontSize: '13px', marginTop: '8px' }}>
            Haz clic en "Nueva Tarea" para agregar una
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {tareas.map(tarea => (
            <div
              key={tarea.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px',
                background: tarea.completada ? '#f9fafb' : 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={tarea.completada}
                onChange={() => handleToggleCompletada(tarea.id, tarea.completada)}
                style={{
                  width: '20px',
                  height: '20px',
                  marginTop: '2px',
                  cursor: 'pointer'
                }}
              />

              {/* Contenido */}
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px'
                }}>
                  <span style={{ fontSize: '18px' }}>
                    {getIconoPorTipo(tarea.tipo)}
                  </span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: tarea.completada ? '#9ca3af' : '#1f2937',
                    textDecoration: tarea.completada ? 'line-through' : 'none'
                  }}>
                    {tarea.descripcion}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '12px',
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: getColorPorPrioridad(tarea.prioridad),
                    color: 'white',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    fontSize: '11px'
                  }}>
                    {tarea.prioridad}
                  </span>
                  
                  {tarea.fechaLimite && (
                    <span>📅 {new Date(tarea.fechaLimite).toLocaleDateString('es-ES')}</span>
                  )}
                  
                  {tarea.completada && tarea.fechaCompletada && (
                    <span>✅ {new Date(tarea.fechaCompletada).toLocaleDateString('es-ES')}</span>
                  )}
                </div>
              </div>

              {/* Botón eliminar */}
              <button
                onClick={() => handleEliminarTarea(tarea.id)}
                style={{
                  padding: '4px 8px',
                  background: 'transparent',
                  border: '1px solid #ef4444',
                  borderRadius: '4px',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
                title="Eliminar tarea"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TareasPanel;
