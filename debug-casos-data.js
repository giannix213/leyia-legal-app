// Script para debuggear los datos de casos
console.log('🔍 DEBUGGING DATOS DE CASOS');

// Función para verificar el estado de React
function debugReactState() {
  console.log('📊 Verificando estado de React...');
  
  // Buscar el contenedor de React
  const reactRoot = document.querySelector('#root');
  if (!reactRoot) {
    console.log('❌ No se encontró el contenedor #root');
    return;
  }
  
  console.log('✅ Contenedor React encontrado');
  
  // Verificar si hay componentes renderizados
  const mainframe = document.querySelector('.galactic-mainframe');
  console.log('🏗️ Mainframe:', mainframe ? '✅ Encontrado' : '❌ No encontrado');
  
  if (mainframe) {
    console.log('📏 Contenido del mainframe:', mainframe.innerHTML.length, 'caracteres');
    
    // Verificar si hay texto plano (casos sin formato)
    const textContent = mainframe.textContent;
    if (textContent.includes('-2024-') || textContent.includes('-2025-')) {
      console.log('⚠️ ENCONTRADO: Texto de casos sin formato');
      console.log('📝 Muestra:', textContent.substring(0, 200) + '...');
    }
  }
  
  // Verificar grid de casos
  const casosGrid = document.querySelector('.casos-grid-card');
  console.log('📋 Grid de casos:', casosGrid ? '✅ Encontrado' : '❌ No encontrado');
  
  if (casosGrid) {
    console.log('🔢 Hijos del grid:', casosGrid.children.length);
    console.log('📐 Display del grid:', window.getComputedStyle(casosGrid).display);
  }
  
  // Verificar tarjetas
  const tarjetas = document.querySelectorAll('.caso-card-game');
  console.log('🎴 Tarjetas encontradas:', tarjetas.length);
  
  // Verificar errores de React en consola
  const errors = [];
  const originalError = console.error;
  console.error = function(...args) {
    errors.push(args.join(' '));
    originalError.apply(console, args);
  };
  
  setTimeout(() => {
    console.error = originalError;
    if (errors.length > 0) {
      console.log('❌ Errores de React encontrados:');
      errors.forEach(error => console.log('  -', error));
    } else {
      console.log('✅ No hay errores de React');
    }
  }, 1000);
}

// Ejecutar debug
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', debugReactState);
} else {
  debugReactState();
}

// También ejecutar después de delays
setTimeout(debugReactState, 2000);
setTimeout(debugReactState, 5000);

console.log('🔍 Debug de datos iniciado');