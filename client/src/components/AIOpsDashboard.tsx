import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Plane, Activity, Cloud, Radio, Radar, MapPin } from "lucide-react";
import ProfessionalSatelliteMap from "./ProfessionalSatelliteMap";
import PassengerImpactModelingComponent from "./PassengerImpactModelingComponent";
import ADSBSubscriptionStatus from "./ADSBSubscriptionStatus";


interface NetworkHealthData {
  onTimePerformance: number;
  cancellations: number;
  diversions: number;
  curfews: number;
}

interface DigitalTwinAlert {
  id: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
}

interface ADSBFlightData {
  flight_number: string;
  airline: string;
  aircraft_type: string;
  registration?: string;
  icao24?: string;
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  heading: number;
  data_source: string;
  authentic_tracking: boolean;
  last_seen?: number;
}

interface FlightStats {
  authentic_flights: number;
  simulated_flights: number;
  authentic_percentage: number;
  data_sources: string[];
}

export default function AIOpsDashboard() {
  // Force refresh - Enhanced Live Map with Interactive Airport Selection
  const [networkHealth, setNetworkHealth] = useState<NetworkHealthData>({
    onTimePerformance: 79,
    cancellations: 12,
    diversions: 4,
    curfews: 6
  });

  const [digitalTwinAlerts, setDigitalTwinAlerts] = useState<DigitalTwinAlert[]>([
    {
      id: '1',
      message: 'Delay forecasted for AA123 due to weather',
      severity: 'high'
    },
    {
      id: '2',
      message: 'Diversion recommended for DL456',
      severity: 'high'
    },
    {
      id: '3',
      message: 'Tight connection detected for UA739',
      severity: 'medium'
    }
  ]);

  const [adsbFlightData, setAdsbFlightData] = useState<ADSBFlightData[]>([]);
  const [flightStats, setFlightStats] = useState<FlightStats>({
    authentic_flights: 0,
    simulated_flights: 0,
    authentic_percentage: 0,
    data_sources: []
  });
  const [isLoadingFlights, setIsLoadingFlights] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Fetch ADS-B Exchange flight data
  const fetchADSBData = async () => {
    setIsLoadingFlights(true);
    try {
      const response = await fetch('/api/aviation/enhanced-flight-data');
      if (response.ok) {
        const data = await response.json();
        setAdsbFlightData(data.flights || []);
        setFlightStats({
          authentic_flights: data.authentic_flight_count || 0,
          simulated_flights: data.simulated_flight_count || 0,
          authentic_percentage: data.authentic_data_percentage || 0,
          data_sources: data.data_sources || []
        });
        setLastUpdate(new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error('Error fetching ADS-B data:', error);
    } finally {
      setIsLoadingFlights(false);
    }
  };

  useEffect(() => {
    // Initial data fetch
    fetchADSBData();
    
    // Set up automatic refresh every 30 seconds
    const interval = setInterval(() => {
      fetchADSBData();
    }, 30000);
    
    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Fetch real-time data from AINO APIs
    const fetchData = async () => {
      try {
        // Fetch network health from existing APIs
        const response = await fetch('/api/aviation/virgin-atlantic-flights');
        const flightData = await response.json();
        
        if (flightData.success && flightData.flights) {
          const flights = flightData.flights;
          const totalFlights = flights.length;
          const onTimeFlights = flights.filter((f: any) => f.delay_minutes <= 5).length;
          const onTimePerformance = Math.round((onTimeFlights / totalFlights) * 100);
          
          const alerts = flights
            .filter((f: any) => f.warnings && f.warnings.length > 0)
            .slice(0, 3)
            .map((f: any, index: number) => ({
              id: `alert-${index}`,
              message: `${f.flight_number}: ${f.warnings.join(', ')}`,
              severity: f.delay_minutes > 30 ? 'high' as const : 'medium' as const
            }));

          setNetworkHealth({
            onTimePerformance,
            cancellations: flights.filter((f: any) => f.current_status === 'CANCELLED').length,
            diversions: flights.filter((f: any) => f.warnings?.includes('DIVERSION')).length,
            curfews: flights.filter((f: any) => f.warnings?.includes('CURFEW')).length
          });

          if (alerts.length > 0) {
            setDigitalTwinAlerts(alerts);
          }
        }
      } catch (error) {
        console.error('Error fetching operations data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-900 text-white min-h-screen overflow-y-auto">
      <div className="flex gap-4 p-4 min-h-screen">
        {/* Live Map View - Takes up 3/4 width */}
        <div className="w-3/4">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-0">
              <div className="p-4 border-b border-slate-600">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Plane className="w-5 h-5" />
                  Live Map View
                </h2>
              </div>
              <div style={{ height: '600px' }} className="relative">
                <ProfessionalSatelliteMap />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Takes up 1/4 width, allows scrolling */}
        <div className="w-1/4 space-y-4 overflow-y-auto max-h-screen">
          {/* ADS-B Subscription Status */}
          <ADSBSubscriptionStatus />
          
          {/* Network Health */}
          <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <h2 className="text-lg font-bold mb-3 text-white flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Network Health
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-300 text-sm">On-Time Performance</span>
                <span className="text-green-400 font-bold">{networkHealth.onTimePerformance}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300 text-sm">Cancellations</span>
                <span className="text-red-400 font-bold">{networkHealth.cancellations}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300 text-sm">Diversions</span>
                <span className="text-yellow-400 font-bold">{networkHealth.diversions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300 text-sm">Curfews</span>
                <span className="text-blue-400 font-bold">{networkHealth.curfews}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Digital Twin Alerts */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <h2 className="text-lg font-bold mb-3 text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Digital Twin Alerts
            </h2>
            <div className="space-y-2">
              {digitalTwinAlerts.map(alert => (
                <div 
                  key={alert.id} 
                  className={`p-2 rounded-lg flex items-start gap-2 ${
                    alert.severity === 'high' 
                      ? 'bg-red-900/50 border border-red-500/50' 
                      : alert.severity === 'medium'
                      ? 'bg-yellow-900/50 border border-yellow-500/50'
                      : 'bg-blue-900/50 border border-blue-500/50'
                  }`}
                >
                  <AlertTriangle className={`w-3 h-3 mt-0.5 ${
                    alert.severity === 'high' ? 'text-red-400' : 
                    alert.severity === 'medium' ? 'text-yellow-400' : 'text-blue-400'
                  }`} />
                  <span className="text-xs text-white">{alert.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Predictive Disruption Timeline */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <h2 className="text-lg font-bold mb-3 text-white">Disruption Timeline</h2>
            <div className="space-y-2">
              <div className="h-6 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-lg relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-slate-900 font-bold text-xs">0h → 6h Forecast</span>
                </div>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>0h</span>
                <span>2h</span>
                <span>4h</span>
                <span>6h</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ADS-B Exchange Flight Statistics */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <h2 className="text-lg font-bold mb-3 text-white flex items-center gap-2">
              <Radio className="w-4 h-4" />
              ADS-B Exchange Data
            </h2>
            {isLoadingFlights ? (
              <div className="text-center py-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                <p className="text-xs text-slate-400 mt-1">Loading flight data...</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 text-sm">Authentic Flights</span>
                  <span className="text-green-400 font-bold">{flightStats.authentic_flights}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 text-sm">Simulated Flights</span>
                  <span className="text-blue-400 font-bold">{flightStats.simulated_flights}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 text-sm">Authentic Data</span>
                  <span className="text-yellow-400 font-bold">{flightStats.authentic_percentage}%</span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-600">
                  <span className="text-xs text-slate-400">Data Sources:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {flightStats.data_sources.map(source => (
                      <span key={source} className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Flight Data */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <h2 className="text-lg font-bold mb-3 text-white flex items-center gap-2">
              <Plane className="w-4 h-4" />
              Live Virgin Atlantic Fleet
            </h2>
            {adsbFlightData.length === 0 && !isLoadingFlights && (
              <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-2 text-orange-300 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>ADS-B Exchange API subscription required for real-time flight data</span>
                </div>
              </div>
            )}
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {adsbFlightData.slice(0, 3).map(flight => (
                <div key={flight.icao24 || flight.flight_number} className="bg-slate-700 rounded-lg p-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-medium text-sm">{flight.flight_number}</p>
                      <p className="text-slate-300 text-xs">{flight.aircraft_type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-300 text-xs">{flight.altitude}ft</p>
                      <p className="text-slate-300 text-xs">{flight.velocity}kt</p>
                    </div>
                  </div>
                  <div className="mt-1">
                    <span className={`text-xs px-2 py-1 rounded ${
                      flight.authentic_tracking 
                        ? 'bg-green-900 text-green-300' 
                        : 'bg-blue-900 text-blue-300'
                    }`}>
                      {flight.authentic_tracking ? 'Authentic' : 'Simulated'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

          {/* Weather data now integrated directly into satellite map */}
        </div>
      </div>
      
      {/* Passenger Impact Modeling - Full Width Bottom Section */}
      <div className="p-4 pt-0">
        <PassengerImpactModelingComponent />
      </div>
    </div>
  );
}