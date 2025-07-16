import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plane, 
  Clock, 
  Fuel, 
  Heart, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  MapPin,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Stethoscope,
  Wind,
  Eye,
  Gauge
} from 'lucide-react';
import { generateDiversionScenarios, type DiversionOutcome, type ScenarioContext } from '../lib/diversionScenarios';
import { useFlightState } from '../lib/stores/useFlightState';

export default function DiversionOutcomes() {
  const { position, fuelRemaining, altitude } = useFlightState();
  const [scenarios, setScenarios] = useState<DiversionOutcome[]>([]);
  const [selectedOutcome, setSelectedOutcome] = useState<DiversionOutcome | null>(null);
  const [emergencyType, setEmergencyType] = useState<'cardiac' | 'stroke' | 'trauma' | 'breathing' | 'allergic' | 'engine_failure' | 'depressurization' | 'hydraulic_failure' | 'electrical_failure'>('cardiac');
  const [patientCondition, setPatientCondition] = useState<'critical' | 'serious' | 'stable'>('critical');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const generateScenarios = async () => {
    setIsAnalyzing(true);
    
    try {
      const requestData = {
        currentPosition: {
          lat: position[0] || 34.0522, // Default to LAX area
          lon: position[1] || -118.2437,
          altitude: altitude || 35000
        },
        emergencyType: isTechnicalFailure ? 'technical' : emergencyType,
        patientCondition,
        timeToDestination: 120, // 2 hours to original destination
        fuelRemaining: fuelRemaining || 80000,
        weather: {
          visibility: 8, // miles
          windSpeed: 15, // knots
          turbulence: 'light'
        },
        crewExperience: 'experienced'
      };

      // Call the server-side comprehensive scenario generation
      const response = await fetch('/api/decisions/generate-scenarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Convert server response to client format
      const convertedScenarios: DiversionOutcome[] = data.scenarios.map((scenario: any) => ({
        airportCode: scenario.airportCode,
        airportName: scenario.airportName,
        distance: scenario.distance,
        flightTime: scenario.flightTime,
        fuelRequired: scenario.fuelRequired,
        fuelRemaining: scenario.fuelRemaining,
        medicalFacilities: scenario.medicalFacilities,
        weatherConditions: scenario.weatherConditions,
        runwayLength: scenario.runwayLength,
        approachDifficulty: scenario.approachDifficulty,
        costs: scenario.costs,
        consequences: scenario.consequences,
        timeline: scenario.timeline,
        riskFactors: scenario.riskFactors,
        advantages: scenario.advantages,
        realWorldExample: scenario.realWorldExample
      }));

      setScenarios(convertedScenarios);
      setSelectedOutcome(convertedScenarios[0] || null);
      
      console.log(`Generated ${convertedScenarios.length} diversion scenarios from server`);
      console.log('Recommended option:', data.context.recommendedOption);
      
    } catch (error) {
      console.error('Failed to generate scenarios:', error);
      
      // Fallback to client-side generation if server fails
      const context: ScenarioContext = {
        currentPosition: {
          lat: position[0] || 34.0522,
          lon: position[1] || -118.2437,
          altitude: altitude || 35000
        },
        emergencyType: isTechnicalFailure ? 'technical' : emergencyType,
        patientCondition,
        timeToDestination: 120,
        fuelRemaining: fuelRemaining || 80000,
        weather: {
          visibility: 8,
          windSpeed: 15,
          turbulence: 'light'
        },
        crewExperience: 'experienced'
      };

      const outcomes = generateDiversionScenarios(context);
      setScenarios(outcomes);
      setSelectedOutcome(outcomes[0] || null);
      console.log('Using client-side scenario generation as fallback');
    }
    
    setIsAnalyzing(false);
  };

  useEffect(() => {
    generateScenarios();
  }, [emergencyType, patientCondition]);

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'excellent': return 'text-green-400 bg-green-900/20 border-green-500';
      case 'good': return 'text-blue-400 bg-blue-900/20 border-blue-500';
      case 'stable': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500';
      case 'critical': return 'text-red-400 bg-red-900/20 border-red-500';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500';
    }
  };

  const getWorkloadColor = (workload: string) => {
    switch (workload) {
      case 'low': return 'text-green-400';
      case 'moderate': return 'text-yellow-400';
      case 'high': return 'text-orange-400';
      case 'extreme': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isTechnicalFailure = ['engine_failure', 'depressurization', 'hydraulic_failure', 'electrical_failure'].includes(emergencyType);
  const headerText = isTechnicalFailure ? 'AIRCRAFT NON NORMAL OPERATIONS' : 'MEDICAL EMERGENCY - DIVERSION REQUIRED';

  return (
    <div className="h-full overflow-auto p-4 space-y-4">
      {/* Main Emergency Header */}
      <div className="bg-red-600 text-white px-4 py-2 rounded-lg text-center font-bold text-lg border border-red-400">
        ⚠ {headerText}
      </div>
      
      {/* Emergency Configuration */}
      <Card className="border-orange-500 bg-orange-900/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-orange-300 flex items-center gap-2">
            {isTechnicalFailure ? (
              <>
                <AlertTriangle className="h-5 w-5" />
                Aircraft System Configuration
              </>
            ) : (
              <>
                <Stethoscope className="h-5 w-5" />
                Medical Emergency Configuration
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-orange-300 text-sm mb-2 block">Emergency Type</label>
              <select
                value={emergencyType}
                onChange={(e) => setEmergencyType(e.target.value as any)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
              >
                <optgroup label="Medical Emergencies">
                  <option value="cardiac">Cardiac Event</option>
                  <option value="stroke">Stroke</option>
                  <option value="trauma">Trauma/Injury</option>
                  <option value="breathing">Breathing Difficulty</option>
                  <option value="allergic">Allergic Reaction</option>
                </optgroup>
                <optgroup label="Technical Failures">
                  <option value="engine_failure">Engine Failure</option>
                  <option value="depressurization">Rapid Depressurization</option>
                  <option value="hydraulic_failure">Hydraulic System Failure</option>
                  <option value="electrical_failure">Electrical System Failure</option>
                </optgroup>
              </select>
            </div>
            <div>
              <label className="text-orange-300 text-sm mb-2 block">
                {isTechnicalFailure ? 'System Severity' : 'Patient Condition'}
              </label>
              <select
                value={patientCondition}
                onChange={(e) => setPatientCondition(e.target.value as any)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
              >
                {isTechnicalFailure ? (
                  <>
                    <option value="critical">Critical - Immediate Landing Required</option>
                    <option value="serious">Serious - Urgent Diversion Needed</option>
                    <option value="stable">Stable - Monitoring Required</option>
                  </>
                ) : (
                  <>
                    <option value="critical">Critical - Immediate Action Required</option>
                    <option value="serious">Serious - Urgent Care Needed</option>
                    <option value="stable">Stable - Medical Attention Required</option>
                  </>
                )}
              </select>
            </div>
          </div>
          <Button 
            onClick={generateScenarios}
            disabled={isAnalyzing}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            {isAnalyzing ? 'Analyzing Scenarios...' : 'Generate Diversion Scenarios'}
          </Button>
        </CardContent>
      </Card>

      {scenarios.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Airport Options */}
          <Card className="border-blue-500 bg-blue-900/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-blue-300 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Diversion Options (Ranked by Suitability)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {scenarios.slice(0, 6).map((scenario, index) => (
                <div
                  key={scenario.airportCode}
                  onClick={() => setSelectedOutcome(scenario)}
                  className={`p-3 border rounded cursor-pointer transition-all ${
                    selectedOutcome?.airportCode === scenario.airportCode
                      ? 'border-blue-400 bg-blue-900/40'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-white">
                        #{index + 1} - {scenario.airportCode}
                      </div>
                      <div className="text-gray-300 text-sm">
                        {scenario.airportName}
                      </div>
                    </div>
                    <Badge className={getOutcomeColor(scenario.consequences.medicalOutcome)}>
                      {scenario.consequences.medicalOutcome.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="text-blue-300">Distance</div>
                      <div className="text-white">{Math.round(scenario.distance)} nm</div>
                    </div>
                    <div className="text-center">
                      <div className="text-blue-300">Time</div>
                      <div className="text-white">{formatTime(scenario.flightTime)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-blue-300">Cost</div>
                      <div className="text-white">{formatCurrency(scenario.costs.total)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Detailed Outcome Analysis */}
          {selectedOutcome && (
            <Card className="border-green-500 bg-green-900/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-green-300 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Detailed Analysis: {selectedOutcome.airportCode}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="medical" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="medical">Medical</TabsTrigger>
                    <TabsTrigger value="operational">Operations</TabsTrigger>
                    <TabsTrigger value="costs">Costs</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="medical" className="space-y-4">
                    <div className={`p-3 border rounded ${getOutcomeColor(selectedOutcome.consequences.medicalOutcome)}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="h-4 w-4" />
                        <span className="font-medium">Medical Outcome: {selectedOutcome.consequences.medicalOutcome}</span>
                      </div>
                      <p className="text-sm opacity-90">
                        Based on {selectedOutcome.medicalFacilities} medical facilities and {formatTime(selectedOutcome.timeline.medicalResponse)} response time.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-green-300">Medical Facilities:</span>
                        <Badge variant="outline" className="text-green-300">
                          {selectedOutcome.medicalFacilities}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-green-300">Response Time:</span>
                        <span className="text-white">{formatTime(selectedOutcome.timeline.medicalResponse)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-green-300">Time to Landing:</span>
                        <span className="text-white">{formatTime(selectedOutcome.timeline.landingTime)}</span>
                      </div>
                    </div>

                    {selectedOutcome.realWorldExample && (
                      <div className="bg-gray-800/50 p-3 rounded border border-gray-600">
                        <div className="text-green-300 text-sm font-medium mb-1">Real-World Reference:</div>
                        <p className="text-gray-300 text-xs">{selectedOutcome.realWorldExample}</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="operational" className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <div className="text-green-300 text-sm font-medium">Flight Parameters</div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Distance:</span>
                            <span className="text-white">{Math.round(selectedOutcome.distance)} nm</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Flight Time:</span>
                            <span className="text-white">{formatTime(selectedOutcome.flightTime)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Fuel Required:</span>
                            <span className="text-white">{(selectedOutcome.fuelRequired / 1000).toFixed(1)}k kg</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Fuel Remaining:</span>
                            <span className={selectedOutcome.fuelRemaining < 3000 ? 'text-red-400' : 'text-white'}>
                              {(selectedOutcome.fuelRemaining / 1000).toFixed(1)}k kg
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-green-300 text-sm font-medium">Conditions</div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Weather:</span>
                            <Badge variant="outline" className="text-xs">
                              {selectedOutcome.weatherConditions}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Approach:</span>
                            <Badge variant="outline" className="text-xs">
                              {selectedOutcome.approachDifficulty}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Crew Workload:</span>
                            <span className={getWorkloadColor(selectedOutcome.consequences.crewWorkload)}>
                              {selectedOutcome.consequences.crewWorkload}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Runway:</span>
                            <span className="text-white">{(selectedOutcome.runwayLength / 1000).toFixed(1)}k ft</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-green-300 text-sm font-medium">Impact Assessment</div>
                      <p className="text-gray-300 text-xs">{selectedOutcome.consequences.passengerImpact}</p>
                    </div>

                    {selectedOutcome.riskFactors.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-red-300 text-sm font-medium flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Risk Factors
                        </div>
                        <ul className="space-y-1">
                          {selectedOutcome.riskFactors.map((risk, index) => (
                            <li key={index} className="text-red-200 text-xs flex items-center gap-1">
                              <XCircle className="h-2 w-2" />
                              {risk}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedOutcome.advantages.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-green-300 text-sm font-medium flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Advantages
                        </div>
                        <ul className="space-y-1">
                          {selectedOutcome.advantages.map((advantage, index) => (
                            <li key={index} className="text-green-200 text-xs flex items-center gap-1">
                              <CheckCircle className="h-2 w-2" />
                              {advantage}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="costs" className="space-y-4">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-green-300">Fuel Cost:</span>
                          <span className="text-white">{formatCurrency(selectedOutcome.costs.fuel)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-300">Delay Cost:</span>
                          <span className="text-white">{formatCurrency(selectedOutcome.costs.delay)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-300">Passenger Care:</span>
                          <span className="text-white">{formatCurrency(selectedOutcome.costs.passenger)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-300">Crew Costs:</span>
                          <span className="text-white">{formatCurrency(selectedOutcome.costs.crew)}</span>
                        </div>
                      </div>

                      <div className="border-t border-green-500 pt-2">
                        <div className="flex justify-between text-lg font-medium">
                          <span className="text-green-300">Total Cost:</span>
                          <span className="text-yellow-400">{formatCurrency(selectedOutcome.costs.total)}</span>
                        </div>
                      </div>

                      <div className="bg-gray-800/50 p-3 rounded">
                        <div className="text-green-300 text-sm font-medium mb-2">Cost Breakdown Analysis</div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Fuel ({((selectedOutcome.costs.fuel / selectedOutcome.costs.total) * 100).toFixed(1)}%)</span>
                            <Progress value={(selectedOutcome.costs.fuel / selectedOutcome.costs.total) * 100} className="w-20 h-1" />
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Delays ({((selectedOutcome.costs.delay / selectedOutcome.costs.total) * 100).toFixed(1)}%)</span>
                            <Progress value={(selectedOutcome.costs.delay / selectedOutcome.costs.total) * 100} className="w-20 h-1" />
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Passengers ({((selectedOutcome.costs.passenger / selectedOutcome.costs.total) * 100).toFixed(1)}%)</span>
                            <Progress value={(selectedOutcome.costs.passenger / selectedOutcome.costs.total) * 100} className="w-20 h-1" />
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-gray-400">
                        * Costs include fuel consumption, passenger compensation, crew overtime, ground handling, and delay-related expenses.
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="timeline" className="space-y-4">
                    <div className="space-y-3">
                      <div className="text-green-300 text-sm font-medium">Critical Timeline</div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 p-2 bg-red-900/20 border border-red-500 rounded">
                          <Clock className="h-4 w-4 text-red-400" />
                          <div className="flex-1">
                            <div className="text-red-300 text-sm">Decision Required</div>
                            <div className="text-red-200 text-xs">Captain must decide within {formatTime(selectedOutcome.timeline.decisionTime)}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-2 bg-yellow-900/20 border border-yellow-500 rounded">
                          <Plane className="h-4 w-4 text-yellow-400" />
                          <div className="flex-1">
                            <div className="text-yellow-300 text-sm">Begin Approach</div>
                            <div className="text-yellow-200 text-xs">Start approach in {formatTime(selectedOutcome.timeline.approachTime)}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-2 bg-blue-900/20 border border-blue-500 rounded">
                          <MapPin className="h-4 w-4 text-blue-400" />
                          <div className="flex-1">
                            <div className="text-blue-300 text-sm">Landing</div>
                            <div className="text-blue-200 text-xs">Expected landing in {formatTime(selectedOutcome.timeline.landingTime)}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-2 bg-green-900/20 border border-green-500 rounded">
                          <Stethoscope className="h-4 w-4 text-green-400" />
                          <div className="flex-1">
                            <div className="text-green-300 text-sm">Medical Response</div>
                            <div className="text-green-200 text-xs">Medical team available in {formatTime(selectedOutcome.timeline.medicalResponse)}</div>
                          </div>
                        </div>
                      </div>

                      {selectedOutcome.consequences.regulatoryIssues.length > 0 && (
                        <div className="bg-orange-900/20 border border-orange-500 rounded p-3">
                          <div className="text-orange-300 text-sm font-medium mb-2">Regulatory Considerations</div>
                          <ul className="space-y-1">
                            {selectedOutcome.consequences.regulatoryIssues.map((issue, index) => (
                              <li key={index} className="text-orange-200 text-xs">• {issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}