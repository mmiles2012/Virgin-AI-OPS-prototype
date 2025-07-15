/**
 * European Network Manager ML Service for Real-Time Punctuality Analytics
 * Enhanced ML insights from EUROCONTROL punctuality data
 */

import fs from 'fs';
import path from 'path';

class EuropeanPunctualityMLService {
  constructor() {
    this.dataCache = null;
    this.mlModel = null;
    this.lastUpdate = null;
    this.initializeMLModel();
  }

  /**
   * Initialize ML model for European punctuality prediction
   */
  initializeMLModel() {
    console.log('🇪🇺 European Punctuality ML Service initialized');
    this.loadData();
  }

  /**
   * Load and process European Network Manager data
   */
  loadData() {
    try {
      const csvPath = path.join('attached_assets', 'Download nm_network_punctuality_1751725331403.csv');
      
      if (!fs.existsSync(csvPath)) {
        console.error('❌ European NM data file not found');
        return null;
      }

      const csvData = fs.readFileSync(csvPath, 'utf8');
      const lines = csvData.split('\n');
      const headers = lines[0].split(',');

      const data = lines.slice(1)
        .filter(line => line.trim().length > 0)
        .map(line => {
          const values = line.split(',');
          const record = {};
          headers.forEach((header, index) => {
            record[header.trim()] = values[index] ? values[index].trim() : null;
          });
          return record;
        })
        .filter(record => record.DATE && record.ARR_PUN_DY && record.DEP_PUN_DY)
        .map(record => ({
          date: record.DATE,
          arrivalPunctuality: parseFloat(record.ARR_PUN_DY) || 0,
          departurePunctuality: parseFloat(record.DEP_PUN_DY) || 0,
          operationalSchedule: parseFloat(record.OPE_SCH_DY) || 0,
          arrivalFlights: parseInt(record.ARR_SCHED_FLIGHTS_DY) || 0,
          departureFlights: parseInt(record.DEP_SCHED_FLIGHTS_DY) || 0,
          arrivalPunctualFlights: parseInt(record.ARR_PUNCTUAL_FLIGHTS_DY) || 0,
          departurePunctualFlights: parseInt(record.DEP_PUNCTUAL_FLIGHTS_DY) || 0,
          weeklyArrivalPunctuality: parseFloat(record.ARR_PUN_WK) || null,
          weeklyDeparturePunctuality: parseFloat(record.DEP_PUN_WK) || null
        }));

      this.dataCache = data;
      this.lastUpdate = new Date();
      console.log(`✅ Loaded ${data.length} European NM records`);
      return data;
    } catch (error) {
      console.error('❌ Error loading European NM data:', error);
      return null;
    }
  }

