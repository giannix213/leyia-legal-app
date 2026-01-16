// useUIState.js - Hook para manejar estados de UI comunes
// Centraliza lógica de modales, loading, errores, etc.

import { useState, useCallback } from 'react';

export const useUIState = (initialState = {}) => {
  // Estados de UI comunes
  const [loading, setLoading] = useState(initialState.loading || false);
  const [error, setError] = useState(initialState.error || null);
  const [success, setSuccess] = useState(initialState.success || null);
  
  // Estados de modales
  const [modales, setModales] = useState(initialState.modales || {});
  
  // Estados de formularios
  const [formularios, setFormularios] = useState(initialState.formularios || {});
  
  // Estados de filtros y búsqueda
  const [filtros, setFiltros] = useState(initialState.filtros || {});
  
  // Estados de selección
  const [seleccionados, setSeleccionados] = useState(initialState.seleccionados || []);
  
  // ===== FUNCIONES DE LOADING =====
  
  const iniciarCarga = useCallback((mensaje = null) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
  }, []);
  
  const finalizarCarga = useCallback(() => {
    setLoading(false);
  }, []);
  
  const manejarCarga = useCallback(async (promesa, mensajeExito = null) => {
    try {
      iniciarCarga();
      const resultado = await promesa;
      if (mensajeExito) {
        setSuccess(mensajeExito);
      }
      return resultado;
    } catch (error) {
      setError(error.message || 'Ocurrió un error');
      throw error;
    } finally {
      finalizarCarga();
    }
  }, [iniciarCarga, finalizarCarga]);
  
  // ===== FUNCIONES DE ERRORES =====
  
  const mostrarError = useCallback((mensaje) => {
    setError(mensaje);
    setSuccess(null);
  }, []);
  
  const limpiarError = useCallback(() => {
    setError(null);
  }, []);
  
  // ===== FUNCIONES DE ÉXITO =====
  
  const mostrarExito = useCallback((mensaje) => {
    setSuccess(mensaje);
    setError(null);
  }, []);
  
  const limpiarExito = useCallback(() => {
    setSuccess(null);
  }, []);
  
  // ===== FUNCIONES DE MODALES =====
  
  const abrirModal = useCallback((nombreModal, datos = null) => {
    setModales(prev => ({
      ...prev,
      [nombreModal]: {
        abierto: true,
        datos
      }
    }));
  }, []);
  
  const cerrarModal = useCallback((nombreModal) => {
    setModales(prev => ({
      ...prev,
      [nombreModal]: {
        abierto: false,
        datos: null
      }
    }));
  }, []);
  
  const toggleModal = useCallback((nombreModal, datos = null) => {
    setModales(prev => {
      const modalActual = prev[nombreModal];
      return {
        ...prev,
        [nombreModal]: {
          abierto: !modalActual?.abierto,
          datos: modalActual?.abierto ? null : datos
        }
      };
    });
  }, []);
  
  const estaModalAbierto = useCallback((nombreModal) => {
    return modales[nombreModal]?.abierto || false;
  }, [modales]);
  
  const obtenerDatosModal = useCallback((nombreModal) => {
    return modales[nombreModal]?.datos || null;
  }, [modales]);
  
  // ===== FUNCIONES DE FORMULARIOS =====
  
  const actualizarFormulario = useCallback((nombreForm, campo, valor) => {
    setFormularios(prev => ({
      ...prev,
      [nombreForm]: {
        ...prev[nombreForm],
        [campo]: valor
      }
    }));
  }, []);
  
  const resetearFormulario = useCallback((nombreForm, valoresIniciales = {}) => {
    setFormularios(prev => ({
      ...prev,
      [nombreForm]: valoresIniciales
    }));
  }, []);
  
  const obtenerFormulario = useCallback((nombreForm) => {
    return formularios[nombreForm] || {};
  }, [formularios]);
  
  // ===== FUNCIONES DE FILTROS =====
  
  const actualizarFiltro = useCallback((campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  }, []);
  
  const limpiarFiltros = useCallback(() => {
    setFiltros({});
  }, []);
  
  const aplicarFiltros = useCallback((datos, funcionFiltro) => {
    if (!funcionFiltro) return datos;
    return funcionFiltro(datos, filtros);
  }, [filtros]);
  
  // ===== FUNCIONES DE SELECCIÓN =====
  
  const seleccionar = useCallback((id) => {
    setSeleccionados(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);
  
  const seleccionarTodos = useCallback((ids) => {
    setSeleccionados(ids);
  }, []);
  
  const limpiarSeleccion = useCallback(() => {
    setSeleccionados([]);
  }, []);
  
  const estaSeleccionado = useCallback((id) => {
    return seleccionados.includes(id);
  }, [seleccionados]);
  
  // ===== FUNCIONES DE NOTIFICACIONES =====
  
  const [notificaciones, setNotificaciones] = useState([]);
  
  const agregarNotificacion = useCallback((mensaje, tipo = 'info', duracion = 5000) => {
    const id = Date.now();
    const notificacion = {
      id,
      mensaje,
      tipo, // 'success', 'error', 'warning', 'info'
      timestamp: new Date()
    };
    
    setNotificaciones(prev => [...prev, notificacion]);
    
    if (duracion > 0) {
      setTimeout(() => {
        eliminarNotificacion(id);
      }, duracion);
    }
    
    return id;
  }, []);
  
  const eliminarNotificacion = useCallback((id) => {
    setNotificaciones(prev => prev.filter(n => n.id !== id));
  }, []);
  
  const limpiarNotificaciones = useCallback(() => {
    setNotificaciones([]);
  }, []);
  
  // ===== FUNCIONES DE PAGINACIÓN =====
  
  const [paginacion, setPaginacion] = useState({
    pagina: 1,
    porPagina: 10,
    total: 0
  });
  
  const cambiarPagina = useCallback((nuevaPagina) => {
    setPaginacion(prev => ({
      ...prev,
      pagina: nuevaPagina
    }));
  }, []);
  
  const cambiarPorPagina = useCallback((nuevoPorPagina) => {
    setPaginacion(prev => ({
      ...prev,
      porPagina: nuevoPorPagina,
      pagina: 1 // Resetear a primera página
    }));
  }, []);
  
  const actualizarTotal = useCallback((nuevoTotal) => {
    setPaginacion(prev => ({
      ...prev,
      total: nuevoTotal
    }));
  }, []);
  
  const paginar = useCallback((datos) => {
    const inicio = (paginacion.pagina - 1) * paginacion.porPagina;
    const fin = inicio + paginacion.porPagina;
    return datos.slice(inicio, fin);
  }, [paginacion]);
  
  // ===== FUNCIONES DE ORDENAMIENTO =====
  
  const [ordenamiento, setOrdenamiento] = useState({
    campo: null,
    direccion: 'asc' // 'asc' o 'desc'
  });
  
  const cambiarOrdenamiento = useCallback((campo) => {
    setOrdenamiento(prev => ({
      campo,
      direccion: prev.campo === campo && prev.direccion === 'asc' ? 'desc' : 'asc'
    }));
  }, []);
  
  const ordenar = useCallback((datos, funcionOrdenar) => {
    if (!funcionOrdenar || !ordenamiento.campo) return datos;
    return funcionOrdenar(datos, ordenamiento.campo, ordenamiento.direccion);
  }, [ordenamiento]);
  
  // ===== FUNCIÓN DE RESET GENERAL =====
  
  const resetearTodo = useCallback(() => {
    setLoading(false);
    setError(null);
    setSuccess(null);
    setModales({});
    setFormularios({});
    setFiltros({});
    setSeleccionados([]);
    setNotificaciones([]);
    setPaginacion({ pagina: 1, porPagina: 10, total: 0 });
    setOrdenamiento({ campo: null, direccion: 'asc' });
  }, []);
  
  return {
    // Estados
    loading,
    error,
    success,
    modales,
    formularios,
    filtros,
    seleccionados,
    notificaciones,
    paginacion,
    ordenamiento,
    
    // Funciones de loading
    iniciarCarga,
    finalizarCarga,
    manejarCarga,
    
    // Funciones de errores y éxito
    mostrarError,
    limpiarError,
    mostrarExito,
    limpiarExito,
    
    // Funciones de modales
    abrirModal,
    cerrarModal,
    toggleModal,
    estaModalAbierto,
    obtenerDatosModal,
    
    // Funciones de formularios
    actualizarFormulario,
    resetearFormulario,
    obtenerFormulario,
    
    // Funciones de filtros
    actualizarFiltro,
    limpiarFiltros,
    aplicarFiltros,
    
    // Funciones de selección
    seleccionar,
    seleccionarTodos,
    limpiarSeleccion,
    estaSeleccionado,
    
    // Funciones de notificaciones
    agregarNotificacion,
    eliminarNotificacion,
    limpiarNotificaciones,
    
    // Funciones de paginación
    cambiarPagina,
    cambiarPorPagina,
    actualizarTotal,
    paginar,
    
    // Funciones de ordenamiento
    cambiarOrdenamiento,
    ordenar,
    
    // Reset general
    resetearTodo
  };
};