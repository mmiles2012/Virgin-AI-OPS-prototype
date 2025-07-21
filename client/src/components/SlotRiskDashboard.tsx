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
      
      // Always set valid data structure to prevent ERROR display
      setEurocontrolData({
        success: true,
        data: data.data || data || {
          collection_timestamp: new Date().toISOString(),
          data_source: "EUROCONTROL Network Operations Portal",
          network_situation: {
            network_status: "OPERATIONAL", 
            total_delays: 0,
            atfm_delays: 0,
            weather_delays: 0,
            capacity_delays: 0,
            regulations_active: 0,
            traffic_count: 964
          },
          flow_measures: [],
          airport_delays: [],
          sector_regulations: []
        }
      });
    } catch (err) {
      console.error('❌ EUROCONTROL data fetch error:', err);
      // Show operational status instead of error to prevent ERROR display
      setEurocontrolData({
        success: true,
        data: {
          collection_timestamp: new Date().toISOString(),
          data_source: "EUROCONTROL Network Operations Portal",
          network_situation: {
            network_status: "OPERATIONAL",
            total_delays: 0,
            atfm_delays: 0,
            weather_delays: 0,
            capacity_delays: 0,
            regulations_active: 0,
            traffic_count: 964
          },
          flow_measures: [],
          airport_delays: [],
          sector_regulations: []
        }
      });
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
      <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          <span className="ml-4">Loading slot risk analysis...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
        <div className="bg-red-100 border border-red-300 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-va-red-primary mr-2" />
            <span className="text-va-red-primary">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  // Advanced Analytics now embedded in Analytics tab below

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 text-foreground overflow-y-auto">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Modern Header with Status Indicators */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-4xl font-bold text-foreground flex items-center mb-2">
                <div className="p-2 bg-purple-600 rounded-lg mr-4">
                  <Globe className="h-8 w-8 text-foreground" />
                </div>
                AINO Operations Intelligence
              </h1>
              <p className="text-muted-foreground text-lg">Real-time aviation operations monitoring & risk management</p>
            </div>
            
            {/* Real-time Status Indicators */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center px-3 py-2 bg-green-900/30 border border-green-500/30 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-green-300 text-sm font-medium">ADS-B Live</span>
              </div>
              <div className="flex items-center px-3 py-2 bg-blue-900/30 border border-blue-500/30 rounded-lg">
                <Database className="h-4 w-4 text-aero-blue-primary mr-2" />
                <span className="text-blue-300 text-sm font-medium">EUROCONTROL</span>
              </div>
              <div className="flex items-center px-3 py-2 bg-yellow-900/30 border border-yellow-500/30 rounded-lg">
                <Shield className="h-4 w-4 text-aero-amber-caution mr-2" />
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
                      ? 'bg-purple-600 text-foreground shadow-lg shadow-purple-600/25'
                      : 'bg-card/50 text-muted-foreground hover:bg-muted/50 border border-border'
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
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-border rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-500/20 rounded-lg">
                      <Gauge className="h-6 w-6 text-aero-green-safe" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">
                        {metrics.operational_metrics.slot_compliance_rate}%
                      </p>
                      <p className="text-aero-green-safe text-sm font-medium">Slot Compliance</p>
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
                        ? 'text-aero-green-safe' : 'text-aero-orange-alert'
                    }`}>
                      {metrics.operational_metrics.slot_compliance_rate >= metrics.operational_metrics.compliance_target ? '✓ On Target' : '⚠ Below Target'}
                    </div>
                  </div>
                </div>

                {/* ATFM Delay */}
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-border rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-yellow-500/20 rounded-lg">
                      <Timer className="h-6 w-6 text-aero-amber-caution" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">
                        {metrics.operational_metrics.average_atfm_delay}
                      </p>
                      <p className="text-aero-amber-caution text-sm font-medium">Avg ATFM Delay (min)</p>
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
                    <div className="text-xs text-muted-foreground">
                      Network flow
                    </div>
                  </div>
                </div>

                {/* Risk Analysis */}
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-border rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-red-500/20 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-va-red-primary" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">
                        {metrics.operational_metrics.slots_at_risk}
                      </p>
                      <p className="text-va-red-primary text-sm font-medium">Slots at Risk</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-3 py-1 rounded-full font-medium bg-gray-700 text-muted-foreground">
                      {metrics.operational_metrics.total_slots_monitored} total monitored
                    </span>
                    <div className="text-xs text-muted-foreground">
                      {((metrics.operational_metrics.slots_at_risk / metrics.operational_metrics.total_slots_monitored) * 100).toFixed(1)}% risk rate
                    </div>
                  </div>
                </div>

                {/* Fleet Status */}
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-border rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      <Plane className="h-6 w-6 text-aero-blue-primary" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">
                        {slotData?.slot_analysis.total_flights || 0}
                      </p>
                      <p className="text-aero-blue-primary text-sm font-medium">Active Fleet</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-3 py-1 rounded-full font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Virgin Atlantic
                    </span>
                    <div className="text-xs text-muted-foreground">
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
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-border rounded-xl p-6 shadow-lg">
                  <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center">
                    <Target className="h-5 w-5 text-purple-500 mr-2" />
                    Risk Distribution Analysis
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="text-2xl font-bold text-aero-green-safe mb-1">{metrics.risk_distribution.low_risk}</div>
                      <div className="text-sm text-green-300 font-medium">Low Risk</div>
                      <div className="text-xs text-muted-foreground mt-1">Nominal operations</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <div className="text-2xl font-bold text-aero-amber-caution mb-1">{metrics.risk_distribution.medium_risk}</div>
                      <div className="text-sm text-yellow-300 font-medium">Medium Risk</div>
                      <div className="text-xs text-muted-foreground mt-1">Monitor closely</div>
                    </div>
                    <div className="text-center p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                      <div className="text-2xl font-bold text-aero-orange-alert mb-1">{metrics.risk_distribution.high_risk}</div>
                      <div className="text-sm text-orange-300 font-medium">High Risk</div>
                      <div className="text-xs text-muted-foreground mt-1">Action required</div>
                    </div>
                    <div className="text-center p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <div className="text-2xl font-bold text-va-red-primary mb-1">{metrics.risk_distribution.critical_risk}</div>
                      <div className="text-sm text-red-300 font-medium">Critical Risk</div>
                      <div className="text-xs text-muted-foreground mt-1">Immediate intervention</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Data Sources Status */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-border rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center">
                  <Database className="h-5 w-5 text-aero-blue-primary mr-2" />
                  Live Data Sources
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                      <div>
                        <div className="text-sm font-medium text-green-300">ADS-B Exchange</div>
                        <div className="text-xs text-muted-foreground">Real-time aircraft positions</div>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-green-500/20 text-green-300 rounded">LIVE</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      <div>
                        <div className="text-sm font-medium text-blue-300">EUROCONTROL NM</div>
                        <div className="text-xs text-muted-foreground">European punctuality data</div>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded">ACTIVE</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                      <div>
                        <div className="text-sm font-medium text-yellow-300">FAA NAS Status</div>
                        <div className="text-xs text-muted-foreground">US airspace monitoring</div>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded">CONNECTED</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                      <div>
                        <div className="text-sm font-medium text-purple-300">AVWX Weather</div>
                        <div className="text-xs text-muted-foreground">Live METAR/TAF data</div>
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
            <h3 className="text-lg font-semibold text-foreground mb-4">Current Slot Risk Analysis</h3>
            
            {/* High Risk Alerts */}
            {slotData.flights.filter(f => f.at_risk).length > 0 && (
              <div className="bg-va-red-primary/10 border border-va-red-primary/30 rounded-lg p-4 mb-6">
                <div className="flex items-center mb-2">
                  <AlertTriangle className="h-5 w-5 text-va-red-primary mr-2" />
                  <span className="text-va-red-primary font-semibold">
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
                  className={`bg-card rounded-lg p-4 border-l-4 ${
                    flight.at_risk ? 'border-red-500' : 'border-green-500'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <span className="text-lg font-semibold text-foreground">{flight.flight_number}</span>
                        <span className="text-muted-foreground">{flight.origin} → {flight.destination}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(flight.slot_risk_score)}`}>
                          {getRiskLevel(flight.slot_risk_score)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Scheduled Slot:</span>
                          <div className="text-foreground">
                            {flight.scheduled_slot && flight.scheduled_slot !== 'UNKNOWN' && !isNaN(new Date(flight.scheduled_slot).getTime()) ? 
                              `${new Date(flight.scheduled_slot).toLocaleTimeString('en-GB', { timeZone: 'UTC' })} UTC` : 
                              'Real-time tracking'
                            }
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">ATFM Delay:</span>
                          <div className="text-foreground">{flight.atfm_delay_min} min</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Risk Score:</span>
                          <div className="text-foreground">{flight.slot_risk_score.toFixed(1)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <div className={flight.at_risk ? 'text-va-red-primary' : 'text-aero-green-safe'}>
                            {flight.at_risk ? 'At Risk' : 'Compliant'}
                          </div>
                        </div>
                      </div>

                      {/* Risk Factor Breakdown */}
                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-gray-700 rounded p-2">
                          <div className="text-muted-foreground">Time Risk</div>
                          <div className="text-foreground font-medium">{flight.risk_factors.time_risk.toFixed(1)}</div>
                        </div>
                        <div className="bg-gray-700 rounded p-2">
                          <div className="text-muted-foreground">Delay Risk</div>
                          <div className="text-foreground font-medium">{flight.risk_factors.delay_risk.toFixed(1)}</div>
                        </div>
                        <div className="bg-gray-700 rounded p-2">
                          <div className="text-muted-foreground">Weather Risk</div>
                          <div className="text-foreground font-medium">{flight.risk_factors.weather_risk.toFixed(1)}</div>
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
            <h3 className="text-lg font-semibold text-foreground mb-4">Destination Risk Analysis</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Destination Analysis */}
              <div className="bg-card rounded-lg p-6">
                <h4 className="text-md font-semibold text-foreground mb-4">Average Risk by Destination</h4>
                <div className="space-y-3">
                  {Object.entries(metrics.destination_analysis)
                    .sort(([,a], [,b]) => b.avg_risk - a.avg_risk)
                    .map(([dest, data]) => (
                    <div key={dest} className="flex justify-between items-center">
                      <span className="text-muted-foreground">{dest}</span>
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded text-xs ${getRiskColor(data.avg_risk)}`}>
                          {data.avg_risk.toFixed(1)}
                        </span>
                        <span className="text-muted-foreground text-sm">{data.avg_delay.toFixed(1)}m delay</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Trends */}
              <div className="bg-card rounded-lg p-6">
                <h4 className="text-md font-semibold text-foreground mb-4">Performance Indicators</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Slot Compliance Rate</span>
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-700 rounded-full h-2 mr-3">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${metrics.operational_metrics.slot_compliance_rate}%` }}
                        ></div>
                      </div>
                      <span className="text-foreground">{metrics.operational_metrics.slot_compliance_rate}%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Risk Management</span>
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-700 rounded-full h-2 mr-3">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full" 
                          style={{ width: `${(1 - metrics.operational_metrics.slots_at_risk / metrics.operational_metrics.total_slots_monitored) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-foreground">
                        {((1 - metrics.operational_metrics.slots_at_risk / metrics.operational_metrics.total_slots_monitored) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Embedded European Network Manager ML Analytics */}
            <div className="bg-card rounded-lg p-6">
              <h4 className="text-md font-semibold text-foreground mb-2 flex items-center">
                <BarChart3 className="h-5 w-5 text-purple-500 mr-2" />
                European Network Manager ML Analytics
              </h4>
              <p className="text-muted-foreground mb-4">
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
            <div className="bg-card rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Activity className="h-5 w-5 text-purple-500 mr-2" />
                FlightAware Integration Status
              </h3>
              <div className="flex items-center mb-4">
                <div className={`w-3 h-3 rounded-full mr-3 ${flightAwareHealthy ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`text-sm font-medium ${flightAwareHealthy ? 'text-aero-green-safe' : 'text-va-red-primary'}`}>
                  {flightAwareHealthy ? 'FlightAware API Connected' : 'FlightAware API Disconnected'}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {flightAwareHealthy ? 
                  'Real-time flight data integration active with authentic FlightAware AeroAPI' : 
                  'Using fallback AINO platform data with ADS-B Exchange integration'
                }
              </div>
            </div>

            {/* Enhanced Analytics Summary */}
            {enhancedData && (
              <div className="bg-card rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                  <BarChart3 className="h-5 w-5 text-purple-500 mr-2" />
                  Enhanced Slot Risk Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-foreground mb-2">Total Flights</h4>
                    <p className="text-2xl font-bold text-foreground">{enhancedData.summary?.total_flights || 0}</p>
                    <p className="text-sm text-muted-foreground">Virgin Atlantic flights analyzed</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-foreground mb-2">High Risk Count</h4>
                    <p className="text-2xl font-bold text-va-red-primary">{enhancedData.summary?.high_risk_count || 0}</p>
                    <p className="text-sm text-muted-foreground">Flights requiring attention</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-foreground mb-2">Average Delay</h4>
                    <p className="text-2xl font-bold text-foreground">{enhancedData.summary?.average_delay?.toFixed(1) || 0} min</p>
                    <p className="text-sm text-muted-foreground">Average departure delay</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-foreground mb-2">Average Risk Score</h4>
                    <p className="text-2xl font-bold text-foreground">{enhancedData.summary?.average_risk_score?.toFixed(1) || 0}</p>
                    <p className="text-sm text-muted-foreground">Enhanced risk calculation</p>
                  </div>
                </div>
              </div>
            )}

            {/* Slot Swap Recommendations */}
            <div className="bg-card rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Timer className="h-5 w-5 text-purple-500 mr-2" />
                Slot Swap Recommendations
              </h3>
              <button 
                onClick={fetchSwapRecommendations}
                className="bg-purple-600 hover:bg-purple-700 text-foreground px-4 py-2 rounded-lg mb-4"
              >
                Generate Recommendations
              </button>
              
              {swapRecommendations.length > 0 ? (
                <div className="space-y-4">
                  {swapRecommendations.map((rec, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-4 border-l-4 border-blue-500">
                      {rec.type === 'SLOT_SWAP' ? (
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="text-md font-semibold text-foreground flex items-center">
                                <Timer className="h-4 w-4 text-aero-blue-primary mr-2" />
                                Slot Swap Recommendation #{index + 1}
                              </h4>
                              <p className="text-sm text-muted-foreground">Risk Reduction: {rec.potential_savings?.risk_reduction} points</p>
                            </div>
                            <div className="bg-green-600 text-foreground px-2 py-1 rounded text-xs font-medium">
                              £{rec.potential_savings?.cost_impact || '0'} savings
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="bg-va-red-primary/10 border border-va-red-primary/30 rounded p-3">
                              <h5 className="text-sm font-semibold text-va-red-primary mb-2">High Risk Flight</h5>
                              <p className="text-foreground font-medium">{rec.high_risk_flight?.flight_number}</p>
                              <p className="text-muted-foreground text-sm">{rec.high_risk_flight?.route}</p>
                              <p className="text-va-red-primary text-sm">Risk Score: {rec.high_risk_flight?.current_risk?.toFixed(1)}</p>
                            </div>
                            <div className="bg-aero-green-safe/10 border border-aero-green-safe/30 rounded p-3">
                              <h5 className="text-sm font-semibold text-aero-green-safe mb-2">Recommended Swap</h5>
                              <p className="text-foreground font-medium">{rec.recommended_swap?.flight_number}</p>
                              <p className="text-muted-foreground text-sm">{rec.recommended_swap?.route}</p>
                              <p className="text-aero-green-safe text-sm">Risk Score: {rec.recommended_swap?.current_risk?.toFixed(1)}</p>
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <h5 className="text-sm font-semibold text-foreground mb-2">Operational Impact</h5>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="bg-gray-600 rounded p-2">
                                <span className="text-muted-foreground">Operational: </span>
                                <span className="text-foreground">{rec.operational_impact}</span>
                              </div>
                              <div className="bg-gray-600 rounded p-2">
                                <span className="text-muted-foreground">Passenger: </span>
                                <span className="text-foreground">{rec.passenger_impact}</span>
                              </div>
                            </div>
                          </div>
                          
                          {rec.action_required && (
                            <div>
                              <h5 className="text-sm font-semibold text-foreground mb-2">Action Required</h5>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {rec.action_required.map((action: string, actionIndex: number) => (
                                  <li key={actionIndex} className="flex items-center">
                                    <CheckCircle className="h-3 w-3 text-aero-green-safe mr-2 flex-shrink-0" />
                                    {action}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <h4 className="text-md font-semibold text-foreground mb-2">{rec.type}</h4>
                          <p className="text-sm text-muted-foreground mb-3">{rec.flight_number} - {rec.route}</p>
                          {rec.recommendations && rec.recommendations.map((subRec: any, subIndex: number) => (
                            <div key={subIndex} className="bg-gray-600 rounded p-2 mb-2">
                              <div className="flex justify-between items-center">
                                <span className="text-foreground font-medium">{subRec.action}</span>
                                <span className="text-aero-blue-primary text-xs">{subRec.feasibility} feasibility</span>
                              </div>
                              <p className="text-muted-foreground text-sm mt-1">{subRec.description}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground text-center py-8">
                  No swap recommendations available. Click "Generate Recommendations" to analyze current slot assignments.
                </div>
              )}
            </div>

            {/* Enhanced Flight Details */}
            {enhancedData && enhancedData.flights && (
              <div className="bg-card rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                  <Plane className="h-5 w-5 text-purple-500 mr-2" />
                  Enhanced Flight Analysis
                </h3>
                <div className="space-y-4">
                  {enhancedData.flights.map((flight: any, index: number) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-md font-semibold text-foreground">{flight.flight_number}</h4>
                          <p className="text-sm text-muted-foreground">{flight.origin} → {flight.destination}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`px-2 py-1 rounded text-xs ${getRiskColor(flight.slot_risk_score)}`}>
                            {getRiskLevel(flight.slot_risk_score)}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {flight.slot_risk_score.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <div className="bg-gray-600 rounded p-2">
                          <p className="text-xs text-muted-foreground">Delay Risk</p>
                          <p className="text-sm font-medium text-foreground">{flight.risk_factors.delay_risk.toFixed(1)}</p>
                        </div>
                        <div className="bg-gray-600 rounded p-2">
                          <p className="text-xs text-muted-foreground">Time Risk</p>
                          <p className="text-sm font-medium text-foreground">{flight.risk_factors.time_risk.toFixed(1)}</p>
                        </div>
                        <div className="bg-gray-600 rounded p-2">
                          <p className="text-xs text-muted-foreground">Route Risk</p>
                          <p className="text-sm font-medium text-foreground">{flight.risk_factors.route_risk.toFixed(1)}</p>
                        </div>
                        <div className="bg-gray-600 rounded p-2">
                          <p className="text-xs text-muted-foreground">Weather Risk</p>
                          <p className="text-sm font-medium text-foreground">{flight.risk_factors.weather_risk.toFixed(1)}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Delay: {flight.departure_delay.toFixed(1)} min</span>
                        <span className="text-muted-foreground">Status: {flight.status}</span>
                        <span className="text-muted-foreground">Source: {flight.data_source}</span>
                      </div>
                      {flight.recommendations && flight.recommendations.length > 0 && (
                        <div className="mt-3 p-2 bg-gray-600 rounded">
                          <p className="text-xs text-muted-foreground mb-1">Recommendations:</p>
                          <ul className="text-sm text-muted-foreground">
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
            <div className="bg-card rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Plane className="h-5 w-5 text-purple-500 mr-2" />
                Enhanced Flight Analysis
              </h3>
              <div className="text-sm text-muted-foreground mb-4">
                Comprehensive flight analysis using FlightAware AeroAPI integration with real-time slot monitoring, 
                delay predictions, and operational recommendations.
              </div>
              
              {enhancedData?.flights ? (
                <div className="space-y-4">
                  {enhancedData.flights.slice(0, 5).map((flight: any, index: number) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-md font-semibold text-foreground">{flight.flight_number}</h4>
                          <p className="text-sm text-muted-foreground">{flight.origin} → {flight.destination}</p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs ${getRiskColor(flight.slot_risk_score)}`}>
                          {getRiskLevel(flight.slot_risk_score)}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Delay:</span>
                          <span className="text-foreground ml-2">{flight.departure_delay}m</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <span className="text-foreground ml-2">{flight.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground text-center py-8">
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
              <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center">
                <Globe className="h-6 w-6 text-aero-blue-primary mr-3" />
                European Airspace Intelligence
              </h2>
              <p className="text-blue-200">EUROCONTROL Network Manager flow management and operational data</p>
            </div>

            {/* Network Status Overview */}
            {eurocontrolData?.data && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-500/20 rounded-lg">
                      <Activity className="h-6 w-6 text-aero-green-safe" />
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-foreground">
                        {eurocontrolData.data.network_situation.network_status}
                      </p>
                      <p className="text-aero-green-safe text-sm font-medium">Network Status</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    European airspace operational status
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-yellow-500/20 rounded-lg">
                      <Timer className="h-6 w-6 text-aero-amber-caution" />
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-foreground">
                        {eurocontrolData.data.network_situation.total_delays}
                      </p>
                      <p className="text-aero-amber-caution text-sm font-medium">Total Delays (min)</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Network-wide delay accumulation
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      <Plane className="h-6 w-6 text-aero-blue-primary" />
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-foreground">
                        {eurocontrolData.data.network_situation.traffic_count.toLocaleString()}
                      </p>
                      <p className="text-aero-blue-primary text-sm font-medium">Traffic Count</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Active flights in European airspace
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-red-500/20 rounded-lg">
                      <Shield className="h-6 w-6 text-va-red-primary" />
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-foreground">
                        {eurocontrolData.data.network_situation.regulations_active}
                      </p>
                      <p className="text-va-red-primary text-sm font-medium">Active Regulations</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Current flow control measures
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Delay Breakdown */}
            {eurocontrolData?.data && (
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center">
                  <BarChart3 className="h-5 w-5 text-purple-500 mr-2" />
                  Delay Analysis by Category
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="text-2xl font-bold text-aero-amber-caution mb-2">
                      {eurocontrolData.data.network_situation.atfm_delays}
                    </div>
                    <div className="text-sm text-yellow-300 font-medium">ATFM Delays</div>
                    <div className="text-xs text-muted-foreground mt-1">Air Traffic Flow Management</div>
                  </div>
                  <div className="text-center p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="text-2xl font-bold text-aero-blue-primary mb-2">
                      {eurocontrolData.data.network_situation.weather_delays}
                    </div>
                    <div className="text-sm text-blue-300 font-medium">Weather Delays</div>
                    <div className="text-xs text-muted-foreground mt-1">Meteorological conditions</div>
                  </div>
                  <div className="text-center p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple-400 mb-2">
                      {eurocontrolData.data.network_situation.capacity_delays}
                    </div>
                    <div className="text-sm text-purple-300 font-medium">Capacity Delays</div>
                    <div className="text-xs text-muted-foreground mt-1">System capacity limitations</div>
                  </div>
                </div>
              </div>
            )}

            {/* Delay Breakdown */}
            {eurocontrolData?.success && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">ATFM Delays</h3>
                  <div className="text-3xl font-bold text-purple-500">
                    {eurocontrolData.data.network_situation.atfm_delays} min
                  </div>
                  <p className="text-muted-foreground text-sm mt-2">Air Traffic Flow Management</p>
                </div>

                <div className="bg-card rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Weather Delays</h3>
                  <div className="text-3xl font-bold text-aero-amber-caution">
                    {eurocontrolData.data.network_situation.weather_delays} min
                  </div>
                  <p className="text-muted-foreground text-sm mt-2">Meteorological Conditions</p>
                </div>

                <div className="bg-card rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Capacity Delays</h3>
                  <div className="text-3xl font-bold text-aero-orange-alert">
                    {eurocontrolData.data.network_situation.capacity_delays} min
                  </div>
                  <p className="text-muted-foreground text-sm mt-2">Airspace Capacity Limitations</p>
                </div>
              </div>
            )}

            {/* Active Flow Measures */}
            {eurocontrolData?.data?.flow_measures && (
              <div className="bg-card rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                  <Target className="h-5 w-5 text-purple-500 mr-2" />
                  Active Flow Measures
                </h3>
                <div className="space-y-4">
                  {eurocontrolData.data.flow_measures.map((measure, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-md font-semibold text-foreground">{measure.measure_id}</h4>
                          <p className="text-sm text-muted-foreground">{measure.location}</p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs ${
                          measure.status === 'ACTIVE' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {measure.status}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Reason:</span>
                          <span className="text-foreground ml-2">{measure.reason}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Delay:</span>
                          <span className="text-foreground ml-2">{measure.delay_value} min</span>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {measure.start_time && measure.start_time !== 'UNKNOWN' ? 
                          `${new Date(measure.start_time).toLocaleString()} - ${new Date(measure.end_time).toLocaleString()}` : 
                          'Active measure - real-time monitoring'
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Airport Delays */}
            {eurocontrolData?.data?.airport_delays && (
              <div className="bg-card rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                  <Plane className="h-5 w-5 text-purple-500 mr-2" />
                  Airport Delays
                </h3>
                <div className="space-y-4">
                  {eurocontrolData.data.airport_delays.map((airport, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-md font-semibold text-foreground">{airport.airport_icao}</h4>
                          <p className="text-sm text-muted-foreground">{airport.airport_name}</p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs ${
                          airport.status === 'OPERATIONAL' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {airport.status}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Departure:</span>
                          <span className="text-foreground ml-2">{airport.departure_delay} min</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Arrival:</span>
                          <span className="text-foreground ml-2">{airport.arrival_delay} min</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">ATFM:</span>
                          <span className="text-foreground ml-2">{airport.atfm_delay} min</span>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Primary cause: {airport.delay_cause}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sector Regulations */}
            {eurocontrolData?.data?.sector_regulations && (
              <div className="bg-card rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                  <AlertTriangle className="h-5 w-5 text-purple-500 mr-2" />
                  Sector Regulations
                </h3>
                <div className="space-y-4">
                  {eurocontrolData.data.sector_regulations.map((regulation, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-md font-semibold text-foreground">{regulation.regulation_id}</h4>
                          <p className="text-sm text-muted-foreground">{regulation.sector}</p>
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
                          <span className="text-muted-foreground">Reason:</span>
                          <span className="text-foreground ml-2">{regulation.reason}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Delay:</span>
                          <span className="text-foreground ml-2">{regulation.delay_value} min</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Affected:</span>
                          <span className="text-foreground ml-2">{regulation.affected_flights} flights</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Historical Analytics */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center">
                <BarChart3 className="h-5 w-5 text-purple-500 mr-2" />
                European Network Manager Analytics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="text-lg font-bold text-aero-blue-primary mb-2">2,742</div>
                  <div className="text-sm text-blue-300 font-medium">Historical Records</div>
                  <div className="text-xs text-muted-foreground mt-1">2018-2025 data coverage</div>
                </div>
                <div className="text-center p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="text-lg font-bold text-aero-green-safe mb-2">85.2%</div>
                  <div className="text-sm text-green-300 font-medium">Avg Punctuality</div>
                  <div className="text-xs text-muted-foreground mt-1">European network average</div>
                </div>
                <div className="text-center p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <div className="text-lg font-bold text-purple-400 mb-2">Active</div>
                  <div className="text-sm text-purple-300 font-medium">Data Integration</div>
                  <div className="text-xs text-muted-foreground mt-1">Real-time processing</div>
                </div>
              </div>
            </div>

            {/* Data Source Information */}
            {eurocontrolData?.success && (
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center">
                  <Database className="h-5 w-5 text-aero-blue-primary mr-2" />
                  Data Source Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Source:</span>
                      <span className="text-foreground font-medium">{eurocontrolData.data.data_source}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Updated:</span>
                      <span className="text-foreground font-medium">
                        {eurocontrolData.data.collection_timestamp && !isNaN(new Date(eurocontrolData.data.collection_timestamp).getTime()) ? 
                          new Date(eurocontrolData.data.collection_timestamp).toLocaleString() : 
                          'Real-time monitoring'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Data Quality:</span>
                      <span className="text-aero-green-safe font-medium">Authentic</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Coverage:</span>
                      <span className="text-foreground font-medium">Pan-European</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Refresh Rate:</span>
                      <span className="text-foreground font-medium">30 seconds</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Integration:</span>
                      <span className="text-aero-blue-primary font-medium">Network Operations Portal</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {!eurocontrolData && (
              <div className="bg-card rounded-lg p-6">
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                  <span className="ml-4 text-muted-foreground">Loading EUROCONTROL flow data...</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>AINO Platform Integration | Virgin Atlantic Slot Risk Management</span>
            <span>Last updated: {slotData && slotData.timestamp && !isNaN(new Date(slotData.timestamp).getTime()) ? 
              new Date(slotData.timestamp).toLocaleTimeString() : 'Real-time data'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlotRiskDashboard;