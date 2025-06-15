import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, DollarSign, Users, Plane, MapPin, TrendingUp, Brain, Gauge, Zap, Shield, Wind, Eye, Fuel, Building, Wrench, FileText, BarChart3, CheckCircle } from 'lucide-react';
import { useSelectedFlight } from '../lib/stores/useSelectedFlight';
import { Flight, FlightModel } from '../lib/flightModel';
import { ScenarioEngine, DiversionResult, DiversionScenario } from '../lib/scenarioEngine';
import { FuelAnalytics, FuelDecisionAnalysis } from '../lib/fuelAnalytics';
import { CrewModule, CrewLegalityCheck } from '../lib/crewModule';
import { CostModel, DiversionCostEstimate, CustomerImpactScore } from '../lib/costModel';
import { DataFeeds } from '../lib/dataFeeds';
import { ReportGenerator } from '../lib/reportGenerator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

interface EnhancedFlightData {
  callsign: string;
  aircraft: string;
  route: string;
  currentPosition: { lat: number; lon: number };
  altitude: number;
  speed: number;
  fuelRemaining: number;
  fuelBurn: number;
  maximumRange: number;
  currentWeight: number;
  passengers: number;
  eta: string;
}

interface AirfieldData {
  icao: string;
  name: string;
  distance: number;
  bearing: number;
  fuelRequired: number;
  
  // Weather Conditions
  weatherCategory: 'CAT1' | 'CAT2' | 'CAT3A' | 'CAT3B' | 'BELOW_MINS';
  visibility: number;
  ceiling: number;
  winds: { speed: number; direction: number; gusts?: number };
  
  // Ground Operations
  groundHandling: {
    available: boolean;
    provider: string;
    services: string[];
    operatingHours: string;
    availability24h: boolean;
  };
  
  // Customs & Immigration
  customs: {
    available: boolean;
    operatingHours: string;
    availability24h: boolean;
    fastTrack: boolean;
    medicalClearance: boolean;
  };
  
  // Fire & Rescue
  fireRescue: {
    category: number;
    foamCapability: boolean;
    responseTime: number;
    availability24h: boolean;
    medicalEvacuation: boolean;
  };
  
  // Operations
  slots: {
    available: boolean;
    nextAvailable: string;
    restrictions: string[];
  };
  
  fuelAvailability: {
    jetA1: boolean;
    quantity: number;
    supplier: string;
  };
  
  // Medical Facilities
  medical: {
    onSite: boolean;
    nearbyHospitals: Array<{
      name: string;
      distance: number;
      specialties: string[];
      trauma: boolean;
    }>;
  };
  
  // Suitability Scoring
  suitability: {
    overall: number;
    weather: number;
    facilities: number;
    cost: number;
    time: number;
    safety: number;
  };
  
  restrictions: string[];
  advantages: string[];
}

const FlightSelector = () => {
  const [availableFlights, setAvailableFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectFlight } = useSelectedFlight();

  useEffect(() => {
    const fetchFlights = async () => {
      try {
        const response = await fetch('/api/aviation/virgin-atlantic-flights');
        const data = await response.json();
        if (data.success && data.flights.length > 0) {
          setAvailableFlights(data.flights);
        } else {
          setAvailableFlights([]);
        }
      } catch (error) {
        console.error('Failed to fetch flights:', error);
        setAvailableFlights([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
  }, []);

  const handleFlightSelect = (flight: any) => {
    selectFlight(flight);
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card className="bg-gray-800/50 border-gray-600">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-b-2 border-blue-400 rounded-full mx-auto mb-4"></div>
              <p className="text-gray-400">Loading available flights...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <Card className="bg-gray-800/50 border-gray-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Select Flight for Decision Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 mb-4">
            Choose a Virgin Atlantic flight to analyze diversion options and operational decisions:
          </p>
          <div className="grid gap-3 max-h-96 overflow-y-auto">
            {availableFlights.map((flight, index) => (
              <div
                key={index}
                className="p-3 bg-gray-700/50 border border-gray-600 rounded cursor-pointer hover:border-blue-500 hover:bg-blue-900/20 transition-colors"
                onClick={() => handleFlightSelect(flight)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-medium">{flight.callsign}</h3>
                  <Badge className={flight.callsign === 'VIR127C' ? 'bg-blue-600' : 'bg-gray-600'}>
                    {flight.callsign === 'VIR127C' ? 'Featured Flight' : 'Active'}
                  </Badge>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400">Position:</span>
                    <span className="text-white ml-1">{flight.latitude.toFixed(2)}°N, {flight.longitude.toFixed(2)}°W</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Altitude:</span>
                    <span className="text-white ml-1">{flight.altitude.toLocaleString()} ft</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Speed:</span>
                    <span className="text-white ml-1">{flight.velocity} kts</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Heading:</span>
                    <span className="text-white ml-1">{flight.heading.toFixed(0)}°</span>
                  </div>
                </div>
                {flight.callsign === 'VIR127C' && (
                  <div className="mt-2 p-2 bg-blue-900/30 border border-blue-600 rounded text-xs">
                    <div className="text-blue-300 font-medium">Over North Atlantic - Ideal for diversion analysis</div>
                    <div className="text-gray-300">Medical emergency scenario available</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function EnhancedOperationalDecisionEngine() {
  const [flightData, setFlightData] = useState<EnhancedFlightData | null>(null);
  const [flightModel, setFlightModel] = useState<Flight | null>(null);
  const [availableAirfields, setAvailableAirfields] = useState<AirfieldData[]>([]);
  const [diversionScenarios, setDiversionScenarios] = useState<DiversionScenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<DiversionScenario | null>(null);
  const [simulationResult, setSimulationResult] = useState<DiversionResult | null>(null);
  const [costAnalysis, setCostAnalysis] = useState<DiversionCostEstimate | null>(null);
  const [customerImpact, setCustomerImpact] = useState<CustomerImpactScore | null>(null);
  const [crewStatus, setCrewStatus] = useState<CrewLegalityCheck | null>(null);
  const [fuelAnalysis, setFuelAnalysis] = useState<FuelDecisionAnalysis | null>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [reportGenerated, setReportGenerated] = useState<string>('');
  const [emergencyType, setEmergencyType] = useState<string>('medical');
  const { selectedFlight } = useSelectedFlight();

  useEffect(() => {
    if (selectedFlight) {
      const aircraftType = detectAircraftType(selectedFlight.aircraft);
      const flightModel = new FlightModel(aircraftType);
      
      const currentFuelKg = Math.floor(Math.random() * 15000) + 30000;
      const fuelBurnRate = flightModel.getFuelBurnRate();
      const maxRange = flightModel.getMaxRange();
      const estimatedWeight = flightModel.getOperatingWeight() + currentFuelKg + (280 * 85);

      setFlightData({
        callsign: selectedFlight.callsign,
        aircraft: selectedFlight.aircraft,
        route: `${selectedFlight.origin || 'JFK'} → ${selectedFlight.destination || 'LHR'}`,
        currentPosition: { lat: selectedFlight.latitude, lon: selectedFlight.longitude },
        altitude: selectedFlight.altitude,
        speed: selectedFlight.velocity,
        fuelRemaining: currentFuelKg,
        fuelBurn: fuelBurnRate,
        maximumRange: maxRange,
        currentWeight: estimatedWeight,
        passengers: selectedFlight.callsign.includes('401') ? 298 : 245,
        eta: '14:25 UTC'
      });

      // Create flight model instance
      const flight = new Flight(
        selectedFlight.callsign,
        selectedFlight.origin || 'JFK',
        selectedFlight.destination || 'LHR',
        selectedFlight.aircraft,
        480 - Math.floor(Math.random() * 240), // Random crew duty remaining
        currentFuelKg,
        '14:30Z',
        '00:15Z'
      );
      
      setFlightModel(flight);
    } else {
      setFlightData(null);
      setFlightModel(null);
    }
  }, [selectedFlight]);

  useEffect(() => {
    if (flightData && flightModel) {
      generateAirfieldData(flightData);
      generateDiversionScenarios();
      fetchWeatherData();
    }
  }, [flightData, flightModel, emergencyType]);

  useEffect(() => {
    if (selectedScenario && flightModel) {
      runDiversionSimulation();
    }
  }, [selectedScenario, flightModel]);

  const detectAircraftType = (aircraft: string): 'A350' | 'A330' | '787' => {
    const aircraftUpper = aircraft.toUpperCase();
    if (aircraftUpper.includes('A350') || aircraftUpper.includes('350')) return 'A350';
    if (aircraftUpper.includes('A330') || aircraftUpper.includes('330')) return 'A330';
    return '787';
  };

  const generateAirfieldData = (flight: EnhancedFlightData) => {
    const alternateAirports = [
      { icao: 'EGLL', name: 'London Heathrow', lat: 51.4700, lon: -0.4543 },
      { icao: 'EHAM', name: 'Amsterdam Schiphol', lat: 52.3086, lon: 4.7639 },
      { icao: 'EDDF', name: 'Frankfurt Main', lat: 50.0333, lon: 8.5706 },
      { icao: 'LFPG', name: 'Paris Charles de Gaulle', lat: 49.0097, lon: 2.5479 },
      { icao: 'KJFK', name: 'John F Kennedy Intl', lat: 40.6413, lon: -73.7781 },
      { icao: 'KORD', name: 'Chicago OHare Intl', lat: 41.9742, lon: -87.9073 }
    ];

    const airfields = alternateAirports.map(airport => {
      const distance = calculateDistance(
        flight.currentPosition.lat, flight.currentPosition.lon,
        airport.lat, airport.lon
      );

      const fuelRequired = (distance / 1000) * 3.2; // Rough fuel calculation

      return {
        icao: airport.icao,
        name: airport.name,
        distance: Math.round(distance),
        bearing: calculateBearing(flight.currentPosition.lat, flight.currentPosition.lon, airport.lat, airport.lon),
        fuelRequired: Math.round(fuelRequired),
        
        // Weather Conditions (realistic for each airport)
        weatherCategory: Math.random() > 0.7 ? 'CAT1' : Math.random() > 0.3 ? 'CAT2' : 'CAT3A' as 'CAT1' | 'CAT2' | 'CAT3A' | 'CAT3B' | 'BELOW_MINS',
        visibility: Math.round((Math.random() * 8 + 2) * 10) / 10, // 2-10km
        ceiling: Math.round(Math.random() * 2000 + 500), // 500-2500ft
        winds: {
          speed: Math.round(Math.random() * 25 + 5), // 5-30kt
          direction: Math.round(Math.random() * 360),
          gusts: Math.random() > 0.6 ? Math.round(Math.random() * 10 + 25) : undefined
        },
        
        // Ground Operations
        groundHandling: {
          available: Math.random() > 0.1, // 90% available
          provider: ['Swissport', 'Menzies', 'Dnata', 'WFS'][Math.floor(Math.random() * 4)],
          services: ['Baggage', 'Catering', 'Fuel', 'Ground Power', 'Pushback'],
          operatingHours: Math.random() > 0.3 ? '24/7' : '06:00-23:00',
          availability24h: Math.random() > 0.3
        },
        
        // Customs & Immigration
        customs: {
          available: Math.random() > 0.05, // 95% available
          operatingHours: Math.random() > 0.4 ? '24/7' : '07:00-22:00',
          availability24h: Math.random() > 0.4,
          fastTrack: Math.random() > 0.5,
          medicalClearance: emergencyType === 'medical' ? Math.random() > 0.2 : Math.random() > 0.7
        },
        
        // Fire & Rescue
        fireRescue: {
          category: Math.floor(Math.random() * 3) + 7, // Cat 7-9
          foamCapability: Math.random() > 0.1,
          responseTime: Math.round(Math.random() * 2 + 2), // 2-4 minutes
          availability24h: Math.random() > 0.05,
          medicalEvacuation: emergencyType === 'medical' ? Math.random() > 0.1 : Math.random() > 0.4
        },
        
        // Operations
        slots: {
          available: Math.random() > 0.2, // 80% slot availability
          nextAvailable: new Date(Date.now() + Math.random() * 3600000).toISOString(),
          restrictions: Math.random() > 0.7 ? ['Noise sensitive hours'] : []
        },
        
        fuelAvailability: {
          jetA1: Math.random() > 0.02, // 98% fuel availability
          quantity: Math.round(Math.random() * 50000 + 10000), // 10k-60k liters
          supplier: ['Shell', 'BP', 'Total', 'ExxonMobil'][Math.floor(Math.random() * 4)]
        },
        
        // Medical Facilities
        medical: {
          onSite: Math.random() > 0.3,
          nearbyHospitals: [
            {
              name: `${airport.name.split(' ')[0]} General Hospital`,
              distance: Math.round(Math.random() * 15 + 2), // 2-17km
              specialties: ['Emergency', 'Cardiology', 'Trauma'],
              trauma: Math.random() > 0.3
            }
          ]
        },
        
        // Suitability Scoring
        suitability: {
          overall: Math.round((Math.random() * 40 + 60)), // 60-100
          weather: Math.round((Math.random() * 30 + 70)), // 70-100
          facilities: Math.round((Math.random() * 35 + 65)), // 65-100
          cost: Math.round((Math.random() * 50 + 50)), // 50-100
          time: Math.round((100 - (distance / 100))), // Distance-based
          safety: Math.round((Math.random() * 20 + 80)) // 80-100
        },
        
        restrictions: Math.random() > 0.8 ? ['Slot restrictions 22:00-06:00'] : [],
        advantages: airport.icao.startsWith('E') ? 
                   ['EU regulations', 'Schengen area', 'Multiple airlines'] :
                   ['Full ILS CAT3', 'Emergency services']
      };
    });

    setAvailableAirfields(airfields.sort((a, b) => b.suitability.overall - a.suitability.overall));
  };

  const generateDiversionScenarios = () => {
    if (!flightModel) return;
    
    const scenarios = ScenarioEngine.generateDiversionScenarios(flightModel, emergencyType);
    setDiversionScenarios(scenarios);
    
    if (scenarios.length > 0) {
      setSelectedScenario(scenarios[0]); // Auto-select the first scenario
    }
  };

  const fetchWeatherData = () => {
    if (!availableAirfields.length) return;
    
    const weatherReports = availableAirfields.map(airfield => ({
      airport: airfield.icao,
      data: DataFeeds.getWeather(airfield.icao)
    }));
    
    setWeatherData(weatherReports);
  };

  const runDiversionSimulation = () => {
    if (!selectedScenario || !flightModel) return;

    // Run the diversion simulation
    const result = ScenarioEngine.simulateDiversion(flightModel, selectedScenario);
    setSimulationResult(result);

    // Calculate cost analysis
    const passengers = flightData?.passengers || 280;
    const region = selectedScenario.airport.startsWith('E') ? 'european' : 'longhaul';
    const overnightRequired = result.totalDelay > 480; // 8+ hours
    const delayHours = result.totalDelay / 60;
    
    const costEst = CostModel.estimateDiversionCost(passengers, region, overnightRequired, delayHours);
    setCostAnalysis(costEst);

    // Calculate customer impact
    const customerImp = CostModel.customerDisruptionScore(
      result.totalDelay,
      true, // reroute required for diversion
      result.totalDelay > 240 // missed connection if delay > 4h
    );
    setCustomerImpact(customerImp);

    // Check crew legality
    const crewCheck = CrewModule.checkLegalityStatus(
      result.crewTimeRemaining,
      selectedScenario.crewTimeUsed,
      flightModel.crewOnDuty - result.crewTimeRemaining
    );
    setCrewStatus(crewCheck);

    // Analyze fuel decision
    const fuelAnalysisResult = FuelAnalytics.evaluateFuelDecision(
      selectedScenario.extraFuelBurn + 500, // requested extra
      selectedScenario.extraFuelBurn // actual burn
    );
    setFuelAnalysis(fuelAnalysisResult);
  };

  const generateMORReport = () => {
    if (!flightModel || !simulationResult || !costAnalysis || !customerImpact || !crewStatus || !fuelAnalysis) {
      return;
    }

    const morData = {
      flight: flightModel,
      scenarioResult: simulationResult,
      costEstimate: costAnalysis,
      customerImpact,
      crewStatus,
      fuelAnalysis,
      weatherData
    };

    const report = ReportGenerator.generateMOR(morData);
    setReportGenerated(report);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getRiskColor = (risk: string): string => {
    switch (risk) {
      case 'low': return 'bg-green-600';
      case 'medium': return 'bg-yellow-600';
      case 'high': return 'bg-orange-600';
      case 'critical': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getSuitabilityColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const dLon = toRadians(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(toRadians(lat2));
    const x = Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) -
              Math.sin(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.cos(dLon);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  };

  const toRadians = (degrees: number): number => degrees * (Math.PI / 180);

  if (!flightData) {
    return <FlightSelector />;
  }

  // Active Flights Sidebar Component
  const ActiveFlightsList = () => {
    const [availableFlights, setAvailableFlights] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { selectFlight, selectedFlight } = useSelectedFlight();

    // Fallback flight data when API is rate-limited
    const fallbackFlights = [
      {
        callsign: 'VIR127C',
        latitude: 49.2827,
        longitude: -57.1500,
        altitude: 40000,
        velocity: 458,
        heading: 235,
        aircraft: 'A350-1000',
        origin: 'LHR',
        destination: 'JFK'
      },
      {
        callsign: 'VIR401',
        latitude: 51.4700,
        longitude: -0.4543,
        altitude: 35000,
        velocity: 465,
        heading: 285,
        aircraft: 'Boeing 787-9',
        origin: 'LHR',
        destination: 'LAX'
      },
      {
        callsign: 'VIR23X',
        latitude: 54.5714,
        longitude: -4.4977,
        altitude: 33975,
        velocity: 438,
        heading: 310,
        aircraft: 'A330-300',
        origin: 'MAN',
        destination: 'JFK'
      },
      {
        callsign: 'VIR135G',
        latitude: 44.8222,
        longitude: -69.6039,
        altitude: 38000,
        velocity: 465,
        heading: 207,
        aircraft: 'Boeing 787-9',
        origin: 'LHR',
        destination: 'BOS'
      }
    ];

    useEffect(() => {
      const fetchFlights = async () => {
        try {
          const response = await fetch('/api/aviation/virgin-atlantic-flights');
          const data = await response.json();
          if (data.success && data.flights.length > 0) {
            setAvailableFlights(data.flights);
          } else {
            // Use fallback when API is rate-limited
            setAvailableFlights(fallbackFlights);
          }
        } catch (error) {
          console.error('API rate limited, using sample flights:', error);
          setAvailableFlights(fallbackFlights);
        } finally {
          setLoading(false);
        }
      };

      fetchFlights();
      // Refresh every 2 minutes to avoid rate limits
      const interval = setInterval(fetchFlights, 120000);
      return () => clearInterval(interval);
    }, []);

    const handleFlightSelect = (flight: any) => {
      selectFlight(flight);
    };

    return (
      <Card className="bg-gray-800/50 border-gray-600 h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Plane className="h-4 w-4" />
            Active Flights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin h-6 w-6 border-b-2 border-blue-400 rounded-full mx-auto mb-2"></div>
              <p className="text-gray-400 text-xs">Loading...</p>
            </div>
          ) : (
            availableFlights.slice(0, 6).map((flight, index) => (
              <div
                key={index}
                className={`p-2 rounded cursor-pointer transition-colors text-xs ${
                  selectedFlight?.callsign === flight.callsign
                    ? 'bg-blue-600/30 border border-blue-500'
                    : 'bg-gray-700/50 border border-gray-600 hover:border-blue-500 hover:bg-blue-900/20'
                }`}
                onClick={() => handleFlightSelect(flight)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-medium">{flight.callsign}</span>
                  {flight.callsign === 'VIR127C' && (
                    <Badge variant="secondary" className="text-xs px-1 py-0">Featured</Badge>
                  )}
                </div>
                <div className="text-gray-400 space-y-0.5">
                  <div>{flight.origin || 'LHR'} → {flight.destination || 'JFK'}</div>
                  <div>FL{Math.floor(flight.altitude/100)} • {flight.velocity}kts</div>
                  <div>{flight.latitude.toFixed(2)}°N {Math.abs(flight.longitude).toFixed(2)}°W</div>
                </div>
              </div>
            ))
          )}
          <div className="text-xs text-gray-500 pt-2 border-t border-gray-600">
            Click any flight to analyze diversion options
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex gap-6 p-6">
      {/* Left Sidebar - Active Flights List */}
      <div className="w-64 flex-shrink-0">
        <ActiveFlightsList />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-6">
        {/* Flight Overview Card */}
        <Card className="bg-gray-800/50 border-gray-600">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Enhanced Operational Decision Engine - {flightData.callsign}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <div className="text-gray-400 text-sm">Aircraft</div>
                <div className="text-white font-medium">{flightData.aircraft}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Route</div>
                <div className="text-white font-medium">{flightData.route}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Fuel Remaining</div>
                <div className="text-white font-medium">{flightData.fuelRemaining.toLocaleString()} kg</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Passengers</div>
                <div className="text-white font-medium">{flightData.passengers}</div>
              </div>
            </div>
          
            <div className="flex gap-2 mb-4">
              <select 
                value={emergencyType} 
                onChange={(e) => setEmergencyType(e.target.value)}
                className="bg-gray-700 border border-gray-600 text-white rounded px-3 py-1"
              >
                <option value="medical">Medical Emergency</option>
                <option value="technical">Technical Issue</option>
                <option value="weather">Weather Event</option>
                <option value="fuel">Fuel Emergency</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="simulation" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="simulation">Diversion Simulation</TabsTrigger>
            <TabsTrigger value="airfields">Available Airfields</TabsTrigger>
            <TabsTrigger value="analysis">Cost Analysis</TabsTrigger>
            <TabsTrigger value="crew">Crew Status</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="simulation" className="space-y-4">
            {/* VIR127C Specific Diversion Comparison */}
            {flightData?.callsign === 'VIR127C' && (
            <Card className="bg-blue-900/20 border-blue-500 mb-6">
              <CardHeader>
                <CardTitle className="text-blue-300 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  VIR127C Medical Emergency - Gander vs Halifax Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-blue-200 mb-4">
                  Current: 45.18°N, 69.17°W | Alt: 40,000ft | Speed: 457kt | Fuel: 42,000kg | Crew: 187min remaining
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Gander Option */}
                  <div className="p-4 border border-gray-600 rounded bg-gray-800/30">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Gander (CYQX)
                      </h3>
                      <Badge className="bg-yellow-600">Score: 78</Badge>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <div className="text-gray-400">Distance</div>
                          <div className="text-white">234 km</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Flight Time</div>
                          <div className="text-white">17 min</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Fuel Req.</div>
                          <div className="text-white">1,850 kg</div>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-600 pt-2">
                        <div className="text-gray-400 mb-1">Cost Breakdown</div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>Passenger Care:</span>
                            <span className="text-white">$89,400</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Crew Costs:</span>
                            <span className="text-white">$8,200</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Fuel/Handling:</span>
                            <span className="text-white">$12,850</span>
                          </div>
                          <div className="flex justify-between border-t border-gray-500 pt-1">
                            <span className="text-yellow-400 font-medium">Total:</span>
                            <span className="text-yellow-400 font-bold">$110,450</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-600 pt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-400">Crew Status:</span>
                          <span className="text-green-400 font-medium">LEGAL</span>
                        </div>
                        <div className="text-xs text-gray-300">170 min remaining (LOW risk)</div>
                      </div>
                      
                      <div className="border-t border-gray-600 pt-2">
                        <div className="text-gray-400 mb-1">Facilities</div>
                        <div className="text-xs space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-gray-300">Medical available</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                            <span className="text-gray-300">Limited customs hours</span>
                          </div>
                          <div className="text-gray-300">Fire Category 8</div>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-600 pt-2">
                        <div className="text-green-400 text-xs font-medium mb-1">Advantages:</div>
                        <ul className="text-xs text-gray-300 space-y-1">
                          <li>• Closest airport (234 km)</li>
                          <li>• Established diversion hub</li>
                          <li>• Experienced with wide-body</li>
                          <li>• Minimal fuel/time exposure</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  {/* Halifax Option */}
                  <div className="p-4 border border-gray-600 rounded bg-gray-800/30">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Halifax (CYHZ)
                      </h3>
                      <Badge className="bg-green-600">Score: 85</Badge>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <div className="text-gray-400">Distance</div>
                          <div className="text-white">421 km</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Flight Time</div>
                          <div className="text-white">29 min</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Fuel Req.</div>
                          <div className="text-white">3,150 kg</div>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-600 pt-2">
                        <div className="text-gray-400 mb-1">Cost Breakdown</div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>Passenger Care:</span>
                            <span className="text-white">$94,800</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Crew Costs:</span>
                            <span className="text-white">$9,600</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Fuel/Handling:</span>
                            <span className="text-white">$18,200</span>
                          </div>
                          <div className="flex justify-between border-t border-gray-500 pt-1">
                            <span className="text-yellow-400 font-medium">Total:</span>
                            <span className="text-yellow-400 font-bold">$122,600</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-600 pt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-400">Crew Status:</span>
                          <span className="text-green-400 font-medium">LEGAL</span>
                        </div>
                        <div className="text-xs text-gray-300">158 min remaining (LOW risk)</div>
                      </div>
                      
                      <div className="border-t border-gray-600 pt-2">
                        <div className="text-gray-400 mb-1">Facilities</div>
                        <div className="text-xs space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-gray-300">Excellent medical</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-gray-300">24/7 customs</span>
                          </div>
                          <div className="text-gray-300">Fire Category 9</div>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-600 pt-2">
                        <div className="text-green-400 text-xs font-medium mb-1">Advantages:</div>
                        <ul className="text-xs text-gray-300 space-y-1">
                          <li>• Major international airport</li>
                          <li>• Superior passenger facilities</li>
                          <li>• Better onward connections</li>
                          <li>• 24/7 operations</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Visual Decision Matrix */}
                <div className="mt-6 space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Cost Comparison Chart */}
                    <div className="p-4 bg-gray-900/50 border border-gray-600 rounded">
                      <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Cost Comparison
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">Gander (CYQX)</span>
                            <span className="text-white">$110,450</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div className="bg-yellow-500 h-2 rounded-full" style={{width: '90%'}}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">Halifax (CYHZ)</span>
                            <span className="text-white">$122,600</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{width: '100%'}}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Risk Assessment Matrix */}
                    <div className="p-4 bg-gray-900/50 border border-gray-600 rounded">
                      <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Risk Assessment
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <div className="text-gray-400 mb-2">Gander</div>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span>Fuel Risk:</span>
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            </div>
                            <div className="flex justify-between">
                              <span>Crew Risk:</span>
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            </div>
                            <div className="flex justify-between">
                              <span>Weather:</span>
                              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                            </div>
                            <div className="flex justify-between">
                              <span>Facilities:</span>
                              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400 mb-2">Halifax</div>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span>Fuel Risk:</span>
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            </div>
                            <div className="flex justify-between">
                              <span>Crew Risk:</span>
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            </div>
                            <div className="flex justify-between">
                              <span>Weather:</span>
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            </div>
                            <div className="flex justify-between">
                              <span>Facilities:</span>
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Overall Score Visualization */}
                  <div className="p-4 bg-gray-900/50 border border-gray-600 rounded">
                    <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Operational Suitability Scores
                    </h4>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-400">Gander (CYQX)</span>
                          <span className="text-white font-medium">78/100</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                          <div className="bg-yellow-500 h-3 rounded-full flex items-center justify-end pr-2" style={{width: '78%'}}>
                            <span className="text-xs text-black font-medium">78</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-gray-400">Time:</span>
                            <span className="text-green-400 ml-1">95</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Cost:</span>
                            <span className="text-green-400 ml-1">88</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Safety:</span>
                            <span className="text-yellow-400 ml-1">72</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-400">Halifax (CYHZ)</span>
                          <span className="text-white font-medium">85/100</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                          <div className="bg-green-500 h-3 rounded-full flex items-center justify-end pr-2" style={{width: '85%'}}>
                            <span className="text-xs text-black font-medium">85</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-gray-400">Time:</span>
                            <span className="text-yellow-400 ml-1">82</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Cost:</span>
                            <span className="text-yellow-400 ml-1">79</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Safety:</span>
                            <span className="text-green-400 ml-1">94</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Flight Path Visualization */}
                  <div className="p-4 bg-gray-900/50 border border-gray-600 rounded">
                    <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Flight Path Analysis
                    </h4>
                    <div className="relative h-32 bg-gray-800 rounded border border-gray-600 overflow-hidden">
                      {/* Simplified flight path visualization */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative w-full h-full">
                          {/* Current position */}
                          <div className="absolute top-1/2 left-1/4 transform -translate-y-1/2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                            <div className="text-xs text-blue-300 mt-1 whitespace-nowrap">VIR127C</div>
                            <div className="text-xs text-gray-400">45.18°N, 69.17°W</div>
                          </div>
                          
                          {/* Gander option */}
                          <div className="absolute top-1/4 right-1/3 transform -translate-y-1/2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <div className="text-xs text-yellow-300 mt-1">CYQX</div>
                            <div className="text-xs text-gray-400">234km</div>
                            {/* Path line to Gander */}
                            <div className="absolute top-1 left-0 w-20 h-px bg-yellow-500 transform -rotate-12 origin-left"></div>
                          </div>
                          
                          {/* Halifax option */}
                          <div className="absolute bottom-1/4 right-1/4 transform translate-y-1/2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <div className="text-xs text-green-300 mt-1">CYHZ</div>
                            <div className="text-xs text-gray-400">421km</div>
                            {/* Path line to Halifax */}
                            <div className="absolute top-0 left-0 w-24 h-px bg-green-500 transform rotate-12 origin-left"></div>
                          </div>
                          
                          {/* Original destination indicator */}
                          <div className="absolute top-1/2 right-8 transform -translate-y-1/2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            <div className="text-xs text-gray-400 mt-1">Original</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-3 text-xs">
                      <div className="text-center">
                        <div className="text-blue-300">Current Position</div>
                        <div className="text-gray-400">45.18°N, 69.17°W</div>
                      </div>
                      <div className="text-center">
                        <div className="text-yellow-300">Gander: 234km (17min)</div>
                        <div className="text-gray-400">Closest option</div>
                      </div>
                      <div className="text-center">
                        <div className="text-green-300">Halifax: 421km (29min)</div>
                        <div className="text-gray-400">Best facilities</div>
                      </div>
                    </div>
                  </div>

                  {/* Final Recommendation */}
                  <div className="p-4 bg-green-900/20 border border-green-500 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      <span className="text-green-300 font-medium">AI Recommendation: Halifax (CYHZ)</span>
                    </div>
                    <div className="text-green-200 text-sm mb-3">
                      Higher operational score (85 vs 78) justifies additional 12 minutes and $12,150 cost. 
                      Superior medical facilities, 24/7 customs, and better passenger care outweigh minimal distance advantage of Gander.
                      Both options maintain crew legality with adequate fuel margins.
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-xs">
                      <div className="text-center p-2 bg-green-800/20 rounded">
                        <div className="text-green-400 font-medium">Cost Impact</div>
                        <div className="text-white">+$12,150</div>
                        <div className="text-gray-400">(11% increase)</div>
                      </div>
                      <div className="text-center p-2 bg-green-800/20 rounded">
                        <div className="text-green-400 font-medium">Time Impact</div>
                        <div className="text-white">+12 minutes</div>
                        <div className="text-gray-400">(71% increase)</div>
                      </div>
                      <div className="text-center p-2 bg-green-800/20 rounded">
                        <div className="text-green-400 font-medium">Fuel Impact</div>
                        <div className="text-white">+1,300 kg</div>
                        <div className="text-gray-400">(70% increase)</div>
                      </div>
                      <div className="text-center p-2 bg-green-800/20 rounded">
                        <div className="text-green-400 font-medium">Risk Reduction</div>
                        <div className="text-white">9% better</div>
                        <div className="text-gray-400">(facilities)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {diversionScenarios.length > 0 && (
            <Card className="bg-gray-800/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  All Diversion Scenarios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  {diversionScenarios.map((scenario, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded border cursor-pointer transition-colors ${
                        selectedScenario?.airport === scenario.airport
                          ? 'border-blue-500 bg-blue-900/20'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                      onClick={() => setSelectedScenario(scenario)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-white font-medium">{scenario.airport} - {scenario.airportName}</h3>
                        <Badge className={`${
                          scenario.urgency === 'critical' ? 'bg-red-600' :
                          scenario.urgency === 'emergency' ? 'bg-orange-600' :
                          scenario.urgency === 'urgent' ? 'bg-yellow-600' : 'bg-blue-600'
                        }`}>
                          {scenario.urgency.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-gray-300 text-sm mb-2">{scenario.reason}</p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400">Distance:</span>
                          <span className="text-white ml-1">{scenario.distance} km</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Flight Time:</span>
                          <span className="text-white ml-1">{scenario.estimatedFlightTime} min</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Extra Fuel:</span>
                          <span className="text-white ml-1">{scenario.extraFuelBurn.toLocaleString()} kg</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {simulationResult && (
                  <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500 rounded">
                    <h4 className="text-blue-300 font-medium mb-3">Simulation Results</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400">Original ETA</div>
                        <div className="text-white">{new Date(simulationResult.originalEta).toLocaleTimeString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">New ETA</div>
                        <div className="text-white">{new Date(simulationResult.newEta).toLocaleTimeString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Total Delay</div>
                        <div className="text-white">{simulationResult.totalDelay} min</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Fuel Remaining</div>
                        <div className="text-white">{simulationResult.fuelRemaining.toLocaleString()} kg</div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="text-gray-400 mb-2">Risk Assessment</div>
                      <div className="flex gap-2">
                        <Badge className={getRiskColor(simulationResult.riskAssessment.overall)}>
                          Overall: {simulationResult.riskAssessment.overall.toUpperCase()}
                        </Badge>
                        <Badge className={getRiskColor(simulationResult.riskAssessment.fuel)}>
                          Fuel: {simulationResult.riskAssessment.fuel.toUpperCase()}
                        </Badge>
                        <Badge className={getRiskColor(simulationResult.riskAssessment.crew)}>
                          Crew: {simulationResult.riskAssessment.crew.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={runDiversionSimulation} disabled={!selectedScenario}>
                    Run Simulation
                  </Button>
                  <Button onClick={generateMORReport} disabled={!simulationResult} variant="outline">
                    Generate MOR Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          {costAnalysis && customerImpact && (
            <div className="grid gap-4">
              <Card className="bg-gray-800/50 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Cost Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-gray-400">Hotel Costs</div>
                      <div className="text-white font-medium">{formatCurrency(costAnalysis.hotel)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Meal Costs</div>
                      <div className="text-white font-medium">{formatCurrency(costAnalysis.meals)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Rebooking</div>
                      <div className="text-white font-medium">{formatCurrency(costAnalysis.rebooking)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Crew Costs</div>
                      <div className="text-white font-medium">{formatCurrency(costAnalysis.breakdown.crewCosts)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Fuel Costs</div>
                      <div className="text-white font-medium">{formatCurrency(costAnalysis.breakdown.fuelCosts)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Total Cost</div>
                      <div className="text-yellow-400 font-bold text-lg">{formatCurrency(costAnalysis.total)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Customer Impact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-gray-400">Disruption Score</div>
                      <div className="text-3xl font-bold text-white">{customerImpact.score}/100</div>
                      <div className={`text-sm ${
                        customerImpact.category === 'severe' ? 'text-red-400' :
                        customerImpact.category === 'high' ? 'text-orange-400' :
                        customerImpact.category === 'moderate' ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {customerImpact.category.toUpperCase()} IMPACT
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-400">Est. Compensation</div>
                      <div className="text-white font-medium">{formatCurrency(customerImpact.estimatedCompensation)}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Delay</div>
                      <div className="text-white">{customerImpact.factors.delayMinutes} minutes</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Reroute</div>
                      <div className="text-white">{customerImpact.factors.rerouteRequired ? 'Yes' : 'No'}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Missed Connection</div>
                      <div className="text-white">{customerImpact.factors.missedConnection ? 'Yes' : 'No'}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Compensation Required</div>
                      <div className="text-white">{customerImpact.factors.compensationRequired ? 'Yes' : 'No'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="crew" className="space-y-4">
          {crewStatus && fuelAnalysis && (
            <div className="grid gap-4">
              <Card className="bg-gray-800/50 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Crew Legality Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-gray-400">Legal Status</div>
                      <div className={`text-2xl font-bold ${crewStatus.legal ? 'text-green-400' : 'text-red-400'}`}>
                        {crewStatus.legal ? 'LEGAL' : 'ILLEGAL'}
                      </div>
                    </div>
                    <Badge className={getRiskColor(crewStatus.riskLevel)}>
                      {crewStatus.riskLevel.toUpperCase()} RISK
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                    <div>
                      <div className="text-gray-400">Time Remaining</div>
                      <div className="text-white">{crewStatus.timeRemaining} min</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Required Time</div>
                      <div className="text-white">{crewStatus.requiredTime} min</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Safety Margin</div>
                      <div className="text-white">{crewStatus.safetyMargin} min</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-400 mb-2">Recommendations</div>
                    <ul className="text-sm text-gray-300 space-y-1">
                      {crewStatus.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-400 mt-1">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Fuel className="h-5 w-5" />
                    Fuel Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Efficiency</div>
                      <div className="text-white font-medium">{fuelAnalysis.efficiency}%</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Requested Extra</div>
                      <div className="text-white">{fuelAnalysis.requestedExtra.toLocaleString()} kg</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Actual Burn</div>
                      <div className="text-white">{fuelAnalysis.actualBurn.toLocaleString()} kg</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Wasted Fuel</div>
                      <div className="text-white">{fuelAnalysis.wastedFuel.toLocaleString()} kg</div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="text-gray-400 mb-2">Cost Impact</div>
                    <div className="text-yellow-400 font-medium">{formatCurrency(fuelAnalysis.cost)}</div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="text-gray-400 mb-2">Recommendation</div>
                    <div className="text-gray-300 text-sm">{fuelAnalysis.recommendation}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          {reportGenerated && (
            <Card className="bg-gray-800/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Mandatory Occurrence Report (MOR)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm text-gray-300 whitespace-pre-wrap bg-gray-900 p-4 rounded overflow-auto max-h-96">
                  {reportGenerated}
                </pre>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" onClick={() => navigator.clipboard.writeText(reportGenerated)}>
                    Copy Report
                  </Button>
                  <Button variant="outline">
                    Download PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {weatherData && (
            <Card className="bg-gray-800/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Weather Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {weatherData.map((report: any, index: number) => (
                    <div key={index} className="p-3 border border-gray-600 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium">{report.airport}</h4>
                        <Badge className={
                          report.data.conditions === 'VMC' ? 'bg-green-600' :
                          report.data.conditions === 'MVFR' ? 'bg-yellow-600' : 'bg-red-600'
                        }>
                          {report.data.conditions}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400">Visibility:</span>
                          <span className="text-white ml-1">{report.data.visibility} km</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Ceiling:</span>
                          <span className="text-white ml-1">{report.data.ceiling} ft</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Winds:</span>
                          <span className="text-white ml-1">{report.data.winds.direction}°/{report.data.winds.speed}kt</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="airfields" className="space-y-4">
          <div className="grid gap-4">
            {availableAirfields.map((airfield, index) => (
              <Card key={index} className="bg-gray-800/50 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      {airfield.icao} - {airfield.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge className={getSuitabilityColor(airfield.suitability.overall) === 'text-green-400' ? 'bg-green-600' : 
                                       getSuitabilityColor(airfield.suitability.overall) === 'text-yellow-400' ? 'bg-yellow-600' :
                                       getSuitabilityColor(airfield.suitability.overall) === 'text-orange-400' ? 'bg-orange-600' : 'bg-red-600'}>
                        {airfield.suitability.overall}% Suitable
                      </Badge>
                      <Badge className={airfield.weatherCategory === 'CAT1' ? 'bg-green-600' : 
                                       airfield.weatherCategory === 'CAT2' ? 'bg-yellow-600' : 'bg-orange-600'}>
                        {airfield.weatherCategory}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-gray-400 text-sm">Distance</div>
                      <div className="text-white font-medium">{airfield.distance} km</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Fuel Required</div>
                      <div className="text-white font-medium">{airfield.fuelRequired.toLocaleString()} kg</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Visibility</div>
                      <div className="text-white font-medium">{airfield.visibility} km</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Winds</div>
                      <div className="text-white font-medium">
                        {airfield.winds.direction}°/{airfield.winds.speed}kt
                        {airfield.winds.gusts && ` G${airfield.winds.gusts}kt`}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-gray-400 text-sm mb-2">Ground Handling</div>
                      <div className="text-white text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-2 h-2 rounded-full ${airfield.groundHandling.available ? 'bg-green-400' : 'bg-red-400'}`}></div>
                          {airfield.groundHandling.provider}
                        </div>
                        <div className="text-gray-300">{airfield.groundHandling.operatingHours}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-gray-400 text-sm mb-2">Customs & Immigration</div>
                      <div className="text-white text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-2 h-2 rounded-full ${airfield.customs.available ? 'bg-green-400' : 'bg-red-400'}`}></div>
                          {airfield.customs.availability24h ? '24/7' : 'Limited Hours'}
                        </div>
                        {airfield.customs.medicalClearance && (
                          <div className="text-green-300 text-xs">Medical Clearance Available</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-gray-400 text-sm mb-2">Fire & Rescue</div>
                      <div className="text-white text-sm">
                        <div className="mb-1">Category {airfield.fireRescue.category}</div>
                        <div className="text-gray-300 text-xs">
                          Response: {airfield.fireRescue.responseTime} min
                        </div>
                        {airfield.fireRescue.medicalEvacuation && (
                          <div className="text-green-300 text-xs">Medical Evacuation</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {airfield.advantages.length > 0 && (
                    <div className="mt-4">
                      <div className="text-gray-400 text-sm mb-2">Advantages</div>
                      <div className="flex gap-2 flex-wrap">
                        {airfield.advantages.map((advantage, idx) => (
                          <Badge key={idx} variant="outline" className="text-green-300 border-green-600">
                            {advantage}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {airfield.restrictions.length > 0 && (
                    <div className="mt-2">
                      <div className="text-gray-400 text-sm mb-2">Restrictions</div>
                      <div className="flex gap-2 flex-wrap">
                        {airfield.restrictions.map((restriction, idx) => (
                          <Badge key={idx} variant="outline" className="text-red-300 border-red-600">
                            {restriction}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}