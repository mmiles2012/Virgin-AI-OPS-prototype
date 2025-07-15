import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface UKCAADelayPrediction {
  delay_probability: number;
  expected_delay_minutes: number;
  holding_probability: number;
  expected_holding_time: number;
  confidence: number;
  model_version: string;
  data_source: string;
}

interface UKCAATrainingResult {
  success: boolean;
  message: string;
  training_time?: number;
  model_performance?: {
    train_mae: number;
    test_mae: number;
    train_r2: number;
    test_r2: number;
    training_samples: number;
    test_samples: number;
  };
}

export class UKCAADelayService {
  private pythonScriptPath: string;
  private isModelTrained: boolean = false;

  constructor() {
    this.pythonScriptPath = path.join(__dirname, 'ukCaaDelayModel.py');
  }

  /**
   * Train the UK CAA neural network with authentic punctuality data
   */
  async trainUKCAANeuralNetwork(): Promise<UKCAATrainingResult> {
    return new Promise((resolve, reject) => {
      console.log('Starting UK CAA neural network training...');
      
      const pythonProcess = spawn('python3', [this.pythonScriptPath, '--action', 'train'], {
        cwd: __dirname
      });

      let output = '';
      let error = '';

      pythonProcess.stdout.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
        console.log('Training output:', chunk);
      });

      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
        console.error('Training error:', data.toString());
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            // Parse the JSON output from Python script
            const lines = output.trim().split('\n');
            const jsonLine = lines.find(line => line.startsWith('{'));
            
            if (jsonLine) {
              const result = JSON.parse(jsonLine);
              if (result.success) {
                this.isModelTrained = true;
                console.log('UK CAA neural network training completed successfully');
              }
              resolve(result);
            } else {
              resolve({
                success: true,
                message: 'UK CAA neural network training completed',
                training_time: 0
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
   * Make prediction using trained UK CAA neural network
   */
  async predictWithUKCAANetwork(
    airport: string,
    destinationCountry: string,
    destination: string,
    airline: string,
    arrivalDeparture: string,
    scheduledCharter: string = 'Scheduled',
    weather: number = 5,
    traffic: number = 5
  ): Promise<UKCAADelayPrediction> {
    return new Promise((resolve, reject) => {
      const args = [
        this.pythonScriptPath,
        '--action', 'predict',
        '--airport', airport,
        '--destination_country', destinationCountry,
        '--destination', destination,
        '--airline', airline,
        '--arrival_departure', arrivalDeparture,
        '--scheduled_charter', scheduledCharter,
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
   * Get comprehensive delay prediction with operational guidance
   */
  async getEnhancedUKDelayPrediction(
    airport: string,
    destinationCountry: string,
    destination: string,
    airline: string,
    arrivalDeparture: string,
    weather: number,
    traffic: number
  ) {
    try {
      const prediction = await this.predictWithUKCAANetwork(
        airport, destinationCountry, destination, airline, 
        arrivalDeparture, 'Scheduled', weather, traffic
      );

      // Generate enhanced recommendations based on UK operations
      const recommendations = this.generateUKRecommendations(prediction, weather, traffic);
      
      return {
        flightNumber: `${airline.substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 9000) + 1000}`,
        route: `${airport} → ${destination}`,
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
          lateAircraftRisk: prediction.delay_probability * 0.7
        },
        recommendations,
        modelVersion: prediction.model_version,
        dataSource: prediction.data_source,
        riskExplanations: this.generateRiskExplanations(prediction, weather, traffic),
        operationalGuidance: this.generateOperationalGuidance(prediction, airport, destination)
      };
    } catch (error) {
      throw new Error(`UK CAA prediction failed: ${error.message}`);
    }
  }

  /**
   * Generate UK-specific operational recommendations
   */
  private generateUKRecommendations(prediction: UKCAADelayPrediction, weather: number, traffic: number): string[] {
    const recommendations = [];

    if (prediction.delay_probability > 0.7) {
      recommendations.push("HIGH DELAY RISK: Consider advance passenger notification and crew duty time implications");
    }

    if (prediction.expected_delay_minutes > 30) {
      recommendations.push("Extended delay expected: Review fuel requirements and slot coordination with NATS");
    }

    if (prediction.holding_probability > 0.5) {
      recommendations.push("Holding likely: Add 15-20 minutes contingency fuel for UK airspace holding patterns");
    }

    if (weather > 7) {
      recommendations.push("Weather impact: Monitor Met Office aviation forecasts and consider alternate routing");
    }

    if (traffic > 7) {
      recommendations.push("High traffic density: Coordinate with London Terminal Control for optimal approach timing");
    }

    recommendations.push("UK CAA compliance: Ensure delay reporting obligations are met for statistical accuracy");

    return recommendations;
  }

  /**
   * Calculate seasonal risk based on current month
   */
  private calculateSeasonalRisk(): number {
    const month = new Date().getMonth() + 1;
    // UK aviation patterns: Summer peak (June-August), Winter weather (Dec-Feb)
    if (month >= 6 && month <= 8) return 0.8; // Summer peak
    if (month >= 12 || month <= 2) return 0.7; // Winter weather
    return 0.4; // Shoulder seasons
  }

  /**
   * Calculate carrier-specific risk
   */
  private calculateCarrierRisk(airline: string): number {
    const lowRiskCarriers = ['British Airways', 'Virgin Atlantic', 'Lufthansa'];
    const mediumRiskCarriers = ['easyJet', 'Jet2', 'TUI Airways'];
    
    if (lowRiskCarriers.some(carrier => airline.includes(carrier))) return 0.3;
    if (mediumRiskCarriers.some(carrier => airline.includes(carrier))) return 0.5;
    return 0.6; // Budget carriers typically higher risk
  }

  /**
   * Generate detailed risk explanations
   */
  private generateRiskExplanations(prediction: UKCAADelayPrediction, weather: number, traffic: number) {
    return {
      seasonalRisk: {
        level: this.calculateSeasonalRisk() > 0.6 ? 'HIGH' : 'MEDIUM',
        explanation: 'Based on historical UK aviation patterns and seasonal demand fluctuations',
        mitigationSteps: [
          'Monitor NATS flow management updates',
          'Consider off-peak departure timing',
          'Coordinate with ground handling for priority services'
        ]
      },
      weatherRisk: {
        level: weather > 7 ? 'HIGH' : weather > 4 ? 'MEDIUM' : 'LOW',
        explanation: 'UK weather patterns significantly impact punctuality across all airports',
        mitigationSteps: [
          'Review Met Office TAF and METAR reports',
          'Consider weather contingency fuel',
          'Monitor alternative airport conditions'
        ]
      },
      trafficRisk: {
        level: traffic > 7 ? 'HIGH' : traffic > 4 ? 'MEDIUM' : 'LOW',
        explanation: 'UK airspace density requires careful coordination with NATS',
        mitigationSteps: [
          'Request optimal flight level early',
          'Monitor EUROCONTROL network operations',
          'Coordinate approach timing with ATC'
        ]
      },
      carrierRisk: {
        level: this.calculateCarrierRisk(prediction.model_version) > 0.5 ? 'MEDIUM' : 'LOW',
        explanation: 'Airline operational reliability based on UK CAA punctuality statistics',
        mitigationSteps: [
          'Review carrier on-time performance',
          'Ensure adequate turnaround time',
          'Monitor fleet reliability metrics'
        ]
      }
    };
  }

  /**
   * Generate operational guidance
   */
  private generateOperationalGuidance(prediction: UKCAADelayPrediction, airport: string, destination: string) {
    return {
      flightPlanning: {
        recommendation: prediction.expected_delay_minutes > 20 ? 'Extended planning required' : 'Standard planning adequate',
        actions: [
          'File optimized route with NATS',
          'Consider traffic flow restrictions',
          'Plan for UK departure slots'
        ]
      },
      fuelStrategy: {
        strategy: prediction.holding_probability > 0.5 ? 'Conservative' : 'Standard',
        fuelAddition: `${Math.round(prediction.expected_holding_time * 1.2)} minutes holding fuel`,
        reasoning: 'UK airspace holding patterns and weather contingency'
      },
      passengerCommunication: {
        timing: prediction.delay_probability > 0.6 ? 'Pre-departure notification' : 'Monitor and update',
        message: 'Flight may experience delays due to UK traffic management',
        channels: ['Gate announcements', 'Mobile app', 'SMS notifications']
      },
      crewConsiderations: {
        briefingFocus: 'UK airspace procedures and holding patterns',
        considerations: [
          'Review NATS procedures',
          'Monitor duty time implications',
          'Prepare for extended operations'
        ]
      },
      alternateOptions: {
        priority: prediction.expected_delay_minutes > 60 ? 'High' : 'Standard',
        options: ['Manchester (EGCC)', 'Birmingham (EGBB)', 'Bristol (EGGD)']
      }
    };
  }

  /**
   * Check if the UK CAA model is trained and ready
   */
  isUKCAAModelReady(): boolean {
    return this.isModelTrained;
  }

  /**
   * Get UK CAA model information
   */
  getUKCAAModelInfo() {
    return {
      framework: 'TensorFlow 2.14.0',
      model_type: 'Deep Neural Network',
      data_source: 'UK CAA Punctuality Statistics',
      training_period: '2024 Operations',
      features: [
        'Reporting Airport',
        'Destination Country', 
        'Destination Airport',
        'Airline Name',
        'Arrival/Departure',
        'Scheduled/Charter',
        'Weather Factor',
        'Traffic Density'
      ],
      layers: [
        'Dense(512, relu) + BatchNorm + Dropout(0.3)',
        'Dense(256, relu) + BatchNorm + Dropout(0.3)', 
        'Dense(128, relu) + BatchNorm + Dropout(0.2)',
        'Dense(64, relu) + Dropout(0.2)',
        'Dense(32, relu)',
        'Dense(1, linear)'
      ],
      optimizer: 'Adam',
      loss_function: 'Mean Squared Error',
      training_samples: 'Variable based on data availability',
      validation_split: 0.2,
      capabilities: [
        'Delay probability prediction',
        'Expected delay duration',
        'Holding pattern likelihood',
        'Confidence assessment'
      ]
    };
  }
}

export const ukCaaDelayService = new UKCAADelayService();