import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import VirginAtlanticNavigation from './VirginAtlanticNavigation';
import MissionControlDashboard from './MissionControlDashboard';
import AIOpsDashboard from "./AIOpsDashboard";
import AIOperationsCenter from './AIOperationsCenter';
import EnhancedFlightDashboard from './EnhancedFlightDashboard';
import RealTimeOperationsCenter from './RealTimeOperationsCenter';
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
        
        <div className="flex-1 transition-all duration-300 overflow-y-auto">
          <Routes>
            {/* Default route - show Mission Control Dashboard */}
            <Route path="/" element={<MissionControlDashboard />} />
            
            {/* Core Operations */}
            <Route path="/mission-control" element={<MissionControlDashboard />} />
            <Route path="/fleet-operations" element={<VirginAtlanticFleetMonitor />} />
            <Route path="/realtime-ops" element={<RealTimeOperationsCenter />} />
            <Route path="/network-performance" element={<OnTimePerformanceDashboard />} />
            
            {/* Flight Detail Pages */}
            <Route path="/flight/:flightNumber" element={<EnhancedFlightDashboard />} />
            
            {/* Detail Pages */}
            <Route path="/notams" element={<FlightAwareNotamDashboard />} />
            <Route path="/weather" element={<FAAStatusDashboard />} />
            <Route path="/hub-status" element={<SkyGateAirportDashboard />} />
            
            {/* New Feature Pages */}
            <Route path="/diversion-planner" element={<DiversionSupportDashboard />} />
            <Route path="/crew-resourcing" element={<AIOperationsCenter />} />
            <Route path="/active-diversions" element={<DiversionSupportDashboard />} />
            
            {/* Intelligence & Analysis */}
            <Route path="/intelligence" element={<IntelligentDecisionDashboard />} />
            <Route path="/risk-assessment" element={<GeopoliticalRiskCenter />} />
            <Route path="/visa-requirements" element={<VisaRequirementsDashboard />} />
            
            {/* AI & Analytics */}
            <Route path="/ai-operations" element={<AIOperationsCenter />} />
            <Route path="/scenario-engine" element={<WhatIfScenarioEngine />} />
            <Route path="/delay-prediction" element={<DelayPredictionDashboard />} />
            
            {/* Digital Twins */}
            <Route path="/digital-twins/boeing" element={<Boeing787DigitalTwin />} />
            <Route path="/digital-twins/airbus" element={<AirbusDigitalTwins />} />
            
            {/* Emergency Response */}
            <Route path="/emergency" element={<EmergencyCommDashboard />} />
            
            {/* Legacy routes - redirect to new structure */}
            <Route path="/overview" element={<Navigate to="/mission-control" replace />} />
            <Route path="/operations" element={<Navigate to="/fleet-operations" replace />} />
            <Route path="/ai-ops-dashboard" element={<AIOpsDashboard />} />
            
            {/* Fallback - redirect to Mission Control */}
            <Route path="*" element={<Navigate to="/mission-control" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
};
