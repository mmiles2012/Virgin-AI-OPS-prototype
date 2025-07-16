import React, { useState, useEffect } from 'react';
import { AlertTriangle, Circle, Navigation, Activity, Clock } from 'lucide-react';

interface HoldingStack {
  code: string;
  name: string;
  lat: number;
  lon: number;
  radius: number;
  minAltitude: number;
  maxAltitude: number;
  currentCount: number;
}

interface HoldingAlert {
  type: string;
  priority: string;
  message: string;
  stack?: string;
  stackName?: string;
  count?: number;
  details?: any;
}

interface HoldingData {
  success: boolean;
  holding_analysis: {
    summary: {
      totalHolding: number;
      stackCounts: Record<string, number>;
      alerts: HoldingAlert[];
    };
  };
  holding_status: {
    totalHolding: number;
    stackCounts: Record<string, number>;
    activeHoldings: any[];
  };
  holding_alerts: HoldingAlert[];
  holding_areas: HoldingStack[];
}

const HeathrowHoldingMonitor: React.FC = () => {
  const [holdingData, setHoldingData] = useState<HoldingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    fetchHoldingData();
    const interval = setInterval(fetchHoldingData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchHoldingData = async () => {
    try {
      const response = await fetch('/api/aviation/heathrow-holding');
      if (!response.ok) {
        throw new Error('Failed to fetch holding data');
      }
      const data = await response.json();
      setHoldingData(data);
      setLastUpdate(new Date().toLocaleTimeString());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getStackColor = (count: number) => {
    if (count === 0) return 'text-green-600';
    if (count <= 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStackBgColor = (count: number) => {
    if (count === 0) return 'bg-green-50';
    if (count <= 2) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'text-red-600';
      case 'HIGH': return 'text-orange-600';
      case 'MEDIUM': return 'text-yellow-400';
      default: return 'text-blue-400';
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-400">Loading holding data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-center h-64">
          <AlertTriangle className="h-8 w-8 text-red-400 mr-2" />
          <span className="text-red-400">Error: {error}</span>
        </div>
      </div>
    );
  }

  if (!holdingData) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-center h-64">
          <span className="text-gray-400">No holding data available</span>
        </div>
      </div>
    );
  }

  const { holding_status, holding_alerts, holding_areas } = holdingData;

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center">
          <Navigation className="h-6 w-6 mr-2 text-blue-400" />
          Heathrow Holding Areas
        </h2>
        <div className="flex items-center text-sm text-gray-400">
          <Clock className="h-4 w-4 mr-1" />
          Last updated: {lastUpdate}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Holding</p>
              <p className="text-2xl font-bold text-white">{holding_status.totalHolding}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        
        {holding_areas.map((area) => (
          <div key={area.code} className={`rounded-lg p-4 ${getStackBgColor(area.currentCount)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">{area.code}</p>
                <p className={`text-xl font-bold ${getStackColor(area.currentCount)}`}>
                  {area.currentCount}
                </p>
                <p className="text-xs text-gray-500">{area.name}</p>
              </div>
              <Circle className={`h-6 w-6 ${getStackColor(area.currentCount)}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Holding Areas Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Holding Stack Status</h3>
          <div className="space-y-3">
            {holding_areas.map((area) => (
              <div key={area.code} className="flex items-center justify-between p-3 bg-gray-600 rounded-lg">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${getStackColor(area.currentCount).replace('text-', 'bg-')}`}></div>
                  <div>
                    <p className="text-white font-medium">{area.name} ({area.code})</p>
                    <p className="text-sm text-gray-400">
                      {area.minAltitude}ft - {area.maxAltitude}ft | {area.radius}km radius
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${getStackColor(area.currentCount)}`}>
                    {area.currentCount}
                  </p>
                  <p className="text-xs text-gray-400">aircraft</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Holding Alerts</h3>
          <div className="space-y-2">
            {holding_alerts.length > 0 ? (
              holding_alerts.map((alert, index) => (
                <div key={index} className="p-3 bg-gray-600 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className={`h-4 w-4 mr-2 ${getPriorityColor(alert.priority)}`} />
                    <span className={`text-sm font-medium ${getPriorityColor(alert.priority)}`}>
                      {alert.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mt-1">{alert.message}</p>
                  {alert.stack && (
                    <p className="text-xs text-gray-400 mt-1">
                      Stack: {alert.stackName} ({alert.stack})
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Circle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <p className="text-green-400 text-sm">No holding alerts</p>
                <p className="text-gray-400 text-xs">All stacks operating normally</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Operational Notes */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-2">Holding Area Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
          <div>
            <p><strong>BNN (Bovington):</strong> Northwest holding area</p>
            <p><strong>BIG (Biggin Hill):</strong> Southeast holding area</p>
          </div>
          <div>
            <p><strong>LAM (Lambourne):</strong> Northeast holding area</p>
            <p><strong>OCK (Ockham):</strong> Southwest holding area</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Detection based on altitude stability (&lt;300ft variation), heading changes (&gt;90°), and low speed (&lt;250kt)
        </p>
      </div>
    </div>
  );
};

export default HeathrowHoldingMonitor;