// JurisprudenciaService.js - Servicio para gestionar jurisprudencia y modelos en Firebase
import { db, storage } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  where,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';

class JurisprudenciaService {
  constructor() {
    this.jurisprudenciaCollection = 'jurisprudencias';
    this.modelosCollection = 'modelos_documentos';
  }

  // ===== JURISPRUDENCIA =====

  /**
   * Subir archivo de jurisprudencia - VERSIÓN SIN STORAGE (solo metadata)
   * Para usar Storage, necesitas configurar las reglas en Firebase Console
   */
  async subirJurisprudencia(file, metadata, organizacionId) {
    try {
      console.log('📚 Guardando jurisprudencia (solo metadata):', file.name);

      // Por ahora solo guardamos metadata sin el archivo
      // Para habilitar Storage, configura las reglas en Firebase Console
      const jurisprudenciaData = {
        titulo: metadata.titulo || file.name,
        tipo: metadata.tipo || 'sentencia',
        materia: metadata.materia || 'civil',
        tribunal: metadata.tribunal || '',
        fecha: metadata.fecha || new Date().toISOString(),
        sumilla: metadata.sumilla || '',
        criterioJurisprudencial: metadata.criterioJurisprudencial || '',
        palabrasClave: metadata.palabrasClave || [],
        relevancia: metadata.relevancia || 0,
        
        // Datos del archivo (sin URL por ahora)
        nombreArchivo: file.name,
        tipoArchivo: file.type,
        tamano: file.size,
        
        // Nota: archivo no subido a Storage
        archivoSubido: false,
        notaStorage: 'Archivo no subido - configurar reglas de Firebase Storage',
        
        // Metadata del sistema
        organizacionId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        activo: true
      };

      const docRef = await addDoc(collection(db, this.jurisprudenciaCollection), jurisprudenciaData);

      console.log('✅ Jurisprudencia guardada con ID:', docRef.id);

      return {
        id: docRef.id,
        ...jurisprudenciaData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('❌ Error guardando jurisprudencia:', error);
      throw error;
    }
  }

  /**
   * Obtener todas las jurisprudencias de una organización
   */
  async obtenerJurisprudencias(organizacionId) {
    try {
      const q = query(
        collection(db, this.jurisprudenciaCollection),
        where('organizacionId', '==', organizacionId),
        where('activo', '==', true),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const jurisprudencias = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log(`📚 ${jurisprudencias.length} jurisprudencias cargadas`);
      return jurisprudencias;
    } catch (error) {
      console.error('❌ Error obteniendo jurisprudencias:', error);
      return [];
    }
  }

  /**
   * Actualizar jurisprudencia
   */
  async actualizarJurisprudencia(jurisprudenciaId, datos) {
    try {
      await updateDoc(doc(db, this.jurisprudenciaCollection, jurisprudenciaId), {
        ...datos,
        updatedAt: serverTimestamp()
      });
      console.log('✅ Jurisprudencia actualizada');
    } catch (error) {
      console.error('❌ Error actualizando jurisprudencia:', error);
      throw error;
    }
  }

  /**
   * Eliminar jurisprudencia (soft delete)
   */
  async eliminarJurisprudencia(jurisprudenciaId) {
    try {
      await updateDoc(doc(db, this.jurisprudenciaCollection, jurisprudenciaId), {
        activo: false,
        updatedAt: serverTimestamp()
      });
      console.log('✅ Jurisprudencia eliminada');
    } catch (error) {
      console.error('❌ Error eliminando jurisprudencia:', error);
      throw error;
    }
  }

  // ===== MODELOS DE DOCUMENTOS =====

  /**
   * Subir modelo de documento - VERSIÓN SIN STORAGE (solo metadata)
   */
  async subirModelo(file, metadata, organizacionId) {
    try {
      console.log('📄 Guardando modelo (solo metadata):', file.name);

      // Por ahora solo guardamos metadata sin el archivo
      const modeloData = {
        titulo: metadata.titulo || file.name,
        tipo: metadata.tipo || 'resolucion',
        categoria: metadata.categoria || 'general',
        descripcion: metadata.descripcion || '',
        variables: metadata.variables || [],
        
        // Datos del archivo (sin URL por ahora)
        nombreArchivo: file.name,
        tipoArchivo: file.type,
        tamano: file.size,
        
        // Nota: archivo no subido a Storage
        archivoSubido: false,
        notaStorage: 'Archivo no subido - configurar reglas de Firebase Storage',
        
        // Metadata del sistema
        organizacionId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        activo: true,
        vecesUsado: 0
      };

      const docRef = await addDoc(collection(db, this.modelosCollection), modeloData);

      console.log('✅ Modelo guardado con ID:', docRef.id);

      return {
        id: docRef.id,
        ...modeloData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('❌ Error guardando modelo:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los modelos de una organización
   */
  async obtenerModelos(organizacionId) {
    try {
      const q = query(
        collection(db, this.modelosCollection),
        where('organizacionId', '==', organizacionId),
        where('activo', '==', true),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const modelos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log(`📄 ${modelos.length} modelos cargados`);
      return modelos;
    } catch (error) {
      console.error('❌ Error obteniendo modelos:', error);
      return [];
    }
  }

  /**
   * Incrementar contador de uso de modelo
   */
  async incrementarUsoModelo(modeloId) {
    try {
      const modeloRef = doc(db, this.modelosCollection, modeloId);
      const modeloDoc = await getDocs(modeloRef);
      const vecesUsado = (modeloDoc.data()?.vecesUsado || 0) + 1;
      
      await updateDoc(modeloRef, {
        vecesUsado,
        ultimoUso: serverTimestamp()
      });
    } catch (error) {
      console.error('❌ Error incrementando uso:', error);
    }
  }

  /**
   * Actualizar modelo
   */
  async actualizarModelo(modeloId, datos) {
    try {
      await updateDoc(doc(db, this.modelosCollection, modeloId), {
        ...datos,
        updatedAt: serverTimestamp()
      });
      console.log('✅ Modelo actualizado');
    } catch (error) {
      console.error('❌ Error actualizando modelo:', error);
      throw error;
    }
  }

  /**
   * Eliminar modelo (soft delete)
   */
  async eliminarModelo(modeloId) {
    try {
      await updateDoc(doc(db, this.modelosCollection, modeloId), {
        activo: false,
        updatedAt: serverTimestamp()
      });
      console.log('✅ Modelo eliminado');
    } catch (error) {
      console.error('❌ Error eliminando modelo:', error);
      throw error;
    }
  }

  /**
   * Buscar jurisprudencias por palabras clave
   */
  async buscarJurisprudencias(organizacionId, palabraClave) {
    try {
      const q = query(
        collection(db, this.jurisprudenciaCollection),
        where('organizacionId', '==', organizacionId),
        where('activo', '==', true),
        where('palabrasClave', 'array-contains', palabraClave.toLowerCase())
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Error buscando jurisprudencias:', error);
      return [];
    }
  }
}

// Exportar instancia singleton
const jurisprudenciaService = new JurisprudenciaService();
export default jurisprudenciaService;
