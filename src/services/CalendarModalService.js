// CalendarModalService.js - Servicio para manejo centralizado de modales del calendario
// Elimina duplicación en lógica de modales (crear, editar, eliminar)

import CalendarService from './CalendarService';
import ErrorService from './ErrorService';

class CalendarModalService {
  // ===== ESTADOS DE MODAL =====
  
  static TIPOS_MODAL = {
    CREAR: 'crear',
    EDITAR: 'editar', 
    ELIMINAR: 'eliminar',
    VER: 'ver'
  };

  // ===== CONFIGURACIÓN DE MODALES =====
  
  static getConfiguracionModal(tipo) {
    const configuraciones = {
      [this.TIPOS_MODAL.CREAR]: {
        titulo: 'Crear Nuevo Evento',
        botonPrincipal: 'Crear Evento',
        botonCargando: 'Creando...',
        icono: '➕',
        clase: 'modal-crear'
      },
      [this.TIPOS_MODAL.EDITAR]: {
        titulo: 'Editar Evento',
        botonPrincipal: 'Actualizar Evento',
        botonCargando: 'Actualizando...',
        icono: '✏️',
        clase: 'modal-editar'
      },
      [this.TIPOS_MODAL.ELIMINAR]: {
        titulo: 'Eliminar Evento',
        botonPrincipal: 'Sí, Eliminar',
        botonCargando: 'Eliminando...',
        icono: '⚠️',
        clase: 'modal-eliminar'
      },
      [this.TIPOS_MODAL.VER]: {
        titulo: 'Detalles del Evento',
        botonPrincipal: 'Cerrar',
        botonCargando: 'Cerrar',
        icono: '👁️',
        clase: 'modal-ver'
      }
    };

    return configuraciones[tipo] || configuraciones[this.TIPOS_MODAL.CREAR];
  }

  // ===== VALIDACIONES DE FORMULARIO =====
  
  static validarFormularioEvento(formData) {
    const errores = {};
    
    // Validar título
    if (!formData.titulo || formData.titulo.trim() === '') {
      errores.titulo = 'El título es requerido';
    } else if (formData.titulo.length > 100) {
      errores.titulo = 'El título no puede exceder 100 caracteres';
    }

    // Validar tipo
    if (!formData.tipo) {
      errores.tipo = 'El tipo de evento es requerido';
    } else if (!Object.values(CalendarService.TIPOS_EVENTO).includes(formData.tipo)) {
      errores.tipo = 'Tipo de evento no válido';
    }

    // Validar fecha
    if (!formData.fecha) {
      errores.fecha = 'La fecha es requerida';
    } else {
      const fecha = new Date(formData.fecha);
      if (isNaN(fecha.getTime())) {
        errores.fecha = 'Fecha no válida';
      } else {
        // Validar que no sea una fecha muy antigua
        const fechaMinima = new Date();
        fechaMinima.setFullYear(fechaMinima.getFullYear() - 1);
        if (fecha < fechaMinima) {
          errores.fecha = 'La fecha no puede ser anterior a un año';
        }
      }
    }

    // Validar hora
    if (!formData.hora) {
      errores.hora = 'La hora es requerida';
    } else if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(formData.hora)) {
      errores.hora = 'Formato de hora no válido (HH:MM)';
    }

    // Validar descripción (opcional pero con límite)
    if (formData.descripcion && formData.descripcion.length > 500) {
      errores.descripcion = 'La descripción no puede exceder 500 caracteres';
    }

    // Validar caso (opcional pero con formato)
    if (formData.caso && formData.caso.length > 50) {
      errores.caso = 'El caso no puede exceder 50 caracteres';
    }

    // Validar lugar (opcional pero con límite)
    if (formData.lugar && formData.lugar.length > 100) {
      errores.lugar = 'El lugar no puede exceder 100 caracteres';
    }

    // Validar juez (opcional pero con límite)
    if (formData.juez && formData.juez.length > 100) {
      errores.juez = 'El nombre del juez no puede exceder 100 caracteres';
    }

    // Validar abogado (opcional pero con límite)
    if (formData.abogado && formData.abogado.length > 100) {
      errores.abogado = 'El nombre del abogado no puede exceder 100 caracteres';
    }

    // Validar notas (opcional pero con límite)
    if (formData.notas && formData.notas.length > 1000) {
      errores.notas = 'Las notas no pueden exceder 1000 caracteres';
    }

