// ErrorService.js - Servicio centralizado para manejo de errores
// Elimina duplicación de lógica de manejo de errores

class ErrorService {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 100;
  }

  /**
   * Registrar error en el log
   */
  logError(error, context = 'Unknown', additionalInfo = {}) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      context,
      message: error.message || error,
      stack: error.stack,
      additionalInfo,
      id: Date.now() + Math.random()
    };

    this.errorLog.unshift(errorEntry);
    
    // Mantener solo los últimos errores
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // Log en consola con formato consistente
    console.error(`❌ [${context}] ${errorEntry.message}`, {
      error,
      additionalInfo,
      timestamp: errorEntry.timestamp
    });

    return errorEntry;
  }

  /**
   * Manejar errores de Firebase
   */
  handleFirebaseError(error, operation = 'Firebase Operation') {
    let userMessage = 'Ha ocurrido un error. Por favor, intenta nuevamente.';
    
    // Mensajes específicos para errores comunes de Firebase
    switch (error.code) {
      case 'permission-denied':
        userMessage = 'No tienes permisos para realizar esta operación.';
        break;
      case 'unavailable':
        userMessage = 'Servicio temporalmente no disponible. Intenta más tarde.';
        break;
      case 'network-request-failed':
        userMessage = 'Error de conexión. Verifica tu conexión a internet.';
        break;
      case 'quota-exceeded':
        userMessage = 'Se ha excedido la cuota de uso. Contacta al administrador.';
        break;
      case 'unauthenticated':
        userMessage = 'Debes iniciar sesión para realizar esta operación.';
        break;
      default:
        if (error.message) {
          userMessage = error.message;
        }
    }

    const errorEntry = this.logError(error, operation, { 
      code: error.code,
      userMessage 
    });

    return {
      success: false,
      error: userMessage,
      errorId: errorEntry.id,
      context: operation
    };
  }

  /**
   * Manejar errores de validación
   */
  handleValidationError(message, field = null, context = 'Validation') {
    const error = new Error(message);
    const errorEntry = this.logError(error, context, { field });

    return {
      success: false,
      error: message,
      field,
      errorId: errorEntry.id,
      context
    };
  }

  /**
   * Manejar errores de red
   */
  handleNetworkError(error, context = 'Network Operation') {
    let userMessage = 'Error de conexión. Verifica tu conexión a internet.';
    
    if (error.message.includes('fetch')) {
      userMessage = 'No se pudo conectar al servidor. Intenta más tarde.';
    } else if (error.message.includes('timeout')) {
      userMessage = 'La operación tardó demasiado. Intenta nuevamente.';
    }

    const errorEntry = this.logError(error, context);

    return {
      success: false,
      error: userMessage,
      errorId: errorEntry.id,
      context
    };
  }

  /**
   * Manejar errores genéricos
   */
  handleGenericError(error, context = 'Application Error') {
    const errorEntry = this.logError(error, context);

    return {
      success: false,
      error: error.message || 'Ha ocurrido un error inesperado.',
      errorId: errorEntry.id,
      context
    };
  }

  /**
   * Obtener errores recientes
   */
  getRecentErrors(limit = 10) {
    return this.errorLog.slice(0, limit);
  }

  /**
   * Limpiar log de errores
   */
  clearErrorLog() {
    this.errorLog = [];
    console.log('🧹 Log de errores limpiado');
  }

  /**
   * Obtener estadísticas de errores
   */
  getErrorStats() {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

    const errorsLast24h = this.errorLog.filter(
      error => new Date(error.timestamp) > last24h
    );
    
    const errorsLastHour = this.errorLog.filter(
      error => new Date(error.timestamp) > lastHour
    );

    const contextStats = {};
    this.errorLog.forEach(error => {
      contextStats[error.context] = (contextStats[error.context] || 0) + 1;
    });

    return {
      total: this.errorLog.length,
      last24h: errorsLast24h.length,
      lastHour: errorsLastHour.length,
      byContext: contextStats,
      mostCommon: Object.entries(contextStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
    };
  }

  /**
   * Mostrar notificación de error al usuario
   */
  showUserError(message, type = 'error') {
    // Aquí se podría integrar con un sistema de notificaciones
    // Por ahora, usar alert como fallback
    if (type === 'error') {
      console.error('🚨 Error para usuario:', message);
      // En producción, esto sería reemplazado por un toast o modal
      alert(`❌ ${message}`);
    } else if (type === 'warning') {
      console.warn('⚠️ Advertencia para usuario:', message);
      alert(`⚠️ ${message}`);
    }
  }

  /**
   * Wrapper para try-catch con manejo automático
   */
  async withErrorHandling(operation, context = 'Operation', showUserError = true) {
    try {
      return await operation();
    } catch (error) {
      const errorResult = this.handleGenericError(error, context);
      
      if (showUserError) {
        this.showUserError(errorResult.error);
      }
      
      throw error;
    }
  }
}

// Exportar instancia singleton
const errorService = new ErrorService();
export default errorService;