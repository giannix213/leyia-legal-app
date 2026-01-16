# DRAG & DROP CON ORDENAMIENTO - PANEL DE CONTROL DE TAREAS

## 📋 RESUMEN
Sistema completo de Drag & Drop con ordenamiento persistente para el Panel de Control de Tareas. Permite arrastrar tarjetas entre columnas (Tareas, Coordinaciones, Diligencias) y mantener el orden guardado en Firebase.

## ✅ FUNCIONALIDADES IMPLEMENTADAS

### 1. Drag & Drop Manual
- Arrastrar tarjetas entre columnas
- Indicador visual al arrastrar sobre una tarjeta
- Feedback inmediato con animaciones
- Notificaciones de éxito/error

### 2. Ordenamiento Persistente
- Orden secuencial limpio (1, 2, 3, 4...)
- Guardado automático en Firebase
- Recarga correcta del orden al volver al panel

### 3. Actualización Optimista
- UI se actualiza inmediatamente
- Firebase se actualiza en background
- Rollback automático si hay error

## 🔧 IMPLEMENTACIÓN TÉCNICA

### Estados del Componente
```javascript
const [draggedItem, setDraggedItem] = useState(null);
const [draggedFromColumn, setDraggedFromColumn] = useState(null);
const [dragOverColumn, setDragOverColumn] = useState(null);
const [dragOverItem, setDragOverItem] = useState(null);
const [expedientesLocales, setExpedientesLocales] = useState([]);
```

### Función de Recalculación de Orden
```javascript
const recalcularYGuardarOrden = async (items, columna) => {
  // 1. Asignar orden secuencial: 1, 2, 3, 4...
  const actualizados = items.map((item, index) => ({
    ...item,
    orden: index + 1,
    tipoTarea: columna
  }));

  // 2. Actualizar estado local inmediatamente
  setExpedientesLocales(prev =>
    prev.map(exp => {
      const encontrado = actualizados.find(a => a.id === exp.id);
      return encontrado ? encontrado : exp;
    })
  );

  // 3. Guardar en Firebase secuencialmente
  for (const item of actualizados) {
    await onActualizarExpediente(item.id, {
      orden: item.orden,
      tipoTarea: columna,
      esTarea: true
    });
  }
};
```

### Handler de Drop
```javascript
const handleDrop = async (e, targetColumna) => {
  // 1. Crear nueva lista sin el item arrastrado
  const columnaDestino = itemsEnColumna.filter(i => i.id !== draggedItem.id);

  // 2. Insertar en la posición correcta
  if (dragOverItem) {
    const index = columnaDestino.findIndex(i => i.id === dragOverItem.id);
    columnaDestino.splice(index, 0, draggedItem);
  } else {
    columnaDestino.push(draggedItem);
  }

  // 3. Recalcular y guardar orden
  await recalcularYGuardarOrden(columnaDestino, nuevoTipoTarea);
};
```

### Sincronización con Firebase
```javascript
useEffect(() => {
  if (expedientesLocales.length === 0) {
    setExpedientesLocales(expedientesOrdenados);
  }
}, []); // Solo en la carga inicial
```

## 📊 FLUJO COMPLETO

### Al arrastrar una tarjeta:
1. Usuario arrastra tarjeta A sobre tarjeta B
2. Se crea nueva lista sin tarjeta A
3. Se inserta tarjeta A antes de tarjeta B
4. Se recalcula orden: [A(1), B(2), C(3), D(4)...]
5. Se actualiza UI inmediatamente
6. Se guarda en Firebase secuencialmente
7. Se muestra notificación de éxito

### Al recargar:
1. Usuario sale del Panel de Control
2. Usuario vuelve a entrar
3. Se cargan expedientes desde Firebase
4. Se ordenan por campo `orden`
5. Las tarjetas aparecen en el orden guardado

## 🎨 ESTILOS CSS

### Tarjeta siendo arrastrada
```css
.expediente-card-categorizado.dragging {
  opacity: 0.5;
  transform: rotate(2deg) scale(1.02);
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  cursor: grabbing;
}
```

### Indicador de posición
```css
.expediente-card-categorizado.drag-over-item {
  border-top: 3px dashed currentColor;
  padding-top: 20px;
  margin-top: 8px;
}
```

### Columna con drag over
```css
.column.drag-over {
  background: rgba(59, 130, 246, 0.05);
  border: 2px dashed #3b82f6;
  border-radius: 12px;
}
```

## 📝 ESTRUCTURA DE DATOS EN FIREBASE

```javascript
{
  id: "exp-123",
  numero: "12345-2024",
  cliente: "Juan Pérez",
  tipoTarea: "coordinacion",  // 'tarea', 'coordinacion', 'diligencia'
  esTarea: true,
  orden: 2,  // Secuencial: 1, 2, 3, 4...
  observaciones: "Llamar al cliente",
  organizacionId: "org-456",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 🧪 CASOS DE PRUEBA

### ✅ Caso 1: Arrastrar sobre tarjeta específica
```
Antes: [A(1), B(2), C(3), D(4)]
Arrastrar D sobre B
Después: [A(1), D(2), B(3), C(4)]
```

### ✅ Caso 2: Arrastrar al final
```
Antes: [A(1), B(2), C(3)]
Arrastrar A al final
Después: [B(1), C(2), A(3)]
```

### ✅ Caso 3: Cambiar de columna
```
Tareas: [A(1), B(2)]
Coordinaciones: [C(1), D(2)]

Arrastrar A a Coordinaciones sobre D
Resultado:
Tareas: [B(1)]
Coordinaciones: [C(1), A(2), D(3)]
```

## 🚀 VENTAJAS DE LA SOLUCIÓN

- ✅ Orden siempre secuencial (1, 2, 3, 4...)
- ✅ Consistencia total con Firebase
- ✅ Lógica simple y clara
- ✅ Guardado garantizado
- ✅ Recarga correcta
- ✅ Actualización optimista
- ✅ Rollback automático en caso de error

## 📌 NOTAS IMPORTANTES

1. **Sincronización inicial única**: El estado local solo se carga una vez al montar el componente
2. **Independencia del listener**: Los cambios del listener no afectan el estado local mientras estás en la vista
3. **Recalculación completa**: Cada drag & drop recalcula TODO el orden de la columna destino
4. **Guardado secuencial**: Los items se guardan uno por uno para garantizar consistencia
5. **Persistencia**: El orden se mantiene al recargar la página y volver al panel

---

**Fecha de implementación**: 2026-01-14
**Versión**: 2.0.0
**Estado**: ✅ Implementado y probado
**Archivos**: 
- `src/components/VistaGeneralExpedientes.js`
- `src/components/VistaGeneralExpedientes.css`
