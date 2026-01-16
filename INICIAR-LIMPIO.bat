@echo off
title Estudio Juridico - Inicio Limpio
color 0A

echo.
echo  ╔════════════════════════════════════════════════════════╗
echo  ║                                                        ║
echo  ║         ESTUDIO JURIDICO - INICIO LIMPIO              ║
echo  ║                                                        ║
echo  ╚════════════════════════════════════════════════════════╝
echo.
echo  Este script hara:
echo  1. Limpiar cache de npm
echo  2. Limpiar cache de Electron
echo  3. Limpiar archivos compilados
echo  4. Iniciar la aplicacion con 4GB de memoria
echo.
echo  Presiona cualquier tecla para continuar...
pause >nul

echo.
echo  [1/4] Limpiando cache de npm...
call npm cache clean --force >nul 2>&1
echo  ✓ Cache de npm limpiado

echo.
echo  [2/4] Limpiando cache de Electron...
if exist "%APPDATA%\estudio-juridico" (
    rmdir /s /q "%APPDATA%\estudio-juridico" >nul 2>&1
    echo  ✓ Cache de Electron limpiado
) else (
    echo  ✓ No habia cache de Electron
)

echo.
echo  [3/4] Limpiando archivos compilados...
if exist build rmdir /s /q build >nul 2>&1
if exist .cache rmdir /s /q .cache >nul 2>&1
if exist node_modules\.cache rmdir /s /q node_modules\.cache >nul 2>&1
echo  ✓ Archivos compilados limpiados

echo.
echo  [4/4] Iniciando aplicacion...
echo.
echo  ╔════════════════════════════════════════════════════════╗
echo  ║  INSTRUCCIONES:                                        ║
echo  ║                                                        ║
echo  ║  1. Espera "Compiled successfully!"                    ║
echo  ║  2. La ventana se abrira automaticamente               ║
echo  ║  3. Presiona: Ctrl + Shift + R (hard reload)           ║
echo  ║  4. Presiona: F12 (abrir DevTools)                     ║
echo  ║  5. Verifica los logs [CASOS COMPONENT]                ║
echo  ║                                                        ║
echo  ╚════════════════════════════════════════════════════════╝
echo.

set NODE_OPTIONS=--max-old-space-size=4096
set BROWSER=none

npm run electron

echo.
echo  La aplicacion se ha cerrado.
pause
