/**
 * PROCESADOR DE JURISPRUDENCIA CON FIREBASE EXTENSIONS (GEMINI)
 * Extrae automáticamente datos estructurados de documentos jurisprudenciales
 */

import GeminiService from './GeminiService';

class JurisprudenciaProcessor {
  constructor() {
    this.geminiService = new GeminiService();
    console.log('📚 Procesador de Jurisprudencia inicializado con servicio unificado');
  }

  /**
   * Procesar archivo de jurisprudencia y extraer datos estructurados
   */
  async procesarJurisprudencia(contenidoArchivo, nombreArchivo = '') {
    try {
      console.log('📄 Procesando jurisprudencia:', nombreArchivo);

      const prompt = this.construirPromptExtraccion(contenidoArchivo, nombreArchivo);
      const respuesta = await this.geminiService.generateText(prompt);
      
      return this.parsearRespuestaEstructurada(respuesta);
    } catch (error) {
      console.error('Error procesando jurisprudencia:', error);
      
      // Fallback: usar procesamiento básico
      return this.extraerDatosBasicos(contenidoArchivo);
    }
  }

  /**
   * Verificar conexión con Gemini
   */
  async verificarConexion() {
    return await this.geminiService.testConnection();
  }

  /**
   * Construir prompt especializado para extracción de jurisprudencia
   */
  construirPromptExtraccion(contenido, nombreArchivo) {
    return `
Eres un asistente legal especializado en análisis de jurisprudencia. Analiza el siguiente documento jurisprudencial y extrae la información estructurada.

DOCUMENTO: ${nombreArchivo}
CONTENIDO:
${contenido}

INSTRUCCIONES:
1. Extrae ÚNICAMENTE la información que esté claramente presente en el documento
2. Si algún dato no está disponible, usa "No especificado"
3. Para palabras clave, identifica los conceptos jurídicos principales
4. El criterio jurisprudencial debe ser la doctrina o principio establecido

FORMATO DE RESPUESTA (JSON):
{
  "titulo": "Título descriptivo de la jurisprudencia",
  "tipo": "casacion|pleno|acuerdo|precedente|vinculante|constitucional|otro",
  "materia": "civil|penal|laboral|comercial|familia|contencioso|constitucional|tributario",
  "numeroSentencia": "Número de la sentencia o resolución",
  "fecha": "YYYY-MM-DD (si está disponible)",
  "tribunal": "Nombre del tribunal o corte",
  "sumilla": "Resumen breve del caso (máximo 200 palabras)",
  "criterioJurisprudencial": "Doctrina o criterio jurisprudencial establecido",
  "palabrasClave": ["concepto1", "concepto2", "concepto3"],
  "observaciones": "Notas adicionales relevantes"
}

RESPONDE ÚNICAMENTE CON EL JSON, SIN TEXTO ADICIONAL.
`;
  }



  /**
   * Parsear respuesta estructurada de Gemini
   */
  parsearRespuestaEstructurada(respuesta) {
    try {
      // Limpiar la respuesta para extraer solo el JSON
      let jsonText = respuesta.trim();
      
      // Remover markdown si existe
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      const datos = JSON.parse(jsonText);
      
      // Validar y limpiar datos
      return this.validarYLimpiarDatos(datos);
    } catch (error) {
      console.error('Error parseando respuesta:', error);
      console.log('Respuesta original:', respuesta);
      
      // Fallback: extraer datos básicos manualmente
      return this.extraerDatosBasicos(respuesta);
    }
  }

  /**
   * Validar y limpiar datos extraídos
   */
  validarYLimpiarDatos(datos) {
    const tiposValidos = ['casacion', 'pleno', 'acuerdo', 'precedente', 'vinculante', 'constitucional', 'otro'];
    const materiasValidas = ['civil', 'penal', 'laboral', 'comercial', 'familia', 'contencioso', 'constitucional', 'tributario'];

    return {
      titulo: datos.titulo || 'Jurisprudencia sin título',
      tipo: tiposValidos.includes(datos.tipo) ? datos.tipo : 'otro',
      materia: materiasValidas.includes(datos.materia) ? datos.materia : 'civil',
      numeroSentencia: datos.numeroSentencia || '',
      fecha: this.validarFecha(datos.fecha) || '',
      tribunal: datos.tribunal || '',
      sumilla: datos.sumilla || '',
      criterioJurisprudencial: datos.criterioJurisprudencial || '',
      palabrasClave: Array.isArray(datos.palabrasClave) ? datos.palabrasClave : [],
      observaciones: datos.observaciones || ''
    };
  }

  /**
   * Validar formato de fecha
   */
  validarFecha(fecha) {
    if (!fecha || fecha === 'No especificado') return '';
    
    // Intentar parsear la fecha
    const fechaObj = new Date(fecha);
    if (isNaN(fechaObj.getTime())) return '';
    
    // Retornar en formato YYYY-MM-DD
    return fechaObj.toISOString().split('T')[0];
  }

  /**
   * Extraer datos básicos como fallback
   */
  extraerDatosBasicos(texto) {
    console.log('🔄 Usando extracción básica como fallback');
    
    return {
      titulo: 'Jurisprudencia procesada automáticamente',
      tipo: 'otro',
      materia: 'civil',
      numeroSentencia: '',
      fecha: '',
      tribunal: '',
      sumilla: texto.substring(0, 200) + '...',
      criterioJurisprudencial: 'Criterio a revisar manualmente',
      palabrasClave: [],
      observaciones: 'Procesado automáticamente - Revisar y completar datos'
    };
  }

  /**
   * Procesar múltiples archivos
   */
  async procesarMultiplesArchivos(archivos) {
    const resultados = [];
    
    for (const archivo of archivos) {
      try {
        const contenido = await this.leerArchivo(archivo);
        const datos = await this.procesarJurisprudencia(contenido, archivo.name);
        resultados.push({ archivo: archivo.name, datos, exito: true });
      } catch (error) {
        console.error(`Error procesando ${archivo.name}:`, error);
        resultados.push({ 
          archivo: archivo.name, 
          error: error.message, 
          exito: false 
        });
      }
    }
    
    return resultados;
  }

  /**
   * Leer contenido de archivo
   */
  async leerArchivo(archivo) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        resolve(e.target.result);
      };
      
      reader.onerror = () => {
        reject(new Error('Error leyendo el archivo'));
      };
      
      // Leer como texto
      reader.readAsText(archivo);
    });
  }

  /**
   * Generar respuesta para el chat
   */
  generarRespuestaChat(resultados) {
    if (!Array.isArray(resultados)) {
      resultados = [resultados];
    }

    const exitosos = resultados.filter(r => r.exito);
    const fallidos = resultados.filter(r => !r.exito);

    let respuesta = '📚 **Procesamiento de Jurisprudencia Completado**\n\n';

    if (exitosos.length > 0) {
      respuesta += `✅ **${exitosos.length} documento(s) procesado(s) exitosamente:**\n`;
      exitosos.forEach(resultado => {
        const datos = resultado.datos;
        respuesta += `\n📄 **${datos.titulo}**\n`;
        respuesta += `• Tipo: ${datos.tipo}\n`;
        respuesta += `• Materia: ${datos.materia}\n`;
        if (datos.numeroSentencia) respuesta += `• Sentencia: ${datos.numeroSentencia}\n`;
        if (datos.tribunal) respuesta += `• Tribunal: ${datos.tribunal}\n`;
      });
    }

    if (fallidos.length > 0) {
      respuesta += `\n❌ **${fallidos.length} documento(s) con errores:**\n`;
      fallidos.forEach(resultado => {
        respuesta += `• ${resultado.archivo}: ${resultado.error}\n`;
      });
    }

    respuesta += '\n🎯 **Los datos han sido guardados automáticamente en tu base de jurisprudencia.**';
    
    return respuesta;
  }
}

export default JurisprudenciaProcessor;