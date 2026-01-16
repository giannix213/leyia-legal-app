// casosUtils.js - Utilidades extraídas del componente Casos
// Funciones de formato y lógica de "Leyia" para reducir el tamaño del componente principal

// Función para obtener el emoji según el tipo de expediente
export const getEmojiPorTipo = (tipo) => {
  const tipoLower = (tipo || '').toLowerCase();
  
  if (tipoLower.includes('civil')) return '⚖️';
  if (tipoLower.includes('penal')) return '🚔';
  if (tipoLower.includes('familia')) return '👨‍👩‍👧‍👦';
  if (tipoLower.includes('comercial')) return '💼';
  if (tipoLower.includes('contencioso administrativo')) return '🏛️';
  if (tipoLower.includes('no contencioso')) return '📋';
  if (tipoLower.includes('ejecucion') || tipoLower.includes('ejecutivo')) return '💰';
  if (tipoLower.includes('laboral')) return '👷';
  if (tipoLower.includes('constitucional')) return '📜';
  if (tipoLower.includes('tributario')) return '💸';
  
  return '⚖️'; // emoji por defecto
};

// Función para obtener el color según el tipo de caso
export const getColorPorTipo = (tipo) => {
  const tipoLower = (tipo || '').toLowerCase();
  if (tipoLower.includes('civil')) return '#fbbf24'; // amarillo
  if (tipoLower.includes('penal')) return '#3b82f6'; // azul
  if (tipoLower.includes('familia')) return '#fb923c'; // naranja
  if (tipoLower.includes('comercial')) return '#8b5cf6'; // morado
  if (tipoLower.includes('contencioso administrativo')) return '#ef4444'; // rojo
  if (tipoLower.includes('no contencioso')) return '#06b6d4'; // cyan
  if (tipoLower.includes('ejecucion') || tipoLower.includes('ejecutivo')) return '#14b8a6'; // teal
  if (tipoLower.includes('laboral')) return '#10b981'; // verde
  if (tipoLower.includes('constitucional')) return '#ec4899'; // rosa
  if (tipoLower.includes('tributario')) return '#f97316'; // naranja oscuro
  return '#64748b'; // gris por defecto
};

// Función para obtener la imagen según el tipo de expediente
export const getImagenPorTipo = (tipo) => {
  const tipoLower = (tipo || '').toLowerCase();
  
  // Función helper para obtener la ruta correcta según el entorno
  const getRutaImagen = (nombreArchivo) => {
    // En Electron, las imágenes están en el directorio public
    if (window.require) {
      // Estamos en Electron
      return `./public/${nombreArchivo}`;
    }
    // En web normal
    return `${process.env.PUBLIC_URL || ''}/${nombreArchivo}`;
  };
  
  // Mapeo de tipos a imágenes
  if (tipoLower.includes('civil')) return getRutaImagen('civil.png');
  if (tipoLower.includes('penal')) return getRutaImagen('penal.png');
  if (tipoLower.includes('familia')) return getRutaImagen('familia.png');
  if (tipoLower.includes('comercial')) return getRutaImagen('comercial.svg');
  if (tipoLower.includes('no contencioso') || tipoLower.includes('no_contencioso')) return getRutaImagen('no_contencioso.png');
  if (tipoLower.includes('contencioso')) return getRutaImagen('contencioso.svg');
  if (tipoLower.includes('ejecucion') || tipoLower.includes('ejecutivo')) return getRutaImagen('ejecución.png');
  if (tipoLower.includes('laboral')) return getRutaImagen('laboral.svg');
  if (tipoLower.includes('constitucional')) return getRutaImagen('constitucional.svg');
  if (tipoLower.includes('tributario')) return getRutaImagen('tributario.svg');
  
  // Imagen por defecto para tipos no reconocidos
  return getRutaImagen('ic_justice.png');
};

