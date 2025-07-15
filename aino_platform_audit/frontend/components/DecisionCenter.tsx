import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DiversionOutcomes from './DiversionOutcomes';
import { 
  Brain, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  DollarSign,
  CheckCircle,
  XCircle,
  Timer
} from 'lucide-react';

interface DecisionOption {
  id: string;
  title: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  costImpact: number;
  timeImpact: number;
  safetyScore: number;
  feasibility: number;
  consequences: {
    fuel: number;
    passengers: number;
    crew: number;
    operational: number;
  };
  requirements: string[];
}

interface DecisionContext {
  timestamp: string;
  availableOptions: DecisionOption[];
  timeToDecision: number;
  stakeholders: {
    crew: boolean;
    operations: boolean;
    medical: boolean;
    atc: boolean;
  };
  constraints: {
    fuelLimits: boolean;
    weatherLimits: boolean;
    airspaceLimits: boolean;
    medicalUrgency: boolean;
  };
}

interface DecisionAnalysis {
  currentSituation: {
    flightWarnings: Array<{
      type: string;
      severity: string;
      message: string;
      timeToAction: number;
    }>;
    riskAssessment: {
      level: string;
      score: number;
    };
    criticalFactors: Array<{
      factor: string;
      impact: string;
      description: string;
    }>;
    timeConstraints: Array<{
      constraint: string;
      timeLimit: number;
      description: string;
    }>;
  };
  recommendations: {
    immediate: string[];
    strategic: string[];
  };
  stakeholderImpact: {
    passengers: {
      affected: number;
      impact: string;
      concerns: string[];
    };
    crew: {
      affected: number;
      impact: string;
      concerns: string[];
    };
    airline: {
      impact: string;
      concerns: string[];
    };
    airports: {
      impact: string;
      concerns: string[];
    };
  };
}

