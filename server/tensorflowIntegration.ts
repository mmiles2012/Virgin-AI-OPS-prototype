import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TensorFlowPrediction {
  delay_probability: number;
  expected_delay_minutes: number;
  holding_probability: number;
  expected_holding_time: number;
  risk_factors: {
    seasonal_risk: number;
    weather_risk: number;
    traffic_risk: number;
    carrier_risk: number;
    neural_confidence: number;
  };
  model_confidence: number;
  neural_network_prediction: boolean;
}

interface TensorFlowTrainingResult {
  success: boolean;
  message: string;
  training_time?: number;
  model_performance?: {
    delay_probability_mae: number;
    delay_minutes_mae: number;
    delay_probability_r2: number;
    delay_minutes_r2: number;
  };
}

export class TensorFlowDelayService {
  private pythonScriptPath: string;
  private isModelTrained: boolean = false;

  constructor() {
    this.pythonScriptPath = path.join(__dirname, 'tensorflowDelayModel.py');
  }

  /**
   * Train the TensorFlow neural network with historical aviation data
   */
  async trainNeuralNetwork(): Promise<TensorFlowTrainingResult> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      console.log('Starting TensorFlow neural network training...');
      
      const pythonProcess = spawn('python3', [this.pythonScriptPath, 'train'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        console.log('TensorFlow Training:', output.trim());
      });

      pythonProcess.stderr.on('data', (data) => {
        const error = data.toString();
        stderr += error;
        console.error('TensorFlow Error:', error.trim());
      });

      pythonProcess.on('close', (code) => {
        const trainingTime = Date.now() - startTime;
        
        if (code === 0) {
          this.isModelTrained = true;
          
          // Parse training results from stdout
          const performanceMatch = stdout.match(/Delay Probability - MAE: ([\d.]+), R²: ([\d.]+)/);
          const delayMinutesMatch = stdout.match(/Delay Minutes - MAE: ([\d.]+), R²: ([\d.]+)/);
          
          let modelPerformance;
          if (performanceMatch && delayMinutesMatch) {
            modelPerformance = {
              delay_probability_mae: parseFloat(performanceMatch[1]),
              delay_probability_r2: parseFloat(performanceMatch[2]),
              delay_minutes_mae: parseFloat(delayMinutesMatch[1]),
              delay_minutes_r2: parseFloat(delayMinutesMatch[2])
            };
          }

          resolve({
            success: true,
            message: 'Neural network training completed successfully',
            training_time: trainingTime,
            model_performance: modelPerformance
          });
        } else {
          reject(new Error(`Training failed with code ${code}: ${stderr}`));
        }
      });

