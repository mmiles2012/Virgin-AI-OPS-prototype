import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  Plane,
  Target,
  BarChart3,
  Activity,
  Timer,
  Gauge
} from 'lucide-react';
import AdvancedAnalyticsDashboard from './AdvancedAnalyticsDashboard';

interface SlotRiskFlight {
  flight_number: string;
  origin: string;
  destination: string;
  scheduled_slot: string;
  atfm_delay_min: number;
  slot_risk_score: number;
  at_risk: boolean;
  risk_factors: {
    time_risk: number;
    delay_risk: number;
    weather_risk: number;
  };
}

interface SlotRiskData {
  success: boolean;
  timestamp: string;
  slot_analysis: {
    total_flights: number;
    high_risk_count: number;
    average_delay: number;
    average_risk_score: number;
    risk_threshold: number;
  };
  flights: SlotRiskFlight[];
}

interface SlotMetrics {
  success: boolean;
  timestamp: string;
  operational_metrics: {
    slot_compliance_rate: number;
    average_atfm_delay: number;
    high_risk_threshold: number;
    total_slots_monitored: number;
    slots_at_risk: number;
    compliance_target: number;
  };
  risk_distribution: {
    low_risk: number;
    medium_risk: number;
    high_risk: number;
    critical_risk: number;
  };
  destination_analysis: {
    [key: string]: {
      avg_risk: number;
      avg_delay: number;
    };
  };
}

