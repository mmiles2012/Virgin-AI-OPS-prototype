import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, AlertCircle, XCircle, Plane, Globe, Users, Clock, FileText } from 'lucide-react';

interface VisaRequirement {
  passport: string;
  destination: string;
  visa_requirement: string;
  notes: string;
  target_match: string;
  scraped_at: string;
}

interface VisaAnalytics {
  report_timestamp: string;
  passenger_nationalities: {
    primary: string[];
    coverage: number;
  };
  destination_analysis: {
    [key: string]: {
      visa_required: number;
      visa_free: number;
      visa_on_arrival: number;
      total_destinations: number;
    };
  };
  operational_insights: {
    high_visa_complexity: string[];
    visa_free_destinations: string[];
    visa_on_arrival_destinations: string[];
  };
}

const VisaRequirementsDashboard: React.FC = () => {
  const [visaData, setVisaData] = useState<VisaRequirement[]>([]);
  const [analytics, setAnalytics] = useState<VisaAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceStatus, setServiceStatus] = useState<any>(null);
  
  // Form states
  const [selectedNationality, setSelectedNationality] = useState('British');
  const [selectedDestination, setSelectedDestination] = useState('');
  const [selectedFlightNumber, setSelectedFlightNumber] = useState('');
  const [lookupResult, setLookupResult] = useState<any>(null);

  const nationalities = ['British', 'Indian', 'U.S.'];
  const popularDestinations = [
    'United States', 'India', 'Jamaica', 'Barbados', 'Nigeria', 'Ghana',
    'Kenya', 'South Africa', 'China', 'Japan', 'Hong Kong', 'Singapore',
    'Australia', 'New Zealand', 'Dubai', 'Turkey'
  ];

  const virginAtlanticFlights = [
    { code: 'VS355', route: 'LHR-BOM', destination: 'India' },
    { code: 'VS103', route: 'LHR-ATL', destination: 'United States' },
    { code: 'VS11', route: 'LHR-BOS', destination: 'United States' },
    { code: 'VS21', route: 'LHR-IAD', destination: 'United States' },
    { code: 'VS401', route: 'LHR-KIN', destination: 'Jamaica' },
    { code: 'VS411', route: 'LHR-BGI', destination: 'Barbados' },
    { code: 'VS507', route: 'LHR-LOS', destination: 'Nigeria' },
    { code: 'VS601', route: 'LHR-CPT', destination: 'South Africa' }
  ];

  useEffect(() => {
    fetchServiceStatus();
    fetchAnalytics();
  }, []);

  const fetchServiceStatus = async () => {
    try {
      const response = await fetch('/api/visa/status');
      const data = await response.json();
      setServiceStatus(data);
    } catch (error) {
      console.error('Error fetching visa service status:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/visa/analytics');
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error fetching visa analytics:', error);
    }
  };

  const fetchNationalityData = async (nationality: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/visa/nationality-analysis?nationality=${nationality}`);
      const data = await response.json();
      
      if (data.success) {
        setVisaData(data.visa_requirements);
      } else {
        setError(data.error || 'Failed to fetch nationality data');
      }
    } catch (error) {
      setError('Error fetching nationality data');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const lookupVisaRequirement = async () => {
    if (!selectedNationality || !selectedDestination) {
      setError('Please select both nationality and destination');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `/api/visa/passenger-requirements?nationality=${selectedNationality}&destination=${selectedDestination}&flight_number=${selectedFlightNumber}`
      );
      const data = await response.json();
      
      if (data.success) {
        setLookupResult(data);
      } else {
        setError(data.error || 'Failed to lookup visa requirement');
        setLookupResult(null);
      }
    } catch (error) {
      setError('Error looking up visa requirement');
      setLookupResult(null);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const lookupFlightVisa = async (flightNumber: string) => {
    if (!selectedNationality || !flightNumber) {
      setError('Please select nationality and flight number');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/visa/flight-check/${flightNumber}?nationality=${selectedNationality}`);
      const data = await response.json();
      
      if (data.success) {
        setLookupResult(data);
      } else {
        setError(data.error || 'Failed to lookup flight visa requirements');
        setLookupResult(null);
      }
    } catch (error) {
      setError('Error looking up flight visa requirements');
      setLookupResult(null);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshVisaCache = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/visa/refresh-cache', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        await fetchServiceStatus();
        await fetchAnalytics();
      } else {
        setError(data.error || 'Failed to refresh visa cache');
      }
    } catch (error) {
      setError('Error refreshing visa cache');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVisaStatusIcon = (requirement: string) => {
    const req = requirement.toLowerCase();
    if (req.includes('visa not required') || req.includes('visa free')) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (req.includes('visa on arrival')) {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    } else if (req.includes('visa required')) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return <AlertCircle className="h-4 w-4 text-gray-500" />;
  };

  const getVisaStatusBadge = (requirement: string) => {
    const req = requirement.toLowerCase();
    if (req.includes('visa not required') || req.includes('visa free')) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Visa Free</Badge>;
    } else if (req.includes('visa on arrival')) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Visa on Arrival</Badge>;
    } else if (req.includes('visa required')) {
      return <Badge variant="secondary" className="bg-red-100 text-red-800">Visa Required</Badge>;
    }
    return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Unknown</Badge>;
  };

  return (
    <div className="min-h-screen w-full bg-gray-900 text-white overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Visa Requirements Intelligence</h1>
          <p className="text-gray-400">Virgin Atlantic passenger visa requirements for three main nationalities</p>
        </div>

        {/* Service Status */}
        <div className="mb-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Service Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {serviceStatus?.supported_nationalities?.length || 0}
                  </div>
                  <div className="text-sm text-gray-400">Supported Nationalities</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {serviceStatus?.virgin_atlantic_destinations || 0}
                  </div>
                  <div className="text-sm text-gray-400">Virgin Atlantic Destinations</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {serviceStatus?.service_running ? 'Active' : 'Inactive'}
                  </div>
                  <div className="text-sm text-gray-400">Service Status</div>
                </div>
              </div>
              <div className="mt-4 flex justify-center">
                <Button onClick={refreshVisaCache} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                  {loading ? 'Refreshing...' : 'Refresh Cache'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {error && (
          <Alert className="mb-6 bg-red-900 border-red-700">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="lookup" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800">
            <TabsTrigger value="lookup">Visa Lookup</TabsTrigger>
            <TabsTrigger value="flight">Flight Check</TabsTrigger>
            <TabsTrigger value="nationality">Nationality Analysis</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="lookup">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Passenger Visa Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nationality</label>
                    <Select value={selectedNationality} onValueChange={setSelectedNationality}>
                      <SelectTrigger className="bg-gray-700 border-gray-600">
                        <SelectValue placeholder="Select nationality" />
                      </SelectTrigger>
                      <SelectContent>
                        {nationalities.map((nationality) => (
                          <SelectItem key={nationality} value={nationality}>
                            {nationality}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Destination</label>
                    <Select value={selectedDestination} onValueChange={setSelectedDestination}>
                      <SelectTrigger className="bg-gray-700 border-gray-600">
                        <SelectValue placeholder="Select destination" />
                      </SelectTrigger>
                      <SelectContent>
                        {popularDestinations.map((destination) => (
                          <SelectItem key={destination} value={destination}>
                            {destination}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Flight Number (Optional)</label>
                    <Input
                      value={selectedFlightNumber}
                      onChange={(e) => setSelectedFlightNumber(e.target.value)}
                      placeholder="e.g., VS355"
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>
                </div>
                <Button
                  onClick={lookupVisaRequirement}
                  disabled={loading || !selectedNationality || !selectedDestination}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? 'Looking up...' : 'Check Visa Requirements'}
                </Button>

                {lookupResult && (
                  <Card className="mt-6 bg-gray-700 border-gray-600">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-4">
                        {getVisaStatusIcon(lookupResult.visa_requirements?.visa_requirement || '')}
                        <span className="font-medium">{lookupResult.destination}</span>
                        {getVisaStatusBadge(lookupResult.visa_requirements?.visa_requirement || '')}
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium">Requirement:</span> {lookupResult.visa_requirements?.visa_requirement}
                        </div>
                        {lookupResult.visa_requirements?.notes && (
                          <div>
                            <span className="font-medium">Notes:</span> {lookupResult.visa_requirements.notes}
                          </div>
                        )}
                        {lookupResult.pre_departure_checklist && (
                          <div className="mt-4 p-4 bg-gray-600 rounded-lg">
                            <h4 className="font-medium mb-2">Pre-Departure Checklist</h4>
                            <ul className="space-y-1 text-sm">
                              {lookupResult.pre_departure_checklist.documents_required?.map((doc: string, index: number) => (
                                <li key={index} className="flex items-center gap-2">
                                  <FileText className="h-3 w-3" />
                                  {doc}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="flight">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Plane className="h-5 w-5" />
                  Flight-Specific Visa Check
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nationality</label>
                    <Select value={selectedNationality} onValueChange={setSelectedNationality}>
                      <SelectTrigger className="bg-gray-700 border-gray-600">
                        <SelectValue placeholder="Select nationality" />
                      </SelectTrigger>
                      <SelectContent>
                        {nationalities.map((nationality) => (
                          <SelectItem key={nationality} value={nationality}>
                            {nationality}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Virgin Atlantic Flight</label>
                    <Select value={selectedFlightNumber} onValueChange={setSelectedFlightNumber}>
                      <SelectTrigger className="bg-gray-700 border-gray-600">
                        <SelectValue placeholder="Select flight" />
                      </SelectTrigger>
                      <SelectContent>
                        {virginAtlanticFlights.map((flight) => (
                          <SelectItem key={flight.code} value={flight.code}>
                            {flight.code} - {flight.route}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  onClick={() => lookupFlightVisa(selectedFlightNumber)}
                  disabled={loading || !selectedNationality || !selectedFlightNumber}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {loading ? 'Checking...' : 'Check Flight Visa Requirements'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nationality">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Nationality Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Select Nationality</label>
                  <Select value={selectedNationality} onValueChange={setSelectedNationality}>
                    <SelectTrigger className="bg-gray-700 border-gray-600">
                      <SelectValue placeholder="Select nationality" />
                    </SelectTrigger>
                    <SelectContent>
                      {nationalities.map((nationality) => (
                        <SelectItem key={nationality} value={nationality}>
                          {nationality}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => fetchNationalityData(selectedNationality)}
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 mb-4"
                >
                  {loading ? 'Analyzing...' : 'Analyze Nationality'}
                </Button>

                {visaData.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Visa Requirements for {selectedNationality} Nationals</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {visaData.map((requirement, index) => (
                        <Card key={index} className="bg-gray-700 border-gray-600">
                          <CardContent className="pt-4">
                            <div className="flex items-center gap-2 mb-2">
                              {getVisaStatusIcon(requirement.visa_requirement)}
                              <span className="font-medium">{requirement.destination}</span>
                            </div>
                            {getVisaStatusBadge(requirement.visa_requirement)}
                            {requirement.notes && (
                              <p className="text-sm text-gray-400 mt-2">{requirement.notes}</p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Visa Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(analytics.destination_analysis).map(([nationality, data]) => (
                        <Card key={nationality} className="bg-gray-700 border-gray-600">
                          <CardHeader>
                            <CardTitle className="text-white text-lg">{nationality}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-green-400">Visa Free:</span>
                                <span>{data.visa_free}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-yellow-400">Visa on Arrival:</span>
                                <span>{data.visa_on_arrival}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-red-400">Visa Required:</span>
                                <span>{data.visa_required}</span>
                              </div>
                              <div className="flex justify-between border-t border-gray-600 pt-2">
                                <span className="font-medium">Total:</span>
                                <span>{data.total_destinations}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {analytics.operational_insights && (
                      <Card className="bg-gray-700 border-gray-600">
                        <CardHeader>
                          <CardTitle className="text-white">Operational Insights</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <span className="font-medium text-red-400">High Visa Complexity:</span>
                              <div className="mt-1">
                                {analytics.operational_insights.high_visa_complexity.length > 0 ? (
                                  analytics.operational_insights.high_visa_complexity.map((nationality, index) => (
                                    <Badge key={index} className="mr-2 bg-red-900 text-red-200">
                                      {nationality}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-gray-400">None</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default VisaRequirementsDashboard;