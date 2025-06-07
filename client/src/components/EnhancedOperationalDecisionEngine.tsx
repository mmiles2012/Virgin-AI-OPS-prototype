import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, DollarSign, Users, Plane, MapPin, TrendingUp, Brain, Gauge, Zap, Shield, Wind, Eye, Fuel, Building, Wrench } from 'lucide-react';
import { useSelectedFlight } from '../lib/stores/useSelectedFlight';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

interface DecisionImpact {
  cost: {
    fuel: number;
    handling: number;
    passenger: number;
    crew: number;
    total: number;
  };
  time: {
    delay: number;
    diversion: number;
    recovery: number;
    total: number;
  };
  fuel: {
    additional: number;
    remaining: number;
    percentage: number;
  };
  passengers: {
    affected: number;
    compensation: number;
    rebooking: number;
  };
  operations: {
    slotLoss: boolean;
    downstream: number;
    recovery: string;
  };
}

interface OperationalDecision {
  id: string;
  type: 'medical' | 'technical' | 'weather' | 'fuel';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: DecisionImpact;
  recommendations: string[];
  timeline: string;
  approvalRequired: string[];
  alternativeOptions: string[];
  riskAssessment: {
    safety: 'low' | 'medium' | 'high' | 'critical';
    operational: 'low' | 'medium' | 'high' | 'critical';
    financial: 'low' | 'medium' | 'high' | 'critical';
    reputation: 'low' | 'medium' | 'high' | 'critical';
    overall: 'low' | 'medium' | 'high' | 'critical';
  };
}

export default function EnhancedOperationalDecisionEngine() {
  const [flightData, setFlightData] = useState<EnhancedFlightData | null>(null);
  const [availableAirfields, setAvailableAirfields] = useState<AirfieldData[]>([]);
  const [operationalDecisions, setOperationalDecisions] = useState<OperationalDecision[]>([]);
  const [selectedAirfield, setSelectedAirfield] = useState<string | null>(null);
  const [emergencyType, setEmergencyType] = useState<string>('medical');
  const { selectedFlight } = useSelectedFlight();

  useEffect(() => {
    if (selectedFlight) {
      const aircraftType = detectAircraftType(selectedFlight.aircraft);
      const estimatedWeight = aircraftType === 'A350' ? 280000 : aircraftType === 'A330' ? 242000 : 254000;
      const currentFuelKg = Math.round(estimatedWeight * 0.35);
      const fuelBurnRate = aircraftType === 'A350' ? 6800 : aircraftType === 'A330' ? 7200 : 6900;
      const maxRange = aircraftType === 'A350' ? 15300 : aircraftType === 'A330' ? 13400 : 14800;
      
      setFlightData({
        callsign: selectedFlight.callsign,
        aircraft: selectedFlight.aircraft,
        route: `${selectedFlight.origin} → ${selectedFlight.destination}`,
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
    } else {
      setFlightData(null);
    }
  }, [selectedFlight]);

  useEffect(() => {
    if (flightData) {
      generateAirfieldData(flightData);
      generateOperationalDecisions(flightData);
    }
  }, [flightData, emergencyType]);

  const detectAircraftType = (aircraft: string): 'A350' | 'A330' | '787' => {
    const aircraftUpper = aircraft.toUpperCase();
    if (aircraftUpper.includes('A350') || aircraftUpper.includes('350')) return 'A350';
    if (aircraftUpper.includes('A330') || aircraftUpper.includes('330')) return 'A330';
    return '787';
  };

  const generateAirfieldData = (flight: EnhancedFlightData) => {
    const currentTime = new Date();
    const hour = currentTime.getHours();
    const isNightTime = hour < 6 || hour > 22;

    const nearbyAirfields = [
      { icao: 'EGLL', name: 'London Heathrow', distance: 180, bearing: 270 },
      { icao: 'EHAM', name: 'Amsterdam Schiphol', distance: 220, bearing: 90 },
      { icao: 'EDDF', name: 'Frankfurt Main', distance: 380, bearing: 135 },
      { icao: 'LFPG', name: 'Paris Charles de Gaulle', distance: 290, bearing: 180 },
      { icao: 'ESSA', name: 'Stockholm Arlanda', distance: 450, bearing: 45 }
    ];

    const airfields: AirfieldData[] = nearbyAirfields.map((airport, index) => {
      const fuelRequired = Math.round(airport.distance * flight.fuelBurn / flight.speed);
      const weatherScore = 75 + Math.random() * 25;
      const isHub = airport.icao === 'EGLL' || airport.icao === 'EHAM';

      return {
        icao: airport.icao,
        name: airport.name,
        distance: airport.distance,
        bearing: airport.bearing,
        fuelRequired,
        
        weatherCategory: weatherScore > 90 ? 'CAT1' : weatherScore > 70 ? 'CAT2' : 'CAT3A',
        visibility: Math.round(8000 + Math.random() * 2000),
        ceiling: Math.round(1000 + Math.random() * 500),
        winds: {
          speed: Math.round(5 + Math.random() * 15),
          direction: Math.round(Math.random() * 360),
          gusts: Math.random() > 0.7 ? Math.round(20 + Math.random() * 10) : undefined
        },
        
        groundHandling: {
          available: true,
          provider: ['Swissport', 'Menzies', 'dnata', 'WFS'][index % 4],
          services: ['Baggage', 'Catering', 'Fuel', 'GPU', 'Pushback', 'De-icing'],
          operatingHours: isHub ? '24/7' : '06:00-23:00',
          availability24h: isHub
        },
        
        customs: {
          available: true,
          operatingHours: isNightTime ? 'On-call' : '06:00-23:00',
          availability24h: isHub,
          fastTrack: isHub,
          medicalClearance: true
        },
        
        fireRescue: {
          category: isHub ? 10 : 8 + Math.floor(Math.random() * 2),
          foamCapability: true,
          responseTime: 120 + Math.floor(Math.random() * 60),
          availability24h: true,
          medicalEvacuation: isHub
        },
        
        slots: {
          available: !isNightTime || isHub,
          nextAvailable: isNightTime ? '06:00+1' : 'Immediate',
          restrictions: isNightTime ? ['Night ops restricted'] : []
        },
        
        fuelAvailability: {
          jetA1: true,
          quantity: 500 + Math.floor(Math.random() * 1000),
          supplier: ['Shell', 'BP', 'Total', 'ExxonMobil'][index % 4]
        },
        
        medical: {
          onSite: isHub,
          nearbyHospitals: [
            {
              name: `${airport.name.split(' ')[0]} General Hospital`,
              distance: 8 + Math.floor(Math.random() * 15),
              specialties: ['Emergency', 'Cardiology', 'Trauma'],
              trauma: true
            }
          ]
        },
        
        suitability: {
          overall: Math.round(60 + Math.random() * 40),
          weather: Math.round(weatherScore),
          facilities: Math.round(70 + Math.random() * 30),
          cost: Math.round(50 + Math.random() * 40),
          time: Math.round(80 - (airport.distance / 10)),
          safety: Math.round(85 + Math.random() * 15)
        },
        
        restrictions: isNightTime ? ['Limited night operations'] : [],
        advantages: isHub ? ['24/7 operations', 'Medical facilities'] : 
                   airport.icao === 'EDDF' ? ['Hub operations', 'Maintenance'] : 
                   ['Full ILS CAT3', 'Emergency services']
      };
    });

    setAvailableAirfields(airfields.sort((a, b) => b.suitability.overall - a.suitability.overall));
  };

  const generateOperationalDecisions = (flight: EnhancedFlightData) => {
    const decisions: OperationalDecision[] = [];

    if (emergencyType === 'medical') {
      decisions.push({
        id: 'medical-diversion',
        type: 'medical',
        priority: 'critical',
        title: 'Medical Emergency - Immediate Diversion Required',
        description: `${flight.callsign} declares medical emergency. Passenger experiencing cardiac symptoms requiring immediate hospital treatment.`,
        impact: {
          cost: {
            fuel: 15000,
            handling: 8000,
            passenger: 18000,
            crew: 4000,
            total: 45000
          },
          time: {
            delay: 180,
            diversion: 45,
            recovery: 120,
            total: 345
          },
          fuel: {
            additional: 2800,
            remaining: flight.fuelRemaining - 2800,
            percentage: ((flight.fuelRemaining - 2800) / flight.fuelRemaining) * 100
          },
          passengers: {
            affected: flight.passengers,
            compensation: 18000,
            rebooking: 45
          },
          operations: {
            slotLoss: true,
            downstream: 3,
            recovery: 'Next day'
          }
        },
        recommendations: [
          'Divert to nearest airport with medical facilities',
          'Coordinate with emergency medical services',
          'Prepare passenger manifest for customs',
          'Arrange ground transportation to hospital'
        ],
        timeline: 'Immediate decision required - passenger condition deteriorating',
        approvalRequired: ['Captain', 'Operations Control', 'Medical Advisory'],
        alternativeOptions: ['Continue to destination with medical kit', 'Medical advice via satellite'],
        riskAssessment: {
          safety: 'critical',
          operational: 'high',
          financial: 'medium',
          reputation: 'high',
          overall: 'critical'
        }
      });
    }

    if (emergencyType === 'technical') {
      decisions.push({
        id: 'technical-assessment',
        type: 'technical',
        priority: 'high',
        title: 'Engine Parameter Deviation - Assessment Required',
        description: `${flight.callsign} reports elevated engine temperature on Engine 2. Monitoring required.`,
        impact: {
          cost: {
            fuel: 8000,
            handling: 5000,
            passenger: 12000,
            crew: 2000,
            total: 27000
          },
          time: {
            delay: 120,
            diversion: 30,
            recovery: 180,
            total: 330
          },
          fuel: {
            additional: 1500,
            remaining: flight.fuelRemaining - 1500,
            percentage: ((flight.fuelRemaining - 1500) / flight.fuelRemaining) * 100
          },
          passengers: {
            affected: flight.passengers,
            compensation: 8000,
            rebooking: 25
          },
          operations: {
            slotLoss: false,
            downstream: 1,
            recovery: 'Same day'
          }
        },
        recommendations: [
          'Monitor engine parameters closely',
          'Reduce thrust if within limits',
          'Prepare for single-engine approach if required',
          'Brief cabin crew on potential emergency'
        ],
        timeline: 'Monitor for 30 minutes, decide based on trend',
        approvalRequired: ['Captain', 'Operations Control', 'Maintenance Control'],
        alternativeOptions: ['Continue monitoring', 'Immediate diversion', 'Engine shutdown'],
        riskAssessment: {
          safety: 'high',
          operational: 'medium',
          financial: 'medium',
          reputation: 'low',
          overall: 'high'
        }
      });
    }

    setOperationalDecisions(decisions);
  };

  const getSuitabilityColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'text-red-400 bg-red-900/20';
      case 'high': return 'text-orange-400 bg-orange-900/20';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20';
      case 'low': return 'text-green-400 bg-green-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (!flightData) {
    return (
      <div className="p-6 text-center">
        <Plane className="h-12 w-12 text-gray-600 mx-auto mb-3" />
        <div className="text-gray-400">Select a flight to analyze operational decisions</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Enhanced Operational Decision Engine</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setEmergencyType('medical')}
            className={`px-3 py-1 rounded text-sm ${emergencyType === 'medical' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            Medical
          </button>
          <button
            onClick={() => setEmergencyType('technical')}
            className={`px-3 py-1 rounded text-sm ${emergencyType === 'technical' ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            Technical
          </button>
        </div>
      </div>

      {/* Flight Overview */}
      <Card className="bg-gray-800/50 border-gray-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Flight Analysis: {flightData.callsign}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Aircraft</div>
              <div className="text-white font-medium">{flightData.aircraft}</div>
            </div>
            <div>
              <div className="text-gray-400">Fuel Remaining</div>
              <div className="text-white font-medium">{flightData.fuelRemaining.toLocaleString()} kg</div>
            </div>
            <div>
              <div className="text-gray-400">Range Available</div>
              <div className="text-white font-medium">{Math.round(flightData.fuelRemaining / flightData.fuelBurn * flightData.speed)} km</div>
            </div>
            <div>
              <div className="text-gray-400">Passengers</div>
              <div className="text-white font-medium">{flightData.passengers} PAX</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="decisions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="decisions">Operational Decisions</TabsTrigger>
          <TabsTrigger value="airfields">Available Airfields</TabsTrigger>
          <TabsTrigger value="analysis">Impact Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="decisions" className="space-y-4">
          {operationalDecisions.map((decision) => (
            <Card key={decision.id} className="bg-gray-800/50 border-gray-600">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                    {decision.title}
                  </CardTitle>
                  <Badge className={`${getRiskColor(decision.riskAssessment.overall)} border-0`}>
                    {decision.riskAssessment.overall.toUpperCase()} RISK
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300">{decision.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-blue-300 font-medium">Financial Impact</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Cost:</span>
                        <span className="text-white">{formatCurrency(decision.impact.cost.total)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Fuel:</span>
                        <span className="text-white">{formatCurrency(decision.impact.cost.fuel)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Handling:</span>
                        <span className="text-white">{formatCurrency(decision.impact.cost.handling)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-blue-300 font-medium">Time Impact</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Delay:</span>
                        <span className="text-white">{formatTime(decision.impact.time.total)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Diversion:</span>
                        <span className="text-white">{formatTime(decision.impact.time.diversion)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Recovery:</span>
                        <span className="text-white">{formatTime(decision.impact.time.recovery)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-blue-300 font-medium">Fuel Impact</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Additional:</span>
                        <span className="text-white">{decision.impact.fuel.additional.toLocaleString()} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Remaining:</span>
                        <span className="text-white">{decision.impact.fuel.remaining.toLocaleString()} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Percentage:</span>
                        <span className="text-white">{decision.impact.fuel.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-blue-300 font-medium">Recommendations</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    {decision.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-2">
                  <Badge variant="outline" className="text-green-400 border-green-500">
                    Timeline: {decision.timeline}
                  </Badge>
                  <Badge variant="outline" className="text-yellow-400 border-yellow-500">
                    Approval: {decision.approvalRequired.join(', ')}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="airfields" className="space-y-4">
          {availableAirfields.map((airfield) => (
            <Card key={airfield.icao} className="bg-gray-800/50 border-gray-600">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {airfield.icao} - {airfield.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={`${getSuitabilityColor(airfield.suitability.overall)} bg-gray-700`}>
                      Score: {airfield.suitability.overall}
                    </Badge>
                    <Badge className="bg-blue-700 text-blue-200">
                      {airfield.distance} km
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="space-y-2">
                    <h4 className="text-blue-300 font-medium flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      Weather
                    </h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Category:</span>
                        <span className="text-white">{airfield.weatherCategory}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Visibility:</span>
                        <span className="text-white">{(airfield.visibility / 1000).toFixed(1)} km</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Ceiling:</span>
                        <span className="text-white">{airfield.ceiling} ft</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Winds:</span>
                        <span className="text-white">{airfield.winds.speed} kt</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-blue-300 font-medium flex items-center gap-1">
                      <Wrench className="h-4 w-4" />
                      Ground Support
                    </h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Provider:</span>
                        <span className="text-white">{airfield.groundHandling.provider}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Hours:</span>
                        <span className="text-white">{airfield.groundHandling.operatingHours}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">24/7:</span>
                        <span className={airfield.groundHandling.availability24h ? 'text-green-400' : 'text-red-400'}>
                          {airfield.groundHandling.availability24h ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-blue-300 font-medium flex items-center gap-1">
                      <Shield className="h-4 w-4" />
                      Fire & Rescue
                    </h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Category:</span>
                        <span className="text-white">{airfield.fireRescue.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Response:</span>
                        <span className="text-white">{airfield.fireRescue.responseTime}s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Med Evac:</span>
                        <span className={airfield.fireRescue.medicalEvacuation ? 'text-green-400' : 'text-red-400'}>
                          {airfield.fireRescue.medicalEvacuation ? 'Available' : 'Limited'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-blue-300 font-medium flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      Operations
                    </h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Slots:</span>
                        <span className={airfield.slots.available ? 'text-green-400' : 'text-yellow-400'}>
                          {airfield.slots.available ? 'Available' : airfield.slots.nextAvailable}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Fuel:</span>
                        <span className="text-white">{airfield.fuelAvailability.quantity}T</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Customs:</span>
                        <span className={airfield.customs.availability24h ? 'text-green-400' : 'text-yellow-400'}>
                          {airfield.customs.availability24h ? '24/7' : 'Limited'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {airfield.advantages.length > 0 && (
                  <div>
                    <h4 className="text-green-300 font-medium mb-2">Advantages</h4>
                    <div className="flex flex-wrap gap-1">
                      {airfield.advantages.map((advantage, index) => (
                        <Badge key={index} variant="outline" className="text-green-400 border-green-500 text-xs">
                          {advantage}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {airfield.restrictions.length > 0 && (
                  <div>
                    <h4 className="text-red-300 font-medium mb-2">Restrictions</h4>
                    <div className="flex flex-wrap gap-1">
                      {airfield.restrictions.map((restriction, index) => (
                        <Badge key={index} variant="outline" className="text-red-400 border-red-500 text-xs">
                          {restriction}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-gray-600">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Fuel Required for Diversion:</span>
                    <span className="text-white font-medium">{airfield.fuelRequired.toLocaleString()} kg</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card className="bg-gray-800/50 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white">Comprehensive Impact Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-300">
                <p>Detailed analysis of operational impacts, fuel modifications, range calculations, and airfield suitability assessments are now available for each scenario.</p>
                <p className="mt-2">The system evaluates CAT1 weather conditions, ground handling availability, customs operations, fire rescue capabilities, and 24-hour operating status for optimal decision support.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}