import React from 'react';
import { 
  VirginAtlanticButton, 
  StatusBadge,
  VAHeading,
  VAText 
} from './ui/VirginAtlanticComponents';
import { 
  Plane, 
  Activity, 
  AlertTriangle, 
  Shield, 
  Map, 
  Building, 
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
  Users,
  Zap,
  FileText,
  Clock,
  Database,
  Gauge,
  Phone,
  Briefcase,
  Navigation,
  Globe,
  Target
} from 'lucide-react';

interface VirginAtlanticNavigationProps {
  viewMode: string;
  setViewMode: (mode: string) => void;
  isNavigationCollapsed: boolean;
  setIsNavigationCollapsed: (collapsed: boolean) => void;
}

interface NavigationGroup {
  title: string;
  icon: React.ComponentType<any>;
  items: {
    id: string;
    label: string;
    icon: React.ComponentType<any>;
    variant?: 'virgin-primary' | 'primary' | 'secondary' | 'success' | 'warning' | 'destructive' | 'premium';
    badge?: string;
    badgeVariant?: 'safe' | 'caution' | 'critical' | 'info' | 'premium';
  }[];
}

const VirginAtlanticNavigation: React.FC<VirginAtlanticNavigationProps> = ({
  viewMode,
  setViewMode,
  isNavigationCollapsed,
  setIsNavigationCollapsed,
}) => {
  const navigationGroups: NavigationGroup[] = [
    {
      title: 'Core Operations',
      icon: Activity,
      items: [
        { id: 'overview', label: 'Operations Overview', icon: Gauge, variant: 'virgin-primary' },
        { id: 'realtime', label: 'Live Flight Operations', icon: Plane, variant: 'secondary', badge: 'LIVE', badgeVariant: 'info' },
        { id: 'operations', label: 'Fleet Operations', icon: Users, variant: 'secondary' },
        { id: 'otp-dashboard', label: 'Network OTP', icon: TrendingUp, variant: 'success' },
      ],
    },
    {
      title: 'Intelligence & Analysis',
      icon: Target,
      items: [
        { id: 'intelligence-dashboard', label: 'Intelligence Centre', icon: FileText, variant: 'secondary' },
        { id: 'enhanced-facilities', label: 'Airport Database', icon: Building, variant: 'secondary' },
        { id: 'geopolitical', label: 'Risk Assessment', icon: Shield, variant: 'warning' },
        { id: 'visa-requirements', label: 'Visa Requirements', icon: Globe, variant: 'secondary' },
      ],
    },
    {
      title: 'Safety & Alerts',
      icon: AlertTriangle,
      items: [
        { id: 'airspace', label: 'Airspace Alerts', icon: Navigation, variant: 'warning', badge: 'ACTIVE', badgeVariant: 'caution' },
        { id: 'faa-status', label: 'FAA NAS Status', icon: Database, variant: 'warning' },
        { id: 'emergency-testing', label: 'Emergency Response', icon: Phone, variant: 'destructive' },
        { id: 'enhanced-facilities', label: 'Facility Monitoring', icon: Building, variant: 'secondary' },
      ],
    },
    {
      title: 'AI & Analytics',
      icon: Zap,
      items: [
        { id: 'ai-operations', label: 'AI Operations Center', icon: Zap, variant: 'premium', badge: 'AI', badgeVariant: 'premium' },
        { id: 'scenario-engine', label: 'What-If Scenarios', icon: Target, variant: 'premium' },
        { id: 'delay-prediction', label: 'Delay Prediction', icon: Clock, variant: 'secondary' },
        { id: 'diversion-support', label: 'Diversion Support', icon: Navigation, variant: 'secondary' },
      ],
    },
    {
      title: 'Digital Twins',
      icon: Settings,
      items: [
        { id: 'boeing-twin', label: 'Boeing 787', icon: Plane, variant: 'secondary' },
        { id: 'airbus-twins', label: 'Airbus Fleet', icon: Plane, variant: 'secondary' },
        { id: 'airbus-operations', label: 'Airbus Operations', icon: Activity, variant: 'secondary' },
      ],
    },
    {
      title: 'Financial & Planning',
      icon: Briefcase,
      items: [
        { id: 'financial-analytics', label: 'Financial Analytics', icon: TrendingUp, variant: 'success' },
        { id: 'fleet-substitution', label: 'Fleet Substitution', icon: Users, variant: 'secondary' },
        { id: 'slot-risk', label: 'Slot Risk Analysis', icon: Clock, variant: 'warning' },
      ],
    },
  ];

  const getActiveGroup = () => {
    for (const group of navigationGroups) {
      if (group.items.some(item => item.id === viewMode)) {
        return group.title;
      }
    }
    return null;
  };

  return (
    <nav role="navigation" aria-label="Virgin Atlantic AINO Navigation" className="flex-shrink-0 h-screen p-4">
      <div className={`
        bg-gradient-aviation backdrop-blur-lg border border-surface-tertiary rounded-lg
        transition-all duration-300 ease-in-out overflow-hidden h-full flex flex-col
        ${isNavigationCollapsed ? 'w-16' : 'w-72'}
      `}
      role="complementary"
      aria-expanded={!isNavigationCollapsed}
      >
        {/* Header */}
        <div className="p-2 border-b border-surface-tertiary flex-shrink-0">
          {isNavigationCollapsed ? (
            /* Collapsed Header */
            <div className="flex justify-center">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Toggle button clicked (collapsed), current state:', isNavigationCollapsed);
                  setIsNavigationCollapsed(!isNavigationCollapsed);
                }}
                className="navigation-toggle bg-red-500 text-white hover:bg-red-400 w-8 h-8 flex items-center justify-center rounded-md border-2 border-white transition-all duration-200 cursor-pointer"
                title="Expand Navigation"
                type="button"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Expanded Header */
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-va-red rounded-lg flex items-center justify-center">
                  <Plane className="w-5 h-5 text-white" />
                </div>
                <div>
                  <VAHeading.H4 className="text-white">AINO</VAHeading.H4>
                  <VAText.Caption className="text-aero-blue-light">
                    Virgin Atlantic Operations
                  </VAText.Caption>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Toggle button clicked (expanded), current state:', isNavigationCollapsed);
                  setIsNavigationCollapsed(!isNavigationCollapsed);
                }}
                className="navigation-toggle bg-red-500 text-white hover:bg-red-400 flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md border-2 border-white transition-all duration-200 cursor-pointer"
                title="Collapse Navigation"
                type="button"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation Content */}
        <div className={`
          flex-1 overflow-hidden transition-all duration-300
          ${isNavigationCollapsed ? 'h-0 opacity-0' : 'h-auto opacity-100'}
        `}>
          <div className="h-full overflow-y-auto aviation-scrollable p-2">
            {navigationGroups.map((group, groupIndex) => (
              <div key={group.title} className="mb-4">
                {/* Group Header */}
                <div className="flex items-center gap-2 px-3 py-2 mb-2">
                  <group.icon className="w-4 h-4 text-aero-blue-light" />
                  <VAText.Label className="text-aero-blue-light text-xs uppercase tracking-wide">
                    {group.title}
                  </VAText.Label>
                </div>

                {/* Group Items */}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = viewMode === item.id;
                    const IconComponent = item.icon;

                    return (
                      <button
                        key={item.id}
                        onClick={() => setViewMode(item.id)}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium
                          transition-all duration-200 group
                          ${isActive 
                            ? 'bg-gradient-va-red text-white shadow-va-glow' 
                            : 'text-gray-300 hover:bg-surface-secondary hover:text-white'
                          }
                        `}
                        aria-current={isActive ? 'page' : undefined}
                        aria-label={`${item.label}${item.badge ? ` (${item.badge})` : ''}`}
                        role="menuitem"
                      >
                        <IconComponent className={`
                          w-4 h-4 transition-colors duration-200
                          ${isActive ? 'text-white' : 'text-aero-blue-light group-hover:text-white'}
                        `} />
                        
                        <span className="flex-1 text-left truncate">
                          {item.label}
                        </span>

                        {item.badge && (
                          <StatusBadge 
                            variant={item.badgeVariant} 
                            size="sm"
                            className="ml-auto"
                          >
                            {item.badge}
                          </StatusBadge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-surface-tertiary">
            <div className="space-y-3">
              {/* Status Indicator */}
              <div className="flex items-center justify-between">
                <VAText.Small className="text-gray-400">System Status</VAText.Small>
                <StatusBadge variant="safe" size="sm">
                  <Activity className="w-3 h-3 mr-1" />
                  Operational
                </StatusBadge>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <VirginAtlanticButton 
                  variant="ghost-blue" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => setViewMode('design-showcase')}
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Design
                </VirginAtlanticButton>
                <VirginAtlanticButton 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                >
                  <FileText className="w-3 h-3 mr-1" />
                  Docs
                </VirginAtlanticButton>
              </div>
            </div>
          </div>
        </div>

        {/* Collapsed State Content */}
        {isNavigationCollapsed && (
          <div className="p-2 space-y-2">
            {navigationGroups.flatMap(group => 
              group.items.map(item => {
                const isActive = viewMode === item.id;
                const IconComponent = item.icon;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setViewMode(item.id)}
                    className={`
                      w-12 h-12 flex items-center justify-center rounded-md
                      transition-all duration-200 relative group
                      ${isActive 
                        ? 'bg-gradient-va-red text-white shadow-va-glow' 
                        : 'text-gray-400 hover:bg-surface-secondary hover:text-white'
                      }
                    `}
                    title={item.label}
                  >
                    <IconComponent className="w-5 h-5" />
                    {item.badge && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-va-red-primary rounded-full"></div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default VirginAtlanticNavigation;
