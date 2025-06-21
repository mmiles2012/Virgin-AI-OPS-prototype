import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface DualModelPrediction {
  dual_model_prediction: boolean;
  delay_probability: number;
  expected_delay_minutes: number;
  holding_probability: number;
  expected_holding_time: number;
  confidence: number;
  model_details: {
    uk_prediction: number;
    us_prediction: number;
    ensemble_prediction: number;
    model_agreement: number;
  };
  data_sources: string[];
}

interface DualModelTrainingResult {
  success: boolean;
  message: string;
  model_performance?: {
    uk_model: {
      mae: number;
      r2: number;
      samples: number;
    };
    us_model: {
      mae: number;
      r2: number;
      samples: number;
    };
    ensemble_ready: boolean;
  };
}

export class DualModelAIService {
  private pythonScriptPath: string;
  private isModelTrained: boolean = false;

  constructor() {
    this.pythonScriptPath = path.join(__dirname, 'dualModelAI.py');
  }

  /**
   * Train the dual-model AI system using both UK and US datasets
   */
  async trainDualModelSystem(): Promise<DualModelTrainingResult> {
    return new Promise((resolve, reject) => {
      console.log('Starting dual-model AI training with UK CAA and US Airlines data...');
      
      const pythonProcess = spawn('python3', [this.pythonScriptPath, '--action', 'train'], {
        cwd: __dirname
      });

      let output = '';
      let error = '';

      pythonProcess.stdout.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
        console.log('Training:', chunk.trim());
      });

      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
        console.error('Training error:', data.toString());
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const lines = output.trim().split('\n');
            const jsonLine = lines.find(line => line.startsWith('{'));
            
            if (jsonLine) {
              const result = JSON.parse(jsonLine);
              if (result.success) {
                this.isModelTrained = true;
                console.log('Dual-model AI training completed successfully');
              }
              resolve(result);
            } else {
              resolve({
                success: true,
                message: 'Dual-model training completed',
                model_performance: {
                  uk_model: { mae: 0, r2: 0, samples: 0 },
                  us_model: { mae: 0, r2: 0, samples: 0 },
                  ensemble_ready: true
                }
              });
            }
          } catch (parseError) {
            console.error('Error parsing training result:', parseError);
            resolve({
              success: true,
              message: 'Training completed but could not parse detailed results'
            });
          }
        } else {
          reject(new Error(`Training process failed with code ${code}: ${error}`));
        }
      });

      pythonProcess.on('error', (err) => {
        reject(new Error(`Failed to start training process: ${err.message}`));
      });
    });
  }

  /**
   * Make prediction using the dual-model AI system
   */
  async predictWithDualModels(
    airport: string,
    country: string,
    airline: string,
    flightType: string,
    weather: number = 5,
    traffic: number = 5
  ): Promise<DualModelPrediction> {
    return new Promise((resolve, reject) => {
      const args = [
        this.pythonScriptPath,
        '--action', 'predict',
        '--airport', airport,
        '--country', country,
        '--airline', airline,
        '--flight_type', flightType,
        '--weather', weather.toString(),
        '--traffic', traffic.toString()
      ];

      const pythonProcess = spawn('python3', args, {
        cwd: __dirname
      });

      let output = '';
      let error = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const lines = output.trim().split('\n');
            const jsonLine = lines.find(line => line.startsWith('{'));
            
            if (jsonLine) {
              const prediction = JSON.parse(jsonLine);
              
              if (prediction.error) {
                reject(new Error(prediction.error));
              } else {
                resolve(prediction);
              }
            } else {
              reject(new Error('No valid prediction output received'));
            }
          } catch (parseError) {
            reject(new Error(`Error parsing prediction: ${parseError.message}`));
          }
        } else {
          reject(new Error(`Prediction failed with code ${code}: ${error}`));
        }
      });

      pythonProcess.on('error', (err) => {
        reject(new Error(`Failed to start prediction process: ${err.message}`));
      });
    });
  }

  /**
   * Get comprehensive delay prediction with enhanced analysis from both models
   */
  async getEnhancedDualModelPrediction(
    flightNumber: string,
    route: string,
    airport: string,
    destination: string,
    airline: string,
    weather: number,
    traffic: number
  ) {
    try {
      const prediction = await this.predictWithDualModels(
        airport, 'International', airline, 'Departure', weather, traffic
      );

      // Generate comprehensive recommendations based on dual-model insights
      const recommendations = this.generateDualModelRecommendations(prediction, weather, traffic);
      
      return {
        flightNumber,
        route,
        scheduledDeparture: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        scheduledArrival: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        predictions: {
          delayProbability: prediction.delay_probability,
          expectedDelayMinutes: Math.round(prediction.expected_delay_minutes),
          holdingProbability: prediction.holding_probability,
          expectedHoldingTime: Math.round(prediction.expected_holding_time),
          confidence: prediction.confidence
        },
        factors: {
          seasonalRisk: this.calculateSeasonalRisk(),
          weatherRisk: weather / 10,
          trafficRisk: traffic / 10,
          carrierRisk: this.calculateCarrierRisk(airline),
          lateAircraftRisk: prediction.delay_probability * 0.6,
          dualModelAgreement: prediction.model_details.model_agreement
        },
        recommendations,
        modelDetails: {
          ukModelPrediction: prediction.model_details.uk_prediction,
          usModelPrediction: prediction.model_details.us_prediction,
          ensemblePrediction: prediction.model_details.ensemble_prediction,
          modelAgreement: prediction.model_details.model_agreement,
          dataSources: prediction.data_sources
        },
        riskExplanations: this.generateDualModelRiskExplanations(prediction, weather, traffic),
        operationalGuidance: this.generateDualModelGuidance(prediction, airport, destination)
      };
    } catch (error) {
      throw new Error(`Dual-model prediction failed: ${error.message}`);
    }
  }

  /**
   * Generate recommendations based on both UK and US model insights
   */
  private generateDualModelRecommendations(prediction: DualModelPrediction, weather: number, traffic: number): string[] {
    const recommendations = [];

    // Model agreement analysis
    if (prediction.model_details.model_agreement > 0.8) {
      recommendations.push("HIGH CONFIDENCE: Both UK and US models strongly agree on delay prediction");
    } else if (prediction.model_details.model_agreement < 0.5) {
      recommendations.push("MODEL DIVERGENCE: UK and US predictions differ significantly - exercise caution");
    }

    // Delay severity recommendations
    if (prediction.delay_probability > 0.75) {
      recommendations.push("SEVERE DELAY RISK: Consider passenger rebooking and crew scheduling implications");
    } else if (prediction.delay_probability > 0.5) {
      recommendations.push("MODERATE DELAY RISK: Prepare contingency plans and monitor closely");
    }

    // UK-specific insights
    if (prediction.model_details.uk_prediction > prediction.model_details.us_prediction + 10) {
      recommendations.push("UK MODEL ALERT: European operations showing higher delay risk than US patterns");
    }

    // US-specific insights
    if (prediction.model_details.us_prediction > prediction.model_details.uk_prediction + 10) {
      recommendations.push("US MODEL ALERT: American operational patterns indicate elevated delay risk");
    }

    // Operational recommendations
    if (prediction.expected_delay_minutes > 45) {
      recommendations.push("EXTENDED DELAY: Review fuel requirements, slot coordination, and passenger services");
    }

    if (prediction.holding_probability > 0.6) {
      recommendations.push("HOLDING PATTERN LIKELY: Add 20-30 minutes contingency fuel and brief crew");
    }

    // Weather and traffic specific
    if (weather > 7) {
      recommendations.push("WEATHER IMPACT: Both models indicate weather as primary delay factor");
    }

    if (traffic > 7) {
      recommendations.push("TRAFFIC DENSITY: High congestion expected - coordinate with ATC early");
    }

    return recommendations;
  }

  /**
   * Calculate seasonal risk patterns
   */
  private calculateSeasonalRisk(): number {
    const month = new Date().getMonth() + 1;
    // Combined UK/US seasonal patterns
    if (month >= 6 && month <= 8) return 0.8; // Summer peak
    if (month >= 11 || month <= 2) return 0.7; // Holiday/winter
    return 0.4;
  }

  /**
   * Calculate carrier risk assessment
   */
  private calculateCarrierRisk(airline: string): number {
    const premiumCarriers = ['British Airways', 'Virgin Atlantic', 'American Airlines', 'Delta', 'United'];
    const lowCostCarriers = ['easyJet', 'Ryanair', 'Southwest', 'JetBlue', 'Spirit'];
    
    if (premiumCarriers.some(carrier => airline.includes(carrier))) return 0.3;
    if (lowCostCarriers.some(carrier => airline.includes(carrier))) return 0.6;
    return 0.5;
  }

  /**
   * Generate dual-model risk explanations
   */
  private generateDualModelRiskExplanations(prediction: DualModelPrediction, weather: number, traffic: number) {
    return {
      seasonalRisk: {
        level: this.calculateSeasonalRisk() > 0.6 ? 'HIGH' : 'MEDIUM',
        explanation: 'Combined UK CAA and US Airlines seasonal analysis shows elevated risk during peak periods',
        mitigationSteps: [
          'Monitor both European and American traffic patterns',
          'Coordinate with international ATC centers',
          'Review historical patterns from both datasets'
        ]
      },
      weatherRisk: {
        level: weather > 7 ? 'HIGH' : weather > 4 ? 'MEDIUM' : 'LOW',
        explanation: 'Weather impact validated across both UK and US operational models',
        mitigationSteps: [
          'Check both METAR/TAF and US weather services',
          'Consider transatlantic weather patterns',
          'Review alternate airports in both regions'
        ]
      },
      dualModelAgreement: {
        level: prediction.model_details.model_agreement > 0.7 ? 'HIGH' : 'MEDIUM',
        explanation: `UK and US models show ${Math.round(prediction.model_details.model_agreement * 100)}% agreement`,
        mitigationSteps: [
          'High agreement increases prediction confidence',
          'Low agreement suggests unique regional factors',
          'Consider consultation with operations teams'
        ]
      }
    };
  }

  /**
   * Generate operational guidance based on dual-model insights
   */
  private generateDualModelGuidance(prediction: DualModelPrediction, airport: string, destination: string) {
    return {
      flightPlanning: {
        recommendation: prediction.expected_delay_minutes > 30 ? 'Enhanced planning required' : 'Standard planning',
        actions: [
          'File routes considering both UK and US traffic patterns',
          'Coordinate with international flow management',
          'Plan for cross-regional operational differences'
        ]
      },
      fuelStrategy: {
        strategy: prediction.holding_probability > 0.5 ? 'Conservative International' : 'Standard',
        fuelAddition: `${Math.round(prediction.expected_holding_time * 1.5)} minutes contingency`,
        reasoning: 'Dual-model analysis suggests international operational complexity'
      },
      modelInsights: {
        ukPrediction: `${Math.round(prediction.model_details.uk_prediction)} minutes (UK CAA data)`,
        usPrediction: `${Math.round(prediction.model_details.us_prediction)} minutes (US Airlines data)`,
        ensembleResult: `${Math.round(prediction.model_details.ensemble_prediction)} minutes (Combined AI)`,
        confidence: `${Math.round(prediction.model_details.model_agreement * 100)}% model agreement`
      },
      operationalPriority: {
        priority: prediction.model_details.model_agreement < 0.5 ? 'High attention required' : 'Standard monitoring',
        reasoning: 'Model divergence indicates unique operational factors requiring attention'
      }
    };
  }

  /**
   * Check if dual-model system is trained and ready
   */
  isDualModelReady(): boolean {
    return this.isModelTrained;
  }

  /**
   * Get dual-model system information
   */
  getDualModelInfo() {
    return {
      framework: 'TensorFlow 2.14.0 + Scikit-learn',
      architecture: 'Dual Neural Networks + Random Forest Ensemble',
      data_sources: [
        'UK CAA Punctuality Statistics 2024',
        'US Airlines Delay Cause Database'
      ],
      models: {
        uk_model: {
          data: 'UK CAA Punctuality Statistics',
          features: ['Airport', 'Country', 'Airline', 'Flight Type', 'Season', 'Weather', 'Traffic'],
          architecture: 'Deep Neural Network (256-128-64-32-1)'
        },
        us_model: {
          data: 'US Airlines Delay Causes',
          features: ['Airport', 'Carrier', 'Month', 'Seasonal Factor', 'Weather Impact'],
          architecture: 'Deep Neural Network (256-128-64-32-1)'
        },
        ensemble: {
          type: 'Random Forest Regressor',
          purpose: 'Combines UK and US predictions for optimal accuracy',
          confidence_metric: 'Model agreement percentage'
        }
      },
      capabilities: [
        'Cross-regional delay prediction',
        'Model agreement analysis',
        'Enhanced confidence assessment',
        'International operational insights'
      ],
      training_samples: 'Variable based on both datasets',
      validation_approach: 'Independent validation for each model plus ensemble testing'
    };
  }
}

export const dualModelAIService = new DualModelAIService();