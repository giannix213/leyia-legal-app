/**
 * SERVICIO GEMINI UNIFICADO
 * Funciona con Firebase Extensions o API directa
 */

import { getFunctions, httpsCallable } from 'firebase/functions';

class GeminiService {
  constructor() {
    this.functions = getFunctions();
    this.useFirebaseExtension = true; // Cambiar a false para usar API directa
    
    // Intentar inicializar Firebase Extension
    try {
      this.generateText = httpsCallable(this.functions, 'ext-gemini-ai-generateText');
      console.log('🔥 Gemini Service inicializado con Firebase Extensions');
    } catch (error) {
      console.warn('⚠️ Firebase Extensions no disponible, usando API directa');
      this.useFirebaseExtension = false;
      this.apiKey = process.env.REACT_APP_GEMINI_API_KEY;
      this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    }
  }

  /**
   * Generar texto con Gemini (Firebase Extension o API directa)
   */
  async generateText(prompt, options = {}) {
    if (this.useFirebaseExtension) {
      return await this.generateWithFirebaseExtension(prompt, options);
    } else {
      return await this.generateWithDirectAPI(prompt, options);
    }
  }

  /**
   * Generar con Firebase Extension
   */
  async generateWithFirebaseExtension(prompt, options = {}) {
    try {
      console.log('🔥 Usando Firebase Extension para Gemini');
      
      const result = await this.generateText({
        prompt: prompt,
        model: options.model || 'gemini-pro',
        generationConfig: {
          temperature: options.temperature || 0.1,
          topK: options.topK || 1,
          topP: options.topP || 1,
          maxOutputTokens: options.maxOutputTokens || 2048,
        }
      });

      if (result.data && result.data.response) {
        return result.data.response;
      } else {
        throw new Error('Respuesta inválida de Firebase Extension');
      }
    } catch (error) {
      console.error('Error en Firebase Extension:', error);
      
      // Fallback a API directa
      console.log('🔄 Fallback a API directa');
      this.useFirebaseExtension = false;
      return await this.generateWithDirectAPI(prompt, options);
    }
  }

  /**
   * Generar con API directa
   */
  async generateWithDirectAPI(prompt, options = {}) {
    if (!this.apiKey) {
      throw new Error('API Key de Gemini no configurada y Firebase Extension no disponible');
    }

    console.log('🌐 Usando API directa de Gemini');

    const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: options.temperature || 0.1,
          topK: options.topK || 1,
          topP: options.topP || 1,
          maxOutputTokens: options.maxOutputTokens || 2048,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Error en API de Gemini: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Respuesta inválida de Gemini');
    }

    return data.candidates[0].content.parts[0].text;
  }

  /**
   * Verificar disponibilidad del servicio
   */
  async testConnection() {
    try {
      const testPrompt = "Responde solo con 'OK' si puedes procesar este mensaje.";
      const response = await this.generateText(testPrompt);
      
      return {
        available: true,
        method: this.useFirebaseExtension ? 'Firebase Extension' : 'API Directa',
        response: response
      };
    } catch (error) {
      return {
        available: false,
        method: 'Ninguno',
        error: error.message
      };
    }
  }

  /**
   * Cambiar método de conexión
   */
  setMethod(useFirebaseExtension) {
    this.useFirebaseExtension = useFirebaseExtension;
    console.log(`🔄 Método cambiado a: ${useFirebaseExtension ? 'Firebase Extension' : 'API Directa'}`);
  }
}

export default GeminiService;