  /**
   * Generate comprehensive European airspace analytics
   */
  generateEuropeanAnalytics() {
    if (!this.dataCache) {
      this.loadData();
    }

    if (!this.dataCache || this.dataCache.length === 0) {
      return null;
    }

    const data = this.dataCache;
    
    // Real-time trend analysis
    const recent30Days = data.slice(-30);
    const recent90Days = data.slice(-90);
    const recent365Days = data.slice(-365);

    // Calculate trend metrics
    const currentPunctuality = {
      arrival: recent30Days.reduce((sum, d) => sum + d.arrivalPunctuality, 0) / recent30Days.length,
      departure: recent30Days.reduce((sum, d) => sum + d.departurePunctuality, 0) / recent30Days.length
    };

    const previousPunctuality = {
      arrival: recent90Days.slice(-60, -30).reduce((sum, d) => sum + d.arrivalPunctuality, 0) / 30,
      departure: recent90Days.slice(-60, -30).reduce((sum, d) => sum + d.departurePunctuality, 0) / 30
    };

    // Performance trends
    const arrivalTrend = ((currentPunctuality.arrival - previousPunctuality.arrival) / previousPunctuality.arrival) * 100;
    const departureTrend = ((currentPunctuality.departure - previousPunctuality.departure) / previousPunctuality.departure) * 100;

    // Seasonal analysis
    const seasonalAnalysis = this.analyzeSeasonalPatterns(data);
    
    // Weekly patterns
    const weeklyPatterns = this.analyzeWeeklyPatterns(recent90Days);
    
    // Volume correlation analysis
    const volumeCorrelation = this.analyzeVolumeCorrelation(recent365Days);

    // ML predictions for next 7 days
    const predictions = this.generateMLPredictions(recent90Days);

    // European network health assessment
    const networkHealth = this.assessNetworkHealth(recent30Days);

    return {
      currentMetrics: {
        arrivalPunctuality: Math.round(currentPunctuality.arrival * 1000) / 10,
        departurePunctuality: Math.round(currentPunctuality.departure * 1000) / 10,
        averageFlights: Math.round(recent30Days.reduce((sum, d) => sum + d.arrivalFlights + d.departureFlights, 0) / recent30Days.length),
        operationalEfficiency: Math.round(recent30Days.reduce((sum, d) => sum + d.operationalSchedule, 0) / recent30Days.length * 1000) / 10
      },
      trendAnalysis: {
        arrivalTrend: Math.round(arrivalTrend * 100) / 100,
        departureTrend: Math.round(departureTrend * 100) / 100,
        overallDirection: arrivalTrend > 0 && departureTrend > 0 ? 'improving' : 
                         arrivalTrend < 0 && departureTrend < 0 ? 'declining' : 'mixed'
      },
      seasonalInsights: seasonalAnalysis,
      weeklyPatterns: weeklyPatterns,
      volumeCorrelation: volumeCorrelation,
      mlPredictions: predictions,
      networkHealth: networkHealth,
      dataQuality: {
        recordsAnalyzed: data.length,
        recentDataPoints: recent30Days.length,
        dataCompleteness: Math.round((data.filter(d => d.arrivalPunctuality > 0).length / data.length) * 100),
        lastUpdate: this.lastUpdate
      }
    };
  }

  /**
   * Analyze seasonal patterns in European airspace
   */
  analyzeSeasonalPatterns(data) {
    const seasonalData = {};
    
    data.forEach(record => {
      const date = new Date(record.date);
      const month = date.getMonth() + 1;
      const season = month <= 2 || month === 12 ? 'winter' :
                    month <= 5 ? 'spring' :
                    month <= 8 ? 'summer' : 'autumn';
      
      if (!seasonalData[season]) {
        seasonalData[season] = {
          arrival: [],
          departure: [],
          volume: []
        };
      }
      
      seasonalData[season].arrival.push(record.arrivalPunctuality);
      seasonalData[season].departure.push(record.departurePunctuality);
      seasonalData[season].volume.push(record.arrivalFlights + record.departureFlights);
    });

    const results = {};
    Object.keys(seasonalData).forEach(season => {
      const seasonData = seasonalData[season];
      results[season] = {
        avgArrivalPunctuality: Math.round(seasonData.arrival.reduce((a, b) => a + b, 0) / seasonData.arrival.length * 1000) / 10,
        avgDeparturePunctuality: Math.round(seasonData.departure.reduce((a, b) => a + b, 0) / seasonData.departure.length * 1000) / 10,
        avgVolume: Math.round(seasonData.volume.reduce((a, b) => a + b, 0) / seasonData.volume.length),
        dataPoints: seasonData.arrival.length
      };
    });

    return results;
  }

  /**
   * Analyze weekly operational patterns
   */
  analyzeWeeklyPatterns(data) {
    const weeklyData = {};
    
    data.forEach(record => {
      const date = new Date(record.date);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      
      if (!weeklyData[dayOfWeek]) {
        weeklyData[dayOfWeek] = {
          arrival: [],
          departure: [],
          volume: []
        };
      }
      
      weeklyData[dayOfWeek].arrival.push(record.arrivalPunctuality);
      weeklyData[dayOfWeek].departure.push(record.departurePunctuality);
      weeklyData[dayOfWeek].volume.push(record.arrivalFlights + record.departureFlights);
    });

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const results = {};
    
    Object.keys(weeklyData).forEach(day => {
      const dayData = weeklyData[day];
      results[dayNames[day]] = {
        avgArrivalPunctuality: Math.round(dayData.arrival.reduce((a, b) => a + b, 0) / dayData.arrival.length * 1000) / 10,
        avgDeparturePunctuality: Math.round(dayData.departure.reduce((a, b) => a + b, 0) / dayData.departure.length * 1000) / 10,
        avgVolume: Math.round(dayData.volume.reduce((a, b) => a + b, 0) / dayData.volume.length),
        peakDay: dayData.volume.reduce((a, b) => a + b, 0) / dayData.volume.length > 45000
      };
    });

    return results;
  }

