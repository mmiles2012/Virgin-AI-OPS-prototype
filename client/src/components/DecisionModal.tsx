import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  Users, 
  Shield, 
  Zap,
  Fuel,
  Activity,
  Timer,
  CheckCircle,
  XCircle
} from 'lucide-react';

export interface DecisionOption {
  id: string;
  title: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  impact: {
    cost: number;
    delay: number;
    safety: number;
    passengers: number;
  };
  requirements: string[];
  timeline: string;
  confidence: number;
  decisionScore?: number;
}

interface DecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: DecisionOption[];
  selectedOptionId?: string;
  emergencyType?: string;
  flightNumber?: string;
  timeRemaining?: number;
  onDecision?: (optionId: string, decisionMaker: 'crew' | 'operations' | 'ai') => void;
}

const DecisionModal: React.FC<DecisionModalProps> = ({
  isOpen,
  onClose,
  options,
  selectedOptionId,
  emergencyType = 'operational',
  flightNumber = 'Unknown',
  timeRemaining = 300,
  onDecision
}) => {
  const [selectedOption, setSelectedOption] = useState<string>(selectedOptionId || '');
  const [timer, setTimer] = useState(timeRemaining);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<string>('');

  useEffect(() => {
    if (selectedOptionId) {
      setSelectedOption(selectedOptionId);
    }
  }, [selectedOptionId]);

  useEffect(() => {
    if (isOpen && timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isOpen, timer]);

  useEffect(() => {
    if (options.length > 0) {
      // Calculate AI recommendation based on decision scores
      const bestOption = options.reduce((prev, current) => 
        (current.decisionScore || 0) > (prev.decisionScore || 0) ? current : prev
      );
      setAiRecommendation(bestOption.id);
    }
  }, [options]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRiskColor = (risk: string): string => {
    switch (risk) {
      case 'low': return 'bg-green-600';
      case 'medium': return 'bg-yellow-600';
      case 'high': return 'bg-orange-600';
      case 'critical': return 'bg-va-red-primary';
      default: return 'bg-gray-600';
    }
  };

  const getEmergencyIcon = () => {
    switch (emergencyType) {
      case 'medical': return <Activity className="h-5 w-5 text-va-red-primary" />;
      case 'technical': return <Zap className="h-5 w-5 text-aero-orange-alert" />;
      case 'fuel': return <Fuel className="h-5 w-5 text-aero-amber-caution" />;
      case 'weather': return <AlertTriangle className="h-5 w-5 text-aero-blue-primary" />;
      default: return <Shield className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const handleDecision = async (decisionMaker: 'crew' | 'operations' | 'ai') => {
    if (!selectedOption) return;
    
    setIsProcessing(true);
    
    try {
      if (onDecision) {
        await onDecision(selectedOption, decisionMaker);
      }
      
      // Simulate processing time
      setTimeout(() => {
        setIsProcessing(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Decision processing failed:', error);
      setIsProcessing(false);
    }
  };

  const selectedOptionData = options.find(opt => opt.id === selectedOption);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-foreground">
            {getEmergencyIcon()}
            Decision Required - {flightNumber}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {emergencyType.charAt(0).toUpperCase() + emergencyType.slice(1)} situation requires immediate decision
          </DialogDescription>
        </DialogHeader>

        {/* Decision Timer */}
        <Card className="border-orange-500 bg-aero-orange-alert/10 mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-aero-orange-alert" />
                <span className="text-orange-300 font-medium">Time to Decision</span>
              </div>
              <div className="text-2xl font-mono text-aero-orange-alert">
                {formatTime(timer)}
              </div>
            </div>
            <Progress 
              value={(timer / timeRemaining) * 100} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        {/* Decision Options */}
        <div className="space-y-3">
          <h3 className="text-foreground font-medium mb-3">Available Options ({options.length})</h3>
          
          {options.map((option) => (
            <Card
              key={option.id}
              className={`cursor-pointer transition-all ${
                selectedOption === option.id
                  ? 'border-blue-400 bg-blue-900/30'
                  : 'border-border hover:border-gray-500'
              }`}
              onClick={() => setSelectedOption(option.id)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-medium text-foreground">
                        {option.title}
                      </div>
                      {aiRecommendation === option.id && (
                        <Badge className="bg-aero-blue-primary text-foreground text-xs">
                          AI RECOMMENDED
                        </Badge>
                      )}
                    </div>
                    <div className="text-muted-foreground text-sm mb-3">
                      {option.description}
                    </div>
                    
                    {/* Impact Metrics */}
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-aero-green-safe" />
                        <span className="text-muted-foreground">Cost:</span>
                        <span className={option.impact.cost < 0 ? 'text-aero-green-safe' : 'text-va-red-primary'}>
                          {option.impact.cost < 0 ? '-' : '+'}${Math.abs(option.impact.cost).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-aero-blue-primary" />
                        <span className="text-muted-foreground">Delay:</span>
                        <span className={option.impact.delay < 0 ? 'text-aero-green-safe' : 'text-va-red-primary'}>
                          {option.impact.delay < 0 ? '-' : '+'}${Math.abs(option.impact.delay)}min
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Shield className="h-4 w-4 text-purple-400" />
                        <span className="text-muted-foreground">Safety:</span>
                        <span className={option.impact.safety > 0 ? 'text-aero-green-safe' : 'text-va-red-primary'}>
                          {option.impact.safety > 0 ? '+' : ''}{option.impact.safety}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-aero-amber-caution" />
                        <span className="text-muted-foreground">Passengers:</span>
                        <span className="text-muted-foreground">{option.impact.passengers}</span>
                      </div>
                    </div>
                    
                    {/* Decision Score */}
                    {option.decisionScore && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-muted-foreground text-sm">Decision Score:</span>
                        <div className="flex items-center gap-1">
                          <div className="w-16 bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-blue-400 h-2 rounded-full" 
                              style={{ width: `${option.decisionScore}%` }}
                            />
                          </div>
                          <span className="text-aero-blue-primary text-sm font-medium">
                            {option.decisionScore.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={getRiskColor(option.riskLevel)}>
                      {option.riskLevel.toUpperCase()}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      Confidence: {option.confidence}%
                    </div>
                  </div>
                </div>

                {/* Requirements */}
                {option.requirements.length > 0 && (
                  <div className="mb-2">
                    <div className="text-xs text-muted-foreground mb-1">Requirements:</div>
                    <div className="flex flex-wrap gap-1">
                      {option.requirements.map((req, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {req}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div className="text-xs text-muted-foreground">
                  Timeline: <span className="text-muted-foreground">{option.timeline}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Selected Option Details */}
        {selectedOptionData && (
          <Card className="border-blue-500 bg-aero-blue-primary/10 mt-4">
            <CardContent className="p-4">
              <h4 className="text-blue-300 font-medium mb-2">Selected Option Details</h4>
              <div className="text-muted-foreground text-sm">
                <div className="mb-2">
                  <strong>Impact Summary:</strong> {selectedOptionData.description}
                </div>
                <div className="mb-2">
                  <strong>Execution Timeline:</strong> {selectedOptionData.timeline}
                </div>
                <div>
                  <strong>Risk Assessment:</strong> {selectedOptionData.riskLevel} risk level with {selectedOptionData.confidence}% confidence
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Decision Actions */}
        {selectedOption && (
          <div className="grid grid-cols-3 gap-3 mt-6">
            <Button
              onClick={() => handleDecision('crew')}
              disabled={isProcessing}
              className="bg-aero-blue-primary hover:bg-aero-blue-light flex items-center gap-2"
            >
              {isProcessing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Crew Decision
            </Button>
            <Button
              onClick={() => handleDecision('operations')}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
            >
              {isProcessing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Operations Decision
            </Button>
            <Button
              onClick={() => handleDecision('ai')}
              disabled={isProcessing}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              AI Decision
            </Button>
          </div>
        )}

        {/* Cancel Action */}
        <div className="flex justify-end mt-4">
          <Button
            onClick={onClose}
            variant="ghost"
            disabled={isProcessing}
            className="flex items-center gap-2"
          >
            <XCircle className="h-4 w-4" />
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DecisionModal;