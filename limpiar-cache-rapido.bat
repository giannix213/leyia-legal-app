@echo off
echo ========================================
echo   LIMPIEZA RAPIDA DE CACHE
echo   (Sin reinstalar node_modules)
echo ========================================
echo.

echo [1/4] Limpiando cache de npm...
call npm cache clean --force
echo OK

echo.
echo [2/4] Limpiando cache de Electron...
if exist "%APPDATA%\estudio-juridico" (
    rmdir /s /q "%APPDATA%\estudio-juridico"
    echo OK: Cache de Electron eliminado
) else (
    echo OK: No habia cache de Electron
)

echo.
echo [3/4] Limpiando archivos compilados...
if exist build (
    rmdir /s /q build
    echo OK: build eliminado
)
if exist .cache (
    rmdir /s /q .cache
    echo OK: .cache eliminado
)

echo.
echo [4/4] Limpiando cache de React Scripts...
if exist node_modules\.cache (
    rmdir /s /q node_modules\.cache
    echo OK: Cache de React Scripts eliminado
)

echo.
echo ========================================
echo   LIMPIEZA RAPIDA COMPLETADA
echo ========================================
echo.
echo Cache limpiado. Ahora ejecuta:
echo   iniciar-electron.bat
echo.
pause
