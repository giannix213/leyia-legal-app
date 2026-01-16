import React, { useState, useRef, useEffect } from 'react';
import { useChatInterno, TIPOS_MENSAJE } from '../hooks/useChatInterno';
import { useRoles } from '../hooks/useRoles';
import { useOrganizacionContext } from '../contexts/OrganizacionContext';
import ChatLeyia from './ChatLeyia';
import './ChatInterno.css';

const ChatInterno = ({ visible, onClose }) => {
  const { usuario } = useOrganizacionContext();
  const { puedeUsarChatInterno, puedeUsarLeyiaIA } = useRoles();
  const {
    mensajes,
    cargando,
    conectado,
    mensajesNoLeidos,
    enviarMensaje,
    marcarComoLeido
  } = useChatInterno();

  const [inputMensaje, setInputMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [chatLeyiaAbierto, setChatLeyiaAbierto] = useState(false);
  const mensajesEndRef = useRef(null);

  // Auto-scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    if (mensajesEndRef.current) {
      mensajesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensajes]);

  // Marcar mensajes como leídos cuando se abre el chat
  useEffect(() => {
    if (visible && mensajesNoLeidos.length > 0) {
      mensajesNoLeidos.forEach(mensaje => {
        marcarComoLeido(mensaje.id);
      });
    }
  }, [visible, mensajesNoLeidos, marcarComoLeido]);

  const handleEnviarMensaje = async (e) => {
    e.preventDefault();
    
    if (!inputMensaje.trim() || enviando) return;

    setEnviando(true);
    const exito = await enviarMensaje(inputMensaje);
    
    if (exito) {
      setInputMensaje('');
    }
    
    setEnviando(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviarMensaje(e);
    }
  };

  const obtenerAvatarMensaje = (mensaje) => {
    switch (mensaje.tipo) {
      case TIPOS_MENSAJE.LEYIA:
        return <img src="./leyia.png" alt="LeyIA" className="avatar-leyia" />;
      case TIPOS_MENSAJE.SISTEMA:
        return <div className="avatar-sistema">⚙️</div>;
      case TIPOS_MENSAJE.ALERTA:
        return <div className="avatar-alerta">🚨</div>;
      default:
        return <div className="avatar-usuario">{mensaje.autor.nombre?.charAt(0) || '👤'}</div>;
    }
  };

  const obtenerColorAutor = (mensaje) => {
    if (mensaje.tipo === TIPOS_MENSAJE.LEYIA) return '#4f46e5';
    if (mensaje.tipo === TIPOS_MENSAJE.SISTEMA) return '#6b7280';
    if (mensaje.tipo === TIPOS_MENSAJE.ALERTA) return '#dc2626';
    
    // Color basado en el rol del usuario
    const colores = {
      admin: '#dc2626',
      abogado: '#2563eb',
      asistente: '#16a34a',
      cliente: '#7c3aed'
    };
    
    return colores[mensaje.autor.role] || '#6b7280';
  };

  const formatearMensaje = (texto) => {
    // Convertir markdown básico a HTML
    return texto
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  };

  if (!puedeUsarChatInterno) {
    return null;
  }

  if (!visible) {
    return null;
  }

  return (
    <div className="chat-interno-overlay">
      <div className="chat-interno-container">
        {/* Header */}
        <div className="chat-interno-header">
          <div className="header-info">
            <div className="header-title">
              💬 Chat Interno
              {mensajesNoLeidos.length > 0 && (
                <span className="mensajes-no-leidos">{mensajesNoLeidos.length}</span>
              )}
            </div>
            <div className="header-status">
              <div className={`status-indicator ${conectado ? 'conectado' : 'desconectado'}`}></div>
              <span>{conectado ? 'Conectado' : 'Desconectado'}</span>
            </div>
          </div>
          
          <div className="header-actions">
            {puedeUsarLeyiaIA && (
              <button 
                className="chat-leyia-btn"
                onClick={() => setChatLeyiaAbierto(true)}
                title="Hablar con LeyIA"
              >
                🤖
              </button>
            )}
            <button className="chat-interno-close" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* Mensajes */}
        <div className="chat-interno-mensajes">
          {cargando ? (
            <div className="chat-loading">
              <div className="loading-spinner"></div>
              <span>Cargando mensajes...</span>
            </div>
          ) : mensajes.length === 0 ? (
            <div className="chat-vacio">
              <div className="vacio-icon">💬</div>
              <h3>¡Bienvenido al Chat Interno!</h3>
              <p>Este es el espacio de comunicación de tu organización.</p>
              <p>Aquí recibirás alertas de LeyIA y podrás comunicarte con tu equipo.</p>
            </div>
          ) : (
            mensajes.map((mensaje) => (
              <div 
                key={mensaje.id} 
                className={`mensaje ${mensaje.tipo} ${
                  mensaje.autor.id === (usuario?.uid || usuario?.id) ? 'propio' : 'ajeno'
                }`}
              >
                <div className="mensaje-avatar">
                  {obtenerAvatarMensaje(mensaje)}
                </div>
                
                <div className="mensaje-contenido">
                  <div className="mensaje-header">
                    <span 
                      className="mensaje-autor"
                      style={{ color: obtenerColorAutor(mensaje) }}
                    >
                      {mensaje.autor.nombre}
                    </span>
                    <span className="mensaje-timestamp">
                      {mensaje.timestamp.toLocaleTimeString('es-PE', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  
                  <div 
                    className="mensaje-texto"
                    dangerouslySetInnerHTML={{ 
                      __html: formatearMensaje(mensaje.texto) 
                    }}
                  />
                  
                  {mensaje.metadata?.tipoAlerta && (
                    <div className="mensaje-metadata">
                      <span className="alerta-tipo">
                        {mensaje.metadata.tipoAlerta}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={mensajesEndRef} />
        </div>

        {/* Input */}
        <div className="chat-interno-input-container">
          <form onSubmit={handleEnviarMensaje} className="input-form">
            <textarea
              className="chat-interno-input"
              placeholder="Escribe tu mensaje..."
              value={inputMensaje}
              onChange={(e) => setInputMensaje(e.target.value)}
              onKeyPress={handleKeyPress}
              rows="1"
              disabled={enviando || !conectado}
            />
            <button 
              type="submit"
              className="chat-interno-send"
              disabled={!inputMensaje.trim() || enviando || !conectado}
            >
              {enviando ? '⏳' : '➤'}
            </button>
          </form>
        </div>
      </div>
      
      {/* Chat LeyIA */}
      {chatLeyiaAbierto && (
        <ChatLeyia 
          visible={chatLeyiaAbierto}
          onClose={() => setChatLeyiaAbierto(false)}
        />
      )}
    </div>
  );
};

export default ChatInterno;