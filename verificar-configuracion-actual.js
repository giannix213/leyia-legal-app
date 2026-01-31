/**
 * VERIFICACIÓN RÁPIDA - CONFIGURACIÓN FIREBASE ACTUAL
 * 
 * Ejecutar: node verificar-configuracion-actual.js
 * 
 * Este script verifica la configuración actual de Firebase
 * y muestra qué archivos necesitan ser modificados para el cambio
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICACIÓN DE CONFIGURACIÓN FIREBASE ACTUAL\n');

// Función para leer archivo de forma segura
function leerArchivo(ruta) {
  try {
    return fs.readFileSync(ruta, 'utf8');
  } catch (error) {
    return null;
  }
}

// Función para extraer variables de entorno
function extraerVariablesEnv(contenido) {
  if (!contenido) return {};
  
  const variables = {};
  const lineas = contenido.split('\n');
  
  lineas.forEach(linea => {
    const match = linea.match(/^REACT_APP_FIREBASE_([^=]+)=(.*)$/);
    if (match) {
      variables[match[1]] = match[2];
    }
  });
  
  return variables;
}

// 1. VERIFICAR ARCHIVOS DE CONFIGURACIÓN
console.log('📋 1. ARCHIVOS DE CONFIGURACIÓN\n');

const envProduccion = leerArchivo('.env');
const envDesarrollo = leerArchivo('.env.development');

if (envProduccion) {
  console.log('✅ .env encontrado');
  const varsProduccion = extraerVariablesEnv(envProduccion);
  console.log('   📊 Project ID:', varsProduccion.PROJECT_ID || 'No configurado');
  console.log('   🌐 Auth Domain:', varsProduccion.AUTH_DOMAIN || 'No configurado');
} else {
  console.log('❌ .env NO encontrado');
}

if (envDesarrollo) {
  console.log('✅ .env.development encontrado');
  const varsDesarrollo = extraerVariablesEnv(envDesarrollo);
  console.log('   📊 Project ID:', varsDesarrollo.PROJECT_ID || 'No configurado');
  console.log('   🌐 Auth Domain:', varsDesarrollo.AUTH_DOMAIN || 'No configurado');
} else {
  console.log('❌ .env.development NO encontrado');
}

// 2. VERIFICAR FIREBASE.JS
console.log('\n📋 2. CONFIGURACIÓN FIREBASE.JS\n');

const firebaseJs = leerArchivo(path.join('src', 'firebase.js'));
if (firebaseJs) {
  console.log('✅ src/firebase.js encontrado');
  
  // Verificar si usa variables de entorno
  const usaVariablesEnv = firebaseJs.includes('process.env.REACT_APP_FIREBASE');
  console.log('   🔧 Usa variables de entorno:', usaVariablesEnv ? 'SÍ' : 'NO');
  
  if (!usaVariablesEnv) {
    console.log('   ⚠️  REQUIERE MODIFICACIÓN: Debe usar variables de entorno');
  }
} else {
  console.log('❌ src/firebase.js NO encontrado');
}

// 3. VERIFICAR ARCHIVOS QUE IMPORTAN FIREBASE
console.log('\n📋 3. ARCHIVOS QUE USAN FIREBASE\n');

const archivosFirebase = [
  'src/App.js',
  'src/contexts/OrganizacionContext.js',
  'src/services/CasosService.js',
  'src/hooks/useCasos.js',
  'src/hooks/useAuthPersistence.js'
];

let archivosEncontrados = 0;
archivosFirebase.forEach(archivo => {
  const contenido = leerArchivo(archivo);
  if (contenido) {
    archivosEncontrados++;
    const importaFirebase = contenido.includes('from \'../firebase\'') || 
                           contenido.includes('from \'./firebase\'');
    console.log(`   ${importaFirebase ? '✅' : '⚠️ '} ${archivo}`);
  } else {
    console.log(`   ❌ ${archivo} - NO encontrado`);
  }
});

console.log(`\n   📊 Total archivos encontrados: ${archivosEncontrados}/${archivosFirebase.length}`);

// 4. VERIFICAR DEPENDENCIAS
console.log('\n📋 4. DEPENDENCIAS FIREBASE\n');

const packageJson = leerArchivo('package.json');
if (packageJson) {
  try {
    const pkg = JSON.parse(packageJson);
    const firebaseVersion = pkg.dependencies?.firebase;
    
    if (firebaseVersion) {
      console.log('✅ Firebase instalado');
      console.log('   📦 Versión:', firebaseVersion);
    } else {
      console.log('❌ Firebase NO está en dependencias');
    }
  } catch (error) {
    console.log('❌ Error leyendo package.json');
  }
} else {
  console.log('❌ package.json NO encontrado');
}

// 5. ANÁLISIS DE PREPARACIÓN
console.log('\n📋 5. ANÁLISIS DE PREPARACIÓN PARA CAMBIO\n');

const preparacionItems = [
  {
    item: 'Archivos de configuración existentes',
    estado: envProduccion && envDesarrollo,
    descripcion: '.env y .env.development'
  },
  {
    item: 'Firebase.js usa variables de entorno',
    estado: firebaseJs && firebaseJs.includes('process.env.REACT_APP_FIREBASE'),
    descripcion: 'Configuración dinámica'
  },
  {
    item: 'Dependencia Firebase instalada',
    estado: packageJson && JSON.parse(packageJson).dependencies?.firebase,
    descripcion: 'Paquete npm'
  },
  {
    item: 'Archivos principales encontrados',
    estado: archivosEncontrados >= 4,
    descripcion: 'Componentes y servicios'
  }
];

let itemsListos = 0;
preparacionItems.forEach(({ item, estado, descripcion }) => {
  if (estado) itemsListos++;
  console.log(`   ${estado ? '✅' : '❌'} ${item} - ${descripcion}`);
});

// 6. RECOMENDACIONES
console.log('\n📋 6. RECOMENDACIONES\n');

const porcentajePreparacion = (itemsListos / preparacionItems.length) * 100;

if (porcentajePreparacion >= 75) {
  console.log('🎉 PROYECTO LISTO PARA CAMBIO DE FIREBASE');
  console.log('\n🚀 PRÓXIMOS PASOS:');
  console.log('   1. Ejecutar: node cambiar-firebase-automatico.js');
  console.log('   2. Seguir instrucciones del asistente');
  console.log('   3. Configurar servicios en Firebase Console');
} else {
  console.log('⚠️  PROYECTO REQUIERE PREPARACIÓN ADICIONAL');
  console.log('\n🔧 ACCIONES REQUERIDAS:');
  
  if (!envProduccion || !envDesarrollo) {
    console.log('   • Crear archivos .env y .env.development');
  }
  
  if (!firebaseJs || !firebaseJs.includes('process.env.REACT_APP_FIREBASE')) {
    console.log('   • Actualizar src/firebase.js para usar variables de entorno');
  }
  
  if (archivosEncontrados < 4) {
    console.log('   • Verificar que todos los archivos principales existan');
  }
}

console.log(`\n📊 Preparación: ${porcentajePreparacion.toFixed(0)}%`);
console.log('\n📋 Para cambio manual, consulta: HOJA_RUTA_CAMBIO_FIREBASE_COMPLETA.md');
console.log('📋 Para cambio automático, ejecuta: node cambiar-firebase-automatico.js');