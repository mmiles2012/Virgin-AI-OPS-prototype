import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Zap, Plane, Database, Trash2 } from 'lucide-react';

interface ApiTestResult {
  success: boolean;
  message: string;
  data?: any;
}

interface CacheStats {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  lastApiCall: number;
  apiCallsToday: number;
  cacheSize: number;
  hitRate: number;
}

interface ApiTestingCenterProps {}

export const ApiTestingCenter: React.FC<ApiTestingCenterProps> = () => {
  const [testResults, setTestResults] = useState<Record<string, ApiTestResult>>({});
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [testingStates, setTestingStates] = useState<Record<string, boolean>>({});
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [isClearingCache, setIsClearingCache] = useState(false);

  const apiEndpoints = [
    {
      name: 'OpenSky Network',
      key: 'opensky',
      endpoint: '/api/aviation/test-opensky',
      description: 'Primary source for real-time Virgin Atlantic aircraft positions and global flight tracking'
    },
    {
      name: 'Aviation Stack',
      key: 'aviationStack',
      endpoint: '/api/aviation/test-aviation-stack',
      description: 'Backup flight data source with comprehensive airline information and route details'
    },
    {
      name: 'Mapbox',
      key: 'mapbox',
      endpoint: '/api/aviation/test-mapbox',
      description: 'Satellite imagery and geospatial mapping services for precise flight visualization'
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

  const fetchCacheStats = async () => {
    try {
      const response = await fetch('/api/aviation/cache-stats');
      const result = await response.json();
      if (result.success) {
        setCacheStats(result.cache);
      }
    } catch (error) {
      console.warn('Failed to fetch cache stats:', error);
    }
  };

  const clearCache = async () => {
    setIsClearingCache(true);
    try {
      const response = await fetch('/api/aviation/clear-cache', { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        await fetchCacheStats(); // Refresh stats after clearing
      }
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    } finally {
      setIsClearingCache(false);
    }
  };

  const testAllApis = async () => {
    setIsTestingAll(true);
    
    for (const api of apiEndpoints) {
      await testApi(api.endpoint, api.key);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    await fetchCacheStats(); // Update cache stats after testing
    setIsTestingAll(false);
  };

  // Fetch cache stats on component mount and periodically
  React.useEffect(() => {
    fetchCacheStats();
    const interval = setInterval(fetchCacheStats, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (result: ApiTestResult | undefined, isLoading: boolean) => {
    if (isLoading) {
      return <RefreshCw className="w-5 h-5 text-aero-blue-primary animate-spin" />;
    }
    
    if (!result) {
      return <AlertTriangle className="w-5 h-5 text-muted-foreground" />;
    }
    
    return result.success 
      ? <CheckCircle className="w-5 h-5 text-aero-green-safe" />
      : <XCircle className="w-5 h-5 text-va-red-primary" />;
  };

  const getStatusColor = (result: ApiTestResult | undefined, isLoading: boolean) => {
    if (isLoading) return 'border-blue-500/50 bg-aero-blue-primary/10';
    if (!result) return 'border-border/50 bg-card/20';
    return result.success 
      ? 'border-green-500/50 bg-aero-green-safe/10'
      : 'border-red-500/50 bg-va-red-primary/10';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground mb-2">Aviation API Testing Center</h2>
          <p className="text-muted-foreground text-sm">
            Test and verify all aviation data sources for the AINO platform
          </p>
        </div>
        <button
          onClick={testAllApis}
          disabled={isTestingAll}
          className={`flex items-center gap-2 px-4 py-2 bg-aero-blue-primary hover:bg-aero-blue-light disabled:bg-blue-800 
                     text-foreground rounded-lg transition-colors ${isTestingAll ? 'cursor-not-allowed' : ''}`}
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
                    <h3 className="font-semibold text-foreground">{api.name}</h3>
                    <p className="text-sm text-muted-foreground">{api.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => testApi(api.endpoint, api.key)}
                  disabled={isLoading}
                  className={`flex items-center gap-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 
                             disabled:bg-card text-foreground rounded text-sm transition-colors
                             ${isLoading ? 'cursor-not-allowed' : ''}`}
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? 'Testing...' : 'Test'}
                </button>
              </div>

              {result && (
                <div className="mt-3 p-3 bg-black/30 rounded border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-sm font-medium ${
                      result.success ? 'text-aero-green-safe' : 'text-va-red-primary'
                    }`}>
                      {result.success ? 'SUCCESS' : 'FAILED'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{result.message}</p>
                  
                  {result.data && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      {result.data.flights_found && (
                        <div>✈️ Flights Found: {result.data.flights_found}</div>
                      )}
                      {result.data.api_credits_used && (
                        <div>📊 API Credits Used: {result.data.api_credits_used}</div>
                      )}
                      {result.data.sample_flight && (
                        <div className="mt-2 p-2 bg-card/50 rounded">
                          <div className="text-muted-foreground font-medium">Sample Flight:</div>
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

      {cacheStats && (
        <div className="mt-6 p-4 bg-aero-green-safe/10 border border-green-500/30 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-aero-green-safe" />
              <span className="text-sm font-medium text-aero-green-safe">Flight Data Cache</span>
            </div>
            <button
              onClick={clearCache}
              disabled={isClearingCache}
              className={`flex items-center gap-1 px-2 py-1 bg-va-red-primary hover:bg-va-red-heritage disabled:bg-red-800 
                         text-foreground rounded text-xs transition-colors ${isClearingCache ? 'cursor-not-allowed' : ''}`}
            >
              <Trash2 className={`w-3 h-3 ${isClearingCache ? 'animate-pulse' : ''}`} />
              {isClearingCache ? 'Clearing...' : 'Clear'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-muted-foreground">Total Requests: <span className="text-foreground">{cacheStats.totalRequests}</span></div>
              <div className="text-muted-foreground">Cache Hits: <span className="text-aero-green-safe">{cacheStats.cacheHits}</span></div>
              <div className="text-muted-foreground">Cache Misses: <span className="text-va-red-primary">{cacheStats.cacheMisses}</span></div>
            </div>
            <div>
              <div className="text-muted-foreground">Hit Rate: <span className="text-aero-blue-primary">{cacheStats.hitRate}%</span></div>
              <div className="text-muted-foreground">Cache Size: <span className="text-foreground">{cacheStats.cacheSize}</span></div>
              <div className="text-muted-foreground">API Calls Today: <span className="text-aero-amber-caution">{cacheStats.apiCallsToday}</span></div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-aero-blue-primary/10 border border-blue-500/30 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Plane className="w-4 h-4 text-aero-blue-primary" />
          <span className="text-sm font-medium text-aero-blue-primary">Aviation Data Sources</span>
        </div>
        <p className="text-xs text-muted-foreground">
          AINO uses OpenSky Network as the primary source for real-time Virgin Atlantic flight tracking, 
          with Aviation Stack as backup. The intelligent caching system ensures continuous data availability 
          even when APIs reach usage limits. Mapbox provides satellite imagery for precise flight visualization.
        </p>
        {(testResults.opensky?.success === false && testResults.aviationStack?.success === false) && (
          <div className="mt-3 p-2 bg-yellow-900/30 border border-yellow-500/50 rounded text-xs">
            <div className="text-aero-amber-caution font-medium mb-1">⚠️ API Rate Limits Detected</div>
            <div className="text-muted-foreground">
              Both aviation APIs are currently rate-limited. The system is serving cached Virgin Atlantic 
              flight data to maintain training continuity. Fresh data will resume when API limits reset.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};