import { Router } from 'express';
import { globalAirportService } from './globalAirportService';

const router = Router();

// Text search endpoint
router.get('/search', (req, res) => {
  try {
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 50;
    
    if (!query || query.trim() === '') {
      return res.json({
        success: true,
        results: [],
        total: 0,
        message: 'Please provide a search query'
      });
    }
    
    // Check if service is loaded
    if (!globalAirportService.isLoaded()) {
      return res.json({
        success: false,
        error: 'Airport database not loaded yet',
        results: [],
        total: 0
      });
    }
    
    const results = globalAirportService.textSearch(query, limit);
    console.log(`Airport search for "${query}" returned ${results.length} results`);
    
    // Format results for frontend compatibility
    const formattedResults = results.map(airport => ({
      name: airport.name,
      icao: airport.icao_code || '',
      iata: airport.iata_code || '',
      city: airport.municipality || '',
      country: airport.iso_country || '',
      continent: airport.continent || '',
      type: airport.type || '',
      latitude: airport.latitude_deg || 0,
      longitude: airport.longitude_deg || 0,
      elevation: airport.elevation_ft || 0,
      scheduled_service: airport.scheduled_service === 'yes'
    }));
    
    res.json({
      success: true,
      results: formattedResults,
      total: formattedResults.length,
      query: query.trim(),
      limit,
      searchTerm: query.trim()
    });
  } catch (error) {
    console.error('Airport search error:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed'
    });
  }
});

// Autocomplete suggestions endpoint
router.get('/suggestions', (req, res) => {
  try {
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (!query || query.trim() === '') {
      return res.json({
        success: true,
        suggestions: []
      });
    }
    
    const suggestions = globalAirportService.getAirportSuggestions(query, limit);
    
    res.json({
      success: true,
      suggestions,
      query: query.trim()
    });
  } catch (error) {
    console.error('Airport suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Suggestions failed'
    });
  }
});

// Advanced search with filters
router.post('/advanced-search', (req, res) => {
  try {
    const { query, filters = {}, limit = 50 } = req.body;
    
    // Convert filters to proper format
    const airportFilter = {
      country: filters.country,
      continent: filters.continent,
      type: filters.types,
      scheduledService: filters.scheduledService,
      hasICAO: filters.hasICAO,
      hasIATA: filters.hasIATA,
      region: filters.region,
      nearPoint: filters.nearPoint
    };
    
    const results = globalAirportService.searchAirports(airportFilter, limit);
    
    // Apply text search if query provided
    let finalResults = results;
    if (query && query.trim()) {
      const searchTerm = query.toLowerCase().trim();
      finalResults = results.filter(airport => 
        (airport.icao_code && airport.icao_code.toLowerCase().includes(searchTerm)) ||
        (airport.iata_code && airport.iata_code.toLowerCase().includes(searchTerm)) ||
        (airport.name && airport.name.toLowerCase().includes(searchTerm)) ||
        (airport.municipality && airport.municipality.toLowerCase().includes(searchTerm))
      );
    }
    
    res.json({
      success: true,
      results: finalResults,
      total: finalResults.length,
      query: query || '',
      filters: airportFilter,
      limit
    });
  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({
      success: false,
      error: 'Advanced search failed'
    });
  }
});

// Get filter options
router.get('/filters', (req, res) => {
  try {
    const countries = globalAirportService.getCountries();
    const continents = globalAirportService.getContinents();
    const types = globalAirportService.getAirportTypes();
    const regions = globalAirportService.getRegions();
    
    res.json({
      success: true,
      filters: {
        countries,
        continents,
        types,
        regions
      }
    });
  } catch (error) {
    console.error('Filter options error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get filter options'
    });
  }
});

// Get airport by ICAO code
router.get('/icao/:code', (req, res) => {
  try {
    const icao = req.params.code.toUpperCase();
    const airport = globalAirportService.getAirportByICAO(icao);
    
    if (!airport) {
      return res.status(404).json({
        success: false,
        error: `Airport with ICAO code ${icao} not found`
      });
    }
    
    res.json({
      success: true,
      airport
    });
  } catch (error) {
    console.error('ICAO lookup error:', error);
    res.status(500).json({
      success: false,
      error: 'ICAO lookup failed'
    });
  }
});

// Get airport by IATA code
router.get('/iata/:code', (req, res) => {
  try {
    const iata = req.params.code.toUpperCase();
    const airport = globalAirportService.getAirportByIATA(iata);
    
    if (!airport) {
      return res.status(404).json({
        success: false,
        error: `Airport with IATA code ${iata} not found`
      });
    }
    
    res.json({
      success: true,
      airport
    });
  } catch (error) {
    console.error('IATA lookup error:', error);
    res.status(500).json({
      success: false,
      error: 'IATA lookup failed'
    });
  }
});

// Get nearby airports
router.get('/nearby', (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    const radius = parseInt(req.query.radius as string) || 100;
    const limit = parseInt(req.query.limit as string) || 50;
    
    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({
        success: false,
        error: 'Valid latitude and longitude required'
      });
    }
    
    const results = globalAirportService.getAirportsNearLocation(lat, lon, radius);
    
    res.json({
      success: true,
      results: results.slice(0, limit),
      total: results.length,
      center: { lat, lon },
      radius,
      limit
    });
  } catch (error) {
    console.error('Nearby airports error:', error);
    res.status(500).json({
      success: false,
      error: 'Nearby airports search failed'
    });
  }
});

// Get database statistics
router.get('/statistics', (req, res) => {
  try {
    const stats = globalAirportService.getAirportStatistics();
    
    res.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Statistics failed'
    });
  }
});

export default router;