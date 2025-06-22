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
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'acknowledged': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="h-full bg-gray-50 p-4 overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Emergency Communication Center</h1>
        <div className="flex items-center gap-4">
          <Badge className={isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
          <Badge className="bg-blue-100 text-blue-800">
            {activeAlerts.length} Active Alert{activeAlerts.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active Alerts</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeAlerts.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-gray-500">No active emergency alerts</p>
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
                        <h4 className="font-semibold mb-2">Aircraft Information</h4>
                        <p className="text-sm text-gray-600">Type: {alert.aircraft.type}</p>
                        <p className="text-sm text-gray-600">Registration: {alert.aircraft.registration}</p>
                        <p className="text-sm text-gray-600">
                          Position: {alert.aircraft.position.lat.toFixed(4)}, {alert.aircraft.position.lon.toFixed(4)}
                        </p>
                        <p className="text-sm text-gray-600">Altitude: {alert.aircraft.position.alt.toLocaleString()} ft</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Emergency Details</h4>
                        <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                        <p className="text-sm text-gray-600">
                          <Clock className="inline h-4 w-4 mr-1" />
                          Estimated Time: {alert.estimatedTime} minutes
                        </p>
                        <p className="text-sm text-gray-600">
                          Declared: {new Date(alert.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Required Actions</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {alert.requiredActions.map((action, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-blue-600">•</span>
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
                  <label className="block text-sm font-medium mb-1">Recipient</label>
                  <select 
                    className="w-full p-2 border rounded-md"
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
                  <label className="block text-sm font-medium mb-1">Message</label>
                  <textarea
                    className="w-full p-2 border rounded-md h-24"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Enter emergency communication message..."
                  />
                </div>

                <Button 
                  onClick={sendMessage}
                  disabled={!selectedAlert || !newMessage.trim()}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Urgent Message
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Radio className="h-5 w-5" />
                  Communication Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {messages.length === 0 ? (
                    <p className="text-gray-500 text-sm">No messages</p>
                  ) : (
                    messages.map((message) => (
                      <div key={message.id} className="p-2 bg-gray-50 rounded-md">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
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
                    <p className="text-sm text-gray-600">Type: {channel.type.toUpperCase()}</p>
                    {channel.frequency && (
                      <p className="text-sm text-gray-600">Frequency: {channel.frequency} MHz</p>
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