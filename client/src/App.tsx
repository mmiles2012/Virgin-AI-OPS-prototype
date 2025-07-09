import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@fontsource/inter";
import ErrorBoundary from "./components/ErrorBoundary";
import MobileFallback from "./components/MobileFallback";


import EnhancedOperationalDecisionEngine from "./components/EnhancedOperationalDecisionEngine";
import FlightMap from "./components/FlightMap";
import ScenarioManager from "./components/ScenarioManager";
import MetricsDisplay from "./components/MetricsDisplay";
import InlineApiTest from "./components/InlineApiTest";
import LiveFlightTracker from "./components/LiveFlightTracker";
import EnhancedLiveFlightTracker from "./components/EnhancedLiveFlightTracker";
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
import AirbusDigitalTwins from "./components/AirbusDigitalTwins";
import AinoTrainingSimulator from "./components/AinoTrainingSimulator";
import AirbusOperationsCenter from "./components/AirbusOperationsCenter";
import FinancialAnalyticsDashboard from "./components/FinancialAnalyticsDashboard";
import FleetSubstitutionCalculator from "./components/FleetSubstitutionCalculator";
import SkyGateAirportDashboard from "./components/SkyGateAirportDashboard";
import EmergencyCommDashboard from "./components/EmergencyCommDashboard";
import NetworkOTPDashboardSimple from "./components/NetworkOTPDashboardSimple";
import VirginAtlanticFleetMonitor from "./components/VirginAtlanticFleetMonitor";
import IntelligenceDashboard from "./components/IntelligenceDashboard";
import GroundFuelMapViewer from "./components/GroundFuelMapViewer";
import EmergencyResponseTesting from "./components/EmergencyResponseTesting";
import HubDelayPredictionDashboard from "./components/HubDelayPredictionDashboard";
import NMPunctualityChart from "./components/NMPunctualityChart";
import ConsolidatedFaaDashboard from "./components/ConsolidatedFaaDashboard";
import AirportContactDashboard from "./components/AirportContactDashboard";
import AIOpsDashboard from "./components/AIOpsDashboard";
import DisruptionResponseConsole from "./components/DisruptionResponseConsole";
import WhatIfScenarioEngine from "./components/WhatIfScenarioEngine";
import EnhancedAirportFacilities from "./components/EnhancedAirportFacilities";
import DataAuthenticityDashboard from "./components/DataAuthenticityDashboard";
import EnhancedNetworkOTPDashboard from "./components/EnhancedNetworkOTPDashboard";
import AdsxExchangeDataDashboard from "./components/AdsxExchangeDataDashboard";
import VisaRequirementsDashboard from "./components/VisaRequirementsDashboard";
// import GlobalAirportDatabase from "./components/GlobalAirportDatabase";



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

