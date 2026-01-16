// ChatIAContainer.js - Contenedor con lógica de negocio del ChatIA
// Separación completa: lógica aquí, vista en ChatIAView

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ChatIAView from '../views/ChatIAView';

// Hooks especializados para lógica de negocio
import { useChatIA } from '../../hooks/useChatIA';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';

const ChatIAContainer = ({ 
  notificacionesPendientes = 0, 
  alertasDisponibles = [], 
  onNotificacionesVistas 
}) => {
  // ===== ESTADOS DE UI =====
  const [chatAbierto, setChatAbierto] = useState(false);
  const [posicionBoton, setPosicionBoton] = useState(() => {
    const posicionGuardada = localStorage.getItem('leyia-boton-posicion');
    return posicionGuardada ? JSON.parse(posicionGuardada) : { bottom: 32, right: 32 };
  });
  const [arrastrando, setArrastrando] = useState(false);
  const [offsetArrastre, setOffsetArrastre] = useState({ x: 0, y: 0 });

  // Referencias
  const mensajesEndRef = useRef(null);

  // ===== HOOKS DE LÓGICA DE NEGOCIO =====
  const {
    mensajes,
    setMensajes,
    inputMensaje,
    setInputMensaje,
    casos,
    setCasos,
    cargando,
    setCargando,
    isOnline,
    motorIntenciones,
    expedienteParser,
    leyiaAIPro,
    buscarCaso,
    cargarDatos,
    limpiarMensajesAntiguos
  } = useChatIA();

  const {
    escuchandoVoz,
    soportaVoz,
    iniciarReconocimientoVoz,
    detenerReconocimientoVoz
  } = useVoiceRecognition(setMensajes, setInputMensaje);

  // ===== LÓGICA DE NEGOCIO =====

  // Inicializar funciones universales
  useEffect(() => {
    const inicializarFuncionesUniversales = () => {
      console.log('🌐 LEYIA - Inicializando funcionalidades universales...');
      
      // Función universal para crear expedientes con parser semántico
      window.crearExpedienteConParserUniversal = async (mensaje) => {
        try {
          console.log('🧠 LEYIA Parser Semántico - Procesando expediente estructurado...');
          
          if (!expedienteParser.esExpedienteEstructurado(mensaje)) {
            console.log('⚠️ No es expediente estructurado, usando método básico');
            return await window.crearExpedienteNuevoUniversal(mensaje);
          }
          
          const resultadoExtraccion = expedienteParser.extraerCampos(mensaje);
          if (!resultadoExtraccion) {
            throw new Error('No se pudo extraer información del expediente');
          }
          
          const datosConvertidos = expedienteParser.convertirAFormatoSistema(resultadoExtraccion);
          if (!datosConvertidos) {
            throw new Error('Error al convertir datos extraídos');
          }
          
          const { expediente, metadatos, partes } = datosConvertidos;
          
          // Verificar si ya existe el expediente
          const limpiarNum = (num) => num.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          const expedienteExistente = casos.find(caso => 
            limpiarNum(caso.numero || '') === limpiarNum(expediente.numero)
          );
          
          // Crear o actualizar en Firebase
          const { addDoc, updateDoc, doc, collection, serverTimestamp } = await import('firebase/firestore');
          const { db } = await import('../../firebase');
          
          expediente.createdAt = serverTimestamp();
          expediente.updatedAt = serverTimestamp();
          
          let docRef, accion;
          
          if (expedienteExistente) {
            await updateDoc(doc(db, 'casos', expedienteExistente.id), expediente);
            docRef = { id: expedienteExistente.id };
            accion = 'actualizado';
          } else {
            docRef = await addDoc(collection(db, 'casos'), expediente);
            accion = 'creado';
          }
          
          // Actualizar estado local
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
          
          // Disparar evento para actualizar otras ventanas
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
      
      // Otras funciones universales...
      console.log('✅ LEYIA UNIVERSAL - Todas las funcionalidades están disponibles');
    };
    
    if (casos.length >= 0) {
      inicializarFuncionesUniversales();
    }
  }, [casos, expedienteParser, setCasos]);

  // Configurar motor de intenciones
  useEffect(() => {
    if (motorIntenciones && expedienteParser) {
      console.log('🔧 Configurando motor de intenciones con parser semántico...');
      
      // Configurar funciones de procesamiento
      motorIntenciones.procesarActualizacionExpedienteExterno = async (mensaje, entidades) => {
        if (entidades.es_informacion_judicial || entidades.numero_expediente) {
          try {
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

      // Más configuraciones del motor...
    }
  }, [motorIntenciones, expedienteParser, buscarCaso]);

  // Procesar mensaje con IA
  const procesarMensajeConIA = useCallback(async (mensaje) => {
    try {
      setCargando(true);
      
      // Usar LEYIA AI PRO
      const externalFunctions = {
        consultarExpediente: async (slots) => {
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
        }
      };
      
      const respuesta = await leyiaAIPro.processMessage(mensaje, externalFunctions);
      return respuesta;
      
    } catch (error) {
      console.error('❌ Error procesando mensaje:', error);
      return 'Lo siento, ocurrió un error al procesar tu mensaje. Intenta nuevamente.';
    } finally {
      setCargando(false);
    }
  }, [leyiaAIPro, buscarCaso, setCargando]);

  // ===== HANDLERS DE UI =====

  const handleToggleChat = useCallback((abrir = null) => {
    if (abrir !== null) {
      setChatAbierto(abrir);
    } else {
      setChatAbierto(prev => !prev);
    }
    
    if (onNotificacionesVistas && notificacionesPendientes > 0) {
      onNotificacionesVistas();
    }
  }, [onNotificacionesVistas, notificacionesPendientes]);

  const handleInputChange = useCallback((valor) => {
    setInputMensaje(valor);
  }, [setInputMensaje]);

  const handleEnviarMensaje = useCallback(async () => {
    if (!inputMensaje.trim() || cargando || !isOnline) return;
    
    const mensajeUsuario = {
      tipo: 'usuario',
      texto: inputMensaje.trim(),
      timestamp: new Date()
    };
    
    setMensajes(prev => [...prev, mensajeUsuario]);
    setInputMensaje('');
    
    // Procesar con IA
    const respuestaIA = await procesarMensajeConIA(inputMensaje.trim());
    
    const mensajeIA = {
      tipo: 'ia',
      texto: respuestaIA,
      timestamp: new Date()
    };
    
    setMensajes(prev => [...prev, mensajeIA]);
    
    // Limpiar mensajes antiguos
    setTimeout(() => {
      limpiarMensajesAntiguos();
    }, 1000);
  }, [inputMensaje, cargando, isOnline, setMensajes, setInputMensaje, procesarMensajeConIA, limpiarMensajesAntiguos]);

  const handleIniciarVoz = useCallback(() => {
    iniciarReconocimientoVoz();
  }, [iniciarReconocimientoVoz]);

  const handleDetenerVoz = useCallback(() => {
    detenerReconocimientoVoz();
  }, [detenerReconocimientoVoz]);

  // Manejo de arrastre del botón
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    setArrastrando(true);
    const boton = e.currentTarget;
    const rect = boton.getBoundingClientRect();
    setOffsetArrastre({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!arrastrando) return;
    const x = e.clientX - offsetArrastre.x;
    const y = e.clientY - offsetArrastre.y;
    const right = window.innerWidth - x - 64;
    const bottom = window.innerHeight - y - 64;
    const rightLimitado = Math.max(10, Math.min(right, window.innerWidth - 74));
    const bottomLimitado = Math.max(10, Math.min(bottom, window.innerHeight - 74));
    setPosicionBoton({ right: rightLimitado, bottom: bottomLimitado });
  }, [arrastrando, offsetArrastre]);

  const handleMouseUp = useCallback(() => {
    if (arrastrando) {
      setArrastrando(false);
      localStorage.setItem('leyia-boton-posicion', JSON.stringify(posicionBoton));
    }
  }, [arrastrando, posicionBoton]);

  // Efectos para manejo de arrastre
  useEffect(() => {
    if (arrastrando) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [arrastrando, handleMouseMove, handleMouseUp]);

  // Scroll automático a mensajes nuevos
  useEffect(() => {
    if (mensajesEndRef.current) {
      mensajesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensajes]);

  // Mostrar notificaciones cuando hay alertas
  useEffect(() => {
    if (notificacionesPendientes > 0 && !chatAbierto) {
      const mensajeAlerta = {
        tipo: 'ia',
        texto: `🎉 ¡Tengo ${notificacionesPendientes} ${notificacionesPendientes === 1 ? 'notificación importante' : 'notificaciones importantes'} para ti!\n\n${alertasDisponibles.map(a => `✅ Caso ${a.caso}: ${a.descripcion}\n   Ya puedes actuar desde el ${a.fechaDisponible}`).join('\n\n')}\n\nHaz clic en el botón de notificaciones para ver más detalles.`,
        timestamp: new Date()
      };
      setMensajes(prev => [...prev, mensajeAlerta]);
    }
  }, [notificacionesPendientes, alertasDisponibles, chatAbierto, setMensajes]);

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // ===== RENDER =====
  return (
    <ChatIAView
      // Estados de datos
      mensajes={mensajes}
      inputMensaje={inputMensaje}
      cargando={cargando}
      isOnline={isOnline}
      
      // Estados de UI
      chatAbierto={chatAbierto}
      escuchandoVoz={escuchandoVoz}
      soportaVoz={soportaVoz}
      posicionBoton={posicionBoton}
      arrastrando={arrastrando}
      notificacionesPendientes={notificacionesPendientes}
      
      // Handlers
      onToggleChat={handleToggleChat}
      onInputChange={handleInputChange}
      onEnviarMensaje={handleEnviarMensaje}
      onIniciarVoz={handleIniciarVoz}
      onDetenerVoz={handleDetenerVoz}
      onMouseDown={handleMouseDown}
      
      // Referencias
      mensajesEndRef={mensajesEndRef}
    />
  );
};

export default ChatIAContainer;