// Función para obtener el gradiente futurista por tipo
export const getGradientePorTipo = (tipo) => {
  const tipoLower = (tipo || '').toLowerCase();
  
  if (tipoLower.includes('civil')) return 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)';
  if (tipoLower.includes('penal')) return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
  if (tipoLower.includes('familia')) return 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)';
  if (tipoLower.includes('comercial')) return 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
  if (tipoLower.includes('contencioso')) return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
  if (tipoLower.includes('no contencioso')) return 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)';
  if (tipoLower.includes('ejecucion') || tipoLower.includes('ejecutivo')) return 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)';
  if (tipoLower.includes('laboral')) return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
  if (tipoLower.includes('constitucional')) return 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)';
  if (tipoLower.includes('tributario')) return 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)';
  
  return 'linear-gradient(135deg, #64748b 0%, #475569 100%)'; // gris por defecto
};

// Función para obtener las etiquetas de partes según el tipo de caso
export const getEtiquetasPartes = (tipo) => {
  const tipoLower = (tipo || '').toLowerCase();
  if (tipoLower.includes('penal')) {
    return { parte1: 'Agraviado/a', parte2: 'Acusado/a' };
  }
  if (tipoLower.includes('ejecucion') || tipoLower.includes('ejecutivo')) {
    return { parte1: 'Ejecutante', parte2: 'Ejecutado' };
  }
  return { parte1: 'Demandante', parte2: 'Demandado' };
};

