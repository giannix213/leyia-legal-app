// useDocumentos.js - Hook para manejo de documentos
// Proporciona funcionalidad básica de documentos

import { useState, useCallback } from 'react';

export const useDocumentos = (expedienteId) => {
  const [documentos, setDocumentos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);

  const cargarDocumentos = useCallback(async () => {
    if (!expedienteId) return;
    
    setCargando(true);
    try {
      // Simulación de carga de documentos
      // En una implementación real, esto haría una llamada a Firebase
      const documentosSimulados = [
        {
          id: '1',
          nombre: 'Demanda.pdf',
          tipo: 'pdf',
          tamaño: '2.5 MB',
          fechaSubida: new Date(),
          expedienteId
        },
        {
          id: '2',
          nombre: 'Contestación.pdf',
          tipo: 'pdf',
          tamaño: '1.8 MB',
          fechaSubida: new Date(),
          expedienteId
        }
      ];
      
      setDocumentos(documentosSimulados);
    } catch (error) {
      console.error('Error cargando documentos:', error);
      setDocumentos([]);
    } finally {
      setCargando(false);
    }
  }, [expedienteId]);

  const subirDocumento = useCallback(async (archivo) => {
    setSubiendo(true);
    try {
      // Simulación de subida de documento
      const nuevoDocumento = {
        id: Date.now().toString(),
        nombre: archivo.name,
        tipo: archivo.type,
        tamaño: `${(archivo.size / 1024 / 1024).toFixed(1)} MB`,
        fechaSubida: new Date(),
        expedienteId
      };
      
      setDocumentos(prev => [...prev, nuevoDocumento]);
      return nuevoDocumento;
    } catch (error) {
      console.error('Error subiendo documento:', error);
      throw error;
    } finally {
      setSubiendo(false);
    }
  }, [expedienteId]);

  const subirArchivo = subirDocumento; // Alias para compatibilidad

  const eliminarDocumento = useCallback(async (documentoId) => {
    try {
      setDocumentos(prev => prev.filter(doc => doc.id !== documentoId));
    } catch (error) {
      console.error('Error eliminando documento:', error);
      throw error;
    }
  }, []);

  const descargarDocumento = useCallback(async (documentoId, nombreArchivo) => {
    try {
      console.log(`Descargando documento: ${nombreArchivo}`);
      // Simulación de descarga
      alert(`Descargando: ${nombreArchivo}`);
    } catch (error) {
      console.error('Error descargando documento:', error);
      throw error;
    }
  }, []);

  const abrirExploradorArchivos = useCallback(() => {
    // Crear input file invisible para abrir explorador
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
    
    input.onchange = async (e) => {
      const archivos = Array.from(e.target.files);
      for (const archivo of archivos) {
        try {
          await subirDocumento(archivo);
        } catch (error) {
          console.error('Error subiendo archivo:', error);
        }
      }
    };
    
    input.click();
  }, [subirDocumento]);

  return {
    documentos,
    cargando,
    subiendo,
    cargarDocumentos,
    subirDocumento,
    subirArchivo,
    eliminarDocumento,
    descargarDocumento,
    abrirExploradorArchivos
  };
};