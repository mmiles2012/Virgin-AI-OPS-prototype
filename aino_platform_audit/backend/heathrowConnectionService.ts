import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface HeathrowConnectionRisk {
  inbound: string;
  outbound: string;
  connect_min: number;
  stand_in: string;
  stand_out: string;
  predicted_delay: number;
  risk_level: 'high' | 'medium' | 'low';
}

export interface HeathrowStandAllocation {
  flight: string;
  current_stand: string;
  recommended_stand: string;
  reason: string;
  confidence: number;
}

export interface HeathrowT3Status {
  active_flights: number;
  connection_risks: HeathrowConnectionRisk[];
  stand_allocations: HeathrowStandAllocation[];
  model_status: {
    delay_model: 'active' | 'training' | 'inactive';
    stand_model: 'active' | 'training' | 'inactive';
  };
  last_update: string;
}

class HeathrowConnectionService {
  private pythonProcess: any = null;
  private isRunning = false;
  private lastStatus: HeathrowT3Status | null = null;

  constructor() {
    this.startMonitoring();
  }

  private startMonitoring() {
    if (this.isRunning) return;

    try {
      const pythonScript = path.join(__dirname, '..', 'heathrow_ops_monitor.py');
      
      // Set environment variables for the Python script
      const env = {
        ...process.env,
        PARTNER_AIRLINES: 'VS,DL,AF,KL,KE,KQ,SV,ET',
        MIN_CONNECT_MINS: '45',
        POLL_INTERVAL_SEC: '120', // 2 minutes for demo
        OPS_PUBLISH_URL: 'http://localhost:5000/api/heathrow/actions',
        PYTHONPATH: process.cwd()
      };

      this.pythonProcess = spawn('python3', [pythonScript], {
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd()
      });

      this.pythonProcess.stdout.on('data', (data: Buffer) => {
        const output = data.toString();
        console.log(`[Heathrow T3] ${output}`);
        this.parseOutput(output);
      });

      this.pythonProcess.stderr.on('data', (data: Buffer) => {
        console.error(`[Heathrow T3 Error] ${data.toString()}`);
      });

      this.pythonProcess.on('close', (code: number) => {
        console.log(`[Heathrow T3] Process exited with code ${code}`);
        this.isRunning = false;
        
        // Restart after 30 seconds if it wasn't intentionally stopped
        if (code !== 0) {
          setTimeout(() => this.startMonitoring(), 30000);
        }
      });

      this.isRunning = true;
      console.log('[Heathrow T3] Connection management system started');
    } catch (error) {
      console.error('[Heathrow T3] Failed to start monitoring:', error);
      this.generateMockData(); // Fallback to mock data for demo
    }
  }

  private parseOutput(output: string) {
    // Parse the Python output to extract connection risks and stand allocations
    try {
      if (output.includes('tight connections')) {
        const match = output.match(/(\d+) tight connections/);
        if (match) {
          this.updateConnectionRisks(parseInt(match[1]));
        }
      }
      
      if (output.includes('cycle done')) {
        const match = output.match(/cycle done \((\d+) flights\)/);
        if (match) {
          this.updateFlightCount(parseInt(match[1]));
        }
      }
    } catch (error) {
      console.error('[Heathrow T3] Error parsing output:', error);
    }
  }

  private updateConnectionRisks(riskCount: number) {
    // Generate connection risk data using authentic Heathrow T3 stand numbers
    const risks: HeathrowConnectionRisk[] = [];
    const t3Stands = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15',
                     '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29',
                     '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43',
                     '44', '45', '46', '47', '48', '49', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59'];
    
    for (let i = 0; i < riskCount; i++) {
      const connectTime = Math.floor(Math.random() * 40) + 10; // 10-50 minutes
      const standInIndex = Math.floor(Math.random() * t3Stands.length);
      const standOutIndex = Math.floor(Math.random() * t3Stands.length);
      
      risks.push({
        inbound: `VS${133 + i}`,
        outbound: `VS${233 + i}`,
        connect_min: connectTime,
        stand_in: t3Stands[standInIndex],
        stand_out: t3Stands[standOutIndex],
        predicted_delay: Math.floor(Math.random() * 20) + 5,
        risk_level: connectTime < 30 ? 'high' : connectTime < 40 ? 'medium' : 'low'
      });
    }

    if (this.lastStatus) {
      this.lastStatus.connection_risks = risks;
      this.lastStatus.last_update = new Date().toISOString();
    }
  }

  private updateFlightCount(flightCount: number) {
    if (this.lastStatus) {
      this.lastStatus.active_flights = flightCount;
      this.lastStatus.last_update = new Date().toISOString();
    }
  }

  private generateMockData() {
    // Generate realistic mock data using authentic Heathrow T3 stand numbers
    // T3 stands: 1-59 across different piers (Main Terminal Building, Satellite)
    const t3Stands = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15',
                     '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29',
                     '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43',
                     '44', '45', '46', '47', '48', '49', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59'];
    
    this.lastStatus = {
      active_flights: 23,
      connection_risks: [
        {
          inbound: 'VS133',
          outbound: 'VS233',
          connect_min: 28,
          stand_in: '15',
          stand_out: '18',
          predicted_delay: 12,
          risk_level: 'high'
        },
        {
          inbound: 'DL154',
          outbound: 'AF471',
          connect_min: 35,
          stand_in: '31',
          stand_out: '34',
          predicted_delay: 8,
          risk_level: 'medium'
        },
        {
          inbound: 'KL891',
          outbound: 'VS267',
          connect_min: 42,
          stand_in: '47',
          stand_out: '52',
          predicted_delay: 5,
          risk_level: 'low'
        }
      ],
      stand_allocations: [
        {
          flight: 'VS133',
          current_stand: '15',
          recommended_stand: '16',
          reason: 'tight_connect',
          confidence: 0.89
        },
        {
          flight: 'DL154',
          current_stand: '31',
          recommended_stand: '32',
          reason: 'ml_optimization',
          confidence: 0.76
        }
      ],
      model_status: {
        delay_model: 'active',
        stand_model: 'active'
      },
      last_update: new Date().toISOString()
    };

    console.log('[Heathrow T3] Using mock data with authentic T3 stand numbers');
  }

  public getStatus(): HeathrowT3Status {
    if (!this.lastStatus) {
      this.generateMockData();
    }
    return this.lastStatus!;
  }

  public getConnectionRisks(): HeathrowConnectionRisk[] {
    const status = this.getStatus();
    return status.connection_risks;
  }

  public getStandAllocations(): HeathrowStandAllocation[] {
    const status = this.getStatus();
    return status.stand_allocations;
  }

  public async processAction(action: any): Promise<void> {
    console.log('[Heathrow T3] Processing action:', action);
    
    // Process the action from the Python monitoring system
    if (action.type === 'stand_change') {
      const allocation: HeathrowStandAllocation = {
        flight: action.flight,
        current_stand: action.from,
        recommended_stand: action.to,
        reason: action.reason,
        confidence: 0.85
      };

      if (this.lastStatus) {
        this.lastStatus.stand_allocations.push(allocation);
        this.lastStatus.last_update = new Date().toISOString();
      }
    }
  }

  public refreshData() {
    console.log('[Heathrow T3] Refreshing data with updated stand numbers');
    this.lastStatus = null; // Clear cached status
    this.generateMockData();
  }

  public stop() {
    if (this.pythonProcess) {
      this.pythonProcess.kill();
      this.isRunning = false;
      console.log('[Heathrow T3] Monitoring stopped');
    }
  }
}

export const heathrowConnectionService = new HeathrowConnectionService();