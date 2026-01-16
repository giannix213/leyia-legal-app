import React, { useState, useEffect } from 'react';
import { useOrganizaciones } from '../hooks/useOrganizaciones';
import FirestoreExportPanel from './FirestoreExportPanel';

const OrganizacionSelector = ({ onOrganizacionSeleccionada, onVolver, mostrarModal = true }) => {
  const {
    organizaciones,
    organizacionActual,
    cargando,
    error,
    cargarOrganizaciones,
    crearOrganizacion,
    unirseAOrganizacion
  } = useOrganizaciones();

  const [modo, setModo] = useState('crear'); // 'seleccionar', 'crear', 'unirse'
  const [orgIdInput, setOrgIdInput] = useState('');
  const [codigoAcceso, setCodigoAcceso] = useState('');
  const [mostrarExportacion, setMostrarExportacion] = useState(false);
  const [nuevaOrg, setNuevaOrg] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'estudio_juridico',
    requiereCodigoAcceso: false,
    codigoAcceso: ''
  });

  useEffect(() => {
    cargarOrganizaciones();
  }, []);

  // Si ya hay una organización seleccionada, no mostrar el modal
  useEffect(() => {
    if (organizacionActual && onOrganizacionSeleccionada) {
      onOrganizacionSeleccionada(organizacionActual);
    }
  }, [organizacionActual, onOrganizacionSeleccionada]);

  const handleCrearOrganizacion = async (e) => {
    e.preventDefault();
    
    if (!nuevaOrg.nombre.trim()) {
      alert('El nombre de la organización es requerido');
      return;
    }

    const orgCreada = await crearOrganizacion(nuevaOrg);
    
    if (orgCreada && onOrganizacionSeleccionada) {
      onOrganizacionSeleccionada(orgCreada);
    }
  };

  const handleUnirseOrganizacion = async (e) => {
    e.preventDefault();
    
    if (!orgIdInput.trim()) {
      alert('El ID de la organización es requerido');
      return;
    }

    const orgData = await unirseAOrganizacion(orgIdInput, codigoAcceso || null);
    
    if (orgData && onOrganizacionSeleccionada) {
      onOrganizacionSeleccionada(orgData);
    }
  };

  const handleSeleccionarOrganizacion = async (org) => {
    // Si la organización requiere código de acceso, cambiar a modo "unirse" para pedirlo
    if (org.requiereCodigoAcceso) {
      setOrgIdInput(org.id);
      setModo('unirse');
      return;
    }
    
    const orgData = await unirseAOrganizacion(org.id);
    
    if (orgData && onOrganizacionSeleccionada) {
      onOrganizacionSeleccionada(orgData);
    }
  };

  if (!mostrarModal || organizacionActual) {
    return null;
  }

  // Mostrar panel de exportación
  if (mostrarExportacion) {
    return (
      <FirestoreExportPanel 
        onClose={() => setMostrarExportacion(false)}
      />
    );
  }

  // Estilos CSS en línea para el diseño de terminal galáctica
  const terminalStyles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#020b12',
      backgroundImage: `
        radial-gradient(white, rgba(255,255,255,.2) 2px, transparent 40px),
        radial-gradient(white, rgba(255,255,255,.15) 1px, transparent 30px)
      `,
      backgroundSize: '550px 550px, 350px 350px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      color: '#2de2ff',
      fontFamily: "'Exo 2', 'News Gothic', sans-serif",
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    container: {
      width: '90%',
      maxWidth: '500px',
      background: 'rgba(0, 26, 44, 0.9)',
      border: '2px solid #2de2ff',
      borderRadius: '5px',
      boxShadow: '0 0 10px rgba(45, 226, 255, 0.5), inset 0 0 20px rgba(0,0,0,0.8)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    },
    scanEffect: {
      content: '" "',
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      background: `
        linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%),
        linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))
      `,
      zIndex: 2,
      backgroundSize: '100% 4px, 3px 100%',
      pointerEvents: 'none'
    },
    title: {
      textAlign: 'center',
      fontSize: '1.5rem',
      marginBottom: '5px',
      textShadow: '0 0 10px rgba(45, 226, 255, 0.5)',
      borderBottom: '2px solid #2de2ff',
      paddingBottom: '10px'
    },
    subtitle: {
      textAlign: 'center',
      fontSize: '0.7rem',
      marginBottom: '25px',
      color: '#88c0d0'
    },
    navTabs: {
      display: 'flex',
      justifyContent: 'space-around',
      marginBottom: '20px',
      borderBottom: '1px solid rgba(45, 226, 255, 0.3)'
    },
    tab: {
      padding: '10px',
      fontSize: '0.8rem',
      cursor: 'pointer',
      opacity: 0.6,
      transition: '0.3s',
      background: 'none',
      border: 'none',
      color: '#2de2ff',
      fontFamily: "'Exo 2', 'News Gothic', sans-serif",
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    tabActive: {
      opacity: 1,
      borderBottom: '3px solid #2de2ff',
      textShadow: '0 0 10px rgba(45, 226, 255, 0.5)'
    },
    formGroup: {
      marginBottom: '15px'
    },
    label: {
      display: 'block',
      fontSize: '0.8rem',
      marginBottom: '5px',
      fontWeight: 'bold'
    },
    input: {
      width: '100%',
      padding: '10px',
      background: 'rgba(0, 0, 0, 0.5)',
      border: '1px solid #2de2ff',
      color: 'white',
      fontFamily: "'Exo 2', 'News Gothic', sans-serif",
      boxSizing: 'border-box',
      borderRadius: '3px'
    },
    inputFocus: {
      outline: 'none',
      boxShadow: '0 0 10px rgba(45, 226, 255, 0.5)'
    },
    checkboxGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '0.8rem',
      marginTop: '20px'
    },
    checkbox: {
      width: '18px',
      height: '18px',
      cursor: 'pointer'
    },
    btnSubmit: {
      width: '100%',
      marginTop: '15px',
      padding: '12px',
      background: '#2de2ff',
      color: '#001a2c',
      border: 'none',
      fontWeight: 'bold',
      cursor: 'pointer',
      boxShadow: '0 0 10px rgba(45, 226, 255, 0.5)',
      transition: '0.3s',
      fontFamily: "'Exo 2', 'News Gothic', sans-serif",
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },
    footerNote: {
      marginTop: '25px',
      padding: '10px',
      fontSize: '0.65rem',
      textAlign: 'center',
      background: 'rgba(45, 226, 255, 0.1)',
      borderLeft: '4px solid #2de2ff'
    },
    orgCard: {
      background: 'rgba(0, 0, 0, 0.3)',
      border: '1px solid rgba(45, 226, 255, 0.3)',
      borderRadius: '5px',
      padding: '15px',
      marginBottom: '10px',
      cursor: 'pointer',
      transition: '0.3s'
    },
    orgCardHover: {
      borderColor: '#2de2ff',
      boxShadow: '0 0 10px rgba(45, 226, 255, 0.3)'
    },
    volverBtn: {
      position: 'absolute',
      top: '20px',
      right: '20px',
      padding: '8px 16px',
      background: 'transparent',
      border: '1px solid rgba(45, 226, 255, 0.5)',
      color: '#2de2ff',
      cursor: 'pointer',
      borderRadius: '3px',
      fontSize: '0.7rem',
      fontFamily: "'Exo 2', 'News Gothic', sans-serif",
      textTransform: 'uppercase',
      letterSpacing: '1px',
      transition: '0.3s'
    }
  };

  return (
    <div style={terminalStyles.overlay}>
      {/* Botones flotantes sobre el fondo */}
      {onVolver && (
        <div style={{ 
          position: 'fixed', 
          top: '20px', 
          right: '20px', 
          display: 'flex', 
          gap: '10px',
          zIndex: 1001
        }}>
            <button 
              onClick={() => setMostrarExportacion(true)}
              style={{
                padding: '8px 16px',
                background: 'rgba(255, 0, 255, 0.2)',
                border: '2px solid rgba(255, 0, 255, 0.7)',
                color: '#ff00ff',
                cursor: 'pointer',
                borderRadius: '5px',
                fontSize: '0.7rem',
                fontFamily: "'Exo 2', 'News Gothic', sans-serif",
                textTransform: 'uppercase',
                letterSpacing: '1px',
                transition: '0.3s',
                whiteSpace: 'nowrap',
                boxShadow: '0 0 10px rgba(255, 0, 255, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#ff00ff';
                e.target.style.boxShadow = '0 0 15px rgba(255, 0, 255, 0.6)';
                e.target.style.background = 'rgba(255, 0, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'rgba(255, 0, 255, 0.7)';
                e.target.style.boxShadow = '0 0 10px rgba(255, 0, 255, 0.3)';
                e.target.style.background = 'rgba(255, 0, 255, 0.2)';
              }}
            >
              📦 Exportar Datos
            </button>
            <button 
              onClick={onVolver}
              style={{
                padding: '8px 16px',
                background: 'rgba(45, 226, 255, 0.2)',
                border: '2px solid rgba(45, 226, 255, 0.7)',
                color: '#2de2ff',
                cursor: 'pointer',
                borderRadius: '5px',
                fontSize: '0.7rem',
                fontFamily: "'Exo 2', 'News Gothic', sans-serif",
                textTransform: 'uppercase',
                letterSpacing: '1px',
                transition: '0.3s',
                whiteSpace: 'nowrap',
                boxShadow: '0 0 10px rgba(45, 226, 255, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#2de2ff';
                e.target.style.boxShadow = '0 0 15px rgba(45, 226, 255, 0.6)';
                e.target.style.background = 'rgba(45, 226, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'rgba(45, 226, 255, 0.7)';
                e.target.style.boxShadow = '0 0 10px rgba(45, 226, 255, 0.3)';
                e.target.style.background = 'rgba(45, 226, 255, 0.2)';
              }}
            >
              🚪 Cerrar Sesión
            </button>
        </div>
      )}

      <div style={terminalStyles.container}>
        {/* Efecto de escaneo holográfico */}
        <div style={terminalStyles.scanEffect}></div>

        <h1 style={terminalStyles.title}>Seleccionar Organización</h1>
        <p style={terminalStyles.subtitle}>Enlace a red galáctica establecido...</p>

        <div style={terminalStyles.navTabs}>
          <button 
            style={{
              ...terminalStyles.tab,
              ...(modo === 'seleccionar' ? terminalStyles.tabActive : {})
            }}
            onClick={() => setModo('seleccionar')}
          >
            Seleccionar
          </button>
          <button 
            style={{
              ...terminalStyles.tab,
              ...(modo === 'unirse' ? terminalStyles.tabActive : {})
            }}
            onClick={() => setModo('unirse')}
          >
            Unirse por ID
          </button>
          <button 
            style={{
              ...terminalStyles.tab,
              ...(modo === 'crear' ? terminalStyles.tabActive : {})
            }}
            onClick={() => setModo('crear')}
          >
            + Crear Nueva
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(255, 0, 0, 0.2)',
            border: '1px solid #ff4444',
            padding: '10px',
            marginBottom: '15px',
            borderRadius: '3px',
            fontSize: '0.8rem'
          }}>
            ❌ {error}
          </div>
        )}

        {modo === 'seleccionar' && (
          <div>
            {cargando ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                Escaneando organizaciones disponibles...
              </div>
            ) : organizaciones.length > 0 ? (
              organizaciones.map(org => (
                <div 
                  key={org.id} 
                  style={terminalStyles.orgCard}
                  onClick={() => handleSeleccionarOrganizacion(org)}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#2de2ff';
                    e.target.style.boxShadow = '0 0 10px rgba(45, 226, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = 'rgba(45, 226, 255, 0.3)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>
                      {org.nombre}
                      {org.requiereCodigoAcceso && (
                        <span style={{ 
                          marginLeft: '8px', 
                          fontSize: '0.7rem', 
                          color: '#ffa500',
                          textShadow: '0 0 5px rgba(255, 165, 0, 0.5)'
                        }}>
                          🔒
                        </span>
                      )}
                    </h3>
                    <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>ID: {org.id}</span>
                  </div>
                  <p style={{ margin: '8px 0', fontSize: '0.8rem', opacity: 0.8 }}>{org.descripcion}</p>
                  <div style={{ display: 'flex', gap: '15px', fontSize: '0.7rem' }}>
                    <span>👥 {org.estadisticas?.totalUsuarios || 0} usuarios</span>
                    <span>📁 {org.estadisticas?.totalCasos || 0} casos</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', opacity: 0.7 }}>
                <p>No hay organizaciones disponibles</p>
                <p>Crea una nueva o únete usando un ID</p>
              </div>
            )}
          </div>
        )}

        {modo === 'unirse' && (
          <form onSubmit={handleUnirseOrganizacion}>
            <div style={terminalStyles.formGroup}>
              <label style={terminalStyles.label}>ID de la Organización *</label>
              <input
                type="text"
                value={orgIdInput}
                onChange={(e) => setOrgIdInput(e.target.value)}
                placeholder="EJ: ESTUDIO_1766865619896_F6YQLP8C6"
                required
                style={terminalStyles.input}
                onFocus={(e) => e.target.style.boxShadow = '0 0 10px rgba(45, 226, 255, 0.5)'}
                onBlur={(e) => e.target.style.boxShadow = 'none'}
              />
            </div>
            
            <div style={terminalStyles.formGroup}>
              <label style={terminalStyles.label}>
                Código de Acceso {orgIdInput && organizaciones.find(org => org.id === orgIdInput)?.requiereCodigoAcceso ? '*' : '(opcional)'}
              </label>
              <input
                type="password"
                value={codigoAcceso}
                onChange={(e) => setCodigoAcceso(e.target.value)}
                placeholder={orgIdInput && organizaciones.find(org => org.id === orgIdInput)?.requiereCodigoAcceso ? "Código requerido para esta organización" : "Solo si la organización lo requiere"}
                required={orgIdInput && organizaciones.find(org => org.id === orgIdInput)?.requiereCodigoAcceso}
                style={terminalStyles.input}
                onFocus={(e) => e.target.style.boxShadow = '0 0 10px rgba(45, 226, 255, 0.5)'}
                onBlur={(e) => e.target.style.boxShadow = 'none'}
              />
            </div>

            <button 
              type="submit" 
              disabled={cargando} 
              style={{
                ...terminalStyles.btnSubmit,
                opacity: cargando ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!cargando) {
                  e.target.style.filter = 'brightness(1.2)';
                  e.target.style.letterSpacing = '3px';
                }
              }}
              onMouseLeave={(e) => {
                if (!cargando) {
                  e.target.style.filter = 'brightness(1)';
                  e.target.style.letterSpacing = '1px';
                }
              }}
            >
              {cargando ? 'ESTABLECIENDO CONEXIÓN...' : 'INICIAR TRANSMISIÓN'}
            </button>
          </form>
        )}

        {modo === 'crear' && (
          <form onSubmit={handleCrearOrganizacion}>
            <div style={terminalStyles.formGroup}>
              <label style={terminalStyles.label}>Nombre de la Organización *</label>
              <input
                type="text"
                value={nuevaOrg.nombre}
                onChange={(e) => setNuevaOrg(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="EJ: ACADEMIA JEDI"
                required
                style={terminalStyles.input}
                onFocus={(e) => e.target.style.boxShadow = '0 0 10px rgba(45, 226, 255, 0.5)'}
                onBlur={(e) => e.target.style.boxShadow = 'none'}
              />
            </div>

            <div style={terminalStyles.formGroup}>
              <label style={terminalStyles.label}>Descripción</label>
              <textarea
                value={nuevaOrg.descripcion}
                onChange={(e) => setNuevaOrg(prev => ({ ...prev, descripcion: e.target.value }))}
                placeholder="Breve descripción del sector..."
                rows="3"
                style={{
                  ...terminalStyles.input,
                  resize: 'vertical'
                }}
                onFocus={(e) => e.target.style.boxShadow = '0 0 10px rgba(45, 226, 255, 0.5)'}
                onBlur={(e) => e.target.style.boxShadow = 'none'}
              />
            </div>

            <div style={terminalStyles.formGroup}>
              <label style={terminalStyles.label}>Tipo de Organización</label>
              <select
                value={nuevaOrg.tipo}
                onChange={(e) => setNuevaOrg(prev => ({ ...prev, tipo: e.target.value }))}
                style={terminalStyles.input}
                onFocus={(e) => e.target.style.boxShadow = '0 0 10px rgba(45, 226, 255, 0.5)'}
                onBlur={(e) => e.target.style.boxShadow = 'none'}
              >
                <option value="estudio_juridico">Estudio Jurídico</option>
                <option value="gremio_cazarrecompensas">Gremio de Cazarrecompensas</option>
                <option value="alianza_rebelde">Alianza Rebelde</option>
                <option value="orden_imperial">Orden Imperial</option>
              </select>
            </div>

            <div style={terminalStyles.checkboxGroup}>
              <input
                type="checkbox"
                id="codigo"
                checked={nuevaOrg.requiereCodigoAcceso}
                onChange={(e) => setNuevaOrg(prev => ({ 
                  ...prev, 
                  requiereCodigoAcceso: e.target.checked,
                  codigoAcceso: e.target.checked ? prev.codigoAcceso : ''
                }))}
                style={terminalStyles.checkbox}
              />
              <label htmlFor="codigo" style={{ cursor: 'pointer' }}>
                🔒 Requiere código de acceso para unirse
              </label>
            </div>

            {nuevaOrg.requiereCodigoAcceso && (
              <div style={terminalStyles.formGroup}>
                <label style={terminalStyles.label}>Código de Acceso</label>
                <input
                  type="password"
                  value={nuevaOrg.codigoAcceso}
                  onChange={(e) => setNuevaOrg(prev => ({ ...prev, codigoAcceso: e.target.value }))}
                  placeholder="Código para que otros se unan"
                  required
                  style={terminalStyles.input}
                  onFocus={(e) => e.target.style.boxShadow = '0 0 10px rgba(45, 226, 255, 0.5)'}
                  onBlur={(e) => e.target.style.boxShadow = 'none'}
                />
              </div>
            )}

            <button 
              type="submit" 
              disabled={cargando} 
              style={{
                ...terminalStyles.btnSubmit,
                opacity: cargando ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!cargando) {
                  e.target.style.filter = 'brightness(1.2)';
                  e.target.style.letterSpacing = '3px';
                }
              }}
              onMouseLeave={(e) => {
                if (!cargando) {
                  e.target.style.filter = 'brightness(1)';
                  e.target.style.letterSpacing = '1px';
                }
              }}
            >
              {cargando ? 'CREANDO TRANSMISIÓN...' : 'INICIAR TRANSMISIÓN'}
            </button>
          </form>
        )}

        <div style={terminalStyles.footerNote}>
          💡 TODOS LOS DATOS (CASOS, DOCUMENTOS, ETC.) SE ASOCIARÁN A LA UNIDAD SELECCIONADA
        </div>
      </div>
    </div>
  );
};

export default OrganizacionSelector;