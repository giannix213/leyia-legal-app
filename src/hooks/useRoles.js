// useRoles.js - Hook para manejo de roles de usuario
// Proporciona funcionalidad básica de roles

import { useState, useEffect } from 'react';
import { useOrganizacionContext } from '../contexts/OrganizacionContext';

export const useRoles = () => {
  const { organizacionActual } = useOrganizacionContext();
  const [userRole, setUserRole] = useState('usuario');
  const [permissions, setPermissions] = useState({
    canEdit: false,
    canDelete: false,
    canCreate: true,
    canView: true
  });

  useEffect(() => {
    // Determinar rol basado en la organización
    if (organizacionActual?.rolUsuario) {
      setUserRole(organizacionActual.rolUsuario);
    } else {
      setUserRole('usuario');
    }
  }, [organizacionActual]);

  useEffect(() => {
    // Configurar permisos basados en el rol
    switch (userRole.toLowerCase()) {
      case 'admin':
      case 'administrador':
        setPermissions({
          canEdit: true,
          canDelete: true,
          canCreate: true,
          canView: true
        });
        break;
      case 'editor':
      case 'abogado':
        setPermissions({
          canEdit: true,
          canDelete: false,
          canCreate: true,
          canView: true
        });
        break;
      case 'viewer':
      case 'asistente':
        setPermissions({
          canEdit: false,
          canDelete: false,
          canCreate: false,
          canView: true
        });
        break;
      default:
        setPermissions({
          canEdit: false,
          canDelete: false,
          canCreate: true,
          canView: true
        });
    }
  }, [userRole]);

  const hasPermission = (permission) => {
    return permissions[permission] || false;
  };

  const isAdmin = () => {
    return ['admin', 'administrador'].includes(userRole.toLowerCase());
  };

  const isEditor = () => {
    return ['admin', 'administrador', 'editor', 'abogado'].includes(userRole.toLowerCase());
  };

  const puedeUsarLeyiaIA = () => {
    // Todos los usuarios pueden usar Leyia IA por defecto
    return true;
  };

  const puedeUsarChatInterno = () => {
    // Todos los usuarios pueden usar Chat Interno por defecto
    return true;
  };

  const obtenerNombreRol = () => {
    const nombres = {
      'admin': 'Administrador',
      'administrador': 'Administrador',
      'editor': 'Editor',
      'abogado': 'Abogado',
      'asistente': 'Asistente',
      'viewer': 'Visualizador'
    };
    return nombres[userRole.toLowerCase()] || 'Usuario';
  };

  const obtenerIconoRol = () => {
    const iconos = {
      'admin': '👑',
      'administrador': '👑',
      'editor': '✏️',
      'abogado': '⚖️',
      'asistente': '👤',
      'viewer': '👁️'
    };
    return iconos[userRole.toLowerCase()] || '👤';
  };

  return {
    userRole,
    permissions,
    hasPermission,
    isAdmin,
    isEditor,
    puedeUsarLeyiaIA,
    puedeUsarChatInterno,
    obtenerNombreRol,
    obtenerIconoRol
  };
};