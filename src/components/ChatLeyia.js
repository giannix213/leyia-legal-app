import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import IntentionEngine from '../services/IntentionEngine';
import ExpedienteParser from '../services/ExpedienteParser';
import LeyiaAIPro from '../services/LeyiaAIPro';
import { useOrganizacionContext } from '../contexts/OrganizacionContext';
import { useRoles } from '../hooks/useRoles';
import './ChatLeyia.css';

const ChatLeyia = ({ visible, onClose }) => {
  const { usuario } = useOrganizacionContext();
  const { puedeUsarLeyiaIA } = useRoles();
  
  const [mensajes, setMensajes] = useState([]);
  const [inputMensaje, setInputMensaje] = useState('');
  const [casos, setCasos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [reconocimientoVoz, setReconocimientoVoz] = useState(null);
  const [escuchandoVoz, setEscuchandoVoz] = useState(false);
  const [soportaVoz, setSoportaVoz] = useState(false);
  const mensajesEndRef = useRef(null);
  const inicializado = useRef(false);
  
  // Estados para detectar conexión a internet
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  // Inicializar mensaje de bienvenida cuando se abre
  useEffect(() => {
    if (visible && !inicializado.current) {
      const mensajeBienvenida = {
        tipo: 'ia',
        texto: '🤖 **¡Hola! Soy LeyIA, tu asistente legal inteligente.**\n\n💬 **Puedes pedirme:**\n• Actualizar expedientes\n• Programar audiencias\n• Buscar casos\n• Agregar observaciones\n• Consultar información\n\n🎤 **Usa el micrófono para hablar o escribe tu consulta**\n\n¿En qué puedo ayudarte?',
        timestamp: new Date()
      };
      
      setMensajes([mensajeBienvenida]);
      inicializado.current = true;
    }
  }, [visible]);

  // Auto-scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    if (mensajesEndRef.current) {
      mensajesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensajes]);

  // Cargar casos
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

  useEffect(() => {
    if (visible) {
      cargarDatos();
      verificarSoporteVoz();
    }
  }, [visible, cargarDatos]);

  // Verificar soporte de voz
  const verificarSoporteVoz = useCallback(() => {
    const soporteVozDisponible = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    setSoportaVoz(soporteVozDisponible);
    
    if (!soporteVozDisponible) {
      console.log('🎤 Reconocimiento de voz no soportado en este navegador');
    }
  }, []);

  // Función simplificada para procesar mensajes
  const procesarMensajeConIA = useCallback(async (mensaje) => {
    console.log('🤖 LeyIA procesando:', mensaje);
    
    try {
      // Usar LeyIA AI Pro para procesar el mensaje
      const respuesta = await leyiaAIPro.procesarMensaje(mensaje, casos);
      return respuesta;
    } catch (error) {
      console.error('Error procesando mensaje:', error);
      return '❌ Error al procesar tu mensaje. Intenta nuevamente.';
    }
  }, [leyiaAIPro, casos]);

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
    
    setMensajes(prev => [...prev, mensajeUsuario]);
    setInputMensaje('');
    setCargando(true);

    try {
      const respuesta = await procesarMensajeConIA(mensajeActual);
      
      const mensajeIA = {
        tipo: 'ia',
        texto: respuesta,
        timestamp: new Date()
      };
      
      setMensajes(prev => [...prev, mensajeIA]);
    } catch (error) {
      console.error('Error al procesar mensaje:', error);
      
      const mensajeError = {
        tipo: 'ia',
        texto: '❌ Error al procesar tu mensaje. Intenta nuevamente.',
        timestamp: new Date()
      };
      setMensajes(prev => [...prev, mensajeError]);
    } finally {
      setCargando(false);
    }
  }, [inputMensaje, isOnline, procesarMensajeConIA]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  }, [enviarMensaje]);

  // Funciones de reconocimiento de voz (simplificadas)
  const iniciarReconocimientoVoz = useCallback(() => {
    if (!soportaVoz) return;

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'es-ES';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setEscuchandoVoz(true);
        console.log('🎤 Iniciando reconocimiento de voz');
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMensaje(transcript);
        console.log('🎤 Texto reconocido:', transcript);
      };

      recognition.onerror = (event) => {
        console.error('Error en reconocimiento de voz:', event.error);
        setEscuchandoVoz(false);
      };

      recognition.onend = () => {
        setEscuchandoVoz(false);
        console.log('🎤 Reconocimiento de voz finalizado');
      };

      setReconocimientoVoz(recognition);
      recognition.start();
    } catch (error) {
      console.error('Error iniciando reconocimiento de voz:', error);
      setEscuchandoVoz(false);
    }
  }, [soportaVoz]);

  const detenerReconocimientoVoz = useCallback(() => {
    if (reconocimientoVoz) {
      reconocimientoVoz.stop();
      setEscuchandoVoz(false);
    }
  }, [reconocimientoVoz]);

  if (!puedeUsarLeyiaIA || !visible) {
    return null;
  }

  return (
    <div className="chat-leyia-overlay">
      <div className="chat-leyia-container">
        {/* Header */}
        <div className="chat-leyia-header">
          <div className="header-info">
            <div className="header-title">
              🤖 LeyIA - Asistente Legal
            </div>
            <div className="header-status">
              <div className={`status-indicator ${isOnline ? 'conectado' : 'desconectado'}`}></div>
              <span>{isOnline ? 'En línea' : 'Sin conexión'}</span>
            </div>
          </div>
          <button className="chat-leyia-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Mensajes */}
        <div className="chat-leyia-mensajes">
          {mensajes.map((mensaje, index) => (
            <div key={index} className={`mensaje ${mensaje.tipo}`}>
              {mensaje.tipo === 'ia' && (
                <span className="mensaje-avatar">
                  <img src="./leyia.png" alt="LeyIA" className="avatar-leyia" />
                </span>
              )}
              <div className="mensaje-contenido">
                <div 
                  className="mensaje-texto"
                  dangerouslySetInnerHTML={{ 
                    __html: mensaje.texto.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>') 
                  }}
                />
                <div className="mensaje-hora">
                  {mensaje.timestamp.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {mensaje.tipo === 'usuario' && <span className="mensaje-avatar">👤</span>}
            </div>
          ))}
          
          {cargando && (
            <div className="mensaje ia">
              <span className="mensaje-avatar">
                <img src="./leyia.png" alt="LeyIA" className="avatar-leyia" />
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

        {/* Input */}
        <div className="chat-leyia-input-container">
          <textarea
            className="chat-leyia-input"
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
          />
          
          {soportaVoz && (
            <button 
              className={`chat-leyia-mic-btn ${escuchandoVoz ? 'escuchando' : ''}`}
              onClick={escuchandoVoz ? detenerReconocimientoVoz : iniciarReconocimientoVoz}
              title={escuchandoVoz ? 'Detener grabación' : 'Hablar con LeyIA'}
              disabled={cargando || !isOnline}
            >
              {escuchandoVoz ? '🔴' : '🎤'}
            </button>
          )}
          
          <button 
            className="chat-leyia-send-btn"
            onClick={enviarMensaje}
            disabled={!inputMensaje.trim() || cargando || !isOnline}
            title={!isOnline ? "Sin conexión a internet" : "Enviar mensaje"}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatLeyia;