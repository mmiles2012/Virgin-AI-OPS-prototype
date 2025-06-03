import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { FlightSimulationEngine } from "./flightSimulation";
import { ScenarioEngine } from "./scenarioEngine";
import { boeing787Specs, FlightEnvelope } from "../client/src/lib/boeing787Specs";
import { scenarios, medicalEmergencies } from "../client/src/lib/medicalProtocols";
import { airports, findNearestAirports } from "../client/src/lib/airportData";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize simulation engines without WebSocket server to avoid conflicts
  const flightSim = new FlightSimulationEngine();
  const scenarioEngine = new ScenarioEngine();

  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3440.065; // Earth's radius in nautical miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Update simulation engines periodically
  setInterval(() => {
    flightSim.update();
    scenarioEngine.update();
  }, 2000);

  // Flight simulation endpoints
  app.get("/api/flight/state", (req, res) => {
    res.json(flightSim.getFlightState());
  });

  app.post("/api/flight/controls", (req, res) => {
    const { throttle, pitch, roll, yaw, autopilot } = req.body;
    
    try {
      flightSim.updateControls({
        throttle: Number(throttle) || 0,
        pitch: Number(pitch) || 0,
        roll: Number(roll) || 0,
        yaw: Number(yaw) || 0,
        autopilot: Boolean(autopilot)
      });
      
      res.json({ success: true, state: flightSim.getFlightState() });
    } catch (error) {
      res.status(400).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Invalid control input" 
      });
    }
  });

  app.post("/api/flight/emergency", (req, res) => {
    const { type, details } = req.body;
    
    if (!type) {
      return res.status(400).json({ error: "Emergency type required" });
    }

    try {
      flightSim.declareEmergency(type, details);
      res.json({ 
        success: true, 
        emergency: true,
        state: flightSim.getFlightState()
      });
    } catch (error) {
      res.status(400).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Emergency declaration failed" 
      });
    }
  });

  app.get("/api/flight/performance", (req, res) => {
    const state = flightSim.getFlightState();
    const { weight } = state;
    const altitude = state.position.altitude;
    
    const performance = {
      vSpeeds: FlightEnvelope.getVSpeeds(weight),
      performanceLimits: FlightEnvelope.getPerformanceLimits(altitude, 15), // Assume 15°C
      fuelConsumption: FlightEnvelope.calculateFuelConsumption(altitude, state.airspeed, weight, 'cruise'),
      glidePerformance: FlightEnvelope.getGlidePerformance(altitude, weight),
      diversionCapabilities: FlightEnvelope.getDiversionCapabilities(weight, state.fuelRemaining)
    };
    
    res.json(performance);
  });

  // Airport and navigation endpoints
  app.get("/api/airports", (req, res) => {
    res.json(airports);
  });

  app.get("/api/airports/nearest", (req, res) => {
    const { lat, lon, count = 5 } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ error: "Latitude and longitude required" });
    }

    try {
      const nearest = findNearestAirports(
        Number(lat), 
        Number(lon), 
        Number(count)
      );
      res.json(nearest);
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : "Invalid coordinates" 
      });
    }
  });

  app.get("/api/airports/medical", (req, res) => {
    const medicalAirports = airports.filter(airport => 
      airport.medicalFacilities && airport.emergencyServices.medical
    );
    res.json(medicalAirports);
  });

  // Training scenario endpoints
  app.get("/api/scenarios", (req, res) => {
    res.json(scenarios);
  });

  app.get("/api/scenarios/:id", (req, res) => {
    const scenario = scenarios.find(s => s.id === req.params.id);
    if (!scenario) {
      return res.status(404).json({ error: "Scenario not found" });
    }
    res.json(scenario);
  });

  app.post("/api/scenarios/:id/start", (req, res) => {
    const scenario = scenarios.find(s => s.id === req.params.id);
    if (!scenario) {
      return res.status(404).json({ error: "Scenario not found" });
    }

    try {
      scenarioEngine.startScenario(req.params.id);
      res.json({ 
        success: true, 
        scenario: scenario,
        state: scenarioEngine.getScenarioState() 
      });
    } catch (error) {
      res.status(400).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to start scenario" 
      });
    }
  });

  app.post("/api/scenarios/stop", (req, res) => {
    try {
      scenarioEngine.stopScenario();
      res.json({ success: true, active: false });
    } catch (error) {
      res.status(400).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to stop scenario" 
      });
    }
  });

  app.get("/api/scenarios/state", (req, res) => {
    res.json(scenarioEngine.getScenarioState());
  });

  app.post("/api/scenarios/decision", (req, res) => {
    const { decisionId, optionId, source = 'unknown' } = req.body;
    
    if (!decisionId || !optionId) {
      return res.status(400).json({ error: "Decision ID and option ID required" });
    }

    try {
      const result = scenarioEngine.makeDecision(decisionId, optionId, source);
      res.json({ 
        success: true, 
        result,
        state: scenarioEngine.getScenarioState() 
      });
    } catch (error) {
      res.status(400).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Invalid decision" 
      });
    }
  });

  // Medical emergency endpoints
  app.get("/api/medical/emergencies", (req, res) => {
    res.json(medicalEmergencies);
  });

  app.get("/api/medical/protocols/:type", (req, res) => {
    const emergency = medicalEmergencies.find(e => 
      e.type.toLowerCase().replace(/\s+/g, '-') === req.params.type
    );
    
    if (!emergency) {
      return res.status(404).json({ error: "Medical emergency type not found" });
    }
    
    res.json(emergency);
  });

  // Aircraft specifications endpoint
  app.get("/api/aircraft/specs", (req, res) => {
    res.json(boeing787Specs);
  });

  // Diversion analysis endpoint
  app.post("/api/flight/diversion/analyze", (req, res) => {
    const { currentPosition, emergencyType, fuelRemaining, weight } = req.body;
    
    if (!currentPosition || !currentPosition.lat || !currentPosition.lon) {
      return res.status(400).json({ error: "Current position required" });
    }

    try {
      const nearestAirports = findNearestAirports(
        currentPosition.lat, 
        currentPosition.lon, 
        10
      );

      // Filter by Boeing 787 capabilities
      const suitableAirports = nearestAirports.filter(airport => 
        airport.runwayLength >= boeing787Specs.operationalLimits.minRunwayLength &&
        airport.fuelAvailable
      );

      // Calculate diversion costs and times
      const diversionOptions = suitableAirports.map(airport => {
        // Calculate distance using Haversine formula
        const distance = calculateDistance(currentPosition.lat, currentPosition.lon, airport.lat, airport.lon);
        const flightTime = distance / (boeing787Specs.performance.typicalCruiseSpeed * 661.47); // Convert Mach to nm/h
        const fuelRequired = FlightEnvelope.calculateFuelConsumption(35000, 0.85, weight || 200000, 'cruise') * flightTime;
        
        return {
          ...airport,
          flightTime: flightTime * 60, // Convert to minutes
          fuelRequired,
          fuelSufficient: fuelRequired < (fuelRemaining || 100000),
          medicalPriority: emergencyType === 'medical' ? airport.medicalFacilities : true,
          estimatedCost: calculateDiversionCost(distance, flightTime, emergencyType)
        };
      });

      // Sort by suitability score
      const scoredOptions = diversionOptions.map(option => ({
        ...option,
        suitabilityScore: calculateSuitabilityScore(option, emergencyType)
      })).sort((a, b) => b.suitabilityScore - a.suitabilityScore);

      res.json({
        currentPosition,
        emergencyType,
        totalOptions: scoredOptions.length,
        recommendedOptions: scoredOptions.slice(0, 5),
        allOptions: scoredOptions
      });
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Diversion analysis failed" 
      });
    }
  });

  function calculateDiversionCost(distance: number, flightTime: number, emergencyType?: string): number {
    const fuelCost = distance * 2.5 * 5.5; // Distance * fuel burn rate * fuel price per kg
    const timeCost = flightTime * 1500; // Flight time * hourly operational cost
    const passengerCost = emergencyType === 'medical' ? 50000 : 25000; // Compensation estimates
    const landingFees = 2000; // Approximate international landing fees
    
    return fuelCost + timeCost + passengerCost + landingFees;
  }

  function calculateSuitabilityScore(airport: any, emergencyType?: string): number {
    let score = 100;
    
    // Distance factor (closer is better)
    score -= (airport.distance / 10); // Reduce score by distance/10
    
    // Medical facilities (critical for medical emergencies)
    if (emergencyType === 'medical') {
      score += airport.medicalFacilities ? 50 : -30;
    }
    
    // Runway length factor
    if (airport.runwayLength >= 12000) score += 20;
    else if (airport.runwayLength >= 10000) score += 10;
    
    // 24/7 operations
    if (airport.operatingHours === '24/7') score += 15;
    
    // Emergency services
    if (airport.emergencyServices.fireRescue) score += 10;
    if (airport.emergencyServices.medical) score += 15;
    
    // Fuel availability
    if (airport.fuelAvailable) score += 10;
    
    // Maintenance capability
    if (airport.maintenanceCapability) score += 5;
    
    return Math.max(0, score);
  }

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "operational",
      simulation: {
        active: flightSim.isActive(),
        clients: clients.size
      },
      scenario: {
        active: scenarioEngine.isActive(),
        current: scenarioEngine.getCurrentScenario()?.id || null
      },
      timestamp: new Date().toISOString()
    });
  });

  return httpServer;
}

