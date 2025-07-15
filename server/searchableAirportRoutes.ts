import { Router } from 'express';
import { globalAirportService } from './globalAirportService';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();

// Fallback search function using raw CSV data
function searchAirportsFromCSV(query: string, limit: number = 50): any[] {
  try {
    const csvPath = path.join(process.cwd(), 'data', 'global_airports_database.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    
    const results: any[] = [];
    const searchTerm = query.toLowerCase().trim();
    
    for (let i = 1; i < lines.length && results.length < limit; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',').map(v => v.replace(/"/g, ''));
      if (values.length < 14) continue;
      
      const airport = {
        name: values[3] || '',
        icao: values[12] || '',
        iata: values[13] || '',
        city: values[10] || '',
        country: values[8] || '',
        continent: values[7] || '',
        type: values[2] || '',
        latitude: parseFloat(values[4]) || 0,
        longitude: parseFloat(values[5]) || 0,
        elevation: parseFloat(values[6]) || 0,
        scheduled_service: values[11] === 'yes'
      };
      
      // Check if search term matches any field
      const matches = (
        airport.icao.toLowerCase().includes(searchTerm) ||
        airport.iata.toLowerCase().includes(searchTerm) ||
        airport.name.toLowerCase().includes(searchTerm) ||
        airport.city.toLowerCase().includes(searchTerm) ||
        airport.country.toLowerCase().includes(searchTerm)
      );
      
      if (matches) {
        results.push(airport);
      }
    }
    
    return results;
  } catch (error) {
    console.error('CSV search error:', error);
    return [];
  }
}

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
    
    let results: any[] = [];
    let searchSource = 'unknown';
    
    // Try global airport service first
    if (globalAirportService.isLoaded()) {
      const serviceResults = globalAirportService.textSearch(query, limit);
      results = serviceResults.map(airport => ({
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
      searchSource = 'service';
    } else {
      // Fallback to direct CSV search
      console.log('Service not loaded, using CSV fallback for:', query);
      results = searchAirportsFromCSV(query, limit);
      searchSource = 'csv';
    }
    
    console.log(`Airport search for "${query}" returned ${results.length} results from ${searchSource}`);
    
    res.json({
      success: true,
      results: results,
      total: results.length,
      query: query.trim(),
      limit,
      searchTerm: query.trim(),
      source: searchSource
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