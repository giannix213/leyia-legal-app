import React, { useState, useEffect, useCallback } from 'react';
import { useOrganizacionContext } from '../contexts/OrganizacionContext';
import { useEquipoDatos } from '../hooks/useEquipoDatos';
import { useEquipoStorage } from '../hooks/useEquipoStorage';
import { useCasos } from '../hooks/useCasos';
import { cargarOrden, guardarOrden, cargarTextos, guardarTextos, crearLineaDivisoria } from '../utils/expedientesUtils';
import VistaGeneralExpedientes from './VistaGeneralExpedientes';
import './Equipo.css';

function Equipo() {
  const { organizacionActual } = useOrganizacionContext();
  
  // Hooks personalizados para limpiar el componente
  const { 
    teamMembers, 
    expedientes, 
    perfilUsuario, 
    organizacionInfo, 
    loading, 
    error,
    recargar
  } = useEquipoDatos(organizacionActual?.id);

  // Hook para actualizar casos
  const { actualizarCaso } = useCasos();

  const {
    stickyNotes,
    todoItems,
    weeklyTasks,
    saving,
    updateStickyNotes,
    addStickyNote,
    updateStickyNote,
    deleteStickyNote,
    addTodoItem,
    toggleTodoItem,
    deleteTodoItem,
    updateWeeklyTask
  } = useEquipoStorage(organizacionActual?.id);

  // Estados de UI específicos del componente
  const [selectedRole, setSelectedRole] = useState('ADMIN');
  const [vistaActual, setVistaActual] = useState('equipo'); // 'equipo' o 'expedientes'
  const [expedientesOrdenados, setExpedientesOrdenados] = useState([]);
  const [textosExpedientes, setTextosExpedientes] = useState({});
  const [menuContextual, setMenuContextual] = useState({ mostrar: false, x: 0, y: 0, index: null });

  // Estados para sticky notes UI
  const [draggedNote, setDraggedNote] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [editingNote, setEditingNote] = useState(null);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '', type: 'blue' });

  // Estados para todo items UI
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');

  // Calcular roles disponibles
  const roles = ['TODOS', ...new Set(teamMembers.map(member => member.role))].filter(Boolean);

  // Sincronizar expedientes con el orden guardado
  useEffect(() => {
    if (expedientes.length > 0) {
      setExpedientesOrdenados(prev => {
        if (prev.length === 0) {
          return cargarOrden(expedientes);
        }
        return prev;
      });
    }
  }, [expedientes]);

  // Cargar textos guardados al inicio
  useEffect(() => {
    const textosGuardados = cargarTextos();
    setTextosExpedientes(textosGuardados);
  }, []);

  // Actualizar el rol seleccionado cuando cambien los miembros
  useEffect(() => {
    if (teamMembers.length > 0 && !roles.includes(selectedRole)) {
      setSelectedRole('TODOS');
    }
  }, [teamMembers, roles, selectedRole]);

  // Funciones para manejo de tareas
  const handleAddNewTask = useCallback(() => {
    if (newTaskText.trim()) {
      addTodoItem(newTaskText);
      setNewTaskText('');
      setIsAddingTask(false);
    }
  }, [newTaskText, addTodoItem]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleAddNewTask();
    } else if (e.key === 'Escape') {
      setIsAddingTask(false);
      setNewTaskText('');
    }
  }, [handleAddNewTask]);

  // Funciones para sticky notes
  const handleMouseDown = useCallback((e, noteId) => {
    const note = stickyNotes.find(n => n.id === noteId);
    const rect = e.target.getBoundingClientRect();
    const canvasRect = e.target.closest('.figma-canvas').getBoundingClientRect();
    
    setDraggedNote(noteId);
    setDragOffset({
      x: e.clientX - (canvasRect.left + note.position.left),
      y: e.clientY - (canvasRect.top + note.position.top)
    });
  }, [stickyNotes]);

  const handleMouseMove = useCallback((e) => {
    if (draggedNote) {
      const canvasRect = e.currentTarget.getBoundingClientRect();
      const newLeft = e.clientX - canvasRect.left - dragOffset.x;
      const newTop = e.clientY - canvasRect.top - dragOffset.y;
      
      // Limitar movimiento dentro del canvas
      const maxLeft = canvasRect.width - 140; // ancho de la nota
      const maxTop = canvasRect.height - 120; // alto de la nota
      
      const newNotes = stickyNotes.map(note => 
        note.id === draggedNote 
          ? { 
              ...note, 
              position: { 
                left: Math.max(0, Math.min(newLeft, maxLeft)),
                top: Math.max(0, Math.min(newTop, maxTop))
              }
            }
          : note
      );
      updateStickyNotes(newNotes);
    }
  }, [draggedNote, dragOffset, stickyNotes, updateStickyNotes]);

  const handleMouseUp = useCallback(() => {
    setDraggedNote(null);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  const startEditingNote = useCallback((noteId) => {
    const note = stickyNotes.find(n => n.id === noteId);
    setEditingNote({ ...note });
  }, [stickyNotes]);

  const saveEditingNote = useCallback(() => {
    updateStickyNote(editingNote.id, editingNote);
    setEditingNote(null);
  }, [editingNote, updateStickyNote]);

  const handleAddNewStickyNote = useCallback(() => {
    if (newNote.title.trim() && newNote.content.trim()) {
      addStickyNote(newNote);
      setNewNote({ title: '', content: '', type: 'blue' });
      setIsAddingNote(false);
    }
  }, [newNote, addStickyNote]);

  // Funciones para expedientes
  const handleTextoChange = useCallback((expedienteId, texto) => {
    setTextosExpedientes(prev => {
      const nuevosTextos = {
        ...prev,
        [expedienteId]: texto
      };
      guardarTextos(nuevosTextos);
      return nuevosTextos;
    });
  }, []);

  const handleGuardarOrden = useCallback((orden) => {
    guardarOrden(orden, textosExpedientes);
  }, [textosExpedientes]);

  const agregarLineaDivisoria = useCallback(() => {
    const nuevaLinea = crearLineaDivisoria();
    const nuevosExpedientes = [...expedientesOrdenados];
    nuevosExpedientes.splice(menuContextual.index, 0, nuevaLinea);
    
    setExpedientesOrdenados(nuevosExpedientes);
    guardarOrden(nuevosExpedientes, textosExpedientes);
    setMenuContextual({ mostrar: false, x: 0, y: 0, index: null });
  }, [expedientesOrdenados, menuContextual.index, textosExpedientes]);

  const eliminarElemento = useCallback(() => {
    const nuevosExpedientes = [...expedientesOrdenados];
    const elementoEliminado = nuevosExpedientes[menuContextual.index];
    
    if (elementoEliminado && elementoEliminado.esDivisor) {
      nuevosExpedientes.splice(menuContextual.index, 1);
      setExpedientesOrdenados(nuevosExpedientes);
      guardarOrden(nuevosExpedientes, textosExpedientes);
    } else if (elementoEliminado) {
      if (window.confirm(`¿Eliminar expediente ${elementoEliminado.numero}?`)) {
        nuevosExpedientes.splice(menuContextual.index, 1);
        setExpedientesOrdenados(nuevosExpedientes);
        guardarOrden(nuevosExpedientes, textosExpedientes);
      }
    }
    setMenuContextual({ mostrar: false, x: 0, y: 0, index: null });
  }, [expedientesOrdenados, menuContextual.index, textosExpedientes]);

  // Funciones de navegación
  const handleVolver = useCallback(() => {
    window.dispatchEvent(new CustomEvent('navigateToView', { 
      detail: { view: 'casos' } 
    }));
  }, []);

  const handleEstadisticas = useCallback(() => {
    window.dispatchEvent(new CustomEvent('navigateToView', { 
      detail: { view: 'estadisticas' } 
    }));
  }, []);

  const handleLogout = useCallback(() => {
    if (window.confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      window.dispatchEvent(new CustomEvent('logout'));
    }
  }, []);

  const getCompletedTasks = useCallback(() => {
    return todoItems.filter(item => item.completed).length;
  }, [todoItems]);

  // Mostrar loading o error si es necesario
  if (loading) {
    return (
      <div className="tactical-workspace">
        <div className="loading-container">
          <h2>Cargando datos del equipo...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tactical-workspace">
        <div className="error-container">
          <h2>Error al cargar datos del equipo</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

// --- SUSTITUYE EL BLOQUE DE VISTA GENERAL EN EQUIPO.JS POR ESTE ---
if (vistaActual === 'expedientes') {
  return (
    <div className="expedientes-fullscreen">
      <VistaGeneralExpedientes
        expedientesOrdenados={expedientes} // Usamos 'expedientes' (datos vivos del hook)
        onVolver={() => setVistaActual('equipo')} // Volver a la vista de equipo
        onRecargar={recargar} // Función de recarga de Firebase
        onActualizarExpediente={actualizarCaso} // Función para actualizar en Firebase
      />
    </div>
  );
}

  return (
    <div className="tactical-workspace">
      <div className="dashboard">
        {/* Header */}
        <div className="header">
          <div className="org-info">
            <h1>{organizacionInfo?.nombre?.toUpperCase() || organizacionActual?.nombre?.toUpperCase() || 'ACADEMIA JEDI: COMANDO'}</h1>
            <span className="subtitle">
              {perfilUsuario?.nombre ? `OPERADOR: ${perfilUsuario.nombre.toUpperCase()}` : 'SISTEMA OPERATIVO DE LOGÍSTICA V1.0'}
            </span>
          </div>
          <div className="header-actions">
            {saving && (
              <div className="saving-indicator">
                <span>GUARDANDO...</span>
              </div>
            )}
            <button 
              className={`view-toggle-btn ${vistaActual === 'expedientes' ? 'active' : ''}`}
              onClick={() => setVistaActual(vistaActual === 'equipo' ? 'expedientes' : 'equipo')}
              title={vistaActual === 'equipo' ? 'Ver Expedientes' : 'Ver Equipo'}
            >
              {vistaActual === 'equipo' ? '📋 EXPEDIENTES' : '👥 EQUIPO'}
            </button>
            <button 
              className="logout-btn"
              onClick={handleLogout}
              title="Cerrar Sesión"
            >
              🚪 LOGOUT
            </button>
            <button 
              className="stats-btn"
              onClick={handleEstadisticas}
              title="Ver Estadísticas"
            >
              📊 ESTADÍSTICAS
            </button>
            <button 
              className="nav-back-btn"
              onClick={handleVolver}
              title="Volver a Casos"
            >
              ← CASOS
            </button>
            <div className="status-badge">
              {organizacionInfo?.tipo ? `TIPO: ${organizacionInfo.tipo.replace('_', ' ').toUpperCase()}` : 'SECTOR: CORELLIA-7'}
            </div>
          </div>
        </div>

        {/* Vista de Equipo (contenido original) */}
        <>
          {/* Role Terminal */}
          <div className="role-terminal">
            <div className="role-grid">
              {roles.map((role) => (
                <div
                  key={role}
                  className={`role-btn ${selectedRole === role ? 'active' : ''}`}
                  onClick={() => setSelectedRole(role)}
                >
                  {role}
                </div>
              ))}
            </div>
          </div>

          {/* Squad List - Avance por Perfil */}
          <div className="squad-list">
            <h3 className="section-title">AVANCE POR PERFIL</h3>
            {teamMembers
              .filter(member => selectedRole === 'TODOS' || member.role === selectedRole)
              .map((member, index) => (
              <div key={member.id || index} className="member-card">
                <div className="member-info">
                  <span className="member-name">{member.name}</span>
                  <span className="member-role">{member.role}</span>
                  {member.email && (
                    <span className="member-email">{member.email}</span>
                  )}
                </div>
                <div className="saber-container">
                  <div 
                    className="saber-blade" 
                    style={{ 
                      width: `${member.progress}%`,
                      background: member.color,
                      boxShadow: `0 0 15px ${member.color}`
                    }}
                  ></div>
                </div>
                <div className="progress-text">{member.progress}%</div>
              </div>
            ))}
            
            {teamMembers.length === 0 && (
              <div className="no-members-message">
                <span>NO HAY MIEMBROS EN ESTA ORGANIZACIÓN</span>
              </div>
            )}
          </div>

          {/* Weekly Timetable - Avance Semanal */}
          <div className="weekly-progress-section">
            <h3 className="section-title">AVANCE SEMANAL</h3>
            <div className="timetable-grid">
              {Object.entries(weeklyTasks).map(([day, task]) => (
                <div key={day} className="day-column">
                  <div className="day-header">{day}</div>
                  <input 
                    className="task-input" 
                    value={task}
                    onChange={(e) => updateWeeklyTask(day, e.target.value)}
                    placeholder="..."
                  />
                  <div className="day-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${Math.random() * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Workspace Container */}
          <div className="workspace-container">
            {/* Mesa de Estrategias */}
            <div className="strategy-table">
              <h3 className="section-title">MESA DE ESTRATEGIAS</h3>
              <div 
                className="figma-canvas"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <div className="canvas-label">Colaboración en tiempo real</div>
                
                {/* Botón para agregar nueva nota */}
                <button 
                  className="add-note-btn"
                  onClick={() => setIsAddingNote(true)}
                  title="Agregar nueva nota"
                >
                  + NOTA
                </button>
                
                {/* Sticky Notes */}
                {stickyNotes.map((note) => (
                  <div
                    key={note.id}
                    className={`sticky-note sticky-${note.type} ${draggedNote === note.id ? 'dragging' : ''}`}
                    style={{
                      top: `${note.position.top}px`,
                      left: `${note.position.left}px`,
                      transform: `rotate(${note.rotation}deg)`,
                      zIndex: draggedNote === note.id ? 1000 : 3
                    }}
                    onMouseDown={(e) => handleMouseDown(e, note.id)}
                  >
                    {editingNote?.id === note.id ? (
                      <div className="note-editor">
                        <input
                          type="text"
                          value={editingNote.title}
                          onChange={(e) => setEditingNote({...editingNote, title: e.target.value})}
                          className="note-title-input"
                          placeholder="Título"
                        />
                        <textarea
                          value={editingNote.content}
                          onChange={(e) => setEditingNote({...editingNote, content: e.target.value})}
                          className="note-content-input"
                          placeholder="Contenido"
                        />
                        <div className="note-actions">
                          <button onClick={saveEditingNote} className="save-note-btn">✓</button>
                          <button onClick={() => setEditingNote(null)} className="cancel-note-btn">×</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="note-controls">
                          <button 
                            onClick={() => startEditingNote(note.id)}
                            className="edit-note-btn"
                            title="Editar nota"
                          >
                            ✎
                          </button>
                          <button 
                            onClick={() => deleteStickyNote(note.id)}
                            className="delete-note-btn"
                            title="Eliminar nota"
                          >
                            ×
                          </button>
                        </div>
                        <strong>{note.title}</strong>
                        <span>{note.content}</span>
                      </>
                    )}
                  </div>
                ))}

                {/* Cursors */}
                <svg
                  className="cursor admin"
                  data-name={perfilUsuario?.nombre || "Admin_User"}
                  style={{ top: '100px', left: '350px' }}
                  viewBox="0 0 24 24"
                  fill="#a259ff"
                >
                  <path d="M5.653 3.123l12.534 10.456-5.118.895 3.321 6.36-1.581.825-3.32-6.36-4.336 3.635V3.123z"/>
                </svg>
              </div>
              
              {/* Modal para agregar nueva nota */}
              {isAddingNote && (
                <div className="note-modal">
                  <div className="note-modal-content">
                    <h4>NUEVA NOTA ESTRATÉGICA</h4>
                    <input
                      type="text"
                      value={newNote.title}
                      onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                      placeholder="Título de la nota"
                      className="note-title-input"
                    />
                    <textarea
                      value={newNote.content}
                      onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                      placeholder="Contenido de la nota"
                      className="note-content-input"
                    />
                    <div className="note-type-selector">
                      <label>Color:</label>
                      {['blue', 'purple', 'green'].map(type => (
                        <button
                          key={type}
                          className={`color-btn color-${type} ${newNote.type === type ? 'selected' : ''}`}
                          onClick={() => setNewNote({...newNote, type})}
                        />
                      ))}
                    </div>
                    <div className="note-modal-actions">
                      <button onClick={handleAddNewStickyNote} className="confirm-btn">CREAR</button>
                      <button onClick={() => setIsAddingNote(false)} className="cancel-btn">CANCELAR</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Things to Do */}
            <div className="todo-section">
              <h3 className="section-title">THINGS TO DO</h3>
              <div className="todo-list">
                {todoItems.map((item) => (
                  <div key={item.id} className="todo-item">
                    <input 
                      type="checkbox" 
                      checked={item.completed}
                      onChange={() => toggleTodoItem(item.id)}
                      className="todo-checkbox"
                    />
                    <span className={`todo-text ${item.completed ? 'completed' : ''}`}>
                      {item.text}
                    </span>
                    <div className="todo-actions">
                      <div className="todo-status">
                        {item.completed ? '✓' : '○'}
                      </div>
                      <button 
                        className="delete-btn"
                        onClick={() => deleteTodoItem(item.id)}
                        title="Eliminar tarea"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* Add Task Input */}
                {isAddingTask ? (
                  <div className="add-task-input">
                    <input
                      type="text"
                      value={newTaskText}
                      onChange={(e) => setNewTaskText(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Escribe la nueva tarea..."
                      className="new-task-input"
                      autoFocus
                    />
                    <div className="task-input-actions">
                      <button 
                        className="confirm-btn"
                        onClick={handleAddNewTask}
                        disabled={!newTaskText.trim()}
                      >
                        ✓
                      </button>
                      <button 
                        className="cancel-btn"
                        onClick={() => {
                          setIsAddingTask(false);
                          setNewTaskText('');
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="add-task-btn"
                    onClick={() => setIsAddingTask(true)}
                  >
                    + AGREGAR TAREA
                  </div>
                )}
              </div>
            </div>
          </div>
        </>

        {/* Footer Metrics */}
        <div className="footer-metrics">
          <span>STATUS: ACTIVE</span>
          <span>| TARGETS: {getCompletedTasks().toString().padStart(2, '0')}/{todoItems.length.toString().padStart(2, '0')} |</span>
          <span>TIME: {new Date().toISOString().split('T')[0].replace(/-/g, '.')}</span>
        </div>
      </div>
    </div>
  );
}

export default Equipo;