import { create } from 'zustand';
import { calculateFuelPercentage } from '../utils/fuelCalculation';

interface FlightPosition {
  callsign: string;
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  heading: number;
  aircraft: string;
  origin?: string;
  destination?: string;
  fuel: number;
  engineStatus: string;
  systemsStatus: string;
  // Additional authentic flight data properties
  flight_number?: string;
  aircraft_type?: string;
  route?: string;
  departure_airport?: string;
  arrival_airport?: string;
  registration?: string;
  icao24?: string;
  authentic_tracking?: boolean;
  data_source?: string;
  status?: string;
  squawk?: string;
  velocity_estimated?: boolean;
  last_contact?: number;
}

interface SelectedFlightState {
  selectedFlight: FlightPosition | null;
  isTrackingFlight: boolean;
  selectedFlightRegistration: string | null;
  selectedFlightCallsign: string | null;
  
  // Actions
  selectFlight: (flight: FlightPosition) => void;
  selectFlightByCallsign: (callsign: string) => void;
  selectFlightByRegistration: (registration: string) => void;
  clearSelection: () => void;
  setTrackingMode: (tracking: boolean) => void;
  // Enhanced selection with authentic data fetching
  selectFlightWithData: (flightData: any) => void;
}

export const useSelectedFlight = create<SelectedFlightState>((set, get) => ({
  selectedFlight: null,
  isTrackingFlight: false,
  selectedFlightRegistration: null,
  selectedFlightCallsign: null,
  
  selectFlight: (flight) => {
    const enhancedFlight: FlightPosition = {
      callsign: flight.callsign,
      latitude: flight.latitude,
      longitude: flight.longitude,
      altitude: flight.altitude || 40000,
      velocity: flight.velocity || 450,
      heading: flight.heading || 270,
      aircraft: flight.aircraft || flight.aircraft_type || 'UNKNOWN',
      origin: flight.origin || flight.departure_airport,
      destination: flight.destination || flight.arrival_airport,
      fuel: flight.fuel_remaining || calculateFuelPercentage(
        flight.aircraft_type || flight.aircraft || 'UNKNOWN', 
        flight.flight_progress || 50, 
        flight.route
      ),
      engineStatus: flight.engineStatus || 'normal',
      systemsStatus: flight.systemsStatus || 'normal',
      // Include authentic data
      flight_number: flight.flight_number || flight.callsign,
      aircraft_type: flight.aircraft_type || flight.aircraft,
      route: flight.route,
      departure_airport: flight.departure_airport,
      arrival_airport: flight.arrival_airport,
      registration: flight.registration,
      icao24: flight.icao24,
      authentic_tracking: flight.authentic_tracking,
      data_source: flight.data_source,
      status: flight.status,
      squawk: flight.squawk,
      velocity_estimated: flight.velocity_estimated,
      last_contact: flight.last_contact
    };
    
    set({ 
      selectedFlight: enhancedFlight,
      isTrackingFlight: true,
      selectedFlightRegistration: flight.registration || null,
      selectedFlightCallsign: flight.callsign || flight.flight_number || null
    });
    console.log('🎯 Flight selected for cross-dashboard tracking:', flight.callsign || flight.flight_number);
  },
  
  selectFlightByCallsign: async (callsign) => {
    try {
      // Fetch authentic flight data by callsign
      const response = await fetch('/api/aviation/virgin-atlantic-flights');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.flights) {
          const flight = data.flights.find((f: any) => 
            f.callsign === callsign || f.flight_number === callsign
          );
          if (flight) {
            get().selectFlightWithData(flight);
          } else {
            console.warn('Flight not found:', callsign);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch flight data:', error);
    }
  },
  
  selectFlightByRegistration: async (registration) => {
    try {
      // Fetch authentic flight data by registration
      const response = await fetch('/api/aviation/virgin-atlantic-flights');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.flights) {
          const flight = data.flights.find((f: any) => 
            f.registration === registration
          );
          if (flight) {
            get().selectFlightWithData(flight);
          } else {
            console.warn('Flight not found with registration:', registration);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch flight data:', error);
    }
  },
  
  selectFlightWithData: (flightData) => {
    get().selectFlight(flightData);
  },
  
  clearSelection: () => {
    set({ 
      selectedFlight: null,
      isTrackingFlight: false,
      selectedFlightRegistration: null,
      selectedFlightCallsign: null
    });
    console.log('🎯 Flight selection cleared across all dashboards');
  },
  
  setTrackingMode: (tracking) => {
    set({ isTrackingFlight: tracking });
  }
}));