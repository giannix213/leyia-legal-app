import React from 'react';
import './KeyboardShortcuts.css';

const KeyboardShortcuts = ({ onClose }) => {
  const shortcuts = [
    {
      category: 'Navegación General',
      items: [
        { keys: ['Ctrl', 'K'], description: 'Abrir navegación rápida' },
        { keys: ['Esc'], description: 'Cerrar modales y navegación' },
        { keys: ['Ctrl', 'Shift', 'D'], description: 'Diagnóstico de ventanas' }
      ]
    },
    {
      category: 'Desarrollo (Solo modo dev)',
      items: [
        { keys: ['Ctrl', 'Shift', 'I'], description: 'Abrir/cerrar DevTools' },
        { keys: ['F12'], description: 'Abrir/cerrar DevTools' },
        { keys: ['F5'], description: 'Recargar aplicación' },
        { keys: ['Ctrl', 'R'], description: 'Recargar aplicación' }
      ]
    },
    {
      category: 'Ventana (Electron)',
      items: [
        { keys: ['Alt', 'F4'], description: 'Cerrar aplicación' },
        { keys: ['F11'], description: 'Pantalla completa' },
        { keys: ['Ctrl', 'M'], description: 'Minimizar ventana' },
        { keys: ['Ctrl', 'Shift', 'M'], description: 'Maximizar/restaurar ventana' }
      ]
    },
    {
      category: 'Sidebar',
      items: [
        { keys: ['Ctrl', 'B'], description: 'Mostrar/ocultar sidebar' },
        { keys: ['Ctrl', 'Shift', 'B'], description: 'Comprimir/expandir sidebar' }
      ]
    }
  ];

  const renderKey = (key) => (
    <kbd key={key} className="keyboard-key">
      {key}
    </kbd>
  );

  return (
    <div className="shortcuts-overlay" onClick={onClose}>
      <div className="shortcuts-modal" onClick={e => e.stopPropagation()}>
        <div className="shortcuts-header">
          <h2>⌨️ Atajos de Teclado</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="shortcuts-content">
          {shortcuts.map((category, index) => (
            <div key={index} className="shortcut-category">
              <h3 className="category-title">{category.category}</h3>
              <div className="shortcuts-list">
                {category.items.map((shortcut, itemIndex) => (
                  <div key={itemIndex} className="shortcut-item">
                    <div className="shortcut-keys">
                      {shortcut.keys.map((key, keyIndex) => (
                        <React.Fragment key={keyIndex}>
                          {keyIndex > 0 && <span className="key-separator">+</span>}
                          {renderKey(key)}
                        </React.Fragment>
                      ))}
                    </div>
                    <div className="shortcut-description">
                      {shortcut.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="shortcuts-footer">
          <div className="footer-info">
            <p>💡 Tip: Mantén presionado Ctrl para ver más opciones en algunos elementos</p>
            <p>🔧 Los atajos de desarrollo solo funcionan en modo desarrollo</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcuts;