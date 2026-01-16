# 🚀 CÓMO INICIAR LA APLICACIÓN

## ⚡ INICIO RÁPIDO (RECOMENDADO)

```bash
INICIAR-LIMPIO.bat
```

Este script hace TODO automáticamente:
- ✅ Limpia todos los cachés
- ✅ Configura 4GB de memoria
- ✅ Inicia React + Electron
- ✅ Muestra instrucciones claras

**Usa este si:** Es la primera vez o tienes problemas.

---

## 📋 OTROS SCRIPTS DISPONIBLES

### 1. Inicio Normal
```bash
iniciar-electron.bat
```
Te da opciones:
1. Iniciar normalmente
2. Limpiar caché rápido y luego iniciar
3. Limpiar TODO y luego iniciar

### 2. Solo Limpiar Caché (Rápido)
```bash
limpiar-cache-rapido.bat
```
Limpia caché sin reinstalar dependencias (~10 segundos)

### 3. Limpiar TODO
```bash
limpiar-todo-cache.bat
```
Limpia caché + reinstala dependencias (~5 minutos)

### 4. Inicio Directo (Sin limpiar)
```bash
npm run electron
```
Solo si ya limpiaste el caché antes.

---

## 🎯 PARA TU PROBLEMA ACTUAL

### Casos no visibles (65 casos en BD pero no se ven):

```bash
# Paso 1: Usa el script todo-en-uno
INICIAR-LIMPIO.bat

# Paso 2: Espera "Compiled successfully!"

# Paso 3: Cuando se abra Electron:
Ctrl + Shift + R    (hard reload)
F12                 (abrir DevTools)

# Paso 4: Verifica los logs
Busca: [CASOS COMPONENT]

# ¡Deberías ver tus 65 casos!
```

---

## 🎮 ATAJOS DE TECLADO EN ELECTRON

Una vez que la app esté corriendo:

| Atajo | Acción |
|-------|--------|
| **F12** | Abrir/Cerrar DevTools |
| **Ctrl + Shift + I** | Abrir/Cerrar DevTools |
| **F5** | Reload normal |
| **Ctrl + Shift + R** | 🔥 Hard reload (limpia caché) |

---

## 🔍 VERIFICACIÓN

### En la terminal deberías ver:
```
Compiled successfully!

You can now view estudio-juridico in the browser.

  Local:            http://localhost:3000
```

### En DevTools (F12) deberías ver:
```
🎬 [CASOS COMPONENT] Renderizando componente Casos
🔗 [CASOS COMPONENT] Hook useCasos: {casosLength: 65, cargando: false}
🔄 [CASOS COMPONENT] Casos recibidos: 65
📊 [CASOS COMPONENT] Casos FINALES después de filtros: 65
```

### En la interfaz deberías ver:
- ✅ 65 tarjetas de casos
- ✅ Cada tarjeta con: número, cliente, tipo, estado
- ✅ Puedes hacer clic para ver detalles

---

## 🚨 SI ALGO FALLA

### Error de memoria:
```
FATAL ERROR: JavaScript heap out of memory
```
**Solución:** Los scripts ya configuran 4GB. Si persiste, cierra otras aplicaciones.

### Casos no se ven:
1. Presiona `Ctrl + Shift + R` en Electron
2. Abre `F12` y busca errores
3. Ejecuta `debug-casos-display.js` en la consola
4. Verifica el panel de diagnóstico azul

### Puerto ocupado:
```
Something is already running on port 3000
```
**Solución:**
```bash
# Mata el proceso en el puerto 3000
npx kill-port 3000
```

---

## 📚 DOCUMENTACIÓN COMPLETA

- **`GUIA_LIMPIEZA_CACHE.md`** - Detalles sobre limpieza de caché
- **`SOLUCION_MEMORIA_ELECTRON.md`** - Solución al error de memoria
- **`INSTRUCCIONES_RAPIDAS_CASOS.md`** - Guía rápida para ver casos
- **`SOLUCION_CASOS_NO_VISIBLES_2026-01-15.md`** - Solución completa

---

## ✅ RESUMEN

**Para iniciar la app limpia y sin problemas:**

```bash
INICIAR-LIMPIO.bat
```

**Luego en Electron:**
1. `Ctrl + Shift + R` (hard reload)
2. `F12` (DevTools)
3. ¡Disfruta tus 65 casos!

---

**¿Dudas?** Revisa `GUIA_LIMPIEZA_CACHE.md` para más detalles.
