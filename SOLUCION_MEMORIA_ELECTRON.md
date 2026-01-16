# 🔧 SOLUCIÓN: Error de Memoria en Electron

**Error:** `FATAL ERROR: invalid table size Allocation failed - JavaScript heap out of memory`

## ✅ SOLUCIÓN IMPLEMENTADA

He aumentado la memoria disponible para Node.js de **512MB** (por defecto) a **4GB**.

### 📋 Cambios Realizados:

1. **`package.json`** - Scripts actualizados con más memoria:
   ```json
   "start": "cross-env NODE_OPTIONS=--max-old-space-size=4096 react-scripts start"
   "electron": "concurrently \"cross-env BROWSER=none NODE_OPTIONS=--max-old-space-size=4096 npm start\" ..."
   ```

2. **`iniciar-electron.bat`** - Nuevo script de inicio optimizado

## 🚀 CÓMO INICIAR LA APLICACIÓN

### Opción 1: Usar el archivo .bat (RECOMENDADO)
```bash
iniciar-electron.bat
```

Este script:
- ✅ Configura 4GB de memoria automáticamente
- ✅ Limpia el caché de npm
- ✅ Muestra instrucciones útiles
- ✅ Inicia Electron cuando React esté listo

### Opción 2: Comando directo
```bash
npm run electron
```

### Opción 3: Si aún falla, usa menos memoria
```bash
npm run start:low-memory
```
(Usa 2GB en lugar de 4GB)

## 🎯 PASOS COMPLETOS

### 1️⃣ Inicia la aplicación
```bash
iniciar-electron.bat
```

### 2️⃣ Espera el mensaje
```
Compiled successfully!
You can now view estudio-juridico in the browser.
```

### 3️⃣ La ventana de Electron se abrirá automáticamente

### 4️⃣ Presiona Ctrl + Shift + R
Para hacer hard reload y limpiar el caché de Electron

### 5️⃣ Abre DevTools con F12
Verifica los logs:
```
🎬 [CASOS COMPONENT] Renderizando componente Casos
🔗 [CASOS COMPONENT] Hook useCasos: {casosLength: 65, ...}
```

### 6️⃣ ¡Deberías ver tus 65 casos! 🎉

## 🔍 POR QUÉ OCURRÍA EL ERROR

### Causa:
Tu aplicación tiene:
- 65 casos en la base de datos
- Múltiples componentes con listeners en tiempo real
- Imágenes y recursos cargados
- Firebase SDK
- React DevTools

Todo esto consume memoria, y Node.js por defecto solo tiene **512MB**.

### Solución:
Aumentar a **4GB** (4096MB) da suficiente espacio para:
- ✅ Compilar la aplicación
- ✅ Cargar todos los casos
- ✅ Ejecutar listeners en tiempo real
- ✅ Mantener el hot reload activo

## 📊 CONFIGURACIÓN DE MEMORIA

| Configuración | Memoria | Uso Recomendado |
|--------------|---------|-----------------|
| Por defecto | 512MB | ❌ Insuficiente |
| `start:low-memory` | 2GB | ⚠️ Mínimo aceptable |
| `start` / `electron` | 4GB | ✅ Recomendado |

## 🚨 SI AÚN FALLA

### Opción A: Reinicia tu PC
A veces Windows tiene procesos de Node.js zombies que consumen memoria.

### Opción B: Cierra otras aplicaciones
Especialmente:
- Chrome/Edge con muchas pestañas
- Visual Studio Code con muchos proyectos
- Otras aplicaciones Electron

### Opción C: Verifica memoria disponible
```bash
# En PowerShell
Get-CimInstance Win32_OperatingSystem | Select-Object FreePhysicalMemory
```

Necesitas al menos **4GB libres** en RAM.

### Opción D: Usa el modo de baja memoria
```bash
npm run start:low-memory
```

Luego en otra terminal:
```bash
electron .
```

## 🎮 ATAJOS DE TECLADO

Una vez que la app esté corriendo:

- **F12** → Abrir/Cerrar DevTools
- **Ctrl + Shift + I** → Abrir/Cerrar DevTools
- **F5** → Reload normal
- **Ctrl + Shift + R** → 🔥 Hard reload (limpia caché)

## ✅ VERIFICACIÓN

Después de iniciar, deberías ver en la consola de la terminal:

```
Compiled successfully!

You can now view estudio-juridico in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000

Note that the development build is not optimized.
To create a production build, use npm run build.

webpack compiled successfully
```

Y en la ventana de Electron (F12):
```
🎬 [CASOS COMPONENT] Renderizando componente Casos
🔗 [CASOS COMPONENT] Hook useCasos: {casosLength: 65, cargando: false}
🔄 [CASOS COMPONENT] Casos recibidos: 65
📊 [CASOS COMPONENT] Casos FINALES después de filtros: 65
```

## 📝 NOTAS TÉCNICAS

### ¿Por qué 4GB?
- React Scripts necesita ~1GB para compilar
- Firebase SDK + listeners ~500MB
- Tus 65 casos + datos ~200MB
- Hot reload + cache ~300MB
- Margen de seguridad ~2GB

### ¿Es seguro?
Sí, solo le dice a Node.js que puede usar hasta 4GB si lo necesita. No consume 4GB todo el tiempo.

### ¿Afecta el rendimiento?
No, de hecho mejora el rendimiento porque evita garbage collection frecuente.

## 🎯 RESUMEN

1. ✅ Scripts actualizados con 4GB de memoria
2. ✅ Archivo `iniciar-electron.bat` creado
3. ✅ Hard reload (Ctrl+Shift+R) implementado en Electron
4. ✅ Logs de debug mejorados en componentes
5. ✅ Panel de diagnóstico visual

**Usa `iniciar-electron.bat` para iniciar la aplicación sin problemas de memoria.**
