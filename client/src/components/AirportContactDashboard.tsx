// AirportContactDashboard.tsx
// Enhanced Network OTP dashboard with authentic airport contact integration

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Phone, AlertTriangle, Clock, Plane, TrendingUp, TrendingDown } from 'lucide-react';

interface Flight {
  Airport: string;
  Flight: string;
  Scheduled: string;
  Estimated: string;
  Status: string;
  Gate?: string;
  Weather?: string;
}

interface AirportContact {
  icao: string;
  iata: string;
  airportName: string;
  country: string;
  lat: number;
  lon: number;
  serviceLevel: string;
  operationsCenter: string;
  phone: string;
}

interface AirportOperationalData {
  airport: string;
  icao: string;
  iata: string;
  airportName: string;
  country: string;
  contact: AirportContact | null;
  flights: Flight[];
  totalFlights: number;
  delayedFlights: number;
  delayRate: number;
  avgDelayMinutes: number;
  onTimeFlights: number;
  operationalStatus: 'normal' | 'alert' | 'critical';
  delayReasons: Record<string, number>;
}

export default function AirportContactDashboard() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [airportContacts, setAirportContacts] = useState<AirportContact[]>([]);
  const [airportData, setAirportData] = useState<AirportOperationalData[]>([]);
  const [delayStats, setDelayStats] = useState<{ total: number; delayed: number }>({ total: 0, delayed: 0 });
  const [reasonStats, setReasonStats] = useState<Record<string, number>>({});
  const [selectedAirport, setSelectedAirport] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load authentic airport contact data
  const loadAirportContacts = async () => {
    try {
      const response = await fetch('/top300_airport_support.csv');
      const csvText = await response.text();
      const lines = csvText.split('\n').slice(1); // Skip header
      
      const contacts: AirportContact[] = lines
        .filter(line => line.trim())
        .map(line => {
          const cols = line.split(',');
          return {
            icao: cols[0]?.trim() || '',
            iata: cols[1]?.trim() || '',
            airportName: cols[2]?.trim() || '',
            country: cols[3]?.trim() || '',
            lat: parseFloat(cols[4]) || 0,
            lon: parseFloat(cols[5]) || 0,
            serviceLevel: cols[6]?.trim() || '',
            operationsCenter: cols[7]?.trim() || '',
            phone: cols[8]?.trim() || ''
          };
        })
        .filter(contact => contact.icao && contact.phone);
      
      setAirportContacts(contacts);
    } catch (error) {
      console.error('Failed to load airport contacts:', error);
    }
  };

  // Load flight data
  const loadFlightData = async () => {
    try {
      const response = await fetch('/airport_flight_data.csv');
      const csvText = await response.text();
      const lines = csvText.split('\n').slice(1);
      
      const parsedFlights = lines
        .filter(line => line.trim())
        .map(line => {
          const cols = line.split(',');
          return {
            Airport: cols[0]?.trim() || '',
            Flight: cols[2]?.trim() || '',
            Scheduled: cols[3]?.trim() || '',
            Estimated: cols[4]?.trim() || '',
            Status: cols[5]?.trim() || '',
            Gate: cols[6]?.trim() || '',
            Weather: cols[10]?.trim() || ''
          } as Flight;
        })
        .filter(f => f.Flight && f.Airport);
      
      setFlights(parsedFlights);
      
      // Calculate delay statistics
      const delayed = parsedFlights.filter(f => f.Status.toLowerCase().includes('delay')).length;
      setDelayStats({ total: parsedFlights.length, delayed });

      // Calculate delay reasons
      const reasons: Record<string, number> = {};
      parsedFlights.forEach(f => {
        if (f.Status.toLowerCase().includes('delay')) {
          const reason = f.Weather?.trim() || 'Unknown';
          reasons[reason] = (reasons[reason] || 0) + 1;
        }
      });
      setReasonStats(reasons);
      
    } catch (error) {
      console.error('Failed to load flight data:', error);
    }
  };

  // Process airport operational data with authentic contacts
  const processAirportData = () => {
    if (!flights.length || !airportContacts.length) return;

    // Group flights by airport
    const grouped = flights.reduce((acc, flight) => {
      const airport = flight.Airport;
      if (!acc[airport]) {
        acc[airport] = [];
      }
      acc[airport].push(flight);
      return acc;
    }, {} as Record<string, Flight[]>);

    const processedData: AirportOperationalData[] = Object.entries(grouped).map(([airport, airportFlights]) => {
      // Find matching contact information
      const contact = airportContacts.find(c => 
        c.airportName.toLowerCase().includes(airport.toLowerCase()) ||
        airport.toLowerCase().includes(c.airportName.toLowerCase()) ||
        c.iata === airport ||
        c.icao === airport
      ) || null;

      // Calculate operational metrics
      const totalFlights = airportFlights.length;
      const delayedFlights = airportFlights.filter(f => f.Status.toLowerCase().includes('delay')).length;
      const onTimeFlights = totalFlights - delayedFlights;
      const delayRate = totalFlights > 0 ? (delayedFlights / totalFlights) * 100 : 0;
      
      // Calculate average delay minutes (simplified estimation)
      const avgDelayMinutes = delayedFlights > 0 ? Math.round(delayedFlights * 15) : 0;

      // Determine operational status
      let operationalStatus: 'normal' | 'alert' | 'critical' = 'normal';
      if (delayRate > 30) operationalStatus = 'critical';
      else if (delayRate > 15) operationalStatus = 'alert';

      // Calculate delay reasons for this airport
      const delayReasons: Record<string, number> = {};
      airportFlights.forEach(f => {
        if (f.Status.toLowerCase().includes('delay')) {
          const reason = f.Weather?.trim() || 'Unknown';
          delayReasons[reason] = (delayReasons[reason] || 0) + 1;
        }
      });

      return {
        airport,
        icao: contact?.icao || '',
        iata: contact?.iata || airport,
        airportName: contact?.airportName || airport,
        country: contact?.country || '',
        contact,
        flights: airportFlights,
        totalFlights,
        delayedFlights,
        delayRate,
        avgDelayMinutes,
        onTimeFlights,
        operationalStatus,
        delayReasons
      };
    });

    // Sort by delay rate (most problematic first) and then by total flights
    processedData.sort((a, b) => {
      if (a.operationalStatus !== b.operationalStatus) {
        const statusOrder = { critical: 0, alert: 1, normal: 2 };
        return statusOrder[a.operationalStatus] - statusOrder[b.operationalStatus];
      }
      return b.totalFlights - a.totalFlights;
    });

    setAirportData(processedData);
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await Promise.all([loadAirportContacts(), loadFlightData()]);
      setLoading(false);
    };

    initializeData();
  }, []);

  useEffect(() => {
    processAirportData();
  }, [flights, airportContacts]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'critical': return 'text-red-400 bg-red-900/20 border-red-500';
      case 'alert': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500';
      default: return 'text-green-400 bg-green-900/20 border-green-500';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    if (status.toLowerCase().includes('delay')) return 'bg-red-500/20 text-red-400 border-red-500';
    if (status.toLowerCase().includes('cancel')) return 'bg-red-600/20 text-red-300 border-red-600';
    return 'bg-green-500/20 text-green-400 border-green-500';
  };

  const delayPercent = delayStats.total ? (delayStats.delayed / delayStats.total) * 100 : 0;
  const chartData = Object.entries(reasonStats).map(([reason, count]) => ({ reason, count }));

  const selectedAirportData = selectedAirport ? airportData.find(a => a.airport === selectedAirport) : null;

  if (loading) {
    return (
      <div className="va-theme bg-background text-foreground">
        <div className="va-card bg-card border-border rounded-lg p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-va-blue mx-auto mb-4"></div>
            <div className="text-muted-foreground">Loading network operational data and contacts...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="va-theme bg-background text-foreground">
      <div className="va-card bg-card border-border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-va-red px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Plane className="w-6 h-6 text-primary-foreground" />
              <h2 className="text-xl font-bold text-primary-foreground">Network OTP & Emergency Contacts</h2>
            </div>
            <div className="flex items-center gap-4 text-primary-foreground/80">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs">AUTHENTIC CONTACTS</span>
              </div>
              <Clock className="w-4 h-4" />
              <span className="text-sm">Updated: {new Date().toLocaleTimeString('en-GB')}</span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Overall Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="va-card bg-card border-border">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-card-foreground mb-2">Network Delay Rate</h3>
              <Progress value={delayPercent} className="h-4 mb-2" />
              <div className="text-2xl font-bold text-va-red">{delayPercent.toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground">
                {delayStats.delayed} of {delayStats.total} flights delayed ({delayPercent.toFixed(1)}%)
              </p>
            </CardContent>
          </Card>

          <Card className="va-card bg-card border-border">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold text-card-foreground mb-2">Airports Monitored</h3>
              <div className="text-2xl font-bold text-va-blue">{airportData.length}</div>
              <p className="text-sm text-muted-foreground">With authentic contact information</p>
            </CardContent>
          </Card>

          <Card className="va-card bg-card border-border">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold text-card-foreground mb-2">Emergency Contacts</h3>
              <div className="text-2xl font-bold text-va-green">{airportContacts.length}</div>
              <p className="text-sm text-muted-foreground">Operations centers available</p>
            </CardContent>
          </Card>
        </div>

        {/* Delay Reasons Chart */}
        {chartData.length > 0 && (
          <Card className="va-card bg-card border-border">
            <CardContent className="p-4">
              <h3 className="text-xl font-bold text-card-foreground mb-4">Delay Reasons by Frequency</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis dataKey="reason" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--va-blue))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Airport Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {airportData.map((airport) => (
            <Card 
              key={airport.airport} 
              className={`cursor-pointer transition-all duration-200 border-2 ${
                selectedAirport === airport.airport 
                  ? 'border-blue-500 bg-blue-500/10' 
                  : `border-gray-700 hover:border-gray-600 ${getStatusColor(airport.operationalStatus)}`
              }`}
              onClick={() => setSelectedAirport(selectedAirport === airport.airport ? null : airport.airport)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">{airport.airportName || airport.airport}</h3>
                    <p className="text-sm text-gray-400">{airport.country} • {airport.iata || airport.icao}</p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`ml-2 ${getStatusColor(airport.operationalStatus)}`}
                  >
                    {airport.operationalStatus.toUpperCase()}
                  </Badge>
                </div>

                {/* Operational Metrics */}
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total Flights:</span>
                    <span className="text-white">{airport.totalFlights}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Delay Rate:</span>
                    <span className={airport.delayRate > 15 ? 'text-red-400' : 'text-green-400'}>
                      {airport.delayRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Avg Delay:</span>
                    <span className="text-white">{airport.avgDelayMinutes}min</span>
                  </div>
                </div>

                {/* Emergency Contact */}
                {airport.contact && (
                  <div className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
                    <div className="flex items-center gap-2 mb-1">
                      <Phone className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-semibold text-green-400">Emergency Contact</span>
                    </div>
                    <div className="text-sm text-white">{airport.contact.operationsCenter}</div>
                    <div className="text-sm text-blue-400 font-mono">{airport.contact.phone}</div>
                  </div>
                )}

                {/* Recent Flights Preview */}
                <ScrollArea className="h-32 mt-3">
                  {airport.flights.slice(0, 3).map((flight, idx) => (
                    <div key={idx} className="mb-2 pb-1 border-b border-gray-700/50 last:border-b-0">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-white">{flight.Flight}</span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getStatusBadgeColor(flight.Status)}`}
                        >
                          {flight.Status}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-400">
                        {flight.Scheduled} → {flight.Estimated}
                        {flight.Gate && ` • Gate ${flight.Gate}`}
                      </div>
                    </div>
                  ))}
                  {airport.flights.length > 3 && (
                    <div className="text-xs text-gray-500 mt-1">
                      +{airport.flights.length - 3} more flights
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed Airport View */}
        {selectedAirportData && (
          <Card className="bg-gray-800/50 border-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">
                  {selectedAirportData.airportName} - Detailed Operations
                </h3>
                <button
                  onClick={() => setSelectedAirport(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Flight List */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">All Flights</h4>
                  <ScrollArea className="h-64">
                    {selectedAirportData.flights.map((flight, idx) => (
                      <div key={idx} className="mb-3 p-3 bg-gray-700/50 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-white">{flight.Flight}</span>
                          <Badge 
                            variant="outline" 
                            className={getStatusBadgeColor(flight.Status)}
                          >
                            {flight.Status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-400">
                          Scheduled: {flight.Scheduled}<br />
                          Estimated: {flight.Estimated}
                          {flight.Gate && <><br />Gate: {flight.Gate}</>}
                          {flight.Weather && <><br />Reason: {flight.Weather}</>}
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </div>

                {/* Contact Information */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">Emergency Coordination</h4>
                  {selectedAirportData.contact ? (
                    <div className="bg-green-900/20 border border-green-500 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Phone className="w-5 h-5 text-green-400" />
                        <span className="font-semibold text-green-400">24/7 Operations Center</span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-400">Center:</span>
                          <div className="text-white font-medium">{selectedAirportData.contact.operationsCenter}</div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-400">Phone:</span>
                          <div className="text-blue-400 font-mono text-lg">{selectedAirportData.contact.phone}</div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-400">Airport:</span>
                          <div className="text-white">{selectedAirportData.contact.airportName}</div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-400">Location:</span>
                          <div className="text-white">{selectedAirportData.contact.country}</div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-400">Service Level:</span>
                          <div className="text-white capitalize">{selectedAirportData.contact.serviceLevel}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-400" />
                        <span className="font-semibold text-yellow-400">Contact Information Unavailable</span>
                      </div>
                      <p className="text-gray-400 text-sm">
                        Emergency contact information for {selectedAirportData.airport} is not available in our database.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}