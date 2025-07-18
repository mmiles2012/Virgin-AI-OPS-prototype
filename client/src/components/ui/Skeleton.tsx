import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'text' | 'rounded' | 'card';
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variantClasses = {
      default: 'h-4',
      text: 'h-4 w-full',
      rounded: 'h-12 w-12 rounded-full',
      card: 'h-32 w-full rounded-lg',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'animate-pulse bg-slate-200 dark:bg-slate-800 rounded',
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

// Specific skeleton components for different UI elements
export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ 
  rows = 5, 
  cols = 4 
}) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex space-x-4">
        {Array.from({ length: cols }).map((_, j) => (
          <Skeleton key={j} className="h-6 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export const CardSkeleton: React.FC = () => (
  <div className="p-6 space-y-4 border rounded-lg bg-white dark:bg-slate-900">
    <Skeleton className="h-6 w-1/4" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-3/4" />
    <div className="flex space-x-2">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-16" />
    </div>
  </div>
);

export const ChartSkeleton: React.FC = () => (
  <div className="p-6 space-y-4 border rounded-lg bg-white dark:bg-slate-900">
    <div className="flex justify-between items-center">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-6 w-20" />
    </div>
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton 
            className="h-6" 
            style={{ width: `${Math.random() * 80 + 20}%` }}
          />
        </div>
      ))}
    </div>
  </div>
);

export const MapSkeleton: React.FC = () => (
  <div className="relative w-full h-96 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
    <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-blue-100 to-green-100 dark:from-slate-700 dark:to-slate-600" />
    <div className="absolute top-4 left-4">
      <Skeleton className="h-8 w-32" />
    </div>
    <div className="absolute top-4 right-4 space-y-2">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-6 w-20" />
    </div>
    {/* Simulate map markers */}
    {Array.from({ length: 8 }).map((_, i) => (
      <div
        key={i}
        className="absolute w-4 h-4 bg-orange-400 rounded-full animate-pulse"
        style={{
          top: `${Math.random() * 80 + 10}%`,
          left: `${Math.random() * 80 + 10}%`,
        }}
      />
    ))}
  </div>
);

export const FlightTableSkeleton: React.FC = () => (
  <div className="space-y-3">
    <div className="flex space-x-4 p-3 bg-slate-50 dark:bg-slate-800 rounded">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-16" />
    </div>
    {Array.from({ length: 10 }).map((_, i) => (
      <div key={i} className="flex space-x-4 p-3 border-b">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    ))}
  </div>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="p-6 space-y-6">
    {/* Header */}
    <div className="flex justify-between items-center">
      <Skeleton className="h-8 w-48" />
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
    
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
    
    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartSkeleton />
      <ChartSkeleton />
    </div>
    
    {/* Table */}
    <div className="border rounded-lg p-4">
      <Skeleton className="h-6 w-32 mb-4" />
      <TableSkeleton rows={8} cols={6} />
    </div>
  </div>
);

export { Skeleton };
export default Skeleton;
