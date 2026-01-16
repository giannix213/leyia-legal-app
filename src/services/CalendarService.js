// CalendarService.js - Servicio especializado para lógica del calendario
// Centraliza colores, iconos, filtros y validaciones específicas del calendario

class CalendarService {
  // ===== TIPOS DE EVENTOS Y CONFIGURACIÓN =====
  
  static TIPOS_EVENTO = {
    AUDIENCIA: 'audiencia',
    REUNION: 'reunion', 
    VENCIMIENTO: 'vencimiento',
    CITA: 'cita',
    RECORDATORIO: 'recordatorio'
  };

  static COLORES_TIPO = {
    [this.TIPOS_EVENTO.AUDIENCIA]: '#3b82f6',
    [this.TIPOS_EVENTO.REUNION]: '#10b981',
    [this.TIPOS_EVENTO.VENCIMIENTO]: '#ef4444', 
    [this.TIPOS_EVENTO.CITA]: '#f59e0b',
    [this.TIPOS_EVENTO.RECORDATORIO]: '#8b5cf6'
  };

  // Colores para prioridades de tareas
  static COLORES_PRIORIDAD = {
    alta: '#ef4444',    // Rojo
    media: '#f59e0b',   // Naranja
    baja: '#10b981'     // Verde
  };

  static ICONOS_TIPO = {
    [this.TIPOS_EVENTO.AUDIENCIA]: '⚖️',
    [this.TIPOS_EVENTO.REUNION]: '👥',
    [this.TIPOS_EVENTO.VENCIMIENTO]: '⏰',
    [this.TIPOS_EVENTO.CITA]: '📅', 
    [this.TIPOS_EVENTO.RECORDATORIO]: '🔔'
  };

  static VISTAS_CALENDARIO = {
    MES: 'mes',
    SEMANA: 'semana', 
    AGENDA: 'agenda'
  };

  static ICONOS_VISTA = {
    [this.VISTAS_CALENDARIO.MES]: '📅',
    [this.VISTAS_CALENDARIO.SEMANA]: '📊',
    [this.VISTAS_CALENDARIO.AGENDA]: '📋'
  };

  static NOMBRES_VISTA = {
    [this.VISTAS_CALENDARIO.MES]: 'Vista Mensual',
    [this.VISTAS_CALENDARIO.SEMANA]: 'Vista Semanal',
    [this.VISTAS_CALENDARIO.AGENDA]: 'Vista Agenda'
  };

  static DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  static DIAS_SEMANA_COMPLETOS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  // ===== COLORES E ICONOS =====
  
  static getColorTipo(tipo) {
    return this.COLORES_TIPO[tipo] || '#6b7280';
  }

  static getColorPrioridad(prioridad) {
    return this.COLORES_PRIORIDAD[prioridad] || '#6b7280';
  }

  static getIconoTipo(tipo) {
    return this.ICONOS_TIPO[tipo] || '📋';
  }

  static getTiposEvento() {
    return Object.entries(this.TIPOS_EVENTO).map(([key, value]) => ({
      value,
      label: key.charAt(0) + key.slice(1).toLowerCase(),
      color: this.getColorTipo(value),
      icon: this.getIconoTipo(value)
    }));
  }

  static getVistasCalendario() {
    return Object.entries(this.VISTAS_CALENDARIO).map(([key, value]) => ({
      value,
      label: this.NOMBRES_VISTA[value],
      icon: this.ICONOS_VISTA[value]
    }));
  }

  // ===== MANEJO DE FECHAS =====
  
  static formatearFechaEvento(fecha, incluirDia = true) {
    if (!fecha) return 'Sin fecha';
    
    const fechaObj = new Date(fecha);
    const opciones = {
      day: 'numeric',
      month: 'long'
    };
    
    if (incluirDia) {
      opciones.weekday = 'long';
    }
    
    return fechaObj.toLocaleDateString('es-ES', opciones);
  }

  static formatearHoraEvento(hora) {
    if (!hora) return 'Sin hora';
    return hora;
  }

