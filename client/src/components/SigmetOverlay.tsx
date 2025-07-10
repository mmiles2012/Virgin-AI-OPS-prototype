/**
 * SIGMET Weather Overlay Component for Professional Satellite Map
 * Displays SIGMET and G-AIRMET alerts on the map with severity-based styling
 */

import React, { useEffect, useState } from 'react';
import { Circle, Popup, useMap } from 'react-leaflet';
import { AlertTriangle, Cloud, Wind, Zap, Info } from 'lucide-react';

interface SigmetAlert {
  id: string;
  type: string;
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
  weather_features?: {
    phenomenon: string;
    movement?: {
      direction: number;
      speed: number;
    };
  };
}

interface SigmetOverlayProps {
  showSigmets: boolean;
  onSigmetSelect?: (sigmet: SigmetAlert | null) => void;
}

export default function SigmetOverlay({ showSigmets, onSigmetSelect }: SigmetOverlayProps) {
  const [sigmets, setSigmets] = useState<SigmetAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const map = useMap();

  useEffect(() => {
    console.log('🌩️ SIGMET overlay effect triggered, showSigmets:', showSigmets);
    if (showSigmets) {
      fetchSigmets();
      // Update every 15 minutes
      const interval = setInterval(fetchSigmets, 15 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [showSigmets]);

  const fetchSigmets = async () => {
    if (!showSigmets) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/aviation/airspace-alerts');
      const data = await response.json();
      
      if (data.success) {
        // Filter for SIGMET and G-AIRMET alerts only
        const sigmetAlerts = data.alerts.filter((alert: any) => 
          alert.title.includes('SIGMET') || alert.title.includes('G-AIRMET')
        );
        
        // Always show demonstration alerts to show functionality (real alerts supplement these)
        const demoAlerts: SigmetAlert[] = [
          {
            id: 'demo_sigmet_1',
            type: 'SIGMET',
            title: 'SIGMET DEMO - Thunderstorm Activity',
            description: 'Isolated severe thunderstorms with tops to FL450. Moving northeast at 25 knots.',
            location: { lat: 51.5, lon: -1.5, radius: 50 },
            altitude: { min: 5000, max: 45000 },
            timeframe: { 
              start: new Date().toISOString(), 
              end: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() 
            },
            severity: 'high',
            source: 'Demo - Aviation Weather Center',
            lastUpdated: new Date().toISOString(),
            weather_features: {
              phenomenon: 'Thunderstorm',
              movement: { direction: 45, speed: 25 }
            }
          },
          {
            id: 'demo_gairmet_1',
            type: 'G-AIRMET',
            title: 'G-AIRMET DEMO - Moderate Turbulence',
            description: 'Moderate turbulence between FL200 and FL350 due to wind shear.',
            location: { lat: 52.2, lon: 0.5, radius: 75 },
            altitude: { min: 20000, max: 35000 },
            timeframe: { 
              start: new Date().toISOString(), 
              end: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() 
            },
            severity: 'medium',
            source: 'Demo - Aviation Weather Center',
            lastUpdated: new Date().toISOString(),
            weather_features: {
              phenomenon: 'Turbulence',
              movement: { direction: 270, speed: 15 }
            }
          }
        ];
        
        // Combine demo alerts with any real alerts
        const allAlerts = [...demoAlerts, ...sigmetAlerts];
        setSigmets(allAlerts);
        console.log(`🌩️ SIGMET Display: Loaded ${allAlerts.length} total alerts (${demoAlerts.length} demo + ${sigmetAlerts.length} real)`);
        console.log(`🌩️ SIGMET circles should now be visible on map near London coordinates`);
        
        setLastUpdate(data.timestamp);
      }
    } catch (error) {
      console.error('Failed to fetch SIGMET data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity.toLowerCase()) {
      case 'critical': return '#dc2626'; // Red
      case 'high': return '#ea580c'; // Orange
      case 'medium': return '#ca8a04'; // Yellow
      case 'low': return '#059669'; // Green
      default: return '#6b7280'; // Gray
    }
  };

  const getPhenomenonIcon = (phenomenon: string) => {
    const p = phenomenon.toLowerCase();
    if (p.includes('thunderstorm') || p.includes('tstm')) return <Zap className="w-4 h-4" />;
    if (p.includes('turbulence') || p.includes('turb')) return <Wind className="w-4 h-4" />;
    if (p.includes('icing') || p.includes('ice')) return <Cloud className="w-4 h-4" />;
    if (p.includes('volcanic') || p.includes('ash')) return <AlertTriangle className="w-4 h-4" />;
    return <Info className="w-4 h-4" />;
  };

  const formatDateTime = (isoString: string): string => {
    try {
      return new Date(isoString).toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatMovement = (movement?: { direction: number; speed: number }): string => {
    if (!movement) return 'Stationary';
    
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                       'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const dirIndex = Math.round(movement.direction / 22.5) % 16;
    const direction = directions[dirIndex];
    
    return `Moving ${direction} at ${movement.speed} kts`;
  };

  if (!showSigmets) return null;

  return (
    <>
      {sigmets.map((sigmet) => (
        <Circle
          key={sigmet.id}
          center={[sigmet.location.lat, sigmet.location.lon]}
          radius={(sigmet.location.radius || 25) * 1852} // Convert nautical miles to meters
          pathOptions={{
            color: getSeverityColor(sigmet.severity),
            fillColor: getSeverityColor(sigmet.severity),
            fillOpacity: 0.15,
            weight: 2,
            opacity: 0.8
          }}
          eventHandlers={{
            click: () => {
              onSigmetSelect?.(sigmet);
              console.log('SIGMET selected:', sigmet.title);
            },
            mouseover: (e) => {
              e.target.setStyle({ fillOpacity: 0.3, weight: 3 });
            },
            mouseout: (e) => {
              e.target.setStyle({ fillOpacity: 0.15, weight: 2 });
            }
          }}
        >
          <Popup maxWidth={350} className="sigmet-popup">
            <div className="space-y-3 text-sm">
              {/* Header */}
              <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                <div className="flex items-center gap-2">
                  {getPhenomenonIcon(sigmet.weather_features?.phenomenon || '')}
                  <div className="font-semibold text-gray-900">{sigmet.title}</div>
                </div>
                <div 
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    sigmet.severity === 'critical' ? 'bg-red-100 text-red-800' :
                    sigmet.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                    sigmet.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}
                >
                  {sigmet.severity.toUpperCase()}
                </div>
              </div>

              {/* Weather Phenomenon */}
              {sigmet.weather_features?.phenomenon && (
                <div>
                  <span className="font-medium text-gray-700">Phenomenon: </span>
                  <span className="text-gray-900">{sigmet.weather_features.phenomenon}</span>
                </div>
              )}

              {/* Description */}
              <div>
                <span className="font-medium text-gray-700">Description: </span>
                <span className="text-gray-900">{sigmet.description}</span>
              </div>

              {/* Altitude Range */}
              <div>
                <span className="font-medium text-gray-700">Altitude: </span>
                <span className="text-gray-900">
                  {sigmet.altitude.min === 0 ? 'SFC' : `FL${Math.round(sigmet.altitude.min / 100)}`} - 
                  FL{Math.round(sigmet.altitude.max / 100)}
                </span>
              </div>

              {/* Movement */}
              {sigmet.weather_features?.movement && (
                <div>
                  <span className="font-medium text-gray-700">Movement: </span>
                  <span className="text-gray-900">{formatMovement(sigmet.weather_features.movement)}</span>
                </div>
              )}

              {/* Time Information */}
              <div className="space-y-1">
                <div>
                  <span className="font-medium text-gray-700">Valid From: </span>
                  <span className="text-gray-900">{formatDateTime(sigmet.timeframe.start)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Valid Until: </span>
                  <span className="text-gray-900">{formatDateTime(sigmet.timeframe.end)}</span>
                </div>
              </div>

              {/* Source */}
              <div className="text-xs text-gray-500 border-t border-gray-200 pt-2">
                Source: {sigmet.source} • Updated: {formatDateTime(sigmet.lastUpdated)}
              </div>
            </div>
          </Popup>
        </Circle>
      ))}
    </>
  );
}