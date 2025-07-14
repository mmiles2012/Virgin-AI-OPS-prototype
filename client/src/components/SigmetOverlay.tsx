/**
 * SIGMET Weather Overlay Component for Professional Satellite Map
 * Displays SIGMET and G-AIRMET alerts on the map with severity-based styling
 */

import React, { useEffect, useState } from 'react';
import { Circle, Popup, Polygon, useMap } from 'react-leaflet';
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
  coordinates?: Array<[number, number]>; // For boundary polygon display
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

  // Extract coordinates from alert text or raw data
  const extractCoordinatesFromAlert = (alert: any): Array<[number, number]> | undefined => {
    // If coordinates are provided directly
    if (alert.coordinates && Array.isArray(alert.coordinates)) {
      return alert.coordinates;
    }
    
    // Parse coordinates from raw text if available
    const rawText = alert.raw_data || alert.description || '';
    const coordPattern = /(\d{1,2}\.\d{1,2}[NS])\s*(\d{1,3}\.\d{1,2}[EW])/g;
    const matches = [...rawText.matchAll(coordPattern)];
    
    if (matches.length >= 3) {
      // Convert to lat/lng pairs
      return matches.map(match => {
        const latStr = match[1];
        const lngStr = match[2];
        
        const lat = parseFloat(latStr.slice(0, -1)) * (latStr.endsWith('S') ? -1 : 1);
        const lng = parseFloat(lngStr.slice(0, -1)) * (lngStr.endsWith('W') ? -1 : 1);
        
        return [lat, lng] as [number, number];
      });
    }
    
    // If no specific coordinates, create a default boundary area
    if (alert.coordinates?.lat && alert.coordinates?.lon) {
      const centerLat = alert.coordinates.lat;
      const centerLon = alert.coordinates.lon;
      const radius = 0.5; // 0.5 degree radius (~55km)
      
      return [
        [centerLat + radius, centerLon - radius],
        [centerLat + radius, centerLon + radius],
        [centerLat - radius, centerLon + radius],
        [centerLat - radius, centerLon - radius],
        [centerLat + radius, centerLon - radius] // Close the polygon
      ];
    }
    
    return undefined;
  };

  // Map severity levels to display categories
  const mapSeverityLevel = (severity: string): 'low' | 'medium' | 'high' | 'critical' => {
    const severityStr = severity?.toLowerCase() || '';
    if (severityStr.includes('critical') || severityStr.includes('severe')) return 'critical';
    if (severityStr.includes('high') || severityStr.includes('significant')) return 'high';
    if (severityStr.includes('medium') || severityStr.includes('moderate')) return 'medium';
    return 'low';
  };

  const fetchSigmets = async () => {
    if (!showSigmets) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/aviation/sigmet-alerts');
      const data = await response.json();
      
      if (data.success) {
        // Filter for authentic SIGMET and G-AIRMET alerts only
        const sigmetAlerts = data.alerts.filter((alert: any) => 
          alert.alert_type === 'SIGMET' || alert.alert_type === 'G-AIRMET'
        );
        
        // Convert alerts to proper SIGMET format with boundary coordinates
        const convertedSigmets = sigmetAlerts.map((alert: any) => {
          // Extract coordinates from alert data if available
          const coordinates = extractCoordinatesFromAlert(alert);
          
          return {
            id: alert.id,
            type: alert.alert_type || 'SIGMET',
            title: `${alert.alert_type}: ${alert.description}`,
            description: alert.description,
            location: {
              lat: alert.coordinates?.lat || 40.0,
              lon: alert.coordinates?.lon || -100.0,
              radius: alert.radius || 50 // Default 50km radius
            },
            coordinates, // Boundary polygon coordinates
            altitude: {
              min: alert.altitude_range?.min || 0,
              max: alert.altitude_range?.max || 60000
            },
            timeframe: {
              start: alert.effective_start,
              end: alert.effective_end
            },
            severity: mapSeverityLevel(alert.severity),
            source: alert.source,
            lastUpdated: alert.scraped_at,
            weather_features: {
              phenomenon: alert.phenomenon || 'Unknown',
              movement: alert.movement ? {
                direction: alert.movement.direction || 0,
                speed: alert.movement.speed || 0
              } : undefined
            }
          };
        });
        
        setSigmets(convertedSigmets);
        console.log(`🌩️ SIGMET Display: Loaded ${convertedSigmets.length} authentic SIGMET alerts from Aviation Weather Center`);
        
        if (sigmetAlerts.length === 0) {
          console.log('🌩️ No active SIGMET alerts currently - this is normal when weather conditions are good');
        }
        
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