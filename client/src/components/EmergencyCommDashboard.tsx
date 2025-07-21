import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  AlertTriangle, 
  Phone, 
  Radio, 
  Send, 
  Clock, 
  MapPin, 
  Plane,
  Heart,
  Wrench,
  Cloud,
  Fuel,
  Shield,
  CheckCircle,
  XCircle,
  Volume2,
  Mic
} from 'lucide-react';

const getPriorityColors = (priority: string) => {
  switch (priority) {
    case 'critical': return 'bg-va-red-primary/80 text-va-white border-va-red-primary';
    case 'high': return 'bg-aero-orange-alert/40 text-va-deep-space border-aero-orange-alert';
    case 'medium': return 'bg-aero-amber-light text-va-deep-space border-aero-amber-caution';
    case 'low': return 'bg-aero-green-light text-va-deep-space border-aero-green-safe';
    default: return 'bg-va-white text-va-deep-space border-va-deep-space';
  }
};

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

interface CommunicationMessage {
  id: string;
  recipient: string;
  message: string;
  alert_id: string;
  timestamp: string;
  priority: 'urgent' | 'normal' | 'low';
}

interface CommunicationChannel {
  id: string;
  name: string;
  type: 'voice' | 'data' | 'text' | 'emergency';
  frequency?: string;
  active: boolean;
  participants: string[];
}

