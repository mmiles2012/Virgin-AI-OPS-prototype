import { spawn } from 'child_process';
import * as path from 'path';

export interface ScenarioRequest {
  aircraftType: string;
  origin: string;
  destination: string;
  positionNm: number;
  altitudeFt: number;
  registration?: string;
  flightNumber?: string;
  failureType: 'engine_failure' | 'decompression' | 'hydraulic_failure' | 'single_engine_landing';
}

export interface ScenarioResult {
  scenarioId: string;
  timestamp: string;
  aircraft: {
    type: string;
    registration: string;
    flightNumber: string;
  };
  route: {
    origin: string;
    destination: string;
    totalDistanceNm: number;
    completedDistanceNm: number;
    remainingDistanceNm: number;
    progressPercent: number;
  };
  failure: {
    type: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  };
  position: {
    distanceFromOriginNm: number;
    initialAltitudeFt: number;
    adjustedAltitudeFt: number;
    phaseOfFlight: string;
  };
  operationalImpact: {
    fuelPenaltyFactor: number;
    landingDistanceFactor: number;
    speedRestrictionKnots?: number;
    diversionRequired: boolean;
    emergencyDescentRequired: boolean;
  };
  systemsAffected: any;
  crewActions: string[];
  operationalNotes: string[];
  diversionAnalysis: any;
  fuelAnalysis: any;
  passengerImpact: any;
  regulatoryConsiderations: string[];
  ainoRecommendations: string[];
}

class ScenarioSimulatorService {
  private pythonPath: string;
  private simulatorPath: string;

  constructor() {
    this.pythonPath = 'python3';
    this.simulatorPath = path.join(process.cwd(), 'enhanced_scenario_simulator.py');
    console.log('[Scenario Simulator] Service initialized');
  }

  async simulateFailureScenario(request: ScenarioRequest): Promise<ScenarioResult> {
    return new Promise((resolve, reject) => {
      console.log(`[Scenario Simulator] Running failure simulation for ${request.aircraftType} - ${request.failureType}`);
      
      // Create Python script arguments
      const args = [
        '-c',
        `
import sys
sys.path.append('${process.cwd()}')
from enhanced_scenario_simulator import EnhancedScenarioSimulator
import json

try:
    sim = EnhancedScenarioSimulator(
        aircraft_type='${request.aircraftType}',
        origin='${request.origin}',
        destination='${request.destination}',
        position_nm_from_origin=${request.positionNm},
        altitude_ft=${request.altitudeFt},
        registration='${request.registration || 'UNKNOWN'}',
        flight_number='${request.flightNumber || 'UNKNOWN'}'
    )
    
    result = sim.simulate_failure('${request.failureType}')
    print('SCENARIO_RESULT_START')
    print(json.dumps(result, indent=2))
    print('SCENARIO_RESULT_END')
    
except Exception as e:
    print(f'SCENARIO_ERROR: {str(e)}')
    sys.exit(1)
        `
      ];

      const pythonProcess = spawn(this.pythonPath, args, {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error(`[Scenario Simulator] Python process exited with code ${code}`);
          console.error(`[Scenario Simulator] stderr: ${stderr}`);
          reject(new Error(`Scenario simulation failed: ${stderr}`));
          return;
        }

        try {
          // Extract JSON result from stdout
          const startMarker = 'SCENARIO_RESULT_START';
          const endMarker = 'SCENARIO_RESULT_END';
          const startIndex = stdout.indexOf(startMarker);
          const endIndex = stdout.indexOf(endMarker);
          
          if (startIndex === -1 || endIndex === -1) {
            throw new Error('Could not find scenario result markers in output');
          }
          
          const jsonStr = stdout.substring(startIndex + startMarker.length, endIndex).trim();
          const result = JSON.parse(jsonStr);
          
          // Convert snake_case to camelCase for TypeScript compatibility
          const formattedResult = this.formatScenarioResult(result);
          
          console.log(`[Scenario Simulator] ✓ Simulation complete: ${result.failure.type} - ${result.failure.severity}`);
          resolve(formattedResult);
          
        } catch (error) {
          console.error(`[Scenario Simulator] Error parsing result: ${error}`);
          reject(error);
        }
      });

      pythonProcess.on('error', (error) => {
        console.error(`[Scenario Simulator] Process error: ${error}`);
        reject(error);
      });
    });
  }

  private formatScenarioResult(pythonResult: any): ScenarioResult {
    return {
      scenarioId: pythonResult.scenario_id,
      timestamp: pythonResult.timestamp,
      aircraft: {
        type: pythonResult.aircraft.type,
        registration: pythonResult.aircraft.registration,
        flightNumber: pythonResult.aircraft.flight_number
      },
      route: {
        origin: pythonResult.route.origin,
        destination: pythonResult.route.destination,
        totalDistanceNm: pythonResult.route.total_distance_nm,
        completedDistanceNm: pythonResult.route.completed_distance_nm,
        remainingDistanceNm: pythonResult.route.remaining_distance_nm,
        progressPercent: pythonResult.route.progress_percent
      },
      failure: {
        type: pythonResult.failure.type,
        description: pythonResult.failure.description,
        severity: pythonResult.failure.severity
      },
      position: {
        distanceFromOriginNm: pythonResult.position.distance_from_origin_nm,
        initialAltitudeFt: pythonResult.position.initial_altitude_ft,
        adjustedAltitudeFt: pythonResult.position.adjusted_altitude_ft,
        phaseOfFlight: pythonResult.position.phase_of_flight
      },
      operationalImpact: {
        fuelPenaltyFactor: pythonResult.operational_impact.fuel_penalty_factor,
        landingDistanceFactor: pythonResult.operational_impact.landing_distance_factor,
        speedRestrictionKnots: pythonResult.operational_impact.speed_restriction_knots,
        diversionRequired: pythonResult.operational_impact.diversion_required,
        emergencyDescentRequired: pythonResult.operational_impact.emergency_descent_required
      },
      systemsAffected: pythonResult.systems_affected,
      crewActions: pythonResult.crew_actions,
      operationalNotes: pythonResult.operational_notes,
      diversionAnalysis: pythonResult.diversion_analysis,
      fuelAnalysis: pythonResult.fuel_analysis,
      passengerImpact: pythonResult.passenger_impact,
      regulatoryConsiderations: pythonResult.regulatory_considerations,
      ainoRecommendations: pythonResult.aino_recommendations
    };
  }

  async getAvailableAircraftTypes(): Promise<string[]> {
    return ['A350-1000', 'B787-9', 'A330-300', 'A330-900'];
  }

  async getAvailableFailureTypes(): Promise<string[]> {
    return ['engine_failure', 'decompression', 'hydraulic_failure', 'single_engine_landing'];
  }

  async getScenarioHistory(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const args = [
        '-c',
        `
import os
import glob

scenario_files = glob.glob('scenario_*.json')
print('\\n'.join(sorted(scenario_files, reverse=True)[:10]))  # Last 10 scenarios
        `
      ];

      const pythonProcess = spawn(this.pythonPath, args, {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error('Failed to retrieve scenario history'));
          return;
        }

        const files = stdout.trim().split('\n').filter(f => f.length > 0);
        resolve(files);
      });
    });
  }
}

export const scenarioSimulatorService = new ScenarioSimulatorService();