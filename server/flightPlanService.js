// Flight Plan Service for Enroute Diversion Analysis
import fs from 'fs';
import path from 'path';

class FlightPlanService {
  constructor() {
    this.flightPlans = new Map();
    this.uploadDirectory = './uploaded_flight_plans';
    this.ensureUploadDirectory();
  }

  ensureUploadDirectory() {
    if (!fs.existsSync(this.uploadDirectory)) {
      fs.mkdirSync(this.uploadDirectory, { recursive: true });
    }
  }

  // Parse various flight plan formats
  parseFlightPlan(fileContent, filename, format = 'auto') {
    try {
      let parsedPlan = null;
      const fileExt = path.extname(filename).toLowerCase();
      
      // Auto-detect format based on content and extension
      if (format === 'auto') {
        if (fileExt === '.json' || this.isJSON(fileContent)) {
          format = 'json';
        } else if (fileExt === '.xml' || fileContent.includes('<?xml')) {
          format = 'xml';
        } else if (fileContent.includes('FPL') || fileContent.includes('ICAO')) {
          format = 'icao';
        } else {
          format = 'text';
        }
      }

      switch (format) {
        case 'json':
          parsedPlan = this.parseJSONFlightPlan(fileContent);
          break;
        case 'xml':
          parsedPlan = this.parseXMLFlightPlan(fileContent);
          break;
        case 'icao':
          parsedPlan = this.parseICAOFlightPlan(fileContent);
          break;
        case 'text':
        default:
          parsedPlan = this.parseTextFlightPlan(fileContent);
          break;
      }

      if (parsedPlan) {
        parsedPlan.uploadedAt = new Date().toISOString();
        parsedPlan.filename = filename;
        parsedPlan.format = format;
        this.flightPlans.set(parsedPlan.callsign || parsedPlan.flightNumber, parsedPlan);
        
        // Save to disk for persistence
        this.saveFlightPlanToDisk(parsedPlan);
        
        console.log(`✈️ Flight plan parsed successfully: ${parsedPlan.callsign || parsedPlan.flightNumber}`);
        return parsedPlan;
      }
    } catch (error) {
      console.error('Flight plan parsing error:', error);
      throw new Error(`Failed to parse flight plan: ${error.message}`);
    }
  }

  // Parse JSON format flight plans
  parseJSONFlightPlan(content) {
    const data = JSON.parse(content);
    
    return {
      callsign: data.callsign || data.flight_number || data.flightId,
      flightNumber: data.flight_number || data.callsign,
      aircraft: data.aircraft || data.aircraft_type,
      route: data.route,
      departure: data.departure || data.origin,
      destination: data.destination || data.arrival,
      waypoints: data.waypoints || this.extractWaypoints(data.route),
      altitudes: data.altitudes || this.extractAltitudes(data.route),
      coordinates: data.coordinates || [],
      estimatedFlightTime: data.estimatedFlightTime || data.eet,
      fuel: data.fuel || data.fuelPlanned,
      alternates: data.alternates || [],
      routeSegments: this.createRouteSegments(data.waypoints || []),
      originalData: data
    };
  }

  // Parse ICAO flight plan format
  parseICAOFlightPlan(content) {
    const lines = content.split('\n').map(line => line.trim());
    const flightPlan = {};
    
    for (const line of lines) {
      if (line.startsWith('FPL-')) {
        // Extract callsign from FPL line
        const match = line.match(/FPL-([A-Z0-9]+)-/);
        if (match) flightPlan.callsign = match[1];
      } else if (line.includes('ADEP/')) {
        flightPlan.departure = line.split('ADEP/')[1]?.substring(0, 4);
      } else if (line.includes('ADES/')) {
        flightPlan.destination = line.split('ADES/')[1]?.substring(0, 4);
      } else if (line.includes('RTE/')) {
        flightPlan.route = line.split('RTE/')[1];
        flightPlan.waypoints = this.extractWaypoints(flightPlan.route);
      } else if (line.includes('ALT/')) {
        flightPlan.alternates = line.split('ALT/')[1]?.split(' ').filter(Boolean);
      }
    }

    return {
      ...flightPlan,
      flightNumber: flightPlan.callsign,
      routeSegments: this.createRouteSegments(flightPlan.waypoints || []),
      coordinates: this.estimateCoordinates(flightPlan.waypoints || []),
      originalContent: content
    };
  }

