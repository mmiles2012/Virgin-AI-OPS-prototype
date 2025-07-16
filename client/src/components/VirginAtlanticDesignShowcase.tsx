import React from 'react';
import { 
  VirginAtlanticButton, 
  StatusBadge, 
  VirginAtlanticCard, 
  VAHeading, 
  VAText 
} from './ui/VirginAtlanticComponents';
import { 
  Plane, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Settings,
  MapPin,
  Users,
  Activity,
  TrendingUp,
  Shield,
  Zap
} from 'lucide-react';

const VirginAtlanticDesignShowcase: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <VAHeading.H1 className="flex items-center justify-center gap-3">
          <Plane className="h-8 w-8 text-va-red-primary" />
          AINO Virgin Atlantic Design System
        </VAHeading.H1>
        <VAText.Large className="max-w-2xl mx-auto">
          Aviation Intelligence Operations Platform with Virgin Atlantic's distinctive design language, 
          combining bold confidence with premium functionality.
        </VAText.Large>
      </div>

      {/* Button Showcase */}
      <VirginAtlanticCard className="p-6">
        <VAHeading.H3 className="mb-4">Button Variants</VAHeading.H3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <VAText.Label>Primary Actions</VAText.Label>
            <div className="flex flex-col gap-2">
              <VirginAtlanticButton variant="primary" size="sm">
                Book Flight
              </VirginAtlanticButton>
              <VirginAtlanticButton variant="primary">
                Departure Control
              </VirginAtlanticButton>
              <VirginAtlanticButton variant="primary" size="lg">
                Emergency Response
              </VirginAtlanticButton>
            </div>
          </div>

          <div className="space-y-2">
            <VAText.Label>Aviation Operations</VAText.Label>
            <div className="flex flex-col gap-2">
              <VirginAtlanticButton variant="secondary" size="sm">
                <Activity className="w-4 h-4 mr-2" />
                Monitor
              </VirginAtlanticButton>
              <VirginAtlanticButton variant="success">
                <CheckCircle className="w-4 h-4 mr-2" />
                Cleared
              </VirginAtlanticButton>
              <VirginAtlanticButton variant="warning">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Caution
              </VirginAtlanticButton>
            </div>
          </div>

          <div className="space-y-2">
            <VAText.Label>Status Actions</VAText.Label>
            <div className="flex flex-col gap-2">
              <VirginAtlanticButton variant="destructive" size="sm">
                <Shield className="w-4 h-4 mr-2" />
                Alert
              </VirginAtlanticButton>
              <VirginAtlanticButton variant="premium">
                <Zap className="w-4 h-4 mr-2" />
                Premium
              </VirginAtlanticButton>
              <VirginAtlanticButton variant="emergency">
                EMERGENCY
              </VirginAtlanticButton>
            </div>
          </div>

          <div className="space-y-2">
            <VAText.Label>Outline & Ghost</VAText.Label>
            <div className="flex flex-col gap-2">
              <VirginAtlanticButton variant="outline" size="sm">
                Settings
              </VirginAtlanticButton>
              <VirginAtlanticButton variant="ghost-blue">
                Details
              </VirginAtlanticButton>
              <VirginAtlanticButton variant="muted">
                Disabled
              </VirginAtlanticButton>
            </div>
          </div>
        </div>
      </VirginAtlanticCard>

      {/* Status Badge Showcase */}
      <VirginAtlanticCard className="p-6">
        <VAHeading.H3 className="mb-4">Status Indicators</VAHeading.H3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <VAText.Label>Flight Status</VAText.Label>
            <div className="flex flex-wrap gap-2">
              <StatusBadge variant="safe">On Time</StatusBadge>
              <StatusBadge variant="caution">Delayed</StatusBadge>
              <StatusBadge variant="critical">Cancelled</StatusBadge>
              <StatusBadge variant="info">Boarding</StatusBadge>
            </div>
          </div>

          <div className="space-y-3">
            <VAText.Label>System Health</VAText.Label>
            <div className="flex flex-wrap gap-2">
              <StatusBadge variant="safe" size="lg">
                <CheckCircle className="w-3 h-3 mr-1" />
                Operational
              </StatusBadge>
              <StatusBadge variant="caution" size="lg">
                <Clock className="w-3 h-3 mr-1" />
                Maintenance
              </StatusBadge>
              <StatusBadge variant="critical" size="lg">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Critical
              </StatusBadge>
            </div>
          </div>

          <div className="space-y-3">
            <VAText.Label>Priority Levels</VAText.Label>
            <div className="flex flex-wrap gap-2">
              <StatusBadge variant="premium" size="sm">HIGH</StatusBadge>
              <StatusBadge variant="info" size="sm">MEDIUM</StatusBadge>
              <StatusBadge variant="muted" size="sm">LOW</StatusBadge>
            </div>
          </div>
        </div>
      </VirginAtlanticCard>

      {/* Card Variants Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <VirginAtlanticCard variant="default" className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <MapPin className="h-5 w-5 text-va-red-primary" />
            <VAHeading.H4>Default Card</VAHeading.H4>
          </div>
          <VAText.Body>
            Standard card styling with Virgin Atlantic branding and smooth hover effects.
          </VAText.Body>
          <div className="mt-4 flex gap-2">
            <StatusBadge variant="info" size="sm">LHR</StatusBadge>
            <StatusBadge variant="safe" size="sm">Active</StatusBadge>
          </div>
        </VirginAtlanticCard>

        <VirginAtlanticCard variant="aviation" className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Activity className="h-5 w-5 text-aero-blue-primary" />
            <VAHeading.H4>Aviation Panel</VAHeading.H4>
          </div>
          <VAText.Body>
            Specialized aviation styling with gradient backgrounds and premium feel.
          </VAText.Body>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Altitude:</span>
              <span className="text-aero-blue-light">35,000 ft</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Speed:</span>
              <span className="text-aero-green-safe">450 kts</span>
            </div>
          </div>
        </VirginAtlanticCard>

        <VirginAtlanticCard variant="glass" className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Users className="h-5 w-5 text-aero-purple-premium" />
            <VAHeading.H4>Glass Panel</VAHeading.H4>
          </div>
          <VAText.Body>
            Modern glass morphism effect with transparency and backdrop blur.
          </VAText.Body>
          <div className="mt-4">
            <VirginAtlanticButton variant="ghost-blue" size="sm" className="w-full">
              View Details
            </VirginAtlanticButton>
          </div>
        </VirginAtlanticCard>

        <VirginAtlanticCard variant="cockpit" className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="h-5 w-5 text-aero-blue-light" />
            <VAHeading.H4>Cockpit Display</VAHeading.H4>
          </div>
          <VAText.Body>
            High-tech cockpit styling with blue glow effects and premium aviation feel.
          </VAText.Body>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="text-center p-2 bg-aero-blue-primary/10 rounded">
              <div className="text-aero-blue-light font-mono">98.2%</div>
              <div className="text-muted-foreground">System</div>
            </div>
            <div className="text-center p-2 bg-aero-green-safe/10 rounded">
              <div className="text-aero-green-safe font-mono">NORMAL</div>
              <div className="text-muted-foreground">Status</div>
            </div>
          </div>
        </VirginAtlanticCard>
      </div>

      {/* Typography Showcase */}
      <VirginAtlanticCard className="p-6">
        <VAHeading.H3 className="mb-4">Typography Scale</VAHeading.H3>
        <div className="space-y-4">
          <div>
            <VAHeading.H1>Heading XL - Main Titles</VAHeading.H1>
            <VAText.Caption>va-heading-xl - Used for page titles and primary headings</VAText.Caption>
          </div>
          <div>
            <VAHeading.H2>Heading Large - Section Headers</VAHeading.H2>
            <VAText.Caption>va-heading-lg - Used for major section divisions</VAText.Caption>
          </div>
          <div>
            <VAHeading.H3>Heading Medium - Subsections</VAHeading.H3>
            <VAText.Caption>va-heading-md - Used for card titles and subsections</VAText.Caption>
          </div>
          <div>
            <VAHeading.H4>Heading Small - Minor Headers</VAHeading.H4>
            <VAText.Caption>va-heading-sm - Used for component titles</VAText.Caption>
          </div>
          <div>
            <VAText.Large>
              Large body text for important content and descriptions that need emphasis.
            </VAText.Large>
            <VAText.Caption>va-body-lg - Emphasized content</VAText.Caption>
          </div>
          <div>
            <VAText.Body>
              Regular body text for standard content, paragraphs, and general information.
            </VAText.Body>
            <VAText.Caption>va-body-md - Standard content</VAText.Caption>
          </div>
          <div>
            <VAText.Small>
              Small text for supplementary information, captions, and metadata.
            </VAText.Small>
            <VAText.Caption>va-body-sm - Supplementary content</VAText.Caption>
          </div>
        </div>
      </VirginAtlanticCard>

      {/* Color Palette Display */}
      <VirginAtlanticCard className="p-6">
        <VAHeading.H3 className="mb-4">Virgin Atlantic Color Palette</VAHeading.H3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-3">
            <VAText.Label>Brand Colors</VAText.Label>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-va-red-primary"></div>
                <div>
                  <div className="text-sm font-medium">Virgin Red</div>
                  <div className="text-xs text-muted-foreground">#E10A17</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-va-blue"></div>
                <div>
                  <div className="text-sm font-medium">Sky Blue</div>
                  <div className="text-xs text-muted-foreground">#0066CC</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <VAText.Label>Aviation Operations</VAText.Label>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-aero-green-safe"></div>
                <div>
                  <div className="text-sm font-medium">Safe Green</div>
                  <div className="text-xs text-muted-foreground">#10B981</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-aero-amber-caution"></div>
                <div>
                  <div className="text-sm font-medium">Caution Amber</div>
                  <div className="text-xs text-muted-foreground">#F59E0B</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <VAText.Label>Surface Colors</VAText.Label>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-surface-primary border border-surface-tertiary"></div>
                <div>
                  <div className="text-sm font-medium">Deep Space</div>
                  <div className="text-xs text-muted-foreground">#1B1B1B</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-surface-secondary"></div>
                <div>
                  <div className="text-sm font-medium">Secondary</div>
                  <div className="text-xs text-muted-foreground">#252A35</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <VAText.Label>Semantic Colors</VAText.Label>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-primary"></div>
                <div>
                  <div className="text-sm font-medium">Primary</div>
                  <div className="text-xs text-muted-foreground">Action</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-secondary"></div>
                <div>
                  <div className="text-sm font-medium">Secondary</div>
                  <div className="text-xs text-muted-foreground">Support</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </VirginAtlanticCard>

      {/* Footer */}
      <div className="text-center pt-8 border-t border-border">
        <VAText.Body>
          AINO Platform - Aviation Intelligence Operations with Virgin Atlantic Design Language
        </VAText.Body>
        <VAText.Small className="mt-2">
          Combining bold confidence, premium functionality, and distinctive Virgin personality
        </VAText.Small>
      </div>
    </div>
  );
};

export default VirginAtlanticDesignShowcase;
