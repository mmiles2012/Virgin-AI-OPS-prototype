import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface SeasonalPattern {
  month: number;
  monthName: string;
  avgDelayRate: number;
  avgDelayMinutes: number;
  primaryCauses: string[];
  holdingLikelihood: number;
}

interface DelayPrediction {
  flightNumber: string;
  route: string;
  scheduledDeparture: string;
  scheduledArrival: string;
  predictions: {
    delayProbability: number;
    expectedDelayMinutes: number;
    holdingProbability: number;
    expectedHoldingTime: number;
    confidence: number;
  };
  factors: {
    seasonalRisk: number;
    weatherRisk: number;
    trafficRisk: number;
    carrierRisk: number;
    lateAircraftRisk: number;
  };
  recommendations: string[];
}

interface HoldingPatternAnalysis {
  airport: string;
  currentConditions: {
    trafficDensity: number;
    weatherImpact: number;
    runwayCapacity: number;
    currentDelays: number;
  };
  holdingPrediction: {
    likelihood: number;
    estimatedDuration: number;
    fuelImpact: number;
    costImpact: number;
  };
  alternateRecommendations: string[];
}

interface DelayStatistics {
  overview: {
    totalFlights: number;
    totalDelays: number;
    avgDelayRate: number;
    avgDelayMinutes: number;
    dataRange: string;
  };
  causesBreakdown: {
    carrier: number;
    nas: number;
    lateAircraft: number;
    weather: number;
    security: number;
  };
  seasonalTrends: SeasonalPattern[];
  peakMonths: string[];
  bestMonths: string[];
}

const DelayPredictionDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'predict' | 'holding' | 'seasonal'>('overview');
  const [statistics, setStatistics] = useState<DelayStatistics | null>(null);
  const [seasonalPatterns, setSeasonalPatterns] = useState<SeasonalPattern[]>([]);
  const [prediction, setPrediction] = useState<DelayPrediction | null>(null);
  const [holdingAnalysis, setHoldingAnalysis] = useState<HoldingPatternAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  // Flight prediction form state
  const [flightForm, setFlightForm] = useState({
    flightNumber: 'VS001',
    route: 'EGLL-KJFK',
    departureTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
    arrivalTime: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString().slice(0, 16),
    weather: 3,
    traffic: 5,
    carrierStatus: 2
  });

  // Holding analysis form state
  const [holdingForm, setHoldingForm] = useState({
    airport: 'KJFK',
    trafficLevel: 6,
    weatherConditions: 4,
    runwayStatus: 'full'
  });

  useEffect(() => {
    loadStatistics();
    loadSeasonalPatterns();
  }, []);

  const loadStatistics = async () => {
    try {
      const response = await fetch('/api/delays/statistics');
      const data = await response.json();
      if (data.success) {
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error('Failed to load delay statistics:', error);
    }
  };

  const loadSeasonalPatterns = async () => {
    try {
      const response = await fetch('/api/delays/seasonal-patterns');
      const data = await response.json();
      if (data.success) {
        setSeasonalPatterns(data.patterns);
      }
    } catch (error) {
      console.error('Failed to load seasonal patterns:', error);
    }
  };

  const predictFlightDelays = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/delays/predict-flight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flightNumber: flightForm.flightNumber,
          route: flightForm.route,
          departureTime: flightForm.departureTime,
          arrivalTime: flightForm.arrivalTime,
          conditions: {
            weather: flightForm.weather,
            traffic: flightForm.traffic,
            carrierStatus: flightForm.carrierStatus
          }
        }),
      });
      const data = await response.json();
      if (data.success) {
        setPrediction(data.prediction);
      }
    } catch (error) {
      console.error('Failed to predict flight delays:', error);
    }
    setLoading(false);
  };

  const analyzeHoldingPatterns = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/delays/holding-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          airport: holdingForm.airport,
          conditions: {
            trafficLevel: holdingForm.trafficLevel,
            weatherConditions: holdingForm.weatherConditions,
            runwayStatus: holdingForm.runwayStatus
          }
        }),
      });
      const data = await response.json();
      if (data.success) {
        setHoldingAnalysis(data.analysis);
      }
    } catch (error) {
      console.error('Failed to analyze holding patterns:', error);
    }
    setLoading(false);
  };

  const pieChartColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  const causesData = useMemo(() => {
    if (!statistics) return [];
    return [
      { name: 'Carrier Issues', value: statistics.causesBreakdown.carrier, color: '#8884d8' },
      { name: 'Air Traffic (NAS)', value: statistics.causesBreakdown.nas, color: '#82ca9d' },
      { name: 'Late Aircraft', value: statistics.causesBreakdown.lateAircraft, color: '#ffc658' },
      { name: 'Weather', value: statistics.causesBreakdown.weather, color: '#ff7c7c' },
      { name: 'Security', value: statistics.causesBreakdown.security, color: '#8dd1e1' }
    ];
  }, [statistics]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Delay Prediction & Holding Pattern Analysis
          </h1>
          <p className="text-gray-600">
            Advanced predictive analytics using American Airlines operational data from JFK Airport
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview & Statistics' },
                { id: 'predict', label: 'Flight Prediction' },
                { id: 'holding', label: 'Holding Analysis' },
                { id: 'seasonal', label: 'Seasonal Patterns' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && statistics && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-900">Total Flights Analyzed</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {statistics.overview.totalFlights.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-1">{statistics.overview.dataRange}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-900">Average Delay Rate</h3>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {statistics.overview.avgDelayRate}%
                </p>
                <p className="text-sm text-gray-500 mt-1">15+ minute delays</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-900">Average Delay</h3>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {statistics.overview.avgDelayMinutes} min
                </p>
                <p className="text-sm text-gray-500 mt-1">When delays occur</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-900">Peak Season</h3>
                <p className="text-3xl font-bold text-purple-600 mt-2">Summer</p>
                <p className="text-sm text-gray-500 mt-1">{statistics.peakMonths.join(', ')}</p>
              </div>
            </div>

            {/* Delay Causes Chart */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Delay Causes Distribution</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={causesData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {causesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold">Key Insights</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                      <span className="text-sm">
                        <strong>Carrier Issues ({statistics.causesBreakdown.carrier}%)</strong> - 
                        Primary cause including maintenance, crew, and operational delays
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded-full bg-green-500"></div>
                      <span className="text-sm">
                        <strong>Air Traffic ({statistics.causesBreakdown.nas}%)</strong> - 
                        National Airspace System delays from traffic volume
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                      <span className="text-sm">
                        <strong>Late Aircraft ({statistics.causesBreakdown.lateAircraft}%)</strong> - 
                        Cascading delays from previous flights
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Flight Prediction Tab */}
        {activeTab === 'predict' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Flight Delay Prediction</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Flight Number
                    </label>
                    <input
                      type="text"
                      value={flightForm.flightNumber}
                      onChange={(e) => setFlightForm({...flightForm, flightNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Route
                    </label>
                    <input
                      type="text"
                      value={flightForm.route}
                      onChange={(e) => setFlightForm({...flightForm, route: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Departure Time
                      </label>
                      <input
                        type="datetime-local"
                        value={flightForm.departureTime}
                        onChange={(e) => setFlightForm({...flightForm, departureTime: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Arrival Time
                      </label>
                      <input
                        type="datetime-local"
                        value={flightForm.arrivalTime}
                        onChange={(e) => setFlightForm({...flightForm, arrivalTime: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weather Risk (0-10): {flightForm.weather}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={flightForm.weather}
                      onChange={(e) => setFlightForm({...flightForm, weather: parseInt(e.target.value)})}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Traffic Level (0-10): {flightForm.traffic}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={flightForm.traffic}
                      onChange={(e) => setFlightForm({...flightForm, traffic: parseInt(e.target.value)})}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Carrier Status (0-10): {flightForm.carrierStatus}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={flightForm.carrierStatus}
                      onChange={(e) => setFlightForm({...flightForm, carrierStatus: parseInt(e.target.value)})}
                      className="w-full"
                    />
                  </div>
                  <button
                    onClick={predictFlightDelays}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Analyzing...' : 'Predict Delays'}
                  </button>
                </div>
              </div>

              {prediction && (
                <div className="mt-6 border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Prediction Results for {prediction.flightNumber}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-red-900">Delay Probability</h4>
                      <p className="text-2xl font-bold text-red-600 mt-1">
                        {(prediction.predictions.delayProbability * 100).toFixed(1)}%
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        Expected: {prediction.predictions.expectedDelayMinutes} minutes
                      </p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-orange-900">Holding Probability</h4>
                      <p className="text-2xl font-bold text-orange-600 mt-1">
                        {(prediction.predictions.holdingProbability * 100).toFixed(1)}%
                      </p>
                      <p className="text-sm text-orange-700 mt-1">
                        Expected: {prediction.predictions.expectedHoldingTime} minutes
                      </p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-900">Confidence</h4>
                      <p className="text-2xl font-bold text-blue-600 mt-1">
                        {(prediction.predictions.confidence * 100).toFixed(1)}%
                      </p>
                      <p className="text-sm text-blue-700 mt-1">Based on historical data</p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Risk Factors</h4>
                      <div className="space-y-2">
                        {Object.entries(prediction.factors).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center">
                            <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-red-600 h-2 rounded-full"
                                  style={{ width: `${value * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">{(value * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Recommendations</h4>
                      <ul className="space-y-2">
                        {prediction.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-sm">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Holding Analysis Tab */}
        {activeTab === 'holding' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Holding Pattern Analysis</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Airport Code
                    </label>
                    <input
                      type="text"
                      value={holdingForm.airport}
                      onChange={(e) => setHoldingForm({...holdingForm, airport: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Traffic Level (0-10): {holdingForm.trafficLevel}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={holdingForm.trafficLevel}
                      onChange={(e) => setHoldingForm({...holdingForm, trafficLevel: parseInt(e.target.value)})}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weather Conditions (0-10): {holdingForm.weatherConditions}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={holdingForm.weatherConditions}
                      onChange={(e) => setHoldingForm({...holdingForm, weatherConditions: parseInt(e.target.value)})}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Runway Status
                    </label>
                    <select
                      value={holdingForm.runwayStatus}
                      onChange={(e) => setHoldingForm({...holdingForm, runwayStatus: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="full">Full Operations</option>
                      <option value="reduced">Reduced Capacity</option>
                      <option value="limited">Limited Operations</option>
                    </select>
                  </div>
                  <button
                    onClick={analyzeHoldingPatterns}
                    disabled={loading}
                    className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50"
                  >
                    {loading ? 'Analyzing...' : 'Analyze Holding Patterns'}
                  </button>
                </div>

                {holdingAnalysis && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Analysis Results for {holdingAnalysis.airport}</h3>
                    
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-orange-900">Holding Likelihood</h4>
                      <p className="text-3xl font-bold text-orange-600 mt-1">
                        {(holdingAnalysis.holdingPrediction.likelihood * 100).toFixed(1)}%
                      </p>
                      <p className="text-sm text-orange-700 mt-1">
                        Estimated Duration: {holdingAnalysis.holdingPrediction.estimatedDuration} minutes
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-red-50 p-3 rounded">
                        <h5 className="font-medium text-red-900">Fuel Impact</h5>
                        <p className="text-xl font-bold text-red-600">{holdingAnalysis.holdingPrediction.fuelImpact} kg</p>
                      </div>
                      <div className="bg-purple-50 p-3 rounded">
                        <h5 className="font-medium text-purple-900">Cost Impact</h5>
                        <p className="text-xl font-bold text-purple-600">${holdingAnalysis.holdingPrediction.costImpact}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Current Conditions</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Traffic Density:</span>
                          <span className="font-medium">{holdingAnalysis.currentConditions.trafficDensity}/10</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Weather Impact:</span>
                          <span className="font-medium">{holdingAnalysis.currentConditions.weatherImpact}/10</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Runway Capacity:</span>
                          <span className="font-medium">{holdingAnalysis.currentConditions.runwayCapacity}/10</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Current Delays:</span>
                          <span className="font-medium">{holdingAnalysis.currentConditions.currentDelays}%</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Alternate Recommendations</h4>
                      <ul className="space-y-1">
                        {holdingAnalysis.alternateRecommendations.map((rec, index) => (
                          <li key={index} className="text-sm flex items-start space-x-2">
                            <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mt-2 flex-shrink-0"></div>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Seasonal Patterns Tab */}
        {activeTab === 'seasonal' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Seasonal Delay Patterns</h2>
              <div className="mb-6">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={seasonalPatterns}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monthName" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avgDelayRate" fill="#8884d8" name="Avg Delay Rate (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Monthly Holding Likelihood</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={seasonalPatterns}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="monthName" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="holdingLikelihood" 
                        stroke="#ff7c7c" 
                        strokeWidth={2}
                        name="Holding Likelihood"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Key Insights</h3>
                  <div className="space-y-4">
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-red-900">Peak Delay Months</h4>
                      <p className="text-sm text-red-700 mt-1">
                        Summer months (June, July, August) show the highest delay rates and holding pattern likelihood
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-900">Best Performance</h4>
                      <p className="text-sm text-green-700 mt-1">
                        October and November typically have the lowest delay rates and minimal holding patterns
                      </p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-900">Weather Impact</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Winter storms and summer thunderstorms significantly increase delay probability
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DelayPredictionDashboard;