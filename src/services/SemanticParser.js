/**
 * LEYIA - Parser Semántico con Jerarquía Cognitiva Correcta
 * Regla 1: FECHAS SE PARSEAN ANTES QUE TODO
 * Regla 2: Contexto conversacional preservado
 * Regla 3: Prioridad semántica sobre coincidencias numéricas
 */

class SemanticParser {
  constructor() {
    this.debug = true;
    this.contextoConversacional = null; // Estado de conversación pendiente
  }

  /**
   * PASO 1: Extracción de fechas (PRIORIDAD MÁXIMA)
   * Esto NUNCA puede fallar o confundirse con expedientes
   */
  extraerFechasNaturales(texto) {
    const fechas = {};
    
    // Patrones de fecha en lenguaje natural (ORDEN DE PRIORIDAD)
    const patronesFecha = [
      // Formato completo con año
      {
        patron: /(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+del?\s+(\d{4})/i,
        tipo: 'completa_con_año',
        extractor: (match) => ({
          dia: match[1],
          mes: match[2],
          año: match[3],
          textoOriginal: match[0]
        })
      },
      // Formato sin "del"
      {
        patron: /(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+(\d{4})/i,
        tipo: 'completa_sin_del',
        extractor: (match) => ({
          dia: match[1],
          mes: match[2],
          año: match[3],
          textoOriginal: match[0]
        })
      },
      // Formato americano
      {
        patron: /(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+(\d{1,2}),?\s+(\d{4})/i,
        tipo: 'americana',
        extractor: (match) => ({
          mes: match[1],
          dia: match[2],
          año: match[3],
          textoOriginal: match[0]
        })
      },
      // Solo día y mes (año actual)
      {
        patron: /(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i,
        tipo: 'sin_año',
        extractor: (match) => ({
          dia: match[1],
          mes: match[2],
          año: new Date().getFullYear().toString(),
          textoOriginal: match[0]
        })
      },
      // Formato numérico
      {
        patron: /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
        tipo: 'numerica',
        extractor: (match) => ({
          dia: match[1],
          mes: this.numeroAMes(match[2]),
          año: match[3],
          textoOriginal: match[0]
        })
      }
    ];

    // Buscar fechas con PRIORIDAD ESTRICTA
    for (const {patron, tipo, extractor} of patronesFecha) {
      const match = texto.match(patron);
      if (match) {
        const fechaExtraida = extractor(match);
        
        // VALIDACIÓN ANTI-ERROR: Verificar que el año sea válido
        const año = parseInt(fechaExtraida.año);
        if (año >= 2020 && año <= 2030) { // Rango válido para casos legales
          fechas.fecha = {
            ...fechaExtraida,
            tipo,
            fechaISO: this.convertirAISO(fechaExtraida),
            confianza: 95
          };
          
          break; // PRIMERA fecha válida gana
        } else {
          // Año inválido descartado
        }
      }
    }

    return fechas;
  }

  /**
   * PASO 2: Extracción de horas
   */
  extraerHoras(texto) {
    const horas = {};
    
    const patronesHora = [
      // "a horas 11:00" o "a horas 11"
      {
        patron: /a\s+horas?\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i,
        extractor: (match) => ({
          hora: match[1],
          minutos: match[2] || '00',
          periodo: match[3] || this.inferirPeriodo(match[1]),
          textoOriginal: match[0]
        })
      },
      // "11:00 AM" o "11 AM"
      {
        patron: /(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i,
        extractor: (match) => ({
          hora: match[1],
          minutos: match[2] || '00',
          periodo: match[3],
          textoOriginal: match[0]
        })
      },
      // "a las 11" o "a las 11:00"
      {
        patron: /a\s+las\s+(\d{1,2})(?::(\d{2}))?/i,
        extractor: (match) => ({
          hora: match[1],
          minutos: match[2] || '00',
          periodo: this.inferirPeriodo(match[1]),
          textoOriginal: match[0]
        })
      }
    ];

    for (const {patron, extractor} of patronesHora) {
      const match = texto.match(patron);
      if (match) {
        horas.hora = extractor(match);
        break;
      }
    }

    return horas;
  }

  /**
   * PASO 3: Detección de intenciones (DESPUÉS de fechas)
   */
  detectarIntencion(texto) {
    const intenciones = {
      REGISTRAR_AUDIENCIA: {
        patrones: [
          'agrega.*audiencia.*calendario',
          'registra.*audiencia',
          'programa.*audiencia',
          'audiencia.*calendario',
          'nueva.*audiencia',
          'crear.*audiencia'
        ],
        confianza: 90
      },
      PROGRAMAR_AUDIENCIA_EXPEDIENTE: {
        patrones: [
          'programa.*audiencia.*expediente',
          'audiencia.*para.*expediente',
          'señala.*audiencia'
        ],
        confianza: 85
      }
    };

    for (const [nombre, config] of Object.entries(intenciones)) {
      for (const patron of config.patrones) {
        if (new RegExp(patron, 'i').test(texto)) {
          return {
            intencion: nombre,
            confianza: config.confianza
          };
        }
      }
    }

    return null;
  }

  /**
   * PASO 4: Extracción de expedientes (ÚLTIMA PRIORIDAD)
   * Solo después de que fechas e intenciones estén claras
   */
  extraerExpedientes(texto) {
    const expedientes = {};
    
    // REGLA ANTI-ERROR: Si ya detectamos una fecha, ser MÁS ESTRICTO con expedientes
    const patronesExpediente = [
      // Formato judicial completo (MÁS ESTRICTO)
      /(\d{5}-\d{4}-\d+-\d{4}-[A-Z]{2}-[A-Z]{2}-\d{2})/,
      // Formato con guiones (MÍNIMO 3 partes)
      /(\d{3,5}-\d{4}-[A-Z0-9\-]+)/,
      // Solo números largos (MÍNIMO 8 dígitos para evitar años)
      /\b(\d{8,})\b/
    ];

    for (const patron of patronesExpediente) {
      const matches = [...texto.matchAll(new RegExp(patron, 'g'))];
      for (const match of matches) {
        const numeroCandidate = match[1];
        
        // VALIDACIÓN ANTI-ERROR CRÍTICA
        if (this.esExpedienteValido(numeroCandidate)) {
          expedientes.numero_expediente = numeroCandidate;
          return expedientes;
        } else {
          // Descartado como expediente
        }
      }
    }

    return expedientes;
  }

  /**
   * VALIDACIÓN ANTI-ERROR: Determinar si un número es realmente un expediente
   */
  esExpedienteValido(numero) {
    // REGLA 1: Si es solo un año (4 dígitos), NO es expediente
    if (/^\d{4}$/.test(numero) && parseInt(numero) >= 2020 && parseInt(numero) <= 2030) {
      console.log(`🚫 ANTI-ERROR: ${numero} es un año, NO un expediente`);
      return false;
    }

    // REGLA 2: Si tiene guiones, es más probable que sea expediente
    if (numero.includes('-')) {
      return true;
    }

    // REGLA 3: Si es muy largo (8+ dígitos), podría ser expediente
    if (numero.length >= 8) {
      return true;
    }

    // REGLA 4: Números cortos sin contexto, probablemente NO son expedientes
    return false;
  }

  /**
   * CONTEXTO CONVERSACIONAL: Manejar preguntas pendientes
   */
  procesarConContexto(texto, contextoAnterior = null) {
    console.log('🧠 PROCESANDO CON CONTEXTO CONVERSACIONAL');
    
    // Si hay una pregunta pendiente, tratar input como respuesta
    if (this.contextoConversacional) {
      console.log('📝 Hay contexto pendiente:', this.contextoConversacional);
      
      // Combinar información anterior con nueva
      const entidadesCompletas = {
        ...this.contextoConversacional.entidadesExistentes,
        ...this.extraerEntidadesCompletas(texto)
      };
      
      // Limpiar contexto si ya tenemos todo lo necesario
      if (this.tieneInformacionCompleta(entidadesCompletas)) {
        this.contextoConversacional = null;
        return {
          esRespuestaContextual: true,
          entidades: entidadesCompletas,
          accion: 'ejecutar'
        };
      }
    }

    // Procesamiento normal
    return this.extraerEntidadesCompletas(texto);
  }

  /**
   * EXTRACCIÓN COMPLETA CON JERARQUÍA CORRECTA
   */
  extraerEntidadesCompletas(texto) {
    // Extraer entidades usando jerarquía correcta

    // PASO 1: FECHAS (PRIORIDAD MÁXIMA)
    const fechas = this.extraerFechasNaturales(texto);
    
    // PASO 2: HORAS
    const horas = this.extraerHoras(texto);
    
    // PASO 3: INTENCIONES
    const intencion = this.detectarIntencion(texto);
    
    // PASO 4: EXPEDIENTES (ÚLTIMA PRIORIDAD)
    const expedientes = this.extraerExpedientes(texto);

    // COMBINAR RESULTADOS
    const entidades = {
      ...fechas,
      ...horas,
      ...expedientes,
      intencion: intencion?.intencion,
      confianza: intencion?.confianza || 0,
      textoOriginal: texto
    };

    // Verificar si necesitamos más información
    if (intencion && !this.tieneInformacionCompleta(entidades)) {
      this.contextoConversacional = {
        intencion: intencion.intencion,
        entidadesExistentes: entidades,
        preguntasPendientes: this.determinarPreguntasPendientes(entidades)
      };
    }

    return entidades;
  }

  /**
   * DETERMINAR QUÉ INFORMACIÓN FALTA
   */
  tieneInformacionCompleta(entidades) {
    if (entidades.intencion === 'REGISTRAR_AUDIENCIA') {
      return entidades.fecha && entidades.hora; // Expediente es opcional para calendario
    }
    if (entidades.intencion === 'PROGRAMAR_AUDIENCIA_EXPEDIENTE') {
      return entidades.fecha && entidades.numero_expediente; // Hora es opcional
    }
    return false;
  }

  determinarPreguntasPendientes(entidades) {
    const pendientes = [];
    
    if (!entidades.fecha) pendientes.push('fecha');
    if (!entidades.hora && entidades.intencion === 'REGISTRAR_AUDIENCIA') pendientes.push('hora');
    if (!entidades.numero_expediente && entidades.intencion === 'PROGRAMAR_AUDIENCIA_EXPEDIENTE') pendientes.push('expediente');
    
    return pendientes;
  }

  /**
   * UTILIDADES
   */
  numeroAMes(numero) {
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                   'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return meses[parseInt(numero) - 1] || numero;
  }

  inferirPeriodo(hora) {
    const h = parseInt(hora);
    if (h >= 6 && h <= 11) return 'AM';
    if (h >= 12 && h <= 23) return 'PM';
    return h <= 6 ? 'AM' : 'PM'; // Asumir contexto
  }

  convertirAISO(fecha) {
    const meses = {
      'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
      'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
      'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
    };
    
    const mes = meses[fecha.mes.toLowerCase()] || fecha.mes;
    const dia = fecha.dia.padStart(2, '0');
    
    return `${fecha.año}-${mes}-${dia}`;
  }

  /**
   * GENERAR RESPUESTA INTELIGENTE
   */
  generarRespuesta(entidades) {
    if (this.contextoConversacional) {
      const pendientes = this.contextoConversacional.preguntasPendientes;
      
      if (pendientes.includes('hora') && pendientes.includes('expediente')) {
        return '⏰ ¿A qué hora y para qué expediente?\n\nEjemplo: "11:00 AM, expediente 00820-2022"';
      }
      if (pendientes.includes('hora')) {
        return '⏰ ¿A qué hora?\n\nEjemplo: "11:00 AM"';
      }
      if (pendientes.includes('expediente')) {
        return '📂 ¿Para qué expediente?\n\nEjemplo: "expediente 00820-2022"';
      }
    }

    // Respuesta de éxito
    if (entidades.fecha && entidades.intencion) {
      return this.generarConfirmacion(entidades);
    }

    return '🤔 No entendí tu solicitud.\n\nIntenta: "Agrega audiencia para el 19 de enero a las 11:00"';
  }

  generarConfirmacion(entidades) {
    const fecha = entidades.fecha;
    const hora = entidades.hora;
    const expediente = entidades.numero_expediente;

    let respuesta = '✅ Audiencia registrada\n\n';
    respuesta += `📅 Fecha: ${fecha.dia} de ${fecha.mes} de ${fecha.año}\n`;
    
    if (hora) {
      respuesta += `⏰ Hora: ${hora.hora}:${hora.minutos} ${hora.periodo}\n`;
    }
    
    if (expediente) {
      respuesta += `📂 Expediente: ${expediente}\n`;
    }

    return respuesta;
  }
}

export default SemanticParser;