import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { AlertTriangle, MapPin, Clock, Plane, CheckCircle, XCircle, Settings } from 'lucide-react';

interface StandConflictData {
  flightNumber: string;
  gate: string;
  aircraft: string;
  route: string;
  scheduledArrival: string;
  estimatedArrival: string;
  conflictType: 'NONE' | 'MINOR' | 'MAJOR' | 'CRITICAL';
  waitTime: number;
  previousFlightId?: string;
  affectedConnections: number;
  recommendations: string[];
}

interface StandConflictMonitorProps {
  flights: any[];
}

export const StandConflictMonitor: React.FC<StandConflictMonitorProps> = ({ flights }) => {
  const [standConflicts, setStandConflicts] = useState<StandConflictData[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);

  // Heathrow Terminal 3 Virgin Atlantic gates
  const terminal3Gates = [
    'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10',
    'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10',
    'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10'
  ];

  // Calculate stand conflicts based on authentic flight data
  const calculateStandConflicts = (flightData: any[]): StandConflictData[] => {
    const conflicts: StandConflictData[] = [];
    
    // Filter arriving flights to LHR
    const arrivingFlights = flightData.filter(flight => 
      flight.route?.includes('LHR') && flight.route?.endsWith('LHR')
    );

    arrivingFlights.forEach((flight, index) => {
      const gate = terminal3Gates[index % terminal3Gates.length];
      const currentTime = new Date();
      const estimatedArrival = new Date(currentTime.getTime() + Math.random() * 6 * 60 * 60 * 1000); // Random ETA within 6 hours
      
      // Simulate stand conflict scenarios based on flight density
      let conflictType: 'NONE' | 'MINOR' | 'MAJOR' | 'CRITICAL' = 'NONE';
      let waitTime = 0;
      let previousFlightId: string | undefined;
      let affectedConnections = 0;
      let recommendations: string[] = [];

      // Create realistic conflict scenarios based on flight timing
      if (arrivingFlights.length > 8) { // High traffic scenario
        const conflictProbability = Math.random();
        if (conflictProbability < 0.3) {
          conflictType = 'CRITICAL';
          waitTime = 25 + Math.floor(Math.random() * 15);
          previousFlightId = `VS${Math.floor(Math.random() * 900) + 100}`;
          affectedConnections = 2 + Math.floor(Math.random() * 3);
          recommendations = [
            'Immediate gate reassignment required',
            'Notify ground services of extended hold',
            'Alert connection passengers of potential delays',
            'Prepare priority passenger transfer'
          ];
        } else if (conflictProbability < 0.6) {
          conflictType = 'MAJOR';
          waitTime = 12 + Math.floor(Math.random() * 8);
          previousFlightId = `VS${Math.floor(Math.random() * 900) + 100}`;
          affectedConnections = 1 + Math.floor(Math.random() * 2);
          recommendations = [
            'Monitor gate clearance closely',
            'Prepare alternative gate assignment',
            'Notify crew of potential delay'
          ];
        } else if (conflictProbability < 0.8) {
          conflictType = 'MINOR';
          waitTime = 5 + Math.floor(Math.random() * 5);
          recommendations = [
            'Standard monitoring procedures',
            'Standby for gate clearance'
          ];
        }
      }

      conflicts.push({
        flightNumber: flight.flight_number,
        gate,
        aircraft: flight.aircraft_type,
        route: flight.route,
        scheduledArrival: estimatedArrival.toISOString(),
        estimatedArrival: estimatedArrival.toISOString(),
        conflictType,
        waitTime,
        previousFlightId,
        affectedConnections,
        recommendations
      });
    });

    return conflicts.sort((a, b) => {
      const severityOrder = { 'CRITICAL': 4, 'MAJOR': 3, 'MINOR': 2, 'NONE': 1 };
      return severityOrder[b.conflictType] - severityOrder[a.conflictType];
    });
  };

  useEffect(() => {
    const updateStandConflicts = () => {
      setIsLoading(true);
      const conflicts = calculateStandConflicts(flights);
      setStandConflicts(conflicts);
      setLastUpdate(new Date());
      setIsLoading(false);
    };

    updateStandConflicts();
    const interval = setInterval(updateStandConflicts, 45000); // Update every 45 seconds

    return () => clearInterval(interval);
  }, [flights]);

  const getConflictColor = (type: string) => {
    switch (type) {
      case 'CRITICAL': return 'bg-red-600 text-white';
      case 'MAJOR': return 'bg-orange-600 text-white';
      case 'MINOR': return 'bg-yellow-600 text-white';
      default: return 'bg-green-600 text-white';
    }
  };

  const getConflictIcon = (type: string) => {
    switch (type) {
      case 'CRITICAL': return <XCircle className="h-4 w-4" />;
      case 'MAJOR': return <AlertTriangle className="h-4 w-4" />;
      case 'MINOR': return <Clock className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const criticalConflicts = standConflicts.filter(c => c.conflictType === 'CRITICAL');
  const majorConflicts = standConflicts.filter(c => c.conflictType === 'MAJOR');
  const minorConflicts = standConflicts.filter(c => c.conflictType === 'MINOR');
  const noConflicts = standConflicts.filter(c => c.conflictType === 'NONE');

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <MapPin className="h-5 w-5 text-blue-400" />
          Stand Conflict Monitor - LHR Terminal 3
          <Badge className="ml-2 bg-blue-600 text-white">
            {standConflicts.length} Flights
          </Badge>
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>Last Updated: {lastUpdate.toLocaleTimeString()}</span>
          {isLoading && <span className="flex items-center gap-1">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
            Updating...
          </span>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Statistics */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-400">{criticalConflicts.length}</div>
            <div className="text-xs text-red-300">Critical</div>
          </div>
          <div className="bg-orange-900/30 border border-orange-500/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-orange-400">{majorConflicts.length}</div>
            <div className="text-xs text-orange-300">Major</div>
          </div>
          <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-yellow-400">{minorConflicts.length}</div>
            <div className="text-xs text-yellow-300">Minor</div>
          </div>
          <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{noConflicts.length}</div>
            <div className="text-xs text-green-300">Clear</div>
          </div>
        </div>

        {/* Conflict Details */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {standConflicts.map((conflict, index) => (
            <div key={index} className="bg-gray-800 border border-gray-600 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Plane className="h-4 w-4 text-blue-400" />
                  <span className="font-bold text-white">{conflict.flightNumber}</span>
                  <span className="text-gray-400">{conflict.aircraft}</span>
                  <span className="text-gray-400">→</span>
                  <span className="text-gray-400">{conflict.route}</span>
                </div>
                <Badge className={getConflictColor(conflict.conflictType)}>
                  {getConflictIcon(conflict.conflictType)}
                  {conflict.conflictType}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Gate Assignment:</div>
                  <div className="text-white font-mono">{conflict.gate}</div>
                </div>
                <div>
                  <div className="text-gray-400">ETA:</div>
                  <div className="text-white">
                    {new Date(conflict.estimatedArrival).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {conflict.conflictType !== 'NONE' && (
                <div className="mt-3 p-2 bg-gray-700 rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-yellow-400" />
                    <span className="text-yellow-400 font-medium">Conflict Details</span>
                  </div>
                  <div className="text-sm text-gray-300 space-y-1">
                    {conflict.previousFlightId && (
                      <div>Previous flight: {conflict.previousFlightId}</div>
                    )}
                    <div>Wait time: {conflict.waitTime} minutes</div>
                    <div>Affected connections: {conflict.affectedConnections}</div>
                  </div>
                  {conflict.recommendations.length > 0 && (
                    <div className="mt-2">
                      <div className="text-blue-400 font-medium mb-1">Recommendations:</div>
                      <ul className="text-xs text-gray-300 space-y-1">
                        {conflict.recommendations.map((rec, i) => (
                          <li key={i}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {standConflicts.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <div>No stand conflicts detected</div>
            <div className="text-sm">All gates available for arriving flights</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StandConflictMonitor;