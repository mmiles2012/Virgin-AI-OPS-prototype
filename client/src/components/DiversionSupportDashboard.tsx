import React, { useState } from 'react';
import { AlertTriangle, Phone, Clock, DollarSign, Users, Plane, MapPin, CheckCircle } from 'lucide-react';
import { assessAirportCompatibility, assessDiversionAirports, AIRBUS_FLEET_SPECS } from './AirbusDigitalTwins';

interface DiversionRequest {
  flightNumber: string;
  aircraftType: string;
  diversionAirport: string;
  originalDestination: string;
  passengerCount: number;
  crewCount: number;
  diversionReason: 'medical' | 'technical' | 'weather' | 'fuel' | 'security' | 'other';
  estimatedDelayHours: number;
  urgencyLevel: 'routine' | 'urgent' | 'emergency';
}

interface DiversionSupportResponse {
  diversionId: string;
  status: 'initiated' | 'in-progress' | 'confirmed' | 'completed';
  hotelBooking?: {
    bookingId: string;
    hotelName: string;
    address: string;
    contactPhone: string;
    passengerRooms: number;
    crewRooms: number;
    totalCost: number;
    confirmationCode: string;
  };
  fuelCoordination?: {
    supplierId: string;
    supplierName: string;
    contactPhone: string;
    fuelQuantity: number;
    pricePerGallon: number;
    totalCost: number;
    estimatedDelivery: string;
  };
  groundHandling?: {
    handlerId: string;
    handlerName: string;
    contactPhone: string;
    servicesConfirmed: string[];
    totalCost: number;
    estimatedCompletion: string;
  };
  passengerServices?: {
    mealArrangements: {
      provider: string;
      mealTypes: string[];
      cost: number;
    };
    compensation: {
      type: string;
      valuePerPerson: number;
      totalValue: number;
    };
    totalServiceCost: number;
  };
  totalEstimatedCost: number;
  timeline: {
    initiatedAt: string;
    estimatedCompletion: string;
  };
  emergencyContacts: {
    operationsCenter: string;
    groundCoordinator: string;
    hotelCoordinator: string;
    fuelCoordinator: string;
  };
}

