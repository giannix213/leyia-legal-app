import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import './PerfilUsuario.css';

function PerfilUsuario({ onClose, user, organization, onLogout }) {
  const [perfil, setPerfil] = useState({
    nombre: '',
    email: '',
    telefono: '',
    cargo: '',
    fotoPerfil: ''
  });
  const [logoOrganizacion, setLogoOrganizacion] = useState('');
  const [organizacionInfo, setOrganizacionInfo] = useState({
    nombre: '',
    descripcion: '',
    tipo: '',
    fechaCreacion: '',
    totalUsuarios: 0,
    totalCasos: 0
  });
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [copiado, setCopiado] = useState(false);

  // Usar el ID de organización existente del usuario
  const organizationId = organization?.organizationId || organization?.id;

  useEffect(() => {
    cargarPerfil();
    cargarLogoOrganizacion();
  }, []);

  const cargarPerfil = async () => {
    try {
      const docRef = doc(db, 'configuracion', 'perfilUsuario');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setPerfil(docSnap.data());
      } else {
        setPerfil({
          nombre: user?.displayName || '',
          email: user?.email || '',
          telefono: '',
          cargo: '',
          fotoPerfil: user?.photoURL || ''
        });
      }
    } catch (error) {
      console.error('Error al cargar perfil:', error);
    }
  };

  const cargarLogoOrganizacion = async () => {
    try {
      // Cargar configuración de organización
      const docRef = doc(db, 'configuracion', 'organizacion');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLogoOrganizacion(data.logo || '');
      }

      // Cargar información completa de la organización desde la colección organizaciones
      if (organizationId) {
        const orgRef = doc(db, 'organizaciones', organizationId);
        const orgSnap = await getDoc(orgRef);
        
        if (orgSnap.exists()) {
          const orgData = orgSnap.data();
          setOrganizacionInfo({
            nombre: orgData.nombre || organization?.organizationName || 'Sin nombre',
            descripcion: orgData.descripcion || 'Sin descripción disponible',
            tipo: orgData.tipo || organization?.organizationType || 'estudio_juridico',
            fechaCreacion: orgData.fechaCreacion || orgData.createdAt || 'Fecha no disponible',
            totalUsuarios: orgData.estadisticas?.totalUsuarios || 0,
            totalCasos: orgData.estadisticas?.totalCasos || 0
          });
        } else {
          // Si no existe en Firestore, usar datos del contexto
          setOrganizacionInfo({
            nombre: organization?.organizationName || 'Sin nombre',
            descripcion: 'Información no disponible en Firestore',
            tipo: organization?.organizationType || 'estudio_juridico',
            fechaCreacion: 'Fecha no disponible',
            totalUsuarios: 0,
            totalCasos: 0
          });
        }
      }
    } catch (error) {
      console.error('Error al cargar información de organización:', error);
      // Usar datos del contexto como fallback
      setOrganizacionInfo({
        nombre: organization?.organizationName || 'Sin nombre',
        descripcion: 'Error al cargar información',
        tipo: organization?.organizationType || 'estudio_juridico',
        fechaCreacion: 'Fecha no disponible',
        totalUsuarios: 0,
        totalCasos: 0
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje('');

    try {
      await setDoc(doc(db, 'configuracion', 'perfilUsuario'), perfil);
      await setDoc(doc(db, 'configuracion', 'organizacion'), {
        logo: logoOrganizacion,
        nombre: organizacionInfo.nombre,
        descripcion: organizacionInfo.descripcion,
        tipo: organizacionInfo.tipo,
        id: organizationId
      });
      
      // También actualizar la información en la colección organizaciones si existe
      if (organizationId) {
        try {
          const orgRef = doc(db, 'organizaciones', organizationId);
          const orgSnap = await getDoc(orgRef);
          
          if (orgSnap.exists()) {
            // Solo actualizar campos específicos sin sobrescribir estadísticas
            await setDoc(orgRef, {
              nombre: organizacionInfo.nombre,
              descripcion: organizacionInfo.descripcion,
              tipo: organizacionInfo.tipo,
              logo: logoOrganizacion
            }, { merge: true });
          }
        } catch (orgError) {
          console.log('No se pudo actualizar la colección organizaciones:', orgError);
        }
      }
      
      setMensaje('✅ Perfil guardado exitosamente');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error al guardar perfil:', error);
      setMensaje('❌ Error al guardar el perfil');
    } finally {
      setGuardando(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPerfil({ ...perfil, fotoPerfil: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoOrganizacion(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const copiarIdOrganizacion = async () => {
    try {
      await navigator.clipboard.writeText(organizationId);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (error) {
      console.error('Error al copiar:', error);
    }
  };

  return (
    <div className="modal-overlay-starwars">
      <div className="profile-card">
        <span className="close-btn" onClick={onClose}>×</span>
        
        <h2>
          <svg className="icon-svg" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08s5.97 1.09 6 3.08c-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
          Mi Perfil
        </h2>

        <label>Información de la Organización</label>
        <div className="org-section">
          <div className="org-logo-placeholder" onClick={() => document.getElementById('logoUpload').click()}>
            {logoOrganizacion ? (
              <img src={logoOrganizacion} alt="Logo" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px'}} />
            ) : (
              <svg className="icon-svg" style={{opacity: 0.5}} viewBox="0 0 24 24">
                <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
              </svg>
            )}
            <input
              id="logoUpload"
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              style={{display: 'none'}}
            />
          </div>
          <div style={{flexGrow: 1}}>
            <div style={{fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '8px'}}>
              {organizacionInfo.nombre}
            </div>
            <div style={{color: 'var(--sw-blue)', fontSize: '0.8rem', marginBottom: '8px'}}>
              {organizacionInfo.descripcion}
            </div>
            <div style={{color: 'var(--sw-blue)', fontSize: '0.7rem', marginBottom: '8px'}}>
              Tipo: {organizacionInfo.tipo?.replace('_', ' ').toUpperCase()}
            </div>
            <div style={{color: '#888', fontSize: '0.65rem', marginBottom: '8px'}}>
              Creada: {organizacionInfo.fechaCreacion ? 
                (typeof organizacionInfo.fechaCreacion === 'string' ? 
                  organizacionInfo.fechaCreacion : 
                  new Date(organizacionInfo.fechaCreacion).toLocaleDateString('es-PE')
                ) : 
                'Fecha no disponible'
              }
            </div>
            <div style={{display: 'flex', gap: '15px', fontSize: '0.65rem', color: '#888', marginBottom: '8px'}}>
              <span>👥 {organizacionInfo.totalUsuarios} usuarios</span>
              <span>📁 {organizacionInfo.totalCasos} casos</span>
            </div>
            <div className="id-badge">
              <span>ID: {organizationId}</span>
              <span style={{cursor: 'pointer'}} onClick={copiarIdOrganizacion}>
                {copiado ? '✓' : '📋'}
              </span>
            </div>
          </div>
        </div>

        <div className="profile-pic-container">
          <div className="avatar-circle" onClick={() => document.getElementById('profileUpload').click()}>
            {perfil.fotoPerfil || user?.photoURL ? (
              <img 
                src={perfil.fotoPerfil || user?.photoURL} 
                alt="Perfil" 
                style={{width: '100%', height: '100%', objectFit: 'cover'}} 
              />
            ) : (
              <div style={{fontSize: '2rem', color: 'var(--sw-blue)'}}>👤</div>
            )}
            <input
              id="profileUpload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{display: 'none'}}
            />
          </div>
          <label style={{cursor: 'pointer'}} onClick={() => document.getElementById('profileUpload').click()}>
            Haz clic para personalizar foto
          </label>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid-form">
            <div className="form-group">
              <label>Nombre Completo *</label>
              <input
                type="text"
                value={perfil.nombre}
                onChange={(e) => setPerfil({ ...perfil, nombre: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Correo Electrónico</label>
              <input
                type="email"
                value={perfil.email}
                onChange={(e) => setPerfil({ ...perfil, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Teléfono</label>
              <input
                type="text"
                value={perfil.telefono}
                onChange={(e) => setPerfil({ ...perfil, telefono: e.target.value })}
                placeholder="999 999 999"
              />
            </div>
            <div className="form-group">
              <label>Cargo</label>
              <input
                type="text"
                value={perfil.cargo}
                onChange={(e) => setPerfil({ ...perfil, cargo: e.target.value })}
                placeholder="Ej: Abogado Senior"
              />
            </div>
          </div>

          {mensaje && (
            <div style={{
              textAlign: 'center',
              margin: '20px 0',
              padding: '10px',
              borderRadius: '5px',
              background: mensaje.includes('✅') ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
              color: mensaje.includes('✅') ? 'var(--sw-blue)' : '#ff003c',
              border: `1px solid ${mensaje.includes('✅') ? 'var(--sw-blue)' : '#ff003c'}`
            }}>
              {mensaje}
            </div>
          )}

          <div className="actions">
            <button type="button" className="btn btn-cancel" onClick={onClose} disabled={guardando}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-save" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar Perfil'}
            </button>
          </div>
          
          {/* Botón adicional de cerrar perfil */}
          <div className="actions" style={{ marginTop: '10px' }}>
            <button 
              type="button" 
              className="btn btn-close" 
              onClick={onClose}
              style={{
                width: '100%',
                padding: '12px',
                background: 'transparent',
                border: '2px solid var(--sw-blue)',
                color: 'var(--sw-blue)',
                fontFamily: "'Exo 2', sans-serif",
                fontWeight: 'bold',
                textTransform: 'uppercase',
                fontSize: '0.9rem',
                cursor: 'pointer',
                borderRadius: '5px',
                transition: 'all 0.3s ease',
                letterSpacing: '1px'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'var(--sw-blue)';
                e.target.style.color = '#000';
                e.target.style.boxShadow = '0 0 15px rgba(45, 226, 255, 0.5)';
                e.target.style.letterSpacing = '2px';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = 'var(--sw-blue)';
                e.target.style.boxShadow = 'none';
                e.target.style.letterSpacing = '1px';
              }}
            >
              Cerrar Perfil
            </button>
          </div>

          {/* Botón de cerrar sesión */}
          {onLogout && (
            <div className="actions" style={{ marginTop: '10px' }}>
              <button 
                type="button" 
                className="btn btn-logout" 
                onClick={() => {
                  if (window.confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                    onLogout();
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'transparent',
                  border: '2px solid #ff003c',
                  color: '#ff003c',
                  fontFamily: "'Exo 2', sans-serif",
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  borderRadius: '5px',
                  transition: 'all 0.3s ease',
                  letterSpacing: '1px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#ff003c';
                  e.target.style.color = '#000';
                  e.target.style.boxShadow = '0 0 15px rgba(255, 0, 60, 0.5)';
                  e.target.style.letterSpacing = '2px';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = '#ff003c';
                  e.target.style.boxShadow = 'none';
                  e.target.style.letterSpacing = '1px';
                }}
              >
                🚪 Cerrar Sesión
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default PerfilUsuario;