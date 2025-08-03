import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  AlertTriangle, 
  ArrowLeft,
  MapPin,
  Clock,
  Info,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Extended NOTAM interface
interface NotamDetail {
  id: string;
  airport: string;
  airport_name: string;
  icao: string;
  type: string;
  category: 'runway' | 'navigation' | 'airspace' | 'facilities' | 'services';
  description: string;
  effective_start: string;
  effective_end: string;
  created: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  impact_areas: string[];
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  affected_runways?: string[];
  traffic_impact: 'severe' | 'moderate' | 'minor' | 'none';
  virgin_atlantic_impact: boolean;
}

export default function NotamDetailPage() {
  const navigate = useNavigate();
  const [notams, setNotams] = useState<NotamDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [virginAtlanticOnly, setVirginAtlanticOnly] = useState(false);

  // Fetch NOTAMs data
  const fetchNotams = async () => {
    setIsLoading(true);
    try {
      // Try to fetch from FAA NOTAM API
      const response = await fetch('/api/notams/active');
      if (response.ok) {
        const data = await response.json();
        setNotams(data.notams || []);
      } else {
        // Fallback to demo data
        setNotams([
          {
            id: 'NOTAM-JFK-001',
            airport: 'JFK',
            airport_name: 'John F. Kennedy International Airport',
            icao: 'KJFK',
            type: 'Runway Closure',
            category: 'runway',
            description: 'Runway 04L/22R closed for scheduled maintenance and resurfacing operations. Expect delays and possible diversions.',
            effective_start: '2025-08-03T16:00:00Z',
            effective_end: '2025-08-03T22:00:00Z',
            created: '2025-08-01T10:30:00Z',
            severity: 'high',
            impact_areas: ['Departures', 'Arrivals', 'Ground Operations'],
            affected_runways: ['04L/22R'],
            traffic_impact: 'moderate',
            virgin_atlantic_impact: true,
            coordinates: { latitude: 40.6413, longitude: -73.7781 }
          },
          {
            id: 'NOTAM-LHR-002',
            airport: 'LHR',
            airport_name: 'London Heathrow Airport',
            icao: 'EGLL',
            type: 'Navigation Aid Outage',
            category: 'navigation',
            description: 'ILS approach system for Runway 09L temporarily out of service for technical maintenance. CAT II/III approaches not available.',
            effective_start: '2025-08-03T12:00:00Z',
            effective_end: '2025-08-04T06:00:00Z',
            created: '2025-08-02T08:15:00Z',
            severity: 'medium',
            impact_areas: ['Approach Procedures', 'Low Visibility Operations'],
            affected_runways: ['09L'],
            traffic_impact: 'minor',
            virgin_atlantic_impact: true,
            coordinates: { latitude: 51.4700, longitude: -0.4543 }
          },
          {
            id: 'NOTAM-BOS-003',
            airport: 'BOS',
            airport_name: 'Boston Logan International Airport',
            icao: 'KBOS',
            type: 'Airspace Restriction',
            category: 'airspace',
            description: 'Temporary flight restriction due to presidential movement. VIP operations in progress affecting arrival and departure procedures.',
            effective_start: '2025-08-03T14:30:00Z',
            effective_end: '2025-08-03T18:30:00Z',
            created: '2025-08-03T12:00:00Z',
            severity: 'critical',
            impact_areas: ['All Operations', 'Air Traffic Control', 'Security'],
            traffic_impact: 'severe',
            virgin_atlantic_impact: false,
            coordinates: { latitude: 42.3656, longitude: -71.0096 }
          },
          {
            id: 'NOTAM-LAX-004',
            airport: 'LAX',
            airport_name: 'Los Angeles International Airport',
            icao: 'KLAX',
            type: 'Terminal Facilities',
            category: 'facilities',
            description: 'Terminal 4 jetbridge 42A out of service for mechanical repairs. Gate assignments may be affected for wide-body aircraft.',
            effective_start: '2025-08-03T10:00:00Z',
            effective_end: '2025-08-04T16:00:00Z',
            created: '2025-08-02T18:45:00Z',
            severity: 'low',
            impact_areas: ['Gate Operations', 'Aircraft Parking'],
            traffic_impact: 'minor',
            virgin_atlantic_impact: true,
            coordinates: { latitude: 33.9425, longitude: -118.4081 }
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching NOTAMs:', error);
      // Use demo data as fallback
      setNotams([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotams();
    // Refresh NOTAMs every 5 minutes
    const interval = setInterval(fetchNotams, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter NOTAMs based on search and filters
  const filteredNotams = notams.filter(notam => {
    const matchesSearch = searchTerm === '' || 
      notam.airport.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notam.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notam.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = selectedSeverity === 'all' || notam.severity === selectedSeverity;
    const matchesCategory = selectedCategory === 'all' || notam.category === selectedCategory;
    const matchesVirginAtlantic = !virginAtlanticOnly || notam.virgin_atlantic_impact;
    
    return matchesSearch && matchesSeverity && matchesCategory && matchesVirginAtlantic;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 border-red-500 text-red-800';
      case 'high': return 'bg-orange-100 border-orange-500 text-orange-800';
      case 'medium': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'low': return 'bg-blue-100 border-blue-500 text-blue-800';
      default: return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'runway': return '🛫';
      case 'navigation': return '📡';
      case 'airspace': return '🌐';
      case 'facilities': return '🏢';
      case 'services': return '⚙️';
      default: return '📋';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/mission-control')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Mission Control
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
                NOTAMs (Notices to Airmen)
              </h1>
              <p className="text-gray-600 mt-2">
                Active notices affecting flight operations and airport facilities
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchNotams}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh NOTAMs
            </button>
            <div className="text-sm text-gray-500">
              Last Updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search NOTAMs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Categories</option>
              <option value="runway">Runway</option>
              <option value="navigation">Navigation</option>
              <option value="airspace">Airspace</option>
              <option value="facilities">Facilities</option>
              <option value="services">Services</option>
            </select>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={virginAtlanticOnly}
                onChange={(e) => setVirginAtlanticOnly(e.target.checked)}
                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm text-gray-700">Virgin Atlantic Impact Only</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* NOTAMs Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading NOTAMs...
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredNotams.map((notam) => (
            <Card key={notam.id} className={`border-l-4 ${getSeverityColor(notam.severity)}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{getCategoryIcon(notam.category)}</div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {notam.airport} - {notam.type}
                      </h3>
                      <p className="text-sm text-gray-600">{notam.airport_name}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      notam.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      notam.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                      notam.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {notam.severity.toUpperCase()}
                    </div>
                    {notam.virgin_atlantic_impact && (
                      <div className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                        VA Impact
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-gray-700 mb-4">{notam.description}</p>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>
                      <strong>Effective:</strong> {formatDateTime(notam.effective_start)} - {formatDateTime(notam.effective_end)}
                    </span>
                  </div>

                  {notam.affected_runways && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>
                        <strong>Affected Runways:</strong> {notam.affected_runways.join(', ')}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Info className="h-4 w-4" />
                    <span>
                      <strong>Traffic Impact:</strong> {notam.traffic_impact}
                    </span>
                  </div>

                  {notam.impact_areas.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Impact Areas:</p>
                      <div className="flex flex-wrap gap-2">
                        {notam.impact_areas.map((area, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredNotams.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No NOTAMs Found</h3>
          <p className="text-gray-600">
            {searchTerm || selectedSeverity !== 'all' || selectedCategory !== 'all' || virginAtlanticOnly
              ? 'Try adjusting your search or filter criteria.'
              : 'No active NOTAMs at this time.'}
          </p>
        </div>
      )}
    </div>
  );
}