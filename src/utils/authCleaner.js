// authCleaner.js - Utilidad para limpiar completamente el estado de autenticación

import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export const clearAuthCache = async () => {
  console.log('🧹 Iniciando limpieza completa de autenticación...');
  
  try {
    // 1. Cerrar sesión de Firebase si hay usuario activo
    if (auth.currentUser) {
      console.log('🔓 Cerrando sesión de Firebase...');
      await signOut(auth);
    }
    
    // 2. Limpiar localStorage
    console.log('🗑️ Limpiando localStorage...');
    const localStorageKeys = Object.keys(localStorage);
    localStorageKeys.forEach(key => {
      if (key.includes('firebase') || 
          key.includes('auth') || 
          key.includes('user') || 
          key.includes('organization') ||
          key.includes('google') ||
          key.includes('gapi')) {
        localStorage.removeItem(key);
        console.log(`   ✓ Eliminado: ${key}`);
      }
    });
    
    // 3. Limpiar sessionStorage
    console.log('🗑️ Limpiando sessionStorage...');
    const sessionStorageKeys = Object.keys(sessionStorage);
    sessionStorageKeys.forEach(key => {
      if (key.includes('firebase') || 
          key.includes('auth') || 
          key.includes('user') || 
          key.includes('organization') ||
          key.includes('google') ||
          key.includes('gapi')) {
        sessionStorage.removeItem(key);
        console.log(`   ✓ Eliminado: ${key}`);
      }
    });
    
    // 4. Limpiar cookies relacionadas con Firebase/Google
    console.log('🍪 Limpiando cookies...');
    const cookiesToClear = [
      '__session',
      '__Secure-1PSID',
      '__Secure-3PSID',
      'SAPISID',
      'APISID',
      'SSID',
      'HSID',
      'SID',
      'SIDCC',
      '1P_JAR',
      'NID',
      'CONSENT',
      'firebase-heartbeat-database',
      'firebase-heartbeat-store'
    ];
    
    cookiesToClear.forEach(cookieName => {
      // Limpiar para el dominio actual
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      // Limpiar para subdominios
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
      // Limpiar para Google
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.google.com;`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.googleapis.com;`;
    });
    
    // 5. Limpiar IndexedDB de Firebase
    console.log('💾 Limpiando IndexedDB...');
    if ('indexedDB' in window) {
      try {
        // Obtener todas las bases de datos
        const databases = await indexedDB.databases();
        
        for (const db of databases) {
          if (db.name && (
            db.name.includes('firebase') || 
            db.name.includes('firestore') || 
            db.name.includes('auth')
          )) {
            console.log(`   🗑️ Eliminando base de datos: ${db.name}`);
            indexedDB.deleteDatabase(db.name);
          }
        }
      } catch (error) {
        console.log('   ⚠️ No se pudo limpiar IndexedDB:', error.message);
      }
    }
    
    // 6. Limpiar Service Workers relacionados con Firebase
    console.log('⚙️ Limpiando Service Workers...');
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          if (registration.scope.includes('firebase') || 
              registration.scope.includes('google')) {
            console.log(`   🗑️ Desregistrando SW: ${registration.scope}`);
            await registration.unregister();
          }
        }
      } catch (error) {
        console.log('   ⚠️ No se pudo limpiar Service Workers:', error.message);
      }
    }
    
    // 7. Limpiar caché del navegador (si es posible)
    console.log('🧹 Limpiando caché del navegador...');
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          if (cacheName.includes('firebase') || 
              cacheName.includes('google') || 
              cacheName.includes('auth')) {
            console.log(`   🗑️ Eliminando caché: ${cacheName}`);
            await caches.delete(cacheName);
          }
        }
      } catch (error) {
        console.log('   ⚠️ No se pudo limpiar caché:', error.message);
      }
    }
    
    console.log('✅ Limpieza completa de autenticación finalizada');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    return { success: false, error: error.message };
  }
};

export const clearAllAppData = () => {
  console.log('🧹 Limpieza TOTAL de datos de la aplicación...');
  
  // Limpiar TODO el localStorage
  localStorage.clear();
  
  // Limpiar TODO el sessionStorage
  sessionStorage.clear();
  
  console.log('✅ Todos los datos de la aplicación eliminados');
};

export const resetAuthState = () => {
  console.log('🔄 Reiniciando estado de autenticación...');
  
  // Limpiar solo datos relacionados con auth
  const authKeys = [
    'isAuthenticated',
    'user',
    'organization',
    'perfilUsuario',
    'authToken',
    'refreshToken'
  ];
  
  authKeys.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
  
  console.log('✅ Estado de autenticación reiniciado');
};