// useChatIA.js - Hook especializado para lógica de ChatIA
// Reduce complejidad separando funciones largas del componente ChatIA

import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import IntentionEngine from '../services/IntentionEngine';
import ExpedienteParser from '../services/ExpedienteParser';
import LeyiaAIPro from '../services/LeyiaAIPro';

export const useChatIA = () => {
  const [mensajes, setMensajes] = useState([]);
  const [inputMensaje, setInputMensaje] = useState('');
  const [casos, setCasos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Referencias para evitar stale closures
  const casosRef = useRef(casos);
  const inicializado = useRef(false);
  
  // Servicios de IA
  const [motorIntenciones] = useState(() => new IntentionEngine());
  const [expedienteParser] = useState(() => new ExpedienteParser());
  const [leyiaAIPro] = useState(() => new LeyiaAIPro());

  // Actualizar referencia de casos
  useEffect(() => {
    casosRef.current = casos;
  }, [casos]);

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

  // Inicializar mensaje de bienvenida
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

  // Cargar datos de casos
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

  // Buscar caso con lógica flexible
  const buscarCaso = useCallback((numeroIngresado) => {
    console.log('🔍 Buscando expediente:', numeroIngresado);
    
    // Búsqueda exacta primero
    let caso = casosRef.current.find(c => c.numero === numeroIngresado);
    if (caso) {
      console.log('✅ Encontrado con búsqueda exacta:', caso.numero);
      return caso;
    }
    
    // Búsqueda flexible
    const normalizarNumero = (num) => {
      if (!num) return '';
      return num.toString().trim().toLowerCase();
    };
    
    const numeroNormalizado = normalizarNumero(numeroIngresado);
    
    caso = casosRef.current.find(c => {
      if (!c.numero) return false;
      const casoNormalizado = normalizarNumero(c.numero);
      
      return casoNormalizado === numeroNormalizado ||
             casoNormalizado.includes(numeroNormalizado) ||
             numeroNormalizado.includes(casoNormalizado) ||
             casoNormalizado.replace(/-/g, '') === numeroNormalizado.replace(/-/g, '') ||
             casoNormalizado.startsWith(numeroNormalizado.substring(0, 5));
    });
    
    if (caso) {
      console.log('✅ Encontrado con búsqueda flexible:', caso.numero);
    } else {
      console.log('❌ No encontrado. Números disponibles:', casosRef.current.map(c => c.numero));
    }
    
    return caso;
  }, []);

  // Limpiar mensajes automáticamente
  const limpiarMensajesAntiguos = useCallback(() => {
    setMensajes(prev => {
      if (prev.length > 10) {
        return prev.slice(-10);
      }
      return prev;
    });
  }, []);

  // Cargar datos al montar
  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  return {
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
  };
};