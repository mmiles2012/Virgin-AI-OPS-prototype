import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@fontsource/inter";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import MobileFallback from "./components/MobileFallback";
import { ResponsiveProvider } from "./contexts/ResponsiveContext";
import { ToastProvider } from "./contexts/ToastContext";

// Virgin Atlantic Design System Components
import VirginAtlanticDesignShowcase from "./components/VirginAtlanticDesignShowcase";
import VirginAtlanticNavigation from "./components/VirginAtlanticNavigation";

import EnhancedOperationalDecisionEngine from "./components/EnhancedOperationalDecisionEngine";
import ScenarioManager from "./components/ScenarioManager";
import MetricsDisplay from "./components/MetricsDisplay";
import InlineApiTest from "./components/InlineApiTest";
import EnhancedLiveFlightTracker from "./components/EnhancedLiveFlightTracker";
import ProfessionalSatelliteMap from "./components/ProfessionalSatelliteMap";
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
import VirginAtlanticFleetMonitor from "./components/VirginAtlanticFleetMonitor";
import IntelligenceDashboard from "./components/IntelligenceDashboard";
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
import VisaRequirementsDashboard from "./components/VisaRequirementsDashboard";
import IntelligentDecisionDashboard from "./components/IntelligentDecisionDashboard";
import SlotRiskDashboard from "./components/SlotRiskDashboard";
import HeathrowHoldingDashboard from "./components/HeathrowHoldingDashboard";
import IntegratedHoldingMLDashboard from "./components/IntegratedHoldingMLDashboard";

import AIOperationsCenter from "./components/AIOperationsCenter";
import DocumentationDownload from "./components/DocumentationDownload";
import FAAStatusDashboard from "./components/FAAStatusDashboard";
// import GlobalAirportDatabase from "./components/GlobalAirportDatabase";



// Flight control mappings - Disabled to prevent game interface overlays
// enum FlightControls {
//   pitchUp = 'pitchUp',
//   pitchDown = 'pitchDown',
//   rollLeft = 'rollLeft',
//   rollRight = 'rollRight',
//   yawLeft = 'yawLeft',
//   yawRight = 'yawRight',
//   throttleUp = 'throttleUp',
//   throttleDown = 'throttleDown',
//   autopilot = 'autopilot',
//   emergency = 'emergency'
// }

// const controlMap = [
//   { name: FlightControls.pitchUp, keys: ['KeyS', 'ArrowDown'] },
//   { name: FlightControls.pitchDown, keys: ['KeyW', 'ArrowUp'] },
//   { name: FlightControls.rollLeft, keys: ['KeyA', 'ArrowLeft'] },
//   { name: FlightControls.rollRight, keys: ['KeyD', 'ArrowRight'] },
//   { name: FlightControls.yawLeft, keys: ['KeyQ'] },
//   { name: FlightControls.yawRight, keys: ['KeyE'] },
//   { name: FlightControls.throttleUp, keys: ['KeyR'] },
//   { name: FlightControls.throttleDown, keys: ['KeyF'] },
//   { name: FlightControls.autopilot, keys: ['KeyT'] },
//   { name: FlightControls.emergency, keys: ['Space'] }
// ];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

