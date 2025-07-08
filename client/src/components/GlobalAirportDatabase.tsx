import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Search, MapPin, Plane, Globe, BarChart3 } from 'lucide-react';

interface Airport {
  id: string;
  ident: string;
  type: string;
  name: string;
  latitude_deg: number;
  longitude_deg: number;
  elevation_ft: number;
  continent: string;
  iso_country: string;
  iso_region: string;
  municipality: string;
  scheduled_service: string;
  icao_code: string;
  iata_code: string;
}

interface DatabaseStats {
  total: number;
  byType: Record<string, number>;
  byContinent: Record<string, number>;
  withScheduledService: number;
  withICAO: number;
  withIATA: number;
}

export default function GlobalAirportDatabase() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'icao' | 'iata' | 'search'>('icao');
  const [airports, setAirports] = useState<Airport[]>([]);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('');

  useEffect(() => {
    loadDatabaseStats();
  }, []);

  const loadDatabaseStats = async () => {
    try {
      const response = await fetch('/api/airports/global/statistics');
      const data = await response.json();
      if (data.success) {
        setStats(data.statistics);
      }
    } catch (error) {
      console.error('Failed to load database statistics:', error);
    }
  };

  const searchAirports = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      let url = '';
      
      if (searchType === 'icao') {
        url = `/api/airports/global/icao/${searchTerm.toUpperCase()}`;
      } else if (searchType === 'iata') {
        url = `/api/airports/global/iata/${searchTerm.toUpperCase()}`;
      } else {
        url = `/api/airports/global/search?country=${searchTerm.toUpperCase()}&limit=20`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        if (data.airport) {
          setAirports([data.airport]);
        } else if (data.airports) {
          setAirports(data.airports);
        }
      } else {
        setAirports([]);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setAirports([]);
    } finally {
      setLoading(false);
    }
  };

  const searchMajorAirports = async (country?: string) => {
    setLoading(true);
    try {
      const url = country 
        ? `/api/airports/global/major?country=${country}`
        : '/api/airports/global/major?limit=50';
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setAirports(data.airports);
      }
    } catch (error) {
      console.error('Failed to load major airports:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchNearLocation = async () => {
    // Example: Search near London Heathrow
    setLoading(true);
    try {
      const response = await fetch('/api/airports/global/near/51.4700/-0.4543?radius=100');
      const data = await response.json();
      
      if (data.success) {
        setAirports(data.airports);
      }
    } catch (error) {
      console.error('Failed to search near location:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'large_airport': return 'bg-red-100 text-red-800';
      case 'medium_airport': return 'bg-blue-100 text-blue-800';
      case 'small_airport': return 'bg-green-100 text-green-800';
      case 'heliport': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Globe className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Global Airport Database</h1>
          <p className="text-gray-600">Comprehensive worldwide airport information system</p>
        </div>
      </div>

      {/* Database Statistics */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Database Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.total.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Airports</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{stats.withICAO.toLocaleString()}</div>
                <div className="text-sm text-gray-600">ICAO Codes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{stats.withIATA.toLocaleString()}</div>
                <div className="text-sm text-gray-600">IATA Codes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{stats.withScheduledService.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Scheduled Service</div>
              </div>
            </div>
            
            {/* Airport Types */}
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Airport Types:</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.byType).map(([type, count]) => (
                  <Badge key={type} variant="outline" className={getTypeColor(type)}>
                    {type.replace('_', ' ')}: {count.toLocaleString()}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Airport Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <select 
                value={searchType} 
                onChange={(e) => setSearchType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="icao">ICAO Code</option>
                <option value="iata">IATA Code</option>
                <option value="search">Country Code</option>
              </select>
              <Input
                placeholder={searchType === 'icao' ? 'e.g., EGLL' : searchType === 'iata' ? 'e.g., LHR' : 'e.g., US'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button onClick={searchAirports} disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                onClick={() => searchMajorAirports()}
                disabled={loading}
              >
                <Plane className="w-4 h-4 mr-2" />
                Major Airports
              </Button>
              <Button 
                variant="outline" 
                onClick={() => searchMajorAirports('US')}
                disabled={loading}
              >
                US Airports
              </Button>
              <Button 
                variant="outline" 
                onClick={() => searchMajorAirports('GB')}
                disabled={loading}
              >
                UK Airports
              </Button>
              <Button 
                variant="outline" 
                onClick={searchNearLocation}
                disabled={loading}
              >
                <MapPin className="w-4 h-4 mr-2" />
                Near London
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {airports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results ({airports.length} airports)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {airports.map((airport) => (
                <div key={airport.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{airport.name}</h3>
                        <Badge className={getTypeColor(airport.type)}>
                          {airport.type.replace('_', ' ')}
                        </Badge>
                        {airport.scheduled_service === 'yes' && (
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            Scheduled Service
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">ICAO:</span> {airport.icao_code || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">IATA:</span> {airport.iata_code || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Location:</span> {airport.municipality}, {airport.iso_country}
                        </div>
                        <div>
                          <span className="font-medium">Elevation:</span> {airport.elevation_ft}ft
                        </div>
                      </div>
                      
                      <div className="mt-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        {airport.latitude_deg.toFixed(4)}, {airport.longitude_deg.toFixed(4)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            Searching global airport database...
          </div>
        </div>
      )}
    </div>
  );
}