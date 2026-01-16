function ContextMenu({ menuContextual, agregarLineaDivisoria, eliminarElemento, cerrarMenuContextual }) {
  // Validación de props para evitar errores
  if (!menuContextual || !menuContextual.mostrar) {
    return null;
  }

  return (
    <div 
      className="menu-contextual"
      style={{
        position: 'absolute',
        top: `${menuContextual.y}px`,
        left: `${menuContextual.x}px`,
        zIndex: 99999
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="menu-item" onClick={agregarLineaDivisoria}>
        <span className="menu-icon">➕</span>
        <span>Agregar línea divisoria</span>
      </div>
      <div className="menu-item menu-item-danger" onClick={eliminarElemento}>
        <span className="menu-icon">🗑️</span>
        <span>Eliminar</span>
      </div>
    </div>
  );
}

export default ContextMenu;