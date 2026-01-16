import { useEffect } from 'react';

export const useElectronOptimization = () => {
  const isElectron = !!window?.process?.versions?.electron;
  
  useEffect(() => {
    if (isElectron) {
      console.log('⚡ Aplicando optimizaciones SEGURAS para Electron...');
      
      // Agregar clase para CSS condicional
      document.body.classList.add('electron-mode');
      
      // Crear estilos optimizados ESPECÍFICOS para Electron (sin wildcards peligrosos)
      const electronStyles = document.createElement('style');
      electronStyles.id = 'electron-optimizations';
      electronStyles.textContent = `
        /* OPTIMIZACIONES ESPECÍFICAS Y SEGURAS PARA ELECTRON */
        
        /* SOLO desactivar backdrop-filter en modales específicos */
        .electron-mode .expediente-modal-overlay,
        .electron-mode .confirm-delete-overlay,
        .electron-mode .context-menu-overlay {
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }
        
        /* Modal overlay optimizado */
        .electron-mode .expediente-modal-overlay {
          background: rgba(0, 0, 0, 0.85) !important;
          z-index: 1000 !important;
        }
        
        .electron-mode .confirm-delete-overlay {
          background: rgba(0, 0, 0, 0.7) !important;
          z-index: 950 !important;
        }
        
        .electron-mode .context-menu-overlay {
          z-index: 900 !important;
        }
        
        /* Animaciones simplificadas SOLO para modales */
        .electron-mode .expediente-modal-container {
          animation: electronModalSlide 0.2s ease-out !important;
        }
        
        @keyframes electronModalSlide {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Desactivar efectos holográficos problemáticos SOLO en modales */
        .electron-mode .expediente-modal-container::before,
        .electron-mode .timeline-bar::before,
        .electron-mode .stat-item::before {
          display: none !important;
        }
        
        /* Sombras más simples SOLO para modales */
        .electron-mode .expediente-modal-container {
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
        }
        
        /* Optimizar scroll SOLO en contenido de modales */
        .electron-mode .modal-content {
          scrollbar-width: thin;
          scrollbar-color: #00ccff rgba(0, 30, 60, 0.3);
        }
        
        .electron-mode .modal-content::-webkit-scrollbar {
          width: 8px;
        }
        
        .electron-mode .modal-content::-webkit-scrollbar-track {
          background: rgba(0, 30, 60, 0.3);
        }
        
        .electron-mode .modal-content::-webkit-scrollbar-thumb {
          background: #00ccff;
          border-radius: 4px;
        }
        
        /* Reducir complejidad visual SOLO en elementos específicos de modales */
        .electron-mode .datos-tabla::before,
        .electron-mode .observaciones-destacadas::before,
        .electron-mode .acciones-pendientes::before,
        .electron-mode .botones-tipo-accion::before {
          display: none !important;
        }
        
        /* Optimizar transiciones SOLO para modales */
        .electron-mode .expediente-modal-overlay *,
        .electron-mode .confirm-delete-overlay *,
        .electron-mode .context-menu-overlay * {
          transition-duration: 0.2s !important;
        }
        
        /* Mejorar contraste SOLO para inputs de modales */
        .electron-mode .expediente-modal-container .campo-grupo input,
        .electron-mode .expediente-modal-container .observaciones-textarea {
          background: rgba(0, 30, 60, 0.8) !important;
          border-color: #00ccff !important;
        }
      `;
      
      document.head.appendChild(electronStyles);
      
      // Configurar optimizaciones de rendimiento
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => {
          console.log('✅ Optimizaciones SEGURAS de Electron aplicadas');
        });
      }
      
      return () => {
        document.body.classList.remove('electron-mode');
        const existingStyles = document.getElementById('electron-optimizations');
        if (existingStyles) {
          document.head.removeChild(existingStyles);
        }
        console.log('🧹 Optimizaciones de Electron removidas');
      };
    }
  }, [isElectron]);
  
  // Función para optimizar scroll del body en modales
  const optimizeBodyScroll = (isModalOpen) => {
    if (!isElectron) return;
    
    if (isModalOpen) {
      // Guardar posición actual
      const scrollY = window.scrollY;
      
      // Aplicar estilos optimizados para Electron
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      
      // Guardar posición para restaurar después
      document.body.dataset.scrollY = scrollY;
    } else {
      // Restaurar scroll
      const scrollY = parseInt(document.body.dataset.scrollY || '0');
      
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.height = '';
      
      // Restaurar posición de scroll
      window.scrollTo(0, scrollY);
      
      // Limpiar dataset
      delete document.body.dataset.scrollY;
    }
  };
  
  // Función para diagnosticar problemas de modales
  const diagnosticarModales = () => {
    if (!isElectron) {
      console.log('🌐 Ejecutándose en navegador web');
      return;
    }
    
    console.log('🔍 DIAGNÓSTICO DE MODALES EN ELECTRON:');
    
    // Verificar z-index problemáticos
    const elementosZIndex = document.querySelectorAll('*');
    let zIndexAltos = [];
    
    elementosZIndex.forEach(el => {
      const zIndex = parseInt(getComputedStyle(el).zIndex);
      if (zIndex > 5000) {
        zIndexAltos.push({ element: el, zIndex });
      }
    });
    
    if (zIndexAltos.length > 0) {
      console.warn('⚠️ Z-index problemáticos encontrados:', zIndexAltos.length);
      zIndexAltos.slice(0, 3).forEach((item, index) => {
        console.warn(`  ${index + 1}. ${item.element.className} - z-index: ${item.zIndex}`);
      });
    } else {
      console.log('✅ Z-index optimizados');
    }
    
    // Verificar backdrop-filter
    const elementsWithBackdrop = document.querySelectorAll('*');
    let backdropElements = [];
    
    elementsWithBackdrop.forEach(el => {
      const backdropFilter = getComputedStyle(el).backdropFilter;
      if (backdropFilter && backdropFilter !== 'none') {
        backdropElements.push(el);
      }
    });
    
    if (backdropElements.length > 0) {
      console.warn('⚠️ Backdrop-filter detectado en:', backdropElements.length, 'elementos');
    } else {
      console.log('✅ Backdrop-filter desactivado');
    }
    
    // Verificar modales abiertos
    const modalesAbiertos = document.querySelectorAll('.expediente-modal-overlay, .confirm-delete-overlay, .modal-overlay');
    console.log(`📊 Modales abiertos: ${modalesAbiertos.length}`);
    
    return {
      isElectron,
      zIndexAltos: zIndexAltos.length,
      backdropElements: backdropElements.length,
      modalesAbiertos: modalesAbiertos.length
    };
  };
  
  return {
    isElectron,
    optimizeBodyScroll,
    diagnosticarModales
  };
};