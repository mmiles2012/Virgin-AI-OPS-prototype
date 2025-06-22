import { WebSocket } from 'ws';
import { EventEmitter } from 'events';

interface EmergencyAlert {
  id: string;
  type: 'medical' | 'technical' | 'weather' | 'fuel' | 'security';
  severity: 'critical' | 'high' | 'medium' | 'low';
  aircraft: {
    callsign: string;
    type: string;
    registration: string;
    position: { lat: number; lon: number; alt: number };
  };
  timestamp: string;
  description: string;
  requiredActions: string[];
  estimatedTime: number;
  contacts: {
    atc: string[];
    medical: string[];
    ground: string[];
    management: string[];
  };
  status: 'active' | 'acknowledged' | 'resolved';
}

interface CommunicationChannel {
  id: string;
  name: string;
  type: 'voice' | 'data' | 'text' | 'emergency';
  frequency?: string;
  active: boolean;
  participants: string[];
}

class EmergencyCommService extends EventEmitter {
  private alerts: Map<string, EmergencyAlert> = new Map();
  private channels: Map<string, CommunicationChannel> = new Map();
  private websockets: Set<WebSocket> = new Set();

  constructor() {
    super();
    this.initializeChannels();
  }

  private initializeChannels() {
    const emergencyChannels: CommunicationChannel[] = [
      {
        id: 'atc-primary',
        name: 'ATC Primary',
        type: 'voice',
        frequency: '121.5',
        active: true,
        participants: ['ATC_TOWER', 'APPROACH', 'DEPARTURE']
      },
      {
        id: 'medical-emergency',
        name: 'Medical Emergency',
        type: 'emergency',
        active: true,
        participants: ['PARAMEDIC', 'HOSPITAL', 'GROUND_MEDICAL']
      },
      {
        id: 'ops-center',
        name: 'Operations Center',
        type: 'data',
        active: true,
        participants: ['FLIGHT_DISPATCH', 'MAINTENANCE', 'FUEL_COORDINATOR']
      },
      {
        id: 'security-alert',
        name: 'Security Alert',
        type: 'emergency',
        active: true,
        participants: ['SECURITY', 'POLICE', 'CUSTOMS']
      }
    ];

    emergencyChannels.forEach(channel => {
      this.channels.set(channel.id, channel);
    });
  }

  declareEmergency(emergencyData: Partial<EmergencyAlert>): string {
    const alertId = `EMG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const alert: EmergencyAlert = {
      id: alertId,
      type: emergencyData.type || 'technical',
      severity: emergencyData.severity || 'high',
      aircraft: emergencyData.aircraft || {
        callsign: 'VS25H',
        type: 'Boeing 787-9',
        registration: 'G-VZIG',
        position: { lat: 51.4700, lon: -0.4543, alt: 37000 }
      },
      timestamp: new Date().toISOString(),
      description: emergencyData.description || 'Emergency declared',
      requiredActions: this.generateRequiredActions(emergencyData.type || 'technical'),
      estimatedTime: emergencyData.estimatedTime || this.calculateEstimatedTime(emergencyData.type || 'technical'),
      contacts: this.getEmergencyContacts(emergencyData.type || 'technical'),
      status: 'active'
    };

    this.alerts.set(alertId, alert);
    this.broadcastEmergencyAlert(alert);
    this.initiateEmergencyProtocols(alert);

    return alertId;
  }

  private generateRequiredActions(type: string): string[] {
    const actions = {
      medical: [
        'Contact nearest medical facility',
        'Prepare for priority landing',
        'Alert ground medical team',
        'Clear runway for emergency approach',
        'Notify passenger services'
      ],
      technical: [
        'Run emergency checklist',
        'Contact maintenance control',
        'Prepare for precautionary landing',
        'Alert fire and rescue services',
        'Coordinate with engineering team'
      ],
      weather: [
        'Monitor weather conditions',
        'Identify alternate airports',
        'Calculate fuel requirements',
        'Coordinate with meteorology',
        'Update passenger information'
      ],
      fuel: [
        'Declare minimum fuel',
        'Request priority vectors',
        'Alert fuel services',
        'Calculate critical fuel time',
        'Prepare emergency procedures'
      ],
      security: [
        'Contact security forces',
        'Isolate aircraft',
        'Alert law enforcement',
        'Prepare for inspection',
        'Coordinate with authorities'
      ]
    };

    return actions[type as keyof typeof actions] || actions.technical;
  }

  private calculateEstimatedTime(type: string): number {
    const timings = {
      medical: 15,    // minutes to nearest medical facility
      technical: 25,  // minutes to safe landing
      weather: 45,    // minutes to alternate airport
      fuel: 20,       // minutes to nearest suitable airport
      security: 30    // minutes to secure location
    };

    return timings[type as keyof typeof timings] || 30;
  }

  private getEmergencyContacts(type: string) {
    return {
      atc: ['EGLL_TWR', 'EGLL_APP', 'EGLL_GND'],
      medical: ['LHR_MEDICAL', 'HILLINGDON_HOSPITAL', 'PARAMEDIC_01'],
      ground: ['GROUND_OPS', 'FUEL_SERVICES', 'BAGGAGE_HANDLING'],
      management: ['DUTY_MANAGER', 'FLIGHT_OPERATIONS', 'CUSTOMER_SERVICES']
    };
  }

  private broadcastEmergencyAlert(alert: EmergencyAlert) {
    const message = JSON.stringify({
      type: 'EMERGENCY_ALERT',
      alert,
      timestamp: new Date().toISOString()
    });

    this.websockets.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });

    this.emit('emergency_declared', alert);
  }

  private initiateEmergencyProtocols(alert: EmergencyAlert) {
    // Activate relevant communication channels
    this.activateEmergencyChannels(alert.type);
    
    // Send automated messages
    this.sendAutomatedMessages(alert);
    
    // Update operational status
    this.updateOperationalStatus(alert);
  }

  private activateEmergencyChannels(type: string) {
    const channelMap = {
      medical: ['atc-primary', 'medical-emergency', 'ops-center'],
      technical: ['atc-primary', 'ops-center'],
      weather: ['atc-primary', 'ops-center'],
      fuel: ['atc-primary', 'ops-center'],
      security: ['atc-primary', 'security-alert', 'ops-center']
    };

    const channelsToActivate = channelMap[type as keyof typeof channelMap] || ['atc-primary', 'ops-center'];
    
    channelsToActivate.forEach(channelId => {
      const channel = this.channels.get(channelId);
      if (channel) {
        channel.active = true;
        this.broadcastChannelStatus(channel);
      }
    });
  }

  private sendAutomatedMessages(alert: EmergencyAlert) {
    const messages = {
      atc: `Emergency declared by ${alert.aircraft.callsign}. Type: ${alert.type.toUpperCase()}. Request priority handling.`,
      medical: `Medical emergency inbound. Aircraft: ${alert.aircraft.callsign}. ETA: ${alert.estimatedTime} minutes.`,
      ground: `Ground teams alert: ${alert.type} emergency. Aircraft: ${alert.aircraft.callsign}. Prepare for arrival.`,
      management: `Emergency situation: ${alert.description}. Aircraft: ${alert.aircraft.callsign}. Status: ${alert.status}.`
    };

    Object.entries(messages).forEach(([recipient, message]) => {
      this.sendMessage(recipient, message, alert.id);
    });
  }

  private updateOperationalStatus(alert: EmergencyAlert) {
    const statusUpdate = {
      type: 'OPERATIONAL_STATUS_UPDATE',
      alert_id: alert.id,
      aircraft: alert.aircraft.callsign,
      status: 'EMERGENCY_DECLARED',
      priority: alert.severity,
      estimated_time: alert.estimatedTime,
      timestamp: new Date().toISOString()
    };

    this.broadcast(statusUpdate);
  }

  sendMessage(recipient: string, message: string, alertId: string) {
    const messageData = {
      type: 'COMMUNICATION_MESSAGE',
      id: `MSG_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      recipient,
      message,
      alert_id: alertId,
      timestamp: new Date().toISOString(),
      priority: 'urgent'
    };

