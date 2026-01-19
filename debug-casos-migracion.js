// debug-casos-migracion.js - Diagnóstico de casos migrados
// Ejecutar en la consola del navegador para verificar el estado de los casos

console.log('🔍 INICIANDO DIAGNÓSTICO DE CASOS MIGRADOS...');

// Función para diagnosticar casos
async function diagnosticarCasosMigrados() {
  try {
    // Verificar Firebase
    if (!window.firebaseDebug) {
      console.error('❌ Firebase debug no disponible');
      return;
    }

    const { db } = window.firebaseDebug;
    
    // Importar funciones de Firestore
    const { collection, getDocs, query, where } = await import('firebase/firestore');
    
    console.log('📊 ANÁLISIS DE CASOS EN FIREBASE...');
    
    // 1. Obtener TODOS los casos
    const todosLosCasosSnapshot = await getDocs(collection(db, 'casos'));
    const todosLosCasos = todosLosCasosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`📋 Total de casos en BD: ${todosLosCasos.length}`);
    
    // 2. Agrupar por organizationId
    const casosPorOrganizacion = {};
    todosLosCasos.forEach(caso => {
      const orgId = caso.organizacionId || 'SIN_ORGANIZACION';
      if (!casosPorOrganizacion[orgId]) {
        casosPorOrganizacion[orgId] = [];
      }
      casosPorOrganizacion[orgId].push(caso);
    });
    
    console.log('🏢 CASOS POR ORGANIZACIÓN:');
    Object.entries(casosPorOrganizacion).forEach(([orgId, casos]) => {
      console.log(`  • ${orgId}: ${casos.length} casos`);
      if (casos.length <= 5) {
        casos.forEach(caso => {
          console.log(`    - ${caso.numero || 'Sin número'}: ${caso.cliente || 'Sin cliente'}`);
        });
      }
    });
    
    // 3. Verificar organización actual
    const organizacionActual = JSON.parse(localStorage.getItem('organizacionActual') || '{}');
    console.log('🎯 ORGANIZACIÓN ACTUAL:', organizacionActual);
    
    const orgActualId = organizacionActual.id || organizacionActual.organizacionId;
    console.log('🔑 ID de organización actual:', orgActualId);
    
    // 4. Casos de la organización actual
    const casosOrgActual = casosPorOrganizacion[orgActualId] || [];
    console.log(`📊 Casos en organización actual (${orgActualId}): ${casosOrgActual.length}`);
    
    if (casosOrgActual.length > 0) {
      console.log('📋 CASOS EN ORGANIZACIÓN ACTUAL:');
      casosOrgActual.forEach((caso, index) => {
        console.log(`  ${index + 1}. ${caso.numero || 'Sin número'} - ${caso.cliente || 'Sin cliente'} - ${caso.descripcion || 'Sin descripción'}`);
      });
    }
    
    // 5. Verificar estado de archivado
    const casosActivos = casosOrgActual.filter(caso => 
      caso.archivado !== true && caso.estado?.toLowerCase() !== 'archivado'
    );
    const casosArchivados = casosOrgActual.filter(caso => 
      caso.archivado === true || caso.estado?.toLowerCase() === 'archivado'
    );
    
    console.log(`📊 ESTADO DE CASOS:`);
    console.log(`  • Activos: ${casosActivos.length}`);
    console.log(`  • Archivados: ${casosArchivados.length}`);
    
    // 6. Verificar componente React
    console.log('🔍 VERIFICANDO COMPONENTE REACT...');
    
    // Simular lo que hace el componente
    const casosEnMemoria = window.casosDebug || [];
    console.log(`📱 Casos en memoria del componente: ${casosEnMemoria.length}`);
    
    // 7. Recomendaciones
    console.log('💡 RECOMENDACIONES:');
    
    if (casosOrgActual.length === 0) {
      console.log('  ❌ No hay casos en la organización actual');
      console.log('  🔧 Solución: Migrar casos de otra organización');
      
      // Mostrar organizaciones con casos
      const orgConCasos = Object.entries(casosPorOrganizacion)
        .filter(([orgId, casos]) => orgId !== 'SIN_ORGANIZACION' && casos.length > 0)
        .sort(([,a], [,b]) => b.length - a.length);
      
      if (orgConCasos.length > 0) {
        console.log('  📋 Organizaciones con casos disponibles para migrar:');
        orgConCasos.forEach(([orgId, casos]) => {
          console.log(`    • ${orgId}: ${casos.length} casos`);
        });
      }
    } else if (casosActivos.length === 0) {
      console.log('  ⚠️ Todos los casos están archivados');
      console.log('  🔧 Solución: Cambiar a vista "Archivados" o desarchivar casos');
    } else {
      console.log('  ✅ Hay casos activos disponibles');
      console.log('  🔧 Verificar que el componente se esté renderizando correctamente');
    }
    
    return {
      totalCasos: todosLosCasos.length,
      casosPorOrganizacion,
      organizacionActual: orgActualId,
      casosEnOrgActual: casosOrgActual.length,
      casosActivos: casosActivos.length,
      casosArchivados: casosArchivados.length
    };
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    return null;
  }
}

// Función para forzar recarga de casos
async function forzarRecargaCasos() {
  console.log('🔄 FORZANDO RECARGA DE CASOS...');
  
  // Disparar evento personalizado para recargar
  window.dispatchEvent(new CustomEvent('recargarCasos'));
  
  // También intentar recargar la página si es necesario
  if (window.confirm('¿Recargar la página para actualizar los casos?')) {
    window.location.reload();
  }
}

// Ejecutar diagnóstico automáticamente
diagnosticarCasosMigrados().then(resultado => {
  if (resultado) {
    console.log('✅ Diagnóstico completado');
    
    // Guardar resultado para debugging
    window.diagnosticoCasos = resultado;
    
    console.log('\n🔧 FUNCIONES DISPONIBLES:');
    console.log('• diagnosticarCasosMigrados() - Ejecutar diagnóstico completo');
    console.log('• forzarRecargaCasos() - Forzar recarga de casos');
    console.log('• window.diagnosticoCasos - Resultado del último diagnóstico');
  }
});

// Hacer funciones disponibles globalmente
window.diagnosticarCasosMigrados = diagnosticarCasosMigrados;
window.forzarRecargaCasos = forzarRecargaCasos;