@echo off
echo ========================================
echo   CREAR ARCHIVO .env
echo   Configuracion de Firebase
echo ========================================
echo.

echo Este script te ayudara a crear el archivo .env
echo con tus credenciales de Firebase.
echo.
echo IMPORTANTE: Necesitas tener tus credenciales de Firebase.
echo Si no las tienes, ve a: https://console.firebase.google.com/
echo.
pause

echo.
echo Ingresa tus credenciales de Firebase:
echo (Copia y pega desde Firebase Console)
echo.

set /p API_KEY="REACT_APP_FIREBASE_API_KEY: "
set /p AUTH_DOMAIN="REACT_APP_FIREBASE_AUTH_DOMAIN: "
set /p PROJECT_ID="REACT_APP_FIREBASE_PROJECT_ID: "
set /p STORAGE_BUCKET="REACT_APP_FIREBASE_STORAGE_BUCKET: "
set /p MESSAGING_SENDER_ID="REACT_APP_FIREBASE_MESSAGING_SENDER_ID: "
set /p APP_ID="REACT_APP_FIREBASE_APP_ID: "

echo.
echo Creando archivo .env...

(
echo # Firebase Configuration
echo REACT_APP_FIREBASE_API_KEY=%API_KEY%
echo REACT_APP_FIREBASE_AUTH_DOMAIN=%AUTH_DOMAIN%
echo REACT_APP_FIREBASE_PROJECT_ID=%PROJECT_ID%
echo REACT_APP_FIREBASE_STORAGE_BUCKET=%STORAGE_BUCKET%
echo REACT_APP_FIREBASE_MESSAGING_SENDER_ID=%MESSAGING_SENDER_ID%
echo REACT_APP_FIREBASE_APP_ID=%APP_ID%
echo.
echo # Configuracion de desarrollo
echo REACT_APP_ENV=development
echo NODE_ENV=development
echo REACT_APP_DEBUG=true
) > .env

echo.
echo ========================================
echo   ARCHIVO .env CREADO
echo ========================================
echo.
echo El archivo .env ha sido creado con tus credenciales.
echo.
echo SIGUIENTE PASO:
echo   Ejecuta: INICIAR-LIMPIO.bat
echo.
pause
