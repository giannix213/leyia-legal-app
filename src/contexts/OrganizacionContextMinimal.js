import { createContext, useContext } from 'react';

const OrganizacionContext = createContext();

export const useOrganizacionContext = () => {
  const context = useContext(OrganizacionContext);
  if (!context) {
    throw new Error('useOrganizacionContext debe usarse dentro de OrganizacionProvider');
  }
  return context;
};

export const OrganizacionProvider = ({ children }) => {
  // Datos completamente estáticos para evitar cualquier re-render
  const value = {
    organizacionActual: {
      id: 'static-org',
      nombre: 'ESTUDIO JURÍDICO ESTÁTICO',
      tipo: 'estudio_juridico'
    },
    usuario: {
      uid: 'static-user',
      email: 'static@test.com',
      displayName: 'Usuario Estático'
    },
    establecerOrganizacion: () => console.log('establecerOrganizacion - modo estático'),
    establecerUsuario: () => console.log('establecerUsuario - modo estático'),
    limpiarSesion: () => console.log('limpiarSesion - modo estático')
  };

  return (
    <OrganizacionContext.Provider value={value}>
      {children}
    </OrganizacionContext.Provider>
  );
};