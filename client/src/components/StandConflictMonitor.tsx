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

  // Fetch authentic stand conflicts from backend API
  const fetchStandConflicts = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/stand-conflict/conflicts');
      if (!response.ok) {
        throw new Error('Failed to fetch stand conflicts');
      }
      
      const data = await response.json();
      if (data.success && data.conflicts) {
        // Map backend response to frontend interface
        const mappedConflicts: StandConflictData[] = data.conflicts.map((conflict: any) => ({
          flightNumber: conflict.flightNumber,
          gate: conflict.gate,
          aircraft: conflict.aircraft,
          route: conflict.route,
          scheduledArrival: conflict.scheduledArrival,
          estimatedArrival: conflict.estimatedArrival,
          conflictType: conflict.conflictType,
          waitTime: conflict.waitTime,
          previousFlightId: conflict.previousFlightId,
          affectedConnections: conflict.affectedConnections,
          recommendations: conflict.recommendations || []
        }));
        
        setStandConflicts(mappedConflicts);
        setLastUpdate(new Date());
        console.log(`✅ Stand conflicts loaded: ${mappedConflicts.length} flights with authentic gate assignments`);
      }
    } catch (error) {
      console.error('Error fetching stand conflicts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch authentic stand conflicts on component mount and when flights change
    fetchStandConflicts();
    
    // Set up periodic refresh to get latest authentic gate assignments
    const interval = setInterval(fetchStandConflicts, 45000); // Update every 45 seconds

    return () => clearInterval(interval);
  }, []); // Empty dependency array since we want to fetch regardless of flights prop

  const getConflictColor = (type: string) => {
    switch (type) {
      case 'CRITICAL': return 'bg-va-red-primary text-foreground';
      case 'MAJOR': return 'bg-aero-orange-vibrant text-foreground';
      case 'MINOR': return 'bg-aero-amber-caution text-foreground';
      default: return 'bg-aero-green-safe text-foreground';
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
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-aero-blue-primary" />
            <span className="text-foreground">Stand Conflict Monitor - LHR Terminal 3</span>
            <Badge className="ml-2 bg-aero-blue-primary text-foreground">
              {standConflicts.length} Flights
            </Badge>
          </div>
          <Button 
            onClick={fetchStandConflicts}
            disabled={isLoading}
            size="sm"
            className="bg-aero-blue-primary hover:bg-aero-blue-light text-foreground"
          >
            <Settings className="h-4 w-4 mr-1" />
            Refresh Gates
          </Button>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Last Updated: {lastUpdate.toLocaleTimeString()}</span>
          <span>Authentic Heathrow T3 Gate Assignments</span>
          {isLoading && <span className="flex items-center gap-1">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
            Updating...
          </span>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Statistics */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-va-red-primary/20 border border-va-red-primary/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-va-red-primary">{criticalConflicts.length}</div>
            <div className="text-xs text-va-red-primary">Critical</div>
          </div>
          <div className="bg-aero-orange-vibrant/20 border border-aero-orange-vibrant/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-aero-orange-alert">{majorConflicts.length}</div>
            <div className="text-xs text-aero-orange-alert">Major</div>
          </div>
          <div className="bg-aero-amber-caution/20 border border-aero-amber-caution/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-aero-amber-caution">{minorConflicts.length}</div>
            <div className="text-xs text-aero-amber-dark">Minor</div>
          </div>
          <div className="bg-aero-green-safe/20 border border-aero-green-safe/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-aero-green-safe">{noConflicts.length}</div>
            <div className="text-xs text-aero-green-dark">Clear</div>
          </div>
        </div>

        {/* Conflict Details */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {standConflicts.map((conflict, index) => (
            <div key={index} className="bg-card border border-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Plane className="h-4 w-4 text-aero-blue-primary" />
                  <span className="font-bold text-foreground">{conflict.flightNumber}</span>
                  <span className="text-muted-foreground">{conflict.aircraft}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-muted-foreground">{conflict.route}</span>
                </div>
                <Badge className={getConflictColor(conflict.conflictType)}>
                  {getConflictIcon(conflict.conflictType)}
                  {conflict.conflictType}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Gate Assignment:</div>
                  <div className="text-foreground font-mono">{conflict.gate}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">ETA:</div>
                  <div className="text-foreground">
                    {new Date(conflict.estimatedArrival).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {conflict.conflictType !== 'NONE' && (
                <div className="mt-3 p-2 bg-gray-700 rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-aero-amber-caution" />
                    <span className="text-aero-amber-caution font-medium">Conflict Details</span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {conflict.previousFlightId && (
                      <div>Previous flight: {conflict.previousFlightId}</div>
                    )}
                    <div>Wait time: {conflict.waitTime} minutes</div>
                    <div>Affected connections: {conflict.affectedConnections}</div>
                  </div>
                  {conflict.recommendations.length > 0 && (
                    <div className="mt-2">
                      <div className="text-aero-blue-primary font-medium mb-1">Recommendations:</div>
                      <ul className="text-xs text-muted-foreground space-y-1">
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
          <div className="text-center py-8 text-muted-foreground">
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