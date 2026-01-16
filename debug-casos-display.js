// Script de diagnóstico para verificar por qué no se muestran los casos
// Ejecutar en la consola del navegador

console.log('🔍 DIAGNÓSTICO DE CASOS - Iniciando...');
console.log('='.repeat(60));

// 1. Verificar si React está disponible
console.log('\n1️⃣ Verificando React...');
if (typeof React !== 'undefined') {
  console.log('✅ React está disponible');
} else {
  console.log('❌ React NO está disponible');
}

// 2. Verificar el estado de la aplicación
console.log('\n2️⃣ Verificando estado de la aplicación...');
try {
  // Buscar el contenedor de casos
  const casosContainer = document.querySelector('.casos-container-modern');
  const casosGrid = document.querySelector('.casos-grid-card');
  const emptyState = document.querySelector('.empty-state');
  const loadingState = document.querySelector('.loading-state');
  
  console.log('📦 Contenedor de casos:', casosContainer ? '✅ Encontrado' : '❌ No encontrado');
  console.log('📋 Grid de casos:', casosGrid ? '✅ Encontrado' : '❌ No encontrado');
  console.log('📭 Estado vacío:', emptyState ? '✅ Visible' : '❌ No visible');
  console.log('⏳ Estado de carga:', loadingState ? '✅ Visible' : '❌ No visible');
  
  // 3. Contar tarjetas de casos
  const casoCards = document.querySelectorAll('.caso-card-game');
  console.log(`\n3️⃣ Tarjetas de casos encontradas: ${casoCards.length}`);
  
  if (casoCards.length > 0) {
    console.log('✅ Se están renderizando casos en el DOM');
    console.log('📋 Primeras 3 tarjetas:');
    Array.from(casoCards).slice(0, 3).forEach((card, i) => {
      const numero = card.querySelector('.numero-text')?.textContent;
      const cliente = card.querySelector('.cliente-text')?.textContent;
      console.log(`  ${i + 1}. ${numero} - ${cliente}`);
    });
  } else {
    console.log('❌ No se están renderizando casos en el DOM');
  }
  
  // 4. Verificar el texto del estado vacío
  if (emptyState) {
    console.log('\n4️⃣ Mensaje de estado vacío:');
    console.log(emptyState.textContent.trim());
  }
  
} catch (error) {
  console.error('❌ Error durante el diagnóstico:', error);
}

// 5. Verificar localStorage
console.log('\n5️⃣ Verificando localStorage...');
try {
  const keys = Object.keys(localStorage).filter(k => 
    k.includes('caso') || k.includes('expediente') || k.includes('organizacion')
  );
  console.log(`📦 Claves relacionadas en localStorage: ${keys.length}`);
  keys.forEach(key => {
    const value = localStorage.getItem(key);
    console.log(`  - ${key}: ${value ? value.substring(0, 50) + '...' : 'vacío'}`);
  });
} catch (error) {
  console.error('❌ Error accediendo a localStorage:', error);
}

// 6. Instrucciones
console.log('\n' + '='.repeat(60));
console.log('📋 INSTRUCCIONES:');
console.log('1. Si ves "Estado vacío: ✅ Visible", el componente cree que no hay casos');
console.log('2. Si ves "Tarjetas de casos: 0", los casos no se están renderizando');
console.log('3. Intenta hacer un HARD REFRESH: Ctrl+Shift+R o Ctrl+F5');
console.log('4. Si el problema persiste, limpia el caché del navegador');
console.log('='.repeat(60));
