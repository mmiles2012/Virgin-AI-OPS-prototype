import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Plane, Cloud, Snowflake, Zap, TrendingUp, TrendingDown } from "lucide-react";

interface ConsolidatedAirportData {
  airport: string;
  month: number;
  year: number;
  
  // Core delay metrics
  actual_delay: number;
  predicted_delay: number;
  baseline_delay: number;
  
  // Performance metrics
  actual_otp: number;
  predicted_otp: number;
  baseline_otp: number;
  
  // Risk assessment
  actual_risk: "Green" | "Amber" | "Red";
  predicted_risk: "Green" | "Amber" | "Red";
  baseline_risk: "Green" | "Amber" | "Red";
  
  // Weather data
  storm_days: number;
  snow_days: number;
  precip_mm: number;
  
  // Live FAA data
  nas_delay_status: string;
  nas_reason: string;
  nas_avg_delay: string;
  trigger_alert: boolean;
  
  // Historical context (from FAA BTS data)
  total_ops?: number;
  carrier_delay?: number;
  weather_delay?: number;
  nas_delay?: number;
  security_delay?: number;
  late_aircraft_delay?: number;
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

export default function ConsolidatedFaaDashboard() {
  const [airportData, setAirportData] = useState<ConsolidatedAirportData[]>([]);
  const [correlationData, setCorrelationData] = useState<USUKCorrelation | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [lastUpdate, setLastUpdate] = useState<string>("");

  useEffect(() => {
    const fetchConsolidatedData = async () => {
      try {
        // Fetch Smart Hub data (primary source with ML predictions)
        const smartHubResponse = await fetch("/api/smart-hub-summary");
        const smartHubData = await smartHubResponse.json();
        
        // Fetch US-UK correlation data
        const correlationResponse = await fetch("/api/us-uk-correlation");
        const correlationResult = await correlationResponse.json();
        
        setAirportData(smartHubData || []);
        setCorrelationData(correlationResult);
        setLastUpdate(new Date().toLocaleTimeString());
        setLoading(false);
      } catch (error) {
        console.error("Error fetching consolidated data:", error);
        setLoading(false);
      }
    };

    fetchConsolidatedData();
    
    // Auto-refresh every 3 minutes
    const interval = setInterval(fetchConsolidatedData, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case "green": return "bg-green-100 border-green-300 text-green-800";
      case "amber": return "bg-amber-100 border-amber-300 text-amber-800";
      case "red": return "bg-red-100 border-red-300 text-red-800";
      default: return "bg-gray-100 border-gray-300 text-gray-800";
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case "red": return <AlertTriangle className="w-4 h-4" />;
      case "amber": return <Zap className="w-4 h-4" />;
      case "green": return <Plane className="w-4 h-4" />;
      default: return <Cloud className="w-4 h-4" />;
    }
  };

  const getWeatherIcon = (airport: ConsolidatedAirportData) => {
    if (airport.snow_days > 0) return <Snowflake className="w-4 h-4 text-blue-600" />;
    if (airport.storm_days > 3) return <Zap className="w-4 h-4 text-yellow-600" />;
    if (airport.precip_mm > 100) return <Cloud className="w-4 h-4 text-gray-600" />;
    return null;
  };

  const getTrendIcon = (actual: number, predicted: number) => {
    const difference = predicted - actual;
    if (Math.abs(difference) < 5) return null;
    return difference > 0 ? 
      <TrendingUp className="w-4 h-4 text-red-500" /> : 
      <TrendingDown className="w-4 h-4 text-green-500" />;
  };

  const formatDelay = (minutes: number): string => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = Math.round(minutes % 60);
    return `${hours}h ${remainingMins}m`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-40">
          <div className="text-gray-500">Loading consolidated aviation intelligence...</div>
        </div>
      </div>
    );
  }

  // Filter high-priority alerts
  const highPriorityAirports = airportData.filter(airport => 
    airport.trigger_alert || airport.actual_risk === "Red" || airport.predicted_risk === "Red"
  );

