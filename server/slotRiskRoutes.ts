import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import axios from 'axios';

const router = express.Router();

// Import the FAA Data Service
import FAADataService from './faaDataService.js';
const faaDataService = new FAADataService();

// Slot Risk Dashboard endpoint with authentic FAA NAS Status integration
router.get('/dashboard', async (req, res) => {
  try {
    console.log('🔍 Fetching authentic FAA NAS Status data for slot risk analysis...');
    
    // Fetch authentic FAA NAS Status data
    const faaData = await faaDataService.fetchFAANASData();
    
    // Get Virgin Atlantic flights for slot risk analysis
    const virginAtlanticResponse = await axios.get('http://localhost:5000/api/aviation/virgin-atlantic-flights');
    let virginAtlanticFlights = [];
    
    if (virginAtlanticResponse.data && virginAtlanticResponse.data.success) {
      virginAtlanticFlights = virginAtlanticResponse.data.flights || [];
    }
    
    // Calculate slot risk using authentic FAA data
    const slotRiskFlights = faaDataService.calculateSlotRisk(virginAtlanticFlights, faaData);
    
    // Generate analysis summary
    const highRiskCount = slotRiskFlights.filter(f => f.at_risk).length;
    const averageDelay = slotRiskFlights.length > 0 ? 
      slotRiskFlights.reduce((sum, f) => sum + f.atfm_delay_min, 0) / slotRiskFlights.length : 0;
    const averageRiskScore = slotRiskFlights.length > 0 ? 
      slotRiskFlights.reduce((sum, f) => sum + f.slot_risk_score, 0) / slotRiskFlights.length : 0;
    
    const slotAnalysis = {
      success: true,
      timestamp: new Date().toISOString(),
      data_source: faaData.source,
      faa_delays_detected: faaData.total_delays,
      slot_analysis: {
        total_flights: slotRiskFlights.length,
        high_risk_count: highRiskCount,
        average_delay: Math.round(averageDelay * 10) / 10,
        average_risk_score: Math.round(averageRiskScore * 10) / 10,
        risk_threshold: 60
      },
      flights: slotRiskFlights.slice(0, 10) // Show top 10 flights
    };

    console.log(`✅ Generated slot risk analysis: ${slotRiskFlights.length} flights, ${highRiskCount} high risk, data source: ${faaData.source}`);
    res.json(slotAnalysis);
  } catch (error) {
    console.error('Slot risk analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate slot risk analysis',
      timestamp: new Date().toISOString()
    });
  }
});

// Start Streamlit dashboard
router.post('/start-dashboard', async (req, res) => {
  try {
    const pythonProcess = spawn('streamlit', ['run', 'slot_risk_dashboard.py', '--server.port=8501'], {
      cwd: process.cwd(),
      stdio: 'inherit'
    });

    res.json({
      success: true,
      message: 'Slot Risk Dashboard starting on port 8501',
      dashboard_url: 'http://localhost:8501',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to start Streamlit dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start Slot Risk Dashboard',
      timestamp: new Date().toISOString()
    });
  }
});

// Slot risk metrics endpoint with FAA data integration
router.get('/metrics', async (req, res) => {
  try {
    // Get FAA health data
    const faaHealth = faaDataService.getServiceHealth();
    
    // Get Virgin Atlantic flights for metrics calculation
    const virginAtlanticResponse = await axios.get('http://localhost:5000/api/aviation/virgin-atlantic-flights');
    let virginAtlanticFlights = [];
    
    if (virginAtlanticResponse.data && virginAtlanticResponse.data.success) {
      virginAtlanticFlights = virginAtlanticResponse.data.flights || [];
    }
    
    // Get FAA data for destination analysis
    const faaData = await faaDataService.fetchFAANASData();
    const slotRiskFlights = faaDataService.calculateSlotRisk(virginAtlanticFlights, faaData);
    
    // Calculate destination-specific metrics
    const destinationMetrics = {};
    slotRiskFlights.forEach(flight => {
      const dest = flight.destination;
      if (!destinationMetrics[dest]) {
        destinationMetrics[dest] = { risk_scores: [], delays: [] };
      }
      destinationMetrics[dest].risk_scores.push(flight.slot_risk_score);
      destinationMetrics[dest].delays.push(flight.atfm_delay_min);
    });
    
    // Convert to final format
    const destination_analysis = {};
    Object.keys(destinationMetrics).forEach(dest => {
      const scores = destinationMetrics[dest].risk_scores;
      const delays = destinationMetrics[dest].delays;
      destination_analysis[dest] = {
        avg_risk: scores.length > 0 ? 
          Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10 : 0,
        avg_delay: delays.length > 0 ? 
          Math.round((delays.reduce((sum, delay) => sum + delay, 0) / delays.length) * 10) / 10 : 0
      };
    });

    const highRiskFlights = slotRiskFlights.filter(f => f.at_risk).length;
    const mediumRiskFlights = slotRiskFlights.filter(f => f.slot_risk_score > 40 && f.slot_risk_score <= 60).length;
    const lowRiskFlights = slotRiskFlights.filter(f => f.slot_risk_score <= 40).length;
    const avgDelay = slotRiskFlights.length > 0 ? 
      slotRiskFlights.reduce((sum, f) => sum + f.atfm_delay_min, 0) / slotRiskFlights.length : 0;
    const complianceRate = slotRiskFlights.length > 0 ? 
      ((slotRiskFlights.length - highRiskFlights) / slotRiskFlights.length) * 100 : 100;

    const metrics = {
      success: true,
      timestamp: new Date().toISOString(),
      data_source: faaData.source,
      faa_service_health: faaHealth,
      operational_metrics: {
        slot_compliance_rate: Math.round(complianceRate * 10) / 10,
        average_atfm_delay: Math.round(avgDelay * 10) / 10,
        high_risk_threshold: 60,
        total_slots_monitored: slotRiskFlights.length,
        slots_at_risk: highRiskFlights,
        compliance_target: 95.0,
        faa_delays_detected: faaData.total_delays
      },
      risk_distribution: {
        low_risk: lowRiskFlights,
        medium_risk: mediumRiskFlights,
        high_risk: highRiskFlights,
        critical_risk: 0
      },
      destination_analysis: destination_analysis
    };

    res.json(metrics);
  } catch (error) {
    console.error('Slot metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch slot metrics',
      timestamp: new Date().toISOString()
    });
  }
});

// FAA NAS Status health endpoint
router.get('/faa-status', async (req, res) => {
  try {
    const faaData = await faaDataService.fetchFAANASData();
    const healthStatus = faaDataService.getServiceHealth();
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      faa_nas_status: {
        api_accessible: faaData.source !== 'AINO Fallback Data (FAA API Unavailable)',
        data_source: faaData.source,
        delays_detected: faaData.total_delays,
        airports_monitored: faaData.airports ? faaData.airports.length : 0,
        last_update: faaData.timestamp
      },
      service_health: healthStatus
    });
  } catch (error) {
    console.error('FAA status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch FAA status',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;