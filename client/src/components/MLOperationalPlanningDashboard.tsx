import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Brain, TrendingUp, Clock, Navigation, AlertTriangle, Target, BarChart3, Activity } from 'lucide-react';
import useModelInference from '../hooks/useModelInference';

interface MLOperationalPlanningDashboardProps {
  flights: any[];
}

export const MLOperationalPlanningDashboard: React.FC<MLOperationalPlanningDashboardProps> = ({ flights }) => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'predictions' | 'features' | 'recommendations'>('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  const mlResults = useModelInference(flights);
  
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        setLastUpdate(new Date());
      }, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'DEPARTURE_PHASE': return 'bg-aero-blue-primary';
      case 'INITIAL_CRUISE': return 'bg-aero-green-safe';
      case 'MID_CRUISE': return 'bg-aero-green-dark';
      case 'APPROACH_PHASE': return 'bg-aero-amber-caution';
      case 'FINAL_APPROACH': return 'bg-va-red-primary';
      default: return 'bg-gray-500';
    }
  };

  const getRouteTypeColor = (type: string) => {
    switch (type) {
      case 'DOMESTIC_SHORT': return 'bg-aero-blue-primary';
      case 'DOMESTIC_LONG': return 'bg-blue-700';
      case 'REGIONAL': return 'bg-purple-600';
      case 'LONG_HAUL': return 'bg-orange-600';
      case 'ULTRA_LONG_HAUL': return 'bg-va-red-primary';
      default: return 'bg-gray-600';
    }
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-aero-blue-primary" />
            ML Model Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Active Models:</span>
            <Badge className="bg-aero-green-safe text-white">3 Models</Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            • Route Progress Predictor
          </div>
          <div className="text-xs text-muted-foreground">
            • Delay Risk Analyzer
          </div>
          <div className="text-xs text-muted-foreground">
            • Connection Optimizer
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-muted-foreground">Prediction Accuracy:</span>
            <span className="text-sm text-aero-green-safe">87.3%</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-aero-green-safe" />
            Real-Time Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Flights Analyzed:</span>
            <span className="text-sm text-foreground font-bold">{mlResults.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">High Risk Flights:</span>
            <span className="text-sm text-va-red-primary">
              {mlResults.filter(r => r.predictedDelay > 15).length}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Diversion Alerts:</span>
            <span className="text-sm text-aero-orange-alert">
              {mlResults.filter(r => r.diversionRisk).length}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Connection Risks:</span>
            <span className="text-sm text-aero-amber-caution">
              {mlResults.filter(r => r.missedConnectionRisk > 0.7).length}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-400" />
            Route Progress Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {['DEPARTURE_PHASE', 'INITIAL_CRUISE', 'MID_CRUISE', 'APPROACH_PHASE', 'FINAL_APPROACH'].map(phase => {
              const count = mlResults.filter(r => r.mlFeatures?.route.progressPhase === phase).length;
              return (
                <div key={phase} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getPhaseColor(phase)}`}></div>
                    <span className="text-xs text-muted-foreground">{phase.replace('_', ' ')}</span>
                  </div>
                  <span className="text-xs text-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPredictions = () => (
    <div className="space-y-4">
      {mlResults.map((result, index) => (
        <Card key={index} className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-bold text-foreground">{result.callsign}</h3>
                <p className="text-sm text-muted-foreground">
                  {result.routeInfo?.origin} → {result.routeInfo?.destination}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getPhaseColor(result.mlFeatures?.route.progressPhase || 'UNKNOWN')}>
                  {result.mlFeatures?.route.progressPhase?.replace('_', ' ')}
                </Badge>
                <Badge className={getRouteTypeColor(result.mlFeatures?.route.routeType || 'UNKNOWN')}>
                  {result.mlFeatures?.route.routeType?.replace('_', ' ')}
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
              <div className="text-center">
                <div className="text-aero-blue-primary font-bold text-xl">{result.routeProgress}%</div>
                <div className="text-xs text-muted-foreground">Route Progress</div>
              </div>
              <div className="text-center">
                <div className={`font-bold text-xl ${result.predictedDelay > 15 ? 'text-va-red-primary' : 'text-aero-green-safe'}`}>
                  {Math.round(result.predictedDelay)}min
                </div>
                <div className="text-xs text-muted-foreground">Predicted Delay</div>
              </div>
              <div className="text-center">
                <div className={`font-bold text-xl ${result.diversionRisk ? 'text-va-red-primary' : 'text-aero-green-safe'}`}>
                  {result.diversionRisk ? 'HIGH' : 'LOW'}
                </div>
                <div className="text-xs text-muted-foreground">Diversion Risk</div>
              </div>
              <div className="text-center">
                <div className="text-foreground font-bold text-xl">
                  £{Math.round(result.costImpact).toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Cost Impact</div>
              </div>
            </div>

            {result.operationalRecommendations && result.operationalRecommendations.length > 0 && (
              <div className="mt-3 p-3 bg-blue-900/30 border border-blue-500/20 rounded">
                <h4 className="text-sm font-medium text-blue-300 mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  ML-Enhanced Recommendations
                </h4>
                <div className="space-y-1">
                  {result.operationalRecommendations.map((rec, idx) => (
                    <div key={idx} className="text-xs text-blue-200 flex items-start gap-2">
                      <span className="text-aero-blue-primary">•</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderFeatures = () => (
    <div className="space-y-4">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-aero-green-safe" />
            ML Feature Engineering with Route Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">Route Progress Features</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completion Percentage:</span>
                  <span className="text-aero-blue-primary">Real-time calculation</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Remaining Distance:</span>
                  <span className="text-aero-blue-primary">Dynamic calculation</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Progress Phase:</span>
                  <span className="text-aero-blue-primary">5 categories</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Route Type:</span>
                  <span className="text-aero-blue-primary">5 classifications</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time Remaining:</span>
                  <span className="text-aero-blue-primary">ML-estimated</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">Enhanced Predictions</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delay Risk:</span>
                  <span className="text-aero-green-safe">Progress-aware</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Diversion Risk:</span>
                  <span className="text-aero-green-safe">Phase-based</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Connection Risk:</span>
                  <span className="text-aero-green-safe">Time-sensitive</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cost Impact:</span>
                  <span className="text-aero-green-safe">Route-adjusted</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Holding Stack:</span>
                  <span className="text-aero-green-safe">Progress-optimized</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderRecommendations = () => {
    const allRecommendations = mlResults.flatMap(r => 
      (r.operationalRecommendations || []).map(rec => ({
        callsign: r.callsign,
        recommendation: rec,
        progress: r.routeProgress,
        delay: r.predictedDelay,
        phase: r.mlFeatures?.route.progressPhase
      }))
    );

    return (
      <div className="space-y-4">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-aero-blue-primary" />
              ML-Enhanced Operational Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allRecommendations.map((item, index) => (
                <div key={index} className="p-3 bg-gray-700/50 rounded-lg border border-border">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground font-medium">{item.callsign}</span>
                      <Badge className={getPhaseColor(item.phase || 'UNKNOWN')}>
                        {item.phase?.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-aero-blue-primary font-bold">{item.progress}%</div>
                      <div className="text-xs text-muted-foreground">{Math.round(item.delay)}min delay</div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-aero-amber-caution mt-0.5 flex-shrink-0" />
                    <span>{item.recommendation}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Brain className="h-6 w-6 text-aero-blue-primary" />
          ML-Enhanced Operational Planning
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Updated: {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant="outline"
            size="sm"
            className={autoRefresh ? 'border-green-500 text-aero-green-safe' : 'border-border text-muted-foreground'}
          >
            {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
          </Button>
        </div>
      </div>

      <div className="flex space-x-1 bg-card p-1 rounded-lg">
        {[
          { key: 'overview', label: 'Overview', icon: Activity },
          { key: 'predictions', label: 'Predictions', icon: TrendingUp },
          { key: 'features', label: 'Features', icon: BarChart3 },
          { key: 'recommendations', label: 'Recommendations', icon: Target }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSelectedTab(key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              selectedTab === key
                ? 'bg-aero-blue-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {selectedTab === 'overview' && renderOverview()}
      {selectedTab === 'predictions' && renderPredictions()}
      {selectedTab === 'features' && renderFeatures()}
      {selectedTab === 'recommendations' && renderRecommendations()}
    </div>
  );
};

export default MLOperationalPlanningDashboard;