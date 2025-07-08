import { Router } from 'express';
import { adsbExchangeService } from './adsbExchangeService.js';

const router = Router();

// Get all flights in UK area
router.get('/uk-flights', async (req, res) => {
  try {
    const flights = await adsbExchangeService.getUKFlights();
    res.json({
      success: true,
      flights,
      count: flights.length,
      data_source: 'ADS-B Exchange',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      data_source: 'ADS-B Exchange'
    });
  }
});

// Get Virgin Atlantic flights specifically
router.get('/virgin-atlantic', async (req, res) => {
  try {
    const flights = await adsbExchangeService.getVirginAtlanticFlights();
    res.json({
      success: true,
      flights,
      count: flights.length,
      data_source: 'ADS-B Exchange',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      data_source: 'ADS-B Exchange'
    });
  }
});

// Get flights around specific position
router.get('/position/:lat/:lon/:distance', async (req, res) => {
  try {
    const lat = parseFloat(req.params.lat);
    const lon = parseFloat(req.params.lon);
    const distance = parseInt(req.params.distance);
    
    if (isNaN(lat) || isNaN(lon) || isNaN(distance)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates or distance parameters'
      });
    }

    const flights = await adsbExchangeService.getFlightsAroundPosition(lat, lon, distance);
    res.json({
      success: true,
      flights,
      count: flights.length,
      data_source: 'ADS-B Exchange',
      search_parameters: { lat, lon, distance_nm: distance },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      data_source: 'ADS-B Exchange'
    });
  }
});

// Get flight statistics
router.get('/statistics', async (req, res) => {
  try {
    const stats = await adsbExchangeService.getFlightStatistics();
    res.json({
      success: true,
      statistics: stats,
      data_source: 'ADS-B Exchange'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      data_source: 'ADS-B Exchange'
    });
  }
});

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const health = await adsbExchangeService.healthCheck();
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 206 : 500;
    
    res.status(statusCode).json({
      success: health.status === 'healthy',
      health,
      data_source: 'ADS-B Exchange'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      data_source: 'ADS-B Exchange'
    });
  }
});

// Test connection endpoint
router.get('/test-connection', async (req, res) => {
  try {
    const health = await adsbExchangeService.healthCheck();
    const testFlights = await adsbExchangeService.getFlightsAroundPosition(51.4706, -0.4619, 50);
    
    res.json({
      success: true,
      connection_test: {
        api_status: health.status,
        api_key_configured: health.api_key_configured,
        test_flights_found: testFlights.length,
        test_area: 'London, UK (50nm radius)',
        timestamp: new Date().toISOString()
      },
      data_source: 'ADS-B Exchange'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      data_source: 'ADS-B Exchange'
    });
  }
});

export default router;