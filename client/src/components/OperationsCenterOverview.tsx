import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plane, Activity, Cloud, Zap, Wind } from 'lucide-react';

interface NetworkHealthData {
  onTimePerformance: number;
  cancellations: number;
  diversions: number;
  curfews: number;
}

interface DigitalTwinAlert {
  id: string;
  type: 'delay' | 'diversion' | 'connection';
  flight: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
}

interface DisruptionTimelineData {
  hour: string;
  disruptions: number;
  color: string;
}

const OperationsCenterOverview: React.FC = () => {
  const [networkHealth, setNetworkHealth] = useState<NetworkHealthData>({
    onTimePerformance: 79,
    cancellations: 12,
    diversions: 4,
    curfews: 6
  });

  const [digitalTwinAlerts, setDigitalTwinAlerts] = useState<DigitalTwinAlert[]>([
    {
      id: '1',
      type: 'delay',
      flight: 'AA123',
      message: 'Delay forecasted for AA123 due to weather',
      severity: 'high'
    },
    {
      id: '2',
      type: 'diversion',
      flight: 'DL456',
      message: 'Diversion recommended for DL456',
      severity: 'high'
    },
    {
      id: '3',
      type: 'connection',
      flight: 'UA739',
      message: 'Tight connection detected for UA739',
      severity: 'medium'
    }
  ]);

  const [disruptionTimeline, setDisruptionTimeline] = useState<DisruptionTimelineData[]>([
    { hour: '0h', disruptions: 0, color: '#10B981' },
    { hour: '2h', disruptions: 0, color: '#10B981' },
    { hour: '4h', disruptions: 1, color: '#F59E0B' },
    { hour: '6h', disruptions: 0, color: '#10B981' }
  ]);

  useEffect(() => {
    // Fetch real-time data from AINO APIs
    const fetchData = async () => {
      try {
        // This would connect to your existing AINO APIs
        // const healthResponse = await fetch('/api/aviation/network-health');
        // const alertsResponse = await fetch('/api/aviation/digital-twin-alerts');
        // const timelineResponse = await fetch('/api/aviation/disruption-timeline');
      } catch (error) {
        console.error('Error fetching operations data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const maxDisruptions = Math.max(...disruptionTimeline.map(d => d.disruptions));

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="grid grid-cols-2 gap-6 h-[calc(100vh-3rem)]">
        
        {/* Live Map View */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-2xl font-semibold text-white mb-4">Live Map View</h2>
          <div className="relative h-full bg-gradient-to-br from-teal-900 via-slate-800 to-blue-900 rounded-lg overflow-hidden">
            {/* World Map Background */}
            <div className="absolute inset-0 opacity-30">
              <svg viewBox="0 0 800 400" className="w-full h-full">
                {/* Simplified world map paths */}
                <path 
                  d="M150 120 L180 110 L220 115 L250 120 L280 118 L320 125 L350 130 L380 128 L400 135 L430 140"
                  stroke="#0891b2" 
                  strokeWidth="2" 
                  fill="none"
                  opacity="0.6"
                />
                <path 
                  d="M100 180 L140 175 L180 170 L220 172 L260 178 L300 175 L340 180 L380 185"
                  stroke="#0891b2" 
                  strokeWidth="2" 
                  fill="none"
                  opacity="0.6"
                />
              </svg>
            </div>
            
            {/* Aircraft Icons */}
            <div className="absolute inset-0">
              {/* North America flights */}
              <div className="absolute top-1/4 left-1/4">
                <Plane className="w-4 h-4 text-cyan-400 rotate-45" />
              </div>
              <div className="absolute top-1/3 left-1/3">
                <Plane className="w-4 h-4 text-cyan-400 rotate-90" />
              </div>
              <div className="absolute top-2/5 left-1/5">
                <Plane className="w-4 h-4 text-cyan-400 rotate-12" />
              </div>
              
              {/* Europe flights */}
              <div className="absolute top-1/4 left-1/2">
                <Plane className="w-4 h-4 text-cyan-400 rotate-180" />
              </div>
              <div className="absolute top-1/3 left-3/5">
                <Plane className="w-4 h-4 text-cyan-400 rotate-45" />
              </div>
              
              {/* Atlantic routes */}
              <div className="absolute top-1/3 left-2/5">
                <Plane className="w-4 h-4 text-yellow-400 rotate-90" />
              </div>
              <div className="absolute top-2/5 left-1/2">
                <Plane className="w-4 h-4 text-yellow-400 rotate-45" />
              </div>
            </div>
            
            {/* Flight paths */}
            <svg className="absolute inset-0 w-full h-full">
              <defs>
                <linearGradient id="flightPath" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#0891b2" stopOpacity="0.3" />
                </linearGradient>
              </defs>
              <path 
                d="M200 160 Q300 140 400 170" 
                stroke="url(#flightPath)" 
                strokeWidth="2" 
                fill="none"
                strokeDasharray="5,5"
              />
              <path 
                d="M160 180 Q280 160 380 190" 
                stroke="url(#flightPath)" 
                strokeWidth="2" 
                fill="none"
                strokeDasharray="5,5"
              />
            </svg>
          </div>
        </div>

        {/* Network Health */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-2xl font-semibold text-white mb-6">Network Health</h2>
          
          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">On-Time Performance</span>
              <span className="text-white font-semibold">{networkHealth.onTimePerformance}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Cancellations</span>
              <span className="text-red-400 font-semibold">{networkHealth.cancellations}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Diversions</span>
              <span className="text-orange-400 font-semibold">{networkHealth.diversions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Curfews</span>
              <span className="text-yellow-400 font-semibold">{networkHealth.curfews}</span>
            </div>
          </div>

          {/* Weather & Airspace Section */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Weather & Airspace</h3>
            <div className="relative h-32 bg-gradient-to-br from-green-900 via-slate-800 to-blue-900 rounded-lg overflow-hidden">
              {/* Weather radar simulation */}
              <div className="absolute inset-0">
                <div className="absolute top-4 left-4 w-8 h-8 bg-green-500 opacity-60 rounded-full"></div>
                <div className="absolute top-8 right-6 w-12 h-6 bg-yellow-500 opacity-50 rounded-lg"></div>
                <div className="absolute bottom-6 left-1/3 w-6 h-10 bg-orange-500 opacity-70 rounded-lg"></div>
              </div>
              
              {/* Aircraft in weather */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Plane className="w-6 h-6 text-yellow-400 rotate-45" />
              </div>
            </div>
          </div>
        </div>

        {/* Digital Twin Alerts */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-2xl font-semibold text-white mb-6">Digital Twin Alerts</h2>
          
          <div className="space-y-4">
            {digitalTwinAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start space-x-3 p-3 bg-slate-700 rounded-lg">
                <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                  alert.severity === 'high' ? 'text-red-400' : 
                  alert.severity === 'medium' ? 'text-yellow-400' : 'text-blue-400'
                }`} />
                <div className="flex-1">
                  <p className="text-white text-sm">{alert.message}</p>
                </div>
                <button className="text-slate-400 hover:text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Predictive Disruption Timeline */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-2xl font-semibold text-white mb-6">Predictive Disruption Timeline</h2>
          
          {/* Timeline Chart */}
          <div className="relative h-48 mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg p-4">
              <div className="h-full flex items-end justify-between space-x-2">
                {disruptionTimeline.map((data, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div 
                      className="w-full rounded-t-lg transition-all duration-500"
                      style={{
                        height: `${maxDisruptions > 0 ? (data.disruptions / maxDisruptions) * 100 : 0}%`,
                        backgroundColor: data.color,
                        minHeight: data.disruptions > 0 ? '20px' : '4px'
                      }}
                    ></div>
                    <span className="text-slate-400 text-sm mt-2">{data.hour}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Timeline labels */}
            <div className="absolute top-2 right-4 text-slate-400 text-sm">+5 h</div>
            <div className="absolute bottom-16 left-4 text-white text-sm">1</div>
            <div className="absolute bottom-4 right-4 text-slate-400 text-xs">+6h</div>
          </div>

          {/* Timeline Gradient Bar */}
          <div>
            <h4 className="text-white text-sm mb-2">Predictive Disruption Timeline</h4>
            <div className="h-2 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full">
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>0h</span>
              <span>2h</span>
              <span>4h</span>
              <span>6h</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationsCenterOverview;