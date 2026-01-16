# Desacoplamiento de Funciones - Refactorización

**Fecha**: 15 de enero de 2026  
**Objetivo**: Identificar y corregir funciones fuertemente acopladas

## 🎯 Problemas Identificados

### 1. Acoplamiento en `VistaGeneralExpedientes.js`

**Problema**: El componente tenía múltiples responsabilidades mezcladas:
- Lógica de drag & drop (150+ líneas)
- Lógica de categorización de expedientes (80+ líneas)
- Lógica de actualización en Firebase
- Renderizado de UI

**Síntomas**:
- Componente de 400+ líneas
- Difícil de testear
- Lógica no reutilizable
- Props drilling (pasar callbacks a través de múltiples niveles)

### 2. Callbacks Acoplados

**Problema**: Múltiples componentes pasaban callbacks como props:

```javascript
// EstudioJuridico.js
<VistaGeneralExpedientes
  onVolver={() => setVistaActual('clientes')}
  onRecargar={recargarDesdeRemoto}
  onActualizarExpediente={actualizarCaso}  // ❌ Acoplamiento fuerte
/>

// Equipo.js
<VistaGeneralExpedientes
  onVolver={() => setVistaActual('equipo')}
  onRecargar={recargar}
  onActualizarExpediente={actualizarCaso}  // ❌ Acoplamiento fuerte
/>
```

**Síntomas**:
- Misma prop pasada desde múltiples padres
- Componente hijo depende de implementación del padre
- Difícil cambiar comportamiento sin afectar múltiples componentes

### 3. Lógica de Negocio en Componentes

**Problema**: Lógica compleja de drag & drop mezclada con UI:

```javascript
// ❌ ANTES: Todo en el componente
const handleDrop = async (e, targetColumna) => {
  // 50+ líneas de lógica de negocio
  // Mapeo de columnas
  // Recalculo de orden
  // Actualización de Firebase
  // Actualización de estado local
};
```

## ✅ Soluciones Implementadas

### 1. Hook `useDragDropExpedientes`

**Archivo**: `src/hooks/useDragDropExpedientes.js`

**Responsabilidades**:
- Manejo de estados de drag & drop
- Lógica de recalculo de orden
- Actualización en Firebase
- Handlers de eventos de drag

**Beneficios**:
- Lógica reutilizable en otros componentes
- Fácil de testear de forma aislada
- Separación de responsabilidades
- Reduce componente de 400 a 250 líneas

**API**:
```javascript
const {
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
} = useDragDropExpedientes(onActualizarExpediente);
```

### 2. Hook `useExpedientesCategorizados`

**Archivo**: `src/hooks/useExpedientesCategorizados.js`

**Responsabilidades**:
- Categorización de expedientes (tareas, coordinaciones, diligencias)
- Ordenamiento por campo `orden`
- Memoización para optimización

**Beneficios**:
- Lógica de categorización reutilizable
- Optimización con useMemo
- Fácil de testear
- Reduce complejidad del componente

**API**:
```javascript
const { tareas, coordinaciones, diligencias } = useExpedientesCategorizados(expedientes);
```

### 3. Refactorización de `VistaGeneralExpedientes.js`

**Antes**: 400+ líneas con múltiples responsabilidades  
**Después**: 250 líneas enfocadas en UI

**Cambios**:
```javascript
// ✅ DESPUÉS: Hooks desacoplados
import { useDragDropExpedientes } from '../hooks/useDragDropExpedientes';
import { useExpedientesCategorizados } from '../hooks/useExpedientesCategorizados';

function VistaGeneralExpedientes({ 
  expedientesOrdenados,
  onVolver,
  onRecargar,
  onActualizarExpediente
}) {
  // Hook para drag & drop
  const {
    draggedItem,
    handleDragStart,
    handleDragEnd,
    // ... otros handlers
  } = useDragDropExpedientes(onActualizarExpediente);

  // Hook para categorización
  const expedientesCategorizados = useExpedientesCategorizados(expedientesLocales);

  // Componente solo se encarga de renderizar
  return (
    // JSX simplificado
  );
}
```

## 📊 Métricas de Mejora

