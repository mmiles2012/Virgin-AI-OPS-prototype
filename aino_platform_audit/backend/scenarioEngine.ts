import { scenarios, TrainingScenario, DecisionPoint, DecisionOption } from "../client/src/lib/medicalProtocols";

export interface ScenarioState {
  active: boolean;
  currentScenario: TrainingScenario | null;
  startTime: Date | null;
  elapsedTime: number; // seconds
  progress: number; // 0-100
  
  currentDecisionPoint: DecisionPoint | null;
  decisionHistory: DecenarioDecision[];
  
  score: number;
  maxScore: number;
  
  metrics: {
    decisionsCorrect: number;
    decisionsTotal: number;
    averageResponseTime: number;
    criticalDecisionsMissed: number;
  };
  
  learningObjectives: {
    objective: string;
    completed: boolean;
    score: number;
  }[];
}

export interface ScenarioDecision {
  decisionId: string;
  optionId: string;
  timestamp: Date;
  responseTime: number; // seconds
  scoreImpact: number;
  source: 'crew' | 'operations' | 'system';
}

export interface ScenarioEvent {
  id: string;
  time: number; // seconds into scenario
  type: 'decision' | 'update' | 'emergency' | 'completion';
  description: string;
  data?: any;
}

export class ScenarioEngine {
  private state: ScenarioState;
  private events: ScenarioEvent[];
  private timers: Map<string, NodeJS.Timeout>;
  private lastUpdate: number;

  constructor() {
    this.state = this.getInitialState();
    this.events = [];
    this.timers = new Map();
    this.lastUpdate = Date.now();
  }

  private getInitialState(): ScenarioState {
    return {
      active: false,
      currentScenario: null,
      startTime: null,
      elapsedTime: 0,
      progress: 0,
      
      currentDecisionPoint: null,
      decisionHistory: [],
      
      score: 0,
      maxScore: 0,
      
      metrics: {
        decisionsCorrect: 0,
        decisionsTotal: 0,
        averageResponseTime: 0,
        criticalDecisionsMissed: 0
      },
      
      learningObjectives: []
    };
  }

  public startScenario(scenarioId: string): void {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario) {
      throw new Error(`Scenario not found: ${scenarioId}`);
    }

    // Clear any existing scenario
    this.stopScenario();

    // Initialize new scenario state
    this.state = {
      ...this.getInitialState(),
      active: true,
      currentScenario: scenario,
      startTime: new Date(),
      maxScore: this.calculateMaxScore(scenario),
      learningObjectives: scenario.learningObjectives.map(obj => ({
        objective: obj,
        completed: false,
        score: 0
      }))
    };

    // Schedule scenario events
    this.scheduleScenarioEvents(scenario);

    // Start the first decision point if available
    this.checkForDecisionPoints();

