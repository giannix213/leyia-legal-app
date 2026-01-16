import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const OrganizacionContext = createContext();

export const useOrganizacionContext = () => {
  const context = useContext(OrganizacionContext);
  if (!context) {
    throw new Error('useOrganizacionContext debe usarse dentro de OrganizacionProvider');
  }
  return context;
};

export const OrganizacionProvider = ({ children }) => {
  const [organizacionActual, setOrganizacionActual] = useState(null);
  const [usuario, setUsuario] = useState(null);

  // Función para normalizar formato de organización
  const normalizarOrganizacion = useCallback((orgData) => {
    if (!orgData) return null;
    
    console.log('🔄 Normalizando organización:', orgData);
    
    // Si ya tiene el formato correcto del contexto, devolverlo tal como está
    if (orgData.id && orgData.nombre && orgData.tipo && !orgData.organizationId) {
      console.log('✅ Organización ya normalizada:', orgData);
      return orgData;
    }
    
    // Si tiene el formato de login o App.js (organizationId, organizationName, etc.)
    if (orgData.organizationId || orgData.organizationName || orgData.organizationType || 
        orgData.id || orgData.name || orgData.nombre) {
      
      const normalizada = {
        id: orgData.organizationId || orgData.id || 'default-org',
        nombre: orgData.organizationName || orgData.name || orgData.nombre || 'Organización',
        tipo: orgData.organizationType || orgData.type || orgData.tipo || 'estudio_juridico'
      };
      
      console.log('🔄 Organización normalizada:', {
        original: orgData,
        normalizada: normalizada
      });
      
      return normalizada;
    }
    
    // Si no tiene ningún formato reconocido, crear estructura mínima
    console.warn('⚠️ Formato de organización no reconocido:', orgData);
    return {
      id: 'unknown-org',
      nombre: 'Organización Desconocida',
      tipo: 'estudio_juridico'
    };
  }, []);

  // Función para cargar datos desde localStorage
  const cargarDatosDesdeStorage = useCallback(() => {
    console.log('📂 Iniciando carga de datos desde localStorage...');
    
    const orgGuardada = localStorage.getItem('organizacionActual');
    const userGuardado = localStorage.getItem('usuarioActual');
    
    console.log('📊 Estado localStorage:', {
      organizacionGuardada: !!orgGuardada,
      usuarioGuardado: !!userGuardado,
      orgSize: orgGuardada?.length || 0,
      userSize: userGuardado?.length || 0
    });
    
    if (orgGuardada) {
      try {
        const orgData = JSON.parse(orgGuardada);
        const orgNormalizada = normalizarOrganizacion(orgData);
        
        console.log('📋 Cargando organización desde localStorage:', {
          original: orgData,
          normalizada: orgNormalizada
        });
        
        setOrganizacionActual(orgNormalizada);
        console.log('✅ Organización establecida en contexto');
      } catch (err) {
        console.error('❌ Error cargando organización guardada:', err);
        localStorage.removeItem('organizacionActual');
      }
    } else {
      console.log('📂 No hay organización guardada en localStorage');
    }
    
    if (userGuardado) {
      try {
        const userData = JSON.parse(userGuardado);
        console.log('👤 Cargando usuario desde localStorage:', userData.email || userData.uid);
        setUsuario(userData);
      } catch (err) {
        console.error('❌ Error cargando usuario guardado:', err);
        localStorage.removeItem('usuarioActual');
      }
    } else {
      console.log('👤 No hay usuario guardado en localStorage');
    }
  }, [normalizarOrganizacion]);

  // Cargar datos al iniciar
  useEffect(() => {
    cargarDatosDesdeStorage();
  }, [cargarDatosDesdeStorage]);

  // Escuchar cambios en localStorage (para sincronización entre pestañas/ventanas)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'organizacionActual' || e.key === 'usuarioActual') {
        console.log('🔄 Cambio detectado en localStorage, recargando datos...');
        cargarDatosDesdeStorage();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [cargarDatosDesdeStorage]);

  const establecerOrganizacion = useCallback((orgData) => {
    console.log('🏢 Estableciendo organización:', orgData);
    
    if (!orgData) {
      console.warn('⚠️ Intentando establecer organización nula');
      return;
    }
    
    const orgNormalizada = normalizarOrganizacion(orgData);
    console.log('🏢 Organización normalizada establecida:', orgNormalizada);
    
    setOrganizacionActual(orgNormalizada);
    
    // Guardar en localStorage con manejo de errores
    try {
      localStorage.setItem('organizacionActual', JSON.stringify(orgNormalizada));
      console.log('💾 Organización guardada en localStorage exitosamente');
    } catch (error) {
      console.error('❌ Error guardando organización en localStorage:', error);
    }
  }, [normalizarOrganizacion]);

  const establecerUsuario = useCallback((userData) => {
    console.log('👤 Estableciendo usuario:', userData);
    setUsuario(userData);
    localStorage.setItem('usuarioActual', JSON.stringify(userData));
  }, []);

  const limpiarSesion = useCallback(() => {
    console.log('🧹 Limpiando sesión...');
    setOrganizacionActual(null);
    setUsuario(null);
    localStorage.removeItem('organizacionActual');
    localStorage.removeItem('usuarioActual');
  }, []);

  const value = {
    organizacionActual,
    usuario,
    establecerOrganizacion,
    establecerUsuario,
    limpiarSesion
  };

  return (
    <OrganizacionContext.Provider value={value}>
      {children}
    </OrganizacionContext.Provider>
  );
};