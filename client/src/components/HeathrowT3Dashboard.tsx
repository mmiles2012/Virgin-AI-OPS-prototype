import React, { useState, useEffect } from 'react';
import { Plane, Clock, AlertTriangle, BarChart3, Zap, Users, Activity, UserCheck, MapPin } from 'lucide-react';

interface HeathrowConnectionRisk {
  inbound: string;
  outbound: string;
  connect_min: number;
  stand_in: string;
  stand_out: string;
  predicted_delay: number;
  risk_level: 'high' | 'medium' | 'low';
}

interface HeathrowStandAllocation {
  flight: string;
  current_stand: string;
  recommended_stand: string;
  reason: string;
  confidence: number;
}

interface PassengerConnectionData {
  passenger_id: string;
  name: string;
  route: string;
  alliance_status: string;
  connection_flights: Array<{
    flight_number: string;
    airline: string;
    route: string;
    terminal: string;
    aircraft_type: string;
    real_time_status: {
      flight_id: string;
      current_status: string;
      delay_minutes: number;
      gate?: string;
      last_updated: string;
    };
  }>;
}

interface PassengerAlert {
  type: string;
  passenger_id: string;
  passenger_name: string;
  risk_level: 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL';
  timestamp: string;
  arriving_flight?: string;
  departing_flight?: string;
  flight?: string;
  delay_minutes?: number;
  connection_time?: string;
}

interface HeathrowT3Status {
  active_flights: number;
  connection_risks: HeathrowConnectionRisk[];
  stand_allocations: HeathrowStandAllocation[];
  model_status: {
    delay_model: 'active' | 'training' | 'inactive';
    stand_model: 'active' | 'training' | 'inactive';
  };
  last_update: string;
}

const HeathrowT3Dashboard: React.FC = () => {
  const [status, setStatus] = useState<HeathrowT3Status | null>(null);
  const [passengerData, setPassengerData] = useState<PassengerConnectionData[]>([]);
  const [passengerAlerts, setPassengerAlerts] = useState<PassengerAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'connections' | 'passengers' | 'alerts'>('connections');

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Fetch Heathrow T3 status
        const statusResponse = await fetch('/api/heathrow/status');
        const statusData = await statusResponse.json();
        
        if (statusData.success) {
          setStatus(statusData.data);
        }

        // Fetch passenger connection data
        const passengerResponse = await fetch('/api/passengers/connection-report');
        const passengerConnectionData = await passengerResponse.json();
        
        if (passengerConnectionData.success) {
          // Fetch individual passenger details
          const passengers = [];
          const passengerIds = ['PAX001', 'PAX002', 'PAX003', 'PAX004', 'PAX005']; // All passenger IDs
          
          for (const id of passengerIds) {
            try {
              const passengerDetailResponse = await fetch(`/api/passengers/${id}/status`);
              const passengerDetail = await passengerDetailResponse.json();
              if (passengerDetail.success) {
                passengers.push(passengerDetail.data);
              }
            } catch (err) {
              console.warn(`Failed to fetch passenger ${id}:`, err);
            }
          }
          
          setPassengerData(passengers);
        }

        // Fetch passenger alerts
        const alertsResponse = await fetch('/api/passengers/alerts');
        const alertsData = await alertsResponse.json();
        
        if (alertsData.success) {
          setPassengerAlerts(alertsData.data.alerts);
        }

        setError(null);
      } catch (err) {
        setError('Network error fetching Heathrow T3 data');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
    const interval = setInterval(fetchAllData, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-va-green bg-va-green/10';
      default: return 'text-va-gray bg-va-gray/10';
    }
  };

  const getModelStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-va-green bg-va-green/20';
      case 'training': return 'text-va-blue bg-va-blue/20';
      case 'inactive': return 'text-va-red bg-va-red/20';
      default: return 'text-va-gray bg-va-gray/20';
    }
  };

  const getConnectionRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-va-red bg-va-red/10';
      case 'medium': return 'text-va-amber bg-va-amber/10';
      case 'low': return 'text-va-green bg-va-green/10';
      default: return 'text-va-gray bg-va-gray/10';
    }
  };

  const renderConnectionsTab = () => {
    if (!status) return null;
    
    return (
      <>
        {/* Connection Risks Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 text-orange-600 mr-2" />
            Connection Risk Analysis
          </h3>
          
          {status.connection_risks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p>No tight connections detected</p>
              <p className="text-sm">All connections meet minimum time requirements</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Connection
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Connection Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stands
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Predicted Delay
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Level
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {status.connection_risks.map((risk, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{risk.inbound}</span>
                          <span className="text-sm text-gray-500">→ {risk.outbound}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{risk.connect_min} min</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-900">{risk.stand_in}</span>
                          <span className="text-sm text-gray-500">→ {risk.stand_out}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">+{risk.predicted_delay} min</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(risk.risk_level)}`}>
                          {risk.risk_level.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ML Stand Allocations Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 text-green-600 mr-2" />
            ML-Optimized Stand Allocations
          </h3>
          
          {status.stand_allocations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p>No optimization recommendations</p>
              <p className="text-sm">Current stand allocations are optimal</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Flight
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Stand
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recommended Stand
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Confidence
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {status.stand_allocations.map((allocation, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{allocation.flight}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{allocation.current_stand}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-green-600">{allocation.recommended_stand}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 capitalize">{allocation.reason.replace('_', ' ')}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${allocation.confidence * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-900">{Math.round(allocation.confidence * 100)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>
    );
  };

  const renderPassengersTab = () => {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <UserCheck className="h-5 w-5 text-blue-600 mr-2" />
          Passenger Connection Tracking
        </h3>
        
        {passengerData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <UserCheck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p>No passengers currently being tracked</p>
            <p className="text-sm">Connection monitoring system ready</p>
          </div>
        ) : (
          <div className="space-y-6">
            {passengerData.map((passenger) => (
              <div key={passenger.passenger_id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{passenger.name}</h4>
                    <p className="text-sm text-gray-600">{passenger.route}</p>
                    <p className="text-sm text-blue-600 font-medium">{passenger.alliance_status}</p>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getConnectionRiskColor('low')}`}>
                    ACTIVE
                  </span>
                </div>
                
                <div className="space-y-3">
                  <h5 className="text-sm font-medium text-gray-700">Connection Flights:</h5>
                  {passenger.connection_flights.map((flight, flightIndex) => (
                    <div key={flightIndex} className="bg-va-gray/5 rounded p-3 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <span className="text-sm font-medium text-va-gray">{flight.flight_number}</span>
                          <span className="text-sm text-va-gray ml-2">({flight.airline})</span>
                        </div>
                        <div className="text-sm text-va-gray">
                          {flight.route}
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-va-gray" />
                          <span className="text-sm text-va-gray">{flight.terminal}</span>
                          {flight.real_time_status.gate && (
                            <span className="text-sm text-va-gray">Gate {flight.real_time_status.gate}</span>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${
                        flight.real_time_status.current_status === 'On Time' || flight.real_time_status.current_status === 'Departed' ? 'bg-va-green/10 text-va-green' :
                        flight.real_time_status.current_status === 'Delayed' ? 'bg-va-red/10 text-va-red' :
                        'bg-va-amber/10 text-va-amber'
                      }`}>
                        {flight.real_time_status.current_status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderAlertsTab = () => {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
          Passenger Connection Alerts
        </h3>
        
        {passengerAlerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p>No active alerts</p>
            <p className="text-sm">All passenger connections are on track</p>
          </div>
        ) : (
          <div className="space-y-4">
            {passengerAlerts.map((alert, index) => (
              <div key={index} className={`border rounded-lg p-4 ${
                alert.risk_level === 'HIGH' ? 'border-va-red bg-va-red/10' :
                alert.risk_level === 'MEDIUM' ? 'border-va-amber bg-va-amber/10' :
                'border-va-blue bg-va-blue/10'
              }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className={`h-4 w-4 ${
                        alert.risk_level === 'HIGH' ? 'text-va-red' :
                        alert.risk_level === 'MEDIUM' ? 'text-va-amber' :
                        'text-va-blue'
                      }`} />
                      <span className="font-medium text-gray-900">{alert.passenger_name}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        alert.risk_level === 'HIGH' ? 'bg-va-red/10 text-va-red' :
                        alert.risk_level === 'MEDIUM' ? 'bg-va-amber/10 text-va-amber' :
                        'bg-va-blue/10 text-va-blue'
                      }`}>
                        {alert.risk_level} RISK
                      </span>
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                        {alert.type.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1">
                      {alert.arriving_flight && alert.departing_flight && (
                        <p className="text-sm text-gray-600">
                          Connection: {alert.arriving_flight} → {alert.departing_flight}
                        </p>
                      )}
                      {alert.flight && alert.delay_minutes && (
                        <p className="text-sm text-gray-600">
                          Flight {alert.flight} delayed by {alert.delay_minutes} minutes
                        </p>
                      )}
                      {alert.connection_time && (
                        <p className="text-sm text-gray-600">
                          {alert.connection_time}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-lg border">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading Heathrow T3 Connection Management...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
          <h3 className="text-red-800 font-semibold">Heathrow T3 Connection Error</h3>
        </div>
        <p className="text-red-700 mt-2">{error}</p>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <p className="text-gray-600">No Heathrow T3 data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Plane className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-bold text-gray-900">Heathrow T3 Connection Management</h2>
          </div>
          <div className="text-sm text-gray-500">
            Last updated: {status ? new Date(status.last_update).toLocaleTimeString() : 'Loading...'}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'connections'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('connections')}
          >
            <Clock className="h-4 w-4 inline-block mr-2" />
            Flight Connections
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'passengers'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('passengers')}
          >
            <UserCheck className="h-4 w-4 inline-block mr-2" />
            Passenger Tracking ({passengerData.length})
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'alerts'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('alerts')}
          >
            <AlertTriangle className="h-4 w-4 inline-block mr-2" />
            Alerts ({passengerAlerts.length})
          </button>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <Plane className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm text-blue-600 font-medium">Active Flights</p>
                <p className="text-2xl font-bold text-blue-900">{status ? status.active_flights : 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <UserCheck className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm text-green-600 font-medium">Passengers</p>
                <p className="text-2xl font-bold text-green-900">{passengerData.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <div>
                <p className="text-sm text-red-600 font-medium">Connection Risks</p>
                <p className="text-2xl font-bold text-red-900">{status ? status.connection_risks.length : 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-orange-600 mr-2" />
              <div>
                <p className="text-sm text-orange-600 font-medium">Active Alerts</p>
                <p className="text-2xl font-bold text-orange-900">{passengerAlerts.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <Zap className="h-5 w-5 text-purple-600 mr-2" />
              <div>
                <p className="text-sm text-purple-600 font-medium">ML Models</p>
                <div className="flex space-x-1 mt-1">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${status ? getModelStatusColor(status.model_status.delay_model) : 'text-gray-600 bg-gray-100'}`}>
                    Delay
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${status ? getModelStatusColor(status.model_status.stand_model) : 'text-gray-600 bg-gray-100'}`}>
                    Stand
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'connections' && status && (
        <div className="space-y-6">{renderConnectionsTab()}</div>
      )}
      
      {activeTab === 'passengers' && (
        <div className="space-y-6">{renderPassengersTab()}</div>
      )}
      
      {activeTab === 'alerts' && (
        <div className="space-y-6">{renderAlertsTab()}</div>
      )}
    </div>
  );
};

export default HeathrowT3Dashboard;