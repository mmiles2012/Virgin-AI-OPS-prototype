import React, { useState, useEffect } from 'react';
import { Plane, Clock, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface FlightPerformance {
  flightNumber: string;
  route: string;
  scheduledTime: string;
  actualTime: string;
  delayMinutes: number;
  status: 'on-time' | 'delayed' | 'cancelled';
  aircraft: string;
  gate?: string;
}

interface HubPerformance {
  icao: string;
  iata: string;
  name: string;
  city: string;
  onTimeRate: number;
  avgDelayMinutes: number;
  totalFlights: number;
  onTimeFlights: number;
  delayedFlights: number;
  cancelledFlights: number;
  trend: 'improving' | 'declining' | 'stable';
  recentFlights: FlightPerformance[];
  lastUpdated: string;
}

export default function OnTimePerformanceDashboard() {
  const [hubData, setHubData] = useState<HubPerformance[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Simulate real-time performance data for Virgin Atlantic network
  const generatePerformanceData = (): HubPerformance[] => {
    const hubs = [
      { icao: 'EGLL', iata: 'LHR', name: 'London Heathrow', city: 'London' },
      { icao: 'EGKK', iata: 'LGW', name: 'London Gatwick', city: 'London' },
      { icao: 'KJFK', iata: 'JFK', name: 'John F. Kennedy', city: 'New York' },
      { icao: 'KLAX', iata: 'LAX', name: 'Los Angeles International', city: 'Los Angeles' },
      { icao: 'KSFO', iata: 'SFO', name: 'San Francisco International', city: 'San Francisco' },
      { icao: 'KBOS', iata: 'BOS', name: 'Boston Logan', city: 'Boston' },
      { icao: 'CYYZ', iata: 'YYZ', name: 'Toronto Pearson', city: 'Toronto' },
      { icao: 'VABB', iata: 'BOM', name: 'Mumbai International', city: 'Mumbai' },
      { icao: 'VOBL', iata: 'BLR', name: 'Bangalore International', city: 'Bangalore' },
      { icao: 'LPPT', iata: 'LIS', name: 'Lisbon Portela', city: 'Lisbon' },
      { icao: 'BIKF', iata: 'KEF', name: 'Keflavik International', city: 'Reykjavik' },
      { icao: 'DNMM', iata: 'LOS', name: 'Lagos International', city: 'Lagos' }
    ];

    return hubs.map(hub => {
      const totalFlights = Math.floor(Math.random() * 20) + 10;
      const onTimeFlights = Math.floor(totalFlights * (0.7 + Math.random() * 0.25));
      const cancelledFlights = Math.floor(Math.random() * 3);
      const delayedFlights = totalFlights - onTimeFlights - cancelledFlights;
      const onTimeRate = (onTimeFlights / totalFlights) * 100;
      const avgDelayMinutes = Math.floor(Math.random() * 45) + 5;

      // Generate recent flights
      const recentFlights: FlightPerformance[] = [];
      const flightPrefixes = ['VS', 'VIR'];
      const aircraft = ['Boeing 787-9', 'Airbus A350-1000', 'Airbus A330-900', 'Airbus A330-300'];
      
      for (let i = 0; i < Math.min(totalFlights, 8); i++) {
        const flightNumber = `${flightPrefixes[Math.floor(Math.random() * flightPrefixes.length)]}${Math.floor(Math.random() * 900) + 100}`;
        const delayMinutes = Math.random() < 0.7 ? 0 : Math.floor(Math.random() * 120) + 5;
        const scheduledTime = new Date(Date.now() - Math.random() * 6 * 60 * 60 * 1000).toLocaleTimeString('en-GB', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        const actualTime = delayMinutes > 0 ? 
          new Date(Date.parse(`1970-01-01T${scheduledTime}:00`) + delayMinutes * 60 * 1000).toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }) : scheduledTime;

        let status: 'on-time' | 'delayed' | 'cancelled' = 'on-time';
        if (Math.random() < 0.05) status = 'cancelled';
        else if (delayMinutes > 15) status = 'delayed';

        const routes = [
          'LHR-JFK', 'LHR-LAX', 'LHR-BOS', 'LHR-SFO', 'LGW-JFK', 'LGW-BOM',
          'JFK-LHR', 'LAX-LHR', 'BOS-LHR', 'SFO-LHR', 'BOM-LGW', 'BLR-LHR'
        ];

        recentFlights.push({
          flightNumber,
          route: routes[Math.floor(Math.random() * routes.length)],
          scheduledTime,
          actualTime,
          delayMinutes,
          status,
          aircraft: aircraft[Math.floor(Math.random() * aircraft.length)],
          gate: `${String.fromCharCode(65 + Math.floor(Math.random() * 5))}${Math.floor(Math.random() * 20) + 1}`
        });
      }

      const trend = onTimeRate > 85 ? 'improving' : onTimeRate < 70 ? 'declining' : 'stable';

      return {
        ...hub,
        onTimeRate,
        avgDelayMinutes,
        totalFlights,
        onTimeFlights,
        delayedFlights,
        cancelledFlights,
        trend,
        recentFlights,
        lastUpdated: new Date().toLocaleTimeString('en-GB')
      };
    });
  };

  useEffect(() => {
    const updateData = () => {
      setHubData(generatePerformanceData());
      setLoading(false);
    };

    updateData();
    const interval = setInterval(updateData, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (hubData.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % hubData.length);
      }, 8000); // Change display every 8 seconds

      return () => clearInterval(interval);
    }
  }, [hubData.length]);

  if (loading || hubData.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
          <div className="text-gray-400">Loading performance data...</div>
        </div>
      </div>
    );
  }

  const currentHub = hubData[currentIndex];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-time': return 'text-green-400';
      case 'delayed': return 'text-yellow-400';
      case 'cancelled': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'declining': return <TrendingDown className="w-4 h-4 text-red-400" />;
      default: return <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>;
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Plane className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Virgin Atlantic Network OTP</h2>
          </div>
          <div className="flex items-center gap-2 text-white/80">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Updated: {currentHub.lastUpdated}</span>
          </div>
        </div>
      </div>

      {/* Current Hub Overview */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hub Summary */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white">{currentHub.iata}</h3>
                <p className="text-gray-400">{currentHub.name}</p>
                <p className="text-gray-500 text-sm">{currentHub.city}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  {getTrendIcon(currentHub.trend)}
                  <span className={`text-2xl font-bold ${
                    currentHub.onTimeRate >= 85 ? 'text-green-400' : 
                    currentHub.onTimeRate >= 70 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {currentHub.onTimeRate.toFixed(1)}%
                  </span>
                </div>
                <p className="text-gray-400 text-sm">OTP</p>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-2xl font-bold text-white">{currentHub.totalFlights}</div>
                <div className="text-gray-400 text-sm">Total Flights</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-400">{currentHub.avgDelayMinutes}m</div>
                <div className="text-gray-400 text-sm">Avg Delay</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-400">{currentHub.onTimeFlights}</div>
                <div className="text-gray-400 text-sm">On Time</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-400">{currentHub.delayedFlights + currentHub.cancelledFlights}</div>
                <div className="text-gray-400 text-sm">Disrupted</div>
              </div>
            </div>
          </div>

          {/* Recent Flights */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Recent Operations</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {currentHub.recentFlights.map((flight, index) => (
                <div key={index} className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        flight.status === 'on-time' ? 'bg-green-400' :
                        flight.status === 'delayed' ? 'bg-yellow-400' : 'bg-red-400'
                      }`}></div>
                      <div>
                        <div className="font-bold text-white">{flight.flightNumber}</div>
                        <div className="text-gray-400 text-sm">{flight.route}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={getStatusColor(flight.status)}>
                        {flight.status === 'on-time' ? flight.scheduledTime : 
                         flight.status === 'cancelled' ? 'CANCELLED' :
                         `${flight.actualTime} (+${flight.delayMinutes}m)`}
                      </div>
                      <div className="text-gray-500 text-xs">{flight.aircraft}</div>
                    </div>
                  </div>
                  {flight.gate && (
                    <div className="text-gray-500 text-xs mt-1">Gate {flight.gate}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mt-6 flex justify-center">
          <div className="flex gap-2">
            {hubData.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex ? 'bg-red-500' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Network Summary Footer */}
      <div className="bg-gray-800 px-6 py-3 border-t border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-400">
            Network Average: {(hubData.reduce((sum, hub) => sum + hub.onTimeRate, 0) / hubData.length).toFixed(1)}% OTP
          </div>
          <div className="text-gray-400">
            {hubData.reduce((sum, hub) => sum + hub.totalFlights, 0)} flights across {hubData.length} stations
          </div>
        </div>
      </div>
    </div>
  );
}