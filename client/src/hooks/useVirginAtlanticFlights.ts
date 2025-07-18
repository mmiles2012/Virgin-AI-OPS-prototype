import { useState, useEffect } from 'react';

interface FlightData {
  flight_number: string;
  origin: string;
  destination: string;
  aircraft_type: string;
  status: string;
  warnings?: string[];
}

export const useVirginAtlanticFlights = () => {
  const [flights, setFlights] = useState<FlightData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlights = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/aviation/virgin-atlantic-flights');
      const data = await response.json();
      
      if (data.success && data.flights) {
        setFlights(data.flights);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch Virgin Atlantic flights:', err);
      setError('Failed to load flight data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlights();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchFlights, 30000);
    return () => clearInterval(interval);
  }, []);

  return { flights, loading, error, refetch: fetchFlights };
};
