import { Router } from 'express';
import { spawn } from 'child_process';
import path from 'path';

const router = Router();

// Fleet substitution analysis endpoint
router.post('/substitution-analysis', async (req, res) => {
  try {
    const { 
      originalAircraft, 
      loadFactor = 0.85, 
      cargoLoad = 10000, 
      flightDuration = 8.0,
      availableFleet = null 
    } = req.body;

    if (!originalAircraft) {
      return res.status(400).json({
        success: false,
        error: 'Original aircraft code required'
      });
    }

    // Create Python script to run substitution analysis
    const pythonScript = `
import sys
import json
sys.path.append('${process.cwd()}')
from virgin_atlantic_fleet_substitution import VirginAtlanticFleetManager

fleet_manager = VirginAtlanticFleetManager()
result = fleet_manager.get_substitution_for_api(
    '${originalAircraft}', 
    ${loadFactor}, 
    ${cargoLoad}, 
    ${flightDuration}
)
print(json.dumps(result))
`;

    const python = spawn('python3', ['-c', pythonScript]);
    let output = '';
    let errorOutput = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        console.error('Fleet substitution analysis error:', errorOutput);
        return res.status(500).json({
          success: false,
          error: 'Failed to analyze fleet substitution options'
        });
      }

      try {
        const analysisResult = JSON.parse(output.trim());
        
        res.json({
          success: true,
          timestamp: new Date().toISOString(),
          substitution_analysis: analysisResult,
          system_info: {
            analysis_type: 'Virgin Atlantic Fleet Substitution',
            parameters: {
              original_aircraft: originalAircraft,
              load_factor: loadFactor,
              cargo_load_kg: cargoLoad,
              flight_duration_hours: flightDuration
            }
          }
        });
      } catch (parseError) {
        console.error('Failed to parse substitution analysis:', parseError);
        res.status(500).json({
          success: false,
          error: 'Failed to parse analysis results'
        });
      }
    });

  } catch (error) {
    console.error('Fleet substitution analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during substitution analysis'
    });
  }
});

// Fleet overview endpoint
router.get('/fleet-overview', async (req, res) => {
  try {
    const pythonScript = `
import sys
import json
sys.path.append('${process.cwd()}')
from virgin_atlantic_fleet_substitution import VirginAtlanticFleetManager

fleet_manager = VirginAtlanticFleetManager()
fleet_specs = fleet_manager.fleet_specs
substitution_matrix = fleet_manager.substitution_matrix.to_dict()

result = {
    'fleet_specifications': fleet_specs,
    'substitution_matrix': substitution_matrix,
    'fleet_summary': {
        'total_aircraft': sum(spec['count'] for spec in fleet_specs.values()),
        'total_seats': sum(spec['total_pax'] * spec['count'] for spec in fleet_specs.values()),
        'aircraft_types': len(fleet_specs)
    }
}
print(json.dumps(result))
`;

    const python = spawn('python3', ['-c', pythonScript]);
    let output = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        return res.status(500).json({
          success: false,
          error: 'Failed to retrieve fleet overview'
        });
      }

      try {
        const fleetData = JSON.parse(output.trim());
        res.json({
          success: true,
          timestamp: new Date().toISOString(),
          fleet_data: fleetData
        });
      } catch (parseError) {
        res.status(500).json({
          success: false,
          error: 'Failed to parse fleet data'
        });
      }
    });

  } catch (error) {
    console.error('Fleet overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Quick substitution lookup
router.get('/quick-substitution/:aircraftCode', async (req, res) => {
  try {
    const { aircraftCode } = req.params;
    const { loadFactor = 0.85, cargoLoad = 10000, flightDuration = 8.0 } = req.query;

    const pythonScript = `
import sys
import json
sys.path.append('${process.cwd()}')
from virgin_atlantic_fleet_substitution import VirginAtlanticFleetManager

fleet_manager = VirginAtlanticFleetManager()
result = fleet_manager.get_substitution_for_api('${aircraftCode}', ${loadFactor}, ${cargoLoad}, ${flightDuration})
print(json.dumps(result))
`;

    const python = spawn('python3', ['-c', pythonScript]);
    let output = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        return res.status(500).json({
          success: false,
          error: 'Failed to analyze substitution options'
        });
      }

      try {
        const substitutionData = JSON.parse(output.trim());
        res.json({
          success: true,
          timestamp: new Date().toISOString(),
          substitution_options: substitutionData
        });
      } catch (parseError) {
        res.status(500).json({
          success: false,
          error: 'Failed to parse substitution data'
        });
      }
    });

  } catch (error) {
    console.error('Quick substitution error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;