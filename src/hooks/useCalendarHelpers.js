// useCalendarHelpers.js - Hook personalizado para lógica común del calendario
// Centraliza funciones auxiliares y estados comunes del calendario

import { useState, useMemo, useCallback } from 'react';
import CalendarService from '../services/CalendarService';
import PresentationService from '../services/PresentationService';

const useCalendarHelpers = (eventos = []) => {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [vistaActual, setVistaActual] = useState('mes'); // 'mes', 'semana', 'agenda'
  const [filtroTipo, setFiltroTipo] = useState('');
  const [terminoBusqueda, setTerminoBusqueda] = useState('');

  // ===== DATOS CALCULADOS =====
  
  const añoActual = fechaSeleccionada.getFullYear();
  const mesActual = fechaSeleccionada.getMonth();
  
  const diasDelMes = useMemo(() => {
    return CalendarService.generarDiasDelMes(añoActual, mesActual);
  }, [añoActual, mesActual]);

  const eventosFiltrados = useMemo(() => {
    let eventosProcesados = [...eventos];
    
    // Filtrar por tipo
    if (filtroTipo) {
      eventosProcesados = CalendarService.filtrarEventosPorTipo(eventosProcesados, filtroTipo);
    }
    
    // Filtrar por búsqueda
    if (terminoBusqueda) {
      eventosProcesados = CalendarService.buscarEventos(eventosProcesados, terminoBusqueda);
    }
    
    return eventosProcesados;
  }, [eventos, filtroTipo, terminoBusqueda]);

  const eventosDelMes = useMemo(() => {
    const primerDia = new Date(añoActual, mesActual, 1);
    const ultimoDia = new Date(añoActual, mesActual + 1, 0);
    
    return CalendarService.filtrarEventosPorRango(
      eventosFiltrados, 
      primerDia, 
      ultimoDia
    );
  }, [eventosFiltrados, añoActual, mesActual]);

  const conteoEventosPorDia = useMemo(() => {
    return CalendarService.contarEventosPorDia(eventosDelMes);
  }, [eventosDelMes]);

  const eventosProximos = useMemo(() => {
    return CalendarService.obtenerEventosProximos(eventosFiltrados, 7);
  }, [eventosFiltrados]);

  // ===== FUNCIONES DE NAVEGACIÓN =====
  
  const irMesAnterior = useCallback(() => {
    setFechaSeleccionada(prev => {
      const nuevaFecha = new Date(prev);
      nuevaFecha.setMonth(prev.getMonth() - 1);
      return nuevaFecha;
    });
  }, []);

  const irMesSiguiente = useCallback(() => {
    setFechaSeleccionada(prev => {
      const nuevaFecha = new Date(prev);
      nuevaFecha.setMonth(prev.getMonth() + 1);
      return nuevaFecha;
    });
  }, []);

  const irHoy = useCallback(() => {
    setFechaSeleccionada(new Date());
  }, []);

  const seleccionarFecha = useCallback((fecha) => {
    setFechaSeleccionada(fecha);
  }, []);

  // ===== FUNCIONES DE EVENTOS =====
  
  const obtenerEventosParaFecha = useCallback((fecha) => {
    const eventosDelDia = CalendarService.filtrarEventosPorFecha(eventosFiltrados, fecha);
    return CalendarService.ordenarEventosPorHora(eventosDelDia);
  }, [eventosFiltrados]);

  const obtenerEventosFormateados = useCallback((fecha) => {
    const eventosDelDia = obtenerEventosParaFecha(fecha);
    return eventosDelDia.map(evento => 
      PresentationService.formatearEventoCalendario(evento)
    );
  }, [obtenerEventosParaFecha]);

  const tieneEventos = useCallback((fecha) => {
    const fechaKey = CalendarService.obtenerFechaString(fecha);
    return (conteoEventosPorDia[fechaKey] || 0) > 0;
  }, [conteoEventosPorDia]);

  const contarEventos = useCallback((fecha) => {
    const fechaKey = CalendarService.obtenerFechaString(fecha);
    return conteoEventosPorDia[fechaKey] || 0;
  }, [conteoEventosPorDia]);

  // ===== FUNCIONES DE FORMATEO =====
  
  const formatearTituloMes = useCallback(() => {
    return fechaSeleccionada.toLocaleDateString('es-ES', { 
      month: 'long', 
      year: 'numeric' 
    });
  }, [fechaSeleccionada]);

  const formatearFechaSeleccionada = useCallback(() => {
    return CalendarService.formatearFechaEvento(fechaSeleccionada, true);
  }, [fechaSeleccionada]);

  // ===== FUNCIONES DE VALIDACIÓN =====
  
  const validarEvento = useCallback((evento) => {
    return CalendarService.validarEvento(evento);
  }, []);

  const crearEventoVacio = useCallback((fecha = null) => {
    const eventoBase = CalendarService.crearEventoVacio();
    
    if (fecha) {
      eventoBase.fecha = CalendarService.obtenerFechaString(fecha);
    }
    
    return eventoBase;
  }, []);

  // ===== FUNCIONES DE FILTRADO =====
  
  const cambiarFiltroTipo = useCallback((tipo) => {
    setFiltroTipo(tipo);
  }, []);

  const cambiarTerminoBusqueda = useCallback((termino) => {
    setTerminoBusqueda(termino);
  }, []);

  const limpiarFiltros = useCallback(() => {
    setFiltroTipo('');
    setTerminoBusqueda('');
  }, []);

  // ===== DATOS DE CONFIGURACIÓN =====
  
  const tiposEvento = useMemo(() => {
    return CalendarService.getTiposEvento();
  }, []);

  const diasSemana = CalendarService.DIAS_SEMANA;
  const diasSemanaCompletos = CalendarService.DIAS_SEMANA_COMPLETOS;

  // ===== ESTADÍSTICAS =====
  
  const estadisticas = useMemo(() => {
    const totalEventos = eventosFiltrados.length;
    const eventosHoy = CalendarService.filtrarEventosPorFecha(
      eventosFiltrados, 
      new Date()
    ).length;
    
    const eventosPorTipo = eventosFiltrados.reduce((acc, evento) => {
      acc[evento.tipo] = (acc[evento.tipo] || 0) + 1;
      return acc;
    }, {});

    return {
      total: totalEventos,
      hoy: eventosHoy,
      proximos: eventosProximos.length,
      porTipo: eventosPorTipo
    };
  }, [eventosFiltrados, eventosProximos]);

  return {
    // Estados
    fechaSeleccionada,
    vistaActual,
    filtroTipo,
    terminoBusqueda,
    
    // Datos calculados
    añoActual,
    mesActual,
    diasDelMes,
    eventosFiltrados,
    eventosDelMes,
    eventosProximos,
    conteoEventosPorDia,
    estadisticas,
    
    // Funciones de navegación
    irMesAnterior,
    irMesSiguiente,
    irHoy,
    seleccionarFecha,
    setVistaActual,
    
    // Funciones de eventos
    obtenerEventosParaFecha,
    obtenerEventosFormateados,
    tieneEventos,
    contarEventos,
    
    // Funciones de formateo
    formatearTituloMes,
    formatearFechaSeleccionada,
    
    // Funciones de validación
    validarEvento,
    crearEventoVacio,
    
    // Funciones de filtrado
    cambiarFiltroTipo,
    cambiarTerminoBusqueda,
    limpiarFiltros,
    
    // Configuración
    tiposEvento,
    diasSemana,
    diasSemanaCompletos
  };
};

export default useCalendarHelpers;