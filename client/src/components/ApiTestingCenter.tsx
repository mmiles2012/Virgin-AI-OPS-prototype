import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Zap, Plane } from 'lucide-react';

interface ApiTestResult {
  success: boolean;
  message: string;
  data?: any;
}

interface ApiTestingCenterProps {}

export const ApiTestingCenter: React.FC<ApiTestingCenterProps> = () => {
  const [testResults, setTestResults] = useState<Record<string, ApiTestResult>>({});
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [testingStates, setTestingStates] = useState<Record<string, boolean>>({});

  const apiEndpoints = [
    {
      name: 'Aviation Stack',
      key: 'aviationStack',
      endpoint: '/api/aviation/test-aviation-stack',
      description: 'Primary flight tracking API with comprehensive Virgin Atlantic data'
    },
    {
      name: 'Aviation Edge',
      key: 'aviationEdge', 
      endpoint: '/api/aviation/test-aviation-edge',
      description: 'Alternative flight tracking API for enhanced data coverage'
    },
    {
      name: 'OpenSky Network',
      key: 'opensky',
      endpoint: '/api/aviation/test-opensky',
      description: 'Global aircraft position tracking for real-time visualization'
    },
    {
      name: 'Mapbox',
      key: 'mapbox',
      endpoint: '/api/aviation/test-mapbox',
      description: 'Satellite imagery and geospatial mapping services'
    }
  ];

  const testApi = async (endpoint: string, key: string) => {
    setTestingStates(prev => ({ ...prev, [key]: true }));
    
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      setTestResults(prev => ({ ...prev, [key]: result }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        [key]: {
          success: false,
          message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }));
    } finally {
      setTestingStates(prev => ({ ...prev, [key]: false }));
    }
  };

  const testAllApis = async () => {
    setIsTestingAll(true);
    
    for (const api of apiEndpoints) {
      await testApi(api.endpoint, api.key);
      // Add small delay between tests to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsTestingAll(false);
  };

  const getStatusIcon = (result: ApiTestResult | undefined, isLoading: boolean) => {
    if (isLoading) {
      return <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />;
    }
    
    if (!result) {
      return <AlertTriangle className="w-5 h-5 text-gray-400" />;
    }
    
    return result.success 
      ? <CheckCircle className="w-5 h-5 text-green-400" />
      : <XCircle className="w-5 h-5 text-red-400" />;
  };

  const getStatusColor = (result: ApiTestResult | undefined, isLoading: boolean) => {
    if (isLoading) return 'border-blue-500/50 bg-blue-900/20';
    if (!result) return 'border-gray-600/50 bg-gray-900/20';
    return result.success 
      ? 'border-green-500/50 bg-green-900/20'
      : 'border-red-500/50 bg-red-900/20';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Aviation API Testing Center</h2>
          <p className="text-gray-300 text-sm">
            Test and verify all aviation data sources for the AINO platform
          </p>
        </div>
        <button
          onClick={testAllApis}
          disabled={isTestingAll}
          className={`flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 
                     text-white rounded-lg transition-colors ${isTestingAll ? 'cursor-not-allowed' : ''}`}
        >
          <Zap className={`w-4 h-4 ${isTestingAll ? 'animate-pulse' : ''}`} />
          {isTestingAll ? 'Testing All APIs...' : 'Test All APIs'}
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto">
        {apiEndpoints.map((api) => {
          const result = testResults[api.key];
          const isLoading = testingStates[api.key];
          
          return (
            <div
              key={api.key}
              className={`border rounded-lg p-4 transition-all ${getStatusColor(result, isLoading)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getStatusIcon(result, isLoading)}
                  <div>
                    <h3 className="font-semibold text-white">{api.name}</h3>
                    <p className="text-sm text-gray-300">{api.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => testApi(api.endpoint, api.key)}
                  disabled={isLoading}
                  className={`flex items-center gap-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 
                             disabled:bg-gray-800 text-white rounded text-sm transition-colors
                             ${isLoading ? 'cursor-not-allowed' : ''}`}
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? 'Testing...' : 'Test'}
                </button>
              </div>

              {result && (
                <div className="mt-3 p-3 bg-black/30 rounded border border-gray-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-sm font-medium ${
                      result.success ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {result.success ? 'SUCCESS' : 'FAILED'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">{result.message}</p>
                  
                  {result.data && (
                    <div className="text-xs text-gray-400 space-y-1">
                      {result.data.flights_found && (
                        <div>✈️ Flights Found: {result.data.flights_found}</div>
                      )}
                      {result.data.api_credits_used && (
                        <div>📊 API Credits Used: {result.data.api_credits_used}</div>
                      )}
                      {result.data.sample_flight && (
                        <div className="mt-2 p-2 bg-gray-800/50 rounded">
                          <div className="text-gray-300 font-medium">Sample Flight:</div>
                          <div>Flight: {result.data.sample_flight.flight_number}</div>
                          <div>Aircraft: {result.data.sample_flight.aircraft}</div>
                          <div>Route: {result.data.sample_flight.departure} → {result.data.sample_flight.arrival}</div>
                          <div>Status: {result.data.sample_flight.status}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Plane className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-blue-400">Aviation Data Sources</span>
        </div>
        <p className="text-xs text-gray-300">
          AINO uses multiple aviation APIs to ensure comprehensive Virgin Atlantic flight tracking. 
          Aviation Edge provides primary data with Aviation Stack as backup, while OpenSky Network 
          delivers real-time aircraft positions for enhanced situational awareness.
        </p>
      </div>
    </div>
  );
};