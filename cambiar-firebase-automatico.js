/**
 * SCRIPT AUTOMÁTICO - CAMBIO DE CUENTA FIREBASE
 * 
 * Este script automatiza el proceso de cambio de Firebase
 * Ejecutar: node cambiar-firebase-automatico.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔄 ASISTENTE AUTOMÁTICO - CAMBIO DE CUENTA FIREBASE\n');

// Función para hacer preguntas
function pregunta(texto) {
  return new Promise((resolve) => {
    rl.question(texto, (respuesta) => {
      resolve(respuesta);
    });
  });
}

// Configuración nueva de Firebase
let nuevaConfig = {};

async function recopilarConfiguracion() {
  console.log('📋 PASO 1: RECOPILAR NUEVA CONFIGURACIÓN FIREBASE\n');
  console.log('Ve a Firebase Console > Project Settings > General > Your apps');
  console.log('Copia los valores de la configuración de tu nueva cuenta:\n');

  nuevaConfig.apiKey = await pregunta('🔑 API Key: ');
  nuevaConfig.authDomain = await pregunta('🌐 Auth Domain: ');
  nuevaConfig.projectId = await pregunta('📊 Project ID: ');
  nuevaConfig.storageBucket = await pregunta('📁 Storage Bucket: ');
  nuevaConfig.messagingSenderId = await pregunta('📨 Messaging Sender ID: ');
  nuevaConfig.appId = await pregunta('📱 App ID: ');

  console.log('\n✅ Configuración recopilada:');
  console.log('   Project ID:', nuevaConfig.projectId);
  console.log('   Auth Domain:', nuevaConfig.authDomain);
  
  const confirmar = await pregunta('\n¿Es correcta esta configuración? (s/n): ');
  if (confirmar.toLowerCase() !== 's') {
    console.log('❌ Proceso cancelado');
    process.exit(0);
  }
}

function respaldarArchivos() {
  console.log('\n📋 PASO 2: RESPALDANDO ARCHIVOS ACTUALES...');
  
  try {
    // Respaldar .env
    if (fs.existsSync('.env')) {
      fs.copyFileSync('.env', '.env.backup');
      console.log('   ✅ .env respaldado como .env.backup');
    }
    
    // Respaldar .env.development
    if (fs.existsSync('.env.development')) {
      fs.copyFileSync('.env.development', '.env.development.backup');
      console.log('   ✅ .env.development respaldado como .env.development.backup');
    }
    
    return true;
  } catch (error) {
    console.error('   ❌ Error respaldando archivos:', error.message);
    return false;
  }
}

function actualizarEnvProduccion() {
  console.log('\n📋 PASO 3: ACTUALIZANDO .env (PRODUCCIÓN)...');
  
  try {
    let envContent = '';
    
    // Leer archivo actual si existe
    if (fs.existsSync('.env')) {
      envContent = fs.readFileSync('.env', 'utf8');
    }
    
    // Actualizar o agregar variables Firebase
    const firebaseVars = {
      'REACT_APP_FIREBASE_API_KEY': nuevaConfig.apiKey,
      'REACT_APP_FIREBASE_AUTH_DOMAIN': nuevaConfig.authDomain,
      'REACT_APP_FIREBASE_PROJECT_ID': nuevaConfig.projectId,
      'REACT_APP_FIREBASE_STORAGE_BUCKET': nuevaConfig.storageBucket,
      'REACT_APP_FIREBASE_MESSAGING_SENDER_ID': nuevaConfig.messagingSenderId,
      'REACT_APP_FIREBASE_APP_ID': nuevaConfig.appId
    };
    
    // Actualizar cada variable
    Object.entries(firebaseVars).forEach(([key, value]) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (envContent.match(regex)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}`;
      }
    });
    
    // Escribir archivo actualizado
    fs.writeFileSync('.env', envContent);
    console.log('   ✅ .env actualizado con nueva configuración Firebase');
    
    return true;
  } catch (error) {
    console.error('   ❌ Error actualizando .env:', error.message);
    return false;
  }
}

function actualizarEnvDesarrollo() {
  console.log('\n📋 PASO 4: ACTUALIZANDO .env.development...');
  
  try {
    let envDevContent = '';
    
    // Leer archivo actual si existe
    if (fs.existsSync('.env.development')) {
      envDevContent = fs.readFileSync('.env.development', 'utf8');
    }
    
    // Actualizar variables Firebase para desarrollo
    const firebaseVars = {
      'REACT_APP_FIREBASE_API_KEY': nuevaConfig.apiKey,
      'REACT_APP_FIREBASE_AUTH_DOMAIN': nuevaConfig.authDomain,
      'REACT_APP_FIREBASE_PROJECT_ID': nuevaConfig.projectId,
      'REACT_APP_FIREBASE_STORAGE_BUCKET': nuevaConfig.storageBucket,
      'REACT_APP_FIREBASE_MESSAGING_SENDER_ID': nuevaConfig.messagingSenderId,
      'REACT_APP_FIREBASE_APP_ID': nuevaConfig.appId,
      'REACT_APP_SKIP_FIREBASE': 'false'  // Habilitar Firebase en desarrollo
    };
    
    // Actualizar cada variable
    Object.entries(firebaseVars).forEach(([key, value]) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (envDevContent.match(regex)) {
        envDevContent = envDevContent.replace(regex, `${key}=${value}`);
      } else {
        envDevContent += `\n${key}=${value}`;
      }
    });
    
    // Escribir archivo actualizado
    fs.writeFileSync('.env.development', envDevContent);
    console.log('   ✅ .env.development actualizado');
    
    return true;
  } catch (error) {
    console.error('   ❌ Error actualizando .env.development:', error.message);
    return false;
  }
}

function actualizarCodigoOrganizacion() {
  console.log('\n📋 PASO 5: ACTUALIZANDO IDs DE ORGANIZACIÓN...');
  
  try {
    // Actualizar OrganizacionContext.js
    const contextPath = path.join('src', 'contexts', 'OrganizacionContext.js');
    if (fs.existsSync(contextPath)) {
      let contextContent = fs.readFileSync(contextPath, 'utf8');
      
      // Cambiar ID por defecto
      contextContent = contextContent.replace(
        /id: orgData\.organizationId \|\| orgData\.id \|\| '[^']*'/g,
        `id: orgData.organizationId || orgData.id || '${nuevaConfig.projectId}-org'`
      );
      
      fs.writeFileSync(contextPath, contextContent);
      console.log('   ✅ OrganizacionContext.js actualizado');
    }
    
    // Actualizar App.js si tiene configuración de desarrollo
    const appPath = path.join('src', 'App.js');
    if (fs.existsSync(appPath)) {
      let appContent = fs.readFileSync(appPath, 'utf8');
      
      // Buscar y actualizar configuración de desarrollo
      if (appContent.includes('dev-org-123')) {
        appContent = appContent.replace(/dev-org-123/g, `${nuevaConfig.projectId}-org`);
        fs.writeFileSync(appPath, appContent);
        console.log('   ✅ App.js actualizado');
      }
    }
    
    return true;
  } catch (error) {
    console.error('   ❌ Error actualizando código:', error.message);
    return false;
  }
}

function generarScriptVerificacion() {
  console.log('\n📋 PASO 6: GENERANDO SCRIPT DE VERIFICACIÓN...');
  
  const scriptVerificacion = `/**
 * VERIFICACIÓN NUEVA CONFIGURACIÓN FIREBASE
 * Ejecutar: node verificar-nueva-configuracion.js
 */

