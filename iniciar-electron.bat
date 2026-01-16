@echo off
echo ========================================
echo   INICIANDO APLICACION ELECTRON
echo   Con memoria aumentada (4GB)
echo ========================================
echo.

REM Configurar variables de entorno
set NODE_OPTIONS=--max-old-space-size=4096
set BROWSER=none

echo OPCIONES:
echo [1] Iniciar normalmente
echo [2] Limpiar cache rapido y luego iniciar
echo [3] Limpiar TODO (cache + reinstalar) y luego iniciar
echo.
set /p opcion="Selecciona una opcion (1-3): "

if "%opcion%"=="2" (
    echo.
    echo Limpiando cache rapido...
    call limpiar-cache-rapido.bat
    echo.
)

if "%opcion%"=="3" (
    echo.
    echo Limpiando TODO el cache...
    call limpiar-todo-cache.bat
    echo.
)

echo.
echo [*] Iniciando aplicacion...
echo.
echo IMPORTANTE:
echo - Espera a que aparezca "Compiled successfully!"
echo - La ventana de Electron se abrira automaticamente
echo - Si no ves los casos, presiona: Ctrl + Shift + R
echo.

REM Iniciar la aplicacion
npm run electron

pause
