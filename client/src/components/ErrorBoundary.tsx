import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AINO Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#1e3a8a',
            color: 'white',
            padding: '40px',
            textAlign: 'center',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            zIndex: 99999
          }}
        >
          <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>
            AINO Platform Error
          </h1>
          <p style={{ fontSize: '16px', marginBottom: '30px', color: '#bfdbfe' }}>
            The aviation platform encountered an error. Please refresh to continue.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#ef4444',
              color: 'white',
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