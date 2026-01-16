import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const audienciasData = [
  {"Materia": "DIVISION Y PARTICION.","Expediente": "496-2025","Fecha_Audiencia": "11/11/2025","Hora": "11:00 a. m.","Doctor": "Dra. Paola Yuneli Meza Gallardo.","Observaciones": ""},
  {"Materia": "COMISION A LA ASISTENCIA FAMILIAR","Expediente": "2561-2025","Fecha_Audiencia": "15/12/2025","Hora": "9:00 a. m.","Doctor": "Dra. Paola Yuneli Meza Gallardo.","Observaciones": "Se suspendió la audiencia a la esperan [ilegible] que fijen fecha de reprogramación"},
  {"Materia": "REIVINDICACION","Expediente": "176-2024","Fecha_Audiencia": "26/11/2025","Hora": "10:25 a. m.","Doctor": "","Observaciones": ""},
  {"Materia": "DESLINDE","Expediente": "38-2024","Fecha_Audiencia": "11/12/2025","Hora": "10:00 a. m.","Doctor": "","Observaciones": ""},
  {"Materia": "DESALOJO","Expediente": "368-2017","Fecha_Audiencia": "LANZAMIENTO 20-03-2025","Hora": "9:00 a. m.","Doctor": "","Observaciones": "No tenemos ese número de exp. En relación de procesos de la oficina."},
  {"Materia": "USURPACION AGRAVADA","Expediente": "2413-2022","Fecha_Audiencia": "8/9/2026","Hora": "11:00 a. m.","Doctor": "","Observaciones": ""},
  {"Materia": "","Expediente": "222-2021","Fecha_Audiencia": "27/11/2025","Hora": "12:00 p. m.","Doctor": "","Observaciones": ""},
  {"Materia": "DESALOJO","Expediente": "16-2023","Fecha_Audiencia": "25/11/2025","Hora": "10:00 a. m.","Doctor": "Dr. Eper Meza Reynoso","Observaciones": "Continuación de Audiencia."},
  {"Materia": "","Expediente": "119-2025","Fecha_Audiencia": "11/11/2025","Hora": "9:00 a. m.","Doctor": "Dra. Paola Yuneli Meza Gallardo.","Observaciones": "Se suspendió la audiencia a la esperan [ilegible] que fijen fecha de reprogramación"},
  {"Materia": "","Expediente": "466-2021","Fecha_Audiencia": "2/12/2025","Hora": "12:30 p. m.","Doctor": "","Observaciones": ""},
  {"Materia": "","Expediente": "765-2024","Fecha_Audiencia": "18/12/2025","Hora": "9:00 a. m.","Doctor": "","Observaciones": ""},
  {"Materia": "","Expediente": "208-2024","Fecha_Audiencia": "10/12/2025","Hora": "9:30 a. m.","Doctor": "","Observaciones": ""},
  {"Materia": "COMISION A LA ASISTENCIA FAMILIAR","Expediente": "200-2025","Fecha_Audiencia": "20/1/2026","Hora": "12:30 p. m.","Doctor": "","Observaciones": ""},
  {"Materia": "","Expediente": "561-2023","Fecha_Audiencia": "13/1/2026","Hora": "4:00 p. m.","Doctor": "","Observaciones": ""},
  {"Materia": "FILIACION EXTRAMATRIMONIAL","Expediente": "161-2025","Fecha_Audiencia": "12/1/2026","Hora": "4:00 p. m.","Doctor": "","Observaciones": ""},
  {"Materia": "REIVINDICACION","Expediente": "361-2023","Fecha_Audiencia": "17/11/2025","Hora": "10:25 a. m.","Doctor": "Dr. Eper Meza Reynoso","Observaciones": "Ya se llevo a cabo la Audiencia"},
  {"Materia": "OBLIGACION DE DAR SUMA DE DINERO","Expediente": "404-2025","Fecha_Audiencia": "4/12/2025","Hora": "9:30 a. m.","Doctor": "","Observaciones": ""},
  {"Materia": "COMISION A LA ASISTENCIA FAMILIAR","Expediente": "2724-2025","Fecha_Audiencia": "30/6/2026","Hora": "12:00 p. m.","Doctor": "","Observaciones": ""},
  {"Materia": "DIVORCIO POR CAUSAL","Expediente": "2380-2025","Fecha_Audiencia": "17/12/2025","Hora": "11:00 a. m.","Doctor": "","Observaciones": ""},
  {"Materia": "COMISION A LA ASISTENCIA FAMILIAR","Expediente": "2591-2025","Fecha_Audiencia": "15/12/2025","Hora": "9:30 a. m.","Doctor": "","Observaciones": ""}
];

