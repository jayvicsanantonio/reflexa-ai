/**
 * ErrorBoundary Component
 *
 * A React error boundary that catches JavaScript errors in child components
 * and displays a fallback UI. Integrates with ErrorService for standardized
 * error handling and logging.
 *
 * Features:
 * - Catches errors in child component tree
 * - Displays user-friendly fallback UI
 * - Provides retry action for recoverable errors
 * - Logs errors with appropriate severity via ErrorService
 *
 * Requirements: 7.1, 7.2, 7.3
 *
 * @example
 * ```tsx
 * <ErrorBoundary
 *   fallback={<CustomFallback />}
 *   onError={(error, errorInfo) => console.log(error)}
 *   onRetry={() => window.location.reload()}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */

import React, { type ErrorInfo, type ReactNode } from 'react';
import { errorService } from '../background/services/error/ErrorService';
import { type StandardError } from '../background/services/error/interfaces';

/**
 * Props for the ErrorBoundary component.
 */
export interface ErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;
  /** Custom fallback UI to display when an error occurs */
  fallback?: ReactNode;
  /** Callback fired when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Callback fired when the retry button is clicked */
  onRetry?: () => void;
}

/**
 * State for the ErrorBoundary component.
 */
export interface ErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean;
  /** The standardized error object, if any */
  standardError: StandardError | null;
  /** The original error that was caught */
  originalError: Error | null;
}

/**
 * Default fallback UI styles
 */
const styles = {
  container: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  } as React.CSSProperties,
  title: {
    fontWeight: 600,
    fontSize: 14,
    color: '#991b1b',
    marginBottom: 8,
  } as React.CSSProperties,
  message: {
    fontSize: 13,
    color: '#7f1d1d',
    marginBottom: 12,
  } as React.CSSProperties,
  suggestions: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 12,
    paddingLeft: 16,
  } as React.CSSProperties,
  suggestionItem: {
    marginBottom: 4,
  } as React.CSSProperties,
  retryButton: {
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 500,
    color: '#ffffff',
    backgroundColor: '#3b82f6',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  } as React.CSSProperties,
  retryButtonHover: {
    backgroundColor: '#2563eb',
  } as React.CSSProperties,
};

/**
 * React Error Boundary component that catches JavaScript errors in child
 * components and displays a fallback UI.
 *
 * Integrates with ErrorService for:
 * - Standardized error creation
 * - User-friendly error formatting
 * - Error logging with severity levels
 * - Recovery suggestions for recoverable errors
 *
 * **Validates: Requirements 7.1, 7.2, 7.3**
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      standardError: null,
      originalError: null,
    };
  }

  /**
   * Static lifecycle method called when an error is thrown in a descendant component.
   * Updates state to trigger fallback UI rendering.
   *
   * @param error - The error that was thrown
   * @returns New state with hasError set to true
   *
   * **Validates: Requirements 7.1**
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Create standardized error using ErrorService
    const standardError = errorService.fromUnknown(error, {
      operation: 'component-render',
    });

    return {
      hasError: true,
      standardError,
      originalError: error,
    };
  }

  /**
   * Lifecycle method called after an error has been thrown by a descendant component.
   * Used for logging error details.
   *
   * @param error - The error that was thrown
   * @param errorInfo - React error info with component stack
   *
   * **Validates: Requirements 7.2**
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Create or update standardized error with component stack info
    const standardError = errorService.fromUnknown(error, {
      operation: 'component-render',
      metadata: {
        componentStack: errorInfo.componentStack,
      },
    });

    // Log the error using ErrorService
    errorService.log(standardError);

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Handles the retry button click.
   * Resets the error state and calls the onRetry callback if provided.
   */
  handleRetry = (): void => {
    this.setState({
      hasError: false,
      standardError: null,
      originalError: null,
    });

    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  /**
   * Renders the default fallback UI with error message and optional retry button.
   *
   * @returns The fallback UI element
   *
   * **Validates: Requirements 7.3**
   */
  renderDefaultFallback(): ReactNode {
    const { standardError } = this.state;
    const isRecoverable = standardError
      ? errorService.isRecoverable(standardError)
      : false;
    const suggestions = standardError
      ? errorService.getSuggestions(standardError)
      : [];
    const userMessage = standardError
      ? errorService.formatForUser(standardError)
      : 'Something went wrong.';

    return (
      <div
        role="alert"
        style={styles.container}
        data-testid="error-boundary-fallback"
      >
        <div style={styles.title}>Something went wrong</div>
        <div style={styles.message}>{userMessage}</div>

        {suggestions.length > 0 && (
          <ul style={styles.suggestions}>
            {suggestions.map((suggestion, index) => (
              <li key={index} style={styles.suggestionItem}>
                {suggestion}
              </li>
            ))}
          </ul>
        )}

        {isRecoverable && (
          <button
            type="button"
            onClick={this.handleRetry}
            style={styles.retryButton}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor =
                styles.retryButtonHover.backgroundColor!;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor =
                styles.retryButton.backgroundColor!;
            }}
            data-testid="error-boundary-retry"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided, otherwise use default
      return this.props.fallback ?? this.renderDefaultFallback();
    }

    return this.props.children;
  }
}
