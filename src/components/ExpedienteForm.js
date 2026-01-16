import React, { useState, useEffect } from 'react';
import { getEtapasProcesales } from '../utils/casosUtils';

const ExpedienteForm = ({ isOpen, onClose, editingCaso, onSuccess, onAgregarCaso }) => {
  const [formData, setFormData] = useState({
    numero: '',
    cliente: '',
    tipo: '',
    estado: '',
    descripcion: '',
    observaciones: '',
    inicioProceso: '',
    distritoJudicial: '',
    demandante: '',
    demandado: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar datos del caso cuando se está editando
  useEffect(() => {
    if (editingCaso) {
      setFormData({
        numero: editingCaso.numero || '',
        cliente: editingCaso.cliente || '',
        tipo: editingCaso.tipo || '',
        estado: editingCaso.estado || '',
        descripcion: editingCaso.descripcion || '',
        observaciones: editingCaso.observaciones || '',
        inicioProceso: editingCaso.inicioProceso || '',
        distritoJudicial: editingCaso.distritoJudicial || '',
        demandante: editingCaso.demandante || '',
        demandado: editingCaso.demandado || ''
      });
    } else {
      // Limpiar formulario cuando no hay caso editando
      setFormData({
        numero: '',
        cliente: '',
        tipo: '',
        estado: '',
        descripcion: '',
        observaciones: '',
        inicioProceso: '',
        distritoJudicial: '',
        demandante: '',
        demandado: ''
      });
    }
  }, [editingCaso, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.numero.trim()) {
      alert('El número de expediente es obligatorio');
      return;
    }

    if (!formData.tipo) {
      alert('El tipo de caso es obligatorio');
      return;
    }

    if (!formData.estado) {
      alert('El estado procesal es obligatorio');
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (onAgregarCaso) {
        // Detección automática del tipo de tarea
        let tipoTareaAuto = 'tarea';
        const obsUpper = (formData.observaciones || '').toUpperCase();
        
        if (obsUpper.includes('DILIGENCIA') || obsUpper.includes('JUZGADO')) {
          tipoTareaAuto = 'diligencia';
        } else if (obsUpper.includes('COORDINACION') || obsUpper.includes('LLAMAR')) {
          tipoTareaAuto = 'coordinacion';
        }

        // Preparar datos del caso con el estado vinculado
        const casoData = {
          ...formData,
          tipoTarea: tipoTareaAuto,
          // Asegurar que el estado esté vinculado al tipo de caso
          estado: formData.estado,
          tipo: formData.tipo
        };

        // Si estamos editando, incluir el ID del caso
        if (editingCaso && editingCaso.id) {
          casoData.id = editingCaso.id;
        }

        await onAgregarCaso(casoData);

        if (onSuccess) onSuccess();
        
        // Limpiar formulario solo si no estamos editando
        if (!editingCaso) {
          setFormData({
            numero: '', 
            cliente: '', 
            tipo: '', 
            estado: '',
            descripcion: '', 
            observaciones: '',
            inicioProceso: '',
            distritoJudicial: '',
            demandante: '',
            demandado: ''
          });
        }
      }
      onClose();
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error al guardar el expediente. Por favor, intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Si cambia el tipo de caso, resetear el estado
    if (name === 'tipo' && value !== formData.tipo) {
      setFormData(prev => ({
        ...prev,
        tipo: value,
        estado: '' // Resetear estado cuando cambia el tipo
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '40px' /* Aumentado de 20px a 40px */
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px', /* Aumentado de 20px a 24px */
        width: '100%',
        maxWidth: '650px', /* Aumentado de 600px a 650px */
        maxHeight: '85vh', /* Reducido de 90vh a 85vh para más margen */
        overflowY: 'auto',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)', /* Sombra más prominente */
        margin: '20px' /* Margen adicional */
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          color: 'white',
          padding: '40px', /* Aumentado de 30px a 40px */
          borderRadius: '24px 24px 0 0', /* Ajustado al nuevo border-radius */
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>
            {editingCaso ? 'Editar Expediente' : 'Nuevo Expediente'}
          </h2>
          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '2px solid rgba(255,255,255,0.2)',
              color: 'white',
              borderRadius: '12px',
              width: '40px',
              height: '40px',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ padding: '40px' }}> {/* Aumentado de 30px a 40px */}
          <div style={{ marginBottom: '28px' }}> {/* Aumentado de 20px a 28px */}
            <label style={{ 
              display: 'block', 
              marginBottom: '12px', /* Aumentado de 8px a 12px */
              fontWeight: '600',
              color: '#374151',
              fontSize: '15px' /* Agregado para mejor legibilidad */
            }}>
              Número de Expediente *
            </label>
            <input
              type="text"
              name="numero"
              value={formData.numero}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '16px', /* Aumentado de 12px a 16px */
                border: '2px solid #e5e7eb',
                borderRadius: '12px', /* Aumentado de 8px a 12px */
                fontSize: '16px',
                boxSizing: 'border-box',
                fontFamily: 'Montserrat, sans-serif' /* Consistencia tipográfica */
              }}
              placeholder="Ej: 00123-2024-0-1801-JR-CI-01"
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '12px',
              fontWeight: '600',
              color: '#374151',
              fontSize: '15px'
            }}>
              Cliente *
            </label>
            <input
              type="text"
              name="cliente"
              value={formData.cliente}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '16px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '16px',
                boxSizing: 'border-box',
                fontFamily: 'Montserrat, sans-serif'
              }}
              placeholder="Nombre del cliente"
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '12px',
              fontWeight: '600',
              color: '#374151',
              fontSize: '15px'
            }}>
              Demandante
            </label>
            <input
              type="text"
              name="demandante"
              value={formData.demandante}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '16px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '16px',
                boxSizing: 'border-box',
                fontFamily: 'Montserrat, sans-serif'
              }}
              placeholder="Nombre del demandante (si es diferente del cliente)"
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '12px',
              fontWeight: '600',
              color: '#374151',
              fontSize: '15px'
            }}>
              Demandado
            </label>
            <input
              type="text"
              name="demandado"
              value={formData.demandado}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '16px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '16px',
                boxSizing: 'border-box',
                fontFamily: 'Montserrat, sans-serif'
              }}
              placeholder="Nombre del demandado"
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '12px',
              fontWeight: '600',
              color: '#374151',
              fontSize: '15px'
            }}>
              Inicio del Proceso
            </label>
            <input
              type="date"
              name="inicioProceso"
              value={formData.inicioProceso}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '16px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '16px',
                boxSizing: 'border-box',
                fontFamily: 'Montserrat, sans-serif'
              }}
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '12px',
              fontWeight: '600',
              color: '#374151',
              fontSize: '15px'
            }}>
              Distrito Judicial
            </label>
            <input
              type="text"
              name="distritoJudicial"
              value={formData.distritoJudicial}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '16px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '16px',
                boxSizing: 'border-box',
                fontFamily: 'Montserrat, sans-serif'
              }}
              placeholder="Ej: Lima, Arequipa, Cusco..."
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '12px',
              fontWeight: '600',
              color: '#374151',
              fontSize: '15px'
            }}>
              Tipo de Caso *
            </label>
            <select
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '16px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '16px',
                boxSizing: 'border-box',
                fontFamily: 'Montserrat, sans-serif'
              }}
            >
              <option value="">Seleccionar tipo</option>
              <option value="civil">Civil</option>
              <option value="penal">Penal</option>
              <option value="laboral">Laboral</option>
              <option value="comercial">Comercial</option>
              <option value="familia">Familia</option>
              <option value="administrativo">Administrativo</option>
              <option value="constitucional">Constitucional</option>
              <option value="tributario">Tributario</option>
              <option value="ejecucion">Ejecución</option>
            </select>
          </div>

          {/* Campo de Estado - Vinculado al tipo de caso */}
          {formData.tipo && (
            <div style={{ marginBottom: '28px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '12px',
                fontWeight: '600',
                color: '#374151',
                fontSize: '15px'
              }}>
                Estado Procesal * 
                <span style={{ 
                  fontSize: '13px', 
                  color: '#6b7280', 
                  fontWeight: '400',
                  marginLeft: '8px'
                }}>
                  (vinculado a {formData.tipo})
                </span>
              </label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '16px',
                  border: '2px solid #3b82f6',
                  borderRadius: '12px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  fontFamily: 'Montserrat, sans-serif',
                  backgroundColor: '#eff6ff'
                }}
              >
                <option value="">Seleccionar estado procesal</option>
                {getEtapasProcesales(formData.tipo).map(etapa => (
                  <option key={etapa.value} value={etapa.value}>
                    {etapa.label}
                  </option>
                ))}
              </select>
              <small style={{ 
                display: 'block', 
                marginTop: '8px', 
                color: '#6b7280',
                fontSize: '13px'
              }}>
                Las opciones de estado cambian según el tipo de caso seleccionado
              </small>
            </div>
          )}

          {/* Mensaje si no se ha seleccionado tipo */}
          {!formData.tipo && (
            <div style={{ 
              marginBottom: '28px',
              padding: '16px',
              background: '#fef3c7',
              border: '2px solid #fbbf24',
              borderRadius: '12px'
            }}>
              <p style={{ 
                margin: 0, 
                color: '#92400e',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                ℹ️ Selecciona primero el tipo de caso para ver las opciones de estado procesal
              </p>
            </div>
          )}

          <div style={{ marginBottom: '28px' }}> {/* Aumentado de 20px a 28px */}
            <label style={{ 
              display: 'block', 
              marginBottom: '12px', /* Aumentado de 8px a 12px */
              fontWeight: '600',
              color: '#374151',
              fontSize: '15px'
            }}>
              Descripción del Caso
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows="4"
              style={{
                width: '100%',
                padding: '16px', /* Aumentado de 12px a 16px */
                border: '2px solid #e5e7eb',
                borderRadius: '12px', /* Aumentado de 8px a 12px */
                fontSize: '16px',
                boxSizing: 'border-box',
                resize: 'vertical',
                fontFamily: 'Montserrat, sans-serif'
              }}
              placeholder="Descripción detallada del caso..."
            />
          </div>

          <div style={{ marginBottom: '36px' }}> {/* Aumentado de 30px a 36px */}
            <label style={{ 
              display: 'block', 
              marginBottom: '12px', /* Aumentado de 8px a 12px */
              fontWeight: '600',
              color: '#374151',
              fontSize: '15px'
            }}>
              Observaciones
            </label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              rows="3"
              style={{
                width: '100%',
                padding: '16px', /* Aumentado de 12px a 16px */
                border: '2px solid #e5e7eb',
                borderRadius: '12px', /* Aumentado de 8px a 12px */
                fontSize: '16px',
                boxSizing: 'border-box',
                resize: 'vertical',
                fontFamily: 'Montserrat, sans-serif'
              }}
              placeholder="Observaciones adicionales..."
            />
          </div>

          <div style={{
            display: 'flex',
            gap: '20px', /* Aumentado de 15px a 20px */
            justifyContent: 'flex-end',
            paddingTop: '20px' /* Agregado padding superior */
          }}>
            <button 
              type="button"
              onClick={onClose}
              style={{
                background: '#6b7280',
                color: 'white',
                border: 'none',
                padding: '16px 32px', /* Aumentado de 12px 24px a 16px 32px */
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '15px', /* Aumentado de 14px a 15px */
                fontFamily: 'Montserrat, sans-serif'
              }}
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              style={{
                background: isSubmitting 
                  ? '#9ca3af' 
                  : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                border: 'none',
                padding: '16px 32px', /* Aumentado de 12px 24px a 16px 32px */
                borderRadius: '12px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '15px', /* Aumentado de 14px a 15px */
                opacity: isSubmitting ? 0.7 : 1,
                fontFamily: 'Montserrat, sans-serif'
              }}
            >
              {isSubmitting 
                ? 'Guardando...' 
                : (editingCaso ? 'Actualizar' : 'Crear') + ' Expediente'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpedienteForm;