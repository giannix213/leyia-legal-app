// ExpedienteValidator.js - Servicio para validar información de expedientes
// Extraído de LeyiaService para reducir complejidad

class ExpedienteValidator {
  static FORMATOS_EXPEDIENTE = [
    'Expediente N°:',
    'EXPEDIENTE :',
    'Expediente:',
    'EXPEDIENTE:',
    'Exp.:',
    'EXP.:'
  ];

  static PATRONES_JUDICIALES = [
    /\d{3,5}-\d{4}-\d+-\d{4}-[A-Z]{2}-[A-Z]{2}/i,
    /\d{3,6}-\d{4}[A-Z0-9\-]*/i,
    /JUEZ\s*:/i,
    /ESPECIALISTA\s*:/i,
    /DELITO\s*:/i,
    /IMPUTADO\s*:/i,
    /DEMANDANTE\s*:/i,
    /MATERIA\s*:/i
  ];

  // Verificar si el texto contiene información básica de expediente
  static verificarInformacionBasica(informacionExpediente) {
    const tieneFormatoExpediente = this.FORMATOS_EXPEDIENTE.some(formato => 
      informacionExpediente.includes(formato)
    );
    
    const tienePatronJudicial = this.PATRONES_JUDICIALES.some(patron => 
      patron.test(informacionExpediente)
    );
    
    return tieneFormatoExpediente || tienePatronJudicial;
  }

  // Validar que los datos extraídos sean válidos
  static validarDatosExtraidos(datos) {
    const errores = [];

    if (!datos.numero) {
      errores.push('Número de expediente es requerido');
    }

    if (datos.numero && datos.numero.length < 5) {
      errores.push('Número de expediente muy corto');
    }

    if (datos.fechaInicio) {
      const fecha = new Date(datos.fechaInicio);
      if (isNaN(fecha.getTime())) {
        errores.push('Fecha de inicio inválida');
      }
    }

    return {
      esValido: errores.length === 0,
      errores
    };
  }

  // Limpiar y normalizar número de expediente
  static limpiarNumeroExpediente(numero) {
    if (!numero) return '';
    return numero.replace(/[^a-zA-Z0-9\-]/g, '').toUpperCase();
  }

  // Comparar números de expediente para búsqueda
  static compararNumeros(numero1, numero2) {
    const limpio1 = this.limpiarNumeroExpediente(numero1);
    const limpio2 = this.limpiarNumeroExpediente(numero2);
    return limpio1 === limpio2;
  }
}

export default ExpedienteValidator;