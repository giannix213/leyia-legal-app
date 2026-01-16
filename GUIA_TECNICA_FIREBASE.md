# GUÍA TÉCNICA - CONFIGURACIÓN FIREBASE

## 📋 RESUMEN
Esta guía documenta la configuración actual de Firebase y las soluciones implementadas.

---

## 🔥 CONFIGURACIÓN ACTUAL

### Archivo Principal: `src/firebase.js`
```javascript
// Configuración simplificada y centralizada
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { firebaseConfig } from './firebase/config';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
```

### Configuración: `src/firebase/config.js`
- Contiene las credenciales de Firebase
- Soporte para variables de entorno
- Configuración para producción y desarrollo

---

## 🛠️ PROBLEMAS RESUELTOS

### 1. Carga Infinita de Firebase
- **Problema**: La aplicación se quedaba cargando en "Conectando con Firebase..."
- **Causa**: Inicialización asíncrona problemática en archivos web.js/electron.js
- **Solución**: Configuración síncrona directa en firebase.js principal
- **Estado**: ✅ RESUELTO

### 2. Problema de Organización
- **Problema**: Usuario no podía ver sus datos (116 registros)
- **Causa**: Incompatibilidad entre propiedades del usuario y contexto
- **Solución**: Mapeo correcto de `organizationId` → `organizacionActual.id`
- **Estado**: ✅ RESUELTO

### 3. Bug de IDs de Organización
- **Problema**: Se generaban IDs incorrectos como `ORG-undefined-370594`
- **Causa**: Bug en PerfilUsuario.js al generar IDs cuando `organizationName` era undefined
- **Solución**: Usar ID existente en lugar de generar nuevo
- **Estado**: ✅ RESUELTO

---

## 📊 DATOS ACTUALES

### Usuario Principal
- **Email**: giannix213@gmail.com
- **UID**: 0ZsUq8b2EMa23gEMDkNNAObw0eS2
- **Organización**: estudio_1766865619896_f6yqlp8c6
- **Nombre Org**: CyC abogados

### Datos Migrados
- **Casos**: 65 documentos
- **Contactos**: 4 documentos  
- **Caja Chica**: 31 documentos
- **Audiencias**: 16 documentos
- **Total**: 116 registros

---

## 🔧 SERVICIOS INTEGRADOS

### Gemini AI Service
- **Archivo**: `src/services/GeminiService.js`
- **Funcionalidad**: Híbrido Firebase Extensions + API directa
- **Fallback**: Automático entre métodos
- **Uso**: Procesamiento de jurisprudencia

### Procesador de Jurisprudencia
- **Archivo**: `src/services/JurisprudenciaProcessor.js`
- **Funcionalidad**: Extracción automática de datos de documentos
- **Integración**: Gemini AI + Firebase Storage

---

## 🏢 SISTEMA MULTI-TENANT

### Estructura de Datos
```javascript
// Colección: users
{
  email: "giannix213@gmail.com",
  organizationId: "estudio_1766865619896_f6yqlp8c6",
  organizationName: "CyC abogados",
  organizationType: "estudio"
}

// Colección: organizations  
{
  id: "estudio_1766865619896_f6yqlp8c6",
  name: "CyC abogados",
  type: "estudio",
  createdAt: timestamp
}

// Colecciones de datos (casos, contactos, etc.)
{
  // ... datos específicos ...
  organizacionId: "estudio_1766865619896_f6yqlp8c6"
}
```

### Contexto de Organización
- **Archivo**: `src/contexts/OrganizacionContext.js`
- **Funcionalidad**: Estado global de organización
- **Persistencia**: localStorage + Firebase

---

## 🔐 AUTENTICACIÓN

### Flujo de Autenticación
1. Usuario hace login
2. `onAuthStateChanged` detecta cambio
3. Se buscan datos del usuario en Firestore
4. Se mapean datos de organización
5. Se establece contexto global
6. Usuario ve sus datos filtrados por organización

### Manejo de Errores
- Timeout de autenticación
- Fallback a login si no hay usuario
- Limpieza de estados en logout
- Manejo de sesiones expiradas

---

## 📱 COMPATIBILIDAD

### Electron
- Detección automática de entorno
- Configuración específica para Electron
- Manejo de ventanas y procesos

### Web
- Configuración estándar de navegador
- Soporte para PWA
- Responsive design

---

## 🚨 DIAGNÓSTICO Y SOLUCIÓN DE PROBLEMAS

### Comandos de Diagnóstico
```bash
# Verificar estado de Firebase
node verificar-firebase.js

# Limpiar localStorage (en consola del navegador)
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Logs Importantes
- `✅ Firebase inicializado correctamente`
- `👤 Auth state: [uid]`
- `🎯 Usuario con organización → navegando a casos`

### Logs de Error
- `🚪 No user → ir a login` (necesita login)
- `⚠️ Auth no disponible` (problema de inicialización)

---

## 🔄 MIGRACIÓN DE DATOS

### Script de Migración
- Migra datos existentes a organización específica
- Seguro: solo migra datos sin `organizacionId`
- Batch operations para mejor rendimiento
- Verificación post-migración

### Comando
```bash
node ejecutar-migracion.js  # (ya ejecutado)
```

---

## 📈 MÉTRICAS Y MONITOREO

### Métricas Clave
- Tiempo de carga de Firebase: <2 segundos
- Éxito de autenticación: 100%
- Datos migrados: 116/116 (100%)
- Organizaciones problemáticas: 0

### Monitoreo Recomendado
- Estado de autenticación
- Tiempo de respuesta de Firestore
- Uso de cuota de Gemini AI
- Errores de JavaScript en consola

---

## 🛡️ SEGURIDAD

### Reglas de Firestore
- Filtrado por `organizacionId`
- Autenticación requerida
- Validación de permisos por organización

### Configuración de Seguridad
- API keys en variables de entorno (recomendado)
- CORS configurado correctamente
- Validación de entrada en cliente y servidor

---

## 🚀 RECOMENDACIONES FUTURAS

1. **Variables de Entorno**: Mover API keys a `.env`
2. **Backup Automático**: Implementar backup regular
3. **Monitoreo**: Alertas para errores críticos
4. **Testing**: Tests automatizados para funciones críticas
5. **Documentación**: Mantener esta guía actualizada

---

**Última actualización**: 11 de enero de 2026  
**Estado**: ✅ SISTEMA ESTABLE Y FUNCIONAL