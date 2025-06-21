import { create } from 'zustand';

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
}

interface SelectedFlightState {
  selectedFlight: FlightPosition | null;
  isTrackingFlight: boolean;
  
  // Actions
  selectFlight: (flight: FlightPosition) => void;
  setSelectedFlight: (callsign: string) => void;
  clearSelection: () => void;
  setTrackingMode: (tracking: boolean) => void;
}

export const useSelectedFlight = create<SelectedFlightState>((set) => ({
  selectedFlight: null,
  isTrackingFlight: false,
  
  selectFlight: (flight) => {
    set({ 
      selectedFlight: flight,
      isTrackingFlight: true
    });
    console.log('Flight selected for tracking:', flight.callsign);
  },
  
  setSelectedFlight: (callsign) => {
    // Create a basic FlightPosition object from callsign
    const flightConfigs = {
      'VIR127C': { lat: 45.18, lon: -69.17, aircraft: 'A350-1000', origin: 'LHR', destination: 'JFK' },
      'VIR43': { lat: 40.2, lon: -45.8, aircraft: 'A330-300', origin: 'LGW', destination: 'MCO' },
      'VIR25F': { lat: 51.4, lon: -12.2, aircraft: '787-9', origin: 'LHR', destination: 'LAX' },
      'VIR155': { lat: 49.8, lon: -25.1, aircraft: 'A350-900', origin: 'MAN', destination: 'ATL' },
      'VIR9': { lat: 52.1, lon: -18.7, aircraft: '787-9', origin: 'LHR', destination: 'BOS' }
    };
    
    const config = flightConfigs[callsign as keyof typeof flightConfigs] || flightConfigs['VIR127C'];
    
    const flightData: FlightPosition = {
      callsign,
      latitude: config.lat,
      longitude: config.lon,
      altitude: 40000,
      velocity: 457,
      heading: 270,
      aircraft: config.aircraft,
      origin: config.origin,
      destination: config.destination,
      fuel: Math.floor(Math.random() * 10000) + 15000, // 15,000-25,000 kg
      engineStatus: 'normal',
      systemsStatus: 'normal'
    };
    
    set({ 
      selectedFlight: flightData,
      isTrackingFlight: true
    });
    console.log('Flight selected:', callsign);
  },
  
  clearSelection: () => {
    set({ 
      selectedFlight: null,
      isTrackingFlight: false
    });
  },
  
  setTrackingMode: (tracking) => {
    set({ isTrackingFlight: tracking });
  }
}));