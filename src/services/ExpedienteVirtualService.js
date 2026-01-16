// ExpedienteVirtualService.js - Servicio para expediente virtual con previsualización
// Maneja la navegación, previsualización y organización de documentos

class ExpedienteVirtualService {
  // ===== TIPOS DE DOCUMENTOS =====
  
  static TIPOS_DOCUMENTO = {
    DEMANDA: 'demanda',
    CONTESTACION: 'contestacion',
    ESCRITO: 'escrito',
    RESOLUCION: 'resolucion',
    SENTENCIA: 'sentencia',
    APELACION: 'apelacion',
    PRUEBA: 'prueba',
    NOTIFICACION: 'notificacion',
    CEDULA: 'cedula',
    OFICIO: 'oficio',
    ANEXO: 'anexo',
    OTRO: 'otro'
  };

  static CATEGORIAS_DOCUMENTO = {
    INICIALES: 'Escritos Iniciales',
    PROBATORIOS: 'Medios Probatorios',
    RESOLUCIONES: 'Resoluciones Judiciales',
    NOTIFICACIONES: 'Notificaciones',
    ANEXOS: 'Anexos y Otros'
  };

  static COLORES_TIPO = {
    [this.TIPOS_DOCUMENTO.DEMANDA]: '#3b82f6',
    [this.TIPOS_DOCUMENTO.CONTESTACION]: '#10b981',
    [this.TIPOS_DOCUMENTO.ESCRITO]: '#8b5cf6',
    [this.TIPOS_DOCUMENTO.RESOLUCION]: '#f59e0b',
    [this.TIPOS_DOCUMENTO.SENTENCIA]: '#ef4444',
    [this.TIPOS_DOCUMENTO.APELACION]: '#ec4899',
    [this.TIPOS_DOCUMENTO.PRUEBA]: '#06b6d4',
    [this.TIPOS_DOCUMENTO.NOTIFICACION]: '#84cc16',
    [this.TIPOS_DOCUMENTO.CEDULA]: '#a3a3a3',
    [this.TIPOS_DOCUMENTO.OFICIO]: '#f97316',
    [this.TIPOS_DOCUMENTO.ANEXO]: '#64748b',
    [this.TIPOS_DOCUMENTO.OTRO]: '#6b7280'
  };

  static ICONOS_TIPO = {
    [this.TIPOS_DOCUMENTO.DEMANDA]: '📋',
    [this.TIPOS_DOCUMENTO.CONTESTACION]: '📝',
    [this.TIPOS_DOCUMENTO.ESCRITO]: '📄',
    [this.TIPOS_DOCUMENTO.RESOLUCION]: '⚖️',
    [this.TIPOS_DOCUMENTO.SENTENCIA]: '🏛️',
    [this.TIPOS_DOCUMENTO.APELACION]: '📈',
    [this.TIPOS_DOCUMENTO.PRUEBA]: '🔍',
    [this.TIPOS_DOCUMENTO.NOTIFICACION]: '📢',
    [this.TIPOS_DOCUMENTO.CEDULA]: '📮',
    [this.TIPOS_DOCUMENTO.OFICIO]: '📨',
    [this.TIPOS_DOCUMENTO.ANEXO]: '📎',
    [this.TIPOS_DOCUMENTO.OTRO]: '📁'
  };

  // ===== EXTENSIONES Y TIPOS DE ARCHIVO =====
  
  static EXTENSIONES_SOPORTADAS = {
    PDF: ['.pdf'],
    WORD: ['.doc', '.docx'],
    EXCEL: ['.xls', '.xlsx'],
    POWERPOINT: ['.ppt', '.pptx'],
    IMAGEN: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
    TEXTO: ['.txt', '.rtf'],
    AUDIO: ['.mp3', '.wav', '.m4a', '.ogg'],
    VIDEO: ['.mp4', '.avi', '.mov', '.wmv', '.mkv']
  };

  static ICONOS_EXTENSION = {
    '.pdf': '📕',
    '.doc': '📘',
    '.docx': '📘',
    '.xls': '📗',
    '.xlsx': '📗',
    '.ppt': '📙',
    '.pptx': '📙',
    '.txt': '📄',
    '.rtf': '📄',
    '.jpg': '🖼️',
    '.jpeg': '🖼️',
    '.png': '🖼️',
    '.gif': '🖼️',
    '.bmp': '🖼️',
    '.webp': '🖼️',
    '.mp3': '🎵',
    '.wav': '🎵',
    '.m4a': '🎵',
    '.ogg': '🎵',
    '.mp4': '🎬',
    '.avi': '🎬',
    '.mov': '🎬',
    '.wmv': '🎬',
    '.mkv': '🎬'
  };

