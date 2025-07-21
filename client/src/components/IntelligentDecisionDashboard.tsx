import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Zap,
  BarChart3,
  Settings,
  Activity,
  Lightbulb,
  ArrowRight,
  Plane,
  MapPin,
  Search,
  Navigation,
  Crosshair
} from 'lucide-react';
import { calculateFuelPercentage } from '../lib/utils/fuelCalculation';
import { useSelectedFlight } from '../lib/stores/useSelectedFlight';

interface DecisionOption {
  id: string;
  title: string;
  description: string;
  estimated_cost_usd?: number;
  estimated_delay_mins?: number;
  weather?: {
    visibility_km: number;
    wind_speed_kts: number;
    ceiling_ft: number;
  };
  fuel_required_kg?: number;
  missed_connections?: number;
  airport_code?: string;
  runway_length_ft?: number;
  fire_category?: number;
  maintenance_available?: boolean;
}

interface DecisionScenario {
  type: string;
  description: string;
  context: {
    aircraft_type?: string;
    current_fuel_kg?: number;
    passenger_count?: number;
    total_connections?: number;
    max_cost_budget?: number;
  };
  options: DecisionOption[];
}

interface DecisionAnalysis {
  scenario_id: string;
  timestamp: string;
  scenario_type: string;
  analysis_method: string;
  options_analyzed: number;
  recommendations: Array<{
    type: string;
    option_id: string;
    confidence: number;
    rationale: string;
    action: string;
    expected_outcome: string;
  }>;
  options_analysis: Array<{
    option_id: string;
    total_score: number;
    risk_level: string;
    confidence: number;
    recommendation_rank: number;
    factor_scores?: { [key: string]: number };
  }>;
}

interface DecisionInsights {
  total_decisions: number;
  scenario_types: { [key: string]: number };
  average_confidence: number;
  risk_distribution: { [key: string]: number };
  performance_metrics: {
    decision_accuracy: number;
    implementation_success_rate: number;
    cost_savings_achieved: number;
    time_savings_minutes: number;
  };
}

const IntelligentDecisionDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'flight_selection' | 'analyzer' | 'insights' | 'scenarios'>('flight_selection');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<DecisionAnalysis | null>(null);
  const [insights, setInsights] = useState<DecisionInsights | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<string>('diversion');
  const [customScenario, setCustomScenario] = useState<DecisionScenario>({
    type: 'diversion',
    description: 'Aircraft diversion decision analysis',
    context: {
      aircraft_type: 'A350',
      current_fuel_kg: 18000,
      passenger_count: 331,
      total_connections: 45,
      max_cost_budget: 150000
    },
    options: []
  });

  // Flight selection state
  const { selectedFlight, selectFlightByCallsign, clearSelection } = useSelectedFlight();
  const [availableFlights, setAvailableFlights] = useState<any[]>([]);
  const [flightSearchTerm, setFlightSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{
    name: string;
    icao: string;
    iata: string;
    coordinates: { lat: number; lon: number };
    country: string;
    region: string;
  } | null>(null);
  const [locationSearchTerm, setLocationSearchTerm] = useState('');
  const [availableLocations, setAvailableLocations] = useState<any[]>([]);
  
  // Flight plan upload state
  const [uploadedFlightPlans, setUploadedFlightPlans] = useState<any[]>([]);
  const [selectedFlightPlan, setSelectedFlightPlan] = useState<any>(null);
  const [diversionAnalysis, setDiversionAnalysis] = useState<any>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [flightPlanContent, setFlightPlanContent] = useState('');
  const [flightPlanFilename, setFlightPlanFilename] = useState('');

  useEffect(() => {
    fetchInsights();
    loadSampleScenario();
    fetchAvailableFlights();
    loadSampleLocations();
    fetchUploadedFlightPlans();
  }, []);

  const fetchUploadedFlightPlans = async () => {
    try {
      const response = await fetch('/api/flight-plans');
      const data = await response.json();
      if (data.success) {
        setUploadedFlightPlans(data.flightPlans || []);
        console.log('📋 Loaded', data.flightPlans?.length || 0, 'uploaded flight plans');
      }
    } catch (error) {
      console.error('Failed to fetch flight plans:', error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-populate filename if using text input
      if (!flightPlanFilename) {
        setFlightPlanFilename(file.name);
      }
    }
  };

  const uploadFlightPlan = async () => {
    setUploadLoading(true);
    try {
      let response;

      if (selectedFile) {
        // File upload
        const formData = new FormData();
        formData.append('flightPlan', selectedFile);
        
        response = await fetch('/api/flight-plans/upload', {
          method: 'POST',
          body: formData
        });
      } else if (flightPlanContent.trim() && flightPlanFilename.trim()) {
        // Text upload
        response = await fetch('/api/flight-plans/upload-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: flightPlanFilename,
            content: flightPlanContent,
            format: 'auto'
          })
        });
      } else {
        alert('Please select a file or enter text content');
        setUploadLoading(false);
        return;
      }

      const data = await response.json();
      if (data.success) {
        console.log('✈️ Flight plan uploaded successfully:', data.flightPlan.callsign);
        
        // Clear form
        setFlightPlanContent('');
        setFlightPlanFilename('');
        setSelectedFile(null);
        
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        fetchUploadedFlightPlans(); // Refresh list
        alert(`Flight plan uploaded successfully for ${data.flightPlan.callsign}`);
      } else {
        alert(`Upload failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload flight plan');
    } finally {
      setUploadLoading(false);
    }
  };

  const performDiversionAnalysis = async () => {
    if (!selectedFlightPlan || !selectedFlight) {
      alert('Please select both a flight plan and current flight position');
      return;
    }

    try {
      const response = await fetch(`/api/flight-plans/${selectedFlightPlan.callsign}/diversion-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPosition: {
            lat: selectedFlight.latitude,
            lon: selectedFlight.longitude
          },
          emergencyType: 'engine_failure'
        })
      });

      const data = await response.json();
      if (data.success) {
        setDiversionAnalysis(data.diversionAnalysis);
        console.log('🛠️ Diversion analysis completed for', selectedFlightPlan.callsign);
      } else {
        alert(`Analysis failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Diversion analysis error:', error);
      alert('Failed to perform diversion analysis');
    }
  };

  const fetchAvailableFlights = async () => {
    try {
      const response = await fetch('/api/aviation/virgin-atlantic-flights');
      const data = await response.json();
      if (data.success) {
        setAvailableFlights(data.flights || []);
        console.log('✈️ Loaded', data.flights?.length || 0, 'Virgin Atlantic flights for selection');
      }
    } catch (error) {
      console.error('Failed to fetch flights:', error);
    }
  };

  const loadSampleLocations = () => {
    const virginAtlanticHubs = [
      { name: 'London Heathrow', icao: 'EGLL', iata: 'LHR', coordinates: { lat: 51.4700, lon: -0.4543 }, country: 'United Kingdom', region: 'Europe' },
      { name: 'Manchester', icao: 'EGCC', iata: 'MAN', coordinates: { lat: 53.3537, lon: -2.2750 }, country: 'United Kingdom', region: 'Europe' },
      { name: 'John F Kennedy Intl', icao: 'KJFK', iata: 'JFK', coordinates: { lat: 40.6413, lon: -73.7781 }, country: 'United States', region: 'North America' },
      { name: 'Los Angeles Intl', icao: 'KLAX', iata: 'LAX', coordinates: { lat: 33.9425, lon: -118.4081 }, country: 'United States', region: 'North America' },
      { name: 'Boston Logan Intl', icao: 'KBOS', iata: 'BOS', coordinates: { lat: 42.3656, lon: -71.0096 }, country: 'United States', region: 'North America' },
      { name: 'Atlanta Hartsfield', icao: 'KATL', iata: 'ATL', coordinates: { lat: 33.6407, lon: -84.4277 }, country: 'United States', region: 'North America' },
      { name: 'Orlando Intl', icao: 'KMCO', iata: 'MCO', coordinates: { lat: 28.4312, lon: -81.3081 }, country: 'United States', region: 'North America' },
      { name: 'Delhi Indira Gandhi', icao: 'VIDP', iata: 'DEL', coordinates: { lat: 28.5665, lon: 77.1030 }, country: 'India', region: 'Asia' },
      { name: 'Mumbai Chhatrapati', icao: 'VABB', iata: 'BOM', coordinates: { lat: 19.0896, lon: 72.8656 }, country: 'India', region: 'Asia' },
      { name: 'Riyadh King Khalid', icao: 'OERK', iata: 'RUH', coordinates: { lat: 24.9576, lon: 46.6988 }, country: 'Saudi Arabia', region: 'Middle East' },
      // Diversion alternates
      { name: 'Shannon Airport', icao: 'EINN', iata: 'SNN', coordinates: { lat: 52.7019, lon: -8.9247 }, country: 'Ireland', region: 'Europe' },
      { name: 'Keflavik Intl', icao: 'BIKF', iata: 'KEF', coordinates: { lat: 63.9850, lon: -22.6056 }, country: 'Iceland', region: 'Europe' },
      { name: 'Gander Intl', icao: 'CYQX', iata: 'YQX', coordinates: { lat: 48.9369, lon: -54.5681 }, country: 'Canada', region: 'North America' }
    ];
    setAvailableLocations(virginAtlanticHubs);
  };

  const fetchInsights = async () => {
    try {
      const response = await fetch('/api/intelligent-decisions/insights');
      const data = await response.json();
      if (data.success) {
        setInsights(data.insights);
      }
    } catch (error) {
      console.error('Failed to fetch decision insights:', error);
    }
  };

  const loadSampleScenario = () => {
    const sampleOptions: DecisionOption[] = [
      {
        id: 'EINN_Shannon',
        title: 'Shannon Airport (Ireland)',
        description: 'Nearest European alternate with full Virgin Atlantic support',
        airport_code: 'EINN',
        runway_length_ft: 10500,
        fire_category: 9,
        maintenance_available: true,
        fuel_required_kg: 3200,
        estimated_delay_mins: 90,
        estimated_cost_usd: 85000,
        missed_connections: 8,
        weather: {
          visibility_km: 8,
          wind_speed_kts: 15,
          ceiling_ft: 1200
        }
      },
      {
        id: 'BIKF_Keflavik',
        title: 'Keflavik Airport (Iceland)',
        description: 'Northern alternate with good weather but higher costs',
        airport_code: 'BIKF',
        runway_length_ft: 10000,
        fire_category: 8,
        maintenance_available: true,
        fuel_required_kg: 4500,
        estimated_delay_mins: 120,
        estimated_cost_usd: 120000,
        missed_connections: 15,
        weather: {
          visibility_km: 12,
          wind_speed_kts: 25,
          ceiling_ft: 2000
        }
      },
      {
        id: 'CYQX_Gander',
        title: 'Gander Airport (Canada)',
        description: 'Traditional NAT alternate with extended delay',
        airport_code: 'CYQX',
        runway_length_ft: 10500,
        fire_category: 8,
        maintenance_available: true,
        fuel_required_kg: 5200,
        estimated_delay_mins: 180,
        estimated_cost_usd: 95000,
        missed_connections: 25,
        weather: {
          visibility_km: 6,
          wind_speed_kts: 20,
          ceiling_ft: 800
        }
      }
    ];

    setCustomScenario(prev => ({ ...prev, options: sampleOptions }));
  };

  const analyzeScenario = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/intelligent-decisions/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customScenario),
      });

      const data = await response.json();
      if (data.success) {
        setAnalysis(data.analysis);
        console.log('🧠 Decision analysis complete:', data.analysis);
      }
    } catch (error) {
      console.error('Failed to analyze scenario:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW': return 'text-green-400';
      case 'MEDIUM': return 'text-yellow-400';
      case 'HIGH': return 'text-orange-400';
      case 'CRITICAL': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getRiskCardClass = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'bg-green-50 border-green-200';
      case 'MEDIUM': return 'bg-yellow-50 border-yellow-200';
      case 'HIGH': return 'bg-orange-50 border-orange-200';
      case 'CRITICAL': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };  const formatNumber = (num: number, prefix: string = '', suffix: string = '') => {
    return `${prefix}${num.toLocaleString()}${suffix}`;
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 text-gray-900 overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Intelligent Decision Support</h1>
            <p className="text-gray-400">ML-powered operational decision analysis</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2">
          {[
            { key: 'flight_selection', label: 'Flight & Location Selection', icon: Crosshair },
            { key: 'analyzer', label: 'Decision Analyzer', icon: Target },
            { key: 'insights', label: 'Decision Insights', icon: BarChart3 },
            { key: 'scenarios', label: 'Scenario Library', icon: Settings }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                activeTab === key
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'flight_selection' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Flight Selection */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                <Plane className="w-5 h-5 text-blue-400" />
                Flight Selection
              </h3>

              {/* Flight Search */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-300">Search Flights</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by callsign, route, or registration..."
                    value={flightSearchTerm}
                    onChange={(e) => setFlightSearchTerm(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-3 py-2 text-white placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Flight List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableFlights
                  .filter(flight => 
                    !flightSearchTerm || 
                    flight.callsign?.toLowerCase().includes(flightSearchTerm.toLowerCase()) ||
                    flight.flight_number?.toLowerCase().includes(flightSearchTerm.toLowerCase()) ||
                    flight.route?.toLowerCase().includes(flightSearchTerm.toLowerCase()) ||
                    flight.registration?.toLowerCase().includes(flightSearchTerm.toLowerCase())
                  )
                  .map((flight, index) => (
                    <div 
                      key={flight.callsign || index}
                      onClick={() => selectFlightByCallsign(flight.callsign || flight.flight_number)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedFlight?.callsign === flight.callsign 
                          ? 'bg-blue-900/30 border-blue-600' 
                          : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-white">{flight.callsign || flight.flight_number}</div>
                          <div className="text-sm text-gray-400">{flight.route || `${flight.departure_airport}-${flight.arrival_airport}`}</div>
                          <div className="text-xs text-gray-500">
                            {flight.aircraft_type} • {flight.registration} • {flight.authentic_tracking ? 'Live ADS-B' : 'Estimated'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-300">{flight.altitude}ft</div>
                          <div className="text-xs text-gray-400">{flight.velocity}kt</div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Selected Flight Summary */}
              {selectedFlight && (
                <div className="mt-4 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                  <h4 className="font-medium text-blue-300 mb-2">Selected Flight</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400">Callsign:</span>
                      <span className="text-white ml-2">{selectedFlight.callsign}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Aircraft:</span>
                      <span className="text-white ml-2">{selectedFlight.aircraft_type || selectedFlight.aircraft}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Route:</span>
                      <span className="text-white ml-2">{selectedFlight.route || `${selectedFlight.origin}-${selectedFlight.destination}`}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Position:</span>
                      <span className="text-white ml-2">{selectedFlight.latitude?.toFixed(2)}, {selectedFlight.longitude?.toFixed(2)}</span>
                    </div>
                  </div>
                  <button
                    onClick={clearSelection}
                    className="mt-3 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                  >
                    Clear Selection
                  </button>
                </div>
              )}
            </div>

            {/* Geographic Location Selection */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                <MapPin className="w-5 h-5 text-green-400" />
                Geographic Location Selection
              </h3>

              {/* Location Search */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-300">Search Locations</label>
                <div className="relative">
                  <Navigation className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by airport name, ICAO, or country..."
                    value={locationSearchTerm}
                    onChange={(e) => setLocationSearchTerm(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-3 py-2 text-white placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Location Categories */}
              <div className="mb-4">
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-1 bg-blue-600 text-white rounded">Virgin Atlantic Hubs</span>
                  <span className="px-2 py-1 bg-orange-600 text-white rounded">Diversion Alternates</span>
                </div>
              </div>

              {/* Location List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableLocations
                  .filter(location => 
                    !locationSearchTerm || 
                    location.name?.toLowerCase().includes(locationSearchTerm.toLowerCase()) ||
                    location.icao?.toLowerCase().includes(locationSearchTerm.toLowerCase()) ||
                    location.iata?.toLowerCase().includes(locationSearchTerm.toLowerCase()) ||
                    location.country?.toLowerCase().includes(locationSearchTerm.toLowerCase())
                  )
                  .map((location, index) => (
                    <div 
                      key={location.icao || index}
                      onClick={() => setSelectedLocation(location)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedLocation?.icao === location.icao 
                          ? 'bg-green-900/30 border-green-600' 
                          : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-white">{location.name}</div>
                          <div className="text-sm text-gray-400">{location.icao} / {location.iata}</div>
                          <div className="text-xs text-gray-500">{location.country} • {location.region}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-400">
                            {location.coordinates.lat.toFixed(2)}°, {location.coordinates.lon.toFixed(2)}°
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Selected Location Summary */}
              {selectedLocation && (
                <div className="mt-4 p-4 bg-green-900/20 border border-green-700 rounded-lg">
                  <h4 className="font-medium text-green-300 mb-2">Selected Location</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400">Airport:</span>
                      <span className="text-white ml-2">{selectedLocation.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Codes:</span>
                      <span className="text-white ml-2">{selectedLocation.icao} / {selectedLocation.iata}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Country:</span>
                      <span className="text-white ml-2">{selectedLocation.country}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Coordinates:</span>
                      <span className="text-white ml-2">{selectedLocation.coordinates.lat.toFixed(4)}, {selectedLocation.coordinates.lon.toFixed(4)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedLocation(null)}
                    className="mt-3 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                  >
                    Clear Location
                  </button>
                </div>
              )}
            </div>

            {/* Flight Plan Upload */}
            <div className="lg:col-span-2 bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                <Target className="w-5 h-5 text-orange-400" />
                Flight Plan Upload for Enroute Diversion Analysis
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upload Interface */}
                <div>
                  <h4 className="font-medium text-orange-300 mb-3">Upload Flight Plan</h4>
                  <div className="space-y-3">
                    {/* File Upload Option */}
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-300">Upload PDF or Text File</label>
                      <input
                        type="file"
                        accept=".pdf,.txt,.json,.xml"
                        onChange={handleFileUpload}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-medium file:bg-orange-600 file:text-white hover:file:bg-orange-700"
                      />
                      <p className="text-xs text-gray-400 mt-1">Supports PDF, TXT, JSON, and XML flight plans</p>
                    </div>
                    
                    {/* Text Input Option */}
                    <div className="text-center text-gray-400 text-sm">
                      <span>OR</span>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-300">Filename</label>
                      <input
                        type="text"
                        placeholder="e.g., VIR3N_LHR_JFK_Plan.txt"
                        value={flightPlanFilename}
                        onChange={(e) => setFlightPlanFilename(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-300">Flight Plan Content</label>
                      <textarea
                        placeholder="Paste flight plan here (supports ICAO, JSON, XML, or text format)"
                        value={flightPlanContent}
                        onChange={(e) => setFlightPlanContent(e.target.value)}
                        rows={8}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 font-mono text-sm"
                      />
                    </div>
                    <button
                      onClick={uploadFlightPlan}
                      disabled={uploadLoading || (!flightPlanContent.trim() && !selectedFile) || (!flightPlanFilename.trim() && !selectedFile)}
                      className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                    >
                      {uploadLoading ? 'Uploading...' : selectedFile ? `Upload ${selectedFile.name}` : 'Upload Flight Plan'}
                    </button>
                  </div>
                </div>

                {/* Uploaded Flight Plans */}
                <div>
                  <h4 className="font-medium text-orange-300 mb-3">Uploaded Flight Plans ({uploadedFlightPlans.length})</h4>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {uploadedFlightPlans.map((plan, index) => (
                      <div 
                        key={plan.callsign || index}
                        onClick={() => setSelectedFlightPlan(plan)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedFlightPlan?.callsign === plan.callsign 
                            ? 'bg-orange-900/30 border-orange-600' 
                            : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-white">{plan.callsign || plan.flightNumber}</div>
                            <div className="text-sm text-gray-400">{plan.route || `${plan.departure}-${plan.destination}`}</div>
                            <div className="text-xs text-gray-500">
                              {plan.waypointCount} waypoints • {plan.format} format • {new Date(plan.uploadedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {uploadedFlightPlans.length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No flight plans uploaded yet</p>
                        <p className="text-sm">Upload actual flight plans for enroute diversion analysis</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Diversion Analysis Trigger */}
              {selectedFlightPlan && selectedFlight && (
                <div className="mt-6 p-4 bg-orange-900/20 border border-orange-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-orange-300">Ready for Enroute Diversion Analysis</h4>
                      <p className="text-sm text-gray-400">
                        Flight Plan: {selectedFlightPlan.callsign} • Current Flight: {selectedFlight.callsign}
                      </p>
                    </div>
                    <button
                      onClick={performDiversionAnalysis}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Analyze Diversions
                    </button>
                  </div>
                </div>
              )}

              {/* Diversion Analysis Results */}
              {diversionAnalysis && (
                <div className="mt-6 p-4 bg-purple-900/20 border border-purple-700 rounded-lg">
                  <h4 className="font-medium text-purple-300 mb-3">Enroute Diversion Analysis Results</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h5 className="font-medium text-white mb-2">Analysis Summary</h5>
                      <div className="space-y-1">
                        <div><span className="text-gray-400">Flight:</span> <span className="text-white">{diversionAnalysis.flightPlan.callsign}</span></div>
                        <div><span className="text-gray-400">Current Position:</span> <span className="text-white">{diversionAnalysis.currentPosition.lat.toFixed(2)}, {diversionAnalysis.currentPosition.lon.toFixed(2)}</span></div>
                        <div><span className="text-gray-400">Emergency Type:</span> <span className="text-white">{diversionAnalysis.emergencyType}</span></div>
                        <div><span className="text-gray-400">Options Found:</span> <span className="text-white">{diversionAnalysis.summary.totalOptions}</span></div>
                        <div><span className="text-gray-400">Recommended:</span> <span className="text-white">{diversionAnalysis.summary.recommendedOption}</span></div>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-white mb-2">Top Diversion Options</h5>
                      <div className="space-y-2">
                        {diversionAnalysis.diversionOptions.slice(0, 3).map((option: any, idx: number) => (
                          <div key={idx} className="p-2 bg-gray-800 rounded border">
                            <div className="font-medium text-purple-300">{option.airport.name} ({option.airport.icao})</div>
                            <div className="text-xs text-gray-400">
                              {option.distance}nm • {option.estimatedFlightTime}min • Score: {option.suitabilityScore}/100
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Analysis Integration */}
            <div className="lg:col-span-2 bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                <Brain className="w-5 h-5 text-purple-400" />
                Decision Context Integration
              </h3>

              {selectedFlight && selectedLocation ? (
                <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="font-medium text-white">Ready for Intelligent Analysis</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium text-purple-300 mb-2">Selected Flight</h4>
                      <div className="space-y-1">
                        <div><span className="text-gray-400">Flight:</span> <span className="text-white">{selectedFlight.callsign}</span></div>
                        <div><span className="text-gray-400">Aircraft:</span> <span className="text-white">{selectedFlight.aircraft_type || selectedFlight.aircraft}</span></div>
                        <div><span className="text-gray-400">Route:</span> <span className="text-white">{selectedFlight.route}</span></div>
                        <div><span className="text-gray-400">Current Position:</span> <span className="text-white">{selectedFlight.latitude?.toFixed(2)}, {selectedFlight.longitude?.toFixed(2)}</span></div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-purple-300 mb-2">Target Location</h4>
                      <div className="space-y-1">
                        <div><span className="text-gray-400">Airport:</span> <span className="text-white">{selectedLocation.name}</span></div>
                        <div><span className="text-gray-400">Codes:</span> <span className="text-white">{selectedLocation.icao} / {selectedLocation.iata}</span></div>
                        <div><span className="text-gray-400">Location:</span> <span className="text-white">{selectedLocation.coordinates.lat.toFixed(2)}, {selectedLocation.coordinates.lon.toFixed(2)}</span></div>
                        <div><span className="text-gray-400">Region:</span> <span className="text-white">{selectedLocation.region}</span></div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => setActiveTab('analyzer')}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                    >
                      <ArrowRight className="w-4 h-4" />
                      Proceed to Decision Analysis
                    </button>
                    <button
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                    >
                      <Zap className="w-4 h-4" />
                      Generate Scenario
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <p className="text-gray-300 mb-1">Flight and Location Selection Required</p>
                  <p className="text-sm text-gray-400">
                    {!selectedFlight && !selectedLocation && "Please select both a flight and geographic location to proceed with intelligent decision analysis."}
                    {selectedFlight && !selectedLocation && "Please select a geographic location to complete the context."}
                    {!selectedFlight && selectedLocation && "Please select a flight to complete the context."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analyzer' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scenario Configuration */}
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-400" />
                  Scenario Configuration
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Scenario Type</label>
                    <select
                      value={selectedScenario}
                      onChange={(e) => setSelectedScenario(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
                    >
                      <option value="diversion">Aircraft Diversion</option>
                      <option value="delay_management">Delay Management</option>
                      <option value="route_optimization">Route Optimization</option>
                      <option value="resource_allocation">Resource Allocation</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Aircraft Type</label>
                      <select
                        value={customScenario.context.aircraft_type}
                        onChange={(e) => setCustomScenario(prev => ({
                          ...prev,
                          context: { ...prev.context, aircraft_type: e.target.value }
                        }))}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
                      >
                        <option value="A350">Airbus A350-1000</option>
                        <option value="B787">Boeing 787-9</option>
                        <option value="A330">Airbus A330-300</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Passenger Count</label>
                      <input
                        type="number"
                        value={customScenario.context.passenger_count}
                        onChange={(e) => setCustomScenario(prev => ({
                          ...prev,
                          context: { ...prev.context, passenger_count: parseInt(e.target.value) }
                        }))}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Current Fuel (kg)</label>
                      <input
                        type="number"
                        value={customScenario.context.current_fuel_kg}
                        onChange={(e) => setCustomScenario(prev => ({
                          ...prev,
                          context: { ...prev.context, current_fuel_kg: parseInt(e.target.value) }
                        }))}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Max Budget (USD)</label>
                      <input
                        type="number"
                        value={customScenario.context.max_cost_budget}
                        onChange={(e) => setCustomScenario(prev => ({
                          ...prev,
                          context: { ...prev.context, max_cost_budget: parseInt(e.target.value) }
                        }))}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>

                  <button
                    onClick={analyzeScenario}
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Activity className="w-4 h-4 animate-spin" />
                        Analyzing Scenario...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4" />
                        Analyze Decision Scenario
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Options Preview */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Decision Options ({customScenario.options.length})</h3>
                <div className="space-y-3">
                  {customScenario.options.map((option, index) => (
                    <div key={option.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="font-medium">{option.title}</div>
                      <div className="text-sm text-gray-400">{option.description}</div>
                      <div className="mt-2 flex gap-4 text-xs">
                        <span>Cost: ${option.estimated_cost_usd?.toLocaleString()}</span>
                        <span>Delay: {option.estimated_delay_mins}min</span>
                        <span>Fuel: {calculateFuelPercentage('A350-1000', 65)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Analysis Results */}
            <div className="space-y-6">
              {analysis && (
                <>
                  {/* Recommendations */}
                  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-yellow-400" />
                      ML Recommendations
                    </h3>

                    <div className="space-y-4">
                      {analysis.recommendations.map((rec, index) => (
                        <div key={index} className={`rounded-lg p-4 border ${
                          rec.type === 'PRIMARY' ? 'bg-green-900/30 border-green-700' :
                          rec.type === 'ALTERNATIVE' ? 'bg-blue-900/30 border-blue-700' :
                          'bg-orange-900/30 border-orange-700'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium flex items-center gap-2">
                              {rec.type === 'PRIMARY' && <CheckCircle className="w-4 h-4 text-green-400" />}
                              {rec.type === 'ALTERNATIVE' && <Target className="w-4 h-4 text-blue-400" />}
                              {rec.type === 'RISK_MITIGATION' && <AlertTriangle className="w-4 h-4 text-orange-400" />}
                              {rec.type} - {rec.option_id}
                            </div>
                            <div className="text-sm">
                              Confidence: {(rec.confidence * 100).toFixed(1)}%
                            </div>
                          </div>
                          <div className="text-sm text-gray-300 mb-2">{rec.rationale}</div>
                          <div className="text-sm font-medium text-white mb-1">Action:</div>
                          <div className="text-sm text-gray-300 mb-2">{rec.action}</div>
                          <div className="text-sm font-medium text-white mb-1">Expected Outcome:</div>
                          <div className="text-sm text-gray-300">{rec.expected_outcome}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Option Analysis */}
                  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-blue-400" />
                      Option Analysis
                    </h3>

                    <div className="space-y-3">
                      {analysis.options_analysis.map((option, index) => (
                        <div key={option.option_id} className={`rounded-lg p-4 border ${getRiskCardClass(option.risk_level)}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium">
                              #{option.recommendation_rank} - {option.option_id}
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-sm">
                                Score: {option.total_score}
                              </div>
                              <div className={`text-sm font-medium ${getRiskColor(option.risk_level)}`}>
                                {option.risk_level}
                              </div>
                            </div>
                          </div>
                          
                          {option.factor_scores && (
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {Object.entries(option.factor_scores).map(([factor, score]) => (
                                <div key={factor} className="flex justify-between">
                                  <span className="text-gray-400 capitalize">{factor.replace('_', ' ')}:</span>
                                  <span>{score.toFixed(3)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {!analysis && (
                <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
                  <Brain className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-400 mb-2">Ready for Analysis</h3>
                  <p className="text-gray-500">Configure your scenario and click "Analyze Decision Scenario" to get ML-powered recommendations</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'insights' && insights && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Key Metrics */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Decision Metrics
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="text-2xl font-bold text-green-400">{insights.total_decisions}</div>
                  <div className="text-sm text-gray-400">Total Decisions Made</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-400">{(insights.average_confidence * 100).toFixed(1)}%</div>
                  <div className="text-sm text-gray-400">Average Confidence</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">{(insights.performance_metrics.decision_accuracy * 100).toFixed(1)}%</div>
                  <div className="text-sm text-gray-400">Decision Accuracy</div>
                </div>
              </div>
            </div>

            {/* Scenario Distribution */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-400" />
                Scenario Types
              </h3>
              <div className="space-y-3">
                {Object.entries(insights.scenario_types).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{type.replace('_', ' ')}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Distribution */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                Risk Distribution
              </h3>
              <div className="space-y-3">
                {Object.entries(insights.risk_distribution).map(([risk, count]) => (
                  <div key={risk} className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${getRiskColor(risk)}`}>{risk}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 md:col-span-2">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                Performance Impact
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-xl font-bold text-green-400">
                    {formatNumber(insights.performance_metrics.cost_savings_achieved, '$', '')}
                  </div>
                  <div className="text-sm text-gray-400">Cost Savings Achieved</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-blue-400">
                    {formatNumber(insights.performance_metrics.time_savings_minutes, '', ' min')}
                  </div>
                  <div className="text-sm text-gray-400">Time Savings</div>
                </div>
              </div>
            </div>

            {/* Implementation Success */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Success Rate
              </h3>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">
                  {(insights.performance_metrics.implementation_success_rate * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-400">Implementation Success Rate</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'scenarios' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Scenario Templates */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-400" />
                Scenario Templates
              </h3>
              <div className="space-y-4">
                {[
                  {
                    type: 'diversion',
                    title: 'Aircraft Diversion',
                    description: 'Emergency diversion decision analysis with multiple airport options',
                    factors: ['Weather', 'Fuel', 'Airport Suitability', 'Passenger Impact', 'Cost']
                  },
                  {
                    type: 'delay_management',
                    title: 'Delay Management',
                    description: 'Optimize passenger connections and aircraft rotation during delays',
                    factors: ['Connections', 'Aircraft Rotation', 'Crew Legality', 'Cost Impact']
                  },
                  {
                    type: 'route_optimization',
                    title: 'Route Optimization',
                    description: 'Select optimal flight routing considering weather and efficiency',
                    factors: ['Weather Avoidance', 'Fuel Efficiency', 'Time Savings', 'Traffic']
                  },
                  {
                    type: 'resource_allocation',
                    title: 'Resource Allocation',
                    description: 'Optimize allocation of aircraft, crew, and gates',
                    factors: ['Aircraft Availability', 'Crew Availability', 'Gate Assignment', 'Maintenance']
                  }
                ].map((scenario) => (
                  <div key={scenario.type} className="bg-gray-700 rounded-lg p-4">
                    <div className="font-medium mb-2">{scenario.title}</div>
                    <div className="text-sm text-gray-400 mb-3">{scenario.description}</div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {scenario.factors.map((factor) => (
                        <span key={factor} className="px-2 py-1 bg-gray-600 rounded text-xs">
                          {factor}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedScenario(scenario.type);
                        setActiveTab('analyzer');
                      }}
                      className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1"
                    >
                      Use Template <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Decision Tools */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Quick Decision Tools
              </h3>
              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    Emergency Decision Support
                  </div>
                  <div className="text-sm text-gray-400 mb-3">
                    Rapid decision support for critical operational scenarios
                  </div>
                  <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm">
                    Emergency Mode
                  </button>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="font-medium mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    Time-Critical Decisions
                  </div>
                  <div className="text-sm text-gray-400 mb-3">
                    Accelerated analysis for time-sensitive situations
                  </div>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm">
                    Quick Analysis
                  </button>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="font-medium mb-2 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-400" />
                    ML Model Training
                  </div>
                  <div className="text-sm text-gray-400 mb-3">
                    Retrain models with latest operational data
                  </div>
                  <button className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm">
                    Update Models
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntelligentDecisionDashboard;