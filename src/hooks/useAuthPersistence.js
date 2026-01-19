// src/hooks/useAuthPersistence.js
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

const SESSION_STORAGE_KEY = 'leyia_session';
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 días en milisegundos

export const useAuthPersistence = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [organization, setOrganization] = useState(null);

  // Guardar sesión en localStorage
  const saveSession = (userData, organizationData) => {
    const sessionData = {
      user: {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL
      },
      organization: organizationData,
      timestamp: Date.now(),
      expiresAt: Date.now() + SESSION_DURATION
    };
    
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    console.log('✅ Sesión guardada localmente por 30 días');
  };

  // Cargar sesión desde localStorage
  const loadSession = () => {
    try {
      const sessionData = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!sessionData) return null;

      const parsed = JSON.parse(sessionData);
      
      // Verificar si la sesión ha expirado
      if (Date.now() > parsed.expiresAt) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        console.log('⏰ Sesión local expirada, removida');
        return null;
      }

      console.log('✅ Sesión local válida encontrada');
      return parsed;
    } catch (error) {
      console.error('❌ Error cargando sesión local:', error);
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
  };

  // Limpiar sesión
  const clearSession = () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setUser(null);
    setOrganization(null);
    console.log('🧹 Sesión local limpiada');
  };

  // Extender sesión (renovar timestamp)
  const extendSession = () => {
    const sessionData = loadSession();
    if (sessionData) {
      sessionData.timestamp = Date.now();
      sessionData.expiresAt = Date.now() + SESSION_DURATION;
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
      console.log('⏰ Sesión extendida por 30 días más');
    }
  };

  // Verificar si hay sesión válida
  const hasValidSession = () => {
    const sessionData = loadSession();
    return sessionData !== null;
  };

  useEffect(() => {
    let unsubscribe = null;

    const initAuth = async () => {
      try {
        // Primero intentar cargar sesión local
        const localSession = loadSession();
        
        if (localSession) {
          setUser(localSession.user);
          setOrganization(localSession.organization);
          console.log('🔄 Sesión restaurada desde localStorage');
        }

        // Configurar listener de Firebase Auth
        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            const userData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL
            };
            
            setUser(userData);
            
            // Si hay organización en sesión local, mantenerla
            if (localSession && localSession.organization) {
              setOrganization(localSession.organization);
              saveSession(userData, localSession.organization);
            }
            
            console.log('🔥 Usuario autenticado con Firebase');
          } else {
            // Solo limpiar si no hay sesión local válida
            if (!hasValidSession()) {
              clearSession();
            }
          }
          
          setIsLoading(false);
        });

      } catch (error) {
        console.error('❌ Error inicializando autenticación:', error);
        setIsLoading(false);
      }
    };

    initAuth();

    // Cleanup
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Auto-extender sesión cada 24 horas si el usuario está activo
  useEffect(() => {
    if (user && organization) {
      const interval = setInterval(() => {
        extendSession();
      }, 24 * 60 * 60 * 1000); // 24 horas

      return () => clearInterval(interval);
    }
  }, [user, organization]);

  return {
    user,
    organization,
    isLoading,
    saveSession,
    clearSession,
    extendSession,
    hasValidSession,
    setOrganization: (org) => {
      setOrganization(org);
      if (user && org) {
        saveSession(user, org);
      }
    }
  };
};