  // ===== FUNCIONES DE UTILIDAD =====
  
  static obtenerTipoDocumento(nombre, extension) {
    const nombreLower = nombre.toLowerCase();
    
    if (nombreLower.includes('demanda')) return this.TIPOS_DOCUMENTO.DEMANDA;
    if (nombreLower.includes('contestacion') || nombreLower.includes('contestación')) return this.TIPOS_DOCUMENTO.CONTESTACION;
    if (nombreLower.includes('resolucion') || nombreLower.includes('resolución')) return this.TIPOS_DOCUMENTO.RESOLUCION;
    if (nombreLower.includes('sentencia')) return this.TIPOS_DOCUMENTO.SENTENCIA;
    if (nombreLower.includes('apelacion') || nombreLower.includes('apelación')) return this.TIPOS_DOCUMENTO.APELACION;
    if (nombreLower.includes('prueba') || nombreLower.includes('evidencia')) return this.TIPOS_DOCUMENTO.PRUEBA;
    if (nombreLower.includes('notificacion') || nombreLower.includes('notificación')) return this.TIPOS_DOCUMENTO.NOTIFICACION;
    if (nombreLower.includes('cedula') || nombreLower.includes('cédula')) return this.TIPOS_DOCUMENTO.CEDULA;
    if (nombreLower.includes('oficio')) return this.TIPOS_DOCUMENTO.OFICIO;
    if (nombreLower.includes('anexo')) return this.TIPOS_DOCUMENTO.ANEXO;
    if (nombreLower.includes('escrito')) return this.TIPOS_DOCUMENTO.ESCRITO;
    
    return this.TIPOS_DOCUMENTO.OTRO;
  }

  static obtenerColorDocumento(tipo) {
    return this.COLORES_TIPO[tipo] || this.COLORES_TIPO[this.TIPOS_DOCUMENTO.OTRO];
  }

  static obtenerIconoDocumento(tipo) {
    return this.ICONOS_TIPO[tipo] || this.ICONOS_TIPO[this.TIPOS_DOCUMENTO.OTRO];
  }

  static obtenerIconoExtension(extension) {
    return this.ICONOS_EXTENSION[extension?.toLowerCase()] || '📄';
  }

  static obtenerCategoriaDocumento(tipo) {
    switch (tipo) {
      case this.TIPOS_DOCUMENTO.DEMANDA:
      case this.TIPOS_DOCUMENTO.CONTESTACION:
      case this.TIPOS_DOCUMENTO.ESCRITO:
        return this.CATEGORIAS_DOCUMENTO.INICIALES;
      
      case this.TIPOS_DOCUMENTO.PRUEBA:
        return this.CATEGORIAS_DOCUMENTO.PROBATORIOS;
      
      case this.TIPOS_DOCUMENTO.RESOLUCION:
      case this.TIPOS_DOCUMENTO.SENTENCIA:
        return this.CATEGORIAS_DOCUMENTO.RESOLUCIONES;
      
      case this.TIPOS_DOCUMENTO.NOTIFICACION:
      case this.TIPOS_DOCUMENTO.CEDULA:
        return this.CATEGORIAS_DOCUMENTO.NOTIFICACIONES;
      
      default:
        return this.CATEGORIAS_DOCUMENTO.ANEXOS;
    }
  }

  // ===== UTILIDADES DE FECHA SEGURAS =====
  
  static crearFechaSegura(fechaRaw) {
    if (!fechaRaw) {
      return new Date();
    }
    
    try {
      // Si es un timestamp de Firebase
      if (fechaRaw.toDate && typeof fechaRaw.toDate === 'function') {
        const fecha = fechaRaw.toDate();
        return isNaN(fecha.getTime()) ? new Date() : fecha;
      }
      
      // Si es una fecha normal
      const fecha = new Date(fechaRaw);
      return isNaN(fecha.getTime()) ? new Date() : fecha;
      
    } catch (error) {
      console.warn('Error creando fecha segura:', error);
      return new Date();
    }
  }

