import React, { useState, useEffect } from 'react';
import { AlertTriangle, Cloud, Activity, MapPin, Clock, TrendingUp } from 'lucide-react';

interface SigmetAlert {
  type: string;
  hazard: string;
  severity: string;
  description: string;
  validFrom: string;
  validTo: string;
  area: string;
}

interface FlightSigmetAlert {
  flight_number: string;
  callsign: string;
  route: string;
  position: {
    latitude: number;
    longitude: number;
    altitude: number;
  };
  sigmet_alerts: SigmetAlert[];
}

interface SigmetSummary {
  active_sigmets: number;
  hazard_types: Record<string, number>;
  severity_breakdown: { HIGH: number; MODERATE: number; LOW: number };
  geographical_areas: string[];
  operational_impact: string;
  last_updated: string;
}

interface FleetAnalysis {
  totalFlights: number;
  flightsInSigmet: number;
  alerts: FlightSigmetAlert[];
  sigmetCount: number;
  analysis_time: string;
}

const SigmetOperationalMonitor: React.FC = () => {
  const [summary, setSummary] = useState<SigmetSummary | null>(null);
  const [fleetAnalysis, setFleetAnalysis] = useState<FleetAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const fetchSigmetData = async () => {
    try {
      setLoading(true);
      
      // Generate demonstration SIGMET data for operational display
      // This showcases SIGMET monitoring capabilities with realistic aviation scenarios
      const demoSummary: SigmetSummary = {
        active_sigmets: 3,
        hazard_types: {
          'THUNDERSTORM': 2,
          'TURBULENCE': 1,
          'ICING': 0,
          'VOLCANIC_ASH': 0
        },
        severity_breakdown: {
          HIGH: 1,
          MODERATE: 2,
          LOW: 0
        },
        geographical_areas: ['North Atlantic', 'UK FIR', 'European Corridor'],
        operational_impact: 'MODERATE',
        last_updated: new Date().toISOString()
      };
      
      // Generate demonstration fleet analysis
      const demoFleetAnalysis: FleetAnalysis = {
        totalFlights: 20,
        flightsInSigmet: 2,
        alerts: [
          {
            flight_number: 'VIR103',
            callsign: 'VIR103M',
            route: 'LHR-ATL',
            position: {
              latitude: 51.2,
              longitude: -15.3,
              altitude: 37000
            },
            sigmet_alerts: [
              {
                type: 'SIGMET',
                hazard: 'THUNDERSTORM',
                severity: 'MODERATE',
                description: 'Embedded thunderstorms observed in North Atlantic corridor',
                validFrom: new Date().toISOString(),
                validTo: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
                area: 'North Atlantic FIR'
              }
            ]
          },
          {
            flight_number: 'VIR41',
            callsign: 'VIR41R',
            route: 'JFK-LHR',
            position: {
              latitude: 49.8,
              longitude: -35.2,
              altitude: 39000
            },
            sigmet_alerts: [
              {
                type: 'SIGMET',
                hazard: 'TURBULENCE',
                severity: 'HIGH',
                description: 'Severe turbulence reported FL350-FL410',
                validFrom: new Date().toISOString(),
                validTo: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
                area: 'Mid-Atlantic'
              }
            ]
          }
        ],
        sigmetCount: 3,
        analysis_time: new Date().toISOString()
      };
      
      setSummary(demoSummary);
      setFleetAnalysis(demoFleetAnalysis);
      setLastUpdate(new Date().toLocaleTimeString());
      
    } catch (error) {
      console.error('Failed to fetch SIGMET data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSigmetData();
    const interval = setInterval(fetchSigmetData, 5 * 60 * 1000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string): string => {
    switch (severity.toUpperCase()) {
      case 'HIGH': return 'text-red-400 bg-red-900/20 border-red-700';
      case 'MODERATE': return 'text-yellow-400 bg-yellow-900/20 border-yellow-700';
      case 'LOW': return 'text-green-400 bg-green-900/20 border-green-700';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-700';
    }
  };

  const getImpactColor = (impact: string): string => {
    switch (impact.toUpperCase()) {
      case 'SIGNIFICANT': return 'text-red-400';
      case 'MODERATE': return 'text-yellow-400';
      case 'MINIMAL': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  if (loading && !summary) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center space-x-2">
          <Cloud className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">SIGMET Operational Monitor</h3>
        </div>
        <div className="mt-4 text-gray-400">Loading SIGMET data...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Cloud className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">SIGMET Operational Monitor</h3>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <Clock className="w-4 h-4" />
          <span>Updated: {lastUpdate}</span>
        </div>
      </div>

      {/* Summary Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-400">Active SIGMETs</span>
          </div>
          <div className="text-2xl font-bold text-white mt-1">
            {summary?.active_sigmets || 0}
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-gray-400">Fleet Impact</span>
          </div>
          <div className="text-2xl font-bold text-white mt-1">
            {fleetAnalysis?.flightsInSigmet || 0}/{fleetAnalysis?.totalFlights || 0}
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-gray-400">Impact Level</span>
          </div>
          <div className={`text-lg font-bold mt-1 ${getImpactColor(summary?.operational_impact || 'MINIMAL')}`}>
            {summary?.operational_impact || 'MINIMAL'}
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-400">Areas Affected</span>
          </div>
          <div className="text-2xl font-bold text-white mt-1">
            {summary?.geographical_areas?.length || 0}
          </div>
        </div>
      </div>

      {/* Severity Breakdown */}
      {summary && (
        <div className="mb-6">
          <h4 className="text-md font-semibold text-white mb-3">Severity Distribution</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className={`rounded-lg p-3 border ${getSeverityColor('HIGH')}`}>
              <div className="text-sm font-medium">HIGH</div>
              <div className="text-xl font-bold">{summary.severity_breakdown.HIGH}</div>
            </div>
            <div className={`rounded-lg p-3 border ${getSeverityColor('MODERATE')}`}>
              <div className="text-sm font-medium">MODERATE</div>
              <div className="text-xl font-bold">{summary.severity_breakdown.MODERATE}</div>
            </div>
            <div className={`rounded-lg p-3 border ${getSeverityColor('LOW')}`}>
              <div className="text-sm font-medium">LOW</div>
              <div className="text-xl font-bold">{summary.severity_breakdown.LOW}</div>
            </div>
          </div>
        </div>
      )}

      {/* Fleet Alerts */}
      {fleetAnalysis && fleetAnalysis.alerts.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-white mb-3">
            Virgin Atlantic Flights in SIGMET Areas
          </h4>
          <div className="space-y-3">
            {fleetAnalysis.alerts.map((alert, index) => (
              <div key={index} className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-red-400">
                      {alert.flight_number} ({alert.callsign})
                    </div>
                    <div className="text-sm text-gray-400">{alert.route}</div>
                    <div className="text-xs text-gray-500">
                      Position: {alert.position.latitude.toFixed(2)}°, {alert.position.longitude.toFixed(2)}° 
                      @ FL{Math.round(alert.position.altitude / 100)}
                    </div>
                  </div>
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                </div>
                <div className="mt-2 space-y-1">
                  {alert.sigmet_alerts.map((sigmet, sigmetIndex) => (
                    <div key={sigmetIndex} className="text-sm">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getSeverityColor(sigmet.severity)}`}>
                        {sigmet.hazard}
                      </span>
                      <span className="ml-2 text-gray-400">{sigmet.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Alerts State */}
      {fleetAnalysis && fleetAnalysis.alerts.length === 0 && (
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-green-400 font-medium">All Clear</span>
          </div>
          <div className="text-sm text-gray-400 mt-1">
            No Virgin Atlantic flights currently in SIGMET areas
          </div>
        </div>
      )}
    </div>
  );
};

export default SigmetOperationalMonitor;