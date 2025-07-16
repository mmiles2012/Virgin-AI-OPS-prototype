import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import VirginAtlanticNavigation from './VirginAtlanticNavigation';
import AIOpsDashboard from "./AIOpsDashboard";
import AIOperationsCenter from './AIOperationsCenter';
import VirginAtlanticDesignShowcase from './VirginAtlanticDesignShowcase';
import HeathrowHoldingDashboard from './HeathrowHoldingDashboard';
import EnhancedFlightDashboard from './EnhancedFlightDashboard';
import RealTimeOperationsCenter from './RealTimeOperationsCenter';
import PassengerImpactModelingComponent from './PassengerImpactModelingComponent';
import HeathrowHoldingMonitor from './HeathrowHoldingMonitor';
import OnTimePerformanceDashboard from './OnTimePerformanceDashboard';
import IntelligentDecisionDashboard from './IntelligentDecisionDashboard';
import SkyGateAirportDashboard from './SkyGateAirportDashboard';
import GeopoliticalRiskCenter from './GeopoliticalRiskCenter';
import VisaRequirementsDashboard from './VisaRequirementsDashboard';
import FlightAwareNotamDashboard from './FlightAwareNotamDashboard';
import FAAStatusDashboard from './FAAStatusDashboard';
import EmergencyCommDashboard from './EmergencyCommDashboard';
import WhatIfScenarioEngine from './WhatIfScenarioEngine';
import DelayPredictionDashboard from './DelayPredictionDashboard';
import DiversionSupportDashboard from './DiversionSupportDashboard';
import Boeing787DigitalTwin from './Boeing787DigitalTwin';
import AirbusDigitalTwins from './AirbusDigitalTwins';
import AirbusOperationsCenter from './AirbusOperationsCenter';
import FinancialAnalyticsDashboard from './FinancialAnalyticsDashboard';
import FleetSubstitutionCalculator from './FleetSubstitutionCalculator';
import SlotRiskDashboard from './SlotRiskDashboard';
import VirginAtlanticFleetMonitor from './VirginAtlanticFleetMonitor';

interface AppRouterProps {
  isNavigationCollapsed: boolean;
  setIsNavigationCollapsed: (collapsed: boolean) => void;
}

export const AppRouter: React.FC<AppRouterProps> = ({
  isNavigationCollapsed,
  setIsNavigationCollapsed
}) => {
  return (
    <BrowserRouter>
      <div className="va-theme min-h-screen bg-gray-50 text-gray-900 flex">
        <VirginAtlanticNavigation
          isNavigationCollapsed={isNavigationCollapsed}
          setIsNavigationCollapsed={setIsNavigationCollapsed}
        />
        
        <div className="flex-1 transition-all duration-300">
          <Routes>
            {/* Default route - show AI Ops Dashboard */}
            <Route path="/" element={<AIOpsDashboard />} />
            
            {/* Core Operations */}
            <Route path="/overview" element={<AIOpsDashboard />} />
            <Route path="/realtime" element={<RealTimeOperationsCenter />} />
            <Route path="/operations" element={<VirginAtlanticFleetMonitor />} />
            <Route path="/otp-dashboard" element={<OnTimePerformanceDashboard />} />
            
            {/* Intelligence & Analysis */}
            <Route path="/intelligence-dashboard" element={<IntelligentDecisionDashboard />} />
            <Route path="/enhanced-facilities" element={<SkyGateAirportDashboard />} />
            <Route path="/geopolitical" element={<GeopoliticalRiskCenter />} />
            <Route path="/visa-requirements" element={<VisaRequirementsDashboard />} />
            
            {/* Safety & Alerts */}
            <Route path="/airspace" element={<FlightAwareNotamDashboard />} />
            <Route path="/faa-status" element={<FAAStatusDashboard />} />
            <Route path="/emergency-testing" element={<EmergencyCommDashboard />} />
            
            {/* AI & Analytics */}
            <Route path="/ai-operations" element={<AIOperationsCenter />} />
            <Route path="/scenario-engine" element={<WhatIfScenarioEngine />} />
            <Route path="/delay-prediction" element={<DelayPredictionDashboard />} />
            <Route path="/diversion-support" element={<DiversionSupportDashboard />} />
            
            {/* Digital Twins */}
            <Route path="/boeing-twin" element={<Boeing787DigitalTwin />} />
            <Route path="/airbus-twins" element={<AirbusDigitalTwins />} />
            <Route path="/airbus-operations" element={<AirbusOperationsCenter />} />
            
            {/* Financial & Planning */}
            <Route path="/financial-analytics" element={<FinancialAnalyticsDashboard />} />
            <Route path="/fleet-substitution" element={<FleetSubstitutionCalculator />} />
            <Route path="/slot-risk" element={<SlotRiskDashboard />} />
            
            {/* Legacy Routes */}
            <Route path="/operations-center" element={<RealTimeOperationsCenter />} />
            <Route path="/enhanced-flight" element={<EnhancedFlightDashboard />} />
            <Route path="/heathrow-holding" element={<HeathrowHoldingDashboard />} />
            <Route path="/heathrow-monitor" element={<HeathrowHoldingMonitor />} />
            <Route path="/passenger-impact" element={<PassengerImpactModelingComponent />} />
            <Route path="/design-showcase" element={<VirginAtlanticDesignShowcase />} />
            
            {/* Fallback - redirect to AI Operations */}
            <Route path="*" element={<Navigate to="/ai-operations" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
};
