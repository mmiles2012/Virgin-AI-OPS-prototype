import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plane, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Activity, 
  MapPin,
  Users,
  Gauge,
  Wind,
  Cloud,
  Globe,
  Target,
  BarChart3,
  Calendar,
  Zap
} from 'lucide-react';

interface HubData {
  icao: string;
  iata: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
  type: 'primary' | 'secondary' | 'regional';
  virginAtlanticOperations: boolean;
  runways: string[];
  capacity: {
    hourly: number;
    daily: number;
    terminal_capacity: number;
  };
  performance: {
    onTimeRate: number;
    avgDelayMinutes: number;
    holdingFrequency: number;
    avgHoldingTime: number;
  };
}

interface HubDelayPrediction {
  flightNumber: string;
  route: string;
  hub: string;
  scheduledDeparture: string;
  scheduledArrival: string;
  aircraft: string;
  predictions: {
    delayProbability: number;
    expectedDelayMinutes: number;
    holdingProbability: number;
    expectedHoldingTime: number;
    confidence: number;
    hubSpecificRisk: number;
  };
  hubFactors: {
    terminalCongestion: number;
    runwayUtilization: number;
    weatherImpact: number;
    slotRestrictions: number;
    connectionComplexity: number;
    groundOperations: number;
  };
  recommendations: string[];
  priorityLevel: 'critical' | 'high' | 'medium' | 'low';
}

