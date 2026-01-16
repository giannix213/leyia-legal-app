# MAPEO COMPLETO DE VENTANAS ELECTRON - SISTEMA DE GESTIÓN JURÍDICA

## 📋 ÍNDICE
1. [Arquitectura General](#arquitectura-general)
2. [Ventanas Principales](#ventanas-principales)
3. [Componentes Compartidos](#componentes-compartidos)
4. [Hooks de Datos](#hooks-de-datos)
5. [Flujo de Datos](#flujo-de-datos)
6. [Vista General de Expedientes](#vista-general-de-expedientes)

---

## 🏗️ ARQUITECTURA GENERAL

### Estructura de Ventanas
```
App.js (Ventana Principal)
├── SimpleLogin.js (Autenticación)
├── Casos.js (Gestión de Casos)
├── Equipo.js (Vista de Equipo)
└── EstudioJuridico.js (Dashboard Principal)
```

### Fuente de Datos Central
- **Firestore Collection**: `casos`
- **Filtro Principal**: `organizacionId`
- **Contexto Global**: `OrganizacionContext`

---

## 🪟 VENTANAS PRINCIPALES

### 1. **App.js** - Ventana Raíz
**Ubicación**: `src/App.js`

**Responsabilidades**:
- Gestión de autenticación
- Enrutamiento entre ventanas
- Contexto de organización
- Navegación global

**Hooks Utilizados**:
- `useOrganizacionContext()` - Gestión de organización activa
- `useState()` - Control de vista actual

**Estados**:
```javascript
- vistaActual: 'login' | 'casos' | 'equipo' | 'estudio'
- usuario: objeto de usuario autenticado
- organizacionActual: organización seleccionada
```

---

### 2. **Casos.js** - Gestión de Casos Individuales
**Ubicación**: `src/components/Casos.js`

**Hook Principal**: `useCasos()`
**Fuente de Datos**: Firestore `casos` collection

**Características**:
- ✅ Real-time listeners (onSnapshot)
- ✅ Fallback a carga manual
- ✅ CRUD completo de casos
- ✅ Procesamiento con IA (Leyia)
- ✅ Sistema de alertas

**Datos que Maneja**:
```javascript
{
  casos: [],              // Array de casos
  cargando: boolean,      // Estado de carga
  organizacionActual: {}, // Organización activa
  useRealtime: boolean    // Control real-time
}
```

**Funciones Principales**:
- `cargarCasos()` - Carga manual de casos
- `agregarCaso()` - Crear nuevo caso
- `actualizarCaso()` - Actualizar caso existente
- `eliminarCaso()` - Eliminar caso
- `procesarConLeyia()` - Procesamiento con IA

**Vista General**:
- Muestra `VistaGeneralExpedientes` cuando `mostrarVistaGeneral = true`
- Pasa `casosOrdenados` como prop

---

### 3. **Equipo.js** - Vista de Equipo/Organización
**Ubicación**: `src/components/Equipo.js`

**Hook Principal**: `useEquipoDatos(organizacionId)`
**Fuente de Datos**: Firestore `casos` + `miembros` + `usuarios`

**Características**:
- ✅ Carga manual con getDocs
- ✅ Gestión de miembros del equipo
- ✅ Estadísticas de progreso
- ✅ Información de organización

**Datos que Maneja**:
```javascript
{
  teamMembers: [],        // Miembros del equipo
  expedientes: [],        // Expedientes del equipo
  perfilUsuario: {},      // Perfil del usuario
  organizacionInfo: {},   // Info de la organización
  loading: boolean,
  error: string
}
```

**Funciones Principales**:
- `cargarMiembros()` - Cargar miembros de la organización
- `cargarExpedientes()` - Cargar expedientes del equipo
- `cargarPerfilUsuario()` - Cargar perfil del usuario
- `cargarOrganizacionInfo()` - Cargar info de organización
- `calcularProgreso()` - Calcular progreso de casos
- `formatearUltimaActualizacion()` - Formatear última actualización

**Vista General**:
- Muestra `VistaGeneralExpedientes` en modo fullscreen
- Pasa `expedientesOrdenados` como prop
- Incluye sistema de ordenamiento y notas

---

### 4. **EstudioJuridico.js** - Dashboard Principal
**Ubicación**: `src/components/EstudioJuridico.js`

**Hook Principal**: `useEstudioDatos(organizacionId)`
**Fuente de Datos**: Firestore `casos` + Sistema de caché local

**Características**:
- ✅ Real-time listeners con onSnapshot
- ✅ Sistema de caché local (localStorage)
- ✅ Descarga automática de datos (JSON/CSV)
- ✅ Generación de tareas automáticas
- ✅ Gestión de audiencias y trámites

**Datos que Maneja**:
```javascript
{
  expedientes: [],           // Expedientes del estudio
  tareas: [],                // Tareas generadas
  audienciasSemana: [],      // Audiencias de la semana
  tramitesPendientes: [],    // Trámites pendientes
  diasSemanaActual: [],      // Días de la semana
  loading: boolean,
  error: string
}
```

**Funciones Principales**:
- `cargarDatos()` - Carga principal de datos
- `recargarDesdeRemoto()` - Forzar carga desde Firebase
- `generarTareasDesdeExpedientes()` - Generar tareas automáticas
- `obtenerDiasSemanaActual()` - Obtener días de la semana
- `calcularProgreso()` - Calcular progreso de casos
- `formatearUltimaActualizacion()` - Formatear última actualización

**Sistema de Caché**:
- Hook: `useLocalDataManager(organizacionId)`
- Almacenamiento: localStorage
- Formato: JSON + CSV
- Descarga automática diaria

**Vista General**:
- Muestra `VistaGeneralExpedientes` cuando `vistaActual = 'expedientes'`
- Pasa `expedientesOrdenados` como prop
- Incluye sistema de ordenamiento y notas

---

## 🧩 COMPONENTES COMPARTIDOS

### VistaGeneralExpedientes.js
**Ubicación**: `src/components/VistaGeneralExpedientes.js`

**Descripción**: Componente de visualización categorizada de expedientes con observaciones

**Props Recibidas**:
```javascript
{
  expedientesOrdenados: [],    // Array de expedientes
  textosExpedientes: {},       // Textos/notas adicionales
  handleTextoChange: fn,       // Manejador de cambio de texto
  guardarOrden: fn,            // Guardar orden de expedientes
  setExpedientesOrdenados: fn, // Actualizar orden
  menuContextual: {},          // Estado del menú contextual
  agregarLineaDivisoria: fn,   // Agregar línea divisoria
  eliminarElemento: fn,        // Eliminar elemento
  cerrarMenuContextual: fn,    // Cerrar menú contextual
  onVolver: fn,                // Función para volver
  onRecargar: fn               // Función para recargar
}
```

**Categorización**:
1. **📝 Tareas** - Expedientes con `tipoTarea = 'tarea'` o por defecto
2. **📞 Coordinaciones** - Expedientes con `tipoTarea = 'coordinacion'`
3. **🏃‍♂️ Diligencias** - Expedientes con `tipoTarea = 'diligencia'`

**Criterios de Filtrado**:
- Debe tener `esTarea = true`
- Debe tener `observaciones` no vacías
- Se categoriza según `tipoTarea`

**Renderizado**:
- Layout de 3 columnas (grid)
- Tarjetas con información del expediente
- Badges de prioridad
- Notas adicionales
- Información de estado y tipo

---

## 🔌 HOOKS DE DATOS

### 1. useCasos()
**Ubicación**: `src/hooks/useCasos.js`

**Estrategia**: Real-time listeners + Fallback manual

**Query Firestore**:
```javascript
query(
  collection(db, 'casos'),
  where('organizacionId', '==', organizacionActual.id),
  orderBy('createdAt', 'desc')
)
```

**Listener Real-time**:
```javascript
onSnapshot(q, (snapshot) => {
  // Actualización automática
})
```

**Usado por**: `Casos.js`

---

### 2. useEquipoDatos(organizacionId)
**Ubicación**: `src/hooks/useEquipoDatos.js`

**Estrategia**: Carga manual con getDocs

**Queries Firestore**:
```javascript
// Casos
query(
  collection(db, 'casos'),
  where('organizacionId', '==', orgId)
)

// Miembros
query(
  collection(db, 'miembros'),
  where('organizacionId', '==', orgId),
  orderBy('createdAt', 'desc')
)

// Usuarios
query(
  collection(db, 'usuarios'),
  where('organizacionId', '==', orgId)
)
```

**Usado por**: `Equipo.js`

---

### 3. useEstudioDatos(organizacionId)
**Ubicación**: `src/hooks/useEstudioDatos.js`

**Estrategia**: Real-time listeners + Caché local + Descarga automática

**Query Firestore**:
```javascript
query(
  collection(db, 'casos'),
  where('organizacionId', '==', organizacionId)
)
```

**Sistema de Caché**:
- Hook: `useLocalDataManager(organizacionId)`
- Almacenamiento: localStorage
- Clave: `estudio_datos_${organizacionId}`
- TTL: 24 horas

**Listener Real-time**:
```javascript
onSnapshot(q, async (snapshot) => {
  // Procesar datos
  // Guardar en caché
  // Actualizar estado
})
```

**Descarga Automática**:
- Formato JSON: `expedientes_${orgId}_${fecha}.json`
- Formato CSV: `expedientes_${orgId}_${fecha}.csv`
- Frecuencia: Una vez al día

**Usado por**: `EstudioJuridico.js`

---

## 🔄 FLUJO DE DATOS

### Flujo General
```
Firebase (Firestore)
    ↓
Hook de Datos (useCasos / useEquipoDatos / useEstudioDatos)
    ↓
Componente Ventana (Casos / Equipo / EstudioJuridico)
    ↓
VistaGeneralExpedientes (cuando se activa)
    ↓
Renderizado de Tarjetas Categorizadas
```

### Flujo de Actualización Real-time
```
Usuario modifica dato en Firebase
    ↓
onSnapshot detecta cambio
    ↓
Hook actualiza estado local
    ↓
React re-renderiza componente
    ↓
VistaGeneralExpedientes se actualiza automáticamente
```

### Flujo de Caché (EstudioJuridico)
```
1. Verificar caché local
    ↓
2. Si existe y es fresco → Cargar desde caché
    ↓
3. Si no existe o es viejo → Cargar desde Firebase
    ↓
4. Guardar en caché
    ↓
5. Descargar automáticamente (JSON + CSV)
```

---

## 📊 VISTA GENERAL DE EXPEDIENTES

### Conexión con Ventanas

#### Desde Casos.js
```javascript
<VistaGeneralExpedientes
  expedientesOrdenados={casosOrdenados}
  textosExpedientes={{}}
  onVolver={() => setMostrarVistaGeneral(false)}
  onRecargar={cargarCasos}
/>
```

**Datos**: Casos individuales con real-time

---

#### Desde Equipo.js
```javascript
<VistaGeneralExpedientes
  expedientesOrdenados={expedientesOrdenados}
  textosExpedientes={textosExpedientes}
  handleTextoChange={handleTextoChange}
  guardarOrden={guardarOrden}
  setExpedientesOrdenados={setExpedientesOrdenados}
  menuContextual={menuContextual}
  agregarLineaDivisoria={agregarLineaDivisoria}
  eliminarElemento={eliminarElemento}
  cerrarMenuContextual={cerrarMenuContextual}
  onVolver={() => setMostrarVistaGeneral(false)}
  onRecargar={recargar}
/>
```

**Datos**: Expedientes del equipo con sistema de ordenamiento

---

#### Desde EstudioJuridico.js
```javascript
<VistaGeneralExpedientes
  expedientesOrdenados={expedientesOrdenados}
  textosExpedientes={textosExpedientes}
  handleTextoChange={handleTextoChange}
  guardarOrden={guardarOrden}
  setExpedientesOrdenados={setExpedientesOrdenados}
  menuContextual={menuContextual}
  agregarLineaDivisoria={agregarLineaDivisoria}
  eliminarElemento={eliminarElemento}
  cerrarMenuContextual={cerrarMenuContextual}
  onVolver={() => setVistaActual('dashboard')}
  onRecargar={recargarDesdeRemoto}
/>
```

**Datos**: Expedientes del estudio con caché y descarga automática

---

## 🎯 RESUMEN DE CONEXIONES

| Ventana | Hook | Estrategia | Real-time | Caché | Descarga |
|---------|------|------------|-----------|-------|----------|
| **Casos.js** | `useCasos()` | Listener + Fallback | ✅ | ❌ | ❌ |
| **Equipo.js** | `useEquipoDatos()` | Manual getDocs | ❌ | ❌ | ❌ |
| **EstudioJuridico.js** | `useEstudioDatos()` | Listener + Caché | ✅ | ✅ | ✅ |

---

## 🔑 PUNTOS CLAVE

1. **Todas las ventanas** obtienen datos de la misma colección: `casos`
2. **Filtro común**: `organizacionId` para multi-tenancy
3. **VistaGeneralExpedientes** es agnóstico a la fuente de datos
4. **Real-time** disponible en Casos y EstudioJuridico
5. **Caché local** solo en EstudioJuridico
6. **Descarga automática** solo en EstudioJuridico

---

## 📝 NOTAS TÉCNICAS

### Manejo de Errores
- Todos los hooks tienen fallback a carga manual
- Si falla orderBy, se ordena en memoria
- Si falla query con filtro, se carga todo y filtra localmente

### Optimizaciones
- Real-time listeners se desconectan al desmontar
- Caché reduce llamadas a Firebase
- Descarga automática solo una vez al día
- Ordenamiento en memoria cuando es necesario

### Seguridad
- Todos los queries filtran por `organizacionId`
- Contexto de organización global
- Validación de permisos en cada operación

---

**Última actualización**: 2026-01-14
**Versión**: 1.0.0
