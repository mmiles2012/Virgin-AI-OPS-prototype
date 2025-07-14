/**
 * FlightAware ADS-B and FAA NOTAM Integration Dashboard
 * Displays authentic flight tracking and airspace information
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Plane, 
  Navigation, 
  AlertTriangle, 
  MapPin, 
  Clock, 
  Fuel,
  Activity,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap
} from 'lucide-react';

interface FlightAwareTrack {
  ident: string;
  registration: string;
  aircraft_type: string;
  origin: string;
  destination: string;
  departure_time: number;
  arrival_time: number;
  positions: Array<{
    timestamp: number;
    latitude: number;
    longitude: number;
    altitude: number;
    groundspeed: number;
    track: number;
  }>;
  waypoints: Array<{
    name: string;
    latitude: number;
    longitude: number;
    altitude: number;
    eta: number;
    distance_remaining: number;
  }>;
  status: string;
  progress_percent: number;
}

interface FAANotam {
  notamNumber: string;
  featureType: string;
  issueDate: string;
  startDate: string;
  endDate: string;
  icaoLocation: string;
  text: string;
  classification: string;
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

const FlightAwareNotamDashboard: React.FC = () => {
  const [flightAwareData, setFlightAwareData] = useState<{
    flights: FlightAwareTrack[];
    analytics: any;
    health: any;
    loading: boolean;
    error: string | null;
  }>({
    flights: [],
    analytics: null,
    health: null,
    loading: true,
    error: null
  });

  const [notamData, setNotamData] = useState<{
    virginAtlanticNotams: FAANotam[];
    criticalNotams: FAANotam[];
    summary: any;
    health: any;
    loading: boolean;
    error: string | null;
  }>({
    virginAtlanticNotams: [],
    criticalNotams: [],
    summary: null,
    health: null,
    loading: true,
    error: null
  });

  const [aviationIntelligence, setAviationIntelligence] = useState<{
    alerts: any[];
    routes: any[];
    recommendations: any;
    loading: boolean;
    error: string | null;
  }>({
    alerts: [],
    routes: [],
    recommendations: null,
    loading: true,
    error: null
  });

  const [selectedFlight, setSelectedFlight] = useState<string | null>(null);
  const [flightDetails, setFlightDetails] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'flightaware' | 'notams' | 'integration' | 'intelligence'>('intelligence');

  // Load FlightAware data
  const loadFlightAwareData = async () => {
    setFlightAwareData(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const [flightsRes, analyticsRes, healthRes] = await Promise.all([
        fetch('/api/flightaware/virgin-atlantic'),
        fetch('/api/flightaware/analytics'),
        fetch('/api/flightaware/health')
      ]);

      const flights = await flightsRes.json();
      const analytics = await analyticsRes.json();
      const health = await healthRes.json();

      setFlightAwareData({
        flights: flights.flights || [],
        analytics: analytics.analytics || null,
        health: health.flightaware_status || null,
        loading: false,
        error: null
      });
    } catch (error: any) {
      setFlightAwareData(prev => ({
        ...prev,
        loading: false,
        error: `FlightAware data failed: ${error.message}`
      }));
    }
  };

  // Load FAA NOTAM data
  const loadNotamData = async () => {
    setNotamData(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const [virginRes, criticalRes, summaryRes, healthRes] = await Promise.all([
        fetch('/api/faa/notams/virgin-atlantic'),
        fetch('/api/faa/notams/critical'),
        fetch('/api/faa/notams/summary'),
        fetch('/api/faa/notams/health')
      ]);

      const virginNotams = await virginRes.json();
      const criticalNotams = await criticalRes.json();
      const summary = await summaryRes.json();
      const health = await healthRes.json();

      setNotamData({
        virginAtlanticNotams: virginNotams.notams || [],
        criticalNotams: criticalNotams.critical_notams || [],
        summary: summary.notam_summary || null,
        health: health.faa_notam_status || null,
        loading: false,
        error: null
      });
    } catch (error: any) {
      setNotamData(prev => ({
        ...prev,
        loading: false,
        error: `FAA NOTAM data failed: ${error.message}`
      }));
    }
  };

  // Load flight details
  const loadFlightDetails = async (ident: string) => {
    try {
      const [trackRes, positionRes, routeRes] = await Promise.all([
        fetch(`/api/flightaware/flight/${ident}/track`),
        fetch(`/api/flightaware/flight/${ident}/position`),
        fetch(`/api/flightaware/flight/${ident}/route`)
      ]);

      const track = await trackRes.json();
      const position = await positionRes.json();
      const route = await routeRes.json();

      setFlightDetails({
        track: track.flight_track || null,
        position: position.position || null,
        waypoints: route.waypoints || []
      });
    } catch (error) {
      console.error('Failed to load flight details:', error);
    }
  };

  // Load Aviation Intelligence data
  const loadAviationIntelligence = async () => {
    setAviationIntelligence(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const [alertsRes, routesRes, recommendationsRes] = await Promise.all([
        fetch('/api/aviation/intelligence/alerts'),
        fetch('/api/aviation/intelligence/routes'),
        fetch('/api/aviation/intelligence/recommendations')
      ]);

      const [alerts, routes, recommendations] = await Promise.all([
        alertsRes.json(),
        routesRes.json(),
        recommendationsRes.json()
      ]);

      setAviationIntelligence({
        alerts: alerts.alerts || [],
        routes: routes.routes || [],
        recommendations: recommendations.recommendations || null,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error loading aviation intelligence:', error);
      setAviationIntelligence(prev => ({
        ...prev,
        loading: false,
        error: 'Aviation intelligence service requires FlightAware and FAA NOTAM API keys.'
      }));
    }
  };

  useEffect(() => {
    loadFlightAwareData();
    loadNotamData();
    loadAviationIntelligence();
  }, []);

  const refreshAll = () => {
    loadFlightAwareData();
    loadNotamData();
    loadAviationIntelligence();
    if (selectedFlight) {
      loadFlightDetails(selectedFlight);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'text-green-500';
      case 'error': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'CRITICAL': return 'bg-red-600 text-white';
      case 'HIGH': return 'bg-orange-500 text-white';
      case 'MEDIUM': return 'bg-yellow-500 text-white';
      case 'LOW': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-900 text-white p-4 overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Plane className="text-blue-400" />
              FlightAware & FAA NOTAM Integration
            </h1>
            <p className="text-gray-400 mt-2">
              Authentic Virgin Atlantic flight tracking and airspace information
            </p>
          </div>
          <Button 
            onClick={refreshAll}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh All
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mt-4">
          {[
            { id: 'intelligence', label: 'Aviation Intelligence', icon: Zap },
            { id: 'flightaware', label: 'FlightAware ADS-B', icon: Plane },
            { id: 'notams', label: 'FAA NOTAMs', icon: AlertTriangle },
            { id: 'integration', label: 'Integrated Analysis', icon: Activity }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                activeTab === id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* FlightAware Tab */}
      {activeTab === 'flightaware' && (
        <div className="space-y-6">
          {/* Service Status */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="text-blue-400" />
                FlightAware Service Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {flightAwareData.health ? (
                <div className="flex items-center gap-4">
                  {flightAwareData.health.status === 'ok' ? (
                    <CheckCircle className="text-green-500" />
                  ) : (
                    <XCircle className="text-red-500" />
                  )}
                  <div>
                    <div className={`font-medium ${getStatusColor(flightAwareData.health.status)}`}>
                      {flightAwareData.health.status.toUpperCase()}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {flightAwareData.health.message}
                    </div>
                    <div className="text-xs text-gray-500">
                      Authenticated: {flightAwareData.health.authenticated ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-400">Status checking...</div>
              )}
            </CardContent>
          </Card>

          {/* Fleet Analytics */}
          {flightAwareData.analytics && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Virgin Atlantic Fleet Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {flightAwareData.analytics.total_flights}
                    </div>
                    <div className="text-gray-400 text-sm">Total Flights</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {flightAwareData.analytics.active_flights}
                    </div>
                    <div className="text-gray-400 text-sm">En Route</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">
                      {flightAwareData.analytics.average_altitude}ft
                    </div>
                    <div className="text-gray-400 text-sm">Avg Altitude</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {flightAwareData.analytics.average_groundspeed}kts
                    </div>
                    <div className="text-gray-400 text-sm">Avg Speed</div>
                  </div>
                </div>
                
                {/* Aircraft Types */}
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Aircraft Types</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(flightAwareData.analytics.aircraft_types || {}).map(([type, count]) => (
                      <Badge key={type} variant="secondary" className="bg-gray-700 text-gray-200">
                        {type}: {count}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Flights */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Navigation className="text-green-400" />
                Active Virgin Atlantic Flights
                <Badge variant="outline" className="text-blue-400 border-blue-400">
                  {flightAwareData.flights.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {flightAwareData.loading ? (
                <div className="text-gray-400">Loading flights...</div>
              ) : flightAwareData.error ? (
                <div className="text-red-400">{flightAwareData.error}</div>
              ) : flightAwareData.flights.length === 0 ? (
                <div className="text-gray-400">No active flights found</div>
              ) : (
                <div className="space-y-3">
                  {flightAwareData.flights.map((flight) => (
                    <div 
                      key={flight.ident}
                      className="p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
                      onClick={() => {
                        setSelectedFlight(flight.ident);
                        loadFlightDetails(flight.ident);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Plane className="text-blue-400" />
                          <div>
                            <div className="font-medium text-white">{flight.ident}</div>
                            <div className="text-sm text-gray-400">
                              {flight.origin} → {flight.destination}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-300">{flight.aircraft_type}</div>
                          <div className="text-xs text-gray-500">{flight.status}</div>
                        </div>
                      </div>
                      
                      {flight.positions.length > 0 && (
                        <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-400">
                          <div>Alt: {flight.positions[flight.positions.length - 1].altitude}ft</div>
                          <div>Speed: {flight.positions[flight.positions.length - 1].groundspeed}kts</div>
                          <div>Progress: {flight.progress_percent}%</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Flight Details */}
          {selectedFlight && flightDetails && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Flight Details: {selectedFlight}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Current Position */}
                  {flightDetails.position && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Current Position</h4>
                      <div className="space-y-1 text-sm text-gray-400">
                        <div>Lat: {flightDetails.position.latitude.toFixed(4)}°</div>
                        <div>Lon: {flightDetails.position.longitude.toFixed(4)}°</div>
                        <div>Alt: {flightDetails.position.altitude}ft</div>
                        <div>Speed: {flightDetails.position.groundspeed}kts</div>
                        <div>Track: {flightDetails.position.track}°</div>
                      </div>
                    </div>
                  )}

                  {/* Next Waypoints */}
                  {flightDetails.waypoints.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Next Waypoints</h4>
                      <div className="space-y-1">
                        {flightDetails.waypoints.slice(0, 5).map((wp: any, idx: number) => (
                          <div key={idx} className="text-sm text-gray-400 flex justify-between">
                            <span>{wp.name}</span>
                            <span>{wp.distance_remaining}nm</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* NOTAMs Tab */}
      {activeTab === 'notams' && (
        <div className="space-y-6">
          {/* NOTAM Service Status */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="text-orange-400" />
                FAA NOTAM Service Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notamData.health ? (
                <div className="flex items-center gap-4">
                  {notamData.health.status === 'ok' ? (
                    <CheckCircle className="text-green-500" />
                  ) : (
                    <XCircle className="text-red-500" />
                  )}
                  <div>
                    <div className={`font-medium ${getStatusColor(notamData.health.status)}`}>
                      {notamData.health.status.toUpperCase()}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {notamData.health.message}
                    </div>
                    <div className="text-xs text-gray-500">
                      Authenticated: {notamData.health.authenticated ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-400">Status checking...</div>
              )}
            </CardContent>
          </Card>

          {/* NOTAM Summary */}
          {notamData.summary && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Virgin Atlantic Route NOTAMs Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {notamData.summary.total_notams}
                    </div>
                    <div className="text-gray-400 text-sm">Total NOTAMs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {notamData.summary.active_notams}
                    </div>
                    <div className="text-gray-400 text-sm">Active</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">
                      {notamData.summary.critical_notams}
                    </div>
                    <div className="text-gray-400 text-sm">Critical</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">
                      {notamData.summary.expiring_soon}
                    </div>
                    <div className="text-gray-400 text-sm">Expiring Soon</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Critical NOTAMs */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertCircle className="text-red-400" />
                Critical NOTAMs
                <Badge variant="outline" className="text-red-400 border-red-400">
                  {notamData.criticalNotams.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notamData.loading ? (
                <div className="text-gray-400">Loading NOTAMs...</div>
              ) : notamData.error ? (
                <div className="text-red-400">{notamData.error}</div>
              ) : notamData.criticalNotams.length === 0 ? (
                <div className="text-gray-400">No critical NOTAMs found</div>
              ) : (
                <div className="space-y-3">
                  {notamData.criticalNotams.map((notam) => (
                    <div 
                      key={notam.notamNumber}
                      className="p-3 bg-gray-700 rounded-lg border-l-4 border-red-500"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getImpactColor(notam.impact)}>
                            {notam.impact}
                          </Badge>
                          <span className="text-sm text-gray-400">{notam.icaoLocation}</span>
                          <span className="text-xs text-gray-500">{notam.classification}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {notam.notamNumber}
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-300 mb-2">
                        {notam.text}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(notam.startDate).toLocaleDateString()} - {new Date(notam.endDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {notam.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* All Virgin Atlantic NOTAMs */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="text-yellow-400" />
                Virgin Atlantic Route NOTAMs
                <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                  {notamData.virginAtlanticNotams.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notamData.virginAtlanticNotams.length === 0 ? (
                <div className="text-gray-400">No NOTAMs found for Virgin Atlantic routes</div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {notamData.virginAtlanticNotams.map((notam) => (
                    <div 
                      key={notam.notamNumber}
                      className="p-2 bg-gray-700 rounded border-l-2 border-yellow-500"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Badge className={getImpactColor(notam.impact)} variant="outline">
                            {notam.impact}
                          </Badge>
                          <span className="text-gray-400">{notam.icaoLocation}</span>
                        </div>
                        <span className="text-gray-500">{notam.notamNumber}</span>
                      </div>
                      <div className="text-xs text-gray-300 mt-1 truncate">
                        {notam.text}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Aviation Intelligence Tab - New Comprehensive Analysis */}
      {activeTab === 'intelligence' && (
        <div className="space-y-6">
          {/* Aviation Intelligence Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="text-red-400" />
                  Aviation Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {aviationIntelligence.loading ? (
                  <div className="text-gray-400">Loading alerts...</div>
                ) : aviationIntelligence.error ? (
                  <div className="text-red-400">{aviationIntelligence.error}</div>
                ) : (
                  <div>
                    <div className="text-2xl font-bold text-red-400">
                      {aviationIntelligence.alerts.length}
                    </div>
                    <div className="text-gray-400 text-sm">Active Operational Alerts</div>
                    {aviationIntelligence.alerts.slice(0, 3).map((alert, index) => (
                      <div key={index} className="mt-2 p-2 bg-red-900/30 rounded border border-red-700">
                        <div className={`text-xs font-medium ${
                          alert.severity === 'CRITICAL' ? 'text-red-300' :
                          alert.severity === 'HIGH' ? 'text-orange-300' :
                          alert.severity === 'MEDIUM' ? 'text-yellow-300' : 'text-green-300'
                        }`}>
                          {alert.type} - {alert.severity}
                        </div>
                        <div className="text-gray-300 text-xs mt-1">{alert.title}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Navigation className="text-blue-400" />
                  Route Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {aviationIntelligence.loading ? (
                  <div className="text-gray-400">Analyzing routes...</div>
                ) : aviationIntelligence.error ? (
                  <div className="text-red-400">Route analysis unavailable</div>
                ) : (
                  <div>
                    <div className="text-2xl font-bold text-blue-400">
                      {aviationIntelligence.routes.length}
                    </div>
                    <div className="text-gray-400 text-sm">Virgin Atlantic Routes Analyzed</div>
                    {aviationIntelligence.routes.slice(0, 2).map((route, index) => (
                      <div key={index} className="mt-2 p-2 bg-blue-900/30 rounded border border-blue-700">
                        <div className="text-blue-300 text-xs font-medium">
                          {route.origin} → {route.destination}
                        </div>
                        <div className={`text-xs mt-1 ${
                          route.status === 'CLEAR' ? 'text-green-300' :
                          route.status === 'MINOR_DELAYS' ? 'text-yellow-300' :
                          route.status === 'MAJOR_DELAYS' ? 'text-orange-300' :
                          route.status === 'RESTRICTED' ? 'text-red-300' : 'text-gray-300'
                        }`}>
                          {route.status} - {route.delayMinutes}min delays
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CheckCircle className="text-green-400" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {aviationIntelligence.loading ? (
                  <div className="text-gray-400">Generating recommendations...</div>
                ) : aviationIntelligence.error ? (
                  <div className="text-red-400">Recommendations unavailable</div>
                ) : aviationIntelligence.recommendations ? (
                  <div>
                    <div className="text-2xl font-bold text-green-400">
                      {aviationIntelligence.recommendations.immediate_actions?.length || 0}
                    </div>
                    <div className="text-gray-400 text-sm">Immediate Actions Required</div>
                    {aviationIntelligence.recommendations.immediate_actions?.slice(0, 2).map((action, index) => (
                      <div key={index} className="mt-2 p-2 bg-green-900/30 rounded border border-green-700">
                        <div className="text-green-300 text-xs font-medium">
                          {action.category}
                        </div>
                        <div className="text-gray-300 text-xs mt-1">{action.description}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400">No recommendations available</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detailed Intelligence Analysis */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="text-purple-400" />
                Comprehensive Aviation Intelligence Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-gray-300">
                  <p>This comprehensive analysis integrates FlightAware ADS-B tracking data with FAA NOTAM airspace information to provide real-time operational intelligence for Virgin Atlantic operations.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-purple-900/30 rounded-lg border border-purple-700">
                    <h4 className="text-purple-300 font-medium mb-2">Data Sources Integration</h4>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li>• FlightAware ADS-B real-time tracking</li>
                      <li>• FAA NOTAM official airspace restrictions</li>
                      <li>• AINO platform ML-powered analysis</li>
                      <li>• Virgin Atlantic route optimization</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-purple-900/30 rounded-lg border border-purple-700">
                    <h4 className="text-purple-300 font-medium mb-2">Intelligence Categories</h4>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li>• Delay prediction and impact analysis</li>
                      <li>• Airspace restriction monitoring</li>
                      <li>• Route optimization recommendations</li>
                      <li>• Operational alert generation</li>
                    </ul>
                  </div>
                </div>

                {(aviationIntelligence.loading || aviationIntelligence.error) && (
                  <div className="mt-4 p-4 bg-yellow-900/30 rounded-lg border border-yellow-700">
                    <div className="flex items-center gap-2 text-yellow-400">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">Service Requirements</span>
                    </div>
                    <p className="text-sm text-yellow-300 mt-1">
                      FlightAware API key and FAA NOTAM API key required for full aviation intelligence capabilities.
                      Contact operations to configure authentic data sources.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Integration Tab */}
      {activeTab === 'integration' && (
        <div className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="text-purple-400" />
                Integrated Flight & Airspace Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Flight vs NOTAM Correlation */}
                <div>
                  <h4 className="text-lg font-medium text-gray-200 mb-3">Flight-NOTAM Correlation</h4>
                  <div className="space-y-2">
                    {flightAwareData.flights.map((flight) => {
                      const relevantNotams = notamData.virginAtlanticNotams.filter(
                        notam => 
                          notam.icaoLocation === flight.origin || 
                          notam.icaoLocation === flight.destination ||
                          notam.icaoLocation.includes(flight.origin.substring(0, 2)) ||
                          notam.icaoLocation.includes(flight.destination.substring(0, 2))
                      );
                      
                      return (
                        <div key={flight.ident} className="p-3 bg-gray-700 rounded">
                          <div className="flex items-center justify-between">
                            <div className="text-white font-medium">{flight.ident}</div>
                            <Badge 
                              variant={relevantNotams.length > 0 ? "destructive" : "default"}
                              className={relevantNotams.length > 0 ? "bg-red-600" : "bg-green-600"}
                            >
                              {relevantNotams.length} NOTAMs
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-400">
                            {flight.origin} → {flight.destination}
                          </div>
                          {relevantNotams.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {relevantNotams.slice(0, 2).map((notam) => (
                                <div key={notam.notamNumber} className="text-xs text-yellow-400">
                                  {notam.icaoLocation}: {notam.classification}
                                </div>
                              ))}
                              {relevantNotams.length > 2 && (
                                <div className="text-xs text-gray-500">
                                  +{relevantNotams.length - 2} more NOTAMs
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Operational Impact Summary */}
                <div>
                  <h4 className="text-lg font-medium text-gray-200 mb-3">Operational Impact</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-700 rounded">
                      <div className="text-sm text-gray-300 font-medium">Flight Safety Assessment</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {notamData.criticalNotams.length === 0 
                          ? "✅ No critical safety issues affecting Virgin Atlantic routes"
                          : `⚠️ ${notamData.criticalNotams.length} critical NOTAMs require attention`
                        }
                      </div>
                    </div>
                    
                    <div className="p-3 bg-gray-700 rounded">
                      <div className="text-sm text-gray-300 font-medium">Route Efficiency</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Average ground speed: {flightAwareData.analytics?.average_groundspeed || 'N/A'}kts
                      </div>
                    </div>
                    
                    <div className="p-3 bg-gray-700 rounded">
                      <div className="text-sm text-gray-300 font-medium">Airspace Status</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {notamData.summary?.airports_affected || 0} airports with active NOTAMs
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FlightAwareNotamDashboard;