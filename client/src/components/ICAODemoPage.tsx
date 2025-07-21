import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Plane, 
  AlertTriangle, 
  MapPin, 
  Activity,
  Shield,
  Database,
  Brain,
  Eye
} from 'lucide-react';

interface DemoData {
  flights?: any[];
  notams?: any[];
  airports?: any[];
  safetyIntelligence?: any;
  comprehensiveReport?: any;
}

export default function ICAODemoPage() {
  const [demoData, setDemoData] = useState<DemoData>({});
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [activeDemo, setActiveDemo] = useState<string>('overview');

  const fetchDemoData = async (endpoint: string, key: string) => {
    setLoading(prev => ({ ...prev, [key]: true }));
    try {
      const response = await fetch(`/api/icao/demo/${endpoint}`);
      const data = await response.json();
      
      if (data.success) {
        setDemoData(prev => ({ ...prev, [key]: data }));
      }
    } catch (error) {
      console.error(`Failed to fetch ${endpoint}:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const loadAllDemos = async () => {
    await Promise.all([
      fetchDemoData('flights', 'flights'),
      fetchDemoData('notams', 'notams'),
      fetchDemoData('airports', 'airports'),
      fetchDemoData('ml-safety', 'safetyIntelligence'),
      fetchDemoData('comprehensive-report', 'comprehensiveReport')
    ]);
  };

  useEffect(() => {
    loadAllDemos();
  }, []);

  const renderFlightDemo = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">ICAO Flight Tracking Demo</h3>
        <Button 
          onClick={() => fetchDemoData('flights', 'flights')}
          disabled={loading.flights}
        >
          <Activity className="mr-2 h-4 w-4" />
          {loading.flights ? 'Loading...' : 'Refresh Data'}
        </Button>
      </div>

      {demoData.flights?.flights?.map((flight: any, index: number) => (
        <Card key={index} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
                  <Plane className="h-6 w-6 text-aero-blue-dark" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold">{flight.callsign}</h4>
                  <p className="text-sm text-muted-foreground">{flight.aircraft_type} • {flight.operator}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {flight.emergency && (
                  <Badge className="bg-red-100 text-red-800 border-red-200">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Emergency
                  </Badge>
                )}
                <Badge variant="outline">{flight.flight_phase}</Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-foreground0">Route</p>
                <p className="font-medium">{flight.origin} → {flight.destination}</p>
              </div>
              <div>
                <p className="text-foreground0">Altitude</p>
                <p className="font-medium">{flight.position?.altitude_ft?.toLocaleString()} ft</p>
              </div>
              <div>
                <p className="text-foreground0">Speed</p>
                <p className="font-medium">{flight.speed?.ground_speed_kts} kts</p>
              </div>
              <div>
                <p className="text-foreground0">Squawk</p>
                <p className="font-medium">{flight.squawk}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h4 className="font-medium text-blue-900 mb-2">Demo Features Showcased</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            {demoData.flights?.features_demonstrated?.map((feature: string, index: number) => (
              <li key={index}>• {feature}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );

  const renderNotamDemo = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">ICAO NOTAM Intelligence Demo</h3>
        <Button 
          onClick={() => fetchDemoData('notams', 'notams')}
          disabled={loading.notams}
        >
          <Database className="mr-2 h-4 w-4" />
          {loading.notams ? 'Loading...' : 'Refresh NOTAMs'}
        </Button>
      </div>

      {demoData.notams?.notams?.map((notam: any, index: number) => (
        <Card key={index} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-aero-orange-alert" />
                <h4 className="text-lg font-semibold">{notam.airport_icao}</h4>
              </div>
              <Badge className={`${
                notam.severity === 'critical' ? 'bg-red-100 text-red-800 border-red-200' :
                notam.severity === 'high' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                notam.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                'bg-blue-100 text-blue-800 border-blue-200'
              }`}>
                {notam.severity.toUpperCase()}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm"><strong>Type:</strong> {notam.type}</p>
              <p className="text-sm"><strong>Condition:</strong> {notam.condition}</p>
              <p className="text-sm"><strong>Location:</strong> {notam.location}</p>
              <p className="text-sm text-muted-foreground">{notam.description}</p>
            </div>
            
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-xs text-foreground0">
                <span>ID: {notam.notam_id}</span>
              </div>
              {notam.affects_operations && (
                <Badge variant="destructive">Affects Operations</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderMLSafetyDemo = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">ML Safety Intelligence Demo</h3>
        <Button 
          onClick={() => fetchDemoData('ml-safety', 'safetyIntelligence')}
          disabled={loading.safetyIntelligence}
        >
          <Brain className="mr-2 h-4 w-4" />
          {loading.safetyIntelligence ? 'Processing...' : 'Generate Intelligence'}
        </Button>
      </div>

      {demoData.safetyIntelligence?.safety_intelligence && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {demoData.safetyIntelligence.safety_intelligence.critical_alerts?.length || 0}
                  </div>
                  <p className="text-sm text-red-700">Critical Alerts</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {demoData.safetyIntelligence.safety_intelligence.warning_alerts?.length || 0}
                  </div>
                  <p className="text-sm text-yellow-700">Warning Alerts</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-aero-blue-dark">
                    {demoData.safetyIntelligence.safety_intelligence.advisory_alerts?.length || 0}
                  </div>
                  <p className="text-sm text-blue-700">Advisory Alerts</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {demoData.safetyIntelligence.safety_intelligence.critical_alerts?.map((alert: any, index: number) => (
            <Card key={index} className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-red-900">{alert.type}</h4>
                  <Badge className="bg-red-100 text-red-800 border-red-200">CRITICAL</Badge>
                </div>
                <p className="text-red-800 mb-2">{alert.message}</p>
                <div className="text-sm text-red-700">
                  <p><strong>Aircraft:</strong> {alert.callsign}</p>
                  <p><strong>Confidence:</strong> {(alert.ml_confidence * 100).toFixed(1)}%</p>
                  <p><strong>Action:</strong> {alert.recommended_action}</p>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <h4 className="font-medium text-green-900 mb-2">ML Model Performance</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-green-700">Accuracy</p>
                  <p className="font-semibold">{(demoData.safetyIntelligence.safety_intelligence.ml_model_performance?.accuracy * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-green-700">Precision</p>
                  <p className="font-semibold">{(demoData.safetyIntelligence.safety_intelligence.ml_model_performance?.precision * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-green-700">Recall</p>
                  <p className="font-semibold">{(demoData.safetyIntelligence.safety_intelligence.ml_model_performance?.recall * 100).toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );

  const renderComprehensiveReport = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Comprehensive Aviation Intelligence Report</h3>
        <Button 
          onClick={() => fetchDemoData('comprehensive-report', 'comprehensiveReport')}
          disabled={loading.comprehensiveReport}
        >
          <Eye className="mr-2 h-4 w-4" />
          {loading.comprehensiveReport ? 'Generating...' : 'Generate Report'}
        </Button>
      </div>

      {demoData.comprehensiveReport?.aviation_intelligence_report && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-aero-blue-dark">
                    {demoData.comprehensiveReport.aviation_intelligence_report.summary?.total_flights_tracked}
                  </div>
                  <p className="text-sm text-muted-foreground">Flights Tracked</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {demoData.comprehensiveReport.aviation_intelligence_report.summary?.active_notams}
                  </div>
                  <p className="text-sm text-muted-foreground">Active NOTAMs</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {demoData.comprehensiveReport.aviation_intelligence_report.summary?.monitored_airports}
                  </div>
                  <p className="text-sm text-muted-foreground">Airports Monitored</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {demoData.comprehensiveReport.aviation_intelligence_report.operational_overview?.emergency_situations}
                  </div>
                  <p className="text-sm text-muted-foreground">Emergency Situations</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardHeader>
              <CardTitle className="text-purple-900">Integration Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(demoData.comprehensiveReport.integration_features || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-purple-700 capitalize">{key.replace(/_/g, ' ')}</span>
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                      {value as string}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {demoData.comprehensiveReport.aviation_intelligence_report.data_sources?.map((source: string, index: number) => (
                  <Badge key={index} variant="outline">{source}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ICAO Aviation Intelligence Demonstration</h1>
        <p className="text-muted-foreground">Comprehensive showcase of official ICAO data integration with ML safety intelligence</p>
      </div>

      <div className="flex justify-center">
        <Button onClick={loadAllDemos} disabled={Object.values(loading).some(Boolean)}>
          <Shield className="mr-2 h-4 w-4" />
          Load All Demonstrations
        </Button>
      </div>

      <Tabs value={activeDemo} onValueChange={setActiveDemo} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="flights">Flight Tracking</TabsTrigger>
          <TabsTrigger value="notams">NOTAMs</TabsTrigger>
          <TabsTrigger value="ml-safety">ML Safety</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {renderComprehensiveReport()}
        </TabsContent>

        <TabsContent value="flights">
          {renderFlightDemo()}
        </TabsContent>

        <TabsContent value="notams">
          {renderNotamDemo()}
        </TabsContent>

        <TabsContent value="ml-safety">
          {renderMLSafetyDemo()}
        </TabsContent>
      </Tabs>

      <Card className="bg-slate-50 border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">ICAO Integration Capabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Official ICAO Data</h4>
              <ul className="text-sm space-y-1 text-slate-700">
                <li>• Real-time flight tracking with ICAO24 addresses</li>
                <li>• Comprehensive NOTAM intelligence</li>
                <li>• Airport operational data</li>
                <li>• Regulatory compliance monitoring</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">ML Safety Intelligence</h4>
              <ul className="text-sm space-y-1 text-slate-700">
                <li>• Emergency detection algorithms</li>
                <li>• Predictive risk assessment</li>
                <li>• Random Forest safety models</li>
                <li>• Real-time alert generation</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}