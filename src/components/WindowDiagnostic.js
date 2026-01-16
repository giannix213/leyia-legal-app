import React, { useState, useEffect } from 'react';
import './WindowDiagnostic.css';

const WindowDiagnostic = ({ onClose }) => {
  const [diagnosticData, setDiagnosticData] = useState({
    electron: null,
    window: null,
    navigation: null,
    performance: null,
    storage: null
  });

  useEffect(() => {
    const collectDiagnostics = async () => {
      // Información de Electron
      const electronInfo = {
        isElectron: !!window?.process?.versions?.electron,
        versions: window?.process?.versions || null,
        platform: window?.process?.platform || 'web'
      };

      // Información de la ventana
      const windowInfo = {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        outerWidth: window.outerWidth,
        outerHeight: window.outerHeight,
        devicePixelRatio: window.devicePixelRatio,
        userAgent: navigator.userAgent,
        language: navigator.language,
        onLine: navigator.onLine
      };

      // Información de navegación
      const navigationInfo = {
        url: window.location.href,
        protocol: window.location.protocol,
        host: window.location.host,
        pathname: window.location.pathname,
        referrer: document.referrer
      };

      // Información de rendimiento
      const performanceInfo = {
        memory: performance.memory ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        } : null,
        timing: performance.timing ? {
          navigationStart: performance.timing.navigationStart,
          loadEventEnd: performance.timing.loadEventEnd,
          domContentLoadedEventEnd: performance.timing.domContentLoadedEventEnd
        } : null
      };

      // Información de almacenamiento
      const storageInfo = {
        localStorage: {
          length: localStorage.length,
          keys: Object.keys(localStorage),
          sidebarCompressed: localStorage.getItem('sidebarCompressed'),
          devMode: localStorage.getItem('devMode')
        },
        sessionStorage: {
          length: sessionStorage.length,
          keys: Object.keys(sessionStorage)
        }
      };

      setDiagnosticData({
        electron: electronInfo,
        window: windowInfo,
        navigation: navigationInfo,
        performance: performanceInfo,
        storage: storageInfo
      });
    };

    collectDiagnostics();
  }, []);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const copyToClipboard = () => {
    const diagnosticText = JSON.stringify(diagnosticData, null, 2);
    navigator.clipboard.writeText(diagnosticText).then(() => {
      alert('Diagnóstico copiado al portapapeles');
    });
  };

  return (
    <div className="window-diagnostic-overlay">
      <div className="window-diagnostic-modal">
        <div className="diagnostic-header">
          <h2>🔍 Diagnóstico de Ventanas</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="diagnostic-content">
          {/* Información de Electron */}
          <div className="diagnostic-section">
            <h3>⚡ Electron</h3>
            <div className="diagnostic-grid">
              <div className="diagnostic-item">
                <span className="label">Es Electron:</span>
                <span className={`value ${diagnosticData.electron?.isElectron ? 'success' : 'warning'}`}>
                  {diagnosticData.electron?.isElectron ? 'Sí' : 'No (Web)'}
                </span>
              </div>
              {diagnosticData.electron?.versions && (
                <>
                  <div className="diagnostic-item">
                    <span className="label">Electron:</span>
                    <span className="value">{diagnosticData.electron.versions.electron}</span>
                  </div>
                  <div className="diagnostic-item">
                    <span className="label">Node.js:</span>
                    <span className="value">{diagnosticData.electron.versions.node}</span>
                  </div>
                  <div className="diagnostic-item">
                    <span className="label">Chrome:</span>
                    <span className="value">{diagnosticData.electron.versions.chrome}</span>
                  </div>
                </>
              )}
              <div className="diagnostic-item">
                <span className="label">Plataforma:</span>
                <span className="value">{diagnosticData.electron?.platform}</span>
              </div>
            </div>
          </div>

          {/* Información de Ventana */}
          <div className="diagnostic-section">
            <h3>🪟 Ventana</h3>
            <div className="diagnostic-grid">
              <div className="diagnostic-item">
                <span className="label">Tamaño Interno:</span>
                <span className="value">
                  {diagnosticData.window?.innerWidth} × {diagnosticData.window?.innerHeight}
                </span>
              </div>
              <div className="diagnostic-item">
                <span className="label">Tamaño Externo:</span>
                <span className="value">
                  {diagnosticData.window?.outerWidth} × {diagnosticData.window?.outerHeight}
                </span>
              </div>
              <div className="diagnostic-item">
                <span className="label">Pixel Ratio:</span>
                <span className="value">{diagnosticData.window?.devicePixelRatio}</span>
              </div>
              <div className="diagnostic-item">
                <span className="label">Idioma:</span>
                <span className="value">{diagnosticData.window?.language}</span>
              </div>
              <div className="diagnostic-item">
                <span className="label">En Línea:</span>
                <span className={`value ${diagnosticData.window?.onLine ? 'success' : 'error'}`}>
                  {diagnosticData.window?.onLine ? 'Sí' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Información de Navegación */}
          <div className="diagnostic-section">
            <h3>🧭 Navegación</h3>
            <div className="diagnostic-grid">
              <div className="diagnostic-item">
                <span className="label">URL:</span>
                <span className="value small">{diagnosticData.navigation?.url}</span>
              </div>
              <div className="diagnostic-item">
                <span className="label">Protocolo:</span>
                <span className="value">{diagnosticData.navigation?.protocol}</span>
              </div>
              <div className="diagnostic-item">
                <span className="label">Host:</span>
                <span className="value">{diagnosticData.navigation?.host}</span>
              </div>
            </div>
          </div>

          {/* Información de Rendimiento */}
          {diagnosticData.performance?.memory && (
            <div className="diagnostic-section">
              <h3>⚡ Rendimiento</h3>
              <div className="diagnostic-grid">
                <div className="diagnostic-item">
                  <span className="label">Memoria Usada:</span>
                  <span className="value">
                    {formatBytes(diagnosticData.performance.memory.usedJSHeapSize)}
                  </span>
                </div>
                <div className="diagnostic-item">
                  <span className="label">Memoria Total:</span>
                  <span className="value">
                    {formatBytes(diagnosticData.performance.memory.totalJSHeapSize)}
                  </span>
                </div>
                <div className="diagnostic-item">
                  <span className="label">Límite Memoria:</span>
                  <span className="value">
                    {formatBytes(diagnosticData.performance.memory.jsHeapSizeLimit)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Información de Almacenamiento */}
          <div className="diagnostic-section">
            <h3>💾 Almacenamiento</h3>
            <div className="diagnostic-grid">
              <div className="diagnostic-item">
                <span className="label">LocalStorage:</span>
                <span className="value">{diagnosticData.storage?.localStorage?.length} elementos</span>
              </div>
              <div className="diagnostic-item">
                <span className="label">Sidebar Comprimido:</span>
                <span className="value">{diagnosticData.storage?.localStorage?.sidebarCompressed || 'false'}</span>
              </div>
              <div className="diagnostic-item">
                <span className="label">Modo Desarrollo:</span>
                <span className="value">{diagnosticData.storage?.localStorage?.devMode || 'false'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="diagnostic-actions">
          <button className="copy-btn" onClick={copyToClipboard}>
            📋 Copiar Diagnóstico
          </button>
          <button className="close-btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default WindowDiagnostic;