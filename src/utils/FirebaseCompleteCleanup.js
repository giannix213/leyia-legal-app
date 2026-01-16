// src/utils/FirebaseCompleteCleanup.js - Limpieza completa de Firebase
import { db, auth } from '../firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  deleteDoc,
  writeBatch
} from 'firebase/firestore';

export class FirebaseCompleteCleanup {
  constructor() {
    this.collections = [
      'casos',
      'audiencias', 
      'caja_chica',
      'contactos',
      'expedientes',
      'tareas',
      'documentos',
      'usuarios',
      'configuraciones',
      'organizaciones',
      'organizations'
    ];
  }

  // Eliminar todas las colecciones de Firestore
  async deleteAllCollections() {
    console.log('🗑️ INICIANDO LIMPIEZA COMPLETA DE FIRESTORE');
    
    const results = {};
    let totalDeleted = 0;

    for (const collectionName of this.collections) {
      try {
        console.log(`🗑️ Eliminando colección: ${collectionName}`);
        
        const querySnapshot = await getDocs(collection(db, collectionName));
        const docs = querySnapshot.docs;
        
        if (docs.length === 0) {
          console.log(`ℹ️ Colección ${collectionName} ya estaba vacía`);
          results[collectionName] = { success: true, count: 0 };
          continue;
        }

        // Eliminar en lotes de 500 (límite de Firestore)
        const batchSize = 500;
        let deletedCount = 0;

        for (let i = 0; i < docs.length; i += batchSize) {
          const batch = writeBatch(db);
          const batchDocs = docs.slice(i, i + batchSize);
          
          batchDocs.forEach(docSnapshot => {
            batch.delete(docSnapshot.ref);
          });
          
          await batch.commit();
          deletedCount += batchDocs.length;
          
          console.log(`   Eliminados ${deletedCount}/${docs.length} documentos de ${collectionName}`);
        }

        results[collectionName] = { success: true, count: deletedCount };
        totalDeleted += deletedCount;
        
        console.log(`✅ Eliminados ${deletedCount} documentos de ${collectionName}`);

      } catch (error) {
        console.error(`❌ Error eliminando ${collectionName}:`, error);
        results[collectionName] = { success: false, error: error.message };
      }
    }

    console.log('🎯 RESUMEN DE LIMPIEZA COMPLETA:');
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

  // Limpiar localStorage y sessionStorage
  async clearLocalStorage() {
    console.log('🗑️ Limpiando localStorage y sessionStorage...');
    
    // Limpiar datos específicos de la aplicación
    const keysToRemove = [
      'organizacionActual',
      'usuarioActual',
      'textosExpedientes',
      'ordenExpedientes',
      'firebase:authUser',
      'firebase:host'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    // Limpiar todas las claves que contengan 'firebase'
    Object.keys(localStorage).forEach(key => {
      if (key.toLowerCase().includes('firebase') || 
          key.toLowerCase().includes('google') ||
          key.toLowerCase().includes('auth')) {
        localStorage.removeItem(key);
      }
    });
    
    Object.keys(sessionStorage).forEach(key => {
      if (key.toLowerCase().includes('firebase') || 
          key.toLowerCase().includes('google') ||
          key.toLowerCase().includes('auth')) {
        sessionStorage.removeItem(key);
      }
    });
    
    console.log('✅ localStorage y sessionStorage limpiados');
  }

  // Cerrar sesión de Firebase Auth
  async signOutFirebase() {
    try {
      console.log('🚪 Cerrando sesión de Firebase Auth...');
      await auth.signOut();
      console.log('✅ Sesión de Firebase cerrada');
    } catch (error) {
      console.error('❌ Error cerrando sesión:', error);
    }
  }

  // Limpieza completa (todo)
  async completeCleanup() {
    console.log('🧹 INICIANDO LIMPIEZA COMPLETA DE FIREBASE Y DATOS LOCALES');
    
    try {
      // 1. Cerrar sesión
      await this.signOutFirebase();
      
      // 2. Limpiar Firestore
      const firestoreResult = await this.deleteAllCollections();
      
      // 3. Limpiar datos locales
      await this.clearLocalStorage();
      
      // 4. Limpiar IndexedDB de Firebase (si existe)
      await this.clearIndexedDB();
      
      console.log('✅ LIMPIEZA COMPLETA FINALIZADA');
      
      return {
        success: true,
        message: 'Limpieza completa exitosa',
        firestoreResult
      };
      
    } catch (error) {
      console.error('❌ Error en limpieza completa:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Limpiar IndexedDB de Firebase
  async clearIndexedDB() {
    if (!window.indexedDB) return;
    
    try {
      console.log('🗑️ Limpiando IndexedDB de Firebase...');
      
      // Obtener todas las bases de datos
      const databases = await indexedDB.databases();
      
      for (const db of databases) {
        if (db.name && (
          db.name.includes('firebase') || 
          db.name.includes('firestore') ||
          db.name.includes('auth')
        )) {
          console.log(`   🗑️ Eliminando base de datos: ${db.name}`);
          indexedDB.deleteDatabase(db.name);
        }
      }
      
      console.log('✅ IndexedDB limpiado');
    } catch (error) {
      console.log('⚠️ No se pudo limpiar IndexedDB:', error.message);
    }
  }

  // Crear datos de prueba básicos
  async createTestData() {
    console.log('🎯 Creando datos de prueba...');
    
    try {
      const { setDoc, doc, serverTimestamp } = await import('firebase/firestore');
      
      // Crear organización de prueba
      const orgId = `test_org_${Date.now()}`;
      const orgData = {
        id: orgId,
        nombre: 'Organización de Prueba',
        descripcion: 'Organización creada para pruebas',
        tipo: 'estudio_juridico',
        requiereCodigoAcceso: false,
        codigoAcceso: '',
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
      
      await setDoc(doc(db, 'organizaciones', orgId), orgData);
      console.log('✅ Organización de prueba creada:', orgId);
      
      return {
        success: true,
        organizacionId: orgId,
        organizacionData: orgData
      };
      
    } catch (error) {
      console.error('❌ Error creando datos de prueba:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Instancia singleton
export const firebaseCompleteCleanup = new FirebaseCompleteCleanup();