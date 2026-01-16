/**
 * LEYIA - Motor de Intenciones Avanzado
 * Sistema de IA conversacional que entiende intenciones naturales
 */

import SemanticParser from './SemanticParser.js';

class IntentionEngine {
  constructor() {
    this.memoriaConversacional = [];
    this.entidadesContexto = new Map();
    this.configuracion = {
      maxMemoriaConversacional: 10,
      confianzaMinima: 40,
      debug: true
    };
    
    // INTEGRAR PARSER SEMÁNTICO CON JERARQUÍA CORRECTA
    this.semanticParser = new SemanticParser();
    console.log('🧠 IntentionEngine inicializado con SemanticParser integrado');
    
    this.inicializarIntenciones();
  }

  inicializarIntenciones() {
    this.intenciones = {
      // 1. GESTIÓN DE EXPEDIENTES
      ACTUALIZAR_EXPEDIENTE: {
        patrones: [
          'actualiza', 'actualizar', 'modifica', 'modificar', 'cambia', 'cambiar',
          'corrige', 'corregir', 'integra', 'integrar', 'presenta', 'presentar',
          'pon al dia', 'poner al dia', 'revisa', 'revisar', 'procesa', 'procesar',
          'edita', 'editar', 'guarda', 'guardar', 'registra', 'registrar',
          'carga', 'cargar', 'vuelve a presentar', 'haz cambios', 'hacer cambios',
          'sincroniza', 'sincronizar', 'refresca', 'refrescar'
        ],
        contexto: ['expediente', 'caso', 'exp', 'xp', 'proceso', 'informacion', 'datos'],
        entidadesRequeridas: ['numero_expediente'],
        entidadesOpcionales: ['informacion_judicial', 'datos_actualizacion'],
        confianzaMinima: 70,
        categoria: 'expedientes'
      },

      CONSULTAR_EXPEDIENTE: {
        patrones: [
          'busca', 'buscar', 'encuentra', 'encontrar', 'muestra', 'mostrar',
          'dame', 'dar', 'consulta', 'consultar', 'ver', 'revisar', 'mira', 'mirar',
          'hay', 'existe', 'tienes', 'tener', 'informacion', 'info', 'detalles',
          'estado', 'situacion', 'como esta', 'que tal', 'donde esta'
        ],
        contexto: ['expediente', 'caso', 'exp', 'xp', 'proceso', 'numero', 'informacion'],
        entidadesRequeridas: ['numero_expediente'],
        entidadesOpcionales: ['tipo_consulta'],
        confianzaMinima: 60,
        categoria: 'expedientes'
      },

      CREAR_EXPEDIENTE: {
        patrones: [
          'crea', 'crear', 'crees', 'nuevo', 'nueva', 'registra', 'registrar', 'inicia', 'iniciar',
          'abre', 'abrir', 'comienza', 'comenzar', 'empieza', 'empezar', 'genera', 'generar',
          'quiero que crees', 'quiero crear', 'necesito crear', 'voy a crear', 'hacer un',
          'hacer una', 'quiero que hagas', 'quiero un', 'quiero una', 'dame un', 'dame una'
        ],
        contexto: ['expediente', 'caso', 'exp', 'proceso', 'nuevo', 'nueva', 'un', 'una'],
        entidadesRequeridas: [],
        entidadesOpcionales: ['cliente', 'materia', 'tipo_proceso', 'informacion_basica'],
        confianzaMinima: 60,
        categoria: 'expedientes'
      },

      ELIMINAR_EXPEDIENTE: {
        patrones: [
          'elimina', 'eliminar', 'borra', 'borrar', 'archiva', 'archivar',
          'cierra', 'cerrar', 'termina', 'terminar', 'finaliza', 'finalizar',
          'quita', 'quitar', 'remueve', 'remover'
        ],
        contexto: ['expediente', 'caso', 'exp', 'proceso'],
        entidadesRequeridas: ['numero_expediente', 'confirmacion'],
        entidadesOpcionales: ['motivo'],
        confianzaMinima: 80,
        categoria: 'expedientes'
      },

      // 2. GESTIÓN DE AUDIENCIAS
      PROGRAMAR_AUDIENCIA: {
        patrones: [
          'señales', 'señalar', 'programa', 'programar', 'agenda', 'agendar',
          'marca', 'marcar', 'pon', 'poner', 'agrega', 'agregar', 'anota', 'anotar',
          'crea', 'crear', 'registra', 'registrar', 'coordina', 'coordinar',
          'establece', 'establecer', 'fija', 'fijar'
        ],
        contexto: ['calendario', 'audiencia', 'fecha', 'hora', 'cita', 'reunion', 'encuentro'],
        entidadesRequeridas: ['fecha', 'numero_expediente'],
        entidadesOpcionales: ['hora', 'tipo_audiencia', 'lugar'],
        confianzaMinima: 70,
        categoria: 'calendario'
      },

      REPROGRAMAR_AUDIENCIA: {
        patrones: [
          'reprograma', 'reprogramar', 'cambia', 'cambiar', 'mueve', 'mover',
          'modifica', 'modificar', 'ajusta', 'ajustar', 'correge', 'corregir',
          'pospone', 'posponer', 'adelanta', 'adelantar'
        ],
        contexto: ['audiencia', 'fecha', 'hora', 'cita', 'reunion'],
        entidadesRequeridas: ['identificador_audiencia', 'nueva_fecha'],
        entidadesOpcionales: ['nueva_hora', 'motivo'],
        confianzaMinima: 75,
        categoria: 'calendario'
      },

      CANCELAR_AUDIENCIA: {
        patrones: [
          'cancela', 'cancelar', 'elimina', 'eliminar', 'borra', 'borrar',
          'suspende', 'suspender', 'anula', 'anular', 'quita', 'quitar'
        ],
        contexto: ['audiencia', 'cita', 'reunion', 'encuentro'],
        entidadesRequeridas: ['identificador_audiencia'],
        entidadesOpcionales: ['motivo'],
        confianzaMinima: 80,
        categoria: 'calendario'
      },

      CONSULTAR_CALENDARIO: {
        patrones: [
          'que', 'cuales', 'cuando', 'donde', 'muestra', 'mostrar', 'ver', 'revisar',
          'agenda', 'calendario', 'citas', 'audiencias', 'reuniones', 'proxima', 'proximo'
        ],
        contexto: ['audiencias', 'calendario', 'agenda', 'citas', 'hoy', 'mañana', 'semana'],
        entidadesRequeridas: [],
        entidadesOpcionales: ['fecha', 'periodo'],
        confianzaMinima: 50,
        categoria: 'calendario'
      },

      // 3. GESTIÓN DE OBSERVACIONES
      AGREGAR_OBSERVACION: {
        patrones: [
          'agrega', 'agregar', 'anota', 'anotar', 'apunta', 'apuntar',
          'registra', 'registrar', 'escribe', 'escribir', 'pon', 'poner',
          'comenta', 'comentar', 'observa', 'observar', 'nota', 'notar'
        ],
        contexto: ['observacion', 'nota', 'comentario', 'anotacion', 'texto'],
        entidadesRequeridas: ['numero_expediente', 'texto_observacion'],
        entidadesOpcionales: ['tipo_observacion'],
        confianzaMinima: 65,
        categoria: 'observaciones'
      },

      BUSCAR_OBSERVACIONES: {
        patrones: [
          'busca', 'buscar', 'encuentra', 'encontrar', 'que', 'cuales',
          'muestra', 'mostrar', 'ver', 'revisar', 'hay', 'existe'
        ],
        contexto: ['observaciones', 'notas', 'comentarios', 'anotaciones'],
        entidadesRequeridas: ['termino_busqueda'],
        entidadesOpcionales: ['numero_expediente', 'fecha'],
        confianzaMinima: 60,
        categoria: 'observaciones'
      },

      // 4. GESTIÓN DE ALERTAS
      CREAR_ALERTA: {
        patrones: [
          'recuerdame', 'recordar', 'alerta', 'alertar', 'avisa', 'avisar',
          'notifica', 'notificar', 'programa', 'programar', 'crea', 'crear'
        ],
        contexto: ['recordatorio', 'alerta', 'aviso', 'notificacion', 'plazo'],
        entidadesRequeridas: ['fecha_alerta', 'descripcion'],
        entidadesOpcionales: ['numero_expediente', 'tipo_alerta'],
        confianzaMinima: 70,
        categoria: 'alertas'
      },

      VER_ALERTAS: {
        patrones: [
          'que', 'cuales', 'hay', 'tengo', 'muestra', 'mostrar', 'ver', 'revisar',
          'alertas', 'recordatorios', 'avisos', 'notificaciones', 'pendientes'
        ],
        contexto: ['alertas', 'recordatorios', 'avisos', 'notificaciones', 'urgente'],
        entidadesRequeridas: [],
        entidadesOpcionales: ['filtro_fecha', 'tipo_alerta'],
        confianzaMinima: 50,
        categoria: 'alertas'
      },

      // 5. BÚSQUEDAS INTELIGENTES
      BUSQUEDA_GLOBAL: {
        patrones: [
          'busca', 'buscar', 'encuentra', 'encontrar', 'donde', 'que',
          'todo', 'todos', 'relacionado', 'relacionados', 'sobre', 'acerca'
        ],
        contexto: ['todo', 'todos', 'relacionado', 'sobre', 'acerca', 'general'],
        entidadesRequeridas: ['termino_busqueda'],
        entidadesOpcionales: ['filtro_tipo'],
        confianzaMinima: 55,
        categoria: 'busquedas'
      },

      BUSQUEDA_POR_CLIENTE: {
        patrones: [
          'que', 'cuales', 'casos', 'expedientes', 'tiene', 'tener',
          'cliente', 'clientes', 'persona', 'empresa', 'del', 'de'
        ],
        contexto: ['cliente', 'clientes', 'persona', 'empresa', 'casos', 'expedientes'],
        entidadesRequeridas: ['nombre_cliente'],
        entidadesOpcionales: ['tipo_busqueda'],
        confianzaMinima: 65,
        categoria: 'busquedas'
      },

      BUSQUEDA_POR_MATERIA: {
        patrones: [
          'que', 'cuales', 'casos', 'expedientes', 'tengo', 'tener',
          'penal', 'civil', 'laboral', 'familia', 'comercial', 'materia'
        ],
        contexto: ['penal', 'civil', 'laboral', 'familia', 'comercial', 'materia', 'tipo'],
        entidadesRequeridas: ['tipo_materia'],
        entidadesOpcionales: ['filtro_adicional'],
        confianzaMinima: 60,
        categoria: 'busquedas'
      },

      // 6. ANÁLISIS Y REPORTES
      GENERAR_REPORTE: {
        patrones: [
          'genera', 'generar', 'crea', 'crear', 'reporte', 'informe',
          'estadisticas', 'cuantos', 'cuantas', 'resumen', 'analisis'
        ],
        contexto: ['reporte', 'informe', 'estadisticas', 'resumen', 'analisis', 'mensual'],
        entidadesRequeridas: ['tipo_reporte'],
        entidadesOpcionales: ['periodo', 'filtros'],
        confianzaMinima: 65,
        categoria: 'reportes'
      },

      ANALIZAR_CARGA_TRABAJO: {
        patrones: [
          'como', 'esta', 'mi', 'carga', 'trabajo', 'cuantos', 'pendientes',
          'analiza', 'analizar', 'productividad', 'rendimiento'
        ],
        contexto: ['carga', 'trabajo', 'pendientes', 'productividad', 'rendimiento'],
        entidadesRequeridas: [],
        entidadesOpcionales: ['periodo'],
        confianzaMinima: 60,
        categoria: 'reportes'
      },

      // 7. AYUDA Y SOPORTE
      SOLICITAR_AYUDA: {
        patrones: [
          'ayuda', 'ayudar', 'como', 'no', 'se', 'puedes', 'explicar',
          'enseñar', 'mostrar', 'guiar', 'orientar', 'asistir'
        ],
        contexto: ['ayuda', 'como', 'hacer', 'funciona', 'usar', 'utilizar'],
        entidadesRequeridas: [],
        entidadesOpcionales: ['tema_ayuda'],
        confianzaMinima: 40,
        categoria: 'ayuda'
      },

      EXPLICAR_FUNCIONALIDAD: {
        patrones: [
          'que', 'puedes', 'hacer', 'funciones', 'capacidades', 'explica',
          'como', 'funciona', 'sirve', 'para', 'que', 'es'
        ],
        contexto: ['que', 'puedes', 'hacer', 'funciones', 'capacidades', 'sirve'],
        entidadesRequeridas: [],
        entidadesOpcionales: ['funcionalidad_especifica'],
        confianzaMinima: 40,
        categoria: 'ayuda'
      }
    };
  }

