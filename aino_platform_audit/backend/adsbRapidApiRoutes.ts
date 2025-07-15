import { Router } from 'express';
import { adsbRapidApiService } from './adsbRapidApiService';
import { virginAtlanticService } from './virginAtlanticService';

const router = Router();

// Get all flights in UK region
router.get('/flights/uk', async (req, res) => {
  try {
    const flights = await adsbRapidApiService.getFlightsInRegion(51.5074, -0.1278, 300);
    res.json({
      success: true,
      flights,
      total: flights.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching UK flights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch UK flights',
      flights: [],
      total: 0
    });
  }
});

// Get Virgin Atlantic flights
router.get('/flights/virgin-atlantic', async (req, res) => {
  try {
    const flights = await adsbRapidApiService.getVirginAtlanticFlights();
    res.json({
      success: true,
      flights,
      total: flights.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching Virgin Atlantic flights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Virgin Atlantic flights',
      flights: [],
      total: 0
    });
  }
});

// Get flight by ICAO24 hex code
router.get('/flight/:hex', async (req, res) => {
  try {
    const flight = await adsbRapidApiService.getFlightByHex(req.params.hex);
    if (flight) {
      res.json({
        success: true,
        flight,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Flight not found',
        flight: null
      });
    }
  } catch (error) {
    console.error('Error fetching flight by hex:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch flight',
      flight: null
    });
  }
});

// Get enhanced Virgin Atlantic flights (combines ADS-B data with fleet info)
router.get('/flights/virgin-atlantic/enhanced', async (req, res) => {
  try {
    const adsbFlights = await adsbRapidApiService.getVirginAtlanticFlights();
    const fleetData = await virginAtlanticService.getFleetData();
    
    // Enhance ADS-B data with fleet information
    const enhancedFlights = adsbFlights.map(flight => {
      const fleetInfo = fleetData.find(f => f.registration === flight.registration);
      return {
        ...flight,
        fleet_info: fleetInfo || null,
        route: fleetInfo?.route || 'Unknown',
        departure_airport: fleetInfo?.departure_airport || 'Unknown',
        arrival_airport: fleetInfo?.arrival_airport || 'Unknown',
        status: fleetInfo?.status || 'In Flight'
      };
    });

    // Add simulated flights if no authentic data available
    const simulatedFlights = adsbFlights.length === 0 ? await virginAtlanticService.getSimulatedFlights() : [];
    
    res.json({
      success: true,
      flights: enhancedFlights,
      simulated_flights: simulatedFlights,
      authentic_flight_count: adsbFlights.length,
      simulated_flight_count: simulatedFlights.length,
      total: enhancedFlights.length + simulatedFlights.length,
      authentic_data_percentage: adsbFlights.length > 0 ? 100 : 0,
      data_sources: adsbFlights.length > 0 ? ['ADS-B Exchange (RapidAPI)'] : ['Simulated'],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching enhanced Virgin Atlantic flights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch enhanced flights',
      flights: [],
      authentic_flight_count: 0,
      simulated_flight_count: 0,
      total: 0
    });
  }
});

// Get flight statistics
router.get('/statistics', async (req, res) => {
  try {
    const stats = await adsbRapidApiService.getFlightStatistics();
    res.json({
      success: true,
      statistics: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching flight statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      statistics: null
    });
  }
});

// Health check
router.get('/health', async (req, res) => {
  try {
    const isHealthy = await adsbRapidApiService.healthCheck();
    res.json({
      success: true,
      healthy: isHealthy,
      service: 'ADS-B Exchange (RapidAPI)',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('ADS-B health check error:', error);
    res.status(500).json({
      success: false,
      healthy: false,
      error: 'Health check failed'
    });
  }
});

export { router as adsbRapidApiRoutes };