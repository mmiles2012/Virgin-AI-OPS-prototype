import React, { createContext, useContext, useState, useEffect } from 'react';

interface ResponsiveContextType {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  orientation: 'portrait' | 'landscape';
}

const ResponsiveContext = createContext<ResponsiveContextType | undefined>(undefined);

export const useResponsive = () => {
  const context = useContext(ResponsiveContext);
  if (!context) {
    throw new Error('useResponsive must be used within a ResponsiveProvider');
  }
  return context;
};

export const ResponsiveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getScreenSize = (width: number): 'sm' | 'md' | 'lg' | 'xl' | '2xl' => {
    if (width < 640) return 'sm';
    if (width < 768) return 'md';
    if (width < 1024) return 'lg';
    if (width < 1280) return 'xl';
    return '2xl';
  };

  const contextValue: ResponsiveContextType = {
    isMobile: dimensions.width < 768,
    isTablet: dimensions.width >= 768 && dimensions.width < 1024,
    isDesktop: dimensions.width >= 1024,
    screenSize: getScreenSize(dimensions.width),
    orientation: dimensions.width > dimensions.height ? 'landscape' : 'portrait'
  };

  return (
    <ResponsiveContext.Provider value={contextValue}>
      {children}
    </ResponsiveContext.Provider>
  );
};

// Responsive grid component
interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: string;
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  cols = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 'gap-4',
  className = ''
}) => {
  const gridClasses = [
    `grid`,
    `grid-cols-${cols.sm || 1}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    gap,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
};

// Responsive container component
interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: string;
  className?: string;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = 'xl',
  padding = 'px-4 sm:px-6 lg:px-8',
  className = ''
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-7xl',
    '2xl': 'max-w-none',
    full: 'max-w-full'
  };

  const containerClasses = [
    'mx-auto',
    maxWidthClasses[maxWidth],
    padding,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {children}
    </div>
  );
};

// Responsive show/hide components
export const ShowOnMobile: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isMobile } = useResponsive();
  return isMobile ? <>{children}</> : null;
};

export const HideOnMobile: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isMobile } = useResponsive();
  return !isMobile ? <>{children}</> : null;
};

export const ShowOnTablet: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isTablet } = useResponsive();
  return isTablet ? <>{children}</> : null;
};

export const ShowOnDesktop: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isDesktop } = useResponsive();
  return isDesktop ? <>{children}</> : null;
};

// Responsive breakpoint hook
export const useBreakpoint = () => {
  const { screenSize } = useResponsive();
  
  return {
    isXs: screenSize === 'sm',
    isSm: screenSize === 'sm',
    isMd: screenSize === 'md',
    isLg: screenSize === 'lg',
    isXl: screenSize === 'xl',
    is2Xl: screenSize === '2xl',
    screenSize
  };
};

// Mobile-first design patterns
export const MobileFirstLayout: React.FC<{
  children: React.ReactNode;
  mobileContent?: React.ReactNode;
  desktopContent?: React.ReactNode;
}> = ({ children, mobileContent, desktopContent }) => {
  const { isMobile } = useResponsive();

  if (mobileContent && isMobile) {
    return <>{mobileContent}</>;
  }

  if (desktopContent && !isMobile) {
    return <>{desktopContent}</>;
  }

  return <>{children}</>;
};

export default ResponsiveProvider;
