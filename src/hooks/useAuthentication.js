// useAuthentication.js - Hook especializado para lógica de autenticación
// Reduce complejidad separando la larga función de autenticación de App.js

import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export const useAuthentication = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [perfilUsuario, setPerfilUsuario] = useState(null);
  const [errorAuth, setErrorAuth] = useState(null);

  // Detectar si es Electron
  const isElectron = !!window?.process?.versions?.electron;

  // Configurar usuario de desarrollo
  const configurarUsuarioDesarrollo = (fakeUser, fakeOrganization) => {
    setUser(fakeUser);
    setOrganization(fakeOrganization);
    setIsAuthenticated(true);
    setIsLoading(false);
    
    setPerfilUsuario({
      nombre: fakeUser.displayName,
      email: fakeUser.email,
      fotoPerfil: null,
      organizacion: fakeOrganization.organizationName,
      tipo: fakeOrganization.organizationType
    });
  };

  // Verificar modo desarrollo
  const verificarModoDesarrollo = () => {
    const devMode = localStorage.getItem('devMode');
    const devUser = localStorage.getItem('devUser');
    
    if (devMode === 'true' && devUser) {
      console.log('🛠️ Modo desarrollo detectado en localStorage');
      try {
        const fakeUser = JSON.parse(devUser);
        const fakeOrganization = {
          organizationId: 'dev-org-123',
          organizationName: 'ESTUDIO JURÍDICO DE DESARROLLO',
          organizationType: 'law-firm'
        };
        
        configurarUsuarioDesarrollo(fakeUser, fakeOrganization);
        console.log('✅ Modo desarrollo restaurado desde localStorage');
        return true;
      } catch (error) {
        console.error('❌ Error restaurando modo desarrollo:', error);
        localStorage.removeItem('devMode');
        localStorage.removeItem('devUser');
      }
    }
    return false;
  };

  // Configurar usuario Electron forzado
  const configurarElectronForzado = () => {
    console.log('🚨 ELECTRON FORZADO - Saltando Firebase auth');
    
    const fakeUser = {
      uid: 'electron-forced-user',
      email: 'electron@forced.com',
      displayName: 'Usuario Forzado Electron'
    };
    
    const fakeOrganization = {
      organizationId: 'electron-org',
      organizationName: 'ESTUDIO FORZADO ELECTRON',
      organizationType: 'law-firm'
    };
    
    configurarUsuarioDesarrollo(fakeUser, fakeOrganization);
    console.log('✅ ELECTRON FORZADO - Estados configurados');
  };

  // Obtener datos de organización del usuario
  const obtenerDatosOrganizacion = async (firebaseUser) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.organizationId && userData.organizationName) {
          setOrganization(userData);
          setPerfilUsuario({
            nombre: firebaseUser.displayName,
            email: firebaseUser.email,
            fotoPerfil: firebaseUser.photoURL,
            organizacion: userData.organizationName,
            tipo: userData.organizationType
          });
          
          console.log('🎯 Usuario con organización → navegando a casos');
          return 'casos'; // Vista a la que navegar
        } else {
          console.log('⚠️ Usuario sin organización → mantener en login');
          return 'login';
        }
      } else {
        console.log('👤 Usuario nuevo → mantener en login');
        return 'login';
      }
    } catch (error) {
      console.warn('⚠️ Error obteniendo organización:', error);
      setErrorAuth('Error al obtener datos de organización');
      return 'login';
    }
  };

  // Manejar cambio de estado de autenticación
  const manejarCambioAuth = async (firebaseUser) => {
    console.log('👤 Auth state:', firebaseUser ? firebaseUser.uid : 'No user');
    
    if (firebaseUser) {
      // Usuario autenticado
      setUser(firebaseUser);
      setIsAuthenticated(true);
      
      // Obtener datos de organización y determinar vista
      const vistaDestino = await obtenerDatosOrganizacion(firebaseUser);
      return vistaDestino;
    } else {
      // No hay usuario → ir a login
      console.log('🚪 No user → ir a login');
      setUser(null);
      setOrganization(null);
      setPerfilUsuario(null);
      setIsAuthenticated(false);
      return 'login';
    }
  };

  // Configurar autenticación
  useEffect(() => {
    console.log('🚀 Configurando autenticación...', {
      isElectron,
      timestamp: new Date().toISOString()
    });

    // 1. Verificar modo desarrollo
    if (verificarModoDesarrollo()) {
      return;
    }

    // 2. Configurar Electron forzado
    if (isElectron) {
      configurarElectronForzado();
      return;
    }

    // 3. Verificar disponibilidad de auth
    if (!auth) {
      console.warn('⚠️ Auth no disponible');
      setErrorAuth('Firebase Auth no disponible');
      setIsLoading(false);
      return;
    }
    
    console.log('🔥 Configurando onAuthStateChanged...');
    
    // 4. Configurar listener de autenticación
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        const vistaDestino = await manejarCambioAuth(firebaseUser);
        // La vista se maneja en el componente padre
        console.log('🎯 Vista destino determinada:', vistaDestino);
      } catch (error) {
        console.error('❌ Error en cambio de auth:', error);
        setErrorAuth('Error en autenticación');
      } finally {
        setIsLoading(false);
      }
    });

    return () => {
      console.log('🧹 Limpiando listener de auth');
      unsubscribe();
    };
  }, [isElectron]);

  // Función para cerrar sesión
  const cerrarSesion = async () => {
    try {
      if (isElectron) {
        // En Electron, solo limpiar estados locales
        setUser(null);
        setOrganization(null);
        setPerfilUsuario(null);
        setIsAuthenticated(false);
        localStorage.removeItem('devMode');
        localStorage.removeItem('devUser');
        return;
      }

      if (auth) {
        await auth.signOut();
      }
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
      setErrorAuth('Error al cerrar sesión');
    }
  };

  // Función para activar modo desarrollo
  const activarModoDesarrollo = (userData) => {
    const fakeUser = {
      uid: 'dev-user-123',
      email: userData.email || 'dev@desarrollo.com',
      displayName: userData.nombre || 'Usuario Desarrollo'
    };
    
    const fakeOrganization = {
      organizationId: 'dev-org-123',
      organizationName: userData.organizacion || 'ESTUDIO JURÍDICO DE DESARROLLO',
      organizationType: 'law-firm'
    };
    
    // Guardar en localStorage
    localStorage.setItem('devMode', 'true');
    localStorage.setItem('devUser', JSON.stringify(fakeUser));
    
    configurarUsuarioDesarrollo(fakeUser, fakeOrganization);
    console.log('✅ Modo desarrollo activado');
  };

  return {
    isAuthenticated,
    user,
    organization,
    isLoading,
    perfilUsuario,
    errorAuth,
    isElectron,
    cerrarSesion,
    activarModoDesarrollo,
    setErrorAuth
  };
};