// Función para obtener las etapas procesales según el tipo de caso
export const getEtapasProcesales = (tipo) => {
  const tipoLower = (tipo || '').toLowerCase();
  
  if (tipoLower.includes('penal')) {
    return [
      { value: 'diligencias_preliminares', label: '🔍 Diligencias Preliminares' },
      { value: 'investigacion_preparatoria', label: '📋 Investigación Preparatoria' },
      { value: 'etapa_intermedia', label: '⚖️ Etapa Intermedia' },
      { value: 'juzgamiento', label: '🏛️ Juzgamiento (Juicio Oral)' },
      { value: 'sentencia', label: '📜 Sentencia' },
      { value: 'apelacion', label: '📤 Apelación' },
      { value: 'casacion', label: '🏛️ Casación' },
      { value: 'queja', label: '📋 Queja' },
      { value: 'ejecucion', label: '✅ Ejecución' },
      { value: 'revision', label: '🔄 Revisión' },
      { value: 'archivado', label: '📁 Archivado' },
      { value: 'sobreseimiento', label: '🚫 Sobreseimiento' }
    ];
  }
  
  if (tipoLower.includes('laboral')) {
    return [
      { value: 'postulacion', label: '📝 Postulación' },
      { value: 'audiencia_conciliacion', label: '🤝 Audiencia de Conciliación' },
      { value: 'audiencia_juzgamiento', label: '⚖️ Audiencia de Juzgamiento' },
      { value: 'sentencia', label: '📜 Sentencia' },
      { value: 'apelacion', label: '📤 Apelación' },
      { value: 'casacion', label: '🏛️ Casación' },
      { value: 'queja', label: '📋 Queja' },
      { value: 'ejecucion', label: '✅ Ejecución' },
      { value: 'liquidacion', label: '💰 Liquidación' },
      { value: 'archivado', label: '📁 Archivado' },
      { value: 'conciliado', label: '🤝 Conciliado' }
    ];
  }
  
  if (tipoLower.includes('contencioso')) {
    return [
      { value: 'via_administrativa', label: '🏢 Vía Administrativa Previa' },
      { value: 'postulacion', label: '📝 Postulación de Demanda' },
      { value: 'saneamiento', label: '🔧 Saneamiento y Pruebas' },
      { value: 'audiencia_unica', label: '⚖️ Audiencia Única' },
      { value: 'sentencia', label: '📜 Sentencia' },
      { value: 'apelacion', label: '📤 Apelación' },
      { value: 'casacion', label: '🏛️ Casación' },
      { value: 'queja', label: '📋 Queja' },
      { value: 'ejecucion', label: '✅ Ejecución' },
      { value: 'medida_cautelar', label: '⚠️ Medida Cautelar' },
      { value: 'archivado', label: '📁 Archivado' }
    ];
  }
  
  if (tipoLower.includes('ejecucion') || tipoLower.includes('ejecutivo')) {
    return [
      { value: 'demanda_titulo', label: '📋 Demanda y Título Ejecutivo' },
      { value: 'mandato_ejecutivo', label: '⚖️ Mandato Ejecutivo' },
      { value: 'contradiccion', label: '📝 Contradicción' },
      { value: 'llevar_adelante', label: '▶️ Llevar Adelante Ejecución' },
      { value: 'embargo', label: '🔒 Embargo de Bienes' },
      { value: 'remate', label: '🔨 Remate Judicial' },
      { value: 'apelacion', label: '📤 Apelación' },
      { value: 'queja', label: '📋 Queja' },
      { value: 'terceria', label: '👥 Tercería' },
      { value: 'pago_satisfaccion', label: '✅ Pago/Satisfacción' },
      { value: 'archivado', label: '📁 Archivado' }
    ];
  }

  if (tipoLower.includes('familia')) {
    return [
      { value: 'postulacion', label: '📝 Postulación' },
      { value: 'audiencia_saneamiento', label: '🔧 Audiencia de Saneamiento' },
      { value: 'audiencia_pruebas', label: '🔍 Audiencia de Pruebas' },
      { value: 'sentencia', label: '📜 Sentencia' },
      { value: 'apelacion', label: '📤 Apelación' },
      { value: 'casacion', label: '🏛️ Casación' },
      { value: 'queja', label: '📋 Queja' },
      { value: 'ejecucion', label: '✅ Ejecución' },
      { value: 'liquidacion', label: '💰 Liquidación de Pensiones' },
      { value: 'medida_proteccion', label: '🛡️ Medida de Protección' },
      { value: 'archivado', label: '📁 Archivado' },
      { value: 'conciliado', label: '🤝 Conciliado' }
    ];
  }

  if (tipoLower.includes('comercial')) {
    return [
      { value: 'postulacion', label: '📝 Postulación' },
      { value: 'contestacion', label: '📋 Contestación' },
      { value: 'probatoria', label: '🔍 Etapa Probatoria' },
      { value: 'alegatos', label: '📝 Alegatos' },
      { value: 'sentencia', label: '📜 Sentencia' },
      { value: 'apelacion', label: '📤 Apelación' },
      { value: 'casacion', label: '🏛️ Casación' },
      { value: 'queja', label: '📋 Queja' },
      { value: 'ejecucion', label: '✅ Ejecución' },
      { value: 'arbitraje', label: '⚖️ Arbitraje' },
      { value: 'conciliacion', label: '🤝 Conciliación' },
      { value: 'archivado', label: '📁 Archivado' }
    ];
  }

  if (tipoLower.includes('constitucional')) {
    return [
      { value: 'postulacion', label: '📝 Postulación' },
      { value: 'traslado', label: '📋 Traslado' },
      { value: 'contestacion', label: '📝 Contestación' },
      { value: 'sentencia', label: '📜 Sentencia' },
      { value: 'aclaracion', label: '❓ Aclaración' },
      { value: 'ejecucion', label: '✅ Ejecución' },
      { value: 'queja', label: '📋 Queja' },
      { value: 'archivado', label: '📁 Archivado' },
      { value: 'inadmisible', label: '🚫 Inadmisible' },
      { value: 'improcedente', label: '❌ Improcedente' }
    ];
  }

  if (tipoLower.includes('tributario')) {
    return [
      { value: 'postulacion', label: '📝 Postulación' },
      { value: 'contestacion', label: '📋 Contestación' },
      { value: 'probatoria', label: '🔍 Etapa Probatoria' },
      { value: 'sentencia', label: '📜 Sentencia' },
      { value: 'apelacion', label: '📤 Apelación' },
      { value: 'casacion', label: '🏛️ Casación' },
      { value: 'queja', label: '📋 Queja' },
      { value: 'ejecucion', label: '✅ Ejecución' },
      { value: 'medida_cautelar', label: '⚠️ Medida Cautelar' },
      { value: 'fraccionamiento', label: '📊 Fraccionamiento' },
      { value: 'archivado', label: '📁 Archivado' }
    ];
  }
  
  // Civil y otros (proceso común) - Estados más completos
  return [
    { value: 'postulatoria', label: '📝 Etapa Postulatoria' },
    { value: 'contestacion', label: '📋 Contestación de Demanda' },
    { value: 'reconvencion', label: '🔄 Reconvención' },
    { value: 'saneamiento', label: '🔧 Saneamiento Procesal' },
    { value: 'conciliacion', label: '🤝 Audiencia de Conciliación' },
    { value: 'probatoria', label: '🔍 Etapa Probatoria' },
    { value: 'alegatos', label: '📝 Alegatos' },
    { value: 'sentencia', label: '📜 Sentencia' },
    { value: 'apelacion', label: '📤 Apelación' },
    { value: 'casacion', label: '🏛️ Casación' },
    { value: 'queja', label: '📋 Queja' },
    { value: 'ejecucion', label: '✅ Ejecución de Sentencia' },
    { value: 'liquidacion', label: '💰 Liquidación' },
    { value: 'medida_cautelar', label: '⚠️ Medida Cautelar' },
    { value: 'terceria', label: '👥 Tercería' },
    { value: 'archivado', label: '📁 Archivado' },
    { value: 'conciliado', label: '🤝 Conciliado' },
    { value: 'desistido', label: '🚪 Desistido' }
  ];
};

