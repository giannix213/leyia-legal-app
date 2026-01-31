/**
 * VERIFICAR MODELOS DISPONIBLES DE GEMINI
 * Ejecutar: node verificar-modelos-gemini.js
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function verificarModelosDisponibles() {
  console.log('🔍 VERIFICANDO MODELOS DISPONIBLES DE GEMINI...\n');
  
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ No se encontró REACT_APP_GEMINI_API_KEY en las variables de entorno');
    console.log('💡 Asegúrate de que esté configurada en .env o .env.development');
    return;
  }
  
  console.log('🔑 API Key encontrada:', apiKey.substring(0, 10) + '...');
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Lista de modelos a probar (modelos más comunes de 2026)
    const modelosAProbar = [
      'gemini-1.5-flash',
      'gemini-1.5-pro', 
      'gemini-1.0-pro',
      'gemini-pro',
      'gemini-pro-vision',
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro-latest'
    ];
    
    console.log('🧪 Probando modelos disponibles...\n');
    
    const modelosDisponibles = [];
    const modelosNoDisponibles = [];
    
    for (const nombreModelo of modelosAProbar) {
      try {
        console.log(`🔄 Probando modelo: ${nombreModelo}`);
        
        const model = genAI.getGenerativeModel({ model: nombreModelo });
        
        // Hacer una consulta simple para verificar que funciona
        const result = await model.generateContent('Hola, responde solo "OK"');
        const response = await result.response;
        const text = response.text();
        
        if (text) {
          console.log(`   ✅ ${nombreModelo}: DISPONIBLE`);
          modelosDisponibles.push(nombreModelo);
        } else {
          console.log(`   ❌ ${nombreModelo}: Sin respuesta`);
          modelosNoDisponibles.push(nombreModelo);
        }
        
      } catch (error) {
        console.log(`   ❌ ${nombreModelo}: ${error.message}`);
        modelosNoDisponibles.push(nombreModelo);
      }
    }
    
    console.log('\n📊 RESUMEN DE MODELOS:');
    console.log('\n✅ MODELOS DISPONIBLES:');
    if (modelosDisponibles.length > 0) {
      modelosDisponibles.forEach(modelo => {
        console.log(`   • ${modelo}`);
      });
    } else {
      console.log('   Ningún modelo disponible');
    }
    
    console.log('\n❌ MODELOS NO DISPONIBLES:');
    if (modelosNoDisponibles.length > 0) {
      modelosNoDisponibles.forEach(modelo => {
        console.log(`   • ${modelo}`);
      });
    } else {
      console.log('   Todos los modelos están disponibles');
    }
    
    // Recomendación
    console.log('\n🎯 RECOMENDACIÓN:');
    if (modelosDisponibles.length > 0) {
      const modeloRecomendado = modelosDisponibles[0];
      console.log(`   Usar modelo: ${modeloRecomendado}`);
      console.log(`   
   Actualizar ChatIAMinimal.js:
   const model = genAI.getGenerativeModel({ model: "${modeloRecomendado}" });
      `);
    } else {
      console.log('   ❌ No hay modelos disponibles. Verifica tu API key.');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
    
    if (error.message.includes('API_KEY_INVALID')) {
      console.log('\n💡 SOLUCIÓN: La API key no es válida');
      console.log('   1. Verifica que la API key sea correcta');
      console.log('   2. Asegúrate de que esté habilitada para Gemini API');
      console.log('   3. Verifica que no haya espacios extra');
    } else if (error.message.includes('QUOTA_EXCEEDED')) {
      console.log('\n💡 SOLUCIÓN: Cuota excedida');
      console.log('   1. Verifica tu cuota en Google AI Studio');
      console.log('   2. Espera a que se renueve la cuota');
      console.log('   3. Considera actualizar tu plan');
    } else {
      console.log('\n💡 SOLUCIÓN: Error de conexión');
      console.log('   1. Verifica tu conexión a internet');
      console.log('   2. Intenta nuevamente en unos minutos');
      console.log('   3. Verifica que la API esté habilitada');
    }
  }
}

// Ejecutar verificación
verificarModelosDisponibles();