// Función para convertir fecha DD/MM/YYYY a YYYY-MM-DD
const convertirFecha = (fechaStr) => {
  // Manejar casos especiales como "LANZAMIENTO 20-03-2025"
  if (fechaStr.includes('LANZAMIENTO')) {
    const match = fechaStr.match(/(\d{2})-(\d{2})-(\d{4})/);
    if (match) {
      return `${match[3]}-${match[2]}-${match[1]}`;
    }
  }
  
  // Formato normal DD/MM/YYYY
  const partes = fechaStr.split('/');
  if (partes.length === 3) {
    const dia = partes[0].padStart(2, '0');
    const mes = partes[1].padStart(2, '0');
    const año = partes[2];
    return `${año}-${mes}-${dia}`;
  }
  
  return fechaStr;
};

// Función para normalizar hora
const normalizarHora = (horaStr) => {
  // Convertir "11:00 a. m." a "11:00"
  let hora = horaStr.toLowerCase().replace(/\s/g, '');
  hora = hora.replace('a.m.', '').replace('p.m.', '').replace('am', '').replace('pm', '');
  
  // Si es PM y no es 12, sumar 12 horas
  if (horaStr.toLowerCase().includes('p.m.') || horaStr.toLowerCase().includes('pm')) {
    const partes = hora.split(':');
    let horas = parseInt(partes[0]);
    if (horas !== 12) {
      horas += 12;
    }
    hora = `${horas.toString().padStart(2, '0')}:${partes[1] || '00'}`;
  }
  
  return hora;
};

// Función para determinar el tipo de audiencia
const determinarTipo = (materia) => {
  const materiaLower = materia.toLowerCase();
  if (materiaLower.includes('penal') || materiaLower.includes('usurpacion')) {
    return 'audiencia';
  }
  if (materiaLower.includes('familia') || materiaLower.includes('divorcio') || materiaLower.includes('filiacion')) {
    return 'reunion';
  }
  return 'audiencia';
};

