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
    console.log('🔍 Tipo de organizacionId:', typeof organizacionId);
    console.log('🔍 organizacionId válido:', !!organizacionId);
    
    if (!organizacionId) {
      console.warn('❌ No hay organizacionId para cargar casos');
      console.warn('❌ organizacionId recibido:', organizacionId);
      return [];
    }

    // Log adicional para debugging
    console.log('📊 Iniciando consulta a Firebase...');
    console.log('📊 Colección: casos');
    console.log('📊 Filtro: organizacionId ==', organizacionId);

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
      console.log('📋 Primeros 3 casos:', casos.slice(0, 3).map(c => ({ 
        id: c.id, 
        numero: c.numero, 
        cliente: c.cliente,
        organizacionId: c.organizacionId 
      })));
      
      // Verificar que todos los casos tienen el organizacionId correcto
      const casosConOrgIncorrecta = casos.filter(c => c.organizacionId !== organizacionId);
      if (casosConOrgIncorrecta.length > 0) {
        console.warn('⚠️ Casos con organizacionId incorrecta:', casosConOrgIncorrecta.length);
      }
      
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
        console.log('📋 Primeros 3 casos:', casos.slice(0, 3).map(c => ({ 
          id: c.id, 
          numero: c.numero, 
          cliente: c.cliente,
          organizacionId: c.organizacionId 
        })));
        
        // Si no hay casos con organizacionId, hacer diagnóstico adicional
        if (casos.length === 0) {
          console.log('⚠️ No hay casos con organizacionId, haciendo diagnóstico...');
          
          // Verificar si hay casos en total
          const allCasosSnapshot = await getDocs(collection(db, 'casos'));
          const totalCasos = allCasosSnapshot.size;
          console.log(`📊 Total de casos en BD: ${totalCasos}`);
          
          if (totalCasos > 0) {
            // Verificar casos sin organizacionId
            const casosSinOrg = [];
            const casosConOtraOrg = [];
            
            allCasosSnapshot.forEach(doc => {
              const data = doc.data();
              if (!data.organizacionId) {
                casosSinOrg.push({ id: doc.id, numero: data.numero, cliente: data.cliente });
              } else if (data.organizacionId !== organizacionId) {
                casosConOtraOrg.push({ 
                  id: doc.id, 
                  numero: data.numero, 
                  cliente: data.cliente, 
                  organizacionId: data.organizacionId 
                });
              }
            });
            
            console.log(`📊 Casos sin organizacionId: ${casosSinOrg.length}`);
            console.log(`📊 Casos con otra organizacionId: ${casosConOtraOrg.length}`);
            
            if (casosSinOrg.length > 0) {
              console.log('📋 Primeros casos sin organizacionId:', casosSinOrg.slice(0, 3));
              console.log('💡 Considera usar migrarCasosOrfanos() para asignarles organizacionId');
            }
            
            if (casosConOtraOrg.length > 0) {
              console.log('📋 Otras organizaciones encontradas:', 
                [...new Set(casosConOtraOrg.map(c => c.organizacionId))]);
            }
          }
          
          // Intentar cargar todos los casos como fallback (solo en desarrollo)
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 Modo desarrollo: cargando todos los casos como fallback...');
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

  // Función de diagnóstico para debugging
  async diagnosticarOrganizacion(organizacionId) {
    console.log('🔍 DIAGNÓSTICO DE ORGANIZACIÓN:', organizacionId);
    
    try {
      // 1. Verificar casos con organizacionId
      const qConOrg = query(
        collection(db, 'casos'),
        where('organizacionId', '==', organizacionId)
      );
      const casosConOrg = await getDocs(qConOrg);
      console.log(`📊 Casos con organizacionId "${organizacionId}": ${casosConOrg.size}`);
      
      // 2. Verificar total de casos
      const allCasos = await getDocs(collection(db, 'casos'));
      console.log(`📊 Total de casos en BD: ${allCasos.size}`);
      
      // 3. Analizar organizaciones existentes
      const organizaciones = new Set();
      let casosSinOrg = 0;
      
      allCasos.forEach(doc => {
        const data = doc.data();
        if (data.organizacionId) {
          organizaciones.add(data.organizacionId);
        } else {
          casosSinOrg++;
        }
      });
      
      console.log(`📊 Organizaciones encontradas: ${organizaciones.size}`);
      console.log(`📊 Casos sin organizacionId: ${casosSinOrg}`);
      console.log('📋 IDs de organizaciones:', Array.from(organizaciones));
      
      return {
        casosConOrganizacion: casosConOrg.size,
        totalCasos: allCasos.size,
        organizacionesEncontradas: Array.from(organizaciones),
        casosSinOrganizacion: casosSinOrg
      };
      
    } catch (error) {
      console.error('❌ Error en diagnóstico:', error);
      return null;
    }
  }

  // Función para migrar casos de otra organización
  async migrarCasosDeOtraOrganizacion(organizacionOrigen, organizacionDestino) {
    console.log(`🔄 Migrando casos de ${organizacionOrigen} a ${organizacionDestino}`);
    
    try {
      // Buscar casos de la organización origen
      const qOrigen = query(
        collection(db, 'casos'),
        where('organizacionId', '==', organizacionOrigen)
      );
      
      const casosOrigen = await getDocs(qOrigen);
      console.log(`📊 Casos encontrados en organización origen: ${casosOrigen.size}`);
      
      if (casosOrigen.size === 0) {
        console.log('No hay casos para migrar');
        return 0;
      }
      
      // Migrar cada caso
      const updates = [];
      casosOrigen.forEach(doc => {
        updates.push(
          updateDoc(doc.ref, {
            organizacionId: organizacionDestino,
            updatedAt: serverTimestamp(),
            migradoEn: serverTimestamp(),
            organizacionAnterior: organizacionOrigen
          })
        );
      });
      
      await Promise.all(updates);
      console.log(`✅ Migrados ${casosOrigen.size} casos de ${organizacionOrigen} a ${organizacionDestino}`);
      return casosOrigen.size;
      
    } catch (error) {
      console.error('❌ Error migrando casos de otra organización:', error);
      throw error;
    }
  }
  // Función para migrar casos sin organizacionId
  async migrarCasosOrfanos(organizacionId) {
    console.log('🔄 Migrando casos sin organizacionId a:', organizacionId);
    
    try {
      const allCasos = await getDocs(collection(db, 'casos'));
      const casosParaMigrar = [];
      
      allCasos.forEach(doc => {
        const data = doc.data();
        if (!data.organizacionId) {
          casosParaMigrar.push(doc.id);
        }
      });
      
      console.log(`📊 Casos para migrar: ${casosParaMigrar.length}`);
      
      if (casosParaMigrar.length > 0) {
        const updates = casosParaMigrar.map(casoId => 
          updateDoc(doc(db, 'casos', casoId), {
            organizacionId: organizacionId,
            updatedAt: serverTimestamp()
          })
        );
        
        await Promise.all(updates);
        console.log(`✅ Migrados ${casosParaMigrar.length} casos a organizacionId: ${organizacionId}`);
        return casosParaMigrar.length;
      } else {
        console.log('No hay casos para migrar');
        return 0;
      }
      
    } catch (error) {
      console.error('❌ Error migrando casos:', error);
      throw error;
    }
  }
}

// Exportar instancia singleton
const casosService = new CasosService();
export default casosService;
