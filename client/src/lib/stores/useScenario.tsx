import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { airports } from '../airportData';
import { TrainingScenario } from '../medicalProtocols';

interface Airport {
  icao: string;
  name: string;
  lat: number;
  lon: number;
  medicalFacilities: boolean;
  distance: number;
}

interface CostAnalysis {
  fuelCost: number;
  timeCost: number;
  passengerCost: number;
  totalCost: number;
}

interface ScenarioState {
  // Current scenario
  currentScenario: TrainingScenario | null;
  isActive: boolean;
  scenarioProgress: number;
  
  // Emergency state
  medicalEmergency: boolean;
  emergencyType: string;
  emergencyStartTime: Date | null;
  
  // Decision tracking
  decisionsMade: number;
  score: number;
  nearestAirports: Airport[];
  selectedDiversion: string | null;
  
  // Cost analysis
  costAnalysis: CostAnalysis | null;
  
  // Actions
  startScenario: (scenario: TrainingScenario) => void;
  stopScenario: () => void;
  resetScenario: () => void;
  updateProgress: (progress: number) => void;
  activateMedicalEmergency: (type: string) => void;
  handleDiversionDecision: (airportCode: string, source: 'crew' | 'operations') => void;
  updateNearestAirports: (aircraftPosition: [number, number, number]) => void;
  calculateCosts: (airportCode: string) => CostAnalysis;
}

export const useScenario = create<ScenarioState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    currentScenario: null,
    isActive: false,
    scenarioProgress: 0,
    
    medicalEmergency: false,
    emergencyType: '',
    emergencyStartTime: null,
    
    decisionsMade: 0,
    score: 85,
    nearestAirports: [],
    selectedDiversion: null,
    
    costAnalysis: null,
    
    // Actions
    startScenario: (scenario) => {
      set({
        currentScenario: scenario,
        isActive: true,
        scenarioProgress: 0,
        decisionsMade: 0,
        score: 100,
        selectedDiversion: null
      });
      
      // Activate emergency based on scenario
      if (scenario.type === 'medical') {
        get().activateMedicalEmergency(scenario.emergencyDetails?.type || 'cardiac');
      }
      
      console.log(`Scenario started: ${scenario.title}`);
    },
    
    stopScenario: () => {
      set({
        isActive: false,
        medicalEmergency: false,
        emergencyType: '',
        emergencyStartTime: null,
        selectedDiversion: null
      });
      console.log('Scenario stopped');
    },
    
    resetScenario: () => {
      set({
        currentScenario: null,
        isActive: false,
        scenarioProgress: 0,
        medicalEmergency: false,
        emergencyType: '',
        emergencyStartTime: null,
        decisionsMade: 0,
        score: 100,
        nearestAirports: [],
        selectedDiversion: null,
        costAnalysis: null
      });
      console.log('Scenario reset');
    },
    
    updateProgress: (progress) => {
      set({ scenarioProgress: Math.min(100, Math.max(0, progress)) });
    },
    
    activateMedicalEmergency: (type) => {
      set({
        medicalEmergency: true,
        emergencyType: type,
        emergencyStartTime: new Date()
      });
      
      // Update nearest airports with current position
      get().updateNearestAirports([0, 35000, 0]); // Default position
      
      console.log(`Medical emergency activated: ${type}`);
    },
    
    handleDiversionDecision: (airportCode, source) => {
      const state = get();
      
      set({
        selectedDiversion: airportCode,
        decisionsMade: state.decisionsMade + 1,
        scenarioProgress: Math.min(100, state.scenarioProgress + 25)
      });
      
      // Calculate decision quality score
      const airport = state.nearestAirports.find(a => a.icao === airportCode);
      if (airport) {
        let scoreModifier = 0;
        
        // Score based on decision factors
        if (airport.medicalFacilities) scoreModifier += 10;
        if (airport.distance < 100) scoreModifier += 5;
        if (source === 'crew' && state.emergencyStartTime) {
          const responseTime = Date.now() - state.emergencyStartTime.getTime();
          if (responseTime < 30000) scoreModifier += 5; // Quick response
        }
        
        set({ score: Math.min(100, state.score + scoreModifier) });
        
        // Calculate costs
        const costs = get().calculateCosts(airportCode);
        set({ costAnalysis: costs });
      }
      
      console.log(`Diversion decision made by ${source}: ${airportCode}`);
    },
    
    updateNearestAirports: (aircraftPosition) => {
      // Calculate distances to airports (simplified)
      const airportsWithDistance = airports.map(airport => ({
        ...airport,
        distance: Math.sqrt(
          Math.pow(aircraftPosition[0] - airport.lat * 10, 2) + 
          Math.pow(aircraftPosition[2] - airport.lon * 10, 2)
        )
      }));
      
      // Sort by distance and take nearest 8
      const nearest = airportsWithDistance
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 8);
      
      set({ nearestAirports: nearest });
    },
    
    calculateCosts: (airportCode) => {
      const airport = get().nearestAirports.find(a => a.icao === airportCode);
      if (!airport) {
        return { fuelCost: 0, timeCost: 0, passengerCost: 0, totalCost: 0 };
      }
      
      const fuelCost = airport.distance * 2.5 * 5.5; // Distance * fuel burn * fuel price
      const timeCost = (airport.distance / 485) * 1500; // Flight time * hourly cost
      const passengerCost = get().medicalEmergency ? 50000 : 25000; // Medical vs other
      const totalCost = fuelCost + timeCost + passengerCost;
      
      return { fuelCost, timeCost, passengerCost, totalCost };
    }
  }))
);

// Auto-update progress during active scenarios
setInterval(() => {
  const state = useScenario.getState();
  if (state.isActive && state.scenarioProgress < 100) {
    state.updateProgress(state.scenarioProgress + 1);
  }
}, 2000);
