// Test específico para el caso penal que está dando error
require('dotenv').config();

// Simular el entorno de React
global.process = {
  env: {
    REACT_APP_OPENAI_API_KEY: process.env.REACT_APP_OPENAI_API_KEY
  }
};

class OpenAIService {
  constructor() {
    this.apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    this.baseURL = 'https://api.openai.com/v1';
    
    if (!this.apiKey) {
      console.error('❌ OpenAI API Key no encontrada');
      throw new Error('OpenAI API Key no configurada');
    }
    
    console.log('🤖 OpenAI Service inicializado correctamente');
  }

  detectarComandoCreacion(mensaje) {
    const comandosCreacion = [
      'crear caso', 'crea caso', 'nuevo caso', 'crear expediente', 
      'crea expediente', 'nuevo expediente', 'agregar caso', 
      'registrar caso', 'registrar expediente', 'puedes crear',
      'crear un expediente', 'crear el expediente', 'generar expediente'
    ];
    
    const mensajeLower = mensaje.toLowerCase();
    
    // Detectar comandos directos
    const esComandoDirecto = comandosCreacion.some(comando => mensajeLower.includes(comando));
    
    // Detectar si contiene información judicial estructurada (indica creación)
    const tieneInfoJudicial = /expediente\s*:\s*\d+|juzgado|juez\s*:|especialista\s*:|delito\s*:|imputado\s*:/i.test(mensaje);
    
    return esComandoDirecto || tieneInfoJudicial;
  }

  async llamarOpenAI(mensajes, opciones = {}) {
    const defaultOptions = {
      model: 'gpt-4',
      temperature: 0.7,
      max_tokens: 1000
    };

    const config = { ...defaultOptions, ...opciones };

    // Validar que todos los mensajes tengan role y content
    const mensajesValidos = mensajes.filter(msg => {
      if (!msg.role || !msg.content) {
        console.warn('⚠️ Mensaje inválido filtrado:', msg);
        return false;
      }
      return true;
    });

    console.log('📤 Mensajes válidos a enviar:', mensajesValidos.length);
    console.log('📋 Estructura de mensajes:', mensajesValidos.map(m => ({ role: m.role, contentLength: m.content.length })));

    const requestBody = {
      model: config.model,
      messages: mensajesValidos,
      temperature: config.temperature,
      max_tokens: config.max_tokens
    };

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Error de OpenAI API:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      let errorMessage = 'Error de comunicación con OpenAI';
      
      if (response.status === 401) {
        errorMessage = 'API Key de OpenAI inválida';
      } else if (response.status === 429) {
        errorMessage = 'Límite de uso de OpenAI excedido';
      } else if (response.status === 500) {
        errorMessage = 'Error interno de OpenAI';
      } else if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('✅ Respuesta exitosa de OpenAI');
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Respuesta inválida de OpenAI');
    }

