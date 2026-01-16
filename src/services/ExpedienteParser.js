// ExpedienteParser.js - Servicio especializado para parsing de expedientes
// Extraído de LeyiaService para reducir complejidad

class ExpedienteParser {
  // Configuración de campos para parsing
  static CAMPOS_PARA_SEPARAR = [
    'Expediente N°:',
    'Órgano Jurisdiccional:',
    'Distrito Judicial:',
    'Juez:',
    'Especialista Legal:',
    'Fecha de Inicio:',
    'Proceso:',
    'Observación:',
    'Especialidad:',
    'Materia(s):',
    'Estado:',
    'Etapa Procesal:',
    'Fecha Conclusión:',
    'Ubicación:',
    'Motivo Conclusión:',
    'Sumilla:',
    'PARTES PROCESALES'
  ];

  static CAMPOS_ORDENADOS = [
    'Expediente N°:',
    'Órgano Jurisdiccional:',
    'Distrito Judicial:',
    'Juez:',
    'Especialista Legal:',
    'Fecha de Inicio:',
    'Proceso:',
    'Observación:',
    'Especialidad:',
    'Materia(s):',
    'Estado:',
    'Etapa Procesal:',
    'Fecha Conclusión:',
    'Ubicación:',
    'Motivo Conclusión:',
    'Sumilla:'
  ];

  static PATRONES_NUMERO = [
    /EXPEDIENTE\s*:\s*([0-9]{5}-[0-9]{4}-[0-9]+-[0-9]{4}-[A-Z]{2}-[A-Z]{2}-[0-9]{2})/i,
    /Expediente\s*N°?\s*:\s*([0-9]{5}-[0-9]{4}-[0-9]+-[0-9]{4}-[A-Z]{2}-[A-Z]{2})/i,
    /EXP\.?\s*:\s*([0-9]{3,6}-[0-9]{4}[A-Z0-9\-]*)/i,
    /([0-9]{5}-[0-9]{4}-[0-9]+-[0-9]{4}-[A-Z]{2}-[A-Z]{2}-[0-9]{2})/,
    /([0-9]{3,5}-[0-9]{4}-[0-9]+-[0-9]{4}-[A-Z]{2}-[A-Z]{2})/,
    /EXPEDIENTE\s*:\s*([^\s\n\r,;]+)/i,
    /Expediente\s*N°?\s*:\s*([^\s\n\r,;]+)/i,
    /([0-9]{3,5}-[0-9]{4}[A-Z\-0-9]*)/i
  ];

  // Insertar saltos de línea antes de campos clave
  static insertarSaltosDeLinea(texto) {
    let textoFormateado = texto;
    
    this.CAMPOS_PARA_SEPARAR.forEach(campo => {
      const regex = new RegExp(campo.replace(/[()]/g, '\\$&'), 'g');
      textoFormateado = textoFormateado.replace(regex, '\n' + campo);
    });
    
    return textoFormateado;
  }

  // Extraer y ordenar campos
  static extraerCamposOrdenados(textoFormateado) {
    let textoOrdenado = '';
    
    this.CAMPOS_ORDENADOS.forEach(campo => {
      const regex = new RegExp(
        campo.replace(/[()]/g, '\\$&') + 
        '([^\\n]*?)(?=\\n[A-ZÁÉÍÓÚ][a-záéíóú\\s]+:|PARTES PROCESALES|$)', 
        'i'
      );
      const match = textoFormateado.match(regex);
      
      if (match && match[1]) {
        const valor = match[1].trim();
        if (valor && valor !== '' && valor !== '-------') {
          textoOrdenado += `${campo} ${valor}\n`;
        }
      }
    });
    
    return textoOrdenado;
  }

  // Agregar partes procesales
  static agregarPartesProcessales(textoFormateado, textoOrdenado) {
    const partesIndex = textoFormateado.indexOf('PARTES PROCESALES');
    if (partesIndex !== -1) {
      const partesTexto = textoFormateado.substring(partesIndex);
      return textoOrdenado + '\n' + partesTexto;
    }
    return textoOrdenado;
  }

