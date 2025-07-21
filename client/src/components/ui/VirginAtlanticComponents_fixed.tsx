import React from 'react';
import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // Virgin Atlantic Branded Primary - Signature Red
        'virgin-primary': 'bg-gradient-to-r from-va-red-primary to-va-red-heritage text-va-white hover:shadow-va-glow hover:-translate-y-0.5 active:translate-y-0 hover:from-va-red-heritage hover:to-va-red-primary',
        
        // Standard Primary - Aviation Blue for secondary actions
        primary: 'bg-aero-blue-primary text-va-white hover:bg-aero-blue-light hover:shadow-aero-glow hover:-translate-y-0.5 active:translate-y-0',
        
        // Aviation Secondary - Blue
        secondary: 'bg-aero-blue-primary text-va-white hover:bg-aero-blue-light hover:shadow-aero-glow hover:-translate-y-0.5 active:translate-y-0',
        
        // Safe/Success - Green
        success: 'bg-aero-green-safe text-va-white hover:bg-aero-green-light hover:shadow-lg',
        
        // Caution/Warning - Amber
        warning: 'bg-aero-amber-caution text-va-white hover:bg-aero-amber-light hover:shadow-lg',
        
        // Critical/Destructive - Virgin Red for errors
        destructive: 'bg-va-red-primary text-va-white hover:bg-va-red-heritage hover:shadow-lg',
        
        // Premium/Special - Purple
        premium: 'bg-aero-purple-premium text-va-white hover:opacity-90 hover:shadow-lg',
        
        // Outline variants - Accessible with proper contrast
        outline: 'border-2 border-aero-blue-primary bg-background text-aero-blue-primary hover:bg-aero-blue-primary hover:text-va-white',
        'outline-secondary': 'border-2 border-va-red-primary bg-background text-va-red-primary hover:bg-va-red-primary hover:text-va-white',
        
        // Ghost variants - Light backgrounds for accessibility
        ghost: 'bg-transparent text-foreground hover:bg-muted hover:text-accent-foreground',
        'ghost-red': 'bg-transparent text-va-red-primary hover:bg-va-red-primary/10 hover:text-va-red-heritage',
        'ghost-blue': 'bg-transparent text-aero-blue-primary hover:bg-aero-blue-primary/10 hover:text-aero-blue-dark',
        
        // Muted/Disabled look - Proper contrast
        muted: 'bg-muted text-muted-foreground hover:bg-muted/80',
        
        // Emergency/Alert - Animated with proper accessibility
        emergency: 'bg-gradient-to-r from-va-red-primary to-va-red-rebel text-va-white animate-pulse-emergency shadow-va-glow font-bold',
      },
      size: {
        sm: 'h-9 rounded-md px-3 text-xs min-w-[44px]', // WCAG touch target compliance
        default: 'h-10 px-4 py-2 min-w-[44px]',
        lg: 'h-11 rounded-md px-8 text-base min-w-[44px]',
        xl: 'h-12 rounded-md px-10 text-lg min-w-[44px]',
        icon: 'h-10 w-10 min-w-[44px] min-h-[44px]', // Accessible touch target
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const VirginAtlanticButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

VirginAtlanticButton.displayName = 'VirginAtlanticButton';

// Status Badge Component - Accessible and consistent
const statusBadgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all duration-200 border',
  {
    variants: {
      variant: {
        safe: 'bg-aero-green-safe/10 text-aero-green-safe border-aero-green-safe/30 hover:bg-aero-green-safe/20',
        caution: 'bg-aero-amber-caution/10 text-aero-amber-caution border-aero-amber-caution/30 hover:bg-aero-amber-caution/20',
        critical: 'bg-va-red-primary/10 text-va-red-primary border-va-red-primary/30 hover:bg-va-red-primary/20',
        info: 'bg-aero-blue-primary/10 text-aero-blue-primary border-aero-blue-primary/30 hover:bg-aero-blue-primary/20',
        premium: 'bg-aero-purple-premium/10 text-aero-purple-premium border-aero-purple-premium/30 hover:bg-aero-purple-premium/20',
        muted: 'bg-muted text-muted-foreground border-border hover:bg-muted/80',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        default: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'info',
      size: 'default',
    },
  }
);

interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  children: React.ReactNode;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  children, 
  variant, 
  size, 
  className 
}) => {
  return (
    <span className={cn(statusBadgeVariants({ variant, size, className }))}>
      {children}
    </span>
  );
};

// Card Component with Virgin Atlantic styling - Responsive and accessible
interface VirginAtlanticCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'aviation' | 'glass' | 'cockpit';
  hover?: boolean;
}

const VirginAtlanticCard: React.FC<VirginAtlanticCardProps> = ({
  children,
  className,
  variant = 'default',
  hover = false,
}) => {
  const baseClasses = 'rounded-lg border transition-all duration-200 p-4 sm:p-6'; // Responsive padding
  
  const variantClasses = {
    default: 'bg-card text-card-foreground shadow-va-sm border-border',
    aviation: 'bg-card text-card-foreground shadow-va-md border-aero-blue-primary/20',
    glass: 'bg-card/80 backdrop-blur text-card-foreground shadow-va-lg border-border/50',
    cockpit: 'bg-surface-secondary text-va-white shadow-va-xl border-surface-tertiary',
  };

  const hoverClasses = hover ? 'hover:shadow-va-lg hover:-translate-y-1 cursor-pointer' : '';

  return (
    <div className={cn(baseClasses, variantClasses[variant], hoverClasses, className)}>
      {children}
    </div>
  );
};

// Typography Components - Responsive and accessible
interface TypographyProps {
  children: React.ReactNode;
  className?: string;
}

const VAHeading = {
  H1: ({ children, className }: TypographyProps) => (
    <h1 className={cn('text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground', className)}>
      {children}
    </h1>
  ),
  H2: ({ children, className }: TypographyProps) => (
    <h2 className={cn('text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground', className)}>
      {children}
    </h2>
  ),
  H3: ({ children, className }: TypographyProps) => (
    <h3 className={cn('text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight text-foreground', className)}>
      {children}
    </h3>
  ),
  H4: ({ children, className }: TypographyProps) => (
    <h4 className={cn('text-base sm:text-lg lg:text-xl font-semibold tracking-tight text-foreground', className)}>
      {children}
    </h4>
  ),
};

const VAText = {
  Body: ({ children, className }: TypographyProps) => (
    <p className={cn('text-sm sm:text-base leading-relaxed text-foreground', className)}>
      {children}
    </p>
  ),
  Small: ({ children, className }: TypographyProps) => (
    <span className={cn('text-xs sm:text-sm text-muted-foreground', className)}>
      {children}
    </span>
  ),
  Label: ({ children, className }: TypographyProps) => (
    <label className={cn('text-sm font-medium text-foreground', className)}>
      {children}
    </label>
  ),
  Caption: ({ children, className }: TypographyProps) => (
    <span className={cn('text-xs text-muted-foreground', className)}>
      {children}
    </span>
  ),
};

export {
  VirginAtlanticButton,
  StatusBadge,
  VirginAtlanticCard,
  VAHeading,
  VAText,
  buttonVariants,
  statusBadgeVariants,
};
