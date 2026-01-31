@echo off
echo 🔄 LIMPIANDO CACHE PARA NUEVA CUENTA FIREBASE...
echo.

echo 📋 PASO 1: Limpiando cache de npm...
call npm cache clean --force
echo ✅ Cache de npm limpiado

echo.
echo 📋 PASO 2: Eliminando node_modules...
if exist node_modules (
    rmdir /s /q node_modules
    echo ✅ node_modules eliminado
) else (
    echo ⚠️ node_modules no existe
)

echo.
echo 📋 PASO 3: Eliminando package-lock.json...
if exist package-lock.json (
    del package-lock.json
    echo ✅ package-lock.json eliminado
) else (
    echo ⚠️ package-lock.json no existe
)

echo.
echo 📋 PASO 4: Reinstalando dependencias...
call npm install
echo ✅ Dependencias reinstaladas

echo.
echo 🎉 CACHE LIMPIADO COMPLETAMENTE
echo.
echo 📋 PRÓXIMOS PASOS:
echo 1. Limpiar cache del navegador (F12 > Application > Clear Storage)
echo 2. Ejecutar: npm start
echo 3. Verificar que la app funcione con la nueva cuenta Firebase
echo.
pause