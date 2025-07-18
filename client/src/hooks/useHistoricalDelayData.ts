import { useState, useEffect } from 'react';

interface FlightDelay {
  Airport: string;
  Flight: string;
  Scheduled: string;
  Estimated: string;
  Status: string;
  Gate?: string;
  Weather?: string;
  DelayMinutes?: number;
}

export const useHistoricalDelayData = () => {
  const [delayData, setDelayData] = useState<FlightDelay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDelayData = async () => {
    try {
      setLoading(true);
      
      // Try API first
      const apiResponse = await fetch('/api/aviation/historical-delays');
      if (apiResponse.ok) {
        const data = await apiResponse.json();
        setDelayData(data);
        setError(null);
        return;
      }
      
      // Fallback to CSV
      const csvResponse = await fetch('/airport_flight_data.csv');
      if (!csvResponse.ok) throw new Error('CSV not available');
      
      const csvText = await csvResponse.text();
      const lines = csvText.split('\n').slice(1);
      
      const delays: FlightDelay[] = lines
        .filter(line => line.trim())
        .map(line => {
          const cols = line.split(',');
          const scheduled = new Date(`2025-01-01 ${cols[3]?.trim()}`);
          const estimated = new Date(`2025-01-01 ${cols[4]?.trim()}`);
          const delayMinutes = isNaN(estimated.getTime()) || isNaN(scheduled.getTime()) 
            ? 0 
            : Math.max(0, Math.round((estimated.getTime() - scheduled.getTime()) / (1000 * 60)));
          
          return {
            Airport: cols[0]?.trim() || '',
            Flight: cols[2]?.trim() || '',
            Scheduled: cols[3]?.trim() || '',
            Estimated: cols[4]?.trim() || '',
            Status: cols[5]?.trim() || '',
            Gate: cols[6]?.trim() || '',
            Weather: cols[10]?.trim() || '',
            DelayMinutes: delayMinutes
          };
        })
        .filter(f => f.Flight && f.Airport);
      
      setDelayData(delays);
      setError(null);
    } catch (err) {
      console.error('Failed to load delay data:', err);
      setError('Failed to load historical delay data');
      
      // Fallback synthetic data
      const syntheticDelays: FlightDelay[] = [
        {
          Airport: 'LHR', Flight: 'VS001', Scheduled: '11:00', Estimated: '11:15', 
          Status: 'Delayed', DelayMinutes: 15, Weather: 'Clear'
        },
        {
          Airport: 'JFK', Flight: 'VS002', Scheduled: '15:30', Estimated: '15:30',
          Status: 'On Time', DelayMinutes: 0, Weather: 'Partly Cloudy'
        },
        {
          Airport: 'LAX', Flight: 'VS008', Scheduled: '14:20', Estimated: '14:45',
          Status: 'Delayed', DelayMinutes: 25, Weather: 'Fog'
        }
      ];
      setDelayData(syntheticDelays);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDelayData();
  }, []);

  return { delayData, loading, error, reload: loadDelayData };
};
