// Script de debug para verificar el renderizado de casos
console.log('🔍 INICIANDO DEBUG DE RENDERIZADO DE CASOS');

// Función para verificar el DOM
function debugCasosRender() {
  console.log('📊 Verificando elementos en el DOM...');
  
  // Verificar si existe el contenedor principal
  const mainframe = document.querySelector('.galactic-mainframe');
  console.log('🏗️ Contenedor principal:', mainframe ? '✅ Encontrado' : '❌ No encontrado');
  
  // Verificar si existe el grid de casos
  const casosGrid = document.querySelector('.casos-grid-card');
  console.log('📋 Grid de casos:', casosGrid ? '✅ Encontrado' : '❌ No encontrado');
  
  if (casosGrid) {
    console.log('📏 Estilos del grid:', window.getComputedStyle(casosGrid).display);
    console.log('🔢 Número de hijos:', casosGrid.children.length);
  }
  
  // Verificar tarjetas individuales
  const tarjetas = document.querySelectorAll('.caso-card-game');
  console.log('🎴 Tarjetas encontradas:', tarjetas.length);
  
  if (tarjetas.length > 0) {
    console.log('🎨 Estilos de la primera tarjeta:');
    const primeraTargeta = tarjetas[0];
    const estilos = window.getComputedStyle(primeraTargeta);
    console.log('  - Display:', estilos.display);
    console.log('  - Position:', estilos.position);
    console.log('  - Width:', estilos.width);
    console.log('  - Height:', estilos.height);
    console.log('  - Background:', estilos.background);
    console.log('  - Contenido HTML:', primeraTargeta.innerHTML.substring(0, 200) + '...');
  }
  
  // Verificar si hay texto plano suelto
  const textNodes = [];
  const walker = document.createTreeWalker(
    document.querySelector('.galactic-mainframe') || document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  let node;
  while (node = walker.nextNode()) {
    if (node.textContent.trim() && node.textContent.includes('-')) {
      textNodes.push(node.textContent.trim());
    }
  }
  
  if (textNodes.length > 0) {
    console.log('📝 Texto plano encontrado (posibles casos sin formato):');
    textNodes.slice(0, 5).forEach((text, index) => {
      console.log(`  ${index + 1}. ${text.substring(0, 100)}...`);
    });
  }
  
  // Verificar archivos CSS cargados
  const cssFiles = Array.from(document.styleSheets).map(sheet => {
    try {
      return sheet.href || 'inline';
    } catch (e) {
      return 'blocked';
    }
  });
  
  console.log('🎨 Archivos CSS cargados:');
  cssFiles.forEach(file => console.log('  -', file));
  
  // Verificar si las clases CSS existen
  const testElement = document.createElement('div');
  testElement.className = 'caso-card-game';
  document.body.appendChild(testElement);
  const hasStyles = window.getComputedStyle(testElement).position !== 'static';
  document.body.removeChild(testElement);
  
  console.log('🎯 Estilos de .caso-card-game:', hasStyles ? '✅ Aplicados' : '❌ No aplicados');
}

// Ejecutar debug cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', debugCasosRender);
} else {
  debugCasosRender();
}

// También ejecutar después de un delay para capturar cambios dinámicos
setTimeout(debugCasosRender, 2000);
setTimeout(debugCasosRender, 5000);

console.log('🔍 Script de debug cargado. Revisa la consola en unos segundos.');