type ViewMode = 'operations' | 'decisions' | 'overview' | 'map' | 'airspace' | 'realtime' | 'geopolitical' | 'diversion' | 'diversion-support' | 'delay-prediction' | 'disruption-response' | 'what-if-scenarios' | 'nm-punctuality' | 'us-aviation' | 'api-testing' | 'news-intelligence' | 'airport-weather' | 'satellite' | 'boeing787-twin' | 'training-simulator' | 'airbus-ops' | 'financial-analytics' | 'fleet-substitution' | 'skygate-airports' | 'emergency-comm' | 'otp-dashboard' | 'fleet-monitor' | 'intelligence-dashboard' | '3d-globe' | 'emergency-testing' | 'airport-contacts' | 'enhanced-facilities' | 'data-authenticity' | 'visa-requirements';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [showApiWizard, setShowApiWizard] = useState(false);
  const [isNavigationCollapsed, setIsNavigationCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection and auto-collapse - iPads get full interface
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      
      // Enhanced iPad detection for all iPad models and iOS Safari on iPad
      const isIpad = /iPad/i.test(navigator.userAgent) || 
                     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
                     (/iPhone|iPod/i.test(navigator.userAgent) && window.innerWidth >= 768) ||
                     navigator.userAgent.includes('iPad');
      
      console.log('Device detection:', { mobile, isIpad, userAgent: navigator.userAgent, platform: navigator.platform, touchPoints: navigator.maxTouchPoints });
      
      setIsMobile(mobile && !isIpad); // iPads don't count as mobile
      
      if (mobile && !isIpad) {
        setIsNavigationCollapsed(true);
      }
      
      // Signal that React loaded successfully
      document.body.setAttribute('data-react-loaded', 'true');
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Enhanced fallback system for Replit app and mobile
  const isReplitApp = navigator.userAgent.includes('Replit');
  
  // Force fallback for Replit app since white screen issues persist
  if (isMobile || isReplitApp) {
    return (
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <MobileFallback />
        </QueryClientProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <div className="w-full min-h-screen relative bg-gradient-to-b from-blue-900 to-blue-950" style={{ touchAction: 'manipulation' }}>
        {/* UI Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Left Sidebar Navigation */}
          <div className="absolute top-2 left-2 md:top-4 md:left-4 z-50 pointer-events-auto max-h-[calc(100vh-1rem)] md:max-h-[calc(100vh-2rem)] overflow-y-auto aviation-scrollable">
              <div className={`aviation-panel p-3 md:p-4 rounded-lg space-y-2 md:space-y-3 transition-all duration-300 ${isNavigationCollapsed ? 'w-12 md:w-14' : 'w-48 md:w-52'}`}>
                <div className="text-center mb-4">
                  <button
                    onClick={() => setIsNavigationCollapsed(!isNavigationCollapsed)}
                    className="w-full text-white font-bold text-lg touch-manipulation hover:text-blue-300 transition-colors"
                  >
                    {isNavigationCollapsed ? '☰' : 'AINO'}
                  </button>
                  {!isNavigationCollapsed && (
                    <p className="text-blue-300 text-xs">Augmented Intelligent Network Operations</p>
                  )}
                </div>
                
                {!isNavigationCollapsed && (
                <div className="space-y-2">
                  <button
                    onClick={() => setViewMode('overview')}
                    className={`w-full px-3 md:px-4 py-2 rounded transition-colors text-xs md:text-sm touch-manipulation ${
                      viewMode === 'overview' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600 active:bg-gray-600'
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
                    Fleet Operations
                  </button>
                  
                  <button
                    onClick={() => setViewMode('realtime')}
                    className={`w-full px-4 py-2 rounded transition-colors text-sm ${
                      viewMode === 'realtime' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Live Flight Operations
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
                    Airspace Alerts
                  </button>
                  
                  <button
                    onClick={() => setViewMode('emergency-testing')}
                    className={`w-full px-4 py-2 rounded transition-colors text-sm ${
                      viewMode === 'emergency-testing' 
                        ? 'bg-orange-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Emergency Response Testing
                  </button>
                  
                  <button
                    onClick={() => setViewMode('intelligence-dashboard')}
                    className={`w-full px-4 py-2 rounded transition-colors text-sm ${
                      viewMode === 'intelligence-dashboard' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Intelligence Centre
                  </button>
                  
                  <button
                    onClick={() => setViewMode('enhanced-facilities')}
                    className={`w-full px-4 py-2 rounded transition-colors text-sm ${
                      viewMode === 'enhanced-facilities' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Enhanced Facilities
                  </button>
                  
                  <button
                    onClick={() => setViewMode('data-authenticity')}
                    className={`w-full px-4 py-2 rounded transition-colors text-sm ${
                      viewMode === 'data-authenticity' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Data Authenticity
                  </button>
                  
                  <button
                    onClick={() => setViewMode('adsb-exchange')}
                    className={`w-full px-4 py-2 rounded transition-colors text-sm ${
                      viewMode === 'adsb-exchange' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    ADS-B Exchange
                  </button>
                  
                  <button
                    onClick={() => setViewMode('visa-requirements')}
                    className={`w-full px-4 py-2 rounded transition-colors text-sm ${
                      viewMode === 'visa-requirements' 
                        ? 'bg-orange-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Visa Requirements
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
                  
                  <button
                    onClick={() => setViewMode('disruption-response')}
                    className={`w-full px-4 py-2 rounded transition-colors text-sm ${
                      viewMode === 'disruption-response' 
                        ? 'bg-red-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Disruption Response
                  </button>
                  
                  <button
                    onClick={() => setViewMode('what-if-scenarios')}
                    className={`w-full px-4 py-2 rounded transition-colors text-sm ${
                      viewMode === 'what-if-scenarios' 
                        ? 'bg-yellow-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    What-If Scenarios
                  </button>
                  
                  <button
                    onClick={() => setViewMode('nm-punctuality')}
                    className={`w-full px-4 py-2 rounded transition-colors text-sm ${
                      viewMode === 'nm-punctuality' 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    European Punctuality
                  </button>
                  
                  <button
                    onClick={() => setViewMode('us-aviation')}
                    className={`w-full px-4 py-2 rounded transition-colors text-sm ${
                      viewMode === 'us-aviation' 
                        ? 'bg-red-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    US Aviation Intelligence
                  </button>
                  


                  
                  <button
                    onClick={() => setViewMode('diversion')}
                    className={`w-full px-4 py-2 rounded transition-colors text-sm ${
                      viewMode === 'diversion' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Diversion Engine
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
                  
                  {/* Communications Section */}
                  <div className="border-t border-gray-600 pt-3 mt-3">
                    <div className="text-xs text-amber-400 mb-2 px-2">COMMUNICATIONS</div>
                    
                    <button
                      onClick={() => setViewMode('emergency-comm')}
                      className={`w-full px-4 py-2 rounded transition-colors text-sm ${
                        viewMode === 'emergency-comm' 
                          ? 'bg-amber-600 text-white shadow-lg' 
                          : 'bg-amber-800 text-amber-300 hover:bg-amber-700'
                      }`}
                    >
                      Communications
                    </button>
                  </div>
                  
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
                    
                    <button
                      onClick={() => setViewMode('fleet-monitor')}
                      className={`w-full px-4 py-2 rounded transition-colors text-sm mt-1 ${
                        viewMode === 'fleet-monitor' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Fleet Intelligence
                    </button>
                    

                  </div>
                  
                  {/* Database Section - Temporarily Disabled */}
                  {/* <div className="border-t border-gray-600 pt-3 mt-3">
                    <div className="text-xs text-gray-400 mb-2 px-2">DATABASE</div>
                    
                    <button
                      onClick={() => setViewMode('global-airports')}
                      className={`w-full px-4 py-2 rounded transition-colors text-sm ${
                        viewMode === 'global-airports' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Global Airport Database
                    </button>
                  </div> */}
                  
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
                )}
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
            

            
            {viewMode === 'decisions' && (
              <div className="absolute top-4 left-56 right-4 bottom-32 pointer-events-auto bg-black/40 backdrop-blur-sm rounded-lg border border-gray-600/50 p-4">
                <EnhancedOperationalDecisionEngine />
              </div>
            )}
            
            {viewMode === 'airspace' && (
              <div className="absolute top-4 left-56 right-4 bottom-32 pointer-events-auto bg-black/40 backdrop-blur-sm rounded-lg border border-gray-600/50 p-4 overflow-auto">
                <SafeAirspaceAlerts />
              </div>
            )}
            
            {viewMode === 'realtime' && (
              <div className="absolute top-4 left-56 right-4 bottom-4 pointer-events-auto bg-black/40 backdrop-blur-sm rounded-lg border border-gray-600/50 p-4 overflow-auto">
                <EnhancedLiveFlightTracker />
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
            
            {viewMode === 'diversion-support' && (
              <div className="absolute top-4 left-56 right-4 bottom-4 pointer-events-auto bg-white/95 backdrop-blur-sm rounded-lg border border-gray-600/50 overflow-y-auto">
                <DiversionSupportDashboard />
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
            

            
            {viewMode === 'delay-prediction' && (
              <div className="absolute top-0 left-56 right-0 bottom-0 pointer-events-auto">
                <HubDelayPredictionDashboard />
              </div>
            )}
            
            {viewMode === 'disruption-response' && (
              <div className="absolute top-0 left-56 right-0 bottom-0 pointer-events-auto overflow-y-auto">
                <DisruptionResponseConsole />
              </div>
            )}
            
            {viewMode === 'operations' && (
              <div className="absolute top-4 left-56 right-4 bottom-16 pointer-events-auto bg-black/40 backdrop-blur-sm rounded-lg border border-blue-600/50 overflow-y-auto">
                <VirginAtlanticFleetMonitor />
              </div>
            )}

            {viewMode === 'what-if-scenarios' && (
              <div className="absolute top-0 left-56 right-0 bottom-0 pointer-events-auto overflow-y-auto">
                <WhatIfScenarioEngine />
              </div>
            )}
            
            {viewMode === 'nm-punctuality' && (
              <div className="absolute top-4 left-56 right-4 bottom-4 pointer-events-auto bg-white/95 backdrop-blur-sm rounded-lg border border-purple-600/50 overflow-auto">
                <div className="p-6">
                  <NMPunctualityChart />
                </div>
              </div>
            )}
            
            {viewMode === 'us-aviation' && (
              <div className="absolute top-4 left-56 right-4 bottom-4 pointer-events-auto bg-white/95 backdrop-blur-sm rounded-lg border border-red-600/50 overflow-auto">
                <ConsolidatedFaaDashboard />
              </div>
            )}
            
            {viewMode === 'boeing787-twin' && (
              <div className="absolute top-0 left-56 right-0 bottom-0 pointer-events-auto bg-white overflow-y-auto">
                <Boeing787DigitalTwin />
              </div>
            )}
            
            {viewMode === 'training-simulator' && (
              <div className="absolute top-0 left-56 right-0 bottom-0 pointer-events-auto bg-white">
                <AinoTrainingSimulator />
              </div>
            )}
            
            {viewMode === 'airbus-ops' && (
              <div className="absolute top-0 left-56 right-0 bottom-0 pointer-events-auto bg-white overflow-y-auto">
                <AirbusDigitalTwins />
              </div>
            )}
            
            {viewMode === 'financial-analytics' && (
              <div className="absolute top-0 left-56 right-0 bottom-0 pointer-events-auto bg-white overflow-y-auto">
                <FinancialAnalyticsDashboard />
              </div>
            )}
            
            {viewMode === 'fleet-substitution' && (
              <div className="absolute top-0 left-56 right-0 bottom-0 pointer-events-auto overflow-y-auto">
                <FleetSubstitutionCalculator />
              </div>
            )}
            
            {viewMode === 'skygate-airports' && (
              <div className="absolute top-4 left-56 right-4 bottom-16 pointer-events-auto bg-white/95 backdrop-blur-sm rounded-lg border border-gray-600/50 overflow-y-auto">
                <SkyGateAirportDashboard />
              </div>
            )}
            
            {viewMode === 'otp-dashboard' && (
              <div className="fixed inset-0 left-56 pointer-events-auto z-40">
                <div className="h-full w-full p-4">
                  <div className="h-full bg-white/95 backdrop-blur-sm rounded-lg border border-red-600/50 flex flex-col">
                    <div className="flex-1 overflow-y-auto">
                      <EnhancedNetworkOTPDashboard />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {viewMode === 'fleet-monitor' && (
              <div className="absolute top-4 left-56 right-4 bottom-16 pointer-events-auto bg-black/40 backdrop-blur-sm rounded-lg border border-gray-600/50 overflow-y-auto">
                <VirginAtlanticFleetMonitor />
              </div>
            )}
            
            {viewMode === 'intelligence-dashboard' && (
              <div className="absolute top-4 left-56 right-4 bottom-16 pointer-events-auto bg-black/40 backdrop-blur-sm rounded-lg border border-gray-600/50 overflow-y-auto">
                <IntelligenceDashboard />
              </div>
            )}
            


            
            {viewMode === 'emergency-comm' && (
              <div className="absolute top-4 left-56 right-4 bottom-16 pointer-events-auto bg-white/95 backdrop-blur-sm rounded-lg border border-red-600/50 overflow-y-auto">
                <EmergencyCommDashboard />
              </div>
            )}

            {/* Full-Screen Enhanced Satellite Map - Overview Mode */}
            {viewMode === 'emergency-testing' && (
              <div className="absolute top-0 left-56 right-0 bottom-0 pointer-events-auto">
                <EmergencyResponseTesting />
              </div>
            )}

            {viewMode === 'overview' && (
              <div className={`absolute top-0 ${isNavigationCollapsed ? 'left-16 md:left-20' : 'left-52 md:left-56'} right-0 bottom-0 pointer-events-auto transition-all duration-300 overflow-y-auto`}>
                <AIOpsDashboard />
              </div>
            )}
            
            {viewMode === 'enhanced-facilities' && (
              <div className="absolute top-4 left-56 right-4 bottom-16 pointer-events-auto bg-black/40 backdrop-blur-sm rounded-lg border border-blue-600/50 overflow-y-auto">
                <EnhancedAirportFacilities />
              </div>
            )}
            
            {viewMode === 'data-authenticity' && (
              <div className="absolute top-0 left-56 right-0 bottom-0 pointer-events-auto overflow-y-auto">
                <DataAuthenticityDashboard />
              </div>
            )}
            
            {viewMode === 'adsb-exchange' && (
              <div className="absolute top-0 left-56 right-0 bottom-0 pointer-events-auto overflow-y-auto">
                <AdsxExchangeDataDashboard />
              </div>
            )}

            {viewMode === 'visa-requirements' && (
              <div className="absolute top-0 left-56 right-0 bottom-0 pointer-events-auto overflow-y-auto">
                <VisaRequirementsDashboard />
              </div>
            )}

            {/* {viewMode === 'global-airports' && (
              <div className="absolute top-0 left-56 right-0 bottom-0 pointer-events-auto bg-white">
                <GlobalAirportDatabase />
              </div>
            )} */}

            {/* API Integration Wizard */}
            {showApiWizard && (
              <InlineApiTest onClose={() => setShowApiWizard(false)} />
            )}

          </div>
      </div>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
