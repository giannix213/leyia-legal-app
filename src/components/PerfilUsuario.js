import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useOrganizacionContext } from '../contexts/OrganizacionContext';
import { useCasos } from '../hooks/useCasos';
import './PerfilUsuario.css';

function PerfilUsuario({ onClose, user, organization, onLogout }) {
  const { organizacionActual, establecerOrganizacion } = useOrganizacionContext();
  const { diagnosticarOrganizacion, migrarCasosDeOtraOrganizacion } = useCasos();
  
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
  
  // Estados para las nuevas funcionalidades
  const [vistaActiva, setVistaActiva] = useState('perfil'); // 'perfil', 'organizacion', 'diagnostico'
  const [diagnostico, setDiagnostico] = useState(null);
  const [cargandoDiagnostico, setCargandoDiagnostico] = useState(false);
  const [organizacionesDisponibles, setOrganizacionesDisponibles] = useState([]);
  const [nuevaOrganizacion, setNuevaOrganizacion] = useState({
    nombre: '',
    tipo: 'estudio_juridico',
    descripcion: ''
  });
  const [passwordMigracion, setPasswordMigracion] = useState('');
  const [mostrarPasswordMigracion, setMostrarPasswordMigracion] = useState(false);

  // Usar el ID de organización del contexto actualizado
  const organizationId = organizacionActual?.id || organization?.organizationId || organization?.id;

  useEffect(() => {
    cargarPerfil();
    cargarLogoOrganizacion();
    if (vistaActiva === 'diagnostico') {
      realizarDiagnostico();
    }
  }, [vistaActiva]);

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

  // Nuevas funciones para gestión de organizaciones
  const realizarDiagnostico = async () => {
    setCargandoDiagnostico(true);
    try {
      const resultado = await diagnosticarOrganizacion();
      setDiagnostico(resultado);
    } catch (error) {
      console.error('Error en diagnóstico:', error);
      setMensaje('❌ Error al realizar diagnóstico');
    } finally {
      setCargandoDiagnostico(false);
    }
  };

  const handleMigrarDatos = async (organizacionOrigen) => {
    if (!passwordMigracion) {
      setMensaje('❌ Ingresa la contraseña para confirmar la migración');
      return;
    }

    // Verificar contraseña (simple verificación con email del usuario)
    if (passwordMigracion !== user?.email) {
      setMensaje('❌ Contraseña incorrecta. Usa tu email como contraseña.');
      return;
    }

    const casosAMigrar = diagnostico?.totalCasos - diagnostico?.casosConOrganizacion - diagnostico?.casosSinOrganizacion;
    
    if (!window.confirm(`¿Confirmas migrar ${casosAMigrar} casos de "${organizacionOrigen}" a tu organización actual? Esta acción es irreversible.`)) {
      return;
    }

    setGuardando(true);
    try {
      const migrados = await migrarCasosDeOtraOrganizacion(organizacionOrigen);
      setMensaje(`✅ Se migraron ${migrados} casos exitosamente`);
      setPasswordMigracion('');
      setMostrarPasswordMigracion(false);
      await realizarDiagnostico(); // Actualizar diagnóstico
    } catch (error) {
      console.error('Error migrando datos:', error);
      setMensaje('❌ Error al migrar los datos');
    } finally {
      setGuardando(false);
    }
  };

  const handleCambiarOrganizacion = (nuevaOrg) => {
    if (window.confirm(`¿Cambiar a la organización "${nuevaOrg.nombre}"? Esto cambiará los datos que ves en la aplicación.`)) {
      establecerOrganizacion(nuevaOrg);
      setMensaje(`✅ Cambiado a organización: ${nuevaOrg.nombre}`);
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  const handleCrearOrganizacion = async () => {
    if (!nuevaOrganizacion.nombre.trim()) {
      setMensaje('❌ El nombre de la organización es requerido');
      return;
    }

    const nuevaOrg = {
      id: `org-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      nombre: nuevaOrganizacion.nombre,
      tipo: nuevaOrganizacion.tipo,
      descripcion: nuevaOrganizacion.descripcion,
      fechaCreacion: new Date().toISOString(),
      creadoPor: user?.uid
    };

    try {
      // Guardar en Firebase (opcional)
      await setDoc(doc(db, 'organizaciones', nuevaOrg.id), nuevaOrg);
      
      // Cambiar a la nueva organización
      establecerOrganizacion(nuevaOrg);
      setMensaje(`✅ Organización "${nuevaOrg.nombre}" creada y activada`);
      setNuevaOrganizacion({ nombre: '', tipo: 'estudio_juridico', descripcion: '' });
      
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error creando organización:', error);
      setMensaje('❌ Error al crear la organización');
    }
  };

  return (
    <div className="modal-overlay-starwars">
      <div className="profile-card">
        <span className="close-btn" onClick={onClose}>×</span>
        
        {/* Navegación por pestañas */}
        <div className="profile-tabs">
          <button 
            className={`tab-btn ${vistaActiva === 'perfil' ? 'active' : ''}`}
            onClick={() => setVistaActiva('perfil')}
          >
            👤 Mi Perfil
          </button>
          <button 
            className={`tab-btn ${vistaActiva === 'organizacion' ? 'active' : ''}`}
            onClick={() => setVistaActiva('organizacion')}
          >
            🏢 Organización
          </button>
          <button 
            className={`tab-btn ${vistaActiva === 'diagnostico' ? 'active' : ''}`}
            onClick={() => setVistaActiva('diagnostico')}
          >
            🔍 Diagnóstico
          </button>
        </div>

        {/* Vista de Perfil Personal */}
        {vistaActiva === 'perfil' && (
          <>
            <h2>
              <svg className="icon-svg" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08s5.97 1.09 6 3.08c-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
              Mi Perfil Personal
            </h2>

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

              <div className="actions">
                <button type="submit" className="btn btn-save" disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Guardar Perfil'}
                </button>
              </div>
            </form>
          </>
        )}

        {/* Vista de Gestión de Organización */}
        {vistaActiva === 'organizacion' && (
          <>
            <h2>
              <svg className="icon-svg" viewBox="0 0 24 24">
                <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
              </svg>
              Gestión de Organización
            </h2>

            {/* Organización Actual */}
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
                <div style={{fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '8px', color: 'var(--sw-blue)'}}>
                  {organizacionActual?.nombre || 'Sin nombre'}
                </div>
                <div style={{color: '#88c0d0', fontSize: '0.8rem', marginBottom: '8px'}}>
                  {organizacionActual?.tipo?.replace('_', ' ').toUpperCase() || 'TIPO NO DEFINIDO'}
                </div>
                <div className="id-badge">
                  <span>ID: {organizationId}</span>
                  <span style={{cursor: 'pointer'}} onClick={copiarIdOrganizacion}>
                    {copiado ? '✓' : '📋'}
                  </span>
                </div>
              </div>
            </div>

            {/* Editar Organización Actual */}
            <div className="form-section">
              <h3>Editar Organización Actual</h3>
              <div className="grid-form">
                <div className="form-group">
                  <label>Nombre de la Organización</label>
                  <input
                    type="text"
                    value={organizacionInfo.nombre}
                    onChange={(e) => setOrganizacionInfo({...organizacionInfo, nombre: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Tipo</label>
                  <select
                    value={organizacionInfo.tipo}
                    onChange={(e) => setOrganizacionInfo({...organizacionInfo, tipo: e.target.value})}
                  >
                    <option value="estudio_juridico">Estudio Jurídico</option>
                    <option value="empresa">Empresa</option>
                    <option value="institucion">Institución</option>
                    <option value="consultoria">Consultoría</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={organizacionInfo.descripcion}
                  onChange={(e) => setOrganizacionInfo({...organizacionInfo, descripcion: e.target.value})}
                  rows="3"
                  placeholder="Descripción de la organización..."
                />
              </div>
            </div>

            {/* Crear Nueva Organización */}
            <div className="form-section">
              <h3>Crear Nueva Organización</h3>
              <div className="grid-form">
                <div className="form-group">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    value={nuevaOrganizacion.nombre}
                    onChange={(e) => setNuevaOrganizacion({...nuevaOrganizacion, nombre: e.target.value})}
                    placeholder="Nombre de la nueva organización"
                  />
                </div>
                <div className="form-group">
                  <label>Tipo</label>
                  <select
                    value={nuevaOrganizacion.tipo}
                    onChange={(e) => setNuevaOrganizacion({...nuevaOrganizacion, tipo: e.target.value})}
                  >
                    <option value="estudio_juridico">Estudio Jurídico</option>
                    <option value="empresa">Empresa</option>
                    <option value="institucion">Institución</option>
                    <option value="consultoria">Consultoría</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={nuevaOrganizacion.descripcion}
                  onChange={(e) => setNuevaOrganizacion({...nuevaOrganizacion, descripcion: e.target.value})}
                  rows="2"
                  placeholder="Descripción opcional..."
                />
              </div>
              <button 
                type="button" 
                className="btn btn-save" 
                onClick={handleCrearOrganizacion}
                disabled={!nuevaOrganizacion.nombre.trim()}
              >
                🏢 Crear y Cambiar a Nueva Organización
              </button>
            </div>

            <div className="actions">
              <button type="button" className="btn btn-save" onClick={handleSubmit} disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </>
        )}

        {/* Vista de Diagnóstico */}
        {vistaActiva === 'diagnostico' && (
          <>
            <h2>
              <svg className="icon-svg" viewBox="0 0 24 24">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              Diagnóstico del Sistema
            </h2>

            {/* Estado del Contexto */}
            <div className="diagnostic-section">
              <h3>📋 Estado Actual</h3>
              <div className="diagnostic-info">
                <p><strong>Organización:</strong> {organizacionActual?.nombre || 'No definida'}</p>
                <p><strong>ID:</strong> {organizationId || 'No definido'}</p>
                <p><strong>Usuario:</strong> {user?.email || 'No autenticado'}</p>
                <p><strong>Tipo:</strong> {organizacionActual?.tipo || 'No definido'}</p>
              </div>
            </div>

            {/* Diagnóstico de Firebase */}
            {cargandoDiagnostico ? (
              <div className="diagnostic-loading">
                <div>🔄 Analizando base de datos...</div>
              </div>
            ) : diagnostico ? (
              <div className="diagnostic-section">
                <h3>🔥 Análisis de Datos</h3>
                <div className={`diagnostic-info ${diagnostico.casosConOrganizacion > 0 ? 'success' : 'warning'}`}>
                  <p><strong>Casos en tu organización:</strong> {diagnostico.casosConOrganizacion}</p>
                  <p><strong>Total de casos en BD:</strong> {diagnostico.totalCasos}</p>
                  <p><strong>Casos sin organizacionId:</strong> {diagnostico.casosSinOrganizacion}</p>
                  <p><strong>Organizaciones encontradas:</strong> {diagnostico.organizacionesEncontradas.length}</p>
                  
                  {diagnostico.organizacionesEncontradas.length > 0 && (
                    <div style={{ marginTop: '15px' }}>
                      <strong>Organizaciones en BD:</strong>
                      <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
                        {diagnostico.organizacionesEncontradas.map(orgId => (
                          <li key={orgId} style={{
                            color: orgId === organizationId ? '#2de2ff' : '#88c0d0',
                            fontWeight: orgId === organizationId ? 'bold' : 'normal',
                            marginBottom: '5px'
                          }}>
                            {orgId} {orgId === organizationId && '← Tu organización actual'}
                            {orgId !== organizationId && (
                              <button
                                onClick={() => setMostrarPasswordMigracion(orgId)}
                                style={{
                                  marginLeft: '10px',
                                  padding: '2px 8px',
                                  fontSize: '11px',
                                  background: '#dc2626',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'pointer'
                                }}
                              >
                                Migrar datos
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Migración con contraseña */}
            {mostrarPasswordMigracion && (
              <div className="diagnostic-section">
                <h3>🔐 Migración Segura de Datos</h3>
                <div className="migration-form">
                  <p style={{color: '#f59e0b', marginBottom: '15px'}}>
                    ⚠️ Vas a migrar datos de otra organización. Esta acción es <strong>irreversible</strong>.
                  </p>
                  <div className="form-group">
                    <label>Confirma con tu email como contraseña:</label>
                    <input
                      type="password"
                      value={passwordMigracion}
                      onChange={(e) => setPasswordMigracion(e.target.value)}
                      placeholder="Ingresa tu email para confirmar"
                    />
                  </div>
                  <div style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
                    <button
                      onClick={() => handleMigrarDatos(mostrarPasswordMigracion)}
                      disabled={!passwordMigracion || guardando}
                      className="btn btn-save"
                      style={{background: '#dc2626'}}
                    >
                      {guardando ? '🔄 Migrando...' : '🔄 Confirmar Migración'}
                    </button>
                    <button
                      onClick={() => {
                        setMostrarPasswordMigracion(false);
                        setPasswordMigracion('');
                      }}
                      className="btn btn-cancel"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="actions">
              <button 
                onClick={realizarDiagnostico}
                disabled={cargandoDiagnostico}
                className="btn btn-save"
              >
                {cargandoDiagnostico ? '🔄 Analizando...' : '🔄 Actualizar Diagnóstico'}
              </button>
            </div>
          </>
        )}

        {/* Mensajes */}
        {mensaje && (
          <div style={{
            textAlign: 'center',
            margin: '20px 0',
            padding: '15px',
            borderRadius: '8px',
            background: mensaje.includes('✅') ? 'rgba(45, 226, 255, 0.1)' : 'rgba(255, 0, 60, 0.1)',
            color: mensaje.includes('✅') ? 'var(--sw-blue)' : '#ff003c',
            border: `1px solid ${mensaje.includes('✅') ? 'var(--sw-blue)' : '#ff003c'}`
          }}>
            {mensaje}
          </div>
        )}

        {/* Botones de acción globales */}
        <div className="global-actions">
          <button 
            type="button" 
            className="btn btn-close" 
            onClick={onClose}
          >
            Cerrar Perfil
          </button>
          
          {onLogout && (
            <button 
              type="button" 
              className="btn btn-logout" 
              onClick={() => {
                if (window.confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                  onLogout();
                }
              }}
            >
              🚪 Cerrar Sesión
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PerfilUsuario;