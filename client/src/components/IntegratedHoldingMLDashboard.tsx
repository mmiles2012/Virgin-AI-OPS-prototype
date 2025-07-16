import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { 
  Plane, 
  TrendingDown, 
  TrendingUp, 
  Users, 
  Clock, 
  AlertTriangle, 
  BarChart3, 
  MapPin,
  Activity,
  DollarSign,
  CheckCircle,
  XCircle,
  Zap
} from 'lucide-react';

interface HoldingMLAnalysis {
  success: boolean;
  timestamp: string;
  holding_data: any;
  otp_impact_analysis: {
    timestamp: string;
    holding_impact: {
      total_aircraft_holding: number;
      stack_distribution: Record<string, number>;
      estimated_delay_minutes: number;
      affected_routes: Array<{
        flight_number: string;
        route: string;
        aircraft_type: string;
        holding_stack: string;
        estimated_delay: number;
      }>;
    };
    otp_predictions: {
      baseline_otp: number;
      holding_adjusted_otp: number;
      degradation_percentage: number;
      recovery_time_estimate: number;
    };
    ml_factors: {
      weather_correlation: number;
      traffic_density: number;
      runway_utilization: number;
      airspace_efficiency: number;
    };
  };
  connection_impact_analysis: {
    timestamp: string;
    total_affected_passengers: number;
    risk_distribution: Record<string, number>;
    total_estimated_cost: number;
    connection_impacts: Array<{
      passenger_id: string;
      passenger_name: string;
      flight_number: string;
      route: string;
      holding_stack: string;
      estimated_delay: number;
      connection_risk: string;
      risk_probability: number;
      mitigation_options: Array<{
        type: string;
        description: string;
        estimated_cost: number;
        probability_success: number;
      }>;
      cost_impact: number;
    }>;
    recovery_recommendations: Array<{
      priority: string;
      action: string;
      timeline: string;
    }>;
  };
  integrated_recommendations: Array<{
    category: string;
    priority: string;
    action: string;
    description: string;
    estimated_benefit: string;
    implementation_time: string;
  }>;
  cost_summary: {
    network_otp_cost: number;
    passenger_connection_cost: number;
    total_estimated_cost: number;
  };
}

interface FlowPredictions {
  success: boolean;
  flow_predictions: {
    timestamp: string;
    current_holding: number;
    predicted_peak: number;
    estimated_duration: number;
    capacity_utilization: number;
    flow_efficiency: number;
    stack_distribution: Record<string, number>;
    recommendations: Array<{
      category: string;
      priority: string;
      action: string;
      description: string;
      estimated_benefit: string;
      implementation_time: string;
    }>;
  };
}