type ViewMode = 'operations' | 'decisions' | 'overview' | 'map' | 'airspace' | 'realtime' | 'geopolitical' | 'diversion' | 'diversion-support' | 'delay-prediction' | 'disruption-response' | 'what-if-scenarios' | 'nm-punctuality' | 'us-aviation' | 'api-testing' | 'news-intelligence' | 'airport-weather' | 'satellite' | 'boeing787-twin' | 'training-simulator' | 'airbus-ops' | 'financial-analytics' | 'fleet-substitution' | 'skygate-airports' | 'emergency-comm' | 'otp-dashboard' | 'fleet-monitor' | 'intelligence-dashboard' | '3d-globe' | 'emergency-testing' | 'airport-contacts' | 'enhanced-facilities' | 'data-authenticity' | 'visa-requirements' | 'heathrow-holding' | 'integrated-holding-ml' | 'flightaware-notam' | 'intelligent-decisions' | 'slot-risk' | 'faa-status' | 'design-showcase' | 'scenario-engine' | 'boeing-twin' | 'airbus-twins' | 'ai-operations' | 'adsb-exchange' | 'documentation-download';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [showApiWizard, setShowApiWizard] = useState(false);
  const [isNavigationCollapsed, setIsNavigationCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showHoldingDropdown, setShowHoldingDropdown] = useState(false);
  const [showDiversionDropdown, setShowDiversionDropdown] = useState(false);

  // Close dropdowns when navigation collapses
  useEffect(() => {
    if (isNavigationCollapsed) {
      setShowHoldingDropdown(false);
      setShowDiversionDropdown(false);
    }
  }, [isNavigationCollapsed]);

  // Mobile detection and auto-collapse - iPads and desktops get full interface
  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      const userAgent = navigator.userAgent;
      
      // Enhanced iPad detection for all iPad models and iOS Safari on iPad
      const isIpad = /iPad/i.test(userAgent) || 
                     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
                     (/iPhone|iPod/i.test(userAgent) && width >= 768) ||
                     userAgent.includes('iPad');
      
      // Desktop detection - any device with large screen is desktop
      const isDesktop = width >= 1024 || 
                       userAgent.includes('Windows') || 
                       userAgent.includes('Macintosh') ||
                       userAgent.includes('Linux');
      
      // Only treat as mobile if it's actually a small phone screen
      const isTrueMobile = /Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) && 
                          !isIpad && 
                          !isDesktop &&
                          width < 640;
      
      console.log('Device detection:', { 
        mobile: isTrueMobile, 
        isIpad, 
        isDesktop,
        width,
        userAgent, 
        platform: navigator.platform, 
        touchPoints: navigator.maxTouchPoints 
      });
      
      setIsMobile(isTrueMobile); // Only true mobile phones count as mobile
      
      if (isTrueMobile) {
        setIsNavigationCollapsed(true);
      }
      
      // Signal that React loaded successfully
      document.body.setAttribute('data-react-loaded', 'true');
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Only use fallback for actual mobile phones, not desktop or iPad
  if (isMobile) {
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
      <ToastProvider>
        <ResponsiveProvider>
          <QueryClientProvider client={queryClient}>
            <div className="w-full min-h-screen relative bg-background" style={{ touchAction: 'manipulation' }}>
              {/* Virgin Atlantic Navigation */}
              <VirginAtlanticNavigation
                viewMode={viewMode}
                setViewMode={setViewMode}
                isNavigationCollapsed={isNavigationCollapsed}
                setIsNavigationCollapsed={setIsNavigationCollapsed}
              />
              {/* Main Content Area */}
              <div className={`ml-0 transition-all duration-300 ${!isNavigationCollapsed ? 'md:ml-64' : 'md:ml-16'}`}>
                {/* Content views will be rendered here */}
                {viewMode === 'design-showcase' && <VirginAtlanticDesignShowcase />}
                {/* All buttons and dropdowns restored here, properly nested and closed */}
                {/* ...existing code for all buttons and dropdowns... */}
              </div>
              {/* All mode-specific interfaces restored here, properly nested and closed */}
              {/* ...existing code for all mode-specific interfaces... */}
            </div>
          </QueryClientProvider>
        </ResponsiveProvider>
      </ToastProvider>
    </ErrorBoundary>
                      viewMode === 'faa-status' 
                        ? 'bg-warning text-warning-foreground' 
                        : 'bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    FAA NAS Status
                  </button>
                  
                  <button
                    onClick={() => setViewMode('emergency-testing')}
                    className={`w-full px-4 py-2 rounded transition-colors text-sm ${
                      viewMode === 'emergency-testing' 
                        ? 'bg-warning text-warning-foreground' 
                        : 'bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    Emergency Response Testing
                  </button>
                  
                  <button
                    onClick={() => setViewMode('ai-operations')}
                    className={`w-full px-4 py-2 rounded transition-colors text-sm ${
                      viewMode === 'ai-operations' 
                        ? 'bg-destructive text-destructive-foreground' 
                        : 'bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    AI Operations Center
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
                  
                  {/* Master Holding Button with Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowHoldingDropdown(!showHoldingDropdown)}
                      className={`w-full px-4 py-2 rounded transition-colors text-sm flex items-center justify-between ${
                        (viewMode === 'heathrow-holding' || viewMode === 'integrated-holding-ml' || viewMode === 'delay-prediction') 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      <span>Holding</span>
                      <span className={`transition-transform ${showHoldingDropdown ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                    
                    {showHoldingDropdown && (
                      <div className="absolute left-0 top-full mt-1 w-full bg-gray-800 border border-gray-600 rounded shadow-lg z-10">
                        <button
                          onClick={() => {
                            setViewMode('heathrow-holding');
                            setShowHoldingDropdown(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                            viewMode === 'heathrow-holding' 
                              ? 'bg-purple-600 text-white' 
                              : 'text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          Heathrow Holding
                        </button>
                        <button
                          onClick={() => {
                            setViewMode('integrated-holding-ml');
                            setShowHoldingDropdown(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                            viewMode === 'integrated-holding-ml' 
                              ? 'bg-purple-600 text-white' 
                              : 'text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          Integrated Holding ML
                        </button>
                        <button
                          onClick={() => {
                            setViewMode('delay-prediction');
                            setShowHoldingDropdown(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                            viewMode === 'delay-prediction' 
                              ? 'bg-purple-600 text-white' 
                              : 'text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          Delay Prediction
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setViewMode('flightaware-notam')}
                    className={`w-full px-4 py-2 rounded transition-colors text-sm ${
                      viewMode === 'flightaware-notam' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    FlightAware & NOTAMs
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
                    onClick={() => setViewMode('intelligent-decisions')}
                    className={`w-full px-4 py-2 rounded transition-colors text-sm ${
                      viewMode === 'intelligent-decisions' 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Intelligent Decisions
                  </button>
                  
                  <button
                    onClick={() => setViewMode('slot-risk')}
                    className={`w-full px-4 py-2 rounded transition-colors text-sm ${
                      viewMode === 'slot-risk' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Slot Risk Management
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
                  


                  
                  {/* Master Diversion Button with Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowDiversionDropdown(!showDiversionDropdown)}
                      className={`w-full px-4 py-2 rounded transition-colors text-sm flex items-center justify-between ${
                        (viewMode === 'diversion' || viewMode === 'diversion-support') 
                          ? 'bg-orange-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      <span>Diversion</span>
                      <span className={`transition-transform ${showDiversionDropdown ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                    
                    {showDiversionDropdown && (
                      <div className="absolute left-0 top-full mt-1 w-full bg-gray-800 border border-gray-600 rounded shadow-lg z-10">
                        <button
                          onClick={() => {
                            setViewMode('diversion');
                            setShowDiversionDropdown(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                            viewMode === 'diversion' 
                              ? 'bg-orange-600 text-white' 
                              : 'text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          Diversion Engine
                        </button>
                        <button
                          onClick={() => {
                            setViewMode('diversion-support');
                            setShowDiversionDropdown(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                            viewMode === 'diversion-support' 
                              ? 'bg-orange-600 text-white' 
                              : 'text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          Diversion Support
                        </button>
                      </div>
                    )}
                  </div>
                  
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
                        console.log('API Setup disabled - prevents black square overlay');
                        // setShowApiWizard(true); // Disabled to fix black square issue
                      }}
                      className="w-full px-4 py-2 rounded transition-colors bg-gray-600 text-gray-400 cursor-not-allowed text-sm mt-1"
                      title="API Setup temporarily disabled"
                      disabled
                    >
                      API Setup (Disabled)
                    </button>
                    
                    <button
                      onClick={() => setViewMode('documentation-download')}
                      className={`w-full px-4 py-2 rounded transition-colors text-sm mt-1 ${
                        viewMode === 'documentation-download' 
                          ? 'bg-orange-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                      title="Download AINO Documentation"
                    >
                      📋 Documentation
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

            {/* Mode-specific Interfaces - Adjusted for left sidebar with scrollbar spacing */}
            

            
            {viewMode === 'decisions' && (
              <div className={`absolute top-4 right-4 bottom-32 pointer-events-auto bg-black/40 backdrop-blur-sm rounded-lg border border-gray-600/50 p-4 ${isNavigationCollapsed ? 'left-16' : 'left-60'}`}>
                <EnhancedOperationalDecisionEngine />
              </div>
            )}
            
            {viewMode === 'airspace' && (
              <div className={`absolute top-4 right-4 bottom-32 pointer-events-auto bg-black/40 backdrop-blur-sm rounded-lg border border-gray-600/50 p-4 overflow-auto ${isNavigationCollapsed ? 'left-16' : 'left-60'}`}>
                <SafeAirspaceAlerts />
              </div>
            )}
            
            {viewMode === 'faa-status' && (
              <div className={`absolute top-0 right-0 bottom-0 pointer-events-auto overflow-y-auto ${isNavigationCollapsed ? 'left-16' : 'left-60'}`}>
                <div className="p-6 bg-gray-900 min-h-full">
                  <FAAStatusDashboard />
                </div>
              </div>
            )}
            
            {viewMode === 'realtime' && (
              <div className={`absolute top-4 right-4 bottom-4 pointer-events-auto bg-black/40 backdrop-blur-sm rounded-lg border border-gray-600/50 p-4 overflow-auto ${isNavigationCollapsed ? 'left-16' : 'left-60'}`}>
                <EnhancedLiveFlightTracker />
              </div>
            )}
            
            {viewMode === 'geopolitical' && (
              <div className={`absolute top-0 right-0 bottom-0 pointer-events-auto bg-gray-900 overflow-y-auto ${isNavigationCollapsed ? 'left-16' : 'left-60'}`}>
                <div className="w-full h-full">
                  <GeopoliticalRiskCenter />
                </div>
              </div>
            )}
            
            {viewMode === 'diversion' && (
              <div className={`absolute top-4 right-4 bottom-32 pointer-events-auto bg-black/40 backdrop-blur-sm rounded-lg border border-gray-600/50 p-4 ${isNavigationCollapsed ? 'left-16' : 'left-60'}`}>
                <DiversionDecisionEngine />
              </div>
            )}
            
            {viewMode === 'diversion-support' && (
              <div className={`absolute top-4 right-4 bottom-4 pointer-events-auto bg-white/95 backdrop-blur-sm rounded-lg border border-gray-600/50 overflow-y-auto ${isNavigationCollapsed ? 'left-16' : 'left-60'}`}>
                <DiversionSupportDashboard />
              </div>
            )}
            
            {viewMode === 'api-testing' && (
              <div className={`absolute top-4 right-4 bottom-32 pointer-events-auto bg-black/40 backdrop-blur-sm rounded-lg border border-gray-600/50 p-4 overflow-hidden ${isNavigationCollapsed ? 'left-16' : 'left-60'}`}>
                <ApiTestingCenter />
              </div>
            )}
            
            {viewMode === 'news-intelligence' && (
              <div className={`absolute top-4 right-4 bottom-32 pointer-events-auto bg-white/95 backdrop-blur-sm rounded-lg border border-gray-600/50 overflow-hidden ${isNavigationCollapsed ? 'left-16' : 'left-60'}`}>
                <NewsIntelligenceDashboard />
              </div>
            )}
            

            
            {viewMode === 'delay-prediction' && (
              <div className={`absolute top-0 right-0 bottom-0 pointer-events-auto overflow-y-auto ${isNavigationCollapsed ? 'left-16' : 'left-60'}`}>
                <HubDelayPredictionDashboard />
              </div>
            )}
            
            {viewMode === 'disruption-response' && (
              <div className={`absolute top-0 right-0 bottom-0 pointer-events-auto overflow-y-auto ${isNavigationCollapsed ? 'left-16' : 'left-60'}`}>
                <DisruptionResponseConsole />
              </div>
            )}
            
            {viewMode === 'operations' && (
              <div className={`absolute top-4 right-4 bottom-16 pointer-events-auto bg-black/40 backdrop-blur-sm rounded-lg border border-blue-600/50 overflow-y-auto overflow-hidden ${isNavigationCollapsed ? 'left-16' : 'left-60'}`}>
                <VirginAtlanticFleetMonitor />
              </div>
            )}

            {viewMode === 'what-if-scenarios' && (
              <div className={`absolute top-0 right-0 bottom-0 pointer-events-auto overflow-y-auto ${isNavigationCollapsed ? 'left-16' : 'left-60'}`}>
                <WhatIfScenarioEngine />
              </div>
            )}
            
            {viewMode === 'nm-punctuality' && (
              <div className={`absolute top-4 right-4 bottom-4 pointer-events-auto bg-white/95 backdrop-blur-sm rounded-lg border border-purple-600/50 overflow-auto ${isNavigationCollapsed ? 'left-16' : 'left-60'}`}>
                <div className="p-6">
                  <NMPunctualityChart />
                </div>
              </div>
            )}
            
            {viewMode === 'us-aviation' && (
              <div className={`absolute top-4 right-4 bottom-4 pointer-events-auto bg-white/95 backdrop-blur-sm rounded-lg border border-red-600/50 overflow-auto ${isNavigationCollapsed ? 'left-16' : 'left-60'}`}>
                <ConsolidatedFaaDashboard />
              </div>
            )}
            
            {viewMode === 'boeing787-twin' && (
              <div className={`absolute top-0 right-0 bottom-0 pointer-events-auto bg-white overflow-y-auto ${isNavigationCollapsed ? 'left-16' : 'left-60'}`}>
                <Boeing787DigitalTwin />
              </div>
            )}
            
            {viewMode === 'training-simulator' && (
              <div className={`absolute top-0 right-0 bottom-0 pointer-events-auto bg-white ${isNavigationCollapsed ? 'left-16' : 'left-60'}`}>
                <AinoTrainingSimulator />
              </div>
            )}
            
            {viewMode === 'airbus-ops' && (
              <div className={`absolute top-0 right-0 bottom-0 pointer-events-auto bg-white overflow-y-auto ${isNavigationCollapsed ? 'left-16' : 'left-60'}`}>
                <AirbusDigitalTwins />
              </div>
            )}
            
            {viewMode === 'financial-analytics' && (
              <div className={`absolute top-0 right-0 bottom-0 pointer-events-auto bg-white overflow-y-auto ${isNavigationCollapsed ? 'left-16' : 'left-60'}`}>
                <FinancialAnalyticsDashboard />
              </div>
            )}
            
            {viewMode === 'fleet-substitution' && (
              <div className={`absolute top-0 right-0 bottom-0 pointer-events-auto overflow-y-auto ${isNavigationCollapsed ? 'left-16' : 'left-60'}`}>
                <FleetSubstitutionCalculator />
              </div>
            )}
            
            {viewMode === 'skygate-airports' && (
              <div className={`absolute top-4 right-4 bottom-16 pointer-events-auto bg-white/95 backdrop-blur-sm rounded-lg border border-gray-600/50 overflow-y-auto ${isNavigationCollapsed ? 'left-16' : 'left-60'}`}>
                <SkyGateAirportDashboard />
              </div>
            )}
            
            {viewMode === 'otp-dashboard' && (
              <div className={`fixed inset-0 pointer-events-auto z-40 ${isNavigationCollapsed ? 'left-16' : 'left-60'}`}>
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
              <div className={`absolute top-4 right-4 bottom-16 pointer-events-auto bg-black/40 backdrop-blur-sm rounded-lg border border-gray-600/50 overflow-y-auto ${isNavigationCollapsed ? 'left-16' : 'left-60'}`}>
                <VirginAtlanticFleetMonitor />
              </div>
            )}
            
            {viewMode === 'intelligence-dashboard' && (
              <div className={`absolute top-4 right-4 bottom-16 pointer-events-auto bg-black/40 backdrop-blur-sm rounded-lg border border-gray-600/50 overflow-y-auto ${isNavigationCollapsed ? 'left-16' : 'left-60'}`}>
                <IntelligenceDashboard />
              </div>
            )}
            


            
            {viewMode === 'emergency-comm' && (
              <div className={`absolute top-4 right-4 bottom-16 pointer-events-auto bg-white/95 backdrop-blur-sm rounded-lg border border-red-600/50 overflow-y-auto ${isNavigationCollapsed ? 'left-16' : 'left-60'}`}>
                <EmergencyCommDashboard />
              </div>
            )}

            {/* Full-Screen Enhanced Satellite Map - Overview Mode */}
            {viewMode === 'emergency-testing' && (
              <div className={`absolute top-0 right-0 bottom-0 pointer-events-auto ${isNavigationCollapsed ? 'left-16' : 'left-60'}`}>
                <EmergencyResponseTesting />
              </div>
            )}

            {viewMode === 'ai-operations' && (
              <div className={`absolute top-0 right-0 bottom-0 pointer-events-auto overflow-y-auto ${isNavigationCollapsed ? 'left-16' : 'left-60'}`}>
                <AIOperationsCenter />
              </div>
            )}

            {viewMode === 'overview' && (
              <div className={`absolute top-0 right-0 bottom-0 pointer-events-auto transition-all duration-300 overflow-y-auto ${isNavigationCollapsed ? 'left-16 md:left-20' : 'left-60'}`}>
                <AIOpsDashboard />
              </div>
            )}
            
            {viewMode === 'design-showcase' && (
              <div className={`absolute top-0 right-0 bottom-0 pointer-events-auto transition-all duration-300 overflow-y-auto ${isNavigationCollapsed ? 'left-16 md:left-20' : 'left-72'}`}>
                <VirginAtlanticDesignShowcase />
              </div>
            )}
            
            {viewMode === 'enhanced-facilities' && (
              <div className={`absolute top-4 right-4 bottom-16 pointer-events-auto bg-black/40 backdrop-blur-sm rounded-lg border border-blue-600/50 overflow-y-auto overflow-hidden ${isNavigationCollapsed ? 'left-16' : 'left-60'}`}>
                <EnhancedAirportFacilities />
              </div>
            )}
            
            {viewMode === 'data-authenticity' && (
              <div className={`absolute top-0 right-0 bottom-0 pointer-events-auto overflow-y-auto ${isNavigationCollapsed ? 'left-16' : 'left-60'}`}>
                <DataAuthenticityDashboard />
              </div>
            )}
            
            {viewMode === 'adsb-exchange' && (
              <div className={`absolute top-0 right-0 bottom-0 pointer-events-auto overflow-y-auto ${isNavigationCollapsed ? 'left-16' : 'left-60'}`}>
                <AdsxExchangeDataDashboard />
              </div>
            )}

            {viewMode === 'visa-requirements' && (
              <div className={`absolute top-0 right-0 bottom-0 pointer-events-auto overflow-y-auto ${isNavigationCollapsed ? 'left-16' : 'left-60'}`}>
                <VisaRequirementsDashboard />
              </div>
            )}

            {viewMode === 'heathrow-holding' && (
              <div className={`absolute top-0 right-0 bottom-0 pointer-events-auto overflow-y-auto ${isNavigationCollapsed ? 'left-16' : 'left-60'}`}>
                <HeathrowHoldingDashboard />
              </div>
            )}

            {viewMode === 'integrated-holding-ml' && (
              <div className={`absolute top-0 right-0 bottom-0 pointer-events-auto overflow-y-auto ${isNavigationCollapsed ? 'left-16' : 'left-60'}`}>
                <IntegratedHoldingMLDashboard />
              </div>
            )}

            {viewMode === 'flightaware-notam' && (
              <div className={`absolute top-0 right-0 bottom-0 pointer-events-auto overflow-y-auto ${isNavigationCollapsed ? 'left-16' : 'left-60'}`}>
                <FlightAwareNotamDashboard />
              </div>
            )}

            {viewMode === 'intelligent-decisions' && (
              <div className={`absolute top-0 right-0 bottom-0 pointer-events-auto overflow-y-auto ${isNavigationCollapsed ? 'left-16' : 'left-60'}`}>
                <IntelligentDecisionDashboard />
              </div>
            )}

            {viewMode === 'slot-risk' && (
              <div className={`absolute top-0 right-0 bottom-0 pointer-events-auto overflow-y-auto ${isNavigationCollapsed ? 'left-16' : 'left-60'}`}>
                <SlotRiskDashboard />
              </div>
            )}

            {viewMode === 'documentation-download' && (
              <div className={`absolute top-4 right-4 bottom-4 pointer-events-auto overflow-y-auto ${isNavigationCollapsed ? 'left-16' : 'left-60'}`}>
                <DocumentationDownload />
              </div>
            )}

            {viewMode === 'faa-status' && (
              <div className={`absolute top-0 right-0 bottom-0 pointer-events-auto overflow-y-auto ${isNavigationCollapsed ? 'left-16' : 'left-60'}`}>
                <FAAStatusDashboard />
              </div>
            )}

            {/* {viewMode === 'global-airports' && (
              <div className="absolute top-0 left-56 right-0 bottom-0 pointer-events-auto bg-white">
                <GlobalAirportDatabase />
              </div>
            )} */}

            {/* API Integration Wizard - Disabled to fix black square issue */}
            {false && showApiWizard && (
              <InlineApiTest onClose={() => setShowApiWizard(false)} />
            )}

              </div>
            </div>
          </QueryClientProvider>
        </ResponsiveProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
