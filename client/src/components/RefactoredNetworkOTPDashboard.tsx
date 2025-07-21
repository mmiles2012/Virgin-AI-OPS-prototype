import React, { useState, useEffect } from 'react';
import { NetworkHeader, NetworkStatsBar } from './NetworkDashboard/NetworkHeader';
import { useVirginAtlanticFlights } from '../hooks/useVirginAtlanticFlights';
import { useHistoricalDelayData } from '../hooks/useHistoricalDelayData';
import { useAirportContacts } from '../hooks/useAirportContacts';
import { generateNetworkAlerts, generateDetailedMetrics } from '../utils/networkAnalytics';

export default function RefactoredNetworkOTPDashboard() {
  // Use custom hooks for data management
  const { flights, loading: flightsLoading } = useVirginAtlanticFlights();
  const { delayData, loading: delayLoading } = useHistoricalDelayData();
  const { contacts, loading: contactsLoading } = useAirportContacts();

  // Simplified state management
  const [networkView, setNetworkView] = useState<'overview' | 'detailed' | 'analysis'>('overview');
  const [networkAlertStatus, setNetworkAlertStatus] = useState<'stable' | 'minor' | 'alert'>('stable');

  // Loading state
  const isLoading = flightsLoading || delayLoading || contactsLoading;

  // Calculate network metrics
  const networkMetrics = React.useMemo(() => {
    if (!flights.length || !delayData.length) {
      return {
        totalFlights: 0,
        delayRate: 0,
        avgDelay: 0,
        hubCount: 0
      };
    }

    // Simplified metrics calculation
    const totalFlights = flights.length;
    const delayedFlights = Math.floor(totalFlights * 0.15); // Mock calculation
    const delayRate = (delayedFlights / totalFlights) * 100;
    const avgDelay = 12; // Mock average
    const hubCount = 8; // Virgin Atlantic hub count

    return {
      totalFlights,
      delayRate,
      avgDelay,
      hubCount
    };
  }, [flights, delayData]);

  // Update alert status based on metrics
  useEffect(() => {
    const { delayRate } = networkMetrics;
    
    if (delayRate > 25) {
      setNetworkAlertStatus('alert');
    } else if (delayRate > 10) {
      setNetworkAlertStatus('minor');
    } else {
      setNetworkAlertStatus('stable');
    }
  }, [networkMetrics]);

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aero-blue-primary/30 mx-auto mb-4"></div>
          <div className="text-muted-foreground">Loading network performance data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 text-gray-900 min-h-screen">
      {/* Header Section */}
      <NetworkHeader
        networkAlertStatus={networkAlertStatus}
        totalFlights={networkMetrics.totalFlights}
        delayRate={networkMetrics.delayRate}
        avgDelay={networkMetrics.avgDelay}
        hubCount={networkMetrics.hubCount}
      />

      {/* Stats Bar */}
      <NetworkStatsBar
        totalFlights={networkMetrics.totalFlights}
        delayRate={networkMetrics.delayRate}
        avgDelay={networkMetrics.avgDelay}
        hubCount={networkMetrics.hubCount}
      />

      {/* Main Content Area */}
      <div className="p-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Network Overview</h3>
          
          {/* View Toggle */}
          <div className="flex gap-2 mb-6">
            {['overview', 'detailed', 'analysis'].map((view) => (
              <button
                key={view}
                onClick={() => setNetworkView(view as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  networkView === view
                    ? 'bg-aero-blue-primary text-foreground'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>

          {/* Content Based on View */}
          {networkView === 'overview' && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Network operating normally with {networkMetrics.totalFlights} flights monitored 
                across {networkMetrics.hubCount} hubs.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-green-700 font-semibold">On Time</div>
                  <div className="text-2xl font-bold text-green-800">
                    {(100 - networkMetrics.delayRate).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-yellow-700 font-semibold">Minor Delays</div>
                  <div className="text-2xl font-bold text-yellow-800">
                    {(networkMetrics.delayRate * 0.7).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="text-orange-700 font-semibold">Major Delays</div>
                  <div className="text-2xl font-bold text-orange-800">
                    {(networkMetrics.delayRate * 0.3).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-blue-700 font-semibold">Avg Delay</div>
                  <div className="text-2xl font-bold text-blue-800">
                    {networkMetrics.avgDelay}min
                  </div>
                </div>
              </div>
            </div>
          )}

          {networkView === 'detailed' && (
            <div className="space-y-4">
              <p className="text-muted-foreground">Detailed hub-by-hub performance analysis.</p>
              <div className="text-center py-8 text-foreground0">
                Detailed view implementation in progress...
              </div>
            </div>
          )}

          {networkView === 'analysis' && (
            <div className="space-y-4">
              <p className="text-muted-foreground">Advanced analytics and delay pattern analysis.</p>
              <div className="text-center py-8 text-foreground0">
                Analytics view implementation in progress...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
