/**
 * LEYIA AI PRO - Motor de IA Jurídica Profesional
 * Arquitectura separada: input → normalización → intención → slots → contexto → decisión → ejecución → respuesta
 */

class LeyiaAIPro {
  constructor() {
    this.session = {
      pendingIntent: null,
      missingSlots: [],
      collectedSlots: {},
      conversationHistory: [],
      suppressMetaResponses: false
    };
    
    this.trainingExamples = this.initializeTrainingExamples();
    this.intentDefinitions = this.initializeIntentDefinitions();
    
    console.log('🧠 LEYIA AI PRO inicializada - Arquitectura profesional');
  }

  /**
   * FASE 2: DOMINAR LOS 4 CASOS CLAVE
   */
  initializeTrainingExamples() {
    return {
      programar_audiencia: [
        "agenda audiencia", "programa audiencia", "pon audiencia", "agrega audiencia",
        "el 19 tengo audiencia", "audiencia el lunes a las 11", "señala audiencia",
        "marca audiencia", "cita para", "reunion judicial", "audiencia para el",
        "programa para", "agenda para", "cita el", "audiencia mañana"
      ],
      consultar_audiencia: [
        "que audiencias tengo", "cuando es mi audiencia", "audiencias de hoy",
        "calendario", "agenda", "citas", "que tengo programado", "audiencias pendientes",
        "proximas audiencias", "audiencias esta semana", "cuando tengo audiencia"
      ],
      crear_expediente: [
        "crea expediente", "nuevo expediente", "registra caso", "abre expediente",
        "inicia proceso", "nuevo caso", "crear caso", "expediente para",
        "quiero crear", "necesito expediente", "hacer expediente", "generar expediente"
      ],
      consultar_expediente: [
        "busca expediente", "donde esta", "existe el", "informacion del",
        "estado del", "consulta", "ver expediente", "mostrar caso", "datos del",
        "como va el", "situacion del", "revisar expediente", "expediente numero"
      ],
      actualizar_expediente: [
        "actualiza expediente", "modifica expediente", "cambia expediente", "corrige expediente",
        "actualiza este expediente", "actualiza el expediente", "modifica este expediente",
        "integra expediente", "procesa expediente", "edita expediente", "guarda expediente",
        "registra expediente", "carga expediente", "sincroniza expediente", "refresca expediente",
        "pon al dia expediente", "revisa expediente", "presenta expediente"
      ],
      procesar_jurisprudencia: [
        "procesa jurisprudencia", "analiza jurisprudencia", "extrae jurisprudencia", "lee jurisprudencia",
        "nueva jurisprudencia", "agregar jurisprudencia", "cargar jurisprudencia", "subir jurisprudencia",
        "procesa este documento", "analiza este archivo", "extrae datos del documento",
        "lee este archivo", "procesa sentencia", "analiza sentencia", "jurisprudencia del archivo"
      ]
    };
  }

  /**
   * DEFINICIONES DE INTENCIONES CON SLOTS REQUERIDOS
   */
  initializeIntentDefinitions() {
    return {
      programar_audiencia: {
        requiredSlots: ['fecha'],
        optionalSlots: ['hora', 'expediente', 'tipo_audiencia'],
        priority: 1
      },
      consultar_audiencia: {
        requiredSlots: [],
        optionalSlots: ['fecha', 'expediente'],
        priority: 2
      },
      crear_expediente: {
        requiredSlots: ['cliente'],
        optionalSlots: ['tipo', 'materia', 'expediente_numero'],
        priority: 1
      },
      consultar_expediente: {
        requiredSlots: ['expediente_numero'],
        optionalSlots: ['tipo_consulta'],
        priority: 1
      },
      actualizar_expediente: {
        requiredSlots: [],
        optionalSlots: ['expediente_numero', 'informacion_judicial', 'datos_expediente'],
        priority: 1
      },
      procesar_jurisprudencia: {
        requiredSlots: [],
        optionalSlots: ['archivo_contenido', 'nombre_archivo'],
        priority: 1
      }
    };
  }

