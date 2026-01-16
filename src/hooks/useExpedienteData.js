// useExpedienteData.js - Hook especializado para datos de expedientes
// Reduce complejidad separando lógica de datos de expedientes

import { useState, useEffect, useCallback } from 'react';
import { useCasosService } from './useFirebaseService';
import errorService from '../services/ErrorService';

export const useExpedienteData = (filtroActivo = 'Todos') => {
  const [expedientes, setExpedientes] = useState([]);
  const [expedientesOrdenados, setExpedientesOrdenados] = useState([]);
  const [todosLosExpedientes, setTodosLosExpedientes] = useState([]);
  const [loading, setLoading] = useState(true);

  const { getCasos, updateCaso } = useCasosService();

  // Cargar datos de expedientes
  const cargarExpedientes = useCallback(async () => {
    try {
      setLoading(true);
      const casosData = await getCasos();
      
      // Convertir casos a formato de expedientes
      const expedientesData = casosData.map(caso => convertirCasoAExpediente(caso));
      
      // Guardar todos los expedientes
      setTodosLosExpedientes(expedientesData);
      
      // Aplicar filtros
      const expedientesFiltrados = aplicarFiltros(expedientesData, filtroActivo);
      
      // Ordenar expedientes
      const expedientesOrdenados = ordenarExpedientes(expedientesFiltrados);
      
      setExpedientes(expedientesFiltrados);
      setExpedientesOrdenados(expedientesOrdenados);
      
    } catch (error) {
      console.error('Error cargando expedientes:', error);
      errorService.handleGenericError(error, 'Cargar Expedientes');
      setExpedientes([]);
      setExpedientesOrdenados([]);
    } finally {
      setLoading(false);
    }
  }, [getCasos, filtroActivo]);

  // Cargar datos al montar y cuando cambie el filtro
  useEffect(() => {
    cargarExpedientes();
  }, [cargarExpedientes]);

  // Convertir caso de Firebase a formato de expediente
  const convertirCasoAExpediente = useCallback((caso) => {
    return {
      id: caso.id,
      numero: caso.numero || 'Sin número',
      cliente: caso.cliente || 'Cliente no especificado',
      tipo: caso.tipo || 'civil',
      prioridad: caso.prioridad || 'media',
      estado: caso.estado || 'Activo',
      progreso: calcularProgreso(caso),
      descripcion: caso.descripcion || 'Sin descripción',
      ultimaActualizacion: formatearUltimaActualizacion(caso),
      demandante: caso.demandante || caso.cliente,
      demandado: caso.demandado || 'No especificado',
      abogado: caso.abogado || 'No asignado',
      fechaAudiencia: caso.fechaAudiencia,
      observaciones: caso.observaciones
    };
  }, []);

  // Aplicar filtros a los expedientes
  const aplicarFiltros = useCallback((expedientes, filtro) => {
    switch (filtro) {
      case 'Urgentes':
        return expedientes.filter(exp => exp.prioridad === 'alta');
      
      case 'Activos':
        return expedientes.filter(exp => 
          ['Activo', 'postulatoria', 'probatoria', 'contestacion', 'traslado'].includes(exp.estado)
        );
      
      case 'En Espera':
        return expedientes.filter(exp => 
          exp.estado?.toLowerCase().includes('espera') || 
          exp.estado?.toLowerCase().includes('pendiente') ||
          exp.estado?.toLowerCase().includes('suspendido')
        );
      
      case 'Archivados':
        return expedientes.filter(exp => 
          exp.estado?.toLowerCase().includes('archivado') || 
          exp.estado?.toLowerCase().includes('concluido') ||
          exp.estado?.toLowerCase().includes('terminado')
        );
      
      default: // 'Todos'
        return expedientes;
    }
  }, []);

  // Ordenar expedientes por fecha de actualización
  const ordenarExpedientes = useCallback((expedientes) => {
    return [...expedientes].sort((a, b) => {
      const fechaA = new Date(a.ultimaActualizacion || 0);
      const fechaB = new Date(b.ultimaActualizacion || 0);
      return fechaB - fechaA; // Más recientes primero
    });
  }, []);

  // Calcular progreso del expediente
  const calcularProgreso = useCallback((caso) => {
    // Lógica simplificada para calcular progreso
    if (caso.estado?.toLowerCase().includes('archivado')) return 100;
    if (caso.estado?.toLowerCase().includes('probatoria')) return 75;
    if (caso.estado?.toLowerCase().includes('contestacion')) return 50;
    if (caso.estado?.toLowerCase().includes('postulatoria')) return 25;
    return 10; // Estado inicial
  }, []);

  // Formatear última actualización
  const formatearUltimaActualizacion = useCallback((caso) => {
    try {
      if (caso.updatedAt) {
        // Si es un timestamp de Firebase
        if (caso.updatedAt.toDate && typeof caso.updatedAt.toDate === 'function') {
          return caso.updatedAt.toDate().toISOString();
        }
        // Si tiene la propiedad seconds (timestamp de Firebase serializado)
        if (caso.updatedAt.seconds) {
          return new Date(caso.updatedAt.seconds * 1000).toISOString();
        }
        // Si es una fecha normal
        return new Date(caso.updatedAt).toISOString();
      }
      if (caso.createdAt) {
        // Si es un timestamp de Firebase
        if (caso.createdAt.toDate && typeof caso.createdAt.toDate === 'function') {
          return caso.createdAt.toDate().toISOString();
        }
        // Si tiene la propiedad seconds (timestamp de Firebase serializado)
        if (caso.createdAt.seconds) {
          return new Date(caso.createdAt.seconds * 1000).toISOString();
        }
        // Si es una fecha normal
        return new Date(caso.createdAt).toISOString();
      }
      return new Date().toISOString();
    } catch (error) {
      console.warn('Error formateando fecha de actualización:', error);
      return new Date().toISOString();
    }
  }, []);

  // Actualizar expediente
  const actualizarExpediente = useCallback(async (expedienteId, datos) => {
    try {
      await updateCaso(expedienteId, datos);
      
      // Actualizar estado local
      setExpedientes(prev => prev.map(exp => 
        exp.id === expedienteId ? { ...exp, ...datos } : exp
      ));
      
      setExpedientesOrdenados(prev => prev.map(exp => 
        exp.id === expedienteId ? { ...exp, ...datos } : exp
      ));
      
      return { success: true };
    } catch (error) {
      console.error('Error actualizando expediente:', error);
      throw error;
    }
  }, [updateCaso]);

  // Completar expediente
  const completarExpediente = useCallback(async (expedienteId) => {
    try {
      const datosCompletado = {
        estado: 'Completado',
        fechaCompletado: new Date().toISOString(),
        progreso: 100
      };
      
      await actualizarExpediente(expedienteId, datosCompletado);
      
      // Remover de la lista de expedientes activos
      setExpedientes(prev => prev.filter(exp => exp.id !== expedienteId));
      setExpedientesOrdenados(prev => prev.filter(exp => exp.id !== expedienteId));
      
      return { success: true };
    } catch (error) {
      console.error('Error completando expediente:', error);
      throw error;
    }
  }, [actualizarExpediente]);

  // Agrupar expedientes por prioridad
  const agruparPorPrioridad = useCallback((expedientes) => {
    const grupos = {
      'Prioritarios': [],
      'En Espera': [],
      'Observados': [],
      'En Proceso': [],
      'Archivados': []
    };
    
    expedientes.forEach(exp => {
      if (exp.prioridad === 'alta' || exp.estado?.toLowerCase().includes('urgente')) {
        grupos['Prioritarios'].push(exp);
      } else if (exp.estado?.toLowerCase().includes('espera') || 
                 exp.estado?.toLowerCase().includes('pendiente') ||
                 exp.estado?.toLowerCase().includes('suspendido')) {
        grupos['En Espera'].push(exp);
      } else if (exp.observaciones && 
                 exp.observaciones.trim() !== '' && 
                 exp.observaciones !== 'REVISADO' && 
                 exp.observaciones !== 'NO REVISADO' &&
                 !exp.observaciones.includes('Audiencia')) {
        grupos['Observados'].push(exp);
      } else if (exp.estado?.toLowerCase().includes('archivado') || 
                 exp.estado?.toLowerCase().includes('concluido') ||
                 exp.estado?.toLowerCase().includes('terminado')) {
        grupos['Archivados'].push(exp);
      } else {
        grupos['En Proceso'].push(exp);
      }
    });
    
    // Filtrar grupos vacíos
    return Object.fromEntries(
      Object.entries(grupos).filter(([_, expedientes]) => expedientes.length > 0)
    );
  }, []);

  // Buscar expedientes
  const buscarExpedientes = useCallback((termino) => {
    if (!termino) return expedientesOrdenados;
    
    const terminoLower = termino.toLowerCase();
    return expedientesOrdenados.filter(exp => 
      exp.numero?.toLowerCase().includes(terminoLower) ||
      exp.cliente?.toLowerCase().includes(terminoLower) ||
      exp.descripcion?.toLowerCase().includes(terminoLower) ||
      exp.demandante?.toLowerCase().includes(terminoLower) ||
      exp.demandado?.toLowerCase().includes(terminoLower)
    );
  }, [expedientesOrdenados]);

  return {
    expedientes,
    expedientesOrdenados,
    todosLosExpedientes,
    loading,
    actualizarExpediente,
    completarExpediente,
    agruparPorPrioridad,
    buscarExpedientes,
    recargar: cargarExpedientes
  };
};