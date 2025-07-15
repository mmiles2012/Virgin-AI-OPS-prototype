import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import Boeing787DigitalTwin from './Boeing787DigitalTwin';

interface TrainingScenario {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  flightId: string;
  emergencyType?: string;
  weatherConditions?: string;
  objectives: string[];
}

interface FlightStatus {
  flightId: string;
  altitude: number;
  speed: number;
  heading: number;
  fuelRemaining: number;
  warnings: string[];
  emergencyActive: boolean;
}

const trainingScenarios: TrainingScenario[] = [
  {
    id: 'normal-ops',
    title: 'Normal Operations - LHR to JFK',
    description: 'Practice standard operating procedures for a transatlantic flight',
    difficulty: 'beginner',
    flightId: 'VS3',
    objectives: [
      'Monitor all aircraft systems',
      'Maintain cruise altitude and speed',
      'Coordinate with ATC',
      'Manage fuel consumption'
    ]
  },
  {
    id: 'weather-diversion',
    title: 'Weather Diversion Scenario',
    description: 'Navigate severe weather and execute diversion procedures',
    difficulty: 'intermediate',
    flightId: 'VS15',
    weatherConditions: 'Severe thunderstorms at destination',
    objectives: [
      'Assess weather impact',
      'Select alternate airport',
      'Coordinate with operations center',
      'Manage passenger communications'
    ]
  },
  {
    id: 'medical-emergency',
    title: 'Medical Emergency Response',
    description: 'Handle in-flight medical emergency requiring immediate landing',
    difficulty: 'advanced',
    flightId: 'VS45',
    emergencyType: 'Medical Emergency',
    objectives: [
      'Assess emergency severity',
      'Coordinate with medical professionals',
      'Plan emergency descent',
      'Select nearest suitable airport'
    ]
  },
  {
    id: 'fuel-optimization',
    title: 'Fuel Emergency Management',
    description: 'Manage low fuel situation with weather delays',
    difficulty: 'advanced',
    flightId: 'VS3',
    emergencyType: 'Low Fuel',
    objectives: [
      'Calculate fuel reserves',
      'Optimize flight path',
      'Coordinate priority landing',
      'Implement fuel conservation procedures'
    ]
  }
];

