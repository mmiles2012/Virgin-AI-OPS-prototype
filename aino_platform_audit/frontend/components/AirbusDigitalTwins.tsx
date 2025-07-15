/**
 * Airbus Digital Twin Component
 * Now uses standardized digital twin format for consistency across all aircraft types
 */

import React from 'react';
import SimpleDigitalTwin from './SimpleDigitalTwin';

interface AirbusDigitalTwinProps {
  flightId?: string;
  aircraftId?: string;
  aircraftType?: 'A330-300' | 'A330-900' | 'A350-1000';
  displayMode?: 'full' | 'operations' | 'diversion' | 'whatif' | 'predictions';
}

export default function AirbusDigitalTwins({ 
  flightId = 'VS75', 
  aircraftId = 'G-VDOT',
  aircraftType = 'A350-1000',
  displayMode = 'full'
}: AirbusDigitalTwinProps) {
  // Use the simple digital twin component (stable version)
  return (
    <SimpleDigitalTwin
      aircraftId={aircraftId}
      displayMode={displayMode}
      aircraftType="airbus"
    />
  );
}

// Export individual aircraft types for backwards compatibility
export function AirbusA330DigitalTwin(props: Omit<AirbusDigitalTwinProps, 'aircraftType'>) {
  return <AirbusDigitalTwins {...props} aircraftType="A330-300" aircraftId="G-VGEM" />;
}

export function AirbusA330_900DigitalTwin(props: Omit<AirbusDigitalTwinProps, 'aircraftType'>) {
  return <AirbusDigitalTwins {...props} aircraftType="A330-900" aircraftId="G-VEII" />;
}

export function AirbusA350DigitalTwin(props: Omit<AirbusDigitalTwinProps, 'aircraftType'>) {
  return <AirbusDigitalTwins {...props} aircraftType="A350-1000" aircraftId="G-VDOT" />;
}