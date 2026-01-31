# HOJA DE RUTA COMPLETA - CAMBIO DE CUENTA FIREBASE

## 📋 ANÁLISIS PROFUNDO DEL PROYECTO

### 🔍 **ESTRUCTURA FIREBASE ACTUAL**
- **Configuración:** `src/firebase.js` (centralizada)
- **Variables de entorno:** `.env` y `.env.development`
- **Servicios utilizados:** Firestore, Authentication, Storage, Functions
- **Dependencias:** 47 archivos importan Firebase directa o indirectamente

### 📊 **COLECCIONES IDENTIFICADAS EN FIRESTORE**
Basado en el análisis del código:
- `casos` - Casos legales principales
- `audiencias` - Audiencias programadas
- `documentos` - Documentos del estudio
- `cajaChica` - Movimientos financieros
- `contactos` - Contactos del estudio
- `miembros` - Miembros del equipo
- `chatInterno` - Chat interno del equipo
- `organizaciones` - Datos de organizaciones
- `tareas` - Tareas (subcollección de casos)
- `prompts` - Prompts para IA

---

## 🚀 **PROCESO PASO A PASO**

### **FASE 1: PREPARACIÓN (15 minutos)**

#### 1.1 **Crear Nuevo Proyecto Firebase**
```bash
# 1. Ve a https://console.firebase.google.com
# 2. Crear nuevo proyecto
# 3. Habilitar servicios necesarios:
#    - Firestore Database (modo prueba)
#    - Authentication (Email/Password)
#    - Storage (modo prueba)
#    - Functions (opcional)
```

#### 1.2 **Obtener Configuración Nueva**
```javascript
// Copiar desde Firebase Console > Project Settings > General
const newFirebaseConfig = {
  apiKey: "nueva-api-key",
  authDomain: "nuevo-proyecto.firebaseapp.com",
  projectId: "nuevo-proyecto-id",
  storageBucket: "nuevo-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

#### 1.3 **Respaldar Datos Actuales (CRÍTICO)**
```bash
# Ejecutar antes de cambiar nada
node -e "
const admin = require('firebase-admin');
// Script de backup completo
"
```

---

### **FASE 2: CONFIGURACIÓN (10 minutos)**

#### 2.1 **Actualizar Variables de Entorno**
**Archivo: `.env`**
```env
# NUEVA CONFIGURACIÓN FIREBASE
REACT_APP_FIREBASE_API_KEY=nueva-api-key-aqui
REACT_APP_FIREBASE_AUTH_DOMAIN=nuevo-proyecto.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=nuevo-proyecto-id
REACT_APP_FIREBASE_STORAGE_BUCKET=nuevo-proyecto.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=nuevo-sender-id
REACT_APP_FIREBASE_APP_ID=nuevo-app-id

# MANTENER OTRAS CONFIGURACIONES
REACT_APP_OPENAI_API_KEY=tu-openai-key
REACT_APP_GEMINI_API_KEY=tu-gemini-key
```

**Archivo: `.env.development`**
```env
# MODO DESARROLLO - USAR NUEVA CUENTA TAMBIÉN
REACT_APP_DEV_MODE=true
REACT_APP_SKIP_FIREBASE=false  # Cambiar a false para usar Firebase

# NUEVA CONFIGURACIÓN FIREBASE PARA DESARROLLO
REACT_APP_FIREBASE_API_KEY=nueva-api-key-aqui
REACT_APP_FIREBASE_AUTH_DOMAIN=nuevo-proyecto.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=nuevo-proyecto-id
REACT_APP_FIREBASE_STORAGE_BUCKET=nuevo-proyecto.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=nuevo-sender-id
REACT_APP_FIREBASE_APP_ID=nuevo-app-id
```

#### 2.2 **Verificar src/firebase.js (NO REQUIERE CAMBIOS)**
El archivo ya está preparado para usar variables de entorno:
```javascript
// ✅ YA CONFIGURADO CORRECTAMENTE
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  // ... resto de configuración
};
```

---

### **FASE 3: CONFIGURACIÓN FIREBASE CONSOLE (20 minutos)**

#### 3.1 **Firestore Database**
```javascript
// Reglas de seguridad iniciales (modo desarrollo)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

#### 3.2 **Authentication**
- Habilitar "Email/Password"
- Configurar dominios autorizados si es necesario
- Opcional: Configurar Google Sign-In

#### 3.3 **Storage**
```javascript
// Reglas de Storage
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

#### 3.4 **Crear Índices Necesarios**
```bash
# Índices requeridos por la aplicación
# Ejecutar en Firebase Console > Firestore > Indexes

# Para casos con orderBy
Collection: casos
Fields: organizacionId (Ascending), createdAt (Descending)

# Para audiencias
Collection: audiencias  
Fields: organizacionId (Ascending), fecha (Ascending)

# Para documentos
Collection: documentos
Fields: organizacionId (Ascending), fechaCreacion (Descending)

# Para cajaChica
Collection: cajaChica
Fields: organizacionId (Ascending), fecha (Descending)
```

---

### **FASE 4: MIGRACIÓN DE DATOS (30 minutos)**

#### 4.1 **Crear Script de Migración**
```javascript
// migracion-datos-firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// Configuración antigua (para leer)
const oldConfig = { /* configuración anterior */ };
const oldApp = initializeApp(oldConfig, 'old');
const oldDb = getFirestore(oldApp);

// Configuración nueva (para escribir)  
const newConfig = { /* nueva configuración */ };
const newApp = initializeApp(newConfig, 'new');
const newDb = getFirestore(newApp);

