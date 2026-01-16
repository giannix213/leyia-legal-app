# Vista Semanal - Calendario Avanzado

## 🎯 Nueva Funcionalidad Implementada

Se ha agregado una vista semanal completa al calendario que permite ver los eventos organizados por horas en una semana específica, proporcionando una perspectiva más detallada y organizada de la agenda.

### 📋 Características Principales

#### **1. 🎛️ Controles de Vista Mejorados**
- **Botones de vista**: MES y SEMANA con estados activos
- **Layout reorganizado**: Navegación, vistas y acciones separadas
- **Estados visuales**: Botón activo con glow y colores distintivos
- **Responsive**: Adaptación automática en dispositivos móviles

#### **2. 📊 Vista Semanal Completa**
- **Grid de 24 horas**: Desde 00:00 hasta 23:00
- **7 días de la semana**: Lunes a Domingo
- **Header informativo**: Día, fecha y contador de eventos
- **Scroll vertical**: Para navegar por las horas del día

#### **3. 🎨 Diseño Futurista Consistente**
- **Grid layout**: Columnas perfectamente alineadas
- **Colores temáticos**: Azul para audiencias, naranja para tareas
- **Efectos hover**: Escalado y glow en eventos
- **Tipografía**: Orbitron para headers, Share Tech Mono para contenido

### 🔧 Estructura de la Vista Semanal

#### **Header de la Semana**
```javascript
<div className="week-header">
  <div className="time-column">Hora</div>
  {dias.map((fecha, index) => (
    <div className={`day-column ${esHoy(fecha) ? 'today' : ''}`}>
      <div className="day-name">Lun</div>
      <div className="day-number">15</div>
      <div className="day-events-count">3 eventos</div>
    </div>
  ))}
</div>
```

#### **Cuerpo con Grid de Horas**
```javascript
<div className="week-body">
  {Array.from({ length: 24 }, (_, hora) => (
    <div className="time-row">
      <div className="time-label">09:00</div>
      {dias.map((fecha, diaIndex) => (
        <div className="time-cell">
          {/* Eventos de esa hora específica */}
        </div>
      ))}
    </div>
  ))}
</div>
```

### 🎯 Funcionalidades de la Vista Semanal

#### **1. 📅 Generación Inteligente de Días**
```javascript
const generarDiasSemana = () => {
  const inicioSemana = new Date(fechaActual);
  const diaActual = inicioSemana.getDay();
  const diasHastaLunes = diaActual === 0 ? 6 : diaActual - 1;
  inicioSemana.setDate(inicioSemana.getDate() - diasHastaLunes);
  
  const diasSemana = [];
  for (let i = 0; i < 7; i++) {
    const dia = new Date(inicioSemana);
    dia.setDate(inicioSemana.getDate() + i);
    diasSemana.push(dia);
  }
  
  return diasSemana;
};
```

#### **2. ⏰ Filtrado de Eventos por Hora**
```javascript
const eventosHora = eventosDelDia.filter(evento => {
  const horaEvento = parseInt(evento.hora?.split(':')[0] || '0');
  return horaEvento === hora;
});
```

#### **3. 📊 Información del Header**
- **Día de la semana**: Formato corto (Lun, Mar, etc.)
- **Número del día**: Destacado con tipografía especial
- **Contador de eventos**: "X eventos" por día
- **Indicador HOY**: Resaltado especial para el día actual

#### **4. 🎨 Eventos en la Vista Semanal**
- **Posicionamiento por hora**: Cada evento aparece en su hora exacta
- **Información completa**: Hora, título, caso
- **Acciones rápidas**: Editar y eliminar al hover
- **Colores diferenciados**: Azul para audiencias, naranja para tareas
- **Bordes de color**: Según tipo y prioridad

### 🎨 Estilos y Diseño

#### **Controles de Vista**
```css
.view-btn {
  background: transparent;
  border: 1px solid rgba(0, 242, 255, 0.5);
  color: var(--text-secondary);
  transition: all 0.3s ease;
}

.view-btn.active {
  background: var(--border-color);
  color: var(--deep-space);
  box-shadow: 0 0 15px rgba(0, 242, 255, 0.5);
}
```

#### **Grid de la Semana**
```css
.week-header {
  display: grid;
  grid-template-columns: 80px repeat(7, 1fr);
  background: rgba(0, 242, 255, 0.1);
}

.time-row {
  display: grid;
  grid-template-columns: 80px repeat(7, 1fr);
  min-height: 60px;
}
```

#### **Eventos Semanales**
```css
.week-event {
  background: rgba(0, 242, 255, 0.1);
  border-left: 4px solid var(--border-color);
  border-radius: 4px;
  padding: 6px 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.week-event:hover {
  transform: scale(1.02);
  box-shadow: 0 0 8px rgba(0, 242, 255, 0.3);
}
```

### 🔄 Navegación Entre Vistas

