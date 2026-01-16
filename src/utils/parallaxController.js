/**
 * Controlador avanzado de efectos parallax cinematográficos
 * Maneja el movimiento de cámara basado en mouse y scroll
 */

class ParallaxController {
  constructor() {
    this.mouseX = 0;
    this.mouseY = 0;
    this.scrollY = 0;
    this.isActive = false;
    this.rafId = null;
    
    // Configuración de intensidad
    this.config = {
      mouseIntensity: 0.02,
      scrollIntensity: 0.5,
      smoothing: 0.1,
      maxRotation: 2,
      maxTranslation: 30
    };
    
    // Valores suavizados
    this.smoothMouse = { x: 0, y: 0 };
    this.smoothScroll = 0;
    
    this.init();
  }
  
  init() {
    this.bindEvents();
    this.startAnimation();
  }
  
  bindEvents() {
    // Movimiento del mouse
    document.addEventListener('mousemove', (e) => {
      if (!this.isActive) return;
      
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      // Normalizar posición del mouse (-1 a 1)
      this.mouseX = (clientX / innerWidth - 0.5) * 2;
      this.mouseY = (clientY / innerHeight - 0.5) * 2;
      
      // Actualizar cursor personalizado
      this.updateCustomCursor(clientX, clientY);
    });
    
    // Scroll
    window.addEventListener('scroll', () => {
      if (!this.isActive) return;
      this.scrollY = window.scrollY;
    });
    
    // Detectar cuando el parallax está activo
    this.checkParallaxActive();
    
    // Observer para detectar cambios en el DOM
    const observer = new MutationObserver(() => {
      this.checkParallaxActive();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  checkParallaxActive() {
    const parallaxContainer = document.querySelector('.login-container-parallax');
    this.isActive = !!parallaxContainer;
    
    if (this.isActive) {
      document.body.style.cursor = 'none';
      this.createCustomCursor();
    } else {
      document.body.style.cursor = 'auto';
      this.removeCustomCursor();
    }
  }
  
  createCustomCursor() {
    // Remover cursor existente
    this.removeCustomCursor();
    
    // Crear nuevo cursor
    const cursor = document.createElement('div');
    cursor.id = 'parallax-cursor';
    cursor.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 20px;
      height: 20px;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.8) 0%, transparent 70%);
      border-radius: 50%;
      pointer-events: none;
      z-index: 9999;
      mix-blend-mode: screen;
      transition: transform 0.1s ease-out;
      transform: translate(-50%, -50%);
    `;
    
    document.body.appendChild(cursor);
  }
  
  removeCustomCursor() {
    const cursor = document.getElementById('parallax-cursor');
    if (cursor) {
      cursor.remove();
    }
  }
  
  updateCustomCursor(x, y) {
    const cursor = document.getElementById('parallax-cursor');
    if (cursor) {
      cursor.style.left = x + 'px';
      cursor.style.top = y + 'px';
    }
  }
  
  startAnimation() {
    const animate = () => {
      if (this.isActive) {
        this.updateParallax();
      }
      this.rafId = requestAnimationFrame(animate);
    };
    animate();
  }
  
  updateParallax() {
    // Suavizar valores
    this.smoothMouse.x += (this.mouseX - this.smoothMouse.x) * this.config.smoothing;
    this.smoothMouse.y += (this.mouseY - this.smoothMouse.y) * this.config.smoothing;
    this.smoothScroll += (this.scrollY - this.smoothScroll) * this.config.smoothing;
    
    // Aplicar transformaciones a las capas
    this.updateLayers();
    this.updateScene();
    this.updateCard();
  }
  
  updateLayers() {
    const layers = document.querySelectorAll('.parallax-layer');
    
    layers.forEach((layer, index) => {
      const depth = this.getLayerDepth(layer);
      const intensity = depth * this.config.mouseIntensity;
      
      const translateX = this.smoothMouse.x * intensity * this.config.maxTranslation;
      const translateY = this.smoothMouse.y * intensity * this.config.maxTranslation;
      const scrollOffset = this.smoothScroll * this.config.scrollIntensity * (depth * 0.5);
      
      const transform = `
        translateX(${translateX}px) 
        translateY(${translateY + scrollOffset}px)
        scale(${1 + depth * 0.1})
      `;
      
      layer.style.transform = transform;
    });
  }
  
  updateScene() {
    const scene = document.querySelector('.parallax-scene');
    if (!scene) return;
    
    const rotateX = this.smoothMouse.y * this.config.maxRotation;
    const rotateY = -this.smoothMouse.x * this.config.maxRotation;
    const translateX = this.smoothMouse.x * 10;
    const translateY = this.smoothMouse.y * 5;
    
    scene.style.transform = `
      translateX(${translateX}px) 
      translateY(${translateY}px) 
      rotateX(${rotateX}deg) 
      rotateY(${rotateY}deg)
    `;
  }
  
  updateCard() {
    const card = document.querySelector('.login-card-parallax');
    if (!card) return;
    
    const rotateX = -this.smoothMouse.y * 5;
    const rotateY = this.smoothMouse.x * 5;
    const translateZ = Math.abs(this.smoothMouse.x) + Math.abs(this.smoothMouse.y) * 10;
    
    card.style.transform = `
      rotateX(${rotateX}deg) 
      rotateY(${rotateY}deg) 
      translateZ(${translateZ}px)
    `;
  }
  
  getLayerDepth(layer) {
    if (layer.classList.contains('parallax-back')) return 0.3;
    if (layer.classList.contains('parallax-middle')) return 0.6;
    if (layer.classList.contains('parallax-front')) return 1.0;
    return 0.5;
  }
  
  destroy() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    this.removeCustomCursor();
    document.body.style.cursor = 'auto';
  }
}

// Crear instancia global
let parallaxController = null;

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    parallaxController = new ParallaxController();
  });
} else {
  parallaxController = new ParallaxController();
}

// Exportar para uso en React
export default ParallaxController;