const HubDelayPredictionDashboard: React.FC = () => {
  const [selectedHub, setSelectedHub] = useState<string>('EGLL');
  const [predictions, setPredictions] = useState<HubDelayPrediction[]>([]);
  const [hubData, setHubData] = useState<HubData[]>([]);
  const [seasonalPatterns, setSeasonalPatterns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

  const majorHubs: HubData[] = [
    {
      icao: 'EGLL',
      iata: 'LHR',
      name: 'London Heathrow',
      city: 'London',
      country: 'United Kingdom',
      timezone: 'Europe/London',
      type: 'primary',
      virginAtlanticOperations: true,
      runways: ['09L/27R', '09R/27L'],
      capacity: {
        hourly: 85,
        daily: 1300,
        terminal_capacity: 480
      },
      performance: {
        onTimeRate: 72.3,
        avgDelayMinutes: 18.7,
        holdingFrequency: 23.1,
        avgHoldingTime: 8.4
      }
    },
    {
      icao: 'KJFK',
      iata: 'JFK',
      name: 'John F. Kennedy International',
      city: 'New York',
      country: 'United States',
      timezone: 'America/New_York',
      type: 'primary',
      virginAtlanticOperations: true,
      runways: ['04L/22R', '04R/22L', '08L/26R', '08R/26L'],
      capacity: {
        hourly: 78,
        daily: 1200,
        terminal_capacity: 425
      },
      performance: {
        onTimeRate: 68.9,
        avgDelayMinutes: 22.1,
        holdingFrequency: 28.7,
        avgHoldingTime: 11.2
      }
    },
    {
      icao: 'KBOS',
      iata: 'BOS',
      name: 'Boston Logan International',
      city: 'Boston',
      country: 'United States',
      timezone: 'America/New_York',
      type: 'secondary',
      virginAtlanticOperations: true,
      runways: ['04L/22R', '04R/22L', '09/27', '14/32', '15L/33R', '15R/33L'],
      capacity: {
        hourly: 65,
        daily: 950,
        terminal_capacity: 385
      },
      performance: {
        onTimeRate: 74.8,
        avgDelayMinutes: 16.3,
        holdingFrequency: 19.4,
        avgHoldingTime: 7.1
      }
    },
    {
      icao: 'KATL',
      iata: 'ATL',
      name: 'Hartsfield-Jackson Atlanta International',
      city: 'Atlanta',
      country: 'United States',
      timezone: 'America/New_York',
      type: 'primary',
      virginAtlanticOperations: true,
      runways: ['08L/26R', '08R/26L', '09L/27R', '09R/27L', '10/28'],
      capacity: {
        hourly: 98,
        daily: 1450,
        terminal_capacity: 520
      },
      performance: {
        onTimeRate: 71.2,
        avgDelayMinutes: 19.8,
        holdingFrequency: 21.6,
        avgHoldingTime: 9.3
      }
    },
    {
      icao: 'VABB',
      iata: 'BOM',
      name: 'Chhatrapati Shivaji Maharaj International',
      city: 'Mumbai',
      country: 'India',
      timezone: 'Asia/Kolkata',
      type: 'secondary',
      virginAtlanticOperations: true,
      runways: ['09/27', '14/32'],
      capacity: {
        hourly: 52,
        daily: 780,
        terminal_capacity: 295
      },
      performance: {
        onTimeRate: 69.7,
        avgDelayMinutes: 21.4,
        holdingFrequency: 31.2,
        avgHoldingTime: 13.8
      }
    }
  ];

  useEffect(() => {
    fetchHubData();
    generateHubPredictions();
    fetchSeasonalPatterns();
  }, [selectedHub, timeRange]);

  const fetchHubData = async () => {
    try {
      setHubData(majorHubs);
    } catch (error) {
      console.error('Failed to fetch hub data:', error);
    }
  };

  const fetchSeasonalPatterns = async () => {
    try {
      const response = await fetch('/api/delays/seasonal-patterns');
      const data = await response.json();
      if (data.success) {
        setSeasonalPatterns(data.patterns);
      }
    } catch (error) {
      console.error('Failed to fetch seasonal patterns:', error);
    }
  };

  const generateHubPredictions = () => {
    const currentHub = majorHubs.find(h => h.icao === selectedHub);
    if (!currentHub) return;

    const hubPredictions: HubDelayPrediction[] = [
      {
        flightNumber: 'VS001',
        route: 'LHR-JFK',
        hub: selectedHub,
        scheduledDeparture: '11:00',
        scheduledArrival: '15:30',
        aircraft: 'Boeing 787-9',
        predictions: {
          delayProbability: selectedHub === 'EGLL' ? 28.3 : 35.7,
          expectedDelayMinutes: selectedHub === 'EGLL' ? 18.7 : 22.1,
          holdingProbability: selectedHub === 'EGLL' ? 23.1 : 28.7,
          expectedHoldingTime: selectedHub === 'EGLL' ? 8.4 : 11.2,
          confidence: selectedHub === 'EGLL' ? 94.2 : 91.8,
          hubSpecificRisk: selectedHub === 'EGLL' ? 31.5 : 42.3
        },
        hubFactors: {
          terminalCongestion: selectedHub === 'EGLL' ? 65 : 72,
          runwayUtilization: selectedHub === 'EGLL' ? 78 : 84,
          weatherImpact: selectedHub === 'EGLL' ? 23 : 31,
          slotRestrictions: selectedHub === 'EGLL' ? 89 : 67,
          connectionComplexity: selectedHub === 'EGLL' ? 91 : 85,
          groundOperations: selectedHub === 'EGLL' ? 45 : 58
        },
        recommendations: selectedHub === 'EGLL' ? [
          'Monitor T3 terminal congestion levels',
          'Consider early boarding due to slot restrictions',
          'Coordinate with ground handling for expedited turnaround'
        ] : [
          'Request priority handling due to connection complexity',
          'Monitor weather patterns over North Atlantic',
          'Consider alternate slot if available'
        ],
        priorityLevel: 'high'
      },
      {
        flightNumber: 'VS103',
        route: selectedHub === 'EGLL' ? 'LHR-ATL' : 'ATL-LHR',
        hub: selectedHub,
        scheduledDeparture: '14:20',
        scheduledArrival: '19:45',
        aircraft: 'Airbus A350-1000',
        predictions: {
          delayProbability: selectedHub === 'EGLL' ? 22.1 : 29.4,
          expectedDelayMinutes: selectedHub === 'EGLL' ? 15.3 : 19.8,
          holdingProbability: selectedHub === 'EGLL' ? 19.7 : 24.6,
          expectedHoldingTime: selectedHub === 'EGLL' ? 7.2 : 9.8,
          confidence: selectedHub === 'EGLL' ? 96.1 : 93.4,
          hubSpecificRisk: selectedHub === 'EGLL' ? 26.8 : 35.2
        },
        hubFactors: {
          terminalCongestion: selectedHub === 'EGLL' ? 58 : 68,
          runwayUtilization: selectedHub === 'EGLL' ? 71 : 79,
          weatherImpact: selectedHub === 'EGLL' ? 19 : 25,
          slotRestrictions: selectedHub === 'EGLL' ? 85 : 61,
          connectionComplexity: selectedHub === 'EGLL' ? 88 : 82,
          groundOperations: selectedHub === 'EGLL' ? 41 : 53
        },
        recommendations: selectedHub === 'EGLL' ? [
          'Optimal departure window - minimal delays expected',
          'Monitor afternoon traffic buildup',
          'Coordinate passenger connections'
        ] : [
          'Monitor afternoon thunderstorm activity',
          'Consider fuel contingency for holding',
          'Coordinate with ATL ground control'
        ],
        priorityLevel: 'medium'
      }
    ];

    // Add more flights based on the selected hub
    if (selectedHub === 'EGLL') {
      hubPredictions.push({
        flightNumber: 'VS355',
        route: 'LHR-BOM',
        hub: selectedHub,
        scheduledDeparture: '21:15',
        scheduledArrival: '12:30+1',
        aircraft: 'Airbus A330-300',
        predictions: {
          delayProbability: 19.4,
          expectedDelayMinutes: 12.8,
          holdingProbability: 16.3,
          expectedHoldingTime: 6.1,
          confidence: 97.3,
          hubSpecificRisk: 23.1
        },
        hubFactors: {
          terminalCongestion: 52,
          runwayUtilization: 67,
          weatherImpact: 15,
          slotRestrictions: 81,
          connectionComplexity: 74,
          groundOperations: 38
        },
        recommendations: [
          'Evening departure - reduced traffic congestion',
          'Monitor Middle East weather en route',
          'Coordinate with Mumbai arrival slot'
        ],
        priorityLevel: 'low'
      });
    }

    setPredictions(hubPredictions);
    setLoading(false);
  };

  const currentHubData = useMemo(() => {
    return majorHubs.find(h => h.icao === selectedHub);
  }, [selectedHub]);

  const getRiskColor = (risk: number) => {
    if (risk < 25) return 'text-green-400';
    if (risk < 50) return 'text-yellow-400';
    if (risk < 75) return 'text-orange-400';
    return 'text-red-400';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-600';
      case 'medium': return 'bg-yellow-600';
      default: return 'bg-green-600';
    }
  };

  const hubComparisonData = majorHubs.map(hub => ({
    name: hub.iata,
    onTime: hub.performance.onTimeRate,
    avgDelay: hub.performance.avgDelayMinutes,
    holding: hub.performance.holdingFrequency,
    capacity: hub.capacity.hourly
  }));

  const factorData = predictions.length > 0 ? [
    { name: 'Terminal Congestion', value: predictions[0].hubFactors.terminalCongestion },
    { name: 'Runway Utilization', value: predictions[0].hubFactors.runwayUtilization },
    { name: 'Weather Impact', value: predictions[0].hubFactors.weatherImpact },
    { name: 'Slot Restrictions', value: predictions[0].hubFactors.slotRestrictions },
    { name: 'Connection Complexity', value: predictions[0].hubFactors.connectionComplexity },
    { name: 'Ground Operations', value: predictions[0].hubFactors.groundOperations }
  ] : [];

  return (
    <div className="h-full bg-gray-50 text-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <MapPin className="h-8 w-8 text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold">Hub-Centric Delay Prediction</h1>
              <p className="text-gray-400">Heathrow-prioritized analytics with major hub comparison</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Select value={selectedHub} onValueChange={setSelectedHub}>
              <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Select Hub" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {majorHubs.map(hub => (
                  <SelectItem key={hub.icao} value={hub.icao} className="text-white hover:bg-gray-700">
                    <div className="flex items-center gap-2">
                      <Badge className={hub.type === 'primary' ? 'bg-blue-600' : 'bg-gray-600'}>
                        {hub.iata}
                      </Badge>
                      <span>{hub.name}</span>
                      {hub.virginAtlanticOperations && (
                        <Plane className="h-4 w-4 text-red-400" />
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
              <SelectTrigger className="w-32 bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="today" className="text-white hover:bg-gray-700">Today</SelectItem>
                <SelectItem value="week" className="text-white hover:bg-gray-700">Week</SelectItem>
                <SelectItem value="month" className="text-white hover:bg-gray-700">Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Hub Overview */}
        {currentHubData && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-400" />
                {currentHubData.name} ({currentHubData.iata}) Overview
                {currentHubData.type === 'primary' && (
                  <Badge className="bg-blue-600">Primary Hub</Badge>
                )}
                {currentHubData.virginAtlanticOperations && (
                  <Badge className="bg-red-600">Virgin Atlantic</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {currentHubData.performance.onTimeRate}%
                  </div>
                  <div className="text-sm text-gray-400">On-Time Performance</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {currentHubData.performance.avgDelayMinutes}min
                  </div>
                  <div className="text-sm text-gray-400">Average Delay</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">
                    {currentHubData.performance.holdingFrequency}%
                  </div>
                  <div className="text-sm text-gray-400">Holding Frequency</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {currentHubData.capacity.hourly}/hr
                  </div>
                  <div className="text-sm text-gray-400">Hourly Capacity</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">Overview</TabsTrigger>
            <TabsTrigger value="predictions" className="data-[state=active]:bg-blue-600">Predictions</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-600">Analytics</TabsTrigger>
            <TabsTrigger value="comparison" className="data-[state=active]:bg-blue-600">Hub Comparison</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Current Hub Factors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-400" />
                    Hub Operational Factors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={factorData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#9CA3AF"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={12}
                      />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '6px'
                        }}
                      />
                      <Bar dataKey="value" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-400" />
                    Performance Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={seasonalPatterns.slice(0, 12)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="monthName" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '6px'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="avgDelayRate" 
                        stroke="#EF4444" 
                        strokeWidth={2}
                        name="Delay Rate %"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="holdingLikelihood" 
                        stroke="#F59E0B" 
                        strokeWidth={2}
                        name="Holding %"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="predictions" className="space-y-6">
            {/* Flight Predictions */}
            <div className="space-y-4">
              {predictions.map((prediction, index) => (
                <Card key={index} className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Plane className="h-5 w-5 text-blue-400" />
                        {prediction.flightNumber} - {prediction.route}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(prediction.priorityLevel)}>
                          {prediction.priorityLevel.toUpperCase()}
                        </Badge>
                        <Badge className="bg-gray-600">
                          {prediction.aircraft}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getRiskColor(prediction.predictions.delayProbability)}`}>
                          {prediction.predictions.delayProbability.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-400">Delay Probability</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getRiskColor(prediction.predictions.expectedDelayMinutes)}`}>
                          {prediction.predictions.expectedDelayMinutes.toFixed(0)}min
                        </div>
                        <div className="text-sm text-gray-400">Expected Delay</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getRiskColor(prediction.predictions.holdingProbability)}`}>
                          {prediction.predictions.holdingProbability.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-400">Holding Probability</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">
                          {prediction.predictions.confidence.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-400">Confidence</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-300">Recommendations:</div>
                      {prediction.recommendations.map((rec, i) => (
                        <div key={i} className="text-sm text-gray-400 flex items-center gap-2">
                          <Target className="h-4 w-4 text-blue-400 flex-shrink-0" />
                          {rec}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-400" />
                    Hub Risk Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={factorData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {factorData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6', '#F97316'][index % 6]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '6px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-400" />
                    Seasonal Impact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={seasonalPatterns.slice(0, 12)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="monthName" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '6px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="avgDelayMinutes" 
                        stackId="1" 
                        stroke="#3B82F6" 
                        fill="#3B82F6" 
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-yellow-400" />
                  Hub Performance Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={hubComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '6px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="onTime" fill="#10B981" name="On-Time Rate %" />
                    <Bar dataKey="avgDelay" fill="#EF4444" name="Avg Delay (min)" />
                    <Bar dataKey="holding" fill="#F59E0B" name="Holding Frequency %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Hub Comparison Table */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Detailed Hub Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left p-2">Hub</th>
                        <th className="text-left p-2">Type</th>
                        <th className="text-left p-2">On-Time Rate</th>
                        <th className="text-left p-2">Avg Delay</th>
                        <th className="text-left p-2">Hourly Capacity</th>
                        <th className="text-left p-2">Virgin Atlantic</th>
                      </tr>
                    </thead>
                    <tbody>
                      {majorHubs.map((hub) => (
                        <tr key={hub.icao} className={`border-b border-gray-700 ${hub.icao === selectedHub ? 'bg-blue-900/20' : ''}`}>
                          <td className="p-2 font-medium">{hub.iata} - {hub.name}</td>
                          <td className="p-2">
                            <Badge className={hub.type === 'primary' ? 'bg-blue-600' : 'bg-gray-600'}>
                              {hub.type}
                            </Badge>
                          </td>
                          <td className="p-2 text-green-400">{hub.performance.onTimeRate}%</td>
                          <td className="p-2 text-yellow-400">{hub.performance.avgDelayMinutes}min</td>
                          <td className="p-2 text-blue-400">{hub.capacity.hourly}/hr</td>
                          <td className="p-2">
                            {hub.virginAtlanticOperations ? (
                              <Plane className="h-4 w-4 text-red-400" />
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HubDelayPredictionDashboard;