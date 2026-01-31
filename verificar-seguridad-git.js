// Script para verificar que no se suban credenciales a Git
const fs = require('fs');
const path = require('path');

console.log('🔒 VERIFICANDO SEGURIDAD ANTES DE COMMIT A GIT');
console.log('=' .repeat(60));

// Patrones peligrosos que no deben estar en el código
const patronesPeligrosos = [
  /sk-[a-zA-Z0-9]{48,}/g,                    // OpenAI API Keys reales
  /AIzaSy[a-zA-Z0-9_-]{33}/g,                // Google API Keys reales
  /AKIA[0-9A-Z]{16}/g,                       // AWS Access Keys
  /[0-9]+-[0-9A-Za-z_]{32}\.apps\.googleusercontent\.com/g, // Google OAuth
  /apiKey:\s*["\'][^"\']{30,}["\']/, // Firebase API Keys hardcoded (no variables de entorno)
  /REACT_APP_.*_API_KEY.*=.*["\'][a-zA-Z0-9]{20,}["\']/, // Variables de entorno hardcoded
];

// Archivos a verificar
const archivosVerificar = [
  'src/firebase.js',
  'src/services/OpenAIService.js',
  'src/components/ChatIAMinimal.js',
  '.env.example',
  'README.md'
];

let erroresEncontrados = 0;

function verificarArchivo(rutaArchivo) {
  if (!fs.existsSync(rutaArchivo)) {
    console.log(`⚠️  Archivo no encontrado: ${rutaArchivo}`);
    return;
  }

  const contenido = fs.readFileSync(rutaArchivo, 'utf8');
  console.log(`🔍 Verificando: ${rutaArchivo}`);

  for (const patron of patronesPeligrosos) {
    const matches = contenido.match(patron);
    if (matches) {
      console.error(`❌ PELIGRO: Credencial encontrada en ${rutaArchivo}`);
      console.error(`   Patrón: ${matches[0].substring(0, 20)}...`);
      erroresEncontrados++;
    }
  }

  // Verificaciones específicas
  if (rutaArchivo.includes('firebase.js')) {
    if (contenido.includes('process.env.REACT_APP_FIREBASE_API_KEY')) {
      console.log('✅ Firebase usa variables de entorno correctamente');
    } else {
      console.error('❌ Firebase no usa variables de entorno');
      erroresEncontrados++;
    }
  }

  if (rutaArchivo.includes('OpenAIService.js')) {
    if (contenido.includes('process.env.REACT_APP_OPENAI_API_KEY')) {
      console.log('✅ OpenAI usa variables de entorno correctamente');
    } else {
      console.error('❌ OpenAI no usa variables de entorno');
      erroresEncontrados++;
    }
  }
}

// Verificar archivos
archivosVerificar.forEach(verificarArchivo);

// Verificar .gitignore
console.log('\n🔍 Verificando .gitignore...');
if (fs.existsSync('.gitignore')) {
  const gitignore = fs.readFileSync('.gitignore', 'utf8');
  
  const patronesRequeridos = ['.env', '.env.*', '!.env.example'];
  let gitignoreOK = true;
  
  patronesRequeridos.forEach(patron => {
    if (!gitignore.includes(patron)) {
      console.error(`❌ .gitignore falta patrón: ${patron}`);
      gitignoreOK = false;
      erroresEncontrados++;
    }
  });
  
  if (gitignoreOK) {
    console.log('✅ .gitignore configurado correctamente');
  }
} else {
  console.error('❌ Archivo .gitignore no encontrado');
  erroresEncontrados++;
}

// Verificar que .env.example existe pero .env no se suba
console.log('\n🔍 Verificando archivos de entorno...');
if (fs.existsSync('.env.example')) {
  console.log('✅ .env.example existe (plantilla para otros desarrolladores)');
} else {
  console.error('❌ .env.example no existe');
  erroresEncontrados++;
}

if (fs.existsSync('.env')) {
  console.log('⚠️  .env existe localmente (normal, pero NO debe subirse a Git)');
} else {
  console.log('ℹ️  .env no existe (se creará cuando se configure)');
}

// Resultado final
console.log('\n' + '=' .repeat(60));
if (erroresEncontrados === 0) {
  console.log('✅ SEGURIDAD OK - Es seguro hacer commit a Git');
  console.log('🚀 No se encontraron credenciales expuestas');
  process.exit(0);
} else {
  console.error(`❌ PELIGRO - ${erroresEncontrados} problemas de seguridad encontrados`);
  console.error('🚨 NO HAGAS COMMIT hasta resolver estos problemas');
  process.exit(1);
}