  static formatearFechaHoraCompleta(fecha, hora) {
    const fechaFormateada = this.formatearFechaEvento(fecha, true);
    const horaFormateada = this.formatearHoraEvento(hora);
    return `${fechaFormateada} a las ${horaFormateada}`;
  }

  static esMismoDia(fecha1, fecha2) {
    if (!fecha1 || !fecha2) return false;
    
    const d1 = new Date(fecha1);
    const d2 = new Date(fecha2);
    
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  static obtenerFechaString(fecha) {
    if (!fecha) return '';
    try {
      const fechaObj = new Date(fecha);
      if (isNaN(fechaObj.getTime())) {
        console.warn('Fecha inválida en obtenerFechaString:', fecha);
        return '';
      }
      return fechaObj.toISOString().split('T')[0];
    } catch (error) {
      console.warn('Error convirtiendo fecha a string:', error);
      return '';
    }
  }

  // ===== GENERACIÓN DE CALENDARIO =====
  
  static generarDiasDelMes(año, mes) {
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    
    // Obtener el día de la semana del primer día (0=domingo, 1=lunes, etc.)
    // Ajustar para que lunes sea 0
    let primerDiaSemana = primerDia.getDay();
    primerDiaSemana = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;
    
    const dias = [];
    
    // Días del mes anterior para completar la primera semana
    const mesAnterior = mes === 0 ? 11 : mes - 1;
    const añoMesAnterior = mes === 0 ? año - 1 : año;
    const diasMesAnterior = new Date(añoMesAnterior, mesAnterior + 1, 0).getDate();
    
    for (let i = primerDiaSemana - 1; i >= 0; i--) {
      dias.push({
        date: new Date(añoMesAnterior, mesAnterior, diasMesAnterior - i),
        day: diasMesAnterior - i,
        isCurrentMonth: false,
        isToday: false,
        isWeekend: false
      });
    }
    
    // Días del mes actual
    const hoy = new Date();
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fecha = new Date(año, mes, dia);
      const diaSemana = fecha.getDay();
      
      dias.push({
        date: fecha,
        day: dia,
        isCurrentMonth: true,
        isToday: this.esMismoDia(fecha, hoy),
        isWeekend: diaSemana === 0 || diaSemana === 6 // Domingo o sábado
      });
    }
    
    // Días del mes siguiente para completar la última semana
    const diasRestantes = 42 - dias.length; // 6 semanas * 7 días = 42
    const mesSiguiente = mes === 11 ? 0 : mes + 1;
    const añoMesSiguiente = mes === 11 ? año + 1 : año;
    
    for (let dia = 1; dia <= diasRestantes; dia++) {
      dias.push({
        date: new Date(añoMesSiguiente, mesSiguiente, dia),
        day: dia,
        isCurrentMonth: false,
        isToday: false,
        isWeekend: false
      });
    }
    
    return dias;
  }

  // ===== FILTRADO Y BÚSQUEDA DE EVENTOS =====
  
  static filtrarEventosPorFecha(eventos, fecha) {
    if (!eventos || !fecha) return [];
    
    return eventos.filter(evento => 
      this.esMismoDia(evento.fecha, fecha)
    );
  }

  static filtrarEventosPorRango(eventos, fechaInicio, fechaFin) {
    if (!eventos) return [];
    
    return eventos.filter(evento => {
      const fechaEvento = new Date(evento.fecha);
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      
      return fechaEvento >= inicio && fechaEvento <= fin;
    });
  }

  static filtrarEventosPorTipo(eventos, tipo) {
    if (!eventos || !tipo) return eventos;
    
    return eventos.filter(evento => evento.tipo === tipo);
  }

  static buscarEventos(eventos, termino) {
    if (!eventos || !termino) return eventos;
    
    const terminoLower = termino.toLowerCase();
    
    return eventos.filter(evento => 
      evento.titulo?.toLowerCase().includes(terminoLower) ||
      evento.descripcion?.toLowerCase().includes(terminoLower) ||
      evento.caso?.toLowerCase().includes(terminoLower) ||
      evento.lugar?.toLowerCase().includes(terminoLower) ||
      evento.juez?.toLowerCase().includes(terminoLower) ||
      evento.abogado?.toLowerCase().includes(terminoLower)
    );
  }

  static ordenarEventosPorHora(eventos) {
    return [...eventos].sort((a, b) => {
      if (!a.hora && !b.hora) return 0;
      if (!a.hora) return 1;
      if (!b.hora) return -1;
      return a.hora.localeCompare(b.hora);
    });
  }

  // ===== VALIDACIONES =====
  
  static validarEvento(evento) {
    const errores = [];
    
    if (!evento.titulo || evento.titulo.trim() === '') {
      errores.push('El título es requerido');
    }
    
    if (!evento.tipo) {
      errores.push('El tipo de evento es requerido');
    } else if (!Object.values(this.TIPOS_EVENTO).includes(evento.tipo)) {
      errores.push('Tipo de evento no válido');
    }
    
    if (!evento.fecha) {
      errores.push('La fecha es requerida');
    } else {
      const fecha = new Date(evento.fecha);
      if (isNaN(fecha.getTime())) {
        errores.push('Fecha no válida');
      }
    }
    
    if (!evento.hora) {
      errores.push('La hora es requerida');
    } else if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(evento.hora)) {
      errores.push('Formato de hora no válido (HH:MM)');
    }
    
    return {
      esValido: errores.length === 0,
      errores
    };
  }

  static validarFechaHora(fecha, hora) {
    const errores = [];
    
    if (!fecha) {
      errores.push('La fecha es requerida');
    } else {
      const fechaObj = new Date(fecha);
      if (isNaN(fechaObj.getTime())) {
        errores.push('Fecha no válida');
      }
    }
    
    if (!hora) {
      errores.push('La hora es requerida');
    } else if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(hora)) {
      errores.push('Formato de hora no válido (HH:MM)');
    }
    
    return {
      esValido: errores.length === 0,
      errores
    };
  }

  // ===== UTILIDADES =====
  
  static crearEventoVacio() {
    return {
      titulo: '',
      descripcion: '',
      tipo: this.TIPOS_EVENTO.CITA,
      fecha: this.obtenerFechaString(new Date()),
      hora: '09:00',
      caso: '',
      lugar: '',
      juez: '',
      abogado: '',
      notas: ''
    };
  }

  static generarResumenEvento(evento) {
    return {
      ...evento,
      fechaFormateada: this.formatearFechaEvento(evento.fecha),
      horaFormateada: this.formatearHoraEvento(evento.hora),
      fechaHoraCompleta: this.formatearFechaHoraCompleta(evento.fecha, evento.hora),
      colorTipo: this.getColorTipo(evento.tipo),
      iconoTipo: this.getIconoTipo(evento.tipo),
      tipoFormateado: evento.tipo?.toUpperCase() || 'EVENTO'
    };
  }

  static contarEventosPorDia(eventos) {
    const conteo = {};
    
    eventos.forEach(evento => {
      const fechaKey = this.obtenerFechaString(evento.fecha);
      conteo[fechaKey] = (conteo[fechaKey] || 0) + 1;
    });
    
    return conteo;
  }

  static obtenerEventosProximos(eventos, dias = 7) {
    const hoy = new Date();
    const fechaLimite = new Date(hoy.getTime() + (dias * 24 * 60 * 60 * 1000));
    
    return eventos
      .filter(evento => {
        const fechaEvento = new Date(evento.fecha);
        return fechaEvento >= hoy && fechaEvento <= fechaLimite;
      })
      .sort((a, b) => {
        const fechaA = new Date(a.fecha + ' ' + a.hora);
        const fechaB = new Date(b.fecha + ' ' + b.hora);
        return fechaA - fechaB;
      });
  }
}

export default CalendarService;