import { useState } from 'react';

export default function ApiTestPanel({ onClose }: { onClose: () => void }) {
  console.log('ApiTestPanel mounted');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const testApi = async (endpoint: string, name: string) => {
    console.log(`Testing ${name} API...`);
    setLoading(true);
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      console.log(`${name} result:`, result);
      
      setTestResults(prev => [...prev, {
        name,
        success: result.success,
        message: result.message,
        data: result.data
      }]);
    } catch (error) {
      console.error(`${name} error:`, error);
      setTestResults(prev => [...prev, {
        name,
        success: false,
        message: `Error: ${error}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">API Connection Test</h2>
          <button 
            onClick={() => {
              console.log('Close button clicked');
              onClose();
            }}
            className="text-gray-400 hover:text-white p-2"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <button
            onMouseDown={(e) => {
              e.stopPropagation();
              console.log('AviationStack button mousedown');
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
              e.preventDefault();
              console.log('Testing AviationStack button clicked');
              testApi('/api/aviation/test-aviationstack', 'AviationStack');
            }}
            disabled={loading}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
            style={{ pointerEvents: 'auto' }}
          >
            {loading ? 'Testing...' : 'Test AviationStack API'}
          </button>

          <button
            onClick={() => {
              console.log('Testing OpenSky button clicked');
              testApi('/api/aviation/test-opensky', 'OpenSky Network');
            }}
            disabled={loading}
            className="w-full px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Testing...' : 'Test OpenSky Network'}
          </button>

          <button
            onClick={() => {
              console.log('Testing Mapbox button clicked');
              testApi('/api/aviation/test-mapbox', 'Mapbox');
            }}
            disabled={loading}
            className="w-full px-4 py-3 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Testing...' : 'Test Mapbox API'}
          </button>
        </div>

        {testResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">Test Results:</h3>
            {testResults.map((result, index) => (
              <div key={index} className={`p-4 rounded border ${
                result.success 
                  ? 'bg-green-900/20 border-green-600 text-green-300' 
                  : 'bg-red-900/20 border-red-600 text-red-300'
              }`}>
                <div className="font-medium">{result.name}</div>
                <div className="text-sm mt-1">{result.message}</div>
                {result.data && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs">View Data</summary>
                    <pre className="text-xs mt-2 p-2 bg-gray-800 rounded overflow-x-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => {
              console.log('Clear results button clicked');
              setTestResults([]);
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Clear Results
          </button>
        </div>
      </div>
    </div>
  );
}