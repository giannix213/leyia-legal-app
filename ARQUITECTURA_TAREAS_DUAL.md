# 📐 ARQUITECTURA DUAL: TAREAS EN FIRESTORE

## 🎯 PROBLEMA IDENTIFICADO

Tienes razón en tu análisis: el hook actual solo consulta la colección `casos` y no trae subcolecciones automáticamente. Esto limita la funcionalidad a **1 tarea por caso**.

---

## 📊 ESTRUCTURA ACTUAL vs PROPUESTA

### **Opción A: Campo en Documento (Actual)**

```
casos/
  └── caso123/
      ├── numero: "EXP-001-2024"
      ├── cliente: "Juan Pérez"
      ├── observaciones: "Revisar documentos"
      ├── esTarea: true              ← Campo booleano
      ├── tipoTarea: "tarea"         ← Campo string
      └── fechaMarcadoTarea: "2024-01-13"
```

**Uso Actual:**
```javascript
// En ExpedienteModal.js
const marcarComoTarea = async (tipoTarea) => {
  await actualizarCaso(expediente.id, {
    esTarea: true,
    tipoTarea: tipoTarea,
    observaciones: "Revisar documentos"
  });
};
```

**Ventajas:**
- ✅ Simple y directo
- ✅ Una consulta trae todo
- ✅ Perfecto para casos simples

**Limitaciones:**
- ❌ Solo 1 tarea/observación por caso
- ❌ No hay historial
- ❌ No se puede marcar múltiples tareas

---

### **Opción B: Subcolección (Propuesta)**

```
casos/
  └── caso123/
      ├── numero: "EXP-001-2024"
      ├── cliente: "Juan Pérez"
      └── tareas/ (subcolección)
          ├── tarea1/
          │   ├── descripcion: "Revisar documentos"
          │   ├── tipo: "tarea"
          │   ├── prioridad: "alta"
          │   ├── completada: false
          │   └── createdAt: timestamp
          ├── tarea2/
          │   ├── descripcion: "Llamar cliente"
          │   ├── tipo: "coordinacion"
          │   ├── completada: true
          │   └── createdAt: timestamp
          └── tarea3/
              ├── descripcion: "Presentar escrito"
              ├── tipo: "diligencia"
              ├── completada: false
              └── createdAt: timestamp
```

**Uso con Nuevo Hook:**
```javascript
// En componente
const { tareas, agregarTarea, toggleCompletada } = useTareas(casoId);

// Agregar tarea
await agregarTarea({
  descripcion: "Revisar documentos",
  tipo: "tarea",
  prioridad: "alta"
});

// Marcar como completada
await toggleCompletada(tareaId, true);
```

**Ventajas:**
- ✅ Múltiples tareas por caso
- ✅ Historial completo
- ✅ Cada tarea es independiente
- ✅ Más escalable

**Limitaciones:**
- ❌ Requiere consultas adicionales
- ❌ Más complejo de implementar

---

## 🔧 SOLUCIÓN IMPLEMENTADA: SISTEMA DUAL

He creado `src/hooks/useTareas.js` que soporta **subcolecciones** para casos que necesiten múltiples tareas.

### **Hook 1: useTareas (Para un caso específico)**

```javascript
import { useTareas } from '../hooks/useTareas';

function ExpedienteDetalle({ casoId }) {
  const { 
    tareas, 
    cargando,
    agregarTarea,
    actualizarTarea,
    eliminarTarea,
    toggleCompletada,
    getTareasPorTipo,
    tareasPendientes,
    tareasCompletadas
  } = useTareas(casoId);

  // Agregar nueva tarea
  const handleAgregarTarea = async () => {
    await agregarTarea({
      descripcion: "Nueva tarea",
      tipo: "tarea", // 'tarea', 'coordinacion', 'diligencia'
      prioridad: "alta",
      fechaLimite: "2024-01-20"
    });
  };

  // Marcar como completada
  const handleToggle = async (tareaId, completada) => {
    await toggleCompletada(tareaId, !completada);
  };

  return (
    <div>
      <h3>Tareas del Caso ({tareasPendientes} pendientes)</h3>
      
      {tareas.map(tarea => (
        <div key={tarea.id}>
          <input 
            type="checkbox" 
            checked={tarea.completada}
            onChange={() => handleToggle(tarea.id, tarea.completada)}
          />
          <span>{tarea.descripcion}</span>
          <span>{tarea.tipo}</span>
        </div>
      ))}
      
      <button onClick={handleAgregarTarea}>
        Agregar Tarea
      </button>
    </div>
  );
}
```

### **Hook 2: useTareasOrganizacion (Para Vista General)**

```javascript
import { useTareasOrganizacion } from '../hooks/useTareas';

function VistaGeneralTareas({ organizacionId }) {
  const { 
    todasLasTareas,
    tareasPorCaso,
    cargando,
    getTareasPorTipo,
    tareasPendientes
  } = useTareasOrganizacion(organizacionId);

  const tareasTipo = getTareasPorTipo('tarea');
  const coordinaciones = getTareasPorTipo('coordinacion');
  const diligencias = getTareasPorTipo('diligencia');

  return (
    <div className="vista-general-tareas">
      <div className="columna-tareas">
        <h3>Tareas ({tareasTipo.length})</h3>
        {tareasTipo.map(tarea => (
          <div key={tarea.id}>
            <strong>{tarea.casoNumero}</strong>
            <p>{tarea.descripcion}</p>
            <small>{tarea.casoCliente}</small>
          </div>
        ))}
      </div>
      
      <div className="columna-coordinaciones">
        <h3>Coordinaciones ({coordinaciones.length})</h3>
        {coordinaciones.map(tarea => (
          <div key={tarea.id}>
            <strong>{tarea.casoNumero}</strong>
            <p>{tarea.descripcion}</p>
          </div>
        ))}
      </div>
      
      <div className="columna-diligencias">
        <h3>Diligencias ({diligencias.length})</h3>
        {diligencias.map(tarea => (
          <div key={tarea.id}>
            <strong>{tarea.casoNumero}</strong>
            <p>{tarea.descripcion}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🔄 MIGRACIÓN: De Campo a Subcolección

Si decides migrar de la estructura actual (campo) a subcolecciones, aquí está el script:

```javascript
// scripts/migrarTareasASubcoleccion.js
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';

async function migrarTareas() {
  console.log('🔄 Iniciando migración de tareas...');
  
  // Obtener todos los casos
  const casosSnapshot = await getDocs(collection(db, 'casos'));
  
  let migrados = 0;
  
  for (const casoDoc of casosSnapshot.docs) {
    const caso = casoDoc.data();
    
    // Si el caso tiene una tarea marcada
    if (caso.esTarea && caso.observaciones) {
      console.log('📝 Migrando tarea del caso:', caso.numero);
      
      // Crear tarea en subcolección
      await addDoc(collection(db, 'casos', casoDoc.id, 'tareas'), {
        descripcion: caso.observaciones,
        tipo: caso.tipoTarea || 'tarea',
        prioridad: caso.prioridad || 'media',
        completada: false,
        createdAt: caso.fechaMarcadoTarea || new Date(),
        migradoDe: 'campo'
      });
      
      // Opcional: Limpiar campos antiguos
      await updateDoc(doc(db, 'casos', casoDoc.id), {
        esTarea: null,
        tipoTarea: null,
        fechaMarcadoTarea: null
      });
      
      migrados++;
    }
  }
  
  console.log(`✅ Migración completada: ${migrados} tareas migradas`);
}

// Ejecutar
migrarTareas();
```

---

## 🎨 COMPARACIÓN DE CONSULTAS

### **Estructura Actual (Campo)**

```javascript
// Una consulta trae TODO
const q = query(
  collection(db, 'casos'),
  where('organizacionId', '==', orgId)
);

const snapshot = await getDocs(q);
const casos = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data(),
  esTarea: doc.data().esTarea,      // ← Viene en el documento
  tipoTarea: doc.data().tipoTarea   // ← Viene en el documento
}));
```

### **Estructura con Subcolección**

```javascript
// Consulta 1: Obtener casos
const casosSnapshot = await getDocs(
  query(collection(db, 'casos'), where('organizacionId', '==', orgId))
);

// Consulta 2: Para cada caso, obtener tareas
for (const casoDoc of casosSnapshot.docs) {
  const tareasSnapshot = await getDocs(
    collection(db, 'casos', casoDoc.id, 'tareas')
  );
  
  const tareas = tareasSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}
```

---

## 🚀 RECOMENDACIÓN

### **Mantener Estructura Actual SI:**
- ✅ Solo necesitas 1 tarea/observación por caso
- ✅ La observación principal es suficiente
- ✅ Quieres simplicidad

### **Migrar a Subcolecciones SI:**
- ✅ Necesitas múltiples tareas por caso
- ✅ Quieres historial de tareas
- ✅ Necesitas marcar/desmarcar tareas individualmente
- ✅ Quieres asignar tareas a diferentes personas
- ✅ Necesitas fechas límite por tarea

---

## 📦 ARCHIVOS CREADOS

1. **`src/hooks/useTareas.js`**
   - Hook `useTareas(casoId)` - Para un caso específico
   - Hook `useTareasOrganizacion(orgId)` - Para toda la organización
   - Soporte para real-time listeners
   - CRUD completo de tareas

---

## 🎯 PRÓXIMOS PASOS

### **Opción 1: Mantener Estructura Actual**
- ✅ Ya está funcionando
- ✅ No requiere cambios
- ✅ Usar `useCasos` como está

### **Opción 2: Adoptar Subcolecciones**
1. Decidir si migrar datos existentes
2. Actualizar `ExpedienteModal` para usar `useTareas`
3. Actualizar `VistaGeneralExpedientes` para usar `useTareasOrganizacion`
4. Ejecutar script de migración (opcional)
5. Probar funcionalidad

### **Opción 3: Sistema Híbrido (Recomendado)**
- Mantener campo `esTarea` para compatibilidad
- Agregar subcolección `tareas` para casos complejos
- Componentes detectan automáticamente qué estructura usar

```javascript
// Detección automática
const { tareas: tareasSubcoleccion } = useTareas(casoId);
const tieneSubcoleccion = tareasSubcoleccion.length > 0;

if (tieneSubcoleccion) {
  // Usar tareas de subcolección
  return <TareasMultiples tareas={tareasSubcoleccion} />;
} else if (caso.esTarea) {
  // Usar tarea del campo
  return <TareaSimple observacion={caso.observaciones} tipo={caso.tipoTarea} />;
}
```

---

## ✅ CONCLUSIÓN

Has identificado correctamente una limitación arquitectural. He creado `useTareas.js` que implementa la solución con subcolecciones, dándote la flexibilidad de:

1. **Mantener** la estructura actual (simple, 1 tarea por caso)
2. **Migrar** a subcolecciones (complejo, múltiples tareas)
3. **Usar ambas** (híbrido, mejor de ambos mundos)

La decisión depende de tus necesidades:
- **Simple:** Mantén estructura actual
- **Escalable:** Migra a subcolecciones
- **Flexible:** Usa sistema híbrido

**Estado:** ✅ IMPLEMENTADO - Listo para usar
**Fecha:** 2026-01-13
