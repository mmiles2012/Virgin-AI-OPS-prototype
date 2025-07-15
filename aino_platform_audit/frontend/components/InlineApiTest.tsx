import { useState } from 'react';

export default function InlineApiTest({ onClose }: { onClose: () => void }) {
  const [results, setResults] = useState<string>('');

  const handleAviationStackTest = () => {
    console.log('AviationStack test triggered');
    setResults(prev => prev + '\n[Testing AviationStack...]');
    
    fetch('/api/aviation/test-aviationstack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
      console.log('AviationStack result:', data);
      setResults(prev => prev + '\nAviationStack: ' + (data.success ? 'SUCCESS - ' + data.message : 'FAILED - ' + data.message));
    })
    .catch(error => {
      console.error('AviationStack error:', error);
      setResults(prev => prev + '\nAviationStack: ERROR - ' + error.message);
    });
  };

  const handleOpenSkyTest = () => {
    console.log('OpenSky test triggered');
    setResults(prev => prev + '\n[Testing OpenSky...]');
    
    fetch('/api/aviation/test-opensky', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
      console.log('OpenSky result:', data);
      setResults(prev => prev + '\nOpenSky: ' + (data.success ? 'SUCCESS - ' + data.message : 'FAILED - ' + data.message));
    })
    .catch(error => {
      console.error('OpenSky error:', error);
      setResults(prev => prev + '\nOpenSky: ERROR - ' + error.message);
    });
  };

  const handleMapboxTest = () => {
    console.log('Mapbox test triggered');
    setResults(prev => prev + '\n[Testing Mapbox...]');
    
    fetch('/api/aviation/test-mapbox', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
      console.log('Mapbox result:', data);
      setResults(prev => prev + '\nMapbox: ' + (data.success ? 'SUCCESS - ' + data.message : 'FAILED - ' + data.message));
    })
    .catch(error => {
      console.error('Mapbox error:', error);
      setResults(prev => prev + '\nMapbox: ERROR - ' + error.message);
    });
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        pointerEvents: 'auto'
      }}
    >
      <div 
        style={{
          backgroundColor: '#1f2937',
          border: '1px solid #4b5563',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '80vh',
          overflow: 'auto',
          pointerEvents: 'auto'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
            Aviation API Test Panel
          </h2>
          <button 
            onClick={() => {
              console.log('Close button clicked');
              onClose();
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '8px'
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={handleAviationStackTest}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '12px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#1d4ed8';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
            }}
          >
            Test AviationStack API
          </button>

          <button
            onClick={handleOpenSkyTest}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '12px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#047857';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#059669';
            }}
          >
            Test OpenSky Network
          </button>

          <button
            onClick={handleMapboxTest}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#6d28d9';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#7c3aed';
            }}
          >
            Test Mapbox API
          </button>
        </div>

        {results && (
          <div>
            <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
              Test Results:
            </h3>
            <pre 
              style={{
                backgroundColor: '#111827',
                color: '#e5e7eb',
                padding: '12px',
                borderRadius: '6px',
                fontSize: '12px',
                whiteSpace: 'pre-wrap',
                overflow: 'auto',
                maxHeight: '200px',
                border: '1px solid #374151'
              }}
            >
              {results}
            </pre>
            <button
              onClick={() => {
                console.log('Clear results clicked');
                setResults('');
              }}
              style={{
                marginTop: '12px',
                padding: '8px 16px',
                backgroundColor: '#4b5563',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Clear Results
            </button>
          </div>
        )}
      </div>
    </div>
  );
}