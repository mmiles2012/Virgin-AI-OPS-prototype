/**
 * Simple Digital Twin Component - Basic fallback for stability
 */

import React, { useState, useEffect } from 'react';

interface SimpleDigitalTwinProps {
  aircraftId: string;
  displayMode?: string;
  aircraftType?: 'boeing' | 'airbus';
}

interface Aircraft {
  registration: string;
  aircraftType: string;
  name: string;
  deliveryDate: string;
}

export default function SimpleDigitalTwin({ 
  aircraftId, 
  displayMode = 'full',
  aircraftType = 'boeing'
}: SimpleDigitalTwinProps) {
  const [selectedAircraft, setSelectedAircraft] = useState(aircraftId);
  const [fleetData, setFleetData] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch fleet data
  useEffect(() => {
    const fetchFleetData = async () => {
      try {
        const response = await fetch('/api/aviation/virgin-atlantic-flights');
        const data = await response.json();
        
        if (data.success && data.flights) {
          // Extract unique aircraft and filter by type
          const aircraftMap = new Map();
          
          data.flights.forEach((flight: any) => {
            if (flight.aircraft && flight.aircraft.registration) {
              const reg = flight.aircraft.registration;
              const type = flight.aircraft.aircraftType || 'Unknown';
              
              // Filter by aircraft type
              const isBoeing = type.includes('787') || type.includes('Boeing');
              const isAirbus = type.includes('A33') || type.includes('A35') || type.includes('Airbus');
              
              if ((aircraftType === 'boeing' && isBoeing) || 
                  (aircraftType === 'airbus' && isAirbus)) {
                aircraftMap.set(reg, {
                  registration: reg,
                  aircraftType: type,
                  name: `${type} ${reg}`,
                  deliveryDate: flight.aircraft.deliveryDate || '2018-01-01'
                });
              }
            }
          });
          
          const fleetArray = Array.from(aircraftMap.values());
          console.log(`Fleet data loaded for ${aircraftType}:`, fleetArray);
          setFleetData(fleetArray);
        }
      } catch (error) {
        console.error('Error fetching fleet data:', error);
        // Fallback data
        const fallbackData = aircraftType === 'boeing' ? [
          { registration: 'G-VAHH', aircraftType: 'Boeing 787-9', name: 'Red Velvet', deliveryDate: '2018-03-15' },
          { registration: 'G-VNEW', aircraftType: 'Boeing 787-9', name: 'Birthday Girl', deliveryDate: '2019-06-20' },
          { registration: 'G-VBEL', aircraftType: 'Boeing 787-9', name: 'Cosmic Girl', deliveryDate: '2020-01-10' }
        ] : [
          { registration: 'G-VDOT', aircraftType: 'Airbus A350-1000', name: 'Fearless Lady', deliveryDate: '2019-08-15' },
          { registration: 'G-VEII', aircraftType: 'Airbus A330-900', name: 'Maiden Voyage', deliveryDate: '2020-02-28' },
          { registration: 'G-VGEM', aircraftType: 'Airbus A330-300', name: 'Ruby Tuesday', deliveryDate: '2017-11-05' }
        ];
        setFleetData(fallbackData);
      } finally {
        setLoading(false);
      }
    };

    fetchFleetData();
  }, [aircraftType]);

  // Update selected aircraft when aircraftId prop changes
  useEffect(() => {
    setSelectedAircraft(aircraftId);
  }, [aircraftId]);

  const currentAircraft = fleetData.find(a => a.registration === selectedAircraft) || 
    { registration: selectedAircraft, aircraftType: 'Unknown', name: 'Unknown Aircraft', deliveryDate: '2018-01-01' };

  // Generate aircraft-specific data based on selected aircraft
  const getAircraftSpecificData = (aircraft: Aircraft) => {
    const isBoeing = aircraft.aircraftType.includes('787') || aircraft.aircraftType.includes('Boeing');
    const age = new Date().getFullYear() - new Date(aircraft.deliveryDate).getFullYear();
    
    return {
      fuel: isBoeing ? '126,372 kg' : aircraft.aircraftType.includes('A350') ? '156,000 kg' : '97,530 kg',
      passengers: isBoeing ? '258' : aircraft.aircraftType.includes('A350') ? '335' : '292',
      range: isBoeing ? '7,635 nm' : aircraft.aircraftType.includes('A350') ? '8,700 nm' : '6,350 nm',
      costPerHour: isBoeing ? '$8,500' : aircraft.aircraftType.includes('A350') ? '$9,200' : '$7,800',
      age: age,
      engines: isBoeing ? 'GEnx-1B64' : aircraft.aircraftType.includes('A350') ? 'Trent XWB-97' : 'Trent 700',
      nextFlight: `VS${Math.floor(Math.random() * 900) + 100}`,
      maintenance: age < 3 ? 'Low Risk' : age < 6 ? 'Medium Risk' : 'High Risk',
      maintenanceColor: age < 3 ? 'text-green-600' : age < 6 ? 'text-yellow-600' : 'text-red-600'
    };
  };

  const aircraftData = getAircraftSpecificData(currentAircraft);
  
  console.log('Current aircraft:', selectedAircraft);
  console.log('Current aircraft data:', currentAircraft);
  console.log('Fleet data:', fleetData);
  return (
    <div className="h-full w-full bg-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              Digital Twin Dashboard
            </h1>
            
            {/* Aircraft Selector */}
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Select Aircraft:</label>
              <select
                value={selectedAircraft}
                onChange={(e) => {
                  console.log('Dropdown changed:', e.target.value);
                  setSelectedAircraft(e.target.value);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[200px]"
                disabled={loading}
              >
                {loading ? (
                  <option>Loading aircraft...</option>
                ) : (
                  fleetData.map((aircraft) => (
                    <option key={aircraft.registration} value={aircraft.registration}>
                      {aircraft.registration} - {aircraft.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-gray-600">
            <span>Aircraft: {currentAircraft.registration}</span>
            <span>•</span>
            <span>Type: {currentAircraft.aircraftType}</span>
            <span>•</span>
            <span>Mode: {displayMode}</span>
            {currentAircraft.name && currentAircraft.name !== currentAircraft.aircraftType + ' ' + currentAircraft.registration && (
              <>
                <span>•</span>
                <span>Name: {currentAircraft.name}</span>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Aircraft Identity */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Aircraft Identity</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Registration:</span>
                <span className="font-medium">{currentAircraft.registration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium">{currentAircraft.aircraftType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivered:</span>
                <span className="font-medium">{new Date(currentAircraft.deliveryDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Age:</span>
                <span className="font-medium">{aircraftData.age} years</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-green-600">Active</span>
              </div>
            </div>
          </div>

          {/* Current State */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current State</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Location:</span>
                <span className="font-medium">EGLL (Heathrow)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium">On Ground</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fuel Capacity:</span>
                <span className="font-medium">{aircraftData.fuel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Engines:</span>
                <span className="font-medium">{aircraftData.engines}</span>
              </div>
            </div>
          </div>

          {/* Predictions */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ML Predictions</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Delay Risk:</span>
                <span className="font-medium text-green-600">Low</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Confidence:</span>
                <span className="font-medium">89%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">OTP Score:</span>
                <span className="font-medium">92%</span>
              </div>
            </div>
          </div>

          {/* Operations Data */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Operations</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Max Passengers:</span>
                <span className="font-medium">{aircraftData.passengers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Range:</span>
                <span className="font-medium">{aircraftData.range}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Next Flight:</span>
                <span className="font-medium">{aircraftData.nextFlight}</span>
              </div>
            </div>
          </div>

          {/* Diversion Capabilities */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Diversion</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Max Range:</span>
                <span className="font-medium">{aircraftData.range}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Alternates:</span>
                <span className="font-medium">EGKK, EGGW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fuel Capacity:</span>
                <span className="font-medium">{aircraftData.fuel}</span>
              </div>
            </div>
          </div>

          {/* Economics */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Economics</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Cost/Hour:</span>
                <span className="font-medium">{aircraftData.costPerHour}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fuel Efficiency:</span>
                <span className="font-medium">88%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Maintenance:</span>
                <span className={`font-medium ${aircraftData.maintenanceColor}`}>{aircraftData.maintenance}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Digital Twin Active</span>
            </div>
            <div className="text-sm text-gray-500">
              Last Update: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}