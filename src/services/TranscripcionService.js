/**
 * Servicio de Transcripción - Maneja la comunicación con APIs de transcripción
 * Ahora usa Google Gemini como servicio principal
 */

import geminiTranscripcionService from './GeminiTranscripcionService';

class TranscripcionService {
  constructor() {
    // Configuración de endpoints - para futuras expansiones
    this.baseURL = process.env.REACT_APP_API_URL || '/api';
    this.endpoints = {
      transcribe: `${this.baseURL}/transcribe`,
      generateDocument: `${this.baseURL}/generate-document`
    };
  }

  /**
   * Transcribe un archivo de video/audio usando Google Gemini
   * @param {File} file - Archivo de video o audio
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>} - Resultado de la transcripción
   */
  async transcribeFile(file, options = {}) {
    if (!file) {
      throw new Error('No se proporcionó archivo para transcribir');
    }

    // Validar tipo de archivo
    const allowedTypes = ['video/', 'audio/'];
    const isValidType = allowedTypes.some(type => file.type.startsWith(type));
    
    if (!isValidType) {
      throw new Error('Tipo de archivo no soportado. Use video o audio.');
    }

    try {
      console.log('🚀 Usando Google Gemini para transcripción...');
      
      // Usar el servicio de Gemini
      const result = await geminiTranscripcionService.transcribeFile(file, options);
      
      return result;

    } catch (error) {
      console.error('Error en transcripción:', error);
      
      // En desarrollo, simular transcripción como último recurso
      if (process.env.NODE_ENV === 'development') {
        console.warn('🚧 Último recurso: Simulando transcripción');
        await this.simulateDelay(2000);
        
        return {
          success: true,
          text: this.generateMockTranscription(file.name),
          confidence: 0.95,
          duration: 120,
          segments: [],
          metadata: {
            fileName: file.name,
            fileSize: file.size,
            processedAt: new Date().toISOString(),
            service: 'Simulación (Último recurso)',
            error: error.message,
            simulated: true
          }
        };
      }
      
      throw error;
    }
  }

  /**
   * Genera un documento usando Google Gemini
   * @param {Object} params - Parámetros para generar documento
   * @returns {Promise<Object>} - Documento generado
   */
  async generateDocument({ prompt, transcription, variables, template }) {
    try {
      console.log('🚀 Usando Google Gemini para generación de documento...');
      
      // Usar el servicio de Gemini
      const result = await geminiTranscripcionService.generateDocument({
        prompt,
        transcription,
        variables,
        template
      });
      
      return result;

    } catch (error) {
      console.error('Error generando documento:', error);
      
      // En desarrollo, simular generación
      if (process.env.NODE_ENV === 'development') {
        console.warn('🚧 Fallback: Simulando generación de documento');
        await this.simulateDelay(1500);
        
        return {
          success: true,
          content: this.generateMockDocument(variables, template),
          metadata: {
            template,
            variables,
            service: 'Simulación (Fallback)',
            error: error.message,
            simulated: true
          },
          generatedAt: new Date().toISOString()
        };
      }
      
      throw error;
    }
  }

  /**
   * Simula delay para desarrollo
   */
  async simulateDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Genera transcripción simulada para desarrollo
   */
  generateMockTranscription(fileName) {
    const mockTexts = [
      "En la audiencia del día de hoy se presentaron las siguientes alegaciones por parte del demandante. Se solicita que se admita a trámite la demanda presentada contra la empresa constructora por incumplimiento de contrato.",
      "El testigo declaró que estuvo presente en el momento de los hechos y puede confirmar que el accidente ocurrió debido a negligencia del conductor del vehículo azul.",
      "Se procede a leer el acta de la reunión anterior donde se acordó implementar las medidas correctivas necesarias para evitar futuros inconvenientes en el proceso.",
      "La perito médico explica que las lesiones presentadas por el paciente son consistentes con el tipo de accidente descrito en la denuncia policial."
    ];
    
    const randomText = mockTexts[Math.floor(Math.random() * mockTexts.length)];
    return `[TRANSCRIPCIÓN SIMULADA de ${fileName}]\n\n${randomText}\n\n[Fin de transcripción simulada]`;
  }

  /**
   * Genera documento simulado para desarrollo
   */
  generateMockDocument(variables, template) {
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
      `.trim()
    };

    return templates[template] || templates.resolucion;
  }
}

// Exportar instancia singleton
const transcripcionService = new TranscripcionService();
export default transcripcionService;