#### **Cambio de Vista**
```javascript
const handleCambiarVista = useCallback((nuevaVista) => {
  setVistaActual(nuevaVista);
  
  // Si cambiamos a vista semanal, ajustar la fecha a la semana actual
  if (nuevaVista === 'semana') {
    const hoy = new Date();
    setFechaSeleccionada(hoy);
  }
}, [setVistaActual]);
```

#### **Título Dinámico**
```javascript
const obtenerRangoFechas = () => {
  if (vistaActual === 'semana') {
    const diasSemana = generarDiasSemana();
    const inicio = diasSemana[0];
    const fin = diasSemana[6];
    return `${inicio.getDate()} - ${fin.getDate()} ${fin.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;
  } else {
    return `${nombreMes} ${año}`;
  }
};
```

### 🎯 Interacciones en Vista Semanal

#### **1. 📅 Crear Eventos**
- **Clic en celda**: Abre modal de nuevo evento con fecha y hora preseleccionadas
- **Clic derecho**: Menú contextual con opciones
- **Botón + EVENTO**: Crear evento en fecha actual

#### **2. ✏️ Editar Eventos**
- **Botones hover**: Aparecen al pasar mouse sobre evento
- **Clic en evento**: Abre modal de detalles
- **Acciones rápidas**: Editar y eliminar directamente

#### **3. 🔍 Información Visual**
- **Colores por tipo**: Audiencias azules, tareas naranjas
- **Bordes de prioridad**: Para tareas según importancia
- **Indicador HOY**: Columna destacada para día actual
- **Scroll suave**: Navegación por las 24 horas

### 📱 Responsive Design

#### **Desktop (>768px)**
- **Grid completo**: 80px + 7 columnas iguales
- **Hover effects**: Todos los efectos visuales
- **Scroll vertical**: 600px máximo con scrollbar personalizado

#### **Mobile (≤768px)**
- **Grid compacto**: 60px + 7 columnas
- **Botones siempre visibles**: Sin hover, acciones permanentes
- **Controles apilados**: Layout vertical para controles
- **Texto reducido**: Tamaños de fuente optimizados

### 🎨 Efectos Visuales Especiales

#### **1. 🌟 Día Actual**
```css
.day-column.today {
  background: rgba(0, 242, 255, 0.2);
  box-shadow: inset 0 0 10px rgba(0, 242, 255, 0.3);
}

.time-cell.today {
  background: rgba(0, 242, 255, 0.08);
}
```

#### **2. 💫 Eventos Hover**
```css
.week-event:hover {
  background: rgba(0, 242, 255, 0.2);
  transform: scale(1.02);
  box-shadow: 0 0 8px rgba(0, 242, 255, 0.3);
}
```

#### **3. 🎯 Acciones Rápidas**
```css
.event-actions-week {
  opacity: 0;
  transition: opacity 0.2s ease;
  position: absolute;
  top: 2px;
  right: 4px;
}

.week-event:hover .event-actions-week {
  opacity: 1;
}
```

### 🔧 Integración con Funcionalidades Existentes

#### **1. 🎈 DayTooltip**
- **Mantiene funcionalidad**: En vista mensual
- **Información rica**: Estadísticas y detalles por día

#### **2. 🖱️ Menú Contextual**
- **Funciona en ambas vistas**: Clic derecho disponible
- **Acciones consistentes**: Mismo comportamiento

#### **3. ⌨️ Atajos de Teclado**
- **Navegación**: Ctrl+← y Ctrl+→ para cambiar semana
- **Vista**: Mantiene todos los atajos existentes

### ✅ Estado Actual

- ✅ **Vista semanal completa** con grid de 24 horas
- ✅ **Botones de cambio de vista** con estados activos
- ✅ **Eventos posicionados por hora** exacta
- ✅ **Acciones rápidas** en eventos semanales
- ✅ **Responsive design** para todos los dispositivos
- ✅ **Integración completa** con funcionalidades existentes
- ✅ **Navegación fluida** entre vistas
- ✅ **Título dinámico** según vista activa
- ✅ **Colores y efectos** consistentes con el tema

### 🚀 Beneficios de la Vista Semanal

1. **📊 Perspectiva detallada**: Ver eventos por hora específica
2. **🎯 Mejor organización**: Layout tipo agenda profesional
3. **⚡ Acceso rápido**: Crear eventos con hora preseleccionada
4. **👁️ Claridad visual**: Menos saturación que vista mensual
5. **📱 Responsive**: Funciona perfecto en todos los dispositivos
6. **🎨 Consistencia**: Mantiene el diseño futurista
7. **🔄 Flexibilidad**: Cambio fluido entre vistas

La vista semanal transforma el calendario en una herramienta de planificación profesional, ofreciendo una perspectiva detallada y organizada de la agenda semanal mientras mantiene toda la funcionalidad y el diseño futurista del sistema.