import React, { useEffect, useState } from "react";
import { AlertTriangle, TrendingDown, TrendingUp, Activity } from "lucide-react";

interface CorrelationData {
  correlations: {
    dep_punctuality_vs_lhr_dep_delay: number;
    arr_punctuality_vs_lhr_arr_delay: number;
    dep_punctuality_vs_lhr_arr_delay: number;
    arr_punctuality_vs_lhr_dep_delay: number;
    "DEP_PUN_DY vs LHR_DEP_DELAY_MIN": number;
    "ARR_PUN_DY vs LHR_ARR_DELAY_MIN": number;
  };
  statistics: {
    avg_nm_dep_punctuality: number;
    avg_nm_arr_punctuality: number;
    avg_lhr_dep_delay: number;
    avg_lhr_arr_delay: number;
    lhr_dep_delay_std: number;
    lhr_arr_delay_std: number;
  };
  monthly_trends: Array<{
    month: number;
    nm_dep_punctuality: number;
    nm_arr_punctuality: number;
    lhr_avg_dep_delay: number;
    lhr_avg_arr_delay: number;
    record_count: number;
  }>;
  operational_insights: {
    network_impact: {
      dep_correlation_strength: string;
      arr_correlation_strength: string;
    };
    predictive_power: {
      nm_dep_as_predictor: boolean;
      nm_arr_as_predictor: boolean;
      cross_correlation_significant: boolean;
    };
    risk_factors: {
      high_delay_frequency: number;
      average_nm_punctuality_below_90: boolean;
      delay_variability_high: boolean;
    };
    recommendations: Array<{
      priority: string;
      category: string;
      recommendation: string;
      implementation: string;
    }>;
  };
  record_count: number;
  date_range: {
    start: string;
    end: string;
  };
}

export default function CorrelationTile() {
  const [data, setData] = useState<CorrelationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/lhr-nm-correlation")
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching correlation data:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const getCorrelationIcon = (strength: string) => {
    switch (strength) {
      case "Strong": return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "Moderate": return <Activity className="w-4 h-4 text-yellow-600" />;
      case "Weak": return <TrendingDown className="w-4 h-4 text-orange-600" />;
      default: return <AlertTriangle className="w-4 h-4 text-red-600" />;
    }
  };

  const getCorrelationColor = (strength: string) => {
    switch (strength) {
      case "Strong": return "text-green-600 bg-green-50";
      case "Moderate": return "text-yellow-600 bg-yellow-50";
      case "Weak": return "text-orange-600 bg-orange-50";
      default: return "text-red-600 bg-red-50";
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white shadow-lg rounded-lg border border-purple-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="text-center text-gray-500 mt-4">Loading correlation analysis...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white shadow-lg rounded-lg border border-red-200">
        <div className="flex items-center space-x-2 text-red-600 mb-2">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Correlation Analysis Error</h3>
        </div>
        <p className="text-red-600 text-sm">{error}</p>
        <p className="text-gray-500 text-xs mt-2">Please check API connectivity and data availability.</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 bg-white shadow-lg rounded-lg border border-gray-200">
        <div className="text-center text-gray-500">No correlation data available</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg border border-purple-200">
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
        <h3 className="text-lg font-semibold text-gray-900">
          European NM ↔ Heathrow Correlation Analysis
        </h3>
      </div>

      {/* Core Correlations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">Departure Correlation</span>
            {getCorrelationIcon(data.operational_insights.network_impact.dep_correlation_strength)}
          </div>
          <div className="text-2xl font-bold text-blue-700">
            {data.correlations["DEP_PUN_DY vs LHR_DEP_DELAY_MIN"]}
          </div>
          <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${getCorrelationColor(data.operational_insights.network_impact.dep_correlation_strength)}`}>
            {data.operational_insights.network_impact.dep_correlation_strength}
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-900">Arrival Correlation</span>
            {getCorrelationIcon(data.operational_insights.network_impact.arr_correlation_strength)}
          </div>
          <div className="text-2xl font-bold text-green-700">
            {data.correlations["ARR_PUN_DY vs LHR_ARR_DELAY_MIN"]}
          </div>
          <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${getCorrelationColor(data.operational_insights.network_impact.arr_correlation_strength)}`}>
            {data.operational_insights.network_impact.arr_correlation_strength}
          </div>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="text-center">
          <div className="text-lg font-semibold text-purple-600">
            {data.statistics.avg_nm_dep_punctuality}%
          </div>
          <div className="text-xs text-gray-500">Avg NM Dep Punctuality</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-purple-600">
            {data.statistics.avg_nm_arr_punctuality}%
          </div>
          <div className="text-xs text-gray-500">Avg NM Arr Punctuality</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-orange-600">
            {data.statistics.avg_lhr_dep_delay}min
          </div>
          <div className="text-xs text-gray-500">Avg LHR Dep Delay</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-orange-600">
            {data.statistics.avg_lhr_arr_delay}min
          </div>
          <div className="text-xs text-gray-500">Avg LHR Arr Delay</div>
        </div>
      </div>

      {/* Predictive Power Indicators */}
      {data.operational_insights.predictive_power && (
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Predictive Intelligence</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${data.operational_insights.predictive_power.nm_dep_as_predictor ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-gray-700">NM Dep Predictive</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${data.operational_insights.predictive_power.nm_arr_as_predictor ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-gray-700">NM Arr Predictive</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${data.operational_insights.predictive_power.cross_correlation_significant ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-gray-700">Cross-Correlation</span>
            </div>
          </div>
        </div>
      )}

      {/* Risk Factors */}
      {data.operational_insights.risk_factors && (
        <div className="bg-yellow-50 p-4 rounded-lg mb-4">
          <h4 className="text-sm font-semibold text-yellow-900 mb-2">Risk Assessment</h4>
          <div className="text-xs text-yellow-800">
            High delay frequency: {data.operational_insights.risk_factors.high_delay_frequency}% 
            {data.operational_insights.risk_factors.average_nm_punctuality_below_90 && " • NM punctuality <90%"}
            {data.operational_insights.risk_factors.delay_variability_high && " • High delay variability"}
          </div>
        </div>
      )}

      {/* Recommendations Preview */}
      {data.operational_insights.recommendations && data.operational_insights.recommendations.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Priority Recommendations</h4>
          <div className="space-y-2">
            {data.operational_insights.recommendations.slice(0, 2).map((rec, index) => (
              <div key={index} className="flex items-start space-x-2">
                <div className={`w-2 h-2 rounded-full mt-1.5 ${rec.priority === 'High' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                <div className="text-xs text-gray-700">
                  <span className="font-medium">{rec.category}:</span> {rec.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Source Footer */}
      <div className="border-t pt-3 mt-4">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Based on {data.record_count.toLocaleString()} NM records</span>
          <span>Period: {data.date_range.start} → {data.date_range.end}</span>
        </div>
      </div>
    </div>
  );
}