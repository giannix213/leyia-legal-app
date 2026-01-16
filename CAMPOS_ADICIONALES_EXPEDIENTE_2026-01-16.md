# Campos Adicionales en ExpedienteForm
**Fecha**: 2026-01-16

## Cambios Realizados

Se agregaron 4 nuevos campos al formulario de expedientes (`ExpedienteForm.js`):

### 1. **Inicio del Proceso** (inicioProceso)
- Tipo: `date`
- Campo opcional
- Permite registrar la fecha de inicio del proceso judicial

### 2. **Distrito Judicial** (distritoJudicial)
- Tipo: `text`
- Campo opcional
- Ejemplos: Lima, Arequipa, Cusco, etc.

### 3. **Demandante** (demandante)
- Tipo: `text`
- Campo opcional
- Diferenciado del campo "Cliente"
- Permite especificar el demandante cuando es diferente del cliente

### 4. **Demandado** (demandado)
- Tipo: `text`
- Campo opcional
- Ya existía en el sistema pero ahora está visible en el formulario

## Estructura del Formulario

El orden de los campos ahora es:

1. Número de Expediente *
2. Cliente *
3. Demandante
4. Demandado
5. Inicio del Proceso
6. Distrito Judicial
7. Tipo de Caso *
8. Estado Procesal * (vinculado al tipo)
9. Descripción del Caso
10. Observaciones

## Integración con el Sistema

- **CasosService**: Ya maneja todos los campos dinámicamente, no requiere cambios
- **Casos.js**: Ya muestra demandante y demandado en las tarjetas
- **Firebase**: Los campos se guardan automáticamente en la colección `casos`

## Notas Técnicas

- Los campos se agregaron al estado `formData` del componente
- Se actualizó el `useEffect` para cargar los valores al editar
- Se actualizó la función de limpieza del formulario
- No se requieren cambios en el backend (Firebase)
- Los campos son opcionales, no afectan la validación existente
