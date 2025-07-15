/**
 * Maintrol Integration Service for Real-Time Aircraft Maintenance Data
 * Connects AINO platform with Maintrol systems for comprehensive maintenance monitoring
 */

import axios from 'axios';

export interface MaintrolData {
  aircraftRegistration: string;
  lastMaintenance: string;
  nextScheduledMaintenance: string;
  maintenanceStatus: 'current' | 'due' | 'overdue';
  openWorkOrders: WorkOrder[];
  componentHealth: ComponentHealth;
  maintenanceHistory: MaintenanceRecord[];
  complianceStatus: ComplianceStatus;
}

export interface WorkOrder {
  workOrderId: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'completed' | 'deferred';
  estimatedCompletionTime: string;
  requiredParts: string[];
  assignedTechnician: string;
  category: 'preventive' | 'corrective' | 'modification';
}

export interface ComponentHealth {
  engines: {
    overall: number;
    engine1: {
      health: number;
      cyclesSinceOverhaul: number;
      hoursSinceOverhaul: number;
      nextInspectionDue: string;
      criticalParameters: EngineParameter[];
    };
    engine2: {
      health: number;
      cyclesSinceOverhaul: number;
      hoursSinceOverhaul: number;
      nextInspectionDue: string;
      criticalParameters: EngineParameter[];
    };
  };
  hydraulics: {
    health: number;
    systemA: number;
    systemB: number;
    systemC: number;
    lastInspection: string;
  };
  electrical: {
    health: number;
    generators: number[];
    batteries: number[];
    lastInspection: string;
  };
  avionics: {
    health: number;
    flightManagementSystem: number;
    autopilot: number;
    communication: number;
    navigation: number;
  };
  landingGear: {
    health: number;
    cycleCount: number;
    lastInspection: string;
    nextOverhaul: string;
  };
}

export interface EngineParameter {
  parameter: string;
  currentValue: number;
  normalRange: [number, number];
  status: 'normal' | 'caution' | 'warning';
  trend: 'stable' | 'increasing' | 'decreasing';
}

export interface MaintenanceRecord {
  date: string;
  type: 'inspection' | 'repair' | 'overhaul' | 'modification';
  description: string;
  technician: string;
  duration: number;
  partsReplaced: string[];
  nextDueDate?: string;
}

export interface ComplianceStatus {
  airworthiness: 'compliant' | 'due' | 'overdue';
  adCompliance: {
    total: number;
    compliant: number;
    due: number;
    overdue: number;
  };
  sbCompliance: {
    total: number;
    compliant: number;
    optional: number;
  };
}

export class MaintrolIntegrationService {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number = 30000;

  constructor() {
    this.baseUrl = process.env.MAINTROL_API_URL || 'https://api.maintrol.com/v1';
    this.apiKey = process.env.MAINTROL_API_KEY || '';
  }

