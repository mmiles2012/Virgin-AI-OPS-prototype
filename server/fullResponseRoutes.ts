import express from 'express';
import { spawn } from 'child_process';
import path from 'path';

const router = express.Router();

interface FullResponseRequest {
  aircraft_type: string;
  origin: string;
  destination: string;
  position_nm_from_origin: number;
  altitude_ft: number;
  failure_type: string;
  weather_conditions?: {
    severity?: string;
    wind_speed?: number;
    visibility?: number;
    precipitation?: string;
    temperature?: number;
  };
  real_time_data?: any;
}

// Full response simulation endpoint
router.post('/simulate', async (req, res) => {
  try {
    const {
      aircraft_type,
      origin,
      destination,
      position_nm_from_origin,
      altitude_ft,
      failure_type,
      weather_conditions,
      real_time_data
    }: FullResponseRequest = req.body;

    // Validate required parameters
    if (!aircraft_type || !origin || !destination || !failure_type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        required: ['aircraft_type', 'origin', 'destination', 'failure_type']
      });
    }

    // Execute Python simulation
    const pythonScript = path.join(process.cwd(), 'simulate_full_response.py');
    const pythonProcess = spawn('python3', [
      pythonScript,
      '--aircraft-type', aircraft_type,
      '--origin', origin,
      '--destination', destination,
      '--position', position_nm_from_origin.toString(),
      '--altitude', altitude_ft.toString(),
      '--failure-type', failure_type,
      '--weather', weather_conditions ? JSON.stringify(weather_conditions) : '{}',
      '--real-time-data', real_time_data ? JSON.stringify(real_time_data) : '{}'
    ]);

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output);
          res.json({
            success: true,
            simulation_result: result,
            timestamp: new Date().toISOString()
          });
        } catch (parseError) {
          console.error('Failed to parse Python output:', parseError);
          res.status(500).json({
            success: false,
            error: 'Failed to parse simulation result',
            raw_output: output
          });
        }
      } else {
        console.error('Python simulation failed:', errorOutput);
        res.status(500).json({
          success: false,
          error: 'Simulation execution failed',
          details: errorOutput
        });
      }
    });

  } catch (error) {
    console.error('Full response simulation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Quick simulation for testing
router.get('/demo/:aircraftType/:failureType', async (req, res) => {
  try {
    const { aircraftType, failureType } = req.params;
    
    // Demo scenario parameters
    const demoScenarios = {
      'engine_failure': {
        origin: 'LHR',
        destination: 'JFK',
        position_nm_from_origin: 1300,
        altitude_ft: 37000,
        weather_conditions: { severity: 'MODERATE', wind_speed: 25 }
      },
      'medical_emergency': {
        origin: 'LHR',
        destination: 'BOS',
        position_nm_from_origin: 800,
        altitude_ft: 41000
      },
      'electrical_fault': {
        origin: 'LHR',
        destination: 'MCO',
        position_nm_from_origin: 2100,
        altitude_ft: 35000,
        weather_conditions: { severity: 'SEVERE', visibility: 0.5 }
      },
      'hydraulic_failure': {
        origin: 'LHR',
        destination: 'ATL',
        position_nm_from_origin: 1800,
        altitude_ft: 39000
      }
    };

    const scenario = demoScenarios[failureType as keyof typeof demoScenarios];
    if (!scenario) {
      return res.status(400).json({
        success: false,
        error: 'Invalid failure type',
        available_types: Object.keys(demoScenarios)
      });
    }

    // Generate comprehensive demo response
    const demoResponse = {
      simulation_id: `AINO-DEMO-${Date.now()}`,
      scenario: {
        aircraft: aircraftType,
        route: `${scenario.origin} to ${scenario.destination}`,
        position: `${scenario.position_nm_from_origin}nm from ${scenario.origin}`,
        altitude: `${scenario.altitude_ft}ft`,
        failure: failureType,
        weather: scenario.weather_conditions || "Standard conditions"
      },
      failure_analysis: {
        type: failureType,
        aircraft_type: aircraftType,
        severity: failureType === 'medical_emergency' ? 'CRITICAL' : 'HIGH',
        systems_affected: getSystemsAffected(failureType),
        diversion_required: true,
        emergency_classification: getEmergencyClassification(failureType)
      },
      performance_impact: getPerformanceImpact(failureType),
      diversion_recommendations: {
        recommended_primary: {
          icao: 'EINN',
          name: 'Shannon Airport',
          distance: 280,
          weather_suitability: 'SUITABLE',
          virgin_atlantic_support: true,
          estimated_diversion_time: 1.2,
          confidence_level: 'HIGH'
        },
        urgency_level: failureType === 'medical_emergency' ? 'IMMEDIATE' : 'URGENT'
      },
      operational_actions: getOperationalActions(failureType),
      fuel_time_analysis: {
        additional_fuel_needed: 1500,
        modified_flight_time: 1.5,
        fuel_remaining_margin: { safety_margin: 'ADEQUATE' }
      },
      passenger_impact: {
        severity: failureType === 'medical_emergency' ? 'HIGH' : 'MODERATE',
        affected_passengers: 331,
        estimated_delay_hours: 12,
        rebooking_required: true
      },
      confidence_score: 0.92,
      learning_insights: {
        pattern_recognition: `${failureType} scenarios in ${aircraftType}`,
        optimization_opportunities: [
          'Enhanced crew training for specific scenarios',
          'Improved fuel planning strategies',
          'Better ground support coordination'
        ]
      },
      timestamp_utc: new Date().toISOString(),
      response_time_seconds: 0.8
    };

    res.json({
      success: true,
      simulation_result: demoResponse,
      demo_mode: true
    });

  } catch (error) {
    console.error('Demo simulation error:', error);
    res.status(500).json({
      success: false,
      error: 'Demo simulation failed'
    });
  }
});

// Get available aircraft types
router.get('/aircraft-types', (req, res) => {
  res.json({
    success: true,
    aircraft_types: [
      { code: 'A350-1000', name: 'Airbus A350-1000', capacity: 331 },
      { code: 'B787-9', name: 'Boeing 787-9', capacity: 274 },
      { code: 'A330-300', name: 'Airbus A330-300', capacity: 297 },
      { code: 'A330-900', name: 'Airbus A330-900', capacity: 310 }
    ]
  });
});

// Get available failure types
router.get('/failure-types', (req, res) => {
  res.json({
    success: true,
    failure_types: [
      { id: 'engine_failure', name: 'Engine Failure', severity: 'HIGH' },
      { id: 'medical_emergency', name: 'Medical Emergency', severity: 'CRITICAL' },
      { id: 'electrical_fault', name: 'Major Electrical Fault', severity: 'HIGH' },
      { id: 'hydraulic_failure', name: 'Hydraulic System Failure', severity: 'MEDIUM' },
      { id: 'decompression', name: 'Cabin Decompression', severity: 'CRITICAL' },
      { id: 'overweight_landing', name: 'Overweight Landing', severity: 'MEDIUM' }
    ]
  });
});

// Get simulation history for learning
router.get('/simulation-history', (req, res) => {
  // In production, this would query a database
  const mockHistory = [
    {
      id: 'AINO-20250113-143022',
      aircraft: 'A350-1000',
      failure: 'engine_failure',
      confidence: 0.94,
      outcome: 'successful_diversion',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'AINO-20250113-095516',
      aircraft: 'B787-9',
      failure: 'medical_emergency',
      confidence: 0.91,
      outcome: 'successful_diversion',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    }
  ];

  res.json({
    success: true,
    history: mockHistory,
    total_simulations: mockHistory.length,
    success_rate: 0.96
  });
});

// Train ML delay prediction model
router.post('/train-model', async (req, res) => {
  try {
    const pythonProcess = spawn('python3', [
      '-c',
      `
import sys
sys.path.append('.')
from delay_predictor import train_model
try:
    train_model()
    print("SUCCESS: Model training completed")
except Exception as e:
    print(f"ERROR: {str(e)}")
    sys.exit(1)
      `
    ]);

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0 && output.includes('SUCCESS')) {
        res.json({
          success: true,
          message: 'ML model training completed successfully',
          output: output
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Model training failed',
          details: errorOutput || output
        });
      }
    });

  } catch (error) {
    console.error('Model training error:', error);
    res.status(500).json({
      success: false,
      error: 'Model training failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Predict delay for specific scenario
router.post('/predict-delay', async (req, res) => {
  try {
    const { 
      aircraft, 
      failure_type, 
      origin, 
      destination, 
      position_nm, 
      altitude_ft,
      diversion_icao 
    } = req.body;

    const pythonProcess = spawn('python3', [
      '-c',
      `
import sys
import json
sys.path.append('.')
from delay_predictor import predict_delay, estimate_cost

try:
    input_features = {
        "aircraft": "${aircraft}",
        "failure_type": "${failure_type}",
        "origin": "${origin}",
        "destination": "${destination}",
        "position_nm": ${position_nm},
        "altitude_ft": ${altitude_ft},
        "diversion_icao": "${diversion_icao}",
        "diversion_score": 0.8,
        "actions_issued": 6
    }
    
    delay_minutes = predict_delay(input_features)
    cost_estimate = estimate_cost(delay_minutes)
    
    result = {
        "delay_minutes": float(delay_minutes),
        "cost_estimate_usd": cost_estimate,
        "success": True
    }
    
    print(json.dumps(result))
    
except Exception as e:
    error_result = {
        "success": False,
        "error": str(e)
    }
    print(json.dumps(error_result))
    sys.exit(1)
      `
    ]);

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      try {
        const result = JSON.parse(output);
        if (result.success) {
          res.json({
            success: true,
            prediction: {
              estimated_delay_minutes: result.delay_minutes,
              cost_estimate_usd: result.cost_estimate_usd
            }
          });
        } else {
          res.status(500).json({
            success: false,
            error: 'Prediction failed',
            details: result.error
          });
        }
      } catch (parseError) {
        res.status(500).json({
          success: false,
          error: 'Failed to parse prediction result',
          details: errorOutput || output
        });
      }
    });

  } catch (error) {
    console.error('Delay prediction error:', error);
    res.status(500).json({
      success: false,
      error: 'Delay prediction failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get learning system status
router.get('/learning-status', (req, res) => {
  res.json({
    success: true,
    system_status: {
      ml_model_available: require('fs').existsSync('delay_model.pkl'),
      logging_active: require('fs').existsSync('logs'),
      total_simulations: 156,  // Example data
      model_accuracy: 0.87,
      last_training: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
    },
    cost_parameters: {
      delay_per_minute_usd: 100,
      diversion_base_cost: 5000,
      crew_disruption_cost: 3000,
      passenger_services_cost: 15000
    }
  });
});

// Helper functions
function getSystemsAffected(failureType: string): string[] {
  const systemsMap: Record<string, string[]> = {
    'engine_failure': ['HYD 2', 'GEN 2', 'BLEED 2'],
    'medical_emergency': ['CABIN CREW', 'MEDICAL EQUIPMENT', 'COMMUNICATIONS'],
    'electrical_fault': ['AVIONICS', 'LIGHTING', 'BACKUP POWER', 'NAVIGATION'],
    'hydraulic_failure': ['PRIMARY FLT CTRL', 'LANDING GEAR', 'AUTOBRAKES'],
    'decompression': ['CABIN PRESS', 'OXY SYSTEM', 'PACK VALVES'],
    'overweight_landing': ['LANDING GEAR', 'BRAKES', 'STRUCTURAL']
  };
  
  return systemsMap[failureType] || ['UNKNOWN'];
}

function getEmergencyClassification(failureType: string): string {
  if (failureType === 'medical_emergency' || failureType === 'decompression') {
    return 'MAYDAY';
  } else if (failureType === 'engine_failure' || failureType === 'electrical_fault') {
    return 'PAN PAN';
  } else {
    return 'URGENT';
  }
}

function getPerformanceImpact(failureType: string) {
  const impactMap: Record<string, any> = {
    'engine_failure': {
      cruise_speed_reduction: 15,
      fuel_burn_increase: 25,
      altitude_restriction: 25000,
      range_reduction: 30
    },
    'medical_emergency': {
      cruise_speed_reduction: 0,
      fuel_burn_increase: 30,
      urgency_factor: 'IMMEDIATE'
    },
    'electrical_fault': {
      cruise_speed_reduction: 5,
      fuel_burn_increase: 8,
      navigation_capability: 'reduced'
    },
    'hydraulic_failure': {
      cruise_speed_reduction: 5,
      fuel_burn_increase: 10,
      landing_distance_increase: 25
    }
  };
  
  return impactMap[failureType] || { fuel_burn_increase: 10 };
}

function getOperationalActions(failureType: string) {
  const actionsMap: Record<string, any> = {
    'engine_failure': {
      immediate_actions: [
        'Execute engine failure checklist',
        'Configure for single-engine operations',
        'Declare emergency with ATC',
        'Begin drift-down procedure'
      ],
      coordination_actions: [
        'Coordinate with Shannon operations',
        'Arrange ground services',
        'Notify Virgin Atlantic operations center'
      ]
    },
    'medical_emergency': {
      immediate_actions: [
        'Assess passenger condition',
        'Contact medical advisory service',
        'Prepare cabin for emergency',
        'Request priority handling'
      ],
      coordination_actions: [
        'Coordinate with ground medical services',
        'Arrange ambulance at destination',
        'Notify Virgin Atlantic medical team'
      ]
    }
  };
  
  return actionsMap[failureType] || {
    immediate_actions: ['Execute appropriate emergency checklist'],
    coordination_actions: ['Coordinate with operations center']
  };
}

export default router;