  static crearClaveSegura(fecha) {
    try {
      // Intentar método estándar
      return fecha.toISOString().split('T')[0];
    } catch (error) {
      // Método alternativo sin toISOString()
      try {
        const año = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const dia = String(fecha.getDate()).padStart(2, '0');
        return `${año}-${mes}-${dia}`;
      } catch (error2) {
        // Último fallback
        const hoy = new Date();
        const año = hoy.getFullYear();
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        const dia = String(hoy.getDate()).padStart(2, '0');
        return `${año}-${mes}-${dia}`;
      }
    }
  }

  // ===== ORGANIZACIÓN DE DOCUMENTOS =====
  
  static organizarDocumentosPorCategoria(documentos) {
    const organizados = {};
    
    // Inicializar categorías
    Object.values(this.CATEGORIAS_DOCUMENTO).forEach(categoria => {
      organizados[categoria] = [];
    });

    // Clasificar documentos
    documentos.forEach(doc => {
      try {
        const tipo = this.obtenerTipoDocumento(doc.nombre || '', doc.extension);
        const categoria = this.obtenerCategoriaDocumento(tipo);
        
        organizados[categoria].push({
          ...doc,
          tipoDetectado: tipo,
          categoria,
          color: this.obtenerColorDocumento(tipo),
          icono: this.obtenerIconoDocumento(tipo),
          iconoExtension: this.obtenerIconoExtension(doc.extension)
        });
      } catch (error) {
        console.warn('Error clasificando documento:', doc.nombre, error);
      }
    });

    // Ordenar documentos dentro de cada categoría por fecha
    Object.keys(organizados).forEach(categoria => {
      organizados[categoria].sort((a, b) => {
        try {
          const fechaA = this.crearFechaSegura(a.fechaSubida || a.createdAt);
          const fechaB = this.crearFechaSegura(b.fechaSubida || b.createdAt);
          return fechaB - fechaA; // Orden descendente
        } catch (error) {
          console.warn('Error ordenando documentos:', error);
          return 0;
        }
      });
    });

    return organizados;
  }

  static organizarDocumentosPorFecha(documentos) {
    const organizados = {};
    
    documentos.forEach((doc) => {
      try {
        const fecha = this.crearFechaSegura(doc.fechaSubida || doc.createdAt);
        const fechaKey = this.crearClaveSegura(fecha);
        
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        if (!organizados[fechaKey]) {
          organizados[fechaKey] = {
            fecha: fechaFormateada,
            documentos: []
          };
        }
        
        const tipo = this.obtenerTipoDocumento(doc.nombre || '', doc.extension);
        organizados[fechaKey].documentos.push({
          ...doc,
          tipoDetectado: tipo,
          color: this.obtenerColorDocumento(tipo),
          icono: this.obtenerIconoDocumento(tipo),
          iconoExtension: this.obtenerIconoExtension(doc.extension)
        });
        
      } catch (error) {
        console.error('Error procesando documento:', doc.nombre, error);
      }
    });

    // Convertir a array y ordenar por fecha descendente
    return Object.entries(organizados)
      .sort(([a], [b]) => {
        try {
          return new Date(b) - new Date(a);
        } catch (error) {
          return 0;
        }
      })
      .map(([key, value]) => ({ key, ...value }));
  }

  // ===== PREVISUALIZACIÓN =====
  
  static puedePrevisualizar(extension) {
    const ext = extension?.toLowerCase();
    return this.EXTENSIONES_SOPORTADAS.PDF.includes(ext) ||
           this.EXTENSIONES_SOPORTADAS.IMAGEN.includes(ext) ||
           this.EXTENSIONES_SOPORTADAS.TEXTO.includes(ext);
  }

  static obtenerTipoPrevisualización(extension) {
    const ext = extension?.toLowerCase();
    
    if (this.EXTENSIONES_SOPORTADAS.PDF.includes(ext)) return 'pdf';
    if (this.EXTENSIONES_SOPORTADAS.IMAGEN.includes(ext)) return 'imagen';
    if (this.EXTENSIONES_SOPORTADAS.TEXTO.includes(ext)) return 'texto';
    if (this.EXTENSIONES_SOPORTADAS.WORD.includes(ext)) return 'word';
    if (this.EXTENSIONES_SOPORTADAS.EXCEL.includes(ext)) return 'excel';
    if (this.EXTENSIONES_SOPORTADAS.POWERPOINT.includes(ext)) return 'powerpoint';
    if (this.EXTENSIONES_SOPORTADAS.AUDIO.includes(ext)) return 'audio';
    if (this.EXTENSIONES_SOPORTADAS.VIDEO.includes(ext)) return 'video';
    
    return 'desconocido';
  }

