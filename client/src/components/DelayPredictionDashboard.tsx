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
  riskExplanations?: {
    seasonalRisk: {
      level: string;
      explanation: string;
      mitigationSteps: string[];
    };
    weatherRisk: {
      level: string;
      explanation: string;
      mitigationSteps: string[];
    };
    trafficRisk: {
      level: string;
      explanation: string;
      mitigationSteps: string[];
    };
    carrierRisk: {
      level: string;
      explanation: string;
      mitigationSteps: string[];
    };
  };
  operationalGuidance?: {
    flightPlanning: {
      recommendation: string;
      actions: string[];
    };
    fuelStrategy: {
      strategy: string;
      fuelAddition: string;
      reasoning: string;
    };
    passengerCommunication: {
      timing: string;
      message: string;
      channels: string[];
    };
    crewConsiderations: {
      briefingFocus: string;
      considerations: string[];
    };
    alternateOptions: {
      priority: string;
      options: string[];
    };
  };
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
  const [activeTab, setActiveTab] = useState<'overview' | 'predict' | 'holding' | 'seasonal' | 'heathrow' | 'tensorflow' | 'dual-model' | 'training'>('overview');
  const [statistics, setStatistics] = useState<DelayStatistics | null>(null);
  const [seasonalPatterns, setSeasonalPatterns] = useState<SeasonalPattern[]>([]);
  const [prediction, setPrediction] = useState<DelayPrediction | null>(null);
  const [holdingAnalysis, setHoldingAnalysis] = useState<HoldingPatternAnalysis | null>(null);
  const [heathrowMetrics, setHeathrowMetrics] = useState<any>(null);
  const [heathrowPrediction, setHeathrowPrediction] = useState<any>(null);
  const [heathrowAirlines, setHeathrowAirlines] = useState<any[]>([]);
  const [tensorflowStatus, setTensorflowStatus] = useState<any>(null);
  const [tensorflowPrediction, setTensorflowPrediction] = useState<any>(null);
  const [tensorflowModelInfo, setTensorflowModelInfo] = useState<any>(null);
  const [dualModelStatus, setDualModelStatus] = useState<any>(null);
  const [dualModelPrediction, setDualModelPrediction] = useState<any>(null);
  const [dualModelInfo, setDualModelInfo] = useState<any>(null);
  const [aiHoldingPrediction, setAiHoldingPrediction] = useState<any>(null);
  const [trainingStatus, setTrainingStatus] = useState<any>(null);
  const [trainingProgress, setTrainingProgress] = useState<string[]>([]);
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

  // UK CAA Heathrow form state
  const [heathrowForm, setHeathrowForm] = useState({
    flightNumber: 'BA001',
    airline: 'British Airways',
    route: 'Sydney',
    operationType: 'scheduled'
  });

  useEffect(() => {
    loadStatistics();
    loadSeasonalPatterns();
    if (activeTab === 'heathrow') {
      loadHeathrowMetrics();
      loadHeathrowAirlines();
    }
    if (activeTab === 'tensorflow') {
      loadTensorflowStatus();
      loadTensorflowModelInfo();
    }
    if (activeTab === 'dual-model') {
      loadDualModelStatus();
      loadDualModelInfo();
    }
  }, [activeTab]);

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

  const loadHeathrowMetrics = async () => {
    try {
      const response = await fetch('/api/delays/heathrow/metrics');
      const data = await response.json();
      if (data.success) {
        setHeathrowMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Failed to load Heathrow metrics:', error);
    }
  };

  const loadHeathrowAirlines = async () => {
    try {
      const response = await fetch('/api/delays/heathrow/airlines');
      const data = await response.json();
      if (data.success) {
        setHeathrowAirlines(data.airlines);
      }
    } catch (error) {
      console.error('Failed to load Heathrow airlines:', error);
    }
  };

  const predictHeathrowFlight = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/delays/heathrow/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flightNumber: heathrowForm.flightNumber,
          airline: heathrowForm.airline,
          route: heathrowForm.route,
          operationType: heathrowForm.operationType
        }),
      });
      const data = await response.json();
      if (data.success) {
        setHeathrowPrediction(data.prediction);
      }
    } catch (error) {
      console.error('Failed to predict Heathrow flight:', error);
    }
    setLoading(false);
  };

  const loadTensorflowStatus = async () => {
    try {
      const response = await fetch('/api/delays/tensorflow/status');
      const data = await response.json();
      if (data.success) {
        setTensorflowStatus(data.status);
      }
    } catch (error) {
      console.error('Failed to load TensorFlow status:', error);
    }
  };

  const loadTensorflowModelInfo = async () => {
    try {
      const response = await fetch('/api/delays/tensorflow/model-info');
      const data = await response.json();
      if (data.success) {
        setTensorflowModelInfo(data.modelInfo);
      }
    } catch (error) {
      console.error('Failed to load TensorFlow model info:', error);
    }
  };

  const trainTensorflowModel = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/delays/tensorflow/train', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        await loadTensorflowStatus();
        await loadTensorflowModelInfo();
      }
    } catch (error) {
      console.error('Failed to train TensorFlow model:', error);
    }
    setLoading(false);
  };

  const predictWithTensorflow = async () => {
    setLoading(true);
    try {
      const currentMonth = new Date().getMonth() + 1;
      const response = await fetch('/api/delays/tensorflow/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flightNumber: flightForm.flightNumber,
          route: flightForm.route,
          month: currentMonth,
          weather: flightForm.weather,
          traffic: flightForm.traffic,
          carrierStatus: flightForm.carrierStatus
        }),
      });
      const data = await response.json();
      if (data.success) {
        setTensorflowPrediction(data.prediction);
      }
    } catch (error) {
      console.error('Failed to predict with TensorFlow:', error);
    }
    setLoading(false);
  };

  const loadDualModelStatus = async () => {
    try {
      const response = await fetch('/api/delays/dual-model/status');
      const data = await response.json();
      if (data.success) {
        setDualModelStatus(data.status);
      }
    } catch (error) {
      console.error('Failed to load dual-model status:', error);
    }
  };

  const loadDualModelInfo = async () => {
    try {
      const response = await fetch('/api/delays/dual-model/info');
      const data = await response.json();
      if (data.success) {
        setDualModelInfo(data.modelInfo);
      }
    } catch (error) {
      console.error('Failed to load dual-model info:', error);
    }
  };

  const trainDualModelSystem = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/delays/dual-model/train', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        await loadDualModelStatus();
        await loadDualModelInfo();
      }
    } catch (error) {
      console.error('Failed to train dual-model system:', error);
    }
    setLoading(false);
  };

  const predictWithDualModel = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/delays/dual-model/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flightNumber: flightForm.flightNumber,
          route: flightForm.route,
          airport: 'EGLL',
          destination: flightForm.route.split(' → ')[1] || 'International',
          airline: flightForm.airline || 'British Airways',
          weather: flightForm.weather,
          traffic: flightForm.traffic
        }),
      });
      const data = await response.json();
      if (data.success) {
        setDualModelPrediction(data.prediction);
      }
    } catch (error) {
      console.error('Failed to predict with dual-model:', error);
    }
    setLoading(false);
  };

  const generateAiHoldingPrediction = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/delays/ai-holding-prediction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flightNumber: flightForm.flightNumber,
          route: flightForm.route,
          airport: holdingForm.airport,
          trafficLevel: holdingForm.trafficLevel,
          weatherConditions: holdingForm.weatherConditions,
          runwayStatus: holdingForm.runwayStatus
        }),
      });
      const data = await response.json();
      if (data.success) {
        setAiHoldingPrediction(data.prediction);
      }
    } catch (error) {
      console.error('Failed to generate AI holding prediction:', error);
    }
    setLoading(false);
  };

  const forwardToFlightPlanning = async (predictionData: any) => {
    try {
      const response = await fetch('/api/flight-planning/holding-prediction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prediction: predictionData,
          timestamp: new Date().toISOString(),
          sentBy: 'Delay Prediction System'
        }),
      });
      const data = await response.json();
      if (data.success) {
        alert('AI Holding Prediction forwarded to Flight Planning successfully!');
      }
    } catch (error) {
      console.error('Failed to forward to flight planning:', error);
      alert('Failed to forward to Flight Planning. Please try again.');
    }
  };

  const startNeuralNetworkTraining = async () => {
    setLoading(true);
    setTrainingStatus({ status: 'training', progress: 0 });
    setTrainingProgress(['Starting TensorFlow neural network training...']);
    
    try {
      const response = await fetch('/api/delays/tensorflow/train', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setTrainingStatus({ 
          status: 'completed', 
          progress: 100,
          performance: data.model_performance,
          trainingTime: data.training_time
        });
        setTrainingProgress(prev => [...prev, 'Training completed successfully!', 
          `Training time: ${data.training_time}`, 
          `Model performance: ${JSON.stringify(data.model_performance)}`
        ]);
      } else {
        setTrainingStatus({ status: 'failed', error: data.error });
        setTrainingProgress(prev => [...prev, `Training failed: ${data.error}`]);
      }
    } catch (error) {
      setTrainingStatus({ status: 'failed', error: error.message });
      setTrainingProgress(prev => [...prev, `Training error: ${error.message}`]);
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
                { id: 'seasonal', label: 'Seasonal Patterns' },
                { id: 'heathrow', label: 'Heathrow Analysis' },
                { id: 'tensorflow', label: 'AI Neural Network' },
                { id: 'dual-model', label: 'Dual-Model AI' },
                { id: 'training', label: 'AI Training Monitor' }
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

                  {/* Risk Factor Explanations */}
                  {prediction.riskExplanations && (
                    <div className="mt-6">
                      <h4 className="font-semibold mb-4">Risk Factor Analysis</h4>
                      <div className="space-y-4">
                        {Object.entries(prediction.riskExplanations).map(([riskType, riskData]: [string, any]) => (
                          <div key={riskType} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium capitalize">{riskType.replace('Risk', ' Risk')}</h5>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                riskData.level === 'HIGH' ? 'bg-red-100 text-red-800' :
                                riskData.level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {riskData.level} RISK
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-3">{riskData.explanation}</p>
                            <div>
                              <h6 className="font-medium text-sm mb-1">Mitigation Steps:</h6>
                              <ul className="space-y-1">
                                {riskData.mitigationSteps.map((step: string, stepIndex: number) => (
                                  <li key={stepIndex} className="flex items-start space-x-2">
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                                    <span className="text-xs text-gray-600">{step}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Operational Guidance */}
                  {prediction.operationalGuidance && (
                    <div className="mt-6">
                      <h4 className="font-semibold mb-4">Operational Guidance</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Flight Planning */}
                        <div className="border rounded-lg p-4">
                          <h5 className="font-medium mb-2">Flight Planning</h5>
                          <p className="text-sm font-medium text-blue-600 mb-2">
                            {prediction.operationalGuidance.flightPlanning.recommendation}
                          </p>
                          <ul className="space-y-1">
                            {prediction.operationalGuidance.flightPlanning.actions.map((action: string, index: number) => (
                              <li key={index} className="text-xs text-gray-600 flex items-start space-x-1">
                                <span className="text-blue-500">•</span>
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Fuel Strategy */}
                        <div className="border rounded-lg p-4">
                          <h5 className="font-medium mb-2">Fuel Strategy</h5>
                          <p className="text-sm font-medium text-orange-600 mb-1">
                            {prediction.operationalGuidance.fuelStrategy.strategy}
                          </p>
                          <p className="text-sm font-semibold mb-2">
                            {prediction.operationalGuidance.fuelStrategy.fuelAddition}
                          </p>
                          <p className="text-xs text-gray-600">
                            {prediction.operationalGuidance.fuelStrategy.reasoning}
                          </p>
                        </div>

                        {/* Passenger Communication */}
                        <div className="border rounded-lg p-4">
                          <h5 className="font-medium mb-2">Passenger Communication</h5>
                          <p className="text-sm font-medium text-green-600 mb-1">
                            {prediction.operationalGuidance.passengerCommunication.timing}
                          </p>
                          <p className="text-sm mb-2">
                            {prediction.operationalGuidance.passengerCommunication.message}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {prediction.operationalGuidance.passengerCommunication.channels.map((channel: string, index: number) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 text-xs rounded">
                                {channel}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Crew Considerations */}
                        <div className="border rounded-lg p-4">
                          <h5 className="font-medium mb-2">Crew Considerations</h5>
                          <p className="text-sm font-medium text-purple-600 mb-2">
                            {prediction.operationalGuidance.crewConsiderations.briefingFocus}
                          </p>
                          <ul className="space-y-1">
                            {prediction.operationalGuidance.crewConsiderations.considerations.map((consideration: string, index: number) => (
                              <li key={index} className="text-xs text-gray-600 flex items-start space-x-1">
                                <span className="text-purple-500">•</span>
                                <span>{consideration}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Alternate Options */}
                      <div className="mt-4 border rounded-lg p-4">
                        <h5 className="font-medium mb-2">Alternate Options</h5>
                        <p className="text-sm font-medium text-red-600 mb-2">
                          Priority: {prediction.operationalGuidance.alternateOptions.priority}
                        </p>
                        <ul className="space-y-1">
                          {prediction.operationalGuidance.alternateOptions.options.map((option: string, index: number) => (
                            <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                              <span className="text-red-500">▶</span>
                              <span>{option}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
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
              
              {/* Legend for Traffic and Weather Conditions */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold mb-3 text-gray-900">Operational Scale Legend</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-sm mb-2 text-blue-900">Traffic Level Scale (0-10)</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-green-700">0-2: Light Traffic</span>
                        <span className="text-gray-600">Minimal aircraft movements, free flow</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-yellow-700">3-5: Moderate Traffic</span>
                        <span className="text-gray-600">Normal operations, some sequencing</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-orange-700">6-7: Heavy Traffic</span>
                        <span className="text-gray-600">High volume, extended sequencing</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-700">8-10: Congested</span>
                        <span className="text-gray-600">Peak capacity, holding likely</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2 text-purple-900">Weather Conditions Scale (0-10)</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-green-700">0-2: Clear Conditions</span>
                        <span className="text-gray-600">CAVOK, unlimited visibility</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">3-4: Good Conditions</span>
                        <span className="text-gray-600">Light clouds, good visibility</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-orange-700">5-7: Marginal Weather</span>
                        <span className="text-gray-600">Low clouds, reduced visibility</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-700">8-10: Severe Weather</span>
                        <span className="text-gray-600">Storms, fog, wind shear</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

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
                    <div className="text-xs text-gray-500 mt-1">
                      {holdingForm.trafficLevel <= 2 ? 'Light Traffic' :
                       holdingForm.trafficLevel <= 5 ? 'Moderate Traffic' :
                       holdingForm.trafficLevel <= 7 ? 'Heavy Traffic' : 'Congested'}
                    </div>
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
                    <div className="text-xs text-gray-500 mt-1">
                      {holdingForm.weatherConditions <= 2 ? 'Clear Conditions' :
                       holdingForm.weatherConditions <= 4 ? 'Good Conditions' :
                       holdingForm.weatherConditions <= 7 ? 'Marginal Weather' : 'Severe Weather'}
                    </div>
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
                  <div className="max-h-[500px] overflow-y-auto space-y-4 pr-2 animate-in slide-in-from-right-2 duration-500">
                    <h3 className="text-lg font-semibold sticky top-0 bg-white py-2 border-b shadow-sm z-10 animate-in fade-in duration-300">
                      Analysis Results for {holdingAnalysis.airport}
                    </h3>
                    
                    <div className="bg-orange-50 p-4 rounded-lg animate-in slide-in-from-bottom-3 duration-700 hover:shadow-md transition-all">
                      <h4 className="font-semibold text-orange-900">Holding Likelihood</h4>
                      <p className="text-3xl font-bold text-orange-600 mt-1 animate-in zoom-in duration-1000 delay-300">
                        {(holdingAnalysis.holdingPrediction.likelihood * 100).toFixed(1)}%
                      </p>
                      <p className="text-sm text-orange-700 mt-1 animate-in fade-in duration-500 delay-500">
                        Estimated Duration: {holdingAnalysis.holdingPrediction.estimatedDuration} minutes
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-red-50 p-3 rounded animate-in slide-in-from-left-2 duration-600 delay-200 hover:bg-red-100 transition-colors">
                        <h5 className="font-medium text-red-900">Fuel Impact</h5>
                        <p className="text-xl font-bold text-red-600 animate-in zoom-in duration-800 delay-400">{holdingAnalysis.holdingPrediction.fuelImpact} kg</p>
                        <p className="text-xs text-red-700 mt-1 animate-in fade-in duration-500 delay-600">
                          Based on {(holdingAnalysis.holdingPrediction.estimatedDuration / 60).toFixed(1)} hours holding
                        </p>
                      </div>
                      <div className="bg-purple-50 p-3 rounded animate-in slide-in-from-right-2 duration-600 delay-300 hover:bg-purple-100 transition-colors">
                        <h5 className="font-medium text-purple-900">Cost Impact</h5>
                        <p className="text-xl font-bold text-purple-600 animate-in zoom-in duration-800 delay-500">${holdingAnalysis.holdingPrediction.costImpact}</p>
                        <p className="text-xs text-purple-700 mt-1 animate-in fade-in duration-500 delay-700">
                          Fuel + operational costs
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg animate-in slide-in-from-bottom-2 duration-800 delay-400 hover:bg-gray-100 transition-colors">
                      <h4 className="font-semibold mb-3 text-gray-900 animate-in fade-in duration-500 delay-600">Current Conditions Assessment</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center animate-in slide-in-from-left-1 duration-600 delay-700">
                            <span>Traffic Density:</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out animate-in slide-in-from-left-full delay-800"
                                  style={{ width: `${(holdingAnalysis.currentConditions.trafficDensity / 10) * 100}%` }}
                                ></div>
                              </div>
                              <span className="font-medium animate-in zoom-in duration-500 delay-900">{holdingAnalysis.currentConditions.trafficDensity}/10</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center animate-in slide-in-from-left-1 duration-600 delay-800">
                            <span>Weather Impact:</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div 
                                  className="bg-orange-600 h-2 rounded-full transition-all duration-1000 ease-out animate-in slide-in-from-left-full delay-900"
                                  style={{ width: `${(holdingAnalysis.currentConditions.weatherImpact / 10) * 100}%` }}
                                ></div>
                              </div>
                              <span className="font-medium animate-in zoom-in duration-500 delay-1000">{holdingAnalysis.currentConditions.weatherImpact}/10</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center animate-in slide-in-from-right-1 duration-600 delay-900">
                            <span>Runway Capacity:</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div 
                                  className="bg-green-600 h-2 rounded-full transition-all duration-1000 ease-out animate-in slide-in-from-left-full delay-1000"
                                  style={{ width: `${(holdingAnalysis.currentConditions.runwayCapacity / 10) * 100}%` }}
                                ></div>
                              </div>
                              <span className="font-medium animate-in zoom-in duration-500 delay-1100">{holdingAnalysis.currentConditions.runwayCapacity}/10</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center animate-in slide-in-from-right-1 duration-600 delay-1000">
                            <span>Current Delays:</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div 
                                  className="bg-red-600 h-2 rounded-full transition-all duration-1000 ease-out animate-in slide-in-from-left-full delay-1100"
                                  style={{ width: `${holdingAnalysis.currentConditions.currentDelays}%` }}
                                ></div>
                              </div>
                              <span className="font-medium animate-in zoom-in duration-500 delay-1200">{holdingAnalysis.currentConditions.currentDelays}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg animate-in slide-in-from-bottom-1 duration-900 delay-500 hover:bg-blue-100 transition-colors">
                      <h4 className="font-semibold mb-3 text-blue-900 animate-in fade-in duration-500 delay-700">Operational Recommendations</h4>
                      <ul className="space-y-2">
                        {holdingAnalysis.alternateRecommendations.map((rec, index) => (
                          <li key={index} className={`text-sm flex items-start space-x-3 animate-in slide-in-from-left-1 duration-600 hover:translate-x-1 transition-transform`}
                              style={{ animationDelay: `${800 + (index * 100)}ms` }}>
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0 animate-pulse"></div>
                            <span className="text-blue-800">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* AI Holding Prediction Section */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 animate-in slide-in-from-bottom-3 duration-1000 delay-600 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-blue-900 animate-in fade-in duration-500 delay-800">AI Holding Prediction for Flight Planning</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={generateAiHoldingPrediction}
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm animate-in slide-in-from-right-2 duration-600 delay-900 hover:scale-105 transition-all"
                      >
                        {loading ? 'Generating...' : 'Generate AI Prediction'}
                      </button>
                      {aiHoldingPrediction && (
                        <button
                          onClick={() => forwardToFlightPlanning(aiHoldingPrediction)}
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm animate-in slide-in-from-right-1 duration-600 delay-1000 hover:scale-105 transition-all"
                        >
                          Forward to Flight Planning
                        </button>
                      )}
                    </div>
                  </div>

                  {aiHoldingPrediction && (
                    <div className="space-y-4 animate-in fade-in duration-800 delay-1100">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-3 rounded border animate-in slide-in-from-left-3 duration-700 delay-1200 hover:shadow-md hover:-translate-y-1 transition-all">
                          <h4 className="font-semibold text-blue-900 text-sm">Holding Probability</h4>
                          <p className="text-2xl font-bold text-blue-600 animate-in zoom-in duration-1000 delay-1400">
                            {(aiHoldingPrediction.holdingProbability * 100).toFixed(1)}%
                          </p>
                          <p className="text-xs text-blue-700 animate-in fade-in duration-500 delay-1600">AI confidence: {(aiHoldingPrediction.confidence * 100).toFixed(0)}%</p>
                        </div>
                        <div className="bg-white p-3 rounded border animate-in slide-in-from-bottom-2 duration-700 delay-1300 hover:shadow-md hover:-translate-y-1 transition-all">
                          <h4 className="font-semibold text-orange-900 text-sm">Expected Duration</h4>
                          <p className="text-2xl font-bold text-orange-600 animate-in zoom-in duration-1000 delay-1500">
                            {aiHoldingPrediction.expectedDuration} min
                          </p>
                          <p className="text-xs text-orange-700 animate-in fade-in duration-500 delay-1700">Range: {aiHoldingPrediction.durationRange}</p>
                        </div>
                        <div className="bg-white p-3 rounded border animate-in slide-in-from-right-3 duration-700 delay-1400 hover:shadow-md hover:-translate-y-1 transition-all">
                          <h4 className="font-semibold text-green-900 text-sm">Fuel Recommendation</h4>
                          <p className="text-2xl font-bold text-green-600 animate-in zoom-in duration-1000 delay-1600">
                            +{aiHoldingPrediction.additionalFuel} kg
                          </p>
                          <p className="text-xs text-green-700 animate-in fade-in duration-500 delay-1800">Safety margin included</p>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded border animate-in slide-in-from-bottom-1 duration-800 delay-1500 hover:shadow-md transition-all">
                        <h4 className="font-semibold mb-2 animate-in fade-in duration-500 delay-1700">Flight Planning Recommendations</h4>
                        <ul className="space-y-1 text-sm">
                          {aiHoldingPrediction.flightPlanningRecommendations?.map((rec: string, index: number) => (
                            <li key={index} className={`flex items-start space-x-2 animate-in slide-in-from-left-1 duration-600 hover:translate-x-1 transition-transform`}
                                style={{ animationDelay: `${1800 + (index * 100)}ms` }}>
                              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0 animate-pulse"></div>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-3 rounded border animate-in slide-in-from-left-2 duration-700 delay-1600 hover:shadow-md hover:scale-105 transition-all">
                          <h5 className="font-medium text-gray-900 mb-2 animate-in fade-in duration-500 delay-1800">Optimal Holding Pattern</h5>
                          <div className="text-sm space-y-1">
                            <div className="animate-in slide-in-from-left-1 duration-500 delay-1900">Altitude: {aiHoldingPrediction.optimalPattern?.altitude || '15,000 ft'}</div>
                            <div className="animate-in slide-in-from-left-1 duration-500 delay-2000">Speed: {aiHoldingPrediction.optimalPattern?.speed || '220 kts'}</div>
                            <div className="animate-in slide-in-from-left-1 duration-500 delay-2100">Pattern: {aiHoldingPrediction.optimalPattern?.type || 'Standard right turns'}</div>
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded border animate-in slide-in-from-right-2 duration-700 delay-1700 hover:shadow-md hover:scale-105 transition-all">
                          <h5 className="font-medium text-gray-900 mb-2 animate-in fade-in duration-500 delay-1900">ATC Coordination</h5>
                          <div className="text-sm space-y-1">
                            <div className="animate-in slide-in-from-right-1 duration-500 delay-2000">Frequency: {aiHoldingPrediction.atcCoordination?.frequency || '121.5 MHz'}</div>
                            <div className="animate-in slide-in-from-right-1 duration-500 delay-2100">Squawk: {aiHoldingPrediction.atcCoordination?.squawk || '2000'}</div>
                            <div className="animate-in slide-in-from-right-1 duration-500 delay-2200">Contact: {aiHoldingPrediction.atcCoordination?.contact || 'Approach Control'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!aiHoldingPrediction && (
                    <div className="text-center text-blue-600 py-4">
                      <p className="text-sm">Generate AI prediction to get comprehensive holding recommendations for Flight Planning</p>
                    </div>
                  )}
                </div>
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

        {/* Heathrow Analysis Tab */}
        {activeTab === 'heathrow' && (
          <div className="space-y-6">
            {/* Heathrow Overview */}
            {heathrowMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-900">Total Flights</h3>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    {heathrowMetrics.overview.totalFlights.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{heathrowMetrics.overview.dataSource}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-900">Punctuality Rate</h3>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {heathrowMetrics.overview.punctualityRate}%
                  </p>
                  <p className="text-sm text-gray-500 mt-1">0-15 min late or better</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-900">Average Delay</h3>
                  <p className="text-3xl font-bold text-orange-600 mt-2">
                    {heathrowMetrics.overview.averageDelay} min
                  </p>
                  <p className="text-sm text-gray-500 mt-1">When delays occur</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-900">Cancellation Rate</h3>
                  <p className="text-3xl font-bold text-red-600 mt-2">
                    {heathrowMetrics.overview.cancellationRate}%
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Flight cancellations</p>
                </div>
              </div>
            )}

            {/* Flight Prediction Form */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Heathrow Flight Performance Prediction</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Flight Number
                    </label>
                    <input
                      type="text"
                      value={heathrowForm.flightNumber}
                      onChange={(e) => setHeathrowForm({...heathrowForm, flightNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Airline
                    </label>
                    <select
                      value={heathrowForm.airline}
                      onChange={(e) => setHeathrowForm({...heathrowForm, airline: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="British Airways">British Airways</option>
                      <option value="Virgin Atlantic">Virgin Atlantic</option>
                      <option value="Lufthansa">Lufthansa</option>
                      <option value="Air France">Air France</option>
                      <option value="KLM">KLM</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Route/Destination
                    </label>
                    <select
                      value={heathrowForm.route}
                      onChange={(e) => setHeathrowForm({...heathrowForm, route: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Sydney">Sydney (Australia)</option>
                      <option value="New York">New York (USA)</option>
                      <option value="Frankfurt">Frankfurt (Germany)</option>
                      <option value="Paris">Paris (France)</option>
                      <option value="Amsterdam">Amsterdam (Netherlands)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Operation Type
                    </label>
                    <select
                      value={heathrowForm.operationType}
                      onChange={(e) => setHeathrowForm({...heathrowForm, operationType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="charter">Charter</option>
                    </select>
                  </div>
                  <button
                    onClick={predictHeathrowFlight}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Analyzing...' : 'Predict Performance'}
                  </button>
                </div>

                {heathrowPrediction && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Prediction Results for {heathrowPrediction.flightNumber}</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 p-3 rounded">
                        <h4 className="font-semibold text-green-900">Punctuality</h4>
                        <p className="text-2xl font-bold text-green-600">
                          {heathrowPrediction.predictions.punctualityProbability}%
                        </p>
                        <p className="text-sm text-green-700">On-time probability</p>
                      </div>
                      <div className="bg-orange-50 p-3 rounded">
                        <h4 className="font-semibold text-orange-900">Expected Delay</h4>
                        <p className="text-2xl font-bold text-orange-600">
                          {heathrowPrediction.predictions.expectedDelayMinutes} min
                        </p>
                        <p className="text-sm text-orange-700">Average delay time</p>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded">
                      <h4 className="font-semibold text-blue-900 mb-2">Performance Factors</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Airline Performance</span>
                          <span className="text-sm font-medium">{(heathrowPrediction.factors.airlinePerformance * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Route Complexity</span>
                          <span className="text-sm font-medium">{heathrowPrediction.factors.routeComplexity.toFixed(1)}x</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Airport Congestion</span>
                          <span className="text-sm font-medium">{(heathrowPrediction.factors.airportCongestion * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Recommendations</h4>
                      <ul className="space-y-1">
                        {heathrowPrediction.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-sm">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Airline Performance Comparison */}
            {heathrowAirlines.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Airline Performance Comparison</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Airline
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Grade
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Punctuality Rate
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Avg Delay
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Flights
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cancellation Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {heathrowAirlines.map((airline: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {airline.airline}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              airline.performanceGrade === 'A' ? 'bg-green-100 text-green-800' :
                              airline.performanceGrade === 'B' ? 'bg-blue-100 text-blue-800' :
                              airline.performanceGrade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                              airline.performanceGrade === 'D' ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {airline.performanceGrade}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {airline.punctualityRate}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {airline.averageDelay} min
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {airline.totalFlights.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {airline.cancellationRate}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Delay Distribution */}
            {heathrowMetrics && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Delay Distribution at Heathrow</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {heathrowMetrics.delayCategories.on_time}%
                    </div>
                    <div className="text-sm text-gray-600">On Time</div>
                    <div className="text-xs text-gray-500">0-15 min late</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {heathrowMetrics.delayCategories.moderate_delay}%
                    </div>
                    <div className="text-sm text-gray-600">Moderate Delay</div>
                    <div className="text-xs text-gray-500">16-60 min late</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {heathrowMetrics.delayCategories.severe_delay}%
                    </div>
                    <div className="text-sm text-gray-600">Severe Delay</div>
                    <div className="text-xs text-gray-500">61-180 min late</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {heathrowMetrics.delayCategories.extreme_delay}%
                    </div>
                    <div className="text-sm text-gray-600">Extreme Delay</div>
                    <div className="text-xs text-gray-500">180+ min late</div>
                  </div>
                </div>
              </div>
            )}

            {/* Operational Insights */}
            {heathrowMetrics && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Operational Insights</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-green-900 mb-3">Best Performing Airlines</h3>
                    <ul className="space-y-2">
                      {heathrowMetrics.operationalInsights.bestPerformingAirlines.map((airline: string, index: number) => (
                        <li key={index} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                          <span className="text-sm">{airline}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-900 mb-3">Performance Challenges</h3>
                    <ul className="space-y-2">
                      {heathrowMetrics.operationalInsights.worstPerformingAirlines.map((airline: string, index: number) => (
                        <li key={index} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                          <span className="text-sm">{airline}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TensorFlow Neural Network Tab */}
        {activeTab === 'tensorflow' && (
          <div className="space-y-6">
            {/* AI Model Status */}
            {tensorflowStatus && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4 text-purple-900">TensorFlow Neural Network Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700">Framework</h3>
                    <p className="text-lg font-bold text-purple-600">{tensorflowStatus.framework}</p>
                    <p className="text-xs text-gray-500">{tensorflowStatus.model_type}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700">Neural Network</h3>
                    <p className={`text-lg font-bold ${tensorflowStatus.neural_network_ready ? 'text-green-600' : 'text-orange-600'}`}>
                      {tensorflowStatus.neural_network_ready ? 'Ready' : 'Training Required'}
                    </p>
                    <p className="text-xs text-gray-500">{tensorflowStatus.python_backend}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700">Training Data</h3>
                    <p className="text-sm font-medium text-blue-600">American Airlines JFK</p>
                    <p className="text-xs text-gray-500">2022-2024 Operations</p>
                  </div>
                </div>
              </div>
            )}

            {/* Model Training Section */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Neural Network Training</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-3">Training Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Training Samples:</span>
                      <span className="font-medium">33 months of data</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Features:</span>
                      <span className="font-medium">6 input variables</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Outputs:</span>
                      <span className="font-medium">Delay probability & duration</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Architecture:</span>
                      <span className="font-medium">Deep Neural Network</span>
                    </div>
                  </div>
                  
                  {tensorflowModelInfo && (
                    <div className="mt-4 p-3 bg-gray-50 rounded">
                      <h4 className="font-medium text-sm mb-2">Model Architecture</h4>
                      <div className="space-y-1">
                        {tensorflowModelInfo.layers?.map((layer: string, index: number) => (
                          <div key={index} className="text-xs text-gray-600 font-mono">
                            Layer {index + 1}: {layer}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-medium mb-3">Train Neural Network</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Train the deep learning model on historical American Airlines JFK delay data using TensorFlow. 
                    This will enable AI-powered delay predictions with enhanced accuracy.
                  </p>
                  <button
                    onClick={trainTensorflowModel}
                    disabled={loading}
                    className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50"
                  >
                    {loading ? 'Training Neural Network...' : 'Train AI Model'}
                  </button>
                  
                  {tensorflowStatus?.neural_network_ready && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                      <p className="text-sm text-green-800">
                        ✓ Neural network is trained and ready for AI-powered predictions
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* AI Prediction Interface */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">AI-Powered Delay Prediction</h2>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weather Conditions (0-10): {flightForm.weather}
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
                    onClick={predictWithTensorflow}
                    disabled={loading || !tensorflowStatus?.neural_network_ready}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-md hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'AI Processing...' : 'Predict with Neural Network'}
                  </button>
                </div>

                {tensorflowPrediction && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-purple-900">AI Prediction Results</h3>
                    
                    {/* AI Confidence Indicator */}
                    <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">AI Confidence</span>
                        <span className="text-sm font-bold text-purple-600">
                          {(tensorflowPrediction.predictions?.confidence * 100)?.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-white rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                          style={{ width: `${(tensorflowPrediction.predictions?.confidence * 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Neural network trained on 33 months of authentic data
                      </p>
                    </div>

                    {/* Prediction Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-red-50 p-3 rounded-lg">
                        <h4 className="font-semibold text-red-900 text-sm">Delay Probability</h4>
                        <p className="text-2xl font-bold text-red-600">
                          {(tensorflowPrediction.predictions?.delayProbability * 100)?.toFixed(1)}%
                        </p>
                        <p className="text-xs text-red-700">AI prediction</p>
                      </div>
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <h4 className="font-semibold text-orange-900 text-sm">Expected Delay</h4>
                        <p className="text-2xl font-bold text-orange-600">
                          {tensorflowPrediction.predictions?.expectedDelayMinutes} min
                        </p>
                        <p className="text-xs text-orange-700">Neural network output</p>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <h4 className="font-semibold text-yellow-900 text-sm">Holding Risk</h4>
                        <p className="text-2xl font-bold text-yellow-600">
                          {(tensorflowPrediction.predictions?.holdingProbability * 100)?.toFixed(1)}%
                        </p>
                        <p className="text-xs text-yellow-700">AI calculated</p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <h4 className="font-semibold text-blue-900 text-sm">Holding Time</h4>
                        <p className="text-2xl font-bold text-blue-600">
                          {tensorflowPrediction.predictions?.expectedHoldingTime} min
                        </p>
                        <p className="text-xs text-blue-700">Estimated duration</p>
                      </div>
                    </div>

                    {/* AI Recommendations */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 text-gray-900">AI Recommendations</h4>
                      <ul className="space-y-1">
                        {tensorflowPrediction.recommendations?.map((rec: string, index: number) => (
                          <li key={index} className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-sm text-gray-700">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Model Information */}
                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Model: {tensorflowPrediction.modelVersion}</span>
                        <span>Data: {tensorflowPrediction.dataSource}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Neural Network Architecture Details */}
            {tensorflowModelInfo && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Neural Network Architecture</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-3">Input Features</h3>
                    <ul className="space-y-2">
                      {tensorflowModelInfo.features?.map((feature: string, index: number) => (
                        <li key={index} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium mb-3">Model Configuration</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Optimizer:</span>
                        <span className="font-medium">{tensorflowModelInfo.optimizer}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Loss Function:</span>
                        <span className="font-medium">{tensorflowModelInfo.loss_function}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Training Samples:</span>
                        <span className="font-medium">{tensorflowModelInfo.training_samples}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Validation Split:</span>
                        <span className="font-medium">{(tensorflowModelInfo.validation_split * 100)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dual-Model AI Tab */}
        {activeTab === 'dual-model' && (
          <div className="space-y-6">
            {/* Dual-Model System Status */}
            {dualModelStatus && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4 text-emerald-900">Dual-Model AI System Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700">Framework</h3>
                    <p className="text-lg font-bold text-emerald-600">{dualModelStatus.framework}</p>
                    <p className="text-xs text-gray-500">{dualModelStatus.model_type}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700">Data Sources</h3>
                    <div className="space-y-1">
                      {dualModelStatus.data_sources?.map((source: string, index: number) => (
                        <p key={index} className="text-sm font-medium text-blue-600">{source}</p>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700">System Status</h3>
                    <p className={`text-lg font-bold ${dualModelStatus.dual_model_ready ? 'text-green-600' : 'text-orange-600'}`}>
                      {dualModelStatus.dual_model_ready ? 'Ready' : 'Training Required'}
                    </p>
                    <p className="text-xs text-gray-500">{dualModelStatus.ensemble_type} Ensemble</p>
                  </div>
                </div>
              </div>
            )}

            {/* Model Training Section */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Dual-Model Training</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-3">Training Overview</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="text-sm font-semibold text-blue-900">UK CAA Model</h4>
                      <p className="text-xs text-blue-700">UK punctuality statistics with European operational patterns</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <h4 className="text-sm font-semibold text-red-900">US Airlines Model</h4>
                      <p className="text-xs text-red-700">American delay cause data with US operational patterns</p>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-lg">
                      <h4 className="text-sm font-semibold text-emerald-900">Ensemble Model</h4>
                      <p className="text-xs text-emerald-700">Random Forest combining both predictions for optimal accuracy</p>
                    </div>
                  </div>
                  
                  {dualModelInfo && (
                    <div className="mt-4 p-3 bg-gray-50 rounded">
                      <h4 className="font-medium text-sm mb-2">Model Architecture</h4>
                      <div className="space-y-1">
                        <div className="text-xs text-gray-600">
                          UK Model: {dualModelInfo.models?.uk_model?.architecture}
                        </div>
                        <div className="text-xs text-gray-600">
                          US Model: {dualModelInfo.models?.us_model?.architecture}
                        </div>
                        <div className="text-xs text-gray-600">
                          Ensemble: {dualModelInfo.models?.ensemble?.type}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-medium mb-3">Train Dual-Model System</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Train the comprehensive AI system using both UK CAA punctuality statistics and US Airlines delay data. 
                    This creates an ensemble model for enhanced prediction accuracy across international operations.
                  </p>
                  <button
                    onClick={trainDualModelSystem}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-4 rounded-md hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50"
                  >
                    {loading ? 'Training Dual-Model System...' : 'Train Combined AI Models'}
                  </button>
                  
                  {dualModelStatus?.dual_model_ready && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                      <p className="text-sm text-green-800">
                        ✓ Dual-model system trained and ready for enhanced predictions
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Prediction Interface */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Enhanced Dual-Model Prediction</h2>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Airline
                    </label>
                    <select
                      value={flightForm.airline}
                      onChange={(e) => setFlightForm({...flightForm, airline: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="British Airways">British Airways</option>
                      <option value="Virgin Atlantic">Virgin Atlantic</option>
                      <option value="American Airlines">American Airlines</option>
                      <option value="Delta Airlines">Delta Airlines</option>
                      <option value="United Airlines">United Airlines</option>
                      <option value="easyJet">easyJet</option>
                      <option value="Ryanair">Ryanair</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weather Conditions (0-10): {flightForm.weather}
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
                  <button
                    onClick={predictWithDualModel}
                    disabled={loading || !dualModelStatus?.dual_model_ready}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-4 rounded-md hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50"
                  >
                    {loading ? 'Processing with Dual Models...' : 'Predict with Enhanced AI'}
                  </button>
                </div>

                {dualModelPrediction && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-emerald-900">Enhanced Prediction Results</h3>
                    
                    {/* Model Agreement Analysis */}
                    <div className="bg-gradient-to-r from-emerald-100 to-teal-100 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Model Agreement</span>
                        <span className="text-sm font-bold text-emerald-600">
                          {(dualModelPrediction.factors?.dualModelAgreement * 100)?.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-white rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full"
                          style={{ width: `${(dualModelPrediction.factors?.dualModelAgreement * 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        UK CAA + US Airlines model consensus
                      </p>
                    </div>

                    {/* Individual Model Predictions */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <h4 className="font-semibold text-blue-900 text-sm">UK Model</h4>
                        <p className="text-xl font-bold text-blue-600">
                          {dualModelPrediction.modelDetails?.ukModelPrediction?.toFixed(0)} min
                        </p>
                        <p className="text-xs text-blue-700">CAA Data</p>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg">
                        <h4 className="font-semibold text-red-900 text-sm">US Model</h4>
                        <p className="text-xl font-bold text-red-600">
                          {dualModelPrediction.modelDetails?.usModelPrediction?.toFixed(0)} min
                        </p>
                        <p className="text-xs text-red-700">US Airlines</p>
                      </div>
                    </div>

                    {/* Ensemble Results */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-emerald-50 p-3 rounded-lg">
                        <h4 className="font-semibold text-emerald-900 text-sm">Delay Probability</h4>
                        <p className="text-2xl font-bold text-emerald-600">
                          {(dualModelPrediction.predictions?.delayProbability * 100)?.toFixed(1)}%
                        </p>
                        <p className="text-xs text-emerald-700">Ensemble prediction</p>
                      </div>
                      <div className="bg-teal-50 p-3 rounded-lg">
                        <h4 className="font-semibold text-teal-900 text-sm">Expected Delay</h4>
                        <p className="text-2xl font-bold text-teal-600">
                          {dualModelPrediction.predictions?.expectedDelayMinutes} min
                        </p>
                        <p className="text-xs text-teal-700">Combined models</p>
                      </div>
                    </div>

                    {/* Enhanced Recommendations */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 text-gray-900">Enhanced Recommendations</h4>
                      <ul className="space-y-1">
                        {dualModelPrediction.recommendations?.map((rec: string, index: number) => (
                          <li key={index} className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-emerald-600 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-sm text-gray-700">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Model Insights */}
                    <div className="border-t pt-3">
                      <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                        <div>
                          <span className="font-medium">Data Sources:</span>
                          <div>{dualModelPrediction.modelDetails?.dataSources?.join(', ')}</div>
                        </div>
                        <div>
                          <span className="font-medium">Confidence:</span>
                          <div>{(dualModelPrediction.predictions?.confidence * 100)?.toFixed(1)}%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Model Comparison Analysis */}
            {dualModelInfo && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Model Comparison & Capabilities</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-3">UK CAA Model</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Data Source:</span>
                        <span className="font-medium">{dualModelInfo.models?.uk_model?.data}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Features:</span>
                        <span className="font-medium">{dualModelInfo.models?.uk_model?.features?.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Focus:</span>
                        <span className="font-medium">European Operations</span>
                      </div>
                    </div>
                    <div className="mt-3 p-2 bg-blue-50 rounded text-xs">
                      Features: {dualModelInfo.models?.uk_model?.features?.join(', ')}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-3">US Airlines Model</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Data Source:</span>
                        <span className="font-medium">{dualModelInfo.models?.us_model?.data}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Features:</span>
                        <span className="font-medium">{dualModelInfo.models?.us_model?.features?.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Focus:</span>
                        <span className="font-medium">American Operations</span>
                      </div>
                    </div>
                    <div className="mt-3 p-2 bg-red-50 rounded text-xs">
                      Features: {dualModelInfo.models?.us_model?.features?.join(', ')}
                    </div>
                  </div>
                </div>
                
                {/* Ensemble Benefits */}
                <div className="mt-6 p-4 bg-emerald-50 rounded-lg">
                  <h3 className="font-medium mb-2 text-emerald-900">Ensemble Benefits</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {dualModelInfo.capabilities?.map((capability: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span className="text-sm text-emerald-800">{capability}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Training Monitor Tab */}
        {activeTab === 'training' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Neural Network Training Monitor</h2>
                <button
                  onClick={startNeuralNetworkTraining}
                  disabled={loading || trainingStatus?.status === 'training'}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Training...' : 'Start Neural Network Training'}
                </button>
              </div>
              
              {/* Training Status */}
              {trainingStatus && (
                <div className="mb-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`w-3 h-3 rounded-full ${
                      trainingStatus.status === 'training' ? 'bg-yellow-500 animate-pulse' :
                      trainingStatus.status === 'completed' ? 'bg-green-500' :
                      'bg-red-500'
                    }`}></div>
                    <span className="font-medium">
                      Status: {trainingStatus.status.charAt(0).toUpperCase() + trainingStatus.status.slice(1)}
                    </span>
                  </div>
                  
                  {trainingStatus.status === 'completed' && trainingStatus.performance && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-medium text-green-900 mb-2">Training Completed Successfully</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Training Time:</span> {trainingStatus.trainingTime}
                        </div>
                        <div>
                          <span className="font-medium">Model Performance:</span>
                          <div className="mt-1 text-xs bg-white p-2 rounded">
                            <pre>{JSON.stringify(trainingStatus.performance, null, 2)}</pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {trainingStatus.status === 'failed' && (
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h3 className="font-medium text-red-900 mb-2">Training Failed</h3>
                      <p className="text-sm text-red-700">{trainingStatus.error}</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Training Progress Logs */}
              {trainingProgress.length > 0 && (
                <div className="bg-gray-50 rounded-lg">
                  <div className="p-4 border-b">
                    <h3 className="font-medium">Training Output</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto p-4">
                    <div className="space-y-1 font-mono text-sm">
                      {trainingProgress.map((log, index) => (
                        <div key={index} className="text-gray-700">
                          <span className="text-gray-400 mr-2">[{new Date().toLocaleTimeString()}]</span>
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Current Model Status */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900">TensorFlow Model</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Deep neural network for delay probability and duration prediction
                  </p>
                  <div className="mt-2">
                    <span className={`inline-block px-2 py-1 rounded text-xs ${
                      tensorflowStatus?.trained ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tensorflowStatus?.trained ? 'Trained' : 'Not Trained'}
                    </span>
                  </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-medium text-purple-900">Dual-Model AI</h3>
                  <p className="text-sm text-purple-700 mt-1">
                    UK/US ensemble model for cross-regional predictions
                  </p>
                  <div className="mt-2">
                    <span className={`inline-block px-2 py-1 rounded text-xs ${
                      dualModelStatus?.status === 'ready' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {dualModelStatus?.status || 'Unknown'}
                    </span>
                  </div>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="font-medium text-orange-900">Random Forest</h3>
                  <p className="text-sm text-orange-700 mt-1">
                    Classical ML model for baseline predictions
                  </p>
                  <div className="mt-2">
                    <span className="inline-block px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                      Ready
                    </span>
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