  const topDelayAirports = airportData
    .sort((a, b) => b.actual_delay - a.actual_delay)
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      {/* Header with Status Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">US Aviation Intelligence</h1>
          <p className="text-gray-600">
            Consolidated real-time delay prediction and weather analysis
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Last updated: {lastUpdate}</div>
          <div className="flex items-center space-x-2 mt-1">
            <Badge variant="outline">{airportData.length} airports monitored</Badge>
            <Badge className={highPriorityAirports.length > 0 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
              {highPriorityAirports.length} alerts
            </Badge>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Live Overview</TabsTrigger>
          <TabsTrigger value="predictions">ML Predictions</TabsTrigger>
          <TabsTrigger value="correlation">Trans-Atlantic</TabsTrigger>
          <TabsTrigger value="weather">Weather Impact</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Critical Alerts Banner */}
          {highPriorityAirports.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-red-800">
                  <AlertTriangle className="w-5 h-5" />
                  <span>High Priority Alerts ({highPriorityAirports.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {highPriorityAirports.map((airport) => (
                    <div key={airport.airport} className="flex items-center justify-between p-3 bg-white rounded border">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{airport.airport}</span>
                        {getWeatherIcon(airport)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getRiskColor(airport.actual_risk)}>
                          {getRiskIcon(airport.actual_risk)}
                          {airport.actual_risk}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {formatDelay(airport.actual_delay)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Delay Airports Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Current Highest Delays</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topDelayAirports.map((airport, index) => (
                  <div key={airport.airport} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <span className="font-medium text-lg">{airport.airport}</span>
                      {getWeatherIcon(airport)}
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="font-semibold">{formatDelay(airport.actual_delay)}</div>
                        <div className="text-xs text-gray-500">
                          NAS: {airport.nas_delay_status || 'Normal'}
                        </div>
                      </div>
                      <Badge className={getRiskColor(airport.actual_risk)}>
                        {getRiskIcon(airport.actual_risk)}
                        {airport.actual_risk}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* All Airports Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {airportData.map((airport) => (
              <Card key={airport.airport} className={`hover:shadow-lg transition-shadow ${
                airport.trigger_alert ? 'border-orange-300 bg-orange-50' : ''
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <span>{airport.airport}</span>
                      {getWeatherIcon(airport)}
                    </CardTitle>
                    <Badge className={getRiskColor(airport.actual_risk)}>
                      {getRiskIcon(airport.actual_risk)}
                      {airport.actual_risk}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Current Delay</span>
                    <div className="flex items-center space-x-1">
                      <span className="font-semibold">{formatDelay(airport.actual_delay)}</span>
                      {getTrendIcon(airport.actual_delay, airport.predicted_delay)}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">On-Time Performance</span>
                    <span className="font-semibold">{airport.actual_otp.toFixed(1)}%</span>
                  </div>

                  {airport.nas_delay_status && airport.nas_delay_status !== 'Normal' && (
                    <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                      <div className="font-medium text-yellow-800">FAA Status: {airport.nas_delay_status}</div>
                      {airport.nas_reason && (
                        <div className="text-yellow-700">Reason: {airport.nas_reason}</div>
                      )}
                    </div>
                  )}

                  {(airport.storm_days > 0 || airport.snow_days > 0 || airport.precip_mm > 50) && (
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Weather: {airport.storm_days}⛈️ {airport.snow_days}❄️</span>
                      <span>{Math.round(airport.precip_mm)}mm</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ML Prediction vs Actual Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {airportData.map((airport) => {
                  const delayAccuracy = Math.abs(airport.predicted_delay - airport.actual_delay);
                  const otpAccuracy = Math.abs(airport.predicted_otp - airport.actual_otp);
                  
                  return (
                    <div key={airport.airport} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">{airport.airport}</h3>
                        <Badge className={getRiskColor(airport.predicted_risk)}>
                          Predicted: {airport.predicted_risk}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Predicted Delay:</span>
                          <span className="font-medium">{formatDelay(airport.predicted_delay)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Actual Delay:</span>
                          <span className="font-medium">{formatDelay(airport.actual_delay)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Accuracy:</span>
                          <Badge className={delayAccuracy < 10 ? "bg-green-100 text-green-800" : 
                                           delayAccuracy < 20 ? "bg-yellow-500 text-white" : 
                                           "bg-red-100 text-red-800"}>
                            ±{formatDelay(delayAccuracy)}
                          </Badge>
                        </div>
                        
                        <div className="pt-2 border-t">
                          <div className="flex justify-between">
                            <span>Predicted OTP:</span>
                            <span className="font-medium">{airport.predicted_otp.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Actual OTP:</span>
                            <span className="font-medium">{airport.actual_otp.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="correlation" className="space-y-4">
          {correlationData && (
            <>
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
                        <Badge className={Math.abs(value) > 0.7 ? "bg-blue-100 text-blue-800" : 
                                         Math.abs(value) > 0.4 ? "bg-yellow-500 text-white" : 
                                         "bg-gray-100 text-gray-800"}>
                          {value > 0 ? '+' : ''}{value.toFixed(4)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

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
                        <Badge className={Math.abs(month.correlation_strength) > 0.7 ? "bg-blue-100 text-blue-800" : 
                                         Math.abs(month.correlation_strength) > 0.4 ? "bg-yellow-500 text-white" : 
                                         "bg-gray-100 text-gray-800"}>
                          {month.correlation_strength.toFixed(3)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="weather" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Weather Impact Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {airportData
                  .filter(airport => airport.storm_days > 0 || airport.snow_days > 0 || airport.precip_mm > 50)
                  .map((airport) => (
                    <Card key={airport.airport} className="border-blue-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{airport.airport}</CardTitle>
                          {getWeatherIcon(airport)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Storm Days:</span>
                          <Badge className={airport.storm_days > 5 ? "bg-red-500 text-white" : "bg-yellow-500 text-white"}>
                            {airport.storm_days}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Snow Days:</span>
                          <Badge className={airport.snow_days > 3 ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}>
                            {airport.snow_days}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Precipitation:</span>
                          <Badge className={airport.precip_mm > 100 ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}>
                            {Math.round(airport.precip_mm)} mm
                          </Badge>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Weather Impact on Delays:</span>
                            <span className="font-semibold">{formatDelay(airport.actual_delay)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}