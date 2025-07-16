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
        'virgin-primary': 'bg-gradient-to-r from-va-red-primary to-va-red-heritage text-white hover:shadow-va-glow hover:-translate-y-0.5 active:translate-y-0 hover:from-va-red-heritage hover:to-va-red-primary',
        
        // Standard Primary - Less vibrant for secondary actions
        primary: 'bg-aero-blue-primary text-white hover:bg-aero-blue-light hover:shadow-aero-glow hover:-translate-y-0.5 active:translate-y-0',
        
        // Aviation Secondary - Blue
        secondary: 'bg-aero-blue-primary text-white hover:bg-aero-blue-light hover:shadow-aero-glow hover:-translate-y-0.5 active:translate-y-0',
        
        // Safe/Success - Green
        success: 'bg-aero-green-safe text-white hover:bg-aero-green-light hover:shadow-lg',
        
        // Caution/Warning - Amber
        warning: 'bg-aero-amber-caution text-white hover:bg-aero-amber-light hover:shadow-lg',
        
        // Critical/Destructive - Red (for actual errors/destruction)
        destructive: 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg',
        
        // Premium/Special - Purple
        premium: 'bg-aero-purple-premium text-white hover:opacity-90 hover:shadow-lg',
        
        // Outline variants
        outline: 'border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground',
        'outline-secondary': 'border-2 border-va-blue bg-transparent text-va-blue hover:bg-va-blue hover:text-va-cloud-white',
        
        // Ghost variants
        ghost: 'bg-transparent text-foreground hover:bg-muted hover:text-accent-foreground',
        'ghost-red': 'bg-transparent text-va-red hover:bg-va-red/10',
        'ghost-blue': 'bg-transparent text-va-blue hover:bg-va-blue/10',
        
        // Muted/Disabled look
        muted: 'bg-surface-secondary text-muted-foreground hover:bg-surface-tertiary',
        muted: 'bg-va-gray/10 text-va-gray hover:bg-va-gray/20',
        
        // Emergency/Alert - Animated
        emergency: 'bg-gradient-to-r from-va-red-primary to-va-red-rebel text-white animate-pulse-emergency shadow-va-glow',
        emergency: 'bg-gradient-va-red text-va-cloud-white animate-pulse-emergency shadow-va-glow',
      },
      size: {
        sm: 'h-9 rounded-md px-3 text-xs',
        default: 'h-10 px-4 py-2',
        lg: 'h-11 rounded-md px-8 text-base',
        xl: 'h-12 rounded-md px-10 text-lg',
        icon: 'h-10 w-10',
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
    VariantProps<typeof buttonVariants> {}

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

// Status Badge Component
const statusBadgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all duration-200',
  {
    variants: {
      variant: {
        safe: 'bg-aero-green-safe/20 text-aero-green-safe border border-aero-green-safe/30',
        caution: 'bg-aero-amber-caution/20 text-aero-amber-caution border border-aero-amber-caution/30',
        critical: 'bg-va-red-primary/20 text-va-red-primary border border-va-red-primary/30',
        info: 'bg-aero-blue-primary/20 text-aero-blue-primary border border-aero-blue-primary/30',
        premium: 'bg-aero-purple-premium/20 text-aero-purple-premium border border-aero-purple-premium/30',
        muted: 'bg-surface-secondary text-muted-foreground border border-surface-tertiary',
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
    <span className={cn(statusBadgeVariants({ variant, size }), className)}>
      {children}
    </span>
  );
};

// Card Component with Virgin Atlantic styling
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
  hover = true,
}) => {
  const baseClasses = 'rounded-lg border transition-all duration-300';
  
  const variantClasses = {
    default: 'bg-card text-card-foreground shadow-va-sm',
    aviation: 'aviation-panel shadow-va-md',
    glass: 'glass-panel shadow-va-lg',
    cockpit: 'cockpit-display shadow-va-xl',
  };

  const hoverClasses = hover ? 'hover:shadow-va-lg hover:-translate-y-1' : '';

  return (
    <div className={cn(baseClasses, variantClasses[variant], hoverClasses, className)}>
      {children}
    </div>
  );
};

// Typography Components
interface TypographyProps {
  children: React.ReactNode;
  className?: string;
}

const VAHeading = {
  H1: ({ children, className }: TypographyProps) => (
    <h1 className={cn('va-heading-xl text-foreground', className)}>
      {children}
    </h1>
  ),
  H2: ({ children, className }: TypographyProps) => (
    <h2 className={cn('va-heading-lg text-foreground', className)}>
      {children}
    </h2>
  ),
  H3: ({ children, className }: TypographyProps) => (
    <h3 className={cn('va-heading-md text-foreground', className)}>
      {children}
    </h3>
  ),
  H4: ({ children, className }: TypographyProps) => (
    <h4 className={cn('va-heading-sm text-foreground', className)}>
      {children}
    </h4>
  ),
};

const VAText = {
  Body: ({ children, className }: TypographyProps) => (
    <p className={cn('va-body-md text-foreground', className)}>
      {children}
    </p>
  ),
  Large: ({ children, className }: TypographyProps) => (
    <p className={cn('va-body-lg text-foreground', className)}>
      {children}
    </p>
  ),
  Small: ({ children, className }: TypographyProps) => (
    <p className={cn('va-body-sm text-muted-foreground', className)}>
      {children}
    </p>
  ),
  Label: ({ children, className }: TypographyProps) => (
    <label className={cn('va-label text-foreground', className)}>
      {children}
    </label>
  ),
  Caption: ({ children, className }: TypographyProps) => (
    <span className={cn('va-caption', className)}>
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