const IntegratedHoldingMLDashboard: React.FC = () => {
  const [mlAnalysis, setMlAnalysis] = useState<HoldingMLAnalysis | null>(null);
  const [flowPredictions, setFlowPredictions] = useState<FlowPredictions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMLAnalysis = async () => {
    try {
      setError(null);
      const [analysisResponse, flowResponse] = await Promise.all([
        fetch('/api/aviation/holding-ml-analysis'),
        fetch('/api/aviation/holding-flow-predictions')
      ]);
      
      const analysisData = await analysisResponse.json();
      const flowData = await flowResponse.json();
      
      if (analysisData.success) {
        setMlAnalysis(analysisData);
      }
      
      if (flowData.success) {
        setFlowPredictions(flowData);
      }
      
      if (!analysisData.success && !flowData.success) {
        setError('Failed to fetch ML analysis data');
      }
    } catch (err) {
      setError('Network error fetching ML analysis');
      console.error('Error fetching ML analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMLAnalysis();
    
    if (autoRefresh) {
      const interval = setInterval(fetchMLAnalysis, 60000); // 1 minute
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getImpactColor = (value: number, type: 'degradation' | 'risk' | 'cost') => {
    if (type === 'degradation') {
      if (value > 15) return 'text-red-400';
      if (value > 5) return 'text-yellow-400';
      return 'text-green-400';
    }
    if (type === 'risk') {
      if (value > 0.7) return 'text-red-400';
      if (value > 0.4) return 'text-yellow-400';
      return 'text-green-400';
    }
    if (type === 'cost') {
      if (value > 1000) return 'text-red-400';
      if (value > 500) return 'text-yellow-400';
      return 'text-green-400';
    }
    return 'text-white';
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority.toUpperCase()) {
      case 'HIGH':
      case 'CRITICAL':
      case 'IMMEDIATE':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'MEDIUM':
      case 'URGENT':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gray-900 text-white p-6 overflow-y-auto flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-lg">Loading Integrated Holding ML Analysis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-gray-900 text-white p-6 overflow-y-auto flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <p className="text-lg text-red-400 mb-4">{error}</p>
          <Button onClick={fetchMLAnalysis} variant="outline">
            Retry Analysis
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-900 text-white p-6 overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-8 h-8 text-purple-400" />
            <div>
              <h1 className="text-2xl font-bold">Integrated Holding Pattern ML Analysis</h1>
              <p className="text-gray-300">Network OTP & Passenger Connection Impact Intelligence</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant={autoRefresh ? "default" : "secondary"}>
              {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
            </Badge>
            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant="outline"
              size="sm"
            >
              {autoRefresh ? "Disable" : "Enable"} Auto-refresh
            </Button>
            <Button onClick={fetchMLAnalysis} size="sm">
              Refresh Analysis
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Plane className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Aircraft Holding</p>
                <p className="text-2xl font-bold text-white">
                  {mlAnalysis?.otp_impact_analysis?.holding_impact?.total_aircraft_holding || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <TrendingDown className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">OTP Degradation</p>
                <p className={`text-2xl font-bold ${getImpactColor(mlAnalysis?.otp_impact_analysis?.otp_predictions?.degradation_percentage || 0, 'degradation')}`}>
                  {(mlAnalysis?.otp_impact_analysis?.otp_predictions?.degradation_percentage || 0).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Users className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Affected Passengers</p>
                <p className="text-2xl font-bold text-white">
                  {mlAnalysis?.connection_impact_analysis?.total_affected_passengers || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Cost Impact</p>
                <p className={`text-2xl font-bold ${getImpactColor(mlAnalysis?.cost_summary?.total_estimated_cost || 0, 'cost')}`}>
                  £{(mlAnalysis?.cost_summary?.total_estimated_cost || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-gray-700">
            Overview
          </TabsTrigger>
          <TabsTrigger value="network-otp" className="data-[state=active]:bg-gray-700">
            Network OTP Impact
          </TabsTrigger>
          <TabsTrigger value="connections" className="data-[state=active]:bg-gray-700">
            Passenger Connections
          </TabsTrigger>
          <TabsTrigger value="flow-predictions" className="data-[state=active]:bg-gray-700">
            Flow Predictions
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="data-[state=active]:bg-gray-700">
            ML Recommendations
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* OTP Impact Summary */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  <span>Network OTP Impact</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Baseline OTP:</span>
                    <span className="text-lg font-semibold text-green-400">
                      {(mlAnalysis?.otp_impact_analysis?.otp_predictions?.baseline_otp || 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Holding-Adjusted OTP:</span>
                    <span className={`text-lg font-semibold ${getImpactColor(mlAnalysis?.otp_impact_analysis?.otp_predictions?.degradation_percentage || 0, 'degradation')}`}>
                      {(mlAnalysis?.otp_impact_analysis?.otp_predictions?.holding_adjusted_otp || 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Recovery Time:</span>
                    <span className="text-lg font-semibold text-white">
                      {mlAnalysis?.otp_impact_analysis?.otp_predictions?.recovery_time_estimate || 0} minutes
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Affected Routes:</span>
                    <span className="text-lg font-semibold text-yellow-400">
                      {mlAnalysis?.otp_impact_analysis?.holding_impact?.affected_routes?.length || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Connection Impact Summary */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span>Passenger Connection Impact</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Affected:</span>
                    <span className="text-lg font-semibold text-white">
                      {mlAnalysis?.connection_impact_analysis?.total_affected_passengers || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Critical Risk:</span>
                    <span className="text-lg font-semibold text-red-400">
                      {mlAnalysis?.connection_impact_analysis?.risk_distribution?.CRITICAL || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">High Risk:</span>
                    <span className="text-lg font-semibold text-yellow-400">
                      {mlAnalysis?.connection_impact_analysis?.risk_distribution?.HIGH || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Cost:</span>
                    <span className={`text-lg font-semibold ${getImpactColor(mlAnalysis?.connection_impact_analysis?.total_estimated_cost || 0, 'cost')}`}>
                      £{(mlAnalysis?.connection_impact_analysis?.total_estimated_cost || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ML Factors */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span>ML Performance Factors</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-400 mb-2">Weather Correlation</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {(mlAnalysis?.otp_impact_analysis?.ml_factors?.weather_correlation || 0).toFixed(2)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400 mb-2">Traffic Density</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {(mlAnalysis?.otp_impact_analysis?.ml_factors?.traffic_density || 0).toFixed(2)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400 mb-2">Runway Utilization</p>
                  <p className="text-2xl font-bold text-green-400">
                    {((mlAnalysis?.otp_impact_analysis?.ml_factors?.runway_utilization || 0) * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400 mb-2">Airspace Efficiency</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {((mlAnalysis?.otp_impact_analysis?.ml_factors?.airspace_efficiency || 0) * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Network OTP Tab */}
        <TabsContent value="network-otp" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Affected Routes Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mlAnalysis?.otp_impact_analysis?.holding_impact?.affected_routes?.map((route, index) => (
                  <div key={index} className="p-4 bg-gray-700/50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-white">{route.flight_number}</h4>
                        <p className="text-sm text-gray-400">{route.route}</p>
                        <p className="text-xs text-gray-500">{route.aircraft_type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Holding Stack</p>
                        <p className="font-semibold text-purple-400">{route.holding_stack}</p>
                        <p className="text-xs text-red-400">+{route.estimated_delay} min delay</p>
                      </div>
                    </div>
                  </div>
                )) || (
                  <p className="text-center text-gray-400 py-8">No affected routes detected</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Passenger Connections Tab */}
        <TabsContent value="connections" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>At-Risk Passenger Connections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mlAnalysis?.connection_impact_analysis?.connection_impacts?.map((impact, index) => (
                  <div key={index} className="p-4 bg-gray-700/50 rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-white">{impact.passenger_name}</h4>
                        <p className="text-sm text-gray-400">{impact.flight_number} • {impact.route}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={impact.connection_risk === 'CRITICAL' ? 'destructive' : 
                                     impact.connection_risk === 'HIGH' ? 'secondary' : 'outline'}>
                          {impact.connection_risk} RISK
                        </Badge>
                        <p className="text-xs text-gray-400 mt-1">
                          {(impact.risk_probability * 100).toFixed(0)}% probability
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Holding Stack: <span className="text-white">{impact.holding_stack}</span></p>
                        <p className="text-gray-400">Estimated Delay: <span className="text-red-400">+{impact.estimated_delay} min</span></p>
                      </div>
                      <div>
                        <p className="text-gray-400">Cost Impact: <span className="text-yellow-400">£{impact.cost_impact}</span></p>
                        <p className="text-gray-400">Mitigation Options: <span className="text-blue-400">{impact.mitigation_options?.length || 0}</span></p>
                      </div>
                    </div>
                  </div>
                )) || (
                  <p className="text-center text-gray-400 py-8">No at-risk connections detected</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Flow Predictions Tab */}
        <TabsContent value="flow-predictions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-green-400" />
                  <span>Flow Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Current Holding:</span>
                    <span className="text-2xl font-bold text-white">
                      {flowPredictions?.flow_predictions?.current_holding || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Predicted Peak:</span>
                    <span className="text-2xl font-bold text-yellow-400">
                      {flowPredictions?.flow_predictions?.predicted_peak || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Capacity Utilization:</span>
                    <span className="text-2xl font-bold text-blue-400">
                      {(flowPredictions?.flow_predictions?.capacity_utilization || 0).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Flow Efficiency:</span>
                    <span className="text-2xl font-bold text-green-400">
                      {(flowPredictions?.flow_predictions?.flow_efficiency || 0).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-purple-400" />
                  <span>Stack Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(flowPredictions?.flow_predictions?.stack_distribution || {}).map(([stack, count]) => (
                    <div key={stack} className="flex justify-between items-center">
                      <span className="text-gray-400">{stack} Stack:</span>
                      <span className="text-lg font-semibold text-white">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Integrated ML Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mlAnalysis?.integrated_recommendations?.map((recommendation, index) => (
                  <div key={index} className="p-4 bg-gray-700/50 rounded-lg">
                    <div className="flex items-start space-x-3">
                      {getPriorityIcon(recommendation.priority)}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-white">{recommendation.action}</h4>
                          <Badge variant={recommendation.priority === 'HIGH' ? 'destructive' : 
                                        recommendation.priority === 'MEDIUM' ? 'secondary' : 'outline'}>
                            {recommendation.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">{recommendation.description}</p>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="text-gray-500">Category: <span className="text-blue-400">{recommendation.category}</span></p>
                            <p className="text-gray-500">Benefit: <span className="text-green-400">{recommendation.estimated_benefit}</span></p>
                          </div>
                          <div>
                            <p className="text-gray-500">Implementation: <span className="text-yellow-400">{recommendation.implementation_time}</span></p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )) || (
                  <p className="text-center text-gray-400 py-8">No recommendations available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegratedHoldingMLDashboard;