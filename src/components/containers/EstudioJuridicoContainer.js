// EstudioJuridicoContainer.js - Contenedor con toda la lógica de negocio
// Separación completa: lógica aquí, vista en EstudioJuridicoView

import React, { useState, useEffect, useCallback } from 'react';
import EstudioJuridicoView from '../views/EstudioJuridicoView';
import EstadisticasDetalladas from '../EstadisticasDetalladas';

// Hooks especializados para lógica de negocio
import { useExpedienteData } from '../../hooks/useExpedienteData';
import { useTramiteData } from '../../hooks/useTramiteData';
import { useEstadisticas } from '../../hooks/useEstadisticas';

const EstudioJuridicoContainer = ({ 
  onVolver, 
  onAbrirExpediente, 
  onIrATramites, 
  initialSlidePosition = 0 
}) => {
  // ===== ESTADOS DE UI (sin lógica de negocio) =====
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [diaAnimado, setDiaAnimado] = useState(null);
  const [animacionActiva, setAnimacionActiva] = useState(false);
  const [expedienteSeleccionado, setExpedienteSeleccionado] = useState(null);
  const [mostrarBusqueda, setMostrarBusqueda] = useState(false);
  const [mostrarEstadisticas, setMostrarEstadisticas] = useState(false);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('Todos');

  // ===== HOOKS DE LÓGICA DE NEGOCIO =====
  const { 
    expedientes, 
    expedientesOrdenados, 
    loading: expedientesLoading 
  } = useExpedienteData(filtroActivo);

  const { 
    tramitesPendientes,
    generarTareasDesdeExpedientes,
    loading: tramitesLoading 
  } = useTramiteData();

  const { 
    resumenHoy,
    estadisticasGenerales,
    actualizarEstadisticasDesdeExpedientes,
    obtenerDistribucionPorTipo,
    obtenerDistribucionPorEstado,
    loading: estadisticasLoading 
  } = useEstadisticas();

  // ===== LÓGICA DE NEGOCIO =====
  
  // Constantes de configuración
  const FICHAS_POR_VISTA = 5;
  const INTERVALO_AUTO_PLAY = 8000;

  // Generar tareas combinando datos
  const [tareas, setTareas] = useState([]);
  
  useEffect(() => {
    if (expedientes.length > 0 || tramitesPendientes.length > 0) {
      const tareasGeneradas = generarTareasDesdeExpedientes(
        expedientes, 
        tramitesPendientes
      );
      setTareas(tareasGeneradas);
    }
  }, [expedientes, tramitesPendientes, generarTareasDesdeExpedientes]);

  // Actualizar estadísticas cuando cambien los expedientes
  useEffect(() => {
    if (expedientes.length > 0) {
      actualizarEstadisticasDesdeExpedientes(expedientes);
    }
  }, [expedientes, actualizarEstadisticasDesdeExpedientes]);

  // Lógica de carrusel automático
  useEffect(() => {
    if (!isAutoPlay || expedientes.length === 0) return;

    const timer = setInterval(() => {
      setCarouselIndex((prevIndex) => {
        const nextIndex = prevIndex + FICHAS_POR_VISTA;
        return nextIndex >= expedientes.length ? 0 : nextIndex;
      });
    }, INTERVALO_AUTO_PLAY);

    return () => clearInterval(timer);
  }, [expedientes.length, isAutoPlay, FICHAS_POR_VISTA, INTERVALO_AUTO_PLAY]);

  // ===== HANDLERS DE UI =====
  
  const handleExpedienteClick = useCallback((expediente) => {
    if (onAbrirExpediente) {
      onAbrirExpediente(expediente);
    } else {
      setExpedienteSeleccionado(expediente);
    }
  }, [onAbrirExpediente]);

  const handleIndexChange = useCallback((newIndex) => {
    setCarouselIndex(newIndex);
    setIsAutoPlay(false);
    setTimeout(() => setIsAutoPlay(true), 5000);
  }, []);

  const handleAutoPlayChange = useCallback((autoPlay) => {
    setIsAutoPlay(autoPlay);
  }, []);

  const handleToggleBusqueda = useCallback((mostrar = null) => {
    if (mostrar !== null) {
      setMostrarBusqueda(mostrar);
    } else {
      setMostrarBusqueda(prev => !prev);
    }
    
    if (!mostrar) {
      setTerminoBusqueda('');
    }
  }, []);

  const handleToggleEstadisticas = useCallback(() => {
    setMostrarEstadisticas(prev => !prev);
  }, []);

  const handleTerminoBusquedaChange = useCallback((termino) => {
    setTerminoBusqueda(termino);
  }, []);

  const handleCerrarModal = useCallback(() => {
    setExpedienteSeleccionado(null);
  }, []);

  const handleCerrarEstadisticas = useCallback(() => {
    setMostrarEstadisticas(false);
  }, []);

  // Filtrar expedientes por búsqueda
  const expedientesFiltrados = expedientes.filter(exp => {
    if (!terminoBusqueda) return true;
    const termino = terminoBusqueda.toLowerCase();
    return (
      exp.numero?.toLowerCase().includes(termino) ||
      exp.cliente?.toLowerCase().includes(termino) ||
      exp.descripcion?.toLowerCase().includes(termino)
    );
  });

  // ===== LOADING STATE =====
  if (expedientesLoading || audienciasLoading || tramitesLoading || estadisticasLoading) {
    return (
      <div className="estudio-loading">
        <div className="loading-spinner"></div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  // ===== RENDER =====
  return (
    <>
      <EstudioJuridicoView
        // Estados de datos
        expedientes={expedientesFiltrados}
        resumenHoy={resumenHoy}
        tareas={tareas}
        
        // Estados de UI
        carouselIndex={carouselIndex}
        isAutoPlay={isAutoPlay}
        diaAnimado={diaAnimado}
        expedienteSeleccionado={expedienteSeleccionado}
        mostrarBusqueda={mostrarBusqueda}
        terminoBusqueda={terminoBusqueda}
        
        // Handlers
        onVolver={onVolver}
        onIrATramites={onIrATramites}
        onExpedienteClick={handleExpedienteClick}
        onIndexChange={handleIndexChange}
        onAutoPlayChange={handleAutoPlayChange}
        onToggleBusqueda={handleToggleBusqueda}
        onToggleEstadisticas={handleToggleEstadisticas}
        onTerminoBusquedaChange={handleTerminoBusquedaChange}
        onCerrarModal={handleCerrarModal}
        
        // Constantes
        FICHAS_POR_VISTA={FICHAS_POR_VISTA}
      />
      
      {/* Modal de Estadísticas */}
      {mostrarEstadisticas && (
        <EstadisticasDetalladas
          estadisticas={estadisticasGenerales}
          distribucionTipo={obtenerDistribucionPorTipo()}
          distribucionEstado={obtenerDistribucionPorEstado()}
          onCerrar={handleCerrarEstadisticas}
        />
      )}
    </>
  );
};

export default EstudioJuridicoContainer;