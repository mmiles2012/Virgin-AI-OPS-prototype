import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@fontsource/inter";

import OperationsCenter from "./components/OperationsCenter";
import EnhancedOperationalDecisionEngine from "./components/EnhancedOperationalDecisionEngine";
import FlightMap from "./components/FlightMap";
import ScenarioManager from "./components/ScenarioManager";
import MetricsDisplay from "./components/MetricsDisplay";
import InlineApiTest from "./components/InlineApiTest";
import LiveFlightTracker from "./components/LiveFlightTracker";
import SimpleFlightMap from "./components/SimpleFlightMap";
import SatelliteWorldMap from "./components/SatelliteWorldMap";
import EnhancedSatelliteMap from "./components/EnhancedSatelliteMap";
import ProfessionalSatelliteMap from "./components/ProfessionalSatelliteMap";
import AirportWeatherMap from "./components/AirportWeatherMap";
import SafeAirspaceAlerts from "./components/SafeAirspaceAlerts";
import RealTimeOperationsCenter from "./components/RealTimeOperationsCenter";
import GeopoliticalRiskCenter from "./components/GeopoliticalRiskCenter";
import DiversionDecisionEngine from "./components/DiversionDecisionEngine";
import DiversionSupportDashboard from "./components/DiversionSupportDashboard";
import DelayPredictionDashboard from "./components/DelayPredictionDashboard";
import { ApiTestingCenter } from "./components/ApiTestingCenter";
import { NewsIntelligenceDashboard } from "./components/NewsIntelligenceDashboard";
import Boeing787DigitalTwin from "./components/Boeing787DigitalTwin";
import AinoTrainingSimulator from "./components/AinoTrainingSimulator";
import AirbusOperationsCenter from "./components/AirbusOperationsCenter";
import FinancialAnalyticsDashboard from "./components/FinancialAnalyticsDashboard";
import FleetSubstitutionCalculator from "./components/FleetSubstitutionCalculator";
import SkyGateAirportDashboard from "./components/SkyGateAirportDashboard";
import EmergencyCommDashboard from "./components/EmergencyCommDashboard";
import OnTimePerformanceDashboard from "./components/OnTimePerformanceDashboard";
import VirginAtlanticFleetMonitor from "./components/VirginAtlanticFleetMonitor";
import IntelligenceDashboard from "./components/IntelligenceDashboard";

// Flight control mappings
enum FlightControls {
  pitchUp = 'pitchUp',
  pitchDown = 'pitchDown',
  rollLeft = 'rollLeft',
  rollRight = 'rollRight',
  yawLeft = 'yawLeft',
  yawRight = 'yawRight',
  throttleUp = 'throttleUp',
  throttleDown = 'throttleDown',
  autopilot = 'autopilot',
  emergency = 'emergency'
}

const controlMap = [
  { name: FlightControls.pitchUp, keys: ['KeyS', 'ArrowDown'] },
  { name: FlightControls.pitchDown, keys: ['KeyW', 'ArrowUp'] },
  { name: FlightControls.rollLeft, keys: ['KeyA', 'ArrowLeft'] },
  { name: FlightControls.rollRight, keys: ['KeyD', 'ArrowRight'] },
  { name: FlightControls.yawLeft, keys: ['KeyQ'] },
  { name: FlightControls.yawRight, keys: ['KeyE'] },
  { name: FlightControls.throttleUp, keys: ['KeyR'] },
  { name: FlightControls.throttleDown, keys: ['KeyF'] },
  { name: FlightControls.autopilot, keys: ['KeyT'] },
  { name: FlightControls.emergency, keys: ['Space'] }
];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

