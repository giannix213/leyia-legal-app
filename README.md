# 📋 Sistema de Gestión para Estudio Jurídico

Aplicación web estilo Notion para gestionar casos, trámites, audiencias y caja chica de un estudio jurídico, con sincronización en tiempo real usando Firebase.

## 🚀 Características

- **Aplicación de Escritorio**: Software nativo para Windows con Electron
- **Casos**: Gestiona todos los casos del estudio con información detallada
- **Trámites Pendientes**: Lista de tareas y trámites con prioridades
- **Audiencias**: Calendario de audiencias con alertas
- **Caja Chica**: Control de ingresos y egresos con balance automático
- **Sincronización en tiempo real**: Todos los cambios se reflejan instantáneamente
- **Interfaz moderna**: Diseño limpio estilo Notion

## 📦 Instalación

1. Instala las dependencias:
```bash
npm install
```

2. Configura Firebase:
   - Ve a [Firebase Console](https://console.firebase.google.com/)
   - Crea un nuevo proyecto
   - Activa Firestore Database
   - Ve a Project Settings > Your apps
   - Copia la configuración y pégala en `src/firebase.js`

3. Inicia la aplicación de escritorio:
```bash
npm run electron:dev
```

La aplicación se abrirá como software de escritorio de Windows

## 🔧 Configuración de Firebase

Edita el archivo `src/firebase.js` con tu configuración:

```javascript
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROJECT_ID.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_PROJECT_ID.appspot.com",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};
```

## 📱 Uso

### Casos
- Crea y gestiona casos con número, cliente, tipo y estado
- Asigna abogados responsables
- Agrega descripciones detalladas

### Trámites
- Registra trámites pendientes con fechas límite
- Marca como completados con un click
- Establece prioridades (baja, media, alta)

### Audiencias
- Programa audiencias con fecha, hora y lugar
- Recibe alertas para audiencias próximas
- Registra juez y abogado responsable

### Caja Chica
- Registra ingresos y egresos
- Visualiza el balance total
- Categoriza movimientos

## 📦 Crear Instalador para Windows

Para crear un instalador .exe que puedas distribuir:

```bash
npm run electron:build-win
```

El instalador se creará en la carpeta `dist/` y podrás instalarlo en cualquier PC con Windows.

## 🌐 Alternativa Web

Si prefieres usarlo como aplicación web:

```bash
npm start
```

Abrirá en el navegador en `http://localhost:3000`

## 🛠️ Tecnologías

- Electron (Aplicación de escritorio)
- React 18
- Firebase (Firestore)
- CSS moderno

## 📄 Licencia

Uso libre para estudios jurídicos.