    return data.choices[0].message.content;
  }

  async procesarCreacionCaso(mensaje) {
    try {
      console.log('📋 OpenAI - Procesando creación de caso');
      
      const prompt = `Eres un asistente legal especializado en extraer información para crear expedientes jurídicos.

Analiza el siguiente mensaje y extrae ÚNICAMENTE los datos que estén explícitamente mencionados. NO inventes información.

Mensaje del usuario: "${mensaje}"

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta (usa null para campos no mencionados):
{
  "numero": "string o null",
  "cliente": "string o null", 
  "demandante": "string o null",
  "demandado": "string o null",
  "imputado": "string o null",
  "agraviado": "string o null",
  "tipo": "civil|penal|laboral|comercial|administrativo|familia o null",
  "descripcion": "string o null",
  "estado": "string o null",
  "prioridad": "alta|media|baja o null",
  "abogado": "string o null",
  "juez": "string o null",
  "especialista": "string o null",
  "juzgado": "string o null",
  "delito": "string o null",
  "observaciones": "string o null",
  "materia": "string o null"
}

REGLAS IMPORTANTES:
- Solo incluye datos que estén claramente mencionados en el mensaje
- Si no hay suficiente información, usa valores null
- El JSON debe ser válido y parseable
- No agregues texto adicional, solo el JSON
- Para el tipo, usa solo las opciones válidas listadas
- Si menciona "EXPEDIENTE :" extrae el número que sigue
- Si menciona "JUEZ :" extrae el nombre que sigue
- Si menciona "ESPECIALISTA :" extrae el nombre que sigue
- Si menciona "DELITO :" extrae el delito y usa tipo "penal"
- Si menciona "IMPUTADO :" extrae el nombre
- Si menciona "AGRAVIADO :" extrae el nombre
- Si el usuario menciona "divorcio", "matrimonio", "alimentos" = tipo "familia"
- Si menciona "despido", "trabajo", "laboral" = tipo "laboral"
- Si menciona "contrato", "empresa", "comercial" = tipo "comercial"
- Si menciona "delito", "penal", "robo", "asesinato" = tipo "penal"
- Por defecto usa tipo "civil" si no está claro`;

      const response = await this.llamarOpenAI([
        { role: 'system', content: prompt },
        { role: 'user', content: mensaje }
      ], {
        model: 'gpt-4',
        temperature: 0.1,
        max_tokens: 600
      });

      console.log('🤖 Respuesta de OpenAI:', response);
      
      // Limpiar y parsear la respuesta
      let jsonResponse = response.trim();
      
      // Remover markdown si existe
      if (jsonResponse.includes('```json')) {
        jsonResponse = jsonResponse.split('```json')[1].split('```')[0];
      } else if (jsonResponse.includes('```')) {
        jsonResponse = jsonResponse.split('```')[1];
      }
      
      const datosExtraidos = JSON.parse(jsonResponse);
      console.log('📊 Datos extraídos por OpenAI:', JSON.stringify(datosExtraidos, null, 2));
      
      return {
        success: true,
        tipo: 'creacion_caso',
        datos: datosExtraidos,
        mensaje_original: mensaje
      };
      
    } catch (error) {
      console.error('❌ Error procesando creación de caso:', error);
      return {
        success: false,
        error: error.message,
        tipo: 'error'
      };
    }
  }

  completarDatosCaso(datos) {
    const datosCompletos = { ...datos };
    
    // Generar número si no existe
    if (!datosCompletos.numero) {
      const fecha = new Date();
      const año = fecha.getFullYear();
      const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
      const dia = fecha.getDate().toString().padStart(2, '0');
      const hora = fecha.getHours().toString().padStart(2, '0');
      const minuto = fecha.getMinutes().toString().padStart(2, '0');
      const segundo = fecha.getSeconds().toString().padStart(2, '0');
      
      datosCompletos.numero = `EXP-${año}${mes}${dia}-${hora}${minuto}${segundo}`;
    }
    
    // Valores por defecto
    if (!datosCompletos.tipo) {
      datosCompletos.tipo = 'civil';
    }
    
    if (!datosCompletos.estado) {
      datosCompletos.estado = 'Activo';
    }
    
    if (!datosCompletos.prioridad) {
      datosCompletos.prioridad = 'media';
    }
    
    // Manejar cliente/demandante/imputado
    if (!datosCompletos.cliente) {
      if (datosCompletos.imputado) {
        datosCompletos.cliente = datosCompletos.imputado;
      } else if (datosCompletos.demandante) {
        datosCompletos.cliente = datosCompletos.demandante;
      } else {
        datosCompletos.cliente = 'Cliente por asignar';
      }
    }
    
    if (!datosCompletos.demandante) {
      if (datosCompletos.tipo === 'penal' && datosCompletos.imputado) {
        datosCompletos.demandante = 'Ministerio Público';
      } else {
        datosCompletos.demandante = datosCompletos.cliente;
      }
    }
    
    if (!datosCompletos.demandado) {
      if (datosCompletos.tipo === 'penal' && datosCompletos.imputado) {
        datosCompletos.demandado = datosCompletos.imputado;
      } else if (datosCompletos.agraviado) {
        datosCompletos.demandado = 'Por determinar';
      } else {
        datosCompletos.demandado = 'Por asignar';
      }
    }
    
    if (!datosCompletos.abogado) {
      datosCompletos.abogado = 'Por asignar';
    }
    
    // Manejar descripción/materia/delito
    if (!datosCompletos.descripcion) {
      if (datosCompletos.delito) {
        datosCompletos.descripcion = datosCompletos.delito;
      } else if (datosCompletos.materia) {
        datosCompletos.descripcion = datosCompletos.materia;
      } else {
        datosCompletos.descripcion = 'Caso por especificar';
      }
    }
    
    // Agregar información judicial adicional a observaciones
    const fechaCreacion = new Date().toLocaleDateString('es-ES');
    let observacionIA = `Expediente creado automáticamente por LEYIA IA con OpenAI el ${fechaCreacion}`;
    
    // Agregar información judicial si existe
    const infoJudicial = [];
    if (datosCompletos.juez) infoJudicial.push(`Juez: ${datosCompletos.juez}`);
    if (datosCompletos.especialista) infoJudicial.push(`Especialista: ${datosCompletos.especialista}`);
    if (datosCompletos.juzgado) infoJudicial.push(`Juzgado: ${datosCompletos.juzgado}`);
    if (datosCompletos.delito) infoJudicial.push(`Delito: ${datosCompletos.delito}`);
    if (datosCompletos.imputado) infoJudicial.push(`Imputado: ${datosCompletos.imputado}`);
    if (datosCompletos.agraviado) infoJudicial.push(`Agraviado: ${datosCompletos.agraviado}`);
    
    if (infoJudicial.length > 0) {
      observacionIA += `\n\nInformación judicial extraída:\n${infoJudicial.join('\n')}`;
    }
    
    if (datosCompletos.observaciones) {
      datosCompletos.observaciones += `\n\n${observacionIA}`;
    } else {
      datosCompletos.observaciones = observacionIA;
    }
    
    // Agregar metadatos
    datosCompletos.creadoPorIA = true;
    datosCompletos.fechaCreacionIA = new Date().toISOString();
    datosCompletos.servicioIA = 'OpenAI';
    
    console.log('📋 Datos completados:', JSON.stringify(datosCompletos, null, 2));
    
    return datosCompletos;
  }
}