  /**
   * Analyze correlation between traffic volume and punctuality
   */
  analyzeVolumeCorrelation(data) {
    const volumes = data.map(d => d.arrivalFlights + d.departureFlights);
    const arrivalPunctuality = data.map(d => d.arrivalPunctuality);
    const departurePunctuality = data.map(d => d.departurePunctuality);

    // Simple correlation calculation
    const correlationArrival = this.calculateCorrelation(volumes, arrivalPunctuality);
    const correlationDeparture = this.calculateCorrelation(volumes, departurePunctuality);

    // Volume thresholds analysis
    const lowVolume = data.filter(d => (d.arrivalFlights + d.departureFlights) < 40000);
    const mediumVolume = data.filter(d => (d.arrivalFlights + d.departureFlights) >= 40000 && (d.arrivalFlights + d.departureFlights) < 50000);
    const highVolume = data.filter(d => (d.arrivalFlights + d.departureFlights) >= 50000);

    return {
      correlationCoefficients: {
        arrival: Math.round(correlationArrival * 1000) / 1000,
        departure: Math.round(correlationDeparture * 1000) / 1000
      },
      volumeThresholds: {
        low: {
          threshold: '< 40,000 flights',
          avgPunctuality: Math.round(lowVolume.reduce((sum, d) => sum + (d.arrivalPunctuality + d.departurePunctuality) / 2, 0) / lowVolume.length * 1000) / 10,
          occurrences: lowVolume.length
        },
        medium: {
          threshold: '40,000 - 50,000 flights',
          avgPunctuality: Math.round(mediumVolume.reduce((sum, d) => sum + (d.arrivalPunctuality + d.departurePunctuality) / 2, 0) / mediumVolume.length * 1000) / 10,
          occurrences: mediumVolume.length
        },
        high: {
          threshold: '> 50,000 flights',
          avgPunctuality: Math.round(highVolume.reduce((sum, d) => sum + (d.arrivalPunctuality + d.departurePunctuality) / 2, 0) / highVolume.length * 1000) / 10,
          occurrences: highVolume.length
        }
      }
    };
  }