  /**
   * Procesa un mensaje del usuario y determina la intención
   */
  async procesarMensaje(mensaje, contextoMensajes = []) {
    try {
      console.log('🧠 LEYIA - Procesando mensaje con SemanticParser integrado:', mensaje);
      
      // USAR SEMANTIC PARSER CON JERARQUÍA CORRECTA
      console.log('🔍 PASO 1: Usando SemanticParser para extracción con jerarquía correcta');
      
      // Procesar con contexto conversacional
      const entidadesSemanticas = this.semanticParser.procesarConContexto(mensaje, this.memoriaConversacional);
      
      console.log('📊 Entidades extraídas por SemanticParser:', entidadesSemanticas);
      
      // Si el parser semántico detectó una intención específica (como REGISTRAR_AUDIENCIA)
      if (entidadesSemanticas.intencion) {
        console.log('🎯 SemanticParser detectó intención específica:', entidadesSemanticas.intencion);
        
        // Verificar si necesita más información
        if (entidadesSemanticas.esRespuestaContextual) {
          console.log('💬 Procesando respuesta contextual completa');
          return await this.ejecutarIntencionSemantica(entidadesSemanticas);
        }
        
        // Verificar si el parser semántico tiene contexto pendiente
        if (this.semanticParser.contextoConversacional) {
          console.log('⏳ Parser semántico tiene contexto pendiente');
          return this.semanticParser.generarRespuesta(entidadesSemanticas);
        }
        
        // Ejecutar intención detectada por parser semántico
        return await this.ejecutarIntencionSemantica(entidadesSemanticas);
      }
      
      // FALLBACK: Usar sistema de intenciones tradicional si el parser semántico no detecta intención específica
      console.log('🔄 Fallback: Usando sistema de intenciones tradicional');
      
      // 1. Normalizar texto
      const textoNormalizado = this.normalizarTexto(mensaje);
      
      // 2. Extraer entidades (método tradicional como backup)
      const entidades = this.extraerEntidades(mensaje, textoNormalizado);
      
      // 3. Combinar entidades semánticas con tradicionales
      const entidadesCombinadas = {
        ...entidades,
        ...entidadesSemanticas,
        // Priorizar entidades del parser semántico
        fecha: entidadesSemanticas.fecha || entidades.tiene_fecha,
        hora: entidadesSemanticas.hora || entidades.tiene_hora,
        numero_expediente: entidadesSemanticas.numero_expediente || entidades.numero_expediente
      };
      
      // 4. Aplicar memoria conversacional
      this.aplicarMemoriaConversacional(entidadesCombinadas, contextoMensajes);
      
      // 5. Detectar intención
      const intencionDetectada = this.detectarIntencion(textoNormalizado, entidadesCombinadas);
      
      // 6. Validar y procesar
      const resultado = await this.procesarIntencion(intencionDetectada, entidadesCombinadas, mensaje);
      
      // 7. Actualizar memoria
      this.actualizarMemoria(mensaje, intencionDetectada, entidadesCombinadas);
      
      return resultado;
      
    } catch (error) {
      console.error('❌ Error en motor de intenciones:', error);
      return this.generarRespuestaError(error);
    }
  }

