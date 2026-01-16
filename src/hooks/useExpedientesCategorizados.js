// useExpedientesCategorizados.js - Hook para categorizar expedientes
// Desacopla la lógica de categorización del componente

import { useMemo } from 'react';

export const useExpedientesCategorizados = (expedientes) => {
  const expedientesCategorizados = useMemo(() => {
    console.log('🔄 Recalculando categorías. Expedientes:', expedientes.length);
    
    const tareas = [];
    const coordinaciones = [];
    const diligencias = [];

    if (Array.isArray(expedientes)) {
      expedientes.forEach(exp => {
        const textoObs = (exp.observaciones || '').toLowerCase();
        
        // PRIORIDAD 1: El tipo guardado explícitamente (tipoTarea)
        // PRIORIDAD 2: El texto de la observación
        const esCoordinacion = 
          exp.tipoTarea === 'coordinacion' || 
          textoObs.includes('coordinacion') || 
          textoObs.includes('coordinación') || 
          textoObs.includes('llamar');

        const esDiligencia = 
          exp.tipoTarea === 'diligencia' || 
          textoObs.includes('diligencia') || 
          textoObs.includes('juzgado') ||
          textoObs.includes('ir a');

        const item = { ...exp };

        if (esCoordinacion) {
          coordinaciones.push(item);
        } else if (esDiligencia) {
          diligencias.push(item);
        } else if (textoObs.trim() !== '') {
          // Solo va a tareas si tiene texto y no es de los anteriores
          tareas.push(item);
        }
      });
    }

    // Ordenar cada categoría por el campo 'orden'
    tareas.sort((a, b) => (a.orden || 0) - (b.orden || 0));
    coordinaciones.sort((a, b) => (a.orden || 0) - (b.orden || 0));
    diligencias.sort((a, b) => (a.orden || 0) - (b.orden || 0));

    console.log('📊 Categorías ordenadas:', {
      tareas: tareas.length,
      coordinaciones: coordinaciones.length,
      diligencias: diligencias.length
    });

    return { tareas, coordinaciones, diligencias };
  }, [expedientes]);

  return expedientesCategorizados;
};
