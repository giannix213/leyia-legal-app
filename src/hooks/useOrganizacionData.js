import { useState } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  orderBy 
} from 'firebase/firestore';
import { useOrganizacionContext } from '../contexts/OrganizacionContext';
import casosService from '../services/CasosService';

export const useOrganizacionData = () => {
  const { organizacionActual } = useOrganizacionContext();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // Obtener casos de la organización usando servicio centralizado
  const obtenerCasos = async () => {
    if (!organizacionActual?.id) {
      console.warn('No hay organización activa para obtener casos');
      return [];
    }

    setCargando(true);
    setError(null);

    try {
      const casos = await casosService.cargarCasosPorOrganizacion(organizacionActual.id);
      return casos;
    } catch (err) {
      console.error('Error obteniendo casos:', err);
      setError('Error al cargar casos');
      return [];
    } finally {
      setCargando(false);
    }
  };

  // Crear caso usando servicio centralizado
  const crearCaso = async (datosCaso) => {
    if (!organizacionActual?.id) {
      throw new Error('No hay organización activa');
    }

    setCargando(true);
    setError(null);

    try {
      const nuevoCaso = await casosService.crearCaso(datosCaso, organizacionActual.id);
      return nuevoCaso;
    } catch (err) {
      console.error('Error creando caso:', err);
      setError('Error al crear caso');
      throw err;
    } finally {
      setCargando(false);
    }
  };

  // Actualizar caso usando servicio centralizado
  const actualizarCaso = async (casoId, datosActualizados) => {
    if (!organizacionActual?.id) {
      throw new Error('No hay organización activa');
    }

    setCargando(true);
    setError(null);

    try {
      await casosService.actualizarCaso(casoId, datosActualizados);
      return true;
    } catch (err) {
      console.error('Error actualizando caso:', err);
      setError('Error al actualizar caso');
      throw err;
    } finally {
      setCargando(false);
    }
  };

  // Eliminar caso usando servicio centralizado
  const eliminarCaso = async (casoId) => {
    if (!organizacionActual?.id) {
      throw new Error('No hay organización activa');
    }

    setCargando(true);
    setError(null);

    try {
      await casosService.eliminarCaso(casoId);
      return true;
    } catch (err) {
      console.error('Error eliminando caso:', err);
      setError('Error al eliminar caso');
      throw err;
    } finally {
      setCargando(false);
    }
  };

  // Obtener contactos de la organización
  const obtenerContactos = async () => {
    if (!organizacionActual?.id) {
      return [];
    }

    try {
      const contactosQuery = query(
        collection(db, 'contactos'),
        where('organizacionId', '==', organizacionActual.id)
      );

      const querySnapshot = await getDocs(contactosQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (err) {
      console.error('Error obteniendo contactos:', err);
      return [];
    }
  };

  // Obtener audiencias de la organización
  const obtenerAudiencias = async () => {
    if (!organizacionActual?.id) {
      return [];
    }

    try {
      const audienciasQuery = query(
        collection(db, 'audiencias'),
        where('organizacionId', '==', organizacionActual.id),
        orderBy('fecha', 'asc')
      );

      const querySnapshot = await getDocs(audienciasQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (err) {
      console.error('Error obteniendo audiencias:', err);
      return [];
    }
  };

  // Obtener documentos de la organización
  const obtenerDocumentos = async () => {
    if (!organizacionActual?.id) {
      return [];
    }

    try {
      const documentosQuery = query(
        collection(db, 'documentos'),
        where('organizacionId', '==', organizacionActual.id),
        orderBy('fechaCreacion', 'desc')
      );

      const querySnapshot = await getDocs(documentosQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (err) {
      console.error('Error obteniendo documentos:', err);
      return [];
    }
  };

  // Crear documento en la organización
  const crearDocumento = async (datosDocumento) => {
    if (!organizacionActual?.id) {
      throw new Error('No hay organización activa');
    }

    try {
      const documentoId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const nuevoDocumento = {
        ...datosDocumento,
        organizacionId: organizacionActual.id,
        fechaCreacion: serverTimestamp()
      };

      await setDoc(doc(db, 'documentos', documentoId), nuevoDocumento);
      
      return { id: documentoId, ...nuevoDocumento };
    } catch (err) {
      console.error('Error creando documento:', err);
      throw err;
    }
  };

  // Crear contacto en la organización
  const crearContacto = async (datosContacto) => {
    if (!organizacionActual?.id) {
      throw new Error('No hay organización activa');
    }

    try {
      const contactoId = `contacto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const nuevoContacto = {
        ...datosContacto,
        organizacionId: organizacionActual.id,
        fechaCreacion: serverTimestamp()
      };

      await setDoc(doc(db, 'contactos', contactoId), nuevoContacto);
      
      return { id: contactoId, ...nuevoContacto };
    } catch (err) {
      console.error('Error creando contacto:', err);
      throw err;
    }
  };

  // Crear movimiento de caja chica en la organización
  const crearMovimientoCaja = async (datosMovimiento) => {
    if (!organizacionActual?.id) {
      throw new Error('No hay organización activa');
    }

    try {
      const movimientoId = `movimiento-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const nuevoMovimiento = {
        ...datosMovimiento,
        organizacionId: organizacionActual.id,
        fechaCreacion: serverTimestamp()
      };

      await setDoc(doc(db, 'cajaChica', movimientoId), nuevoMovimiento);
      
      return { id: movimientoId, ...nuevoMovimiento };
    } catch (err) {
      console.error('Error creando movimiento:', err);
      throw err;
    }
  };

  // Obtener movimientos de caja chica de la organización
  const obtenerMovimientosCaja = async () => {
    if (!organizacionActual?.id) {
      return [];
    }

    try {
      const movimientosQuery = query(
        collection(db, 'cajaChica'),
        where('organizacionId', '==', organizacionActual.id),
        orderBy('fecha', 'desc')
      );

      const querySnapshot = await getDocs(movimientosQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (err) {
      console.error('Error obteniendo movimientos de caja:', err);
      return [];
    }
  };

  // Crear evento de calendario en la organización
  const crearEventoCalendario = async (datosEvento) => {
    if (!organizacionActual?.id) {
      throw new Error('No hay organización activa');
    }

    try {
      const eventoId = `evento-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const nuevoEvento = {
        ...datosEvento,
        organizacionId: organizacionActual.id,
        fechaCreacion: serverTimestamp()
      };

      await setDoc(doc(db, 'audiencias', eventoId), nuevoEvento);
      
      return { id: eventoId, ...nuevoEvento };
    } catch (err) {
      console.error('Error creando evento:', err);
      throw err;
    }
  };

  // Obtener eventos de calendario de la organización
  const obtenerEventosCalendario = async () => {
    if (!organizacionActual?.id) {
      return [];
    }

    try {
      const eventosQuery = query(
        collection(db, 'audiencias'),
        where('organizacionId', '==', organizacionActual.id),
        orderBy('fecha', 'asc')
      );

      const querySnapshot = await getDocs(eventosQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (err) {
      console.error('Error obteniendo eventos de calendario:', err);
      return [];
    }
  };

  return {
    organizacionActual,
    cargando,
    error,
    obtenerCasos,
    crearCaso,
    actualizarCaso,
    eliminarCaso,
    obtenerContactos,
    crearContacto,
    obtenerAudiencias,
    obtenerDocumentos,
    crearDocumento,
    obtenerMovimientosCaja,
    crearMovimientoCaja,
    obtenerEventosCalendario,
    crearEventoCalendario
  };
};