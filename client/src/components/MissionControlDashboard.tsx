import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Plane, 
  AlertTriangle, 
  Cloud, 
  Radio, 
  Activity,
  Navigation,
  MapPin,
  RefreshCw
} from 'lucide-react';

// OpenSky live flight data interface
interface LiveFlight {
  callsign: string;
  icao24: string;
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  heading: number;
  origin_country: string;
  on_ground: boolean;
}

// Hub airport status interface
interface HubStatus {
  airport: string;
  code: string;
  status: 'operational' | 'delays' | 'disrupted';
  delays: number;
  onTimePerformance: number;
}

// NOTAM interface
interface NotamAlert {
  id: string;
  airport: string;
  type: string;
  description: string;
  effective: string;
  severity: 'high' | 'medium' | 'low';
}

// Weather system interface
interface WeatherSystem {
  id: string;
  type: string;
  location: string;
  severity: 'severe' | 'moderate' | 'light';
  impact: string;
}

// Active diversion interface
interface ActiveDiversion {
  flightNumber: string;
  originalDestination: string;
  diversionAirport: string;
  reason: string;
  status: string;
  checklistComplete: number;
}

export default function MissionControlDashboard() {
  // State for live flight data
  const [liveFlights, setLiveFlights] = useState<LiveFlight[]>([]);
  const [isLoadingFlights, setIsLoadingFlights] = useState(true);
  
  // State for secondary display cards
  const [hubStatus, setHubStatus] = useState<HubStatus[]>([
    { airport: 'London Heathrow', code: 'LHR', status: 'operational', delays: 2, onTimePerformance: 94 },
    { airport: 'John F. Kennedy', code: 'JFK', status: 'delays', delays: 8, onTimePerformance: 87 }
  ]);
  
  const [notamAlerts, setNotamAlerts] = useState<NotamAlert[]>([
    {
      id: 'NOTAM001',
      airport: 'JFK',
      type: 'Runway Closure',
      description: 'Runway 04L/22R closed for maintenance',
      effective: '2025-08-03 16:00 - 22:00 UTC',
      severity: 'high'
    }
  ]);
  
  const [weatherSystems, setWeatherSystems] = useState<WeatherSystem[]>([
    {
      id: 'WX001',
      type: 'Thunderstorm',
      location: 'East Coast US',
      severity: 'moderate',
      impact: 'Potential delays for US arrivals'
    }
  ]);
  
  const [activeDiversions, setActiveDiversions] = useState<ActiveDiversion[]>([
    {
      flightNumber: 'VS42',
      originalDestination: 'JFK',
      diversionAirport: 'BOS',
      reason: 'Weather',
      status: 'In Progress',
      checklistComplete: 75
    }
  ]);

  // Fetch live flight data from OpenSky API
  const fetchLiveFlights = async () => {
    setIsLoadingFlights(true);
    try {
      // Get Virgin Atlantic flights using the existing OpenSky integration
      const response = await fetch('/api/flights/real-tracking?airline=virgin');
      if (response.ok) {
        const data = await response.json();
        setLiveFlights(data.flights || []);
      } else {
        // Fallback to demo data if API is not available
        setLiveFlights([
          {
            callsign: 'VS42',
            icao24: 'G-VRAY',
            latitude: 51.4775,
            longitude: -0.4614,
            altitude: 35000,
            velocity: 250,
            heading: 270,
            origin_country: 'United Kingdom',
            on_ground: false
          },
          {
            callsign: 'VS3',
            icao24: 'G-VNAP',
            latitude: 40.6413,
            longitude: -73.7781,
            altitude: 1000,
            velocity: 180,
            heading: 90,
            origin_country: 'United Kingdom',
            on_ground: false
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching live flights:', error);
      // Use demo data as fallback
      setLiveFlights([]);
    } finally {
      setIsLoadingFlights(false);
    }
  };

  // Load data on component mount and set up refresh
  useEffect(() => {
    fetchLiveFlights();
    const interval = setInterval(fetchLiveFlights, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Navigation className="h-8 w-8 text-red-600" />
              Virgin Atlantic Mission Control
            </h1>
            <p className="text-gray-600 mt-2">
              Real-time airline network operations management
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchLiveFlights}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </button>
            <div className="text-sm text-gray-500">
              Last Updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Primary Display - Live Flight Map */}
        <div className="col-span-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Plane className="h-5 w-5 text-red-600" />
                  Live Flight Map - Virgin Atlantic
                </h2>
                <div className="text-sm text-gray-500">
                  {liveFlights.length} Active Flights
                </div>
              </div>
              
              {/* Flight Map Container */}
              <div className="relative bg-gray-100 rounded-lg h-96 overflow-hidden">
                {/* Simple flight visualization */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-200">
                  {isLoadingFlights ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-gray-500 flex items-center gap-2">
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        Loading live flights...
                      </div>
                    </div>
                  ) : (
                    <>
                      {liveFlights.map((flight, index) => (
                        <div
                          key={flight.icao24}
                          className="absolute w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:bg-red-700 transition-colors"
                          style={{
                            left: `${20 + (index * 15) % 60}%`,
                            top: `${30 + (index * 20) % 40}%`,
                            transform: `rotate(${flight.heading}deg)`
                          }}
                          title={`${flight.callsign} - ${flight.origin_country} - Alt: ${flight.altitude}ft`}
                        >
                          ✈
                        </div>
                      ))}
                      
                      {/* Hub airport markers */}
                      <div className="absolute w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold" 
                           style={{ left: '15%', top: '45%' }} title="London Heathrow (LHR)">
                        LHR
                      </div>
                      <div className="absolute w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold" 
                           style={{ left: '75%', top: '35%' }} title="John F. Kennedy (JFK)">
                        JFK
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Display Cards */}
        <div className="col-span-4 space-y-6">
          {/* Hub Airports Status */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                Hub Status
              </h3>
              <div className="space-y-3">
                {hubStatus.map((hub) => (
                  <div key={hub.code} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{hub.code}</div>
                      <div className="text-sm text-gray-600">{hub.airport}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${
                        hub.status === 'operational' ? 'text-green-600' : 
                        hub.status === 'delays' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {hub.status.toUpperCase()}
                      </div>
                      <div className="text-xs text-gray-500">OTP: {hub.onTimePerformance}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* NOTAMs */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                Active NOTAMs
              </h3>
              <div className="space-y-3">
                {notamAlerts.map((notam) => (
                  <div key={notam.id} className="p-3 bg-orange-50 border-l-4 border-orange-400 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-orange-800">{notam.airport}</div>
                      <div className={`text-xs px-2 py-1 rounded ${
                        notam.severity === 'high' ? 'bg-red-100 text-red-800' :
                        notam.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {notam.severity.toUpperCase()}
                      </div>
                    </div>
                    <div className="text-sm text-orange-700 mb-1">{notam.type}</div>
                    <div className="text-xs text-orange-600">{notam.effective}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Major Weather Systems */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Cloud className="h-4 w-4 text-blue-600" />
                Weather Systems
              </h3>
              <div className="space-y-3">
                {weatherSystems.map((weather) => (
                  <div key={weather.id} className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-blue-800">{weather.type}</div>
                      <div className={`text-xs px-2 py-1 rounded ${
                        weather.severity === 'severe' ? 'bg-red-100 text-red-800' :
                        weather.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {weather.severity.toUpperCase()}
                      </div>
                    </div>
                    <div className="text-sm text-blue-700 mb-1">{weather.location}</div>
                    <div className="text-xs text-blue-600">{weather.impact}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Diversions */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Radio className="h-4 w-4 text-purple-600" />
                Active Diversions
              </h3>
              <div className="space-y-3">
                {activeDiversions.map((diversion) => (
                  <div key={diversion.flightNumber} className="p-3 bg-purple-50 border-l-4 border-purple-400 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-purple-800">{diversion.flightNumber}</div>
                      <div className="text-xs text-purple-600">{diversion.status}</div>
                    </div>
                    <div className="text-sm text-purple-700 mb-1">
                      {diversion.originalDestination} → {diversion.diversionAirport}
                    </div>
                    <div className="text-xs text-purple-600 mb-2">{diversion.reason}</div>
                    <div className="w-full bg-purple-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: `${diversion.checklistComplete}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                      Checklist: {diversion.checklistComplete}% complete
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}