  // Función principal para ordenar información
  static ordenarInformacionExpediente(textoOriginal) {
    const textoFormateado = this.insertarSaltosDeLinea(textoOriginal);
    const textoOrdenado = this.extraerCamposOrdenados(textoFormateado);
    return this.agregarPartesProcessales(textoFormateado, textoOrdenado);
  }

  // Extraer número de expediente
  static extraerNumeroExpediente(informacionOrdenada, informacionExpediente) {
    for (let i = 0; i < this.PATRONES_NUMERO.length; i++) {
      const patron = this.PATRONES_NUMERO[i];
      const match = informacionOrdenada.match(patron) || informacionExpediente.match(patron);
      
      if (match && match[1]) {
        const numeroExtraido = match[1].trim().replace(/[^A-Z0-9\-]/g, '');
        console.log(`✅ Número extraído con patrón ${i + 1}:`, numeroExtraido);
        return numeroExtraido;
      }
    }
    return null;
  }

  // Extraer fecha de inicio
  static extraerFechaInicio(informacionOrdenada, informacionExpediente) {
    const patronesFecha = [
      /Fecha de Inicio:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
      /FECHA DE INICIO:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
      /(\d{1,2}\/\d{1,2}\/\d{4})/g
    ];
    
    for (const patron of patronesFecha) {
      const fechaMatch = informacionOrdenada.match(patron) || informacionExpediente.match(patron);
      if (fechaMatch && fechaMatch[1]) {
        const partes = fechaMatch[1].split('/');
        if (partes.length === 3) {
          const fechaFormateada = `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
          console.log('✅ Fecha inicio extraída:', fechaFormateada);
          return fechaFormateada;
        }
      }
    }
    return null;
  }

  // Mapear estado del expediente
  static mapearEstado(informacionOrdenada, informacionExpediente) {
    const patronesEstado = [
      /Estado:\s*([^\n\r]+)/i,
      /ESTADO:\s*([^\n\r]+)/i,
      /EN PLAZO DE IMPUGNACION/i,
      /EN TRAMITE/i,
      /SENTENCIA/i,
      /EJECUCION/i
    ];
    
    for (const patron of patronesEstado) {
      const estadoMatch = informacionOrdenada.match(patron) || informacionExpediente.match(patron);
      if (estadoMatch) {
        const estado = estadoMatch[1] ? estadoMatch[1].trim().toLowerCase() : estadoMatch[0].toLowerCase();
        
        if (estado.includes('ejecucion') || estado.includes('ejecutoria')) {
          return 'ejecucion';
        } else if (estado.includes('sentencia')) {
          return 'sentencia';
        } else if (estado.includes('impugnacion')) {
          return 'impugnacion';
        } else if (estado.includes('tramite') || estado.includes('trámite')) {
          return 'probatoria';
        }
      }
    }
    
    return 'postulatoria'; // Por defecto
  }

  // Extraer partes procesales
  static extraerPartesProcessales(informacionOrdenada) {
    const partes = {};
    
    const demandanteMatch = informacionOrdenada.match(/DEMANDANTE[^D]*?([A-Z\s,]+?)(?=DEMANDADO|PERITO|$)/i);
    if (demandanteMatch) {
      partes.demandante = demandanteMatch[1].trim().replace(/\s+/g, ' ');
      console.log('✅ Demandante extraído:', partes.demandante);
    }
    
    const demandadoMatch = informacionOrdenada.match(/DEMANDADO[^D]*?([A-Z\s,]+?)(?=DEMANDANTE|PERITO|$)/i);
    if (demandadoMatch) {
      partes.demandado = demandadoMatch[1].trim().replace(/\s+/g, ' ');
      console.log('✅ Demandado extraído:', partes.demandado);
    }
    
    return partes;
  }
}

export default ExpedienteParser;