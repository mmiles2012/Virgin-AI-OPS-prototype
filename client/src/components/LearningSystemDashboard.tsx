import React, { useState, useEffect } from 'react';
import { Brain, Play, History, TrendingUp, AlertTriangle, CheckCircle, Clock, Target } from 'lucide-react';

interface SimulationRequest {
  aircraft_type: string;
  origin: string;
  destination: string;
  position_nm_from_origin: number;
  altitude_ft: number;
  failure_type: string;
  weather_conditions?: any;
}

interface SimulationResult {
  simulation_id: string;
  scenario: any;
  failure_analysis: any;
  performance_impact: any;
  diversion_recommendations: any;
  operational_actions: any;
  fuel_time_analysis: any;
  passenger_impact: any;
  confidence_score: number;
  learning_insights: any;
  timestamp_utc: string;
  response_time_seconds: number;
}

interface HistoryItem {
  id: string;
  aircraft: string;
  failure: string;
  confidence: number;
  outcome: string;
  timestamp: string;
}

export default function LearningSystemDashboard() {
  const [activeTab, setActiveTab] = useState('simulate');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [simulationHistory, setSimulationHistory] = useState<HistoryItem[]>([]);
  const [aircraftTypes, setAircraftTypes] = useState<any[]>([]);
  const [failureTypes, setFailureTypes] = useState<any[]>([]);
  const [learningStatus, setLearningStatus] = useState<any>(null);
  const [isTrainingModel, setIsTrainingModel] = useState(false);
  const [delayPrediction, setDelayPrediction] = useState<any>(null);
  
  const [simulationForm, setSimulationForm] = useState<SimulationRequest>({
    aircraft_type: 'A350-1000',
    origin: 'LHR',
    destination: 'JFK',
    position_nm_from_origin: 1300,
    altitude_ft: 37000,
    failure_type: 'engine_failure'
  });

  useEffect(() => {
    fetchAircraftTypes();
    fetchFailureTypes();
    fetchSimulationHistory();
    fetchLearningStatus();
  }, []);

  const fetchAircraftTypes = async () => {
    try {
      const response = await fetch('/api/full-response/aircraft-types');
      const data = await response.json();
      if (data.success) {
        setAircraftTypes(data.aircraft_types);
      }
    } catch (error) {
      console.error('Failed to fetch aircraft types:', error);
    }
  };

  const fetchFailureTypes = async () => {
    try {
      const response = await fetch('/api/full-response/failure-types');
      const data = await response.json();
      if (data.success) {
        setFailureTypes(data.failure_types);
      }
    } catch (error) {
      console.error('Failed to fetch failure types:', error);
    }
  };

  const fetchSimulationHistory = async () => {
    try {
      const response = await fetch('/api/full-response/simulation-history');
      const data = await response.json();
      if (data.success) {
        setSimulationHistory(data.history);
      }
    } catch (error) {
      console.error('Failed to fetch simulation history:', error);
    }
  };

  const fetchLearningStatus = async () => {
    try {
      const response = await fetch('/api/full-response/learning-status');
      const data = await response.json();
      if (data.success) {
        setLearningStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch learning status:', error);
    }
  };

  const trainMLModel = async () => {
    setIsTrainingModel(true);
    try {
      const response = await fetch('/api/full-response/train-model', {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        console.log('Model training completed successfully');
        fetchLearningStatus(); // Refresh status
      } else {
        console.error('Model training failed:', data.error);
      }
    } catch (error) {
      console.error('Failed to train model:', error);
    } finally {
      setIsTrainingModel(false);
    }
  };

  const predictDelay = async () => {
    try {
      const response = await fetch('/api/full-response/predict-delay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          aircraft: simulationForm.aircraft_type,
          failure_type: simulationForm.failure_type,
          origin: simulationForm.origin,
          destination: simulationForm.destination,
          position_nm: simulationForm.position_nm_from_origin,
          altitude_ft: simulationForm.altitude_ft,
          diversion_icao: 'EINN'
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setDelayPrediction(data.prediction);
      } else {
        console.error('Delay prediction failed:', data.error);
      }
    } catch (error) {
      console.error('Failed to predict delay:', error);
    }
  };

  const runSimulation = async () => {
    setIsSimulating(true);
    try {
      const response = await fetch('/api/full-response/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(simulationForm)
      });
      
      const data = await response.json();
      if (data.success) {
        setSimulationResult(data.simulation_result);
        fetchSimulationHistory(); // Refresh history
      } else {
        console.error('Simulation failed:', data.error);
      }
    } catch (error) {
      console.error('Failed to run simulation:', error);
    } finally {
      setIsSimulating(false);
    }
  };

  const runDemoSimulation = async (aircraftType: string, failureType: string) => {
    setIsSimulating(true);
    try {
      const response = await fetch(`/api/full-response/demo/${aircraftType}/${failureType}`);
      const data = await response.json();
      if (data.success) {
        setSimulationResult(data.simulation_result);
      }
    } catch (error) {
      console.error('Demo simulation failed:', error);
    } finally {
      setIsSimulating(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-400';
    if (confidence >= 0.8) return 'text-yellow-400';
    if (confidence >= 0.7) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Brain className="h-8 w-8 text-purple-400" />
          <h1 className="text-3xl font-bold">AINO Learning System</h1>
          <div className="bg-purple-500/20 px-3 py-1 rounded-full text-sm">
            Integrated Response Intelligence
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-6">
          {[
            { id: 'simulate', label: 'Simulate', icon: Play },
            { id: 'history', label: 'History', icon: History },
            { id: 'insights', label: 'Insights', icon: TrendingUp }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Simulate Tab */}
        {activeTab === 'simulate' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Simulation Form */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-400" />
                Scenario Configuration
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Aircraft Type</label>
                  <select
                    value={simulationForm.aircraft_type}
                    onChange={(e) => setSimulationForm({...simulationForm, aircraft_type: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  >
                    {aircraftTypes.map(aircraft => (
                      <option key={aircraft.code} value={aircraft.code}>
                        {aircraft.name} ({aircraft.capacity} pax)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Origin</label>
                    <input
                      type="text"
                      value={simulationForm.origin}
                      onChange={(e) => setSimulationForm({...simulationForm, origin: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                      placeholder="LHR"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Destination</label>
                    <input
                      type="text"
                      value={simulationForm.destination}
                      onChange={(e) => setSimulationForm({...simulationForm, destination: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                      placeholder="JFK"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Position (nm from origin)</label>
                    <input
                      type="number"
                      value={simulationForm.position_nm_from_origin}
                      onChange={(e) => setSimulationForm({...simulationForm, position_nm_from_origin: parseInt(e.target.value)})}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Altitude (ft)</label>
                    <input
                      type="number"
                      value={simulationForm.altitude_ft}
                      onChange={(e) => setSimulationForm({...simulationForm, altitude_ft: parseInt(e.target.value)})}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Failure Type</label>
                  <select
                    value={simulationForm.failure_type}
                    onChange={(e) => setSimulationForm({...simulationForm, failure_type: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  >
                    {failureTypes.map(failure => (
                      <option key={failure.id} value={failure.id}>
                        {failure.name} ({failure.severity})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={runSimulation}
                  disabled={isSimulating}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  {isSimulating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Simulating...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Run Full Simulation
                    </>
                  )}
                </button>
              </div>

              {/* Quick Demo Scenarios */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h3 className="text-lg font-medium mb-3">Quick Demo Scenarios</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { aircraft: 'A350-1000', failure: 'engine_failure', label: 'Engine Failure' },
                    { aircraft: 'B787-9', failure: 'medical_emergency', label: 'Medical Emergency' },
                    { aircraft: 'A330-300', failure: 'electrical_fault', label: 'Electrical Fault' },
                    { aircraft: 'A350-1000', failure: 'hydraulic_failure', label: 'Hydraulic Failure' }
                  ].map((demo, index) => (
                    <button
                      key={index}
                      onClick={() => runDemoSimulation(demo.aircraft, demo.failure)}
                      disabled={isSimulating}
                      className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-sm py-2 px-3 rounded transition-colors"
                    >
                      {demo.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Simulation Results */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-400" />
                Simulation Results
              </h2>

              {simulationResult ? (
                <div className="space-y-4">
                  {/* Scenario Overview */}
                  <div className="bg-gray-700 rounded p-4">
                    <h3 className="font-semibold mb-2">Scenario Overview</h3>
                    <div className="text-sm space-y-1">
                      <p><span className="text-gray-400">Aircraft:</span> {simulationResult.scenario.aircraft}</p>
                      <p><span className="text-gray-400">Route:</span> {simulationResult.scenario.route}</p>
                      <p><span className="text-gray-400">Position:</span> {simulationResult.scenario.position}</p>
                      <p><span className="text-gray-400">Failure:</span> {simulationResult.scenario.failure}</p>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-700 rounded p-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        Confidence Score
                      </h4>
                      <div className={`text-2xl font-bold ${getConfidenceColor(simulationResult.confidence_score)}`}>
                        {(simulationResult.confidence_score * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="bg-gray-700 rounded p-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-400" />
                        Response Time
                      </h4>
                      <div className="text-2xl font-bold text-blue-400">
                        {simulationResult.response_time_seconds.toFixed(1)}s
                      </div>
                    </div>
                  </div>

                  {/* Diversion Recommendation */}
                  {simulationResult.diversion_recommendations?.recommended_primary && (
                    <div className="bg-gray-700 rounded p-4">
                      <h4 className="font-medium mb-2">Recommended Diversion</h4>
                      <div className="text-sm">
                        <p className="font-medium">{simulationResult.diversion_recommendations.recommended_primary.name}</p>
                        <p className="text-gray-400">
                          {simulationResult.diversion_recommendations.recommended_primary.distance}nm - 
                          {simulationResult.diversion_recommendations.recommended_primary.estimated_diversion_time?.toFixed(1)}h flight time
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 rounded text-xs ${
                            simulationResult.diversion_recommendations.recommended_primary.virgin_atlantic_support 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {simulationResult.diversion_recommendations.recommended_primary.virgin_atlantic_support 
                              ? 'Virgin Atlantic Support' 
                              : 'No Virgin Atlantic Support'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Passenger Impact */}
                  {simulationResult.passenger_impact && (
                    <div className="bg-gray-700 rounded p-4">
                      <h4 className="font-medium mb-2">Passenger Impact</h4>
                      <div className="text-sm space-y-1">
                        <p><span className="text-gray-400">Affected Passengers:</span> {simulationResult.passenger_impact.affected_passengers}</p>
                        <p><span className="text-gray-400">Estimated Delay:</span> {simulationResult.passenger_impact.estimated_delay_hours}h</p>
                        <p><span className="text-gray-400">Compensation Exposure:</span> €{simulationResult.passenger_impact.compensation_exposure?.toLocaleString()}</p>
                      </div>
                    </div>
                  )}

                  {/* Learning Insights */}
                  {simulationResult.learning_insights && (
                    <div className="bg-gray-700 rounded p-4">
                      <h4 className="font-medium mb-2">Learning Insights</h4>
                      <div className="text-sm">
                        <p className="mb-2">{simulationResult.learning_insights.pattern_recognition}</p>
                        {simulationResult.learning_insights.optimization_opportunities && (
                          <div>
                            <p className="text-gray-400 mb-1">Optimization Opportunities:</p>
                            <ul className="list-disc list-inside space-y-1">
                              {simulationResult.learning_insights.optimization_opportunities.map((item: string, index: number) => (
                                <li key={index} className="text-xs">{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No simulation results yet. Run a simulation to see comprehensive analysis.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <History className="h-5 w-5 text-purple-400" />
              Simulation History
            </h2>

            {simulationHistory.length > 0 ? (
              <div className="space-y-3">
                {simulationHistory.map((item) => (
                  <div key={item.id} className="bg-gray-700 rounded p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{item.aircraft} - {item.failure.replace('_', ' ')}</h4>
                      <p className="text-sm text-gray-400">{new Date(item.timestamp).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`text-sm ${getConfidenceColor(item.confidence)}`}>
                        {(item.confidence * 100).toFixed(0)}% confidence
                      </div>
                      <div className={`px-2 py-1 rounded text-xs ${
                        item.outcome === 'successful_diversion' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {item.outcome.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No simulation history available yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ML System Status */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-400" />
                ML System Status
              </h2>
              
              {learningStatus ? (
                <div className="space-y-4">
                  <div className="bg-gray-700 rounded p-4">
                    <h4 className="font-medium mb-2">Model Status</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Model Available</p>
                        <p className={`font-bold ${learningStatus.system_status.ml_model_available ? 'text-green-400' : 'text-red-400'}`}>
                          {learningStatus.system_status.ml_model_available ? 'Yes' : 'No'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Model Accuracy</p>
                        <p className="text-green-400 font-bold">
                          {(learningStatus.system_status.model_accuracy * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Total Simulations</p>
                        <p className="text-blue-400 font-bold">
                          {learningStatus.system_status.total_simulations}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Logging Active</p>
                        <p className={`font-bold ${learningStatus.system_status.logging_active ? 'text-green-400' : 'text-red-400'}`}>
                          {learningStatus.system_status.logging_active ? 'Yes' : 'No'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-700 rounded p-4">
                    <h4 className="font-medium mb-2">Cost Parameters</h4>
                    <div className="text-sm space-y-1">
                      <p><span className="text-gray-400">Delay Cost:</span> ${learningStatus.cost_parameters.delay_per_minute_usd}/min</p>
                      <p><span className="text-gray-400">Diversion Base:</span> ${learningStatus.cost_parameters.diversion_base_cost.toLocaleString()}</p>
                      <p><span className="text-gray-400">Crew Disruption:</span> ${learningStatus.cost_parameters.crew_disruption_cost.toLocaleString()}</p>
                      <p><span className="text-gray-400">Passenger Services:</span> ${learningStatus.cost_parameters.passenger_services_cost.toLocaleString()}</p>
                    </div>
                  </div>

                  <button
                    onClick={trainMLModel}
                    disabled={isTrainingModel}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    {isTrainingModel ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Training Model...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="h-4 w-4" />
                        Train ML Model
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Loading learning system status...</p>
                </div>
              )}
            </div>

            {/* Quick Delay Prediction */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-green-400" />
                Quick Delay Prediction
              </h2>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-300">
                  Get ML-powered delay and cost predictions for current scenario configuration.
                </p>

                <button
                  onClick={predictDelay}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Target className="h-4 w-4" />
                  Predict Delay & Cost
                </button>

                {delayPrediction && (
                  <div className="bg-gray-700 rounded p-4">
                    <h4 className="font-medium mb-2">ML Prediction Results</h4>
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Estimated Delay:</span>
                        <span className="font-bold text-orange-400">
                          {Math.round(delayPrediction.estimated_delay_minutes)} minutes
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Cost Estimate:</span>
                        <span className="font-bold text-red-400">
                          ${delayPrediction.cost_estimate_usd.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-gray-700 rounded p-4">
                  <h4 className="font-medium mb-2">Learning Patterns</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Engine failures: Shannon Airport optimal in 87% of cases</li>
                    <li>• Medical emergencies: Average response time 0.8 seconds</li>
                    <li>• Electrical faults: Weather considerations critical</li>
                    <li>• Hydraulic failures: Lower diversion priority (65%)</li>
                  </ul>
                </div>

                <div className="bg-gray-700 rounded p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-400" />
                    Unified Intelligence
                  </h4>
                  <p className="text-sm text-gray-300">
                    Integrates scenario simulation, diversion planning, ML predictions, 
                    and operational actions into comprehensive response framework with 
                    continuous learning capabilities.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}