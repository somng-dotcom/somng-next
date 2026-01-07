'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error Boundary Component
 * 
 * Catches React errors in the component tree and displays a fallback UI
 * instead of crashing the entire application.
 * 
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error caught by ErrorBoundary:', error, errorInfo);
        
        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
        
        // TODO: Send to error tracking service (e.g., Sentry)
        // if (typeof window !== 'undefined' && window.Sentry) {
        //     window.Sentry.captureException(error, { contexts: { react: errorInfo } });
        // }
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                    <div className="text-center max-w-md w-full">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                            <span className="material-symbols-outlined text-3xl text-red-600 dark:text-red-400">
                                error
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Something went wrong
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                            {this.state.error?.message || 'An unexpected error occurred'}
                        </p>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <pre className="text-xs text-left bg-gray-100 dark:bg-gray-800 p-4 rounded mt-4 overflow-auto">
                                {this.state.error.stack}
                            </pre>
                        )}
                        <div className="mt-6 flex gap-3 justify-center">
                            <Button onClick={this.handleReset} variant="primary">
                                Reload Page
                            </Button>
                            <Button 
                                onClick={() => window.history.back()} 
                                variant="outline"
                            >
                                Go Back
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

