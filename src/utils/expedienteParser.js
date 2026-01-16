// Centralización de patrones para mantenimiento sencillo
const PATRONES = {
  expediente: [
    /EXPEDIENTE\s*:\s*([0-9]{3,6}-[0-9]{4}[A-Z0-9\-]*)/i,
    /Expediente\s*N°?\s*:\s*([^\s\n\r,;]+)/i,
    /([0-9]{5}-[0-9]{4}-[0-9]+-[0-9]{4}-[A-Z]{2}-[A-Z]{2})/i,
    /([0-9]{3,5}-[0-9]{4}[A-Z\-0-9]*)/i
  ],
  campos: [
    { key: 'organoJurisdiccional', regex: /Órgano Jurisdiccional:\s*([^\n\r]+)/i },
    { key: 'juez', regex: /Juez:\s*([^\n\r]+)/i },
    { key: 'especialistaLegal', regex: /Especialista Legal:\s*([^\n\r]+)/i },
    { key: 'tipoProcesoDetalle', regex: /Proceso:\s*([^\n\r]+)/i },
    { key: 'tipo', regex: /Especialidad:\s*([^\n\r]+)/i },
    { key: 'descripcion', regex: /Materia\(s\):\s*([^\n\r]+)/i },
    { key: 'ubicacion', regex: /Ubicación:\s*([^\n\r]+)/i }
  ],
  fecha: /(\d{1,2}\/\d{1,2}\/\d{4})/,
  partes: {
    demandante: /DEMANDANTE[^D]*?([A-Z\s,]+?)(?=DEMANDADO|PERITO|$)/i,
    demandado: /DEMANDADO[^D]*?([A-Z\s,]+?)(?=DEMANDANTE|PERITO|$)/i
  }
};

export const extraerDatosExpediente = (texto) => {
  const datos = {
    abogado: 'Por asignar',
    prioridad: 'media',
    estado: 'postulatoria'
  };

  // Limpieza inicial: insertar saltos de línea para mejorar detección
  const textoLimpio = texto.replace(/(Expediente N°:|Órgano|Juez|Especialista|Proceso|Materia)/g, '\n$1');

  // 1. Extraer Número
  for (const regex of PATRONES.expediente) {
    const match = textoLimpio.match(regex);
    if (match) {
      datos.numero = match[1].trim().replace(/[^A-Z0-9\-]/g, '');
      break;
    }
  }

  // 2. Extraer Campos de Texto
  PATRONES.campos.forEach(({ key, regex }) => {
    const match = textoLimpio.match(regex);
    if (match && match[1]) {
      let valor = match[1].trim();
      if (valor && valor !== '-------') {
        datos[key] = (key === 'tipo') ? valor.toLowerCase() : valor;
      }
    }
  });

  // 3. Normalizar Fecha (DD/MM/YYYY -> YYYY-MM-DD)
  const fechaMatch = textoLimpio.match(PATRONES.fecha);
  if (fechaMatch) {
    const [d, m, y] = fechaMatch[1].split('/');
    datos.fechaInicio = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  return datos;
};