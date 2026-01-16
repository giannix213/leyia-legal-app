// useExpedienteActions.js - Hook desacoplado para acciones de expedientes
// Reemplaza las funciones globales de window con hooks especializados

import { useCallback } from 'react';
import { useCasosService } from './useFirebaseService';
import errorService from '../services/ErrorService';

export const useExpedienteActions = () => {
  const { updateCaso, findCasoByNumero } = useCasosService();

  // Actualizar expediente (reemplaza window.actualizarExpedienteConLeyia)
  const actualizarExpediente = useCallback(async (informacionExpediente) => {
    try {
      console.log('📝 Actualizando expediente:', informacionExpediente);
      
      // Validar datos requeridos
      if (!informacionExpediente.numero) {
        throw new Error('Número de expediente es requerido');
      }

      // Buscar expediente existente
      const expedienteExistente = await findCasoByNumero(informacionExpediente.numero);
      
      if (!expedienteExistente) {
        throw new Error(`No se encontró el expediente ${informacionExpediente.numero}`);
      }

      // Preparar datos para actualización
      const datosActualizacion = {
        ...informacionExpediente,
        fechaActualizacion: new Date().toISOString()
      };

      // Actualizar en Firebase
      await updateCaso(expedienteExistente.id, datosActualizacion);

      return {
        success: true,
        mensaje: `Expediente ${informacionExpediente.numero} actualizado correctamente`,
        expediente: { ...expedienteExistente, ...datosActualizacion }
      };

    } catch (error) {
      console.error('❌ Error actualizando expediente:', error);
      return errorService.handleGenericError(error, 'Actualizar Expediente');
    }
  }, [updateCaso, findCasoByNumero]);

  // Procesar expediente con alerta (reemplaza window.procesarExpedienteConAlerta)
  const procesarExpedienteConAlerta = useCallback(async (informacionExpediente, alertaConfig) => {
    try {
      console.log('🚨 Procesando expediente con alerta:', informacionExpediente, alertaConfig);

      // Primero actualizar el expediente
      const resultadoActualizacion = await actualizarExpediente(informacionExpediente);
      
      if (!resultadoActualizacion.success) {
        return resultadoActualizacion;
      }

      // Agregar la alerta
      const expedienteConAlerta = {
        ...resultadoActualizacion.expediente,
        alerta: {
          descripcion: alertaConfig.descripcion || 'Plazo procesal',
          fechaInicio: alertaConfig.fechaInicio || new Date().toISOString().split('T')[0],
          diasPlazo: alertaConfig.diasPlazo || 6,
          tipo: alertaConfig.tipo || 'limite'
        }
      };

      // Actualizar con la alerta
      await updateCaso(resultadoActualizacion.expediente.id, { alerta: expedienteConAlerta.alerta });

      return {
        success: true,
        mensaje: `Expediente ${informacionExpediente.numero} procesado con alerta`,
        expediente: expedienteConAlerta,
        alerta: expedienteConAlerta.alerta
      };

    } catch (error) {
      console.error('❌ Error procesando expediente con alerta:', error);
      return errorService.handleGenericError(error, 'Procesar Expediente con Alerta');
    }
  }, [actualizarExpediente, updateCaso]);

  // Agregar alerta a expediente existente (reemplaza window.agregarAlertaAExpediente)
  const agregarAlertaAExpediente = useCallback(async (numeroExpediente, alertaConfig) => {
    try {
      console.log('🚨 Agregando alerta a expediente:', numeroExpediente, alertaConfig);

      // Buscar expediente
      const expedienteEncontrado = await findCasoByNumero(numeroExpediente);
      
      if (!expedienteEncontrado) {
        throw new Error(`No se encontró el expediente ${numeroExpediente}`);
      }

      // Preparar alerta
      const alerta = {
        descripcion: alertaConfig.descripcion || 'Plazo procesal',
        fechaInicio: alertaConfig.fechaInicio || new Date().toISOString().split('T')[0],
        diasPlazo: alertaConfig.diasPlazo || 6,
        tipo: alertaConfig.tipo || 'limite'
      };

      // Actualizar expediente con alerta
      await updateCaso(expedienteEncontrado.id, { alerta });

      return {
        success: true,
        mensaje: `Alerta agregada al expediente ${numeroExpediente}`,
        expediente: numeroExpediente,
        alerta: alerta
      };

    } catch (error) {
      console.error('❌ Error agregando alerta:', error);
      return errorService.handleGenericError(error, 'Agregar Alerta');
    }
  }, [findCasoByNumero, updateCaso]);

  // Consultar expediente (reemplaza window.consultarExpediente)
  const consultarExpediente = useCallback(async (pregunta) => {
    try {
      console.log('🔍 Consultando expediente:', pregunta);

      // Extraer número de expediente de la pregunta
      const patronesExpediente = [
        /([0-9]{5}-[0-9]{4}-[0-9]+-[0-9]{4}-[A-Z]{2}-[A-Z]{2}-[0-9]{2})/i,
        /([0-9]{3,6}[-]?[0-9]{4}[A-Z0-9\-]*)/i
      ];

      let numeroExpediente = null;
      for (const patron of patronesExpediente) {
        const match = pregunta.match(patron);
        if (match && match[1]) {
          numeroExpediente = match[1].trim();
          break;
        }
      }

      if (!numeroExpediente) {
        return {
          success: false,
          error: 'No se pudo extraer el número de expediente de la pregunta',
          respuesta: 'No pude identificar un número de expediente en tu pregunta.'
        };
      }

      // Buscar expediente
      const expedienteEncontrado = await findCasoByNumero(numeroExpediente);

      if (expedienteEncontrado) {
        let respuesta = `Sí, encontré el expediente ${expedienteEncontrado.numero}.`;
        
        if (expedienteEncontrado.cliente) {
          respuesta += `\n\n👤 Cliente: ${expedienteEncontrado.cliente}`;
        }
        
        if (expedienteEncontrado.tipo) {
          respuesta += `\n⚖️ Tipo: ${expedienteEncontrado.tipo.toUpperCase()}`;
        }
        
        if (expedienteEncontrado.descripcion) {
          respuesta += `\n📝 Materia: ${expedienteEncontrado.descripcion}`;
        }

        return {
          success: true,
          encontrado: true,
          expediente: expedienteEncontrado,
          respuesta: respuesta
        };
      } else {
        return {
          success: true,
          encontrado: false,
          respuesta: `No, no hay ningún caso con el número de expediente ${numeroExpediente} en el sistema.`
        };
      }

    } catch (error) {
      console.error('❌ Error consultando expediente:', error);
      return errorService.handleGenericError(error, 'Consultar Expediente');
    }
  }, [findCasoByNumero]);

  // Procesar expediente de reivindicación (reemplaza window.procesarExpedienteReivindicacion)
  const procesarExpedienteReivindicacion = useCallback(async (informacionExpediente) => {
    console.log('🏠 Procesando expediente de REIVINDICACIÓN con alerta de 6 días hábiles...');
    
    // Configurar la alerta específica para reivindicación
    const alertaConfig = {
      descripcion: 'REQUERIMIENTO DE RESTITUCIÓN - Plazo de 6 días para cumplir con restituir el bien inmueble bajo apercibimiento de lanzamiento',
      fechaInicio: new Date().toISOString().split('T')[0],
      diasPlazo: 6,
      tipo: 'limite'
    };
    
    return await procesarExpedienteConAlerta(informacionExpediente, alertaConfig);
  }, [procesarExpedienteConAlerta]);

  return {
    actualizarExpediente,
    procesarExpedienteConAlerta,
    agregarAlertaAExpediente,
    consultarExpediente,
    procesarExpedienteReivindicacion
  };
};