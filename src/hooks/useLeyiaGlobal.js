// useLeyiaGlobal.js - Hook para manejar las funciones globales de Leyia
// Refactorizado para reducir complejidad de funciones largas

import { useEffect, useRef } from 'react';
import leyiaService from '../services/LeyiaService';
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

// Funciones auxiliares extraídas para reducir complejidad
const limpiarNumeroExpediente = (num) => num.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

const patronesExpediente = [
  /([0-9]{5}-[0-9]{4}-[0-9]+-[0-9]{4}-[A-Z]{2}-[A-Z]{2}-[0-9]{2})/i,
  /([0-9]{3,6}[-]?[0-9]{4}[A-Z0-9\-]*)/i
];

const extraerNumeroExpediente = (pregunta) => {
  for (const patron of patronesExpediente) {
    const match = pregunta.match(patron);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
};

const buscarExpedientePorNumero = (casos, numeroExpediente) => {
  return casos.find(caso => 
    limpiarNumeroExpediente(caso.numero || '') === limpiarNumeroExpediente(numeroExpediente)
  );
};

const construirRespuestaExpediente = (expediente) => {
  let respuesta = `Sí, encontré el expediente ${expediente.numero}.`;
  
  if (expediente.cliente) {
    respuesta += `\n\n👤 Cliente: ${expediente.cliente}`;
  }
  
  if (expediente.tipo) {
    respuesta += `\n⚖️ Tipo: ${expediente.tipo.toUpperCase()}`;
  }
  
  if (expediente.descripcion) {
    respuesta += `\n📝 Materia: ${expediente.descripcion}`;
  }
  
  return respuesta;
};

export const useLeyiaGlobal = (casos, setCasos, cargarCasos) => {
  // Usar useRef para mantener referencias actualizadas sin reinicializar
  const casosRef = useRef(casos);
  const setCasosRef = useRef(setCasos);
  const cargarCasosRef = useRef(cargarCasos);

  // Actualizar referencias cuando cambien los valores
  useEffect(() => {
    casosRef.current = casos;
    setCasosRef.current = setCasos;
    cargarCasosRef.current = cargarCasos;
    
    // Actualizar el servicio de Leyia con los casos actuales
    leyiaService.init(casos, casosRef);
  }, [casos, setCasos, cargarCasos]);

  // Función para agregar alerta (extraída y simplificada)
  const agregarAlertaAExpediente = async (numeroExpediente, alertaConfig) => {
    try {
      console.log('🚨 LEYIA - Agregando alerta a expediente existente...');
      
      const expedienteEncontrado = buscarExpedientePorNumero(casosRef.current, numeroExpediente);
      
      if (!expedienteEncontrado) {
        throw new Error(`No se encontró el expediente ${numeroExpediente}`);
      }
      
      const alerta = {
        descripcion: alertaConfig.descripcion || 'Plazo procesal',
        fechaInicio: alertaConfig.fechaInicio || new Date().toISOString().split('T')[0],
        diasPlazo: alertaConfig.diasPlazo || 6,
        tipo: alertaConfig.tipo || 'limite'
      };
      
      // Actualizar en Firebase
      await updateDoc(doc(db, expedienteEncontrado.id), {
        alerta: alerta,
        updatedAt: serverTimestamp()
      });
      
      // Actualizar estado local
      setCasosRef.current(prevCasos => 
        prevCasos.map(caso => 
          caso.id === expedienteEncontrado.id 
            ? { ...caso, alerta: alerta, updatedAt: new Date() }
            : caso
        )
      );
      
      return {
        success: true,
        mensaje: `Alerta agregada al expediente ${numeroExpediente}`,
        expediente: numeroExpediente,
        alerta: alerta
      };
      
    } catch (error) {
      console.error('❌ Error al agregar alerta:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };

  // Función de consulta (extraída y simplificada)
  const consultarExpediente = async (pregunta) => {
    try {
      console.log('🤔 LEYIA - Procesando consulta:', pregunta);
      
      const numeroExpediente = extraerNumeroExpediente(pregunta);
      
      if (!numeroExpediente) {
        return {
          success: false,
          error: 'No se pudo extraer el número de expediente de la pregunta',
          respuesta: 'No pude identificar un número de expediente en tu pregunta.'
        };
      }
      
      const expedienteEncontrado = buscarExpedientePorNumero(casosRef.current, numeroExpediente);
      
      if (expedienteEncontrado) {
        return {
          success: true,
          encontrado: true,
          expediente: expedienteEncontrado,
          respuesta: construirRespuestaExpediente(expedienteEncontrado)
        };
      } else {
        return {
          success: true,
          encontrado: false,
          respuesta: `No, no hay ningún caso con el número de expediente ${numeroExpediente} en el sistema.`
        };
      }
      
    } catch (error) {
      console.error('❌ Error al procesar consulta:', error);
      return {
        success: false,
        error: error.message,
        respuesta: 'Ocurrió un error al procesar tu consulta.'
      };
    }
  };

  // Función de diagnóstico (simplificada)
  const diagnosticarLeyia = async () => {
    console.log('🔍 DIAGNÓSTICO COMPLETO DE LEYIA');
    console.log('1. Casos cargados:', casosRef.current.length);
    console.log('2. Funciones disponibles:', {
      actualizarExpedienteConLeyia: typeof window.actualizarExpedienteConLeyia,
      consultarExpediente: typeof window.consultarExpediente,
      agregarAlertaAExpediente: typeof window.agregarAlertaAExpediente
    });
    
    return {
      success: true,
      totalCasos: casosRef.current.length,
      funcionesDisponibles: 3
    };
  };

  // Registrar funciones globales una sola vez
  useEffect(() => {
    console.log('🔧 Registrando funciones globales de Leyia...');

    // Función principal de actualización de expedientes
    window.actualizarExpedienteConLeyia = async (informacionExpediente) => {
      return await leyiaService.actualizarExpedienteConLeyia(
        informacionExpediente,
        setCasosRef.current,
        cargarCasosRef.current
      );
    };

    // Función para procesar expediente con alerta
    window.procesarExpedienteConAlerta = async (informacionExpediente, alertaConfig) => {
      return await leyiaService.procesarExpedienteConAlerta(
        informacionExpediente,
        alertaConfig,
        setCasosRef.current,
        cargarCasosRef.current
      );
    };

    // Función específica para expediente de reivindicación
    window.procesarExpedienteReivindicacion = async (informacionExpediente) => {
      console.log('🏠 LEYIA - Procesando expediente de REIVINDICACIÓN con alerta de 6 días hábiles...');
      
      const alertaConfig = {
        descripcion: 'REQUERIMIENTO DE RESTITUCIÓN - Plazo de 6 días para cumplir con restituir el bien inmueble bajo apercibimiento de lanzamiento',
        fechaInicio: new Date().toISOString().split('T')[0],
        diasPlazo: 6,
        tipo: 'limite'
      };
      
      return await window.procesarExpedienteConAlerta(informacionExpediente, alertaConfig);
    };

    // Asignar funciones extraídas
    window.agregarAlertaAExpediente = agregarAlertaAExpediente;
    window.consultarExpediente = consultarExpediente;
    window.diagnosticarLeyia = diagnosticarLeyia;

    // Función de prueba
    window.testLeyia = () => {
      console.log('✅ Función de prueba de Leyia funcionando');
      alert('✅ Conexión con Leyia establecida correctamente');
      return true;
    };

    // Cleanup function
    return () => {
      console.log('🧹 Limpiando funciones globales de Leyia...');
      delete window.actualizarExpedienteConLeyia;
      delete window.procesarExpedienteConAlerta;
      delete window.procesarExpedienteReivindicacion;
      delete window.agregarAlertaAExpediente;
      delete window.consultarExpediente;
      delete window.diagnosticarLeyia;
      delete window.testLeyia;
    };
  }, [agregarAlertaAExpediente, consultarExpediente, diagnosticarLeyia]);

  return {
    // Exponer funciones si se necesitan internamente
    actualizarExpediente: window.actualizarExpedienteConLeyia,
    consultarExpediente: window.consultarExpediente,
    diagnosticar: window.diagnosticarLeyia
  };
};