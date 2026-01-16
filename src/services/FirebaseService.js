// FirebaseService.js - Servicio centralizado para operaciones Firebase
// Elimina duplicación de lógica CRUD en múltiples componentes

import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  where 
} from 'firebase/firestore';

class FirebaseService {
  constructor() {
    this.collections = {
      CASOS: 'casos',
      AUDIENCIAS: 'audiencias',
      CONTACTOS: 'contactos',
      JURISPRUDENCIAS: 'jurisprudencias',
      CAJA_CHICA: 'cajaChica',
      DOCUMENTOS: 'documentos',
      TAREAS_COMPLETADAS: 'tareasCompletadas'
    };
  }

  /**
   * OPERACIONES GENÉRICAS CRUD
   */

  // Obtener todos los documentos de una colección
  async getAll(collectionName, orderByField = 'createdAt', orderDirection = 'desc') {
    try {
      console.log(`📥 Cargando ${collectionName}...`);
      
      const q = orderByField 
        ? query(collection(db, collectionName), orderBy(orderByField, orderDirection))
        : collection(db, collectionName);
        
      const querySnapshot = await getDocs(q);
      
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`✅ ${collectionName} cargados:`, docs.length);
      return docs;
      
    } catch (error) {
      console.error(`❌ Error cargando ${collectionName}:`, error);
      throw new Error(`Error al cargar ${collectionName}: ${error.message}`);
    }
  }

  // Obtener documentos con filtro
  async getWhere(collectionName, field, operator, value) {
    try {
      const q = query(collection(db, collectionName), where(field, operator, value));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
    } catch (error) {
      console.error(`❌ Error en consulta ${collectionName}:`, error);
      throw new Error(`Error en consulta: ${error.message}`);
    }
  }

  // Crear documento
  async create(collectionName, data) {
    try {
      console.log(`➕ Creando en ${collectionName}:`, data);
      
      const docData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, collectionName), docData);
      
      console.log(`✅ Documento creado en ${collectionName}:`, docRef.id);
      return { success: true, id: docRef.id };
      
    } catch (error) {
      console.error(`❌ Error creando en ${collectionName}:`, error);
      throw new Error(`Error al crear documento: ${error.message}`);
    }
  }

  // Actualizar documento
  async update(collectionName, docId, data) {
    try {
      console.log(`📝 Actualizando ${collectionName}/${docId}:`, data);
      
      const updateData = {
        ...data,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(doc(db, collectionName, docId), updateData);
      
      console.log(`✅ Documento actualizado: ${collectionName}/${docId}`);
      return { success: true };
      
    } catch (error) {
      console.error(`❌ Error actualizando ${collectionName}/${docId}:`, error);
      throw new Error(`Error al actualizar documento: ${error.message}`);
    }
  }

  // Eliminar documento
  async delete(collectionName, docId) {
    try {
      console.log(`🗑️ Eliminando ${collectionName}/${docId}`);
      
      await deleteDoc(doc(db, collectionName, docId));
      
      console.log(`✅ Documento eliminado: ${collectionName}/${docId}`);
      return { success: true };
      
    } catch (error) {
      console.error(`❌ Error eliminando ${collectionName}/${docId}:`, error);
      throw new Error(`Error al eliminar documento: ${error.message}`);
    }
  }

  /**
   * OPERACIONES ESPECÍFICAS PARA CASOS
   */

  // Cargar todos los casos (usado en múltiples componentes)
  async getCasos() {
    return this.getAll(this.collections.CASOS);
  }

  // Crear caso
  async createCaso(casoData) {
    return this.create(this.collections.CASOS, casoData);
  }

  // Actualizar caso
  async updateCaso(casoId, casoData) {
    return this.update(this.collections.CASOS, casoId, casoData);
  }

  // Eliminar caso
  async deleteCaso(casoId) {
    return this.delete(this.collections.CASOS, casoId);
  }

  // Buscar caso por número de expediente
  async findCasoByNumero(numeroExpediente) {
    try {
      const casos = await this.getCasos();
      const limpiarNum = (num) => num.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      
      return casos.find(caso => 
        limpiarNum(caso.numero || '') === limpiarNum(numeroExpediente)
      );
      
    } catch (error) {
      console.error('❌ Error buscando caso por número:', error);
      throw error;
    }
  }

  /**
   * OPERACIONES ESPECÍFICAS PARA AUDIENCIAS
   */

  async getAudiencias() {
    return this.getAll(this.collections.AUDIENCIAS);
  }

  async createAudiencia(audienciaData) {
    return this.create(this.collections.AUDIENCIAS, audienciaData);
  }

  async updateAudiencia(audienciaId, audienciaData) {
    return this.update(this.collections.AUDIENCIAS, audienciaId, audienciaData);
  }

  async deleteAudiencia(audienciaId) {
    return this.delete(this.collections.AUDIENCIAS, audienciaId);
  }

  /**
   * OPERACIONES ESPECÍFICAS PARA CONTACTOS
   */

  async getContactos() {
    return this.getAll(this.collections.CONTACTOS);
  }

  async createContacto(contactoData) {
    return this.create(this.collections.CONTACTOS, contactoData);
  }

  async updateContacto(contactoId, contactoData) {
    return this.update(this.collections.CONTACTOS, contactoId, contactoData);
  }

  async deleteContacto(contactoId) {
    return this.delete(this.collections.CONTACTOS, contactoId);
  }

  /**
   * OPERACIONES ESPECÍFICAS PARA JURISPRUDENCIAS
   */

  async getJurisprudencias() {
    return this.getAll(this.collections.JURISPRUDENCIAS);
  }

  async createJurisprudencia(jurisprudenciaData) {
    return this.create(this.collections.JURISPRUDENCIAS, jurisprudenciaData);
  }

  async updateJurisprudencia(jurisprudenciaId, jurisprudenciaData) {
    return this.update(this.collections.JURISPRUDENCIAS, jurisprudenciaId, jurisprudenciaData);
  }

  async deleteJurisprudencia(jurisprudenciaId) {
    return this.delete(this.collections.JURISPRUDENCIAS, jurisprudenciaId);
  }

  /**
   * OPERACIONES ESPECÍFICAS PARA CAJA CHICA
   */

  async getMovimientosCaja() {
    return this.getAll(this.collections.CAJA_CHICA);
  }

  async createMovimientoCaja(movimientoData) {
    return this.create(this.collections.CAJA_CHICA, movimientoData);
  }

  async updateMovimientoCaja(movimientoId, movimientoData) {
    return this.update(this.collections.CAJA_CHICA, movimientoId, movimientoData);
  }

  async deleteMovimientoCaja(movimientoId) {
    return this.delete(this.collections.CAJA_CHICA, movimientoId);
  }

  /**
   * UTILIDADES COMUNES
   */

  // Manejo centralizado de errores
  handleError(error, context = 'Operación Firebase') {
    const errorMessage = error.message || 'Error desconocido';
    console.error(`❌ ${context}:`, error);
    
    // Aquí se podría agregar logging centralizado, notificaciones, etc.
    return {
      success: false,
      error: errorMessage,
      context
    };
  }

  // Validar datos antes de operaciones
  validateData(data, requiredFields = []) {
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Campos requeridos faltantes: ${missingFields.join(', ')}`);
    }
    
    return true;
  }

  // Limpiar datos antes de guardar
  sanitizeData(data) {
    const cleaned = { ...data };
    
    // Remover campos undefined o null
    Object.keys(cleaned).forEach(key => {
      if (cleaned[key] === undefined || cleaned[key] === null) {
        delete cleaned[key];
      }
    });
    
    return cleaned;
  }
}

// Exportar instancia singleton
const firebaseService = new FirebaseService();
export default firebaseService;