const casosData = [
  {"Unnamed: 1": "DIVISION Y PARTICION. ","Unnamed: 2": "436-2025","Unnamed: 3": "2025-11-11T00:00:00","Unnamed: 4": "11:00:00","Unnamed: 5": null,"Unnamed: 6": null},
  {"Unnamed: 1": "OMISION A LA ASISTENCIA FAMILIAR","Unnamed: 2": "2591-2025","Unnamed: 3": "2025-12-15T00:00:00","Unnamed: 4": "09:30:00","Unnamed: 5": "Dra. Paola Yuneli  Meza Gallardo.","Unnamed: 6": "Se suspedio la audiencia a la esperea de que fijen fecha de reprogramacion "},
  {"Unnamed: 1": "REIVINDICACION","Unnamed: 2": "176-2024","Unnamed: 3": "2025-11-26T00:00:00","Unnamed: 4": "10:25:00","Unnamed: 5": null,"Unnamed: 6": null},
  {"Unnamed: 1": "DESLINDE ","Unnamed: 2": "38-2024","Unnamed: 3": "2025-12-11T00:00:00","Unnamed: 4": "10:00:00","Unnamed: 5": null,"Unnamed: 6": null},
  {"Unnamed: 1": "DESALOJO","Unnamed: 2": "368-2017","Unnamed: 3": "LANZAMIENTO 20-03-2025","Unnamed: 4": "09:00:00","Unnamed: 5": null,"Unnamed: 6": "No tenemos ese numero de exp. En la relacion de procesos de la oficina. "},
  {"Unnamed: 1": "USURPACION AGRAVADA","Unnamed: 2": "2413-2022","Unnamed: 3": "2026-09-08T00:00:00","Unnamed: 4": "11:00:00","Unnamed: 5": null,"Unnamed: 6": null},
  {"Unnamed: 1": null,"Unnamed: 2": "222-2021","Unnamed: 3": "2025-11-27T00:00:00","Unnamed: 4": "12:00:00","Unnamed: 5": null,"Unnamed: 6": null},
  {"Unnamed: 1": "DESALOJO","Unnamed: 2": "16-2023","Unnamed: 3": "2025-11-25T00:00:00","Unnamed: 4": "10:00:00","Unnamed: 5": "Dr. Eper Meza Reynoso","Unnamed: 6": "Continuacion de Audiencia. "},
  {"Unnamed: 1": null,"Unnamed: 2": "119-2025","Unnamed: 3": "2025-11-11T00:00:00","Unnamed: 4": "09:00:00","Unnamed: 5": "Dra. Paola Yuneli  Meza Gallardo.","Unnamed: 6": "Se suspedio la audiencia a la esperea de que fijen fecha de reprogramacion "},
  {"Unnamed: 1": null,"Unnamed: 2": "466-2021","Unnamed: 3": "2025-12-02T00:00:00","Unnamed: 4": "12:30:00","Unnamed: 5": null,"Unnamed: 6": null},
  {"Unnamed: 1": null,"Unnamed: 2": "765-2024","Unnamed: 3": "2025-12-18T00:00:00","Unnamed: 4": "09:00:00","Unnamed: 5": null,"Unnamed: 6": null},
  {"Unnamed: 1": null,"Unnamed: 2": "288-2024","Unnamed: 3": "2025-12-10T00:00:00","Unnamed: 4": "09:30:00","Unnamed: 5": null,"Unnamed: 6": null},
  {"Unnamed: 1": "OMISION A LA ASISTENCIA FAMILIAR","Unnamed: 2": "200-2025","Unnamed: 3": "2026-01-28T00:00:00","Unnamed: 4": "12:30:00","Unnamed: 5": null,"Unnamed: 6": null},
  {"Unnamed: 1": null,"Unnamed: 2": "561-2023","Unnamed: 3": "2026-01-13T00:00:00","Unnamed: 4": "16:00:00","Unnamed: 5": null,"Unnamed: 6": null},
  {"Unnamed: 1": "FILIACION EXTRAMATRIMONIAL ","Unnamed: 2": "163-2025","Unnamed: 3": "2026-01-12T00:00:00","Unnamed: 4": "16:00:00","Unnamed: 5": null,"Unnamed: 6": null},
  {"Unnamed: 1": "REIVINDICACION","Unnamed: 2": "361-2023","Unnamed: 3": "2025-11-17T00:00:00","Unnamed: 4": "10:25:00","Unnamed: 5": "Dr. Eper Meza Reynoso","Unnamed: 6": "Ya se llevo a cabo la Audiencia"},
  {"Unnamed: 1": "OBLIGACION DE DAR SUMA DE DINERO","Unnamed: 2": "404-2025","Unnamed: 3": "2025-12-04T00:00:00","Unnamed: 4": "09:30:00","Unnamed: 5": null,"Unnamed: 6": null},
  {"Unnamed: 1": "OMISION A LA ASISTENCIA FAMILIAR","Unnamed: 2": "2724-2025","Unnamed: 3": "2026-06-30T00:00:00","Unnamed: 4": "12:00:00","Unnamed: 5": null,"Unnamed: 6": null},
  {"Unnamed: 1": "DIVORCIO POR CAUSAL ","Unnamed: 2": "2380-2025","Unnamed: 3": "2025-12-17T00:00:00","Unnamed: 4": "11:00:00","Unnamed: 5": null,"Unnamed: 6": null},
  {"Unnamed: 1": "OMISION A LA ASISTENCIA FAMILIAR","Unnamed: 2": "2591-2025","Unnamed: 3": "2025-12-15T00:00:00","Unnamed: 4": "09:30:00","Unnamed: 5": null,"Unnamed: 6": null}
];

