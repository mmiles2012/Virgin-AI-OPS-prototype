import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CollapsibleCard from '@/components/ui/collapsible-card';
import { useScenario } from '../lib/stores/useScenario';
import { scenarios } from '../lib/medicalProtocols';
import { Play, Square, RotateCcw, AlertTriangle } from 'lucide-react';

interface ScenarioManagerProps {
  onEmergencyActivate: (active: boolean) => void;
}

export default function ScenarioManager({ onEmergencyActivate }: ScenarioManagerProps) {
  const { 
    currentScenario, 
    isActive, 
    scenarioProgress,
    decisionsMade,
    score,
    startScenario, 
    stopScenario, 
    resetScenario 
  } = useScenario();

  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');

  const handleStartScenario = () => {
    if (selectedScenarioId) {
      const scenario = scenarios.find(s => s.id === selectedScenarioId);
      if (scenario) {
        startScenario(scenario);
        onEmergencyActivate(true);
        console.log(`Started scenario: ${scenario.title}`);
      }
    }
  };

  const handleStopScenario = () => {
    stopScenario();
    onEmergencyActivate(false);
    console.log('Scenario stopped');
  };

  const handleResetScenario = () => {
    resetScenario();
    onEmergencyActivate(false);
    console.log('Scenario reset');
  };

  return (
    <CollapsibleCard 
      title="Select Training Scenario"
      icon={<AlertTriangle className="h-5 w-5" />}
      className="aviation-panel"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-blue-300 text-sm">Select Training Scenario</label>
          <Select value={selectedScenarioId} onValueChange={setSelectedScenarioId}>
            <SelectTrigger className="bg-gray-800 border-gray-600">
              <SelectValue placeholder="Choose a scenario..." />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              {scenarios.map((scenario) => (
                <SelectItem key={scenario.id} value={scenario.id}>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      scenario.severity === 'high' ? 'destructive' : 
                      scenario.severity === 'medium' ? 'default' : 'secondary'
                    } className="text-xs">
                      {scenario.severity.toUpperCase()}
                    </Badge>
                    {scenario.title}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Scenario Controls */}
        <div className="flex gap-2">
          <Button
            onClick={handleStartScenario}
            disabled={!selectedScenarioId || isActive}
            className="flex-1 bg-green-600 hover:bg-green-700"
            size="sm"
          >
            <Play className="h-4 w-4 mr-1" />
            Start
          </Button>
          <Button
            onClick={handleStopScenario}
            disabled={!isActive}
            className="flex-1 bg-red-600 hover:bg-red-700"
            size="sm"
          >
            <Square className="h-4 w-4 mr-1" />
            Stop
          </Button>
          <Button
            onClick={handleResetScenario}
            variant="outline"
            className="flex-1"
            size="sm"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>

        {/* Current Scenario Status */}
        {currentScenario && (
          <div className="border border-blue-500 rounded p-3 bg-blue-900/20">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="text-blue-300 font-medium">{currentScenario.title}</h4>
                <p className="text-blue-200 text-sm">{currentScenario.description}</p>
              </div>
              <Badge variant={isActive ? "default" : "secondary"}>
                {isActive ? "ACTIVE" : "INACTIVE"}
              </Badge>
            </div>

            {isActive && (
              <div className="space-y-2 mt-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-blue-300">Scenario Progress</span>
                    <span className="text-blue-200">{scenarioProgress}%</span>
                  </div>
                  <Progress value={scenarioProgress} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-300">Decisions Made</span>
                    <div className="text-white font-mono">{decisionsMade}</div>
                  </div>
                  <div>
                    <span className="text-blue-300">Current Score</span>
                    <div className="text-white font-mono">{score}/100</div>
                  </div>
                </div>

                {/* Learning Objectives */}
                <div className="border-t border-blue-500 pt-2">
                  <div className="text-blue-300 text-sm mb-1">Learning Objectives</div>
                  <ul className="text-blue-200 text-xs space-y-1">
                    {currentScenario.learningObjectives.map((objective, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-blue-400">•</span>
                        {objective}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick scenario info */}
        {selectedScenarioId && !currentScenario && (
          <div className="border border-gray-600 rounded p-3 bg-gray-900/20">
            {(() => {
              const scenario = scenarios.find(s => s.id === selectedScenarioId);
              return scenario ? (
                <div>
                  <h4 className="text-gray-300 font-medium mb-1">{scenario.title}</h4>
                  <p className="text-gray-400 text-sm mb-2">{scenario.description}</p>
                  <div className="flex gap-2 text-xs">
                    <Badge variant="outline" className="text-gray-400">
                      Duration: {scenario.estimatedDuration}
                    </Badge>
                    <Badge variant="outline" className="text-gray-400">
                      Severity: {scenario.severity}
                    </Badge>
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        )}

        {/* Training Tips */}
        <div className="bg-yellow-900/20 border border-yellow-500 rounded p-3">
          <h4 className="text-yellow-300 font-medium text-sm mb-1">Training Tips</h4>
          <ul className="text-yellow-200 text-xs space-y-1">
            <li>• Communication between crew and operations is key</li>
            <li>• Consider all factors: medical urgency, fuel, weather</li>
            <li>• Practice decision-making under time pressure</li>
            <li>• Review post-scenario analysis for improvement</li>
          </ul>
        </div>
      </div>
    </CollapsibleCard>
  );
}
