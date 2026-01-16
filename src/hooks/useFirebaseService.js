// useFirebaseService.js - Hook para usar el servicio Firebase centralizado
// Proporciona una interfaz React para las operaciones Firebase

import { useState, useCallback } from 'react';
import firebaseService from '../services/FirebaseService';

export const useFirebaseService = (collectionName) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Limpiar error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Wrapper genérico para operaciones
  const executeOperation = useCallback(async (operation, ...args) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await operation(...args);
      return result;
    } catch (err) {
      const errorInfo = firebaseService.handleError(err, `useFirebaseService - ${collectionName}`);
      setError(errorInfo.error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [collectionName]);

  // Operaciones CRUD genéricas
  const getAll = useCallback((orderByField, orderDirection) => {
    return executeOperation(firebaseService.getAll.bind(firebaseService), collectionName, orderByField, orderDirection);
  }, [collectionName, executeOperation]);

  const getWhere = useCallback((field, operator, value) => {
    return executeOperation(firebaseService.getWhere.bind(firebaseService), collectionName, field, operator, value);
  }, [collectionName, executeOperation]);

  const create = useCallback((data) => {
    return executeOperation(firebaseService.create.bind(firebaseService), collectionName, data);
  }, [collectionName, executeOperation]);

  const update = useCallback((docId, data) => {
    return executeOperation(firebaseService.update.bind(firebaseService), collectionName, docId, data);
  }, [collectionName, executeOperation]);

  const remove = useCallback((docId) => {
    return executeOperation(firebaseService.delete.bind(firebaseService), collectionName, docId);
  }, [collectionName, executeOperation]);

  return {
    loading,
    error,
    clearError,
    getAll,
    getWhere,
    create,
    update,
    remove
  };
};

// Hooks específicos para cada colección
export const useCasosService = () => {
  const baseHook = useFirebaseService('casos');
  
  return {
    ...baseHook,
    getCasos: baseHook.getAll,
    createCaso: baseHook.create,
    updateCaso: baseHook.update,
    deleteCaso: baseHook.remove,
    findCasoByNumero: useCallback(async (numeroExpediente) => {
      return firebaseService.findCasoByNumero(numeroExpediente);
    }, [])
  };
};

export const useAudienciasService = () => {
  const baseHook = useFirebaseService('audiencias');
  
  return {
    ...baseHook,
    getAudiencias: baseHook.getAll,
    createAudiencia: baseHook.create,
    updateAudiencia: baseHook.update,
    deleteAudiencia: baseHook.remove
  };
};

export const useContactosService = () => {
  const baseHook = useFirebaseService('contactos');
  
  return {
    ...baseHook,
    getContactos: baseHook.getAll,
    createContacto: baseHook.create,
    updateContacto: baseHook.update,
    deleteContacto: baseHook.remove
  };
};

export const useJurisprudenciasService = () => {
  const baseHook = useFirebaseService('jurisprudencias');
  
  return {
    ...baseHook,
    getJurisprudencias: baseHook.getAll,
    createJurisprudencia: baseHook.create,
    updateJurisprudencia: baseHook.update,
    deleteJurisprudencia: baseHook.remove
  };
};

export const useCajaChicaService = () => {
  const baseHook = useFirebaseService('cajaChica');
  
  return {
    ...baseHook,
    getMovimientos: baseHook.getAll,
    createMovimiento: baseHook.create,
    updateMovimiento: baseHook.update,
    deleteMovimiento: baseHook.remove
  };
};