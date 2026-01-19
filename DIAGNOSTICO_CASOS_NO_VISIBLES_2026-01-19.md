# DIAGNÓSTICO: CASOS NO VISIBLES - 2026-01-19

## PROBLEMA
Los casos migrados no se muestran como cards en la vista de "Casos Activos".

## PASOS DE DIAGNÓSTICO

### 1. **Verificar en la Consola del Navegador**
1. Abre la aplicación
2. Presiona **F12** para abrir DevTools
3. Ve a la pestaña **Console**
4. Busca estos logs:

```
📡 [CASOS] Solicitando carga de casos para: [ID_ORGANIZACION]
📋 Casos encontrados: [NÚMERO]
🔍 [CASOS DEBUG] Iniciando filtrado de casos...
📊 [CASOS DEBUG] casos.length: [NÚMERO]
📊 [CASOS DEBUG] vistaActiva: activos
📋 [CASOS DEBUG] Filtro activos aplicado: [NÚMERO]
```

### 2. **Ejecutar Script de Diagnóstico**
1. En la consola del navegador, ejecuta:
```javascript
// Cargar el script de diagnóstico
const script = document.createElement('script');
script.src = './debug-casos-migracion.js';
document.head.appendChild(script);
```

2. O copia y pega el contenido del archivo `debug-casos-migracion.js`

### 3. **Verificar Datos en Firebase**
El script mostrará:
- Total de casos en la base de datos
- Casos por organización
- Organización actual
- Estado de archivado de los casos

### 4. **Verificar Filtros Activos**
- **Vista actual**: ¿Estás en "Activos" o "Archivados"?
- **Búsqueda**: ¿Hay algún término de búsqueda activo?
- **Estado de casos**: ¿Los casos están marcados como archivados?

## POSIBLES CAUSAS Y SOLUCIONES

### ❌ **Causa 1: Casos en organización incorrecta**
**Síntoma**: `Casos encontrados: 0` en los logs
**Solución**: 
1. Ir al **Perfil de Usuario** (botón en sidebar)
2. Pestaña **"Diagnóstico"**
3. Migrar casos de otra organización

### ❌ **Causa 2: Casos archivados**
**Síntoma**: `Filtro activos aplicado: 0` pero hay casos en BD
**Solución**:
1. Cambiar a vista **"Archivados"** (botón 📁 en header)
2. O desarchivar los casos necesarios

### ❌ **Causa 3: Filtro de búsqueda activo**
**Síntoma**: Hay casos pero no coinciden con la búsqueda
**Solución**:
1. Limpiar el campo de búsqueda
2. Verificar que no haya espacios extra

### ❌ **Causa 4: Error de carga**
**Síntoma**: Error en los logs de Firebase
**Solución**:
1. Verificar conexión a internet
2. Recargar la página (Ctrl+R)
3. Verificar configuración de Firebase

### ❌ **Causa 5: Problema de renderizado**
**Síntoma**: Casos en memoria pero no se muestran
**Solución**:
1. Forzar re-render (cambiar de vista y volver)
2. Recargar la aplicación

## COMANDOS DE DIAGNÓSTICO RÁPIDO

### En la Consola del Navegador:
```javascript
// Ver casos en memoria
console.log('Casos en memoria:', window.casosDebug);
console.log('Casos filtrados:', window.casosOrdenadosDebug);

// Ver organización actual
console.log('Organización:', JSON.parse(localStorage.getItem('organizacionActual')));

// Forzar recarga
window.location.reload();
```

## VERIFICACIÓN PASO A PASO

### ✅ **Checklist de Verificación:**
- [ ] Firebase está conectado (sin errores en consola)
- [ ] Usuario está autenticado
- [ ] Organización está definida
- [ ] Hay casos en la base de datos
- [ ] Los casos pertenecen a la organización actual
- [ ] Los casos no están archivados (si estás en vista "Activos")
- [ ] No hay filtros de búsqueda activos
- [ ] El componente se está renderizando

### 🔧 **Acciones de Emergencia:**
1. **Recargar página**: Ctrl+R
2. **Limpiar caché**: Ctrl+Shift+R
3. **Cambiar vista**: Activos ↔ Archivados
4. **Verificar perfil**: Botón perfil → Diagnóstico
5. **Migrar casos**: Si están en otra organización

## INFORMACIÓN ADICIONAL

### Logs Importantes a Buscar:
- `📡 [CASOS] Solicitando carga de casos`
- `📋 Casos encontrados:`
- `📊 [CASOS] Filtrado completado:`
- `🎨 [CASOS DEBUG] Renderizando tarjetas`

### Archivos Relacionados:
- `src/components/Casos.js` - Componente principal
- `src/hooks/useCasos.js` - Hook de carga de datos
- `src/services/CasosService.js` - Servicio de Firebase
- `debug-casos-migracion.js` - Script de diagnóstico

### Contacto de Soporte:
Si el problema persiste después de seguir estos pasos, proporciona:
1. Logs de la consola
2. Resultado del script de diagnóstico
3. Capturas de pantalla de la vista actual