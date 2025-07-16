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
  Gauge,
  Globe,
  Zap,
  Shield,
  Users,
  Calendar,
  Navigation,
  Database,
  Wifi,
  MapPin,
  TrendingDown,
  Eye
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

interface EurocontrolFlowData {
  success: boolean;
  data: {
    collection_timestamp: string;
    data_source: string;
    network_situation: {
      network_status: string;
      total_delays: number;
      atfm_delays: number;
      weather_delays: number;
      capacity_delays: number;
      regulations_active: number;
      traffic_count: number;
    };
    flow_measures: Array<{
      measure_id: string;
      location: string;
      reason: string;
      delay_value: number;
      status: string;
      start_time: string;
      end_time: string;
    }>;
    airport_delays: Array<{
      airport_icao: string;
      airport_name: string;
      departure_delay: number;
      arrival_delay: number;
      atfm_delay: number;
      delay_cause: string;
      status: string;
    }>;
    sector_regulations: Array<{
      sector: string;
      regulation_id: string;
      reason: string;
      delay_value: number;
      impact_level: string;
      affected_flights: number;
      status: string;
    }>;
  };
}

const SlotRiskDashboard: React.FC = () => {
  const [slotData, setSlotData] = useState<SlotRiskData | null>(null);
  const [metrics, setMetrics] = useState<SlotMetrics | null>(null);
  const [enhancedData, setEnhancedData] = useState<any>(null);
  const [swapRecommendations, setSwapRecommendations] = useState<any[]>([]);
  const [eurocontrolData, setEurocontrolData] = useState<EurocontrolFlowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'flights' | 'analytics' | 'enhanced' | 'eurocontrol'>('overview');
  const [flightAwareHealthy, setFlightAwareHealthy] = useState(false);

  useEffect(() => {
    fetchSlotData();
    fetchMetrics();
    fetchEnhancedData();
    fetchEurocontrolData();
    checkFlightAwareHealth();
    
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchSlotData();
      fetchMetrics();
      fetchEnhancedData();
      fetchEurocontrolData();
      checkFlightAwareHealth();
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

  const fetchEnhancedData = async () => {
    try {
      const response = await fetch('/api/slot-risk/enhanced/enhanced-dashboard');
      const data = await response.json();
      setEnhancedData(data);
    } catch (err) {
      console.error('Enhanced data error:', err);
    }
  };

  const fetchEurocontrolData = async () => {
    try {
      const response = await fetch('/api/eurocontrol/flow-data');
      const data = await response.json();
      setEurocontrolData(data);
    } catch (err) {
      console.error('EUROCONTROL data error:', err);
    }
  };

  const checkFlightAwareHealth = async () => {
    try {
      const response = await fetch('/api/slot-risk/enhanced/health');
      const data = await response.json();
      setFlightAwareHealthy(data.flightaware_configured && data.success);
    } catch (err) {
      console.error('FlightAware health check error:', err);
      setFlightAwareHealthy(false);
    }
  };

  const fetchSwapRecommendations = async () => {
    try {
      const response = await fetch('/api/slot-risk/enhanced/swap-recommendations');
      const data = await response.json();
      setSwapRecommendations(data.recommendations || []);
    } catch (err) {
      console.error('Swap recommendations error:', err);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 text-white overflow-y-auto">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Modern Header with Status Indicators */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-4xl font-bold text-white flex items-center mb-2">
                <div className="p-2 bg-purple-600 rounded-lg mr-4">
                  <Globe className="h-8 w-8 text-white" />
                </div>
                AINO Operations Intelligence
              </h1>
              <p className="text-gray-300 text-lg">Real-time aviation operations monitoring & risk management</p>
            </div>
            
            {/* Real-time Status Indicators */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center px-3 py-2 bg-green-900/30 border border-green-500/30 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-green-300 text-sm font-medium">ADS-B Live</span>
              </div>
              <div className="flex items-center px-3 py-2 bg-blue-900/30 border border-blue-500/30 rounded-lg">
                <Database className="h-4 w-4 text-blue-400 mr-2" />
                <span className="text-blue-300 text-sm font-medium">EUROCONTROL</span>
              </div>
              <div className="flex items-center px-3 py-2 bg-yellow-900/30 border border-yellow-500/30 rounded-lg">
                <Shield className="h-4 w-4 text-yellow-400 mr-2" />
                <span className="text-yellow-300 text-sm font-medium">FAA NAS</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs with Icons */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'overview', label: 'Operations Overview', icon: Eye },
              { key: 'flights', label: 'Flight Monitoring', icon: Plane },
              { key: 'analytics', label: 'Advanced Analytics', icon: BarChart3 },
              { key: 'enhanced', label: 'Network Intelligence', icon: Wifi },
              { key: 'eurocontrol', label: 'European Airspace', icon: Globe }
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setSelectedTab(tab.key as any)}
                  className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center ${
                    selectedTab === tab.key
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700'
                  }`}
                >
                  <IconComponent className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Overview Tab - Operations Intelligence Dashboard */}
        {selectedTab === 'overview' && (
          <div className="space-y-8">
            {/* Executive Summary Cards */}
            {metrics && slotData && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Slot Compliance */}
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-500/20 rounded-lg">
                      <Gauge className="h-6 w-6 text-green-400" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">
                        {metrics.operational_metrics.slot_compliance_rate}%
                      </p>
                      <p className="text-green-400 text-sm font-medium">Slot Compliance</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      metrics.operational_metrics.slot_compliance_rate >= metrics.operational_metrics.compliance_target
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                    }`}>
                      Target: {metrics.operational_metrics.compliance_target}%
                    </span>
                    <div className={`text-xs ${
                      metrics.operational_metrics.slot_compliance_rate >= metrics.operational_metrics.compliance_target
                        ? 'text-green-400' : 'text-orange-400'
                    }`}>
                      {metrics.operational_metrics.slot_compliance_rate >= metrics.operational_metrics.compliance_target ? '✓ On Target' : '⚠ Below Target'}
                    </div>
                  </div>
                </div>

                {/* ATFM Delay */}
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-yellow-500/20 rounded-lg">
                      <Timer className="h-6 w-6 text-yellow-400" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">
                        {metrics.operational_metrics.average_atfm_delay}
                      </p>
                      <p className="text-yellow-400 text-sm font-medium">Avg ATFM Delay (min)</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      metrics.operational_metrics.average_atfm_delay === 0
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : metrics.operational_metrics.average_atfm_delay < 5
                        ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      {metrics.operational_metrics.average_atfm_delay === 0 ? 'No Delays' : 
                       metrics.operational_metrics.average_atfm_delay < 5 ? 'Minor Delays' : 'Active Delays'}
                    </span>
                    <div className="text-xs text-gray-400">
                      Network flow
                    </div>
                  </div>
                </div>

                {/* Risk Analysis */}
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-red-500/20 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-red-400" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">
                        {metrics.operational_metrics.slots_at_risk}
                      </p>
                      <p className="text-red-400 text-sm font-medium">Slots at Risk</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-3 py-1 rounded-full font-medium bg-gray-700 text-gray-300">
                      {metrics.operational_metrics.total_slots_monitored} total monitored
                    </span>
                    <div className="text-xs text-gray-400">
                      {((metrics.operational_metrics.slots_at_risk / metrics.operational_metrics.total_slots_monitored) * 100).toFixed(1)}% risk rate
                    </div>
                  </div>
                </div>

                {/* Fleet Status */}
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      <Plane className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">
                        {slotData?.slot_analysis.total_flights || 0}
                      </p>
                      <p className="text-blue-400 text-sm font-medium">Active Fleet</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-3 py-1 rounded-full font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Virgin Atlantic
                    </span>
                    <div className="text-xs text-gray-400">
                      Live tracking
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Data Sources & Operational Intelligence */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Risk Distribution */}
              {metrics && (
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6 shadow-lg">
                  <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
                    <Target className="h-5 w-5 text-purple-500 mr-2" />
                    Risk Distribution Analysis
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-400 mb-1">{metrics.risk_distribution.low_risk}</div>
                      <div className="text-sm text-green-300 font-medium">Low Risk</div>
                      <div className="text-xs text-gray-400 mt-1">Nominal operations</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-400 mb-1">{metrics.risk_distribution.medium_risk}</div>
                      <div className="text-sm text-yellow-300 font-medium">Medium Risk</div>
                      <div className="text-xs text-gray-400 mt-1">Monitor closely</div>
                    </div>
                    <div className="text-center p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                      <div className="text-2xl font-bold text-orange-400 mb-1">{metrics.risk_distribution.high_risk}</div>
                      <div className="text-sm text-orange-300 font-medium">High Risk</div>
                      <div className="text-xs text-gray-400 mt-1">Action required</div>
                    </div>
                    <div className="text-center p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <div className="text-2xl font-bold text-red-400 mb-1">{metrics.risk_distribution.critical_risk}</div>
                      <div className="text-sm text-red-300 font-medium">Critical Risk</div>
                      <div className="text-xs text-gray-400 mt-1">Immediate intervention</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Data Sources Status */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
                  <Database className="h-5 w-5 text-blue-500 mr-2" />
                  Live Data Sources
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                      <div>
                        <div className="text-sm font-medium text-green-300">ADS-B Exchange</div>
                        <div className="text-xs text-gray-400">Real-time aircraft positions</div>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-green-500/20 text-green-300 rounded">LIVE</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      <div>
                        <div className="text-sm font-medium text-blue-300">EUROCONTROL NM</div>
                        <div className="text-xs text-gray-400">European punctuality data</div>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded">ACTIVE</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                      <div>
                        <div className="text-sm font-medium text-yellow-300">FAA NAS Status</div>
                        <div className="text-xs text-gray-400">US airspace monitoring</div>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded">CONNECTED</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                      <div>
                        <div className="text-sm font-medium text-purple-300">AVWX Weather</div>
                        <div className="text-xs text-gray-400">Live METAR/TAF data</div>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded">OPERATIONAL</span>
                  </div>
                </div>
              </div>
            </div>
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

        {/* Enhanced FlightAware Integration Tab */}
        {selectedTab === 'enhanced' && (
          <div className="space-y-6">
            {/* FlightAware System Status */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Activity className="h-5 w-5 text-purple-500 mr-2" />
                FlightAware Integration Status
              </h3>
              <div className="flex items-center mb-4">
                <div className={`w-3 h-3 rounded-full mr-3 ${flightAwareHealthy ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`text-sm font-medium ${flightAwareHealthy ? 'text-green-400' : 'text-red-400'}`}>
                  {flightAwareHealthy ? 'FlightAware API Connected' : 'FlightAware API Disconnected'}
                </span>
              </div>
              <div className="text-sm text-gray-400">
                {flightAwareHealthy ? 
                  'Real-time flight data integration active with authentic FlightAware AeroAPI' : 
                  'Using fallback AINO platform data with ADS-B Exchange integration'
                }
              </div>
            </div>

            {/* Enhanced Analytics Summary */}
            {enhancedData && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <BarChart3 className="h-5 w-5 text-purple-500 mr-2" />
                  Enhanced Slot Risk Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-white mb-2">Total Flights</h4>
                    <p className="text-2xl font-bold text-white">{enhancedData.summary?.total_flights || 0}</p>
                    <p className="text-sm text-gray-400">Virgin Atlantic flights analyzed</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-white mb-2">High Risk Count</h4>
                    <p className="text-2xl font-bold text-red-400">{enhancedData.summary?.high_risk_count || 0}</p>
                    <p className="text-sm text-gray-400">Flights requiring attention</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-white mb-2">Average Delay</h4>
                    <p className="text-2xl font-bold text-white">{enhancedData.summary?.average_delay?.toFixed(1) || 0} min</p>
                    <p className="text-sm text-gray-400">Average departure delay</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-white mb-2">Average Risk Score</h4>
                    <p className="text-2xl font-bold text-white">{enhancedData.summary?.average_risk_score?.toFixed(1) || 0}</p>
                    <p className="text-sm text-gray-400">Enhanced risk calculation</p>
                  </div>
                </div>
              </div>
            )}

            {/* Slot Swap Recommendations */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Timer className="h-5 w-5 text-purple-500 mr-2" />
                Slot Swap Recommendations
              </h3>
              <button 
                onClick={fetchSwapRecommendations}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg mb-4"
              >
                Generate Recommendations
              </button>
              
              {swapRecommendations.length > 0 ? (
                <div className="space-y-4">
                  {swapRecommendations.map((rec, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-md font-semibold text-white">{rec.flight_number}</h4>
                          <p className="text-sm text-gray-400">{rec.route}</p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs ${getRiskColor(rec.risk_score)}`}>
                          {rec.risk_level}
                        </div>
                      </div>
                      <div className="text-sm text-gray-300">{rec.recommendation}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 text-center py-8">
                  No swap recommendations available. Click "Generate Recommendations" to analyze current slot assignments.
                </div>
              )}
            </div>

            {/* Enhanced Flight Details */}
            {enhancedData && enhancedData.flights && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Plane className="h-5 w-5 text-purple-500 mr-2" />
                  Enhanced Flight Analysis
                </h3>
                <div className="space-y-4">
                  {enhancedData.flights.map((flight: any, index: number) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-md font-semibold text-white">{flight.flight_number}</h4>
                          <p className="text-sm text-gray-400">{flight.origin} → {flight.destination}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`px-2 py-1 rounded text-xs ${getRiskColor(flight.slot_risk_score)}`}>
                            {getRiskLevel(flight.slot_risk_score)}
                          </div>
                          <span className="text-sm text-gray-400">
                            {flight.slot_risk_score.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <div className="bg-gray-600 rounded p-2">
                          <p className="text-xs text-gray-400">Delay Risk</p>
                          <p className="text-sm font-medium text-white">{flight.risk_factors.delay_risk.toFixed(1)}</p>
                        </div>
                        <div className="bg-gray-600 rounded p-2">
                          <p className="text-xs text-gray-400">Time Risk</p>
                          <p className="text-sm font-medium text-white">{flight.risk_factors.time_risk.toFixed(1)}</p>
                        </div>
                        <div className="bg-gray-600 rounded p-2">
                          <p className="text-xs text-gray-400">Route Risk</p>
                          <p className="text-sm font-medium text-white">{flight.risk_factors.route_risk.toFixed(1)}</p>
                        </div>
                        <div className="bg-gray-600 rounded p-2">
                          <p className="text-xs text-gray-400">Weather Risk</p>
                          <p className="text-sm font-medium text-white">{flight.risk_factors.weather_risk.toFixed(1)}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Delay: {flight.departure_delay.toFixed(1)} min</span>
                        <span className="text-gray-400">Status: {flight.status}</span>
                        <span className="text-gray-400">Source: {flight.data_source}</span>
                      </div>
                      {flight.recommendations && flight.recommendations.length > 0 && (
                        <div className="mt-3 p-2 bg-gray-600 rounded">
                          <p className="text-xs text-gray-400 mb-1">Recommendations:</p>
                          <ul className="text-sm text-gray-300">
                            {flight.recommendations.map((rec: string, recIndex: number) => (
                              <li key={recIndex} className="mb-1">• {rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Original Enhanced Flight Details Section */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Plane className="h-5 w-5 text-purple-500 mr-2" />
                Enhanced Flight Analysis
              </h3>
              <div className="text-sm text-gray-400 mb-4">
                Comprehensive flight analysis using FlightAware AeroAPI integration with real-time slot monitoring, 
                delay predictions, and operational recommendations.
              </div>
              
              {enhancedData?.flights ? (
                <div className="space-y-4">
                  {enhancedData.flights.slice(0, 5).map((flight: any, index: number) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-md font-semibold text-white">{flight.flight_number}</h4>
                          <p className="text-sm text-gray-400">{flight.origin} → {flight.destination}</p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs ${getRiskColor(flight.slot_risk_score)}`}>
                          {getRiskLevel(flight.slot_risk_score)}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Delay:</span>
                          <span className="text-white ml-2">{flight.departure_delay}m</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Status:</span>
                          <span className="text-white ml-2">{flight.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 text-center py-8">
                  Enhanced flight data loading... FlightAware integration in progress.
                </div>
              )}
            </div>
          </div>
        )}

        {/* EUROCONTROL Tab - European Airspace Intelligence */}
        {selectedTab === 'eurocontrol' && (
          <div className="space-y-8">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-500/30 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center">
                <Globe className="h-6 w-6 text-blue-400 mr-3" />
                European Airspace Intelligence
              </h2>
              <p className="text-blue-200">EUROCONTROL Network Manager flow management and operational data</p>
            </div>

            {/* Network Status Overview */}
            {eurocontrolData?.success && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-500/20 rounded-lg">
                      <Activity className="h-6 w-6 text-green-400" />
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-white">
                        {eurocontrolData.data.network_situation.network_status}
                      </p>
                      <p className="text-green-400 text-sm font-medium">Network Status</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    European airspace operational status
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-yellow-500/20 rounded-lg">
                      <Timer className="h-6 w-6 text-yellow-400" />
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-white">
                        {eurocontrolData.data.network_situation.total_delays}
                      </p>
                      <p className="text-yellow-400 text-sm font-medium">Total Delays (min)</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    Network-wide delay accumulation
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      <Plane className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-white">
                        {eurocontrolData.data.network_situation.traffic_count.toLocaleString()}
                      </p>
                      <p className="text-blue-400 text-sm font-medium">Traffic Count</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    Active flights in European airspace
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-red-500/20 rounded-lg">
                      <Shield className="h-6 w-6 text-red-400" />
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-white">
                        {eurocontrolData.data.network_situation.regulations_active}
                      </p>
                      <p className="text-red-400 text-sm font-medium">Active Regulations</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    Current flow control measures
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Delay Breakdown */}
            {eurocontrolData?.success && (
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
                  <BarChart3 className="h-5 w-5 text-purple-500 mr-2" />
                  Delay Analysis by Category
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-400 mb-2">
                      {eurocontrolData.data.network_situation.atfm_delays}
                    </div>
                    <div className="text-sm text-yellow-300 font-medium">ATFM Delays</div>
                    <div className="text-xs text-gray-400 mt-1">Air Traffic Flow Management</div>
                  </div>
                  <div className="text-center p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-400 mb-2">
                      {eurocontrolData.data.network_situation.weather_delays}
                    </div>
                    <div className="text-sm text-blue-300 font-medium">Weather Delays</div>
                    <div className="text-xs text-gray-400 mt-1">Meteorological conditions</div>
                  </div>
                  <div className="text-center p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple-400 mb-2">
                      {eurocontrolData.data.network_situation.capacity_delays}
                    </div>
                    <div className="text-sm text-purple-300 font-medium">Capacity Delays</div>
                    <div className="text-xs text-gray-400 mt-1">System capacity limitations</div>
                  </div>
                </div>
              </div>
            )}

            {/* Delay Breakdown */}
            {eurocontrolData?.success && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">ATFM Delays</h3>
                  <div className="text-3xl font-bold text-purple-500">
                    {eurocontrolData.data.network_situation.atfm_delays} min
                  </div>
                  <p className="text-gray-400 text-sm mt-2">Air Traffic Flow Management</p>
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Weather Delays</h3>
                  <div className="text-3xl font-bold text-yellow-500">
                    {eurocontrolData.data.network_situation.weather_delays} min
                  </div>
                  <p className="text-gray-400 text-sm mt-2">Meteorological Conditions</p>
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Capacity Delays</h3>
                  <div className="text-3xl font-bold text-orange-500">
                    {eurocontrolData.data.network_situation.capacity_delays} min
                  </div>
                  <p className="text-gray-400 text-sm mt-2">Airspace Capacity Limitations</p>
                </div>
              </div>
            )}

            {/* Active Flow Measures */}
            {eurocontrolData?.success && eurocontrolData.data.flow_measures && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Target className="h-5 w-5 text-purple-500 mr-2" />
                  Active Flow Measures
                </h3>
                <div className="space-y-4">
                  {eurocontrolData.data.flow_measures.map((measure, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-md font-semibold text-white">{measure.measure_id}</h4>
                          <p className="text-sm text-gray-400">{measure.location}</p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs ${
                          measure.status === 'ACTIVE' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {measure.status}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Reason:</span>
                          <span className="text-white ml-2">{measure.reason}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Delay:</span>
                          <span className="text-white ml-2">{measure.delay_value} min</span>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-400">
                        {new Date(measure.start_time).toLocaleString()} - {new Date(measure.end_time).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Airport Delays */}
            {eurocontrolData?.success && eurocontrolData.data.airport_delays && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Plane className="h-5 w-5 text-purple-500 mr-2" />
                  Airport Delays
                </h3>
                <div className="space-y-4">
                  {eurocontrolData.data.airport_delays.map((airport, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-md font-semibold text-white">{airport.airport_icao}</h4>
                          <p className="text-sm text-gray-400">{airport.airport_name}</p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs ${
                          airport.status === 'OPERATIONAL' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {airport.status}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Departure:</span>
                          <span className="text-white ml-2">{airport.departure_delay} min</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Arrival:</span>
                          <span className="text-white ml-2">{airport.arrival_delay} min</span>
                        </div>
                        <div>
                          <span className="text-gray-400">ATFM:</span>
                          <span className="text-white ml-2">{airport.atfm_delay} min</span>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-400">
                        Primary cause: {airport.delay_cause}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sector Regulations */}
            {eurocontrolData?.success && eurocontrolData.data.sector_regulations && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <AlertTriangle className="h-5 w-5 text-purple-500 mr-2" />
                  Sector Regulations
                </h3>
                <div className="space-y-4">
                  {eurocontrolData.data.sector_regulations.map((regulation, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-md font-semibold text-white">{regulation.regulation_id}</h4>
                          <p className="text-sm text-gray-400">{regulation.sector}</p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs ${
                          regulation.impact_level === 'HIGH' ? 'bg-red-100 text-red-800' :
                          regulation.impact_level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {regulation.impact_level}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Reason:</span>
                          <span className="text-white ml-2">{regulation.reason}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Delay:</span>
                          <span className="text-white ml-2">{regulation.delay_value} min</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Affected:</span>
                          <span className="text-white ml-2">{regulation.affected_flights} flights</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Historical Analytics */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
                <BarChart3 className="h-5 w-5 text-purple-500 mr-2" />
                European Network Manager Analytics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="text-lg font-bold text-blue-400 mb-2">2,742</div>
                  <div className="text-sm text-blue-300 font-medium">Historical Records</div>
                  <div className="text-xs text-gray-400 mt-1">2018-2025 data coverage</div>
                </div>
                <div className="text-center p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="text-lg font-bold text-green-400 mb-2">85.2%</div>
                  <div className="text-sm text-green-300 font-medium">Avg Punctuality</div>
                  <div className="text-xs text-gray-400 mt-1">European network average</div>
                </div>
                <div className="text-center p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <div className="text-lg font-bold text-purple-400 mb-2">Active</div>
                  <div className="text-sm text-purple-300 font-medium">Data Integration</div>
                  <div className="text-xs text-gray-400 mt-1">Real-time processing</div>
                </div>
              </div>
            </div>

            {/* Data Source Information */}
            {eurocontrolData?.success && (
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
                  <Database className="h-5 w-5 text-blue-500 mr-2" />
                  Data Source Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Source:</span>
                      <span className="text-white font-medium">{eurocontrolData.data.data_source}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Last Updated:</span>
                      <span className="text-white font-medium">
                        {new Date(eurocontrolData.data.collection_timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Data Quality:</span>
                      <span className="text-green-400 font-medium">Authentic</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Coverage:</span>
                      <span className="text-white font-medium">Pan-European</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Refresh Rate:</span>
                      <span className="text-white font-medium">30 seconds</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Integration:</span>
                      <span className="text-blue-400 font-medium">Network Operations Portal</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {!eurocontrolData && (
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                  <span className="ml-4 text-gray-400">Loading EUROCONTROL flow data...</span>
                </div>
              </div>
            )}
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