import React from 'react';
import { cn } from '../../lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'dots' | 'pulse' | 'bars' | 'aviation';
  className?: string;
  color?: 'blue' | 'orange' | 'white' | 'gray';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  className,
  color = 'blue'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    blue: 'text-blue-600',
    orange: 'text-orange-500',
    white: 'text-white',
    gray: 'text-gray-400'
  };

  if (variant === 'default') {
    return (
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-current border-t-transparent',
          sizeClasses[size],
          colorClasses[color],
          className
        )}
      />
    );
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex space-x-1', className)}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'rounded-full animate-pulse',
              size === 'sm' && 'w-1 h-1',
              size === 'md' && 'w-2 h-2',
              size === 'lg' && 'w-3 h-3',
              size === 'xl' && 'w-4 h-4',
              colorClasses[color].replace('text-', 'bg-')
            )}
            style={{
              animationDelay: `${i * 0.2}s`,
              animationDuration: '1s'
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div
        className={cn(
          'rounded-full animate-pulse',
          sizeClasses[size],
          colorClasses[color].replace('text-', 'bg-'),
          className
        )}
      />
    );
  }

  if (variant === 'bars') {
    return (
      <div className={cn('flex items-end space-x-1', className)}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              'animate-pulse',
              size === 'sm' && 'w-1 h-2',
              size === 'md' && 'w-1 h-4',
              size === 'lg' && 'w-2 h-6',
              size === 'xl' && 'w-2 h-8',
              colorClasses[color].replace('text-', 'bg-')
            )}
            style={{
              animationDelay: `${i * 0.15}s`,
              animationDuration: '1.2s'
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'aviation') {
    return (
      <div className={cn('relative', sizeClasses[size], className)}>
        {/* Radar sweep animation */}
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-current opacity-30" />
        <div className="absolute inset-0 rounded-full border-2 border-current border-t-transparent animate-spin" />
        <div className="absolute inset-2 rounded-full border border-current border-r-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '3s' }} />
        <div className={cn(
          'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full',
          size === 'sm' && 'w-1 h-1',
          size === 'md' && 'w-1.5 h-1.5',
          size === 'lg' && 'w-2 h-2',
          size === 'xl' && 'w-3 h-3',
          colorClasses[color].replace('text-', 'bg-'),
          'animate-pulse'
        )} />
      </div>
    );
  }

  return null;
};

interface LoadingStateProps {
  loading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  overlay?: boolean;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  loading,
  children,
  fallback,
  overlay = false,
  className
}) => {
  if (!loading) {
    return <>{children}</>;
  }

  const defaultFallback = (
    <div className="flex items-center justify-center p-8">
      <LoadingSpinner variant="aviation" size="lg" />
    </div>
  );

  if (overlay) {
    return (
      <div className={cn('relative', className)}>
        {children}
        <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-10">
          {fallback || defaultFallback}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {fallback || defaultFallback}
    </div>
  );
};

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: React.ReactNode;
  loadingText?: string;
  variant?: 'default' | 'primary' | 'secondary' | 'ghost';
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  children,
  loadingText = 'Loading...',
  variant = 'default',
  className,
  disabled,
  ...props
}) => {
  const variantClasses = {
    default: 'bg-gray-100 hover:bg-gray-200 text-gray-900',
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-orange-500 hover:bg-orange-600 text-white',
    ghost: 'hover:bg-gray-100 text-gray-700'
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <LoadingSpinner 
          size="sm" 
          color={variant === 'primary' || variant === 'secondary' ? 'white' : 'gray'} 
          className="mr-2" 
        />
      )}
      {loading ? loadingText : children}
    </button>
  );
};

interface FullPageLoadingProps {
  message?: string;
  submessage?: string;
}

export const FullPageLoading: React.FC<FullPageLoadingProps> = ({
  message = 'Loading AINO Platform...',
  submessage = 'Initializing aviation intelligence systems'
}) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 flex items-center justify-center p-4">
    <div className="text-center space-y-6">
      <div className="mx-auto">
        <LoadingSpinner variant="aviation" size="xl" color="orange" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-white">{message}</h2>
        <p className="text-slate-300">{submessage}</p>
      </div>
      <div className="flex justify-center">
        <LoadingSpinner variant="dots" color="white" />
      </div>
    </div>
  </div>
);

export default LoadingSpinner;
