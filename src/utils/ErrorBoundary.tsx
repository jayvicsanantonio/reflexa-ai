import React from 'react';
import { devError } from './logger';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: unknown): void {
    // Log non-sensitive error details for diagnostics
    try {
      devError('UI ErrorBoundary caught error:', error, errorInfo);
    } catch {
      // no-op
    }
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div role="alert" style={{ padding: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>
              Something went wrong.
            </div>
            <div style={{ fontSize: 12, color: '#475569' }}>
              Please close and reopen this view.
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