  // ===== NAVEGACIÓN DE EXPEDIENTE =====
  
  static crearIndiceExpediente(documentos) {
    const organizados = this.organizarDocumentosPorCategoria(documentos);
    const indice = [];
    
    Object.entries(organizados).forEach(([categoria, docs]) => {
      if (docs.length > 0) {
        indice.push({
          categoria,
          cantidad: docs.length,
          documentos: docs.map((doc, index) => ({
            id: doc.id,
            nombre: doc.nombre,
            tipo: doc.tipoDetectado,
            posicion: index + 1,
            icono: doc.icono,
            color: doc.color
          }))
        });
      }
    });
    
    return indice;
  }

  static buscarEnDocumentos(documentos, termino) {
    if (!termino) return documentos;
    
    const terminoLower = termino.toLowerCase();
    
    return documentos.filter(doc => 
      doc.nombre?.toLowerCase().includes(terminoLower) ||
      doc.tipo?.toLowerCase().includes(terminoLower) ||
      doc.descripcion?.toLowerCase().includes(terminoLower) ||
      this.obtenerTipoDocumento(doc.nombre || '', doc.extension).includes(terminoLower)
    );
  }

  // ===== ESTADÍSTICAS =====
  
  static obtenerEstadisticasExpediente(documentos) {
    const stats = {
      total: documentos.length,
      porTipo: {},
      porCategoria: {},
      porExtension: {},
      tamaño: 0,
      ultimaActualizacion: null
    };

    documentos.forEach(doc => {
      try {
        // Por tipo
        const tipo = this.obtenerTipoDocumento(doc.nombre || '', doc.extension);
        stats.porTipo[tipo] = (stats.porTipo[tipo] || 0) + 1;
        
        // Por categoría
        const categoria = this.obtenerCategoriaDocumento(tipo);
        stats.porCategoria[categoria] = (stats.porCategoria[categoria] || 0) + 1;
        
        // Por extensión
        const ext = doc.extension?.toLowerCase() || 'sin extensión';
        stats.porExtension[ext] = (stats.porExtension[ext] || 0) + 1;
        
        // Tamaño total (si está disponible)
        if (doc.tamaño) {
          const tamaño = this.parsearTamaño(doc.tamaño);
          stats.tamaño += tamaño;
        }
        
        // Última actualización
        const fecha = this.crearFechaSegura(doc.fechaSubida || doc.createdAt);
        if (!stats.ultimaActualizacion || fecha > stats.ultimaActualizacion) {
          stats.ultimaActualizacion = fecha;
        }
      } catch (error) {
        console.warn('Error procesando estadísticas para documento:', doc.nombre, error);
      }
    });

    return stats;
  }

  static parsearTamaño(tamañoStr) {
    if (!tamañoStr) return 0;
    
    const match = tamañoStr.match(/(\d+(?:\.\d+)?)\s*(KB|MB|GB)/i);
    if (!match) return 0;
    
    const valor = parseFloat(match[1]);
    const unidad = match[2].toUpperCase();
    
    switch (unidad) {
      case 'KB': return valor * 1024;
      case 'MB': return valor * 1024 * 1024;
      case 'GB': return valor * 1024 * 1024 * 1024;
      default: return valor;
    }
  }

  static formatearTamaño(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // ===== VALIDACIONES =====
  
  static validarArchivo(archivo) {
    const errores = [];
    
    // Validar tamaño (máximo 50MB)
    const tamañoMaximo = 50 * 1024 * 1024;
    if (archivo.size > tamañoMaximo) {
      errores.push('El archivo es demasiado grande (máximo 50MB)');
    }
    
    // Validar extensión
    const extension = '.' + archivo.name.split('.').pop().toLowerCase();
    const extensionesPermitidas = Object.values(this.EXTENSIONES_SOPORTADAS).flat();
    
    if (!extensionesPermitidas.includes(extension)) {
      errores.push('Tipo de archivo no soportado');
    }
    
    // Validar nombre
    if (archivo.name.length > 255) {
      errores.push('El nombre del archivo es demasiado largo');
    }
    
    return {
      esValido: errores.length === 0,
      errores
    };
  }
}

export default ExpedienteVirtualService;