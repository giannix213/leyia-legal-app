// useEstadisticas.js - Hook especializado para estadísticas y resúmenes
// Conectado directamente con datos reales de expedientes

import { useState, useEffect, useCallback } from 'react';
import errorService from '../services/ErrorService';

export const useEstadisticas = () => {
  const [resumenHoy, setResumenHoy] = useState({ prioridad: 0, esperan: 0, proceso: 0 });
  const [tareasCompletadas, setTareasCompletadas] = useState([]);
  const [estadisticasGenerales, setEstadisticasGenerales] = useState({
    totalExpedientes: 0,
    expedientesActivos: 0,
    expedientesArchivados: 0,
    porTipo: {},
    porEstado: {},
    porPrioridad: {}
  });
  const [loading, setLoading] = useState(true);

  // Calcular resumen basado en expedientes reales
  const calcularResumenDesdeExpedientes = useCallback((expedientes) => {
    try {
      let prioridad = 0;
      let esperan = 0;
      let proceso = 0;
      
      expedientes.forEach(expediente => {
        // Solo contar expedientes activos (no archivados)
        if (expediente.estado?.toLowerCase().includes('archivado') || 
            expediente.estado?.toLowerCase().includes('concluido') ||
            expediente.estado?.toLowerCase().includes('terminado')) {
          return; // Skip archivados
        }

        // Clasificar por prioridad
        if (expediente.prioridad === 'alta' || 
            expediente.estado?.toLowerCase().includes('urgente') ||
            expediente.estado?.toLowerCase().includes('crítico')) {
          prioridad++;
        }
        // Clasificar por estado de espera
        else if (expediente.estado?.toLowerCase().includes('espera') || 
                 expediente.estado?.toLowerCase().includes('pendiente') ||
                 expediente.estado?.toLowerCase().includes('suspendido') ||
                 expediente.estado?.toLowerCase().includes('traslado')) {
          esperan++;
        }
        // El resto están en proceso
        else {
          proceso++;
        }
      });

      return { prioridad, esperan, proceso };
    } catch (error) {
      console.error('Error al calcular resumen desde expedientes:', error);
      errorService.handleGenericError(error, 'Calcular Resumen Expedientes');
      return { prioridad: 0, esperan: 0, proceso: 0 };
    }
  }, []);

  // Calcular estadísticas generales de expedientes
  const calcularEstadisticasGenerales = useCallback((expedientes) => {
    try {
      const stats = {
        totalExpedientes: expedientes.length,
        expedientesActivos: 0,
        expedientesArchivados: 0,
        porTipo: {},
        porEstado: {},
        porPrioridad: {
          alta: 0,
          media: 0,
          baja: 0
        }
      };

      expedientes.forEach(expediente => {
        // Contar por estado general
        if (expediente.estado?.toLowerCase().includes('archivado') || 
            expediente.estado?.toLowerCase().includes('concluido') ||
            expediente.estado?.toLowerCase().includes('terminado')) {
          stats.expedientesArchivados++;
        } else {
          stats.expedientesActivos++;
        }

        // Contar por tipo
        const tipo = expediente.tipo || 'sin tipo';
        stats.porTipo[tipo] = (stats.porTipo[tipo] || 0) + 1;

        // Contar por estado específico
        const estado = expediente.estado || 'sin estado';
        stats.porEstado[estado] = (stats.porEstado[estado] || 0) + 1;

        // Contar por prioridad
        const prioridad = expediente.prioridad || 'media';
        if (stats.porPrioridad.hasOwnProperty(prioridad)) {
          stats.porPrioridad[prioridad]++;
        } else {
          stats.porPrioridad.media++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error calculando estadísticas generales:', error);
      errorService.handleGenericError(error, 'Calcular Estadísticas Generales');
      return {
        totalExpedientes: 0,
        expedientesActivos: 0,
        expedientesArchivados: 0,
        porTipo: {},
        porEstado: {},
        porPrioridad: { alta: 0, media: 0, baja: 0 }
      };
    }
  }, []);

  // Cargar tareas completadas desde localStorage
  const cargarTareasCompletadas = useCallback(() => {
    try {
      const tareasGuardadas = JSON.parse(localStorage.getItem('tareasCompletadas') || '[]');
      
      // Filtrar solo las tareas de hoy
      const hoy = new Date().toDateString();
      const tareasHoy = tareasGuardadas.filter(tarea => {
        const fechaTarea = new Date(tarea.fechaCompletada).toDateString();
        return fechaTarea === hoy;
      });
      
      return tareasHoy;
    } catch (error) {
      console.error('Error cargando tareas completadas:', error);
      errorService.handleGenericError(error, 'Cargar Tareas Completadas');
      return [];
    }
  }, []);

  // Agregar tarea completada
  const agregarTareaCompletada = useCallback((tarea) => {
    try {
      const tareaCompletada = {
        id: `completada-${Date.now()}`,
        numeroExpediente: tarea.numeroExpediente || tarea.numero,
        cliente: tarea.cliente,
        tipo: tarea.tipo,
        fechaCompletada: new Date().toISOString(),
        descripcion: tarea.descripcion || `Expediente ${tarea.numero} - ${tarea.cliente}`
      };

      // Guardar en localStorage para persistencia
      const tareasGuardadas = JSON.parse(localStorage.getItem('tareasCompletadas') || '[]');
      tareasGuardadas.push(tareaCompletada);
      localStorage.setItem('tareasCompletadas', JSON.stringify(tareasGuardadas));
      
      setTareasCompletadas(prev => [...prev, tareaCompletada]);
      
      return tareaCompletada;
    } catch (error) {
      console.error('Error agregando tarea completada:', error);
      errorService.handleGenericError(error, 'Agregar Tarea Completada');
      return null;
    }
  }, []);

  // Obtener estadísticas de productividad
  const obtenerEstadisticasProductividad = useCallback(() => {
    try {
      const hoy = new Date();
      const inicioSemana = new Date(hoy);
      inicioSemana.setDate(hoy.getDate() - hoy.getDay() + 1); // Lunes
      
      const tareasGuardadas = JSON.parse(localStorage.getItem('tareasCompletadas') || '[]');
      
      // Tareas completadas hoy
      const tareasHoy = tareasGuardadas.filter(tarea => {
        const fechaTarea = new Date(tarea.fechaCompletada);
        return fechaTarea.toDateString() === hoy.toDateString();
      });
      
      // Tareas completadas esta semana
      const tareasSemana = tareasGuardadas.filter(tarea => {
        const fechaTarea = new Date(tarea.fechaCompletada);
        return fechaTarea >= inicioSemana && fechaTarea <= hoy;
      });
      
      // Promedio diario de la semana
      const diasTranscurridos = Math.max(1, Math.ceil((hoy - inicioSemana) / (1000 * 60 * 60 * 24)));
      const promedioDiario = Math.round(tareasSemana.length / diasTranscurridos);
      
      return {
        tareasHoy: tareasHoy.length,
        tareasSemana: tareasSemana.length,
        promedioDiario,
        tendencia: tareasHoy.length >= promedioDiario ? 'positiva' : 'negativa'
      };
    } catch (error) {
      console.error('Error calculando estadísticas:', error);
      errorService.handleGenericError(error, 'Calcular Estadísticas');
      return {
        tareasHoy: 0,
        tareasSemana: 0,
        promedioDiario: 0,
        tendencia: 'neutral'
      };
    }
  }, []);

  // Actualizar todas las estadísticas basándose en expedientes reales
  const actualizarEstadisticasDesdeExpedientes = useCallback((expedientes) => {
    if (!expedientes || expedientes.length === 0) {
      setResumenHoy({ prioridad: 0, esperan: 0, proceso: 0 });
      setEstadisticasGenerales({
        totalExpedientes: 0,
        expedientesActivos: 0,
        expedientesArchivados: 0,
        porTipo: {},
        porEstado: {},
        porPrioridad: { alta: 0, media: 0, baja: 0 }
      });
      return;
    }

    try {
      // Calcular resumen para vista principal
      const resumen = calcularResumenDesdeExpedientes(expedientes);
      setResumenHoy(resumen);

      // Calcular estadísticas generales
      const statsGenerales = calcularEstadisticasGenerales(expedientes);
      setEstadisticasGenerales(statsGenerales);

      console.log('📊 Estadísticas actualizadas:', {
        resumen,
        statsGenerales,
        totalExpedientes: expedientes.length
      });

    } catch (error) {
      console.error('Error actualizando estadísticas:', error);
      errorService.handleGenericError(error, 'Actualizar Estadísticas');
    }
  }, [calcularResumenDesdeExpedientes, calcularEstadisticasGenerales]);

  // Obtener distribución por tipo con porcentajes
  const obtenerDistribucionPorTipo = useCallback(() => {
    const total = estadisticasGenerales.totalExpedientes;
    if (total === 0) return [];

    return Object.entries(estadisticasGenerales.porTipo).map(([tipo, cantidad]) => ({
      tipo,
      cantidad,
      porcentaje: Math.round((cantidad / total) * 100)
    })).sort((a, b) => b.cantidad - a.cantidad);
  }, [estadisticasGenerales]);

  // Obtener distribución por estado con porcentajes
  const obtenerDistribucionPorEstado = useCallback(() => {
    const total = estadisticasGenerales.totalExpedientes;
    if (total === 0) return [];

    return Object.entries(estadisticasGenerales.porEstado).map(([estado, cantidad]) => ({
      estado,
      cantidad,
      porcentaje: Math.round((cantidad / total) * 100)
    })).sort((a, b) => b.cantidad - a.cantidad);
  }, [estadisticasGenerales]);

  // Cargar datos iniciales
  useEffect(() => {
    try {
      setLoading(true);
      const tareas = cargarTareasCompletadas();
      setTareasCompletadas(tareas);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      errorService.handleGenericError(error, 'Cargar Estadísticas');
    } finally {
      setLoading(false);
    }
  }, [cargarTareasCompletadas]);

  return {
    // Estados principales
    resumenHoy,
    tareasCompletadas,
    estadisticasGenerales,
    loading,
    
    // Funciones de cálculo
    actualizarEstadisticasDesdeExpedientes,
    agregarTareaCompletada,
    obtenerEstadisticasProductividad,
    obtenerDistribucionPorTipo,
    obtenerDistribucionPorEstado,
    
    // Funciones de utilidad
    recargar: cargarTareasCompletadas,
    
    // Funciones legacy (mantener compatibilidad)
    calcularResumenHoy: calcularResumenDesdeExpedientes,
    actualizarResumen: actualizarEstadisticasDesdeExpedientes
  };
};