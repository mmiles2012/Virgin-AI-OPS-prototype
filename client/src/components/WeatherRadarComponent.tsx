import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Cloud, Wind, Thermometer, Gauge, RefreshCw } from 'lucide-react';

interface WeatherData {
  visibility: string;
  wind: string;
  temperature: string;
  pressure: string;
  humidity: string;
  conditions: string;
}

interface WeatherRadarComponentProps {
  className?: string;
}

export default function WeatherRadarComponent({ className }: WeatherRadarComponentProps) {
  const [weatherData, setWeatherData] = useState<WeatherData>({
    visibility: '10+ km',
    wind: '12 kt',
    temperature: '18°C',
    pressure: '1013 hPa',
    humidity: '65%',
    conditions: 'Clear'
  });
  
  const [radarImage, setRadarImage] = useState<string | null>(null);
  const [radarLoading, setRadarLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [selectedSource, setSelectedSource] = useState<'noaa' | 'rainviewer'>('noaa');

  // Fetch weather radar data from backend
  const fetchWeatherRadar = async (source: 'noaa' | 'rainviewer' = 'noaa') => {
    setRadarLoading(true);
    try {
      const response = await fetch(`/api/weather/radar?source=${source}`);
      const data = await response.json();
      
      if (data.success && data.imageUrl) {
        setRadarImage(data.imageUrl);
        setLastUpdated(new Date());
      } else {
        console.error('Failed to fetch radar data:', data.error);
      }
    } catch (error) {
      console.error('Error fetching weather radar:', error);
    } finally {
      setRadarLoading(false);
    }
  };

  // Fetch real-time weather data from AVWX API
  const fetchWeatherData = async () => {
    try {
      const response = await fetch('/api/weather/aviation/EGLL'); // Heathrow as default
      const data = await response.json();
      
      if (data.success && data.data?.metar) {
        const metar = data.data.metar;
        setWeatherData({
          visibility: metar.visibility ? `${metar.visibility.repr} km` : '10+ km',
          wind: metar.wind ? `${metar.wind.speed || 0} kt` : '12 kt',
          temperature: metar.temperature ? `${metar.temperature.repr}°C` : '18°C',
          pressure: metar.altimeter ? `${metar.altimeter.repr} hPa` : '1013 hPa',
          humidity: metar.humidity ? `${metar.humidity}%` : '65%',
          conditions: metar.flight_rules || 'Clear'
        });
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
    }
  };

  // Initialize weather data and radar on component mount
  useEffect(() => {
    fetchWeatherData();
    fetchWeatherRadar(selectedSource);
    
    // Set up auto-refresh every 5 minutes for weather data
    const weatherInterval = setInterval(fetchWeatherData, 5 * 60 * 1000);
    
    // Set up auto-refresh every 15 minutes for radar
    const radarInterval = setInterval(() => fetchWeatherRadar(selectedSource), 15 * 60 * 1000);
    
    return () => {
      clearInterval(weatherInterval);
      clearInterval(radarInterval);
    };
  }, [selectedSource]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Weather Radar Display */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Cloud className="w-4 h-4" />
              Live Weather Radar
            </h3>
            <div className="flex items-center gap-2">
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value as 'noaa' | 'rainviewer')}
                className="bg-slate-700 text-white text-xs border border-slate-600 rounded px-2 py-1"
              >
                <option value="noaa">NOAA</option>
                <option value="rainviewer">RainViewer</option>
              </select>
              <Button
                onClick={() => fetchWeatherRadar(selectedSource)}
                disabled={radarLoading}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className={`w-3 h-3 ${radarLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          
          {/* Radar Display */}
          <div className="h-48 bg-slate-700 rounded-lg flex items-center justify-center relative overflow-hidden">
            {radarLoading ? (
              <div className="flex items-center gap-2 text-slate-300">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Loading radar...
              </div>
            ) : radarImage ? (
              <img 
                src={radarImage} 
                alt="Weather Radar" 
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 via-green-500/30 to-yellow-500/30 flex items-center justify-center">
                <span className="text-slate-300 text-sm">Click refresh to load radar</span>
              </div>
            )}
          </div>
          
          {/* Last Updated */}
          <div className="text-xs text-slate-400 mt-2 text-center">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        </CardContent>
      </Card>

      {/* Weather Conditions Grid */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Wind className="w-3 h-3 text-blue-400" />
              <span className="text-slate-400 text-xs">Visibility</span>
            </div>
            <div className="text-white font-bold text-sm">{weatherData.visibility}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Wind className="w-3 h-3 text-green-400" />
              <span className="text-slate-400 text-xs">Wind</span>
            </div>
            <div className="text-white font-bold text-sm">{weatherData.wind}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Thermometer className="w-3 h-3 text-orange-400" />
              <span className="text-slate-400 text-xs">Temperature</span>
            </div>
            <div className="text-white font-bold text-sm">{weatherData.temperature}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Gauge className="w-3 h-3 text-purple-400" />
              <span className="text-slate-400 text-xs">Pressure</span>
            </div>
            <div className="text-white font-bold text-sm">{weatherData.pressure}</div>
          </CardContent>
        </Card>
      </div>

      {/* Weather Conditions Summary */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                weatherData.conditions === 'Clear' ? 'bg-green-500' : 
                weatherData.conditions === 'Marginal' ? 'bg-yellow-500' : 
                'bg-red-500'
              }`} />
              <span className="text-slate-400 text-xs">Conditions</span>
            </div>
            <div className="text-white font-bold text-sm">{weatherData.conditions}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}