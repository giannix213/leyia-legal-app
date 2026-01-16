// LeyiaService.js - Servicio para toda la lógica de procesamiento de lenguaje natural
// Extraído del componente Casos para mejor organización y mantenimiento

import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

class LeyiaService {
  constructor() {
    this.casos = [];
    this.casosRef = null;
  }

  // Inicializar el servicio con referencia a los casos
  init(casos, casosRef) {
    this.casos = casos;
    this.casosRef = casosRef;
  }

  // Función para ordenar y formatear información de expediente automáticamente
  ordenarInformacionExpediente(textoOriginal) {
    // Primero, intentar separar el texto pegado insertando saltos de línea
    let textoFormateado = textoOriginal;
    
    // Insertar saltos de línea antes de campos clave
    const camposParaSeparar = [
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
    
    camposParaSeparar.forEach(campo => {
      const regex = new RegExp(campo.replace(/[()]/g, '\\$&'), 'g');
      textoFormateado = textoFormateado.replace(regex, '\n' + campo);
    });
    
    // Lista de campos en el orden que queremos procesarlos
    const camposOrdenados = [
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
    
    let textoOrdenado = '';
    
    // Extraer cada campo del texto formateado
    camposOrdenados.forEach(campo => {
      const regex = new RegExp(campo.replace(/[()]/g, '\\$&') + '([^\\n]*?)(?=\\n[A-ZÁÉÍÓÚ][a-záéíóú\\s]+:|PARTES PROCESALES|$)', 'i');
      const match = textoFormateado.match(regex);
      
      if (match && match[1]) {
        const valor = match[1].trim();
        if (valor && valor !== '' && valor !== '-------') {
          textoOrdenado += `${campo} ${valor}\n`;
        }
      }
    });
    
    // Agregar partes procesales si existen
    const partesIndex = textoFormateado.indexOf('PARTES PROCESALES');
    if (partesIndex !== -1) {
      const partesTexto = textoFormateado.substring(partesIndex);
      textoOrdenado += '\n' + partesTexto;
    }
    
    return textoOrdenado;
  }

  // Función principal para extraer datos de Leyia
  extraerDatosLeyia(informacionOrdenada, informacionExpediente) {
    const datos = {
      // Campos obligatorios con valores por defecto
      abogado: 'Por asignar',
      prioridad: 'media',
      requiereCoordinacion: false,
      requiereEscrito: false,
      requiereDiligencia: false
    };

    // Extraer número de expediente con múltiples patrones
    const numeroExtraido = this.extraerNumeroExpediente(informacionOrdenada, informacionExpediente);
    if (numeroExtraido) {
      datos.numero = numeroExtraido;
    } else {
      throw new Error('No se pudo extraer el número de expediente del texto proporcionado');
    }

    // Extraer otros campos importantes
    const campos = [
      { 
        regexes: [
          /Órgano Jurisdiccional:\s*([^\n\r]+)/i,
          /Organo Jurisdiccional:\s*([^\n\r]+)/i,
          /ÓRGANO JURISDICCIONAL:\s*([^\n\r]+)/i
        ], 
        key: 'organoJurisdiccional' 
      },
      { 
        regexes: [
          /Distrito Judicial:\s*([^\n\r]+)/i,
          /DISTRITO JUDICIAL:\s*([^\n\r]+)/i
        ], 
        key: 'distritoJudicial' 
      },
      { 
        regexes: [
          /Juez:\s*([^\n\r]+)/i,
          /JUEZ:\s*([^\n\r]+)/i
        ], 
        key: 'juez' 
      },
      { 
        regexes: [
          /Especialista Legal:\s*([^\n\r]+)/i,
          /ESPECIALISTA LEGAL:\s*([^\n\r]+)/i
        ], 
        key: 'especialistaLegal' 
      },
      { 
        regexes: [
          /Proceso:\s*([^\n\r]+)/i,
          /PROCESO:\s*([^\n\r]+)/i
        ], 
        key: 'tipoProcesoDetalle' 
      },
      { 
        regexes: [
          /Observación:\s*([^\n\r]+)/i,
          /OBSERVACIÓN:\s*([^\n\r]+)/i
        ], 
        key: 'observaciones' 
      },
      { 
        regexes: [
          /Especialidad:\s*([^\n\r]+)/i,
          /ESPECIALIDAD:\s*([^\n\r]+)/i
        ], 
        key: 'tipo' 
      },
      { 
        regexes: [
          /Materia\(s\):\s*([^\n\r]+)/i,
          /MATERIA:\s*([^\n\r]+)/i
        ], 
        key: 'descripcion' 
      },
      { 
        regexes: [
          /Ubicación:\s*([^\n\r]+)/i,
          /UBICACIÓN:\s*([^\n\r]+)/i
        ], 
        key: 'ubicacion' 
      }
    ];

    // Procesar cada campo
    campos.forEach(campo => {
      let valorEncontrado = null;
      
      for (const regex of campo.regexes) {
        const match = informacionOrdenada.match(regex) || informacionExpediente.match(regex);
        if (match && match[1] && match[1].trim()) {
          valorEncontrado = match[1].trim();
          break;
        }
      }
      
      if (valorEncontrado && valorEncontrado !== '-------' && valorEncontrado !== '') {
        if (campo.key === 'tipo') {
          valorEncontrado = valorEncontrado.toLowerCase();
        }
        datos[campo.key] = valorEncontrado;
      }
    });

    // Extraer fecha de inicio
    this.extraerFechaInicio(informacionOrdenada, informacionExpediente, datos);

    // Mapear estado
    this.mapearEstado(informacionOrdenada, informacionExpediente, datos);

    // Extraer partes procesales
    this.extraerPartesProcessales(informacionOrdenada, datos);

    return datos;
  }

  // Función para extraer número de expediente con múltiples patrones
  extraerNumeroExpediente(informacionOrdenada, informacionExpediente) {
    const patronesNumero = [
      // Formatos con etiquetas (múltiples variaciones)
      /EXPEDIENTE\s*:\s*([0-9]{5}-[0-9]{4}-[0-9]+-[0-9]{4}-[A-Z]{2}-[A-Z]{2}-[0-9]{2})/i,
      /Expediente\s*N°?\s*:\s*([0-9]{5}-[0-9]{4}-[0-9]+-[0-9]{4}-[A-Z]{2}-[A-Z]{2})/i,
      /EXP\.?\s*:\s*([0-9]{3,6}-[0-9]{4}[A-Z0-9\-]*)/i,
      // Formato sin etiqueta pero con patrón reconocible
      /([0-9]{5}-[0-9]{4}-[0-9]+-[0-9]{4}-[A-Z]{2}-[A-Z]{2}-[0-9]{2})/,
      /([0-9]{3,5}-[0-9]{4}-[0-9]+-[0-9]{4}-[A-Z]{2}-[A-Z]{2})/,
      // Formatos más flexibles
      /EXPEDIENTE\s*:\s*([^\s\n\r,;]+)/i,
      /Expediente\s*N°?\s*:\s*([^\s\n\r,;]+)/i,
      /([0-9]{3,5}-[0-9]{4}[A-Z\-0-9]*)/i
    ];

    // Probar cada patrón
    for (let i = 0; i < patronesNumero.length; i++) {
      const patron = patronesNumero[i];
      const match = informacionOrdenada.match(patron) || informacionExpediente.match(patron);
      if (match && match[1]) {
        const numeroExtraido = match[1].trim().replace(/[^A-Z0-9\-]/g, '');
        console.log(`✅ Número extraído con patrón ${i + 1}:`, numeroExtraido);
        return numeroExtraido;
      }
    }

    return null;
  }

  // Función para extraer fecha de inicio
  extraerFechaInicio(informacionOrdenada, informacionExpediente, datos) {
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
          datos.fechaInicio = `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
          console.log('✅ Fecha inicio extraída:', datos.fechaInicio);
          return;
        }
      }
    }
  }

  // Función para mapear estado
  mapearEstado(informacionOrdenada, informacionExpediente, datos) {
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
        let estado = estadoMatch[1] ? estadoMatch[1].trim().toLowerCase() : estadoMatch[0].toLowerCase();
        
        if (estado.includes('ejecucion') || estado.includes('ejecutoria')) {
          datos.estado = 'ejecucion';
        } else if (estado.includes('sentencia')) {
          datos.estado = 'sentencia';
        } else if (estado.includes('impugnacion')) {
          datos.estado = 'impugnacion';
        } else if (estado.includes('tramite') || estado.includes('trámite')) {
          datos.estado = 'probatoria';
        } else {
          datos.estado = 'postulatoria';
        }
        
        console.log('✅ Estado mapeado:', datos.estado, 'desde:', estado);
        return;
      }
    }
    
    datos.estado = 'postulatoria'; // Por defecto
  }

  // Función para extraer partes procesales
  extraerPartesProcessales(informacionOrdenada, datos) {
    const demandanteMatch = informacionOrdenada.match(/DEMANDANTE[^D]*?([A-Z\s,]+?)(?=DEMANDADO|PERITO|$)/i);
    const demandadoMatch = informacionOrdenada.match(/DEMANDADO[^D]*?([A-Z\s,]+?)(?=DEMANDANTE|PERITO|$)/i);
    
    if (demandanteMatch) {
      datos.demandante = demandanteMatch[1].trim().replace(/\s+/g, ' ');
      console.log('✅ Demandante extraído:', datos.demandante);
    }
    
    if (demandadoMatch) {
      datos.demandado = demandadoMatch[1].trim().replace(/\s+/g, ' ');
      console.log('✅ Demandado extraído:', datos.demandado);
    }
  }

  // Función principal para actualizar expediente con Leyia
  async actualizarExpedienteConLeyia(informacionExpediente, setCasos, cargarCasos) {
    try {
      console.log('🤖 Leyia procesando información del expediente...');
      
      // Verificar información básica
      if (!this.verificarInformacionBasica(informacionExpediente)) {
        throw new Error('No se encontró información de expediente válida');
      }

      // Ordenar y formatear información
      const informacionOrdenada = this.ordenarInformacionExpediente(informacionExpediente);
      
      // Extraer datos
      const datos = this.extraerDatosLeyia(informacionOrdenada, informacionExpediente);
      
      console.log('📋 RESUMEN DE DATOS EXTRAÍDOS:', datos);
      
      // Buscar si el expediente ya existe
      const expedienteExistente = this.buscarExpedienteExistente(datos.numero);
      
      if (expedienteExistente) {
        // Actualizar expediente existente
        await this.actualizarExpedienteExistente(expedienteExistente, datos, setCasos);
        return { 
          success: true, 
          numero: datos.numero,
          accion: 'actualizado',
          mensaje: `Expediente ${datos.numero} actualizado exitosamente`,
          datosActualizados: datos
        };
      } else {
        // Crear nuevo expediente
        const nuevoExpediente = await this.crearNuevoExpediente(datos, setCasos);
        return { 
          success: true, 
          numero: datos.numero,
          accion: 'creado',
          mensaje: `Expediente ${datos.numero} creado exitosamente`,
          datosActualizados: datos
        };
      }
      
    } catch (error) {
      console.error('❌ Error al procesar expediente:', error);
      return { 
        success: false, 
        error: error.message
      };
    }
  }

  // Función para verificar información básica
  verificarInformacionBasica(informacionExpediente) {
    const formatosExpediente = [
      'Expediente N°:',
      'EXPEDIENTE :',
      'Expediente:',
      'EXPEDIENTE:',
      'Exp.:',
      'EXP.:'
    ];
    
    const tieneFormatoExpediente = formatosExpediente.some(formato => 
      informacionExpediente.includes(formato)
    );
    
    const patronesJudiciales = [
      /\d{3,5}-\d{4}-\d+-\d{4}-[A-Z]{2}-[A-Z]{2}/i,
      /\d{3,6}-\d{4}[A-Z0-9\-]*/i,
      /JUEZ\s*:/i,
      /ESPECIALISTA\s*:/i,
      /DELITO\s*:/i,
      /IMPUTADO\s*:/i,
      /DEMANDANTE\s*:/i,
      /MATERIA\s*:/i
    ];
    
    const tienePatronJudicial = patronesJudiciales.some(patron => 
      patron.test(informacionExpediente)
    );
    
    return tieneFormatoExpediente || tienePatronJudicial;
  }

  // Función para buscar expediente existente
  buscarExpedienteExistente(numeroExpediente) {
    const limpiarNum = (num) => num.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    
    return this.casos.find(caso => {
      const numeroLimpio = limpiarNum(caso.numero || '');
      const numeroNuevoLimpio = limpiarNum(numeroExpediente);
      return numeroLimpio === numeroNuevoLimpio;
    });
  }

  // Función para actualizar expediente existente
  async actualizarExpedienteExistente(expedienteExistente, datos, setCasos) {
    console.log('📝 Actualizando expediente existente:', datos.numero);
    
    await updateDoc(doc(db, 'casos', expedienteExistente.id), {
      ...datos,
      updatedAt: serverTimestamp()
    });
    
    // Actualizar estado local inmediatamente
    setCasos(prevCasos => 
      prevCasos.map(caso => 
        caso.id === expedienteExistente.id 
          ? { ...caso, ...datos, updatedAt: new Date() }
          : caso
      )
    );
    
    console.log('✅ Expediente actualizado exitosamente');
  }

  // Función para crear nuevo expediente
  async crearNuevoExpediente(datos, setCasos) {
    console.log('➕ Creando nuevo expediente:', datos.numero);
    
    const docRef = await addDoc(collection(db, 'casos'), {
      ...datos,
      createdAt: serverTimestamp()
    });
    
    // Agregar al estado local inmediatamente
    const nuevoExpediente = {
      id: docRef.id,
      ...datos,
      createdAt: new Date()
    };
    
    setCasos(prevCasos => [...prevCasos, nuevoExpediente]);
    
    console.log('✅ Nuevo expediente creado con ID:', docRef.id);
    return nuevoExpediente;
  }

  // Función para procesar expediente con alerta
  async procesarExpedienteConAlerta(informacionExpediente, alertaConfig, setCasos, cargarCasos) {
    try {
      console.log('🚨 LEYIA - Procesando expediente con alerta de plazo...');
      
      // Primero procesar el expediente normalmente
      const resultado = await this.actualizarExpedienteConLeyia(informacionExpediente, setCasos, cargarCasos);
      
      if (!resultado.success) {
        return resultado;
      }
      
      // Si se especifica una alerta, agregarla al expediente
      if (alertaConfig) {
        const expedienteEncontrado = this.buscarExpedienteExistente(resultado.numero);
        
        if (expedienteEncontrado) {
          await updateDoc(doc(db, 'casos', expedienteEncontrado.id), {
            alerta: {
              descripcion: alertaConfig.descripcion || 'Plazo procesal',
              fechaInicio: alertaConfig.fechaInicio || new Date().toISOString().split('T')[0],
              diasPlazo: alertaConfig.diasPlazo || 6,
              tipo: alertaConfig.tipo || 'limite'
            },
            updatedAt: serverTimestamp()
          });
          
          // Actualizar estado local
          setCasos(prevCasos => 
            prevCasos.map(caso => 
              caso.id === expedienteEncontrado.id 
                ? { 
                    ...caso, 
                    alerta: {
                      descripcion: alertaConfig.descripcion || 'Plazo procesal',
                      fechaInicio: alertaConfig.fechaInicio || new Date().toISOString().split('T')[0],
                      diasPlazo: alertaConfig.diasPlazo || 6,
                      tipo: alertaConfig.tipo || 'limite'
                    },
                    updatedAt: new Date()
                  }
                : caso
            )
          );
          
          return {
            ...resultado,
            alertaAgregada: true,
            mensaje: `${resultado.mensaje} Alerta de ${alertaConfig.diasPlazo || 6} días agregada.`
          };
        }
      }
      
      return resultado;
      
    } catch (error) {
      console.error('❌ Error al procesar expediente con alerta:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Crear instancia singleton
const leyiaService = new LeyiaService();

export default leyiaService;