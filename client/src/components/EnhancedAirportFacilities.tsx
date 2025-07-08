import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Plane, 
  Fuel, 
  Wrench, 
  Users, 
  Phone, 
  Mail, 
  Clock, 
  RefreshCw, 
  Database,
  CheckCircle,
  AlertCircle,
  MapPin
} from 'lucide-react';

interface FacilityData {
  icao: string;
  airport_name: string;
  is_virgin_atlantic_hub: boolean;
  services: {
    ground_handlers: string[];
    maintenance_providers: string[];
    fuel_suppliers: string[];
  };
  contact_info: {
    emails?: string[];
    phones?: string[];
  };
  data_source: string;
  last_updated: string;
}

interface FacilityStatistics {
  total_airports: number;
  virgin_atlantic_coverage: number;
  service_coverage: {
    ground_handling: number;
    maintenance: number;
    fuel_supply: number;
    contact_available: number;
  };
  data_freshness: {
    last_updated: string;
    hours_old: number;
  };
}

const EnhancedAirportFacilities: React.FC = () => {
  const [facilities, setFacilities] = useState<FacilityData[]>([]);
  const [statistics, setStatistics] = useState<FacilityStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedHub, setSelectedHub] = useState<string>('all');

  useEffect(() => {
    loadFacilityData();
    loadStatistics();
  }, []);

  const loadFacilityData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/aviation/enhanced-facilities');
      
      if (response.ok) {
        const data = await response.json();
        setFacilities(data.airports || []);
      } else {
        console.log('No facility data available yet');
        setFacilities([]);
      }
    } catch (error) {
      console.error('Error loading facility data:', error);
      setFacilities([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await fetch('/api/aviation/enhanced-facilities/statistics');
      if (response.ok) {
        const stats = await response.json();
        setStatistics(stats);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const refreshFacilityData = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/aviation/refresh-facilities', {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Facility refresh result:', result);
        
        // Reload data after refresh
        await loadFacilityData();
        await loadStatistics();
      } else {
        console.error('Failed to refresh facility data');
      }
    } catch (error) {
      console.error('Error refreshing facility data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredFacilities = facilities.filter(facility => {
    if (selectedHub === 'all') return true;
    if (selectedHub === 'virgin_atlantic') return facility.is_virgin_atlantic_hub;
    return facility.icao === selectedHub;
  });

  const virginAtlanticHubs = facilities.filter(f => f.is_virgin_atlantic_hub);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Enhanced Airport Facilities</h1>
          <p className="text-gray-400">Comprehensive facility data from authentic aviation sources</p>
        </div>
        <Button 
          onClick={refreshFacilityData}
          disabled={refreshing}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>

      {/* Statistics Dashboard */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-sm text-gray-400">Total Airports</p>
                  <p className="text-2xl font-bold text-white">{statistics.total_airports}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Plane className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-sm text-gray-400">Virgin Atlantic Hubs</p>
                  <p className="text-2xl font-bold text-white">{statistics.virgin_atlantic_coverage}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-sm text-gray-400">Ground Handling</p>
                  <p className="text-2xl font-bold text-white">{statistics.service_coverage.ground_handling}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className="text-sm text-gray-400">Data Age</p>
                  <p className="text-2xl font-bold text-white">
                    {statistics.data_freshness.hours_old >= 0 
                      ? `${statistics.data_freshness.hours_old}h` 
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter Controls */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedHub === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedHub('all')}
              size="sm"
            >
              All Airports ({facilities.length})
            </Button>
            <Button
              variant={selectedHub === 'virgin_atlantic' ? 'default' : 'outline'}
              onClick={() => setSelectedHub('virgin_atlantic')}
              size="sm"
            >
              Virgin Atlantic Hubs ({virginAtlanticHubs.length})
            </Button>
            {virginAtlanticHubs.slice(0, 5).map(hub => (
              <Button
                key={hub.icao}
                variant={selectedHub === hub.icao ? 'default' : 'outline'}
                onClick={() => setSelectedHub(hub.icao)}
                size="sm"
              >
                {hub.icao}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Facility Data */}
      {loading ? (
        <div className="text-center py-8">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
          <p className="text-gray-400">Loading facility data...</p>
        </div>
      ) : facilities.length === 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
            <h3 className="text-xl font-bold text-white mb-2">No Facility Data Available</h3>
            <p className="text-gray-400 mb-4">
              Enhanced facility data has not been collected yet. Click "Refresh Data" to start the scraping process.
            </p>
            <Button onClick={refreshFacilityData} className="bg-blue-600 hover:bg-blue-700">
              <Database className="w-4 h-4 mr-2" />
              Start Data Collection
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredFacilities.map(facility => (
            <Card key={facility.icao} className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center space-x-2">
                      <MapPin className="w-5 h-5" />
                      <span>{facility.icao}</span>
                      {facility.is_virgin_atlantic_hub && (
                        <Badge variant="destructive">VS Hub</Badge>
                      )}
                    </CardTitle>
                    <p className="text-gray-400 text-sm">{facility.airport_name}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Services */}
                <div className="space-y-3">
                  {facility.services.ground_handlers.length > 0 && (
                    <div className="flex items-start space-x-2">
                      <Users className="w-4 h-4 text-green-400 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-white">Ground Handling</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {facility.services.ground_handlers.map((handler, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {handler}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {facility.services.maintenance_providers.length > 0 && (
                    <div className="flex items-start space-x-2">
                      <Wrench className="w-4 h-4 text-blue-400 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-white">Maintenance</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {facility.services.maintenance_providers.map((provider, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {provider}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {facility.services.fuel_suppliers.length > 0 && (
                    <div className="flex items-start space-x-2">
                      <Fuel className="w-4 h-4 text-yellow-400 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-white">Fuel Supply</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {facility.services.fuel_suppliers.map((supplier, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {supplier}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Contact Information */}
                {(facility.contact_info.emails?.length || facility.contact_info.phones?.length) && (
                  <div className="border-t border-gray-700 pt-3">
                    <p className="text-sm font-medium text-white mb-2">Contact Information</p>
                    <div className="space-y-1">
                      {facility.contact_info.emails?.map((email, idx) => (
                        <div key={idx} className="flex items-center space-x-2 text-xs text-gray-400">
                          <Mail className="w-3 h-3" />
                          <span>{email}</span>
                        </div>
                      ))}
                      {facility.contact_info.phones?.map((phone, idx) => (
                        <div key={idx} className="flex items-center space-x-2 text-xs text-gray-400">
                          <Phone className="w-3 h-3" />
                          <span>{phone}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Data Source */}
                <div className="border-t border-gray-700 pt-3">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Source: {new URL(facility.data_source).hostname}</span>
                    <span>{new Date(facility.last_updated).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EnhancedAirportFacilities;