const SlotRiskDashboard: React.FC = () => {
  const [slotData, setSlotData] = useState<SlotRiskData | null>(null);
  const [metrics, setMetrics] = useState<SlotMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'flights' | 'analytics'>('overview');
  // Removed showAdvancedAnalytics state - now embedded directly

  useEffect(() => {
    fetchSlotData();
    fetchMetrics();
    
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchSlotData();
      fetchMetrics();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchSlotData = async () => {
    try {
      const response = await fetch('/api/slot-risk/dashboard');
      const data = await response.json();
      setSlotData(data);
    } catch (err) {
      setError('Failed to fetch slot risk data');
      console.error('Slot data error:', err);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/slot-risk/metrics');
      const data = await response.json();
      setMetrics(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch slot metrics');
      console.error('Metrics error:', err);
      setLoading(false);
    }
  };

  // Advanced Analytics now embedded directly in Analytics tab

  const getRiskColor = (score: number): string => {
    if (score >= 80) return 'text-red-600 bg-red-100';
    if (score >= 60) return 'text-orange-600 bg-orange-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getRiskLevel = (score: number): string => {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    return 'LOW';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <span className="ml-4">Loading slot risk analysis...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-400">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  // Advanced Analytics now embedded in Analytics tab below

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center">
              <Clock className="h-8 w-8 text-purple-500 mr-3" />
              Virgin Atlantic Slot Risk Dashboard
            </h1>
            <p className="text-gray-400 mt-1">Real-time slot management and compliance monitoring</p>
          </div>
          <button
            onClick={startAdvancedAnalytics}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Launch Advanced Analytics
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6">
          {['overview', 'flights', 'analytics'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedTab === tab
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            {metrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Slot Compliance</p>
                      <p className="text-2xl font-bold text-white">
                        {metrics.operational_metrics.slot_compliance_rate}%
                      </p>
                    </div>
                    <Gauge className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="mt-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      metrics.operational_metrics.slot_compliance_rate >= metrics.operational_metrics.compliance_target
                        ? 'bg-green-100 text-green-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      Target: {metrics.operational_metrics.compliance_target}%
                    </span>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Avg ATFM Delay</p>
                      <p className="text-2xl font-bold text-white">
                        {metrics.operational_metrics.average_atfm_delay} min
                      </p>
                    </div>
                    <Timer className="h-8 w-8 text-yellow-500" />
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Slots at Risk</p>
                      <p className="text-2xl font-bold text-white">
                        {metrics.operational_metrics.slots_at_risk}
                      </p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  </div>
                  <div className="mt-2">
                    <span className="text-xs text-gray-400">
                      of {metrics.operational_metrics.total_slots_monitored} total
                    </span>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Active Flights</p>
                      <p className="text-2xl font-bold text-white">
                        {slotData?.slot_analysis.total_flights || 0}
                      </p>
                    </div>
                    <Plane className="h-8 w-8 text-blue-500" />
                  </div>
                </div>
              </div>
            )}

            {/* Risk Distribution */}
            {metrics && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Target className="h-5 w-5 text-purple-500 mr-2" />
                  Risk Distribution
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">{metrics.risk_distribution.low_risk}</div>
                    <div className="text-sm text-gray-400">Low Risk</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-500">{metrics.risk_distribution.medium_risk}</div>
                    <div className="text-sm text-gray-400">Medium Risk</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-500">{metrics.risk_distribution.high_risk}</div>
                    <div className="text-sm text-gray-400">High Risk</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">{metrics.risk_distribution.critical_risk}</div>
                    <div className="text-sm text-gray-400">Critical Risk</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Flights Tab */}
        {selectedTab === 'flights' && slotData && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Current Slot Risk Analysis</h3>
            
            {/* High Risk Alerts */}
            {slotData.flights.filter(f => f.at_risk).length > 0 && (
              <div className="bg-red-900/20 border border-red-600 rounded-lg p-4 mb-6">
                <div className="flex items-center mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-red-400 font-semibold">
                    OPERATIONAL ALERT: {slotData.flights.filter(f => f.at_risk).length} flight(s) at high risk
                  </span>
                </div>
              </div>
            )}

            {/* Flight List */}
            <div className="space-y-3">
              {slotData.flights.map((flight, index) => (
                <div
                  key={index}
                  className={`bg-gray-800 rounded-lg p-4 border-l-4 ${
                    flight.at_risk ? 'border-red-500' : 'border-green-500'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <span className="text-lg font-semibold text-white">{flight.flight_number}</span>
                        <span className="text-gray-400">{flight.origin} → {flight.destination}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(flight.slot_risk_score)}`}>
                          {getRiskLevel(flight.slot_risk_score)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Scheduled Slot:</span>
                          <div className="text-white">
                            {new Date(flight.scheduled_slot).toLocaleTimeString('en-GB', { timeZone: 'UTC' })} UTC
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">ATFM Delay:</span>
                          <div className="text-white">{flight.atfm_delay_min} min</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Risk Score:</span>
                          <div className="text-white">{flight.slot_risk_score.toFixed(1)}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Status:</span>
                          <div className={flight.at_risk ? 'text-red-400' : 'text-green-400'}>
                            {flight.at_risk ? 'At Risk' : 'Compliant'}
                          </div>
                        </div>
                      </div>

                      {/* Risk Factor Breakdown */}
                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-gray-700 rounded p-2">
                          <div className="text-gray-400">Time Risk</div>
                          <div className="text-white font-medium">{flight.risk_factors.time_risk.toFixed(1)}</div>
                        </div>
                        <div className="bg-gray-700 rounded p-2">
                          <div className="text-gray-400">Delay Risk</div>
                          <div className="text-white font-medium">{flight.risk_factors.delay_risk.toFixed(1)}</div>
                        </div>
                        <div className="bg-gray-700 rounded p-2">
                          <div className="text-gray-400">Weather Risk</div>
                          <div className="text-white font-medium">{flight.risk_factors.weather_risk.toFixed(1)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {selectedTab === 'analytics' && metrics && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">Destination Risk Analysis</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Destination Analysis */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h4 className="text-md font-semibold text-white mb-4">Average Risk by Destination</h4>
                <div className="space-y-3">
                  {Object.entries(metrics.destination_analysis)
                    .sort(([,a], [,b]) => b.avg_risk - a.avg_risk)
                    .map(([dest, data]) => (
                    <div key={dest} className="flex justify-between items-center">
                      <span className="text-gray-300">{dest}</span>
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded text-xs ${getRiskColor(data.avg_risk)}`}>
                          {data.avg_risk.toFixed(1)}
                        </span>
                        <span className="text-gray-400 text-sm">{data.avg_delay.toFixed(1)}m delay</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Trends */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h4 className="text-md font-semibold text-white mb-4">Performance Indicators</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Slot Compliance Rate</span>
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-700 rounded-full h-2 mr-3">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${metrics.operational_metrics.slot_compliance_rate}%` }}
                        ></div>
                      </div>
                      <span className="text-white">{metrics.operational_metrics.slot_compliance_rate}%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Risk Management</span>
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-700 rounded-full h-2 mr-3">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full" 
                          style={{ width: `${(1 - metrics.operational_metrics.slots_at_risk / metrics.operational_metrics.total_slots_monitored) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-white">
                        {((1 - metrics.operational_metrics.slots_at_risk / metrics.operational_metrics.total_slots_monitored) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Embedded European Network Manager ML Analytics */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h4 className="text-md font-semibold text-white mb-2 flex items-center">
                <BarChart3 className="h-5 w-5 text-purple-500 mr-2" />
                European Network Manager ML Analytics
              </h4>
              <p className="text-gray-400 mb-4">
                Real-time European airspace analytics with predictive modeling, seasonal patterns, 
                and network health assessment from EUROCONTROL data.
              </p>
              
              {/* Embedded Advanced Analytics Dashboard */}
              <AdvancedAnalyticsDashboard />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <div className="flex justify-between items-center text-sm text-gray-400">
            <span>AINO Platform Integration | Virgin Atlantic Slot Risk Management</span>
            <span>Last updated: {slotData ? new Date(slotData.timestamp).toLocaleTimeString() : 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlotRiskDashboard;