import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { AlertTriangle, Plane, Clock, DollarSign, Users, MessageSquare, Hotel, Fuel, Wrench, Globe, CheckCircle, XCircle } from 'lucide-react';

interface DisruptionEvent {
  id: string;
  type: 'weather' | 'technical' | 'atc' | 'crew' | 'airport';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedFlights: string[];
  estimatedDuration: number;
  firstDetected: string;
  location: string;
  status: 'active' | 'resolving' | 'resolved';
}

interface RecoveryScenario {
  id: string;
  name: string;
  confidence: number;
  estimatedCost: number;
  passengerImpact: number;
  timeToImplement: number;
  eu261Risk: number;
  actions: string[];
  pros: string[];
  cons: string[];
}

interface AutomatedService {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  estimatedTime: number;
  cost: number;
  provider: string;
}

export default function DisruptionResponseConsole() {
  const [disruptions, setDisruptions] = useState<DisruptionEvent[]>([]);
  const [selectedDisruption, setSelectedDisruption] = useState<DisruptionEvent | null>(null);
  const [recoveryScenarios, setRecoveryScenarios] = useState<RecoveryScenario[]>([]);
  const [scenarioAllocations, setScenarioAllocations] = useState<{[scenarioId: string]: string[]}>({});
  const [automatedServices, setAutomatedServices] = useState<AutomatedService[]>([]);
  const [isProcessingRecovery, setIsProcessingRecovery] = useState(false);
  const [activeWorkflow, setActiveWorkflow] = useState<string>('');
  const [communicationStatus, setCommunicationStatus] = useState<{[key: string]: 'idle' | 'sending' | 'sent'}>({
    passengers: 'idle',
    crew: 'idle',
    stakeholders: 'idle'
  });
  const [communicationResults, setCommunicationResults] = useState<string[]>([]);

  useEffect(() => {
    fetchActiveDisruptions();
    const interval = setInterval(fetchActiveDisruptions, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveDisruptions = async () => {
    try {
      const response = await fetch('/api/disruption/active');
      const data = await response.json();
      if (data.success) {
        setDisruptions(data.disruptions);
      }
    } catch (error) {
      console.error('Failed to fetch disruptions:', error);
    }
  };

  const generateRecoveryScenarios = async (disruptionId: string) => {
    try {
      const response = await fetch(`/api/disruption/${disruptionId}/recovery-scenarios`);
      const data = await response.json();
      if (data.success) {
        setRecoveryScenarios(data.scenarios);
      }
    } catch (error) {
      console.error('Failed to generate recovery scenarios:', error);
    }
  };

  const executeRecoveryScenario = async (scenarioId: string) => {
    setIsProcessingRecovery(true);
    setActiveWorkflow(`Executing ${recoveryScenarios.find(s => s.id === scenarioId)?.name}`);
    
    try {
      // Initialize automated services
      const services: AutomatedService[] = [
        {
          id: 'hotel',
          name: 'Passenger Accommodation',
          status: 'processing',
          estimatedTime: 15,
          cost: 12500,
          provider: 'LHR Hotel Partners'
        },
        {
          id: 'fuel',
          name: 'Fuel Supply Coordination',
          status: 'processing',
          estimatedTime: 20,
          cost: 45000,
          provider: 'BP Aviation'
        },
        {
          id: 'catering',
          name: 'Catering Services',
          status: 'processing',
          estimatedTime: 10,
          cost: 3200,
          provider: 'Gate Gourmet'
        },
        {
          id: 'ground',
          name: 'Ground Handling',
          status: 'processing',
          estimatedTime: 5,
          cost: 1800,
          provider: 'Swissport'
        },
        {
          id: 'engineering',
          name: 'Engineering Support',
          status: 'processing',
          estimatedTime: 45,
          cost: 8900,
          provider: 'Virgin Atlantic Engineering'
        }
      ];
      
      setAutomatedServices(services);

      // Simulate service completion
      for (let i = 0; i < services.length; i++) {
        setTimeout(() => {
          setAutomatedServices(prev => 
            prev.map(service => 
              service.id === services[i].id 
                ? { ...service, status: Math.random() > 0.1 ? 'completed' : 'failed' }
                : service
            )
          );
        }, (i + 1) * 3000);
      }

      setTimeout(() => {
        setIsProcessingRecovery(false);
        setActiveWorkflow('Recovery plan executed successfully');
      }, 20000);

    } catch (error) {
      console.error('Recovery execution failed:', error);
      setIsProcessingRecovery(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getServiceStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'processing': return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  // Mock data for demonstration
  useEffect(() => {
    setDisruptions([
      {
        id: 'D001',
        type: 'weather',
        severity: 'high',
        title: 'Severe Thunderstorms - Boston Logan',
        description: 'Multiple severe thunderstorm cells affecting BOS approach corridors. Ground stop in effect.',
        affectedFlights: ['VS11', 'VS157', 'VS401'],
        estimatedDuration: 180,
        firstDetected: '14:23 UTC',
        location: 'KBOS',
        status: 'active'
      },
      {
        id: 'D002',
        type: 'technical',
        severity: 'critical',
        title: 'Aircraft G-VLIB Engine Issue',
        description: 'VS103 engine monitoring alert - aircraft on ground at LHR T3',
        affectedFlights: ['VS103'],
        estimatedDuration: 240,
        firstDetected: '13:45 UTC',
        location: 'EGLL-T3',
        status: 'active'
      }
    ]);

    setRecoveryScenarios([
      {
        id: 'R001',
        name: 'Aircraft Substitution + Passenger Reaccommodation',
        confidence: 87,
        estimatedCost: 125000,
        passengerImpact: 214,
        timeToImplement: 120,
        eu261Risk: 67000,
        actions: [
          'Deploy spare A350-1000 G-VLUX',
          'Transfer passengers to substitute aircraft',
          'Coordinate new crew assignment',
          'Arrange catering and fuel',
          'Update passenger notifications'
        ],
        pros: [
          'Maintains schedule integrity',
          'Minimal passenger disruption',
          'Lower EU261 exposure'
        ],
        cons: [
          'High operational cost',
          'Requires spare aircraft availability'
        ]
      },
      {
        id: 'R002',
        name: 'Cancel + Reaccommodate Next Day',
        confidence: 95,
        estimatedCost: 89000,
        passengerImpact: 214,
        timeToImplement: 45,
        eu261Risk: 124000,
        actions: [
          'Cancel VS103 departure',
          'Book passengers on VS105 next day',
          'Arrange hotel accommodation',
          'Process EU261 compensation',
          'Coordinate ground transportation'
        ],
        pros: [
          'Lower immediate cost',
          'Reduces operational complexity',
          'Allows proper maintenance'
        ],
        cons: [
          'High EU261 compensation',
          'Passenger satisfaction impact'
        ]
      },
      {
        id: 'R003',
        name: 'Weather Hold + Crew Rotation',
        confidence: 78,
        estimatedCost: 45000,
        passengerImpact: 180,
        timeToImplement: 180,
        eu261Risk: 89000,
        actions: [
          'Hold VS011 for weather clearance',
          'Rotate crew to maintain duty limits',
          'Coordinate ground handling delays',
          'Manage passenger communications',
          'Monitor meteorological updates'
        ],
        pros: [
          'Maintains aircraft availability',
          'Reduces substitution costs',
          'Preserves crew schedules'
        ],
        cons: [
          'Weather uncertainty',
          'Crew duty time pressure',
          'Passenger delay impact'
        ]
      }
    ]);

    // Set scenario allocations to specific disruptions
    setScenarioAllocations({
      'R001': ['TECH-VS103-001'], // Aircraft substitution for technical issue
      'R002': ['TECH-VS103-001'], // Cancellation option for technical issue
      'R003': ['WEATHER-LHR-001', 'CREW-VS011-001'] // Weather hold for weather & crew issues
    });
  }, []);

  const sendCommunication = async (type: 'passengers' | 'crew' | 'stakeholders') => {
    setCommunicationStatus(prev => ({ ...prev, [type]: 'sending' }));
    
    try {
      // Simulate realistic communication workflow
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));
      
      const messages = {
        passengers: [
          'SMS alerts sent to 342 affected passengers',
          'Push notifications delivered to Virgin Atlantic app users',
          'Email updates sent with rebooking options',
          'WhatsApp Business messages sent with real-time updates'
        ],
        crew: [
          'Crew scheduling alerts sent to affected flight crews',
          'Duty time adjustments communicated to crew planning',
          'Hotel accommodation confirmed for diverted crews',
          'Rest requirements updated in crew management system'
        ],
        stakeholders: [
          'Airport operations centers notified of delays',
          'Ground handling partners alerted for resource reallocation',
          'Catering services updated for revised schedules',
          'Fuel suppliers coordinated for diversion requirements'
        ]
      };
      
      const randomMessage = messages[type][Math.floor(Math.random() * messages[type].length)];
      setCommunicationResults(prev => [`${new Date().toLocaleTimeString()}: ${randomMessage}`, ...prev.slice(0, 9)]);
      setCommunicationStatus(prev => ({ ...prev, [type]: 'sent' }));
      
      // Reset status after 5 seconds
      setTimeout(() => {
        setCommunicationStatus(prev => ({ ...prev, [type]: 'idle' }));
      }, 5000);
      
    } catch (error) {
      console.error('Communication error:', error);
      setCommunicationStatus(prev => ({ ...prev, [type]: 'idle' }));
    }
  };

  return (
    <div className="w-full h-screen bg-gray-900 text-white overflow-hidden flex flex-col">
      <div className="p-6 flex-shrink-0">
        <h1 className="text-2xl font-bold text-white mb-2">Disruption Response Console</h1>
        <p className="text-gray-400">AI-powered disruption management and recovery orchestration</p>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="active" className="w-full h-full flex flex-col">
          <div className="px-6 flex-shrink-0">
            <TabsList className="grid w-full grid-cols-4 bg-gray-800">
              <TabsTrigger value="active">Active Disruptions</TabsTrigger>
              <TabsTrigger value="scenarios">Recovery Scenarios</TabsTrigger>
              <TabsTrigger value="execution">Automated Services</TabsTrigger>
              <TabsTrigger value="communication">Communications</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="active" className="flex-1 overflow-hidden p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
              {/* Disruption List */}
              <Card className="bg-gray-800 border-gray-700 flex flex-col">
                <CardHeader className="flex-shrink-0">
                  <CardTitle className="text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Active Disruptions ({disruptions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
                  <div className="space-y-4">
                    {disruptions.map((disruption) => (
                    <div
                      key={disruption.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedDisruption?.id === disruption.id
                          ? 'border-blue-500 bg-blue-900/20'
                          : 'border-gray-600 bg-gray-700/50 hover:bg-gray-700'
                      }`}
                      onClick={() => {
                        setSelectedDisruption(disruption);
                        generateRecoveryScenarios(disruption.id);
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={`${getSeverityColor(disruption.severity)} text-white`}>
                            {disruption.severity.toUpperCase()}
                          </Badge>
                          <span className="text-sm text-gray-400">{disruption.id}</span>
                        </div>
                        <span className="text-xs text-gray-400">{disruption.firstDetected}</span>
                      </div>
                      <h3 className="font-medium text-white mb-1">{disruption.title}</h3>
                      <p className="text-sm text-gray-300 mb-2">{disruption.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>{disruption.affectedFlights.length} flights affected</span>
                        <span>{disruption.estimatedDuration}min duration</span>
                        <span>{disruption.location}</span>
                      </div>
                    </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Disruption Details */}
              <Card className="bg-gray-800 border-gray-700 flex flex-col">
                <CardHeader className="flex-shrink-0">
                  <CardTitle className="text-white">
                    {selectedDisruption ? 'Disruption Analysis' : 'Select a Disruption'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
                {selectedDisruption ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-400">Type</span>
                        <p className="text-white capitalize">{selectedDisruption.type}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">Status</span>
                        <p className="text-white capitalize">{selectedDisruption.status}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">Duration</span>
                        <p className="text-white">{selectedDisruption.estimatedDuration} minutes</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">Location</span>
                        <p className="text-white">{selectedDisruption.location}</p>
                      </div>
                    </div>

                    <div>
                      <span className="text-sm text-gray-400">Affected Flights</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedDisruption.affectedFlights.map((flight) => (
                          <Badge key={flight} variant="outline" className="text-white border-gray-600">
                            {flight}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-600">
                      <Button
                        onClick={() => generateRecoveryScenarios(selectedDisruption.id)}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        Generate Recovery Scenarios
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    Select a disruption to view details and generate recovery scenarios
                  </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="scenarios" className="flex-1 overflow-hidden p-6">
            <div className="h-full overflow-y-auto">
              {/* Scenario Allocation Summary */}
              <Card className="bg-gray-800 border-gray-700 mb-6">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Recovery Scenario Allocations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {disruptions.map((disruption) => {
                      const allocatedScenarios = Object.entries(scenarioAllocations)
                        .filter(([_, disruptionIds]) => disruptionIds.includes(disruption.id))
                        .map(([scenarioId, _]) => recoveryScenarios.find(s => s.id === scenarioId)?.name || scenarioId);
                      
                      return (
                        <div key={disruption.id} className="bg-gray-700 p-3 rounded">
                          <div className="text-white font-medium text-sm mb-2">
                            {disruption.title.replace('Aircraft G-VLIB Engine Issue', 'VS103 Engine')
                                           .replace('LHR Weather Disruption', 'LHR Weather')
                                           .replace('VS011 Crew Availability', 'VS011 Crew')}
                          </div>
                          <div className="space-y-1">
                            {allocatedScenarios.length > 0 ? allocatedScenarios.map((scenarioName, idx) => (
                              <span key={idx} className="inline-block px-2 py-1 text-xs bg-green-600 text-white rounded mr-1">
                                {scenarioName?.split(' + ')[0] || 'Unknown'}
                              </span>
                            )) : (
                              <span className="text-xs text-gray-400">No scenarios assigned</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {recoveryScenarios.map((scenario) => {
                  const assignedDisruptions = scenarioAllocations[scenario.id] || [];
                  const assignedDisruptionNames = assignedDisruptions.map(disruptionId => {
                    const disruption = disruptions.find(d => d.id === disruptionId);
                    return disruption ? disruption.title : disruptionId;
                  });
                  
                  return (
              <Card key={scenario.id} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-lg">{scenario.name}</CardTitle>
                    <Badge className="bg-green-600 text-white">
                      {scenario.confidence}% Confidence
                    </Badge>
                  </div>
                  {/* Show which disruptions this scenario addresses */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    <span className="text-xs text-gray-400 mr-2">Addresses:</span>
                    {assignedDisruptionNames.map((name, idx) => (
                      <span 
                        key={idx}
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded-full"
                      >
                        {name.replace('Aircraft G-VLIB Engine Issue', 'VS103 Engine')
                             .replace('LHR Weather Disruption', 'LHR Weather')
                             .replace('VS011 Crew Availability', 'VS011 Crew')}
                      </span>
                    ))}
                    {assignedDisruptionNames.length === 0 && (
                      <span className="px-2 py-1 text-xs bg-gray-600 text-gray-300 rounded-full">
                        No specific assignment
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-gray-700 rounded">
                        <DollarSign className="w-5 h-5 text-green-400 mx-auto mb-1" />
                        <div className="text-lg font-bold text-white">
                          £{(scenario.estimatedCost / 1000).toFixed(0)}k
                        </div>
                        <div className="text-xs text-gray-400">Total Cost</div>
                      </div>
                      <div className="text-center p-3 bg-gray-700 rounded">
                        <Users className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                        <div className="text-lg font-bold text-white">{scenario.passengerImpact}</div>
                        <div className="text-xs text-gray-400">Passengers</div>
                      </div>
                      <div className="text-center p-3 bg-gray-700 rounded">
                        <Clock className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                        <div className="text-lg font-bold text-white">{scenario.timeToImplement}m</div>
                        <div className="text-xs text-gray-400">Implementation</div>
                      </div>
                      <div className="text-center p-3 bg-gray-700 rounded">
                        <AlertTriangle className="w-5 h-5 text-red-400 mx-auto mb-1" />
                        <div className="text-lg font-bold text-white">
                          £{(scenario.eu261Risk / 1000).toFixed(0)}k
                        </div>
                        <div className="text-xs text-gray-400">EU261 Risk</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Required Actions</h4>
                      <ul className="space-y-1">
                        {scenario.actions.map((action, index) => (
                          <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                            <span className="text-blue-400 mt-1">•</span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Pros and Cons */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-green-400 mb-2">Advantages</h4>
                        <ul className="space-y-1">
                          {scenario.pros.map((pro, index) => (
                            <li key={index} className="text-xs text-gray-300 flex items-start gap-1">
                              <span className="text-green-400">+</span>
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-red-400 mb-2">Disadvantages</h4>
                        <ul className="space-y-1">
                          {scenario.cons.map((con, index) => (
                            <li key={index} className="text-xs text-gray-300 flex items-start gap-1">
                              <span className="text-red-400">-</span>
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <Button
                      onClick={() => executeRecoveryScenario(scenario.id)}
                      disabled={isProcessingRecovery}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {isProcessingRecovery ? 'Executing...' : 'Execute Recovery Plan'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="execution" className="flex-1 overflow-hidden p-6">
            <Card className="bg-gray-800 border-gray-700 h-full flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="text-white">Automated Service Coordination</CardTitle>
              {activeWorkflow && (
                <p className="text-blue-400 text-sm">{activeWorkflow}</p>
              )}
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {automatedServices.length > 0 ? (
                <div className="space-y-4">
                  {automatedServices.map((service) => (
                    <div key={service.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getServiceStatusIcon(service.status)}
                        <div>
                          <h3 className="font-medium text-white">{service.name}</h3>
                          <p className="text-sm text-gray-400">{service.provider}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-medium">£{service.cost.toLocaleString()}</div>
                        <div className="text-sm text-gray-400">{service.estimatedTime}min</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  Execute a recovery scenario to see automated service coordination
                </div>
              )}
            </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="communication" className="flex-1 overflow-hidden p-6">
            <Card className="bg-gray-800 border-gray-700 h-full flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Communication Workflows
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    onClick={() => sendCommunication('passengers')}
                    disabled={communicationStatus.passengers === 'sending'}
                    className={`h-20 flex flex-col items-center justify-center ${
                      communicationStatus.passengers === 'sent' 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    <Users className="w-6 h-6 mb-2" />
                    {communicationStatus.passengers === 'sending' ? 'Sending...' : 
                     communicationStatus.passengers === 'sent' ? 'Sent ✓' : 'Notify Passengers'}
                  </Button>
                  
                  <Button 
                    onClick={() => sendCommunication('crew')}
                    disabled={communicationStatus.crew === 'sending'}
                    className={`h-20 flex flex-col items-center justify-center ${
                      communicationStatus.crew === 'sent' 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-orange-600 hover:bg-orange-700'
                    }`}
                  >
                    <Plane className="w-6 h-6 mb-2" />
                    {communicationStatus.crew === 'sending' ? 'Sending...' : 
                     communicationStatus.crew === 'sent' ? 'Sent ✓' : 'Alert Crew'}
                  </Button>
                  
                  <Button 
                    onClick={() => sendCommunication('stakeholders')}
                    disabled={communicationStatus.stakeholders === 'sending'}
                    className={`h-20 flex flex-col items-center justify-center ${
                      communicationStatus.stakeholders === 'sent' 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                  >
                    <Globe className="w-6 h-6 mb-2" />
                    {communicationStatus.stakeholders === 'sending' ? 'Sending...' : 
                     communicationStatus.stakeholders === 'sent' ? 'Sent ✓' : 'Stakeholders'}
                  </Button>
                </div>
                
                {/* Communication Activity Log */}
                {communicationResults.length > 0 && (
                  <Card className="bg-gray-700 border-gray-600 mt-4">
                    <CardHeader>
                      <CardTitle className="text-white text-sm">Communication Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {communicationResults.map((result, index) => (
                          <div key={index} className="text-sm text-gray-300 p-2 bg-gray-800 rounded">
                            {result}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <div className="text-center text-gray-400 py-2 text-sm">
                  Click buttons above to trigger real-time communication workflows
                </div>
              </div>
            </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}