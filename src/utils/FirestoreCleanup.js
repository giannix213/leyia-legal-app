// src/utils/FirestoreCleanup.js - Script para limpiar completamente Firestore
import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc, writeBatch, setDoc, addDoc } from 'firebase/firestore';

class FirestoreCleanup {
  constructor() {
    this.collections = [
      'casos',
      'contactos', 
      'cajaChica',
      'audiencias',
      'jurisprudencia',
      'organizaciones',
      'users',
      'configuracion',
      'notificaciones',
      'documentos',
      'plantillas'
    ];
  }

  /**
   * Elimina todos los documentos de una colección
   */
  async deleteCollection(collectionName) {
    console.log(`🗑️ Eliminando colección: ${collectionName}`);
    
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      const batch = writeBatch(db);
      let count = 0;

      querySnapshot.forEach((document) => {
        batch.delete(doc(db, collectionName, document.id));
        count++;
      });

      if (count > 0) {
        await batch.commit();
        console.log(`✅ Eliminados ${count} documentos de ${collectionName}`);
      } else {
        console.log(`ℹ️ Colección ${collectionName} ya estaba vacía`);
      }

      return { success: true, count };
    } catch (error) {
      console.error(`❌ Error eliminando ${collectionName}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Elimina todas las colecciones de Firestore
   */
  async cleanAllCollections() {
    console.log('🧹 INICIANDO LIMPIEZA COMPLETA DE FIRESTORE');
    console.log('⚠️ ADVERTENCIA: Esto eliminará TODOS los datos');
    
    const results = {};
    let totalDeleted = 0;

    for (const collectionName of this.collections) {
      const result = await this.deleteCollection(collectionName);
      results[collectionName] = result;
      
      if (result.success) {
        totalDeleted += result.count || 0;
      }
      
      // Pequeña pausa entre eliminaciones para no sobrecargar Firestore
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('🎯 RESUMEN DE LIMPIEZA:');
    console.log(`📊 Total de documentos eliminados: ${totalDeleted}`);
    console.log('📋 Detalle por colección:');
    
    Object.entries(results).forEach(([collection, result]) => {
      if (result.success) {
        console.log(`  ✅ ${collection}: ${result.count || 0} documentos`);
      } else {
        console.log(`  ❌ ${collection}: Error - ${result.error}`);
      }
    });

    return {
      success: true,
      totalDeleted,
      results
    };
  }

  /**
   * Limpieza específica solo de datos de usuario (mantiene configuración)
   */
  async cleanUserDataOnly() {
    console.log('🧹 LIMPIEZA SOLO DE DATOS DE USUARIO');
    
    const userCollections = ['casos', 'contactos', 'cajaChica', 'audiencias', 'jurisprudencia'];
    const results = {};
    let totalDeleted = 0;

    for (const collectionName of userCollections) {
      const result = await this.deleteCollection(collectionName);
      results[collectionName] = result;
      
      if (result.success) {
        totalDeleted += result.count || 0;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('🎯 RESUMEN DE LIMPIEZA DE DATOS DE USUARIO:');
    console.log(`📊 Total de documentos eliminados: ${totalDeleted}`);
    
    return {
      success: true,
      totalDeleted,
      results
    };
  }

  /**
   * Verificar estado actual de Firestore
   */
  async checkFirestoreStatus() {
    console.log('🔍 VERIFICANDO ESTADO ACTUAL DE FIRESTORE');
    
    const status = {};
    let totalDocuments = 0;

    for (const collectionName of this.collections) {
      try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        const count = querySnapshot.size;
        status[collectionName] = count;
        totalDocuments += count;
        
        console.log(`📁 ${collectionName}: ${count} documentos`);
      } catch (error) {
        console.error(`❌ Error verificando ${collectionName}:`, error);
        status[collectionName] = `Error: ${error.message}`;
      }
    }

    console.log(`📊 TOTAL DE DOCUMENTOS: ${totalDocuments}`);
    
    return {
      status,
      totalDocuments
    };
  }

  /**
   * Crear datos de prueba básicos después de la limpieza
   */
  async createSampleData(userEmail, organizationId, organizationName) {
    console.log('🌱 CREANDO DATOS DE PRUEBA BÁSICOS');
    
    try {
      // Crear organización
      await setDoc(doc(db, 'organizaciones', organizationId), {
        nombre: organizationName,
        tipo: 'estudio',
        createdAt: new Date(),
        createdBy: userEmail,
        members: [userEmail]
      });
      console.log('✅ Organización creada');

      // Crear usuario
      await setDoc(doc(db, 'users', userEmail.replace('@', '_').replace('.', '_')), {
        email: userEmail,
        organizationId: organizationId,
        organizationName: organizationName,
        organizationType: 'estudio',
        role: 'admin',
        createdAt: new Date()
      });
      console.log('✅ Usuario creado');

      // Crear caso de ejemplo
      await addDoc(collection(db, 'casos'), {
        numero: 'EJEMPLO-001-2026',
        demandante: 'Cliente Ejemplo',
        demandado: 'Demandado Ejemplo',
        materia: 'Civil',
        estado: 'En trámite',
        fechaInicio: new Date(),
        organizacionId: organizationId,
        createdAt: new Date(),
        archivado: false
      });
      console.log('✅ Caso de ejemplo creado');

      console.log('🎉 DATOS DE PRUEBA CREADOS EXITOSAMENTE');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error creando datos de prueba:', error);
      return { success: false, error: error.message };
    }
  }
}

export default FirestoreCleanup;