    return {
      esValido: Object.keys(errores).length === 0,
      errores
    };
  }

  // ===== PREPARACIÓN DE DATOS =====
  
  static prepararDatosParaCrear(formData) {
    return {
      titulo: formData.titulo.trim(),
      descripcion: formData.descripcion?.trim() || '',
      tipo: formData.tipo,
      fecha: formData.fecha,
      hora: formData.hora,
      caso: formData.caso?.trim() || '',
      lugar: formData.lugar?.trim() || '',
      juez: formData.juez?.trim() || '',
      abogado: formData.abogado?.trim() || '',
      notas: formData.notas?.trim() || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  static prepararDatosParaEditar(formData, eventoOriginal) {
    return {
      ...eventoOriginal,
      titulo: formData.titulo.trim(),
      descripcion: formData.descripcion?.trim() || '',
      tipo: formData.tipo,
      fecha: formData.fecha,
      hora: formData.hora,
      caso: formData.caso?.trim() || '',
      lugar: formData.lugar?.trim() || '',
      juez: formData.juez?.trim() || '',
      abogado: formData.abogado?.trim() || '',
      notas: formData.notas?.trim() || '',
      updatedAt: new Date()
    };
  }

  static prepararFormDataDesdeEvento(evento) {
    return {
      titulo: evento.titulo || '',
      descripcion: evento.descripcion || '',
      tipo: evento.tipo || CalendarService.TIPOS_EVENTO.CITA,
      fecha: evento.fecha || CalendarService.obtenerFechaString(new Date()),
      hora: evento.hora || '09:00',
      caso: evento.caso || '',
      lugar: evento.lugar || '',
      juez: evento.juez || '',
      abogado: evento.abogado || '',
      notas: evento.notas || ''
    };
  }

  // ===== MANEJO DE ERRORES ESPECÍFICOS =====
  
  static manejarErrorCreacion(error) {
    console.error('Error al crear evento:', error);
    
    if (error.code === 'permission-denied') {
      return 'No tienes permisos para crear eventos';
    } else if (error.code === 'network-request-failed') {
      return 'Error de conexión. Verifica tu conexión a internet';
    } else if (error.message?.includes('required')) {
      return 'Faltan campos requeridos';
    }
    
    return 'Error al crear el evento. Intenta nuevamente';
  }

  static manejarErrorEdicion(error) {
    console.error('Error al editar evento:', error);
    
    if (error.code === 'permission-denied') {
      return 'No tienes permisos para editar este evento';
    } else if (error.code === 'not-found') {
      return 'El evento no existe o fue eliminado';
    } else if (error.code === 'network-request-failed') {
      return 'Error de conexión. Verifica tu conexión a internet';
    }
    
    return 'Error al actualizar el evento. Intenta nuevamente';
  }

  static manejarErrorEliminacion(error) {
    console.error('Error al eliminar evento:', error);
    
    if (error.code === 'permission-denied') {
      return 'No tienes permisos para eliminar este evento';
    } else if (error.code === 'not-found') {
      return 'El evento no existe o ya fue eliminado';
    } else if (error.code === 'network-request-failed') {
      return 'Error de conexión. Verifica tu conexión a internet';
    }
    
    return 'Error al eliminar el evento. Intenta nuevamente';
  }

  // ===== UTILIDADES DE MODAL =====
  
  static generarIdModal(tipo, eventoId = null) {
    const timestamp = Date.now();
    return eventoId ? `${tipo}-${eventoId}-${timestamp}` : `${tipo}-${timestamp}`;
  }

  static esModalDeConfirmacion(tipo) {
    return tipo === this.TIPOS_MODAL.ELIMINAR;
  }

  static esModalDeFormulario(tipo) {
    return [this.TIPOS_MODAL.CREAR, this.TIPOS_MODAL.EDITAR].includes(tipo);
  }

  static esModalDeSoloLectura(tipo) {
    return tipo === this.TIPOS_MODAL.VER;
  }

  // ===== MENSAJES DE CONFIRMACIÓN =====
  
  static generarMensajeConfirmacion(tipo, evento = null) {
    switch (tipo) {
      case this.TIPOS_MODAL.ELIMINAR:
        return {
          titulo: '¿Estás seguro?',
          mensaje: `¿Deseas eliminar el evento "${evento?.titulo || 'este evento'}"?`,
          advertencia: 'Esta acción no se puede deshacer',
          tipoAdvertencia: 'error'
        };
      default:
        return {
          titulo: 'Confirmar acción',
          mensaje: '¿Deseas continuar?',
          advertencia: null,
          tipoAdvertencia: 'info'
        };
    }
  }

  // ===== NOTIFICACIONES DE ÉXITO =====
  
  static generarMensajeExito(tipo, evento = null) {
    switch (tipo) {
      case this.TIPOS_MODAL.CREAR:
        return `Evento "${evento?.titulo || 'nuevo evento'}" creado exitosamente`;
      case this.TIPOS_MODAL.EDITAR:
        return `Evento "${evento?.titulo || 'evento'}" actualizado exitosamente`;
      case this.TIPOS_MODAL.ELIMINAR:
        return `Evento "${evento?.titulo || 'evento'}" eliminado exitosamente`;
      default:
        return 'Operación completada exitosamente';
    }
  }

  // ===== INTEGRACIÓN CON ERROR SERVICE =====
  
  static async ejecutarConManejadorError(operacion, tipoOperacion, evento = null) {
    try {
      const resultado = await operacion();
      return {
        success: true,
        data: resultado,
        message: this.generarMensajeExito(tipoOperacion, evento)
      };
    } catch (error) {
      let mensajeError;
      
      switch (tipoOperacion) {
        case this.TIPOS_MODAL.CREAR:
          mensajeError = this.manejarErrorCreacion(error);
          break;
        case this.TIPOS_MODAL.EDITAR:
          mensajeError = this.manejarErrorEdicion(error);
          break;
        case this.TIPOS_MODAL.ELIMINAR:
          mensajeError = this.manejarErrorEliminacion(error);
          break;
        default:
          mensajeError = 'Error en la operación';
      }

      ErrorService.logError(error, `Calendar Modal - ${tipoOperacion}`, { evento });
      
      return {
        success: false,
        error: mensajeError,
        originalError: error
      };
    }
  }
}

export default CalendarModalService;