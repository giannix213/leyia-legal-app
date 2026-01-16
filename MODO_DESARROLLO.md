# 🛠️ Modo Desarrollo - Login

## ✅ Funcionalidad Agregada

Se ha agregado un **botón de "Modo Desarrollo"** en la pantalla de login que permite acceso temporal sin autenticación real.

### 🎯 Ubicación
- **Pantalla**: Login principal (pantalla de bienvenida)
- **Posición**: Debajo de los botones "Ingresar Cuenta" y "Crear Cuenta"
- **Estilo**: Botón rojo con icono de código `</>`

### 🚀 Funcionalidad
Al hacer clic en "Modo Desarrollo":
- ✅ Crea un usuario temporal: `desarrollo@leyia.com`
- ✅ Salta toda la autenticación de Firebase
- ✅ Accede directamente al dashboard principal
- ✅ Configura organización temporal: "ESTUDIO JURÍDICO LEYIA"

### 🔧 Datos del Usuario de Desarrollo
```javascript
{
  uid: 'dev-user-123',
  email: 'desarrollo@leyia.com',
  displayName: 'Usuario Desarrollo'
}
```

### ⚠️ Importante
- **Uso temporal**: Solo para pruebas y desarrollo
- **Sin persistencia**: Los datos no se guardan en Firebase
- **Fácil desactivación**: Puedes remover el botón cuando no lo necesites

### 🎨 Características Visuales
- **Color**: Gradiente rojo (#ff6b6b → #ee5a24)
- **Efectos**: Hover con elevación y sombra
- **Icono**: Símbolos de código `</>`
- **Texto descriptivo**: "Acceso temporal para pruebas"

### 📍 Cómo Desactivar
Para desactivar el modo desarrollo, simplemente comenta o elimina el bloque del botón en `src/components/Login.js` (líneas del botón "Modo Desarrollo").