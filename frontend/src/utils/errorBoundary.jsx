import React from 'react';

/**
 * Error Boundary Component
 * Catches unhandled React errors in components
 * Shows safe fallback UI instead of blank screen
 * Logs errors only in development mode
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
      errorCount: this.state.errorCount + 1
    });

    // Log only in development
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Error Boundary Caught:', error);
      console.error('Error Info:', errorInfo);
    }

    // Log error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: send to Sentry, DataDog, or your monitoring service
      try {
        // Example API call to log error
        fetch('/api/v1/debug/log-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: error.toString(),
            stack: errorInfo?.componentStack,
            timestamp: new Date().toISOString(),
            component: this.props.name || 'UnknownComponent'
          })
        }).catch(err => console.error('Failed to log error:', err));
      } catch (logErr) {
        // Silently fail - don't crash the app trying to log an error
      }
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
            {/* Error Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">⚠️</span>
              </div>
            </div>

            {/* Error Message */}
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
              Something went wrong
            </h2>

            <p className="text-gray-600 text-center mb-6">
              We encountered an error loading this record. This has been reported and our team has been notified.
            </p>

            {/* Development Error Details */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-red-50 border border-red-200 rounded p-4 mb-6 text-xs">
                <p className="font-mono font-bold text-red-800 mb-2">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="text-red-700">
                    <summary className="cursor-pointer hover:text-red-900">
                      Stack trace
                    </summary>
                    <pre className="mt-2 overflow-auto text-xs">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={this.resetError}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded transition"
              >
                Go Home
              </button>
            </div>

            {/* Error ID for support */}
            <p className="text-center text-sm text-gray-400 mt-4">
              Error ID: {Math.random().toString(36).substr(2, 9)}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
