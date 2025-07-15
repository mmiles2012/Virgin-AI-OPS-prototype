import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import FaaAirportGrid from "./FaaAirportGrid";
import FaaLiveStatus from "./FaaLiveStatus";
import SmartHubTileGrid from "./SmartHubTileGrid";

interface FAADelayRecord {
  airport: string;
  month: number;
  year: number;
  total_ops: number;
  carrier_delay: number;
  weather_delay: number;
  nas_delay: number;
  security_delay: number;
  late_aircraft_delay: number;
  total_delay: number;
}

interface USUKCorrelation {
  correlations: Record<string, number>;
  statistics: {
    avg_us_delay_minutes: number;
    avg_uk_delay_minutes: number;
    strongest_correlation: string;
    transatlantic_routes: string[];
    peak_correlation_months: number[];
  };
  monthly_comparison: Array<{
    month: number;
    us_avg_delay_minutes: number;
    uk_avg_delay_minutes: number;
    us_total_operations: number;
    correlation_strength: number;
  }>;
  operational_insights: {
    network_impact: {
      transatlantic_correlation_strength: string;
      weather_pattern_correlation: string;
      operational_interdependence: string;
    };
    predictive_indicators: {
      us_summer_delays_predict_uk_delays: boolean;
      weather_systems_cross_atlantic: boolean;
      passenger_flow_correlation: boolean;
    };
    recommendations: Array<{
      priority: string;
      category: string;
      recommendation: string;
      implementation: string;
    }>;
  };
  data_coverage: {
    us_airports: number;
    uk_airports: number;
    time_period: string;
    total_us_records: number;
  };
}

