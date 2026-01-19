/**
 * Hook personalizado para manejo de transcripción
 * Separación completa de lógica y UI
 */

import { useState, useCallback } from 'react';
import transcripcionService from '../services/TranscripcionService';

export const useTranscripcion = () => {
  const [estado, setEstado] = useState({
    transcripcion: '',
    isProcessing: false,
    error: null,
    metadata: null,
    progress: 0
  });

  /**
   * Procesa un archivo de video/audio para transcripción
   */
  const procesarArchivo = useCallback(async (file, options = {}) => {
    if (!file) {
      setEstado(prev => ({
        ...prev,
        error: 'No se proporcionó archivo para procesar'
      }));
      return false;
    }

    setEstado(prev => ({
      ...prev,
      isProcessing: true,
      error: null,
      progress: 0,
      transcripcion: '',
      metadata: null
    }));

    try {
      // Simular progreso para mejor UX
      const progressInterval = setInterval(() => {
        setEstado(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 200);

      const resultado = await transcripcionService.transcribeFile(file, options);

      clearInterval(progressInterval);

      if (resultado.success) {
        setEstado(prev => ({
          ...prev,
          transcripcion: resultado.text,
          metadata: resultado.metadata,
          isProcessing: false,
          progress: 100,
          error: null
        }));
        return true;
      } else {
        throw new Error('Error en el procesamiento del archivo');
      }

    } catch (error) {
      setEstado(prev => ({
        ...prev,
        isProcessing: false,
        error: error.message,
        progress: 0
      }));
      return false;
    }
  }, []);

  /**
   * Limpia el estado de transcripción
   */
  const limpiarTranscripcion = useCallback(() => {
    setEstado({
      transcripcion: '',
      isProcessing: false,
      error: null,
      metadata: null,
      progress: 0
    });
  }, []);

  /**
   * Establece transcripción manualmente
   */
  const establecerTranscripcion = useCallback((texto, metadata = null) => {
    setEstado(prev => ({
      ...prev,
      transcripcion: texto,
      metadata: metadata || {
        manual: true,
        creadoEn: new Date().toISOString()
      },
      error: null
    }));
  }, []);

  /**
   * Descarga la transcripción como archivo de texto
   */
  const descargarTranscripcion = useCallback((nombreArchivo = 'transcripcion.txt') => {
    if (!estado.transcripcion) {
      throw new Error('No hay transcripción disponible para descargar');
    }

    try {
      const contenido = `TRANSCRIPCIÓN
${estado.metadata?.fileName ? `Archivo: ${estado.metadata.fileName}` : ''}
${estado.metadata?.processedAt ? `Procesado: ${new Date(estado.metadata.processedAt).toLocaleString('es-ES')}` : ''}
${estado.metadata?.confidence ? `Confianza: ${(estado.metadata.confidence * 100).toFixed(1)}%` : ''}

---

${estado.transcripcion}

---
Generado por Sistema de Transcripción v1.0`;

      const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
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
      console.error('Error descargando transcripción:', error);
      throw new Error('Error al descargar la transcripción');
    }
  }, [estado.transcripcion, estado.metadata]);

  return {
    // Estado
    transcripcion: estado.transcripcion,
    isProcessing: estado.isProcessing,
    error: estado.error,
    metadata: estado.metadata,
    progress: estado.progress,
    
    // Acciones
    procesarArchivo,
    limpiarTranscripcion,
    establecerTranscripcion,
    descargarTranscripcion,
    
    // Computed
    tieneTranscripcion: Boolean(estado.transcripcion),
    esSimulada: estado.metadata?.simulated || false
  };
};