// Función para convertir fecha ISO a YYYY-MM-DD
const convertirFechaISO = (fechaStr) => {
  if (!fechaStr) return '';
  
  // Manejar casos especiales como "LANZAMIENTO 20-03-2025"
  if (fechaStr.includes('LANZAMIENTO')) {
    const match = fechaStr.match(/(\d{2})-(\d{2})-(\d{4})/);
    if (match) {
      return `${match[3]}-${match[2]}-${match[1]}`;
    }
  }
  
  // Si ya está en formato ISO
  if (fechaStr.includes('T')) {
    return fechaStr.split('T')[0];
  }
  
  return fechaStr;
};

// Función para determinar tipo de caso
const determinarTipoCaso = (materia) => {
  if (!materia) return 'Por definir';
  
  const materiaLower = materia.toLowerCase();
  if (materiaLower.includes('penal') || materiaLower.includes('usurpacion')) return 'Penal';
  if (materiaLower.includes('familia') || materiaLower.includes('divorcio') || materiaLower.includes('filiacion') || materiaLower.includes('asistencia familiar')) return 'Familia';
  if (materiaLower.includes('laboral')) return 'Laboral';
  return 'Civil';
};

export const importarCasos = async () => {
  try {
    let importados = 0;
    let errores = 0;

    for (const caso of casosData) {
      try {
        const materia = caso['Unnamed: 1'] || 'Materia por definir';
        const expediente = caso['Unnamed: 2'];
        const fecha = convertirFechaISO(caso['Unnamed: 3']);
        const hora = caso['Unnamed: 4'] || '';
        const doctor = caso['Unnamed: 5'] || 'Por asignar';
        const observaciones = caso['Unnamed: 6'] || '';
        
        await addDoc(collection(db, 'casos'), {
          numero: expediente,
          cliente: 'Por definir',
          tipo: determinarTipoCaso(materia),
          estado: 'activo',
          descripcion: materia,
          abogado: doctor,
          fechaAudiencia: fecha,
          horaAudiencia: hora,
          observaciones: observaciones,
          createdAt: serverTimestamp()
        });
        
        importados++;
      } catch (error) {
        console.error(`Error al importar caso:`, error);
        errores++;
      }
    }

    return {
      success: true,
      importados,
      errores,
      total: casosData.length
    };
  } catch (error) {
    console.error('Error general en importación de casos:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const importarAudiencias = async () => {
  try {
    let importadas = 0;
    let errores = 0;

    for (const audiencia of audienciasData) {
      try {
        const fecha = convertirFecha(audiencia.Fecha_Audiencia);
        const hora = normalizarHora(audiencia.Hora);
        
        await addDoc(collection(db, 'audiencias'), {
          titulo: audiencia.Materia || `Audiencia - Exp. ${audiencia.Expediente}`,
          tipo: determinarTipo(audiencia.Materia),
          caso: `Expediente ${audiencia.Expediente}`,
          fecha: fecha,
          hora: hora,
          lugar: 'Por definir',
          juez: audiencia.Doctor || 'Por asignar',
          abogado: 'Estudio',
          notas: audiencia.Observaciones || '',
          createdAt: serverTimestamp()
        });
        
        importadas++;
      } catch (error) {
        console.error(`Error al importar audiencia ${audiencia.Expediente}:`, error);
        errores++;
      }
    }

    return {
      success: true,
      importadas,
      errores,
      total: audienciasData.length
    };
  } catch (error) {
    console.error('Error general en importación:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