    console.log(`Scenario started: ${scenario.title}`);
    this.logEvent('start', `Scenario "${scenario.title}" initiated`);
  }

  public stopScenario(): void {
    if (!this.state.active) return;

    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();

    // Calculate final metrics
    this.calculateFinalMetrics();

    this.state.active = false;
    console.log("Scenario stopped");
    this.logEvent('stop', 'Scenario terminated');
  }

  public resetScenario(): void {
    this.stopScenario();
    this.state = this.getInitialState();
    this.events = [];
    console.log("Scenario reset");
  }

  public update(): void {
    if (!this.state.active || !this.state.startTime) return;

    const now = Date.now();
    const deltaTime = (now - this.lastUpdate) / 1000;
    this.lastUpdate = now;

    // Update elapsed time
    this.state.elapsedTime = (now - this.state.startTime.getTime()) / 1000;

    // Update progress
    if (this.state.currentScenario) {
      const estimatedDuration = this.parseEstimatedDuration(this.state.currentScenario.estimatedDuration);
      this.state.progress = Math.min(100, (this.state.elapsedTime / estimatedDuration) * 100);
    }

    // Check for timed events
    this.checkTimedEvents();

    // Check for decision timeouts
    this.checkDecisionTimeouts();

    // Update learning objectives progress
    this.updateLearningObjectives();
  }

  public makeDecision(decisionId: string, optionId: string, source: 'crew' | 'operations' | 'system' = 'system'): ScenarioDecision {
    if (!this.state.active || !this.state.currentDecisionPoint) {
      throw new Error("No active decision point");
    }

    const decisionPoint = this.state.currentDecisionPoint;
    if (decisionPoint.id !== decisionId) {
      throw new Error("Invalid decision point");
    }

    const option = decisionPoint.options.find(opt => opt.id === optionId);
    if (!option) {
      throw new Error("Invalid decision option");
    }

    // Calculate response time
    const responseTime = this.state.elapsedTime - decisionPoint.time;

    // Create decision record
    const decision: ScenarioDecision = {
      decisionId,
      optionId,
      timestamp: new Date(),
      responseTime,
      scoreImpact: option.scoreImpact,
      source
    };

    // Update state
    this.state.decisionHistory.push(decision);
    this.state.score += option.scoreImpact;
    this.state.currentDecisionPoint = null;

    // Update metrics
    this.updateDecisionMetrics(decision, decisionPoint, option);

    // Process consequences
    this.processDecisionConsequences(option);

    // Check for next decision point
    setTimeout(() => this.checkForDecisionPoints(), 1000);

    console.log(`Decision made: ${option.text} (Score impact: ${option.scoreImpact})`);
    this.logEvent('decision', `Decision: ${option.text}`, { decision, option });

    return decision;
  }

  private scheduleScenarioEvents(scenario: TrainingScenario): void {
    // Schedule decision points
    scenario.decisionPoints.forEach(decision => {
      const timer = setTimeout(() => {
        this.activateDecisionPoint(decision);
      }, decision.time * 1000);
      
      this.timers.set(`decision-${decision.id}`, timer);
    });

    // Schedule completion
    const estimatedDuration = this.parseEstimatedDuration(scenario.estimatedDuration);
    const completionTimer = setTimeout(() => {
      this.completeScenario();
    }, estimatedDuration * 1000);
    
    this.timers.set('completion', completionTimer);
  }

  private activateDecisionPoint(decisionPoint: DecisionPoint): void {
    if (!this.state.active) return;

    this.state.currentDecisionPoint = decisionPoint;
    
    // Set timeout for decision
    if (decisionPoint.timeLimit > 0) {
      const timeoutTimer = setTimeout(() => {
        this.handleDecisionTimeout(decisionPoint);
      }, decisionPoint.timeLimit * 1000);
      
      this.timers.set(`timeout-${decisionPoint.id}`, timeoutTimer);
    }

    console.log(`Decision point activated: ${decisionPoint.description}`);
    this.logEvent('decision', `Decision required: ${decisionPoint.description}`, { decisionPoint });
  }

  private handleDecisionTimeout(decisionPoint: DecisionPoint): void {
    if (this.state.currentDecisionPoint?.id !== decisionPoint.id) return;

    // Auto-select a default option or penalize for no decision
    const scoreImpact = decisionPoint.criticalFactor ? -20 : -10;
    
    const timeoutDecision: ScenarioDecision = {
      decisionId: decisionPoint.id,
      optionId: 'timeout',
      timestamp: new Date(),
      responseTime: decisionPoint.timeLimit,
      scoreImpact,
      source: 'system'
    };

    this.state.decisionHistory.push(timeoutDecision);
    this.state.score += scoreImpact;
    this.state.currentDecisionPoint = null;
    
    if (decisionPoint.criticalFactor) {
      this.state.metrics.criticalDecisionsMissed++;
    }

    console.log(`Decision timeout: ${decisionPoint.description} (Penalty: ${scoreImpact})`);
    this.logEvent('timeout', `Decision timeout: ${decisionPoint.description}`, { decisionPoint, penalty: scoreImpact });
  }

  private updateDecisionMetrics(decision: ScenarioDecision, decisionPoint: DecisionPoint, option: DecisionOption): void {
    this.state.metrics.decisionsTotal++;
    
    // Consider a decision "correct" if it has positive score impact
    if (option.scoreImpact > 0) {
      this.state.metrics.decisionsCorrect++;
    }

    // Update average response time
    const totalDecisions = this.state.metrics.decisionsTotal;
    const currentAverage = this.state.metrics.averageResponseTime;
    this.state.metrics.averageResponseTime = 
      (currentAverage * (totalDecisions - 1) + decision.responseTime) / totalDecisions;
  }

  private processDecisionConsequences(option: DecisionOption): void {
    // Process follow-up actions
    option.followUpActions.forEach(action => {
      console.log(`Follow-up action: ${action}`);
      this.logEvent('update', `Action: ${action}`);
    });

    // Process consequences
    option.consequences.forEach(consequence => {
      console.log(`Consequence: ${consequence}`);
      this.logEvent('update', `Consequence: ${consequence}`);
    });
  }

  private checkForDecisionPoints(): void {
    if (!this.state.active || !this.state.currentScenario) return;

    // Check if we should activate any pending decision points
    const pendingDecisions = this.state.currentScenario.decisionPoints.filter(
      dp => dp.time <= this.state.elapsedTime && 
           !this.state.decisionHistory.some(dh => dh.decisionId === dp.id) &&
           this.state.currentDecisionPoint?.id !== dp.id
    );

    if (pendingDecisions.length > 0) {
      // Activate the earliest pending decision
      pendingDecisions.sort((a, b) => a.time - b.time);
      this.activateDecisionPoint(pendingDecisions[0]);
    }
  }

  private checkTimedEvents(): void {
    // Check for any time-based events that should fire
    // This can be extended for custom scenario events
  }

  private checkDecisionTimeouts(): void {
    if (!this.state.currentDecisionPoint) return;

    const timeInDecision = this.state.elapsedTime - this.state.currentDecisionPoint.time;
    if (timeInDecision >= this.state.currentDecisionPoint.timeLimit) {
      this.handleDecisionTimeout(this.state.currentDecisionPoint);
    }
  }

  private updateLearningObjectives(): void {
    if (!this.state.currentScenario) return;

    // Update learning objective completion based on decisions made
    this.state.learningObjectives.forEach(objective => {
      if (!objective.completed) {
        // Simple heuristic: mark as completed if certain conditions are met
        const relevantDecisions = this.state.decisionHistory.filter(d => d.scoreImpact > 0);
        const progressRatio = relevantDecisions.length / Math.max(1, this.state.currentScenario!.decisionPoints.length);
        
        if (progressRatio >= 0.5) {
          objective.completed = true;
          objective.score = Math.min(100, this.state.score / this.state.maxScore * 100);
        }
      }
    });
  }

  private calculateMaxScore(scenario: TrainingScenario): number {
    return scenario.decisionPoints.reduce((total, dp) => {
      const maxOptionScore = Math.max(...dp.options.map(opt => opt.scoreImpact));
      return total + Math.max(0, maxOptionScore);
    }, 0);
  }

  private calculateFinalMetrics(): void {
    if (!this.state.currentScenario) return;

    // Calculate final performance metrics
    const totalPossibleDecisions = this.state.currentScenario.decisionPoints.length;
    const completionPercentage = (this.state.metrics.decisionsTotal / totalPossibleDecisions) * 100;
    const accuracyPercentage = (this.state.metrics.decisionsCorrect / Math.max(1, this.state.metrics.decisionsTotal)) * 100;

    console.log(`Scenario completed: ${completionPercentage.toFixed(1)}% decisions made, ${accuracyPercentage.toFixed(1)}% accuracy`);
    
    this.logEvent('completion', 'Scenario analysis completed', {
      finalScore: this.state.score,
      maxScore: this.state.maxScore,
      completionPercentage,
      accuracyPercentage,
      averageResponseTime: this.state.metrics.averageResponseTime,
      criticalMissed: this.state.metrics.criticalDecisionsMissed
    });
  }

  private completeScenario(): void {
    if (!this.state.active) return;

    this.calculateFinalMetrics();
    this.state.progress = 100;
    
    // Mark all learning objectives as completed if scenario finished
    this.state.learningObjectives.forEach(obj => {
      if (!obj.completed) {
        obj.completed = true;
        obj.score = Math.max(50, obj.score); // Minimum score for completion
      }
    });

    console.log("Scenario completed successfully");
    this.logEvent('completion', 'Scenario completed');
  }

  private parseEstimatedDuration(duration: string): number {
    // Parse duration strings like "45 minutes", "1 hour", etc.
    const match = duration.match(/(\d+)\s*(minute|hour|min|hr)s?/i);
    if (!match) return 1800; // Default 30 minutes
    
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    if (unit.startsWith('hour') || unit.startsWith('hr')) {
      return value * 3600;
    } else {
      return value * 60;
    }
  }

  private logEvent(type: 'start' | 'stop' | 'decision' | 'timeout' | 'update' | 'completion', description: string, data?: any): void {
    const event: ScenarioEvent = {
      id: `${type}-${Date.now()}`,
      time: this.state.elapsedTime,
      type,
      description,
      data
    };
    
    this.events.push(event);
    
    // Keep only last 100 events to prevent memory issues
    if (this.events.length > 100) {
      this.events = this.events.slice(-100);
    }
  }

  // Public interface methods
  public getScenarioState(): ScenarioState {
    return { ...this.state };
  }

  public getCurrentScenario(): TrainingScenario | null {
    return this.state.currentScenario;
  }

  public isActive(): boolean {
    return this.state.active;
  }

  public getEvents(): ScenarioEvent[] {
    return [...this.events];
  }

  public getDecisionHistory(): ScenarioDecision[] {
    return [...this.state.decisionHistory];
  }

  public getCurrentDecisionPoint(): DecisionPoint | null {
    return this.state.currentDecisionPoint;
  }

  public getMetrics(): typeof this.state.metrics {
    return { ...this.state.metrics };
  }

  public getPerformanceReport(): {
    overall: number;
    breakdown: {
      decisionAccuracy: number;
      responseTime: number;
      criticalDecisions: number;
      learningObjectives: number;
    };
    recommendations: string[];
  } {
    const accuracy = this.state.metrics.decisionsTotal > 0 ? 
      (this.state.metrics.decisionsCorrect / this.state.metrics.decisionsTotal) * 100 : 0;
    
    const responseTimeScore = Math.max(0, 100 - (this.state.metrics.averageResponseTime / 10));
    const criticalScore = this.state.metrics.criticalDecisionsMissed === 0 ? 100 : 
      Math.max(0, 100 - (this.state.metrics.criticalDecisionsMissed * 25));
    
    const objectivesCompleted = this.state.learningObjectives.filter(obj => obj.completed).length;
    const objectivesScore = (objectivesCompleted / Math.max(1, this.state.learningObjectives.length)) * 100;
    
    const overall = (accuracy + responseTimeScore + criticalScore + objectivesScore) / 4;
    
    const recommendations: string[] = [];
    if (accuracy < 70) recommendations.push("Focus on decision-making accuracy");
    if (responseTimeScore < 70) recommendations.push("Work on response time under pressure");
    if (criticalScore < 100) recommendations.push("Review critical decision protocols");
    if (objectivesScore < 80) recommendations.push("Practice scenario learning objectives");
    
    return {
      overall,
      breakdown: {
        decisionAccuracy: accuracy,
        responseTime: responseTimeScore,
        criticalDecisions: criticalScore,
        learningObjectives: objectivesScore
      },
      recommendations
    };
  }
}

