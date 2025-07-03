/**
 * Simple Digital Twin Component - Basic fallback for stability
 */

import React from 'react';

interface SimpleDigitalTwinProps {
  aircraftId: string;
  displayMode?: string;
}

export default function SimpleDigitalTwin({ 
  aircraftId, 
  displayMode = 'full' 
}: SimpleDigitalTwinProps) {
  return (
    <div className="h-full w-full bg-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Digital Twin Dashboard
          </h1>
          <p className="text-gray-600">
            Aircraft: {aircraftId} | Mode: {displayMode}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Aircraft Identity */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Aircraft Identity</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Registration:</span>
                <span className="font-medium">{aircraftId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium">Boeing 787-9</span>
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
                <span className="text-gray-600">Fuel:</span>
                <span className="font-medium">95,000 kg</span>
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
                <span className="text-gray-600">Passengers:</span>
                <span className="font-medium">287</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cargo:</span>
                <span className="font-medium">15,000 kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Next Flight:</span>
                <span className="font-medium">VS001</span>
              </div>
            </div>
          </div>

          {/* Diversion Capabilities */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Diversion</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Range:</span>
                <span className="font-medium">7,635 nm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Alternates:</span>
                <span className="font-medium">EGKK, EGGW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Endurance:</span>
                <span className="font-medium">8.5 hrs</span>
              </div>
            </div>
          </div>

          {/* Economics */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Economics</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Cost/Hour:</span>
                <span className="font-medium">$8,500</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fuel Efficiency:</span>
                <span className="font-medium">88%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Maintenance:</span>
                <span className="font-medium text-green-600">Low Risk</span>
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