  /**
   * Ejecuta intenciones detectadas por el parser semántico
   */
  async ejecutarIntencionSemantica(entidadesSemanticas) {
    console.log('🎯 Ejecutando intención semántica:', entidadesSemanticas.intencion);
    
    switch (entidadesSemanticas.intencion) {
      case 'REGISTRAR_AUDIENCIA':
        return await this.procesarRegistrarAudiencia(entidadesSemanticas);
        
      case 'PROGRAMAR_AUDIENCIA_EXPEDIENTE':
        return await this.procesarProgramarAudienciaExpediente(entidadesSemanticas);
        
      default:
        console.log('⚠️ Intención semántica no implementada:', entidadesSemanticas.intencion);
        return this.semanticParser.generarRespuesta(entidadesSemanticas);
    }
  }

  /**
   * Procesa registrar audiencia en calendario (sin expediente específico)
   */
  async procesarRegistrarAudiencia(entidades) {
    console.log('📅 Procesando REGISTRAR_AUDIENCIA con parser semántico');
    
    if (this.procesarProgramarAudienciaExterno) {
      // Convertir entidades semánticas al formato esperado por la función externa
      const entidadesCompatibles = {
        numero_expediente: entidades.numero_expediente,
        tiene_fecha: !!entidades.fecha,
        tiene_hora: !!entidades.hora,
        fecha_texto: entidades.fecha ? `${entidades.fecha.dia} de ${entidades.fecha.mes} de ${entidades.fecha.año}` : null,
        hora_texto: entidades.hora ? `${entidades.hora.hora}:${entidades.hora.minutos} ${entidades.hora.periodo}` : null
      };
      
      // Construir mensaje simulado para la función externa
      let mensajeSimulado = 'agrega una audiencia al calendario';
      if (entidades.fecha) {
        mensajeSimulado += ` para el ${entidades.fecha.dia} de ${entidades.fecha.mes} del ${entidades.fecha.año}`;
      }
      if (entidades.hora) {
        mensajeSimulado += ` a las ${entidades.hora.hora}:${entidades.hora.minutos} ${entidades.hora.periodo}`;
      }
      if (entidades.numero_expediente) {
        mensajeSimulado += `, expediente ${entidades.numero_expediente}`;
      }
      
      return await this.procesarProgramarAudienciaExterno(mensajeSimulado, entidadesCompatibles);
    }
    
    return this.semanticParser.generarRespuesta(entidades);
  }

