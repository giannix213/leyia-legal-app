// useCasosState.js - Hook personalizado para manejar el estado de casos
// Soluciona el problema de estado controlado vs no controlado

import { useState, useCallback } from 'react';

export const useCasosState = ({
  busqueda: busquedaProp,
  onBusquedaChange,
  vistaActiva: vistaActivaProp,
  onVistaActivaChange,
  showModal: showModalProp,
  onShowModalChange
}) => {
  // Estados internos
  const [internalBusqueda, setInternalBusqueda] = useState('');
  const [internalVistaActiva, setInternalVistaActiva] = useState('activos');
  const [internalShowModal, setInternalShowModal] = useState(false);

  // Determinar si usar props o estado interno
  const busqueda = busquedaProp !== undefined ? busquedaProp : internalBusqueda;
  const vistaActiva = vistaActivaProp !== undefined ? vistaActivaProp : internalVistaActiva;
  const showModal = showModalProp !== undefined ? showModalProp : internalShowModal;

  // Handlers que funcionan tanto con props como con estado interno
  const handleBusquedaChange = useCallback((valor) => {
    if (onBusquedaChange) {
      onBusquedaChange(valor);
    } else {
      setInternalBusqueda(valor);
    }
  }, [onBusquedaChange]);

  const handleVistaActivaChange = useCallback((vista) => {
    if (onVistaActivaChange) {
      onVistaActivaChange(vista);
    } else {
      setInternalVistaActiva(vista);
    }
  }, [onVistaActivaChange]);

  const handleShowModalChange = useCallback((mostrar) => {
    if (onShowModalChange) {
      onShowModalChange(mostrar);
    } else {
      setInternalShowModal(mostrar);
    }
  }, [onShowModalChange]);

  return {
    busqueda,
    vistaActiva,
    showModal,
    setBusqueda: handleBusquedaChange,
    setVistaActiva: handleVistaActivaChange,
    setShowModal: handleShowModalChange
  };
};