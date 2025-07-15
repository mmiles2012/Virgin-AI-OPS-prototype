import express from 'express';
import { spawn } from 'child_process';
import path from 'path';

const router = express.Router();

// Slot Risk Dashboard endpoint
router.get('/dashboard', async (req, res) => {
  try {
    // Generate slot risk analysis data
    const slotAnalysis = {
      success: true,
      timestamp: new Date().toISOString(),
      slot_analysis: {
        total_flights: 10,
        high_risk_count: 3,
        average_delay: 25.4,
        average_risk_score: 58.2,
        risk_threshold: 60
      },
      flights: [
        {
          flight_number: "VS3",
          origin: "LHR",
          destination: "JFK",
          scheduled_slot: "2025-07-15T14:30:00Z",
          atfm_delay_min: 45,
          slot_risk_score: 72.5,
          at_risk: true,
          risk_factors: {
            time_risk: 35.2,
            delay_risk: 30.1,
            weather_risk: 7.2
          }
        },
        {
          flight_number: "VS9",
          origin: "LHR", 
          destination: "BOS",
          scheduled_slot: "2025-07-15T16:15:00Z",
          atfm_delay_min: 20,
          slot_risk_score: 45.8,
          at_risk: false,
          risk_factors: {
            time_risk: 22.1,
            delay_risk: 18.3,
            weather_risk: 5.4
          }
        },
        {
          flight_number: "VS15",
          origin: "LHR",
          destination: "ATL", 
          scheduled_slot: "2025-07-15T18:45:00Z",
          atfm_delay_min: 35,
          slot_risk_score: 68.9,
          at_risk: true,
          risk_factors: {
            time_risk: 28.7,
            delay_risk: 32.4,
            weather_risk: 7.8
          }
        }
      ]
    };

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

// Slot risk metrics endpoint
router.get('/metrics', async (req, res) => {
  try {
    const metrics = {
      success: true,
      timestamp: new Date().toISOString(),
      operational_metrics: {
        slot_compliance_rate: 87.5,
        average_atfm_delay: 22.3,
        high_risk_threshold: 60,
        total_slots_monitored: 45,
        slots_at_risk: 8,
        compliance_target: 95.0
      },
      risk_distribution: {
        low_risk: 32,
        medium_risk: 5, 
        high_risk: 8,
        critical_risk: 0
      },
      destination_analysis: {
        "JFK": { avg_risk: 65.2, avg_delay: 35.1 },
        "ATL": { avg_risk: 58.9, avg_delay: 28.4 },
        "BOS": { avg_risk: 42.1, avg_delay: 18.7 },
        "MIA": { avg_risk: 38.5, avg_delay: 15.2 },
        "LAX": { avg_risk: 61.8, avg_delay: 32.6 }
      }
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

export default router;