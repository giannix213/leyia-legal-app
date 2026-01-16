# Implementación IPC OAuth para Electron

## 📋 Resumen

Se han implementado handlers IPC (Inter-Process Communication) para manejar la autenticación OAuth de forma segura entre el proceso principal (main) y el proceso de renderizado (renderer) en Electron.

## 🔧 Componentes Implementados

### 1. Handlers IPC en el Proceso Principal (`public/electron.js`)

#### Handlers Implementados:
- **`oauth-start`**: Inicia el flujo OAuth abriendo la URL de autorización
- **`oauth-get-status`**: Obtiene el estado del protocolo OAuth
- **`oauth-register-protocol`**: Registra el protocolo personalizado manualmente
- **`oauth-clear-data`**: Limpia datos de OAuth (cookies, localStorage, etc.)
- **`oauth-get-system-info`**: Obtiene información del sistema para debugging
- **`oauth-send-event`**: Envía eventos OAuth al renderer
- **`oauth-create-popup`**: Crea ventana popup para OAuth (método alternativo)

#### Eventos Enviados al Renderer:
- **`oauth-callback`**: Cuando se recibe un código de autorización exitoso
- **`oauth-error`**: Cuando ocurre un error en el flujo OAuth
- **`oauth-popup-closed`**: Cuando se cierra el popup OAuth

### 2. Preload Script Actualizado (`public/preload.js`)

Se expuso la API `electronOAuth` de forma segura usando `contextBridge`:

```javascript
window.electronOAuth = {
  startOAuth: (authUrl, redirectUri) => ...,
  getStatus: () => ...,
  registerProtocol: () => ...,
  clearData: () => ...,
  getSystemInfo: () => ...,
  sendEvent: (eventType, data) => ...,
  createPopup: (url, width, height) => ...,
  onCallback: (callback) => ...,
  onError: (callback) => ...,
  onPopupClosed: (callback) => ...,
  removeAllListeners: () => ...
}
```

### 3. Servicio OAuth Mejorado (`src/services/ElectronOAuth.js`)

#### Métodos Principales:
- **`signInWithGoogle()`**: Flujo OAuth tradicional con deep linking
- **`signInWithGooglePopup()`**: Flujo OAuth con ventana popup
- **`clearOAuthData()`**: Limpia datos de OAuth
- **`getDebugInfo()`**: Obtiene información de debugging

#### Características:
- ✅ Manejo automático de listeners
- ✅ Timeout de 5 minutos para evitar cuelgues
- ✅ Fallback entre métodos (popup → deep linking)
- ✅ Limpieza automática de listeners en errores
- ✅ UI no bloqueante con modal de instrucciones
- ✅ Retry automático con limpieza de datos

### 4. Componente de Login Actualizado (`src/components/Login.js`)

#### Mejoras Implementadas:
- ✅ Detección automática de métodos OAuth disponibles
- ✅ Fallback inteligente: Popup → Deep Linking → Modo Desarrollo
- ✅ Retry automático con limpieza de datos
- ✅ Mejor manejo de errores con opciones para el usuario
- ✅ Identificación de usuarios Electron vs Web

### 5. Panel de Pruebas OAuth (`src/components/OAuthTestPanel.js`)

Panel de debugging que permite:
- ✅ Probar todos los handlers IPC individualmente
- ✅ Ejecutar flujos OAuth completos
- ✅ Ver información del sistema en tiempo real
- ✅ Historial de resultados de pruebas
- ✅ Debug info detallada

## 🔐 Protocolo OAuth Personalizado

### Configuración:
- **Protocolo**: `estudio-juridico-oauth://`
- **Redirect URI**: `estudio-juridico-oauth://auth`
- **Deep Linking**: Manejo automático de URLs del protocolo

### Flujo de Autenticación:

1. **Inicio**: Se construye URL de autorización con parámetros OAuth
2. **Navegador**: Se abre la URL en el navegador del sistema
3. **Autorización**: Usuario autoriza la aplicación en Google
4. **Callback**: Google redirige a `estudio-juridico-oauth://auth?code=...`
5. **Captura**: Electron captura la URL y extrae el código
6. **Intercambio**: Se intercambia el código por tokens de acceso
7. **Usuario**: Se obtiene información del usuario con los tokens

