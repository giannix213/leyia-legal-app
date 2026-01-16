import { useState, useCallback, useEffect } from 'react';

export function useLocalDataManager(organizacionId) {
  const [localData, setLocalData] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Clave para localStorage específica de la organización
  const getStorageKey = useCallback((suffix = '') => {
    return `expedientes_${organizacionId}${suffix ? '_' + suffix : ''}`;
  }, [organizacionId]);

  // Guardar datos en localStorage
  const saveToLocal = useCallback(async (data) => {
    if (!organizacionId || !data) return false;

    try {
      const dataToSave = {
        expedientes: data.expedientes || [],
        tareas: data.tareas || [],
        audienciasSemana: data.audienciasSemana || [],
        tramitesPendientes: data.tramitesPendientes || [],
        timestamp: new Date().toISOString(),
        organizacionId: organizacionId
      };

      // Guardar datos principales
      localStorage.setItem(getStorageKey(), JSON.stringify(dataToSave));
      
      // Guardar timestamp de última sincronización
      localStorage.setItem(getStorageKey('lastSync'), new Date().toISOString());
      
      setLocalData(dataToSave);
      setLastSync(new Date().toISOString());
      
      console.log('💾 Datos guardados localmente para organización:', organizacionId);
      return true;
    } catch (error) {
      console.error('❌ Error guardando datos localmente:', error);
      return false;
    }
  }, [organizacionId, getStorageKey]);

  // Cargar datos desde localStorage
  const loadFromLocal = useCallback(() => {
    if (!organizacionId) return null;

    try {
      const savedData = localStorage.getItem(getStorageKey());
      const savedSync = localStorage.getItem(getStorageKey('lastSync'));
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        
        // Verificar que los datos sean de la organización correcta
        if (parsedData.organizacionId === organizacionId) {
          setLocalData(parsedData);
          setLastSync(savedSync);
          
          console.log('📂 Datos cargados desde localStorage:', {
            expedientes: parsedData.expedientes?.length || 0,
            lastSync: savedSync
          });
          
          return parsedData;
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error cargando datos locales:', error);
      return null;
    }
  }, [organizacionId, getStorageKey]);

  // Verificar si hay datos locales disponibles
  const hasLocalData = useCallback(() => {
    if (!organizacionId) return false;
    
    const savedData = localStorage.getItem(getStorageKey());
    return !!savedData;
  }, [organizacionId, getStorageKey]);

  // Verificar si los datos locales están actualizados (menos de 24 horas)
  const isLocalDataFresh = useCallback(() => {
    if (!lastSync) return false;
    
    const syncDate = new Date(lastSync);
    const now = new Date();
    const hoursDiff = (now - syncDate) / (1000 * 60 * 60);
    
    return hoursDiff < 24; // Datos frescos si tienen menos de 24 horas
  }, [lastSync]);

  // Descarga automática sin solicitar ubicación al usuario
  const autoDownload = useCallback(async (data, format = 'json', forceDownload = false) => {
    if (!data || !data.expedientes || data.expedientes.length === 0) {
      console.warn('⚠️ No hay datos para descargar automáticamente');
      return false;
    }

    // Verificar si ya se descargó hoy (evitar descargas duplicadas)
    const today = new Date().toISOString().split('T')[0];
    const downloadKey = `download_${organizacionId}_${format}_${today}`;
    
    if (!forceDownload && localStorage.getItem(downloadKey)) {
      console.log('📥 Descarga ya realizada hoy para:', format);
      return true;
    }

    try {
      setIsDownloading(true);
      setDownloadProgress(10);

      let content, filename, mimeType;

      if (format === 'json') {
        content = JSON.stringify(data, null, 2);
        filename = `expedientes_${organizacionId}_${today}.json`;
        mimeType = 'application/json';
      } else if (format === 'csv') {
        setDownloadProgress(30);
        
        // Convertir expedientes a CSV
        const expedientes = data.expedientes;
        const headers = ['Número', 'Cliente', 'Tipo', 'Estado', 'Prioridad', 'Descripción', 'Abogado', 'Demandante', 'Demandado'];
        const csvRows = [
          headers.join(','),
          ...expedientes.map(exp => [
            exp.numero || '',
            exp.cliente || '',
            exp.tipo || '',
            exp.estado || '',
            exp.prioridad || '',
            (exp.descripcion || '').replace(/,/g, ';').replace(/"/g, '""'),
            exp.abogado || '',
            exp.demandante || '',
            exp.demandado || ''
          ].map(field => `"${field}"`).join(','))
        ];
        
        content = csvRows.join('\n');
        filename = `expedientes_${organizacionId}_${today}.csv`;
        mimeType = 'text/csv;charset=utf-8';
      }

      setDownloadProgress(60);

      // Crear y descargar archivo automáticamente
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      setDownloadProgress(80);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloadProgress(100);

      // Marcar como descargado hoy
      localStorage.setItem(downloadKey, new Date().toISOString());

      console.log('📥 Descarga automática completada:', filename);
      
      // Limpiar estado después de un breve delay
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress(0);
      }, 1000);
      
      return true;
    } catch (error) {
      console.error('❌ Error en descarga automática:', error);
      setIsDownloading(false);
      setDownloadProgress(0);
      return false;
    }
  }, [organizacionId]);

  // Forzar descarga manual (ignora restricciones de tiempo)
  const forceDownload = useCallback(async (data) => {
    if (!data || !data.expedientes || data.expedientes.length === 0) {
      console.warn('⚠️ No hay datos para descargar');
      return false;
    }

    try {
      console.log('🔄 Forzando descarga manual de datos...');
      
      const [jsonResult, csvResult] = await Promise.all([
        autoDownload(data, 'json', true), // forceDownload = true
        autoDownload(data, 'csv', true)   // forceDownload = true
      ]);
      
      if (jsonResult && csvResult) {
        console.log('✅ Descarga manual completada exitosamente');
        return true;
      } else {
        console.warn('⚠️ Algunas descargas manuales fallaron');
        return false;
      }
    } catch (error) {
      console.error('❌ Error en descarga manual:', error);
      return false;
    }
  }, [autoDownload]);
  const clearLocalData = useCallback(() => {
    if (!organizacionId) return;

    try {
      localStorage.removeItem(getStorageKey());
      localStorage.removeItem(getStorageKey('lastSync'));
      
      setLocalData(null);
      setLastSync(null);
      
      console.log('🗑️ Datos locales eliminados para organización:', organizacionId);
    } catch (error) {
      console.error('❌ Error eliminando datos locales:', error);
    }
  }, [organizacionId, getStorageKey]);

  // Obtener estadísticas de almacenamiento
  const getStorageStats = useCallback(() => {
    if (!localData) return null;

    const dataSize = JSON.stringify(localData).length;
    const sizeInKB = (dataSize / 1024).toFixed(2);
    
    return {
      expedientes: localData.expedientes?.length || 0,
      tareas: localData.tareas?.length || 0,
      sizeKB: sizeInKB,
      lastSync: lastSync,
      isFresh: isLocalDataFresh()
    };
  }, [localData, lastSync, isLocalDataFresh]);

  // Cargar datos al inicializar si hay organización
  useEffect(() => {
    if (organizacionId) {
      loadFromLocal();
    }
  }, [organizacionId, loadFromLocal]);

  return {
    // Estados
    localData,
    lastSync,
    isDownloading,
    downloadProgress,
    
    // Funciones principales
    saveToLocal,
    loadFromLocal,
    autoDownload,
    forceDownload,
    clearLocalData,
    
    // Utilidades
    hasLocalData,
    isLocalDataFresh,
    getStorageStats
  };
}