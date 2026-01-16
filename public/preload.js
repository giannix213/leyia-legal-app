const { contextBridge, ipcRenderer } = require('electron');

// Exponer funcionalidades de Electron al renderer de forma segura
contextBridge.exposeInMainWorld('electron', {
  selectWordFile: () => ipcRenderer.invoke('select-word-file'),
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath)
});

// Exponer controles de ventana
contextBridge.exposeInMainWorld('electronAPI', {
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  toggleMaximizeWindow: () => ipcRenderer.send('toggle-maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  openDevTools: () => ipcRenderer.send('open-devtools'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  getVersion: () => ipcRenderer.invoke('get-version')
});

console.log('✅ Preload script cargado');
