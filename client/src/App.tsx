import { Canvas } from "@react-three/fiber";
import { Suspense, useState } from "react";
import { KeyboardControls } from "@react-three/drei";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@fontsource/inter";

import Aircraft from "./components/Aircraft";
import CockpitInterface from "./components/CockpitInterface";
import OperationsCenter from "./components/OperationsCenter";
import DecisionCenter from "./components/DecisionCenter";
import FlightMap from "./components/FlightMap";
import ScenarioManager from "./components/ScenarioManager";
import MetricsDisplay from "./components/MetricsDisplay";
import WeatherSystem from "./components/WeatherSystem";

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

type ViewMode = 'cockpit' | 'operations' | 'decisions' | 'overview';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [isInterfaceMinimized, setIsInterfaceMinimized] = useState(false);

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
                <WeatherSystem />
                <FlightMap />
              </Suspense>
            </Canvas>
          </div>

          {/* UI Overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Top Navigation */}
            <div className="absolute top-4 left-4 right-4 z-50 pointer-events-auto">
              <div className="flex justify-between items-center">
                <div className="aviation-panel p-3 rounded-lg">
                  <h1 className="text-white font-bold text-lg">Boeing 787 Digital Twin</h1>
                  <p className="text-blue-300 text-sm">Flight Training Simulator</p>
                </div>
                
                <div className="flex gap-2">
                  {viewMode !== 'overview' && (
                    <button
                      onClick={() => setIsInterfaceMinimized(!isInterfaceMinimized)}
                      className="px-3 py-2 rounded transition-colors bg-gray-600 text-white hover:bg-gray-500"
                      title={isInterfaceMinimized ? "Maximize Interface" : "Minimize Interface"}
                    >
                      {isInterfaceMinimized ? '□' : '_'}
                    </button>
                  )}
                  <button
                    onClick={() => setViewMode('cockpit')}
                    className={`px-4 py-2 rounded transition-colors ${
                      viewMode === 'cockpit' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Cockpit View
                  </button>
                  <button
                    onClick={() => setViewMode('operations')}
                    className={`px-4 py-2 rounded transition-colors ${
                      viewMode === 'operations' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Operations Center
                  </button>
                  <button
                    onClick={() => setViewMode('decisions')}
                    className={`px-4 py-2 rounded transition-colors ${
                      viewMode === 'decisions' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Decision Engine
                  </button>
                  <button
                    onClick={() => setViewMode('overview')}
                    className={`px-4 py-2 rounded transition-colors ${
                      viewMode === 'overview' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Overview
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

            {/* Mode-specific Interfaces - Dynamic and Minimizable */}
            {viewMode === 'cockpit' && !isInterfaceMinimized && (
              <div className="absolute top-16 left-4 right-4 bottom-32 pointer-events-auto bg-black/40 backdrop-blur-sm rounded-lg border border-gray-600/50 p-4">
                <CockpitInterface onEmergencyToggle={setIsEmergencyActive} />
              </div>
            )}
            
            {viewMode === 'operations' && !isInterfaceMinimized && (
              <div className="absolute top-16 left-4 right-4 bottom-32 pointer-events-auto bg-black/40 backdrop-blur-sm rounded-lg border border-gray-600/50 p-4">
                <OperationsCenter />
              </div>
            )}
            
            {viewMode === 'decisions' && !isInterfaceMinimized && (
              <div className="absolute top-16 left-4 right-4 bottom-32 pointer-events-auto bg-black/40 backdrop-blur-sm rounded-lg border border-gray-600/50 p-4">
                <DecisionCenter />
              </div>
            )}

            {/* Minimized Mode Indicator */}
            {isInterfaceMinimized && viewMode !== 'overview' && (
              <div className="absolute top-20 left-4 pointer-events-auto">
                <div className="bg-black/70 backdrop-blur-sm rounded-lg border border-gray-600 p-2">
                  <div className="text-white text-sm">
                    {viewMode === 'cockpit' && '✈️ Cockpit View (Minimized)'}
                    {viewMode === 'operations' && '🏢 Operations Center (Minimized)'}
                    {viewMode === 'decisions' && '🧠 Decision Engine (Minimized)'}
                  </div>
                </div>
              </div>
            )}

            {/* Always visible scenario manager and metrics */}
            <div className="absolute bottom-4 left-4 right-4 z-40 pointer-events-auto">
              <div className="flex gap-4">
                <div className="flex-1">
                  <ScenarioManager onEmergencyActivate={setIsEmergencyActive} />
                </div>
                <div className="w-96">
                  <MetricsDisplay />
                </div>
              </div>
            </div>

            {/* Flight controls help overlay */}
            <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-30 pointer-events-auto">
              <div className="aviation-panel p-4 rounded-lg">
                <h3 className="text-white font-semibold mb-2">Flight Controls</h3>
                <div className="text-blue-300 text-sm space-y-1">
                  <div>W/S: Pitch</div>
                  <div>A/D: Roll</div>
                  <div>Q/E: Yaw</div>
                  <div>R/F: Throttle</div>
                  <div>T: Autopilot</div>
                  <div>Space: Emergency</div>
                </div>
              </div>
            </div>
          </div>
        </KeyboardControls>
      </div>
    </QueryClientProvider>
  );
}

export default App;
