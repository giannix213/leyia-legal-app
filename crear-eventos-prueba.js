// Script para crear eventos de prueba en el calendario
// Este script simula la creación de eventos para verificar la visualización

console.log('🎯 Creando eventos de prueba para el calendario...');

// Simular eventos de prueba que deberían aparecer como puntos
const eventosPrueba = [
  {
    id: 'evento-1',
    titulo: 'Audiencia Civil',
    tipo: 'audiencia',
    fecha: '2026-01-20',
    hora: '09:00',
    caso: 'CASO-001',
    lugar: 'Juzgado Civil',
    juez: 'Dr. García',
    abogado: 'Lic. Martínez',
    notas: 'Audiencia de conciliación',
    organizacionId: 'test-org',
    origen: 'audiencia'
  },
  {
    id: 'evento-2',
    titulo: 'Reunión con Cliente',
    tipo: 'reunion',
    fecha: '2026-01-21',
    hora: '14:00',
    caso: 'CASO-002',
    lugar: 'Oficina',
    abogado: 'Lic. López',
    notas: 'Revisión de documentos',
    organizacionId: 'test-org',
    origen: 'audiencia'
  },
  {
    id: 'tarea-1',
    tareaId: 'tarea-001',
    titulo: 'Tarea: Preparar alegatos',
    tipo: 'tarea',
    fecha: '2026-01-22',
    hora: '10:00',
    caso: 'CASO-003',
    prioridad: 'alta',
    asignadoA: 'Lic. Rodríguez',
    notas: 'Preparar alegatos para audiencia',
    organizacionId: 'test-org',
    origen: 'tarea',
    esTareaEquipo: true
  },
  {
    id: 'evento-3',
    titulo: 'Vencimiento de Plazo',
    tipo: 'vencimiento',
    fecha: '2026-01-23',
    hora: '16:00',
    caso: 'CASO-004',
    lugar: 'Tribunal',
    notas: 'Vencimiento para presentar recurso',
    organizacionId: 'test-org',
    origen: 'audiencia'
  }
];

// Mostrar los eventos que deberían aparecer
console.log('📅 Eventos de prueba creados:');
eventosPrueba.forEach((evento, index) => {
  console.log(`${index + 1}. ${evento.titulo}`);
  console.log(`   📅 Fecha: ${evento.fecha}`);
  console.log(`   🕐 Hora: ${evento.hora}`);
  console.log(`   📁 Caso: ${evento.caso || 'Sin caso'}`);
  console.log(`   🎯 Tipo: ${evento.tipo}`);
  if (evento.esTareaEquipo) {
    console.log(`   ⚡ Prioridad: ${evento.prioridad}`);
  }
  console.log('   ---');
});

console.log('✅ Eventos de prueba listos para mostrar en el calendario');
console.log('🔍 Verifica que estos eventos aparezcan como puntos en los días correspondientes');

// Instrucciones para el usuario
console.log('\n📋 INSTRUCCIONES:');
console.log('1. Ve al calendario en la aplicación');
console.log('2. Navega a enero 2026');
console.log('3. Busca los días 20, 21, 22 y 23 de enero');
console.log('4. Deberías ver puntos de colores en esos días');
console.log('5. Los puntos de audiencias serán azules/rojos/naranjas según el tipo');
console.log('6. Los puntos de tareas serán de color según la prioridad (rojo=alta, naranja=media, verde=baja)');