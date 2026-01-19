import React, { useState, useEffect } from 'react';
import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signOut, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import ParallaxSimple from './ParallaxSimple';
import './SimpleLogin.css';

function SimpleLogin({ onLoginSuccess }) {
  const [step, setStep] = useState('welcome'); // welcome, organization, creating, email-signup, email-signin
  const [user, setUser] = useState(null);
  const [organizationId, setOrganizationId] = useState('');
  const [organizationType, setOrganizationType] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [organizations, setOrganizations] = useState([]);

  // Estados para autenticación con email
  const [authMode, setAuthMode] = useState('signin'); // 'signin' o 'signup'
  const [emailForm, setEmailForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });

  // Verificar si ya hay un usuario autenticado al cargar
  useEffect(() => {
    // Solo verificar si hay usuario, no manejar redirect
  }, []);

  const organizationTypes = [
    {
      id: 'estudio',
      name: 'Estudio Jurídico',
      icon: '⚖️',
      description: 'Despacho de abogados',
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)'
    },
    {
      id: 'organismo',
      name: 'Organismo Nacional',
      icon: '🏛️',
      description: 'Juzgados, fiscalías, etc.',
      color: '#dc2626',
      gradient: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)'
    },
    {
      id: 'estudiante',
      name: 'Estudiante',
      icon: '🎓',
      description: 'Estudiante de derecho',
      color: '#7c3aed',
      gradient: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)'
    }
  ];

  const handleEmailAuth = async (e) => {
    e.preventDefault();

    if (authMode === 'signup' && emailForm.password !== emailForm.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    if (emailForm.password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      // Configurar persistencia antes de autenticar
      await setPersistence(auth, browserLocalPersistence);
      
      let user;

      if (authMode === 'signup') {
        const result = await createUserWithEmailAndPassword(auth, emailForm.email, emailForm.password);
        user = result.user;

        // Actualizar el perfil con el nombre
        if (emailForm.displayName) {
          await updateProfile(user, {
            displayName: emailForm.displayName
          });
          await user.reload();
          user = auth.currentUser;
        }
      } else {
        const result = await signInWithEmailAndPassword(auth, emailForm.email, emailForm.password);
        user = result.user;
      }

      setUser(user);

      // Verificar si el usuario ya tiene una organización
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.organizationId && userData.organizationName) {
          setTimeout(() => {
            onLoginSuccess({
              user: user,
              organization: userData
            });
          }, 200);
          return;
        }
      }

      await loadOrganizations();
      setStep('organization');
    } catch (error) {
      let message = 'Error en la autenticación';
      
      if (error.code === 'auth/email-already-in-use') {
        message = '📧 Este email ya está registrado\n\n¿Quieres iniciar sesión en su lugar?';
        if (window.confirm(message)) {
          setAuthMode('signin');
        }
        return;
      } else if (error.code === 'auth/weak-password') {
        message = '🔒 Contraseña muy débil\n\nUsa al menos 6 caracteres con números y letras.';
      } else if (error.code === 'auth/invalid-email') {
        message = '📧 Email inválido\n\nVerifica que el formato sea correcto.';
      } else if (error.code === 'auth/user-not-found') {
        message = '👤 Usuario no encontrado\n\n¿Quieres crear una cuenta nueva?';
        if (window.confirm(message)) {
          setAuthMode('signup');
        }
        return;
      } else if (error.code === 'auth/wrong-password') {
        message = '🔒 Contraseña incorrecta\n\nVerifica tu contraseña e intenta nuevamente.';
      } else if (error.code === 'auth/too-many-requests') {
        message = '⏰ Demasiados intentos fallidos\n\nEspera unos minutos e intenta nuevamente.';
      } else if (error.code === 'auth/network-request-failed') {
        message = '🌐 Error de conexión\n\nVerifica tu conexión a internet.';
      }

      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);

    try {
      // Verificar configuración de Firebase
      if (!auth || !db) {
        throw new Error('Firebase no está configurado correctamente');
      }

      // Limpiar sesión anterior si existe
      if (auth.currentUser) {
        await signOut(auth);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Configurar persistencia antes de autenticar
      await setPersistence(auth, browserLocalPersistence);

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
        hd: '',
        include_granted_scopes: 'true'
      });

      provider.addScope('email');
      provider.addScope('profile');
      provider.addScope('openid');

      console.log('🔐 Iniciando autenticación con Google...');
      
      const authPromise = signInWithPopup(auth, provider);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), 60000) // Aumentado a 60 segundos
      );

      const result = await Promise.race([authPromise, timeoutPromise]);
      const user = result.user;
      
      console.log('✅ Usuario autenticado:', user.email);
      setUser(user);

      // Verificar si el usuario ya tiene una organización
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('📋 Datos de usuario encontrados:', userData);
        
        if (userData.organizationId && userData.organizationName) {
          console.log('🏢 Usuario ya tiene organización, redirigiendo...');
          setTimeout(() => {
            onLoginSuccess({
              user: user,
              organization: userData
            });
          }, 200);
          return;
        }
      }

      console.log('🔍 Cargando organizaciones disponibles...');
      await loadOrganizations();
      setStep('organization');
    } catch (error) {
      console.error('❌ Error en autenticación:', error);
      
      let message = 'Error al iniciar sesión con Google';
      let details = '';
      
      if (error.message === 'TIMEOUT') {
        message = '⏰ Tiempo de espera agotado';
        details = 'La autenticación tardó demasiado. Intenta nuevamente.';
      } else if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        console.log('ℹ️ Usuario canceló la autenticación');
        return;
      } else if (error.code === 'auth/popup-blocked') {
        message = '🚫 Popup bloqueado';
        details = 'Por favor permite popups para este sitio y recarga la página.';
      } else if (error.code === 'auth/configuration-not-found') {
        message = '⚙️ Error de configuración';
        details = 'La configuración de Firebase no es válida. Contacta al administrador.';
      } else if (error.code === 'auth/invalid-api-key') {
        message = '🔑 API Key inválida';
        details = 'La clave de API de Firebase no es válida. Verifica la configuración.';
      } else if (error.code === 'auth/network-request-failed') {
        message = '🌐 Error de conexión';
        details = 'No se pudo conectar con los servidores. Verifica tu conexión a internet.';
      } else {
        details = `Código: ${error.code || 'desconocido'}\nMensaje: ${error.message}`;
      }

      alert(`${message}\n\n${details}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrganizations = async () => {
    try {
      const orgsSnapshot = await getDocs(collection(db, 'organizations'));
      const orgsData = orgsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrganizations(orgsData);
    } catch (error) {
      console.error('Error al cargar organizaciones:', error);
    }
  };

  const handleJoinOrganization = async () => {
    if (!organizationId.trim()) {
      alert('Por favor ingresa un ID de organización');
      return;
    }

    setIsLoading(true);

    try {
      const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
      
      if (!orgDoc.exists()) {
        alert('La organización no existe. Verifica el ID o crea una nueva organización.');
        setIsLoading(false);
        return;
      }

      const orgData = orgDoc.data();

      const userData = {
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
        organizationId: organizationId,
        organizationType: orgData.type,
        organizationName: orgData.name,
        joinedAt: new Date(),
        role: 'member'
      };

      await setDoc(doc(db, 'users', user.uid), userData);

      setTimeout(() => {
        onLoginSuccess({
          user: user,
          organization: {
            organizationId,
            organizationType: orgData.type,
            organizationName: orgData.name
          }
        });
      }, 100);
    } catch (error) {
      alert('Error al unirse a la organización');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrganization = async () => {
    if (!organizationType || !organizationName.trim()) {
      alert('Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);

    try {
      const orgId = `${organizationType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const orgData = {
        name: organizationName,
        type: organizationType,
        createdBy: user.uid,
        createdAt: new Date(),
        members: [user.uid]
      };

      await setDoc(doc(db, 'organizations', orgId), orgData);

      const userData = {
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
        organizationId: orgId,
        organizationType: organizationType,
        organizationName: organizationName,
        joinedAt: new Date(),
        role: 'admin'
      };

      await setDoc(doc(db, 'users', user.uid), userData);

      setTimeout(() => {
        onLoginSuccess({
          user: user,
          organization: {
            organizationId: orgId,
            organizationType,
            organizationName
          }
        });
      }, 100);
    } catch (error) {
      alert('Error al crear la organización');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'welcome') {
    return (
      <ParallaxSimple>
        <div className="login-card-simple" style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '20px',
          padding: '3.5rem 1.5rem',
          maxWidth: '420px',
          width: '100%',
          minHeight: '580px'
        }}>
          <div style={{ height: '60px' }}></div>
          
          <div className="login-brand-simple" style={{ marginTop: '0' }}>
            <div className="brand-logo-simple" style={{ 
              width: '80px', 
              height: '80px', 
              margin: '0 auto 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              <img 
                src="./leyia.png" 
                alt="LeyIA" 
                style={{ 
                  width: '80px', 
                  height: '80px', 
                  objectFit: 'contain',
                  maxWidth: '80px',
                  maxHeight: '80px'
                }} 
              />
            </div>
            <h1 className="brand-title-simple">LeyIA</h1>
            <p className="brand-subtitle-simple">Inteligencia Jurídica Avanzada</p>
          </div>

          <div className="login-features-simple">
            <div className="feature-grid-simple">
              <div className="feature-card-simple">
                <div className="feature-icon-simple">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
                  </svg>
                </div>
                <span>Gestión Inteligente</span>
              </div>
              
              <div className="feature-card-simple">
                <div className="feature-icon-simple">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2Z"/>
                  </svg>
                </div>
                <span>Asistente de IA Avanzada</span>
              </div>
              
              <div className="feature-card-simple">
                <div className="feature-icon-simple">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3Z"/>
                  </svg>
                </div>
                <span>Búsqueda de Jurisprudencia</span>
              </div>
              
              <div className="feature-card-simple">
                <div className="feature-icon-simple">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2S9 3.34 9 5V11C9 12.66 10.34 14 12 14Z"/>
                  </svg>
                </div>
                <span>Transcripción y Generación de Actas</span>
              </div>
            </div>
          </div>

          <div className="login-actions-simple">
            <button 
              className="google-btn-simple"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <div className="google-icon-simple">
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <span>{isLoading ? 'Iniciando sesión...' : 'Continuar con Google'}</span>
            </button>

            {/* Botón de diagnóstico */}
            <button 
              onClick={() => {
                const config = window.firebaseDebug?.config || {};
                const diagnostico = `
🔧 DIAGNÓSTICO DE FIREBASE

📋 Configuración:
• API Key: ${config.apiKey ? (config.apiKey.startsWith('demo-') ? '❌ Demo (no válida)' : '✅ Configurada') : '❌ Faltante'}
• Auth Domain: ${config.authDomain ? (config.authDomain.includes('demo-') ? '❌ Demo' : '✅ Configurada') : '❌ Faltante'}
• Project ID: ${config.projectId ? (config.projectId === 'demo-project' ? '❌ Demo' : '✅ Configurada') : '❌ Faltante'}

🌐 Estado de conexión:
• Firebase Auth: ${window.firebaseDebug?.auth ? '✅ Disponible' : '❌ No disponible'}
• Firestore: ${window.firebaseDebug?.db ? '✅ Disponible' : '❌ No disponible'}

💡 Soluciones:
${config.apiKey?.startsWith('demo-') ? '• Configura las variables de entorno en .env\n• Obtén las credenciales de Firebase Console' : '• Verifica tu conexión a internet\n• Revisa la consola del navegador para más detalles'}
                `;
                alert(diagnostico);
              }}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                color: '#60a5fa',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              🔧 Diagnóstico de Conexión
            </button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              margin: '20px 0',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '14px'
            }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.2)' }}></div>
              <span style={{ margin: '0 16px' }}>o</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.2)' }}></div>
            </div>

            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button 
                className="email-btn-simple"
                onClick={() => {
                  setStep('email-auth');
                  setAuthMode('signin');
                }}
                style={{
                  flex: 1,
                  padding: '14px 20px',
                  background: 'transparent',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '15px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                <span>Ingresar Cuenta</span>
              </button>

              <button 
                className="email-btn-simple"
                onClick={() => {
                  setStep('email-auth');
                  setAuthMode('signup');
                }}
                style={{
                  flex: 1,
                  padding: '14px 20px',
                  background: 'transparent',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '15px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2Z"/>
                </svg>
                <span>Crear Cuenta</span>
              </button>
            </div>
          </div>

          <div className="login-footer-simple">
            <div className="security-badges-simple">
              <div className="badge-simple">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white" style={{ marginRight: '6px' }}>
                  <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1Z"/>
                </svg>
                Seguro
              </div>
              <div className="badge-simple">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white" style={{ marginRight: '6px' }}>
                  <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                </svg>
                Rápido
              </div>
              <div className="badge-simple">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white" style={{ marginRight: '6px' }}>
                  <path d="M21,11C21,16.55 17.16,21.74 12,23C6.84,21.74 3,16.55 3,11V5L12,1L21,5V11Z"/>
                </svg>
                Confiable
              </div>
            </div>
          </div>
        </div>
      </ParallaxSimple>
    );
  }

  if (step === 'email-auth') {
    return (
      <ParallaxSimple>
        <div className="login-card-simple" style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '20px',
          padding: '3rem 2rem',
          maxWidth: '420px',
          width: '100%'
        }}>
          <button 
            onClick={() => setStep('welcome')}
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '24px',
              padding: '8px'
            }}
          >
            ←
          </button>

          <div className="login-brand-simple" style={{ marginBottom: '2rem' }}>
            <div className="brand-logo-simple" style={{ 
              width: '80px', 
              height: '80px', 
              margin: '0 auto 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              <img 
                src="./leyia.png" 
                alt="LeyIA" 
                style={{ 
                  width: '80px', 
                  height: '80px', 
                  objectFit: 'contain',
                  maxWidth: '80px',
                  maxHeight: '80px'
                }} 
              />
            </div>
            <h1 className="brand-title-simple">LeyIA</h1>
            <p className="brand-subtitle-simple">
              {authMode === 'signup' ? 'Crear cuenta nueva' : 'Iniciar sesión'}
            </p>
          </div>

          <form onSubmit={handleEmailAuth} style={{ width: '100%' }}>
            {authMode === 'signup' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  color: 'white', 
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={emailForm.displayName}
                  onChange={(e) => setEmailForm({...emailForm, displayName: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '15px'
                  }}
                  placeholder="Tu nombre"
                />
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'block', 
                color: 'white', 
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Email
              </label>
              <input
                type="email"
                value={emailForm.email}
                onChange={(e) => setEmailForm({...emailForm, email: e.target.value})}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '15px'
                }}
                placeholder="tu@email.com"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'block', 
                color: 'white', 
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Contraseña
              </label>
              <input
                type="password"
                value={emailForm.password}
                onChange={(e) => setEmailForm({...emailForm, password: e.target.value})}
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '15px'
                }}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            {authMode === 'signup' && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ 
                  display: 'block', 
                  color: 'white', 
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  value={emailForm.confirmPassword}
                  onChange={(e) => setEmailForm({...emailForm, confirmPassword: e.target.value})}
                  required
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '15px'
                  }}
                  placeholder="Repite tu contraseña"
                />
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '16px'
              }}
            >
              {isLoading ? 'Procesando...' : (authMode === 'signup' ? 'Crear cuenta' : 'Iniciar sesión')}
            </button>

            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'signup' ? 'signin' : 'signup');
                  setEmailForm({ email: '', password: '', confirmPassword: '', displayName: '' });
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.8)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  textDecoration: 'underline'
                }}
              >
                {authMode === 'signup' ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
              </button>
            </div>
          </form>
        </div>
      </ParallaxSimple>
    );
  }

  if (step === 'organization') {
    return (
      <ParallaxSimple>
        <div className="login-card-simple" style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '20px',
          padding: '3rem 2rem',
          maxWidth: '520px',
          width: '100%'
        }}>
          <div className="login-brand-simple" style={{ marginBottom: '2rem' }}>
            <h2 style={{ 
              color: 'white', 
              fontSize: '28px', 
              fontWeight: '700',
              marginBottom: '8px'
            }}>
              Selecciona tu organización
            </h2>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.7)', 
              fontSize: '15px'
            }}>
              Elige el tipo de organización o únete a una existente
            </p>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ 
              color: 'white', 
              fontSize: '18px', 
              fontWeight: '600',
              marginBottom: '16px'
            }}>
              Crear nueva organización
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '12px',
              marginBottom: '20px'
            }}>
              {organizationTypes.map(type => (
                <div
                  key={type.id}
                  onClick={() => setOrganizationType(type.id)}
                  style={{
                    padding: '20px 12px',
                    background: organizationType === type.id 
                      ? type.gradient 
                      : 'rgba(255, 255, 255, 0.1)',
                    border: `2px solid ${organizationType === type.id ? type.color : 'rgba(255, 255, 255, 0.2)'}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    transform: organizationType === type.id ? 'scale(1.05)' : 'scale(1)'
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>{type.icon}</div>
                  <div style={{ 
                    color: 'white', 
                    fontSize: '13px', 
                    fontWeight: '600',
                    marginBottom: '4px'
                  }}>
                    {type.name}
                  </div>
                  <div style={{ 
                    color: 'rgba(255, 255, 255, 0.7)', 
                    fontSize: '11px'
                  }}>
                    {type.description}
                  </div>
                </div>
              ))}
            </div>

            {organizationType && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  color: 'white', 
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Nombre de la organización
                </label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Ej: Estudio Jurídico García & Asociados"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '15px'
                  }}
                />
              </div>
            )}

            <button
              onClick={handleCreateOrganization}
              disabled={!organizationType || !organizationName.trim() || isLoading}
              style={{
                width: '100%',
                padding: '14px',
                background: organizationType && organizationName.trim()
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: organizationType && organizationName.trim() ? 'pointer' : 'not-allowed',
                opacity: organizationType && organizationName.trim() ? 1 : 0.5
              }}
            >
              {isLoading ? 'Creando...' : 'Crear organización'}
            </button>
          </div>

          <div style={{
            height: '1px',
            background: 'rgba(255, 255, 255, 0.2)',
            margin: '32px 0'
          }}></div>

          <div>
            <h3 style={{ 
              color: 'white', 
              fontSize: '18px', 
              fontWeight: '600',
              marginBottom: '16px'
            }}>
              Unirse a organización existente
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'block', 
                color: 'white', 
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                ID de la organización
              </label>
              <input
                type="text"
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
                placeholder="Ingresa el ID proporcionado por tu organización"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '15px'
                }}
              />
            </div>

            <button
              onClick={handleJoinOrganization}
              disabled={!organizationId.trim() || isLoading}
              style={{
                width: '100%',
                padding: '14px',
                background: organizationId.trim()
                  ? 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)'
                  : 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: organizationId.trim() ? 'pointer' : 'not-allowed',
                opacity: organizationId.trim() ? 1 : 0.5
              }}
            >
              {isLoading ? 'Uniéndose...' : 'Unirse a organización'}
            </button>
          </div>

          {organizations.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.6)', 
                fontSize: '13px',
                marginBottom: '12px'
              }}>
                Organizaciones disponibles:
              </p>
              <div style={{ 
                maxHeight: '150px', 
                overflowY: 'auto',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                padding: '8px'
              }}>
                {organizations.map(org => (
                  <div
                    key={org.id}
                    onClick={() => setOrganizationId(org.id)}
                    style={{
                      padding: '12px',
                      background: organizationId === org.id 
                        ? 'rgba(59, 130, 246, 0.3)' 
                        : 'transparent',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      marginBottom: '4px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ 
                      color: 'white', 
                      fontSize: '14px', 
                      fontWeight: '500'
                    }}>
                      {org.name}
                    </div>
                    <div style={{ 
                      color: 'rgba(255, 255, 255, 0.6)', 
                      fontSize: '12px'
                    }}>
                      {org.type} • {org.id}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ParallaxSimple>
    );
  }

  return null;
}

export default SimpleLogin;
