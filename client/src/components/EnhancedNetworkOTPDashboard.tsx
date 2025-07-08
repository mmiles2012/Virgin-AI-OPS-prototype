import React, { useState, useEffect } from 'react';
import { Plane, Clock, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface HubData {
  icao: string;
  iata: string;
  name: string;
  city: string;
  onTimeRate: number;
  totalFlights: number;
  delayedFlights: number;
  avgDelayMinutes: number;
  trend: 'improving' | 'declining' | 'stable';
}

const EnhancedNetworkOTPDashboard: React.FC = () => {
  const [hubData, setHubData] = useState<HubData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHub, setSelectedHub] = useState<string | null>(null);

  useEffect(() => {
    // Generate hub performance data
    const generateHubData = (): HubData[] => {
      const hubs = [
        { icao: 'EGLL', iata: 'LHR', name: 'London Heathrow', city: 'London' },
        { icao: 'KJFK', iata: 'JFK', name: 'John F Kennedy Intl', city: 'New York' },
        { icao: 'KLAX', iata: 'LAX', name: 'Los Angeles Intl', city: 'Los Angeles' },
        { icao: 'KBOS', iata: 'BOS', name: 'Boston Logan Intl', city: 'Boston' },
        { icao: 'EGCC', iata: 'MAN', name: 'Manchester Airport', city: 'Manchester' },
        { icao: 'KMCO', iata: 'MCO', name: 'Orlando International', city: 'Orlando' },
        { icao: 'OMDB', iata: 'DXB', name: 'Dubai International', city: 'Dubai' },
        { icao: 'VABB', iata: 'BOM', name: 'Mumbai Airport', city: 'Mumbai' }
      ];

      return hubs.map(hub => {
        const totalFlights = Math.floor(Math.random() * 150) + 50;
        const delayedFlights = Math.floor(Math.random() * 25) + 5;
        const onTimeRate = ((totalFlights - delayedFlights) / totalFlights) * 100;
        const avgDelayMinutes = Math.floor(Math.random() * 40) + 10;
        const trends = ['improving', 'stable', 'declining'] as const;
        const trend = trends[Math.floor(Math.random() * trends.length)];

        return {
          ...hub,
          onTimeRate,
          totalFlights,
          delayedFlights,
          avgDelayMinutes,
          trend
        };
      });
    };

    setHubData(generateHubData());
    setLoading(false);
  }, []);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'declining': return <TrendingDown className="w-4 h-4 text-red-400" />;
      default: return <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>;
    }
  };

  const getPerformanceColor = (onTimeRate: number) => {
    if (onTimeRate >= 85) return 'text-green-400';
    if (onTimeRate >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusBadge = (onTimeRate: number) => {
    if (onTimeRate >= 85) return 'Excellent';
    if (onTimeRate >= 70) return 'Good';
    if (onTimeRate >= 60) return 'Fair';
    return 'Poor';
  };

  const networkOnTimeRate = hubData.length > 0 ? 
    hubData.reduce((sum, hub) => sum + hub.onTimeRate, 0) / hubData.length : 0;
  
  const totalNetworkFlights = hubData.reduce((sum, hub) => sum + hub.totalFlights, 0);
  const totalNetworkDelays = hubData.reduce((sum, hub) => sum + hub.delayedFlights, 0);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900 text-white overflow-y-auto" style={{ top: '60px' }}>
        <div className="min-h-screen w-full bg-gray-900 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            <div className="ml-4 text-gray-400">Loading network performance data...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 text-white overflow-y-auto" style={{ top: '60px' }}>
      <div className="min-h-screen w-full bg-gray-900 p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Network OTP Performance Dashboard</h1>
          <p className="text-gray-400">Virgin Atlantic Global Network Operations Monitoring</p>
        </div>

        {/* Network Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Network On-Time Rate</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(networkOnTimeRate)}`}>
                  {networkOnTimeRate.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Clock className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Flights</p>
                <p className="text-2xl font-bold text-white">{totalNetworkFlights}</p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Plane className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Delayed Flights</p>
                <p className="text-2xl font-bold text-yellow-400">{totalNetworkDelays}</p>
              </div>
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Hub Performance Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Hub Performance Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {hubData.map((hub) => (
              <div
                key={hub.icao}
                className={`bg-gray-800 rounded-lg p-4 border cursor-pointer transition-all hover:border-gray-600 ${
                  selectedHub === hub.iata ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700'
                }`}
                onClick={() => setSelectedHub(selectedHub === hub.iata ? null : hub.iata)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">{hub.iata}</h3>
                    <p className="text-sm text-gray-400">{hub.city}</p>
                  </div>
                  <Plane className="w-5 h-5 text-gray-400" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">On-Time Rate:</span>
                    <span className={`font-bold ${getPerformanceColor(hub.onTimeRate)}`}>
                      {hub.onTimeRate.toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Flights:</span>
                    <span className="text-white font-medium">{hub.totalFlights}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Avg Delay:</span>
                    <span className="text-yellow-400 font-medium">{hub.avgDelayMinutes}m</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Status:</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      hub.onTimeRate >= 85 ? 'bg-green-500/20 text-green-400' :
                      hub.onTimeRate >= 70 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {getStatusBadge(hub.onTimeRate)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm text-gray-400">Trend:</span>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(hub.trend)}
                      <span className="text-xs capitalize text-gray-400">{hub.trend}</span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        hub.onTimeRate >= 85 ? 'bg-green-500' : 
                        hub.onTimeRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${hub.onTimeRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Hub Details */}
        {selectedHub && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">
              {hubData.find(h => h.iata === selectedHub)?.name} - Detailed Performance
            </h2>
            {(() => {
              const hub = hubData.find(h => h.iata === selectedHub);
              if (!hub) return null;
              
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-sm text-gray-400 mb-1">ICAO Code</div>
                    <div className="text-white font-bold">{hub.icao}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-400 mb-1">On-Time Flights</div>
                    <div className="text-green-400 font-bold">{hub.totalFlights - hub.delayedFlights}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-400 mb-1">Delayed Flights</div>
                    <div className="text-red-400 font-bold">{hub.delayedFlights}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-400 mb-1">Performance Trend</div>
                    <div className="flex items-center justify-center gap-1">
                      {getTrendIcon(hub.trend)}
                      <span className="text-white font-medium capitalize">{hub.trend}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedNetworkOTPDashboard;