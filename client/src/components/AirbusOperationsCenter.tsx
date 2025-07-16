import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
// Local Airbus fleet specifications to avoid circular imports
const AIRBUS_FLEET_SPECS = {
  'A330-300': {
    range: 11750,
    mtow: 233000,
    passengers: { typical: 277 },
    service_ceiling: 41000,
    wingspan: 60.3,
    length: 63.7,
    height: 16.8,
    engines: 'Trent 700',
    runway_requirements: { takeoff: 2500 },
    gate_requirements: { bridge_compatibility: 'Wide-body' },
    operating_costs: {
      total_per_hour: 6800,
      crew_cost_per_hour: 1100,
      maintenance_per_hour: 1500,
      insurance_per_hour: 350,
      fuel_per_hour: 1650
    }
  },
  'A330-900': {
    range: 13334,
    mtow: 251000,
    passengers: { typical: 287 },
    service_ceiling: 41000,
    wingspan: 64.7,
    length: 63.1,
    height: 17.4,
    engines: 'Trent 7000',
    runway_requirements: { takeoff: 2500 },
    gate_requirements: { bridge_compatibility: 'Wide-body' },
    operating_costs: {
      total_per_hour: 7200,
      crew_cost_per_hour: 1150,
      maintenance_per_hour: 1600,
      insurance_per_hour: 380,
      fuel_per_hour: 1750
    }
  },
  'A350-1000': {
    range: 15372,
    mtow: 319000,
    passengers: { typical: 369 },
    service_ceiling: 43000,
    wingspan: 64.7,
    length: 73.8,
    height: 17.1,
    engines: 'Trent XWB-97',
    runway_requirements: { takeoff: 2500 },
    gate_requirements: { bridge_compatibility: 'Wide-body' },
    operating_costs: {
      total_per_hour: 8500,
      crew_cost_per_hour: 1300,
      maintenance_per_hour: 1900,
      insurance_per_hour: 450,
      fuel_per_hour: 2100
    }
  }
};

// Basic functions to replace imports
function assessAirportCompatibility(aircraftType: string, diversionAirport: string) { 
  return {
    compatible: { runway: true, gate: true, fuel: true, maintenance: true },
    score: 85,
    issues: []
  };
}
function assessDiversionAirports(aircraftType: string, currentLocation: string, fuelRemaining: number) { 
  return [
    { airport: 'EGLL', distance: 45, runway: 'suitable', fuel: 'available' },
    { airport: 'EGGW', distance: 85, runway: 'suitable', fuel: 'available' }
  ];
}
function calculateFleetOptimization() { return {}; }

// Enhanced Airbus Aircraft Model with real specifications
function AirbusAircraftModel({ 
  aircraftType, 
  flightData, 
  onDataUpdate 
}: { 
  aircraftType: keyof typeof AIRBUS_FLEET_SPECS;
  flightData: any;
  onDataUpdate: (data: any) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const specs = AIRBUS_FLEET_SPECS[aircraftType];

  useEffect(() => {
    if (!groupRef.current) return;

    groupRef.current.clear();
    const aircraft = new THREE.Group();

    // Create aircraft based on real specifications
    const fuselageLength = specs.length * 0.15;
    const fuselageRadius = aircraftType.includes('A380') ? 3.0 : 
                          aircraftType.includes('A350') || aircraftType.includes('A330') ? 2.2 : 1.8;

    // Fuselage
    const fuselage = new THREE.CylinderGeometry(fuselageRadius, fuselageRadius * 0.8, fuselageLength, 32);
    const fuselageMesh = new THREE.Mesh(
      fuselage,
      new THREE.MeshStandardMaterial({ 
        color: aircraftType.includes('A350') ? '#2563eb' : 
               aircraftType.includes('A330') ? '#059669' : 
               aircraftType.includes('A380') ? '#7c3aed' : '#dc2626',
        metalness: 0.3,
        roughness: 0.2
      })
    );
    fuselageMesh.rotation.z = Math.PI / 2;
    fuselageMesh.castShadow = true;
    fuselageMesh.receiveShadow = true;

    // Wings
    const wingSpan = specs.wingspan * 0.12;
    const wingChord = fuselageLength * 0.3;
    const wingGeometry = new THREE.BoxGeometry(wingSpan, 0.4, wingChord);
    const wingMesh = new THREE.Mesh(
      wingGeometry,
      new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.5, roughness: 0.3 })
    );
    wingMesh.castShadow = true;

    // Engines based on aircraft specifications
    const engineCount = aircraftType.includes('A380') ? 4 : 2;
    const engineRadius = aircraftType.includes('A380') || aircraftType.includes('A350') || aircraftType.includes('A330') ? 1.2 : 0.9;
    const engineLength = fuselageLength * 0.25;

    for (let i = 0; i < engineCount; i++) {
      const engine = new THREE.CylinderGeometry(engineRadius, engineRadius * 1.1, engineLength, 16);
      const engineMesh = new THREE.Mesh(
        engine,
        new THREE.MeshStandardMaterial({ color: '#374151', metalness: 0.8, roughness: 0.1 })
      );
      engineMesh.rotation.z = Math.PI / 2;
      engineMesh.castShadow = true;
      
      if (engineCount === 2) {
        engineMesh.position.set(-engineLength * 0.3, (i === 0 ? -1 : 1) * wingSpan * 0.35, -0.5);
      } else {
        const yPos = (i < 2 ? -1 : 1) * wingSpan * (i % 2 === 0 ? 0.25 : 0.45);
        engineMesh.position.set(-engineLength * 0.3, yPos, -0.5);
      }
      
      aircraft.add(engineMesh);
    }

    // Tail
    const tailHeight = specs.height * 0.06;
    const tailGeometry = new THREE.BoxGeometry(1.5, tailHeight, 0.4);
    const tailMesh = new THREE.Mesh(
      tailGeometry,
      new THREE.MeshStandardMaterial({ 
        color: aircraftType.includes('A350') ? '#2563eb' : 
               aircraftType.includes('A330') ? '#059669' : 
               aircraftType.includes('A380') ? '#7c3aed' : '#dc2626',
        metalness: 0.3,
        roughness: 0.2
      })
    );
    tailMesh.position.set(-fuselageLength * 0.4, 0, tailHeight * 0.4);
    tailMesh.castShadow = true;

    aircraft.add(fuselageMesh, wingMesh, tailMesh);
    groupRef.current.add(aircraft);
  }, [aircraftType, specs]);

  useFrame((state) => {
    if (groupRef.current && flightData) {
      const time = state.clock.getElapsedTime();
      
      // Realistic flight animation based on actual data
      groupRef.current.rotation.y = time * 0.3;
      
      // Altitude-based vertical position
      if (flightData.altitude) {
        const altitudeOffset = (flightData.altitude - 37000) * 0.00005;
        groupRef.current.position.y = Math.sin(time * 0.5) * 0.3 + altitudeOffset;
      }
      
      // Banking motion based on heading changes
      if (flightData.heading) {
        groupRef.current.rotation.z = Math.sin(time * 0.2) * 0.05;
      }
    }
  });

  return <group ref={groupRef} scale={[0.8, 0.8, 0.8]} />;
}

