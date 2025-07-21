import { useEffect, useRef } from 'react';

export default function DirectApiTest({ onClose }: { onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('DirectApiTest mounted');
    
    const testAviationStack = async () => {
      console.log('Testing AviationStack API directly');
      try {
        const response = await fetch('/api/aviation/test-aviationstack', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        console.log('AviationStack result:', result);
        
        const resultDiv = document.getElementById('aviationstack-result');
        if (resultDiv) {
          resultDiv.innerHTML = `
            <div class="p-4 rounded ${result.success ? 'bg-aero-green-safe/10 border border-aero-green-safe/30 text-green-300' : 'bg-va-red-primary/10 border border-va-red-primary/30 text-red-300'}">
              <div class="font-medium">AviationStack</div>
              <div class="text-sm mt-1">${result.message}</div>
              ${result.data ? `<pre class="text-xs mt-2 p-2 bg-card rounded overflow-x-auto">${JSON.stringify(result.data, null, 2)}</pre>` : ''}
            </div>
          `;
        }
      } catch (error) {
        console.error('AviationStack error:', error);
      }
    };

    const testOpenSky = async () => {
      console.log('Testing OpenSky API directly');
      try {
        const response = await fetch('/api/aviation/test-opensky', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        console.log('OpenSky result:', result);
        
        const resultDiv = document.getElementById('opensky-result');
        if (resultDiv) {
          resultDiv.innerHTML = `
            <div class="p-4 rounded ${result.success ? 'bg-aero-green-safe/10 border border-aero-green-safe/30 text-green-300' : 'bg-va-red-primary/10 border border-va-red-primary/30 text-red-300'}">
              <div class="font-medium">OpenSky Network</div>
              <div class="text-sm mt-1">${result.message}</div>
              ${result.data ? `<pre class="text-xs mt-2 p-2 bg-card rounded overflow-x-auto">${JSON.stringify(result.data, null, 2)}</pre>` : ''}
            </div>
          `;
        }
      } catch (error) {
        console.error('OpenSky error:', error);
      }
    };

    const testMapbox = async () => {
      console.log('Testing Mapbox API directly');
      try {
        const response = await fetch('/api/aviation/test-mapbox', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        console.log('Mapbox result:', result);
        
        const resultDiv = document.getElementById('mapbox-result');
        if (resultDiv) {
          resultDiv.innerHTML = `
            <div class="p-4 rounded ${result.success ? 'bg-aero-green-safe/10 border border-aero-green-safe/30 text-green-300' : 'bg-va-red-primary/10 border border-va-red-primary/30 text-red-300'}">
              <div class="font-medium">Mapbox</div>
              <div class="text-sm mt-1">${result.message}</div>
              ${result.data ? `<pre class="text-xs mt-2 p-2 bg-card rounded overflow-x-auto">${JSON.stringify(result.data, null, 2)}</pre>` : ''}
            </div>
          `;
        }
      } catch (error) {
        console.error('Mapbox error:', error);
      }
    };

    // Add event listeners directly to DOM elements
    const aviationStackBtn = document.getElementById('test-aviationstack');
    const openSkyBtn = document.getElementById('test-opensky');
    const mapboxBtn = document.getElementById('test-mapbox');
    const closeBtn = document.getElementById('close-panel');

    if (aviationStackBtn) {
      aviationStackBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('AviationStack button clicked via DOM');
        testAviationStack();
      });
    }

    if (openSkyBtn) {
      openSkyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('OpenSky button clicked via DOM');
        testOpenSky();
      });
    }

    if (mapboxBtn) {
      mapboxBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Mapbox button clicked via DOM');
        testMapbox();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Close button clicked via DOM');
        onClose();
      });
    }

    return () => {
      // Cleanup event listeners
      if (aviationStackBtn) aviationStackBtn.removeEventListener('click', testAviationStack);
      if (openSkyBtn) openSkyBtn.removeEventListener('click', testOpenSky);
      if (mapboxBtn) mapboxBtn.removeEventListener('click', testMapbox);
      if (closeBtn) closeBtn.removeEventListener('click', () => onClose());
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4" style={{ zIndex: 9999, pointerEvents: 'auto' }} ref={containerRef}>
      <div className="bg-card border border-border rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ pointerEvents: 'auto' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">API Connection Test (Direct DOM)</h2>
          <button 
            id="close-panel"
            className="text-muted-foreground hover:text-foreground p-2 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <button
            id="test-aviationstack"
            className="w-full px-4 py-3 bg-aero-blue-primary text-foreground rounded hover:bg-aero-blue-light transition-colors cursor-pointer"
          >
            Test AviationStack API
          </button>

          <button
            id="test-opensky"
            className="w-full px-4 py-3 bg-green-600 text-foreground rounded hover:bg-green-700 transition-colors cursor-pointer"
          >
            Test OpenSky Network
          </button>

          <button
            id="test-mapbox"
            className="w-full px-4 py-3 bg-purple-600 text-foreground rounded hover:bg-purple-700 transition-colors cursor-pointer"
          >
            Test Mapbox API
          </button>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Test Results:</h3>
          <div id="aviationstack-result"></div>
          <div id="opensky-result"></div>
          <div id="mapbox-result"></div>
        </div>
      </div>
    </div>
  );
}