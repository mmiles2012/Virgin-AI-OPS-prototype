import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { AlertTriangle, Plane, Cloud, Snowflake, Zap } from "lucide-react";

interface HubData {
  airport: string;
  month: number;
  year: number;
  actual_delay: number;
  predicted_delay: number;
  baseline_delay: number;
  actual_otp: number;
  predicted_otp: number;
  baseline_otp: number;
  actual_risk: string;
  predicted_risk: string;
  baseline_risk: string;
  storm_days: number;
  snow_days: number;
  precip_mm: number;
  nas_delay_status: string;
  nas_reason: string;
  nas_avg_delay: string;
  trigger_alert: boolean;
}

export default function SmartHubTileGrid() {
  const [hubs, setHubs] = useState<HubData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  const fetchHubData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/smart-hub-summary");
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setHubs(data);
      setLastUpdate(new Date().toLocaleTimeString());
      setError(null);
    } catch (err) {
      setError("Unable to load smart hub data");
      console.error("Error fetching smart hub data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHubData();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchHubData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "green": return "bg-green-100 border-green-300 text-green-800";
      case "amber": return "bg-amber-100 border-amber-300 text-amber-800";
      case "red": return "bg-red-100 border-red-300 text-red-800";
      default: return "bg-gray-100 border-gray-300 text-gray-800";
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "red": return <AlertTriangle className="w-4 h-4" />;
      case "amber": return <Zap className="w-4 h-4" />;
      case "green": return <Plane className="w-4 h-4" />;
      default: return <Cloud className="w-4 h-4" />;
    }
  };

  const getDelayDifference = (predicted: number, actual: number) => {
    const diff = predicted - actual;
    const absStuff = Math.abs(diff);
    if (absStuff < 5) return { text: "Accurate", color: "text-green-600" };
    if (absStuff < 15) return { text: `${diff > 0 ? '+' : ''}${diff.toFixed(0)}min`, color: "text-amber-600" };
    return { text: `${diff > 0 ? '+' : ''}${diff.toFixed(0)}min`, color: "text-red-600" };
  };

  if (loading && hubs.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="w-5 h-5" />
            Smart Hub Watch - Weather Enhanced
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aero-blue-primary/30"></div>
            <span className="ml-3 text-muted-foreground">Loading intelligent hub analysis...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Smart Hub Watch - Connection Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
            <button 
              onClick={fetchHubData}
              className="mt-3 px-4 py-2 bg-va-red-primary text-foreground rounded hover:bg-va-red-heritage"
            >
              Retry Connection
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const alertCount = hubs.filter(h => h.trigger_alert).length;
  const highRiskCount = hubs.filter(h => h.predicted_risk === 'Red').length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plane className="w-5 h-5" />
              Smart Hub Watch - Weather Enhanced ML Predictions
            </div>
            <div className="flex items-center gap-4 text-sm">
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {alertCount} Alerts
              </Badge>
              <span className="text-foreground0">Updated: {lastUpdate}</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-aero-blue-dark">{hubs.length}</div>
              <div className="text-sm text-blue-700">Major US Hubs</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{highRiskCount}</div>
              <div className="text-sm text-red-700">High Risk Hubs</div>
            </div>
            <div className="bg-amber-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">{alertCount}</div>
              <div className="text-sm text-amber-700">Active Alerts</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hubs.map(hub => {
              const delayDiff = getDelayDifference(hub.predicted_delay, hub.actual_delay);
              
              return (
                <Card 
                  key={hub.airport} 
                  className={`transition-all duration-200 hover:shadow-lg ${
                    hub.trigger_alert ? 'ring-2 ring-red-500 shadow-red-100' : ''
                  } ${getRiskColor(hub.predicted_risk)}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        {getRiskIcon(hub.predicted_risk)}
                        {hub.airport}
                      </CardTitle>
                      {hub.trigger_alert && (
                        <Badge variant="destructive" className="text-xs">
                          ALERT
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Live Status */}
                    <div className="bg-white/50 p-2 rounded border">
                      <div className="text-xs font-medium text-muted-foreground">Live FAA Status</div>
                      <div className="text-sm font-medium">{hub.nas_delay_status || "Normal"}</div>
                      <div className="text-xs text-muted-foreground">{hub.nas_reason || "No delays"}</div>
                      <div className="text-xs">{hub.nas_avg_delay || "0 min"}</div>
                    </div>

                    {/* ML Predictions */}
                    <div className="bg-white/50 p-2 rounded border">
                      <div className="text-xs font-medium text-muted-foreground">ML vs Actual</div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Delay: {hub.predicted_delay.toFixed(0)}min</span>
                        <span className={`text-xs font-medium ${delayDiff.color}`}>
                          {delayDiff.text}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Actual: {hub.actual_delay.toFixed(0)}min | OTP: {hub.predicted_otp.toFixed(1)}%
                      </div>
                    </div>

                    {/* Weather Data */}
                    <div className="bg-white/50 p-2 rounded border">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Weather Impact</div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-yellow-600" />
                          <span>{hub.storm_days}</span>
                        </div>
                        {hub.snow_days > 0 && (
                          <div className="flex items-center gap-1">
                            <Snowflake className="w-3 h-3 text-aero-blue-dark" />
                            <span>{hub.snow_days}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Cloud className="w-3 h-3 text-muted-foreground" />
                          <span>{hub.precip_mm?.toFixed(0)}mm</span>
                        </div>
                      </div>
                    </div>

                    {/* Risk Assessment */}
                    <div className="bg-white/50 p-2 rounded border">
                      <div className="text-xs font-medium text-muted-foreground">Risk Level</div>
                      <Badge className={`${getRiskColor(hub.predicted_risk)} text-xs`}>
                        {hub.predicted_risk} Risk
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-4 text-xs text-foreground0 flex items-center justify-between">
            <span>Weather-enhanced ML predictions with live FAA NASSTATUS integration</span>
            <button 
              onClick={fetchHubData}
              className="px-3 py-1 text-aero-blue-dark hover:bg-blue-50 rounded"
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}