  /**
   * Calculate correlation coefficient between two arrays
   */
  calculateCorrelation(x, y) {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Generate ML-based predictions for European punctuality
   */
  generateMLPredictions(recentData) {
    const predictions = [];
    const currentDate = new Date();

    // Simple moving average with trend adjustment for next 7 days
    for (let i = 1; i <= 7; i++) {
      const targetDate = new Date(currentDate.getTime() + (i * 24 * 60 * 60 * 1000));
      
      // Recent trend analysis
      const last7Days = recentData.slice(-7);
      const avgArrival = last7Days.reduce((sum, d) => sum + d.arrivalPunctuality, 0) / last7Days.length;
      const avgDeparture = last7Days.reduce((sum, d) => sum + d.departurePunctuality, 0) / last7Days.length;
      
      // Add day-of-week adjustment
      const dayOfWeek = targetDate.getDay();
      const weekendAdjustment = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.05 : 0; // Better punctuality on weekends
      
      // Add seasonal adjustment
      const month = targetDate.getMonth() + 1;
      const seasonalAdjustment = (month >= 6 && month <= 8) ? -0.03 : 0.02; // Summer typically worse
      
      predictions.push({
        date: targetDate.toISOString().split('T')[0],
        predictedArrivalPunctuality: Math.round((avgArrival + weekendAdjustment + seasonalAdjustment) * 1000) / 10,
        predictedDeparturePunctuality: Math.round((avgDeparture + weekendAdjustment + seasonalAdjustment) * 1000) / 10,
        confidence: Math.max(0.7, 0.95 - (i * 0.05)), // Decreasing confidence over time
        methodology: 'Moving average with seasonal/weekly adjustments'
      });
    }

    return predictions;
  }

  /**
   * Assess European network health
   */
  assessNetworkHealth(recentData) {
    const avgArrival = recentData.reduce((sum, d) => sum + d.arrivalPunctuality, 0) / recentData.length;
    const avgDeparture = recentData.reduce((sum, d) => sum + d.departurePunctuality, 0) / recentData.length;
    const avgOperational = recentData.reduce((sum, d) => sum + d.operationalSchedule, 0) / recentData.length;

    // Health score calculation (0-100)
    const arrivalScore = Math.min(100, avgArrival * 125); // 80% = 100 points
    const departureScore = Math.min(100, avgDeparture * 125);
    const operationalScore = Math.min(100, avgOperational * 105); // 95% = 100 points

    const overallScore = (arrivalScore + departureScore + operationalScore) / 3;

    const healthStatus = overallScore >= 90 ? 'excellent' :
                        overallScore >= 80 ? 'good' :
                        overallScore >= 70 ? 'fair' : 'poor';

    // Identify operational challenges
    const challenges = [];
    if (avgArrival < 0.75) challenges.push('Arrival punctuality below 75%');
    if (avgDeparture < 0.70) challenges.push('Departure punctuality below 70%');
    if (avgOperational < 0.95) challenges.push('Operational schedule adherence issues');

    // Calculate network resilience
    const volatility = this.calculateVolatility(recentData.map(d => (d.arrivalPunctuality + d.departurePunctuality) / 2));
    const resilience = volatility < 0.05 ? 'high' : volatility < 0.10 ? 'medium' : 'low';

    return {
      overallScore: Math.round(overallScore),
      status: healthStatus,
      components: {
        arrival: Math.round(arrivalScore),
        departure: Math.round(departureScore),
        operational: Math.round(operationalScore)
      },
      challenges: challenges,
      networkResilience: resilience,
      volatilityIndex: Math.round(volatility * 1000) / 1000,
      recommendation: this.generateHealthRecommendations(healthStatus, challenges)
    };
  }

  /**
   * Calculate volatility/variance of data
   */
  calculateVolatility(data) {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const squaredDiffs = data.map(value => Math.pow(value - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
    return Math.sqrt(variance);
  }

  /**
   * Generate health recommendations
   */
  generateHealthRecommendations(status, challenges) {
    if (status === 'excellent') {
      return 'European network operating at optimal levels. Continue monitoring for sustained performance.';
    } else if (status === 'good') {
      return 'Network performance is strong. Monitor trends and prepare for seasonal variations.';
    } else if (status === 'fair') {
      return 'Network showing stress indicators. Consider capacity optimization and flow management enhancements.';
    } else {
      return 'Network experiencing significant challenges. Immediate attention required for ' + challenges.join(', ').toLowerCase() + '.';
    }
  }

  /**
   * Get real-time European airspace status
   */
  getRealTimeStatus() {
    const analytics = this.generateEuropeanAnalytics();
    
    if (!analytics) {
      return {
        success: false,
        error: 'Unable to generate European analytics'
      };
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
      source: 'European Network Manager (EUROCONTROL)',
      analytics: analytics,
      realTimeInsights: {
        currentPerformance: `${analytics.currentMetrics.arrivalPunctuality}% arrival, ${analytics.currentMetrics.departurePunctuality}% departure punctuality`,
        trend: analytics.trendAnalysis.overallDirection,
        networkHealth: analytics.networkHealth.status,
        nextDayPrediction: analytics.mlPredictions[0],
        keyInsight: this.generateKeyInsight(analytics)
      }
    };
  }

  /**
   * Generate key operational insight
   */
  generateKeyInsight(analytics) {
    const health = analytics.networkHealth;
    const trends = analytics.trendAnalysis;
    
    if (health.status === 'poor') {
      return `European network under stress with ${health.overallScore}% health score. Immediate operational adjustments recommended.`;
    } else if (trends.overallDirection === 'improving') {
      return `Positive momentum in European airspace with ${trends.arrivalTrend > 0 ? '+' : ''}${trends.arrivalTrend.toFixed(1)}% arrival trend improvement.`;
    } else if (analytics.volumeCorrelation.correlationCoefficients.arrival < -0.3) {
      return `Strong inverse correlation between traffic volume and punctuality detected. Consider demand management strategies.`;
    } else {
      return `European network maintaining stable operations with ${analytics.currentMetrics.operationalEfficiency}% operational efficiency.`;
    }
  }
}

export const europeanPunctualityMLService = new EuropeanPunctualityMLService();