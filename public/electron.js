const { app, BrowserWindow, ipcMain, shell, dialog, protocol } = require('electron');
const path = require('path');
// Detección más robusta del modo desarrollo
const isDev = process.env.NODE_ENV === 'development' || 
             process.defaultApp || 
             /[\\/]electron-prebuilt[\\/]/.test(process.execPath) || 
             /[\\/]electron[\\/]/.test(process.execPath);
const express = require('express');
const fs = require('fs');

let mainWindow;
let server;

// Manejar instancia única (evitar múltiples instancias)
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Alguien intentó ejecutar una segunda instancia, enfocar nuestra ventana
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 600,
    minHeight: 400,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      experimentalFeatures: true,
      partition: 'persist:main',
      enableRemoteModule: false,
      sandbox: false,
      nativeWindowOpen: true
    },
    frame: false, // Sin marco
    transparent: false, // Sin transparencia
    resizable: true,
    show: false,
    backgroundColor: '#000000', // Fondo negro puro
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    // Configuraciones específicas para Windows
    skipTaskbar: false,
    alwaysOnTop: false,
    fullscreenable: true,
    maximizable: true,
    minimizable: true,
    closable: true,
    // Eliminar completamente cualquier decoración de ventana
    useContentSize: false,
    center: true,
    // Configuración adicional para eliminar bordes en Windows
    ...(process.platform === 'win32' && {
      titleBarOverlay: false,
      thickFrame: false
    })
  });

  // Ocultar completamente la barra de menú
  mainWindow.setMenuBarVisibility(false);
  mainWindow.setMenu(null);

  console.log('isDev:', isDev);
  console.log('__dirname:', __dirname);
  
  // Sistema de logging visible para debugging
  let debugLogs = [];
  const addDebugLog = (message) => {
    console.log(message);
    debugLogs.push(message);
  };
  
  // Cargar la aplicación
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    // En producción, determinar la ruta correcta del build
    let buildPath;
    let indexPath;
    
    addDebugLog('=== DEBUGGING PRODUCTION PATHS ===');
    addDebugLog('__dirname: ' + __dirname);
    addDebugLog('process.resourcesPath: ' + process.resourcesPath);
    addDebugLog('app.getAppPath(): ' + app.getAppPath());
    
    // Intentar diferentes rutas posibles (orden corregido para aplicación empaquetada)
    const possiblePaths = [
      path.join(process.resourcesPath, '../build'), // Ruta correcta para aplicación empaquetada
      path.join(__dirname, '../build'),
      path.join(__dirname, '../../build'),
      path.join(__dirname, '../../../build'),
      path.join(process.resourcesPath, 'build'),
      path.join(process.resourcesPath, 'app/build'),
      path.join(process.resourcesPath, 'app.asar.unpacked/build'),
      path.join(app.getAppPath(), 'build'),
      path.join(app.getAppPath(), '../build')
    ];
    
    addDebugLog('=== TESTING PATHS ===');
    for (const testPath of possiblePaths) {
      const testIndexPath = path.join(testPath, 'index.html');
      addDebugLog('Testing path: ' + testIndexPath);
      addDebugLog('Exists: ' + fs.existsSync(testIndexPath));
      
      if (fs.existsSync(testIndexPath)) {
        buildPath = testPath;
        indexPath = testIndexPath;
        addDebugLog('✓ Found build at: ' + buildPath);
        break;
      }
    }
    
    if (indexPath && fs.existsSync(indexPath)) {
      console.log('✓ Loading index.html from:', indexPath);
      
      // Método 1: Intentar cargar directamente el archivo
      console.log('✓ Method 1: Attempting direct file load...');
      mainWindow.loadFile(indexPath).then(() => {
        console.log('✓ Direct file load successful');
      }).catch((error) => {
        console.log('✗ Direct file load failed:', error);
        
        // Método 2: Usar protocolo personalizado
        console.log('✓ Method 2: Attempting custom protocol...');
        mainWindow.loadURL('app://index.html').then(() => {
          console.log('✓ Custom protocol load successful');
        }).catch((protocolError) => {
          console.log('✗ Custom protocol failed:', protocolError);
          
          // Método 3: Fallback a servidor local (127.0.0.1 en lugar de localhost)
          console.log('✓ Method 3: Falling back to 127.0.0.1 server...');
          
          const expressApp = express();
          
          // Configurar middleware para logging
          expressApp.use((req, res, next) => {
            console.log('Request:', req.method, req.url);
            next();
          });
          
          // Servir archivos estáticos
          expressApp.use(express.static(buildPath, {
            setHeaders: (res, path) => {
              console.log('Serving file:', path);
            }
          }));
          
          // Manejar rutas SPA
          expressApp.get('*', (req, res) => {
            console.log('Serving index.html for route:', req.url);
            res.sendFile(indexPath);
          });
          
          server = expressApp.listen(0, '127.0.0.1', () => {
            const port = server.address().port;
            console.log('✓ Fallback server running on port:', port);
            const url = `http://127.0.0.1:${port}`;
            console.log('✓ Loading fallback URL:', url);
            mainWindow.loadURL(url);
          });
        });
      });
    } else {
      addDebugLog('✗ No se pudo encontrar el archivo index.html en ninguna ubicación');
      addDebugLog('Rutas probadas: ' + possiblePaths.join(', '));
      
      // Listar contenido de directorios para debugging
      addDebugLog('=== DIRECTORY CONTENTS ===');
      possiblePaths.forEach(testPath => {
        const dir = path.dirname(testPath);
        if (fs.existsSync(dir)) {
          addDebugLog(`Contents of ${dir}: ${fs.readdirSync(dir).join(', ')}`);
        }
      });
      
      // Mostrar logs completos al usuario
      const logText = debugLogs.join('\n');
      dialog.showErrorBox(
        'Error de carga - Debug Info', 
        'No se encontró index.html. Logs:\n\n' + logText
      );
    }
  }
  
  // Mostrar ventana después de un tiempo si ready-to-show no funciona
  const showTimeout = setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      console.log('Forcing window to show after timeout');
      mainWindow.show();
    }
  }, 3000);
  
  // Mostrar ventana solo cuando el contenido esté listo
  mainWindow.once('ready-to-show', () => {
    clearTimeout(showTimeout);
    console.log('Window ready to show');
    mainWindow.show();
  });
  
  // Agregar más eventos para debugging
  mainWindow.webContents.on('dom-ready', () => {
    console.log('DOM ready');
  });
  
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Finished loading');
  });

  // Configurar DevTools y atajos de teclado
  if (isDev) {
    // Solo abrir DevTools en desarrollo si es necesario
    // mainWindow.webContents.openDevTools();
    
    // 🔧 ATAJOS DE TECLADO PARA DESARROLLO
    mainWindow.webContents.on('before-input-event', (event, input) => {
      // Ctrl + Shift + I para abrir DevTools
      if (input.control && input.shift && input.key.toLowerCase() === 'i') {
        console.log('🔧 Atajo DevTools detectado: Ctrl+Shift+I');
        if (mainWindow.webContents.isDevToolsOpened()) {
          mainWindow.webContents.closeDevTools();
          console.log('🔧 DevTools cerradas');
        } else {
          mainWindow.webContents.openDevTools();
          console.log('🔧 DevTools abiertas');
        }
      }
      
      // F12 también para DevTools
      if (input.key === 'F12') {
        console.log('🔧 Atajo DevTools detectado: F12');
        if (mainWindow.webContents.isDevToolsOpened()) {
          mainWindow.webContents.closeDevTools();
          console.log('🔧 DevTools cerradas');
        } else {
          mainWindow.webContents.openDevTools();
          console.log('🔧 DevTools abiertas');
        }
      }
      
      // 🔥 CTRL + SHIFT + R para HARD RELOAD (limpiar caché)
      if (input.control && input.shift && input.key.toLowerCase() === 'r') {
        console.log('🔥 HARD RELOAD detectado: Ctrl+Shift+R');
        console.log('🧹 Limpiando caché de Electron...');
        
        // Limpiar todos los cachés
        const { session } = require('electron');
        const ses = session.fromPartition('persist:main');
        
        ses.clearCache().then(() => {
          console.log('✅ Caché limpiado');
          ses.clearStorageData({
            storages: ['appcache', 'serviceworkers', 'cachestorage']
          }).then(() => {
            console.log('✅ Storage limpiado');
            console.log('🔄 Recargando aplicación...');
            mainWindow.reload();
          });
        });
        
        event.preventDefault();
      }
      
      // F5 para reload normal
      if (input.key === 'F5' && !input.control && !input.shift) {
        console.log('🔄 Reload normal detectado: F5');
        mainWindow.reload();
        event.preventDefault();
      }
    });
    
  } else {
    // Deshabilitar completamente DevTools en producción
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools();
    });
    
    // Deshabilitar atajos de teclado para DevTools
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.control && input.shift && input.key.toLowerCase() === 'i') {
        event.preventDefault();
      }
      if (input.key === 'F12') {
        event.preventDefault();
      }
    });
  }

  // Log de errores de carga
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('✗ Failed to load:', errorCode, errorDescription, validatedURL);
    // En caso de error, intentar recargar
    if (!isDev) {
      setTimeout(() => {
        console.log('Attempting to reload...');
        mainWindow.reload();
      }, 2000);
    }
  });

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`Console [${level}]:`, message, `(${sourceId}:${line})`);
  });

  // Más eventos de debugging
  mainWindow.webContents.on('did-start-loading', () => {
    console.log('✓ Started loading');
  });

  mainWindow.webContents.on('did-stop-loading', () => {
    console.log('✓ Stopped loading');
  });

  mainWindow.webContents.on('did-navigate', (event, url) => {
    console.log('✓ Navigated to:', url);
  });

  mainWindow.webContents.on('page-title-updated', (event, title) => {
    console.log('✓ Page title updated:', title);
  });

  mainWindow.on('closed', () => {
    if (server) {
      server.close();
    }
    mainWindow = null;
  });
}

