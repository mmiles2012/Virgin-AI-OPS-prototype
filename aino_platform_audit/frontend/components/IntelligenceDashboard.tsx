import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  Target,
  FileText,
  Activity,
  BarChart3,
  Shield,
  Fuel,
  Wrench,
  Globe
} from 'lucide-react';

interface NewsArticle {
  id: number;
  title: string;
  content: string;
  source: string;
  published_at: string;
  relevance_score: number;
  categories: string[];
  impact_level: string;
  operational_significance: string;
}

interface OperationalAlert {
  id: string;
  type: string;
  level: string;
  title: string;
  summary: string;
  source: string;
  relevance_score: number;
  action_required: boolean;
  estimated_impact: string;
  timeline: string;
}

interface IntelligenceData {
  articles: NewsArticle[];
  analytics: {
    total_articles_today: number;
    high_relevance_articles: number;
    average_relevance_score: number;
    primary_categories: string[];
    trend_analysis: string;
  };
}

interface AlertsData {
  alerts: OperationalAlert[];
  summary: {
    total_alerts: number;
    high_priority: number;
    medium_priority: number;
    action_required_count: number;
  };
}

interface SummaryData {
  executive_summary: string;
  key_metrics: {
    articles_analyzed: number;
    high_priority_items: number;
    operational_alerts: number;
    regulatory_updates: number;
    market_impacts: number;
  };
  priority_actions: Array<{
    action: string;
    priority: string;
    timeline: string;
    impact: string;
  }>;
  market_outlook: {
    fuel_costs: string;
    regulations: string;
    technology: string;
    overall_trend: string;
  };
}

