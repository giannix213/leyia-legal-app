// src/firebase.js - Configuración principal de Firebase
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// Configuración de Firebase (usar variables de entorno en producción)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

// Verificar configuración
const isValidConfig = firebaseConfig.apiKey !== "demo-api-key" && 
                     firebaseConfig.projectId !== "demo-project";

if (!isValidConfig) {
  console.warn('⚠️ FIREBASE: Usando configuración de demo. Configura las variables de entorno para producción.');
  console.warn('📋 Variables requeridas:', {
    'REACT_APP_FIREBASE_API_KEY': process.env.REACT_APP_FIREBASE_API_KEY ? '✅ Configurada' : '❌ Faltante',
    'REACT_APP_FIREBASE_AUTH_DOMAIN': process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ? '✅ Configurada' : '❌ Faltante',
    'REACT_APP_FIREBASE_PROJECT_ID': process.env.REACT_APP_FIREBASE_PROJECT_ID ? '✅ Configurada' : '❌ Faltante',
    'REACT_APP_FIREBASE_STORAGE_BUCKET': process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ? '✅ Configurada' : '❌ Faltante',
    'REACT_APP_FIREBASE_MESSAGING_SENDER_ID': process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID ? '✅ Configurada' : '❌ Faltante',
    'REACT_APP_FIREBASE_APP_ID': process.env.REACT_APP_FIREBASE_APP_ID ? '✅ Configurada' : '❌ Faltante'
  });
}

// Inicializar Firebase de forma segura
let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  console.log('✅ Firebase inicializado correctamente');
  console.log('🔧 Proyecto:', firebaseConfig.projectId);
} catch (error) {
  console.error('❌ Error inicializando Firebase:', error);
  // Crear app con configuración mínima para evitar crashes
  app = initializeApp(firebaseConfig);
}

// Obtener servicios de forma segura
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Configurar persistencia de autenticación para que dure más tiempo
try {
  setPersistence(auth, browserLocalPersistence).then(() => {
    console.log('✅ Persistencia de autenticación configurada (Local Storage)');
  }).catch((error) => {
    console.warn('⚠️ No se pudo configurar persistencia:', error);
  });
} catch (error) {
  console.warn('⚠️ Error configurando persistencia:', error);
}

// Debug en desarrollo
if (process.env.NODE_ENV === 'development') {
  window.firebaseDebug = { auth, db, storage, functions, config: firebaseConfig };
  console.log('🔧 Firebase debug disponible en window.firebaseDebug');
  console.log('🔧 Para probar: window.firebaseDebug.config');
}