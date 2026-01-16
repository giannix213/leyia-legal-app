# 🧹 GUÍA DE LIMPIEZA DE CACHÉ

## 🎯 ¿Cuándo limpiar el caché?

Limpia el caché cuando:
- ❌ Los casos no se muestran después de hacer Ctrl+Shift+R
- ❌ Ves errores extraños en la consola
- ❌ La aplicación se comporta de forma inconsistente
- ❌ Acabas de actualizar el código
- ❌ Tienes errores de compilación raros

## 🚀 OPCIONES DE LIMPIEZA

### Opción 1: Limpieza Rápida (RECOMENDADO) ⚡
**Tiempo:** ~10 segundos  
**Archivo:** `limpiar-cache-rapido.bat`

```bash
limpiar-cache-rapido.bat
```

**Limpia:**
- ✅ Caché de npm
- ✅ Caché de Electron (`%APPDATA%\estudio-juridico`)
- ✅ Archivos compilados (`build`, `.cache`)
- ✅ Caché de React Scripts (`node_modules\.cache`)

**NO toca:**
- ✅ `node_modules` (no necesita reinstalar)
- ✅ Tus datos en Firebase
- ✅ Tu código fuente

### Opción 2: Limpieza Completa 🔥
**Tiempo:** ~5 minutos (reinstala dependencias)  
**Archivo:** `limpiar-todo-cache.bat`

```bash
limpiar-todo-cache.bat
```

**Limpia:**
- ✅ Todo lo de la opción 1
- ✅ `node_modules` completo
- ✅ `dist` (builds de producción)
- ✅ Reinstala todas las dependencias

**Usa esto cuando:**
- Cambiaste versiones de paquetes
- Tienes errores de dependencias
- Quieres empezar completamente fresco

### Opción 3: Inicio con Menú Interactivo 🎮
**Archivo:** `iniciar-electron.bat`

```bash
iniciar-electron.bat
```

Te pregunta qué hacer:
1. Iniciar normalmente
2. Limpiar caché rápido y luego iniciar
3. Limpiar TODO y luego iniciar

## 📋 PASOS RECOMENDADOS

### Para tu problema actual (casos no visibles):

```bash
# 1. Limpieza rápida
limpiar-cache-rapido.bat

# 2. Iniciar la app
iniciar-electron.bat
# (Selecciona opción 1)

# 3. Cuando se abra, presiona:
Ctrl + Shift + R

# 4. Abre DevTools:
F12

# 5. Verifica los logs
```

## 🗂️ ¿QUÉ SE LIMPIA EXACTAMENTE?

### Caché de npm
**Ubicación:** `%LOCALAPPDATA%\npm-cache`
- Paquetes descargados
- Metadatos de npm
- **Tamaño típico:** 500MB - 2GB

### Caché de Electron
**Ubicación:** `%APPDATA%\estudio-juridico`
- Archivos JavaScript compilados
- LocalStorage de la app
- Cookies y sesiones
- **Tamaño típico:** 50MB - 200MB

### Archivos compilados
**Ubicación:** `./build`, `./dist`, `./.cache`
- Código JavaScript transpilado
- Assets optimizados
- Source maps
- **Tamaño típico:** 100MB - 500MB

### Caché de React Scripts
**Ubicación:** `./node_modules/.cache`
- Caché de Babel
- Caché de Webpack
- **Tamaño típico:** 50MB - 200MB

### node_modules (solo limpieza completa)
**Ubicación:** `./node_modules`
- Todas las dependencias instaladas
- **Tamaño típico:** 500MB - 1GB

## ⚠️ ADVERTENCIAS

### ❌ NO se eliminan:
- Tu código fuente (`src/`)
- Tus datos en Firebase
- Archivos de configuración (`.env`, `package.json`)
- Documentación (`.md`)

### ⚠️ SÍ se eliminan:
- Caché temporal
- Archivos compilados (se regeneran)
- LocalStorage de Electron (sesiones, preferencias locales)

### 💾 Datos que se pierden:
Si usas `limpiar-cache-rapido.bat` o `limpiar-todo-cache.bat`:
- ❌ Sesión de login local (tendrás que volver a iniciar sesión)
- ❌ Preferencias guardadas en LocalStorage
- ✅ Tus casos en Firebase (NO se pierden)
- ✅ Tus eventos en Firebase (NO se pierden)

## 🔄 FLUJO COMPLETO RECOMENDADO

```bash
# 1. Cierra Electron si está abierto
# (Cierra la ventana)

# 2. Limpia el caché
limpiar-cache-rapido.bat

# 3. Inicia la app
iniciar-electron.bat

# 4. Espera "Compiled successfully!"

# 5. Cuando se abra Electron:
#    - Presiona: Ctrl + Shift + R (hard reload)
#    - Presiona: F12 (abrir DevTools)
#    - Verifica logs: [CASOS COMPONENT]

# 6. ¡Deberías ver tus 65 casos!
```

## 🐛 TROUBLESHOOTING

### "No se pudo limpiar cache de npm"
```bash
# Ejecuta como administrador
# Click derecho en limpiar-cache-rapido.bat
# > Ejecutar como administrador
```

### "Access denied" al eliminar carpetas
```bash
# Cierra todas las ventanas de:
# - Visual Studio Code
# - Electron
# - Terminales
# Luego vuelve a intentar
```

### Después de limpiar, npm install falla
```bash
# Verifica tu conexión a internet
# Intenta:
npm install --verbose
```

### Los casos siguen sin verse
```bash
# 1. Verifica que limpiaste el caché
# 2. Verifica que hiciste Ctrl+Shift+R en Electron
# 3. Abre F12 y busca errores en la consola
# 4. Ejecuta el script de diagnóstico:
#    (Copia debug-casos-display.js en la consola)
```

## 📊 COMPARACIÓN DE OPCIONES

| Característica | Rápida | Completa | Inicio con Menú |
|---------------|--------|----------|-----------------|
| Tiempo | 10 seg | 5 min | Variable |
| Limpia npm cache | ✅ | ✅ | Opcional |
| Limpia Electron cache | ✅ | ✅ | Opcional |
| Elimina build | ✅ | ✅ | Opcional |
| Elimina node_modules | ❌ | ✅ | Opcional |
| Reinstala dependencias | ❌ | ✅ | Opcional |
| Inicia automáticamente | ❌ | ❌ | ✅ |

## 🎯 RECOMENDACIÓN FINAL

Para tu caso (casos no visibles):

1. **Primera vez:** Usa `limpiar-cache-rapido.bat`
2. **Si no funciona:** Usa `limpiar-todo-cache.bat`
3. **Para el futuro:** Usa `iniciar-electron.bat` con opción 2

## 📝 SCRIPTS DISPONIBLES

```bash
# Limpieza rápida (10 segundos)
limpiar-cache-rapido.bat

# Limpieza completa (5 minutos)
limpiar-todo-cache.bat

# Inicio con opciones
iniciar-electron.bat

# Solo iniciar (sin limpiar)
npm run electron
```

## ✅ CHECKLIST POST-LIMPIEZA

Después de limpiar el caché:

- [ ] Ejecuté el script de limpieza
- [ ] Vi el mensaje "Limpieza completada"
- [ ] Inicié la app con `iniciar-electron.bat`
- [ ] Vi "Compiled successfully!"
- [ ] Presioné `Ctrl + Shift + R` en Electron
- [ ] Abrí DevTools con `F12`
- [ ] Veo los logs `[CASOS COMPONENT]`
- [ ] Veo mis 65 casos en la interfaz

Si todos los checks están ✅, ¡todo está limpio y funcionando!