  // Parse text format flight plans
  parseTextFlightPlan(content) {
    const lines = content.split('\n').map(line => line.trim()).filter(Boolean);
    const flightPlan = {
      waypoints: [],
      coordinates: [],
      altitudes: []
    };

    for (const line of lines) {
      // Look for callsign patterns
      if (line.match(/^[A-Z]{3}[0-9]+[A-Z]?/)) {
        flightPlan.callsign = line.split(/\s+/)[0];
      }
      
      // Look for route patterns (waypoint sequences)
      if (line.includes(' ') && line.match(/[A-Z]{4,5}/)) {
        const waypoints = line.split(/\s+/).filter(w => w.match(/^[A-Z]{4,5}$/));
        flightPlan.waypoints.push(...waypoints);
      }
      
      // Look for altitude information
      if (line.includes('FL') || line.includes('ALT')) {
        const altMatch = line.match(/FL(\d{3})|ALT(\d{3,5})/);
        if (altMatch) {
          flightPlan.altitudes.push(parseInt(altMatch[1] || altMatch[2]));
        }
      }
    }

    return {
      ...flightPlan,
      flightNumber: flightPlan.callsign,
      routeSegments: this.createRouteSegments(flightPlan.waypoints),
      coordinates: this.estimateCoordinates(flightPlan.waypoints),
      originalContent: content
    };
  }

  // Extract waypoints from route string
  extractWaypoints(routeString) {
    if (!routeString) return [];
    
    // Common waypoint patterns
    const waypoints = routeString
      .split(/[\s\/]+/)
      .filter(item => {
        // Standard 5-letter waypoints
        if (item.match(/^[A-Z]{5}$/)) return true;
        // 4-letter airport codes
        if (item.match(/^[A-Z]{4}$/)) return true;
        // VOR/NDB (3 letters)
        if (item.match(/^[A-Z]{3}$/)) return true;
        return false;
      });
    
    return waypoints;
  }

  // Create route segments with distances and bearings
  createRouteSegments(waypoints) {
    if (!waypoints || waypoints.length < 2) return [];
    
    const segments = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
      const from = waypoints[i];
      const to = waypoints[i + 1];
      
      segments.push({
        from,
        to,
        distance: this.estimateDistance(from, to),
        bearing: this.estimateBearing(from, to),
        segmentIndex: i
      });
    }
    