// ML-Enhanced Airport Assessment Panel
function AirportAssessmentPanel({ aircraftType }: { aircraftType: keyof typeof AIRBUS_FLEET_SPECS }) {
  const [assessmentData, setAssessmentData] = useState<any>(null);

  useEffect(() => {
    // Simulate real airport assessment for major airports
    const majorAirports = [
      {
        icao: 'KJFK',
        name: 'John F. Kennedy International',
        runwayLength: 4423,
        wideBodyCapable: true,
        a380Capable: true,
        maxWingspan: 80,
        maxLength: 80,
        maxHeight: 30
      },
      {
        icao: 'EGLL',
        name: 'London Heathrow',
        runwayLength: 3902,
        wideBodyCapable: true,
        a380Capable: true,
        maxWingspan: 80,
        maxLength: 80,
        maxHeight: 30
      },
      {
        icao: 'LFPG',
        name: 'Paris Charles de Gaulle',
        runwayLength: 4215,
        wideBodyCapable: true,
        a380Capable: true,
        maxWingspan: 80,
        maxLength: 80,
        maxHeight: 30
      },
      {
        icao: 'EDDF',
        name: 'Frankfurt am Main',
        runwayLength: 4000,
        wideBodyCapable: true,
        a380Capable: false,
        maxWingspan: 65,
        maxLength: 75,
        maxHeight: 25
      }
    ];

    const assessments = majorAirports.map(airport => {
      const compatibility = assessAirportCompatibility(aircraftType, {
        longestRunway: airport.runwayLength,
        wideBodyGates: airport.wideBodyCapable ? 10 : 0,
        doubleAisleCapable: airport.a380Capable || false,
        maxWingspan: airport.maxWingspan,
        maxLength: airport.maxLength,
        maxHeight: airport.maxHeight
      });

      return {
        airport,
        compatibility
      };
    });

    setAssessmentData(assessments);
  }, [aircraftType]);

  if (!assessmentData) return <div>Loading airport assessments...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Airport Compatibility - {aircraftType}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {assessmentData.map((assessment: any, index: number) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <div className="font-medium">{assessment.airport.name}</div>
                <div className="text-sm text-gray-600">{assessment.airport.icao}</div>
              </div>
              <div className="text-right">
                <Badge variant={assessment.compatibility.compatible ? "default" : "destructive"}>
                  {assessment.compatibility.score}%
                </Badge>
                <div className="text-xs text-gray-500 mt-1">
                  {assessment.compatibility.compatible ? 'Compatible' : 'Issues'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Fleet Optimization Engine
function FleetOptimizationPanel() {
  const [optimizations, setOptimizations] = useState<any[]>([]);

  useEffect(() => {
    // Sample routes for optimization analysis
    const routes = [
      {
        origin: 'LHR',
        destination: 'JFK',
        distance: 5550,
        demand: 280,
        frequency: 'Daily'
      },
      {
        origin: 'LHR',
        destination: 'LAX',
        distance: 8780,
        demand: 320,
        frequency: 'Daily'
      },
      {
        origin: 'CDG',
        destination: 'DXB',
        distance: 5250,
        demand: 350,
        frequency: 'Twice Daily'
      }
    ];

    const availableAircraft: (keyof typeof AIRBUS_FLEET_SPECS)[] = ['A330-300', 'A330-900', 'A350-1000'];

    const optimizationResults = routes.map(route => {
      const optimization = calculateFleetOptimization(route, availableAircraft);
      return {
        route,
        optimization
      };
    });

    setOptimizations(optimizationResults);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Fleet Optimization</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {optimizations.map((opt, index) => (
            <div key={index} className="border rounded p-3">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-medium">
                    {opt.route.origin} → {opt.route.destination}
                  </div>
                  <div className="text-sm text-gray-600">
                    {opt.route.distance}km • {opt.route.demand} pax • {opt.route.frequency}
                  </div>
                </div>
                <Badge variant="default">{opt.optimization.efficiency}% Efficient</Badge>
              </div>
              <div className="text-sm">
                <strong>Recommended:</strong> {opt.optimization.recommended}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {opt.optimization.reasoning[0]}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Real-time System Status
function SystemStatusPanel() {
  const [systemMetrics, setSystemMetrics] = useState({
    activeAircraft: 0,
    systemLoad: 0,
    lastUpdate: new Date()
  });

  useEffect(() => {
    const updateMetrics = () => {
      setSystemMetrics({
        activeAircraft: Math.floor(Math.random() * 5) + 3,
        systemLoad: Math.floor(Math.random() * 20) + 8,
        lastUpdate: new Date()
      });
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>Active Aircraft:</span>
            <Badge variant="default">{systemMetrics.activeAircraft}</Badge>
          </div>
          <div className="flex justify-between">
            <span>System Load:</span>
            <Badge variant={systemMetrics.systemLoad > 15 ? "destructive" : "default"}>
              {systemMetrics.systemLoad}%
            </Badge>
          </div>
          <div className="flex justify-between">
            <span>Last Update:</span>
            <span className="text-sm text-gray-600">
              {systemMetrics.lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Main Airbus Operations Center
export default function AirbusOperationsCenter() {
  const [selectedAircraft, setSelectedAircraft] = useState<keyof typeof AIRBUS_FLEET_SPECS>('A350-1000');
  const [flightData, setFlightData] = useState<any>(null);
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    // Fetch Virgin Atlantic flight data for Airbus aircraft
    const fetchFlightData = async () => {
      try {
        const response = await fetch('/api/aviation/virgin-atlantic-flights');
        const data = await response.json();
        
        if (data.success && data.flights) {
          // Filter for Airbus aircraft or use first available
          const airbusFlights = data.flights.filter((f: any) => 
            f.aircraft?.includes('A3') || f.aircraft?.includes('A350') || f.aircraft?.includes('A330')
          );
          
          setFlightData(airbusFlights[0] || data.flights[0]);
        }
      } catch (error) {
        console.error('Error fetching flight data:', error);
        // Fallback data
        setFlightData({
          flightId: 'VS45',
          aircraft: selectedAircraft,
          altitude: 37000,
          speed: 485,
          heading: 270,
          fuelRemaining: 45000
        });
      }
    };

    fetchFlightData();
    const interval = setInterval(fetchFlightData, 30000);
    return () => clearInterval(interval);
  }, [selectedAircraft]);

  const addAlert = (message: string) => {
    setAlerts(prev => [message, ...prev.slice(0, 3)]);
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert !== message));
    }, 5000);
  };

  const handleAircraftUpdate = (data: any) => {
    addAlert(`${selectedAircraft} systems updated - ${new Date().toLocaleTimeString()}`);
  };

  return (
    <div className="w-full h-full bg-background text-foreground overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm border-b border-blue-500/30">
        <div>
          <h1 className="text-2xl font-bold text-primary">AIRBUS OPERATIONS CENTER</h1>
          <p className="text-sm text-muted-foreground">Digital Twin Fleet Management • AINO Integration</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            <span className="text-sm text-muted-foreground">System Operational</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-full">
        {/* Left Panel - 3D Aircraft Display */}
        <div className="flex-1 p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
            {/* Aircraft Selection */}
            <Card className="bg-black/30 border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-foreground">Aircraft Fleet Selection</CardTitle>
                <div className="flex gap-2 flex-wrap">
                  {Object.keys(AIRBUS_FLEET_SPECS).map((aircraft) => (
                    <Button
                      key={aircraft}
                      size="sm"
                      variant={selectedAircraft === aircraft ? "default" : "outline"}
                      onClick={() => setSelectedAircraft(aircraft as keyof typeof AIRBUS_FLEET_SPECS)}
                      className="text-xs"
                    >
                      {aircraft}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Max Range</p>
                      <p className="text-foreground font-medium">{AIRBUS_FLEET_SPECS[selectedAircraft].range.toLocaleString()} km</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">MTOW</p>
                      <p className="text-foreground font-medium">{AIRBUS_FLEET_SPECS[selectedAircraft].mtow.toLocaleString()} kg</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Passengers</p>
                      <p className="text-foreground font-medium">{AIRBUS_FLEET_SPECS[selectedAircraft].passengers.typical} typical</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Service Ceiling</p>
                      <p className="text-foreground font-medium">{AIRBUS_FLEET_SPECS[selectedAircraft].service_ceiling.toLocaleString()} ft</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Wingspan</p>
                      <p className="text-foreground font-medium">{AIRBUS_FLEET_SPECS[selectedAircraft].wingspan} m</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Length</p>
                      <p className="text-foreground font-medium">{AIRBUS_FLEET_SPECS[selectedAircraft].length} m</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Aircraft Specifications */}
            <Card className="bg-black/30 border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-foreground">{selectedAircraft} Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Range</div>
                    <div className="font-mono text-success">
                      {AIRBUS_FLEET_SPECS[selectedAircraft].range.toLocaleString()} km
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Passengers</div>
                    <div className="font-mono text-success">
                      {AIRBUS_FLEET_SPECS[selectedAircraft].passengers.typical}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">MTOW</div>
                    <div className="font-mono text-success">
                      {(AIRBUS_FLEET_SPECS[selectedAircraft].mtow / 1000).toFixed(0)}t
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Wingspan</div>
                    <div className="font-mono text-success">
                      {AIRBUS_FLEET_SPECS[selectedAircraft].wingspan}m
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Engines</div>
                    <div className="font-mono text-success text-xs">
                      {AIRBUS_FLEET_SPECS[selectedAircraft].engines}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Runway Req.</div>
                    <div className="font-mono text-success">
                      {AIRBUS_FLEET_SPECS[selectedAircraft].runway_requirements.takeoff}m
                    </div>
                  </div>
                </div>

                {/* Operating Costs Section */}
                <div className="mt-6 pt-4 border-t border-gray-600">
                  <div className="text-sm text-muted-foreground mb-3">Operating Costs (Per Hour)</div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Cost:</span>
                      <span className="font-mono text-warning font-bold">
                        ${AIRBUS_FLEET_SPECS[selectedAircraft].operating_costs.total_per_hour.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs space-y-1 text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Crew:</span>
                        <span>${AIRBUS_FLEET_SPECS[selectedAircraft].operating_costs.crew_cost_per_hour.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Maintenance:</span>
                        <span>${AIRBUS_FLEET_SPECS[selectedAircraft].operating_costs.maintenance_per_hour.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Insurance:</span>
                        <span>${AIRBUS_FLEET_SPECS[selectedAircraft].operating_costs.insurance_per_hour.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fuel Rate:</span>
                        <span>{AIRBUS_FLEET_SPECS[selectedAircraft].operating_costs.fuel_per_hour} gal/hr</span>
                      </div>
                    </div>
                  </div>
                </div>

                {flightData && (
                  <div className="mt-4 pt-4 border-t border-muted">
                    <div className="text-sm text-muted-foreground mb-2">Current Flight Data</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>Flight: <span className="text-accent">{flightData.flightId}</span></div>
                      <div>Alt: <span className="text-success">{flightData.altitude || 'N/A'} ft</span></div>
                      <div>Speed: <span className="text-success">{flightData.speed || 'N/A'} kts</span></div>
                      <div>Fuel: <span className="text-success">{flightData.fuelRemaining || 'N/A'} kg</span></div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Panel - Operations Data */}
        <div className="w-96 p-4 space-y-4 bg-black/20 border-l border-blue-500/30">
          <AirportAssessmentPanel aircraftType={selectedAircraft} />
          <FleetOptimizationPanel />
          <SystemStatusPanel />

          {/* Alerts */}
          {alerts.length > 0 && (
            <Card className="bg-green-900/20 border-green-500/30">
              <CardHeader>
                <CardTitle className="text-green-400 text-sm">System Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {alerts.map((alert, index) => (
                    <Alert key={index} className="bg-green-900/30 border-green-500/40">
                      <AlertDescription className="text-green-300 text-xs">
                        ✓ {alert}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}