// Función para formatear fecha de timestamp de Firebase
export const formatearFechaModificacion = (timestamp) => {
  if (!timestamp) return null;
  
  try {
    // Si es un timestamp de Firebase
    const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const ahora = new Date();
    const diferencia = ahora - fecha;
    const minutos = Math.floor(diferencia / 60000);
    const horas = Math.floor(diferencia / 3600000);
    const dias = Math.floor(diferencia / 86400000);
    
    if (minutos < 1) return 'Hace un momento';
    if (minutos < 60) return `Hace ${minutos} min`;
    if (horas < 24) return `Hace ${horas}h`;
    if (dias < 7) return `Hace ${dias}d`;
    
    // Si es más de 7 días, mostrar fecha
    return fecha.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: '2-digit' });
  } catch (error) {
    return null;
  }
};

// Función para calcular días restantes de una alerta
export const calcularDiasRestantes = (alerta) => {
  if (!alerta || !alerta.fechaInicio || !alerta.diasPlazo) return null;
  
  const fechaInicio = new Date(alerta.fechaInicio);
  const fechaLimite = new Date(fechaInicio);
  fechaLimite.setDate(fechaLimite.getDate() + parseInt(alerta.diasPlazo));
  
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  fechaLimite.setHours(0, 0, 0, 0);
  
  const diferenciaTiempo = fechaLimite - hoy;
  const diasRestantes = Math.ceil(diferenciaTiempo / (1000 * 60 * 60 * 24));
  
  return {
    diasRestantes,
    fechaLimite: fechaLimite.toLocaleDateString('es-PE'),
    vencido: diasRestantes < 0,
    urgente: diasRestantes >= 0 && diasRestantes <= 2
  };
};

