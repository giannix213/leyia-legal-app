import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { useOrganizacionContext } from '../contexts/OrganizacionContext';
import './CajaChica.css';

function CajaChica() {
  const { organizacionActual } = useOrganizacionContext();
  const [movimientos, setMovimientos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMovimiento, setEditingMovimiento] = useState(null);
  const [formData, setFormData] = useState({
    tipo: 'egreso',
    concepto: '',
    monto: '',
    categoria: '',
    responsable: '',
    fecha: new Date().toISOString().split('T')[0],
    notas: ''
  });

  useEffect(() => {
    cargarMovimientos();
  }, [organizacionActual?.id]);

  const cargarMovimientos = async () => {
    if (!organizacionActual?.id) {
      console.warn('No hay organización activa para cargar movimientos');
      setMovimientos([]);
      return;
    }

    try {
      const movimientosQuery = query(
        collection(db, 'cajaChica'),
        where('organizacionId', '==', organizacionActual.id),
        orderBy('fecha', 'desc')
      );
      const querySnapshot = await getDocs(movimientosQuery);
      const movimientosData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMovimientos(movimientosData.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
    } catch (error) {
      console.error('Error al cargar movimientos:', error);
      setMovimientos([]);
    }
  };

  const calcularBalance = () => {
    return movimientos.reduce((total, mov) => {
      const monto = parseFloat(mov.monto) || 0;
      return mov.tipo === 'ingreso' ? total + monto : total - monto;
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!organizacionActual?.id) {
      alert('No hay organización activa');
      return;
    }

    try {
      const movimientoData = {
        ...formData,
        organizacionId: organizacionActual.id
      };

      if (editingMovimiento) {
        await updateDoc(doc(db, 'cajaChica', editingMovimiento.id), {
          ...movimientoData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'cajaChica'), {
          ...movimientoData,
          createdAt: serverTimestamp()
        });
      }
      setShowModal(false);
      resetForm();
      cargarMovimientos();
    } catch (error) {
      console.error('Error al guardar movimiento:', error);
    }
  };

  const handleEdit = (movimiento) => {
    setEditingMovimiento(movimiento);
    setFormData({
      tipo: movimiento.tipo,
      concepto: movimiento.concepto,
      monto: movimiento.monto,
      categoria: movimiento.categoria,
      responsable: movimiento.responsable,
      fecha: movimiento.fecha,
      notas: movimiento.notas
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este movimiento?')) {
      try {
        await deleteDoc(doc(db, 'cajaChica', id));
        cargarMovimientos();
      } catch (error) {
        console.error('Error al eliminar movimiento:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      tipo: 'egreso',
      concepto: '',
      monto: '',
      categoria: '',
      responsable: '',
      fecha: new Date().toISOString().split('T')[0],
      notas: ''
    });
    setEditingMovimiento(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const formatMonto = (monto) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      currencyDisplay: 'symbol'
    }).format(monto).replace('PEN', 'S/');
  };

  const calcularIngresosTotales = () => {
    return movimientos
      .filter(mov => mov.tipo === 'ingreso')
      .reduce((total, mov) => total + (parseFloat(mov.monto) || 0), 0);
  };

  const calcularEgresosTotales = () => {
    return movimientos
      .filter(mov => mov.tipo === 'egreso')
      .reduce((total, mov) => total + (parseFloat(mov.monto) || 0), 0);
  };

  const obtenerCategorias = () => {
    const categorias = {};
    movimientos
      .filter(mov => mov.tipo === 'egreso')
      .forEach(mov => {
        const categoria = mov.categoria || 'Sin categoría';
        categorias[categoria] = (categorias[categoria] || 0) + (parseFloat(mov.monto) || 0);
      });
    return categorias;
  };

  const obtenerMovimientosRecientes = () => {
    return movimientos.slice(0, 5);
  };

  return (
    <div className="star-wars-finance-terminal">
      <div className="terminal-container">
        {/* Header */}
        <div className="terminal-header">
          <div className="header-left">
            <h1 className="terminal-title">TERMINAL FINANCIERO GALÁCTICO</h1>
            <div className="terminal-subtitle">SECTOR CORELLIA-7 | ESTACIÓN LEYIA</div>
          </div>
          <div className="header-right">
            <button 
              className="nav-back-btn-finance"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('navigateToView', { 
                  detail: { view: 'casos' } 
                }));
              }}
              title="Volver a Casos"
            >
              ← CASOS
            </button>
            <div className="status-indicator">
              <div className="status-dot"></div>
              <span>SISTEMA ACTIVO</span>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="terminal-grid">
          {/* Balance Card */}
          <div className="holo-card balance-card">
            <div className="card-header">
              <h3>BALANCE TOTAL</h3>
              <div className="scan-line"></div>
            </div>
            <div className="balance-amount">
              {formatMonto(calcularBalance())}
            </div>
            <div className="balance-status">
              {calcularBalance() >= 0 ? 'FONDOS DISPONIBLES' : 'DÉFICIT DETECTADO'}
            </div>
          </div>

          {/* Income Card */}
          <div className="holo-card income-card">
            <div className="card-header">
              <h3>INGRESOS TOTALES</h3>
              <div className="scan-line"></div>
            </div>
            <div className="metric-amount income">
              {formatMonto(calcularIngresosTotales())}
            </div>
            <div className="metric-change">↗ FLUJO POSITIVO</div>
          </div>

          {/* Expenses Card */}
          <div className="holo-card expense-card">
            <div className="card-header">
              <h3>EGRESOS TOTALES</h3>
              <div className="scan-line"></div>
            </div>
            <div className="metric-amount expense">
              {formatMonto(calcularEgresosTotales())}
            </div>
            <div className="metric-change">↘ GASTOS OPERATIVOS</div>
          </div>

          {/* Chart Section */}
          <div className="holo-card chart-card">
            <div className="card-header">
              <h3>ANÁLISIS FINANCIERO</h3>
              <div className="scan-line"></div>
            </div>
            <div className="chart-placeholder">
              <div className="chart-bars">
                <div className="bar income-bar" style={{height: `${Math.min(calcularIngresosTotales() / 100, 100)}%`}}>
                  <span>INGRESOS</span>
                </div>
                <div className="bar expense-bar" style={{height: `${Math.min(calcularEgresosTotales() / 100, 100)}%`}}>
                  <span>EGRESOS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="holo-card transactions-card">
            <div className="card-header">
              <h3>TRANSACCIONES RECIENTES</h3>
              <div className="scan-line"></div>
            </div>
            <div className="transactions-list">
              {obtenerMovimientosRecientes().length === 0 ? (
                <div className="no-data">
                  <div className="no-data-icon">💰</div>
                  <div>NO HAY TRANSACCIONES</div>
                </div>
              ) : (
                obtenerMovimientosRecientes().map(mov => (
                  <div key={mov.id} className="transaction-item">
                    <div className="transaction-info">
                      <div className="transaction-concept">{mov.concepto}</div>
                      <div className="transaction-date">{mov.fecha}</div>
                    </div>
                    <div className={`transaction-amount ${mov.tipo}`}>
                      {mov.tipo === 'ingreso' ? '+' : '-'} {formatMonto(mov.monto)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Categories Breakdown */}
          <div className="holo-card categories-card">
            <div className="card-header">
              <h3>CATEGORÍAS DE GASTOS</h3>
              <div className="scan-line"></div>
            </div>
            <div className="categories-list">
              {Object.entries(obtenerCategorias()).length === 0 ? (
                <div className="no-data">
                  <div>SIN CATEGORÍAS</div>
                </div>
              ) : (
                Object.entries(obtenerCategorias()).map(([categoria, monto]) => (
                  <div key={categoria} className="category-item">
                    <div className="category-name">{categoria}</div>
                    <div className="category-amount">{formatMonto(monto)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="terminal-actions">
          <button 
            className="holo-btn primary"
            onClick={() => setShowModal(true)}
          >
            <span>+ NUEVA TRANSACCIÓN</span>
          </button>
          <button 
            className="holo-btn secondary"
            onClick={cargarMovimientos}
          >
            <span>🔄 ACTUALIZAR DATOS</span>
          </button>
        </div>

        {/* All Transactions Table */}
        {movimientos.length > 0 && (
          <div className="holo-card full-width">
            <div className="card-header">
              <h3>REGISTRO COMPLETO DE TRANSACCIONES</h3>
              <div className="scan-line"></div>
            </div>
            <div className="terminal-table">
              <div className="table-header">
                <div>FECHA</div>
                <div>CONCEPTO</div>
                <div>CATEGORÍA</div>
                <div>RESPONSABLE</div>
                <div>TIPO</div>
                <div>MONTO</div>
                <div>ACCIONES</div>
              </div>
              {movimientos.map(mov => (
                <div key={mov.id} className="table-row">
                  <div className="table-cell">{mov.fecha}</div>
                  <div className="table-cell">
                    <div className="concept-main">{mov.concepto}</div>
                    {mov.notas && <div className="concept-notes">{mov.notas}</div>}
                  </div>
                  <div className="table-cell">
                    <span className="category-tag">{mov.categoria}</span>
                  </div>
                  <div className="table-cell">{mov.responsable}</div>
                  <div className="table-cell">
                    <span className={`type-badge ${mov.tipo}`}>
                      {mov.tipo === 'ingreso' ? '↑ INGRESO' : '↓ EGRESO'}
                    </span>
                  </div>
                  <div className={`table-cell amount-cell ${mov.tipo}`}>
                    {mov.tipo === 'ingreso' ? '+' : '-'} {formatMonto(mov.monto)}
                  </div>
                  <div className="table-cell actions-cell">
                    <button 
                      className="action-btn edit"
                      onClick={() => handleEdit(mov)}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button 
                      className="action-btn delete"
                      onClick={() => handleDelete(mov.id)}
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="holo-modal">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingMovimiento ? 'EDITAR TRANSACCIÓN' : 'NUEVA TRANSACCIÓN'}
              </h3>
              <button className="close-btn" onClick={handleCloseModal}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">TIPO DE OPERACIÓN</label>
                  <select
                    className="form-input"
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  >
                    <option value="egreso">EGRESO (GASTO)</option>
                    <option value="ingreso">INGRESO</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">CONCEPTO</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Descripción de la transacción"
                    value={formData.concepto}
                    onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">MONTO</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="0.00"
                    value={formData.monto}
                    onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">CATEGORÍA</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: Oficina, Transporte, Honorarios"
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">RESPONSABLE</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.responsable}
                    onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">FECHA</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-group full-width">
                <label className="form-label">NOTAS ADICIONALES</label>
                <textarea
                  className="form-textarea"
                  placeholder="Detalles adicionales..."
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="holo-btn secondary" onClick={handleCloseModal}>
                  CANCELAR
                </button>
                <button type="submit" className="holo-btn primary">
                  {editingMovimiento ? 'ACTUALIZAR' : 'CREAR TRANSACCIÓN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CajaChica;