const EmergencyCommDashboard: React.FC = () => {
  const [activeAlerts, setActiveAlerts] = useState<EmergencyAlert[]>([]);
  const [alertHistory, setAlertHistory] = useState<EmergencyAlert[]>([]);
  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [channels, setChannels] = useState<CommunicationChannel[]>([
    {
      id: 'emergency-freq',
      name: 'Emergency Frequency',
      type: 'voice',
      frequency: '121.5',
      active: true,
      participants: ['ATC', 'Emergency Services', 'Aircraft']
    },
    {
      id: 'atc-primary',
      name: 'ATC Primary',
      type: 'voice', 
      frequency: '118.7',
      active: true,
      participants: ['Air Traffic Control', 'Aircraft', 'Ground Control']
    },
    {
      id: 'ground-control',
      name: 'Ground Control',
      type: 'voice',
      frequency: '121.9',
      active: false,
      participants: ['Ground Control', 'Aircraft', 'Ground Crew']
    },
    {
      id: 'medical-channel',
      name: 'Medical Emergency',
      type: 'voice',
      frequency: '123.45',
      active: false,
      participants: ['Medical Team', 'Paramedics', 'Hospital']
    },
    {
      id: 'security-channel', 
      name: 'Security Services',
      type: 'voice',
      frequency: '122.15',
      active: false,
      participants: ['Airport Security', 'Police', 'Border Control']
    },
    {
      id: 'acars-data',
      name: 'Aircraft ACARS',
      type: 'data',
      active: true,
      participants: ['Aircraft Systems', 'Operations Center', 'Maintenance']
    },
    {
      id: 'satcom-direct',
      name: 'SATCOM Direct',
      type: 'voice',
      frequency: 'Satellite',
      active: true,
      participants: ['Flight Deck', 'Cabin Crew', 'Operations Center']
    },
    {
      id: 'ops-center',
      name: 'Operations Center',
      type: 'text',
      active: true,
      participants: ['Flight Dispatch', 'Operations Manager', 'Crew Scheduling']
    },
    {
      id: 'fire-rescue',
      name: 'Fire & Rescue',
      type: 'voice',
      frequency: '121.6',
      active: false,
      participants: ['Fire Department', 'Rescue Teams', 'Airport ARFF']
    }
  ]);
  const [selectedAlert, setSelectedAlert] = useState<EmergencyAlert | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState('ATC');
  const [isConnected, setIsConnected] = useState(false);
  const websocketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    const wsUrl = `ws://localhost:5000/ws/emergency`;
    websocketRef.current = new WebSocket(wsUrl);

    websocketRef.current.onopen = () => {
      setIsConnected(true);
      console.log('Emergency communication connected');
    };

    websocketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    websocketRef.current.onclose = () => {
      setIsConnected(false);
      // Reconnect after 3 seconds
      setTimeout(connectWebSocket, 3000);
    };

    websocketRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'EMERGENCY_ALERT':
        setActiveAlerts(prev => [...prev, data.alert]);
        setAlertHistory(prev => [data.alert, ...prev]);
        playAlertSound(data.alert.severity);
        break;
      case 'COMMUNICATION_MESSAGE':
        setMessages(prev => [data, ...prev]);
        break;
      case 'ALERT_ACKNOWLEDGED':
        updateAlertStatus(data.alert_id, 'acknowledged');
        break;
      case 'ALERT_RESOLVED':
        updateAlertStatus(data.alert_id, 'resolved');
        setActiveAlerts(prev => prev.filter(alert => alert.id !== data.alert_id));
        break;
      case 'ACTIVE_ALERTS':
        setActiveAlerts(data.alerts);
        break;
      case 'CHANNEL_STATUS':
        updateChannelStatus(data.channel);
        break;
    }
  };

  const updateAlertStatus = (alertId: string, status: 'acknowledged' | 'resolved') => {
    setActiveAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, status } : alert
      )
    );
    setAlertHistory(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, status } : alert
      )
    );
  };

  const updateChannelStatus = (updatedChannel: CommunicationChannel) => {
    setChannels(prev => {
      const existing = prev.find(ch => ch.id === updatedChannel.id);
      if (existing) {
        return prev.map(ch => ch.id === updatedChannel.id ? updatedChannel : ch);
      } else {
        return [...prev, updatedChannel];
      }
    });
  };

  const playAlertSound = (severity: string) => {
    const audio = new Audio();
    switch (severity) {
      case 'critical':
        audio.src = '/sounds/critical-alert.mp3';
        break;
      case 'high':
        audio.src = '/sounds/high-alert.mp3';
        break;
      default:
        audio.src = '/sounds/standard-alert.mp3';
    }
    audio.play().catch(e => console.log('Audio play failed:', e));
  };

  const declareEmergency = async (scenario: string) => {
    try {
      const response = await fetch('/api/emergency/declare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Emergency declared:', data.alertId);
      }
    } catch (error) {
      console.error('Failed to declare emergency:', error);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await fetch(`/api/emergency/acknowledge/${alertId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acknowledgedBy: 'Operations Officer' })
      });
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      await fetch(`/api/emergency/resolve/${alertId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          resolvedBy: 'Operations Officer',
          resolution: 'Emergency situation resolved successfully'
        })
      });
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedAlert) return;

    try {
      await fetch('/api/emergency/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: selectedRecipient,
          message: newMessage,
          alertId: selectedAlert.id
        })
      });
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const getEmergencyIcon = (type: string) => {
    switch (type) {
      case 'medical': return <Heart className="h-4 w-4" />;
      case 'technical': return <Wrench className="h-4 w-4" />;
      case 'weather': return <Cloud className="h-4 w-4" />;
      case 'fuel': return <Fuel className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-va-red-primary/80 text-va-white border-va-red-primary';
      case 'high': return 'bg-aero-orange-alert/40 text-va-deep-space border-aero-orange-alert';
      case 'medium': return 'bg-aero-amber-light text-va-deep-space border-aero-amber-caution';
      case 'low': return 'bg-aero-green-light text-va-deep-space border-aero-green-safe';
      default: return 'bg-va-white text-va-deep-space border-va-deep-space';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <AlertTriangle className="h-4 w-4 text-va-red-primary" />;
      case 'acknowledged': return <Clock className="h-4 w-4 text-aero-amber-caution" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-aero-green-safe" />;
      default: return <XCircle className="h-4 w-4 text-foreground0" />;
    }
  };

  return (
    <div className="h-full bg-background p-4 overflow-auto va-theme">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-aero-green-safe rounded-full animate-pulse"></div>
          <h1 className="va-heading-lg">Communication Center</h1>
        </div>
        <div className="flex items-center gap-4">
          <Badge className={isConnected ? 'bg-aero-green-light text-va-deep-space' : 'bg-va-red-primary/10 text-va-red-primary'}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
          <Badge className="bg-accent/30 text-foreground">
            {activeAlerts.length} Active Alert{activeAlerts.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-muted border-border">
          <TabsTrigger value="active" className="data-[state=active]:bg-accent data-[state=active]:text-foreground">Active Alerts</TabsTrigger>
          <TabsTrigger value="communication" className="data-[state=active]:bg-accent data-[state=active]:text-foreground">Communication</TabsTrigger>
          <TabsTrigger value="satcom" className="data-[state=active]:bg-accent data-[state=active]:text-foreground">SATCOM</TabsTrigger>
          <TabsTrigger value="channels" className="data-[state=active]:bg-accent data-[state=active]:text-foreground">Channels</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeAlerts.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-foreground0">No active emergency alerts</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {activeAlerts.map((alert) => (
                <Card key={alert.id} className="border-l-4 border-l-red-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {getEmergencyIcon(alert.type)}
                        {alert.aircraft.callsign} - {alert.type.toUpperCase()} EMERGENCY
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        {getStatusIcon(alert.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="va-heading-sm mb-2">Aircraft Information</h4>
                        <p className="va-body-md">Type: {alert.aircraft.type}</p>
                        <p className="va-body-md">Registration: {alert.aircraft.registration}</p>
                        <p className="va-body-md">
                          Position: {alert.aircraft.position.lat.toFixed(4)}, {alert.aircraft.position.lon.toFixed(4)}
                        </p>
                        <p className="va-body-md">Altitude: {alert.aircraft.position.alt.toLocaleString()} ft</p>
                      </div>
                      <div>
                        <h4 className="va-heading-sm mb-2">Emergency Details</h4>
                        <p className="va-body-md mb-2">{alert.description}</p>
                        <p className="va-body-md">
                          <Clock className="inline h-4 w-4 mr-1 text-va-blue" />
                          Estimated Time: {alert.estimatedTime} minutes
                        </p>
                        <p className="va-body-md">
                          Declared: {new Date(alert.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="va-heading-sm mb-2">Required Actions</h4>
                      <ul className="va-body-md space-y-1">
                        {alert.requiredActions.map((action, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-va-sky-blue">•</span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex gap-2">
                      {alert.status === 'active' && (
                        <Button 
                          onClick={() => acknowledgeAlert(alert.id)}
                          variant="outline"
                          size="sm"
                        >
                          Acknowledge
                        </Button>
                      )}
                      {alert.status === 'acknowledged' && (
                        <Button 
                          onClick={() => resolveAlert(alert.id)}
                          className="bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          Resolve
                        </Button>
                      )}
                      <Button 
                        onClick={() => setSelectedAlert(alert)}
                        variant="outline"
                        size="sm"
                        className="border-amber-600 text-amber-700 hover:bg-amber-50"
                      >
                        Open Communication
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="communication" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Send Message
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedAlert ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Communicating for: {selectedAlert.aircraft.callsign} ({selectedAlert.type} emergency)
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <AlertDescription>
                      Select an active alert to enable communication
                    </AlertDescription>
                  </Alert>
                )}

                <div>
                  <label className="va-label mb-1">Recipient</label>
                  <select 
                    className="w-full p-2 border rounded-md bg-background text-foreground border-border"
                    value={selectedRecipient}
                    onChange={(e) => setSelectedRecipient(e.target.value)}
                  >
                    <option value="ATC">Air Traffic Control</option>
                    <option value="MEDICAL">Medical Emergency</option>
                    <option value="GROUND">Ground Operations</option>
                    <option value="MAINTENANCE">Maintenance Control</option>
                    <option value="SECURITY">Security Services</option>
                    <option value="MANAGEMENT">Management</option>
                    <option value="ACARS">Aircraft ACARS</option>
                  </select>
                </div>

                <div>
                  <label className="va-label mb-1">Message</label>
                  <textarea
                    className="w-full p-2 border rounded-md h-24 bg-background text-foreground border-border"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Enter emergency communication message..."
                  />
                </div>

                <Button 
                  onClick={sendMessage}
                  disabled={!selectedAlert || !newMessage.trim()}
                  className="w-full bg-accent hover:bg-va-red-primary/80 text-foreground"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Urgent Message
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Radio className="h-5 w-5 text-va-sky-blue" />
                  Communication Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {messages.length === 0 ? (
                    <p className="text-foreground0 text-sm">No messages</p>
                  ) : (
                    messages.map((message) => (
                      <div key={message.id} className="p-2 bg-gray-50 rounded-md">
                        <div className="flex items-center justify-between text-xs text-foreground0 mb-1">
                          <span>To: {message.recipient}</span>
                          <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-sm">{message.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="satcom" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Radio className="h-5 w-5 text-va-sky-blue" />
                  SATCOM Direct Call
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="va-label">Aircraft Callsign</label>
                    <input
                      type="text"
                      placeholder="Enter aircraft callsign (e.g., VS133)"
                      className="w-full mt-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-va-blue bg-background text-foreground"
                    />
                  </div>
                  <div>
                    <label className="va-label">Priority Level</label>
                    <select className="w-full mt-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-va-blue bg-background text-foreground">
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>
                  <div>
                    <label className="va-label">Call Recipient</label>
                    <select className="w-full mt-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-va-blue bg-background text-foreground">
                      <option value="flight-deck">Flight Deck</option>
                      <option value="cabin-crew">Cabin Crew</option>
                      <option value="both">Both Flight Deck & Cabin</option>
                    </select>
                  </div>
                </div>

                <Button className="w-full va-btn-primary">
                  <Phone className="h-4 w-4 mr-2" />
                  Initiate SATCOM Call
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-gray-700" />
                  SATCOM Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <div className="font-medium text-green-900">Satellite Connection</div>
                      <div className="text-sm text-green-700">Signal: Strong</div>
                    </div>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-900">Active SATCOM Connections:</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-amber-50 rounded">
                        <span className="text-sm">VS133 - Flight Deck</span>
                        <Badge className="bg-amber-100 text-amber-800">Connected</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">VS134 - Cabin Crew</span>
                        <Badge className="bg-gray-100 text-gray-800">Standby</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-va-red" />
                  ODE-MEDLINk
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-accent rounded-lg border border-accent">
                  <div className="va-body-md font-medium text-va-sky-blue mb-2">Three-Way Medical Conference</div>
                  <div className="va-caption text-va-sky-blue">
                    Operations ↔ Aircraft ↔ MedLink USA
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="va-label">Aircraft Callsign</label>
                    <input
                      type="text"
                      placeholder="Enter aircraft callsign"
                      className="w-full mt-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-va-blue bg-background text-foreground"
                    />
                  </div>
                  <div>
                    <label className="va-label">Medical Priority</label>
                    <select className="w-full mt-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-va-blue bg-background text-foreground">
                      <option value="consultation">Medical Consultation</option>
                      <option value="urgent">Urgent Medical</option>
                      <option value="emergency">Medical Emergency</option>
                    </select>
                  </div>
                </div>

                <Button className="w-full va-btn-primary">
                  <Heart className="h-4 w-4 mr-2" />
                  Connect ODE-MEDLINk
                </Button>

                <div className="va-caption text-center text-muted-foreground">
                  Connects: Ops Center + Aircraft + MedLink USA
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="channels" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {channels.map((channel) => (
              <Card key={channel.id} className={channel.active ? 'border-green-500' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {channel.type === 'voice' ? <Mic className="h-4 w-4" /> : <Radio className="h-4 w-4" />}
                      {channel.name}
                    </div>
                    <Badge className={channel.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {channel.active ? 'Active' : 'Standby'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Type: {channel.type.toUpperCase()}</p>
                    {channel.frequency && (
                      <p className="text-sm text-muted-foreground">Frequency: {channel.frequency} MHz</p>
                    )}
                    <div>
                      <p className="text-sm font-medium">Participants:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {channel.participants.map((participant, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {participant}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>


      </Tabs>
    </div>
  );
};

export default EmergencyCommDashboard;