app.on('ready', () => {
  // Configurar session básica
  const { session } = require('electron');
  const ses = session.fromPartition('persist:main');
  
  // Configurar User Agent
  ses.setUserAgent(ses.getUserAgent() + ' ElectronApp/1.0.0');
  
  // Configurar proxy del sistema
  ses.setProxy({
    mode: 'system'
  });
  
  // Registrar protocolo personalizado para servir archivos estáticos
  if (!isDev) {
    protocol.registerFileProtocol('app', (request, callback) => {
      const url = request.url.substr(6); // Remover 'app://'
      const filePath = path.normalize(path.join(__dirname, '../build', url));
      console.log('Protocol request:', url, '->', filePath);
      callback(filePath);
    });
  }
  
  createWindow();
});

app.on('window-all-closed', () => {
  if (server) {
    server.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Manejadores para controles de ventana
ipcMain.on('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.on('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('toggle-maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('close-window', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

// Manejador para seleccionar archivo de Word
ipcMain.handle('select-word-file', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Seleccionar archivo de Word',
      filters: [
        { name: 'Documentos de Word', extensions: ['doc', 'docx'] },
        { name: 'Todos los archivos', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled) {
      return { success: false, canceled: true };
    }

    return { success: true, filePath: result.filePaths[0] };
  } catch (error) {
    console.error('Error al seleccionar archivo:', error);
    return { success: false, error: error.message };
  }
});

// Manejador para abrir DevTools desde la interfaz
ipcMain.on('open-devtools', () => {
  if (mainWindow && isDev) {
    console.log('🔧 Abriendo DevTools desde interfaz...');
    if (mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools();
    } else {
      mainWindow.webContents.openDevTools();
    }
  }
});

// Manejador para abrir URLs externas (OAuth)
ipcMain.handle('open-external', async (event, url) => {
  try {
    console.log('🔗 Abriendo URL externa:', url);
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    console.error('❌ Error al abrir URL externa:', error);
    return { success: false, error: error.message };
  }
});

// Manejador para obtener versión de Electron
ipcMain.handle('get-version', () => {
  return {
    electron: process.versions.electron,
    node: process.versions.node,
    chrome: process.versions.chrome
  };
});

// Manejador para abrir archivo
ipcMain.handle('open-file', async (event, filePath) => {
  try {
    await shell.openPath(filePath);
    return { success: true };
  } catch (error) {
    console.error('Error al abrir archivo:', error);
    return { success: false, error: error.message };
  }
});
