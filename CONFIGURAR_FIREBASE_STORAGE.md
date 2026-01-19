# Configurar Firebase Storage para Subida de Archivos

**Fecha**: 2026-01-16

## Problema Actual

La subida de archivos (PDFs, videos, documentos) está fallando porque Firebase Storage requiere configuración de reglas de seguridad.

## Solución Temporal Implementada

Por ahora, la app guarda solo la **metadata** de los archivos en Firestore (nombre, tipo, tamaño) pero NO sube el archivo físico a Storage.

## Configuración Necesaria en Firebase Console

Para habilitar la subida real de archivos, sigue estos pasos:

### 1. Ir a Firebase Console
- Abre: https://console.firebase.google.com
- Selecciona tu proyecto: **cycabg-e0118**

### 2. Ir a Storage
- En el menú lateral, haz clic en **Storage**
- Si no está habilitado, haz clic en "Comenzar"

### 3. Configurar Reglas de Seguridad

Haz clic en la pestaña **Rules** y reemplaza las reglas con esto:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Permitir lectura y escritura para usuarios autenticados
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
    
    // Reglas específicas para jurisprudencias
    match /jurisprudencias/{organizacionId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
                   && request.resource.size < 50 * 1024 * 1024; // Máximo 50MB
    }
    
    // Reglas específicas para modelos
    match /modelos/{organizacionId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
                   && request.resource.size < 50 * 1024 * 1024; // Máximo 50MB
    }
    
    // Reglas para documentos de expedientes
    match /documentos/{organizacionId}/{casoId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
                   && request.resource.size < 100 * 1024 * 1024; // Máximo 100MB
    }
  }
}
```

### 4. Publicar las Reglas

Haz clic en **Publicar** para aplicar los cambios.

## Después de Configurar Storage

Una vez configurado Storage, actualiza el código en `src/services/JurisprudenciaService.js`:

1. Descomenta las líneas de `uploadBytes` y `getDownloadURL`
2. Cambia `archivoSubido: false` a `archivoSubido: true`
3. Agrega de nuevo los campos `urlDescarga` y `nombreArchivoStorage`

## Estructura de Carpetas en Storage

```
storage/
├── jurisprudencias/
│   └── {organizacionId}/
│       ├── 1234567890_sentencia.pdf
│       └── 1234567891_resolucion.pdf
├── modelos/
│   └── {organizacionId}/
│       ├── 1234567892_resolucion_admisorio.docx
│       └── 1234567893_demanda_modelo.docx
└── documentos/
    └── {organizacionId}/
        └── {casoId}/
            ├── 1234567894_escrito.pdf
            └── 1234567895_prueba.pdf
```

## Verificar que Funciona

1. Reinicia la aplicación
2. Intenta subir un archivo PDF en Jurisprudencia
3. Verifica en Firebase Console > Storage que el archivo aparece
4. Verifica en Firestore que el documento tiene el campo `urlDescarga`

## Límites Recomendados

- **Jurisprudencias**: Máximo 50MB por archivo
- **Modelos**: Máximo 50MB por archivo
- **Documentos de expedientes**: Máximo 100MB por archivo
- **Videos (transcripción)**: Máximo 500MB por archivo

## Notas de Seguridad

Las reglas actuales permiten:
- ✅ Solo usuarios autenticados pueden subir/descargar
- ✅ Límites de tamaño por tipo de archivo
- ✅ Organización por organizacionId para multi-tenancy
- ❌ No hay validación de tipo de archivo (agregar si es necesario)

## Costos de Firebase Storage

- **Almacenamiento**: $0.026 por GB/mes
- **Descarga**: $0.12 por GB
- **Subida**: Gratis

Plan Spark (gratuito):
- 5 GB de almacenamiento
- 1 GB/día de descarga
