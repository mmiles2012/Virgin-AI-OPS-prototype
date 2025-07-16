import React, { useState, useEffect } from 'react';
import { MapPin, Clock, DollarSign, Fuel, Users, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Flight, FlightModel } from '../lib/flightModel';
import { ScenarioEngine, DiversionScenario } from '../lib/scenarioEngine';
import { CostModel } from '../lib/costModel';
import { CrewModule } from '../lib/crewModule';
import { FuelAnalytics } from '../lib/fuelAnalytics';
import { DataFeeds } from '../lib/dataFeeds';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DiversionOption {
  airport: string;
  name: string;
  distance: number;
  flightTime: number;
  fuelRequired: number;
  cost: {
    total: number;
    breakdown: {
      passenger: number;
      crew: number;
      fuel: number;
      handling: number;
    };
  };
  weather: {
    conditions: string;
    visibility: number;
    winds: string;
    category: string;
  };
  facilities: {
    medical: boolean;
    customs24h: boolean;
    fireCategory: number;
    fuelAvailable: boolean;
  };
  crewLegality: {
    legal: boolean;
    timeRemaining: number;
    riskLevel: string;
  };
  customerImpact: {
    score: number;
    category: string;
    compensation: number;
  };
  advantages: string[];
  disadvantages: string[];
  overallScore: number;
}

