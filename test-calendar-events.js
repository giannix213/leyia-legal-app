// Test script para verificar el guardado de eventos del calendario
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, query, where } = require('firebase/firestore');

// Configuración de Firebase (demo)
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

async function testCalendarEvents() {
  try {
    console.log('🔥 Inicializando Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('✅ Firebase inicializado correctamente');
    
    // Datos de prueba para un evento
    const eventoTest = {
      titulo: 'Evento de Prueba',
      tipo: 'audiencia',
      fecha: '2026-01-20',
      hora: '10:00',
      caso: 'CASO-TEST-001',
      lugar: 'Juzgado de Prueba',
      juez: 'Juez de Prueba',
      abogado: 'Abogado de Prueba',
      notas: 'Este es un evento de prueba para verificar el guardado',
      organizacionId: 'test-org-123',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('💾 Intentando guardar evento de prueba...');
    console.log('📋 Datos del evento:', eventoTest);
    
    // Intentar guardar el evento
    const docRef = await addDoc(collection(db, 'audiencias'), eventoTest);
    console.log('✅ Evento guardado exitosamente con ID:', docRef.id);
    
    // Verificar que se guardó correctamente
    console.log('🔍 Verificando eventos guardados...');
    const eventosQuery = query(
      collection(db, 'audiencias'),
      where('organizacionId', '==', 'test-org-123')
    );
    
    const snapshot = await getDocs(eventosQuery);
    console.log(`📊 Eventos encontrados: ${snapshot.docs.length}`);
    
    snapshot.docs.forEach(doc => {
      console.log('📅 Evento:', doc.id, doc.data());
    });
    
    console.log('✅ Test completado exitosamente');
    
  } catch (error) {
    console.error('❌ Error en el test:', error);
    console.error('📋 Detalles del error:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
  }
}

// Ejecutar el test
testCalendarEvents();