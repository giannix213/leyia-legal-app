// ChatIAView.js - Vista pura del ChatIA sin lógica de negocio
// Separación completa de presentación y lógica

import React from 'react';
import '../ChatIA.css';

// Componentes de vista pura
const BotonFlotante = ({ 
  posicionBoton, 
  notificacionesPendientes, 
  chatAbierto, 
  onToggleChat, 
  onMouseDown,
  arrastrando 
}) => (
  <div
    className={`leyia-floating-button ${chatAbierto ? 'chat-abierto' : ''} ${arrastrando ? 'arrastrando' : ''}`}
    style={{
      position: 'fixed',
      right: `${posicionBoton.right}px`,
      bottom: `${posicionBoton.bottom}px`,
      zIndex: 1000,
      cursor: arrastrando ? 'grabbing' : 'grab'
    }}
    onClick={onToggleChat}
    onMouseDown={onMouseDown}
  >
    <div className="leyia-icon">🤖</div>
    {notificacionesPendientes > 0 && (
      <div className="notification-badge">{notificacionesPendientes}</div>
    )}
  </div>
);

const VentanaChat = ({ 
  mensajes, 
  inputMensaje, 
  cargando, 
  escuchandoVoz, 
  soportaVoz,
  isOnline,
  onInputChange, 
  onEnviarMensaje, 
  onIniciarVoz, 
  onDetenerVoz,
  onCerrarChat,
  mensajesEndRef 
}) => (
  <div className="leyia-chat-window">
    <div className="leyia-chat-header">
      <div className="leyia-header-info">
        <div className="leyia-avatar">🤖</div>
        <div className="leyia-info">
          <h3>Leyia IA</h3>
          <span className={`status ${isOnline ? 'online' : 'offline'}`}>
            {isOnline ? 'En línea' : 'Sin conexión'}
          </span>
        </div>
      </div>
      <button className="leyia-close-btn" onClick={onCerrarChat}>×</button>
    </div>

    <div className="leyia-chat-messages">
      {mensajes.map((mensaje, index) => (
        <MensajeChat key={index} mensaje={mensaje} />
      ))}
      {cargando && <MensajeCargando />}
      <div ref={mensajesEndRef} />
    </div>

    <div className="leyia-chat-input">
      <div className="input-container">
        <textarea
          value={inputMensaje}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onEnviarMensaje();
            }
          }}
          placeholder={escuchandoVoz ? "Escuchando..." : "Escribe tu consulta..."}
          disabled={cargando || escuchandoVoz || !isOnline}
          className={escuchandoVoz ? 'escuchando' : ''}
        />
        
        <div className="input-actions">
          {soportaVoz && (
            <button
              className={`voice-btn ${escuchandoVoz ? 'listening' : ''}`}
              onClick={escuchandoVoz ? onDetenerVoz : onIniciarVoz}
              disabled={cargando || !isOnline}
              title={escuchandoVoz ? "Detener grabación" : "Usar micrófono"}
            >
              {escuchandoVoz ? '🔴' : '🎤'}
            </button>
          )}
          
          <button
            className="send-btn"
            onClick={onEnviarMensaje}
            disabled={!inputMensaje.trim() || cargando || escuchandoVoz || !isOnline}
            title="Enviar mensaje"
          >
            {cargando ? '⏳' : '📤'}
          </button>
        </div>
      </div>
    </div>
  </div>
);

const MensajeChat = ({ mensaje }) => (
  <div className={`leyia-message ${mensaje.tipo}`}>
    <div className="message-avatar">
      {mensaje.tipo === 'usuario' ? '👤' : '🤖'}
    </div>
    <div className="message-content">
      <div className="message-text">
        {mensaje.texto.split('\n').map((linea, i) => (
          <span key={i}>
            {formatearTextoMensaje(linea)}
            {i < mensaje.texto.split('\n').length - 1 && <br />}
          </span>
        ))}
      </div>
      <div className="message-time">
        {mensaje.timestamp.toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </div>
    </div>
  </div>
);

const MensajeCargando = () => (
  <div className="leyia-message ia">
    <div className="message-avatar">🤖</div>
    <div className="message-content">
      <div className="message-text">
        <div className="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  </div>
);

// Función auxiliar para formatear texto
const formatearTextoMensaje = (texto) => {
  // Formatear texto en negrita
  let textoFormateado = texto.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Formatear emojis y símbolos especiales
  textoFormateado = textoFormateado.replace(/✅/g, '<span class="emoji-success">✅</span>');
  textoFormateado = textoFormateado.replace(/❌/g, '<span class="emoji-error">❌</span>');
  textoFormateado = textoFormateado.replace(/🤔/g, '<span class="emoji-thinking">🤔</span>');
  textoFormateado = textoFormateado.replace(/🧠/g, '<span class="emoji-brain">🧠</span>');
  
  return <span dangerouslySetInnerHTML={{ __html: textoFormateado }} />;
};

// Componente principal de vista
const ChatIAView = ({
  // Estados de datos
  mensajes,
  inputMensaje,
  cargando,
  isOnline,
  
  // Estados de UI
  chatAbierto,
  escuchandoVoz,
  soportaVoz,
  posicionBoton,
  arrastrando,
  notificacionesPendientes,
  
  // Handlers
  onToggleChat,
  onInputChange,
  onEnviarMensaje,
  onIniciarVoz,
  onDetenerVoz,
  onMouseDown,
  
  // Referencias
  mensajesEndRef
}) => {
  return (
    <>
      <BotonFlotante
        posicionBoton={posicionBoton}
        notificacionesPendientes={notificacionesPendientes}
        chatAbierto={chatAbierto}
        onToggleChat={onToggleChat}
        onMouseDown={onMouseDown}
        arrastrando={arrastrando}
      />
      
      {chatAbierto && (
        <VentanaChat
          mensajes={mensajes}
          inputMensaje={inputMensaje}
          cargando={cargando}
          escuchandoVoz={escuchandoVoz}
          soportaVoz={soportaVoz}
          isOnline={isOnline}
          onInputChange={onInputChange}
          onEnviarMensaje={onEnviarMensaje}
          onIniciarVoz={onIniciarVoz}
          onDetenerVoz={onDetenerVoz}
          onCerrarChat={() => onToggleChat(false)}
          mensajesEndRef={mensajesEndRef}
        />
      )}
    </>
  );
};

export default ChatIAView;