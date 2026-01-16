// Calendario.js - Componente refactorizado usando arquitectura Container/View
// Ahora usa CalendarioContainer para lógica y CalendarioView para presentación

import React from 'react';
import CalendarioContainer from './containers/CalendarioContainer';

function Calendario() {
  // El componente ahora es solo un wrapper que usa la nueva arquitectura
  return <CalendarioContainer />;
}

export default Calendario;