### Reducción de Complejidad

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Líneas en componente | 400+ | 250 | -37% |
| Responsabilidades | 4 | 1 (UI) | -75% |
| Funciones en componente | 12 | 4 | -67% |
| Hooks personalizados | 0 | 2 | +2 |

### Beneficios de Testabilidad

**Antes**:
- ❌ Difícil testear drag & drop sin montar componente completo
- ❌ Difícil mockear Firebase
- ❌ Tests acoplados a implementación de UI

**Después**:
- ✅ Testear `useDragDropExpedientes` de forma aislada
- ✅ Testear `useExpedientesCategorizados` con datos simples
- ✅ Testear componente solo con snapshots de UI

### Reutilización

**Antes**:
- ❌ Lógica de drag & drop no reutilizable
- ❌ Categorización duplicada en otros componentes

**Después**:
- ✅ `useDragDropExpedientes` puede usarse en otros componentes
- ✅ `useExpedientesCategorizados` reutilizable en reportes, dashboards, etc.

## 🔧 Patrones Aplicados

### 1. Custom Hooks Pattern
Extraer lógica compleja a hooks personalizados para reutilización y testabilidad.

### 2. Single Responsibility Principle
Cada hook tiene una única responsabilidad bien definida.

### 3. Separation of Concerns
- **Hooks**: Lógica de negocio
- **Componentes**: Presentación y UI
- **Servicios**: Operaciones con Firebase

### 4. Dependency Injection
Los hooks reciben dependencias como parámetros en lugar de importarlas directamente.

```javascript
// ✅ Bueno: Inyección de dependencia
useDragDropExpedientes(onActualizarExpediente)

// ❌ Malo: Dependencia hardcodeada
useDragDropExpedientes() {
  import casosService from '../services/CasosService';
  // ...
}
```

## 🚀 Próximos Pasos

### 1. Desacoplar Más Componentes

**Candidatos**:
- `EstudioJuridico.js` - Extraer lógica de agrupación de clientes
- `Equipo.js` - Extraer lógica de sticky notes y todos
- `CalendarioContainer.js` - Extraer lógica de eventos

### 2. Crear Más Hooks Especializados

**Propuestas**:
- `useClientesAgrupados(expedientes)` - Agrupar por cliente
- `useStickyNotes(organizacionId)` - Manejo de notas
- `useEventosCalendario(organizacionId)` - Manejo de eventos

### 3. Implementar Context API

Para evitar props drilling en componentes profundamente anidados:

```javascript
// Propuesta
<DragDropContext>
  <VistaGeneralExpedientes />
</DragDropContext>
```

### 4. Agregar Tests

**Prioridad Alta**:
- Tests unitarios para `useDragDropExpedientes`
- Tests unitarios para `useExpedientesCategorizados`
- Tests de integración para `VistaGeneralExpedientes`

## 📝 Lecciones Aprendidas

### 1. Señales de Acoplamiento Fuerte

- Componente > 300 líneas
- Múltiples `useState` relacionados
- Funciones > 50 líneas
- Props drilling > 2 niveles
- Callbacks pasados como props

### 2. Cuándo Extraer a Hook

- Lógica reutilizable en múltiples componentes
- Lógica compleja que oscurece el componente
- Lógica que necesita ser testeada de forma aislada
- Múltiples estados relacionados

### 3. Cuándo NO Extraer

- Lógica muy específica de un componente
- Lógica trivial (< 10 líneas)
- Lógica que solo se usa una vez

## ✅ Estado Final

### Archivos Creados
- ✅ `src/hooks/useDragDropExpedientes.js` (150 líneas)
- ✅ `src/hooks/useExpedientesCategorizados.js` (60 líneas)

### Archivos Refactorizados
- ✅ `src/components/VistaGeneralExpedientes.js` (400→250 líneas)

### Mejoras Logradas
- ✅ Reducción de 37% en líneas de código del componente
- ✅ Separación clara de responsabilidades
- ✅ Lógica reutilizable en hooks
- ✅ Mayor testabilidad
- ✅ Mejor mantenibilidad

### Pendiente
- ⏳ Tests unitarios para hooks
- ⏳ Refactorización de otros componentes acoplados
- ⏳ Implementación de Context API para evitar props drilling
