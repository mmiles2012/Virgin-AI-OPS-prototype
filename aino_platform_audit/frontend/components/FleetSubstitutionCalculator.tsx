import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Plane, Calculator, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';

interface FleetSpecs {
  [key: string]: {
    name: string;
    total_pax: number;
    upper_class: number;
    premium: number;
    economy: number;
    cargo_capacity: number;
    range_nm: number;
    fuel_efficiency: number;
    operating_cost_per_hour: number;
    count: number;
  };
}

interface SubstitutionRecommendation {
  aircraft_code: string;
  aircraft_name: string;
  substitution_score: number;
  efficiency_rating: number;
  cost_impact: {
    difference_usd: number;
    difference_percent: number;
    cost_per_passenger: number;
  };
  passenger_impact: {
    total_overflow: number;
    total_underload: number;
    capacity_utilization: number;
    class_breakdown: {
      [key: string]: {
        original_demand: number;
        backup_capacity: number;
        overflow: number;
        underload: number;
      };
    };
  };
  cargo_impact: {
    capacity_difference_kg: number;
    cargo_overflow: number;
    cargo_efficiency: number;
  };
}

interface SubstitutionAnalysis {
  original_aircraft: string;
  original_aircraft_name: string;
  recommendations: SubstitutionRecommendation[];
  analysis_parameters: {
    load_factor: number;
    cargo_load_kg: number;
    flight_duration_hours: number;
  };
}