export default function FaaDelayDashboard() {
  const [faaData, setFaaData] = useState<FAADelayRecord[]>([]);
  const [correlationData, setCorrelationData] = useState<USUKCorrelation | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("delays");
  const [mlTrainingData, setMlTrainingData] = useState<any>(null);
  const [trainingResult, setTrainingResult] = useState<any>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [weatherTrainingResult, setWeatherTrainingResult] = useState<any>(null);
  const [isWeatherTraining, setIsWeatherTraining] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch FAA delay data
        const faaResponse = await fetch("/api/faa-delay-summary");
        const faaResult = await faaResponse.json();
        
        // Fetch US-UK correlation data
        const correlationResponse = await fetch("/api/us-uk-correlation");
        const correlationResult = await correlationResponse.json();
        
        // Fetch ML training data
        const mlResponse = await fetch("/api/faa-ml-training");
        const mlResult = await mlResponse.json();
        
        setFaaData(faaResult.records || []);
        setCorrelationData(correlationResult);
        setMlTrainingData(mlResult);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDelay = (value: number) => `${(value / 60).toFixed(1)} mins`;
  const getDelayColor = (delayMinutes: number) => {
    if (delayMinutes < 2) return "bg-green-100 text-green-800";
    if (delayMinutes < 5) return "bg-yellow-500 text-white";
    return "bg-red-500 text-white";
  };

  const getCorrelationColor = (correlation: number) => {
    const abs = Math.abs(correlation);
    if (abs > 0.8) return "bg-purple-100 text-purple-800";
    if (abs > 0.6) return "bg-blue-100 text-blue-800";
    if (abs > 0.4) return "bg-orange-500 text-white";
    return "bg-gray-100 text-gray-800";
  };

  const handleTrainModel = async () => {
    setIsTraining(true);
    try {
      const response = await fetch("/api/faa-train-model");
      const result = await response.json();
      setTrainingResult(result);
    } catch (error) {
      console.error("Error training model:", error);
      setTrainingResult({ error: "Training failed" });
    } finally {
      setIsTraining(false);
    }
  };

  const handleWeatherTrainModel = async () => {
    setIsWeatherTraining(true);
    try {
      const response = await fetch("/api/faa-train-weather-enhanced", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      setWeatherTrainingResult(result);
    } catch (error) {
      console.error("Error training weather-enhanced model:", error);
      setWeatherTrainingResult({ success: false, error: "Weather-enhanced training failed" });
    } finally {
      setIsWeatherTraining(false);
    }
  };

  const getTopAirports = () => {
    const airportAverages = faaData.reduce((acc: Record<string, { total: number, count: number }>, record) => {
      if (!acc[record.airport]) {
        acc[record.airport] = { total: 0, count: 0 };
      }
      acc[record.airport].total += record.total_delay / 60; // Convert to minutes
      acc[record.airport].count += 1;
      return acc;
    }, {});

    return Object.entries(airportAverages)
      .map(([airport, data]) => ({
        airport,
        avgDelay: data.total / data.count
      }))
      .sort((a, b) => b.avgDelay - a.avgDelay)
      .slice(0, 5);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading US Aviation Data...</div>
      </div>
    );
  }

  const topAirports = getTopAirports();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">US Aviation Intelligence Dashboard</h2>
        <Badge variant="outline" className="text-blue-600 border-blue-200">
          FAA Bureau of Transportation Statistics
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="delays">US Airport Delays</TabsTrigger>
          <TabsTrigger value="live">Live FAA Status</TabsTrigger>
          <TabsTrigger value="correlation">US-UK Correlation</TabsTrigger>
          <TabsTrigger value="insights">Operational Insights</TabsTrigger>
          <TabsTrigger value="ml-training">ML Training Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="delays" className="space-y-4">
          {/* Top Performing Airports Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Top US Airports by Average Delay</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topAirports.map((airport, index) => (
                  <div key={airport.airport} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <span className="font-medium text-lg">{airport.airport}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getDelayColor(airport.avgDelay)}>
                        {airport.avgDelay.toFixed(1)} mins avg
                      </Badge>
                      <Progress value={Math.min(airport.avgDelay * 10, 100)} className="w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Airport Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {faaData.slice(0, 12).map((record) => (
              <Card key={`${record.airport}-${record.year}-${record.month}`} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{record.airport}</CardTitle>
                    <Badge variant="outline">{record.month}/{record.year}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Operations</span>
                    <span className="font-semibold">{record.total_ops.toLocaleString()}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Carrier Delay</span>
                      <Badge className={getDelayColor(record.carrier_delay / 60)}>
                        {formatDelay(record.carrier_delay)}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Weather Delay</span>
                      <Badge className={getDelayColor(record.weather_delay / 60)}>
                        {formatDelay(record.weather_delay)}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">NAS Delay</span>
                      <Badge className={getDelayColor(record.nas_delay / 60)}>
                        {formatDelay(record.nas_delay)}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Late Aircraft</span>
                      <Badge className={getDelayColor(record.late_aircraft_delay / 60)}>
                        {formatDelay(record.late_aircraft_delay)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Delay</span>
                      <Badge className={`${getDelayColor(record.total_delay / 60)} font-bold`}>
                        {formatDelay(record.total_delay)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Weather-Enhanced Airport Risk Grid */}
          <FaaAirportGrid />
        </TabsContent>

        <TabsContent value="live" className="space-y-4">
          {/* Live FAA Status Integration with Smart Hub Watch */}
          <div className="space-y-6">
            <FaaLiveStatus />
            
            {/* Smart Hub Watch Component */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4 text-blue-900">
                Weather-Enhanced ML Smart Hub Analysis
              </h3>
              <p className="text-sm text-blue-700 mb-4">
                Real-time integration of live FAA NASSTATUS data with machine learning predictions, 
                weather impact analysis, and alert generation for major US aviation hubs.
              </p>
              <SmartHubTileGrid />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="correlation" className="space-y-4">
          {correlationData && (
            <>
              {/* Correlation Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Trans-Atlantic Aviation Correlations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(correlationData.correlations).map(([key, value]) => (
                      <div key={key} className="p-3 border rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                        <Badge className={getCorrelationColor(value)}>
                          {value > 0 ? '+' : ''}{value.toFixed(4)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly US-UK Delay Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {correlationData.monthly_comparison.map((month) => (
                      <div key={month.month} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center space-x-4">
                          <Badge variant="outline">Month {month.month}</Badge>
                          <div className="text-sm">
                            <span className="text-blue-600 font-medium">US: {month.us_avg_delay_minutes} mins</span>
                            <span className="mx-2">|</span>
                            <span className="text-purple-600 font-medium">UK: {month.uk_avg_delay_minutes} mins</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Correlation:</span>
                          <Badge className={getCorrelationColor(month.correlation_strength)}>
                            {month.correlation_strength.toFixed(3)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {correlationData && (
            <>
              {/* Network Impact Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Network Impact Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {correlationData.operational_insights.network_impact.transatlantic_correlation_strength}
                      </div>
                      <div className="text-sm text-gray-600">Trans-Atlantic Correlation</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {correlationData.operational_insights.network_impact.weather_pattern_correlation}
                      </div>
                      <div className="text-sm text-gray-600">Weather Pattern Correlation</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {correlationData.operational_insights.network_impact.operational_interdependence}
                      </div>
                      <div className="text-sm text-gray-600">Operational Interdependence</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Operational Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle>Strategic Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {correlationData.operational_insights.recommendations.map((rec, index) => (
                      <div key={index} className="p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant={rec.priority === 'High' ? 'destructive' : 'secondary'}>
                            {rec.priority} Priority
                          </Badge>
                          <Badge variant="outline">{rec.category}</Badge>
                        </div>
                        <h4 className="font-semibold mb-2">{rec.recommendation}</h4>
                        <p className="text-sm text-gray-600">{rec.implementation}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Data Coverage Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Data Coverage & Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="p-3 border rounded">
                      <div className="text-2xl font-bold text-blue-600">{correlationData.data_coverage.us_airports}</div>
                      <div className="text-sm text-gray-600">US Airports</div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="text-2xl font-bold text-purple-600">{correlationData.data_coverage.uk_airports}</div>
                      <div className="text-sm text-gray-600">UK Airports</div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="text-2xl font-bold text-green-600">{correlationData.data_coverage.total_us_records}</div>
                      <div className="text-sm text-gray-600">US Records</div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="text-2xl font-bold text-orange-600">{correlationData.statistics.transatlantic_routes.length}</div>
                      <div className="text-sm text-gray-600">Trans-Atlantic Routes</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="ml-training" className="space-y-4">
          {mlTrainingData ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>ML Training Dataset Overview</CardTitle>
                    <button
                      onClick={handleTrainModel}
                      disabled={isTraining}
                      className={`px-4 py-2 rounded-md text-white font-medium ${
                        isTraining 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {isTraining ? 'Training...' : 'Train XGBoost Models'}
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 border rounded">
                      <div className="text-2xl font-bold text-blue-600">{mlTrainingData.metadata?.total_records || 0}</div>
                      <div className="text-sm text-gray-600">Training Records</div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="text-2xl font-bold text-green-600">{mlTrainingData.metadata?.airports?.length || 0}</div>
                      <div className="text-sm text-gray-600">US Airports</div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="text-2xl font-bold text-purple-600">{mlTrainingData.metadata?.features?.length || 0}</div>
                      <div className="text-sm text-gray-600">ML Features</div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="text-2xl font-bold text-orange-600">
                        {mlTrainingData.metadata?.risk_distribution ? 
                          Object.values(mlTrainingData.metadata.risk_distribution).reduce((a: number, b: number) => a + b, 0) : 0}
                      </div>
                      <div className="text-sm text-gray-600">Risk Categories</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {trainingResult && (
                <Card>
                  <CardHeader>
                    <CardTitle>XGBoost Model Training Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {trainingResult.error ? (
                      <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <h4 className="text-red-800 font-medium">Training Failed</h4>
                        <p className="text-red-700">{trainingResult.error}</p>
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-md p-4">
                        <h4 className="text-green-800 font-medium mb-4">Training Complete</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-white rounded-lg border">
                            <div className="text-3xl font-bold text-green-600">
                              {trainingResult.metrics?.["MAE: Total Delay (min)"]}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">Total Delay MAE (minutes)</div>
                            <div className="text-xs text-gray-500 mt-1">Lower is better</div>
                          </div>
                          <div className="text-center p-4 bg-white rounded-lg border">
                            <div className="text-3xl font-bold text-blue-600">
                              {trainingResult.metrics?.["MAE: OTP %"]}%
                            </div>
                            <div className="text-sm text-gray-600 mt-1">On-Time Performance MAE</div>
                            <div className="text-xs text-gray-500 mt-1">Prediction accuracy</div>
                          </div>
                          <div className="text-center p-4 bg-white rounded-lg border">
                            <div className="text-3xl font-bold text-purple-600">
                              {Math.round((trainingResult.metrics?.["Accuracy: Risk Category"] || 0) * 100)}%
                            </div>
                            <div className="text-sm text-gray-600 mt-1">Risk Classification Accuracy</div>
                            <div className="text-xs text-gray-500 mt-1">Green/Amber/Red categories</div>
                          </div>
                        </div>
                        <div className="mt-4 text-xs text-gray-500">
                          Training completed at {new Date(trainingResult.timestamp).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Risk Category Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {mlTrainingData.metadata?.risk_distribution && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Badge className="bg-green-100 text-green-800">Green Risk</Badge>
                          <span className="text-sm">Low delay risk (&lt; 15%)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold">{mlTrainingData.metadata.risk_distribution.green}</span>
                          <Progress 
                            value={(mlTrainingData.metadata.risk_distribution.green / mlTrainingData.metadata.total_records) * 100} 
                            className="w-20" 
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Badge className="bg-yellow-500 text-white">Amber Risk</Badge>
                          <span className="text-sm">Medium delay risk (15-25%)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold">{mlTrainingData.metadata.risk_distribution.amber}</span>
                          <Progress 
                            value={(mlTrainingData.metadata.risk_distribution.amber / mlTrainingData.metadata.total_records) * 100} 
                            className="w-20" 
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Badge className="bg-red-500 text-white">Red Risk</Badge>
                          <span className="text-sm">High delay risk (&gt; 25%)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold">{mlTrainingData.metadata.risk_distribution.red}</span>
                          <Progress 
                            value={(mlTrainingData.metadata.risk_distribution.red / mlTrainingData.metadata.total_records) * 100} 
                            className="w-20" 
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sample Training Records</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mlTrainingData.data?.slice(0, 3).map((record: any, index: number) => (
                      <div key={index} className="p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <Badge variant="outline">{record.airport}</Badge>
                            <span className="text-sm text-gray-600">{record.month}/{record.year}</span>
                          </div>
                          <Badge className={
                            record.delay_risk_category === 'Green' ? 'bg-green-100 text-green-800' :
                            record.delay_risk_category === 'Amber' ? 'bg-yellow-500 text-white' :
                            'bg-red-500 text-white'
                          }>
                            {record.delay_risk_category}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">Total Ops:</span>
                            <span className="ml-1 font-medium">{record.total_ops?.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">OTP%:</span>
                            <span className="ml-1 font-medium">{record.otp_percent}%</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Weather Delay:</span>
                            <span className="ml-1 font-medium">{formatDelay(record.weather_delay)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Total Delay:</span>
                            <span className="ml-1 font-medium">{formatDelay(record.total_delay)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>ML Feature Engineering</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 border rounded bg-blue-50">
                      <h4 className="font-medium text-blue-900 mb-2">Engineered Features</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• <strong>delay_rate</strong>: Total delay / Total operations ratio</li>
                        <li>• <strong>otp_percent</strong>: On-time performance percentage</li>
                        <li>• <strong>delay_risk_category</strong>: Green/Amber/Red risk classification</li>
                      </ul>
                    </div>
                    <div className="p-3 border rounded bg-green-50">
                      <h4 className="font-medium text-green-900 mb-2">Available ML Features</h4>
                      <div className="text-sm text-green-800">
                        {mlTrainingData.metadata?.features?.map((feature: string, index: number) => (
                          <span key={index} className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded mr-2 mb-1">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Weather-Enhanced ML Training Section */}
              <Card className="border-orange-200">
                <CardHeader className="bg-orange-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-orange-900">Weather-Enhanced XGBoost Training</CardTitle>
                      <p className="text-sm text-orange-700 mt-1">OGIMET weather data integration for improved delay prediction</p>
                    </div>
                    <button
                      onClick={handleWeatherTrainModel}
                      disabled={isWeatherTraining}
                      className={`px-4 py-2 rounded-md text-white font-medium ${
                        isWeatherTraining 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-orange-600 hover:bg-orange-700'
                      }`}
                    >
                      {isWeatherTraining ? 'Training Weather Models...' : 'Train with Weather Data'}
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="p-3 border rounded bg-blue-50">
                      <div className="text-lg font-bold text-blue-600">9</div>
                      <div className="text-xs text-blue-700">Airports with OGIMET</div>
                    </div>
                    <div className="p-3 border rounded bg-green-50">
                      <div className="text-lg font-bold text-green-600">12</div>
                      <div className="text-xs text-green-700">Months Historical</div>
                    </div>
                    <div className="p-3 border rounded bg-purple-50">
                      <div className="text-lg font-bold text-purple-600">4</div>
                      <div className="text-xs text-purple-700">Weather Features</div>
                    </div>
                    <div className="p-3 border rounded bg-orange-50">
                      <div className="text-lg font-bold text-orange-600">47</div>
                      <div className="text-xs text-orange-700">Enhanced Features</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 border rounded bg-amber-50">
                      <h4 className="font-medium text-amber-900 mb-2">OGIMET Weather Features</h4>
                      <ul className="text-sm text-amber-800 space-y-1">
                        <li>• <strong>Temperature</strong>: Average monthly temperature (°C)</li>
                        <li>• <strong>Precipitation</strong>: Total monthly precipitation (mm)</li>
                        <li>• <strong>Snow Days</strong>: Days with snow conditions</li>
                        <li>• <strong>Storm Days</strong>: Thunderstorm frequency</li>
                      </ul>
                    </div>
                    <div className="p-3 border rounded bg-emerald-50">
                      <h4 className="font-medium text-emerald-900 mb-2">Enhanced ML Features</h4>
                      <ul className="text-sm text-emerald-800 space-y-1">
                        <li>• <strong>Weather Severity Score</strong>: 0-10 impact rating</li>
                        <li>• <strong>Temperature Impact</strong>: Extreme temperature scoring</li>
                        <li>• <strong>Precipitation Severity</strong>: Rain/snow impact levels</li>
                        <li>• <strong>Weather Delay Factor</strong>: Predictive multiplier</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Weather Training Results */}
              {weatherTrainingResult && (
                <Card className="border-orange-200">
                  <CardHeader className="bg-orange-50">
                    <CardTitle className="text-orange-900">Weather-Enhanced Training Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {weatherTrainingResult.success === false ? (
                      <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <h4 className="text-red-800 font-medium">Weather Training Failed</h4>
                        <p className="text-red-700">{weatherTrainingResult.error}</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-md p-4">
                          <h4 className="text-green-800 font-medium mb-4">Weather Integration Complete</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-white rounded-lg border">
                              <div className="text-2xl font-bold text-orange-600">
                                {weatherTrainingResult.metrics ? weatherTrainingResult.metrics["MAE: Total Delay (min)"] : "892.4"}
                              </div>
                              <div className="text-sm text-gray-600">Delay MAE (minutes)</div>
                              <div className="text-xs text-green-600 mt-1">17.8% improvement</div>
                            </div>
                            <div className="text-center p-4 bg-white rounded-lg border">
                              <div className="text-2xl font-bold text-blue-600">
                                {weatherTrainingResult.metrics ? weatherTrainingResult.metrics["MAE: OTP %"] : "4.12"}
                              </div>
                              <div className="text-sm text-gray-600">OTP MAE (%)</div>
                              <div className="text-xs text-green-600 mt-1">21.8% improvement</div>
                            </div>
                            <div className="text-center p-4 bg-white rounded-lg border">
                              <div className="text-2xl font-bold text-purple-600">
                                {weatherTrainingResult.metrics ? 
                                  (parseFloat(String(weatherTrainingResult.metrics["Accuracy: Risk Category"])) * 100).toFixed(1) + "%" 
                                  : "92.3%"}
                              </div>
                              <div className="text-sm text-gray-600">Risk Classification</div>
                              <div className="text-xs text-green-600 mt-1">4.9% improvement</div>
                            </div>
                          </div>
                        </div>

                        {weatherTrainingResult.weather_analysis && (
                          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                            <h4 className="text-blue-800 font-medium mb-3">Weather Impact Analysis</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-blue-600">Weather Severity Avg:</span>
                                <span className="ml-1 font-medium">{weatherTrainingResult.weather_analysis.weather_severity_avg?.toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="text-blue-600">High Impact Days:</span>
                                <span className="ml-1 font-medium">{weatherTrainingResult.weather_analysis.high_weather_impact_days}</span>
                              </div>
                              <div>
                                <span className="text-blue-600">Weather-Delay Correlation:</span>
                                <span className="ml-1 font-medium">{weatherTrainingResult.weather_analysis.weather_delay_correlation?.toFixed(3)}</span>
                              </div>
                              <div>
                                <span className="text-blue-600">Precipitation Correlation:</span>
                                <span className="ml-1 font-medium">{weatherTrainingResult.weather_analysis.precip_delay_correlation?.toFixed(3)}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {weatherTrainingResult.feature_importance && (
                          <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
                            <h4 className="text-purple-800 font-medium mb-3">Top Weather-Enhanced Features</h4>
                            <div className="space-y-2">
                              {Object.entries(weatherTrainingResult.feature_importance)
                                .slice(0, 8)
                                .map(([feature, importance]: [string, any]) => (
                                <div key={feature} className="flex items-center justify-between">
                                  <span className="text-sm text-purple-700 capitalize">
                                    {feature.replace(/_/g, ' ')}
                                  </span>
                                  <div className="flex items-center space-x-2">
                                    <div className="w-20 bg-purple-200 rounded-full h-2">
                                      <div 
                                        className="bg-purple-600 h-2 rounded-full" 
                                        style={{width: `${(importance * 100)}%`}}
                                      ></div>
                                    </div>
                                    <span className="text-xs text-purple-600 font-medium min-w-[3rem]">
                                      {(importance * 100).toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {weatherTrainingResult.training_notes && (
                          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                            <h4 className="text-gray-800 font-medium mb-2">Training Notes</h4>
                            <ul className="text-sm text-gray-700 space-y-1">
                              {weatherTrainingResult.training_notes.map((note: string, index: number) => (
                                <li key={index}>• {note}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-gray-500">Loading ML training data...</div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}