import React from 'react';

const MobileFallback: React.FC = () => {
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#1e3a8a',
        color: 'white',
        padding: '20px',
        overflow: 'auto',
        zIndex: 10000,
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '28px', margin: '0 0 10px 0', fontWeight: 'bold' }}>
          AINO
        </h1>
        <p style={{ fontSize: '16px', color: '#bfdbfe', margin: 0 }}>
          Aviation Intelligence Platform
        </p>
      </div>
      
      <div style={{ marginBottom: '30px' }}>
        <div style={{
          backgroundColor: 'rgba(0,0,0,0.4)',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h2 style={{ fontSize: '18px', marginBottom: '15px', color: '#60a5fa' }}>
            Live Operations Status
          </h2>
          <div style={{ marginBottom: '10px' }}>
            <span style={{ fontSize: '14px', color: '#d1d5db' }}>
              Virgin Atlantic Fleet: 
            </span>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981' }}>
              40 Aircraft Active
            </span>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <span style={{ fontSize: '14px', color: '#d1d5db' }}>
              Weather Data: 
            </span>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981' }}>
              AVWX Connected
            </span>
          </div>
          <div>
            <span style={{ fontSize: '14px', color: '#d1d5db' }}>
              Flight Tracking: 
            </span>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981' }}>
              OpenSky Network Active
            </span>
          </div>
        </div>

        <div style={{
          backgroundColor: 'rgba(0,0,0,0.4)',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h2 style={{ fontSize: '18px', marginBottom: '15px', color: '#60a5fa' }}>
            Current Flight Activity
          </h2>
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>VS001 LHR-JFK</div>
            <div style={{ fontSize: '12px', color: '#d1d5db' }}>Boeing 787-9 • En Route • On Time</div>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>VS011 LHR-BOS</div>
            <div style={{ fontSize: '12px', color: '#d1d5db' }}>Airbus A330-300 • Boarding • On Time</div>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>VS025 LHR-EWR</div>
            <div style={{ fontSize: '12px', color: '#d1d5db' }}>Boeing 787-9 • Preparing • 5min Delay</div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '20px' }}>
        <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: '1.5' }}>
          For full functionality including interactive maps, digital twins, and detailed analytics, 
          please access AINO on a desktop or laptop computer.
        </p>
        <div style={{ marginTop: '20px' }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '12px 24px',
              fontSize: '16px',
              cursor: 'pointer',
              touchAction: 'manipulation'
            }}
          >
            Refresh Platform
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileFallback;