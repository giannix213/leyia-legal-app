import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { useLocalDataManager } from './useLocalDataManager';
import casosService from '../services/CasosService';

export function useEstudioDatos(organizacionId) {
  const [data, setData] = useState({
    expedientes: [],
    tareas: [],
    audienciasSemana: [],
    tramitesPendientes: [],
    diasSemanaActual: [],
    loading: true,
    error: null
  });

  const [useRealtime, setUseRealtime] = useState(true);

  // Hook para manejo de datos locales
  const {
    localData,
    lastSync,
    saveToLocal,
    loadFromLocal,
    hasLocalData,
    isLocalDataFresh,
    autoDownload,
    forceDownload,
    clearLocalData,
    getStorageStats,
    isDownloading,
    downloadProgress
  } = useLocalDataManager(organizacionId);

  // Función para obtener los días de la semana actual
  const obtenerDiasSemanaActual = useCallback(() => {
    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    
    const diaActual = hoy.getDay();
    const diasHastaLunes = diaActual === 0 ? -6 : 1 - diaActual;
    inicioSemana.setDate(hoy.getDate() + diasHastaLunes);
    
    const diasSemana = [];
    for (let i = 0; i < 7; i++) {
      const dia = new Date(inicioSemana);
      dia.setDate(inicioSemana.getDate() + i);
      diasSemana.push({
        numero: dia.getDate(),
        fecha: dia,
        esHoy: dia.toDateString() === hoy.toDateString(),
        nombreDia: new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(dia).toUpperCase(),
        mes: new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(dia).toUpperCase()
      });
    }
    
    return diasSemana;
  }, []);

  // Funciones para generar tareas específicas
  const generarTareasAudiencias = useCallback((expedientes, audienciasSemana) => {
    const hoy = new Date();
    const audienciasHoy = audienciasSemana.filter(aud => aud.dia === hoy.getDate());
    
    return audienciasHoy.map(audiencia => ({
      id: `audiencia-hoy-${audiencia.caso}`,
      titulo: `Audiencia del caso ${audiencia.caso}`,
      tiempo: audiencia.hora,
      tipo: 'urgente',
      categoria: 'Audiencia',
      tipoCaso: 'civil'
    }));
  }, []);

  const generarTareasTramites = useCallback((tramitesPendientes) => {
    return tramitesPendientes.map(tramite => {
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
      
      return {
        id: tramite.id,
        titulo: tramite.titulo,
        descripcion: tramite.descripcion,
        tiempo: tiempo,
        tipo: tramite.prioridad === 'alta' ? 'urgente' : 'normal',
        categoria: categoria,
        tipoCaso: tramite.tipoCaso || 'civil',
        icono: icono,
        esTramite: true,
        tramiteData: tramite
      };
    });
  }, []);

  const generarTareasGenerales = useCallback((cantidad) => {
    const tareasGenerales = [
      { id: crypto.randomUUID(), titulo: 'Revisar casilla electrónica', tiempo: '15min', tipo: 'normal', categoria: 'Comunicación', tipoCaso: 'general' },
      { id: crypto.randomUUID(), titulo: 'Revisar notificaciones judiciales', tiempo: '30min', tipo: 'normal', categoria: 'Comunicación', tipoCaso: 'general' },
      { id: crypto.randomUUID(), titulo: 'Planificar agenda de la semana', tiempo: '20min', tipo: 'normal', categoria: 'Actualización', tipoCaso: 'general' },
      { id: crypto.randomUUID(), titulo: 'Actualizar estado de expedientes', tiempo: '45min', tipo: 'normal', categoria: 'Actualización', tipoCaso: 'general' }
    ];

    return tareasGenerales.slice(0, cantidad);
  }, []);

  // Función principal para generar tareas
  const generarTareasDesdeExpedientes = useCallback((expedientes, audienciasSemana, tramitesPendientes) => {
    const tareasAudiencias = generarTareasAudiencias(expedientes, audienciasSemana);
    const tareasTramites = generarTareasTramites(tramitesPendientes);
    
    // Agregar tareas de observaciones marcadas como tareas
    const tareasObservaciones = expedientes
      .filter(exp => exp.esTarea && exp.observaciones && exp.observaciones.trim() !== '')
      .map(expediente => {
        let tiempo = '30min';
        let categoria = 'Tarea';
        let icono = '📝';
        let tipo = 'normal';
        
        if (expediente.tipoTarea === 'coordinacion') {
          tiempo = '15min';
          categoria = 'Coordinación';
          icono = '📞';
        } else if (expediente.tipoTarea === 'diligencia') {
          tiempo = '1h';
          categoria = 'Diligencia';
          icono = '🏃‍♂️';
        }
        
        if (expediente.prioridad === 'alta') {
          tipo = 'urgente';
        }
        
        return {
          id: `observacion-tarea-${expediente.id}`,
          titulo: `${categoria}: ${expediente.numero}`,
          descripcion: expediente.observaciones,
          tiempo: tiempo,
          tipo: tipo,
          categoria: categoria,
          tipoCaso: expediente.tipo || 'civil',
          icono: icono,
          esObservacionTarea: true,
          expedienteId: expediente.id,
          cliente: expediente.cliente,
          tipoTarea: expediente.tipoTarea
        };
      });

    // Combinar todas las tareas
    const todasLasTareas = [
      ...tareasAudiencias,
      ...tareasTramites,
      ...tareasObservaciones
    ];

    // Agregar tareas generales si hay pocas tareas reales
    if (todasLasTareas.length < 5) {
      const tareasGenerales = generarTareasGenerales(Math.max(0, 5 - todasLasTareas.length));
      todasLasTareas.push(...tareasGenerales);
    }

    // Criterio de ordenamiento tipo Netflix (urgentes primero, luego trámites)
    const criterioNetflix = (a, b) => {
      if (a.tipo === 'urgente' && b.tipo !== 'urgente') return -1;
      if (a.tipo !== 'urgente' && b.tipo === 'urgente') return 1;
      if (a.esTramite && !b.esTramite) return -1;
      if (!a.esTramite && b.esTramite) return 1;
      return a.categoria.localeCompare(b.categoria);
    };

    return todasLasTareas.sort(criterioNetflix);
  }, [generarTareasAudiencias, generarTareasTramites, generarTareasGenerales]);

  // Función principal para cargar todos los datos
  const cargarDatos = useCallback(async (forceRemote = false) => {
    if (!organizacionId) {
      console.warn('No hay organización activa para cargar datos');
      setData(prev => ({
        ...prev,
        expedientes: [],
        tareas: [],
        audienciasSemana: [],
        tramitesPendientes: [],
        loading: false
      }));
      return;
    }

    try {
      setData(prev => ({ ...prev, loading: true, error: null }));
      
      // Intentar cargar desde caché local primero (si no se fuerza carga remota)
      if (!forceRemote && hasLocalData() && isLocalDataFresh()) {
        console.log('📂 Cargando desde caché local (datos frescos)');
        const cachedData = loadFromLocal();
        
        if (cachedData && cachedData.expedientes) {
          const diasSemanaActual = obtenerDiasSemanaActual();
          
          setData({
            expedientes: cachedData.expedientes,
            tareas: cachedData.tareas || [],
            audienciasSemana: cachedData.audienciasSemana || [],
            tramitesPendientes: cachedData.tramitesPendientes || [],
            diasSemanaActual,
            loading: false,
            error: null
          });
          
          console.log('✅ Datos cargados desde caché local');
          return;
        }
      }

      // Cargar desde Firebase usando servicio centralizado
      console.log('🔍 Cargando datos desde Firebase para organización:', organizacionId);
      
      const casosData = await casosService.cargarCasosPorOrganizacion(organizacionId);
      console.log('✅ Casos finales para procesar:', casosData.length);
      
      // Si aún no hay casos, crear datos de ejemplo para testing
      if (casosData.length === 0) {
        console.log('📝 Creando datos de ejemplo para testing...');
        casosData = [
          {
            id: 'demo-caso-1',
            numero: 'DEMO-001-2025',
            cliente: 'Juan Pérez García',
            tipo: 'civil',
            prioridad: 'alta',
            estado: 'Activo',
            descripcion: 'Demanda por incumplimiento de contrato de compraventa',
            organizacionId: organizacionId,
            createdAt: new Date(),
            observaciones: 'Revisar documentos de la compraventa',
            demandante: 'Juan Pérez García',
            demandado: 'Constructora ABC S.A.',
            abogado: 'Dr. María López'
          },
          {
            id: 'demo-caso-2',
            numero: 'DEMO-002-2025',
            cliente: 'Ana Martínez Ruiz',
            tipo: 'penal',
            prioridad: 'media',
            estado: 'probatoria',
            descripcion: 'Proceso por lesiones culposas en accidente de tránsito',
            organizacionId: organizacionId,
            createdAt: new Date(),
            observaciones: 'Solicitar peritaje médico',
            demandante: 'Ana Martínez Ruiz',
            demandado: 'Carlos Rodríguez Silva',
            abogado: 'Dr. Roberto Sánchez'
          },
          {
            id: 'demo-caso-3',
            numero: 'DEMO-003-2025',
            cliente: 'Empresa XYZ Ltda.',
            tipo: 'comercial',
            prioridad: 'baja',
            estado: 'postulatoria',
            descripcion: 'Cobro de facturas impagas por servicios prestados',
            organizacionId: organizacionId,
            createdAt: new Date(),
            observaciones: 'Revisar contratos de servicios',
            demandante: 'Empresa XYZ Ltda.',
            demandado: 'Distribuidora DEF S.A.',
            abogado: 'Dra. Carmen Vega'
          },
          {
            id: 'demo-caso-4',
            numero: 'DEMO-004-2025',
            cliente: 'María González López',
            tipo: 'familia',
            prioridad: 'alta',
            estado: 'Activo',
            descripcion: 'Proceso de divorcio con custodia de menores',
            organizacionId: organizacionId,
            createdAt: new Date(),
            observaciones: 'Preparar documentación de bienes',
            demandante: 'María González López',
            demandado: 'Pedro Ramírez Castro',
            abogado: 'Dra. Isabel Moreno'
          },
          {
            id: 'demo-caso-5',
            numero: 'DEMO-005-2025',
            cliente: 'Constructora DEF S.A.',
            tipo: 'laboral',
            prioridad: 'media',
            estado: 'contestacion',
            descripcion: 'Demanda laboral por despido injustificado',
            organizacionId: organizacionId,
            createdAt: new Date(),
            observaciones: 'Revisar contratos laborales',
            demandante: 'Luis Herrera Díaz',
            demandado: 'Constructora DEF S.A.',
            abogado: 'Dr. Fernando Castro'
          },
          {
            id: 'demo-caso-6',
            numero: 'DEMO-006-2025',
            cliente: 'Banco Nacional',
            tipo: 'comercial',
            prioridad: 'alta',
            estado: 'ejecucion',
            descripcion: 'Cobro ejecutivo de pagaré vencido',
            organizacionId: organizacionId,
            createdAt: new Date(),
            observaciones: 'Verificar garantías hipotecarias',
            demandante: 'Banco Nacional',
            demandado: 'Inversiones GHI Ltda.',
            abogado: 'Dr. Alejandro Ruiz'
          }
        ];
        console.log('📊 Datos de ejemplo creados:', casosData.length);
      }

      // Procesar expedientes usando servicio centralizado
      const expedientesData = casosData.map(caso => casosService.transformarAExpediente(caso));

      // Log para debugging de tareas
      const expedientesConTareas = expedientesData.filter(exp => exp.esTarea);
      if (expedientesConTareas.length > 0) {
        console.log('📋 Expedientes marcados como tareas:', expedientesConTareas.length);
        expedientesConTareas.forEach(exp => {
          console.log('  -', exp.numero, '| Tipo:', exp.tipoTarea, '| Obs:', exp.observaciones?.substring(0, 30));
        });
      } else {
        console.log('⚠️ No se encontraron expedientes marcados como tareas');
      }

      // Procesar audiencias de la semana
      const hoy = new Date();
      const inicioSemana = new Date(hoy);
      inicioSemana.setDate(hoy.getDate() - hoy.getDay() + 1);
      const finSemana = new Date(inicioSemana);
      finSemana.setDate(inicioSemana.getDate() + 6);

      const audienciasSemana = casosData
        .filter(caso => {
          if (!caso.fechaAudiencia) return false;
          const fechaAudiencia = new Date(caso.fechaAudiencia);
          return fechaAudiencia >= inicioSemana && fechaAudiencia <= finSemana;
        })
        .map(caso => ({
          fecha: new Date(caso.fechaAudiencia),
          dia: new Date(caso.fechaAudiencia).getDate(),
          caso: caso.numero,
          cliente: caso.cliente,
          hora: caso.horaAudiencia || '09:00'
        }));

      // Procesar trámites pendientes
      const tramitesPendientes = [];
      
      casosData.forEach(caso => {
        if (caso.requiereCoordinacion && !caso.coordinacionCompletada) {
          tramitesPendientes.push({
            id: crypto.randomUUID(),
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

        if (caso.requiereEscrito && !caso.escritoCompletado) {
          tramitesPendientes.push({
            id: crypto.randomUUID(),
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

        if (caso.requiereDiligencia && !caso.diligenciaCompletada) {
          tramitesPendientes.push({
            id: crypto.randomUUID(),
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

      // Ordenar trámites por prioridad
      const prioridadOrden = { alta: 3, media: 2, baja: 1 };
      tramitesPendientes.sort((a, b) => {
        return (prioridadOrden[b.prioridad] || 2) - (prioridadOrden[a.prioridad] || 2);
      });

      // Generar tareas
      const tareasGeneradas = generarTareasDesdeExpedientes(expedientesData, audienciasSemana, tramitesPendientes);

      // Obtener días de la semana
      const diasSemanaActual = obtenerDiasSemanaActual();

      // Preparar datos finales
      const finalData = {
        expedientes: expedientesData,
        tareas: tareasGeneradas,
        audienciasSemana,
        tramitesPendientes,
        diasSemanaActual,
        loading: false,
        error: null
      };

      // Guardar en caché local
      await saveToLocal(finalData);

      // Descarga automática de los datos (JSON y CSV) - solo si hay datos nuevos o es la primera carga
      const shouldDownload = !hasLocalData() || !isLocalDataFresh() || forceRemote;
      
      if (shouldDownload && finalData.expedientes.length > 0) {
        console.log('📥 Iniciando descarga automática de datos...');
        
        try {
          // Descargar en paralelo para mejor rendimiento
          const [jsonResult, csvResult] = await Promise.all([
            autoDownload(finalData, 'json'),
            autoDownload(finalData, 'csv')
          ]);
          
          if (jsonResult && csvResult) {
            console.log('✅ Descarga automática completada exitosamente');
          } else {
            console.warn('⚠️ Algunas descargas automáticas fallaron');
          }
        } catch (downloadError) {
          console.error('❌ Error en descarga automática:', downloadError);
        }
      } else {
        console.log('📂 Descarga automática omitida (datos ya descargados hoy)');
      }

      // Actualizar estado
      setData(finalData);

      console.log('✅ Datos cargados, guardados en caché y descargados automáticamente');

    } catch (error) {
      console.error('Error al cargar datos:', error);
      
      // Intentar cargar desde caché local como fallback
      if (hasLocalData()) {
        console.log('🔄 Error en Firebase, intentando cargar desde caché local...');
        const cachedData = loadFromLocal();
        
        if (cachedData && cachedData.expedientes) {
          const diasSemanaActual = obtenerDiasSemanaActual();
          
          setData({
            expedientes: cachedData.expedientes,
            tareas: cachedData.tareas || [],
            audienciasSemana: cachedData.audienciasSemana || [],
            tramitesPendientes: cachedData.tramitesPendientes || [],
            diasSemanaActual,
            loading: false,
            error: 'Datos cargados desde caché local (sin conexión)'
          });
          
          console.log('📂 Datos cargados desde caché como fallback');
          return;
        }
      }
      
      // Si todo falla, establecer estado de error
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Error al cargar datos'
      }));
    }
  }, [organizacionId, generarTareasDesdeExpedientes, obtenerDiasSemanaActual, hasLocalData, isLocalDataFresh, loadFromLocal, saveToLocal]);

  // Efecto para cargar datos cuando cambie la organización
  useEffect(() => {
    if (!useRealtime) {
      // Modo manual: usar la función cargarDatos existente
      cargarDatos();
      return;
    }

    // Modo real-time: listener de Firebase
    if (!organizacionId) {
      console.warn('No hay organización activa para listener en tiempo real');
      setData(prev => ({
        ...prev,
        expedientes: [],
        tareas: [],
        loading: false
      }));
      return;
    }

    console.log('🔴 Iniciando listener en tiempo real para expedientes, organización:', organizacionId);
    setData(prev => ({ ...prev, loading: true }));

    // Configurar listener
    const q = query(
      collection(db, 'casos'),
      where('organizacionId', '==', organizacionId)
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        console.log('🔄 Actualización en tiempo real recibida:', snapshot.docs.length, 'expedientes');
        
        const casosData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Ordenar por fecha
        casosData.sort((a, b) => {
          const fechaA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt || 0);
          const fechaB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt || 0);
          return fechaB - fechaA;
        });

        // Procesar expedientes (usar la misma lógica que cargarDatos)
        const expedientesData = casosData.map(caso => ({
          id: caso.id,
          numero: caso.numero || 'Sin número',
          cliente: caso.cliente || 'Cliente no especificado',
          tipo: caso.tipo || 'civil',
          prioridad: caso.prioridad || 'media',
          estado: caso.estado || 'Activo',
          progreso: casosService.calcularProgreso(caso),
          descripcion: caso.descripcion || 'Sin descripción',
          ultimaActualizacion: casosService.formatearUltimaActualizacion(caso),
          demandante: caso.demandante || caso.cliente,
          demandado: caso.demandado || 'No especificado',
          abogado: caso.abogado || 'No asignado',
          fechaAudiencia: caso.fechaAudiencia,
          observaciones: caso.observaciones,
          completado: caso.completado || false,
          organizacionId: caso.organizacionId,
          esTarea: caso.esTarea,
          tipoTarea: caso.tipoTarea
        }));

        // Log para debugging de tareas
        const expedientesConTareas = expedientesData.filter(exp => exp.esTarea);
        if (expedientesConTareas.length > 0) {
          console.log('📋 Expedientes marcados como tareas (real-time):', expedientesConTareas.length);
        }

        // Procesar audiencias, trámites y tareas
        const hoy = new Date();
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(hoy.getDate() - hoy.getDay() + 1);
        const finSemana = new Date(inicioSemana);
        finSemana.setDate(inicioSemana.getDate() + 6);

        const audienciasSemana = casosData
          .filter(caso => {
            if (!caso.fechaAudiencia) return false;
            const fechaAudiencia = new Date(caso.fechaAudiencia);
            return fechaAudiencia >= inicioSemana && fechaAudiencia <= finSemana;
          })
          .map(caso => ({
            fecha: new Date(caso.fechaAudiencia),
            dia: new Date(caso.fechaAudiencia).getDate(),
            caso: caso.numero,
            cliente: caso.cliente,
            hora: caso.horaAudiencia || '09:00'
          }));

        const tramitesPendientes = [];
        const tareasGeneradas = generarTareasDesdeExpedientes(expedientesData, audienciasSemana, tramitesPendientes);
        const diasSemanaActual = obtenerDiasSemanaActual();

        const finalData = {
          expedientes: expedientesData,
          tareas: tareasGeneradas,
          audienciasSemana,
          tramitesPendientes,
          diasSemanaActual,
          loading: false,
          error: null
        };

        // Guardar en caché local
        await saveToLocal(finalData);

        setData(finalData);
      },
      (error) => {
        console.error('❌ Error en listener en tiempo real:', error);
        setData(prev => ({
          ...prev,
          loading: false,
          error: 'Error en sincronización en tiempo real'
        }));
        // Fallback a carga manual
        cargarDatos();
      }
    );

    // Cleanup
    return () => {
      console.log('🔴 Desconectando listener en tiempo real de expedientes');
      unsubscribe();
    };
  }, [cargarDatos, organizacionId, useRealtime, generarTareasDesdeExpedientes, obtenerDiasSemanaActual, saveToLocal]);

  return {
    ...data,
    
    // Funciones principales
    recargar: cargarDatos,
    recargarDesdeRemoto: () => cargarDatos(true),
    forceDownload: () => forceDownload(data),
    
    // Funciones de almacenamiento local
    clearLocalData,
    getStorageStats,
    
    // Estados de descarga
    isDownloading,
    downloadProgress,
    
    // Información de caché
    lastSync,
    hasLocalData: hasLocalData(),
    isLocalDataFresh: isLocalDataFresh(),
    
    // Control de real-time
    useRealtime,
    setUseRealtime
  };
}