// CasosService.js - Servicio centralizado para operaciones con casos
// Elimina duplicación de lógica entre múltiples hooks

import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  onSnapshot 
} from 'firebase/firestore';

class CasosService {
  // Cargar casos de una organización (con fallback sin orderBy)
  async cargarCasosPorOrganizacion(organizacionId) {
    console.log('🔍 CasosService.cargarCasosPorOrganizacion llamado con:', organizacionId);
    
    if (!organizacionId) {
      console.warn('❌ No hay organizacionId para cargar casos');
      return [];
    }

    try {
      console.log('📡 Intentando query con orderBy...');
      // Intentar con orderBy primero
      const q = query(
        collection(db, 'casos'),
        where('organizacionId', '==', organizacionId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const casos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`✅ Casos cargados con orderBy: ${casos.length}`);
      console.log('📋 Primeros 3 casos:', casos.slice(0, 3).map(c => ({ id: c.id, numero: c.numero, cliente: c.cliente })));
      return casos;
      
    } catch (orderError) {
      console.log('⚠️ Error con orderBy, intentando sin ordenar:', orderError.message);
      
      try {
        console.log('📡 Intentando query sin orderBy...');
        // Fallback sin orderBy
        const q = query(
          collection(db, 'casos'),
          where('organizacionId', '==', organizacionId)
        );
        
        const querySnapshot = await getDocs(q);
        const casos = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Ordenar manualmente
        casos.sort((a, b) => {
          const fechaA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
          const fechaB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
          return fechaB - fechaA;
        });
        
        console.log(`✅ Casos cargados sin orderBy (ordenado manual): ${casos.length}`);
        console.log('📋 Primeros 3 casos:', casos.slice(0, 3).map(c => ({ id: c.id, numero: c.numero, cliente: c.cliente })));
        
        // Si no hay casos con organizacionId, intentar cargar todos los casos (fallback)
        if (casos.length === 0) {
          console.log('⚠️ No hay casos con organizacionId, intentando cargar todos los casos...');
          const allCasosSnapshot = await getDocs(collection(db, 'casos'));
          const allCasos = allCasosSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            organizacionId: organizacionId // Asignar organizacionId actual
          }));
          
          // Ordenar y limitar
          allCasos.sort((a, b) => {
            const fechaA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
            const fechaB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
            return fechaB - fechaA;
          });
          
          const casosLimitados = allCasos.slice(0, 50); // Limitar a 50 casos
          console.log(`✅ Casos fallback cargados: ${casosLimitados.length}`);
          return casosLimitados;
        }
        
        return casos;
        
      } catch (error) {
        console.error('❌ Error cargando casos:', error);
        return [];
      }
    }
  }

  // Crear listener en tiempo real para casos de una organización
  crearListenerCasos(organizacionId, onUpdate, onError) {
    if (!organizacionId) {
      console.warn('❌ No hay organizacionId para listener');
      return () => {};
    }

    console.log('🔴 Iniciando listener en tiempo real para organización:', organizacionId);

    try {
      // Intentar con orderBy
      const q = query(
        collection(db, 'casos'),
        where('organizacionId', '==', organizacionId),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const casos = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          console.log(`🔄 Actualización en tiempo real: ${casos.length} casos`);
          onUpdate(casos);
        },
        (error) => {
          console.error('❌ Error en listener con orderBy:', error);
          
          // Fallback sin orderBy
          const qFallback = query(
            collection(db, 'casos'),
            where('organizacionId', '==', organizacionId)
          );
          
          const unsubscribeFallback = onSnapshot(
            qFallback,
            (snapshot) => {
              const casos = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
              
              // Ordenar manualmente
              casos.sort((a, b) => {
                const fechaA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
                const fechaB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
                return fechaB - fechaA;
              });
              
              console.log(`🔄 Actualización en tiempo real (sin orderBy): ${casos.length} casos`);
              onUpdate(casos);
            },
            onError
          );
          
          return unsubscribeFallback;
        }
      );

      return unsubscribe;
      
    } catch (error) {
      console.error('❌ Error creando listener:', error);
      if (onError) onError(error);
      return () => {};
    }
  }

  // Crear caso
  async crearCaso(datosCaso, organizacionId) {
    if (!organizacionId) {
      throw new Error('organizacionId es requerido');
    }

    const nuevoCaso = {
      ...datosCaso,
      organizacionId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'casos'), nuevoCaso);
    
    return {
      id: docRef.id,
      ...nuevoCaso,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Actualizar caso
  async actualizarCaso(casoId, datosActualizados) {
    await updateDoc(doc(db, 'casos', casoId), {
      ...datosActualizados,
      updatedAt: serverTimestamp()
    });
  }

  // Eliminar caso
  async eliminarCaso(casoId) {
    await deleteDoc(doc(db, 'casos', casoId));
  }

  // Calcular progreso basado en estado
  calcularProgreso(caso) {
    const estado = (caso.estado || '').toLowerCase();
    if (estado.includes('archivado') || estado.includes('concluido')) return 100;
    if (estado.includes('sentencia') || estado.includes('resolucion')) return 90;
    if (estado.includes('probatoria') || estado.includes('alegatos')) return 70;
    if (estado.includes('contestacion') || estado.includes('traslado')) return 50;
    if (estado.includes('postulatoria') || estado.includes('admision')) return 30;
    return 20;
  }

  // Formatear última actualización
  formatearUltimaActualizacion(caso) {
    if (caso.observaciones && caso.observaciones.trim() !== '') {
      return caso.observaciones.trim();
    }
    
    if (caso.fechaAudiencia) {
      return `Audiencia programada para ${caso.fechaAudiencia}`;
    }
    
    if (caso.updatedAt) {
      try {
        const fecha = caso.updatedAt.toDate ? caso.updatedAt.toDate() : new Date(caso.updatedAt);
        const hoy = new Date();
        const diferenciaDias = Math.floor((hoy - fecha) / (1000 * 60 * 60 * 24));
        
        if (diferenciaDias <= 7) {
          return `REVISADO`;
        } else {
          return `NO REVISADO`;
        }
      } catch (error) {
        return 'NO REVISADO';
      }
    }
    
    return 'NO REVISADO';
  }

  // Transformar caso a formato de expediente
  transformarAExpediente(caso) {
    return {
      id: caso.id,
      numero: caso.numero || 'Sin número',
      cliente: caso.cliente || 'Cliente no especificado',
      tipo: caso.tipo || 'civil',
      prioridad: caso.prioridad || 'media',
      estado: caso.estado || 'Activo',
      progreso: this.calcularProgreso(caso),
      descripcion: caso.descripcion || 'Sin descripción',
      ultimaActualizacion: this.formatearUltimaActualizacion(caso),
      demandante: caso.demandante || caso.cliente,
      demandado: caso.demandado || 'No especificado',
      abogado: caso.abogado || 'No asignado',
      fechaAudiencia: caso.fechaAudiencia,
      observaciones: caso.observaciones,
      completado: caso.completado || false,
      organizacionId: caso.organizacionId
    };
  }
}

// Exportar instancia singleton
const casosService = new CasosService();
export default casosService;
