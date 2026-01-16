// config.js - Configuración de Firebase
// Archivo de configuración centralizado

// Configuración de Firebase (usar variables de entorno en producción)
export const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

// Configuración de Firestore
export const firestoreConfig = {
  // Configuraciones específicas de Firestore
  cacheSizeBytes: 40000000, // 40MB
  experimentalForceLongPolling: false
};

// Configuración de autenticación
export const authConfig = {
  // Proveedores de autenticación habilitados
  providers: ['google', 'email'],
  // Configuración de persistencia
  persistence: 'local'
};

export default firebaseConfig;