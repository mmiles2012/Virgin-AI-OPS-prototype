import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { TrendingUp, TrendingDown, AlertTriangle, Plane } from 'lucide-react';

interface HubData {
  icao: string;
  iata: string;
  name: string;
  city: string;
  onTimeRate: number;
  totalFlights: number;
  delayedFlights: number;
  avgDelayMinutes: number;
  trend: 'improving' | 'stable' | 'declining';
}

const NetworkOTPDashboardSimple: React.FC = () => {
  const [hubData, setHubData] = useState<HubData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHub, setSelectedHub] = useState<string | null>(null);

  useEffect(() => {
    // Generate simplified hub data
    const generateHubData = (): HubData[] => {
      const hubs = [
        { icao: 'EGLL', iata: 'LHR', name: 'London Heathrow', city: 'London' },
        { icao: 'KJFK', iata: 'JFK', name: 'John F Kennedy Intl', city: 'New York' },
        { icao: 'KLAX', iata: 'LAX', name: 'Los Angeles Intl', city: 'Los Angeles' },
        { icao: 'KBOS', iata: 'BOS', name: 'Boston Logan Intl', city: 'Boston' },
        { icao: 'EGCC', iata: 'MAN', name: 'Manchester Airport', city: 'Manchester' },
        { icao: 'OMDB', iata: 'DXB', name: 'Dubai International', city: 'Dubai' },
        { icao: 'VABB', iata: 'BOM', name: 'Mumbai Airport', city: 'Mumbai' },
        { icao: 'RJTT', iata: 'NRT', name: 'Tokyo Narita', city: 'Tokyo' }
      ];

      return hubs.map(hub => {
        const totalFlights = Math.floor(Math.random() * 200) + 50;
        const delayedFlights = Math.floor(Math.random() * 30) + 5;
        const onTimeRate = ((totalFlights - delayedFlights) / totalFlights) * 100;
        const avgDelayMinutes = Math.floor(Math.random() * 45) + 5;
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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900 text-white overflow-y-auto" style={{ top: '60px' }}>
        <div className="min-h-screen w-full bg-gray-900 p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
            <div className="text-gray-400">Loading network performance data...</div>
          </div>
        </div>
      </div>
    );
  }

  const networkOnTimeRate = hubData.reduce((sum, hub) => sum + hub.onTimeRate, 0) / hubData.length;
  const totalNetworkFlights = hubData.reduce((sum, hub) => sum + hub.totalFlights, 0);
  const totalNetworkDelays = hubData.reduce((sum, hub) => sum + hub.delayedFlights, 0);

  return (
    <div className="fixed inset-0 bg-gray-900 text-white overflow-y-auto" style={{ top: '60px' }}>
      <div className="min-h-screen w-full bg-gray-900 p-6">
        <h2 className="text-3xl font-bold mb-6 text-white">Network OTP Performance</h2>
        
        {/* Network Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Network On-Time Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getPerformanceColor(networkOnTimeRate)}`}>
                {networkOnTimeRate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Flights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalNetworkFlights}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Delays</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">{totalNetworkDelays}</div>
            </CardContent>
          </Card>
        </div>

        {/* Hub Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {hubData.map((hub) => (
            <Card 
              key={hub.icao}
              className={`bg-gray-800 border-gray-700 cursor-pointer transition-all hover:border-gray-600 ${
                selectedHub === hub.iata ? 'border-blue-500 bg-blue-500/10' : ''
              }`}
              onClick={() => setSelectedHub(selectedHub === hub.iata ? null : hub.iata)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-white">{hub.iata}</CardTitle>
                    <p className="text-sm text-gray-400">{hub.city}</p>
                  </div>
                  <Plane className="w-6 h-6 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent>
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
                  
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm text-gray-400">Trend:</span>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(hub.trend)}
                      <span className="text-xs capitalize text-gray-400">{hub.trend}</span>
                    </div>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-3">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        hub.onTimeRate >= 85 ? 'bg-green-500' : 
                        hub.onTimeRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${hub.onTimeRate}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Selected Hub Details */}
        {selectedHub && (
          <div className="mt-8">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl text-white">
                  {hubData.find(h => h.iata === selectedHub)?.name} Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const hub = hubData.find(h => h.iata === selectedHub);
                  if (!hub) return null;
                  
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-gray-400">ICAO Code</div>
                        <div className="text-white font-medium">{hub.icao}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">On-Time Flights</div>
                        <div className="text-green-400 font-medium">{hub.totalFlights - hub.delayedFlights}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Delayed Flights</div>
                        <div className="text-red-400 font-medium">{hub.delayedFlights}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Performance Trend</div>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(hub.trend)}
                          <span className="text-white capitalize">{hub.trend}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkOTPDashboardSimple;