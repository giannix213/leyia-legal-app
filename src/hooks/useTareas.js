// src/hooks/useTareas.js
// Hook para manejar tareas como subcolección (múltiples tareas por caso)
import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  query, 
  where, 
  onSnapshot,
  getDocs 
} from 'firebase/firestore';

/**
 * Hook para manejar tareas de un caso específico
 * Soporta múltiples tareas por caso usando subcolecciones
 * 
 * @param {string} casoId - ID del caso
 * @param {boolean} useRealtime - Activar/desactivar sincronización en tiempo real
 */
export const useTareas = (casoId, useRealtime = true) => {
  const [tareas, setTareas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Función para cargar tareas manualmente
  const cargarTareas = useCallback(async () => {
    if (!casoId) {
      console.warn('No hay casoId para cargar tareas');
      setTareas([]);
      setCargando(false);
      return;
    }

    console.log('🔍 Cargando tareas del caso:', casoId);
    setCargando(true);
    setError(null);

    try {
      const tareasRef = collection(db, 'casos', casoId, 'tareas');
      const snapshot = await getDocs(tareasRef);
      
      const tareasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Ordenar por fecha de creación
      tareasData.sort((a, b) => {
        const fechaA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const fechaB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return fechaB - fechaA;
      });

      console.log('✅ Tareas cargadas:', tareasData.length);
      setTareas(tareasData);
    } catch (err) {
      console.error('❌ Error cargando tareas:', err);
      setError(err.message);
      setTareas([]);
    } finally {
      setCargando(false);
    }
  }, [casoId]);

  // Listener en tiempo real
  useEffect(() => {
    if (!casoId) {
      setTareas([]);
      setCargando(false);
      return;
    }

    if (!useRealtime) {
      cargarTareas();
      return;
    }

    console.log('🔴 Iniciando listener de tareas para caso:', casoId);
    setCargando(true);
    setError(null);

    const tareasRef = collection(db, 'casos', casoId, 'tareas');

    const unsubscribe = onSnapshot(
      tareasRef,
      (snapshot) => {
        console.log('🔄 Actualización de tareas recibida:', snapshot.docs.length);
        
        const tareasData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Ordenar por fecha
        tareasData.sort((a, b) => {
          const fechaA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
          const fechaB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
          return fechaB - fechaA;
        });

        setTareas(tareasData);
        setCargando(false);
      },
      (err) => {
        console.error('❌ Error en listener de tareas:', err);
        setError(err.message);
        setCargando(false);
        // Fallback a carga manual
        cargarTareas();
      }
    );

    return () => {
      console.log('🔴 Desconectando listener de tareas');
      unsubscribe();
    };
  }, [casoId, useRealtime, cargarTareas]);

  // Agregar nueva tarea
  const agregarTarea = useCallback(async (datosTarea) => {
    if (!casoId) {
      throw new Error('No hay caso activo');
    }

    try {
      const tareasRef = collection(db, 'casos', casoId, 'tareas');
      
      const nuevaTarea = {
        descripcion: datosTarea.descripcion || '',
        tipo: datosTarea.tipo || 'tarea', // 'tarea', 'coordinacion', 'diligencia'
        prioridad: datosTarea.prioridad || 'media',
        completada: false,
        fechaLimite: datosTarea.fechaLimite || null,
        asignadoA: datosTarea.asignadoA || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(tareasRef, nuevaTarea);
      console.log('✅ Tarea agregada:', docRef.id);
      
      return { success: true, id: docRef.id };
    } catch (err) {
      console.error('❌ Error agregando tarea:', err);
      throw new Error('Error al agregar la tarea');
    }
  }, [casoId]);

  // Actualizar tarea
  const actualizarTarea = useCallback(async (tareaId, datosActualizados) => {
    if (!casoId) {
      throw new Error('No hay caso activo');
    }

    try {
      const tareaRef = doc(db, 'casos', casoId, 'tareas', tareaId);
      
      await updateDoc(tareaRef, {
        ...datosActualizados,
        updatedAt: serverTimestamp()
      });

      console.log('✅ Tarea actualizada:', tareaId);
      return { success: true };
    } catch (err) {
      console.error('❌ Error actualizando tarea:', err);
      throw new Error('Error al actualizar la tarea');
    }
  }, [casoId]);

  // Marcar tarea como completada/pendiente
  const toggleCompletada = useCallback(async (tareaId, completada) => {
    return actualizarTarea(tareaId, { 
      completada,
      fechaCompletada: completada ? new Date().toISOString() : null
    });
  }, [actualizarTarea]);

  // Eliminar tarea
  const eliminarTarea = useCallback(async (tareaId) => {
    if (!casoId) {
      throw new Error('No hay caso activo');
    }

    try {
      const tareaRef = doc(db, 'casos', casoId, 'tareas', tareaId);
      await deleteDoc(tareaRef);
      
      console.log('✅ Tarea eliminada:', tareaId);
      return { success: true };
    } catch (err) {
      console.error('❌ Error eliminando tarea:', err);
      throw new Error('Error al eliminar la tarea');
    }
  }, [casoId]);

  // Obtener tareas filtradas
  const getTareasPorTipo = useCallback((tipo) => {
    return tareas.filter(t => t.tipo === tipo);
  }, [tareas]);

  const getTareasPendientes = useCallback(() => {
    return tareas.filter(t => !t.completada);
  }, [tareas]);

  const getTareasCompletadas = useCallback(() => {
    return tareas.filter(t => t.completada);
  }, [tareas]);

  return {
    tareas,
    cargando,
    error,
    
    // Funciones CRUD
    agregarTarea,
    actualizarTarea,
    eliminarTarea,
    toggleCompletada,
    cargarTareas,
    
    // Filtros
    getTareasPorTipo,
    getTareasPendientes,
    getTareasCompletadas,
    
    // Estadísticas
    totalTareas: tareas.length,
    tareasPendientes: tareas.filter(t => !t.completada).length,
    tareasCompletadas: tareas.filter(t => t.completada).length
  };
};

/**
 * Hook para obtener TODAS las tareas de una organización
 * Útil para la Vista General
 * 
 * @param {string} organizacionId - ID de la organización
 * @param {boolean} useRealtime - Activar/desactivar sincronización en tiempo real
 */
export const useTareasOrganizacion = (organizacionId, useRealtime = true) => {
  const [tareasPorCaso, setTareasPorCaso] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Cargar todas las tareas de todos los casos
  const cargarTodasLasTareas = useCallback(async () => {
    if (!organizacionId) {
      console.warn('No hay organización para cargar tareas');
      setTareasPorCaso({});
      setCargando(false);
      return;
    }

    console.log('🔍 Cargando todas las tareas de la organización:', organizacionId);
    setCargando(true);
    setError(null);

    try {
      // Primero obtener todos los casos de la organización
      const casosRef = collection(db, 'casos');
      const casosQuery = query(casosRef, where('organizacionId', '==', organizacionId));
      const casosSnapshot = await getDocs(casosQuery);

      const todasLasTareas = {};

      // Para cada caso, obtener sus tareas
      for (const casoDoc of casosSnapshot.docs) {
        const casoId = casoDoc.id;
        const tareasRef = collection(db, 'casos', casoId, 'tareas');
        const tareasSnapshot = await getDocs(tareasRef);

        const tareas = tareasSnapshot.docs.map(doc => ({
          id: doc.id,
          casoId: casoId,
          casoNumero: casoDoc.data().numero,
          casoCliente: casoDoc.data().cliente,
          ...doc.data()
        }));

        if (tareas.length > 0) {
          todasLasTareas[casoId] = tareas;
        }
      }

      console.log('✅ Tareas cargadas de', Object.keys(todasLasTareas).length, 'casos');
      setTareasPorCaso(todasLasTareas);
    } catch (err) {
      console.error('❌ Error cargando tareas de organización:', err);
      setError(err.message);
      setTareasPorCaso({});
    } finally {
      setCargando(false);
    }
  }, [organizacionId]);

  useEffect(() => {
    cargarTodasLasTareas();
  }, [cargarTodasLasTareas]);

  // Obtener array plano de todas las tareas
  const todasLasTareas = Object.values(tareasPorCaso).flat();

  return {
    tareasPorCaso,
    todasLasTareas,
    cargando,
    error,
    recargar: cargarTodasLasTareas,
    
    // Filtros globales
    getTareasPorTipo: (tipo) => todasLasTareas.filter(t => t.tipo === tipo),
    getTareasPendientes: () => todasLasTareas.filter(t => !t.completada),
    getTareasCompletadas: () => todasLasTareas.filter(t => t.completada),
    
    // Estadísticas
    totalTareas: todasLasTareas.length,
    tareasPendientes: todasLasTareas.filter(t => !t.completada).length,
    tareasCompletadas: todasLasTareas.filter(t => t.completada).length
  };
};
