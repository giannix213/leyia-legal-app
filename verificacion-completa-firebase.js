/**
 * VERIFICACIÓN COMPLETA - CAMBIO DE FIREBASE SEGÚN HOJA DE RUTA
 * Ejecutar: node verificacion-completa-firebase.js
 * 
 * ⚠️ NOTA DE SEGURIDAD: Este archivo ya no contiene API keys hardcodeadas
 * Las credenciales deben estar en archivos .env (que están en .gitignore)
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICACIÓN COMPLETA DEL CAMBIO DE FIREBASE...\n');

// Configuración esperada (usando variables de entorno por seguridad)
const EXPECTED_CONFIG = {
  projectId: 'leyiapro',
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || '[API_KEY_FROM_ENV]',
  authDomain: 'leyiapro.firebaseapp.com',
  storageBucket: 'leyiapro.firebasestorage.app',
  messagingSenderId: '224412501560',
  appId: '1:224412501560:web:3bf6e9bcf751b1848f88cd',
  measurementId: 'G-9M7BBC6XZW'
};

function verificarArchivo(filePath, descripcion) {
  console.log(`📋 VERIFICANDO: ${descripcion}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`   ❌ Archivo no encontrado: ${filePath}`);
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`   ✅ Archivo encontrado: ${filePath}`);
  return content;
}

function verificarConfiguracionEnv() {
  console.log('📋 FASE 1: VERIFICANDO ARCHIVOS DE CONFIGURACIÓN\n');
  
  // Verificar .env
  const envContent = verificarArchivo('.env', '.env (Producción)');
  if (envContent) {
    const checks = [
      { key: 'REACT_APP_FIREBASE_PROJECT_ID', expected: EXPECTED_CONFIG.projectId },
      { key: 'REACT_APP_FIREBASE_API_KEY', expected: 'API_KEY_CONFIGURADA' }, // Verificar que existe, no el valor
      { key: 'REACT_APP_FIREBASE_AUTH_DOMAIN', expected: EXPECTED_CONFIG.authDomain },
      { key: 'REACT_APP_FIREBASE_STORAGE_BUCKET', expected: EXPECTED_CONFIG.storageBucket },
      { key: 'REACT_APP_FIREBASE_MESSAGING_SENDER_ID', expected: EXPECTED_CONFIG.messagingSenderId },
      { key: 'REACT_APP_FIREBASE_APP_ID', expected: EXPECTED_CONFIG.appId }
    ];
    
    checks.forEach(check => {
      const regex = new RegExp(`${check.key}=(.+)`);
      const match = envContent.match(regex);
      if (check.key === 'REACT_APP_FIREBASE_API_KEY') {
        // Para API key, solo verificar que existe y no está vacía
        if (match && match[1] && match[1].length > 10) {
          console.log(`   ✅ ${check.key}: Configurada correctamente`);
        } else {
          console.log(`   ❌ ${check.key}: No encontrada o vacía`);
        }
      } else if (match && match[1] === check.expected) {
        console.log(`   ✅ ${check.key}: Correcto`);
      } else {
        console.log(`   ❌ ${check.key}: ${match ? match[1] : 'No encontrado'} (esperado: ${check.expected})`);
      }
    });
  }
  
  // Verificar .env.development
  const envDevContent = verificarArchivo('.env.development', '.env.development (Desarrollo)');
  if (envDevContent) {
    const skipFirebase = envDevContent.match(/REACT_APP_SKIP_FIREBASE=(.+)/);
    const projectId = envDevContent.match(/REACT_APP_FIREBASE_PROJECT_ID=(.+)/);
    
    if (skipFirebase && skipFirebase[1] === 'false') {
      console.log('   ✅ REACT_APP_SKIP_FIREBASE: false (Firebase habilitado)');
    } else {
      console.log('   ❌ REACT_APP_SKIP_FIREBASE: No está en false');
    }
    
    if (projectId && projectId[1] === EXPECTED_CONFIG.projectId) {
      console.log('   ✅ Project ID en desarrollo: Correcto');
    } else {
      console.log('   ❌ Project ID en desarrollo: Incorrecto');
    }
  }
}

function verificarCodigoActualizado() {
  console.log('\n📋 FASE 2: VERIFICANDO CÓDIGO ACTUALIZADO\n');
  
  // Verificar OrganizacionContext.js
  const contextContent = verificarArchivo('src/contexts/OrganizacionContext.js', 'OrganizacionContext.js');
  if (contextContent) {
    if (contextContent.includes('leyiapro-org')) {
      console.log('   ✅ OrganizacionContext.js: ID de organización actualizado');
    } else if (contextContent.includes('default-org')) {
      console.log('   ❌ OrganizacionContext.js: Aún usa default-org');
    } else {
      console.log('   ⚠️ OrganizacionContext.js: No se encontró referencia de organización');
    }
  }
  
  // Verificar App.js
  const appContent = verificarArchivo('src/App.js', 'App.js');
  if (appContent) {
    const devOrgMatches = (appContent.match(/leyiapro-org/g) || []).length;
    const oldDevOrgMatches = (appContent.match(/dev-org-123/g) || []).length;
    
    if (devOrgMatches >= 2 && oldDevOrgMatches === 0) {
      console.log('   ✅ App.js: IDs de organización actualizados correctamente');
    } else {
      console.log(`   ❌ App.js: leyiapro-org: ${devOrgMatches}, dev-org-123: ${oldDevOrgMatches}`);
    }
  }
  
  // Verificar firebase.js
  const firebaseContent = verificarArchivo('src/firebase.js', 'firebase.js');
  if (firebaseContent) {
    const requiredExports = ['export const auth', 'export const db', 'export const storage'];
    let allExportsFound = true;
    
    requiredExports.forEach(exportStatement => {
      if (firebaseContent.includes(exportStatement)) {
        console.log(`   ✅ ${exportStatement}: Encontrado`);
      } else {
        console.log(`   ❌ ${exportStatement}: No encontrado`);
        allExportsFound = false;
      }
    });
    
    if (firebaseContent.includes('process.env.REACT_APP_FIREBASE_API_KEY')) {
      console.log('   ✅ firebase.js: Usa variables de entorno');
    } else {
      console.log('   ❌ firebase.js: No usa variables de entorno');
    }
  }
}

function verificarArchivosAuxiliares() {
  console.log('\n📋 FASE 3: VERIFICANDO ARCHIVOS AUXILIARES\n');
  
  // Verificar que existen los scripts de limpieza
  const scriptsEsperados = [
    'limpiar-cache-nueva-cuenta.bat',
    'verificar-nueva-cuenta-firebase.js',
    'verificacion-completa-firebase.js'
  ];
  
  scriptsEsperados.forEach(script => {
    if (fs.existsSync(script)) {
      console.log(`   ✅ ${script}: Creado`);
    } else {
      console.log(`   ❌ ${script}: No encontrado`);
    }
  });
}

function generarResumenFinal() {
  console.log('\n📋 FASE 4: RESUMEN FINAL Y PRÓXIMOS PASOS\n');
  
  console.log('🎯 CHECKLIST SEGÚN HOJA DE RUTA:');
  console.log('\n✅ COMPLETADO:');
  console.log('   • Variables de entorno actualizadas (.env y .env.development)');
  console.log('   • IDs de organización actualizados en código');
  console.log('   • Firebase habilitado en modo desarrollo');
  console.log('   • Scripts de limpieza y verificación creados');
  
  console.log('\n🔧 PENDIENTE EN FIREBASE CONSOLE:');
  console.log('   • Habilitar Firestore Database (modo prueba)');
  console.log('   • Habilitar Authentication (Email/Password)');
  console.log('   • Habilitar Storage (modo prueba)');
  console.log('   • Crear índices necesarios');
  
  console.log('\n💻 PENDIENTE EN TU COMPUTADORA:');
  console.log('   • Ejecutar: limpiar-cache-nueva-cuenta.bat');
  console.log('   • Limpiar cache del navegador');
  console.log('   • Ejecutar: npm start');
  console.log('   • Probar funcionalidades');
  
  console.log('\n🚀 COMANDOS PARA CONTINUAR:');
  console.log('   1. .\\limpiar-cache-nueva-cuenta.bat');
  console.log('   2. npm start');
  console.log('   3. Ir a https://console.firebase.google.com/project/leyiapro');
  
  console.log('\n📊 REGLAS DE FIRESTORE PARA COPIAR:');
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

  console.log('\n🔍 ÍNDICES NECESARIOS:');
  console.log('   Collection: casos');
  console.log('   Fields: organizacionId (Ascending), createdAt (Descending)');
  console.log('');
  console.log('   Collection: audiencias');
  console.log('   Fields: organizacionId (Ascending), fecha (Ascending)');
}

// Ejecutar todas las verificaciones
verificarConfiguracionEnv();
verificarCodigoActualizado();
verificarArchivosAuxiliares();
generarResumenFinal();

console.log('\n🎉 VERIFICACIÓN COMPLETA FINALIZADA');
console.log('📞 Si todo está ✅, procede con los pasos pendientes');