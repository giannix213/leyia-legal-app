import React, { useEffect, useRef } from 'react';
import './ParallaxSimple.css';

const ParallaxSimple = ({ children }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;

    // Configuración inicial de dimensiones
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();

    // Configuración de estrellas con ADN Leyia Pro
    const numStars = 500;
    const stars = Array.from({ length: numStars }, () => ({
      x: Math.random() * canvas.width - canvas.width / 2,
      y: Math.random() * canvas.height - canvas.height / 2,
      z: Math.random() * canvas.width,
      color: Math.random() > 0.8 ? '#bc13fe' : '#00f3ff', // Púrpura o Cian
      o: Math.random() * 0.5 + 0.5
    }));

    const animate = () => {
      // Limpiamos el canvas por completo en cada frame para ver la imagen de fondo
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      stars.forEach(star => {
        star.z -= 4; // Velocidad de viaje espacial

        // 1. Reposicionar estrella si sale de la pantalla o se acerca demasiado
        if (star.z <= 1) { // Cambiado a 1 para evitar división por cero
          star.z = canvas.width;
          star.x = Math.random() * canvas.width - canvas.width / 2;
          star.y = Math.random() * canvas.height - canvas.height / 2;
        }

        // 2. Proyección 3D a 2D
        const k = 128 / star.z;
        const px = star.x * k + cx;
        const py = star.y * k + cy;

        // 3. Solo dibujamos si está dentro de los límites del canvas
        if (px >= 0 && px <= canvas.width && py >= 0 && py <= canvas.height) {
          
          // --- PROTECCIÓN CONTRA RADIOS NEGATIVOS ---
          // Usamos Math.max(0.1, ...) para que el radio nunca sea menor o igual a cero
          const size = Math.max(0.1, (1 - star.z / canvas.width) * 4);
          const opacity = Math.max(0, (1 - star.z / canvas.width) * star.o);

          // 4. Dibujar la estrella (cabeza)
          ctx.beginPath();
          ctx.fillStyle = star.color;
          ctx.globalAlpha = opacity;
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fill();

          // 5. Dibujar la estela (trail)
          // Blindamos también k2 para el rastro
          const k2 = 128 / (star.z + 12); 
          const px2 = star.x * k2 + cx;
          const py2 = star.y * k2 + cy;

          ctx.beginPath();
          ctx.strokeStyle = star.color;
          ctx.lineWidth = Math.max(0.1, size / 2); // Seguridad también en el grosor de línea
          ctx.globalAlpha = opacity * 0.6;
          ctx.moveTo(px, py);
          ctx.lineTo(px2, py2);
          ctx.stroke();
        }
      });

      // Resetear globalAlpha para que no afecte a otros elementos si los hubiera
      ctx.globalAlpha = 1;
      animationId = requestAnimationFrame(animate);
    };

    animate();
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="parallax-container">
      {/* Capa de fondo: Imagen */}
      <div 
        className="parallax-background"
        style={{
         backgroundImage: `url(${process.env.PUBLIC_URL}/fondo.png)`
        }}
      />
      
      {/* Capa media: Estrellas Canvas */}
      <canvas ref={canvasRef} className="starfield-canvas" />
      
      {/* CAPA 3: El overlay de profundidad */}
       <div className="parallax-overlay" />

      {/* Capa superior: Contenido (Loading/Logo) */}
      <div className="parallax-content">
        {children}
      </div>
    </div>
  );
};

export default ParallaxSimple;