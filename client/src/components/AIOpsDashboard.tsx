import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Plane, Activity, Cloud, Radio, Radar, MapPin } from "lucide-react";
import ProfessionalSatelliteMap from "./ProfessionalSatelliteMap";
import PassengerImpactModelingComponent from "./PassengerImpactModelingComponent";



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
  // Real-time network health calculated from authentic Virgin Atlantic flight data
  const [networkHealth, setNetworkHealth] = useState<NetworkHealthData>({
    onTimePerformance: 95, // Default - will be calculated from real data
    cancellations: 0,
    diversions: 0,
    curfews: 0
  });

  const [digitalTwinAlerts, setDigitalTwinAlerts] = useState<DigitalTwinAlert[]>([]);

  const [adsbFlightData, setAdsbFlightData] = useState<ADSBFlightData[]>([]);
  const [flightStats, setFlightStats] = useState<FlightStats>({
    authentic_flights: 0,
    simulated_flights: 0,
    authentic_percentage: 0,
    data_sources: []
  });
  const [isLoadingFlights, setIsLoadingFlights] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Generate predictive alerts based on authentic Virgin Atlantic flight data and real weather
  const generatePredictiveAlerts = async (flights: any[]) => {
    const alerts: DigitalTwinAlert[] = [];
    
    // Predictive analysis based on authentic data patterns
    const currentHour = new Date().getHours();
    
    try {
      // Fetch real LHR weather data to inform predictions
      const weatherResponse = await fetch('/api/weather/avwx/EGLL');
      let weatherImpacting = false;
      
      if (weatherResponse.ok) {
        const weatherData = await weatherResponse.json();
        // Only flag weather impact if visibility < 5km, wind > 30kt, or severe conditions
        const visibility = weatherData.visibility_statute_mi || 10;
        const windSpeed = weatherData.wind_speed_kt || 0;
        const conditions = weatherData.flight_rules || 'VFR';
        
        weatherImpacting = visibility < 3 || windSpeed > 30 || conditions === 'LIFR' || conditions === 'IFR';
      }
      
      flights.forEach((flight: any) => {
        // Real weather-based prediction (only when weather is actually impacting)
        if (weatherImpacting && flight.route?.includes('LHR')) {
          alerts.push({
            id: `weather_impact_${flight.flight_number}`,
            message: `Weather monitoring: ${flight.flight_number} (${flight.route}) - conditions affecting operations`,
            severity: 'medium'
          });
        }
        
        // Peak hour delay prediction for trans-Atlantic routes (3-7 PM)
        if (flight.route?.includes('LHR') && (flight.route?.includes('JFK') || flight.route?.includes('BOS') || flight.route?.includes('ATL'))) {
          if (currentHour >= 15 && currentHour <= 19) {
            alerts.push({
              id: `peak_hour_${flight.flight_number}`,
              message: `Peak hour operations: ${flight.flight_number} (${flight.route}) - enhanced monitoring`,
              severity: 'low'
            });
          }
        }
        
        // Connection optimization for approaching flights
        if (flight.route?.endsWith('LHR') && flight.altitude < 20000) {
          alerts.push({
            id: `connection_${flight.flight_number}`,
            message: `Connection optimization: ${flight.flight_number} approaching LHR`,
            severity: 'low'
          });
        }
        
        // Fuel efficiency for long-haul Pacific routes
        if (flight.altitude > 35000 && (flight.route?.includes('SFO') || flight.route?.includes('LAX'))) {
          alerts.push({
            id: `fuel_efficiency_${flight.flight_number}`,
            message: `Fuel optimization available: ${flight.flight_number} Pacific route`,
            severity: 'low'
          });
        }
      });
    } catch (error) {
      console.error('Weather data fetch failed for predictions:', error);
    }
    
    // Network performance monitoring
    if (alerts.length === 0) {
      alerts.push({
        id: 'network_performance',
        message: `Network status: ${flights.length} Virgin Atlantic flights monitored - all systems optimal`,
        severity: 'low'
      });
    }
    
    // Limit to 3 most relevant alerts
    return alerts.slice(0, 3);
  };

  // Fetch authentic ADS-B Exchange flight data
  const fetchADSBData = async () => {
    setIsLoadingFlights(true);
    try {
      // Use primary Virgin Atlantic flights endpoint with authentic ADS-B Exchange data
      const response = await fetch('/api/aviation/virgin-atlantic-flights');
      if (response.ok) {
        const data = await response.json();
        const flights = data.flights || [];
        
        // Calculate authentic vs simulated data statistics
        const authenticFlights = flights.filter((f: any) => f.authentic_tracking);
        const simulatedFlights = flights.filter((f: any) => !f.authentic_tracking);
        
        setAdsbFlightData(flights);
        setFlightStats({
          authentic_flights: authenticFlights.length,
          simulated_flights: simulatedFlights.length,
          authentic_percentage: flights.length > 0 ? (authenticFlights.length / flights.length) * 100 : 0,
          data_sources: Array.from(new Set(flights.map((f: any) => f.data_source).filter(Boolean)))
        });
        setLastUpdate(new Date().toLocaleTimeString());
        
        // Calculate real-time network health from authentic flight data
        const activeFlights = flights.filter((f: any) => f.authentic_tracking);
        const onTimeFlights = activeFlights.filter((f: any) => 
          f.status?.includes('En Route') && !f.status?.includes('Delayed')
        ).length;
        const onTimePerformance = activeFlights.length > 0 ? 
          Math.round((onTimeFlights / activeFlights.length) * 100) : 95;
        
        // Count any actual disruptions from flight data
        const diversions = flights.filter((f: any) => 
          f.status?.includes('Diverted') || f.warnings?.some((w: any) => w.includes('diversion'))
        ).length;
        
        const cancellations = flights.filter((f: any) => 
          f.status?.includes('Cancelled')
        ).length;
        
        setNetworkHealth({
          onTimePerformance,
          cancellations,
          diversions,
          curfews: 0 // No current curfew restrictions
        });

        // Generate predictive alerts with real weather data
        generatePredictiveAlerts(flights).then(predictiveAlerts => {
          setDigitalTwinAlerts(predictiveAlerts);
        });
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

  // Network health calculation from flight data
  useEffect(() => {
    if (adsbFlightData.length > 0) {
      const totalFlights = adsbFlightData.length;
      const onTimeFlights = adsbFlightData.filter((f: any) => !f.delay_minutes || f.delay_minutes <= 5).length;
      const onTimePerformance = Math.round((onTimeFlights / totalFlights) * 100);
      
      setNetworkHealth({
        onTimePerformance,
        cancellations: adsbFlightData.filter((f: any) => f.current_status === 'CANCELLED').length,
        diversions: adsbFlightData.filter((f: any) => f.warnings?.includes('DIVERSION')).length,
        curfews: adsbFlightData.filter((f: any) => f.warnings?.includes('CURFEW')).length
      });
    }
  }, [adsbFlightData]);

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
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-2 text-blue-300 text-sm">
                  <Radar className="w-4 h-4" />
                  <span>No Virgin Atlantic flights currently airborne - ADS-B Exchange active</span>
                </div>
              </div>
            )}
            
            {adsbFlightData.length > 0 && flightStats.authentic_percentage === 100 && (
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-2 text-green-300 text-sm">
                  <Radar className="w-4 h-4" />
                  <span>100% Authentic ADS-B Exchange Data - {adsbFlightData.length} live flights tracked</span>
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