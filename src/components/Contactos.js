import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { useOrganizacionContext } from '../contexts/OrganizacionContext';

function Contactos() {
  const { organizacionActual } = useOrganizacionContext();
  const [contactos, setContactos] = useState([]);
  const [casos, setCasos] = useState([]);
  const [clientesAgrupados, setClientesAgrupados] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingContacto, setEditingContacto] = useState(null);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtros, setFiltros] = useState({
    rol: '',
    tipoProceso: '',
    expediente: ''
  });
  const [formData, setFormData] = useState({
    nombre: '',
    dni: '',
    telefono: '',
    email: '',
    direccion: '',
    notas: ''
  });

  useEffect(() => {
    cargarDatos();
  }, [organizacionActual?.id]);

  const cargarDatos = async () => {
    if (!organizacionActual?.id) {
      console.warn('No hay organización activa para cargar contactos');
      setContactos([]);
      setCasos([]);
      setClientesAgrupados([]);
      return;
    }

    try {
      // Cargar casos de la organización
      const casosQuery = query(
        collection(db, 'casos'),
        where('organizacionId', '==', organizacionActual.id),
        orderBy('createdAt', 'desc')
      );
      const casosSnapshot = await getDocs(casosQuery);
      const casosData = casosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCasos(casosData);

      // Cargar contactos de la organización
      const contactosQuery = query(
        collection(db, 'contactos'),
        where('organizacionId', '==', organizacionActual.id),
        orderBy('createdAt', 'desc')
      );
      const contactosSnapshot = await getDocs(contactosQuery);
      const contactosData = contactosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setContactos(contactosData);

      // Agrupar clientes desde casos
      agruparClientes(casosData, contactosData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setContactos([]);
      setCasos([]);
      setClientesAgrupados([]);
    }
  };

  const agruparClientes = (casosData, contactosData) => {
    const clientesMap = {};

    // Extraer clientes únicos de los casos
    casosData.forEach(caso => {
      if (caso.cliente) {
        const nombreCliente = caso.cliente.trim();
        if (!clientesMap[nombreCliente]) {
          // Buscar si ya tiene datos guardados en contactos
          const contactoExistente = contactosData.find(c => 
            c.nombre && c.nombre.toLowerCase() === nombreCliente.toLowerCase()
          );

          clientesMap[nombreCliente] = {
            nombre: nombreCliente,
            casos: [],
            dni: contactoExistente?.dni || '',
            telefono: contactoExistente?.telefono || '',
            email: contactoExistente?.email || '',
            direccion: contactoExistente?.direccion || '',
            notas: contactoExistente?.notas || '',
            contactoId: contactoExistente?.id || null
          };
        }
        clientesMap[nombreCliente].casos.push({
          numero: caso.numero,
          tipo: caso.tipo,
          descripcion: caso.descripcion,
          estado: caso.estado
        });
      }
    });

    // Convertir a array y ordenar por nombre
    const clientesArray = Object.values(clientesMap).sort((a, b) => 
      a.nombre.localeCompare(b.nombre)
    );

    setClientesAgrupados(clientesArray);
  };

  const cargarContactos = async () => {
    await cargarDatos();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!organizacionActual?.id) {
      alert('No hay organización activa');
      return;
    }

    try {
      const datosCliente = {
        nombre: selectedCliente?.nombre || formData.nombre,
        dni: formData.dni,
        telefono: formData.telefono,
        email: formData.email,
        direccion: formData.direccion,
        notas: formData.notas,
        organizacionId: organizacionActual.id,
        updatedAt: serverTimestamp()
      };

      if (selectedCliente?.contactoId) {
        // Actualizar contacto existente
        await updateDoc(doc(db, 'contactos', selectedCliente.contactoId), datosCliente);
      } else {
        // Crear nuevo contacto
        await addDoc(collection(db, 'contactos'), {
          ...datosCliente,
          createdAt: serverTimestamp()
        });
      }
      
      setShowModal(false);
      setSelectedCliente(null);
      resetForm();
      cargarContactos();
    } catch (error) {
      console.error('Error al guardar contacto:', error);
    }
  };

  const handleEdit = (contacto) => {
    setEditingContacto(contacto);
    setFormData({
      nombre: contacto.nombre,
      rol: contacto.rol,
      tipoProceso: contacto.tipoProceso,
      expediente: contacto.expediente,
      telefono: contacto.telefono,
      email: contacto.email,
      direccion: contacto.direccion,
      notas: contacto.notas
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este contacto?')) {
      try {
        await deleteDoc(doc(db, 'contactos', id));
        cargarContactos();
      } catch (error) {
        console.error('Error al eliminar contacto:', error);
      }
    }
  };

  const handleEditarCliente = (cliente) => {
    setSelectedCliente(cliente);
    setFormData({
      nombre: cliente.nombre,
      dni: cliente.dni || '',
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      direccion: cliente.direccion || '',
      notas: cliente.notas || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      dni: '',
      telefono: '',
      email: '',
      direccion: '',
      notas: ''
    });
    setSelectedCliente(null);
    setEditingContacto(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const contactosFiltrados = contactos.filter(contacto => {
    if (filtros.rol && contacto.rol !== filtros.rol) return false;
    if (filtros.tipoProceso && contacto.tipoProceso !== filtros.tipoProceso) return false;
    if (filtros.expediente && !contacto.expediente.toLowerCase().includes(filtros.expediente.toLowerCase())) return false;
    return true;
  });

  const getRolBadgeClass = (rol) => {
    switch (rol) {
      case 'demandante': return 'badge-active';
      case 'demandado': return 'badge-urgent';
      case 'abogado': return 'badge-completed';
      case 'testigo': return 'badge-pending';
      default: return 'badge-pending';
    }
  };

  const getRolLabel = (rol) => {
    const roles = {
      demandante: 'Demandante',
      demandado: 'Demandado',
      abogado: 'Abogado Externo',
      testigo: 'Testigo',
      perito: 'Perito',
      otro: 'Otro'
    };
    return roles[rol] || rol;
  };

  const getTipoProcesoLabel = (tipo) => {
    const tipos = {
      civil: 'Civil',
      penal: 'Penal',
      laboral: 'Laboral',
      administrativo: 'Administrativo',
      familia: 'Familia',
      comercial: 'Comercial'
    };
    return tipos[tipo] || tipo;
  };

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">📇 Agenda de Clientes</h2>
        <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
          {clientesAgrupados.filter(c => {
            if (!busqueda) return true;
            const busquedaLower = busqueda.toLowerCase();
            return (
              c.nombre.toLowerCase().includes(busquedaLower) ||
              (c.dni && c.dni.toLowerCase().includes(busquedaLower)) ||
              (c.telefono && c.telefono.toLowerCase().includes(busquedaLower))
            );
          }).length} clientes • {casos.length} casos
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div style={{ marginBottom: '24px' }}>
        <div className="search-bar-container" style={{ position: 'relative', maxWidth: '600px' }}>
          <span style={{
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '18px',
            color: '#94a3b8',
            pointerEvents: 'none'
          }}>
            🔍
          </span>
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por nombre, DNI o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ paddingLeft: '48px' }}
          />
          {busqueda && (
            <button 
              className="clear-search-btn"
              onClick={() => setBusqueda('')}
              title="Limpiar búsqueda"
              style={{ right: '12px' }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {clientesAgrupados.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <div className="empty-state-text">No hay clientes registrados</div>
          <p style={{ color: '#64748b', marginTop: '12px' }}>
            Los clientes se generan automáticamente desde los casos
          </p>
        </div>
      ) : clientesAgrupados.filter(cliente => {
        if (!busqueda) return true;
        const busquedaLower = busqueda.toLowerCase();
        return (
          cliente.nombre.toLowerCase().includes(busquedaLower) ||
          (cliente.dni && cliente.dni.toLowerCase().includes(busquedaLower)) ||
          (cliente.telefono && cliente.telefono.toLowerCase().includes(busquedaLower)) ||
          (cliente.email && cliente.email.toLowerCase().includes(busquedaLower))
        );
      }).length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-text">No se encontraron clientes</div>
          <p style={{ color: '#64748b', marginTop: '12px' }}>
            No hay clientes que coincidan con "{busqueda}"
          </p>
          <button 
            className="btn btn-secondary" 
            onClick={() => setBusqueda('')}
            style={{ marginTop: '16px' }}
          >
            Limpiar búsqueda
          </button>
        </div>
      ) : (
        <div className="clientes-lista">
          {clientesAgrupados.filter(cliente => {
            if (!busqueda) return true;
            const busquedaLower = busqueda.toLowerCase();
            return (
              cliente.nombre.toLowerCase().includes(busquedaLower) ||
              (cliente.dni && cliente.dni.toLowerCase().includes(busquedaLower)) ||
              (cliente.telefono && cliente.telefono.toLowerCase().includes(busquedaLower)) ||
              (cliente.email && cliente.email.toLowerCase().includes(busquedaLower))
            );
          }).map((cliente, idx) => (
            <div key={idx} className="cliente-card">
              <div className="cliente-header">
                <div className="cliente-avatar">
                  {cliente.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="cliente-info">
                  <div className="cliente-nombre">{cliente.nombre}</div>
                  <div className="cliente-casos-count">
                    {cliente.casos.length} {cliente.casos.length === 1 ? 'caso' : 'casos'}
                  </div>
                </div>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '13px' }}
                  onClick={() => handleEditarCliente(cliente)}
                >
                  {cliente.dni || cliente.telefono ? '✏️ Editar' : '➕ Agregar Datos'}
                </button>
              </div>

              {/* Datos del cliente */}
              <div className="cliente-datos">
                {cliente.dni && (
                  <div className="cliente-dato-item">
                    <span className="dato-icon">🆔</span>
                    <span className="dato-label">DNI:</span>
                    <span className="dato-value">{cliente.dni}</span>
                  </div>
                )}
                {cliente.telefono && (
                  <div className="cliente-dato-item">
                    <span className="dato-icon">📱</span>
                    <span className="dato-label">Teléfono:</span>
                    <span className="dato-value">{cliente.telefono}</span>
                  </div>
                )}
                {cliente.email && (
                  <div className="cliente-dato-item">
                    <span className="dato-icon">📧</span>
                    <span className="dato-label">Email:</span>
                    <span className="dato-value">{cliente.email}</span>
                  </div>
                )}
                {cliente.direccion && (
                  <div className="cliente-dato-item">
                    <span className="dato-icon">📍</span>
                    <span className="dato-label">Dirección:</span>
                    <span className="dato-value">{cliente.direccion}</span>
                  </div>
                )}
                {!cliente.dni && !cliente.telefono && !cliente.email && !cliente.direccion && (
                  <div style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic', padding: '8px 0' }}>
                    Sin datos de contacto registrados
                  </div>
                )}
              </div>

              {/* Lista de casos del cliente */}
              <div className="cliente-casos">
                <div className="cliente-casos-header">📋 Expedientes:</div>
                <div className="cliente-casos-lista">
                  {cliente.casos.map((caso, casoIdx) => (
                    <div key={casoIdx} className="cliente-caso-item">
                      <span className="caso-numero">{caso.numero}</span>
                      <span className="caso-tipo" style={{ textTransform: 'capitalize' }}>
                        {caso.tipo}
                      </span>
                      <span className={`caso-estado badge badge-${caso.estado === 'archivado' ? 'completed' : 'active'}`}>
                        {caso.estado}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {cliente.notas && (
                <div className="cliente-notas">
                  <span className="notas-icon">📝</span>
                  <span className="notas-text">{cliente.notas}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal para editar datos del cliente */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">
                {selectedCliente ? `Datos de ${selectedCliente.nombre}` : 'Nuevo Cliente'}
              </h3>
              <button className="close-btn" onClick={() => { setShowModal(false); resetForm(); }}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              {selectedCliente && (
                <div style={{ 
                  padding: '12px', 
                  background: '#f1f5f9', 
                  borderRadius: '8px', 
                  marginBottom: '16px' 
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '8px' }}>Expedientes del cliente:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {selectedCliente.casos.map((caso, idx) => (
                      <span key={idx} className="badge badge-active" style={{ fontSize: '11px' }}>
                        {caso.numero}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="form-group">
                <label className="form-label">Nombre Completo</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  disabled={!!selectedCliente}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">DNI</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: 12345678"
                  value={formData.dni}
                  onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="Ej: 999 888 777"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="cliente@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Dirección</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Dirección completa"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Notas</label>
                <textarea
                  className="form-textarea"
                  placeholder="Notas adicionales sobre el cliente..."
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                />
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filtros antiguos - eliminar */}
      <div className="filters-container" style={{ display: 'none' }}>
        <div className="filter-group">
          <label className="filter-label">Rol:</label>
          <select
            className="filter-select"
            value={filtros.rol}
            onChange={(e) => setFiltros({ ...filtros, rol: e.target.value })}
          >
            <option value="">Todos</option>
            <option value="demandante">Demandante</option>
            <option value="demandado">Demandado</option>
            <option value="abogado">Abogado Externo</option>
            <option value="testigo">Testigo</option>
            <option value="perito">Perito</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Tipo de Proceso:</label>
          <select
            className="filter-select"
            value={filtros.tipoProceso}
            onChange={(e) => setFiltros({ ...filtros, tipoProceso: e.target.value })}
          >
            <option value="">Todos</option>
            <option value="civil">Civil</option>
            <option value="penal">Penal</option>
            <option value="laboral">Laboral</option>
            <option value="administrativo">Administrativo</option>
            <option value="familia">Familia</option>
            <option value="comercial">Comercial</option>
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Expediente:</label>
          <input
            type="text"
            className="filter-input"
            placeholder="Buscar por expediente..."
            value={filtros.expediente}
            onChange={(e) => setFiltros({ ...filtros, expediente: e.target.value })}
          />
        </div>
        {(filtros.rol || filtros.tipoProceso || filtros.expediente) && (
          <button
            className="btn btn-secondary"
            onClick={() => setFiltros({ rol: '', tipoProceso: '', expediente: '' })}
          >
            Limpiar Filtros
          </button>
        )}
      </div>

      {contactosFiltrados.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👤</div>
          <div className="empty-state-text">
            {contactos.length === 0 ? 'No hay contactos registrados' : 'No se encontraron contactos con esos filtros'}
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            Agregar primer contacto
          </button>
        </div>
      ) : (
        <div className="contactos-grid">
          {contactosFiltrados.map(contacto => (
            <div key={contacto.id} className="contacto-card">
              <div className="contacto-header">
                <div className="contacto-avatar">
                  {contacto.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="contacto-info">
                  <div className="contacto-nombre">{contacto.nombre}</div>
                  <span className={`badge ${getRolBadgeClass(contacto.rol)}`}>
                    {getRolLabel(contacto.rol)}
                  </span>
                </div>
              </div>
              
              <div className="contacto-details">
                <div className="contacto-detail-row">
                  <span className="detail-icon">📁</span>
                  <div>
                    <div className="detail-label">Expediente</div>
                    <div className="detail-value">{contacto.expediente}</div>
                  </div>
                </div>
                <div className="contacto-detail-row">
                  <span className="detail-icon">⚖️</span>
                  <div>
                    <div className="detail-label">Tipo de Proceso</div>
                    <div className="detail-value">{getTipoProcesoLabel(contacto.tipoProceso)}</div>
                  </div>
                </div>
                {contacto.telefono && (
                  <div className="contacto-detail-row">
                    <span className="detail-icon">📞</span>
                    <div>
                      <div className="detail-label">Teléfono</div>
                      <div className="detail-value">{contacto.telefono}</div>
                    </div>
                  </div>
                )}
                {contacto.email && (
                  <div className="contacto-detail-row">
                    <span className="detail-icon">📧</span>
                    <div>
                      <div className="detail-label">Email</div>
                      <div className="detail-value">{contacto.email}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="contacto-actions">
                <button className="action-btn" onClick={() => handleEdit(contacto)}>
                  ✏️ Editar
                </button>
                <button className="action-btn" onClick={() => handleDelete(contacto.id)}>
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingContacto ? 'Editar Contacto' : 'Nuevo Contacto'}
              </h3>
              <button className="close-btn" onClick={handleCloseModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nombre Completo</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Rol</label>
                <select
                  className="form-select"
                  value={formData.rol}
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                  required
                >
                  <option value="demandante">Demandante</option>
                  <option value="demandado">Demandado</option>
                  <option value="abogado">Abogado Externo</option>
                  <option value="testigo">Testigo</option>
                  <option value="perito">Perito</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tipo de Proceso</label>
                <select
                  className="form-select"
                  value={formData.tipoProceso}
                  onChange={(e) => setFormData({ ...formData, tipoProceso: e.target.value })}
                  required
                >
                  <option value="civil">Civil</option>
                  <option value="penal">Penal</option>
                  <option value="laboral">Laboral</option>
                  <option value="administrativo">Administrativo</option>
                  <option value="familia">Familia</option>
                  <option value="comercial">Comercial</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Número de Expediente</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: 1234-2025"
                  value={formData.expediente}
                  onChange={(e) => setFormData({ ...formData, expediente: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input
                  type="tel"
                  className="form-input"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Dirección</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Notas</label>
                <textarea
                  className="form-textarea"
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingContacto ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Contactos;
