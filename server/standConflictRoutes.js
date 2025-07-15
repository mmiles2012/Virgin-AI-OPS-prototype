import express from 'express';
import standConflictService from './standConflictService.js';
import heathrowGateService from './heathrowGateService.js';

const router = express.Router();

// Get stand conflicts for all flights
router.get('/conflicts', async (req, res) => {
  try {
    // Get flight data from the request or use a default endpoint
    const flightResponse = await fetch(`${req.protocol}://${req.get('host')}/api/aviation/virgin-atlantic-flights`);
    const flightData = await flightResponse.json();
    
    if (!flightData.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch flight data',
        conflicts: []
      });
    }

    const conflicts = await standConflictService.getStandConflicts(flightData.flights);
    const statistics = standConflictService.getConflictStatistics(conflicts);

    res.json({
      success: true,
      conflicts,
      statistics,
      timestamp: new Date().toISOString(),
      total_flights: flightData.flights.length
    });
  } catch (error) {
    console.error('Error fetching stand conflicts:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      conflicts: []
    });
  }
});

// Get conflict statistics only
router.get('/statistics', async (req, res) => {
  try {
    const flightResponse = await fetch(`${req.protocol}://${req.get('host')}/api/aviation/virgin-atlantic-flights`);
    const flightData = await flightResponse.json();
    
    if (!flightData.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch flight data',
        statistics: {}
      });
    }

    const conflicts = await standConflictService.getStandConflicts(flightData.flights);
    const statistics = standConflictService.getConflictStatistics(conflicts);

    res.json({
      success: true,
      statistics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching stand conflict statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      statistics: {}
    });
  }
});

// Get conflicts for a specific flight
router.get('/flight/:flightNumber', async (req, res) => {
  try {
    const { flightNumber } = req.params;
    
    const flightResponse = await fetch(`${req.protocol}://${req.get('host')}/api/aviation/virgin-atlantic-flights`);
    const flightData = await flightResponse.json();
    
    if (!flightData.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch flight data',
        conflict: null
      });
    }

    const conflicts = await standConflictService.getStandConflicts(flightData.flights);
    const conflict = conflicts.find(c => c.flightNumber === flightNumber);

    if (!conflict) {
      return res.status(404).json({
        success: false,
        error: 'Flight not found',
        conflict: null
      });
    }

    res.json({
      success: true,
      conflict,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching flight conflict:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      conflict: null
    });
  }
});

// Generate alerts for critical conflicts
router.get('/alerts', async (req, res) => {
  try {
    const flightResponse = await fetch(`${req.protocol}://${req.get('host')}/api/aviation/virgin-atlantic-flights`);
    const flightData = await flightResponse.json();
    
    if (!flightData.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch flight data',
        alerts: []
      });
    }

    const conflicts = await standConflictService.getStandConflicts(flightData.flights);
    const alerts = conflicts
      .filter(c => c.conflictType !== 'NONE')
      .map(c => standConflictService.generateStandConflictAlert(c))
      .filter(alert => alert !== null);

    res.json({
      success: true,
      alerts,
      alert_count: alerts.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating stand conflict alerts:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      alerts: []
    });
  }
});

// Clear cache
router.post('/clear-cache', (req, res) => {
  try {
    standConflictService.clearCache();
    res.json({
      success: true,
      message: 'Stand conflict cache cleared',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get authentic gate assignments for all Virgin Atlantic gates
router.get('/gates', (req, res) => {
  try {
    const gateAssignments = heathrowGateService.getAllGateAssignments();
    
    res.json({
      success: true,
      gate_assignments: gateAssignments,
      terminal: 'T3',
      airline: 'Virgin Atlantic',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching gate assignments:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      gate_assignments: null
    });
  }
});

// Clear gate assignment cache
router.post('/clear-gate-cache', (req, res) => {
  try {
    heathrowGateService.clearCache();
    res.json({
      success: true,
      message: 'Gate assignment cache cleared',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing gate cache:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Stand Conflict Detection Service',
    status: 'operational',
    gate_service: 'Heathrow Authentic Gate Service',
    timestamp: new Date().toISOString()
  });
});

export default router;