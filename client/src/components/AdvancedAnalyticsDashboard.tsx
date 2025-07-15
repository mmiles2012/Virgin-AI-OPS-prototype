import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Activity, Brain, Gauge, Zap } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        
        // Fetch all ML analytics simultaneously
        const [insightsResponse, healthResponse, predictionsResponse] = await Promise.all([
          fetch('/api/nm-punctuality/ml-insights'),
          fetch('/api/nm-punctuality/network-health'),
          fetch('/api/nm-punctuality/predictions')
        ]);

        const [insights, health, preds] = await Promise.all([
          insightsResponse.json(),
          healthResponse.json(),
          predictionsResponse.json()
        ]);

        if (insights.success) setMLInsights(insights);
        if (health.success) setNetworkHealth(health);
        if (preds.success) setPredictions(preds);

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
          <span className="text-gray-300">Loading European ML analytics...</span>
        </div>
      </div>
    );
  }

  if (error || !mlInsights) {
    return (
      <Card className="bg-red-900/20 border-red-500/20">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            <span>Failed to load analytics: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { analytics, realTimeInsights } = mlInsights;
  const healthStatus = analytics.networkHealth.status;
  const healthColor = healthStatus === 'excellent' ? 'text-green-400' : 
                      healthStatus === 'good' ? 'text-blue-400' : 
                      healthStatus === 'fair' ? 'text-yellow-400' : 'text-red-400';

  const trendIcon = analytics.trendAnalysis.overallDirection === 'improving' ? 
                    <TrendingUp className="h-4 w-4 text-green-400" /> :
                    analytics.trendAnalysis.overallDirection === 'declining' ?
                    <TrendingDown className="h-4 w-4 text-red-400" /> :
                    <Activity className="h-4 w-4 text-yellow-400" />;

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
                <p className="text-gray-300">{realTimeInsights.keyInsight}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2">
                {trendIcon}
                <span className={`text-xl font-bold ${healthColor}`}>
                  {analytics.networkHealth.overallScore}%
                </span>
              </div>
              <p className="text-sm text-gray-400">Network Health</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-gray-700">
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
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Current Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Arrival Punctuality</p>
                    <p className="text-2xl font-bold text-green-400">
                      {analytics.currentMetrics.arrivalPunctuality}%
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
                <div className="mt-2">
                  <Progress 
                    value={analytics.currentMetrics.arrivalPunctuality} 
                    className="h-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Trend: {analytics.trendAnalysis.arrivalTrend > 0 ? '+' : ''}{analytics.trendAnalysis.arrivalTrend.toFixed(1)}%
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Departure Punctuality</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {analytics.currentMetrics.departurePunctuality}%
                    </p>
                  </div>
                  <Zap className="h-8 w-8 text-blue-400" />
                </div>
                <div className="mt-2">
                  <Progress 
                    value={analytics.currentMetrics.departurePunctuality} 
                    className="h-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Trend: {analytics.trendAnalysis.departureTrend > 0 ? '+' : ''}{analytics.trendAnalysis.departureTrend.toFixed(1)}%
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Daily Flights</p>
                    <p className="text-2xl font-bold text-purple-400">
                      {analytics.currentMetrics.averageFlights.toLocaleString()}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-400" />
                </div>
                <div className="mt-2">
                  <p className="text-xs text-gray-500">European Network</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Operational Efficiency</p>
                    <p className="text-2xl font-bold text-yellow-400">
                      {analytics.currentMetrics.operationalEfficiency}%
                    </p>
                  </div>
                  <Gauge className="h-8 w-8 text-yellow-400" />
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
            <Card className="bg-gray-800/50 border-gray-700">
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

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-purple-300">System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Overall Health</span>
                  <Badge className={`${healthStatus === 'excellent' ? 'bg-green-600' : 
                                     healthStatus === 'good' ? 'bg-blue-600' : 
                                     healthStatus === 'fair' ? 'bg-yellow-600' : 'bg-red-600'}`}>
                    {healthStatus.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Network Resilience</span>
                  <Badge variant="outline" className="text-purple-300 border-purple-500">
                    {analytics.networkHealth.networkResilience.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Volatility Index</span>
                  <span className="text-gray-300">{analytics.networkHealth.volatilityIndex}</span>
                </div>
                <div className="mt-4 p-3 bg-purple-900/20 rounded-lg border border-purple-500/20">
                  <p className="text-sm text-purple-300 font-medium">Recommendation</p>
                  <p className="text-xs text-gray-300 mt-1">{analytics.networkHealth.recommendation}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="mt-6 space-y-6">
          {/* Weekly Patterns */}
          <Card className="bg-gray-800/50 border-gray-700">
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
          <Card className="bg-gray-800/50 border-gray-700">
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
          <Card className="bg-gray-800/50 border-gray-700">
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
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-purple-300">Volume-Punctuality Correlation</CardTitle>
              <CardDescription>Traffic volume impact on operational performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(analytics.volumeCorrelation.volumeThresholds).map(([level, data]: [string, any]) => (
                  <div key={level} className="p-4 bg-gray-900/50 rounded-lg border border-gray-600">
                    <div className="text-center">
                      <p className="text-sm text-gray-400">{data.threshold}</p>
                      <p className="text-xl font-bold text-purple-300">{data.avgPunctuality}%</p>
                      <p className="text-xs text-gray-500">{data.occurrences} occurrences</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-500/20">
                <p className="text-sm text-blue-300 font-medium">Correlation Analysis</p>
                <p className="text-xs text-gray-300 mt-1">
                  Arrival: {analytics.volumeCorrelation.correlationCoefficients.arrival} | 
                  Departure: {analytics.volumeCorrelation.correlationCoefficients.departure}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Data Quality Assessment */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-purple-300">Data Quality & ML Model Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">{analytics.dataQuality.recordsAnalyzed.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">Records Analyzed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-400">{analytics.dataQuality.dataCompleteness}%</p>
                  <p className="text-xs text-gray-400">Data Completeness</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-400">{analytics.dataQuality.recentDataPoints}</p>
                  <p className="text-xs text-gray-400">Recent Data Points</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-400">Live</p>
                  <p className="text-xs text-gray-400">ML Status</p>
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