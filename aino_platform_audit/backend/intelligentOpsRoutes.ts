/**
 * Intelligent Operations Agent API Routes for AINO Platform
 * Provides comprehensive operational response coordination
 */

import { Router } from 'express';
import { spawn } from 'child_process';
import path from 'path';

const router = Router();

interface OpsResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

/**
 * Execute Python intelligent ops agent
 */
async function executeOpsAgent(scriptArgs: string[]): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonPath = 'python3';
    const scriptPath = path.join(process.cwd(), 'intelligent_ops_agent.py');
    
    const process = spawn(pythonPath, [scriptPath, ...scriptArgs]);
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        try {
          // Extract JSON from Python output
          const jsonMatch = stdout.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            resolve(JSON.parse(jsonMatch[0]));
          } else {
            resolve({ output: stdout });
          }
        } catch (e) {
          resolve({ output: stdout });
        }
      } else {
        reject(new Error(`Process exited with code ${code}: ${stderr}`));
      }
    });
    
    process.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Generate comprehensive operational response
 */
router.post('/comprehensive-response', async (req, res) => {
  try {
    const { 
      failure_type, 
      aircraft_type = 'A330-300', 
      flight_number = 'VS127',
      diversion_required = true 
    } = req.body;

    // Convert JavaScript boolean to Python boolean string
    const pythonDiversionRequired = diversion_required ? 'True' : 'False';
    
    if (!failure_type) {
      return res.status(400).json({
        success: false,
        error: 'failure_type is required',
        timestamp: new Date().toISOString()
      });
    }
    
    // Execute Python intelligent ops agent
    const pythonScript = `
import sys
sys.path.append('.')
from intelligent_ops_agent import IntelligentOpsAgent
import json

agent = IntelligentOpsAgent()
response = agent.generate_comprehensive_response(
    failure_type="${failure_type}",
    aircraft_type="${aircraft_type}",
    flight_number="${flight_number}",
    diversion_required=${pythonDiversionRequired}
)
print(json.dumps(response, indent=2))
`;
    
    const process = spawn('python3', ['-c', pythonScript]);
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        try {
          const jsonMatch = stdout.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const response = JSON.parse(jsonMatch[0]);
            res.json({
              success: true,
              data: response,
              timestamp: new Date().toISOString()
            });
          } else {
            res.status(500).json({
              success: false,
              error: 'No valid JSON response from ops agent',
              timestamp: new Date().toISOString()
            });
          }
        } catch (e) {
          res.status(500).json({
            success: false,
            error: `Failed to parse response: ${e}`,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        res.status(500).json({
          success: false,
          error: `Ops agent process failed: ${stderr}`,
          timestamp: new Date().toISOString()
        });
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get active operational scenarios
 */
router.get('/active-scenarios', async (req, res) => {
  try {
    const pythonScript = `
import sys
sys.path.append('.')
from intelligent_ops_agent import IntelligentOpsAgent
import json

agent = IntelligentOpsAgent()
# Note: This is a simplified version since we can't persist agent state between calls
# In a real implementation, you'd use Redis or database for state management
active = {
    "total_active": 0,
    "scenarios": [],
    "last_updated": agent.initialization_time,
    "note": "State not persisted between API calls"
}
print(json.dumps(active, indent=2))
`;
    
    const process = spawn('python3', ['-c', pythonScript]);
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        try {
          const jsonMatch = stdout.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const response = JSON.parse(jsonMatch[0]);
            res.json({
              success: true,
              data: response,
              timestamp: new Date().toISOString()
            });
          } else {
            res.json({
              success: true,
              data: { total_active: 0, scenarios: [] },
              timestamp: new Date().toISOString()
            });
          }
        } catch (e) {
          res.status(500).json({
            success: false,
            error: `Failed to parse response: ${e}`,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        res.status(500).json({
          success: false,
          error: `Process failed: ${stderr}`,
          timestamp: new Date().toISOString()
        });
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get available failure types
 */
router.get('/failure-types', (req, res) => {
  const failureTypes = [
    {
      type: 'engine_failure',
      name: 'Engine Failure',
      description: 'Single or multiple engine failure requiring immediate response',
      severity_range: ['MEDIUM', 'HIGH', 'CRITICAL'],
      typical_actions: 6
    },
    {
      type: 'decompression',
      name: 'Cabin Decompression', 
      description: 'Loss of cabin pressurization requiring emergency descent',
      severity_range: ['HIGH', 'CRITICAL'],
      typical_actions: 6
    },
    {
      type: 'hydraulic_failure',
      name: 'Hydraulic System Failure',
      description: 'Hydraulic system malfunction affecting flight controls',
      severity_range: ['LOW', 'MEDIUM', 'HIGH'],
      typical_actions: 6
    },
    {
      type: 'single_engine_landing',
      name: 'Single Engine Landing',
      description: 'Approach and landing procedures with one engine inoperative',
      severity_range: ['HIGH', 'CRITICAL'],
      typical_actions: 4
    }
  ];
  
  res.json({
    success: true,
    data: {
      failure_types: failureTypes,
      total_types: failureTypes.length
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Get supported aircraft types
 */
router.get('/aircraft-types', (req, res) => {
  const aircraftTypes = [
    {
      type: 'A330-300',
      name: 'Airbus A330-300',
      fleet_code: 'A333',
      digital_twin_available: true,
      failure_profiles: ['engine_failure', 'hydraulic_failure', 'decompression', 'single_engine_landing']
    },
    {
      type: 'A350-1000',
      name: 'Airbus A350-1000',
      fleet_code: 'A35K', 
      digital_twin_available: true,
      failure_profiles: ['engine_failure', 'hydraulic_failure', 'decompression', 'single_engine_landing']
    },
    {
      type: 'B787-9',
      name: 'Boeing 787-9',
      fleet_code: 'B789',
      digital_twin_available: true,
      failure_profiles: ['engine_failure', 'hydraulic_failure', 'decompression', 'single_engine_landing']
    },
    {
      type: 'A330-900',
      name: 'Airbus A330-900neo',
      fleet_code: 'A339',
      digital_twin_available: true,
      failure_profiles: ['engine_failure', 'hydraulic_failure', 'decompression', 'single_engine_landing']
    }
  ];
  
  res.json({
    success: true,
    data: {
      aircraft_types: aircraftTypes,
      total_types: aircraftTypes.length,
      digital_twin_coverage: '100%'
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Quick demo endpoint for testing
 */
router.get('/demo/:failure_type/:aircraft_type', async (req, res) => {
  try {
    const { failure_type, aircraft_type } = req.params;
    const flight_number = `VS${Math.floor(Math.random() * 999) + 1}`;
    
    const pythonScript = `
import sys
sys.path.append('.')
from intelligent_ops_agent import IntelligentOpsAgent
import json

agent = IntelligentOpsAgent()
response = agent.generate_comprehensive_response(
    failure_type="${failure_type}",
    aircraft_type="${aircraft_type}",
    flight_number="${flight_number}",
    diversion_required=True
)

# Create demo summary
demo_data = {
    "demo_scenario": {
        "failure_type": "${failure_type}",
        "aircraft_type": "${aircraft_type}", 
        "flight_number": "${flight_number}"
    },
    "response_summary": response["response_summary"],
    "operational_actions_count": response["operational_actions"]["total_actions"],
    "diversion_recommended": response["diversion_analysis"]["analysis"]["best_alternate"]["name"] if response["diversion_analysis"] and "analysis" in response["diversion_analysis"] and "best_alternate" in response["diversion_analysis"]["analysis"] and response["diversion_analysis"]["analysis"]["best_alternate"] else "None",
    "next_steps": response["next_steps"][:3],
    "scenario_id": response["response_id"]
}

print(json.dumps(demo_data, indent=2))
`;
    
    const process = spawn('python3', ['-c', pythonScript]);
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        try {
          const jsonMatch = stdout.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const response = JSON.parse(jsonMatch[0]);
            res.json({
              success: true,
              data: response,
              timestamp: new Date().toISOString()
            });
          } else {
            res.status(500).json({
              success: false,
              error: 'No valid JSON response from demo',
              timestamp: new Date().toISOString()
            });
          }
        } catch (e) {
          res.status(500).json({
            success: false,
            error: `Failed to parse demo response: ${e}`,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        res.status(500).json({
          success: false,
          error: `Demo process failed: ${stderr}`,
          timestamp: new Date().toISOString()
        });
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      service: 'Intelligent Operations Agent',
      status: 'operational',
      features: [
        'Comprehensive operational response',
        'Post-failure actions coordination',
        'Intelligent diversion planning',
        'Enhanced scenario simulation',
        'Multi-aircraft support'
      ],
      supported_failures: ['engine_failure', 'decompression', 'hydraulic_failure', 'single_engine_landing'],
      supported_aircraft: ['A330-300', 'A350-1000', 'B787-9', 'A330-900']
    },
    timestamp: new Date().toISOString()
  });
});

export default router;