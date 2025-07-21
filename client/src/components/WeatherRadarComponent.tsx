import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Cloud, RefreshCw, Expand } from 'lucide-react';

interface WeatherRadarComponentProps {
  className?: string;
}

export default function WeatherRadarComponent({ className }: WeatherRadarComponentProps) {
  const [radarImage, setRadarImage] = useState<string | null>(null);
  const [radarLoading, setRadarLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [selectedSource, setSelectedSource] = useState<'noaa' | 'rainviewer'>('noaa');

  // Fetch weather radar data from backend
  const fetchWeatherRadar = async (source: 'noaa' | 'rainviewer' = 'noaa') => {
    console.log('Fetching weather radar from:', source);
    setRadarLoading(true);
    try {
      const response = await fetch(`/api/weather/radar?source=${source}`);
      const data = await response.json();
      
      console.log('Weather radar response:', data);
      
      if (data.success && data.imageUrl) {
        console.log('Setting radar image, length:', data.imageUrl.length);
        setRadarImage(data.imageUrl);
        setLastUpdated(new Date());
      } else {
        console.error('Failed to fetch radar data:', data.error || 'No imageUrl');
        // Set a fallback state
        setRadarImage(null);
      }
    } catch (error) {
      console.error('Error fetching weather radar:', error);
      setRadarImage(null);
    } finally {
      setRadarLoading(false);
    }
  };

  // Initialize radar on component mount
  useEffect(() => {
    fetchWeatherRadar(selectedSource);
    
    // Set up auto-refresh every 15 minutes for radar
    const radarInterval = setInterval(() => fetchWeatherRadar(selectedSource), 15 * 60 * 1000);
    
    return () => {
      clearInterval(radarInterval);
    };
  }, [selectedSource]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Weather Radar Display */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Cloud className="w-4 h-4" />
              Live Weather Radar
            </h3>
            <div className="flex items-center gap-2">
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value as 'noaa' | 'rainviewer')}
                className="bg-white text-gray-900 text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value="noaa">NOAA</option>
                <option value="rainviewer">RainViewer</option>
              </select>
              <Button
                onClick={() => fetchWeatherRadar(selectedSource)}
                disabled={radarLoading}
                size="sm"
                className="bg-va-red-primary hover:bg-va-red-heritage text-foreground"
              >
                <RefreshCw className={`w-3 h-3 ${radarLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          
          {/* Radar Display with Enlargeable Modal */}
          <Dialog>
            <DialogTrigger asChild>
              <div className="h-48 bg-gray-200 rounded-lg flex items-center justify-center relative overflow-hidden cursor-pointer hover:bg-gray-300/50 transition-colors group">
                {radarLoading ? (
                  <div className="flex items-center gap-2 text-slate-300">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Loading radar...
                  </div>
                ) : radarImage ? (
                  <>
                    <img 
                      src={radarImage} 
                      alt="Weather Radar" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <div className="absolute top-2 right-2 bg-card/50 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Expand className="w-4 h-4 text-foreground" />
                    </div>
                    <div className="absolute bottom-2 left-2 bg-card/50 rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-foreground text-xs">Click to enlarge</span>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 via-green-500/30 to-yellow-500/30 flex items-center justify-center">
                    <span className="text-slate-300 text-sm">Click refresh to load radar</span>
                  </div>
                )}
              </div>
            </DialogTrigger>
            
            <DialogContent className="max-w-4xl w-full h-[80vh] bg-white border-gray-200">
              <DialogHeader>
                <DialogTitle className="text-gray-900 flex items-center gap-2">
                  <Cloud className="w-5 h-5" />
                  Weather Radar - {selectedSource.toUpperCase()}
                </DialogTitle>
              </DialogHeader>
              
              <div className="flex-1 bg-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden">
                {radarLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    Loading radar...
                  </div>
                ) : radarImage ? (
                  <img 
                    src={radarImage} 
                    alt="Weather Radar - Enlarged" 
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="flex items-center justify-center text-slate-300">
                    <span>No radar data available</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-slate-400">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedSource}
                    onChange={(e) => setSelectedSource(e.target.value as 'noaa' | 'rainviewer')}
                    className="bg-white text-gray-900 text-sm border border-gray-300 rounded px-3 py-1"
                  >
                    <option value="noaa">NOAA</option>
                    <option value="rainviewer">RainViewer</option>
                  </select>
                  <Button
                    onClick={() => fetchWeatherRadar(selectedSource)}
                    disabled={radarLoading}
                    className="bg-aero-blue-primary hover:bg-aero-blue-light"
                  >
                    <RefreshCw className={`w-4 h-4 ${radarLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          {/* Last Updated */}
          <div className="text-xs text-muted-foreground mt-2 text-center">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        </CardContent>
      </Card>


    </div>
  );
}