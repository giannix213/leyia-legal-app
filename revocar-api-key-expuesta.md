# 🚨 ACCIÓN INMEDIATA: API KEY EXPUESTA EN GITHUB

## ✅ YA REALIZADO
- ❌ API key eliminada del código fuente
- ❌ Archivo `verificacion-completa-firebase.js` actualizado para usar variables de entorno

## 🔥 PASOS URGENTES A SEGUIR

### 1. REVOCAR LA API KEY EXPUESTA
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona el proyecto `leyiapro`
3. Ve a **APIs & Services** > **Credentials**
4. Busca la API key: `AIzaSyB5JRCOHwmniqxoeIrszwW4mm5V_x5DaaI`
5. **ELIMÍNALA INMEDIATAMENTE**

### 2. CREAR NUEVA API KEY
1. En la misma sección **Credentials**
2. Click **+ CREATE CREDENTIALS** > **API key**
3. Copia la nueva API key
4. Click **RESTRICT KEY** y configura:
   - **Application restrictions**: HTTP referrers
   - **Website restrictions**: 
     - `http://localhost:3000/*`
     - `https://leyiapro.firebaseapp.com/*`
   - **API restrictions**: 
     - Firebase Management API
     - Cloud Firestore API
     - Firebase Storage API

### 3. ACTUALIZAR ARCHIVOS .ENV
Actualiza estos archivos con la nueva API key:

```bash
# .env
REACT_APP_FIREBASE_API_KEY=TU_NUEVA_API_KEY_AQUI

# .env.development  
REACT_APP_FIREBASE_API_KEY=TU_NUEVA_API_KEY_AQUI
```

### 4. CERRAR ALERTA EN GITHUB
1. Ve a tu repositorio en GitHub
2. Ve a **Security** > **Secret scanning alerts**
3. Encuentra la alerta #2
4. Click **Close as revoked**

### 5. VERIFICAR LOGS DE SEGURIDAD
1. En Google Cloud Console
2. Ve a **Logging** > **Logs Explorer**
3. Busca actividad sospechosa con la API key comprometida
4. Revisa los últimos 40 minutos desde que se expuso

## ⚠️ IMPORTANTE
- **NO HAGAS COMMIT** hasta completar todos los pasos
- La API key expuesta ya fue eliminada del código
- Asegúrate de que `.env` y `.env.development` estén en `.gitignore`

## 🔍 VERIFICACIÓN FINAL
Ejecuta este comando para verificar que no hay más API keys expuestas:
```bash
node verificacion-completa-firebase.js
```

## 📞 CONTACTO DE EMERGENCIA
Si necesitas ayuda inmediata, contacta al equipo de seguridad de Google Cloud.