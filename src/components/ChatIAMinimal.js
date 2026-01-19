import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import './ChatIA.css';

function ChatIAMinimal({ notificacionesPendientes = 0, onNotificacionesVistas }) {
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
  const [geminiAPI, setGeminiAPI] = useState(null);
  const mensajesEndRef = useRef(null);
  const inicializado = useRef(false);

  // Inicializar Gemini API
  useEffect(() => {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    console.log('🔑 API Key disponible:', !!apiKey);
    
    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // Usar modelo disponible en v1beta
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        setGeminiAPI(model);
        console.log('🤖 Gemini API inicializada correctamente con modelo gemini-pro');
      } catch (error) {
        console.error('❌ Error inicializando Gemini API:', error);
      }
    } else {
      console.error('❌ No se encontró la API key de Gemini');
    }
  }, []);

  // Inicializar mensaje de bienvenida
  useEffect(() => {
    if (!inicializado.current) {
      const mensajeBienvenida = {
        tipo: 'ia',
        texto: '👋 **¡Hola! Soy LEYIA, tu asistente jurídico con IA**\n\n🤖 **Powered by Google Gemini**\n\n💬 Puedes preguntarme sobre:\n• Consultas legales generales\n• Análisis de documentos\n• Redacción de escritos\n• Investigación jurídica\n\n✨ **¡Estoy aquí para ayudarte!**',
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

  // Función para enviar mensaje a Gemini
  const enviarMensajeGemini = useCallback(async (mensaje) => {
    console.log('📤 Enviando mensaje a Gemini:', mensaje);
    
    if (!geminiAPI) {
      console.error('❌ Gemini API no está inicializada');
      const mensajeError = {
        tipo: 'ia',
        texto: '❌ **Error de configuración**\n\nLa API de Gemini no está disponible. Verifica la configuración.',
        timestamp: new Date()
      };
      setMensajes(prev => [...prev, mensajeError]);
      return;
    }

    setCargando(true);

    try {
      // Contexto jurídico más simple para Gemini
      const prompt = `Eres LEYIA, un asistente jurídico especializado. Responde de manera profesional y precisa sobre temas legales. Si no estás seguro de algo, indícalo claramente. Usa un lenguaje claro pero técnicamente correcto.

Pregunta: ${mensaje}`;

      console.log('🔄 Enviando prompt a Gemini...');
      const result = await geminiAPI.generateContent(prompt);
      console.log('✅ Respuesta recibida de Gemini');
      
      const response = await result.response;
      const respuestaIA = response.text();
      
      console.log('📝 Texto de respuesta:', respuestaIA);

      const mensajeRespuesta = {
        tipo: 'ia',
        texto: respuestaIA,
        timestamp: new Date()
      };

      setMensajes(prev => [...prev, mensajeRespuesta]);
    } catch (error) {
      console.error('❌ Error detallado al comunicarse con Gemini:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      
      let mensajeError = '❌ **Error de comunicación**\n\n';
      
      if (error.message?.includes('API_KEY_INVALID')) {
        mensajeError += 'La API key de Gemini no es válida.';
      } else if (error.message?.includes('QUOTA_EXCEEDED')) {
        mensajeError += 'Se ha excedido la cuota de la API de Gemini.';
      } else if (error.message?.includes('MODEL_NOT_FOUND')) {
        mensajeError += 'El modelo de Gemini no está disponible.';
      } else {
        mensajeError += `Error: ${error.message || 'No pude procesar tu consulta. Por favor, intenta nuevamente.'}`;
      }
      
      const mensajeErrorObj = {
        tipo: 'ia',
        texto: mensajeError,
        timestamp: new Date()
      };
      setMensajes(prev => [...prev, mensajeErrorObj]);
    } finally {
      setCargando(false);
    }
  }, [geminiAPI]);

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

    await enviarMensajeGemini(mensajeParaEnviar);
  }, [inputMensaje, cargando, enviarMensajeGemini]);

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
                  border: mensaje.tipo === 'ia' ? '1px solid #e5e7eb' : 'none'
                }}>
                  <div dangerouslySetInnerHTML={{ 
                    __html: formatearMensaje(mensaje.texto) 
                  }} />
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