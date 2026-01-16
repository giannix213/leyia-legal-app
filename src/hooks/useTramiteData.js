// useTramiteData.js - Hook especializado para datos de trámites
// Reduce complejidad separando lógica de trámites pendientes

import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import errorService from '../services/ErrorService';

export const useTramiteData = () => {
  const [tramitesPendientes, setTramitesPendientes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Obtener trámites pendientes
  const obtenerTramitesPendientes = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'casos'));
      const casosData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const tramitesPendientes = [];
      
      casosData.forEach(caso => {
        // Coordinación Directa pendiente
        if (caso.requiereCoordinacion && !caso.coordinacionCompletada) {
          tramitesPendientes.push({
            id: `${caso.id}-coordinacion`,
            casoId: caso.id,
            tipo: 'coordinacion',
            titulo: `Coordinación - ${caso.numero}`,
            descripcion: `Llamar al especialista del caso ${caso.cliente}`,
            prioridad: caso.prioridad || 'media',
            telefono: caso.telefonoEspecialista,
            caso: caso.numero,
            cliente: caso.cliente,
            abogado: caso.abogado,
            tipoCaso: caso.tipo || 'civil',
            expediente: caso.numero
          });
        }

        // Escrito pendiente
        if (caso.requiereEscrito && !caso.escritoCompletado) {
          tramitesPendientes.push({
            id: `${caso.id}-escrito`,
            casoId: caso.id,
            tipo: 'escrito',
            titulo: `Elaborar Escrito - ${caso.numero}`,
            descripcion: `Redactar escrito para el caso ${caso.cliente}`,
            prioridad: caso.prioridad || 'media',
            archivoWord: caso.archivoWord,
            caso: caso.numero,
            cliente: caso.cliente,
            abogado: caso.abogado,
            tipoCaso: caso.tipo || 'civil',
            expediente: caso.numero
          });
        }

        // Diligencia pendiente
        if (caso.requiereDiligencia && !caso.diligenciaCompletada) {
          tramitesPendientes.push({
            id: `${caso.id}-diligencia`,
            casoId: caso.id,
            tipo: 'diligencia',
            titulo: `${caso.descripcionDiligencia || 'Diligencia'} - ${caso.numero}`,
            descripcion: caso.descripcionDiligencia || `Realizar diligencia para el caso ${caso.cliente}`,
            prioridad: caso.prioridad || 'media',
            caso: caso.numero,
            cliente: caso.cliente,
            abogado: caso.abogado,
            tipoCaso: caso.tipo || 'civil',
            expediente: caso.numero,
            descripcionDiligencia: caso.descripcionDiligencia,
            fechaLimiteDiligencia: caso.fechaLimiteDiligencia
          });
        }
      });

      // Ordenar por prioridad
      const prioridadOrden = { alta: 3, media: 2, baja: 1 };
      tramitesPendientes.sort((a, b) => {
        return (prioridadOrden[b.prioridad] || 2) - (prioridadOrden[a.prioridad] || 2);
      });

      return tramitesPendientes;
    } catch (error) {
      console.error('Error al obtener trámites:', error);
      errorService.handleGenericError(error, 'Cargar Trámites');
      return [];
    }
  }, []);

  // Generar tareas basadas en expedientes y trámites
  const generarTareasDesdeExpedientes = useCallback((expedientes, tramitesPendientes, audienciasSemana) => {
    const tareas = [];
    const hoy = new Date();
    
    // 1. Agregar tareas de audiencias de hoy si las hay
    const audienciasHoy = audienciasSemana.filter(aud => aud.dia === hoy.getDate());
    audienciasHoy.forEach(audiencia => {
      tareas.push({
        id: `audiencia-hoy-${audiencia.caso}`,
        titulo: `Audiencia del caso ${audiencia.caso}`,
        tiempo: audiencia.hora,
        tipo: 'urgente',
        categoria: 'Audiencia',
        tipoCaso: 'civil'
      });
    });

    // 2. PRIORIZAR TRÁMITES PENDIENTES - Mostrar todos los trámites reales
    tramitesPendientes.forEach(tramite => {
      let tiempo = '30min';
      let categoria = 'Trámite';
      let icono = '📋';
      
      if (tramite.tipo === 'coordinacion') {
        tiempo = '15min';
        categoria = 'Comunicación';
        icono = '📞';
      } else if (tramite.tipo === 'escrito') {
        tiempo = '2h';
        categoria = 'Preparación';
        icono = '📄';
      } else if (tramite.tipo === 'diligencia') {
        tiempo = '1h';
        categoria = 'Diligencia';
        icono = '🏛️';
      }
      
      const tareaGenerada = {
        id: tramite.id,
        titulo: tramite.titulo,
        descripcion: tramite.descripcion,
        tiempo: tiempo,
        tipo: tramite.prioridad === 'alta' ? 'urgente' : 'normal',
        categoria: categoria,
        tipoCaso: tramite.tipoCaso || 'civil',
        icono: icono,
        esTramite: true, // Marcar como trámite real
        tramiteData: tramite // Incluir datos completos del trámite
      };
      
      tareas.push(tareaGenerada);
    });
    
    // 3. Solo agregar tareas adicionales si hay pocos trámites reales
    if (tramitesPendientes.length < 3) {
      
      // Generar tareas específicas para cada expediente
      expedientes.forEach((exp, index) => {
        // Tareas de audiencias próximas
        if (exp.fechaAudiencia) {
          const fechaAudiencia = new Date(exp.fechaAudiencia);
          const diasHastaAudiencia = Math.ceil((fechaAudiencia - hoy) / (1000 * 60 * 60 * 24));
          
          if (diasHastaAudiencia <= 7 && diasHastaAudiencia > 0) {
            tareas.push({
              id: `audiencia-prep-${exp.id}`,
              titulo: `Preparar audiencia - ${exp.numero}`,
              tiempo: '2h',
              tipo: 'urgente',
              categoria: 'Audiencia',
              tipoCaso: exp.tipo || 'civil'
            });
          }
        }

        // Tareas de alertas vencidas
        if (exp.alerta) {
          const fechaInicio = new Date(exp.alerta.fechaInicio);
          const fechaLimite = new Date(fechaInicio);
          fechaLimite.setDate(fechaLimite.getDate() + parseInt(exp.alerta.diasPlazo));
          
          const diasRestantes = Math.ceil((fechaLimite - hoy) / (1000 * 60 * 60 * 24));
          
          if (diasRestantes <= 3) {
            tareas.push({
              id: `alerta-${exp.id}`,
              titulo: `${exp.alerta.descripcion} - ${exp.numero}`,
              tiempo: '45min',
              tipo: diasRestantes <= 0 ? 'urgente' : 'normal',
              categoria: 'Trámite',
              tipoCaso: exp.tipo || 'civil'
            });
          }
        }
      });
    }

    // 4. Tareas generales del despacho (solo si hay muy pocas tareas)
    if (tareas.length < 5) {
      const tareasGenerales = [
        { id: 'gen-casilla', titulo: 'Revisar casilla electrónica', tiempo: '15min', tipo: 'normal', categoria: 'Comunicación', tipoCaso: 'general' },
        { id: 'gen-notificaciones', titulo: 'Revisar notificaciones judiciales', tiempo: '30min', tipo: 'normal', categoria: 'Comunicación', tipoCaso: 'general' },
        { id: 'gen-agenda', titulo: 'Planificar agenda de la semana', tiempo: '20min', tipo: 'normal', categoria: 'Actualización', tipoCaso: 'general' },
        { id: 'gen-expedientes', titulo: 'Actualizar estado de expedientes', tiempo: '45min', tipo: 'normal', categoria: 'Actualización', tipoCaso: 'general' }
      ];

      // Agregar algunas tareas generales
      const tareasAgregar = tareasGenerales.slice(0, Math.max(0, 5 - tareas.length));
      tareas.push(...tareasAgregar);
    }

    // Ordenar por prioridad (urgentes primero), luego trámites reales, luego por categoría
    const tareasOrdenadas = tareas.sort((a, b) => {
      // Primero urgentes
      if (a.tipo === 'urgente' && b.tipo !== 'urgente') return -1;
      if (a.tipo !== 'urgente' && b.tipo === 'urgente') return 1;
      
      // Luego trámites reales
      if (a.esTramite && !b.esTramite) return -1;
      if (!a.esTramite && b.esTramite) return 1;
      
      // Finalmente por categoría
      return a.categoria.localeCompare(b.categoria);
    });

    return tareasOrdenadas;
  }, []);

  // Cargar trámites
  const cargarTramites = useCallback(async () => {
    try {
      setLoading(true);
      const tramites = await obtenerTramitesPendientes();
      setTramitesPendientes(tramites);
    } catch (error) {
      console.error('Error cargando trámites:', error);
      errorService.handleGenericError(error, 'Cargar Trámites');
    } finally {
      setLoading(false);
    }
  }, [obtenerTramitesPendientes]);

  // Cargar datos al montar
  useEffect(() => {
    cargarTramites();
  }, [cargarTramites]);

  return {
    tramitesPendientes,
    loading,
    generarTareasDesdeExpedientes,
    recargar: cargarTramites
  };
};