import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { AlertTriangle, Plane, Clock, MapPin } from "lucide-react";

interface LiveDelayData {
  faa: string;
  airport_name: string;
  delay_category: string;
  status: string;
  reason: string;
  avg_delay: string;
  delay_minutes: number;
  risk_level: string;
  estimated_otp: number;
}

export default function FaaLiveStatus() {
  const [liveData, setLiveData] = useState<LiveDelayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  const fetchLiveData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/faa-live-delay");
      const result = await response.json();
      
      if (result.success) {
        setLiveData(result.data);
        setLastUpdate(new Date().toLocaleTimeString());
        setError(null);
      } else {
        setError(result.error || "Failed to fetch live data");
      }
    } catch (err) {
      setError("Unable to connect to FAA NASSTATUS");
      console.error("Error fetching live FAA data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchLiveData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'red': return 'bg-red-100 text-red-800 border-red-200';
      case 'amber': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'green': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'red': return <AlertTriangle className="w-4 h-4" />;
      case 'amber': return <Clock className="w-4 h-4" />;
      case 'green': return <Plane className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  if (loading && liveData.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="w-5 h-5" />
            Live FAA Delay Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aero-blue-primary/30"></div>
            <span className="ml-3 text-muted-foreground">Connecting to FAA NASSTATUS...</span>
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
            Live FAA Status - Connection Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
            <button 
              onClick={fetchLiveData}
              className="mt-3 px-4 py-2 bg-va-red-primary text-foreground rounded hover:bg-va-red-heritage"
            >
              Retry Connection
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="w-5 h-5" />
            Live FAA Delay Status
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground0">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Last updated: {lastUpdate}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-aero-blue-dark">{liveData.length}</div>
            <div className="text-sm text-blue-700">Airports Monitored</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {liveData.filter(d => d.risk_level === 'Red').length}
            </div>
            <div className="text-sm text-red-700">High Risk Airports</div>
          </div>
          <div className="bg-amber-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-amber-600">
              {liveData.filter(d => d.risk_level === 'Amber').length}
            </div>
            <div className="text-sm text-amber-700">Moderate Risk</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left p-3 font-medium">Airport</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Risk</th>
                <th className="text-left p-3 font-medium">Delay</th>
                <th className="text-left p-3 font-medium">Est. OTP</th>
                <th className="text-left p-3 font-medium">Reason</th>
              </tr>
            </thead>
            <tbody>
              {liveData.map((airport, index) => (
                <tr key={`${airport.faa}-${index}`} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <div>
                      <div className="font-medium">{airport.faa}</div>
                      <div className="text-sm text-muted-foreground">{airport.airport_name}</div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="text-sm">{airport.status}</span>
                  </td>
                  <td className="p-3">
                    <Badge className={`${getRiskColor(airport.risk_level)} flex items-center gap-1 w-fit`}>
                      {getStatusIcon(airport.risk_level)}
                      {airport.risk_level}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div>
                      <div className="font-medium">{airport.avg_delay}</div>
                      <div className="text-xs text-foreground0">
                        ({airport.delay_minutes} min)
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{airport.estimated_otp.toFixed(1)}%</div>
                  </td>
                  <td className="p-3">
                    <span className="text-sm text-muted-foreground">{airport.reason}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-xs text-foreground0 flex items-center justify-between">
          <span>Data source: FAA NASSTATUS (Live)</span>
          <button 
            onClick={fetchLiveData}
            className="px-3 py-1 text-aero-blue-dark hover:bg-blue-50 rounded"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}