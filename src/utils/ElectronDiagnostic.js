// src/utils/ElectronDiagnostic.js - Diagnóstico de conectividad para Electron

class ElectronDiagnostic {
  constructor() {
    this.isElectron = !!window?.process?.versions?.electron;
  }

  /**
   * Verifica la conectividad básica
   */
  async checkConnectivity() {
    const results = {
      online: navigator.onLine,
      electron: this.isElectron,
      tests: []
    };

    // Test 1: Conectividad básica
    try {
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      results.tests.push({
        name: 'Google Connectivity',
        status: 'success',
        message: 'Conectividad básica OK'
      });
    } catch (error) {
      results.tests.push({
        name: 'Google Connectivity',
        status: 'error',
        message: `Error: ${error.message}`
      });
    }

    // Test 2: Firebase endpoints
    try {
      const response = await fetch('https://identitytoolkit.googleapis.com/v1/projects', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      results.tests.push({
        name: 'Firebase Auth Endpoint',
        status: 'success',
        message: 'Firebase Auth accesible'
      });
    } catch (error) {
      results.tests.push({
        name: 'Firebase Auth Endpoint',
        status: 'error',
        message: `Error: ${error.message}`
      });
    }

    // Test 3: Google OAuth endpoints
    try {
      const response = await fetch('https://accounts.google.com/o/oauth2/auth', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      results.tests.push({
        name: 'Google OAuth Endpoint',
        status: 'success',
        message: 'Google OAuth accesible'
      });
    } catch (error) {
      results.tests.push({
        name: 'Google OAuth Endpoint',
        status: 'error',
        message: `Error: ${error.message}`
      });
    }

    return results;
  }

  /**
   * Verifica la configuración de Electron
   */
  checkElectronConfig() {
    if (!this.isElectron) {
      return {
        status: 'not-electron',
        message: 'No se está ejecutando en Electron'
      };
    }

    const config = {
      versions: window.process?.versions || {},
      env: {
        NODE_ENV: process.env.NODE_ENV,
        ELECTRON_IS_DEV: process.env.ELECTRON_IS_DEV
      },
      apis: {
        electronAPI: !!window.electronAPI,
        openExternal: !!(window.electronAPI?.openExternal),
        getVersion: !!(window.electronAPI?.getVersion)
      }
    };

    return {
      status: 'electron',
      config
    };
  }

  /**
   * Ejecuta diagnóstico completo
   */
  async runFullDiagnostic() {
    console.log('🔍 Iniciando diagnóstico completo...');
    
    const results = {
      timestamp: new Date().toISOString(),
      connectivity: await this.checkConnectivity(),
      electron: this.checkElectronConfig()
    };

    console.log('📊 Resultados del diagnóstico:', results);
    return results;
  }

  /**
   * Muestra diagnóstico en formato legible
   */
  async showDiagnostic() {
    const results = await this.runFullDiagnostic();
    
    let message = '🔍 DIAGNÓSTICO DE CONECTIVIDAD\n\n';
    
    // Estado general
    message += `📡 Online: ${results.connectivity.online ? '✅' : '❌'}\n`;
    message += `🖥️ Electron: ${results.connectivity.electron ? '✅' : '❌'}\n\n`;
    
    // Tests de conectividad
    message += '🌐 TESTS DE CONECTIVIDAD:\n';
    results.connectivity.tests.forEach(test => {
      const icon = test.status === 'success' ? '✅' : '❌';
      message += `${icon} ${test.name}: ${test.message}\n`;
    });
    
    // Configuración de Electron
    if (results.electron.status === 'electron') {
      message += '\n🔧 CONFIGURACIÓN ELECTRON:\n';
      message += `Versión: ${results.electron.config.versions.electron}\n`;
      message += `APIs disponibles: ${results.electron.config.apis.electronAPI ? '✅' : '❌'}\n`;
      message += `openExternal: ${results.electron.config.apis.openExternal ? '✅' : '❌'}\n`;
    }
    
    alert(message);
    return results;
  }
}

export default ElectronDiagnostic;