// Migrar cada colección
const collections = ['casos', 'audiencias', 'documentos', 'cajaChica', 'contactos'];

for (const collectionName of collections) {
  // Leer de antigua, escribir en nueva
  const oldDocs = await getDocs(collection(oldDb, collectionName));
  for (const doc of oldDocs.docs) {
    await addDoc(collection(newDb, collectionName), doc.data());
  }
}
```

#### 4.2 **Datos Mínimos para Prueba**
```javascript
// datos-prueba-nueva-cuenta.js
const datosPrueba = {
  organizacion: {
    id: 'org-nueva-cuenta',
    nombre: 'Mi Estudio Jurídico',
    tipo: 'estudio_juridico'
  },
  casos: [
    {
      id: 'caso-001',
      numeroExpediente: 'EXP-2026-001',
      titulo: 'Caso de Prueba',
      cliente: 'Cliente Test',
      estado: 'activo',
      organizacionId: 'org-nueva-cuenta',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
};
```

---

### **FASE 5: ACTUALIZACIÓN DE CÓDIGO (15 minutos)**

#### 5.1 **Archivos que NO Requieren Cambios**
✅ **Estos archivos ya están preparados:**
- `src/firebase.js` - Usa variables de entorno
- `src/services/CasosService.js` - Genérico
- `src/hooks/useCasos.js` - Genérico
- `src/contexts/OrganizacionContext.js` - Genérico
- Todos los componentes - Usan servicios genéricos

#### 5.2 **Únicos Cambios Necesarios**

**A. Actualizar ID de Organización por Defecto**
```javascript
// src/contexts/OrganizacionContext.js (línea ~45)
// CAMBIAR:
id: orgData.organizationId || orgData.id || 'default-org',

// POR:
id: orgData.organizationId || orgData.id || 'org-nueva-cuenta',
```

**B. Actualizar Datos de Desarrollo**
```javascript
// src/App.js (línea ~200 aprox)
// Buscar configuración de desarrollo y actualizar:
const orgDesarrollo = {
  organizationId: 'org-nueva-cuenta',  // Cambiar aquí
  organizationName: 'Mi Estudio Jurídico',
  organizationType: 'estudio'
};
```

---

### **FASE 6: LIMPIEZA Y PRUEBAS (10 minutos)**

#### 6.1 **Limpiar Caché Local**
```bash
# Limpiar todo el caché
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Limpiar caché del navegador
# F12 > Application > Clear Storage > Clear site data
```

#### 6.2 **Script de Verificación**
```javascript
// verificar-nueva-configuracion.js
import { db, auth, storage } from './src/firebase.js';
import { collection, getDocs } from 'firebase/firestore';

async function verificar() {
  try {
    console.log('🔥 Proyecto:', db.app.options.projectId);
    console.log('🔐 Auth Domain:', auth.config.authDomain);
    console.log('📁 Storage Bucket:', storage.app.options.storageBucket);
    
    // Probar consulta
    const casos = await getDocs(collection(db, 'casos'));
    console.log('📊 Casos encontrados:', casos.size);
    
    console.log('✅ Nueva configuración funcionando');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}
```

---

## 🎯 **CHECKLIST FINAL**

### **Pre-Cambio**
- [ ] Nuevo proyecto Firebase creado
- [ ] Servicios habilitados (Firestore, Auth, Storage)
- [ ] Reglas de seguridad configuradas
- [ ] Índices creados
- [ ] Datos respaldados

### **Durante el Cambio**
- [ ] Variables `.env` actualizadas
- [ ] Variables `.env.development` actualizadas
- [ ] IDs de organización actualizados en código
- [ ] Datos migrados o creados

### **Post-Cambio**
- [ ] Caché limpiado (npm + navegador)
- [ ] Aplicación iniciada sin errores
- [ ] Login funcionando
- [ ] Datos visibles
- [ ] Todas las funciones operativas

---

## ⚠️ **PUNTOS CRÍTICOS**

### **1. Respaldo de Datos**
```bash
# OBLIGATORIO antes de cambiar
# Exportar todos los datos de la cuenta actual
```

### **2. Índices de Firestore**
```bash
# Sin estos índices, las consultas fallarán:
# - casos: organizacionId + createdAt
# - audiencias: organizacionId + fecha  
# - documentos: organizacionId + fechaCreacion
```

### **3. Reglas de Seguridad**
```javascript
// Empezar en modo desarrollo, luego restringir:
allow read, write: if request.auth != null;
```

### **4. Limpieza de Caché**
```bash
# CRÍTICO: Limpiar todo el caché local
# localStorage, sessionStorage, IndexedDB
```

---

## 🚀 **TIEMPO ESTIMADO TOTAL: 90 minutos**

- **Preparación:** 15 min
- **Configuración:** 10 min  
- **Firebase Console:** 20 min
- **Migración de Datos:** 30 min
- **Código:** 15 min
- **Pruebas:** 10 min

---

## 📞 **SOPORTE POST-CAMBIO**

### **Errores Comunes**
1. **"collection() error"** → Verificar índices
2. **"Auth error"** → Verificar dominio autorizado
3. **"Storage error"** → Verificar reglas de Storage
4. **"Datos no aparecen"** → Verificar organizacionId

### **Rollback Rápido**
```bash
# Si algo falla, restaurar .env anterior:
cp .env.backup .env
npm start
```

La aplicación está **muy bien estructurada** para cambios de Firebase. Solo requiere actualizar variables de entorno y migrar datos. El código es genérico y no tiene dependencias hardcodeadas.