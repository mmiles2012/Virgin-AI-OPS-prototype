import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Globe, Newspaper, Shield, Clock, CheckCircle, XCircle } from 'lucide-react';

interface NewsAPIConnection {
  success: boolean;
  message: string;
}

interface NewsAPITestResults {
  newsapi: NewsAPIConnection;
  rssFeeds: NewsAPIConnection;
}

interface GeopoliticalRiskFactor {
  category: string;
  impact: 'high' | 'medium' | 'low';
  description: string;
  source: string;
  lastUpdated: string;
}

interface GeopoliticalAnalysis {
  region: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  articles: any[];
  riskFactors: GeopoliticalRiskFactor[];
  summary: string;
  recommendations: string[];
}

export function NewsIntelligenceDashboard() {
  const [apiConnections, setApiConnections] = useState<NewsAPITestResults | null>(null);
  const [geopoliticalData, setGeopoliticalData] = useState<Record<string, GeopoliticalAnalysis>>({});
  const [loading, setLoading] = useState(false);
  const [testingAPIs, setTestingAPIs] = useState(false);

  const regions = [
    'Eastern Mediterranean', 
    'South China Sea', 
    'Eastern Europe', 
    'North Atlantic',
    'Middle East',
    'India Pakistan',
    'Caribbean',
    'Africa',
    'Indian Ocean',
    'North America'
  ];

  // Test all news API connections
  const testNewsAPIConnections = async () => {
    setTestingAPIs(true);
    try {
      const response = await fetch('/api/news/test-connections');
      const data = await response.json();
      console.log('API connections response:', data);
      
      if (data.success) {
        // Handle nested results structure from API: data.results.results contains the actual connection data
        const connections = data.results?.results || data.results || data.connections;
        console.log('Setting connections:', connections);
        
        // Transform the connection data to match expected interface
        if (connections && typeof connections === 'object') {
          const transformedConnections = {
            newsapi: {
              success: connections.newsapi?.status === 'connected',
              message: connections.newsapi?.status === 'connected' ? 'Connected to NewsAPI.org' : 'Not configured'
            },
            rssFeeds: {
              success: connections.rssFeeds?.status === 'available',
              message: connections.rssFeeds?.status === 'available' ? 'RSS feeds available' : 'Not available'
            }
          };
          setApiConnections(transformedConnections);
        }
      }
    } catch (error) {
      console.error('Failed to test news API connections:', error);
    } finally {
      setTestingAPIs(false);
    }
  };

  // Fetch geopolitical risk analysis for a region
  const fetchGeopoliticalAnalysis = async (region: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/news/geopolitical-risk/${encodeURIComponent(region)}`);
      const data = await response.json();
      console.log(`Geopolitical analysis for ${region}:`, data);
      
      if (data.success || data.region) {
        // Handle direct analysis data structure
        const analysisData = data.analysis || data;
        console.log(`Setting analysis data for ${region}:`, analysisData);
        setGeopoliticalData(prev => ({
          ...prev,
          [region]: analysisData
        }));
      }
    } catch (error) {
      console.error(`Failed to fetch geopolitical analysis for ${region}:`, error);
    } finally {
      setLoading(false);
    }
  };

  // Load all geopolitical data
  const loadAllGeopoliticalData = async () => {
    for (const region of regions) {
      await fetchGeopoliticalAnalysis(region);
    }
  };

  useEffect(() => {
    testNewsAPIConnections();
  }, []);

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-500 text-white border-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConnectionIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Globe className="h-8 w-8 text-blue-600" />
            Geopolitical Intelligence Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Real-time geopolitical risk assessment powered by comprehensive news intelligence
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={testNewsAPIConnections} 
            disabled={testingAPIs}
            variant="outline"
          >
            <Shield className="h-4 w-4 mr-2" />
            {testingAPIs ? 'Testing APIs...' : 'Test APIs'}
          </Button>
          <Button 
            onClick={loadAllGeopoliticalData} 
            disabled={loading}
          >
            <Newspaper className="h-4 w-4 mr-2" />
            {loading ? 'Loading...' : 'Load Intelligence'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="connections" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="connections">API Connections</TabsTrigger>
          <TabsTrigger value="analysis">Risk Analysis</TabsTrigger>
          <TabsTrigger value="intelligence">Live Intelligence</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                News API Status Monitor
              </CardTitle>
            </CardHeader>
            <CardContent>
              {apiConnections ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(apiConnections).map(([api, status]) => (
                    <div key={api} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-2">
                        {getConnectionIcon(status.success)}
                        <div>
                          <div className="font-medium capitalize">{api.replace(/([A-Z])/g, ' $1')}</div>
                          <div className="text-sm text-gray-600">{status.message}</div>
                        </div>
                      </div>
                      <Badge 
                        variant={status.success ? "default" : "destructive"}
                        className={status.success ? "bg-green-100 text-green-800" : ""}
                      >
                        {status.success ? 'Connected' : 'Disconnected'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">Click "Test APIs" to check news service connections</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <div className="max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {regions.map(region => {
              const analysis = geopoliticalData[region];
              return (
                <Card key={region}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{region}</span>
                      {analysis && (
                        <Badge className={getRiskLevelColor(analysis.riskLevel)}>
                          {analysis.riskLevel.toUpperCase()}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analysis ? (
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Risk Summary</h4>
                          <p className="text-sm text-gray-600">{analysis.summary}</p>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Key Risk Factors</h4>
                          <div className="space-y-2">
                            {analysis.riskFactors.slice(0, 3).map((factor, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${getImpactColor(factor.impact)}`}
                                >
                                  {factor.impact}
                                </Badge>
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{factor.category}</div>
                                  <div className="text-xs text-gray-600">{factor.description}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Operational Recommendations</h4>
                          <ul className="space-y-1">
                            {analysis.recommendations.slice(0, 3).map((rec, index) => (
                              <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                                <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {analysis.articles.length} articles analyzed
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => fetchGeopoliticalAnalysis(region)}
                          disabled={loading}
                        >
                          Load Analysis
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="intelligence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Newspaper className="h-5 w-5" />
                Live Intelligence Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                <div className="space-y-4">
                  {Object.entries(geopoliticalData).map(([region, analysis]) => (
                    <div key={region} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{region}</h4>
                      <Badge className={getRiskLevelColor(analysis.riskLevel)}>
                        {analysis.riskLevel}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {analysis.articles.slice(0, 4).map((article, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded border">
                          <h5 className="font-medium text-sm mb-1">{article.title}</h5>
                          <p className="text-xs text-gray-600 mb-2">{article.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">{article.source}</span>
                            <Badge variant="outline" className="text-xs">
                              {article.category}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {Object.keys(geopoliticalData).length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Load geopolitical analysis to view live intelligence feed</p>
                  </div>
                )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}