export default function DecisionCenter() {
  const [decisionContext, setDecisionContext] = useState<DecisionContext | null>(null);
  const [analysis, setAnalysis] = useState<DecisionAnalysis | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [decisionTimer, setDecisionTimer] = useState<number>(0);
  const [aiRecommendation, setAiRecommendation] = useState<DecisionOption | null>(null);
  const [decisionHistory, setDecisionHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchDecisionContext();
    fetchAnalysis();
    fetchDecisionHistory();
    
    const interval = setInterval(() => {
      fetchDecisionContext();
      fetchAnalysis();
      
      if (decisionContext?.timeToDecision) {
        setDecisionTimer(prev => Math.max(0, prev - 1));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (decisionContext) {
      setDecisionTimer(decisionContext.timeToDecision);
    }
  }, [decisionContext]);

  const fetchDecisionContext = async () => {
    try {
      const response = await fetch('/api/decisions/context');
      const data = await response.json();
      
      if (data.available) {
        setDecisionContext(data.context);
        setAiRecommendation(data.aiRecommendation);
      } else {
        setDecisionContext(null);
        setAiRecommendation(null);
      }
    } catch (error) {
      console.error('Error fetching decision context:', error);
    }
  };

  const fetchAnalysis = async () => {
    try {
      const response = await fetch('/api/decisions/analysis');
      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      console.error('Error fetching analysis:', error);
    }
  };

  const fetchDecisionHistory = async () => {
    try {
      const response = await fetch('/api/decisions/history');
      const data = await response.json();
      setDecisionHistory(data.decisions || []);
    } catch (error) {
      console.error('Error fetching decision history:', error);
    }
  };

  const handleMakeDecision = async (decisionMaker: 'crew' | 'operations' | 'ai') => {
    if (!selectedOption || !decisionContext) return;

    setIsLoading(true);
    try {
      const startTime = Date.now();
      const responseTime = Math.max(1, (decisionContext.timeToDecision - decisionTimer));
      
      const response = await fetch('/api/decisions/make', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          optionId: selectedOption,
          decisionMaker,
          responseTime
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('Decision recorded:', result.outcome);
        console.log('Next steps:', result.nextSteps);
        
        // Refresh data
        await fetchDecisionContext();
        await fetchDecisionHistory();
        
        setSelectedOption('');
      } else {
        console.error('Decision failed:', result.error);
      }
    } catch (error) {
      console.error('Error making decision:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical': return 'bg-red-900 text-red-100 border-red-500';
      case 'high': return 'bg-orange-900 text-orange-100 border-orange-500';
      case 'medium': return 'bg-yellow-900 text-yellow-100 border-yellow-500';
      case 'low': return 'bg-green-900 text-green-100 border-green-500';
      default: return 'bg-gray-900 text-gray-100 border-gray-500';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!decisionContext && !analysis) {
    return (
      <div className="p-6 text-center">
        <div className="text-blue-300 mb-2">Decision Engine</div>
        <div className="text-blue-200 text-sm">
          No active decision contexts. Monitoring flight for decision points...
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <Tabs defaultValue="active" className="h-full">
        <TabsList className="grid w-full grid-cols-5 mb-4">
          <TabsTrigger value="active">Active Decisions</TabsTrigger>
          <TabsTrigger value="scenarios">Diversion Scenarios</TabsTrigger>
          <TabsTrigger value="analysis">Situation Analysis</TabsTrigger>
          <TabsTrigger value="stakeholders">Stakeholder Impact</TabsTrigger>
          <TabsTrigger value="history">Decision History</TabsTrigger>
        </TabsList>

        {/* Active Decisions Tab */}
        <TabsContent value="active" className="space-y-4">
          {decisionContext ? (
            <>
              {/* Decision Timer */}
              <Card className="border-orange-500 bg-orange-900/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Timer className="h-5 w-5 text-orange-400" />
                      <span className="text-orange-300 font-medium">Decision Required</span>
                    </div>
                    <div className="text-2xl font-mono text-orange-400">
                      {formatTime(decisionTimer)}
                    </div>
                  </div>
                  <Progress 
                    value={(decisionTimer / decisionContext.timeToDecision) * 100} 
                    className="mt-2 h-2"
                  />
                </CardContent>
              </Card>

              {/* AI Recommendation */}
              {aiRecommendation && (
                <Card className="border-blue-500 bg-blue-900/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-blue-300">
                      <Brain className="h-5 w-5" />
                      AI Recommendation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="font-medium text-white mb-2">
                      {aiRecommendation.title}
                    </div>
                    <div className="text-blue-200 text-sm mb-3">
                      {aiRecommendation.description}
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-blue-300">
                        Safety: {aiRecommendation.safetyScore}%
                      </Badge>
                      <Badge variant="outline" className="text-blue-300">
                        Cost: {formatCurrency(aiRecommendation.costImpact)}
                      </Badge>
                      <Badge variant="outline" className="text-blue-300">
                        Time: {aiRecommendation.timeImpact}min
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Decision Options */}
              <div className="grid gap-3">
                {decisionContext.availableOptions.map((option) => (
                  <Card
                    key={option.id}
                    className={`cursor-pointer transition-all ${
                      selectedOption === option.id
                        ? 'border-blue-400 bg-blue-900/30'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                    onClick={() => setSelectedOption(option.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-medium text-white mb-1">
                            {option.title}
                          </div>
                          <div className="text-gray-300 text-sm">
                            {option.description}
                          </div>
                        </div>
                        <Badge className={getRiskColor(option.riskLevel)}>
                          {option.riskLevel.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-4 gap-3 text-sm">
                        <div>
                          <div className="text-gray-400">Safety Score</div>
                          <div className="text-white font-mono">
                            {option.safetyScore}%
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">Cost Impact</div>
                          <div className="text-white font-mono">
                            {formatCurrency(option.costImpact)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">Time Impact</div>
                          <div className="text-white font-mono">
                            {option.timeImpact}min
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">Feasibility</div>
                          <div className="text-white font-mono">
                            {option.feasibility}%
                          </div>
                        </div>
                      </div>

                      {option.requirements.length > 0 && (
                        <div className="mt-3">
                          <div className="text-gray-400 text-xs mb-1">Requirements:</div>
                          <div className="flex flex-wrap gap-1">
                            {option.requirements.map((req, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {req}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Decision Actions */}
              {selectedOption && (
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    onClick={() => handleMakeDecision('crew')}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Crew Decision
                  </Button>
                  <Button
                    onClick={() => handleMakeDecision('operations')}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Operations Decision
                  </Button>
                  <Button
                    onClick={() => handleMakeDecision('ai')}
                    disabled={isLoading}
                    variant="outline"
                  >
                    AI Decision
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-400">
              No active decision context available
            </div>
          )}
        </TabsContent>

        {/* Diversion Scenarios Tab */}
        <TabsContent value="scenarios" className="space-y-4">
          <DiversionOutcomes />
        </TabsContent>

        {/* Situation Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          {analysis && (
            <>
              {/* Risk Assessment */}
              <Card className={getRiskColor(analysis.currentSituation.riskAssessment.level)}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Risk Assessment: {analysis.currentSituation.riskAssessment.level}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-mono">
                    Risk Score: {analysis.currentSituation.riskAssessment.score}/100
                  </div>
                </CardContent>
              </Card>

              {/* Flight Warnings */}
              {analysis.currentSituation.flightWarnings.length > 0 && (
                <Card className="border-red-500 bg-red-900/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-red-300">Active Warnings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {analysis.currentSituation.flightWarnings.map((warning, idx) => (
                      <Alert key={idx} className="border-red-500 bg-red-900/10">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="flex justify-between items-center">
                            <span>{warning.message}</span>
                            <Badge variant="destructive">
                              {warning.timeToAction}min
                            </Badge>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Critical Factors */}
              {analysis.currentSituation.criticalFactors.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-orange-300">Critical Factors</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {analysis.currentSituation.criticalFactors.map((factor, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 border border-gray-600 rounded">
                        <div>
                          <div className="font-medium text-white">{factor.factor}</div>
                          <div className="text-gray-300 text-sm">{factor.description}</div>
                        </div>
                        <Badge className={getRiskColor(factor.impact.toLowerCase())}>
                          {factor.impact}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-blue-300">Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="text-orange-300 font-medium mb-2">Immediate Actions</div>
                      <ul className="space-y-1">
                        {analysis.recommendations.immediate.map((rec, idx) => (
                          <li key={idx} className="text-gray-300 text-sm flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-orange-400" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-blue-300 font-medium mb-2">Strategic Considerations</div>
                      <ul className="space-y-1">
                        {analysis.recommendations.strategic.map((rec, idx) => (
                          <li key={idx} className="text-gray-300 text-sm flex items-center gap-2">
                            <TrendingUp className="h-3 w-3 text-blue-400" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Stakeholder Impact Tab */}
        <TabsContent value="stakeholders" className="space-y-4">
          {analysis && (
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(analysis.stakeholderImpact).map(([stakeholder, data]) => (
                <Card key={stakeholder}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 capitalize">
                      <Users className="h-5 w-5" />
                      {stakeholder}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {'affected' in data && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Affected:</span>
                          <span className="text-white">{data.affected}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-400">Impact Level:</span>
                        <Badge className={getRiskColor(data.impact.toLowerCase())}>
                          {data.impact}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm mb-1">Key Concerns:</div>
                        <ul className="space-y-1">
                          {data.concerns.map((concern: string, idx: number) => (
                            <li key={idx} className="text-gray-300 text-xs">
                              • {concern}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Decision History Tab */}
        <TabsContent value="history" className="space-y-4">
          {decisionHistory.length > 0 ? (
            <div className="space-y-3">
              {decisionHistory.map((decision, idx) => (
                <Card key={idx}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium text-white">
                          {decision.chosenOption.title}
                        </div>
                        <div className="text-gray-300 text-sm">
                          Decision by: {decision.decisionMaker}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={
                          decision.safetyOutcome === 'excellent' ? 'bg-green-600' :
                          decision.safetyOutcome === 'good' ? 'bg-blue-600' :
                          decision.safetyOutcome === 'acceptable' ? 'bg-yellow-600' : 'bg-red-600'
                        }>
                          {decision.safetyOutcome}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400">Response Time</div>
                        <div className="text-white">{decision.responseTime}s</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Actual Cost</div>
                        <div className="text-white">{formatCurrency(decision.actualCost)}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Confidence</div>
                        <div className="text-white">{decision.confidence.toFixed(1)}%</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              No decision history available
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}