// Función para calcular días hasta audiencia
export const calcularDiasHastaAudiencia = (fechaAudiencia) => {
  if (!fechaAudiencia) return null;
  
  // Parsear fecha en formato YYYY-MM-DD
  const partes = fechaAudiencia.split('-');
  if (partes.length !== 3) return null;
  
  const fechaAud = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
  const hoy = new Date();
  
  hoy.setHours(0, 0, 0, 0);
  fechaAud.setHours(0, 0, 0, 0);
  
  const diferenciaTiempo = fechaAud - hoy;
  const diasRestantes = Math.ceil(diferenciaTiempo / (1000 * 60 * 60 * 24));
  
  // Determinar formato de visualización
  let textoTiempo = '';
  if (diasRestantes < 7) {
    // Menos de 7 días: mostrar en días
    textoTiempo = `${diasRestantes}d`;
  } else if (diasRestantes < 63) {
    // Entre 7 y 63 días (9 semanas): mostrar en semanas
    const semanas = Math.floor(diasRestantes / 7);
    textoTiempo = `${semanas}sem`;
  } else {
    // Más de 63 días (9 semanas): mostrar en meses
    const meses = Math.floor(diasRestantes / 30);
    textoTiempo = `${meses}m`;
  }
  
  return {
    diasRestantes,
    textoTiempo,
    esHoy: diasRestantes === 0,
    esPasado: diasRestantes < 0,
    esProximo: diasRestantes >= 0 && diasRestantes <= 3
  };
};

// Función para calcular semanas de retraso
export const calcularSemanasRetraso = (alertaRetraso) => {
  if (!alertaRetraso || !alertaRetraso.fechaUltimoActuado) return null;
  
  const fechaUltimoActuado = new Date(alertaRetraso.fechaUltimoActuado);
  const hoy = new Date();
  
  // Calcular diferencia en semanas
  const diferenciaTiempo = hoy - fechaUltimoActuado;
  const semanas = Math.floor(diferenciaTiempo / (1000 * 60 * 60 * 24 * 7));
  
  const semanasAlerta = parseInt(alertaRetraso.semanasAlerta) || 2;
  
  return {
    semanasTranscurridas: semanas,
    fechaUltimoActuado: fechaUltimoActuado.toLocaleDateString('es-PE'),
    enRetraso: semanas >= semanasAlerta,
    semanasAlerta: semanasAlerta,
    diferencia: semanas - semanasAlerta
  };
};
// Función para obtener la clase CSS del tipo de expediente para bordes luminosos
export const getClaseTipoPorTipo = (tipo) => {
  const tipoLower = (tipo || '').toLowerCase();
  
  if (tipoLower.includes('civil')) return 'tipo-civil';
  if (tipoLower.includes('penal')) return 'tipo-penal';
  if (tipoLower.includes('familia')) return 'tipo-familia';
  if (tipoLower.includes('comercial')) return 'tipo-comercial';
  if (tipoLower.includes('contencioso administrativo')) return 'tipo-contencioso';
  if (tipoLower.includes('no contencioso') || tipoLower.includes('no_contencioso')) return 'tipo-no-contencioso';
  if (tipoLower.includes('ejecucion') || tipoLower.includes('ejecutivo')) return 'tipo-ejecucion';
  if (tipoLower.includes('laboral')) return 'tipo-laboral';
  if (tipoLower.includes('constitucional')) return 'tipo-constitucional';
  if (tipoLower.includes('tributario')) return 'tipo-tributario';
  
  return 'tipo-default'; // clase por defecto
};

// Función para obtener el color de fondo del estado según la materia
export const getColorEstadoPorTipo = (tipo) => {
  const tipoLower = (tipo || '').toLowerCase();
  
  if (tipoLower.includes('civil')) return '#fbbf24'; // amarillo
  if (tipoLower.includes('familia')) return '#fb923c'; // naranja
  if (tipoLower.includes('penal')) return '#3b82f6'; // azul
  if (tipoLower.includes('comercial')) return '#8b5cf6'; // morado
  if (tipoLower.includes('contencioso administrativo')) return '#ef4444'; // rojo
  if (tipoLower.includes('no contencioso')) return '#06b6d4'; // cyan
  if (tipoLower.includes('ejecucion') || tipoLower.includes('ejecutivo')) return '#14b8a6'; // teal
  if (tipoLower.includes('laboral')) return '#10b981'; // verde
  if (tipoLower.includes('constitucional')) return '#ec4899'; // rosa
  if (tipoLower.includes('tributario')) return '#f97316'; // naranja oscuro
  
  return '#64748b'; // gris por defecto
};