  /**
   * Procesa programar audiencia para expediente específico
   */
  async procesarProgramarAudienciaExpediente(entidades) {
    console.log('📋 Procesando PROGRAMAR_AUDIENCIA_EXPEDIENTE con parser semántico');
    
    if (this.procesarProgramarAudienciaExterno) {
      // Similar al método anterior pero enfocado en expediente
      const entidadesCompatibles = {
        numero_expediente: entidades.numero_expediente,
        tiene_fecha: !!entidades.fecha,
        tiene_hora: !!entidades.hora,
        fecha_texto: entidades.fecha ? `${entidades.fecha.dia} de ${entidades.fecha.mes} de ${entidades.fecha.año}` : null,
        hora_texto: entidades.hora ? `${entidades.hora.hora}:${entidades.hora.minutos} ${entidades.hora.periodo}` : null
      };
      
      let mensajeSimulado = `programa audiencia para el expediente ${entidades.numero_expediente}`;
      if (entidades.fecha) {
        mensajeSimulado += ` el ${entidades.fecha.dia} de ${entidades.fecha.mes} del ${entidades.fecha.año}`;
      }
      if (entidades.hora) {
        mensajeSimulado += ` a las ${entidades.hora.hora}:${entidades.hora.minutos} ${entidades.hora.periodo}`;
      }
      
      return await this.procesarProgramarAudienciaExterno(mensajeSimulado, entidadesCompatibles);
    }
    
    return this.semanticParser.generarRespuesta(entidades);
  }

  /**
   * Normaliza el texto para mejor procesamiento
   */
  normalizarTexto(texto) {
    return texto
      .toLowerCase()
      .replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e').replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o').replace(/[úùüû]/g, 'u').replace(/ñ/g, 'n')
      // Mantener frases importantes antes de limpiar
      .replace(/quiero\s+que\s+crees/g, 'quiero_que_crees')
      .replace(/quiero\s+crear/g, 'quiero_crear')
      .replace(/necesito\s+crear/g, 'necesito_crear')
      .replace(/voy\s+a\s+crear/g, 'voy_a_crear')
      .replace(/hacer\s+un/g, 'hacer_un')
      .replace(/hacer\s+una/g, 'hacer_una')
      .replace(/dame\s+un/g, 'dame_un')
      .replace(/dame\s+una/g, 'dame_una')
      .replace(/un\s+expediente/g, 'un_expediente')
      .replace(/una\s+expediente/g, 'una_expediente')
      .replace(/nuevo\s+expediente/g, 'nuevo_expediente')
      .replace(/nueva\s+expediente/g, 'nueva_expediente')
      // Limpiar palabras de cortesía después de preservar frases
      .replace(/\b(por favor|oye|necesito que|quiero que|puedes|podrias|podrías)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      // Restaurar frases importantes
      .replace(/quiero_que_crees/g, 'quiero que crees')
      .replace(/quiero_crear/g, 'quiero crear')
      .replace(/necesito_crear/g, 'necesito crear')
      .replace(/voy_a_crear/g, 'voy a crear')
      .replace(/hacer_un/g, 'hacer un')
      .replace(/hacer_una/g, 'hacer una')
      .replace(/dame_un/g, 'dame un')
      .replace(/dame_una/g, 'dame una')
      .replace(/un_expediente/g, 'un expediente')
      .replace(/una_expediente/g, 'una expediente')
      .replace(/nuevo_expediente/g, 'nuevo expediente')
      .replace(/nueva_expediente/g, 'nueva expediente');
  }

  /**
   * Extrae entidades del texto
   */
  extraerEntidades(textoOriginal, textoNormalizado) {
    const entidades = {};
    
    // Extraer números de expediente (patrones mejorados)
    const patronesExpediente = [
      /\b(\d{2,6}[-.]?\d{4}[-.]?\d*[-.]?[A-Z0-9]*[-.]?[A-Z]*[-.]?[A-Z]*[-.]?\d*)\b/g,
      /\b(\d{3,6})\b/g,
      /expediente\s+(\d+)/gi,
      /caso\s+(\d+)/gi,
      /exp\s+(\d+)/gi
    ];
    
    let numerosEncontrados = [];
    patronesExpediente.forEach(patron => {
      const matches = [...textoOriginal.matchAll(patron)];
      matches.forEach(match => {
        if (match[1] && match[1].length >= 3) {
          numerosEncontrados.push(match[1]);
        }
      });
    });
    
    if (numerosEncontrados.length > 0) {
      entidades.numero_expediente = numerosEncontrados[0];
      entidades.todos_numeros = [...new Set(numerosEncontrados)];
    }
    
    // Extraer fechas y horas
    this.extraerFechasHoras(textoOriginal, entidades);
    
    // Extraer información de expediente
    this.extraerInformacionExpediente(textoOriginal, entidades);
    
    // Extraer nombres y contactos
    this.extraerNombresContactos(textoOriginal, entidades);
    
    return entidades;
  }

