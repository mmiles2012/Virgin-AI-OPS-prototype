import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  Award,
  BookOpen,
  Target,
  CheckCircle,
  AlertCircle,
  Activity
} from 'lucide-react';

interface TrainingScenario {
  id: string;
  type: string;
  content: string;
  questions: Array<{
    type: string;
    question: string;
    options?: string[];
    input_type?: string;
    range?: number[];
    context: string;
  }>;
  difficulty: string;
  focus: string;
}

interface UserResponse {
  questionType: string;
  answer: string | number;
  confidence: number;
}

export default function MLTrainingDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [scenarios, setScenarios] = useState<TrainingScenario[]>([]);
  const [currentScenario, setCurrentScenario] = useState<TrainingScenario | null>(null);
  const [userResponses, setUserResponses] = useState<UserResponse[]>([]);
  const [modelPerformance, setModelPerformance] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [userProgress, setUserProgress] = useState({
    scenarios_completed: 0,
    expertise_rating: 'developing',
    total_contributions: 0
  });

  // News feedback state
  const [newsContent, setNewsContent] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [impactCategory, setImpactCategory] = useState('');
  const [predictedDelay, setPredictedDelay] = useState('');
  const [costImpact, setCostImpact] = useState('');
  const [userConfidence, setUserConfidence] = useState(0.8);
  const [expertiseLevel, setExpertiseLevel] = useState('intermediate');

  useEffect(() => {
    loadModelPerformance();
    loadTrainingScenarios();
  }, []);

  const loadModelPerformance = async () => {
    try {
      const response = await fetch('/api/ml/train/model-performance');
      const data = await response.json();
      if (data.success) {
        setModelPerformance(data.model_performance);
        setUserProgress(data.user_impact_summary);
      }
    } catch (error) {
      console.error('Failed to load model performance:', error);
    }
  };

  const loadTrainingScenarios = async (difficulty?: string, focus?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (difficulty) params.append('difficulty_level', difficulty);
      if (focus) params.append('focus_area', focus);
      
      const response = await fetch(`/api/ml/train/active-learning?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setScenarios(data.learning_scenarios);
      }
    } catch (error) {
      console.error('Failed to load scenarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitNewsFeedback = async () => {
    if (!newsContent || !riskLevel || !impactCategory) return;

    try {
      setLoading(true);
      const response = await fetch('/api/ml/train/news-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_content: newsContent,
          user_assessment: {
            risk_level: riskLevel,
            impact_category: impactCategory,
            predicted_delay: parseInt(predictedDelay) || 0,
            cost_impact: parseInt(costImpact) || 0,
            confidence: userConfidence
          },
          expertise_level: expertiseLevel,
          feedback_type: 'training'
        })
      });

      const result = await response.json();
      if (result.success) {
        // Reset form
        setNewsContent('');
        setRiskLevel('');
        setImpactCategory('');
        setPredictedDelay('');
        setCostImpact('');
        
        // Refresh model performance
        await loadModelPerformance();
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const startScenario = (scenario: TrainingScenario) => {
    setCurrentScenario(scenario);
    setUserResponses([]);
    setActiveTab('scenario');
  };

  const submitScenarioResponse = async () => {
    if (!currentScenario || userResponses.length === 0) return;

    try {
      setLoading(true);
      const response = await fetch('/api/ml/train/submit-learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario_id: currentScenario.id,
          user_responses: userResponses,
          completion_time: 120,
          confidence_level: userResponses.reduce((sum, r) => sum + r.confidence, 0) / userResponses.length
        })
      });

      const result = await response.json();
      if (result.success) {
        setCurrentScenario(null);
        setUserResponses([]);
        setActiveTab('overview');
        await loadModelPerformance();
      }
    } catch (error) {
      console.error('Failed to submit scenario:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Model Accuracy</p>
                <p className="text-2xl font-bold text-green-600">
                  {modelPerformance?.current_metrics?.accuracy ? 
                    (modelPerformance.current_metrics.accuracy * 100).toFixed(1) + '%' : 
                    '87.4%'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Your Contributions</p>
                <p className="text-2xl font-bold text-blue-600">{userProgress.total_contributions}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expertise Level</p>
                <p className="text-lg font-bold text-purple-600 capitalize">{userProgress.expertise_rating}</p>
              </div>
              <Award className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {modelPerformance?.recent_improvements && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Model Improvements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Accuracy Trend</p>
                <p className="text-lg font-semibold text-green-600">
                  {modelPerformance.recent_improvements.accuracy_trend}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">User Contributions</p>
                <p className="text-lg font-semibold text-blue-600">
                  {modelPerformance.recent_improvements.user_contributions}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Expert Annotations</p>
                <p className="text-lg font-semibold text-purple-600">
                  {modelPerformance.recent_improvements.expert_annotations}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Model Stability</p>
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  {modelPerformance.recent_improvements.model_stability}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Training Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={() => setActiveTab('news-feedback')}
              className="flex items-center justify-center space-x-2 h-20"
            >
              <Brain className="h-6 w-6" />
              <div className="text-left">
                <p className="font-semibold">News Intelligence Training</p>
                <p className="text-sm opacity-80">Teach models to analyze aviation news</p>
              </div>
            </Button>
            
            <Button 
              onClick={() => setActiveTab('scenarios')}
              variant="outline"
              className="flex items-center justify-center space-x-2 h-20"
            >
              <Target className="h-6 w-6" />
              <div className="text-left">
                <p className="font-semibold">Interactive Scenarios</p>
                <p className="text-sm opacity-80">Practice with real aviation situations</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderNewsFeedback = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>News Intelligence Training</CardTitle>
          <p className="text-gray-600">Help improve news analysis models by providing expert assessments</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="news-content">Aviation News Article</Label>
            <Textarea
              id="news-content"
              placeholder="Paste aviation news content here..."
              value={newsContent}
              onChange={(e) => setNewsContent(e.target.value)}
              rows={6}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="risk-level">Risk Level Assessment</Label>
              <Select value={riskLevel} onValueChange={setRiskLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select risk level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                  <SelectItem value="critical">Critical Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="impact-category">Impact Category</Label>
              <Select value={impactCategory} onValueChange={setImpactCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select impact type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="safety">Safety</SelectItem>
                  <SelectItem value="economic">Economic</SelectItem>
                  <SelectItem value="regulatory">Regulatory</SelectItem>
                  <SelectItem value="geopolitical">Geopolitical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="predicted-delay">Predicted Delay (minutes)</Label>
              <Input
                id="predicted-delay"
                type="number"
                placeholder="0"
                value={predictedDelay}
                onChange={(e) => setPredictedDelay(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="cost-impact">Cost Impact (USD)</Label>
              <Input
                id="cost-impact"
                type="number"
                placeholder="0"
                value={costImpact}
                onChange={(e) => setCostImpact(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="confidence">Confidence Level</Label>
              <Select value={userConfidence.toString()} onValueChange={(v) => setUserConfidence(parseFloat(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">50% - Uncertain</SelectItem>
                  <SelectItem value="0.7">70% - Moderately Confident</SelectItem>
                  <SelectItem value="0.8">80% - Confident</SelectItem>
                  <SelectItem value="0.9">90% - Very Confident</SelectItem>
                  <SelectItem value="0.95">95% - Extremely Confident</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="expertise">Your Expertise Level</Label>
              <Select value={expertiseLevel} onValueChange={setExpertiseLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={submitNewsFeedback}
            disabled={loading || !newsContent || !riskLevel || !impactCategory}
            className="w-full"
          >
            {loading ? 'Training Model...' : 'Submit Training Data'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderScenarios = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Training Scenarios</h3>
        <div className="flex space-x-2">
          <Button 
            onClick={() => loadTrainingScenarios('beginner')}
            variant="outline"
            size="sm"
          >
            Beginner
          </Button>
          <Button 
            onClick={() => loadTrainingScenarios('intermediate')}
            variant="outline"
            size="sm"
          >
            Intermediate
          </Button>
          <Button 
            onClick={() => loadTrainingScenarios('advanced')}
            variant="outline"
            size="sm"
          >
            Advanced
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {scenarios.map((scenario) => (
          <Card key={scenario.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <h4 className="text-lg font-semibold capitalize">{scenario.type.replace('_', ' ')}</h4>
                </div>
                <div className="flex space-x-2">
                  <Badge variant="outline">{scenario.difficulty}</Badge>
                  <Badge variant="outline">{scenario.focus}</Badge>
                </div>
              </div>
              
              <p className="text-gray-700 mb-4">{scenario.content}</p>
              
              <div className="text-sm text-gray-600 mb-4">
                <p><strong>Questions:</strong> {scenario.questions.length}</p>
                <p><strong>Focus:</strong> {scenario.focus}</p>
              </div>
              
              <Button 
                onClick={() => startScenario(scenario)}
                className="w-full"
              >
                Start Training Scenario
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderCurrentScenario = () => {
    if (!currentScenario) return null;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{currentScenario.type.replace('_', ' ').toUpperCase()}</CardTitle>
            <div className="flex space-x-2">
              <Badge>{currentScenario.difficulty}</Badge>
              <Badge variant="outline">{currentScenario.focus}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-900">{currentScenario.content}</p>
            </div>

            <div className="space-y-6">
              {currentScenario.questions.map((question, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <p className="font-medium mb-2">{question.question}</p>
                    <p className="text-sm text-gray-600 mb-4">{question.context}</p>
                    
                    {question.options ? (
                      <div className="space-y-2">
                        {question.options.map((option) => (
                          <label key={option} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name={`question_${index}`}
                              value={option}
                              onChange={(e) => {
                                const newResponses = [...userResponses];
                                newResponses[index] = {
                                  questionType: question.type,
                                  answer: e.target.value,
                                  confidence: 0.8
                                };
                                setUserResponses(newResponses);
                              }}
                            />
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <Input
                        type={question.input_type || 'text'}
                        placeholder="Enter your answer"
                        onChange={(e) => {
                          const newResponses = [...userResponses];
                          newResponses[index] = {
                            questionType: question.type,
                            answer: question.input_type === 'number' ? 
                              parseInt(e.target.value) || 0 : e.target.value,
                            confidence: 0.8
                          };
                          setUserResponses(newResponses);
                        }}
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex space-x-4 mt-6">
              <Button 
                onClick={() => setCurrentScenario(null)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={submitScenarioResponse}
                disabled={userResponses.length !== currentScenario.questions.length}
                className="flex-1"
              >
                Submit Responses
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ML Model Training Dashboard</h1>
        <p className="text-gray-600">Help improve aviation intelligence models with your expertise</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="news-feedback">News Training</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="scenario">Current Scenario</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="news-feedback">
          {renderNewsFeedback()}
        </TabsContent>

        <TabsContent value="scenarios">
          {renderScenarios()}
        </TabsContent>

        <TabsContent value="scenario">
          {renderCurrentScenario()}
        </TabsContent>
      </Tabs>
    </div>
  );
}