export default function DiversionSupportDashboard() {
  const [activeTab, setActiveTab] = useState<'initiate' | 'status' | 'services' | 'fuel' | 'airport'>('initiate');
  const [diversionRequest, setDiversionRequest] = useState<DiversionRequest>({
    flightNumber: '',
    aircraftType: 'Boeing 787',
    diversionAirport: '',
    originalDestination: '',
    passengerCount: 280,
    crewCount: 15,
    diversionReason: 'technical',
    estimatedDelayHours: 6,
    urgencyLevel: 'urgent'
  });
  const [diversionResponse, setDiversionResponse] = useState<DiversionSupportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [availableServices, setAvailableServices] = useState<any>(null);
  const [airportIntelligenceData, setAirportIntelligenceData] = useState<any>(null);
  const [airportIntelligenceLoading, setAirportIntelligenceLoading] = useState(false);

  const handleAirportIntelligenceSearch = async (airportCode: string) => {
    setAirportIntelligenceLoading(true);
    try {
      const response = await fetch(`/api/airports/comprehensive/${airportCode}`);
      const data = await response.json();
      if (data.success) {
        setAirportIntelligenceData(data.data);
      } else {
        setAirportIntelligenceData(null);
      }
    } catch (error) {
      console.error('Failed to fetch airport intelligence:', error);
      setAirportIntelligenceData(null);
    }
    setAirportIntelligenceLoading(false);
  };

  const handleInitiateDiversion = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/diversion/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(diversionRequest),
      });
      
      const data = await response.json();
      if (data.success) {
        setDiversionResponse(data.diversion);
        setActiveTab('status');
      }
    } catch (error) {
      console.error('Failed to initiate diversion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckServices = async (airportCode: string) => {
    try {
      const response = await fetch(`/api/diversion/services/${airportCode}`);
      const data = await response.json();
      if (data.success) {
        setAvailableServices(data.services);
      }
    } catch (error) {
      console.error('Failed to check services:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'emergency': return 'text-red-600 bg-red-100';
      case 'urgent': return 'text-orange-600 bg-orange-100';
      case 'routine': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'confirmed': return 'text-blue-600 bg-blue-100';
      case 'in-progress': return 'text-yellow-600 bg-yellow-100';
      case 'initiated': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Diversion Support Operations
          </h1>
          <p className="text-gray-600">
            Comprehensive coordination for flight diversions including hotels, fuel, ground handling, and passenger services
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg mb-6 w-fit">
          {[
            { id: 'initiate', label: 'Initiate Diversion', icon: AlertTriangle },
            { id: 'status', label: 'Diversion Status', icon: CheckCircle },
            { id: 'services', label: 'Available Services', icon: MapPin },
            { id: 'fuel', label: 'Fuel Analysis', icon: Plane },
            { id: 'airport', label: 'Airport Intelligence', icon: MapPin },
            { id: 'compatibility', label: 'Aircraft Compatibility', icon: Plane }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Initiate Diversion Tab */}
        {activeTab === 'initiate' && (
          <div className="bg-white rounded-xl shadow-lg p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Initiate Diversion Support
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Flight Number
                  </label>
                  <input
                    type="text"
                    value={diversionRequest.flightNumber}
                    onChange={(e) => setDiversionRequest({...diversionRequest, flightNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="VS123"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aircraft Type
                  </label>
                  <select
                    value={diversionRequest.aircraftType}
                    onChange={(e) => setDiversionRequest({...diversionRequest, aircraftType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Boeing 787">Boeing 787</option>
                    <option value="Airbus A350">Airbus A350</option>
                    <option value="Boeing 777">Boeing 777</option>
                    <option value="Airbus A330">Airbus A330</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diversion Airport
                  </label>
                  <input
                    type="text"
                    value={diversionRequest.diversionAirport}
                    onChange={(e) => {
                      setDiversionRequest({...diversionRequest, diversionAirport: e.target.value});
                      if (e.target.value.length === 4) {
                        handleCheckServices(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="EGLL"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Original Destination
                  </label>
                  <input
                    type="text"
                    value={diversionRequest.originalDestination}
                    onChange={(e) => setDiversionRequest({...diversionRequest, originalDestination: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="KJFK"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Passengers
                    </label>
                    <input
                      type="number"
                      value={diversionRequest.passengerCount}
                      onChange={(e) => setDiversionRequest({...diversionRequest, passengerCount: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Crew
                    </label>
                    <input
                      type="number"
                      value={diversionRequest.crewCount}
                      onChange={(e) => setDiversionRequest({...diversionRequest, crewCount: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diversion Reason
                  </label>
                  <select
                    value={diversionRequest.diversionReason}
                    onChange={(e) => setDiversionRequest({...diversionRequest, diversionReason: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="medical">Medical Emergency</option>
                    <option value="technical">Technical Issue</option>
                    <option value="weather">Weather</option>
                    <option value="fuel">Fuel Emergency</option>
                    <option value="security">Security Threat</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Delay (Hours)
                  </label>
                  <input
                    type="number"
                    value={diversionRequest.estimatedDelayHours}
                    onChange={(e) => setDiversionRequest({...diversionRequest, estimatedDelayHours: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Urgency Level
                  </label>
                  <select
                    value={diversionRequest.urgencyLevel}
                    onChange={(e) => setDiversionRequest({...diversionRequest, urgencyLevel: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="routine">Routine</option>
                    <option value="urgent">Urgent</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
              </div>
            </div>

            {availableServices && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Available Services at {diversionRequest.diversionAirport}</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Hotels:</span> {availableServices.hotels?.length || 0} available
                  </div>
                  <div>
                    <span className="font-medium">Fuel:</span> {availableServices.fuelSuppliers?.length || 0} suppliers
                  </div>
                  <div>
                    <span className="font-medium">Ground:</span> {availableServices.groundHandlers?.length || 0} handlers
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={handleInitiateDiversion}
                disabled={isLoading || !diversionRequest.flightNumber || !diversionRequest.diversionAirport}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Initiating Diversion Support...</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={20} />
                    <span>Initiate Diversion Support</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Diversion Status Tab */}
        {activeTab === 'status' && diversionResponse && (
          <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Status Overview */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Diversion Status: {diversionResponse.diversionId}
                </h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(diversionResponse.status)}`}>
                  {diversionResponse.status.toUpperCase()}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center space-x-3">
                  <DollarSign className="text-green-600" size={24} />
                  <div>
                    <p className="text-sm text-gray-600">Total Estimated Cost</p>
                    <p className="text-lg font-semibold">{formatCurrency(diversionResponse.totalEstimatedCost)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Clock className="text-blue-600" size={24} />
                  <div>
                    <p className="text-sm text-gray-600">Initiated At</p>
                    <p className="text-lg font-semibold">{formatDateTime(diversionResponse.timeline.initiatedAt)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Clock className="text-orange-600" size={24} />
                  <div>
                    <p className="text-sm text-gray-600">Est. Completion</p>
                    <p className="text-lg font-semibold">{formatDateTime(diversionResponse.timeline.estimatedCompletion)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hotel Booking */}
            {diversionResponse.hotelBooking && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Users className="text-blue-600" size={20} />
                  <span>Hotel Accommodation</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="font-medium">{diversionResponse.hotelBooking.hotelName}</p>
                    <p className="text-gray-600">{diversionResponse.hotelBooking.address}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Confirmation: {diversionResponse.hotelBooking.confirmationCode}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Passenger Rooms:</span>
                      <span>{diversionResponse.hotelBooking.passengerRooms}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Crew Rooms:</span>
                      <span>{diversionResponse.hotelBooking.crewRooms}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Total Cost:</span>
                      <span>{formatCurrency(diversionResponse.hotelBooking.totalCost)}</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-3">
                      <Phone size={16} className="text-gray-400" />
                      <span className="text-sm">{diversionResponse.hotelBooking.contactPhone}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Fuel Coordination */}
            {diversionResponse.fuelCoordination && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Plane className="text-green-600" size={20} />
                  <span>Fuel Coordination</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="font-medium">{diversionResponse.fuelCoordination.supplierName}</p>
                    <p className="text-sm text-gray-500">ID: {diversionResponse.fuelCoordination.supplierId}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Phone size={16} className="text-gray-400" />
                      <span className="text-sm">{diversionResponse.fuelCoordination.contactPhone}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Quantity:</span>
                      <span>{diversionResponse.fuelCoordination.fuelQuantity.toLocaleString()} gallons</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price per Gallon:</span>
                      <span>${diversionResponse.fuelCoordination.pricePerGallon}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Total Cost:</span>
                      <span>{formatCurrency(diversionResponse.fuelCoordination.totalCost)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Est. Delivery:</span>
                      <span>{formatDateTime(diversionResponse.fuelCoordination.estimatedDelivery)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Ground Handling */}
            {diversionResponse.groundHandling && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <MapPin className="text-purple-600" size={20} />
                  <span>Ground Handling</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="font-medium">{diversionResponse.groundHandling.handlerName}</p>
                    <p className="text-sm text-gray-500">ID: {diversionResponse.groundHandling.handlerId}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Phone size={16} className="text-gray-400" />
                      <span className="text-sm">{diversionResponse.groundHandling.contactPhone}</span>
                    </div>
                    
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700">Services Confirmed:</p>
                      <ul className="text-sm text-gray-600 mt-1">
                        {diversionResponse.groundHandling.servicesConfirmed.map((service, index) => (
                          <li key={index} className="capitalize">• {service.replace('_', ' ')}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between font-medium">
                      <span>Total Cost:</span>
                      <span>{formatCurrency(diversionResponse.groundHandling.totalCost)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Est. Completion:</span>
                      <span>{formatDateTime(diversionResponse.groundHandling.estimatedCompletion)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Passenger Services */}
            {diversionResponse.passengerServices && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Users className="text-orange-600" size={20} />
                  <span>Passenger Services</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="mb-4">
                      <p className="font-medium">Meal Arrangements</p>
                      <p className="text-sm text-gray-600">Provider: {diversionResponse.passengerServices.mealArrangements.provider}</p>
                      <p className="text-sm text-gray-600">
                        Types: {diversionResponse.passengerServices.mealArrangements.mealTypes.join(', ')}
                      </p>
                      <p className="text-sm font-medium">Cost: {formatCurrency(diversionResponse.passengerServices.mealArrangements.cost)}</p>
                    </div>
                  </div>
                  
                  <div>
                    <div className="mb-4">
                      <p className="font-medium">Passenger Compensation</p>
                      <p className="text-sm text-gray-600">Type: {diversionResponse.passengerServices.compensation.type}</p>
                      <p className="text-sm text-gray-600">
                        Per Person: {formatCurrency(diversionResponse.passengerServices.compensation.valuePerPerson)}
                      </p>
                      <p className="text-sm font-medium">
                        Total: {formatCurrency(diversionResponse.passengerServices.compensation.totalValue)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Service Cost:</span>
                    <span className="text-lg font-semibold">{formatCurrency(diversionResponse.passengerServices.totalServiceCost)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Emergency Contacts */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Phone className="text-red-600" size={20} />
                <span>Emergency Contacts</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(diversionResponse.emergencyContacts).map(([role, contact]) => (
                  <div key={role} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium capitalize">{role.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="text-blue-600 font-mono">{contact}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="bg-white rounded-xl shadow-lg p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Available Services by Airport
            </h2>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="Enter airport code (e.g., EGLL)"
                className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onBlur={(e) => {
                  if (e.target.value.length === 4) {
                    handleCheckServices(e.target.value);
                  }
                }}
              />
            </div>
            
            {availableServices && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-3">Hotels</h3>
                    {availableServices.hotels?.map((hotel: any, index: number) => (
                      <div key={index} className="mb-2">
                        <p className="font-medium">{hotel.name}</p>
                        <p className="text-sm text-gray-600">{hotel.contact}</p>
                        <span className={`inline-block px-2 py-1 rounded text-xs ${hotel.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {hotel.available ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-semibold text-green-900 mb-3">Fuel Suppliers</h3>
                    {availableServices.fuelSuppliers?.map((supplier: any, index: number) => (
                      <div key={index} className="mb-2">
                        <p className="font-medium">{supplier.name}</p>
                        <p className="text-sm text-gray-600">{supplier.contact}</p>
                        <span className={`inline-block px-2 py-1 rounded text-xs ${supplier.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {supplier.available ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h3 className="font-semibold text-purple-900 mb-3">Ground Handlers</h3>
                    {availableServices.groundHandlers?.map((handler: any, index: number) => (
                      <div key={index} className="mb-2">
                        <p className="font-medium">{handler.name}</p>
                        <p className="text-sm text-gray-600">{handler.contact}</p>
                        <span className={`inline-block px-2 py-1 rounded text-xs ${handler.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {handler.available ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Fuel Analysis Tab */}
        {activeTab === 'fuel' && (
          <div className="bg-white rounded-xl shadow-lg p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Comprehensive Fuel Analysis
            </h2>
            
            <div className="mb-6">
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  placeholder="Enter airport code (e.g., KJFK)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  id="fuelAirportCode"
                />
                <button
                  onClick={async () => {
                    const input = document.getElementById('fuelAirportCode') as HTMLInputElement;
                    const airportCode = input.value.toUpperCase();
                    if (airportCode) {
                      try {
                        const response = await fetch(`/api/fuel/sustainable/${airportCode}`);
                        const data = await response.json();
                        if (data.success) {
                          const fuelData = data.fuelAnalysis;
                          
                          // Display comprehensive fuel analysis
                          const resultsDiv = document.getElementById('fuelResults');
                          if (resultsDiv) {
                            resultsDiv.innerHTML = `
                              <div class="space-y-6">
                                <!-- Cost Comparison -->
                                <div class="bg-blue-50 p-4 rounded-lg">
                                  <h3 class="font-semibold text-blue-900 mb-3">Fuel Cost Comparison</h3>
                                  <div class="grid grid-cols-3 gap-4">
                                    <div class="text-center">
                                      <div class="text-2xl font-bold text-blue-600">$${fuelData.costComparison.traditional.toFixed(2)}</div>
                                      <div class="text-sm text-gray-600">Traditional Jet-A1</div>
                                    </div>
                                    <div class="text-center">
                                      <div class="text-2xl font-bold text-green-600">$${fuelData.costComparison.sustainable.toFixed(2)}</div>
                                      <div class="text-sm text-gray-600">Sustainable Aviation Fuel</div>
                                    </div>
                                    <div class="text-center">
                                      <div class="text-2xl font-bold text-red-600">$${fuelData.costComparison.emergency.toFixed(2)}</div>
                                      <div class="text-sm text-gray-600">Emergency Supply</div>
                                    </div>
                                  </div>
                                </div>

                                <!-- Environmental Impact -->
                                <div class="bg-green-50 p-4 rounded-lg">
                                  <h3 class="font-semibold text-green-900 mb-3">Environmental Impact</h3>
                                  <div class="grid grid-cols-2 gap-4">
                                    <div>
                                      <div class="text-2xl font-bold text-green-600">${fuelData.environmentalImpact.co2ReductionPercent}%</div>
                                      <div class="text-sm text-gray-600">CO₂ Reduction with SAF</div>
                                    </div>
                                    <div>
                                      <div class="text-2xl font-bold text-green-600">${fuelData.environmentalImpact.sustainabilityScore}/100</div>
                                      <div class="text-sm text-gray-600">Sustainability Score</div>
                                    </div>
                                  </div>
                                </div>

                                <!-- Traditional Fuel Suppliers -->
                                <div>
                                  <h3 class="font-semibold text-gray-900 mb-3">Traditional Fuel Suppliers</h3>
                                  <div class="space-y-3">
                                    ${fuelData.traditionalFuel.map(supplier => `
                                      <div class="border border-gray-200 rounded-lg p-4">
                                        <div class="flex justify-between items-start">
                                          <div>
                                            <h4 class="font-medium text-gray-900">${supplier.name}</h4>
                                            <p class="text-sm text-gray-600">${supplier.contact}</p>
                                            <p class="text-sm text-gray-600">${supplier.location.address}</p>
                                          </div>
                                          <div class="text-right">
                                            <div class="text-lg font-semibold text-blue-600">$${supplier.pricing.jetA1PerGallon.toFixed(2)}/gal</div>
                                            <div class="text-sm text-gray-600">${supplier.capacity.deliveryTimeMinutes} min delivery</div>
                                          </div>
                                        </div>
                                        <div class="mt-3 flex flex-wrap gap-2">
                                          ${supplier.services.twentyFourSeven ? '<span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">24/7 Available</span>' : ''}
                                          ${supplier.services.emergencySupply ? '<span class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Emergency Supply</span>' : ''}
                                          ${supplier.fuelTypes.sustainableAviationFuel ? '<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">SAF Available</span>' : ''}
                                        </div>
                                      </div>
                                    `).join('')}
                                  </div>
                                </div>

                                <!-- Emergency Options -->
                                <div>
                                  <h3 class="font-semibold text-gray-900 mb-3">Emergency Fuel Options</h3>
                                  <div class="space-y-3">
                                    ${fuelData.emergencyOptions.map(supplier => `
                                      <div class="border border-red-200 bg-red-50 rounded-lg p-4">
                                        <div class="flex justify-between items-start">
                                          <div>
                                            <h4 class="font-medium text-red-900">${supplier.name}</h4>
                                            <p class="text-sm text-red-700">${supplier.contact}</p>
                                            <p class="text-sm text-red-600">Emergency Rate: ${supplier.pricing.emergencyRateMultiplier}x standard</p>
                                          </div>
                                          <div class="text-right">
                                            <div class="text-lg font-semibold text-red-600">$${(supplier.pricing.jetA1PerGallon * supplier.pricing.emergencyRateMultiplier).toFixed(2)}/gal</div>
                                            <div class="text-sm text-red-600">${supplier.capacity.deliveryTimeMinutes} min delivery</div>
                                          </div>
                                        </div>
                                      </div>
                                    `).join('')}
                                  </div>
                                </div>

                                <!-- Recommendations -->
                                <div class="bg-yellow-50 p-4 rounded-lg">
                                  <h3 class="font-semibold text-yellow-900 mb-3">Fuel Recommendations</h3>
                                  <ul class="space-y-2">
                                    ${fuelData.recommendations.map(rec => `
                                      <li class="flex items-start space-x-2">
                                        <div class="w-2 h-2 bg-yellow-600 rounded-full mt-2 flex-shrink-0"></div>
                                        <span class="text-yellow-800">${rec}</span>
                                      </li>
                                    `).join('')}
                                  </ul>
                                </div>
                              </div>
                            `;
                          }
                        }
                      } catch (error) {
                        console.error('Failed to fetch fuel analysis:', error);
                        const resultsDiv = document.getElementById('fuelResults');
                        if (resultsDiv) {
                          resultsDiv.innerHTML = '<div class="text-red-600 p-4">Failed to load fuel analysis. Please try again.</div>';
                        }
                      }
                    }
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Analyze Fuel Options
                </button>
              </div>
            </div>

            <div id="fuelResults" className="mt-6">
              <div className="text-center text-gray-500 py-8">
                Enter an airport code to view comprehensive fuel analysis including traditional, sustainable, and emergency fuel options
              </div>
            </div>
          </div>
        )}

        {/* Airport Intelligence Tab */}
        {activeTab === 'airport' && (
          <div className="bg-white rounded-xl shadow-lg p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Comprehensive Airport Intelligence
            </h2>
            
            <div className="mb-6">
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  placeholder="Enter airport code (e.g., EGLL, KJFK)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  id="airportIntelligenceCode"
                />
                <button
                  onClick={() => {
                    const input = document.getElementById('airportIntelligenceCode') as HTMLInputElement;
                    const airportCode = input.value.toUpperCase();
                    if (airportCode) {
                      handleAirportIntelligenceSearch(airportCode);
                    }
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Analyze Airport
                </button>
              </div>
            </div>

            <div className="mt-6">
              {airportIntelligenceLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  <span className="ml-3 text-gray-600">Loading airport intelligence...</span>
                </div>
              ) : airportIntelligenceData ? (
                <div className="space-y-6">
                  {/* Basic Airport Information */}
                  {airportIntelligenceData.basicInfo && (
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <h3 className="text-xl font-bold text-blue-900 mb-4">
                        {airportIntelligenceData.basicInfo.airport_name}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">IATA/ICAO</div>
                          <div className="font-semibold">
                            {airportIntelligenceData.basicInfo.iata_code}/{airportIntelligenceData.basicInfo.icao_code}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Location</div>
                          <div className="font-semibold">
                            {airportIntelligenceData.basicInfo.city}, {airportIntelligenceData.basicInfo.country}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Type</div>
                          <div className="font-semibold capitalize">
                            {airportIntelligenceData.basicInfo.type?.replace('_', ' ')}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Elevation</div>
                          <div className="font-semibold">{airportIntelligenceData.basicInfo.elevation} ft</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Timezone</div>
                          <div className="font-semibold">{airportIntelligenceData.basicInfo.timezone}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Coordinates</div>
                          <div className="font-semibold">
                            {airportIntelligenceData.basicInfo.latitude?.toFixed(4)}, {airportIntelligenceData.basicInfo.longitude?.toFixed(4)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Operational Metrics */}
                  <div className="bg-green-50 p-6 rounded-lg">
                    <h3 className="text-lg font-bold text-green-900 mb-4">Operational Capabilities</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {airportIntelligenceData.operationalMetrics.capacity.runways}
                        </div>
                        <div className="text-sm text-gray-600">Runways</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {airportIntelligenceData.operationalMetrics.capacity.terminals}
                        </div>
                        <div className="text-sm text-gray-600">Terminals</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {airportIntelligenceData.operationalMetrics.capacity.gates}
                        </div>
                        <div className="text-sm text-gray-600">Gates</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {airportIntelligenceData.operationalMetrics.capacity.hourlyCapacity}
                        </div>
                        <div className="text-sm text-gray-600">Hourly Capacity</div>
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="bg-yellow-50 p-6 rounded-lg">
                    <h3 className="text-lg font-bold text-yellow-900 mb-4">Performance Metrics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {airportIntelligenceData.operationalMetrics.efficiency.onTimePerformance?.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">On-Time Performance</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {airportIntelligenceData.operationalMetrics.efficiency.averageDelay?.toFixed(0)} min
                        </div>
                        <div className="text-sm text-gray-600">Average Delay</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {airportIntelligenceData.operationalMetrics.efficiency.capacity_utilization ? 
                            `${airportIntelligenceData.operationalMetrics.efficiency.capacity_utilization.toFixed(1)}%` : 
                            'N/A'
                          }
                        </div>
                        <div className="text-sm text-gray-600">Capacity Utilization</div>
                      </div>
                    </div>
                  </div>

                  {/* Operating Airlines */}
                  {airportIntelligenceData.airlines && airportIntelligenceData.airlines.length > 0 && (
                    <div className="bg-purple-50 p-6 rounded-lg">
                      <h3 className="text-lg font-bold text-purple-900 mb-4">
                        Operating Airlines ({airportIntelligenceData.airlines.length} carriers)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                        {airportIntelligenceData.airlines.slice(0, 12).map((airline: any, index: number) => (
                          <div key={index} className="bg-white p-3 rounded border">
                            <div className="font-medium text-purple-900">{airline.airline_name}</div>
                            <div className="text-sm text-gray-600">{airline.iata_code}/{airline.icao_code}</div>
                            <div className="text-xs text-gray-500">{airline.country}</div>
                          </div>
                        ))}
                      </div>
                      {airportIntelligenceData.airlines.length > 12 && (
                        <div className="text-sm text-gray-600 mt-3">
                          ... and {airportIntelligenceData.airlines.length - 12} more carriers
                        </div>
                      )}
                    </div>
                  )}

                  {/* Services Available */}
                  <div className="bg-indigo-50 p-6 rounded-lg">
                    <h3 className="text-lg font-bold text-indigo-900 mb-4">Available Services</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          airportIntelligenceData.operationalMetrics.services.cargoFacilities ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <span className="text-sm">Cargo Facilities</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          airportIntelligenceData.operationalMetrics.services.customsFacilities ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <span className="text-sm">Customs Facilities</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          airportIntelligenceData.operationalMetrics.services.emergencyServices ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <span className="text-sm">Emergency Services</span>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="text-sm font-medium text-indigo-900 mb-2">Fuel Suppliers:</div>
                      <div className="flex flex-wrap gap-2">
                        {airportIntelligenceData.operationalMetrics.services.fuelSuppliers.map((supplier: string, index: number) => (
                          <span key={index} className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded">
                            {supplier}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="text-sm font-medium text-indigo-900 mb-2">Ground Handlers:</div>
                      <div className="flex flex-wrap gap-2">
                        {airportIntelligenceData.operationalMetrics.services.groundHandlers.map((handler: string, index: number) => (
                          <span key={index} className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded">
                            {handler}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Operational Recommendations */}
                  <div className="bg-orange-50 p-6 rounded-lg">
                    <h3 className="text-lg font-bold text-orange-900 mb-4">Operational Recommendations</h3>
                    <ul className="space-y-2">
                      {airportIntelligenceData.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-orange-600 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-orange-800">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Enter an airport code to view comprehensive operational intelligence including capacity, performance metrics, operating airlines, and service availability
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}