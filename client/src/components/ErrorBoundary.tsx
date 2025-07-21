import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  level?: 'page' | 'component';
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return { 
      hasError: true, 
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.group('🚨 AINO Error Boundary');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();

    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
    }
  }

  retry = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      errorId: ''
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} retry={this.retry} />;
      }

      // Default error UI based on level
      if (this.props.level === 'component') {
        return (
          <div className="border border-red-200 bg-red-50 dark:bg-va-red-primary/10 dark:border-red-800 rounded-lg p-4 m-4">
            <div className="flex items-center space-x-2 text-red-800 dark:text-red-200">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-sm font-medium">Component Error</h3>
            </div>
            <p className="text-sm text-red-700 dark:text-red-300 mt-2">
              This component encountered an error and couldn't load properly.
            </p>
            <button
              onClick={this.retry}
              className="mt-3 inline-flex items-center space-x-1 text-sm text-red-800 dark:text-red-200 hover:text-red-900 dark:hover:text-red-100"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Try again</span>
            </button>
          </div>
        );
      }

      // Full page error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 text-foreground flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="space-y-2">
              <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-va-red-primary" />
              </div>
              <h1 className="text-2xl font-bold">AINO Platform Error</h1>
              <p className="text-slate-300">
                The aviation intelligence platform encountered an unexpected error.
              </p>
            </div>

            <div className="bg-card/50 rounded-lg p-4 text-left">
              <div className="flex items-center space-x-2 text-slate-400 mb-2">
                <Bug className="h-4 w-4" />
                <span className="text-sm font-mono">Error ID: {this.state.errorId}</span>
              </div>
              {this.state.error && (
                <div className="text-sm text-slate-300 font-mono bg-card/50 p-2 rounded">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.retry}
                className="flex-1 inline-flex items-center justify-center space-x-2 bg-aero-blue-primary hover:bg-aero-blue-light px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Try Again</span>
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 inline-flex items-center justify-center space-x-2 bg-slate-600 hover:bg-muted px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Home className="h-4 w-4" />
                <span>Go Home</span>
              </button>
            </div>

            <details className="text-left text-sm text-slate-400">
              <summary className="cursor-pointer hover:text-slate-300">
                Technical Details
              </summary>
              <div className="mt-2 p-3 bg-card/50 rounded text-xs font-mono overflow-auto">
                <div><strong>Timestamp:</strong> {new Date().toISOString()}</div>
                <div><strong>User Agent:</strong> {navigator.userAgent}</div>
                <div><strong>URL:</strong> {window.location.href}</div>
                {this.state.error?.stack && (
                  <div className="mt-2">
                    <strong>Stack Trace:</strong>
                    <pre className="whitespace-pre-wrap mt-1">{this.state.error.stack}</pre>
                  </div>
                )}
              </div>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Component error boundary for smaller components
export const ComponentErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary level="component">
    {children}
  </ErrorBoundary>
);

export default ErrorBoundary;
              border: 'none',
              borderRadius: '6px',
              padding: '15px 30px',
              fontSize: '16px',
              cursor: 'pointer',
              touchAction: 'manipulation'
            }}
          >
            Refresh Platform
          </button>
          {this.state.error && (
            <details style={{ marginTop: '30px', textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>
                Technical Details
              </summary>
              <pre style={{ 
                backgroundColor: 'rgba(0,0,0,0.5)', 
                padding: '10px', 
                borderRadius: '4px',
                fontSize: '12px',
                overflow: 'auto'
              }}>
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;