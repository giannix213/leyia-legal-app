/**
 * Script de prueba rápida para verificar el estado de la organización
 * Ejecutar con: node test-organizacion-debug.js
 */

console.log('🔍 VERIFICACIÓN RÁPIDA DE ORGANIZACIÓN');

// Simular localStorage (Node.js no tiene localStorage)
const mockLocalStorage = {
  getItem: (key) => {
    // Simular datos típicos
    if (key === 'organizacionActual') {
      return JSON.stringify({
        id: 'org-12345',
        nombre: 'Estudio Jurídico Test',
        tipo: 'estudio_juridico'
      });
    }
    if (key === 'usuarioActual') {
      return JSON.stringify({
        uid: 'user-67890',
        email: 'test@ejemplo.com',
        displayName: 'Usuario Test'
      });
    }
    return null;
  }
};

console.log('\n📂 SIMULACIÓN DE LOCALSTORAGE:');
console.log('organizacionActual:', mockLocalStorage.getItem('organizacionActual'));
console.log('usuarioActual:', mockLocalStorage.getItem('usuarioActual'));

// Simular normalización
function normalizarOrganizacion(orgData) {
  if (!orgData) return null;
  
  console.log('🔄 Normalizando organización:', orgData);
  
  if (orgData.id && orgData.nombre && orgData.tipo && !orgData.organizationId) {
    console.log('✅ Organización ya normalizada');
    return orgData;
  }
  
  if (orgData.organizationId || orgData.organizationName || orgData.organizationType || 
      orgData.id || orgData.name || orgData.nombre) {
    
    const normalizada = {
      id: orgData.organizationId || orgData.id || 'default-org',
      nombre: orgData.organizationName || orgData.name || orgData.nombre || 'Organización',
      tipo: orgData.organizationType || orgData.type || orgData.tipo || 'estudio_juridico'
    };
    
    console.log('🔄 Organización normalizada:', normalizada);
    return normalizada;
  }
  
  console.warn('⚠️ Formato de organización no reconocido');
  return {
    id: 'unknown-org',
    nombre: 'Organización Desconocida',
    tipo: 'estudio_juridico'
  };
}

// Probar normalización
const orgData = JSON.parse(mockLocalStorage.getItem('organizacionActual'));
const orgNormalizada = normalizarOrganizacion(orgData);

console.log('\n🏢 RESULTADO DE NORMALIZACIÓN:');
console.log('Original:', orgData);
console.log('Normalizada:', orgNormalizada);
console.log('ID extraído:', orgNormalizada?.id);

// Simular query de Firebase
console.log('\n🔥 SIMULACIÓN DE QUERY FIREBASE:');
console.log(`Query: collection('casos').where('organizacionId', '==', '${orgNormalizada?.id}')`);

// Casos de prueba
const casosPrueba = [
  {
    id: 'caso-1',
    numero: '00123-2024',
    cliente: 'Juan Pérez',
    organizacionId: 'org-12345'
  },
  {
    id: 'caso-2',
    numero: '00124-2024',
    cliente: 'María García',
    organizacionId: 'org-12345'
  },
  {
    id: 'caso-3',
    numero: '00125-2024',
    cliente: 'Carlos López',
    // Sin organizacionId
  },
  {
    id: 'caso-4',
    numero: '00126-2024',
    cliente: 'Ana Martín',
    organizacionId: 'otra-org'
  }
];

// Filtrar casos
const casosConOrganizacion = casosPrueba.filter(caso => 
  caso.organizacionId === orgNormalizada?.id
);

const casosSinOrganizacion = casosPrueba.filter(caso => 
  !caso.organizacionId
);

const casosConOtraOrganizacion = casosPrueba.filter(caso => 
  caso.organizacionId && caso.organizacionId !== orgNormalizada?.id
);

console.log('\n📊 RESULTADOS DE FILTRADO:');
console.log(`Total de casos: ${casosPrueba.length}`);
console.log(`Casos con tu organización (${orgNormalizada?.id}): ${casosConOrganizacion.length}`);
console.log(`Casos sin organizacionId: ${casosSinOrganizacion.length}`);
console.log(`Casos con otra organización: ${casosConOtraOrganizacion.length}`);

console.log('\n📋 CASOS CON TU ORGANIZACIÓN:');
casosConOrganizacion.forEach(caso => {
  console.log(`- ${caso.numero}: ${caso.cliente}`);
});

if (casosSinOrganizacion.length > 0) {
  console.log('\n⚠️ CASOS SIN ORGANIZACIONID:');
  casosSinOrganizacion.forEach(caso => {
    console.log(`- ${caso.numero}: ${caso.cliente}`);
  });
  console.log('💡 Estos casos necesitan ser migrados');
}

console.log('\n✅ VERIFICACIÓN COMPLETADA');
console.log('Si ves casos "con tu organización", el sistema debería funcionar');
console.log('Si no hay casos o están sin organizacionId, usa el diagnóstico en la app');