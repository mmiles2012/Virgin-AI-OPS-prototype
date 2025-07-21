import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Activity, Brain, Gauge, Zap } from 'lucide-react';
import useModelInference from '@/hooks/useModelInference';
import { enrichAircraftFeatures } from '@/utils/enrichAircraftFeatures';

interface EuropeanAnalytics {
  currentMetrics: {
    arrivalPunctuality: number;
    departurePunctuality: number;
    averageFlights: number;
    operationalEfficiency: number;
  };
  trendAnalysis: {
    arrivalTrend: number;
    departureTrend: number;
    overallDirection: string;
  };
  seasonalInsights: any;
  weeklyPatterns: any;
  volumeCorrelation: any;
  mlPredictions: any[];
  networkHealth: {
    overallScore: number;
    status: string;
    components: {
      arrival: number;
      departure: number;
      operational: number;
    };
    challenges: string[];
    networkResilience: string;
    volatilityIndex: number;
    recommendation: string;
  };
  dataQuality: {
    recordsAnalyzed: number;
    recentDataPoints: number;
    dataCompleteness: number;
    lastUpdate: string;
  };
}

interface MLInsights {
  success: boolean;
  analytics: EuropeanAnalytics;
  realTimeInsights: {
    currentPerformance: string;
    trend: string;
    networkHealth: string;
    nextDayPrediction: any;
    keyInsight: string;
  };
}