    return segments;
  }

  // Estimate coordinates for waypoints (simplified)
  estimateCoordinates(waypoints) {
    // This would normally use a navigation database
    // For now, provide estimated coordinates based on common waypoints
    const commonWaypoints = {
      'EGLL': { lat: 51.4700, lon: -0.4543 },
      'KJFK': { lat: 40.6413, lon: -73.7781 },
      'EINN': { lat: 52.7019, lon: -8.9247 },
      'BIKF': { lat: 63.9850, lon: -22.6056 },
      'CYQX': { lat: 48.9369, lon: -54.5681 }
    };
    
    return waypoints.map(wp => ({
      waypoint: wp,
      coordinates: commonWaypoints[wp] || { lat: 0, lon: 0, estimated: true }
    }));
  }

  // Calculate enroute diversion options
  calculateEnrouteDiversions(flightPlan, currentPosition, emergencyType = 'engine_failure') {
    if (!flightPlan || !currentPosition) {
      throw new Error('Flight plan and current position required for diversion analysis');
    }

    const diversions = [];
    const currentSegment = this.findCurrentSegment(flightPlan, currentPosition);
    
    // Analyze available alternates based on position
    const nearbyAlternates = this.findNearbyAlternates(currentPosition, flightPlan.alternates);
    
    for (const alternate of nearbyAlternates) {
      const diversion = this.analyzeDiversionOption(
        flightPlan,
        currentPosition,
        currentSegment,
        alternate,
        emergencyType
      );
      
      if (diversion.feasible) {
        diversions.push(diversion);
      }
    }

    // Sort by suitability score
    return diversions.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
  }

  // Analyze specific diversion option
  analyzeDiversionOption(flightPlan, currentPos, currentSegment, alternate, emergencyType) {
    const distance = this.calculateDistance(currentPos, alternate.coordinates);
    const bearing = this.calculateBearing(currentPos, alternate.coordinates);
    const fuelRequired = this.estimateFuelRequired(distance, flightPlan.aircraft, emergencyType);
    
    return {
      airport: alternate,
      distance: Math.round(distance),
      bearing: Math.round(bearing),
      estimatedFlightTime: Math.round(distance / 400 * 60), // minutes at 400kt
      fuelRequired: Math.round(fuelRequired),
      feasible: fuelRequired < (flightPlan.fuel || 20000),
      suitabilityScore: this.calculateSuitabilityScore(alternate, distance, emergencyType),
      diversionRoute: this.generateDiversionRoute(currentPos, currentSegment, alternate),
      emergencyProcedures: this.getEmergencyProcedures(emergencyType, alternate),
      weatherConsiderations: this.getWeatherConsiderations(alternate),
      operationalFactors: this.getOperationalFactors(alternate, flightPlan.aircraft)
    };
  }

  // Generate diversion route from current position
  generateDiversionRoute(currentPos, currentSegment, alternate) {
    return {
      directRoute: {
        distance: this.calculateDistance(currentPos, alternate.coordinates),
        bearing: this.calculateBearing(currentPos, alternate.coordinates),
        estimatedTime: Math.round(this.calculateDistance(currentPos, alternate.coordinates) / 400 * 60)
      },
      viaWaypoints: this.findOptimalRoute(currentPos, alternate.coordinates),
      altitudeProfile: this.generateAltitudeProfile(currentPos, alternate.coordinates)
    };
  }

  // Save flight plan to disk for persistence
  saveFlightPlanToDisk(flightPlan) {
    const filename = `${flightPlan.callsign || 'unknown'}_${Date.now()}.json`;
    const filepath = path.join(this.uploadDirectory, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(flightPlan, null, 2));
    console.log(`💾 Flight plan saved: ${filepath}`);
  }

  // Get uploaded flight plans
  getUploadedFlightPlans() {
    return Array.from(this.flightPlans.values());
  }

  // Get specific flight plan
  getFlightPlan(callsign) {
    return this.flightPlans.get(callsign);
  }

  // Helper functions
  isJSON(str) {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }

  calculateDistance(pos1, pos2) {
    // Haversine formula for great circle distance
    const R = 3440; // nautical miles
    const lat1 = pos1.lat * Math.PI / 180;
    const lat2 = pos2.lat * Math.PI / 180;
    const deltaLat = (pos2.lat - pos1.lat) * Math.PI / 180;
    const deltaLon = (pos2.lon - pos1.lon) * Math.PI / 180;

    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
    
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  calculateBearing(pos1, pos2) {
    const lat1 = pos1.lat * Math.PI / 180;
    const lat2 = pos2.lat * Math.PI / 180;
    const deltaLon = (pos2.lon - pos1.lon) * Math.PI / 180;

    const bearing = Math.atan2(
      Math.sin(deltaLon) * Math.cos(lat2),
      Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon)
    );

    return (bearing * 180 / Math.PI + 360) % 360;
  }

  findNearbyAlternates(position, plannedAlternates = []) {
    // Common diversion airports for transatlantic flights
    const diversionAirports = [
      { icao: 'EINN', name: 'Shannon', coordinates: { lat: 52.7019, lon: -8.9247 }, country: 'Ireland' },
      { icao: 'BIKF', name: 'Keflavik', coordinates: { lat: 63.9850, lon: -22.6056 }, country: 'Iceland' },
      { icao: 'CYQX', name: 'Gander', coordinates: { lat: 48.9369, lon: -54.5681 }, country: 'Canada' },
      { icao: 'LPAZ', name: 'Azores', coordinates: { lat: 37.7411, lon: -25.6978 }, country: 'Portugal' },
      { icao: 'BGTL', name: 'Thule AB', coordinates: { lat: 76.5319, lon: -68.7031 }, country: 'Greenland' }
    ];

    return diversionAirports
      .map(airport => ({
        ...airport,
        distance: this.calculateDistance(position, airport.coordinates)
      }))
      .filter(airport => airport.distance < 1000) // Within 1000nm
      .sort((a, b) => a.distance - b.distance);
  }

  calculateSuitabilityScore(alternate, distance, emergencyType) {
    let score = 100;
    
    // Distance penalty
    score -= distance * 0.1;
    
    // Airport capabilities bonus/penalty
    if (alternate.icao === 'EINN') score += 20; // Shannon - excellent facilities
    if (alternate.icao === 'BIKF') score += 15; // Keflavik - good facilities
    if (alternate.icao === 'CYQX') score += 10; // Gander - adequate facilities
    
    // Emergency type considerations
    if (emergencyType === 'medical' && alternate.icao === 'EINN') score += 10;
    if (emergencyType === 'engine_failure' && distance < 500) score += 15;
    
    return Math.max(0, Math.min(100, score));
  }

  estimateFuelRequired(distance, aircraftType, emergencyType) {
    // Basic fuel consumption rates (kg/nm)
    const consumptionRates = {
      'A350': 8.5,
      'B787': 7.8,
      'A330': 9.2
    };
    
    const baseRate = consumptionRates[aircraftType] || 8.0;
    let multiplier = 1.0;
    
    // Emergency penalties
    if (emergencyType === 'engine_failure') multiplier = 1.3;
    if (emergencyType === 'decompression') multiplier = 1.4;
    
    return distance * baseRate * multiplier + 2000; // + reserve
  }

  getEmergencyProcedures(emergencyType, alternate) {
    const procedures = {
      engine_failure: [
        'Declare PAN PAN or MAYDAY as appropriate',
        'Request priority handling and direct routing',
        'Configure for single engine approach',
        'Brief cabin crew on emergency landing procedures'
      ],
      medical: [
        'Request medical priority',
        'Coordinate with medical services at destination',
        'Prepare for expedited ground handling',
        'Consider passenger medical assistance requirements'
      ],
      decompression: [
        'Emergency descent to safe altitude',
        'Don oxygen masks',
        'Declare emergency',
        'Request immediate clearance to alternate'
      ]
    };
    
    return procedures[emergencyType] || ['Follow standard emergency procedures'];
  }

  getWeatherConsiderations(alternate) {
    // This would integrate with real weather services
    return {
      currentConditions: 'CAVOK (estimated)',
      forecast: 'Conditions suitable for approach',
      alternateMinima: 'CAT I ILS available',
      windLimitations: 'Within aircraft limits'
    };
  }

  getOperationalFactors(alternate, aircraftType) {
    return {
      runwayLength: alternate.icao === 'EINN' ? '3200m' : '2500m+',
      fireCategory: alternate.icao === 'EINN' ? 'CAT 9' : 'CAT 7+',
      fuelAvailable: true,
      maintenanceSupport: alternate.icao === 'EINN' ? 'Full' : 'Limited',
      passengerFacilities: alternate.icao === 'EINN' ? 'Excellent' : 'Adequate'
    };
  }

  generateAltitudeProfile(currentPos, targetPos) {
    return {
      initialAltitude: 37000,
      cruiseAltitude: 37000,
      descentPoint: '50nm from destination',
      approachAltitude: 3000
    };
  }

  findOptimalRoute(currentPos, targetPos) {
    return {
      waypoints: ['DIRECT'],
      estimatedTime: Math.round(this.calculateDistance(currentPos, targetPos) / 400 * 60),
      fuelBurn: this.estimateFuelRequired(this.calculateDistance(currentPos, targetPos), 'A350', 'normal')
    };
  }

  findCurrentSegment(flightPlan, currentPosition) {
    // Simplified - find closest route segment
    if (!flightPlan.routeSegments || flightPlan.routeSegments.length === 0) {
      return null;
    }
    
    return {
      segmentIndex: 0,
      from: flightPlan.waypoints[0],
      to: flightPlan.waypoints[1],
      progress: 0.5
    };
  }

  estimateDistance(wp1, wp2) {
    // Simplified distance estimation
    return Math.random() * 500 + 100; // 100-600nm
  }

  estimateBearing(wp1, wp2) {
    return Math.random() * 360;
  }

  extractAltitudes(routeString) {
    if (!routeString) return [];
    
    const altitudes = [];
    const flMatches = routeString.match(/FL(\d{3})/g);
    if (flMatches) {
      altitudes.push(...flMatches.map(fl => parseInt(fl.substring(2)) * 100));
    }
    
    return altitudes;
  }
}

export default FlightPlanService;