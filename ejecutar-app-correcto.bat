@echo off
echo ========================================
echo   EJECUTAR ESTUDIO JURIDICO - CORRECTO
echo ========================================
echo.

REM Crear archivo de log
set LOGFILE=%USERPROFILE%\Desktop\logs-aplicacion.txt
echo === LOGS ESTUDIO JURIDICO === > "%LOGFILE%"
echo Fecha: %DATE% %TIME% >> "%LOGFILE%"
echo. >> "%LOGFILE%"

echo Ejecutable encontrado: C:\Program Files\estudio-juridico\Estudio Juridico.exe
echo Ejecutable encontrado: C:\Program Files\estudio-juridico\Estudio Juridico.exe >> "%LOGFILE%"

echo.
echo Cambiando al directorio de la aplicacion...
echo Cambiando al directorio de la aplicacion... >> "%LOGFILE%"

cd "C:\Program Files\estudio-juridico"
echo Directorio actual: %CD% >> "%LOGFILE%"

echo.
echo ========================================
echo EJECUTANDO APLICACION...
echo ========================================
echo Los logs apareceran a continuacion:
echo.

REM Ejecutar la aplicacion y capturar TODA la salida
echo === INICIO DE LOGS DE LA APLICACION === >> "%LOGFILE%"
"Estudio Juridico.exe" >> "%LOGFILE%" 2>&1
echo === FIN DE LOGS DE LA APLICACION === >> "%LOGFILE%"

echo.
echo ========================================
echo La aplicacion termino.
echo Logs guardados en: %LOGFILE%
echo ========================================
echo.
pause