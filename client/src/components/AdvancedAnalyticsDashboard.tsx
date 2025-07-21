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
      <div className="va-theme bg-background text-foreground flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Activity className="animate-spin h-5 w-5 text-va-blue" />
          <span className="text-muted-foreground">Loading European ML analytics...</span>
        </div>
      </div>
    );
  }

  if (error || !mlInsights) {
    return (
      <div className="va-theme bg-background text-foreground">
        <Card className="va-card bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-va-red">
              <AlertTriangle className="h-5 w-5" />
              <span>Failed to load analytics: {error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { analytics, realTimeInsights } = mlInsights;
  const healthStatus = analytics.networkHealth.status;
  const healthColor = healthStatus === 'excellent' ? 'text-va-green' : 
                      healthStatus === 'good' ? 'text-va-blue' : 
                      healthStatus === 'fair' ? 'text-va-amber' : 'text-va-red';

  const trendIcon = analytics.trendAnalysis.overallDirection === 'improving' ? 
                    <TrendingUp className="h-4 w-4 text-va-green" /> :
                    analytics.trendAnalysis.overallDirection === 'declining' ?
                    <TrendingDown className="h-4 w-4 text-va-red" /> :
                    <Activity className="h-4 w-4 text-va-amber" />;

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
    <div className="va-theme bg-background text-foreground space-y-6">
      {/* Real-time Status Banner */}
      <Card className="va-card bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Brain className="h-8 w-8 text-va-blue" />
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">European Network Manager ML Intelligence</h3>
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
        <TabsList className="grid w-full grid-cols-4 bg-muted">
          <TabsTrigger value="overview">
            <Gauge className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="trends">
            <TrendingUp className="h-4 w-4 mr-2" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="insights">
            <Brain className="h-4 w-4 mr-2" />
            ML Insights
          </TabsTrigger>
          <TabsTrigger value="ai-ops">
            <Zap className="h-4 w-4 mr-2" />
            AI Ops
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Current Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="va-card bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Arrival Punctuality</p>
                    <p className="text-2xl font-bold text-va-green">
                      {analytics.currentMetrics.arrivalPunctuality}%
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-va-green" />
                </div>
                <div className="mt-2">
                  <Progress 
                    value={analytics.currentMetrics.arrivalPunctuality} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Trend: {analytics.trendAnalysis.arrivalTrend > 0 ? '+' : ''}{analytics.trendAnalysis.arrivalTrend.toFixed(1)}%
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="va-card bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Departure Punctuality</p>
                    <p className="text-2xl font-bold text-va-blue">
                      {analytics.currentMetrics.departurePunctuality}%
                    </p>
                  </div>
                  <Zap className="h-8 w-8 text-va-blue" />
                </div>
                <div className="mt-2">
                  <Progress 
                    value={analytics.currentMetrics.departurePunctuality} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Trend: {analytics.trendAnalysis.departureTrend > 0 ? '+' : ''}{analytics.trendAnalysis.departureTrend.toFixed(1)}%
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="va-card bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Daily Flights</p>
                    <p className="text-2xl font-bold text-va-blue">
                      {analytics.currentMetrics.averageFlights.toLocaleString()}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-va-blue" />
                </div>
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground">European Network</p>
                </div>
              </CardContent>
            </Card>

            <Card className="va-card bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Operational Efficiency</p>
                    <p className="text-2xl font-bold text-va-amber">
                      {analytics.currentMetrics.operationalEfficiency}%
                    </p>
                  </div>
                  <Gauge className="h-8 w-8 text-va-amber" />
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
            <Card className="va-card bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">Network Health Components</CardTitle>
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

            <Card className="va-card bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Overall Health</span>
                  <Badge className={`${healthStatus === 'excellent' ? 'bg-green-600' : 
                                     healthStatus === 'good' ? 'bg-blue-600' : 
                                     healthStatus === 'fair' ? 'bg-yellow-600' : 'bg-red-600'}`}>
                    {healthStatus.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Network Resilience</span>
                  <Badge variant="outline" className="text-va-blue border-va-blue">
                    {analytics.networkHealth.networkResilience.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Volatility Index</span>
                  <span className="text-card-foreground">{analytics.networkHealth.volatilityIndex}</span>
                </div>
                <div className="mt-4 p-3 bg-muted rounded-lg border">
                  <p className="text-sm text-va-blue font-medium">Recommendation</p>
                  <p className="text-xs text-muted-foreground mt-1">{analytics.networkHealth.recommendation}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="mt-6 space-y-6">
          {/* Weekly Patterns */}
          <Card className="va-card bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Weekly Operational Patterns</CardTitle>
              <CardDescription className="text-muted-foreground">Punctuality and volume by day of week</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px' }}
                    labelStyle={{ color: 'hsl(var(--card-foreground))' }}
                  />
                  <Legend />
                  <Bar dataKey="arrival" fill="hsl(var(--va-green))" name="Arrival %" />
                  <Bar dataKey="departure" fill="hsl(var(--va-blue))" name="Departure %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Seasonal Analysis */}
          <Card className="va-card bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Seasonal Performance Analysis</CardTitle>
              <CardDescription className="text-muted-foreground">European airspace seasonal variations</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={seasonalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="season" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px' }}
                    labelStyle={{ color: 'hsl(var(--card-foreground))' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="arrival" stackId="1" stroke="hsl(var(--va-green))" fill="hsl(var(--va-green))" fillOpacity={0.6} name="Arrival %" />
                  <Area type="monotone" dataKey="departure" stackId="1" stroke="hsl(var(--va-blue))" fill="hsl(var(--va-blue))" fillOpacity={0.6} name="Departure %" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="mt-6 space-y-6">
          {/* ML Predictions */}
          <Card className="va-card bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">7-Day ML Predictions</CardTitle>
              <CardDescription className="text-muted-foreground">
                Machine learning forecasts with confidence intervals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={predictionsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px' }}
                    labelStyle={{ color: 'hsl(var(--card-foreground))' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="arrival" stroke="hsl(var(--va-green))" strokeWidth={2} name="Predicted Arrival %" />
                  <Line type="monotone" dataKey="departure" stroke="hsl(var(--va-blue))" strokeWidth={2} name="Predicted Departure %" />
                  <Line type="monotone" dataKey="confidence" stroke="hsl(var(--va-purple))" strokeWidth={1} strokeDasharray="5 5" name="Confidence %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Volume Correlation Analysis */}
          <Card className="va-card bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Volume-Punctuality Correlation</CardTitle>
              <CardDescription className="text-muted-foreground">Traffic volume impact on operational performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(analytics.volumeCorrelation.volumeThresholds).map(([level, data]: [string, any]) => (
                  <div key={level} className="p-4 bg-muted rounded-lg border">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">{data.threshold}</p>
                      <p className="text-xl font-bold text-va-blue">{data.avgPunctuality}%</p>
                      <p className="text-xs text-muted-foreground">{data.occurrences} occurrences</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-muted rounded-lg border">
                <p className="text-sm text-va-blue font-medium">Correlation Analysis</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Arrival: {analytics.volumeCorrelation.correlationCoefficients.arrival} | 
                  Departure: {analytics.volumeCorrelation.correlationCoefficients.departure}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Data Quality Assessment */}
          <Card className="va-card bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Data Quality & ML Model Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-va-green">{analytics.dataQuality.recordsAnalyzed.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Records Analyzed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-va-blue">{analytics.dataQuality.dataCompleteness}%</p>
                  <p className="text-xs text-muted-foreground">Data Completeness</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-va-blue">{analytics.dataQuality.recentDataPoints}</p>
                  <p className="text-xs text-muted-foreground">Recent Data Points</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-va-amber">Live</p>
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
            <Card className="va-card bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Enhanced AI Operations Status
                </CardTitle>
                <CardDescription className="text-muted-foreground">Real-time ML inference from uploaded AI ops modules</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-va-green">{virginAtlanticFlights.length}</p>
                    <p className="text-xs text-muted-foreground">Live Aircraft</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-va-blue">{mlInferenceResults.length}</p>
                    <p className="text-xs text-muted-foreground">ML Predictions</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-va-blue">3</p>
                    <p className="text-xs text-muted-foreground">Active Models</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-va-amber">LIVE</p>
                    <p className="text-xs text-muted-foreground">Status</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Model Configuration */}
            <Card className="va-card bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">Active ML Models</CardTitle>
                <CardDescription className="text-muted-foreground">Enhanced models from uploaded AI ops modules</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-card-foreground">XGBoost Delay Risk</p>
                      <p className="text-xs text-muted-foreground">xgb-delay-v2</p>
                    </div>
                    <Badge className="bg-green-500 text-white">ACTIVE</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-card-foreground">Random Forest Diversion</p>
                      <p className="text-xs text-muted-foreground">rf-divert-v1</p>
                    </div>
                    <Badge className="bg-green-500 text-white">ACTIVE</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-card-foreground">KNN Stack Predictor</p>
                      <p className="text-xs text-muted-foreground">knn-stack-v1</p>
                    </div>
                    <Badge className="bg-green-500 text-white">ACTIVE</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Flight Analysis */}
          <Card className="va-card bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Live Virgin Atlantic Flight Analysis</CardTitle>
              <CardDescription className="text-muted-foreground">Enhanced ML predictions from authentic ADS-B data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                  {mlInferenceResults.slice(0, 12).map((result, index) => (
                    <div key={result.flightId} className="p-4 bg-muted rounded-lg border">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-card-foreground">{result.callsign}</p>
                          <p className="text-xs text-muted-foreground">{result.holdingStack} Stack</p>
                        </div>
                        <Badge className={result.diversionRisk ? "bg-red-500 text-white" : "bg-green-500 text-white"}>
                          {result.diversionRisk ? "HIGH RISK" : "NORMAL"}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Route Progress:</span>
                          <span className="text-xs text-va-blue font-medium">{result.routeProgress}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Predicted Delay:</span>
                          <span className="text-xs text-card-foreground">{Math.round(result.predictedDelay)}min</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Connection Risk:</span>
                          <span className={`text-xs ${result.missedConnectionRisk > 0.7 ? 'text-va-red' : result.missedConnectionRisk > 0.4 ? 'text-va-amber' : 'text-va-green'}`}>
                            {Math.round(result.missedConnectionRisk * 100)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Cost Impact:</span>
                          <span className="text-xs text-card-foreground">£{Math.round(result.costImpact).toLocaleString()}</span>
                        </div>
                        {result.routeInfo && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            {result.routeInfo.origin} → {result.routeInfo.destination}
                          </div>
                        )}
                        {result.operationalRecommendations && result.operationalRecommendations.length > 0 && (
                          <div className="mt-2 p-2 bg-muted border rounded">
                            <p className="text-xs text-va-blue font-medium mb-1">🎯 ML Recommendations:</p>
                            {result.operationalRecommendations.map((rec, idx) => (
                              <p key={idx} className="text-xs text-muted-foreground">• {rec}</p>
                            ))}
                          </div>
                        )}
                        {result.visaFlag && (
                          <div className="mt-2 p-2 bg-muted border rounded">
                            <p className="text-xs text-va-amber">⚠️ Visa Alert</p>
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