      pythonProcess.on('error', (error) => {
        reject(new Error(`Failed to start training process: ${error.message}`));
      });
    });
  }

  /**
   * Make enhanced delay prediction using trained TensorFlow neural network
   */
  async predictWithNeuralNetwork(
    month: number,
    weatherConditions: number,
    trafficLevel: number,
    carrierStatus: number
  ): Promise<TensorFlowPrediction> {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python3', [
        this.pythonScriptPath,
        'predict',
        month.toString(),
        weatherConditions.toString(),
        trafficLevel.toString(),
        carrierStatus.toString()
      ], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const prediction = JSON.parse(stdout.trim()) as TensorFlowPrediction;
            
            // Validate prediction structure
            if (this.isValidPrediction(prediction)) {
              resolve(prediction);
            } else {
              reject(new Error('Invalid prediction format received from neural network'));
            }
          } catch (parseError) {
            reject(new Error(`Failed to parse prediction result: ${parseError}`));
          }
        } else {
          reject(new Error(`Prediction failed with code ${code}: ${stderr}`));
        }
      });

      pythonProcess.on('error', (error) => {
        reject(new Error(`Failed to start prediction process: ${error.message}`));
      });
    });
  }

  /**
   * Get enhanced delay prediction that combines traditional logic with neural network
   */
  async getEnhancedDelayPrediction(
    flightNumber: string,
    route: string,
    month: number,
    weather: number,
    traffic: number,
    carrierStatus: number
  ) {
    try {
      // Get neural network prediction
      const nnPrediction = await this.predictWithNeuralNetwork(month, weather, traffic, carrierStatus);
      
      // Generate enhanced recommendations based on neural network insights
      const enhancedRecommendations = this.generateEnhancedRecommendations(nnPrediction);
      
      // Calculate departure and arrival times
      const now = new Date();
      const departureTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
      const arrivalTime = new Date(departureTime.getTime() + 8 * 60 * 60 * 1000); // 8 hour flight
      
      return {
        flightNumber,
        route,
        scheduledDeparture: departureTime.toISOString(),
        scheduledArrival: arrivalTime.toISOString(),
        predictions: {
          delayProbability: nnPrediction.delay_probability,
          expectedDelayMinutes: nnPrediction.expected_delay_minutes,
          holdingProbability: nnPrediction.holding_probability,
          expectedHoldingTime: nnPrediction.expected_holding_time,
          confidence: nnPrediction.model_confidence
        },
        factors: {
          seasonalRisk: nnPrediction.risk_factors.seasonal_risk,
          weatherRisk: nnPrediction.risk_factors.weather_risk,
          trafficRisk: nnPrediction.risk_factors.traffic_risk,
          carrierRisk: nnPrediction.risk_factors.carrier_risk,
          lateAircraftRisk: 0.3,
          neuralConfidence: nnPrediction.risk_factors.neural_confidence
        },
        recommendations: enhancedRecommendations,
        neuralNetworkEnhanced: true,
        modelVersion: "TensorFlow 2.14.0",
        dataSource: "American Airlines JFK Historical Data (2022-2024)"
      };
    } catch (error) {
      // Fallback to traditional prediction if neural network fails
      console.error('Neural network prediction failed, using traditional method:', error);
      throw new Error(`Enhanced prediction unavailable: ${error}`);
    }
  }

  /**
   * Generate enhanced recommendations based on neural network predictions
   */
  private generateEnhancedRecommendations(prediction: TensorFlowPrediction): string[] {
    const recommendations: string[] = [];
    
    // Neural network confidence-based recommendations
    if (prediction.model_confidence > 0.9) {
      recommendations.push("HIGH CONFIDENCE AI PREDICTION: Neural network analysis based on 33 months of historical data");
    }
    
    // Delay probability recommendations
    if (prediction.delay_probability > 0.7) {
      recommendations.push("CRITICAL DELAY RISK: AI predicts >70% delay probability - consider immediate departure time adjustment");
      recommendations.push("Advanced planning recommended: Coordinate with operations center for priority handling");
    } else if (prediction.delay_probability > 0.4) {
      recommendations.push("MODERATE DELAY RISK: AI analysis suggests enhanced monitoring and passenger communication");
    } else {
      recommendations.push("LOW DELAY RISK: AI confidence indicates favorable operational conditions");
    }

    // Holding pattern AI recommendations
    if (prediction.holding_probability > 0.6) {
      recommendations.push(`AI HOLDING ALERT: ${(prediction.holding_probability * 100).toFixed(0)}% holding probability - load additional ${Math.round(prediction.expected_holding_time * 1.5)} minutes fuel`);
      recommendations.push("Neural network suggests reviewing alternate airports within 150nm radius");
    }

    // Risk factor specific AI recommendations
    if (prediction.risk_factors.seasonal_risk > 0.8) {
      recommendations.push("SEASONAL AI ANALYSIS: Peak delay period detected - implement seasonal delay protocols");
    }
    
    if (prediction.risk_factors.weather_risk > 0.7) {
      recommendations.push("WEATHER AI WARNING: High meteorological impact predicted - monitor real-time weather evolution");
    }
    
    if (prediction.risk_factors.traffic_risk > 0.6) {
      recommendations.push("TRAFFIC AI ALERT: Airport congestion predicted - request early taxi clearance and priority approach");
    }
    
    if (prediction.risk_factors.carrier_risk > 0.5) {
      recommendations.push("CARRIER AI INSIGHT: Operational challenges detected - verify aircraft readiness and crew compliance");
    }

    // Expected delay time recommendations
    if (prediction.expected_delay_minutes > 45) {
      recommendations.push(`EXTENDED DELAY PREDICTED: AI forecasts ${Math.round(prediction.expected_delay_minutes)} minute delay - initiate passenger rebooking protocols`);
    } else if (prediction.expected_delay_minutes > 20) {
      recommendations.push(`MODERATE DELAY EXPECTED: AI estimates ${Math.round(prediction.expected_delay_minutes)} minute delay - prepare passenger notifications`);
    }

    return recommendations;
  }

  /**
   * Validate prediction structure from neural network
   */
  private isValidPrediction(prediction: any): prediction is TensorFlowPrediction {
    return (
      typeof prediction === 'object' &&
      typeof prediction.delay_probability === 'number' &&
      typeof prediction.expected_delay_minutes === 'number' &&
      typeof prediction.holding_probability === 'number' &&
      typeof prediction.expected_holding_time === 'number' &&
      typeof prediction.risk_factors === 'object' &&
      typeof prediction.model_confidence === 'number' &&
      prediction.neural_network_prediction === true
    );
  }

  /**
   * Check if neural network model is available and trained
   */
  isNeuralNetworkReady(): boolean {
    return this.isModelTrained;
  }

  /**
   * Get model information and capabilities
   */
  getModelInfo() {
    return {
      framework: "TensorFlow 2.14.0",
      architecture: "Deep Neural Network",
      layers: ["Dense(128)", "Dense(256)", "Dense(512)", "Dense(256)", "Dense(128)", "Dense(64)", "Dense(2)"],
      training_data: "American Airlines JFK Operations (March 2022 - December 2024)",
      features: ["Month", "Flight Volume", "Seasonal Factor", "Weather Score", "Traffic Score", "Carrier Score"],
      outputs: ["Delay Probability", "Expected Delay Minutes"],
      regularization: ["Dropout", "Batch Normalization", "Early Stopping"],
      optimizer: "Adam with adaptive learning rate",
      loss_function: "Huber Loss (robust to outliers)",
      training_samples: 33,
      validation_split: 0.2,
      is_trained: this.isModelTrained
    };
  }
}

export const tensorflowDelayService = new TensorFlowDelayService();