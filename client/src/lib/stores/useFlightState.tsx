import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface FlightState {
  // Position and orientation
  position: [number, number, number];
  rotation: [number, number, number]; // pitch, yaw, roll
  velocity: number;
  
  // Flight parameters
  altitude: number;
  airspeed: number;
  heading: number;
  throttle: number;
  fuelRemaining: number;
  
  // Engine data
  engineTemps: [number, number];
  
  // Flight modes
  isAutopilot: boolean;
  
  // Actions
  updatePosition: (position: [number, number, number]) => void;
  updateRotation: (rotation: [number, number, number]) => void;
  updateVelocity: (velocity: number) => void;
  updateThrottle: (throttle: number) => void;
  toggleAutopilot: () => void;
  setAltitude: (altitude: number) => void;
  setAirspeed: (airspeed: number) => void;
  setHeading: (heading: number) => void;
  updateFuel: (consumption: number) => void;
}

export const useFlightState = create<FlightState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    position: [0, 35000, 0], // x, altitude, z
    rotation: [0, 0, 0],
    velocity: 0,
    
    altitude: 35000,
    airspeed: 485, // Typical cruising speed for 787
    heading: 90, // East
    throttle: 75,
    fuelRemaining: 180000, // pounds
    
    engineTemps: [750, 755], // Celsius
    
    isAutopilot: true,
    
    // Actions
    updatePosition: (position) => set({ position }),
    
    updateRotation: (rotation) => {
      set({ rotation });
      // Update heading from yaw
      const heading = ((rotation[1] * 180 / Math.PI) + 360) % 360;
      set({ heading });
    },
    
    updateVelocity: (velocity) => {
      set({ velocity });
      // Convert velocity to airspeed (simplified)
      const airspeed = Math.max(0, velocity * 16); // Scale factor
      set({ airspeed });
    },
    
    updateThrottle: (throttle) => {
      set({ throttle });
      // Update engine temperatures based on throttle
      const baseTemp = 650;
      const tempVariation = throttle * 2;
      set({
        engineTemps: [
          baseTemp + tempVariation + Math.random() * 10,
          baseTemp + tempVariation + Math.random() * 10
        ]
      });
    },
    
    toggleAutopilot: () => {
      set((state) => ({ isAutopilot: !state.isAutopilot }));
    },
    
    setAltitude: (altitude) => {
      set({ altitude });
      // Update position y-coordinate
      const currentPos = get().position;
      set({ position: [currentPos[0], altitude, currentPos[2]] });
    },
    
    setAirspeed: (airspeed) => set({ airspeed }),
    
    setHeading: (heading) => {
      set({ heading });
      // Update rotation yaw
      const currentRot = get().rotation;
      set({ rotation: [currentRot[0], heading * Math.PI / 180, currentRot[2]] });
    },
    
    updateFuel: (consumption) => {
      set((state) => ({
        fuelRemaining: Math.max(0, state.fuelRemaining - consumption)
      }));
    }
  }))
);

// Auto-update fuel consumption based on throttle
setInterval(() => {
  const state = useFlightState.getState();
  const consumption = (state.throttle / 100) * 0.5; // Fuel consumption rate
  state.updateFuel(consumption);
}, 1000);
