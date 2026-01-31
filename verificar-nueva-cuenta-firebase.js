/**
 * VERIFICACIÓN DE NUEVA CUENTA FIREBASE
 * Ejecutar: node verificar-nueva-cuenta-firebase.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICANDO CONFIGURACIÓN DE NUEVA CUENTA FIREBASE...\n');

// Verificar archivos .env
function verificarEnv() {
  console.log('📋 VERIFICANDO ARCHIVOS DE CONFIGURACIÓN:');
  
  // Verificar .env
  if (fs.existsSync('.env')) {
    const envContent = fs.readFileSync('.env', 'utf8');
    const projectId = envContent.match(/REACT_APP_FIREBASE_PROJECT_ID=(.+)/);
    const apiKey = envContent.match(/REACT_APP_FIREBASE_API_KEY=(.+)/);
    
    if (projectId && projectId[1] === 'leyiapro') {
      console.log('   ✅ .env configurado correctamente');
      console.log('   📊 Project ID:', projectId[1]);
    } else {
      console.log('   ❌ .env no tiene la configuración correcta');
    }
  } else {
    console.log('   ❌ .env no encontrado');
  }
  
  // Verificar .env.development
  if (fs.existsSync('.env.development')) {
    const envDevContent = fs.readFileSync('.env.development', 'utf8');
    const skipFirebase = envDevContent.match(/REACT_APP_SKIP_FIREBASE=(.+)/);
    const projectId = envDevContent.match(/REACT_APP_FIREBASE_PROJECT_ID=(.+)/);
    
    if (skipFirebase && skipFirebase[1] === 'false' && projectId && projectId[1] === 'leyiapro') {
      console.log('   ✅ .env.development configurado correctamente');
      console.log('   🔧 Firebase habilitado en desarrollo');
    } else {
      console.log('   ❌ .env.development no tiene la configuración correcta');
    }
  } else {
    console.log('   ❌ .env.development no encontrado');
  }
}

// Verificar src/firebase.js
function verificarFirebaseJs() {
  console.log('\n📋 VERIFICANDO src/firebase.js:');
  
  const firebasePath = path.join('src', 'firebase.js');
  if (fs.existsSync(firebasePath)) {
    const firebaseContent = fs.readFileSync(firebasePath, 'utf8');
    
    // Verificar que use variables de entorno
    if (firebaseContent.includes('process.env.REACT_APP_FIREBASE_API_KEY')) {
      console.log('   ✅ firebase.js usa variables de entorno correctamente');
    } else {
      console.log('   ❌ firebase.js no usa variables de entorno');
    }
    
    // Verificar exportaciones
    const exports = ['export const auth', 'export const db', 'export const storage'];
    let allExportsFound = true;
    
    exports.forEach(exportStatement => {
      if (firebaseContent.includes(exportStatement)) {
        console.log(`   ✅ ${exportStatement} encontrado`);
      } else {
        console.log(`   ❌ ${exportStatement} no encontrado`);
        allExportsFound = false;
      }
    });
    
    if (allExportsFound) {
      console.log('   ✅ Todas las exportaciones necesarias están presentes');
    }
  } else {
    console.log('   ❌ src/firebase.js no encontrado');
  }
}

// Generar checklist
function generarChecklist() {
  console.log('\n📋 CHECKLIST PARA COMPLETAR EL CAMBIO:');
  console.log('\n🔧 EN FIREBASE CONSOLE (https://console.firebase.google.com/project/leyiapro):');
  console.log('   [ ] Habilitar Firestore Database (modo prueba)');
  console.log('   [ ] Habilitar Authentication (Email/Password)');
  console.log('   [ ] Habilitar Storage (modo prueba)');
  console.log('   [ ] Crear índices necesarios en Firestore');
  console.log('\n💻 EN TU COMPUTADORA:');
  console.log('   [ ] Ejecutar: limpiar-cache-nueva-cuenta.bat');
  console.log('   [ ] Limpiar cache del navegador (F12 > Application > Clear Storage)');
  console.log('   [ ] Ejecutar: npm start');
  console.log('   [ ] Probar login y funcionalidades');
  console.log('\n📊 CREAR DATOS DE PRUEBA:');
  console.log('   [ ] Crear usuario de prueba en Authentication');
  console.log('   [ ] Crear organización de prueba en Firestore');
  console.log('   [ ] Crear algunos casos de prueba');
  
  console.log('\n🎯 REGLAS DE FIRESTORE RECOMENDADAS (modo desarrollo):');
  console.log(`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
`);

  console.log('\n🎯 ÍNDICES NECESARIOS EN FIRESTORE:');
  console.log('   Collection: casos');
  console.log('   Fields: organizacionId (Ascending), createdAt (Descending)');
  console.log('');
  console.log('   Collection: audiencias');
  console.log('   Fields: organizacionId (Ascending), fecha (Ascending)');
}

// Ejecutar verificaciones
verificarEnv();
verificarFirebaseJs();
generarChecklist();

console.log('\n🚀 CONFIGURACIÓN LISTA PARA USAR NUEVA CUENTA FIREBASE');
console.log('📞 Si encuentras errores, revisa el checklist anterior');