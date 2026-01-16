@echo off
echo ========================================
echo   LIMPIEZA COMPLETA DE CACHE
echo   Esto eliminara TODO el cache
echo ========================================
echo.

echo ADVERTENCIA: Esto eliminara:
echo - Cache de npm
echo - Cache de Electron
echo - node_modules (se reinstalaran)
echo - Archivos compilados (build)
echo.
echo Presiona Ctrl+C para cancelar o
pause

echo.
echo [1/6] Limpiando cache de npm...
call npm cache clean --force
if %errorlevel% neq 0 (
    echo ERROR: No se pudo limpiar cache de npm
) else (
    echo OK: Cache de npm limpiado
)

echo.
echo [2/6] Eliminando node_modules...
if exist node_modules (
    rmdir /s /q node_modules
    echo OK: node_modules eliminado
) else (
    echo OK: node_modules no existe
)

echo.
echo [3/6] Eliminando cache de Electron...
if exist "%APPDATA%\estudio-juridico" (
    rmdir /s /q "%APPDATA%\estudio-juridico"
    echo OK: Cache de Electron eliminado
) else (
    echo OK: Cache de Electron no existe
)

echo.
echo [4/6] Eliminando archivos compilados...
if exist build (
    rmdir /s /q build
    echo OK: Carpeta build eliminada
)
if exist dist (
    rmdir /s /q dist
    echo OK: Carpeta dist eliminada
)
if exist .cache (
    rmdir /s /q .cache
    echo OK: Carpeta .cache eliminada
)

echo.
echo [5/6] Reinstalando dependencias...
echo Esto puede tomar varios minutos...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: No se pudieron instalar las dependencias
    pause
    exit /b 1
)
echo OK: Dependencias instaladas

echo.
echo [6/6] Verificando instalacion...
call npm list --depth=0
echo.

echo ========================================
echo   LIMPIEZA COMPLETADA
echo ========================================
echo.
echo TODO el cache ha sido eliminado y las dependencias reinstaladas.
echo.
echo SIGUIENTE PASO:
echo   Ejecuta: iniciar-electron.bat
echo.
pause
