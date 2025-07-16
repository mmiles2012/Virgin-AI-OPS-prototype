// Network Alert Generation Utilities
export interface NetworkAlert {
  id: string;
  type: 'weather' | 'capacity' | 'crew';
  severity: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  hubs?: string[];
  timestamp: string;
}

export interface HubPerformance {
  icao: string;
  iata: string;
  name: string;
  city: string;
  onTimeRate: number;
  avgDelayMinutes: number;
  totalFlights: number;
  onTimeFlights: number;
  delayedFlights: number;
  cancelledFlights: number;
  trend: 'improving' | 'declining' | 'stable';
  recentFlights: any[];
  lastUpdated: string;
}

export const generateNetworkAlerts = (
  hubData: HubPerformance[], 
  networkDelayRate: number, 
  severeDelays: number
): NetworkAlert[] => {
  const alerts: NetworkAlert[] = [];
  
  // Weather-related alerts
  const weatherAffectedHubs = hubData.filter(hub => 
    hub.recentFlights.some(f => 
      f.delayReason?.includes('Weather') || f.delayReason?.includes('ATC')
    )
  );
  
  if (weatherAffectedHubs.length > 0) {
    alerts.push({
      id: 'weather-impact',
      type: 'weather',
      severity: 'medium',
      title: 'Weather Impact Detected',
      message: `${weatherAffectedHubs.length} hubs affected by weather conditions`,
      hubs: weatherAffectedHubs.map(h => h.iata),
      timestamp: new Date().toISOString()
    });
  }
  
  // Capacity alerts
  const congestionHubs = hubData.filter(hub => 
    hub.delayedFlights > hub.totalFlights * 0.3
  );
  
  if (congestionHubs.length > 0) {
    alerts.push({
      id: 'capacity-congestion',
      type: 'capacity',
      severity: 'high',
      title: 'Hub Congestion Alert',
      message: `${congestionHubs.length} hubs experiencing high delay rates`,
      hubs: congestionHubs.map(h => h.iata),
      timestamp: new Date().toISOString()
    });
  }
  
  // Crew alerts
  const crewDelays = hubData.reduce((sum, hub) => 
    sum + hub.recentFlights.filter(f => f.delayReason?.includes('Crew')).length, 0
  );
  
  if (crewDelays > 5) {
    alerts.push({
      id: 'crew-shortage',
      type: 'crew',
      severity: 'medium',
      title: 'Crew Scheduling Issues',
      message: `${crewDelays} flights affected by crew scheduling`,
      timestamp: new Date().toISOString()
    });
  }
  
  return alerts;
};

export const generateDetailedMetrics = (hubData: HubPerformance[]) => {
  const totalFlights = hubData.reduce((sum, hub) => sum + hub.totalFlights, 0);
  const totalDelays = hubData.reduce((sum, hub) => sum + hub.delayedFlights, 0);
  const totalOnTime = hubData.reduce((sum, hub) => sum + hub.onTimeFlights, 0);
  
  // Calculate delay categories
  const delayCategories = {
    minor: 0,      // 0-15 min
    moderate: 0,   // 16-30 min
    major: 0,      // 31-60 min
    severe: 0      // >60 min
  };
  
  hubData.forEach(hub => {
    hub.recentFlights.forEach(flight => {
      if (flight.delayMinutes <= 15) delayCategories.minor++;
      else if (flight.delayMinutes <= 30) delayCategories.moderate++;
      else if (flight.delayMinutes <= 60) delayCategories.major++;
      else delayCategories.severe++;
    });
  });
  
  // Performance by region
  const regionPerformance = {
    'North America': hubData.filter(h => 
      ['JFK', 'LAX', 'MCO', 'MIA', 'BOS', 'SEA'].includes(h.iata)
    ),
    'Europe': hubData.filter(h => 
      ['LHR', 'MAN', 'CDG', 'AMS'].includes(h.iata)
    ),
    'Asia Pacific': hubData.filter(h => 
      ['NRT', 'HKG', 'SYD', 'DEL'].includes(h.iata)
    )
  };
  
  return {
    totalFlights,
    totalDelays,
    totalOnTime,
    delayRate: totalFlights > 0 ? (totalDelays / totalFlights) * 100 : 0,
    onTimeRate: totalFlights > 0 ? (totalOnTime / totalFlights) * 100 : 0,
    delayCategories,
    regionPerformance,
    worstPerformingHub: hubData.reduce((worst, hub) => 
      hub.onTimeRate < worst.onTimeRate ? hub : worst, hubData[0] || {}
    ),
    bestPerformingHub: hubData.reduce((best, hub) => 
      hub.onTimeRate > best.onTimeRate ? hub : best, hubData[0] || {}
    )
  };
};
