import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@fontsource/inter";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import MobileFallback from "./components/MobileFallback";
import { ResponsiveProvider } from "./contexts/ResponsiveContext";
import { ToastProvider } from "./contexts/ToastContext";
import { AppRouter } from "./components/AppRouter";
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
import AIOperationsCenter from "./components/AIOperationsCenter";
import DisruptionResponseConsole from "./components/DisruptionResponseConsole";
import WhatIfScenarioEngine from "./components/WhatIfScenarioEngine";
import EnhancedAirportFacilities from "./components/EnhancedAirportFacilities";
import DataAuthenticityDashboard from "./components/DataAuthenticityDashboard";
import EnhancedNetworkOTPDashboard from "./components/EnhancedNetworkOTPDashboard";
import VisaRequirementsDashboard from "./components/VisaRequirementsDashboard";
import IntelligentDecisionDashboard from "./components/IntelligentDecisionDashboard";
import SlotRiskDashboard from "./components/SlotRiskDashboard";

// Import Virgin Atlantic theme
import "./styles/virgin-atlantic-theme.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

type ViewMode = 'operations' | 'decisions' | 'overview' | 'map' | 'airspace' | 'realtime' | 'geopolitical' | 'diversion' | 'diversion-support' | 'delay-prediction' | 'disruption-response' | 'what-if-scenarios' | 'nm-punctuality' | 'us-aviation' | 'api-testing' | 'news-intelligence' | 'airport-weather' | 'satellite' | 'boeing787-twin' | 'training-simulator' | 'airbus-ops' | 'financial-analytics' | 'fleet-substitution' | 'skygate-airports' | 'emergency-comm' | 'otp-dashboard' | 'fleet-monitor' | 'intelligence-dashboard' | '3d-globe' | 'emergency-testing' | 'airport-contacts' | 'enhanced-facilities' | 'data-authenticity' | 'visa-requirements' | 'heathrow-holding' | 'integrated-holding-ml' | 'flightaware-notam' | 'intelligent-decisions' | 'slot-risk' | 'faa-status' | 'design-showcase' | 'scenario-engine' | 'boeing-twin' | 'airbus-twins' | 'ai-operations' | 'adsb-exchange' | 'documentation-download';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('ai-operations');
  const [isNavigationCollapsed, setIsNavigationCollapsed] = useState(false);
  const [showApiWizard, setShowApiWizard] = useState(false);

  // Check for mobile devices
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = ['mobile', 'android', 'iphone', 'ipod', 'ipad', 'blackberry', 'windows phone'];
      const isMobileDevice = mobileKeywords.some(keyword => userAgent.includes(keyword)) || window.innerWidth < 768;
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return <MobileFallback />;
  }

  const renderMainContent = () => {
    switch (viewMode) {
      case 'design-showcase':
        return <VirginAtlanticDesignShowcase />;
      case 'overview':
        return <MetricsDisplay />;
      case 'operations':
        return <EnhancedOperationalDecisionEngine />;
      case 'realtime':
        return <EnhancedLiveFlightTracker />;
      case 'map':
        return <ProfessionalSatelliteMap />;
      case 'airspace':
        return <SafeAirspaceAlerts />;
      case 'geopolitical':
        return <GeopoliticalRiskCenter />;
      case 'diversion':
        return <DiversionDecisionEngine />;
      case 'diversion-support':
        return <DiversionSupportDashboard />;
      case 'delay-prediction':
        return <DelayPredictionDashboard />;
      case 'disruption-response':
        return <DisruptionResponseConsole />;
      case 'what-if-scenarios':
        return <WhatIfScenarioEngine />;
      case 'nm-punctuality':
        return <NMPunctualityChart />;
      case 'us-aviation':
        return <RealTimeOperationsCenter />;
      case 'api-testing':
        return <ApiTestingCenter />;
      case 'news-intelligence':
        return <NewsIntelligenceDashboard />;
      case 'boeing787-twin':
        return <Boeing787DigitalTwin />;
      case 'training-simulator':
        return <AinoTrainingSimulator />;
      case 'airbus-ops':
        return <AirbusOperationsCenter />;
      case 'financial-analytics':
        return <FinancialAnalyticsDashboard />;
      case 'fleet-substitution':
        return <FleetSubstitutionCalculator />;
      case 'skygate-airports':
        return <SkyGateAirportDashboard />;
      case 'emergency-comm':
        return <EmergencyCommDashboard />;
      case 'otp-dashboard':
        return <EnhancedNetworkOTPDashboard />;
      case 'fleet-monitor':
        return <VirginAtlanticFleetMonitor />;
      case 'intelligence-dashboard':
        return <IntelligenceDashboard />;
      case 'emergency-testing':
        return <EmergencyResponseTesting />;
      case 'airport-contacts':
        return <AirportContactDashboard />;
      case 'enhanced-facilities':
        return <EnhancedAirportFacilities />;
      case 'data-authenticity':
        return <DataAuthenticityDashboard />;
      case 'visa-requirements':
        return <VisaRequirementsDashboard />;
      case 'heathrow-holding':
        return <HubDelayPredictionDashboard />;
      case 'intelligent-decisions':
        return <IntelligentDecisionDashboard />;
      case 'slot-risk':
        return <SlotRiskDashboard />;
      case 'faa-status':
        return <ConsolidatedFaaDashboard />;
      case 'scenario-engine':
        return <ScenarioManager onEmergencyActivate={() => {}} />;
      case 'ai-operations':
        return <AIOperationsCenter />;
      case 'boeing-twin':
        return <Boeing787DigitalTwin />;
      case 'airbus-twins':
        return <AirbusDigitalTwins />;
      default:
        return <MetricsDisplay />;
    }
  };

  return (
    <ErrorBoundary>
      <ToastProvider>
        <ResponsiveProvider>
          <QueryClientProvider client={queryClient}>
            <div className="w-full min-h-screen bg-white flex">
              {/* Virgin Atlantic Navigation */}
              <VirginAtlanticNavigation
                viewMode={viewMode}
                setViewMode={(mode) => setViewMode(mode as ViewMode)}
                isNavigationCollapsed={isNavigationCollapsed}
                setIsNavigationCollapsed={setIsNavigationCollapsed}
              />
              
              {/* Main Content Area */}
              <div className={`flex-1 transition-all duration-300 ${!isNavigationCollapsed ? 'ml-4' : 'ml-4'}`}>
                <div className="va-glass-panel min-h-screen m-4 rounded-lg p-6">
                  {renderMainContent()}
                </div>
              </div>

              {/* API Integration Wizard - Disabled to fix black square issue */}
              {false && showApiWizard && (
                <InlineApiTest onClose={() => setShowApiWizard(false)} />
              )}
            </div>
          </QueryClientProvider>
        </ResponsiveProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
