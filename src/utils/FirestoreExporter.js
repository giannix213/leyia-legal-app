// src/utils/FirestoreExporter.js - Utilidad para exportar todos los datos de una organización
import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';

export class FirestoreExporter {
  constructor(organizacionId) {
    this.organizacionId = organizacionId;
    this.collections = [
      'casos',
      'audiencias', 
      'caja_chica',
      'contactos',
      'expedientes',
      'tareas',
      'documentos',
      'usuarios',
      'configuraciones'
    ];
  }

  // Exportar todos los datos de la organización
  async exportAllData() {
    const exportData = {
      organizacion: {
        id: this.organizacionId,
        fechaExportacion: new Date().toISOString(),
        version: '1.0'
      },
      colecciones: {},
      estadisticas: {
        totalDocumentos: 0,
        documentosPorColeccion: {}
      }
    };

    // Primero obtener información de la organización
    try {
      const orgSnapshot = await getDocs(collection(db, 'organizaciones'));
      const orgData = orgSnapshot.docs.find(doc => doc.id === this.organizacionId);
      
      if (orgData) {
        exportData.organizacion.datos = {
          id: orgData.id,
          ...orgData.data()
        };
      }
    } catch (error) {
      // Error silencioso - la organización puede no existir
    }

    // Exportar cada colección
    for (const collectionName of this.collections) {
      try {
        const data = await this.exportCollection(collectionName);
        exportData.colecciones[collectionName] = data;
        exportData.estadisticas.documentosPorColeccion[collectionName] = data.length;
        exportData.estadisticas.totalDocumentos += data.length;
      } catch (error) {
        exportData.colecciones[collectionName] = {
          error: error.message,
          documentos: []
        };
      }
    }

    return exportData;
  }

  // Exportar una colección específica
  async exportCollection(collectionName) {
    try {
      // Intentar filtrar por organizacionId
      const q = query(
        collection(db, collectionName),
        where('organizacionId', '==', this.organizacionId)
      );
      
      const querySnapshot = await getDocs(q);
      const documents = [];
      
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        
        // Convertir Timestamps a strings para serialización
        const cleanData = this.cleanFirestoreData(data);
        
        documents.push({
          id: doc.id,
          ...cleanData
        });
      });
      
