import { useState, useEffect } from 'react';
import { Plane, MapPin, Clock, Navigation, Fuel, AlertTriangle } from 'lucide-react';
import { useSelectedFlight } from '../lib/stores/useSelectedFlight';

export default function LiveFlightTracker() {
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const { selectedFlight } = useSelectedFlight();

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        setLastUpdate(new Date());
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Plane className="h-6 w-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Live Flight Tracking</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              autoRefresh 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {autoRefresh ? 'Auto Refresh On' : 'Auto Refresh Off'}
          </button>
          <button
            onClick={() => setLastUpdate(new Date())}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Updating...' : 'Refresh'}
          </button>
        </div>
      </div>

      {lastUpdate && (
        <div className="mb-4 text-sm text-gray-400">
          Last updated: {formatTime(lastUpdate)}
          {autoRefresh && <span className="ml-2 text-green-400">(Auto-refreshing every 30s)</span>}
        </div>
      )}

      {selectedFlight ? (
        <div className="space-y-6">
          {/* Selected Flight Header */}
          <div className="bg-red-900/30 rounded-lg p-4 border border-red-600/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                <span className="text-red-300 font-bold text-lg">{selectedFlight.callsign}</span>
                <span className="text-red-400 text-sm font-medium">VIRGIN ATLANTIC</span>
              </div>
              <div className="text-red-300 text-sm">LIVE TRACKING</div>
            </div>
            
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-red-300 font-medium mb-1">Route</div>
                <div className="text-white font-mono">{selectedFlight.origin} → {selectedFlight.destination}</div>
              </div>
              <div>
                <div className="text-red-300 font-medium mb-1">Aircraft</div>
                <div className="text-white font-mono">{selectedFlight.aircraft}</div>
              </div>
              <div>
                <div className="text-red-300 font-medium mb-1">Altitude</div>
                <div className="text-white font-mono">{selectedFlight.altitude.toLocaleString()} ft</div>
              </div>
              <div>
                <div className="text-red-300 font-medium mb-1">Speed</div>
                <div className="text-white font-mono">{selectedFlight.velocity.toFixed(0)} kts</div>
              </div>
            </div>
          </div>

          {/* Flight Performance Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-600/30">
              <div className="flex items-center gap-2 mb-2">
                <Navigation className="h-5 w-5 text-blue-400" />
                <span className="text-blue-300 font-medium">Position</span>
              </div>
              <div className="text-white font-mono text-sm">
                {selectedFlight.latitude.toFixed(4)}°N<br/>
                {selectedFlight.longitude.toFixed(4)}°W
              </div>
            </div>
            
            <div className="bg-green-900/30 rounded-lg p-4 border border-green-600/30">
              <div className="flex items-center gap-2 mb-2">
                <Navigation className="h-5 w-5 text-green-400" />
                <span className="text-green-300 font-medium">Heading</span>
              </div>
              <div className="text-white font-mono text-lg">{selectedFlight.heading.toFixed(0)}°</div>
            </div>
            
            <div className="bg-purple-900/30 rounded-lg p-4 border border-purple-600/30">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-purple-400" />
                <span className="text-purple-300 font-medium">Status</span>
              </div>
              <div className="text-green-400 font-bold">EN ROUTE</div>
            </div>
          </div>

          {/* Operational Decision Support */}
          <div className="bg-gray-800/50 rounded-lg border border-gray-600 p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <h3 className="text-lg font-bold text-white">Operational Analysis</h3>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-400 mb-2">Flight Performance</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Fuel Efficiency</span>
                    <span className="text-green-400">Optimal</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Route Adherence</span>
                    <span className="text-green-400">On Track</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Weather Impact</span>
                    <span className="text-yellow-400">Minimal</span>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-400 mb-2">Decision Factors</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Diversion Risk</span>
                    <span className="text-green-400">Low</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Cost Impact</span>
                    <span className="text-green-400">Normal</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Safety Score</span>
                    <span className="text-green-400">95/100</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Plane className="h-16 w-16 text-gray-600 mb-4" />
          <div className="text-gray-400 text-lg mb-2">No flight data available</div>
          <div className="text-gray-500 text-sm max-w-md">
            Select a flight from the satellite map overview to view detailed tracking information and operational analysis
          </div>
        </div>
      )}
    </div>
  );
}