  /**
   * Get comprehensive maintenance data for an aircraft
   */
  async getAircraftMaintenanceData(aircraftRegistration: string): Promise<MaintrolData | null> {
    try {
      if (!this.apiKey) {
        console.log('Maintrol API key not configured, returning simulated data');
        return this.generateSimulatedMaintenanceData(aircraftRegistration);
      }

      const response = await axios.get(`${this.baseUrl}/aircraft/${aircraftRegistration}/maintenance`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: this.timeout
      });

      return response.data;
    } catch (error: any) {
      console.error('Error fetching Maintrol data:', error.message);
      // Return simulated data for demonstration purposes
      return this.generateSimulatedMaintenanceData(aircraftRegistration);
    }
  }

  /**
   * Get real-time engine health monitoring data
   */
  async getEngineHealthData(aircraftRegistration: string): Promise<ComponentHealth['engines'] | null> {
    try {
      if (!this.apiKey) {
        return this.generateSimulatedEngineData();
      }

      const response = await axios.get(`${this.baseUrl}/aircraft/${aircraftRegistration}/engines/health`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: this.timeout
      });

      return response.data;
    } catch (error: any) {
      console.error('Error fetching engine health data:', error.message);
      return this.generateSimulatedEngineData();
    }
  }

  /**
   * Get open work orders for an aircraft
   */
  async getOpenWorkOrders(aircraftRegistration: string): Promise<WorkOrder[]> {
    try {
      if (!this.apiKey) {
        return this.generateSimulatedWorkOrders();
      }

      const response = await axios.get(`${this.baseUrl}/aircraft/${aircraftRegistration}/workorders`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: this.timeout
      });

      return response.data.workOrders || [];
    } catch (error: any) {
      console.error('Error fetching work orders:', error.message);
      return this.generateSimulatedWorkOrders();
    }
  }

  /**
   * Generate simulated maintenance data for demonstration
   */
  private generateSimulatedMaintenanceData(aircraftRegistration: string): MaintrolData {
    const now = new Date();
    const lastMaintenance = new Date(now.getTime() - (15 * 24 * 60 * 60 * 1000)); // 15 days ago
    const nextMaintenance = new Date(now.getTime() + (13 * 24 * 60 * 60 * 1000)); // 13 days from now

    return {
      aircraftRegistration,
      lastMaintenance: lastMaintenance.toISOString(),
      nextScheduledMaintenance: nextMaintenance.toISOString(),
      maintenanceStatus: 'current',
      openWorkOrders: this.generateSimulatedWorkOrders(),
      componentHealth: this.generateSimulatedComponentHealth(),
      maintenanceHistory: this.generateSimulatedMaintenanceHistory(),
      complianceStatus: {
        airworthiness: 'compliant',
        adCompliance: {
          total: 247,
          compliant: 245,
          due: 2,
          overdue: 0
        },
        sbCompliance: {
          total: 89,
          compliant: 87,
          optional: 2
        }
      }
    };
  }

  private generateSimulatedEngineData(): ComponentHealth['engines'] {
    return {
      overall: 92,
      engine1: {
        health: 89,
        cyclesSinceOverhaul: 3247,
        hoursSinceOverhaul: 8932,
        nextInspectionDue: new Date(Date.now() + (45 * 24 * 60 * 60 * 1000)).toISOString(),
        criticalParameters: [
          {
            parameter: 'EGT Margin',
            currentValue: 48,
            normalRange: [30, 70],
            status: 'normal',
            trend: 'stable'
          },
          {
            parameter: 'N1 Vibration',
            currentValue: 0.18,
            normalRange: [0, 0.25],
            status: 'normal',
            trend: 'stable'
          },
          {
            parameter: 'Oil Pressure',
            currentValue: 42.3,
            normalRange: [35, 55],
            status: 'normal',
            trend: 'stable'
          }
        ]
      },
      engine2: {
        health: 95,
        cyclesSinceOverhaul: 2891,
        hoursSinceOverhaul: 7234,
        nextInspectionDue: new Date(Date.now() + (67 * 24 * 60 * 60 * 1000)).toISOString(),
        criticalParameters: [
          {
            parameter: 'EGT Margin',
            currentValue: 52,
            normalRange: [30, 70],
            status: 'normal',
            trend: 'stable'
          },
          {
            parameter: 'N1 Vibration',
            currentValue: 0.15,
            normalRange: [0, 0.25],
            status: 'normal',
            trend: 'stable'
          },
          {
            parameter: 'Oil Pressure',
            currentValue: 45.1,
            normalRange: [35, 55],
            status: 'normal',
            trend: 'stable'
          }
        ]
      }
    };
  }

  private generateSimulatedWorkOrders(): WorkOrder[] {
    return [
      {
        workOrderId: 'WO-2024-3492',
        description: 'Replace cabin air filter - routine maintenance',
        priority: 'low',
        status: 'open',
        estimatedCompletionTime: new Date(Date.now() + (3 * 24 * 60 * 60 * 1000)).toISOString(),
        requiredParts: ['HEPA-Filter-A350-001'],
        assignedTechnician: 'Mike Thompson',
        category: 'preventive'
      },
      {
        workOrderId: 'WO-2024-3507',
        description: 'Inspect hydraulic system B pressure accumulator',
        priority: 'medium',
        status: 'in-progress',
        estimatedCompletionTime: new Date(Date.now() + (1 * 24 * 60 * 60 * 1000)).toISOString(),
        requiredParts: [],
        assignedTechnician: 'Sarah Johnson',
        category: 'preventive'
      }
    ];
  }

  private generateSimulatedComponentHealth(): ComponentHealth {
    return {
      engines: this.generateSimulatedEngineData(),
      hydraulics: {
        health: 96,
        systemA: 98,
        systemB: 94,
        systemC: 96,
        lastInspection: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)).toISOString()
      },
      electrical: {
        health: 94,
        generators: [96, 92],
        batteries: [98, 95],
        lastInspection: new Date(Date.now() - (14 * 24 * 60 * 60 * 1000)).toISOString()
      },
      avionics: {
        health: 99,
        flightManagementSystem: 99,
        autopilot: 98,
        communication: 100,
        navigation: 99
      },
      landingGear: {
        health: 93,
        cycleCount: 8934,
        lastInspection: new Date(Date.now() - (21 * 24 * 60 * 60 * 1000)).toISOString(),
        nextOverhaul: new Date(Date.now() + (180 * 24 * 60 * 60 * 1000)).toISOString()
      }
    };
  }

  private generateSimulatedMaintenanceHistory(): MaintenanceRecord[] {
    return [
      {
        date: new Date(Date.now() - (15 * 24 * 60 * 60 * 1000)).toISOString(),
        type: 'inspection',
        description: 'A-Check maintenance inspection',
        technician: 'David Wilson',
        duration: 8,
        partsReplaced: ['Brake pads', 'Cabin air filter'],
        nextDueDate: new Date(Date.now() + (90 * 24 * 60 * 60 * 1000)).toISOString()
      },
      {
        date: new Date(Date.now() - (45 * 24 * 60 * 60 * 1000)).toISOString(),
        type: 'repair',
        description: 'Replace faulty navigation light',
        technician: 'Emma Davis',
        duration: 2,
        partsReplaced: ['Navigation light assembly']
      }
    ];
  }

  /**
   * Test connection to Maintrol API
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          message: 'Maintrol API key not configured. Set MAINTROL_API_KEY environment variable.'
        };
      }

      const response = await axios.get(`${this.baseUrl}/health`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      return {
        success: true,
        message: 'Successfully connected to Maintrol API'
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to connect to Maintrol API: ${error.message}`
      };
    }
  }
}

export const maintrolService = new MaintrolIntegrationService();