      return documents;
      
    } catch (error) {
      // Si falla el filtro, intentar obtener todos los documentos
      try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        const documents = [];
        
        querySnapshot.docs.forEach(doc => {
          const data = doc.data();
          
          // Solo incluir si pertenece a la organización
          if (data.organizacionId === this.organizacionId) {
            const cleanData = this.cleanFirestoreData(data);
            documents.push({
              id: doc.id,
              ...cleanData
            });
          }
        });
        
        return documents;
        
      } catch (secondError) {
        throw secondError;
      }
    }
  }

  // Limpiar datos de Firestore para serialización
  cleanFirestoreData(data) {
    const cleaned = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === 'object') {
        // Convertir Timestamps de Firestore
        if (value.toDate && typeof value.toDate === 'function') {
          cleaned[key] = value.toDate().toISOString();
        }
        // Convertir objetos anidados
        else if (value.seconds !== undefined && value.nanoseconds !== undefined) {
          // Es un Timestamp serializado
          cleaned[key] = new Date(value.seconds * 1000).toISOString();
        }
        // Objetos normales
        else if (Array.isArray(value)) {
          cleaned[key] = value.map(item => 
            typeof item === 'object' ? this.cleanFirestoreData(item) : item
          );
        }
        else {
          cleaned[key] = this.cleanFirestoreData(value);
        }
      } else {
        cleaned[key] = value;
      }
    }
    
    return cleaned;
  }

  // Generar archivo JSON para descarga
  async generateDownloadFile() {
    const data = await this.exportAllData();
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Crear enlace de descarga
    const link = document.createElement('a');
    link.href = url;
    link.download = `firestore_export_${this.organizacionId}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Limpiar URL
    URL.revokeObjectURL(url);
    
    return data;
  }

  // Generar reporte en texto plano
  generateTextReport(data) {
    let report = '';
    
    report += '='.repeat(80) + '\n';
    report += `REPORTE DE EXPORTACIÓN DE DATOS - FIRESTORE\n`;
    report += '='.repeat(80) + '\n';
    report += `Organización: ${data.organizacion.id}\n`;
    report += `Fecha de exportación: ${data.organizacion.fechaExportacion}\n`;
    report += `Total de documentos: ${data.estadisticas.totalDocumentos}\n`;
    report += '\n';
    
    report += 'ESTADÍSTICAS POR COLECCIÓN:\n';
    report += '-'.repeat(40) + '\n';
    
    for (const [collection, count] of Object.entries(data.estadisticas.documentosPorColeccion)) {
      report += `${collection.padEnd(20)} : ${count} documentos\n`;
    }
    
    report += '\n';
    report += 'DATOS DE LA ORGANIZACIÓN:\n';
    report += '-'.repeat(40) + '\n';
    
    if (data.organizacion.datos) {
      const orgData = data.organizacion.datos;
      report += `ID: ${orgData.id}\n`;
      report += `Nombre: ${orgData.nombre || 'No definido'}\n`;
      report += `Descripción: ${orgData.descripcion || 'No definida'}\n`;
      report += `Tipo: ${orgData.tipo || 'No definido'}\n`;
      report += `Activa: ${orgData.activa ? 'Sí' : 'No'}\n`;
      
      if (orgData.estadisticas) {
        report += `Total casos: ${orgData.estadisticas.totalCasos || 0}\n`;
        report += `Total usuarios: ${orgData.estadisticas.totalUsuarios || 0}\n`;
      }
    }
    
    report += '\n';
    report += 'DETALLE POR COLECCIÓN:\n';
    report += '='.repeat(80) + '\n';
    
    for (const [collectionName, documents] of Object.entries(data.colecciones)) {
      if (documents.error) {
        report += `\n${collectionName.toUpperCase()} - ERROR:\n`;
        report += `-`.repeat(40) + '\n';
        report += `Error: ${documents.error}\n`;
        continue;
      }
      
      report += `\n${collectionName.toUpperCase()} (${documents.length} documentos):\n`;
      report += `-`.repeat(40) + '\n';
      
      if (documents.length === 0) {
        report += 'No hay documentos en esta colección.\n';
        continue;
      }
      
      // Mostrar primeros 5 documentos como muestra
      const sample = documents.slice(0, 5);
      
      sample.forEach((doc, index) => {
        report += `\n${index + 1}. ID: ${doc.id}\n`;
        
        // Mostrar campos principales según el tipo de colección
        if (collectionName === 'casos') {
          report += `   Número: ${doc.numero || 'No definido'}\n`;
          report += `   Cliente: ${doc.cliente || doc.demandante || 'No definido'}\n`;
          report += `   Tipo: ${doc.tipo || 'No definido'}\n`;
          report += `   Estado: ${doc.estado || 'No definido'}\n`;
        } else if (collectionName === 'audiencias') {
          report += `   Fecha: ${doc.fecha || 'No definida'}\n`;
          report += `   Hora: ${doc.hora || 'No definida'}\n`;
          report += `   Tipo: ${doc.tipo || 'No definido'}\n`;
        } else if (collectionName === 'caja_chica') {
          report += `   Concepto: ${doc.concepto || 'No definido'}\n`;
          report += `   Monto: ${doc.monto || 'No definido'}\n`;
          report += `   Tipo: ${doc.tipo || 'No definido'}\n`;
        } else {
          // Para otras colecciones, mostrar algunos campos genéricos
          const keys = Object.keys(doc).filter(k => k !== 'id' && k !== 'organizacionId').slice(0, 3);
          keys.forEach(key => {
            const value = doc[key];
            if (typeof value === 'string' && value.length > 50) {
              report += `   ${key}: ${value.substring(0, 50)}...\n`;
            } else {
              report += `   ${key}: ${value}\n`;
            }
          });
        }
      });
      
      if (documents.length > 5) {
        report += `\n   ... y ${documents.length - 5} documentos más.\n`;
      }
    }
    
    report += '\n';
    report += '='.repeat(80) + '\n';
    report += 'FIN DEL REPORTE\n';
    report += '='.repeat(80) + '\n';
    
    return report;
  }
}

// Instancia para la organización específica
export const firestoreExporter = new FirestoreExporter('estudio_1766865619896_f6yqlp8c6');