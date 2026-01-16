import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  limit,
  doc,
  updateDoc
} from 'firebase/firestore';
import { useOrganizacionContext } from '../contexts/OrganizacionContext';

export const TIPOS_MENSAJE = {
  USUARIO: 'usuario',
  LEYIA: 'leyia',
  SISTEMA: 'sistema',
  ALERTA: 'alerta'
};

export const useChatInterno = () => {
  const { organizacionActual, usuario } = useOrganizacionContext();
  const [mensajes, setMensajes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [conectado, setConectado] = useState(false);
  const [usuariosOnline, setUsuariosOnline] = useState([]);

  // Escuchar mensajes en tiempo real
  useEffect(() => {
    if (!organizacionActual?.id) {
      setMensajes([]);
      setConectado(false);
      return;
    }

    setCargando(true);
    setConectado(true);

    const mensajesQuery = query(
      collection(db, 'chatInterno'),
      where('organizacionId', '==', organizacionActual.id),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(mensajesQuery, (snapshot) => {
      const mensajesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));

      // Ordenar por timestamp ascendente para mostrar cronológicamente
      mensajesData.sort((a, b) => a.timestamp - b.timestamp);
      
      setMensajes(mensajesData);
      setCargando(false);
    }, (error) => {
      console.error('Error escuchando mensajes del chat:', error);
      setCargando(false);
      setConectado(false);
    });

    return () => unsubscribe();
  }, [organizacionActual?.id]);

  // Enviar mensaje de usuario
  const enviarMensaje = useCallback(async (texto) => {
    if (!organizacionActual?.id || !usuario || !texto.trim()) {
      return false;
    }

    try {
      const mensaje = {
        organizacionId: organizacionActual.id,
        tipo: TIPOS_MENSAJE.USUARIO,
        texto: texto.trim(),
        autor: {
          id: usuario.uid || usuario.id,
          nombre: usuario.displayName || usuario.name || 'Usuario',
          email: usuario.email,
          role: usuario.role || 'asistente'
        },
        timestamp: serverTimestamp(),
        leido: false
      };

      await addDoc(collection(db, 'chatInterno'), mensaje);
      return true;
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      return false;
    }
  }, [organizacionActual?.id, usuario]);

  // Enviar mensaje de Leyia (sistema)
  const enviarMensajeLeyia = useCallback(async (texto, tipoAlerta = null) => {
    if (!organizacionActual?.id || !texto.trim()) {
      return false;
    }

    try {
      const mensaje = {
        organizacionId: organizacionActual.id,
        tipo: tipoAlerta ? TIPOS_MENSAJE.ALERTA : TIPOS_MENSAJE.LEYIA,
        texto: texto.trim(),
        autor: {
          id: 'leyia-system',
          nombre: 'LeyIA',
          email: 'system@leyia.ai',
          role: 'system'
        },
        timestamp: serverTimestamp(),
        leido: false,
        metadata: tipoAlerta ? { tipoAlerta } : null
      };

      await addDoc(collection(db, 'chatInterno'), mensaje);
      return true;
    } catch (error) {
      console.error('Error enviando mensaje de Leyia:', error);
      return false;
    }
  }, [organizacionActual?.id]);

  // Enviar mensaje del sistema
  const enviarMensajeSistema = useCallback(async (texto, metadata = null) => {
    if (!organizacionActual?.id || !texto.trim()) {
      return false;
    }

    try {
      const mensaje = {
        organizacionId: organizacionActual.id,
        tipo: TIPOS_MENSAJE.SISTEMA,
        texto: texto.trim(),
        autor: {
          id: 'system',
          nombre: 'Sistema',
          email: 'system@leyia.ai',
          role: 'system'
        },
        timestamp: serverTimestamp(),
        leido: false,
        metadata
      };

      await addDoc(collection(db, 'chatInterno'), mensaje);
      return true;
    } catch (error) {
      console.error('Error enviando mensaje del sistema:', error);
      return false;
    }
  }, [organizacionActual?.id]);

  // Marcar mensaje como leído
  const marcarComoLeido = useCallback(async (mensajeId) => {
    if (!mensajeId) return false;

    try {
      await updateDoc(doc(db, 'chatInterno', mensajeId), {
        leido: true,
        fechaLectura: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error marcando mensaje como leído:', error);
      return false;
    }
  }, []);

  // Obtener mensajes no leídos
  const mensajesNoLeidos = mensajes.filter(mensaje => 
    !mensaje.leido && 
    mensaje.autor.id !== (usuario?.uid || usuario?.id)
  );

  // Obtener último mensaje
  const ultimoMensaje = mensajes.length > 0 ? mensajes[mensajes.length - 1] : null;

  // Funciones de utilidad para alertas automáticas
  const enviarAlertaExpediente = useCallback(async (numeroExpediente, tipoAlerta, descripcion) => {
    const texto = `🚨 **Alerta de Expediente ${numeroExpediente}**\n\n` +
                  `📋 **Tipo:** ${tipoAlerta}\n` +
                  `📝 **Descripción:** ${descripcion}\n\n` +
                  `⏰ ${new Date().toLocaleString('es-PE')}`;
    
    return await enviarMensajeLeyia(texto, tipoAlerta);
  }, [enviarMensajeLeyia]);

  const enviarAlertaAudiencia = useCallback(async (numeroExpediente, fechaAudiencia, horaAudiencia) => {
    const texto = `📅 **Audiencia Programada**\n\n` +
                  `📋 **Expediente:** ${numeroExpediente}\n` +
                  `📅 **Fecha:** ${fechaAudiencia}\n` +
                  `🕐 **Hora:** ${horaAudiencia}\n\n` +
                  `✅ Audiencia registrada automáticamente por LeyIA`;
    
    return await enviarMensajeLeyia(texto, 'audiencia');
  }, [enviarMensajeLeyia]);

  const enviarAlertaVencimiento = useCallback(async (numeroExpediente, fechaVencimiento, diasRestantes) => {
    const texto = `⏰ **Alerta de Vencimiento**\n\n` +
                  `📋 **Expediente:** ${numeroExpediente}\n` +
                  `📅 **Fecha límite:** ${fechaVencimiento}\n` +
                  `⏳ **Días restantes:** ${diasRestantes}\n\n` +
                  `🚨 Requiere atención inmediata`;
    
    return await enviarMensajeLeyia(texto, 'vencimiento');
  }, [enviarMensajeLeyia]);

  return {
    mensajes,
    cargando,
    conectado,
    usuariosOnline,
    mensajesNoLeidos,
    ultimoMensaje,
    enviarMensaje,
    enviarMensajeLeyia,
    enviarMensajeSistema,
    marcarComoLeido,
    enviarAlertaExpediente,
    enviarAlertaAudiencia,
    enviarAlertaVencimiento,
    TIPOS_MENSAJE
  };
};