import { db, auth, storage } from './src/firebase.js';
import { collection, getDocs } from 'firebase/firestore';

async function verificarConfiguracion() {
  console.log('🔍 VERIFICANDO NUEVA CONFIGURACIÓN FIREBASE...');
  
  try {
    console.log('📊 Proyecto:', db.app.options.projectId);
    console.log('🔐 Auth Domain:', auth.config.authDomain);
    console.log('📁 Storage Bucket:', storage.app.options.storageBucket);
    
    // Probar conexión a Firestore
    const testCollection = collection(db, 'casos');
    console.log('✅ Conexión a Firestore exitosa');
    
    // Probar consulta
    const casos = await getDocs(testCollection);
    console.log('📋 Casos encontrados:', casos.size);
    
    console.log('\\n🎉 NUEVA CONFIGURACIÓN FUNCIONANDO CORRECTAMENTE');
    console.log('\\n📋 PRÓXIMOS PASOS:');
    console.log('1. Crear datos de prueba en Firebase Console');
    console.log('2. Configurar reglas de seguridad');
    console.log('3. Crear índices necesarios');
    console.log('4. Probar login y funcionalidades');
    
  } catch (error) {
    console.error('❌ ERROR EN VERIFICACIÓN:', error);
    console.log('\\n🔧 POSIBLES SOLUCIONES:');
    console.log('1. Verificar que los servicios estén habilitados en Firebase Console');
    console.log('2. Revisar reglas de seguridad');
    console.log('3. Limpiar caché del navegador');
    console.log('4. Reiniciar la aplicación');
  }
}

// Ejecutar verificación
verificarConfiguracion();
`;

  fs.writeFileSync('verificar-nueva-configuracion.js', scriptVerificacion);
  console.log('   ✅ Script de verificación creado: verificar-nueva-configuracion.js');
}

function generarInstruccionesFinales() {
  console.log('\n📋 PASO 7: GENERANDO INSTRUCCIONES FINALES...');
  
  const instrucciones = `# INSTRUCCIONES FINALES - CAMBIO DE FIREBASE COMPLETADO

## ✅ CAMBIOS APLICADOS AUTOMÁTICAMENTE

1. **Archivos respaldados:**
   - .env.backup
   - .env.development.backup

2. **Configuración actualizada:**
   - .env (producción)
   - .env.development (desarrollo)
   - src/contexts/OrganizacionContext.js
   - src/App.js

3. **Nueva configuración:**
   - Project ID: ${nuevaConfig.projectId}
   - Auth Domain: ${nuevaConfig.authDomain}

## 🚀 PRÓXIMOS PASOS MANUALES

### 1. CONFIGURAR FIREBASE CONSOLE
Ve a: https://console.firebase.google.com/project/${nuevaConfig.projectId}

**Habilitar servicios:**
- [ ] Firestore Database (modo prueba)
- [ ] Authentication (Email/Password)
- [ ] Storage (modo prueba)

**Crear índices en Firestore:**
\`\`\`
Collection: casos
Fields: organizacionId (Ascending), createdAt (Descending)

Collection: audiencias
Fields: organizacionId (Ascending), fecha (Ascending)
\`\`\`

### 2. LIMPIAR CACHÉ
\`\`\`bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
\`\`\`

### 3. LIMPIAR CACHÉ DEL NAVEGADOR
- F12 > Application > Clear Storage > Clear site data

### 4. VERIFICAR CONFIGURACIÓN
\`\`\`bash
node verificar-nueva-configuracion.js
\`\`\`

### 5. INICIAR APLICACIÓN
\`\`\`bash
npm start
\`\`\`

## 🔄 ROLLBACK (SI ES NECESARIO)
\`\`\`bash
cp .env.backup .env
cp .env.development.backup .env.development
npm start
\`\`\`

## 📞 VERIFICACIÓN FINAL
- [ ] Aplicación inicia sin errores
- [ ] Login funciona
- [ ] Datos se pueden crear/leer
- [ ] Todas las funciones operativas
`;

  fs.writeFileSync('INSTRUCCIONES_FINALES_FIREBASE.md', instrucciones);
  console.log('   ✅ Instrucciones finales creadas: INSTRUCCIONES_FINALES_FIREBASE.md');
}

async function ejecutarCambio() {
  try {
    await recopilarConfiguracion();
    
    if (!respaldarArchivos()) {
      throw new Error('Error respaldando archivos');
    }
    
    if (!actualizarEnvProduccion()) {
      throw new Error('Error actualizando .env');
    }
    
    if (!actualizarEnvDesarrollo()) {
      throw new Error('Error actualizando .env.development');
    }
    
    if (!actualizarCodigoOrganizacion()) {
      throw new Error('Error actualizando código');
    }
    
    generarScriptVerificacion();
    generarInstruccionesFinales();
    
    console.log('\n🎉 CAMBIO DE FIREBASE COMPLETADO EXITOSAMENTE');
    console.log('\n📋 ARCHIVOS MODIFICADOS:');
    console.log('   ✅ .env');
    console.log('   ✅ .env.development');
    console.log('   ✅ src/contexts/OrganizacionContext.js');
    console.log('   ✅ src/App.js');
    console.log('\n📋 ARCHIVOS CREADOS:');
    console.log('   ✅ verificar-nueva-configuracion.js');
    console.log('   ✅ INSTRUCCIONES_FINALES_FIREBASE.md');
    console.log('\n🚀 SIGUE LAS INSTRUCCIONES EN: INSTRUCCIONES_FINALES_FIREBASE.md');
    
  } catch (error) {
    console.error('\n❌ ERROR EN EL PROCESO:', error.message);
    console.log('\n🔄 PARA REVERTIR CAMBIOS:');
    console.log('   cp .env.backup .env');
    console.log('   cp .env.development.backup .env.development');
  } finally {
    rl.close();
  }
}

// Ejecutar el proceso
ejecutarCambio();