// Test del caso específico
async function testCasoPenal() {
  try {
    console.log('🚀 TESTING CASO PENAL ESPECÍFICO');
    console.log('=' .repeat(80));
    
    const service = new OpenAIService();
    
    const mensaje = `puedes crear un expediente con esta información? JUZGADO PENAL DE INVEST. PREPARATORIA-Sede Panao EXPEDIENTE : 00298-2025-22-1207-JR-PE-01 JUEZ : MIGUEL BRAULIO GUTIERREZ SALVADOR ESPECIALISTA : DAMARIS TATIANA RODRIGUEZ ANGULO Ministerio Publico : Primera Fiscalía Penal Corporativa De Pachitea , IMPUTADO : ALANIA VILLANUEVA, GALVES ALANIA SIMON, TONNY FRANKLIN DELITO : ASESINATO AGRAVIADO : AQUINO ESPINOZA JUAN (+) REPRESENTADO POR SU SUCESION LEGAL SU ESPOSA, Perez Jesus, Rosalinda`;
    
    console.log('📝 Mensaje a procesar:');
    console.log(mensaje);
    console.log('\n' + '=' .repeat(80));
    
    // 1. Detectar si es comando de creación
    const esComando = service.detectarComandoCreacion(mensaje);
    console.log('🎯 Es comando de creación:', esComando);
    
    if (!esComando) {
      console.log('❌ No se detectó como comando de creación');
      return;
    }
    
    // 2. Procesar creación de caso
    console.log('\n📋 Procesando creación de caso...');
    const resultado = await service.procesarCreacionCaso(mensaje);
    
    if (!resultado.success) {
      console.error('❌ Error en procesamiento:', resultado.error);
      return;
    }
    
    console.log('✅ Datos extraídos exitosamente');
    
    // 3. Completar datos
    console.log('\n🔧 Completando datos faltantes...');
    const datosCompletos = service.completarDatosCaso(resultado.datos);
    
    console.log('\n✅ RESULTADO FINAL:');
    console.log('=' .repeat(80));
    console.log('📊 Expediente que se crearía:');
    console.log(`• Número: ${datosCompletos.numero}`);
    console.log(`• Cliente: ${datosCompletos.cliente}`);
    console.log(`• Tipo: ${datosCompletos.tipo.toUpperCase()}`);
    console.log(`• Demandante: ${datosCompletos.demandante}`);
    console.log(`• Demandado: ${datosCompletos.demandado}`);
    console.log(`• Descripción: ${datosCompletos.descripcion}`);
    console.log(`• Estado: ${datosCompletos.estado}`);
    console.log(`• Prioridad: ${datosCompletos.prioridad}`);
    console.log('\n📝 Observaciones:');
    console.log(datosCompletos.observaciones);
    
    console.log('\n🎉 TEST COMPLETADO EXITOSAMENTE');
    
  } catch (error) {
    console.error('❌ ERROR EN TEST:', error.message);
    console.error('Stack:', error.stack);
    
    if (error.message.includes('API Key')) {
      console.log('\n🔧 SOLUCIÓN:');
      console.log('1. Verifica que el archivo .env tenga REACT_APP_OPENAI_API_KEY');
      console.log('2. Asegúrate de que la API key sea válida');
      console.log('3. Verifica que tengas créditos en tu cuenta de OpenAI');
    }
  }
}

// Ejecutar test
if (require.main === module) {
  testCasoPenal();
}

module.exports = { OpenAIService };