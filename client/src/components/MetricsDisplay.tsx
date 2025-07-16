import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import CollapsibleCard from '@/components/ui/collapsible-card';
import { useFlightState } from '../lib/stores/useFlightState';
import { useScenario } from '../lib/stores/useScenario';
import { TrendingUp, Clock, DollarSign, Target } from 'lucide-react';

interface MetricsDisplayProps {
  draggable?: boolean;
}

export default function MetricsDisplay({ draggable = false }: MetricsDisplayProps) {
  const { fuelRemaining, airspeed, altitude } = useFlightState();
  const { 
    decisionsMade, 
    score, 
    scenarioProgress, 
    currentScenario,
    costAnalysis 
  } = useScenario();


  // Calculate performance metrics
  const fuelEfficiency = Math.max(0, 100 - (fuelRemaining / 200000) * 100);
  const timeToDecision = currentScenario ? Math.random() * 3 + 1 : 0; // Simulated
  const overallPerformance = Math.min(100, (score + fuelEfficiency) / 2);

  return (
    <CollapsibleCard 
      title="Performance Metrics"
      icon={<TrendingUp className="h-5 w-5" />}
      className="aviation-panel h-full"
      draggable={draggable}
      initialPosition={{ x: 300, y: window.innerHeight - 400 }}
    >
      <div className="space-y-4">
        {/* Flight Performance */}
        <div className="space-y-3">
          <h4 className="text-blue-300 font-medium text-sm">Flight Performance</h4>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-center">
              <div className="text-blue-300">Fuel Efficiency</div>
              <div className="text-2xl font-mono text-green-400">{fuelEfficiency.toFixed(0)}%</div>
            </div>
            <div className="text-center">
              <div className="text-blue-300">Flight Score</div>
              <div className="text-2xl font-mono text-blue-400">{score}/100</div>
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-blue-300">Overall Performance</span>
                <span className="text-blue-200">{overallPerformance.toFixed(0)}%</span>
              </div>
              <Progress value={overallPerformance} className="h-2" />
            </div>
          </div>
        </div>

        {/* Decision Metrics */}
        {currentScenario && (
          <div className="space-y-3 border-t border-blue-500 pt-3">
            <h4 className="text-blue-300 font-medium text-sm flex items-center gap-1">
              <Target className="h-4 w-4" />
              Decision Analysis
            </h4>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-blue-300">Decisions Made</div>
                <div className="text-white font-mono">{decisionsMade}</div>
              </div>
              <div>
                <div className="text-blue-300">Response Time</div>
                <div className="text-white font-mono">{timeToDecision.toFixed(1)}s</div>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-blue-300">Scenario Progress</span>
                  <span className="text-blue-200">{scenarioProgress}%</span>
                </div>
                <Progress value={scenarioProgress} className="h-2" />
              </div>
            </div>

            {/* Decision Quality Indicators */}
            <div className="space-y-1">
              <Badge variant="default" className="w-full justify-center text-xs">
                Communication: Excellent
              </Badge>
              <Badge variant="default" className="w-full justify-center text-xs">
                Safety Protocol: Good
              </Badge>
              <Badge variant={timeToDecision < 2 ? "default" : "destructive"} className="w-full justify-center text-xs">
                Response Time: {timeToDecision < 2 ? "Fast" : "Slow"}
              </Badge>
            </div>
          </div>
        )}

        {/* Cost Analysis */}
        <div className="space-y-3 border-t border-blue-500 pt-3">
          <h4 className="text-blue-300 font-medium text-sm flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            Cost Impact
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-300">Fuel Cost</span>
              <span className="text-white">${(fuelRemaining * 0.02).toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-300">Time Delay</span>
              <span className="text-white">${currentScenario ? '15,000' : '0'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-300">Passenger Impact</span>
              <span className="text-white">${currentScenario ? '25,000' : '0'}</span>
            </div>
            <div className="flex justify-between font-medium border-t border-gray-600 pt-1">
              <span className="text-blue-300">Total Cost</span>
              <span className="text-yellow-400">
                ${(fuelRemaining * 0.02 + (currentScenario ? 40000 : 0)).toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Flight Data */}
        <div className="space-y-3 border-t border-blue-500 pt-3">
          <h4 className="text-blue-300 font-medium text-sm flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Flight Status
          </h4>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center border border-gray-600 rounded p-2">
              <div className="text-blue-300">Altitude</div>
              <div className="text-white font-mono">{altitude.toFixed(0)} ft</div>
            </div>
            <div className="text-center border border-gray-600 rounded p-2">
              <div className="text-blue-300">Speed</div>
              <div className="text-white font-mono">{airspeed.toFixed(0)} kts</div>
            </div>
            <div className="text-center border border-gray-600 rounded p-2">
              <div className="text-blue-300">Fuel</div>
              <div className="text-white font-mono">{(fuelRemaining / 1000).toFixed(0)}k lbs</div>
            </div>
            <div className="text-center border border-gray-600 rounded p-2">
              <div className="text-blue-300">Range</div>
              <div className="text-white font-mono">{(fuelRemaining / 3.5).toFixed(0)} nm</div>
            </div>
          </div>
        </div>

        {/* Performance Rating */}
        <div className="bg-green-900/20 border border-green-500 rounded p-3">
          <div className="text-center">
            <div className="text-green-300 text-sm">Current Rating</div>
            <div className="text-2xl font-bold text-green-400">
              {overallPerformance >= 90 ? 'EXCELLENT' :
               overallPerformance >= 75 ? 'GOOD' :
               overallPerformance >= 60 ? 'SATISFACTORY' : 'NEEDS IMPROVEMENT'}
            </div>
            <div className="text-green-200 text-xs mt-1">
              Training Session Performance
            </div>
          </div>
        </div>
      </div>
    </CollapsibleCard>
  );
}
