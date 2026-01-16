// CalendarioContainer.js - Container optimizado para lógica de negocio del calendario
// Integra tareas del equipo, optimización de UI y robustez del CRUD

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { useOrganizacionContext } from '../../contexts/OrganizacionContext';
import CalendarioView from '../views/CalendarioView';
import DayEventsModal from '../common/DayEventsModal';
import { useUIState } from '../../hooks/useUIState';
import useCalendarHelpers from '../../hooks/useCalendarHelpers';
import { useTareasOrganizacion } from '../../hooks/useTareas';
import CalendarService from '../../services/CalendarService';
import CalendarModalService from '../../services/CalendarModalService';
import ErrorService from '../../services/ErrorService';

const CalendarioContainer = () => {
  const { organizacionActual } = useOrganizacionContext();
  
  // ===== ESTADOS DE DATOS =====
  const [eventos, setEventos] = useState([]);
  
  // ===== INTEGRACIÓN CON TAREAS DEL EQUIPO =====
  const { 
    todasLasTareas, 
    cargando: cargandoTareas, 
    recargar: recargarTareas 
  } = useTareasOrganizacion(organizacionActual?.id, true);
  
  // ===== HOOKS ESPECIALIZADOS =====
  
  // ===== OPTIMIZACIÓN DE UI (MEMOIZATION) =====
  
  // Mapa de eventos para efecto de "brillo" - optimizado
  const mapaEventos = useMemo(() => {
    const mapa = {};
    
    // Procesar eventos de audiencias
    eventos.forEach(evento => {
      const fecha = evento.fecha; // formato YYYY-MM-DD
      mapa[fecha] = (mapa[fecha] || 0) + 1;
    });
    
    // Procesar tareas con fechas límite
    todasLasTareas.forEach(tarea => {
      if (tarea.fechaLimite) {
        const fecha = tarea.fechaLimite.split('T')[0]; // Normalizar formato
        mapa[fecha] = (mapa[fecha] || 0) + 1;
      }
    });
    
    return mapa;
  }, [eventos, todasLasTareas]);

  // Combinar eventos y tareas para vista unificada
  const eventosCombinados = useMemo(() => {
    // Convertir tareas con fechaLimite en eventos del calendario
    const tareasComoEventos = todasLasTareas
      .filter(tarea => tarea.fechaLimite && !tarea.completada)
      .map(tarea => ({
        id: `tarea-${tarea.id}`,
        tareaId: tarea.id,
        casoId: tarea.casoId,
        titulo: `Tarea: ${tarea.descripcion}`,
        tipo: 'tarea',
        fecha: tarea.fechaLimite.split('T')[0],
        hora: '09:00', // Hora por defecto para tareas
        caso: tarea.casoNumero || '',
        cliente: tarea.casoCliente || '',
        prioridad: tarea.prioridad || 'media',
        asignadoA: tarea.asignadoA || '',
        notas: `Tipo: ${tarea.tipo} | Prioridad: ${tarea.prioridad}`,
        organizacionId: organizacionActual?.id,
        origen: 'tarea',
        esTareaEquipo: true
      }));

    // Combinar eventos y tareas
    return [...eventos, ...tareasComoEventos];
  }, [eventos, todasLasTareas, organizacionActual?.id]);

  // Hook personalizado para lógica del calendario (ahora con datos combinados)
  const {
    fechaSeleccionada,
    vistaActual,
    setVistaActual,
    irMesAnterior,
    irMesSiguiente,
    irHoy,
    seleccionarFecha,
    obtenerEventosParaFecha,
    tieneEventos,
    contarEventos,
    formatearTituloMes,
    validarEvento,
    crearEventoVacio,
    tiposEvento,
    diasSemana
  } = useCalendarHelpers(eventosCombinados);
  
  // ===== ESTADOS DE UI =====
  const {
    loading,
    iniciarCarga,
    finalizarCarga,
    mostrarError,
    mostrarExito,
    abrirModal,
    cerrarModal,
    estaModalAbierto,
    obtenerDatosModal
  } = useUIState({
    modales: {
      evento: { abierto: false, datos: null },
      nuevo: { abierto: false, datos: null },
      editar: { abierto: false, datos: null },
      eliminar: { abierto: false, datos: null }
    }
  });

  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [eventoEditando, setEventoEditando] = useState(null);
  
  // Estado para el modal de eventos del día
  const [modalEventosDia, setModalEventosDia] = useState({
    abierto: false,
    fecha: null,
    eventos: []
  });
  
  // Debug: Log del estado del modal
  React.useEffect(() => {
    console.log('📋 Estado modalEventosDia:', modalEventosDia);
  }, [modalEventosDia]);

  // ===== CARGA DE DATOS COMBINADA Y OPTIMIZADA =====
  
  const cargarTodo = useCallback(async () => {
    console.log('🔄 DEBUG - Iniciando carga de datos del calendario');
    
    if (!organizacionActual?.id) {
      console.warn('⚠️ No hay organización activa para cargar datos');
      setEventos([]);
      return;
    }

    console.log('✅ Organización activa:', organizacionActual.id);

    try {
      iniciarCarga();
      
      let todosEventos = [];

      // 1. Cargar eventos desde localStorage (SIEMPRE primero y SIN filtrar por fecha)
      try {
        console.log('💾 Cargando eventos desde localStorage...');
        const eventosLocales = JSON.parse(localStorage.getItem('eventos_calendario') || '[]');
        const eventosOrganizacion = eventosLocales.filter(evento => 
          evento.organizacionId === organizacionActual.id
        );
        
        console.log(`💾 Eventos cargados desde localStorage: ${eventosOrganizacion.length}`);
        todosEventos = [...eventosOrganizacion];
        
      } catch (localStorageError) {
        console.warn('⚠️ Error cargando desde localStorage:', localStorageError);
      }

      // 2. Intentar cargar desde Firebase (casos con audiencias) - SIN filtrar por fecha
      try {
        console.log('🔄 Intentando cargar casos con audiencias desde Firebase...');
        
        // Cargar TODOS los casos de la organización
        const casosQuery = query(
          collection(db, 'casos'),
          where('organizacionId', '==', organizacionActual.id)
        );
        const casosSnapshot = await getDocs(casosQuery);
        const casosData = casosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log(`📊 Total casos cargados: ${casosData.length}`);

        // Convertir casos con fechaAudiencia en eventos (TODOS, sin filtrar por fecha)
        const eventosDesdeCasos = casosData
          .filter(caso => caso.fechaAudiencia) // Solo casos con fecha de audiencia
          .map(caso => ({
            id: `caso-${caso.id}`,
            casoId: caso.id,
            titulo: `Audiencia - ${caso.descripcion || caso.numero}`,
            tipo: 'audiencia',
            fecha: caso.fechaAudiencia,
            hora: caso.horaAudiencia || '09:00',
            caso: caso.numero,
            tipoCaso: caso.tipo,
            lugar: caso.lugar || 'Por definir',
            juez: caso.juez || '',
            abogado: caso.abogado || '',
            notas: caso.observaciones || '',
            cliente: caso.cliente || '',
            organizacionId: caso.organizacionId,
            origen: 'caso'
          }));

        console.log(`📅 Eventos desde casos: ${eventosDesdeCasos.length}`);
        
        // Combinar con eventos locales, evitando duplicados
        eventosDesdeCasos.forEach(eventoCaso => {
          const existe = todosEventos.find(e => 
            e.casoId === eventoCaso.casoId ||
            (e.fecha === eventoCaso.fecha && e.caso === eventoCaso.caso)
          );
          if (!existe) {
            todosEventos.push(eventoCaso);
          }
        });
        
      } catch (firebaseError) {
        console.warn('⚠️ Error cargando desde Firebase:', firebaseError);
      }

      // 3. Eliminar duplicados y ordenar (SIN filtrar por fecha)
      const eventosUnicos = todosEventos
        .filter((evento, index, self) =>
          index === self.findIndex((e) => (
            e.id === evento.id ||
            (e.fecha === evento.fecha && 
             e.hora === evento.hora &&
             e.titulo === evento.titulo)
          ))
        )
        .sort((a, b) => {
          const fechaA = new Date(a.fecha + ' ' + (a.hora || '00:00'));
          const fechaB = new Date(b.fecha + ' ' + (b.hora || '00:00'));
          return fechaA - fechaB;
        });
      
      console.log(`📊 Total eventos únicos cargados: ${eventosUnicos.length}`);
      console.log('📋 Eventos por fecha:', eventosUnicos.reduce((acc, e) => {
        acc[e.fecha] = (acc[e.fecha] || 0) + 1;
        return acc;
      }, {}));
      
      setEventos(eventosUnicos);
      
      // 4. Recargar tareas del equipo si es necesario
      if (recargarTareas) {
        console.log('🔄 Recargando tareas del equipo...');
        await recargarTareas();
      }
      
      console.log('✅ Carga de datos completada exitosamente');
      
    } catch (error) {
      console.error('❌ Error al cargar datos del calendario:', error);
      mostrarError('Error al cargar los datos del calendario');
    } finally {
      finalizarCarga();
    }
  }, [iniciarCarga, finalizarCarga, mostrarError, organizacionActual?.id, recargarTareas]);
  
  // Efecto para cargar datos al iniciar y limpiar eventos de muestra
  useEffect(() => {
    // Limpiar eventos de muestra al iniciar
    const limpiarEventosMuestra = () => {
      try {
        const eventosGuardados = JSON.parse(localStorage.getItem('eventos_calendario') || '[]');
        // Filtrar eventos que NO sean de muestra (que no tengan DEMO en el caso)
        const eventosSinMuestra = eventosGuardados.filter(evento => 
          !evento.caso?.includes('DEMO') && 
          !evento.titulo?.includes('Demo') &&
          !evento.titulo?.includes('Prueba')
        );
        
        if (eventosSinMuestra.length !== eventosGuardados.length) {
          localStorage.setItem('eventos_calendario', JSON.stringify(eventosSinMuestra));
          console.log(`🧹 Eliminados ${eventosGuardados.length - eventosSinMuestra.length} eventos de muestra`);
        }
      } catch (error) {
        console.error('Error limpiando eventos de muestra:', error);
      }
    };
    
    limpiarEventosMuestra();
    cargarTodo();
  }, [cargarTodo, organizacionActual?.id]);

  const cargarEventos = useCallback(async () => {
    // Esta función ahora es parte de cargarTodo() para optimización
    await cargarTodo();
  }, [cargarTodo]);

  // ===== EFECTOS =====
  
  useEffect(() => {
    cargarTodo();
  }, [cargarTodo, organizacionActual?.id]);

  // Escuchar eventos de audiencias actualizadas
  useEffect(() => {
    const handleAudienciaActualizada = (event) => {
      console.log('📅 Calendario - Audiencia actualizada:', event.detail);
      cargarTodo();
    };
    
    const handleTareaActualizada = (event) => {
      console.log('📅 Calendario - Tarea actualizada:', event.detail);
      cargarTodo();
    };
    
    window.addEventListener('audienciaActualizada', handleAudienciaActualizada);
    window.addEventListener('tareaActualizada', handleTareaActualizada);
    
    return () => {
      window.removeEventListener('audienciaActualizada', handleAudienciaActualizada);
      window.removeEventListener('tareaActualizada', handleTareaActualizada);
    };
  }, [cargarTodo]);

  // ===== HANDLERS DE NAVEGACIÓN =====
  
  const handleMesAnterior = useCallback(() => {
    irMesAnterior();
  }, [irMesAnterior]);

  const handleMesSiguiente = useCallback(() => {
    irMesSiguiente();
  }, [irMesSiguiente]);

  const handleHoy = useCallback(() => {
    irHoy();
    setDiaSeleccionado(new Date());
  }, [irHoy]);

  const handleCambiarVista = useCallback((nuevaVista) => {
    setVistaActual(nuevaVista);
    
    // Si cambiamos a vista semanal, ajustar la fecha a la semana actual
    if (nuevaVista === 'semana') {
      const hoy = new Date();
      seleccionarFecha(hoy);
    }
  }, [setVistaActual, seleccionarFecha]);

  // ===== HANDLERS DE EVENTOS =====
  
  const handleDiaClick = useCallback((dia) => {
    setDiaSeleccionado(dia);
    seleccionarFecha(dia);
  }, [seleccionarFecha]);
  
  // Handler para mostrar modal al pasar el cursor
  const handleDiaHover = useCallback((dia) => {
    // Formatear la fecha del día a YYYY-MM-DD para comparar
    const year = dia.getFullYear();
    const month = String(dia.getMonth() + 1).padStart(2, '0');
    const day = String(dia.getDate()).padStart(2, '0');
    const fechaStr = `${year}-${month}-${day}`;
    
    // Buscar eventos que coincidan con esta fecha
    const eventosDelDia = eventosCombinados.filter(evento => evento.fecha === fechaStr);
    
    // Solo abrir modal si hay eventos
    if (eventosDelDia && eventosDelDia.length > 0) {
      console.log('✅ Abriendo modal para', fechaStr, 'con', eventosDelDia.length, 'eventos');
      setModalEventosDia({
        abierto: true,
        fecha: dia,
        eventos: eventosDelDia
      });
    }
  }, [eventosCombinados]);

  const handleDiaDoubleClick = useCallback((dia) => {
    setDiaSeleccionado(dia);
    seleccionarFecha(dia);
    handleNuevoEvento();
  }, [seleccionarFecha]);

  const handleEventoClick = useCallback((evento) => {
    abrirModal('evento', evento);
  }, [abrirModal]);

  const handleNuevoEvento = useCallback(() => {
    const eventoVacio = crearEventoVacio(diaSeleccionado);
    abrirModal('nuevo', { 
      fechaSeleccionada: diaSeleccionado,
      eventoVacio 
    });
  }, [abrirModal, diaSeleccionado, crearEventoVacio]);

  const handleCerrarModal = useCallback((tipoModal) => {
    cerrarModal(tipoModal);
  }, [cerrarModal]);
  
  // Handler para cerrar el modal de eventos del día
  const handleCerrarModalEventosDia = useCallback(() => {
    setModalEventosDia({
      abierto: false,
      fecha: null,
      eventos: []
    });
  }, []);

  // ===== HANDLERS DE CRUD ROBUSTOS =====
  
  const handleGuardarEvento = useCallback(async (datosEvento) => {
    console.log('🔍 DEBUG - Iniciando guardado de evento:', datosEvento);
    
    if (!organizacionActual?.id) {
      console.error('❌ No hay organización activa');
      mostrarError('No hay organización activa');
      return;
    }

    console.log('✅ Organización activa:', organizacionActual.id);

    try {
      iniciarCarga();
      
      // Validar datos básicos
      if (!datosEvento.titulo || !datosEvento.fecha || !datosEvento.hora) {
        throw new Error('Faltan campos requeridos: título, fecha y hora');
      }

      // Crear evento con ID único y timestamp
      const timestamp = Date.now();
      const nuevoEvento = {
        id: `evento-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
        titulo: datosEvento.titulo.trim(),
        tipo: datosEvento.tipo || 'audiencia',
        fecha: datosEvento.fecha,
        hora: datosEvento.hora,
        caso: datosEvento.caso?.trim() || '',
        lugar: datosEvento.lugar?.trim() || '',
        juez: datosEvento.juez?.trim() || '',
        abogado: datosEvento.abogado?.trim() || '',
        notas: datosEvento.notas?.trim() || '',
        organizacionId: organizacionActual.id,
        origen: 'audiencia',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        persistente: true // Marcar como persistente
      };

      console.log('📦 Evento preparado:', nuevoEvento);

      // PASO 1: Guardar en localStorage PRIMERO (persistencia garantizada)
      try {
        const eventosGuardados = JSON.parse(localStorage.getItem('eventos_calendario') || '[]');
        eventosGuardados.push(nuevoEvento);
        localStorage.setItem('eventos_calendario', JSON.stringify(eventosGuardados));
        console.log('💾 ✅ Evento guardado en localStorage');
        console.log('💾 Total eventos en localStorage:', eventosGuardados.length);
      } catch (storageError) {
        console.error('❌ Error guardando en localStorage:', storageError);
        throw new Error('No se pudo guardar el evento localmente');
      }

      // PASO 2: Intentar guardar en Firebase como respaldo (opcional)
      try {
        console.log('💾 Intentando guardar en Firebase...');
        const docRef = await addDoc(collection(db, 'audiencias'), nuevoEvento);
        console.log('✅ Evento también guardado en Firebase con ID:', docRef.id);
        nuevoEvento.firebaseId = docRef.id;
        
        // Actualizar localStorage con el ID de Firebase
        const eventosActualizados = JSON.parse(localStorage.getItem('eventos_calendario') || '[]');
        const index = eventosActualizados.findIndex(e => e.id === nuevoEvento.id);
        if (index !== -1) {
          eventosActualizados[index].firebaseId = docRef.id;
          localStorage.setItem('eventos_calendario', JSON.stringify(eventosActualizados));
        }
      } catch (firebaseError) {
        console.warn('⚠️ Firebase no disponible, evento guardado solo en localStorage:', firebaseError.message);
      }

      // PASO 3: Actualizar estado local inmediatamente
      setEventos(prev => {
        const nuevosEventos = [...prev, nuevoEvento];
        console.log('🔄 Estado de eventos actualizado:', nuevosEventos.length, 'eventos');
        return nuevosEventos;
      });

      mostrarExito('Evento guardado exitosamente');
      cerrarModal('nuevo');
      
      console.log('✅ Guardado completado exitosamente');
      console.log('📊 Verificación localStorage:', JSON.parse(localStorage.getItem('eventos_calendario') || '[]').length, 'eventos');
      
    } catch (error) {
      console.error('❌ Error en el guardado:', error);
      mostrarError(`Error al guardar evento: ${error.message}`);
    } finally {
      finalizarCarga();
    }
  }, [mostrarError, mostrarExito, cerrarModal, organizacionActual?.id, iniciarCarga, finalizarCarga]);

  const handleEditarEvento = useCallback((evento) => {
    setEventoEditando(evento);
    abrirModal('editar', evento);
  }, [abrirModal]);

  const handleEliminarEvento = useCallback((evento) => {
    abrirModal('eliminar', evento);
  }, [abrirModal]);

  const handleConfirmarEliminar = useCallback(async (evento) => {
    const resultado = await CalendarModalService.ejecutarConManejadorError(
      async () => {
        if (evento.origen === 'tarea') {
          // Si es una tarea, eliminarla de la subcolección de tareas
          await deleteDoc(doc(db, 'casos', evento.casoId, 'tareas', evento.tareaId));
        } else if (evento.origen === 'caso' || evento.casoId) {
          // Si viene de un caso, limpiar fechas de audiencia
          await updateDoc(doc(db, 'casos', evento.casoId), {
            fechaAudiencia: '',
            horaAudiencia: '',
            updatedAt: serverTimestamp()
          });
        } else {
          // Si es de la colección de audiencias, eliminarlo
          await deleteDoc(doc(db, 'audiencias', evento.id));
        }
        
        return evento;
      },
      CalendarModalService.TIPOS_MODAL.ELIMINAR,
      evento
    );

    if (resultado.success) {
      mostrarExito(resultado.message);
      cerrarModal('eliminar');
      cerrarModal('evento');
      await cargarTodo(); // Usar cargarTodo para recargar todo
    } else {
      mostrarError(resultado.error);
    }
  }, [mostrarError, mostrarExito, cerrarModal, cargarTodo]);

  const handleActualizarEvento = useCallback(async (datosEvento) => {
    const resultado = await CalendarModalService.ejecutarConManejadorError(
      async () => {
        // Validar usando el servicio
        const validacion = CalendarService.validarEvento(datosEvento);
        if (!validacion.esValido) {
          throw new Error(validacion.errores.join(', '));
        }

        // Preparar datos usando el servicio
        const eventoPreparado = CalendarModalService.prepararDatosParaEditar(datosEvento, eventoEditando);

        if (eventoEditando.origen === 'tarea') {
          // Si es una tarea, actualizarla en la subcolección
          await updateDoc(doc(db, 'casos', eventoEditando.casoId, 'tareas', eventoEditando.tareaId), {
            descripcion: datosEvento.titulo.replace('Tarea: ', ''),
            fechaLimite: datosEvento.fecha + 'T' + datosEvento.hora,
            prioridad: datosEvento.prioridad || 'media',
            updatedAt: serverTimestamp()
          });
        } else if (eventoEditando.origen === 'caso' || eventoEditando.casoId) {
          // Si viene de un caso, actualizar el caso
          await updateDoc(doc(db, 'casos', eventoEditando.casoId), {
            fechaAudiencia: datosEvento.fecha,
            horaAudiencia: datosEvento.hora,
            observaciones: datosEvento.notas || '',
            updatedAt: serverTimestamp()
          });
        } else {
          // Si es de la colección de audiencias, actualizarlo
          await updateDoc(doc(db, 'audiencias', eventoEditando.id), eventoPreparado);
        }
        
        return eventoPreparado;
      },
      CalendarModalService.TIPOS_MODAL.EDITAR,
      datosEvento
    );

    if (resultado.success) {
      mostrarExito(resultado.message);
      cerrarModal('editar');
      cerrarModal('evento');
      setEventoEditando(null);
      await cargarTodo(); // Usar cargarTodo para recargar todo
    } else {
      mostrarError(resultado.error);
    }
  }, [eventoEditando, mostrarError, mostrarExito, cerrarModal, cargarTodo]);

  // ===== DATOS PARA LA VISTA =====
  
  const eventoSeleccionado = obtenerDatosModal('evento');
  const mostrarModalNuevo = estaModalAbierto('nuevo');
  const mostrarModalEditar = estaModalAbierto('editar');
  const mostrarModalEliminar = estaModalAbierto('eliminar');
  const eventoAEliminar = obtenerDatosModal('eliminar');

  // ===== RENDER =====
  
  return (<>
    <CalendarioView
      // Estados de datos
      eventos={eventosCombinados} // Ahora incluye tareas del equipo
      fechaActual={fechaSeleccionada}
      
      // Optimización de UI
      mapaEventos={mapaEventos} // Para el efecto de brillo
      
      // Estados de UI
      vistaActual={vistaActual}
      diaSeleccionado={diaSeleccionado}
      eventoSeleccionado={eventoSeleccionado}
      mostrarModalNuevo={mostrarModalNuevo}
      mostrarModalEditar={mostrarModalEditar}
      mostrarModalEliminar={mostrarModalEliminar}
      eventoEditando={eventoEditando}
      eventoAEliminar={eventoAEliminar}
      cargando={loading || cargandoTareas} // Combinar estados de carga
      
      // Datos del calendario
      tituloMes={formatearTituloMes()}
      diasSemana={diasSemana}
      tiposEvento={tiposEvento}
      
      // Funciones auxiliares
      obtenerEventosParaFecha={obtenerEventosParaFecha}
      tieneEventos={tieneEventos}
      contarEventos={contarEventos}
      
      // Handlers de navegación
      onMesAnterior={handleMesAnterior}
      onMesSiguiente={handleMesSiguiente}
      onHoy={handleHoy}
      onCambiarVista={handleCambiarVista}
      
      // Handlers de eventos
      onDiaClick={handleDiaClick}
      onDiaHover={handleDiaHover}
      onDiaDoubleClick={handleDiaDoubleClick}
      onEventoClick={handleEventoClick}
      onNuevoEvento={handleNuevoEvento}
      onCerrarModal={handleCerrarModal}
      
      // Handlers de CRUD
      onGuardarEvento={handleGuardarEvento}
      onEditarEvento={handleEditarEvento}
      onEliminarEvento={handleEliminarEvento}
      onActualizarEvento={handleActualizarEvento}
      onConfirmarEliminar={handleConfirmarEliminar}
      
      // Funciones de navegación del sidebar
      onNavigateTo={(view) => {
        // Usar el evento personalizado para navegar
        window.dispatchEvent(new CustomEvent('navigateToView', { 
          detail: { view } 
        }));
      }}
    />
    
    {/* Modal de eventos del día */}
    <DayEventsModal
      isOpen={modalEventosDia.abierto}
      fecha={modalEventosDia.fecha}
      eventos={modalEventosDia.eventos}
      onClose={handleCerrarModalEventosDia}
      onEditarEvento={(evento) => {
        handleCerrarModalEventosDia();
        handleEditarEvento(evento);
      }}
      onEliminarEvento={(evento) => {
        handleCerrarModalEventosDia();
        handleEliminarEvento(evento);
      }}
      onNuevoEvento={() => {
        handleCerrarModalEventosDia();
        handleNuevoEvento();
      }}
    />
  </>
  );
};

export default CalendarioContainer;