// src/hooks/useCasos.js
import { useState, useEffect, useCallback } from 'react';
import { extraerDatosExpediente } from '../utils/expedienteParser';
import { useOrganizacionContext } from '../contexts/OrganizacionContext';
import casosService from '../services/CasosService';

export const useCasos = () => {
  const { organizacionActual } = useOrganizacionContext();
  const [casos, setCasos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [useRealtime, setUseRealtime] = useState(true);

  // Función de carga manual usando servicio centralizado
  const cargarCasos = useCallback(async () => {
    console.log('🔍 Cargando casos manualmente para organización:', organizacionActual?.id);
    
    if (!organizacionActual?.id) {
      console.log('❌ No hay organización activa');
      setCasos([]);
      setCargando(false);
      return;
    }

    setCargando(true);
    try {
      const docs = await casosService.cargarCasosPorOrganizacion(organizacionActual.id);
      console.log(`📋 Casos encontrados: ${docs.length}`);
      setCasos(docs);
    } catch (error) {
      console.error("❌ Error cargando casos:", error);
      setCasos([]);
    } finally {
      setCargando(false);
    }
  }, [organizacionActual?.id]);

  // Real-time listener usando servicio centralizado
  useEffect(() => {
    console.log('🔍 useEffect listener ejecutándose...');
    console.log('  - organizacionActual:', organizacionActual);
    console.log('  - organizacionActual?.id:', organizacionActual?.id);
    console.log('  - useRealtime:', useRealtime);
    
    if (!organizacionActual?.id) {
      console.log('❌ No hay organización activa para listener');
      setCasos([]);
      setCargando(false);
      return;
    }

    if (!useRealtime) {
      console.log('🔄 Real-time desactivado, usando carga manual');
      cargarCasos();
      return;
    }

    console.log('🔴 Iniciando listener para organización:', organizacionActual.id);
    setCargando(true);

    const unsubscribe = casosService.crearListenerCasos(
      organizacionActual.id,
      (casosActualizados) => {
        console.log('📥 Casos recibidos del listener:', casosActualizados.length);
        setCasos(casosActualizados);
        setCargando(false);
      },
      (error) => {
        console.error('❌ Error en listener:', error);
        setCargando(false);
        // Fallback a carga manual
        console.log('🔄 Fallback: intentando carga manual...');
        cargarCasos();
      }
    );

    return () => {
      console.log('🔴 Desconectando listener en tiempo real');
      unsubscribe();
    };
  }, [organizacionActual?.id, useRealtime, cargarCasos]);

  const procesarConLeyia = async (texto, alertaConfig = null) => {
    if (!organizacionActual?.id) {
      throw new Error("No hay organización activa");
    }

    const datos = extraerDatosExpediente(texto);
    
    if (!datos.numero) throw new Error("No se detectó número de expediente");

    const existente = casos.find(c => 
      c.numero.replace(/[^A-Z0-9]/g, '') === datos.numero.replace(/[^A-Z0-9]/g, '')
    );

    let idFinal;
    if (existente) {
      idFinal = existente.id;
      await casosService.actualizarCaso(idFinal, datos);
    } else {
      const nuevoCaso = await casosService.crearCaso(datos, organizacionActual.id);
      idFinal = nuevoCaso.id;
    }

    if (alertaConfig) {
      await casosService.actualizarCaso(idFinal, {
        alerta: {
          ...alertaConfig,
          fechaInicio: new Date().toISOString().split('T')[0]
        }
      });
    }

    return { success: true, numero: datos.numero };
  };

  const agregarCaso = async (datosCaso) => {
    if (!organizacionActual?.id) {
      throw new Error("No hay organización activa");
    }

    try {
      const nuevoCaso = await casosService.crearCaso(datosCaso, organizacionActual.id);
      console.log('✅ Caso agregado, listener detectará el cambio automáticamente');
      return { success: true, id: nuevoCaso.id };
    } catch (error) {
      console.error("Error agregando caso:", error);
      throw new Error("Error al agregar el expediente");
    }
  };

  const eliminarCaso = async (casoId) => {
    try {
      await casosService.eliminarCaso(casoId);
      console.log('✅ Caso eliminado, listener detectará el cambio automáticamente');
      return { success: true };
    } catch (error) {
      console.error("Error eliminando caso:", error);
      throw new Error("Error al eliminar el expediente");
    }
  };

  const actualizarCaso = async (casoId, datosActualizados) => {
    try {
      await casosService.actualizarCaso(casoId, datosActualizados);
      console.log('✅ Caso actualizado, listener detectará el cambio automáticamente');
      return { success: true };
    } catch (error) {
      console.error("Error actualizando caso:", error);
      throw new Error("Error al actualizar el expediente");
    }
  };

  return {
    casos,
    cargando,
    procesarConLeyia,
    cargarCasos,
    agregarCaso,
    eliminarCaso,
    actualizarCaso,
    organizacionActual,
    useRealtime,
    setUseRealtime
  };
};