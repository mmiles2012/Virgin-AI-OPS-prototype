/**
 * Enhanced SIGMET API Routes for AINO Aviation Platform
 */

import express from 'express';
import sigmetEnhancedService from './sigmetEnhancedService.js';
import { adsbIntegratedFlightService } from './adsbIntegratedFlightService.js';

const router = express.Router();

/**
 * GET /api/sigmet/current
 * Get current SIGMET data from Aviation Weather Center
 */
router.get('/current', async (req, res) => {
  try {
    const sigmetData = await sigmetEnhancedService.fetchSigmetData();
    
    res.json({
      success: true,
      data: sigmetData,
      count: sigmetData.features?.length || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching SIGMET data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch SIGMET data',
      message: error.message
    });
  }
});

/**
 * GET /api/sigmet/operational-summary
 * Get operational SIGMET summary for operations center
 */
router.get('/operational-summary', async (req, res) => {
  try {
    const summary = await sigmetEnhancedService.getOperationalSummary();
    
    res.json({
      success: true,
      summary: summary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating SIGMET summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate SIGMET summary',
      message: error.message
    });
  }
});

/**
 * POST /api/sigmet/fleet-analysis
 * Analyze Virgin Atlantic fleet for SIGMET exposure
 */
router.post('/fleet-analysis', async (req, res) => {
  try {
    // Get current Virgin Atlantic flights
    const virginAtlanticFlights = await adsbIntegratedFlightService.getEnhancedFlightData();
    
    const analysis = await sigmetEnhancedService.analyzeFleetSigmetExposure(virginAtlanticFlights);
    
    res.json({
      success: true,
      analysis: analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error analyzing fleet SIGMET exposure:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze fleet SIGMET exposure',
      message: error.message
    });
  }
});

/**
 * GET /api/sigmet/flight-check/:callsign
 * Check specific flight for SIGMET exposure
 */
router.get('/flight-check/:callsign', async (req, res) => {
  try {
    const { callsign } = req.params;
    
    // Get specific flight data
    const allFlights = await adsbIntegratedFlightService.getEnhancedFlightData();
    const flight = allFlights.find(f => 
      f.callsign === callsign || f.flight_number === callsign
    );
    
    if (!flight) {
      return res.status(404).json({
        success: false,
        error: 'Flight not found',
        callsign: callsign
      });
    }
    
    if (!flight.latitude || !flight.longitude) {
      return res.json({
        success: true,
        flight: flight,
        sigmet_check: {
          inSigmet: false,
          alerts: [],
          message: 'No position data available'
        }
      });
    }
    
    const sigmetData = await sigmetEnhancedService.fetchSigmetData();
    const sigmetCheck = sigmetEnhancedService.isAircraftInSigmet(
      flight.latitude,
      flight.longitude,
      sigmetData
    );
    
    res.json({
      success: true,
      flight: {
        callsign: flight.callsign,
        flight_number: flight.flight_number,
        route: flight.route,
        position: {
          latitude: flight.latitude,
          longitude: flight.longitude,
          altitude: flight.altitude
        }
      },
      sigmet_check: sigmetCheck,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking flight SIGMET exposure:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check flight SIGMET exposure',
      message: error.message
    });
  }
});

/**
 * GET /api/sigmet/health
 * Health check for SIGMET service
 */
router.get('/health', async (req, res) => {
  try {
    const startTime = Date.now();
    const sigmetData = await sigmetEnhancedService.fetchSigmetData();
    const responseTime = Date.now() - startTime;
    
    res.json({
      success: true,
      service: 'SIGMET Enhanced Service',
      status: 'operational',
      response_time_ms: responseTime,
      active_sigmets: sigmetData.features?.length || 0,
      last_updated: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      service: 'SIGMET Enhanced Service',
      status: 'degraded',
      error: error.message
    });
  }
});

export default router;