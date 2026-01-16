import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';

export const useOrganizaciones = () => {
  const [organizaciones, setOrganizaciones] = useState([]);
  const [organizacionActual, setOrganizacionActual] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // Cargar todas las organizaciones disponibles
  const cargarOrganizaciones = async () => {
    setCargando(true);
    setError(null);
    
    try {
      // Cargar de 'organizaciones' (español)
      const querySnapshot1 = await getDocs(collection(db, 'organizaciones'));
      const orgsData1 = querySnapshot1.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        _collection: 'organizaciones'
      }));
      
      // Cargar de 'organizations' (inglés)
      const querySnapshot2 = await getDocs(collection(db, 'organizations'));
      const orgsData2 = querySnapshot2.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        _collection: 'organizations'
      }));
      
      // Combinar ambas listas
      const todasLasOrgs = [...orgsData1, ...orgsData2];
      
      setOrganizaciones(todasLasOrgs);
    } catch (err) {
      setError('Error al cargar organizaciones: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  // Obtener organización por ID
  const obtenerOrganizacion = async (orgId) => {
    setCargando(true);
    setError(null);
    
    try {
      // Buscar primero en 'organizaciones'
      let docRef = doc(db, 'organizaciones', orgId);
      let docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const orgData = { id: docSnap.id, ...docSnap.data(), _collection: 'organizaciones' };
        setOrganizacionActual(orgData);
        localStorage.setItem('organizacionActual', JSON.stringify(orgData));
        return orgData;
      }
      
      // Si no se encuentra, buscar en 'organizations'
      docRef = doc(db, 'organizations', orgId);
      docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const orgData = { id: docSnap.id, ...docSnap.data(), _collection: 'organizations' };
        setOrganizacionActual(orgData);
        localStorage.setItem('organizacionActual', JSON.stringify(orgData));
        return orgData;
      }
      
      throw new Error('Organización no encontrada en ninguna colección');
    } catch (err) {
      setError('Organización no encontrada');
      return null;
    } finally {
      setCargando(false);
    }
  };

  // Crear nueva organización
  const crearOrganizacion = async (datosOrganizacion) => {
    setCargando(true);
    setError(null);
    
    try {
      // Generar ID único para la organización
      const orgId = `org-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const nuevaOrg = {
        ...datosOrganizacion,
        id: orgId,
        fechaCreacion: serverTimestamp(),
        activa: true,
        configuracion: {
          tema: 'default',
          idioma: 'es',
          timezone: 'America/Lima'
        },
        estadisticas: {
          totalCasos: 0,
          totalUsuarios: 1,
          fechaUltimaActividad: serverTimestamp()
        }
      };
      
      await setDoc(doc(db, 'organizaciones', orgId), nuevaOrg);
      
      // Establecer como organización actual
      const orgCreada = { ...nuevaOrg, id: orgId };
      setOrganizacionActual(orgCreada);
      localStorage.setItem('organizacionActual', JSON.stringify(orgCreada));
      
      // Guardar relación usuario-organización en Firestore para persistencia
      try {
        const { auth } = await import('../firebase');
        if (auth.currentUser) {
          await setDoc(doc(db, 'user_organizations', auth.currentUser.uid), {
            userId: auth.currentUser.uid,
            organizacionId: orgId,
            organizacionNombre: nuevaOrg.nombre,
            rol: 'admin', // El creador es admin
            fechaUnion: serverTimestamp(),
            activo: true
          });
        }
      } catch (error) {
        // Error guardando relación, pero la organización ya fue creada
      }
      
      return orgCreada;
    } catch (err) {
      setError('Error al crear organización');
      return null;
    } finally {
      setCargando(false);
    }
  };

  // Unirse a organización existente
  const unirseAOrganizacion = async (orgId, codigoAcceso = null, rolSolicitado = 'asistente') => {
    setCargando(true);
    setError(null);
    
    try {
      const orgData = await obtenerOrganizacion(orgId);
      
      if (!orgData) {
        throw new Error('Organización no encontrada');
      }
      
      // Verificar código de acceso si es requerido
      if (orgData.requiereCodigoAcceso) {
        if (!codigoAcceso || codigoAcceso.trim() === '') {
          throw new Error('Esta organización requiere un código de acceso');
        }
        
        if (orgData.codigoAcceso !== codigoAcceso.trim()) {
          throw new Error('Código de acceso incorrecto');
        }
      }
      
      // Actualizar estadísticas de la organización
      const collectionName = orgData._collection || 'organizaciones';
      await updateDoc(doc(db, collectionName, orgId), {
        'estadisticas.totalUsuarios': (orgData.estadisticas?.totalUsuarios || 0) + 1,
        'estadisticas.fechaUltimaActividad': serverTimestamp()
      });
      
      // Agregar información de rol al objeto de organización
      const orgDataConRol = {
        ...orgData,
        rolUsuario: rolSolicitado
      };
      
      // Guardar en localStorage para persistencia
      localStorage.setItem('organizacionActual', JSON.stringify(orgDataConRol));
      setOrganizacionActual(orgDataConRol);
      
      // Guardar relación usuario-organización en Firestore para persistencia
      try {
        const { auth } = await import('../firebase');
        if (auth.currentUser) {
          await setDoc(doc(db, 'user_organizations', auth.currentUser.uid), {
            userId: auth.currentUser.uid,
            organizacionId: orgId,
            organizacionNombre: orgData.nombre,
            rol: rolSolicitado,
            fechaUnion: serverTimestamp(),
            activo: true
          });
        }
      } catch (error) {
        // Error guardando relación, pero el usuario ya se unió
      }
      
      return orgDataConRol;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setCargando(false);
    }
  };

  // Actualizar organización
  const actualizarOrganizacion = async (orgId, datosActualizados) => {
    setCargando(true);
    setError(null);
    
    try {
      await updateDoc(doc(db, 'organizaciones', orgId), {
        ...datosActualizados,
        fechaActualizacion: serverTimestamp()
      });
      
      // Actualizar estado local
      if (organizacionActual && organizacionActual.id === orgId) {
        const orgActualizada = { ...organizacionActual, ...datosActualizados };
        setOrganizacionActual(orgActualizada);
        localStorage.setItem('organizacionActual', JSON.stringify(orgActualizada));
      }
      
      return true;
    } catch (err) {
      setError('Error al actualizar organización');
      return false;
    } finally {
      setCargando(false);
    }
  };

  // Cargar organización desde localStorage al iniciar
  useEffect(() => {
    const orgGuardada = localStorage.getItem('organizacionActual');
    if (orgGuardada) {
      try {
        const orgData = JSON.parse(orgGuardada);
        setOrganizacionActual(orgData);
      } catch (err) {
        localStorage.removeItem('organizacionActual');
      }
    }
  }, []);

  // Cargar organización del usuario desde Firestore
  const cargarOrganizacionUsuario = async (userId) => {
    setCargando(true);
    setError(null);
    
    try {
      const userOrgDoc = await getDoc(doc(db, 'user_organizations', userId));
      
      if (userOrgDoc.exists()) {
        const userOrgData = userOrgDoc.data();
        
        if (userOrgData.activo) {
          // Cargar los datos completos de la organización
          const orgData = await obtenerOrganizacion(userOrgData.organizacionId);
          
          if (orgData) {
            // Agregar información del rol del usuario
            const orgDataConRol = {
              ...orgData,
              rolUsuario: userOrgData.rol
            };
            
            setOrganizacionActual(orgDataConRol);
            localStorage.setItem('organizacionActual', JSON.stringify(orgDataConRol));
            return orgDataConRol;
          }
        }
      }
      
      return null;
    } catch (err) {
      setError('Error cargando organización del usuario');
      return null;
    } finally {
      setCargando(false);
    }
  };

  // Limpiar organización actual
  const limpiarOrganizacionActual = () => {
    setOrganizacionActual(null);
    localStorage.removeItem('organizacionActual');
  };

  return {
    organizaciones,
    organizacionActual,
    cargando,
    error,
    cargarOrganizaciones,
    obtenerOrganizacion,
    crearOrganizacion,
    unirseAOrganizacion,
    actualizarOrganizacion,
    cargarOrganizacionUsuario,
    limpiarOrganizacionActual
  };
};