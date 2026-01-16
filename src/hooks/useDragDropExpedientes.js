// useDragDropExpedientes.js - Hook para manejar drag & drop de expedientes
// Desacopla la lógica de drag & drop del componente VistaGeneralExpedientes

import { useState, useCallback } from 'react';

export const useDragDropExpedientes = (onActualizarExpediente) => {
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedFromColumn, setDraggedFromColumn] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);

  // Recalcular y guardar orden secuencial
  const recalcularYGuardarOrden = useCallback(async (items, columna) => {
    console.log('🔄 Recalculando orden para columna:', columna);
    
    const actualizados = items.map((item, index) => ({
      ...item,
      orden: index + 1,
      tipoTarea: columna
    }));

    console.log('📊 Orden calculado:', actualizados.map(a => ({
      cliente: a.cliente,
      orden: a.orden,
      tipoTarea: a.tipoTarea
    })));

    // Guardar en Firebase
    if (onActualizarExpediente) {
      console.log('💾 Guardando en Firebase...');
      for (const item of actualizados) {
        try {
          const datos = {
            orden: item.orden,
            tipoTarea: columna,
            esTarea: true
          };
          await onActualizarExpediente(item.id, datos);
          console.log(`✅ Guardado: ${item.cliente} → orden ${item.orden}`);
        } catch (error) {
          console.error(`❌ Error guardando orden para ${item.id}:`, error);
        }
      }
      console.log('✅ Todos los items guardados en Firebase');
    }

    return actualizados;
  }, [onActualizarExpediente]);

  // Handlers de Drag & Drop
  const handleDragStart = useCallback((e, expediente, columna) => {
    setDraggedItem(expediente);
    setDraggedFromColumn(columna);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target);
    
    setTimeout(() => {
      e.target.style.opacity = '0.5';
    }, 0);
  }, []);

  const handleDragEnd = useCallback((e) => {
    e.target.style.opacity = '1';
    setDraggedItem(null);
    setDraggedFromColumn(null);
    setDragOverColumn(null);
    setDragOverItem(null);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnterColumn = useCallback((columna) => {
    setDragOverColumn(columna);
  }, []);

  const handleDragLeaveColumn = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  const handleDragEnterItem = useCallback((expediente) => {
    setDragOverItem(expediente);
  }, []);

  const handleDragLeaveItem = useCallback(() => {
    setDragOverItem(null);
  }, []);

  const handleDrop = useCallback(async (e, nuevoTipoTarea, itemsEnColumna, setExpedientesLocales) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedItem) return;

    console.log('📦 Drop detectado');
    console.log('  - Item arrastrado:', draggedItem.cliente);
    console.log('  - Desde columna:', draggedFromColumn);
    console.log('  - Hacia columna:', nuevoTipoTarea);
    console.log('  - Sobre item:', dragOverItem?.cliente || 'ninguno');

    // Construir nueva lista de la columna destino
    const columnaDestino = [...itemsEnColumna.filter(i => i.id !== draggedItem.id)];
    
    if (dragOverItem) {
      const index = columnaDestino.findIndex(i => i.id === dragOverItem.id);
      columnaDestino.splice(index, 0, draggedItem);
    } else {
      columnaDestino.push(draggedItem);
    }

    console.log('📋 Nueva lista de columna:', columnaDestino.map(i => i.cliente));

    // Recalcular orden y guardar
    const actualizados = await recalcularYGuardarOrden(columnaDestino, nuevoTipoTarea);

    // Actualizar estado local
    setExpedientesLocales(prev =>
      prev.map(exp => {
        const encontrado = actualizados.find(a => a.id === exp.id);
        return encontrado ? encontrado : exp;
      })
    );

    // Limpiar estados
    setDraggedItem(null);
    setDraggedFromColumn(null);
    setDragOverColumn(null);
    setDragOverItem(null);
  }, [draggedItem, draggedFromColumn, dragOverItem, recalcularYGuardarOrden]);

  return {
    draggedItem,
    draggedFromColumn,
    dragOverColumn,
    dragOverItem,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnterColumn,
    handleDragLeaveColumn,
    handleDragEnterItem,
    handleDragLeaveItem,
    handleDrop
  };
};
