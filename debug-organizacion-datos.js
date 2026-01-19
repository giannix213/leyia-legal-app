/**
 * Script de diagnóstico para problemas de carga de datos de organización
 * Ejecutar en la consola del navegador para diagnosticar el problema
 */

console.log('🔍 INICIANDO DIAGNÓSTICO DE ORGANIZACIÓN Y DATOS...');

// 1. Verificar localStorage
console.log('\n📂 1. VERIFICANDO LOCALSTORAGE:');
const orgGuardada = localStorage.getItem('organizacionActual');
const userGuardado = localStorage.getItem('usuarioActual');

console.log('organizacionActual en localStorage:', orgGuardada);
console.log('usuarioActual en localStorage:', userGuardado);

if (orgGuardada) {
  try {
    const orgData = JSON.parse(orgGuardada);
    console.log('Organización parseada:', orgData);
    console.log('ID de organización:', orgData.id || orgData.organizationId);
  } catch (e) {
    console.error('Error parseando organización:', e);
  }
}

// 2. Verificar contexto React (si está disponible)
console.log('\n🔄 2. VERIFICANDO CONTEXTO REACT:');
if (window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
  console.log('React detectado, pero no podemos acceder al contexto desde aquí');
  console.log('Revisa las herramientas de desarrollo de React');
}

// 3. Verificar Firebase
console.log('\n🔥 3. VERIFICANDO FIREBASE:');
if (window.firebaseDebug) {
  const { db } = window.firebaseDebug;
  console.log('Firebase disponible:', !!db);
  
  // Intentar consulta directa
  if (orgGuardada) {
    try {
      const orgData = JSON.parse(orgGuardada);
      const orgId = orgData.id || orgData.organizationId;
      
      if (orgId) {
        console.log(`Intentando consulta directa para organización: ${orgId}`);
        
        // Importar Firestore functions
        import('./src/firebase.js').then(({ db }) => {
          import('firebase/firestore').then(({ collection, query, where, getDocs }) => {
            
            // Consulta directa
            const q = query(
              collection(db, 'casos'),
              where('organizacionId', '==', orgId)
            );
            
            getDocs(q).then(querySnapshot => {
              console.log(`✅ Casos encontrados en Firebase: ${querySnapshot.size}`);
              
              if (querySnapshot.size > 0) {
                console.log('Primeros 3 casos:');
                let count = 0;
                querySnapshot.forEach(doc => {
                  if (count < 3) {
                    const data = doc.data();
                    console.log(`- ${data.numero}: ${data.cliente} (${data.tipo})`);
                    count++;
                  }
                });
              } else {
                console.log('❌ No se encontraron casos para esta organización');
                
                // Verificar si hay casos sin organizacionId
                const allCasosQuery = collection(db, 'casos');
                getDocs(allCasosQuery).then(allSnapshot => {
                  console.log(`Total de casos en BD (sin filtro): ${allSnapshot.size}`);
                  
                  if (allSnapshot.size > 0) {
                    console.log('Casos sin organizacionId:');
                    let casosOrfanos = 0;
                    allSnapshot.forEach(doc => {
                      const data = doc.data();
                      if (!data.organizacionId) {
                        casosOrfanos++;
                        if (casosOrfanos <= 3) {
                          console.log(`- ${data.numero}: ${data.cliente} (SIN organizacionId)`);
                        }
                      }
                    });
                    console.log(`Total casos sin organizacionId: ${casosOrfanos}`);
                  }
                });
              }
            }).catch(error => {
              console.error('❌ Error en consulta Firebase:', error);
            });
            
          });
        });
        
      } else {
        console.log('❌ No se pudo extraer ID de organización');
      }
    } catch (e) {
      console.error('Error procesando organización:', e);
    }
  }
} else {
  console.log('❌ Firebase debug no disponible');
  console.log('Asegúrate de que NODE_ENV=development');
}

// 4. Verificar servicios
console.log('\n🔧 4. VERIFICANDO SERVICIOS:');
console.log('Revisa la consola para logs de CasosService');
console.log('Busca mensajes que empiecen con "🔍 CasosService.cargarCasosPorOrganizacion"');

// 5. Instrucciones de seguimiento
console.log('\n📋 5. PASOS DE SEGUIMIENTO:');
console.log('1. Verifica que organizacionActual tenga un ID válido');
console.log('2. Confirma que hay casos en Firebase con ese organizacionId');
console.log('3. Revisa los logs del CasosService en la consola');
console.log('4. Si hay casos sin organizacionId, considera migrarlos');

// 6. Función helper para migrar casos
window.migrarCasosOrfanos = async function(organizacionId) {
  if (!window.firebaseDebug) {
    console.error('Firebase debug no disponible');
    return;
  }
  
  console.log(`🔄 Migrando casos sin organizacionId a: ${organizacionId}`);
  
  const { db } = window.firebaseDebug;
  const { collection, getDocs, doc, updateDoc } = await import('firebase/firestore');
  
  const allCasosQuery = collection(db, 'casos');
  const allSnapshot = await getDocs(allCasosQuery);
  
  let migrados = 0;
  const batch = [];
  
  allSnapshot.forEach(docSnap => {
    const data = docSnap.data();
    if (!data.organizacionId) {
      batch.push(updateDoc(doc(db, 'casos', docSnap.id), {
        organizacionId: organizacionId
      }));
      migrados++;
    }
  });
  
  if (batch.length > 0) {
    await Promise.all(batch);
    console.log(`✅ Migrados ${migrados} casos a organizacionId: ${organizacionId}`);
  } else {
    console.log('No hay casos para migrar');
  }
};

console.log('\n💡 FUNCIÓN DISPONIBLE:');
console.log('migrarCasosOrfanos("tu-organizacion-id") - Para migrar casos sin organizacionId');

console.log('\n🔍 DIAGNÓSTICO COMPLETADO');