// src/components/ConfirmDeleteModal.js
import React from 'react';
import './ConfirmDeleteModal.css';

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, expediente, isDeleting }) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <div className="confirm-delete-overlay">
      <div className="confirm-delete-modal">
        {/* Header */}
        <div className="confirm-delete-header">
          <div className="confirm-delete-icon">
            ⚠️
          </div>
          <h3 className="confirm-delete-title">
            Confirmar Eliminación
          </h3>
        </div>

        {/* Content */}
        <div className="confirm-delete-content">
          <p className="confirm-delete-message">
            ¿Estás seguro de que deseas eliminar el expediente?
          </p>
          
          <div className="confirm-delete-expediente-info">
            <div className="expediente-info-row">
              <span className="expediente-info-label">Número:</span>
              <span className="expediente-info-value">{expediente?.numero || 'N/A'}</span>
            </div>
            
            {expediente?.cliente && (
              <div className="expediente-info-row">
                <span className="expediente-info-label">Cliente:</span>
                <span className="expediente-info-value">{expediente.cliente}</span>
              </div>
            )}
            
            {expediente?.tipo && (
              <div className="expediente-info-row">
                <span className="expediente-info-label">Tipo:</span>
                <span className="expediente-info-value">{expediente.tipo}</span>
              </div>
            )}
          </div>

          <div className="confirm-delete-warning">
            <span className="warning-icon">🚨</span>
            <span className="warning-text">
              Esta acción no se puede deshacer. El expediente será eliminado permanentemente.
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="confirm-delete-actions">
          <button 
            className="confirm-delete-btn confirm-delete-cancel"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancelar
          </button>
          
          <button 
            className="confirm-delete-btn confirm-delete-confirm"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <span className="loading-spinner"></span>
                Eliminando...
              </>
            ) : (
              <>
                🗑️ Eliminar Expediente
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;