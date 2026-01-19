/**
 * Servicio de Prompts - Maneja la gestión de prompts para IA
 * Sistema completo de prompts como entidades reales
 */

import { db } from '../firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';

class PromptService {
  constructor() {
    this.collectionName = 'prompts';
  }

  /**
   * Crea un nuevo prompt
   * @param {Object} promptData - Datos del prompt
   * @param {string} organizacionId - ID de la organización
   * @returns {Promise<Object>} - Prompt creado
   */
  async crearPrompt(promptData, organizacionId) {
    try {
      const prompt = {
        ...promptData,
        organizacionId,
        creadoEn: new Date().toISOString(),
        actualizadoEn: new Date().toISOString(),
        activo: true,
        version: 1
      };

      // Validar datos requeridos
      this.validarPrompt(prompt);

      const docRef = await addDoc(collection(db, this.collectionName), prompt);
      
      return {
        id: docRef.id,
        ...prompt
      };
    } catch (error) {
      console.error('Error creando prompt:', error);
      throw new Error(`Error al crear prompt: ${error.message}`);
    }
  }

  /**
   * Obtiene todos los prompts de una organización
   * @param {string} organizacionId - ID de la organización
   * @returns {Promise<Array>} - Lista de prompts
   */
  async obtenerPrompts(organizacionId) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('organizacionId', '==', organizacionId),
        where('activo', '==', true)
        // Removido orderBy para evitar necesidad de índice compuesto
      );

      const querySnapshot = await getDocs(q);
      const prompts = [];

      querySnapshot.forEach((doc) => {
        prompts.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Ordenar en el cliente para evitar índices compuestos
      prompts.sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn));

      return prompts;
    } catch (error) {
      console.error('Error obteniendo prompts:', error);
      throw new Error(`Error al obtener prompts: ${error.message}`);
    }
  }

  /**
   * Obtiene prompts por tipo
   * @param {string} organizacionId - ID de la organización
   * @param {string} tipo - Tipo de prompt
   * @returns {Promise<Array>} - Lista de prompts del tipo especificado
   */
  async obtenerPromptsPorTipo(organizacionId, tipo) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('organizacionId', '==', organizacionId),
        where('tipo', '==', tipo),
        where('activo', '==', true)
        // Removido orderBy para evitar necesidad de índice compuesto
      );

      const querySnapshot = await getDocs(q);
      const prompts = [];

      querySnapshot.forEach((doc) => {
        prompts.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Ordenar en el cliente para evitar índices compuestos
      prompts.sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn));

      return prompts;
    } catch (error) {
      console.error('Error obteniendo prompts por tipo:', error);
      throw new Error(`Error al obtener prompts por tipo: ${error.message}`);
    }
  }

  /**
   * Obtiene un prompt específico
   * @param {string} promptId - ID del prompt
   * @returns {Promise<Object>} - Prompt encontrado
   */
  async obtenerPrompt(promptId) {
    try {
      const docRef = doc(db, this.collectionName, promptId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Prompt no encontrado');
      }

      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } catch (error) {
      console.error('Error obteniendo prompt:', error);
      throw new Error(`Error al obtener prompt: ${error.message}`);
    }
  }

  /**
   * Actualiza un prompt existente
   * @param {string} promptId - ID del prompt
   * @param {Object} updates - Datos a actualizar
   * @returns {Promise<Object>} - Prompt actualizado
   */
  async actualizarPrompt(promptId, updates) {
    try {
      const docRef = doc(db, this.collectionName, promptId);
      
      const updateData = {
        ...updates,
        actualizadoEn: new Date().toISOString(),
        version: (updates.version || 1) + 1
      };

      await updateDoc(docRef, updateData);

      // Obtener el prompt actualizado
      return await this.obtenerPrompt(promptId);
    } catch (error) {
      console.error('Error actualizando prompt:', error);
      throw new Error(`Error al actualizar prompt: ${error.message}`);
    }
  }

  /**
   * Elimina un prompt (soft delete)
   * @param {string} promptId - ID del prompt
   * @returns {Promise<boolean>} - Éxito de la operación
   */
  async eliminarPrompt(promptId) {
    try {
      const docRef = doc(db, this.collectionName, promptId);
      
      await updateDoc(docRef, {
        activo: false,
        eliminadoEn: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error eliminando prompt:', error);
      throw new Error(`Error al eliminar prompt: ${error.message}`);
    }
  }

  /**
   * Procesa un prompt con variables
   * @param {Object} prompt - Prompt a procesar
   * @param {Object} variables - Variables a reemplazar
   * @param {string} transcripcion - Transcripción del audio/video
   * @returns {string} - Prompt procesado
   */
  procesarPrompt(prompt, variables = {}, transcripcion = '') {
    let contenidoProcesado = prompt.contenido;

    // Reemplazar variables del sistema
    const variablesSistema = {
      '{{TRANSCRIPCION}}': transcripcion,
      '{{FECHA_ACTUAL}}': new Date().toLocaleDateString('es-ES'),
      '{{HORA_ACTUAL}}': new Date().toLocaleTimeString('es-ES'),
      '{{FECHA_COMPLETA}}': new Date().toLocaleString('es-ES')
    };

    // Reemplazar variables del sistema
    Object.entries(variablesSistema).forEach(([variable, valor]) => {
      contenidoProcesado = contenidoProcesado.replace(new RegExp(variable, 'g'), valor);
    });

    // Reemplazar variables personalizadas
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key.toUpperCase()}}}`, 'g');
      contenidoProcesado = contenidoProcesado.replace(regex, value || '');
    });

    return contenidoProcesado;
  }

  /**
   * Valida los datos de un prompt
   * @param {Object} prompt - Prompt a validar
   */
  validarPrompt(prompt) {
    const camposRequeridos = ['nombre', 'contenido', 'tipo'];
    
    for (const campo of camposRequeridos) {
      if (!prompt[campo] || prompt[campo].trim() === '') {
        throw new Error(`El campo '${campo}' es requerido`);
      }
    }

    // Validar tipo
    const tiposValidos = ['resumen', 'resolucion', 'informe', 'acta', 'dictamen', 'oficio'];
    if (!tiposValidos.includes(prompt.tipo)) {
      throw new Error(`Tipo de prompt no válido. Tipos permitidos: ${tiposValidos.join(', ')}`);
    }

    // Validar longitud del contenido
    if (prompt.contenido.length > 10000) {
      throw new Error('El contenido del prompt no puede exceder 10,000 caracteres');
    }
  }

  /**
   * Obtiene prompts predeterminados del sistema
   * @returns {Array} - Lista de prompts predeterminados
   */
  obtenerPromptsDefault() {
    return [
      {
        nombre: 'Resumen de Audiencia',
        tipo: 'resumen',
        categoria: 'procesal',
        descripcion: 'Genera un resumen estructurado de una audiencia judicial',
        contenido: `Analiza la siguiente transcripción de audiencia y genera un resumen estructurado:

TRANSCRIPCIÓN:
{{TRANSCRIPCION}}

Por favor, estructura el resumen con los siguientes elementos:
1. DATOS GENERALES (fecha, expediente, partes)
2. DESARROLLO DE LA AUDIENCIA (principales alegaciones)
3. ACUERDOS Y RESOLUCIONES
4. PRÓXIMAS ACTUACIONES

Mantén un lenguaje formal y jurídico apropiado.`,
        variables: ['TRANSCRIPCION'],
        activo: true,
        esDefault: true
      },
      {
        nombre: 'Resolución Administrativa',
        tipo: 'resolucion',
        categoria: 'administrativa',
        descripcion: 'Genera una resolución administrativa basada en transcripción',
        contenido: `Basándote en la siguiente información, redacta una resolución administrativa:

INFORMACIÓN BASE:
{{TRANSCRIPCION}}

DATOS ESPECÍFICOS:
- Número de Resolución: {{NUMERO_RESOLUCION}}
- Solicitante: {{NOMBRE_SOLICITANTE}}
- Tipo de Trámite: {{TIPO_TRAMITE}}
- Fecha: {{FECHA_ACTUAL}}

Estructura la resolución con:
1. VISTO
2. CONSIDERANDO
3. SE RESUELVE

Utiliza el formato legal estándar peruano.`,
        variables: ['TRANSCRIPCION', 'NUMERO_RESOLUCION', 'NOMBRE_SOLICITANTE', 'TIPO_TRAMITE'],
        activo: true,
        esDefault: true
      },
      {
        nombre: 'Informe Técnico',
        tipo: 'informe',
        categoria: 'tecnica',
        descripcion: 'Genera un informe técnico basado en transcripción',
        contenido: `Elabora un informe técnico basado en la siguiente información:

DATOS RECOPILADOS:
{{TRANSCRIPCION}}

INFORMACIÓN ADICIONAL:
- Responsable: {{NOMBRE_SOLICITANTE}}
- Asunto: {{TIPO_TRAMITE}}
- Fecha: {{FECHA_ACTUAL}}

Estructura el informe con:
I. ANTECEDENTES
II. ANÁLISIS TÉCNICO
III. CONCLUSIONES
IV. RECOMENDACIONES

Mantén un enfoque técnico y objetivo.`,
        variables: ['TRANSCRIPCION', 'NOMBRE_SOLICITANTE', 'TIPO_TRAMITE'],
        activo: true,
        esDefault: true
      }
    ];
  }

  /**
   * Instala prompts predeterminados para una organización
   * @param {string} organizacionId - ID de la organización
   * @returns {Promise<Array>} - Prompts instalados
   */
  async instalarPromptsDefault(organizacionId) {
    try {
      const promptsDefault = this.obtenerPromptsDefault();
      const promptsInstalados = [];

      for (const promptData of promptsDefault) {
        const prompt = await this.crearPrompt(promptData, organizacionId);
        promptsInstalados.push(prompt);
      }

      return promptsInstalados;
    } catch (error) {
      console.error('Error instalando prompts default:', error);
      throw new Error(`Error al instalar prompts predeterminados: ${error.message}`);
    }
  }
}

// Exportar instancia singleton
const promptService = new PromptService();
export default promptService;