  /**
   * PIPELINE PRINCIPAL - ARQUITECTURA SEPARADA
   */
  async processMessage(input, externalFunctions = {}) {
    console.log('🎯 LEYIA AI PRO - Procesando:', input);

    // PASO 1: NORMALIZACIÓN
    const normalizedInput = this.normalizeInput(input);
    
    // PASO 2: DETECCIÓN DE INTENCIÓN
    const detectedIntent = this.detectIntent(normalizedInput);
    
    // PASO 3: EXTRACCIÓN DE SLOTS
    const extractedSlots = this.extractEntities(normalizedInput, detectedIntent);
    
    // PASO 4: RESOLUCIÓN DE CONTEXTO (CRÍTICO)
    const contextResult = this.resolveContext(detectedIntent, extractedSlots);
    
    // PASO 5: DECISIÓN
    const decision = this.decideAction(contextResult);
    
    // PASO 6: EJECUCIÓN
    const executionResult = await this.executeAction(decision, externalFunctions);
    
    // PASO 7: RESPUESTA
    const response = this.formatResponse(executionResult, decision);
    
    // ACTUALIZAR SESIÓN
    this.updateSession(input, detectedIntent, extractedSlots, decision);
    
    return response;
  }

  /**
   * PASO 1: NORMALIZACIÓN
   */
  normalizeInput(input) {
    return input
      .toLowerCase()
      .trim()
      .replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e').replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o').replace(/[úùüû]/g, 'u').replace(/ñ/g, 'n')
      .replace(/\s+/g, ' ');
  }

  /**
   * PASO 2: DETECCIÓN DE INTENCIÓN (TOLERANCIA AL CAOS HUMANO)
   */
  detectIntent(normalizedInput) {
    console.log('🔍 Detectando intención...');
    
    // REGLA CRÍTICA: Si hay intención pendiente, evaluar si es completado
    if (this.session.pendingIntent && this.session.missingSlots.length > 0) {
      console.log('⏳ Hay intención pendiente:', this.session.pendingIntent);
      
      // Verificar si el input aporta datos para slots faltantes
      const slotsFromInput = this.extractEntities(normalizedInput, this.session.pendingIntent);
      const hasRelevantSlots = Object.keys(slotsFromInput).some(slot => 
        this.session.missingSlots.includes(slot)
      );
      
      if (hasRelevantSlots) {
        console.log('✅ Input completa slots pendientes');
        return {
          intent: this.session.pendingIntent,
          confidence: 95,
          isCompletion: true
        };
      }
    }
    
    // REGLA ESPECIAL: Detectar "actualizar expediente" con alta prioridad
    if (normalizedInput.includes('actualiza') || normalizedInput.includes('actualizar')) {
      console.log('🎯 Detectada palabra clave "actualizar" - Prioridad alta');
      return {
        intent: 'actualizar_expediente',
        confidence: 95,
        isCompletion: false
      };
    }
    
    let bestIntent = null;
    let bestScore = 0;
    
    // Evaluar similitud con ejemplos de entrenamiento
    Object.keys(this.trainingExamples).forEach(intent => {
      const examples = this.trainingExamples[intent];
      let maxSimilarity = 0;
      
      examples.forEach(example => {
        const similarity = this.calculateSimilarity(normalizedInput, example);
        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
        }
      });
      
      if (maxSimilarity > bestScore) {
        bestScore = maxSimilarity;
        bestIntent = intent;
      }
    });
    
    // Umbral mínimo de confianza para evitar falsos positivos
    if (bestScore < 40) {
      bestIntent = null;
      bestScore = 0;
    }
    
    console.log(`🎯 Mejor intención: ${bestIntent} (${bestScore}%)`);
    
    return {
      intent: bestIntent,
      confidence: bestScore,
      isCompletion: false
    };
  }

  /**
   * SIMILITUD SEMÁNTICA (NO IGUALDAD)
   */
  calculateSimilarity(input, example) {
    const inputWords = input.split(' ');
    const exampleWords = example.split(' ');
    
    let matches = 0;
    let totalWords = Math.max(inputWords.length, exampleWords.length);
    
    inputWords.forEach(word => {
      if (exampleWords.some(exWord => 
        exWord.includes(word) || word.includes(exWord) || 
        this.areSynonyms(word, exWord)
      )) {
        matches++;
      }
    });
    
    // Bonificación por palabras clave específicas
    if (input.includes('crea') || input.includes('nuevo') || input.includes('registra')) {
      if (example.includes('crea') || example.includes('nuevo') || example.includes('registra')) {
        matches += 2; // Bonificación extra para crear
      }
    }
    
    return Math.round((matches / totalWords) * 100);
  }

  /**
   * SINÓNIMOS JURÍDICOS BÁSICOS
   */
  areSynonyms(word1, word2) {
    const synonymGroups = [
      ['audiencia', 'cita', 'reunion', 'encuentro'],
      ['expediente', 'caso', 'proceso'],
      ['programa', 'agenda', 'marca', 'señala'],
      ['busca', 'consulta', 'ver', 'mostrar'],
      ['crea', 'nuevo', 'registra', 'abre']
    ];
    
    return synonymGroups.some(group => 
      group.includes(word1) && group.includes(word2)
    );
  }

  /**
   * PASO 3: EXTRACCIÓN DE ENTIDADES (SLOTS)
   */
  extractEntities(input, intent) {
    const slots = {};
    
    // Extraer fechas
    const fechaPatterns = [
      /(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(?:\s+del?\s+(\d{4}))?/i,
      /(lunes|martes|miercoles|jueves|viernes|sabado|domingo)/i,
      /(hoy|mañana|pasado mañana)/i,
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/
    ];
    
    fechaPatterns.forEach(pattern => {
      const match = input.match(pattern);
      if (match) {
        slots.fecha = match[0];
      }
    });
    
    // Extraer horas
    const horaPatterns = [
      /(\d{1,2}):(\d{2})\s*(am|pm)?/i,
      /a\s+las\s+(\d{1,2})/i,
      /(\d{1,2})\s*(am|pm)/i
    ];
    
    horaPatterns.forEach(pattern => {
      const match = input.match(pattern);
      if (match) {
        slots.hora = match[0];
      }
    });
    
    // Extraer números de expediente
    const expPatterns = [
      /(\d{3,6}[-]\d{4}[-]\d+[-]\d{4}[-][A-Z]{2}[-][A-Z]{2}[-]?\d*)/i,
      /expediente\s+(\d+)/i,
      /caso\s+(\d+)/i,
      /(\d{3,8})/
    ];
    
    expPatterns.forEach(pattern => {
      const match = input.match(pattern);
      if (match) {
        // Validar que no sea un año
        const numero = match[1];
        if (!/^(202[0-9])$/.test(numero)) {
          slots.expediente_numero = numero;
        }
      }
    });
    
    // Extraer nombres de clientes
    const nombrePattern = /(?:para|cliente|señor|señora)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)/i;
    const nombreMatch = input.match(nombrePattern);
    if (nombreMatch) {
      slots.cliente = nombreMatch[1];
    }
    
    // Detectar información judicial completa (para actualizar expedientes)
    const patronesJudiciales = [
      /EXPEDIENTE\s*N°?\s*:/i,
      /Expediente\s*N°?\s*:/i,
      /JUEZ\s*:/i,
      /Juez\s*:/i,
      /ESPECIALISTA\s*:/i,
      /Especialista\s*:/i,
      /ÓRGANO JURISDICCIONAL/i,
      /Órgano Jurisdiccional/i,
      /DISTRITO JUDICIAL/i,
      /Distrito Judicial/i,
      /PARTES PROCESALES/i,
      /Partes Procesales/i
    ];
    
    let patronesEncontrados = 0;
    patronesJudiciales.forEach(patron => {
      if (patron.test(input)) {
        patronesEncontrados++;
      }
    });
    
    if (patronesEncontrados >= 2) {
      slots.informacion_judicial = input; // Guardar toda la información
      slots.datos_expediente = input;
    }
    
    console.log('📋 Slots extraídos:', slots);
    return slots;
  }

  /**
   * PASO 4: RESOLUCIÓN DE CONTEXTO (AQUÍ ESTÁ TU BUG SOLUCIONADO)
   */
  resolveContext(detectedIntent, extractedSlots) {
    console.log('🧠 Resolviendo contexto...');
    
    if (!detectedIntent.intent) {
      return { action: 'fallback', reason: 'no_intent' };
    }
    
    const intentDef = this.intentDefinitions[detectedIntent.intent];
    if (!intentDef) {
      return { action: 'fallback', reason: 'unknown_intent' };
    }
    
    // Si es completado de intención pendiente
    if (detectedIntent.isCompletion) {
      // Combinar slots existentes con nuevos
      const allSlots = { ...this.session.collectedSlots, ...extractedSlots };
      
      // Verificar si ahora tenemos todo lo necesario
      const stillMissing = intentDef.requiredSlots.filter(slot => !allSlots[slot]);
      
      if (stillMissing.length === 0) {
        return {
          action: 'execute',
          intent: this.session.pendingIntent,
          slots: allSlots,
          reason: 'completion_ready'
        };
      } else {
        return {
          action: 'ask_missing',
          intent: this.session.pendingIntent,
          slots: allSlots,
          missingSlots: stillMissing,
          reason: 'still_missing_slots'
        };
      }
    }
    
    // Nueva intención
    const allSlots = { ...extractedSlots };
    const missingSlots = intentDef.requiredSlots.filter(slot => !allSlots[slot]);
    
    if (missingSlots.length === 0) {
      return {
        action: 'execute',
        intent: detectedIntent.intent,
        slots: allSlots,
        reason: 'ready_to_execute'
      };
    } else {
      return {
        action: 'ask_missing',
        intent: detectedIntent.intent,
        slots: allSlots,
        missingSlots: missingSlots,
        reason: 'missing_required_slots'
      };
    }
  }

  /**
   * PASO 5: DECISIÓN
   */
  decideAction(contextResult) {
    console.log('⚡ Decidiendo acción:', contextResult.action);
    
    // Suprimir respuestas meta si ya resolvimos algo
    if (contextResult.action === 'execute') {
      this.session.suppressMetaResponses = true;
    }
    
    return contextResult;
  }

  /**
   * PASO 6: EJECUCIÓN
   */
  async executeAction(decision, externalFunctions) {
    console.log('🚀 Ejecutando acción...');
    
    switch (decision.action) {
      case 'execute':
        return await this.executeIntent(decision, externalFunctions);
        
      case 'ask_missing':
        return this.askForMissingSlots(decision);
        
      case 'fallback':
        return this.handleFallback(decision);
        
      default:
        return { success: false, message: 'Acción desconocida' };
    }
  }

  /**
   * EJECUTAR INTENCIÓN COMPLETA
   */
  async executeIntent(decision, externalFunctions) {
    const { intent, slots } = decision;
    
    switch (intent) {
      case 'programar_audiencia':
        if (externalFunctions.programarAudiencia) {
          return await externalFunctions.programarAudiencia(slots);
        }
        return { success: true, message: `Audiencia programada para ${slots.fecha}${slots.hora ? ` a las ${slots.hora}` : ''}` };
        
      case 'consultar_audiencia':
        if (externalFunctions.consultarAudiencia) {
          return await externalFunctions.consultarAudiencia(slots);
        }
        return { success: true, message: 'Consultando audiencias...' };
        
      case 'crear_expediente':
        if (externalFunctions.crearExpediente) {
          return await externalFunctions.crearExpediente(slots);
        }
        return { success: true, message: `Expediente creado para ${slots.cliente}` };
        
      case 'consultar_expediente':
        if (externalFunctions.consultarExpediente) {
          return await externalFunctions.consultarExpediente(slots);
        }
        return { success: true, message: `Consultando expediente ${slots.expediente_numero}` };
        
      case 'actualizar_expediente':
        if (externalFunctions.actualizarExpediente) {
          return await externalFunctions.actualizarExpediente(slots);
        }
        return { success: true, message: `Actualizando expediente${slots.expediente_numero ? ` ${slots.expediente_numero}` : ''}` };
        
      case 'procesar_jurisprudencia':
        if (externalFunctions.procesarJurisprudencia) {
          return await externalFunctions.procesarJurisprudencia(slots);
        }
        return { success: true, message: 'Procesando jurisprudencia...' };
        
      default:
        return { success: false, message: 'Intención no implementada' };
    }
  }

  /**
   * PREGUNTAR POR SLOTS FALTANTES
   */
  askForMissingSlots(decision) {
    const { intent, missingSlots } = decision;
    
    const slotQuestions = {
      fecha: '📅 ¿Para qué fecha?',
      hora: '⏰ ¿A qué hora?',
      expediente_numero: '📂 ¿Cuál es el número del expediente?',
      cliente: '👤 ¿Para qué cliente?',
      expediente: '📂 ¿Para qué expediente?'
    };
    
    const question = slotQuestions[missingSlots[0]] || '❓ Necesito más información';
    
    return {
      success: true,
      message: question,
      needsInput: true,
      missingSlots
    };
  }

  /**
   * MANEJAR FALLBACK
   */
  handleFallback(decision) {
    // Mejorar detección de fallback real
    if (decision.reason === 'no_intent') {
      return {
        success: true,
        message: '🤔 No entendí tu solicitud.\n\nPuedo ayudarte con:\n• Programar audiencias\n• Consultar expedientes\n• Crear casos\n• Ver calendario'
      };
    }
    
    if (this.session.suppressMetaResponses) {
      return { success: true, message: 'No entendí. ¿Puedes ser más específico?' };
    }
    
    return {
      success: true,
      message: '🤔 No entendí tu solicitud.\n\nPuedo ayudarte con:\n• Programar audiencias\n• Consultar expedientes\n• Crear casos\n• Ver calendario'
    };
  }

  /**
   * PASO 7: FORMATEAR RESPUESTA
   */
  formatResponse(executionResult, decision) {
    if (!executionResult.success) {
      return `❌ ${executionResult.message}`;
    }
    
    // BLOQUEAR RESPUESTAS INÚTILES
    if (this.session.suppressMetaResponses && executionResult.needsInput) {
      return executionResult.message;
    }
    
    return executionResult.message;
  }

  /**
   * ACTUALIZAR SESIÓN
   */
  updateSession(input, detectedIntent, extractedSlots, decision) {
    // Actualizar historial
    this.session.conversationHistory.push({
      input,
      intent: detectedIntent.intent,
      slots: extractedSlots,
      timestamp: new Date()
    });
    
    // Mantener solo últimos 5 mensajes
    if (this.session.conversationHistory.length > 5) {
      this.session.conversationHistory = this.session.conversationHistory.slice(-5);
    }
    
    // Actualizar estado de intención pendiente
    if (decision.action === 'ask_missing') {
      this.session.pendingIntent = decision.intent;
      this.session.missingSlots = decision.missingSlots;
      this.session.collectedSlots = decision.slots;
    } else if (decision.action === 'execute') {
      // Limpiar sesión después de ejecutar
      this.session.pendingIntent = null;
      this.session.missingSlots = [];
      this.session.collectedSlots = {};
    }
    
    console.log('📊 Sesión actualizada:', {
      pendingIntent: this.session.pendingIntent,
      missingSlots: this.session.missingSlots,
      collectedSlots: this.session.collectedSlots
    });
  }

  /**
   * PERSONALIDAD COMO SISTEMA (FASE 6)
   */
  applyPersonality(message) {
    // Reglas duras de personalidad
    let response = message;
    
    // Máximo 5 líneas
    const lines = response.split('\n');
    if (lines.length > 5) {
      response = lines.slice(0, 5).join('\n');
    }
    
    // Humor solo al final (si es éxito)
    if (response.includes('✅') && Math.random() > 0.7) {
      response += '\n\nYo aviso, tú mandas.';
    }
    
    return response;
  }

  /**
   * RESET DE SESIÓN
   */
  resetSession() {
    this.session = {
      pendingIntent: null,
      missingSlots: [],
      collectedSlots: {},
      conversationHistory: [],
      suppressMetaResponses: false
    };
    console.log('🔄 Sesión reiniciada');
  }
}

export default LeyiaAIPro;