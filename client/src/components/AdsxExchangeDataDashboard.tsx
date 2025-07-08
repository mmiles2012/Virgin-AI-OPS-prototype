import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, RefreshCw, Plane, Signal } from 'lucide-react';

interface FlightData {
  flight_number: string;
  airline: string;
  aircraft_type: string;
  route: string;
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  heading: number;
  status: string;
  registration?: string;
  icao24?: string;
  data_quality?: any;
  authentic_tracking: boolean;
  data_source: string;
  last_seen?: number;
  emergency?: string;
  signal_strength?: string;
}

interface ADSBExchangeResponse {
  success: boolean;
  source: string;
  timestamp: string;
  total_flights: number;
  authentic_flight_count: number;
  authentic_data_percentage: number;
  flights: FlightData[];
  data_note?: string;
  next_check_suggestion?: string;
  platform_upgrade?: string;
  data_enhancement?: string;
}

const AdsxExchangeDataDashboard: React.FC = () => {
  const [adsbData, setAdsbData] = useState<ADSBExchangeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchADSBData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call the new ADS-B Exchange Virgin Atlantic endpoint
      const response = await fetch('/api/flights/virgin-atlantic-adsb');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: ADSBExchangeResponse = await response.json();
      setAdsbData(data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ADS-B Exchange data');
      console.error('ADS-B Exchange fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchADSBData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchADSBData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getDataSourceBadge = (source: string, authentic: boolean) => {
    if (authentic) {
      return (
        <Badge variant="default" className="bg-green-600 text-white">
          <CheckCircle className="w-3 h-3 mr-1" />
          {source}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-gray-600 text-white">
        <AlertCircle className="w-3 h-3 mr-1" />
        {source}
      </Badge>
    );
  };

  const getSignalQualityBadge = (quality: string) => {
    const color = quality === 'High' ? 'bg-green-600' : 
                 quality === 'Medium' ? 'bg-yellow-600' : 
                 'bg-gray-600';
    return (
      <Badge className={`${color} text-white`}>
        <Signal className="w-3 h-3 mr-1" />
        {quality}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin mr-3" />
            <span className="text-xl">Loading ADS-B Exchange data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-red-900 border-red-700">
            <CardHeader>
              <CardTitle className="flex items-center text-red-200">
                <AlertCircle className="w-5 h-5 mr-2" />
                ADS-B Exchange Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-200 mb-4">{error}</p>
              <Button 
                onClick={fetchADSBData}
                variant="outline"
                className="border-red-500 text-red-200 hover:bg-red-800"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                ADS-B Exchange Integration
              </h1>
              <p className="text-gray-400">
                Real-time Virgin Atlantic flight tracking with authentic aircraft data
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-green-400 border-green-400">
                Live Data
              </Badge>
              <Button
                onClick={fetchADSBData}
                variant="outline"
                size="sm"
                className="border-blue-500 text-blue-400 hover:bg-blue-900"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Data Summary */}
        {adsbData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Total Flights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {adsbData.total_flights}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Last updated: {lastUpdated}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Authentic Flights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">
                  {adsbData.authentic_flight_count}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Real ADS-B tracking
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Data Quality
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-400">
                  {adsbData.authentic_data_percentage}%
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Authentic data rate
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Data Source
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium text-white">
                  {adsbData.source}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {adsbData.timestamp ? new Date(adsbData.timestamp).toLocaleString() : 'N/A'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Flight Data */}
        {adsbData && adsbData.flights.length > 0 && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Plane className="w-5 h-5 mr-2" />
                Virgin Atlantic Fleet Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {adsbData.flights.map((flight, index) => (
                  <div
                    key={index}
                    className="bg-gray-700 rounded-lg p-4 border border-gray-600"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="text-blue-400 border-blue-400">
                          {flight.flight_number}
                        </Badge>
                        <span className="text-white font-medium">{flight.route}</span>
                        <span className="text-gray-400">{flight.aircraft_type}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getDataSourceBadge(flight.data_source, flight.authentic_tracking)}
                        {flight.signal_strength && getSignalQualityBadge(flight.signal_strength)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Position:</span>
                        <div className="text-white">
                          {flight.latitude.toFixed(4)}, {flight.longitude.toFixed(4)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400">Altitude:</span>
                        <div className="text-white">{flight.altitude.toLocaleString()} ft</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Speed:</span>
                        <div className="text-white">{flight.velocity} kts</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Heading:</span>
                        <div className="text-white">{flight.heading}°</div>
                      </div>
                    </div>
                    
                    {flight.registration && (
                      <div className="mt-3 text-sm">
                        <span className="text-gray-400">Registration:</span>
                        <span className="text-white ml-2">{flight.registration}</span>
                        {flight.icao24 && (
                          <>
                            <span className="text-gray-400 ml-4">ICAO24:</span>
                            <span className="text-white ml-2">{flight.icao24}</span>
                          </>
                        )}
                      </div>
                    )}
                    
                    <div className="mt-3">
                      <Badge
                        variant={flight.status.includes('En Route') ? 'default' : 'secondary'}
                        className={flight.status.includes('En Route') ? 'bg-green-600' : 'bg-gray-600'}
                      >
                        {flight.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Data Message */}
        {adsbData && adsbData.flights.length === 0 && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">No Active Virgin Atlantic Flights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">
                {adsbData.data_note}
              </p>
              {adsbData.next_check_suggestion && (
                <p className="text-blue-400 text-sm">
                  💡 {adsbData.next_check_suggestion}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Enhancement Information */}
        {adsbData && adsbData.data_enhancement && (
          <Card className="bg-blue-900 border-blue-700 mt-6">
            <CardHeader>
              <CardTitle className="text-blue-200">Platform Enhancement</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-200">{adsbData.data_enhancement}</p>
              {adsbData.platform_upgrade && (
                <p className="text-blue-300 mt-2 text-sm">
                  {adsbData.platform_upgrade}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdsxExchangeDataDashboard;