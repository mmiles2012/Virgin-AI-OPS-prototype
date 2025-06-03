// Shared type definitions for the Boeing 787 Digital Twin application

// Flight simulation types
export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface Rotation3D {
  pitch: number;
  yaw: number;
  roll: number;
}

export interface GeographicPosition {
  latitude: number;
  longitude: number;
  altitude: number;
}

export interface FlightParameters {
  airspeed: number; // knots
  groundSpeed: number; // knots
  heading: number; // degrees (0-360)
  verticalSpeed: number; // feet per minute
  altitude: number; // feet
}

export interface EngineData {
  id: number;
  thrust: number; // percentage (0-100)
  temperature: number; // Celsius
  fuelFlow: number; // kg/hour
  n1: number; // percentage
  n2: number; // percentage
  egt: number; // Celsius - Exhaust Gas Temperature
}

export interface SystemStatus {
  hydraulics: 'normal' | 'caution' | 'warning';
  electrical: 'normal' | 'caution' | 'warning';
  pressurization: 'normal' | 'caution' | 'warning';
  fuel: 'normal' | 'caution' | 'warning';
  engines: 'normal' | 'caution' | 'warning';
}

// Emergency and scenario types
export interface EmergencyStatus {
  declared: boolean;
  type: EmergencyType | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  startTime: Date | null;
  description?: string;
  requiredActions: string[];
}

export type EmergencyType = 
  | 'medical'
  | 'engine'
  | 'fire'
  | 'pressurization'
  | 'hydraulic'
  | 'fuel'
  | 'weather'
  | 'security'
  | 'electrical';

export interface MedicalEmergencyDetails {
  passengerDetails: {
    age?: number;
    gender?: string;
    medicalHistory?: string[];
  };
  symptoms: string[];
  severity: 'stable' | 'deteriorating' | 'critical';
  treatmentProvided: string[];
  oxygenRequired: boolean;
  aedUsed: boolean;
  medicationAdministered: string[];
  timeToHospital: number; // minutes
}

// Airport and navigation types
export interface AirportInfo {
  icao: string;
  iata: string;
  name: string;
  city: string;
  country: string;
  coordinates: GeographicPosition;
  runwayInfo: {
    length: number; // meters
    width: number; // meters
    surface: string;
    lighting: boolean;
    ils: boolean;
  };
  facilities: {
    medical: boolean;
    customs: boolean;
    fuel: boolean;
    maintenance: boolean;
    catering: boolean;
  };
  operatingHours: '24/7' | 'daylight' | 'restricted';
  emergencyServices: {
    fireRescue: boolean;
    medical: boolean;
    security: boolean;
  };
  weatherServices: boolean;
}

export interface NavigationWaypoint {
  id: string;
  name: string;
  type: 'fix' | 'vor' | 'ndb' | 'dme' | 'airport';
  coordinates: GeographicPosition;
  frequency?: number;
}

export interface FlightRoute {
  origin: string; // ICAO code
  destination: string; // ICAO code
  waypoints: NavigationWaypoint[];
  alternates: string[]; // ICAO codes
  totalDistance: number; // nautical miles
  estimatedFlightTime: number; // minutes
}

// Training and decision types
export interface TrainingObjective {
  id: string;
  description: string;
  category: 'communication' | 'decision-making' | 'technical' | 'safety' | 'teamwork';
  difficulty: 'basic' | 'intermediate' | 'advanced';
  completed: boolean;
  score: number; // 0-100
}

export interface DecisionMetrics {
  responseTime: number; // seconds
  accuracy: number; // percentage
  qualityScore: number; // 0-100
  collaborationScore: number; // 0-100
  safetyScore: number; // 0-100
}

export interface TrainingSession {
  id: string;
  scenarioId: string;
  participantRole: 'pilot' | 'copilot' | 'operations' | 'observer';
  startTime: Date;
  endTime?: Date;
  objectives: TrainingObjective[];
  decisions: DecisionRecord[];
  finalScore: number;
  feedback: string[];
  recommendations: string[];
}

export interface DecisionRecord {
  id: string;
  timestamp: Date;
  decisionPoint: string;
  optionSelected: string;
  source: 'crew' | 'operations' | 'automatic';
  responseTime: number;
  correctness: number; // 0-100
  impact: 'positive' | 'negative' | 'neutral';
  consequences: string[];
}

// Weather and environmental types
export interface WeatherConditions {
  visibility: number; // miles
  windSpeed: number; // knots
  windDirection: number; // degrees
  turbulence: 'none' | 'light' | 'moderate' | 'severe';
  icing: 'none' | 'trace' | 'light' | 'moderate' | 'severe';
  precipitation: 'none' | 'rain' | 'snow' | 'ice';
  cloudCoverage: number; // percentage
  cloudBase: number; // feet
  temperature: number; // Celsius
  dewPoint: number; // Celsius
  barometricPressure: number; // inHg
}

export interface WeatherHazard {
  type: 'thunderstorm' | 'turbulence' | 'icing' | 'windshear' | 'fog' | 'snow';
  severity: 'light' | 'moderate' | 'severe' | 'extreme';
  location: GeographicPosition;
  radius: number; // nautical miles
  altitude: {
    bottom: number; // feet
    top: number; // feet
  };
  movement: {
    direction: number; // degrees
    speed: number; // knots
  };
  forecast: {
    developing: boolean;
    weakening: boolean;
    stationary: boolean;
  };
}

// Communication and coordination types
export interface RadioMessage {
  id: string;
  timestamp: Date;
  from: string;
  to: string;
  type: 'clearance' | 'request' | 'emergency' | 'information' | 'coordination';
  priority: 'routine' | 'urgent' | 'emergency';
  content: string;
  acknowledged: boolean;
  response?: string;
}

export interface CoordinationEvent {
  id: string;
  timestamp: Date;
  type: 'crew-coordination' | 'atc-communication' | 'operations-update' | 'medical-consultation';
  participants: string[];
  topic: string;
  decisions: string[];
  actionItems: string[];
  followUp?: Date;
}

// Cost and operational analysis types
export interface OperationalCosts {
  fuelCost: number;
  crewCost: number;
  landingFees: number;
  handlingFees: number;
  passengerCompensation: number;
  maintenanceCost: number;
  rebookingCosts: number;
  totalCost: number;
}

export interface DiversionAnalysis {
  airport: AirportInfo;
  flightTime: number; // minutes
  fuelRequired: number; // kg
  fuelAvailable: number; // kg
  costs: OperationalCosts;
  medicalFacilities: boolean;
  weatherSuitability: number; // 0-100 score
  operationalFeasibility: number; // 0-100 score
  overallScore: number; // 0-100 score
  risks: string[];
  benefits: string[];
  recommendation: 'recommended' | 'suitable' | 'not-recommended';
}

// Performance monitoring types
export interface PerformanceMetrics {
  fuelEfficiency: number; // percentage
  flightTimeAccuracy: number; // percentage
  altitudeDeviations: number[];
  speedDeviations: number[];
  routeDeviations: number;
  communicationQuality: number; // 0-100 score
  decisionQuality: number; // 0-100 score
  safetyScore: number; // 0-100 score
}

export interface SystemAlert {
  id: string;
  timestamp: Date;
  type: 'caution' | 'warning' | 'advisory';
  system: string;
  message: string;
  acknowledged: boolean;
  resolved: boolean;
  actions: string[];
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface FlightStateUpdate {
  position: GeographicPosition;
  parameters: FlightParameters;
  engines: EngineData[];
  systems: SystemStatus;
  fuel: {
    remaining: number; // kg
    consumption: number; // kg/hour
    endurance: number; // hours
  };
  weather: WeatherConditions;
  emergency?: EmergencyStatus;
}

export interface ScenarioStateUpdate {
  active: boolean;
  scenario?: {
    id: string;
    title: string;
    type: string;
    progress: number;
  };
  currentDecision?: {
    id: string;
    description: string;
    timeLimit: number;
    options: Array<{
      id: string;
      text: string;
      consequences: string[];
    }>;
  };
  metrics: {
    score: number;
    decisions: number;
    accuracy: number;
  };
}

// WebSocket message types
export interface WebSocketMessage {
  type: 'flightState' | 'scenarioState' | 'emergency' | 'decision' | 'alert' | 'coordination';
  data: any;
  timestamp: Date;
  source?: string;
}

// Configuration types
export interface SimulationConfig {
  realism: 'basic' | 'standard' | 'advanced' | 'expert';
  weatherEnabled: boolean;
  turbulenceEnabled: boolean;
  systemFailuresEnabled: boolean;
  timeAcceleration: number; // 1x, 2x, 4x, etc.
  pauseOnEmergency: boolean;
  autoSaveInterval: number; // seconds
}

export interface TrainingConfig {
  mode: 'practice' | 'assessment' | 'certification';
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  scenarioRandomization: boolean;
  timeoutEnabled: boolean;
  hintingEnabled: boolean;
  collaborativeMode: boolean;
  recordingEnabled: boolean;
}

