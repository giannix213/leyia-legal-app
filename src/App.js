import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import './components/Sidebar.css';
import './components/CasosGalactico.css';
import Casos from './components/Casos';
import CajaChica from './components/CajaChica';
import CalendarioContainer from './components/containers/CalendarioContainer';
import Contactos from './components/Contactos';
import ChatIAMinimal from './components/ChatIAMinimal';
import Jurisprudencia from './components/Jurisprudencia';
import TranscripcionDocumentos from './components/TranscripcionDocumentos';
import PerfilUsuario from './components/PerfilUsuario';
import EstudioJuridicoMinimal from './components/EstudioJuridicoMinimal';
import SimpleLogin from './components/SimpleLogin';
import EstadisticasSimple from './components/EstadisticasSimple';
import Equipo from './components/Equipo';
import WindowDiagnostic from './components/WindowDiagnostic';
import QuickNavigator from './components/QuickNavigator';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import { OrganizacionProvider, useOrganizacionContext } from './contexts/OrganizacionContext';
import { useAuthPersistence } from './hooks/useAuthPersistence';

import { db, auth } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const isElectron = !!window?.process?.versions?.electron;

function AppContent() {
  const { organizacionActual, establecerOrganizacion, establecerUsuario, limpiarSesion } = useOrganizacionContext();
  
  const [currentView, setCurrentView] = useState(null);
  const [expedienteSeleccionado, setExpedienteSeleccionado] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [sidebarCompressed, setSidebarCompressed] = useState(() => {
    const saved = localStorage.getItem('sidebarCompressed');
    return saved ? JSON.parse(saved) : false;
  });
  const [collapsedSections, setCollapsedSections] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsedSections');
    return saved ? JSON.parse(saved) : {
      navegacion: false,
      ia: true,
      admin: true,
      externos: true,
      dev: true
    };
  });
  // Estado para expansión temporal en vista comprimida
  const [tempExpandedSection, setTempExpandedSection] = useState(null);
  const [notificacionesPendientes, setNotificacionesPendientes] = useState(0);
  const [mostrarPerfil, setMostrarPerfil] = useState(false);
  const [perfilUsuario, setPerfilUsuario] = useState(null);
  
  // Hook de persistencia de autenticación mejorado
  const { 
    user, 
    organization, 
    isLoading, 
    saveSession, 
    clearSession, 
    hasValidSession,
    setOrganization: setOrganizationPersistent
  } = useAuthPersistence();
  
  // Estados derivados de la autenticación
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Estado para la búsqueda de casos
  const [busquedaCasos, setBusquedaCasos] = useState('');
  const [vistaActivaCasos, setVistaActivaCasos] = useState('activos');
  const [mostrarModalNuevoCaso, setMostrarModalNuevoCaso] = useState(false);
  
  // Estado para emergencia de autenticación
  const [mostrarEmergencia, setMostrarEmergencia] = useState(false);
  
  // Estado para el importador de Firestore
  const [mostrarImportador, setMostrarImportador] = useState(false);
  
  // Estado para el debug panel (temporal)
  const [mostrarDebugPanel, setMostrarDebugPanel] = useState(false);
  
  // Estados para nuevos componentes
  const [mostrarWindowDiagnostic, setMostrarWindowDiagnostic] = useState(false);
  const [mostrarQuickNavigator, setMostrarQuickNavigator] = useState(false);
  const [mostrarKeyboardShortcuts, setMostrarKeyboardShortcuts] = useState(false);

  // Función para toggle de compresión del sidebar
  const toggleSidebarCompression = () => {
    const newState = !sidebarCompressed;
    setSidebarCompressed(newState);
    localStorage.setItem('sidebarCompressed', JSON.stringify(newState));
  };

  // Función para toggle de secciones colapsables
  const toggleSection = (sectionId) => {
    setCollapsedSections(prev => {
      const newState = {
        ...prev,
        [sectionId]: !prev[sectionId]
      };
      localStorage.setItem('sidebarCollapsedSections', JSON.stringify(newState));
      return newState;
    });
  };

  // Efecto para inicializar el estado de las secciones
  useEffect(() => {
    if (!collapsedSections.hasOwnProperty('navegacion')) {
      setCollapsedSections(prev => ({
        ...prev,
        navegacion: false
      }));
    }
  }, []);

  // Sincronizar estado de autenticación con el hook de persistencia
  useEffect(() => {
    if (user && organization) {
      setIsAuthenticated(true);
      if (!currentView) {
        setCurrentView('casos');
      }
      
      // Establecer en el contexto de organización
      establecerUsuario(user);
      establecerOrganizacion(organization);
      
      console.log('✅ Usuario autenticado con sesión persistente:', user.email);
    } else if (!isLoading) {
      setIsAuthenticated(false);
      if (currentView !== 'login') {
        setCurrentView('login');
      }
    }
  }, [user, organization, isLoading, currentView, establecerUsuario, establecerOrganizacion]);

  // Sincronizar organización del contexto con estado local
  useEffect(() => {
  if (organizacionActual) {
    // Solo actualizar si realmente son diferentes para evitar bucles
    if (!organization || organization.organizationId !== organizacionActual.id) {
      setOrganizationPersistent({
        organizationId: organizacionActual.id,
        organizationName: organizacionActual.nombre,
        organizationType: organizacionActual.tipo
      });
    }
  }
}, [organizacionActual, organization, setOrganizationPersistent]);

  // Autenticación simplificada para desarrollo
  useEffect(() => {
    console.log('🔍 Iniciando diagnóstico de autenticación...');
    
    const devMode = localStorage.getItem('devMode');
    const devUser = localStorage.getItem('devUser');
    
    console.log('📊 Estado inicial:', { devMode, devUser: !!devUser, isElectron });
    
    if (devMode === 'true' && devUser) {
      console.log('🛠️ Modo desarrollo detectado');
      try {
        const fakeUser = JSON.parse(devUser);
        const fakeOrganization = {
          organizationId: 'dev-org-123',
          organizationName: 'ESTUDIO JURÍDICO DE DESARROLLO',
          organizationType: 'law-firm'
        };
        
        console.log('✅ Configurando usuario de desarrollo:', fakeUser.email);
        
        // Usar el sistema de persistencia para modo dev
        saveSession(fakeUser, fakeOrganization);
        setOrganizationPersistent(fakeOrganization);
        setCurrentView('casos');
        
        // Sincronizar con el contexto
        establecerOrganizacion(fakeOrganization);
        establecerUsuario(fakeUser);
        
        setPerfilUsuario({
          nombre: fakeUser.displayName,
          email: fakeUser.email,
          fotoPerfil: null,
          organizacion: fakeOrganization.organizationName,
          tipo: fakeOrganization.organizationType
        });
        
        console.log('✅ Usuario de desarrollo configurado exitosamente');
        return;
      } catch (error) {
        console.error('❌ Error en modo desarrollo:', error);
        localStorage.removeItem('devMode');
        localStorage.removeItem('devUser');
      }
    }
    
    if (isElectron) {
      console.log('🖥️ Electron detectado - Configurando usuario forzado');
      const fakeUser = {
        uid: 'electron-forced-user',
        email: 'electron@forced.com',
        displayName: 'Usuario Forzado Electron'
      };
      
      const fakeOrganization = {
        organizationId: 'electron-org',
        organizationName: 'ESTUDIO FORZADO ELECTRON',
        organizationType: 'law-firm'
      };
      
      // Usar el sistema de persistencia para Electron
      saveSession(fakeUser, fakeOrganization);
      setOrganizationPersistent(fakeOrganization);
      setCurrentView('casos');
      
      setPerfilUsuario({
        nombre: fakeUser.displayName,
        email: fakeUser.email,
        fotoPerfil: null,
        organizacion: fakeOrganization.organizationName,
        tipo: fakeOrganization.organizationType
      });
      
      console.log('✅ Usuario Electron configurado exitosamente');
      return;
    }
    
    console.log('🌐 Modo web - Firebase Auth manejado por useAuthPersistence');
    // El hook useAuthPersistence ya maneja Firebase Auth, no necesitamos duplicar la lógica
  }, [saveSession, setOrganizationPersistent]);

  // Listener para navegación desde el calendario
  useEffect(() => {
    const handleNavigateToView = (event) => {
      const { view } = event.detail;
      console.log('🧭 Navegando desde calendario a vista:', view);
      setCurrentView(view);
      setSidebarVisible(true); // Mostrar sidebar al navegar
    };

    // Listener para atajos de teclado globales
    const handleKeyDown = (event) => {
      // Ctrl+K para navegación rápida
      if (event.ctrlKey && event.key === 'k') {
        event.preventDefault();
        setMostrarQuickNavigator(true);
      }
      
      // Ctrl+Shift+D para diagnóstico de ventanas
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        setMostrarWindowDiagnostic(true);
      }
      
      // Ctrl+? o F1 para ayuda de atajos
      if ((event.ctrlKey && event.key === '/') || event.key === 'F1') {
        event.preventDefault();
        setMostrarKeyboardShortcuts(true);
      }
      
      // Ctrl+B para toggle sidebar
      if (event.ctrlKey && event.key === 'b') {
        event.preventDefault();
        setSidebarVisible(!sidebarVisible);
      }
      
      // Ctrl+Shift+B para toggle compresión sidebar
      if (event.ctrlKey && event.shiftKey && event.key === 'B') {
        event.preventDefault();
        toggleSidebarCompression();
      }
      
      // Escape para cerrar modales
      if (event.key === 'Escape') {
        setMostrarQuickNavigator(false);
        setMostrarWindowDiagnostic(false);
        setMostrarKeyboardShortcuts(false);
      }
    };

    window.addEventListener('navigateToView', handleNavigateToView);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('logout', handleLogout);
    
    return () => {
      window.removeEventListener('navigateToView', handleNavigateToView);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('logout', handleLogout);
    };
  }, []);

  // Handlers memoizados para EstudioJuridico para evitar re-renders
  const handleEstudioVolver = useCallback(() => {
    setCurrentView('casos');
    setSidebarVisible(true);
  }, []);

  const handleEstudioAbrirExpediente = useCallback((expediente) => {
    setExpedienteSeleccionado(expediente);
    setCurrentView('casos');
    setSidebarVisible(true);
  }, []);

  const handleEstudioIrATramites = useCallback(() => {
    // Navegar a la vista de trámites/tareas
    setCurrentView('casos'); // Por ahora redirigir a casos
    setSidebarVisible(true);
  }, []);

  const handleLoginSuccess = (loginData) => {
    console.log('🔐 handleLoginSuccess llamado con:', loginData);
    console.log('🔍 Analizando datos de login:', {
      hasUser: !!loginData.user,
      hasOrganization: !!loginData.organization,
      hasOrganizacion: !!loginData.organizacion,
      organizationKeys: loginData.organization ? Object.keys(loginData.organization) : [],
      organizacionKeys: loginData.organizacion ? Object.keys(loginData.organizacion) : []
    });
    
    if (loginData.user && (loginData.user.uid === 'dev-user-123' || loginData.user.uid === 'temp-user-123')) {
      const fakeUser = loginData.user;
      const fakeOrganization = {
        organizationId: 'dev-org-123',
        organizationName: 'ESTUDIO JURÍDICO LEYIA',
        organizationType: 'estudio'
      };
      
      // Usar el sistema de persistencia para modo dev
      saveSession(fakeUser, fakeOrganization);
      setOrganizationPersistent(fakeOrganization);
      setCurrentView('casos');
      
      // Sincronizar con el contexto
      establecerOrganizacion(fakeOrganization);
      establecerUsuario(fakeUser);
      
      setPerfilUsuario({
        nombre: fakeUser.displayName,
        email: fakeUser.email,
        fotoPerfil: null,
        organizacion: fakeOrganization.organizationName,
        tipo: fakeOrganization.organizationType
      });
      
      localStorage.setItem('devMode', 'true');
      localStorage.setItem('devUser', JSON.stringify(fakeUser));
      
      return;
    }
    
    // Aceptar tanto 'organization' (inglés) como 'organizacion' (español)
    const orgData = loginData.organization || loginData.organizacion;
    
    console.log('🏢 Datos de organización extraídos:', {
      orgData,
      fromOrganization: !!loginData.organization,
      fromOrganizacion: !!loginData.organizacion,
      hasOrgData: !!orgData
    });
    
    if (loginData.user && orgData) {
      const organizationData = {
        id: orgData.organizationId || orgData.id,
        name: orgData.organizationName || orgData.nombre || orgData.name,
        type: orgData.organizationType || orgData.tipo || orgData.type || 'estudio'
      };
      
      console.log('✅ Organización configurada:', organizationData);
      
      // Usar el sistema de persistencia mejorado
      saveSession(loginData.user, organizationData);
      setOrganizationPersistent(organizationData);
      setCurrentView('casos');
      
      // Sincronizar con el contexto
      establecerOrganizacion(organizationData);
      establecerUsuario(loginData.user);
      
      setPerfilUsuario({
        nombre: loginData.user.displayName || loginData.user.email,
        email: loginData.user.email,
        fotoPerfil: loginData.user.photoURL,
        organizacion: organizationData.name,
        tipo: organizationData.type
      });
      
      console.log('🎉 Sesión guardada con persistencia extendida (30 días)');
      return;
    }
    
    console.error('❌ Login sin organización válida:', loginData);
    
    // Limpiar cualquier modo de desarrollo que pueda estar interfiriendo
    clearSession();
    localStorage.removeItem('devMode');
    localStorage.removeItem('devUser');
    localStorage.removeItem('organizacionActual');
    localStorage.removeItem('usuarioActual');
    
    // Forzar recarga para limpiar estado
    console.log('🔄 Forzando recarga para limpiar estado...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleLogout = async () => {
    try {
      if (auth && !isElectron) {
        await signOut(auth);
      }
      
      // Usar el sistema de persistencia para limpiar la sesión
      clearSession();
      setPerfilUsuario(null);
      setCurrentView('login');
      
      // Limpiar contexto
      limpiarSesion();
      
      // Limpieza selectiva de localStorage (NO usar localStorage.clear())
      const keysToRemove = [
        'devMode', 
        'devUser',
        'organizacionActual',
        'usuarioActual',
        'textosExpedientes'
        // Mantener configuraciones de UI como sidebarCompressed y sidebarCollapsedSections
      ];
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      
      console.log('👋 Sesión cerrada y limpiada correctamente');
      
    } catch (error) {
      // En caso de error, forzar limpieza
      clearSession();
      setPerfilUsuario(null);
      setCurrentView('login');
      
      // Limpiar contexto
      limpiarSesion();
    }
  };

  // Función para forzar limpieza completa (útil para debugging)
  const forzarLimpiezaCompleta = () => {
    console.log('🧹 FORZANDO LIMPIEZA COMPLETA...');
    
    // Cerrar sesión de Firebase si existe
    if (auth.currentUser) {
      signOut(auth).catch(console.error);
    }
    
    // Limpiar TODO el localStorage
    localStorage.clear();
    
    // Limpiar estado de la aplicación usando el sistema de persistencia
    clearSession();
    setPerfilUsuario(null);
    setCurrentView(null);
    
    // Limpiar contexto
    limpiarSesion();
    
    console.log('✅ Limpieza completa realizada - Recargando...');
    
    // Recargar página
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'diamond-fragmentation':
        return <div>Funcionalidad en desarrollo...</div>;
      case 'image-fragmentation':
        return <div>Funcionalidad en desarrollo...</div>;
      case 'parallax-superposition':
        return <div>Funcionalidad en desarrollo...</div>;
      case 'parallax-demo':
        return <div>Funcionalidad en desarrollo...</div>;
      case 'estudio':
        return <EstudioJuridicoMinimal 
          onVolver={handleEstudioVolver}
          onAbrirExpediente={handleEstudioAbrirExpediente}
          onIrATramites={handleEstudioIrATramites}
        />;
      case 'calendario':
        return <CalendarioContainer />;
      case 'casos':
        return <Casos 
          onIrAVistaGeneral={() => {
            setCurrentView('estudio-vista-general');
            setSidebarVisible(false);
          }}
          expedienteSeleccionado={expedienteSeleccionado}
          onExpedienteSeleccionado={setExpedienteSeleccionado}
          busqueda={busquedaCasos}
          onBusquedaChange={setBusquedaCasos}
          vistaActiva={vistaActivaCasos}
          onVistaActivaChange={setVistaActivaCasos}
          showModal={mostrarModalNuevoCaso}
          onShowModalChange={setMostrarModalNuevoCaso}
        />;
      case 'contactos':
        return <Contactos />;
      case 'equipo':
        return <Equipo />;
      case 'jurisprudencia':
        return <Jurisprudencia />;
      case 'transcripcion':
        return <TranscripcionDocumentos />;
      case 'redactor':
        return <TranscripcionDocumentos />;
      case 'caja':
        return <CajaChica />;
      case 'estadisticas':
        return <EstadisticasSimple />;
      default:
        return <Casos 
          onIrAVistaGeneral={() => {
            setCurrentView('estudio-vista-general');
            setSidebarVisible(false);
          }}
          expedienteSeleccionado={expedienteSeleccionado}
          onExpedienteSeleccionado={setExpedienteSeleccionado}
          busqueda={busquedaCasos}
          onBusquedaChange={setBusquedaCasos}
          vistaActiva={vistaActivaCasos}
          onVistaActivaChange={setVistaActivaCasos}
          showModal={mostrarModalNuevoCaso}
          onShowModalChange={setMostrarModalNuevoCaso}
        />;
    }
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <img src="./leyia.png" alt="Logo" className="loading-logo" />
          <div className="loading-spinner"></div>
          <p>Conectando con Firebase...</p>
        </div>
      </div>
    );
  }

  // Mostrar login solo si NO está autenticado Y NO está en Electron Y NO está en modo dev
  if (!isAuthenticated && !isElectron && localStorage.getItem('devMode') !== 'true') {
    return <SimpleLogin onLoginSuccess={handleLoginSuccess} />;
  }

  // Si está en Electron pero no tiene usuario, mostrar loading
  if (isElectron && !user) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <img src="./leyia.png" alt="Logo" className="loading-logo" />
          <div className="loading-spinner"></div>
          <p>Iniciando Electron...</p>
        </div>
      </div>
    );
  }

  // Si no tiene organización pero tiene usuario, esperar a que el contexto cargue la organización guardada
  if (user && !organization) {
    // Verificar si hay una organización guardada en localStorage antes de crear una por defecto
    const orgGuardada = localStorage.getItem('organizacionActual');
    
    if (!orgGuardada) {
      // Solo crear organización por defecto si NO hay una guardada
      const defaultOrganization = {
        organizationId: 'default-org',
        organizationName: 'ESTUDIO JURÍDICO DEFAULT',
        organizationType: 'law-firm'
      };
      
      setOrganizationPersistent(defaultOrganization);
      establecerOrganizacion(defaultOrganization);
      
      console.log('⚠️ Creando organización por defecto para usuario:', user.email);
    } else {
      // Si hay organización guardada, esperar a que el contexto la cargue
      console.log('📂 Esperando carga de organización desde contexto...');
    }
  }

  return (
    <div className="app">
      {!sidebarVisible && (
        <button 
          className="emergency-nav-btn"
          onClick={() => {
            setSidebarVisible(true);
            setCurrentView('casos');
          }}
          title="Mostrar menú principal"
        >
          🏠 Inicio
        </button>
      )}

      {sidebarVisible && (
        <nav className={`sidebar-galactica ${sidebarCompressed ? 'compressed' : ''}`}>
          <div className="sidebar-header">
            <div className="header-content">
              <h1 className="logo-text">{sidebarCompressed ? 'L' : 'LEYIA'}</h1>
              {!sidebarCompressed && (
                <div style={{fontSize: '0.6rem', color: 'var(--sw-blue)', opacity: 0.8}}>
                  DATA TERMINAL SECTOR 7
                </div>
              )}
            </div>
            
            <button 
              className="compress-btn"
              onClick={toggleSidebarCompression}
              title={sidebarCompressed ? 'Expandir sidebar' : 'Comprimir sidebar'}
            >
              {sidebarCompressed ? '▶' : '◀'}
            </button>
          </div>

          <button 
            className={`collapsible ${!collapsedSections['navegacion'] ? 'active-collapse' : ''} ${sidebarCompressed ? 'compressed-section' : ''}`}
            onClick={() => {
              if (sidebarCompressed) {
                setTempExpandedSection(tempExpandedSection === 'navegacion' ? null : 'navegacion');
              } else {
                toggleSection('navegacion');
              }
            }}
            onMouseEnter={() => sidebarCompressed && setTempExpandedSection('navegacion')}
            onMouseLeave={() => sidebarCompressed && setTempExpandedSection(null)}
          >
            {sidebarCompressed ? (
              <div className="compressed-icon-container">
                <svg className="icon-svg" viewBox="0 0 24 24">
                  <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                </svg>
                <span className="expand-arrow">▲</span>
              </div>
            ) : (
              'Navegación Central'
            )}
          </button>
          {(!sidebarCompressed || tempExpandedSection === 'navegacion') && (
            <div 
              className={`content-menu ${sidebarCompressed && tempExpandedSection === 'navegacion' ? 'temp-expanded' : ''}`}
              style={{maxHeight: !collapsedSections['navegacion'] ? '500px' : '0'}}
            >
              {sidebarCompressed && tempExpandedSection === 'navegacion' ? (
                // Vista comprimida: mostrar solo iconos
                <div className="compressed-nav-icons">
                  <div
                    className={`compressed-nav-icon ${currentView === 'estudio' ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentView('estudio');
                      setTempExpandedSection(null);
                    }}
                    title="Estudio Jurídico"
                  >
                    <svg className="icon-svg" viewBox="0 0 24 24">
                      <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                    </svg>
                  </div>
                  <div
                    className={`compressed-nav-icon ${currentView === 'casos' ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentView('casos');
                      setTempExpandedSection(null);
                    }}
                    title="Expedientes"
                  >
                    <svg className="icon-svg" viewBox="0 0 24 24">
                      <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/>
                    </svg>
                  </div>
                  <div
                    className={`compressed-nav-icon ${currentView === 'calendario' ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentView('calendario');
                      setTempExpandedSection(null);
                    }}
                    title="Calendario"
                  >
                    <svg className="icon-svg" viewBox="0 0 24 24">
                      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                    </svg>
                  </div>
                  <div
                    className={`compressed-nav-icon ${currentView === 'equipo' ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentView('equipo');
                      setTempExpandedSection(null);
                    }}
                    title="Equipo"
                  >
                    <svg className="icon-svg" viewBox="0 0 24 24">
                      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                    </svg>
                  </div>
                </div>
              ) : (
                // Vista normal: mostrar elementos completos
                <>
                  <div
                    className={`nav-item ${currentView === 'estudio' ? 'active' : ''}`}
                    onClick={() => setCurrentView('estudio')}
                  >
                    <svg className="icon-svg" viewBox="0 0 24 24">
                      <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                    </svg>
                    Estudio Jurídico
                  </div>
                  <div
                    className={`nav-item ${currentView === 'casos' ? 'active' : ''}`}
                    onClick={() => setCurrentView('casos')}
                  >
                    <svg className="icon-svg" viewBox="0 0 24 24">
                      <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/>
                    </svg>
                    Expedientes
                  </div>
                  <div
                    className={`nav-item ${currentView === 'calendario' ? 'active' : ''}`}
                    onClick={() => setCurrentView('calendario')}
                  >
                    <svg className="icon-svg" viewBox="0 0 24 24">
                      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                    </svg>
                    Calendario
                  </div>
                  <div
                    className={`nav-item ${currentView === 'equipo' ? 'active' : ''}`}
                    onClick={() => setCurrentView('equipo')}
                  >
                    <svg className="icon-svg" viewBox="0 0 24 24">
                      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                    </svg>
                    Equipo
                  </div>
                </>
              )}
            </div>
          )}

          <button 
            className={`collapsible ${!collapsedSections['ia'] ? 'active-collapse' : ''} ${sidebarCompressed ? 'compressed-section' : ''}`}
            onClick={() => {
              if (sidebarCompressed) {
                setTempExpandedSection(tempExpandedSection === 'ia' ? null : 'ia');
              } else {
                toggleSection('ia');
              }
            }}
            onMouseEnter={() => sidebarCompressed && setTempExpandedSection('ia')}
            onMouseLeave={() => sidebarCompressed && setTempExpandedSection(null)}
          >
            {sidebarCompressed ? (
              <div className="compressed-icon-container">
                <svg className="icon-svg" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5z"/>
                </svg>
                <span className="expand-arrow">▲</span>
              </div>
            ) : (
              'Herramientas IA'
            )}
          </button>
          {(!sidebarCompressed || tempExpandedSection === 'ia') && (
            <div 
              className={`content-menu ${sidebarCompressed && tempExpandedSection === 'ia' ? 'temp-expanded' : ''}`}
              style={{maxHeight: !collapsedSections['ia'] ? '500px' : '0'}}
            >
              {sidebarCompressed && tempExpandedSection === 'ia' ? (
                // Vista comprimida: mostrar solo iconos
                <div className="compressed-nav-icons">
                  <div
                    className={`compressed-nav-icon ${currentView === 'jurisprudencia' ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentView('jurisprudencia');
                      setTempExpandedSection(null);
                    }}
                    title="Jurisprudencia"
                  >
                    <svg className="icon-svg" viewBox="0 0 24 24">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5z"/>
                    </svg>
                  </div>
                  <div
                    className={`compressed-nav-icon ${currentView === 'transcripcion' ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentView('transcripcion');
                      setTempExpandedSection(null);
                    }}
                    title="Transcripción y Redactor IA"
                  >
                    <svg className="icon-svg" viewBox="0 0 24 24">
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                    </svg>
                  </div>
                </div>
              ) : (
                // Vista normal: mostrar elementos completos
                <>
                  <div
                    className={`nav-item ${currentView === 'jurisprudencia' ? 'active' : ''}`}
                    onClick={() => setCurrentView('jurisprudencia')}
                  >
                    <svg className="icon-svg" viewBox="0 0 24 24">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5z"/>
                    </svg>
                    Jurisprudencia
                  </div>
                  <div
                    className={`nav-item ${currentView === 'transcripcion' ? 'active' : ''}`}
                    onClick={() => setCurrentView('transcripcion')}
                  >
                    <svg className="icon-svg" viewBox="0 0 24 24">
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                    </svg>
                    Transcripción y Redactor IA
                  </div>
                </>
              )}
            </div>
          )}

          <button 
            className={`collapsible ${!collapsedSections['admin'] ? 'active-collapse' : ''} ${sidebarCompressed ? 'compressed-section' : ''}`}
            onClick={() => {
              if (sidebarCompressed) {
                setTempExpandedSection(tempExpandedSection === 'admin' ? null : 'admin');
              } else {
                toggleSection('admin');
              }
            }}
            onMouseEnter={() => sidebarCompressed && setTempExpandedSection('admin')}
            onMouseLeave={() => sidebarCompressed && setTempExpandedSection(null)}
          >
            {sidebarCompressed ? (
              <div className="compressed-icon-container">
                <svg className="icon-svg" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span className="expand-arrow">▲</span>
              </div>
            ) : (
              'Administración'
            )}
          </button>
          {(!sidebarCompressed || tempExpandedSection === 'admin') && (
            <div 
              className={`content-menu ${sidebarCompressed && tempExpandedSection === 'admin' ? 'temp-expanded' : ''}`}
              style={{maxHeight: !collapsedSections['admin'] ? '500px' : '0'}}
            >
              {sidebarCompressed && tempExpandedSection === 'admin' ? (
                // Vista comprimida: mostrar solo iconos
                <div className="compressed-nav-icons">
                  <div
                    className={`compressed-nav-icon ${currentView === 'contactos' ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentView('contactos');
                      setTempExpandedSection(null);
                    }}
                    title="Contactos"
                  >
                    <svg className="icon-svg" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  <div
                    className={`compressed-nav-icon ${currentView === 'caja' ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentView('caja');
                      setTempExpandedSection(null);
                    }}
                    title="Finanzas"
                  >
                    <svg className="icon-svg" viewBox="0 0 24 24">
                      <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                    </svg>
                  </div>
                </div>
              ) : (
                // Vista normal: mostrar elementos completos
                <>
                  <div
                    className={`nav-item ${currentView === 'contactos' ? 'active' : ''}`}
                    onClick={() => setCurrentView('contactos')}
                  >
                    <svg className="icon-svg" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                    Contactos
                  </div>
                  <div
                    className={`nav-item ${currentView === 'caja' ? 'active' : ''}`}
                    onClick={() => setCurrentView('caja')}
                  >
                    <svg className="icon-svg" viewBox="0 0 24 24">
                      <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                    </svg>
                    Finanzas
                  </div>
                </>
              )}
            </div>
          )}

          <button 
            className={`collapsible ${!collapsedSections['externos'] ? 'active-collapse' : ''} ${sidebarCompressed ? 'compressed-section' : ''}`}
            onClick={() => {
              if (sidebarCompressed) {
                setTempExpandedSection(tempExpandedSection === 'externos' ? null : 'externos');
              } else {
                toggleSection('externos');
              }
            }}
            onMouseEnter={() => sidebarCompressed && setTempExpandedSection('externos')}
            onMouseLeave={() => sidebarCompressed && setTempExpandedSection(null)}
          >
            {sidebarCompressed ? (
              <div className="compressed-icon-container">
                <svg className="icon-svg" viewBox="0 0 24 24">
                  <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                </svg>
                <span className="expand-arrow">▲</span>
              </div>
            ) : (
              'Enlaces Externos'
            )}
          </button>
          {(!sidebarCompressed || tempExpandedSection === 'externos') && (
            <div 
              className={`content-menu ${sidebarCompressed && tempExpandedSection === 'externos' ? 'temp-expanded' : ''}`}
              style={{maxHeight: !collapsedSections['externos'] ? '500px' : '0'}}
            >
              {sidebarCompressed && tempExpandedSection === 'externos' ? (
                // Vista comprimida: mostrar solo iconos de enlaces
                <div className="compressed-nav-icons">
                  <div 
                    className="compressed-nav-icon" 
                    onClick={() => {
                      window.open('https://casillas.pj.gob.pe/sinoe/login.xhtml', '_blank');
                      setTempExpandedSection(null);
                    }}
                    title="SINOE"
                  >
                    <svg className="icon-svg" viewBox="0 0 24 24">
                      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H6V4h8v16z"/>
                    </svg>
                  </div>
                  <div 
                    className="compressed-nav-icon" 
                    onClick={() => {
                      window.open('https://www.sunarp.gob.pe/', '_blank');
                      setTempExpandedSection(null);
                    }}
                    title="SUNARP"
                  >
                    <svg className="icon-svg" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                  <div 
                    className="compressed-nav-icon" 
                    onClick={() => {
                      window.open('https://cej.pj.gob.pe/', '_blank');
                      setTempExpandedSection(null);
                    }}
                    title="CEJ"
                  >
                    <svg className="icon-svg" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <div 
                    className="compressed-nav-icon" 
                    onClick={() => {
                      window.open('https://www.reniec.gob.pe/', '_blank');
                      setTempExpandedSection(null);
                    }}
                    title="RENIEC"
                  >
                    <svg className="icon-svg" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                </div>
              ) : (
                // Vista normal: mostrar botones completos
                <div className="grid-links">
                  <button className="link-btn" onClick={() => window.open('https://casillas.pj.gob.pe/sinoe/login.xhtml', '_blank')}>
                    SINOE
                  </button>
                  <button className="link-btn" onClick={() => window.open('https://www.sunarp.gob.pe/', '_blank')}>
                    SUNARP
                  </button>
                  <button className="link-btn" onClick={() => window.open('https://cej.pj.gob.pe/', '_blank')}>
                    CEJ
                  </button>
                  <button className="link-btn" onClick={() => window.open('https://www.reniec.gob.pe/', '_blank')}>
                    RENIEC
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Nueva sección de herramientas de desarrollo */}
          <button 
            className={`collapsible ${!collapsedSections['dev'] ? 'active-collapse' : ''} ${sidebarCompressed ? 'compressed-section' : ''}`}
            onClick={() => {
              if (sidebarCompressed) {
                setTempExpandedSection(tempExpandedSection === 'dev' ? null : 'dev');
              } else {
                toggleSection('dev');
              }
            }}
            onMouseEnter={() => sidebarCompressed && setTempExpandedSection('dev')}
            onMouseLeave={() => sidebarCompressed && setTempExpandedSection(null)}
          >
            {sidebarCompressed ? (
              <div className="compressed-icon-container">
                <svg className="icon-svg" viewBox="0 0 24 24">
                  <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
                </svg>
                <span className="expand-arrow">▲</span>
              </div>
            ) : (
              'Herramientas Dev'
            )}
          </button>
          {(!sidebarCompressed || tempExpandedSection === 'dev') && (
            <div 
              className={`content-menu ${sidebarCompressed && tempExpandedSection === 'dev' ? 'temp-expanded' : ''}`}
              style={{maxHeight: !collapsedSections['dev'] ? '500px' : '0'}}
            >
              {sidebarCompressed && tempExpandedSection === 'dev' ? (
                // Vista comprimida: mostrar solo iconos
                <div className="compressed-nav-icons">
                  <div
                    className="compressed-nav-icon"
                    onClick={() => {
                      setMostrarQuickNavigator(true);
                      setTempExpandedSection(null);
                    }}
                    title="Navegación Rápida (Ctrl+K)"
                  >
                    <svg className="icon-svg" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                  <div
                    className="compressed-nav-icon"
                    onClick={() => {
                      setMostrarKeyboardShortcuts(true);
                      setTempExpandedSection(null);
                    }}
                    title="Atajos de Teclado (F1)"
                  >
                    <svg className="icon-svg" viewBox="0 0 24 24">
                      <path d="M11 9h2V7h-2m1 13c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m-1 15h2v-6h-2v6z"/>
                    </svg>
                  </div>
                </div>
              ) : (
                // Vista normal: mostrar elementos completos
                <>
                  <div
                    className="nav-item"
                    onClick={() => setMostrarQuickNavigator(true)}
                  >
                    <svg className="icon-svg" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    Navegación Rápida
                    <span className="shortcut-hint">Ctrl+K</span>
                  </div>
                  <div
                    className="nav-item"
                    onClick={() => setMostrarWindowDiagnostic(true)}
                  >
                    <svg className="icon-svg" viewBox="0 0 24 24">
                      <path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                    </svg>
                    Diagnóstico
                    <span className="shortcut-hint">Ctrl+Shift+D</span>
                  </div>
                  <div
                    className="nav-item"
                    onClick={() => setMostrarKeyboardShortcuts(true)}
                  >
                    <svg className="icon-svg" viewBox="0 0 24 24">
                      <path d="M11 9h2V7h-2m1 13c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m-1 15h2v-6h-2v6z"/>
                    </svg>
                    Atajos de Teclado
                    <span className="shortcut-hint">F1</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Botón de Perfil de Usuario */}
          <div style={{ 
            padding: sidebarCompressed ? '10px' : '20px 20px 10px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            {sidebarCompressed ? (
              <div
                className="compressed-nav-icon"
                onClick={() => setMostrarPerfil(true)}
                title="Mi Perfil"
                style={{
                  cursor: 'pointer',
                  padding: '12px',
                  borderRadius: '8px',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0, 210, 255, 0.1)',
                  border: '1px solid rgba(0, 210, 255, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 210, 255, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(0, 210, 255, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 210, 255, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(0, 210, 255, 0.3)';
                }}
              >
                <svg className="icon-svg" viewBox="0 0 24 24" style={{ fill: 'var(--neon-blue)' }}>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08s5.97 1.09 6 3.08c-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
              </div>
            ) : (
              <button
                className="profile-btn"
                onClick={() => setMostrarPerfil(true)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(0, 210, 255, 0.1)',
                  border: '1px solid rgba(0, 210, 255, 0.3)',
                  borderRadius: '8px',
                  color: 'var(--neon-blue)',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 210, 255, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(0, 210, 255, 0.5)';
                  e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 210, 255, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 210, 255, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(0, 210, 255, 0.3)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08s5.97 1.09 6 3.08c-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
                Mi Perfil
              </button>
            )}
          </div>

          {/* Botón de Logout al final del sidebar */}
          <div style={{ 
            marginTop: 'auto',
            padding: sidebarCompressed ? '10px' : '20px 20px 20px 20px'
          }}>
            {sidebarCompressed ? (
              <div
                className="compressed-nav-icon"
                onClick={async () => {
                  if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                    try {
                      // Limpiar sesión de Firebase
                      await signOut(auth);
                      
                      // Limpiar contexto de organización
                      limpiarSesion();
                      
                      // Limpiar sesión persistente
                      clearSession();
                      
                      // Limpiar localStorage adicional
                      localStorage.removeItem('devMode');
                      localStorage.removeItem('devUser');
                      
                      // Recargar para ir al login
                      window.location.reload();
                    } catch (error) {
                      console.error('Error al cerrar sesión:', error);
                      alert('Error al cerrar sesión');
                    }
                  }
                }}
                title="Cerrar Sesión"
                style={{
                  cursor: 'pointer',
                  padding: '12px',
                  borderRadius: '8px',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <svg className="icon-svg" viewBox="0 0 24 24" style={{ fill: '#ef4444' }}>
                  <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                </svg>
              </div>
            ) : (
              <button
                className="logout-btn"
                onClick={async () => {
                  if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                    try {
                      // Limpiar sesión de Firebase
                      await signOut(auth);
                      
                      // Limpiar contexto de organización
                      limpiarSesion();
                      
                      // Limpiar sesión persistente
                      clearSession();
                      
                      // Limpiar localStorage adicional
                      localStorage.removeItem('devMode');
                      localStorage.removeItem('devUser');
                      
                      // Recargar para ir al login
                      window.location.reload();
                    } catch (error) {
                      console.error('Error al cerrar sesión:', error);
                      alert('Error al cerrar sesión');
                    }
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  color: '#ef4444',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                </svg>
                Cerrar Sesión
              </button>
            )}
          </div>
        </nav>
      )}

      <div className={`main-content ${sidebarVisible ? (sidebarCompressed ? 'sidebar-compressed' : 'sidebar-visible') : 'sidebar-hidden'}`}>
        <div className={`content-area ${(currentView === 'equipo' || currentView === 'caja' || currentView === 'calendario') ? 'star-wars-view' : currentView === 'casos' ? 'galactic-casos' : ''}`}>
          {renderContent()}
        </div>
      </div>
      
      {/* ChatIA Minimal con Gemini API */}
      {true && (
        <ChatIAMinimal 
          notificacionesPendientes={notificacionesPendientes}
          onNotificacionesVistas={() => setNotificacionesPendientes(0)}
        />
      )}

      {mostrarPerfil && (
        <PerfilUsuario 
          onClose={() => setMostrarPerfil(false)} 
          user={user}
          organization={organization}
          onLogout={handleLogout}
        />
      )}

      {mostrarEmergencia && (
        <div style={{ padding: '20px', background: '#ffe0e0', border: '1px solid #ff6b6b' }}>
          <h3>Modo Emergencia</h3>
          <p>Funcionalidad en desarrollo...</p>
          <button onClick={() => setMostrarEmergencia(false)}>Cerrar</button>
        </div>
      )}

      {mostrarImportador && (
        <div style={{ padding: '20px', background: '#e0f0ff', border: '1px solid #6bb6ff' }}>
          <h3>Importador</h3>
          <p>Funcionalidad en desarrollo...</p>
          <button onClick={() => setMostrarImportador(false)}>Cerrar</button>
        </div>
      )}

      {mostrarDebugPanel && (
        <div style={{ padding: '20px', background: '#f0f0f0', border: '1px solid #ccc' }}>
          <h3>Panel de Debug</h3>
          <p>Funcionalidad en desarrollo...</p>
          <button onClick={() => setMostrarDebugPanel(false)}>Cerrar</button>
        </div>
      )}

      {mostrarWindowDiagnostic && (
        <WindowDiagnostic 
          onClose={() => setMostrarWindowDiagnostic(false)}
        />
      )}

      {mostrarQuickNavigator && (
        <QuickNavigator 
          currentView={currentView}
          onNavigate={setCurrentView}
          onClose={() => setMostrarQuickNavigator(false)}
        />
      )}

      {mostrarKeyboardShortcuts && (
        <KeyboardShortcuts 
          onClose={() => setMostrarKeyboardShortcuts(false)}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <OrganizacionProvider>
      <AppContent />
    </OrganizacionProvider>
  );
}

export default App;