## 🛠️ Uso en Desarrollo

### Acceso al Panel de Pruebas:
1. Ejecutar la aplicación en Electron
2. En la pantalla de login, hacer clic en "Test OAuth IPC"
3. Usar los botones de prueba para verificar funcionalidad

### Debugging:
```javascript
// En el renderer (DevTools)
const debugInfo = await window.electronOAuth.getDebugInfo();
console.log('Debug Info:', debugInfo);

// Probar handler específico
const result = await window.electronOAuth.getSystemInfo();
console.log('System Info:', result);
```

## 🔄 Flujos de Autenticación

### Flujo Principal (Popup):
```
Login → Popup OAuth → Google Auth → Callback → Tokens → Usuario
```

### Flujo Fallback (Deep Linking):
```
Login → Browser OAuth → Google Auth → Deep Link → Callback → Tokens → Usuario
```

### Flujo de Emergencia (Desarrollo):
```
Login → Error → Modo Desarrollo → Usuario Fake
```

## ⚠️ Consideraciones de Seguridad

### Implementadas:
- ✅ Comunicación IPC segura con `contextBridge`
- ✅ Validación de URLs de callback
- ✅ Timeout para evitar ataques de tiempo
- ✅ Limpieza automática de datos sensibles
- ✅ Manejo seguro de tokens en memoria

### Recomendaciones:
- 🔒 Los tokens se mantienen solo en memoria (no persistencia)
- 🔒 El client_secret se maneja solo en el proceso principal
- 🔒 Validación de origen en todos los callbacks
- 🔒 Limpieza automática de listeners para evitar memory leaks

## 📊 Monitoreo y Logs

### Logs Implementados:
```
🖥️ Electron detectado - Intentando OAuth nativo con IPC
🔧 Debug info: {...}
🪟 Intentando OAuth con popup...
✅ OAuth nativo exitoso: user@example.com
🧹 Datos OAuth limpiados, reintentando...
```

### Métricas Disponibles:
- Tiempo de respuesta de handlers IPC
- Éxito/fallo de métodos OAuth
- Información del sistema y configuración
- Estado del protocolo personalizado

## 🚀 Próximos Pasos

### Mejoras Planificadas:
1. **Persistencia Segura**: Implementar almacenamiento seguro de refresh tokens
2. **Multi-Provider**: Soporte para otros proveedores OAuth (Microsoft, etc.)
3. **Biometría**: Integración con autenticación biométrica del sistema
4. **SSO**: Single Sign-On para múltiples aplicaciones
5. **Audit Log**: Registro detallado de eventos de autenticación

### Optimizaciones:
1. **Cache Inteligente**: Cache de tokens con expiración automática
2. **Retry Logic**: Lógica de reintentos más sofisticada
3. **UI/UX**: Mejoras en la experiencia de usuario durante OAuth
4. **Performance**: Optimización de tiempos de respuesta

## 📝 Notas de Implementación

### Cambios Realizados:
1. ✅ Agregados 7 handlers IPC para OAuth
2. ✅ Actualizado preload script con API segura
3. ✅ Mejorado servicio ElectronOAuth con IPC
4. ✅ Actualizado componente Login con nuevos flujos
5. ✅ Creado panel de pruebas para debugging
6. ✅ Implementado protocolo personalizado con deep linking

### Archivos Modificados:
- `public/electron.js` - Handlers IPC principales
- `public/preload.js` - API segura para renderer
- `src/services/ElectronOAuth.js` - Servicio OAuth mejorado
- `src/components/Login.js` - Flujos de autenticación actualizados
- `src/components/OAuthTestPanel.js` - Panel de pruebas (nuevo)

### Compatibilidad:
- ✅ Electron 13+
- ✅ Windows, macOS, Linux
- ✅ Fallback completo para navegadores web
- ✅ Modo desarrollo para testing sin OAuth

La implementación está completa y lista para pruebas. El sistema proporciona múltiples capas de fallback y herramientas de debugging para asegurar una experiencia robusta de autenticación OAuth en Electron.