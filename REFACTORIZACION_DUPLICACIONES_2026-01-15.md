# Refactorización: Eliminación de Duplicaciones de Lógica

**Fecha**: 15 de enero de 2026  
**Objetivo**: Centralizar lógica duplicada de operaciones con casos en Firebase

## 🎯 Problema Identificado

Múltiples hooks y componentes tenían lógica duplicada para:
- Cargar casos de Firebase con filtro por `organizacionId`
- Manejar fallback cuando `orderBy` falla
- Calcular progreso de casos
- Formatear última actualización
- Transformar casos a formato de expedientes
- Crear/actualizar/eliminar casos

### Archivos con Duplicación

1. **`src/hooks/useCasos.js`** - 120 líneas de lógica de carga
2. **`src/hooks/useEquipoDatos.js`** - 80 líneas de lógica de carga + funciones de transformación
3. **`src/hooks/useEstudioDatos.js`** - 100 líneas de lógica de carga con múltiples fallbacks
4. **`src/hooks/useOrganizacionData.js`** - 60 líneas de operaciones CRUD
5. **`src/hooks/useTareas.js`** - Query duplicada
6. **`src/components/Contactos.js`** - Query duplicada
7. **`src/components/CajaChica.js`** - Query duplicada
8. **`src/components/containers/CalendarioContainer.js`** - Query duplicada
9. **`src/services/LeyiaService.js`** - Operaciones CRUD duplicadas

## ✅ Solución Implementada

### 1. Servicio Centralizado: `CasosService.js`

Creado en `src/services/CasosService.js` con las siguientes funciones:

#### Operaciones de Lectura
```javascript
// Cargar casos con fallback automático
cargarCasosPorOrganizacion(organizacionId)

// Crear listener en tiempo real
crearListenerCasos(organizacionId, onUpdate, onError)
```

#### Operaciones CRUD
```javascript
crearCaso(datosCaso, organizacionId)
actualizarCaso(casoId, datosActualizados)
eliminarCaso(casoId)
```

#### Utilidades
```javascript
calcularProgreso(caso)
formatearUltimaActualizacion(caso)
transformarAExpediente(caso)
```

### 2. Refactorización de Hooks

#### `useCasos.js`
**Antes**: 250 líneas con lógica compleja de queries y listeners  
**Después**: 120 líneas usando `casosService`

**Cambios**:
- `cargarCasos()` ahora usa `casosService.cargarCasosPorOrganizacion()`
- Listener usa `casosService.crearListenerCasos()`
- CRUD usa métodos del servicio

#### `useEquipoDatos.js`
**Antes**: 280 líneas con funciones duplicadas  
**Después**: 180 líneas usando `casosService`

**Cambios**:
- Eliminadas funciones `calcularProgreso()` y `formatearUltimaActualizacion()`
- `cargarExpedientes()` simplificado a 15 líneas
- Usa `casosService.transformarAExpediente()`

#### `useEstudioDatos.js`
**Antes**: 400 líneas con múltiples fallbacks  
**Después**: 280 líneas usando `casosService`

**Cambios**:
- Eliminadas funciones `calcularProgreso()` y `formatearUltimaActualizacion()`
- Lógica de carga reducida de 100 a 3 líneas
- Transformación usa `casosService.transformarAExpediente()`

#### `useOrganizacionData.js`
**Antes**: 350 líneas con operaciones CRUD completas  
**Después**: 250 líneas usando `casosService`

**Cambios**:
- `obtenerCasos()` usa servicio centralizado
- `crearCaso()` simplificado
- `actualizarCaso()` y `eliminarCaso()` usan servicio

### 3. Imports Limpiados

Eliminados imports no usados en:
- `src/hooks/useCasos.js` - Eliminados `collection`, `getDocs`, `addDoc`, `deleteDoc`, `query`, `orderBy`, `where`, `onSnapshot`
- `src/hooks/useEquipoDatos.js` - Mantenidos solo imports necesarios
- `src/hooks/useEstudioDatos.js` - Eliminadas funciones duplicadas
- `src/hooks/useOrganizacionData.js` - Simplificados imports de Firestore

## 📊 Métricas de Mejora

### Reducción de Código
- **Líneas eliminadas**: ~400 líneas de código duplicado
- **Funciones centralizadas**: 8 funciones reutilizables
- **Archivos refactorizados**: 4 hooks principales

### Beneficios

1. **Mantenibilidad**: Un solo lugar para actualizar lógica de casos
2. **Consistencia**: Mismo comportamiento en todos los hooks
3. **Testabilidad**: Servicio aislado fácil de testear
4. **Performance**: Lógica optimizada en un solo lugar
5. **Debugging**: Logs centralizados y consistentes

## 🔧 Funcionalidades Preservadas

✅ Carga de casos con filtro por organización  
✅ Fallback automático cuando `orderBy` falla  
✅ Ordenamiento manual en memoria  
✅ Listeners en tiempo real  
✅ Operaciones CRUD completas  
✅ Cálculo de progreso  
✅ Formateo de última actualización  
✅ Transformación a formato expediente  

## 🚀 Próximos Pasos Recomendados

1. **Refactorizar componentes restantes**:
   - `src/components/Contactos.js`
   - `src/components/CajaChica.js`
   - `src/components/containers/CalendarioContainer.js`
   - `src/hooks/useTareas.js`

2. **Crear servicios adicionales**:
   - `ContactosService.js` para operaciones con contactos
   - `AudienciasService.js` para operaciones con audiencias
   - `DocumentosService.js` para operaciones con documentos

3. **Agregar tests unitarios**:
   - Tests para `CasosService.js`
   - Tests de integración para hooks refactorizados

4. **Optimizaciones adicionales**:
   - Implementar caché en memoria en el servicio
   - Agregar retry logic para operaciones fallidas
   - Implementar batch operations para múltiples actualizaciones

## 📝 Notas Técnicas

### Patrón Singleton
El servicio usa patrón singleton para mantener una única instancia:
```javascript
const casosService = new CasosService();
export default casosService;
```

### Manejo de Errores
Todos los métodos incluyen try-catch y logs descriptivos para debugging.

### Compatibilidad
Mantiene compatibilidad con código existente - los hooks exponen la misma API.

### Real-time Updates
Los listeners siguen funcionando igual, pero ahora están centralizados en el servicio.

## ✅ Estado Final

- ✅ Servicio `CasosService.js` creado
- ✅ `useCasos.js` refactorizado
- ✅ `useEquipoDatos.js` refactorizado
- ✅ `useEstudioDatos.js` refactorizado
- ✅ `useOrganizacionData.js` refactorizado
- ✅ Imports limpiados
- ✅ Funcionalidad preservada
- ⏳ Tests pendientes
- ⏳ Refactorización de componentes restantes pendiente