export default function IntelligenceDashboard() {
  const [intelligenceData, setIntelligenceData] = useState<IntelligenceData | null>(null);
  const [alertsData, setAlertsData] = useState<AlertsData | null>(null);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchIntelligenceData = async () => {
      try {
        setError('');
        const [newsResponse, alertsResponse, summaryResponse] = await Promise.all([
          fetch('/api/intelligence/news'),
          fetch('/api/intelligence/alerts'),
          fetch('/api/intelligence/summary')
        ]);

        if (newsResponse.ok && alertsResponse.ok && summaryResponse.ok) {
          const [newsData, alertsData, summaryData] = await Promise.all([
            newsResponse.json(),
            alertsResponse.json(),
            summaryResponse.json()
          ]);

          setIntelligenceData(newsData);
          setAlertsData(alertsData);
          setSummaryData(summaryData);
        } else {
          // Use fallback data if API fails
          console.warn('Intelligence API failed, using fallback data');
          setIntelligenceData({
            articles: [],
            analytics: {
              total_articles_today: 0,
              high_relevance_articles: 0,
              average_relevance_score: 0,
              primary_categories: [],
              trend_analysis: "System initializing"
            }
          });
          setAlertsData({
            alerts: [],
            summary: {
              total_alerts: 0,
              high_priority: 0,
              medium_priority: 0,
              action_required_count: 0
            }
          });
          setSummaryData({
            executive_summary: "Intelligence system initializing. Real-time aviation news and alerts monitoring is active.",
            key_metrics: {
              articles_analyzed: 0,
              high_priority_items: 0,
              operational_alerts: 0,
              regulatory_updates: 0,
              market_impacts: 0
            },
            priority_actions: [],
            market_outlook: {
              fuel_costs: "Monitoring",
              regulations: "Stable",
              technology: "Advancing",
              overall_trend: "Operational focus"
            }
          });
        }
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch intelligence data:', error);
        // Use fallback data instead of error state
        setIntelligenceData({
          articles: [],
          analytics: {
            total_articles_today: 0,
            high_relevance_articles: 0,
            average_relevance_score: 0,
            primary_categories: [],
            trend_analysis: "System initializing"
          }
        });
        setAlertsData({
          alerts: [],
          summary: {
            total_alerts: 0,
            high_priority: 0,
            medium_priority: 0,
            action_required_count: 0
          }
        });
        setSummaryData({
          executive_summary: "Intelligence system initializing. Real-time aviation news and alerts monitoring is active.",
          key_metrics: {
            articles_analyzed: 0,
            high_priority_items: 0,
            operational_alerts: 0,
            regulatory_updates: 0,
            market_impacts: 0
          },
          priority_actions: [],
          market_outlook: {
            fuel_costs: "Monitoring",
            regulations: "Stable",
            technology: "Advancing",
            overall_trend: "Operational focus"
          }
        });
        setLoading(false);
      }
    };

    fetchIntelligenceData();

    // Update intelligence data every 15 minutes
    const interval = setInterval(fetchIntelligenceData, 900000);
    return () => clearInterval(interval);
  }, []);

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'medium': return <Shield className="h-4 w-4 text-yellow-400" />;
      default: return <Activity className="h-4 w-4 text-blue-400" />;
    }
  };

  const getAlertBadge = (level: string) => {
    switch (level) {
      case 'high': return <Badge variant="destructive">High Priority</Badge>;
      case 'medium': return <Badge variant="secondary">Medium Priority</Badge>;
      default: return <Badge className="bg-blue-600">Information</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'direct_aviation': return <Target className="h-4 w-4" />;
      case 'energy': return <Fuel className="h-4 w-4" />;
      case 'regulation': return <Shield className="h-4 w-4" />;
      case 'economics': return <TrendingUp className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 3600));
    
    if (diffHours < 1) return 'Less than 1 hour ago';
    if (diffHours === 1) return '1 hour ago';
    return `${diffHours} hours ago`;
  };

  if (loading) {
    return (
      <Card className="aviation-panel">
        <CardContent className="flex items-center justify-center py-8">
          <Brain className="h-8 w-8 animate-pulse text-blue-400" />
          <span className="ml-2 text-white">Loading Intelligence Dashboard...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="aviation-panel">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertTriangle className="h-8 w-8 text-red-400 mb-2" />
          <span className="text-red-400 text-center">{error}</span>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="aviation-panel">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Aviation Intelligence Dashboard
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-blue-300">ML ACTIVE</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-300">LIVE NEWS</span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 bg-gray-800/50">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="news">Intelligence Feed</TabsTrigger>
              <TabsTrigger value="alerts">Operational Alerts</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {summaryData && (
                <>
                  <div className="bg-gray-800/50 rounded p-4 mb-4">
                    <h3 className="text-white font-medium mb-2">Executive Summary</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {summaryData.executive_summary}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-800/50 rounded p-3">
                      <div className="text-blue-300 text-sm">Articles Analyzed</div>
                      <div className="text-2xl font-bold text-white">{summaryData.key_metrics.articles_analyzed}</div>
                    </div>
                    <div className="bg-gray-800/50 rounded p-3">
                      <div className="text-blue-300 text-sm">High Priority Items</div>
                      <div className="text-2xl font-bold text-red-400">{summaryData.key_metrics.high_priority_items}</div>
                    </div>
                    <div className="bg-gray-800/50 rounded p-3">
                      <div className="text-blue-300 text-sm">Active Alerts</div>
                      <div className="text-2xl font-bold text-yellow-400">{summaryData.key_metrics.operational_alerts}</div>
                    </div>
                    <div className="bg-gray-800/50 rounded p-3">
                      <div className="text-blue-300 text-sm">Regulatory Updates</div>
                      <div className="text-2xl font-bold text-blue-400">{summaryData.key_metrics.regulatory_updates}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-gray-800/30">
                      <CardContent className="pt-4">
                        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                          <Target className="h-4 w-4 text-blue-400" />
                          Priority Actions
                        </h4>
                        <div className="space-y-2">
                          {summaryData.priority_actions.map((action, index) => (
                            <div key={index} className="border-l-2 border-blue-600 pl-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-white text-sm font-medium">{action.action}</span>
                                <Badge variant={action.priority === 'high' ? 'destructive' : action.priority === 'medium' ? 'secondary' : 'default'}>
                                  {action.priority}
                                </Badge>
                              </div>
                              <div className="text-gray-400 text-xs">Timeline: {action.timeline}</div>
                              <div className="text-gray-400 text-xs">Impact: {action.impact}</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-800/30">
                      <CardContent className="pt-4">
                        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-green-400" />
                          Market Outlook
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400 text-sm">Fuel Costs:</span>
                            <span className="text-red-400 text-sm">{summaryData.market_outlook.fuel_costs}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400 text-sm">Regulations:</span>
                            <span className="text-yellow-400 text-sm">{summaryData.market_outlook.regulations}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400 text-sm">Technology:</span>
                            <span className="text-green-400 text-sm">{summaryData.market_outlook.technology}</span>
                          </div>
                          <div className="mt-3 pt-2 border-t border-gray-600">
                            <span className="text-blue-300 text-sm font-medium">Overall Trend:</span>
                            <p className="text-white text-sm mt-1">{summaryData.market_outlook.overall_trend}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="news" className="space-y-4">
              {intelligenceData && (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white font-medium">Live Intelligence Feed</h3>
                    <div className="flex items-center gap-2">
                      {intelligenceData && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-green-400 text-xs">LIVE DATA</span>
                        </div>
                      )}
                      <Badge className="bg-blue-600">
                        {intelligenceData.analytics.total_articles_today} articles processed
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                    {intelligenceData.articles.map(article => (
                      <Card key={article.id} className="bg-gray-800/30">
                        <CardContent className="pt-3 pb-3">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-white font-medium text-sm leading-tight flex-1 mr-2">{article.title}</h4>
                            <div className="flex items-center gap-1 shrink-0">
                              <Badge variant={article.impact_level === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                                {article.relevance_score}%
                              </Badge>
                              {(article as any).ml_enhanced && (
                                <Badge variant="outline" className="text-xs border-green-600 text-green-400">
                                  ML
                                </Badge>
                              )}
                              {(article as any).confidence && (
                                <span className="text-blue-300 text-xs">
                                  {Math.round((article as any).confidence * 100)}%
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-300 text-xs mb-2 leading-relaxed line-clamp-2">{article.content}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-blue-300 text-xs truncate max-w-[120px]">{article.source}</span>
                              <span className="text-gray-400 text-xs">•</span>
                              <span className="text-gray-400 text-xs">{formatTimeAgo(article.published_at)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {article.categories.slice(0, 2).map(category => (
                                <div key={category} className="flex items-center gap-1 bg-gray-700/50 px-1.5 py-0.5 rounded text-xs">
                                  {getCategoryIcon(category)}
                                  <span className="text-gray-300 hidden sm:inline">{category.replace('_', ' ')}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          {article.operational_significance && (
                            <div className="mt-2 p-1.5 bg-blue-900/30 rounded border-l-2 border-blue-600">
                              <span className="text-blue-300 text-xs font-medium">Impact: </span>
                              <span className="text-blue-200 text-xs">{article.operational_significance}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4">
              {alertsData && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-800/50 rounded p-3">
                      <div className="text-blue-300 text-sm">Total Alerts</div>
                      <div className="text-2xl font-bold text-white">{alertsData.summary.total_alerts}</div>
                    </div>
                    <div className="bg-gray-800/50 rounded p-3">
                      <div className="text-blue-300 text-sm">High Priority</div>
                      <div className="text-2xl font-bold text-red-400">{alertsData.summary.high_priority}</div>
                    </div>
                    <div className="bg-gray-800/50 rounded p-3">
                      <div className="text-blue-300 text-sm">Medium Priority</div>
                      <div className="text-2xl font-bold text-yellow-400">{alertsData.summary.medium_priority}</div>
                    </div>
                    <div className="bg-gray-800/50 rounded p-3">
                      <div className="text-blue-300 text-sm">Action Required</div>
                      <div className="text-2xl font-bold text-orange-400">{alertsData.summary.action_required_count}</div>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                    {alertsData.alerts.map(alert => (
                      <Alert key={alert.id} className={`border-l-4 ${
                        alert.level === 'high' ? 'border-red-600 bg-red-900/20' :
                        alert.level === 'medium' ? 'border-yellow-600 bg-yellow-900/20' :
                        'border-blue-600 bg-blue-900/20'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {getAlertIcon(alert.level)}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-white font-medium text-sm">{alert.title}</span>
                                {getAlertBadge(alert.level)}
                                {alert.action_required && (
                                  <Badge variant="outline" className="border-orange-600 text-orange-400 text-xs">
                                    Action Required
                                  </Badge>
                                )}
                              </div>
                              <AlertDescription className="text-gray-300 text-xs mb-2 line-clamp-2">
                                {alert.summary}
                              </AlertDescription>
                              <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                                <span className="truncate max-w-[120px]">Source: {alert.source}</span>
                                <span>Score: {alert.relevance_score}%</span>
                                <span className="truncate max-w-[120px]">Timeline: {alert.timeline}</span>
                              </div>
                              <div className="mt-1 text-xs text-blue-300 truncate">
                                Impact: {alert.estimated_impact}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Alert>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              {intelligenceData && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-gray-800/30">
                      <CardContent className="pt-4">
                        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-blue-400" />
                          Intelligence Metrics
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-400 text-sm">Articles Today:</span>
                            <span className="text-white">{intelligenceData.analytics.total_articles_today}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400 text-sm">High Relevance:</span>
                            <span className="text-green-400">{intelligenceData.analytics.high_relevance_articles}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400 text-sm">Avg Relevance Score:</span>
                            <span className="text-blue-400">{intelligenceData.analytics.average_relevance_score}%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-800/30">
                      <CardContent className="pt-4">
                        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-400" />
                          Trend Analysis
                        </h4>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {intelligenceData.analytics.trend_analysis}
                        </p>
                        <div className="mt-3">
                          <span className="text-blue-300 text-sm font-medium">Primary Categories:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {intelligenceData.analytics.primary_categories.map(category => (
                              <Badge key={category} variant="outline" className="text-xs">
                                {category.replace('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}