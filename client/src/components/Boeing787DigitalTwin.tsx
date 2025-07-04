/**
 * Boeing 787 Digital Twin Component
 * Now uses standardized digital twin format for consistency across all aircraft types
 */

import React from 'react';
import SimpleDigitalTwin from './SimpleDigitalTwin';

interface Boeing787DigitalTwinProps {
  flightId?: string;
  aircraftId?: string;
  displayMode?: 'full' | 'operations' | 'diversion' | 'whatif' | 'predictions';
}

export default function Boeing787DigitalTwin({ 
  flightId = 'VS3', 
  aircraftId = 'G-VAHH',
  displayMode = 'full'
}: Boeing787DigitalTwinProps) {
  // Use the simple digital twin component
  return (
    <SimpleDigitalTwin
      aircraftId={aircraftId}
      displayMode={displayMode}
      aircraftType="boeing"
    />
  );
}