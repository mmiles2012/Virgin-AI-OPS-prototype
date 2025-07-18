import React from 'react';
import { Plane, Clock } from 'lucide-react';

interface NetworkHeaderProps {
  networkAlertStatus: 'stable' | 'minor' | 'alert';
  totalFlights: number;
  delayRate: number;
  avgDelay: number;
  hubCount: number;
}

export const NetworkHeader: React.FC<NetworkHeaderProps> = ({
  networkAlertStatus,
  totalFlights,
  delayRate,
  avgDelay,
  hubCount
}) => {
  const getHeaderStyle = () => {
    switch (networkAlertStatus) {
      case 'alert':
        return 'bg-gradient-to-r from-red-600 to-red-700';
      case 'minor':
        return 'bg-gradient-to-r from-amber-600 to-amber-700';
      default:
        return 'bg-gradient-to-r from-green-600 to-green-700';
    }
  };

  return (
    <div className={`px-6 py-4 ${getHeaderStyle()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Plane className="w-6 h-6 text-white" />
          <h2 className="text-xl font-bold text-white">
            Virgin Atlantic Enhanced Network Operations
          </h2>
        </div>
        <div className="flex items-center gap-4 text-white/80">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs">LIVE DATA</span>
          </div>
          <Clock className="w-4 h-4" />
          <span className="text-sm">Updated: {new Date().toLocaleTimeString('en-GB')}</span>
        </div>
      </div>
    </div>
  );
};

interface NetworkStatsBarProps {
  totalFlights: number;
  delayRate: number;
  avgDelay: number;
  hubCount: number;
}

export const NetworkStatsBar: React.FC<NetworkStatsBarProps> = ({
  totalFlights,
  delayRate,
  avgDelay,
  hubCount
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="grid grid-cols-4 gap-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{totalFlights}</div>
          <div className="text-sm text-gray-500">Total Flights</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${
            delayRate > 20 ? 'text-red-600' : 
            delayRate > 10 ? 'text-yellow-600' : 'text-green-600'
          }`}>
            {delayRate.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-500">Network Delay Rate</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{avgDelay.toFixed(0)}min</div>
          <div className="text-sm text-gray-500">Avg Delay Time</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{hubCount}</div>
          <div className="text-sm text-gray-500">Monitored Hubs</div>
        </div>
      </div>
    </div>
  );
};
