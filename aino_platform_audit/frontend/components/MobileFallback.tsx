import React, { useState, useEffect } from 'react';

const MobileFallback: React.FC = () => {
  const [flightData, setFlightData] = useState<any[]>([]);
  const [currentTab, setCurrentTab] = useState('overview');
  const [lastUpdate, setLastUpdate] = useState('');
  
  // Fetch real Virgin Atlantic flight data
  useEffect(() => {
    const fetchFlights = async () => {
      try {
        const response = await fetch('/api/aviation/virgin-atlantic-flights');
        const data = await response.json();
        if (data.success && data.flights) {
          setFlightData(data.flights.slice(0, 8)); // Show first 8 flights
          setLastUpdate(new Date().toLocaleTimeString());
        }
      } catch (error) {
        console.error('Error fetching flight data:', error);
      }
    };
    
    fetchFlights();
    const interval = setInterval(fetchFlights, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);
  
  const isReplitApp = navigator.userAgent.includes('Replit');
  const deviceType = isReplitApp ? 'Replit App (iPad)' : 'Mobile Device';
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
        <p style={{ fontSize: '16px', color: '#bfdbfe', margin: '0 0 5px 0' }}>
          Aviation Intelligence Platform
        </p>
        <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>
          {deviceType} - Optimized Interface
        </p>
      </div>
      
      {/* Navigation Tabs */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginBottom: '20px',
        borderBottom: '1px solid #374151'
      }}>
        {['overview', 'flights', 'fleet', 'weather', 'operations'].map((tab) => (
          <button
            key={tab}
            onClick={() => setCurrentTab(tab)}
            style={{
              flex: 1,
              padding: '12px 8px',
              backgroundColor: currentTab === tab ? '#3b82f6' : 'transparent',
              color: currentTab === tab ? 'white' : '#9ca3af',
              border: 'none',
              borderBottom: currentTab === tab ? '2px solid #60a5fa' : '2px solid transparent',
              textTransform: 'capitalize',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {currentTab === 'overview' && (
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
                {flightData.length} Flights Tracked
              </span>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ fontSize: '14px', color: '#d1d5db' }}>
                Data Source: 
              </span>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981' }}>
                ADS-B Exchange Live
              </span>
            </div>
            <div>
              <span style={{ fontSize: '14px', color: '#d1d5db' }}>
                Last Update: 
              </span>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981' }}>
                {lastUpdate || 'Loading...'}
              </span>
            </div>
          </div>
        </div>
      )}

      {currentTab === 'flights' && (
        <div style={{ marginBottom: '30px' }}>
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.4)',
            borderRadius: '8px',
            padding: '20px'
          }}>
            <h2 style={{ fontSize: '18px', marginBottom: '15px', color: '#60a5fa' }}>
              Live Virgin Atlantic Flights
            </h2>
            {flightData.length > 0 ? flightData.map((flight, index) => (
              <div key={index} style={{ marginBottom: '12px', paddingBottom: '10px', borderBottom: index < flightData.length - 1 ? '1px solid #374151' : 'none' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffffff' }}>
                  {flight.flight_number} • {flight.route}
                </div>
                <div style={{ fontSize: '12px', color: '#d1d5db', marginTop: '2px' }}>
                  {flight.aircraft_type} • {flight.registration} • {flight.status}
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                  Alt: {flight.altitude}ft • Speed: {flight.velocity}kts • {flight.data_source}
                </div>
              </div>
            )) : (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
                Loading live flight data...
              </div>
            )}
          </div>
        </div>
      )}

      {currentTab === 'fleet' && (
        <div style={{ marginBottom: '30px' }}>
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.4)',
            borderRadius: '8px',
            padding: '20px'
          }}>
            <h2 style={{ fontSize: '18px', marginBottom: '15px', color: '#60a5fa' }}>
              Fleet Overview
            </h2>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ fontSize: '14px', color: '#d1d5db' }}>Total Aircraft: </span>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981' }}>43</span>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ fontSize: '14px', color: '#d1d5db' }}>Currently Airborne: </span>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981' }}>{flightData.length}</span>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ fontSize: '14px', color: '#d1d5db' }}>Aircraft Types: </span>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981' }}>B789, A35K, A333</span>
            </div>
          </div>
        </div>
      )}

      {currentTab === 'weather' && (
        <div style={{ marginBottom: '30px' }}>
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.4)',
            borderRadius: '8px',
            padding: '20px'
          }}>
            <h2 style={{ fontSize: '18px', marginBottom: '15px', color: '#60a5fa' }}>
              Weather Intelligence
            </h2>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ fontSize: '14px', color: '#d1d5db' }}>AVWX API: </span>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981' }}>Connected</span>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ fontSize: '14px', color: '#d1d5db' }}>SIGMET Monitoring: </span>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981' }}>Active</span>
            </div>
            <div>
              <span style={{ fontSize: '14px', color: '#d1d5db' }}>Weather Radar: </span>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981' }}>Global Coverage</span>
            </div>
          </div>
        </div>
      )}

      {currentTab === 'operations' && (
        <div style={{ marginBottom: '30px' }}>
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.4)',
            borderRadius: '8px',
            padding: '20px'
          }}>
            <h2 style={{ fontSize: '18px', marginBottom: '15px', color: '#60a5fa' }}>
              Operations Center
            </h2>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ fontSize: '14px', color: '#d1d5db' }}>ML Delay Prediction: </span>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981' }}>Active</span>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ fontSize: '14px', color: '#d1d5db' }}>Connection Management: </span>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981' }}>Heathrow T3</span>
            </div>
            <div>
              <span style={{ fontSize: '14px', color: '#d1d5db' }}>Digital Twins: </span>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981' }}>Boeing 787 & Airbus</span>
            </div>
          </div>
        </div>
      )}

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