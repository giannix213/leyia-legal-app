# 🔥 CONFIGURAR FIREBASE

## ❌ ERROR ACTUAL

```
Error: Firebase: Error (auth/api-key-not-valid.-please-pass-a-valid-api-key.)
```

**Causa:** No tienes un archivo `.env` con tus credenciales reales de Firebase.

## ✅ SOLUCIÓN

### Paso 1: Obtén tus credenciales de Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto (o crea uno nuevo)
3. Ve a **Configuración del proyecto** (ícono de engranaje)
4. En la sección **Tus apps**, busca tu app web
5. Si no tienes una app web, haz clic en **Agregar app** → **Web**
6. Copia las credenciales que aparecen

Deberías ver algo como:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789"
};
```

### Paso 2: Crea el archivo `.env`

En la raíz del proyecto (donde está `package.json`), crea un archivo llamado `.env` (sin extensión adicional).

**Contenido del archivo `.env`:**

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
REACT_APP_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=tu-proyecto
REACT_APP_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789012
REACT_APP_FIREBASE_APP_ID=1:123456789012:web:abcdef123456789

# Configuración de desarrollo
REACT_APP_ENV=development
NODE_ENV=development
REACT_APP_DEBUG=true
```

**⚠️ IMPORTANTE:** Reemplaza los valores con tus credenciales reales de Firebase.

### Paso 3: Reinicia la aplicación

Después de crear el archivo `.env`:

```bash
# Cierra la aplicación si está corriendo (Ctrl+C)

# Limpia el caché
limpiar-cache-rapido.bat

# Inicia de nuevo
INICIAR-LIMPIO.bat
```

## 🔒 SEGURIDAD

### ✅ El archivo `.env` está en `.gitignore`
Esto significa que NO se subirá a GitHub, manteniendo tus credenciales seguras.

### ⚠️ NUNCA compartas tu `.env`
- No lo subas a GitHub
- No lo compartas en screenshots
- No lo envíes por email/chat

### 📝 Para otros desarrolladores
Comparte el archivo `.env.example` (sin credenciales reales) para que sepan qué variables necesitan.

## 🎯 VERIFICACIÓN

Después de crear el `.env` y reiniciar:

1. La aplicación debería iniciar sin errores
2. En la consola deberías ver:
   ```
   ✅ Firebase inicializado correctamente
   ```
3. NO deberías ver el error de API key

## 🚨 SI AÚN FALLA

### Error: "API key not valid"
- Verifica que copiaste el API key completo
- Verifica que no haya espacios al inicio o final
- Verifica que el proyecto de Firebase esté activo

### Error: "Project not found"
- Verifica el `projectId`
- Asegúrate de que el proyecto existe en Firebase Console

### Error: "Auth domain not valid"
- Verifica el `authDomain`
- Debe terminar en `.firebaseapp.com`

## 📋 CHECKLIST

- [ ] Tengo acceso a Firebase Console
- [ ] Copié las credenciales de mi proyecto
- [ ] Creé el archivo `.env` en la raíz del proyecto
- [ ] Pegué las credenciales en el archivo `.env`
- [ ] Guardé el archivo `.env`
- [ ] Reinicié la aplicación
- [ ] La aplicación inicia sin errores de Firebase

## 🔧 ALTERNATIVA: Usar Firebase Emulator (Desarrollo Local)

Si no quieres usar Firebase en la nube, puedes usar el emulador local:

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Inicializar Firebase
firebase init emulators

# Iniciar emuladores
firebase emulators:start
```

Luego actualiza `src/firebase.js` para conectar a los emuladores.

## 📞 AYUDA

Si necesitas ayuda:
1. Verifica que el proyecto de Firebase esté activo
2. Verifica que Firestore esté habilitado
3. Verifica que Authentication esté habilitado
4. Revisa la consola de Firebase para errores

---

**Siguiente paso:** Después de configurar Firebase, ejecuta `INICIAR-LIMPIO.bat`