    this.broadcast(messageData);
    console.log(`[EMERGENCY COMM] To ${recipient}: ${message}`);
  }

  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.status = 'acknowledged';
    this.alerts.set(alertId, alert);

    this.broadcast({
      type: 'ALERT_ACKNOWLEDGED',
      alert_id: alertId,
      acknowledged_by: acknowledgedBy,
      timestamp: new Date().toISOString()
    });

    return true;
  }

  resolveAlert(alertId: string, resolvedBy: string, resolution: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.status = 'resolved';
    this.alerts.set(alertId, alert);

    this.broadcast({
      type: 'ALERT_RESOLVED',
      alert_id: alertId,
      resolved_by: resolvedBy,
      resolution,
      timestamp: new Date().toISOString()
    });

    return true;
  }

  getActiveAlerts(): EmergencyAlert[] {
    return Array.from(this.alerts.values()).filter(alert => alert.status === 'active');
  }

  getAlertHistory(): EmergencyAlert[] {
    return Array.from(this.alerts.values()).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  addWebSocket(ws: WebSocket) {
    this.websockets.add(ws);
    
    ws.on('close', () => {
      this.websockets.delete(ws);
    });

    // Send current status to new connection
    const activeAlerts = this.getActiveAlerts();
    if (activeAlerts.length > 0) {
      ws.send(JSON.stringify({
        type: 'ACTIVE_ALERTS',
        alerts: activeAlerts,
        timestamp: new Date().toISOString()
      }));
    }
  }

  private broadcast(data: any) {
    const message = JSON.stringify(data);
    this.websockets.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  private broadcastChannelStatus(channel: CommunicationChannel) {
    this.broadcast({
      type: 'CHANNEL_STATUS',
      channel,
      timestamp: new Date().toISOString()
    });
  }

  // Simulate emergency scenarios for demonstration
  simulateEmergencyScenario(scenario: string): string {
    const scenarios = {
      medical: {
        type: 'medical' as const,
        severity: 'critical' as const,
        description: 'Passenger experiencing cardiac emergency requiring immediate medical attention',
        aircraft: {
          callsign: 'VS25H',
          type: 'Boeing 787-9',
          registration: 'G-VZIG',
          position: { lat: 53.3498, lon: -6.2603, alt: 37000 }
        }
      },
      technical: {
        type: 'technical' as const,
        severity: 'high' as const,
        description: 'Engine warning light illuminated, requesting precautionary landing',
        aircraft: {
          callsign: 'VS11A',
          type: 'Airbus A350-1000',
          registration: 'G-VXWB',
          position: { lat: 51.4700, lon: -0.4543, alt: 35000 }
        }
      },
      fuel: {
        type: 'fuel' as const,
        severity: 'high' as const,
        description: 'Lower than expected fuel consumption, declaring minimum fuel',
        aircraft: {
          callsign: 'VS33D',
          type: 'Airbus A330-900',
          registration: 'G-VPOP',
          position: { lat: 55.8642, lon: -4.2518, alt: 39000 }
        }
      }
    };

    const scenarioData = scenarios[scenario as keyof typeof scenarios];
    if (!scenarioData) {
      throw new Error(`Unknown scenario: ${scenario}`);
    }

    return this.declareEmergency(scenarioData);
  }
}

export const emergencyCommService = new EmergencyCommService();