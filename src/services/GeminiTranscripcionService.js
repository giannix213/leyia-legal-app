/**
 * Servicio de Transcripción con Google Gemini
 * Implementación real de transcripción de audio/video
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiTranscripcionService {
  constructor() {
    this.apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    this.genAI = null;
    this.model = null;
    
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    }
  }

  /**
   * Verifica si la API está configurada
   */
  isConfigured() {
    return Boolean(this.apiKey && this.genAI);
  }

  /**
   * Extrae audio de un archivo de video
   * @param {File} file - Archivo de video
   * @returns {Promise<File>} - Archivo de audio extraído
   */
  async extractAudioFromVideo(file) {
    return new Promise((resolve, reject) => {
      try {
        // Crear un elemento de video temporal
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        video.onloadedmetadata = () => {
          // Para simplificar, por ahora retornamos el archivo original
          // En una implementación completa, usarías FFmpeg.js o similar
          console.log('📹 Video cargado, usando archivo original para transcripción');
          resolve(file);
        };

        video.onerror = () => {
          reject(new Error('Error al procesar el video'));
        };

        const url = URL.createObjectURL(file);
        video.src = url;
        video.load();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Convierte archivo a base64 para Gemini
   * @param {File} file - Archivo a convertir
   * @returns {Promise<string>} - Archivo en base64
   */
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Transcribe un archivo usando Google Gemini
   * @param {File} file - Archivo de audio/video
   * @param {Object} options - Opciones de transcripción
   * @returns {Promise<Object>} - Resultado de la transcripción
   */
  async transcribeFile(file, options = {}) {
    if (!this.isConfigured()) {
      throw new Error('API de Gemini no configurada. Verifique REACT_APP_GEMINI_API_KEY');
    }

    if (!file) {
      throw new Error('No se proporcionó archivo para transcribir');
    }

    // Validar tipo de archivo
    const allowedTypes = ['video/', 'audio/'];
    const isValidType = allowedTypes.some(type => file.type.startsWith(type));
    
    if (!isValidType) {
      throw new Error('Tipo de archivo no soportado. Use video o audio.');
    }

    // Validar tamaño (20MB máximo para Gemini)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      throw new Error('El archivo es demasiado grande para Gemini. Máximo 20MB.');
    }

    try {
      console.log('🎤 Iniciando transcripción con Gemini...');
      
      // Convertir archivo a base64
      const base64Data = await this.fileToBase64(file);
      
      // Preparar el prompt para transcripción
      const prompt = `
Por favor, transcribe el contenido de audio de este archivo. 

Instrucciones:
1. Transcribe todo el contenido hablado
2. Usa puntuación apropiada
3. Separa en párrafos cuando sea natural
4. Si hay múltiples hablantes, indica "Hablante 1:", "Hablante 2:", etc.
5. Si hay partes inaudibles, indica [INAUDIBLE]
6. Mantén el contexto legal/jurídico si es aplicable

Formato de respuesta:
TRANSCRIPCIÓN:
[contenido transcrito aquí]
`;

      // Crear el contenido para Gemini
      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      };

      console.log('📤 Enviando archivo a Gemini...');
      
      // Llamar a Gemini
      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      console.log('✅ Transcripción completada con Gemini');

      // Extraer solo la transcripción del texto
      const transcripcionMatch = text.match(/TRANSCRIPCIÓN:\s*([\s\S]*)/i);
      const transcripcionLimpia = transcripcionMatch ? transcripcionMatch[1].trim() : text.trim();

      return {
        success: true,
        text: transcripcionLimpia,
        confidence: 0.9, // Gemini no proporciona confidence, asumimos alta
        duration: null, // No disponible con Gemini
        segments: [],
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          processedAt: new Date().toISOString(),
          service: 'Google Gemini',
          model: 'gemini-1.5-flash'
        }
      };

    } catch (error) {
      console.error('❌ Error en transcripción con Gemini:', error);
      
      // Si falla Gemini, usar simulación como fallback
      if (process.env.NODE_ENV === 'development') {
        console.warn('🔄 Fallback a simulación por error en Gemini');
        return this.generateMockTranscription(file.name, error.message);
      }
      
      throw new Error(`Error en transcripción: ${error.message}`);
    }
  }

  /**
   * Genera transcripción simulada como fallback
   * @param {string} fileName - Nombre del archivo
   * @param {string} errorMessage - Mensaje de error original
   * @returns {Object} - Transcripción simulada
   */
  generateMockTranscription(fileName, errorMessage = '') {
    const mockTexts = [
      "En la audiencia del día de hoy se presentaron las siguientes alegaciones por parte del demandante. Se solicita que se admita a trámite la demanda presentada contra la empresa constructora por incumplimiento de contrato de compraventa de inmueble ubicado en el distrito de San Isidro.",
      
      "El testigo declaró que estuvo presente en el momento de los hechos y puede confirmar que el accidente ocurrió debido a negligencia del conductor del vehículo de placa ABC-123. Las lesiones presentadas por el demandante son consistentes con el tipo de impacto descrito.",
      
      "Se procede a leer el acta de la reunión anterior donde se acordó implementar las medidas correctivas necesarias para evitar futuros inconvenientes en el proceso administrativo. Los documentos presentados cumplen con los requisitos establecidos en la normativa vigente.",
      
      "La perito médico explica que las lesiones presentadas por el paciente son consistentes con el tipo de accidente descrito en la denuncia policial. Se recomienda un período de incapacidad temporal de 30 días calendario para la recuperación completa."
    ];
    
    const randomText = mockTexts[Math.floor(Math.random() * mockTexts.length)];
    
    return {
      success: true,
      text: `${randomText}\n\n[NOTA: Esta es una transcripción simulada porque ocurrió un error con la API de Gemini: ${errorMessage}]`,
      confidence: 0.95,
      duration: 120,
      segments: [],
      metadata: {
        fileName: fileName,
        fileSize: 0,
        processedAt: new Date().toISOString(),
        service: 'Simulación (Fallback)',
        error: errorMessage,
        simulated: true
      }
    };
  }

  /**
   * Genera documento usando Gemini
   * @param {Object} params - Parámetros para generar documento
   * @returns {Promise<Object>} - Documento generado
   */
  async generateDocument({ prompt, transcription, variables, template }) {
    if (!this.isConfigured()) {
      throw new Error('API de Gemini no configurada');
    }

    try {
      console.log('📝 Generando documento con Gemini...');

      // Construir prompt completo
      const fullPrompt = `
${prompt}

TRANSCRIPCIÓN BASE:
${transcription}

VARIABLES:
${Object.entries(variables).map(([key, value]) => `${key}: ${value}`).join('\n')}

TIPO DE DOCUMENTO: ${template}

Por favor, genera un documento legal profesional basado en la información proporcionada.
`;

      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const content = response.text();

      console.log('✅ Documento generado con Gemini');

      return {
        success: true,
        content: content,
        metadata: {
          service: 'Google Gemini',
          model: 'gemini-2.5-flash',
          template,
          variables,
          generatedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Error generando documento con Gemini:', error);
      
      // Fallback a generación simulada
      if (process.env.NODE_ENV === 'development') {
        console.warn('🔄 Fallback a generación simulada');
        return this.generateMockDocument(variables, template, error.message);
      }
      
      throw error;
    }
  }

  /**
   * Genera documento simulado como fallback
   */
  generateMockDocument(variables, template, errorMessage = '') {
    const templates = {
      resolucion: `
RESOLUCIÓN NÚMERO ${variables.numeroResolucion || 'XXX-2024'}

Visto el proceso de ${variables.tipoTramite || 'TRÁMITE GENERAL'} presentado por el ciudadano ${variables.nombreSolicitante || 'SOLICITANTE'}...

CONSIDERANDO:

Que, el solicitante ha cumplido con los requisitos establecidos en la normativa vigente.

Que, la documentación presentada se encuentra completa y en orden.

SE RESUELVE:

PRIMERO.- ADMITIR a trámite la solicitud de referencia.

SEGUNDO.- Notificar la presente resolución a las partes interesadas.

Dado en la ciudad de Lima, a los ${new Date().getDate()} días del mes de ${new Date().toLocaleDateString('es-ES', { month: 'long' })} del año ${new Date().getFullYear()}.

[Firma de la Autoridad]

[NOTA: Documento generado por simulación debido a error en Gemini: ${errorMessage}]
      `.trim(),
      
      acta: `
ACTA DE REUNIÓN

Fecha: ${variables.fechaActual || new Date().toLocaleDateString('es-ES')}
Asunto: ${variables.tipoTramite || 'Reunión General'}

ASISTENTES:
- ${variables.nombreSolicitante || 'Participante 1'}

DESARROLLO:
Se dio inicio a la reunión con la participación de los asistentes mencionados.

ACUERDOS:
1. Se acordó proceder según lo establecido en la normativa.
2. Se programó seguimiento para la próxima semana.

Sin más asuntos que tratar, se dio por concluida la reunión.

[Firmas]

[NOTA: Documento generado por simulación debido a error en Gemini: ${errorMessage}]
      `.trim(),
      
      informe: `
INFORME TÉCNICO N° ${variables.numeroResolucion || '001-2024'}

PARA: Dirección General
DE: ${variables.nombreSolicitante || 'Responsable Técnico'}
ASUNTO: ${variables.tipoTramite || 'Informe General'}
FECHA: ${variables.fechaActual || new Date().toLocaleDateString('es-ES')}

I. ANTECEDENTES
Se ha procedido a evaluar la situación planteada.

II. ANÁLISIS
Los elementos analizados muestran conformidad con los estándares requeridos.

III. CONCLUSIONES
Se recomienda proceder con la implementación de las medidas propuestas.

Atentamente,
[Firma del Responsable]

[NOTA: Documento generado por simulación debido a error en Gemini: ${errorMessage}]
      `.trim()
    };

    return {
      success: true,
      content: templates[template] || templates.resolucion,
      metadata: {
        service: 'Simulación (Fallback)',
        template,
        variables,
        error: errorMessage,
        generatedAt: new Date().toISOString(),
        simulated: true
      }
    };
  }
}

// Exportar instancia singleton
const geminiTranscripcionService = new GeminiTranscripcionService();
export default geminiTranscripcionService;