  /**
   * Extrae fechas y horas del texto
   */
  extraerFechasHoras(texto, entidades) {
    // Patrones de fecha
    const patronesFecha = [
      /(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i,
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
      /(\d{1,2})-(\d{1,2})-(\d{4})/,
      /(lunes|martes|miercoles|jueves|viernes|sabado|domingo)/i,
      /(hoy|mañana|ayer|pasado mañana)/i
    ];
    
    // Patrones de hora
    const patronesHora = [
      /(\d{1,2}):(\d{2})\s*(am|pm)/i,
      /(\d{1,2})\s*(am|pm)/i,
      /a\s+las\s+(\d{1,2})/i
    ];
    
    patronesFecha.forEach(patron => {
      const match = texto.match(patron);
      if (match) {
        entidades.tiene_fecha = true;
        entidades.fecha_texto = match[0];
      }
    });
    
    patronesHora.forEach(patron => {
      const match = texto.match(patron);
      if (match) {
        entidades.tiene_hora = true;
        entidades.hora_texto = match[0];
      }
    });
  }

  /**
   * Extrae información específica de expedientes
   */
  extraerInformacionExpediente(texto, entidades) {
    const camposExpediente = [
      'juez', 'especialista', 'magistrado', 'secretario',
      'demandante', 'demandado', 'imputado', 'agraviado',
      'delito', 'materia', 'pretension'
    ];
    
    let camposDetectados = [];
    camposExpediente.forEach(campo => {
      if (texto.toLowerCase().includes(campo)) {
        camposDetectados.push(campo);
      }
    });
    
    if (camposDetectados.length > 0) {
      entidades.campos_expediente = camposDetectados;
      entidades.tiene_info_expediente = true;
    }
    
    // Detectar si es información judicial completa
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
      if (patron.test(texto)) {
        patronesEncontrados++;
      }
    });
    
    if (patronesEncontrados >= 2) {
      entidades.es_informacion_judicial = true;
      entidades.informacion_judicial_completa = true;
    }
    
    // Detectar si es un mensaje híbrido (crear + información)
    const patronesCrear = [
      /quiero\s+que\s+crees/i,
      /quiero\s+crear/i,
      /crea.*con\s+estos\s+datos/i,
      /crear.*con\s+esta\s+informacion/i,
      /nuevo.*expediente.*con/i
    ];
    
    const esComandoCrear = patronesCrear.some(patron => patron.test(texto));
    
