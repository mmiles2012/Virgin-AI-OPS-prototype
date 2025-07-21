/**
 * NAT Tracks Overlay Component for AINO Aviation Intelligence Platform
 * Displays North Atlantic Tracks on the Professional Satellite Map
 */

import React, { useEffect, useState } from 'react';
import { Polyline, Popup } from 'react-leaflet';
import { LatLng } from 'leaflet';

interface NATTrack {
  track_id: string;
  direction: 'Eastbound' | 'Westbound';
  color: string;
  timestamp: string;
  waypoint_count: number;
  coordinates: number[][];
}

interface NATTracksResponse {
  success: boolean;
  tracks: NATTrack[];
  total_tracks: number;
  generated_at: string;
  cache_status?: 'fresh' | 'cached';
  error?: string;
}

interface NATTracksOverlayProps {
  showNATTracks: boolean;
}

const NATTracksOverlay: React.FC<NATTracksOverlayProps> = ({ showNATTracks }) => {
  const [natTracks, setNatTracks] = useState<NATTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const fetchNATTracks = async (forceRefresh = false) => {
    if (!showNATTracks) return;
    
    try {
      setLoading(true);
      const url = forceRefresh ? '/api/nat-tracks?refresh=true' : '/api/nat-tracks';
      
      const response = await fetch(url);
      const data: NATTracksResponse = await response.json();
      
      if (data.success && data.tracks) {
        setNatTracks(data.tracks);
        setLastUpdate(data.generated_at);
        console.log(`🛩️ NAT Tracks loaded: ${data.total_tracks} tracks (${data.cache_status})`);
      } else {
        console.error('❌ Failed to load NAT tracks:', data.error);
        setNatTracks([]);
      }
    } catch (error) {
      console.error('❌ Error fetching NAT tracks:', error);
      setNatTracks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showNATTracks) {
      fetchNATTracks();
      
      // Auto-refresh every 30 minutes (NAT tracks change every 12-24 hours typically)
      const interval = setInterval(() => fetchNATTracks(true), 30 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [showNATTracks]);

  if (!showNATTracks || natTracks.length === 0) {
    return null;
  }

  return (
    <>
      {natTracks.map((track) => {
        // Convert coordinates to Leaflet LatLng format
        const positions: LatLng[] = track.coordinates.map(
          ([lng, lat]) => new LatLng(lat, lng)
        );

        return (
          <Polyline
            key={`nat-track-${track.track_id}`}
            positions={positions}
            pathOptions={{
              color: track.color,
              weight: 3,
              opacity: 0.8,
              dashArray: track.direction === 'Eastbound' ? '10,5' : '5,10',
            }}
          >
            <Popup>
              <div className="bg-card text-foreground p-3 rounded-lg border border-border min-w-[200px]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-blue-300">
                    NAT Track {track.track_id}
                  </h3>
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: track.color }}
                  />
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Direction:</span>
                    <span className="font-medium text-foreground">{track.direction}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Waypoints:</span>
                    <span className="font-medium text-foreground">{track.waypoint_count}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-medium text-aero-green-safe">Active</span>
                  </div>
                  
                  <div className="mt-2 pt-2 border-t border-border">
                    <div className="text-xs text-muted-foreground">
                      Source: FAA NOTAM (Shanwick/Gander)
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Updated: {new Date(track.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            </Popup>
          </Polyline>
        );
      })}
      
      {/* NAT Tracks Status Indicator - Disabled to prevent black overlay issue */}
      {false && showNATTracks && (
        <div className="absolute top-20 left-4 bg-card/90 text-foreground p-2 rounded-lg border border-border z-[1000] text-xs">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-3 h-1 bg-orange-500 rounded"></div>
              <div className="w-3 h-1 bg-purple-500 rounded"></div>
            </div>
            <span>NAT Tracks: {natTracks.length} active</span>
            {loading && <span className="text-aero-blue-primary">⟳</span>}
          </div>
          {lastUpdate && (
            <div className="text-muted-foreground mt-1">
              Last: {new Date(lastUpdate).toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default NATTracksOverlay;