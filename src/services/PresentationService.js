// PresentationService.js - Servicio para lógica de presentación
// Centraliza formateo, colores, iconos y transformaciones de datos para la vista

class PresentationService {
  // ===== COLORES Y TEMAS =====
  
  static getColorForType(tipo) {
    const colores = {
      'civil': '#3b82f6',
      'penal': '#ef4444', 
      'laboral': '#10b981',
      'familia': '#f59e0b',
      'comercial': '#8b5cf6',
      'contencioso': '#06b6d4',
      'contencioso administrativo': '#ef4444',
      'no contencioso': '#06b6d4',
      'ejecucion': '#14b8a6',
      'ejecutivo': '#14b8a6',
      'constitucional': '#ec4899',
      'tributario': '#f97316'
    };
    return colores[tipo?.toLowerCase()] || '#6b7280';
  }

  static getPrioridadColor(prioridad) {
    const colores = {
      'alta': '#ef4444',
      'media': '#f59e0b', 
      'baja': '#10b981'
    };
    return colores[prioridad?.toLowerCase()] || '#6b7280';
  }

  static getEstadoColor(estado) {
    const colores = {
      'activo': '#10b981',
      'postulatoria': '#3b82f6',
      'postulacion': '#3b82f6',
      'contestacion': '#8b5cf6',
      'reconvencion': '#a855f7',
      'saneamiento': '#06b6d4',
      'conciliacion': '#14b8a6',
      'probatoria': '#f59e0b',
      'alegatos': '#f97316',
      'decisoria': '#ec4899',
      'sentencia': '#10b981',
      'apelacion': '#ef4444',
      'casacion': '#dc2626',
      'queja': '#f59e0b',
      'ejecucion': '#059669',
      'liquidacion': '#0891b2',
      'medida_cautelar': '#f59e0b',
      'terceria': '#8b5cf6',
      'arbitraje': '#7c3aed',
      'revision': '#06b6d4',
      'sobreseimiento': '#6b7280',
      'inadmisible': '#6b7280',
      'improcedente': '#6b7280',
      'fraccionamiento': '#0891b2',
      'medida_proteccion': '#ef4444',
      'traslado': '#06b6d4',
      'aclaracion': '#f59e0b',
      'desistido': '#6b7280',
      'conciliado': '#14b8a6',
      'archivado': '#6b7280',
      'concluido': '#6b7280',
      'terminado': '#6b7280',
      'suspendido': '#f59e0b',
      'en espera': '#f59e0b',
      'pendiente': '#f59e0b'
    };
    return colores[estado?.toLowerCase()] || '#6b7280';
  }

  // ===== ICONOS =====
  
  static getIconForType(tipo) {
    const iconos = {
      'civil': '⚖️',
      'penal': '🚔',
      'laboral': '👷',
      'familia': '👨‍👩‍👧‍👦',
      'comercial': '💼',
      'contencioso': '🏛️',
      'contencioso administrativo': '🏛️',
      'no contencioso': '📋',
      'ejecucion': '⚡',
      'ejecutivo': '⚡',
      'constitucional': '📜',
      'tributario': '💰'
    };
    return iconos[tipo?.toLowerCase()] || '📋';
  }

  static getIconForCategory(categoria) {
    const iconos = {
      'Audiencia': '⚖️',
      'Comunicación': '📞',
      'Preparación': '📝',
      'Diligencia': '🏃‍♂️',
      'Trámite': '📋',
      'Revisión': '🔍',
      'Seguimiento': '📊',
      'Actualización': '🔄',
      'Coordinación': '📞',
      'Escrito': '📄'
    };
    return iconos[categoria] || '📌';
  }

  static getIconForPrioridad(prioridad) {
    const iconos = {
      'alta': '🔥',
      'media': '⚡',
      'baja': '📌'
    };
    return iconos[prioridad?.toLowerCase()] || '📌';
  }

  // ===== FORMATEO DE FECHAS =====
  