    if (esComandoCrear && entidades.es_informacion_judicial) {
      entidades.es_crear_con_datos = true;
      console.log('🎯 Detectado: CREAR expediente CON información judicial completa');
    }
  }

  /**
   * Extrae nombres y contactos
   */
  extraerNombresContactos(texto, entidades) {
    // Patrones para nombres de personas
    const patronesNombre = [
      /cliente\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)/i,
      /señor[a]?\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)/i,
      /([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)/
    ];
    
    patronesNombre.forEach(patron => {
      const match = texto.match(patron);
      if (match && match[1]) {
        entidades.nombre_detectado = match[1];
      }
    });
  }

  /**
   * Aplica memoria conversacional para resolver referencias
   */
  aplicarMemoriaConversacional(entidades, contextoMensajes) {
    // Si no hay número de expediente, buscar en contexto
    if (!entidades.numero_expediente && contextoMensajes.length > 0) {
      const ultimosMensajes = contextoMensajes.slice(-6);
      
      for (const mensaje of ultimosMensajes.reverse()) {
        const entidadesContexto = this.extraerEntidades(mensaje.texto, mensaje.texto.toLowerCase());
        if (entidadesContexto.numero_expediente) {
          entidades.numero_expediente = entidadesContexto.numero_expediente;
          entidades.desde_contexto = true;
          console.log('🔗 Número recuperado del contexto:', entidades.numero_expediente);
          break;
        }
      }
    }
    
    // Resolver referencias pronominales
    this.resolverReferencias(entidades, contextoMensajes);
  }

  /**
   * Resuelve referencias como "ese expediente", "el caso anterior"
   */
  resolverReferencias(entidades, contextoMensajes) {
    const referencias = [
      'ese', 'esa', 'este', 'esta', 'el', 'la', 'anterior', 'ultimo', 'mismo', 'misma'
    ];
    
    // Implementar lógica de resolución de referencias
    // Por ahora, usar el último expediente mencionado
  }

  /**
   * Detecta la intención más probable
   */
  detectarIntencion(textoNormalizado, entidades) {
    let mejorIntencion = null;
    let mayorConfianza = 0;
    let todasIntenciones = {};
    
    Object.keys(this.intenciones).forEach(nombreIntencion => {
      const intencion = this.intenciones[nombreIntencion];
      let confianza = 0;
      
      // Calcular confianza por patrones
      intencion.patrones.forEach(patron => {
        if (textoNormalizado.includes(patron)) {
          confianza += 30;
        }
      });
      
      // Calcular confianza por contexto
      intencion.contexto.forEach(contexto => {
        if (textoNormalizado.includes(contexto)) {
          confianza += 20;
        }
      });
      
      // Bonificaciones por entidades
      this.aplicarBonificacionesEntidades(intencion, entidades, confianza);
      
      // Aplicar bonificaciones específicas
      confianza = this.aplicarBonificacionesEspecificas(nombreIntencion, textoNormalizado, entidades, confianza);
      
      todasIntenciones[nombreIntencion] = {
        confianza,
        intencion: intencion
      };
      
      if (confianza > mayorConfianza && confianza >= intencion.confianzaMinima) {
        mayorConfianza = confianza;
        mejorIntencion = nombreIntencion;
      }
    });
    
    if (this.configuracion.debug) {
      console.log('🎯 Análisis de intenciones:', todasIntenciones);
      console.log('🏆 Mejor intención:', mejorIntencion, 'Confianza:', mayorConfianza);
    }
    
    return {
      intencion: mejorIntencion,
      confianza: mayorConfianza,
      todasIntenciones
    };
  }

  /**
   * Aplica bonificaciones por entidades detectadas
   */
  aplicarBonificacionesEntidades(intencion, entidades, confianza) {
    // Bonificar si tiene entidades requeridas
    if (entidades.numero_expediente && 
        intencion.entidadesRequeridas.includes('numero_expediente')) {
      confianza += 25;
    }
    
    if (entidades.tiene_info_expediente && 
        intencion.entidadesRequeridas.includes('informacion_judicial')) {
      confianza += 40;
    }
    
    // Bonificación especial para CREAR_EXPEDIENTE cuando NO hay número
    if (intencion.categoria === 'expedientes') {
      if (!entidades.numero_expediente) {
        // Si no hay número de expediente, es más probable que quiera crear uno nuevo
        if (intencion.patrones.some(p => ['crea', 'crear', 'nuevo', 'nueva'].includes(p))) {
          confianza += 20;
        }
      }
    }
    
    return confianza;
  }

  /**
   * Aplica bonificaciones específicas por intención
   */
  aplicarBonificacionesEspecificas(nombreIntencion, texto, entidades, confianza) {
    switch (nombreIntencion) {
      case 'PROGRAMAR_AUDIENCIA':
        if (texto.includes('audiencia')) confianza += 50;
        if (entidades.tiene_fecha) confianza += 30;
        if (entidades.tiene_hora) confianza += 20;
        break;
        
      case 'ACTUALIZAR_EXPEDIENTE':
        if (entidades.es_informacion_judicial) confianza += 60;
        if (texto.includes('audiencia')) confianza -= 30; // Penalizar si menciona audiencia
        // Penalizar si es claramente un comando de crear
        if (texto.includes('quiero que crees') || texto.includes('quiero crear')) confianza -= 40;
        break;
        
      case 'CONSULTAR_EXPEDIENTE':
        if (texto.includes('existe') || texto.includes('hay')) confianza += 20;
        break;
        
      case 'AGREGAR_OBSERVACION':
        if (texto.includes(':') || texto.includes('que')) confianza += 15;
        break;
        
      case 'CREAR_EXPEDIENTE':
        // Bonificaciones específicas para crear expediente
        if (texto.includes('quiero que crees') || texto.includes('quiero crear')) confianza += 40;
        if (texto.includes('nuevo') || texto.includes('nueva')) confianza += 30;
        if (texto.includes('un expediente') || texto.includes('una expediente')) confianza += 35;
        if (texto.includes('hacer un') || texto.includes('hacer una')) confianza += 25;
        if (texto.includes('dame un') || texto.includes('dame una')) confianza += 25;
        
        // BONIFICACIÓN CRÍTICA: Si dice "crear con datos" o similar
        if (texto.includes('con estos datos') || texto.includes('con esta informacion')) confianza += 50;
        if (texto.includes('crea') && texto.includes('con')) confianza += 30;
        
        // BONIFICACIÓN ESPECIAL: Si es crear + información judicial
        if (entidades.es_crear_con_datos) confianza += 60;
        if (entidades.informacion_judicial_completa) confianza += 40;
        
        // Penalizar menos si menciona número específico cuando tiene info judicial completa
        if (entidades.numero_expediente && !entidades.informacion_judicial_completa) confianza -= 20;
        break;
    }
    
    return confianza;
  }

  /**
   * Procesa la intención detectada
   */
  async procesarIntencion(intencionDetectada, entidades, mensajeOriginal) {
    if (!intencionDetectada.intencion || intencionDetectada.confianza < this.configuracion.confianzaMinima) {
      return this.generarRespuestaFallback(entidades, mensajeOriginal);
    }
    
    const nombreIntencion = intencionDetectada.intencion;
    const intencion = this.intenciones[nombreIntencion];
    
    // Validar entidades requeridas
    const entidadesFaltantes = this.validarEntidadesRequeridas(intencion, entidades);
    if (entidadesFaltantes.length > 0) {
      return this.solicitarEntidadesFaltantes(nombreIntencion, entidadesFaltantes, entidades);
    }
    
    // Procesar según la intención
    return await this.ejecutarIntencion(nombreIntencion, entidades, mensajeOriginal);
  }

  /**
   * Valida que estén presentes las entidades requeridas
   */
  validarEntidadesRequeridas(intencion, entidades) {
    const faltantes = [];
    
    intencion.entidadesRequeridas.forEach(entidadRequerida => {
      switch (entidadRequerida) {
        case 'numero_expediente':
          if (!entidades.numero_expediente) faltantes.push('numero_expediente');
          break;
        case 'fecha':
          if (!entidades.tiene_fecha) faltantes.push('fecha');
          break;
        case 'texto_observacion':
          if (!entidades.texto_observacion) faltantes.push('texto_observacion');
          break;
        // Agregar más validaciones según sea necesario
      }
    });
    
    return faltantes;
  }

  /**
   * Solicita entidades faltantes al usuario
   */
  solicitarEntidadesFaltantes(nombreIntencion, entidadesFaltantes, entidades) {
    let mensaje = '🤔 **Entiendo tu intención, pero necesito más información:**\n\n';
    
    entidadesFaltantes.forEach(entidad => {
      switch (entidad) {
        case 'numero_expediente':
          mensaje += '📋 **¿Cuál es el número del expediente?**\n';
          break;
        case 'fecha':
          mensaje += '📅 **¿Para qué fecha?**\n';
          break;
        case 'texto_observacion':
          mensaje += '📝 **¿Cuál es el texto de la observación?**\n';
          break;
      }
    });
    
    if (entidades.numero_expediente) {
      mensaje += `\n💡 **Expediente detectado:** ${entidades.numero_expediente}`;
    }
    
    return mensaje;
  }

  /**
   * Ejecuta la acción correspondiente a la intención
   */
  async ejecutarIntencion(nombreIntencion, entidades, mensajeOriginal) {
    console.log(`🎯 Ejecutando intención: ${nombreIntencion}`);
    
    switch (nombreIntencion) {
      case 'ACTUALIZAR_EXPEDIENTE':
        return await this.procesarActualizacionExpediente(mensajeOriginal, entidades);
        
      case 'CONSULTAR_EXPEDIENTE':
        return await this.procesarConsultaExpediente(mensajeOriginal, entidades);
        
      case 'CREAR_EXPEDIENTE':
        return await this.procesarCrearExpediente(mensajeOriginal, entidades);
        
      case 'PROGRAMAR_AUDIENCIA':
        // Verificar si el parser semántico ya procesó esto
        if (entidades.intencion === 'REGISTRAR_AUDIENCIA' || entidades.intencion === 'PROGRAMAR_AUDIENCIA_EXPEDIENTE') {
          return await this.ejecutarIntencionSemantica(entidades);
        }
        return await this.procesarProgramarAudiencia(mensajeOriginal, entidades);
        
      case 'AGREGAR_OBSERVACION':
        return await this.procesarAgregarObservacion(mensajeOriginal, entidades);
        
      case 'VER_ALERTAS':
        return await this.procesarVerAlertas(entidades);
        
      case 'CONSULTAR_CALENDARIO':
        return await this.procesarConsultarCalendario(entidades);
        
      case 'BUSQUEDA_GLOBAL':
        return await this.procesarBusquedaGlobal(entidades);
        
      case 'SOLICITAR_AYUDA':
        return this.procesarSolicitarAyuda(entidades);
        
      case 'EXPLICAR_FUNCIONALIDAD':
        return this.procesarExplicarFuncionalidad(entidades);
        
      default:
        return this.generarRespuestaGenerica(nombreIntencion, entidades);
    }
  }

  /**
   * Procesa crear expediente
   */
  async procesarCrearExpediente(mensaje, entidades) {
    console.log('🎯 procesarCrearExpediente llamado');
    console.log('🔍 Función externa disponible:', !!this.procesarCrearExpedienteExterno);
    
    // Si hay una función externa asignada, usarla
    if (this.procesarCrearExpedienteExterno) {
      console.log('✅ Usando función externa del parser semántico');
      return await this.procesarCrearExpedienteExterno(mensaje, entidades);
    }
    
    console.log('⚠️ Usando respuesta genérica (función externa no disponible)');
    return `📋 **¡Perfecto! Voy a ayudarte a crear un nuevo expediente**\n\n` +
           `🧠 **LEYIA IA Avanzada** - Creación inteligente de expedientes:\n\n` +
           `📝 **Para crear un expediente necesito:**\n` +
           `• Número del expediente (si ya lo tienes)\n` +
           `• Nombre del cliente\n` +
           `• Tipo de materia (civil, penal, laboral, etc.)\n` +
           `• Descripción del caso\n\n` +
           `💡 **Opciones para continuar:**\n` +
           `1️⃣ **Dime los datos:** "Crea expediente 123-2025 para Juan Pérez, caso civil de divorcio"\n` +
           `2️⃣ **Paso a paso:** Te guío pregunta por pregunta\n` +
           `3️⃣ **Con información judicial:** Pega la información completa del expediente\n\n` +
           `🌐 **Funciona desde cualquier ventana** - ¿Cómo prefieres proceder?`;
  }

  /**
   * Procesa actualización de expediente
   */
  async procesarActualizacionExpediente(mensaje, entidades) {
    // Si hay una función externa asignada, usarla
    if (this.procesarActualizacionExpedienteExterno) {
      return await this.procesarActualizacionExpedienteExterno(mensaje, entidades);
    }
    
    try {
      if (window.actualizarExpedienteConLeyiaUniversal) {
        const resultado = await window.actualizarExpedienteConLeyiaUniversal(mensaje);
        
        if (resultado.success) {
          return `✅ **¡Expediente ${resultado.numero} ${resultado.accion} exitosamente!**\n\n` +
                 `🧠 **LEYIA IA Avanzada** - Procesamiento inteligente:\n` +
                 `• Intención detectada automáticamente\n` +
                 `• Información judicial extraída\n` +
                 `• Tarjeta ${resultado.accion === 'actualizado' ? 'actualizada' : 'creada'}\n` +
                 `• Disponible desde cualquier sección\n\n` +
                 `🎯 **Ve a la sección "Casos"** para ver los cambios.`;
        } else {
          return `❌ **Error al procesar:** ${resultado.error}`;
        }
      } else {
        return '❌ **Función de actualización no disponible**';
      }
    } catch (error) {
      return `❌ **Error técnico:** ${error.message}`;
    }
  }

  /**
   * Procesa consulta de expediente
   */
  async procesarConsultaExpediente(mensaje, entidades) {
    // Si hay una función externa asignada, usarla
    if (this.procesarConsultaExpedienteExterno) {
      return await this.procesarConsultaExpedienteExterno(mensaje, entidades);
    }
    
    // Implementar lógica de consulta
    return `🔍 **Consultando expediente ${entidades.numero_expediente}**\n\n` +
           `🧠 **LEYIA IA** - Búsqueda inteligente activada...`;
  }

  /**
   * Procesa programar audiencia
   */
  async procesarProgramarAudiencia(mensaje, entidades) {
    // Si hay una función externa asignada, usarla
    if (this.procesarProgramarAudienciaExterno) {
      return await this.procesarProgramarAudienciaExterno(mensaje, entidades);
    }
    
    // Implementar lógica de programación de audiencias
    return `📅 **Programando audiencia**\n\n` +
           `🧠 **LEYIA IA** - Procesamiento de fecha y hora...`;
  }

  /**
   * Procesa agregar observación
   */
  async procesarAgregarObservacion(mensaje, entidades) {
    // Si hay una función externa asignada, usarla
    if (this.procesarAgregarObservacionExterno) {
      return await this.procesarAgregarObservacionExterno(mensaje, entidades);
    }
    
    // Implementar lógica de observaciones
    return `📝 **Agregando observación**\n\n` +
           `🧠 **LEYIA IA** - Procesamiento de texto...`;
  }

  /**
   * Procesa solicitud de ayuda
   */
  procesarSolicitarAyuda(entidades) {
    return `💡 **¡Estoy aquí para ayudarte!**\n\n` +
           `🧠 **LEYIA IA Avanzada** - Entiendo lenguaje natural:\n\n` +
           `✅ **Puedes decirme:**\n` +
           `• "Actualiza el expediente 123"\n` +
           `• "¿Qué audiencias tengo hoy?"\n` +
           `• "Agrega nota al caso 456: texto"\n` +
           `• "Programa audiencia para mañana"\n\n` +
           `🎯 **Soy flexible** - No necesitas comandos exactos\n\n` +
           `💬 **¿En qué específicamente necesitas ayuda?**`;
  }

  /**
   * Procesa explicación de funcionalidades
   */
  procesarExplicarFuncionalidad(entidades) {
    return `🚀 **LEYIA - IA Legal Avanzada**\n\n` +
           `🧠 **Capacidades Inteligentes:**\n` +
           `• Gestión completa de expedientes\n` +
           `• Programación inteligente de audiencias\n` +
           `• Sistema de alertas y recordatorios\n` +
           `• Búsquedas avanzadas\n` +
           `• Análisis y reportes\n` +
           `• Memoria conversacional\n\n` +
           `💬 **Entiendo 30+ intenciones diferentes**\n` +
           `🌐 **Funciono igual en todas las ventanas**\n\n` +
           `🎯 **¿Qué te gustaría hacer primero?**`;
  }

  /**
   * Genera respuesta de fallback cuando no se detecta intención clara
   */
  generarRespuestaFallback(entidades, mensaje) {
    let respuesta = '🤔 **Entiendo que quieres hacer algo, pero necesito más claridad.**\n\n';
    
    if (entidades.numero_expediente) {
      respuesta += `📋 **Detecté el expediente:** ${entidades.numero_expediente}\n\n`;
      respuesta += `💡 **¿Qué quieres hacer con él?**\n`;
      respuesta += `• Actualizarlo con nueva información\n`;
      respuesta += `• Consultar su estado actual\n`;
      respuesta += `• Agregar una observación\n`;
      respuesta += `• Programar una audiencia\n\n`;
      respuesta += `🗣️ **Ejemplo:** "Actualiza el ${entidades.numero_expediente}"`;
    } else {
      respuesta += `💡 **¿Qué necesitas hacer?**\n`;
      respuesta += `• **Expedientes:** "actualiza el 123", "consulta el 456"\n`;
      respuesta += `• **Audiencias:** "programa audiencia para mañana"\n`;
      respuesta += `• **Observaciones:** "agrega nota en el 123: [texto]"\n`;
      respuesta += `• **Búsquedas:** "¿qué casos tengo pendientes?"\n\n`;
      respuesta += `🧠 **Recuerda:** Entiendo lenguaje natural, no necesitas comandos exactos.`;
    }
    
    return respuesta;
  }

  /**
   * Genera respuesta genérica para intenciones no implementadas
   */
  generarRespuestaGenerica(nombreIntencion, entidades) {
    return `🚧 **Funcionalidad en desarrollo**\n\n` +
           `🎯 **Intención detectada:** ${nombreIntencion}\n` +
           `🧠 **LEYIA IA** está aprendiendo esta funcionalidad\n\n` +
           `💡 **Mientras tanto, puedo ayudarte con:**\n` +
           `• Actualizar expedientes\n` +
           `• Programar audiencias\n` +
           `• Agregar observaciones\n` +
           `• Consultar información`;
  }

  /**
   * Genera respuesta de error
   */
  generarRespuestaError(error) {
    return `❌ **Error en el sistema de IA**\n\n` +
           `🔧 **Detalles técnicos:** ${error.message}\n\n` +
           `💡 **Soluciones:**\n` +
           `• Intenta reformular tu mensaje\n` +
           `• Verifica tu conexión a internet\n` +
           `• Recarga la página si persiste`;
  }

  /**
   * Actualiza la memoria conversacional
   */
  actualizarMemoria(mensaje, intencionDetectada, entidades) {
    const entradaMemoria = {
      timestamp: new Date(),
      mensaje,
      intencion: intencionDetectada.intencion,
      confianza: intencionDetectada.confianza,
      entidades
    };
    
    this.memoriaConversacional.push(entradaMemoria);
    
    // Mantener solo los últimos N mensajes
    if (this.memoriaConversacional.length > this.configuracion.maxMemoriaConversacional) {
      this.memoriaConversacional.shift();
    }
    
    // Actualizar entidades de contexto
    if (entidades.numero_expediente) {
      this.entidadesContexto.set('ultimo_expediente', entidades.numero_expediente);
    }
  }

  /**
   * Procesa ver alertas
   */
  async procesarVerAlertas(entidades) {
    // Si hay una función externa asignada, usarla
    if (this.procesarVerAlertasExterno) {
      return await this.procesarVerAlertasExterno(entidades);
    }
    
    return `🚨 **Alertas del Sistema**\n\n` +
           `🧠 **LEYIA IA** - Análisis de alertas pendientes...\n\n` +
           `💡 **Funcionalidad en desarrollo** - Próximamente disponible`;
  }

  /**
   * Procesa consultar calendario
   */
  async procesarConsultarCalendario(entidades) {
    // Si hay una función externa asignada, usarla
    if (this.procesarConsultarCalendarioExterno) {
      return await this.procesarConsultarCalendarioExterno(entidades);
    }
    
    return `📅 **Calendario Inteligente**\n\n` +
           `🧠 **LEYIA IA** - Analizando tu agenda...\n\n` +
           `💡 **Funcionalidad en desarrollo** - Próximamente disponible`;
  }

  /**
   * Procesa búsqueda global
   */
  async procesarBusquedaGlobal(entidades) {
    // Si hay una función externa asignada, usarla
    if (this.procesarBusquedaGlobalExterno) {
      return await this.procesarBusquedaGlobalExterno(entidades);
    }
    
    return `🔍 **Búsqueda Global Inteligente**\n\n` +
           `🧠 **LEYIA IA** - Procesando búsqueda avanzada...\n\n` +
           `💡 **Funcionalidad en desarrollo** - Próximamente disponible`;
  }
}

export default IntentionEngine;