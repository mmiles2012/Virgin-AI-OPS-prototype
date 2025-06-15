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
    const flightData: FlightPosition = {
      callsign,
      latitude: callsign === 'VIR127C' ? 45.18 : 51.4,
      longitude: callsign === 'VIR127C' ? -69.17 : -12.2,
      altitude: 40000,
      velocity: 457,
      heading: 270,
      aircraft: callsign === 'VIR127C' ? 'A350-1000' : 'A380-800',
      origin: callsign === 'VIR127C' ? 'LHR' : 'LHR',
      destination: callsign === 'VIR127C' ? 'JFK' : 'LAX'
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