import { Canvas } from "@react-three/fiber";
import { Suspense, useState } from "react";
import { KeyboardControls } from "@react-three/drei";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@fontsource/inter";

import Aircraft from "./components/Aircraft";

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
import LeafletSatelliteMap from "./components/LeafletSatelliteMap";
import AirportWeatherMap from "./components/AirportWeatherMap";
import SafeAirspaceAlerts from "./components/SafeAirspaceAlerts";
import RealTimeOperationsCenter from "./components/RealTimeOperationsCenter";
import GeopoliticalRiskCenter from "./components/GeopoliticalRiskCenter";
import DiversionDecisionEngine from "./components/DiversionDecisionEngine";
import { ApiTestingCenter } from "./components/ApiTestingCenter";
import { NewsIntelligenceDashboard } from "./components/NewsIntelligenceDashboard";

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

type ViewMode = 'operations' | 'decisions' | 'overview' | 'map' | 'airspace' | 'realtime' | 'geopolitical' | 'diversion' | 'api-testing' | 'news-intelligence' | 'airport-weather' | 'satellite';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [showApiWizard, setShowApiWizard] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="w-full h-full relative bg-gradient-to-b from-blue-900 to-blue-950">
        <KeyboardControls map={controlMap}>
          {/* Main 3D Scene */}
          <div className="absolute inset-0">
            <Canvas
              shadows
              camera={{
                position: [0, 50, 100],
                fov: 60,
                near: 0.1,
                far: 10000
              }}
              gl={{
                antialias: true,
                powerPreference: "high-performance"
              }}
            >
              <color attach="background" args={["#0c1426"]} />
              
              {/* Lighting setup for aircraft visibility */}
              <ambientLight intensity={0.4} />
              <directionalLight
                position={[100, 100, 50]}
                intensity={1}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
              />
              <pointLight position={[0, 50, 0]} intensity={0.5} color="#60a5fa" />

              <Suspense fallback={null}>
                <Aircraft />
                <FlightMap />
              </Suspense>
            </Canvas>
          </div>

          {/* UI Overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Left Sidebar Navigation */}
            <div className="absolute top-4 left-4 z-50 pointer-events-auto">
              <div className="aviation-panel p-4 rounded-lg space-y-3 w-48">
                <div className="text-center mb-4">
                  <h1 className="text-white font-bold text-lg">AINO</h1>
                  <p className="text-blue-300 text-xs">Augmented Intelligent Network Operations</p>
                </div>
                
                <div className="space-y-2">
                  

                  
                  <button
                    onClick={() => setViewMode('operations')}
                    className={`w-full px-4 py-2 rounded transition-colors text-sm ${
                      viewMode === 'operations' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Operations Center
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
                    onClick={() => setViewMode('airspace')}
                    className={`w-full px-4 py-2 rounded transition-colors text-sm ${
                      viewMode === 'airspace' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    SafeAirspace
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
                    onClick={() => {
                      console.log('API Setup button clicked');
                      setShowApiWizard(true);
                    }}
                    className="w-full px-4 py-2 rounded transition-colors bg-green-600 text-white hover:bg-green-700 text-sm"
                    title="Configure Aviation APIs"
                  >
                    API Setup
                  </button>
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
            


            {/* Full-Screen Enhanced Satellite Map - Overview Mode */}
            {viewMode === 'overview' && (
              <div className="absolute top-0 left-56 right-0 bottom-0 pointer-events-auto">
                <LeafletSatelliteMap />
              </div>
            )}

            {/* API Integration Wizard */}
            {showApiWizard && (
              <InlineApiTest onClose={() => setShowApiWizard(false)} />
            )}

          </div>
        </KeyboardControls>
      </div>
    </QueryClientProvider>
  );
}

export default App;
