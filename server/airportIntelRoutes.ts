import { Router } from 'express';
import { spawn } from 'child_process';
import path from 'path';

const router = Router();

// Enhanced alternate airport ranking endpoint
router.post('/airport-intelligence/evaluate-diversion', async (req, res) => {
  try {
    const { failure_type, aircraft_type, current_position, flight_phase } = req.body;
    
    // Validate input
    if (!failure_type || !aircraft_type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: failure_type, aircraft_type'
      });
    }
    
    // Execute Python script for enhanced alternate ranking
    const pythonScript = `
import sys
import os
sys.path.append('${process.cwd()}')

from enhanced_alternate_ranking import EnhancedAlternateRanker
import json

ranker = EnhancedAlternateRanker()

scenario = ranker.evaluate_diversion_scenario(
    failure_type="${failure_type}",
    aircraft_type="${aircraft_type}",
    current_position=${JSON.stringify(current_position || {lat: 55.0, lon: -30.0})},
    flight_phase="${flight_phase || 'cruise'}"
)

print("AINO_RESULT:", json.dumps(scenario, indent=2))
    `;
    
    const pythonProcess = spawn('python3', ['-c', pythonScript]);
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
          // Extract the JSON result
          const resultMatch = output.match(/AINO_RESULT: ({.*})/s);
          if (resultMatch) {
            const scenario = JSON.parse(resultMatch[1]);
            res.json({
              success: true,
              scenario: scenario,
              metadata: {
                processing_time: new Date().toISOString(),
                system: 'AINO Enhanced Alternate Ranking',
                version: '1.0.0'
              }
            });
          } else {
            throw new Error('No valid result found in output');
          }
        } catch (parseError) {
          res.status(500).json({
            success: false,
            error: 'Failed to parse airport intelligence result',
            details: parseError.message
          });
        }
      } else {
        res.status(500).json({
          success: false,
          error: 'Airport intelligence evaluation failed',
          details: error
        });
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Airport intelligence scoring endpoint
router.post('/airport-intelligence/score', async (req, res) => {
  try {
    const { icao, aircraft_type } = req.body;
    
    if (!icao || !aircraft_type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: icao, aircraft_type'
      });
    }
    
    // Execute Python script for airport scoring
    const pythonScript = `
import sys
import os
sys.path.append('${process.cwd()}')

from airport_intel import score_airport, get_airport_info
import json

score_result = score_airport("${icao}", "${aircraft_type}")
airport_info = get_airport_info("${icao}")

result = {
    "score": score_result,
    "airport_info": airport_info,
    "timestamp": "${new Date().toISOString()}"
}

print("AINO_SCORE:", json.dumps(result, indent=2))
    `;
    
    const pythonProcess = spawn('python3', ['-c', pythonScript]);
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
          const resultMatch = output.match(/AINO_SCORE: ({.*})/s);
          if (resultMatch) {
            const result = JSON.parse(resultMatch[1]);
            res.json({
              success: true,
              ...result
            });
          } else {
            throw new Error('No valid score result found');
          }
        } catch (parseError) {
          res.status(500).json({
            success: false,
            error: 'Failed to parse airport score result',
            details: parseError.message
          });
        }
      } else {
        res.status(500).json({
          success: false,
          error: 'Airport scoring failed',
          details: error
        });
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Get available airports in intelligence database
router.get('/airport-intelligence/available-airports', async (req, res) => {
  try {
    const pythonScript = `
import sys
import os
sys.path.append('${process.cwd()}')

from airport_intel import AIRPORT_DB
import json

airports = []
for name, data in AIRPORT_DB.items():
    airports.append({
        "name": name,
        "icao": data["icao"],
        "runway_length_ft": data["runway_length_ft"],
        "fire_category": data["fire_category"],
        "can_handle": data["can_handle"],
        "political_risk": data["political_risk"],
        "handling_available": data["handling_available"]
    })

print("AINO_AIRPORTS:", json.dumps(airports, indent=2))
    `;
    
    const pythonProcess = spawn('python3', ['-c', pythonScript]);
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
          const resultMatch = output.match(/AINO_AIRPORTS: (\[.*\])/s);
          if (resultMatch) {
            const airports = JSON.parse(resultMatch[1]);
            res.json({
              success: true,
              airports: airports,
              count: airports.length,
              updated_at: new Date().toISOString()
            });
          } else {
            throw new Error('No valid airports data found');
          }
        } catch (parseError) {
          res.status(500).json({
            success: false,
            error: 'Failed to parse airports data',
            details: parseError.message
          });
        }
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to load airports database',
          details: error
        });
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

export default router;