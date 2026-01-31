// OpenAI Service para LEYIA - Creación inteligente de casos
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

  // Función principal para procesar mensajes del chat
  async procesarMensaje(mensaje, contexto = []) {
    try {
      console.log('🤖 OpenAI - Procesando mensaje:', mensaje);
      
      // Detectar si es comando de creación de caso
      const esComandoCreacion = this.detectarComandoCreacion(mensaje);
      
      if (esComandoCreacion) {
        return await this.procesarCreacionCaso(mensaje);
      }
      
      // Procesar como consulta general
      return await this.procesarConsultaGeneral(mensaje, contexto);
      
    } catch (error) {
      console.error('❌ Error en OpenAI Service:', error);
      throw error;
    }
  }

  // Detectar si el mensaje es para crear un caso
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

  // Procesar creación de caso con OpenAI
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
      console.log('📊 Datos extraídos por OpenAI:', datosExtraidos);
      
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

  // Procesar consulta general
  async procesarConsultaGeneral(mensaje, contexto = []) {
    try {
      console.log('💬 OpenAI - Procesando consulta general');
      
      const systemPrompt = `Eres LEYIA, un asistente jurídico especializado y profesional. 

CAPACIDADES ESPECIALES:
🏗️ **Creación de Expedientes:** Puedo crear expedientes automáticamente. Solo dime "crear expediente" o "crear caso" seguido de los datos.

**Ejemplos de creación:**
- "Crear expediente para María García, caso de divorcio"
- "Nuevo caso laboral para Juan Pérez, despido injustificado"
- "Crear caso penal, robo agravado, imputado Carlos López"

INSTRUCCIONES:
- Responde de manera profesional y precisa sobre temas legales
- Si no estás seguro de algo, indícalo claramente
- Usa un lenguaje claro pero técnicamente correcto
- Mantén un tono profesional pero accesible
- Si el usuario quiere crear un caso, guíalo con el formato correcto

Responde a la siguiente consulta:`;

      // Construir mensajes de forma segura
      const mensajes = [
        { role: 'system', content: systemPrompt }
      ];

      // Agregar contexto solo si tiene el formato correcto
      if (contexto && Array.isArray(contexto)) {
        const contextoValido = contexto
          .slice(-5) // Últimos 5 mensajes
          .filter(msg => msg && msg.role && msg.content) // Solo mensajes válidos
          .map(msg => ({
            role: msg.role === 'ia' ? 'assistant' : msg.role, // Convertir 'ia' a 'assistant'
            content: msg.content || msg.texto || '' // Usar content o texto
          }))
          .filter(msg => msg.content.trim() !== ''); // Filtrar mensajes vacíos

        mensajes.push(...contextoValido);
      }

      // Agregar mensaje del usuario
      mensajes.push({ role: 'user', content: mensaje });

      console.log('📤 Mensajes a enviar:', mensajes.length);

      const response = await this.llamarOpenAI(mensajes, {
        model: 'gpt-4',
        temperature: 0.7,
        max_tokens: 800
      });

      return {
        success: true,
        tipo: 'consulta_general',
        respuesta: response,
        mensaje_original: mensaje
      };
      
    } catch (error) {
      console.error('❌ Error procesando consulta general:', error);
      return {
        success: false,
        error: error.message,
        tipo: 'error'
      };
    }
  }

  // Función para llamar a la API de OpenAI
  async llamarOpenAI(mensajes, opciones = {}) {
    const defaultOptions = {
      model: 'gpt-4',
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    };

    const config = { ...defaultOptions, ...opciones };

    const requestBody = {
      model: config.model,
      messages: mensajes,
      temperature: config.temperature,
      max_tokens: config.max_tokens,
      top_p: config.top_p,
      frequency_penalty: config.frequency_penalty,
      presence_penalty: config.presence_penalty
    };

    console.log('🔄 Enviando request a OpenAI:', {
      model: config.model,
      messages: mensajes.length,
      temperature: config.temperature
    });

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

  // Función para validar datos de caso extraídos
  validarDatosCaso(datos) {
    const errores = [];
    
    // Validar que al menos tengamos información mínima
    if (!datos.numero && !datos.cliente && !datos.descripcion && 
        !datos.materia && !datos.delito && !datos.imputado && !datos.demandante) {
      errores.push('Se necesita al menos: número de expediente, cliente, imputado, demandante, descripción, materia o delito');
    }
    
    // Validar tipo si está presente
    const tiposValidos = ['civil', 'penal', 'laboral', 'comercial', 'administrativo', 'familia'];
    if (datos.tipo && !tiposValidos.includes(datos.tipo)) {
      errores.push(`Tipo "${datos.tipo}" no válido. Tipos válidos: ${tiposValidos.join(', ')}`);
    }
    
    // Validar prioridad si está presente
    const prioridadesValidas = ['alta', 'media', 'baja'];
    if (datos.prioridad && !prioridadesValidas.includes(datos.prioridad)) {
      errores.push(`Prioridad "${datos.prioridad}" no válida. Prioridades válidas: ${prioridadesValidas.join(', ')}`);
    }
    
    return {
      valido: errores.length === 0,
      errores: errores
    };
  }

  // Función para generar número de expediente automático
  generarNumeroExpediente() {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const dia = fecha.getDate().toString().padStart(2, '0');
    const hora = fecha.getHours().toString().padStart(2, '0');
    const minuto = fecha.getMinutes().toString().padStart(2, '0');
    const segundo = fecha.getSeconds().toString().padStart(2, '0');
    
    return `EXP-${año}${mes}${dia}-${hora}${minuto}${segundo}`;
  }

  // Función para completar datos faltantes
  completarDatosCaso(datos) {
    const datosCompletos = { ...datos };
    
    // Generar número si no existe
    if (!datosCompletos.numero) {
      datosCompletos.numero = this.generarNumeroExpediente();
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
    
    // Limpiar campos que no van a la base de datos (mantener solo en observaciones)
    delete datosCompletos.imputado;
    delete datosCompletos.agraviado;
    delete datosCompletos.delito;
    delete datosCompletos.juez;
    delete datosCompletos.especialista;
    delete datosCompletos.juzgado;
    delete datosCompletos.materia;
    
    return datosCompletos;
  }
}

export default OpenAIService;