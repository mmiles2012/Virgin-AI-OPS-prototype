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