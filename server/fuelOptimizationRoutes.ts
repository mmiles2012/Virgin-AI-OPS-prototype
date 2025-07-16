import express from 'express';
import { spawn } from 'child_process';

const router = express.Router();

// Fuel optimization endpoints
router.get('/calculate-requirements', async (req, res) => {
  try {
    const { route, aircraft_type, flight_number } = req.query;
    
    const flightData = {
      route: route || 'LHR-JFK',
      aircraft_type: aircraft_type || 'A350-1000',
      flight_number: flight_number || 'VIR3N'
    };
    
    const result = await executeFuelOptimization('--calculate', JSON.stringify(flightData));
    res.json({
      success: true,
      fuel_requirements: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error calculating fuel requirements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate fuel requirements'
    });
  }
});

router.get('/optimize-loading', async (req, res) => {
  try {
    const { route, aircraft_type, flight_number } = req.query;
    
    const flightData = {
      route: route || 'LHR-JFK',
      aircraft_type: aircraft_type || 'A350-1000',
      flight_number: flight_number || 'VIR3N'
    };
    
    const result = await executeFuelOptimization('--optimize', JSON.stringify(flightData));
    res.json({
      success: true,
      optimization_result: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error optimizing fuel loading:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to optimize fuel loading'
    });
  }
});

router.get('/system-status', async (req, res) => {
  try {
    const result = await executeFuelOptimization('--status');
    res.json({
      success: true,
      system_status: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting fuel system status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system status'
    });
  }
});

router.get('/virgin-atlantic-fleet', async (req, res) => {
  try {
    // Get Virgin Atlantic flights from main API
    const flightResponse = await fetch('http://localhost:5000/api/aviation/virgin-atlantic-flights');
    const flightData = await flightResponse.json();
    
    if (!flightData.success || !flightData.flights) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch Virgin Atlantic flights'
      });
    }
    
    // Process each flight through fuel optimization
    const optimizedFlights = [];
    
    for (const flight of flightData.flights) {
      try {
        const fuelData = {
          route: flight.route || `${flight.origin}-${flight.destination}`,
          aircraft_type: flight.aircraft_type || flight.aircraft,
          flight_number: flight.flight_number || flight.callsign
        };
        
        const optimization = await executeFuelOptimization('--optimize', JSON.stringify(fuelData));
        optimizedFlights.push({
          ...flight,
          fuel_optimization: optimization
        });
      } catch (error) {
        console.error(`Error optimizing fuel for flight ${flight.callsign}:`, error);
        // Add flight without optimization data
        optimizedFlights.push({
          ...flight,
          fuel_optimization: null
        });
      }
    }
    
    res.json({
      success: true,
      optimized_flights: optimizedFlights,
      total_flights: optimizedFlights.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing Virgin Atlantic fleet:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process Virgin Atlantic fleet fuel optimization'
    });
  }
});

async function executeFuelOptimization(command: string, data?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const args = ['enhanced_fuel_optimization_system.py', command];
    if (data) {
      args.push(data);
    }
    
    const pythonProcess = spawn('python3', args);
    
    let output = '';
    let error = '';
    
    const timeout = setTimeout(() => {
      pythonProcess.kill();
      reject(new Error('Fuel optimization timeout'));
    }, 10000);
    
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        try {
          // Try to parse JSON output
          const lines = output.trim().split('\n');
          const jsonLine = lines.find(line => line.startsWith('{'));
          if (jsonLine) {
            resolve(JSON.parse(jsonLine));
          } else {
            resolve({ output: output.trim() });
          }
        } catch (parseError) {
          resolve({ output: output.trim() });
        }
      } else {
        reject(new Error(`Python process failed: ${error}`));
      }
    });
  });
}

export default router;