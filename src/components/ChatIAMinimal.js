import React, { useState, useEffect, useRef, useCallback } from 'react';
import OpenAIService from '../services/OpenAIService';
import { useOrganizacionContext } from '../contexts/OrganizacionContext';
import { useCasos } from '../hooks/useCasos';
import './ChatIA.css';

function ChatIAMinimal({ notificacionesPendientes = 0, onNotificacionesVistas }) {
  const { organizacionActual } = useOrganizacionContext();
  const { agregarCaso } = useCasos();
  
  const [mensajes, setMensajes] = useState([]);
  const [inputMensaje, setInputMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const [chatAbierto, setChatAbierto] = useState(false);
  const [posicionBoton, setPosicionBoton] = useState(() => {
    const posicionGuardada = localStorage.getItem('leyia-boton-posicion');
    return posicionGuardada ? JSON.parse(posicionGuardada) : { bottom: 32, right: 32 };
  });
  const [arrastrando, setArrastrando] = useState(false);
  const [offsetArrastre, setOffsetArrastre] = useState({ x: 0, y: 0 });
  const [openAIService, setOpenAIService] = useState(null);
  const mensajesEndRef = useRef(null);
  const inicializado = useRef(false);

  // Inicializar OpenAI Service
  useEffect(() => {
    try {
      const openAI = new OpenAIService();
      setOpenAIService(openAI);
      console.log('🤖 OpenAI Service inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando OpenAI Service:', error);
      
      // Mostrar mensaje de error en el chat
      const mensajeError = {
        tipo: 'ia',
        texto: '❌ **Error de configuración de OpenAI**\n\nNo se pudo inicializar el servicio de OpenAI. Verifica que la API key esté configurada correctamente en el archivo .env\n\n🔧 **Solución:**\n• Verifica que REACT_APP_OPENAI_API_KEY esté configurada\n• Recarga la página después de configurar la API key',
        timestamp: new Date()
      };
      
      setMensajes(prev => [...prev, mensajeError]);
    }
  }, []);

  // Inicializar mensaje de bienvenida
  useEffect(() => {
    if (!inicializado.current) {
      const mensajeBienvenida = {
        tipo: 'ia',
        texto: '👋 **¡Hola! Soy LEYIA, tu asistente jurídico con IA**\n\n🤖 **Powered by OpenAI GPT-4**\n\n💬 **Puedes preguntarme sobre:**\n• Consultas legales generales\n• Análisis de documentos\n• Redacción de escritos\n• Investigación jurídica\n\n🏗️ **CREACIÓN INTELIGENTE DE EXPEDIENTES:**\n• "Crear expediente para [Cliente], caso de [tipo]"\n• "Nuevo caso laboral para María García, despido injustificado"\n• "Crear caso penal, robo agravado, imputado Juan López"\n• "Registrar expediente de divorcio para Ana Martínez"\n\n✨ **¡Estoy aquí para ayudarte con IA avanzada de OpenAI!**',
        timestamp: new Date()
      };
      setMensajes([mensajeBienvenida]);
      inicializado.current = true;
    }
  }, []);

  // Auto-scroll al final de los mensajes
  useEffect(() => {
    if (mensajesEndRef.current) {
      mensajesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensajes]);

  // Función para detectar y procesar comandos de creación de expedientes con OpenAI
  const procesarComandoExpediente = useCallback(async (mensaje) => {
    console.log('🤖 Procesando comando de expediente con OpenAI');
    
    if (!openAIService) {
      return {
        tipo: 'error',
        mensaje: '❌ **Error de servicio**\n\nEl servicio de OpenAI no está disponible. Verifica la configuración.'
      };
    }
    
    if (!organizacionActual?.id) {
      return {
        tipo: 'error',
        mensaje: '❌ **Error de organización**\n\nNo hay una organización activa. No puedo crear expedientes sin una organización válida.'
      };
    }

    try {
      // Usar OpenAI Service para procesar el mensaje
      const resultado = await openAIService.procesarMensaje(mensaje);
      
      if (!resultado.success) {
        throw new Error(resultado.error);
      }

      if (resultado.tipo === 'creacion_caso') {
        console.log('📋 OpenAI detectó comando de creación de caso');
        
        // Validar datos extraídos
        const validacion = openAIService.validarDatosCaso(resultado.datos);
        
        if (!validacion.valido) {
          return {
            tipo: 'error',
            mensaje: `❌ **Información insuficiente**\n\n${validacion.errores.join('\n')}\n\n**Ejemplo:** "Crear expediente para Juan Pérez, caso de divorcio, expediente 123-2024"`
          };
        }

        // Completar datos faltantes
        const datosCompletos = openAIService.completarDatosCaso(resultado.datos);
        console.log('📊 Datos completados para crear caso:', datosCompletos);

        // Crear el expediente usando el hook existente
        const resultadoCreacion = await agregarCaso(datosCompletos);
        
        if (resultadoCreacion.success) {
          return {
            tipo: 'exito',
            mensaje: `✅ **¡Expediente creado exitosamente con OpenAI!**\n\n📋 **Detalles del expediente:**\n• **Número:** ${datosCompletos.numero}\n• **Cliente:** ${datosCompletos.cliente}\n• **Tipo:** ${datosCompletos.tipo.toUpperCase()}\n• **Estado:** ${datosCompletos.estado}\n• **Prioridad:** ${datosCompletos.prioridad}\n\n🤖 **Procesado con IA avanzada:**\n• Datos extraídos automáticamente por OpenAI GPT-4\n• Campos completados inteligentemente\n• Validación automática de información\n\n🎯 **El expediente ya está disponible en la sección "Expedientes"**\n\n💡 **Tip:** Puedes pedirme que cree más expedientes con información más detallada.`,
            expedienteCreado: datosCompletos
          };
        } else {
          throw new Error('Error al crear el expediente en la base de datos');
        }
      } else {
        // No es comando de creación, devolver null para procesamiento normal
        return null;
      }
      
    } catch (error) {
      console.error('❌ Error procesando comando de expediente con OpenAI:', error);
      
      let mensajeError = '❌ **Error creando expediente con OpenAI**\n\n';
      
      if (error.message?.includes('API Key')) {
        mensajeError += 'Error de configuración de OpenAI. Verifica que la API key esté configurada correctamente.';
      } else if (error.message?.includes('JSON')) {
        mensajeError += 'Error procesando los datos del expediente. Intenta ser más específico con la información.';
      } else if (error.message?.includes('organización')) {
        mensajeError += 'No hay una organización activa para crear el expediente.';
      } else {
        mensajeError += `Error: ${error.message || 'No pude crear el expediente. Intenta nuevamente.'}`;
      }
      
      mensajeError += '\n\n**Formato sugerido:** "Crear expediente para [Cliente], caso de [tipo], expediente [número]"';
      
      return {
        tipo: 'error',
        mensaje: mensajeError
      };
    }
  }, [openAIService, organizacionActual, agregarCaso]);
  // Función para enviar mensaje a OpenAI
  const enviarMensajeOpenAI = useCallback(async (mensaje) => {
    console.log('📤 Enviando mensaje a OpenAI:', mensaje);
    
    if (!openAIService) {
      console.error('❌ OpenAI Service no está inicializado');
      const mensajeError = {
        tipo: 'ia',
        texto: '❌ **Error de configuración**\n\nEl servicio de OpenAI no está disponible. Verifica la configuración de la API key.',
        timestamp: new Date()
      };
      setMensajes(prev => [...prev, mensajeError]);
      return;
    }

    setCargando(true);

    try {
      // Primero verificar si es un comando de creación de expediente
      const resultadoComando = await procesarComandoExpediente(mensaje);
      
      if (resultadoComando) {
        // Es un comando de expediente, mostrar el resultado
        const mensajeRespuesta = {
          tipo: 'ia',
          texto: resultadoComando.mensaje,
          timestamp: new Date(),
          esComandoExpediente: true,
          expedienteCreado: resultadoComando.expedienteCreado || null,
          servicioUsado: 'OpenAI'
        };
        
        setMensajes(prev => [...prev, mensajeRespuesta]);
        return;
      }

      // Si no es comando de expediente, procesar como consulta general con OpenAI
      console.log('🤖 Procesando consulta general con OpenAI');
      const resultado = await openAIService.procesarMensaje(mensaje, mensajes.slice(-5));
      
      if (resultado.success && resultado.tipo === 'consulta_general') {
        const mensajeRespuesta = {
          tipo: 'ia',
          texto: resultado.respuesta,
          timestamp: new Date(),
          servicioUsado: 'OpenAI'
        };
        
        setMensajes(prev => [...prev, mensajeRespuesta]);
      } else {
        throw new Error(resultado.error || 'Error procesando consulta general');
      }

    } catch (error) {
      console.error('❌ Error detallado al comunicarse con OpenAI:', error);
      
      let mensajeError = '❌ **Error de comunicación con OpenAI**\n\n';
      
      if (error.message?.includes('API Key') || error.message?.includes('401')) {
        mensajeError += 'La API key de OpenAI no es válida o no está configurada correctamente.\n\n🔧 **Solución:**\n• Verifica que REACT_APP_OPENAI_API_KEY esté en el archivo .env\n• Asegúrate de que la API key sea válida\n• Recarga la página después de configurar';
      } else if (error.message?.includes('429') || error.message?.includes('QUOTA_EXCEEDED')) {
        mensajeError += 'Se ha excedido la cuota de uso de OpenAI.\n\n💡 **Soluciones:**\n• Verifica tu plan de OpenAI\n• Intenta nuevamente más tarde\n• Revisa el uso en tu dashboard de OpenAI';
      } else if (error.message?.includes('500')) {
        mensajeError += 'Error interno de OpenAI. Intenta nuevamente en unos momentos.';
      } else {
        mensajeError += `Error: ${error.message || 'No pude procesar tu consulta. Por favor, intenta nuevamente.'}`;
      }
      
      const mensajeErrorObj = {
        tipo: 'ia',
        texto: mensajeError,
        timestamp: new Date(),
        servicioUsado: 'Error'
      };
      setMensajes(prev => [...prev, mensajeErrorObj]);
    } finally {
      setCargando(false);
    }
  }, [openAIService, procesarComandoExpediente, mensajes]);

  // Manejar envío de mensaje
  const manejarEnvio = useCallback(async (e) => {
    e.preventDefault();
    
    if (!inputMensaje.trim() || cargando) return;

    const mensajeUsuario = {
      tipo: 'usuario',
      texto: inputMensaje.trim(),
      timestamp: new Date()
    };

    setMensajes(prev => [...prev, mensajeUsuario]);
    const mensajeParaEnviar = inputMensaje.trim();
    setInputMensaje('');

    await enviarMensajeOpenAI(mensajeParaEnviar);
  }, [inputMensaje, cargando, enviarMensajeOpenAI]);

  // Funciones de drag and drop
  const iniciarArrastre = useCallback((e) => {
    setArrastrando(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setOffsetArrastre({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, []);

  const manejarArrastre = useCallback((e) => {
    if (!arrastrando) return;

    const nuevaPosicion = {
      right: window.innerWidth - e.clientX + offsetArrastre.x - 28,
      bottom: window.innerHeight - e.clientY + offsetArrastre.y - 28
    };

    // Limitar a los bordes de la pantalla
    nuevaPosicion.right = Math.max(16, Math.min(window.innerWidth - 72, nuevaPosicion.right));
    nuevaPosicion.bottom = Math.max(16, Math.min(window.innerHeight - 72, nuevaPosicion.bottom));

    setPosicionBoton(nuevaPosicion);
  }, [arrastrando, offsetArrastre]);

  const finalizarArrastre = useCallback(() => {
    if (arrastrando) {
      setArrastrando(false);
      localStorage.setItem('leyia-boton-posicion', JSON.stringify(posicionBoton));
    }
  }, [arrastrando, posicionBoton]);

  // Event listeners para drag and drop
  useEffect(() => {
    if (arrastrando) {
      document.addEventListener('mousemove', manejarArrastre);
      document.addEventListener('mouseup', finalizarArrastre);
      return () => {
        document.removeEventListener('mousemove', manejarArrastre);
        document.removeEventListener('mouseup', finalizarArrastre);
      };
    }
  }, [arrastrando, manejarArrastre, finalizarArrastre]);

  // Formatear mensaje con markdown básico
  const formatearMensaje = (texto) => {
    return texto
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <>
      {/* Estilos CSS para animaciones */}
      <style>
        {`
          @keyframes pulse {
            0%, 80%, 100% {
              opacity: 0.3;
              transform: scale(0.8);
            }
            40% {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}
      </style>

      {/* Botón flotante - Burbuja circular pequeña */}
      <div
        style={{
          position: 'fixed',
          bottom: `${posicionBoton.bottom}px`,
          right: `${posicionBoton.right}px`,
          zIndex: 9999,
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#4f46e5',
          boxShadow: '0 4px 20px rgba(79, 70, 229, 0.4)',
          cursor: arrastrando ? 'grabbing' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          border: '3px solid rgba(255, 255, 255, 0.2)',
          overflow: 'hidden'
        }}
        onMouseDown={iniciarArrastre}
        onClick={() => !arrastrando && setChatAbierto(!chatAbierto)}
        onMouseEnter={(e) => {
          if (!arrastrando) {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 6px 25px rgba(79, 70, 229, 0.6)';
          }
        }}
        onMouseLeave={(e) => {
          if (!arrastrando) {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(79, 70, 229, 0.4)';
          }
        }}
      >
        <img 
          src="./leyia.png" 
          alt="LEYIA" 
          style={{
            width: '45px',
            height: '45px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid rgba(255, 255, 255, 0.3)'
          }}
          draggable={false}
        />
        
        {notificacionesPendientes > 0 && (
          <div style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            backgroundColor: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 'bold',
            border: '2px solid white',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
          }}>
            {notificacionesPendientes > 99 ? '99+' : notificacionesPendientes}
          </div>
        )}
        
        {/* Tooltip */}
        <div style={{
          position: 'absolute',
          bottom: '70px',
          right: '0',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: '500',
          whiteSpace: 'nowrap',
          opacity: '0',
          visibility: 'hidden',
          transition: 'opacity 0.3s ease, visibility 0.3s ease',
          pointerEvents: 'none',
          zIndex: 10000
        }}>
          LEYIA - Asistente Jurídico IA
          <div style={{
            position: 'absolute',
            top: '100%',
            right: '20px',
            width: '0',
            height: '0',
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid rgba(0, 0, 0, 0.8)'
          }} />
        </div>
      </div>

      {/* Ventana de chat flotante */}
      {chatAbierto && (
        <div style={{
          position: 'fixed',
          bottom: `${posicionBoton.bottom + 80}px`,
          right: `${posicionBoton.right}px`,
          width: '350px',
          height: '500px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          zIndex: 9998,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Header del chat */}
          <div style={{
            backgroundColor: '#4f46e5',
            color: 'white',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid rgba(255, 255, 255, 0.3)'
              }}>
                <img 
                  src="./leyia.png" 
                  alt="LEYIA" 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>LEYIA</h3>
                <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>Asistente Jurídico IA</p>
              </div>
            </div>
            <button 
              onClick={() => setChatAbierto(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              ×
            </button>
          </div>

          {/* Área de mensajes */}
          <div style={{
            flex: 1,
            padding: '16px',
            overflowY: 'auto',
            backgroundColor: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {mensajes.map((mensaje, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: mensaje.tipo === 'usuario' ? 'flex-end' : 'flex-start'
              }}>
                <div style={{
                  maxWidth: '80%',
                  padding: '12px 16px',
                  borderRadius: '18px',
                  backgroundColor: mensaje.tipo === 'usuario' ? '#4f46e5' : '#ffffff',
                  color: mensaje.tipo === 'usuario' ? 'white' : '#1f2937',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  fontSize: '14px',
                  lineHeight: '1.4',
                  border: mensaje.tipo === 'ia' ? '1px solid #e5e7eb' : 'none',
                  borderLeft: mensaje.esComandoExpediente ? '4px solid #10b981' : 'none'
                }}>
                  <div dangerouslySetInnerHTML={{ 
                    __html: formatearMensaje(mensaje.texto) 
                  }} />
                  {mensaje.expedienteCreado && (
                    <div style={{
                      marginTop: '8px',
                      padding: '8px',
                      backgroundColor: '#f0fdf4',
                      borderRadius: '8px',
                      border: '1px solid #bbf7d0',
                      fontSize: '12px'
                    }}>
                      <strong>🎯 Expediente creado:</strong> {mensaje.expedienteCreado.numero}
                    </div>
                  )}
                  <div style={{
                    fontSize: '11px',
                    opacity: 0.7,
                    marginTop: '4px',
                    textAlign: 'right'
                  }}>
                    {mensaje.timestamp.toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            ))}
            
            {cargando && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '18px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#4f46e5',
                      animation: 'pulse 1.5s ease-in-out infinite'
                    }} />
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#4f46e5',
                      animation: 'pulse 1.5s ease-in-out infinite 0.2s'
                    }} />
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#4f46e5',
                      animation: 'pulse 1.5s ease-in-out infinite 0.4s'
                    }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={mensajesEndRef} />
          </div>

          {/* Input de mensaje */}
          <form onSubmit={manejarEnvio} style={{
            padding: '16px',
            backgroundColor: '#ffffff',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            gap: '8px'
          }}>
            <input
              type="text"
              value={inputMensaje}
              onChange={(e) => setInputMensaje(e.target.value)}
              placeholder="Escribe tu consulta jurídica..."
              disabled={cargando}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '24px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: cargando ? '#f3f4f6' : '#ffffff'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
            <button 
              type="submit" 
              disabled={cargando || !inputMensaje.trim()}
              style={{
                padding: '12px 16px',
                backgroundColor: (cargando || !inputMensaje.trim()) ? '#d1d5db' : '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '24px',
                cursor: (cargando || !inputMensaje.trim()) ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                minWidth: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {cargando ? '⏳' : '📤'}
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default ChatIAMinimal;