export default function AinoTrainingSimulator() {
  const [selectedScenario, setSelectedScenario] = useState<TrainingScenario>(trainingScenarios[0]);
  const [isScenarioActive, setIsScenarioActive] = useState(false);
  const [flightStatus, setFlightStatus] = useState<FlightStatus | null>(null);
  const [trainingProgress, setTrainingProgress] = useState<Record<string, boolean>>({});
  const [ainoAlerts, setAinoAlerts] = useState<any[]>([]);

  useEffect(() => {
    // Fetch real-time flight data for the selected scenario
    const fetchFlightData = async () => {
      try {
        const response = await fetch('/api/aviation/virgin-atlantic-flights');
        const data = await response.json();
        
        if (data.success && data.flights) {
          const flight = data.flights.find((f: any) => f.flightId === selectedScenario.flightId);
          if (flight) {
            setFlightStatus({
              flightId: flight.flightId,
              altitude: flight.altitude || 37000,
              speed: flight.speed || 485,
              heading: flight.heading || 270,
              fuelRemaining: flight.fuelRemaining || 45000,
              warnings: flight.warnings || [],
              emergencyActive: selectedScenario.emergencyType ? true : false
            });
          }
        }
      } catch (error) {
        console.error('Error fetching flight data:', error);
      }
    };

    // Fetch AINO intelligence alerts
    const fetchAinoAlerts = async () => {
      try {
        const endpoints = [
          '/api/notams/LHR/risk-analysis',
          '/api/notams/JFK/risk-analysis',
          '/api/ml-fuel-costs/current-forecast'
        ];

        const alerts = [];
        for (const endpoint of endpoints) {
          try {
            const response = await fetch(endpoint);
            const data = await response.json();
            if (data.success) {
              alerts.push({
                source: endpoint.includes('notams') ? 'NOTAM' : 'Fuel Cost',
                data: data
              });
            }
          } catch (e) {
            console.warn(`Failed to fetch from ${endpoint}:`, e);
          }
        }
        setAinoAlerts(alerts);
      } catch (error) {
        console.error('Error fetching AINO alerts:', error);
      }
    };

    fetchFlightData();
    fetchAinoAlerts();
    
    const interval = setInterval(() => {
      fetchFlightData();
      fetchAinoAlerts();
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedScenario]);

  const startScenario = () => {
    setIsScenarioActive(true);
    setTrainingProgress({});
  };

  const completeObjective = (objective: string) => {
    setTrainingProgress(prev => ({
      ...prev,
      [objective]: true
    }));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCompletionRate = () => {
    const completed = Object.values(trainingProgress).filter(Boolean).length;
    const total = selectedScenario.objectives.length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  return (
    <div className="w-full h-full bg-gray-50 overflow-auto">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">AINO Flight Training Simulator</h1>
          <p className="text-gray-600">
            Boeing 787 Training with Real-time Aviation Intelligence Integration
          </p>
        </div>

        {/* Scenario Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          {trainingScenarios.map((scenario) => (
            <Card 
              key={scenario.id}
              className={`cursor-pointer transition-all ${
                selectedScenario.id === scenario.id 
                  ? 'ring-2 ring-blue-500 shadow-lg' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedScenario(scenario)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{scenario.title}</CardTitle>
                  <Badge className={getDifficultyColor(scenario.difficulty)}>
                    {scenario.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">{scenario.description}</p>
                <div className="text-xs text-gray-500">
                  Flight: {scenario.flightId}
                </div>
                {scenario.emergencyType && (
                  <Badge variant="destructive" className="mt-2">
                    {scenario.emergencyType}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Training Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Training Control</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  onClick={startScenario}
                  className="w-full"
                  variant={isScenarioActive ? "outline" : "default"}
                >
                  {isScenarioActive ? 'Scenario Active' : 'Start Training Scenario'}
                </Button>
                
                {isScenarioActive && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {getCompletionRate()}%
                    </div>
                    <div className="text-sm text-gray-600">
                      Training Progress
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Flight Status</CardTitle>
            </CardHeader>
            <CardContent>
              {flightStatus ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Flight</span>
                    <span className="font-mono">{flightStatus.flightId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Altitude</span>
                    <span className="font-mono">{flightStatus.altitude} ft</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Speed</span>
                    <span className="font-mono">{flightStatus.speed} kts</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fuel</span>
                    <span className="font-mono">{flightStatus.fuelRemaining} kg</span>
                  </div>
                  {flightStatus.warnings.length > 0 && (
                    <div className="mt-3">
                      <div className="text-sm font-medium text-red-600">Active Warnings:</div>
                      {flightStatus.warnings.map((warning, index) => (
                        <Badge key={index} variant="destructive" className="mr-1 mt-1">
                          {warning}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500">Loading flight data...</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AINO Intelligence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {ainoAlerts.length > 0 ? (
                  ainoAlerts.map((alert, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium">{alert.source}:</span>
                      {alert.source === 'NOTAM' ? (
                        <Badge variant={alert.data.risk_analysis?.risk_level === 'HIGH' ? 'destructive' : 'default'} className="ml-2">
                          {alert.data.risk_analysis?.risk_level || 'NORMAL'}
                        </Badge>
                      ) : (
                        <span className="ml-2 text-green-600">Active</span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500">Loading intelligence data...</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Training Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Boeing 787 Digital Twin */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Boeing 787 Digital Twin - {selectedScenario.flightId}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-96">
                  <Boeing787DigitalTwin flightId={selectedScenario.flightId} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Training Objectives */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Training Objectives</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedScenario.objectives.map((objective, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{objective}</span>
                      <Button
                        size="sm"
                        variant={trainingProgress[objective] ? "default" : "outline"}
                        onClick={() => completeObjective(objective)}
                        disabled={!isScenarioActive}
                      >
                        {trainingProgress[objective] ? '✓' : '○'}
                      </Button>
                    </div>
                  ))}
                </div>

                {selectedScenario.emergencyType && (
                  <Alert className="mt-4">
                    <AlertDescription>
                      <strong>Emergency Scenario:</strong> {selectedScenario.emergencyType}
                    </AlertDescription>
                  </Alert>
                )}

                {selectedScenario.weatherConditions && (
                  <Alert className="mt-4">
                    <AlertDescription>
                      <strong>Weather:</strong> {selectedScenario.weatherConditions}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* AINO Integration Panel */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>AINO Systems Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>ML Flight Analysis</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>NOTAM Intelligence</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Economic Analysis</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Weather Integration</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Fuel Optimization</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Scenario Information */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Scenario Details: {selectedScenario.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="procedures">Procedures</TabsTrigger>
                  <TabsTrigger value="intelligence">Intelligence Data</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="mt-4">
                  <div className="prose max-w-none">
                    <p>{selectedScenario.description}</p>
                    <h4>Learning Objectives:</h4>
                    <ul>
                      {selectedScenario.objectives.map((objective, index) => (
                        <li key={index}>{objective}</li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>
                
                <TabsContent value="procedures" className="mt-4">
                  <div className="prose max-w-none">
                    <h4>Standard Operating Procedures:</h4>
                    <ol>
                      <li>Review current flight status and aircraft systems</li>
                      <li>Assess AINO intelligence alerts and advisories</li>
                      <li>Coordinate with operations center as required</li>
                      <li>Execute appropriate procedures based on scenario conditions</li>
                      <li>Monitor aircraft performance and fuel status</li>
                      <li>Update passenger communications as necessary</li>
                    </ol>
                  </div>
                </TabsContent>
                
                <TabsContent value="intelligence" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ainoAlerts.map((alert, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle className="text-lg">{alert.source}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                            {JSON.stringify(alert.data, null, 2)}
                          </pre>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}