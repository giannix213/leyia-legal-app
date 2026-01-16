import { useState, useEffect } from 'react';
import './VistaGeneralExpedientes.css';
import { useDragDropExpedientes } from '../hooks/useDragDropExpedientes';
import { useExpedientesCategorizados } from '../hooks/useExpedientesCategorizados';

function VistaGeneralExpedientes({ 
  expedientesOrdenados,
  onVolver,
  onRecargar,
  onActualizarExpediente
}) {
  const [expedientesLocales, setExpedientesLocales] = useState([]);

  // Hook para drag & drop (desacoplado)
  const {
    draggedItem,
    draggedFromColumn,
    dragOverColumn,
    dragOverItem,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnterColumn,
    handleDragLeaveColumn,
    handleDragEnterItem,
    handleDragLeaveItem,
    handleDrop
  } = useDragDropExpedientes(onActualizarExpediente);

  // Hook para categorización (desacoplado)
  const expedientesCategorizados = useExpedientesCategorizados(expedientesLocales);

  // Sincronizar estado local con props SOLO en la carga inicial
  useEffect(() => {
    if (expedientesLocales.length === 0) {
      console.log('🔄 Carga inicial de expedientes');
      setExpedientesLocales(expedientesOrdenados);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wrapper para handleDrop que incluye setExpedientesLocales
  const handleDropWrapper = async (e, targetColumna) => {
    // Mapear columna a tipoTarea
    const tipoTareaMap = {
      'tareas': 'tarea',
      'coordinaciones': 'coordinacion',
      'diligencias': 'diligencia'
    };

    const nuevoTipoTarea = tipoTareaMap[targetColumna];

    // Obtener la lista de la columna destino
    const columnaKey = targetColumna === 'tareas' ? 'tareas' : 
                       targetColumna === 'coordinaciones' ? 'coordinaciones' : 'diligencias';
    const itemsEnColumna = expedientesCategorizados[columnaKey];

    try {
      await handleDrop(e, nuevoTipoTarea, itemsEnColumna, setExpedientesLocales);
      mostrarNotificacion(`✅ Movido a ${targetColumna}`, 'success');
    } catch (error) {
      console.error('❌ Error actualizando orden:', error);
      mostrarNotificacion('❌ Error al mover la tarea', 'error');
      setExpedientesLocales(expedientesOrdenados);
    }
  };

  const handleDragOverItem = (e, expediente) => {
    e.preventDefault();
    if (draggedItem && draggedItem.id !== expediente.id) {
      handleDragEnterItem(expediente);
    }
  };

  const mostrarNotificacion = (mensaje, tipo = 'success') => {
    const notification = document.createElement('div');
    notification.textContent = mensaje;
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: ${tipo === 'success' ? 
        'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 
        'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'};
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      font-weight: 600;
      animation: slideInRight 0.3s ease-out;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  };

  const renderExpedienteCard = (exp, categoria) => {
    const colores = { tarea: '#3b82f6', coordinacion: '#10b981', diligencia: '#f59e0b' };
    const iconos = { tarea: '📝', coordinacion: '📞', diligencia: '🏃‍♂️' };
    const isDragging = draggedItem?.id === exp.id;
    const isDragOver = dragOverItem?.id === exp.id;

    return (
      <div 
        key={exp.id} 
        className={`expediente-card-categorizado ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over-item' : ''}`}
        draggable="true"
        onDragStart={(e) => handleDragStart(e, exp, categoria === 'tarea' ? 'tareas' : categoria === 'coordinacion' ? 'coordinaciones' : 'diligencias')}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => handleDragOverItem(e, exp)}
        style={{
          borderLeft: `4px solid ${colores[categoria]}`,
          background: 'white', 
          borderRadius: '8px', 
          padding: '16px', 
          marginBottom: '12px',
          boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
          cursor: 'grab',
          transition: 'all 0.2s ease',
          opacity: isDragging ? 0.5 : 1,
          transform: isDragging ? 'rotate(2deg) scale(1.02)' : 'none',
          borderTop: isDragOver ? `3px dashed ${colores[categoria]}` : 'none',
          paddingTop: isDragOver ? '20px' : '16px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>{iconos[categoria]}</span>
            <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '500' }}>
              ⋮⋮ Arrastrar
            </span>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#6b7280' }}>
            {exp.numero || exp.expediente}
          </span>
        </div>
        <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
          {(exp.cliente || exp.demandante || 'Sin Cliente').toUpperCase()}
        </div>
        <div style={{ background: '#f9fafb', padding: '8px', borderRadius: '4px', fontSize: '12px', color: '#374151', minHeight: '20px' }}>
          {exp.observaciones || 'Sin observaciones'}
        </div>
      </div>
    );
  };

  return (
    <div className="vista-general-expedientes" style={{ 
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#f3f4f6',
      overflow: 'hidden'
    }}>
      {/* Header fijo */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '20px',
        background: '#f3f4f6',
        flexShrink: 0
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>
            PANEL DE CONTROL - TAREAS
          </h1>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
            💡 Arrastra las tarjetas entre columnas para cambiar su tipo
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onRecargar} style={{ padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', border: '1px solid #d1d5db', background: 'white' }}>Recargar</button>
          <button onClick={onVolver} style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Volver</button>
        </div>
      </div>

      {/* Contenedor con scroll único */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '0 20px 20px 20px'
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '20px'
        }}>
          {/* Columna Tareas */}
          <div 
            className={`column ${dragOverColumn === 'tareas' ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragEnter={() => handleDragEnterColumn('tareas')}
            onDragLeave={handleDragLeaveColumn}
            onDrop={(e) => handleDropWrapper(e, 'tareas')}
            style={{
              minHeight: '200px',
              transition: 'all 0.3s ease',
              background: dragOverColumn === 'tareas' ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
              borderRadius: '12px',
              padding: dragOverColumn === 'tareas' ? '8px' : '0'
            }}
          >
            <h2 style={{ 
              color: '#1e40af', 
              borderBottom: '2px solid #3b82f6', 
              paddingBottom: '10px', 
              fontSize: '18px',
              marginBottom: '12px',
              position: 'sticky',
              top: 0,
              background: '#f3f4f6',
              zIndex: 10
            }}>
              📝 Tareas ({expedientesCategorizados.tareas.length})
            </h2>
            {expedientesCategorizados.tareas.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#9ca3af',
                fontSize: '14px',
                border: '2px dashed #d1d5db',
                borderRadius: '8px',
                background: 'white'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '8px', opacity: 0.3 }}>📝</div>
                <div>Arrastra tareas aquí</div>
              </div>
            ) : (
              expedientesCategorizados.tareas.map(exp => renderExpedienteCard(exp, 'tarea'))
            )}
          </div>

          {/* Columna Coordinaciones */}
          <div 
            className={`column ${dragOverColumn === 'coordinaciones' ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragEnter={() => handleDragEnterColumn('coordinaciones')}
            onDragLeave={handleDragLeaveColumn}
            onDrop={(e) => handleDropWrapper(e, 'coordinaciones')}
            style={{
              minHeight: '200px',
              transition: 'all 0.3s ease',
              background: dragOverColumn === 'coordinaciones' ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
              borderRadius: '12px',
              padding: dragOverColumn === 'coordinaciones' ? '8px' : '0'
            }}
          >
            <h2 style={{ 
              color: '#065f46', 
              borderBottom: '2px solid #10b981', 
              paddingBottom: '10px', 
              fontSize: '18px',
              marginBottom: '12px',
              position: 'sticky',
              top: 0,
              background: '#f3f4f6',
              zIndex: 10
            }}>
              📞 Coordinaciones ({expedientesCategorizados.coordinaciones.length})
            </h2>
            {expedientesCategorizados.coordinaciones.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#9ca3af',
                fontSize: '14px',
                border: '2px dashed #d1d5db',
                borderRadius: '8px',
                background: 'white'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '8px', opacity: 0.3 }}>📞</div>
                <div>Arrastra coordinaciones aquí</div>
              </div>
            ) : (
              expedientesCategorizados.coordinaciones.map(exp => renderExpedienteCard(exp, 'coordinacion'))
            )}
          </div>

          {/* Columna Diligencias */}
          <div 
            className={`column ${dragOverColumn === 'diligencias' ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragEnter={() => handleDragEnterColumn('diligencias')}
            onDragLeave={handleDragLeaveColumn}
            onDrop={(e) => handleDropWrapper(e, 'diligencias')}
            style={{
              minHeight: '200px',
              transition: 'all 0.3s ease',
              background: dragOverColumn === 'diligencias' ? 'rgba(245, 158, 11, 0.05)' : 'transparent',
              borderRadius: '12px',
              padding: dragOverColumn === 'diligencias' ? '8px' : '0'
            }}
          >
            <h2 style={{ 
              color: '#92400e', 
              borderBottom: '2px solid #f59e0b', 
              paddingBottom: '10px', 
              fontSize: '18px',
              marginBottom: '12px',
              position: 'sticky',
              top: 0,
              background: '#f3f4f6',
              zIndex: 10
            }}>
              🏃‍♂️ Diligencias ({expedientesCategorizados.diligencias.length})
            </h2>
            {expedientesCategorizados.diligencias.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#9ca3af',
                fontSize: '14px',
                border: '2px dashed #d1d5db',
                borderRadius: '8px',
                background: 'white'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '8px', opacity: 0.3 }}>🏃‍♂️</div>
                <div>Arrastra diligencias aquí</div>
              </div>
            ) : (
              expedientesCategorizados.diligencias.map(exp => renderExpedienteCard(exp, 'diligencia'))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VistaGeneralExpedientes;