  static formatearFecha(fecha, formato = 'corto') {
    if (!fecha) return 'Sin fecha';
    
    const fechaObj = fecha.toDate ? fecha.toDate() : new Date(fecha);
    
    switch (formato) {
      case 'corto':
        return fechaObj.toLocaleDateString('es-ES');
      case 'largo':
        return fechaObj.toLocaleDateString('es-ES', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      case 'relativo':
        return this.formatearFechaRelativa(fechaObj);
      case 'hora':
        return fechaObj.toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      default:
        return fechaObj.toLocaleDateString('es-ES');
    }
  }

  static formatearFechaRelativa(fecha) {
    const ahora = new Date();
    const diferencia = ahora - fecha;
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    
    if (dias === 0) return 'Hoy';
    if (dias === 1) return 'Ayer';
    if (dias < 7) return `Hace ${dias} días`;
    if (dias < 30) return `Hace ${Math.floor(dias / 7)} semanas`;
    if (dias < 365) return `Hace ${Math.floor(dias / 30)} meses`;
    return `Hace ${Math.floor(dias / 365)} años`;
  }

  // ===== FORMATEO DE TEXTO =====
  
  static truncarTexto(texto, longitud = 100) {
    if (!texto) return '';
    if (texto.length <= longitud) return texto;
    return texto.substring(0, longitud) + '...';
  }

  static formatearNumeroExpediente(numero) {
    if (!numero) return 'Sin número';
    
    // Formatear números largos con guiones
    if (numero.length > 10 && !numero.includes('-')) {
      return numero.replace(/(\d{5})(\d{4})(\d+)(\d{4})/, '$1-$2-$3-$4');
    }
    
    return numero;
  }

  static formatearMoneda(cantidad, moneda = 'PEN') {
    if (typeof cantidad !== 'number') return 'S/ 0.00';
    
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: moneda
    }).format(cantidad);
  }

  // ===== TRANSFORMACIONES DE DATOS =====
  
  static calcularProgreso(caso) {
    const estado = (caso.estado || '').toLowerCase();
    
    const progresos = {
      // Estados iniciales
      'postulatoria': 15,
      'postulacion': 15,
      'diligencias_preliminares': 10,
      'investigacion_preparatoria': 25,
      
      // Estados intermedios
      'contestacion': 30,
      'reconvencion': 35,
      'traslado': 40,
      'saneamiento': 45,
      'conciliacion': 50,
      'etapa_intermedia': 50,
      'audiencia_conciliacion': 55,
      'audiencia_saneamiento': 55,
      
      // Estados probatorios
      'probatoria': 65,
      'audiencia_pruebas': 70,
      'audiencia_juzgamiento': 75,
      'juzgamiento': 80,
      'alegatos': 85,
      'decisoria': 85,
      
      // Estados de resolución
      'sentencia': 90,
      'resolucion': 90,
      'mandato_ejecutivo': 90,
      
      // Estados impugnatorios
      'apelacion': 70,
      'casacion': 75,
      'queja': 65,
      'revision': 80,
      'aclaracion': 92,
      
      // Estados ejecutorios
      'ejecucion': 95,
      'liquidacion': 95,
      'embargo': 85,
      'remate': 90,
      'llevar_adelante': 85,
      'contradiccion': 80,
      
      // Estados especiales
      'medida_cautelar': 60,
      'medida_proteccion': 60,
      'terceria': 70,
      'arbitraje': 85,
      'fraccionamiento': 80,
      'via_administrativa': 20,
      'audiencia_unica': 75,
      
      // Estados finales
      'pago_satisfaccion': 100,
      'conciliado': 100,
      'desistido': 100,
      'sobreseimiento': 100,
      'inadmisible': 100,
      'improcedente': 100,
      'archivado': 100,
      'concluido': 100,
      'terminado': 100
    };
    
    return progresos[estado] || 10;
  }

  static generarResumenCaso(caso) {
    return {
      id: caso.id,
      numero: this.formatearNumeroExpediente(caso.numero),
      cliente: caso.cliente || 'Cliente no especificado',
      tipo: caso.tipo || 'civil',
      tipoFormateado: (caso.tipo || 'civil').toUpperCase(),
      estado: caso.estado || 'Activo',
      prioridad: caso.prioridad || 'media',
      progreso: this.calcularProgreso(caso),
      descripcion: this.truncarTexto(caso.descripcion, 150),
      fechaCreacion: this.formatearFecha(caso.createdAt),
      fechaActualizacion: this.formatearFecha(caso.updatedAt, 'relativo'),
      tieneAudiencia: !!caso.fechaAudiencia,
      fechaAudiencia: caso.fechaAudiencia ? this.formatearFecha(caso.fechaAudiencia) : null,
      tieneObservaciones: !!(caso.observaciones && caso.observaciones.trim()),
      observacionesCortas: this.truncarTexto(caso.observaciones, 100),
      colorTipo: this.getColorForType(caso.tipo),
      colorPrioridad: this.getPrioridadColor(caso.prioridad),
      colorEstado: this.getEstadoColor(caso.estado),
      iconoTipo: this.getIconForType(caso.tipo),
      iconoPrioridad: this.getIconForPrioridad(caso.prioridad)
    };
  }

  // ===== ESTADÍSTICAS =====
  
  static calcularEstadisticas(casos) {
    const total = casos.length;
    const activos = casos.filter(c => 
      !['archivado', 'concluido', 'terminado'].includes(c.estado?.toLowerCase())
    ).length;
    const prioritarios = casos.filter(c => c.prioridad === 'alta').length;
    const audienciasProximas = casos.filter(c => {
      if (!c.fechaAudiencia) return false;
      const fecha = new Date(c.fechaAudiencia);
      const hoy = new Date();
      const diferencia = fecha - hoy;
      return diferencia > 0 && diferencia <= (7 * 24 * 60 * 60 * 1000); // 7 días
    }).length;
    
    const porTipo = casos.reduce((acc, caso) => {
      const tipo = caso.tipo || 'sin tipo';
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {});
    
    const porEstado = casos.reduce((acc, caso) => {
      const estado = caso.estado || 'sin estado';
      acc[estado] = (acc[estado] || 0) + 1;
      return acc;
    }, {});
    
    return {
      total,
      activos,
      prioritarios,
      audienciasProximas,
      porTipo,
      porEstado,
      promedioProgreso: casos.length > 0 
        ? Math.round(casos.reduce((sum, c) => sum + this.calcularProgreso(c), 0) / casos.length)
        : 0
    };
  }

  // ===== FILTROS Y ORDENAMIENTO =====
  
  static filtrarCasos(casos, filtros) {
    return casos.filter(caso => {
      // Filtro por texto
      if (filtros.busqueda) {
        const busqueda = filtros.busqueda.toLowerCase();
        const coincide = 
          caso.numero?.toLowerCase().includes(busqueda) ||
          caso.cliente?.toLowerCase().includes(busqueda) ||
          caso.descripcion?.toLowerCase().includes(busqueda) ||
          caso.demandante?.toLowerCase().includes(busqueda) ||
          caso.demandado?.toLowerCase().includes(busqueda);
        
        if (!coincide) return false;
      }
      
      // Filtro por vista
      if (filtros.vista) {
        switch (filtros.vista) {
          case 'activos':
            return !['archivado', 'concluido', 'terminado'].includes(caso.estado?.toLowerCase());
          case 'archivados':
            return ['archivado', 'concluido', 'terminado'].includes(caso.estado?.toLowerCase());
          case 'prioritarios':
            return caso.prioridad === 'alta';
          case 'audiencias':
            return !!caso.fechaAudiencia;
          default:
            return true;
        }
      }
      
      return true;
    });
  }

  static ordenarCasos(casos, criterio = 'fechaActualizacion', direccion = 'desc') {
    return [...casos].sort((a, b) => {
      let valorA, valorB;
      
      switch (criterio) {
        case 'numero':
          valorA = a.numero || '';
          valorB = b.numero || '';
          break;
        case 'cliente':
          valorA = a.cliente || '';
          valorB = b.cliente || '';
          break;
        case 'tipo':
          valorA = a.tipo || '';
          valorB = b.tipo || '';
          break;
        case 'estado':
          valorA = a.estado || '';
          valorB = b.estado || '';
          break;
        case 'prioridad':
          const prioridades = { 'alta': 3, 'media': 2, 'baja': 1 };
          valorA = prioridades[a.prioridad] || 0;
          valorB = prioridades[b.prioridad] || 0;
          break;
        case 'fechaCreacion':
          valorA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
          valorB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
          break;
        case 'fechaActualizacion':
        default:
          valorA = a.updatedAt ? (a.updatedAt.toDate ? a.updatedAt.toDate() : new Date(a.updatedAt)) : new Date(0);
          valorB = b.updatedAt ? (b.updatedAt.toDate ? b.updatedAt.toDate() : new Date(b.updatedAt)) : new Date(0);
          break;
      }
      
      if (direccion === 'asc') {
        return valorA > valorB ? 1 : valorA < valorB ? -1 : 0;
      } else {
        return valorA < valorB ? 1 : valorA > valorB ? -1 : 0;
      }
    });
  }

  // ===== EVENTOS DEL CALENDARIO =====
  
  static getColorEvento(tipo) {
    const colores = {
      'audiencia': '#3b82f6',
      'reunion': '#10b981',
      'vencimiento': '#ef4444',
      'cita': '#f59e0b',
      'recordatorio': '#8b5cf6'
    };
    return colores[tipo] || '#6b7280';
  }

  static getIconoEvento(tipo) {
    const iconos = {
      'audiencia': '⚖️',
      'reunion': '👥',
      'vencimiento': '⏰',
      'cita': '📅',
      'recordatorio': '🔔'
    };
    return iconos[tipo] || '📋';
  }

  static formatearEventoCalendario(evento) {
    return {
      ...evento,
      fechaFormateada: this.formatearFecha(evento.fecha, 'largo'),
      horaFormateada: evento.hora || 'Sin hora',
      colorTipo: this.getColorEvento(evento.tipo),
      iconoTipo: this.getIconoEvento(evento.tipo),
      tipoFormateado: evento.tipo?.toUpperCase() || 'EVENTO',
      descripcionCorta: this.truncarTexto(evento.descripcion, 100)
    };
  }

  // ===== VALIDACIONES =====
  
  static validarCaso(caso) {
    const errores = [];
    
    if (!caso.numero || caso.numero.trim() === '') {
      errores.push('El número de expediente es requerido');
    }
    
    if (!caso.cliente || caso.cliente.trim() === '') {
      errores.push('El nombre del cliente es requerido');
    }
    
    if (!caso.tipo) {
      errores.push('El tipo de caso es requerido');
    }
    
    return {
      esValido: errores.length === 0,
      errores
    };
  }
}

export default PresentationService;