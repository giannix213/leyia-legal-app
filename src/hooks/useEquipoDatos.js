import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import casosService from '../services/CasosService';

export function useEquipoDatos(organizacionId) {
  const [data, setData] = useState({
    teamMembers: [],
    expedientes: [],
    perfilUsuario: null,
    organizacionInfo: null,
    loading: true,
    error: null
  });

  const cargarPerfilUsuario = useCallback(async () => {
    try {
      const docRef = doc(db, 'configuracion', 'perfilUsuario');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      return null;
    }
  }, []);

  const cargarOrganizacionInfo = useCallback(async (orgId) => {
    if (!orgId) return null;
    
    try {
      const orgRef = doc(db, 'organizaciones', orgId);
      const orgSnap = await getDoc(orgRef);
      
      if (orgSnap.exists()) {
        return orgSnap.data();
      }
      return null;
    } catch (error) {
      console.error('Error al cargar organización:', error);
      return null;
    }
  }, []);

  const cargarMiembros = useCallback(async (orgId) => {
    if (!orgId) {
      console.warn('No hay organización activa para cargar miembros');
      return [];
    }

    try {
      // Cargar miembros de la organización
      const miembrosQuery = query(
        collection(db, 'miembros'),
        where('organizacionId', '==', orgId),
        orderBy('createdAt', 'desc')
      );
      const miembrosSnapshot = await getDocs(miembrosQuery);
      const miembrosData = miembrosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // También cargar usuarios de la organización
      const usuariosQuery = query(
        collection(db, 'usuarios'),
        where('organizacionId', '==', orgId)
      );
      const usuariosSnapshot = await getDocs(usuariosQuery);
      const usuariosData = usuariosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Combinar datos de miembros y usuarios
      let todosLosMiembros = [];
      
      if (miembrosData.length > 0) {
        todosLosMiembros = miembrosData.map((miembro, index) => ({
          id: miembro.id,
          name: (miembro.nombre || miembro.displayName || `MIEMBRO ${index + 1}`).toUpperCase(),
          role: (miembro.rol || miembro.role || 'USUARIO 1').toUpperCase(),
          progress: miembro.progreso || Math.floor(Math.random() * 40 + 60), // 60-100%
          color: miembro.color || ['#2de2ff', '#0acf83', '#a259ff', '#ff6b35'][index % 4],
          email: miembro.email || '',
          lastActive: miembro.lastActive || miembro.createdAt
        }));
      }
      
      // Si también hay usuarios, agregarlos
      if (usuariosData.length > 0) {
        const usuariosFormateados = usuariosData.map((usuario, index) => ({
          id: usuario.id,
          name: (usuario.displayName || usuario.nombre || usuario.email?.split('@')[0] || `USUARIO ${index + 1}`).toUpperCase(),
          role: (usuario.role || usuario.rol || 'USUARIO 1').toUpperCase(),
          progress: usuario.progreso || Math.floor(Math.random() * 40 + 60),
          color: usuario.color || ['#2de2ff', '#0acf83', '#a259ff', '#ff6b35'][(index + miembrosData.length) % 4],
          email: usuario.email || '',
          lastActive: usuario.lastActive || usuario.createdAt
        }));
        
        // Evitar duplicados por email
        usuariosFormateados.forEach(usuario => {
          if (!todosLosMiembros.find(m => m.email === usuario.email)) {
            todosLosMiembros.push(usuario);
          }
        });
      }
      
      // Si no hay miembros, mostrar datos de ejemplo
      if (todosLosMiembros.length === 0) {
        todosLosMiembros = [
          { 
            id: 'demo-1',
            name: 'ORGANIZACIÓN',
            role: 'ADMIN', 
            progress: 85, 
            color: '#2de2ff',
            email: 'admin@organizacion.com'
          }
        ];
      }
      
      return todosLosMiembros;
      
    } catch (error) {
      console.error('Error al cargar miembros:', error);
      // Datos de fallback en caso de error
      return [
        { 
          id: 'fallback-1',
          name: 'ORGANIZACIÓN',
          role: 'ADMIN', 
          progress: 85, 
          color: '#2de2ff',
          email: 'admin@organizacion.com'
        }
      ];
    }
  }, []);

  const cargarExpedientes = useCallback(async (orgId) => {
    if (!orgId) {
      console.warn('No hay organización activa para cargar expedientes');
      return [];
    }

    try {
      console.log('📋 Cargando expedientes para organización:', orgId);
      
      // Usar servicio centralizado
      const casosData = await casosService.cargarCasosPorOrganizacion(orgId);
      
      // Transformar a formato de expedientes
      const expedientesData = casosData.map(caso => casosService.transformarAExpediente(caso));

      return expedientesData.filter((exp, index, self) => 
        index === self.findIndex(e => e.id === exp.id)
      );

    } catch (error) {
      console.error('Error al cargar expedientes:', error);
      return [];
    }
  }, []);

  // Función principal para cargar todos los datos
  const cargarDatos = useCallback(async () => {
    if (!organizacionId) {
      setData(prev => ({
        ...prev,
        teamMembers: [],
        expedientes: [],
        perfilUsuario: null,
        organizacionInfo: null,
        loading: false
      }));
      return;
    }

    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      // Cargar todos los datos en paralelo para mejor rendimiento
      const [miembros, expedientes, perfil, orgInfo] = await Promise.all([
        cargarMiembros(organizacionId),
        cargarExpedientes(organizacionId),
        cargarPerfilUsuario(),
        cargarOrganizacionInfo(organizacionId)
      ]);

      setData({
        teamMembers: miembros,
        expedientes: expedientes,
        perfilUsuario: perfil,
        organizacionInfo: orgInfo,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('Error al cargar datos del equipo:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Error al cargar datos del equipo'
      }));
    }
  }, [organizacionId, cargarMiembros, cargarExpedientes, cargarPerfilUsuario, cargarOrganizacionInfo]);

  // Efecto para cargar datos cuando cambie la organización
  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  return {
    ...data,
    recargar: cargarDatos
  };
}