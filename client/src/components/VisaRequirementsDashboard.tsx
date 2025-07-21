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

interface EntryRiskAnalysis {
  flight_data: {
    flight_number: string;
    route: string;
    passengers: number;
    aircraft_type: string;
  };
  diversion_airport: string;
  manifest_analysis: {
    passenger_nationalities: {
      [key: string]: number;
    };
    total_passengers: number;
    nationality_breakdown: {
      [key: string]: number;
    };
  };
  risk_analysis: {
    entry_risk_score: number;
    risk_level: string;
    flagged_passengers: number;
    total_passengers: number;
    flagged_nationalities: string[];
    risk_details: {
      [key: string]: string;
    };
  };
  alert_notification: {
    alert_id: string;
    priority: string;
    requires_action: boolean;
    operational_recommendation: string;
    notification_channels: string[];
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

  // Entry Risk Analysis states
  const [entryRiskAnalysis, setEntryRiskAnalysis] = useState<EntryRiskAnalysis | null>(null);
  const [riskAnalysisLoading, setRiskAnalysisLoading] = useState(false);
  const [selectedRiskFlight, setSelectedRiskFlight] = useState('');
  const [selectedDiversionAirport, setSelectedDiversionAirport] = useState('');

  const nationalities = ['British', 'Indian', 'U.S.'];
  const popularDestinations = [
    'United States', 'India', 'Jamaica', 'Barbados', 'Nigeria', 'Ghana',
    'Kenya', 'South Africa', 'China', 'Japan', 'Hong Kong', 'Singapore',
    'Australia', 'New Zealand', 'Dubai', 'Turkey'
  ];

  const virginAtlanticFlights = [
    { code: 'VIR3N', route: 'LHR-JFK', destination: 'United States', aircraft: 'A350-1000', passengers: 331 },
    { code: 'VIR42X', route: 'SFO-LHR', destination: 'United Kingdom', aircraft: 'B787-9', passengers: 274 },
    { code: 'VS355', route: 'LHR-BOM', destination: 'India', aircraft: 'A330-300', passengers: 285 },
    { code: 'VS103', route: 'LHR-ATL', destination: 'United States', aircraft: 'A350-1000', passengers: 331 },
    { code: 'VS11', route: 'LHR-BOS', destination: 'United States', aircraft: 'A330-900', passengers: 310 },
    { code: 'VS21', route: 'LHR-IAD', destination: 'United States', aircraft: 'A330-300', passengers: 285 },
    { code: 'VS401', route: 'LHR-KIN', destination: 'Jamaica', aircraft: 'A330-300', passengers: 285 },
    { code: 'VS411', route: 'LHR-BGI', destination: 'Barbados', aircraft: 'A330-300', passengers: 285 }
  ];

  const diversionAirports = [
    { code: 'EINN', name: 'Shannon (Ireland)' },
    { code: 'BIKF', name: 'Keflavik (Iceland)' },
    { code: 'CYQX', name: 'Gander (Canada)' },
    { code: 'LPAZ', name: 'Azores (Portugal)' },
    { code: 'BGTL', name: 'Thule (Greenland)' }
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

  const performEntryRiskAnalysis = async () => {
    if (!selectedRiskFlight || !selectedDiversionAirport) {
      setError('Please select both a flight and diversion airport');
      return;
    }

    setRiskAnalysisLoading(true);
    setError(null);

    try {
      const selectedFlightData = virginAtlanticFlights.find(f => f.code === selectedRiskFlight);
      if (!selectedFlightData) {
        throw new Error('Selected flight not found');
      }

      const requestBody = {
        flight_data: {
          flight_number: selectedFlightData.code,
          route: selectedFlightData.route,
          passengers: selectedFlightData.passengers,
          aircraft_type: selectedFlightData.aircraft
        },
        diversion_airport: selectedDiversionAirport
      };

      const response = await fetch('/api/aviation/airport-intelligence/entry-risk-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setEntryRiskAnalysis(result);
      } else {
        throw new Error(result.error || 'Entry risk analysis failed');
      }
    } catch (err) {
      setError(`Entry risk analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setRiskAnalysisLoading(false);
    }
  };

  const getVisaStatusIcon = (requirement: string) => {
    const req = requirement.toLowerCase();
    if (req.includes('visa not required') || req.includes('visa free')) {
      return <CheckCircle className="h-4 w-4 text-aero-green-safe" />;
    } else if (req.includes('visa on arrival')) {
      return <AlertCircle className="h-4 w-4 text-aero-amber-caution" />;
    } else if (req.includes('visa required')) {
      return <XCircle className="h-4 w-4 text-va-red-primary" />;
    }
    return <AlertCircle className="h-4 w-4 text-foreground0" />;
  };

  const getVisaStatusBadge = (requirement: string) => {
    const req = requirement.toLowerCase();
    if (req.includes('visa not required') || req.includes('visa free')) {
      return <Badge variant="secondary" className="bg-aero-green-safe text-white">Visa Free</Badge>;
    } else if (req.includes('visa on arrival')) {
      return <Badge variant="secondary" className="bg-aero-amber-caution text-white">Visa on Arrival</Badge>;
    } else if (req.includes('visa required')) {
      return <Badge variant="secondary" className="bg-va-red-primary text-white">Visa Required</Badge>;
    }
    return <Badge variant="secondary" className="bg-gray-500 text-white">Unknown</Badge>;
  };

  return (
    <div className="min-h-screen w-full bg-va-cloud-white text-va-midnight overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Visa Requirements Intelligence</h1>
          <p className="text-muted-foreground">Virgin Atlantic passenger visa requirements for three main nationalities</p>
        </div>

        {/* Service Status */}
        <div className="mb-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="_midnight flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Service Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-aero-blue-primary">
                    {serviceStatus?.supported_nationalities?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Supported Nationalities</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-aero-green-safe">
                    {serviceStatus?.virgin_atlantic_destinations || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Virgin Atlantic Destinations</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {serviceStatus?.service_running ? 'Active' : 'Inactive'}
                  </div>
                  <div className="text-sm text-muted-foreground">Service Status</div>
                </div>
              </div>
              <div className="mt-4 flex justify-center">
                <Button onClick={refreshVisaCache} disabled={loading} className="bg-aero-blue-primary hover:bg-aero-blue-light">
                  {loading ? 'Refreshing...' : 'Refresh Cache'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {error && (
          <Alert className="mb-6 bg-va-red-primary/10 border-va-red-primary/30">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="lookup" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-card">
            <TabsTrigger value="lookup">Visa Lookup</TabsTrigger>
            <TabsTrigger value="flight">Flight Check</TabsTrigger>
            <TabsTrigger value="nationality">Nationality Analysis</TabsTrigger>
            <TabsTrigger value="entry-risk">Entry Risk Analysis</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="lookup">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-va-midnight">Passenger Visa Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-va-midnight">Nationality</label>
                    <Select value={selectedNationality} onValueChange={setSelectedNationality}>
                      <SelectTrigger className="bg-va-white border-va-midnight text-va-midnight hover:bg-va-cloud-white">
                        <SelectValue placeholder="Select nationality" />
                      </SelectTrigger>
                      <SelectContent className="bg-va-white border-va-midnight">
                        {nationalities.map((nationality) => (
                          <SelectItem 
                            key={nationality} 
                            value={nationality}
                            className="text-va-midnight hover:bg-va-cloud-white focus:bg-va-cloud-white cursor-pointer"
                          >
                            {nationality}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-va-midnight">Destination</label>
                    <Select value={selectedDestination} onValueChange={setSelectedDestination}>
                      <SelectTrigger className="bg-va-white border-va-midnight text-va-midnight hover:bg-va-cloud-white">
                        <SelectValue placeholder="Select destination" />
                      </SelectTrigger>
                      <SelectContent className="bg-va-white border-va-midnight max-h-60 overflow-y-auto">
                        {popularDestinations.map((destination) => (
                          <SelectItem 
                            key={destination} 
                            value={destination}
                            className="text-va-midnight hover:bg-va-cloud-white focus:bg-va-cloud-white cursor-pointer py-2"
                          >
                            {destination}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-va-midnight">Flight Number (Optional)</label>
                    <Input
                      value={selectedFlightNumber}
                      onChange={(e) => setSelectedFlightNumber(e.target.value)}
                      placeholder="e.g., VS355"
                      className="bg-va-white border-va-midnight text-va-midnight placeholder-muted-foreground"
                    />
                  </div>
                </div>
                <Button
                  onClick={lookupVisaRequirement}
                  disabled={loading || !selectedNationality || !selectedDestination}
                  className="w-full bg-va-red-primary hover:bg-va-red-heritage disabled:bg-muted"
                >
                  {loading ? 'Looking up...' : 'Check Visa Requirements'}
                </Button>

                {lookupResult && (
                  <Card className="mt-6 bg-va-white border-va-midnight">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-4">
                        {getVisaStatusIcon(lookupResult.visa_requirements?.visa_requirement || '')}
                        <span className="font-medium text-va-midnight">{lookupResult.destination}</span>
                        {getVisaStatusBadge(lookupResult.visa_requirements?.visa_requirement || '')}
                      </div>
                      <div className="space-y-2 text-va-midnight">
                        <div>
                          <span className="font-medium">Requirement:</span> {lookupResult.visa_requirements?.visa_requirement}
                        </div>
                        {lookupResult.visa_requirements?.notes && (
                          <div>
                            <span className="font-medium">Notes:</span> {lookupResult.visa_requirements.notes}
                          </div>
                        )}
                        {lookupResult.pre_departure_checklist && (
                          <div className="mt-4 p-4 bg-va-cloud-white rounded-lg border border-va-midnight">
                            <h4 className="font-medium mb-2 text-va-midnight">Pre-Departure Checklist</h4>
                            <ul className="space-y-1 text-sm text-va-midnight">
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
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="_midnight flex items-center gap-2">
                  <Plane className="h-5 w-5" />
                  Flight-Specific Visa Check
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-va-midnight">Nationality</label>
                    <Select value={selectedNationality} onValueChange={setSelectedNationality}>
                      <SelectTrigger className="bg-va-white border-va-midnight text-va-midnight hover:bg-va-cloud-white">
                        <SelectValue placeholder="Select nationality" />
                      </SelectTrigger>
                      <SelectContent className="bg-va-white border-va-midnight">
                        {nationalities.map((nationality) => (
                          <SelectItem 
                            key={nationality} 
                            value={nationality}
                            className="text-va-midnight hover:bg-va-cloud-white focus:bg-va-cloud-white cursor-pointer"
                          >
                            {nationality}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-va-midnight">Virgin Atlantic Flight</label>
                    <Select value={selectedFlightNumber} onValueChange={setSelectedFlightNumber}>
                      <SelectTrigger className="bg-va-white border-va-midnight text-va-midnight hover:bg-va-cloud-white">
                        <SelectValue placeholder="Select flight" />
                      </SelectTrigger>
                      <SelectContent className="bg-va-white border-va-midnight">
                        {virginAtlanticFlights.map((flight) => (
                          <SelectItem 
                            key={flight.code} 
                            value={flight.code}
                            className="text-va-midnight hover:bg-va-cloud-white focus:bg-va-cloud-white cursor-pointer"
                          >
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
                  className="w-full bg-aero-green-safe hover:bg-aero-green-dark disabled:bg-muted"
                >
                  {loading ? 'Checking...' : 'Check Flight Visa Requirements'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nationality">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="_midnight flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Nationality Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 text-va-midnight">Select Nationality</label>
                  <Select value={selectedNationality} onValueChange={setSelectedNationality}>
                    <SelectTrigger className="bg-va-white border-va-midnight text-va-midnight hover:bg-va-cloud-white">
                      <SelectValue placeholder="Select nationality" />
                    </SelectTrigger>
                    <SelectContent className="bg-va-white border-va-midnight">
                      {nationalities.map((nationality) => (
                        <SelectItem 
                          key={nationality} 
                          value={nationality}
                          className="text-va-midnight hover:bg-va-cloud-white focus:bg-va-cloud-white cursor-pointer"
                        >
                          {nationality}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => fetchNationalityData(selectedNationality)}
                  disabled={loading}
                  className="w-full bg-aero-blue-primary hover:bg-aero-blue-dark mb-4 disabled:bg-muted"
                >
                  {loading ? 'Analyzing...' : 'Analyze Nationality'}
                </Button>

                {visaData.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-va-midnight">Visa Requirements for {selectedNationality} Nationals</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {visaData.map((requirement, index) => (
                        <Card key={index} className="bg-va-white border-va-midnight">
                          <CardContent className="pt-4">
                            <div className="flex items-center gap-2 mb-2">
                              {getVisaStatusIcon(requirement.visa_requirement)}
                              <span className="font-medium text-va-midnight">{requirement.destination}</span>
                            </div>
                            {getVisaStatusBadge(requirement.visa_requirement)}
                            {requirement.notes && (
                              <p className="text-sm text-muted-foreground mt-2">{requirement.notes}</p>
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
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="_midnight flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Visa Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(analytics.destination_analysis).map(([nationality, data]) => (
                        <Card key={nationality} className="bg-va-white border-va-midnight">
                          <CardHeader>
                            <CardTitle className="text-foreground text-lg">{nationality}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 text-va-midnight">
                              <div className="flex justify-between">
                                <span className="text-aero-green-safe">Visa Free:</span>
                                <span>{data.visa_free}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-aero-amber-caution">Visa on Arrival:</span>
                                <span>{data.visa_on_arrival}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-va-red-primary">Visa Required:</span>
                                <span>{data.visa_required}</span>
                              </div>
                              <div className="flex justify-between border-t border-border pt-2">
                                <span className="font-medium">Total:</span>
                                <span>{data.total_destinations}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {analytics.operational_insights && (
                      <Card className="bg-va-white border-va-midnight">
                        <CardHeader>
                          <CardTitle className="text-va-midnight">Operational Insights</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <span className="font-medium text-va-red-primary">High Visa Complexity:</span>
                              <div className="mt-1">
                                {analytics.operational_insights.high_visa_complexity.length > 0 ? (
                                  analytics.operational_insights.high_visa_complexity.map((nationality, index) => (
                                    <Badge key={index} className="mr-2 bg-red-900 text-red-200">
                                      {nationality}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-muted-foreground">None</span>
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

          <TabsContent value="entry-risk">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="_midnight flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-aero-orange-alert" />
                  Entry Risk Analysis for Aircraft Diversions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-va-midnight">Virgin Atlantic Flight</label>
                    <Select value={selectedRiskFlight} onValueChange={setSelectedRiskFlight}>
                      <SelectTrigger className="bg-va-white border-va-midnight text-va-midnight hover:bg-va-cloud-white">
                        <SelectValue placeholder="Select flight" />
                      </SelectTrigger>
                      <SelectContent className="bg-va-white border-va-midnight">
                        {virginAtlanticFlights.map((flight) => (
                          <SelectItem key={flight.code} value={flight.code} className="text-va-midnight hover:bg-va-cloud-white focus:bg-va-cloud-white">
                            {flight.code} ({flight.route}) - {flight.aircraft} - {flight.passengers} pax
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-va-midnight">Diversion Airport</label>
                    <Select value={selectedDiversionAirport} onValueChange={setSelectedDiversionAirport}>
                      <SelectTrigger className="bg-va-white border-va-midnight text-va-midnight hover:bg-va-cloud-white">
                        <SelectValue placeholder="Select diversion airport" />
                      </SelectTrigger>
                      <SelectContent className="bg-va-white border-va-midnight">
                        {diversionAirports.map((airport) => (
                          <SelectItem key={airport.code} value={airport.code} className="text-va-midnight hover:bg-va-cloud-white focus:bg-va-cloud-white">
                            {airport.code} - {airport.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mb-6">
                  <Button 
                    onClick={performEntryRiskAnalysis} 
                    disabled={riskAnalysisLoading || !selectedRiskFlight || !selectedDiversionAirport}
                    className="bg-aero-orange-vibrant hover:bg-aero-orange-alert"
                  >
                    {riskAnalysisLoading ? 'Analyzing Entry Risks...' : 'Analyze Entry Risk'}
                  </Button>
                </div>

                {entryRiskAnalysis && (
                  <div className="space-y-6">
                    {/* Risk Overview */}
                    <Card className="bg-va-white border-va-midnight">
                      <CardHeader>
                        <CardTitle className="_midnight flex items-center gap-2">
                          <AlertCircle className="h-5 w-5" />
                          Risk Assessment Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className={`text-2xl font-bold ${
                              entryRiskAnalysis.risk_analysis.risk_level === 'LOW' ? 'text-aero-green-safe' :
                              entryRiskAnalysis.risk_analysis.risk_level === 'MEDIUM' ? 'text-aero-amber-caution' :
                              entryRiskAnalysis.risk_analysis.risk_level === 'HIGH' ? 'text-aero-orange-alert' :
                              'text-va-red-primary'
                            }`}>
                              {entryRiskAnalysis.risk_analysis.risk_level}
                            </div>
                            <div className="text-sm text-muted-foreground">Risk Level</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-aero-blue-primary">
                              {(entryRiskAnalysis.risk_analysis.entry_risk_score * 100).toFixed(1)}%
                            </div>
                            <div className="text-sm text-muted-foreground">Risk Score</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-400">
                              {entryRiskAnalysis.risk_analysis.flagged_passengers}
                            </div>
                            <div className="text-sm text-muted-foreground">Affected Passengers</div>
                          </div>
                          <div className="text-center">
                            <div className={`text-2xl font-bold ${
                              entryRiskAnalysis.alert_notification.priority === 'INFO' ? 'text-aero-blue-primary' :
                              entryRiskAnalysis.alert_notification.priority === 'WARNING' ? 'text-aero-amber-caution' :
                              entryRiskAnalysis.alert_notification.priority === 'ALERT' ? 'text-aero-orange-alert' :
                              'text-va-red-primary'
                            }`}>
                              {entryRiskAnalysis.alert_notification.priority}
                            </div>
                            <div className="text-sm text-muted-foreground">Alert Priority</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Passenger Manifest Analysis */}
                    <Card className="bg-va-white border-va-midnight">
                      <CardHeader>
                        <CardTitle className="_midnight flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Passenger Manifest Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {Object.entries(entryRiskAnalysis.manifest_analysis.nationality_breakdown).map(([nationality, count]) => (
                            <div key={nationality} className="text-center">
                              <div className="text-xl font-bold text-aero-blue-primary">{count}</div>
                              <div className="text-sm text-muted-foreground">{nationality}</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Flagged Nationalities */}
                    {entryRiskAnalysis.risk_analysis.flagged_nationalities.length > 0 && (
                      <Card className="bg-va-white border-va-midnight">
                        <CardHeader>
                          <CardTitle className="_midnight flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-va-red-primary" />
                            Visa Issues Detected
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {entryRiskAnalysis.risk_analysis.flagged_nationalities.map((nationality, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-va-red-primary/10 border border-red-800 rounded">
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-red-800 text-red-200">{nationality}</Badge>
                                  <span className="text-va-midnight">nationals require visa for {entryRiskAnalysis.diversion_airport}</span>
                                </div>
                                <span className="text-va-red-primary font-medium">
                                  {entryRiskAnalysis.risk_analysis.risk_details[nationality] || 'Visa Required'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Operational Recommendations */}
                    <Card className="bg-va-white border-va-midnight">
                      <CardHeader>
                        <CardTitle className="_midnight flex items-center gap-2">
                          <FileText className="h-5 w-5 text-aero-green-safe" />
                          Operational Recommendations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="p-4 bg-aero-blue-primary/10 border border-blue-800 rounded">
                            <div className="font-medium text-aero-blue-primary mb-2">Alert ID: {entryRiskAnalysis.alert_notification.alert_id}</div>
                            <div className="text-va-midnight">{entryRiskAnalysis.alert_notification.operational_recommendation}</div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Action Required:</span>
                            <Badge className={entryRiskAnalysis.alert_notification.requires_action ? 'bg-orange-800 text-orange-200' : 'bg-green-800 text-green-200'}>
                              {entryRiskAnalysis.alert_notification.requires_action ? 'YES' : 'NO'}
                            </Badge>
                          </div>

                          <div>
                            <span className="text-muted-foreground">Notification Channels:</span>
                            <div className="mt-1 flex gap-2">
                              {entryRiskAnalysis.alert_notification.notification_channels.map((channel, index) => (
                                <Badge key={index} className="bg-card text-muted-foreground">{channel}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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