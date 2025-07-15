import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Activity, 
  AlertTriangle, 
  CheckCircle,
  ArrowLeft,
  Calendar,
  Clock,
  Target
} from 'lucide-react';

interface AnalyticsData {
  success: boolean;
  analytics: {
    overall: {
      avgArrivalPunctuality: number;
      avgDeparturePunctuality: number;
      avgOperationalSchedule: number;
      totalRecords: number;
      dateRange: {
        start: string;
        end: string;
      };
    };
    monthly_trends: Array<{
      month: string;
      avgArrivalPunctuality: number;
      avgDeparturePunctuality: number;
      avgOperationalSchedule: number;
    }>;
    european_airspace_insights: {
      data_source: string;
      coverage: string;
      punctuality_standard: string;
      regulatory_authority: string;
    };
  };
}

interface AdvancedAnalyticsDashboardProps {
  onBack: () => void;
}

const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsDashboardProps> = ({ onBack }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'overview' | 'trends' | 'insights'>('overview');

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/nm-punctuality/analytics');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch analytics data');
      }
      
      setAnalyticsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center space-x-3">
            <Activity className="h-8 w-8 text-blue-500 animate-spin" />
            <span className="text-xl">Loading Advanced Analytics...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <button 
            onClick={onBack}
            className="mb-6 flex items-center text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Slot Risk Dashboard
          </button>
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-red-400">Analytics Error</h3>
                <p className="text-red-300 mt-1">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) return null;

  const { analytics } = analyticsData;

  // Prepare pie chart data for overview
  const overviewData = [
    { name: 'Arrival Punctuality', value: analytics.overall.avgArrivalPunctuality, color: '#3B82F6' },
    { name: 'Departure Punctuality', value: analytics.overall.avgDeparturePunctuality, color: '#10B981' },
    { name: 'Operational Schedule', value: analytics.overall.avgOperationalSchedule, color: '#F59E0B' }
  ];

  // Prepare trend data for line chart
  const trendData = analytics.monthly_trends.map(trend => ({
    month: trend.month.split('-')[1], // Extract month from YYYY-MM
    arrivals: trend.avgArrivalPunctuality,
    departures: trend.avgDeparturePunctuality,
    operational: trend.avgOperationalSchedule
  }));

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={onBack}
            className="mb-4 flex items-center text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Slot Risk Dashboard
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">Advanced Analytics Dashboard</h1>
          <p className="text-gray-400">
            European Network Manager Punctuality Analysis | {analytics.european_airspace_insights.regulatory_authority}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-800 rounded-lg p-1">
          {[
            { id: 'overview', label: 'Overview', icon: Target },
            { id: 'trends', label: 'Trends', icon: TrendingUp },
            { id: 'insights', label: 'Insights', icon: Activity }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSelectedView(id as any)}
              className={`flex items-center px-6 py-3 rounded-lg transition-colors ${
                selectedView === id 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Icon className="h-5 w-5 mr-2" />
              {label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {selectedView === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400">Avg Arrival Punctuality</p>
                    <p className="text-2xl font-bold text-blue-400">{analytics.overall.avgArrivalPunctuality}%</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-blue-400" />
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400">Avg Departure Punctuality</p>
                    <p className="text-2xl font-bold text-green-400">{analytics.overall.avgDeparturePunctuality}%</p>
                  </div>
                  <Clock className="h-8 w-8 text-green-400" />
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400">Operational Schedule</p>
                    <p className="text-2xl font-bold text-yellow-400">{analytics.overall.avgOperationalSchedule}%</p>
                  </div>
                  <Calendar className="h-8 w-8 text-yellow-400" />
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400">Total Records</p>
                    <p className="text-2xl font-bold text-white">{analytics.overall.totalRecords.toLocaleString()}</p>
                  </div>
                  <Activity className="h-8 w-8 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Performance Overview Chart */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-6">Performance Overview</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={overviewData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {overviewData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Trends Tab */}
        {selectedView === 'trends' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-6">Monthly Performance Trends</h3>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        color: '#F9FAFB'
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="arrivals" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      name="Arrival Punctuality"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="departures" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      name="Departure Punctuality"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="operational" 
                      stroke="#F59E0B" 
                      strokeWidth={2}
                      name="Operational Schedule"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Comparison */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-6">Monthly Comparison</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        color: '#F9FAFB'
                      }} 
                    />
                    <Bar dataKey="arrivals" fill="#3B82F6" name="Arrivals" />
                    <Bar dataKey="departures" fill="#10B981" name="Departures" />
                    <Bar dataKey="operational" fill="#F59E0B" name="Operational" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Insights Tab */}
        {selectedView === 'insights' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Data Source Information */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Data Source Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-400">Source</p>
                    <p className="text-white">{analytics.european_airspace_insights.data_source}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Coverage</p>
                    <p className="text-white">{analytics.european_airspace_insights.coverage}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Authority</p>
                    <p className="text-white">{analytics.european_airspace_insights.regulatory_authority}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Standard</p>
                    <p className="text-white">{analytics.european_airspace_insights.punctuality_standard}</p>
                  </div>
                </div>
              </div>

              {/* Date Range */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Analysis Period</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-400">Start Date</p>
                    <p className="text-white">{analytics.overall.dateRange.start}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">End Date</p>
                    <p className="text-white">{analytics.overall.dateRange.end}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Total Records</p>
                    <p className="text-white">{analytics.overall.totalRecords.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Insights */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Key Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="h-5 w-5 text-blue-400 mr-2" />
                    <span className="text-blue-400 font-medium">Arrival Performance</span>
                  </div>
                  <p className="text-sm text-gray-300">
                    Average arrival punctuality of {analytics.overall.avgArrivalPunctuality}% across European network
                  </p>
                </div>
                <div className="bg-green-900/20 border border-green-500 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Clock className="h-5 w-5 text-green-400 mr-2" />
                    <span className="text-green-400 font-medium">Departure Performance</span>
                  </div>
                  <p className="text-sm text-gray-300">
                    Departure punctuality at {analytics.overall.avgDeparturePunctuality}% maintains high standards
                  </p>
                </div>
                <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Activity className="h-5 w-5 text-yellow-400 mr-2" />
                    <span className="text-yellow-400 font-medium">Operational Efficiency</span>
                  </div>
                  <p className="text-sm text-gray-300">
                    {analytics.overall.avgOperationalSchedule}% operational schedule adherence
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <div className="flex justify-between items-center text-sm text-gray-400">
            <span>AINO Platform | Advanced Analytics Dashboard</span>
            <span>Data updated: {new Date().toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;