/**
 * Hook personalizado para manejo de prompts
 * Gestión completa del sistema de prompts como entidades reales
 */

import { useState, useEffect, useCallback } from 'react';
import promptService from '../services/PromptService';
import transcripcionService from '../services/TranscripcionService';

export const usePrompts = (organizacionId) => {
  const [estado, setEstado] = useState({
    prompts: [],
    promptSeleccionado: null,
    isLoading: false,
    error: null,
    isGenerating: false
  });

  /**
   * Carga todos los prompts de la organización
   */
  const cargarPrompts = useCallback(async () => {
    if (!organizacionId) return;

    setEstado(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const prompts = await promptService.obtenerPrompts(organizacionId);
      setEstado(prev => ({
        ...prev,
        prompts,
        isLoading: false
      }));
    } catch (error) {
      setEstado(prev => ({
        ...prev,
        error: error.message,
        isLoading: false
      }));
    }
  }, [organizacionId]);

  /**
   * Carga prompts al montar el componente
   */
  useEffect(() => {
    cargarPrompts();
  }, [cargarPrompts]);

  /**
   * Crea un nuevo prompt
   */
  const crearPrompt = useCallback(async (promptData) => {
    if (!organizacionId) {
      throw new Error('ID de organización requerido');
    }

    setEstado(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const nuevoPrompt = await promptService.crearPrompt(promptData, organizacionId);
      
      setEstado(prev => ({
        ...prev,
        prompts: [nuevoPrompt, ...prev.prompts],
        isLoading: false
      }));

      return nuevoPrompt;
    } catch (error) {
      setEstado(prev => ({
        ...prev,
        error: error.message,
        isLoading: false
      }));
      throw error;
    }
  }, [organizacionId]);

  /**
   * Actualiza un prompt existente
   */
  const actualizarPrompt = useCallback(async (promptId, updates) => {
    setEstado(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const promptActualizado = await promptService.actualizarPrompt(promptId, updates);
      
      setEstado(prev => ({
        ...prev,
        prompts: prev.prompts.map(p => 
          p.id === promptId ? promptActualizado : p
        ),
        promptSeleccionado: prev.promptSeleccionado?.id === promptId 
          ? promptActualizado 
          : prev.promptSeleccionado,
        isLoading: false
      }));

      return promptActualizado;
    } catch (error) {
      setEstado(prev => ({
        ...prev,
        error: error.message,
        isLoading: false
      }));
      throw error;
    }
  }, []);

  /**
   * Elimina un prompt
   */
  const eliminarPrompt = useCallback(async (promptId) => {
    setEstado(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await promptService.eliminarPrompt(promptId);
      
      setEstado(prev => ({
        ...prev,
        prompts: prev.prompts.filter(p => p.id !== promptId),
        promptSeleccionado: prev.promptSeleccionado?.id === promptId 
          ? null 
          : prev.promptSeleccionado,
        isLoading: false
      }));

      return true;
    } catch (error) {
      setEstado(prev => ({
        ...prev,
        error: error.message,
        isLoading: false
      }));
      throw error;
    }
  }, []);

  /**
   * Selecciona un prompt
   */
  const seleccionarPrompt = useCallback((prompt) => {
    setEstado(prev => ({
      ...prev,
      promptSeleccionado: prompt,
      error: null
    }));
  }, []);

  /**
   * Obtiene prompts por tipo
   */
  const obtenerPromptsPorTipo = useCallback((tipo) => {
    return estado.prompts.filter(prompt => prompt.tipo === tipo);
  }, [estado.prompts]);

  /**
   * Genera documento usando prompt seleccionado
   */
  const generarDocumento = useCallback(async (transcripcion, variables = {}, template = 'resolucion') => {
    if (!estado.promptSeleccionado) {
      throw new Error('Debe seleccionar un prompt primero');
    }

    setEstado(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      // Procesar el prompt con las variables
      const promptProcesado = promptService.procesarPrompt(
        estado.promptSeleccionado,
        variables,
        transcripcion
      );

      // Generar documento usando el servicio de transcripción
      const resultado = await transcripcionService.generateDocument({
        prompt: promptProcesado,
        transcription: transcripcion,
        variables,
        template
      });

      setEstado(prev => ({ ...prev, isGenerating: false }));

      return resultado;
    } catch (error) {
      setEstado(prev => ({
        ...prev,
        error: error.message,
        isGenerating: false
      }));
      throw error;
    }
  }, [estado.promptSeleccionado]);

  /**
   * Instala prompts predeterminados
   */
  const instalarPromptsDefault = useCallback(async () => {
    if (!organizacionId) {
      throw new Error('ID de organización requerido');
    }

    setEstado(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const promptsInstalados = await promptService.instalarPromptsDefault(organizacionId);
      
      setEstado(prev => ({
        ...prev,
        prompts: [...promptsInstalados, ...prev.prompts],
        isLoading: false
      }));

      return promptsInstalados;
    } catch (error) {
      setEstado(prev => ({
        ...prev,
        error: error.message,
        isLoading: false
      }));
      throw error;
    }
  }, [organizacionId]);

  /**
   * Descarga un documento generado
   */
  const descargarDocumento = useCallback((contenido, nombreArchivo = 'documento.txt', variables = {}) => {
    try {
      // Agregar metadata al documento
      const metadata = `DOCUMENTO GENERADO
Fecha: ${new Date().toLocaleString('es-ES')}
Prompt: ${estado.promptSeleccionado?.nombre || 'Sin prompt'}
${variables.numeroResolucion ? `Número: ${variables.numeroResolucion}` : ''}

---

`;

      const contenidoCompleto = metadata + contenido;
      
      const blob = new Blob([contenidoCompleto], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = nombreArchivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Error descargando documento:', error);
      throw new Error('Error al descargar el documento');
    }
  }, [estado.promptSeleccionado]);

  return {
    // Estado
    prompts: estado.prompts,
    promptSeleccionado: estado.promptSeleccionado,
    isLoading: estado.isLoading,
    error: estado.error,
    isGenerating: estado.isGenerating,
    
    // Acciones
    cargarPrompts,
    crearPrompt,
    actualizarPrompt,
    eliminarPrompt,
    seleccionarPrompt,
    generarDocumento,
    instalarPromptsDefault,
    descargarDocumento,
    
    // Utilidades
    obtenerPromptsPorTipo,
    
    // Computed
    tienePrompts: estado.prompts.length > 0,
    tienePromptSeleccionado: Boolean(estado.promptSeleccionado),
    promptsPorTipo: {
      resumen: estado.prompts.filter(p => p.tipo === 'resumen'),
      resolucion: estado.prompts.filter(p => p.tipo === 'resolucion'),
      informe: estado.prompts.filter(p => p.tipo === 'informe'),
      acta: estado.prompts.filter(p => p.tipo === 'acta'),
      dictamen: estado.prompts.filter(p => p.tipo === 'dictamen'),
      oficio: estado.prompts.filter(p => p.tipo === 'oficio')
    }
  };
};