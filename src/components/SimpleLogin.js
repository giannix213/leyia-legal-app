// src/components/SimpleLogin.js - Sistema de autenticación simple conectado a Firebase
import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import ParallaxSimple from './ParallaxSimple';
import OrganizacionSelector from './OrganizacionSelector';
import FirestoreDebugger from './FirestoreDebugger';
import LoginDiagnostic from './LoginDiagnostic';
import { useOrganizaciones } from '../hooks/useOrganizaciones';

function SimpleLogin({ onLoginSuccess }) {
  const { cargarOrganizacionUsuario } = useOrganizaciones();
  
  const [step, setStep] = useState('welcome'); // welcome, auth, organization
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Cambiar a true para mostrar loading inicial
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    displayName: ''
  });
  const [authMode, setAuthMode] = useState('signin'); // signin, signup
  const [mostrarSelectorOrg, setMostrarSelectorOrg] = useState(false);
  const [mostrarDebugger, setMostrarDebugger] = useState(false);
  const [mostrarLoginDiagnostic, setMostrarLoginDiagnostic] = useState(false);

  // Detectar si estamos en Electron
  const isElectron = !!window?.process?.versions?.electron;

  // Listener para cambios de autenticación de Firebase
  useEffect(() => {
    const handleAuthStateChange = async (firebaseUser) => {
      setIsLoading(false);
      
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Primero intentar cargar organización desde Firestore
        try {
          const orgData = await cargarOrganizacionUsuario(firebaseUser.uid);
          
          if (orgData && onLoginSuccess) {
            onLoginSuccess({
              user: firebaseUser,
              organizacion: orgData,
              timestamp: new Date().toISOString()
            });
            return;
          }
        } catch (err) {
          // Si falla Firestore, intentar localStorage como fallback
        }
        
        // Fallback: Verificar si el usuario ya tiene una organización guardada en localStorage
        const orgGuardada = localStorage.getItem('organizacionActual');
        if (orgGuardada) {
          try {
            const orgData = JSON.parse(orgGuardada);
            
            // Si tiene organización guardada, completar el login directamente
            if (onLoginSuccess) {
              onLoginSuccess({
                user: firebaseUser,
                organizacion: orgData,
                timestamp: new Date().toISOString()
              });
            }
            return;
          } catch (err) {
            localStorage.removeItem('organizacionActual');
          }
        }
        
        // Si no tiene organización, mostrar selector
        setMostrarSelectorOrg(true);
      } else {
        // Usuario no autenticado, limpiar estados
        setUser(null);
        setMostrarSelectorOrg(false);
        setStep('welcome');
        localStorage.removeItem('organizacionActual');
      }
    };

    const unsubscribe = auth.onAuthStateChanged(handleAuthStateChange);
    return () => unsubscribe();
  }, [onLoginSuccess, cargarOrganizacionUsuario]);

  // Función de cerrar sesión
  const handleLogout = async () => {
    try {
      await auth.signOut();
      localStorage.removeItem('organizacionActual');
      setUser(null);
      setMostrarSelectorOrg(false);
      setStep('welcome');
    } catch (error) {
      alert('Error al cerrar sesión');
    }
  };

  // Función de autenticación con Firebase
  const handleFirebaseAuth = async (e) => {
    e.preventDefault();
    
    if (!authForm.email || !authForm.password) {
      alert('Por favor completa todos los campos');
      return;
    }

    if (authForm.password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      let userCredential;

      if (authMode === 'signup') {
        // Crear nueva cuenta
        userCredential = await createUserWithEmailAndPassword(auth, authForm.email, authForm.password);
        
        // Actualizar perfil con nombre si se proporcionó
        if (authForm.displayName) {
          await updateProfile(userCredential.user, {
            displayName: authForm.displayName
          });
          // Recargar usuario para obtener datos actualizados
          await userCredential.user.reload();
        }
      } else {
        // Iniciar sesión
        userCredential = await signInWithEmailAndPassword(auth, authForm.email, authForm.password);
      }

      console.log('✅ Autenticación Firebase exitosa:', userCredential.user.email);

    } catch (error) {
      let message = 'Error en la autenticación';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          message = '📧 Este email ya está registrado\n\n¿Quieres iniciar sesión en su lugar?';
          if (window.confirm(message)) {
            setAuthMode('signin');
          }
          return;
        case 'auth/weak-password':
          message = '🔒 Contraseña muy débil\n\nUsa al menos 6 caracteres con números y letras.';
          break;
        case 'auth/invalid-email':
          message = '📧 Email inválido\n\nVerifica que el formato sea correcto.';
          break;
        case 'auth/user-not-found':
          message = '👤 Usuario no encontrado\n\n¿Quieres crear una cuenta nueva?';
          if (window.confirm(message)) {
            setAuthMode('signup');
          }
          return;
        case 'auth/wrong-password':
          message = '🔒 Contraseña incorrecta\n\nVerifica tu contraseña e intenta nuevamente.';
          break;
        case 'auth/too-many-requests':
          message = '⏰ Demasiados intentos fallidos\n\nEspera unos minutos e intenta nuevamente.';
          break;
        case 'auth/network-request-failed':
          message = '🌐 Error de conexión\n\nVerifica tu conexión a internet.';
          break;
        default:
          message = `❌ Error: ${error.message}`;
      }
      
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Función de modo desarrollo (acceso rápido sin Firebase)
  const handleDevMode = () => {
    const devUser = {
      uid: 'dev-user-123',
      email: 'desarrollo@leyia.com',
      displayName: 'Usuario Desarrollo',
      photoURL: null,
      isSimpleAuth: true,
      isElectronUser: isElectron,
      isDevelopmentMode: true,
      createdAt: new Date().toISOString()
    };

    setUser(devUser);
    setMostrarSelectorOrg(true);
  };

  // Función de autenticación con Google
  const handleGoogleSignIn = async () => {
    setIsLoading(true);

    try {
      // Crear proveedor de Google
      const provider = new GoogleAuthProvider();
      
      // Configurar parámetros personalizados
      provider.setCustomParameters({
        prompt: 'select_account',
        hd: '',
        include_granted_scopes: 'true'
      });
      
      // Agregar scopes necesarios
      provider.addScope('email');
      provider.addScope('profile');
      provider.addScope('openid');
      
      // Intentar autenticación con popup
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

    } catch (error) {
      
      let message = 'Error al iniciar sesión con Google';
      
      switch (error.code) {
        case 'auth/cancelled-popup-request':
        case 'auth/popup-closed-by-user':
          // Usuario cerró el popup, no mostrar error
          return;
        case 'auth/popup-blocked':
          message = '🚫 Popup bloqueado\n\nPor favor permite popups para este sitio y recarga la página.';
          break;
        case 'auth/unauthorized-domain':
          message = '🚫 Dominio no autorizado\n\nContacta al administrador del sistema.';
          break;
        case 'auth/operation-not-allowed':
          message = '🚫 Autenticación con Google deshabilitada\n\nContacta al administrador del sistema.';
          break;
        case 'auth/network-request-failed':
          message = '🌐 Error de conexión\n\nVerifica tu conexión a internet.';
          break;
        case 'auth/too-many-requests':
          message = '⏰ Demasiados intentos fallidos\n\nEspera unos minutos e intenta nuevamente.';
          break;
        case 'auth/account-exists-with-different-credential':
          message = '👤 Esta cuenta ya existe con diferentes credenciales\n\nIntenta usar el método de autenticación original.';
          break;
        default:
          message = `❌ Error: ${error.message}`;
      }
      
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar volver desde selector de organización
  const handleVolverDesdeOrganizacion = async () => {
    try {
      await auth.signOut();
      localStorage.removeItem('organizacionActual');
      setMostrarSelectorOrg(false);
      setUser(null);
      setStep('welcome');
    } catch (error) {
      // Aunque falle el signOut, limpiar el estado local
      setMostrarSelectorOrg(false);
      setUser(null);
      setStep('welcome');
    }
  };
  // Manejar selección de organización
  const handleOrganizacionSeleccionada = (orgData) => {
    setMostrarSelectorOrg(false);
    
    if (user && orgData) {
      const loginData = {
        user: user,
        organizacion: orgData,
        timestamp: new Date().toISOString()
      };
      
      // Guardar organización en localStorage para persistencia
      localStorage.setItem('organizacionActual', JSON.stringify(orgData));
      
      // IMPORTANTE: También guardar el usuario para el contexto
      localStorage.setItem('usuarioActual', JSON.stringify(user));
      
      console.log('✅ Organización seleccionada y guardada:', orgData);
      console.log('✅ Usuario guardado:', user);
      
      if (onLoginSuccess) {
        onLoginSuccess(loginData);
      }
    }
  };

  // Mostrar loading inicial mientras se resuelve el estado de autenticación
  if (isLoading) {
    return (
      <ParallaxSimple>
        <div style={{
          width: '380px',
          padding: '40px',
          background: 'var(--panel-bg)',
          border: '1px solid rgba(0, 212, 255, 0.2)',
          borderRadius: '25px',
          boxShadow: '0 0 30px rgba(0,0,0,0.5), 0 0 15px rgba(0, 212, 255, 0.1)',
          textAlign: 'center',
          backdropFilter: 'blur(15px)',
          '--panel-bg': 'rgba(5, 15, 25, 0.9)',
          '--star-blue': '#00d4ff',
          '--deep-space': '#050a0f',
          '--icon-white': '#ffffff',
          '--glow-white': '0 0 10px rgba(255, 255, 255, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginBottom: '10px'
          }}>
            <img 
              src="./leyia.png" 
              alt="LeyIA" 
              style={{ 
                width: '70px', 
                height: '70px', 
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 8px var(--star-blue))'
              }} 
            />
          </div>
          <h1 style={{ 
            fontSize: '2.8rem',
            fontWeight: '700',
            letterSpacing: '10px',
            margin: '0 0 35px 0',
            textShadow: '0 0 15px var(--star-blue)',
            color: 'white',
            fontFamily: "'Star Jedi', 'SF Distant Galaxy', 'Orbitron', 'Exo 2', monospace"
          }}>
            LEYIA
          </h1>
          
          {/* Indicador de carga estilo terminal */}
          <div style={{
            width: '60px',
            height: '60px',
            border: '3px solid rgba(0, 212, 255, 0.3)',
            borderTop: '3px solid var(--star-blue)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '20px auto',
            boxShadow: '0 0 20px rgba(0, 212, 255, 0.5)'
          }}></div>
          
          <p style={{ 
            color: 'var(--star-blue)', 
            fontSize: '0.7rem',
            fontFamily: "'Exo 2', sans-serif",
            letterSpacing: '2px',
            textTransform: 'uppercase',
            opacity: '0.8',
            margin: '20px 0 0 0'
          }}>
            Verificando estado de sesión...
          </p>

          {/* Pie de Sistema */}
          <div style={{
            marginTop: '25px',
            fontSize: '0.6rem',
            color: 'var(--star-blue)',
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
            opacity: '0.5',
            fontFamily: "'Exo 2', sans-serif"
          }}>
            <span>ESTADO: CONECTANDO</span>
            <span>SYS/INIT</span>
          </div>
        </div>
      </ParallaxSimple>
    );
  }

  // Mostrar debugger de Firestore
  if (mostrarDebugger) {
    return (
      <FirestoreDebugger 
        onClose={() => setMostrarDebugger(false)}
      />
    );
  }

  // Mostrar diagnóstico de login
  if (mostrarLoginDiagnostic) {
    return (
      <LoginDiagnostic 
        onClose={() => setMostrarLoginDiagnostic(false)}
        onForceLogin={onLoginSuccess}
      />
    );
  }

  // Mostrar selector de organización
  if (mostrarSelectorOrg && user) {
    return (
      <OrganizacionSelector 
        user={user}
        onOrganizacionSeleccionada={handleOrganizacionSeleccionada}
        onVolver={handleVolverDesdeOrganizacion}
      />
    );
  }

  // Pantalla de autenticación
  if (step === 'auth') {
    return (
      <ParallaxSimple>
        <div style={{
          width: '380px',
          padding: '40px',
          background: 'var(--panel-bg)',
          border: '1px solid rgba(0, 212, 255, 0.2)',
          borderRadius: '25px',
          boxShadow: '0 0 30px rgba(0,0,0,0.5), 0 0 15px rgba(0, 212, 255, 0.1)',
          textAlign: 'center',
          backdropFilter: 'blur(15px)',
          '--panel-bg': 'rgba(5, 15, 25, 0.9)',
          '--star-blue': '#00d4ff',
          '--deep-space': '#050a0f',
          '--icon-white': '#ffffff',
          '--glow-white': '0 0 10px rgba(255, 255, 255, 0.4)'
        }}>
          {/* Header */}
          <div style={{ marginBottom: '35px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              marginBottom: '10px'
            }}>
              <img 
                src="./leyia.png" 
                alt="LeyIA" 
                style={{ 
                  width: '70px', 
                  height: '70px', 
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 0 8px var(--star-blue))'
                }} 
              />
            </div>
            <h2 style={{ 
              fontSize: '2.8rem',
              fontWeight: '700',
              letterSpacing: '10px',
              margin: '0',
              textShadow: '0 0 15px var(--star-blue)',
              color: 'white',
              fontFamily: "'Star Jedi', 'SF Distant Galaxy', 'Orbitron', 'Exo 2', monospace"
            }}>
              LEYIA
            </h2>
            <div style={{ 
              fontSize: '0.7rem',
              letterSpacing: '4px',
              color: 'var(--star-blue)',
              marginBottom: '35px',
              opacity: '0.8',
              fontFamily: "'Exo 2', sans-serif"
            }}>
              {authMode === 'signin' ? 'ACCESO AL SISTEMA' : 'REGISTRO DE USUARIO'}
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleFirebaseAuth} style={{ marginBottom: '30px' }}>
            {authMode === 'signup' && (
              <div style={{ marginBottom: '15px' }}>
                <input
                  type="text"
                  placeholder="NOMBRE COMPLETO"
                  value={authForm.displayName}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, displayName: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid var(--star-blue)',
                    color: 'white',
                    fontFamily: "'Exo 2', sans-serif",
                    boxSizing: 'border-box',
                    borderRadius: '3px',
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: '15px' }}>
              <input
                type="email"
                placeholder="CORREO ELECTRÓNICO"
                value={authForm.email}
                onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid var(--star-blue)',
                  color: 'white',
                  fontFamily: "'Exo 2', sans-serif",
                  boxSizing: 'border-box',
                  borderRadius: '3px',
                  fontSize: '14px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <input
                type="password"
                placeholder="CONTRASEÑA (MÍN. 6 CARACTERES)"
                value={authForm.password}
                onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid var(--star-blue)',
                  color: 'white',
                  fontFamily: "'Exo 2', sans-serif",
                  boxSizing: 'border-box',
                  borderRadius: '3px',
                  fontSize: '14px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '8px',
                border: 'none',
                fontFamily: "'Exo 2', sans-serif",
                fontWeight: 'bold',
                textTransform: 'uppercase',
                fontSize: '0.8rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: '0.3s',
                background: 'var(--star-blue)',
                color: 'var(--deep-space)',
                boxShadow: '0 0 10px rgba(0, 212, 255, 0.5)',
                opacity: isLoading ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.target.style.filter = 'brightness(1.2)';
                  e.target.style.letterSpacing = '3px';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.target.style.filter = 'brightness(1)';
                  e.target.style.letterSpacing = '0px';
                }
              }}
            >
              {isLoading ? 'PROCESANDO...' : (authMode === 'signin' ? 'INICIAR TRANSMISIÓN' : 'CREAR USUARIO')}
            </button>
          </form>

          {/* Botón de Google */}
          <button 
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px',
              marginBottom: '20px',
              borderRadius: '8px',
              border: 'none',
              fontFamily: "'Exo 2', sans-serif",
              fontWeight: 'bold',
              textTransform: 'uppercase',
              fontSize: '0.8rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: '0.3s',
              background: 'white',
              color: '#111',
              opacity: isLoading ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.target.style.filter = 'brightness(1.2)';
                e.target.style.letterSpacing = '2px';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.target.style.filter = 'brightness(1)';
                e.target.style.letterSpacing = '0px';
              }
            }}
          >
            <div>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <span>Continuar con Google</span>
          </button>

          {/* Toggle entre signin/signup */}
          <div style={{ 
            marginBottom: '20px',
            padding: '10px',
            background: 'rgba(0, 212, 255, 0.1)',
            borderLeft: '4px solid var(--star-blue)',
            borderRadius: '3px'
          }}>
            <button
              onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--star-blue)',
                fontSize: '0.65rem',
                fontFamily: "'Exo 2', sans-serif",
                cursor: 'pointer',
                textDecoration: 'underline',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              {authMode === 'signin' ? '¿No tienes cuenta? Crear una' : '¿Ya tienes cuenta? Iniciar sesión'}
            </button>
          </div>

          {/* Botones de navegación */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button
              onClick={() => setStep('welcome')}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid #333',
                fontFamily: "'Exo 2', sans-serif",
                fontWeight: 'bold',
                textTransform: 'uppercase',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: '0.3s',
                background: 'transparent',
                color: '#777'
              }}
              onMouseEnter={(e) => {
                e.target.style.filter = 'brightness(1.2)';
                e.target.style.letterSpacing = '2px';
              }}
              onMouseLeave={(e) => {
                e.target.style.filter = 'brightness(1)';
                e.target.style.letterSpacing = '0px';
              }}
            >
              ← VOLVER
            </button>
            
            <button
              onClick={handleDevMode}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid #333',
                fontFamily: "'Exo 2', sans-serif",
                fontWeight: 'bold',
                textTransform: 'uppercase',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: '0.3s',
                background: 'transparent',
                color: '#777'
              }}
              onMouseEnter={(e) => {
                e.target.style.filter = 'brightness(1.2)';
                e.target.style.letterSpacing = '2px';
              }}
              onMouseLeave={(e) => {
                e.target.style.filter = 'brightness(1)';
                e.target.style.letterSpacing = '0px';
              }}
            >
              🛠️ MODO DEV
            </button>
          </div>

          {/* Pie de Sistema */}
          <div style={{
            marginTop: '25px',
            fontSize: '0.6rem',
            color: 'var(--star-blue)',
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
            opacity: '0.5',
            fontFamily: "'Exo 2', sans-serif"
          }}>
            <span>🔥 FIREBASE ACTIVO</span>
            <span>{isElectron ? '🖥️ ELECTRON' : '🌐 WEB'}</span>
          </div>
        </div>
      </ParallaxSimple>
    );
  }

  // Pantalla de bienvenida
  return (
    <ParallaxSimple>
      <div style={{
        width: '380px',
        padding: '40px',
        background: 'var(--panel-bg)',
        border: '1px solid rgba(0, 212, 255, 0.2)',
        borderRadius: '25px',
        boxShadow: '0 0 30px rgba(0,0,0,0.5), 0 0 15px rgba(0, 212, 255, 0.1)',
        textAlign: 'center',
        backdropFilter: 'blur(15px)',
        '--panel-bg': 'rgba(5, 15, 25, 0.9)',
        '--star-blue': '#00d4ff',
        '--deep-space': '#050a0f',
        '--icon-white': '#ffffff',
        '--glow-white': '0 0 10px rgba(255, 255, 255, 0.4)'
      }}>
        {/* Logo y título */}
        <div style={{ marginBottom: '35px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginBottom: '10px'
          }}>
            <img 
              src="./leyia.png" 
              alt="LeyIA" 
              style={{ 
                width: '70px', 
                height: '70px', 
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 8px var(--star-blue))'
              }} 
            />
          </div>
          <h1 style={{ 
            fontSize: '2.8rem',
            fontWeight: '700',
            letterSpacing: '10px',
            margin: '0',
            textShadow: '0 0 15px var(--star-blue)',
            color: 'white',
            fontFamily: "'Star Jedi', 'SF Distant Galaxy', 'Orbitron', 'Exo 2', monospace"
          }}>
            LEYIA
          </h1>
          <div style={{ 
            fontSize: '0.7rem',
            letterSpacing: '4px',
            color: 'var(--star-blue)',
            marginBottom: '35px',
            opacity: '0.8',
            fontFamily: "'Exo 2', sans-serif"
          }}>
            INTELIGENCIA JURÍDICA
          </div>
        </div>

        {/* Cuadrícula de Módulos */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '15px',
          marginBottom: '30px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '25px 10px',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(0, 212, 255, 0.1)';
            e.target.style.borderColor = 'var(--star-blue)';
            e.target.style.transform = 'scale(1.03)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.03)';
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            e.target.style.transform = 'scale(1)';
          }}>
            <div style={{
              fontSize: '32px',
              marginBottom: '12px',
              filter: 'brightness(0) invert(1) drop-shadow(0 0 8px rgba(255, 255, 255, 0.4))',
              textAlign: 'center',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '32px'
            }}>
              ⚖️
            </div>
            <span style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: 'white',
              fontFamily: "'Exo 2', sans-serif",
              textAlign: 'center'
            }}>
              Gestión
            </span>
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '25px 10px',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(0, 212, 255, 0.1)';
            e.target.style.borderColor = 'var(--star-blue)';
            e.target.style.transform = 'scale(1.03)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.03)';
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            e.target.style.transform = 'scale(1)';
          }}>
            <div style={{
              fontSize: '32px',
              marginBottom: '12px',
              filter: 'brightness(0) invert(1) drop-shadow(0 0 8px rgba(255, 255, 255, 0.4))',
              textAlign: 'center',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '32px'
            }}>
              🤖
            </div>
            <span style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: 'white',
              fontFamily: "'Exo 2', sans-serif",
              textAlign: 'center'
            }}>
              IA Avanzada
            </span>
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '25px 10px',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(0, 212, 255, 0.1)';
            e.target.style.borderColor = 'var(--star-blue)';
            e.target.style.transform = 'scale(1.03)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.03)';
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            e.target.style.transform = 'scale(1)';
          }}>
            <div style={{
              fontSize: '32px',
              marginBottom: '12px',
              filter: 'brightness(0) invert(1) drop-shadow(0 0 8px rgba(255, 255, 255, 0.4))',
              textAlign: 'center',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '32px'
            }}>
              📚
            </div>
            <span style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: 'white',
              fontFamily: "'Exo 2', sans-serif",
              textAlign: 'center'
            }}>
              Jurisprudencia
            </span>
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '25px 10px',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(0, 212, 255, 0.1)';
            e.target.style.borderColor = 'var(--star-blue)';
            e.target.style.transform = 'scale(1.03)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.03)';
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            e.target.style.transform = 'scale(1)';
          }}>
            <div style={{
              fontSize: '32px',
              marginBottom: '12px',
              filter: 'brightness(0) invert(1) drop-shadow(0 0 8px rgba(255, 255, 255, 0.4))',
              textAlign: 'center',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '32px'
            }}>
              🎙️
            </div>
            <span style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: 'white',
              fontFamily: "'Exo 2', sans-serif",
              textAlign: 'center'
            }}>
              Transcripción
            </span>
          </div>
        </div>

        {/* Botones de Acceso */}
        <button 
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '14px',
            marginTop: '12px',
            borderRadius: '8px',
            border: 'none',
            fontFamily: "'Exo 2', sans-serif",
            fontWeight: 'bold',
            textTransform: 'uppercase',
            fontSize: '0.8rem',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: '0.3s',
            background: 'white',
            color: '#111',
            opacity: isLoading ? 0.7 : 1
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.target.style.filter = 'brightness(1.2)';
              e.target.style.letterSpacing = '2px';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.target.style.filter = 'brightness(1)';
              e.target.style.letterSpacing = '0px';
            }
          }}
        >
          <div>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </div>
          <span>{isLoading ? 'Iniciando sesión...' : 'Continuar con Google'}</span>
        </button>

        <button 
          onClick={() => setStep('auth')}
          style={{
            width: '100%',
            padding: '14px',
            marginTop: '12px',
            borderRadius: '8px',
            border: 'none',
            fontFamily: "'Exo 2', sans-serif",
            fontWeight: 'bold',
            textTransform: 'uppercase',
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: '0.3s',
            background: '#5a4ad1',
            color: 'white',
            boxShadow: '0 4px 15px rgba(90, 74, 209, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.target.style.filter = 'brightness(1.2)';
            e.target.style.letterSpacing = '2px';
          }}
          onMouseLeave={(e) => {
            e.target.style.filter = 'brightness(1)';
            e.target.style.letterSpacing = '0px';
          }}
        >
          <span style={{ filter: 'brightness(0) invert(1)' }}>📧</span>
          <span>Acceso con Email</span>
        </button>

        <button 
          onClick={handleDevMode}
          style={{
            width: '100%',
            padding: '14px',
            marginTop: '20px',
            borderRadius: '8px',
            border: '1px solid #333',
            fontFamily: "'Exo 2', sans-serif",
            fontWeight: 'bold',
            textTransform: 'uppercase',
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: '0.3s',
            background: 'transparent',
            color: '#777'
          }}
          onMouseEnter={(e) => {
            e.target.style.filter = 'brightness(1.2)';
            e.target.style.letterSpacing = '2px';
          }}
          onMouseLeave={(e) => {
            e.target.style.filter = 'brightness(1)';
            e.target.style.letterSpacing = '0px';
          }}
        >
          <span style={{ filter: 'brightness(0) invert(1)' }}>🛠️</span>
          <span>Terminal de Desarrollo</span>
        </button>

        <button 
          onClick={() => setMostrarLoginDiagnostic(true)}
          style={{
            width: '100%',
            padding: '14px',
            marginTop: '10px',
            borderRadius: '8px',
            border: '1px solid #ff6b6b',
            fontFamily: "'Exo 2', sans-serif",
            fontWeight: 'bold',
            textTransform: 'uppercase',
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: '0.3s',
            background: 'transparent',
            color: '#ff6b6b'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 107, 107, 0.1)';
            e.target.style.letterSpacing = '2px';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.letterSpacing = '0px';
          }}
        >
          <span>🔍</span>
          <span>Diagnóstico de Login</span>
        </button>

        {/* Pie de Sistema */}
        <div style={{
          marginTop: '25px',
          fontSize: '0.6rem',
          color: 'var(--star-blue)',
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          opacity: '0.5',
          fontFamily: "'Exo 2', sans-serif"
        }}>
          <span>ESTADO: LÍNEA OK</span>
          <span>SEC/7-G</span>
        </div>
      </div>
    </ParallaxSimple>
  );
}

export default SimpleLogin;