export default function DiversionComparison() {
  const [ganderOption, setGanderOption] = useState<DiversionOption | null>(null);
  const [halifaxOption, setHalifaxOption] = useState<DiversionOption | null>(null);
  const [recommendation, setRecommendation] = useState<string>('');

  useEffect(() => {
    generateDiversionComparison();
  }, []);

  const generateDiversionComparison = () => {
    // VIR127C current position: 45.1894°N, -69.1715°W
    const currentLat = 45.1894;
    const currentLon = -69.1715;
    const currentFuel = 42000; // kg
    const passengers = 298;

    // Create flight model for A350
    const flightModel = new FlightModel('A350');
    const flight = new Flight('VIR127C', 'LHR', 'JFK', 'A350', 187, currentFuel, '08:30Z', '15:45Z');

    // Gander (CYQX) analysis
    const ganderDistance = calculateDistance(currentLat, currentLon, 48.9369, -54.5681);
    const ganderFlightTime = flightModel.calculateFlightTime(ganderDistance);
    const ganderFuelRequired = flightModel.calculateFuelRequired(ganderDistance);
    
    const ganderWeather = DataFeeds.getWeather('CYQX');
    const ganderCost = CostModel.estimateDiversionCost(passengers, 'domestic', true, ganderFlightTime / 60);
    const ganderCustomerImpact = CostModel.customerDisruptionScore(ganderFlightTime + 180, true, true);
    const ganderCrewStatus = CrewModule.checkLegalityStatus(187, ganderFlightTime, 293);

    setGanderOption({
      airport: 'CYQX',
      name: 'Gander International',
      distance: Math.round(ganderDistance),
      flightTime: Math.round(ganderFlightTime),
      fuelRequired: ganderFuelRequired,
      cost: {
        total: ganderCost.total,
        breakdown: {
          passenger: ganderCost.hotel + ganderCost.meals + ganderCost.rebooking,
          crew: ganderCost.breakdown.crewCosts,
          fuel: ganderCost.breakdown.fuelCosts,
          handling: ganderCost.breakdown.handlingFees
        }
      },
      weather: {
        conditions: ganderWeather.conditions,
        visibility: ganderWeather.visibility,
        winds: `${ganderWeather.winds.direction}°/${ganderWeather.winds.speed}kt`,
        category: ganderWeather.conditions === 'VMC' ? 'CAT1' : 'CAT2'
      },
      facilities: {
        medical: true, // Gander has medical facilities
        customs24h: false, // Limited hours
        fireCategory: 8, // Category 8 fire services
        fuelAvailable: true
      },
      crewLegality: {
        legal: ganderCrewStatus.legal,
        timeRemaining: ganderCrewStatus.timeRemaining,
        riskLevel: ganderCrewStatus.riskLevel
      },
      customerImpact: {
        score: ganderCustomerImpact.score,
        category: ganderCustomerImpact.category,
        compensation: ganderCustomerImpact.estimatedCompensation
      },
      advantages: [
        'Closest airport',
        'Established diversion hub',
        'Experienced with wide-body aircraft',
        'Medical facilities available'
      ],
      disadvantages: [
        'Limited passenger amenities',
        'Remote location',
        'Limited onward connections',
        'Weather can be challenging'
      ],
      overallScore: 78
    });

    // Halifax (CYHZ) analysis
    const halifaxDistance = calculateDistance(currentLat, currentLon, 44.8808, -63.5086);
    const halifaxFlightTime = flightModel.calculateFlightTime(halifaxDistance);
    const halifaxFuelRequired = flightModel.calculateFuelRequired(halifaxDistance);
    
    const halifaxWeather = DataFeeds.getWeather('CYHZ');
    const halifaxCost = CostModel.estimateDiversionCost(passengers, 'domestic', true, halifaxFlightTime / 60);
    const halifaxCustomerImpact = CostModel.customerDisruptionScore(halifaxFlightTime + 120, true, false);
    const halifaxCrewStatus = CrewModule.checkLegalityStatus(187, halifaxFlightTime, 293);

    setHalifaxOption({
      airport: 'CYHZ',
      name: 'Halifax Stanfield International',
      distance: Math.round(halifaxDistance),
      flightTime: Math.round(halifaxFlightTime),
      fuelRequired: halifaxFuelRequired,
      cost: {
        total: halifaxCost.total,
        breakdown: {
          passenger: halifaxCost.hotel + halifaxCost.meals + halifaxCost.rebooking,
          crew: halifaxCost.breakdown.crewCosts,
          fuel: halifaxCost.breakdown.fuelCosts,
          handling: halifaxCost.breakdown.handlingFees
        }
      },
      weather: {
        conditions: halifaxWeather.conditions,
        visibility: halifaxWeather.visibility,
        winds: `${halifaxWeather.winds.direction}°/${halifaxWeather.winds.speed}kt`,
        category: halifaxWeather.conditions === 'VMC' ? 'CAT1' : 'CAT2'
      },
      facilities: {
        medical: true, // Halifax has excellent medical facilities
        customs24h: true, // 24/7 customs
        fireCategory: 9, // Category 9 fire services
        fuelAvailable: true
      },
      crewLegality: {
        legal: halifaxCrewStatus.legal,
        timeRemaining: halifaxCrewStatus.timeRemaining,
        riskLevel: halifaxCrewStatus.riskLevel
      },
      customerImpact: {
        score: halifaxCustomerImpact.score,
        category: halifaxCustomerImpact.category,
        compensation: halifaxCustomerImpact.estimatedCompensation
      },
      advantages: [
        'Major international airport',
        'Better passenger facilities',
        'More onward connections',
        'Excellent medical facilities',
        '24/7 customs and immigration'
      ],
      disadvantages: [
        'Further distance (+187 km)',
        'Higher fuel consumption',
        'Increased flight time',
        'Higher operational costs'
      ],
      overallScore: 85
    });

    // Generate recommendation
    if (halifaxFlightTime < 40 && halifaxFuelRequired < (currentFuel * 0.8)) {
      setRecommendation('HALIFAX RECOMMENDED: Better facilities and passenger care outweigh the additional distance. Crew remains legal and fuel is sufficient.');
    } else {
      setRecommendation('GANDER RECOMMENDED: Closest option with adequate facilities. Minimizes fuel risk and crew duty time exposure.');
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const toRadians = (degrees: number): number => degrees * (Math.PI / 180);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getRiskColor = (risk: string): string => {
    switch (risk) {
      case 'low': return 'bg-green-600';
      case 'medium': return 'bg-yellow-600';
      case 'high': return 'bg-orange-600';
      case 'critical': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  if (!ganderOption || !halifaxOption) {
    return <div className="p-6 text-white">Calculating diversion options...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <Card className="bg-blue-900/20 border-blue-500">
        <CardHeader>
          <CardTitle className="text-blue-300 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            VIR127C Diversion Analysis - Medical Emergency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-blue-200 mb-4">
            Current Position: 45.18°N, 69.17°W | Altitude: 40,000ft | Speed: 457kt
            <br />
            Fuel Remaining: 42,000 kg | Crew Duty: 187 minutes remaining
          </div>
          <div className="p-3 bg-blue-800/30 border border-blue-400 rounded">
            <p className="text-blue-100 font-medium">AI Recommendation:</p>
            <p className="text-blue-200">{recommendation}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Gander Option */}
        <Card className="bg-gray-800/50 border-gray-600">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Gander (CYQX)
              </span>
              <Badge className={ganderOption.overallScore >= 80 ? 'bg-green-600' : 
                               ganderOption.overallScore >= 70 ? 'bg-yellow-600' : 'bg-orange-600'}>
                Score: {ganderOption.overallScore}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Distance</div>
                <div className="text-white font-medium">{ganderOption.distance} km</div>
              </div>
              <div>
                <div className="text-gray-400">Flight Time</div>
                <div className="text-white font-medium">{ganderOption.flightTime} min</div>
              </div>
              <div>
                <div className="text-gray-400">Fuel Required</div>
                <div className="text-white font-medium">{ganderOption.fuelRequired.toLocaleString()} kg</div>
              </div>
            </div>

            {/* Cost Analysis */}
            <div>
              <div className="text-gray-400 mb-2">Cost Breakdown</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Passenger Care:</span>
                  <span className="text-white">{formatCurrency(ganderOption.cost.breakdown.passenger)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Crew Costs:</span>
                  <span className="text-white">{formatCurrency(ganderOption.cost.breakdown.crew)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Fuel Costs:</span>
                  <span className="text-white">{formatCurrency(ganderOption.cost.breakdown.fuel)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-600 pt-2">
                  <span className="text-yellow-400 font-medium">Total:</span>
                  <span className="text-yellow-400 font-bold">{formatCurrency(ganderOption.cost.total)}</span>
                </div>
              </div>
            </div>

            {/* Weather & Facilities */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-gray-400 mb-2">Weather</div>
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className={ganderOption.weather.conditions === 'VMC' ? 'bg-green-600' : 'bg-yellow-600'}>
                      {ganderOption.weather.category}
                    </Badge>
                  </div>
                  <div className="text-gray-300">Vis: {ganderOption.weather.visibility} km</div>
                  <div className="text-gray-300">Wind: {ganderOption.weather.winds}</div>
                </div>
              </div>
              <div>
                <div className="text-gray-400 mb-2">Facilities</div>
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    {ganderOption.facilities.medical ? <CheckCircle className="h-4 w-4 text-green-400" /> : <XCircle className="h-4 w-4 text-red-400" />}
                    <span className="text-gray-300">Medical</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {ganderOption.facilities.customs24h ? <CheckCircle className="h-4 w-4 text-green-400" /> : <XCircle className="h-4 w-4 text-red-400" />}
                    <span className="text-gray-300">24/7 Customs</span>
                  </div>
                  <div className="text-gray-300">Fire Cat: {ganderOption.facilities.fireCategory}</div>
                </div>
              </div>
            </div>

            {/* Crew Status */}
            <div>
              <div className="text-gray-400 mb-2">Crew Status</div>
              <div className="flex items-center justify-between">
                <div className={`text-sm font-medium ${ganderOption.crewLegality.legal ? 'text-green-400' : 'text-red-400'}`}>
                  {ganderOption.crewLegality.legal ? 'LEGAL' : 'ILLEGAL'}
                </div>
                <Badge className={getRiskColor(ganderOption.crewLegality.riskLevel)}>
                  {ganderOption.crewLegality.riskLevel.toUpperCase()}
                </Badge>
              </div>
              <div className="text-sm text-gray-300 mt-1">
                {ganderOption.crewLegality.timeRemaining} min remaining
              </div>
            </div>

            {/* Customer Impact */}
            <div>
              <div className="text-gray-400 mb-2">Customer Impact</div>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-white">{ganderOption.customerImpact.score}/100</div>
                <div className={`text-sm ${
                  ganderOption.customerImpact.category === 'severe' ? 'text-red-400' :
                  ganderOption.customerImpact.category === 'high' ? 'text-orange-400' :
                  ganderOption.customerImpact.category === 'moderate' ? 'text-yellow-400' : 'text-green-400'
                }`}>
                  {ganderOption.customerImpact.category.toUpperCase()}
                </div>
              </div>
              <div className="text-sm text-gray-300">
                Est. Compensation: {formatCurrency(ganderOption.customerImpact.compensation)}
              </div>
            </div>

            {/* Advantages/Disadvantages */}
            <div className="space-y-2">
              <div>
                <div className="text-green-400 text-sm font-medium mb-1">Advantages:</div>
                <ul className="text-xs text-gray-300 space-y-1">
                  {ganderOption.advantages.map((advantage, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-green-400 mt-1">•</span>
                      {advantage}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-red-400 text-sm font-medium mb-1">Disadvantages:</div>
                <ul className="text-xs text-gray-300 space-y-1">
                  {ganderOption.disadvantages.map((disadvantage, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-red-400 mt-1">•</span>
                      {disadvantage}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Halifax Option */}
        <Card className="bg-gray-800/50 border-gray-600">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Halifax (CYHZ)
              </span>
              <Badge className={halifaxOption.overallScore >= 80 ? 'bg-green-600' : 
                               halifaxOption.overallScore >= 70 ? 'bg-yellow-600' : 'bg-orange-600'}>
                Score: {halifaxOption.overallScore}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Distance</div>
                <div className="text-white font-medium">{halifaxOption.distance} km</div>
              </div>
              <div>
                <div className="text-gray-400">Flight Time</div>
                <div className="text-white font-medium">{halifaxOption.flightTime} min</div>
              </div>
              <div>
                <div className="text-gray-400">Fuel Required</div>
                <div className="text-white font-medium">{halifaxOption.fuelRequired.toLocaleString()} kg</div>
              </div>
            </div>

            {/* Cost Analysis */}
            <div>
              <div className="text-gray-400 mb-2">Cost Breakdown</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Passenger Care:</span>
                  <span className="text-white">{formatCurrency(halifaxOption.cost.breakdown.passenger)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Crew Costs:</span>
                  <span className="text-white">{formatCurrency(halifaxOption.cost.breakdown.crew)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Fuel Costs:</span>
                  <span className="text-white">{formatCurrency(halifaxOption.cost.breakdown.fuel)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-600 pt-2">
                  <span className="text-yellow-400 font-medium">Total:</span>
                  <span className="text-yellow-400 font-bold">{formatCurrency(halifaxOption.cost.total)}</span>
                </div>
              </div>
            </div>

            {/* Weather & Facilities */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-gray-400 mb-2">Weather</div>
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className={halifaxOption.weather.conditions === 'VMC' ? 'bg-green-600' : 'bg-yellow-600'}>
                      {halifaxOption.weather.category}
                    </Badge>
                  </div>
                  <div className="text-gray-300">Vis: {halifaxOption.weather.visibility} km</div>
                  <div className="text-gray-300">Wind: {halifaxOption.weather.winds}</div>
                </div>
              </div>
              <div>
                <div className="text-gray-400 mb-2">Facilities</div>
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    {halifaxOption.facilities.medical ? <CheckCircle className="h-4 w-4 text-green-400" /> : <XCircle className="h-4 w-4 text-red-400" />}
                    <span className="text-gray-300">Medical</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {halifaxOption.facilities.customs24h ? <CheckCircle className="h-4 w-4 text-green-400" /> : <XCircle className="h-4 w-4 text-red-400" />}
                    <span className="text-gray-300">24/7 Customs</span>
                  </div>
                  <div className="text-gray-300">Fire Cat: {halifaxOption.facilities.fireCategory}</div>
                </div>
              </div>
            </div>

            {/* Crew Status */}
            <div>
              <div className="text-gray-400 mb-2">Crew Status</div>
              <div className="flex items-center justify-between">
                <div className={`text-sm font-medium ${halifaxOption.crewLegality.legal ? 'text-green-400' : 'text-red-400'}`}>
                  {halifaxOption.crewLegality.legal ? 'LEGAL' : 'ILLEGAL'}
                </div>
                <Badge className={getRiskColor(halifaxOption.crewLegality.riskLevel)}>
                  {halifaxOption.crewLegality.riskLevel.toUpperCase()}
                </Badge>
              </div>
              <div className="text-sm text-gray-300 mt-1">
                {halifaxOption.crewLegality.timeRemaining} min remaining
              </div>
            </div>

            {/* Customer Impact */}
            <div>
              <div className="text-gray-400 mb-2">Customer Impact</div>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-white">{halifaxOption.customerImpact.score}/100</div>
                <div className={`text-sm ${
                  halifaxOption.customerImpact.category === 'severe' ? 'text-red-400' :
                  halifaxOption.customerImpact.category === 'high' ? 'text-orange-400' :
                  halifaxOption.customerImpact.category === 'moderate' ? 'text-yellow-400' : 'text-green-400'
                }`}>
                  {halifaxOption.customerImpact.category.toUpperCase()}
                </div>
              </div>
              <div className="text-sm text-gray-300">
                Est. Compensation: {formatCurrency(halifaxOption.customerImpact.compensation)}
              </div>
            </div>

            {/* Advantages/Disadvantages */}
            <div className="space-y-2">
              <div>
                <div className="text-green-400 text-sm font-medium mb-1">Advantages:</div>
                <ul className="text-xs text-gray-300 space-y-1">
                  {halifaxOption.advantages.map((advantage, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-green-400 mt-1">•</span>
                      {advantage}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-red-400 text-sm font-medium mb-1">Disadvantages:</div>
                <ul className="text-xs text-gray-300 space-y-1">
                  {halifaxOption.disadvantages.map((disadvantage, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-red-400 mt-1">•</span>
                      {disadvantage}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Comparison */}
      <Card className="bg-green-900/20 border-green-500">
        <CardHeader>
          <CardTitle className="text-green-300 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Decision Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-green-400 font-medium mb-2">Cost Difference</div>
              <div className="text-white">
                Halifax costs {formatCurrency(halifaxOption.cost.total - ganderOption.cost.total)} more
              </div>
            </div>
            <div>
              <div className="text-green-400 font-medium mb-2">Time Difference</div>
              <div className="text-white">
                Halifax requires {halifaxOption.flightTime - ganderOption.flightTime} minutes longer
              </div>
            </div>
            <div>
              <div className="text-green-400 font-medium mb-2">Fuel Difference</div>
              <div className="text-white">
                Halifax needs {(halifaxOption.fuelRequired - ganderOption.fuelRequired).toLocaleString()} kg more fuel
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-green-800/20 border border-green-400 rounded">
            <div className="text-green-300 font-medium mb-2">Operational Recommendation:</div>
            <div className="text-green-200">
              {halifaxOption.overallScore > ganderOption.overallScore 
                ? `Proceed to Halifax (CYHZ) - Higher operational score (${halifaxOption.overallScore} vs ${ganderOption.overallScore}) due to superior facilities and passenger care capabilities.`
                : `Proceed to Gander (CYQX) - Lower risk option with adequate facilities and minimal fuel/time exposure.`
              }
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}