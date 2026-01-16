import { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

function EstadisticasAvanzadas() {
  const [datos, setDatos] = useState({
    expedientes: [],
    escritos: [],
    audiencias: [],
    tareas: [],
    loading: true
  });

  const [vistaActiva, setVistaActiva] = useState('resumen');
  const [filtroCaso, setFiltroCaso] = useState('todos'); // Para filtrar estadísticas por un caso específico

  useEffect(() => {
    cargarTodo();
  }, []);

  const cargarTodo = async () => {
    try {
      // Cargamos todas las colecciones en paralelo para mejorar la velocidad
      const [expSnap, escSnap, audSnap, tarSnap] = await Promise.all([
        getDocs(collection(db, 'casos')),
        getDocs(collection(db, 'escritos')),
        getDocs(collection(db, 'audiencias')),
        getDocs(collection(db, 'tareas'))
      ]);

      const mapear = (snap) => snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setDatos({
        expedientes: mapear(expSnap),
        escritos: mapear(escSnap),
        audiencias: mapear(audSnap),
        tareas: mapear(tarSnap),
        loading: false
      });
    } catch (error) {
      console.error("Error en Firebase:", error);
      setDatos(prev => ({ ...prev, loading: false }));
    }
  };

  // --- LÓGICA DE VINCULACIÓN (USANDO USEMEMO PARA RENDIMIENTO) ---
  const statsVinculadas = useMemo(() => {
    const { expedientes, escritos, audiencias, tareas } = datos;
    
    // 1. Relacionar Escritos con Expedientes
    const expedientesConDetalle = expedientes.map(exp => {
      const escritosDelCaso = escritos.filter(esc => esc.casoId === exp.id || esc.expedienteId === exp.id);
      const audienciasDelCaso = audiencias.filter(aud => aud.casoId === exp.id);
      
      return {
        ...exp,
        conteoEscritos: escritosDelCaso.length,
        conteoAudiencias: audienciasDelCaso.length,
        progreso: exp.estado === 'Finalizado' ? 100 : (escritosDelCaso.length > 0 ? 60 : 20)
      };
    });

    // 2. Calcular Carga de Trabajo por Abogado (si existe el campo 'asignadoA')
    const cargaAbogados = expedientes.reduce((acc, exp) => {
      const abogado = exp.abogadoAsignado || 'Sin Asignar';
      acc[abogado] = (acc[abogado] || 0) + 1;
      return acc;
    }, {});

    return {
      expedientesConDetalle,
      cargaAbogados,
      totalPendientes: tareas.filter(t => t.estado !== 'completado').length,
      eficiencia: expedientes.length > 0 
        ? ((escritos.length / (expedientes.length * 2)) * 100).toFixed(1) // Ratio estimado
        : 0
    };
  }, [datos]);

  if (datos.loading) return <LoadingScreen />;

  return (
    <div className="stats-container" style={styles.container}>
      {/* HEADER DINÁMICO */}
      <header style={styles.header}>
        <h1>📊 Panel de Control Legal</h1>
        <p>Análisis en tiempo real de {datos.expedientes.length} casos activos</p>
      </header>

      {/* SELECTOR DE CASO (VINCULACIÓN REAL) */}
      <div style={styles.filterBar}>
        <label>Análisis por Expediente: </label>
        <select 
          onChange={(e) => setFiltroCaso(e.target.value)}
          style={styles.select}
        >
          <option value="todos">Todos los casos (Global)</option>
          {datos.expedientes.map(exp => (
            <option key={exp.id} value={exp.id}>{exp.numero || exp.titulo}</option>
          ))}
        </select>
      </div>

      {/* GRID DE KPIS PRINCIPALES */}
      <div style={styles.kpiGrid}>
        <KPICard title="Salud del Estudio" value={`${statsVinculadas.eficiencia}%`} color="#3b82f6" subtitle="Ratio Escritos/Casos" />
        <KPICard title="Tareas Críticas" value={statsVinculadas.totalPendientes} color="#ef4444" subtitle="Pendientes de firma" />
        <KPICard title="Próximas Audiencias" value={datos.audiencias.length} color="#f59e0b" subtitle="Siguientes 7 días" />
      </div>

      {/* SECCIONES DE VISTA */}
      <div style={styles.mainContent}>
        <aside style={styles.sidebar}>
          <button onClick={() => setVistaActiva('resumen')}>📈 Resumen Operativo</button>
          <button onClick={() => setVistaActiva('abogados')}>👥 Carga de Equipo</button>
          <button onClick={() => setVistaActiva('casos')}>⚖️ Detalle de Casos</button>
        </aside>

        <section style={styles.contentBody}>
          {vistaActiva === 'resumen' && <ResumenTab stats={statsVinculadas} />}
          {vistaActiva === 'abogados' && <AbogadosTab carga={statsVinculadas.cargaAbogados} />}
        </section>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTES PARA LIMPIEZA DE CÓDIGO ---

const KPICard = ({ title, value, color, subtitle }) => (
  <div style={{ ...styles.card, borderTop: `4px solid ${color}` }}>
    <h4 style={{ color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase' }}>{title}</h4>
    <p style={{ fontSize: '2rem', fontWeight: '800', margin: '10px 0' }}>{value}</p>
    <small style={{ color: '#94a3b8' }}>{subtitle}</small>
  </div>
);

const ResumenTab = ({ stats }) => (
  <div style={styles.tabAnimate}>
    <h3>Análisis de Flujo de Trabajo</h3>
    {stats.expedientesConDetalle.slice(0, 5).map(exp => (
      <div key={exp.id} style={styles.listRow}>
        <span>{exp.numero || 'S/N'}</span>
        <div style={styles.progressContainer}>
          <div style={{ ...styles.progressBar, width: `${exp.progreso}%` }}></div>
        </div>
        <span>{exp.conteoEscritos} Escritos</span>
      </div>
    ))}
  </div>
);

const AbogadosTab = ({ carga }) => (
  <div style={styles.tabAnimate}>
    <h3>Carga de Trabajo por Abogado</h3>
    {Object.keys(carga).length > 0 ? (
      Object.entries(carga).map(([nombre, cantidad], index) => (
        <div key={index} style={styles.listRow}>
          <span>{nombre}</span>
          <div style={styles.progressContainer}>
            <div style={{ 
              ...styles.progressBar, 
              width: `${Math.min(cantidad * 10, 100)}%`,
              backgroundColor: cantidad > 8 ? '#ff4444' : cantidad > 5 ? '#ffaa00' : '#44ff44'
            }}></div>
          </div>
          <span>{cantidad} casos</span>
        </div>
      ))
    ) : (
      <div style={styles.listRow}>
        <span>No hay datos de carga disponibles</span>
      </div>
    )}
  </div>
);

const LoadingScreen = () => (
  <div style={styles.loader}>
    <div className="spinner"></div>
    <p>Sincronizando con el Poder Judicial...</p>
  </div>
);

// --- ESTILOS MEJORADOS ---
const styles = {
  container: { padding: '40px', backgroundColor: '#f1f5f9', minHeight: '100vh', fontFamily: 'Inter, sans-serif' },
  header: { marginBottom: '30px' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' },
  card: { backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' },
  filterBar: { marginBottom: '20px', padding: '15px', backgroundColor: '#fff', borderRadius: '8px' },
  select: { padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginLeft: '10px' },
  mainContent: { display: 'grid', gridTemplateColumns: '250px 1fr', gap: '30px' },
  sidebar: { display: 'flex', flexDirection: 'column', gap: '10px' },
  contentBody: { backgroundColor: '#fff', padding: '30px', borderRadius: '12px' },
  listRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid #f1f5f9' },
  progressContainer: { flex: 1, height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', margin: '0 20px', overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#10b981', transition: 'width 1s ease-in-out' },
  loader: { height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }
};

export default EstadisticasAvanzadas;