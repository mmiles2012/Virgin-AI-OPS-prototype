/**
 * Airbus Digital Twin Component
 * Now uses standardized digital twin format for consistency across all aircraft types
 */

import React from 'react';
import MLEnhancedDigitalTwin from './MLEnhancedDigitalTwin';

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
  // Use the ML-enhanced digital twin component with live diversion capabilities
  return (
    <MLEnhancedDigitalTwin
      aircraftId={aircraftId}
      flightNumber={flightId}
      displayMode={displayMode === 'full' ? 'full' : 'compact'}
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