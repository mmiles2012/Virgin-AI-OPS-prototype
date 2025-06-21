import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { FlightSimulationEngine } from "./flightSimulation";
import { ScenarioEngine } from "./scenarioEngine";
import { DecisionEngine } from "./decisionEngine";
import { boeing787Specs, FlightEnvelope } from "../client/src/lib/boeing787Specs";
import { scenarios, medicalEmergencies } from "../client/src/lib/medicalProtocols";
import { airports, findNearestAirports } from "../client/src/lib/airportData";
import { majorAirports } from "../shared/airportData";
import { aviationApiService } from "./aviationApiService";
import { newsApiService } from "./newsApiService_simplified";
import { enhancedNewsMonitor } from "./enhancedNewsMonitor";
import { diversionSupport } from "./diversionSupport";
import { sustainableFuelService } from "./sustainableFuelService";
import { openDataSoftService } from "./openDataSoftService";
import { weatherApiService } from "./weatherApiService";
import { delayPredictionService } from "./delayPredictionService";
import { ukCaaDelayService } from "./ukCaaDelayService";
import { tensorflowDelayService } from "./tensorflowIntegration";
import { maintrolService } from "./maintrolIntegration";
import { ukCaaDelayService as ukCaaAIService } from "./ukCaaIntegration";
import { dualModelAIService } from "./dualModelIntegration";
import { flightDataCache } from "./flightDataCache";
import { demoFlightGenerator } from "./demoFlightData";
import { weatherDataCollector } from "./weatherDataCollector";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize simulation engines and decision engine
  const flightSim = new FlightSimulationEngine();
  const scenarioEngine = new ScenarioEngine();
  const decisionEngine = new DecisionEngine(flightSim, scenarioEngine);

  // Mapbox configuration endpoint
  app.get('/api/config/mapbox', (req, res) => {
    try {
      const token = process.env.MAPBOX_ACCESS_TOKEN;
      if (!token) {
        return res.status(404).json({ error: 'Mapbox token not configured' });
      }
      res.json({ token });
    } catch (error) {
      console.error('Error providing Mapbox token:', error);
      res.status(500).json({ error: 'Failed to get Mapbox configuration' });
    }
  });

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

  // Update simulation engines and decision engine periodically
  setInterval(() => {
    flightSim.update();
    scenarioEngine.update();
    
    // Generate new decision context when needed
    decisionEngine.generateDecisionContext();
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

  // Enhanced aviation data endpoints
  app.get("/api/aviation/fuel-estimate", async (req, res) => {
    try {
      const { aircraftType, distance, passengers } = req.query;
      
      if (!aircraftType || !distance) {
        return res.status(400).json({ 
          error: "Aircraft type and distance required" 
        });
      }

      const estimate = aviationApiService.estimateFuelBurn(
        String(aircraftType),
        Number(distance),
        passengers ? Number(passengers) : 150
      );

      res.json(estimate);
    } catch (error) {
      console.error('Fuel estimation error:', error);
      res.status(500).json({ 
        error: "Failed to calculate fuel estimate" 
      });
    }
  });

  app.get("/api/aviation/airport-data/:iata", async (req, res) => {
    try {
      const { iata } = req.params;
      
      if (!iata || iata.length !== 3) {
        return res.status(400).json({ 
          error: "Valid 3-letter IATA code required" 
        });
      }

      const airportData = await aviationApiService.getAirportData(iata);
      res.json(airportData);
    } catch (error) {
      console.error('Airport data error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to fetch airport data" 
      });
    }
  });

  app.get("/api/aviation/operations-summary/:iata", async (req, res) => {
    try {
      const { iata } = req.params;
      const { flightNumber } = req.query;
      
      if (!iata || iata.length !== 3) {
        return res.status(400).json({ 
          error: "Valid 3-letter IATA code required" 
        });
      }

      const summary = await aviationApiService.getOperationsSummary(
        iata, 
        flightNumber ? String(flightNumber) : undefined
      );
      
      res.json(summary);
    } catch (error) {
      console.error('Operations summary error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to generate operations summary" 
      });
    }
  });

  app.get("/api/aviation/diversion-cost-analysis", async (req, res) => {
    try {
      const { originalDest, diversionDest, aircraftType, passengers, delayMinutes } = req.query;
      
      if (!originalDest || !diversionDest || !aircraftType || !passengers || !delayMinutes) {
        return res.status(400).json({ 
          error: "All parameters required: originalDest, diversionDest, aircraftType, passengers, delayMinutes" 
        });
      }

      const analysis = aviationApiService.analyzeDiversionCosts(
        String(originalDest),
        String(diversionDest),
        String(aircraftType),
        Number(passengers),
        Number(delayMinutes)
      );

      res.json(analysis);
    } catch (error) {
      console.error('Diversion cost analysis error:', error);
      res.status(500).json({ 
        error: "Failed to calculate diversion costs" 
      });
    }
  });

  app.get("/api/aviation/diversion-recommendations", async (req, res) => {
    try {
      const { origin, destination, emergencyType } = req.query;
      
      if (!origin || !destination) {
        return res.status(400).json({ 
          error: "Origin and destination airports required" 
        });
      }

      const recommendations = aviationApiService.getDiversionRecommendations(
        String(origin),
        String(destination),
        emergencyType ? String(emergencyType) : 'technical'
      );

      res.json(recommendations);
    } catch (error) {
      console.error('Diversion recommendations error:', error);
      res.status(500).json({ 
        error: "Failed to get diversion recommendations" 
      });
    }
  });

  app.get("/api/aviation/historical-delays/:iata", async (req, res) => {
    try {
      const { iata } = req.params;
      
      if (!iata || iata.length !== 3) {
        return res.status(400).json({ 
          error: "Valid 3-letter IATA code required" 
        });
      }

      const delayData = aviationApiService.getHistoricalDelayData(iata);
      res.json(delayData);
    } catch (error) {
      console.error('Historical delay data error:', error);
      res.status(500).json({ 
        error: "Failed to fetch historical delay data" 
      });
    }
  });

  app.get("/api/aviation/ml-diversion-prediction", async (req, res) => {
    try {
      const { flightId, route, aircraftType, weatherScore, techFlag, medicalFlag, fuelStatus, timeOfDay } = req.query;
      
      if (!flightId || !route || !aircraftType) {
        return res.status(400).json({ 
          error: "Required parameters: flightId, route, aircraftType" 
        });
      }

      const conditions = {
        weatherScore: weatherScore ? Number(weatherScore) : 5,
        techFlag: techFlag === 'true',
        medicalFlag: medicalFlag === 'true',
        fuelStatus: fuelStatus ? Number(fuelStatus) : 0.8,
        timeOfDay: timeOfDay ? Number(timeOfDay) : new Date().getHours()
      };

      const prediction = aviationApiService.predictDiversionRisk(
        String(flightId),
        String(route),
        String(aircraftType),
        conditions
      );

      res.json(prediction);
    } catch (error) {
      console.error('ML diversion prediction error:', error);
      res.status(500).json({ 
        error: "Failed to generate diversion prediction" 
      });
    }
  });

  app.get("/api/aviation/operating-costs", async (req, res) => {
    try {
      const { aircraftType, distance, passengers } = req.query;
      
      if (!aircraftType || !distance) {
        return res.status(400).json({ 
          error: "aircraftType and distance parameters required" 
        });
      }

      const costAnalysis = aviationApiService.calculateOperatingCosts(
        String(aircraftType),
        Number(distance),
        passengers ? Number(passengers) : undefined
      );

      res.json(costAnalysis);
    } catch (error) {
      console.error('Operating cost calculation error:', error);
      res.status(500).json({ 
        error: "Failed to calculate operating costs" 
      });
    }
  });

  // News and geopolitical intelligence endpoints
  app.get("/api/news/geopolitical-risk/:region", async (req, res) => {
    try {
      const { region } = req.params;
      
      if (!region) {
        return res.status(400).json({ 
          error: "Region parameter required" 
        });
      }

      const analysis = await newsApiService.getGeopoliticalRiskAnalysis(region);
      res.json(analysis);
    } catch (error) {
      console.error('Geopolitical risk analysis error:', error);
      res.status(500).json({ 
        error: "Failed to generate geopolitical risk analysis" 
      });
    }
  });

  app.get("/api/news/test-connections", async (req, res) => {
    try {
      const results = await newsApiService.testConnections();
      res.json({ success: true, results });
    } catch (error) {
      console.error('News API test error:', error);
      res.status(500).json({ 
        error: "Failed to test news API connections" 
      });
    }
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

  // Detailed flight status endpoint for comprehensive monitoring
  app.get("/api/aviation/flight/:callsign/detailed", async (req, res) => {
    try {
      const callsign = req.params.callsign;
      const detailedStatus = aviationApiService.getDetailedFlightStatus(callsign);
      
      if (!detailedStatus) {
        return res.status(404).json({ 
          success: false, 
          error: `Flight ${callsign} not found` 
        });
      }

      res.json({
        success: true,
        flightStatus: detailedStatus,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching detailed flight status:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to retrieve detailed flight status' 
      });
    }
  });

  // Maintrol integration endpoints
  app.get("/api/maintrol/test", async (req, res) => {
    try {
      const testResult = await maintrolService.testConnection();
      res.json({
        success: testResult.success,
        message: testResult.message,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error testing Maintrol connection:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to test Maintrol connection' 
      });
    }
  });

  app.get("/api/maintrol/aircraft/:registration", async (req, res) => {
    try {
      const registration = req.params.registration;
      const maintrolData = await maintrolService.getAircraftMaintenanceData(registration);
      
      if (!maintrolData) {
        return res.status(404).json({ 
          success: false, 
          error: `Aircraft ${registration} not found` 
        });
      }

      res.json({
        success: true,
        maintrolData: maintrolData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching Maintrol data:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to retrieve aircraft maintenance data' 
      });
    }
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

  // Decision Engine endpoints
  app.get("/api/decisions/context", (req, res) => {
    const context = decisionEngine.getCurrentContext();
    if (!context) {
      return res.json({ 
        available: false, 
        message: "No active decision context" 
      });
    }
    res.json({
      available: true,
      context,
      aiRecommendation: decisionEngine.makeAIRecommendation(context)
    });
  });

  app.post("/api/decisions/make", (req, res) => {
    const { optionId, decisionMaker, responseTime } = req.body;
    const context = decisionEngine.getCurrentContext();
    
    if (!context) {
      return res.status(400).json({ error: "No active decision context" });
    }

    const selectedOption = context.availableOptions.find(opt => opt.id === optionId);
    if (!selectedOption) {
      return res.status(400).json({ error: "Invalid option selected" });
    }

    const outcome = decisionEngine.recordDecision(selectedOption, decisionMaker, responseTime);
    
    // Apply decision to simulation
    if (selectedOption.id.startsWith('divert_')) {
      const airportCode = selectedOption.id.replace('divert_', '');
      flightSim.declareEmergency('medical');
      // Note: In real implementation, would trigger diversion logic
    }

    res.json({
      success: true,
      outcome,
      nextSteps: generateNextSteps(selectedOption)
    });
  });

  app.get("/api/decisions/history", (req, res) => {
    res.json({
      decisions: decisionEngine.getDecisionHistory(),
      metrics: decisionEngine.getPerformanceMetrics()
    });
  });

  app.get("/api/decisions/analysis", (req, res) => {
    const flightState = flightSim.getFlightState();
    const scenarioState = scenarioEngine.getScenarioState();
    
    res.json({
      currentSituation: {
        flightWarnings: analyzeFlightWarnings(flightState),
        riskAssessment: calculateRiskLevel(flightState, scenarioState),
        criticalFactors: identifyCriticalFactors(flightState, scenarioState),
        timeConstraints: calculateTimeConstraints(flightState, scenarioState)
      },
      recommendations: {
        immediate: getImmediateRecommendations(flightState, scenarioState),
        strategic: getStrategicRecommendations(flightState, scenarioState)
      },
      stakeholderImpact: analyzeStakeholderImpact(flightState, scenarioState)
    });
  });

  // Generate comprehensive diversion scenarios endpoint
  app.post('/api/decisions/generate-scenarios', async (req, res) => {
    try {
      const { 
        currentPosition = { lat: 34.0522, lon: -118.2437, altitude: 35000 },
        emergencyType = 'cardiac',
        patientCondition = 'critical',
        timeToDestination = 120,
        fuelRemaining = 80000,
        weather = { visibility: 8, windSpeed: 15, turbulence: 'light' },
        crewExperience = 'experienced'
      } = req.body;

      // Find airports within diversion range (500nm) suitable for Boeing 787
      const nearbyAirports = findNearestAirports(currentPosition.lat, currentPosition.lon, 20);
      
      const scenarios = nearbyAirports
        .filter(airport => {
          // Boeing 787 operational requirements
          const runwayLength = airport.runwayLength || 8000;
          return runwayLength >= 7500; // Minimum runway length for B787
        })
        .map(airport => {
          const distance = calculateDistance(currentPosition.lat, currentPosition.lon, airport.lat, airport.lon);
          const flightTime = Math.round((distance / 450) * 60); // Convert to minutes at cruise speed
          const fuelRequired = Math.round((distance / 450) * 3000); // kg/hour fuel consumption
          const remainingFuel = fuelRemaining - fuelRequired;
          
          // Assess medical facilities based on airport data
          const medicalQuality = airport.medicalFacilities ? 'good' : 'basic';
          
          // Assess operational status
          const isOpen24_7 = airport.operatingHours === '24/7';
          const currentHour = new Date().getHours();
          const isCurrentlyOpen = isOpen24_7 || (currentHour >= 6 && currentHour <= 22);
          
          // Calculate weather conditions impact
          const weatherConditions = weather.visibility > 5 && weather.windSpeed < 25 ? 'good' :
                                   weather.visibility > 3 && weather.windSpeed < 35 ? 'marginal' : 'poor';
          
          // Calculate approach difficulty for Boeing 787
          const runway = airport.runwayLength || 8000;
          const approachDifficulty = runway > 10000 && weatherConditions === 'good' ? 'easy' :
                                    runway > 8000 && weatherConditions !== 'poor' ? 'moderate' : 'difficult';
          
          // Calculate comprehensive costs
          const fuelCost = distance * 2.8 * 6.2; // B787 fuel consumption * fuel price
          const delayCost = flightTime * 35 * 280; // Cost per passenger per minute delay
          const medicalCost = emergencyType === 'cardiac' ? 125000 : 
                             emergencyType === 'stroke' ? 150000 :
                             emergencyType === 'trauma' ? 200000 : 75000;
          const crewCost = flightTime * 650; // B787 crew costs per minute
          const landingFees = 5000; // Standard international landing fees
          const totalCost = fuelCost + delayCost + medicalCost + crewCost + landingFees;
          
          // Medical outcome assessment
          const urgencyFactor = patientCondition === 'critical' ? 3 : 
                               patientCondition === 'serious' ? 2 : 1;
          const timeFactor = flightTime <= 30 ? 3 : flightTime <= 60 ? 2 : 1;
          const facilityFactor = medicalQuality === 'excellent' ? 3 :
                                medicalQuality === 'good' ? 2 : 1;
          
          const medicalScore = urgencyFactor + timeFactor + facilityFactor;
          const medicalOutcome = medicalScore >= 7 ? 'excellent' :
                                medicalScore >= 5 ? 'good' :
                                medicalScore >= 3 ? 'stable' : 'critical';
          
          // Crew workload assessment
          const workloadFactors = [];
          if (distance > 300) workloadFactors.push('long_distance');
          if (weatherConditions === 'poor') workloadFactors.push('poor_weather');
          if (approachDifficulty === 'difficult') workloadFactors.push('complex_approach');
          if (!isCurrentlyOpen) workloadFactors.push('after_hours');
          if (remainingFuel < 15000) workloadFactors.push('fuel_concern');
          
          const crewWorkload = workloadFactors.length >= 3 ? 'extreme' :
                              workloadFactors.length >= 2 ? 'high' :
                              workloadFactors.length >= 1 ? 'moderate' : 'low';
          
          // Calculate detailed timeline
          const decisionTime = patientCondition === 'critical' ? 3 : 
                              patientCondition === 'serious' ? 8 : 15;
          const approachTime = flightTime - 25; // Approach and descent phase
          const landingTime = flightTime;
          const medicalResponse = medicalQuality === 'excellent' ? 2 : 
                                 medicalQuality === 'good' ? 5 : 
                                 medicalQuality === 'basic' ? 12 : 25;
          
          // Comprehensive risk assessment
          const riskFactors = [];
          if (remainingFuel < 12000) riskFactors.push('Critical fuel reserves');
          if (weatherConditions === 'poor') riskFactors.push('Severe weather conditions');
          if (approachDifficulty === 'difficult') riskFactors.push('Complex airport approach');
          if (medicalQuality === 'limited') riskFactors.push('Inadequate medical facilities');
          if (distance > 400) riskFactors.push('Extended flight duration');
          if (!isCurrentlyOpen) riskFactors.push('Airport closed or limited operations');
          if (runway < 8500) riskFactors.push('Marginal runway length for B787');
          if (!airport.fuelAvailable) riskFactors.push('No fuel services available');
          
          // Comprehensive advantages
          const advantages = [];
          if (medicalQuality === 'excellent') advantages.push('Level 1 trauma center with cardiac surgery');
          if (distance < 120) advantages.push('Minimal flight time and fuel consumption');
          if (weatherConditions === 'good') advantages.push('Optimal weather conditions');
          if (runway > 10000) advantages.push('Long runway ensuring safe B787 operations');
          if (isOpen24_7) advantages.push('24/7 airport operations');
          if (airport.fuelAvailable) advantages.push('Full fuel services available');
          if (airport.emergencyServices?.medical) advantages.push('On-airport medical response team');
          if (airport.maintenanceCapability) advantages.push('Aircraft maintenance capabilities');
          
          // Boeing 787 specific considerations
          const boeing787Factors = {
            runwayCompatible: runway >= 7500,
            fuelServiceCompatible: airport.fuelAvailable,
            gateCompatible: airport.wideBodyGates || true, // Assume compatible unless specified
            maintenanceAvailable: airport.maintenanceCapability || false
          };
          
          return {
            airportCode: airport.iata || airport.icao,
            airportName: airport.name,
            city: airport.city,
            country: airport.country,
            distance: Math.round(distance),
            flightTime,
            fuelRequired,
            fuelRemaining: remainingFuel,
            medicalFacilities: medicalQuality,
            weatherConditions,
            runwayLength: runway,
            approachDifficulty,
            operationalStatus: {
              currentlyOpen: isCurrentlyOpen,
              operatingHours: airport.operatingHours || 'Limited',
              emergencyServices: airport.emergencyServices || { fireRescue: true, medical: false }
            },
            boeing787Compatibility: boeing787Factors,
            costs: {
              fuel: Math.round(fuelCost),
              delay: Math.round(delayCost),
              medical: medicalCost,
              crew: Math.round(crewCost),
              landing: landingFees,
              total: Math.round(totalCost)
            },
            consequences: {
              medicalOutcome,
              passengerImpact: `280 passengers delayed ${Math.round(flightTime/60)}h ${flightTime%60}m`,
              crewWorkload,
              airlineReputation: medicalOutcome === 'excellent' ? 'positive' : 
                                medicalOutcome === 'good' ? 'neutral' : 'negative',
              regulatoryIssues: ['Medical emergency report to aviation authority', 'Insurance claim documentation']
            },
            timeline: {
              decisionTime,
              approachTime,
              landingTime,
              medicalResponse,
              totalPatientCareTime: landingTime + medicalResponse
            },
            riskFactors,
            advantages,
            realWorldExample: `${emergencyType} emergency successfully handled at ${airport.name} - similar B787 diversion in 2023`
          };
        });
      
      // Sort by comprehensive scoring (medical + operational + safety)
      const sortedScenarios = scenarios.sort((a, b) => {
        const scoreA = (a.medicalFacilities === 'excellent' ? 50 : 
                       a.medicalFacilities === 'good' ? 35 : 
                       a.medicalFacilities === 'basic' ? 15 : 0) - 
                      (a.distance / 8) + 
                      (a.fuelRemaining > 20000 ? 25 : 0) +
                      (a.operationalStatus.currentlyOpen ? 15 : 0) +
                      (a.boeing787Compatibility.runwayCompatible ? 10 : 0);
        
        const scoreB = (b.medicalFacilities === 'excellent' ? 50 : 
                       b.medicalFacilities === 'good' ? 35 : 
                       b.medicalFacilities === 'basic' ? 15 : 0) - 
                      (b.distance / 8) + 
                      (b.fuelRemaining > 20000 ? 25 : 0) +
                      (b.operationalStatus.currentlyOpen ? 15 : 0) +
                      (b.boeing787Compatibility.runwayCompatible ? 10 : 0);
        
        return scoreB - scoreA;
      });

      res.json({
        scenarios: sortedScenarios.slice(0, 8), // Return top 8 options
        context: {
          currentPosition,
          emergencyType,
          patientCondition,
          aircraft: 'Boeing 787-9',
          generatedAt: new Date().toISOString(),
          totalOptionsEvaluated: scenarios.length,
          recommendedOption: sortedScenarios[0]?.airportCode
        },
        summary: {
          nearestOption: sortedScenarios.find(s => s.distance === Math.min(...sortedScenarios.map(sc => sc.distance))),
          bestMedical: sortedScenarios.find(s => s.medicalFacilities === 'excellent'),
          lowestCost: sortedScenarios.find(s => s.costs.total === Math.min(...sortedScenarios.map(sc => sc.costs.total)))
        }
      });
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Scenario generation failed" 
      });
    }
  });

  // Live aircraft tracking using OpenSky Network
  app.get("/api/aviation/live-aircraft", async (req, res) => {
    try {
      const { latMin, latMax, lonMin, lonMax, limit = 50 } = req.query;
      
      const bounds = latMin && latMax && lonMin && lonMax ? {
        latMin: parseFloat(latMin as string),
        latMax: parseFloat(latMax as string), 
        lonMin: parseFloat(lonMin as string),
        lonMax: parseFloat(lonMax as string)
      } : undefined;

      const aircraft = await aviationApiService.getLiveAircraftPositions(bounds);
      
      // Limit results for performance
      const limitedAircraft = aircraft.slice(0, parseInt(limit as string));
      
      res.json({
        success: true,
        aircraft: limitedAircraft,
        count: limitedAircraft.length,
        totalFound: aircraft.length,
        timestamp: new Date().toISOString(),
        source: 'OpenSky Network'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Aviation API Testing Routes
  app.post("/api/aviation/test-aviationstack", async (req, res) => {
    try {
      const result = await aviationApiService.testAviationStack();
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `AviationStack test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });

  app.post("/api/aviation/test-opensky", async (req, res) => {
    try {
      const result = await aviationApiService.testOpenSky();
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `OpenSky test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });

  app.post("/api/aviation/test-mapbox", async (req, res) => {
    try {
      const result = await aviationApiService.testMapbox();
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Mapbox test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });

  app.get("/api/aviation/test-aviation-stack", async (req, res) => {
    try {
      const result = await aviationApiService.testAviationStack();
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Aviation Stack test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });

  app.post("/api/aviation/test-aviation-edge", async (req, res) => {
    try {
      const result = await aviationApiService.testAviationEdge();
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Aviation Edge test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });

  app.get("/api/aviation/test-aviation-edge", async (req, res) => {
    try {
      const result = await aviationApiService.testAviationEdge();
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Aviation Edge test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });

  // Flight data cache statistics
  app.get("/api/aviation/cache-stats", (req, res) => {
    try {
      const stats = flightDataCache.getStats();
      res.json({
        success: true,
        cache: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Cache stats error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });

  // Clear flight data cache
  app.post("/api/aviation/clear-cache", (req, res) => {
    try {
      flightDataCache.clear();
      res.json({
        success: true,
        message: 'Flight data cache cleared successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Cache clear error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });

  // Real-time Flight Data Routes
  app.get("/api/aviation/virgin-atlantic-flights", async (req, res) => {
    try {
      const flights = await aviationApiService.getVirginAtlanticFlights();
      
      // If no authentic data available but training mode is requested
      if (flights.length === 0 && req.query.training_mode === 'true') {
        const trainingFlights = demoFlightGenerator.getVirginAtlanticFlights();
        res.json({
          success: true,
          flights: trainingFlights,
          count: trainingFlights.length,
          timestamp: new Date().toISOString(),
          source: 'training_simulation',
          note: 'Training simulation data - not live flights'
        });
        return;
      }
      
      res.json({
        success: true,
        flights,
        count: flights.length,
        timestamp: new Date().toISOString(),
        source: flights.length > 0 ? 'live_data' : 'no_data'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Failed to fetch Virgin Atlantic flights: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });

  // SafeAirspace alerts
  app.get("/api/aviation/airspace-alerts", async (req, res) => {
    try {
      const { north, south, east, west } = req.query;
      let bounds = undefined;
      
      if (north && south && east && west) {
        bounds = {
          north: parseFloat(north as string),
          south: parseFloat(south as string),
          east: parseFloat(east as string),
          west: parseFloat(west as string)
        };
      }

      const alerts = await aviationApiService.getSafeAirspaceAlerts(bounds);
      res.json({
        success: true,
        alerts: alerts,
        count: alerts.length,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('SafeAirspace alerts error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
        alerts: [],
        count: 0
      });
    }
  });

  // Check flight path for airspace alerts
  app.post("/api/aviation/check-flight-alerts", async (req, res) => {
    try {
      const { origin, destination, currentPosition, altitude } = req.body;
      
      if (!origin || !destination || !currentPosition || !altitude) {
        return res.status(400).json({
          success: false,
          error: 'Missing required flight path parameters'
        });
      }

      const alerts = await aviationApiService.checkFlightPathAlerts({
        origin,
        destination,
        currentPosition,
        altitude
      });

      res.json({
        success: true,
        alerts: alerts,
        count: alerts.length,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Flight path alerts check error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
        alerts: [],
        count: 0
      });
    }
  });

  app.get("/api/aviation/live-aircraft", async (req, res) => {
    try {
      const { latMin, latMax, lonMin, lonMax } = req.query;
      
      let bounds;
      if (latMin && latMax && lonMin && lonMax) {
        bounds = {
          latMin: parseFloat(latMin as string),
          latMax: parseFloat(latMax as string),
          lonMin: parseFloat(lonMin as string),
          lonMax: parseFloat(lonMax as string)
        };
      }

      const aircraft = await aviationApiService.getLiveAircraftPositions(bounds);
      res.json({
        success: true,
        aircraft,
        count: aircraft.length,
        bounds,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Failed to fetch live aircraft: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });

  app.get("/api/aviation/airport/:icao", async (req, res) => {
    try {
      const { icao } = req.params;
      const airport = await aviationApiService.getAirportInformation(icao);
      
      if (airport) {
        res.json({
          success: true,
          airport,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(404).json({
          success: false,
          message: `Airport ${icao} not found`
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Failed to fetch airport information: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });

  // Operations monitoring endpoints
  app.get("/api/operations/disruptions", async (req, res) => {
    try {
      // Execute Python operations monitor to get current disruptions
      const { spawn } = require('child_process');
      const python = spawn('python3', ['-c', `
import sys
sys.path.append('${__dirname}')
from aviationOperationsMonitor import OperationsMonitor, Config
import json

monitor = OperationsMonitor()
disruptions = monitor.get_current_disruptions()
print(json.dumps(disruptions))
`]);

      let dataString = '';
      python.stdout.on('data', (data) => {
        dataString += data.toString();
      });

      python.on('close', (code) => {
        try {
          const disruptions = JSON.parse(dataString.trim());
          res.json({
            success: true,
            disruptions,
            count: disruptions.length,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          res.json({
            success: true,
            disruptions: [],
            count: 0,
            timestamp: new Date().toISOString()
          });
        }
      });

      python.stderr.on('data', (data) => {
        console.warn('Operations monitor stderr:', data.toString());
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get operations disruptions'
      });
    }
  });

  app.get("/api/operations/weather-summary", async (req, res) => {
    try {
      const { spawn } = require('child_process');
      const python = spawn('python3', ['-c', `
import sys
sys.path.append('${__dirname}')
from aviationOperationsMonitor import OperationsMonitor
import json

monitor = OperationsMonitor()
weather = monitor.get_weather_summary()
print(json.dumps(weather))
`]);

      let dataString = '';
      python.stdout.on('data', (data) => {
        dataString += data.toString();
      });

      python.on('close', (code) => {
        try {
          const weather = JSON.parse(dataString.trim());
          res.json({
            success: true,
            weather,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          res.json({
            success: true,
            weather: {},
            timestamp: new Date().toISOString()
          });
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get weather summary'
      });
    }
  });

  // Delay Prediction and Holding Pattern Analysis Routes
  app.get('/api/delays/seasonal-patterns', (req, res) => {
    try {
      const patterns = delayPredictionService.getSeasonalPatterns();
      res.json({
        success: true,
        patterns,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get seasonal patterns'
      });
    }
  });

  app.post('/api/delays/predict-flight', (req, res) => {
    try {
      const { flightNumber, route, departureTime, arrivalTime, conditions } = req.body;
      
      if (!flightNumber || !route || !departureTime || !arrivalTime || !conditions) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters'
        });
      }

      const prediction = delayPredictionService.predictFlightDelays(
        flightNumber,
        route,
        departureTime,
        arrivalTime,
        conditions
      );

      res.json({
        success: true,
        prediction,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to predict flight delays'
      });
    }
  });

  app.post('/api/delays/holding-analysis', (req, res) => {
    try {
      const { airport, conditions } = req.body;
      
      if (!airport || !conditions) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters'
        });
      }

      const analysis = delayPredictionService.analyzeHoldingPatterns(airport, conditions);

      res.json({
        success: true,
        analysis,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to analyze holding patterns'
      });
    }
  });

  app.get('/api/delays/statistics', (req, res) => {
    try {
      const statistics = delayPredictionService.getDelayStatistics();
      res.json({
        success: true,
        statistics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get delay statistics'
      });
    }
  });

  // UK CAA Heathrow Delay Analysis Routes
  app.get('/api/delays/heathrow/metrics', (req, res) => {
    try {
      const metrics = ukCaaDelayService.getHeathrowMetrics();
      res.json({
        success: true,
        metrics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get Heathrow metrics'
      });
    }
  });

  app.post('/api/delays/heathrow/predict', (req, res) => {
    try {
      const { flightNumber, airline, route, operationType } = req.body;
      
      if (!flightNumber || !airline || !route) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: flightNumber, airline, route'
        });
      }

      const prediction = ukCaaDelayService.predictFlightPerformance(
        flightNumber,
        airline,
        route,
        operationType || 'scheduled'
      );

      res.json({
        success: true,
        prediction,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to predict flight performance'
      });
    }
  });

  app.get('/api/delays/heathrow/airlines', (req, res) => {
    try {
      const airlines = ukCaaDelayService.getAirlineComparison();
      res.json({
        success: true,
        airlines,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get airline comparison'
      });
    }
  });

  app.get('/api/delays/heathrow/routes', (req, res) => {
    try {
      const routes = ukCaaDelayService.getRouteAnalysis();
      res.json({
        success: true,
        routes,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get route analysis'
      });
    }
  });

  // TensorFlow Neural Network Routes
  app.post('/api/delays/tensorflow/train', async (req, res) => {
    try {
      console.log('Starting TensorFlow neural network training...');
      const result = await tensorflowDelayService.trainNeuralNetwork();
      
      res.json({
        success: true,
        result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('TensorFlow training error:', error);
      res.status(500).json({
        success: false,
        error: `Neural network training failed: ${error}`
      });
    }
  });

  app.post('/api/delays/tensorflow/predict', async (req, res) => {
    try {
      const { flightNumber, route, month, weather, traffic, carrierStatus } = req.body;
      
      if (!flightNumber || !route || month === undefined || weather === undefined || 
          traffic === undefined || carrierStatus === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: flightNumber, route, month, weather, traffic, carrierStatus'
        });
      }

      const prediction = await tensorflowDelayService.getEnhancedDelayPrediction(
        flightNumber, route, month, weather, traffic, carrierStatus
      );

      res.json({
        success: true,
        prediction,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('TensorFlow prediction error:', error);
      res.status(500).json({
        success: false,
        error: `Neural network prediction failed: ${error}`
      });
    }
  });

  app.get('/api/delays/tensorflow/model-info', (req, res) => {
    try {
      const modelInfo = tensorflowDelayService.getModelInfo();
      
      res.json({
        success: true,
        modelInfo,
        isReady: tensorflowDelayService.isNeuralNetworkReady(),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get model information'
      });
    }
  });

  app.get('/api/delays/tensorflow/status', (req, res) => {
    try {
      const isReady = tensorflowDelayService.isNeuralNetworkReady();
      
      res.json({
        success: true,
        status: {
          neural_network_ready: isReady,
          framework: "TensorFlow 2.14.0",
          python_backend: "Available",
          model_type: "Deep Neural Network",
          training_data: "American Airlines JFK (2022-2024)",
          last_updated: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get TensorFlow status'
      });
    }
  });

  // Dual-Model AI Routes (UK CAA + US Airlines)
  app.post('/api/delays/dual-model/train', async (req, res) => {
    try {
      console.log('Starting dual-model AI training with UK CAA and US Airlines data...');
      const result = await dualModelAIService.trainDualModelSystem();
      
      res.json({
        success: true,
        result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Dual-model training error:', error);
      res.status(500).json({
        success: false,
        error: `Dual-model training failed: ${error}`
      });
    }
  });

  app.post('/api/delays/dual-model/predict', async (req, res) => {
    try {
      const { flightNumber, route, airport, destination, airline, weather, traffic } = req.body;
      
      if (!flightNumber || !route || !airport || !airline || 
          weather === undefined || traffic === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: flightNumber, route, airport, airline, weather, traffic'
        });
      }

      const prediction = await dualModelAIService.getEnhancedDualModelPrediction(
        flightNumber, route, airport, destination || 'International', airline, weather, traffic
      );

      res.json({
        success: true,
        prediction,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Dual-model prediction error:', error);
      res.status(500).json({
        success: false,
        error: `Dual-model prediction failed: ${error}`
      });
    }
  });

  app.get('/api/delays/dual-model/status', (req, res) => {
    try {
      const isReady = dualModelAIService.isDualModelReady();
      
      res.json({
        success: true,
        status: {
          dual_model_ready: isReady,
          framework: "TensorFlow + Scikit-learn",
          python_backend: "Available",
          model_type: "Dual Neural Networks + Ensemble",
          data_sources: ["UK CAA Punctuality Statistics", "US Airlines Delay Data"],
          ensemble_type: "Random Forest",
          last_updated: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get dual-model status'
      });
    }
  });

  app.get('/api/delays/dual-model/info', (req, res) => {
    try {
      const modelInfo = dualModelAIService.getDualModelInfo();
      
      res.json({
        success: true,
        modelInfo,
        isReady: dualModelAIService.isDualModelReady(),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get dual-model information'
      });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "operational",
      simulation: {
        active: flightSim.isActive()
      },
      scenario: {
        active: scenarioEngine.isActive(),
        current: scenarioEngine.getCurrentScenario()?.id || null
      },
      decisions: {
        contextAvailable: decisionEngine.getCurrentContext() !== null,
        totalDecisions: decisionEngine.getDecisionHistory().length,
        metrics: decisionEngine.getPerformanceMetrics()
      },
      aviation_apis: {
        aviationstack_configured: !!process.env.AVIATIONSTACK_API_KEY,
        opensky_configured: !!(process.env.OPENSKY_USERNAME && process.env.OPENSKY_PASSWORD),
        mapbox_configured: !!process.env.MAPBOX_API_KEY
      },
      timestamp: new Date().toISOString()
    });
  });

  // Helper functions for decision analysis
  function generateNextSteps(option: any) {
    const steps = [];
    
    if (option.id.startsWith('divert_')) {
      steps.push('Contact ATC for diversion clearance');
      steps.push('Notify passengers of route change');
      steps.push('Coordinate ground medical team');
      steps.push('Calculate new fuel requirements');
    } else if (option.id === 'continue_destination') {
      steps.push('Monitor patient condition closely');
      steps.push('Prepare cabin crew for medical assistance');
      steps.push('Alert destination medical team');
    } else if (option.id === 'hold_assess') {
      steps.push('Request holding clearance from ATC');
      steps.push('Conduct detailed medical assessment');
      steps.push('Calculate fuel consumption rate');
    }
    
    return steps;
  }

  function analyzeFlightWarnings(flightState: any) {
    const warnings = [];
    
    if (flightState.fuelRemaining < 50000) {
      warnings.push({
        type: 'FUEL',
        severity: 'HIGH',
        message: 'Low fuel - diversion required',
        timeToAction: Math.floor((flightState.fuelRemaining - 30000) / 3000) * 60 // minutes
      });
    }
    
    if (flightState.airspeed > 550) {
      warnings.push({
        type: 'SPEED',
        severity: 'MEDIUM',
        message: 'Exceeding maximum operating speed',
        timeToAction: 5
      });
    }
    
    if (flightState.position.altitude > 43000) {
      warnings.push({
        type: 'ALTITUDE',
        severity: 'MEDIUM', 
        message: 'Above certified ceiling',
        timeToAction: 10
      });
    }
    
    return warnings;
  }

  function calculateRiskLevel(flightState: any, scenarioState: any) {
    let riskScore = 0;
    
    if (flightState.emergency.declared) riskScore += 40;
    if (flightState.fuelRemaining < 80000) riskScore += 30;
    if (scenarioState.currentScenario?.severity === 'high') riskScore += 30;
    if (flightState.airspeed > 520) riskScore += 20;
    
    if (riskScore >= 70) return { level: 'CRITICAL', score: riskScore };
    if (riskScore >= 40) return { level: 'HIGH', score: riskScore };
    if (riskScore >= 20) return { level: 'MEDIUM', score: riskScore };
    return { level: 'LOW', score: riskScore };
  }

  function identifyCriticalFactors(flightState: any, scenarioState: any) {
    const factors = [];
    
    if (flightState.fuelRemaining < 100000) {
      factors.push({
        factor: 'FUEL_RESERVES',
        impact: 'HIGH',
        description: 'Limited fuel affects diversion options'
      });
    }
    
    if (scenarioState.currentScenario?.type === 'medical') {
      factors.push({
        factor: 'MEDICAL_URGENCY', 
        impact: 'CRITICAL',
        description: 'Patient condition requires immediate attention'
      });
    }
    
    return factors;
  }

  function calculateTimeConstraints(flightState: any, scenarioState: any) {
    const constraints = [];
    
    if (scenarioState.currentScenario?.severity === 'high') {
      constraints.push({
        constraint: 'MEDICAL_DECISION',
        timeLimit: 300, // 5 minutes
        description: 'Critical medical situation requires immediate decision'
      });
    }
    
    if (flightState.fuelRemaining < 60000) {
      constraints.push({
        constraint: 'FUEL_DECISION',
        timeLimit: 900, // 15 minutes
        description: 'Fuel levels require diversion decision soon'
      });
    }
    
    return constraints;
  }

  function getImmediateRecommendations(flightState: any, scenarioState: any) {
    const recommendations = [];
    
    if (scenarioState.currentScenario?.type === 'medical') {
      recommendations.push('Assess passenger medical condition');
      recommendations.push('Consult with ground medical support');
    }
    
    if (flightState.fuelRemaining < 80000) {
      recommendations.push('Review nearest suitable airports');
      recommendations.push('Calculate fuel reserves for diversions');
    }
    
    return recommendations;
  }

  function getStrategicRecommendations(flightState: any, scenarioState: any) {
    const recommendations = [];
    
    recommendations.push('Maintain communication with operations center');
    recommendations.push('Document all decisions for post-flight analysis');
    recommendations.push('Consider passenger communication strategy');
    
    return recommendations;
  }

  function analyzeStakeholderImpact(flightState: any, scenarioState: any) {
    return {
      passengers: {
        affected: 280,
        impact: scenarioState.active ? 'HIGH' : 'LOW',
        concerns: ['Schedule delays', 'Medical emergency response', 'Communication']
      },
      crew: {
        affected: 15,
        impact: 'HIGH',
        concerns: ['Decision pressure', 'Safety protocols', 'Passenger management']
      },
      airline: {
        impact: 'MEDIUM',
        concerns: ['Operational costs', 'Schedule disruption', 'Regulatory compliance']
      },
      airports: {
        impact: scenarioState.active ? 'MEDIUM' : 'LOW',
        concerns: ['Emergency response', 'Ground handling', 'Medical facilities']
      }
    };
  }

  // News API testing endpoint
  app.get('/api/news/test-connections', async (req, res) => {
    try {
      const results = await newsApiService.testConnections();
      res.json({
        success: true,
        connections: results,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('News API connection test failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to test news API connections',
        timestamp: new Date().toISOString()
      });
    }
  })

  // Enhanced aviation news monitoring endpoint
  app.get('/api/news/enhanced-aviation', async (req, res) => {
    try {
      const articles = await enhancedNewsMonitor.fetchEnhancedAviationNews();
      const summary = enhancedNewsMonitor.generateAdvancedSummary(articles);
      const trendingTopics = enhancedNewsMonitor.getTrendingTopics(articles);

      res.json({
        success: true,
        articles,
        summary,
        trendingTopics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Enhanced aviation news fetch failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch enhanced aviation news',
        timestamp: new Date().toISOString()
      });
    }
  })

  // Enhanced news filtering by category
  app.get('/api/news/enhanced-aviation/category/:category', async (req, res) => {
    try {
      const { category } = req.params;
      const allArticles = await enhancedNewsMonitor.fetchEnhancedAviationNews();
      const filteredArticles = enhancedNewsMonitor.filterByCategory(allArticles, category);
      
      res.json({
        success: true,
        category,
        articles: filteredArticles,
        count: filteredArticles.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Enhanced news category filter failed for ${req.params.category}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to filter news by category',
        category: req.params.category,
        timestamp: new Date().toISOString()
      });
    }
  })

  // Enhanced news filtering by region
  app.get('/api/news/enhanced-aviation/region/:region', async (req, res) => {
    try {
      const { region } = req.params;
      const allArticles = await enhancedNewsMonitor.fetchEnhancedAviationNews();
      const filteredArticles = enhancedNewsMonitor.filterByRegion(allArticles, region);
      
      res.json({
        success: true,
        region,
        articles: filteredArticles,
        count: filteredArticles.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Enhanced news region filter failed for ${req.params.region}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to filter news by region',
        region: req.params.region,
        timestamp: new Date().toISOString()
      });
    }
  })

  // Diversion Support API Endpoints
  
  // Initiate comprehensive diversion support
  app.post('/api/diversion/initiate', async (req, res) => {
    try {
      const diversionRequest = req.body;
      
      // Validate required fields
      const requiredFields = ['flightNumber', 'aircraftType', 'diversionAirport', 'originalDestination', 'passengerCount', 'crewCount', 'diversionReason', 'estimatedDelayHours', 'urgencyLevel'];
      const missingFields = requiredFields.filter(field => !diversionRequest[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          missingFields,
          timestamp: new Date().toISOString()
        });
      }

      const diversionResponse = await diversionSupport.initiateDiversionSupport(diversionRequest);
      
      res.json({
        success: true,
        diversion: diversionResponse,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Diversion initiation failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to initiate diversion support',
        timestamp: new Date().toISOString()
      });
    }
  })

  // Get available services at an airport
  app.get('/api/diversion/services/:airportCode', async (req, res) => {
    try {
      const { airportCode } = req.params;
      const services = await diversionSupport.getAvailableServices(airportCode);
      
      res.json({
        success: true,
        airport: airportCode,
        services,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Failed to get services for ${req.params.airportCode}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve available services',
        airport: req.params.airportCode,
        timestamp: new Date().toISOString()
      });
    }
  })

  // Cancel diversion support
  app.post('/api/diversion/cancel/:diversionId', async (req, res) => {
    try {
      const { diversionId } = req.params;
      const cancellationResult = await diversionSupport.cancelDiversionSupport(diversionId);
      
      res.json({
        success: true,
        diversionId,
        cancellation: cancellationResult,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Failed to cancel diversion ${req.params.diversionId}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel diversion support',
        diversionId: req.params.diversionId,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Geopolitical risk analysis endpoint
  app.get('/api/news/geopolitical-risk/:region', async (req, res) => {
    try {
      const { region } = req.params;
      const analysis = await newsApiService.getGeopoliticalRiskAnalysis(region);
      res.json({
        success: true,
        analysis,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Geopolitical risk analysis failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get geopolitical risk analysis',
        region: req.params.region,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Weather API endpoints
  app.get('/api/weather/current/:lat/:lon', async (req, res) => {
    try {
      const lat = parseFloat(req.params.lat);
      const lon = parseFloat(req.params.lon);
      
      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid coordinates provided'
        });
      }
      
      const weather = await weatherApiService.getCurrentWeather(lat, lon);
      res.json({
        success: true,
        weather,
        location: { lat, lon },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Weather API error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch weather data',
        timestamp: new Date().toISOString()
      });
    }
  })

  // Aviation weather endpoints
  app.get('/api/weather/aviation/:icao', async (req, res) => {
    try {
      const icao = req.params.icao.toUpperCase();
      
      if (!/^[A-Z]{4}$/.test(icao)) {
        return res.status(400).json({ success: false, error: 'Invalid ICAO code' });
      }
      
      const aviationWeather = await weatherApiService.getAviationWeather(icao);
      res.json({ success: true, data: aviationWeather });
    } catch (error) {
      console.error('Aviation weather API error:', error);
      res.status(500).json({ success: false, error: 'Aviation weather service unavailable' });
    }
  });

  // Sustainable Aviation Fuel endpoints
  app.get('/api/fuel/sustainable/:airportCode', async (req, res) => {
    try {
      const { airportCode } = req.params;
      const analysis = await sustainableFuelService.getComprehensiveFuelAnalysis(airportCode);
      
      res.json({
        success: true,
        airportCode,
        fuelAnalysis: analysis,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Sustainable fuel analysis failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze sustainable fuel availability',
        airportCode: req.params.airportCode,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get('/api/fuel/saf-stations/:lat/:lon', async (req, res) => {
    try {
      const lat = parseFloat(req.params.lat);
      const lon = parseFloat(req.params.lon);
      const radius = req.query.radius ? parseInt(req.query.radius as string) : 50;
      
      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid coordinates provided'
        });
      }
      
      const safData = await sustainableFuelService.getSAFStationsNearAirport(lat, lon, radius);
      
      res.json({
        success: true,
        location: { latitude: lat, longitude: lon, radius },
        safData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('SAF stations lookup failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to find SAF stations',
        timestamp: new Date().toISOString()
      });
    }
  });

  // OpenDataSoft comprehensive airport data endpoints
  app.get('/api/airports/comprehensive/:airportCode', async (req, res) => {
    try {
      const { airportCode } = req.params;
      const comprehensiveData = await openDataSoftService.getComprehensiveAirportData(airportCode);
      
      res.json({
        success: true,
        airportCode,
        data: comprehensiveData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Comprehensive airport data failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve comprehensive airport data',
        airportCode: req.params.airportCode,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get('/api/airports/search/:searchTerm', async (req, res) => {
    try {
      const { searchTerm } = req.params;
      const searchResults = await openDataSoftService.getAirportInformation(searchTerm);
      
      res.json({
        success: true,
        searchTerm,
        results: searchResults,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Airport search failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search airports',
        searchTerm: req.params.searchTerm,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get('/api/airports/statistics/:airportCode', async (req, res) => {
    try {
      const { airportCode } = req.params;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const statistics = await openDataSoftService.getAirportStatistics(airportCode, year);
      
      res.json({
        success: true,
        airportCode,
        year: year || new Date().getFullYear() - 1,
        statistics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Airport statistics failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve airport statistics',
        airportCode: req.params.airportCode,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get('/api/airports/airlines/:airportCode', async (req, res) => {
    try {
      const { airportCode } = req.params;
      const airlinesData = await openDataSoftService.getAirportAirlines(airportCode);
      
      res.json({
        success: true,
        airportCode,
        airlines: airlinesData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Airport airlines failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve airport airlines',
        airportCode: req.params.airportCode,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Major airports endpoint
  app.get('/api/airports/major', (req, res) => {
    try {
      res.json({ success: true, airports: majorAirports });
    } catch (error) {
      console.error('Airport data error:', error);
      res.status(500).json({ success: false, error: 'Airport data unavailable' });
    }
  });

  // Airports in bounds endpoint
  app.get('/api/airports/bounds', (req, res) => {
    try {
      const { north, south, east, west } = req.query;
      
      if (!north || !south || !east || !west) {
        return res.status(400).json({ success: false, error: 'Missing bounds parameters' });
      }
      
      const bounds = {
        north: parseFloat(north as string),
        south: parseFloat(south as string),
        east: parseFloat(east as string),
        west: parseFloat(west as string)
      };
      
      const { getAirportsInBounds } = require('../shared/airportData');
      const airports = getAirportsInBounds(bounds);
      
      res.json({ success: true, airports });
    } catch (error) {
      console.error('Airport bounds error:', error);
      res.status(500).json({ success: false, error: 'Airport data unavailable' });
    }
  });

  // Weather radar endpoint
  app.get('/api/weather/radar', async (req, res) => {
    try {
      const { north, south, east, west } = req.query;
      
      if (!north || !south || !east || !west) {
        return res.status(400).json({ success: false, error: 'Missing bounds parameters' });
      }
      
      const bounds = {
        north: parseFloat(north as string),
        south: parseFloat(south as string),
        east: parseFloat(east as string),
        west: parseFloat(west as string)
      };
      
      const radarData = await weatherApiService.getWeatherRadar(bounds);
      res.json({ success: true, radar: radarData });
    } catch (error) {
      console.error('Weather radar error:', error);
      res.status(500).json({ success: false, error: 'Weather radar unavailable' });
    }
  });

  // NASA satellite imagery endpoint
  app.get('/api/weather/satellite/nasa', async (req, res) => {
    try {
      const { layer } = req.query;
      const satelliteData = await weatherApiService.getNasaSatelliteLayer(layer as string);
      res.json({ success: true, satellite: satelliteData });
    } catch (error) {
      console.error('NASA satellite error:', error);
      res.status(500).json({ success: false, error: 'NASA satellite imagery unavailable' });
    }
  });

  // Comprehensive weather data endpoint
  app.get('/api/weather/comprehensive', async (req, res) => {
    try {
      const { north, south, east, west } = req.query;
      
      if (!north || !south || !east || !west) {
        return res.status(400).json({ success: false, error: 'Missing bounds parameters' });
      }
      
      const bounds = {
        north: parseFloat(north as string),
        south: parseFloat(south as string),
        east: parseFloat(east as string),
        west: parseFloat(west as string)
      };
      
      const comprehensiveData = await weatherApiService.getComprehensiveWeatherData(bounds);
      res.json({ success: true, data: comprehensiveData });
    } catch (error) {
      console.error('Comprehensive weather data error:', error);
      res.status(500).json({ success: false, error: 'Comprehensive weather data unavailable' });
    }
  });;

  app.get('/api/weather/test-connections', async (req, res) => {
    try {
      const results = await weatherApiService.testConnections();
      res.json({
        success: true,
        connections: results,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Weather API connection test failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to test weather API connections',
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get('/api/weather/alerts', async (req, res) => {
    try {
      const { north, south, east, west } = req.query;
      const bounds = {
        north: parseFloat(north as string),
        south: parseFloat(south as string),
        east: parseFloat(east as string),
        west: parseFloat(west as string)
      };
      
      const alerts = await weatherApiService.getWeatherAlerts(bounds);
      res.json({
        success: true,
        alerts,
        bounds,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Weather alerts error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch weather alerts',
        timestamp: new Date().toISOString()
      });
    }
  });

  return httpServer;
}

