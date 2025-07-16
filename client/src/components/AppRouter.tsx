import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import VirginAtlanticNavigation from './VirginAtlanticNavigation';
import AIOperationsCenter from './AIOperationsCenter';
import VirginAtlanticDesignShowcase from './VirginAtlanticDesignShowcase';
import HeathrowHoldingDashboard from './HeathrowHoldingDashboard';
import EnhancedFlightDashboard from './EnhancedFlightDashboard';
import RealTimeOperationsCenter from './RealTimeOperationsCenter';
import PassengerImpactModelingComponent from './PassengerImpactModelingComponent';
import HeathrowHoldingMonitor from './HeathrowHoldingMonitor';

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
            {/* Default route - redirect to AI Operations Center */}
            <Route path="/" element={<Navigate to="/ai-operations" replace />} />
            
            {/* Core Operations */}
            <Route path="/ai-operations" element={<AIOperationsCenter />} />
            <Route path="/operations-center" element={<RealTimeOperationsCenter />} />
            <Route path="/enhanced-flight" element={<EnhancedFlightDashboard />} />
            
            {/* Heathrow Operations */}
            <Route path="/heathrow-holding" element={<HeathrowHoldingDashboard />} />
            <Route path="/heathrow-monitor" element={<HeathrowHoldingMonitor />} />
            
            {/* Passenger Services */}
            <Route path="/passenger-impact" element={<PassengerImpactModelingComponent />} />
            
            {/* Design & Documentation */}
            <Route path="/design-showcase" element={<VirginAtlanticDesignShowcase />} />
            
            {/* Fallback - redirect to AI Operations */}
            <Route path="*" element={<Navigate to="/ai-operations" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
};