const AdvancedAnalyticsDashboard: React.FC = () => {
  const [mlInsights, setMLInsights] = useState<MLInsights | null>(null);
  const [networkHealth, setNetworkHealth] = useState<any>(null);
  const [predictions, setPredictions] = useState<any>(null);
  const [virginAtlanticFlights, setVirginAtlanticFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Enhanced ML inference using uploaded AI ops modules
  const mlInferenceResults = useModelInference(virginAtlanticFlights);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        
        // Fetch all ML analytics and Virgin Atlantic flights simultaneously
        const [insightsResponse, healthResponse, predictionsResponse, flightsResponse] = await Promise.all([
          fetch('/api/nm-punctuality/ml-insights'),
          fetch('/api/nm-punctuality/network-health'),
          fetch('/api/nm-punctuality/predictions'),
          fetch('/api/aviation/virgin-atlantic-flights')
        ]);

        const [insights, health, preds, flights] = await Promise.all([
          insightsResponse.json(),
          healthResponse.json(),
          predictionsResponse.json(),
          flightsResponse.json()
        ]);

        if (insights.success) setMLInsights(insights);
        if (health.success) setNetworkHealth(health);
        if (preds.success) setPredictions(preds);
        if (flights.success) setVirginAtlanticFlights(flights.flights || []);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchAnalytics, 300000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Activity className="animate-spin h-5 w-5 text-purple-500" />
          <span className="text-muted-foreground">Loading European ML analytics...</span>
        </div>
      </div>
    );
  }

  if (error || !mlInsights) {
    return (
      <Card className="bg-va-red-primary/10 border-red-500/20">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-va-red-primary">
            <AlertTriangle className="h-5 w-5" />
            <span>Failed to load analytics: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { analytics, realTimeInsights } = mlInsights;
  const healthStatus = analytics.networkHealth.status;
  const healthColor = healthStatus === 'excellent' ? 'text-aero-green-safe' : 
                      healthStatus === 'good' ? 'text-aero-blue-primary' : 
                      healthStatus === 'fair' ? 'text-aero-amber-caution' : 'text-va-red-primary';

  const trendIcon = analytics.trendAnalysis.overallDirection === 'improving' ? 
                    <TrendingUp className="h-4 w-4 text-aero-green-safe" /> :
                    analytics.trendAnalysis.overallDirection === 'declining' ?
                    <TrendingDown className="h-4 w-4 text-va-red-primary" /> :
                    <Activity className="h-4 w-4 text-aero-amber-caution" />;

  // Prepare chart data
  const weeklyData = Object.entries(analytics.weeklyPatterns).map(([day, data]: [string, any]) => ({
    day: day.slice(0, 3),
    arrival: data.avgArrivalPunctuality,
    departure: data.avgDeparturePunctuality,
    volume: Math.round(data.avgVolume / 1000)
  }));

  const predictionsData = analytics.mlPredictions.map(pred => ({
    date: new Date(pred.date).toLocaleDateString(),
    arrival: pred.predictedArrivalPunctuality,
    departure: pred.predictedDeparturePunctuality,
    confidence: Math.round(pred.confidence * 100)
  }));

  const seasonalData = Object.entries(analytics.seasonalInsights).map(([season, data]: [string, any]) => ({
    season: season.charAt(0).toUpperCase() + season.slice(1),
    arrival: data.avgArrivalPunctuality,
    departure: data.avgDeparturePunctuality,
    volume: Math.round(data.avgVolume / 1000)
  }));

  const healthComponents = [
    { name: 'Arrival', value: analytics.networkHealth.components.arrival, color: '#10b981' },
    { name: 'Departure', value: analytics.networkHealth.components.departure, color: '#3b82f6' },
    { name: 'Operational', value: analytics.networkHealth.components.operational, color: '#8b5cf6' }
  ];

  return (
    <div className="space-y-6">
      {/* Real-time Status Banner */}
      <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Brain className="h-8 w-8 text-purple-400" />
              <div>
                <h3 className="text-lg font-semibold text-purple-300">European Network Manager ML Intelligence</h3>
                <p className="text-muted-foreground">{realTimeInsights.keyInsight}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2">
                {trendIcon}
                <span className={`text-xl font-bold ${healthColor}`}>
                  {analytics.networkHealth.overallScore}%
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Network Health</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-card border-border">
          <TabsTrigger value="overview" className="data-[state=active]:bg-purple-700">
            <Gauge className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="trends" className="data-[state=active]:bg-purple-700">
            <TrendingUp className="h-4 w-4 mr-2" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="insights" className="data-[state=active]:bg-purple-700">
            <Brain className="h-4 w-4 mr-2" />
            ML Insights
          </TabsTrigger>
          <TabsTrigger value="ai-ops" className="data-[state=active]:bg-purple-700">
            <Zap className="h-4 w-4 mr-2" />
            AI Ops
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Current Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-card/50 border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Arrival Punctuality</p>
                    <p className="text-2xl font-bold text-aero-green-safe">
                      {analytics.currentMetrics.arrivalPunctuality}%
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-aero-green-safe" />
                </div>
                <div className="mt-2">
                  <Progress 
                    value={analytics.currentMetrics.arrivalPunctuality} 
                    className="h-2"
                  />
                  <p className="text-xs text-foreground0 mt-1">
                    Trend: {analytics.trendAnalysis.arrivalTrend > 0 ? '+' : ''}{analytics.trendAnalysis.arrivalTrend.toFixed(1)}%
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Departure Punctuality</p>
                    <p className="text-2xl font-bold text-aero-blue-primary">
                      {analytics.currentMetrics.departurePunctuality}%
                    </p>
                  </div>
                  <Zap className="h-8 w-8 text-aero-blue-primary" />
                </div>
                <div className="mt-2">
                  <Progress 
                    value={analytics.currentMetrics.departurePunctuality} 
                    className="h-2"
                  />
                  <p className="text-xs text-foreground0 mt-1">
                    Trend: {analytics.trendAnalysis.departureTrend > 0 ? '+' : ''}{analytics.trendAnalysis.departureTrend.toFixed(1)}%
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Daily Flights</p>
                    <p className="text-2xl font-bold text-purple-400">
                      {analytics.currentMetrics.averageFlights.toLocaleString()}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-400" />
                </div>
                <div className="mt-2">
                  <p className="text-xs text-foreground0">European Network</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Operational Efficiency</p>
                    <p className="text-2xl font-bold text-aero-amber-caution">
                      {analytics.currentMetrics.operationalEfficiency}%
                    </p>
                  </div>
                  <Gauge className="h-8 w-8 text-aero-amber-caution" />
                </div>
                <div className="mt-2">
                  <Progress 
                    value={analytics.currentMetrics.operationalEfficiency} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Network Health Assessment */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-purple-300">Network Health Components</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={healthComponents}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {healthComponents.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-purple-300">System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Overall Health</span>
                  <Badge className={`${healthStatus === 'excellent' ? 'bg-green-600' : 
                                     healthStatus === 'good' ? 'bg-aero-blue-primary' : 
                                     healthStatus === 'fair' ? 'bg-yellow-600' : 'bg-va-red-primary'}`}>
                    {healthStatus.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Network Resilience</span>
                  <Badge variant="outline" className="text-purple-300 border-purple-500">
                    {analytics.networkHealth.networkResilience.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Volatility Index</span>
                  <span className="text-muted-foreground">{analytics.networkHealth.volatilityIndex}</span>
                </div>
                <div className="mt-4 p-3 bg-purple-900/20 rounded-lg border border-purple-500/20">
                  <p className="text-sm text-purple-300 font-medium">Recommendation</p>
                  <p className="text-xs text-muted-foreground mt-1">{analytics.networkHealth.recommendation}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="mt-6 space-y-6">
          {/* Weekly Patterns */}
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-purple-300">Weekly Operational Patterns</CardTitle>
              <CardDescription>Punctuality and volume by day of week</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="day" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '6px' }}
                    labelStyle={{ color: '#D1D5DB' }}
                  />
                  <Legend />
                  <Bar dataKey="arrival" fill="#10b981" name="Arrival %" />
                  <Bar dataKey="departure" fill="#3b82f6" name="Departure %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Seasonal Analysis */}
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-purple-300">Seasonal Performance Analysis</CardTitle>
              <CardDescription>European airspace seasonal variations</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={seasonalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="season" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '6px' }}
                    labelStyle={{ color: '#D1D5DB' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="arrival" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Arrival %" />
                  <Area type="monotone" dataKey="departure" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Departure %" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="mt-6 space-y-6">
          {/* ML Predictions */}
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-purple-300">7-Day ML Predictions</CardTitle>
              <CardDescription>
                Machine learning forecasts with confidence intervals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={predictionsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '6px' }}
                    labelStyle={{ color: '#D1D5DB' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="arrival" stroke="#10b981" strokeWidth={2} name="Predicted Arrival %" />
                  <Line type="monotone" dataKey="departure" stroke="#3b82f6" strokeWidth={2} name="Predicted Departure %" />
                  <Line type="monotone" dataKey="confidence" stroke="#8b5cf6" strokeWidth={1} strokeDasharray="5 5" name="Confidence %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Volume Correlation Analysis */}
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-purple-300">Volume-Punctuality Correlation</CardTitle>
              <CardDescription>Traffic volume impact on operational performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(analytics.volumeCorrelation.volumeThresholds).map(([level, data]: [string, any]) => (
                  <div key={level} className="p-4 bg-card/50 rounded-lg border border-border">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">{data.threshold}</p>
                      <p className="text-xl font-bold text-purple-300">{data.avgPunctuality}%</p>
                      <p className="text-xs text-foreground0">{data.occurrences} occurrences</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-aero-blue-primary/10 rounded-lg border border-blue-500/20">
                <p className="text-sm text-blue-300 font-medium">Correlation Analysis</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Arrival: {analytics.volumeCorrelation.correlationCoefficients.arrival} | 
                  Departure: {analytics.volumeCorrelation.correlationCoefficients.departure}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Data Quality Assessment */}
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-purple-300">Data Quality & ML Model Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-aero-green-safe">{analytics.dataQuality.recordsAnalyzed.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Records Analyzed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-aero-blue-primary">{analytics.dataQuality.dataCompleteness}%</p>
                  <p className="text-xs text-muted-foreground">Data Completeness</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-400">{analytics.dataQuality.recentDataPoints}</p>
                  <p className="text-xs text-muted-foreground">Recent Data Points</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-aero-amber-caution">Live</p>
                  <p className="text-xs text-muted-foreground">ML Status</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Ops Tab - Enhanced ML Features */}
        <TabsContent value="ai-ops" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Enhanced ML Model Status */}
            <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-purple-300 flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Enhanced AI Operations Status
                </CardTitle>
                <CardDescription>Real-time ML inference from uploaded AI ops modules</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-card/50 rounded-lg">
                    <p className="text-2xl font-bold text-aero-green-safe">{virginAtlanticFlights.length}</p>
                    <p className="text-xs text-muted-foreground">Live Aircraft</p>
                  </div>
                  <div className="text-center p-4 bg-card/50 rounded-lg">
                    <p className="text-2xl font-bold text-aero-blue-primary">{mlInferenceResults.length}</p>
                    <p className="text-xs text-muted-foreground">ML Predictions</p>
                  </div>
                  <div className="text-center p-4 bg-card/50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-400">3</p>
                    <p className="text-xs text-muted-foreground">Active Models</p>
                  </div>
                  <div className="text-center p-4 bg-card/50 rounded-lg">
                    <p className="text-2xl font-bold text-aero-amber-caution">LIVE</p>
                    <p className="text-xs text-muted-foreground">Status</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Model Configuration */}
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-purple-300">Active ML Models</CardTitle>
                <CardDescription>Enhanced models from uploaded AI ops modules</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-card/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-foreground">XGBoost Delay Risk</p>
                      <p className="text-xs text-muted-foreground">xgb-delay-v2</p>
                    </div>
                    <Badge className="bg-green-500 text-foreground">ACTIVE</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-card/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-foreground">Random Forest Diversion</p>
                      <p className="text-xs text-muted-foreground">rf-divert-v1</p>
                    </div>
                    <Badge className="bg-green-500 text-foreground">ACTIVE</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-card/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-foreground">KNN Stack Predictor</p>
                      <p className="text-xs text-muted-foreground">knn-stack-v1</p>
                    </div>
                    <Badge className="bg-green-500 text-foreground">ACTIVE</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Flight Analysis */}
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-purple-300">Live Virgin Atlantic Flight Analysis</CardTitle>
              <CardDescription>Enhanced ML predictions from authentic ADS-B data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                  {mlInferenceResults.slice(0, 12).map((result, index) => (
                    <div key={result.flightId} className="p-4 bg-card/50 rounded-lg border border-border">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-foreground">{result.callsign}</p>
                          <p className="text-xs text-muted-foreground">{result.holdingStack} Stack</p>
                        </div>
                        <Badge className={result.diversionRisk ? "bg-red-500 text-foreground" : "bg-green-500 text-foreground"}>
                          {result.diversionRisk ? "HIGH RISK" : "NORMAL"}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Route Progress:</span>
                          <span className="text-xs text-aero-blue-primary font-medium">{result.routeProgress}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Predicted Delay:</span>
                          <span className="text-xs text-foreground">{Math.round(result.predictedDelay)}min</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Connection Risk:</span>
                          <span className={`text-xs ${result.missedConnectionRisk > 0.7 ? 'text-va-red-primary' : result.missedConnectionRisk > 0.4 ? 'text-aero-amber-caution' : 'text-aero-green-safe'}`}>
                            {Math.round(result.missedConnectionRisk * 100)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Cost Impact:</span>
                          <span className="text-xs text-foreground">£{Math.round(result.costImpact).toLocaleString()}</span>
                        </div>
                        {result.routeInfo && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            {result.routeInfo.origin} → {result.routeInfo.destination}
                          </div>
                        )}
                        {result.operationalRecommendations && result.operationalRecommendations.length > 0 && (
                          <div className="mt-2 p-2 bg-blue-900/30 border border-blue-500/20 rounded">
                            <p className="text-xs text-blue-300 font-medium mb-1">🎯 ML Recommendations:</p>
                            {result.operationalRecommendations.map((rec, idx) => (
                              <p key={idx} className="text-xs text-blue-200">• {rec}</p>
                            ))}
                          </div>
                        )}
                        {result.visaFlag && (
                          <div className="mt-2 p-2 bg-orange-900/30 border border-orange-500/20 rounded">
                            <p className="text-xs text-orange-300">⚠️ Visa Alert</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;