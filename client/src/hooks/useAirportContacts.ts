import { useState, useEffect } from 'react';

interface AirportContact {
  icao: string;
  iata: string;
  airportName: string;
  country: string;
  lat: number;
  lon: number;
  serviceLevel: string;
  operationsCenter: string;
  phone: string;
}

export const useAirportContacts = () => {
  const [contacts, setContacts] = useState<AirportContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/service-coverage');
      
      if (!response.ok) throw new Error('Service coverage API failed');
      
      const data = await response.json();
      const contactList: AirportContact[] = data.map((item: any) => ({
        icao: item.icao || '',
        iata: item.iata || '',
        airportName: item.airport_name || '',
        country: item.country || '',
        lat: parseFloat(item.latitude) || 0,
        lon: parseFloat(item.longitude) || 0,
        serviceLevel: item.services || '',
        operationsCenter: item.operations_center || '',
        phone: item.phone || ''
      })).filter((contact: AirportContact) => contact.icao && contact.phone);
      
      setContacts(contactList);
      setError(null);
    } catch (err) {
      console.error('Failed to load airport contacts:', err);
      setError('Failed to load airport contacts');
      
      // Fallback contacts for Virgin Atlantic hubs
      const fallbackContacts: AirportContact[] = [
        {
          icao: 'EGLL', iata: 'LHR', airportName: 'London Heathrow', country: 'United Kingdom',
          lat: 51.4706, lon: -0.4619, serviceLevel: 'both', 
          operationsCenter: 'Heathrow Operations Centre', phone: '+44-20-8759-4321'
        },
        {
          icao: 'KJFK', iata: 'JFK', airportName: 'John F. Kennedy International', country: 'United States',
          lat: 40.6413, lon: -73.7781, serviceLevel: 'both',
          operationsCenter: 'JFK Airport Operations', phone: '+1-718-244-4444'
        },
        {
          icao: 'KLAX', iata: 'LAX', airportName: 'Los Angeles International', country: 'United States',
          lat: 33.9425, lon: -118.4081, serviceLevel: 'both',
          operationsCenter: 'LAX Operations Center', phone: '+1-310-646-5252'
        }
      ];
      setContacts(fallbackContacts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  return { contacts, loading, error, reload: loadContacts };
};
