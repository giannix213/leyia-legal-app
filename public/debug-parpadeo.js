// Script de diagnóstico para identificar la causa del parpadeo

console.log('🔍 INICIANDO DIAGNÓSTICO DE PARPADEO');

// 1. Verificar si es React StrictMode
console.log('📊 React StrictMode:', document.querySelector('[data-reactroot]') ? 'Detectado' : 'No detectado');

// 2. Verificar re-renders
let renderCount = 0;
const originalRender = console.log;

// 3. Monitorear cambios en el DOM
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      console.log('🔄 DOM cambió:', {
        target: mutation.target.tagName,
        addedNodes: mutation.addedNodes.length,
        removedNodes: mutation.removedNodes.length,
        timestamp: Date.now()
      });
    }
  });
});

// Observar cambios en el body
observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeOldValue: true
});

// 4. Monitorear repaints
let repaintCount = 0;
const monitorRepaints = () => {
  repaintCount++;
  console.log(`🎨 Repaint #${repaintCount} - ${Date.now()}`);
  requestAnimationFrame(monitorRepaints);
};
requestAnimationFrame(monitorRepaints);

// 5. Verificar CSS animations
const checkAnimations = () => {
  const elements = document.querySelectorAll('*');
  elements.forEach(el => {
    const computedStyle = window.getComputedStyle(el);
    if (computedStyle.animationName !== 'none' || computedStyle.transitionProperty !== 'none') {
      console.log('🎭 Elemento con animación/transición:', {
        element: el.tagName,
        className: el.className,
        animation: computedStyle.animationName,
        transition: computedStyle.transitionProperty
      });
    }
  });
};

// Ejecutar diagnóstico después de 2 segundos
setTimeout(() => {
  console.log('🔍 EJECUTANDO DIAGNÓSTICO COMPLETO...');
  checkAnimations();
  
  // Verificar si hay timers activos
  console.log('⏰ Timers activos:', {
    timeouts: window.setTimeout.toString().includes('[native code]') ? 'Nativos' : 'Modificados',
    intervals: window.setInterval.toString().includes('[native code]') ? 'Nativos' : 'Modificados'
  });
  
  // Verificar memoria
  if (performance.memory) {
    console.log('💾 Memoria:', {
      used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
      total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB',
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
    });
  }
  
  console.log('✅ DIAGNÓSTICO COMPLETADO');
}, 2000);

// 6. Detectar si estamos en Electron
if (window.process && window.process.versions && window.process.versions.electron) {
  console.log('🖥️ Electron detectado:', window.process.versions.electron);
  
  // Verificar configuración de Electron
  if (window.require) {
    try {
      const { remote } = window.require('electron');
      console.log('⚙️ Configuración Electron disponible');
    } catch (e) {
      console.log('⚠️ No se puede acceder a configuración Electron:', e.message);
    }
  }
}

console.log('🔍 DIAGNÓSTICO INICIADO - Revisa la consola en los próximos segundos');