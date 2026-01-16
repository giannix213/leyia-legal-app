// Utilidades para manejo de expedientes y orden

export const cargarOrden = (expedientes) => {
  try {
    const ordenGuardado = localStorage.getItem('ordenExpedientes');
    if (ordenGuardado) {
      const ordenCompleto = JSON.parse(ordenGuardado);
      const expedientesOrdenados = [];
      
      ordenCompleto.forEach(item => {
        if (item.esDivisor) {
          expedientesOrdenados.push({
            id: item.id,
            esDivisor: true,
            numero: '───────────',
            cliente: '',
            descripcion: '',
            texto: item.texto || ''
          });
        } else {
          const expediente = expedientes.find(exp => exp.id === item.id);
          if (expediente) {
            expedientesOrdenados.push(expediente);
          }
        }
      });
      
      // Agregar expedientes que no estén en el orden guardado
      const idsGuardados = ordenCompleto.filter(item => !item.esDivisor).map(item => item.id);
      expedientes.forEach(exp => {
        if (!idsGuardados.includes(exp.id)) {
          expedientesOrdenados.push(exp);
        }
      });
      
      return expedientesOrdenados;
    }
  } catch (error) {
    console.error('Error al cargar orden:', error);
  }
  return expedientes;
};

export const guardarOrden = (orden, textosExpedientes = {}) => {
  try {
    const ordenCompleto = orden.map(item => {
      if (item.esDivisor) {
        return {
          id: item.id,
          esDivisor: true,
          texto: textosExpedientes[item.id] || ''
        };
      } else {
        return {
          id: item.id,
          esDivisor: false
        };
      }
    });
    localStorage.setItem('ordenExpedientes', JSON.stringify(ordenCompleto));
  } catch (error) {
    console.error('Error al guardar orden:', error);
  }
};

export const cargarTextos = () => {
  try {
    const textosGuardados = localStorage.getItem('textosExpedientes');
    if (textosGuardados) {
      return JSON.parse(textosGuardados);
    }
  } catch (error) {
    console.error('Error al cargar textos:', error);
  }
  return {};
};

export const guardarTextos = (textos) => {
  try {
    localStorage.setItem('textosExpedientes', JSON.stringify(textos));
  } catch (error) {
    console.error('Error al guardar textos:', error);
  }
};

export const crearLineaDivisoria = () => ({
  id: crypto.randomUUID(), // Usar UUID en lugar de Date.now() para evitar duplicados
  tipo: 'divisor',
  numero: '───────────',
  cliente: '',
  descripcion: '',
  esDivisor: true
});

export const getColorForType = (tipo) => {
  const tipoLower = (tipo || 'civil').toLowerCase();
  switch(tipoLower) {
    case 'civil': return '#3b82f6';
    case 'penal': return '#ef4444';
    case 'familia': return '#f59e0b';
    case 'laboral': return '#10b981';
    case 'ejecucion': return '#8b5cf6';
    case 'no contencioso': return '#06b6d4';
    default: return '#3b82f6';
  }
};

export const obtenerIcono = (categoria, tarea) => {
  if (tarea?.esTramite && tarea?.icono) {
    return tarea.icono;
  }
  
  switch(categoria) {
    case 'Audiencia': return '⚖️';
    case 'Comunicación': return '📞';
    case 'Preparación': return '📝';
    case 'Diligencia': return '🏃‍♂️';
    case 'Trámite': return '📋';
    case 'Revisión': return '🔍';
    case 'Seguimiento': return '📊';
    case 'Actualización': return '🔄';
    default: return '📌';
  }
};