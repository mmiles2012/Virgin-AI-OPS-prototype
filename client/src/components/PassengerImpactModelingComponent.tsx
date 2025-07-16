import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Users, AlertTriangle, Clock, DollarSign, Plane, MapPin } from "lucide-react";

interface PassengerImpact {
  id: number;
  flight: string;
  route: string;
  issue: string;
  paxAffected: number;
  reaccomOptions: string;
  estimatedCost: string;
  priority: 'high' | 'medium' | 'low';
  timeline: string;
  compensation?: string;
  rebookingOptions: string[];
  hotel?: boolean;
  mealVouchers?: boolean;
  groundTransport?: boolean;
}

const samplePassengerImpacts: PassengerImpact[] = [
  {
    id: 1,
    flight: "VS301",
    route: "LHR-JFK",
    issue: "Missed Connection",
    paxAffected: 47,
    reaccomOptions: "Rebook on DL211 via JFK",
    estimatedCost: "£11,750",
    priority: 'high',
    timeline: "Next available: DL211 +6hrs",
    compensation: "EU261: £520/pax",
    rebookingOptions: ["DL211 +6hrs", "VS003 +24hrs", "BA183 +4hrs"],
    hotel: true,
    mealVouchers: true,
    groundTransport: false
  },
  {
    id: 2,
    flight: "AF980",
    route: "CDG-LHR",
    issue: "Diversion to AMS",
    paxAffected: 122,
    reaccomOptions: "Coach transfer to CDG",
    estimatedCost: "€18,200",
    priority: 'high',
    timeline: "Coach transfer: 4hrs",
    compensation: "EU261: €250/pax",
    rebookingOptions: ["Coach + AF1480", "KL1006 +2hrs", "EuroStar +8hrs"],
    hotel: false,
    mealVouchers: true,
    groundTransport: true
  },
  {
    id: 3,
    flight: "KL601",
    route: "AMS-LHR",
    issue: "Late Arrival",
    paxAffected: 65,
    reaccomOptions: "Hold UA900 by 15 min",
    estimatedCost: "Low",
    priority: 'medium',
    timeline: "Delay coordination: 15min",
    rebookingOptions: ["Hold UA900", "VS027 +2hrs", "BA432 +1hr"],
    hotel: false,
    mealVouchers: false,
    groundTransport: false
  },
  {
    id: 4,
    flight: "VS355",
    route: "BOM-LHR",
    issue: "Technical Diversion",
    paxAffected: 89,
    reaccomOptions: "Position spare aircraft",
    estimatedCost: "£45,600",
    priority: 'high',
    timeline: "Spare A330: +12hrs",
    compensation: "EU261: £520/pax",
    rebookingOptions: ["Spare VS A330", "AI131 +6hrs", "EK002 +8hrs"],
    hotel: true,
    mealVouchers: true,
    groundTransport: true
  }
];

const PassengerImpactModelingComponent: React.FC = () => {
  const [impacts, setImpacts] = useState<PassengerImpact[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [totalPax, setTotalPax] = useState<number>(0);

  useEffect(() => {
    // Simulate loading authentic passenger impact data
    const loadImpactData = async () => {
      setLoading(true);
      // In real implementation, this would fetch from AINO API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setImpacts(samplePassengerImpacts);
      
      // Calculate totals
      const cost = samplePassengerImpacts.reduce((acc, impact) => {
        const costValue = parseFloat(impact.estimatedCost.replace(/[£€,]/g, '')) || 0;
        return acc + costValue;
      }, 0);
      
      const pax = samplePassengerImpacts.reduce((acc, impact) => acc + impact.paxAffected, 0);
      
      setTotalCost(cost);
      setTotalPax(pax);
      setLoading(false);
    };

    loadImpactData();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card className="bg-white border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aero-blue-primary"></div>
            <span className="ml-3 text-gray-600">Loading passenger impact data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6" />
            Passenger Impact Modeling
          </h2>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Real-time Analysis</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {impacts.map((impact) => (
            <div key={impact.id} className="bg-slate-800/50 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Plane className="h-4 w-4 text-blue-400" />
                  <h3 className="font-semibold text-white">{impact.flight}</h3>
                  <Badge variant="outline" className="text-xs text-gray-400 border-gray-600">
                    {impact.route}
                  </Badge>
                </div>
                <Badge className={`text-xs ${getPriorityColor(impact.priority)}`}>
                  {impact.priority.toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-gray-300 font-medium">Issue: </span>
                    <span className="text-white">{impact.issue}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-gray-300 font-medium">PAX Affected: </span>
                    <span className="text-white">{impact.paxAffected}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-gray-300 font-medium">Timeline: </span>
                    <span className="text-white">{impact.timeline}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-gray-300 font-medium">Reaccommodation: </span>
                    <span className="text-white">{impact.reaccomOptions}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <DollarSign className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-gray-300 font-medium">Est. Cost: </span>
                    <span className="text-white">{impact.estimatedCost}</span>
                    {impact.compensation && (
                      <div className="text-xs text-gray-400 mt-1">
                        + {impact.compensation}
                      </div>
                    )}
                  </div>
                </div>

                {/* Rebooking Options */}
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="text-xs text-gray-400 mb-2">Alternative Options:</div>
                  <div className="flex flex-wrap gap-1">
                    {impact.rebookingOptions.map((option, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                        {option}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Services Required */}
                <div className="flex gap-2 mt-2">
                  {impact.hotel && (
                    <Badge variant="outline" className="text-xs text-blue-400 border-blue-500/30">
                      Hotel
                    </Badge>
                  )}
                  {impact.mealVouchers && (
                    <Badge variant="outline" className="text-xs text-green-400 border-green-500/30">
                      Meals
                    </Badge>
                  )}
                  {impact.groundTransport && (
                    <Badge variant="outline" className="text-xs text-purple-400 border-purple-500/30">
                      Transport
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Alert */}
        <Alert className="mt-6 bg-blue-500/10 border-blue-500/30">
          <AlertTriangle className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-300">
            <strong>{impacts.filter(i => i.priority === 'high').length} high priority impacts</strong> requiring immediate attention. 
            Total passenger services cost estimated at £{totalCost.toLocaleString()} affecting {totalPax} passengers.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default PassengerImpactModelingComponent;