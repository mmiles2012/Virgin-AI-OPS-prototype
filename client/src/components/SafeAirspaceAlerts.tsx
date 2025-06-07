import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, Clock, MapPin, Radio, Plane, Info } from 'lucide-react';
import { useSelectedFlight } from '../lib/stores/useSelectedFlight';

interface SafeAirspaceAlert {
  id: string;
  type: 'NOTAM' | 'TFR' | 'RESTRICTED' | 'WARNING' | 'PROHIBITED';
  title: string;
  description: string;
  location: {
    lat: number;
    lon: number;
    radius?: number;
  };
  altitude: {
    min: number;
    max: number;
  };
  timeframe: {
    start: string;
    end: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  lastUpdated: string;
}

export default function SafeAirspaceAlerts() {
  const [alerts, setAlerts] = useState<SafeAirspaceAlert[]>([]);
  const [flightPathAlerts, setFlightPathAlerts] = useState<SafeAirspaceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const { selectedFlight } = useSelectedFlight();

  useEffect(() => {
    fetchAirspaceAlerts();
    const interval = setInterval(fetchAirspaceAlerts, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedFlight) {
      checkFlightPathAlerts();
    } else {
      setFlightPathAlerts([]);
    }
  }, [selectedFlight]);

  const fetchAirspaceAlerts = async () => {
    try {
      const response = await fetch('/api/aviation/airspace-alerts');
      const data = await response.json();
      
      if (data.success) {
        setAlerts(data.alerts);
        setLastUpdated(data.timestamp);
      }
    } catch (error) {
      console.error('Failed to fetch airspace alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkFlightPathAlerts = async () => {
    if (!selectedFlight) return;

    try {
      const response = await fetch('/api/aviation/check-flight-alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: { lat: 51.4700, lon: -0.4543 }, // Default origin (LHR)
          destination: { lat: 40.6413, lon: -73.7781 }, // Default destination (JFK)
          currentPosition: {
            lat: selectedFlight.latitude,
            lon: selectedFlight.longitude
          },
          altitude: selectedFlight.altitude
        })
      });

      const data = await response.json();
      if (data.success) {
        setFlightPathAlerts(data.alerts);
      }
    } catch (error) {
      console.error('Failed to check flight path alerts:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-500/10 text-red-400';
      case 'high':
        return 'border-orange-500 bg-orange-500/10 text-orange-400';
      case 'medium':
        return 'border-yellow-500 bg-yellow-500/10 text-yellow-400';
      case 'low':
        return 'border-blue-500 bg-blue-500/10 text-blue-400';
      default:
        return 'border-gray-500 bg-gray-500/10 text-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'TFR':
        return <Shield className="h-4 w-4" />;
      case 'NOTAM':
        return <Info className="h-4 w-4" />;
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4" />;
      case 'RESTRICTED':
        return <Radio className="h-4 w-4" />;
      case 'PROHIBITED':
        return <Plane className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isActiveAlert = (alert: SafeAirspaceAlert) => {
    const now = new Date();
    const start = new Date(alert.timeframe.start);
    const end = new Date(alert.timeframe.end);
    return now >= start && now <= end;
  };

  if (loading) {
    return (
      <div className="bg-gray-800/50 rounded-lg border border-gray-600 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-700 rounded"></div>
            <div className="h-16 bg-gray-700 rounded"></div>
            <div className="h-16 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const activeAlerts = alerts.filter(isActiveAlert);
  const relevantAlerts = selectedFlight ? flightPathAlerts : activeAlerts;

  return (
    <div className="bg-gray-800/50 rounded-lg border border-gray-600 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-400" />
          SafeAirspace Alerts
          {selectedFlight && (
            <span className="text-sm text-gray-400 ml-2">
              (Flight Path: {selectedFlight.callsign})
            </span>
          )}
        </h3>
        <div className="text-xs text-gray-400">
          <Clock className="h-3 w-3 inline mr-1" />
          Updated: {lastUpdated ? formatDateTime(lastUpdated) : 'Never'}
        </div>
      </div>

      {relevantAlerts.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No active airspace alerts</p>
          <p className="text-sm">
            {selectedFlight ? 'Flight path clear of restrictions' : 'All airspace normal'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {relevantAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getTypeIcon(alert.type)}
                  <span className="font-medium text-sm">{alert.type}</span>
                  <span className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300">
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
                <span className="text-xs text-gray-400">{alert.source}</span>
              </div>

              <h4 className="font-semibold text-white mb-2">{alert.title}</h4>
              <p className="text-sm text-gray-300 mb-3">{alert.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-1 text-gray-400 mb-1">
                    <MapPin className="h-3 w-3" />
                    Location
                  </div>
                  <div className="text-white">
                    {alert.location.lat.toFixed(4)}°, {alert.location.lon.toFixed(4)}°
                    {alert.location.radius && (
                      <div className="text-gray-400">Radius: {alert.location.radius} nm</div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1 text-gray-400 mb-1">
                    <Plane className="h-3 w-3" />
                    Altitude
                  </div>
                  <div className="text-white">
                    {alert.altitude.min.toLocaleString()} - {alert.altitude.max.toLocaleString()} ft
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1 text-gray-400 mb-1">
                    <Clock className="h-3 w-3" />
                    Duration
                  </div>
                  <div className="text-white">
                    <div>From: {formatDateTime(alert.timeframe.start)}</div>
                    <div>To: {formatDateTime(alert.timeframe.end)}</div>
                  </div>
                </div>
              </div>

              {!isActiveAlert(alert) && (
                <div className="mt-3 text-xs text-gray-500 italic">
                  Alert not currently active
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 text-xs text-gray-500">
        <p>Data sourced from aviation authorities including FAA, CAA, NATS, and Transport Canada.</p>
        <p>Always verify with official NOTAMs before flight operations.</p>
      </div>
    </div>
  );
}