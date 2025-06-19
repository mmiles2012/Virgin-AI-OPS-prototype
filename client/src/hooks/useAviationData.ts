import { useState, useEffect } from 'react';
import axios from 'axios';

interface FuelEstimate {
  aircraftType: string;
  distanceNm: number;
  passengers: number;
  fuelBurnGallons: number;
  fuelBurnLiters: number;
  fuelBurnKg: number;
  estimatedCost: number;
  note: string;
}

interface OperatingCostAnalysis {
  aircraftType: string;
  flightTimeHours: number;
  totalOperatingCost: number;
  fuelCost: number;
  nonFuelOperatingCost: number;
  costPerSeat: number;
  costPerSeatHour: number;
  passengers: number;
  breakdown: {
    hourlyOperatingCost: number;
    costPerSeatHour: number;
    fuelCostPerHour: number;
    totalSeats: number;
  };
}

interface AirportData {
  iata: string;
  icao: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: string;
  runways?: RunwayData[];
  weather?: WeatherData;
  capacity?: AirportCapacity;
}

interface RunwayData {
  id: string;
  length: number;
  width: number;
  surface: string;
  orientation: string;
  status: 'active' | 'closed' | 'maintenance';
}

interface WeatherData {
  visibility: number;
  windSpeed: number;
  windDirection: number;
  temperature: number;
  pressure: number;
  humidity: number;
  conditions: string;
}

interface AirportCapacity {
  runwayCapacity: number;
  gateCapacity: number;
  currentUtilization: number;
  delays: {
    departure: number;
    arrival: number;
  };
}

interface OperationsSummary {
  timestamp: string;
  airportCode: string;
  airportInfo: AirportData;
  flightData: any[];
  fuelEstimates: FuelEstimate[];
  alerts: any[];
}

export function useAviationData() {
  const [fuelEstimate, setFuelEstimate] = useState<FuelEstimate | null>(null);
  const [operatingCosts, setOperatingCosts] = useState<OperatingCostAnalysis | null>(null);
  const [airportData, setAirportData] = useState<AirportData | null>(null);
  const [operationsSummary, setOperationsSummary] = useState<OperationsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFuelEstimate = async (aircraftType: string, distance: number, passengers?: number) => {
    try {
      setLoading(true);
      const response = await axios.get('/api/aviation/fuel-estimate', {
        params: { aircraftType, distance, passengers }
      });
      setFuelEstimate(response.data);
      setError(null);
    } catch (err) {
      console.error('Fuel estimate fetch error:', err);
      setError('Failed to fetch fuel estimate');
    } finally {
      setLoading(false);
    }
  };

  const fetchAirportData = async (iataCode: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/aviation/airport-data/${iataCode}`);
      setAirportData(response.data);
      setError(null);
    } catch (err) {
      console.error('Airport data fetch error:', err);
      setError('Failed to fetch airport data');
    } finally {
      setLoading(false);
    }
  };

  const fetchOperatingCosts = async (aircraftType: string, distance: number, passengers?: number) => {
    try {
      setLoading(true);
      const response = await axios.get('/api/aviation/operating-costs', {
        params: { aircraftType, distance, passengers }
      });
      setOperatingCosts(response.data);
      setError(null);
    } catch (err) {
      console.error('Operating costs fetch error:', err);
      setError('Failed to fetch operating costs');
    } finally {
      setLoading(false);
    }
  };

  const fetchOperationsSummary = async (iataCode: string, flightNumber?: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/aviation/operations-summary/${iataCode}`, {
        params: flightNumber ? { flightNumber } : {}
      });
      setOperationsSummary(response.data);
      setError(null);
    } catch (err) {
      console.error('Operations summary fetch error:', err);
      setError('Failed to fetch operations summary');
    } finally {
      setLoading(false);
    }
  };

  return {
    fuelEstimate,
    operatingCosts,
    airportData,
    operationsSummary,
    loading,
    error,
    fetchFuelEstimate,
    fetchOperatingCosts,
    fetchAirportData,
    fetchOperationsSummary
  };
}

export function useEnhancedFlightData(flightCallsign?: string) {
  const [enhancedData, setEnhancedData] = useState<{
    fuelAnalysis: FuelEstimate | null;
    destinationAirport: AirportData | null;
    diversionAirports: AirportData[];
    weatherData: WeatherData | null;
  }>({
    fuelAnalysis: null,
    destinationAirport: null,
    diversionAirports: [],
    weatherData: null
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!flightCallsign) return;

    const fetchEnhancedData = async () => {
      setLoading(true);
      try {
        // Get flight configuration based on callsign
        const flightConfigs = {
          'VIR127C': { aircraft: 'A350-1000', route: 'LHR-JFK', passengers: 298, distance: 3459, destination: 'JFK' },
          'VIR43': { aircraft: 'A330-300', route: 'LGW-MCO', passengers: 285, distance: 4277, destination: 'MCO' },
          'VIR25F': { aircraft: '787-9', route: 'LHR-LAX', passengers: 258, distance: 5440, destination: 'LAX' },
          'VIR155': { aircraft: 'A350-900', route: 'MAN-ATL', passengers: 315, distance: 4134, destination: 'ATL' },
          'VIR9': { aircraft: '787-9', route: 'LHR-BOS', passengers: 214, distance: 3260, destination: 'BOS' }
        };

        const config = flightConfigs[flightCallsign as keyof typeof flightConfigs];
        
        if (config) {
          // Fetch fuel analysis
          const fuelResponse = await axios.get('/api/aviation/fuel-estimate', {
            params: {
              aircraftType: config.aircraft,
              distance: config.distance,
              passengers: config.passengers
            }
          });

          // Fetch destination airport data
          const destinationResponse = await axios.get(`/api/aviation/airport-data/${config.destination}`);

          // Fetch common diversion airports for the route
          const diversionAirports = [];
          const diversionCodes = ['CYQX', 'CYHZ', 'CYYT']; // Common North Atlantic diversions

          for (const code of diversionCodes) {
            try {
              const response = await axios.get(`/api/aviation/airport-data/${code}`);
              diversionAirports.push(response.data);
            } catch (err) {
              console.warn(`Failed to fetch data for ${code}`);
            }
          }

          setEnhancedData({
            fuelAnalysis: fuelResponse.data,
            destinationAirport: destinationResponse.data,
            diversionAirports,
            weatherData: destinationResponse.data.weather || null
          });
        }

        setError(null);
      } catch (err) {
        console.error('Enhanced flight data fetch error:', err);
        setError('Failed to fetch enhanced flight data');
      } finally {
        setLoading(false);
      }
    };

    fetchEnhancedData();
  }, [flightCallsign]);

  return { enhancedData, loading, error };
}