export default function FleetSubstitutionCalculator() {
  const [fleetData, setFleetData] = useState<{ fleet_specifications: FleetSpecs } | null>(null);
  const [selectedAircraft, setSelectedAircraft] = useState<string>('');
  const [loadFactor, setLoadFactor] = useState<number>(85);
  const [cargoLoad, setCargoLoad] = useState<number>(10000);
  const [flightDuration, setFlightDuration] = useState<number>(8.0);
  const [analysis, setAnalysis] = useState<SubstitutionAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchFleetOverview();
  }, []);

  const fetchFleetOverview = async () => {
    try {
      const response = await fetch('/api/fleet/fleet-overview');
      const data = await response.json();
      if (data.success) {
        setFleetData(data.fleet_data);
        const firstAircraft = Object.keys(data.fleet_data.fleet_specifications)[0];
        setSelectedAircraft(firstAircraft);
      }
    } catch (err) {
      setError('Failed to load fleet data');
    }
  };

  const analyzeSubstitution = async () => {
    if (!selectedAircraft) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/fleet/substitution-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalAircraft: selectedAircraft,
          loadFactor: loadFactor / 100,
          cargoLoad: cargoLoad,
          flightDuration: flightDuration,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setAnalysis(data.substitution_analysis);
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (err) {
      setError('Failed to analyze substitution options');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-green-500';
    if (score >= 0.7) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getCostImpactColor = (percent: number) => {
    if (percent < -5) return 'text-green-500';
    if (percent > 10) return 'text-red-500';
    return 'text-yellow-500';
  };

  if (!fleetData) {
    return (
      <div className="p-6">
        <div className="text-center">
          <Plane className="mx-auto h-12 w-12 text-blue-500 animate-pulse" />
          <p className="mt-4 text-gray-400">Loading Virgin Atlantic fleet data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Aircraft Substitution Calculator</h1>
        <p className="text-gray-400">Analyze operational and financial impact when substituting aircraft types</p>
      </div>

      {/* Configuration Panel */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Substitution Parameters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Aircraft Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Unavailable Aircraft
              </label>
              <select
                value={selectedAircraft}
                onChange={(e) => setSelectedAircraft(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                {Object.entries(fleetData.fleet_specifications).map(([code, spec]) => (
                  <option key={code} value={code}>
                    {spec.name} ({code})
                  </option>
                ))}
              </select>
            </div>

            {/* Load Factor */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Load Factor ({loadFactor}%)
              </label>
              <input
                type="range"
                min="50"
                max="100"
                value={loadFactor}
                onChange={(e) => setLoadFactor(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Cargo Load */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Cargo Load (kg)
              </label>
              <input
                type="number"
                value={cargoLoad}
                onChange={(e) => setCargoLoad(Number(e.target.value))}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                min="0"
                step="500"
              />
            </div>

            {/* Flight Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Flight Duration (hours)
              </label>
              <input
                type="number"
                value={flightDuration}
                onChange={(e) => setFlightDuration(Number(e.target.value))}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                min="1"
                max="16"
                step="0.5"
              />
            </div>
          </div>

          <Button
            onClick={analyzeSubstitution}
            disabled={loading || !selectedAircraft}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Analyzing...' : 'Calculate Substitution Options'}
          </Button>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert className="border-red-500 bg-red-900/20">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-400">{error}</AlertDescription>
        </Alert>
      )}

      {/* Original Aircraft Info */}
      {selectedAircraft && fleetData.fleet_specifications[selectedAircraft] && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Original Aircraft Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Aircraft</p>
                <p className="text-white font-semibold">
                  {fleetData.fleet_specifications[selectedAircraft].name}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Total Seats</p>
                <p className="text-white font-semibold">
                  {fleetData.fleet_specifications[selectedAircraft].total_pax}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Operating Cost</p>
                <p className="text-white font-semibold">
                  ${fleetData.fleet_specifications[selectedAircraft].operating_cost_per_hour.toLocaleString()}/hr
                </p>
              </div>
              <div>
                <p className="text-gray-400">Cargo Capacity</p>
                <p className="text-white font-semibold">
                  {fleetData.fleet_specifications[selectedAircraft].cargo_capacity.toLocaleString()} kg
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Substitution Recommendations</h2>
          
          {analysis.recommendations.map((rec, index) => (
            <Card key={rec.aircraft_code} className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white flex items-center gap-2">
                    <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm">
                      #{index + 1}
                    </span>
                    {rec.aircraft_name} ({rec.aircraft_code})
                  </CardTitle>
                  <Badge 
                    className={`${getScoreColor(rec.substitution_score)} bg-transparent border`}
                  >
                    Score: {rec.substitution_score.toFixed(3)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Cost Impact */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-white flex items-center gap-2">
                      {rec.cost_impact.difference_usd >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-red-400" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-green-400" />
                      )}
                      Cost Impact
                    </h4>
                    <div className="text-sm space-y-1">
                      <p className={getCostImpactColor(rec.cost_impact.difference_percent)}>
                        {rec.cost_impact.difference_usd >= 0 ? '+' : ''}
                        ${rec.cost_impact.difference_usd.toLocaleString()} 
                        ({rec.cost_impact.difference_percent > 0 ? '+' : ''}{rec.cost_impact.difference_percent.toFixed(1)}%)
                      </p>
                      <p className="text-gray-400">
                        ${rec.cost_impact.cost_per_passenger.toFixed(1)} per passenger per hour
                      </p>
                    </div>
                  </div>

                  {/* Passenger Impact */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-white flex items-center gap-2">
                      {rec.passenger_impact.total_overflow > 0 ? (
                        <AlertTriangle className="h-4 w-4 text-yellow-400" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      )}
                      Passenger Impact
                    </h4>
                    <div className="text-sm space-y-1">
                      {rec.passenger_impact.total_overflow > 0 ? (
                        <p className="text-yellow-400">
                          {rec.passenger_impact.total_overflow} passengers need rebooking
                        </p>
                      ) : rec.passenger_impact.total_underload > 0 ? (
                        <p className="text-green-400">
                          {rec.passenger_impact.total_underload} spare seats available
                        </p>
                      ) : (
                        <p className="text-green-400">Perfect capacity match</p>
                      )}
                      <p className="text-gray-400">
                        Utilization: {(rec.passenger_impact.capacity_utilization * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Cargo Impact */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-white flex items-center gap-2">
                      {rec.cargo_impact.capacity_difference_kg >= 0 ? (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-400" />
                      )}
                      Cargo Impact
                    </h4>
                    <div className="text-sm space-y-1">
                      <p className={rec.cargo_impact.capacity_difference_kg >= 0 ? 'text-green-400' : 'text-yellow-400'}>
                        {rec.cargo_impact.capacity_difference_kg >= 0 ? '+' : ''}
                        {rec.cargo_impact.capacity_difference_kg.toLocaleString()} kg capacity
                      </p>
                      {rec.cargo_impact.cargo_overflow > 0 && (
                        <p className="text-red-400">
                          {rec.cargo_impact.cargo_overflow.toLocaleString()} kg overflow
                        </p>
                      )}
                      <p className="text-gray-400">
                        Efficiency: {(rec.cargo_impact.cargo_efficiency * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Class Breakdown */}
                {rec.passenger_impact.total_overflow > 0 && (
                  <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-600 rounded">
                    <h5 className="text-yellow-400 font-semibold mb-2">Class-wise Overflow</h5>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      {Object.entries(rec.passenger_impact.class_breakdown).map(([className, impact]) => (
                        impact.overflow > 0 && (
                          <div key={className}>
                            <p className="text-gray-300 capitalize">{className.replace('_', ' ')}</p>
                            <p className="text-yellow-400">{impact.overflow} passengers</p>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}