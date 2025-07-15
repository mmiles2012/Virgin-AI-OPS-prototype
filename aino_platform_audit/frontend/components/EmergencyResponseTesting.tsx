import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertTriangle, 
  Activity, 
  Fuel, 
  Zap, 
  Shield, 
  Timer,
  CheckCircle,
  Plane
} from 'lucide-react';

import DecisionModal from './DecisionModal';
import type { DecisionOption } from './DecisionModal';

interface EmergencyState {
  id: string;
  type: string;
  severity: string;
  flightNumber: string;
  description: string;
  timestamp: string;
}

const EmergencyResponseTesting: React.FC = () => {
  const [emergencies, setEmergencies] = useState<EmergencyState[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState('');
  const [customFlightData, setCustomFlightData] = useState('');
  const [decisionOptions, setDecisionOptions] = useState<DecisionOption[]>([]);
  const [currentEmergency, setCurrentEmergency] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const scenarioTemplates = {
    medical: {
      flightNumber: "VS001",
      altitude: 37000,
      fuelRemaining: 75,
      warnings: ["MEDICAL EMERGENCY"],
      currentStatus: "CRUISING",
      passengerCount: 287,
      position: { lat: 45.5, lon: -73.6 }
    },
    fuel: {
      flightNumber: "VS103", 
      altitude: 5000,
      fuelRemaining: 12,
      warnings: ["LOW FUEL", "MINIMUM FUEL"],
      currentStatus: "APPROACHING",
      passengerCount: 345,
      position: { lat: 33.6, lon: -84.4 }
    },
    technical: {
      flightNumber: "VS355",
      altitude: 41000, 
      fuelRemaining: 65,
      warnings: ["ENGINE FAILURE", "HYDRAULIC SYSTEM"],
      currentStatus: "EMERGENCY DESCENT",
      passengerCount: 298,
      position: { lat: 19.1, lon: 72.9 }
    }
  };

  useEffect(() => {
    fetchActiveEmergencies();
    const interval = setInterval(fetchActiveEmergencies, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveEmergencies = async () => {
    try {
      const response = await fetch('/api/aviation/emergency/active');
      const data = await response.json();
      
      if (data.success) {
        setEmergencies(data.emergencies || []);
      }
    } catch (error) {
      console.error('Failed to fetch emergencies:', error);
    }
  };

  const triggerEmergency = async (scenario: string) => {
    setIsLoading(true);
    
    try {
      const template = scenarioTemplates[scenario as keyof typeof scenarioTemplates];
      if (!template) return;

      const response = await fetch('/api/aviation/emergency/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flightState: template,
          additionalData: {
            weather: "moderate",
            nearbyAirports: ["KJFK", "KLGA", "KEWR"]
          }
        })
      });

      const result = await response.json();
      
      if (result.success && result.emergency_detected) {
        setCurrentEmergency(result.emergency);
        generateDecisionOptions(scenario, result.emergency);
        setIsModalOpen(true);
        fetchActiveEmergencies();
      }
    } catch (error) {
      console.error('Emergency detection failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerCustomEmergency = async () => {
    if (!customFlightData.trim()) return;
    
    setIsLoading(true);
    
    try {
      const flightState = JSON.parse(customFlightData);
      
      const response = await fetch('/api/aviation/emergency/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flightState,
          additionalData: {
            weather: "moderate",
            nearbyAirports: ["KJFK", "KLGA", "KEWR"]
          }
        })
      });

      const result = await response.json();
      
      if (result.success && result.emergency_detected) {
        setCurrentEmergency(result.emergency);
        generateDecisionOptions('custom', result.emergency);
        setIsModalOpen(true);
        fetchActiveEmergencies();
      }
    } catch (error) {
      console.error('Custom emergency failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateDecisionOptions = (scenario: string, emergency: any): DecisionOption[] => {
    const options: DecisionOption[] = [];

    if (scenario === 'medical' || emergency?.type === 'medical') {
      options.push({
        id: 'immediate-divert',
        title: 'Immediate Diversion to Nearest Airport',
        description: 'Land at nearest suitable airport for medical emergency',
        riskLevel: 'medium',
        impact: { cost: 45000, delay: 120, safety: 95, passengers: 287 },
        requirements: ['ATC Priority', 'Medical Team', 'Ground Support'],
        timeline: 'Execute within 10 minutes',
        confidence: 95,
        decisionScore: 88.5
      });
    }

    if (scenario === 'fuel' || emergency?.type === 'fuel') {
      options.push({
        id: 'emergency-landing',
        title: 'Emergency Landing - Nearest Airport',
        description: 'Immediate landing due to critical fuel state',
        riskLevel: 'critical',
        impact: { cost: 75000, delay: 180, safety: 90, passengers: 345 },
        requirements: ['Emergency Declaration', 'Priority Landing', 'Fuel Trucks'],
        timeline: 'Execute immediately',
        confidence: 98,
        decisionScore: 92.8
      });
    }

    if (scenario === 'technical' || emergency?.type === 'technical') {
      options.push({
        id: 'single-engine-approach',
        title: 'Single Engine Approach to Major Airport',
        description: 'Execute single engine approach to airport with long runway',
        riskLevel: 'high',
        impact: { cost: 125000, delay: 240, safety: 80, passengers: 298 },
        requirements: ['Emergency Services', 'Long Runway', 'Technical Support'],
        timeline: 'Execute within 20 minutes',
        confidence: 82,
        decisionScore: 85.4
      });
    }

    setDecisionOptions(options);
    return options;
  };

  const handleDecision = async (optionId: string, decisionMaker: 'crew' | 'operations' | 'ai') => {
    console.log(`Decision made: ${optionId} by ${decisionMaker}`);
    
    // Here you would typically update the emergency status
    if (currentEmergency?.id) {
      try {
        await fetch(`/api/aviation/emergency/${currentEmergency.id}/action/${optionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'executed', decisionMaker })
        });
      } catch (error) {
        console.error('Failed to update emergency:', error);
      }
    }
    
    fetchActiveEmergencies();
  };

  const getEmergencyIcon = (type: string) => {
    switch (type) {
      case 'medical': return <Activity className="h-5 w-5 text-red-400" />;
      case 'technical': return <Zap className="h-5 w-5 text-orange-400" />;
      case 'fuel': return <Fuel className="h-5 w-5 text-yellow-400" />;
      default: return <Shield className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="h-8 w-8 text-orange-400" />
          <div>
            <h1 className="text-3xl font-bold">Emergency Response Testing</h1>
            <p className="text-gray-400">Test Emergency Response Coordinator and DecisionModal Integration</p>
          </div>
        </div>

        {/* Quick Test Scenarios */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-blue-400" />
              Quick Test Scenarios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Button
                onClick={() => triggerEmergency('medical')}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
              >
                <Activity className="h-4 w-4" />
                Medical Emergency
              </Button>
              <Button
                onClick={() => triggerEmergency('fuel')}
                disabled={isLoading}
                className="bg-yellow-600 hover:bg-yellow-700 flex items-center gap-2"
              >
                <Fuel className="h-4 w-4" />
                Fuel Emergency
              </Button>
              <Button
                onClick={() => triggerEmergency('technical')}
                disabled={isLoading}
                className="bg-orange-600 hover:bg-orange-700 flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                Technical Emergency
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Custom Emergency Testing */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>Custom Emergency Testing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Enter custom flight state JSON..."
              value={customFlightData}
              onChange={(e) => setCustomFlightData(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white min-h-32"
            />
            <Button 
              onClick={triggerCustomEmergency}
              disabled={isLoading || !customFlightData.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Test Custom Emergency
            </Button>
          </CardContent>
        </Card>

        {/* Active Emergencies */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5 text-green-400" />
              Active Emergencies ({emergencies.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {emergencies.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p>No active emergencies - System ready</p>
              </div>
            ) : (
              <div className="space-y-3">
                {emergencies.map((emergency) => (
                  <div key={emergency.id} className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getEmergencyIcon(emergency.type)}
                      <div>
                        <div className="font-medium">{emergency.flightNumber}</div>
                        <div className="text-sm text-gray-400">{emergency.description}</div>
                      </div>
                    </div>
                    <Badge className={
                      emergency.severity === 'critical' ? 'bg-red-600' :
                      emergency.severity === 'high' ? 'bg-orange-600' :
                      'bg-yellow-600'
                    }>
                      {emergency.severity?.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span>Emergency Response Coordinator: Online</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span>DecisionModal Component: Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span>UK CAA Data Integration: Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span>Mathematical Decision Scoring: Enabled</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DecisionModal */}
      <DecisionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        options={decisionOptions}
        emergencyType={currentEmergency?.type}
        flightNumber={currentEmergency?.flightNumber}
        timeRemaining={300}
        onDecision={handleDecision}
      />
    </div>
  );
};

export default EmergencyResponseTesting;