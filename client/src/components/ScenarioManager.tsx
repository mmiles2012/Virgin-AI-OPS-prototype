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

        {/* Compact Current Scenario Status */}
        {currentScenario && (
          <div className="border border-blue-500 rounded p-2 bg-blue-900/20">
            <div className="flex justify-between items-center mb-1">
              <div className="flex-1 min-w-0">
                <h4 className="text-blue-300 font-medium text-sm truncate">{currentScenario.title}</h4>
              </div>
              <Badge variant={isActive ? "default" : "secondary"} className="text-xs ml-2">
                {isActive ? "ACTIVE" : "INACTIVE"}
              </Badge>
            </div>

            {isActive && (
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-blue-300">Progress: {scenarioProgress}%</span>
                  <span className="text-blue-200">Score: {score}/100</span>
                </div>
                <Progress value={scenarioProgress} className="h-1" />
              </div>
            )}
          </div>
        )}

        {/* Compact scenario info */}
        {selectedScenarioId && !currentScenario && (
          <div className="border border-gray-600 rounded p-2 bg-gray-900/20">
            {(() => {
              const scenario = scenarios.find(s => s.id === selectedScenarioId);
              return scenario ? (
                <div>
                  <h4 className="text-gray-300 font-medium text-sm mb-1">{scenario.title}</h4>
                  <div className="flex gap-2 text-xs">
                    <Badge variant="outline" className="text-gray-400 text-xs">
                      {scenario.estimatedDuration}
                    </Badge>
                    <Badge variant="outline" className="text-gray-400 text-xs">
                      {scenario.severity}
                    </Badge>
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        )}
      </div>
    </CollapsibleCard>
  );
}
