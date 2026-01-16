import React, { useState } from 'react';

function RedactorIA() {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [documentContent, setDocumentContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    demandante: '',
    demandado: '',
    materia: '',
    pretension: '',
    hechos: '',
    fundamentosJuridicos: '',
    expediente: '',
    juzgado: ''
  });

  const templates = [
    {
      id: 'demanda',
      name: 'Demanda Civil',
      icon: '📄',
      description: 'Demanda por obligación de dar suma de dinero, responsabilidad civil, etc.',
      color: '#3b82f6'
    },
    {
      id: 'contestacion',
      name: 'Contestación de Demanda',
      icon: '📋',
      description: 'Respuesta a demanda civil con excepciones y defensas',
      color: '#10b981'
    },
    {
      id: 'apelacion',
      name: 'Recurso de Apelación',
      icon: '⚖️',
      description: 'Recurso impugnatorio contra resoluciones de primera instancia',
      color: '#f59e0b'
    },
    {
      id: 'casacion',
      name: 'Recurso de Casación',
      icon: '🏛️',
      description: 'Recurso extraordinario ante la Corte Suprema',
      color: '#ef4444'
    },
    {
      id: 'escrito',
      name: 'Escrito Simple',
      icon: '📝',
      description: 'Escritos varios: solicitudes, desistimientos, etc.',
      color: '#8b5cf6'
    },
    {
      id: 'alegatos',
      name: 'Alegatos de Clausura',
      icon: '🎯',
      description: 'Alegatos finales para audiencia de juzgamiento',
      color: '#06b6d4'
    }
  ];

  const generateDocument = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      let content = '';
      
      switch (selectedTemplate) {
        case 'demanda':
          content = generateDemanda();
          break;
        case 'contestacion':
          content = generateContestacion();
          break;
        case 'apelacion':
          content = generateApelacion();
          break;
        case 'casacion':
          content = generateCasacion();
          break;
        case 'escrito':
          content = generateEscrito();
          break;
        case 'alegatos':
          content = generateAlegatos();
          break;
        default:
          content = 'Seleccione una plantilla para generar el documento.';
      }
      
      setDocumentContent(content);
      setIsGenerating(false);
    }, 2000);
  };

  const generateDemanda = () => {
    return `DEMANDA DE ${formData.materia.toUpperCase()}

SEÑOR JUEZ DEL ${formData.juzgado || '[JUZGADO CIVIL]'}

${formData.demandante || '[NOMBRE DEL DEMANDANTE]'}, identificado con DNI N° [DNI], con domicilio real en [DIRECCIÓN], señalando domicilio procesal en [DIRECCIÓN PROCESAL], a usted respetuosamente digo:

I. PETITORIO:
Interpongo DEMANDA DE ${formData.materia.toUpperCase()} contra ${formData.demandado || '[NOMBRE DEL DEMANDADO]'}, a fin de que se le ordene:

${formData.pretension || '1. [PRETENSIÓN PRINCIPAL]\n2. [PRETENSIÓN ACCESORIA]'}

II. FUNDAMENTOS DE HECHO:

${formData.hechos || `PRIMERO.- [Relación jurídica entre las partes]
SEGUNDO.- [Hechos que sustentan la pretensión]
TERCERO.- [Incumplimiento o daño causado]
CUARTO.- [Requerimiento extrajudicial]`}

III. FUNDAMENTOS DE DERECHO:

${formData.fundamentosJuridicos || `La presente demanda se sustenta en los siguientes dispositivos legales:
- Artículo 1321° del Código Civil (Obligaciones)
- Artículo 1969° del Código Civil (Responsabilidad Civil)
- Artículos 424° y siguientes del Código Procesal Civil`}

IV. MEDIOS PROBATORIOS:
1. Documentales que se adjuntan
2. Declaración de parte del demandado
3. Pericia contable (de ser el caso)

V. ANEXOS:
- Copia de DNI
- Documentos sustentatorios
- Cédula de notificación

POR TANTO:
Solicito a su Despacho admitir la presente demanda, correr traslado al demandado y en su oportunidad declararla FUNDADA.

Lima, [FECHA]

_________________________
${formData.demandante || '[NOMBRE DEL DEMANDANTE]'}
DNI: [DNI]`;
  };

  const generateContestacion = () => {
    return `CONTESTACIÓN DE DEMANDA

SEÑOR JUEZ DEL ${formData.juzgado || '[JUZGADO CIVIL]'}

${formData.demandado || '[NOMBRE DEL DEMANDADO]'}, identificado con DNI N° [DNI], en el proceso seguido por ${formData.demandante || '[DEMANDANTE]'} sobre ${formData.materia}, Expediente N° ${formData.expediente || '[N° EXPEDIENTE]'}, a usted respetuosamente digo:

I. CONTESTACIÓN DE LA DEMANDA:

CONTESTO la demanda interpuesta en mi contra, NEGÁNDOLA Y CONTRADICIÉNDOLA en todos sus extremos, solicitando sea declarada INFUNDADA por las razones que expongo:

II. FUNDAMENTOS DE HECHO:

PRIMERO.- Es falso que [contradecir los hechos alegados por el demandante]
SEGUNDO.- La verdad de los hechos es que [exponer la versión del demandado]
TERCERO.- No existe obligación alguna que me vincule con el demandante
CUARTO.- [Otros argumentos de defensa]

III. FUNDAMENTOS DE DERECHO:

La contestación se sustenta en:
- Artículo 442° del Código Procesal Civil
- Principio de la carga de la prueba
- [Otros fundamentos jurídicos aplicables]

IV. MEDIOS PROBATORIOS:
1. Documentales que acreditan mi posición
2. Declaración de parte del demandante
3. Testimoniales (de ser el caso)

POR TANTO:
Solicito se declare INFUNDADA la demanda en todos sus extremos.

Lima, [FECHA]

_________________________
${formData.demandado || '[NOMBRE DEL DEMANDADO]'}
DNI: [DNI]`;
  };

  const generateApelacion = () => {
    return `RECURSO DE APELACIÓN

SEÑOR JUEZ DEL ${formData.juzgado || '[JUZGADO CIVIL]'}

${formData.demandante || '[NOMBRE DEL APELANTE]'}, en el proceso que sigo contra ${formData.demandado || '[DEMANDADO]'} sobre ${formData.materia}, Expediente N° ${formData.expediente || '[N° EXPEDIENTE]'}, a usted respetuosamente digo:

I. PETITORIO:
Interpongo RECURSO DE APELACIÓN contra la resolución N° [NÚMERO], de fecha [FECHA], que [CONTENIDO DE LA RESOLUCIÓN APELADA], solicitando sea REVOCADA por la Superior Sala.

II. FUNDAMENTOS DEL RECURSO:

PRIMERO.- AGRAVIO: La resolución apelada me causa agravio porque [explicar el perjuicio]

SEGUNDO.- ERROR DE HECHO: El A quo ha incurrido en error al [señalar el error fáctico]

TERCERO.- ERROR DE DERECHO: Se ha aplicado incorrectamente [norma legal] porque [fundamentar]

CUARTO.- VALORACIÓN PROBATORIA: No se han valorado adecuadamente los medios probatorios [especificar]

III. FUNDAMENTOS JURÍDICOS:
- Artículo 364° del Código Procesal Civil
- [Normas sustantivas aplicables al caso]

POR TANTO:
Solicito se conceda el recurso y se eleve a la Superior Sala para su revisión.

Lima, [FECHA]

_________________________
${formData.demandante || '[NOMBRE DEL APELANTE]'}`;
  };

  const generateCasacion = () => {
    return `RECURSO DE CASACIÓN

SEÑORES MAGISTRADOS DE LA SALA CIVIL PERMANENTE DE LA CORTE SUPREMA

${formData.demandante || '[NOMBRE DEL RECURRENTE]'}, en el proceso seguido contra ${formData.demandado || '[DEMANDADO]'} sobre ${formData.materia}, Expediente N° ${formData.expediente || '[N° EXPEDIENTE]'}, a ustedes respetuosamente digo:

I. PETITORIO:
Interpongo RECURSO DE CASACIÓN contra la sentencia de vista expedida por la [SALA SUPERIOR], solicitando sea CASADA por las causales que invoco.

II. CAUSALES:

PRIMERA CAUSAL: INFRACCIÓN NORMATIVA DEL DERECHO MATERIAL
Se ha infringido el artículo [NÚMERO] del [CÓDIGO/LEY] porque [fundamentar la infracción]

SEGUNDA CAUSAL: APARTAMIENTO INMOTIVADO DEL PRECEDENTE JUDICIAL
La Sala ha desconocido el precedente establecido en [CASACIÓN N°] sin justificación alguna.

III. DESARROLLO DE LAS CAUSALES:

[Desarrollo detallado de cada causal invocada con sustento jurisprudencial y doctrinario]

IV. INTERÉS CASACIONAL:
El presente caso reviste interés casacional porque [explicar la trascendencia jurídica]

POR TANTO:
Solicito se declare PROCEDENTE el recurso y se case la sentencia impugnada.

Lima, [FECHA]

_________________________
${formData.demandante || '[NOMBRE DEL RECURRENTE]'}`;
  };

  const generateEscrito = () => {
    return `ESCRITO

SEÑOR JUEZ DEL ${formData.juzgado || '[JUZGADO]'}

${formData.demandante || '[NOMBRE]'}, en el proceso que sigo contra ${formData.demandado || '[DEMANDADO]'} sobre ${formData.materia}, Expediente N° ${formData.expediente || '[N° EXPEDIENTE]'}, a usted respetuosamente digo:

I. PETITORIO:
Solicito [PETICIÓN ESPECÍFICA]

II. FUNDAMENTOS:

PRIMERO.- [Fundamento principal de la solicitud]
SEGUNDO.- [Fundamentos adicionales]
TERCERO.- [Base legal de la petición]

III. FUNDAMENTOS DE DERECHO:
- [Artículos del CPC o normas aplicables]

POR TANTO:
Solicito proveer conforme a lo solicitado.

Lima, [FECHA]

_________________________
${formData.demandante || '[NOMBRE]'}`;
  };

  const generateAlegatos = () => {
    return `ALEGATOS DE CLAUSURA

SEÑOR JUEZ DEL ${formData.juzgado || '[JUZGADO]'}

En la audiencia de juzgamiento del proceso seguido por ${formData.demandante || '[DEMANDANTE]'} contra ${formData.demandado || '[DEMANDADO]'} sobre ${formData.materia}, Expediente N° ${formData.expediente || '[N° EXPEDIENTE]'}, expongo los siguientes alegatos:

I. RESUMEN DE LA CONTROVERSIA:
[Síntesis del conflicto jurídico planteado]

II. ANÁLISIS PROBATORIO:

PRIMERO.- Los medios probatorios han acreditado que [análisis de las pruebas]
SEGUNDO.- La prueba documental demuestra [valoración específica]
TERCERO.- [Otros elementos probatorios relevantes]

III. APLICACIÓN DEL DERECHO:
Conforme a [normas aplicables], corresponde [conclusión jurídica]

IV. CONCLUSIÓN:
Por los fundamentos expuestos, solicito se declare FUNDADA la demanda en todos sus extremos.

Lima, [FECHA]

_________________________
Abogado de la parte [DEMANDANTE/DEMANDADA]`;
  };

  const downloadDocument = () => {
    const element = document.createElement('a');
    const file = new Blob([documentContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${selectedTemplate}_${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(documentContent);
    alert('Documento copiado al portapapeles');
  };

  return (
    <div style={{ padding: '20px' }}>
      <div className="section-header">
        <h2 className="section-title">Redactor IA</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          {documentContent && (
            <>
              <button className="btn btn-secondary" onClick={copyToClipboard}>
                📋 Copiar
              </button>
              <button className="btn btn-primary" onClick={downloadDocument}>
                💾 Descargar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Selección de plantillas */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: '#1e293b', marginBottom: '16px', fontSize: '18px' }}>
          📄 Seleccionar Plantilla
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '16px' 
        }}>
          {templates.map(template => (
            <div
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              style={{
                padding: '20px',
                border: `2px solid ${selectedTemplate === template.id ? template.color : '#e2e8f0'}`,
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: selectedTemplate === template.id 
                  ? `${template.color}10` 
                  : 'white',
                transform: selectedTemplate === template.id ? 'scale(1.02)' : 'scale(1)'
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '24px' }}>{template.icon}</span>
                <h4 style={{ 
                  color: selectedTemplate === template.id ? template.color : '#1e293b',
                  margin: 0,
                  fontWeight: '600'
                }}>
                  {template.name}
                </h4>
              </div>
              <p style={{ 
                color: '#64748b', 
                fontSize: '14px', 
                margin: 0,
                lineHeight: '1.4'
              }}>
                {template.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Formulario de datos */}
      {selectedTemplate && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <h3 className="card-title">📝 Datos del Documento</h3>
          </div>
          <div className="card-content">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Demandante/Solicitante</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.demandante}
                  onChange={(e) => setFormData({...formData, demandante: e.target.value})}
                  placeholder="Nombre completo"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Demandado/Emplazado</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.demandado}
                  onChange={(e) => setFormData({...formData, demandado: e.target.value})}
                  placeholder="Nombre completo"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Materia</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.materia}
                  onChange={(e) => setFormData({...formData, materia: e.target.value})}
                  placeholder="Ej: Obligación de dar suma de dinero"
                />
              </div>
              <div className="form-group">
                <label className="form-label">N° Expediente</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.expediente}
                  onChange={(e) => setFormData({...formData, expediente: e.target.value})}
                  placeholder="Ej: 00123-2024-0-1801-JR-CI-01"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Juzgado</label>
              <input
                type="text"
                className="form-input"
                value={formData.juzgado}
                onChange={(e) => setFormData({...formData, juzgado: e.target.value})}
                placeholder="Ej: Primer Juzgado Civil de Lima"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Pretensión</label>
              <textarea
                className="form-textarea"
                value={formData.pretension}
                onChange={(e) => setFormData({...formData, pretension: e.target.value})}
                placeholder="Describir lo que se solicita..."
                rows="3"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Hechos Principales</label>
              <textarea
                className="form-textarea"
                value={formData.hechos}
                onChange={(e) => setFormData({...formData, hechos: e.target.value})}
                placeholder="Narrar los hechos relevantes del caso..."
                rows="4"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Fundamentos Jurídicos</label>
              <textarea
                className="form-textarea"
                value={formData.fundamentosJuridicos}
                onChange={(e) => setFormData({...formData, fundamentosJuridicos: e.target.value})}
                placeholder="Artículos y normas aplicables..."
                rows="3"
              />
            </div>

            <button 
              className="btn btn-primary"
              onClick={generateDocument}
              disabled={isGenerating}
              style={{ width: '100%', marginTop: '16px' }}
            >
              {isGenerating ? '🤖 Generando documento...' : '✨ Generar Documento'}
            </button>
          </div>
        </div>
      )}

      {/* Indicador de generación */}
      {isGenerating && (
        <div style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          padding: '24px',
          borderRadius: '12px',
          textAlign: 'center',
          marginBottom: '24px',
          border: '2px solid #0ea5e9'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
          <h3 style={{ color: '#0c4a6e', marginBottom: '8px' }}>
            Generando documento con IA...
          </h3>
          <p style={{ color: '#075985' }}>
            Creando contenido personalizado basado en tus datos
          </p>
          <div style={{
            width: '200px',
            height: '4px',
            background: '#e5e7eb',
            borderRadius: '2px',
            margin: '16px auto',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, #0ea5e9, #0284c7)',
              animation: 'loading 2s ease-in-out infinite'
            }}></div>
          </div>
        </div>
      )}

      {/* Documento generado */}
      {documentContent && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📄 Documento Generado</h3>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Editable • Personalizable
            </div>
          </div>
          <div className="card-content">
            <textarea
              value={documentContent}
              onChange={(e) => setDocumentContent(e.target.value)}
              style={{
                width: '100%',
                minHeight: '500px',
                padding: '20px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '14px',
                lineHeight: '1.6',
                resize: 'vertical',
                background: '#fafafa'
              }}
            />
            <div style={{ 
              marginTop: '16px', 
              padding: '12px', 
              background: '#f0f9ff', 
              borderRadius: '8px',
              border: '1px solid #bae6fd'
            }}>
              <p style={{ 
                color: '#0c4a6e', 
                fontSize: '14px', 
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>💡</span>
                <strong>Tip:</strong> Puedes editar directamente el texto generado para personalizarlo según tu caso específico.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Información inicial */}
      {!selectedTemplate && (
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          padding: '32px',
          borderRadius: '16px',
          textAlign: 'center',
          border: '2px dashed #f59e0b'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>✍️</div>
          <h3 style={{ color: '#92400e', marginBottom: '12px' }}>
            Redactor IA - Asistente Jurídico
          </h3>
          <p style={{ color: '#a16207', marginBottom: '24px', maxWidth: '600px', margin: '0 auto 24px' }}>
            Genera automáticamente documentos jurídicos profesionales usando inteligencia artificial. 
            Selecciona una plantilla y completa los datos para crear tu documento.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '24px' }}>
            <div style={{ padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #fcd34d' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📄</div>
              <h4 style={{ color: '#92400e', marginBottom: '8px' }}>Plantillas</h4>
              <p style={{ color: '#a16207', fontSize: '14px' }}>
                Múltiples tipos de documentos jurídicos
              </p>
            </div>
            <div style={{ padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #fcd34d' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🤖</div>
              <h4 style={{ color: '#92400e', marginBottom: '8px' }}>IA Avanzada</h4>
              <p style={{ color: '#a16207', fontSize: '14px' }}>
                Generación inteligente de contenido
              </p>
            </div>
            <div style={{ padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #fcd34d' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>✏️</div>
              <h4 style={{ color: '#92400e', marginBottom: '8px' }}>Editable</h4>
              <p style={{ color: '#a16207', fontSize: '14px' }}>
                Personaliza y ajusta según tu caso
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

export default RedactorIA;