import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export function useEquipoStorage(organizacionId) {
  const [data, setData] = useState({
    stickyNotes: [
      {
        id: crypto.randomUUID(),
        type: 'blue',
        title: 'PROCESOS IA',
        content: 'Refinar algoritmos de búsqueda jurídica para mayor precisión en casos.',
        position: { top: 30, left: 40 },
        rotation: -2
      },
      {
        id: crypto.randomUUID(),
        type: 'purple',
        title: 'LATENCIA',
        content: 'Optimizar los servidores Firebase para mejor rendimiento.',
        position: { top: 150, left: 200 },
        rotation: 3
      },
      {
        id: crypto.randomUUID(),
        type: 'green',
        title: 'EQUIPO',
        content: 'Sesiones de capacitación en nuevas herramientas jurídicas.',
        position: { top: 30, left: 400 },
        rotation: 1
      }
    ],
    todoItems: [
      { id: crypto.randomUUID(), text: 'Refuel X-Wing', completed: true },
      { id: crypto.randomUUID(), text: 'Meditation', completed: false },
      { id: crypto.randomUUID(), text: 'Droid Maintenance', completed: false },
      { id: crypto.randomUUID(), text: 'Study Force Ghosting', completed: false }
    ],
    weeklyTasks: {
      MON: 'Saber Practice',
      TUE: 'Holocron Sync',
      WED: '',
      THU: '',
      FRI: '',
      SAT: ''
    },
    saving: false
  });

  // Cargar datos del equipo desde Firebase
  const cargarDatosEquipo = useCallback(async () => {
    if (!organizacionId) return;

    try {
      const equipoRef = doc(db, 'equipoData', organizacionId);
      const equipoSnap = await getDoc(equipoRef);
      
      if (equipoSnap.exists()) {
        const datosGuardados = equipoSnap.data();
        setData(prev => ({
          ...prev,
          stickyNotes: datosGuardados.stickyNotes || prev.stickyNotes,
          todoItems: datosGuardados.todoItems || prev.todoItems,
          weeklyTasks: datosGuardados.weeklyTasks || prev.weeklyTasks
        }));
      }
    } catch (error) {
      console.error('Error al cargar datos del equipo:', error);
    }
  }, [organizacionId]);

  // Guardar datos del equipo en Firebase
  const guardarDatosEquipo = useCallback(async () => {
    if (!organizacionId) return;

    try {
      setData(prev => ({ ...prev, saving: true }));
      
      const equipoRef = doc(db, 'equipoData', organizacionId);
      await setDoc(equipoRef, {
        stickyNotes: data.stickyNotes,
        todoItems: data.todoItems,
        weeklyTasks: data.weeklyTasks,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
      
    } catch (error) {
      console.error('Error al guardar datos del equipo:', error);
    } finally {
      setData(prev => ({ ...prev, saving: false }));
    }
  }, [organizacionId, data.stickyNotes, data.todoItems, data.weeklyTasks]);

  // Auto-guardar cuando cambien los datos (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (organizacionId) {
        guardarDatosEquipo();
      }
    }, 1000); // Guardar después de 1 segundo de inactividad

    return () => clearTimeout(timeoutId);
  }, [data.stickyNotes, data.todoItems, data.weeklyTasks, organizacionId, guardarDatosEquipo]);

  // Cargar datos al montar o cambiar organización
  useEffect(() => {
    cargarDatosEquipo();
  }, [cargarDatosEquipo]);

  // Funciones para actualizar sticky notes
  const updateStickyNotes = useCallback((newNotes) => {
    setData(prev => ({ ...prev, stickyNotes: newNotes }));
  }, []);

  const addStickyNote = useCallback((note) => {
    const newNote = {
      ...note,
      id: crypto.randomUUID(),
      position: { 
        top: Math.random() * 200 + 50, 
        left: Math.random() * 400 + 50 
      },
      rotation: (Math.random() - 0.5) * 6 // -3 a 3 grados
    };
    setData(prev => ({ 
      ...prev, 
      stickyNotes: [...prev.stickyNotes, newNote] 
    }));
  }, []);

  const updateStickyNote = useCallback((noteId, updates) => {
    setData(prev => ({
      ...prev,
      stickyNotes: prev.stickyNotes.map(note => 
        note.id === noteId ? { ...note, ...updates } : note
      )
    }));
  }, []);

  const deleteStickyNote = useCallback((noteId) => {
    setData(prev => ({
      ...prev,
      stickyNotes: prev.stickyNotes.filter(note => note.id !== noteId)
    }));
  }, []);

  // Funciones para actualizar todo items
  const updateTodoItems = useCallback((newItems) => {
    setData(prev => ({ ...prev, todoItems: newItems }));
  }, []);

  const addTodoItem = useCallback((text) => {
    const newItem = {
      id: crypto.randomUUID(),
      text: text.trim(),
      completed: false
    };
    setData(prev => ({ 
      ...prev, 
      todoItems: [...prev.todoItems, newItem] 
    }));
  }, []);

  const toggleTodoItem = useCallback((itemId) => {
    setData(prev => ({
      ...prev,
      todoItems: prev.todoItems.map(item => 
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    }));
  }, []);

  const deleteTodoItem = useCallback((itemId) => {
    setData(prev => ({
      ...prev,
      todoItems: prev.todoItems.filter(item => item.id !== itemId)
    }));
  }, []);

  // Funciones para actualizar weekly tasks
  const updateWeeklyTask = useCallback((day, value) => {
    setData(prev => ({
      ...prev,
      weeklyTasks: {
        ...prev.weeklyTasks,
        [day]: value
      }
    }));
  }, []);

  return {
    ...data,
    // Sticky Notes
    updateStickyNotes,
    addStickyNote,
    updateStickyNote,
    deleteStickyNote,
    // Todo Items
    updateTodoItems,
    addTodoItem,
    toggleTodoItem,
    deleteTodoItem,
    // Weekly Tasks
    updateWeeklyTask,
    // Utilidades
    recargar: cargarDatosEquipo
  };
}