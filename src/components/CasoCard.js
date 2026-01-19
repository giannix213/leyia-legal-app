// CasoCard.js - Componente para renderizar tarjeta individual de caso
// Extraído del componente Casos para mejor organización

import React from 'react';
import { getColorPorTipo, getImagenPorTipo } from '../utils/casosUtils';

const CasoCard = ({ 
  caso, 
  tipo, 
  index, 
  totalCasos, 
  grupoExpandido
}) => {
  const imagenFondo = getImagenPorTipo(tipo);
  
  return (
    <div
      className="caso-card-content-wrapper"
      data-tipo={caso.tipo || 'civil'}
      style={{ 
        position: 'relative',
        overflow: 'visible',
        backgroundColor: '#1a1a1a',
        minHeight: '260px',
        width: '100%',
        height: '100%',
        borderRadius: '14px',
        border: '2px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(1px)'
      }}
    >
      {/* Imagen de fondo */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url(${imagenFondo})`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        opacity: 0.4,
        zIndex: 1,
        filter: 'brightness(1.3) contrast(1.2)'
      }} />
      
      {/* Imagen adicional en el centro */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '80px',
        height: '80px',
        backgroundImage: `url(${imagenFondo})`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        opacity: 0.2,
        zIndex: 1,
        filter: 'brightness(1.5) contrast(1.3)'
      }} />
      
      {/* Contenido de la tarjeta */}
      <div className="caso-card-content-modern" style={{
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0.35) 50%, rgba(0, 0, 0, 0.55) 100%)',
        color: 'white',
        height: '100%',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backdropFilter: 'blur(2px)',
        minHeight: '260px',
        borderRadius: '14px',
        zIndex: 2
      }}>
        {/* Indicador de más casos */}
        {totalCasos > 1 && !grupoExpandido && index === 0 && (
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: 'white',
            fontSize: '13px',
            padding: '6px 12px',
            borderRadius: '20px',
            fontWeight: '700',
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            +{totalCasos - 1}
          </div>
        )}
        
        {/* Número de expediente y tipo */}
        <div style={{flex: '0 0 auto', marginTop: '20px', position: 'relative', zIndex: 3}}>
          <div style={{
            color: 'white', 
            fontSize: '22px',
            fontWeight: '800',
            textShadow: '3px 3px 6px rgba(0,0,0,0.9)',
            marginBottom: '8px',
            letterSpacing: '0.5px'
          }}>
            {caso.numero}
          </div>
          <div style={{
            color: getColorPorTipo(tipo), 
            fontSize: '12px',
            fontWeight: '700',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            background: 'rgba(0,0,0,0.4)',
            padding: '3px 8px',
            borderRadius: '16px',
            display: 'inline-block',
            border: `1px solid ${getColorPorTipo(tipo)}40`,
            backdropFilter: 'blur(10px)'
          }}>
            {tipo}
          </div>
        </div>
        
        {/* Información del caso */}
        <div style={{
          flex: '1 1 auto', 
          display: 'flex', 
          flexDirection: 'column',
          gap: '6px',
          padding: '8px 0',
          position: 'relative',
          zIndex: 3
        }}>
          <div style={{
            color: 'white', 
            fontSize: '13px',
            lineHeight: '1.3',
            textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
            textAlign: 'center',
            fontWeight: '500',
            background: 'rgba(0,0,0,0.3)',
            padding: '6px 8px',
            borderRadius: '8px',
            backdropFilter: 'blur(5px)',
            marginBottom: '4px'
          }}>
            {caso.descripcion || 'Sin materia especificada'}
          </div>
          
          {/* Información adicional compacta en grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '3px',
            fontSize: '9px',
            color: '#e5e7eb'
          }}>
            {/* Estado del caso */}
            <div style={{
              background: 'rgba(0,0,0,0.4)',
              padding: '3px 6px',
              borderRadius: '4px',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '8px'
            }}>
              <span style={{fontSize: '10px'}}>
                {caso.estado === 'postulatoria' ? '📝' : 
                 caso.estado === 'en_tramite' ? '⚖️' : 
                 caso.estado === 'sentencia' ? '📋' : 
                 caso.estado === 'archivado' ? '📁' : '📄'}
              </span>
              <span style={{fontWeight: '600', textTransform: 'capitalize'}}>
                {(caso.estado || 'Sin estado').replace('_', ' ')}
              </span>
            </div>

            {/* Prioridad */}
            {caso.prioridad && (
              <div style={{
                background: caso.prioridad === 'alta' ? 'rgba(239, 68, 68, 0.3)' : 
                           caso.prioridad === 'media' ? 'rgba(245, 158, 11, 0.3)' : 
                           'rgba(34, 197, 94, 0.3)',
                padding: '3px 6px',
                borderRadius: '4px',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '8px',
                border: `1px solid ${caso.prioridad === 'alta' ? '#ef4444' : 
                                    caso.prioridad === 'media' ? '#f59e0b' : 
                                    '#22c55e'}40`
              }}>
                <span style={{fontSize: '10px'}}>
                  {caso.prioridad === 'alta' ? '🔴' : 
                   caso.prioridad === 'media' ? '🟡' : '🟢'}
                </span>
                <span style={{fontWeight: '600', textTransform: 'capitalize'}}>
                  {caso.prioridad}
                </span>
              </div>
            )}

            {/* Órgano jurisdiccional */}
            {caso.organoJurisdiccional && (
              <div style={{
                background: 'rgba(0,0,0,0.4)',
                padding: '3px 6px',
                borderRadius: '4px',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '8px',
                gridColumn: '1 / -1'
              }}>
                <span style={{fontSize: '10px'}}>🏛️</span>
                <span style={{fontWeight: '600'}}>
                  {caso.organoJurisdiccional.length > 30 ? 
                    caso.organoJurisdiccional.substring(0, 30) + '...' : 
                    caso.organoJurisdiccional}
                </span>
              </div>
            )}

            {/* Demandado */}
            {caso.demandado && (
              <div style={{
                background: 'rgba(0,0,0,0.4)',
                padding: '3px 6px',
                borderRadius: '4px',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '8px',
                gridColumn: '1 / -1'
              }}>
                <span style={{fontSize: '10px'}}>⚖️</span>
                <span style={{fontWeight: '600'}}>
                  vs. {caso.demandado.length > 25 ? 
                    caso.demandado.substring(0, 25) + '...' : 
                    caso.demandado}
                </span>
              </div>
            )}

            {/* Fecha de audiencia */}
            {caso.fechaAudiencia && (
              <div style={{
                background: 'rgba(59, 130, 246, 0.3)',
                padding: '3px 6px',
                borderRadius: '4px',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '8px',
                gridColumn: '1 / -1',
                border: '1px solid rgba(59, 130, 246, 0.4)'
              }}>
                <span style={{fontSize: '10px'}}>📅</span>
                <span style={{fontWeight: '600'}}>
                  {new Date(caso.fechaAudiencia).toLocaleDateString('es-PE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit'
                  })}
                  {caso.horaAudiencia && ` ${caso.horaAudiencia}`}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Información del cliente y abogado */}
        <div style={{flex: '0 0 auto', position: 'relative', zIndex: 3}}>
          <div style={{
            color: '#f3f4f6', 
            fontSize: '11px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
            borderTop: '1px solid rgba(255,255,255,0.2)',
            paddingTop: '8px',
            background: 'rgba(0,0,0,0.5)',
            margin: '-4px -6px -6px -6px',
            padding: '8px',
            borderRadius: '0 0 10px 10px',
            backdropFilter: 'blur(10px)'
          }}>
            {/* Cliente */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginBottom: '4px'
            }}>
              <span style={{
                fontSize: '12px',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
              }}>👤</span>
              <span style={{fontWeight: '600', fontSize: '10px'}}>
                {(caso.cliente || caso.demandante || 'Cliente no especificado').length > 22 ? 
                  (caso.cliente || caso.demandante || 'Cliente no especificado').substring(0, 22) + '...' : 
                  (caso.cliente || caso.demandante || 'Cliente no especificado')}
              </span>
            </div>

            {/* Abogado responsable */}
            {caso.abogado && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '9px',
                color: '#d1d5db'
              }}>
                <span style={{
                  fontSize: '10px',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
                }}>👨‍💼</span>
                <span style={{fontWeight: '500'}}>
                  {caso.abogado.length > 20 ? 
                    caso.abogado.substring(0, 20) + '...' : 
                    caso.abogado}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CasoCard;