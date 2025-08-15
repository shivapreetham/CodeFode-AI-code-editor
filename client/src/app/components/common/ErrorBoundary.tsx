import React, { Component, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call onError prop if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error}
          resetErrorBoundary={this.resetErrorBoundary}
        />
      );
    }

    return this.props.children;
  }
}

// Default Error Fallback Component
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-surface-light dark:bg-surface-dark p-4">
      <div className="card max-w-lg mx-auto p-6 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-error-light rounded-full flex items-center justify-center mx-auto mb-4">
            <svg 
              className="w-8 h-8 text-error" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-error mb-2">
            Something went wrong
          </h1>
          <p className="text-secondary-theme mb-4">
            An unexpected error occurred. Please try again or contact support if the problem persists.
          </p>
        </div>
        
        <div className="bg-surface dark:bg-surface-darker p-4 rounded-lg mb-6 text-left">
          <h3 className="font-semibold text-primary-theme mb-2">Error Details:</h3>
          <pre className="text-sm text-secondary-theme font-mono bg-secondary-100 dark:bg-secondary-800 p-3 rounded overflow-auto max-h-32">
            {error.message}
          </pre>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={resetErrorBoundary}
            className="btn-primary flex-1 px-4 py-2 rounded-lg font-medium"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="btn-outline flex-1 px-4 py-2 rounded-lg font-medium"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook for functional components to access error boundary features
export const useErrorHandler = () => {
  const handleError = (error: Error, errorInfo?: any) => {
    console.error('Handled error:', error, errorInfo);
    
    // You can integrate with error reporting services here
    // Example: Sentry.captureException(error);
    
    // Show user-friendly error message
    if (typeof window !== 'undefined') {
      const toast = (window as any).toast;
      if (toast) {
        toast.error('An error occurred. Please try again.');
      }
    }
  };

  return { handleError };
};

export default ErrorBoundary;
export type { ErrorBoundaryProps, ErrorFallbackProps };