import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../firebase';
import { collection, getDocs, updateDoc, addDoc, doc, serverTimestamp } from 'firebase/firestore';
import IntentionEngine from '../services/IntentionEngine';
import ExpedienteParser from '../services/ExpedienteParser';
import LeyiaAIPro from '../services/LeyiaAIPro';
import ChatInterno from './ChatInterno';
import { useChatInterno } from '../hooks/useChatInterno';
import { useRoles } from '../hooks/useRoles';
import { useOrganizacionContext } from '../contexts/OrganizacionContext';
import './ChatIA.css';

function ChatIA({ notificacionesPendientes = 0, alertasDisponibles = [], onNotificacionesVistas }) {
  const { usuario } = useOrganizacionContext();
  const { puedeUsarLeyiaIA, puedeUsarChatInterno, obtenerNombreRol, obtenerIconoRol } = useRoles();
  const { enviarAlertaExpediente, enviarAlertaAudiencia, mensajesNoLeidos } = useChatInterno();
  
  const [mensajes, setMensajes] = useState([]);
  const [inputMensaje, setInputMensaje] = useState('');
  const [casos, setCasos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [chatAbierto, setChatAbierto] = useState(false);
  const [chatInternoAbierto, setChatInternoAbierto] = useState(false);
  const [modoActual, setModoActual] = useState('leyia'); // 'leyia' o 'chat'
  const [reconocimientoVoz, setReconocimientoVoz] = useState(null);
  const [escuchandoVoz, setEscuchandoVoz] = useState(false);
  const [soportaVoz, setSoportaVoz] = useState(false);
  const [posicionBoton, setPosicionBoton] = useState(() => {
    const posicionGuardada = localStorage.getItem('leyia-boton-posicion');
    return posicionGuardada ? JSON.parse(posicionGuardada) : { bottom: 32, right: 32 };
  });
  const [arrastrando, setArrastrando] = useState(false);
  const [offsetArrastre, setOffsetArrastre] = useState({ x: 0, y: 0 });
  const mensajesEndRef = useRef(null);
  const inicializado = useRef(false);
  
  // Función para limpiar mensajes automáticamente
  const limpiarMensajesAntiguos = useCallback(() => {
    setMensajes(prev => {
      if (prev.length > 10) { // Mantener solo los últimos 10 mensajes
        return prev.slice(-10);
      }
      return prev;
    });
  }, []);
  
  // Motor de Intenciones IA y Parser Semántico
  const [motorIntenciones] = useState(() => {
    const motor = new IntentionEngine();
    console.log('🔧 Creando motor de intenciones...');
    return motor;
  });
  const [expedienteParser] = useState(() => {
    const parser = new ExpedienteParser();
    console.log('🔧 Creando parser semántico...');
    return parser;
  });
  
  // LEYIA AI PRO - Nueva arquitectura profesional
  const [leyiaAIPro] = useState(() => {
    const aiPro = new LeyiaAIPro();
    console.log('🚀 LEYIA AI PRO inicializada');
    return aiPro;
  });
  
  // Estado para detectar conexión a internet
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Detectar cambios en la conexión a internet
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('🌐 Conexión a internet restaurada');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      console.log('❌ Sin conexión a internet');
      
      const mensajeOffline = {
        tipo: 'ia',
        texto: '🚨 **Sin conexión a internet**\n\n❌ No puedo procesar comandos sin conexión\n\n🔧 **Soluciones:**\n• Verifica tu conexión WiFi\n• Revisa tu conexión de datos\n• Intenta recargar la página\n\n💡 **Volveré a estar disponible cuando se restaure la conexión**',
        timestamp: new Date()
      };
      
      setMensajes(prev => [...prev, mensajeOffline]);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Inicializar mensaje de bienvenida una sola vez
  useEffect(() => {
    if (!inicializado.current) {
      const mensajeBienvenida = {
        tipo: 'ia',
        texto: '¡Hola! Soy Leyia, tu asistente legal inteligente.\n\n💬 **Puedes pedirme:**\n• Actualizar expedientes\n• Programar audiencias\n• Buscar casos\n• Agregar observaciones\n• Consultar información\n\n🎤 **Usa el micrófono para hablar o escribe tu consulta**\n\n¿En qué puedo ayudarte?',
        timestamp: new Date()
      };
      
      setMensajes([mensajeBienvenida]);
      inicializado.current = true;
    }
  }, []);

  // Declarar funciones antes de usarlas en useEffect
  const cargarDatos = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'casos'));
      const casosData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCasos(casosData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  }, []);

  const buscarCaso = useCallback((numeroIngresado) => {
    console.log('🔍 Buscando expediente:', numeroIngresado);
    console.log('📋 Casos disponibles:', casos.map(c => c.numero));
    
    // Búsqueda exacta primero
    let caso = casos.find(c => c.numero === numeroIngresado);
    if (caso) {
      console.log('✅ Encontrado con búsqueda exacta:', caso.numero);
      return caso;
    }
    
    // Búsqueda flexible - normalizar solo espacios y caracteres especiales mínimos
    const normalizarNumero = (num) => {
      if (!num) return '';
      return num.toString().trim().toLowerCase();
    };
    
    const numeroNormalizado = normalizarNumero(numeroIngresado);
    
    caso = casos.find(c => {
      if (!c.numero) return false;
      const casoNormalizado = normalizarNumero(c.numero);
      
      // Comparaciones flexibles
      return casoNormalizado === numeroNormalizado ||
             casoNormalizado.includes(numeroNormalizado) ||
             numeroNormalizado.includes(casoNormalizado) ||
             // Comparar sin guiones
             casoNormalizado.replace(/-/g, '') === numeroNormalizado.replace(/-/g, '') ||
             // Comparar solo los primeros números significativos
             casoNormalizado.startsWith(numeroNormalizado.substring(0, 5));
    });
    
    if (caso) {
      console.log('✅ Encontrado con búsqueda flexible:', caso.numero);
    } else {
      console.log('❌ No encontrado. Números disponibles:', casos.map(c => c.numero));
    }
    
    return caso;
  }, [casos]);

  // SISTEMA DE FUNCIONALIDADES UNIVERSALES - LEYIA FUNCIONA IGUAL EN TODAS LAS VENTANAS
  const inicializarFuncionesUniversales = useCallback(() => {
    console.log('🌐 LEYIA - Inicializando funcionalidades universales...');
    
    // Función universal para crear expedientes con parser semántico
    window.crearExpedienteConParserUniversal = async (mensaje) => {
      try {
        console.log('🧠 LEYIA Parser Semántico - Procesando expediente estructurado...');
        
        // PASO 1: Detectar si es expediente estructurado
        if (!expedienteParser.esExpedienteEstructurado(mensaje)) {
          console.log('⚠️ No es expediente estructurado, usando método básico');
          return await window.crearExpedienteNuevoUniversal(mensaje);
        }
        
        // PASO 2: Extraer datos estructurados
        const resultadoExtraccion = expedienteParser.extraerCampos(mensaje);
        
        if (!resultadoExtraccion) {
          throw new Error('No se pudo extraer información del expediente');
        }
        
        console.log('📋 Datos extraídos:', resultadoExtraccion);
        
        // PASO 3: Convertir a formato del sistema
        const datosConvertidos = expedienteParser.convertirAFormatoSistema(resultadoExtraccion);
        
        if (!datosConvertidos) {
          throw new Error('Error al convertir datos extraídos');
        }
        
        const { expediente, metadatos, partes } = datosConvertidos;
        
        // PASO 4: Verificar si ya existe el expediente
        const limpiarNum = (num) => num.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const expedienteExistente = casos.find(caso => 
          limpiarNum(caso.numero || '') === limpiarNum(expediente.numero)
        );
        
        // PASO 5: Crear o actualizar en Firebase
        expediente.createdAt = serverTimestamp();
        expediente.updatedAt = serverTimestamp();
        
        let docRef, accion;
        
        if (expedienteExistente) {
          // Actualizar existente
          await updateDoc(doc(db, 'casos', expedienteExistente.id), expediente);
          docRef = { id: expedienteExistente.id };
          accion = 'actualizado';
          console.log('✅ Expediente actualizado:', expediente.numero);
        } else {
          // Crear nuevo
          docRef = await addDoc(collection(db, 'casos'), expediente);
          accion = 'creado';
          console.log('✅ Expediente creado:', expediente.numero);
        }
        
        // PASO 6: Actualizar estado local y forzar recarga
        const expedienteCompleto = {
          id: docRef.id,
          ...expediente,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        if (expedienteExistente) {
          setCasos(prevCasos => 
            prevCasos.map(caso => 
              caso.id === expedienteExistente.id ? expedienteCompleto : caso
            )
          );
        } else {
          setCasos(prevCasos => [...prevCasos, expedienteCompleto]);
        }
        
        // PASO 7: Forzar actualización de la ventana de Casos
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('expedienteCreado', {
            detail: {
              expediente: expedienteCompleto,
              accion: accion
            }
          }));
        }, 100);
        
        return {
          success: true,
          numero: expediente.numero,
          accion,
          metadatos,
          partes,
          confianza: metadatos.confianza
        };
        
      } catch (error) {
        console.error('❌ Error en parser semántico:', error);
        return {
          success: false,
          error: error.message
        };
      }
    };
    
    // Función universal para crear expedientes desde cero
    window.crearExpedienteNuevoUniversal = async (informacionBasica) => {
      try {
        console.log('🤖 LEYIA UNIVERSAL - Creando nuevo expediente...');
        
        // Generar número de expediente temporal si no se proporciona
        let numeroExpediente = null;
        
        // Buscar si ya se proporcionó un número
        const patronesNumero = [
          /expediente\s+(\d+[-\w]*)/i,
          /caso\s+(\d+[-\w]*)/i,
          /(\d{3,5}-\d{4}[-\w]*)/i,
          /(\d{3,6})/
        ];
        
        for (const patron of patronesNumero) {
          const match = informacionBasica.match(patron);
          if (match && match[1]) {
            numeroExpediente = match[1];
            break;
          }
        }
        
        // Si no hay número, generar uno temporal
        if (!numeroExpediente) {
          const fecha = new Date();
          const año = fecha.getFullYear();
          const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
          const dia = fecha.getDate().toString().padStart(2, '0');
          const hora = fecha.getHours().toString().padStart(2, '0');
          const minuto = fecha.getMinutes().toString().padStart(2, '0');
          numeroExpediente = `TEMP-${año}${mes}${dia}-${hora}${minuto}`;
        }
        
        // Extraer información básica del mensaje
        const extraerNombre = (texto) => {
          const patrones = [
            /para\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)/i,
            /cliente\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)/i,
            /([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)/
          ];
          
          for (const patron of patrones) {
            const match = texto.match(patron);
            if (match && match[1]) {
              return match[1].trim();
            }
          }
          return 'Cliente por asignar';
        };
        
        const extraerTipo = (texto) => {
          const tipos = {
            'civil': ['civil', 'divorcio', 'matrimonio', 'herencia', 'sucesion'],
            'penal': ['penal', 'delito', 'robo', 'hurto', 'estafa', 'homicidio'],
            'laboral': ['laboral', 'trabajo', 'despido', 'sueldo', 'salario'],
            'familia': ['familia', 'alimentos', 'custodia', 'patria potestad'],
            'comercial': ['comercial', 'empresa', 'contrato', 'sociedad']
          };
          
          const textoLower = texto.toLowerCase();
          for (const [tipo, palabras] of Object.entries(tipos)) {
            if (palabras.some(palabra => textoLower.includes(palabra))) {
              return tipo;
            }
          }
          return 'civil'; // Por defecto
        };
        
        const extraerDescripcion = (texto) => {
          const patrones = [
            /caso\s+de\s+([^,\n]+)/i,
            /materia\s+([^,\n]+)/i,
            /sobre\s+([^,\n]+)/i
          ];
          
          for (const patron of patrones) {
            const match = texto.match(patron);
            if (match && match[1]) {
              return match[1].trim();
            }
          }
          return 'Caso por especificar';
        };
        
        const cliente = extraerNombre(informacionBasica);
        const tipo = extraerTipo(informacionBasica);
        const descripcion = extraerDescripcion(informacionBasica);
        
        // Crear datos del expediente
        const datosExpediente = {
          numero: numeroExpediente,
          tipo: tipo,
          cliente: cliente,
          descripcion: descripcion,
          estado: 'postulatoria',
          prioridad: 'media',
          juez: 'Por asignar',
          especialistaLegal: 'Por asignar',
          organoJurisdiccional: 'Por asignar',
          distritoJudicial: 'Por asignar',
          fechaInicio: new Date().toISOString().split('T')[0],
          demandante: cliente,
          demandado: 'Por asignar',
          abogado: 'Por asignar',
          observaciones: `Expediente creado por LEYIA IA - ${new Date().toLocaleDateString('es-PE')} - Creación automática desde chat inteligente`,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        // Crear en Firebase
        const docRef = await addDoc(collection(db, 'casos'), datosExpediente);
        console.log('✅ Expediente creado:', numeroExpediente);
        
        // Actualizar estado local y forzar recarga
        const nuevoExpediente = {
          id: docRef.id,
          ...datosExpediente,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setCasos(prevCasos => [...prevCasos, nuevoExpediente]);
        
        // Forzar actualización de la ventana de Casos
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('expedienteCreado', {
            detail: {
              expediente: nuevoExpediente,
              accion: 'creado'
            }
          }));
        }, 100);
        
        return {
          success: true,
          numero: numeroExpediente,
          accion: 'creado',
          cliente: cliente,
          tipo: tipo
        };
        
      } catch (error) {
        console.error('❌ Error al crear expediente:', error);
        return {
          success: false,
          error: error.message
        };
      }
    };
    
    // Función universal para actualizar expedientes (independiente de la sección Casos)
    window.actualizarExpedienteConLeyiaUniversal = async (informacionExpediente) => {
      try {
        console.log('🤖 LEYIA UNIVERSAL - Procesando expediente...');
        
        // VERIFICACIÓN INTELIGENTE DE INFORMACIÓN BÁSICA
        const formatosExpediente = [
          'Expediente N°:', 'EXPEDIENTE :', 'Expediente:', 'EXPEDIENTE:',
          'Exp.:', 'EXP.:', 'Expediente Nº:', 'EXPEDIENTE Nº:'
        ];
        
        const tieneFormatoExpediente = formatosExpediente.some(formato => 
          informacionExpediente.includes(formato)
        );
        
        const patronesJudiciales = [
          /\d{3,5}-\d{4}-\d+-\d{4}-[A-Z]{2}-[A-Z]{2}/i,
          /JUEZ\s*:/i, /ESPECIALISTA\s*:/i, /DELITO\s*:/i,
          /IMPUTADO\s*:/i, /DEMANDANTE\s*:/i, /MATERIA\s*:/i
        ];
        
        const tienePatronJudicial = patronesJudiciales.some(patron => 
          patron.test(informacionExpediente)
        );
        
        if (!tieneFormatoExpediente && !tienePatronJudicial) {
          throw new Error('No se encontró información de expediente válida');
        }
        
        // EXTRACCIÓN DE NÚMERO DE EXPEDIENTE
        const patronesNumero = [
          /EXPEDIENTE\s*:\s*([0-9]{5}-[0-9]{4}-[0-9]+-[0-9]{4}-[A-Z]{2}-[A-Z]{2}-[0-9]{2})/i,
          /EXPEDIENTE\s*:\s*([0-9]{5}-[0-9]{4}-[0-9]+-[0-9]{4}-[A-Z]{2}-[A-Z]{2})/i,
          /Expediente\s*N°?\s*:\s*([0-9]{5}-[0-9]{4}-[0-9]+-[0-9]{4}-[A-Z]{2}-[A-Z]{2}-[0-9]{2})/i,
          /([0-9]{5}-[0-9]{4}-[0-9]+-[0-9]{4}-[A-Z]{2}-[A-Z]{2}-[0-9]{2})/,
          /([0-9]{3,5}-[0-9]{4}-[0-9]+-[0-9]{4}[A-Z\-0-9]*)/i
        ];
        
        let numeroExtraido = null;
        for (const patron of patronesNumero) {
          const match = informacionExpediente.match(patron);
          if (match && match[1]) {
            numeroExtraido = match[1].trim();
            break;
          }
        }
        
        if (!numeroExtraido) {
          throw new Error('No se pudo extraer el número de expediente');
        }
        
        // BUSCAR O CREAR EXPEDIENTE
        const limpiarNum = (num) => num.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        let expedienteExistente = casos.find(caso => 
          limpiarNum(caso.numero || '') === limpiarNum(numeroExtraido)
        );
        
        // EXTRAER INFORMACIÓN COMPLETA - MEJORADO
        const extraerCampo = (texto, patrones) => {
          for (const patron of patrones) {
            const match = texto.match(patron);
            if (match && match[1]) {
              const valor = match[1].trim();
              // Filtrar valores vacíos o placeholders
              if (valor && valor !== '----' && valor !== '-------' && valor !== 'Por asignar') {
                return valor;
              }
            }
          }
          return null;
        };
        
        // Extraer todos los campos disponibles
        const juez = extraerCampo(informacionExpediente, [
          /JUEZ\s*:\s*([^\n\r]+)/i,
          /Juez\s*:\s*([^\n\r]+)/i
        ]);
        
        const especialista = extraerCampo(informacionExpediente, [
          /ESPECIALISTA LEGAL\s*:\s*([^\n\r]+)/i,
          /Especialista Legal\s*:\s*([^\n\r]+)/i,
          /ESPECIALISTA\s*:\s*([^\n\r]+)/i,
          /Especialista\s*:\s*([^\n\r]+)/i
        ]);
        
        const organo = extraerCampo(informacionExpediente, [
          /ÓRGANO JURISDICCIONAL\s*:\s*([^\n\r]+)/i,
          /Órgano Jurisdiccional\s*:\s*([^\n\r]+)/i,
          /(\d+°?\s*JUZ[^\n\r]*)/i
        ]);
        
        const distritoJudicial = extraerCampo(informacionExpediente, [
          /DISTRITO JUDICIAL\s*:\s*([^\n\r]+)/i,
          /Distrito Judicial\s*:\s*([^\n\r]+)/i
        ]);
        
        const fechaInicio = extraerCampo(informacionExpediente, [
          /FECHA DE INICIO\s*:\s*([^\n\r]+)/i,
          /Fecha de Inicio\s*:\s*([^\n\r]+)/i
        ]);
        
        const proceso = extraerCampo(informacionExpediente, [
          /PROCESO\s*:\s*([^\n\r]+)/i,
          /Proceso\s*:\s*([^\n\r]+)/i
        ]);
        
        const especialidad = extraerCampo(informacionExpediente, [
          /ESPECIALIDAD\s*:\s*([^\n\r]+)/i,
          /Especialidad\s*:\s*([^\n\r]+)/i
        ]);
        
        const materia = extraerCampo(informacionExpediente, [
          /MATERIA\(S\)\s*:\s*([^\n\r]+)/i,
          /Materia\(s\)\s*:\s*([^\n\r]+)/i,
          /MATERIA\s*:\s*([^\n\r]+)/i,
          /Materia\s*:\s*([^\n\r]+)/i
        ]);
        
        const estadoProceso = extraerCampo(informacionExpediente, [
          /ESTADO\s*:\s*([^\n\r]+)/i,
          /Estado\s*:\s*([^\n\r]+)/i
        ]);
        
        const etapaProcesal = extraerCampo(informacionExpediente, [
          /ETAPA PROCESAL\s*:\s*([^\n\r]+)/i,
          /Etapa Procesal\s*:\s*([^\n\r]+)/i
        ]);
        
        const fechaConclusion = extraerCampo(informacionExpediente, [
          /FECHA CONCLUSIÓN\s*:\s*([^\n\r]+)/i,
          /Fecha Conclusión\s*:\s*([^\n\r]+)/i
        ]);
        
        const ubicacion = extraerCampo(informacionExpediente, [
          /UBICACIÓN\s*:\s*([^\n\r]+)/i,
          /Ubicación\s*:\s*([^\n\r]+)/i
        ]);
        
        const motivoConclusion = extraerCampo(informacionExpediente, [
          /MOTIVO CONCLUSIÓN\s*:\s*([^\n\r]+)/i,
          /Motivo Conclusión\s*:\s*([^\n\r]+)/i
        ]);
        
        const sumilla = extraerCampo(informacionExpediente, [
          /SUMILLA\s*:\s*([^\n\r]+)/i,
          /Sumilla\s*:\s*([^\n\r]+)/i
        ]);
        
        // Extraer partes procesales
        let demandante = null;
        let demandado = null;
        
        const partesMatch = informacionExpediente.match(/PARTES PROCESALES([\s\S]*)/i);
        if (partesMatch) {
          const partesTexto = partesMatch[1];
          
          // Buscar demandante
          const demandanteMatch = partesTexto.match(/DEMANDANTE[^\n]*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+)/i);
          if (demandanteMatch) {
            demandante = demandanteMatch[1].trim();
          }
          
          // Buscar demandado
          const demandadoMatch = partesTexto.match(/DEMANDADO[^\n]*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+)/i);
          if (demandadoMatch) {
            demandado = demandadoMatch[1].trim();
          }
        }
        
        // Determinar tipo de proceso basado en especialidad
        let tipo = 'civil';
        if (especialidad) {
          const esp = especialidad.toLowerCase();
          if (esp.includes('penal')) tipo = 'penal';
          else if (esp.includes('laboral')) tipo = 'laboral';
          else if (esp.includes('familia')) tipo = 'familia';
          else if (esp.includes('comercial')) tipo = 'comercial';
          else if (esp.includes('contencioso')) tipo = 'contencioso administrativo';
          else if (esp.includes('civil')) tipo = 'civil';
        }
        
        // Convertir fecha de inicio al formato correcto
        let fechaInicioFormateada = null;
        if (fechaInicio) {
          const fechaMatch = fechaInicio.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
          if (fechaMatch) {
            const [, dia, mes, año] = fechaMatch;
            fechaInicioFormateada = `${año}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
          }
        }
        
        // Mapear estado procesal
        let estadoMapeado = 'postulatoria';
        if (estadoProceso) {
          const estado = estadoProceso.toLowerCase();
          if (estado.includes('resuelto') || estado.includes('atendido')) {
            estadoMapeado = 'archivado';
          } else if (estado.includes('tramite') || estado.includes('proceso')) {
            estadoMapeado = 'probatoria';
          }
        }
        
        // CONSTRUIR DATOS DEL EXPEDIENTE CON CAMPOS ESPECÍFICOS
        const datosExpediente = {
          numero: numeroExtraido,
          tipo: tipo,
          updatedAt: serverTimestamp()
        };

        // ASIGNAR CAMPOS ESPECÍFICOS SOLO SI HAY VALORES NUEVOS
        if (juez) datosExpediente.juez = juez;
        if (especialista) datosExpediente.especialistaLegal = especialista;
        if (organo) datosExpediente.organoJurisdiccional = organo;
        if (distritoJudicial) datosExpediente.distritoJudicial = distritoJudicial;
        if (fechaInicioFormateada) datosExpediente.fechaInicio = fechaInicioFormateada;
        if (proceso) datosExpediente.tipoProcesoDetalle = proceso;
        if (materia) datosExpediente.descripcion = materia;
        if (estadoMapeado) datosExpediente.estado = estadoMapeado;
        if (estadoProceso) datosExpediente.estadoActual = estadoProceso;
        if (fechaConclusion) datosExpediente.fechaConclusion = fechaConclusion;
        if (ubicacion) datosExpediente.ubicacion = ubicacion;
        if (motivoConclusion) datosExpediente.motivoConclusion = motivoConclusion;
        if (demandante) datosExpediente.demandante = demandante;
        if (demandado) datosExpediente.demandado = demandado;

        // MANTENER CAMPOS EXISTENTES SI NO HAY NUEVOS VALORES
        if (expedienteExistente) {
          if (!datosExpediente.juez) datosExpediente.juez = expedienteExistente.juez || 'Por asignar';
          if (!datosExpediente.especialistaLegal) datosExpediente.especialistaLegal = expedienteExistente.especialistaLegal || 'Por asignar';
          if (!datosExpediente.organoJurisdiccional) datosExpediente.organoJurisdiccional = expedienteExistente.organoJurisdiccional || 'Por asignar';
          if (!datosExpediente.distritoJudicial) datosExpediente.distritoJudicial = expedienteExistente.distritoJudicial || 'Por asignar';
          if (!datosExpediente.fechaInicio) datosExpediente.fechaInicio = expedienteExistente.fechaInicio || '';
          if (!datosExpediente.tipoProcesoDetalle) datosExpediente.tipoProcesoDetalle = expedienteExistente.tipoProcesoDetalle || '';
          if (!datosExpediente.descripcion) datosExpediente.descripcion = expedienteExistente.descripcion || 'Por especificar';
          if (!datosExpediente.estadoActual) datosExpediente.estadoActual = expedienteExistente.estadoActual || '';
          if (!datosExpediente.fechaConclusion) datosExpediente.fechaConclusion = expedienteExistente.fechaConclusion || '';
          if (!datosExpediente.ubicacion) datosExpediente.ubicacion = expedienteExistente.ubicacion || '';
          if (!datosExpediente.motivoConclusion) datosExpediente.motivoConclusion = expedienteExistente.motivoConclusion || '';
          if (!datosExpediente.demandante) datosExpediente.demandante = expedienteExistente.demandante || 'Por asignar';
          if (!datosExpediente.demandado) datosExpediente.demandado = expedienteExistente.demandado || 'Por asignar';
          
          // MANTENER CAMPOS ADMINISTRATIVOS
          datosExpediente.prioridad = expedienteExistente.prioridad || 'media';
          datosExpediente.cliente = expedienteExistente.cliente || 'Por asignar';
          datosExpediente.abogado = expedienteExistente.abogado || 'Por asignar';
        } else {
          // VALORES POR DEFECTO PARA EXPEDIENTE NUEVO
          if (!datosExpediente.juez) datosExpediente.juez = 'Por asignar';
          if (!datosExpediente.especialistaLegal) datosExpediente.especialistaLegal = 'Por asignar';
          if (!datosExpediente.organoJurisdiccional) datosExpediente.organoJurisdiccional = 'Por asignar';
          if (!datosExpediente.distritoJudicial) datosExpediente.distritoJudicial = 'Por asignar';
          if (!datosExpediente.fechaInicio) datosExpediente.fechaInicio = '';
          if (!datosExpediente.tipoProcesoDetalle) datosExpediente.tipoProcesoDetalle = '';
          if (!datosExpediente.descripcion) datosExpediente.descripcion = 'Por especificar';
          if (!datosExpediente.estadoActual) datosExpediente.estadoActual = '';
          if (!datosExpediente.fechaConclusion) datosExpediente.fechaConclusion = '';
          if (!datosExpediente.ubicacion) datosExpediente.ubicacion = '';
          if (!datosExpediente.motivoConclusion) datosExpediente.motivoConclusion = '';
          if (!datosExpediente.demandante) datosExpediente.demandante = 'Por asignar';
          if (!datosExpediente.demandado) datosExpediente.demandado = 'Por asignar';
          
          datosExpediente.prioridad = 'media';
          datosExpediente.cliente = 'Por asignar';
          datosExpediente.abogado = 'Por asignar';
        }

        // ACTUALIZAR OBSERVACIONES SOLO CON REGISTRO DE LA ACTUALIZACIÓN
        const fechaActualizacion = new Date().toLocaleDateString('es-PE');
        let nuevasObservaciones = expedienteExistente?.observaciones || '';
        
        // Agregar solo un registro de la actualización, no toda la información
        const registroActualizacion = `\n\nActualización LEYIA - ${fechaActualizacion} - Información judicial procesada automáticamente`;
        if (sumilla) {
          nuevasObservaciones += `${registroActualizacion}\nSumilla: ${sumilla}`;
        } else {
          nuevasObservaciones += registroActualizacion;
        }
        
        datosExpediente.observaciones = nuevasObservaciones.trim();
        
        // GENERAR REPORTE DE CAMBIOS
        const generarReporteCambios = (datosNuevos, datosAnteriores = null) => {
          const cambios = [];
          const camposImportantes = {
            juez: 'Juez',
            especialistaLegal: 'Especialista Legal',
            organoJurisdiccional: 'Órgano Jurisdiccional',
            distritoJudicial: 'Distrito Judicial',
            demandante: 'Demandante',
            demandado: 'Demandado',
            descripcion: 'Materia',
            fechaInicio: 'Fecha de Inicio',
            estadoActual: 'Estado',
            ubicacion: 'Ubicación',
            tipoProcesoDetalle: 'Tipo de Proceso'
          };
          
          Object.keys(camposImportantes).forEach(campo => {
            const valorNuevo = datosNuevos[campo];
            const valorAnterior = datosAnteriores ? datosAnteriores[campo] : null;
            
            // Solo reportar si hay valor nuevo válido y es diferente al anterior
            if (valorNuevo && 
                valorNuevo !== 'Por asignar' && 
                valorNuevo !== 'Por especificar' && 
                valorNuevo !== '' &&
                valorNuevo !== valorAnterior) {
              cambios.push(`• ${camposImportantes[campo]}: ${valorNuevo}`);
            }
          });
          
          return cambios;
        };

        if (expedienteExistente) {
          // ACTUALIZAR EXPEDIENTE EXISTENTE
          const cambiosRealizados = generarReporteCambios(datosExpediente, expedienteExistente);
          
          console.log('📝 ACTUALIZANDO EXPEDIENTE EXISTENTE:');
          console.log('- ID:', expedienteExistente.id);
          console.log('- Datos anteriores:', expedienteExistente);
          console.log('- Datos nuevos:', datosExpediente);
          console.log('- Cambios detectados:', cambiosRealizados);
          
          await updateDoc(doc(db, 'casos', expedienteExistente.id), datosExpediente);
          console.log('✅ Expediente actualizado en Firebase:', numeroExtraido);
          
          // Actualizar estado local
          const expedienteActualizado = { ...expedienteExistente, ...datosExpediente, updatedAt: new Date() };
          setCasos(prevCasos => 
            prevCasos.map(caso => 
              caso.id === expedienteExistente.id 
                ? expedienteActualizado
                : caso
            )
          );
          
          console.log('✅ Estado local actualizado');
          
          // Disparar evento para actualizar modal si está abierto
          setTimeout(() => {
            console.log('📡 Disparando evento de actualización para modal');
            window.dispatchEvent(new CustomEvent('expedienteActualizado', {
              detail: {
                expediente: expedienteActualizado,
                accion: 'actualizado'
              }
            }));
          }, 100);
          
          return {
            success: true,
            numero: numeroExtraido,
            accion: 'actualizado',
            cambios: cambiosRealizados
          };
        } else {
          // CREAR NUEVO EXPEDIENTE
          const camposCreados = generarReporteCambios(datosExpediente);
          
          datosExpediente.createdAt = serverTimestamp();
          const docRef = await addDoc(collection(db, 'casos'), datosExpediente);
          console.log('✅ Expediente creado:', numeroExtraido);
          
          // Actualizar estado local y forzar recarga
          const nuevoExpediente = {
            id: docRef.id,
            ...datosExpediente,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          setCasos(prevCasos => [...prevCasos, nuevoExpediente]);
          
          // Forzar actualización de la ventana de Casos
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('expedienteCreado', {
              detail: {
                expediente: nuevoExpediente,
                accion: 'creado'
              }
            }));
          }, 100);
          
          return {
            success: true,
            numero: numeroExtraido,
            accion: 'creado',
            cambios: camposCreados
          };
        }
        
      } catch (error) {
        console.error('❌ Error en función universal:', error);
        return {
          success: false,
          error: error.message
        };
      }
    };
    
    // Función universal para programar audiencias
    window.programarAudienciaUniversal = async (numeroExpediente, fechaISO, horaCompleta, fechaFormateada, horaFormateada) => {
      try {
        console.log('🔍 Buscando expediente para audiencia:', numeroExpediente);
        
        // Usar la función buscarCaso que ya tiene la lógica mejorada
        let caso = null;
        
        // Buscar usando la función optimizada
        const buscarCasoLocal = (numeroIngresado) => {
          // Búsqueda exacta primero
          let casoEncontrado = casos.find(c => c.numero === numeroIngresado);
          if (casoEncontrado) return casoEncontrado;
          
          // Búsqueda flexible
          const normalizarNumero = (num) => {
            if (!num) return '';
            return num.toString().trim().toLowerCase();
          };
          
          const numeroNormalizado = normalizarNumero(numeroIngresado);
          
          casoEncontrado = casos.find(c => {
            if (!c.numero) return false;
            const casoNormalizado = normalizarNumero(c.numero);
            
            return casoNormalizado === numeroNormalizado ||
                   casoNormalizado.includes(numeroNormalizado) ||
                   numeroNormalizado.includes(casoNormalizado) ||
                   casoNormalizado.replace(/-/g, '') === numeroNormalizado.replace(/-/g, '');
          });
          
          return casoEncontrado;
        };
        
        caso = buscarCasoLocal(numeroExpediente);
        
        if (!caso) {
          console.log('❌ Expediente no encontrado:', numeroExpediente);
          console.log('📋 Expedientes disponibles:', casos.map(c => c.numero));
          throw new Error(`No se encontró el expediente ${numeroExpediente}. Verifica que el número sea correcto.`);
        }
        
        console.log('✅ Expediente encontrado:', caso.numero);
        
        // Actualizar la audiencia en el expediente existente
        await updateDoc(doc(db, 'casos', caso.id), {
          fechaAudiencia: fechaISO,
          horaAudiencia: horaCompleta,
          updatedAt: serverTimestamp()
        });
        
        const fechaHoy = new Date().toLocaleDateString('es-PE');
        const observacionAudiencia = `Audiencia Programada - ${numeroExpediente} - ${fechaHoy} - Audiencia programada para ${fechaFormateada} a las ${horaFormateada}`;
        
        await updateDoc(doc(db, 'casos', caso.id), {
          observaciones: (caso.observaciones || '') + '\n\n' + observacionAudiencia,
          updatedAt: serverTimestamp()
        });
        
        // Actualizar estado local
        setCasos(prevCasos => 
          prevCasos.map(c => 
            c.id === caso.id 
              ? { ...c, fechaAudiencia: fechaISO, horaAudiencia: horaCompleta, updatedAt: new Date() }
              : c
          )
        );
        
        // Notificar a otros componentes que se actualizó una audiencia
        window.dispatchEvent(new CustomEvent('audienciaActualizada', {
          detail: {
            expediente: numeroExpediente,
            fecha: fechaISO,
            hora: horaCompleta,
            caso: caso
          }
        }));
        
        console.log('✅ Audiencia programada y evento disparado para actualizar calendario');
        
        // Enviar notificación al chat interno
        if (window.notificarAudienciaProgramada) {
          await window.notificarAudienciaProgramada(numeroExpediente, fechaFormateada, horaFormateada);
        }
        
        return { success: true };
      } catch (error) {
        console.error('❌ Error al programar audiencia:', error);
        return { success: false, error: error.message };
      }
    };
    
    // Función universal para agregar observaciones
    window.agregarObservacionUniversal = async (numeroExpediente, textoObservacion) => {
      try {
        const limpiarNum = (num) => num.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const caso = casos.find(c => limpiarNum(c.numero || '') === limpiarNum(numeroExpediente));
        
        if (!caso) {
          throw new Error(`No se encontró el expediente ${numeroExpediente}`);
        }
        
        const fechaHoy = new Date().toLocaleDateString('es-PE');
        const nuevaObservacion = `Observación - ${numeroExpediente} - ${fechaHoy} - ${textoObservacion}`;
        
        await updateDoc(doc(db, 'casos', caso.id), {
          observaciones: (caso.observaciones || '') + '\n\n' + nuevaObservacion,
          updatedAt: serverTimestamp()
        });
        
        // Actualizar estado local
        setCasos(prevCasos => 
          prevCasos.map(c => 
            c.id === caso.id 
              ? { ...c, observaciones: (c.observaciones || '') + '\n\n' + nuevaObservacion, updatedAt: new Date() }
              : c
          )
        );
        
        return { success: true };
      } catch (error) {
        console.error('❌ Error al agregar observación:', error);
        return { success: false, error: error.message };
      }
    };
    
    // Integración con Chat Interno - LeyIA puede enviar alertas automáticamente
    window.enviarAlertaLeyiaAlChat = async (tipo, mensaje, metadata = null) => {
      try {
        if (enviarAlertaExpediente && typeof enviarAlertaExpediente === 'function') {
          await enviarAlertaExpediente('SISTEMA', tipo, mensaje);
          console.log('✅ Alerta enviada al chat interno:', tipo);
        }
      } catch (error) {
        console.error('❌ Error enviando alerta al chat:', error);
      }
    };
    
    // Función para notificar audiencias programadas
    window.notificarAudienciaProgramada = async (numeroExpediente, fecha, hora) => {
      try {
        if (enviarAlertaAudiencia && typeof enviarAlertaAudiencia === 'function') {
          await enviarAlertaAudiencia(numeroExpediente, fecha, hora);
          console.log('✅ Audiencia notificada al chat interno');
        }
      } catch (error) {
        console.error('❌ Error notificando audiencia:', error);
      }
    };
    
    console.log('✅ LEYIA UNIVERSAL - Todas las funcionalidades están disponibles en cualquier ventana');
    console.log('💬 CHAT INTERNO - Integración con alertas automáticas activada');
  }, [casos]); // Dependencia de casos para que se actualice cuando cambien

  // useEffect para inicializar todo después de que las funciones estén definidas
  useEffect(() => {
    cargarDatos();
    // NO inicializar reconocimiento de voz automáticamente - solo cuando el usuario lo solicite
    verificarSoporteVoz();
    // Mover inicializarFuncionesUniversales aquí para asegurar que se ejecute
    if (casos.length >= 0) { // Permitir que se ejecute siempre
      inicializarFuncionesUniversales();
    }
  }, [cargarDatos, inicializarFuncionesUniversales, casos.length]); // Agregar casos.length como dependencia

  // Integrar funciones de procesamiento con el motor de intenciones
  useEffect(() => {
    console.log('🔧 useEffect de configuración ejecutándose...');
    console.log('📊 Estado actual:', { 
      casosLength: casos.length, 
      motorIntenciones: !!motorIntenciones, 
      expedienteParser: !!expedienteParser 
    });
    
    if (motorIntenciones && expedienteParser) { // Simplificar condición
      console.log('🔧 Configurando motor de intenciones con parser semántico...');
      
      // CONFIGURAR FUNCIONES DE PROCESAMIENTO EN EL MOTOR DE INTENCIONES
      motorIntenciones.procesarActualizacionExpedienteExterno = async (mensaje, entidades) => {
        console.log('📝 Procesando actualización de expediente - MODO UNIVERSAL');
        
        if (entidades.es_informacion_judicial || entidades.numero_expediente) {
          try {
            // Usar función universal que siempre está disponible
            const resultado = await window.actualizarExpedienteConLeyiaUniversal(mensaje);
            
            if (resultado.success) {
              return `✅ **¡Expediente ${resultado.numero} ${resultado.accion} exitosamente!**\n\n` +
                     `🧠 **LEYIA IA Avanzada** - Procesamiento inteligente:\n` +
                     `• Intención detectada automáticamente\n` +
                     `• Información judicial extraída\n` +
                     `• Tarjeta ${resultado.accion === 'actualizado' ? 'actualizada' : 'creada'}\n` +
                     `• Disponible desde cualquier sección\n\n` +
                     `🎯 **Ve a la sección "Casos"** para ver los cambios.`;
            } else {
              return `❌ **Error al procesar:** ${resultado.error}`;
            }
          } catch (error) {
            return `❌ **Error técnico:** ${error.message}`;
          }
        } else {
          return `🤔 **Entiendo que quieres actualizar un expediente**\n\n` +
                 `❓ **¿Puedes proporcionarme el número del expediente o la información completa?**\n\n` +
                 `🧠 **LEYIA IA Avanzada** - Funciona desde cualquier ventana del sistema.`;
        }
      };

      motorIntenciones.procesarCrearExpedienteExterno = async (mensaje, entidades) => {
        // VERIFICAR PRIMERO: ¿Es expediente estructurado?
        const esEstructurado = expedienteParser.esExpedienteEstructurado(mensaje);
        
        if (esEstructurado) {
          try {
            // Usar el parser semántico directamente
            const resultado = await window.crearExpedienteConParserUniversal(mensaje);
            
            if (resultado.success) {
              let respuesta = `✅ **Expediente ${resultado.numero} ${resultado.accion} correctamente**\n\n`;
              
              if (resultado.partes.length > 0) {
                respuesta += `👥 **Partes procesales:**\n`;
                resultado.partes.forEach(parte => {
                  respuesta += `• ${parte.rol}: ${parte.nombre}\n`;
                });
                respuesta += `\n`;
              }
              
              respuesta += `📋 Ve a la sección "Casos" para revisar los detalles.`;
              
              return respuesta;
            } else {
              return `❌ Error al procesar la información judicial.\n\nVerifica el formato e intenta nuevamente.`;
            }
          } catch (error) {
            return `❌ Error técnico: ${error.message}`;
          }
        }
        
        // CASO NORMAL: Información básica (no estructurada)
        const tieneInformacionBasica = mensaje.toLowerCase().includes('para') || 
                                     mensaje.toLowerCase().includes('cliente') || 
                                     /[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/.test(mensaje) ||
                                     mensaje.toLowerCase().includes('caso') ||
                                     mensaje.toLowerCase().includes('civil') ||
                                     mensaje.toLowerCase().includes('penal') ||
                                     mensaje.toLowerCase().includes('laboral');
        
        if (tieneInformacionBasica) {
          try {
            const resultado = await window.crearExpedienteNuevoUniversal(mensaje);
            
            if (resultado.success) {
              return `✅ **Expediente ${resultado.numero} creado**\n\n` +
                     `👤 **Cliente:** ${resultado.cliente}\n` +
                     `⚖️ **Tipo:** ${resultado.tipo.toUpperCase()}\n\n` +
                     `📋 Ve a la sección "Casos" para completar más detalles.`;
            } else {
              return `❌ Error al crear expediente: ${resultado.error}`;
            }
          } catch (error) {
            return `❌ Error técnico: ${error.message}`;
          }
        } else {
          return `📋 **Para crear un expediente necesito más información**\n\n` +
                 `💬 **Ejemplos:**\n` +
                 `• "Crea expediente para Juan Pérez, caso civil"\n` +
                 `• "Nuevo expediente laboral para María García"\n` +
                 `• Pega información judicial completa\n\n` +
                 `¿Cómo quieres proceder?`;
        }
      };

      motorIntenciones.procesarConsultaExpedienteExterno = async (mensaje, entidades) => {
        if (entidades.numero_expediente) {
          const caso = buscarCaso(entidades.numero_expediente);
          if (caso) {
            let respuesta = `✅ **Expediente ${caso.numero}**\n\n`;
            respuesta += `👤 **Cliente:** ${caso.cliente || 'No especificado'}\n`;
            respuesta += `⚖️ **Tipo:** ${caso.tipo?.toUpperCase() || 'No especificado'}\n`;
            respuesta += `📝 **Materia:** ${caso.descripcion || 'No especificado'}\n`;
            respuesta += `📊 **Estado:** ${caso.estado || 'No especificado'}\n`;
            if (caso.juez) respuesta += `👨‍⚖️ **Juez:** ${caso.juez}\n`;
            if (caso.alerta?.activa) respuesta += `🚨 **Tiene alerta activa**\n`;
            return respuesta;
          } else {
            return `❌ No encontré el expediente ${entidades.numero_expediente}`;
          }
        } else {
          return `🔍 ¿Cuál es el número del expediente que quieres consultar?`;
        }
      };

      motorIntenciones.procesarProgramarAudienciaExterno = async (mensaje, entidades) => {
        console.log('📅 Procesando programar audiencia con IA avanzada');
        
        // Usar la lógica de programar audiencia directamente aquí
        console.log('📅 Procesando programar audiencia');
        
        // Extraer información de fecha y hora
        const extraerFechaHora = (texto) => {
          const info = {};
          
          console.log('📅 Analizando texto para fecha/hora:', texto);
          
          // Extraer fecha - PATRONES MEJORADOS
          const patronesFecha = [
            /(\w+)\s+(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i,  // "martes 30 de diciembre de 2025"
            /(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i,          // "30 de diciembre de 2025"
            /(\w+)\s+(\d{1,2})\s+de\s+(\w+)/i,                 // "martes 30 de diciembre" (sin año)
            /(\d{1,2})\s+de\s+(\w+)/i,                          // "30 de diciembre" (sin año)
            /(treinta|treinta)\s+de\s+(\w+)/i,                  // "treinta de diciembre"
            /(\d{1,2})\/(\d{1,2})\/(\d{4})/,                    // "30/12/2025"
            /(\d{1,2})-(\d{1,2})-(\d{4})/                       // "30-12-2025"
          ];
          
          for (const patron of patronesFecha) {
            const match = texto.match(patron);
            if (match) {
              console.log('📅 Patrón de fecha encontrado:', match);
              
              if (match.length === 5 && match[4]) { // Con año especificado
                info.diaSemana = match[1];
                info.dia = match[2];
                info.mes = match[3];
                info.año = match[4];
              } else if (match.length === 4 && match[3] && !match[0].includes('/') && !match[0].includes('-')) { // "30 de diciembre de 2025"
                info.dia = match[1];
                info.mes = match[2];
                info.año = match[3];
              } else if (match.length === 4 && match[0].includes('/')) { // "30/12/2025"
                info.dia = match[1];
                info.mes = match[2];
                info.año = match[3];
              } else if (match.length === 4 && match[0].includes('-')) { // "30-12-2025"
                info.dia = match[1];
                info.mes = match[2];
                info.año = match[3];
              } else if (match.length === 4 && match[3]) { // "martes 30 de diciembre" (sin año)
                info.diaSemana = match[1];
                info.dia = match[2];
                info.mes = match[3];
                info.año = '2025'; // Año por defecto
              } else if (match.length === 3) { // "30 de diciembre" o "treinta de diciembre"
                if (match[1].toLowerCase() === 'treinta') {
                  info.dia = '30';
                  info.mes = match[2];
                } else {
                  info.dia = match[1];
                  info.mes = match[2];
                }
                info.año = '2025'; // Año por defecto
              }
              break;
            }
          }
          
          // Si no se encontró fecha completa, buscar patrones más simples
          if (!info.dia || !info.mes) {
            // Buscar "treinta" como número
            if (texto.toLowerCase().includes('treinta')) {
              info.dia = '30';
              
              // Buscar mes después de "treinta"
              const mesesPatron = /(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i;
              const mesMatch = texto.match(mesesPatron);
              if (mesMatch) {
                info.mes = mesMatch[1];
                info.año = '2025';
              }
            }
          }
          
          // Extraer hora - PATRONES MEJORADOS
          const patronesHora = [
            /(\d{1,2}):(\d{2})\s*(am|pm)/i,                    // "4:00 PM"
            /(\d{1,2})\s*(am|pm)/i,                            // "4 PM"
            /(\d{1,2})\s+de\s+la\s+(mañana|tarde|noche)/i,    // "4 de la tarde"
            /(\d{1,2})\s+(mañana|tarde|noche)/i,               // "4 tarde"
            /a\s+las\s+(\d{1,2})\s*(pm|am)?/i,                 // "a las 4" o "a las 4 pm"
            /(\d{1,2}):(\d{2})/,                               // "16:00" (24h)
            /(\d{1,2})\s+horas?/i                              // "16 horas"
          ];
          
          for (const patron of patronesHora) {
            const matchHora = texto.match(patron);
            if (matchHora) {
              console.log('🕐 Patrón de hora encontrado:', matchHora);
              
              if (patron.source.includes('mañana|tarde|noche')) {
                // Formato "4 de la tarde"
                info.hora = matchHora[1];
                info.minutos = '00';
                const periodo = matchHora[2] || matchHora[3];
                if (periodo === 'mañana') {
                  info.periodo = 'AM';
                } else if (periodo === 'tarde') {
                  info.periodo = 'PM';
                } else if (periodo === 'noche') {
                  info.periodo = 'PM';
                }
              } else if (patron.source.includes('a\\s+las')) {
                // Formato "a las 4"
                info.hora = matchHora[1];
                info.minutos = '00';
                // Si no especifica AM/PM, asumir PM para horas de trabajo (9-17)
                const hora = parseInt(matchHora[1]);
                if (matchHora[2]) {
                  info.periodo = matchHora[2].toUpperCase();
                } else {
                  // Lógica inteligente para AM/PM
                  if (hora >= 8 && hora <= 11) {
                    info.periodo = 'AM'; // 8-11 probablemente mañana
                  } else if (hora >= 1 && hora <= 7) {
                    info.periodo = 'PM'; // 1-7 probablemente tarde
                  } else if (hora === 12) {
                    info.periodo = 'PM'; // 12 probablemente mediodía
                  } else {
                    info.periodo = 'PM'; // Por defecto PM
                  }
                }
              } else if (matchHora[3]) {
                // Formato "4:00 PM" o "4 PM"
                info.hora = matchHora[1];
                info.minutos = matchHora[2] || '00';
                info.periodo = matchHora[3].toUpperCase();
              } else if (matchHora[2]) {
                // Formato "16:00" (24h)
                info.hora = matchHora[1];
                info.minutos = matchHora[2];
                info.periodo = parseInt(matchHora[1]) >= 12 ? 'PM' : 'AM';
              } else {
                // Formato "16 horas"
                info.hora = matchHora[1];
                info.minutos = '00';
                info.periodo = parseInt(matchHora[1]) >= 12 ? 'PM' : 'AM';
              }
              break;
            }
          }
          
          console.log('📅 Información extraída:', info);
          return info;
        };
        
        // Función para convertir mes en español a número
        const convertirMesANumero = (mesTexto) => {
          const meses = {
            'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
            'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
            'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
          };
          return meses[mesTexto.toLowerCase()] || mesTexto;
        };
        
        const fechaHora = extraerFechaHora(mensaje);
        console.log('📅 Información extraída:', fechaHora);
        
        if (entidades.numero_expediente || entidades.desde_contexto) {
          const numeroExpediente = entidades.numero_expediente;
          
          if (fechaHora.dia && fechaHora.mes && fechaHora.año && fechaHora.hora) {
            try {
              // Buscar el caso en la base de datos
              const caso = buscarCaso(numeroExpediente);
              if (!caso) {
                return `❌ **No encontré el expediente ${numeroExpediente}** en el sistema.`;
              }
              
              // Convertir la fecha al formato requerido (YYYY-MM-DD)
              const mesNumero = convertirMesANumero(fechaHora.mes);
              const diaFormateado = fechaHora.dia ? fechaHora.dia.padStart(2, '0') : '01';
              const añoFinal = fechaHora.año || '2025'; // Asegurar que hay año
              const fechaISO = `${añoFinal}-${mesNumero}-${diaFormateado}`;
              
              console.log('📅 Conversión de fecha:');
              console.log('- Mes original:', fechaHora.mes);
              console.log('- Mes convertido:', mesNumero);
              console.log('- Día original:', fechaHora.dia);
              console.log('- Día formateado:', diaFormateado);
              console.log('- Año original:', fechaHora.año);
              console.log('- Año final:', añoFinal);
              console.log('- Fecha ISO final:', fechaISO);
              
              // Validar que la fecha sea válida
              if (!mesNumero || mesNumero === fechaHora.mes || !diaFormateado || !añoFinal) {
                console.error('❌ Error en conversión de fecha:', {
                  mes: fechaHora.mes,
                  mesNumero,
                  dia: fechaHora.dia,
                  año: fechaHora.año
                });
                throw new Error(`Error al convertir la fecha. Mes: ${fechaHora.mes}, Día: ${fechaHora.dia}, Año: ${fechaHora.año}`);
              }
              
              // Convertir hora a formato 24h para almacenamiento
              let hora24 = parseInt(fechaHora.hora);
              if (fechaHora.periodo === 'PM' && hora24 !== 12) {
                hora24 += 12;
              } else if (fechaHora.periodo === 'AM' && hora24 === 12) {
                hora24 = 0;
              }
              const horaCompleta = `${hora24.toString().padStart(2, '0')}:${fechaHora.minutos}`;
              
              // Usar función universal para programar audiencia
              console.log('🔄 Programando audiencia con función universal...');
              const fechaFormateada = `${fechaHora.diaSemana ? fechaHora.diaSemana + ' ' : ''}${fechaHora.dia} de ${fechaHora.mes} de ${fechaHora.año}`;
              const horaFormateada = `${fechaHora.hora}:${fechaHora.minutos} ${fechaHora.periodo}`;
              
              const resultado = await window.programarAudienciaUniversal(
                numeroExpediente, 
                fechaISO, 
                horaCompleta, 
                fechaFormateada, 
                horaFormateada
              );
              
              if (resultado.success) {
                console.log('✅ Audiencia programada exitosamente con función universal');
                
                return `✅ **¡Audiencia programada exitosamente!**\n\n` +
                       `📋 **Expediente:** ${numeroExpediente}\n` +
                       `📅 **Fecha:** ${fechaFormateada}\n` +
                       `🕐 **Hora:** ${horaFormateada}\n\n` +
                       `🌐 **LEYIA UNIVERSAL** - Funciona desde cualquier ventana:\n` +
                       `• Fecha de audiencia actualizada en la ficha del expediente\n` +
                       `• Observación agregada al historial\n` +
                       `• Calendario actualizado automáticamente\n` +
                       `• Disponible desde cualquier sección\n\n` +
                       `💡 **Ve a la sección "Casos" para ver los cambios reflejados.**`;
              } else {
                throw new Error(resultado.error);
              }
                     
            } catch (error) {
              console.error('❌ Error al programar audiencia:', error);
              return `❌ **Error al programar la audiencia:** ${error.message}\n\n` +
                     `🔧 **Posibles soluciones:**\n` +
                     `• Verifica tu conexión a internet\n` +
                     `• Intenta nuevamente en unos segundos\n` +
                     `• Si persiste, recarga la página (F5)`;
            }
          } else {
            return `🤔 **Entiendo que quieres programar una audiencia para el expediente ${numeroExpediente}**\n\n` +
                   `❓ **Necesito más información:**\n` +
                   `• Fecha completa (día, mes, año)\n` +
                   `• Hora específica\n\n` +
                   `🗣️ **Ejemplo:** "Programa audiencia para el martes 30 de diciembre de 2025 a las 4:00 PM"`;
          }
        } else {
          return `🤔 **Entiendo que quieres programar una audiencia**\n\n` +
                 `❓ **¿Para qué expediente?**\n\n` +
                 `🗣️ **Ejemplo:** "Programa audiencia para el expediente 123-2024 el martes 30 de diciembre a las 4:00 PM"`;
        }
      };

      motorIntenciones.procesarAgregarObservacionExterno = async (mensaje, entidades) => {
        console.log('📝 Procesando agregar observación - MODO UNIVERSAL');
        
        if (entidades.numero_expediente) {
          const textoObservacion = mensaje
            .replace(/.*(?:agrega|anota|apunta|registra|escribe|pon).*?(?:observacion|nota|comentario|anotacion).*?(?:en|al|del).*?(?:expediente|caso|exp|xp).*?[:]/i, '')
            .replace(new RegExp(entidades.numero_expediente, 'gi'), '')
            .replace(/[,:]/g, '').trim();
          
          if (textoObservacion && textoObservacion.length > 3) {
            try {
              // Usar función universal para agregar observación
              const resultado = await window.agregarObservacionUniversal(entidades.numero_expediente, textoObservacion);
              
              if (resultado.success) {
                return `✅ **Observación agregada al expediente ${entidades.numero_expediente}**\n\n` +
                       `📝 **Texto agregado:** "${textoObservacion}"\n\n` +
                       `🧠 **LEYIA IA Avanzada** - Funciona desde cualquier ventana del sistema.`;
              } else {
                return `❌ **Error al agregar observación:** ${resultado.error}`;
              }
            } catch (error) {
              return `❌ **Error técnico:** ${error.message}`;
            }
          } else {
            return `🤔 **¿Cuál es el texto de la observación para el expediente ${entidades.numero_expediente}?**`;
          }
        } else {
          return `🤔 **¿A qué expediente quieres agregar la observación?**\n\n` +
                 `🧠 **LEYIA IA Avanzada** - Funciona desde cualquier ventana del sistema.`;
        }
      };

      motorIntenciones.procesarVerAlertasExterno = async (entidades) => {
        return `🚨 **Alertas del Sistema**\n\n` +
               `🧠 **LEYIA IA** - Análisis de alertas pendientes...\n\n` +
               `💡 **Funcionalidad en desarrollo** - Próximamente disponible`;
      };

      motorIntenciones.procesarConsultarCalendarioExterno = async (entidades) => {
        return `📅 **Calendario Inteligente**\n\n` +
               `🧠 **LEYIA IA** - Analizando tu agenda...\n\n` +
               `💡 **Funcionalidad en desarrollo** - Próximamente disponible`;
      };

      motorIntenciones.procesarBusquedaGlobalExterno = async (entidades) => {
        return `🔍 **Búsqueda Global Inteligente**\n\n` +
               `🧠 **LEYIA IA** - Procesando búsqueda avanzada...\n\n` +
               `💡 **Funcionalidad en desarrollo** - Próximamente disponible`;
      };

      console.log('✅ Motor de intenciones configurado con parser semántico');
      console.log('🔍 Funciones asignadas:', {
        procesarCrearExpedienteExterno: !!motorIntenciones.procesarCrearExpedienteExterno,
        procesarActualizacionExpedienteExterno: !!motorIntenciones.procesarActualizacionExpedienteExterno
      });
    } else {
      console.log('⚠️ No se pudo configurar motor de intenciones:', {
        motorIntenciones: !!motorIntenciones,
        expedienteParser: !!expedienteParser
      });
    }
  }, [motorIntenciones, expedienteParser, buscarCaso]); // Eliminar procesarProgramarAudiencia de las dependencias

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  useEffect(() => {
    if (notificacionesPendientes > 0 && !chatAbierto) {
      const mensajeAlerta = {
        tipo: 'ia',
        texto: `🎉 ¡Tengo ${notificacionesPendientes} ${notificacionesPendientes === 1 ? 'notificación importante' : 'notificaciones importantes'} para ti!\n\n${alertasDisponibles.map(a => `✅ Caso ${a.caso}: ${a.descripcion}\n   Ya puedes actuar desde el ${a.fechaDisponible}`).join('\n\n')}\n\nHaz clic en el botón de notificaciones para ver más detalles.`,
        timestamp: new Date()
      };
      setMensajes(prev => [...prev, mensajeAlerta]);
    }
  }, [notificacionesPendientes, alertasDisponibles]);

  const scrollToBottom = () => {
    mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setArrastrando(true);
    const boton = e.currentTarget;
    const rect = boton.getBoundingClientRect();
    setOffsetArrastre({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!arrastrando) return;
    const x = e.clientX - offsetArrastre.x;
    const y = e.clientY - offsetArrastre.y;
    const right = window.innerWidth - x - 64;
    const bottom = window.innerHeight - y - 64;
    const rightLimitado = Math.max(10, Math.min(right, window.innerWidth - 74));
    const bottomLimitado = Math.max(10, Math.min(bottom, window.innerHeight - 74));
    setPosicionBoton({ right: rightLimitado, bottom: bottomLimitado });
  };

  const handleMouseUp = () => {
    if (arrastrando) {
      setArrastrando(false);
      localStorage.setItem('leyia-boton-posicion', JSON.stringify(posicionBoton));
    }
  };

  useEffect(() => {
    if (arrastrando) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [arrastrando, offsetArrastre, posicionBoton]);

  // Verificar soporte de voz sin pedir permisos
  const verificarSoporteVoz = () => {
    console.log('🎤 Verificando soporte de reconocimiento de voz...');
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('❌ Reconocimiento de voz no soportado');
      setSoportaVoz(false);
      return;
    }
    
    // Solo verificar que la API existe, no pedir permisos aún
    setSoportaVoz(true);
    console.log('✅ Reconocimiento de voz disponible (permisos pendientes)');
  };

  const inicializarReconocimientoVoz = async () => {
    console.log('🎤 Inicializando reconocimiento de voz por solicitud del usuario...');
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('❌ Reconocimiento de voz no soportado');
      setSoportaVoz(false);
      
      const mensajeError = {
        tipo: 'ia',
        texto: '🚨 Tu navegador no soporta reconocimiento de voz.\n\nPuedes usar el teclado para escribir tus consultas.',
        timestamp: new Date()
      };
      setMensajes(prev => [...prev, mensajeError]);
      return;
    }

    try {
      // SOLO AHORA pedir permisos cuando el usuario quiere usar el micrófono
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
      if (permissionStatus.state === 'denied') {
        throw new Error('Permisos de micrófono denegados');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
      });
      stream.getTracks().forEach(track => track.stop());
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'es-ES';
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => {
        setEscuchandoVoz(true);
        console.log('🎤 Reconocimiento de voz iniciado');
      };
      
      recognition.onresult = (event) => {
        let transcript = '';
        let isFinal = false;
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            transcript = result[0].transcript;
            isFinal = true;
          } else {
            setInputMensaje(result[0].transcript);
          }
        }
        
        if (isFinal && transcript.trim()) {
          setInputMensaje(transcript.trim());
          setEscuchandoVoz(false);
        }
      };
      
      recognition.onerror = (event) => {
        console.error('❌ Error de reconocimiento:', event.error);
        setEscuchandoVoz(false);
        
        let mensajeError = '🚨 Error con el reconocimiento de voz. Puedes usar el teclado como alternativa.';
        
        if (event.error === 'not-allowed') {
          mensajeError = '🚨 Permisos de micrófono denegados.\n\nPara usar reconocimiento de voz:\n1. Haz clic en el ícono del micrófono en la barra de direcciones\n2. Permite el acceso al micrófono\n3. Recarga la página';
        } else if (event.error === 'no-speech') {
          mensajeError = '🤔 No detecté ninguna voz. Intenta hablar más cerca del micrófono.';
        }
        
        const mensajeErrorObj = {
          tipo: 'ia',
          texto: mensajeError,
          timestamp: new Date()
        };
        setMensajes(prev => [...prev, mensajeErrorObj]);
      };
      
      recognition.onend = () => {
        setEscuchandoVoz(false);
        console.log('🎤 Reconocimiento de voz finalizado');
      };
      
      setReconocimientoVoz(recognition);
      setSoportaVoz(true);
      
      // Iniciar reconocimiento inmediatamente después de configurarlo
      recognition.start();
      
      console.log('✅ Reconocimiento de voz configurado y iniciado');
      
    } catch (error) {
      console.error('❌ Error al inicializar reconocimiento de voz:', error);
      setSoportaVoz(false);
      
      let mensajeError = '🚨 No se pudo acceder al micrófono.';
      
      if (error.message.includes('denied') || error.name === 'NotAllowedError') {
        mensajeError = '🚨 Permisos de micrófono denegados.\n\nPara usar reconocimiento de voz:\n1. Haz clic en el ícono del micrófono en la barra de direcciones\n2. Permite el acceso al micrófono\n3. Intenta nuevamente';
      } else if (error.name === 'NotFoundError') {
        mensajeError = '🚨 No se encontró ningún micrófono.\n\nVerifica que tu micrófono esté conectado y funcionando.';
      }
      
      const mensajeErrorObj = {
        tipo: 'ia',
        texto: mensajeError,
        timestamp: new Date()
      };
      setMensajes(prev => [...prev, mensajeErrorObj]);
    }
  };

  const iniciarReconocimientoVoz = async () => {
    // Si no hay reconocimiento configurado, inicializarlo primero
    if (!reconocimientoVoz) {
      console.log('🎤 Reconocimiento no configurado, inicializando...');
      await inicializarReconocimientoVoz();
      return; // La inicialización ya inicia el reconocimiento
    }
    
    if (escuchandoVoz) return;

    try {
      setInputMensaje('');
      const mensajeEscuchando = {
        tipo: 'ia',
        texto: '🎤 Escuchando... Habla ahora',
        timestamp: new Date()
      };
      setMensajes(prev => [...prev, mensajeEscuchando]);
      reconocimientoVoz.start();
    } catch (error) {
      console.error('❌ Error al iniciar reconocimiento:', error);
      setEscuchandoVoz(false);
      
      const mensajeError = {
        tipo: 'ia',
        texto: '🚨 Error al iniciar reconocimiento de voz. Intenta nuevamente.',
        timestamp: new Date()
      };
      setMensajes(prev => [...prev, mensajeError]);
    }
  };

  const detenerReconocimientoVoz = () => {
    if (reconocimientoVoz && escuchandoVoz) {
      try {
        reconocimientoVoz.stop();
      } catch (error) {
        setEscuchandoVoz(false);
      }
    }
  };

  // SISTEMA DE IA CONVERSACIONAL CON LEYIA AI PRO
  const procesarMensajeConLeyiaAIPro = useCallback(async (mensaje, contextoMensajes = []) => {
    console.log('🚀 LEYIA AI PRO - Procesando mensaje:', mensaje);
    
    try {
      // Preparar funciones externas para LEYIA AI PRO
      const externalFunctions = {
        programarAudiencia: async (slots) => {
          console.log('📅 Ejecutando programar audiencia con slots:', slots);
          
          if (!slots.expediente_numero) {
            return { success: false, message: '📂 Necesito el número del expediente' };
          }
          
          if (!slots.fecha) {
            return { success: false, message: '📅 Necesito la fecha de la audiencia' };
          }
          
          // Usar función universal existente
          try {
            const resultado = await window.programarAudienciaUniversal(
              slots.expediente_numero,
              slots.fecha,
              slots.hora || '09:00',
              slots.fecha,
              slots.hora || '9:00 AM'
            );
            
            if (resultado.success) {
              return { 
                success: true, 
                message: `✅ Audiencia programada\n\n📅 Fecha: ${slots.fecha}\n📂 Expediente: ${slots.expediente_numero}${slots.hora ? `\n⏰ Hora: ${slots.hora}` : ''}` 
              };
            } else {
              return { success: false, message: `❌ ${resultado.error}` };
            }
          } catch (error) {
            return { success: false, message: `❌ Error: ${error.message}` };
          }
        },
        
        consultarAudiencia: async (slots) => {
          console.log('🔍 Ejecutando consultar audiencia con slots:', slots);
          return { 
            success: true, 
            message: '📅 Consultando audiencias...\n\nFuncionalidad en desarrollo.' 
          };
        },
        
        crearExpediente: async (slots) => {
          console.log('📋 Ejecutando crear expediente con slots:', slots);
          
          if (!slots.cliente) {
            return { success: false, message: '👤 Necesito el nombre del cliente' };
          }
          
          try {
            const mensaje = `Crea expediente para ${slots.cliente}${slots.tipo ? `, caso ${slots.tipo}` : ''}${slots.materia ? `, materia ${slots.materia}` : ''}`;
            const resultado = await window.crearExpedienteNuevoUniversal(mensaje);
            
            if (resultado.success) {
              return { 
                success: true, 
                message: `✅ Expediente ${resultado.numero} creado\n\n👤 Cliente: ${resultado.cliente}\n⚖️ Tipo: ${resultado.tipo.toUpperCase()}\n\n📋 Ve a "Casos" para más detalles.` 
              };
            } else {
              return { success: false, message: `❌ ${resultado.error}` };
            }
          } catch (error) {
            return { success: false, message: `❌ Error: ${error.message}` };
          }
        },
        
        consultarExpediente: async (slots) => {
          console.log('🔍 Ejecutando consultar expediente con slots:', slots);
          
          if (!slots.expediente_numero) {
            return { success: false, message: '📂 Necesito el número del expediente' };
          }
          
          const caso = buscarCaso(slots.expediente_numero);
          if (caso) {
            return { 
              success: true, 
              message: `✅ Expediente ${caso.numero}\n\n👤 Cliente: ${caso.cliente || 'No especificado'}\n⚖️ Tipo: ${caso.tipo?.toUpperCase() || 'No especificado'}\n📊 Estado: ${caso.estado || 'No especificado'}${caso.juez ? `\n👨‍⚖️ Juez: ${caso.juez}` : ''}` 
            };
          } else {
            return { success: false, message: `❌ No encontré el expediente ${slots.expediente_numero}` };
          }
        },
        
        actualizarExpediente: async (slots) => {
          console.log('📝 Ejecutando actualizar expediente con slots:', slots);
          
          // Si hay información judicial completa, usar la función universal
          if (slots.informacion_judicial || slots.datos_expediente) {
            try {
              const informacion = slots.informacion_judicial || slots.datos_expediente || mensaje;
              const resultado = await window.actualizarExpedienteConLeyiaUniversal(informacion);
              
              if (resultado.success) {
                let respuesta = `✅ **Expediente ${resultado.numero} ${resultado.accion} exitosamente**\n\n`;
                
                if (resultado.cambios && resultado.cambios.length > 0) {
                  respuesta += `📋 **Campos ${resultado.accion === 'actualizado' ? 'actualizados' : 'configurados'}:**\n`;
                  respuesta += resultado.cambios.join('\n') + '\n\n';
                } else {
                  respuesta += `📋 **Información procesada** - Expediente ${resultado.accion === 'actualizado' ? 'actualizado' : 'creado'} con datos existentes\n\n`;
                }
                
                respuesta += `🧠 **LEYIA IA Avanzada** - Procesamiento inteligente:\n`;
                respuesta += `• Información judicial extraída automáticamente\n`;
                respuesta += `• Campos específicos actualizados (no solo observaciones)\n`;
                respuesta += `• Partes procesales identificadas\n`;
                respuesta += `• Disponible desde cualquier sección\n\n`;
                respuesta += `🎯 **Ve a "Casos" para ver todos los cambios reflejados.**`;
                
                return { 
                  success: true, 
                  message: respuesta
                };
              } else {
                return { success: false, message: `❌ Error al procesar: ${resultado.error}` };
              }
            } catch (error) {
              return { success: false, message: `❌ Error técnico: ${error.message}` };
            }
          }
          
          // Si solo hay número de expediente, pedir más información
          if (slots.expediente_numero) {
            return { 
              success: false, 
              message: `🤔 Entiendo que quieres actualizar el expediente ${slots.expediente_numero}\n\n❓ ¿Puedes proporcionarme la información completa del expediente o los datos específicos que quieres actualizar?` 
            };
          }
          
          return { 
            success: false, 
            message: `🤔 Para actualizar un expediente necesito:\n• El número del expediente\n• La información actualizada\n\n💡 Ejemplo: "Actualiza expediente 123-2024 con estos datos: [información judicial]"` 
          };
        }
      };
      
      // Procesar con LEYIA AI PRO
      const respuesta = await leyiaAIPro.processMessage(mensaje, externalFunctions);
      
      console.log('✅ Respuesta de LEYIA AI PRO:', respuesta);
      return respuesta;
      
    } catch (error) {
      console.error('❌ Error en LEYIA AI PRO:', error);
      
      // Fallback al sistema anterior
      return await procesarMensajeConIA(mensaje, contextoMensajes);
    }
  }, [leyiaAIPro, buscarCaso]);

  // SISTEMA DE IA CONVERSACIONAL CON MOTOR DE INTENCIONES AVANZADO (FALLBACK)
  const procesarMensajeConIA = useCallback(async (mensaje, contextoMensajes = []) => {
    console.log('🧠 LEYIA IA - Procesando mensaje con motor de intenciones avanzado:', mensaje);
    
    try {
      // VERIFICAR QUE EL MOTOR ESTÉ CONFIGURADO
      if (!motorIntenciones) {
        console.error('❌ Motor de intenciones no disponible');
        return await analizarPreguntaFallback(mensaje, contextoMensajes);
      }
      
      // VERIFICAR QUE LAS FUNCIONES EXTERNAS ESTÉN ASIGNADAS
      console.log('🔍 Verificando funciones externas:', {
        procesarCrearExpedienteExterno: !!motorIntenciones.procesarCrearExpedienteExterno,
        procesarActualizacionExpedienteExterno: !!motorIntenciones.procesarActualizacionExpedienteExterno,
        procesarConsultaExpedienteExterno: !!motorIntenciones.procesarConsultaExpedienteExterno
      });
      
      // Usar el motor de intenciones para procesar el mensaje
      const respuesta = await motorIntenciones.procesarMensaje(mensaje, contextoMensajes);
      
      console.log('✅ Respuesta del motor de intenciones:', respuesta);
      return respuesta;
      
    } catch (error) {
      console.error('❌ Error en motor de intenciones:', error);
      
      // Fallback al sistema anterior si hay error
      return await analizarPreguntaFallback(mensaje, contextoMensajes);
    }
  }, [motorIntenciones]);

  // Sistema de fallback (versión simplificada del anterior)
  const analizarPreguntaFallback = useCallback(async (pregunta, contextoMensajes = []) => {
    console.log('🔄 LEYIA - Usando sistema de fallback:', pregunta);
    
    // Lógica básica de fallback
    const textoNormalizado = pregunta.toLowerCase();
    
    // Detectar número de expediente
    const patronesExpediente = [
      /\b(\d{2,6}[-.]?\d{4}[-.]?\d*[-.]?[A-Z0-9]*[-.]?[A-Z]*[-.]?[A-Z]*[-.]?\d*)\b/g,
      /\b(\d{3,6})\b/g
    ];
    
    let numeroExpediente = null;
    for (const patron of patronesExpediente) {
      const matches = [...pregunta.matchAll(patron)];
      if (matches.length > 0 && matches[0][1] && matches[0][1].length >= 3) {
        numeroExpediente = matches[0][1];
        break;
      }
    }
    
    // Detectar información judicial
    const tieneInfoJudicial = /EXPEDIENTE\s*N°?\s*:|JUEZ\s*:|ESPECIALISTA\s*:|ÓRGANO JURISDICCIONAL/i.test(pregunta);
    
    // Detección básica de intenciones
    if ((textoNormalizado.includes('crea') || textoNormalizado.includes('crear') || 
        textoNormalizado.includes('nuevo') || textoNormalizado.includes('quiero que crees')) &&
        tieneInfoJudicial) {
      // CASO ESPECIAL: Crear con información judicial
      console.log('🎯 Fallback detecta: CREAR con información judicial');
      try {
        const resultado = await window.actualizarExpedienteConLeyiaUniversal(pregunta);
        
        if (resultado.success) {
          return `✅ **¡Expediente ${resultado.numero} ${resultado.accion} exitosamente!**\n\n` +
                 `🔄 **Sistema de Fallback** - Procesamiento de información judicial:\n` +
                 `• Intención CREAR detectada en fallback\n` +
                 `• Información judicial procesada correctamente\n` +
                 `• Expediente ${resultado.accion === 'creado' ? 'creado' : 'actualizado'} con todos los datos\n\n` +
                 `🎯 **Ve a la sección "Casos"** para ver el expediente.`;
        } else {
          return `❌ **Error en fallback:** ${resultado.error}`;
        }
      } catch (error) {
        return `❌ **Error técnico en fallback:** ${error.message}`;
      }
    } else if (textoNormalizado.includes('crea') || textoNormalizado.includes('crear') || 
        textoNormalizado.includes('nuevo') || textoNormalizado.includes('quiero que crees')) {
      return `📋 **¡Entiendo que quieres crear un expediente!**\n\n` +
             `🔄 **LEYIA IA** - Sistema de fallback activado\n\n` +
             `💡 **Para crear un expediente, puedes:**\n` +
             `• **Con datos básicos:** "Crea expediente para Juan Pérez, caso civil"\n` +
             `• **Con información judicial:** "Quiero que crees un expediente con estos datos: [pegar información]"\n` +
             `• **Paso a paso:** Solo dime el nombre del cliente\n\n` +
             `🔧 **Si tienes información judicial completa, pégala después de tu comando**`;
    } else if (textoNormalizado.includes('actualiza') || textoNormalizado.includes('modifica') || textoNormalizado.includes('integra')) {
      return await procesarActualizacionExpediente(pregunta, { numero_expediente: numeroExpediente });
    } else if (textoNormalizado.includes('busca') || textoNormalizado.includes('consulta') || textoNormalizado.includes('existe')) {
      return await procesarConsultaExpediente(pregunta, { numero_expediente: numeroExpediente });
    } else if (textoNormalizado.includes('audiencia') && (textoNormalizado.includes('programa') || textoNormalizado.includes('señales'))) {
      return await procesarProgramarAudiencia(pregunta, { numero_expediente: numeroExpediente });
    } else if (textoNormalizado.includes('agrega') || textoNormalizado.includes('anota')) {
      return await procesarAgregarObservacion(pregunta, { numero_expediente: numeroExpediente });
    } else {
      return `💡 **Sistema de fallback activo**\n\n🤔 No pude procesar tu mensaje con el motor de IA avanzado.\n\n💬 **Intenta ser más específico:**\n• "Crea un expediente nuevo"\n• "Actualiza el expediente 123"\n• "Busca el caso 456"\n• "Programa audiencia para mañana"\n\n🔧 **Si persiste el problema, recarga la página.**`;
    }
  }, [buscarCaso]);
  
  // FUNCIONES DE PROCESAMIENTO
  const procesarActualizacionExpediente = async (pregunta, entidades) => {
    console.log('📝 Procesando actualización de expediente - MODO UNIVERSAL');
    
    if (entidades.tiene_info_expediente || entidades.numero_expediente) {
      try {
        // Usar función universal que siempre está disponible
        const resultado = await window.actualizarExpedienteConLeyiaUniversal(pregunta);
        
        if (resultado.success) {
          return `✅ **¡Expediente ${resultado.numero} ${resultado.accion} exitosamente!**\n\n` +
                 `🌐 **LEYIA UNIVERSAL** - Funciona igual en todas las ventanas:\n` +
                 `• Información judicial extraída\n` +
                 `• Tarjeta ${resultado.accion === 'actualizado' ? 'actualizada' : 'creada'}\n` +
                 `• Cambios reflejados inmediatamente\n` +
                 `• Disponible desde cualquier sección\n\n` +
                 `🎯 **Ve a la sección "Casos"** para ver los cambios.`;
        } else {
          return `❌ **Error al procesar:** ${resultado.error}`;
        }
      } catch (error) {
        return `❌ **Error técnico:** ${error.message}`;
      }
    } else {
      return `🤔 **Entiendo que quieres actualizar un expediente**\n\n` +
             `❓ **¿Puedes proporcionarme el número del expediente o la información completa?**\n\n` +
             `🌐 **LEYIA UNIVERSAL** - Funciona desde cualquier ventana del sistema.`;
    }
  };
  
  const procesarConsultaExpediente = async (pregunta, entidades) => {
    console.log('🔍 Procesando consulta de expediente');
    
    if (entidades.numero_expediente) {
      const caso = buscarCaso(entidades.numero_expediente);
      if (caso) {
        let respuesta = `✅ **Expediente ${caso.numero} encontrado**\\n\\n`;
        respuesta += `👤 **Cliente:** ${caso.cliente || 'No especificado'}\\n`;
        respuesta += `⚖️ **Tipo:** ${caso.tipo?.toUpperCase() || 'No especificado'}\\n`;
        respuesta += `📝 **Materia:** ${caso.descripcion || 'No especificado'}\\n`;
        respuesta += `📊 **Estado:** ${caso.estado || 'No especificado'}\\n`;
        if (caso.juez) respuesta += `👨‍⚖️ **Juez:** ${caso.juez}\\n`;
        if (caso.alerta?.activa) respuesta += `🚨 **Tiene alerta activa**\\n`;
        return respuesta;
      } else {
        return `❌ **No encontré el expediente ${entidades.numero_expediente}**`;
      }
    } else {
      return `🤔 **Entiendo que quieres consultar un expediente**\\n\\n` +
             `❓ **¿Cuál es el número del expediente?**`;
    }
  };
  
  const procesarAgregarObservacion = async (pregunta, entidades) => {
    console.log('📝 Procesando agregar observación - MODO UNIVERSAL');
    
    if (entidades.numero_expediente) {
      const textoObservacion = pregunta
        .replace(/.*(?:agrega|anota|apunta|registra|escribe|pon).*?(?:observacion|nota|comentario|anotacion).*?(?:en|al|del).*?(?:expediente|caso|exp|xp).*?[:]/i, '')
        .replace(new RegExp(entidades.numero_expediente, 'gi'), '')
        .replace(/[,:]/g, '').trim();
      
      if (textoObservacion && textoObservacion.length > 3) {
        try {
          // Usar función universal para agregar observación
          const resultado = await window.agregarObservacionUniversal(entidades.numero_expediente, textoObservacion);
          
          if (resultado.success) {
            return `✅ **Observación agregada al expediente ${entidades.numero_expediente}**\n\n` +
                   `📝 **Texto agregado:** "${textoObservacion}"\n\n` +
                   `🌐 **LEYIA UNIVERSAL** - Funciona desde cualquier ventana del sistema.`;
          } else {
            return `❌ **Error al agregar observación:** ${resultado.error}`;
          }
        } catch (error) {
          return `❌ **Error técnico:** ${error.message}`;
        }
      } else {
        return `🤔 **¿Cuál es el texto de la observación para el expediente ${entidades.numero_expediente}?**`;
      }
    } else {
      return `🤔 **¿A qué expediente quieres agregar la observación?**\n\n` +
             `🌐 **LEYIA UNIVERSAL** - Funciona desde cualquier ventana del sistema.`;
    }
  };
  
  const procesarProgramarAudiencia = async (pregunta, entidades) => {
    console.log('📅 Procesando programar audiencia');
    
    // Extraer información de fecha y hora
    const extraerFechaHora = (texto) => {
      const info = {};
      
      console.log('📅 Analizando texto para fecha/hora:', texto);
      
      // Extraer fecha - PATRONES MEJORADOS
      const patronesFecha = [
        /(\w+)\s+(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i,  // "martes 30 de diciembre de 2025"
        /(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i,          // "30 de diciembre de 2025"
        /(\w+)\s+(\d{1,2})\s+de\s+(\w+)/i,                 // "martes 30 de diciembre" (sin año)
        /(\d{1,2})\s+de\s+(\w+)/i,                          // "30 de diciembre" (sin año)
        /(treinta|treinta)\s+de\s+(\w+)/i,                  // "treinta de diciembre"
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,                    // "30/12/2025"
        /(\d{1,2})-(\d{1,2})-(\d{4})/                       // "30-12-2025"
      ];
      
      for (const patron of patronesFecha) {
        const match = texto.match(patron);
        if (match) {
          console.log('📅 Patrón de fecha encontrado:', match);
          
          if (match.length === 5 && match[4]) { // Con año especificado
            info.diaSemana = match[1];
            info.dia = match[2];
            info.mes = match[3];
            info.año = match[4];
          } else if (match.length === 4 && match[3] && !match[0].includes('/') && !match[0].includes('-')) { // "30 de diciembre de 2025"
            info.dia = match[1];
            info.mes = match[2];
            info.año = match[3];
          } else if (match.length === 4 && match[0].includes('/')) { // "30/12/2025"
            info.dia = match[1];
            info.mes = match[2];
            info.año = match[3];
          } else if (match.length === 4 && match[0].includes('-')) { // "30-12-2025"
            info.dia = match[1];
            info.mes = match[2];
            info.año = match[3];
          } else if (match.length === 4 && match[3]) { // "martes 30 de diciembre" (sin año)
            info.diaSemana = match[1];
            info.dia = match[2];
            info.mes = match[3];
            info.año = '2025'; // Año por defecto
          } else if (match.length === 3) { // "30 de diciembre" o "treinta de diciembre"
            if (match[1].toLowerCase() === 'treinta') {
              info.dia = '30';
              info.mes = match[2];
            } else {
              info.dia = match[1];
              info.mes = match[2];
            }
            info.año = '2025'; // Año por defecto
          }
          break;
        }
      }
      
      // Si no se encontró fecha completa, buscar patrones más simples
      if (!info.dia || !info.mes) {
        // Buscar "treinta" como número
        if (texto.toLowerCase().includes('treinta')) {
          info.dia = '30';
          
          // Buscar mes después de "treinta"
          const mesesPatron = /(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i;
          const mesMatch = texto.match(mesesPatron);
          if (mesMatch) {
            info.mes = mesMatch[1];
            info.año = '2025';
          }
        }
      }
      
      // Extraer hora - PATRONES MEJORADOS
      const patronesHora = [
        /(\d{1,2}):(\d{2})\s*(am|pm)/i,                    // "4:00 PM"
        /(\d{1,2})\s*(am|pm)/i,                            // "4 PM"
        /(\d{1,2})\s+de\s+la\s+(mañana|tarde|noche)/i,    // "4 de la tarde"
        /(\d{1,2})\s+(mañana|tarde|noche)/i,               // "4 tarde"
        /a\s+las\s+(\d{1,2})\s*(pm|am)?/i,                 // "a las 4" o "a las 4 pm"
        /(\d{1,2}):(\d{2})/,                               // "16:00" (24h)
        /(\d{1,2})\s+horas?/i                              // "16 horas"
      ];
      
      for (const patron of patronesHora) {
        const matchHora = texto.match(patron);
        if (matchHora) {
          console.log('🕐 Patrón de hora encontrado:', matchHora);
          
          if (patron.source.includes('mañana|tarde|noche')) {
            // Formato "4 de la tarde"
            info.hora = matchHora[1];
            info.minutos = '00';
            const periodo = matchHora[2] || matchHora[3];
            if (periodo === 'mañana') {
              info.periodo = 'AM';
            } else if (periodo === 'tarde') {
              info.periodo = 'PM';
            } else if (periodo === 'noche') {
              info.periodo = 'PM';
            }
          } else if (patron.source.includes('a\\s+las')) {
            // Formato "a las 4"
            info.hora = matchHora[1];
            info.minutos = '00';
            // Si no especifica AM/PM, asumir PM para horas de trabajo (9-17)
            const hora = parseInt(matchHora[1]);
            if (matchHora[2]) {
              info.periodo = matchHora[2].toUpperCase();
            } else {
              // Lógica inteligente para AM/PM
              if (hora >= 8 && hora <= 11) {
                info.periodo = 'AM'; // 8-11 probablemente mañana
              } else if (hora >= 1 && hora <= 7) {
                info.periodo = 'PM'; // 1-7 probablemente tarde
              } else if (hora === 12) {
                info.periodo = 'PM'; // 12 probablemente mediodía
              } else {
                info.periodo = 'PM'; // Por defecto PM
              }
            }
          } else if (matchHora[3]) {
            // Formato "4:00 PM" o "4 PM"
            info.hora = matchHora[1];
            info.minutos = matchHora[2] || '00';
            info.periodo = matchHora[3].toUpperCase();
          } else if (matchHora[2]) {
            // Formato "16:00" (24h)
            info.hora = matchHora[1];
            info.minutos = matchHora[2];
            info.periodo = parseInt(matchHora[1]) >= 12 ? 'PM' : 'AM';
          } else {
            // Formato "16 horas"
            info.hora = matchHora[1];
            info.minutos = '00';
            info.periodo = parseInt(matchHora[1]) >= 12 ? 'PM' : 'AM';
          }
          break;
        }
      }
      
      console.log('📅 Información extraída:', info);
      return info;
    };
    
    // Función para convertir mes en español a número
    const convertirMesANumero = (mesTexto) => {
      const meses = {
        'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
        'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
        'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
      };
      return meses[mesTexto.toLowerCase()] || mesTexto;
    };
    
    const fechaHora = extraerFechaHora(pregunta);
    console.log('📅 Información extraída:', fechaHora);
    
    if (entidades.numero_expediente || entidades.desde_contexto) {
      const numeroExpediente = entidades.numero_expediente;
      
      if (fechaHora.dia && fechaHora.mes && fechaHora.año && fechaHora.hora) {
        try {
          // Buscar el caso en la base de datos
          const caso = buscarCaso(numeroExpediente);
          if (!caso) {
            return `❌ **No encontré el expediente ${numeroExpediente}** en el sistema.`;
          }
          
          // Convertir la fecha al formato requerido (YYYY-MM-DD)
          const mesNumero = convertirMesANumero(fechaHora.mes);
          const diaFormateado = fechaHora.dia ? fechaHora.dia.padStart(2, '0') : '01';
          const añoFinal = fechaHora.año || '2025'; // Asegurar que hay año
          const fechaISO = `${añoFinal}-${mesNumero}-${diaFormateado}`;
          
          console.log('📅 Conversión de fecha:');
          console.log('- Mes original:', fechaHora.mes);
          console.log('- Mes convertido:', mesNumero);
          console.log('- Día original:', fechaHora.dia);
          console.log('- Día formateado:', diaFormateado);
          console.log('- Año original:', fechaHora.año);
          console.log('- Año final:', añoFinal);
          console.log('- Fecha ISO final:', fechaISO);
          
          // Validar que la fecha sea válida
          if (!mesNumero || mesNumero === fechaHora.mes || !diaFormateado || !añoFinal) {
            console.error('❌ Error en conversión de fecha:', {
              mes: fechaHora.mes,
              mesNumero,
              dia: fechaHora.dia,
              año: fechaHora.año
            });
            throw new Error(`Error al convertir la fecha. Mes: ${fechaHora.mes}, Día: ${fechaHora.dia}, Año: ${fechaHora.año}`);
          }
          
          // Convertir hora a formato 24h para almacenamiento
          let hora24 = parseInt(fechaHora.hora);
          if (fechaHora.periodo === 'PM' && hora24 !== 12) {
            hora24 += 12;
          } else if (fechaHora.periodo === 'AM' && hora24 === 12) {
            hora24 = 0;
          }
          const horaCompleta = `${hora24.toString().padStart(2, '0')}:${fechaHora.minutos}`;
          
          // Usar función universal para programar audiencia
          console.log('🔄 Programando audiencia con función universal...');
          const fechaFormateada = `${fechaHora.diaSemana ? fechaHora.diaSemana + ' ' : ''}${fechaHora.dia} de ${fechaHora.mes} de ${fechaHora.año}`;
          const horaFormateada = `${fechaHora.hora}:${fechaHora.minutos} ${fechaHora.periodo}`;
          
          const resultado = await window.programarAudienciaUniversal(
            numeroExpediente, 
            fechaISO, 
            horaCompleta, 
            fechaFormateada, 
            horaFormateada
          );
          
          if (resultado.success) {
            console.log('✅ Audiencia programada exitosamente con función universal');
            
            return `✅ **¡Audiencia programada exitosamente!**\n\n` +
                   `📋 **Expediente:** ${numeroExpediente}\n` +
                   `📅 **Fecha:** ${fechaFormateada}\n` +
                   `🕐 **Hora:** ${horaFormateada}\n\n` +
                   `🌐 **LEYIA UNIVERSAL** - Funciona desde cualquier ventana:\n` +
                   `• Fecha de audiencia actualizada en la ficha del expediente\n` +
                   `• Observación agregada al historial\n` +
                   `• Calendario actualizado automáticamente\n` +
                   `• Disponible desde cualquier sección\n\n` +
                   `💡 **Ve a la sección "Casos" para ver los cambios reflejados.**`;
          } else {
            throw new Error(resultado.error);
          }
                 
        } catch (error) {
          console.error('❌ Error al programar audiencia:', error);
          return `❌ **Error al programar la audiencia:** ${error.message}\\n\\n` +
                 `🔧 **Posibles soluciones:**\\n` +
                 `• Verifica tu conexión a internet\\n` +
                 `• Intenta nuevamente en unos segundos\\n` +
                 `• Si persiste, recarga la página (F5)`;
        }
      } else {
        return `🤔 **Entiendo que quieres programar una audiencia para el expediente ${numeroExpediente}**\\n\\n` +
               `❓ **Necesito más información:**\\n` +
               `• Fecha completa (día, mes, año)\\n` +
               `• Hora específica\\n\\n` +
               `🗣️ **Ejemplo:** "Programa audiencia para el martes 30 de diciembre de 2025 a las 4:00 PM"`;
      }
    } else {
      return `🤔 **Entiendo que quieres programar una audiencia**\\n\\n` +
             `❓ **¿Para qué expediente?**\\n\\n` +
             `🗣️ **Ejemplo:** "Programa audiencia para el expediente 123-2024 el martes 30 de diciembre a las 4:00 PM"`;
    }
  };
  
  const procesarConsultaGeneral = async (pregunta, entidades) => {
    let respuesta = `💡 **Soy Leyia, tu asistente legal inteligente**\\n\\n`;
    respuesta += `🧠 **Entiendo lenguaje natural** - No necesitas comandos exactos\\n\\n`;
    respuesta += `✅ **Puedes decirme:**\\n`;
    respuesta += `• "Actualiza el 123" o "Pon al día el expediente 123"\\n`;
    respuesta += `• "Busca el 456" o "¿Existe el caso 456?"\\n`;
    respuesta += `• "Anota en el 789: texto" o "Agrega observación al 789"\\n\\n`;
    respuesta += `🎯 **Soy flexible** - Entiendo muchas formas de decir lo mismo\\n\\n`;
    
    if (entidades.numero_expediente) {
      respuesta += `📋 **Detecté el expediente:** ${entidades.numero_expediente}\\n`;
      respuesta += `💬 **¿Qué quieres hacer con él?**`;
    } else {
      respuesta += `💬 **¿En qué puedo ayudarte hoy?**`;
    }
    
    return respuesta;
  };

  const enviarMensaje = useCallback(async () => {
    if (!inputMensaje.trim()) return;

    // Verificar conexión a internet
    if (!isOnline) {
      const mensajeError = {
        tipo: 'ia',
        texto: '🚨 Sin conexión a internet\n\nVerifica tu conexión y vuelve a intentar.',
        timestamp: new Date()
      };
      setMensajes(prev => [...prev, mensajeError]);
      return;
    }

    const mensajeUsuario = {
      tipo: 'usuario',
      texto: inputMensaje,
      timestamp: new Date()
    };
    
    const mensajeActual = inputMensaje;
    
    // Limpiar mensajes antiguos antes de agregar nuevos
    setMensajes(prev => {
      const mensajesActualizados = [...prev, mensajeUsuario];
      // Mantener solo los últimos 8 mensajes para evitar saturación
      return mensajesActualizados.length > 8 ? mensajesActualizados.slice(-8) : mensajesActualizados;
    });
    
    setInputMensaje('');
    setCargando(true);

    try {
      // Usar LEYIA AI PRO (nueva arquitectura)
      const respuesta = await procesarMensajeConLeyiaAIPro(mensajeActual, mensajes.concat(mensajeUsuario));
      
      const mensajeIA = {
        tipo: 'ia',
        texto: respuesta,
        timestamp: new Date()
      };
      
      setMensajes(prev => [...prev, mensajeIA]);
      setCargando(false);
    } catch (error) {
      console.error('Error al procesar mensaje:', error);
      
      // Detectar errores de conexión específicos
      let mensajeError = '❌ Error al procesar tu mensaje. Intenta nuevamente.';
      
      if (error.code === 'unavailable' || error.message.includes('network') || error.message.includes('offline')) {
        mensajeError = '🚨 Error de conexión\n\nVerifica tu conexión a internet e intenta nuevamente.';
      } else if (error.code === 'permission-denied') {
        mensajeError = '🚨 Error de permisos\n\nContacta al administrador del sistema.';
      }
      
      const mensajeErrorObj = {
        tipo: 'ia',
        texto: mensajeError,
        timestamp: new Date()
      };
      setMensajes(prev => [...prev, mensajeErrorObj]);
      setCargando(false);
    }
  }, [inputMensaje, isOnline, mensajes, procesarMensajeConLeyiaAIPro]); // Dependencias actualizadas

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  }, [enviarMensaje]);

  return (
    <>
      <div style={{ position: 'relative' }}>
        <button 
          className={`chat-ia-btn-flotante ${(notificacionesPendientes > 0 || mensajesNoLeidos.length > 0) ? 'tiene-notificaciones' : ''} ${arrastrando ? 'dragging' : ''}`}
          style={{
            position: 'fixed',
            right: `${posicionBoton.right}px`,
            bottom: `${posicionBoton.bottom}px`,
            cursor: arrastrando ? 'grabbing' : 'grab',
            zIndex: arrastrando ? 10001 : 10000
          }}
          onClick={(e) => {
            if (!arrastrando) {
              // Abrir directamente el chat interno
              setChatInternoAbierto(true);
              if (notificacionesPendientes > 0 && onNotificacionesVistas) {
                onNotificacionesVistas();
              }
            }
          }}
          onMouseDown={handleMouseDown}
          title={`LeyIA - ${obtenerNombreRol()} ${usuario?.displayName || usuario?.name || ''}`}
        >
          <img src="./leyia.png" alt="Leyia" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          
          {/* Indicador de rol */}
          {usuario && (
            <div style={{
              position: 'absolute',
              top: '-2px',
              left: '-2px',
              background: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              {obtenerIconoRol()}
            </div>
          )}
        </button>
        
        {/* Badge de notificaciones combinadas */}
        {((notificacionesPendientes > 0) || (mensajesNoLeidos.length > 0)) && (
          <div className="chat-ia-badge-notificaciones">
            {notificacionesPendientes + mensajesNoLeidos.length}
          </div>
        )}
        
        {notificacionesPendientes > 0 && !chatAbierto && (
          <div 
            className="chat-ia-burbuja-notificacion"
            style={{
              position: 'fixed',
              bottom: `${posicionBoton.bottom + 75}px`,
              right: `${posicionBoton.right - 10}px`,
              zIndex: 1001
            }}
          >
            <div className="burbuja-contenido">
              <strong>🎉 ¡Atención!</strong>
              <p>{notificacionesPendientes} {notificacionesPendientes === 1 ? 'plazo disponible' : 'plazos disponibles'}</p>
            </div>
          </div>
        )}
      </div>

      {chatAbierto && (
        <div className="chat-ia-container">
          <div className="chat-ia-header">
            <div className="chat-ia-header-info">
              <span className="chat-ia-avatar">
                <img src="./leyia.png" alt="Leyia" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              </span>
              <div>
                <div className="chat-ia-titulo">Leyia</div>
                <div className="chat-ia-estado">
                  Asistente Legal • {isOnline ? (
                    <span style={{ color: '#10b981' }}>En línea</span>
                  ) : (
                    <span style={{ color: '#ef4444' }}>Sin conexión</span>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {puedeUsarChatInterno && (
                <button 
                  className="chat-ia-chat-interno-btn" 
                  onClick={() => setChatInternoAbierto(true)}
                  title="Chat Interno del Equipo"
                  style={{
                    position: 'relative'
                  }}
                >
                  💬
                  {mensajesNoLeidos.length > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      background: '#ef4444',
                      color: 'white',
                      borderRadius: '50%',
                      width: '16px',
                      height: '16px',
                      fontSize: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold'
                    }}>
                      {mensajesNoLeidos.length > 9 ? '9+' : mensajesNoLeidos.length}
                    </span>
                  )}
                </button>
              )}
              
              {puedeUsarLeyiaIA && (
                <button 
                  className="chat-ia-leyia-btn" 
                  onClick={() => {
                    setModoActual('leyia');
                    setMensajes([{
                      tipo: 'ia',
                      texto: '🤖 **LeyIA Activada**\n\n¡Hola! Soy tu asistente legal inteligente.\n\n💬 **Puedes pedirme:**\n• Actualizar expedientes\n• Programar audiencias\n• Buscar casos\n• Agregar observaciones\n• Consultar información\n\n🎤 **Usa el micrófono para hablar o escribe tu consulta**\n\n¿En qué puedo ayudarte?',
                      timestamp: new Date()
                    }]);
                  }}
                  title="Hablar con LeyIA"
                  style={{
                    background: modoActual === 'leyia' ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' : 'rgba(255, 255, 255, 0.2)',
                    color: modoActual === 'leyia' ? 'white' : 'rgba(255, 255, 255, 0.8)'
                  }}
                >
                  🤖
                </button>
              )}
              
              <button className="chat-ia-close" onClick={() => setChatAbierto(false)}>✕</button>
            </div>
          </div>

          <div className="chat-ia-mensajes">
            {mensajes.map((mensaje, index) => (
              <div key={index} className={`chat-ia-mensaje ${mensaje.tipo}`}>
                {mensaje.tipo === 'ia' && (
                  <span className="mensaje-avatar">
                    <img src="./leyia.png" alt="Leyia" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  </span>
                )}
                <div className="mensaje-contenido">
                  <div className="mensaje-texto">{mensaje.texto}</div>
                  <div className="mensaje-hora">
                    {mensaje.timestamp.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {mensaje.tipo === 'usuario' && <span className="mensaje-avatar">👤</span>}
              </div>
            ))}
            {cargando && (
              <div className="chat-ia-mensaje ia">
                <span className="mensaje-avatar">
                  <img src="./leyia.png" alt="Leyia" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                </span>
                <div className="mensaje-contenido">
                  <div className="mensaje-typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={mensajesEndRef} />
          </div>

          <div className="chat-ia-input-container">
            <textarea
              className="chat-ia-input"
              placeholder={
                !isOnline 
                  ? "🚨 Sin conexión a internet - Verifica tu conexión"
                  : escuchandoVoz 
                    ? "🎤 Escuchando... Habla ahora" 
                    : "Escribe tu pregunta o acción..."
              }
              value={inputMensaje}
              onChange={(e) => setInputMensaje(e.target.value)}
              onKeyPress={handleKeyPress}
              rows="1"
              disabled={escuchandoVoz || !isOnline}
              style={{
                backgroundColor: !isOnline ? '#fee2e2' : undefined,
                borderColor: !isOnline ? '#ef4444' : undefined
              }}
            />
            
            {soportaVoz ? (
              <button 
                className={`chat-ia-mic-btn ${escuchandoVoz ? 'escuchando' : ''} ${!reconocimientoVoz ? 'no-configurado' : ''}`}
                onClick={escuchandoVoz ? detenerReconocimientoVoz : iniciarReconocimientoVoz}
                title={
                  escuchandoVoz 
                    ? 'Detener grabación' 
                    : !reconocimientoVoz 
                      ? 'Configurar y usar micrófono (primera vez)'
                      : 'Hablar con Leyia'
                }
                disabled={cargando}
              >
                {escuchandoVoz ? '🔴' : !reconocimientoVoz ? '🎤⚙️' : '🎤'}
              </button>
            ) : (
              <button 
                className="chat-ia-mic-btn deshabilitado"
                title="Haz clic para verificar soporte de micrófono"
                onClick={inicializarReconocimientoVoz}
              >
                🎤❓
              </button>
            )}
            
            <button 
              className="chat-ia-send-btn"
              onClick={enviarMensaje}
              disabled={!inputMensaje.trim() || cargando || !isOnline}
              title={!isOnline ? "Sin conexión a internet" : "Enviar mensaje"}
            >
              ➤
            </button>
          </div>
        </div>
      )}
      
      {/* Chat Interno */}
      <ChatInterno 
        visible={chatInternoAbierto}
        onClose={() => setChatInternoAbierto(false)}
      />
    </>
  );
}

export default ChatIA;