import React, { useState, useRef } from 'react';

function Transcripcion() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [summary, setSummary] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [keyPoints, setKeyPoints] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setAudioFile(file);
      // Simular procesamiento
      simulateTranscription(file.name);
    }
  };

  const simulateTranscription = (fileName) => {
    setIsProcessing(true);
    
    // Simular transcripción después de 3 segundos
    setTimeout(() => {
      const sampleTranscription = `TRANSCRIPCIÓN DE AUDIENCIA - ${fileName}

JUEZ: Buenos días, damos inicio a la audiencia de conciliación en el expediente número 00123-2024-0-1801-JR-CI-01, seguido por Juan Pérez contra María García sobre obligación de dar suma de dinero.

DEMANDANTE: Buenos días, su señoría. Mi representado solicita el pago de la suma de S/ 50,000.00 soles por concepto de préstamo otorgado a la demandada el 15 de enero del 2023.

DEMANDADA: Su señoría, reconozco la deuda, pero solicito facilidades de pago debido a mi situación económica actual. Propongo pagar en cuotas mensuales de S/ 2,500.00 soles.

JUEZ: ¿La parte demandante acepta la propuesta de pago fraccionado?

DEMANDANTE: Su señoría, podríamos aceptar el pago en 18 cuotas mensuales de S/ 2,777.78 soles, con la primera cuota al 15 de febrero del 2024.

DEMANDADA: Acepto la propuesta, su señoría.

JUEZ: Perfecto, se ha llegado a un acuerdo conciliatorio. Se procederá a redactar el acta correspondiente.`;

      const sampleSummary = `RESUMEN EJECUTIVO:
• Caso: Obligación de dar suma de dinero
• Monto: S/ 50,000.00 soles
• Acuerdo: Pago fraccionado en 18 cuotas de S/ 2,777.78
• Primera cuota: 15 de febrero 2024
• Estado: Conciliación exitosa`;

      const sampleKeyPoints = [
        'Reconocimiento de deuda por parte de la demandada',
        'Solicitud de facilidades de pago',
        'Acuerdo conciliatorio alcanzado',
        'Pago fraccionado en 18 cuotas mensuales',
        'Primera cuota programada para el 15/02/2024'
      ];

      setTranscription(sampleTranscription);
      setSummary(sampleSummary);
      setKeyPoints(sampleKeyPoints);
      setIsProcessing(false);
    }, 3000);
  };

  const startRecording = () => {
    setIsRecording(true);
    // Simular grabación por 5 segundos
    setTimeout(() => {
      setIsRecording(false);
      simulateTranscription('Grabación en vivo');
    }, 5000);
  };

  const downloadTranscription = () => {
    const element = document.createElement('a');
    const file = new Blob([transcription], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'transcripcion_audiencia.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div style={{ padding: '20px' }}>
      <div className="section-header">
        <h2 className="section-title">Transcripción Inteligente</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
          >
            📁 Subir Audio
          </button>
          <button 
            className={`btn ${isRecording ? 'btn-danger' : 'btn-secondary'}`}
            onClick={startRecording}
            disabled={isProcessing || isRecording}
          >
            {isRecording ? '🔴 Grabando...' : '🎤 Grabar'}
          </button>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="audio/*,video/*"
        style={{ display: 'none' }}
      />

      {/* Panel de estado */}
      <div style={{ 
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '20px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>
              {isProcessing ? '⏳' : audioFile ? '✅' : '📁'}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>
              {isProcessing ? 'Procesando...' : audioFile ? 'Archivo cargado' : 'Sin archivo'}
            </div>
            {audioFile && (
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                {audioFile.name}
              </div>
            )}
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>
              {isRecording ? '🔴' : '⏸️'}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>
              {isRecording ? 'Grabando en vivo' : 'Grabación detenida'}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>
              {transcription ? '📝' : '⏳'}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>
              {transcription ? 'Transcripción lista' : 'Esperando audio'}
            </div>
          </div>
        </div>
      </div>

      {/* Indicador de procesamiento */}
      {isProcessing && (
        <div style={{
          background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '20px',
          textAlign: 'center',
          border: '2px solid #3b82f6'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🤖</div>
          <h3 style={{ color: '#1e40af', marginBottom: '8px' }}>Procesando con IA...</h3>
          <p style={{ color: '#3730a3', marginBottom: '16px' }}>
            Transcribiendo audio y generando resumen automático
          </p>
          <div style={{
            width: '100%',
            height: '8px',
            background: '#e5e7eb',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
              animation: 'loading 2s ease-in-out infinite'
            }}></div>
          </div>
        </div>
      )}

      {/* Resultados */}
      {transcription && (
        <div style={{ display: 'grid', gap: '20px' }}>
          {/* Transcripción completa */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">📝 Transcripción Completa</h3>
              <button 
                className="btn btn-secondary"
                onClick={downloadTranscription}
              >
                💾 Descargar
              </button>
            </div>
            <div className="card-content">
              <textarea
                value={transcription}
                onChange={(e) => setTranscription(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '300px',
                  padding: '16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>

          {/* Resumen y puntos clave */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">📋 Resumen Ejecutivo</h3>
              </div>
              <div className="card-content">
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '200px',
                    padding: '16px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">🎯 Puntos Clave</h3>
              </div>
              <div className="card-content">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {keyPoints.map((point, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '12px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <span style={{
                        background: '#3b82f6',
                        color: 'white',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        flexShrink: 0
                      }}>
                        {index + 1}
                      </span>
                      <span style={{ fontSize: '14px', lineHeight: '1.5' }}>
                        {point}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Información de funcionalidades */}
      {!transcription && !isProcessing && (
        <div style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          padding: '32px',
          borderRadius: '16px',
          textAlign: 'center',
          border: '2px dashed #0ea5e9'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎤</div>
          <h3 style={{ color: '#0c4a6e', marginBottom: '12px' }}>
            Transcripción Inteligente de Audiencias
          </h3>
          <p style={{ color: '#075985', marginBottom: '24px', maxWidth: '600px', margin: '0 auto 24px' }}>
            Convierte automáticamente el audio de tus audiencias en texto, genera resúmenes ejecutivos 
            y extrae los puntos clave más importantes.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginTop: '24px' }}>
            <div style={{ padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #bae6fd' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎧</div>
              <h4 style={{ color: '#0c4a6e', marginBottom: '8px' }}>Audio a Texto</h4>
              <p style={{ color: '#075985', fontSize: '14px' }}>
                Transcripción automática con alta precisión
              </p>
            </div>
            <div style={{ padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #bae6fd' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📝</div>
              <h4 style={{ color: '#0c4a6e', marginBottom: '8px' }}>Resumen IA</h4>
              <p style={{ color: '#075985', fontSize: '14px' }}>
                Resúmenes ejecutivos generados automáticamente
              </p>
            </div>
            <div style={{ padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #bae6fd' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎯</div>
              <h4 style={{ color: '#0c4a6e', marginBottom: '8px' }}>Puntos Clave</h4>
              <p style={{ color: '#075985', fontSize: '14px' }}>
                Extracción automática de información relevante
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
        
        .btn-danger {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          animation: pulse 1.5s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

export default Transcripcion;