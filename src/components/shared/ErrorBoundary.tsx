import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6 bg-cream-50/50">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full text-center shadow-lg border border-earth-200">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-forest-900 mb-2">Something went wrong</h2>
            <p className="text-sm text-earth-600 mb-6">
              An error occurred while displaying this page.
              {this.state.error?.message && (
                <span className="block mt-2 text-xs font-mono text-red-600 bg-red-50 p-2 rounded-lg border border-red-200 truncate">
                  {this.state.error.message}
                </span>
              )}
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
              >
                <RefreshCw className="w-4 h-4 mr-1.5" /> Reload Page
              </Button>
              <Button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/';
                }}
              >
                <Home className="w-4 h-4 mr-1.5" /> Return Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
