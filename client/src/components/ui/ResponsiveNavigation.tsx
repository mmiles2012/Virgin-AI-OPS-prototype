import React, { useState } from 'react';
import { Menu, X, Home, Plane, MapPin, Settings, Bell } from 'lucide-react';
import { useResponsive, ShowOnMobile, HideOnMobile } from '../../contexts/ResponsiveContext';
import { cn } from '../../lib/utils';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  badge?: number;
}

interface ResponsiveNavigationProps {
  items: NavigationItem[];
  currentPath?: string;
  onItemClick?: (item: NavigationItem) => void;
  brand?: {
    name: string;
    logo?: React.ReactNode;
  };
}

const ResponsiveNavigation: React.FC<ResponsiveNavigationProps> = ({
  items,
  currentPath,
  onItemClick,
  brand = { name: 'AINO' }
}) => {
  const { isMobile } = useResponsive();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleItemClick = (item: NavigationItem) => {
    onItemClick?.(item);
    if (item.onClick) {
      item.onClick();
    }
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      {/* Desktop Navigation */}
      <HideOnMobile>
        <nav className="bg-card/95 backdrop-blur-sm border-r border-border w-64 min-h-screen p-4">
          {/* Brand */}
          <div className="flex items-center space-x-3 mb-8">
            {brand.logo}
            <h1 className="text-xl font-bold text-foreground">{brand.name}</h1>
          </div>
          
          {/* Navigation Items */}
          <div className="space-y-2">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={cn(
                  'w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors',
                  currentPath === item.id
                    ? 'bg-orange-500 text-foreground'
                    : 'text-slate-300 hover:bg-card hover:text-foreground'
                )}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="bg-red-500 text-foreground text-xs rounded-full px-2 py-1">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </nav>
      </HideOnMobile>

      {/* Mobile Navigation */}
      <ShowOnMobile>
        {/* Mobile Header */}
        <div className="bg-card/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center space-x-3">
            {brand.logo}
            <h1 className="text-lg font-bold text-foreground">{brand.name}</h1>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-foreground hover:bg-card rounded-lg"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setMobileMenuOpen(false)} />
        )}

        {/* Mobile Menu Drawer */}
        <div className={cn(
          'fixed top-0 right-0 h-full w-80 max-w-[80vw] bg-card transform transition-transform duration-300 z-50',
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        )}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                {brand.logo}
                <h2 className="text-lg font-bold text-foreground">{brand.name}</h2>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-foreground hover:bg-card rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-2">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    'w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors',
                    currentPath === item.id
                      ? 'bg-orange-500 text-foreground'
                      : 'text-slate-300 hover:bg-card hover:text-foreground'
                  )}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="bg-red-500 text-foreground text-xs rounded-full px-2 py-1">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border px-2 py-2 z-40">
          <div className="flex justify-around">
            {items.slice(0, 5).map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={cn(
                  'flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors relative',
                  currentPath === item.id
                    ? 'text-aero-orange-alert'
                    : 'text-slate-400 hover:text-foreground'
                )}
              >
                <span className="relative">
                  {item.icon}
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-foreground text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </span>
                <span className="text-xs truncate max-w-[60px]">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </ShowOnMobile>
    </>
  );
};

// Example usage component
export const ExampleNavigation: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home className="h-5 w-5" />,
      onClick: () => setCurrentView('dashboard')
    },
    {
      id: 'flights',
      label: 'Flights',
      icon: <Plane className="h-5 w-5" />,
      onClick: () => setCurrentView('flights'),
      badge: 3
    },
    {
      id: 'map',
      label: 'Map',
      icon: <MapPin className="h-5 w-5" />,
      onClick: () => setCurrentView('map')
    },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: <Bell className="h-5 w-5" />,
      onClick: () => setCurrentView('alerts'),
      badge: 12
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="h-5 w-5" />,
      onClick: () => setCurrentView('settings')
    }
  ];

  return (
    <ResponsiveNavigation
      items={navigationItems}
      currentPath={currentView}
      brand={{
        name: 'AINO Platform',
        logo: <Plane className="h-6 w-6 text-aero-orange-alert" />
      }}
    />
  );
};

export default ResponsiveNavigation;
