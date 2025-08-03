import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  isNavigationCollapsed,
  setIsNavigationCollapsed,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Map URLs to navigation IDs
  const getViewModeFromPath = (pathname: string): string => {
    const pathMap: { [key: string]: string } = {
      '/': 'mission-control',
      '/mission-control': 'mission-control',
      '/fleet-operations': 'fleet-operations',
      '/realtime-ops': 'realtime-ops',
      '/network-performance': 'network-performance',
      '/flight': 'flight-details',
      '/notams': 'notams',
      '/weather': 'weather',
      '/hub-status': 'hub-status',
      '/diversion-planner': 'diversion-planner',
      '/crew-resourcing': 'crew-resourcing',
      '/active-diversions': 'active-diversions',
      '/intelligence': 'intelligence',
      '/risk-assessment': 'risk-assessment',
      '/visa-requirements': 'visa-requirements',
      '/ai-operations': 'ai-operations',
      '/scenario-engine': 'scenario-engine',
      '/delay-prediction': 'delay-prediction',
      '/digital-twins/boeing': 'digital-twins-boeing',
      '/digital-twins/airbus': 'digital-twins-airbus',
      '/emergency': 'emergency',
    };
    return pathMap[pathname] || 'mission-control';
  };
  
  const viewMode = getViewModeFromPath(location.pathname);
  
  // Navigation function that uses React Router
  const navigateToView = (viewId: string) => {
    const routeMap: { [key: string]: string } = {
      'mission-control': '/mission-control',
      'fleet-operations': '/fleet-operations',
      'realtime-ops': '/realtime-ops',
      'network-performance': '/network-performance',
      'flight-details': '/flight',
      'notams': '/notams',
      'weather': '/weather',
      'hub-status': '/hub-status',
      'diversion-planner': '/diversion-planner',
      'crew-resourcing': '/crew-resourcing',
      'active-diversions': '/active-diversions',
      'intelligence': '/intelligence',
      'risk-assessment': '/risk-assessment',
      'visa-requirements': '/visa-requirements',
      'ai-operations': '/ai-operations',
      'scenario-engine': '/scenario-engine',
      'delay-prediction': '/delay-prediction',
      'digital-twins-boeing': '/digital-twins/boeing',
      'digital-twins-airbus': '/digital-twins/airbus',
      'emergency': '/emergency',
    };
    
    const route = routeMap[viewId];
    if (route) {
      navigate(route);
    } else {
      console.warn(`No route found for view: ${viewId}`);
    }
  };
  
  const navigationGroups: NavigationGroup[] = [
    {
      title: 'Mission Control',
      icon: Navigation,
      items: [
        { id: 'mission-control', label: 'Main Dashboard', icon: Gauge, variant: 'virgin-primary' },
        { id: 'fleet-operations', label: 'Fleet Operations', icon: Plane, variant: 'secondary' },
        { id: 'realtime-ops', label: 'Real-Time Ops', icon: Activity, variant: 'secondary', badge: 'LIVE', badgeVariant: 'caution' },
        { id: 'network-performance', label: 'Network Performance', icon: TrendingUp, variant: 'secondary' },
      ],
    },
    {
      title: 'Detail Pages',
      icon: FileText,
      items: [
        { id: 'notams', label: 'NOTAMs', icon: AlertTriangle, variant: 'warning' },
        { id: 'weather', label: 'Weather Systems', icon: Database, variant: 'secondary' },
        { id: 'hub-status', label: 'Hub Status', icon: Building, variant: 'secondary' },
      ],
    },
    {
      title: 'Operations Management',
      icon: Target,
      items: [
        { id: 'diversion-planner', label: 'Diversion Planner', icon: Navigation, variant: 'secondary' },
        { id: 'crew-resourcing', label: 'Crew Resourcing', icon: Users, variant: 'secondary' },
        { id: 'active-diversions', label: 'Active Diversions', icon: Phone, variant: 'warning' },
      ],
    },
    {
      title: 'Intelligence & Analytics',
      icon: Zap,
      items: [
        { id: 'ai-operations', label: 'AI Operations', icon: Zap, variant: 'premium', badge: 'AI', badgeVariant: 'premium' },
        { id: 'scenario-engine', label: 'What-If Scenarios', icon: Target, variant: 'premium' },
        { id: 'delay-prediction', label: 'Delay Prediction', icon: Clock, variant: 'secondary' },
        { id: 'intelligence', label: 'Intelligence Center', icon: Shield, variant: 'secondary' },
      ],
    },
    {
      title: 'Digital Twins',
      icon: Settings,
      items: [
        { id: 'digital-twins-boeing', label: 'Boeing 787', icon: Plane, variant: 'secondary' },
        { id: 'digital-twins-airbus', label: 'Airbus Fleet', icon: Plane, variant: 'secondary' },
      ],
    },
    {
      title: 'Emergency & Risk',
      icon: AlertTriangle,
      items: [
        { id: 'emergency', label: 'Emergency Response', icon: Phone, variant: 'destructive' },
        { id: 'risk-assessment', label: 'Risk Assessment', icon: Shield, variant: 'warning' },
        { id: 'visa-requirements', label: 'Visa Requirements', icon: Globe, variant: 'secondary' },
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
    <nav role="navigation" aria-label="Virgin Atlantic AINO Navigation" className="flex-shrink-0 h-screen p-4 bg-gray-50">
      <div className={`
        bg-white shadow-lg border border-gray-200 rounded-lg
        transition-all duration-300 ease-in-out h-full flex flex-col
        ${isNavigationCollapsed ? 'w-16' : 'w-72'}
      `}
      role="complementary"
      aria-expanded={!isNavigationCollapsed}
      >
        {/* Header */}
        <div className="p-2 border-b border-gray-200 flex-shrink-0">
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
                className="navigation-toggle bg-va-red-primary text-white hover:bg-va-red-heritage w-8 h-8 flex items-center justify-center rounded-md transition-all duration-200 cursor-pointer"
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
                  <VAHeading.H4 className="text-gray-900">AINO</VAHeading.H4>
                  <VAText.Caption className="text-va-red-primary">
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
                className="navigation-toggle bg-va-red-primary text-white hover:bg-va-red-heritage flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md transition-all duration-200 cursor-pointer"
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
                  <group.icon className="w-4 h-4 text-va-red-primary" />
                  <VAText.Label className="text-gray-600 text-xs uppercase tracking-wide">
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
                        onClick={() => navigateToView(item.id)}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium
                          transition-all duration-200 group
                          ${isActive 
                            ? 'bg-gradient-va-red text-white shadow-lg' 
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                          }
                        `}
                        aria-current={isActive ? 'page' : undefined}
                        aria-label={`${item.label}${item.badge ? ` (${item.badge})` : ''}`}
                        role="menuitem"
                      >
                        <IconComponent className={`
                          w-4 h-4 transition-colors duration-200
                          ${isActive ? 'text-white' : 'text-va-red-primary group-hover:text-va-red-heritage'}
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
          <div className="p-4 border-t border-gray-200">
            <div className="space-y-3">
              {/* Status Indicator */}
              <div className="flex items-center justify-between">
                <VAText.Small className="text-gray-500">System Status</VAText.Small>
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
                  onClick={() => navigateToView('design-showcase')}
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
                  <div key={item.id} className="relative group">
                    <button
                      onClick={() => navigateToView(item.id)}
                      className={`
                        w-12 h-12 flex items-center justify-center rounded-md
                        transition-all duration-200 relative
                        ${isActive 
                          ? 'bg-gradient-va-red text-white shadow-lg' 
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }
                      `}
                      title={item.label}
                      aria-label={`${item.label}${item.badge ? ` (${item.badge})` : ''}`}
                    >
                      <IconComponent className="w-5 h-5" />
                      {item.badge && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-va-red-primary rounded-full"></div>
                      )}
                    </button>
                    
                    {/* Tooltip */}
                    <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                      {item.label}
                      {item.badge && (
                        <span className="ml-1 text-gray-300">({item.badge})</span>
                      )}
                    </div>
                  </div>
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
