import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plane, Globe, TrendingUp, Clock, MapPin, Users, DollarSign, Shield, Navigation, X, Route, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GeopoliticalAlert {
  id: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'airspace_closure' | 'diplomatic_tension' | 'sanctions' | 'military_activity';
  region: string;
  title: string;
  description: string;
  impact: string;
  affectedRoutes: string[];
  timeRemaining: string;
  recommendation: string;
}

interface RouteRisk {
  id: string;
  origin: string;
  destination: string;
  status: 'disrupted' | 'monitoring' | 'normal';
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  passengers: number;
  revenue: string;
  alternateRoute: string;
  additionalCost: string;
  delayMinutes: number;
}

interface RegionalRiskFactor {
  category: string;
  impact: 'high' | 'medium' | 'low';
  description: string;
  lastUpdated: string;
}

interface RegionalRiskAssessment {
  region: string;
  overallRisk: 'critical' | 'high' | 'medium' | 'low';
  riskFactors: RegionalRiskFactor[];
  affectedRoutes: string[];
  recommendations: string[];
  economicImpact: string;
  timeframe: string;
}

const GeopoliticalRiskCenter = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [alerts, setAlerts] = useState<GeopoliticalAlert[]>([]);
  const [routes, setRoutes] = useState<RouteRisk[]>([]);
  const [regionalAssessments, setRegionalAssessments] = useState<RegionalRiskAssessment[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<RegionalRiskAssessment | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState<RouteRisk | null>(null);
  const [showRouteOptions, setShowRouteOptions] = useState(false);
  const [showRegionalDetails, setShowRegionalDetails] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    fetchRiskData();
    const interval = setInterval(fetchRiskData, 300000); // Update every 5 minutes
    
    return () => {
      clearInterval(timer);
      clearInterval(interval);
    };
  }, []);

  const fetchRiskData = async () => {
    try {
      // Simulate fetching real-time geopolitical risk data
      const sampleAlerts: GeopoliticalAlert[] = [
        {
          id: 1,
          severity: 'critical',
          type: 'airspace_closure',
          region: 'Eastern Mediterranean',
          title: 'Airspace Restriction - Military Activity',
          description: 'Temporary airspace closure affecting routes to Tel Aviv and Beirut',
          impact: 'High',
          affectedRoutes: ['LHR-TLV', 'CDG-BEY', 'FRA-TLV'],
          timeRemaining: '6 hours',
          recommendation: 'Reroute via Turkish airspace, expect 45min delay'
        },
        {
          id: 2,
          severity: 'high',
          type: 'diplomatic_tension',
          region: 'South China Sea',
          title: 'Diplomatic Tensions - Route Monitoring',
          description: 'Escalating tensions may affect overfly permissions',
          impact: 'Medium',
          affectedRoutes: ['LAX-HKG', 'SFO-TPE', 'SEA-MNL'],
          timeRemaining: 'Ongoing',
          recommendation: 'Monitor situation, prepare alternate routes'
        },
        {
          id: 3,
          severity: 'medium',
          type: 'sanctions',
          region: 'Eastern Europe',
          title: 'Sanctions Update - Fuel Restrictions',
          description: 'New fuel procurement restrictions in affected regions',
          impact: 'Medium',
          affectedRoutes: ['LHR-MOW', 'CDG-LED'],
          timeRemaining: 'Indefinite',
          recommendation: 'Identify alternative fuel suppliers'
        }
      ];

      const sampleRoutes: RouteRisk[] = [
        {
          id: 'VS45',
          origin: 'London (LHR)',
          destination: 'Tel Aviv (TLV)',
          status: 'disrupted',
          riskLevel: 'critical',
          passengers: 180,
          revenue: '$540K',
          alternateRoute: 'Via Istanbul (IST)',
          additionalCost: '$45K',
          delayMinutes: 45
        },
        {
          id: 'VS11',
          origin: 'London (LHR)',
          destination: 'Hong Kong (HKG)',
          status: 'monitoring',
          riskLevel: 'high',
          passengers: 350,
          revenue: '$1.2M',
          alternateRoute: 'Via Seoul (ICN)',
          additionalCost: '$30K',
          delayMinutes: 20
        },
        {
          id: 'VS3',
          origin: 'London (LHR)',
          destination: 'New York (JFK)',
          status: 'normal',
          riskLevel: 'low',
          passengers: 280,
          revenue: '$980K',
          alternateRoute: 'N/A',
          additionalCost: '$0',
          delayMinutes: 0
        }
      ];

      const regionalRiskAssessments: RegionalRiskAssessment[] = [
        {
          region: 'Eastern Mediterranean',
          overallRisk: 'critical',
          riskFactors: [
            {
              category: 'Military Operations',
              impact: 'high',
              description: 'Active military exercises restricting civilian airspace corridors',
              lastUpdated: '2 hours ago'
            },
            {
              category: 'Diplomatic Relations',
              impact: 'high',
              description: 'Deteriorating diplomatic ties affecting overflight permissions',
              lastUpdated: '6 hours ago'
            },
            {
              category: 'Air Traffic Control',
              impact: 'medium',
              description: 'Reduced ATC capacity due to security protocols',
              lastUpdated: '4 hours ago'
            },
            {
              category: 'Insurance Costs',
              impact: 'high',
              description: 'War risk insurance premiums increased by 300%',
              lastUpdated: '1 day ago'
            }
          ],
          affectedRoutes: ['LHR-TLV', 'CDG-BEY', 'FRA-TLV', 'MXP-CAI'],
          recommendations: [
            'Reroute via Turkish or Greek airspace',
            'Increase fuel reserves for longer routings',
            'Monitor NOTAM updates every 2 hours',
            'Prepare passenger rebooking protocols'
          ],
          economicImpact: '$2.8M daily revenue at risk',
          timeframe: 'Ongoing - reassess in 6 hours'
        },
        {
          region: 'South China Sea',
          overallRisk: 'high',
          riskFactors: [
            {
              category: 'Maritime Disputes',
              impact: 'high',
              description: 'Territorial disputes affecting international aviation corridors',
              lastUpdated: '3 hours ago'
            },
            {
              category: 'Naval Activities',
              impact: 'medium',
              description: 'Increased naval patrols in key flight paths',
              lastUpdated: '5 hours ago'
            },
            {
              category: 'Regulatory Changes',
              impact: 'medium',
              description: 'Frequent changes to airspace restrictions and reporting requirements',
              lastUpdated: '1 day ago'
            },
            {
              category: 'Emergency Protocols',
              impact: 'medium',
              description: 'Enhanced security screening for flights over disputed areas',
              lastUpdated: '2 days ago'
            }
          ],
          affectedRoutes: ['LAX-HKG', 'SFO-TPE', 'SEA-MNL', 'LHR-SIN'],
          recommendations: [
            'File flight plans 24 hours in advance',
            'Maintain real-time contact with regional ATC',
            'Prepare alternative Pacific routings',
            'Brief crew on emergency diversion procedures'
          ],
          economicImpact: '$1.5M potential additional costs',
          timeframe: 'Monitoring - review weekly'
        },
        {
          region: 'Eastern Europe',
          overallRisk: 'medium',
          riskFactors: [
            {
              category: 'Economic Sanctions',
              impact: 'high',
              description: 'Fuel procurement restrictions and payment processing delays',
              lastUpdated: '1 day ago'
            },
            {
              category: 'Airspace Closures',
              impact: 'medium',
              description: 'Partial closures affecting northern European routes',
              lastUpdated: '8 hours ago'
            },
            {
              category: 'Currency Fluctuations',
              impact: 'medium',
              description: 'Volatile exchange rates impacting operational costs',
              lastUpdated: '6 hours ago'
            },
            {
              category: 'Supply Chain',
              impact: 'low',
              description: 'Limited impact on catering and ground services',
              lastUpdated: '2 days ago'
            }
          ],
          affectedRoutes: ['LHR-MOW', 'CDG-LED', 'FRA-KBP'],
          recommendations: [
            'Secure alternative fuel suppliers',
            'Hedge currency exposure for operational costs',
            'Monitor sanctions list updates daily',
            'Establish contingency payment methods'
          ],
          economicImpact: '$800K additional operational costs',
          timeframe: 'Long-term monitoring required'
        },
        {
          region: 'North Atlantic',
          overallRisk: 'low',
          riskFactors: [
            {
              category: 'Weather Systems',
              impact: 'medium',
              description: 'Seasonal storm patterns affecting routing efficiency',
              lastUpdated: '2 hours ago'
            },
            {
              category: 'Air Traffic Density',
              impact: 'low',
              description: 'High traffic volumes during peak travel periods',
              lastUpdated: '4 hours ago'
            },
            {
              category: 'Regulatory Compliance',
              impact: 'low',
              description: 'Standard ICAO regulations with periodic updates',
              lastUpdated: '1 week ago'
            }
          ],
          affectedRoutes: ['LHR-JFK', 'LHR-BOS', 'LGW-BWI', 'MAN-JFK'],
          recommendations: [
            'Monitor weather routing updates',
            'Optimize departure slots for efficiency',
            'Maintain standard fuel reserves',
            'Continue normal operations'
          ],
          economicImpact: 'Minimal operational impact',
          timeframe: 'Routine monitoring'
        }
      ];

      setAlerts(sampleAlerts);
      setRoutes(sampleRoutes);
      setRegionalAssessments(regionalRiskAssessments);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching risk data:', error);
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'critical': return 'bg-red-900/20 border-red-600 text-red-300';
      case 'high': return 'bg-orange-900/20 border-orange-600 text-orange-300';
      case 'medium': return 'bg-yellow-900/20 border-yellow-600 text-yellow-300';
      case 'low': return 'bg-green-900/20 border-green-600 text-green-300';
      default: return 'bg-gray-900/20 border-gray-600 text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'disrupted': return 'bg-red-500';
      case 'monitoring': return 'bg-yellow-500';
      case 'normal': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch(riskLevel) {
      case 'critical': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-white">Loading geopolitical risk data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-h-full overflow-y-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Geopolitical Risk Center</h1>
          <p className="text-gray-300">Real-time global risk assessment for Virgin Atlantic operations</p>
        </div>
        <div className="text-sm text-gray-400">
          Last updated: {currentTime.toLocaleTimeString()}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'dashboard' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'analysis' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          Risk Analysis
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Active Alerts</p>
                    <p className="text-2xl font-bold text-red-400">{alerts.length}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Affected Routes</p>
                    <p className="text-2xl font-bold text-orange-400">
                      {routes.filter(r => r.status !== 'normal').length}
                    </p>
                  </div>
                  <Navigation className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Passengers Impacted</p>
                    <p className="text-2xl font-bold text-blue-400">530</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Cost Impact</p>
                    <p className="text-2xl font-bold text-purple-400">$75K</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Critical Alerts */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                Critical Alerts Requiring Immediate Action
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts.filter(alert => alert.severity === 'critical').map(alert => (
                <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${getSeverityColor(alert.severity)}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">{alert.title}</h4>
                      <p className="text-sm mt-1 text-gray-300">{alert.description}</p>
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-400">
                        <span className="flex items-center">
                          <Globe className="h-4 w-4 mr-1" />
                          {alert.region}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {alert.timeRemaining}
                        </span>
                      </div>
                      <Alert className="mt-2 bg-blue-900/20 border-blue-600">
                        <AlertDescription className="text-blue-300">
                          <strong>Recommendation:</strong> {alert.recommendation}
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Route Status Overview */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Plane className="h-5 w-5 mr-2 text-blue-500" />
                Virgin Atlantic Route Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Flight</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Route</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Risk Level</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Passengers</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Revenue Impact</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-600">
                    {routes.map(route => (
                      <tr key={route.id}>
                        <td className="px-4 py-3 text-sm font-medium text-white">{route.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{route.origin} → {route.destination}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(route.status)}`}>
                            {route.status}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-sm font-medium ${getRiskLevelColor(route.riskLevel)}`}>
                          {route.riskLevel}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">{route.passengers}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{route.revenue}</td>
                        <td className="px-4 py-3 text-sm">
                          {route.status !== 'normal' && (
                            <button 
                              onClick={() => {
                                setSelectedRoute(route);
                                setShowRouteOptions(true);
                              }}
                              className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                            >
                              View Options
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Globe className="h-5 w-5 mr-2 text-green-500" />
                  Risk Factors by Region
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-red-900/20 rounded border border-red-600">
                  <span className="text-gray-300">Middle East</span>
                  <span className="px-2 py-1 bg-red-500 text-white text-xs rounded">Critical</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-900/20 rounded border border-orange-600">
                  <span className="text-gray-300">South China Sea</span>
                  <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded">High</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-900/20 rounded border border-yellow-600">
                  <span className="text-gray-300">Eastern Europe</span>
                  <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded">Medium</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-900/20 rounded border border-green-600">
                  <span className="text-gray-300">North America</span>
                  <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">Low</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
                  Predictive Indicators
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 border border-gray-600 rounded">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-300">Diplomatic Relations Index</span>
                    <span className="text-sm font-medium text-orange-400">Declining</span>
                  </div>
                  <div className="mt-1 w-full bg-gray-600 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{width: '35%'}}></div>
                  </div>
                </div>
                <div className="p-3 border border-gray-600 rounded">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-300">Military Activity Level</span>
                    <span className="text-sm font-medium text-red-400">High</span>
                  </div>
                  <div className="mt-1 w-full bg-gray-600 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{width: '80%'}}></div>
                  </div>
                </div>
                <div className="p-3 border border-gray-600 rounded">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-300">Economic Sanctions Risk</span>
                    <span className="text-sm font-medium text-yellow-400">Medium</span>
                  </div>
                  <div className="mt-1 w-full bg-gray-600 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{width: '60%'}}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Route Options Modal */}
      {showRouteOptions && selectedRoute && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg border border-gray-600 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-600">
              <h2 className="text-xl font-bold text-white flex items-center">
                <Route className="h-6 w-6 mr-2 text-blue-500" />
                Route Options - {selectedRoute.id} ({selectedRoute.origin} → {selectedRoute.destination})
              </h2>
              <button 
                onClick={() => setShowRouteOptions(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Current Status */}
              <Card className="bg-gray-700 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 text-orange-500" />
                    Current Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Status</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(selectedRoute.status)}`}>
                        {selectedRoute.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Risk Level</p>
                      <p className={`font-medium ${getRiskLevelColor(selectedRoute.riskLevel)}`}>
                        {selectedRoute.riskLevel}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Passengers</p>
                      <p className="text-white font-medium">{selectedRoute.passengers}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Revenue Impact</p>
                      <p className="text-white font-medium">{selectedRoute.revenue}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Available Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Option 1: Continue Current Route */}
                <Card className="bg-gray-700 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Continue Current Route</CardTitle>
                    <CardDescription className="text-gray-400">
                      Proceed with original flight path despite risks
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Additional Cost:</span>
                        <span className="text-white">$0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Delay:</span>
                        <span className="text-white">0 minutes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Risk Level:</span>
                        <span className={getRiskLevelColor(selectedRoute.riskLevel)}>
                          {selectedRoute.riskLevel}
                        </span>
                      </div>
                    </div>
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors">
                      Select This Option
                    </button>
                  </CardContent>
                </Card>

                {/* Option 2: Use Alternate Route */}
                <Card className="bg-gray-700 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Alternate Route</CardTitle>
                    <CardDescription className="text-gray-400">
                      {selectedRoute.alternateRoute}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Additional Cost:</span>
                        <span className="text-white">{selectedRoute.additionalCost}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Delay:</span>
                        <span className="text-white">{selectedRoute.delayMinutes} minutes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Risk Level:</span>
                        <span className="text-green-400">Low</span>
                      </div>
                    </div>
                    <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition-colors">
                      Select This Option
                    </button>
                  </CardContent>
                </Card>

                {/* Option 3: Delay Flight */}
                <Card className="bg-gray-700 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Delay Flight</CardTitle>
                    <CardDescription className="text-gray-400">
                      Wait for improved conditions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Additional Cost:</span>
                        <span className="text-white">$2,500</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Delay:</span>
                        <span className="text-white">240 minutes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Risk Level:</span>
                        <span className="text-green-400">Low</span>
                      </div>
                    </div>
                    <button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded transition-colors">
                      Select This Option
                    </button>
                  </CardContent>
                </Card>

                {/* Option 4: Cancel Flight */}
                <Card className="bg-gray-700 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Cancel Flight</CardTitle>
                    <CardDescription className="text-gray-400">
                      Full cancellation with passenger rebooking
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Revenue Loss:</span>
                        <span className="text-red-400">{selectedRoute.revenue}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Rebooking Cost:</span>
                        <span className="text-white">$15,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Risk Level:</span>
                        <span className="text-green-400">None</span>
                      </div>
                    </div>
                    <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition-colors">
                      Select This Option
                    </button>
                  </CardContent>
                </Card>
              </div>

              {/* AI Recommendation */}
              <Card className="bg-blue-900/20 border-blue-600">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-blue-500" />
                    AI Recommendation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-blue-300">
                    Based on current risk assessment and operational parameters, we recommend using the 
                    <strong> alternate route</strong>. This option provides the best balance of safety, 
                    cost efficiency, and passenger experience with minimal delay.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeopoliticalRiskCenter;