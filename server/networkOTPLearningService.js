// Network OTP Learning Service for AINO Platform
// Integrates Python learning system with Node.js backend

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class NetworkOTPLearningService {
  constructor() {
    this.pythonScript = 'network_otp_learner.py';
    this.isLearning = false;
    this.lastTraining = null;
    this.performanceCache = new Map();
  }

  /**
   * Log hub performance data for learning
   */
  async logHubPerformance(hubData) {
    try {
      // Convert hub data to format expected by Python learner
      const learningData = hubData.map(hub => ({
        icao: hub.icao || hub.hub,
        totalFlights: hub.totalFlights || 0,
        onTimeFlights: hub.onTimeFlights || 0,
        delayedFlights: hub.delayedFlights || 0,
        cancelledFlights: hub.cancelledFlights || 0,
        onTimeRate: hub.onTimeRate || 0,
        avgDelayMinutes: hub.avgDelayMinutes || 0,
        weatherImpact: hub.weatherImpact || 0
      }));

      // Save to temporary JSON file for Python processing
      const tempFile = path.join(__dirname, '../logs/temp_hub_data.json');
      await fs.writeFile(tempFile, JSON.stringify(learningData, null, 2));

      // Trigger learning data ingestion
      this.ingestHubData(tempFile);

      return { success: true, logged: hubData.length };
    } catch (error) {
      console.error('Error logging hub performance:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Ingest hub data into learning system
   */
  ingestHubData(dataFile) {
    const python = spawn('python3', [this.pythonScript, 'ingest', dataFile]);
    
    python.stdout.on('data', (data) => {
      console.log(`📊 Learning System: ${data.toString().trim()}`);
    });

    python.stderr.on('data', (data) => {
      console.error(`Learning Error: ${data.toString().trim()}`);
    });
  }

  /**
   * Train models on accumulated data
   */
  async trainModels() {
    if (this.isLearning) {
      return { success: false, error: 'Training already in progress' };
    }

    this.isLearning = true;

    return new Promise((resolve) => {
      const python = spawn('python3', [this.pythonScript, 'train']);
      let output = '';
      let error = '';

      python.stdout.on('data', (data) => {
        const message = data.toString().trim();
        output += message + '\n';
        console.log(`🧠 Network OTP Learning: ${message}`);
      });

      python.stderr.on('data', (data) => {
        error += data.toString();
      });

      python.on('close', (code) => {
        this.isLearning = false;
        this.lastTraining = new Date();

        if (code === 0) {
          resolve({
            success: true,
            output: output,
            trainedAt: this.lastTraining
          });
        } else {
          resolve({
            success: false,
            error: error || 'Training failed with unknown error',
            output: output
          });
        }
      });
    });
  }

  /**
   * Get performance prediction for hub
   */
  async predictHubPerformance(hub, hourOfDay, dayOfWeek, weatherImpact = 0) {
    const cacheKey = `${hub}-${hourOfDay}-${dayOfWeek}-${weatherImpact}`;
    
    // Check cache (valid for 10 minutes)
    if (this.performanceCache.has(cacheKey)) {
      const cached = this.performanceCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 10 * 60 * 1000) {
        return cached.data;
      }
    }

    return new Promise((resolve) => {
      const python = spawn('python3', [
        this.pythonScript, 'predict', hub, hourOfDay.toString(), 
        dayOfWeek.toString(), weatherImpact.toString()
      ]);
      
      let output = '';
      let error = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        error += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0 && output.trim()) {
          try {
            // Parse Python output for prediction data
            const lines = output.split('\n');
            const prediction = {
              hub: hub,
              predicted_delay: 15, // default
              performance_risk: 'MEDIUM',
              confidence: 0.5,
              is_peak_hour: false
            };

            // Parse prediction output
            lines.forEach(line => {
              if (line.includes('Expected Delay:')) {
                prediction.predicted_delay = parseFloat(line.match(/[\d.]+/)[0]);
              }
              if (line.includes('Performance Risk:')) {
                prediction.performance_risk = line.split(':')[1].trim();
              }
              if (line.includes('Confidence:')) {
                prediction.confidence = parseFloat(line.match(/[\d.]+/)[0]);
              }
              if (line.includes('Peak Hour:')) {
                prediction.is_peak_hour = line.includes('True');
              }
            });

            // Cache result
            this.performanceCache.set(cacheKey, {
              data: prediction,
              timestamp: Date.now()
            });

            resolve({ success: true, prediction });
          } catch (parseError) {
            resolve({
              success: false,
              error: 'Failed to parse prediction output',
              raw_output: output
            });
          }
        } else {
          resolve({
            success: false,
            error: error || 'Prediction failed',
            raw_output: output
          });
        }
      });
    });
  }

  /**
   * Get hub insights and recommendations
   */
  async getHubInsights(hub) {
    return new Promise((resolve) => {
      const python = spawn('python3', [this.pythonScript, 'insights', hub]);
      
      let output = '';
      let error = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        error += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          const insights = this.parseInsightsOutput(output);
          resolve({ success: true, insights });
        } else {
          resolve({
            success: false,
            error: error || 'Insights generation failed',
            raw_output: output
          });
        }
      });
    });
  }

  /**
   * Analyze seasonal patterns
   */
  async analyzeSeasonalPatterns() {
    return new Promise((resolve) => {
      const python = spawn('python3', [this.pythonScript, 'analyze']);
      
      let output = '';
      let error = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        error += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          const patterns = this.parseSeasonalOutput(output);
          resolve({ success: true, patterns });
        } else {
          resolve({
            success: false,
            error: error || 'Seasonal analysis failed',
            raw_output: output
          });
        }
      });
    });
  }

  /**
   * Get learning system status
   */
  getSystemStatus() {
    return {
      isLearning: this.isLearning,
      lastTraining: this.lastTraining,
      cacheSize: this.performanceCache.size,
      pythonScript: this.pythonScript,
      modelsAvailable: this.checkModelsExist()
    };
  }

  /**
   * Parse insights output from Python
   */
  parseInsightsOutput(output) {
    const insights = {
      performance_trend: 'unknown',
      peak_delay_hours: [],
      recommendations: []
    };

    const lines = output.split('\n');
    let inRecommendations = false;

    lines.forEach(line => {
      if (line.includes('performance_trend:')) {
        insights.performance_trend = line.split(':')[1].trim();
      }
      if (line.includes('peak_delay_hours:')) {
        const hours = line.match(/\[([^\]]+)\]/);
        if (hours) {
          insights.peak_delay_hours = hours[1].split(',').map(h => parseInt(h.trim()));
        }
      }
      if (line.includes('Recommendations:')) {
        inRecommendations = true;
        return;
      }
      if (inRecommendations && line.trim().startsWith('⚠️') || line.trim().startsWith('🕐') || line.trim().startsWith('🌦️')) {
        insights.recommendations.push(line.trim());
      }
    });

    return insights;
  }

  /**
   * Parse seasonal analysis output
   */
  parseSeasonalOutput(output) {
    const patterns = {};
    const lines = output.split('\n');
    let currentSeason = null;

    lines.forEach(line => {
      if (line.includes('Performance:')) {
        currentSeason = line.split(' ')[0].toLowerCase();
        patterns[currentSeason] = {};
      }
      if (currentSeason && line.includes('Average OTP:')) {
        patterns[currentSeason].avg_otp = parseFloat(line.match(/[\d.]+/)[0]);
      }
      if (currentSeason && line.includes('Average Delay:')) {
        patterns[currentSeason].avg_delay = parseFloat(line.match(/[\d.]+/)[0]);
      }
    });

    return patterns;
  }

  /**
   * Check if trained models exist
   */
  checkModelsExist() {
    try {
      const modelsDir = path.join(__dirname, '../models/network_otp');
      return {
        delay_model: require('fs').existsSync(path.join(modelsDir, 'hub_delay_model.pkl')),
        performance_model: require('fs').existsSync(path.join(modelsDir, 'hub_performance_model.pkl'))
      };
    } catch {
      return { delay_model: false, performance_model: false };
    }
  }
}

module.exports = NetworkOTPLearningService;