type ViewMode = 'operations' | 'decisions' | 'overview' | 'map' | 'airspace' | 'realtime' | 'geopolitical' | 'diversion' | 'diversion-support' | 'delay-prediction' | 'api-testing' | 'news-intelligence' | 'airport-weather' | 'satellite' | 'boeing787-twin' | 'training-simulator' | 'airbus-ops' | 'financial-analytics' | 'fleet-substitution' | 'skygate-airports' | 'emergency-comm' | 'otp-dashboard' | 'fleet-monitor' | 'intelligence-dashboard';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [showApiWizard, setShowApiWizard] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="w-full h-full relative bg-gradient-to-b from-blue-900 to-blue-950">
        {/* UI Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Left Sidebar Navigation */}
          <div className="absolute top-4 left-4 z-50 pointer-events-auto max-h-[calc(100vh-2rem)] overflow-y-auto">
              <div className="aviation-panel p-4 rounded-lg space-y-3 w-52">
                <div className="text-center mb-4">
                  <h1 className="text-white font-bold text-lg">AINO</h1>
                  <p className="text-blue-300 text-xs">Augmented Intelligent Network Operations</p>
                </div>
                
                <div className="space-y-2">
                  <button
                    onClick={() => setViewMode('overview')}
                    className={`w-full px-4 py-2 rounded transition-colors text-sm ${
                      viewMode === 'overview' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Overview
                  </button>
                  
                  <button
                    onClick={() => setViewMode('operations')}
                    className={`w-full px-4 py-2 rounded transition-colors text-sm ${
                      viewMode === 'operations' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Operations Centre
                  </button>
                  
                  <button
                    onClick={() => setViewMode('realtime')}
                    className={`w-full px-4 py-2 rounded transition-colors text-sm ${
                      viewMode === 'realtime' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Live Operations
                  </button>
                  
                  <button
                    onClick={() => setViewMode('geopolitical')}
                    className={`w-full px-4 py-2 rounded transition-colors text-sm ${
                      viewMode === 'geopolitical' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Risk Assessment
                  </button>
                  
                  <button
                    onClick={() => setViewMode('airspace')}
                    className={`w-full px-4 py-2 rounded transition-colors text-sm ${
                      viewMode === 'airspace' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Safe Airspace
                  </button>
                  
                  <button
                    onClick={() => setViewMode('news-intelligence')}
                    className={`w-full px-4 py-2 rounded transition-colors text-sm ${
                      viewMode === 'news-intelligence' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    News Intelligence
                  </button>
                  
                  <button
                    onClick={() => setViewMode('delay-prediction')}
                    className={`w-full px-4 py-2 rounded transition-colors text-sm ${
                      viewMode === 'delay-prediction' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Delay Prediction
                  </button>
                  
                  {/* Digital Twins Section */}
                  <div className="border-t border-gray-600 pt-3 mt-3">
                    <div className="text-xs text-gray-400 mb-2 px-2">DIGITAL TWINS</div>
                    
                    <button
                      onClick={() => setViewMode('boeing787-twin')}
                      className={`w-full px-4 py-2 rounded transition-colors text-sm ${
                        viewMode === 'boeing787-twin' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Boeing 787
                    </button>
                    
                    <button
                      onClick={() => setViewMode('airbus-ops')}
                      className={`w-full px-4 py-2 rounded transition-colors text-sm mt-1 ${
                        viewMode === 'airbus-ops' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Airbus Fleet
                    </button>
                  </div>
                  
                  <button
                    onClick={() => setViewMode('diversion')}
                    className={`w-full px-4 py-2 rounded transition-colors text-sm ${
                      viewMode === 'diversion' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    AI Diversion
                  </button>
                  
                  <button
                    onClick={() => setViewMode('decisions')}
                    className={`w-full px-4 py-2 rounded transition-colors text-sm ${
                      viewMode === 'decisions' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Decision Engine
                  </button>
                  
                  <button
                    onClick={() => setViewMode('diversion-support')}
                    className={`w-full px-4 py-2 rounded transition-colors text-sm ${
                      viewMode === 'diversion-support' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Diversion Support
                  </button>
                  
                  <button
                    onClick={() => setViewMode('financial-analytics')}
                    className={`w-full px-4 py-2 rounded transition-colors text-sm ${
                      viewMode === 'financial-analytics' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Financial Analytics
                  </button>
                  
                  <button
                    onClick={() => setViewMode('fleet-substitution')}
                    className={`w-full px-4 py-2 rounded transition-colors text-sm ${
                      viewMode === 'fleet-substitution' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Fleet Substitution
                  </button>
                  
                  <button
                    onClick={() => setViewMode('fleet-monitor')}
                    className={`w-full px-4 py-2 rounded transition-colors text-sm ${
                      viewMode === 'fleet-monitor' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Fleet Intelligence
                  </button>
                  
                  <button
                    onClick={() => setViewMode('skygate-airports')}
                    className={`w-full px-4 py-2 rounded transition-colors text-sm ${
                      viewMode === 'skygate-airports' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    SkyGate Airports
                  </button>
                  
                  <button
                    onClick={() => setViewMode('otp-dashboard')}
                    className={`w-full px-4 py-2 rounded transition-colors text-sm ${
                      viewMode === 'otp-dashboard' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Network OTP
                  </button>
                  
                  <button
                    onClick={() => setViewMode('emergency-comm')}
                    className={`w-full px-4 py-2 rounded transition-colors text-sm ${
                      viewMode === 'emergency-comm' 
                        ? 'bg-red-600 text-white' 
                        : 'bg-red-800 text-red-300 hover:bg-red-700'
                    }`}
                  >
                    Communications
                  </button>
                  
                  <button
                    onClick={() => setViewMode('intelligence-dashboard')}
                    className={`w-full px-4 py-2 rounded transition-colors text-sm ${
                      viewMode === 'intelligence-dashboard' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Intelligence Center
                  </button>
                  
                  {/* API Centre Section */}
                  <div className="border-t border-gray-600 pt-3 mt-3">
                    <div className="text-xs text-gray-400 mb-2 px-2">API CENTRE</div>
                    
                    <button
                      onClick={() => setViewMode('api-testing')}
                      className={`w-full px-4 py-2 rounded transition-colors text-sm ${
                        viewMode === 'api-testing' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      API Testing
                    </button>
                    
                    <button
                      onClick={() => {
                        console.log('API Setup button clicked');
                        setShowApiWizard(true);
                      }}
                      className="w-full px-4 py-2 rounded transition-colors bg-green-600 text-white hover:bg-green-700 text-sm mt-1"
                      title="Configure Aviation APIs"
                    >
                      API Setup
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Alert Banner */}
            {isEmergencyActive && (
              <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 pointer-events-auto">
                <div className="emergency-alert px-6 py-3 rounded-lg text-white font-bold">
                  ⚠️ MEDICAL EMERGENCY - DIVERSION REQUIRED
                </div>
              </div>
            )}

            {/* Mode-specific Interfaces - Adjusted for left sidebar */}
            
            {viewMode === 'operations' && (
              <div className="absolute top-4 left-56 right-4 bottom-32 pointer-events-auto bg-black/40 backdrop-blur-sm rounded-lg border border-gray-600/50 p-4">
                <OperationsCenter />
              </div>
            )}
            
            {viewMode === 'decisions' && (
              <div className="absolute top-4 left-56 right-4 bottom-32 pointer-events-auto bg-black/40 backdrop-blur-sm rounded-lg border border-gray-600/50 p-4">
                <EnhancedOperationalDecisionEngine />
              </div>
            )}
            
            {viewMode === 'airspace' && (
              <div className="absolute top-4 left-56 right-4 bottom-32 pointer-events-auto bg-black/40 backdrop-blur-sm rounded-lg border border-gray-600/50 p-4">
                <SafeAirspaceAlerts />
              </div>
            )}
            
            {viewMode === 'realtime' && (
              <div className="absolute top-4 left-56 right-4 bottom-32 pointer-events-auto bg-black/40 backdrop-blur-sm rounded-lg border border-gray-600/50 p-4">
                <RealTimeOperationsCenter />
              </div>
            )}
            
            {viewMode === 'geopolitical' && (
              <div className="absolute top-4 left-56 right-4 bottom-32 pointer-events-auto bg-black/40 backdrop-blur-sm rounded-lg border border-gray-600/50 p-4">
                <GeopoliticalRiskCenter />
              </div>
            )}
            
            {viewMode === 'diversion' && (
              <div className="absolute top-4 left-56 right-4 bottom-32 pointer-events-auto bg-black/40 backdrop-blur-sm rounded-lg border border-gray-600/50 p-4">
                <DiversionDecisionEngine />
              </div>
            )}
            
            {viewMode === 'api-testing' && (
              <div className="absolute top-4 left-56 right-4 bottom-32 pointer-events-auto bg-black/40 backdrop-blur-sm rounded-lg border border-gray-600/50 p-4">
                <ApiTestingCenter />
              </div>
            )}
            
            {viewMode === 'news-intelligence' && (
              <div className="absolute top-4 left-56 right-4 bottom-32 pointer-events-auto bg-white/95 backdrop-blur-sm rounded-lg border border-gray-600/50 overflow-hidden">
                <NewsIntelligenceDashboard />
              </div>
            )}
            
            {viewMode === 'diversion-support' && (
              <div className="absolute top-4 left-56 right-4 bottom-32 pointer-events-auto bg-white/95 backdrop-blur-sm rounded-lg border border-gray-600/50 overflow-hidden">
                <DiversionSupportDashboard />
              </div>
            )}
            
            {viewMode === 'delay-prediction' && (
              <div className="absolute top-0 left-56 right-0 bottom-0 pointer-events-auto">
                <DelayPredictionDashboard />
              </div>
            )}
            
            {viewMode === 'boeing787-twin' && (
              <div className="absolute top-0 left-56 right-0 bottom-0 pointer-events-auto bg-white">
                <Boeing787DigitalTwin />
              </div>
            )}
            
            {viewMode === 'training-simulator' && (
              <div className="absolute top-0 left-56 right-0 bottom-0 pointer-events-auto bg-white">
                <AinoTrainingSimulator />
              </div>
            )}
            
            {viewMode === 'airbus-ops' && (
              <div className="absolute top-0 left-56 right-0 bottom-0 pointer-events-auto">
                <AirbusOperationsCenter />
              </div>
            )}
            
            {viewMode === 'financial-analytics' && (
              <div className="absolute top-0 left-56 right-0 bottom-0 pointer-events-auto bg-white">
                <FinancialAnalyticsDashboard />
              </div>
            )}
            
            {viewMode === 'fleet-substitution' && (
              <div className="absolute top-0 left-56 right-0 bottom-0 pointer-events-auto">
                <FleetSubstitutionCalculator />
              </div>
            )}
            
            {viewMode === 'skygate-airports' && (
              <div className="absolute top-4 left-56 right-4 bottom-32 pointer-events-auto bg-white/95 backdrop-blur-sm rounded-lg border border-gray-600/50 overflow-hidden">
                <SkyGateAirportDashboard />
              </div>
            )}
            
            {viewMode === 'otp-dashboard' && (
              <div className="absolute top-4 left-56 right-4 bottom-4 pointer-events-auto bg-black/40 backdrop-blur-sm rounded-lg border border-gray-600/50 overflow-hidden">
                <OnTimePerformanceDashboard />
              </div>
            )}
            
            {viewMode === 'fleet-monitor' && (
              <div className="absolute top-4 left-56 right-4 bottom-4 pointer-events-auto bg-black/40 backdrop-blur-sm rounded-lg border border-gray-600/50 overflow-hidden">
                <VirginAtlanticFleetMonitor />
              </div>
            )}
            
            {viewMode === 'intelligence-dashboard' && (
              <div className="absolute top-4 left-56 right-4 bottom-4 pointer-events-auto bg-black/40 backdrop-blur-sm rounded-lg border border-gray-600/50 overflow-hidden">
                <IntelligenceDashboard />
              </div>
            )}
            
            {viewMode === 'emergency-comm' && (
              <div className="absolute top-4 left-56 right-4 bottom-4 pointer-events-auto bg-white/95 backdrop-blur-sm rounded-lg border border-red-600/50 overflow-hidden">
                <EmergencyCommDashboard />
              </div>
            )}

            {/* Full-Screen Enhanced Satellite Map - Overview Mode */}
            {viewMode === 'overview' && (
              <div className="absolute top-0 left-56 right-0 bottom-0 pointer-events-auto">
                <ProfessionalSatelliteMap />
              </div>
            )}

            {/* API Integration Wizard */}
            {showApiWizard && (
              <InlineApiTest onClose={() => setShowApiWizard(false)} />
            )}

          </div>
      </div>
    </QueryClientProvider>
  );
}

export default App;
